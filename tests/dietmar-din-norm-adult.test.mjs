import {expandStreetManifest} from '../street-manifest.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
const author='assets/sprite-sources/resident-motion/crowd-dietmar-din-norm/adult-v1/';
const registry=expandStreetManifest(JSON.parse(readFileSync('assets/characters/street/manifest.json')));
const person=registry.characters['crowd-dietmar-din-norm'];
const old=JSON.parse(readFileSync(author+'pre-admission-person.json'));
const plan=JSON.parse(readFileSync(author+'new-motion-capability-plan.json'));
const authored=JSON.parse(readFileSync(author+'validation-baseline-v4.json')).person;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const asset=path=>readFileSync(path.replace(/^\.\//,''));
test('Dietmar production family adds source-defined quiet4 timings, idle alias, eight anchors and phase stops',()=>{
 registerStreetCharacterManifest(registry);assert.equal(old.standingOnly,true);assert.equal(old.figureWorldHeight,1.6);assert.equal(person.figureWorldHeight,2.77);assert.equal(person.standingOnly,false);
 assert.equal(authored.figureWorldHeight,2.33);assert.equal(authored.strideDistance,11.65);assert.deepEqual(person,{...authored,figureWorldHeight:2.77,strideDistance:13.85,motionDelivery:person.motionDelivery});
 assert.equal(person.strideDistance,11.65*2.77/2.33);
 assert.deepEqual(JSON.parse(readFileSync('assets/characters/residents/crowd-dietmar-din-norm/delivery-v2/person.json')),person);
 assert.deepEqual(person.cell,[128,160]);assert.deepEqual(person.pivot,[64,150]);assert.deepEqual(person.grid,[21,20]);assert(person.strideDistance>0);
 for(const heading of ['down','right','up','left']){
  assert.equal(person.atlasMotion.walks[heading].frames,16);assert.equal(Object.keys(person.atlasMotion.settles[heading]).length,16);
  for(let phase=0;phase<16;phase++)assert.deepEqual(person.atlasMotion.settles[heading][phase].frames.at(-1),{row:person.atlasMotion.bridges[heading].row,col:2,ms:70});
 }
 assert.equal(Object.keys(person.atlasMotion.transitions).length,12);
 for(const [name,state] of Object.entries(plan.states)){
  const actual=person.atlasMotion.interactions.states[name];assert.deepEqual(actual.durations_ms,state.durations_ms);
  for(const key of ['loop','next'])assert.equal(Object.hasOwn(actual,key),Object.hasOwn(state,key));
 }
 assert.deepEqual(person.atlasMotion.interactions.states.wait,person.atlasMotion.interactions.states.idle);
});
test('Dietmar production family selective delivery and source-bound mouths retain exact own asset hashes',()=>{
 for(const value of [person.standing,...Object.values(person.variants),person.mouthPaint,person.motionDelivery])assert.equal(hash(asset(value.file)),value.sha256);
 const mouth=JSON.parse(asset(person.mouthPaint.file));assert.equal(mouth.frames.length,420);
 for(const [name,value] of Object.entries({standing:person.standing,...person.variants}))assert.equal(mouth.sources[name],value.sha256);
 for(const col of [3,4,5])assert.equal(mouth.frames[8*21+col],null);
 const delivery=JSON.parse(asset(person.motionDelivery.file));assert.equal(delivery.packs.movement.slots.filter(v=>v!==null).length,348);assert.equal(delivery.packs.reactions.slots.filter(v=>v!==null).length,64);
 for(const pack of Object.values(delivery.packs))for(const variant of Object.values(pack.variants))assert(variant.width*variant.height*4<=16*1024*1024);
});
test('Dietmar production family all320 supported action entry plans complete, release and reset to walking',()=>{
 const context={};vm.runInNewContext(readFileSync('character-interactions.js','utf8'),context);const controller=context.CharacterInteractions;
 let mapped;const source=readFileSync('game.js','utf8').match(/^function requestCharacterReaction\([^\n]+/m)?.[0];assert(source);
 const host={window:{Germany3D:{requestStreetReaction(actor,names){mapped=names;return true}}}};vm.runInNewContext(source+';requestCharacterReaction({},"idle");',host);assert.deepEqual(Array.from(mapped),['wait']);
 for(const heading of ['down','right','up','left'])for(let phase=0;phase<16;phase++)for(const name of ['idle','look','success','failure',...mapped]){
  const actor={touristFacing:heading,spriteFrame:phase};assert(controller.request(actor,name,person.atlasMotion));const plan=controller.plan(actor,person.atlasMotion,actor.interactionRequest),state=person.atlasMotion.interactions.states[name];
  const owned=plan.frames.filter(frame=>frame.row===state.row&&frame.role==='reaction');assert.equal(owned.length,16);assert.equal(owned.reduce((s,f)=>s+f.ms,0),state.durations_ms.reduce((s,v)=>s+v,0));
  actor.characterInteraction=plan;actor.interactionRequest=null;for(let tick=0;actor.characterInteraction;tick++){assert(tick<600);controller.advance(actor,1/60,person.atlasMotion)}
  assert.equal(actor.touristFacing,heading);assert.equal(actor.gaitDistance,0);assert.equal(actor.spriteFrame,0);
 }
});
test('Dietmar production family keeps fixed voice, original recordings and exact admitted catalog status',()=>{
 const baseline=JSON.parse(readFileSync(author+'voice-baseline.json'));for(const [file,digest] of Object.entries(baseline.hashes))assert.equal(hash(readFileSync(file)),digest);
 const context={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);const catalog=context.window.GermanySimulatorAudioText;
 assert.equal(catalog.productionVoices[person.id].profileId,baseline.profileId);
 const clips=Object.entries(catalog.recordings).filter(([,value])=>value.voiceId===person.id);assert.equal(clips.length,baseline.selectedRecordings.length);
 for(const [path,clip] of clips){assert.equal(hash(asset(path)),clip.sha256);assert.equal(clip.profileId,baseline.profileId);assert.equal(catalog.candidateClip(person.id,clip.source),path)}
});
