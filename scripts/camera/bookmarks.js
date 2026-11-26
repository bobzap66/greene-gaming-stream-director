const speeds=new Set(["cut","smooth","cinematic"]);
export function validBookmark(b){
 return !!b&&typeof b.id==="string"&&!!b.id&&typeof b.name==="string"&&!!b.name.trim()&&[b.x,b.y,b.scale].every(Number.isFinite)&&b.scale>0&&speeds.has(b.speed);
}
export function sceneBookmarks(data){
 return Array.isArray(data)?data.filter(validBookmark):[];
}
export function putBookmark(data,bookmark){
 if(!validBookmark(bookmark))throw Error("Invalid camera bookmark");
 const list=sceneBookmarks(data);
 const clean={id:bookmark.id,name:bookmark.name.trim().slice(0,80),x:bookmark.x,y:bookmark.y,scale:bookmark.scale,speed:bookmark.speed};
 return list.some(b=>b.id===clean.id)?list.map(b=>b.id===clean.id?clean:b):[...list,clean];
}
export function removeBookmark(data,id){return sceneBookmarks(data).filter(b=>b.id!==id);}
export function bookmarkCommand(bookmark){
 if(!validBookmark(bookmark))return null;
 return {x:bookmark.x,y:bookmark.y,scale:bookmark.scale,speed:bookmark.speed,bookmarkId:bookmark.id};
}
