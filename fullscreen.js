(function(){"use strict";
const doc=document,root=doc.documentElement;
let automatic=true,pending=null;
const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
function stopAutomatic(){
 automatic=false;
 doc.removeEventListener("pointerup",firstInteraction,true);
 doc.removeEventListener("click",firstInteraction,true);
 doc.removeEventListener("keydown",firstInteraction,true);
}
function enter(){
 if(active()){stopAutomatic();return Promise.resolve(true)}
 if(pending)return pending;
 const request=root.requestFullscreen||root.webkitRequestFullscreen;
 if(!request||(root.requestFullscreen?doc.fullscreenEnabled:doc.webkitFullscreenEnabled)===false){stopAutomatic();return Promise.resolve(false)}
 try{
  const result=root.requestFullscreen?request.call(root,{navigationUI:"hide"}):request.call(root);
  pending=Promise.resolve(result).then(()=>{if(active())stopAutomatic();return active()},()=>false).finally(()=>{pending=null});
  return pending;
 }catch{return Promise.resolve(false)}
}
function autoEnter(){return automatic&&!doc.hidden?enter():Promise.resolve(active())}
function firstInteraction(event){
 if(!event.isTrusted||event.type==="keydown"&&(event.repeat||event.key==="Escape"||event.altKey||event.ctrlKey||event.metaKey||["Alt","Control","Meta","Shift"].includes(event.key)))return;
 autoEnter();
}
function toggle(){
 stopAutomatic();
 if(!active())return enter();
 const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
 try{return Promise.resolve(exit?.call(doc)).then(()=>!active(),()=>false)}catch{return Promise.resolve(false)}
}
doc.addEventListener("pointerup",firstInteraction,true);
doc.addEventListener("click",firstInteraction,true);
doc.addEventListener("keydown",firstInteraction,true);
doc.addEventListener("keydown",event=>{
 if(event.isTrusted&&!event.repeat&&event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key==="Enter"){event.preventDefault();toggle()}
},true);
const changed=()=>{if(active())stopAutomatic()};
doc.addEventListener("fullscreenchange",changed);
doc.addEventListener("webkitfullscreenchange",changed);
window.addEventListener("pagehide",stopAutomatic);
window.GermanyFullscreen={enter,autoEnter,toggle};
// Browsers may reject this without activation; the first real interaction retries.
autoEnter();
})();
