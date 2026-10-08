import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
test('Knick preview correspondence stays bound to the existing art and valid point data',()=>{
 const manifest=JSON.parse(read('assets/previews/knick-splats/manifest.json'));
 assert.equal(hash(read(manifest.source)),manifest.source_sha256);
 const bytes=read('assets/previews/knick-splats/correspondence.bin');assert.equal(hash(bytes),manifest.correspondence_sha256);
 assert.equal(bytes.length,manifest.sample_count*manifest.record_floats*4);
 assert.equal(manifest.record_floats,9);const counts=[0,0];
 for(let offset=0;offset<bytes.length;offset+=36){
  const values=Array.from({length:9},(_,i)=>bytes.readFloatLE(offset+i*4));assert(values.every(Number.isFinite));
  assert(values.slice(0,4).every(v=>Math.abs(v)<4),'registered point escaped the study canvas');
  assert(values.slice(4,8).every(v=>v>=0&&v<=1),'invalid colour/opacity');
  assert(values[8]===0||values[8]===1);counts[values[8]]++;
 }
 assert(counts.every(count=>count>1000),'both anchors need visible samples');
 assert.match(manifest.status,/preview-only/);
});
test('Spark preview pins its module and remains outside canonical game imports',()=>{
 assert.equal(hash(read('assets/vendor/spark/2.3.1/spark.module.js')),'2de375d5e489692f976abe3199c8435ecc00f97fabaf35e489eb7d368e1f6f60');
 for(const file of ['index.html','3d.html','game.js','world3d.js'])assert(!read(file).includes(Buffer.from('spark-preview')));
 const html=read('spark-preview.html').toString();assert.match(html,/three@0\.186\.0/);assert(!html.includes('output/'));
});
