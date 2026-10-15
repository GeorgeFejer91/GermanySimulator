import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {
 voiceGapManifestAuthority,
 voiceGapRecordingsBlock,
} from '../tools/curate-voice-library.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=file=>readFileSync(resolve(root,file),'utf8');
const json=file=>JSON.parse(source(file).replace(/^\uFEFF/,''));
const clone=value=>JSON.parse(JSON.stringify(value));
const sha=text=>createHash('sha256').update(text).digest('hex');
const cast=json('For-AI/VOICE-CAST.json');
const families=[
 {
  family:'traffic-dialogue',voiceId:'verkehr-dieter-hupfer',requested:4,held:1,attempt:1,
  file:'assets/voices/traffic-dialogue/verkehr-dieter-hupfer-gap-manifest.json',
  selected:{
   'traffic-berlin-01':'d2b3bdeb3956b7752dbded4e6aa75ba64b0f1217de84b694391bbcd26ef772d3',
   'traffic-berlin-02':'b97bf8bd69974320458877aa3830b2d56d1ac8cfddd89e26176fa5ad8a8ae179',
   'traffic-germany-02':'d3cfd354914aa4b76730f5c95a16927f2669e8316adc756f73f83cd1312815b3',
  },
 },
 {
  family:'police-dialogue',voiceId:'polizei-heinrich-wachtmeister',requested:8,held:6,attempt:2,
  file:'assets/voices/police-dialogue/polizei-heinrich-wachtmeister-gap-manifest.json',
  selected:{
   'polizei-heinrich-wachtmeister-berlin-04':'00977e8f37ca542e5303d26dab7cad779abbb36a6ac3d23d47a80e63548103c7',
   'polizei-heinrich-wachtmeister-germany-04':'f59ecd08e6739c2bf0ad8674ffb6398d2336f7f098ce0f45e2263ad1e629d835',
  },
 },
].map(config=>({...config,manifest:json(config.file)}));

// Exercise the shipped public validator with a changed in-memory manifest.
// No private receipt tree, synthesis process, media decoder, or filesystem write.
function rejects(config,changes){
 for(const [name,change] of changes){
  const changed=clone(config.manifest);
  change(changed,changed.clips[0]);
  assert.throws(()=>voiceGapManifestAuthority(cast,changed,root),`${config.family}: ${name}`);
 }
}

for(const config of families){
 test(`${config.family}: the admitted bytes retain all accepted and held source slots`,()=>{
  const manifest=config.manifest,jobs=voiceGapManifestAuthority(cast,manifest,root);
  assert.equal(jobs.size,config.requested);
  assert.equal(manifest.voiceId,config.voiceId);
  assert.equal(manifest.requestedLineCount,config.requested);
  assert.equal(manifest.generatedLineCount,config.requested);
  assert.equal(manifest.heldPrivate.length,config.held);
  assert.deepEqual(Object.fromEntries(manifest.clips.map(clip=>[clip.clipId,clip.sha256])),config.selected);
  assert.deepEqual([...jobs.keys()].sort(),[...manifest.clips,...manifest.heldPrivate].map(row=>row.clipId).sort());
  assert.deepEqual(Object.keys(manifest.voiceGapAdmission.takes).sort(),Object.keys(config.selected).sort());
  for(const clip of manifest.clips){
   assert.equal(clip.synthesisAttempt,config.attempt);
   assert.equal(clip.asrWordExact,true);
   assert.equal(clip.asrLiteralWordExact,true);
   assert.equal(clip.listening,'pending');
   assert.equal(clip.listeningVerified,undefined);
  }
 });

 test(`${config.family}: another actor, profile, subtitle, or source slot cannot borrow a take`,()=>{
  const other=families.find(row=>row!==config).manifest.clips[0];
  rejects(config,[
   ['another voice',(_m,c)=>c.voiceId=other.voiceId],
   ['another profile',(_m,c)=>c.profileId=other.profileId],
   ['another reference',(_m,c)=>c.referenceSha256=other.referenceSha256],
   ['another original reference',(_m,c)=>c.referenceOriginalSha256=other.referenceOriginalSha256],
   ['another actor',(_m,c)=>c.actorId=other.actorId],
   ['changed German source',(_m,c)=>c.text+=' Zusatz'],
   ['changed English subtitle',(_m,c)=>c.english+=' Extra'],
   ['another region',(_m,c)=>c.region=c.region==='berlin'?'germany':'berlin'],
   ['another slot',(_m,c)=>c.slot+=1],
   ['another source locator',(_m,c)=>c.sourceLocator+='-changed'],
   ['changed held source',m=>m.heldPrivate[0].text+=' Zusatz'],
   ['lost held slot',m=>m.heldPrivate.pop()],
   ['duplicate accepted slot',m=>m.clips.push(clone(m.clips[0]))],
  ]);
 });

 test(`${config.family}: final caption cues must still cover the actual source words`,()=>{
  rejects(config,[
   ['missing cue',(_m,c)=>c.wordCues.pop()],
   ['wrong word',(_m,c)=>c.wordCues[0].word+='x'],
   ['wrong character position',(_m,c)=>c.wordCues[0].charIndex+=1],
   ['overlap',(_m,c)=>c.wordCues[1].at=c.wordCues[0].end-.01],
   ['zero duration',(_m,c)=>c.wordCues[0].end=c.wordCues[0].at],
   ['past final duration',(_m,c)=>c.wordCues.at(-1).end=c.durationSeconds+.051],
   ['unapproved cue field',(_m,c)=>c.wordCues[0].inferred=true],
  ]);
 });

 test(`${config.family}: false ASR flags and a changed take cannot be promoted`,()=>{
  rejects(config,[
   ['false word-exact flag',(_m,c)=>c.asrWordExact=false],
   ['false literal flag',(_m,c)=>c.asrLiteralWordExact=false],
   ['changed ASR words',(_m,c)=>c.asr+=' Zusatz'],
   ['changed final reading',(_m,c)=>c.asrReadings.at(-1).transcript+=' Zusatz'],
   ['source-prompted ASR',(_m,c)=>c.asrScriptPrompt=c.text],
   ['wrong language',(_m,c)=>c.asrLanguageId='en'],
   ['wrong historical take',(_m,c)=>c.synthesisAttempt=config.attempt===1?2:1],
   ['wrong seed',(_m,c)=>c.seed+=1],
   ['missing native EOS',(_m,c)=>c.decode.eosReached=false],
   ['changed producer',(_m,c)=>c.authoringHelperSha256='0'.repeat(64)],
   ['changed frozen request',(_m,c)=>c.requestSha256='0'.repeat(64)],
   ['approval for other bytes',(_m,c)=>c.approval.encodedSha256='0'.repeat(64)],
  ]);
 });

 test(`${config.family}: receipt and retired-phase lineage remain required`,()=>{
  rejects(config,[
   ['missing take proof',(m,c)=>delete m.voiceGapAdmission.takes[c.clipId]],
   ['wrong encoded hash',(m,c)=>m.voiceGapAdmission.takes[c.clipId].encodedSha256='0'.repeat(64)],
   ['wrong raw hash',(m,c)=>m.voiceGapAdmission.takes[c.clipId].rawSha256='0'.repeat(64)],
   ['wrong profile metadata',(m,c)=>m.voiceGapAdmission.takes[c.clipId].profileJsonSha256='0'.repeat(64)],
   ['changed source pin',m=>m.voiceGapAdmission.sourcePins['game.js']='0'.repeat(64)],
   ['live process owner',m=>m.voiceGapAdmission.terminals.process.rootRetired=false],
   ['timed out process',m=>m.voiceGapAdmission.terminals.process.timedOut=true],
  ]);
 });
}

test('traffic: the recovered license retains the original failed render and raw receipt',()=>{
 const config=families.find(row=>row.family==='traffic-dialogue');
 const proof=config.manifest.voiceGapAdmission;
 assert.equal(proof.terminals.render.exitCode,1);
 assert.equal(proof.terminals.render.sha256,'1b80c1a3b76b9fbd1fe3887f25feaa40d8df32144750c2ecbeb84affaf1a64b4');
 assert.equal(proof.trafficLicenseRecovery.additionalNativeCalls,0);
 rejects(config,[
  ['erased recovery',m=>delete m.voiceGapAdmission.trafficLicenseRecovery],
  ['failed render relabelled success',m=>m.voiceGapAdmission.terminals.render.exitCode=0],
  ['different failed render',m=>m.voiceGapAdmission.terminals.render.sha256='0'.repeat(64)],
  ['new generation hidden as recovery',m=>m.voiceGapAdmission.trafficLicenseRecovery.additionalNativeCalls=1],
  ['original unknown license rewritten',(_m,c)=>c.originalRawReferenceLicense='CC0-1.0'],
  ['wrong processing adapter',(_m,c)=>c.processingAdapterSha256='0'.repeat(64)],
  ['lost licensed source component',(_m,c)=>c.referenceLicenseResolution.sourceComponents.pop()],
  ['wrong original raw receipt',(_m,c)=>c.referenceLicenseResolution.rawReceiptSha256='0'.repeat(64)],
 ]);
});

test('police: take two retains take one and the zero-call resource continuation',()=>{
 const config=families.find(row=>row.family==='police-dialogue');
 const proof=config.manifest.voiceGapAdmission;
 assert.equal(proof.terminals.render.continuation.chargedGenerationCallsBeforeRender,0);
 assert.equal(proof.terminals.render.continuation.priorFailedTerminalSha256,'e42c456f245a31e7b0147c03d47b98c2cfb1ba759f1c9d3225a080e5f3af06ae');
 rejects(config,[
  ['lost take-one raw receipt',(m,c)=>delete m.voiceGapAdmission.takes[c.clipId].priorRawReceiptSha256],
  ['wrong previous take',(m,c)=>m.voiceGapAdmission.takes[c.clipId].priorSynthesisAttempt=2],
  ['lost failed resource stop',m=>m.voiceGapAdmission.terminals.render.continuation.priorFailedTerminalSha256='0'.repeat(64)],
  ['generation before continuation',m=>m.voiceGapAdmission.terminals.render.continuation.chargedGenerationCallsBeforeRender=1],
  ['ASR before continuation',m=>m.voiceGapAdmission.terminals.render.continuation.asrReadingsBeforeRender=1],
  ['lost continued render binding',m=>m.voiceGapAdmission.terminals.process.continuation.finalRenderTerminalSha256='0'.repeat(64)],
 ]);
});

const publicManifests=()=>families.map(config=>({
 ...clone(config.manifest),provenanceManifest:config.file,provenanceManifestSha256:sha(source(config.file)),
}));

test('the shipped public projection resolves exactly the five selected recordings and their cues',()=>{
 const manifests=publicManifests(),scope={};
 vm.runInNewContext(voiceGapRecordingsBlock(cast,manifests,root,root)+'\nglobalThis.result=voiceGapRecordings;',scope,{timeout:3000});
 const projected=clone(scope.result),context={window:{}};
 vm.runInNewContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),context,{timeout:3000});
 const catalog=context.window.GermanySimulatorAudioText.recordings;
 assert.deepEqual(Object.keys(projected).sort(),manifests.flatMap(m=>m.clips.map(c=>'./'+c.file)).sort());
 assert.equal(Object.keys(projected).length,5);
 for(const [file,recording] of Object.entries(projected))assert.deepEqual(clone(catalog[file]),recording,file);
 for(const manifest of manifests)for(const held of manifest.heldPrivate){
  assert.equal(catalog[`./assets/voices/${manifest.family}/${held.clipId}.mp3`],undefined,`${held.clipId} stays held`);
 }
});

test('the public projection rejects duplicate takes and coordinated forged audio hashes',()=>{
 const manifests=publicManifests();
 assert.throws(()=>voiceGapRecordingsBlock(cast,[manifests[0],manifests[0]],root,root));
 const changed=clone(manifests),clip=changed[0].clips[0];
 clip.sha256='0'.repeat(64);
 clip.approval.encodedSha256=clip.sha256;
 changed[0].voiceGapAdmission.takes[clip.clipId].encodedSha256=clip.sha256;
 // The metadata is internally consistent; the shipped asset bytes must reject it.
 assert.equal(voiceGapManifestAuthority(cast,changed[0],root).size,4);
 assert.throws(()=>voiceGapRecordingsBlock(cast,changed,root,root));
});
