import test from "node:test";
import assert from "node:assert/strict";
import {chooseExploration,safeTarget,sceneCombatTargets} from "../scripts/camera/director.js";
const p=(id,x,y)=>({id,x,y,width:100,height:100});
test("party token alone or explicitly selected",()=>{
 const party=p("party",900,900),members=[p("a",0,0),p("b",100,0)];
 assert.deepEqual(chooseExploration([], [party],null,null,800),[party]);
 assert.deepEqual(chooseExploration(members,[party],"party","party",800),[party]);
 assert.deepEqual(chooseExploration(members,[party],"individual",null,800),members);
});
test("largest exploration cluster excludes scout",()=>{
 const members=[p("a",0,0),p("b",100,0),p("c",3000,0)];
 assert.deepEqual(chooseExploration(members,[],null,null,800),members.slice(0,2));
});
test("safe target keeps token bounds inside offset viewport after resize",()=>{
 const points=[p("a",2385,2915),p("b",3339,3445)];
 const rect={x:85.56,y:187.62,width:972,height:552.55},center={x:682.5,y:455.5};
 const current={x:2300,y:3200,scale:.474};
 const target=safeTarget(points,rect,center,current);
 for(const a of points){
 const x=center.x+(a.x-target.x)*target.scale,y=center.y+(a.y-target.y)*target.scale;
 assert.ok(x-a.width*target.scale/2>=rect.x-1e-6);
 assert.ok(x+a.width*target.scale/2<=rect.x+rect.width+1e-6);
 assert.ok(y-a.height*target.scale/2>=rect.y-1e-6);
 assert.ok(y+a.height*target.scale/2<=rect.y+rect.height+1e-6);
 }
 assert.equal(safeTarget(points,rect,center,target),target);
});
test("fit takes priority over legacy minimum zoom",()=>{
 const t=safeTarget([p("a",0,0),p("b",10000,0)],{x:0,y:0,width:1000,height:500},{x:500,y:250},{x:0,y:0,scale:1},{force:true});
 assert.ok(t.scale<.4);
});

const combatToken={id:"t",visible:true};
const lookup=id=>id==="t"?combatToken:undefined;
const eligible=t=>t.visible;
const encounter=(scene,combatants=[{tokenId:"t"}])=>({started:true,isActive:true,scene,combatants});
test("combat on another scene never captures camera, even with matching token ID",()=>{
 assert.deepEqual(sceneCombatTargets(encounter({id:"other"}),"current",lookup,eligible),[]);
});
test("current scene and scene-less combat track eligible local tokens",()=>{
 assert.deepEqual(sceneCombatTargets(encounter({id:"current"}),"current",lookup,eligible),[combatToken]);
 assert.deepEqual(sceneCombatTargets(encounter(null),"current",lookup,eligible),[combatToken]);
});
test("scene-less combat excludes explicitly remote combatants and missing or hidden tokens",()=>{
 assert.deepEqual(sceneCombatTargets(encounter(null,[{tokenId:"t",sceneId:"other"},{tokenId:"missing"}]),"current",lookup,eligible),[]);
 assert.deepEqual(sceneCombatTargets(encounter(null),"current",lookup,()=>false),[]);
});
test("inactive and ended combat permit exploration",()=>{
 assert.deepEqual(sceneCombatTargets({...encounter(null),started:false},"current",lookup,eligible),[]);
 assert.deepEqual(sceneCombatTargets({...encounter(null),isActive:false},"current",lookup,eligible),[]);
 assert.deepEqual(sceneCombatTargets(null,"current",lookup,eligible),[]);
});
