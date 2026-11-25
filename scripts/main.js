import {cluster,frame} from "./camera/framing.js";
const ID="greene-gaming-stream-director";
let timer, last;
Hooks.once("init",()=>{
  game.settings.register(ID,"observerId",{name:"Observer user ID",hint:"Foundry user ID of the dedicated stream observer.",scope:"world",config:true,type:String,default:""});
  game.settings.register(ID,"enabled",{name:"Enable spectator camera",hint:"Disable Monk's Screen tracking before enabling.",scope:"world",config:true,type:Boolean,default:false});
});
function isObserver(){return !game.user.isGM && game.settings.get(ID,"enabled") && game.user.id===game.settings.get(ID,"observerId");}
function pointsFor(tokens){return tokens.filter(t=>t && !t.document.hidden && t.isVisible && t.actor).map(t=>({id:t.id,x:t.center.x,y:t.center.y,width:t.w,height:t.h}));}
function schedule(){if(!isObserver()) return; clearTimeout(timer);timer=setTimeout(update,500);}
async function update(){
  if(!isObserver()||!canvas.ready)return;
  const sceneId=canvas.scene.id;
  const encounter=game.combat;
  const active=encounter?.started && encounter.scene?.id===sceneId;
  const grid=canvas.grid.size||100;
  let points;
  if(active){
    points=pointsFor(Array.from(encounter.combatants).map(c=>canvas.tokens.get(c.tokenId)));
  }else{
    const party=pointsFor(canvas.tokens.placeables.filter(t=>t.actor?.hasPlayerOwner));
    const groups=cluster(party,8*grid);
    const tied=groups.filter(g=>g.length===groups[0]?.length);
    points=tied.sort((a,b)=>distance(a,last)-distance(b,last))[0]||[];
  }
  const target=frame(points,{width:window.innerWidth*.72,height:window.innerHeight*.8},{padding:2*grid,minScale:.4,maxScale:1.5});
  if(!target)return;
  if(last?.sceneId===sceneId && Math.hypot(target.x-last.x,target.y-last.y)<grid && Math.abs(target.scale-last.scale)<.12)return;
  last={...target,sceneId};
  await canvas.animatePan({...target,duration:750});
}
function distance(group,previous){if(!previous)return 0;return Math.hypot(group.reduce((s,p)=>s+p.x,0)/group.length-previous.x,group.reduce((s,p)=>s+p.y,0)/group.length-previous.y);}
Hooks.on("canvasReady",()=>{last=null;schedule();});
for(const event of ["updateToken","createToken","deleteToken","updateCombat","createCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant","sightRefresh"]) Hooks.on(event,schedule);
Hooks.once("ready",schedule);
