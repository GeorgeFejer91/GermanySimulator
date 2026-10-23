import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
const registry=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=registry.characters['quiz-sabine-krueger'];
const hash=x=>createHash('sha256').update(x).digest('hex');
const asset=p=>readFileSync(p.replace(/^\.\//,''));
test('Sabine adult paint retains full walking, all phase stops and seven owned actions',()=>{
 assert.equal(p.figureWorldHeight,2.33);assert.equal(p.standingOnly,false);
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);assert.deepEqual(p.grid,[21,18]);
 assert.equal(p.figureHeight,136);assert(p.strideDistance>0);registerStreetCharacterManifest(registry);
 for(const heading of ['down','right','up','left']){
  assert.equal(p.atlasMotion.walks[heading].frames,16);
  assert.equal(Object.keys(p.atlasMotion.settles[heading]).length,16);
  for(let phase=0;phase<16;phase++)assert.deepEqual(p.atlasMotion.settles[heading][phase].frames.at(-1),{row:p.atlasMotion.bridges[heading].row,col:2,ms:70});
 }
 assert.deepEqual(Object.keys(p.atlasMotion.interactions.states).sort(),['failure','greet','look','review','success','wait','work']);
 for(const name of ['greet','review','work'])assert.equal(p.atlasMotion.interactions.states[name].durations_ms.length,16);
 assert.equal(Object.keys(p.atlasMotion.transitions).length,12);
});
test('Sabine adult exact bytes retain own lips and selective movement/reaction delivery',()=>{
 for(const value of [p.standing,...Object.values(p.variants),p.mouthPaint,p.motionDelivery])assert.equal(hash(asset(value.file)),value.sha256);
 const mouth=JSON.parse(asset(p.mouthPaint.file));assert.equal(mouth.frames.length,378);
 assert.equal(mouth.sources.standing,p.standing.sha256);
 for(const [name,variant] of Object.entries(p.variants))assert.equal(mouth.sources[name],variant.sha256);
 for(let phase=0;phase<16;phase++)assert.equal(mouth.frames[p.atlasMotion.walks.up.row*21+phase],null);
 assert(mouth.frames[p.atlasMotion.walks.down.row*21]);
 const delivery=JSON.parse(asset(p.motionDelivery.file));
 assert.equal(delivery.packs.movement.slots.filter(x=>x!==null).length,348);
 assert.equal(delivery.packs.reactions.slots.filter(x=>x!==null).length,17);
 assert.equal(registry.characters['crowd-irmgard-aktenordner'].figureWorldHeight,2.33);
 for(const pack of Object.values(delivery.packs))for(const v of Object.values(pack.variants))assert(v.width*v.height*4<=16*1024*1024,'one admitted texture stays within decoded budget');
});
test('Sabine owned interaction plans terminate from every direction and gait phase',()=>{
 const context={};vm.runInNewContext(readFileSync('character-interactions.js','utf8'),context);
 const controller=context.CharacterInteractions;
 for(const heading of ['down','right','up','left'])for(let phase=0;phase<16;phase++)for(const name of Object.keys(p.atlasMotion.interactions.states)){
  const actor={touristFacing:heading,spriteFrame:phase};
  assert.equal(controller.request(actor,name,p.atlasMotion),true);
  const plan=controller.plan(actor,p.atlasMotion,actor.interactionRequest);
  assert(plan.frames.every(frame=>Number.isFinite(frame.ms)&&frame.ms>0));
  assert(plan.frames.reduce((sum,frame)=>sum+frame.ms,0)<10000,'bounded existing action');
  actor.characterInteraction=plan;actor.interactionRequest=null;
  for(let ticks=0;actor.characterInteraction;ticks++){
   assert(ticks<600,'action completes within ten simulation seconds');
   controller.advance(actor,1/60,p.atlasMotion);
  }
  assert.equal(actor.touristFacing,heading);assert.equal(actor.gaitDistance,0);
 }
});
test('Sabine keeps her own existing German recording, voice and measured media cues',()=>{
 const context={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);
 const catalog=context.window.GermanySimulatorAudioText,binding=catalog.productionVoices[p.id];
 assert.equal(binding.profileId,'c6a6e6b4ad1842388b7ac88eb0b71cf6');
 const clips=Object.entries(catalog.recordings).filter(([,clip])=>clip.voiceId===p.id);assert.equal(clips.length,1);
 const [path,clip]=clips[0];assert.equal(clip.sha256,'d6085975baba9c17328052f474b6c9bb54fd7bb3a52b945d7f78aa30eeed4d33');
 assert.equal(hash(asset(path)),clip.sha256);assert.equal(clip.mouthHz,40);assert(clip.mouthEnergy.some(x=>x>0));
 assert.equal(clip.profileId,binding.profileId);assert.equal(catalog.candidateClip(p.id,clip.source),path);
});
