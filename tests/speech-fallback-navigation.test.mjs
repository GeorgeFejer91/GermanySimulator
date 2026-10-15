import assert from "node:assert/strict";
import vm from "node:vm";
import test from "node:test";
import {readFileSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../For-AI/AUDIO-TEXT-LIBRARY.js",import.meta.url),"utf8");

function sourceOf(name){
 const start=game.indexOf(`function ${name}(`);
 assert.notEqual(start,-1,`${name} is missing`);
 let depth=0,opened=false;
 const signature=game.slice(start).match(/\)\s*\{/);
 assert.ok(signature,`${name} body is missing`);
 const body=game.indexOf("{",start+signature.index);
 for(let index=body;index<game.length;index++){
  if(game[index]==="{"){depth++;opened=true}
  else if(game[index]==="}"&&opened&&--depth===0)return game.slice(start,index+1);
 }
 throw new Error(`${name} has no closing brace`);
}

const timers=[],item={text:"Welcome to Berlin",family:"dialogue"};
let cancelled=0,finished=0,shown=0,utterance,caption="",browserVoices=[];
const spoken=[];
const context=vm.createContext({
 Math,
 performance:{now:()=>100},state:{subtitlesOn:true},
 window:{speechSynthesis:{},GermanySubtitleLayout:{captionAtProgress:(parts,progress)=>parts[Math.min(parts.length-1,Math.floor(progress*parts.length))]}},
 item,stimulusEligible:()=>true,speechCatalog:{productionVoices:{}},
 finished:()=>finished++,
 setSubtitle:value=>caption=value,
 SpeechSynthesisUtterance:class{constructor(text){this.text=text;this.voice=null}},
 speechSynthesis:{getVoices:()=>browserVoices,speak:value=>{utterance=value;spoken.push(value)},cancel:()=>cancelled++},
 setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length},
 clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{}
});
vm.runInContext(catalog,context);
context.speechCatalog=context.window.GermanySimulatorAudioText;
vm.runInContext(`
 let stimulusTimer,stimulusGeneration=1,activeStimulus=item;
 ${sourceOf("voiceHash")}
 ${sourceOf("officialComputerVoice")}
 const startSubtitle=item=>{item.subtitleParts=["Welcome","to","Berlin"]};
 const finishStimulus=()=>finished();
 ${sourceOf("playCaptionStimulus")}
 ${sourceOf("playSyntheticStimulus")}
 playSyntheticStimulus(item,1);
`,context,{filename:"game.js"});

item.start=()=>shown++;
assert.ok(utterance,"speech must be requested immediately from the start interaction");
assert.equal(shown,0,"the dialogue box must wait for the actual speech start");
utterance.onstart();
assert.equal(shown,1,"the exact dialogue text must appear when synthesized speech starts");
utterance.onboundary({charIndex:12});
assert.equal(caption,"Berlin","word boundaries must advance the measured subtitle parts");
utterance.onend();
assert.equal(finished,1,"speech completion must release the dialogue queue");

const stalled={text:"Another line",family:"dialogue",start:()=>shown++};
context.item=stalled;
vm.runInContext("activeStimulus=item;playSyntheticStimulus(item,1)",context);
const startupWatchdog=timers.filter(timer=>timer.delay===4000).at(-1);
assert.ok(startupWatchdog,"synthetic speech must have a bounded startup watchdog");
startupWatchdog.callback();
assert.equal(cancelled,1,"a stalled browser voice must be cancelled");
assert.equal(shown,2,"a failed voice must still reveal its readable text once");
assert.equal(finished,1,"the readable fallback owns the caption until its bounded reading finishes");
const captionReading=timers.filter(timer=>timer.delay===3200).at(-1);assert.ok(captionReading);captionReading.callback();
assert.equal(finished,2,"the bounded caption reading releases the modal dialogue queue");

browserVoices=[{lang:"de-DE",name:"Remote German",localService:false}];
const failedVoice={text:"A third line",family:"dialogue",start:()=>shown++};
context.item=failedVoice;
vm.runInContext("activeStimulus=item;playSyntheticStimulus(item,1)",context);
const firstAttempt=utterance;
firstAttempt.onerror({error:"voice-unavailable"});
assert.equal(spoken.length,4,"an unavailable selected voice must retry the same line once");
assert.notEqual(utterance,firstAttempt,"the retry needs a fresh utterance");
assert.equal(utterance.voice,null,"the retry must use the browser's default voice");
assert.equal(utterance.text,failedVoice.text,"the fallback must speak the exact displayed line");
utterance.onstart();
assert.equal(shown,3,"the fallback line must reveal only when it starts");
utterance.onend();

const hedda={lang:"de-DE",name:"Microsoft Hedda - German (Germany)",voiceURI:"hedda",localService:true};
const katja={lang:"de-DE",name:"Microsoft Katja Online (Natural) - German",voiceURI:"katja",localService:false};
const conrad={lang:"de-DE",name:"Microsoft Conrad",voiceURI:"conrad",localService:true,default:true};
const zira={lang:"en-US",name:"Microsoft Zira - English (United States)",voiceURI:"zira",localService:true};
function narrate(text,voiceKey,lang="de-DE"){
 context.item={text,voiceKey,lang,candidateVoiceId:"narrator",family:"dialogue"};
 vm.runInContext("activeStimulus=item;playSyntheticStimulus(item,1)",context);
 return utterance;
}
for(const voices of [[conrad,katja,hedda],[hedda,conrad,katja]]){
 browserVoices=voices;
 for(const key of ["HUM-01/DE READING OFFICE","HUM-01/DE FINE PRINT OFFICE","WELCOME TO BERLIN","FINANZAMT","FAX 3000 PRO","SUBTITLE AUTHORITY"]){
  const line=narrate("Vorgang wird bearbeitet.",key);
  assert.equal(line.voice,hedda,"official readings share the local female voice across titles and voice-list order");
  assert.equal(line.rate,.93,"official readings retain the old HUM-01 rate");
  assert.equal(line.pitch,.895,"official readings retain the old HUM-01 pitch");
  line.onstart();line.onend();
 }
}
const localKatja={...katja,name:"Microsoft Katja - German (Germany)",voiceURI:"Microsoft Katja - German (Germany)",localService:true};
for(const voices of [[hedda,localKatja,conrad],[conrad,localKatja,hedda]]){
 browserVoices=voices;assert.equal(narrate("Formular.","HUM-01/DE READING OFFICE").voice,localKatja,"the installed legacy form voice Katja is the first choice regardless of list order");utterance.onend();
}
browserVoices=[conrad,katja];assert.equal(narrate("Formular.","FINANZAMT").voice,katja,"a recognized female voice precedes an unrelated local male voice");utterance.onend();
browserVoices=[katja];assert.equal(narrate("Formular.","FINANZAMT").voice,katja,"a German network voice works when no local German voice is installed");utterance.onend();
browserVoices=[hedda,zira];assert.equal(narrate("Form.","HUM-01/DE READING OFFICE","en-US").voice,zira,"English forms keep their existing reading language and female voice preference");utterance.onend();
browserVoices=[hedda];narrate("Formular.","FINANZAMT");const beforeFailure=spoken.length;utterance.onerror({error:"voice-unavailable"});
assert.equal(spoken.length,beforeFailure,"a failed narrator must retain captions instead of changing to another default voice");
browserVoices=[zira];const beforeMissing=spoken.length;narrate("Formular.","FINANZAMT");
assert.equal(spoken.length,beforeMissing,"missing German voices must not read German through an unrelated default language");
const genericA={lang:"de-DE",name:"System German A",voiceURI:"de-a",localService:true};
const genericB={lang:"de-DE",name:"System German B",voiceURI:"de-b",localService:true};
browserVoices=[genericA,{...genericB,default:true}];assert.equal(narrate("Formular.","FINANZAMT").voice.voiceURI,"de-b","unknown system names retain the matching language default");utterance.onend();
for(const voices of [[genericB,genericA],[genericA,genericB]]){
 browserVoices=voices;assert.equal(narrate("Formular.","FINANZAMT").voice,genericA,"unnamed mobile-system voice lists use stable identity order");utterance.onend();
}

function syntheticRetryFixture(){
 const spoken=[],timers=[],intervals=[],starts=[],completed=[],captions=[],subtitleUpdates=[];
 const c={Math,performance:{now:()=>100},state:{dialogue:false},window:{speechSynthesis:{}},
  SpeechSynthesisUtterance:class{constructor(text){this.text=text;this.voice=null}},
  speechSynthesis:{speaking:true,pending:false,paused:false,
   getVoices:()=>[{lang:"de-DE",name:"Local German",localService:true}],
   speak:value=>spoken.push(value),cancel(){}},
  setTimeout(callback,delay){timers.push({callback,delay,cancelled:false});return timers.length},
  clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true},
  setInterval(callback,delay){intervals.push({callback,delay,cancelled:false});return intervals.length},
  clearInterval(id){if(intervals[id-1])intervals[id-1].cancelled=true},
  stimulusGeneration:1,activeStimulus:null,stimulusTimer:null,stimulusQueue:[],nextAmbientAt:0,
  recordedSpeechSource:null,recordedSpeechGain:null,
  AUDIO_MIX:{REQUIRED_GAP_MS:250,AMBIENT_GAP_MS:1000},
  stimulusEligible:()=>true,setSubtitle(value){subtitleUpdates.push(value)},clearSubtitle(){subtitleUpdates.push(null)},
  startSubtitle(value){captions.push(value.text);value.subtitleParts=[value.text]},
  stopRecordedSpeech(){},setAudioText(){},hideWorldBark(){},cancelHumorScold(){},
  pumpStimuli(){assert.fail("unexpected queued stimulus")}
 };
 vm.createContext(c);vm.runInContext(catalog,c);c.speechCatalog=c.window.GermanySimulatorAudioText;
 vm.runInContext(["voiceHash","officialComputerVoice","finishStimulus","playCaptionStimulus","playSyntheticStimulus","stopSpeech"].map(sourceOf).join("\n"),c);
 return {c,spoken,timers,intervals,starts,completed,captions,subtitleUpdates,
  play(text){const value={text,family:"dialogue",start:()=>starts.push(text),done:()=>completed.push(text)};
   c.activeStimulus=value;c.playSyntheticStimulus(value,c.stimulusGeneration);return value}
 };
}

test("obsolete synthetic error cannot retry after cancellation and replacement",()=>{
 const f=syntheticRetryFixture();f.play("Obsolete line");const obsolete=f.spoken.at(-1);
 f.c.stopSpeech();const replacement=f.play("Current line");
 const spokenBefore=f.spoken.length,timersBefore=f.timers.length;
 obsolete.onerror({error:"network"});
 assert.equal(f.spoken.length,spokenBefore,"obsolete error must not enqueue audible work");
 assert.equal(f.timers.length,timersBefore,"obsolete error must not arm a new watchdog");
 assert.equal(f.c.activeStimulus,replacement);assert.deepEqual(f.starts,[]);assert.deepEqual(f.completed,[]);
 const current=f.spoken.at(-1);current.onstart();current.onend();
 assert.deepEqual(f.starts,["Current line"]);assert.deepEqual(f.completed,["Current line"]);
});

test("started obsolete error clears its timers without touching a replacement",()=>{
 const f=syntheticRetryFixture(),oldItem=f.play("Started obsolete line"),obsolete=f.spoken.at(-1);
 obsolete.onstart();
 const oldInterval=f.intervals.at(-1),oldWatchdog=f.timers.at(-1);
 assert.ok(oldInterval);assert.equal(oldInterval.delay,180);assert.equal(oldInterval.cancelled,false);
 assert.ok(oldWatchdog);assert.equal(oldWatchdog.cancelled,false);
 assert.equal(oldItem.speechStarted,true);assert.deepEqual(f.starts,["Started obsolete line"]);
 f.c.stopSpeech();const replacement=f.play("Replacement line"),current=f.spoken.at(-1);current.onstart();
 const replacementWatchdog=f.timers.at(-1),replacementInterval=f.intervals.at(-1);
 assert.notEqual(replacementInterval,oldInterval);assert.equal(replacementInterval.cancelled,false);
 const spokenBefore=f.spoken.length,timersBefore=f.timers.length,updatesBefore=f.subtitleUpdates.slice();
 obsolete.onerror({error:"network"});
 assert.equal(oldInterval.cancelled,true,"the sole late error must retire its caption interval");
 assert.equal(oldWatchdog.cancelled,true,"the sole late error must retire its watchdog");
 assert.equal(replacementWatchdog.cancelled,false,"replacement watchdog must remain owned by its request");
 assert.equal(replacementInterval.cancelled,false,"replacement caption interval must not be cleared");
 assert.equal(f.timers.length,timersBefore);assert.equal(f.spoken.length,spokenBefore);
 assert.equal(f.c.activeStimulus,replacement);assert.deepEqual(f.completed,[]);
 assert.deepEqual(f.starts,["Started obsolete line","Replacement line"]);assert.deepEqual(f.subtitleUpdates,updatesBefore);
 // Deliver an already queued interval tick after retirement; no utterance onend is supplied.
 oldInterval.callback();assert.deepEqual(f.subtitleUpdates,updatesBefore);assert.deepEqual(f.completed,[]);
 current.onend();
 assert.deepEqual(f.starts,["Started obsolete line","Replacement line"]);
 assert.deepEqual(f.completed,["Replacement line"]);assert.equal(f.c.activeStimulus,null);
});

test("finished prestart attempt cannot retry while its caption reading owns the item",()=>{
 const f=syntheticRetryFixture(),item=f.play("Readable fallback");const obsolete=f.spoken.at(-1);
 f.timers.find(timer=>timer.delay===4000).callback();
 assert.equal(item.subtitleMode,"silent");assert.equal(f.c.activeStimulus,item);
 assert.deepEqual(f.starts,["Readable fallback"]);assert.deepEqual(f.completed,[]);
 const reading=f.timers.find(timer=>timer.delay===3200);assert.ok(reading);
 const spokenBefore=f.spoken.length,timersBefore=f.timers.length;
 obsolete.onerror({error:"voice-unavailable"});
 assert.equal(f.spoken.length,spokenBefore,"finished synthetic attempt must not restart speech over its caption");
 assert.equal(f.timers.length,timersBefore);assert.equal(reading.cancelled,false);
 assert.equal(f.c.activeStimulus,item);assert.deepEqual(f.completed,[]);
 reading.callback();assert.deepEqual(f.completed,["Readable fallback"]);assert.equal(f.c.activeStimulus,null);
});

test("current unfinished prestart error still retries exact text with the browser default",()=>{
 const f=syntheticRetryFixture(),item=f.play("Current fallback line"),first=f.spoken.at(-1);
 first.onerror({error:"synthesis-failed"});
 assert.equal(f.spoken.length,2);const fallback=f.spoken.at(-1);
 assert.notEqual(fallback,first);assert.equal(fallback.voice,null);assert.equal(fallback.text,item.text);
 for(const key of ["lang","rate","pitch","volume"])assert.equal(fallback[key],first[key]);
 assert.equal(f.c.activeStimulus,item);assert.deepEqual(f.starts,[]);assert.deepEqual(f.completed,[]);
 fallback.onstart();fallback.onend();fallback.onend();
 assert.deepEqual(f.starts,[item.text]);assert.deepEqual(f.completed,[item.text]);assert.equal(f.c.activeStimulus,null);
});

let idleCancel=0,activeCancel=0;
const stopContext=vm.createContext({
 state:{dialogue:false},
 window:{speechSynthesis:{}},speechSynthesis:{speaking:false,pending:false,cancel:()=>idleCancel++},
 clearTimeout:()=>{},stimulusQueue:[],stimulusTimer:null,stimulusGeneration:0,activeStimulus:null,
 stopRecordedSpeech:()=>{},setAudioText:()=>{},clearSubtitle:()=>{},hideWorldBark:()=>{},cancelHumorScold:()=>{}
});
vm.runInContext(`${sourceOf("stopSpeech")};stopSpeech()`,stopContext);
assert.equal(idleCancel,0,"opening a new dialogue must not cancel an idle speech engine");
stopContext.speechSynthesis.speaking=true;
stopContext.speechSynthesis.cancel=()=>activeCancel++;
vm.runInContext("stopSpeech()",stopContext);
assert.equal(activeCancel,1,"replacing active speech must still cancel it");

const order=[],recorded={text:"Recorded line",recording:"line.mp3",start:()=>order.push("text")};
let resumeAudio;
const recordingContext=vm.createContext({
 setTimeout:()=>1,clearTimeout:()=>{},item:recorded,stimulusEligible:()=>true,prepareRecording:()=>Promise.resolve({duration:2}),
 ensureAudio:()=>({state:"suspended",resume:()=>new Promise(resolve=>resumeAudio=resolve),currentTime:0,
  createBufferSource:()=>({connect:target=>target,start:()=>order.push("audio")}),
  createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect:target=>target})}),
 foregroundOutput:()=>({}),startSubtitle:()=>order.push("subtitle"),
 playSyntheticStimulus:()=>{throw new Error("unexpected fallback")},finishStimulus:()=>{}
});
vm.runInContext(`const AUDIO_CLASS={TEXT:"audio-text"},AUDIO_MIX={ATTACK_SECONDS:.12,FOREGROUND:1};let stimulusGeneration=1,activeStimulus=item,recordedSpeechSource,recordedSpeechGain;${sourceOf("playRecordedStimulus")};playRecordedStimulus(item,1)`,recordingContext);
await new Promise(resolve=>setImmediate(resolve));
assert.deepEqual(order,[],"recorded text must wait for the audio context to resume");
resumeAudio();
await new Promise(resolve=>setImmediate(resolve));
assert.deepEqual(order,["audio","text","subtitle"],"recorded dialogue must reveal in its source-start task");

assert.match(sourceOf("nextDialogue"),/if\(state\.dialogueVoiceBusy\).*stopSpeech\(\).*setDialogueVoiceBusy\(false\)/,"advancing must cancel an unfinished voice before replacing its text");
assert.doesNotMatch(sourceOf("nextDialogue"),/state\.dialogueVoiceBusy\)return/,"an unfinished voice must not block WEITER or E");

console.log("Synthetic speech fallback and dialogue cancellation OK");

const captionLibraryContext={window:{}};
vm.runInNewContext(readFileSync(new URL("../For-AI/AUDIO-TEXT-LIBRARY.js",import.meta.url),"utf8"),captionLibraryContext);
const captionLibrary=captionLibraryContext.window.GermanySimulatorAudioText;
const cityCaption=captionLibrary.cityDialogue["city-ute-ruhe"];
assert.ok(cityCaption?.germany?.length===2,"the ordinary city caption fixture must use current authored rows");
const recordedCaption=voiceId=>{
 const clip=Object.values(captionLibrary.clips).find(clip=>clip.voiceId===voiceId&&clip.recording&&clip.english);
 assert.ok(clip,`current authored ${voiceId} recording is required`);
 return {text:clip.text,english:clip.english};
};

function captionDialogueFixture(){
 const elements=new Map(),pending=[],classes=()=>{
  const values=new Set();return {add:(...names)=>names.forEach(name=>values.add(name)),remove:(...names)=>names.forEach(name=>values.delete(name)),
   toggle(name,on){if(on??!values.has(name))values.add(name);else values.delete(name)}};
 };
 const element=id=>{
  if(!elements.has(id))elements.set(id,{textContent:"",hidden:true,disabled:false,dataset:{},scrollTop:0,classList:classes()});
  return elements.get(id);
 };
 let completed=0,sourceStops=0;
 const c={state:{voiceOn:false,lang:"en",region:"germany",subtitlesOn:true,dialogue:false,modal:false},
  window:{},document:{getElementById:element,querySelector:element},performance:{now:()=>100},
  activeStimulus:null,textOnlyBark:null,recordedSpeechSource:null,recordedSpeechGain:null,stimulusTimer:null,stimulusGeneration:0,stimulusQueue:[],subtitleFrame:0,
  speechCatalog:captionLibrary,audioTextLibrary:captionLibrary,subtitleEnglish:new Map(),dynamicEnglishSubtitle:()=>"",
  STIMULUS_PRIORITY:{AMBIENT:1,REACTIVE:2,CRITICAL:3},jwd:{tour:null,allocated:false,met:new Set()},
  player:{x:0,y:0},jwdLane:{x:0,y:0,w:300,h:300},
  setTimeout(callback,delay){pending.push({callback,delay,cancelled:false});return pending.length},
  clearTimeout(id){if(pending[id-1])pending[id-1].cancelled=true},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  uiTone(){},cancelHumorScold(){},setAudioText(){},requestCharacterReaction(){},
  queueStimulus(value){c.activeStimulus=value;value.start?.()},speechClip:id=>captionLibrary.clips[id],
 };
 vm.createContext(c);
 vm.runInContext(["neighborActivityActive","citySpeechAllowed","englishSubtitle","clearSubtitle","setSubtitle","startSubtitle","speak","speakRecorded","speakMerkelLine","speakMerzLine",
  "stopRecordedSpeech","hideWorldBark","stopSpeech","showWorldBark","openDialogue","setDialogueVoiceBusy","speakDialogueLine","renderDialogue","nextDialogue"].map(sourceOf).join("\n"),c);
 const merkelStart=game.indexOf("MERKEL_RECORDINGS=Object.freeze(");
 assert.notEqual(merkelStart,-1,"authored Merkel recordings map is required");
 vm.runInContext(game.match(/^const MERZ_RECORDINGS=.*$/m)[0]+"\nconst "+game.slice(merkelStart,game.indexOf("\n",merkelStart)),c);
 return {c,element,pending,
  open:(speaker="FRAU RUHE",lines=cityCaption.germany,voiceId=cityCaption.voiceId)=>c.openDialogue(speaker,lines.map(line=>line.text),"!",()=>completed++,voiceId,lines.map(line=>line.english)),
  source:()=>({onended:()=>{},stop(){sourceStops++}}),
  get completed(){return completed},get sourceStops(){return sourceStops}};
}

for(const [speaker,voiceId,line]of [
 ["FRAU RUHE",cityCaption.voiceId,cityCaption.germany[0]],
 ["FRIEDRICH MERZ · SATIRE","merz",recordedCaption("merz")],
 ["ANGELA MERKEL · SATIRE","merkel",recordedCaption("merkel")],
])test(`voice-off ${voiceId} final close retires its caption and stale callback`,()=>{
 const f=captionDialogueFixture();f.open(speaker,[line],voiceId);
 const packet=f.c.state.dialogueData,token=f.c.state.dialogueVoiceToken,pending=f.pending.at(-1);
 assert.equal(f.element("english-subtitle").textContent,line.english);
 assert.equal(f.c.textOnlyBark.text,line.text);assert.equal(f.c.state.dialogueVoiceBusy,false);
 f.c.nextDialogue();
 assert.equal(f.c.state.dialogue,false);assert.equal(f.c.state.modal,false);assert.equal(f.completed,1);
 assert.equal(f.c.textOnlyBark,null,"early acknowledgement must retire its own caption");
 assert.equal(f.element("english-subtitle").hidden,true);assert.equal(f.element("english-subtitle").textContent,"");
 assert.ok(pending.cancelled,"early acknowledgement must cancel its reading timer");
 // Deliberate retained-callback delivery challenges ownership; this is not a real timer race.
 pending.callback();assert.equal(packet.lineComplete,false,"obsolete callback must not complete a closed packet");assert.equal(f.completed,1);assert.ok(f.c.state.dialogueVoiceToken>token);
 f.open(speaker,[line],voiceId);const replacement=f.c.textOnlyBark;pending.callback();
 assert.equal(f.c.textOnlyBark,replacement);assert.equal(f.c.state.dialogueData.lineComplete,false);
 assert.equal(f.element("english-subtitle").textContent,line.english);
});

test("voice-off next page keeps new caption when a cancelled callback is delivered",()=>{
 const f=captionDialogueFixture();f.open();const old=f.pending.at(-1);
 f.c.nextDialogue();const current=f.c.textOnlyBark;
 assert.ok(old.cancelled);assert.equal(f.c.state.dialogueData.i,1);assert.equal(current.text,cityCaption.germany[1].text);
 old.callback();assert.equal(f.c.textOnlyBark,current);assert.equal(f.c.state.dialogueData.lineComplete,false);
 assert.equal(f.element("english-subtitle").textContent,cityCaption.germany[1].english);assert.equal(f.completed,0);
});

test("closing voice-off dialogue preserves an unrelated train source and caption",()=>{
 const f=captionDialogueFixture();f.open("FRAU RUHE",[cityCaption.germany[0]]);
 const train={family:"train",text:"Independent train announcement"},source=f.source();
 f.c.activeStimulus=train;f.c.recordedSpeechSource=source;
 f.c.showWorldBark("BAHN",train.text,false,"","",{subtitle:"Independent train caption",family:"train"});
 const foreign=f.c.textOnlyBark,pending=f.pending.at(-1);f.c.nextDialogue();
 assert.equal(f.c.activeStimulus,train);assert.equal(f.c.recordedSpeechSource,source);assert.equal(f.sourceStops,0);
 assert.equal(f.c.textOnlyBark,foreign);assert.equal(f.element("english-subtitle").textContent,"Independent train caption");
 assert.equal(pending.cancelled,false);assert.equal(f.completed,1);
});

test("voice-on final acknowledgement still cancels its active recording",()=>{
 const f=captionDialogueFixture();f.c.state.voiceOn=true;f.open("FRAU RUHE",[cityCaption.germany[0]]);
 assert.equal(f.c.state.dialogueVoiceBusy,true);const token=f.c.state.dialogueVoiceToken;
 const source=f.source();f.c.recordedSpeechSource=source;f.c.nextDialogue();
 assert.equal(f.sourceStops,1);assert.equal(source.onended,null);assert.equal(f.c.activeStimulus,null);
 assert.equal(f.c.recordedSpeechSource,null);assert.ok(f.c.state.dialogueVoiceToken>token);assert.equal(f.completed,1);
});
