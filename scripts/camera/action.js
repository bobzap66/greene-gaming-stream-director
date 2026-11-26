// Only public, observer-readable roll messages can influence camera composition.
const rollKinds=new Set(["attack-roll","spell-attack-roll","damage-roll","saving-throw","skill-check","flat-check","check","attack","damage","save","area-attack-roll"]);
export function publicAction(message,sceneId,visibleIds,combatIds){
 if(!message?.id||message.blind||message.whisper?.length||message.visible!==true||message.isContentVisible!==true||!message.isRoll)return null;
 const speaker=message.speaker;
 if(speaker?.scene!==sceneId||!combatIds.has(speaker.token)||!visibleIds.has(speaker.token))return null;
 const flags=message.flags?.pf2e??message.flags?.sf2e??{};
 const kind=flags.context?.type;
 // Generic public rolls with a visible combatant speaker are also useful.
 if(kind&&!rollKinds.has(kind))return null;
 const ids=new Set();
 const add=ref=>{
  if(typeof ref!=="string")return;
  const match=/^Scene\.([^.]+)\.Token\.([^.]+)$/.exec(ref);
  if(match&&match[1]===sceneId&&visibleIds.has(match[2]))ids.add(match[2]);
 };
 add(flags.context?.target?.token);
 add(flags.target?.token);
 for(const target of Array.isArray(flags.context?.targets)?flags.context.targets:[])add(typeof target==="string"?target:target?.token);
 ids.delete(speaker.token);
 return {id:message.id,actorId:speaker.token,targetIds:[...ids]};
}
/** Bounded action hold, scoped to an encounter. No roll values or chat text retained. */
export function createActionDirector(){
 let key=null,shot=null,seen=new Set();
 function reset(){key=null;shot=null;seen.clear();}
 function scope(encounter){if(key!==encounter){reset();key=encounter;}}
 function record({encounter,action,now,holdMs=3200,fallbackIds=[]}){
  scope(encounter);
  if(!action||seen.has(action.id))return false;
  seen.add(action.id);
  if(seen.size>128)seen.delete(seen.values().next().value);
  const continuation=shot&&now<shot.until&&shot.actorId===action.actorId;
  const ids=action.targetIds.length?action.targetIds:continuation?shot.ids:fallbackIds;
  const start=continuation?shot.start:now;
  // A stream of rolls may extend a shot, but not indefinitely.
  shot={actorId:action.actorId,ids:[...new Set(ids)].filter(id=>id!==action.actorId),start,until:Math.min(now+holdMs,start+Math.max(holdMs,10000))};
  return true;
 }
 function select({encounter,now,visiblePoints}){
  scope(encounter);
  if(!shot||now>=shot.until){shot=null;return null;}
  const visible=new Map(visiblePoints.map(p=>[p.id,p]));
  const actor=visible.get(shot.actorId);
  if(!actor){shot=null;return null;}
  return [actor,...shot.ids.map(id=>visible.get(id)).filter(Boolean)];
 }
 return {reset,record,select};
}
