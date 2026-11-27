import test from "node:test";
import assert from "node:assert/strict";
import {buildSnapshot,unavailable} from "../scripts/integration/policy.js";
const user={id:"observer",isGM:false};
const actor={id:"a",uuid:"Actor.a",type:"character",name:"Hero",hasPlayerOwner:true,testUserPermission:()=>true,system:{attributes:{hp:{value:24,max:30,temp:2}},secret:"not exported"}};
const token={id:"t",actor,document:{hidden:false},isVisible:true};
const combatant={id:"c",tokenId:"t",sceneId:"s",hidden:false};
const encounter={started:true,isActive:true,scene:{id:"s"},round:2,combatants:[combatant],combatant};
const snapshot=(extra={})=>buildSnapshot({system:"pf2e",sceneId:"s",tokens:[token],user,encounter,mode:"broadcast",healthEnabled:true,...extra});
test("eligible visible character state is allowlisted",()=>{
 const s=snapshot();assert.equal(s.characters.length,1);
 assert.deepEqual(s.characters[0].health,{value:24,max:30,temp:2});
 assert.equal(s.combat.activeActorId,"a");assert.equal(s.characters[0].activeTurn,true);
 assert.equal(JSON.stringify(s).includes("secret"),false);
});
test("health is independent opt-in",()=>assert.equal(snapshot({healthEnabled:false}).characters[0].health,null));
test("hidden invisible NPC unowned and unauthorized tokens excluded",()=>{
 for(const t of [{...token,document:{hidden:true}},{...token,isVisible:false},{...token,actor:{...actor,type:"npc"}},{...token,actor:{...actor,hasPlayerOwner:false}},{...token,actor:{...actor,testUserPermission:()=>false}}])assert.deepEqual(snapshot({tokens:[t]}).characters,[]);
});
test("GM is not a valid observer",()=>assert.deepEqual(snapshot({user:{isGM:true}}).characters,[]));
test("hidden active combatant not disclosed",()=>{
 const hidden={...combatant,hidden:true};
 const s=snapshot({encounter:{...encounter,combatants:[hidden],combatant:hidden}});
 assert.equal(s.combat.activeActorId,null);assert.equal(s.characters[0].inCombat,false);
});
test("off-scene combat not exported",()=>assert.deepEqual(snapshot({encounter:{...encounter,scene:{id:"other"}}}).combat,{active:false,round:null,activeActorId:null}));
test("unsupported health and unavailable snapshots fail closed",()=>{
 assert.equal(snapshot({tokens:[{...token,actor:{...actor,system:{}}}]}).characters[0].health,null);
 assert.deepEqual(unavailable().characters,[]);assert.equal(unavailable().available,false);
});

test("approved off-scene actor retains health but no token or turn",()=>{
 const s=snapshot({tokens:[],actors:[actor],roster:[actor.uuid]});
 assert.equal(s.characters.length,1);assert.equal(s.characters[0].tokenId,null);
 assert.equal(s.characters[0].activeTurn,false);assert.equal(s.characters[0].health.value,24);
});
test("approved roster filters visible characters and empty roster exports none",()=>{
 assert.deepEqual(snapshot({roster:[],actors:[actor]}).characters,[]);
 assert.deepEqual(snapshot({roster:["Actor.other"],actors:[actor]}).characters,[]);
});
test("approved hidden token does not disclose token or turn",()=>{
 const s=snapshot({tokens:[{...token,document:{hidden:true}}],actors:[actor],roster:[actor.uuid]});
 assert.equal(s.characters[0].tokenId,null);assert.equal(s.combat.activeActorId,null);
});
test("approved actor still needs observer permission",()=>{
 assert.deepEqual(snapshot({tokens:[],actors:[{...actor,testUserPermission:()=>false}],roster:[actor.uuid]}).characters,[]);
});
