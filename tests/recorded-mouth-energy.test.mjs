// Production functions in a pure VM; no media or image decoding.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../game.js',import.meta.url),'utf8');
function section(start,end){
 const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'production function boundary changed');
 return source.slice(from,to);
}
const sampler=section('function recordedMouthOpening(','function getNeighborDialogue(');
const neighbor=section('function getNeighborDialogue(','\nwindow.Germany3DBridge=');
const ownership=section('function speechActorCurrent(','function getStreetSpeech(');
const street=section('function getStreetSpeech(','function stimulusEligible(');

function fixture(){
 let elapsed=.1;
 const actor={id:'owned-actor-fixture',voiceId:'quiz-hartmut-keller',jwdRole:'neighbor'};
 const binding={profileId:'profile-fixture',referenceSha256:'reference-fixture',renderer:'renderer-fixture',modelRevision:'revision-fixture'};
 const clip={voiceId:actor.voiceId,...binding,source:'Exact owned line',mouthEnergy:[0,255,255],mouthHz:10};
 const token=Object.freeze({id:'cue-fixture'}),item={actor,actorId:actor.id,actorVoiceId:actor.voiceId,
  actorProfileId:binding.profileId,actorReferenceSha256:binding.referenceSha256,actorRenderer:binding.renderer,
  actorModelRevision:binding.modelRevision,actorGeneration:7,actorCueToken:token,actorSpeechStatus:'playing',
  cueToken:token,family:'dialogue',recording:'fixture.mp3',text:clip.source,clip,
  subtitleMode:'recorded',speechStarted:true,subtitleDuration:5,subtitleElapsed:()=>elapsed};
 const state={voiceOn:true,dialogue:true,characterSpeaker:actor,dialogueVoiceToken:token,
  dialogueData:{lines:[clip.source],i:0}};
 const context=vm.createContext({Math,Number,Object,activeStimulus:item,state,npcs:[actor],stimulusGeneration:7,
  speechCatalog:{productionVoices:{[actor.voiceId]:binding},recordings:{'fixture.mp3':clip}},
  recordedSpeechSource:{},audio:{state:'running'},document:{hidden:false},window:{GermanyHUD:{paused:false}},
  speechSynthesis:{paused:false}});
 vm.runInContext(sampler+neighbor+ownership+street,context);
 return {actor,binding,clip,item,state,context,setElapsed:value=>{elapsed=value},
  sample:(data,time)=>context.recordedMouthOpening(data,time),
  street:()=>context.getStreetSpeech(actor),neighbor:()=>context.getNeighborDialogue()};
}

test('finite energy uses its real half-open sample range and closes gaps/truncated tails',()=>{
 const f=fixture(),clip={mouthEnergy:[0,128,255],mouthHz:10};
 assert.equal(f.sample(clip,.1),128/255);
 assert.equal(f.sample(clip,.299),1);
 assert.equal(f.sample(clip,.3),0);
 assert.equal(f.sample(clip,1.2),0);
 assert.equal(f.sample({mouthEnergy:[0,,255],mouthHz:10},.1),0);
 assert.equal(f.sample({mouthEnergy:[0,0,255],mouthHz:10},.3),0);
});

test('invalid clocks, rates and samples close without inventing energy',()=>{
 const f=fixture();
 for(const time of [-1,NaN,Infinity,-Infinity])assert.equal(f.sample(f.clip,time),0);
 for(const hz of [0,-1,NaN,Infinity,'10',null])assert.equal(f.sample({...f.clip,mouthHz:hz},.1),0);
 for(const value of [undefined,NaN,Infinity,'255',null])assert.equal(f.sample({mouthEnergy:[value],mouthHz:10},0),0);
 assert.equal(f.sample({mouthEnergy:[],mouthHz:10},0),0);
 assert.equal(f.sample(null,.1),0);
 assert.equal(f.sample({...f.clip,mouthHz:Number.MAX_VALUE},Number.MAX_VALUE),0);
 assert.equal(f.sample({mouthEnergy:[-20],mouthHz:10},0),0);
 assert.equal(f.sample({mouthEnergy:[510],mouthHz:10},0),1);
});

test('street native clock/cue remains playing while a shorter real envelope closes',()=>{
 const f=fixture();
 assert.equal(f.street().mouthOpen,1);
 f.setElapsed(1.2);
 const result=f.street();
 assert.equal(result.mouthOpen,0);
 assert.equal(result.speechStatus,'playing');
 assert.equal(result.mediaTime,1.2);
 assert.equal(result.mediaDuration,5);
 assert.equal(result.cueToken,f.item.actorCueToken);
 f.clip.mouthEnergy=[0,,255];f.setElapsed(.1);
 assert.equal(f.street().mouthOpen,0);
});

test('street pause, finished/cancelled and speaker/profile rejection keep their old ownership',()=>{
 const f=fixture();
 f.context.audio.state='suspended';
 assert.equal(f.street().speechStatus,'paused');assert.equal(f.street().mouthOpen,0);
 f.context.audio.state='running';
 for(const status of ['finished','cancelled']){
  f.item.actorSpeechStatus=status;
  const result=f.street();assert.equal(result.speechStatus,status);assert.equal(result.mouthOpen,0);assert.equal(result.mediaTime,0);
 }
 f.item.actorSpeechStatus='playing';f.actor.voiceId='another-speaker';assert.equal(f.street(),null);
 f.actor.voiceId='quiz-hartmut-keller';f.binding.profileId='changed-profile';assert.equal(f.street(),null);
});

test('neighbor shares finite bounds while retaining its native pause snapshot and absent-envelope contract',()=>{
 const f=fixture();
 assert.equal(f.neighbor().mouthOpen,1);assert.equal(f.state.neighborSpeechTime,.1);
 f.context.audio.state='suspended';f.setElapsed(.2);
 const paused=f.neighbor();assert.equal(paused.paused,true);assert.equal(paused.mediaTime,.1);assert.equal(paused.mouthOpen,1);
 f.context.audio.state='running';f.setElapsed(1.2);
 assert.equal(f.neighbor().mouthOpen,0);assert.equal(f.neighbor().mediaTime,1.2);
 f.clip.mouthEnergy=[0,,255];f.setElapsed(.1);assert.equal(f.neighbor().mouthOpen,0);
 f.clip.mouthEnergy=undefined;assert.equal(f.neighbor().mouthOpen,undefined);
 f.state.voiceOn=false;assert.equal(f.neighbor().mouthOpen,0);
});
