import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compactStreetManifest,expandStreetManifest} from '../street-manifest.js';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';
import {streetMotionDeliveryDefinitionBytes} from '../street-motion-delivery.js';

const original=expandStreetManifest(JSON.parse(readFileSync(new URL('../assets/characters/street/manifest.json',import.meta.url),'utf8')));
const key='stadt-klaus-dieter-klein';
const digest=p=>createHash('sha256').update(streetMotionDeliveryDefinitionBytes(p)).digest('hex');

test('compact clips round-trip every installed source field without changing delivery identity',()=>{
  const snapshot=structuredClone(original),wire=compactStreetManifest(original);
  assert(Buffer.byteLength(JSON.stringify(wire))<Buffer.byteLength(JSON.stringify(original))/2);
  assert(Buffer.byteLength(JSON.stringify(wire))<=262144);
  assert.deepEqual(expandStreetManifest(wire),original);
  assert.deepEqual(registerStreetCharacterManifest(wire),original.characters);
  for(const [id,person] of Object.entries(original.characters))assert.equal(digest(expandStreetManifest(wire).characters[id]),digest(person));
  assert.deepEqual(original,snapshot);
  assert.deepEqual(compactStreetManifest(wire),wire);
});

test('nonuniform stop timing retains the complete source representation',()=>{
  const source=structuredClone(original);
  source.characters[key].atlasMotion.settles.down[0].frames[0].ms=69;
  const wire=compactStreetManifest(source);
  assert(wire.characters[key].atlasMotion.settles);
  assert.equal(wire.characters[key].atlasMotion.compactClips.settles,undefined);
  assert.deepEqual(expandStreetManifest(wire),source);
});

test('compact frames reject unsupported versions, conflicts and out-of-atlas slots',()=>{
  for(const mutate of [
    p=>{p.compactClips.schemaVersion=2},
    p=>{p.compactClips.schemaVersion=true},
    p=>{p.settles={}},
    p=>{p.compactClips.settles.phases.down[0][0]=999999},
    p=>{p.compactClips.transitions['down-to-right'][0][1]=0},
    p=>{p.compactClips.settles.phases.down[0]=Array(16).fill(0)},
    p=>{const t=p.compactClips.transitions;t.unowned=t['down-to-right'];delete t['down-to-right']},
  ]){
    const wire=compactStreetManifest(original);mutate(wire.characters[key].atlasMotion);
    assert.throws(()=>registerStreetCharacterManifest(wire),/compact/);
  }
});
