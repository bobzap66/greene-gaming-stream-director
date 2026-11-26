export const ID="greene-gaming-stream-director";
export const defaults={groupDistance:8,padding:2,minZoom:.4,maxZoom:1.5,transition:750,frameMargin:20};
export const defaultRegions={camera:{x:3,y:15,w:75,h:80},art:{x:5,y:16,w:70,h:76},chat:{x:79,y:15,w:18,h:78},combat:{x:6,y:21,w:18,h:30},reserved:{x:0,y:82,w:100,h:18}};
export function refreshObserverChoices(){
 const config=game.settings.settings.get(ID+".observerId");if(!config)return;
 const choices={"":"Not selected",...Object.fromEntries(Array.from(game.users??[]).filter(u=>!u.isGM).map(u=>[u.id,u.name]))};
 const saved=setting("observerId");if(saved&&!choices[saved])choices[saved]="Unavailable observer ("+saved+")";
 config.choices=choices;
}
export function registerSettings(){
 const register=(key,data)=>game.settings.register(ID,key,{scope:"world",config:true,requiresReload:true,...data});
 register("observerId",{name:"Stream observer",hint:"Dedicated non-GM account.",type:String,default:"",choices:{"":"Not selected"}});
 register("enabled",{name:"Enable spectator camera",hint:"Disable Monk's Screen, Party Screen and Vision tracking first.",type:Boolean,default:false});
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
 register("cameraCommand",{name:"GM camera command",config:false,type:Object,default:{mode:"auto"},requiresReload:false});
 register("regions",{name:"Broadcast regions",config:false,type:Object,default:defaultRegions,requiresReload:false});
 for(const key of ["art","chat","combat"])register(key+"Enabled",{name:"Position "+key,type:Boolean,default:true});
 register("chatScale",{name:"Chat text scale (%)",type:Number,default:100,range:{min:60,max:140,step:5}});
}
export const setting=key=>game.settings.get(ID,key);
export function isObserver(){return !!game.user&&!game.user.isGM&&game.user.id===setting("observerId");}
