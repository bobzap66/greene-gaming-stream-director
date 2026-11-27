import {ID,setting,isObserver} from "../settings.js";
import {API_VERSION,buildSnapshot,buildGMSnapshot,unavailable} from "./policy.js";
const subscribers=new Set();
let pending=null,last=null;
const active=()=>game.ready&&isObserver()&&setting("integrationEnabled");
function snapshot(){
 if(!active()||!canvas.ready||!canvas.scene)return unavailable();
 return buildSnapshot({system:game.system.id,sceneId:canvas.scene.id,tokens:Array.from(canvas.tokens.placeables??[]),user:game.user,encounter:game.combat,mode:setting("observerMode"),healthEnabled:setting("integrationHealth"),roster:setting("integrationRosterOnly")?setting("integrationRoster"):null,actors:setting("integrationRosterOnly")?Array.from(game.actors):[]});
}
function deliver(callback,value){
 try{callback(structuredClone(value));}catch(e){console.warn(ID,"Integration subscriber failed",e);}
}
function publish(value){
 const key=JSON.stringify(value);
 if(key===last)return;
 last=key;
 for(const callback of [...subscribers])deliver(callback,value);
}
function schedule(){
 if(!game.ready||!subscribers.size)return;
 if(!active()){clearTimeout(pending);pending=null;publish(unavailable());return;}
 if(pending!==null)return;
 pending=setTimeout(()=>{pending=null;try{publish(snapshot());}catch(e){console.warn(ID,"Integration snapshot failed",e);publish(unavailable());}},100);
}
function subscribe(callback){
 if(typeof callback!=="function")throw TypeError("subscribe requires a callback");
 if(!game.ready||!isObserver())return ()=>{};
 subscribers.add(callback);
 let value;try{value=snapshot();}catch(e){console.warn(ID,e);value=unavailable();}
 if(subscribers.size===1)last=JSON.stringify(value);
 deliver(callback,value);
 return ()=>{subscribers.delete(callback);if(!subscribers.size){clearTimeout(pending);pending=null;last=null;}};
}
const gmSubscribers=new Set();
let gmPending=null,gmLast=null;
const gmActive=()=>game.ready&&game.user?.isGM&&setting("integrationGMEnabled");
function gmSnapshot(){
 if(!gmActive())return unavailable();
 try{return buildGMSnapshot({user:game.user,enabled:true,system:game.system.id,mode:setting("observerMode"),actors:Array.from(game.actors),roster:setting("integrationRoster"),encounter:game.combat,healthEnabled:setting("integrationHealth")});}
 catch(e){console.warn(ID,"GM integration snapshot failed",e);return unavailable();}
}
function gmPublish(value){
 const key=JSON.stringify(value);if(key===gmLast)return;gmLast=key;
 for(const callback of [...gmSubscribers])deliver(callback,value);
}
function gmSchedule(){
 if(!game.ready||!gmSubscribers.size)return;
 if(!gmActive()){clearTimeout(gmPending);gmPending=null;gmPublish(unavailable());return;}
 if(gmPending!==null)return;
 gmPending=setTimeout(()=>{gmPending=null;gmPublish(gmSnapshot());},100);
}
function gmSubscribe(callback){
 if(typeof callback!=="function")throw TypeError("subscribe requires a callback");
 if(!game.ready||!game.user?.isGM)return ()=>{};
 gmSubscribers.add(callback);const value=gmSnapshot();
 if(gmSubscribers.size===1)gmLast=JSON.stringify(value);
 deliver(callback,value);
 return ()=>{gmSubscribers.delete(callback);if(!gmSubscribers.size){clearTimeout(gmPending);gmPending=null;gmLast=null;}};
}
export function registerIntegration(){
 const module=game.modules.get(ID);
 if(module)module.api=Object.freeze({...module.api,integration:Object.freeze({version:API_VERSION,getSnapshot:()=>{try{return snapshot();}catch(e){console.warn(ID,e);return unavailable();}},subscribe}),gmIntegration:Object.freeze({version:API_VERSION,getSnapshot:gmSnapshot,subscribe:gmSubscribe})});
 Hooks.once("ready",()=>{
  Hooks.callAll("ggsdIntegrationReady",module?.api?.integration);
  schedule();gmSchedule();
 });
 for(const event of ["canvasReady","createActor","deleteActor","updateActor","updateToken","createToken","deleteToken","updateCombat","createCombat","deleteCombat","updateCombatant","createCombatant","deleteCombatant","combatTurnChange","sightRefresh","createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(event,()=>{schedule();gmSchedule();});
 Hooks.on("canvasTearDown",()=>{if(!subscribers.size)return;clearTimeout(pending);pending=null;publish(unavailable());});
 Hooks.on("updateSetting",doc=>{if([ID+".integrationGMEnabled",ID+".integrationEnabled",ID+".integrationHealth",ID+".integrationRosterOnly",ID+".integrationRoster",ID+".observerId",ID+".observerMode"].includes(doc?.key)){schedule();gmSchedule();}});
}

 // Separate API and subscription lifecycle: never widen the existing observer API.
