import test from "node:test";
import assert from "node:assert/strict";
import {physicalScale,tabletopTarget,displaySignature} from "../scripts/tabletop/policy.js";
test("different native grid sizes produce the same physical square",()=>{
 for(const grid of [70,100,150,300])assert.equal(physicalScale(60,1,grid)*grid,60);
 assert.equal(physicalScale(60,1.5,100),.9);
 assert.equal(physicalScale(0,1,100),null);
});
const context={current:{x:100,y:200,scale:1},sceneRect:{x:0,y:0,width:1000,height:800},scale:.6,visible:t=>t.visible};
test("auto and hold never reposition tabletop",()=>{
 for(const mode of ["auto","hold"])assert.deepEqual(tabletopTarget({mode},context),{x:100,y:200,scale:.6});
});
test("bookmarks, focus and mirror disregard requested zoom",()=>{
 for(const mode of ["bookmark","focus","mirror"])assert.deepEqual(tabletopTarget({mode,x:0,y:300,scale:2},context),{x:0,y:300,scale:.6});
});
test("full and wide center without fitting",()=>{
 for(const mode of ["full","wide"])assert.deepEqual(tabletopTarget({mode},context),{x:500,y:400,scale:.6});
});
test("follow only centers on visible token",()=>{
 assert.deepEqual(tabletopTarget({mode:"follow"},{...context,token:{visible:true,center:{x:10,y:20}}}),{x:10,y:20,scale:.6});
 assert.deepEqual(tabletopTarget({mode:"follow"},{...context,token:{visible:false,center:{x:10,y:20}}}),{x:100,y:200,scale:.6});
});
test("display signature changes with pixel ratio",()=>assert.notEqual(displaySignature({width:1920,height:1080,dpr:1}),displaySignature({width:1920,height:1080,dpr:2})));
