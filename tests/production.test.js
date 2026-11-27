import test from "node:test";
import assert from "node:assert/strict";
import {normalizeStatus,productionWarning,protectedScene,mappedRoles} from "../scripts/production/policy.js";
const status=normalizeStatus({enabled:true,connected:true,active:true,scene:"Intro",mappings:{intro:"Intro",gameplay:"Game",break:"Break",ending:"End",other:"Private"},streaming:true,recording:false,password:"secret"});
test("status excludes unrelated data",()=>{assert.equal(status.password,undefined);assert.equal(status.mappings.other,undefined);});
test("combat warning only on mapped intro or break and active campaign",()=>{assert.match(productionWarning(status,{combat:true}),/Combat/);assert.equal(productionWarning({...status,active:false},{combat:true}),null);assert.equal(productionWarning({...status,scene:"End"},{combat:true}),null);});
test("recording warnings opt in",()=>{const s={...status,scene:"Game"};assert.equal(productionWarning(s),null);assert.match(productionWarning(s,{expectRecording:true}),/recording/);});

test("new optional mappings are independent and protected",()=>{const s=normalizeStatus({...status,mappings:{...status.mappings,standby:"Quiet",technical:"Trouble"}});assert.deepEqual(mappedRoles(s),["standby","intro","gameplay","break","technical","ending"]);for(const scene of ["Quiet","Trouble"]){assert.equal(protectedScene({...s,scene}),true);assert.match(productionWarning({...s,scene},{combat:true}),/Combat/);}assert.equal(protectedScene({...s,scene:"Game"}),false);assert.equal(mappedRoles(status).includes("standby"),false);});
