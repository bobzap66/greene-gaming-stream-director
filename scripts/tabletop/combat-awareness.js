import {ID,setting,isObserver} from "../settings.js";
import {maintenanceActive} from "../presentation/maintenance.js";
import {combatAwareness} from "./combat-awareness-policy.js";

let panels=[],lastSignature=null,queued=false,frame=null;
const active=()=>game.ready&&isObserver()&&setting("enabled")&&setting("observerMode")==="tabletop"&&setting("tabletopInitiativeEnabled")&&!maintenanceActive();
function clear(){for(const p of panels)p.remove();panels=[];lastSignature=null;}
function panel(data,edge,rotate,size){
 const root=document.createElement("aside");
 root.className="ggsd-tabletop-initiative";root.setAttribute("role","status");
 if(rotate)root.setAttribute("aria-hidden","true");
 Object.assign(root.style,{position:"fixed",[edge]:"12px",left:"50%",transform:"translateX(-50%)"+(rotate?" rotate(180deg)":""),zIndex:"60",pointerEvents:"none",boxSizing:"border-box",width:"max-content",maxWidth:"92vw",display:"flex",alignItems:"stretch",background:"rgba(18,25,34,.94)",border:"1px solid #bda66b",borderRadius:"8px",boxShadow:"0 3px 12px #0009",color:"#f3e7c9",fontFamily:"system-ui,sans-serif",fontSize:size+"px",lineHeight:"1.2"});
 for(const [label,value] of [["Current turn",data.current??"—"],["On deck",data.next??"—"],["Round",data.round??"—"]]){
  const cell=document.createElement("div");Object.assign(cell.style,{padding:".35em .75em",minWidth:0,flex:label==="Round"?"0 0 auto":"0 1 auto",maxWidth:label==="Round"?"none":"38vw"});
  if(root.childElementCount)cell.style.borderLeft="1px solid #59616a";
  const caption=document.createElement("div");caption.textContent=label;Object.assign(caption.style,{color:"#d8c18c",fontSize:".55em",fontWeight:"700",textTransform:"uppercase",letterSpacing:".07em"});
  const title=document.createElement("div");title.textContent=String(value);Object.assign(title.style,{fontWeight:"700",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
  cell.append(caption,title);root.append(cell);
 }
 document.body.append(root);return root;
}
function reconcile(){
 if(!active()||!canvas.ready){clear();return;}
 const data=combatAwareness({encounter:game.combat,sceneId:canvas.scene?.id,lookup:id=>canvas.tokens.get(id),user:game.user,skipDefeated:game.settings.get("core","combatTrackerConfig")?.skipDefeated===true});
 if(!data){clear();return;}
 const position=setting("tabletopInitiativePosition"),size=setting("tabletopInitiativeSize");
 const sig=JSON.stringify([data,position,size,canvas.scene?.id]);
 if(sig===lastSignature)return;
 clear();lastSignature=sig;
 if(position==="mirrored"||position==="top")panels.push(panel(data,"top",false,size));
 if(position==="mirrored"||position==="bottom")panels.push(panel(data,"bottom",position==="mirrored",size));
}
function schedule(){
 if(!game.ready||(!active()&&!panels.length)||queued)return;
 queued=true;frame=requestAnimationFrame(()=>{queued=false;frame=null;try{reconcile();}catch(e){clear();console.warn(ID,"Tabletop initiative update failed",e);}});
}
function teardown(){if(frame!==null)cancelAnimationFrame(frame);frame=null;queued=false;clear();}
export function registerTabletopCombatAwareness(){
 Hooks.once("ready",schedule);
 for(const event of ["canvasReady","updateCombat","createCombat","deleteCombat","createCombatant","updateCombatant","deleteCombatant","combatTurnChange","updateToken","createToken","deleteToken","sightRefresh","updateActor","updateSetting","ggsdMaintenanceChanged","updateUser"])Hooks.on(event,schedule);
 Hooks.on("canvasTearDown",teardown);
}
