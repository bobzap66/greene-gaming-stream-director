import {ID,setting,isObserver} from "../settings.js";
import {snapDelta,viewportBounds} from "../tabletop/display-policy.js";
const channel="module."+ID;
let overlay=null,handle=null,view=null,drag=null,enabled=false,sendMove=null,requestId=null,lastRequest=0;
const tabletop=()=>game.ready&&setting("enabled")&&setting("observerMode")==="tabletop";
const gm=()=>tabletop()&&game.user?.isGM;
const observer=()=>tabletop()&&isObserver();
function snapshot(){
 if(!observer()||!canvas.ready)return null;
 const p=canvas.stage.pivot,scale=canvas.stage.scale.x,b=(canvas.app.canvas??canvas.app.view)?.getBoundingClientRect();
 if(!b)return null;
 const result={sceneId:canvas.scene.id,userId:game.user.id,x:p.x,y:p.y,scale,width:b.width,height:b.height};
 return viewportBounds(result)?result:null;
}
function respond(id){
 const state=snapshot();
 if(state)game.socket.emit(channel,{kind:"tabletop-view",requestId:id,state});
}
function request(){
 if(!enabled||!gm()||!canvas.ready)return;
 requestId=foundry.utils.randomID();
 game.socket.emit(channel,{kind:"tabletop-request",requestId,observerId:setting("observerId")});
}
function clear(){overlay?.remove();overlay=handle=null;drag=null;}
function draw(){
 if(!enabled||!gm()||!canvas.ready||!game.users.get(setting("observerId"))?.active||view?.sceneId!==canvas.scene.id||view.userId!==setting("observerId")){clear();return;}
 const bounds=viewportBounds(drag?{...view,...drag.end}:view);
 if(!bounds){clear();return;}
 const a=canvas.clientCoordinatesFromCanvas({x:bounds.x,y:bounds.y}),b=canvas.clientCoordinatesFromCanvas({x:bounds.x+bounds.w,y:bounds.y+bounds.h});
 if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return;
 if(!overlay){
  overlay=document.createElement("div");Object.assign(overlay.style,{position:"fixed",zIndex:"45",pointerEvents:"none",border:"2px dashed #63d9df",boxSizing:"border-box",background:"#63d9df0b"});
  handle=document.createElement("button");handle.type="button";handle.textContent="Tabletop display";Object.assign(handle.style,{position:"absolute",top:"0",left:"50%",transform:"translateX(-50%)",pointerEvents:"auto",cursor:"move",whiteSpace:"nowrap",background:"#15343c",color:"#c5ffff",border:"1px solid #63d9df",width:"auto"});
  overlay.append(handle);document.body.append(overlay);
  handle.addEventListener("pointerdown",startDrag);
 }
 Object.assign(overlay.style,{left:a.x+"px",top:a.y+"px",width:Math.max(0,b.x-a.x)+"px",height:Math.max(0,b.y-a.y)+"px"});
}
function startDrag(e){
 if(e.button!==0||!gm()||!view||drag)return;
 e.preventDefault();e.stopPropagation();
 const initial={x:view.x,y:view.y},start=canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY});
 const target=handle,sceneId=canvas.scene.id,observerId=view.userId;
 drag={end:initial};
 target.setPointerCapture(e.pointerId);
 const move=ev=>{
  if(!drag)return;
  const p=canvas.canvasCoordinatesFromClient({x:ev.clientX,y:ev.clientY}),end={x:initial.x+p.x-start.x,y:initial.y+p.y-start.y};
  drag.end=setting("tabletopSnapMovement")&&canvas.scene.grid.type===1?snapDelta(initial,end,canvas.grid.size)??end:end;draw();
 };
 const finish=ev=>{
  const end=drag?.end;drag=null;
  target.removeEventListener("pointermove",move);target.removeEventListener("pointerup",finish);target.removeEventListener("pointercancel",finish);target.removeEventListener("lostpointercapture",finish);
  if(ev.type==="pointerup"&&end&&gm()&&canvas.scene?.id===sceneId&&setting("observerId")===observerId){
   Promise.resolve(sendMove(end)).then(()=>request()).catch(e=>ui.notifications.warn("Tabletop movement failed: "+e.message));
  }
  draw();
 };
 target.addEventListener("pointermove",move);target.addEventListener("pointerup",finish);target.addEventListener("pointercancel",finish);target.addEventListener("lostpointercapture",finish);
}
export function toggleViewport(){
 if(!gm())return false;
 enabled=!enabled;view=null;requestId=null;
 if(enabled){request();ui.notifications.info("Tabletop viewport enabled; waiting for the observer's view.");}else clear();
 return true;
}
export function registerViewport(move){
 sendMove=move;
 game.keybindings.register(ID,"tabletop-viewport",{name:"Toggle tabletop observer viewport",editable:[{key:"KeyV",modifiers:["Alt","Shift"]}],restricted:true,onDown:toggleViewport});
 Hooks.once("ready",()=>{
  game.socket.on(channel,msg=>{
   if(!msg||typeof msg!=="object")return;
   if(msg.kind==="tabletop-request"&&observer()&&msg.observerId===game.user.id&&typeof msg.requestId==="string"&&msg.requestId.length<=64){
    const now=performance.now();if(now-lastRequest<100)return;lastRequest=now;respond(msg.requestId);
   }
   if(msg.kind==="tabletop-view"&&gm()&&enabled&&msg.requestId===requestId&&msg.state?.userId===setting("observerId")&&msg.state?.sceneId===canvas.scene?.id&&viewportBounds(msg.state)){
    view=msg.state;draw();
   }
   if(msg.kind==="tabletop-changed"&&gm()&&enabled&&msg.userId===setting("observerId")&&msg.sceneId===canvas.scene?.id)request();
  });
  if(game.user?.isGM){
   Hooks.on("canvasPan",draw);
   Hooks.on("canvasReady",()=>{view=null;clear();request();});
   Hooks.on("canvasTearDown",()=>{view=null;clear();});
   Hooks.on("updateSetting",doc=>{if(doc.key===ID+".observerId"||doc.key===ID+".observerMode"||doc.key===ID+".enabled"){view=null;clear();request();}});
   Hooks.on("userConnected",()=>{draw();request();});
   window.addEventListener("resize",draw);
  }
  Hooks.on("ggsdTabletopViewChanged",()=>{
   if(observer()&&canvas.ready)game.socket.emit(channel,{kind:"tabletop-changed",userId:game.user.id,sceneId:canvas.scene.id});
  });
 });
}
