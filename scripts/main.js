import {cluster} from "./camera/framing.js";
import {ID,registerSettings,refreshObserverChoices,setting,isObserver} from "./settings.js";
import {registerEditor} from "./layout/editor.js";
import {registerLayout,region} from "./layout/runtime.js";
import {pixels} from "./layout/geometry.js";
import {safeTarget,chooseExploration,sceneCombatTargets} from "./camera/director.js";
import {registerTabletop,tabletopMode} from "./tabletop/runtime.js";
import {registerMaintenance} from "./presentation/maintenance.js";
import {registerPresentation} from "./presentation/runtime.js";
import {registerGMDirector} from "./gm/panel.js";
import {effectiveCommand,manualTarget,transitionDuration} from "./camera/manual.js";
import {sampleExplored,unionVisible,createExplorationCache} from "./camera/explored.js";
import {createCombatDirector,currentActorToken,eligibleTargetUsers} from "./camera/combat.js";
import {publicAction,createActionDirector} from "./camera/action.js";
import {combatStyleShot} from "./camera/hybrid.js";
const actionDirector=createActionDirector();
let previousStyle=null;
const combatDirector=createCombatDirector();
let recentShot=null;
const explorationCache=createExplorationCache();
let wideKey=null;
let heartbeat=null;
let timer,flight=null,last=null,mode=null,partyId=null,sceneId=null,discardedCommand=null;
Hooks.once("init",()=>{registerSettings();registerEditor();registerLayout();registerGMDirector();registerPresentation();registerMaintenance();registerTabletop();});
const enabled=()=>game.ready&&isObserver()&&setting("enabled")&&!tabletopMode();
const visible=t=>t&&t.actor&&t.isVisible&&!t.document.hidden;
const combatTargets=()=>sceneCombatTargets(game.combat,canvas.scene?.id,id=>canvas.tokens.get(id),visible);
const point=t=>({id:t.id,x:t.center.x,y:t.center.y,width:t.w,height:t.h});
function schedule(){if(!enabled()||timer)return;timer=setTimeout(()=>{timer=null;update().catch(e=>console.error(ID,e));},200);}
async function update(){
 if(!enabled()||!canvas.ready||flight)return;
 if(sceneId!==canvas.scene.id){sceneId=canvas.scene.id;mode=null;partyId=null;last=null;}
 const combat=combatTargets();
 const active=combat.length>0;
 const grid=canvas.grid.size||100;
 const tokens=canvas.tokens.placeables.filter(visible);
 const individuals=tokens.filter(t=>t.actor.type!=="party"&&t.actor.hasPlayerOwner).map(point);
 const parties=tokens.filter(t=>t.actor.type==="party").map(point);
 let points;
 if(active)points=combat.map(point);
 else points=chooseExploration(individuals,parties,mode,partyId,setting("groupDistance")*grid,last);
 const rawCommand=setting("cameraCommand");
 const command=rawCommand?.issuedAt===discardedCommand?{mode:"auto"}:effectiveCommand(rawCommand,sceneId,game.user.id);
 if(command.mode!=="wide"){wideKey=null;explorationCache.clear();}
 let cinematic=false;
 const style=setting("combatStyle");
 if(style!==previousStyle){combatDirector.reset();actionDirector.reset();recentShot=null;previousStyle=style;}
 if(command.mode==="auto"&&active&&["cinematic","hybrid"].includes(style)){
  const encounter=game.combat;
  const acting=currentActorToken(encounter,sceneId,combat);
  const visiblePoints=tokens.map(point);
  const visibleIds=new Set(visiblePoints.map(p=>p.id));
  const userTargets=acting?eligibleTargetUsers(Array.from(game.users),acting.actor,sceneId,game.user.id).map(u=>({
   id:u.id,targets:Array.from(u.targets??[]).filter(t=>t.document?.parent?.id===sceneId&&visibleIds.has(t.id)).map(t=>t.id)
  })):[];
  const shot=combatDirector.select({
   encounter:sceneId+"|"+encounter.id,
   turn:[encounter.round,encounter.turn,encounter.combatant?.id].join("|"),
   actorId:acting?.id,visiblePoints,combatPoints:points,userTargets,now:performance.now()
  });
  const encounterKey=sceneId+"|"+encounter.id;
  const turnKey=[encounter.round,encounter.turn,encounter.combatant?.id].join("|");
  recentShot=shot.kind==="cinematic"?{encounter:encounterKey,turn:turnKey,actorId:acting?.id,ids:shot.points.map(p=>p.id)}:null;
  let actionPoints=null;
  if(setting("actionAware"))actionPoints=actionDirector.select({encounter:encounterKey,now:performance.now(),visiblePoints});
  else actionDirector.reset();
  const selected=combatStyleShot(style,shot,points,actionPoints);
  points=selected.points;cinematic=selected.kind==="cinematic";
 }else{combatDirector.reset();actionDirector.reset();recentShot=null;}
 if(command.mode==="hold")return;
 const layout=setting("layoutEnabled");
 const rect=pixels(layout?region("camera"):{x:14,y:10,w:72,h:80},innerWidth,innerHeight);
 const stage=canvas.stage;
 const current={x:stage.pivot.x,y:stage.pivot.y,scale:stage.scale.x};
 const members=points.map(p=>p.id).sort().join(",");
 const center={x:stage.position.x,y:stage.position.y};
 const key=[sceneId,active,style,cinematic,members,setting("cinematicPadding"),innerWidth,innerHeight,JSON.stringify(rect),command.mode,command.tokenId,command.issuedAt].join("|");
 const options={margin:layout?setting("frameMargin")/100:0,padding:cinematic?setting("cinematicPadding")*grid:layout?0:setting("padding")*grid,maxScale:setting("maxZoom"),force:key!==last?.key};
 const autoFrame=()=>safeTarget(points,rect,center,current,options);
 let exploredRect=null;
 const tokenVision=canvas.fog?.tokenVision??canvas.visibility?.tokenVision??canvas.scene.tokenVision??true;
 if(command.mode==="wide"&&tokenVision){
  const cacheKey=sceneId+"|"+command.issuedAt;
  if(wideKey!==cacheKey){explorationCache.clear();wideKey=cacheKey;}
  exploredRect=explorationCache.get(cacheKey,performance.now(),()=>{
   try{
    const fog=canvas.fog,vision=canvas.visibility;
    if(typeof fog?.isPointExplored!=="function"&&typeof vision?.testVisibility!=="function")return null;
    return sampleExplored(canvas.dimensions.sceneRect,grid,p=>
      (fog?.fogExploration&&typeof fog.isPointExplored==="function"&&fog.isPointExplored(p))||
      (typeof vision?.testVisibility==="function"&&vision.testVisibility(p,{tolerance:0})));
   }catch(e){console.warn(ID,"Wide Shot sampling unavailable",e);return null;}
  });
  if(exploredRect)exploredRect=unionVisible(exploredRect,[...individuals,...parties]);
 }
 const target=command.mode==="auto"?autoFrame():manualTarget(command,{rect,center,current,sceneRect:canvas.dimensions.sceneRect,exploredRect,tokenVision,wideMargin:setting("wideMargin")/100,autoFrame,token:canvas.tokens.get(command.tokenId),visible,maxScale:options.maxScale,frame:t=>safeTarget([point(t)],rect,center,current,options)});

 if(!target)return;
 if(Math.hypot(target.x-current.x,target.y-current.y)*current.scale<2&&Math.abs(target.scale-current.scale)<.005){last={...target,key};return;}
 const duration=command.mode==="auto"?setting("transition"):transitionDuration(command.speed,setting("transition")),run={scene:sceneId};
 flight=run;
 let watchdog;
 try{
  const completed=await Promise.race([Promise.resolve(duration===0?canvas.pan(target):canvas.animatePan({...target,duration})).then(()=>true),new Promise(resolve=>{watchdog=setTimeout(()=>resolve(false),duration+1500);})]);
  if(completed&&flight===run&&canvas.scene?.id===run.scene)last={...target,key};
  if(!completed&&flight===run)last=null;
 }finally{clearTimeout(watchdog);if(flight===run){flight=null;schedule();}}
}
Hooks.on("createChatMessage",message=>{
 if(!enabled()||!canvas.ready||!["cinematic","hybrid"].includes(setting("combatStyle"))||!setting("actionAware"))return;
 const scene=canvas.scene?.id,encounter=game.combat;
 const raw=setting("cameraCommand");
 const command=raw?.issuedAt===discardedCommand?{mode:"auto"}:effectiveCommand(raw,scene,game.user.id);
 if(command.mode!=="auto")return;
 const combat=combatTargets();
 if(!combat.length||!currentActorToken(encounter,scene,combat))return;
 const visibleTokens=canvas.tokens.placeables.filter(visible);
 const visibleIds=new Set(visibleTokens.map(t=>t.id));
 const action=publicAction(message,scene,visibleIds,new Set(combat.map(t=>t.id)));
 if(!action)return;
 const encounterKey=scene+"|"+encounter.id;
 const turnKey=[encounter.round,encounter.turn,encounter.combatant?.id].join("|");
 const fallbackIds=recentShot?.encounter===encounterKey&&recentShot.turn===turnKey&&recentShot.actorId===action.actorId?recentShot.ids.filter(id=>visibleIds.has(id)):[];
 actionDirector.record({encounter:encounterKey,action,now:performance.now(),holdMs:setting("actionHold"),limitMs:setting("actionLimit")*1000,fallbackIds});
 schedule();
});
Hooks.on("updateToken",(doc,change)=>{
 if(!enabled()||!canvas.ready)return;
 if(doc.parent?.id===canvas.scene?.id&&("x" in change||"y" in change)&&!combatTargets().length){
 const t=canvas.tokens.get(doc.id);
 if(visible(t)&&t.actor.type==="party"){mode="party";partyId=t.id;}
 else if(visible(t)&&t.actor.hasPlayerOwner&&t.actor.type!=="party"){
 const groups=cluster(canvas.tokens.placeables.filter(v=>visible(v)&&v.actor.type!=="party"&&v.actor.hasPlayerOwner).map(point),setting("groupDistance")*(canvas.grid.size||100));
 if(groups[0]?.some(p=>p.id===t.id)){mode="individual";partyId=null;}
 }
 }
 schedule();
});
function resetScene(){actionDirector.reset();recentShot=null;combatDirector.reset();explorationCache.clear();wideKey=null;clearTimeout(timer);timer=null;flight=null;sceneId=null;last=null;mode=null;partyId=null;}
Hooks.on("canvasTearDown",()=>{if(!game.ready||!isObserver())return;discardedCommand=setting("cameraCommand")?.issuedAt??null;resetScene();});
Hooks.on("canvasReady",()=>{if(!isObserver())return;resetScene();schedule();});
for(const event of ["createToken","deleteToken","updateCombat","createCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant","sightRefresh","updateSetting","targetToken","combatTurnChange","userConnected"])Hooks.on(event,schedule);
function syncCameraRole(){
 if(enabled()){
  if(heartbeat===null)heartbeat=setInterval(schedule,750);
  schedule();
 }else if(heartbeat!==null){clearInterval(heartbeat);heartbeat=null;resetScene();}
}
Hooks.once("ready",()=>{if(game.user?.isGM)refreshObserverChoices();syncCameraRole();});
Hooks.on("updateSetting",doc=>{if(doc?.key===ID+".observerId"||doc?.key===ID+".enabled"||doc?.key===ID+".observerMode")syncCameraRole();});
for(const event of ["createUser","updateUser","deleteUser"])Hooks.on(event,()=>{if(game.user?.isGM)refreshObserverChoices();});
window.addEventListener("resize",schedule);
