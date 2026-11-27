// Explicit allowlist: no NPCs, hidden tokens, private rolls, raw documents or images.
export const API_VERSION=1;
const finite=v=>typeof v==="number"&&Number.isFinite(v);
export function characterState({actor,token,user,combatant,active=false,approved=false}){
 if(!actor||!user||user.isGM||actor.type!=="character"||!actor.hasPlayerOwner||!actor.testUserPermission?.(user,"OBSERVER")||(!approved&&(!token||token.document?.hidden!==false||token.isVisible!==true)))return null;
 const hp=actor.system?.attributes?.hp;
 const health=finite(hp?.value)&&finite(hp?.max)&&hp.max>0?{value:Math.max(0,hp.value),max:hp.max,temp:finite(hp.temp)?Math.max(0,hp.temp):null}:null;
 const result={actorId:actor.id,actorUuid:actor.uuid,tokenId:token?.id??null,name:actor.name,health,inCombat:!!combatant,activeTurn:!!combatant&&active};
 return result;
}
export function combatState(encounter,sceneId,tokens){
 if(!encounter?.started||!encounter.isActive||!sceneId)return {active:false,round:null,activeActorId:null,combatants:new Map()};
 const scene=encounter.scene?.id??(typeof encounter.scene==="string"?encounter.scene:null);
 if(scene&&scene!==sceneId)return {active:false,round:null,activeActorId:null,combatants:new Map()};
 const ids=new Set(tokens.map(t=>t.id)),combatants=new Map();
 let sameScene=false;
 for(const c of encounter.combatants??[]){
  const s=c.sceneId??c.scene?.id??c.token?.parent?.id;
  if(s&&s!==sceneId)continue;
  if(ids.has(c.tokenId))sameScene=true;
  if(c.hidden||!ids.has(c.tokenId))continue;
  combatants.set(c.tokenId,c);
 }
 if(!scene&&!sameScene)return {active:false,round:null,activeActorId:null,combatants:new Map()};
 return {active:true,round:finite(encounter.round)?encounter.round:null,activeActorId:null,combatants};
}
export function buildSnapshot({system,sceneId,tokens,user,encounter,mode,healthEnabled,roster=null,actors=[]}){
 const combat=combatState(encounter,sceneId,tokens);
 const characters=[];
 const approved=Array.isArray(roster)?new Set(roster):null;
 for(const token of tokens){
  const c=combat.combatants.get(token.id);
  const actor=token.actor;
  const row=characterState({actor,token,user,combatant:c,active:!!c&&c.id===encounter?.combatant?.id});
  if(!row||(approved&&!approved.has(row.actorUuid)))continue;
  if(!healthEnabled)row.health=null;
  characters.push(row);
 }
 if(approved){
  for(const actor of actors){
   if(!approved.has(actor.uuid)||characters.some(c=>c.actorUuid===actor.uuid))continue;
   const row=characterState({actor,user,approved:true});
   if(row){if(!healthEnabled)row.health=null;characters.push(row);}
  }
 }
 characters.sort((a,b)=>String(a.actorUuid).localeCompare(String(b.actorUuid))||String(a.tokenId).localeCompare(String(b.tokenId)));
 return {apiVersion:API_VERSION,available:true,system,sceneId,mode,combat:{active:combat.active,round:combat.round,activeActorId:characters.find(c=>c.activeTurn)?.actorId??null},characters};
}
export function unavailable(){return {apiVersion:API_VERSION,available:false,system:null,sceneId:null,mode:null,combat:{active:false,round:null,activeActorId:null},characters:[]};}

// GM source is deliberately separate from the observer policy. Only explicitly
// approved world actors are exported; combat data comes from non-hidden linked
// character tokens in the active encounter, not from the GM's viewed canvas.
export function buildGMSnapshot({user,enabled,system,mode,actors=[],roster=[],encounter,healthEnabled}){
 if(!user?.isGM||!enabled)return unavailable();
 const approved=new Set(Array.isArray(roster)?roster:[]);
 const active=!!encounter?.started&&!!encounter?.isActive;
 const characters=[];
 for(const actor of actors){
  if(!approved.has(actor.uuid)||actor.type!=="character"||!actor.hasPlayerOwner)continue;
  const hp=actor.system?.attributes?.hp;
  const health=healthEnabled&&finite(hp?.value)&&finite(hp?.max)&&hp.max>0?{value:Math.max(0,hp.value),max:hp.max,temp:finite(hp.temp)?Math.max(0,hp.temp):null}:null;
  const eligible=active?Array.from(encounter.combatants??[]).filter(c=>c.hidden===false&&c.token?.hidden===false&&c.token?.actorLink===true&&c.actor?.uuid===actor.uuid):[];
  const turn=eligible.some(c=>c.id===encounter.combatant?.id);
  characters.push({actorId:actor.id,actorUuid:actor.uuid,tokenId:null,name:actor.name,health,inCombat:eligible.length>0,activeTurn:turn});
 }
 characters.sort((a,b)=>a.actorUuid.localeCompare(b.actorUuid));
 // Do not export scene identifiers, enemy turns, or hidden-only encounters.
 const publicCombat=characters.some(c=>c.inCombat);
 return {apiVersion:API_VERSION,available:true,system,sceneId:null,mode,combat:{active:publicCombat,round:publicCombat&&finite(encounter.round)?encounter.round:null,activeActorId:characters.find(c=>c.activeTurn)?.actorId??null},characters};
}
