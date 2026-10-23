import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateStreetMouthRegistration} from '../street-character-mouth.js';

const id='crowd-irmgard-aktenordner',manifestPath='assets/characters/street/manifest.json';
const person=JSON.parse(readFileSync(manifestPath)).characters[id];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('expressive adult Aktenordner has complete mouth coverage bound to her redesigned walking paint',()=>{
 assert(person.mouthPaint?.file,'already-animated Aktenordner needs her own mouth definition');
 const bytes=readFileSync(person.mouthPaint.file.replace(/^\.\//,''));
 assert.equal(hash(bytes),person.mouthPaint.sha256);
 const mouth=JSON.parse(bytes);
 // The user explicitly replaces the earlier short body. Retain source and
 // playback ownership checks rather than freezing that superseded design.
 assert.equal(person.figureWorldHeight,2.33);
 assert.equal(person.figureHeight,136);
 assert.equal(person.standingOnly,false);
 assert.equal(mouth.id,id);assert.deepEqual(mouth.cell,[128,160]);assert.deepEqual(mouth.grid,[21,17]);
 assert.equal(mouth.frames.length,357);
 const family=JSON.parse(readFileSync('assets/characters/street-speakers/'+id+'/manifest.json'));
 const anchors=JSON.parse(readFileSync('assets/sprite-sources/street-speaker-motion/berlin-irmgard/mouth-source-v1/anchors-v1.json'));
 assert.equal(anchors.sourceSha256,person.variants.desktop.sha256);
 assert.equal(family.figureWorldHeight,person.figureWorldHeight);
 assert.equal(family.cycle_distance,person.strideDistance);
 assert.equal(family.variants.desktop.sha256,person.variants.desktop.sha256);
 assert.equal(family.variants.mobile.sha256,person.variants.mobile.sha256);
 for(const variant of Object.values(family.variants)){
  assert(variant.image_size.every(n=>n<=2048));
  assert(variant.decodedRGBABytes<=16*1024*1024);
 }
 assert.deepEqual(mouth.sources,{standing:person.standing.sha256,desktop:person.variants.desktop.sha256,mobile:person.variants.mobile.sha256});
 validateStreetMouthRegistration(mouth.standing);
 // Direct new-paint inventory: rear walk/bridge, genuinely hidden turn faces
 // and unused cells have no mouth capability. Rear-right has visible lips.
 const nullSlots=new Set([
  ...Array.from({length:16},(_,i)=>person.atlasMotion.walks.up.row*21+i),
  ...[...person.atlasMotion.bridges.up.stop_cols,...person.atlasMotion.bridges.up.start_cols]
     .map(col=>person.atlasMotion.bridges.up.row*21+col),
  4*21+4,4*21+5,
  ...Object.values(person.atlasMotion.settles.up).flatMap(p=>p.frames.slice(0,-1).map(c=>c.row*21+c.col)),
  ...Array.from({length:9},(_,i)=>348+i),
 ]);
 assert.equal(nullSlots.size,96);
 for(const direction of ['down','right','up','left'])assert.equal(Object.keys(person.atlasMotion.settles[direction]).length,16);
 mouth.frames.forEach((registration,slot)=>{
  if(nullSlots.has(slot))assert.equal(registration,null,'rear/unused source slot '+slot);
  else {assert(registration,'visible source slot '+slot);validateStreetMouthRegistration(registration);}
 });
 for(const image of [person.standing,...Object.values(person.variants)])assert.equal(hash(readFileSync(image.file.replace(/^\.\//,''))),image.sha256);
});
