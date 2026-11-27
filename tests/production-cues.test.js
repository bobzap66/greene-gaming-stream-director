import test from "node:test";
import assert from "node:assert/strict";
import {cueView,formatDuration} from "../scripts/production/cues.js";
const s={enabled:true,connected:true,active:true,scene:"Intro",mappings:{intro:"Intro",standby:"Quiet",break:"Break",technical:"Trouble",gameplay:"Game"},cue:{id:"1",elapsedMs:60000,introReady:false,introRemainingMs:0}};
test("zero intro countdown never triggers completion alert without explicit signal",()=>{assert.equal(cueView(s).alert,false);assert.equal(cueView({...s,cue:{...s.cue,introReady:true}}).alert,true);});
test("break countdown is scene scoped and opt-in",()=>{assert.equal(cueView({...s,scene:"Break"}),null);assert.equal(cueView({...s,scene:"Break"},{breakMinutes:2}).remainingMs,60000);assert.equal(cueView({...s,scene:"Break"},{breakMinutes:1}).alert,true);});
test("technical timer and standby display without public countdown",()=>{assert.equal(cueView({...s,scene:"Trouble"},{technical:true}).elapsedMs,60000);assert.equal(cueView({...s,scene:"Quiet"}).remainingMs,null);});
test("inactive, disconnected and gameplay states cancel notices",()=>{for(const change of [{active:false},{connected:false},{enabled:false},{scene:"Game"}])assert.equal(cueView({...s,...change}),null);});
test("timer formatting rounds up",()=>{assert.equal(formatDuration(61001),"1:02");assert.equal(formatDuration(0),"0:00");});
