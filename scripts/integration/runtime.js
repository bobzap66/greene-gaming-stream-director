import {ID,setting,isObserver} from "../settings.js";
import {API_VERSION,buildSnapshot,unavailable} from "./policy.js";
const subscribers=new Set();
let pending=null,last=null;
const active=()=>game.ready&&isObserver()&&setting("integrationEnabled");
function snapshot(){
 if(!active()||!canvas.ready||!canvas.scene)return unavailable();
 return buildSnapshot({system:game.system.id,sceneId:canvas.scene.id,tokens:Array.from(canvas.tokens.placeables??[]),user:game.user,encounter:game.combat,mode:setting("observerMode"),healthEnabled:setting("integrationHealth")});
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
export function registerIntegration(){
 const module=game.modules.get(ID);
 if(module)module.api=Object.freeze({...module.api,integration:Object.freeze({version:API_VERSION,getSnapshot:()=>{try{return snapshot();}catch(e){console.warn(ID,e);return unavailable();}},subscribe})});
 Hooks.once("ready",()=>{
  Hooks.callAll("ggsdIntegrationReady",module?.api?.integration);
  schedule();
 });
 for(const event of ["canvasReady","updateActor","updateToken","createToken","deleteToken","updateCombat","createCombat","deleteCombat","updateCombatant","createCombatant","deleteCombatant","combatTurnChange","sightRefresh","createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(event,schedule);
 Hooks.on("canvasTearDown",()=>{if(!subscribers.size)return;clearTimeout(pending);pending=null;publish(unavailable());});
 Hooks.on("updateSetting",doc=>{if([ID+".integrationEnabled",ID+".integrationHealth",ID+".observerId",ID+".observerMode"].includes(doc?.key))schedule();});
}
