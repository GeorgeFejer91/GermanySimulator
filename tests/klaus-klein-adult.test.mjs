import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
const registry=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const actor='stadt-klaus-dieter-klein',p=registry.characters[actor];
const legacy=JSON.parse(readFileSync(`assets/sprite-sources/resident-motion/${actor}/adult-v1/pre-admission-family.json`));
const hash=x=>createHash('sha256').update(x).digest('hex');
const asset=p=>readFileSync(p.replace(/^\.\//,''));

test('Klaus adult preserves his original four quiet actions and full phase-stop capability',()=>{
 assert.equal(p.figureWorldHeight,2.33);assert.equal(p.standingOnly,false);
 registerStreetCharacterManifest(registry);
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);assert.deepEqual(p.grid,[21,21]);
 for(const heading of ['down','right','up','left']){
  assert.equal(p.atlasMotion.walks[heading].frames,16);
  assert.equal(Object.keys(p.atlasMotion.settles[heading]).length,16);
 }
 assert.equal(Object.keys(p.atlasMotion.transitions).length,12);
 const states=p.atlasMotion.interactions.states;
 assert.deepEqual(Object.keys(states).sort(),['failure','idle','look','success','wait']);
 for(const [name,old] of Object.entries(legacy.interactions.states)){
  assert.deepEqual(states[name].durations_ms,old.durations_ms,name);
  for(const property of ['loop','next'])assert.deepEqual(states[name][property],old[property],name+'/'+property);
 }
 assert.equal(states.idle.row,13);assert.equal(states.look.row,18);assert.equal(states.success.row,19);assert.equal(states.failure.row,20);
 assert.equal(new Set(['idle','look','success','failure'].map(name=>states[name].row)).size,4,'distinct original source performance rows');
 assert.deepEqual(states.wait,states.idle,'existing game bridge aliases idle to wait');
});

test('Klaus own source bytes bind lips and bounded selective delivery',()=>{
 assert(p.variants&&p.motionDelivery&&p.mouthPaint,'adult family selected');
 for(const value of [p.standing,...Object.values(p.variants),p.mouthPaint,p.motionDelivery])assert.equal(hash(asset(value.file)),value.sha256);
 const mouth=JSON.parse(asset(p.mouthPaint.file));assert.equal(mouth.frames.length,441);
 assert.equal(mouth.sources.standing,p.standing.sha256);
 for(const [name,variant] of Object.entries(p.variants))assert.equal(mouth.sources[name],variant.sha256);
 for(let phase=0;phase<16;phase++)assert.equal(mouth.frames[p.atlasMotion.walks.up.row*21+phase],null);
 assert(mouth.frames[p.atlasMotion.walks.down.row*21]);
 const delivery=JSON.parse(asset(p.motionDelivery.file));
 const originalMovement=JSON.parse(readFileSync(`assets/sprite-sources/resident-motion/${actor}/adult-v1/movement-preservation.json`));
 for(const [path,digest] of Object.entries(originalMovement.expectedFiles))assert.equal(hash(asset(path)),digest,'348 movement cells remain byte-exact');
 for(const pack of Object.values(delivery.packs))for(const v of Object.values(pack.variants))assert(v.width*v.height*4<=16*1024*1024);
});

test('Klaus original actions terminate through the actual controller from every gait phase',()=>{
 assert(p.atlasMotion,'adult phase controller selected');
 const context={};vm.runInNewContext(readFileSync('character-interactions.js','utf8'),context);
 const controller=context.CharacterInteractions;
 for(const heading of ['down','right','up','left'])for(let phase=0;phase<16;phase++)for(const name of ['idle','wait','look','success','failure']){
  const actor={touristFacing:heading,spriteFrame:phase};
  assert.equal(controller.request(actor,name,p.atlasMotion),true);
  const plan=controller.plan(actor,p.atlasMotion,actor.interactionRequest);
  assert(plan.frames.every(frame=>Number.isFinite(frame.ms)&&frame.ms>0));
  assert(plan.frames.reduce((sum,frame)=>sum+frame.ms,0)<10000);
  actor.characterInteraction=plan;actor.interactionRequest=null;
  for(let ticks=0;actor.characterInteraction;ticks++){
   assert(ticks<600,'quiet action completes within ten simulation seconds');
   controller.advance(actor,1/60,p.atlasMotion);
  }
  assert.equal(actor.touristFacing,heading);assert.equal(actor.gaitDistance,0);
 }
});

test('Klaus retains his exact three existing recordings, voice and native mouth cues',()=>{
 const context={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);
 const catalog=context.window.GermanySimulatorAudioText,binding=catalog.productionVoices[actor];
 assert.equal(binding.profileId,'8182da73a54c429391924d62ee339037');
 const clips=Object.entries(catalog.recordings).filter(([,clip])=>clip.voiceId===actor);assert.equal(clips.length,3);
 const expected=['2889011ae184b9f8593f05ce2262ae5acf9d4c2e92d26c84d8ca977e514d31af','4f983233e8f934cf3ff1f7ec5a21b801876407463a1b2e596f5d942798c324c7','762a969a2a986e0bd4554384a9dca01960fe6b2d0578c9699788f554b1609ad4'];
 for(let i=0;i<clips.length;i++){
  const [path,clip]=clips[i];assert.equal(clip.sha256,expected[i]);assert.equal(hash(asset(path)),clip.sha256);
  assert.equal(clip.profileId,binding.profileId);assert.equal(clip.mouthHz,40);assert(clip.mouthEnergy.some(x=>x>0));
  assert.equal(catalog.candidateClip(actor,clip.source),path);
 }
});
