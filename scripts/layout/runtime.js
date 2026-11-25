import {setting,isObserver,defaultRegions} from "../settings.js";
import {normalizeRegion,pixels} from "./geometry.js";
const original=new Map();
export function region(key){return normalizeRegion(setting("regions")?.[key],defaultRegions[key]);}
export function applyLayout(){
 if(!isObserver()||!setting("layoutEnabled"))return;
 const chat=document.querySelector("#chat");
 if(chat instanceof HTMLElement){
  const r=pixels(region("chat"),innerWidth,innerHeight);
  Object.assign(chat.style,{maxHeight:r.height+"px",maxWidth:r.width+"px"});
 }
}
export function positionPopout(app,html){
 if(!isObserver()||!setting("layoutEnabled"))return;
 const root=html instanceof HTMLElement?html:html?.[0]??app.element;
 if(!(root instanceof HTMLElement))return;
 if(!root.matches(".image-popout, .journal-sheet, .journal-entry")&&!root.querySelector(".journal-entry-content"))return;
 const r=pixels(region("art"),innerWidth,innerHeight);
 if(typeof app.setPosition==="function")app.setPosition({left:r.x,top:r.y,width:r.width,height:r.height});
}
export function registerLayout(){
 Hooks.on("renderApplication",positionPopout);
 Hooks.on("renderApplicationV2",positionPopout);
 Hooks.on("renderChatLog",applyLayout);
 Hooks.once("ready",applyLayout);
 window.addEventListener("resize",applyLayout);
}
