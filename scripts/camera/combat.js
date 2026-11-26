// Pure shot selection. No camera or document mutations.
export function eligibleTargetUsers(users,actor,sceneId,observerId){
 const available=users.filter(u=>u.active&&u.id!==observerId&&(!u.viewedScene||u.viewedScene===sceneId));
 const owners=available.filter(u=>!u.isGM&&actor?.testUserPermission?.(u,"OWNER"));
 return owners.length?owners:available.filter(u=>u.isGM);
}
export function currentActorToken(encounter,sceneId,visibleCombat){
 const c=encounter?.combatant;
 if(!c||c.hidden)return null;
 const ownScene=c.sceneId??c.scene?.id??c.token?.parent?.id;
 if(ownScene&&ownScene!==sceneId)return null;
 return visibleCombat.find(t=>t.id===c.tokenId)??null;
}
const sorted=ids=>[...new Set(ids)].sort();
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
/**
 * Turn-local target additions only. Old target selections are baselined on
 * turn entry. A settled target set changes after debounce and minimum dwell.
 */
export function createCombatDirector({establishMs=2000,settleMs=400,dwellMs=1200}={}){
 let encounterKey=null,turnKey=null,startedAt=0,previous=new Map(),fresh=new Map();
 let pending=[],committed=[],pendingAt=0,lastChange=0;
 function reset(){encounterKey=null;turnKey=null;previous.clear();fresh.clear();pending=[];committed=[];}
 function select({encounter,turn,actorId,visiblePoints,combatPoints,userTargets,now}){
  if(encounter!==encounterKey){reset();encounterKey=encounter;startedAt=now;}
  const snapshots=new Map(userTargets.map(u=>[u.id,new Set(u.targets)]));
  if(turn!==turnKey){
   turnKey=turn;previous=snapshots;fresh=new Map();pending=[];committed=[];pendingAt=now;lastChange=now;
  }else{
   for(const [id,ids] of snapshots){
    const before=previous.get(id)??ids;
    const tracked=fresh.get(id)??new Set();
    for(const t of tracked)if(!ids.has(t))tracked.delete(t);
    for(const t of ids)if(!before.has(t))tracked.add(t);
    fresh.set(id,tracked);
   }
   for(const id of fresh.keys())if(!snapshots.has(id))fresh.delete(id);
   previous=snapshots;
  }
  const visible=new Map(visiblePoints.map(p=>[p.id,p]));
  const actor=visible.get(actorId);
  const desired=sorted([...fresh.values()].flatMap(s=>[...s]).filter(id=>id!==actorId&&visible.has(id)));
  // Drop invisible targets immediately, even during the dwell period.
  committed=committed.filter(id=>visible.has(id)&&id!==actorId);
  if(!same(desired,pending)){pending=desired;pendingAt=now;}
  if(!same(pending,committed)&&now-pendingAt>=settleMs&&now-lastChange>=dwellMs){
   committed=[...pending];lastChange=now;
  }
  if(now-startedAt<establishMs||!actor)return {kind:"tactical",points:combatPoints};
  return {kind:"cinematic",points:[actor,...committed.map(id=>visible.get(id)).filter(Boolean)]};
 }
 return {reset,select};
}
