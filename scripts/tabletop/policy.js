export function physicalScale(pixelsPerInch,gridInches,gridPixels){
 if(![pixelsPerInch,gridInches,gridPixels].every(v=>Number.isFinite(v)&&v>0))return null;
 return pixelsPerInch*gridInches/gridPixels;
}
export function tabletopTarget(command,{current,sceneRect,token,visible,scale}){
 if(!Number.isFinite(scale)||scale<=0)return null;
 let x=current.x,y=current.y;
 if(["focus","bookmark","mirror"].includes(command.mode)){x=command.x;y=command.y;}
 else if(command.mode==="follow"&&token&&visible(token)){x=token.center.x;y=token.center.y;}
 else if(["wide","full"].includes(command.mode)){x=sceneRect.x+sceneRect.width/2;y=sceneRect.y+sceneRect.height/2;}
 if(![x,y].every(Number.isFinite))return null;
 return {x,y,scale};
}
export function displaySignature({width,height,dpr}){return [width,height,dpr].join("|");}
