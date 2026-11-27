export const roles=Object.freeze({standby:"Standby",intro:"Starting Soon",gameplay:"Gameplay",break:"Break",technical:"Technical Difficulties",ending:"Ending",artwork:"Artwork",cinematic:"Cinematic"});
export const protectedRoles=Object.freeze(["standby","intro","break","technical","ending"]);
export function protectedScene(status){return !!status?.scene&&protectedRoles.some(role=>status.mappings?.[role]===status.scene);}
export function mappedRoles(status){return Object.keys(roles).filter(role=>!!status?.mappings?.[role]);}
export function normalizeStatus(value){
 if(!value||typeof value!=="object")return null;
 const mappings={};for(const key of Object.keys(roles))if(typeof value.mappings?.[key]==="string")mappings[key]=value.mappings[key];
 return {enabled:value.enabled===true,connected:value.connected===true,active:value.active===true,scene:typeof value.scene==="string"?value.scene:null,streaming:value.streaming===true,recording:value.recording===true,mappings};
}
export function productionWarning(status,{combat=false,expectRecording=false}={}){
 if(!status?.enabled||!status.active)return null;
 if(!status.connected)return "OBS disconnected";
 if(combat&&status.mappings.gameplay&&status.scene!==status.mappings.gameplay&&[status.mappings.standby,status.mappings.intro,status.mappings.break,status.mappings.technical].filter(Boolean).includes(status.scene))return "Combat is active while OBS is on "+status.scene+".";
 if(expectRecording&&status.scene===status.mappings.gameplay&&!status.recording)return "Gameplay is on screen but recording is stopped.";
 return null;
}
