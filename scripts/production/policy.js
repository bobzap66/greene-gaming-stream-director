export const roles=Object.freeze({intro:"Starting Soon",gameplay:"Gameplay",break:"Break",ending:"Ending",artwork:"Artwork",cinematic:"Cinematic"});
export function normalizeStatus(value){
 if(!value||typeof value!=="object")return null;
 const mappings={};for(const key of Object.keys(roles))if(typeof value.mappings?.[key]==="string")mappings[key]=value.mappings[key];
 return {enabled:value.enabled===true,connected:value.connected===true,active:value.active===true,scene:typeof value.scene==="string"?value.scene:null,streaming:value.streaming===true,recording:value.recording===true,mappings};
}
export function productionWarning(status,{combat=false,expectRecording=false}={}){
 if(!status?.enabled||!status.active)return null;
 if(!status.connected)return "OBS disconnected";
 if(combat&&status.mappings.gameplay&&status.scene!==status.mappings.gameplay&&[status.mappings.intro,status.mappings.break].filter(Boolean).includes(status.scene))return "Combat is active while OBS is on "+status.scene+".";
 if(expectRecording&&status.scene===status.mappings.gameplay&&!status.recording)return "Gameplay is on screen but recording is stopped.";
 return null;
}
