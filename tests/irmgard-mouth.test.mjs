import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateStreetMouthRegistration} from '../street-character-mouth.js';

const id='crowd-irmgard-aktenordner',manifestPath='assets/characters/street/manifest.json';
const person=JSON.parse(readFileSync(manifestPath)).characters[id];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('animated Aktenordner has complete source-bound mouth coverage without changing her accepted body',()=>{
 assert(person.mouthPaint?.file,'already-animated Aktenordner needs her own mouth definition');
 const bytes=readFileSync(person.mouthPaint.file.replace(/^\.\//,''));
 assert.equal(hash(bytes),person.mouthPaint.sha256);
 const mouth=JSON.parse(bytes);
 const {mouthPaint,...body}=person;
 // Serialized accepted record at dd316d0; independent of checkout history/CI depth.
 assert.equal(hash(JSON.stringify(body)),'0ad4d98ed066d5e4cd83f2b333c04c839e83a72a1a6abf935961928ff9c23e37',
  'adding speech must preserve accepted movement, scale, stride and source identities');
 assert.equal(mouth.id,id);assert.deepEqual(mouth.cell,[128,160]);assert.deepEqual(mouth.grid,[21,17]);
 assert.equal(mouth.frames.length,357);
 assert.deepEqual(mouth.sources,{standing:person.standing.sha256,desktop:person.variants.desktop.sha256,mobile:person.variants.mobile.sha256});
 validateStreetMouthRegistration(mouth.standing);
 // Direct source inventory: rear walk/bridge, rear-quarter turns, rear
 // transition cells and unused final gutter must have no mouth capability.
 const nullSlots=new Set([
  ...Array.from({length:16},(_,i)=>42+i),...Array.from({length:5},(_,i)=>126+i),171,172,173,
  ...Array.from({length:64},(_,i)=>224+i),...Array.from({length:9},(_,i)=>348+i),
 ]);
 assert.equal(nullSlots.size,97);
 mouth.frames.forEach((registration,slot)=>{
  if(nullSlots.has(slot))assert.equal(registration,null,'rear/unused source slot '+slot);
  else {assert(registration,'visible source slot '+slot);validateStreetMouthRegistration(registration);}
 });
 for(const image of [person.standing,...Object.values(person.variants)])assert.equal(hash(readFileSync(image.file.replace(/^\.\//,''))),image.sha256);
});
