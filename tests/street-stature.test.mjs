import {expandStreetManifest} from '../street-manifest.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fitAdultStreetHeight} from '../tools/fit-street-height.mjs';
import {streetMotionDeliveryDefinitionBytes} from '../street-motion-delivery.js';

const read=path=>JSON.parse(readFileSync(new URL('../'+path.replace(/^\.\//,''),import.meta.url),'utf8'));
const manifest=expandStreetManifest(read('assets/characters/street/manifest.json'));
const person=manifest.characters['stadt-guenther-tuev'];
const packet=read(person.motionDelivery.file);
const digest=value=>createHash('sha256').update(streetMotionDeliveryDefinitionBytes(value)).digest('hex');

test('adult fitting preserves source art and actions while scaling stride and rebinding the full definition',()=>{
  const before=structuredClone(person),originalPacket=structuredClone(packet);
  const fitted=fitAdultStreetHeight(person,packet,2.33);
  assert.equal(fitted.person.figureWorldHeight,2.33);
  assert.equal(fitted.person.strideDistance,person.strideDistance*2.33/person.figureWorldHeight);
  assert.deepEqual(fitted.person,{...person,figureWorldHeight:2.33,strideDistance:fitted.person.strideDistance,motionDelivery:fitted.person.motionDelivery});
  assert.deepEqual(fitted.packet,{...packet,definitionSha256:digest(fitted.person)});
  assert.equal(createHash('sha256').update(fitted.packetBytes).digest('hex'),fitted.person.motionDelivery.sha256);
  assert.notEqual(fitted.packet.definitionSha256,packet.definitionSha256);
  assert.deepEqual(person,before);assert.deepEqual(packet,originalPacket);
});

test('fitting refuses short source proportions, invalid heights, and stale delivery metadata',()=>{
  const shortSource=read('assets/sprite-sources/resident-motion/stadt-ute-ruhe/adult-v1/pre-admission-person.json');
  assert.equal(shortSource.standingOnly,true);assert.equal(shortSource.figureWorldHeight,1.6);
  assert.throws(()=>fitAdultStreetHeight(shortSource,null,2.77),/already redesigned adult/);
  for(const height of [0,-1,Infinity,NaN])assert.throws(()=>fitAdultStreetHeight(person,packet,height),/target height/);
  assert.throws(()=>fitAdultStreetHeight(person,{...packet,definitionSha256:'0'.repeat(64)},2.77),/original person/);
});

test('all twenty redesigned citizens select the reference height with exact delivery bindings',()=>{
  const ids=['stadt-klaus-dieter-klein','stadt-brigitte-mueller','stadt-wolfgang-schulz','stadt-ursula-neumann','stadt-manfred-din','stadt-irmgard-aktenstapel','stadt-guenther-tuev','stadt-hannelore-sparkasse','crowd-brigitte-bueroklammer','crowd-dietmar-din-norm','crowd-hildegard-brotzeit','quiz-gisela-becker','quiz-hartmut-keller','quiz-heike-hoffmann','quiz-sabine-krueger','stadt-ute-ruhe','crowd-baerbel-brezel','crowd-irmgard-aktenordner','stadt-karl-heinz-post','stadt-renate-termin'];
  assert.deepEqual(Object.entries(manifest.characters).filter(([,p])=>p.standingOnly===false).map(([id])=>id),ids);
  for(const id of ids){
    const p=manifest.characters[id];assert.equal(p.figureWorldHeight,2.77,id);
    assert(p.strideDistance>0,id);
    if(p.motionDelivery){
      const bytes=readFileSync(new URL('../'+p.motionDelivery.file.replace(/^\.\//,''),import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'),p.motionDelivery.sha256,id);
      assert.equal(JSON.parse(bytes).definitionSha256,digest(p),id);
    }
  }
});
