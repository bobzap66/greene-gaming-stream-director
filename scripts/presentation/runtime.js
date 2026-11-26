import {ID,setting,isObserver} from "../settings.js";
import {maintenanceActive} from "./maintenance.js";
import {hideRules,presentationCSS,combatRows,contentKind,openJournalApplications} from "./policy.js";
const showChat=()=>setting("observerMode")==="tabletop"?setting("tabletopShowChat"):setting("presentationChat");
const showCombat=()=>setting("observerMode")==="tabletop"?setting("tabletopShowCombat"):setting("presentationCombat");
let style,queued=false,busy=false,ownedCombat=null,chatActivated=false;
const timers=new Map();
const closing=new Set();
const enabled=()=>game.ready&&isObserver()&&!maintenanceActive()&&setting("presentationEnabled");
function clearTimers(){for(const timer of timers.values())clearTimeout(timer);timers.clear();}
function dismiss(app){
 if(!enabled()||!app||typeof app.close!=="function"||closing.has(app))return;
 const el=app.element?.[0]??app.element;
 const kind=contentKind(el);
 if(kind==="journal"?el.isConnected!==true:!app.rendered)return;
 if(!kind||!setting(kind==="art"?"presentationDismissArt":"presentationDismissJournal"))return;
 if(timers.has(app))return;
 timers.set(app,setTimeout(()=>{
  timers.delete(app);
  const current=app.element?.[0]??app.element;
  if(!enabled()||contentKind(current)!==kind||!(kind==="journal"?current.isConnected:app.rendered)||!setting(kind==="art"?"presentationDismissArt":"presentationDismissJournal"))return;
  closing.add(app);
  Promise.resolve().then(()=>app.close()).catch(e=>console.warn(ID,"Automatic "+kind+" dismissal failed",e)).finally(()=>closing.delete(app));
 },setting("presentationDismissDelay")*1000));
}
function clearApp(app){if(timers.has(app)){clearTimeout(timers.get(app));timers.delete(app);}}
function activeCombat(){
 const scene=canvas?.scene?.id,c=game.combat;
 return !!(scene&&c?.started&&(!c.scene?.id||c.scene.id===scene)&&(!c.sceneId||c.sceneId===scene));
}
function trimCombat(app){
 const el=app?.element?.[0]??app?.element;
 if(!el?.querySelectorAll)return;
 const rows=[...el.querySelectorAll(".combatant[data-combatant-id], li.combatant")];
 const active=rows.findIndex(row=>row.classList.contains("active"));
 const keep=new Set(combatRows(rows.length,active,setting("presentationCombatLimit")));
 rows.forEach((row,i)=>row.toggleAttribute("data-ggsd-combat-hidden",!keep.has(i)));
}
async function reconcile(){
 if(busy){schedule();return;}busy=true;
 try{
  const on=enabled();
  if(on&&setting("presentationDismissJournal")){
   for(const app of openJournalApplications(foundry.applications.instances))dismiss(app);
  }
  if(!style){style=document.createElement("style");style.id="ggsd-presentation";document.head.append(style);}
  const css=presentationCSS({enabled:on,...(on?Object.fromEntries(Object.keys(hideRules).map(k=>[k,setting(k)])): {}),presentationChat:on&&showChat()})+(on&&setting("observerMode")==="tabletop"&&!showChat()?"\n#sidebar, #sidebar-content, #sidebar-tabs{display:none!important;}":"");
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
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;reconcile();});}
export function registerPresentation(){
 for(const event of ["renderApplication","renderApplicationV2"])Hooks.on(event,app=>{dismiss(app);if(enabled())schedule();});
 for(const event of ["closeApplication","closeApplicationV2"])Hooks.on(event,clearApp);
 for(const event of ["updateCombat","createCombat","deleteCombat","updateCombatant","createCombatant","deleteCombatant","combatTurnChange","canvasReady","updateSetting","ggsdMaintenanceChanged"])Hooks.on(event,schedule);
 Hooks.once("ready",()=>{schedule();setInterval(()=>{if(enabled()||ownedCombat)schedule();},1000);});
}
