(function(){"use strict";
const invitation=BuergeramtLink.fromHash(),number=document.getElementById("phone-number"),status=document.getElementById("phone-status"),connection=document.getElementById("phone-connect-status"),form=document.getElementById("phone-form"),name=document.getElementById("phone-name"),submit=document.getElementById("phone-submit"),ticket=document.getElementById("phone-ticket"),call=document.getElementById("phone-call"),line=document.getElementById("phone-call-line"),answer=document.getElementById("phone-answer"),decline=document.getElementById("phone-decline"),track=document.getElementById("phone-answer-track"),callState=document.getElementById("phone-call-state");
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
const copy=callLanguage==="en"?{ringing:"INCOMING CALL",connected:"CONNECTED",caller:"Unknown number",answer:"ANSWER",decline:"DECLINE",answeredStatus:"Call answered.",declinedStatus:"Call declined. The appointment continues."}:{ringing:"EINGEHENDER ANRUF",connected:"VERBUNDEN",caller:"Unbekannte Nummer",answer:"ANNEHMEN",decline:"ABLEHNEN",answeredStatus:"Anruf angenommen.",declinedStatus:"Anruf abgelehnt. Der Termin läuft weiter."};
call.lang=callLanguage;callState.textContent=copy.ringing;document.getElementById("phone-caller").textContent=copy.caller;document.getElementById("phone-answer-label").textContent=copy.answer;document.getElementById("phone-decline-label").textContent=copy.decline;document.getElementById("phone-swipe-label").textContent=copy.answer;
const clockService=window.BuergeramtClock;let clockAnchor=null;
const clock=document.getElementById("phone-time");function updateClock(){const utc=clockService?.usable?.(clockAnchor)?clockService.utcAt(clockAnchor,performance.now()):Date.now();clock.textContent=new Intl.DateTimeFormat(callLanguage,{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(utc))}updateClock();const clockTimer=setInterval(updateClock,30000);window.addEventListener("pagehide",()=>clearInterval(clockTimer));
if(!invitation){connection.textContent="Dieser Aufruf hat keine gültige Warteschlange.";form.hidden=true;return}
clockService?.sample?.().then(anchor=>{clockAnchor=anchor;updateClock()}).catch(()=>{});
const link=new BuergeramtLink("phone",invitation),scanId=Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,"0")).join("");let currentCall="",resolved="",policeIndex=-1,audioContext=null,phoneFxGain=null,staticSource=null,voiceGeneration=0,submittedName="",slotActive=false,finished=false,closed=false,voiceBusy=false,voiceTimer=null,ringTimer=null,callStartTimer=null,armedCall=false,scanTimer=null,voiceStartupMs=null,voiceAttempts=0,drag=null,ignoreClickTarget=null;
const voiceQueue=[],ringSources=new Set();
function stopRing(){clearTimeout(ringTimer);clearTimeout(callStartTimer);ringTimer=callStartTimer=null;for(const source of ringSources){try{source.stop()}catch{}}ringSources.clear();try{navigator.vibrate?.(0)}catch{}}
function resetSwipe(){drag=null;for(const button of [answer,decline]){button.style?.removeProperty("--amt-swipe-x");button.style?.removeProperty("--amt-swipe-y");button.classList.remove("dragging")}}
function stopCall(){voiceGeneration++;voiceQueue.length=0;voiceBusy=false;clearTimeout(voiceTimer);voiceTimer=null;stopStatic();stopRing();armedCall=false;resetSwipe();try{window.speechSynthesis?.cancel()}catch{}call.classList.remove("answered");callState.textContent=copy.ringing;call.hidden=true;answer.hidden=true;decline.hidden=true}
function endSlot(text){slotActive=false;finished=true;submit.disabled=true;clearInterval(scanTimer);scanTimer=null;stopCall();status.textContent=text;try{wakeLock?.release()?.catch(()=>{})}catch{}wakeLock=null}
function initAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext){audioContext=new Audio();phoneFxGain=audioContext.createGain();phoneFxGain.gain.value=1;phoneFxGain.connect(audioContext.destination)}audioContext?.resume()?.catch(()=>{})}catch{}}
function requestTicket(){if(closed||finished||slotActive||link.channel?.readyState!=="open")return;if(!link.send("scan",{id:scanId}))connection.textContent="Wartenummer wird erneut angefordert."}
function scheduleRingSound(atMs){
 if(!audioContext)return;
 const start=audioContext.currentTime+Math.max(0,(atMs-performance.now())/1000);
 for(const offset of [0,.22,.6,.82]){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type="sine";osc.frequency.value=440;gain.gain.setValueAtTime(0,start+offset);gain.gain.linearRampToValueAtTime(.025,start+offset+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+offset+.17);osc.connect(gain).connect(phoneFxGain);ringSources.add(osc);osc.onended=()=>{ringSources.delete(osc);osc.disconnect();gain.disconnect()};osc.start(start+offset);osc.stop(start+offset+.18)}
}
function ringHaptic(){if(closed||finished||call.hidden||resolved)return;try{navigator.vibrate?.([240,150,240,150,240])}catch{}}
function repeatRing(atMs){if(closed||finished||call.hidden||resolved)return;ringHaptic();const next=atMs+2800;scheduleRingSound(next);ringTimer=setTimeout(()=>repeatRing(next),Math.max(0,next-performance.now()))}
function incomingCall(message){
 if(!armedCall||!slotActive||currentCall||finished||closed)return;
 const receivedAt=performance.now(),leadMs=message.leadMs;let target=null,mode="receipt";
 if(Number.isFinite(message.ringAtPhoneMs)&&message.ringAtPhoneMs>=receivedAt-12000&&message.ringAtPhoneMs<=receivedAt+5000){target=message.ringAtPhoneMs;mode="peer"}
 else if(Number.isSafeInteger(message.ringAtUtcMs)&&clockService?.usable?.(clockAnchor,receivedAt)){const proposed=clockService.monoAt(clockAnchor,message.ringAtUtcMs);if(proposed>=receivedAt-12000&&proposed<=receivedAt+5000){target=proposed;mode="utc"}}
 if(target===null)target=receivedAt+leadMs;
 const lateMs=Math.min(12000,Math.max(0,Math.round(receivedAt-target))),ringAtMs=Math.max(receivedAt,target);
 currentCall=message.id;armedCall=false;resolved="";policeIndex=-1;line.textContent=message.line;line.hidden=true;callState.textContent=copy.ringing;
 scheduleRingSound(ringAtMs);link.send("call-scheduled",{id:currentCall,atMs:ringAtMs,mode,lateMs});
 const show=()=>{callStartTimer=null;if(closed||finished||resolved||!slotActive)return;answer.hidden=false;decline.hidden=false;call.hidden=false;ringHaptic();const next=ringAtMs+2800;scheduleRingSound(next);ringTimer=setTimeout(()=>repeatRing(next),Math.max(0,next-performance.now()))};
 if(ringAtMs-receivedAt<15)show();else callStartTimer=setTimeout(show,ringAtMs-receivedAt);
}
let wakeLock=null;async function keepAwake(){
 if(closed||finished||document.hidden||wakeLock&&!wakeLock.released)return;
 try{const lock=await navigator.wakeLock?.request("screen");if(!lock)return;if(closed||finished||document.hidden){await lock.release();return}wakeLock=lock}catch{wakeLock=null}
}
function stopStatic(){try{staticSource?.stop()}catch{}staticSource=null}
function startStatic(){if(!audioContext)return;stopStatic();const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.32),audioContext.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(.45+.55*Math.random());const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;source.loop=true;filter.type="bandpass";filter.frequency.value=2200;filter.Q.value=.45;gain.gain.value=.035;source.connect(filter).connect(gain).connect(phoneFxGain);source.start();staticSource=source}
function showPolice(text,index,receivedAt=performance.now()){
 if(resolved!=="answer"||finished||closed||call.hidden)return;
 voiceQueue.push({text,index,receivedAt});playNextPolice();
}
function playNextPolice(){
 if(voiceBusy||!voiceQueue.length||resolved!=="answer"||finished||closed||document.hidden||call.hidden)return;
 voiceBusy=true;const {text,index,receivedAt}=voiceQueue.shift(),generation=++voiceGeneration;
 const current=()=>generation===voiceGeneration&&!finished&&!closed&&resolved==="answer"&&!call.hidden;
 let startedAt=null,mode="fallback";
 const started=kind=>{if(!current()||startedAt!==null)return;startedAt=performance.now();mode=kind;const readyDelayMs=Math.min(60000,Math.max(0,Math.round(startedAt-receivedAt)));if(kind==="voice")voiceStartupMs=voiceStartupMs===null?readyDelayMs:Math.round(voiceStartupMs*.6+readyDelayMs*.4);link.send("police-start",{index,mode,readyDelayMs,atMs:startedAt})};
 const show=()=>{if(current()){line.textContent=text;line.hidden=false}};
 const finish=()=>{if(!current())return;const endedAt=performance.now();voiceGeneration++;clearTimeout(voiceTimer);stopStatic();voiceBusy=false;link.send("police-done",{index,mode,durationMs:Math.min(60000,Math.max(0,Math.round(endedAt-(startedAt??endedAt)))),atMs:endedAt});voiceTimer=setTimeout(playNextPolice,0)};
 const fallback=()=>{if(!current()||startedAt!==null&&mode==="fallback")return;clearTimeout(voiceTimer);mode="fallback";show();started("fallback");voiceTimer=setTimeout(finish,Math.max(3500,text.length*55))};
 if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=="function"){fallback();return}
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=.87;utterance.pitch=.66;utterance.volume=1;
 const voices=speechSynthesis.getVoices();utterance.voice=voices.find(v=>/^de/i.test(v.lang)&&/male|daniel|stefan|markus|martin|thomas|tim/i.test(v.name))||voices.find(v=>/^de/i.test(v.lang))||null;
 utterance.onstart=()=>{if(!current()||startedAt!==null)return;clearTimeout(voiceTimer);show();started("voice");startStatic();voiceTimer=setTimeout(()=>{if(current()){speechSynthesis.cancel();finish()}},Math.max(20000,text.length*140))};
 utterance.onend=()=>{if(mode==="voice")finish()};utterance.onerror=()=>{if(current()&&(startedAt===null||mode==="voice")){stopStatic();fallback()}};
 const startupLimit=voiceStartupMs===null?(voiceAttempts===0?1800:1200):Math.max(1200,Math.min(2500,Math.round(voiceStartupMs*3+500)));voiceAttempts++;
 voiceTimer=setTimeout(()=>{if(current()){speechSynthesis.cancel();fallback()}},startupLimit);
 requestAnimationFrame(()=>{if(current()){try{speechSynthesis.speak(utterance)}catch{clearTimeout(voiceTimer);fallback()}}});
}
function endCall(kind){
 if(resolved||!currentCall||!slotActive||finished||closed)return;
 if(!link.send(kind,{id:currentCall})){endSlot("Verbindung verloren. Ihr Platz ist verfallen.");link.close();return}
 resolved=kind;stopRing();
 if(kind==="decline"){stopCall();status.textContent=copy.declinedStatus}
 else{resetSwipe();answer.hidden=true;decline.hidden=true;call.classList.add("answered");callState.textContent=copy.connected;initAudio();showPolice(line.textContent,-1);status.textContent=copy.answeredStatus}
}
link.addEventListener("status",e=>{if(closed)return;connection.textContent=e.detail;if(/getrennt|unterbrochen/i.test(e.detail)){submit.disabled=true;if(slotActive)endSlot("Verbindung verloren. Ihr Platz ist verfallen.")}});
link.addEventListener("connected",()=>{if(closed||finished)return;submit.disabled=!!submittedName;connection.textContent="Mit dem Amt verbunden. Wartenummer wird zugeteilt.";requestTicket();clearInterval(scanTimer);scanTimer=setInterval(requestTicket,1500)});
link.addEventListener("message",e=>{
 if(closed)return;const m=e.detail;
 if(m.type==="sync-ping"){const receivedAtMs=performance.now();link.send("sync-pong",{id:m.id,receivedAtMs,sentAtMs:performance.now()});return}
 if(m.type==="done"){if(!finished)endSlot("Dieser Termin wurde am Schalter bearbeitet.");else stopCall();return}
 if(finished)return;
 if(m.type==="ticket"&&/^B-\d{3}$/.test(m.number||"")){if(slotActive&&number.textContent===m.number)return;clearInterval(scanTimer);scanTimer=null;stopCall();currentCall="";resolved="";number.textContent=m.number;ticket.hidden=false;form.hidden=!!submittedName;slotActive=!document.hidden;status.textContent="Wartenummer zugeteilt. Achten Sie auf die rote Aufruftafel im Amt.";connection.textContent="Mit der Warteschlange verbunden.";if(slotActive)keepAwake();else{link.send("phone-hidden");endSlot("Seite verlassen. Ihr Platz ist verfallen.");link.close()}}
 else if(m.type==="forfeit")endSlot("Ihr Platz ist verfallen.");
 else if(m.type==="call-arm"&&slotActive&&submittedName&&!currentCall&&m.id==="grass"){armedCall=true;initAudio();link.send("call-ready",{id:m.id,atMs:performance.now()})}
 else if(m.type==="call"&&slotActive&&!currentCall&&m.id==="grass"&&typeof m.line==="string"&&m.line.length<350)incomingCall(m);
 else if(m.type==="police-line"&&resolved==="answer"&&slotActive&&m.id===undefined&&Number.isInteger(m.index)&&m.index>policeIndex&&m.index>=0&&m.index<3&&typeof m.line==="string"&&m.line.length<350){policeIndex=m.index;showPolice(m.line,m.index,performance.now())}
});
form.addEventListener("submit",e=>{
 e.preventDefault();if(closed||finished||submittedName)return;const value=name.value.trim().replace(/\s+/g," ");
 if(value.length<2||value.length>80)return;initAudio();
 if(!link.send("register",{name:value}))return;
 submittedName=value;submit.disabled=true;form.hidden=true;connection.textContent="Name zur Wartenummer eingetragen.";
 try{document.documentElement.requestFullscreen?.({navigationUI:"hide"})?.catch(()=>{})}catch{}
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
link.start().catch(e=>{if(!closed&&!finished){submit.disabled=true;connection.textContent="Verbindung fehlgeschlagen: "+e.message}});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden&&slotActive){link.send("phone-hidden");endSlot("Seite verlassen. Ihr Platz ist verfallen.");link.close()}
 else if(!document.hidden&&!finished&&!closed&&submittedName)keepAwake();
});
window.addEventListener("pagehide",()=>{
 if(slotActive)link.send("phone-hidden");closed=true;slotActive=false;stopCall();
 clearInterval(scanTimer);try{audioContext?.close()?.catch(()=>{})}catch{}try{wakeLock?.release()?.catch(()=>{})}catch{}link.close();
});
})();
