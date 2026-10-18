import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {neighborNativeCompletion} from '../tools/curate-voice-library.mjs';

const sha=text=>createHash('sha256').update(text).digest('hex');
function fixture(){
 const binding={voiceId:'jwd-heiko-maaslos',profileId:'selected-profile',referenceSha256:sha('reference'),referenceOriginalSha256:sha('original'),renderer:'omnivoice-rs',modelRevision:'selected-revision',processing:'selected-recipe'};
 const text='Das ist der Weg. Kommen Sie mit.';
 const ranges=[[0,16],[17,text.length]];
 const nativeParts=ranges.map(([sourceStart,sourceEnd],index)=>({...binding,index,sourceStart,sourceEnd,text:text.slice(sourceStart,sourceEnd),synthesisCalls:1,seed:71901,nativeAudioSha256:sha('raw'+index),nativeAnnotationSha256:sha('annotation'+index),encodedSha256:sha('encoded'+index),nativeSamples:24000,nativeSampleRateHz:24000,nativeChannels:1,nativeCompletion:{completed:true,inferenceSha256:sha('bench'+index),binarySha256:sha('binary'),inferenceParameters:{numStep:64,speed:.9,device:'cuda',dtype:'f16',preprocessPrompt:true}},asrScriptPrompt:null,asrWordExact:true,asrModelSha256:sha('asr-model'),asr:text.slice(sourceStart,sourceEnd)}));
 return {...binding,text,nativeAudioSha256:sha('joined-pcm'),nativeParts,nativeCompletion:{completed:true,kind:'ordered-complete-native-parts',basis:'ordered complete native parts; no parent model call',parentSynthesisCalls:0,partSynthesisCalls:2,authorizationSha256:sha('finite-authority'),join:{method:'ffmpeg-concat-pcm',sampleRateHz:24000,channels:1,insertedSilence:false,crossfade:false,trim:false,ffmpegSha256:sha('ffmpeg'),partAudioSha256:nativeParts.map(part=>part.nativeAudioSha256),outputAudioSha256:sha('joined-pcm'),outputSamples:48000}}};
}

test('native sentence parts retain exact ordered source, profile, independent words and truthful call accounting',()=>{
 assert.equal(neighborNativeCompletion(fixture()),true);
 assert.equal(neighborNativeCompletion({nativeCompletion:{completed:true}}),true,'existing complete whole takes keep their own receipt kind');
});

test('a third part call is bounded to the explicitly recorded short-form input repair',()=>{
 const c=fixture(),first='Ich hab ihm gesagt.',second='Kommen Sie mit.';c.text=first+' '+second;
 Object.assign(c.nativeParts[0],{text:first,sourceStart:0,sourceEnd:first.length,asr:first,synthesisCalls:3,actualInferenceText:'Ich hab … ihm gesagt.',actualInferenceSha256:sha('Ich hab … ihm gesagt.'),canonicalSourceSha256:sha(first),renderNormalizationPolicy:'finite-spoken-short-form-pause-v1'});
 Object.assign(c.nativeParts[1],{text:second,sourceStart:first.length+1,sourceEnd:c.text.length,asr:second});c.nativeCompletion.partSynthesisCalls=4;
 assert.equal(neighborNativeCompletion(c),true);
 c.nativeParts[0].synthesisCalls=4;c.nativeCompletion.partSynthesisCalls=5;assert.equal(neighborNativeCompletion(c),false);
 c.nativeParts[0].synthesisCalls=3;c.nativeCompletion.partSynthesisCalls=4;
 for(const field of ['actualInferenceText','actualInferenceSha256','canonicalSourceSha256','renderNormalizationPolicy'])delete c.nativeParts[0][field];
 assert.equal(neighborNativeCompletion(c),false,'legacy source cannot silently inherit the repair budget');
});

test('native joins reject missing, substituted, reordered, edited and incompletely verified parts',async t=>{
 for(const [name,change]of[
  ['unknown parent kind',c=>c.nativeCompletion.kind='single-native-take'],
  ['false parent call',c=>c.nativeCompletion.parentSynthesisCalls=1],
  ['false part count',c=>c.nativeCompletion.partSynthesisCalls=1],
  ['missing authority',c=>delete c.nativeCompletion.authorizationSha256],
  ['other speaker',c=>c.voiceId='jwd-inga-maaslos'],
  ['wrong part profile',c=>c.nativeParts[1].profileId='other'],
  ['wrong part reference',c=>c.nativeParts[1].referenceSha256=sha('other')],
  ['omitted source',c=>{c.nativeParts[0].sourceEnd=15;c.nativeParts[0].text=c.text.slice(0,15)}],
  ['overlapping source',c=>c.nativeParts[1].sourceStart=15],
  ['reordered parts',c=>c.nativeParts.reverse()],
  ['extra words',c=>c.nativeParts[0].asr+=' nicht'],
  ['prompted ASR',c=>c.nativeParts[0].asrScriptPrompt=c.nativeParts[0].text],
  ['unfinished native part',c=>c.nativeParts[0].nativeCompletion.completed=false],
  ['missing benchmark',c=>delete c.nativeParts[0].nativeCompletion.inferenceSha256],
  ['missing native parameters',c=>delete c.nativeParts[0].nativeCompletion.inferenceParameters],
  ['changed native controls',c=>c.nativeParts[0].nativeCompletion.inferenceParameters.speed=.5],
  ['missing seed',c=>delete c.nativeParts[0].seed],
  ['nested join',c=>c.nativeParts[0].nativeCompletion.kind='ordered-complete-native-parts'],
  ['nested join without discriminator',c=>c.nativeParts[0].nativeCompletion.join={method:'ffmpeg-concat-pcm'}],
  ['hidden nested parts',c=>c.nativeParts[0].nativeParts=[]],
  ['unbounded attempts',c=>c.nativeParts[0].synthesisCalls=3],
  ['inserted silence',c=>c.nativeCompletion.join.insertedSilence=true],
  ['crossfade',c=>c.nativeCompletion.join.crossfade=true],
  ['crop',c=>c.nativeCompletion.join.trim=true],
  ['wrong input hash',c=>c.nativeCompletion.join.partAudioSha256[0]=sha('other')],
  ['wrong output hash',c=>c.nativeCompletion.join.outputAudioSha256=sha('other')],
  ['lost samples',c=>c.nativeCompletion.join.outputSamples--],
  ['partial render transform',c=>c.nativeParts[0].renderNormalizationPolicy='finite-authored-apostrophe-contractions-v1'],
  ['join mislabeled whole take',c=>delete c.nativeCompletion.kind],
  ['join hidden by deleting both discriminators',c=>{delete c.nativeCompletion.kind;delete c.nativeParts}],
 ])await t.test(name,()=>{const clip=fixture();change(clip);assert.equal(neighborNativeCompletion(clip),false)});
});

test('part render-input normalization permits only the existing exact contraction expansion',()=>{
 const clip=fixture(),part=clip.nativeParts[0];
 clip.text="Ich sag's Ihnen. Kommen Sie mit.";
 part.text="Ich sag's Ihnen.";part.sourceEnd=part.text.length;part.asr='Ich sag es Ihnen.';
 clip.nativeParts[1].sourceStart=part.sourceEnd+1;clip.nativeParts[1].sourceEnd=clip.text.length;
 Object.assign(part,{actualInferenceText:'Ich sag es Ihnen.',canonicalSourceSha256:sha(part.text),actualInferenceSha256:sha('Ich sag es Ihnen.'),renderNormalizationPolicy:'finite-authored-apostrophe-contractions-v1'});
 assert.equal(neighborNativeCompletion(clip),true);
 part.actualInferenceText='Ich sage es Ihnen.';
 assert.equal(neighborNativeCompletion(clip),false,'a changed verb cannot be called a contraction expansion');
});

test('a fully verified joined parent cannot masquerade as one native leaf in another join',()=>{
 const outer=fixture(),inner=fixture(),second=outer.nativeParts[1];
 const nested={...inner,index:0,sourceStart:0,sourceEnd:inner.text.length,synthesisCalls:1,seed:71901,nativeSamples:48000,nativeSampleRateHz:24000,nativeChannels:1,nativeAnnotationSha256:sha('nested-annotation'),encodedSha256:sha('nested-encoded'),asr:inner.text,asrWordExact:true,asrScriptPrompt:null,asrModelSha256:sha('asr-model')};
 assert.equal(neighborNativeCompletion(nested),true,'nested object has a valid join receipt in its own right');
 outer.text=inner.text+' '+second.text;second.sourceStart=inner.text.length+1;second.sourceEnd=outer.text.length;
 outer.nativeParts=[nested,second];outer.nativeCompletion.join.partAudioSha256[0]=nested.nativeAudioSha256;outer.nativeCompletion.join.outputSamples=72000;
 assert.equal(neighborNativeCompletion(outer),false,'a native leaf must represent one complete native inference call');
});
