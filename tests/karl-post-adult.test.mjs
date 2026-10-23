import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
const registry=JSON.parse(readFileSync('assets/characters/street/manifest.json'));
const p=registry.characters['stadt-karl-heinz-post'];
const hash=x=>createHash('sha256').update(x).digest('hex');
const asset=p=>readFileSync(p.replace(/^\.\//,''));
test('Karl adult paint retains full walking, all phase stops and seven owned actions',()=>{
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
test('Karl adult exact bytes retain own lips and selective movement/reaction delivery',()=>{
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
});
