import {cluster} from "./camera/framing.js";
import {ID,registerSettings,refreshObserverChoices,setting,isObserver} from "./settings.js";
import {registerEditor} from "./layout/editor.js";
import {registerLayout,region} from "./layout/runtime.js";
import {pixels} from "./layout/geometry.js";
import {safeTarget,chooseExploration,sceneCombatTargets} from "./camera/director.js";
let timer,flight=null,last=null,mode=null,partyId=null,sceneId=null;
Hooks.once("init",()=>{registerSettings();registerEditor();registerLayout();});
const enabled=()=>game.ready&&isObserver()&&setting("enabled");
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
 if(!points.length)return;
 const layout=setting("layoutEnabled");
 const rect=pixels(layout?region("camera"):{x:14,y:10,w:72,h:80},innerWidth,innerHeight);
 const stage=canvas.stage;
 const current={x:stage.pivot.x,y:stage.pivot.y,scale:stage.scale.x};
 const members=points.map(p=>p.id).sort().join(",");
 const key=[sceneId,active,members,innerWidth,innerHeight,JSON.stringify(rect)].join("|");
 const target=safeTarget(points,rect,{x:stage.position.x,y:stage.position.y},current,{margin:layout?setting("frameMargin")/100:0,padding:layout?0:setting("padding")*grid,maxScale:setting("maxZoom"),force:key!==last?.key});
 if(!target)return;
 if(Math.hypot(target.x-current.x,target.y-current.y)*current.scale<2&&Math.abs(target.scale-current.scale)<.005){last={...target,key};return;}
 const duration=setting("transition"),run={scene:sceneId};
 flight=run;
 let watchdog;
 try{
  const completed=await Promise.race([Promise.resolve(canvas.animatePan({...target,duration})).then(()=>true),new Promise(resolve=>{watchdog=setTimeout(()=>resolve(false),duration+1500);})]);
  if(completed&&flight===run&&canvas.scene?.id===run.scene)last={...target,key};
  if(!completed&&flight===run)last=null;
 }finally{clearTimeout(watchdog);if(flight===run){flight=null;schedule();}}
}
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
function resetScene(){clearTimeout(timer);timer=null;flight=null;sceneId=null;last=null;mode=null;partyId=null;}
Hooks.on("canvasTearDown",resetScene);
Hooks.on("canvasReady",()=>{resetScene();schedule();});
for(const event of ["createToken","deleteToken","updateCombat","createCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant","sightRefresh"])Hooks.on(event,schedule);
Hooks.once("ready",()=>{refreshObserverChoices();schedule();setInterval(schedule,750);});
for(const event of ["createUser","updateUser","deleteUser"])Hooks.on(event,refreshObserverChoices);
window.addEventListener("resize",schedule);
