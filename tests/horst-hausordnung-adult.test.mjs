import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {expandStreetManifest} from '../street-manifest.js';

test('Horst selects a mature Söder-height family with his own calibrated gait',()=>{
 const registry=expandStreetManifest(JSON.parse(readFileSync('assets/characters/street/manifest.json')));
 const person=registry.characters['crowd-horst-hausordnung'];
 assert(person,'The original Horst Hausordnung street record must remain present');
 assert.equal(person.figureWorldHeight,2.77);
 assert.equal(person.standingOnly,false);
 // Own complete-boot source travel46.8 /400 *2.33 /.02 =13.6305.
 // Apply the same proportional world-height fit as the accepted source family.
 assert(Math.abs(person.strideDistance-13.6305*(2.77/2.33))<1e-10,
  'Selected cadence must preserve the own measured source travel at the taller world scale');
 assert.deepEqual(person.cell,[128,160]);
 assert.deepEqual(person.pivot,[64,150]);
 assert.deepEqual(person.grid,[21,20]);
 for(const heading of ['down','right','up','left']){
  assert.equal(person.atlasMotion.walks[heading].frames,16);
  assert.equal(Object.keys(person.atlasMotion.settles[heading]).length,16);
 }
 assert(person.motionDelivery?.file&&person.motionDelivery?.sha256);
 assert(person.mouthPaint?.file&&person.mouthPaint?.sha256);
});
