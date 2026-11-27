import {ID,setting,isObserver} from "../settings.js";
export function cueView(s,{breakMinutes=0,technical=false,intro=true}={}){
 if(!s?.enabled||!s.connected||!s.active||!s.scene)return null;
 const m=s.mappings||{},c=s.cue;
 if(s.scene===m.standby&&intro)return {kind:"standby",label:"Starting Soon",remainingMs:null};
 if(s.scene===m.intro&&intro)return {kind:"intro",label:c?.introReady?"Ready to begin":"Starting Soon",remainingMs:c?.introReady?0:c?.introRemainingMs??null,alert:c?.introReady===true};
 if(s.scene===m.break&&breakMinutes>0&&c){const remainingMs=Math.max(0,breakMinutes*60000-c.elapsedMs);return {kind:"break",label:"Intermission",remainingMs,alert:remainingMs===0};}
 if(s.scene===m.technical&&technical)return {kind:"technical",label:"Technical Difficulties",remainingMs:null,elapsedMs:c?.elapsedMs??0};
 return null;
}
export function formatDuration(ms){const n=Math.max(0,Math.ceil(ms/1000));return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");}
let panel=null,lastAlert=null,lastPublished="",lastPublish=0,publishing=false,pending=null,activeAudio=null;
function sound(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ctx=activeAudio??=new A();if(ctx.state!=="running")return;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=660;g.gain.value=.075;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.25);}catch{}}
export function unlockCueAudio(){if(!setting("obsCueSound"))return;try{const A=window.AudioContext||window.webkitAudioContext;if(A){activeAudio??=new A();void activeAudio.resume().catch(()=>{});}}catch{}}
function flush(){if(publishing||!pending)return;const next=pending;pending=null;publishing=true;void game.settings.set(ID,"obsPublicCue",next).catch(e=>{lastPublished="";console.warn(ID,"Public cue update failed",e);}).finally(()=>{publishing=false;flush();});}
function publish(view){
 const gm=Array.from(game.users).filter(u=>u.active&&u.isGM).sort((a,b)=>a.id.localeCompare(b.id))[0];
 if(gm?.id!==game.user.id)return;
 const show=setting("obsCuePlayers")||setting("obsCueObserver");
 const safe=show&&view?{kind:view.kind,label:view.label,deadline:view.remainingMs===null?null:Date.now()+view.remainingMs}:null;
 const signature=JSON.stringify(safe?{kind:safe.kind,label:safe.label,deadline:safe.deadline===null?null:Math.round(safe.deadline/2000)}:null);
 const now=Date.now();if(signature===lastPublished&&now-lastPublish<5000)return;
 lastPublished=signature;lastPublish=now;pending={view:safe,expires:now+12000};flush();
}
export function drawCues(status,node){
 if(!game.user?.isGM)return;
 const view=cueView(status,{breakMinutes:Math.max(0,Math.min(120,Number(setting("obsBreakMinutes"))||0)),technical:setting("obsTechnicalTimer"),intro:setting("obsIntroCue")});
 if(node){node.hidden=!view;node.textContent=view?view.label+(view.kind==="technical"?" · "+formatDuration(view.elapsedMs):view.remainingMs===null?"":view.remainingMs===0?" · Waiting for GM":" · "+formatDuration(view.remainingMs)):"";}
 const alert=view?.alert?status?.cue?.id+"|"+view.kind:null;
 if(alert&&alert!==lastAlert){lastAlert=alert;ui.notifications.info(view.kind==="intro"?"Intro complete — ready to go live.":"Break complete — ready to resume.");if(setting("obsCueSound"))sound();}
 if(!view)lastAlert=null;
 publish(view);
}
function playerDraw(){
 if(game.user?.isGM)return;
 const packet=setting("obsPublicCue"),v=packet?.view;
 const allowed=setting("obsProductionEnabled")&&(isObserver()?setting("obsCueObserver"):setting("obsCuePlayers"));
 if(!allowed||!v||!Number.isFinite(packet.expires)||Date.now()>packet.expires){panel?.remove();panel=null;return;}
 if(!panel){panel=document.createElement("aside");panel.id="ggsd-player-production-cue";Object.assign(panel.style,{position:"fixed",top:"65px",left:"50%",transform:"translateX(-50%)",zIndex:"90",background:"#19212c",color:"#fff",padding:"12px 24px",border:"1px solid #bda66b",borderRadius:"7px",textAlign:"center",pointerEvents:"none",minWidth:"190px"});panel.setAttribute("role","status");document.body.append(panel);}
 const remaining=Number.isFinite(v.deadline)?Math.max(0,v.deadline-Date.now()):null;
 panel.textContent="";
 const title=document.createElement("div");title.textContent=v.label;title.style.color="#e0cd9a";panel.append(title);
 const time=document.createElement("strong");time.style.fontSize="24px";time.style.fontVariantNumeric="tabular-nums";time.textContent=remaining===null?"Please stand by":remaining===0?"Waiting for GM":formatDuration(remaining);panel.append(time);
}
export function registerCues(){
 const reg=(k,name,type,def,extra={})=>game.settings.register(ID,k,{name,type,default:def,scope:"world",config:true,requiresReload:false,...extra});
 reg("obsIntroCue","OBS intro completion cues",Boolean,false);
 reg("obsBreakMinutes","OBS break duration (minutes; 0 disables)",Number,0,{range:{min:0,max:120,step:1}});
 reg("obsTechnicalTimer","OBS technical difficulties elapsed timer",Boolean,false);
 reg("obsCuePlayers","Show production notices to players",Boolean,false);
 reg("obsCueObserver","Show production notices to stream observer",Boolean,false);
 reg("obsCueSound","Play GM production cue sound",Boolean,false);
 reg("obsPublicCue","Public production cue",Object,{},{config:false});
 Hooks.once("ready",()=>{if(!game.user?.isGM){playerDraw();setInterval(playerDraw,500);}else{document.addEventListener("pointerdown",unlockCueAudio);}});
}
