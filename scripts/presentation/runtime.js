import {ID,setting,modeSetting,isObserver} from "../settings.js";
import {maintenanceActive} from "./maintenance.js";
import {hideRules,presentationCSS,combatRows,contentKind,openJournalApplications,applicationElement,isUserConfiguration,openUserConfigurations} from "./policy.js";
const showChat=()=>setting("observerMode")==="tabletop"?setting("tabletopShowChat"):modeSetting("presentationChat");
const showCombat=()=>setting("observerMode")==="tabletop"?setting("tabletopShowCombat"):modeSetting("presentationCombat");
let heartbeat=null;
let style,queued=false,busy=false,ownedCombat=null,chatActivated=false;
const timers=new Map();
const closing=new Set();
const enabled=()=>game.ready&&isObserver()&&!maintenanceActive()&&modeSetting("presentationEnabled");
const userConfigEnabled=()=>enabled()&&modeSetting("presentationDismissUserConfig");
const userConfigClass=()=>foundry.applications.sheets?.UserConfig;
function dismissUserConfig(app){
 if(!userConfigEnabled()||!isUserConfiguration(app,userConfigClass())||closing.has(app))return;
 if(applicationElement(app)?.isConnected!==true)return;
 closing.add(app);
 // Wait until the current rendering hook has completed before closing.
 Promise.resolve().then(()=>{
  if(userConfigEnabled()&&isUserConfiguration(app,userConfigClass())&&applicationElement(app)?.isConnected===true)return app.close();
 }).catch(e=>console.warn(ID,"Automatic Player Configuration dismissal failed",e)).finally(()=>closing.delete(app));
}
function clearTimers(){for(const timer of timers.values())clearTimeout(timer);timers.clear();}
function dismiss(app){
 if(!enabled()||!app||typeof app.close!=="function"||closing.has(app))return;
 const el=applicationElement(app);
 const kind=contentKind(el);
 if(kind==="journal"?el.isConnected!==true:!app.rendered)return;
 if(!kind||!modeSetting(kind==="art"?"presentationDismissArt":"presentationDismissJournal"))return;
 if(timers.has(app))return;
 timers.set(app,setTimeout(()=>{
  timers.delete(app);
  const current=applicationElement(app);
  if(!enabled()||contentKind(current)!==kind||!(kind==="journal"?current.isConnected:app.rendered)||!modeSetting(kind==="art"?"presentationDismissArt":"presentationDismissJournal"))return;
  closing.add(app);
  Promise.resolve().then(()=>app.close()).catch(e=>console.warn(ID,"Automatic "+kind+" dismissal failed",e)).finally(()=>closing.delete(app));
 },modeSetting("presentationDismissDelay")*1000));
}
function clearApp(app){if(timers.has(app)){clearTimeout(timers.get(app));timers.delete(app);}}
function activeCombat(){
 const scene=canvas?.scene?.id,c=game.combat;
 return !!(scene&&c?.started&&(!c.scene?.id||c.scene.id===scene)&&(!c.sceneId||c.sceneId===scene));
}
function trimCombat(app){
 const el=applicationElement(app);
 if(!el?.querySelectorAll)return;
 const rows=[...el.querySelectorAll(".combatant[data-combatant-id], li.combatant")];
 const active=rows.findIndex(row=>row.classList.contains("active"));
 const keep=new Set(combatRows(rows.length,active,modeSetting("presentationCombatLimit")));
 rows.forEach((row,i)=>row.toggleAttribute("data-ggsd-combat-hidden",!keep.has(i)));
}
async function reconcile(){
 if(busy){schedule();return;}busy=true;
 try{
  const on=enabled();
  if(userConfigEnabled())for(const app of openUserConfigurations(foundry.applications.instances,userConfigClass()))dismissUserConfig(app);
  if(on&&modeSetting("presentationDismissJournal")){
   for(const app of openJournalApplications(foundry.applications.instances))dismiss(app);
  }
  if(!on&&!style&&!ownedCombat&&!timers.size)return;
  if(!style){style=document.createElement("style");style.id="ggsd-presentation";document.head.append(style);}
  const css=presentationCSS({enabled:on,...(on?Object.fromEntries(Object.keys(hideRules).map(k=>[k,modeSetting(k)])): {}),presentationChat:on&&showChat()})+(on&&setting("observerMode")==="tabletop"&&!showChat()?"\n#sidebar, #sidebar-content, #sidebar-tabs{display:none!important;}":"");
  if(style.textContent!==css)style.textContent=css;
  if(!on){
   clearTimers();chatActivated=false;
   document.querySelectorAll("[data-ggsd-combat-hidden]").forEach(el=>el.removeAttribute("data-ggsd-combat-hidden"));
  }
  if(on&&showChat()){
   if(!chatActivated||ui.chat?.active===false){ui.chat?.activate?.();chatActivated=true;}
   const sidebar=ui.sidebar;
   if(sidebar?.collapsed===true&&typeof sidebar.expand==="function")await sidebar.expand();
  }else chatActivated=false;
  const tracker=ui.combat;
  if(on&&showCombat()&&activeCombat()){
   if(tracker?.renderPopout){
    let pop=tracker.popout;
    if(!pop?.rendered){pop=await tracker.renderPopout();ownedCombat=pop;}
    if(enabled())trimCombat(pop);
   }
  }else{
   if(ownedCombat?.rendered)await ownedCombat.close();
   ownedCombat=null;
   document.querySelectorAll("[data-ggsd-combat-hidden]").forEach(el=>el.removeAttribute("data-ggsd-combat-hidden"));
  }
 }catch(e){console.warn(ID,"Broadcast presentation",e);}finally{busy=false;}
}
function schedule(){if(!game.ready||(!enabled()&&!ownedCombat&&!timers.size&&!style?.textContent)||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;reconcile();});}
export function registerPresentation(){
 for(const event of ["renderApplication","renderApplicationV2"])Hooks.on(event,app=>{dismissUserConfig(app);dismiss(app);if(enabled())schedule();});
 for(const event of ["closeApplication","closeApplicationV2"])Hooks.on(event,clearApp);
 for(const event of ["updateCombat","createCombat","deleteCombat","updateCombatant","createCombatant","deleteCombatant","combatTurnChange","canvasReady","updateSetting","ggsdMaintenanceChanged"])Hooks.on(event,schedule);
 let priorMode;
 function syncPresentationRole(){
  if(!game.ready)return;
  const mode=setting("observerMode");if(priorMode!==undefined&&priorMode!==mode)clearTimers();priorMode=mode;
  if(enabled()){
   if(heartbeat===null)heartbeat=setInterval(schedule,1000);
  }else if(heartbeat!==null){clearInterval(heartbeat);heartbeat=null;}
  schedule();
 }
 Hooks.once("ready",syncPresentationRole);
 Hooks.on("updateSetting",syncPresentationRole);
 Hooks.on("ggsdMaintenanceChanged",syncPresentationRole);
}
