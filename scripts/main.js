import {cluster,frame} from "./camera/framing.js";
import {ID,registerSettings,setting,isObserver as designatedObserver} from "./settings.js";
import {registerEditor} from "./layout/editor.js";
import {registerLayout,region} from "./layout/runtime.js";
import {pixels,cameraOffset} from "./layout/geometry.js";
let timer,last;
Hooks.once("init",()=>{registerSettings();registerEditor();registerLayout();});
function isObserver(){return designatedObserver() && setting("enabled");}
function pointsFor(tokens){return tokens.filter(t=>t && !t.document.hidden && t.isVisible && t.actor).map(t=>({id:t.id,x:t.center.x,y:t.center.y,width:t.w,height:t.h}));}
function schedule(){if(!isObserver() || timer) return; timer=setTimeout(()=>{timer=null; update().catch(error=>console.error(ID,error));},500);}
async function update(){
  if(!isObserver()||!canvas.ready)return;
  const sceneId=canvas.scene.id;
  const encounter=game.combat;
  const active=Boolean(encounter?.started && encounter?.isActive);
  const grid=canvas.grid.size||100;
  let points;
  if(active){
    points=pointsFor(Array.from(encounter.combatants).map(c=>canvas.tokens.get(c.tokenId)));
  }else{
    const party=pointsFor(canvas.tokens.placeables.filter(t=>t.actor?.hasPlayerOwner));
    const groups=cluster(party,setting('groupDistance')*grid);
    const tied=groups.filter(g=>g.length===groups[0]?.length);
    points=tied.sort((a,b)=>distance(a,last)-distance(b,last))[0]||[];
  }
  const layout=setting("layoutEnabled");
  const rect=layout?pixels(region("camera"),innerWidth,innerHeight):{width:innerWidth*.72,height:innerHeight*.8};
  const minScale=Math.min(setting("minZoom"),setting("maxZoom"));
  const raw=frame(points,rect,{padding:setting("padding")*grid,minScale,maxScale:setting("maxZoom")});
  const target=raw&&layout?cameraOffset(raw,rect,innerWidth,innerHeight):raw;
  if(!target)return;
  if(last?.sceneId===sceneId && last.active===active && last.members===points.map(p=>p.id).sort().join(",") && Math.hypot(target.x-last.x,target.y-last.y)<grid && Math.abs(target.scale-last.scale)<.12)return;
  last={...target,sceneId,active,members:points.map(p=>p.id).sort().join(",")};
  await canvas.animatePan({...target,duration:setting('transition')});
}
function distance(group,previous){if(!previous)return 0;return Math.hypot(group.reduce((s,p)=>s+p.x,0)/group.length-previous.x,group.reduce((s,p)=>s+p.y,0)/group.length-previous.y);}
Hooks.on("canvasReady",()=>{last=null;schedule();});
for(const event of ["updateToken","createToken","deleteToken","updateCombat","createCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant","sightRefresh"]) Hooks.on(event,schedule);
// Reconcile after encounter transitions even if the observer receives no
// combat hook, or visibility changes after the initial document update.
Hooks.once("ready",()=>{
  schedule();
  setInterval(()=>{if(isObserver() && canvas.ready) schedule();},1000);
});
