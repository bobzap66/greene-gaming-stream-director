import {ID,setting} from "../settings.js";
import {MODES,effectiveCommand} from "../camera/manual.js";
let panel, mirrorTimer, mirrorBusy=false, mirrorGeneration=0, commandQueue=Promise.resolve(), pickCleanup;
const labels={auto:"Auto",hold:"Hold",wide:"Wide shot",follow:"Follow token",focus:"Focus point",mirror:"Mirror GM"};
const icons={auto:"fa-crosshairs",hold:"fa-pause",wide:"fa-expand",follow:"fa-person-walking",focus:"fa-location-dot",mirror:"fa-display"};
let speed="smooth";
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
 const command={mode,sceneId,observerId,speed,issuedAt:Date.now(),...extra};
 const task=commandQueue.catch(()=>{}).then(()=>game.settings.set(ID,"cameraCommand",command));
 commandQueue=task;
 await task;refreshPanel();
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
 if(!el){ui.notifications.warn("Canvas unavailable.");return;}
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
export async function selectMode(mode){
 if(!game.user?.isGM||!canvas.ready||!MODES.includes(mode))return;
 stopMirror();stopPick();
 if(mode==="follow"){
  const selected=canvas.tokens.controlled;
  if(selected.length!==1){ui.notifications.warn("Select exactly one token to follow.");return;}
  if(selected[0].document.hidden){ui.notifications.warn("Hidden tokens cannot be followed.");return;}
  await publish(mode,{tokenId:selected[0].id});return;
 }
 if(mode==="focus"){choosePoint();return;}
 if(mode==="mirror"){await publish(mode,view());startMirror();return;}
 await publish(mode);
}
function refreshPanel(){
 if(!panel?.rendered)return;
 const root=panel.element;
 const command=effectiveCommand(setting("cameraCommand"),canvas.scene?.id,setting("observerId"));
 const status=root.querySelector("[data-status]");
 if(status)status.textContent=observer()?.active?"Observer online":observer()?"Observer offline":"No observer assigned";
 const current=root.querySelector("[data-mode]");
 if(current)current.textContent=labels[command.mode]??"Auto";
 for(const b of root.querySelectorAll("[data-camera]"))b.classList.toggle("active",b.dataset.camera===command.mode);
}
export function registerGMDirector(){
 const {ApplicationV2}=foundry.applications.api;
 class DirectorPanel extends ApplicationV2{
  static DEFAULT_OPTIONS={id:"ggsd-director",window:{title:"Stream Director",resizable:true},position:{width:330,height:"auto"}};
  async _renderHTML(){return document.createElement("div");}
  _replaceHTML(result,content){
   content.replaceChildren(result);Object.assign(result.style,{display:"grid",gap:"8px",padding:"4px"});
   const status=document.createElement("div");status.dataset.status="";result.append(status);
   const current=document.createElement("div");current.dataset.mode="";current.style.fontWeight="bold";result.append(current);
   const grid=document.createElement("div");Object.assign(grid.style,{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"5px"});
   for(const mode of MODES){
    const b=document.createElement("button");b.type="button";b.dataset.camera=mode;b.title=labels[mode];
    Object.assign(b.style,{height:"56px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",fontSize:"11px",lineHeight:"1.1",padding:"4px"});
    const icon=document.createElement("i");icon.className="fas "+icons[mode];const label=document.createElement("span");label.textContent=labels[mode];b.append(icon,label);b.onclick=safeAction(()=>selectMode(mode));grid.append(b);
   }
   result.append(grid);
   const label=document.createElement("label");label.textContent="Transition ";
   const select=document.createElement("select");
   for(const [value,name] of [["cut","Cut"],["smooth","Smooth"],["cinematic","Cinematic"]]){const opt=document.createElement("option");opt.value=value;opt.textContent=name;select.append(opt);}
   select.value=speed;select.onchange=()=>{speed=select.value;};label.append(select);result.append(label);
   const note=document.createElement("small");note.textContent="Follow: select one token. Focus: click the map. Manual modes reset on scene changes.";result.append(note);
   requestAnimationFrame(refreshPanel);
  }
 }
 function open(){if(!game.user?.isGM)return;panel??=new DirectorPanel();panel.render(true);}
 game.settings.registerMenu(ID,"gmDirector",{name:"GM Camera Director",label:"Open camera director",hint:"Direct the designated stream observer only.",icon:"fas fa-video",type:DirectorPanel,restricted:true});
 const bindings={open:["KeyD",()=>{open();return true;}],auto:["Digit1",()=>{safeAction(()=>selectMode("auto"))();return true;}],hold:["Digit2",()=>{safeAction(()=>selectMode("hold"))();return true;}],wide:["Digit3",()=>{safeAction(()=>selectMode("wide"))();return true;}],follow:["Digit4",()=>{safeAction(()=>selectMode("follow"))();return true;}],focus:["Digit5",()=>{safeAction(()=>selectMode("focus"))();return true;}],mirror:["Digit6",()=>{safeAction(()=>selectMode("mirror"))();return true;}]};
 for(const [key,[code,action]] of Object.entries(bindings))game.keybindings.register(ID,"director-"+key,{name:"Stream Director: "+key,editable:[{key:code,modifiers:["Alt","Shift"]}],restricted:true,onDown:()=>game.user?.isGM?action():false});
 Hooks.on("updateSetting",refreshPanel);Hooks.on("userConnected",refreshPanel);
 Hooks.on("canvasTearDown",()=>{stopPick();stopMirror();});
 Hooks.on("canvasReady",()=>{if(game.user?.isGM&&setting("cameraCommand")?.mode!=="auto")safeAction(()=>publish("auto"))();refreshPanel();});
 Hooks.once("ready",()=>{if(game.user?.isGM&&setting("cameraCommand")?.mode!=="auto"&&canvas.ready)safeAction(()=>publish("auto"))();});
}
