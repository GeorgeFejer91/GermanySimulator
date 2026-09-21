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
let cancelled=0,finished=0,shown=0;
const context=vm.createContext({
 Math,
 window:{speechSynthesis:{}},
 item,
 finished:()=>finished++,
 SpeechSynthesisUtterance:class{constructor(text){this.text=text}},
 speechSynthesis:{getVoices:()=>[],speak:()=>{},cancel:()=>cancelled++},
 setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length},
 clearTimeout:()=>{}
});
vm.runInContext(`
 const AUDIO_MIX={ATTACK_SECONDS:.12};
 let stimulusTimer,stimulusGeneration=1,activeStimulus=item;
 const voiceHash=()=>0;
 const finishStimulus=()=>finished();
 ${sourceOf("playSyntheticStimulus")}
 playSyntheticStimulus(item,1);
`,context,{filename:"game.js"});

item.start=()=>shown++;
timers.shift().callback();
assert.equal(shown,1,"the exact dialogue text must be shown before synthesized speech is attempted");
const startupWatchdog=timers.find(timer=>timer.delay===1800);
assert.ok(startupWatchdog,"synthetic speech must have a bounded startup watchdog");
startupWatchdog.callback();
assert.equal(cancelled,1,"a stalled browser voice must be cancelled");
assert.equal(finished,1,"a stalled browser voice must release the modal dialogue queue");
assert.match(sourceOf("nextDialogue"),/if\(state\.dialogueVoiceBusy\).*stopSpeech\(\).*setDialogueVoiceBusy\(false\)/,"advancing must cancel an unfinished voice before replacing its text");
assert.doesNotMatch(sourceOf("nextDialogue"),/state\.dialogueVoiceBusy\)return/,"an unfinished voice must not block WEITER or E");

console.log("Stalled or skipped synthesized speech releases navigation OK");
