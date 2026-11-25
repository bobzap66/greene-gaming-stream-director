export const ID="greene-gaming-stream-director";
export const defaults={groupDistance:8,padding:2,minZoom:.4,maxZoom:1.5,transition:750};
export const defaultRegions={camera:{x:3,y:15,w:75,h:80},art:{x:5,y:16,w:70,h:76},chat:{x:79,y:15,w:18,h:78}};
export function registerSettings(){
 const register=(key,data)=>game.settings.register(ID,key,{scope:"world",config:true,requiresReload:true,...data});
 register("observerId",{name:"Stream observer",hint:"Dedicated non-GM account.",type:String,default:"",choices:{"":"Not selected",...Object.fromEntries(Array.from(game.users??[]).filter(u=>!u.isGM).map(u=>[u.id,u.name]))}});
 register("enabled",{name:"Enable spectator camera",hint:"Disable Monk's Screen tracking first.",type:Boolean,default:false});
 const specs={groupDistance:["Party grouping distance (grid squares)",2,24,1],padding:["Camera padding (grid squares)",0,8,1],minZoom:["Minimum zoom",.1,2,.1],maxZoom:["Maximum zoom",.5,3,.1],transition:["Transition duration (ms)",100,2000,50]};
 for(const [key,[name,min,max,step]] of Object.entries(specs))register(key,{name,type:Number,default:defaults[key],range:{min,max,step}});
 register("layoutEnabled",{name:"Enable broadcast layout",hint:"Experimental observer-only window and chat positioning.",type:Boolean,default:false});
 register("regions",{name:"Broadcast regions",config:false,type:Object,default:defaultRegions});
}
export const setting=key=>game.settings.get(ID,key);
export function isObserver(){return !game.user.isGM && game.user.id===setting("observerId");}
