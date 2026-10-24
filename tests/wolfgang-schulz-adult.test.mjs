import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
const registry=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=registry.characters['stadt-wolfgang-schulz'];
const old=JSON.parse(readFileSync('assets/sprite-sources/resident-motion/stadt-wolfgang-schulz/adult-v1/pre-admission-family.json'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const asset=p=>readFileSync(p.replace(/^\.\//,''));

test('Wolfgang adult family keeps four original actions, every phase stop and eight own headings',()=>{
 assert.equal(p.figureWorldHeight,2.33);assert.equal(p.standingOnly,false);registerStreetCharacterManifest(registry);
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);assert.deepEqual(p.grid,[21,20]);
 assert.equal(p.figureHeight,136);assert(p.strideDistance>0);
 for(const heading of ['down','right','up','left']){
  assert.equal(p.atlasMotion.walks[heading].frames,16);
  assert.equal(Object.keys(p.atlasMotion.settles[heading]).length,16);
  for(let phase=0;phase<16;phase++)assert.deepEqual(p.atlasMotion.settles[heading][phase].frames.at(-1),{row:p.atlasMotion.bridges[heading].row,col:2,ms:70});
 }
 assert.equal(Object.keys(p.atlasMotion.transitions).length,12);
 assert.deepEqual(Object.keys(p.atlasMotion.interactions.states).sort(),['failure','idle','look','success','wait']);
 for(const [name,state] of Object.entries(old.interactions.states)){const actual=p.atlasMotion.interactions.states[name];assert.deepEqual(actual.durations_ms,state.durations_ms);for(const key of ['loop','next']){assert.equal(Object.hasOwn(actual,key),Object.hasOwn(state,key));if(Object.hasOwn(state,key))assert.deepEqual(actual[key],state[key])}}
 assert.deepEqual(p.atlasMotion.interactions.states.wait,p.atlasMotion.interactions.states.idle);
});
test('Wolfgang native speech and selective packs bind exact own bytes without admitting source masters',()=>{
 for(const value of [p.standing,...Object.values(p.variants),p.mouthPaint,p.motionDelivery])assert.equal(hash(asset(value.file)),value.sha256);
 const mouth=JSON.parse(asset(p.mouthPaint.file));assert.equal(mouth.frames.length,420);
 for(const [name,v] of Object.entries({standing:p.standing,...p.variants}))assert.equal(mouth.sources[name],v.sha256);
 for(const col of [3,4,5])assert.equal(mouth.frames[8*21+col],null,'rear orientations never borrow frontal lips');
 const delivery=JSON.parse(asset(p.motionDelivery.file));
 assert.equal(delivery.packs.movement.slots.filter(x=>x!==null).length,348);
 assert.equal(delivery.packs.reactions.slots.filter(x=>x!==null).length,64);
 for(const pack of Object.values(delivery.packs))for(const v of Object.values(pack.variants))assert(v.width*v.height*4<=16*1024*1024);
});
test('Wolfgang mapped pause-idle reaches its exact original cells and all320 action plans finish and resume',()=>{
 const context={};vm.runInNewContext(readFileSync('character-interactions.js','utf8'),context);const controller=context.CharacterInteractions;
 let mapped;const game=readFileSync('game.js','utf8'),source=game.match(/^function requestCharacterReaction\([^\n]+/m)?.[0];assert(source);
 const host={window:{Germany3D:{requestStreetReaction(actor,names){mapped=names;return true}}}};
 vm.runInNewContext(source+';requestCharacterReaction({},"idle");',host);assert.deepEqual(Array.from(mapped),['wait']);
 for(const heading of ['down','right','up','left'])for(let phase=0;phase<16;phase++)for(const name of ['idle','look','success','failure',...mapped]){
  const actor={touristFacing:heading,spriteFrame:phase};assert.equal(controller.request(actor,name,p.atlasMotion),true);
  const plan=controller.plan(actor,p.atlasMotion,actor.interactionRequest),state=p.atlasMotion.interactions.states[name];
  const owned=plan.frames.filter(f=>f.row===state.row&&f.role==='reaction');assert.equal(owned.length,16);assert.equal(owned.reduce((s,f)=>s+f.ms,0),state.durations_ms.reduce((s,v)=>s+v,0));
  actor.characterInteraction=plan;actor.interactionRequest=null;
  for(let tick=0;actor.characterInteraction;tick++){assert(tick<600);controller.advance(actor,1/60,p.atlasMotion)}
  assert.equal(actor.touristFacing,heading);assert.equal(actor.gaitDistance,0);assert.equal(actor.spriteFrame,0);
 }
});
test('Wolfgang retains every original recording, fixed voice and measured speech cue',()=>{
 const baseline=JSON.parse(readFileSync('assets/sprite-sources/resident-motion/stadt-wolfgang-schulz/adult-v1/voice-baseline.json'));
 for(const [file,digest] of Object.entries(baseline.hashes))assert.equal(hash(readFileSync(file)),digest);
 const context={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);const catalog=context.window.GermanySimulatorAudioText;
 assert.equal(catalog.productionVoices[p.id].profileId,baseline.profileId);
 const clips=Object.entries(catalog.recordings).filter(([,v])=>v.voiceId===p.id);assert.equal(clips.length,baseline.selectedRecordingCount);
 for(const [path,clip] of clips){assert.equal(hash(asset(path)),clip.sha256);assert.equal(clip.profileId,baseline.profileId);assert.equal(clip.mouthHz,40);assert(clip.mouthEnergy.some(x=>x>0));assert.equal(catalog.candidateClip(p.id,clip.source),path)}
});