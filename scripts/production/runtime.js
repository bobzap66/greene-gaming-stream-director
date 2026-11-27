import {ID,setting} from "../settings.js";
import {roles,normalizeStatus,productionWarning} from "./policy.js";
let transport=null,status=null,root=null,interval=null,busy=false,polling=null,lastWarning=null,lastSuccess=0;
const enabled=()=>game.ready&&game.user?.isGM&&setting("obsProductionEnabled");
const fresh=()=>status&&Date.now()-lastSuccess<8000;
function draw(){
 if(!root)return;
 root.hidden=!enabled();if(!enabled())return;
 const s=fresh()?status:null;
 root.querySelector("[data-obs-status]").textContent=!s?"OBS bridge waiting":!s.enabled?"OBS disabled locally":!s.connected?"OBS disconnected":!s.active?"OBS • another campaign selected":(s.streaming?"LIVE":"Not live")+" · "+(s.recording?"REC":"Not recording");
 root.querySelector("[data-obs-scene]").textContent=s?.connected?s.scene||"Unknown scene":"No current scene";
 const warning=setting("obsProductionWarnings")?productionWarning(s,{combat:!!game.combat?.started&&!!game.combat?.isActive,expectRecording:setting("obsExpectRecording")}):null;
 root.querySelector("[data-obs-warning]").textContent=warning||"";
 if(warning&&warning!==lastWarning)ui.notifications.warn("Stream Director: "+warning);lastWarning=warning;
 for(const b of root.querySelectorAll("[data-obs-role]")){const role=b.dataset.obsRole;b.disabled=busy||!s?.connected||!s.active||!s.mappings[role]||s.mappings[role]===s.scene;b.title=s?.mappings[role]||"Not mapped";b.classList.toggle("active",!!s?.connected&&s.scene===s.mappings[role]);}
}
async function refresh(){
 if(!enabled()){status=null;draw();return;}
 if(!transport||busy||polling===transport){draw();return;}
 const t=transport;polling=t;
 try{const value=await t.request();if(t!==transport||!enabled())return;status=normalizeStatus(value);lastSuccess=Date.now();}
 catch{if(t===transport){status=null;lastSuccess=0;}}
 finally{if(polling===t)polling=null;}
 draw();
}
async function change(role){
 if(!enabled()||busy||!transport||!fresh()||!status.connected||!status.active||!status.mappings[role])return;
 const expectedScene=status.scene,scene=status.mappings[role],t=transport;
 if(role==="gameplay"&&[status.mappings.intro,status.mappings.break,status.mappings.ending].filter(Boolean).includes(expectedScene)){
  if(!confirm("Switch OBS from "+expectedScene+" to "+scene+"? Confirm players are ready and microphones are safe."))return;
 }else if(!confirm("Switch OBS to "+scene+"?"))return;
 if(t!==transport||!fresh()||status.scene!==expectedScene)return;
 busy=true;draw();
 try{status=normalizeStatus(await t.request({role,expectedScene}));lastSuccess=Date.now();}
 catch(e){ui.notifications.warn("OBS: "+e.message);}
 finally{busy=false;await refresh();}
}
function mount(){
 if(root||!enabled())return;
 root=document.createElement("aside");root.id="ggsd-obs-production";
 Object.assign(root.style,{position:"fixed",top:"12px",left:"50%",transform:"translateX(-50%)",zIndex:"100",maxWidth:"min(540px, 85vw)",background:"#171b22",color:"#eee",border:"1px solid #777",borderRadius:"6px",padding:"6px 10px",boxShadow:"0 2px 8px #0008",fontSize:"12px"});
 const header=document.createElement("div");Object.assign(header.style,{display:"flex",justifyContent:"space-between",gap:"12px",alignItems:"center"});
 const connection=document.createElement("strong");connection.dataset.obsStatus="";const toggle=document.createElement("button");toggle.type="button";toggle.textContent="−";toggle.title="Collapse production controls";Object.assign(toggle.style,{width:"26px",height:"24px",padding:"0"});
 header.append(connection,toggle);root.append(header);
 const body=document.createElement("div"),scene=document.createElement("div"),warning=document.createElement("div");scene.dataset.obsScene="";warning.dataset.obsWarning="";warning.style.color="#ffd18a";body.append(scene,warning);
 const buttons=document.createElement("div");Object.assign(buttons.style,{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"5px"});
 for(const [role,label] of Object.entries(roles)){const b=document.createElement("button");b.type="button";b.dataset.obsRole=role;b.textContent=label;Object.assign(b.style,{fontSize:"11px",height:"26px",padding:"3px 6px",width:"auto"});b.onclick=()=>void change(role);buttons.append(b);}
 body.append(buttons);root.append(body);toggle.onclick=()=>{body.hidden=!body.hidden;toggle.textContent=body.hidden?"+":"−";};document.body.append(root);draw();
}
function sync(){if(!enabled()){root?.remove();root=null;clearInterval(interval);interval=null;status=null;return;}mount();if(interval===null)interval=setInterval(()=>void refresh(),2500);void refresh();}
export function registerProduction(){
 game.settings.register(ID,"obsProductionEnabled",{name:"Enable GM OBS production toolbar",hint:"Requires Reactive Portraits OBS setup and paired Chrome extension. GM-only; never starts streams or recordings.",scope:"world",config:true,type:Boolean,default:false,requiresReload:false});
 game.settings.register(ID,"obsProductionWarnings",{name:"OBS production warnings",scope:"world",config:true,type:Boolean,default:true,requiresReload:false});
 game.settings.register(ID,"obsExpectRecording",{name:"Warn if gameplay is not recording",scope:"world",config:true,type:Boolean,default:false,requiresReload:false});
 const module=game.modules.get(ID);
 if(module)module.api=Object.freeze({...module.api,obsProduction:Object.freeze({version:1,attach(t){
  if(!game.ready||!game.user?.isGM||typeof t?.request!=="function")return ()=>{};
  transport=t;void refresh();return ()=>{if(transport===t){transport=null;status=null;lastSuccess=0;draw();}};
 }})});
 Hooks.once("ready",sync);Hooks.on("updateSetting",d=>{if([ID+".obsProductionEnabled",ID+".obsProductionWarnings",ID+".obsExpectRecording"].includes(d?.key))sync();});
 for(const e of ["updateCombat","createCombat","deleteCombat","combatTurnChange"])Hooks.on(e,draw);
}
