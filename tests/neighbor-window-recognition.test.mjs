import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {neighborWindowRecognition,neighborNativeCompletion,neighborSpokenWords} from '../tools/curate-voice-library.mjs';

// Public manifest metadata only. Private byte admission remains the authority
// for actual PCM equality and recognition receipts; no models/media run here.
const sha=value=>createHash('sha256').update(value).digest('hex');
const known={
 'heiko-story-24':{encoded:'cf9d612014ff425760dfbc81bb57c5232af45aa5fe0c2d95a945ec14822c481f',proof:'1ee63a1fef234af2e3782fb6fee74427ff727312cec8756e6a72cb78e7e74cb9'},
 'heiko-story-27':{encoded:'e5249c6bf73e81e88a2ed92cfd895285027bc8179bf6862710df2f0f1cb9c0c8',proof:'b621dffc14f04cae06c0c65b301f5f96c66580b49fa1c55be7366c671ab41855'}
};
function fixture(id){
 const manifest=JSON.parse(readFileSync(new URL('../assets/voices/neighbors/heiko-manifest.json',import.meta.url),'utf8'));
 const clip=manifest.clips.find(c=>c.clipId===id);
 assert(clip,`${id}: actual released window-qualified encoding must be present`);
 assert.equal(clip.sha256,known[id].encoded);
 assert.equal(sha(JSON.stringify(clip.asrWindowProof)),known[id].proof);
 return structuredClone(clip);
}

test('dran bleibt spacing normalization preserves lexical, inflection, order and negation differences',()=>{
 const canonical='Nur Latein, da müssen wir noch ein bisschen, also wir helfen ihm, dass er dranbleibt.';
 assert.equal(neighborSpokenWords(canonical),neighborSpokenWords(canonical.replace('dranbleibt','dran bleibt')));
 for(const changed of ['dran bleiben','drin bleibt','dranbleiben','bleibt dran','nicht dran bleibt','dran nicht bleibt','dran bleibt nicht','bleibt','dran bleibst']){
  assert.notEqual(neighborSpokenWords(canonical),neighborSpokenWords(canonical.replace('dranbleibt',changed)),changed);
 }
 assert.notEqual(neighborSpokenWords('Ich sag’s Ihnen.'),neighborSpokenWords('Ich sage es Ihnen.'));
 assert.notEqual(neighborSpokenWords('Ich hab ihm gesagt.'),neighborSpokenWords('Ich habe ihm gesagt.'));
});

test('unregistered legacy metadata remains compatible but synthetic window claims receive no authority',()=>{
 assert.equal(neighborWindowRecognition({clipId:'legacy',sha256:sha('legacy')}),true);
 assert.equal(neighborWindowRecognition({clipId:'synthetic',voiceId:'jwd-heiko-maaslos',sha256:sha('synthetic'),
  asrVerificationMode:'exhaustive-final-encoding-windows-v1',asrWindowProof:{kind:'exhaustive-final-encoding-windows-v1'}}),false);
 assert.equal(neighborWindowRecognition({clipId:'legacy',asrWindowProof:{}}),false);
});

for(const id of Object.keys(known)){
 test(`${id}: actual released proof accepts complete native provenance and exhaustive final-encoding windows`,()=>{
  const clip=fixture(id),proof=clip.asrWindowProof,coverage=proof.nativeCoverage,join=clip.nativeCompletion.join;
  assert.equal(neighborNativeCompletion(clip),true);
  assert.equal(neighborWindowRecognition(clip),true);
  assert.equal(coverage.joinedNativeAudioSha256,clip.nativeAudioSha256);
  assert.equal(coverage.totalSamples,join.outputSamples);
  assert.equal(coverage.authorizationSha256,clip.nativeCompletion.authorizationSha256);
  assert.deepEqual(coverage.partAudioSha256,join.partAudioSha256);
  assert.equal(proof.windows.length,clip.nativeParts.length);
  let end=0,nativeSamples=0;
  for(const [index,window]of proof.windows.entries()){
   const part=clip.nativeParts[index];nativeSamples+=part.nativeSamples;
   assert.equal(window.index,index);
   assert.equal(window.startSample,end,'every final sample belongs to the next contiguous window');
   assert.equal(window.endSampleExclusive,index===proof.windows.length-1?proof.totalSamples:Math.round(nativeSamples*16000/24000));
   assert(window.endSampleExclusive>window.startSample);
   assert.equal(window.sourceStart,part.sourceStart);assert.equal(window.sourceEnd,part.sourceEnd);
   assert.equal(part.text,clip.text.slice(window.sourceStart,window.sourceEnd));
   assert.equal(neighborSpokenWords(window.transcript),neighborSpokenWords(part.text));
   end=window.endSampleExclusive;
  }
  assert.equal(end,proof.totalSamples);
  assert.equal(end,Math.round(join.outputSamples*16000/24000));
  assert.equal(clip.asr,proof.windows.map(w=>w.transcript).join(' '));
  assert(proof.priorWholeReadings.length>0);
  assert(proof.priorWholeReadings.every(row=>row.exact===false&&neighborSpokenWords(row.transcript)!==neighborSpokenWords(clip.text)));
 });

 test(`${id}: removal, tampering, incomplete coverage and replaced native provenance reject`,async t=>{
  const original=fixture(id);
  const mutations=[
   ['missing proof',c=>delete c.asrWindowProof],
   ['missing mode',c=>delete c.asrVerificationMode],
   ['legacy disguise',c=>{delete c.asrVerificationMode;delete c.asrWindowProof}],
   ['renamed legacy disguise',c=>{c.clipId='renamed-window-asset';delete c.asrVerificationMode;delete c.asrWindowProof}],
   ['unknown mode',c=>c.asrVerificationMode='other'],
   ['wrong final encoding',c=>c.sha256=sha('replacement final encoding')],
   ['wrong speaker',c=>c.voiceId='jwd-inga-maaslos'],
   ['changed proof receipt',c=>c.asrWindowProof.fullInputWavSha256=sha('other input')],
   ['missing prior whole readings',c=>delete c.asrWindowProof.priorWholeReadings],
   ['changed ASR model',c=>c.asrModelSha256=sha('other recognizer')],
   ['prompted reading',c=>c.asrScriptPrompt=c.text],
   ['stacked ASR transform',c=>c.asrInputTransform={kind:'leading-zero-silence-v1'}],
   ['stacked unframed transcript',c=>c.asrUnframedTranscript=c.text],
   ['window gap',c=>c.asrWindowProof.windows[1].startSample++],
   ['window overlap',c=>c.asrWindowProof.windows[1].startSample--],
   ['missing window',c=>c.asrWindowProof.windows.pop()],
   ['reordered windows',c=>c.asrWindowProof.windows.reverse()],
   ['wrong last endpoint',c=>c.asrWindowProof.windows.at(-1).endSampleExclusive--],
   ['wrong source span',c=>c.asrWindowProof.windows[0].sourceEnd--],
   ['changed window words',c=>c.asrWindowProof.windows[0].transcript+=' nicht'],
   ['parent transcript drift',c=>c.asr+=' nicht'],
   ['missing native completion',c=>delete c.nativeCompletion],
   ['missing leaf benchmark',c=>delete c.nativeParts[0].nativeCompletion.inferenceSha256],
   ['changed leaf speaker',c=>c.nativeParts[0].voiceId='jwd-inga-maaslos'],
   ['unfinished leaf',c=>c.nativeParts[0].nativeCompletion.completed=false],
   ['replaced joined native hash',c=>{c.nativeAudioSha256=sha('different joined native');c.nativeCompletion.join.outputAudioSha256=c.nativeAudioSha256}],
   ['replaced joined PCM hash',c=>c.nativeCompletion.join.outputPcmSha256=sha('different joined PCM')],
   ['replaced assembly receipt',c=>c.nativeAnnotationSha256=sha('different assembly receipt')],
   ['replaced native authorization',c=>c.nativeCompletion.authorizationSha256=sha('different native authority')],
   ['replaced native part hash',c=>{c.nativeParts[0].nativeAudioSha256=sha('different native part');c.nativeCompletion.join.partAudioSha256[0]=c.nativeParts[0].nativeAudioSha256}],
   ['replaced native part PCM hash',c=>c.nativeCompletion.join.partPcmSha256[0]=sha('different native part PCM')]
  ];
  if(original.nativeSynthesisAccounting)mutations.push(
   ['missing truthful call lineage',c=>delete c.nativeSynthesisAccounting],
   ['native calls disagree with sealed selected-leaf accounting',c=>{
    c.nativeParts[0].synthesisCalls++;
    c.nativeCompletion.partSynthesisCalls=c.nativeParts.reduce((sum,part)=>sum+part.synthesisCalls,0);
   }]
  );
  for(const [name,change]of mutations)await t.test(name,()=>{
   const clip=structuredClone(original);change(clip);assert.equal(neighborWindowRecognition(clip),false);
  });
 });
}
