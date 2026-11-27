import test from "node:test";
import assert from "node:assert/strict";
import {cueView,formatDuration} from "../scripts/production/cues.js";
const s={enabled:true,connected:true,active:true,scene:"Intro",mappings:{intro:"Intro",standby:"Quiet",break:"Break",technical:"Trouble",gameplay:"Game"},cue:{id:"1",elapsedMs:60000,introReady:false,introRemainingMs:0}};
test("zero intro countdown never triggers completion alert without explicit signal",()=>{assert.equal(cueView(s).alert,false);assert.equal(cueView({...s,cue:{...s.cue,introReady:true}}).alert,true);});
test("break countdown is scene scoped and opt-in",()=>{const br={...s,scene:"Break",cue:{...s.cue,breakTimer:{mode:"running",remainingMs:60000}}};assert.equal(cueView(br,{breakEnabled:false}),null);assert.equal(cueView(br).remainingMs,60000);assert.equal(cueView({...br,cue:{...br.cue,breakTimer:{mode:"running",remainingMs:0}}}).alert,true);assert.equal(cueView({...br,cue:{...br.cue,breakTimer:{mode:"paused",remainingMs:60000}}}).paused,true);assert.equal(cueView({...br,cue:{...br.cue,breakTimer:{mode:"indefinite",remainingMs:null}}}).remainingMs,null);});
test("technical timer and standby display without public countdown",()=>{assert.equal(cueView({...s,scene:"Trouble"},{technical:true}).elapsedMs,60000);assert.equal(cueView({...s,scene:"Quiet"}).remainingMs,null);});
test("inactive, disconnected and gameplay states cancel notices",()=>{for(const change of [{active:false},{connected:false},{enabled:false},{scene:"Game"}])assert.equal(cueView({...s,...change}),null);});
test("timer formatting rounds up",()=>{assert.equal(formatDuration(61001),"1:02");assert.equal(formatDuration(0),"0:00");});
