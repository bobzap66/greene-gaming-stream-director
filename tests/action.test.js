import test from "node:test";
import assert from "node:assert/strict";
import {publicAction,createActionDirector} from "../scripts/camera/action.js";
const visible=new Set(["a","b","c"]),combat=new Set(["a","b"]);
const message={id:"m1",visible:true,isContentVisible:true,isRoll:true,blind:false,whisper:[],speaker:{scene:"s",token:"a"},flags:{pf2e:{context:{type:"attack-roll",target:{token:"Scene.s.Token.b"}}}}};
const parse=m=>publicAction(m,"s",visible,combat);
test("public combat roll resolves structured same-scene visible target",()=>assert.deepEqual(parse(message),{id:"m1",actorId:"a",targetIds:["b"]}));
test("private, blind, unreadable, non-roll and off-scene messages cannot affect camera",()=>{
 for(const patch of [{blind:true},{whisper:["gm"]},{visible:false},{isContentVisible:false},{isRoll:false},{speaker:{scene:"x",token:"a"}},{speaker:{scene:"s",token:"hidden"}},{speaker:{scene:"s",token:"c"}}])assert.equal(parse({...message,...patch}),null);
});
test("multiple targets deduplicate and reject hidden or remote UUIDs",()=>{
 const m={...message,flags:{sf2e:{context:{type:"area-attack-roll",targets:["Scene.s.Token.b",{token:"Scene.s.Token.c"},"Scene.s.Token.b","Scene.x.Token.c","Scene.s.Token.hidden"]}}}};
 assert.deepEqual(parse(m).targetIds,["b","c"]);
});
const a={id:"a"},b={id:"b"},c={id:"c"};
const record=(d,now,patch={})=>d.record({encounter:"e",action:{id:"m"+now,actorId:"a",targetIds:["b"]},now,holdMs:3200,limitMs:10000,...patch});
const shot=(d,now,patch={})=>d.select({encounter:"e",now,visiblePoints:[a,b,c],...patch});
test("action shot holds across initiative until expiry",()=>{
 const d=createActionDirector();record(d,0);
 assert.deepEqual(shot(d,3199),[a,b]);assert.equal(shot(d,3200),null);
});
test("follow-up damage retains prior targets and extends hold",()=>{
 const d=createActionDirector();record(d,0);
 record(d,2500,{action:{id:"damage",actorId:"a",targetIds:[]}});
 assert.deepEqual(shot(d,5000),[a,b]);assert.equal(shot(d,5700),null);
});
test("reaction or save from different visible combatant redirects action",()=>{
 const d=createActionDirector();record(d,0);
 record(d,1000,{action:{id:"reaction",actorId:"b",targetIds:["a"]}});
 assert.deepEqual(shot(d,1100),[b,a]);
});
test("missing metadata uses supplied same-actor fallback",()=>{
 const d=createActionDirector();record(d,0,{action:{id:"m",actorId:"a",targetIds:[]},fallbackIds:["a","c"]});
 assert.deepEqual(shot(d,1),[a,c]);
});
test("hidden target is dropped and invisible actor cancels hold",()=>{
 const d=createActionDirector();record(d,0);
 assert.deepEqual(shot(d,1,{visiblePoints:[a,c]}),[a]);
 assert.equal(shot(d,2,{visiblePoints:[b,c]}),null);
});
test("duplicate messages do not extend hold; same-actor chain capped at ten seconds",()=>{
 const d=createActionDirector();record(d,0);
 assert.equal(record(d,100,{action:{id:"m0",actorId:"a",targetIds:["b"]}}),false);
 for(const now of [2000,4000,6000,8000,9900])record(d,now);
 assert.deepEqual(shot(d,9999),[a,b]);assert.equal(shot(d,10000),null);
});
test("encounter changes and explicit reset clear pending action",()=>{
 const d=createActionDirector();record(d,0);
 assert.equal(shot(d,1,{encounter:"other"}),null);
 record(d,2);d.reset();assert.equal(shot(d,3),null);
});

test("extended thirty-second limit allows a longer action chain",()=>{
 const d=createActionDirector();
 for(let now=0;now<=28000;now+=4000)record(d,now,{holdMs:6000,limitMs:30000});
 assert.deepEqual(shot(d,29999),[a,b]);assert.equal(shot(d,30000),null);
});
test("unlimited chain still expires when rolls stop",()=>{
 const d=createActionDirector();
 for(let now=0;now<=40000;now+=4000)record(d,now,{holdMs:6000,limitMs:0});
 assert.deepEqual(shot(d,45999),[a,b]);assert.equal(shot(d,46000),null);
});
test("finite limit never cuts initial hold short",()=>{
 const d=createActionDirector();record(d,0,{holdMs:15000,limitMs:10000});
 assert.deepEqual(shot(d,14999),[a,b]);assert.equal(shot(d,15000),null);
});
