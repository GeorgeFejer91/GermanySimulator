import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validNeighborAsrInputTransform} from '../tools/curate-voice-library.mjs';

// Synthetic receipt-shape fixtures only. Actual audio/PCM admission is reviewed separately.
const text='Das ist nicht knapp.';
const person={dialogue:Array.from({length:33},()=>({text}))};
const digest=character=>character.repeat(64);
function fixture(){
 return {
  voiceId:'jwd-heiko-maaslos',clipId:'heiko-story-21',text,
  sourceSha256:createHash('sha256').update(text).digest('hex'),
  sha256:digest('a'),durationSeconds:4,asrModelSha256:digest('f'),
  asrLanguageId:'de',asrScriptPrompt:null,asrUnframedTranscript:'Das ist knapp.',
  asrInputTransform:{kind:'leading-zero-silence-v1',seconds:1,sampleRate:16000,channels:1,bitsPerSample:16,
   originalSampleCount:64000,prefixSampleCount:16000,paddedSampleCount:80000,
   sourceMp3Sha256:digest('a'),decodedPcmSha256:digest('b'),paddedPcmSha256:digest('c'),
   asrInputWavSha256:digest('d'),asrReceiptSha256:digest('e'),asrModelSha256:digest('f'),
   asrBinarySha256:digest('1'),priorAsrReceiptSha256:digest('2'),priorAsrInputWavSha256:digest('3'),
   speechSamplesUnmodified:true,zeroPrefixVerified:true,priorAsrWordExact:false}
 };
}
test('legacy receipts remain valid without transform metadata',()=>{
 assert.equal(validNeighborAsrInputTransform({},person),true);
 assert.equal(validNeighborAsrInputTransform({asrUnframedTranscript:'Unlabelled alternate reading'},person),false);
});
test('one reviewed offset preserves exact sample counts, source and failed reading',()=>{
 for(const [voiceId,clipId] of [['jwd-heiko-maaslos','heiko-story-21'],['jwd-heiko-maaslos','heiko-story-33'],['jwd-theodore-maaslos','theodore-story-01']]){
  assert.equal(validNeighborAsrInputTransform({...fixture(),voiceId,clipId},person),true,clipId);
 }
});
test('offset receipts reject changed samples, absent evidence and unrelated sources',()=>{
 for(const [key,value] of Object.entries({kind:'other',seconds:2,sampleRate:8000,channels:2,bitsPerSample:32,
  originalSampleCount:63999.5,prefixSampleCount:0,paddedSampleCount:79999,sourceMp3Sha256:digest('0'),
  asrModelSha256:digest('0'),speechSamplesUnmodified:false,zeroPrefixVerified:false,priorAsrWordExact:true})){
  const clip=fixture();clip.asrInputTransform[key]=value;
  assert.equal(validNeighborAsrInputTransform(clip,person),false,key);
 }
 for(const key of Object.keys(fixture().asrInputTransform)){
  const clip=fixture();delete clip.asrInputTransform[key];
  assert.equal(validNeighborAsrInputTransform(clip,person),false,'missing '+key);
 }
 for(const [key,value] of Object.entries({voiceId:'jwd-inga-maaslos',clipId:'heiko-story-22',sourceSha256:digest('0'),
  durationSeconds:5,asrLanguageId:'en',asrScriptPrompt:text,asrUnframedTranscript:text})){
  const clip=fixture();clip[key]=value;assert.equal(validNeighborAsrInputTransform(clip,person),false,key);
 }
 const unbound=fixture();delete unbound.sha256;delete unbound.asrInputTransform.sourceMp3Sha256;
 assert.equal(validNeighborAsrInputTransform(unbound,person),false,'two missing hashes cannot match');
 const noModel=fixture();delete noModel.asrModelSha256;delete noModel.asrInputTransform.asrModelSha256;
 assert.equal(validNeighborAsrInputTransform(noModel,person),false,'two missing model hashes cannot match');
 assert.equal(validNeighborAsrInputTransform(fixture(),{dialogue:[]}),false,'canonical source is required');
});
