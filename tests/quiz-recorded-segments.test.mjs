import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../For-AI/AUDIO-TEXT-LIBRARY.js",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("../assets/voices/quiz-segments/manifest.json",import.meta.url),"utf8"));
function sourceOf(source,name){
 const start=source.indexOf(`function ${name}(`);
 assert.notEqual(start,-1);
 let depth=0,opened=false;
 for(let i=start;i<source.length;i++){
  if(source[i]==="{"){depth++;opened=true}
  else if(source[i]==="}"&&opened&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error(`${name} is incomplete`);
}

const lookup=vm.createContext({});
vm.runInContext(`const candidatePreviewEnabled=true,quizSegmentDialogue={"quiz-brigitte-neumann\\u0000approach":"a.mp3","quiz-brigitte-neumann\\u0000context":"b.mp3","quiz-brigitte-neumann\\u0000question":"c.mp3"},candidateDialogue={};${sourceOf(catalog,"candidateSequence")};globalThis.find=candidateSequence`,lookup);
assert.deepEqual(Array.from(lookup.find("quiz-brigitte-neumann",["approach","context","question"])),["a.mp3","b.mp3","c.mp3"]);
assert.equal(lookup.find("quiz-brigitte-neumann",["approach","context","missing"]),null,"a partial prompt must use the full browser voice");
assert.equal(lookup.find("another-voice",["approach","context","question"]),null,"segments must all belong to the selected character");
const lookupOff=vm.createContext({});
vm.runInContext(`const candidatePreviewEnabled=false,quizSegmentDialogue={"quiz-brigitte-neumann\\u0000approach":"a.mp3"},candidateDialogue={};${sourceOf(catalog,"candidateSequence")};globalThis.find=candidateSequence`,lookupOff);
assert.equal(lookupOff.find("quiz-brigitte-neumann",["approach"]),null,"ordinary gameplay must keep browser speech");
assert.equal(manifest.segmentCount,3);
const segmentMap=vm.createContext({Object});
const segmentStart=catalog.indexOf("const quizSegmentDialogue=");
const segmentEnd=catalog.indexOf("function candidateSequence",segmentStart);
assert.ok(segmentStart>=0&&segmentEnd>segmentStart);
vm.runInContext(`${catalog.slice(segmentStart,segmentEnd)};globalThis.segments=quizSegmentDialogue`,segmentMap);
for(const clip of manifest.clips){
 const bytes=readFileSync(new URL(`../${clip.path}`,import.meta.url));
 assert.equal(createHash("sha256").update(bytes).digest("hex"),clip.sha256,`${clip.clipId} hash drift`);
 assert.equal(segmentMap.segments[clip.voiceId+"\u0000"+clip.text],clip.path,`${clip.clipId} must be bound to its exact owner and words`);
 assert.ok(game.includes(clip.text),`${clip.clipId} no longer matches authored dialogue`);
 assert.equal(clip.asrWordExact,true);
}

const started=[],events=[];
const audio={state:"running",currentTime:10,createBufferSource:()=>({connect:target=>target,start:when=>started.push(when),stop(){events.push("stop")}}),createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect:target=>target})};
const item={text:"approach context question",recordingSequence:["a.mp3","b.mp3","c.mp3"],start:()=>events.push("reveal")};
const playback=vm.createContext({
 item,Promise,Array,ensureAudio:()=>audio,foregroundOutput:()=>({}),
 prepareRecording:path=>Promise.resolve({duration:{"a.mp3":1,"b.mp3":2,"c.mp3":3}[path]}),
 startSubtitle:()=>events.push("subtitle"),finishStimulus:()=>events.push("done"),
 playSyntheticStimulus:()=>events.push("synthetic")
});
vm.runInContext(`const AUDIO_CLASS={TEXT:"audio-text"},AUDIO_MIX={ATTACK_SECONDS:.12,FOREGROUND:1};let stimulusGeneration=1,activeStimulus=item,recordedSpeechSource=null,recordedSpeechGain=null;${sourceOf(game,"playRecordedStimulus")};${sourceOf(game,"stopRecordedSpeech")};globalThis.api={playRecordedStimulus,stopRecordedSpeech,sources:()=>recordedSpeechSource};playRecordedStimulus(item,1)`,playback);
await new Promise(resolve=>setImmediate(resolve));
assert.deepEqual(started,[10,11.08,13.16],"quiz clips must start in prompt order with a short gap");
assert.equal(item.subtitleDuration,6.16,"subtitle timing must span the whole composite prompt");
assert.deepEqual(events,["reveal","subtitle"],"the quiz must reveal once when audio is scheduled");
assert.equal(playback.api.sources().length,3);
playback.api.sources().at(-1).onended();
assert.deepEqual(events,["reveal","subtitle","done"],"the broker must complete after the last segment");
playback.api.stopRecordedSpeech();
assert.equal(events.filter(event=>event==="stop").length,3,"cancellation must stop every queued segment");

const broken={text:"whole quiz prompt",recordingSequence:["a.mp3","missing.mp3"]};
const fallback=vm.createContext({
 item:broken,Promise,Array,ensureAudio:()=>audio,foregroundOutput:()=>({}),
 prepareRecording:path=>path==="missing.mp3"?Promise.reject(new Error("404")):Promise.resolve({duration:1}),
 startSubtitle:()=>{},finishStimulus:()=>{},playSyntheticStimulus:received=>events.push(received.text)
});
vm.runInContext(`const AUDIO_CLASS={TEXT:"audio-text"},AUDIO_MIX={ATTACK_SECONDS:.12,FOREGROUND:1};let stimulusGeneration=1,activeStimulus=item,recordedSpeechSource=null,recordedSpeechGain=null;${sourceOf(game,"playRecordedStimulus")};playRecordedStimulus(item,1)`,fallback);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(events.at(-1),"whole quiz prompt","a missing segment must replay the complete text through browser speech");

console.log("Composite quiz recording and fallback contracts OK");
