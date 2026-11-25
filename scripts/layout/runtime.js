import {setting,isObserver,defaultRegions} from "../settings.js";
import {normalizeRegion,pixels} from "./geometry.js";
let style,observer,queued=false;
const managed=new Map();
export function region(key){return normalizeRegion(setting("regions")?.[key],defaultRegions[key]);}
function apply(el,values){
 if(!managed.has(el))managed.set(el,new Map());
 const saved=managed.get(el);
 for(const [k,v] of Object.entries(values)){
 if(!saved.has(k))saved.set(k,[el.style.getPropertyValue(k),el.style.getPropertyPriority(k)]);
 if(el.style.getPropertyValue(k)!==v||el.style.getPropertyPriority(k)!=="important")el.style.setProperty(k,v,"important");
 }
}
function restore(el){for(const [k,[v,p]] of managed.get(el)??[])v?el.style.setProperty(k,v,p):el.style.removeProperty(k);managed.delete(el);}
const rule=(selector,r,extra="")=>selector+"{position:fixed!important;left:"+r.x+"vw!important;top:"+r.y+"vh!important;width:"+r.w+"vw!important;right:auto!important;bottom:auto!important;transform:none!important;min-width:0!important;min-height:0!important;box-sizing:border-box!important;"+extra+"}";
export function applyLayout(){
 if(!game.ready)return;
 const enabled=isObserver()&&setting("layoutEnabled");
 const used=new Set();
 let css="";
 if(enabled){
 if(setting("combatEnabled")){const r=region("combat");css+=rule("body #combat-popout",r,"height:auto!important;max-height:"+r.h+"vh!important;overflow:auto!important;");}
 if(setting("artEnabled")){
 const r=region("art");
 css+=rule("body .application.journal-sheet",r,"height:"+r.h+"vh!important;max-width:none!important;max-height:none!important;");
 const b=pixels(r,innerWidth,innerHeight);
 for(const el of document.querySelectorAll(".application.image-popout")){
 const w=el.offsetWidth,h=el.offsetHeight;if(!w||!h)continue;
 const s=Math.min(b.width/w,b.height/h,1);used.add(el);
 apply(el,{position:"fixed",left:(b.x+(b.width-w*s)/2)+"px",top:(b.y+(b.height-h*s)/2)+"px",right:"auto",bottom:"auto","transform-origin":"top left",transform:"scale("+s+")"});
 }
 }
 if(setting("chatEnabled")){
 const sidebar=document.querySelector("#sidebar-content"),chat=document.querySelector("#chat"),parent=document.querySelector("#ui-right");
 if(sidebar&&chat&&parent){
 const r=pixels(region("chat"),innerWidth,innerHeight),b=parent.getBoundingClientRect(),transform=getComputedStyle(parent).transform;
 const m=new DOMMatrix(transform==="none"?undefined:transform),sx=m.a||1,sy=m.d||1;
 const origin=transform==="none"?{left:0,top:0}:b;
 used.add(sidebar);used.add(chat);
 apply(sidebar,{position:"fixed",left:(r.x-origin.left)/sx+"px",top:(r.y-origin.top)/sy+"px",width:r.width/sx+"px",height:r.height/sy+"px","max-width":"none","max-height":"none","min-width":"0","min-height":"0",right:"auto",bottom:"auto",overflow:"hidden",transform:"none"});
 apply(chat,{position:"relative",inset:"auto",width:"100%",height:"100%","max-width":"100%","max-height":"100%","min-width":"0","min-height":"0"});
 css+="#chat .message-content{font-size:"+setting("chatScale")+"%!important;}";
 }
 }
 }
 for(const el of managed.keys())if(!used.has(el)||!el.isConnected)restore(el);
 if(!style&&css){style=document.createElement("style");style.id="ggsd-layout-rules";document.head.append(style);}
 if(style&&style.textContent!==css)style.textContent=css;
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyLayout();});}
export function registerLayout(){
 for(const event of ["renderApplication","renderApplicationV2","renderChatLog","updateSetting","canvasReady"])Hooks.on(event,schedule);
 Hooks.once("ready",()=>{schedule();observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class"]});});
 window.addEventListener("resize",schedule);
}
