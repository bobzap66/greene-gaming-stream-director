// Physical calibration is valid only for matching CSS-pixel metrics.
export function matchingProfiles(profiles,signature,label){
 return (Array.isArray(profiles)?profiles:[]).filter(p=>p&&p.signature===signature&&Number.isFinite(p.ppi)&&p.ppi>=10&&p.ppi<=500&&(!label||!p.label||p.label===label));
}
export function chooseProfile(profiles,signature,label,selected){
 const matches=matchingProfiles(profiles,signature,label);
 const exact=matches.filter(p=>label&&p.label===label);
 if(exact.length===1)return exact[0];
 if(exact.length>1)return exact.find(p=>p.id===selected)??null;
 // Without reliable identification, use only explicitly selected matching profile.
 return matches.find(p=>p.id===selected)??null;
}
export function snapDelta(start,end,grid){
 if(![start.x,start.y,end.x,end.y,grid].every(Number.isFinite)||grid<=0)return null;
 return {x:start.x+Math.round((end.x-start.x)/grid)*grid,y:start.y+Math.round((end.y-start.y)/grid)*grid};
}
export function viewportBounds({x,y,scale,width,height}){
 if(![x,y,scale,width,height].every(Number.isFinite)||scale<=0||width<=0||height<=0)return null;
 return {x:x-width/scale/2,y:y-height/scale/2,w:width/scale,h:height/scale};
}
