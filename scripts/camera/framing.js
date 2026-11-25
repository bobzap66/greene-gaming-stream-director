// Pure camera geometry; no Foundry dependencies.
export function cluster(points, distance) {
  const remaining = new Set(points);
  const groups = [];
  while (remaining.size) {
    const first = remaining.values().next().value;
    remaining.delete(first);
    const group = [first];
    for (let i = 0; i < group.length; i++) {
      for (const p of remaining) {
        if (Math.hypot(p.x-group[i].x,p.y-group[i].y)<=distance) {
          remaining.delete(p); group.push(p);
        }
      }
    }
    groups.push(group);
  }
  return groups.sort((a,b)=>b.length-a.length);
}
export function frame(points, viewport, {padding=200,minScale=.4,maxScale=1.5}={}) {
  if (!points.length || viewport.width<=0 || viewport.height<=0) return null;
  const left=Math.min(...points.map(p=>p.x-(p.width||0)/2));
  const right=Math.max(...points.map(p=>p.x+(p.width||0)/2));
  const top=Math.min(...points.map(p=>p.y-(p.height||0)/2));
  const bottom=Math.max(...points.map(p=>p.y+(p.height||0)/2));
  const scale=Math.max(minScale,Math.min(maxScale,viewport.width/Math.max(1,right-left+2*padding),viewport.height/Math.max(1,bottom-top+2*padding)));
  return {x:(left+right)/2,y:(top+bottom)/2,scale};
}
