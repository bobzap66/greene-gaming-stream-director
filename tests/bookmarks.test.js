import test from "node:test";
import assert from "node:assert/strict";
import {sceneBookmarks,putBookmark,removeBookmark,bookmarkCommand} from "../scripts/camera/bookmarks.js";
import {effectiveCommand,manualTarget} from "../scripts/camera/manual.js";
const b={id:"b",name:" Witness stand ",x:200,y:300,scale:1.2,speed:"cut"};
test("save validates and normalizes bookmark without mutating original",()=>{
 const old=[];const saved=putBookmark(old,b);
 assert.deepEqual(old,[]);assert.equal(saved[0].name,"Witness stand");
 assert.throws(()=>putBookmark(saved,{...b,scale:0}));
 assert.throws(()=>putBookmark(saved,{...b,name:" "}));
 assert.deepEqual(sceneBookmarks([null,b,{...b,x:NaN}]),[b]);
});
test("update preserves other shots and delete only removes selected ID",()=>{
 const list=putBookmark(putBookmark([],b),{...b,id:"c"});
 const updated=putBookmark(list,{...b,x:500,speed:"cinematic"});
 assert.equal(updated.length,2);assert.equal(updated[0].x,500);
 assert.deepEqual(updated[1],list[1]);assert.deepEqual(removeBookmark(updated,"b"),[list[1]]);
});
test("bookmark recall respects scene and observer command scope",()=>{
 const command={mode:"bookmark",sceneId:"s",observerId:"o",...bookmarkCommand(b)};
 assert.equal(effectiveCommand(command,"s","o"),command);
 assert.equal(effectiveCommand(command,"other","o").mode,"auto");
 assert.equal(effectiveCommand(command,"s","other").mode,"auto");
 assert.equal(effectiveCommand({...command,scale:NaN},"s","o").mode,"auto");
});
test("bookmark recall centers in broadcast region and caps zoom",()=>{
 const command={mode:"bookmark",...bookmarkCommand(b)};
 assert.deepEqual(manualTarget(command,{rect:{x:100,y:100,width:800,height:400},center:{x:600,y:400},maxScale:1}),{x:300,y:400,scale:1});
});
