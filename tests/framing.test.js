import test from "node:test";
import assert from "node:assert/strict";
import {cluster,frame} from "../scripts/camera/framing.js";
test("isolated scout does not enlarge main cluster",()=>assert.equal(cluster([{x:0,y:0},{x:20,y:0},{x:900,y:0}],100)[0].length,2));
test("center and scale bounds",()=>assert.deepEqual(frame([{x:10,y:20}],{width:100,height:100},{padding:50,minScale:.4,maxScale:1.5}),{x:10,y:20,scale:1}));
test("empty frame",()=>assert.equal(frame([],{width:100,height:100}),null));
