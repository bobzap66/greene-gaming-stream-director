import test from "node:test";
import assert from "node:assert/strict";
import {presentationCSS,combatRows,contentKind,openJournalApplications} from "../scripts/presentation/policy.js";
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
 const element=(...classes)=>({matches:s=>s.split(", ").some(cls=>classes.includes(cls))});
 assert.equal(contentKind(element(".image-popout")),"art");
 assert.equal(contentKind(element(".application",".journal-sheet",".journal-entry")),"journal");
 assert.equal(contentKind(element(".actor-sheet")),null);
 assert.equal(contentKind(element(".journal-entry-page",".journal-sheet",".application")),null);
 assert.equal(contentKind(element(".journal-sheet")),null);
 assert.equal(contentKind({...element(".application",".journal-sheet"),parentElement:{closest:()=>({})}}),null);
 assert.equal(contentKind(null),null);
});

test("PF2e HUD suppression targets persistent children without hiding independent hotbar",()=>{
 const css=presentationCSS({enabled:true,presentationChat:true,presentationPF2eHUD:true});
 assert.match(css,/#pf2e-hud-persistent > :not\(#hotbar\)/);
 assert.doesNotMatch(css,/#hotbar\{display:none/);
 assert.doesNotMatch(presentationCSS({enabled:false,presentationPF2eHUD:true}),/pf2e-hud/);
});

test("registry finds connected parent journal even before rendered flag is true",()=>{
 const el=(...classes)=>({isConnected:true,matches:s=>s.split(", ").some(cls=>classes.includes(cls))});
 const parent={element:el(".application",".journal-sheet",".journal-entry"),rendered:false,close(){}};
 const page={element:el(".application",".journal-sheet",".journal-entry-page"),close(){}};
 const art={element:el(".application",".image-popout"),close(){}};
 const detached={element:{...parent.element,isConnected:false},close(){}};
 assert.deepEqual(openJournalApplications(new Map([[1,parent],[2,page],[3,art],[4,detached]])),[parent]);
 assert.deepEqual(openJournalApplications(undefined),[]);
});
