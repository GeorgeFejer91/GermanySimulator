(function(){"use strict";
const invitation=BuergeramtLink.fromHash(),number=document.getElementById("phone-number"),status=document.getElementById("phone-status"),connection=document.getElementById("phone-connect-status"),form=document.getElementById("phone-form"),name=document.getElementById("phone-name"),submit=document.getElementById("phone-submit"),ticket=document.getElementById("phone-ticket"),call=document.getElementById("phone-call"),line=document.getElementById("phone-call-line"),answer=document.getElementById("phone-answer"),decline=document.getElementById("phone-decline");
const platform=navigator.userAgentData?.platform||navigator.userAgent||"";document.documentElement.dataset.phoneOs=/Android/i.test(platform)?"android":/iPhone|iPad|iOS/i.test(platform)?"ios":"generic";
const clock=document.getElementById("phone-time");function updateClock(){clock.textContent=new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit"}).format(new Date())}updateClock();const clockTimer=setInterval(updateClock,30000);window.addEventListener("pagehide",()=>clearInterval(clockTimer));
if(!invitation){connection.textContent="Dieser Aufruf hat keine gültige Warteschlange.";form.hidden=true;return}
const link=new BuergeramtLink("phone",invitation);let currentCall="",resolved="",policeIndex=-1,audioContext=null,staticSource=null,voiceGeneration=0,submittedName="",slotActive=false,finished=false,closed=false,voiceBusy=false,voiceTimer=null,ringTimer=null;
const voiceQueue=[],ringSources=new Set();
function stopRing(){clearInterval(ringTimer);ringTimer=null;for(const source of ringSources){try{source.stop()}catch{}}ringSources.clear();try{navigator.vibrate?.(0)}catch{}}
function stopCall(){voiceGeneration++;voiceQueue.length=0;voiceBusy=false;clearTimeout(voiceTimer);voiceTimer=null;stopStatic();stopRing();try{window.speechSynthesis?.cancel()}catch{}call.hidden=true;answer.hidden=true;decline.hidden=true}
function endSlot(text){slotActive=false;finished=true;submit.disabled=true;stopCall();status.textContent=text;try{wakeLock?.release()?.catch(()=>{})}catch{}wakeLock=null}
function initAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext)audioContext=new Audio();audioContext?.resume()?.catch(()=>{})}catch{}}
function ringPhone(){
 if(!audioContext||closed||finished||call.hidden||resolved)return;
 const now=audioContext.currentTime;
 for(const offset of [0,.22,.6,.82]){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type="sine";osc.frequency.value=440;gain.gain.setValueAtTime(0,now+offset);gain.gain.linearRampToValueAtTime(.025,now+offset+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.17);osc.connect(gain).connect(audioContext.destination);ringSources.add(osc);osc.onended=()=>{ringSources.delete(osc);osc.disconnect();gain.disconnect()};osc.start(now+offset);osc.stop(now+offset+.18)}
}
let wakeLock=null;async function keepAwake(){
 if(closed||finished||document.hidden||wakeLock&&!wakeLock.released)return;
 try{const lock=await navigator.wakeLock?.request("screen");if(!lock)return;if(closed||finished||document.hidden){await lock.release();return}wakeLock=lock}catch{wakeLock=null}
}
function stopStatic(){try{staticSource?.stop()}catch{}staticSource=null}
function startStatic(){if(!audioContext)return;stopStatic();const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.32),audioContext.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(.45+.55*Math.random());const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;source.loop=true;filter.type="bandpass";filter.frequency.value=2200;filter.Q.value=.45;gain.gain.value=.035;source.connect(filter).connect(gain).connect(audioContext.destination);source.start();staticSource=source}
function showPolice(text){
 if(resolved!=="answer"||finished||closed||call.hidden)return;
 voiceQueue.push(text);playNextPolice();
}
function playNextPolice(){
 if(voiceBusy||!voiceQueue.length||resolved!=="answer"||finished||closed||document.hidden||call.hidden)return;
 voiceBusy=true;const text=voiceQueue.shift(),generation=++voiceGeneration;
 const current=()=>generation===voiceGeneration&&!finished&&!closed&&resolved==="answer"&&!call.hidden;
 const show=()=>{if(current()){line.textContent=text;line.hidden=false}};
 const finish=()=>{if(!current())return;voiceGeneration++;clearTimeout(voiceTimer);stopStatic();voiceBusy=false;voiceTimer=setTimeout(playNextPolice,250)};
 const fallback=()=>{if(!current())return;clearTimeout(voiceTimer);show();voiceTimer=setTimeout(finish,Math.max(3500,text.length*55))};
 if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=="function"){fallback();return}
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang="de-DE";utterance.rate=.87;utterance.pitch=.66;utterance.volume=.9;
 const voices=speechSynthesis.getVoices();utterance.voice=voices.find(v=>/^de/i.test(v.lang)&&/male|daniel|stefan|markus|martin|thomas|tim/i.test(v.name))||voices.find(v=>/^de/i.test(v.lang))||null;
 utterance.onstart=()=>{if(!current())return;clearTimeout(voiceTimer);show();startStatic();voiceTimer=setTimeout(()=>{if(current()){speechSynthesis.cancel();finish()}},Math.max(20000,text.length*140))};
 utterance.onend=finish;utterance.onerror=()=>{if(current()){stopStatic();fallback()}};
 voiceTimer=setTimeout(()=>{if(current()){speechSynthesis.cancel();fallback()}},5000);
 requestAnimationFrame(()=>{if(current()){try{speechSynthesis.speak(utterance)}catch{clearTimeout(voiceTimer);fallback()}}});
}
function endCall(kind){
 if(resolved||!currentCall||!slotActive||finished||closed)return;
 if(!link.send(kind,{id:currentCall})){endSlot("Verbindung verloren. Ihr Platz ist verfallen.");link.close();return}
 resolved=kind;stopRing();
 if(kind==="decline"){stopCall();status.textContent="Anruf abgelehnt. Der Termin läuft weiter."}
 else{answer.hidden=true;decline.hidden=true;initAudio();showPolice(line.textContent);status.textContent="Anruf angenommen."}
}
link.addEventListener("status",e=>{if(closed)return;connection.textContent=e.detail;if(/getrennt|unterbrochen/i.test(e.detail)){submit.disabled=true;if(slotActive)endSlot("Verbindung verloren. Ihr Platz ist verfallen.")}});
link.addEventListener("connected",()=>{if(closed||finished)return;submit.disabled=!!submittedName;connection.textContent="Mit dem Amt verbunden.";if(submittedName&&!link.send("register",{name:submittedName})){submittedName="";submit.disabled=false}});
link.addEventListener("message",e=>{
 if(closed)return;const m=e.detail;
 if(m.type==="done"){if(!finished)endSlot("Dieser Termin wurde am Schalter bearbeitet.");else stopCall();return}
 if(finished)return;
 if(m.type==="ticket"&&/^B-\d{3}$/.test(m.number||"")){number.textContent=m.number;ticket.hidden=false;form.hidden=true;status.textContent="Bitte am Anmeldeschalter aktivieren. Bis zum Aufruf geöffnet und sichtbar lassen.";connection.textContent="Anmeldung eingegangen."}
 else if(m.type==="activated"){
  slotActive=!document.hidden;
  if(!slotActive){link.send("phone-hidden");endSlot("Seite verlassen. Ihr Platz ist verfallen.");link.close()}
  else status.textContent="Aktiviert. Diese Seite geöffnet und sichtbar lassen, bis Ihre Nummer aufgerufen wird.";
 }else if(m.type==="forfeit")endSlot("Ihr Platz ist verfallen.");
 else if(m.type==="call"&&slotActive&&!currentCall&&m.id==="grass"&&typeof m.line==="string"&&m.line.length<350){
  currentCall=m.id;resolved="";policeIndex=-1;line.textContent=m.line;line.hidden=true;answer.hidden=false;decline.hidden=false;call.hidden=false;
  try{navigator.vibrate?.([240,150,240,150,240]);ringPhone();ringTimer=setInterval(ringPhone,2800)}catch{}
 }else if(m.type==="police-line"&&resolved==="answer"&&slotActive&&m.id===undefined&&Number.isInteger(m.index)&&m.index>policeIndex&&m.index>=0&&m.index<3&&typeof m.line==="string"&&m.line.length<350){policeIndex=m.index;showPolice(m.line)}
});
form.addEventListener("submit",e=>{
 e.preventDefault();if(closed||finished||submittedName)return;const value=name.value.trim().replace(/\s+/g," ");
 if(value.length<2||value.length>80||!link.send("register",{name:value}))return;
 submittedName=value;submit.disabled=true;connection.textContent="Anmeldung wird geprüft.";initAudio();
 try{document.documentElement.requestFullscreen?.({navigationUI:"hide"})?.catch(()=>{})}catch{}keepAwake();
});
answer.onclick=()=>endCall("answer");decline.onclick=()=>endCall("decline");
link.start().catch(e=>{if(!closed&&!finished){submit.disabled=true;connection.textContent="Verbindung fehlgeschlagen: "+e.message}});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden&&slotActive){link.send("phone-hidden");endSlot("Seite verlassen. Ihr Platz ist verfallen.");link.close()}
 else if(!document.hidden&&!finished&&!closed&&submittedName)keepAwake();
});
window.addEventListener("pagehide",()=>{
 if(slotActive)link.send("phone-hidden");closed=true;slotActive=false;stopCall();
 try{audioContext?.close()?.catch(()=>{})}catch{}try{wakeLock?.release()?.catch(()=>{})}catch{}link.close();
});
})();
