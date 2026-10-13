import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

const root='assets/voices/kriminalpolizei/browser/',manifest=JSON.parse(readFileSync(root+'manifest.json'));
const binding=JSON.parse(readFileSync('For-AI/VOICE-CAST.json')).productionVoices.kriminalpolizei;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('the one accepted compact caller model retains the selected Kripo source and bounded transport',()=>{
 for(const key of ['profileId','referenceSha256','originalSha256'])assert.equal(manifest[key],binding[key]);
 assert.equal(manifest.voiceId,'kriminalpolizei');assert.equal(manifest.qualityStatus,'accepted-caller-name-derivative');
 assert.equal(manifest.nameContextFrames,16);assert.equal(manifest.contextSuffix,', hier ist die Kriminalpolizei am Apparat!');
 assert.deepEqual(readdirSync(root).filter(file=>file.endsWith('.bin')),[manifest.model]);
 const encoded=readFileSync(root+manifest.model);assert.equal(encoded.length,manifest.downloadBytes);assert.equal(hash(encoded),manifest.downloadSha256);
 const decoded=gunzipSync(encoded,{maxOutputLength:20_000_000});assert.equal(decoded.length,manifest.bytes);assert.equal(hash(decoded),manifest.sha256);
 assert.equal(manifest.model,'kripo-'+manifest.sha256.slice(0,12)+'.onnx.bin');assert(encoded.length<20_000_000);
 assert.equal(manifest.trainingTakes,187);assert.equal(manifest.trainingGlobalStep,2000);
 assert.equal(manifest.frozenStateVerification.unchangedPriorFlowTensors,507);
 for(const key of ['trainingSourcesSha256','trainingRunSha256','checkpointSha256','teacherCheckpointSha256','sourceEmbeddingSha256','targetEmbeddingSha256','targetEmbeddingInputSha256','listeningSampleSha256'])assert.match(manifest[key],/^[a-f0-9]{64}$/);
 assert.equal(manifest.targetEmbeddingInputSha256,hash(readFileSync('assets/voices/kriminalpolizei/kriminalpolizei-phone-01.mp3')));
 assert.equal(manifest.teacherRevision,'f36e7edfe1684461a8343844af60babc2efbb727');
 const license=readFileSync(root+'LICENSE-OpenVoice','utf8');
 assert(license.includes('Copyright 2024 MyShell.ai')&&license.includes('Permission is hereby granted, free of charge'));
});

test('the small fixed greeting parts retain exact selected profile and waveform receipts',()=>{
 assert.equal(manifest.speechParts.length,2);
 for(const [index,part] of manifest.speechParts.entries()){
  assert.equal(part.role,['prefix','suffix'][index]);assert.equal(part.file,part.role+'.wav');
  assert.equal(part.profileId,binding.profileId);assert.equal(part.referenceSha256,binding.referenceSha256);
  const bytes=readFileSync(root+part.file);assert.equal(bytes.length,part.bytes);assert.equal(hash(bytes),part.sha256);assert(bytes.length<400000);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt16LE(20),1);assert.equal(bytes.readUInt16LE(22),1);
  assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.readUInt16LE(34),16);assert.equal(bytes.readUInt32LE(40),bytes.length-44);
  assert.equal(part.endSample-part.startSample,(bytes.length-44)/2);
 }
 assert(manifest.speechParts.reduce((sum,part)=>sum+part.bytes,0)<150000);
 const delivery=JSON.parse(readFileSync('assets/vendor/piper-phonemize/1.0.0/delivery.json')).delivery;
 assert.deepEqual(manifest.browserPhonemizer,delivery);assert.deepEqual(manifest.inferenceScales,[0,1.2,0]);
});
