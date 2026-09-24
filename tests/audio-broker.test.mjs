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

const context=vm.createContext({Map,Math,performance:{now:()=>1000}});
vm.runInContext(`
 const stimulusBags=new Map();
 const stimulusQueue=[];
 const state={voiceOn:true};
 const STIMULUS_PRIORITY={CRITICAL:5};
 const AUDIO_MIX={AMBIENT_TTL_MS:4000};
 let nextAmbientAt=0;
 function pumpStimuli(){}
 ${sourceOf("nextVariant")}
 ${sourceOf("stimulusEligible")}
 ${sourceOf("chooseStimulusIndex")}
 ${sourceOf("queueStimulus")}
 globalThis.api={nextVariant,chooseStimulusIndex,queueStimulus,pending:stimulusQueue,setAmbientAt:value=>nextAmbientAt=value};
`,context);

const {nextVariant,chooseStimulusIndex,queueStimulus,pending,setAmbientAt}=context.api;
const priorities={ambient:1,reactive:2,featured:3,nearby:4,critical:5};
const request=(family,priority,queuedAt,extra={})=>({family,priority,queuedAt,ambient:false,...extra});

let queue=[request("ambient",priorities.ambient,1),request("critical",priorities.critical,4),request("reactive",priorities.reactive,2)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),1,"highest priority must win without interrupting active audio");

queue=[request("self-talk",priorities.reactive,1),request("named-sprite",priorities.featured,2),request("rule",priorities.ambient,3)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),1,"nearby named sprites must outrank self-talk and ordinary ambient audio");

queue=[request("featured",priorities.featured,1),request("nearby",priorities.nearby,2),request("reactive",priorities.reactive,3)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),1,"close-range character and train audio must win the next non-critical slot");

queue=[request("recent",priorities.ambient,1),request("neglected",priorities.ambient,5)];
assert.equal(chooseStimulusIndex(queue,new Map([["recent",8],["neglected",2]]),1000),1,"least-recently-served family must rotate first");

queue=[request("required",priorities.critical,10),request("required",priorities.critical,20)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),0,"required requests in one family must remain FIFO");

queue=[request("expired",priorities.ambient,1,{ambient:true,expiresAt:999}),request("ineligible",priorities.ambient,2,{ambient:true,isEligible:()=>false}),request("ready",priorities.ambient,3,{ambient:true,expiresAt:1001})];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),2,"expired and ineligible ambient requests must be discarded from selection");
setAmbientAt(1100);
assert.equal(chooseStimulusIndex(queue,new Map(),1000),-1,"ambient requests must respect the global ambient gap");
setAmbientAt(0);

queueStimulus({family:"pedestrian",priority:priorities.ambient,ambient:true,text:"old"});
queueStimulus({family:"pedestrian",priority:priorities.ambient,ambient:true,text:"new"});
assert.equal(pending.length,1,"ambient requests must coalesce to one pending item per family");
assert.equal(pending[0].text,"new","the newest eligible ambient request must replace its stale family peer");

const variants=["a","b","c","d"],firstCycle=Array.from({length:variants.length},()=>nextVariant("pool",variants)),boundary=nextVariant("pool",variants);
assert.equal(new Set(firstCycle).size,variants.length,"a shuffled bag must exhaust every variant before reshuffling");
assert.notEqual(boundary,firstCycle.at(-1),"a shuffled bag must prevent repeats across bag boundaries");

assert.match(game,/AUDIO_MIX=Object\.freeze\(\{FOREGROUND:1,BACKGROUND:\.22,ATTACK_SECONDS:\.12,RELEASE_SECONDS:\.4,REQUIRED_GAP_MS:250,AMBIENT_GAP_MS:2500,AMBIENT_TTL_MS:4000\}\)/);
assert.match(game,/STIMULUS_PRIORITY=Object\.freeze\(\{AMBIENT:1,REACTIVE:2,FEATURED:3,NEARBY:4,CRITICAL:5\}\)/);
assert.match(game,/source\.connect\(gain\)\.connect\(foregroundOutput\(\)\)/,"recorded foreground audio must use the shared bus");
assert.match(game,/masterBus\.connect\(limiter\)\.connect\(a\.destination\)/,"Web Audio buses must pass through the shared output limiter");
assert.doesNotMatch(sourceOf("playRecordedStimulus"),/audio\.destination/,"recorded foreground sources must never connect directly to the destination");
assert.doesNotMatch(sourceOf("requestTrainAnnouncement"),/gain|volume/,"train distance must affect eligibility, not accepted playback gain");

let scheduled=0;
const completion=vm.createContext({performance:{now:()=>1000},clearTimeout:()=>{},setTimeout:()=>{scheduled++;return 1},clearSubtitle:()=>{},AUDIO_MIX:{AMBIENT_GAP_MS:2500,REQUIRED_GAP_MS:250}});
vm.runInContext(`
 let activeStimulus=null,stimulusGeneration=0,recordedSpeechSource=null,recordedSpeechGain=null,stimulusTimer=null,nextAmbientAt=0;
 const stimulusQueue=[];
 ${sourceOf("finishStimulus")}
 globalThis.finishWithReplacement=()=>{
  const replacement={family:"next"},old={done:()=>{stimulusGeneration++;activeStimulus=replacement}};
  activeStimulus=old;finishStimulus(old,0);return activeStimulus===replacement;
 };
`,completion);
assert.equal(completion.finishWithReplacement(),true,"a completion callback must not clear the replacement speech cue");
assert.equal(scheduled,0,"a superseded completion must not schedule a second broker pump");

const answerOrder=[];
const quiz=vm.createContext({document:{getElementById:()=>({hidden:false})},uiTone:()=>{},addGermanness:()=>answerOrder.push("score"),showWorldBark:()=>answerOrder.push("sting"),STIMULUS_PRIORITY:{CRITICAL:5}});
vm.runInContext(`const state={quizQuestion:{answer:1,source:"1"},quizCopy:{choices:["wrong","right"]},quizCharacter:{name:"Examiner",title:"Official"},quizVoiceToken:0};${sourceOf("answerCitizenshipQuiz")};answerCitizenshipQuiz(0)`,quiz);
assert.deepEqual(answerOrder,["sting","score"],"the wrong-answer sting must precede score commentary");

console.log("Normalized mixer and stimulus broker contracts OK");
