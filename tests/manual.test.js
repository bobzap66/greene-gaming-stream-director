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
test("full scene fits scene in offset camera area",()=>{
 assert.deepEqual(manualTarget({mode:"full"},context),{x:1000,y:600,scale:.5});
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

test("wide shot frames explored bounds with margin",()=>{
 const target=manualTarget({mode:"wide"},{...context,exploredRect:{x:200,y:100,width:400,height:200},wideMargin:.1});
 assert.equal(target.scale,1.5);
 assert.ok(Math.abs(target.x-(400+100/1.5))<1e-9);
 assert.ok(Math.abs(target.y-(200+100/1.5))<1e-9);
});
test("wide shot uses full scene without token vision, otherwise falls back to auto",()=>{
 assert.deepEqual(manualTarget({mode:"wide"},{...context,tokenVision:false}),manualTarget({mode:"full"},context));
 const fallback={x:1,y:2,scale:1};
 assert.equal(manualTarget({mode:"wide"},{...context,autoFrame:()=>fallback}),fallback);
 assert.equal(manualTarget({mode:"wide"},context),null);
});
test("wide margin reduces zoom when bounds constrain fit",()=>{
 const ctx={...context,exploredRect:{x:0,y:0,width:800,height:400}};
 assert.equal(manualTarget({mode:"wide"},{...ctx,wideMargin:0}).scale,1);
 assert.ok(Math.abs(manualTarget({mode:"wide"},{...ctx,wideMargin:.1}).scale-1/1.1)<1e-9);
});
