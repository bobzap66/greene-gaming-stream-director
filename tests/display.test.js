import test from "node:test";
import assert from "node:assert/strict";
import {chooseProfile,matchingProfiles,snapDelta,viewportBounds} from "../scripts/tabletop/display-policy.js";
const tv={id:"tv",signature:"1920|1080|1",label:"TV",ppi:43};
const monitor={id:"monitor",signature:"1920|1080|1",label:"Monitor",ppi:90};
test("recognizes matching display label and metrics",()=>{
 assert.equal(chooseProfile([tv,monitor],tv.signature,"TV","monitor"),tv);
 assert.equal(chooseProfile([tv,monitor],"1920|1080|2","TV","tv"),null);
 assert.equal(chooseProfile([tv,monitor],tv.signature,"Other","tv"),null);
});
test("manual selection required when monitor identity unavailable",()=>{
 assert.equal(chooseProfile([tv,monitor],tv.signature,"",""),null);
 assert.equal(chooseProfile([tv,monitor],tv.signature,"","monitor"),monitor);
});
test("duplicate display labels require a matching explicit choice",()=>{
 const other={...tv,id:"second"};
 assert.equal(chooseProfile([tv,other],tv.signature,"TV",""),null);
 assert.equal(chooseProfile([tv,other],tv.signature,"TV","second"),other);
});
test("invalid calibration is excluded",()=>{
 assert.deepEqual(matchingProfiles([{...tv,ppi:0},tv],tv.signature,"TV"),[tv]);
});
test("drag moves by whole squares relative to initial position",()=>{
 assert.deepEqual(snapDelta({x:27,y:38},{x:183,y:-13},100),{x:227,y:-62});
 assert.equal(snapDelta({x:0,y:0},{x:5,y:5},0),null);
});
test("viewport world bounds account for observer scale",()=>{
 assert.deepEqual(viewportBounds({x:500,y:400,width:1920,height:1080,scale:2}),{x:20,y:130,w:960,h:540});
 assert.equal(viewportBounds({x:0,y:0,width:1920,height:1080,scale:0}),null);
});
