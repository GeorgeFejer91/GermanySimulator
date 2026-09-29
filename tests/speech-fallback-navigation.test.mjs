import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");

function sourceOf(name){
 const start=game.indexOf(`function ${name}(`);
 assert.notEqual(start,-1,`${name} is missing`);
 let depth=0,opened=false;
 for(let index=start;index<game.length;index++){
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
 item,
 finished:()=>finished++,
 setSubtitle:value=>caption=value,
 SpeechSynthesisUtterance:class{constructor(text){this.text=text;this.voice=null}},
 speechSynthesis:{getVoices:()=>browserVoices,speak:value=>{utterance=value;spoken.push(value)},cancel:()=>cancelled++},
 setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length},
 clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{}
});
vm.runInContext(`
 let stimulusTimer,stimulusGeneration=1,activeStimulus=item;
 const voiceHash=()=>0;
 const startSubtitle=item=>{item.subtitleParts=["Welcome","to","Berlin"]};
 const finishStimulus=()=>finished();
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
assert.equal(finished,2,"a stalled browser voice must release the modal dialogue queue");

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

let idleCancel=0,activeCancel=0;
const stopContext=vm.createContext({
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
 item:recorded,prepareRecording:()=>Promise.resolve({duration:2}),
 ensureAudio:()=>({state:"suspended",resume:()=>new Promise(resolve=>resumeAudio=resolve),currentTime:0,
  createBufferSource:()=>({connect:target=>target,start:()=>order.push("audio")}),
  createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect:target=>target})}),
 foregroundOutput:()=>({}),startSubtitle:()=>order.push("subtitle"),
 playSyntheticStimulus:()=>{throw new Error("unexpected fallback")},finishStimulus:()=>{}
});
vm.runInContext(`const AUDIO_CLASS={TEXT:"audio-text"},AUDIO_MIX={ATTACK_SECONDS:.12,FOREGROUND:1};let stimulusGeneration=1,activeStimulus=item,recordedSpeechSource,recordedSpeechGain;${sourceOf("playRecordedStimulus")};playRecordedStimulus(item,1)`,recordingContext);
await Promise.resolve();
assert.deepEqual(order,[],"recorded text must wait for the audio context to resume");
resumeAudio();
await new Promise(resolve=>setImmediate(resolve));
assert.deepEqual(order,["audio","text","subtitle"],"recorded dialogue must reveal in its source-start task");

assert.match(sourceOf("nextDialogue"),/if\(state\.dialogueVoiceBusy\).*stopSpeech\(\).*setDialogueVoiceBusy\(false\)/,"advancing must cancel an unfinished voice before replacing its text");
assert.doesNotMatch(sourceOf("nextDialogue"),/state\.dialogueVoiceBusy\)return/,"an unfinished voice must not block WEITER or E");

console.log("Synthetic speech fallback and dialogue cancellation OK");
