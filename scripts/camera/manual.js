// GM commands are world settings, not unauthenticated socket messages.
// A command applies only to its original scene and designated observer.
export const MODES=["auto","hold","wide","follow","focus","mirror","full"];
export function effectiveCommand(command,sceneId,observerId){
 if(!command||!sceneId||!observerId||command.sceneId!==sceneId||command.observerId!==observerId||!([...MODES,"bookmark"].includes(command.mode)))return {mode:"auto"};
 if(command.mode==="follow"&&(typeof command.tokenId!=="string"||!command.tokenId))return {mode:"auto"};
 if(["focus","mirror","bookmark"].includes(command.mode)&&(!Number.isFinite(command.x)||!Number.isFinite(command.y)||!Number.isFinite(command.scale)||command.scale<=0))return {mode:"auto"};
 return command;
}
export function transitionDuration(speed,fallback=750){
 return speed==="cut"?0:speed==="cinematic"?1800:speed==="smooth"?750:fallback;
}
export function locationTarget(x,y,scale,rect,center){
 if(![x,y,scale,rect.x,rect.y,rect.width,rect.height,center.x,center.y].every(Number.isFinite)||scale<=0||rect.width<=0||rect.height<=0)return null;
 return {x:x+(center.x-rect.x-rect.width/2)/scale,y:y+(center.y-rect.y-rect.height/2)/scale,scale};
}
export function manualTarget(command,{rect,center,current,sceneRect,exploredRect,tokenVision=true,wideMargin=.1,autoFrame,token,visible,maxScale=1.5,frame}){
 if(command.mode==="hold")return null;
 if(command.mode==="wide"||command.mode==="full"){
 const useExplored=command.mode==="wide"&&tokenVision;
 const bounds=useExplored?exploredRect:sceneRect;
 if(!bounds||bounds.width<=0||bounds.height<=0)return useExplored?(autoFrame?.()??null):null;
 const margin=useExplored?1+Math.max(0,Math.min(.6,wideMargin)):1;
 const s=Math.min(maxScale,rect.width/(bounds.width*margin),rect.height/(bounds.height*margin));
 return locationTarget(bounds.x+bounds.width/2,bounds.y+bounds.height/2,s,rect,center);
 }
 if(command.mode==="follow"){
 if(!token||!visible(token))return null;
 return frame(token);
 }
 if(["focus","mirror","bookmark"].includes(command.mode))return locationTarget(command.x,command.y,Math.min(maxScale,command.scale),rect,center);
 return null;
}
