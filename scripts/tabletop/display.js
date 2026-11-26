import {ID,setting,isObserver} from "../settings.js";
import {displaySignature} from "./policy.js";
import {chooseProfile,matchingProfiles} from "./display-policy.js";
let details=null, notify=()=>{}, selectionRequired=false;
export const signature=()=>displaySignature({width:screen.width,height:screen.height,dpr:devicePixelRatio});
const label=()=>details?.currentScreen?.label??"";
const data=()=>setting("displayProfiles");
const profiles=()=>Array.isArray(data()?.profiles)?data().profiles:[];
export function currentProfile(){
 if(selectionRequired&&!label())return null;
 return chooseProfile(profiles(),signature(),label(),data()?.selected);
}
export function hasProfiles(){return profiles().length>0;}
export function registerDisplay(onChange){
 notify=onChange;
 game.settings.register(ID,"displayProfiles",{scope:"client",config:false,type:Object,default:{profiles:[],selected:""}});
 Hooks.once("ready",async()=>{
  if(!isObserver()||setting("observerMode")!=="tabletop")return;
  try{if((await navigator.permissions?.query({name:"window-management"}))?.state==="granted")await detect();}catch{}
 });
}
async function detect(){
 if(typeof window.getScreenDetails!=="function")throw Error("Monitor detection is unavailable in this browser.");
 if(!details){
  details=await window.getScreenDetails();
  details.addEventListener("currentscreenchange",()=>{selectionRequired=true;notify();});
  details.addEventListener("screenschange",()=>{selectionRequired=true;notify();});
 }
 notify();return details;
}
export async function saveProfile(name,ppi,id){
 if(!isObserver()||!Number.isFinite(ppi)||ppi<10||ppi>500)throw Error("Invalid calibration");
 const list=profiles(),existing=list.find(p=>p.id===id);
 const profile={id:existing?.id??foundry.utils.randomID(),name:String(name).trim().slice(0,80)||"Display",signature:signature(),label:label(),ppi,updated:Date.now()};
 await game.settings.set(ID,"displayProfiles",{profiles:[...list.filter(p=>p.id!==profile.id),profile],selected:profile.id});
 selectionRequired=false;notify();return profile;
}
export function displayControls(panel,onSelect){
 const status=document.createElement("p"),picker=document.createElement("select"),name=document.createElement("input"),detectButton=document.createElement("button"),use=document.createElement("button"),remove=document.createElement("button");
 name.placeholder="Name this display";name.value=currentProfile()?.name??"Tabletop display";name.maxLength=80;
 for(const b of [detectButton,use,remove])b.type="button";
 detectButton.textContent="Detect monitors";use.textContent="Use selected profile";remove.textContent="Delete selected profile";
 function render(){
  const list=matchingProfiles(profiles(),signature(),label()),chosen=currentProfile();
  status.textContent=(label()||"Monitor identity unavailable")+" · "+screen.width+" × "+screen.height+" · DPR "+devicePixelRatio+(chosen?" · "+chosen.name:" · No confirmed profile");
  picker.replaceChildren();const fresh=document.createElement("option");fresh.value="";fresh.textContent="New calibration";picker.append(fresh);
  for(const p of list){const o=document.createElement("option");o.value=p.id;o.textContent=p.name+" ("+p.ppi.toFixed(1)+" px/in)";picker.append(o);}
  picker.value=chosen?.id??"";use.disabled=remove.disabled=!picker.value;
 }
 picker.onchange=()=>{const p=profiles().find(p=>p.id===picker.value);use.disabled=remove.disabled=!p;if(p){name.value=p.name;onSelect(p.ppi);}};
 detectButton.onclick=async()=>{try{await detect();render();const p=currentProfile();if(p){name.value=p.name;onSelect(p.ppi);}}catch(e){status.textContent=e.message+" Use manual calibration instead.";}};
 use.onclick=async()=>{const p=matchingProfiles(profiles(),signature(),label()).find(p=>p.id===picker.value);if(!p)return;selectionRequired=false;await game.settings.set(ID,"displayProfiles",{profiles:profiles(),selected:p.id});notify();onSelect(p.ppi);render();};
 remove.onclick=async()=>{const id=picker.value;if(!id||!window.confirm("Delete this saved calibration?"))return;await game.settings.set(ID,"displayProfiles",{profiles:profiles().filter(p=>p.id!==id),selected:data().selected===id?"":data().selected});selectionRequired=true;notify();render();};
 panel.append(status,detectButton,picker,name,use,remove);render();
 return {name:()=>name.value,id:()=>picker.value};
}
