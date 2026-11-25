import {cluster} from "./framing.js";
export function chooseExploration(individuals,parties,mode,partyId,distance,last){
 const groups=cluster(individuals,distance);
 const nearest=(a,b)=>last?Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y):0;
 const party=parties.find(p=>p.id===partyId)??[...parties].sort(nearest)[0];
 if(party&&(mode==="party"||!individuals.length))return [party];
 if(!groups.length)return [];
 const center=g=>({x:g.reduce((s,p)=>s+p.x,0)/g.length,y:g.reduce((s,p)=>s+p.y,0)/g.length});
 return groups.filter(g=>g.length===groups[0].length).sort((a,b)=>nearest(center(a),center(b)))[0];
}
export function safeTarget(points,rect,center,current,{margin=.2,padding=0,maxScale=1.5,force=false}={}){
 if(!points.length||rect.width<=0||rect.height<=0)return null;
 const l=Math.min(...points.map(p=>p.x-p.width/2)),r=Math.max(...points.map(p=>p.x+p.width/2));
 const t=Math.min(...points.map(p=>p.y-p.height/2)),b=Math.max(...points.map(p=>p.y+p.height/2));
 const w=Math.max(1,(r-l)*(1+margin)+2*padding),h=Math.max(1,(b-t)*(1+margin)+2*padding);
 const ideal=Math.min(maxScale,rect.width/w,rect.height/h);
 const s=current.scale;
 const inside=s>0&&center.x+(l-current.x)*s>=rect.x&&center.x+(r-current.x)*s<=rect.x+rect.width&&center.y+(t-current.y)*s>=rect.y&&center.y+(b-current.y)*s<=rect.y+rect.height;
 const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 const groupX=(l+r)/2,groupY=(t+b)/2;
 const drift=Math.hypot(center.x+(groupX-current.x)*s-cx,center.y+(groupY-current.y)*s-cy);
 if(!force&&inside&&s<=maxScale&&s>=ideal*.8&&s<=ideal*1.15&&drift<Math.min(rect.width,rect.height)*.12)return current;
 const scale=!force&&s>0&&s<=ideal*1.03&&s>=ideal*.8&&s<=maxScale?s:ideal;
 return {x:groupX+(center.x-cx)/scale,y:groupY+(center.y-cy)/scale,scale};
}

/** Resolve combat only on the viewed scene; scene-less encounters use token membership. */
export function sceneCombatTargets(encounter,sceneId,lookup,eligible){
 if(!encounter?.started||!encounter?.isActive||!sceneId)return [];
 const encounterScene=encounter.scene?.id??(typeof encounter.scene==="string"?encounter.scene:null);
 if(encounterScene&&encounterScene!==sceneId)return [];
 const targets=[];
 for(const c of encounter.combatants??[]){
  const combatantScene=c.sceneId??c.scene?.id??c.token?.parent?.id;
  if(combatantScene&&combatantScene!==sceneId)continue;
  const token=lookup(c.tokenId);
  if(token&&eligible(token))targets.push(token);
 }
 return targets;
}
