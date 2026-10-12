(function(){
"use strict";
const story=window.BuergeramtStory;
const root=document.getElementById("amt-level"),walkHud=document.getElementById("amt-walk-hud");
const speaker=root.querySelector("#amt-speaker"),line=root.querySelector("#amt-line"),actions=root.querySelector("#amt-actions");
const status=root.querySelector("#amt-status");
// Choices belong to the scene HUD; the legacy paper sheet stays hidden.
walkHud.append(actions);actions.setAttribute?.("role","group");actions.setAttribute?.("aria-label","Antwort wählen");
const objective=document.getElementById("amt-objective"),nearby=document.getElementById("amt-nearby"),exit=root.querySelector("#amt-exit"),ambient=document.getElementById("amt-ambient");
const door={x:0,z:5.55},sign={x:0,z:-2.6},counter={x:4,z:-8.15},view={x:0,z:8,yaw:0,walkedDistance:0,positionGeneration:0};
const held=new Set(),pendingTimers=new Set();
const counterXs=[-5.8,-1.6,3.9,6.2];let assignedCounter=0,interactingCounter=0;
const queueCodes=["B-041","Z-7","F-91","A-004","K-002","C-201","H-73","D-008","M-62","E-319","R-5","G-086","W-204","J-17","P-003","N-58"];
const queueCounters=[3,1,4,2],callInterval=3.2,callWindow=callInterval*4;
let ticketQueueIndex=-1;const counterCalls=["—","—","—","—"];
let queueCallPending=-1,queueCallReadyAt=0,queueCallSpeaking=false,queueCallCooldown=0;
function requestFullscreen(){window.GermanyFullscreen?.autoEnter()}
// Every callback belongs to one attempt and one visible speech/action cue.
let attempt=0,cue=0,callOutcome="",speechGateTimer=null,recordedSpeech=null,recordedCleanup=null,officeSpeechBusy=false,sceneContinuation=null;
let phoneSilent=false,phoneWarnings=0,phoneWarningTimer=null,phoneRetryTimer=null,registrationNode="",registrationReply=null,registrationCompleted=false;
const registrationStamps=new Set();
function clearPhonePressure(){if(phoneWarningTimer!==null)clearTimer(phoneWarningTimer);if(phoneRetryTimer!==null)clearTimer(phoneRetryTimer);phoneWarningTimer=phoneRetryTimer=null}
function resetRegistration(){clearPhonePressure();phoneSilent=false;phoneWarnings=0;registrationNode="";registrationReply=null;registrationCompleted=false;registrationStamps.clear()}
const lips=window.GermanyAmtLips.createTrack(()=>visualClock*1000);
let clerkClock=0,clerkSpeaking=false,clerkAccent=0,clerkBeat="idle",clerkPulse=0,floorClock=0,visualClock=0,tempoSentAt=-Infinity,tempoSentRate=null;
const goop=window.BuergeramtGoop;
function timeScale(){return goop.speed(floorClock);}
function applyOfficeTempo(force=false){
 const rate=timeScale();
 if(recordedSpeech){recordedSpeech.playbackRate=rate;recordedSpeech.preservesPitch=false;}
 if(officeAudio){officeAudio.hum.frequency.value=53*rate;for(const source of officeAudio.transients){if(source.amtFrequency)source.frequency.value=source.amtFrequency*rate;else if(source.playbackRate)source.playbackRate.value=rate;}}
 for(const source of callSignalSources){if(source.amtFrequency)source.frequency.value=source.amtFrequency*rate;else if(source.playbackRate)source.playbackRate.value=rate;}
 if(link&&(force||performance.now()-tempoSentAt>=250)&&(force||tempoSentRate===null||Math.abs(rate-tempoSentRate)>.0001)){
  if(link.send('office-tempo',{rate})){tempoSentAt=performance.now();tempoSentRate=rate;}
 }
}
const clerkAnimation=window.BuergeramtAnimationClock?.createClerk?.();
const stationaryClocks={"clerk-desk-1":1.4,"clerk-desk-2":2.2,"clerk-desk-3":.25,"clerk-desk-4":2.8,"amt-konrad-wohnungszettel":0,"amt-mechthild-elternbogen":3.7,"amt-wolfram-rentenbescheid":7.1};
function resetStationaryClocks(){Object.assign(stationaryClocks,{"clerk-desk-1":1.4,"clerk-desk-2":2.2,"clerk-desk-3":.25,"clerk-desk-4":2.8,"amt-konrad-wohnungszettel":0,"amt-mechthild-elternbogen":3.7,"amt-wolfram-rentenbescheid":7.1})}
function defer(callback,delay){const owner=attempt;const id=setTimeout(()=>{pendingTimers.delete(id);if(active&&owner===attempt)callback()},delay);pendingTimers.add(id);return id}
function clearTimer(id){clearTimeout(id);pendingTimers.delete(id)}
function cancelSpeech(){sceneContinuation=null;queueCallSpeaking=false;lips.finish();feverClock?.release();cue++;officeSpeechBusy=false;clerkSpeaking=false;clerkAnimation?.setSpeech(false);if(speechGateTimer!==null)clearTimer(speechGateTimer);speechGateTimer=null;recordedCleanup?.();if(recordedSpeech){recordedSpeech.pause();recordedSpeech.removeAttribute("src");recordedSpeech.load();recordedSpeech=null}try{const engine=window.speechSynthesis;if(!options?.cityAudioActive?.()&&(engine?.speaking||engine?.pending))engine.cancel()}catch{}}
let active=false,stage="closed",link=null,number="",registeredName="",activated=false,qrSvg="",queueDisplay="—",queueIndex=0,queueClock=0,lastScanId="",deadline=0,clerkIndex=0,callPending=false,callTriggered=false,callCommitted=false,callArmTimer=null,clockAnchor=null,policeDoneHandler=null,policeStartHandler=null,policeDisconnectHandler=null,options=null,ambientClock=0,ambientIndex=0,officeAudio=null;
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
function receivePoliceStart(index,mode,readyDelayMs,atMs,atUtcMs=null){const record=timing.cues[index];if(!record||record.status!=="waiting"||record.startedAt!==null||record.doneAt!==null)return false;record.startedAt=performance.now();record.phoneStartedAtMs=atMs;record.clockOffsetMs=timing.lastPongAt!==null&&record.startedAt-timing.lastPongAt<6000?timing.clockOffsetMs:null;record.estimatedStartAt=phoneTime(atMs,record.startedAt,record.clockOffsetMs);record.phoneStartedAtUtcMs=atUtcMs;record.clockDomain=record.clockOffsetMs!==null?"peer":"receipt";if(record.clockOffsetMs===null&&Number.isSafeInteger(atUtcMs)&&window.BuergeramtClock?.usable?.(clockAnchor,record.startedAt)){record.estimatedStartAt=window.BuergeramtClock.monoAt(clockAnchor,atUtcMs);record.clockDomain="utc"}record.startMode=mode;record.readyDelayMs=readyDelayMs;record.startTransportMs=Math.round(record.startedAt-record.sentAt-readyDelayMs);if(readyDelayMs<5000)timing.phoneFastReadyMs=timing.phoneFastReadyMs===null?readyDelayMs:Math.min(timing.phoneFastReadyMs,readyDelayMs);if(index>=0&&index<2&&readyDelayMs<5000)timing.phoneReadyMs=timing.phoneReadyMs===null?readyDelayMs:Math.round(timing.phoneReadyMs*.6+readyDelayMs*.4);timing.startLagMs=phoneStartLag();return true}
function receivePoliceDone(index,mode,durationMs,atMs){const record=timing.cues[index];if(!record||record.doneAt!==null)return false;if(record.status==="timeout"||record.status==="disconnected"){record.lateDoneAt=performance.now();return false}record.doneAt=performance.now();record.phoneEndedAtMs=atMs;if(record.clockOffsetMs===null&&timing.lastPongAt!==null&&record.doneAt-timing.lastPongAt<6000){record.clockOffsetMs=timing.clockOffsetMs;if(record.phoneStartedAtMs!==undefined)record.estimatedStartAt=phoneTime(record.phoneStartedAtMs,record.startedAt,record.clockOffsetMs)}record.estimatedEndAt=phoneTime(atMs,record.doneAt,record.clockOffsetMs);record.durationMs=durationMs;record.mode=mode;const span=record.startedAt===null?null:record.doneAt-record.startedAt;record.errorMs=span===null?null:Math.round(span-durationMs);record.localErrorMs=record.phoneStartedAtMs===undefined?null:Math.round(atMs-record.phoneStartedAtMs-durationMs);record.uncertaintyMs=timing.clockUncertaintyMs;record.receiptJitter=span!==null&&Math.abs(record.errorMs)>Math.max(250,(timing.rttMs??0)+timing.jitterMs+100);record.status=span===null?"missing-start":record.startMode!==mode?"mode-changed":Math.abs(record.localErrorMs)>25?"drift":record.clockOffsetMs===null?"unsynced":"verified";return true}
const ambientLines=story.ambient,ambientBag=[];
const ambientPeople={...story.characters,renter:story.patrons["amt-konrad-wohnungszettel"],parent:story.patrons["amt-mechthild-elternbogen"],pensioner:story.patrons["amt-wolfram-rentenbescheid"],...Object.fromEntries(Object.entries(story.clerks).map(([desk,person])=>["clerk-"+desk,person]))};
let ambientLastVoice="",ambientLastText="";
const ambientKinds=["dialogue","dialogue","paper","stamp","phone","copier"],ambientKindBag=[];
let ambientLastKind="";
function nextAmbientKind(){
 if(!ambientKindBag.length)ambientKindBag.push(...ambientKinds);
 const varied=ambientKindBag.filter(kind=>kind!==ambientLastKind),pool=varied.length?varied:ambientKindBag;
 const kind=pool[Math.floor(Math.random()*pool.length)];ambientKindBag.splice(ambientKindBag.indexOf(kind),1);ambientLastKind=kind;return kind;
}
function nextAmbientLine(){
 if(!ambientBag.length)ambientBag.push(...ambientLines);
 let pool=ambientBag.filter(row=>ambientPeople[row.actor].voiceId!==ambientLastVoice&&row.text!==ambientLastText);
 if(!pool.length){ambientBag.splice(0,ambientBag.length,...ambientLines);pool=ambientBag.filter(row=>ambientPeople[row.actor].voiceId!==ambientLastVoice&&row.text!==ambientLastText)}
 const row=pool[Math.floor(Math.random()*pool.length)];ambientBag.splice(ambientBag.indexOf(row),1);
 ambientLastVoice=ambientPeople[row.actor].voiceId;ambientLastText=row.text;return row;
}
const mix={ambience:.35,voice:.8,fx:.6},mixPanel=document.getElementById("amt-mix");
try{const saved=JSON.parse(localStorage.getItem("amt-mix-v1")||"null");for(const key of Object.keys(mix))if(Number.isFinite(saved?.[key]))mix[key]=Math.max(0,Math.min(1,saved[key]))}catch{}
function applyMix(){if(recordedSpeech)recordedSpeech.volume=mix.voice*(recordedSpeech.amtVolumeScale??1);if(officeAudio){officeAudio.ambience.gain.value=.006*mix.ambience*(1-.92*omen.strength);officeAudio.fx.gain.value=mix.fx;officeAudio.signal.gain.value=mix.fx}}
for(const slider of mixPanel.querySelectorAll("[data-amt-volume]")){const key=slider.dataset.amtVolume;slider.value=String(Math.round(mix[key]*100));slider.addEventListener("input",()=>{mix[key]=Number(slider.value)/100;applyMix();try{localStorage.setItem("amt-mix-v1",JSON.stringify(mix))}catch{}})}
function initOfficeAudio(){
 try{if(options?.cityAudioBusy?.())return null;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio||navigator.userActivation&&!navigator.userActivation.hasBeenActive)return null;
  if(!officeAudio){const ctx=new Audio(),ambience=ctx.createGain(),fx=ctx.createGain(),bus=ctx.createGain(),signal=ctx.createGain(),hum=ctx.createOscillator();hum.type="sine";hum.frequency.value=53*timeScale();ambience.connect(bus);fx.connect(bus);bus.connect(ctx.destination);signal.connect(ctx.destination);hum.connect(ambience);hum.start();officeAudio={ctx,ambience,fx,bus,signal,hum,transients:new Set()};applyMix();officeAudio.omenBuffers=Promise.all(["bed","tension"].map(async name=>{const response=await fetch("assets/audio/buergeramt-omen/"+name+".ogg?v=20261008-frontal-score");if(!response.ok)throw new Error("Omen audio unavailable");return ctx.decodeAudioData(await response.arrayBuffer())})).catch(()=>null)}
  if(officeAudio.ctx.state==="suspended")officeAudio.ctx.resume().catch(()=>{});return officeAudio;
 }catch{return null}
}
function officeCue(id,x,z){if(mix.fx<=0)return;const audio=initOfficeAudio();if(!audio)return;const {ctx,fx}=audio,now=ctx.currentTime;
 const spec=id==="aktenkurier"?[180,.08,.055]:id==="archivbotin"?[1700,.16,.02]:id==="kopiependler"?[1100,.18,.025]:[950,.23,.025];
 const buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*spec[1]),ctx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type="bandpass";filter.frequency.value=spec[0];filter.Q.value=id==="aktenkurier"?.6:1.5;
 gain.gain.value=spec[2]*Math.max(.15,1-Math.hypot(view.x-x,view.z-z)/9);source.playbackRate.value=timeScale();audio.transients.add(source);source.connect(filter).connect(gain).connect(fx);source.onended=()=>{audio.transients.delete(source);source.disconnect();filter.disconnect();gain.disconnect()};source.start(now);
}
let omenTone=null;
function startOmenTone(){
 const audio=initOfficeAudio();if(!audio||omenTone)return;
 const {ctx,fx}=audio,now=ctx.currentTime,output=ctx.createGain(),filter=ctx.createBiquadFilter();
 output.gain.setValueAtTime(0,now);filter.type="lowpass";filter.frequency.value=280;output.connect(filter).connect(fx);
 const tone={ctx,output,filter,voices:[],stems:[],endAt:now+60,rendered:false},owner=attempt;
 const attach=(source,gain)=>{const voice={source,gain,ended:false};tone.voices.push(voice);source.onended=()=>{if(voice.ended)return;voice.ended=true;source.disconnect();gain.disconnect();if(tone.voices.every(item=>item.ended)){output.disconnect();filter.disconnect()}}};
 // The small oscillator bed is also the no-network/no-codec fallback.
 for(const [index,frequency] of [63.7,64.4,95.35,191.1].entries()){
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=["sine","sine","sawtooth","square"][index];osc.amtFrequency=frequency;osc.frequency.value=frequency;gain.gain.value=index===3?.018:.045;osc.connect(gain).connect(output);attach(osc,gain);osc.start(now);osc.stop(tone.endAt);
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
 const semitones=speech?Math.max(-6,Math.min(3,(speech.pitch-1)*4+speech.semitones)):0,ratio=Math.pow(2,semitones/12)*timeScale();
 tone.voices.forEach(({source},index)=>{if(index<4)source.frequency.setTargetAtTime([63.7,64.4,95.35,191.1][index]*ratio,now,.12);else source.playbackRate.setTargetAtTime(ratio,now,.12)});
 if(officeAudio)officeAudio.ambience.gain.setTargetAtTime(.006*mix.ambience*(1-.92*p),now,.04);
}
function stopOmenTone(){
 const tone=omenTone;if(!tone)return;omenTone=null;
 const now=tone.ctx.currentTime;tone.output.gain.cancelScheduledValues(now);tone.output.gain.setValueAtTime(tone.output.gain.value,now);tone.output.gain.linearRampToValueAtTime(0,now+.025);
 for(const voice of tone.voices)if(!voice.ended){try{voice.source.stop(now+.03)}catch{voice.source.onended()}}
}
let feverTone=null;
function startFeverTone(){
 const state=feverClock?.inspect(),audio=initOfficeAudio();if(!state?.active||!audio)return;
 stopFeverTone();const {ctx,fx}=audio,now=ctx.currentTime,output=ctx.createGain(),filter=ctx.createBiquadFilter();
 output.gain.value=0;filter.type="lowpass";filter.frequency.value=380;output.connect(filter).connect(fx);
 const register=[0,58,72,84,49,67,62,91,55,45,77,69,51][state.theme.index];
 const tone={ctx,output,filter,voices:[],id:state.id,cue:state.cue};feverTone=tone;
 for(const [index,ratio] of [1,1.008,1.5].entries()){
  const source=ctx.createOscillator(),gain=ctx.createGain();source.type=index===2?"triangle":"sine";source.frequency.value=register*ratio;gain.gain.value=index===2?.035:.06;
  source.connect(gain).connect(output);const voice={source,gain,frequency:register*ratio,ended:false};tone.voices.push(voice);
  source.onended=()=>{voice.ended=true;source.disconnect();gain.disconnect();if(tone.voices.every(v=>v.ended)){output.disconnect();filter.disconnect()}};
  source.start(now);source.stop(now+112.5);
 }
 updateFeverTone();
}
function updateFeverTone(){
 const state=feverClock?.inspect(),tone=feverTone;if(!tone)return;
 if(!state?.active||state.cue!==tone.cue){stopFeverTone();return}
 // A long pause can outlive the bounded sources. Rebuild only on an owned,
 // visible resume; old sources already disconnected in their end receipts.
 if(tone.voices.every(v=>v.ended)){if(!state.paused&&!document.hidden)startFeverTone();return}
 const now=tone.ctx.currentTime,duck=state.phase==="speaking"?.3:.65;
 for(const voice of tone.voices)if(!voice.ended)voice.source.frequency.setTargetAtTime(voice.frequency*timeScale(),now,.08);
 tone.output.gain.setTargetAtTime(document.hidden||state.paused?0:state.strength*duck,now,.09);
 tone.filter.frequency.setTargetAtTime(280+state.pressure*(700+state.theme.index*95),now,.15);
 if(officeAudio)officeAudio.ambience.gain.setTargetAtTime(.006*mix.ambience*(1-.92*state.strength),now,.09);
}
function stopFeverTone(){
 const tone=feverTone;if(!tone)return;feverTone=null;const now=tone.ctx.currentTime;
 tone.output.gain.cancelScheduledValues(now);tone.output.gain.setValueAtTime(tone.output.gain.value,now);tone.output.gain.linearRampToValueAtTime(0,now+.04);
 for(const voice of tone.voices)if(!voice.ended){try{voice.source.stop(now+.05)}catch{voice.source.onended()}}
 if(officeAudio)officeAudio.ambience.gain.setTargetAtTime(.006*mix.ambience,now,.15);
}
const characterRoutes=[
 {id:"aktenkurier",speed:.75,points:[[-4.8,-7.6],[-4.8,-5.2],[-2.8,-5.2],[-2.8,-7.6]]},
 {id:"archivbotin",speed:.57,points:[[5.5,-7.4],[5.5,-5.2],[3.6,-5.2],[3.6,-7.4]]},
 {id:"formularsammler",speed:.68,points:[[3.4,3.8],[3.4,2.4],[3.4,-.1],[3.4,-2.4]]},
 {id:"nummernfluesterer",speed:.82,points:[[-3.25,4.8],[-3.25,3.6],[-2.65,3.6],[-2.65,4.8]]},
 {id:"nachtschichtmelderin",speed:.72,points:[[5.2,4.8],[6.0,4.8],[6.0,2.7],[5.2,2.7]]},
 {id:"pfandarchitektin",speed:.48,points:[[-.95,2.65],[-.95,.25],[-.15,.25],[-.15,2.65]]},
 {id:"kopiependler",speed:.78,points:[[2.8,-3.25],[4.85,-3.25],[4.85,-2.35],[2.8,-2.35]]},
 {id:"warteschlangenpoetin",speed:.7,points:[[-4.55,-2.25],[-4.55,-3.55],[-5.55,-3.55],[-5.55,-2.25]]}
];
const characters=characterRoutes.map(route=>({id:route.id,route,x:route.points[0][0],z:route.points[0][1],target:1,direction:"up",mode:"work",pause:1.1,stride:0,walkedDistance:0,positionGeneration:0,workClock:0,animationClock:0,returning:null,encounters:0,sequence:[{mode:"work",duration:1.1}],pending:false,priority:0,attention:0}));
let patronEncounters={};
let characterMood=null,encounterArmed=false;
const feverClock=window.BuergeramtFever?.create();
const omen={used:false,phase:"",strength:0,hold:0,elapsed:0,travel:0,path:[],pathIndex:0,roomTime:0,startDistance:0,resume:"walk-sign",resumeYaw:0,recoverFromYaw:0,speech:null,visit:0,revealTime:0,lifeTime:0,lifeClock:0};
const omenTurnSeconds=1.8,omenDepartSeconds=2.2;
const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
function omenLife(){
 const live=["approach","blackout","glare","unwind"].includes(omen.phase),p=live?omen.strength:0,tension=omen.speech?.tension||0;
 const release=omen.phase==="unwind"?ease(1-omen.hold/1.8):0;
 const reverse=omen.phase==="unwind"?1-omen.hold/1.8:0;
 return {time:omen.lifeTime,clock:omen.lifeClock,depth:ease((p-.05)/.95)*(1-ease(reverse/.65)),opacity:ease((p-.08)/.24)*(1-ease((reverse-.65)/.35)),motion:1-ease(reverse/.22),
  isolation:omen.phase==="recover"?ease(omen.hold/1.6):omen.phase?ease(omen.elapsed/.9):0,
  pressure:p*p*(.72+.28*tension)*(1-release),pulse:live?Math.pow(.5+.5*Math.cos(omen.lifeClock*Math.PI*2),8)*(omen.speech?.paused?.15:1)*(1-release):0};
}
const omenSpeechMarks=story.omen.delivery.contour.map(mark=>({...mark,index:story.omen.line.indexOf(mark.word)})).filter(mark=>mark.index>=0);
function updateOmenSpeech(){
 const speech=omen.speech;if(!speech||speech.mode==="waiting")return;
 if(speech.mode==="voice"&&speech.recording&&recordedSpeech&&!speech.paused)speech.mediaTime=recordedSpeech.currentTime;
 if(speech.mode==="done")speech.progress=1;
 else if(!speech.paused&&speech.startedAt!==null&&speech.charIndex<0&&speech.timing!=="recording-cues"){
  speech.progress=Math.min(.92,Math.max(0,(performance.now()-speech.startedAt-speech.pausedMs)/speech.durationMs));
 }
 const index=speech.progress*story.omen.line.length,marks=omenSpeechMarks;
 let left=marks[0],right=marks.at(-1);
 for(let i=1;i<marks.length;i++){if(index<marks[i].index){left=marks[i-1];right=marks[i];break}left=marks[i];right=left}
 const blend=left===right?0:Math.max(0,Math.min(1,(index-left.index)/(right.index-left.index)));
 speech.tension=left.tension+(right.tension-left.tension)*blend;speech.semitones=left.semitones+(right.semitones-left.semitones)*blend;
}
function resetOmen(){stopOmenTone();omen.used=false;omen.phase="";omen.strength=0;omen.hold=0;omen.elapsed=0;omen.travel=0;omen.path=[];omen.pathIndex=0;omen.roomTime=0;omen.speech=null;omen.visit++;omen.revealTime=0;omen.lifeTime=0;omen.lifeClock=0;omen.resumeYaw=view.yaw;omen.recoverFromYaw=view.yaw;applyMix()}
function beginOmen(actor){
 const verse=story.omen;
 omen.phase="blackout";omen.strength=1;omen.revealTime=0;actor.pending=false;actor.sequence=[];actor.priority=4;actor.mode="gesture";actor.workClock=0;
 const speech=omen.speech={mode:"waiting",timing:"estimated",startedAt:null,charIndex:-1,progress:0,paused:false,pausedAt:null,pausedMs:0,tension:0,semitones:0,rate:verse.delivery.rate,pitch:verse.delivery.pitch,durationMs:speechReadableMs(verse.line,verse.delivery)};
 updateOmenTone();
 const delivery={...verse.delivery,onPause:()=>{if(speech.paused)return;updateOmenSpeech();speech.paused=true;speech.pausedAt=performance.now();updateOmenTone()},onResume:()=>{if(speech.paused){speech.pausedMs+=performance.now()-speech.pausedAt;speech.paused=false;speech.pausedAt=null;updateOmenTone()}},onFallback:()=>{speech.mode="fallback";speech.timing="estimated";speech.charIndex=-1;speech.startedAt=performance.now()-speech.progress*speech.durationMs;speech.paused=false;speech.pausedMs=0;speech.pausedAt=null;updateOmenTone()}};
 content(verse.speaker,verse.line,[],()=>{if(omen.phase==="blackout"){speech.mode="done";speech.paused=false;omen.phase="glare";omen.hold=3.4;updateOmenTone()}},(mode,recording)=>{
  speech.mode=mode;if(Number.isFinite(recording?.durationMs)&&recording.durationMs>0)speech.durationMs=recording.durationMs;speech.recording=recording?.recording||null;speech.recordingSha256=recording?.sha256||null;speech.timing=recording?.hasWordCues?"recording-cues":"estimated";speech.mediaTime=0;speech.startedAt=performance.now()-speech.progress*speech.durationMs;updateOmenTone();
 },(charIndex,event)=>{
  if(speech.paused||charIndex<0||charIndex>verse.line.length||charIndex<=speech.charIndex||charIndex/verse.line.length<speech.progress)return;
  speech.charIndex=charIndex;speech.progress=charIndex/verse.line.length;speech.timing=event?.type==="recording-cue"?"recording-cues":"boundary";speech.boundaryAt=performance.now();speech.elapsedTime=Number.isFinite(event?.elapsedTime)?event.elapsedTime:null;updateOmenTone();
 },{id:actor.id,tone:"dread",valence:-.9},delivery);
}
function updateOmen(dt){
 if(omen.phase)omen.elapsed+=dt;
 if(omen.phase==="blackout"||omen.phase==="glare")omen.revealTime+=dt;
 if(["walk-sign","waiting"].includes(stage))omen.roomTime+=dt;
 const actor=characters[0];
 if(options?.cinematics!==false&&window.Germany3D?.amtCinematicReady!==false&&!options?.cityAudioBusy?.()&&!officeSpeechBusy&&!feverClock?.inspect().active&&!omen.used&&omen.roomTime>1.2&&["walk-sign","waiting"].includes(stage)&&Math.hypot(actor.x-view.x,actor.z-view.z)<6.2){
  const path=omenPath(actor);
  if(!path)return; // A blocked room postpones the optional beat, never walks through a solid.
  omen.used=true;omen.phase="approach";omen.elapsed=0;omen.travel=0;omen.path=path;omen.pathIndex=1;omen.resume=stage;omen.resumeYaw=view.yaw;omen.startDistance=path.slice(1).reduce((sum,point,i)=>sum+Math.hypot(point[0]-path[i][0],point[1]-path[i][1]),0);actor.sequence=[];actor.pending=false;actor.returning=null;actor.priority=4;
  cancelSpeech();ambient.textContent="";characterMood=null;speaker.textContent="";line.textContent="";actions.replaceChildren();setStage("omen");setStatus("AKTENLAUF · UNTERBRECHUNG");startOmenTone();
 }
 if(omen.phase&&omen.phase!=="recover"){
  const target=Math.atan2(actor.x-view.x,view.z-actor.z),turn=Math.atan2(Math.sin(target-view.yaw),Math.cos(target-view.yaw));
  view.yaw+=turn*(1-Math.exp(-4*dt));
 }
 if(omen.phase==="approach"){
  omen.strength=Math.max(omen.strength,ease(omen.travel/Math.max(.1,omen.startDistance)));
 }else if(omen.phase==="glare"){omen.hold-=dt;if(omen.hold<=0){
  omen.phase="unwind";omen.hold=1.8;
 }}
 else if(omen.phase==="unwind"){
  omen.hold=Math.max(0,omen.hold-dt);
  if(omen.hold===0){omen.phase="turn";omen.hold=omenTurnSeconds;stopOmenTone();actor.mode="turn";actor.workClock=0;
   actor.omenReturn=[...omen.path.slice(0,omen.pathIndex)].reverse();
   actor.target=actor.route.points.reduce((best,point,index)=>Math.hypot(actor.x-point[0],actor.z-point[1])<Math.hypot(actor.x-actor.route.points[best][0],actor.z-actor.route.points[best][1])?index:best,0);
   speaker.textContent="";line.textContent="";ambient.textContent="";
  }
 }
 else if(omen.phase==="turn"){
  omen.hold=Math.max(0,omen.hold-dt);const progress=1-omen.hold/omenTurnSeconds;actor.direction=progress<.25?"down":progress<.75?"right":"up";
  if(omen.hold===0){omen.phase="depart";omen.hold=omenDepartSeconds;actor.mode="walk"}
 }
 else if(omen.phase==="depart"){
  omen.hold=Math.max(0,omen.hold-dt);
  if(omen.hold===0){omen.phase="recover";omen.hold=1.6;omen.recoverFromYaw=view.yaw}
 }
 else if(omen.phase==="recover"){
  omen.hold=Math.max(0,omen.hold-dt);
  omen.strength=ease(omen.hold/1.6);
  const turn=Math.atan2(Math.sin(omen.resumeYaw-omen.recoverFromYaw),Math.cos(omen.resumeYaw-omen.recoverFromYaw));view.yaw=omen.recoverFromYaw+turn*ease(1-omen.hold/1.6);
  if(omen.hold===0){omen.phase="";actor.priority=0;actor.attention=8;applyMix();setStage(omen.resume);setStatus("VORGANG FORTSETZEN · "+queueDisplay)}
 }
 if(["approach","blackout","glare","unwind"].includes(omen.phase)&&!omen.speech?.paused){
  omen.lifeTime+=dt;omen.lifeClock+=dt*(.65+2.1*omen.strength+.35*(omen.speech?.tension||0));
 }
 if(["approach","blackout","glare"].includes(omen.phase)&&!omen.speech?.paused){
  omen.lifeTime+=dt;omen.lifeClock+=dt*(.65+2.1*omen.strength+.35*(omen.speech?.tension||0));
 }
 updateOmenTone();
}
function approachOmen(actor,dt){
 if(omen.elapsed<.9){actor.mode="look";return}
 if(omen.pathIndex>=omen.path.length){beginOmen(actor);return}
 const point=omen.path[omen.pathIndex],distance=Math.hypot(point[0]-actor.x,point[1]-actor.z);
 const moved=moveOmenActor(actor,point,.78*dt);omen.travel+=moved;
 if(moved===0&&distance>1e-8){
  const path=omenPath(actor);
  if(!path){omen.phase="recover";omen.hold=1.6;omen.recoverFromYaw=view.yaw;stopOmenTone();return}
  const prefix=omen.path.slice(0,omen.pathIndex);omen.path=prefix.concat(path);omen.pathIndex=prefix.length+1;
  omen.startDistance=omen.travel+path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
  return;
 }
 if(moved>=distance-1e-8)omen.pathIndex++;
}
function moveOmenActor(actor,point,budget,avoidPlayer=false){
 const dx=point[0]-actor.x,dz=point[1]-actor.z,distance=Math.hypot(dx,dz),step=Math.min(distance,budget);
 if(distance<1e-8)return 0;
 const x=actor.x+dx/distance*step,z=actor.z+dz/distance*step;
 if(!omenSegmentClear([actor.x,actor.z],[x,z],actor,avoidPlayer)){actor.mode="look";return 0}
 actor.x=x;actor.z=z;actor.heading=Math.atan2(dx,dz);actor.stride+=step*8.5;actor.walkedDistance+=step;actor.mode="walk";
 actor.direction=Math.abs(dx)>Math.abs(dz)?dx>0?"right":"left":dz>0?"down":"up";return step;
}
function returnOmenActor(actor,dt){
 const point=actor.omenReturn[0];
 if(!point){actor.omenReturn=null;return}
 const distance=Math.hypot(point[0]-actor.x,point[1]-actor.z),speed=omen.phase==="depart"?.60*(.5+.5*ease(1-omen.hold/omenDepartSeconds)):.75;
 const moved=moveOmenActor(actor,point,speed*dt,true);
 if(moved>=distance-1e-8){actor.omenReturn.shift();actor.omenBlocked=0}
 else if(moved>0)actor.omenBlocked=0;
 else if((actor.omenBlocked=(actor.omenBlocked||0)+dt)>.4){
  actor.omenBlocked=0;
  let target=actor.omenReturn.at(-1);
  if(officeBlocked(target[0],target[1],actor,.12))target=actor.route.points.find(p=>!officeBlocked(p[0],p[1],actor,.12));
  const path=target&&omenPath(actor,{x:target[0],z:target[1]},true);
  if(path)actor.omenReturn=path.slice(1); // Otherwise hold a planted pose and retry a bounded search.
 }
}
// The authored beat selects a reachable planted stop through the shared office graph.
function omenPath(actor,target=view,exact=false){
 if(exact){const route=officePath(actor,target.x,target.z,true);return route.length?[[actor.x,actor.z],...route]:null}
 const points=Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8;return [target.x+Math.sin(angle)*1.75,target.z+Math.cos(angle)*1.75]});
 points.sort((a,b)=>Math.hypot(a[0]-actor.x,a[1]-actor.z)-Math.hypot(b[0]-actor.x,b[1]-actor.z));
 for(const [x,z] of points){if(officeSolidBlocked(x,z,officeCharacterRadius))continue;const route=officePath(actor,x,z,true,true,1.68);if(route.length)return [[actor.x,actor.z],...route]}
 return null;
}
function omenSegmentClear(a,b,actor,avoidPlayer=false){
 return officeSegmentClear(...a,...b,officeCharacterRadius)&&officeCirclesClear(...a,...b,officePeople(actor,true,avoidPlayer?1.05:1.68));
}
function resetCharacters(){for(const actor of characters){actor.x=actor.route.points[0][0];actor.z=actor.route.points[0][1];actor.target=1;actor.direction="up";actor.heading=Math.PI;actor.path=[];actor.pathGoal="";actor.blockedTime=0;actor.velocity=[0,0];recoverOfficeBody(actor,officeCharacterRadius);actor.mode="work";actor.pause=1.1;actor.stride=0;actor.walkedDistance=0;actor.workClock=0;actor.animationClock=0;actor.returning=null;actor.omenReturn=null;actor.encounters=0;actor.sequence=[{mode:"work",duration:1.1}];actor.pending=false;actor.priority=0;actor.attention=0}characterMood=null}
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
function characterAnimation(actor){
 if(!["work","gesture"].includes(actor.mode))return null;
 if(actor.mode==="work")return{generation:attempt,actionId:Math.floor(actor.animationClock/4)+1,arc:null,phase:1,pose:"work"};
 const phase=(actor.animationClock%4)/4;
 return{generation:attempt,actionId:Math.floor(actor.animationClock/4)+1,arc:"work-gesture-work",phase,pose:phase>=.25&&phase<.75?"gesture":"work"};
}
function advanceAction(actor,dt){
 if(actor.returning){
  if(document.hidden)return true;
  const turn=actor.returning,limit=turn.direction<0?0:1;
  turn.phase=Math.max(0,Math.min(1,turn.phase+turn.direction*dt/4));
  actor.animationClock=turn.phase*4;
  if(Math.abs(turn.phase-limit)>1e-9)return true;
  actor.returning=null;actor.animationClock=0;actor.priority=1;
  if(actor.sequence.length)startAction(actor);
  return true;
 }
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
 if(dt<=1e-9)return;
 for(const actor of characters){
  actor.attention=Math.max(0,actor.attention-dt);
  if(actor.id==="aktenkurier"&&omen.phase==="approach"){approachOmen(actor,dt);continue}
  if(actor.omenReturn&&["depart","recover",""].includes(omen.phase)){returnOmenActor(actor,dt);continue}
  if(!walking()){if(actor.mode==="gesture"&&actor.priority>=3){actor.workClock+=dt;if(!document.hidden)actor.animationClock+=dt}continue}
  actor.workClock+=dt;
  if(!document.hidden&&["work","gesture"].includes(actor.mode))actor.animationClock+=dt;
  if(advanceAction(actor,dt)){if(actor.blockedTime>0)actor.blockedTime+=dt;continue}
  if(actor.mode==="gesture")continue;
  const [tx,tz]=actor.route.points[actor.target],dx=tx-actor.x,dz=tz-actor.z,distance=Math.hypot(dx,dz);
  if(distance<1e-8){actor.target=(actor.target+1)%actor.route.points.length;action(actor,[["work",1.25],["look",.48]],1);continue}
  const oldLoop=Math.floor(actor.stride/8);
  if(!moveOfficeCharacter(actor,tx,tz,actor.route.speed*dt,dt)){if(!actor.pending)actor.sequence=[{mode:"work",duration:.35}];actor.pending=false;startAction(actor);continue}
  if(actor.pending&&Math.floor(actor.stride/8)>oldLoop){actor.pending=false;startAction(actor)}
  if(actor.attention===0&&Math.hypot(actor.x-view.x,actor.z-view.z)<2.5){actor.attention=7.5;action(actor,[["look",.72],["work",.4]],1)}
 }
}
function nearestCharacter(){if(!["walk-sign","waiting"].includes(stage))return null;let found=null,distance=1.65;for(const actor of characters){if(actor.id==="aktenkurier"||actor.returning)continue;const d=Math.hypot(view.x-actor.x,view.z-actor.z);if(d<distance){found=actor;distance=d}}for(const [id,patron] of Object.entries(story.patrons)){const d=Math.hypot(view.x-patron.x,view.z-patron.z);if(d<distance){found={id,x:patron.x,z:patron.z,static:true};distance=d}}return found}
function showCharacter(actor){
 encounterArmed=true;
 const entry=actor.static?story.patrons[actor.id]:story.characters[actor.id],index=actor.static?(patronEncounters[actor.id]||0):actor.encounters++,spoken=entry.lines[index%entry.lines.length],resume=stage;
 if(actor.static){patronEncounters[actor.id]=index+1;setStage("character");content(entry.speaker,spoken.line,[{run:()=>setStage(activated?"waiting":resume)}],null,null,null,{id:actor.id,tone:spoken.tone,valence:spoken.valence});return}
 actor.pending=false;actor.sequence=[];actor.priority=3;actor.mode="gesture";actor.workClock=0;actor.animationClock=0;actor.returning=null;setStage("character");content(entry.speaker,spoken.line,[{run:()=>{
  const phase=(actor.animationClock%4)/4;actor.returning={phase,direction:phase<.5?-1:1};actor.sequence=[{mode:"look",duration:.45},{mode:"work",duration:.7}];actor.pending=false;
  setStage(activated?"waiting":resume);
 }}],null,null,null,{id:actor.id,tone:spoken.tone,valence:spoken.valence});
}
function walking(){return ["outside","walk-sign","waiting","walk-counter"].includes(stage)}
function setStage(next,preserveMovement=false){if(next!==stage&&!preserveMovement)held.clear();stage=next;document.body.classList.toggle("amt-omen",next==="omen");const moving=walking(),sequence=!moving&&next!=="closed";if(!moving)queueCallPending=-1;document.body.classList.toggle("amt-sequence",sequence);if(moving){actions.replaceChildren();interactingCounter=0;encounterArmed=false;cancelSpeech();clerkAnimation?.request(null);ambient.textContent="";characterMood=null;}root.classList.toggle("walking",moving);walkHud.classList.toggle("sequence",sequence);walkHud.hidden=next==="closed";root.classList.toggle("first-person",!!window.Germany3D?.ready);if(moving){objective.textContent=next==="outside"?"BÜRGERAMT · EINGANG":next==="walk-sign"?"QR-SCHILD SCANNEN":"AUFRUFTAFEL";update(0)}}
function displayNumber(value,desk){queueDisplay=value;counterCalls[desk-1]=value}
function nearestCounter(){let found=0,distance=1.9;for(let i=0;i<counterXs.length;i++){const d=Math.hypot(view.x-counterXs[i],view.z-counter.z);if(d<distance){found=i+1;distance=d}}return found}
function queueStage(){return activated?(deadline>0?"walk-counter":"waiting"):"walk-sign"}
function refuseCounter(desk){interactingCounter=desk;encounterArmed=true;setStage("early");content(story.clerks[desk].speaker+" · SCHALTER "+desk,story.clerkRefusal,[{run:()=>setStage(queueStage())}]);setStatus("FALSCHER AUFRUF · "+queueDisplay)}
function speechReadableMs(text,delivery){return delivery?.readableMs??Math.max(3500,Math.min(14000,text.length*55*.96/(delivery?.rate??.96)))}
function say(text,onComplete,onStart,onBoundary,delivery=null,voiceId="",allowCatalogClip=true){
 delivery={...window.BuergeramtVoiceProfiles?.deliveryFor(voiceId),...delivery};
 const owner=attempt,visibleCue=cue,readableMs=speechReadableMs(text,delivery)/timeScale();
 const current=()=>active&&owner===attempt&&visibleCue===cue&&(delivery.isCurrent?delivery.isCurrent():line.textContent===text);
 const begin=()=>{
  if(!current())return;
  const catalog=window.GermanySimulatorAudioText;
  const candidate=allowCatalogClip&&options?.voiceOn?.()&&(catalog?.recordedClip?.(voiceId,text)||catalog?.candidateClip?.(voiceId,text));
  if(candidate){
   try{
    const clip=catalog.recordings?.[candidate],mediaUrl=/^[a-f0-9]{64}$/.test(clip?.sha256||"")?candidate+(candidate.includes("?")?"&":"?")+"v="+clip.sha256:candidate;
    const player=new Audio(mediaUrl);officeSpeechBusy=true;recordedSpeech=player;player.amtVolumeScale=delivery.volumeScale??1;player.volume=mix.voice*player.amtVolumeScale;player.playbackRate=timeScale();player.preservesPitch=false;
    const marks=clip?.wordCues||[],startupMs=voiceId==="amt-brunhilde-knick"?4000:1800;
    let started=false,settled=false,paused=false,hiddenPaused=false,nextMark=0,watchdog=null,due=0,remaining=20000,lastProgressTime=0,playAttempt=0,mouthBinding=null,mouthReady=!window.GermanyAmtLips?.loadRecording;
    const clearWatchdog=()=>{if(watchdog!==null)clearTimer(watchdog);watchdog=null};
    const arm=(milliseconds,callback)=>{clearWatchdog();due=performance.now()+milliseconds;watchdog=defer(callback,milliseconds)};
    const cleanup=()=>{playAttempt++;clearWatchdog();document.removeEventListener("visibilitychange",visibility);if(recordedCleanup===cleanup)recordedCleanup=null};
    const progress=()=>{if(!started||settled||paused||!current())return;const mediaTime=Number(player.currentTime);if(Number.isFinite(mediaTime)&&mediaTime>lastProgressTime){lastProgressTime=mediaTime;remaining=20000;arm(remaining,stalled)}while(nextMark<marks.length&&marks[nextMark].at<=player.currentTime){const mark=marks[nextMark++];onBoundary?.(mark.charIndex,{type:"recording-cue",elapsedTime:player.currentTime})}};
    const finish=()=>{if(settled||!current())return;if(!started)start();settled=true;lips.finish();clerkSpeaking=false;clerkAnimation?.setSpeech(false);cleanup();recordedSpeech=null;officeSpeechBusy=false;onComplete?.("voice")};
    const fallback=()=>{if(settled||!current())return;if(document.hidden){clearWatchdog();hiddenPaused=true;return}settled=true;lips.start("fallback");cleanup();player.pause();player.removeAttribute("src");player.load();recordedSpeech=null;officeSpeechBusy=false;delivery?.onFallback?.();say(text,onComplete,onStart,onBoundary,delivery,voiceId,false)};
    const stalled=()=>{const previous=lastProgressTime;progress();if(lastProgressTime===previous)fallback()};
    const start=()=>{if(settled||!current())return;if(!started){started=true;lastProgressTime=Number(player.currentTime)||0;lips.start("voice",player,mouthBinding);remaining=Math.max(20000,Number.isFinite(player.duration)?player.duration*1000+2000:20000);onStart?.("voice",{durationMs:player.duration*1000,recording:candidate,sha256:clip?.sha256,hasWordCues:marks.length>0})}else if(paused){paused=false;delivery?.onResume?.()}arm(remaining,stalled);progress();if(document.hidden)visibility()};
    const play=()=>{if(!mouthReady)return;if(!started)arm(startupMs,fallback);const serial=++playAttempt;player.play().catch(()=>{if(serial===playAttempt&&!document.hidden)fallback()})};
    const visibility=()=>{if(settled||!current())return;if(document.hidden){playAttempt++;clearWatchdog();if(!player.paused){hiddenPaused=true;player.pause()}}else{if(!started)arm(mouthReady?startupMs:20000,fallback);if(hiddenPaused){hiddenPaused=false;play()}}};
    player.onplaying=start;player.onended=finish;player.onerror=fallback;player.ontimeupdate=progress;
    player.onpause=()=>{if(!started||settled||paused||!current())return;paused=true;remaining=Math.max(0,due-performance.now());clearWatchdog();delivery?.onPause?.()};
    recordedCleanup=cleanup;document.addEventListener("visibilitychange",visibility);arm(20000,fallback);
    // Bind the unchanged MP3's analysis before its first sound. Late imports
    // cannot start a cancelled cue or replace a newer speaker's articulation.
    const loadMouth=window.GermanyAmtLips?.loadRecording;
    const bind=binding=>{if(!settled&&current()){mouthBinding=binding;mouthReady=true;if(document.hidden){hiddenPaused=true;clearWatchdog()}else play()}};
    if(loadMouth){const loaded=loadMouth(candidate,clip?.sha256);if(loaded?.then)loaded.catch(()=>null).then(bind);else bind(loaded)}
    else play();return;
   }catch{recordedSpeech=null;officeSpeechBusy=false}
  }
  const requestedAt=performance.now();let settled=false,fallback=null,started=false,failed=false,paused=false,completionDue=0,completionRemaining=0,mode="fallback";
 const start=kind=>{if(!started&&current()){started=true;mode=kind;lips.start(kind);onStart?.(kind)}};
 const complete=()=>{if(settled||!current())return;start("fallback");settled=true;lips.finish();clerkSpeaking=false;clerkAnimation?.setSpeech(false);officeSpeechBusy=false;if(fallback!==null)clearTimer(fallback);onComplete?.(mode)};
 const fallbackPolicy=delivery.fallback??window.GermanySimulatorAudioText?.productionVoices?.[voiceId]?.fallback??(Object.values(story.clerks).some(person=>person.voiceId===voiceId)?"captions":"browser");
 const voiced=fallbackPolicy!=="captions"&&options?.voiceOn?.()&&window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function";
 const beginFallback=()=>{if(settled||failed||!current())return;failed=true;officeSpeechBusy=false;mode="fallback";lips.start("fallback");if(fallback!==null)clearTimer(fallback);try{if(speechSynthesis.speaking||speechSynthesis.pending)speechSynthesis.cancel()}catch{}start("fallback");delivery?.onFallback?.();if(onComplete)fallback=defer(complete,readableMs)};
 if(onComplete||onStart){if(voiced){const limit=hostVoiceStartupMs===null?(hostVoiceAttempts===0?1800:1200):Math.max(900,Math.min(1800,Math.round(hostVoiceStartupMs*2+250)));hostVoiceAttempts++;fallback=defer(beginFallback,limit)}else if(onComplete)fallback=defer(complete,readableMs)}
 if(!voiced){start("fallback");return}
 officeSpeechBusy=true;
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=(delivery?.rate??.96)*timeScale();utterance.pitch=(delivery?.pitch??1)*timeScale();utterance.volume=mix.voice*(delivery.volumeScale??1);
 utterance.onstart=()=>{if(!current()||settled||failed)return;start("voice");if(onComplete||onStart){const lag=Math.max(0,performance.now()-requestedAt);hostVoiceStartupMs=hostVoiceStartupMs===null?lag:Math.round(hostVoiceStartupMs*.6+lag*.4)}if(fallback!==null)clearTimer(fallback);if(onComplete){completionRemaining=Math.max(20000,text.length*120)/.4;completionDue=performance.now()+completionRemaining;fallback=defer(complete,completionRemaining)}};
 utterance.onboundary=event=>{if(current()&&started&&!settled&&!failed&&Number.isInteger(event.charIndex)){lips.boundary(event.charIndex);onBoundary?.(event.charIndex,event)}};
 utterance.onpause=()=>{if(!current()||!started||settled||failed||paused)return;paused=true;lips.pause();if(onComplete&&fallback!==null){completionRemaining=Math.max(0,completionDue-performance.now());clearTimer(fallback);fallback=null}delivery?.onPause?.()};
 utterance.onresume=()=>{if(!current()||!started||settled||failed||!paused)return;paused=false;lips.resume();if(onComplete){completionDue=performance.now()+completionRemaining;fallback=defer(complete,completionRemaining)}delivery?.onResume?.()};
 utterance.onend=()=>{if(!failed)complete()};utterance.onerror=beginFallback;
 requestAnimationFrame(()=>{if(current()&&!settled){try{speechSynthesis.speak(utterance)}catch{utterance.onerror()}}});
 };
 const waitForCity=()=>{if(!current())return;if(options?.cityAudioBusy?.()){speechGateTimer=defer(waitForCity,40);return}speechGateTimer=null;begin()};
 waitForCity();
}
function content(who,text,buttons=[],onComplete,onStart,onBoundary,mood=null,delivery=null){
 const clerk=Object.values(story.clerks).find(person=>who===person.speaker||who.startsWith(person.speaker+" ·"))||(who.includes("KNICK")||who==="ANMELDESCHALTER"?story.clerkIdentity:null),isClerk=!!clerk;
 cancelSpeech();speaker.textContent=who;line.textContent=text;ambient.textContent="";
 characterMood=isClerk?{id:"clerk",tone:stage==="cancelled"||stage==="early"||stage==="expired"?"warning":"procedural",valence:stage==="cancelled"?-.82:-.38}:mood;
 lips.prepare(isClerk?"clerk":mood?.id||null,text,delivery?.rate);
 actions.replaceChildren();
 actions.classList.toggle("side-choices",buttons.length===2);
 if(isClerk){clerkBeat=stage==="reply"?"stamp":stage==="cancelled"||stage==="early"||stage==="expired"?"deny":"raise";clerkAccent=.4;clerkPulse=0;clerkAnimation?.request(stage==="reply"?"contact":["cancelled","early","expired"].includes(stage)?"refusal":"raised")}
 const owner=attempt,visibleCue=cue;
 // The first authored response preserves the A38 route without a question
 // panel. Speech completion and the shared fade own each automatic continuation.
 const interactive=buttons.some(item=>!!item.label);
 if(interactive)for(const item of buttons){const button=document.createElement("button");button.type="button";button.textContent=item.label;button.disabled=stage==="counter"&&!!registrationNode||stage==="success";button.addEventListener("click",()=>{if(!active||owner!==attempt||visibleCue!==cue||button.disabled)return;button.disabled=true;item.run()});actions.append(button)}
 root.classList.toggle("interactive",interactive);
 const waitForFade=["character","early","expired"].includes(stage)||stage==="reply"&&clerkIndex===story.clerk.length-1;
 const continuation=onComplete||!interactive&&buttons[0]&&(()=>{sceneContinuation={owner,cue:visibleCue,run:buttons[0].run,waitForFade,hold:waitForFade ? .25 : 0}})||null;
 const completed=interactive?mode=>{for(const button of actions.children)button.disabled=false;continuation?.(mode)}:continuation;
 const voiceId=who===story.playerIdentity.speaker?story.playerIdentity.voiceId:clerk?.voiceId||story.characters[mood?.id]?.voiceId||story.patrons[mood?.id]?.voiceId||"";
 const fever=who!=="ICH"&&encounterArmed&&!omen.phase&&options?.cinematics!==false&&feverClock?.begin({id:characterMood?.id,text,cue,generation:attempt,durationMs:speechReadableMs(text,delivery)});
 const currentFever=()=>fever&&active&&owner===attempt&&visibleCue===cue&&feverClock.inspect().cue===visibleCue;
 const hooks=fever?{...delivery,onPause:()=>{if(currentFever())feverClock.pause();delivery?.onPause?.();updateFeverTone()},onResume:()=>{if(currentFever())feverClock.resume();delivery?.onResume?.();updateFeverTone()},onFallback:()=>{if(currentFever())feverClock.fallback();delivery?.onFallback?.()}}:delivery;
 say(text,completed||fever?mode=>{if(isClerk){clerkSpeaking=false;clerkAnimation?.setSpeech(false);clerkBeat=stage==="reply"?"stamp":stage==="cancelled"?"deny":"review";clerkAccent=.65}if(currentFever())feverClock.done();completed?.(mode)}:null,(mode,recording)=>{ambient.textContent=(clerk?clerk.speaker.replace(/^SACHBEARBEITERIN /,""):who)+" · "+text;if(currentFever()){feverClock.start(mode,recording);startFeverTone()}if(isClerk){clerkSpeaking=mode==="voice";clerkPulse=0;clerkAnimation?.setSpeech(true,0);if(!completed&&!fever){const speakingCue=cue;defer(()=>{if(cue===speakingCue){clerkSpeaking=false;clerkAnimation?.setSpeech(false);clerkBeat="review";clerkAccent=.65}},Math.max(1800,Math.min(10000,text.length*55)))}}onStart?.(mode,recording)},(charIndex,event)=>{if(currentFever())feverClock.boundary(charIndex,event);if(isClerk){clerkPulse++;clerkAnimation?.setSpeech(clerkSpeaking,clerkPulse)}onBoundary?.(charIndex,event)},hooks,voiceId);
}
function setStatus(text){status.textContent=text}
function distanceTo(target){return Math.hypot(view.x-target.x,view.z-target.z)}
function nearbyTarget(){if(stage==="outside")return door;if(stage==="walk-sign")return sign;return counter}
const officeSeats=[[-5.9,1.7],[-2.1,1.7],[1.7,1.7],[5.5,1.7],[-5.9,-1.1],[-2.1,-1.1],[1.7,-1.1],[5.5,-1.1]];
const officeCharacterRadius=.34,officePlayerRadius=.22;
const officeFurniture=[
 {x:0,z:-9.03,w:14.7,d:1.21},{x:0,z:-4.22,w:2.8,d:.16},
 {x:-4.65,z:.8,w:1.5,d:.58},
 ...[-6.8,6.8].map(x=>({x,z:-4.65,w:.48,d:.4})),
 ...[-4.2,4.3].map(x=>({x,z:3.6,w:.86,d:.24})),
 ...[-4.525,4.525].map(x=>({x,z:5.55,w:6.35,d:.16})),
 ...officeSeats.map(([x,z])=>({x,z,w:.9,d:.76}))
];
let officeObstacles=[],officeSolids=officeFurniture,officeNavigation=null;
function officeSolidBlocked(x,z,radius){
 return Math.abs(x)>7.62-radius||z< -10.37+radius||z>8.65-radius||
  officeSolids.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
}
function officeSegmentClear(ax,az,bx,bz,radius,solids=officeSolids){
 if(officeSolidBlocked(bx,bz,radius))return false;
 for(const o of solids){
  let enter=0,leave=1;
  for(const [start,delta,min,max] of [[ax,bx-ax,o.x-o.w/2-radius,o.x+o.w/2+radius],[az,bz-az,o.z-o.d/2-radius,o.z+o.d/2+radius]]){
   if(Math.abs(delta)<1e-10){if(start<=min||start>=max){enter=2;break}}
   else {const a=(min-start)/delta,b=(max-start)/delta;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b))}
  }
  if(enter<leave&&leave>0&&enter<1)return false;
 }
 return true;
}
function recoverOfficeBody(body,radius){
 if(!officeSolidBlocked(body.x,body.z,radius))return;
 const x=Math.max(-7.62+radius,Math.min(7.62-radius,body.x)),z=Math.max(-10.37+radius,Math.min(8.65-radius,body.z));
 const candidates=[[x,z]];
 for(const o of officeSolids)if(Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius){
  candidates.push([o.x-o.w/2-radius-.005,z],[o.x+o.w/2+radius+.005,z],[x,o.z-o.d/2-radius-.005],[x,o.z+o.d/2+radius+.005]);
 }
 candidates.sort((a,b)=>Math.hypot(a[0]-body.x,a[1]-body.z)-Math.hypot(b[0]-body.x,b[1]-body.z));
 const legal=candidates.find(([cx,cz])=>!officeSolidBlocked(cx,cz,radius)&&officeSolids.every(o=>
  Math.abs(body.x-o.x)<o.w/2+radius&&Math.abs(body.z-o.z)<o.d/2+radius||officeSegmentClear(body.x,body.z,cx,cz,radius,[o])));
 if(legal){body.x=legal[0];body.z=legal[1];body.positionGeneration=(body.positionGeneration||0)+1}
}
function officeCorners(solids){
 const nodes=[];
 for(const o of solids)for(const x of [o.x-o.w/2-officeCharacterRadius-.015,o.x+o.w/2+officeCharacterRadius+.015])
  for(const z of [o.z-o.d/2-officeCharacterRadius-.015,o.z+o.d/2+officeCharacterRadius+.015])
   if(!officeSolidBlocked(x,z,officeCharacterRadius))nodes.push([x,z]);
 return nodes;
}
function officePeople(actor,avoidPlayer=true,playerGap=1.05){
 return [...characters.filter(other=>other!==actor).map(other=>({x:other.x,z:other.z,r:omen.phase?.84:.69})),...(avoidPlayer?[{x:view.x,z:view.z,r:playerGap}]:[])];
}
function officeCirclesClear(ax,az,bx,bz,circles){
 const dx=bx-ax,dz=bz-az,length=dx*dx+dz*dz;
 return circles.every(other=>{
  const before=Math.hypot(ax-other.x,az-other.z),after=Math.hypot(bx-other.x,bz-other.z);
  const t=length?Math.max(0,Math.min(1,((other.x-ax)*dx+(other.z-az)*dz)/length)):0;
  // A newly occupied start may leave an overlap only along an outward segment.
  if(before<other.r-1e-9)return after>before&&t===0;
  return Math.hypot(ax+dx*t-other.x,az+dz*t-other.z)>=other.r-1e-9;
 });
}
function officePath(actor,tx,tz,crowd=false,avoidPlayer=true,playerGap=1.05){
 if(!officeNavigation){
  const nodes=officeCorners(officeSolids),edges=nodes.map(a=>nodes.map(b=>officeSegmentClear(...a,...b,officeCharacterRadius)));
  officeNavigation={nodes,edges};
 }
 const circles=crowd?officePeople(actor,avoidPlayer,playerGap):[],around=[];
 // Predict briefly from accepted travel so a passing route does not cut back
 // into a moving person's next position. Only current bodies block movement.
 if(crowd&&!omen.phase)for(const other of characters)if(other!==actor&&other.mode==="walk"&&other.velocity){
  const [vx,vz]=other.velocity,speed=Math.hypot(vx,vz),lead=Math.min(2.5,1.2/Math.max(.001,speed));
  if(speed>.05)circles.push({x:other.x+vx*lead,z:other.z+vz*lead,r:.69});
 }
 // Use the same circular people envelopes for planning and accepted movement.
 // Sixteen tangent-clear samples also permit escape from close diagonal contact.
 const dx=tx-actor.x,dz=tz-actor.z,length=dx*dx+dz*dz;
 const nearby=circles.filter(c=>{const t=length?Math.max(0,Math.min(1,((c.x-actor.x)*dx+(c.z-actor.z)*dz)/length)):0;return Math.hypot(c.x-actor.x-dx*t,c.z-actor.z-dz*t)<c.r+1.2});
 for(const c of nearby)for(let i=0;i<16;i++){
  const angle=i*Math.PI/8,r=c.r/Math.cos(Math.PI/16)+.015;
  const x=c.x+Math.sin(angle)*r,z=c.z+Math.cos(angle)*r;
  if(!officeSolidBlocked(x,z,officeCharacterRadius))around.push([x,z]);
 }
 // ponytail: one small visibility graph shared by patrols and the authored omen.
 const nodes=[[actor.x,actor.z],[tx,tz],...officeNavigation.nodes,...around],staticEnd=officeNavigation.nodes.length+2,cost=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set();cost[0]=0;
 while(visited.size<nodes.length){
  let current=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||cost[i]<cost[current]))current=i;
  if(current<0||!Number.isFinite(cost[current]))break;
  if(current===1){const path=[];for(let i=1;i>0;i=previous[i])path.unshift(nodes[i]);return path}
  visited.add(current);
  for(let i=1;i<nodes.length;i++)if(!visited.has(i)&&(current>=2&&current<staticEnd&&i>=2&&i<staticEnd?officeNavigation.edges[current-2][i-2]:officeSegmentClear(...nodes[current],...nodes[i],officeCharacterRadius))&&officeCirclesClear(...nodes[current],...nodes[i],circles)){
   const side=(nodes[i][0]-actor.x)*-(tz-actor.z)+(nodes[i][1]-actor.z)*(tx-actor.x);
   const next=cost[current]+Math.hypot(nodes[i][0]-nodes[current][0],nodes[i][1]-nodes[current][1])+(current===0&&crowd&&side<0?.025:0);
   if(next<cost[i]){cost[i]=next;previous[i]=current}
  }
 }
 return [];
}
function officePeopleClear(actor,x,z,avoidPlayer=true){
 return officeCirclesClear(actor.x,actor.z,x,z,officePeople(actor,avoidPlayer));
}
function moveOfficeCharacter(actor,tx,tz,budget,dt){
 if(budget<=0)return false;
 if(Math.hypot(tx-actor.x,tz-actor.z)<1e-9){actor.blockedTime=0;actor.velocity=[0,0];actor.mode="work";return false}
 const goal=tx.toFixed(3)+":"+tz.toFixed(3);
 if(actor.pathGoal!==goal||!actor.path){
  const people=officePeople(actor),separated=people.every(p=>Math.hypot(actor.x-p.x,actor.z-p.z)>=p.r);
  const direct=officeSegmentClear(actor.x,actor.z,tx,tz,officeCharacterRadius);
  actor.path=direct?[[tx,tz]]:officePath(actor,tx,tz);actor.pathGoal=goal;
  if(separated&&!officeCirclesClear(actor.x,actor.z,tx,tz,people)){const detour=officePath(actor,tx,tz,true);if(detour.length)actor.path=detour}
 }
 if(actor.blockedTime>=.35){actor.path=officePath(actor,tx,tz,true);actor.blockedTime=0}
 let moved=0,blocked=false;const startX=actor.x,startZ=actor.z;
 while(budget>1e-9&&actor.path.length){
  const [px,pz]=actor.path[0],dx=px-actor.x,dz=pz-actor.z,distance=Math.hypot(dx,dz);
  if(distance<1e-9){actor.path.shift();continue}
  const step=Math.min(budget,distance,.08),x=actor.x+dx/distance*step,z=actor.z+dz/distance*step;
  if(!officeSegmentClear(actor.x,actor.z,x,z,officeCharacterRadius)||!officePeopleClear(actor,x,z)){blocked=true;break}
  actor.x=x;actor.z=z;actor.heading=Math.atan2(dx,dz);actor.direction=Math.abs(dx)>Math.abs(dz)?dx>0?"right":"left":dz>0?"down":"up";
  actor.stride+=step*8.5;actor.walkedDistance+=step;moved+=step;budget-=step;
 }
 actor.blockedTime=blocked||!moved?(actor.blockedTime||0)+dt:actor.blockedTime||0;actor.mode=moved?"walk":"work";
 actor.velocity=dt>0?[(actor.x-startX)/dt,(actor.z-startZ)/dt]:[0,0];
 return moved>0;
}
function officeBlocked(x,z,except=null,margin=0){
 return officeSolidBlocked(x,z,officePlayerRadius+margin)||characters.some(actor=>actor!==except&&Math.hypot(x-actor.x,z-actor.z)<.72+margin);
}
function setOfficeObstacles(items){
 officeObstacles=Array.isArray(items)?items.filter(o=>[o.x,o.z,o.w,o.d].every(Number.isFinite)&&o.w>0&&o.d>0):[];
 officeSolids=[...officeFurniture,...officeObstacles];officeNavigation=null;
 for(const actor of characters){actor.path=[];actor.pathGoal="";actor.blockedTime=0;actor.velocity=[0,0];recoverOfficeBody(actor,officeCharacterRadius)}
 if(active)recoverOfficeBody(view,officePlayerRadius);
}
function forfeit(reason){
 if(!active||(!activated&&!number)||["cancelled","closed","success"].includes(stage))return;
 activated=false;number="";registeredName="";assignedCounter=0;ticketQueueIndex=-1;deadline=0;callPending=false;callOutcome="forfeit";clearPhonePressure();
 if(callArmTimer!==null)clearTimer(callArmTimer);callArmTimer=null;stopCallSignal();
 if(omen.phase){stopOmenTone();omen.phase="";omen.strength=0;const actor=characters[0];actor.priority=0;actor.mode="walk";actor.sequence=[];actor.omenReturn=null;applyMix()}
 const expiredLink=link;expiredLink?.send("forfeit");exit.hidden=false;actions.replaceChildren();
 setStage("walk-sign");setStatus("TERMIN VERFALLEN · "+reason);
 // Retire the URL as well as the ticket: reloading the stamped page cannot rescan.
 resetTiming();beginLink();setTimeout(()=>expiredLink?.close(),250);
}
function ring(){if(mix.fx<=0)return;try{const audio=initOfficeAudio();if(!audio)return;const {ctx,fx}=audio,now=ctx.currentTime,rate=timeScale();for(const offset of [0,.2,.52,.72]){const osc=ctx.createOscillator(),gain=ctx.createGain(),at=now+offset/rate;osc.type="sine";osc.amtFrequency=425;osc.frequency.value=425*rate;gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(.014,at+.015/rate);gain.gain.setValueAtTime(.014,at+.1/rate);gain.gain.exponentialRampToValueAtTime(.0001,at+.15/rate);audio.transients.add(osc);osc.connect(gain).connect(fx);osc.onended=()=>{audio.transients.delete(osc);osc.disconnect();gain.disconnect()};osc.start(at);osc.stop(at+.16/rate)}}catch{}}
function queueBeep(){
 if(mix.fx<=0)return;
 try{const audio=initOfficeAudio();if(!audio)return;const {ctx,fx}=audio,now=ctx.currentTime,rate=timeScale();
  for(const [offset,hz] of [[0,1480],[.18,1960]]){const osc=ctx.createOscillator(),gain=ctx.createGain(),at=now+offset/rate;osc.type="square";osc.amtFrequency=hz;osc.frequency.value=hz*rate;gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(.012,at+.008/rate);gain.gain.setValueAtTime(.012,at+.11/rate);gain.gain.exponentialRampToValueAtTime(.0001,at+.16/rate);audio.transients.add(osc);osc.connect(gain).connect(fx);osc.onended=()=>{audio.transients.delete(osc);osc.disconnect();gain.disconnect()};osc.start(at);osc.stop(at+.17/rate)}
 }catch{}
}
function playQueueCall(){
 if(queueCallPending<0)return;
 if(!walking()||stage==="outside"||queueCallPending!==queueIndex){queueCallPending=-1;return}
 if(queueCallCooldown>0||performance.now()<queueCallReadyAt||queueCallSpeaking||officeSpeechBusy||options?.cityAudioBusy?.()||window.speechSynthesis?.speaking||window.speechSynthesis?.pending)return;
 queueCallPending=-1;cancelSpeech();queueCallSpeaking=true;
 const owner=attempt,visibleCue=cue,quietGap=35+Math.random()*40,{line:text,speaker:who,voiceId,actorId}=story.queueCall;
 const current=()=>active&&owner===attempt&&visibleCue===cue&&walking();
 lips.prepare(actorId,text,1.15);
 say(text,()=>{if(current()){ambient.textContent="";queueCallSpeaking=false;queueCallCooldown=quietGap}},()=>{if(current()){ambient.textContent=who+": "+text;queueCallCooldown=quietGap}},null,{rate:1.15,volumeScale:.22,readableMs:1200,isCurrent:current},voiceId);
}
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
 const {ctx,bus,signal}=audio,now=performance.now(),rate=timeScale(),start=ctx.currentTime+Math.max(0,(signalAtMs-now)/1000),end=ctx.currentTime+Math.max(.08,(ringAtMs-now)/1000);
 if(end-start<.25)return;
 bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(bus.gain.value,ctx.currentTime);bus.gain.linearRampToValueAtTime(.16,start+.035);bus.gain.setValueAtTime(.16,end-.12);bus.gain.linearRampToValueAtTime(1,end);
 const tone=ctx.createOscillator(),low=ctx.createBiquadFilter(),envelope=ctx.createGain();tone.type="sawtooth";tone.amtFrequency=217;tone.frequency.value=217*timeScale();low.type="lowpass";low.frequency.value=1700;envelope.gain.setValueAtTime(0,start);
 for(const offset of [0,.12,.24,.5,.62,.74]){const at=start+offset/rate;if(at+.075/rate>=end)break;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.16,at+.006/rate);envelope.gain.setValueAtTime(.16,at+.055/rate);envelope.gain.linearRampToValueAtTime(0,at+.075/rate)}
 const noise=ctx.createBufferSource(),noiseFilter=ctx.createBiquadFilter(),buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*.32),ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.28;noise.buffer=buffer;noise.loop=true;noise.playbackRate.value=timeScale();noiseFilter.type="bandpass";noiseFilter.frequency.value=2400;noiseFilter.Q.value=.55;
 tone.connect(low).connect(envelope).connect(signal);noise.connect(noiseFilter).connect(envelope);
 let remainingSources=2;for(const [source,filter] of [[tone,low],[noise,noiseFilter]]){source.onended=()=>{callSignalSources.delete(source);source.disconnect();filter.disconnect();if(--remainingSources===0)envelope.disconnect()};callSignalSources.add(source);source.start(start);source.stop(end)}
 signalPauseTimer=defer(()=>{signalPauseTimer=null;if(mix.fx>0&&stage==="counter"&&callPending&&window.speechSynthesis?.speaking&&!window.speechSynthesis.paused){try{window.speechSynthesis.pause();signalPaused=true}catch{}}},Math.max(0,signalAtMs-performance.now()));
 signalEndTimer=defer(()=>{signalEndTimer=null;stopCallSignal()},Math.max(0,ringAtMs-performance.now()));
}
function commitCall(reason){
 if(!active||!activated||!callPending||callCommitted||phoneSilent||!["counter","reply","phone-warning"].includes(stage))return;
 callCommitted=true;if(callArmTimer!==null)clearTimer(callArmTimer);callArmTimer=null;
 const now=performance.now(),leadMs=Math.round(2200/timeScale()),signalMs=Math.round(900/timeScale()),ringAtMs=now+leadMs;
 const peerFresh=timing.lastPongAt!==null&&now-timing.lastPongAt<6000&&timing.clockUncertaintyMs<=250;
 const ringAtPhoneMs=peerFresh?ringAtMs+timing.clockOffsetMs:null;
 const ringAtUtcMs=window.BuergeramtClock?.usable?.(clockAnchor,now)?Math.round(window.BuergeramtClock.utcAt(clockAnchor,ringAtMs)):null;
 if(!link.send("call",{id:story.call.id,line:story.call.line,ringAtPhoneMs,ringAtUtcMs,leadMs})){forfeit("TERMIN NICHT MEHR VERFÜGBAR");return}
 timing.call={reason,armedAtMs:now,ringAtMs,signalAtMs:ringAtMs-signalMs,ringAtPhoneMs,ringAtUtcMs,peerUncertaintyMs:peerFresh?timing.clockUncertaintyMs:null,utcUncertaintyMs:ringAtUtcMs!==null?clockAnchor.uncertaintyMs:null,phoneScheduledAtMs:null,phoneMode:null,lateMs:null};
 sentPolice(-1);playCallSignal(ringAtMs-signalMs,ringAtMs);setStatus("TELEFON KLINGELT · LAUTLOS FÜR DIE ANMELDUNG");schedulePhoneWarning(Math.max(0,ringAtMs-performance.now())+3200/timeScale());
}
function armCall(){if(!active||phoneSilent||!callPending||callCommitted||callArmTimer!==null)return;if(!link.send("call-arm",{id:story.call.id})){forfeit("TERMIN NICHT MEHR VERFÜGBAR");return}callArmTimer=defer(()=>commitCall("ready-timeout"),1000)}
function ambientStep(dt){
 if(!walking()||stage==="outside")return;ambientClock+=dt;queueCallCooldown=Math.max(0,queueCallCooldown-dt);
 if(ambientClock<8.5||queueCallSpeaking||officeSpeechBusy||options?.cityAudioBusy?.()||window.speechSynthesis?.speaking||window.speechSynthesis?.pending)return;
 // All spontaneous layers consume one shared turn and yield to foreground speech.
 ambientClock=0;
 if(queueCallCooldown<=0&&queueCallPending===queueIndex&&performance.now()>=queueCallReadyAt){playQueueCall();return}
 const kind=nextAmbientKind();
 if(kind!=="dialogue"){
  if(kind==="phone")ring();else{const id=({paper:"archivbotin",stamp:"aktenkurier",copier:"kopiependler"})[kind],actor=characters.find(person=>person.id===id);officeCue(id,actor.x,actor.z)}
  return;
 }
 cancelSpeech();ambientIndex++;const {actor,text}=nextAmbientLine(),person=ambientPeople[actor];
 lips.prepare(actor,text,1.1);
 const owner=attempt,visibleCue=++cue,caption=person.speaker+": "+text;
 const current=()=>active&&owner===attempt&&visibleCue===cue&&walking();
 const show=()=>{if(current())ambient.textContent=caption};
 say(text,()=>{if(current())ambient.textContent=""},show,null,{rate:1.1,volumeScale:.22,isCurrent:walking,fallback:"captions"},person.voiceId);
}
function update(dt){
 if(!active||document.hidden)return;
 if(window.Germany3D?.ready&&!root.classList.contains("first-person"))root.classList.add("first-person");
 const realElapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0,previousFloor=floorClock,inside=view.z<door.z;
 if(inside)floorClock+=realElapsed;
 const elapsed=inside?goop.motion(floorClock)-goop.motion(previousFloor):realElapsed*timeScale();visualClock+=elapsed;applyOfficeTempo();
 if(!document.hidden)feverClock?.advance(elapsed);updateFeverTone();ambientStep(elapsed);
 if(sceneContinuation&&(!sceneContinuation.waitForFade||!feverClock?.inspect().active)){const next=sceneContinuation;next.hold-=elapsed;if(next.hold<=1e-9){sceneContinuation=null;if(next.owner===attempt&&next.cue===cue)next.run();if(!active)return}}
 clerkClock+=elapsed;clerkAccent=Math.max(0,clerkAccent-elapsed);if(!document.hidden)clerkAnimation?.advance(elapsed);
 if(!omen.phase)for(const id of Object.keys(stationaryClocks))if(walking()||characterMood?.id===id)stationaryClocks[id]+=elapsed;
 updateOmen(elapsed);
 updateCharacters(elapsed);
 if(omen.phase)return;
 if(stage==="character"){
  const actor=characters.find(item=>item.id===characterMood?.id)||story.patrons[characterMood?.id];
  if(actor){const target=Math.atan2(actor.x-view.x,view.z-actor.z),turn=Math.atan2(Math.sin(target-view.yaw),Math.cos(target-view.yaw));view.yaw+=turn*(1-Math.exp(-4*elapsed))}
  return;
 }
 if(!walking()&&stage!=="early")return;
 if(activated&&deadline>0){
  deadline-=elapsed;
  if(deadline<=1e-9){forfeit("AUFRUF VERPASST");return}
 }
 queueClock+=elapsed;
 if(queueClock+1e-9>=callInterval){queueClock=Math.max(0,queueClock-callInterval);queueIndex++;const desk=queueCounters[queueIndex%4];displayNumber(queueCodes[queueIndex%queueCodes.length],desk);if(activated&&queueIndex===ticketQueueIndex){deadline=callWindow;if(stage!=="early"&&stage!=="outside")setStage("walk-counter");setStatus("AUFRUFTAFEL")}reactToCall();queueBeep();queueCallPending=queueIndex;queueCallReadyAt=performance.now()+360/timeScale();}
 if(!walking())return;
 if(held.has("ArrowLeft"))view.yaw-=elapsed*1.8;
 if(held.has("ArrowRight"))view.yaw+=elapsed*1.8;
 const f=(held.has("KeyW")||held.has("ArrowUp")?1:0)-(held.has("KeyS")||held.has("ArrowDown")?1:0),s=(held.has("KeyD")?1:0)-(held.has("KeyA")?1:0);
 if(f||s){const length=Math.hypot(f,s),speed=held.has("KeyR")?7.2:held.has("ShiftLeft")?5.8:3.6,dx=(Math.sin(view.yaw)*f+Math.cos(view.yaw)*s)/length*speed*elapsed,dz=(-Math.cos(view.yaw)*f+Math.sin(view.yaw)*s)/length*speed*elapsed;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<steps;i++){const stepX=view.x,stepZ=view.z,x=Math.max(-7.45,Math.min(7.45,view.x+dx/steps)),z=Math.max(-10.05,Math.min(8.45,view.z+dz/steps));const crossing=view.z>=door.z&&z<door.z||view.z<door.z&&z>=door.z;if(crossing&&Math.abs(x)>1.3)break;if(!officeBlocked(x,view.z))view.x=x;if(!officeBlocked(view.x,z)){view.z=z;if(crossing&&stage==="outside"&&z<door.z){setStage(activated?"waiting":"walk-sign",true);setStatus(activated?"WARTENUMMER "+number+" · AUFRUF ABWARTEN":"QR-CODE MIT DEM TELEFON SCANNEN")}}view.walkedDistance+=Math.hypot(view.x-stepX,view.z-stepZ);}}
 const desk=nearestCounter(),near=distanceTo(nearbyTarget())<1.9&&(stage!=="outside"||Math.abs(view.x)<1.3),actor=desk?null:nearestCharacter();
 const nearbyText=desk?"E · SCHALTER "+desk+" ANSPRECHEN":actor?"E · "+(story.characters[actor.id]||story.patrons[actor.id]).speaker+" ANSPRECHEN":near?(stage==="outside"?"DURCH DEN EINGANG GEHEN":stage==="walk-sign"?"QR-CODE MIT DEM TELEFON SCANNEN":"AUFRUFTAFEL"):(stage==="outside"?"ZUR EINGANGSTÜR":stage==="walk-sign"?"QR-SCHILD UNTER DER ANZEIGE":"AUFRUFTAFEL");
 if(nearby.textContent!==nearbyText)nearby.textContent=nearbyText;
}
function interact(){if(!walking()||omen.phase)return;if(!document.fullscreenElement)requestFullscreen();const desk=nearestCounter();if(desk){if(activated&&registeredName&&deadline>0&&desk===assignedCounter&&counterCalls[desk-1]===number){interactingCounter=desk;showClerk()}else refuseCounter(desk);return}const near=distanceTo(nearbyTarget())<1.9,actor=nearestCharacter();if(actor){showCharacter(actor);return}if(!near||stage==="outside"&&Math.abs(view.x)>=1.3)return;
 if(stage==="outside"){view.positionGeneration++;view.z=4.8;setStage(activated?"waiting":"walk-sign");setStatus(activated?"WARTENUMMER "+number+" · AUFRUF ABWARTEN":"QR-CODE MIT DEM TELEFON SCANNEN");return}
 if(stage==="walk-sign")return;
}
function beginLink(){
 const invitation=BuergeramtLink.invitation();
 const code=qrcode(0,"M");code.addData(BuergeramtLink.phoneUrl(invitation,options.subtitlesOn?.()));code.make();qrSvg=code.createSvgTag({cellSize:5,margin:4,scalable:true});window.Germany3D?.setAmtQr?.(qrSvg);
 const owner=attempt,currentLink=new BuergeramtLink("host",invitation);link=currentLink;
 const current=()=>active&&owner===attempt&&link===currentLink;
 const terminal=()=>["cancelled","closed","success"].includes(stage);
 currentLink.addEventListener("status",e=>{if(!current())return;if(stage==="cancelled"&&/getrennt|unterbrochen/i.test(e.detail)){policeDisconnectHandler?.();return}if(terminal())return;if(number&&/getrennt|unterbrochen/i.test(e.detail))forfeit("TERMIN NICHT MEHR VERFÜGBAR");else if(!activated)setStatus("QR-CODE SCANNEN · WARTENUMMER ZIEHEN")});
 currentLink.addEventListener("connected",()=>{if(!current()||terminal())return;setStatus("QR-CODE SCANNEN · WARTENUMMER ZIEHEN");probeLink();applyOfficeTempo(true);if(pingTimer===null)pingTimer=setInterval(()=>{if(current())probeLink()},1500)});
 currentLink.addEventListener("message",e=>{
  if(!current())return;const m=e.detail;
  if(m.type==="sync-pong"){receivePong(m.id,m.receivedAtMs,m.sentAtMs);return}
  if(m.type==="call-ready"){if(["counter","reply","phone-warning"].includes(stage)&&callPending&&m.id===story.call.id)commitCall("phone-ready");return}
  if(m.type==="call-scheduled"){if(timing.call&&m.id===story.call.id&&timing.call.phoneScheduledAtMs===null){timing.call.phoneScheduledAtMs=m.atMs;timing.call.phoneMode=m.mode;timing.call.lateMs=m.lateMs}return}
  if(m.type==="hangup"){if(stage==="cancelled"&&callOutcome==="answer"&&m.id===story.call.id)policeDisconnectHandler?.();return}
  if(m.type==="police-start"){if(stage==="cancelled"&&receivePoliceStart(m.index,m.mode,m.readyDelayMs,m.atMs,m.atUtcMs))policeStartHandler?.(m.index);return}
  if(m.type==="police-done"){if(stage==="cancelled"&&receivePoliceDone(m.index,m.mode,m.durationMs,m.atMs))policeDoneHandler?.(m.index);return}
  if(terminal())return;
  if(m.type==="scan"){
   if(m.id===lastScanId){currentLink.send(number?"ticket":"scan-ready",number?{number,counter:assignedCounter}:{});return}
   if(!currentLink.send("scan-ready"))return;
   lastScanId=m.id;number="";assignedCounter=0;ticketQueueIndex=-1;registeredName="";activated=false;deadline=0;callPending=false;callTriggered=false;callCommitted=false;callOutcome="";clerkIndex=0;resetRegistration();
   if(omen.phase)omen.resume="walk-sign";
   else if(stage!=="outside"&&stage!=="character")setStage("walk-sign");
   setStatus("NAME AM TELEFON EINTRAGEN");
  }else if(m.type==="register"&&m.id===lastScanId&&lastScanId&&typeof m.name==="string"&&m.name.trim().length>=2&&m.name.length<=80){
   if(number){currentLink.send("ticket",{number,counter:assignedCounter});return}
   const index=queueIndex+2+Math.floor(Math.random()*3),next=queueCodes[index%queueCodes.length],desk=queueCounters[index%4];
   // Reserve first so even an immediate receipt refers to committed ticket data.
   // Only the phone's displayed-ticket receipt unlocks the appointment.
   ticketQueueIndex=index;number=next;assignedCounter=desk;counter.x=counterXs[desk-1];registeredName=m.name.trim().replace(/\s+/g," ");
   if(!currentLink.send("ticket",{number,counter:desk})){ticketQueueIndex=-1;number="";assignedCounter=0;registeredName="";return}
  }else if(m.type==="ticket-received"&&!activated&&number&&registeredName&&m.id===lastScanId&&m.number===number){
   activated=true;
   if(queueIndex>=ticketQueueIndex){
    deadline=callWindow-(queueIndex-ticketQueueIndex)*callInterval-queueClock;
    if(deadline<=0||counterCalls[assignedCounter-1]!==number){forfeit("AUFRUF VERPASST");return}
   }
   const next=deadline>0?"walk-counter":"waiting";
   if(omen.phase)omen.resume=next;
   else if(stage!=="outside"&&stage!=="character"&&stage!=="early")setStage(next);
   setStatus("WARTENUMMER "+number+" · AUFRUFTAFEL");
  }
  else if(m.type==="phone-hidden")forfeit("TELEFON NICHT SICHTBAR");
  else if(m.type==="silence"&&m.id===story.call.id&&activated&&!["expired","cancelled","closed","success"].includes(stage))silencePhone(false);
  else if(activated&&callPending&&callCommitted&&["counter","reply","phone-warning"].includes(stage)&&m.id===story.call.id&&m.type==="answer"){
   callPending=false;callOutcome="answer";clearPhonePressure();stopCallSignal();setStage("cancelled");setStatus("TERMIN ANNULLIERT · "+number);probeLink();showOutburst();
  }else if(activated&&callPending&&callCommitted&&["counter","reply","phone-warning"].includes(stage)&&m.id===story.call.id&&m.type==="decline"){
   callPending=false;callOutcome="decline";if(phoneWarningTimer!==null)clearTimer(phoneWarningTimer);phoneWarningTimer=null;stopCallSignal();if(timing.cues[-1]?.status==="waiting")timing.cues[-1].status="declined";
   // The host owns repeat calls. Putting the call away leaves the page connected.
   phoneRetryTimer=defer(()=>{phoneRetryTimer=null;if(phoneSilent||!activated||registrationCompleted)return;callPending=true;callCommitted=false;armCall()},24000/timeScale());
   warnPhone();
  }
 });
 currentLink.start().catch(()=>{if(current()&&!terminal())setStatus("WARTENUMMER DERZEIT NICHT VERFÜGBAR")});
}
function schedulePhoneWarning(delay){if(phoneWarningTimer!==null)clearTimer(phoneWarningTimer);phoneWarningTimer=defer(()=>{phoneWarningTimer=null;if(callPending&&!phoneSilent)warnPhone()},delay)}
function warnPhone(){
 if(!active||!activated||phoneSilent||registrationCompleted||["cancelled","expired","closed"].includes(stage))return;
 phoneWarnings++;
 if(phoneWarnings>3){forfeit("TELEFON NICHT LAUTLOS");return}
 setStage("phone-warning");setStatus("TELEFON-VERSTOSS "+phoneWarnings+"/3 · LAUTLOS SCHALTEN");
 content(story.clerkIdentity.speaker,story.phoneWarnings[phoneWarnings-1],[{label:"Telefon auf lautlos schalten.",run:()=>silencePhone(true,"Telefon auf lautlos schalten.")},{label:"Nicht rangehen. Telefon weglegen.",run:()=>readPlayerReply("Nicht rangehen. Telefon weglegen.",showRegistration)}],null,null,null,null,{rate:1.12,pitch:1.08});
 if(callPending)schedulePhoneWarning(6000/timeScale());
}
function readPlayerReply(text,next){content(story.playerIdentity.speaker,text,[],next)}
function silencePhone(send,spokenReply=""){
 if(!active||!activated||phoneSilent||registrationCompleted||["cancelled","expired","closed"].includes(stage))return;
 if(send&&!link?.send("silence",{id:story.call.id})){forfeit("TERMIN NICHT MEHR VERFÜGBAR");return}
 phoneSilent=true;callPending=false;callOutcome="silent";clearPhonePressure();if(callArmTimer!==null)clearTimer(callArmTimer);callArmTimer=null;stopCallSignal();
 if(["counter","reply","phone-warning"].includes(stage)){
  setStage("reply");setStatus("TELEFON LAUTLOS · VORGANG WIRD FORTGESETZT");const acknowledge=()=>content(story.clerkIdentity.speaker,"Endlich! Das Telefon bleibt lautlos. Und jetzt hören Sie MIR zu. Eine Anmeldung ist kein Plausch mit Ihrem Vermieter!",[],showRegistration);if(spokenReply)readPlayerReply(spokenReply,acknowledge);else acknowledge();
 }
}
function showRegistration(){
 if(!active||!activated||registrationCompleted||["cancelled","expired","closed"].includes(stage))return;
 registrationNode=registrationNode||story.registration.first;if(registrationNode==="complete"){completeRegistration();return}
 if(registrationReply){showRegistrationReply();return}
 const node=story.registration.nodes[registrationNode];setStage("counter");
 setStatus("ANMELDUNG · PRÜFUNG "+node.step+"/"+story.registration.totalSteps+" · "+(phoneSilent?"TELEFON LAUTLOS":"TELEFON NICHT LAUTLOS")+(registrationStamps.size?" · "+registrationStamps.size+" VERMERKE":""));
 content(story.registration.speaker,node.line,node.choices.map(choice=>({label:choice.label,run:()=>{registrationReply=choice;setStage("reply");readPlayerReply(choice.label,showRegistrationReply)}})));
}
function showRegistrationReply(){
 const choice=registrationReply;setStage("reply");content(story.registration.speaker,choice.reply,[],()=>{
  if(choice.stamp)registrationStamps.add(choice.stamp);registrationReply=null;registrationNode=choice.next;if(choice.next==="complete")completeRegistration();else showRegistration();
 });
}
function completeRegistration(){
 if(!active||!activated||registrationCompleted)return;
 if(!phoneSilent){registrationNode="complete";warnPhone();return}
 registrationCompleted=true;clearPhonePressure();callPending=false;setStage("success");setStatus("ANMELDUNG ABGESCHLOSSEN · "+registeredName);
 options.onRegistration?.({name:registeredName,number});
 content(story.registration.speaker,"ANMELDUNG ABGESCHLOSSEN. Sie sind jetzt amtlich hier. Ihre Meldebestätigung ist gestempelt und das Abzeichen steht in Ihrer Spielakte. Formular A38 nehmen Sie ebenfalls mit. Verlieren Sie es, dann verlieren Sie bitte auch meine Zuständigkeit.",[{label:"Meldebestätigung und A38 mitnehmen.",run:()=>readPlayerReply("Meldebestätigung und A38 mitnehmen.",finish)}]);
}
function showClerk(){
 if(!active||!activated||["cancelled","expired","closed","success"].includes(stage))return;
 if(!registeredName){setStatus("VOR- UND NACHNAME AM TELEFON EINTRAGEN");return}
 view.positionGeneration++;view.x=counter.x;view.z=-8.15;view.yaw=0;setStage("counter");
 if(!callTriggered){callTriggered=true;if(phoneSilent){showRegistration();return}callPending=true;content(story.clerkIdentity.speaker,"Ihre Nummer ist aufgerufen. Beeilen Sie sich! Ich bin sehr beschäftigt. Was? Ihr Telefon klingelt während meiner Vorsprache.",[],null,armCall);return}
 if(!callPending||phoneSilent)showRegistration();
}
function showOutburst(){
 const upset={...story.outburst,speaker:"FRAU KNICK · SCHALTER "+assignedCounter};exit.hidden=true;cancelSpeech();ambient.textContent="";
 const phoneBrowser=navigator.userAgentData?.mobile??/iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent||"");
 let waiting=null,deskIndex=null,deskTimer=null,disconnected=false,phoneCaption="";
 function clearPhoneCaption(){if(phoneCaption&&ambient.textContent===phoneCaption)ambient.textContent="";phoneCaption=""}
 function stopDesk(){
  if(deskTimer!==null)clearTimer(deskTimer);deskTimer=null;
  const record=timing.desk[deskIndex];if(record&&record.endAt===null){record.endAt=performance.now();record.mode="interrupted";cancelSpeech()}
 }
 function nextDesk(index,missing=false){
  if(waiting?.index!==index)return;const pending=waiting;waiting=null;clearTimer(pending.timer);
  clearPhoneCaption();
  if(missing&&timing.cues[index]?.doneAt===null)timing.cues[index].status=disconnected?"disconnected":"timeout";
  desk(index+1);
 }
 policeDoneHandler=index=>nextDesk(index);
 policeStartHandler=index=>{
  if(waiting?.index!==index)return;stopDesk();clearTimer(waiting.timer);ambient.textContent="";
  clearPhoneCaption();
  if(!phoneBrowser){phoneCaption="KRIMINALPOLIZEI · "+(index===-1?story.call.line:story.police[index]);ambient.textContent=phoneCaption}
  const pending=waiting,record=timing.cues[index],budget=Math.round(upset.phoneCutAfterMs[index+1]/timeScale()),target=record.estimatedStartAt+budget;
  const service=window.BuergeramtClock;
  const stopAtUtcMs=Number.isSafeInteger(record.phoneStartedAtUtcMs)?record.phoneStartedAtUtcMs+budget:service?.usable?.(clockAnchor)?Math.round(service.utcAt(clockAnchor,target)):null;
  const payload={index,stopAtPhoneMs:record.phoneStartedAtMs+budget,stopAtUtcMs};
  record.cutoffAtPhoneMs=payload.stopAtPhoneMs;record.cutoffAtUtcMs=stopAtUtcMs;
  let tries=0;
  const schedule=()=>{
   if(waiting!==pending||record.doneAt!==null)return;
   if(!disconnected&&link?.send("police-cutoff",payload)){
    record.interrupted=true;record.cutoffSentAt=performance.now();
    pending.timer=defer(()=>nextDesk(index),Math.max(0,target-performance.now()-timing.deskStartLagMs));
   }else if(++tries<3)pending.timer=defer(schedule,100);
   else{record.cutoffSendFailed=true;pending.timer=defer(()=>nextDesk(index,true),60000)}
  };
  schedule();
 };
 policeDisconnectHandler=()=>{disconnected=true;if(waiting)nextDesk(waiting.index,true)};
 function police(index){
  if(waiting)return;
  waiting={index,timer:defer(()=>nextDesk(index,true),18000)};
  if(index>=0){if(!disconnected&&link?.send("police-line",{index,line:story.police[index]}))sentPolice(index);else nextDesk(index,true)}
 }
 function desk(index){
  stopDesk();deskIndex=index;let advanced=false;
  const text=upset.lines[index],record={requestedAt:performance.now(),startAt:null,endAt:null,mode:"waiting"};timing.desk[index]=record;
  const advance=()=>{if(advanced)return;advanced=true;if(deskTimer!==null)clearTimer(deskTimer);deskTimer=null;if(index<3)police(index);else if(index===3)defer(()=>desk(4),150);else defer(finishArgument,200)};
  content(upset.speaker,text,[],mode=>{record.endAt=performance.now();record.mode=mode;advance()},mode=>{
   record.startAt=performance.now();record.startMode=mode;if(mode==="voice")timing.deskStartLagMs=Math.round(timing.deskStartLagMs*.6+(record.startAt-record.requestedAt)*.4);
   if(index<3)deskTimer=defer(advance,Math.max(300,upset.cutAfterMs[index]/timeScale()-phoneFastLag()));
  },null,null,upset.delivery[index]);
 }
 function finishArgument(){const callback=options.onCancel;close(false);callback()}
 police(-1);
}
function finish(){if(!active||!activated||callPending||!phoneSilent||!registrationCompleted||stage!=="success")return;const callback=options.onForm;close(false);callback()}
function close(notify=true){
 feverClock?.clear();stopFeverTone();
 if(!active)return;const config=options,phoneComplete=stage==="success"&&registrationCompleted;clearPhonePressure();stopCallSignal();active=false;attempt++;callPending=false;activated=false;callOutcome="";policeDoneHandler=null;policeStartHandler=null;policeDisconnectHandler=null;characterMood=null;
 window.Germany3D?.clearAmtOmenSplat?.();
 window.Germany3D?.clearAmtFloor?.();
 floorClock=visualClock=0;
 window.Germany3D?.clearAmtGaussianAnimations?.();
 clerkSpeaking=false;clerkAccent=0;clerkAnimation?.reset(attempt);resetOmen();
 if(pingTimer!==null)clearInterval(pingTimer);pingTimer=null;outstandingPings.clear();
 for(const id of pendingTimers)clearTimeout(id);pendingTimers.clear();cancelSpeech();setStage("closed");
 try{officeAudio?.ctx.close()?.catch(()=>{})}catch{}officeAudio=null;held.clear();root.hidden=true;walkHud.hidden=true;mixPanel.open=false;mixPanel.hidden=true;ambient.textContent="";
 document.body.classList.remove("amt-inside");const previous=link;link=null;previous?.send(phoneComplete?"done":"forfeit");setTimeout(()=>previous?.close(),250);config.music?.(false);if(notify)config.onClose();
}
function open(config){if(active)return;resetRegistration();resetTiming();hostVoiceStartupMs=null;hostVoiceAttempts=0;attempt++;callOutcome="";options=config;active=true;requestFullscreen();assignedCounter=0;interactingCounter=0;counter.x=counterXs[2];resetStationaryClocks();feverClock?.clear();encounterArmed=false;clerkIndex=0;callPending=false;callTriggered=false;callCommitted=false;callArmTimer=null;clockAnchor=null;registeredName="";number="";activated=false;lastScanId="";queueClock=0;queueIndex=0;queueCallPending=-1;queueCallReadyAt=0;queueCallSpeaking=false;queueCallCooldown=35+Math.random()*40;ambientKindBag.length=0;ambientLastKind="";ticketQueueIndex=-1;for(let i=-3;i<=0;i++)counterCalls[queueCounters[(i+4)%4]-1]=queueCodes[(i+queueCodes.length)%queueCodes.length];deadline=0;ambientClock=0;clerkClock=0;floorClock=0;visualClock=0;tempoSentAt=-Infinity;tempoSentRate=null;clerkSpeaking=false;clerkAccent=0;clerkBeat="idle";clerkPulse=0;patronEncounters={};clerkAnimation?.reset(attempt);displayNumber(queueCodes[0],queueCounters[0]);view.x=0;view.z=8;view.yaw=0;view.walkedDistance=0;held.clear();resetCharacters();resetOmen();exit.hidden=false;root.hidden=false;mixPanel.hidden=false;document.body.classList.add("amt-inside");options.music?.(true);beginLink();setStage("outside");setStatus("EINGANG · BÜRGERAMT");const owner=attempt;window.BuergeramtClock?.sample?.().then(anchor=>{if(active&&attempt===owner)clockAnchor=anchor}).catch(()=>{})}
function clerkPerformance(){
 const names={idle:0,review:1,raise:2,stamp:3,deny:4,talk:5};
 let mode="idle";
 if(clerkSpeaking&&clerkAnimation){const state=clerkAnimation.state,pose=state.arc&&state.phase>=.5?state.toPose:state.pose;mode=({ready:'idle',raised:'raise',contact:'stamp',refusal:'deny'}[pose]||'idle')}
 else if(clerkAccent>0)mode=clerkBeat;
 else if(["counter","reply","cancelled","early","expired"].includes(stage))mode=stage==="cancelled"||stage==="early"||stage==="expired"?"deny":"review";
 else{const beat=clerkClock%9.2;mode=beat<2.6?"idle":beat<4.1?"review":beat<4.6?"raise":beat<4.95?"stamp":beat<6.1?"deny":"idle"}
 return{row:names[mode],frame:Math.floor(clerkClock*4+clerkPulse)%8,speaking:clerkSpeaking,animation:clerkAnimation?.state??null};
}
function captureKey(event){if(event.type==="keyup")held.delete(event.code);if(!active)return;if(event.type==="keydown"&&event.code==="KeyE"&&walking()){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)interact();return}if(!walking()||omen.phase)return;if(["KeyW","KeyA","KeyS","KeyD","KeyR","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(event.type==="keydown")held.add(event.code);else held.delete(event.code)}}
window.addEventListener("keydown",captureKey,true);window.addEventListener("keyup",captureKey,true);window.addEventListener("blur",()=>held.clear());
document.addEventListener("visibilitychange",()=>{if(document.hidden)held.clear();updateOmenTone();updateFeverTone()});
document.addEventListener("pointermove",event=>{if(active&&walking()&&!omen.phase&&event.buttons===1&&!event.target.closest("button"))view.yaw+=event.movementX*.004*timeScale()});
document.querySelectorAll("[data-amt-key]").forEach(button=>{const key=button.dataset.amtKey;button.addEventListener("pointerdown",e=>{if(!active||!walking()||omen.phase)return;e.preventDefault();button.setPointerCapture(e.pointerId);held.add(key)});for(const type of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(type,()=>held.delete(key))});
document.getElementById("amt-touch-e").addEventListener("click",interact);document.getElementById("amt-leave").addEventListener("click",()=>close());exit.addEventListener("click",()=>close());
window.BuergeramtLevel={open,requestFullscreen,get registrationTicket(){return number},get activeClerkCounter(){return interactingCounter||assignedCounter||3},get queueCalls(){return counterCalls.map((number,index)=>({number,counter:index+1}))},get assignedCounter(){return{number:assignedCounter,x:counter.x,z:counter.z}},get registration(){return{node:registrationNode,completed:registrationCompleted,phoneSilent,warnings:phoneWarnings,stamps:[...registrationStamps]}},get lipSpeech(){return lips.sample()},replay(config){close(false);open(config)},update,interact,setOfficeObstacles,get active(){return active},get timeScale(){return timeScale()},get floorState(){return{time:floorClock,visualTime:visualClock,goop:goop.goop(floorClock),speed:timeScale(),visit:attempt}},get audioTextBusy(){return officeSpeechBusy},get stage(){return stage},get queueDisplay(){return queueDisplay},get qrSvg(){return qrSvg},get phoneUrl(){return link?BuergeramtLink.phoneUrl(link.invitation,options.subtitlesOn?.()):""},get timing(){return JSON.parse(JSON.stringify(timing))},get view(){return{x:view.x,z:view.z,yaw:view.yaw,walkedDistance:view.walkedDistance,positionGeneration:view.positionGeneration}},get characters(){return characters.map(actor=>({id:actor.id,x:actor.x,z:actor.z,walkedDistance:actor.walkedDistance,positionGeneration:actor.positionGeneration,direction:actor.direction,heading:actor.heading??Math.PI,mode:actor.mode,phase:characterPhase(actor),frame:Math.min(7,Math.floor(characterPhase(actor)*8)),animation:characterAnimation(actor)}))},get stationaryAnimations(){return{
 "clerk-desk-1":window.BuergeramtAnimationClock?.ambientClerk(stationaryClocks["clerk-desk-1"],attempt),
 "clerk-desk-2":window.BuergeramtAnimationClock?.ambientClerk(stationaryClocks["clerk-desk-2"],attempt),
 "clerk-desk-3":window.BuergeramtAnimationClock?.ambientClerk(stationaryClocks["clerk-desk-3"],attempt),
 "clerk-desk-4":window.BuergeramtAnimationClock?.ambientClerk(stationaryClocks["clerk-desk-4"],attempt),
 "amt-konrad-wohnungszettel":window.BuergeramtAnimationClock?.ambientPatron(stationaryClocks["amt-konrad-wohnungszettel"],attempt),
 "amt-mechthild-elternbogen":window.BuergeramtAnimationClock?.ambientPatron(stationaryClocks["amt-mechthild-elternbogen"],attempt),
 "amt-wolfram-rentenbescheid":window.BuergeramtAnimationClock?.ambientPatron(stationaryClocks["amt-wolfram-rentenbescheid"],attempt)
}},get characterMood(){return characterMood},get fever(){return feverClock?.inspect()||{active:false,strength:0}},get clerkPerformance(){return clerkPerformance()},get omen(){return{turnProgress:omen.phase==="turn"?1-omen.hold/omenTurnSeconds:0,phase:omen.phase,strength:omen.strength,visit:omen.visit,revealTime:omen.revealTime,life:omenLife(),enabled:options?.cinematics!==false,x:characters[0].x,z:characters[0].z,speech:omen.speech?{...omen.speech}:null}},get registeredName(){return registeredName},get activated(){return activated}};
})();
