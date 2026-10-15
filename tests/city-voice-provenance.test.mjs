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
function fixture(t){
 const outer=mkdtempSync(resolve(tmpdir(),'gs-city-admission-test-')),game=resolve(outer,'game'),review=resolve(outer,'synthetic-review');
 t.after(()=>{assert.ok(resolve(outer).startsWith(resolve(tmpdir())+sep));rmSync(outer,{recursive:true,force:true})});
 for(const path of ['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js','street-wisdom.js','tools/curate-voice-library.mjs','tools/build-knick-voice.py']){mkdirSync(dirname(resolve(game,path)),{recursive:true});copyFileSync(resolve(root,path),resolve(game,path))}
 // Only this temporary catalog is reduced: these tests do not need the unrelated shipped audio corpus.
 const catalogPath=resolve(game,'For-AI/AUDIO-TEXT-LIBRARY.js');let catalog=readFileSync(catalogPath,'utf8');
 const start=catalog.indexOf('const recordings=Object.freeze({'),end=catalog.indexOf('\n});',start);assert.ok(start>=0&&end>start);
 catalog=(catalog.slice(0,start)+'const recordings=Object.freeze({'+catalog.slice(end))
  .replace(/const neighborRecordings=Object\.freeze\([^\n]*\);\n/,curator.neighborRecordingsBlock(cast,[]))
  .replace(/const cityRecordings=Object\.freeze\([^\n]*\);\n/,curator.cityRecordingsBlock(cast,[],game,game))
  .replace(/const cityAdmissionReceipts=Object\.freeze\(\{[^\n]*\}\);\n/,'const cityAdmissionReceipts=Object.freeze({});\n');
 save(catalogPath,catalog);save(resolve(game,'assets/voices/candidate-dialogue/manifest.json'),{clips:[]});mkdirSync(review,{recursive:true});
 const selected=jobs.filter(row=>row.voiceId===jobs[0].voiceId),voiceId=selected[0].voiceId;
 const sourceSha256=Object.fromEntries(['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'].map(path=>[path,hash(readFileSync(resolve(game,path)))]));
 const plan={schemaVersion:1,family:'city-dialogue',publicAssetFamily:'assets/voices/city-dialogue',privateReviewFamily:'GermanySimulator city dialogue review 2026-10-15',sourceSha256,jobs:selected},key=JSON.stringify(plan);
 let cached=planCache.get(key);
 if(!cached){
  const requestFile=resolve(outer,'plan.json'),music=resolve(outer,'plan-output');save(requestFile,plan);
  const run=spawnSync('python',[resolve(game,'tools/build-knick-voice.py'),'--plan','--voice-id',voiceId,'--request-file',requestFile,'--music-root',music],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(run.status,0,run.stderr||run.stdout);
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
 return{game,review,clips,requestPath,catalogPath,publicDirectory:resolve(game,'assets/voices/city-dialogue'),manifestPath:resolve(game,'assets/voices/city-dialogue',voiceId+'-manifest.json'),
  encoded:clip=>resolve(review,voiceId,'encoded',clip.clipId+'.json'),mp3:clip=>resolve(review,voiceId,'encoded',clip.clipId+'.mp3'),
  prepare:(selected=clips)=>curator.prepareCityManifest(cast,voiceId,review,producer,authorization(selected),game),
  admit:proposal=>curator.admitCityManifest(cast,proposal,review,producer,game),
  module:()=>import(pathToFileURL(resolve(game,'tools/curate-voice-library.mjs')))};
}
function capture(run){const log=console.log;try{console.log=()=>{};return run()}finally{console.log=log}}
function rejectsWithoutCopy(f,proposal,error){const before=readFileSync(f.catalogPath);assert.throws(()=>f.admit(proposal),error);assert.equal(existsSync(f.publicDirectory),false);assert.deepEqual(readFileSync(f.catalogPath),before)}

test('current owned rows agree with producer requests; obsolete reuse object is rejected',t=>{
 assert.equal(jobs.length,76);assert.equal(new Set(jobs.map(row=>row.voiceId)).size,19);assert.equal(new Set(jobs.map(row=>row.clipId)).size,76);
 const f=fixture(t);assert.deepEqual(curator.cityDialogueSources(cast,f.game),jobs);const proposal=f.prepare([f.clips[0]]);change(f.requestPath,row=>row.approvedExistingReuse={});rejectsWithoutCopy(f,proposal,/source provenance/);
});
test('prepare/admit/default replay preserves selected receipt and needs no private fixture afterwards',async t=>{
 const f=fixture(t),clip=f.clips[0],proposal=f.prepare([clip]),m=await f.module();
 assert.equal(proposal.clips.length,1);assert.equal(proposal.heldPrivate.length,3);assert.equal(proposal.clips[0].listening,'pending');assert.deepEqual(Object.keys(proposal.clips[0].approval).sort(),['clipId','date','encodedSha256','instruction','scope','status']);assert.equal(existsSync(f.publicDirectory),false);
 f.admit(proposal);assert.equal(hash(readFileSync(resolve(f.game,clip.file))),clip.sha256);rmSync(f.review,{recursive:true});capture(()=>m.main(['--sync']));capture(()=>m.main(['--check']));
 const context={window:{},location:{search:''},URLSearchParams};vm.runInNewContext(readFileSync(f.catalogPath,'utf8'),context);const api=context.window.GermanySimulatorAudioText;
 assert.equal(api.candidatePreviewEnabled,false);assert.equal(api.candidateClip(clip.voiceId,clip.text),'./'+clip.file);const receipt=api.recordings['./'+clip.file];assert.equal(receipt.actorId,clip.actorId);assert.equal(receipt.english,clip.english);assert.equal(receipt.sha256,clip.sha256);assert.equal(receipt.approval.instruction,proposal.clips[0].approval.instruction);
});
test('forged review flags cannot become public use authorization',t=>{
 for(const extra of [{heardWords:'yes',speakerIdentityFits:'yes'},{listeningConfirmed:false}]){const f=fixture(t),proposal=f.prepare([f.clips[0]]);Object.assign(proposal.clips[0].approval,extra);rejectsWithoutCopy(f,proposal,/authorization/)}
});
test('source word cues cannot omit, substitute or reorder tokens',t=>{
 for(const edit of [c=>c.slice(0,1),c=>{c[1].word='foreign';return c},c=>{[c[0],c[1]]=[c[1],c[0]];return c}]){
  const f=fixture(t),proposal=f.prepare([f.clips[0]]);change(f.encoded(f.clips[0]),row=>row.wordCues=edit(row.wordCues));proposal.clips[0]={...json(f.encoded(f.clips[0])),approval:proposal.clips[0].approval};rejectsWithoutCopy(f,proposal,/caption cues/);
 }
});
test('source, owner voice and paired English drift reject before installing bytes',t=>{
 for(const kind of ['source','owner','English']){const f=fixture(t),proposal=f.prepare([f.clips[0]]);if(kind==='source')save(resolve(f.game,'game.js'),readFileSync(resolve(f.game,'game.js'),'utf8')+'\n');else proposal.clips[0][kind==='owner'?'voiceId':'english']='foreign';rejectsWithoutCopy(f,proposal,/source changed|source\/translation\/owner/)}
});
test('unadmitted or changed manifests and changed encoded bytes cannot supply authority',async t=>{
 const f=fixture(t),proposal=f.prepare([f.clips[0]]),m=await f.module(),before=readFileSync(f.catalogPath);save(f.manifestPath,proposal);assert.throws(()=>m.main(['--sync']),/no verified private admission/);assert.deepEqual(readFileSync(f.catalogPath),before);rmSync(f.publicDirectory,{recursive:true});
 save(f.mp3(f.clips[0]),'different bytes');rejectsWithoutCopy(f,proposal,/audio bytes drift/);
 const g=fixture(t),p=g.prepare([g.clips[0]]),module=await g.module();g.admit(p);change(g.manifestPath,row=>row.clips[0].approval.instruction+=' altered');const accepted=readFileSync(g.catalogPath);assert.throws(()=>module.main(['--sync']),/no verified private admission/);assert.deepEqual(readFileSync(g.catalogPath),accepted);
});
test('city ASR preserves requested int8 and accepts only truthful CPU int8 effective modes',t=>{
 for(const effective of ['int8','int8_float32']){
  const f=fixture(t),clip=f.clips[0];change(f.encoded(clip),row=>row.asrEffectiveComputeType=effective);
  const proposal=f.prepare([clip]);assert.equal(proposal.clips[0].asrComputeType,'int8');f.admit(proposal);
  const installed=json(f.manifestPath).clips[0];assert.equal(installed.asrEffectiveComputeType,effective);assert.equal(installed.asrDevice,'cpu');assert.equal(installed.listening,'pending');
 }
 for(const fields of [
  ...['auto','float16','float32','int8_float16','unsupported'].map(asrEffectiveComputeType=>({asrEffectiveComputeType})),
  ...['auto','float16','float32'].map(asrComputeType=>({asrComputeType,asrEffectiveComputeType:'int8_float32'})),
  {asrDevice:'cuda',asrEffectiveComputeType:'int8_float32'},
  {asrModelSha256:'unknown',asrEffectiveComputeType:'int8_float32'}
 ]){
  const f=fixture(t),before=readFileSync(f.catalogPath);change(f.encoded(f.clips[0]),row=>Object.assign(row,fields));
  assert.throws(()=>f.prepare([f.clips[0]]),/ASR/);assert.equal(existsSync(f.publicDirectory),false);assert.deepEqual(readFileSync(f.catalogPath),before);
 }
});
test('catalog-install failure restores accepted take, manifest and catalog and removes only new bytes',t=>{
 const f=fixture(t),partial=f.prepare([f.clips[0]]),full=f.prepare();f.admit(partial);const beforeManifest=readFileSync(f.manifestPath),beforeCatalog=readFileSync(f.catalogPath),beforeTake=readFileSync(resolve(f.game,f.clips[0].file)),rename=fs.renameSync;let injected=false;
 try{fs.renameSync=(from,to)=>{if(to===f.catalogPath){injected=true;assert.equal(json(f.manifestPath).clips.length,4);throw Error('synthetic catalog-install failure')}return rename(from,to)};syncBuiltinESMExports();assert.throws(()=>f.admit(full),/synthetic catalog-install failure/)}finally{fs.renameSync=rename;syncBuiltinESMExports()}
 assert.equal(injected,true);assert.deepEqual(readFileSync(f.manifestPath),beforeManifest);assert.deepEqual(readFileSync(f.catalogPath),beforeCatalog);assert.deepEqual(readFileSync(resolve(f.game,f.clips[0].file)),beforeTake);for(const clip of f.clips.slice(1))assert.equal(existsSync(resolve(f.game,clip.file)),false);assert.equal(existsSync(f.catalogPath+'.city-admit.tmp'),false);
});
