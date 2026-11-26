import test from "node:test";
import assert from "node:assert/strict";
import {presentationCSS,combatRows,contentKind} from "../scripts/presentation/policy.js";
test("disabled presentation emits no CSS",()=>assert.equal(presentationCSS({enabled:false,presentationPause:true}),""));
test("selected interface elements hidden without hiding canvas or entire sidebar",()=>{
 const css=presentationCSS({enabled:true,presentationChat:true,presentationPause:true,presentationHotbar:true});
 assert.match(css,/#pause/);assert.match(css,/#hotbar/);assert.match(css,/#sidebar-tabs/);
 assert.doesNotMatch(css,/#controls|#chat\{display|#sidebar\{display/);
});
test("chat can be disabled independently",()=>assert.match(presentationCSS({enabled:true,presentationChat:false}),/#chat\{display:none/));
test("combat row limit follows active combatant and clamps at end",()=>{
 assert.deepEqual(combatRows(8,3,3),[3,4,5]);
 assert.deepEqual(combatRows(8,7,3),[5,6,7]);
 assert.deepEqual(combatRows(2,-1,3),[0,1]);
 assert.deepEqual(combatRows(0,-1,3),[]);
});
test("content detection is limited to image and journal windows",()=>{
 const element=cls=>({matches:s=>s.split(", ").includes(cls)});
 assert.equal(contentKind(element(".image-popout")),"art");
 assert.equal(contentKind(element(".journal-sheet")),"journal");
 assert.equal(contentKind(element(".actor-sheet")),null);
 assert.equal(contentKind(null),null);
});
