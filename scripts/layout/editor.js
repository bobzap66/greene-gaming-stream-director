import {ID,setting,defaultRegions} from "../settings.js";
import {normalizeRegion} from "./geometry.js";
export function registerEditor(){
 const {ApplicationV2}=foundry.applications.api;
 class LayoutEditor extends ApplicationV2 {
  static DEFAULT_OPTIONS={id:"ggsd-layout-editor",window:{title:"Stream Director — Broadcast Layout",resizable:true},position:{width:760,height:620}};
  async _renderHTML(){return document.createElement("div");}
  _replaceHTML(result,content){
   content.replaceChildren(result);
   const regions=Object.fromEntries(Object.entries(defaultRegions).map(([k,v])=>[k,normalizeRegion(setting("regions")?.[k],v)]));
   const stage=document.createElement("div");
   Object.assign(stage.style,{position:"relative",aspectRatio:"16 / 9",background:"#182028",border:"1px solid #777",overflow:"hidden",touchAction:"none"});
   const note=document.createElement("p");note.textContent="Drag regions to position them; drag the bottom-right handle to resize. Percentages are relative to the observer viewport.";
   result.append(note,stage);
   const colors={camera:"#55c6a6",art:"#e8c477",chat:"#63a4ef"};
   for(const [key,r] of Object.entries(regions)){
    const el=document.createElement("div"),handle=document.createElement("span");
    el.textContent=key;Object.assign(el.style,{position:"absolute",border:"2px solid "+colors[key],color:colors[key],background:colors[key]+"22",boxSizing:"border-box",cursor:"move",padding:"5px"});
    Object.assign(handle.style,{position:"absolute",right:"0",bottom:"0",width:"15px",height:"15px",background:colors[key],cursor:"nwse-resize"});
    el.append(handle);stage.append(el);
    const draw=()=>Object.assign(el.style,{left:r.x+"%",top:r.y+"%",width:r.w+"%",height:r.h+"%"});
    draw();
    el.addEventListener("pointerdown",e=>{
     e.preventDefault();el.setPointerCapture(e.pointerId);
     const start={...r},sx=e.clientX,sy=e.clientY,resize=e.target===handle;
     const move=ev=>{
      const dx=(ev.clientX-sx)/stage.clientWidth*100,dy=(ev.clientY-sy)/stage.clientHeight*100;
      const next=resize?{...start,w:start.w+dx,h:start.h+dy}:{...start,x:Math.max(0,Math.min(100-start.w,start.x+dx)),y:Math.max(0,Math.min(100-start.h,start.y+dy))};
      Object.assign(r,normalizeRegion(next,defaultRegions[key]));draw();
     };
     const stop=()=>{el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",stop);el.removeEventListener("pointercancel",stop);};
     el.addEventListener("pointermove",move);el.addEventListener("pointerup",stop);el.addEventListener("pointercancel",stop);
    });
   }
   const save=document.createElement("button");save.type="button";save.textContent="Save layout";save.onclick=async()=>{await game.settings.set(ID,"regions",regions);ui.notifications.info("Broadcast layout saved. Refresh observer.");};result.append(save);
  }
 }
 game.settings.registerMenu(ID,"layoutEditor",{name:"Broadcast layout editor",label:"Edit broadcast layout",hint:"Configure camera, artwork and chat regions.",icon:"fas fa-display",type:LayoutEditor,restricted:true});
}
