import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cityRecordingsBlock} from '../tools/curate-voice-library.mjs';

// Structural projection only; synthetic bins cannot pass actual MP3 re-decoding at admission.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const cast=JSON.parse(readFileSync(resolve(root,'For-AI/VOICE-CAST.json'),'utf8'));
const directory=resolve(root,'assets/voices/city-dialogue');
const manifests=readdirSync(directory).filter(name=>name.endsWith('-manifest.json')).sort().map(name=>{
 const path=resolve(directory,name),relative=`assets/voices/city-dialogue/${name}`;
 return {...JSON.parse(readFileSync(path,'utf8')),provenanceManifest:relative,provenanceManifestSha256:hash(readFileSync(path))};
});
const current=manifests.flatMap(manifest=>manifest.clips.map(clip=>({clip,manifest})));
const row=(clip,manifest)=>({clipId:clip.clipId,voiceId:clip.voiceId,actorId:clip.actorId,profileId:clip.profileId,file:clip.file,sha256:clip.sha256,encodedReceiptSha256:manifest.cityProvenance.takes[clip.clipId].encoded.sha256,pcmSha256:'0'.repeat(64),sampleCount:600,durationSeconds:.025,mouthHz:40,mouthEnergy:[0],energySha256:hash(Buffer.from([0]))});
const supplement=()=>({kind:'city-final-mp3-mouth-energy-supplement-v1',recipeBuilderSha256:'08de0ab462c3b3a3aa37108ffabee3f73b4453a984f389c301e0a7b86b24edd8',recipeCanonicalBuilderSha256:'b07e8bfd3577c34cc7677f083fd46f42d05c2fd37a861aa6e1ad273bc8053a3b',admissionRecipeBuilderSha256:'b07e8bfd3577c34cc7677f083fd46f42d05c2fd37a861aa6e1ad273bc8053a3b',recipeLineSha256:'903ba63ae5bbbb4f2608578be579c0507b5cb1883d2839e2ea426f9dc4499604',ffmpegSha256:'74db6c184a03dba2bdfe23e1a1f41cf5a8385bc1de6a7a1b26db1dc541abef93',measurementSha256:'38391e53ba5f1fc21478271165317daaefa1c8d77f9a0ab81d4338f8816003ac',clips:Object.fromEntries(current.slice(0,43).map(({clip,manifest})=>[clip.clipId,row(clip,manifest)]))});

test('city mouth supplement is optional and cannot alter old default lookup',()=>{
 const generated=cityRecordingsBlock(cast,manifests,root,root);
 assert.equal((generated.match(/"mouthHz":40/g)||[]).length,0);
 assert.match(generated,/^const cityRecordings=Object\.freeze/);
});

test('city mouth projection carries only the separately supplied bins',()=>{
 const generated=cityRecordingsBlock(cast,manifests,root,root,supplement());
 assert.match(generated,/"mouthHz":40,"mouthEnergy":\[0\]/);
 assert.equal((generated.match(/"mouthHz":40/g)||[]).length,43);
});

for(const [name,mutate] of [
 ['wrong profile',s=>{s.clips[current[0].clip.clipId].profileId='foreign'}],
 ['wrong final MP3 hash',s=>{s.clips[current[0].clip.clipId].sha256='0'.repeat(64)}],
 ['wrong encoded receipt',s=>{s.clips[current[0].clip.clipId].encodedReceiptSha256='0'.repeat(64)}],
 ['wrong recipe',s=>{s.recipeLineSha256='0'.repeat(64)}],
 ['wrong canonical recipe',s=>{s.recipeCanonicalBuilderSha256='0'.repeat(64)}],
 ['unknown admission recipe file',s=>{s.admissionRecipeBuilderSha256='0'.repeat(64)}],
 ['wrong measured PCM bin count',s=>{s.clips[current[0].clip.clipId].sampleCount=1200}],
 ['out of range bin',s=>{s.clips[current[0].clip.clipId].mouthEnergy=[256]}],
 ['missing old clip',s=>{delete s.clips[current[0].clip.clipId]}],
 ['extra clip',s=>{s.clips.foreign={}}],
])test(`city mouth rejects ${name}`,()=>{
 const candidate=supplement();mutate(candidate);
 assert.throws(()=>cityRecordingsBlock(cast,manifests,root,root,candidate));
});
