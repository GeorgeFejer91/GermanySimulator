(function(){
"use strict";
const story=window.BuergeramtStory;
const root=document.getElementById("amt-level"),walkHud=document.getElementById("amt-walk-hud");
const speaker=root.querySelector("#amt-speaker"),line=root.querySelector("#amt-line"),actions=root.querySelector("#amt-actions");
const status=root.querySelector("#amt-status"),qr=root.querySelector("#amt-qr"),ticket=root.querySelector("#amt-ticket"),phoneLink=root.querySelector("#amt-phone-link");
const objective=document.getElementById("amt-objective"),nearby=document.getElementById("amt-nearby"),board=document.getElementById("amt-number-board"),exit=root.querySelector("#amt-exit"),ambient=document.getElementById("amt-ambient");
const door={x:0,z:5.55},sign={x:0,z:-2.6},registration={x:-4.65,z:.8},counter={x:4,z:-8.15},view={x:0,z:8,yaw:0};
const held=new Set(),pendingTimers=new Set();
// Every callback belongs to one attempt and one visible speech/action cue.
let attempt=0,cue=0,callOutcome="";
function defer(callback,delay){const owner=attempt;const id=setTimeout(()=>{pendingTimers.delete(id);if(active&&owner===attempt)callback()},delay);pendingTimers.add(id);return id}
function clearTimer(id){clearTimeout(id);pendingTimers.delete(id)}
function cancelSpeech(){cue++;try{window.speechSynthesis?.cancel()}catch{}}
let active=false,stage="closed",link=null,number="",registeredName="",activated=false,qrSvg="",queueDisplay="—",queueIndex=0,queueClock=0,deadline=0,clerkIndex=0,callPending=false,callTriggered=false,options=null,ambientClock=0,ambientIndex=0,ambientAudio=null;
const ambientLines=[["WARTERAUM","Mein Termin war gestern. Ich war heute pünktlich."],["SCHALTER 1","Für die Kopie des Originals benötigen Sie das Original der Kopie."],["TELEFON AM SCHALTER 2","Nein, die Warteschleife ist persönlich zu nehmen."],["WARTERAUM","Mein Buchstabe wurde aufgerufen, aber die Zahl gehört jemand anderem."],["SCHALTER 4","Einen Moment. Ich verbinde Sie mit Ihrem Moment."]];
function walking(){return ["outside","walk-sign","walk-register","waiting","walk-counter"].includes(stage)}
function setStage(next){if(next!==stage)held.clear();stage=next;const moving=walking();if(moving){cancelSpeech();ambient.textContent="";}root.classList.toggle("walking",moving);walkHud.hidden=!moving;root.classList.toggle("first-person",!!window.Germany3D?.ready);if(moving){objective.textContent=next==="outside"?"BÜRGERAMT · EINGANG":next==="walk-sign"?"QR-SCHILD SCANNEN":next==="walk-register"?"AM ANMELDESCHALTER AKTIVIEREN":next==="waiting"?"AUFRUF ABWARTEN · SCHALTER 3":"IHRE NUMMER · SCHALTER 3 · BEEILEN!";update(0)}}
function displayNumber(value){queueDisplay=value;board.textContent=value}
function say(text,onComplete){
 const owner=attempt,visibleCue=cue;let settled=false,fallback=null;
 const current=()=>active&&owner===attempt&&visibleCue===cue&&line.textContent===text;
 const complete=()=>{if(settled||!current())return;settled=true;if(fallback!==null)clearTimer(fallback);onComplete?.()};
 const voiced=options?.voiceOn?.()&&window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function";
 if(onComplete)fallback=defer(complete,Math.max(3500,Math.min(14000,text.length*55)));
 if(!voiced)return;
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=.96;
 utterance.onstart=()=>{if(!current())return;if(fallback!==null)clearTimer(fallback);if(onComplete)fallback=defer(complete,Math.max(20000,text.length*120))};
 utterance.onend=complete;utterance.onerror=()=>{if(current()&&!settled&&onComplete){if(fallback!==null)clearTimer(fallback);fallback=defer(complete,Math.max(3500,Math.min(14000,text.length*55)))}};
 requestAnimationFrame(()=>{if(current()&&!settled){try{speechSynthesis.speak(utterance)}catch{utterance.onerror()}}});
}
function content(who,text,buttons=[],onComplete){
 cancelSpeech();ambient.textContent="";speaker.textContent=who;line.textContent=text;actions.replaceChildren();
 const owner=attempt,visibleCue=cue;
 for(const item of buttons){const button=document.createElement("button");button.type="button";button.textContent=item.label;
  button.addEventListener("click",()=>{if(!active||owner!==attempt||visibleCue!==cue||button.disabled)return;button.disabled=true;item.run()});actions.append(button)}
 say(text,onComplete);
}
function setStatus(text){status.textContent=text}
function distanceTo(target){return Math.hypot(view.x-target.x,view.z-target.z)}
function nearbyTarget(){if(stage==="outside")return door;if(stage==="walk-sign")return sign;if(stage==="walk-register")return registration;return counter}
const officeSeats=[[-5.9,1.7],[-2.1,1.7],[1.7,1.7],[5.5,1.7],[-5.9,-1.1],[-2.1,-1.1],[1.7,-1.1],[5.5,-1.1]];
let officeObstacles=[];
function officeBlocked(x,z){
 if(z < -8.32 || Math.abs(x)<1.62&&Math.abs(z+4.22)<.34)return true;
 if(Math.abs(x+4.65)<1.05&&Math.abs(z-.8)<.58)return true;
 if(Math.abs(x)>6.35&&Math.abs(z+4.65)<.46)return true;
 if((Math.abs(x+4.2)<.65||Math.abs(x-4.3)<.65)&&Math.abs(z-3.6)<.24)return true;
 if(officeObstacles.some(o=>Math.abs(x-o.x)<o.w/2+.22&&Math.abs(z-o.z)<o.d/2+.22))return true;
 return officeSeats.some(([sx,sz])=>Math.abs(x-sx)<.62&&Math.abs(z-sz)<.58);
}
function forfeit(reason){if(!active||!activated||["cancelled","expired","closed"].includes(stage))return;activated=false;callPending=false;callOutcome="forfeit";link?.send("forfeit");ticket.hidden=true;exit.hidden=false;setStage("expired");displayNumber("—");setStatus("PLATZ VERFALLEN · "+reason);content("ANMELDESCHALTER","Das Telefon war nicht durchgehend erreichbar. Ihre Nummer ist gestrichen. Bitte beginnen Sie die Anmeldung erneut.",[{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}])}
function ring(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio||navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;ambientAudio||=new Audio();const a=ambientAudio;if(a.state==="suspended")a.resume();const now=a.currentTime;for(const offset of [0,.2,.52,.72]){const osc=a.createOscillator(),gain=a.createGain();osc.type="sine";osc.frequency.value=425;gain.gain.setValueAtTime(.0001,now+offset);gain.gain.linearRampToValueAtTime(.014,now+offset+.015);gain.gain.setValueAtTime(.014,now+offset+.1);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.15);osc.connect(gain).connect(a.destination);osc.start(now+offset);osc.stop(now+offset+.16)}}catch{}}
function ambientStep(dt){
 if(!walking()||stage==="outside")return;ambientClock+=dt;
 if(ambientClock<8.5||window.speechSynthesis?.speaking||window.speechSynthesis?.pending)return;
 ambientClock=0;const [who,text]=ambientLines[ambientIndex++%ambientLines.length];
 const owner=attempt,visibleCue=++cue,caption=who+": "+text;
 const current=()=>active&&owner===attempt&&visibleCue===cue&&walking();
 const show=()=>{if(current())ambient.textContent=caption};
 if(options.voiceOn?.()&&window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function"){
  const voice=new SpeechSynthesisUtterance(text);voice.lang="de-DE";voice.volume=.22;voice.rate=1.1;voice.onstart=show;
  voice.onend=voice.onerror=()=>{if(current())ambient.textContent=""};
  try{speechSynthesis.speak(voice)}catch{show()}
 }else show();
 if(ambientIndex%2===0)ring();
}
function update(dt){
 if(!active)return;
 if(window.Germany3D?.ready&&!root.classList.contains("first-person"))root.classList.add("first-person");
 if(!walking())return;
 const elapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;ambientStep(elapsed);
 if(stage==="waiting"){
  queueClock+=elapsed;
  const calls=["B-041","F-91","A-004","Z-7","C-201",number];
  const next=Math.min(calls.length-1,Math.floor(queueClock/3.2));
  if(next!==queueIndex){queueIndex=next;displayNumber(calls[next]);ring();if(next===calls.length-1){deadline=19;setStage("walk-counter");setStatus("NUMMER "+number+" · SCHALTER 3 · SOFORT")}}
 }else if(stage==="walk-counter"){
  deadline-=elapsed;
  if(deadline<=0){activated=false;callPending=false;callOutcome="forfeit";link?.send("forfeit");setStage("expired");content("FRAU KNICK · SCHALTER 3","Ihre Nummer war aufgerufen. Ich habe währenddessen sehr viel nicht getan. Ihr Termin ist verfallen.",[{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}]);setStatus("TERMIN VERFALLEN · "+number);return}
 }
 if(held.has("ArrowLeft"))view.yaw-=elapsed*1.8;
 if(held.has("ArrowRight"))view.yaw+=elapsed*1.8;
 const f=(held.has("KeyW")||held.has("ArrowUp")?1:0)-(held.has("KeyS")||held.has("ArrowDown")?1:0),s=(held.has("KeyD")?1:0)-(held.has("KeyA")?1:0);
 if(f||s){const length=Math.hypot(f,s),speed=held.has("ShiftLeft")?5.8:3.6,dx=(Math.sin(view.yaw)*f+Math.cos(view.yaw)*s)/length*speed*elapsed,dz=(-Math.cos(view.yaw)*f+Math.sin(view.yaw)*s)/length*speed*elapsed;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<steps;i++){const x=Math.max(-7.45,Math.min(7.45,view.x+dx/steps)),z=Math.max(-10.05,Math.min(8.45,view.z+dz/steps));if((view.z>5.55&&z<5.55||view.z<5.55&&z>5.55)&&(stage==="outside"||Math.abs(x)>1.3))break;if(!officeBlocked(x,view.z))view.x=x;if(!officeBlocked(view.x,z))view.z=z}}
 const near=distanceTo(nearbyTarget())<1.9&&(stage!=="outside"||Math.abs(view.x)<1.3);
 nearby.textContent=near?(stage==="outside"?"E · EINGANGSTÜR ÖFFNEN":stage==="walk-sign"?"E · QR-SCHILD LESEN":stage==="walk-register"?"E · ANMELDUNG AKTIVIEREN":stage==="waiting"?"E · VORZEITIG AN SCHALTER 3":"E · FRAU KNICK ANSPRECHEN"):(stage==="outside"?"ZUR EINGANGSTÜR":stage==="walk-sign"?"QR-SCHILD AM ANMELDESCHALTER":stage==="walk-register"?"ZUM ANMELDESCHALTER":stage==="waiting"?"AUFRUFTAFEL BEOBACHTEN":"ZUM SCHALTER 3 · BEEILEN!");
}
function interact(){if(!walking()||distanceTo(nearbyTarget())>=1.9||stage==="outside"&&Math.abs(view.x)>=1.3)return;
 if(stage==="outside"){view.z=4.8;setStage("walk-sign");setStatus("ANMELDUNG NUR ÜBER DAS QR-SCHILD");return}
 if(stage==="walk-sign"){ticket.hidden=false;setStage("qr");content("ANMELDUNG","Scannen Sie den QR-Code auf dem Schild und tragen Sie Ihren Namen auf dem Telefon ein. Danach melden Sie sich am Anmeldeschalter.",[{label:"ZUM ANMELDESCHALTER",run:()=>{ticket.hidden=true;setStage("walk-register")}}]);return}
 if(stage==="walk-register"){if(!registeredName||link?.channel?.readyState!=="open"){setStage("registration-warning");content("ANMELDESCHALTER","Ich kann nur Anmeldungen aktivieren, die mit einem erreichbaren Telefon und einem Namen vorliegen. Das Schild steht dort nicht zur Dekoration.",[{label:"ZURÜCK ZUM QR-SCHILD",run:()=>setStage("walk-sign")}]);return}activated=true;queueClock=0;queueIndex=0;displayNumber("B-041");if(!link.send("activated")){forfeit("TELEFON GETRENNT");return}if(!activated)return;setStage("registration-done");setStatus("ANMELDUNG AKTIVIERT · TELEFON SICHTBAR LASSEN");content("ANMELDESCHALTER","Anmeldung auf den Namen "+registeredName+" aktiviert. Lassen Sie die Seite geöffnet. Ein unsichtbares Telefon ist ein abwesender Mensch.",[{label:"IM WARTERAUM PLATZ NEHMEN",run:()=>setStage("waiting")}]);return}
 if(stage==="waiting"){setStage("early");content("FRAU KNICK · SCHALTER 3","Steht Ihre Nummer auf der Tafel? Nein? Dann treten Sie zurück! Dass ich hier gerade nichts tue, ist eine dienstliche Tätigkeit.",[{label:"ZURÜCK IN DEN WARTERAUM",run:()=>setStage("waiting")}]);setStatus("FALSCHER AUFRUF · "+queueDisplay);return}showClerk()}
function beginLink(){
 const invitation=BuergeramtLink.invitation();phoneLink.href=BuergeramtLink.phoneUrl(invitation);
 const code=qrcode(0,"M");code.addData(phoneLink.href);code.make();qrSvg=code.createSvgTag({cellSize:5,margin:4,scalable:true});qr.innerHTML=qrSvg;window.Germany3D?.setAmtQr?.(qrSvg);
 const owner=attempt,currentLink=new BuergeramtLink("host",invitation);link=currentLink;
 const current=()=>active&&owner===attempt&&link===currentLink;
 const terminal=()=>["cancelled","expired","closed"].includes(stage);
 currentLink.addEventListener("status",e=>{if(!current()||terminal())return;if(activated&&/getrennt|unterbrochen/i.test(e.detail))forfeit("TELEFON GETRENNT");else if(!activated)setStatus(e.detail)});
 currentLink.addEventListener("connected",()=>{if(!current()||terminal())return;setStatus("TELEFON VERBUNDEN · ANMELDUNG ERWARTET");if(registeredName)currentLink.send("ticket",{number})});
 currentLink.addEventListener("message",e=>{
  if(!current()||terminal())return;const m=e.detail;
  if(m.type==="register"&&!activated&&typeof m.name==="string"&&m.name.trim().length>=2&&m.name.length<=80){
   if(!registeredName){registeredName=m.name.trim().replace(/\s+/g," ");number="B-"+String(100+crypto.getRandomValues(new Uint16Array(1))[0]%800).padStart(3,"0")}
   currentLink.send("ticket",{number});setStatus("ANMELDUNG EINGEGANGEN · AM SCHALTER AKTIVIEREN");
  }else if(m.type==="phone-hidden")forfeit("TELEFON NICHT SICHTBAR");
  else if(activated&&callPending&&stage==="counter"&&m.id===story.call.id&&m.type==="answer"){
   callPending=false;callOutcome="answer";setStage("cancelled");setStatus("TERMIN ANNULLIERT · "+number);showOutburst();
  }else if(activated&&callPending&&stage==="counter"&&m.id===story.call.id&&m.type==="decline"){
   callPending=false;callOutcome="decline";setStatus("ANRUF ABGELEHNT · SCHALTER 3");content("FRAU KNICK · SCHALTER 3",story.call.declined,[{label:"GESPRÄCH FORTSETZEN",run:showClerk}]);
  }
 });
 currentLink.start().catch(e=>{if(current()&&!terminal())setStatus("Verbindung fehlgeschlagen: "+e.message)});
}
function showClerk(){if(!active||!activated||callPending||["cancelled","expired","closed"].includes(stage))return;view.x=4;view.z=-8.15;view.yaw=0;setStage("counter");const node=story.clerk[clerkIndex];if(clerkIndex===0&&!callTriggered){callTriggered=true;callPending=true;content(node.speaker,"Nummer "+number+"? Beeilen Sie sich! Ich bin sehr beschäftigt. Was? Ihr Telefon klingelt während meiner Vorsprache.");if(!link.send("call",{id:story.call.id,line:story.call.line})){forfeit("TELEFON GETRENNT");return}if(!activated)return;setStatus("POLIZEI RUFT AUF DEM TELEFON AN");return}if(callOutcome!=="decline"||!node)return;const choices=node.choices.map(choice=>({label:choice.label,run:()=>{setStage("reply");content(node.speaker,choice.reply,[{label:clerkIndex===story.clerk.length-1?"FORMULAR A38 ENTGEGENNEHMEN":"WEITER",run:()=>{clerkIndex++;if(clerkIndex<story.clerk.length)showClerk();else finish()}}])}}));content(node.speaker,node.line,choices)}
function showOutburst(){
 const upset=story.outburst;exit.hidden=true;
 defer(()=>{if(stage==="cancelled")link?.send("police-line",{index:0,line:story.police[0]})},2800);
 function step(index){
  if(!active||stage!=="cancelled")return;
  if(index===upset.lines.length){const callback=options.onCancel;close(false);callback();return}
  if(index===2||index===3)link?.send("police-line",{index:index-1,line:story.police[index-1]});
  content(upset.speaker,upset.lines[index],[],()=>defer(()=>step(index+1),250));
 }
 step(0);
}
function finish(){if(!active||!activated||callPending||callOutcome!=="decline"||clerkIndex!==story.clerk.length)return;const callback=options.onForm;close(false);callback()}
function close(notify=true){
 if(!active)return;const config=options;active=false;attempt++;callPending=false;activated=false;callOutcome="";
 for(const id of pendingTimers)clearTimeout(id);pendingTimers.clear();cancelSpeech();setStage("closed");
 try{ambientAudio?.close()?.catch(()=>{})}catch{}ambientAudio=null;held.clear();root.hidden=true;ticket.hidden=true;walkHud.hidden=true;ambient.textContent="";
 document.body.classList.remove("amt-inside");const previous=link;link=null;previous?.send("done");previous?.close();config.music?.(false);if(notify)config.onClose();
}
function open(config){if(active)return;attempt++;callOutcome="";options=config;active=true;clerkIndex=0;callPending=false;callTriggered=false;registeredName="";number="";activated=false;queueClock=0;queueIndex=0;deadline=0;ambientClock=0;displayNumber("—");view.x=0;view.z=8;view.yaw=0;held.clear();ticket.hidden=true;exit.hidden=false;root.hidden=false;document.body.classList.add("amt-inside");options.music?.(true);beginLink();setStage("outside");setStatus("EINGANG · BÜRGERAMT")}
function captureKey(event){if(event.type==="keyup")held.delete(event.code);if(!active)return;if(event.type==="keydown"&&event.code==="KeyE"&&walking()){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)interact();return}if(!walking())return;if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(event.type==="keydown")held.add(event.code);else held.delete(event.code)}}
window.addEventListener("keydown",captureKey,true);window.addEventListener("keyup",captureKey,true);window.addEventListener("blur",()=>held.clear());
document.addEventListener("visibilitychange",()=>{if(document.hidden)held.clear()});
document.addEventListener("pointermove",event=>{if(active&&walking()&&event.buttons===1&&!event.target.closest("button"))view.yaw+=event.movementX*.004});
document.querySelectorAll("[data-amt-key]").forEach(button=>{const key=button.dataset.amtKey;button.addEventListener("pointerdown",e=>{if(!active||!walking())return;e.preventDefault();button.setPointerCapture(e.pointerId);held.add(key)});for(const type of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(type,()=>held.delete(key))});
document.getElementById("amt-touch-e").addEventListener("click",interact);document.getElementById("amt-leave").addEventListener("click",()=>close());exit.addEventListener("click",()=>close());
window.BuergeramtLevel={open,replay(config){close(false);open(config)},update,interact,setOfficeObstacles(items){officeObstacles=Array.isArray(items)?items.filter(o=>[o.x,o.z,o.w,o.d].every(Number.isFinite)&&o.w>0&&o.d>0):[]},get active(){return active},get stage(){return stage},get queueDisplay(){return queueDisplay},get qrSvg(){return qrSvg},get view(){return{x:view.x,z:view.z,yaw:view.yaw}},get registeredName(){return registeredName},get activated(){return activated}};
})();
