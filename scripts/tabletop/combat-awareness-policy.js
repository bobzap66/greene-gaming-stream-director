// Read-only observer policy. Never substitute a hidden combatant's identity.
export function combatAwareness({encounter,sceneId,lookup,user,skipDefeated=false}){
 if(!encounter?.started||!encounter.isActive||!sceneId||!user||user.isGM)return null;
 const scene=encounter.scene?.id??(typeof encounter.scene==="string"?encounter.scene:null)??encounter.sceneId;
 if(scene&&scene!==sceneId)return null;
 const turns=Array.from(encounter.turns??[]);
 const current=encounter.combatant;
 const index=current?turns.findIndex(c=>c.id===current.id):-1;
 if(index<0)return null;
 function name(c){
  if(!c||c.hidden||c.visible===false)return null;
  const combatantScene=c.sceneId??c.scene?.id??c.token?.parent?.id;
  if(combatantScene&&combatantScene!==sceneId)return null;
  const tokenId=c.tokenId??c.token?.id;
  if(tokenId){
   const t=lookup(tokenId);
   if(!t?.isVisible||t.document?.hidden!==false||t.document?.parent?.id!==sceneId)return null;
   return typeof c.name==="string"&&c.name.trim()?c.name:null;
  }
  // Tokenless physical PCs are eligible only in an explicitly matching encounter.
  const a=c.actor;
  if(scene!==sceneId||!a?.hasPlayerOwner||!a.testUserPermission?.(user,"OBSERVER"))return null;
  return typeof c.name==="string"&&c.name.trim()?c.name:null;
 }
 const names=turns.map(name);
 if(!names.some(Boolean))return null;
 let next=null;
 for(let step=1;step<turns.length;step++){
  const i=(index+step)%turns.length;
  if(names[i]&&!(skipDefeated&&turns[i].defeated)){next=names[i];break;}
 }
 return {current:names[index],next,round:Number.isInteger(encounter.round)&&encounter.round>0?encounter.round:null};
}
