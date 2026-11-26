import {ID,setting,isObserver} from "../settings.js";
import {applicationElement,contentKind} from "../presentation/policy.js";
function recipients(){
 if(setting("sharingDestination")==="all"){
  const users=Array.from(game.users).filter(u=>u.active&&!u.isGM).map(u=>u.id);
  if(!users.length)throw Error("No connected players.");
  return users;
 }
 const u=game.users.get(setting("observerId"));
 if(!u?.active||u.isGM)throw Error("The designated observer is not connected.");
 return [u.id];
}
async function shareFocused(){
 const instances=Array.from(foundry.applications.instances.values());
 const focused=document.activeElement?.closest(".application");
 const app=instances.find(a=>applicationElement(a)===focused)??foundry.applications.api.ApplicationV2.frontApp??ui.activeWindow??instances.filter(a=>{const el=applicationElement(a);return el?.isConnected&&el.matches(".application")&&el.querySelector(".window-header");}).sort((a,b)=>(Number(getComputedStyle(applicationElement(b)).zIndex)||0)-(Number(getComputedStyle(applicationElement(a)).zIndex)||0))[0];
 const el=applicationElement(app);
 if(!el?.isConnected)throw Error("Focus an artwork or journal window first.");
 const users=recipients(),kind=contentKind(el);
 if(kind==="art"&&typeof app.shareImage==="function"){app.shareImage({users});return;}
 const doc=app.document??app.object;
 let page;
 if(doc?.documentName==="JournalEntryPage")page=doc;
 else if(kind==="journal"&&typeof app.viewedPageDocuments==="function"){
  const pages=Array.from(app.viewedPageDocuments());
  page=pages.find(p=>p.id===app.pageId)??(pages.length===1?pages[0]:null);
  if(!page)throw Error("Select a single journal page before sharing.");
 }
 if(page?.documentName!=="JournalEntryPage")throw Error("Focus a single journal page or artwork window.");
 await foundry.documents.collections.Journal.show(page,{force:true,users});
}
function shareToken(){
 const selected=canvas.tokens.controlled;
 if(selected.length!==1||!selected[0].actor?.img)throw Error("Select one token with actor artwork.");
 const actor=selected[0].actor;
 foundry.documents.collections.Journal.showImage(actor.img,{image:actor.img,title:actor.name,uuid:actor.uuid,users:recipients()});
}
async function dismissObserver(){
 const u=game.users.get(setting("observerId"));
 if(!u?.active||u.isGM)throw Error("The designated observer is not connected.");
 await game.settings.set(ID,"dismissCommand",{observerId:u.id,nonce:foundry.utils.randomID()});
}
async function closeObserverWindows(){
 for(const app of Array.from(foundry.applications.instances.values())){
  const el=applicationElement(app);
  if(el?.isConnected&&contentKind(el)&&typeof app.close==="function"){
   try{await app.close();}catch(e){console.warn(ID,"Manual dismissal failed",e);}
  }
 }
}
export function registerSharing(){
 for(const [key,code,name,fn] of [["share-focused","KeyS","Share focused artwork or journal page",shareFocused],["dismiss-observer","KeyX","Dismiss observer artwork and journals",dismissObserver],["share-token","KeyA","Share selected token actor artwork",shareToken]]){
  game.keybindings.register(ID,key,{name,editable:[{key:code,modifiers:["Alt","Shift"]}],restricted:true,onDown:()=>{
   if(!game.user?.isGM)return false;
   Promise.resolve().then(fn).catch(e=>ui.notifications.warn("Stream Director: "+e.message));return true;
  }});
 }
 let last;
 Hooks.once("ready",()=>{last=setting("dismissCommand")?.nonce;});
 Hooks.on("updateSetting",doc=>{
  if(!game.ready||doc.key!==ID+".dismissCommand"||!isObserver())return;
  const cmd=setting("dismissCommand");
  if(!cmd?.nonce||cmd.nonce===last||cmd.observerId!==game.user.id)return;
  last=cmd.nonce;void closeObserverWindows();
 });
}
