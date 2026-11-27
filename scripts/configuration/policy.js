// Portable configuration deliberately excludes identities, permissions, live commands and hardware calibration.
export const FORMAT="ggsd-portable-settings", VERSION=1;
const suffixes=["Navigation","Controls","Hotbar","Players","Pause","ChatInput","DismissArt","DismissJournal","DismissUserConfig","PF2eHUD","CombatLimit","DismissDelay"];
export const portableKeys=Object.freeze([
 "observerMode","groupDistance","padding","minZoom","maxZoom","transition","frameMargin","wideMargin",
 "combatStyle","actionAware","actionHold","actionLimit","cinematicPadding","bookmarkHold","bookmarkIndefinite",
 "layoutEnabled","artEnabled","chatEnabled","combatEnabled","chatScale","regions",
 "presentationEnabled","presentationChat","presentationCombat",...suffixes.map(s=>"presentation"+s),
 "tabletopGridInches","tabletopRememberPosition","tabletopSnapMovement","tabletopLayoutEnabled","tabletopArtEnabled","tabletopChatEnabled","tabletopCombatEnabled","tabletopChatScale","tabletopRegions",
 "tabletopPresentationEnabled","tabletopShowChat","tabletopShowCombat",...suffixes.map(s=>"tabletopPresentation"+s)
]);
const permitted=new Set(portableKeys);
const plain=v=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const copy=v=>JSON.parse(JSON.stringify(v));
export const presets=Object.freeze({
 tactical:{label:"Broadcast — Tactical",description:"Wide combat framing for readability.",values:{observerMode:"broadcast",combatStyle:"tactical",presentationEnabled:true,layoutEnabled:true,presentationChat:true,presentationCombat:true}},
 cinematic:{label:"Broadcast — Cinematic",description:"Follow initiative, targets and public actions.",values:{observerMode:"broadcast",combatStyle:"cinematic",actionAware:true,presentationEnabled:true,layoutEnabled:true,presentationChat:true,presentationCombat:true}},
 hybrid:{label:"Broadcast — Hybrid",description:"Wide planning shots with public action close-ups.",values:{observerMode:"broadcast",combatStyle:"hybrid",actionAware:true,presentationEnabled:true,layoutEnabled:true,presentationChat:true,presentationCombat:true}},
 tabletop:{label:"Physical Tabletop",description:"Stable map, one-inch grid and uncluttered presentation. Calibrate on observer.",values:{observerMode:"tabletop",tabletopGridInches:1,tabletopRememberPosition:true,tabletopSnapMovement:true,tabletopPresentationEnabled:true,tabletopLayoutEnabled:false,tabletopShowChat:false,tabletopShowCombat:false}}
});
export function validateValue(key,value,spec){
 if(!permitted.has(key)||!spec||spec.scope!=="world")throw Error("Not a portable setting: "+key);
 if(spec.type===Boolean&&typeof value==="boolean")return value;
 if(spec.type===String&&typeof value==="string"&&(!spec.choices||Object.hasOwn(spec.choices,value)))return value;
 if(spec.type===Number&&finite(value)){
  const {min,max}=spec.range??{};
  if((finite(min)&&value<min)||(finite(max)&&value>max)||(spec.choices&&!Object.hasOwn(spec.choices,String(value))))throw Error("Invalid value for "+key);
  return value;
 }
 if(spec.type===Object&&(key==="regions"||key==="tabletopRegions")&&plain(value)){
  const required=Object.keys(spec.default);
  if(Object.keys(value).length!==required.length||required.some(k=>!Object.hasOwn(value,k)))throw Error("Invalid region names: "+key);
  const result={};
  for(const k of required){
   const v=value[k];if(!plain(v)||Object.keys(v).length!==4||!["x","y","w","h"].every(p=>Object.hasOwn(v,p)&&finite(v[p]))||v.x<0||v.y<0||v.w<10||v.h<10||v.x+v.w>100.000001||v.y+v.h>100.000001)throw Error("Invalid region: "+k);
   result[k]={x:v.x,y:v.y,w:v.w,h:v.h};
  }return result;
 }
 throw Error("Invalid value for "+key);
}
export function validateSettings(values,specFor){
 if(!plain(values)||!Object.keys(values).length)throw Error("No portable settings found");
 const result={};
 for(const [key,value] of Object.entries(values))result[key]=validateValue(key,value,specFor(key));
 return result;
}
export function exportSettings(read,specFor){
 return validateSettings(Object.fromEntries(portableKeys.map(k=>[k,read(k)])),specFor);
}
export function makeDocument(name,settings){return {format:FORMAT,version:VERSION,name:String(name).slice(0,100),settings:copy(settings)};}
export function parseDocument(doc,specFor){
 if(!plain(doc)||doc.format!==FORMAT||doc.version!==VERSION)throw Error("Unsupported Stream Director preset format");
 return makeDocument(typeof doc.name==="string"?doc.name:"Imported preset",validateSettings(doc.settings,specFor));
}
export function changesFor(values,read,specFor){
 return Object.entries(validateSettings(values,specFor)).filter(([k,v])=>JSON.stringify(read(k))!==JSON.stringify(v)).map(([key,value])=>({key,value,previous:copy(read(key)),reload:!!specFor(key).requiresReload}));
}
// Validate every value before writing. On failure, attempt reverse-order rollback.
export async function applyChanges(changes,write){
 const applied=[];
 try{for(const c of changes){applied.push(c);await write(c.key,c.value);}}
 catch(e){const failures=[];for(const c of applied.reverse()){try{await write(c.key,c.previous);}catch{failures.push(c.key);}}
 throw Error(String(e.message??e)+(failures.length?"; rollback incomplete: "+failures.join(", "):"; previous settings restored"));}
}
