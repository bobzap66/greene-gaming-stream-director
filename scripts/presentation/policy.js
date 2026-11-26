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
export function contentKind(element){
 if(!element?.matches)return null;
 if(element.matches(".image-popout"))return "art";
 if(element.matches(".journal-sheet, .journal-entry, .journal-entry-page"))return "journal";
 return null;
}
