import test from "node:test";
import assert from "node:assert/strict";
import {createCombatDirector,currentActorToken,eligibleTargetUsers} from "../scripts/camera/combat.js";
const p=id=>({id,x:0,y:0,width:100,height:100});
const a=p("a"),b=p("b"),c=p("c");
const base={encounter:"e",turn:"1",actorId:"a",visiblePoints:[a,b,c],combatPoints:[a,b,c],userTargets:[{id:"u",targets:[]}]};
const step=(d,now,extra={})=>d.select({...base,now,...extra});
test("establishing shot then active combatant",()=>{
 const d=createCombatDirector();
 assert.deepEqual(step(d,0),{kind:"tactical",points:[a,b,c]});
 assert.equal(step(d,1999).kind,"tactical");
 assert.deepEqual(step(d,2000),{kind:"cinematic",points:[a]});
});
test("new multiple targets settle before reframing, deselection holds briefly",()=>{
 const d=createCombatDirector({establishMs:0});
 step(d,0);
 const targets={userTargets:[{id:"u",targets:["b","c"]}]};
 assert.deepEqual(step(d,100,targets).points,[a]);
 assert.deepEqual(step(d,1199,targets).points,[a]);
 assert.deepEqual(step(d,1200,targets).points,[a,b,c]);
 assert.deepEqual(step(d,1300).points,[a,b,c]);
 assert.deepEqual(step(d,2400).points,[a]);
});
test("stale targets are ignored on a new turn until newly selected",()=>{
 const d=createCombatDirector({establishMs:0,settleMs:0,dwellMs:0});
 const targets={userTargets:[{id:"u",targets:["b"]}]};
 assert.deepEqual(step(d,0,targets).points,[a]);
 step(d,1);
 assert.deepEqual(step(d,2,targets).points,[a,b]);
 assert.deepEqual(step(d,3,{...targets,turn:"2",actorId:"c"}).points,[c]);
});
test("invisible targets are dropped immediately and hidden actor uses tactical fallback",()=>{
 const d=createCombatDirector({establishMs:0,settleMs:0,dwellMs:1200});
 step(d,0);
 const targets={userTargets:[{id:"u",targets:["b"]}]};
 step(d,100,targets);
 assert.deepEqual(step(d,1200,targets).points,[a,b]);
 assert.deepEqual(step(d,1201,{...targets,visiblePoints:[a,c]}).points,[a]);
 assert.equal(step(d,1202,{actorId:"hidden",visiblePoints:[b,c],combatPoints:[b,c]}).kind,"tactical");
});
test("new encounter and reset restart establishing shot",()=>{
 const d=createCombatDirector();
 step(d,0);assert.equal(step(d,3000).kind,"cinematic");
 assert.equal(step(d,3100,{encounter:"other"}).kind,"tactical");
 d.reset();assert.equal(step(d,9000).kind,"tactical");
});
test("active actor resolution excludes hidden and other-scene combatants",()=>{
 const encounter={combatant:{tokenId:"a",sceneId:"s"}};
 assert.equal(currentActorToken(encounter,"s",[a,b]),a);
 assert.equal(currentActorToken(encounter,"other",[a,b]),null);
 assert.equal(currentActorToken({...encounter,combatant:{...encounter.combatant,hidden:true}},"s",[a,b]),null);
 assert.equal(currentActorToken(encounter,"s",[b]),null);
});
test("connected player owners on the scene take precedence; GM fallback excludes observer",()=>{
 const users=[{id:"owner",active:true,viewedScene:"s"},{id:"other",active:true,viewedScene:"s"},{id:"remote",active:true,viewedScene:"x"},{id:"obs",active:true,viewedScene:"s"},{id:"gm",active:true,isGM:true,viewedScene:"s"},{id:"offline",active:false,isGM:true,viewedScene:"s"}];
 const actor={testUserPermission:u=>["owner","remote","obs"].includes(u.id)};
 assert.deepEqual(eligibleTargetUsers(users,actor,"s","obs").map(u=>u.id),["owner"]);
 assert.deepEqual(eligibleTargetUsers(users,{testUserPermission:()=>false},"s","obs").map(u=>u.id),["gm"]);
});
