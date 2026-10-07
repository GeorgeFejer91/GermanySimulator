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

let clock=1000;
const context=vm.createContext({Map,Math,performance:{now:()=>clock}});
vm.runInContext(`
 const stimulusBags=new Map();
 const stimulusQueue=[];
 const state={voiceOn:true};
 const STIMULUS_PRIORITY={CRITICAL:5};
 const AUDIO_MIX={AMBIENT_TTL_MS:4000,MAX_TRANSIENT_QUEUE:4};
 let nextAmbientAt=0,activeStimulus=null;
 function pumpStimuli(){}
 ${sourceOf("nextVariant")}
 ${sourceOf("stimulusEligible")}
 ${sourceOf("chooseStimulusIndex")}
 ${sourceOf("queueStimulus")}
 globalThis.api={nextVariant,chooseStimulusIndex,queueStimulus,pending:stimulusQueue,setAmbientAt:value=>nextAmbientAt=value,setActive:value=>activeStimulus=value};
`,context);

const {nextVariant,chooseStimulusIndex,queueStimulus,pending,setAmbientAt,setActive}=context.api;
const priorities={ambient:1,reactive:2,nearby:3,featured:4,critical:5};
const request=(family,priority,queuedAt,extra={})=>({family,priority,queuedAt,ambient:false,...extra});

let queue=[request("ambient",priorities.ambient,1),request("critical",priorities.critical,4),request("reactive",priorities.reactive,2)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),1,"highest priority must win without interrupting active audio");

queue=[request("self-talk",priorities.reactive,1),request("named-sprite",priorities.featured,2),request("rule",priorities.ambient,3)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),1,"nearby named sprites must outrank self-talk and ordinary ambient audio");

queue=[request("featured",priorities.featured,1),request("nearby-train",priorities.nearby,2),request("reactive",priorities.reactive,3)];
assert.equal(chooseStimulusIndex(queue,new Map(),1000),0,"nearby named characters must outrank nearby trains");

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
queueStimulus({family:"border",priority:priorities.reactive,text:"first crossing"});
queueStimulus({family:"border",priority:priorities.reactive,text:"return crossing"});
assert.equal(pending.filter(item=>item.family==="border").length,1,"repeated border crossings must keep one pending cue");
assert.equal(pending.find(item=>item.family==="border").text,"return crossing");
assert.equal(pending.find(item=>item.family==="border").expiresAt,5000,"noncritical cues expire after four seconds");
setActive({family:"border"});
assert.equal(queueStimulus({family:"border",priority:priorities.reactive,text:"another crossing"}),false,"a speaking border cue must not reserve a replay");
assert.equal(pending.find(item=>item.family==="border").text,"return crossing");
setActive(null);
clock=5001;
assert.equal(chooseStimulusIndex(pending,new Map(),clock),-1,"stale border cues must not play later");
pending.length=0;
clock=6000;
queueStimulus({family:"dialogue",priority:priorities.critical,text:"required"});
for(let index=0;index<6;index++)queueStimulus({family:`crowd-${index}`,priority:priorities.reactive,text:"optional"});
assert.equal(pending.filter(item=>item.priority<priorities.critical).length,4,"the transient queue must stay bounded");
assert.equal(pending.filter(item=>item.priority===priorities.critical).length,1,"required dialogue must survive transient eviction");
queueStimulus({family:"named-character",priority:priorities.featured,text:"featured"});
assert.ok(pending.some(item=>item.family==="named-character"),"a nearby character must replace a lower-priority pending cue");

const variants=["a","b","c","d"],firstCycle=Array.from({length:variants.length},()=>nextVariant("pool",variants)),boundary=nextVariant("pool",variants);
assert.equal(new Set(firstCycle).size,variants.length,"a shuffled bag must exhaust every variant before reshuffling");
assert.notEqual(boundary,firstCycle.at(-1),"a shuffled bag must prevent repeats across bag boundaries");

assert.match(game,/AUDIO_MIX=Object\.freeze\(\{FOREGROUND:1,BACKGROUND:\.22,ATTACK_SECONDS:\.12,RELEASE_SECONDS:\.4,REQUIRED_GAP_MS:250,AMBIENT_GAP_MS:2500,AMBIENT_TTL_MS:4000,FEATURED_GAP_MS:3500,TRAIN_GAP_MS:6500,MAX_TRANSIENT_QUEUE:4\}\)/);
assert.match(game,/STIMULUS_PRIORITY=Object\.freeze\(\{AMBIENT:1,REACTIVE:2,NEARBY:3,FEATURED:4,CRITICAL:5\}\)/);
assert.doesNotMatch(sourceOf("requestTrainAnnouncement"),/if\(stillNearby\)requestTrainAnnouncement/,"a nearby train must not enqueue a second clip from completion");
assert.match(sourceOf("updateTrainAnnouncement"),/performance\.now\(\)(?:<trainAnnouncementNextAt\)return|>=trainAnnouncementNextAt)/,"nearby trains must respect their repeat gap");
let borderCue;
const border=vm.createContext({document:{getElementById:()=>({hidden:true,textContent:""})},clearTimeout:()=>{},setTimeout:()=>1,uiTone:()=>{},updateHud:()=>{},showWorldBark:(...args)=>borderCue=args,STIMULUS_PRIORITY:{REACTIVE:2}});
vm.runInContext(`const BORDER_Y=1680,player={y:1679},state={started:true,modal:false,gameOver:false,region:"berlin"};${sourceOf("regionOf")};${sourceOf("showBorder")};globalThis.api={showBorder,player,state}`,border);
border.api.showBorder("germany");
assert.equal(borderCue[0],"BRANDMAUER");
assert.equal(borderCue[5].family,"border");
assert.equal(borderCue[5].priority,priorities.reactive,"border speech must not join the critical dialogue queue");
assert.equal(borderCue[5].isEligible(),true);
border.api.player.y=1681;
assert.equal(borderCue[5].isEligible(),false,"a queued Germany cue must die after crossing back into Berlin");
border.api.player.y=1400;
assert.equal(borderCue[5].isEligible(),false,"a queued border cue must die after leaving the border area");
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
const quiz=vm.createContext({document:{getElementById:()=>({hidden:false})},uiTone:()=>{},addGermanness:()=>answerOrder.push("score"),showWorldBark:()=>answerOrder.push("sting"),requestCharacterReaction:()=>{},speechClip:()=>({text:"Nein! Nein! Nein!",recording:"quiz.mp3"}),STIMULUS_PRIORITY:{CRITICAL:5}});
vm.runInContext(`const state={quizQuestion:{answer:1,source:"1"},quizCopy:{choices:["wrong","right"]},quizCharacter:{name:"Examiner",title:"Official"},quizVoiceToken:0};${sourceOf("answerCitizenshipQuiz")};answerCitizenshipQuiz(0)`,quiz);
assert.deepEqual(answerOrder,["sting","score"],"the wrong-answer sting must precede score commentary");

console.log("Normalized mixer and stimulus broker contracts OK");
