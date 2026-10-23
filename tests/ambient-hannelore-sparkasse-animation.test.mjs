import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';

const id='stadt-hannelore-sparkasse';
const manifest=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=manifest.characters[id],asset=path=>readFileSync(path.replace(/^\.\//,''));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
registerStreetCharacterManifest(manifest);
const controller=vm.createContext({});
vm.runInContext(readFileSync('character-interactions.js','utf8'),controller);

test('Hannelore has four complete walks, stops owned by each phase and an own courtesy gesture',()=>{
 assert.equal(p.standingOnly,false,'Hannelore motion must be explicitly admitted');
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);
 assert.equal(p.figureHeight,136);assert.equal(p.figureWorldHeight,2.33);
 assert.equal(p.strideDistance,5.825);
 assert(Number.isFinite(p.strideDistance)&&p.strideDistance>0);
 assert.deepEqual(Object.keys(p.atlasMotion.walks).sort(),['down','left','right','up']);
 const ownedStops=new Set();
 for(const [direction,walk] of Object.entries(p.atlasMotion.walks)){
  assert.equal(walk.frames,16);
  for(let phase=0;phase<walk.frames;phase++){
   const stop=p.atlasMotion.settles[direction][phase].frames;
   assert(stop.length>1,'stopping must have its own connected path');
   assert.deepEqual([stop.at(-1).row,stop.at(-1).col],[p.atlasMotion.bridges[direction].row,2]);
   const plan=controller.CharacterInteractions.plan({touristFacing:direction,spriteFrame:phase},p.atlasMotion,{names:['greet','review'],options:{}});
   assert.deepEqual([plan.frames[0].row,plan.frames[0].col],[walk.row,phase]);
   for(const frame of stop.slice(0,-1)){
    assert(!Object.values(p.atlasMotion.walks).some(other=>frame.row===other.row&&frame.col<other.frames));
    const slot=frame.row*p.grid[0]+frame.col;
    assert(!ownedStops.has(slot),'different stops must not alias one moving slot');ownedStops.add(slot);
   }
  }
 }
 assert(ownedStops.size>=64);
 for(const name of ['greet','work','review']){
  const state=p.atlasMotion.interactions.states[name];
  assert(state.durations_ms.length>=16,'gesture exposes the planned sample slots');
  assert.equal(state.loop,false);assert.equal(state.next,'neutral');
  assert(state.durations_ms.every(ms=>ms>0));
 }
});

test('Hannelore mouths follow selected moving sources and preserve explicit hidden rear mouths',()=>{
 assert(p.motionDelivery?.file&&p.mouthPaint?.file,'own motion and mouth delivery required');
 const bytes=asset(p.mouthPaint.file);assert.equal(hash(bytes),p.mouthPaint.sha256);
 const mouths=JSON.parse(bytes);assert.equal(mouths.id,id);assert.deepEqual(mouths.grid,p.grid);
 assert.equal(mouths.frames.length,512);
 assert.deepEqual([0,1,2,3,4,5,6,7].map(col=>Boolean(mouths.frames[8*p.grid[0]+col])),[true,true,true,false,false,false,true,true],
  'native hidden rear-right lip is explicit null while five adult headings remain attached');
 assert.equal(mouths.sources.standing,p.standing.sha256);
 for(const [name,image] of Object.entries(p.variants))assert.equal(mouths.sources[name],image.sha256);
 for(const [direction,walk] of Object.entries(p.atlasMotion.walks)){
  const slots=[...Array.from({length:walk.frames},(_,col)=>({row:walk.row,col})),...Object.values(p.atlasMotion.settles[direction]).flatMap(stop=>stop.frames)];
  for(const frame of slots){
   const profile=mouths.frames[frame.row*p.grid[0]+frame.col];
   if(direction==='up')assert.equal(profile,null,'rear lip remains hidden');
   else assert(profile,'every selected visible walk/stop pose owns a mouth fit');
  }
 }
 for(const name of ['greet','work','review']){
  const state=p.atlasMotion.interactions.states[name];
  for(let offset=0;offset<state.durations_ms.length;offset++)assert(mouths.frames[state.row*p.grid[0]+state.col+offset],'each selected gesture sample owns a mouth fit');
 }
 assert.equal(hash(asset(p.motionDelivery.file)),p.motionDelivery.sha256);
});

test('Hannelore keeps own adult standing paint and her two exact selected recordings',()=>{
 assert.equal(p.standing.sha256,'3de56a9dd36e18dbfaceacf1c2b73f0a40e6c12b9ba345668d0def6245a5c2d6');
 assert.equal(hash(asset(p.standing.file)),p.standing.sha256);
 const c={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),c);
 const audio=c.window.GermanySimulatorAudioText,binding=audio.productionVoices[id];
 assert.equal(binding.profileId,'112312dbaaab44bb90e639b531b69d27');
 assert.equal(binding.referenceSha256,'434d2479cafa912848196c250a1154d8fa96512eecfa7fce528c21463178adc1');
 const expected={'01':'d260f294fb926d9c72796971a6b4496cbd08e6460d760117977383e69807747e','02':'becbd85dfe24b6b4b48d6264679314d15b3e9ce72d095256c0a1607bc60e70f3'};
 assert.equal(Object.values(audio.recordings).filter(clip=>clip.voiceId===id).length,2);
 for(const [number,sha] of Object.entries(expected)){
  const path=`./assets/voices/city-dialogue/${id}-${number}.mp3`,clip=audio.recordings[path];
  assert(clip);assert.equal(hash(asset(path)),sha);assert.equal(clip.sha256,sha);
  assert.equal(clip.profileId,binding.profileId);assert.equal(clip.referenceSha256,binding.referenceSha256);
  assert.equal(clip.mouthHz,40);assert(clip.mouthEnergy.some(value=>value>0));
  assert.equal(audio.candidateClip(id,clip.source),path);
  assert.equal(audio.candidateClip('stadt-renate-termin',clip.source),null);
 }
});
