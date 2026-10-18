import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validNeighborRenderInput,neighborNativeCompletion} from '../tools/curate-voice-library.mjs';
const sha=text=>createHash('sha256').update(text).digest('hex');
const take=(text,policy,input)=>({voiceId:'jwd-heiko-maaslos',text,actualInferenceText:input,canonicalSourceSha256:sha(text),actualInferenceSha256:sha(input),renderNormalizationPolicy:policy,nativeCompletion:{completed:true}});
const rows=[
 ['Ich sag’s Ihnen.','finite-authored-apostrophe-contractions-v1','Ich sag es Ihnen.'],
 ['Sie schauen, ja?','finite-spoken-tag-and-elision-punctuation-v1','Sie schauen. Ja?'],
 ['Ich hab ihm gesagt.','finite-spoken-tag-and-elision-punctuation-v1',"Ich hab' ihm gesagt."],
 ['Ich sag’s Ihnen.','finite-spoken-short-form-pause-v1','Ich sag … es Ihnen.'],
 ['Ich hab ihm gesagt.','finite-spoken-short-form-pause-v1','Ich hab … ihm gesagt.'],
 ['Sie schauen, ja?','finite-spoken-short-form-pause-v1','Sie schauen; ja?']
];
test('finite inference punctuation and contractions preserve every canonical word',()=>{
 for(const args of rows){const c=take(...args);assert.equal(validNeighborRenderInput(c),true);assert.equal(neighborNativeCompletion(c),true)}
 assert.equal(validNeighborRenderInput({text:'Unchanged canonical source.'}),true);
});
test('render input rejects word changes, lost hashes, other voices and parent-level claims',async t=>{
 for(const [name,change]of Object.entries({
  words:c=>c.actualInferenceText+=' nicht',canonical:c=>c.canonicalSourceSha256=sha('other'),input:c=>c.actualInferenceSha256=sha('other'),
  missingInput:c=>delete c.actualInferenceText,missingPolicy:c=>delete c.renderNormalizationPolicy,unknownPolicy:c=>c.renderNormalizationPolicy='arbitrary',
  wrongVoice:c=>c.voiceId='jwd-inga-maaslos',parent:c=>c.nativeParts=[],parentKind:c=>c.nativeCompletion.kind='ordered-complete-native-parts',
  falselyUnchanged:c=>{c.actualInferenceText=c.text;c.actualInferenceSha256=sha(c.text)}
 }))await t.test(name,()=>{const c=take(...rows[0]);change(c);assert.equal(validNeighborRenderInput(c),false);assert.equal(neighborNativeCompletion(c),false)});
});
