(function(){
"use strict";
const story=window.BuergeramtStory;
const root=document.getElementById("amt-level"),walkHud=document.getElementById("amt-walk-hud");
const speaker=root.querySelector("#amt-speaker"),line=root.querySelector("#amt-line"),actions=root.querySelector("#amt-actions");
const status=root.querySelector("#amt-status"),qr=root.querySelector("#amt-qr"),ticket=root.querySelector("#amt-ticket"),phoneLink=root.querySelector("#amt-phone-link");
const objective=document.getElementById("amt-objective"),nearby=document.getElementById("amt-nearby"),board=document.getElementById("amt-number-board"),exit=root.querySelector("#amt-exit");
const machine={x:-2.35,z:-2.45},counter={x:1.45,z:-4.45},view={x:0,z:2.6,yaw:0};
const held=new Set();
let active=false,stage="closed",link=null,number="",queueDisplay="—",queueIndex=0,queueClock=0,deadline=0,clerkIndex=0,callPending=false,callTriggered=false,options=null;
function walking(){return stage==="walk-ticket"||stage==="waiting"||stage==="walk-counter"}
function setStage(next){stage=next;const moving=walking();root.classList.toggle("walking",moving);walkHud.hidden=!moving;root.classList.toggle("first-person",!!window.Germany3D?.ready);if(moving){objective.textContent=next==="walk-ticket"?"NUMMERNAUTOMAT SUCHEN":next==="waiting"?"AUFRUF ABWARTEN · SCHALTER 3":"IHRE NUMMER · SCHALTER 3 · BEEILEN!";nearby.textContent=next==="walk-ticket"?"GEHEN SIE ZUM NUMMERNAUTOMATEN":next==="waiting"?"NUR DIE ANGEZEIGTE NUMMER GILT":"ZUM SCHALTER 3 · TERMIN VERFÄLLT";update(0)}}
function displayNumber(value){queueDisplay=value;board.textContent=value}
function say(text){if(!options?.voiceOn?.())return;const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=.96;requestAnimationFrame(()=>{if(active&&line.textContent===text)speechSynthesis.speak(utterance)})}
function content(who,text,buttons=[]){speechSynthesis.cancel();speaker.textContent=who;line.textContent=text;actions.replaceChildren();for(const item of buttons){const button=document.createElement("button");button.type="button";button.textContent=item.label;button.addEventListener("click",item.run);actions.append(button)}say(text)}
function setStatus(text){status.textContent=text}
function distanceTo(target){return Math.hypot(view.x-target.x,view.z-target.z)}
function update(dt){
 if(!active)return;
 if(window.Germany3D?.ready&&!root.classList.contains("first-person"))root.classList.add("first-person");
 if(!walking())return;
 const elapsed=Math.min(.1,Math.max(0,dt));
 if(stage==="waiting"){
  queueClock+=elapsed;
  const calls=["B-041","F-91","A-004","Z-7","C-201",number];
  const next=Math.min(calls.length-1,Math.floor(queueClock/2.8));
  if(next!==queueIndex){queueIndex=next;displayNumber(calls[next]);if(next===calls.length-1){deadline=14;setStage("walk-counter");setStatus("NUMMER "+number+" · SCHALTER 3 · SOFORT")}}
 }else if(stage==="walk-counter"){
  deadline-=elapsed;
  if(deadline<=0){setStage("expired");content("FRAU KNICK · SCHALTER 3","Ihre Nummer war aufgerufen. Ich habe währenddessen sehr viel nicht getan. Ihr Termin ist verfallen.",[{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}]);setStatus("TERMIN VERFALLEN · "+number);return}
 }
 if(held.has("ArrowLeft"))view.yaw-=elapsed*1.8;
 if(held.has("ArrowRight"))view.yaw+=elapsed*1.8;
 const f=(held.has("KeyW")||held.has("ArrowUp")?1:0)-(held.has("KeyS")||held.has("ArrowDown")?1:0),s=(held.has("KeyD")?1:0)-(held.has("KeyA")?1:0);
 if(f||s){const length=Math.hypot(f,s),speed=held.has("ShiftLeft")?3.5:2.3,dx=(Math.sin(view.yaw)*f+Math.cos(view.yaw)*s)/length*speed*elapsed,dz=(-Math.cos(view.yaw)*f+Math.sin(view.yaw)*s)/length*speed*elapsed;view.x=Math.max(-3.7,Math.min(3.7,view.x+dx));view.z=Math.max(-4.55,Math.min(2.9,view.z+dz));if(view.z<-3.8&&Math.abs(view.x)<.55)view.z=-3.8}
 const target=stage==="walk-ticket"?machine:counter,near=distanceTo(target)<1.6;
 nearby.textContent=near?(stage==="walk-ticket"?"E · NUMMER ZIEHEN":stage==="waiting"?"E · VORZEITIG AN SCHALTER 3":"E · FRAU KNICK ANSPRECHEN"):(stage==="walk-ticket"?"NUMMERNAUTOMAT SUCHEN":stage==="waiting"?"AUFRUFTAFEL BEOBACHTEN":"ZUM SCHALTER 3 · BEEILEN!");
}
function interact(){if(!walking())return;const target=stage==="walk-ticket"?machine:counter;if(distanceTo(target)>=1.6)return;if(stage==="walk-ticket")showTicket();else if(stage==="waiting"){setStage("early");content("FRAU KNICK · SCHALTER 3","Steht Ihre Nummer auf der Tafel? Nein? Dann treten Sie zurück! Dass ich hier gerade nichts tue, ist eine dienstliche Tätigkeit.",[{label:"ZURÜCK IN DEN WARTERAUM",run:()=>setStage("waiting")}]);setStatus("FALSCHER AUFRUF · "+queueDisplay)}else showClerk()}
function showTicket(){setStage("ticket");ticket.hidden=false;const invitation=BuergeramtLink.invitation();number="B-"+String(100+crypto.getRandomValues(new Uint16Array(1))[0]%800).padStart(3,"0");phoneLink.href=BuergeramtLink.phoneUrl(invitation);const code=qrcode(0,"M");code.addData(phoneLink.href);code.make();qr.innerHTML=code.createSvgTag({cellSize:5,margin:4,scalable:true});setStatus("Scannen Sie den QR-Code. Ihre Wartenummer erscheint auf dem Telefon.");content("NUMMERNAUTOMAT","Ihre Wartenummer wird auf Ihr Telefon übertragen. Dieser Automat ist nicht befugt, sie Ihnen selbst mitzuteilen.");link=new BuergeramtLink("host",invitation);link.addEventListener("status",e=>setStatus(e.detail));link.addEventListener("connected",()=>{setStatus("Telefon verbunden. Die Nummer wird übertragen.");link.send("ticket",{number});if(callPending)link.send("call",{id:story.call.id,line:story.call.line})});link.addEventListener("message",e=>{const m=e.detail;if(stage==="ticket"&&m.type==="hello")link.send("ticket",{number});if(stage==="ticket"&&m.type==="ticket-read"){ticket.hidden=true;queueClock=0;queueIndex=0;displayNumber("B-041");setStage("waiting");setStatus("WARTEN SIE AUF IHRE NUMMER · ES GIBT KEINE WARTEZEITANGABE")}else if(callPending&&m.id===story.call.id&&m.type==="answer"){callPending=false;setStage("cancelled");setStatus("TERMIN ANNULLIERT · "+number);showOutburst()}else if(callPending&&m.id===story.call.id&&m.type==="decline"){callPending=false;setStage("counter");content("FRAU KNICK · SCHALTER 3",story.call.declined,[{label:"GESPRÄCH FORTSETZEN",run:showClerk}])}});link.start().catch(e=>setStatus("Verbindung fehlgeschlagen: "+e.message))}
function showClerk(){setStage("counter");const node=story.clerk[clerkIndex];if(clerkIndex===0&&!callTriggered){callTriggered=true;callPending=true;content(node.speaker,"Nummer "+number+"? Beeilen Sie sich! Ich bin sehr beschäftigt. Was? Ihr Telefon klingelt während meiner Vorsprache.");link.send("call",{id:story.call.id,line:story.call.line});setStatus("POLIZEI RUFT AUF DEM TELEFON AN");return}const choices=node.choices.map(choice=>({label:choice.label,run:()=>{setStage("reply");content(node.speaker,choice.reply,[{label:clerkIndex===story.clerk.length-1?"FORMULAR A38 ENTGEGENNEHMEN":"WEITER",run:()=>{clerkIndex++;if(clerkIndex<story.clerk.length)showClerk();else finish()}}])}}));content(node.speaker,node.line,choices)}
function showOutburst(){const upset=story.outburst;exit.hidden=true;setTimeout(()=>{if(active&&stage==="cancelled")link.send("police-line",{index:0,line:story.police[0]})},2800);const steps=[0,5600,11500,17700,23800];for(let i=0;i<steps.length;i++)setTimeout(()=>{if(!active||stage!=="cancelled")return;if(i===2||i===3)link.send("police-line",{index:i-1,line:story.police[i-1]});content(upset.speaker,upset.lines[i])},steps[i]);setTimeout(()=>{if(!active||stage!=="cancelled")return;close(false);options.onCancel()},31500)}
function finish(){close(false);options.onForm()}
function close(notify=true){if(!active)return;active=false;setStage("closed");speechSynthesis.cancel();held.clear();root.hidden=true;ticket.hidden=true;walkHud.hidden=true;document.body.classList.remove("amt-inside");link?.send("done");link?.close();link=null;if(notify)options.onClose()}
function open(config){if(active)return;options=config;active=true;clerkIndex=0;callPending=false;callTriggered=false;queueClock=0;queueIndex=0;deadline=0;displayNumber("—");view.x=0;view.z=2.6;view.yaw=0;held.clear();ticket.hidden=true;exit.hidden=false;root.hidden=false;document.body.classList.add("amt-inside");setStage("entrance");setStatus("EINGANG · BÜRGERAMT");content(story.entrance.speaker,story.entrance.line,[{label:"NUMMERNAUTOMAT SUCHEN",run:()=>setStage("walk-ticket")}])}
function captureKey(event){if(!active)return;if(event.type==="keydown"&&event.code==="KeyE"&&walking()){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)interact();return}if(!walking())return;if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(event.type==="keydown")held.add(event.code);else held.delete(event.code)}}
window.addEventListener("keydown",captureKey,true);window.addEventListener("keyup",captureKey,true);window.addEventListener("blur",()=>held.clear());
document.addEventListener("pointermove",event=>{if(active&&walking()&&event.buttons===1&&!event.target.closest("button"))view.yaw+=event.movementX*.004});
document.querySelectorAll("[data-amt-key]").forEach(button=>{const key=button.dataset.amtKey;button.addEventListener("pointerdown",e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(key)});for(const type of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(type,()=>held.delete(key))});
document.getElementById("amt-touch-e").addEventListener("click",interact);document.getElementById("amt-leave").addEventListener("click",()=>close());exit.addEventListener("click",()=>close());
window.BuergeramtLevel={open,replay(config){close(false);open(config)},update,interact,get active(){return active},get stage(){return stage},get queueDisplay(){return queueDisplay},get view(){return{x:view.x,z:view.z,yaw:view.yaw}}};
})();
