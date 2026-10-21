import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function productionFunction(name){
 const start=source.indexOf(`function ${name}(`),end=source.indexOf('\nfunction ',start+1);
 assert.ok(start>=0,`${name} production handler exists`);
 return source.slice(start,end<0?source.length:end).split('document.getElementById("dialogue-next").onclick=')[0];
}

function fixture(){
 let now=0,sequence=0,completed=0,resolveRecording;
 const timers=new Map(),nodes=new Map(),actor={id:'jwd-parent',name:'HEIKO MAASLOS',jwdRole:'parent'};
 const line=Array(80).fill('Nachbarschaft').join(' ');
 const dialogue={speaker:actor.name,voiceId:'jwd-heiko-maaslos',actor,lines:[line],subtitles:[],i:0,locked:true,automatic:true,punishmentId:1,lineAge:0,lineComplete:false,captionFallback:false,done(){completed++}};
 const recording=new Promise(resolve=>{resolveRecording=resolve});
 const sources=[];
 const h={
  state:{started:true,voiceOn:true,dialogue:true,modal:true,dialogueData:dialogue,characterSpeaker:actor},
  jwd:{dialogueTickets:new Map(),dialogueTicketSequence:0},npcs:[actor],
  window:{GermanyHUD:{paused:false}},document:{hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)}},
  performance:{now:()=>now},speechCatalog:{voices:{},productionVoices:{}},
  stimulusGeneration:1,stimulusQueue:[],stimulusLastServed:new Map(),STIMULUS_PRIORITY:{CRITICAL:5},AUDIO_CLASS:{TEXT:'text'},AUDIO_MIX:{REQUIRED_GAP_MS:0,ATTACK_SECONDS:.02,FOREGROUND:1},
  textOnlyBark:null,activeStimulus:null,recordedSpeechSource:null,recordedSpeechGain:null,stimulusTimer:null,
  setTimeout(callback,ms){const id=++sequence;timers.set(id,{at:now+ms,callback});return id},clearTimeout(id){timers.delete(id)},
  clearSubtitle(){},setAudioText(){},startSubtitle(){},requestCharacterReaction(){},stopSpeech(){},hideWorldBark(){},pumpStimuli(){},foregroundOutput:()=>({}),
  prepareRecording:()=>recording,stimulusEligible:item=>!item.isEligible||item.isEligible(),
  ensureAudio:()=>({state:'running',get currentTime(){return now/1000},createBufferSource(){const media={connect(){return this},start(){},stop(){},disconnect(){}};sources.push(media);return media},createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){return this},disconnect(){}})})
 };
 // Supply the existing dialogue-to-broker request boundary, with controlled media.
 h.speak=(text,options)=>{h.activeStimulus={text,recording:'missing-or-controlled.mp3',...options};h.playRecordedStimulus(h.activeStimulus,h.stimulusGeneration)};
 vm.createContext(h);
 for(const name of ['jwdVoice','neighborDialogueTicket','setDialogueVoiceBusy','speakDialogueLine','playRecordedStimulus','playCaptionStimulus','finishStimulus','dialogueReadingSeconds','updateJwdPerformance','nextDialogue'])vm.runInContext(productionFunction(name),h);
 const wall=ms=>{
  const target=now+ms;
  while(true){const next=[...timers].filter(([,timer])=>timer.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].callback()}
  now=target;
 };
 // The production frame loop suppresses simulation ticks while hidden or paused.
 const read=seconds=>{if(!h.document.hidden&&!h.window.GermanyHUD.paused)h.updateJwdPerformance(seconds)};
 h.speakDialogueLine(line,()=>{});
 return {h,dialogue,wall,read,sources,resolveRecording,get completed(){return completed}};
}

test('a loading timeout and silent completion retain the full eighty-word reading lock',()=>{
 const f=fixture();f.wall(8000);f.read(16);f.wall(16000);
 assert.equal(f.completed,0,'the silent broker timeout is not completed speech');
 f.read(23.9);assert.equal(f.completed,0,'less than forty active reading seconds cannot release movement');
 f.read(.2);assert.equal(f.completed,1);assert.equal(f.h.state.modal,false);
});

test('hidden and paused wall time cannot consume a failed recording reading fallback',()=>{
 const f=fixture();f.wall(8000);f.h.document.hidden=true;f.wall(16000);f.read(120);
 assert.equal(f.completed,0);assert.equal(f.dialogue.lineAge,0);
 f.h.document.hidden=false;f.h.window.GermanyHUD.paused=true;f.wall(120000);f.read(120);
 assert.equal(f.completed,0);assert.equal(f.dialogue.lineAge,0);
 f.h.window.GermanyHUD.paused=false;f.read(39.9);assert.equal(f.completed,0);
 f.read(.2);assert.equal(f.completed,1);
});

test('the actual recorded ended callback completes a locked lecture',async()=>{
 const f=fixture();f.resolveRecording({duration:12});
 await new Promise(setImmediate);
 assert.equal(f.sources.length,1);assert.equal(f.h.activeStimulus.subtitleMode,'recorded');
 f.read(12);assert.equal(f.completed,0,'elapsed simulation time cannot replace a media receipt');
 f.sources[0].onended();f.read(.01);
 assert.equal(f.completed,1);assert.equal(f.h.state.modal,false);
});

test('a stale delivery cannot finish the dialogue belonging to a new punishment',()=>{
 const f=fixture(),oldDelivery=f.h.activeStimulus;
 const current={...f.dialogue,punishmentId:2,lineAge:0,lineComplete:false,captionFallback:false};
 f.h.state.dialogueData=current;f.h.state.dialogueVoiceToken++;
 f.h.stimulusGeneration++;f.h.activeStimulus={text:'another attempt'};
 f.h.finishStimulus(oldDelivery,1);oldDelivery.done(oldDelivery);f.wall(24000);f.read(1.1);
 assert.equal(current.lineComplete,false);assert.equal(current.captionFallback,false);
 assert.equal(f.completed,0);assert.equal(f.h.state.modal,true);
});
