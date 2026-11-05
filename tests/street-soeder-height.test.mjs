import {expandStreetManifest} from '../street-manifest.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {streetMotionDeliveryDefinitionBytes} from '../street-motion-delivery.js';

const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));

test('production selects Günther’s complete adult family with its Söder-height fit',()=>{
  const selected=expandStreetManifest(read('assets/characters/street/manifest.json')).characters['stadt-guenther-tuev'];
  assert.equal(selected.standingOnly,false);
  assert.equal(selected.figureWorldHeight,2.77);
  const authored=read('assets/sprite-sources/resident-motion/stadt-guenther-tuev/adult-v1/validation-baseline.json').person;
  assert.equal(authored.figureWorldHeight,2.33);
  assert.deepEqual(selected,{
    ...authored,
    figureWorldHeight:2.77,
    strideDistance:authored.strideDistance*2.77/authored.figureWorldHeight,
    motionDelivery:selected.motionDelivery,
  });
  const delivery=read(selected.motionDelivery.file.replace(/^\.\//,''));
  assert.equal(delivery.definitionSha256,createHash('sha256').update(streetMotionDeliveryDefinitionBytes(selected)).digest('hex'));
  assert.deepEqual(selected,read('assets/characters/residents/stadt-guenther-tuev/delivery-v2/person.json'));
});
