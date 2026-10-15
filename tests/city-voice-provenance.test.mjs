import test from 'node:test';
import assert from 'node:assert/strict';
import fs, {copyFileSync,existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import * as curator from '../tools/curate-voice-library.mjs';

// Contract fixtures only: fabricated audio/native/ASR records do not approve a real take or prove listening.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const cast=json(resolve(root,'For-AI/VOICE-CAST.json'));
const producer=resolve(root,'tools/build-knick-voice.py'),producerSha=hash(readFileSync(producer));
const jobs=cast.characters.filter(person=>person.gameCharacterId?.startsWith('city-')).flatMap(person=>['germany','berlin'].flatMap(region=>[0,1].map(slot=>{
 const line=person.dialogue.find(line=>line.region===region&&line.slot===slot),binding=cast.productionVoices[person.voiceId];
 assert.ok(line,'Each current city owner needs both slots in both regions');
 return{clipId:person.voiceId+'-'+String((region==='berlin'?2:0)+slot+1).padStart(2,'0'),voiceId:person.voiceId,actorId:person.gameCharacterId,region,slot,sourceLocator:line.locator,text:line.text,english:line.english,sourceSha256:hash(line.text),profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:null};
})));
const save=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n')};
const change=(path,edit)=>{const value=json(path);edit(value);save(path,value)};
const planCache=new Map();
async function fixture(t){
 const outer=mkdtempSync(resolve(tmpdir(),'gs-city-admission-test-')),game=resolve(outer,'destination'),authoring=resolve(outer,'authoring'),review=resolve(outer,'synthetic-review');
 t.after(()=>{assert.ok(resolve(outer).startsWith(resolve(tmpdir())+sep));rmSync(outer,{recursive:true,force:true})});
 const fixtureFiles=['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js','street-wisdom.js','tools/curate-voice-library.mjs','tools/build-knick-voice.py'];
 for(const base of [game,authoring])for(const path of fixtureFiles){mkdirSync(dirname(resolve(base,path)),{recursive:true});copyFileSync(resolve(root,path),resolve(base,path))}
 const reduceCatalog=base=>{
  const catalogPath=resolve(base,'For-AI/AUDIO-TEXT-LIBRARY.js');let catalog=readFileSync(catalogPath,'utf8');
  const start=catalog.indexOf('const recordings=Object.freeze({'),end=catalog.indexOf('\n});',start);assert.ok(start>=0&&end>start);
  catalog=(catalog.slice(0,start)+'const recordings=Object.freeze({'+catalog.slice(end))
   .replace(/const neighborRecordings=Object\.freeze\([^\n]*\);\n/,curator.neighborRecordingsBlock(cast,[]))
   .replace(/const cityRecordings=Object\.freeze\([^\n]*\);\n/,curator.cityRecordingsBlock(cast,[],base,base))
   .replace(/const cityAdmissionReceipts=Object\.freeze\(\{[^\n]*\}\);\n/,'const cityAdmissionReceipts=Object.freeze({});\n')
   .replace(/const cityMouthEnergyReceipt=Object\.freeze\(\{[^\n]*\}\);\n/,'')
   .replace(/const crowdMouthEnergyReceipt=Object\.freeze\(\{[^\n]*\}\);\n/,'');
  save(catalogPath,catalog);save(resolve(base,'assets/voices/candidate-dialogue/manifest.json'),{clips:[]});return catalogPath;
 };
 const catalogPath=reduceCatalog(game),authoringCatalogPath=reduceCatalog(authoring);mkdirSync(review,{recursive:true});
 const authoringProducer=resolve(authoring,'tools/build-knick-voice.py'),testCuratorPath=resolve(game,'tools/curate-voice-library.mjs');
 const canonicalCuratorSource=readFileSync(resolve(root,'tools/curate-voice-library.mjs'),'utf8');
 const replacements=[
  ["const cityAuthoringHelperSha256='122d93bac3016f44b24cf04b97b7a2462d216226e33c9d6d6e05c5ae11a89349';",`const cityAuthoringHelperSha256='${hash(readFileSync(authoringProducer))}';`],
  ["'game.js':'c1510ca78f329b4cd35430791e2e1fecf1175def445c16806c531fc1b0b1e79e',",`'game.js':'${hash(readFileSync(resolve(authoring,'game.js')))}',`],
  ["'For-AI/VOICE-CAST.json':'e8ef5bdab86e4390ef5329ac73fcb91afb897c562b93282798c049c7b3ef223b',",`'For-AI/VOICE-CAST.json':'${hash(readFileSync(resolve(authoring,'For-AI/VOICE-CAST.json')))}',`],
  ["'For-AI/AUDIO-TEXT-LIBRARY.js':'ff557f6f9efd50910147eefe1b2233c17c1f16b6d7672dbd989d7ba8cc5d3807',",`'For-AI/AUDIO-TEXT-LIBRARY.js':'${hash(readFileSync(authoringCatalogPath))}',`],
  ["'tools/build-knick-voice.py':'122d93bac3016f44b24cf04b97b7a2462d216226e33c9d6d6e05c5ae11a89349'",`'tools/build-knick-voice.py':'${hash(readFileSync(authoringProducer))}'`],
 ];
 let testOnlySource=canonicalCuratorSource;const edits=[];
 for(const [before,after] of replacements){assert.equal(testOnlySource.split(before).length-1,1,`expected one test pin literal: ${before}`);const index=testOnlySource.indexOf(before);edits.push({index,before,after});testOnlySource=testOnlySource.slice(0,index)+after+testOnlySource.slice(index+before.length)}
 let restoredSource=testOnlySource;for(const {index,before,after} of edits.toReversed()){assert.equal(restoredSource.slice(index,index+after.length),after);restoredSource=restoredSource.slice(0,index)+before+restoredSource.slice(index+after.length)}
 assert.equal(restoredSource,canonicalCuratorSource,'test-only curator differs from canonical outside explicit hash literals');
 assert.match(canonicalCuratorSource,/const cityAuthoringHelperSha256='122d93bac3016f44b24cf04b97b7a2462d216226e33c9d6d6e05c5ae11a89349';/,'canonical production helper pin must stay frozen at 122d');
 writeFileSync(testCuratorPath,testOnlySource);
 const fixtureCurator=await import(pathToFileURL(testCuratorPath));
 const selected=jobs.filter(row=>row.voiceId===jobs[0].voiceId),voiceId=selected[0].voiceId;
 const sourceSha256=Object.fromEntries(['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'].map(path=>[path,hash(readFileSync(resolve(authoring,path)))]));
 const plan={schemaVersion:1,family:'city-dialogue',publicAssetFamily:'assets/voices/city-dialogue',privateReviewFamily:'GermanySimulator city dialogue review 2026-10-15',sourceSha256,jobs:selected},key=JSON.stringify(plan);
 let cached=planCache.get(key);
 if(!cached){
  const requestFile=resolve(outer,'plan.json'),music=resolve(outer,'plan-output');save(requestFile,plan);
  const run=spawnSync('python',[authoringProducer,'--plan','--voice-id',voiceId,'--request-file',requestFile,'--music-root',music],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(run.status,0,run.stderr||run.stdout);
  const request=json(resolve(music,plan.privateReviewFamily,voiceId,'requests.json'));
  assert.deepEqual(request.jobs,selected);assert.deepEqual(request.approvedExistingReuse,[]);
  // Source offsets use the actual producer's Python tokenizer, not the admission validator as an oracle.
  const tokens=spawnSync('python',['-B','-c','import sys,json,re; print(json.dumps([[dict(word=m[0],charIndex=m.start()) for m in re.finditer(r"\\w+",text)] for text in json.load(sys.stdin)]))'],{input:JSON.stringify(selected.map(row=>row.text)),encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(tokens.status,0,tokens.stderr);
  cached={request,words:JSON.parse(tokens.stdout)};planCache.set(key,cached);
 }
 const request=structuredClone(cached.request),requestPath=resolve(review,voiceId,'requests.json');save(requestPath,request);
 const clips=selected.map((job,index)=>{
  const rawBytes=Buffer.from('synthetic raw '+job.clipId),mp3Bytes=Buffer.from('synthetic encoded '+job.clipId);
  const raw={...job,seed:1,synthesisAttempt:1,authoringHelperSha256:producerSha,rendererInputText:job.text,rendererInputBasis:'exact authored source',requestSha256:hash(readFileSync(requestPath)),profileJsonSha256:hash('synthetic profile'),rawSha256:hash(rawBytes),modelLicense:'MIT',referenceLicense:'synthetic fixture; no production approval',durationSeconds:15,renderSeconds:1,decode:{eosReached:true,generatedSpeechTokens:40,maxSpeechTokens:100,attentionHooksBefore:0,attentionHooksAfter:0,t3InferenceSeconds:.5},synthesis:{inferenceMode:true,referenceReconditionedForProfile:job.profileId,referenceConditioningVerifiedFloat32:true,languageId:'de'},listening:'pending',status:'private candidate'};
  const wordCues=cached.words[index].map((word,i)=>({at:i*.1,end:i*.1+.08,...word}));
  const encoded={...raw,processing:null,processingSha256:null,integratedLufs:-18,truePeakDbtp:-2,asr:job.text,asrWordExact:true,asrLiteralWordExact:true,asrCpuThreads:2,asrLanguageId:'de',asrComputeType:'int8',asrEffectiveComputeType:'int8',asrDevice:'cpu',asrScriptPrompt:null,asrModelSha256:hash('synthetic independent ASR model'),asrReadings:[{beamSize:1,transcript:job.text,transcribeSeconds:.1}],wordCues,sha256:hash(mp3Bytes),bytes:mp3Bytes.length,sampleRateHz:48000,channels:1,bitrateBitsPerSecond:128000,file:`assets/voices/city-dialogue/${job.clipId}.mp3`,status:'eligible exact-text recording; human listening pending'};
  save(resolve(review,voiceId,'raw',job.clipId+'.json'),raw);save(resolve(review,voiceId,'raw',job.clipId+'.wav'),rawBytes);save(resolve(review,voiceId,'encoded',job.clipId+'.json'),encoded);save(resolve(review,voiceId,'encoded',job.clipId+'.mp3'),mp3Bytes);return encoded;
 });
 const authorization=selected=>({status:'user-approved',date:'2000-01-01',instruction:'Synthetic test use authorization; not real approval or listening',scope:'whole-game-fixed-voice-cloning',clips:Object.fromEntries(selected.map(row=>[row.clipId,row.sha256]))});
 return{game,authoring,review,clips,requestPath,catalogPath,publicDirectory:resolve(game,'assets/voices/city-dialogue'),manifestPath:resolve(game,'assets/voices/city-dialogue',voiceId+'-manifest.json'),
  encoded:clip=>resolve(review,voiceId,'encoded',clip.clipId+'.json'),mp3:clip=>resolve(review,voiceId,'encoded',clip.clipId+'.mp3'),
  prepare:(selected=clips)=>fixtureCurator.prepareCityManifest(cast,voiceId,review,authoringProducer,authorization(selected),authoring),
  admit:proposal=>fixtureCurator.admitCityManifest(cast,proposal,review,authoringProducer,authoring,game),
  module:()=>Promise.resolve(fixtureCurator)};
}
function capture(run){const log=console.log;try{console.log=()=>{};return run()}finally{console.log=log}}
function rejectsWithoutCopy(f,proposal,error){const before=readFileSync(f.catalogPath);assert.throws(()=>f.admit(proposal),error);assert.equal(existsSync(f.publicDirectory),false);assert.deepEqual(readFileSync(f.catalogPath),before)}

test('current owned rows agree with producer requests; obsolete reuse object is rejected',async t=>{
 assert.equal(jobs.length,76);assert.equal(new Set(jobs.map(row=>row.voiceId)).size,19);assert.equal(new Set(jobs.map(row=>row.clipId)).size,76);
 const f=await fixture(t);assert.deepEqual(curator.cityDialogueSources(cast,f.game),jobs);const proposal=f.prepare([f.clips[0]]);change(f.requestPath,row=>row.approvedExistingReuse={});rejectsWithoutCopy(f,proposal,/source provenance/);
});
test('prepare/admit/default replay preserves selected receipt and needs no private fixture afterwards',async t=>{
 const f=await fixture(t),clip=f.clips[0],proposal=f.prepare([clip]),m=await f.module();
 assert.equal(proposal.clips.length,1);assert.equal(proposal.heldPrivate.length,3);assert.equal(proposal.clips[0].listening,'pending');assert.deepEqual(Object.keys(proposal.clips[0].approval).sort(),['clipId','date','encodedSha256','instruction','scope','status']);assert.equal(existsSync(f.publicDirectory),false);
 f.admit(proposal);assert.equal(hash(readFileSync(resolve(f.game,clip.file))),clip.sha256);rmSync(f.review,{recursive:true});capture(()=>m.main(['--sync']));capture(()=>m.main(['--check']));
 const context={window:{},location:{search:''},URLSearchParams};vm.runInNewContext(readFileSync(f.catalogPath,'utf8'),context);const api=context.window.GermanySimulatorAudioText;
 assert.equal(api.candidatePreviewEnabled,false);assert.equal(api.candidateClip(clip.voiceId,clip.text),'./'+clip.file);const receipt=api.recordings['./'+clip.file];assert.equal(receipt.actorId,clip.actorId);assert.equal(receipt.english,clip.english);assert.equal(receipt.sha256,clip.sha256);assert.equal(receipt.approval.instruction,proposal.clips[0].approval.instruction);
});
test('forged review flags cannot become public use authorization',async t=>{
 for(const extra of [{heardWords:'yes',speakerIdentityFits:'yes'},{listeningConfirmed:false}]){const f=await fixture(t),proposal=f.prepare([f.clips[0]]);Object.assign(proposal.clips[0].approval,extra);rejectsWithoutCopy(f,proposal,/authorization/)}
});
test('source word cues cannot omit, substitute or reorder tokens',async t=>{
 for(const edit of [c=>c.slice(0,1),c=>{c[1].word='foreign';return c},c=>{[c[0],c[1]]=[c[1],c[0]];return c}]){
  const f=await fixture(t),proposal=f.prepare([f.clips[0]]);change(f.encoded(f.clips[0]),row=>row.wordCues=edit(row.wordCues));proposal.clips[0]={...json(f.encoded(f.clips[0])),approval:proposal.clips[0].approval};rejectsWithoutCopy(f,proposal,/caption cues/);
 }
});
test('source, owner voice and paired English drift reject before installing bytes',async t=>{
 for(const kind of ['source','owner','English']){const f=await fixture(t),proposal=f.prepare([f.clips[0]]);if(kind==='source')save(resolve(f.authoring,'game.js'),readFileSync(resolve(f.authoring,'game.js'),'utf8')+'\n');else proposal.clips[0][kind==='owner'?'voiceId':'english']='foreign';rejectsWithoutCopy(f,proposal,/frozen723 source|source\/translation\/owner/)}
});
test('unadmitted or changed manifests and changed encoded bytes cannot supply authority',async t=>{
 const f=await fixture(t),proposal=f.prepare([f.clips[0]]),m=await f.module(),before=readFileSync(f.catalogPath);save(f.manifestPath,proposal);assert.throws(()=>m.main(['--sync']),/no verified private admission/);assert.deepEqual(readFileSync(f.catalogPath),before);rmSync(f.publicDirectory,{recursive:true});
 save(f.mp3(f.clips[0]),'different bytes');rejectsWithoutCopy(f,proposal,/audio bytes drift/);
 const g=await fixture(t),p=g.prepare([g.clips[0]]),module=await g.module();g.admit(p);change(g.manifestPath,row=>row.clips[0].approval.instruction+=' altered');const accepted=readFileSync(g.catalogPath);assert.throws(()=>module.main(['--sync']),/no verified private admission/);assert.deepEqual(readFileSync(g.catalogPath),accepted);
});
test('city ASR preserves requested int8 and accepts only truthful CPU int8 effective modes',async t=>{
 for(const effective of ['int8','int8_float32']){
  const f=await fixture(t),clip=f.clips[0];change(f.encoded(clip),row=>row.asrEffectiveComputeType=effective);
  const proposal=f.prepare([clip]);assert.equal(proposal.clips[0].asrComputeType,'int8');f.admit(proposal);
  const installed=json(f.manifestPath).clips[0];assert.equal(installed.asrEffectiveComputeType,effective);assert.equal(installed.asrDevice,'cpu');assert.equal(installed.listening,'pending');
 }
 for(const fields of [
  ...['auto','float16','float32','int8_float16','unsupported'].map(asrEffectiveComputeType=>({asrEffectiveComputeType})),
  ...['auto','float16','float32'].map(asrComputeType=>({asrComputeType,asrEffectiveComputeType:'int8_float32'})),
  {asrDevice:'cuda',asrEffectiveComputeType:'int8_float32'},
  {asrModelSha256:'unknown',asrEffectiveComputeType:'int8_float32'}
 ]){
  const f=await fixture(t),before=readFileSync(f.catalogPath);change(f.encoded(f.clips[0]),row=>Object.assign(row,fields));
  assert.throws(()=>f.prepare([f.clips[0]]),/ASR/);assert.equal(existsSync(f.publicDirectory),false);assert.deepEqual(readFileSync(f.catalogPath),before);
 }
});
test('catalog-install failure restores accepted take, manifest and catalog and removes only new bytes',async t=>{
 const f=await fixture(t),partial=f.prepare([f.clips[0]]),full=f.prepare();f.admit(partial);const beforeManifest=readFileSync(f.manifestPath),beforeCatalog=readFileSync(f.catalogPath),beforeTake=readFileSync(resolve(f.game,f.clips[0].file)),rename=fs.renameSync;let injected=false;
 try{fs.renameSync=(from,to)=>{if(to===f.catalogPath){injected=true;assert.equal(json(f.manifestPath).clips.length,4);throw Error('synthetic catalog-install failure')}return rename(from,to)};syncBuiltinESMExports();assert.throws(()=>f.admit(full),/synthetic catalog-install failure/)}finally{fs.renameSync=rename;syncBuiltinESMExports()}
 assert.equal(injected,true);assert.deepEqual(readFileSync(f.manifestPath),beforeManifest);assert.deepEqual(readFileSync(f.catalogPath),beforeCatalog);assert.deepEqual(readFileSync(resolve(f.game,f.clips[0].file)),beforeTake);for(const clip of f.clips.slice(1))assert.equal(existsSync(resolve(f.game,clip.file)),false);assert.equal(existsSync(f.catalogPath+'.city-admit.tmp'),false);
});

test('accepted compound cues preserve the original recognition receipt and observed time span',()=>{
 const manifest=json(resolve(root,'assets/voices/city-dialogue/stadt-wolfgang-schulz-manifest.json'));
 const clip=manifest.clips.find(row=>row.clipId==='stadt-wolfgang-schulz-01');
 const proof=manifest.cityProvenance.takes[clip.clipId],encoded=JSON.parse(proof.encoded.text);
 assert.equal(clip.asrLiteralWordExact,false);assert.deepEqual(clip.wordCues,[]);
 assert.equal(encoded.asrLiteralWordExact,false);assert.deepEqual(encoded.wordCues,[]);
 assert.deepEqual(curator.cityOrthographicCueProof(proof,manifest.cityProvenance.request),proof.orthographicCues);
 const cues=JSON.parse(proof.orthographicCues.text).wordCues;
 assert.equal(cues.length,18);assert.deepEqual(cues.find(row=>row.word==='Viertelstunde'),{at:.8,end:1.34,charIndex:21,word:'Viertelstunde'});
 const window={};vm.runInNewContext(readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),{window});
 const api=window.GermanySimulatorAudioText,path=api.recordedClip(clip.voiceId,clip.text);
 assert.equal(path,'./'+clip.file);assert.equal(JSON.stringify(api.recordings[path].wordCues),JSON.stringify(cues));
});

test('compound timing cannot authorize a missing, altered or foreign supplement',()=>{
 const manifest=json(resolve(root,'assets/voices/city-dialogue/stadt-wolfgang-schulz-manifest.json'));
 const id='stadt-wolfgang-schulz-01';
 for(const edit of [
  proof=>delete proof.orthographicCues,
  proof=>{const value=JSON.parse(proof.orthographicCues.text);value.wordCues[4].end+=.01;const text=JSON.stringify(value,null,2)+'\n';proof.orthographicCues={text,sha256:hash(text)}},
  proof=>{const value=JSON.parse(proof.orthographicCues.text);value.clipId='stadt-wolfgang-schulz-02';const text=JSON.stringify(value,null,2)+'\n';proof.orthographicCues={text,sha256:hash(text)}}
 ]){
  const changed=structuredClone(manifest);edit(changed.cityProvenance.takes[id]);
  assert.throws(()=>curator.cityRecordingsBlock(cast,[changed],root,root),/ASR|supplement drift/);
 }
 const text='Das ist besser.',reading={transcript:'Das is better.',words:[{word:'Das',start:0,end:.1},{word:'is',start:.1,end:.2},{word:'better',start:.2,end:.3}]};
 assert.throws(()=>curator.alignCityCompoundCues(text,reading,1),/changed word/);
});
