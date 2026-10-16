import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {policeManifestAuthority,policeRecordingsBlock,voiceGapManifestAuthority} from '../tools/curate-voice-library.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=relative=>readFileSync(resolve(root,relative),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const cast=JSON.parse(read('For-AI/VOICE-CAST.json'));
const relative='assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json';
const manifest={...JSON.parse(read(relative)),provenanceManifest:relative,provenanceManifestSha256:sha(read(relative))};
const context={window:{},location:{search:''},URLSearchParams};
vm.runInNewContext(read('For-AI/AUDIO-TEXT-LIBRARY.js'),context,{timeout:1000});
const catalog=context.window.GermanySimulatorAudioText;
const gap=JSON.parse(read('assets/voices/police-dialogue/polizei-heinrich-wachtmeister-gap-manifest.json'));

test('police defaults resolve only exact approved actor, source and final bytes',()=>{
 const jobs=policeManifestAuthority(cast,manifest,root);
 assert.equal(jobs.size,12);
 assert.equal(manifest.clips.length+manifest.heldPrivate.length,12);
 assert.ok(manifest.clips.length>0);
 const block=policeRecordingsBlock(cast,[manifest],root,root);
 const projected=JSON.parse(vm.runInNewContext(block+'\nJSON.stringify(policeRecordings)',{},{timeout:1000}));
 for(const clip of manifest.clips){
  const path='./'+clip.file,row=catalog.recordings[path];
  assert.equal(sha(readFileSync(resolve(root,clip.file))),clip.sha256);
  assert.equal(catalog.recordedClip(clip.voiceId,clip.text),path);
  assert.equal(catalog.candidateClip(clip.voiceId,clip.text),path);
  assert.deepEqual(JSON.parse(JSON.stringify(row)),projected[path]);
  for(const key of ['voiceId','actorId','profileId','sha256','english'])assert.equal(row[key],clip[key]);
  assert.equal(row.source,clip.text);
 }
 voiceGapManifestAuthority(cast,gap,root);
 assert.deepEqual(gap.clips.map(row=>row.clipId).sort(),['polizei-heinrich-wachtmeister-berlin-04','polizei-heinrich-wachtmeister-germany-01','polizei-heinrich-wachtmeister-germany-04']);
 for(const held of manifest.heldPrivate){
  const replacement=gap.clips.find(row=>row.clipId===held.clipId),path=replacement?'./'+replacement.file:null;
  if(replacement){assert.equal(replacement.voiceId,held.voiceId);assert.equal(replacement.text,held.text);assert.equal(replacement.english,held.english);assert.equal(catalog.recordings[path].sha256,replacement.sha256);}
  assert.equal(catalog.recordedClip(held.voiceId,held.text),path,held.clipId);
  assert.equal(catalog.candidateClip(held.voiceId,held.text),path,held.clipId);
 }
 assert.doesNotMatch(JSON.stringify(manifest),/[A-Za-z]:\\|\/Users\/|\\Users\\/);
});

test('police proof rejects normalized-only words, stale identities and failed phases',()=>{
 for(const mutate of [
  row=>{row.clips[0].asrLiteralWordExact=false},
  row=>{row.clips[0].text+=' stale source'},
  row=>{row.clips[0].profileId='foreign-profile'},
  row=>{row.policeAdmission.terminals.process.exitCode=1},
  row=>{row.policeAdmission.takes[row.clips[0].clipId].encodedSha256='0'.repeat(64)},
  row=>{row.clips[0].english+=' stale subtitle'},
 ]){const changed=structuredClone(manifest);mutate(changed);assert.throws(()=>policeManifestAuthority(cast,changed,root));}
});
