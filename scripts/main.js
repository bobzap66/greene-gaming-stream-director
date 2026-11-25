import {cluster} from "./camera/framing.js";
import {ID,registerSettings,refreshObserverChoices,setting,isObserver} from "./settings.js";
import {registerEditor} from "./layout/editor.js";
import {registerLayout,region} from "./layout/runtime.js";
import {pixels} from "./layout/geometry.js";
import {safeTarget,chooseExploration} from "./camera/director.js";
let timer,busy=false,last=null,mode=null,partyId=null,sceneId=null;
Hooks.once("init",()=>{registerSettings();registerEditor();registerLayout();});
const enabled=()=>game.ready&&isObserver()&&setting("enabled");
const visible=t=>t&&t.actor&&t.isVisible&&!t.document.hidden;
const point=t=>({id:t.id,x:t.center.x,y:t.center.y,width:t.w,height:t.h});
function schedule(){if(!enabled()||timer)return;timer=setTimeout(()=>{timer=null;update().catch(e=>console.error(ID,e));},200);}
async function update(){
 if(!enabled()||!canvas.ready||busy)return;
 if(sceneId!==canvas.scene.id){sceneId=canvas.scene.id;mode=null;partyId=null;last=null;}
 const active=Boolean(game.combat?.started&&game.combat?.isActive);
 const grid=canvas.grid.size||100;
 const tokens=canvas.tokens.placeables.filter(visible);
 const individuals=tokens.filter(t=>t.actor.type!=="party"&&t.actor.hasPlayerOwner).map(point);
 const parties=tokens.filter(t=>t.actor.type==="party").map(point);
 let points;
 if(active)points=Array.from(game.combat.combatants).map(c=>canvas.tokens.get(c.tokenId)).filter(visible).map(point);
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
 busy=true;
 try{await canvas.animatePan({...target,duration:setting("transition")});last={...target,key};}
 finally{busy=false;}
}
Hooks.on("updateToken",(doc,change)=>{
 if(doc.parent?.id===canvas.scene?.id&&("x" in change||"y" in change)&&!game.combat?.started){
 const t=canvas.tokens.get(doc.id);
 if(visible(t)&&t.actor.type==="party"){mode="party";partyId=t.id;}
 else if(visible(t)&&t.actor.hasPlayerOwner&&t.actor.type!=="party"){
 const groups=cluster(canvas.tokens.placeables.filter(v=>visible(v)&&v.actor.type!=="party"&&v.actor.hasPlayerOwner).map(point),setting("groupDistance")*(canvas.grid.size||100));
 if(groups[0]?.some(p=>p.id===t.id)){mode="individual";partyId=null;}
 }
 }
 schedule();
});
Hooks.on("canvasReady",()=>{sceneId=null;last=null;schedule();});
for(const event of ["createToken","deleteToken","updateCombat","createCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant","sightRefresh"])Hooks.on(event,schedule);
Hooks.once("ready",()=>{refreshObserverChoices();schedule();setInterval(schedule,750);});
for(const event of ["createUser","updateUser","deleteUser"])Hooks.on(event,refreshObserverChoices);
window.addEventListener("resize",schedule);
