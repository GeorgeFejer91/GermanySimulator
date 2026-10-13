(function(){"use strict";
const invitation=BuergeramtLink.fromHash(),number=document.getElementById("phone-number"),status=document.getElementById("phone-status"),admission=document.getElementById("phone-admission-status"),form=document.getElementById("phone-form"),name=document.getElementById("phone-name"),submit=document.getElementById("phone-submit"),ticket=document.getElementById("phone-ticket"),call=document.getElementById("phone-call"),choices=document.getElementById("phone-choices"),answer=document.getElementById("phone-answer"),decline=document.getElementById("phone-decline"),track=document.getElementById("phone-answer-track"),callState=document.getElementById("phone-call-state"),activeControls=document.getElementById("phone-active-controls"),hangup=document.getElementById("phone-hangup");
// Scanning a fresh QR into this tab is a hash navigation, not always a page load.
window.addEventListener("hashchange",()=>window.location.reload());
const platform=navigator.userAgentData?.platform||"",agent=navigator.userAgent||"",mobile=navigator.userAgentData?.mobile??/iPhone|iPod|Android.*Mobile/i.test(agent);
const phoneOs=mobile&&(/Android/i.test(platform)||/Android/i.test(agent))?"android":mobile&&/iPhone|iPod|iOS/i.test(platform+" "+agent)?"ios":"generic";
document.documentElement.dataset.phoneOs=phoneOs;
const callUiOverride=new URLSearchParams(window.location?.search||"").get("callUi");
let callUi=phoneOs==="ios"?"ios":phoneOs==="android"?(/SamsungBrowser|SM-[A-Z0-9]/i.test(agent)?"samsung":"google"):"generic";
if(["ios","google","samsung","generic"].includes(callUiOverride))callUi=callUiOverride;
document.documentElement.dataset.callUi=callUi;
if(phoneOs==="android"&&!callUiOverride)navigator.userAgentData?.getHighEntropyValues?.(["model"]).then(({model})=>{
 if(call.hidden&&/^SM-|^Galaxy/i.test(model||"")){callUi="samsung";document.documentElement.dataset.callUi=callUi}
}).catch(()=>{});
const captions=new URLSearchParams(window.location?.hash?.slice(1)||"").get("captions")==="en",browserLanguage=navigator.languages?.[0]||navigator.language||"de",callLanguage=captions||/^en(?:-|$)/i.test(browserLanguage)?"en":"de";
const copy=callLanguage==="en"?{ringing:"INCOMING CALL",caller:"Unbekannte Nummer",answer:"ANSWER",decline:"DECLINE",hangup:"END CALL"}:{ringing:"EINGEHENDER ANRUF",caller:"Unbekannte Nummer",answer:"ANNEHMEN",decline:"ABLEHNEN",hangup:"AUFLEGEN"};
call.lang=callLanguage;callState.textContent=copy.ringing;document.getElementById("phone-caller").textContent=copy.caller;document.getElementById("phone-answer-label").textContent=copy.answer;document.getElementById("phone-decline-label").textContent=copy.decline;document.getElementById("phone-swipe-label").textContent=copy.answer;document.getElementById("phone-hangup-label").textContent=copy.hangup;
const clockService=window.BuergeramtClock;let clockAnchor=null;
const clock=document.getElementById("phone-time");function updateClock(){const utc=clockService?.usable?.(clockAnchor)?clockService.utcAt(clockAnchor,performance.now()):Date.now();clock.textContent=new Intl.DateTimeFormat(callLanguage,{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(utc))}updateClock();const clockTimer=setInterval(updateClock,30000);window.addEventListener("pagehide",()=>clearInterval(clockTimer));
if(!invitation){admission.textContent="Bitte scannen Sie den QR-Code im Amt, um eine Wartenummer zu ziehen.";form.hidden=true;return}
const expired=document.getElementById("phone-expired");
function showExpired(){expired.hidden=false;form.hidden=true;clearInterval(clockTimer);document.body.classList.add("amt-phone-expired")}
document.getElementById("phone-expired-copy").onclick=()=>window.location.reload();
submit.disabled=false;
clockService?.sample?.().then(anchor=>{clockAnchor=anchor;updateClock()}).catch(()=>{});
const link=new BuergeramtLink("phone",invitation),scanId=Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,"0")).join("");let currentCall="",resolved="",policeIndex=-1,audioContext=null,phoneFxGain=null,staticSource=null,recordedSpeech=null,voiceGeneration=0,submittedName="",connected=false,scanReady=false,slotActive=false,atCounter=false,finished=false,closed=false,voiceBusy=false,voiceTimer=null,ringTimer=null,callStartTimer=null,armedRound=0,currentRound=0,lastRound=0,scanTimer=null,voiceStartupMs=null,voiceAttempts=0,drag=null,ignoreClickTarget=null;
let phoneSilent=false,offlineState=false,openingPoliceLine="",openingGreeting="",phoneUtterance=null,answeredAt=null,durationTimer=null,officeTempo=1,ringCadence=null,readableFallback=null,staticFilter=null,staticGain=null,committedRingAtMs=null,callEnding=null;
const voiceQueue=[],ringSources=new Set();
function silenceCalls(){if(!slotActive||finished||closed)return;phoneSilent=true;stopCall();currentCall="";resolved="silent";}
function updateDuration(){const seconds=Math.max(0,Math.floor((performance.now()-answeredAt)/1000));callState.textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0")}
let activePoliceIndex=null,finishPoliceVoice=null,cutoffTimer=null;
function stopRing(){clearTimeout(ringTimer);clearTimeout(callStartTimer);ringTimer=callStartTimer=null;ringCadence=null;committedRingAtMs=null;for(const source of ringSources){try{source.stop()}catch{}}ringSources.clear();try{navigator.vibrate?.(0)}catch{}}
function stopRecorded(){const clip=recordedSpeech;recordedSpeech=null;if(clip){clip.onplaying=clip.onended=clip.onerror=null;try{clip.pause()}catch{}}}
function rateRecording(clip){if(!clip)return;clip.defaultPlaybackRate=clip.playbackRate=officeTempo;clip.preservesPitch=clip.mozPreservesPitch=clip.webkitPreservesPitch=false}
// Peer deadlines and receipts stay monotonic. Only authored audio and repeat/read
// durations consume the host's one office tempo; this page has no goop clock.
function officeRate(rate){
 if(!Number.isFinite(rate)||rate<.5||rate>1||rate===officeTempo)return;
 const now=performance.now(),previous=officeTempo;
 for(const phase of [ringCadence,readableFallback])if(phase){phase.remainingMs=Math.max(0,phase.remainingMs-Math.max(0,now-phase.atMs)*previous);phase.atMs=now}
 officeTempo=rate;rateRecording(recordedSpeech);
 if(staticSource)staticSource.playbackRate.value=rate;if(staticFilter)staticFilter.frequency.value=2200*rate;
 if(committedRingAtMs!==null&&now<committedRingAtMs){for(const source of ringSources)try{source.stop()}catch{}ringSources.clear();scheduleRingSound(committedRingAtMs)}
 else for(const source of ringSources)source.frequency.value=440*rate;
 if(ringCadence){clearTimeout(ringTimer);ringTimer=setTimeout(()=>repeatRing(performance.now()),ringCadence.remainingMs/rate)}
 if(readableFallback&&finishPoliceVoice){clearTimeout(voiceTimer);voiceTimer=setTimeout(finishPoliceVoice,readableFallback.remainingMs/rate)}
}
function resetSwipe(){drag=null;for(const button of [answer,decline]){button.style?.removeProperty("--amt-swipe-x");button.style?.removeProperty("--amt-swipe-y");button.classList.remove("dragging")}}
function stopCall(){stopEnding();voiceGeneration++;voiceQueue.length=0;voiceBusy=false;phoneUtterance=null;activePoliceIndex=finishPoliceVoice=null;readableFallback=null;clearTimeout(cutoffTimer);cutoffTimer=null;clearTimeout(voiceTimer);voiceTimer=null;clearInterval(durationTimer);durationTimer=null;answeredAt=null;stopRecorded();stopStatic();stopRing();armedRound=currentRound=0;resetSwipe();try{window.speechSynthesis?.cancel()}catch{}call.classList.remove("answered");document.body.classList.remove("amt-phone-in-call");activeControls.hidden=true;callState.textContent=copy.ringing;call.hidden=true;answer.hidden=true;decline.hidden=true;choices.hidden=true}
function endSlot(text,completed=false){slotActive=false;finished=true;submit.disabled=true;clearInterval(scanTimer);scanTimer=null;stopCall();status.textContent=text;if(!completed)showExpired();try{wakeLock?.release()?.catch(()=>{})}catch{}wakeLock=null}
function initAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext){audioContext=new Audio();phoneFxGain=audioContext.createGain();phoneFxGain.gain.value=1;phoneFxGain.connect(audioContext.destination)}audioContext?.resume()?.catch(()=>{})}catch{}}
function acknowledgeTicket(){if(link.send("ticket-received",{id:scanId,number:number.textContent})){clearInterval(scanTimer);scanTimer=null}}
function requestTicket(){if(closed||finished||!connected||link.channel?.readyState!=="open")return;if(slotActive){acknowledgeTicket();return}const register=submittedName&&scanReady;link.send(register?"register":"scan",register?{id:scanId,name:submittedName}:{id:scanId})}
function scheduleRingSound(atMs){
 if(!audioContext||phoneSilent)return;
 const start=audioContext.currentTime+Math.max(0,(atMs-performance.now())/1000);
 for(const offset of [0,.22,.6,.82]){const osc=audioContext.createOscillator(),gain=audioContext.createGain(),delay=offset/officeTempo;osc.type="sine";osc.frequency.value=440*officeTempo;gain.gain.setValueAtTime(0,start+delay);gain.gain.linearRampToValueAtTime(.025,start+delay+.02/officeTempo);gain.gain.exponentialRampToValueAtTime(.0001,start+delay+.17/officeTempo);osc.connect(gain).connect(phoneFxGain);ringSources.add(osc);osc.onended=()=>{ringSources.delete(osc);osc.disconnect();gain.disconnect()};osc.start(start+delay);osc.stop(start+delay+.18/officeTempo)}
}
function ringHaptic(){if(closed||finished||phoneSilent||call.hidden||resolved)return;try{navigator.vibrate?.([240,150,240,150,240].map(ms=>Math.round(ms/officeTempo)))}catch{}}
function nextRing(atMs){ringCadence={remainingMs:2800,atMs};ringTimer=setTimeout(()=>repeatRing(performance.now()),Math.max(0,atMs+2800/officeTempo-performance.now()))}
function repeatRing(atMs){ringTimer=null;ringCadence=null;if(closed||finished||call.hidden||resolved)return;ringHaptic();scheduleRingSound(atMs);nextRing(atMs)}
function incomingCall(message){
 if(message.round!==armedRound||!slotActive||currentCall||phoneSilent||finished||closed||document.hidden)return;
 const receivedAt=performance.now(),leadMs=message.leadMs;let target=null,mode="receipt";
 if(Number.isFinite(message.ringAtPhoneMs)&&message.ringAtPhoneMs>=receivedAt-12000&&message.ringAtPhoneMs<=receivedAt+4400){target=message.ringAtPhoneMs;mode="peer"}
 else if(Number.isSafeInteger(message.ringAtUtcMs)&&clockService?.usable?.(clockAnchor,receivedAt)){const proposed=clockService.monoAt(clockAnchor,message.ringAtUtcMs);if(proposed>=receivedAt-12000&&proposed<=receivedAt+4400){target=proposed;mode="utc"}}
 if(target===null)target=receivedAt+leadMs;
 const lateMs=Math.min(12000,Math.max(0,Math.round(receivedAt-target))),ringAtMs=Math.max(receivedAt,target);
 currentCall=message.id;currentRound=armedRound;armedRound=0;resolved="";policeIndex=-1;openingPoliceLine=message.line;openingGreeting=message.greeting||"";callState.textContent=copy.ringing;
 committedRingAtMs=ringAtMs;scheduleRingSound(ringAtMs);link.send("call-scheduled",{id:currentCall,round:currentRound,atMs:ringAtMs,mode,lateMs});
 const show=()=>{callStartTimer=null;committedRingAtMs=null;if(closed||finished||resolved||!slotActive||document.hidden||!currentRound)return;answer.hidden=false;decline.hidden=false;choices.hidden=false;activeControls.hidden=true;call.hidden=false;document.body.classList.add("amt-phone-in-call");const atMs=performance.now();link.send("call-ringing",{id:currentCall,round:currentRound,atMs});ringHaptic();nextRing(atMs)};
 if(ringAtMs-receivedAt<15)show();else callStartTimer=setTimeout(show,ringAtMs-receivedAt);
}
let wakeLock=null;async function keepAwake(){
 if(closed||finished||document.hidden||wakeLock&&!wakeLock.released)return;
 try{const lock=await navigator.wakeLock?.request("screen");if(!lock)return;if(closed||finished||document.hidden){await lock.release();return}wakeLock=lock}catch{wakeLock=null}
}
function stopStatic(){try{staticSource?.stop()}catch{}for(const node of [staticSource,staticFilter,staticGain])try{node?.disconnect()}catch{}staticSource=staticFilter=staticGain=null}
function startStatic(){if(!audioContext||staticSource)return;const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.32),audioContext.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(.45+.55*Math.random());const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;source.loop=true;source.playbackRate.value=officeTempo;filter.type="bandpass";filter.frequency.value=2200*officeTempo;filter.Q.value=.45;gain.gain.value=.035;source.connect(filter).connect(gain).connect(phoneFxGain);source.start();staticSource=source;staticFilter=filter;staticGain=gain}
function showPolice(text,index,receivedAt=performance.now()){
 if(resolved!=="answer"||finished||closed||call.hidden)return;
 voiceQueue.push({text,index,receivedAt});playNextPolice();
}
function playNextPolice(){
 if(voiceBusy||!voiceQueue.length||resolved!=="answer"||finished||closed||document.hidden||call.hidden)return;
 voiceBusy=true;const {text,index,receivedAt}=voiceQueue.shift(),generation=++voiceGeneration;activePoliceIndex=index;
 const current=()=>generation===voiceGeneration&&!finished&&!closed&&resolved==="answer"&&!call.hidden;
 let startedAt=null,mode="fallback";
 const started=kind=>{if(!current()||startedAt!==null)return;startedAt=performance.now();mode=kind;const readyDelayMs=Math.min(60000,Math.max(0,Math.round(startedAt-receivedAt)));if(kind==="voice")voiceStartupMs=voiceStartupMs===null?readyDelayMs:Math.round(voiceStartupMs*.6+readyDelayMs*.4);const atUtcMs=clockService?.usable?.(clockAnchor,startedAt)?Math.round(clockService.utcAt(clockAnchor,startedAt)):null;link.send("police-start",{index,mode,readyDelayMs,atMs:startedAt,atUtcMs})};
 const finish=()=>{if(!current())return;const endedAt=performance.now();voiceGeneration++;phoneUtterance=null;clearTimeout(cutoffTimer);cutoffTimer=null;clearTimeout(voiceTimer);readableFallback=null;stopRecorded();voiceBusy=false;activePoliceIndex=finishPoliceVoice=null;link.send("police-done",{index,mode,durationMs:Math.min(60000,Math.max(0,Math.round(endedAt-(startedAt??endedAt)))),atMs:endedAt});voiceTimer=setTimeout(playNextPolice,0)};
 finishPoliceVoice=finish;
 const fallback=()=>{if(!current())return;clearTimeout(voiceTimer);started("fallback");readableFallback={remainingMs:Math.max(3500,text.length*55),atMs:performance.now()};voiceTimer=setTimeout(finish,readableFallback.remainingMs/officeTempo)};
 // Live recordings can slow down after onset. Reserve the bounded slowest
 // playback lifetime rather than cutting a valid 0.5x line at the old timeout.
 const playbackLimit=Math.max(20000,text.length*140 )/.5;
 const playRecorded=()=>{
  if(!current())return;
  const catalog=window.GermanySimulatorAudioText,voiceId=catalog?.speechFamilies?.amtPolice?.voiceId||"kriminalpolizei",candidate=catalog?.recordedClip?.(voiceId,text)||catalog?.candidateClip?.(voiceId,text);
  if(!candidate||typeof window.Audio!=="function"){fallback();return}
  const clip=new window.Audio(candidate);recordedSpeech=clip;clip.preload="auto";rateRecording(clip);
  const recordingFailed=()=>{if(recordedSpeech!==clip||!current())return;stopRecorded();fallback()};
  clip.onplaying=()=>{if(recordedSpeech!==clip||!current())return;clearTimeout(voiceTimer);started("recording");voiceTimer=setTimeout(finish,playbackLimit)};
  clip.onended=()=>{if(recordedSpeech===clip)finish()};clip.onerror=recordingFailed;
  voiceTimer=setTimeout(recordingFailed,3000);
  try{Promise.resolve(clip.play()).catch(recordingFailed)}catch{recordingFailed()}
 };
 // Only the name-bearing greeting is synthesized, inside the Answer gesture.
 // Keep a strong reference until native completion; the fixed dialogue is recorded.
 if(index!==-1||!openingGreeting||!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=="function"){playRecorded();return}
 const utterance=phoneUtterance=new SpeechSynthesisUtterance(openingGreeting);utterance.lang="de-DE";utterance.volume=1;utterance.rate=.87*officeTempo;utterance.pitch=.66*officeTempo;
 const voices=speechSynthesis.getVoices();utterance.voice=voices.find(v=>/^de/i.test(v.lang)&&/male|daniel|stefan|markus|martin|thomas|tim/i.test(v.name))||voices.find(v=>/^de/i.test(v.lang))||null;
 let greetingFinished=false;
 const continueOpening=()=>{if(!current()||greetingFinished)return;greetingFinished=true;clearTimeout(voiceTimer);utterance.onstart=utterance.onend=utterance.onerror=null;phoneUtterance=null;try{speechSynthesis.cancel()}catch{}playRecorded()};
 utterance.onstart=()=>{if(!current()||greetingFinished)return;clearTimeout(voiceTimer);started("voice");voiceTimer=setTimeout(continueOpening,Math.max(20000,openingGreeting.length*140)/officeTempo)};
 utterance.onend=utterance.onerror=continueOpening;
 voiceTimer=setTimeout(continueOpening,6000);
 try{speechSynthesis.speak(utterance)}catch{continueOpening()}
}
function endCall(kind){
 if(resolved||!currentCall||call.hidden||!slotActive||finished||closed)return;
 if(!link.send(kind,{id:currentCall,round:currentRound})){if(!atCounter)endSlot("Ihr Platz ist verfallen. Bitte ziehen Sie eine neue Nummer.");else stopCall();link.close();return}
 resolved=kind;stopRing();
 if(kind==="decline"){stopCall();currentCall="";resolved="";}
 else{resetSwipe();answer.hidden=true;decline.hidden=true;choices.hidden=true;call.classList.add("answered");activeControls.hidden=false;hangup.focus?.({preventScroll:true});answeredAt=performance.now();updateDuration();durationTimer=setInterval(updateDuration,1000);initAudio();startStatic();showPolice(openingPoliceLine,-1)}
}
function stopEnding(){const ending=callEnding;callEnding=null;if(!ending)return;clearTimeout(ending.timer);for(const node of ending.nodes){node.onended=null;try{node.stop?.()}catch{}try{node.disconnect()}catch{}}}
function endConversation(){
 if(callEnding||resolved!=="answer"||!currentCall||!currentRound)return;
 const id=currentCall,round=currentRound;stopCall();currentCall="";resolved="hangup";
 const ending=callEnding={id,round,nodes:[],timer:null};
 const finish=mode=>{if(callEnding!==ending)return;stopEnding();if(!closed&&!finished&&!document.hidden)link.send("call-ended",{id,round,mode})};
 ending.timer=setTimeout(()=>finish("fallback"),4000);
 if(!audioContext||audioContext.state!=="running"){finish("fallback");return}
 try{
  const now=audioContext.currentTime,buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.12),audioContext.sampleRate),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/(samples.length*.16));
  const clunk=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),hit=audioContext.createGain(),tone=audioContext.createOscillator(),gain=audioContext.createGain();ending.nodes.push(clunk,filter,hit,tone,gain);
  clunk.buffer=buffer;filter.type="lowpass";filter.frequency.value=1100;hit.gain.value=.3;clunk.connect(filter).connect(hit).connect(phoneFxGain);clunk.start(now);clunk.stop(now+.12);
  tone.type="sine";tone.frequency.value=425;gain.gain.setValueAtTime(0,now+.22);gain.gain.linearRampToValueAtTime(.055,now+.24);gain.gain.setValueAtTime(.055,now+1.8);gain.gain.linearRampToValueAtTime(0,now+1.85);tone.connect(gain).connect(phoneFxGain);tone.onended=()=>finish("sound");tone.start(now+.22);tone.stop(now+1.86);
 }catch{finish("fallback")}
}
hangup.onclick=()=>{if(resolved!=="answer"||!currentCall||!slotActive||finished||closed||call.hidden)return;if(!link.send("hangup",{id:currentCall,round:currentRound})){if(!atCounter)endSlot("Ihr Platz ist verfallen. Bitte ziehen Sie eine neue Nummer.");else stopCall();link.close();return}endConversation()};
link.addEventListener("status",e=>{if(closed)return;if(/getrennt|unterbrochen/i.test(e.detail)){connected=scanReady=false;submit.disabled=!!submittedName;if(slotActive){if(atCounter){phoneSilent=true;stopCall();currentCall=""}else endSlot("Ihr Platz ist verfallen. Bitte ziehen Sie eine neue Nummer.")}}});
link.addEventListener("connected",()=>{if(closed||finished)return;connected=true;scanReady=false;submit.disabled=!!submittedName;if(atCounter){if(document.hidden)link.send("phone-hidden");else if(!offlineState){phoneSilent=false;link.send("phone-visible")}}requestTicket();clearInterval(scanTimer);scanTimer=setInterval(requestTicket,1500)});
link.addEventListener("message",e=>{
 if(closed)return;const m=e.detail;
  if(m.type==="sync-ping"){if(atCounter){if(document.hidden){link.send("phone-hidden");return}if(offlineState)return;phoneSilent=false;link.send("phone-visible")}const receivedAtMs=performance.now();link.send("sync-pong",{id:m.id,receivedAtMs,sentAtMs:performance.now()});return}
 if(m.type==="done"){if(!finished)endSlot("Dieser Termin wurde am Schalter bearbeitet.",true);else stopCall();return}
 if(finished)return;
 if(m.type==="office-tempo")officeRate(m.rate);
 else if(m.type==="scan-ready"){scanReady=true;admission.hidden=!submittedName;submit.disabled=!!submittedName;requestTicket()}
  else if(m.type==="ticket"&&submittedName&&/^[A-Z]{1,2}-\d{1,12}$/.test(m.number||"")&&Number.isInteger(m.counter)&&m.counter>=1&&m.counter<=4){if(slotActive&&number.textContent===m.number){acknowledgeTicket();return}stopCall();phoneSilent=false;atCounter=false;lastRound=0;admission.hidden=true;currentCall="";resolved="";number.textContent=m.number;ticket.hidden=false;form.hidden=true;slotActive=!document.hidden;status.textContent="Achten Sie auf die Aufruftafel im Amt.";if(slotActive){acknowledgeTicket();keepAwake()}else{link.send("phone-hidden");endSlot("Seite verlassen. Ihr Platz ist verfallen.");link.close()}}
 else if(m.type==="queue-call"&&slotActive&&m.number===number.textContent&&Number.isInteger(m.counter)&&m.counter>=1&&m.counter<=4)status.textContent="Ihre Nummer ist aufgerufen. Achten Sie auf die Aufruftafel im Amt.";
 else if(m.type==="forfeit")endSlot("Ihr Platz ist verfallen.");
  else if(m.type==="counter-start"&&slotActive)atCounter=true;
 else if(m.type==="silence"&&slotActive&&m.id==="grass")silenceCalls();
  else if(m.type==="call-arm"&&atCounter&&slotActive&&!phoneSilent&&!document.hidden&&submittedName&&!currentCall&&m.id==="grass"&&m.round>lastRound){lastRound=armedRound=m.round;initAudio();link.send("call-ready",{id:m.id,round:armedRound,atMs:performance.now()})}
  else if(m.type==="call"&&slotActive&&!phoneSilent&&!currentCall&&m.id==="grass"&&m.round===armedRound&&typeof m.line==="string"&&m.line.length<350)incomingCall(m);
  else if(m.type==="call-end"&&slotActive&&m.id===currentCall&&m.round===currentRound)endConversation();
  else if(m.type==="police-line"&&resolved==="answer"&&slotActive&&m.id===undefined&&Number.isInteger(m.index)&&m.index>policeIndex&&m.index>=0&&m.index<4&&typeof m.line==="string"&&m.line.length<350){policeIndex=m.index;showPolice(m.line,m.index,performance.now())}
 else if(m.type==="police-cutoff"&&resolved==="answer"&&slotActive&&Number.isInteger(m.index)&&m.index===activePoliceIndex&&finishPoliceVoice){
  const now=performance.now();let target=Number.isFinite(m.stopAtPhoneMs)?m.stopAtPhoneMs:null;
  if(target===null&&Number.isSafeInteger(m.stopAtUtcMs)&&clockService?.usable?.(clockAnchor,now))target=clockService.monoAt(clockAnchor,m.stopAtUtcMs);
  if(target!==null&&(target<now-12000||target>now+16000))return;
  const generation=voiceGeneration,finish=finishPoliceVoice;clearTimeout(cutoffTimer);
  const cut=()=>{cutoffTimer=null;if(generation!==voiceGeneration||m.index!==activePoliceIndex)return;finish();try{window.speechSynthesis?.cancel()}catch{}};
  if(target===null||target<=now)cut();else cutoffTimer=setTimeout(cut,target-now);
 }
});
form.addEventListener("submit",e=>{
 e.preventDefault();if(closed||finished||submittedName)return;const value=name.value.trim().replace(/\s+/g," ");
 if(value.length<2||value.length>80||/[\u0000-\u001f\u007f]/.test(value))return;initAudio();
 submittedName=value;submit.disabled=true;form.hidden=true;
 admission.hidden=false;admission.textContent="Wartenummer wird zugeteilt.";
 requestTicket();
 window.GermanyFullscreen?.autoEnter();
 keepAwake();
});
function startSwipe(event){
 if(drag||event.isPrimary===false||window.matchMedia?.("(max-width:260px)")?.matches||document.body?.classList?.contains?.("amt-compact"))return;
 const button=event.currentTarget;
 if(callUi==="google"&&button!==answer||callUi!=="google"&&callUi!=="samsung")return;
 const max=callUi==="google"?(track.clientWidth-answer.offsetWidth)/2-6:44;
 if(max<30)return;
 drag={id:event.pointerId,button,startX:event.clientX,startY:event.clientY,dx:0,dy:0,max,moved:false};button.setPointerCapture?.(event.pointerId);
}
function moveSwipe(event){
 if(!drag||event.pointerId!==drag.id||event.currentTarget!==drag.button)return;
 const {button,max}=drag;drag.dx=Math.max(-max,Math.min(max,event.clientX-drag.startX));drag.dy=callUi==="samsung"?Math.max(-max,Math.min(max,event.clientY-drag.startY)):0;
 drag.moved ||= Math.hypot(drag.dx,drag.dy)>8;
 const visualX=callUi==="samsung"?Math.max(-16,Math.min(16,drag.dx)):drag.dx;
 button.style?.setProperty("--amt-swipe-x",visualX+"px");button.style?.setProperty("--amt-swipe-y",Math.max(-16,Math.min(16,drag.dy))+"px");button.classList.add("dragging");
}
function finishSwipe(event,cancelled=false){
 if(!drag||event.pointerId!==drag.id||event.currentTarget!==drag.button)return;
 const {button,dx,dy,max,moved}=drag;resetSwipe();
 if(moved){ignoreClickTarget=button;setTimeout(()=>{if(ignoreClickTarget===button)ignoreClickTarget=null},0)}
 if(cancelled)return;
 if(callUi==="google"&&Math.abs(dx)>=max*.58)endCall(dx>0?"answer":"decline");
 else if(callUi==="samsung"&&Math.hypot(dx,dy)>=32)endCall(button===answer?"answer":"decline");
}
for(const button of [answer,decline]){
 button.addEventListener("pointerdown",startSwipe);button.addEventListener("pointermove",moveSwipe);
 button.addEventListener("pointerup",event=>finishSwipe(event));button.addEventListener("pointercancel",event=>finishSwipe(event,true));
 button.onclick=()=>{if(ignoreClickTarget===button){ignoreClickTarget=null;return}endCall(button===answer?"answer":"decline")};
}
document.getElementById("phone-swipe-label").onclick=()=>endCall("answer");
link.start().catch(()=>{if(!closed&&!finished){submit.disabled=!!submittedName;admission.textContent="Wartenummer derzeit nicht verfügbar. Bitte scannen Sie den QR-Code erneut."}});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&slotActive){link.send("phone-hidden");if(atCounter){phoneSilent=true;stopCall();currentCall="";try{wakeLock?.release()?.catch(()=>{})}catch{}wakeLock=null}else{endSlot("Seite verlassen. Ihr Platz ist verfallen.");link.close()}}
  else if(!document.hidden&&!finished&&!closed&&submittedName&&!offlineState){if(atCounter){phoneSilent=false;link.send("phone-visible")}keepAwake()}
});
window.addEventListener("offline",()=>{offlineState=true;if(!slotActive||closed||finished)return;if(document.hidden)link.send("phone-hidden");phoneSilent=true;stopCall();currentCall="";if(!atCounter){endSlot("Ihr Platz ist verfallen. Bitte ziehen Sie eine neue Nummer.");link.close()}});
window.addEventListener("online",()=>{offlineState=false;if(atCounter&&slotActive&&!closed&&!finished&&!document.hidden){phoneSilent=false;link.send("phone-visible");keepAwake()}});
window.addEventListener("pagehide",()=>{
  if(slotActive){link.send("phone-hidden");if(!atCounter)showExpired()}closed=true;slotActive=false;stopCall();
 clearInterval(scanTimer);try{audioContext?.close()?.catch(()=>{})}catch{}try{wakeLock?.release()?.catch(()=>{})}catch{}link.close();
});
})();
