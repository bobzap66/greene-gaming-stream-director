import test from "node:test";
import assert from "node:assert/strict";
import {chooseExploration,safeTarget} from "../scripts/camera/director.js";
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
