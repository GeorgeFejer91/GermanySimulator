import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Synthetic contract data only. No real recording, receipt, authorization or audio acceptance.
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const candidate=resolve(root,'tools/curate-voice-library.mjs');
const digest=value=>createHash('sha256').update(value).digest('hex');
const candidateSource=readFileSync(candidate,'utf8');
const publicFiles=['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'];
const publicBytes=new Map(publicFiles.map(name=>[resolve(root,name),readFileSync(resolve(root,name))]));
const publicPins=Object.fromEntries(publicFiles.map(name=>[name,digest(publicBytes.get(resolve(root,name)))]));
const cast=JSON.parse(publicBytes.get(resolve(root,'For-AI/VOICE-CAST.json'))),catalogSource=publicBytes.get(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js')).toString();
const legacyBytes=readFileSync(resolve(root,'assets/voices/candidate-dialogue/manifest.json')),legacyManifest=JSON.parse(legacyBytes);
const plain=value=>JSON.parse(JSON.stringify(value));
const privateSentinel='SYNTHETIC-PRIVATE-PAYLOAD-DO-NOT-PUBLISH';

function harness(){
 const files=new Map(publicBytes),directories=new Set(),deniedCalls=[];
 const read=(path,encoding)=>{const key=resolve(String(path));assert(files.has(key),'Unexpected file read: '+key);const bytes=files.get(key);return encoding?bytes.toString(encoding):Buffer.from(bytes)};
 const forbidden=(...args)=>{deniedCalls.push(args);throw Error('Contract fixture forbids process or filesystem mutation')};
 const context=vm.createContext({root,resolve,sep,vm,createHash,readFileSync:read,
  existsSync:path=>files.has(resolve(path))||directories.has(resolve(path)),
  realpathSync:path=>{const key=resolve(path);assert(files.has(key)||directories.has(key),'Unknown synthetic path');return key},
  lstatSync:path=>{assert(files.has(resolve(path))||directories.has(resolve(path)));return{isSymbolicLink:()=>false}},
  spawnSync:forbidden,writeFileSync:forbidden,copyFileSync:forbidden,renameSync:forbidden,unlinkSync:forbidden,mkdirSync:forbidden,readdirSync:forbidden});
 const rootLine="export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');";
 const mainGuard="if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();";
 assert.equal(candidateSource.split(rootLine).length,2);assert.equal(candidateSource.split(mainGuard).length,2);
 const callable=candidateSource.replace(/^import .*;\r?\n/gm,'').replace(rootLine,'').replace(mainGuard,'').replace(/^export /gm,'');
 assert(!callable.includes('import.meta'),'No hidden module-location rewrite');
 vm.runInContext(callable+'\nthis.api={crowdSourceMap,crowdPublicClip,crowdPublicPlan,prepareCrowdDefaultManifest,crowdRecordingsBlock,crowdCandidateBlock,crowdAuthoringHelperSha256};',context,{timeout:2000});
 const put=(path,value)=>{const key=resolve(path),bytes=Buffer.isBuffer(value)?value:Buffer.from(JSON.stringify(value));files.set(key,bytes);return{path:key,sha256:digest(bytes)}};
 const api=context.api,jobs=plain([...api.crowdSourceMap(cast,root).values()]);
 const job=jobs.find(row=>row.voiceId==='crowd-baerbel-brezel'&&row.region==='germany'&&row.slot===0),owned=jobs.filter(row=>row.voiceId===job.voiceId);
 const music=resolve(root,'SYNTHETIC-MEMORY-ONLY'),family=resolve(music,'GermanySimulator crowd dialogue review 2026-10-15');directories.add(family);
 const plan={family:'crowd-dialogue',publicAssetFamily:'assets/voices/candidate-dialogue',privateReviewFamily:'GermanySimulator crowd dialogue review 2026-10-15',requestedLineCount:36,sourceSha256:publicPins,jobs,privateDebugPath:privateSentinel};
 const planProof=put(resolve(family,'full36.json'),plan),request={requestedLineCount:4,sourceSha256:publicPins,jobs:owned,authoredPlanSha256:planProof.sha256,authoredPlanSourceSha256:publicPins};
 const requestProof=put(resolve(family,job.voiceId,'requests.json'),request),rawBytes=Buffer.from('SYNTHETIC CONTRACT RAW MARKER: NOT AUDIO'),encodedBytes=Buffer.from('SYNTHETIC CONTRACT ENCODED MARKER: NOT AUDIO');
 const helper=api.crowdAuthoringHelperSha256,profileHash='1'.repeat(64),asrHash='2'.repeat(64);
 const raw={...job,seed:71000,synthesisAttempt:1,authoringHelperSha256:helper,rendererInputText:job.text,rendererInputBasis:'exact authored source',requestSha256:requestProof.sha256,profileJsonSha256:profileHash,rawSha256:digest(rawBytes),modelLicense:'MIT',referenceLicense:'CC0-1.0',durationSeconds:2,listening:'pending',status:'private candidate',
  decode:{maxSpeechTokens:304,generatedSpeechTokens:100,eosReached:true,attentionHooksBefore:0,attentionHooksAfter:0,privateDebugPath:privateSentinel},
  synthesis:{languageId:'de',device:'cuda',precision:'fp16',t3WeightPrecision:'float16',conditioningPrecision:'float32',referenceReconditionedForProfile:job.profileId,referenceConditioningVerifiedFloat32:true,inferenceMode:true,cpuThreads:2,exaggeration:.5,temperature:.65,repetitionPenalty:3,cfgWeight:.6,privateDebugPath:privateSentinel}};
 const wordCues=[...job.text.matchAll(/[\p{L}\p{N}_]+/gu)].map((word,i)=>({word:word[0],charIndex:word.index,at:i*.05,end:(i+1)*.05}));
 const encoded={...raw,status:'eligible exact-text recording; human listening pending',integratedLufs:-18,truePeakDbtp:-2,asr:job.text,asrWordExact:true,asrLiteralWordExact:true,asrScriptPrompt:null,asrLanguageId:'de',asrComputeType:'int8',asrEffectiveComputeType:'int8_float32',asrDevice:'cpu',asrCpuThreads:1,asrModelSha256:asrHash,asrBeamSize:1,
  asrReadings:[{beamSize:1,transcript:job.text,words:[{word:privateSentinel,start:0,end:1}]}],asrModelDirectoryName:privateSentinel,wordCues,sha256:digest(encodedBytes),bytes:encodedBytes.length,sampleRateHz:48000,channels:1,bitrateBitsPerSecond:128000,file:`assets/voices/candidate-dialogue/${job.clipId}.mp3`,unknownPrivatePayload:{path:privateSentinel}};
 put(resolve(family,job.voiceId,'raw',job.clipId+'.json'),raw);put(resolve(family,job.voiceId,'raw',job.clipId+'.wav'),rawBytes);
 put(resolve(family,job.voiceId,'encoded',job.clipId+'.json'),encoded);put(resolve(family,job.voiceId,'encoded',job.clipId+'.mp3'),encodedBytes);put(resolve(root,encoded.file),encodedBytes);
 const authority={status:'ROOT_SEALED_FINITE_CROWD9',executorThread:'01a13cd8-cbde-75b3-9876-7d75cbe6bef1',grantId:'SYNTHETIC-CONTRACT-ONLY',sourceCommit:'a'.repeat(40),helperSha256:helper,maximumNativeCalls:9,maximumCallsPerClip:1,maximumAsrReadings:18,automaticRetries:0,requestPath:planProof.path,requestSha256:planProof.sha256,sourceSha256:publicPins,musicRoot:music,adapterSha256:'3'.repeat(64),tokenCaps:{[job.clipId]:304},profileBindings:{[job.voiceId]:{profileJsonSha256:profileHash}},asrModelSha256:asrHash};
 const authorityProof=put(resolve(family,'authority.json'),authority),approval={status:'user-approved',scope:'whole-game-fixed-voice-cloning',date:'2026-10-15',instruction:'SYNTHETIC CONTRACT ONLY; no actual voice use selected',clipId:job.clipId,encodedSha256:encoded.sha256};
 const input={voiceId:job.voiceId,profileId:job.profileId,requestedLineCount:4,generatedLineCount:1,lineCount:1,clips:[{...encoded,approval}],heldPrivate:owned.filter(row=>row.clipId!==job.clipId).map(row=>({...row,reason:'not rendered; selected production fallback',privatePath:privateSentinel})),privatePath:privateSentinel};
 return{api,job,jobs,input,cast,root,authorityProof,prepare:()=>plain(api.prepareCrowdDefaultManifest(cast,input,authorityProof,root)),deniedCalls};
}

test('real preparer returns one public owned clip, three exact pending slots and no private payload',()=>{
 const h=harness(),result=h.prepare(),clip=result.clips[0],serialized=JSON.stringify(result);
 assert.equal(result.generatedLineCount,1);assert.equal(result.requestedLineCount,4);assert.equal(result.lineCount,1);assert.equal(result.heldPrivate.length,3);
 assert.equal(new Set([...result.clips,...result.heldPrivate].map(row=>row.clipId)).size,4);
 assert(result.heldPrivate.every(row=>row.reason==='not rendered; selected production fallback'&&row.clipId!==h.job.clipId));
 assert.equal(clip.actorId,h.job.actorId);assert.equal(clip.voiceId,h.job.voiceId);assert.equal(clip.english,h.job.english);assert.equal(clip.listening,'pending');
 assert(!serialized.includes(privateSentinel));assert(!serialized.includes('asrReadings"'+':'+ '['));assert(!Object.hasOwn(clip,'asrReadings'));assert(!Object.hasOwn(result.crowdAdmission.fullPlan,'text'));
 assert.deepEqual(Object.keys(result.crowdAdmission.fullPlan).sort(),['jobs','nativeSha256','sourceSha256']);assert.equal(result.crowdAdmission.fullPlan.jobs.length,36);
 assert.equal(result.crowdAdmission.takes[h.job.clipId].asrReadings,1,'Aggregate count survives; beam payload does not');
 assert.deepEqual(plain(h.input.clips[0].asrReadings)[0].words[0].word,privateSentinel,'Sanitizer does not modify original private input');assert.equal(h.deniedCalls.length,0);
});

test('real private preparer rejects source/approval drift and duplicate held identity',()=>{
 for(const edit of [clip=>{clip.actorId='foreign-actor'},clip=>{clip.english+=' changed'},clip=>{clip.approval.encodedSha256='0'.repeat(64)}]){
  const h=harness();edit(h.input.clips[0]);assert.throws(h.prepare);assert.equal(h.deniedCalls.length,0);
 }
 const h=harness();h.input.heldPrivate[1]=structuredClone(h.input.heldPrivate[0]);assert.throws(h.prepare,/accounting|slot changed/);
});

function project(prepared,h){
 const manifest={...prepared,provenanceManifest:`assets/voices/candidate-dialogue/${h.job.voiceId}-crowd-manifest.json`,provenanceManifestSha256:'4'.repeat(64)};
 const block=h.api.crowdRecordingsBlock(cast,[manifest],root,root);
 assert.equal(catalogSource.split('const recordings=Object.freeze({').length,2);
 const pattern=/const crowdRecordings=Object\.freeze\([^\n]*\);\r?\n/;
 assert.equal([...catalogSource.matchAll(new RegExp(pattern,'g'))].length,1,'One existing generated crowd block');
 return catalogSource.replace(pattern,()=>block);
}
function runtime(source,search=''){
 const context=vm.createContext({window:{},location:{search},URLSearchParams});
 vm.runInContext(source,context,{timeout:2000});
 return{catalog:context.window.GermanySimulatorAudioText,snapshot:plain({recordings:context.window.GermanySimulatorAudioText.recordings,productionVoices:context.window.GermanySimulatorAudioText.productionVoices})};
}

test('compact crowd projection preserves unrelated recordings, profiles and historical preview behavior',()=>{
 const h=harness(),prepared=h.prepare(),projected=project(prepared,h),before=runtime(catalogSource),after=runtime(projected),beforePreview=runtime(catalogSource,'?voicePreview=1'),afterPreview=runtime(projected,'?voicePreview=1'),file='./'+prepared.clips[0].file;
 assert.equal(after.catalog.recordedClip(h.job.voiceId,h.job.text),file);assert.equal(after.catalog.candidateClip(h.job.voiceId,h.job.text),file);
 assert.equal(after.catalog.recordedClip('crowd-brigitte-bueroklammer',h.job.text),null);
 const unrelated=Object.entries(before.snapshot.recordings).filter(([,row])=>row.trigger!=='crowd-owned-exact-dialogue');
 assert(unrelated.length>0);for(const[path,recording]of unrelated)assert.deepEqual(after.snapshot.recordings[path],recording,path);
 assert.equal(Object.keys(after.snapshot.recordings).length,unrelated.length+1);assert.deepEqual(after.snapshot.productionVoices,before.snapshot.productionVoices);
 const generic=legacyManifest.clips.filter(row=>row.voiceId.startsWith('crowd-'));assert(generic.length>0);
 for(const row of generic){assert.equal(after.catalog.candidateClip(row.voiceId,row.text),before.catalog.candidateClip(row.voiceId,row.text),'Default preview conservation');assert.equal(afterPreview.catalog.candidateClip(row.voiceId,row.text),beforePreview.catalog.candidateClip(row.voiceId,row.text),'Opt-in preview conservation')}
 for(const held of prepared.heldPrivate)assert.equal(after.catalog.recordedClip(held.voiceId,held.text),null,'Unrendered slot cannot acquire a default');
});

test('real public projection rejects source/profile/byte/cue/native gates and unselected take cannot become default',()=>{
 for(const[edit,message]of [
  [row=>{row.clips[0].actorId='foreign-actor'},/ownership/],
  [row=>{row.clips[0].profileId='foreign-profile'},/profile/],
  [row=>{row.clips[0].sha256='0'.repeat(64)},/asset path or bytes/],
  [row=>{row.clips[0].wordCues=[]},/Incomplete crowd exact final-caption cues/],
  [row=>{row.clips[0].decode.eosReached=false},/Missing or incomplete Knick generation receipt/],
  [row=>{row.clips[0].asrWordExact=false},/Unverified fixed take/],
  [row=>{row.clips[0].integratedLufs=-30},/Unverified fixed take/],
  [row=>{row.clips[0].asrLiteralWordExact=false},/Crowd final native encoding/],
  [row=>{row.clips[0].synthesis.precision='fp32'},/Crowd native conditioning/],
  [row=>{row.crowdAdmission.fullPlan.jobs[0].english+=' changed'},/Public crowd source/]
 ]){
  const h=harness(),prepared=h.prepare();edit(prepared);assert.throws(()=>project(prepared,h),message);assert.equal(h.deniedCalls.length,0);
 }
 const h=harness(),prepared=h.prepare();delete prepared.clips[0].approval;const result=runtime(project(prepared,h));assert.equal(result.catalog.recordedClip(h.job.voiceId,h.job.text),null);
});

test('public owned manifests select only their exact approved source identities and retain missing-slot fallbacks',()=>{
 const h=harness(),directory=resolve(root,'assets/voices/candidate-dialogue'),manifests=readdirSync(directory).filter(name=>name.endsWith('-crowd-manifest.json')).map(name=>JSON.parse(readFileSync(resolve(directory,name),'utf8'))),current=runtime(catalogSource);
 const expectedVoices=[...new Set(h.jobs.map(row=>row.voiceId))].sort();assert.deepEqual([...new Set(manifests.map(row=>row.voiceId))].sort(),expectedVoices);
 const scopes=manifests.map(row=>row.voiceId+'\0'+(row.generationScope??'first9'));assert.equal(new Set(scopes).size,scopes.length,'Each voice owns only one manifest per generation scope');
 const selected=manifests.flatMap(manifest=>manifest.clips.filter(clip=>clip.approval?.status==='user-approved')),byId=new Map(selected.map(row=>[row.clipId,row]));assert.equal(byId.size,selected.length);assert(selected.length>0);
 for(const manifest of manifests){const owned=h.jobs.filter(row=>row.voiceId===manifest.voiceId),records=[...manifest.clips,...manifest.heldPrivate];assert.equal(manifest.requestedLineCount,owned.length);assert.equal(records.length,owned.length);assert.equal(new Set(records.map(row=>row.clipId)).size,owned.length);for(const row of records){const job=owned.find(job=>job.clipId===row.clipId);assert(job);for(const[key,value]of Object.entries(job))assert.deepEqual(row[key],value,key)}}
 let absent=0;for(const job of h.jobs){const clip=byId.get(job.clipId),expected=clip?'./'+clip.file:null;assert.equal(current.catalog.recordedClip(job.voiceId,job.text),expected,job.clipId);assert.equal(current.catalog.candidateClip(job.voiceId,job.text),expected,job.clipId);if(!clip)absent++;else{assert.equal(clip.actorId,job.actorId);assert.equal(clip.english,job.english);const row=current.snapshot.recordings[expected];assert.equal(row.sha256,clip.sha256);assert.equal(row.voiceId,job.voiceId);assert.equal(row.actorId,job.actorId);assert.equal(row.source,job.text);assert.equal(row.profileId,job.profileId)}}
 assert.equal(selected.length+absent,h.jobs.length);assert(absent>0);
});
