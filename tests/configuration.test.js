import test from "node:test";
import assert from "node:assert/strict";
import {portableKeys,presets,makeDocument,parseDocument,validateSettings,changesFor,applyChanges} from "../scripts/configuration/policy.js";
const specs={observerMode:{type:String,choices:{broadcast:"Broadcast",tabletop:"Tabletop"}},combatStyle:{type:String,choices:{tactical:"Tactical",cinematic:"Cinematic",hybrid:"Hybrid"}},transition:{type:Number,range:{min:100,max:2000}},presentationEnabled:{type:Boolean},regions:{type:Object,default:{camera:{x:0,y:0,w:100,h:100}}}};
const spec=k=>specs[k]?{...specs[k],scope:"world"}:undefined;
test("portable keys exclude sensitive and world-specific state",()=>{
 for(const k of ["observerId","enabled","integrationRoster","integrationGMEnabled","integrationEnabled","integrationHealth","integrationRosterOnly","cameraCommand","dismissCommand","tabletopWidth","displayProfiles","tabletopCalibration","tabletopPositions","sharingDestination","customPresets"])assert.ok(!portableKeys.includes(k),k);
 for(const p of Object.values(presets))for(const k of Object.keys(p.values))assert.ok(portableKeys.includes(k),k);
});
test("portable document validates format and partial settings",()=>{
 const d=makeDocument("test",{observerMode:"broadcast",transition:750});
 assert.deepEqual(parseDocument(d,spec),d);
 assert.throws(()=>parseDocument({...d,version:2},spec));
 assert.throws(()=>validateSettings({observerId:"secret"},spec));
 assert.throws(()=>validateSettings(JSON.parse('{"__proto__":{}}'),spec));
 assert.throws(()=>validateSettings({transition:"750"},spec));
 assert.throws(()=>validateSettings({transition:3000},spec));
 assert.throws(()=>validateSettings({observerMode:"invalid"},spec));
 assert.throws(()=>validateSettings({presentationEnabled:1},spec));
});
test("layout geometry must contain known regions and finite bounded coordinates",()=>{
 const regions={camera:{x:2,y:3,w:90,h:90}};
 assert.deepEqual(validateSettings({regions},spec),{regions});
 for(const bad of [{camera:{x:90,y:0,w:20,h:20}},{camera:{x:0,y:0,w:9,h:100}},{camera:{x:0,y:0,w:100,h:NaN}},{other:regions.camera}])assert.throws(()=>validateSettings({regions:bad},spec));
});
test("preview excludes unchanged values and does not write",()=>{
 const current={observerMode:"broadcast",transition:750};
 assert.deepEqual(changesFor({observerMode:"broadcast",transition:1000},k=>current[k],spec),[{key:"transition",previous:750,value:1000,reload:false}]);
 assert.equal(current.transition,750);
});
test("failed writes attempt rollback",async()=>{
 const current={a:1,b:2};let fail=true;
 await assert.rejects(applyChanges([{key:"a",previous:1,value:3},{key:"b",previous:2,value:4}],async(k,v)=>{current[k]=v;if(k==="b"&&fail){fail=false;throw Error("write failed");}}),/previous settings restored/);
 assert.deepEqual(current,{a:1,b:2});
});
