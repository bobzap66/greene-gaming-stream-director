import test from "node:test";
import assert from "node:assert/strict";
import {sampleExplored,unionVisible,createExplorationCache} from "../scripts/camera/explored.js";
const scene={x:1800,y:2300,width:7200,height:9000};
test("reproduces observed Rusty Dragon bounds and expands after exploration",()=>{
 const sample=(left,top,right,bottom)=>sampleExplored(scene,100,p=>p.x>=left&&p.x<right&&p.y>=top&&p.y<bottom);
 assert.deepEqual(sample(3240,4640,8820,8420),{x:3240,y:4640,width:5580,height:3780});
 assert.deepEqual(sample(2700,4640,8820,10040),{x:2700,y:4640,width:6120,height:5400});
});
test("empty exploration returns null",()=>assert.equal(sampleExplored(scene,100,()=>false),null));
test("sampling remains bounded on extreme aspect ratios and includes edges",()=>{
 let count=0;const r={x:15,y:20,width:1000000,height:1};
 assert.deepEqual(sampleExplored(r,1,()=>{count++;return true;}),r);
 assert.ok(count<=2000);
});
test("union includes visible token bounds outside sampled area",()=>{
 assert.deepEqual(unionVisible({x:100,y:100,width:100,height:100},[{x:80,y:150,width:20,height:20}]),{x:70,y:100,width:130,height:100});
});
test("cache throttles reads, expires, invalidates on shot or scene change, and clears",()=>{
 const cache=createExplorationCache();let calls=0;const read=()=>++calls;
 assert.equal(cache.get("a",0,read),1);
 assert.equal(cache.get("a",999,read),1);
 assert.equal(cache.get("a",1000,read),2);
 assert.equal(cache.get("b",1001,read),3);
 cache.clear();assert.equal(cache.get("b",1002,read),4);
});
