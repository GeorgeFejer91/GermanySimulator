import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const manifest=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=manifest.characters['quiz-gisela-becker'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readAsset=path=>readFileSync(path.replace(/^\.\//,''));
const scope=vm.createContext({});
vm.runInContext(readFileSync('character-interactions.js','utf8'),scope);

test('Gisela has adult scale, owned phase stops and paper presentation',()=>{
 assert.equal(p.standingOnly,false);
 assert.deepEqual(p.cell,[128,160]);assert.deepEqual(p.pivot,[64,150]);assert.equal(p.figureHeight,136);assert.equal(p.figureWorldHeight,2.33);
 assert.equal(p.standing.sha256,'3a6acc2d5010078f4cb6e669229958ad3e140a26ad87a2c0c2d91a1e5a70348c');
 assert.equal(hash(readAsset(p.standing.file)),p.standing.sha256);
 assert.equal(p.strideDistance,18.64);
 for(const [direction,walk] of Object.entries(p.atlasMotion.walks)){
  assert.equal(walk.frames,16);
  for(let phase=0;phase<16;phase++){
   const frames=p.atlasMotion.settles[direction][phase].frames;
   assert.equal(frames.length,5);assert.deepEqual(frames.at(-1),{row:p.atlasMotion.bridges[direction].row,col:2,ms:70});
   const plan=scope.CharacterInteractions.plan({touristFacing:direction,spriteFrame:phase},p.atlasMotion,{names:['greet','review'],options:{}});
   assert.deepEqual([plan.frames[0].row,plan.frames[0].col],[walk.row,phase]);
   assert(plan.frames.slice(1).every(frame=>!Object.values(p.atlasMotion.walks).some(w=>frame.row===w.row&&frame.col<w.frames)));
  }
 }
 for(const state of ['greet','work','review'])assert.deepEqual(p.atlasMotion.interactions.states[state].durations_ms,Array(16).fill(80));
 for(const state of ['look','wait','success','failure'])assert.deepEqual([p.atlasMotion.interactions.states[state].row,p.atlasMotion.interactions.states[state].col],[8,0]);
});

test('Gisela moving lips bind the actual selected sources and keep rear stopping poses closed',()=>{
 assert(p.motionDelivery?.file,'existing packed delivery is required');
 const bytes=readAsset(p.mouthPaint.file);assert.equal(hash(bytes),p.mouthPaint.sha256);
 const mouth=JSON.parse(bytes);assert.deepEqual(mouth.grid,p.grid);assert.equal(mouth.sources.standing,p.standing.sha256);
 assert.equal(mouth.frames.filter(Boolean).length,278);assert.equal(mouth.frames.filter(x=>x===null).length,100);
 for(const [name,variant] of Object.entries(p.variants))assert.equal(mouth.sources[name],variant.sha256);
 for(let phase=0;phase<16;phase++)for(const cell of p.atlasMotion.settles.up[phase].frames)assert.equal(mouth.frames[cell.row*p.grid[0]+cell.col],null);
 const delivery=readAsset(p.motionDelivery.file);assert.equal(hash(delivery),p.motionDelivery.sha256);
 const packs=JSON.parse(delivery).packs;assert.equal(packs.movement.slots.filter(x=>x!==null).length,348);assert.equal(packs.reactions.slots.filter(x=>x!==null).length,17);
});
