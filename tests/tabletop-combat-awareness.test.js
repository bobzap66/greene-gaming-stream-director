import test from "node:test";
import assert from "node:assert/strict";
import {combatAwareness,initiativeEdges,edgePlacement} from "../scripts/tabletop/combat-awareness-policy.js";

const user={id:"observer",isGM:false};
const turn=(id,name,extra={})=>({id,name,tokenId:id,visible:true,...extra});
const token=(id,extra={})=>({id,isVisible:true,document:{hidden:false,parent:{id:"s"}},...extra});
function fixture(turns,index=0,extra={},tokens=turns.map(c=>token(c.tokenId))){
 const encounter={started:true,isActive:true,scene:{id:"s"},round:2,turns,combatant:turns[index],...extra};
 return {encounter,sceneId:"s",lookup:id=>tokens.find(t=>t.id===id),user,canReadName:()=>true};
}
test("uses ordered turns, including manually adjusted initiative, and round",()=>{
 const a=turn("a","Fighter"),b=turn("b","Wizard"),c=turn("c","Rogue");
 assert.deepEqual(combatAwareness(fixture([b,c,a],1)),{current:"Rogue",next:"Fighter",round:2});
 assert.deepEqual(combatAwareness(fixture([b,c,a],2)),{current:"Fighter",next:"Wizard",round:2});
 assert.equal(combatAwareness(fixture([a],0)).next,"Fighter");
});
test("skips defeated combatants only when configured",()=>{
 const f=fixture([turn("a","Fighter"),turn("b","Ogre",{isDefeated:true}),turn("c","Wizard")]);
 assert.equal(combatAwareness(f).next,"Ogre");
 assert.equal(combatAwareness({...f,skipDefeated:true}).next,"Wizard");
});
test("never names hidden, invisible or off-scene combatants or jumps over hidden upcoming turns",()=>{
 const a=turn("a","Fighter"),c=turn("c","Wizard");
 for(const b of [turn("b","Secret",{hidden:true}),turn("b","Secret",{isHidden:true}),turn("b","Secret",{visible:false}),turn("b","Secret",{sceneId:"other"})]){
  assert.deepEqual(combatAwareness(fixture([a,b,c])),{current:"Fighter",next:null,round:2});
  assert.equal(combatAwareness(fixture([a,b,c],1)).current,null);
 }
 for(const t of [token("b",{isVisible:false}),token("b",{document:{hidden:true,parent:{id:"s"}}}),token("b",{document:{hidden:false,parent:{id:"other"}}})]){
  assert.equal(combatAwareness(fixture([a,turn("b","Secret"),c],0,{},[token("a"),t,token("c")])).next,null);
 }
 assert.deepEqual(combatAwareness({...fixture([a,c]),canReadName:()=>false}),{current:"Creature",next:"Creature",round:2});
});
test("tokenless character entries require observer permission and an explicitly matching scene",()=>{
 const a=turn("a","Physical PC",{tokenId:null,actor:{type:"character",testUserPermission:()=>true}});
 const b=turn("b","Fighter");
 assert.equal(combatAwareness(fixture([a,b])).current,"Physical PC");
 assert.equal(combatAwareness(fixture([{...a,actor:{type:"character",testUserPermission:()=>false}},b])).current,null);
 assert.equal(combatAwareness(fixture([a,b],0,{scene:null})).current,null);
});
test("inactive, unrelated or wholly hidden encounters are suppressed",()=>{
 const a=turn("a","Fighter"),f=fixture([a]);
 for(const override of [{started:false},{isActive:false},{scene:{id:"other"}},{combatant:null}])assert.equal(combatAwareness(fixture([a],0,override)),null);
 assert.equal(combatAwareness({...f,user:{isGM:true}}),null);
 assert.equal(combatAwareness(fixture([turn("h","Secret",{hidden:true})])),null);
});
test("four edge panels face outward and use the available long axis",()=>{
 assert.deepEqual(initiativeEdges("four"),["bottom","top","left","right"]);
 assert.deepEqual(initiativeEdges("mirrored"),["bottom","top"]);
 assert.deepEqual(initiativeEdges("top"),["top"]);
 assert.deepEqual(initiativeEdges("bottom"),["bottom"]);
 assert.deepEqual(initiativeEdges("invalid"),["bottom"]);
 assert.deepEqual(initiativeEdges("four").map(e=>edgePlacement(e).angle),[0,180,90,-90]);
 assert.deepEqual(initiativeEdges("four").map(e=>edgePlacement(e).axis),["vw","vw","vh","vh"]);
});
