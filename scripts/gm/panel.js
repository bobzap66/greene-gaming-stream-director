import {ID,setting} from "../settings.js";
import {MODES,effectiveCommand,transitionDuration} from "../camera/manual.js";
import {sceneBookmarks,putBookmark,removeBookmark,bookmarkCommand} from "../camera/bookmarks.js";
import {directorMacroCommand} from "../camera/hybrid.js";
let panel, mirrorTimer, mirrorBusy=false, mirrorGeneration=0, commandQueue=Promise.resolve(), pickCleanup;
const labels={auto:"Auto",hold:"Hold",wide:"Wide shot",follow:"Follow token",focus:"Focus point",mirror:"Mirror GM",full:"Full Scene"};
const icons={auto:"fa-crosshairs",hold:"fa-pause",wide:"fa-expand",follow:"fa-person-walking",focus:"fa-location-dot",mirror:"fa-display",full:"fa-map"};
let speed="smooth";
let bookmarkTimer=null,bookmarkGeneration=0,bookmarkReturn=null;
function cancelBookmark(){bookmarkGeneration++;clearTimeout(bookmarkTimer);bookmarkTimer=null;bookmarkReturn=null;}
let bookmarkQueue=Promise.resolve();
const bookmarksFor=scene=>sceneBookmarks(scene?.getFlag(ID,"bookmarks"));
function changeBookmarks(scene,change){
 const task=bookmarkQueue.catch(()=>{}).then(()=>{if(!game.user?.isGM||!scene)return;return scene.setFlag(ID,"bookmarks",change(bookmarksFor(scene)));});
 bookmarkQueue=task;return task;
}
function stopMirror(){mirrorGeneration++;clearInterval(mirrorTimer);mirrorTimer=null;}
function stopPick(){pickCleanup?.();pickCleanup=null;}
function observer(){return game.users.get(setting("observerId"));}
function view(){
 const p=canvas.stage.pivot,s=canvas.stage.scale.x;
 return {x:p.x,y:p.y,scale:s};
}
async function publish(mode,extra={}){
 if(!game.user?.isGM||!canvas.ready)return;
 const sceneId=canvas.scene.id,observerId=setting("observerId");
 if(!observerId){ui.notifications.warn("Select a stream observer in Stream Director settings first.");return;}
 if(mode!=="bookmark")cancelBookmark();
 const command={mode,sceneId,observerId,speed,issuedAt:Date.now(),...extra};
 const task=commandQueue.catch(()=>{}).then(()=>game.settings.set(ID,"cameraCommand",command));
 commandQueue=task;
 await task;refreshPanel();return command;
}
function safeAction(fn){return (...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>{console.error(ID,e);ui.notifications.error("Stream Director: "+e.message);});}
function startMirror(){
 stopMirror();
 const generation=mirrorGeneration, scene=canvas.scene.id;
 let last="";
 mirrorTimer=setInterval(async()=>{
  if(mirrorBusy||generation!==mirrorGeneration||!canvas.ready||canvas.scene.id!==scene||setting("cameraCommand")?.mode!=="mirror"||setting("cameraCommand")?.sceneId!==scene)return;
  const v=view(),key=[Math.round(v.x),Math.round(v.y),v.scale.toFixed(3)].join(",");
  if(key===last)return;
  mirrorBusy=true;
  try{await publish("mirror",v);last=key;}catch(e){console.error(ID,e);}finally{mirrorBusy=false;}
 },400);
}
function choosePoint(){
 const stage=canvas.stage;
 ui.notifications.info("Click a location on the canvas to focus; Escape cancels.");
 const el=canvas.app?.canvas??canvas.app?.view;
 if(!el?.addEventListener){ui.notifications.warn("Canvas unavailable.");return;}
 const click=e=>{
  e.preventDefault();e.stopImmediatePropagation();
  const bounds=el.getBoundingClientRect();
  const screen=canvas.app.renderer.screen;
  const p=stage.toLocal({x:(e.clientX-bounds.left)*screen.width/bounds.width,y:(e.clientY-bounds.top)*screen.height/bounds.height});
  stopPick();safeAction(()=>publish("focus",{x:p.x,y:p.y,scale:view().scale}))();
 };
 const key=e=>{if(e.key==="Escape"){e.preventDefault();stopPick();}};
 el.addEventListener("click",click,true);window.addEventListener("keydown",key,true);
 pickCleanup=()=>{el.removeEventListener("click",click,true);window.removeEventListener("keydown",key,true);};
}
async function recallBookmark(extra){
 const previous=bookmarkReturn??effectiveCommand(setting("cameraCommand"),canvas.scene.id,setting("observerId"));
 cancelBookmark();const generation=bookmarkGeneration;
 bookmarkReturn=previous.mode==="bookmark"?{mode:"auto"}:previous;
 stopMirror();stopPick();
 const command=await publish("bookmark",extra);
 if(!command||generation!==bookmarkGeneration)return;
 if(setting("bookmarkIndefinite")||setting("observerMode")==="tabletop")return;
 const delay=setting("bookmarkHold")*1000+transitionDuration(extra.speed,setting("transition"));
 bookmarkTimer=setTimeout(safeAction(async()=>{
  if(generation!==bookmarkGeneration||!canvas.ready||canvas.scene.id!==command.sceneId||setting("observerId")!==command.observerId)return;
  const live=setting("cameraCommand");if(live?.mode!=="bookmark"||live.issuedAt!==command.issuedAt||live.bookmarkId!==command.bookmarkId){cancelBookmark();return;}
  const prior=bookmarkReturn??{mode:"auto"};cancelBookmark();
  if(prior.mode==="mirror"){await publish("mirror",{...view(),speed:prior.speed});startMirror();return;}
  const {mode,tokenId,x,y,scale,speed:priorSpeed}=prior;
  if(mode==="follow"&&(!canvas.tokens.get(tokenId)||canvas.tokens.get(tokenId).document.hidden)){await publish("auto");return;}
  const fields={};for(const [k,v] of Object.entries({tokenId,x,y,scale,speed:priorSpeed}))if(v!==undefined)fields[k]=v;
  await publish(mode,fields);
 }),delay);
}
export async function selectMode(mode){
 if(!game.user?.isGM||!canvas.ready||!MODES.includes(mode))return;
 cancelBookmark();stopMirror();stopPick();
 if(mode==="follow"){
  const selected=canvas.tokens.controlled;
  if(selected.length!==1){ui.notifications.warn("Select exactly one token to follow.");return;}
  if(selected[0].document.hidden){ui.notifications.warn("Hidden tokens cannot be followed.");return;}
  await publish(mode,{tokenId:selected[0].id});return;
 }
 if(mode==="focus"){choosePoint();return;}
 if(mode==="mirror"){await publish(mode,view());if(setting("observerMode")!=="tabletop")startMirror();return;}
 await publish(mode);
}
function refreshPanel(){
 if(!panel?.rendered||!game.user?.isGM)return;
 const root=panel.element;
 const command=effectiveCommand(setting("cameraCommand"),canvas.scene?.id,setting("observerId"));
 const status=root.querySelector("[data-status]");
 if(status)status.textContent=observer()?.active?"Observer online":observer()?"Observer offline":"No observer assigned";
 const style=root.querySelector("[data-combat-style]");
 if(style)style.value=setting("combatStyle");
 const current=root.querySelector("[data-mode]");
 if(current)current.textContent=(setting("observerMode")==="tabletop"?"Tabletop · ":"")+(command.mode==="bookmark"?"Bookmark: "+(bookmarksFor(canvas.scene).find(b=>b.id===command.bookmarkId)?.name??"Saved shot"):(labels[command.mode]??"Auto"));
 refreshBookmarks(root,command);
 for(const b of root.querySelectorAll("[data-camera]")){b.classList.toggle("active",b.dataset.camera===command.mode);const tabletop=setting("observerMode")==="tabletop";if(b.dataset.camera==="mirror")b.title=tabletop?"Center display on current GM view (one time)":"Mirror GM";if(b.dataset.camera==="follow")b.title=tabletop?"Center display on selected visible token (one time)":"Follow token";if(["wide","full"].includes(b.dataset.camera))b.title=tabletop?"Center on map without changing scale":labels[b.dataset.camera];}
}
function refreshBookmarks(root,command){
 const section=root.querySelector("[data-bookmarks]");
 if(!section)return;
 const scene=canvas.ready?canvas.scene:null;
 const list=bookmarksFor(scene);
 const signature=JSON.stringify([scene?.id,list,command.mode,command.bookmarkId]);
 if(section.dataset.signature===signature)return;
 section.dataset.signature=signature;section.replaceChildren();
 const heading=document.createElement("strong");heading.textContent="Scene bookmarks"+(scene?" — "+scene.name:"");section.append(heading);
 const form=document.createElement("div");Object.assign(form.style,{display:"flex",gap:"5px"});
 const name=document.createElement("input");name.type="text";name.placeholder="Shot name";name.maxLength=80;name.disabled=!scene;form.append(name);
 const save=document.createElement("button");save.type="button";save.textContent="Save GM view";save.disabled=!scene;
 save.onclick=safeAction(async()=>{
  if(!game.user?.isGM||!canvas.ready||canvas.scene.id!==scene?.id)return;
  if(!name.value.trim()){ui.notifications.warn("Enter a bookmark name.");return;}
  const bookmark={id:foundry.utils.randomID(),name:name.value,...view(),speed};
  await changeBookmarks(scene,data=>putBookmark(data,bookmark));name.value="";refreshPanel();
 });form.append(save);section.append(form);
 const rows=document.createElement("div");Object.assign(rows.style,{display:"grid",gap:"4px",maxHeight:"180px",overflowY:"auto"});
 if(!list.length){const empty=document.createElement("small");empty.textContent="No saved shots on this scene.";rows.append(empty);}
 for(const shot of list){
  const row=document.createElement("div");Object.assign(row.style,{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto auto auto",gap:"4px"});
  const recall=document.createElement("button");recall.type="button";recall.textContent=shot.name;recall.title=shot.scale.toFixed(2)+"× · "+shot.speed;recall.classList.toggle("active",command.mode==="bookmark"&&command.bookmarkId===shot.id);
  recall.onclick=safeAction(async()=>{if(!game.user?.isGM||!canvas.ready||canvas.scene.id!==scene.id)return;const fresh=bookmarksFor(scene).find(b=>b.id===shot.id);const extra=bookmarkCommand(fresh);if(!extra)return;await recallBookmark(extra);});
  const transition=document.createElement("select");transition.title="Saved transition";
  for(const [value,label] of [["cut","Cut"],["smooth","Smooth"],["cinematic","Cinematic"]]){const opt=document.createElement("option");opt.value=value;opt.textContent=label;transition.append(opt);}
  transition.value=shot.speed;transition.onchange=safeAction(async()=>{const value=transition.value;await changeBookmarks(scene,data=>{const fresh=data.find(b=>b.id===shot.id);return fresh?putBookmark(data,{...fresh,speed:value}):data;});refreshPanel();});
  const update=document.createElement("button");update.type="button";update.textContent="Update";update.title="Replace with current GM view";update.onclick=safeAction(async()=>{if(!game.user?.isGM||!canvas.ready||canvas.scene.id!==scene.id)return;const position=view();await changeBookmarks(scene,data=>{const fresh=data.find(b=>b.id===shot.id);return fresh?putBookmark(data,{...fresh,...position}):data;});refreshPanel();});
  const del=document.createElement("button");del.type="button";del.textContent="×";del.title="Delete saved shot";del.onclick=safeAction(async()=>{if(!game.user?.isGM)return;const confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:"Delete camera bookmark"},content:"<p>Delete this saved shot?</p>"});if(!confirmed)return;await changeBookmarks(scene,data=>removeBookmark(data,shot.id));refreshPanel();});
  row.append(recall,transition,update,del);rows.append(row);
 }
 section.append(rows);
}
export function registerGMDirector(){
 const {ApplicationV2}=foundry.applications.api;
 class DirectorPanel extends ApplicationV2{
  static DEFAULT_OPTIONS={id:"ggsd-director",window:{title:"Stream Director",resizable:true},position:{width:480,height:560}};
  async _renderHTML(){panel=this;return document.createElement("div");}
  _replaceHTML(result,content){
   content.replaceChildren(result);Object.assign(result.style,{display:"grid",gap:"8px",padding:"4px"});
   const status=document.createElement("div");status.dataset.status="";result.append(status);
   const current=document.createElement("div");current.dataset.mode="";current.style.fontWeight="bold";result.append(current);
   const grid=document.createElement("div");Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:"5px"});
   for(const mode of MODES){
    const b=document.createElement("button");b.type="button";b.dataset.camera=mode;b.title=mode==="wide"?"Frame explored and visible areas":mode==="full"?"Frame the entire map":labels[mode];
    Object.assign(b.style,{height:"56px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",fontSize:"11px",lineHeight:"1.1",padding:"4px"});
    const icon=document.createElement("i");icon.className="fas "+icons[mode];const label=document.createElement("span");label.textContent=labels[mode];b.append(icon,label);b.onclick=safeAction(()=>selectMode(mode));grid.append(b);
   }
   result.append(grid);
   const label=document.createElement("label");label.textContent="Transition ";
   const select=document.createElement("select");
   for(const [value,name] of [["cut","Cut"],["smooth","Smooth"],["cinematic","Cinematic"]]){const opt=document.createElement("option");opt.value=value;opt.textContent=name;select.append(opt);}
   select.value=speed;select.onchange=()=>{speed=select.value;};label.append(select);result.append(label);
   const combatLabel=document.createElement("label");combatLabel.textContent="Combat style ";
   const combatStyle=document.createElement("select");combatStyle.dataset.combatStyle="";
   for(const [value,name] of [["tactical","Tactical"],["cinematic","Cinematic"],["hybrid","Hybrid"]]){const opt=document.createElement("option");opt.value=value;opt.textContent=name;combatStyle.append(opt);}
   combatStyle.value=setting("combatStyle");combatStyle.onchange=safeAction(async()=>{if(game.user?.isGM)await game.settings.set(ID,"combatStyle",combatStyle.value);});combatLabel.append(combatStyle);result.append(combatLabel);
   const macro=document.createElement("button");macro.type="button";macro.textContent="Create director hotbar macro";macro.onclick=safeAction(async()=>{
    if(!game.user?.isGM)return;
    let existing=game.macros.find(m=>m.type==="script"&&m.command===directorMacroCommand);
    if(!existing)existing=await Macro.create({name:"Open Stream Director",type:"script",img:"icons/svg/video.svg",command:directorMacroCommand});
    if(existing)ui.notifications.info("Open Stream Director macro is ready. Drag it from the Macros directory onto your hotbar.");
   });result.append(macro);
   const bookmarks=document.createElement("section");bookmarks.dataset.bookmarks="";Object.assign(bookmarks.style,{display:"grid",gap:"5px"});result.append(bookmarks);
   const note=document.createElement("small");note.textContent="Wide: explored area. Full: entire map. Follow: select one token. Focus: click the map. Scene changes reset Auto.";result.append(note);
   requestAnimationFrame(refreshPanel);
  }
 }
 function open(){if(!game.user?.isGM)return;panel??=new DirectorPanel();if(panel.rendered){panel.bringToFront();return panel;}panel.render(true);return panel;}
 const module=game.modules.get(ID);if(module)module.api=Object.freeze({openDirector:open});
 game.settings.registerMenu(ID,"gmDirector",{name:"GM Camera Director",label:"Open camera director",hint:"Direct the designated stream observer only.",icon:"fas fa-video",type:DirectorPanel,restricted:true});
 const bindings={open:["KeyD",()=>{open();return true;}],auto:["Digit1",()=>{safeAction(()=>selectMode("auto"))();return true;}],hold:["Digit2",()=>{safeAction(()=>selectMode("hold"))();return true;}],wide:["Digit3",()=>{safeAction(()=>selectMode("wide"))();return true;}],follow:["Digit4",()=>{safeAction(()=>selectMode("follow"))();return true;}],focus:["Digit5",()=>{safeAction(()=>selectMode("focus"))();return true;}],mirror:["Digit6",()=>{safeAction(()=>selectMode("mirror"))();return true;}],full:["Digit7",()=>{safeAction(()=>selectMode("full"))();return true;}]};
 for(const [key,[code,action]] of Object.entries(bindings))game.keybindings.register(ID,"director-"+key,{name:"Stream Director: "+key,editable:[{key:code,modifiers:["Alt","Shift"]}],restricted:true,onDown:()=>game.user?.isGM?action():false});
 Hooks.once("ready",()=>{
  if(!game.user?.isGM)return;
  Hooks.on("updateScene",scene=>{if(scene.id===canvas.scene?.id)refreshPanel();});
  Hooks.on("updateSetting",refreshPanel);Hooks.on("userConnected",refreshPanel);
  Hooks.on("canvasTearDown",()=>{cancelBookmark();stopPick();stopMirror();});
  Hooks.on("canvasReady",()=>{if(setting("cameraCommand")?.mode!=="auto")safeAction(()=>publish("auto"))();refreshPanel();});
  if(setting("cameraCommand")?.mode!=="auto"&&canvas.ready)safeAction(()=>publish("auto"))();
 });
}
