// Pure presentation policy: never create or expose combatant data.
export const hideRules={
 presentationNavigation:"#navigation, #scene-navigation",
 presentationControls:"#controls, #scene-controls",
 presentationHotbar:"#hotbar",
 presentationPF2eHUD:"#pf2e-hud-persistent > :not(#hotbar)",
 presentationPlayers:"#players",
 presentationPause:"#pause, #game-pause",
 presentationChatInput:"#chat-form, #chat-controls, #chat-message, #chat .chat-form, #chat .chat-controls"
};
export function presentationCSS(options){
 if(!options.enabled)return "";
 const rules=[];
 for(const [key,selector] of Object.entries(hideRules))if(options[key])rules.push(selector+"{display:none!important;}");
 if(options.presentationChat){
  rules.push("#sidebar-tabs, #sidebar .sidebar-tabs, #sidebar .sidebar-header{display:none!important;}");
 }else rules.push("#chat{display:none!important;}");
 rules.push("[data-ggsd-combat-hidden]{display:none!important;}");
 return rules.join("\n");
}
export function combatRows(count,active,limit){
 const n=Math.max(0,count),size=Math.max(1,Math.min(n,Math.trunc(limit)||3));
 if(!n)return [];
 const start=Math.max(0,Math.min(active<0?0:active,n-size));
 return Array.from({length:Math.min(n,size)},(_,i)=>start+i);
}
// Native HTMLFormElement exposes indexed controls; only unwrap legacy containers.
export function applicationElement(app){
 const el=app?.element;
 if(typeof el?.matches==="function")return el;
 return typeof el?.[0]?.matches==="function"?el[0]:null;
}
export function contentKind(element){
 if(!element?.matches)return null;
 if(element.matches(".image-popout"))return "art";
 // Embedded page sheets may also carry journal-sheet; never close them independently.
 if(element.matches(".journal-entry-page")||element.closest?.(".journal-entry-page"))return null;
 if(element.matches(".journal-sheet, .journal-entry")&&element.matches(".application")&&!element.parentElement?.closest(".journal-entry"))return "journal";
 return null;
}

// The v14 registry contains actual application instances, not plain object properties.
// Require a connected parent journal window; never infer visibility from document data.
export function openJournalApplications(instances){
 if(typeof instances?.values!=="function")return [];
 return Array.from(instances.values()).filter(app=>{
  const el=applicationElement(app);
  return el?.isConnected===true&&contentKind(el)==="journal"&&typeof app.close==="function";
 });
}
