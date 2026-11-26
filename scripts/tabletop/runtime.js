import {ID,setting,isObserver} from "../settings.js";
import {physicalScale,tabletopTarget,displaySignature} from "./policy.js";
import {effectiveCommand} from "../camera/manual.js";
export const tabletopMode=()=>setting("observerMode")==="tabletop";
const active=()=>game.ready&&isObserver()&&setting("enabled")&&tabletopMode();
let installed=false,allow=0,lastCommand=null,lastScene=null,lastScale=null,queued=false,warned="",calibrating=false;
const signature=()=>displaySignature({width:screen.width,height:screen.height,dpr:devicePixelRatio});
const calibration=()=>setting("tabletopCalibration");
function pixelsPerInch(){
 const c=calibration();
 if(c?.signature===signature()&&Number.isFinite(c.ppi)&&c.ppi>0)return c.ppi;
 if(c?.ppi&&c.signature!==signature())return null;
 const width=setting("tabletopWidth");
 return width>0?screen.width/width:null;
}
function scale(){
 if(canvas.scene?.grid?.type===0)return null;
 return physicalScale(pixelsPerInch(),setting("tabletopGridInches"),canvas.grid?.size);
}
function warnOnce(message){if(warned!==message){warned=message;ui.notifications.warn(message);}}
function wrap(method){
 const proto=foundry.canvas.Canvas.prototype;
 if(typeof proto[method]!=="function")return false;
 const gate=function(wrapped,...args){
  if(active()&&canvas.ready&&!allow)return method==="animatePan"?Promise.resolve():undefined;
  return wrapped(...args);
 };
 if(globalThis.libWrapper&&!globalThis.libWrapper.is_fallback)globalThis.libWrapper.register(ID,"foundry.canvas.Canvas.prototype."+method,gate,"MIXED");
 else{
  const original=proto[method];
  proto[method]=function(...args){return gate.call(this,original.bind(this),...args);};
 }
 return true;
}
function install(){
 if(installed)return;installed=true;
 try{if(!wrap("pan")||!wrap("animatePan"))warnOnce("Tabletop: camera lock API unavailable; do not place miniatures until verified.");}
 catch(e){console.error(ID,e);warnOnce("Tabletop: camera lock installation failed.");}
}
function deliberatePan(target){
 const bounds=canvas.dimensions?.scale;
 const min=bounds?.min,max=bounds?.max;
 allow++;
 try{
  if(bounds&&Number.isFinite(min)&&target.scale<min)bounds.min=target.scale;
  if(bounds&&Number.isFinite(max)&&target.scale>max)bounds.max=target.scale;
  return canvas.pan(target);
 }finally{
  if(bounds&&Number.isFinite(min))bounds.min=min;
  if(bounds&&Number.isFinite(max))bounds.max=max;
  allow--;
 }
}
function reconcile(){
 if(!active()||!canvas.ready){lastScene=null;lastCommand=null;lastScale=null;return;}
 install();
 const s=scale(),scene=canvas.scene.id;
 const c=calibration();
 if(c?.ppi&&c.signature!==signature())warnOnce("Tabletop: display metrics changed. Recalibrate before placing miniatures.");
 if(!s){warnOnce("Tabletop: calibrate the display with Alt+Shift+C or enter its physical width. Gridless scenes retain their existing scale.");}
 const stage=canvas.stage,current={x:stage.pivot.x,y:stage.pivot.y,scale:stage.scale.x};
 const raw=setting("cameraCommand"),command=effectiveCommand(raw,scene,game.user.id);
 const sceneChanged=scene!==lastScene;
 const changed=command.issuedAt!==lastCommand;
 // Initial scene load does not replay an old movement command.
 const move=sceneChanged||!changed?{mode:"hold"}:command;
 const target=tabletopTarget(move,{current,sceneRect:canvas.dimensions.sceneRect,token:canvas.tokens.get(command.tokenId),visible:t=>t?.isVisible&&!t.document.hidden,scale:s??current.scale});
 if(target&&(sceneChanged||changed||s!==lastScale)){
  if(Math.abs(target.x-current.x)>0.01||Math.abs(target.y-current.y)>0.01||Math.abs(target.scale-current.scale)>0.0001)deliberatePan(target);
 }
 lastScene=scene;lastCommand=command.issuedAt;lastScale=s;
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{reconcile();}catch(e){console.error(ID,e);warnOnce("Tabletop: positioning failed; check the console.");}});}
function openCalibration(){
 if(!active()||calibrating)return;
 calibrating=true;
 const panel=document.createElement("div");
 Object.assign(panel.style,{position:"fixed",inset:"0",zIndex:"100000",background:"#171717",color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",font:"16px sans-serif"});
 const title=document.createElement("h2");title.textContent="Tabletop calibration";panel.append(title);
 const hint=document.createElement("p");hint.textContent="Measure the square with a ruler. Adjust until its outside edges are exactly one inch apart.";panel.append(hint);
 let ppi=Math.max(10,Math.min(500,pixelsPerInch()??96));
 const square=document.createElement("div");Object.assign(square.style,{border:"2px solid white",boxSizing:"border-box",flexShrink:"0"});panel.append(square);
 const value=document.createElement("input");value.type="number";value.min="10";value.max="500";value.step=".1";value.value=String(ppi);
 const slider=document.createElement("input");slider.type="range";slider.min="10";slider.max="500";slider.step=".1";slider.value=String(ppi);slider.style.width="min(500px,80vw)";
 function draw(v){if(!Number.isFinite(v)||v<10||v>500)return;ppi=v;square.style.width=square.style.height=ppi+"px";value.value=slider.value=String(ppi);}
 value.oninput=()=>draw(Number(value.value));slider.oninput=()=>draw(Number(slider.value));draw(ppi);panel.append(value,slider);
 const close=()=>{panel.remove();window.removeEventListener("keydown",escape,true);calibrating=false;};
 const escape=e=>{if(e.key==="Escape"){e.stopImmediatePropagation();close();}};
 const save=document.createElement("button");save.textContent="Save calibration";save.onclick=async()=>{try{await game.settings.set(ID,"tabletopCalibration",{ppi,signature:signature()});close();warned="";schedule();}catch(e){ui.notifications.error("Calibration could not be saved.");}};
 const cancel=document.createElement("button");cancel.textContent="Cancel";cancel.onclick=close;panel.append(save,cancel);document.body.append(panel);window.addEventListener("keydown",escape,true);
}
export function registerTabletop(){
 game.settings.register(ID,"tabletopCalibration",{scope:"client",config:false,type:Object,default:{}});
 game.keybindings.register(ID,"tabletop-calibrate",{name:"Calibrate tabletop display",editable:[{key:"KeyC",modifiers:["Alt","Shift"]}],restricted:false,onDown:()=>{if(!active())return false;openCalibration();return true;}});
 Hooks.once("ready",()=>{if(isObserver()&&tabletopMode())install();schedule();});
 Hooks.on("canvasReady",()=>{lastScene=null;schedule();});
 Hooks.on("canvasTearDown",()=>{lastScene=null;lastCommand=null;lastScale=null;});
 Hooks.on("updateSetting",schedule);
 window.addEventListener("resize",schedule);
}
