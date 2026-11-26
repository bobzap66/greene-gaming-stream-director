import test from "node:test";
import assert from "node:assert/strict";
import {combatStyleShot,directorMacroCommand} from "../scripts/camera/hybrid.js";
const a={id:"a"},b={id:"b"},c={id:"c"},tactical=[a,b,c],initiative={kind:"cinematic",points:[a]},action=[a,b];
test("hybrid stays wide during decision-making and targeting",()=>assert.deepEqual(combatStyleShot("hybrid",initiative,tactical,null),{kind:"tactical",points:tactical}));
test("hybrid tightens during action and returns wide when hold expires",()=>{
 assert.deepEqual(combatStyleShot("hybrid",initiative,tactical,action),{kind:"cinematic",points:action});
 assert.deepEqual(combatStyleShot("hybrid",initiative,tactical,null),{kind:"tactical",points:tactical});
});
test("establishing and hidden actor tactical fallback takes precedence",()=>{
 for(const style of ["hybrid","cinematic"])assert.deepEqual(combatStyleShot(style,{kind:"tactical",points:tactical},tactical,action),{kind:"tactical",points:tactical});
});
test("cinematic preserves initiative and action framing",()=>{
 assert.deepEqual(combatStyleShot("cinematic",initiative,tactical,null),initiative);
 assert.deepEqual(combatStyleShot("cinematic",initiative,tactical,action),{kind:"cinematic",points:action});
});
test("tactical ignores action framing",()=>assert.deepEqual(combatStyleShot("tactical",initiative,tactical,action),{kind:"tactical",points:tactical}));
test("macro invokes module API without requiring internal panel reference",()=>{
 let called=0;
 const game={modules:new Map([["greene-gaming-stream-director",{api:{openDirector:()=>called++}}]])};
 new Function("game",directorMacroCommand)(game);
 assert.equal(called,1);
 new Function("game",directorMacroCommand)({modules:new Map()});
});
