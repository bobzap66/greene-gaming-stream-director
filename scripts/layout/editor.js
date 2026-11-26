import {ID,setting,defaultRegions,tabletopRegions} from "../settings.js";
import {normalizeRegion} from "./geometry.js";
export function registerEditor(){
 const {ApplicationV2}=foundry.applications.api;
 function makeEditor(tabletop){
 const defaults=tabletop?tabletopRegions:defaultRegions, storage=tabletop?"tabletopRegions":"regions",title=tabletop?"Tabletop":"Broadcast";
 return class LayoutEditor extends ApplicationV2 {
  static DEFAULT_OPTIONS={id:tabletop?"ggsd-tabletop-layout-editor":"ggsd-layout-editor",window:{title:"Stream Director — "+title+" Layout",resizable:true},position:{width:760,height:680}};
  async _renderHTML(){return document.createElement("div");}
  _replaceHTML(result,content){
   content.replaceChildren(result);Object.assign(result.style,{overflowY:"auto",maxHeight:"100%",minHeight:"0"});
   const regions=Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,normalizeRegion(setting(storage)?.[k],v)]));
   const stage=document.createElement("div");
   Object.assign(stage.style,{position:"relative",aspectRatio:"16 / 9",background:"#182028",border:"1px solid #777",overflow:"hidden",touchAction:"none"});
   const note=document.createElement("p");note.textContent="Drag regions to position them; drag the bottom-right handle to resize. Percentages are relative to the observer viewport.";
   const controls=document.createElement("div");
   Object.assign(controls.style,{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap",fontSize:"12px"});
   const input=document.createElement("input");input.type="file";input.style.maxWidth="220px";input.accept="image/png,image/webp,image/jpeg";
   const preview=document.createElement("img");
   Object.assign(preview.style,{position:"absolute",inset:"0",width:"100%",height:"100%",objectFit:"fill",pointerEvents:"none",opacity:"0.8"});
   preview.hidden=true;stage.append(preview);
   input.onchange=()=>{const file=input.files?.[0];if(!file)return;if(file.size>20*1024*1024){ui.notifications.warn("Choose an overlay smaller than 20 MB.");return;}const reader=new FileReader();reader.onload=()=>{preview.src=reader.result;preview.hidden=false;};reader.onerror=()=>ui.notifications.warn("Could not read overlay.");reader.readAsDataURL(file);};
   const clear=document.createElement("button");clear.type="button";clear.textContent="Clear overlay";clear.onclick=()=>{preview.removeAttribute("src");preview.hidden=true;input.value="";};
   const opacity=document.createElement("input");opacity.type="range";opacity.style.width="100px";opacity.min="0";opacity.max="1";opacity.step=".05";opacity.value=".8";opacity.title="Overlay opacity";opacity.oninput=()=>preview.style.opacity=opacity.value;
   const label=document.createElement("span");label.textContent="Local overlay reference (not uploaded)";
   const opacityLabel=document.createElement("span");opacityLabel.textContent="Opacity";
   controls.append(label,input,clear,opacityLabel,opacity);
   const picker=document.createElement("select");
   for(const [key,name] of Object.entries(tabletop?{art:"Artwork and journals",chat:"Chat",combat:"Encounter tracker"}:{camera:"Camera",art:"Artwork and journals",chat:"Chat",combat:"Encounter tracker",reserved:"Reserved OBS space"})){const option=document.createElement("option");option.value=key;option.textContent=name;picker.append(option);}
   const editLabel=document.createElement("span");editLabel.textContent="Edit region:";
   controls.append(editLabel,picker);
   const fields={};const numeric=document.createElement("div");Object.assign(numeric.style,{display:"flex",gap:"6px",flexWrap:"wrap"});
   const sync=()=>{for(const k of ["x","y","w","h"])fields[k].value=regions[picker.value][k].toFixed(2);};
   for(const k of ["x","y","w","h"]){const label=document.createElement("label"),field=document.createElement("input");label.textContent=k.toUpperCase()+" % ";field.type="number";field.step=".1";field.min="0";field.max="100";field.style.width="75px";fields[k]=field;label.append(field);numeric.append(label);field.onchange=()=>{const r=regions[picker.value];Object.assign(r,normalizeRegion({...r,[k]:Number(field.value)},defaults[picker.value]));stage.querySelectorAll("[data-region]").forEach(el=>{const v=regions[el.dataset.region];Object.assign(el.style,{left:v.x+"%",top:v.y+"%",width:v.w+"%",height:v.h+"%"});});sync();};}
   picker.addEventListener("change",sync);sync();result.append(note,controls,numeric,stage);
   const colors={camera:"#55c6a6",art:"#e8c477",chat:"#63a4ef",combat:"#bb91e7",reserved:"#999999"};
   for(const [key,r] of Object.entries(regions)){
    const el=document.createElement("div"),handle=document.createElement("span");
    el.dataset.region=key;el.textContent=key;Object.assign(el.style,{position:"absolute",border:"2px solid "+colors[key],color:colors[key],background:colors[key]+"22",boxSizing:"border-box",cursor:"move",padding:"5px"});
    Object.assign(handle.style,{position:"absolute",right:"0",bottom:"0",width:"15px",height:"15px",background:colors[key],cursor:"nwse-resize"});
    el.append(handle);stage.append(el);
    const selectRegion=()=>{const selected=picker.value===key;el.style.pointerEvents=selected?"auto":"none";el.style.zIndex=selected?"3":"1";el.style.opacity=selected?"1":".55";};picker.addEventListener("change",selectRegion);selectRegion();
    const draw=()=>Object.assign(el.style,{left:r.x+"%",top:r.y+"%",width:r.w+"%",height:r.h+"%"});
    draw();
    el.addEventListener("pointerdown",e=>{
     e.preventDefault();el.setPointerCapture(e.pointerId);
     const start={...r},sx=e.clientX,sy=e.clientY,resize=e.target===handle;
     const move=ev=>{
      const dx=(ev.clientX-sx)/stage.clientWidth*100,dy=(ev.clientY-sy)/stage.clientHeight*100;
      const next=resize?{...start,w:start.w+dx,h:start.h+dy}:{...start,x:Math.max(0,Math.min(100-start.w,start.x+dx)),y:Math.max(0,Math.min(100-start.h,start.y+dy))};
      Object.assign(r,normalizeRegion(next,defaults[key]));draw();sync();
     };
     const stop=()=>{el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",stop);el.removeEventListener("pointercancel",stop);};
     el.addEventListener("pointermove",move);el.addEventListener("pointerup",stop);el.addEventListener("pointercancel",stop);
    });
   }
   const save=document.createElement("button");save.type="button";save.textContent="Save layout";save.onclick=async()=>{await game.settings.set(ID,storage,regions);ui.notifications.info(title+" layout saved.");};const reset=document.createElement("button");reset.type="button";reset.textContent="Reset layout";reset.onclick=()=>{for(const [key,v] of Object.entries(defaults))Object.assign(regions[key],v);for(const el of stage.querySelectorAll("[data-region]")){const r=regions[el.dataset.region];Object.assign(el.style,{left:r.x+"%",top:r.y+"%",width:r.w+"%",height:r.h+"%"});}};const footer=document.createElement("div");Object.assign(footer.style,{display:"flex",gap:"8px",position:"sticky",bottom:"0",background:"var(--color-bg, #222)",padding:"6px"});footer.append(save,reset);result.append(footer);reset.addEventListener("click",sync);
  }
 }
 }
 game.settings.registerMenu(ID,"layoutEditor",{name:"Broadcast layout editor",label:"Edit broadcast layout",hint:"Configure camera, artwork, chat, encounter tracker and OBS reference regions.",icon:"fas fa-display",type:makeEditor(false),restricted:true});
 game.settings.registerMenu(ID,"tabletopLayoutEditor",{name:"Tabletop layout editor",label:"Edit tabletop layout",hint:"Optional artwork, chat and combat regions; never changes map scale or position.",icon:"fas fa-display",type:makeEditor(true),restricted:true});
}
