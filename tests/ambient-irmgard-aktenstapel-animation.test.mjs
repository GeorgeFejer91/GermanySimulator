import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';

const id='stadt-irmgard-aktenstapel',manifest=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=manifest.characters[id],hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const asset=path=>readFileSync(path.replace(/^\.\//,''));
registerStreetCharacterManifest(manifest);
const context=vm.createContext({});vm.runInContext(readFileSync('character-interactions.js','utf8'),context);

test('named Irmgard keeps her own standing scale and gains phase-owned stops and a free-hand gesture',()=>{
 assert.equal(p.standingOnly,false);
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);assert.equal(p.figureHeight,136);assert.equal(p.figureWorldHeight,1.6);
 assert.equal(p.standing.sha256,'3d330a4d8130ab382545596381fda6fbf016929a15fdf17f8703fee23777bc2e');
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

test('named Irmgard moving mouths bind owned body sources and keep rear stopping poses null',()=>{
 assert(p.motionDelivery?.file&&p.mouthPaint?.file,'admitted own motion and mouth delivery required');
 const bytes=asset(p.mouthPaint.file);assert.equal(hash(bytes),p.mouthPaint.sha256);const mouth=JSON.parse(bytes);
 assert.equal(mouth.id,id);assert.deepEqual(mouth.grid,p.grid);assert.equal(mouth.sources.standing,p.standing.sha256);
 assert.equal(mouth.frames.filter(Boolean).length,276);assert.equal(mouth.frames.filter(x=>x===null).length,102);
 for(const [name,image] of Object.entries(p.variants))assert.equal(mouth.sources[name],image.sha256);
 for(const phase of Object.values(p.atlasMotion.settles.up))for(const frame of phase.frames)assert.equal(mouth.frames[frame.row*p.grid[0]+frame.col],null);
 const delivery=asset(p.motionDelivery.file);assert.equal(hash(delivery),p.motionDelivery.sha256);
 const packs=JSON.parse(delivery).packs;assert.equal(packs.movement.slots.filter(x=>x!==null).length,348);assert.equal(packs.reactions.slots.filter(x=>x!==null).length,17);
});

test("named Irmgard preserves her three exact selected recordings and caption fallback for the missing Berlin line",()=>{
 const c={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),c);const a=c.window.GermanySimulatorAudioText,b=a.productionVoices[id];
 assert.equal(b.profileId,'c166075128d247fabf12e786bfaa60a6');assert.equal(b.referenceSha256,'8844d2f44e52808aeefaaf444249455ccdd8fbbfcac152ec13806a63e2d1bb8a');
 const expected={'01':'7fb0e491a1ae65053ca844e58a03ced795aaa7c491410da4d0686c6304df8483','02':'88a5009c7191dffb81e55e9afc35dc21c6e0f8215cfe6f35e2e181fb8bc143bc','04':'19595c1023fba25b1ebc314945bb20e80c5a33341796cde91b89dcbf61e73082'};
 const clips=Object.entries(a.recordings).filter(([,clip])=>clip.voiceId===id);assert.equal(clips.length,3);
 for(const [number,sha256] of Object.entries(expected)){
  const path=`./assets/voices/city-dialogue/${id}-${number}.mp3`,clip=a.recordings[path];assert(clip);
  assert.equal(hash(asset(path)),sha256);assert.equal(clip.sha256,sha256);assert.equal(clip.profileId,b.profileId);assert.equal(clip.referenceSha256,b.referenceSha256);
  assert.equal(clip.mouthHz,40);assert(clip.mouthEnergy.some(x=>x>0));assert.equal(a.candidateClip(id,clip.source),path);assert.equal(a.candidateClip('stadt-karl-heinz-post',clip.source),null);
 }
 assert.equal(a.recordings[`./assets/voices/city-dialogue/${id}-03.mp3`],undefined);
});
