import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

const directory='assets/voices/knick/browser/',manifest=JSON.parse(readFileSync(directory+'manifest.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const binding=JSON.parse(readFileSync('For-AI/VOICE-CAST.json')).productionVoices['amt-brunhilde-knick'];

test('the one delivered name model has its selected Knick binding and bounded verified transport',()=>{
 for(const key of ['profileId','referenceSha256','originalSha256'])assert.equal(manifest[key],binding[key]);
 assert.equal(manifest.voiceId,'amt-brunhilde-knick');assert.equal(manifest.sampleRate,22050);
 assert.equal(manifest.compression,'gzip');assert.match(manifest.model,/^knick-[a-f0-9]{12}\.onnx\.bin$/);
 assert.deepEqual(readdirSync(directory).filter(file=>file.endsWith('.bin')),[manifest.model]);
 const encoded=readFileSync(directory+manifest.model);
 assert.equal(encoded.length,manifest.downloadBytes);assert.equal(hash(encoded),manifest.downloadSha256);
 const decoded=gunzipSync(encoded,{maxOutputLength:20_000_000});
 assert.equal(decoded.length,manifest.bytes);assert.equal(hash(decoded),manifest.sha256);
 assert.equal(manifest.model,'knick-'+manifest.sha256.slice(0,12)+'.onnx.bin');
 assert(manifest.bytes<20_000_000&&manifest.downloadBytes<20_000_000);
 assert(manifest.trainingTakes>=100&&manifest.trainingMinutes>10);
 assert.equal(manifest.nameContextFrames,16);
 assert.equal(manifest.contextSuffix,', bitte zu Schalter eins!');
 assert.equal(manifest.qualityStatus,'accepted-intercom-derivative');
 for(const key of ['sourceModelSha256','checkpointSha256','baseCheckpointSha256','trainingSourcesSha256','browserMetadataSha256'])assert.match(manifest[key],/^[a-f0-9]{64}$/);
});

test('all four prerecorded tails are bounded and bound to the same intercom source',()=>{
 assert.equal(manifest.counterTails.length,4);
 for(const [index,part] of manifest.counterTails.entries()){
  assert.equal(part.counter,index+1);assert.equal(part.file,`counter-${index+1}.wav`);
  assert.equal(part.profileId,binding.profileId);assert.equal(part.referenceSha256,binding.referenceSha256);
  assert.equal(part.sampleRate,22050);assert.equal(part.channels,1);
  const bytes=readFileSync(directory+part.file);assert.equal(bytes.length,part.bytes);assert.equal(hash(bytes),part.sha256);
  assert(part.bytes<400000);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
  assert.equal(bytes.readUInt16LE(20),1);assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt32LE(24),22050);
  assert.equal(bytes.readUInt16LE(34),16);assert.equal(bytes.readUInt32LE(40),bytes.length-44);
 }
 assert(manifest.nameOnlyVerification.maximumRetainedSampleError<1e-4);
});

test('the shipped phonemizer matches training and the published inference scales',()=>{
 const prefix='assets/vendor/piper-phonemize/1.0.0/';
 const delivery=JSON.parse(readFileSync(prefix+'delivery.json')).delivery;
 assert.deepEqual(manifest.browserPhonemizer,delivery);
 for(const [file,receipt] of Object.entries(delivery)){
  const bytes=readFileSync(prefix+file);assert.equal(bytes.length,receipt.bytes);assert.equal(hash(bytes),receipt.sha256);
 }
 const inference=JSON.parse(readFileSync(directory+'config.json')).inference;
 assert.deepEqual([inference.noise_scale,inference.length_scale,inference.noise_w],manifest.inferenceScales);
 assert.deepEqual(manifest.inferenceScales,[0,1.2,0]);
 assert(readFileSync(prefix+'COPYING-espeak-ng','utf8').includes('GNU GENERAL PUBLIC LICENSE'));
 assert(readFileSync(prefix+'LICENSE-piper-phonemize','utf8').includes('MIT License'));
});

test('speech assets remain browser buffers without app-owned persistent storage or file saves',()=>{
 for(const path of ['knick-speech.js','knick-speech-worker.js'])assert.doesNotMatch(readFileSync(path,'utf8'),/caches\.|indexedDB|showSaveFilePicker|navigator\.storage|download\s*=/);
 assert.match(readFileSync('knick-speech-worker.js','utf8'),/fetch\(new URL\(manifest.model,modelRoot\),\{cache:'no-store'\}\)/);
});
