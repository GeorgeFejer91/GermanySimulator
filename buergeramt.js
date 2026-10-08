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
let attempt=0,cue=0,callOutcome="",speechGateTimer=null,recordedSpeech=null;
let clerkClock=0,clerkSpeaking=false,clerkAccent=0,clerkBeat="idle",clerkPulse=0;
function defer(callback,delay){const owner=attempt;const id=setTimeout(()=>{pendingTimers.delete(id);if(active&&owner===attempt)callback()},delay);pendingTimers.add(id);return id}
function clearTimer(id){clearTimeout(id);pendingTimers.delete(id)}
function cancelSpeech(){cue++;clerkSpeaking=false;if(speechGateTimer!==null)clearTimer(speechGateTimer);speechGateTimer=null;if(recordedSpeech){recordedSpeech.pause();recordedSpeech.removeAttribute("src");recordedSpeech.load();recordedSpeech=null}try{const engine=window.speechSynthesis;if(engine?.speaking||engine?.pending)engine.cancel()}catch{}}
let active=false,stage="closed",link=null,number="",registeredName="",activated=false,qrSvg="",queueDisplay="—",queueIndex=0,queueClock=0,ticketWaitCalls=0,ticketSerial=100,lastScanId="",deadline=0,clerkIndex=0,callPending=false,callTriggered=false,callCommitted=false,callArmTimer=null,clockAnchor=null,policeDoneHandler=null,policeStartHandler=null,policeDisconnectHandler=null,options=null,ambientClock=0,ambientIndex=0,officeAudio=null;
let timing={rttMs:null,oneWayMs:0,jitterMs:0,lastPongAt:null,clockOffsetMs:null,clockUncertaintyMs:null,startLagMs:null,phoneReadyMs:null,phoneFastReadyMs:null,deskStartLagMs:0,deskMsPerChar:55,call:null,cues:{},desk:{}};
let pingSerial=0,pingTimer=null,hostVoiceStartupMs=null,hostVoiceAttempts=0;const outstandingPings=new Map(),rttSamples=[];
function resetTiming(){if(pingTimer!==null)clearInterval(pingTimer);pingTimer=null;outstandingPings.clear();rttSamples.length=0;pingSerial=0;timing={rttMs:null,oneWayMs:0,jitterMs:0,lastPongAt:null,clockOffsetMs:null,clockUncertaintyMs:null,startLagMs:null,phoneReadyMs:null,phoneFastReadyMs:null,deskStartLagMs:0,deskMsPerChar:55,call:null,cues:{},desk:{}}}
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
const mix={ambience:.35,voice:.8,fx:.6},mixPanel=document.getElementById("amt-mix");
try{const saved=JSON.parse(localStorage.getItem("amt-mix-v1")||"null");for(const key of Object.keys(mix))if(Number.isFinite(saved?.[key]))mix[key]=Math.max(0,Math.min(1,saved[key]))}catch{}
function applyMix(){if(officeAudio){officeAudio.ambience.gain.value=.006*mix.ambience*(1-.92*omen.strength);officeAudio.fx.gain.value=mix.fx;officeAudio.signal.gain.value=mix.fx}}
for(const slider of mixPanel.querySelectorAll("[data-amt-volume]")){const key=slider.dataset.amtVolume;slider.value=String(Math.round(mix[key]*100));slider.addEventListener("input",()=>{mix[key]=Number(slider.value)/100;applyMix();try{localStorage.setItem("amt-mix-v1",JSON.stringify(mix))}catch{}})}
function initOfficeAudio(){
 try{if(options?.cityAudioBusy?.())return null;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio||navigator.userActivation&&!navigator.userActivation.hasBeenActive)return null;
  if(!officeAudio){const ctx=new Audio(),ambience=ctx.createGain(),fx=ctx.createGain(),bus=ctx.createGain(),signal=ctx.createGain(),hum=ctx.createOscillator();hum.type="sine";hum.frequency.value=53;ambience.connect(bus);fx.connect(bus);bus.connect(ctx.destination);signal.connect(ctx.destination);hum.connect(ambience);hum.start();officeAudio={ctx,ambience,fx,bus,signal,hum};applyMix();officeAudio.omenBuffers=Promise.all(["bed","tension"].map(async name=>{const response=await fetch("assets/audio/buergeramt-omen/"+name+".ogg?v=20261008-frontal-score");if(!response.ok)throw new Error("Omen audio unavailable");return ctx.decodeAudioData(await response.arrayBuffer())})).catch(()=>null)}
  if(officeAudio.ctx.state==="suspended")officeAudio.ctx.resume().catch(()=>{});return officeAudio;
 }catch{return null}
}
function officeCue(id,x,z){const audio=initOfficeAudio();if(!audio)return;const {ctx,fx}=audio,now=ctx.currentTime;
 const spec=id==="aktenkurier"?[180,.08,.055]:id==="archivbotin"?[1700,.16,.02]:id==="kopiependler"?[1100,.18,.025]:[950,.23,.025];
 const buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*spec[1]),ctx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type="bandpass";filter.frequency.value=spec[0];filter.Q.value=id==="aktenkurier"?.6:1.5;
 gain.gain.value=spec[2]*Math.max(.15,1-Math.hypot(view.x-x,view.z-z)/9);source.connect(filter).connect(gain).connect(fx);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start(now);
}
let omenTone=null;
function startOmenTone(){
 const audio=initOfficeAudio();if(!audio||omenTone)return;
 const {ctx,fx}=audio,now=ctx.currentTime,output=ctx.createGain(),filter=ctx.createBiquadFilter();
 output.gain.setValueAtTime(0,now);filter.type="lowpass";filter.frequency.value=280;output.connect(filter).connect(fx);
 const tone={ctx,output,filter,voices:[],stems:[],endAt:now+24,rendered:false},owner=attempt;
 const attach=(source,gain)=>{const voice={source,gain,ended:false};tone.voices.push(voice);source.onended=()=>{if(voice.ended)return;voice.ended=true;source.disconnect();gain.disconnect();if(tone.voices.every(item=>item.ended)){output.disconnect();filter.disconnect()}}};
 // The small oscillator bed is also the no-network/no-codec fallback.
 for(const [index,frequency] of [63.7,64.4,95.35,191.1].entries()){
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=["sine","sine","sawtooth","square"][index];osc.frequency.value=frequency;gain.gain.value=index===3?.018:.045;osc.connect(gain).connect(output);attach(osc,gain);osc.start(now);osc.stop(tone.endAt);
 }
 omenTone=tone;updateOmenTone();
 audio.omenBuffers.then(buffers=>{
  // A decoded preparation must never replay after its payoff, exit or replay.
  if(!buffers||!active||attempt!==owner||omenTone!==tone||omen.phase!=="approach"||omen.strength>=.75||ctx.currentTime>=tone.endAt)return;
  for(const buffer of buffers){
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain).connect(output);attach(source,gain);tone.stems.push(gain);source.start();source.stop(tone.endAt);
  }
  tone.rendered=true;updateOmenTone();
 });
}
function updateOmenTone(){
 updateOmenSpeech();
 const tone=omenTone;if(!tone)return;const now=tone.ctx.currentTime,p=omen.strength,speech=omen.speech,speaking=omen.phase==="blackout"&&speech?.startedAt!==null&&speech?.startedAt!==undefined;
 const life=omenLife(),tension=speech?.tension??0,duck=speaking?(speech.paused?.22:.36+.12*tension):1;
 // The same bounded pulse contracts the Gaussian volume: no independent beat timer.
 const drive=(.055+.72*life.pressure)*(.62+.38*life.pulse);
 tone.output.gain.setTargetAtTime(document.hidden?0:drive*duck,now,.018);
 tone.filter.frequency.setTargetAtTime(240+(speaking?650+2200*tension:4600)*life.pressure+550*life.pulse*p,now,.035);
 tone.filter.Q.setTargetAtTime(.65+1.35*life.pressure,now,.06);
 tone.stems.forEach((gain,index)=>gain.gain.setTargetAtTime(index===0?.72:life.pressure*(.55+.45*life.pulse)*(speaking?.25+.65*tension:1),now,.025));
 // Pitch is an authored voice control, not measured Hz. Map it gently to score colour.
 const semitones=speech?Math.max(-6,Math.min(3,(speech.pitch-1)*4+speech.semitones)):0,ratio=Math.pow(2,semitones/12);
 tone.voices.forEach(({source},index)=>{if(index<4)source.frequency.setTargetAtTime([63.7,64.4,95.35,191.1][index]*ratio,now,.12);else source.playbackRate.setTargetAtTime(ratio,now,.12)});
 if(officeAudio)officeAudio.ambience.gain.setTargetAtTime(.006*mix.ambience*(1-.92*p),now,.04);
}
function stopOmenTone(){
 const tone=omenTone;if(!tone)return;omenTone=null;
 const now=tone.ctx.currentTime;tone.output.gain.cancelScheduledValues(now);tone.output.gain.setValueAtTime(tone.output.gain.value,now);tone.output.gain.linearRampToValueAtTime(0,now+.025);
 for(const voice of tone.voices)if(!voice.ended){try{voice.source.stop(now+.03)}catch{voice.source.onended()}}
}
const characterRoutes=[
 {id:"aktenkurier",speed:.75,points:[[-4.8,-7.6],[-4.8,-5.2],[-2.8,-5.2],[-2.8,-7.6]]},
 {id:"archivbotin",speed:.57,points:[[5.5,-7.4],[5.5,-5.2],[3.6,-5.2],[3.6,-7.4]]},
 {id:"formularsammler",speed:.68,points:[[3.4,3.8],[3.4,2.4],[3.4,-.1],[3.4,-2.4]]},
 {id:"nummernfluesterer",speed:.82,points:[[-3.55,5.7],[-3.55,3.6],[-2.65,3.6],[-2.65,5.7]]},
 {id:"nachtschichtmelderin",speed:.72,points:[[4.75,5.5],[6.0,5.5],[6.0,3.65],[4.75,3.65]]},
 {id:"pfandarchitektin",speed:.48,points:[[-.95,2.65],[-.95,.25],[-.15,.25],[-.15,2.65]]},
 {id:"kopiependler",speed:.78,points:[[2.8,-3.25],[4.85,-3.25],[4.85,-2.35],[2.8,-2.35]]},
 {id:"warteschlangenpoetin",speed:.7,points:[[-4.55,-2.25],[-4.55,-3.55],[-5.55,-3.55],[-5.55,-2.25]]}
];
const characters=characterRoutes.map(route=>({id:route.id,route,x:route.points[0][0],z:route.points[0][1],target:1,direction:"up",mode:"work",pause:1.1,stride:0,workClock:0,encounters:0,sequence:[{mode:"work",duration:1.1}],pending:false,priority:0,attention:0}));
let characterMood=null;
const omen={used:false,phase:"",strength:0,hold:0,roomTime:0,startDistance:0,resume:"walk-sign",resumeYaw:0,recoverFromYaw:0,speech:null,visit:0,revealTime:0,lifeTime:0,lifeClock:0};
function omenLife(){
 const live=["approach","blackout","glare"].includes(omen.phase),p=live?omen.strength:0,tension=omen.speech?.tension||0;
 const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
 return {time:omen.lifeTime,clock:omen.lifeClock,depth:smooth((p-.05)/.95),opacity:smooth((p-.08)/.24),
  pressure:p*p*(.72+.28*tension),pulse:live?Math.pow(.5+.5*Math.cos(omen.lifeClock*Math.PI*2),8)*(omen.speech?.paused?.15:1):0};
}
const omenSpeechMarks=story.omen.delivery.contour.map(mark=>({...mark,index:story.omen.line.indexOf(mark.word)})).filter(mark=>mark.index>=0);
function updateOmenSpeech(){
 const speech=omen.speech;if(!speech||speech.mode==="waiting")return;
 if(speech.mode==="done")speech.progress=1;
 else if(!speech.paused&&speech.startedAt!==null&&speech.charIndex<0){
  speech.progress=Math.min(.92,Math.max(0,(performance.now()-speech.startedAt-speech.pausedMs)/speech.durationMs));
 }
 const index=speech.progress*story.omen.line.length,marks=omenSpeechMarks;
 let left=marks[0],right=marks.at(-1);
 for(let i=1;i<marks.length;i++){if(index<marks[i].index){left=marks[i-1];right=marks[i];break}left=marks[i];right=left}
 const blend=left===right?0:Math.max(0,Math.min(1,(index-left.index)/(right.index-left.index)));
 speech.tension=left.tension+(right.tension-left.tension)*blend;speech.semitones=left.semitones+(right.semitones-left.semitones)*blend;
}
function resetOmen(){stopOmenTone();omen.used=false;omen.phase="";omen.strength=0;omen.hold=0;omen.roomTime=0;omen.speech=null;omen.visit++;omen.revealTime=0;omen.lifeTime=0;omen.lifeClock=0;omen.resumeYaw=view.yaw;omen.recoverFromYaw=view.yaw;applyMix()}
function beginOmen(actor){
 const verse=story.omen;
 omen.phase="blackout";omen.strength=1;omen.revealTime=0;actor.pending=false;actor.sequence=[];actor.priority=4;actor.mode="gesture";actor.workClock=0;
 const speech=omen.speech={mode:"waiting",timing:"estimated",startedAt:null,charIndex:-1,progress:0,paused:false,pausedAt:null,pausedMs:0,tension:0,semitones:0,rate:verse.delivery.rate,pitch:verse.delivery.pitch,durationMs:speechReadableMs(verse.line,verse.delivery)};
 updateOmenTone();
 const delivery={...verse.delivery,onPause:()=>{if(speech.paused)return;updateOmenSpeech();speech.paused=true;speech.pausedAt=performance.now();updateOmenTone()},onResume:()=>{if(speech.paused){speech.pausedMs+=performance.now()-speech.pausedAt;speech.paused=false;speech.pausedAt=null;updateOmenTone()}},onFallback:()=>{speech.mode="fallback";speech.timing="estimated";speech.charIndex=-1;speech.startedAt=performance.now()-speech.progress*speech.durationMs;speech.paused=false;speech.pausedMs=0;speech.pausedAt=null;updateOmenTone()}};
 content(verse.speaker,verse.line,[],()=>{if(omen.phase==="blackout"){speech.mode="done";speech.paused=false;omen.phase="glare";omen.hold=.7;updateOmenTone()}},mode=>{
  speech.mode=mode;speech.startedAt=performance.now();updateOmenTone();
 },(charIndex,event)=>{
  if(speech.paused||charIndex<0||charIndex>verse.line.length||charIndex<=speech.charIndex)return;
  speech.charIndex=charIndex;speech.progress=charIndex/verse.line.length;speech.timing="boundary";speech.boundaryAt=performance.now();speech.elapsedTime=Number.isFinite(event?.elapsedTime)?event.elapsedTime:null;updateOmenTone();
 },{id:actor.id,tone:"dread",valence:-.9},delivery);
}
function updateOmen(dt){
 if(omen.phase==="blackout"||omen.phase==="glare")omen.revealTime+=dt;
 if(["walk-sign","waiting"].includes(stage))omen.roomTime+=dt;
 const actor=characters[0];
 if(options?.cinematics!==false&&!options?.cityAudioBusy?.()&&!omen.used&&!activated&&omen.roomTime>1.2&&stage==="walk-sign"&&Math.hypot(actor.x-view.x,actor.z-view.z)<6.2){
  omen.used=true;omen.phase="approach";omen.resume=stage;omen.resumeYaw=view.yaw;omen.startDistance=Math.hypot(actor.x-view.x,actor.z-view.z);actor.sequence=[];actor.pending=false;actor.priority=4;
  cancelSpeech();ambient.textContent="";characterMood=null;speaker.textContent="";line.textContent="";actions.replaceChildren();setStage("omen");setStatus("AKTENLAUF · UNTERBRECHUNG");startOmenTone();
 }
 if(["approach","blackout","glare"].includes(omen.phase)){
  const target=Math.atan2(actor.x-view.x,view.z-actor.z),turn=Math.atan2(Math.sin(target-view.yaw),Math.cos(target-view.yaw));
  view.yaw+=turn*(1-Math.exp(-4*dt));
 }
 if(omen.phase==="approach"){
  const progress=Math.max(0,Math.min(1,(omen.startDistance-Math.hypot(actor.x-view.x,actor.z-view.z))/Math.max(.1,omen.startDistance-1.72)));
  omen.strength=progress*progress*(3-2*progress);
 }else if(omen.phase==="glare"){omen.hold-=dt;if(omen.hold<=0){
  omen.phase="recover";omen.strength=0;omen.hold=.25;omen.recoverFromYaw=view.yaw;stopOmenTone();applyMix();
  actor.priority=0;actor.mode="walk";actor.attention=2;actor.target=actor.route.points.reduce((best,point,index)=>Math.hypot(actor.x-point[0],actor.z-point[1])<Math.hypot(actor.x-actor.route.points[best][0],actor.z-actor.route.points[best][1])?index:best,0);
  speaker.textContent="";line.textContent="";setStage(omen.resume);setStatus("VORGANG FORTSETZEN · "+queueDisplay);
 }}
 else if(omen.phase==="recover"){
  omen.hold=Math.max(0,omen.hold-dt);
  const turn=Math.atan2(Math.sin(omen.resumeYaw-omen.recoverFromYaw),Math.cos(omen.resumeYaw-omen.recoverFromYaw));view.yaw=omen.recoverFromYaw+turn*(1-omen.hold/.25);
  if(omen.hold===0)omen.phase="";
 }
 if(["approach","blackout","glare"].includes(omen.phase)&&!omen.speech?.paused){
  omen.lifeTime+=dt;omen.lifeClock+=dt*(.65+2.1*omen.strength+.35*(omen.speech?.tension||0));
 }
 updateOmenTone();
}
function approachOmen(actor,dt){
 const dx=view.x-actor.x,dz=view.z-actor.z,distance=Math.hypot(dx,dz);
 if(distance<1.72){beginOmen(actor);return}
 const step=Math.min(distance-1.62,.78*dt);
 actor.x+=dx/distance*step;actor.z+=dz/distance*step;actor.stride+=step*8.5;
 actor.direction=Math.abs(dx)>Math.abs(dz)?dx>0?"right":"left":dz>0?"down":"up";actor.mode="walk";
}
function resetCharacters(){for(const actor of characters){actor.x=actor.route.points[0][0];actor.z=actor.route.points[0][1];actor.target=1;actor.direction="up";actor.mode="work";actor.pause=1.1;actor.stride=0;actor.workClock=0;actor.encounters=0;actor.sequence=[{mode:"work",duration:1.1}];actor.pending=false;actor.priority=0;actor.attention=0}characterMood=null}
function action(actor,steps,priority=1){
 if(priority<actor.priority||actor.mode==="gesture"&&actor.priority>=3&&priority<3)return;
 actor.sequence=steps.map(([mode,duration])=>({mode,duration}));actor.priority=priority;
 actor.pending=actor.mode==="walk";
 if(!actor.pending)startAction(actor);
}
function startAction(actor){actor.mode=actor.sequence[0].mode;actor.pause=actor.sequence[0].duration;actor.workClock=0}
function characterPhase(actor){
 if(actor.mode==="walk")return(actor.stride%8)/8;
 const step=actor.sequence[0];
 // A short reaction owns its whole clip; ambient breathing keeps its own rate.
 if(!actor.pending&&step?.mode===actor.mode&&["look","flinch"].includes(actor.mode))return Math.max(0,Math.min(1,1-actor.pause/step.duration));
 return((actor.workClock*3)%8)/8;
}
function advanceAction(actor,dt){
 if(!actor.sequence.length||actor.pending)return false;
 actor.pause-=dt;
 while(actor.pause<=0&&actor.sequence.length){actor.sequence.shift();if(actor.sequence.length){actor.mode=actor.sequence[0].mode;actor.workClock=-actor.pause;actor.pause+=actor.sequence[0].duration}}
 if(actor.sequence.length)return true;
 actor.priority=0;actor.mode="walk";return false;
}
function reactToCall(){
 if(!walking())return;
 for(const offset of [0,3]){const actor=characters[(queueIndex+offset)%characters.length];
  action(actor,[["look",.78],["flinch",.5],["work",.42]],2)}
}
function updateCharacters(dt){
 for(const actor of characters){
  actor.attention=Math.max(0,actor.attention-dt);
  if(actor.id==="aktenkurier"&&omen.phase==="approach"){approachOmen(actor,dt);continue}
  if(!walking()){if(actor.mode==="gesture"&&actor.priority>=3)actor.workClock+=dt;continue}
  actor.workClock+=dt;
  if(actor.mode==="gesture")continue;
  if(advanceAction(actor,dt))continue;
  const [tx,tz]=actor.route.points[actor.target],dx=tx-actor.x,dz=tz-actor.z,distance=Math.hypot(dx,dz);
  if(distance<.025){actor.x=tx;actor.z=tz;actor.target=(actor.target+1)%actor.route.points.length;action(actor,[["work",1.25],["look",.48]],1);officeCue(actor.id,actor.x,actor.z);continue}
  const step=Math.min(distance,actor.route.speed*dt),nextX=actor.x+dx/distance*step,nextZ=actor.z+dz/distance*step;
  if(Math.hypot(nextX-view.x,nextZ-view.z)<1.05&&Math.hypot(nextX-view.x,nextZ-view.z)<Math.hypot(actor.x-view.x,actor.z-view.z)||
     characters.some(other=>other!==actor&&Math.hypot(nextX-other.x,nextZ-other.z)<.65)){if(!actor.pending)actor.sequence=[{mode:"work",duration:.35}];actor.pending=false;startAction(actor);continue}
  actor.x=nextX;actor.z=nextZ;const oldLoop=Math.floor(actor.stride/8);actor.stride+=step*8.5;
  actor.direction=Math.abs(dx)>Math.abs(dz)?dx>0?"right":"left":dz>0?"down":"up";actor.mode="walk";
  if(actor.pending&&Math.floor(actor.stride/8)>oldLoop){actor.pending=false;startAction(actor)}
  if(actor.attention===0&&Math.hypot(actor.x-view.x,actor.z-view.z)<2.5){actor.attention=7.5;action(actor,[["look",.72],["work",.4]],1)}
 }
}
function nearestCharacter(){if(!["walk-sign","waiting"].includes(stage))return null;let found=null,distance=1.65;for(const actor of characters){const d=Math.hypot(view.x-actor.x,view.z-actor.z);if(d<distance){found=actor;distance=d}}return found}
function showCharacter(actor){
 const entry=story.characters[actor.id],spoken=entry.lines[actor.encounters++%entry.lines.length],resume=stage;
 actor.pending=false;actor.sequence=[];actor.priority=3;actor.mode="gesture";actor.workClock=0;setStage("character");content(entry.speaker,spoken.line,[{label:"ZURÜCK ZUM VORGANG",run:()=>{actor.priority=0;action(actor,[["look",.45],["work",.7]],1);setStage(resume)}}],null,null,null,{id:actor.id,tone:spoken.tone,valence:spoken.valence});
}
function walking(){return ["outside","walk-sign","waiting","walk-counter"].includes(stage)}
function setStage(next,preserveMovement=false){if(next!==stage&&!preserveMovement)held.clear();stage=next;document.body.classList.toggle("amt-omen",next==="omen");const moving=walking();if(moving){cancelSpeech();ambient.textContent="";characterMood=null;}root.classList.toggle("walking",moving);walkHud.hidden=!moving;root.classList.toggle("first-person",!!window.Germany3D?.ready);if(moving){objective.textContent=next==="outside"?"BÜRGERAMT · EINGANG":next==="walk-sign"?"QR-SCHILD SCANNEN":next==="waiting"?"AUFRUF ABWARTEN · SCHALTER 3":"IHRE NUMMER · SCHALTER 3 · BEEILEN!";update(0)}}
function displayNumber(value){queueDisplay=value;board.textContent=value}
function speechReadableMs(text,delivery){return Math.max(3500,Math.min(14000,text.length*55*.96/(delivery?.rate??.96)))}
function say(text,onComplete,onStart,onBoundary,delivery=null,voiceId="",allowPreview=true){
 const owner=attempt,visibleCue=cue,readableMs=speechReadableMs(text,delivery);
 const current=()=>active&&owner===attempt&&visibleCue===cue&&line.textContent===text;
 const begin=()=>{
  if(!current())return;
  const candidate=allowPreview&&options?.voiceOn?.()&&window.GermanySimulatorAudioText?.candidateClip?.(voiceId,text);
  if(candidate){
   try{
    const player=new Audio(candidate);recordedSpeech=player;player.volume=mix.voice;
    let started=false,settled=false;
    const start=()=>{if(!started&&current()){started=true;onStart?.("voice")}};
    const finish=()=>{if(settled||!current())return;settled=true;start();recordedSpeech=null;onComplete?.("voice")};
    const fallback=()=>{if(settled||!current())return;settled=true;recordedSpeech=null;say(text,onComplete,onStart,onBoundary,delivery,voiceId,false)};
    player.onplaying=start;player.onended=finish;player.onerror=fallback;
    player.play().catch(fallback);return;
   }catch{recordedSpeech=null}
  }
  const requestedAt=performance.now();let settled=false,fallback=null,started=false,failed=false,paused=false,completionDue=0,completionRemaining=0,mode="fallback";
 const start=kind=>{if(!started&&current()){started=true;mode=kind;onStart?.(kind)}};
 const complete=()=>{if(settled||!current())return;start("fallback");settled=true;if(fallback!==null)clearTimer(fallback);onComplete?.(mode)};
 const voiced=options?.voiceOn?.()&&window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function";
 const beginFallback=()=>{if(settled||failed||!current())return;failed=true;mode="fallback";if(fallback!==null)clearTimer(fallback);try{if(speechSynthesis.speaking||speechSynthesis.pending)speechSynthesis.cancel()}catch{}start("fallback");delivery?.onFallback?.();if(onComplete)fallback=defer(complete,readableMs)};
 if(onComplete||onStart){if(voiced){const limit=hostVoiceStartupMs===null?(hostVoiceAttempts===0?1800:1200):Math.max(900,Math.min(1800,Math.round(hostVoiceStartupMs*2+250)));hostVoiceAttempts++;fallback=defer(beginFallback,limit)}else if(onComplete)fallback=defer(complete,readableMs)}
 if(!voiced){start("fallback");return}
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=delivery?.rate??.96;utterance.pitch=delivery?.pitch??1;utterance.volume=mix.voice;
 utterance.onstart=()=>{if(!current()||settled||failed)return;start("voice");if(onComplete||onStart){const lag=Math.max(0,performance.now()-requestedAt);hostVoiceStartupMs=hostVoiceStartupMs===null?lag:Math.round(hostVoiceStartupMs*.6+lag*.4)}if(fallback!==null)clearTimer(fallback);if(onComplete){completionRemaining=Math.max(20000,text.length*120);completionDue=performance.now()+completionRemaining;fallback=defer(complete,completionRemaining)}};
 utterance.onboundary=event=>{if(current()&&started&&!settled&&!failed&&Number.isInteger(event.charIndex))onBoundary?.(event.charIndex,event)};
 utterance.onpause=()=>{if(!delivery||!current()||!started||settled||failed||paused)return;paused=true;if(onComplete&&fallback!==null){completionRemaining=Math.max(0,completionDue-performance.now());clearTimer(fallback);fallback=null}delivery.onPause?.()};
 utterance.onresume=()=>{if(!current()||!started||settled||failed||!paused)return;paused=false;if(onComplete){completionDue=performance.now()+completionRemaining;fallback=defer(complete,completionRemaining)}delivery?.onResume?.()};
 utterance.onend=()=>{if(!failed)complete()};utterance.onerror=beginFallback;
 requestAnimationFrame(()=>{if(current()&&!settled){try{speechSynthesis.speak(utterance)}catch{utterance.onerror()}}});
 };
 const waitForCity=()=>{if(!current())return;if(options?.cityAudioBusy?.()){speechGateTimer=defer(waitForCity,40);return}speechGateTimer=null;begin()};
 waitForCity();
}
function content(who,text,buttons=[],onComplete,onStart,onBoundary,mood=null,delivery=null){
 const isClerk=who.includes("KNICK");
 cancelSpeech();ambient.textContent="";speaker.textContent=who;line.textContent=text;
 characterMood=isClerk?{id:"clerk",tone:stage==="cancelled"||stage==="early"||stage==="expired"?"warning":"procedural",valence:stage==="cancelled"?-.82:-.38}:mood;
 actions.replaceChildren();
 if(isClerk){clerkBeat=stage==="reply"?"stamp":stage==="cancelled"||stage==="early"||stage==="expired"?"deny":"raise";clerkAccent=.4;clerkPulse=0}
 const owner=attempt,visibleCue=cue;
 for(const item of buttons){const button=document.createElement("button");button.type="button";button.textContent=item.label;
  button.addEventListener("click",()=>{if(!active||owner!==attempt||visibleCue!==cue||button.disabled)return;button.disabled=true;item.run()});actions.append(button)}
 const voiceId=isClerk?story.clerkIdentity.voiceId:story.characters[mood?.id]?.voiceId||"";
 say(text,onComplete?mode=>{if(isClerk){clerkSpeaking=false;clerkBeat=stage==="reply"?"stamp":stage==="cancelled"?"deny":"review";clerkAccent=.65}onComplete(mode)}:null,mode=>{if(isClerk){clerkSpeaking=true;clerkPulse=0;if(!onComplete){const speakingCue=cue;defer(()=>{if(cue===speakingCue){clerkSpeaking=false;clerkBeat="review";clerkAccent=.65}},Math.max(1800,Math.min(10000,text.length*55)))}}onStart?.(mode)},(charIndex,event)=>{if(isClerk)clerkPulse++;onBoundary?.(charIndex,event)},delivery,voiceId);
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
 if(characters.some(actor=>Math.hypot(x-actor.x,z-actor.z)<.72))return true;
 return officeSeats.some(([sx,sz])=>Math.abs(x-sx)<.62&&Math.abs(z-sz)<.58);
}
function forfeit(reason){if(!active||!activated||["cancelled","expired","closed"].includes(stage))return;activated=false;callPending=false;callOutcome="forfeit";stopCallSignal();if(omen.phase){stopOmenTone();omen.phase="";omen.strength=0;const actor=characters[0];actor.priority=0;actor.mode="walk";actor.sequence=[];applyMix()}link?.send("forfeit");exit.hidden=false;setStage("expired");setStatus("PLATZ VERFALLEN · "+reason);content("ANMELDESCHALTER","Das Telefon war nicht durchgehend erreichbar. Ihre Nummer ist gestrichen. Scannen Sie das Schild erneut.",[{label:"ZURÜCK ZUM QR-SCHILD",run:()=>setStage("walk-sign")},{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}])}
function ring(){try{const audio=initOfficeAudio();if(!audio)return;const {ctx,fx}=audio,now=ctx.currentTime;for(const offset of [0,.2,.52,.72]){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type="sine";osc.frequency.value=425;gain.gain.setValueAtTime(.0001,now+offset);gain.gain.linearRampToValueAtTime(.014,now+offset+.015);gain.gain.setValueAtTime(.014,now+offset+.1);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.15);osc.connect(gain).connect(fx);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(now+offset);osc.stop(now+offset+.16)}}catch{}}
const callSignalSources=new Set();let signalPauseTimer=null,signalEndTimer=null,signalPaused=false;
function stopCallSignal(){
 if(signalPauseTimer!==null)clearTimer(signalPauseTimer);if(signalEndTimer!==null)clearTimer(signalEndTimer);signalPauseTimer=signalEndTimer=null;
 for(const source of callSignalSources){try{source.stop()}catch{}}callSignalSources.clear();
 if(officeAudio){const {ctx,bus}=officeAudio;bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(1,ctx.currentTime)}
 if(signalPaused){signalPaused=false;try{window.speechSynthesis?.resume?.()}catch{}}
}
function playCallSignal(signalAtMs,ringAtMs){
 if(mix.fx<=0)return;
 const audio=initOfficeAudio();if(!audio)return;
 const {ctx,bus,signal}=audio,now=performance.now(),start=ctx.currentTime+Math.max(0,(signalAtMs-now)/1000),end=ctx.currentTime+Math.max(.08,(ringAtMs-now)/1000);
 if(end-start<.25)return;
 bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(bus.gain.value,ctx.currentTime);bus.gain.linearRampToValueAtTime(.16,start+.035);bus.gain.setValueAtTime(.16,end-.12);bus.gain.linearRampToValueAtTime(1,end);
 const tone=ctx.createOscillator(),low=ctx.createBiquadFilter(),envelope=ctx.createGain();tone.type="sawtooth";tone.frequency.value=217;low.type="lowpass";low.frequency.value=1700;envelope.gain.setValueAtTime(0,start);
 for(const offset of [0,.12,.24,.5,.62,.74]){const at=start+offset;if(at+.075>=end)break;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.052,at+.006);envelope.gain.setValueAtTime(.052,at+.055);envelope.gain.linearRampToValueAtTime(0,at+.075)}
 tone.connect(low).connect(envelope).connect(signal);tone.onended=()=>{callSignalSources.delete(tone);tone.disconnect();low.disconnect();envelope.disconnect()};callSignalSources.add(tone);tone.start(start);tone.stop(end);
 signalPauseTimer=defer(()=>{signalPauseTimer=null;if(mix.fx>0&&stage==="counter"&&callPending&&window.speechSynthesis?.speaking&&!window.speechSynthesis.paused){try{window.speechSynthesis.pause();signalPaused=true}catch{}}},Math.max(0,signalAtMs-performance.now()));
 signalEndTimer=defer(()=>{signalEndTimer=null;stopCallSignal()},Math.max(0,ringAtMs-performance.now()));
}
function commitCall(reason){
 if(!active||!activated||!callPending||callCommitted||stage!=="counter")return;
 callCommitted=true;if(callArmTimer!==null)clearTimer(callArmTimer);callArmTimer=null;
 const now=performance.now(),leadMs=2200,ringAtMs=now+leadMs;
 const peerFresh=timing.lastPongAt!==null&&now-timing.lastPongAt<6000&&timing.clockUncertaintyMs<=250;
 const ringAtPhoneMs=peerFresh?ringAtMs+timing.clockOffsetMs:null;
 const ringAtUtcMs=window.BuergeramtClock?.usable?.(clockAnchor,now)?Math.round(window.BuergeramtClock.utcAt(clockAnchor,ringAtMs)):null;
 if(!link.send("call",{id:story.call.id,line:story.call.line,ringAtPhoneMs,ringAtUtcMs,leadMs})){forfeit("TELEFON GETRENNT");return}
 timing.call={reason,armedAtMs:now,ringAtMs,signalAtMs:ringAtMs-900,ringAtPhoneMs,ringAtUtcMs,peerUncertaintyMs:peerFresh?timing.clockUncertaintyMs:null,utcUncertaintyMs:ringAtUtcMs!==null?clockAnchor.uncertaintyMs:null,phoneScheduledAtMs:null,phoneMode:null,lateMs:null};
 sentPolice(-1);playCallSignal(ringAtMs-900,ringAtMs);setStatus("POLIZEI RUFT AUF DEM TELEFON AN");
}
function armCall(){if(!active||!callPending||callCommitted||callArmTimer!==null)return;if(!link.send("call-arm",{id:story.call.id})){forfeit("TELEFON GETRENNT");return}callArmTimer=defer(()=>commitCall("ready-timeout"),1000)}
function ambientStep(dt){
 if(!walking()||stage==="outside")return;ambientClock+=dt;
 if(ambientClock<8.5||options?.cityAudioBusy?.()||window.speechSynthesis?.speaking||window.speechSynthesis?.pending)return;
 ambientClock=0;const [who,text]=ambientLines[ambientIndex++%ambientLines.length];
 const owner=attempt,visibleCue=++cue,caption=who+": "+text;
 const current=()=>active&&owner===attempt&&visibleCue===cue&&walking();
 const show=()=>{if(current())ambient.textContent=caption};
 if(options.voiceOn?.()&&window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function"){
  const voice=new SpeechSynthesisUtterance(text);voice.lang="de-DE";voice.volume=.22*mix.voice;voice.rate=1.1;voice.onstart=show;
  voice.onend=voice.onerror=()=>{if(current())ambient.textContent=""};
  try{speechSynthesis.speak(voice)}catch{show()}
 }else show();
 if(ambientIndex%2===0)ring();
}
function update(dt){
 if(!active)return;
 if(window.Germany3D?.ready&&!root.classList.contains("first-person"))root.classList.add("first-person");
 const elapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;ambientStep(elapsed);
 clerkClock+=elapsed;clerkAccent=Math.max(0,clerkAccent-elapsed);
 updateOmen(elapsed);
 updateCharacters(elapsed);
 if(omen.phase)return;
 if(stage==="character"){
  const actor=characters.find(item=>item.id===characterMood?.id);
  if(actor){const target=Math.atan2(actor.x-view.x,view.z-actor.z),turn=Math.atan2(Math.sin(target-view.yaw),Math.cos(target-view.yaw));view.yaw+=turn*(1-Math.exp(-4*elapsed))}
  return;
 }
 queueClock+=elapsed;
 if(queueClock>=3.2){queueClock-=3.2;const calls=["B-041","F-91","A-004","Z-7","C-201","D-008","H-73","K-002"];queueIndex++;if(activated&&stage==="waiting"&&--ticketWaitCalls<=0){displayNumber(number);deadline=19;setStage("walk-counter");setStatus("NUMMER "+number+" · SCHALTER 3 · SOFORT")}else displayNumber(calls[(queueIndex-1)%calls.length]);reactToCall();ring()}
 if(!walking())return;
 if(stage==="walk-counter"){
  deadline-=elapsed;
  if(deadline<=0){activated=false;callPending=false;callOutcome="forfeit";link?.send("forfeit");setStage("expired");content("FRAU KNICK · SCHALTER 3","Ihre Nummer war aufgerufen. Ich habe währenddessen sehr viel nicht getan. Ihr Termin ist verfallen. Scannen Sie das Schild für einen neuen Vorgang.",[{label:"ZURÜCK ZUM QR-SCHILD",run:()=>setStage("walk-sign")},{label:"AMT VERLASSEN",run:()=>{close(false);options.onCancel()}}]);setStatus("TERMIN VERFALLEN · "+number);return}
 }
 if(held.has("ArrowLeft"))view.yaw-=elapsed*1.8;
 if(held.has("ArrowRight"))view.yaw+=elapsed*1.8;
 const f=(held.has("KeyW")||held.has("ArrowUp")?1:0)-(held.has("KeyS")||held.has("ArrowDown")?1:0),s=(held.has("KeyD")?1:0)-(held.has("KeyA")?1:0);
 if(f||s){const length=Math.hypot(f,s),speed=held.has("ShiftLeft")?5.8:3.6,dx=(Math.sin(view.yaw)*f+Math.cos(view.yaw)*s)/length*speed*elapsed,dz=(-Math.cos(view.yaw)*f+Math.sin(view.yaw)*s)/length*speed*elapsed;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<steps;i++){const x=Math.max(-7.45,Math.min(7.45,view.x+dx/steps)),z=Math.max(-10.05,Math.min(8.45,view.z+dz/steps));const crossing=view.z>=door.z&&z<door.z||view.z<door.z&&z>=door.z;if(crossing&&Math.abs(x)>1.3)break;if(!officeBlocked(x,view.z))view.x=x;if(!officeBlocked(view.x,z)){view.z=z;if(crossing&&stage==="outside"&&z<door.z){setStage(activated?"waiting":"walk-sign",true);setStatus(activated?"WARTENUMMER "+number+" · AUFRUF ABWARTEN":"QR-CODE MIT DEM TELEFON SCANNEN")}}}}
 const near=distanceTo(nearbyTarget())<1.9&&(stage!=="outside"||Math.abs(view.x)<1.3),actor=stage==="waiting"&&near?null:nearestCharacter();
 const nearbyText=actor?"E · "+story.characters[actor.id].speaker+" ANSPRECHEN":near?(stage==="outside"?"DURCH DEN EINGANG GEHEN":stage==="walk-sign"?"QR-CODE MIT DEM TELEFON SCANNEN":stage==="waiting"?"E · VORZEITIG AN SCHALTER 3":"E · FRAU KNICK ANSPRECHEN"):(stage==="outside"?"ZUR EINGANGSTÜR":stage==="walk-sign"?"QR-SCHILD UNTER DER ANZEIGE":"AUFRUFTAFEL BEOBACHTEN");
 if(nearby.textContent!==nearbyText)nearby.textContent=nearbyText;
}
function interact(){if(!walking()||omen.phase)return;const near=distanceTo(nearbyTarget())<1.9,actor=stage==="waiting"&&near?null:nearestCharacter();if(actor){showCharacter(actor);return}if(!near||stage==="outside"&&Math.abs(view.x)>=1.3)return;
 if(stage==="outside"){view.z=4.8;setStage(activated?"waiting":"walk-sign");setStatus(activated?"WARTENUMMER "+number+" · AUFRUF ABWARTEN":"QR-CODE MIT DEM TELEFON SCANNEN");return}
 if(stage==="walk-sign")return;
 if(stage==="waiting"){setStage("early");content("FRAU KNICK · SCHALTER 3","Steht Ihre Nummer auf der Tafel? Nein? Dann treten Sie zurück! Dass ich hier gerade nichts tue, ist eine dienstliche Tätigkeit.",[{label:"ZURÜCK IN DEN WARTERAUM",run:()=>setStage("waiting")}]);setStatus("FALSCHER AUFRUF · "+queueDisplay);return}showClerk()}
function beginLink(){
 const invitation=BuergeramtLink.invitation();
 const code=qrcode(0,"M");code.addData(BuergeramtLink.phoneUrl(invitation,options.subtitlesOn?.()));code.make();qrSvg=code.createSvgTag({cellSize:5,margin:4,scalable:true});window.Germany3D?.setAmtQr?.(qrSvg);
 const owner=attempt,currentLink=new BuergeramtLink("host",invitation);link=currentLink;
 const current=()=>active&&owner===attempt&&link===currentLink;
 const terminal=()=>["cancelled","closed"].includes(stage);
 currentLink.addEventListener("status",e=>{if(!current())return;if(stage==="cancelled"&&/getrennt|unterbrochen/i.test(e.detail)){policeDisconnectHandler?.();return}if(terminal())return;if(activated&&/getrennt|unterbrochen/i.test(e.detail))forfeit("TELEFON GETRENNT");else if(!activated)setStatus(e.detail)});
 currentLink.addEventListener("connected",()=>{if(!current()||terminal())return;setStatus("TELEFON VERBUNDEN · SCAN WIRD ERWARTET");probeLink();if(pingTimer===null)pingTimer=setInterval(()=>{if(current())probeLink()},1500)});
 currentLink.addEventListener("message",e=>{
  if(!current())return;const m=e.detail;
  if(m.type==="sync-pong"){receivePong(m.id,m.receivedAtMs,m.sentAtMs);return}
  if(m.type==="call-ready"){if(stage==="counter"&&callPending&&m.id===story.call.id)commitCall("phone-ready");return}
  if(m.type==="call-scheduled"){if(timing.call&&m.id===story.call.id&&timing.call.phoneScheduledAtMs===null){timing.call.phoneScheduledAtMs=m.atMs;timing.call.phoneMode=m.mode;timing.call.lateMs=m.lateMs}return}
  if(m.type==="police-start"){if(stage==="cancelled"&&receivePoliceStart(m.index,m.mode,m.readyDelayMs,m.atMs))policeStartHandler?.(m.index);return}
  if(m.type==="police-done"){if(stage==="cancelled"&&receivePoliceDone(m.index,m.mode,m.durationMs,m.atMs))policeDoneHandler?.(m.index);return}
  if(terminal())return;
  if(m.type==="scan"){
   if(m.id===lastScanId){if(number)currentLink.send("ticket",{number});return}
   const next="B-"+String(ticketSerial);
   if(!currentLink.send("ticket",{number:next}))return;
   ticketSerial=ticketSerial===899?100:ticketSerial+1;lastScanId=m.id;
   number=next;registeredName="";activated=true;ticketWaitCalls=5;deadline=0;callPending=false;callTriggered=false;callCommitted=false;callOutcome="";clerkIndex=0;
   if(omen.phase){omen.resume="waiting";if(omen.phase==="recover")setStage("waiting")}
   else if(stage!=="outside")setStage("waiting");
   setStatus("WARTENUMMER "+number+" · AUFRUF ABWARTEN");
  }else if(m.type==="register"&&activated&&typeof m.name==="string"&&m.name.trim().length>=2&&m.name.length<=80){registeredName=m.name.trim().replace(/\s+/g," ");if(stage==="walk-counter")setStatus("NAME EINGETRAGEN · FRAU KNICK ANSPRECHEN")}
  else if(m.type==="phone-hidden")forfeit("TELEFON NICHT SICHTBAR");
  else if(activated&&callPending&&callCommitted&&stage==="counter"&&m.id===story.call.id&&m.type==="answer"){
   callPending=false;callOutcome="answer";stopCallSignal();setStage("cancelled");setStatus("TERMIN ANNULLIERT · "+number);probeLink();showOutburst();
  }else if(activated&&callPending&&callCommitted&&stage==="counter"&&m.id===story.call.id&&m.type==="decline"){
   callPending=false;callOutcome="decline";stopCallSignal();if(timing.cues[-1]?.status==="waiting")timing.cues[-1].status="declined";setStatus("ANRUF ABGELEHNT · SCHALTER 3");content("FRAU KNICK · SCHALTER 3",story.call.declined,[{label:"GESPRÄCH FORTSETZEN",run:showClerk}]);
  }
 });
 currentLink.start().catch(e=>{if(current()&&!terminal())setStatus("Verbindung fehlgeschlagen: "+e.message)});
}
function showClerk(){if(!active||!activated||callPending||["cancelled","expired","closed"].includes(stage))return;if(!registeredName){setStatus("VOR- UND NACHNAME AM TELEFON EINTRAGEN");return}view.x=4;view.z=-8.15;view.yaw=0;setStage("counter");const node=story.clerk[clerkIndex];if(clerkIndex===0&&!callTriggered){callTriggered=true;callPending=true;content(node.speaker,"Nummer "+number+"? Beeilen Sie sich! Ich bin sehr beschäftigt. Was? Ihr Telefon klingelt während meiner Vorsprache.",[],null,armCall);return}if(callOutcome!=="decline"||!node)return;const choices=node.choices.map(choice=>({label:choice.label,run:()=>{setStage("reply");content(node.speaker,choice.reply,[{label:clerkIndex===story.clerk.length-1?"FORMULAR A38 ENTGEGENNEHMEN":"WEITER",run:()=>{clerkIndex++;if(clerkIndex<story.clerk.length)showClerk();else finish()}}])}}));content(node.speaker,node.line,choices)}
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
 if(!active)return;const config=options;stopCallSignal();active=false;attempt++;callPending=false;activated=false;callOutcome="";policeDoneHandler=null;policeStartHandler=null;policeDisconnectHandler=null;characterMood=null;
 window.Germany3D?.clearAmtOmenSplat?.();
 clerkSpeaking=false;clerkAccent=0;resetOmen();
 if(pingTimer!==null)clearInterval(pingTimer);pingTimer=null;outstandingPings.clear();
 for(const id of pendingTimers)clearTimeout(id);pendingTimers.clear();cancelSpeech();setStage("closed");
 try{officeAudio?.ctx.close()?.catch(()=>{})}catch{}officeAudio=null;held.clear();root.hidden=true;walkHud.hidden=true;mixPanel.open=false;mixPanel.hidden=true;ambient.textContent="";
 document.body.classList.remove("amt-inside");const previous=link;link=null;previous?.send("done");previous?.close();config.music?.(false);if(notify)config.onClose();
}
function open(config){if(active)return;resetTiming();hostVoiceStartupMs=null;hostVoiceAttempts=0;attempt++;callOutcome="";options=config;active=true;clerkIndex=0;callPending=false;callTriggered=false;callCommitted=false;callArmTimer=null;clockAnchor=null;registeredName="";number="";activated=false;lastScanId="";queueClock=0;queueIndex=1;ticketWaitCalls=0;deadline=0;ambientClock=0;clerkClock=0;clerkSpeaking=false;clerkAccent=0;clerkBeat="idle";clerkPulse=0;displayNumber("B-041");view.x=0;view.z=8;view.yaw=0;held.clear();resetCharacters();resetOmen();exit.hidden=false;root.hidden=false;mixPanel.hidden=false;document.body.classList.add("amt-inside");options.music?.(true);beginLink();setStage("outside");setStatus("EINGANG · BÜRGERAMT");const owner=attempt;window.BuergeramtClock?.sample?.().then(anchor=>{if(active&&attempt===owner)clockAnchor=anchor}).catch(()=>{})}
function clerkPerformance(){
 const names={idle:0,review:1,raise:2,stamp:3,deny:4,talk:5};
 let mode="idle";
 if(clerkSpeaking)mode="talk";
 else if(clerkAccent>0)mode=clerkBeat;
 else if(["counter","reply","cancelled","early","expired"].includes(stage))mode=stage==="cancelled"||stage==="early"||stage==="expired"?"deny":"review";
 else{const beat=clerkClock%9.2;mode=beat<2.6?"idle":beat<4.1?"review":beat<4.6?"raise":beat<4.95?"stamp":beat<6.1?"deny":"idle"}
 return{row:names[mode],frame:Math.floor(clerkClock*(mode==="talk"?10:4)+clerkPulse)%8,speaking:clerkSpeaking};
}
function captureKey(event){if(event.type==="keyup")held.delete(event.code);if(!active)return;if(event.type==="keydown"&&event.code==="KeyE"&&walking()){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)interact();return}if(!walking()||omen.phase)return;if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(event.type==="keydown")held.add(event.code);else held.delete(event.code)}}
window.addEventListener("keydown",captureKey,true);window.addEventListener("keyup",captureKey,true);window.addEventListener("blur",()=>held.clear());
document.addEventListener("visibilitychange",()=>{if(document.hidden)held.clear();updateOmenTone()});
document.addEventListener("pointermove",event=>{if(active&&walking()&&!omen.phase&&event.buttons===1&&!event.target.closest("button"))view.yaw+=event.movementX*.004});
document.querySelectorAll("[data-amt-key]").forEach(button=>{const key=button.dataset.amtKey;button.addEventListener("pointerdown",e=>{if(!active||!walking()||omen.phase)return;e.preventDefault();button.setPointerCapture(e.pointerId);held.add(key)});for(const type of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(type,()=>held.delete(key))});
document.getElementById("amt-touch-e").addEventListener("click",interact);document.getElementById("amt-leave").addEventListener("click",()=>close());exit.addEventListener("click",()=>close());
window.BuergeramtLevel={open,replay(config){close(false);open(config)},update,interact,setOfficeObstacles(items){officeObstacles=Array.isArray(items)?items.filter(o=>[o.x,o.z,o.w,o.d].every(Number.isFinite)&&o.w>0&&o.d>0):[]},get active(){return active},get stage(){return stage},get queueDisplay(){return queueDisplay},get qrSvg(){return qrSvg},get phoneUrl(){return link?BuergeramtLink.phoneUrl(link.invitation,options.subtitlesOn?.()):""},get timing(){return JSON.parse(JSON.stringify(timing))},get view(){return{x:view.x,z:view.z,yaw:view.yaw}},get characters(){return characters.map(actor=>({id:actor.id,x:actor.x,z:actor.z,direction:actor.direction,mode:actor.mode,phase:characterPhase(actor),frame:Math.min(7,Math.floor(characterPhase(actor)*8))}))},get characterMood(){return characterMood},get clerkPerformance(){return clerkPerformance()},get omen(){return{phase:omen.phase,strength:omen.strength,visit:omen.visit,revealTime:omen.revealTime,life:omenLife(),enabled:options?.cinematics!==false,x:characters[0].x,z:characters[0].z,speech:omen.speech?{...omen.speech}:null}},get registeredName(){return registeredName},get activated(){return activated}};
})();
