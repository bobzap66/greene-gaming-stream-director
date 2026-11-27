import {registerCues,drawCues} from "./cues.js";
import {ID,setting} from "../settings.js";
import {roles,normalizeStatus,productionWarning,protectedScene,mappedRoles} from "./policy.js";
let transport=null,status=null,root=null,interval=null,busy=false,polling=null,lastWarning=null,lastSuccess=0,lastMappings=null;
const enabled=()=>game.ready&&game.user?.isGM&&setting("obsProductionEnabled");
const fresh=()=>status&&Date.now()-lastSuccess<8000;
const layoutKey=()=>ID+":production-layout:"+game.world.id+":"+game.user.id;
function readLayout(){try{return JSON.parse(localStorage.getItem(layoutKey())||"{}")||{};}catch{return {};}}
function saveLayout(patch){try{localStorage.setItem(layoutKey(),JSON.stringify({...readLayout(),...patch}));}catch{}}
function clampPosition(x,y){
 const w=root.offsetWidth,h=root.offsetHeight;
 root.style.transform="none";root.style.left=Math.max(0,Math.min(x,window.innerWidth-w))+"px";root.style.top=Math.max(0,Math.min(y,window.innerHeight-h))+"px";
}
function resize(){if(root&&root.style.transform==="none"){const r=root.getBoundingClientRect();clampPosition(r.left,r.top);}}
function accept(value){status=normalizeStatus(value);lastSuccess=Date.now();if(status)lastMappings=status;}

function draw(){
 if(!root)return;
 root.hidden=!enabled();if(!enabled())return;
 const s=fresh()?status:null;
 const elapsed=Math.max(0,Date.now()-lastSuccess);
 const cueStatus=s?.cue?{...s,cue:{...s.cue,elapsedMs:s.cue.elapsedMs+elapsed,introRemainingMs:s.cue.introRemainingMs===null?null:Math.max(0,s.cue.introRemainingMs-elapsed),breakTimer:s.cue.breakTimer?.mode==="running"?{...s.cue.breakTimer,remainingMs:Math.max(0,s.cue.breakTimer.remainingMs-elapsed)}:s.cue.breakTimer}}:s;
 drawCues(cueStatus,root.querySelector('[data-obs-cue]'));
 const tools=root.querySelector('[data-break-tools]'),timer=s?.cue?.breakTimer;
 tools.hidden=!(setting("obsBreakEnabled")&&s?.active&&s.connected&&s.scene===s.mappings.break&&timer);
 for(const b of tools.querySelectorAll("button")){const a=b.dataset.action;b.disabled=busy||(a==="pause"&&!(timer?.mode==="running"&&timer.remainingMs>0))||(a==="resume"&&timer?.mode!=="paused")||(a==="extend"&&timer?.mode==="indefinite");b.hidden=(a==="pause"&&timer?.mode==="paused")||(a==="resume"&&timer?.mode!=="paused");}
 root.querySelector("[data-obs-status]").textContent=!s?"OBS bridge waiting":!s.enabled?"OBS disabled locally":!s.connected?"OBS disconnected":!s.active?"OBS • another campaign selected":(s.streaming?"LIVE":"Not live")+" · "+(s.recording?"REC":"Not recording");
 root.querySelector("[data-obs-scene]").textContent=s?.connected?s.scene||"Unknown scene":"No current scene";
 const warning=setting("obsProductionWarnings")?productionWarning(s,{combat:!!game.combat?.started&&!!game.combat?.isActive,expectRecording:setting("obsExpectRecording")}):null;
 const warningNode=root.querySelector("[data-obs-warning]");warningNode.textContent=warning||"";warningNode.hidden=!warning;
 root.style.borderColor=warning?"#e5a84c":"#777";
 root.querySelector("[data-obs-status]").style.color=warning?"#ffd18a":"#eee";
 const mapped=new Set(mappedRoles(s||lastMappings));
 root.querySelector("[data-obs-empty]").hidden=mapped.size>0;
 root.querySelector("[data-obs-empty]").textContent=s?"No production roles mapped.":"Waiting for scene mappings.";
 if(warning&&warning!==lastWarning)ui.notifications.warn("Stream Director: "+warning);lastWarning=warning;
 for(const b of root.querySelectorAll("[data-obs-role]")){const role=b.dataset.obsRole;b.hidden=!mapped.has(role);b.style.display=mapped.has(role)?"":"none";b.disabled=busy||!s?.connected||!s.active||!s.mappings[role]||s.mappings[role]===s.scene;b.title=(s||lastMappings)?.mappings[role]||"Not mapped";const active=!!s?.connected&&s.scene===s.mappings[role];b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));b.style.outline=active?"2px solid #63b98e":"";}
}
async function refresh(){
 if(!enabled()){status=null;draw();return;}
 if(!transport||busy||polling===transport){draw();return;}
 const t=transport;polling=t;
 try{const value=await t.request();if(t!==transport||!enabled())return;accept(value);}
 catch{if(t===transport){status=null;lastSuccess=0;}}
 finally{if(polling===t)polling=null;}
 draw();
}
function chooseBreak(){
 return new Promise(resolve=>{
  const dialog=document.createElement("dialog");Object.assign(dialog.style,{background:"#19212c",color:"#eee",padding:"20px",border:"1px solid #bda66b",borderRadius:"8px",minWidth:"280px"});
  const title=document.createElement("h3");title.textContent="Start intermission";
  const select=document.createElement("select");for(const [v,label] of [["5","5 minutes"],["10","10 minutes"],["15","15 minutes"],["20","20 minutes"],["custom","Custom duration"],["none","Indefinite — no countdown"]]){const o=document.createElement("option");o.value=v;o.textContent=label;select.append(o);}
  select.value="10";const custom=document.createElement("input");custom.type="number";custom.min="1";custom.max="120";custom.step="1";custom.value="10";custom.hidden=true;select.onchange=()=>{custom.hidden=select.value!=="custom";};
  const start=document.createElement("button"),cancel=document.createElement("button");start.textContent="Start Break";cancel.textContent="Cancel";start.type=cancel.type="button";
  let result;start.onclick=()=>{const n=select.value==="none"?null:Number(select.value==="custom"?custom.value:select.value);if(n!==null&&(!Number.isInteger(n)||n<1||n>120)){ui.notifications.warn("Choose 1–120 minutes.");return;}result=n;dialog.close();};cancel.onclick=()=>dialog.close();
  dialog.addEventListener("close",()=>{dialog.remove();resolve(result);},{once:true});dialog.append(title,select,custom,start,cancel);document.body.append(dialog);dialog.showModal();
 });
}
async function adjustBreak(action,minutes){
 if(busy||!enabled()||!fresh()||!status?.active||!status.connected||status.scene!==status.mappings.break||!status.cue?.id||!transport)return;
 const t=transport,expectedScene=status.scene,cueId=status.cue.id;
 if(action==="start"){minutes=await chooseBreak();if(minutes===undefined)return;}
 if(t!==transport||!fresh()||status?.cue?.id!==cueId||!enabled())return;
 busy=true;draw();try{const v=await t.request({breakAction:action,minutes,expectedScene,cueId});if(t===transport&&enabled())accept(v);}catch(e){ui.notifications.warn("OBS: "+e.message);}finally{busy=false;await refresh();}
}
async function change(role){
 if(!enabled()||busy||!transport||!fresh()||!status.connected||!status.active||!status.mappings[role])return;
 const expectedScene=status.scene,scene=status.mappings[role],t=transport;
 let breakMinutes;
 if(role==="break"&&setting("obsBreakEnabled")){breakMinutes=await chooseBreak();if(breakMinutes===undefined)return;}
 else if(role==="gameplay"&&protectedScene(status)){
  if(!confirm("Switch OBS from "+expectedScene+" to "+scene+"? Confirm players are ready and microphones are safe."))return;
 }else if(!confirm("Switch OBS to "+scene+"?"))return;
 if(!enabled()||t!==transport||!fresh()||!status.active||status.scene!==expectedScene||status.mappings[role]!==scene)return;
 busy=true;draw();
 try{const value=await t.request({role,expectedScene,breakMinutes});if(t===transport&&enabled())accept(value);}
 catch(e){ui.notifications.warn("OBS: "+e.message);}
 finally{busy=false;await refresh();}
}
function mount(){
 if(root||!enabled())return;
 root=document.createElement("aside");root.id="ggsd-obs-production";
 Object.assign(root.style,{position:"fixed",top:"12px",left:"50%",transform:"translateX(-50%)",zIndex:"100",maxWidth:"min(540px, 85vw)",background:"#171b22",color:"#eee",border:"1px solid #777",borderRadius:"6px",padding:"6px 10px",boxShadow:"0 2px 8px #0008",fontSize:"12px"});
 const header=document.createElement("div");Object.assign(header.style,{display:"flex",justifyContent:"space-between",gap:"12px",alignItems:"center"});
 const connection=document.createElement("strong");connection.dataset.obsStatus="";const toggle=document.createElement("button");toggle.type="button";toggle.textContent="−";toggle.title="Collapse production controls";Object.assign(toggle.style,{width:"26px",height:"24px",padding:"0"});
 header.style.cursor="move";header.style.touchAction="none";header.title="Drag to move production controls";
 header.append(connection,toggle);root.append(header);
 let drag=null;
 header.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest("button"))return;const rect=root.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};header.setPointerCapture(e.pointerId);e.preventDefault();});
 header.addEventListener("pointermove",e=>{if(drag?.id===e.pointerId)clampPosition(e.clientX-drag.dx,e.clientY-drag.dy);});
 const stop=e=>{if(drag?.id!==e.pointerId)return;drag=null;const rect=root.getBoundingClientRect();saveLayout({x:rect.left,y:rect.top});};
 header.addEventListener("pointerup",stop);header.addEventListener("pointercancel",stop);header.addEventListener("lostpointercapture",stop);
 const body=document.createElement("div"),scene=document.createElement("div"),warning=document.createElement("div");scene.dataset.obsScene="";warning.dataset.obsWarning="";Object.assign(warning.style,{color:"#ffd18a",background:"#5a351a",padding:"5px",fontWeight:"700",borderRadius:"3px"});root.append(warning);const cue=document.createElement('div');cue.dataset.obsCue='';cue.style.color='#e0cd9a';cue.style.fontWeight='bold';root.append(cue);body.append(scene);
 const breakTools=document.createElement("div");breakTools.dataset.breakTools="";breakTools.hidden=true;
 for(const [action,label,minutes] of [["extend","+1 min",1],["extend","+5 min",5],["pause","Pause"],["resume","Resume"],["start","Set timer"],["end","End Break"]]){const b=document.createElement("button");b.type="button";b.dataset.action=action;b.textContent=label;b.style.width="auto";b.onclick=()=>action==="end"?void change("gameplay"):void adjustBreak(action,minutes);breakTools.append(b);}body.append(breakTools);
 const buttons=document.createElement("div");Object.assign(buttons.style,{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"5px"});
 for(const [role,label] of Object.entries(roles)){const b=document.createElement("button");b.type="button";b.dataset.obsRole=role;b.textContent=label;Object.assign(b.style,{fontSize:"11px",height:"26px",padding:"3px 6px",width:"auto"});if(role==="technical"){b.style.color="#ffd18a";b.style.borderColor="#c99044";}b.onclick=()=>void change(role);buttons.append(b);}
 const empty=document.createElement("small");empty.dataset.obsEmpty="";body.append(buttons,empty);root.append(body);
 const layout=readLayout();body.hidden=layout.collapsed===true;toggle.textContent=body.hidden?"+":"−";
 toggle.onclick=()=>{body.hidden=!body.hidden;toggle.textContent=body.hidden?"+":"−";saveLayout({collapsed:body.hidden});resize();};
 document.body.append(root);draw();
 if(Number.isFinite(layout.x)&&Number.isFinite(layout.y))clampPosition(layout.x,layout.y);
 window.addEventListener("resize",resize);
}
function sync(){if(!enabled()){if(game.ready&&game.user?.isGM)drawCues(null,null);root?.remove();root=null;window.removeEventListener("resize",resize);clearInterval(interval);interval=null;status=null;lastMappings=null;lastWarning=null;return;}mount();if(interval===null)interval=setInterval(()=>void refresh(),2500);void refresh();}
export function registerProduction(){
 registerCues();
 game.settings.register(ID,"obsProductionEnabled",{name:"Enable GM OBS production toolbar",hint:"Requires Reactive Portraits OBS setup and paired Chrome extension. GM-only; never starts streams or recordings.",scope:"world",config:true,type:Boolean,default:false,requiresReload:false,onChange:()=>{if(game.ready)sync();}});
 game.settings.register(ID,"obsProductionWarnings",{name:"OBS production warnings",scope:"world",config:true,type:Boolean,default:true,requiresReload:false});
 game.settings.register(ID,"obsExpectRecording",{name:"Warn if gameplay is not recording",scope:"world",config:true,type:Boolean,default:false,requiresReload:false});
 const module=game.modules.get(ID);
 if(module)module.api=Object.freeze({...module.api,obsProduction:Object.freeze({version:1,attach(t){
  if(!game.ready||!game.user?.isGM||typeof t?.request!=="function")return ()=>{};
  transport=t;void refresh();return ()=>{if(transport===t){transport=null;status=null;lastSuccess=0;draw();}};
 }})});
 for(const [role,label] of Object.entries(roles))game.keybindings.register(ID,"obs-"+role,{name:"OBS: "+label,restricted:true,editable:[],onDown:()=>{if(!enabled()||!fresh()||!status.connected||!status.active||!status.mappings[role]||busy)return false;void change(role);return true;}});
 Hooks.once("ready",sync);Hooks.on("updateSetting",d=>{if([ID+".obsProductionEnabled",ID+".obsProductionWarnings",ID+".obsExpectRecording"].includes(d?.key))sync();});
 for(const e of ["updateCombat","createCombat","deleteCombat","combatTurnChange"])Hooks.on(e,draw);
}
