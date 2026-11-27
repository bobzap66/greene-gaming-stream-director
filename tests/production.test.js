import test from "node:test";
import assert from "node:assert/strict";
import {normalizeStatus,productionWarning} from "../scripts/production/policy.js";
const status=normalizeStatus({enabled:true,connected:true,active:true,scene:"Intro",mappings:{intro:"Intro",gameplay:"Game",break:"Break",ending:"End",other:"Private"},streaming:true,recording:false,password:"secret"});
test("status excludes unrelated data",()=>{assert.equal(status.password,undefined);assert.equal(status.mappings.other,undefined);});
test("combat warning only on mapped intro or break and active campaign",()=>{assert.match(productionWarning(status,{combat:true}),/Combat/);assert.equal(productionWarning({...status,active:false},{combat:true}),null);assert.equal(productionWarning({...status,scene:"End"},{combat:true}),null);});
test("recording warnings opt in",()=>{const s={...status,scene:"Game"};assert.equal(productionWarning(s),null);assert.match(productionWarning(s,{expectRecording:true}),/recording/);});
