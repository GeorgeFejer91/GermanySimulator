(function(){
"use strict";
const story=window.BuergeramtStory;
const root=document.getElementById("amt-level"),walkHud=document.getElementById("amt-walk-hud");
const speaker=root.querySelector("#amt-speaker"),line=root.querySelector("#amt-line"),actions=root.querySelector("#amt-actions");
const status=root.querySelector("#amt-status");
const objective=document.getElementById("amt-objective"),nearby=document.getElementById("amt-nearby"),board=document.getElementById("amt-number-board"),exit=root.querySelector("#amt-exit"),ambient=document.getElementById("amt-ambient");
const door={x:0,z:5.55},sign={x:0,z:-2.6},counter={x:4,z:-8.15},view={x:0,z:8,yaw:0};
const held=new Set(),pendingTimers=new Set();
// Every callback belongs to one attempt and one visible speech/action cue.
let attempt=0,cue=0,callOutcome="";
function defer(callback,delay){const owner=attempt;const id=setTimeout(()=>{pendingTimers.delete(id);if(active&&owner===attempt)callback()},delay);pendingTimers.add(id);return id}
function clearTimer(id){clearTimeout(id);pendingTimers.delete(id)}
function cancelSpeech(){cue++;try{const engine=window.speechSynthesis;if(engine?.speaking||engine?.pending)engine.cancel()}catch{}}
let active=false,stage="closed",link=null,number="",registeredName="",activated=false,qrSvg="",queueDisplay="—",queueIndex=0,queueClock=0,ticketWaitCalls=0,ticketSerial=100,lastScanId="",deadline=0,clerkIndex=0,callPending=false,callTriggered=false,policeDoneHandler=null,policeStartHandler=null,policeDisconnectHandler=null,options=null,ambientClock=0,ambientIndex=0,ambientAudio=null;
let timing={rttMs:null,oneWayMs:0,jitterMs:0,lastPongAt:null,clockOffsetMs:null,clockUncertaintyMs:null,startLagMs:null,phoneReadyMs:null,phoneFastReadyMs:null,deskStartLagMs:0,deskMsPerChar:55,cues:{},desk:{}};
let pingSerial=0,pingTimer=null,hostVoiceStartupMs=null,hostVoiceAttempts=0;const outstandingPings=new Map(),rttSamples=[];
function resetTiming(){if(pingTimer!==null)clearInterval(pingTimer);pingTimer=null;outstandingPings.clear();rttSamples.length=0;pingSerial=0;timing={rttMs:null,oneWayMs:0,jitterMs:0,lastPongAt:null,clockOffsetMs:null,clockUncertaintyMs:null,startLagMs:null,phoneReadyMs:null,phoneFastReadyMs:null,deskStartLagMs:0,deskMsPerChar:55,cues:{},desk:{}}}
function probeLink(){if(!active||!link)return;const now=performance.now();for(const [id,sent] of outstandingPings)if(now-sent>12000)outstandingPings.delete(id);if(outstandingPings.size>=2)return;pingSerial=pingSerial>=2147483647?1:pingSerial+1;if(link.send("sync-ping",{id:pingSerial}))outstandingPings.set(pingSerial,now)}
function receivePong(id,receivedAtMs,sentAtMs){const sent=outstandingPings.get(id);if(sent===undefined)return;outstandingPings.delete(id);const now=performance.now(),rtt=now-sent-(sentAtMs-receivedAtMs);if(!Number.isFinite(rtt)||rtt<0||rtt>12000)return;const offset=((receivedAtMs-sent)+(sentAtMs-now))/2;rttSamples.push({rtt,offset});if(rttSamples.length>7)rttSamples.shift();const sorted=[...rttSamples].sort((a,b)=>a.rtt-b.rtt),best=sorted.slice(0,Math.min(3,sorted.length)),bestOffsets=best.map(sample=>sample.offset).sort((a,b)=>a-b);timing.rttMs=Math.round(sorted[Math.floor(sorted.length/2)].rtt);timing.oneWayMs=Math.round(timing.rttMs/2);timing.jitterMs=Math.round(sorted.at(-1).rtt-sorted[0].rtt);timing.clockOffsetMs=bestOffsets[Math.floor(bestOffsets.length/2)];timing.clockUncertaintyMs=Math.ceil(best.at(-1).rtt/2);timing.lastPongAt=now}
function oneWay(){return timing.lastPongAt!==null&&performance.now()-timing.lastPongAt<6000?Math.min(400,timing.oneWayMs):0}
function phoneTime(atMs,receiptAt,offset=timing.clockOffsetMs){return offset!==null?atMs-offset:receiptAt-oneWay()}
function phoneStartLag(){return Math.min(1200,oneWay()+(timing.phoneReadyMs??180))}
function phoneFastLag(){return Math.min(1200,oneWay()+(timing.phoneFastReadyMs??180))}
function sentPolice(index){timing.cues[index]={sentAt:performance.now(),startedAt:null,doneAt:null,status:"waiting"}}
function receivePoliceStart(index,mode,readyDelayMs,atMs){const record=timing.cues[index];if(!record||record.status!=="waiting"||record.startedAt!==null||record.doneAt!==null)return false;record.startedAt=performance.now();record.phoneStartedAtMs=atMs;record.clockOffsetMs=timing.lastPongAt!==null&&record.startedAt-timing.lastPongAt<6000?timing.clockOffsetMs:null;record.estimatedStartAt=phoneTime(atMs,record.startedAt,record.clockOffsetMs);record.startMode=mode;record.readyDelayMs=readyDelayMs;record.startTransportMs=Math.round(record.startedAt-record.sentAt-readyDelayMs);if(readyDelayMs<5000)timing.phoneFastReadyMs=timing.phoneFastReadyMs===null?readyDelayMs:Math.min(timing.phoneFastReadyMs,readyDelayMs);if(index>=0&&index<2&&readyDelayMs<5000)timing.phoneReadyMs=timing.phoneReadyMs===null?readyDelayMs:Math.round(timing.phoneReadyMs*.6+readyDelayMs*.4);timing.startLagMs=phoneStartLag();return true}
function receivePoliceDone(index,mode,durationMs,atMs){const record=timing.cues[index];if(!record||record.doneAt!==null)return false;if(record.status==="timeout"||record.status==="disconnected"){record.lateDoneAt=performance.now();return false}record.doneAt=performance.now();record.phoneEndedAtMs=atMs;if(record.clockOffsetMs===null&&timing.lastPongAt!==null&&record.doneAt-timing.lastPongAt<6000){record.clockOffsetMs=timing.clockOffsetMs;if(record.phoneStartedAtMs!==undefined)record.estimatedStartAt=phoneTime(record.phoneStartedAtMs,record.startedAt,record.clockOffsetMs)}record.estimatedEndAt=phoneTime(atMs,record.doneAt,record.clockOffsetMs);record.durationMs=durationMs;record.mode=mode;const span=record.startedAt===null?null:record.doneAt-record.startedAt;record.errorMs=span===null?null:Math.round(span-durationMs);record.localErrorMs=record.phoneStartedAtMs===undefined?null:Math.round(atMs-record.phoneStartedAtMs-durationMs);record.uncertaintyMs=timing.clockUncertaintyMs;record.receiptJitter=span!==null&&Math.abs(record.errorMs)>Math.max(250,(timing.rttMs??0)+timing.jitterMs+100);record.status=span===null?"missing-start":record.startMode!==mode?"mode-changed":Math.abs(record.localErrorMs)>25?"drift":record.clockOffsetMs===null?"unsynced":"verified";return true}
const ambientLines=[["WARTERAUM","Mein Termin war gestern. Ich war heute pünktlich."],["SCHALTER 1","Für die Kopie des Originals benötigen Sie das Original der Kopie."],["TELEFON AM SCHALTER 2","Nein, die Warteschleife ist persönlich zu nehmen."],["WARTERAUM","Mein Buchstabe wurde aufgerufen, aber die Zahl gehört jemand anderem."],["SCHALTER 4","Einen Moment. Ich verbinde Sie mit Ihrem Moment."]];
function walking(){return ["outside","walk-sign","waiting","walk-counter"].includes(stage)}
function setStage(next,preserveMovement=false){if(next!==stage&&!preserveMovement)held.clear();stage=next;const moving=walking();if(moving){cancelSpeech();ambient.textContent="";}root.classList.toggle("walking",moving);walkHud.hidden=!moving;root.classList.toggle("first-person",!!window.Germany3D?.ready);if(moving){objective.textContent=next==="outside"?"BÜRGERAMT · EINGANG":next==="walk-sign"?"QR-SCHILD SCANNEN":next==="waiting"?"AUFRUF ABWARTEN · SCHALTER 3":"IHRE NUMMER · SCHALTER 3 · BEEILEN!";update(0)}}
function displayNumber(value){queueDisplay=value;board.textContent=value}
function say(text,onComplete,onStart,onBoundary){
 const owner=attempt,visibleCue=cue,requestedAt=performance.now(),readableMs=Math.max(3500,Math.min(14000,text.length*55));let settled=false,fallback=null,started=false,failed=false,mode="fallback";
 const current=()=>active&&owner===attempt&&visibleCue===cue&&line.textContent===text;
 const start=kind=>{if(!started&&current()){started=true;mode=kind;onStart?.(kind)}};
 const complete=()=>{if(settled||!current())return;start("fallback");settled=true;if(fallback!==null)clearTimer(fallback);onComplete?.(mode)};
 const voiced=options?.voiceOn?.()&&window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function";
 const beginFallback=()=>{if(settled||failed||!current())return;failed=true;mode="fallback";if(fallback!==null)clearTimer(fallback);try{if(speechSynthesis.speaking||speechSynthesis.pending)speechSynthesis.cancel()}catch{}start("fallback");if(onComplete)fallback=defer(complete,readableMs)};
 if(onComplete){if(voiced){const limit=hostVoiceStartupMs===null?(hostVoiceAttempts===0?1800:1200):Math.max(900,Math.min(1800,Math.round(hostVoiceStartupMs*2+250)));hostVoiceAttempts++;fallback=defer(beginFallback,limit)}else fallback=defer(complete,readableMs)}
 if(!voiced){start("fallback");return}
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=.96;
 utterance.onstart=()=>{if(!current()||settled||failed)return;start("voice");if(onComplete){const lag=Math.max(0,performance.now()-requestedAt);hostVoiceStartupMs=hostVoiceStartupMs===null?lag:Math.round(hostVoiceStartupMs*.6+lag*.4)}if(fallback!==null)clearTimer(fallback);if(onComplete)fallback=defer(complete,Math.max(20000,text.length*120))};
 utterance.onboundary=event=>{if(current()&&!settled&&!failed&&Number.isInteger(event.charIndex))onBoundary?.(event.charIndex)};
 utterance.onend=()=>{if(!failed)complete()};utterance.onerror=beginFallback;
 requestAnimationFrame(()=>{if(current()&&!settled){try{speechSynthesis.speak(utterance)}catch{utterance.onerror()}}});
}
function content(who,text,buttons=[],onComplete,onStart,onBoundary){
 cancelSpeech();ambient.textContent="";speaker.textContent=who;line.textContent=text;actions.replaceChildren();
 const owner=attempt,visibleCue=cue;
 for(const item of buttons){const button=document.createElement("button");button.type="button";button.textContent=item.label;
  button.addEventListener("click",()=>{if(!active||owner!==attempt||visibleCue!==cue||button.disabled)return;button.disabled=true;item.run()});actions.append(button)}
 say(text,onComplete,onStart,onBoundary);
}
function setStatus(text){status.textContent=text}
function distanceTo(target){return Math.hypot(view.x-target.x,view.z-target.z)}
function nearbyTarget(){if(stage==="outside")return door;if(stage==="walk-sign")return sign;return counter}
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
function forfeit(reason){if(!active||!activated||["cancelled","expired","closed"].includes(stage))return;activated=false;callPending=false;callOutcome="forfeit";link?.send("forfeit");exit.hidden=false;setStage("expired");setStatus("PLATZ VERFALLEN · "+reason);content("ANMELDESCHALTER","Das Telefon war nicht durchgehend erreichbar. Ihre Nummer ist gestrichen. Scannen Sie das Schild erneut.",[{label:"ZURÜCK ZUM QR-SCHILD",run:()=>setStage("walk-sign")},{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}])}
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
 const elapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;ambientStep(elapsed);
 queueClock+=elapsed;
 if(queueClock>=3.2){queueClock-=3.2;const calls=["B-041","F-91","A-004","Z-7","C-201","D-008","H-73","K-002"];queueIndex++;if(activated&&stage==="waiting"&&--ticketWaitCalls<=0){displayNumber(number);deadline=19;setStage("walk-counter");setStatus("NUMMER "+number+" · SCHALTER 3 · SOFORT")}else displayNumber(calls[(queueIndex-1)%calls.length]);ring()}
 if(!walking())return;
 if(stage==="walk-counter"){
  deadline-=elapsed;
  if(deadline<=0){activated=false;callPending=false;callOutcome="forfeit";link?.send("forfeit");setStage("expired");content("FRAU KNICK · SCHALTER 3","Ihre Nummer war aufgerufen. Ich habe währenddessen sehr viel nicht getan. Ihr Termin ist verfallen. Scannen Sie das Schild für einen neuen Vorgang.",[{label:"ZURÜCK ZUM QR-SCHILD",run:()=>setStage("walk-sign")},{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}]);setStatus("TERMIN VERFALLEN · "+number);return}
 }
 if(held.has("ArrowLeft"))view.yaw-=elapsed*1.8;
 if(held.has("ArrowRight"))view.yaw+=elapsed*1.8;
 const f=(held.has("KeyW")||held.has("ArrowUp")?1:0)-(held.has("KeyS")||held.has("ArrowDown")?1:0),s=(held.has("KeyD")?1:0)-(held.has("KeyA")?1:0);
 if(f||s){const length=Math.hypot(f,s),speed=held.has("ShiftLeft")?5.8:3.6,dx=(Math.sin(view.yaw)*f+Math.cos(view.yaw)*s)/length*speed*elapsed,dz=(-Math.cos(view.yaw)*f+Math.sin(view.yaw)*s)/length*speed*elapsed;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<steps;i++){const x=Math.max(-7.45,Math.min(7.45,view.x+dx/steps)),z=Math.max(-10.05,Math.min(8.45,view.z+dz/steps));const crossing=view.z>=door.z&&z<door.z||view.z<door.z&&z>=door.z;if(crossing&&Math.abs(x)>1.3)break;if(!officeBlocked(x,view.z))view.x=x;if(!officeBlocked(view.x,z)){view.z=z;if(crossing&&stage==="outside"&&z<door.z){setStage(activated?"waiting":"walk-sign",true);setStatus(activated?"WARTENUMMER "+number+" · AUFRUF ABWARTEN":"QR-CODE MIT DEM TELEFON SCANNEN")}}}}
 const near=distanceTo(nearbyTarget())<1.9&&(stage!=="outside"||Math.abs(view.x)<1.3);
 nearby.textContent=near?(stage==="outside"?"DURCH DEN EINGANG GEHEN":stage==="walk-sign"?"QR-CODE MIT DEM TELEFON SCANNEN":stage==="waiting"?"E · VORZEITIG AN SCHALTER 3":"E · FRAU KNICK ANSPRECHEN"):(stage==="outside"?"ZUR EINGANGSTÜR":stage==="walk-sign"?"QR-SCHILD UNTER DER ANZEIGE":"AUFRUFTAFEL BEOBACHTEN");
}
function interact(){if(!walking()||distanceTo(nearbyTarget())>=1.9||stage==="outside"&&Math.abs(view.x)>=1.3)return;
 if(stage==="outside"){view.z=4.8;setStage(activated?"waiting":"walk-sign");setStatus(activated?"WARTENUMMER "+number+" · AUFRUF ABWARTEN":"QR-CODE MIT DEM TELEFON SCANNEN");return}
 if(stage==="walk-sign")return;
 if(stage==="waiting"){setStage("early");content("FRAU KNICK · SCHALTER 3","Steht Ihre Nummer auf der Tafel? Nein? Dann treten Sie zurück! Dass ich hier gerade nichts tue, ist eine dienstliche Tätigkeit.",[{label:"ZURÜCK IN DEN WARTERAUM",run:()=>setStage("waiting")}]);setStatus("FALSCHER AUFRUF · "+queueDisplay);return}showClerk()}
function beginLink(){
 const invitation=BuergeramtLink.invitation();
 const code=qrcode(0,"M");code.addData(BuergeramtLink.phoneUrl(invitation));code.make();qrSvg=code.createSvgTag({cellSize:5,margin:4,scalable:true});window.Germany3D?.setAmtQr?.(qrSvg);
 const owner=attempt,currentLink=new BuergeramtLink("host",invitation);link=currentLink;
 const current=()=>active&&owner===attempt&&link===currentLink;
 const terminal=()=>["cancelled","closed"].includes(stage);
 currentLink.addEventListener("status",e=>{if(!current())return;if(stage==="cancelled"&&/getrennt|unterbrochen/i.test(e.detail)){policeDisconnectHandler?.();return}if(terminal())return;if(activated&&/getrennt|unterbrochen/i.test(e.detail))forfeit("TELEFON GETRENNT");else if(!activated)setStatus(e.detail)});
 currentLink.addEventListener("connected",()=>{if(!current()||terminal())return;setStatus("TELEFON VERBUNDEN · SCAN WIRD ERWARTET");probeLink();if(pingTimer===null)pingTimer=setInterval(()=>{if(current())probeLink()},1500)});
 currentLink.addEventListener("message",e=>{
  if(!current())return;const m=e.detail;
  if(m.type==="sync-pong"){receivePong(m.id,m.receivedAtMs,m.sentAtMs);return}
  if(m.type==="police-start"){if(stage==="cancelled"&&receivePoliceStart(m.index,m.mode,m.readyDelayMs,m.atMs))policeStartHandler?.(m.index);return}
  if(m.type==="police-done"){if(stage==="cancelled"&&receivePoliceDone(m.index,m.mode,m.durationMs,m.atMs))policeDoneHandler?.(m.index);return}
  if(terminal())return;
  if(m.type==="scan"){
   if(m.id===lastScanId){if(number)currentLink.send("ticket",{number});return}
   const next="B-"+String(ticketSerial);
   if(!currentLink.send("ticket",{number:next}))return;
   ticketSerial=ticketSerial===899?100:ticketSerial+1;lastScanId=m.id;
   number=next;registeredName="";activated=true;ticketWaitCalls=5;deadline=0;callPending=false;callTriggered=false;callOutcome="";clerkIndex=0;
   if(stage!=="outside")setStage("waiting");
   setStatus("WARTENUMMER "+number+" · AUFRUF ABWARTEN");
  }else if(m.type==="register"&&activated&&typeof m.name==="string"&&m.name.trim().length>=2&&m.name.length<=80){registeredName=m.name.trim().replace(/\s+/g," ")}
  else if(m.type==="phone-hidden")forfeit("TELEFON NICHT SICHTBAR");
  else if(activated&&callPending&&stage==="counter"&&m.id===story.call.id&&m.type==="answer"){
   callPending=false;callOutcome="answer";setStage("cancelled");setStatus("TERMIN ANNULLIERT · "+number);probeLink();showOutburst();
  }else if(activated&&callPending&&stage==="counter"&&m.id===story.call.id&&m.type==="decline"){
   callPending=false;callOutcome="decline";if(timing.cues[-1]?.status==="waiting")timing.cues[-1].status="declined";setStatus("ANRUF ABGELEHNT · SCHALTER 3");content("FRAU KNICK · SCHALTER 3",story.call.declined,[{label:"GESPRÄCH FORTSETZEN",run:showClerk}]);
  }
 });
 currentLink.start().catch(e=>{if(current()&&!terminal())setStatus("Verbindung fehlgeschlagen: "+e.message)});
}
function showClerk(){if(!active||!activated||callPending||["cancelled","expired","closed"].includes(stage))return;view.x=4;view.z=-8.15;view.yaw=0;setStage("counter");const node=story.clerk[clerkIndex];if(clerkIndex===0&&!callTriggered){callTriggered=true;callPending=true;content(node.speaker,"Nummer "+number+"? Beeilen Sie sich! Ich bin sehr beschäftigt. Was? Ihr Telefon klingelt während meiner Vorsprache.");if(!link.send("call",{id:story.call.id,line:story.call.line})){forfeit("TELEFON GETRENNT");return}sentPolice(-1);if(!activated)return;setStatus("POLIZEI RUFT AUF DEM TELEFON AN");return}if(callOutcome!=="decline"||!node)return;const choices=node.choices.map(choice=>({label:choice.label,run:()=>{setStage("reply");content(node.speaker,choice.reply,[{label:clerkIndex===story.clerk.length-1?"FORMULAR A38 ENTGEGENNEHMEN":"WEITER",run:()=>{clerkIndex++;if(clerkIndex<story.clerk.length)showClerk();else finish()}}])}}));content(node.speaker,node.line,choices)}
function showOutburst(){
 const upset=story.outburst;exit.hidden=true;
 const heard=new Set();let waiting=null,phoneTimeout=null,deskFirst=false,phoneFirst=false,started=false,disconnected=false;
 const afterPhone=(next,beat=420)=>defer(next,Math.max(60,beat-oneWay()-timing.deskStartLagMs));
 const afterDesk=(next,beat=420)=>defer(next,Math.max(0,beat-phoneStartLag()));
 function releasePhone(index){
  heard.add(index);if(waiting?.index!==index)return;
  if(timing.cues[index]?.doneAt===null)timing.cues[index].status=disconnected?"disconnected":"timeout";
  const next=waiting.next;waiting=null;if(phoneTimeout!==null)clearTimer(phoneTimeout);phoneTimeout=null;next();
 }
 policeDoneHandler=releasePhone;
 policeStartHandler=index=>{if(waiting?.index===index){if(phoneTimeout!==null)clearTimer(phoneTimeout);phoneTimeout=defer(()=>releasePhone(index),24000)}};
 policeDisconnectHandler=()=>{disconnected=true;if(waiting)releasePhone(waiting.index)};
 function waitPhone(index,next){waiting={index,next};if(heard.has(index)){releasePhone(index);return}phoneTimeout=defer(()=>releasePhone(index),18000)}
 function desk(index,next,onStart,onBoundary){
  const text=upset.lines[index],record={requestedAt:performance.now(),startAt:null,endAt:null,mode:"waiting"};timing.desk[index]=record;
  content(upset.speaker,text,[],mode=>{record.endAt=performance.now();record.mode=mode;if(record.startAt!==null){const rate=(record.endAt-record.startAt)/text.length;if(rate>=20&&rate<=180)timing.deskMsPerChar=Math.round(timing.deskMsPerChar*.65+rate*.35)}next?.()},mode=>{record.startAt=performance.now();record.startMode=mode;if(mode==="voice")timing.deskStartLagMs=Math.round(timing.deskStartLagMs*.6+(record.startAt-record.requestedAt)*.4);onStart?.()},onBoundary);
 }
 function police(index,next){waitPhone(index,next);if(!disconnected&&link?.send("police-line",{index,line:story.police[index]}))sentPolice(index);else releasePhone(index)}
 function finishArgument(){const callback=options.onCancel;close(false);callback()}
 function overlap(){
  let deskDone=false,phoneDone=false,continued=false,phoneSent=false,overlapTimer=null;
  const continueWhenBoth=()=>{if(deskDone&&phoneDone&&!continued){continued=true;const latest=Math.max(timing.desk[2].endAt,timing.cues[2]?.estimatedEndAt??performance.now());defer(()=>desk(3,()=>defer(()=>desk(4,()=>defer(finishArgument,300)),Math.max(100,520-timing.deskStartLagMs))),Math.max(80,420-(performance.now()-latest)-timing.deskStartLagMs))}};
  const interrupt=()=>{if(phoneSent)return;phoneSent=true;if(overlapTimer!==null)clearTimer(overlapTimer);police(2,()=>{phoneDone=true;continueWhenBoth()})};
  const clause=upset.lines[2].indexOf("!")+1,lead=Math.max(0,clause-10);
  desk(2,()=>{deskDone=true;interrupt();continueWhenBoth()},()=>{const target=Math.max(3500,Math.min(6500,lead*timing.deskMsPerChar));overlapTimer=defer(interrupt,Math.max(300,target-phoneFastLag()))},charIndex=>{if(charIndex>=lead)interrupt()});
 }
 function afterOfficerOne(){afterPhone(overlap)}
 function afterKnickOne(){afterDesk(()=>police(1,afterOfficerOne))}
 function afterOfficerZero(){afterPhone(()=>desk(1,afterKnickOne))}
 function beginExchange(){if(!deskFirst||!phoneFirst||started)return;started=true;const latest=Math.max(timing.desk[0].endAt,timing.cues[-1]?.estimatedEndAt??performance.now());defer(()=>police(0,afterOfficerZero),Math.max(0,latest+520-performance.now()-phoneStartLag()))}
 waitPhone(-1,()=>{phoneFirst=true;beginExchange()});
 desk(0,()=>{deskFirst=true;beginExchange()});
}
function finish(){if(!active||!activated||callPending||callOutcome!=="decline"||clerkIndex!==story.clerk.length)return;const callback=options.onForm;close(false);callback()}
function close(notify=true){
 if(!active)return;const config=options;active=false;attempt++;callPending=false;activated=false;callOutcome="";policeDoneHandler=null;policeStartHandler=null;policeDisconnectHandler=null;
 if(pingTimer!==null)clearInterval(pingTimer);pingTimer=null;outstandingPings.clear();
 for(const id of pendingTimers)clearTimeout(id);pendingTimers.clear();cancelSpeech();setStage("closed");
 try{ambientAudio?.close()?.catch(()=>{})}catch{}ambientAudio=null;held.clear();root.hidden=true;walkHud.hidden=true;ambient.textContent="";
 document.body.classList.remove("amt-inside");const previous=link;link=null;previous?.send("done");previous?.close();config.music?.(false);if(notify)config.onClose();
}
function open(config){if(active)return;resetTiming();hostVoiceStartupMs=null;hostVoiceAttempts=0;attempt++;callOutcome="";options=config;active=true;clerkIndex=0;callPending=false;callTriggered=false;registeredName="";number="";activated=false;lastScanId="";queueClock=0;queueIndex=1;ticketWaitCalls=0;deadline=0;ambientClock=0;displayNumber("B-041");view.x=0;view.z=8;view.yaw=0;held.clear();exit.hidden=false;root.hidden=false;document.body.classList.add("amt-inside");options.music?.(true);beginLink();setStage("outside");setStatus("EINGANG · BÜRGERAMT")}
function captureKey(event){if(event.type==="keyup")held.delete(event.code);if(!active)return;if(event.type==="keydown"&&event.code==="KeyE"&&walking()){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)interact();return}if(!walking())return;if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(event.type==="keydown")held.add(event.code);else held.delete(event.code)}}
window.addEventListener("keydown",captureKey,true);window.addEventListener("keyup",captureKey,true);window.addEventListener("blur",()=>held.clear());
document.addEventListener("visibilitychange",()=>{if(document.hidden)held.clear()});
document.addEventListener("pointermove",event=>{if(active&&walking()&&event.buttons===1&&!event.target.closest("button"))view.yaw+=event.movementX*.004});
document.querySelectorAll("[data-amt-key]").forEach(button=>{const key=button.dataset.amtKey;button.addEventListener("pointerdown",e=>{if(!active||!walking())return;e.preventDefault();button.setPointerCapture(e.pointerId);held.add(key)});for(const type of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(type,()=>held.delete(key))});
document.getElementById("amt-touch-e").addEventListener("click",interact);document.getElementById("amt-leave").addEventListener("click",()=>close());exit.addEventListener("click",()=>close());
window.BuergeramtLevel={open,replay(config){close(false);open(config)},update,interact,setOfficeObstacles(items){officeObstacles=Array.isArray(items)?items.filter(o=>[o.x,o.z,o.w,o.d].every(Number.isFinite)&&o.w>0&&o.d>0):[]},get active(){return active},get stage(){return stage},get queueDisplay(){return queueDisplay},get qrSvg(){return qrSvg},get phoneUrl(){return link?BuergeramtLink.phoneUrl(link.invitation):""},get timing(){return JSON.parse(JSON.stringify(timing))},get view(){return{x:view.x,z:view.z,yaw:view.yaw}},get registeredName(){return registeredName},get activated(){return activated}};
})();
