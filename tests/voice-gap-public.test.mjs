import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {
 voiceGapManifestAuthority,
 voiceGapRecordingsBlock,
 alignRetainedSourceWords,
 verifiedRetainedCompoundCues,
 verifyVoiceGapCatalogConservation,
} from '../tools/curate-voice-library.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=file=>readFileSync(resolve(root,file),'utf8');
const json=file=>JSON.parse(source(file).replace(/^\uFEFF/,''));
const clone=value=>JSON.parse(JSON.stringify(value));
const sha=text=>createHash('sha256').update(text).digest('hex');
const cast=json('For-AI/VOICE-CAST.json');
const retainedAuthorities=json('tests/fixtures/retained-compound-authority.json');
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
].map(config=>{
 const manifest=json(config.file),retained=Object.values(retainedAuthorities).filter(row=>row.family===config.family&&manifest.clips.some(clip=>clip.clipId===row.clipId));
 return {...config,manifest,held:config.held-retained.length,selected:{...config.selected,...Object.fromEntries(retained.map(row=>[row.clipId,row.encodedSha256]))}};
});

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
   const retained=retainedAuthorities[clip.clipId];
   if(retained){
    assert.equal(clip.sha256,retained.encodedSha256);assert.equal(clip.asrLiteralWordExact,false);assert.deepEqual(clip.wordCues,[]);
    assert.deepEqual(verifiedRetainedCompoundCues(clip,manifest.voiceGapAdmission.takes[clip.clipId],manifest.voiceGapAdmission.frozenRequestSha256),retainedAlignmentCases.find(row=>row.clipId===clip.clipId).expected.wordCues);
   }else assert.equal(clip.asrLiteralWordExact,true);
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
   ...(config.manifest.heldPrivate.length?[
    ['changed held source',m=>m.heldPrivate[0].text+=' Zusatz'],
    ['lost held slot',m=>m.heldPrivate.pop()],
   ]:[]),
   ['accepted slot also held',m=>m.heldPrivate.push({clipId:m.clips[0].clipId,text:m.clips[0].text,reason:'duplicate accepted slot'})],
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

test('the shipped public projection resolves exactly the finite selected recordings and their cues',()=>{
 const manifests=publicManifests(),scope={};
 vm.runInNewContext(voiceGapRecordingsBlock(cast,manifests,root,root)+'\nglobalThis.result=voiceGapRecordings;',scope,{timeout:3000});
 const projected=clone(scope.result),context={window:{}};
 vm.runInNewContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),context,{timeout:3000});
 const catalog=context.window.GermanySimulatorAudioText.recordings;
 assert.deepEqual(Object.keys(projected).sort(),manifests.flatMap(m=>m.clips.map(c=>'./'+c.file)).sort());
 assert.equal(Object.keys(projected).length,families.reduce((sum,row)=>sum+Object.keys(row.selected).length,0));
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

// Public-safe retained timing metadata; pure-helper inputs, not full receipts or admission authority.
const retainedAlignmentCases=[{"clipId":"traffic-germany-01","text":"Augen auf, du Vollpfosten!","duration":3.04,"reading":{"beamSize":1,"transcript":"Augen auf, du voll Pfosten.","words":[{"word":" Augen","start":0.0,"end":0.48},{"word":" auf,","start":0.48,"end":0.9},{"word":" du","start":1.14,"end":1.24},{"word":" voll","start":1.24,"end":1.54},{"word":" Pfosten.","start":1.54,"end":2.06}]},"expected":{"mapping":[{"sourceWordIndex":0,"observedStart":0,"observedEndExclusive":1},{"sourceWordIndex":1,"observedStart":1,"observedEndExclusive":2},{"sourceWordIndex":2,"observedStart":2,"observedEndExclusive":3},{"sourceWordIndex":3,"observedStart":3,"observedEndExclusive":5}],"wordCues":[{"at":0.0,"end":0.48,"charIndex":0,"word":"Augen"},{"at":0.48,"end":0.9,"charIndex":6,"word":"auf"},{"at":1.14,"end":1.24,"charIndex":11,"word":"du"},{"at":1.24,"end":2.06,"charIndex":14,"word":"Vollpfosten"}]}},{"clipId":"polizei-heinrich-wachtmeister-germany-01","text":"HALT! STEHENBLEIBEN!","duration":2.8,"reading":{"beamSize":1,"transcript":"Halt! Stehen bleiben!","words":[{"word":" Halt!","start":0.0,"end":0.34},{"word":" Stehen","start":0.5,"end":0.96},{"word":" bleiben!","start":0.96,"end":1.22}]},"expected":{"mapping":[{"sourceWordIndex":0,"observedStart":0,"observedEndExclusive":1},{"sourceWordIndex":1,"observedStart":1,"observedEndExclusive":3}],"wordCues":[{"at":0.0,"end":0.34,"charIndex":0,"word":"HALT"},{"at":0.5,"end":1.22,"charIndex":6,"word":"STEHENBLEIBEN"}]}}];
const retainedOneToMany={"text":"Bleiben Sie hinter ze line!","duration":2.44,"reading":{"beamSize":5,"transcript":"Bleiben Sie hinter Zeline!","words":[{"word":" Bleiben","start":0.0,"end":0.42},{"word":" Sie","start":0.42,"end":0.56},{"word":" hinter","start":0.56,"end":0.82},{"word":" Zeline!","start":0.82,"end":1.26}]}};
test('retained grouping preserves complete measured source ranges and inter-word silence',()=>{
 for(const row of retainedAlignmentCases){
  const before=clone(row),actual=alignRetainedSourceWords(row.text,row.reading,row.duration);
  assert.deepEqual(actual,row.expected);assert.deepEqual(row,before,'no input/flag/cue rewriting');
  assert.ok(actual.wordCues.some((cue,index)=>index&&cue.at>actual.wordCues[index-1].end),'measured silence between distinct source words remains');
 }
 assert.deepEqual(retainedAlignmentCases[0].expected.wordCues.at(-1),{at:1.24,end:2.06,charIndex:14,word:'Vollpfosten'});
 assert.deepEqual(retainedAlignmentCases[1].expected.wordCues.at(-1),{at:.5,end:1.22,charIndex:6,word:'STEHENBLEIBEN'});
});
test('retained grouping rejects a temporal gap or overlap inside a single source word',()=>{
 for(const start of [1.55,1.53]){const row=clone(retainedAlignmentCases[0]);row.reading.words[4].start=start;assert.throws(()=>alignRetainedSourceWords(row.text,row.reading,row.duration),/Gap inside|Invalid retained/)}
});
test('retained grouping rejects changed, missing, extra, duplicated or reordered raw tokens',()=>{
 for(const change of [
  row=>{row.reading.words[4].word=' Pfostern.'},
  row=>{row.reading.words.pop()},
  row=>{row.reading.words.push({word:' noch',start:2.06,end:2.2})},
  row=>{row.reading.words.splice(1,0,{word:'Augen',start:.48,end:.5});row.reading.words[2].start=.5},
  row=>{[row.reading.words[0],row.reading.words[1]]=[row.reading.words[1],row.reading.words[0]];row.reading.words.forEach((w,i)=>{w.start=i*.1;w.end=(i+1)*.1})},
  row=>{row.reading.words[3].word='voll Pfosten'},
  row=>{row.reading.words[2].word='...'},
 ]){const row=clone(retainedAlignmentCases[0]);change(row);row.reading.transcript=row.reading.words.map(w=>w.word).join(' ');assert.throws(()=>alignRetainedSourceWords(row.text,row.reading,row.duration))}
});
test('retained grouping rejects invalid measured intervals and transcript substitution',()=>{
 for(const change of [
  row=>{row.reading.words[0].start=-.01},row=>{row.reading.words[0].start=NaN},
  row=>{row.reading.words[0].end=Infinity},row=>{row.reading.words[0].end=0},
  row=>{row.reading.words[0].end=-1},row=>{row.reading.words.at(-1).end=row.duration+.001},
  row=>{row.reading.transcript='Augen auf, du Pfostern.'},row=>{row.duration=0},
  row=>{row.text=''},row=>{row.reading.words[0].start=null},
 ]){const row=clone(retainedAlignmentCases[0]);change(row);assert.throws(()=>alignRetainedSourceWords(row.text,row.reading,row.duration))}
});
test('one measured Zeline token cannot supply two separate authored source words',()=>{
 assert.throws(()=>alignRetainedSourceWords(retainedOneToMany.text,retainedOneToMany.reading,retainedOneToMany.duration),/spans source words/);
});
test('pure grouping and self-attestation cannot replace finite receipt-bound authority',()=>{
 for(const row of retainedAlignmentCases){
  const aligned=alignRetainedSourceWords(row.text,row.reading,row.duration),text=JSON.stringify({verified:true,...aligned});
  assert.throws(()=>verifiedRetainedCompoundCues({clipId:row.clipId},{retainedSourceWordAlignment:{text,sha256:sha(text)}},'unsealed'),/Retained original flags/);
 }
 assert.throws(()=>verifiedRetainedCompoundCues({clipId:'constructor'},{retainedSourceWordAlignment:{verified:true}},'unsealed'),/authority is not sealed/);
 assert.equal(verifiedRetainedCompoundCues({clipId:'traffic-germany-01'},null,null),null,'existing no-supplement path remains available to normal literal gates');
});

// Controlled public-schema fixtures reuse the existing five-take manifests. Their
// recipe/EOS/phase fields are test inputs, not fresh original-receipt evidence.
const retainedReadingReturn=json('tests/fixtures/retained-compound-readings.json');
assert.equal(retainedReadingReturn.schema,'retained-selected-reading-return-v1');
assert.equal(retainedReadingReturn.files.length,2);
assert.deepEqual(retainedReadingReturn.files.map(row=>row.clipId).sort(),Object.keys(retainedAuthorities).sort());
function retainedFixture(clipId){
 const authority=clone(retainedAuthorities[clipId]),config=families.find(row=>row.family===authority.family);
 const returned=retainedReadingReturn.files.find(row=>row.clipId===clipId);
 assert.equal(returned.selectedReadingIndex,authority.selectedReadingIndex);
 assert.equal(returned.selectedBeamSize,authority.selectedBeamSize);
 assert.equal(Buffer.byteLength(returned.selectedReadingJsonText,'utf8'),returned.selectedReadingUtf8Bytes);
 assert.equal(sha(returned.selectedReadingJsonText),authority.selectedReadingSha256);
 assert.equal(returned.selectedReadingSha256,authority.selectedReadingSha256);
 const reading=JSON.parse(returned.selectedReadingJsonText);
 assert.equal(JSON.stringify(reading),returned.selectedReadingJsonText,'full original selected-reading serialization, including original field order');
 assert.equal(sha(JSON.stringify(reading.words)),authority.selectedWordArraySha256);
 assert.equal(returned.selectedWordArraySha256,authority.selectedWordArraySha256);
 const clip=clone(config.manifest.clips[0]);
 for(const key of ['clipId','voiceId','actorId','region','slot','sourceLocator','text','english','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','processing','authoringHelperSha256','rawSha256','requestSha256','profileJsonSha256','synthesisAttempt','seed','durationSeconds'])clip[key]=clone(authority[key]);
 Object.assign(clip,{sha256:authority.encodedSha256,rendererInputText:authority.text,asrWordExact:true,asrLiteralWordExact:false,wordCues:[],asrReadings:[reading],asrBeamSize:reading.beamSize,asr:reading.transcript,file:`assets/voices/${authority.family}/${clipId}.mp3`});
 Object.assign(clip.approval,{clipId,encodedSha256:clip.sha256,instruction:'Controlled schema fixture only; not actual use-selection or admission evidence'});
 const take=clone(config.manifest.voiceGapAdmission.takes[config.manifest.clips[0].clipId]);
 for(const key of ['encodedReceiptSha256','rawReceiptSha256','rawSha256','encodedSha256','profileJsonSha256'])take[key]=authority[key];
 if(clip.referenceLicenseResolution)clip.referenceLicenseResolution.rawReceiptSha256=take.rawReceiptSha256;
 const expected=retainedAlignmentCases.find(row=>row.clipId===clipId).expected;
 const payload={kind:'voice-gap-retained-source-word-alignment-v1',ruleRevision:'ordered-adjacent-measured-tokens-to-one-source-word-v1',bindings:clone(authority),...clone(expected)};
 const fixture={authority,config,clip,take,payload,requestSha256:authority.requestSha256};
 refreshRetainedSnapshot(fixture);return fixture;
}
function refreshRetainedSnapshot(fixture){
 const text=JSON.stringify(fixture.payload);
 fixture.take.retainedSourceWordAlignment={text,sha256:sha(text)};
 assert.equal(sha(text),fixture.take.retainedSourceWordAlignment.sha256,'mutants reach binding/content checks, not an obsolete snapshot hash');
}
function retainedManifest(fixture){
 const manifest=clone(fixture.config.manifest),id=fixture.clip.clipId;
 manifest.heldPrivate=manifest.heldPrivate.filter(row=>row.clipId!==id);
 manifest.clips=manifest.clips.filter(row=>row.clipId!==id);manifest.clips.push(clone(fixture.clip));manifest.lineCount=manifest.clips.length;
 manifest.voiceGapAdmission.takes[id]=clone(fixture.take);
 const bytes=JSON.stringify(manifest);return {...manifest,provenanceManifest:fixture.config.file,provenanceManifestSha256:sha(bytes)};
}
for(const clipId of Object.keys(retainedAuthorities)){
 test(`${clipId}: actual production verifier and manifest derive exact source cues without changing raw evidence`,()=>{
  const fixture=retainedFixture(clipId),before=clone(fixture),expected=retainedAlignmentCases.find(row=>row.clipId===clipId).expected.wordCues;
  assert.deepEqual(verifiedRetainedCompoundCues(fixture.clip,fixture.take,fixture.requestSha256),expected);
  assert.equal(voiceGapManifestAuthority(cast,retainedManifest(fixture),root).size,fixture.config.requested);
  assert.deepEqual(fixture,before);assert.equal(fixture.clip.asrLiteralWordExact,false);assert.deepEqual(fixture.clip.wordCues,[]);
  const noProof=clone(fixture);delete noProof.take.retainedSourceWordAlignment;
  assert.throws(()=>voiceGapManifestAuthority(cast,retainedManifest(noProof),root),/Incomplete crowd exact|literal\/aligned/,'populating a table never permits an absent supplement');
 });
 test(`${clipId}: rehashed supplements cannot borrow or change actual receipt/source/selected-reading bindings`,()=>{
  for(const [name,mutate] of [
   ['encoded hash',f=>{f.clip.sha256='0'.repeat(64);f.take.encodedSha256=f.clip.sha256;f.clip.approval.encodedSha256=f.clip.sha256}],
   ['raw bytes',f=>{f.clip.rawSha256='0'.repeat(64);f.take.rawSha256=f.clip.rawSha256}],
   ['encoded receipt',f=>{f.take.encodedReceiptSha256='0'.repeat(64)}],
   ['raw receipt',f=>{f.take.rawReceiptSha256='0'.repeat(64)}],
   ['request',f=>{f.clip.requestSha256='0'.repeat(64);f.requestSha256=f.clip.requestSha256}],
   ['profile metadata',f=>{f.clip.profileJsonSha256='0'.repeat(64);f.take.profileJsonSha256=f.clip.profileJsonSha256}],
   ['voice',f=>{f.clip.voiceId+='-foreign'}],['actor',f=>{f.clip.actorId+='-foreign'}],
   ['profile',f=>{f.clip.profileId='0'.repeat(32)}],['reference',f=>{f.clip.referenceSha256='0'.repeat(64)}],
   ['original reference',f=>{f.clip.referenceOriginalSha256='0'.repeat(64)}],
   ['source',f=>{f.clip.text+=' Zusatz'}],['English',f=>{f.clip.english+=' Extra'}],
   ['source locator',f=>{f.clip.sourceLocator+='-foreign'}],['region',f=>{f.clip.region='berlin'}],['slot',f=>{f.clip.slot+=1}],
   ['renderer',f=>{f.clip.renderer+='-foreign'}],['model revision',f=>{f.clip.modelRevision='0'.repeat(40)}],
   ['processing',f=>{f.clip.processing='foreign'}],['producer',f=>{f.clip.authoringHelperSha256='0'.repeat(64)}],
   ['take',f=>{f.clip.synthesisAttempt+=1}],['seed',f=>{f.clip.seed+=1}],['duration',f=>{f.clip.durationSeconds+=.01}],
   ['selected reading metadata',f=>{f.clip.asrReadings[0].transcribeSeconds=(f.clip.asrReadings[0].transcribeSeconds??0)+.001}],
   ['selected word timing',f=>{f.clip.asrReadings[0].words[0].end-=.001}],
   ['selected beam',f=>{f.clip.asrReadings[0].beamSize=5;f.clip.asrBeamSize=5}],
   ['selected reading index',f=>{f.clip.asrReadings.unshift(clone(f.clip.asrReadings[0]))}],
  ]){
   const fixture=retainedFixture(clipId);mutate(fixture);refreshRetainedSnapshot(fixture);
   assert.throws(()=>verifiedRetainedCompoundCues(fixture.clip,fixture.take,fixture.requestSha256),/Foreign or stale retained alignment authority/,name);
  }
 });
 test(`${clipId}: valid snapshot hashes cannot authorize forged mappings, cues, bindings or boolean attestations`,()=>{
  for(const [name,mutate] of [
   ['dropped coverage',f=>{f.payload.mapping.pop()}],['duplicated coverage',f=>{f.payload.mapping.push(clone(f.payload.mapping[0]))}],
   ['reordered coverage',f=>{f.payload.mapping.reverse()}],['changed cue interval',f=>{f.payload.wordCues.at(-1).end+=.001}],
   ['guessed source boundary',f=>{f.payload.wordCues.at(-1).charIndex+=1}],['foreign source pins',f=>{f.payload.bindings.sourcePins['game.js']='0'.repeat(64)}],
   ['foreign proof kind',f=>{f.payload.kind='verified'}],['foreign rule',f=>{f.payload.ruleRevision+='-foreign'}],
   ['self attestation',f=>{f.payload={verified:true}}],
  ]){const fixture=retainedFixture(clipId);mutate(fixture);refreshRetainedSnapshot(fixture);assert.throws(()=>verifiedRetainedCompoundCues(fixture.clip,fixture.take,fixture.requestSha256),/payload differs/,name)}
 });
 test(`${clipId}: finite alignment preserves mandatory recipe, levels, EOS, use and retired-phase guards`,()=>{
  for(const [name,mutate] of [
   ['EOS',f=>{f.clip.decode.eosReached=false}],['LUFS',f=>{f.clip.integratedLufs=-14}],['peak',f=>{f.clip.truePeakDbtp=0}],
   ['ASR recipe',f=>{f.clip.asrCpuThreads=4}],['ASR model',f=>{f.clip.asrModelSha256='0'.repeat(64)}],
   ['script prompt',f=>{f.clip.asrScriptPrompt=f.clip.text}],['use',f=>{f.clip.approval.encodedSha256='0'.repeat(64)}],
   ['false word exact',f=>{f.clip.asrWordExact=false}],['changed original literal flag',f=>{f.clip.asrLiteralWordExact=true}],
   ['rewritten original cues',f=>{f.clip.wordCues=clone(f.payload.wordCues)}],
  ]){const fixture=retainedFixture(clipId);mutate(fixture);refreshRetainedSnapshot(fixture);assert.throws(()=>voiceGapManifestAuthority(cast,retainedManifest(fixture),root),name)}
  for(const [name,mutate] of [
   ['live process',m=>{m.voiceGapAdmission.terminals.process.rootRetired=false}],
   ['timed out phase',m=>{m.voiceGapAdmission.terminals.process.timedOut=true}],
   ['stale source',m=>{m.voiceGapAdmission.sourcePins['game.js']='0'.repeat(64)}],
   ['foreign take coverage',m=>{m.voiceGapAdmission.takes.foreign=clone(Object.values(m.voiceGapAdmission.takes)[0])}],
  ]){const fixture=retainedFixture(clipId);refreshRetainedSnapshot(fixture);const manifest=retainedManifest(fixture);mutate(manifest);assert.throws(()=>voiceGapManifestAuthority(cast,manifest,root),name)}
 });
}
function retainedReplayInputs(){
 const fixtures=Object.keys(retainedAuthorities).map(retainedFixture),manifests=fixtures.map(retainedManifest);
 const sourceRoot=resolve(process.env.GERMANY_RETAINED_COMPOUND_SOURCE_ROOT||root);
 for(const name of ['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'])assert.equal(sha(readFileSync(resolve(sourceRoot,name))),sha(source(name)),`replay staging requires the exact selected public source dependency: ${name}`);
 for(const manifest of manifests)for(const clip of manifest.clips)assert.equal(sha(readFileSync(resolve(sourceRoot,clip.file))),clip.sha256,`required exact replay asset missing/changed: ${clip.clipId}; default is shipped root, optional explicit owner staging must contain all seven files`);
 return {fixtures,manifests,sourceRoot};
}
test('retained actual-byte replay: BOTH production family paths project seven clips and preserve original false flags',()=>{
 const {fixtures,manifests,sourceRoot}=retainedReplayInputs(),before=clone(manifests),scope={};
 vm.runInNewContext(voiceGapRecordingsBlock(cast,manifests,sourceRoot,sourceRoot)+'\nglobalThis.result=voiceGapRecordings;',scope,{timeout:3000});
 const recordings=clone(scope.result);assert.equal(Object.keys(recordings).length,7);
 for(const fixture of fixtures){const row=recordings['./'+fixture.clip.file];assert.ok(row,fixture.clip.clipId);assert.equal(row.sha256,fixture.authority.encodedSha256);assert.equal(row.source,fixture.authority.text);assert.equal(row.english,fixture.authority.english);assert.equal(row.profileId,fixture.authority.profileId);assert.equal(row.voiceId,fixture.authority.voiceId);assert.equal(row.actorId,fixture.authority.actorId);assert.equal(row.provenanceManifest,fixture.config.file);assert.equal(row.provenanceManifestSha256,manifests.find(manifest=>manifest.family===fixture.authority.family).provenanceManifestSha256);assert.equal(row.trigger,fixture.authority.family==='police-dialogue'?'police-exact-dialogue':'traffic-owned-exact-dialogue');assert.deepEqual(row.wordCues,fixture.payload.wordCues)}
 assert.deepEqual(manifests,before,'the projection must not relabel ASR flags or rewrite raw cues/receipts');
});
test('retained actual-byte replay: BOTH family projections reject actual wrong file contents through the production hash gate',()=>{
 const {fixtures,manifests,sourceRoot}=retainedReplayInputs();
 const scratch=mkdtempSync(resolve(tmpdir(),'gs-retained-replay-'));
 try{
  for(const name of ['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js',...manifests.flatMap(manifest=>manifest.clips.map(clip=>clip.file))]){const target=resolve(scratch,name);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(sourceRoot,name),target)}
  for(const fixture of fixtures){
   writeFileSync(resolve(scratch,fixture.clip.file),'deliberately wrong encoded file bytes');
   assert.throws(()=>voiceGapRecordingsBlock(cast,manifests,scratch,scratch),/audio hash drift/,fixture.clip.clipId);
   copyFileSync(resolve(sourceRoot,fixture.clip.file),resolve(scratch,fixture.clip.file));
  }
 }finally{rmSync(scratch,{recursive:true,force:true})}
});
function retainedRolloverFixture(clipId){
 const fixture=retainedFixture(clipId),config=fixture.config,relative=config.file;
 const historical=families.map(row=>{const file=row.family==='traffic-dialogue'?'tests/fixtures/retained-compound-traffic-before.json':'tests/fixtures/retained-compound-police-before.json',text=source(file);return {...JSON.parse(text),provenanceManifest:row.file,provenanceManifestSha256:sha(text)}});
 const prior=clone(historical.find(row=>row.family===config.family)),beforeFile=config.family==='traffic-dialogue'?'tests/fixtures/retained-compound-traffic-before.json':'tests/fixtures/retained-compound-police-before.json',priorManifestText=source(beforeFile);
 const controlled=retainedManifest(fixture),{provenanceManifest,provenanceManifestSha256,...manifest}=controlled;
 const nextManifestText=JSON.stringify(manifest,null,2)+'\n',nextDigest=sha(nextManifestText),scope={window:{}};
 vm.runInNewContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),scope,{timeout:3000});
 const oldRecords=clone(scope.window.GermanySimulatorAudioText.recordings),baseline={};
 vm.runInNewContext(voiceGapRecordingsBlock(cast,historical,root,root)+'\nglobalThis.result=voiceGapRecordings;',baseline,{timeout:3000});
 for(const authority of Object.values(retainedAuthorities))delete oldRecords[`./assets/voices/${authority.family}/${authority.clipId}.mp3`];
 Object.assign(oldRecords,clone(baseline.result));const newRecords=clone(oldRecords);
 for(const clip of prior.clips){const key='./'+clip.file;assert.equal(oldRecords[key].provenanceManifestSha256,prior.provenanceManifestSha256);newRecords[key].provenanceManifestSha256=nextDigest}
 const row=clone(oldRecords['./'+prior.clips[0].file]);
 Object.assign(row,{id:clipId,clipId,actorId:fixture.clip.actorId,voiceId:fixture.clip.voiceId,profileId:fixture.clip.profileId,source:fixture.clip.text,english:fixture.clip.english,sha256:fixture.clip.sha256,durationMs:Math.round(fixture.clip.durationSeconds*1000),wordCues:clone(fixture.payload.wordCues),approval:clone(fixture.clip.approval),provenanceManifest:relative,provenanceManifestSha256:nextDigest});
 newRecords['./'+fixture.clip.file]=row;
 return {oldRecords,newRecords,context:{prior,manifest,relative,priorManifestText,nextManifestText},memberKey:'./'+prior.clips[0].file};
}
for(const clipId of Object.keys(retainedAuthorities)){
 test(`${clipId}: only proven prior members receive their exact manifest digest rollover`,()=>{
  const f=retainedRolloverFixture(clipId),before=clone(f),members=new Set(f.context.prior.clips.map(clip=>'./'+clip.file));
  verifyVoiceGapCatalogConservation(f.oldRecords,f.newRecords,f.context);
  assert.deepEqual(f,before,'conservation comparison is read-only');
  for(const [key,row] of Object.entries(f.oldRecords))assert.deepEqual(f.newRecords[key],members.has(key)?{...row,provenanceManifestSha256:sha(f.context.nextManifestText)}:row,key);
 });
 test(`${clipId}: digest rollover rejects wrong anchors/paths, other metadata, changed takes and foreign rows`,()=>{
  for(const [name,mutate] of [
   ['prior anchor',f=>{f.context.prior.provenanceManifestSha256='0'.repeat(64)}],
   ['prior bytes',f=>{f.context.priorManifestText+=' '}],
   ['prior path',f=>{f.context.prior.provenanceManifest+='-foreign'}],
   ['target path',f=>{f.context.relative+='-foreign'}],
   ['next serialized body',f=>{f.context.nextManifestText=f.context.nextManifestText.replace('user-approved','foreign')}],
   ['old recording digest',f=>{f.oldRecords[f.memberKey].provenanceManifestSha256='0'.repeat(64)}],
   ['new recording digest',f=>{f.newRecords[f.memberKey].provenanceManifestSha256='0'.repeat(64)}],
   ['old recording path',f=>{f.oldRecords[f.memberKey].provenanceManifest+='-foreign'}],
   ['new recording path',f=>{f.newRecords[f.memberKey].provenanceManifest+='-foreign'}],
   ['recording ID',f=>{f.newRecords[f.memberKey].clipId+='-foreign'}],
   ['source',f=>{f.newRecords[f.memberKey].source+=' Zusatz'}],
   ['English',f=>{f.newRecords[f.memberKey].english+=' Extra'}],
   ['cue',f=>{f.newRecords[f.memberKey].wordCues[0].at+=.001}],
   ['profile',f=>{f.newRecords[f.memberKey].profileId='0'.repeat(32)}],
   ['audio',f=>{f.newRecords[f.memberKey].sha256='0'.repeat(64)}],
   ['next take',f=>{f.context.manifest.clips.find(row=>row.clipId===f.context.prior.clips[0].clipId).sha256='0'.repeat(64);f.context.nextManifestText=JSON.stringify(f.context.manifest,null,2)+'\n'}],
   ['missing prior take',f=>{f.context.manifest.clips=f.context.manifest.clips.filter(row=>row.clipId!==f.context.prior.clips[0].clipId);f.context.nextManifestText=JSON.stringify(f.context.manifest,null,2)+'\n'}],
   ['foreign recording',f=>{const key=Object.keys(f.oldRecords).find(key=>!f.context.prior.clips.some(row=>'./'+row.file===key));assert.ok(key);f.newRecords[key].provenanceManifestSha256=sha(f.context.nextManifestText)}],
   ['missing new row',f=>{const clip=f.context.manifest.clips.find(row=>row.clipId===clipId);delete f.newRecords['./'+clip.file]}],
  ]){const f=retainedRolloverFixture(clipId);mutate(f);assert.throws(()=>verifyVoiceGapCatalogConservation(f.oldRecords,f.newRecords,f.context),name)}
 });
}
test('historical police and every unrelated recording remain wholly exact during either family rollover',()=>{
 for(const clipId of Object.keys(retainedAuthorities)){
  const f=retainedRolloverFixture(clipId),members=new Set(f.context.prior.clips.map(row=>'./'+row.file));
  const historical=Object.entries(f.oldRecords).find(([key,row])=>row.trigger==='police-exact-dialogue'&&!members.has(key)&&row.provenanceManifest==='assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json');
  assert.ok(historical,'actual historical police default exists independently of new-gap members');
  for(const field of ['provenanceManifestSha256','source','profileId','sha256']){
   const changed=clone(f);changed.newRecords[historical[0]][field]+='-foreign';
   assert.throws(()=>verifyVoiceGapCatalogConservation(changed.oldRecords,changed.newRecords,changed.context),field);
  }
 }
});
