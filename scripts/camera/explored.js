// Read-only observer fog sampling. Bound the work even for extreme map aspect ratios.
export function sampleExplored(rect,gridSize,isExplored,maxSamples=2000){
 if(!rect||![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0||typeof isExplored!=="function")return null;
 const step=Math.max(Number.isFinite(gridSize)&&gridSize>0?gridSize/2:1,Math.sqrt(rect.width*rect.height/maxSamples));
 const cols=Math.max(1,Math.min(maxSamples,Math.round(rect.width/step)));
 const rows=Math.max(1,Math.min(Math.floor(maxSamples/cols),Math.round(rect.height/step)));
 const dx=rect.width/cols,dy=rect.height/rows;
 let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=rect.x+i*dx,y=rect.y+j*dy;
  if(!isExplored({x:x+dx/2,y:y+dy/2}))continue;
  l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+dx);b=Math.max(b,y+dy);
 }
 return Number.isFinite(l)?{x:l,y:t,width:r-l,height:b-t}:null;
}
export function unionVisible(bounds,points){
 if(!points?.length)return bounds;
 const l=Math.min(bounds?.x??Infinity,...points.map(p=>p.x-p.width/2));
 const t=Math.min(bounds?.y??Infinity,...points.map(p=>p.y-p.height/2));
 const r=Math.max(bounds?bounds.x+bounds.width:-Infinity,...points.map(p=>p.x+p.width/2));
 const b=Math.max(bounds?bounds.y+bounds.height:-Infinity,...points.map(p=>p.y+p.height/2));
 return {x:l,y:t,width:r-l,height:b-t};
}
export function createExplorationCache(interval=1000){
 let entry=null;
 return {
  clear(){entry=null;},
  get(key,now,sample){
   if(!entry||entry.key!==key||now-entry.time>=interval)entry={key,time:now,bounds:sample()};
   return entry.bounds;
  }
 };
}
