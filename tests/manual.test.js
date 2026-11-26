import test from "node:test";
import assert from "node:assert/strict";
import {effectiveCommand,manualTarget,locationTarget,transitionDuration} from "../scripts/camera/manual.js";
const base={mode:"follow",sceneId:"s",observerId:"o",tokenId:"t"};
test("commands are scoped to scene and observer",()=>{
 assert.equal(effectiveCommand(base,"s","o"),base);
 assert.equal(effectiveCommand(base,"other","o").mode,"auto");
 assert.equal(effectiveCommand(base,"s","other").mode,"auto");
 assert.equal(effectiveCommand({...base,mode:"focus",x:NaN},"s","o").mode,"auto");
});
const rect={x:100,y:100,width:800,height:400},center={x:600,y:400};
const context={rect,center,sceneRect:{x:0,y:0,width:1600,height:800},maxScale:1.5,visible:t=>!t.hidden,frame:t=>({x:t.x,y:0,scale:1})};
test("wide shot fits scene in offset camera area",()=>{
 assert.deepEqual(manualTarget({mode:"wide"},context),{x:1000,y:600,scale:.5});
});
test("focus maps world point to safe area center",()=>{
 assert.deepEqual(locationTarget(200,300,1,rect,center),{x:300,y:400,scale:1});
});
test("follow never frames hidden or unavailable tokens",()=>{
 assert.equal(manualTarget(base,context),null);
 assert.equal(manualTarget(base,{...context,token:{hidden:true}}),null);
 assert.deepEqual(manualTarget(base,{...context,token:{x:50}}),{x:50,y:0,scale:1});
});
test("hold does not issue camera movement",()=>assert.equal(manualTarget({mode:"hold"},context),null));
test("transition options",()=>assert.deepEqual(["cut","smooth","cinematic"].map(s=>transitionDuration(s)),[0,750,1800]));
