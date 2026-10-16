import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const game=read('game.js'),world=read('world3d.js'),adapter=read('street-character-sprites.js');
function between(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,'Actual production boundary '+start);return source.slice(a,b)}
let instance=0;
async function fixture(){
  // Import the actual pure adapter without invoking its image, fetch or Three.js APIs.
  const api=await import('data:text/javascript;base64,'+Buffer.from(adapter+'\n// fixture '+instance++).toString('base64'));
  const image={file:'./assets/characters/street/fixture.webp',sha256:'a'.repeat(64),width:16,height:16};
  const clip={offset:0,count:4,seconds:1};
  const person={id:'fixture-person',grid:[4,1],cell:[16,16],pivot:[8,16],figureHeight:16,figureWorldHeight:1.7,strideDistance:17,
    standing:image,clips:Object.fromEntries(['down','right','up','left','idle','talk','wave'].map(name=>[name,{...clip}])),
    motionRig:{file:'./assets/characters/street/fixture-rig.json',sha256:'b'.repeat(64),contactPlayback:{schemaVersion:1},variants:{desktop:image,mobile:image}}};
  const characters=api.registerStreetCharacterManifest({schemaVersion:1,characters:{'fixture-voice':person}});
  const actor={id:'fixture-person',voiceId:'fixture-voice',x:10,y:20,pause:0};
  const binding={profileId:'fixture-profile',referenceSha256:'c'.repeat(64),renderer:'fixture-native',modelRevision:'fixture-model'};
  const recording={...binding,voiceId:actor.voiceId,source:'Guten Tag.',mouthEnergy:Array(30).fill(255),mouthHz:10};
  const item={actor,actorId:actor.id,actorVoiceId:actor.voiceId,actorProfileId:binding.profileId,actorReferenceSha256:binding.referenceSha256,
    actorRenderer:binding.renderer,actorModelRevision:binding.modelRevision,candidateVoiceId:actor.voiceId,actorGeneration:3,actorCueToken:'fixture-cue',
    actorSpeechStatus:'playing',speechStarted:true,recording:'fixture.mp3',text:recording.source,subtitleMode:'recorded',subtitleDuration:3,subtitleElapsed:()=>.5};
  const h={player:{id:'unregistered-player',x:0,y:0},npcs:[actor],police:[],activeStimulus:item,stimulusGeneration:3,
    state:{started:true,modal:true,gameOver:false,voiceOn:true},document:{hidden:false},window:{GermanyHUD:{paused:false},Germany3D:{levelTransition:{active:false}}},
    speechCatalog:{productionVoices:{[actor.voiceId]:binding},recordings:{'fixture.mp3':recording}},audio:{state:'running'},recordedSpeechSource:{},console,
    ...api,charactersFixture:characters,X:x=>x,Z:y=>y,amtReducedMotion:{matches:false}};
  vm.createContext(h);
  const energySource=game.includes('function recordedMouthOpening(')?between(game,'function recordedMouthOpening(','function getNeighborDialogue('):'';
  vm.runInContext(between(game,'let streetMotionObserver=','const speechCatalog=')+energySource+
    between(game,'function speechActorCurrent(','function stimulusEligible('),h);
  // Use the actual bridge setter, native projection, and world observer installation.
  const setter=game.match(/setStreetMotionObserver:observer=>\{streetMotionObserver=observer\}/)?.[0];
  assert(setter,'Actual bridge observer setter');
  vm.runInContext('let streetPaintManifest=charactersFixture;const bridge={'+setter+',player,getPolice:()=>police,getStreetSpeech,stationElevation:()=>0};\n'+
    between(world,'function registeredStreetPaint(','function npcSpriteRequired(')+
    between(world,'function installStreetMotionObserver(','const streetPaintOwner=')+
    '\nglobalThis.installFixture=manifest=>installStreetMotionObserver(manifest);globalThis.finishFixture=dt=>finishStreetSimulationTick(dt);',h);
  h.installFixture(characters);
  const pose=()=>api.advanceStreetAnimation(actor,0,0);
  const react=()=>assert.equal(api.requestStreetReaction(actor,'wave',{preempt:true,token:'reaction-'+instance}),true);
  const tick=dt=>{h.finishFixture(dt);return pose()};
  return {h,actor,item,api,pose,react,tick};
}

test('actual modal observer advances owned native mouth and upper reaction with physical root and gait distance frozen',async()=>{
  const f=await fixture();f.h.state.modal=false;f.actor.x++;
  f.h.notifyStreetAccepted(f.actor,f.actor.x-1,f.actor.y);
  const walking=f.tick(.05),gait=structuredClone(walking.rigPose),before={...f.actor},distance=f.api.inspectStreetSimulation(f.actor).distance;
  assert.equal(walking.moving,true);assert.equal(distance,1);f.h.state.modal=true;f.react();
  const first=f.tick(.1),next=f.tick(.3);
  assert.equal(first.clip,'wave');assert.equal(first.frame,0);assert.equal(next.clip,'wave');assert.equal(next.frame,1);
  assert.equal(next.speechStatus,'playing');assert.equal(next.mouthCue,1);assert.equal(next.cueToken,'fixture-cue');
  assert.equal(next.moving,false);assert.deepEqual(next.rigPose,gait);assert.equal(next.settling,walking.settling);
  assert.deepEqual(f.actor,before);assert.equal(f.api.inspectStreetSimulation(f.actor).distance,distance);
});

for(const [name,hold] of [
  ['HUD pause',h=>{h.window.GermanyHUD.paused=true}],['hidden document',h=>{h.document.hidden=true}],
  ['suspended actual audio',h=>{h.audio.state='suspended'}],['level transition',h=>{h.window.Germany3D.levelTransition.active=true}],
  ['game not started',h=>{h.state.started=false}],['game over',h=>{h.state.gameOver=true}],
])test('actual modal observer closes mouth and freezes upper reaction during '+name,async()=>{
  const f=await fixture();f.react();f.tick(.1);hold(f.h);const held=f.tick(.3);
  assert.equal(held.speechStatus,'paused');assert.equal(held.mouthCue,0);assert.equal(held.frame,0);assert.equal(held.moving,false);
  assert.equal(f.api.inspectStreetSimulation(f.actor).distance,0);
});

test('native audio resume during modal resumes the same owned cue and upper reaction',async()=>{
  const f=await fixture();f.react();f.tick(.1);f.h.audio.state='suspended';f.tick(.3);f.h.audio.state='running';const resumed=f.tick(.3);
  assert.equal(resumed.cueToken,'fixture-cue');assert.equal(resumed.speechStatus,'playing');assert.equal(resumed.mouthCue,1);assert.equal(resumed.frame,1);
});

for(const [name,alter] of [
  ['queued speech',f=>{f.item.speechStarted=false}],['muted voice',f=>{f.h.state.voiceOn=false}],
  ['different actor object',f=>{f.h.activeStimulus={...f.item,actor:{...f.actor}}}],
  ['stale native generation',f=>{f.h.stimulusGeneration++}],['mismatched source recording profile',f=>{f.h.speechCatalog.recordings['fixture.mp3'].profileId='wrong'}],
])test('actual modal observer does not open or advance upper reaction for '+name,async()=>{
  const f=await fixture();f.react();f.tick(.1);alter(f);const held=f.tick(.3);
  assert.equal(held.speaking,false);assert.equal(held.mouthCue||0,0);assert.equal(held.frame,0);
  assert.equal(f.api.inspectStreetSimulation(f.actor).distance,0);
});

test('cancelled cue remains retired through the modal observer',async()=>{
  const f=await fixture();f.tick(.1);f.item.actorSpeechStatus='cancelled';const stopped=f.tick(.1);
  assert.equal(stopped.speechStatus,'cancelled');assert.equal(stopped.mouthCue,0);
  f.item.actorSpeechStatus='playing';const stale=f.tick(.1);assert.equal(stale.speaking,false);assert.equal(stale.mouthCue,0);
});

test('source handover hold retains generation and blocks modal speech animation',async()=>{
  const f=await fixture();f.react();f.tick(.1);assert.equal(f.api.invalidateStreetSimulation(f.actor,'fixture-handover'),true);
  const held=f.tick(.3),inspection=f.api.inspectStreetSimulation(f.actor);
  assert.equal(held.speaking,false);assert.equal(held.mouthCue,0);assert.equal(held.frame,0);
  assert.equal(inspection.held,'fixture-handover');assert.equal(inspection.generation,1);assert.equal(inspection.distance,0);
});

test('legacy caller without speechPaused retains paused upper frame, rig pose, distance and same-cue semantics',async()=>{
  const f=await fixture();f.react();
  const options={rootWorld:[f.actor.x,0,f.actor.y],paused:false,speaking:true,cueToken:'legacy-cue',mediaTime:.5,mediaDuration:3,mouthOpen:.4};
  f.api.tickStreetSimulation(f.actor,.1,options);f.api.tickStreetSimulation(f.actor,.3,options);
  const before=f.pose(),gait=structuredClone(before.rigPose),distance=f.api.inspectStreetSimulation(f.actor).distance,actorBefore={...f.actor};
  assert.equal(before.clip,'wave');assert.equal(before.frame,1);assert.equal(before.speechStatus,'legacy');
  f.api.tickStreetSimulation(f.actor,.4,{...options,paused:true,mediaTime:1,mouthOpen:.9});
  const held=f.pose();
  assert.equal(held.clip,before.clip);assert.equal(held.frame,before.frame);assert.equal(held.slot,before.slot);
  assert.deepEqual(held.rigPose,gait);assert.equal(held.settling,before.settling);assert.deepEqual(f.actor,actorBefore);
  assert.equal(f.api.inspectStreetSimulation(f.actor).distance,distance);
  assert.equal(held.speechStatus,'legacy');assert.equal(held.speaking,true);assert.equal(held.cueToken,'legacy-cue');assert.equal(held.mouthOpen,before.mouthOpen);
});
