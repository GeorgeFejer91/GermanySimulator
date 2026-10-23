import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';

const id='stadt-renate-termin',manifest=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=manifest.characters[id],hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const asset=path=>readFileSync(path.replace(/^\.\//,''));
registerStreetCharacterManifest(manifest);
const context=vm.createContext({});vm.runInContext(readFileSync('character-interactions.js','utf8'),context);

test('adult Renate retains phase-owned stops and her free-left-hand gesture',()=>{
 assert.equal(p.standingOnly,false);
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);assert.equal(p.figureHeight,136);assert.equal(p.figureWorldHeight,2.33);
 assert.equal(p.standing.sha256,'0ad1bd3c5a0b581e5d4e2d066f6a6eee6533c1d9398da01d90a0db45f7936acf');
 assert.equal(hash(asset(p.standing.file)),p.standing.sha256);
 assert(p.strideDistance>0&&Number.isFinite(p.strideDistance));
 const stopSlots=new Set();
 for(const [direction,walk] of Object.entries(p.atlasMotion.walks)){
  assert.equal(walk.frames,16);
  for(let phase=0;phase<16;phase++){
   const frames=p.atlasMotion.settles[direction][phase].frames;
   assert.equal(frames.length,5);assert.deepEqual(frames.at(-1),{row:p.atlasMotion.bridges[direction].row,col:2,ms:70});
   const plan=context.CharacterInteractions.plan({touristFacing:direction,spriteFrame:phase},p.atlasMotion,{names:['greet','review'],options:{}});
   assert.deepEqual([plan.frames[0].row,plan.frames[0].col],[walk.row,phase]);
   for(const frame of frames.slice(0,-1)){
    assert(!Object.values(p.atlasMotion.walks).some(w=>frame.row===w.row&&frame.col<w.frames),'stop does not continue ordinary gait');
    const slot=frame.row*p.grid[0]+frame.col;assert(!stopSlots.has(slot),'phase-owned stop cannot alias another stop');stopSlots.add(slot);
   }
  }
 }
 assert.equal(stopSlots.size,256);
 for(const state of ['greet','work','review'])assert.deepEqual(p.atlasMotion.interactions.states[state].durations_ms,Array(16).fill(80));
});

test('named Renate moving mouths bind owned body sources and keep rear stopping poses null',()=>{
 assert(p.motionDelivery?.file&&p.mouthPaint?.file,'admitted own motion and mouth delivery required');
 const bytes=asset(p.mouthPaint.file);assert.equal(hash(bytes),p.mouthPaint.sha256);const mouth=JSON.parse(bytes);
 assert.equal(mouth.id,id);assert.deepEqual(mouth.grid,p.grid);assert.equal(mouth.sources.standing,p.standing.sha256);
 assert.equal(mouth.frames.filter(Boolean).length,276);assert.equal(mouth.frames.filter(x=>x===null).length,102);
 for(const [name,image] of Object.entries(p.variants))assert.equal(mouth.sources[name],image.sha256);
 for(const phase of Object.values(p.atlasMotion.settles.up))for(const frame of phase.frames)assert.equal(mouth.frames[frame.row*p.grid[0]+frame.col],null);
 const delivery=asset(p.motionDelivery.file);assert.equal(hash(delivery),p.motionDelivery.sha256);
 const packs=JSON.parse(delivery).packs;assert.equal(packs.movement.slots.filter(x=>x!==null).length,348);assert.equal(packs.reactions.slots.filter(x=>x!==null).length,17);
});

test("named Renate preserves her three exact selected recordings and caption fallback for the missing Berlin line",()=>{
 const c={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),c);const a=c.window.GermanySimulatorAudioText,b=a.productionVoices[id];
 assert.equal(b.profileId,'21f2fc63a2f34d3b81462ca72933e51e');assert.equal(b.referenceSha256,'f8a8787c6361d0a0a6d6620d9cddba223b777e06a5c4fea009f3adf64643b99a');
 const expected={'01':'2b562aacbfac4438af3c05b81cffc37cd3f4bb660eb7f6c4b06de8eab29d12f2','02':'b1111c667eded858cf18ddb38b3f3bd311c16756d859f85685dd2311ca2b7f9e','04':'717bb514b431dde0c164e5bbbd07179666425537813b98f003e52e36f08dd834'};
 const clips=Object.entries(a.recordings).filter(([,clip])=>clip.voiceId===id);assert.equal(clips.length,3);
 for(const [number,sha256] of Object.entries(expected)){
  const path=`./assets/voices/city-dialogue/${id}-${number}.mp3`,clip=a.recordings[path];assert(clip);
  assert.equal(hash(asset(path)),sha256);assert.equal(clip.sha256,sha256);assert.equal(clip.profileId,b.profileId);assert.equal(clip.referenceSha256,b.referenceSha256);
  assert.equal(clip.mouthHz,40);assert(clip.mouthEnergy.some(x=>x>0));assert.equal(a.candidateClip(id,clip.source),path);assert.equal(a.candidateClip('stadt-karl-heinz-post',clip.source),null);
 }
 assert.equal(a.recordings[`./assets/voices/city-dialogue/${id}-03.mp3`],undefined);
});
