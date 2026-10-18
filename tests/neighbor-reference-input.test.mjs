import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validNeighborReferenceConditioning,neighborNativeCompletion} from '../tools/curate-voice-library.mjs';

// Metadata contract only; private admission separately verifies actual reference/native/ASR bytes.
const reference={
 "policy": "literal-reference-pcm-excerpt-v1",
 "profileId": "fec92a799b3a48879cc2d90ce2ae2e10",
 "profileReferenceSha256": "1ccb91c8cc1fd03ee28fd46b0d727e7f69717ed70e15210c538a1283dca26c06",
 "sourceStartSample": 0,
 "sourceEndSampleExclusive": 97920,
 "sourceSampleRateHz": 24000,
 "sourceChannels": 1,
 "sourceBitsPerSample": 16,
 "referenceSha256": "012b9c85f149767274b44fc9a977c7bf8e6d69d69cfaaa9fc5d1e7aa8aac975f",
 "referencePcmSha256": "55accb637a508f3161f03889d4c2a4bc4d2e81ef5acd81a8662eb42e5976945a",
 "referenceText": "Hello everybody, my name is Heiko Schmidt.",
 "referenceTextSha256": "c918935c45756afc17c6b8a252f30d9862ec81da105cdfbb0ff5873b504ed6e9",
 "inputProofSha256": "b501efa381506adec6b0992cedbf0c3f33f63ca28758babdfdb5e9e6868b5465",
 "boundaryEvidenceSha256": "8351bc24487fcbb95d0560694dcd4775521c7fd1bba92ff7b8bc30c6e6498845"
};
const take=()=>({voiceId:'jwd-heiko-maaslos',profileId:reference.profileId,referenceSha256:reference.profileReferenceSha256,referenceOriginalSha256:reference.profileReferenceSha256,referenceConditioning:structuredClone(reference),nativeCompletion:{completed:true,inferenceParameters:{numStep:64,speed:.9,device:'cuda',dtype:'f16',preprocessPrompt:true}}});

test('reviewed professor input distinguishes selected profile from actual literal inference reference',()=>{
 const clip=take();assert.notEqual(clip.referenceSha256,clip.referenceConditioning.referenceSha256);
 assert.equal(validNeighborReferenceConditioning(clip),true);assert.equal(neighborNativeCompletion(clip),true);
 const legacy=take();delete legacy.referenceConditioning;assert.equal(validNeighborReferenceConditioning(legacy),true);assert.equal(neighborNativeCompletion(legacy),true);
});

test('reference metadata rejects changed inputs, lost provenance, wrong identities and altered inference controls',async t=>{
 const bad={null:c=>c.referenceConditioning=null,array:c=>c.referenceConditioning=[],speaker:c=>c.voiceId='jwd-inga-maaslos',profile:c=>c.profileId='other',selectedReference:c=>c.referenceSha256=reference.referenceSha256,original:c=>c.referenceOriginalSha256='0'.repeat(64),extraField:c=>c.referenceConditioning.unreviewed=true,steps:c=>c.nativeCompletion.inferenceParameters.numStep=32,speed:c=>c.nativeCompletion.inferenceParameters.speed=1,preprocessing:c=>c.nativeCompletion.inferenceParameters.preprocessPrompt=false,assembled:c=>c.nativeParts=[],parentKind:c=>c.nativeCompletion.kind='ordered-complete-native-parts'};
 for(const key of Object.keys(reference)){bad['changed '+key]=c=>c.referenceConditioning[key]=typeof c.referenceConditioning[key]==='number'?c.referenceConditioning[key]+1:'changed';bad['missing '+key]=c=>delete c.referenceConditioning[key]}
 for(const [name,change]of Object.entries(bad))await t.test(name,()=>{const clip=take();change(clip);assert.equal(validNeighborReferenceConditioning(clip),false);assert.equal(neighborNativeCompletion(clip),false,'native admission must call the reference-input gate')});
});

test('shipped runtime receipts preserve the actual input variant alongside the unchanged selected professor binding',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/voices/neighbors/heiko-manifest.json',import.meta.url),'utf8')),window={};
 vm.runInNewContext(readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8'),{window});
 const catalog=window.GermanySimulatorAudioText,variants=manifest.clips.filter(c=>c.referenceConditioning);
 assert.ok(variants.some(c=>c.clipId==='heiko-story-16'),'restored introduction carries its actual input provenance');
 for(const clip of manifest.clips){const runtime=catalog.recordings['./'+clip.file];assert.ok(runtime);assert.equal(runtime.referenceSha256,reference.profileReferenceSha256);assert.equal(JSON.stringify(runtime.referenceConditioning),JSON.stringify(clip.referenceConditioning));const parts=clip.nativeParts?.flatMap((part,index)=>part.referenceConditioning?[{index,referenceConditioning:part.referenceConditioning}]:[])||[];assert.equal(JSON.stringify(runtime.nativePartReferenceInputs),JSON.stringify(parts.length?parts:undefined));if(clip.referenceConditioning)assert.equal(validNeighborReferenceConditioning(clip),true);for(const part of clip.nativeParts||[])if(part.referenceConditioning)assert.equal(validNeighborReferenceConditioning(part),true)}
});
