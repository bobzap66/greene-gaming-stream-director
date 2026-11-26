import {ID,isObserver,setting,modeSetting} from "../settings.js";
let maintenance=false;
export const maintenanceActive=()=>maintenance;
export function registerMaintenance(){
 game.keybindings.register(ID,"observer-maintenance",{
  name:"Toggle observer maintenance",hint:"Temporarily restore normal interface and layout on this observer only.",
  editable:[{key:"KeyU",modifiers:["Alt","Shift"]}],restricted:false,
  onDown:()=>{
   if(!game.ready||!isObserver()||(!maintenance&&!modeSetting("presentationEnabled")&&!modeSetting("layoutEnabled")&&setting("observerMode")!=="tabletop"))return false;
   maintenance=!maintenance;
   Hooks.callAll("ggsdMaintenanceChanged",maintenance);
   ui.notifications.info(maintenance?"Stream Director: maintenance mode. Alt+Shift+U restores presentation.":"Stream Director: observer interface restored.");
   return true;
  }
 });
}
