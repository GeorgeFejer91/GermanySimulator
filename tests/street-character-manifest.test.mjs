import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { registerStreetCharacterManifest, resolveStreetCharacter, advanceStreetAnimation, requestStreetReaction } from '../street-character-sprites.js';

const manifestText = await readFile(new URL('../assets/characters/street/manifest.json', import.meta.url), 'utf8');
const manifest = JSON.parse(manifestText);
const entries = Object.entries(manifest.characters);
const motionFamilies = new Set(['stadt-irmgard-aktenstapel','stadt-hannelore-sparkasse','quiz-gisela-becker','quiz-heike-hoffmann','crowd-irmgard-aktenordner','stadt-karl-heinz-post','stadt-renate-termin']);

test('all forty-three installed standing sprites match shipped manifest hashes and literal identity aliases', async () => {
  assert(Buffer.byteLength(manifestText) <= 262144, 'canonical street metadata must fit the lazy loader budget');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(entries.length, 43);
  registerStreetCharacterManifest(manifest);
  const aliases = new Set();
  let encodedBytes = 0;
  for (const [id, person] of entries) {
    assert.equal(person.id, id);
    assert.equal(person.standingOnly, !motionFamilies.has(id));
    assert.deepEqual(person.cell, [128, 160]);
    assert.deepEqual(person.pivot, [64, id === 'crowd-irmgard-aktenordner' ? 148 : 150]);
    assert.equal(person.figureHeight, 136);
    const expectedStanding = id === 'crowd-irmgard-aktenordner' ? './assets/characters/street-speakers/crowd-irmgard-aktenordner/standing.webp' : `./assets/characters/street/${id}-standing.webp`;
    assert.equal(person.standing.file, expectedStanding);
    assert.equal(person.standing.width, 128);
    assert.equal(person.standing.height, 160);
    assert.equal(person.figureWorldHeight, id === 'crowd-irmgard-aktenordner' ? 2.33 : id === 'spieler-hans-peter-mustermann' ? 1.5 : id === 'polizei-heinrich-wachtmeister' ? 1.56 : 1.6);
    const bytes = await readFile(new URL('../' + expectedStanding.slice(2), import.meta.url));
    encodedBytes += bytes.length;
    assert.equal(createHash('sha256').update(bytes).digest('hex'), person.standing.sha256, id);
    for (const alias of person.aliases) {
      assert.equal(typeof alias, 'string');
      assert.ok(!alias.includes('$'));
      assert.ok(!aliases.has(alias), `duplicate alias ${alias}`);
      aliases.add(alias);
      assert.equal(resolveStreetCharacter({ id: alias }), id);
    }
  }
  assert.equal(encodedBytes, 729732);
  assert.equal(resolveStreetCharacter({ id: 'player-default' }), 'spieler-hans-peter-mustermann');
  assert.equal(resolveStreetCharacter({ voiceId: 'polizei-heinrich-wachtmeister', id: 'police-27' }), 'polizei-heinrich-wachtmeister');
  assert.equal(resolveStreetCharacter({ id: 'crowd-baerbel-brezel-7' }), null);
});

test('the planted atlas pilot preserves standing registration and ships both exact movement variants',async()=>{
  const person=manifest.characters['crowd-irmgard-aktenordner'];
  assert.deepEqual(entries.filter(([,value])=>!value.standingOnly).map(([id])=>id),[...motionFamilies]);
  assert.equal(person.atlasMotion.schemaVersion,1);assert.equal(person.motionRig,undefined);
  assert.deepEqual(person.grid,[21,17]);assert.deepEqual(person.atlasMotion.neutral,{row:0,col:18});
  assert.equal(person.strideDistance,18.64);
  for(const [index,direction] of ['down','right','up','left'].entries()){
    assert.equal(person.atlasMotion.walks[direction].frames,16);
    assert.equal(person.clips[direction].offset,index*person.grid[0]);
    assert.equal(person.clips[direction].count,16);
  }
  for(const from of ['down','right','up','left'])for(const to of ['down','right','up','left']){
    if(from===to)continue;
    assert(person.atlasMotion.transitions[from+'-to-'+to].frames.length>=7);
  }
  const dedicated=new Set();
  for(const [index,direction] of ['down','right','up','left'].entries()){
    assert.deepEqual(Object.keys(person.atlasMotion.settles[direction]).map(Number).sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));
    for(const settle of Object.values(person.atlasMotion.settles[direction])){
      assert.equal(settle.frames.length,5);
      assert.deepEqual(settle.frames.at(-1),{row:index,col:18,ms:70});
      for(const frame of settle.frames.slice(0,-1)){
        assert(Number.isInteger(frame.row)&&frame.row>=0&&frame.row<person.grid[1]);
        assert(Number.isInteger(frame.col)&&frame.col>=0&&frame.col<person.grid[0]);
        assert(!Object.values(person.atlasMotion.walks).some(w=>frame.row===w.row&&frame.col<w.frames),'settle must not advance ordinary gait');
        const slot=frame.row*person.grid[0]+frame.col;assert(!dedicated.has(slot),'settle cell aliases another phase');dedicated.add(slot);
      }
    }
  }
  assert.equal(dedicated.size,256);
  for(const [variant,image] of Object.entries(person.variants)){
    assert.deepEqual([image.width,image.height],variant==='desktop'?[2016,2040]:[1848,1870]);
    assert(image.width<=2048&&image.height<=2048&&image.width*image.height*4<=16*1024*1024);
    const bytes=await readFile(new URL('../'+image.file.slice(2),import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256,variant);
    assert.equal(bytes.subarray(12,16).toString(),'VP8L');
    const bits=bytes.readUInt32LE(21);
    assert.equal((bits&0x3fff)+1,image.width);assert.equal(((bits>>>14)&0x3fff)+1,image.height);
  }
});

test('standing-only admission keeps motion and mouth claims absent', () => {
  registerStreetCharacterManifest(manifest);
  const actor = { id: 'city-ute-ruhe', x: 0, y: 0 };
  const pose = advanceStreetAnimation(actor, 4, 0.1, { speaking: true, cueToken: 'test' });
  assert.equal(pose.clip, 'standing');
  assert.equal(pose.slot, 0);
  assert.equal(pose.mouthOpen, 0);
  assert.equal(requestStreetReaction(actor, 'wave'), false);
  const malformed = structuredClone(manifest);
  malformed.characters['stadt-ute-ruhe'].clips = { idle: { offset: 0, count: 1 } };
  assert.throws(() => registerStreetCharacterManifest(malformed), /cannot declare motion metadata/);
  assert.equal(resolveStreetCharacter(actor), 'stadt-ute-ruhe');
});
