// SOURCE ONLY: ROOT runs this after integrating the proposed curator.
// No native requests, generated receipts, media writes, or model invocations.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';

const sourceRoot=resolve(process.env.GS_CROWD_TEST_ROOT??resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const curatorPath=resolve(process.env.GS_CROWD_TEST_CURATOR??resolve(sourceRoot,'tools/curate-voice-library.mjs'));
const {crowdCandidateBlock,crowdRecordingsBlock,crowdRemainingSeed,verifyCrowdRemainingSeed,verifyCrowdGenerationManifestLedger,verifyCrowdMouthEnergySubset,crowdExpandedMouthEnergyFromCatalog,verifyCrowdRemainingMouthRows}=await import(pathToFileURL(curatorPath).href);
const readJson=file=>JSON.parse(readFileSync(resolve(sourceRoot,file),'utf8').replace(/^\uFEFF/,''));
const digest=file=>createHash('sha256').update(readFileSync(resolve(sourceRoot,file))).digest('hex');
const cast=readJson('For-AI/VOICE-CAST.json');
const firstSeven=readdirSync(resolve(sourceRoot,'assets/voices/candidate-dialogue'))
 .filter(name=>name.endsWith('-crowd-manifest.json'))
 .map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`;return {...readJson(relative),provenanceManifest:relative,provenanceManifestSha256:digest(relative)};})
 .filter(row=>(row.generationScope??'first9')==='first9'&&row.clips.some(clip=>clip.approval?.status==='user-approved'));
assert.equal(firstSeven.length,7,'Fixture requires the seven real first-batch manifests');
const before=JSON.stringify(firstSeven);
const supplement=readJson('assets/voices/candidate-dialogue/crowd-mouth-energy.json');
const first=firstSeven[0];
function emptyRemainingScope(){
 const owned=first.crowdAdmission.fullPlan.jobs.filter(row=>row.voiceId===first.voiceId);
 return {schemaVersion:1,status:'TEST_ONLY_UNTRUSTED_SLOT_FIXTURE_NO_GENERATED_RECEIPTS',generationScope:'remaining27-first-takes',voiceId:first.voiceId,profileId:first.profileId,requestedLineCount:4,generatedLineCount:3,lineCount:0,clips:[],heldPrivate:owned.map(row=>({...row,reason:row.region==='germany'&&row.slot===0?'outside remaining27 grant; first batch preserved':'TEST_ONLY_UNTRUSTED_HELD_SLOT'})),approvedExistingReuse:[]};
}

test('first seven project unchanged when a disjoint empty future scope is present',()=>{
 const rows=verifyCrowdMouthEnergySubset(supplement,firstSeven,sourceRoot);
 const baseline=crowdRecordingsBlock(cast,firstSeven,sourceRoot,sourceRoot,rows);
 const manifests=[...firstSeven,emptyRemainingScope()];
 assert.equal(crowdCandidateBlock(cast,manifests,sourceRoot),crowdCandidateBlock(cast,firstSeven,sourceRoot));
 assert.equal(crowdRecordingsBlock(cast,manifests,sourceRoot,sourceRoot,rows),baseline);
 assert.equal(JSON.stringify(firstSeven),before);
});
test('duplicate voice and generation grant is rejected',()=>{
 assert.throws(()=>crowdCandidateBlock(cast,[...firstSeven,structuredClone(first)],sourceRoot),/duplicate voice\/grant scope/);
 const next=emptyRemainingScope();
 assert.throws(()=>crowdCandidateBlock(cast,[...firstSeven,next,structuredClone(next)],sourceRoot),/duplicate voice\/grant scope/);
});
test('overlapping accepted old slot cannot be relabelled as remaining27',()=>{
 const overlap=emptyRemainingScope();
 overlap.clips=structuredClone(first.clips);
 overlap.lineCount=overlap.clips.length;
 overlap.heldPrivate=overlap.heldPrivate.filter(row=>!overlap.clips.some(clip=>clip.clipId===row.clipId));
 assert.throws(()=>crowdCandidateBlock(cast,[...firstSeven,overlap],sourceRoot),/cannot claim old Germany0/);
});
test('every remaining slot owns its native selected-queue seed',()=>{
 for(const [region,slot,seed] of [['germany',1,71000],['berlin',0,71001],['berlin',1,71002]]){
  const job={region,slot};assert.equal(crowdRemainingSeed(job),seed);assert.equal(verifyCrowdRemainingSeed(job,seed),seed);
  assert.throws(()=>verifyCrowdRemainingSeed(job,seed+1),/Wrong owned remaining27 native seed/);
 }
 assert.throws(()=>crowdRemainingSeed({region:'germany',slot:0}),/outside remaining27/);
});
test('selected manifest requires its exact ROOT admission ledger entry',()=>{
 const relative=first.provenanceManifest,sha=first.provenanceManifestSha256;
 assert.doesNotThrow(()=>verifyCrowdGenerationManifestLedger(first,relative,sha,{[relative]:sha}));
 assert.throws(()=>verifyCrowdGenerationManifestLedger(first,relative,sha,{}),/lacks verified ROOT private admission/);
 assert.throws(()=>verifyCrowdGenerationManifestLedger(first,relative,sha,{[relative]:'0'.repeat(64)}),/lacks verified ROOT private admission/);
 const untrusted=emptyRemainingScope();untrusted.clips=[{approval:{status:'user-approved'}}];
 const future=`assets/voices/candidate-dialogue/${first.voiceId}-remaining27-crowd-manifest.json`;
 assert.throws(()=>verifyCrowdGenerationManifestLedger(untrusted,future,sha,{}),/lacks verified ROOT private admission/);
 assert.throws(()=>verifyCrowdGenerationManifestLedger(untrusted,relative,sha,{[relative]:sha}),/filename does not own/);
});
test('stale authored text is rejected before admission',()=>{
 const stale=structuredClone(first);stale.clips[0].text+=' TEST_ONLY_STALE_SOURCE';
 assert.throws(()=>crowdCandidateBlock(cast,[stale],sourceRoot),/differs from source/);
});
test('seven measured mouth rows remain a strict subset when untrusted future rows exist',()=>{
 const rows=verifyCrowdMouthEnergySubset(supplement,firstSeven,sourceRoot);
 const untrusted=emptyRemainingScope(),job=untrusted.heldPrivate.find(row=>row.region==='germany'&&row.slot===1);
 // Deliberately incomplete future metadata tests only subset selection. It is
 // separately rejected by admission below; it is never a successful take.
 untrusted.clips=[{...job,status:'TEST_ONLY_NOT_ADMISSIBLE',approval:{status:'user-approved'}}];
 untrusted.lineCount=1;untrusted.heldPrivate=untrusted.heldPrivate.filter(row=>row.clipId!==job.clipId);
 untrusted.crowdAdmission={takes:{}};
 assert.equal(verifyCrowdMouthEnergySubset(supplement,[...firstSeven,untrusted],sourceRoot),rows);
 assert.throws(()=>crowdCandidateBlock(cast,[...firstSeven,untrusted],sourceRoot));
 const foreign=structuredClone(supplement);foreign.clips.TEST_ONLY_EXTRA={};
 assert.throws(()=>verifyCrowdMouthEnergySubset(foreign,firstSeven,sourceRoot),/Incomplete\/extra crowd mouth supplement/);
 const changed=structuredClone(supplement),id=Object.keys(changed.clips)[0];changed.clips[id].english+=' TEST_ONLY_STALE';
 assert.throws(()=>verifyCrowdMouthEnergySubset(changed,firstSeven,sourceRoot),/Foreign crowd mouth english/);
 assert.equal(JSON.stringify(firstSeven),before);
});

test('both anchored mouth supplements retain disjoint final-byte ownership',()=>{
 const manifests=readdirSync(resolve(sourceRoot,'assets/voices/candidate-dialogue')).filter(name=>name.endsWith('-crowd-manifest.json')).map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`;return {...readJson(relative),provenanceManifest:relative,provenanceManifestSha256:digest(relative)};});
 const next=readJson('assets/voices/candidate-dialogue/crowd-remaining27-mouth-energy.json');
 const original=verifyCrowdMouthEnergySubset(supplement,manifests,sourceRoot),remaining=verifyCrowdRemainingMouthRows(next,manifests,sourceRoot);
 assert.equal(Object.keys(original).length,7);assert.equal(Object.keys(remaining).length,11);
 assert.ok(Object.keys(remaining).every(id=>!Object.hasOwn(original,id)));
 const expanded=crowdExpandedMouthEnergyFromCatalog(readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),manifests,sourceRoot);
 assert.deepEqual(expanded,{...original,...remaining});
 for(const mutate of [row=>{delete row.clips[Object.keys(row.clips)[0]]},row=>{row.clips[Object.keys(row.clips)[0]].profileId='foreign'},row=>{row.clips[Object.keys(row.clips)[0]].mouthEnergy[0]=256}]){
  const changed=structuredClone(next);mutate(changed);assert.throws(()=>verifyCrowdRemainingMouthRows(changed,manifests,sourceRoot));
 }
});
