export const ID="greene-gaming-stream-director";
export const defaults={groupDistance:8,padding:2,minZoom:.4,maxZoom:1.5,transition:750,frameMargin:20};
export const defaultRegions={camera:{x:3,y:15,w:75,h:80},art:{x:5,y:16,w:70,h:76},chat:{x:79,y:15,w:18,h:78},combat:{x:6,y:21,w:18,h:30},reserved:{x:0,y:82,w:100,h:18}};
export function refreshObserverChoices(){
 const config=game.settings.settings.get(ID+".observerId");if(!config)return;
 const choices={"":"Not selected",...Object.fromEntries(Array.from(game.users??[]).filter(u=>!u.isGM).map(u=>[u.id,u.name]))};
 const saved=setting("observerId");if(saved&&!choices[saved])choices[saved]="Unavailable observer ("+saved+")";
 config.choices=choices;
}
export const tabletopRegions={art:{x:5,y:5,w:90,h:90},chat:{x:78,y:5,w:21,h:90},combat:{x:2,y:5,w:20,h:35}};
export const modeKeys={layoutEnabled:"tabletopLayoutEnabled",artEnabled:"tabletopArtEnabled",chatEnabled:"tabletopChatEnabled",combatEnabled:"tabletopCombatEnabled",chatScale:"tabletopChatScale",regions:"tabletopRegions",presentationEnabled:"tabletopPresentationEnabled",presentationChat:"tabletopShowChat",presentationCombat:"tabletopShowCombat"};
for(const k of ["Navigation","Controls","Hotbar","Players","Pause","ChatInput","DismissArt","DismissJournal","PF2eHUD","CombatLimit","DismissDelay"])modeKeys["presentation"+k]="tabletopPresentation"+k;
export const modeSetting=key=>setting(setting("observerMode")==="tabletop"?(modeKeys[key]??key):key);
export function registerSettings(){
 const register=(key,data)=>game.settings.register(ID,key,{scope:"world",config:["observerId","observerMode","enabled"].includes(key),requiresReload:true,...data});
 register("observerId",{name:"Stream observer",hint:"Dedicated non-GM account.",type:String,default:"",choices:{"":"Not selected"}});
 register("observerMode",{name:"Observer mode",hint:"Broadcast uses automatic camera direction. Tabletop locks map position and physical scale.",type:String,default:"broadcast",choices:{broadcast:"Broadcast",tabletop:"Tabletop"}});
 register("tabletopRememberPosition",{name:"Remember tabletop scene positions",hint:"Restore the last deliberate position for each scene on this observer browser.",type:Boolean,default:true,requiresReload:false});
 register("tabletopSnapMovement",{name:"Snap viewport drag to whole grid squares",type:Boolean,default:true,requiresReload:false});
 register("tabletopWidth",{name:"Tabletop: physical screen width (inches)",hint:"Measure the visible panel horizontally, not diagonally. Zero means use ruler calibration on the observer.",type:Number,default:0,requiresReload:false});
 register("tabletopGridInches",{name:"Tabletop: physical grid size (inches)",type:Number,default:1,range:{min:.5,max:2,step:.05},requiresReload:false});
 register("tabletopShowChat",{name:"Tabletop: show chat",type:Boolean,default:false,requiresReload:false});
 register("tabletopShowCombat",{name:"Tabletop: show combat tracker",type:Boolean,default:false,requiresReload:false});
 register("enabled",{name:"Enable spectator camera",hint:"Automatically direct the designated observer camera in Broadcast mode or lock its physical scale and position in Tabletop mode.",type:Boolean,default:false});
 const specs={groupDistance:["Party grouping distance (grid squares)",2,24,1],padding:["Camera padding without layout (grid squares)",0,8,1],minZoom:["Legacy minimum zoom (safe-area fit takes priority)",.1,2,.1],maxZoom:["Maximum zoom",.5,3,.1],transition:["Transition duration (ms)",100,2000,50],frameMargin:["Safe-area framing margin (% of group bounds)",0,60,5]};
 for(const [key,[name,min,max,step]] of Object.entries(specs))register(key,{name,type:Number,default:defaults[key],range:{min,max,step}});
 register("combatStyle",{name:"Combat camera style",hint:"Tactical frames all visible combatants. Cinematic follows initiative and targets. Hybrid stays wide until a public action.",type:String,default:"tactical",choices:{tactical:"Tactical",cinematic:"Cinematic",hybrid:"Hybrid"},requiresReload:false});
 register("actionAware",{name:"Action-aware cinematic combat",hint:"Retain a shot for public combat rolls and their outcomes; private rolls never influence it.",type:Boolean,default:true,requiresReload:false});
 register("actionHold",{name:"Combat action hold (ms)",hint:"Duration to retain an action shot after a public roll.",type:Number,default:6000,range:{min:1000,max:15000,step:200},requiresReload:false});
 register("actionLimit",{name:"Continuous action shot limit",hint:"Maximum duration of a chain of rolls by the same actor. Unlimited still expires after the ordinary hold if no further roll occurs.",type:Number,default:30,choices:Object.fromEntries([[0,"Unlimited"],...Array.from({length:23},(_,i)=>[10+i*5,`${10+i*5} seconds`])]),requiresReload:false});
 register("cinematicPadding",{name:"Cinematic combat context (grid squares)",hint:"Extra space on each side of the acting combatant and targets.",type:Number,default:2.5,range:{min:1,max:6,step:.5},requiresReload:false});
 register("wideMargin",{name:"Wide Shot exploration margin (%)",hint:"Extra space around explored bounds, as a percentage of their width and height.",type:Number,default:10,range:{min:0,max:60,step:5},requiresReload:false});
 register("layoutEnabled",{name:"Enable broadcast layout",hint:"Observer-only window and chat positioning.",type:Boolean,default:false});
 register("bookmarkHold",{name:"Bookmark hold duration (seconds)",hint:"Return to the preceding camera mode after this hold plus the selected transition duration.",type:Number,default:10,range:{min:2,max:60,step:1},requiresReload:false});
 register("bookmarkIndefinite",{name:"Hold bookmarks indefinitely",hint:"Disable automatic return for subsequently recalled bookmarks.",type:Boolean,default:false,requiresReload:false});
 register("presentationEnabled",{name:"Enable broadcast presentation",hint:"Observer-only interface cleanup and automatic presentation.",type:Boolean,default:false,requiresReload:false});
 for(const [key,name] of Object.entries({Navigation:"Hide scene navigation",Controls:"Hide canvas controls",Hotbar:"Hide macro hotbar",Players:"Hide player list",Pause:"Hide pause indicator",ChatInput:"Hide chat input",Chat:"Show chat log",Combat:"Automatically display combat tracker",DismissArt:"Automatically dismiss artwork",DismissJournal:"Automatically dismiss journals"}))register("presentation"+key,{name:"Broadcast: "+name,type:Boolean,default:true,requiresReload:false});
 register("presentationPF2eHUD",{name:"Broadcast: hide PF2e Persistent HUD",hint:"Hide the PF2e HUD module persistent controls on the stream observer without changing its settings.",type:Boolean,default:true,requiresReload:false});
 register("presentationCombatLimit",{name:"Broadcast: visible combatants",hint:"Limit native observer combat tracker rows around the current turn.",type:Number,default:3,range:{min:1,max:20,step:1},requiresReload:false});
 register("presentationDismissDelay",{name:"Broadcast: artwork and journal dismissal (seconds)",type:Number,default:10,range:{min:2,max:60,step:1},requiresReload:false});
 register("cameraCommand",{name:"GM camera command",config:false,type:Object,default:{mode:"auto"},requiresReload:false});
 register("regions",{name:"Broadcast regions",config:false,type:Object,default:defaultRegions,requiresReload:false});
 for(const key of ["art","chat","combat"])register(key+"Enabled",{name:"Position "+key,type:Boolean,default:true});
 register("chatScale",{name:"Chat text scale (%)",type:Number,default:100,range:{min:60,max:140,step:5}});
 register("tabletopRegions",{name:"Tabletop regions",type:Object,default:tabletopRegions,config:false,requiresReload:false});
 for(const [source,target] of Object.entries(modeKeys)){
  if(["regions","presentationChat","presentationCombat"].includes(source))continue;
  const spec=game.settings.settings.get(ID+"."+source);
  const {type,range,choices}=spec;
  const value=source==="layoutEnabled"?false:source==="artEnabled"?false:spec.default;
  register(target,{name:spec.name.replace(/^Broadcast: /,"").replace(/broadcast/gi,"tabletop"),hint:spec.hint,type,range,choices,default:value,requiresReload:false});
 }
 register("integrationEnabled",{name:"Enable observer integration API",hint:"Allow local integrations to read approved visible player-character state on the designated observer only. Does not transmit data to external services.",type:Boolean,default:false,requiresReload:false});
 register("integrationHealth",{name:"Include character health",hint:"Allow approved integrations to read current, maximum and temporary HP. Leave off if overlays should not display health.",type:Boolean,default:false,requiresReload:false});
 register("sharingDestination",{name:"Sharing destination",type:String,default:"observer",choices:{observer:"Designated observer only",all:"All connected players"},requiresReload:false});
 register("dismissCommand",{name:"Observer dismissal command",type:Object,default:{},config:false,requiresReload:false});
 register("modeSettingsMigrated",{name:"Mode settings migration",type:Boolean,default:false,config:false,requiresReload:false});
 Hooks.once("ready",async()=>{
  if(!game.user?.isGM||setting("modeSettingsMigrated"))return;
  try{
   const storage=game.settings.storage.get("world");
   for(const [source,target] of Object.entries(modeKeys)){
    if(!source.startsWith("presentation")||["presentationChat","presentationCombat"].includes(source)||storage.getSetting(ID+"."+target))continue;
    if(storage.getSetting(ID+"."+source))await game.settings.set(ID,target,setting(source));
   }
   await game.settings.set(ID,"modeSettingsMigrated",true);
  }catch(e){console.error(ID,"Tabletop preference migration failed",e);}
 });
 registerCategoryMenus();
}
export const setting=key=>game.settings.get(ID,key);
export function isObserver(){return !!game.user&&!game.user.isGM&&game.user.id===setting("observerId");}

const groups={
 Camera:["groupDistance","padding","minZoom","maxZoom","transition","frameMargin","wideMargin"],
 Combat:["combatStyle","actionAware","actionHold","actionLimit","cinematicPadding"],
 Broadcast:["presentationEnabled",...Object.keys(modeKeys).filter(k=>k.startsWith("presentation")&&k!=="presentationEnabled")],
 "Broadcast layout":["layoutEnabled","artEnabled","chatEnabled","combatEnabled","chatScale"],
 Tabletop:["tabletopWidth","tabletopGridInches","tabletopRememberPosition","tabletopSnapMovement","tabletopLayoutEnabled","tabletopArtEnabled","tabletopChatEnabled","tabletopCombatEnabled","tabletopChatScale"],
 "Tabletop presentation":["tabletopShowChat","tabletopShowCombat",...Object.values(modeKeys).filter(k=>k.startsWith("tabletopPresentation"))],
 Bookmarks:["bookmarkHold","bookmarkIndefinite"],
 Sharing:["sharingDestination"],
 Integration:["integrationEnabled","integrationHealth"]
};
function registerCategoryMenus(){
 const {ApplicationV2}=foundry.applications.api;
 for(const [name,keys] of Object.entries(groups)){
  const id="ggsd-settings-"+name.toLowerCase().replaceAll(" ","-");
  class Category extends ApplicationV2{
   static DEFAULT_OPTIONS={id,window:{title:"Stream Director — "+name,resizable:true},position:{width:620,height:620}};
   async _renderHTML(){return document.createElement("div");}
   _replaceHTML(root,content){
    content.replaceChildren(root);Object.assign(root.style,{overflowY:"auto",maxHeight:"100%",padding:"8px"});
    const fields=new Map();
    for(const key of keys){
     const spec=game.settings.settings.get(ID+"."+key),row=document.createElement("div"),label=document.createElement("label");
     row.className="form-group";label.textContent=spec.name;row.append(label);
     const input=document.createElement(spec.choices?"select":"input");
     if(spec.choices){for(const [v,n] of Object.entries(spec.choices)){const opt=document.createElement("option");opt.value=v;opt.textContent=n;input.append(opt);}}
     else if(spec.type===Boolean)input.type="checkbox";
     else if(spec.type===Number){input.type="number";input.step="any";if(spec.range)for(const k of ["min","max","step"])input[k]=spec.range[k];}
     else input.type="text";
     if(spec.type===Boolean)input.checked=setting(key);else input.value=String(setting(key));
     input.id=id+"-"+key;label.htmlFor=input.id;row.append(input);root.append(row);fields.set(key,{input,spec});
     if(spec.hint){const hint=document.createElement("p");hint.className="hint";hint.textContent=spec.hint;root.append(hint);}
    }
    const save=document.createElement("button");save.type="button";save.textContent="Save settings";
    save.onclick=async()=>{if(!game.user?.isGM)return;save.disabled=true;try{
     const changes=[];
     for(const [key,{input,spec}] of fields){const value=spec.type===Boolean?input.checked:spec.type===Number?Number(input.value):input.value;if(spec.type===Number&&(!input.value||!input.checkValidity()||!Number.isFinite(value)||(key==="tabletopWidth"&&value<0)))throw Error("Invalid value: "+spec.name);if(value!==setting(key))changes.push([key,value,spec]);}
     let reload=false;for(const [key,value,spec] of changes){await game.settings.set(ID,key,value);reload||=!!spec.requiresReload;}
     ui.notifications.info(reload?"Saved. Reload GM and observer clients to apply all changes.":"Stream Director settings saved.");await this.close();
    }catch(e){ui.notifications.error(e.message);}finally{save.disabled=false;}};
    root.append(save);
   }
  }
  game.settings.registerMenu(ID,id,{name:name+" settings",label:"Configure "+name.toLowerCase(),hint:"Configure "+name.toLowerCase()+" preferences.",icon:"fas fa-gear",type:Category,restricted:true});
 }
}
