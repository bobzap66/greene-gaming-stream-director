export function normalizeRegion(r,fallback){
 const n=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
 const x=Math.min(90,Math.max(0,n(r?.x,fallback.x)));
 const y=Math.min(90,Math.max(0,n(r?.y,fallback.y)));
 return {x,y,w:Math.min(100-x,Math.max(10,n(r?.w,fallback.w))),h:Math.min(100-y,Math.max(10,n(r?.h,fallback.h)))};
}
export function pixels(r,width,height){return {x:r.x*width/100,y:r.y*height/100,width:r.w*width/100,height:r.h*height/100};}
export function cameraOffset(target,rect,width,height){
 return {...target,x:target.x+(width/2-rect.x-rect.width/2)/target.scale,y:target.y+(height/2-rect.y-rect.height/2)/target.scale};
}
