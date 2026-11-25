import {setting,isObserver,defaultRegions} from "../settings.js";
import {normalizeRegion,pixels} from "./geometry.js";
const original=new WeakMap();
let previousChat=null;
export function region(key){return normalizeRegion(setting("regions")?.[key],defaultRegions[key]);}
export function applyLayout(){
 if(!game.ready)return;
 const enabled=isObserver()&&setting("layoutEnabled");
 const chat=document.querySelector("#chat");
 if(previousChat && (!enabled||previousChat!==chat)){const saved=original.get(previousChat);if(saved!==undefined)previousChat.style.cssText=saved;previousChat=null;}
 if(!enabled)return;
 if(chat instanceof HTMLElement){
  const r=pixels(region("chat"),innerWidth,innerHeight);
  if(previousChat!==chat){original.set(chat,chat.style.cssText);previousChat=chat;}
  Object.assign(chat.style,{position:"fixed",left:r.x+"px",top:r.y+"px",right:"auto",bottom:"auto",width:r.width+"px",height:r.height+"px",maxHeight:r.height+"px",maxWidth:r.width+"px"});
 }
}
export function positionPopout(app,html){
 if(!isObserver()||!setting("layoutEnabled"))return;
 const candidate=app.element instanceof HTMLElement?app.element:html instanceof HTMLElement?html:html?.[0];
 const root=candidate?.closest?.(".application, .app")??candidate;
 if(!(root instanceof HTMLElement))return;
 if(!root.matches(".image-popout, .journal-sheet, .journal-entry")&&!root.querySelector(".journal-entry-content"))return;
 const r=pixels(region("art"),innerWidth,innerHeight);
 if(typeof app.setPosition!=="function")return;
 requestAnimationFrame(()=>{
  if(!root.isConnected||!isObserver()||!setting("layoutEnabled"))return;
  const image=root.matches(".image-popout")?root.querySelector("img"):null;
  if(image){image.style.objectFit="contain";image.style.maxWidth="100%";image.style.maxHeight="100%";}
  app.setPosition({left:r.x,top:r.y,width:r.width,height:r.height});
 });
}
export function registerLayout(){
 Hooks.on("renderApplication",positionPopout);
 Hooks.on("renderApplicationV2",positionPopout);
 Hooks.on("renderChatLog",applyLayout);
 Hooks.once("ready",applyLayout);
 window.addEventListener("resize",applyLayout);
}
