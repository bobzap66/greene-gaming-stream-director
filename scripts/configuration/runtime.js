import {presets,exportSettings,makeDocument,parseDocument,changesFor,applyChanges} from "./policy.js";
export function registerConfiguration(ID){
 const read=k=>game.settings.get(ID,k),spec=k=>game.settings.settings.get(ID+"."+k),write=(k,v)=>game.settings.set(ID,k,v);
 game.settings.register(ID,"customPresets",{name:"Custom configuration presets",scope:"world",config:false,type:Object,default:[],requiresReload:false});
 const {ApplicationV2}=foundry.applications.api;
 class Configuration extends ApplicationV2{
  static DEFAULT_OPTIONS={id:"ggsd-configuration",window:{title:"Stream Director — Setup & Presets",resizable:true},position:{width:700,height:760}};
  async _renderHTML(){return document.createElement("div");}
  _replaceHTML(root,content){
   content.replaceChildren(root);Object.assign(root.style,{overflowY:"auto",minHeight:"0",maxHeight:"100%",width:"100%",boxSizing:"border-box",padding:"10px",display:"block",flex:"1 1 auto"});
   if(!game.user?.isGM)return;
   let section=root;
   const el=(tag,text,parent=section)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent.append(n);if(tag==="p")Object.assign(n.style,{margin:"0",lineHeight:"1.4"});return n;};
   const heading=text=>{section=el("section",undefined,root);Object.assign(section.style,{display:"flex",flexDirection:"column",gap:"8px",margin:"0 0 12px",padding:"12px",border:"1px solid var(--color-border-light-tertiary, #777)",borderRadius:"6px",minWidth:"0"});const h=el("h2",text);Object.assign(h.style,{fontSize:"1.15rem",fontWeight:"600",lineHeight:"1.3",margin:"0",padding:"0 0 6px",borderBottom:"1px solid var(--color-border-light-tertiary, #777)"});return h;};
   const button=(text,fn,parent=section)=>{const b=el("button",text,parent);b.type="button";b.onclick=fn;Object.assign(b.style,{minHeight:"30px",height:"auto",whiteSpace:"normal",lineHeight:"1.3",padding:"5px 8px",flex:"0 0 auto"});return b;};
   const row=()=>{const n=el("div");Object.assign(n.style,{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 210px), 1fr))",gap:"6px"});return n;};
   heading("1. Observer setup");
   el("p","Choose a dedicated non-GM observer. Presets never change this assignment, actor approvals, integration permissions, live commands, bookmarks or physical display calibration.");
   const observer=el("select");observer.setAttribute("aria-label","Dedicated observer");const option=(parent,value,label)=>{const o=el("option",label,parent);o.value=value;};
   option(observer,"","Not selected");for(const u of game.users)if(!u.isGM)option(observer,u.id,u.name);
   observer.value=read("observerId");if(observer.selectedIndex<0)observer.value="";
   const enableRow=el("label"),enable=el("input",undefined,enableRow);enable.type="checkbox";enable.checked=read("enabled");enableRow.append(document.createTextNode(" Enable spectator camera"));
   const setupSave=button("Save observer setup",async()=>{if(!game.user?.isGM)return;setupSave.disabled=true;try{
    const id=observer.value;if(id&&(!game.users.get(id)||game.users.get(id).isGM))throw Error("Select a valid non-GM observer");
    if(enable.checked&&!id)throw Error("Select an observer before enabling the camera");
    const changes=[["observerId",id],["enabled",enable.checked]].filter(([k,v])=>read(k)!==v).map(([key,value])=>({key,value,previous:read(key)}));
    await applyChanges(changes,write);ui.notifications.info("Observer setup saved. Reload GM and observer clients.");diagnostics();
   }catch(e){ui.notifications.error(e.message);}finally{setupSave.disabled=false;}});
   heading("2. Choose or import a preset");
   el("p","Built-in presets change only the listed preferences and retain your existing layout geometry and other custom tuning. Imported and saved presets restore their included portable settings.");
   const picker=el("select");picker.setAttribute("aria-label","Configuration preset");
   const description=el("p"),preview=el("div");Object.assign(preview.style,{flex:"0 0 auto",maxHeight:"280px",overflowY:"auto",minHeight:"48px",minWidth:"0",boxSizing:"border-box",border:"1px solid var(--color-border-light-tertiary, #777)",borderRadius:"4px",padding:"8px"});
   preview.setAttribute("aria-live","polite");
   const format=(key,value)=>{const choices=spec(key)?.choices;if(choices&&Object.hasOwn(choices,String(value)))return String(choices[String(value)]);if(typeof value==="boolean")return value?"Enabled":"Disabled";if(value&&typeof value==="object")return Object.entries(value).map(([name,r])=>name+": "+["x","y","w","h"].map(k=>k.toUpperCase()+" "+Number(r[k]).toFixed(1).replace(/\.0$/,"")+"%").join(", ")).join("\n");return String(value);};
   const previewMessage=text=>{preview.replaceChildren();el("p",text,preview);};
   const renderChanges=changes=>{
    preview.replaceChildren();preview.scrollTop=0;
    if(!changes.length){previewMessage("Your current settings already match this preset.");return;}
    const grid=el("div",undefined,preview);Object.assign(grid.style,{display:"grid",gridTemplateColumns:"minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1fr)",gap:"0",alignItems:"stretch"});
    const cell=(tag,text,header=false,proposed=false)=>{const n=el(tag,text,grid);Object.assign(n.style,{minWidth:"0",overflowWrap:"anywhere",whiteSpace:"pre-line",padding:"7px 6px",lineHeight:"1.35",fontSize:"0.88rem",borderBottom:"1px solid var(--color-border-light-tertiary, #777)",fontWeight:header||proposed?"600":"400"});return n;};
    for(const label of ["Setting","Current","Proposed"])cell("div",label,true);
    for(const c of changes){cell("div",spec(c.key).name);cell("div",format(c.key,c.previous));cell("div",format(c.key,c.value),false,true);}
   };
   let selected=null,busy=false;
   const apply=button("Apply reviewed changes",async()=>{if(busy||!selected||!game.user?.isGM)return;busy=true;apply.disabled=true;try{
    const doc=selected;const changes=changesFor(doc.settings,read,spec);if(!changes.length)return;
    picker.disabled=true;file.disabled=true;
    await applyChanges(changes,write);ui.notifications.info(changes.some(c=>c.reload)?"Preset applied. Reload GM and observer clients.":"Preset applied.");show(doc);diagnostics();
   }catch(e){ui.notifications.error(e.message);show(selected);}finally{busy=false;picker.disabled=false;file.disabled=false;if(selected)show(selected);else apply.disabled=true;}});
   const show=doc=>{selected=doc;try{const changes=changesFor(doc.settings,read,spec);description.textContent=doc.name+" — "+changes.length+" proposed "+(changes.length===1?"change":"changes")+".";renderChanges(changes);apply.disabled=busy||!changes.length;}catch(e){selected=null;description.textContent="Preset unavailable";previewMessage(e.message);apply.disabled=true;}};
   const saved=()=>Array.isArray(read("customPresets"))?read("customPresets"):[];
   function reloadPicker(){picker.replaceChildren();for(const [k,p] of Object.entries(presets))option(picker,"builtin:"+k,p.label);saved().forEach((p,i)=>option(picker,"custom:"+i,p.name));}
   const choose=()=>{try{const [kind,id]=picker.value.split(":");if(kind==="builtin"){const p=presets[id];show(parseDocument(makeDocument(p.label,p.values),spec));description.textContent=p.description+" "+description.textContent;}else show(parseDocument(saved()[Number(id)],spec));}catch(e){selected=null;apply.disabled=true;description.textContent="Preset unavailable";previewMessage(e.message);}};
   picker.onchange=choose;reloadPicker();choose();
   const importLabel=el("label","Import preset from JSON");const file=el("input",undefined,importLabel);file.type="file";file.accept=".json,application/json";file.setAttribute("aria-label","Import portable configuration JSON");Object.assign(importLabel.style,{display:"flex",flexDirection:"column",gap:"5px"});file.style.width="100%";
   file.onchange=async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>256*1024)throw Error("Preset file exceeds 256 KB");const doc=parseDocument(JSON.parse(await f.text()),spec);picker.selectedIndex=-1;show(doc);}catch(e){selected=null;apply.disabled=true;description.textContent="Import failed";previewMessage(e.message);}finally{file.value="";}};
   heading("3. Save or export portable settings");
   const name=el("input");name.type="text";name.maxLength=100;name.placeholder="Preset name";name.setAttribute("aria-label","Preset name");
   const controls=row();
   button("Save current as preset",async()=>{try{if(!game.user?.isGM||busy)return;const label=name.value.trim();if(!label)throw Error("Enter a preset name");const list=saved().filter(p=>p.name!==label);if(list.length>=50)throw Error("Maximum 50 saved presets");if(saved().some(p=>p.name===label)&&!confirm("Replace preset "+label+"?"))return;await write("customPresets",[...list,makeDocument(label,exportSettings(read,spec))]);reloadPicker();picker.value="custom:"+list.length;choose();}catch(e){ui.notifications.error(e.message);}},controls);
   button("Delete selected custom preset",async()=>{try{if(!game.user?.isGM||busy||!picker.value.startsWith("custom:"))return;const i=Number(picker.value.split(":")[1]);if(!confirm("Delete selected custom preset?"))return;await write("customPresets",saved().filter((_,j)=>j!==i));reloadPicker();choose();}catch(e){ui.notifications.error(e.message);}},controls);
   const exportControls=row();
   const download=doc=>{const blob=new Blob([JSON.stringify(doc,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="stream-director-"+doc.name.replace(/[^a-z0-9_-]+/gi,"-").slice(0,60)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
   button("Export current settings",()=>{try{download(makeDocument(name.value.trim()||"Current settings",exportSettings(read,spec)));}catch(e){ui.notifications.error(e.message);}},exportControls);
   button("Export selected preset",()=>{if(selected)download(selected);},exportControls);
   heading("4. Configuration checks");
   const report=el("div");Object.assign(report.style,{display:"flex",flexDirection:"column",gap:"5px"});
   function diagnostics(){report.replaceChildren();const u=game.users.get(read("observerId")),mode=read("observerMode"),roster=read("integrationRoster");const rows=[
    [!!u&&!u.isGM,"Observer: "+(u&&!u.isGM?u.name:"not configured")],
    [!!read("enabled"),"Spectator camera: "+(read("enabled")?"enabled":"disabled")],
    [!!read(mode==="tabletop"?"tabletopPresentationEnabled":"presentationEnabled"),"Presentation: "+mode],
    [!!u?.active,"Observer client: "+(u?.active?"connected":"offline")],
    [!read("integrationGMEnabled")||Array.isArray(roster)&&roster.some(uuid=>Array.from(game.actors).some(a=>a.uuid===uuid&&a.type==="character"&&a.hasPlayerOwner)),"GM portrait API: "+(read("integrationGMEnabled")?"enabled; check approved roster":"disabled (optional)")]
   ];for(const [ok,message] of rows){const item=el("div",undefined,report);Object.assign(item.style,{display:"flex",gap:"8px",alignItems:"start",padding:"5px 6px",borderBottom:"1px solid var(--color-border-light-tertiary, #777)"});const marker=el("span",ok?"✓":"•",item);marker.setAttribute("aria-label",ok?"Ready":"Review");Object.assign(marker.style,{fontWeight:"700",flex:"0 0 16px",textAlign:"center"});el("span",message,item);}
   if(mode==="tabletop")el("p","On the observer, use Alt+Shift+C and a physical ruler. GM diagnostics cannot verify observer-local calibration.",report);
   el("p","Grant Observer permission to the required party actors. Open Integration settings separately for Reactive Portraits. Use Alt+Shift+U on the observer for maintenance.",report);}
   button("Refresh checks",diagnostics);diagnostics();
  }
 }
 game.settings.registerMenu(ID,"configuration",{name:"Setup & portable presets",label:"Open setup and presets",hint:"Configure the observer, preview presets, import/export settings and review diagnostics.",icon:"fas fa-sliders",type:Configuration,restricted:true});
}
