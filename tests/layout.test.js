import test from "node:test";
import assert from "node:assert/strict";
import {normalizeRegion,pixels,cameraOffset} from "../scripts/layout/geometry.js";
test("region stays inside viewport",()=>assert.deepEqual(normalizeRegion({x:90,y:90,w:70,h:70},{x:0,y:0,w:50,h:50}),{x:90,y:90,w:10,h:10}));
test("percentage coordinates",()=>assert.deepEqual(pixels({x:10,y:20,w:50,h:60},1000,500),{x:100,y:100,width:500,height:300}));
test("camera offsets toward left safe region",()=>assert.deepEqual(cameraOffset({x:100,y:100,scale:2},{x:0,y:0,width:600,height:500},1000,500),{x:200,y:100,scale:2}));
