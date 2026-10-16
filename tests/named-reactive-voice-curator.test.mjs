// Source contracts only: synthetic files and receipts, no private or media input.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import vm from 'node:vm';

const digest=value=>createHash('sha256').update(value).digest('hex');
const copy=readFileSync(new URL('../tools/curate-voice-library.mjs',import.meta.url),'utf8');
const helper=digest(readFileSync(new URL('../tools/build-knick-voice.py',import.meta.url)));
const scope='named-crowd-reactive-v1';
const actors=['crowd-baerbel-brezel','crowd-brigitte-bueroklammer','crowd-elfriede-eingabe','crowd-guenther-gartenzaun','crowd-hildegard-brotzeit','crowd-irmgard-aktenordner','crowd-klaus-dieter-knoedel','crowd-manfred-mittagsruhe','crowd-ruediger-rasenkante'];
const columns=['clipId','voiceId','actorId','region','slot','sourceLocator','text','english','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','processing','cause'];
function between(begin,end){
 const start=copy.indexOf(begin),finish=copy.indexOf(end,start);
 assert.ok(start>=0&&finish>start,begin);
 return copy.slice(start,finish).replaceAll('export function ','function ');
}
const fragments=[
 between('const crowdPublicJobFields=','function crowdPublicPlan('),
 between('// Sandale is a separate source scope;','// SOURCE FRAGMENT for the existing curator;'),
 between('const reactiveScope=','export function main('),
 between('export function matchesProduction(','export function writeArchiveMetadata('),
 between('export function editedDeliveryComplete(','function fixedAssetInventory('),
 between('export function spokenWords(','function streetAuthority('),
 between('function fixedTakeAuthority(','// Police text is authored by game.js;'),
 between('function crowdExactCues(','function crowdDefaultClipAuthority('),
 between('function policeEosTraceAuthority(','// ROOT-only post-run collector:'),
 between('export function fixedRecordingsBlock(','const cityAuthoringHelperSha256=')
];
const cli=between(" const reactiveDirectory=resolve(root,'assets/voices/candidate-dialogue')"," const sandaleDirectory=resolve(root,'assets/voices/candidate-dialogue')");

function frozenSource(value){
 if(Array.isArray(value))return 'Object.freeze(['+value.map(frozenSource).join(',')+'])';
 if(value&&typeof value==='object')return 'Object.freeze({'+Object.entries(value).map(([key,item])=>JSON.stringify(key)+':'+frozenSource(item)).join(',')+'})';
 return JSON.stringify(value);
}
function fixture(){
 const root=resolve('synthetic-named-reactive-source'),files=new Map();
 const put=(path,value)=>files.set(resolve(path),typeof value==='string'?value:JSON.stringify(value));
 const read=path=>{const value=files.get(resolve(path));if(value===undefined)throw Error('Unexpected file read: '+path);return value;};
 const hash=path=>resolve(path)===resolve(root,'tools/build-knick-voice.py')?helper:digest(read(path));
 const barks=Object.fromEntries(actors.map((actor,index)=>[actor,Object.fromEntries(['berlin','germany'].map(region=>[region,Object.fromEntries([['grass',4],['road',4],['jaywalker',6]].map(([cause,count])=>[cause,Array.from({length:count},(_,slot)=>({id:actor+'-reactive-'+region+'-'+cause+'-'+String(slot+1).padStart(2,'0'),text:'Quelle '+index+' '+region+' '+cause+' '+slot,english:'Caption '+index+' '+cause+' '+slot}))]))]))]));
 const cast={productionExceptions:[],roleProfiles:actors.map((actor,i)=>({gameRole:actor,voiceId:actor,secretTunnelProfileId:String(i+1).repeat(32),runtimeArchetype:'towel-man',dialogueSources:['game.js actor-owned crowdReactiveBarks['+actor+'][region][cause]; grass4/road4/jaywalker6 per region'],reference:{workingReferenceSha256:'b'.repeat(64),license:'CC0-1.0'}})),productionVoices:Object.fromEntries(actors.map((actor,i)=>[actor,{profileId:String(i+1).repeat(32),referenceSha256:'a'.repeat(64),originalSha256:'b'.repeat(64),renderer:'ResembleAI/Chatterbox Multilingual V2 0.1.7',modelRevision:'5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18',processing:null,fallback:'captions'}]))};
 const writeSources=()=>{
  put(resolve(root,'game.js'),'const crowdReactiveBarks='+frozenSource(barks)+';\n\nconst germannessVoice={};');
  put(resolve(root,'For-AI/VOICE-DIALOGUE-INVENTORY.json'),{pools:{crowdReactiveBarks:barks}});
  put(resolve(root,'For-AI/VOICE-CAST.json'),cast);
 };
 writeSources();put(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'window.GermanySimulatorAudioText={pools:{}};');
 const context={root,resolve,sep,vm,readFileSync:read,hash,textHash:digest,json:path=>JSON.parse(read(path)),sameJson:(a,b)=>JSON.stringify(a)===JSON.stringify(b),requireMatch:(ok,why)=>{if(!ok)throw Error(why)},
  existsSync:path=>[...files.keys()].some(file=>file===resolve(path)||file.startsWith(resolve(path)+sep)),
  readdirSync:path=>[...files.keys()].filter(file=>file.startsWith(resolve(path)+sep)&&!file.slice(resolve(path).length+1).includes(sep)).map(file=>file.slice(resolve(path).length+1)),
  realpathSync:path=>resolve(path),lstatSync:()=>({isSymbolicLink:()=>false})};
 vm.createContext(context);for(const fragment of fragments)vm.runInContext(fragment,context);
 const jobs=[...context.reactiveSourceMap(cast,root).values()];
 const plan={family:'crowd-dialogue',sourceScope:scope,publicAssetFamily:'assets/voices/candidate-dialogue',privateReviewFamily:'GermanySimulator crowd dialogue review 2026-10-15',authoringHelperSha256:helper,requestedLineCount:252,jobs,sourceSha256:Object.fromEntries(['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'].map(path=>[path,hash(resolve(root,path))]))};
 const snapshot=()=>{const text=JSON.stringify(plan);return {text,sha256:digest(text)}};
 return {root,files,put,read,hash,context,cast,barks,plan,jobs,snapshot,writeSources};
}
test('extract exact 252 stable IDs, nine owners and 28 source-owned rows each',()=>{
 const f=fixture();assert.equal(f.jobs.length,252);assert.equal(new Set(f.jobs.map(row=>row.clipId)).size,252);
 for(const actor of actors){
  const rows=f.jobs.filter(row=>row.actorId===actor);assert.equal(rows.length,28);
  for(const region of ['berlin','germany'])for(const [cause,count] of [['grass',4],['road',4],['jaywalker',6]])assert.equal(rows.filter(row=>row.region===region&&row.cause===cause).length,count);
 }
 assert.deepEqual(Object.keys(f.jobs[0]),columns);
 assert.equal(f.jobs[0].sourceLocator,'game.js crowdReactiveBarks[crowd-baerbel-brezel].berlin.grass[0]');
 assert.equal(f.context.reactiveFullPlan(f.cast,f.snapshot(),f.root).authored.size,252);
 f.plan.jobs.reverse();assert.equal(f.context.reactiveFullPlan(f.cast,f.snapshot(),f.root).authored.keys().next().value,f.plan.jobs[0].clipId);
});
test('source reorder keeps explicit IDs and changes only current locators',()=>{
 const f=fixture(),rows=f.barks[actors[0]].berlin.grass,[first,second]=rows;
 [rows[0],rows[1]]=[second,first];f.writeSources();
 const reordered=f.context.reactiveSourceMap(f.cast,f.root);
 assert.equal(reordered.get(first.id).slot,1);assert.equal(reordered.get(second.id).slot,0);
 assert.throws(()=>f.context.reactiveFullPlan(f.cast,f.snapshot(),f.root));
});
test('immutable source accepts opaque stable IDs and whitespace without positional renumbering',()=>{
 const f=fixture();f.barks[actors[0]].berlin.grass[0].id='stable-public-source-identity';f.writeSources();
 const path=resolve(f.root,'game.js');f.put(path,f.read(path).replace(';\n\nconst germannessVoice=',';\n \t\nconst germannessVoice='));
 const rows=f.context.reactiveSourceMap(f.cast,f.root);assert.equal(rows.get('stable-public-source-identity').slot,0);
 assert.equal(rows.get('stable-public-source-identity').sourceLocator,'game.js crowdReactiveBarks[crowd-baerbel-brezel].berlin.grass[0]');
});
test('ambiguous declarations and mutable nested source objects fail closed',()=>{
 for(const kind of ['ambiguous','mutable']){
  const f=fixture(),path=resolve(f.root,'game.js');
  f.put(path,kind==='ambiguous'?f.read(path)+'\n'+f.read(path):'const crowdReactiveBarks=Object.freeze('+JSON.stringify(f.barks)+');\nconst germannessVoice={};');
  assert.throws(()=>f.context.reactiveSourceMap(f.cast,f.root),kind==='ambiguous'?/ambiguous/:/recursively immutable/);
 }
});

for(const [name,change] of Object.entries({
 missingScope:f=>delete f.plan.sourceScope,oldScope:f=>f.plan.sourceScope='sandale-roles-v1',wrongHelper:f=>f.plan.authoringHelperSha256='0'.repeat(64),
 partial:f=>f.plan.jobs.pop(),duplicate:f=>f.plan.jobs[1]=f.plan.jobs[0],sourcePin:f=>f.plan.sourceSha256['game.js']='0'.repeat(64),
 owner:f=>f.plan.jobs[0]={...f.plan.jobs[0],actorId:actors[1]},voice:f=>f.plan.jobs[0]={...f.plan.jobs[0],voiceId:actors[1]},
 profile:f=>f.plan.jobs[0]={...f.plan.jobs[0],profileId:f.jobs[28].profileId},cause:f=>f.plan.jobs[0]={...f.plan.jobs[0],cause:'road'},
 droppedCause:f=>{f.plan.jobs[0]={...f.plan.jobs[0]};delete f.plan.jobs[0].cause},slot:f=>f.plan.jobs[0]={...f.plan.jobs[0],slot:1},
 stableId:f=>f.plan.jobs[0]={...f.plan.jobs[0],clipId:'renumbered'},english:f=>f.plan.jobs[0]={...f.plan.jobs[0],english:'Changed'},
 text:f=>f.plan.jobs[0]={...f.plan.jobs[0],text:'Changed'},extraField:f=>f.plan.jobs[0]={...f.plan.jobs[0],archetypeId:'towel-man'}
}))test('reject request '+name,()=>{const f=fixture();change(f);assert.throws(()=>f.context.reactiveFullPlan(f.cast,f.snapshot(),f.root));});
for(const [name,change] of Object.entries({
 missingActor:f=>delete f.barks[actors[0]],extraActor:f=>f.barks.extra=f.barks[actors[0]],extraRegion:f=>f.barks[actors[0]].other=f.barks[actors[0]].berlin,
 wrongCause:f=>{f.barks[actors[0]].berlin.sidewalk=f.barks[actors[0]].berlin.grass;delete f.barks[actors[0]].berlin.grass},
 missingRow:f=>f.barks[actors[0]].berlin.grass.pop(),duplicateId:f=>f.barks[actors[0]].berlin.grass[1].id=f.barks[actors[0]].berlin.grass[0].id,
 unsafeId:f=>f.barks[actors[0]].berlin.grass[0].id='../borrowed',emptyId:f=>f.barks[actors[0]].berlin.grass[0].id='',
 borrowedId:f=>f.barks[actors[0]].berlin.grass[0].id=f.barks[actors[1]].berlin.grass[0].id,
 english:f=>f.barks[actors[0]].berlin.grass[0].english='',extraPayload:f=>f.barks[actors[0]].berlin.grass[0].cause='grass',
 owner:f=>f.cast.roleProfiles[0].voiceId=actors[1],profile:f=>f.cast.roleProfiles[0].secretTunnelProfileId=f.cast.roleProfiles[1].secretTunnelProfileId,
 index:f=>f.cast.roleProfiles[0].dialogueSources=[],duplicateIndex:f=>f.cast.roleProfiles[0].dialogueSources.push(f.cast.roleProfiles[0].dialogueSources[0]),license:f=>f.cast.roleProfiles[0].reference.license='unknown',processing:f=>f.cast.productionVoices[actors[0]].processing='filter'
}))test('reject source '+name,()=>{const f=fixture();change(f);f.writeSources();assert.throws(()=>f.context.reactiveSourceMap(f.cast,f.root));});
test('derived public inventory cannot replace or diverge from the immutable runtime source',()=>{
 const f=fixture();f.put(resolve(f.root,'For-AI/VOICE-DIALOGUE-INVENTORY.json'),{pools:{crowdReactiveBarks:{}}});
 assert.throws(()=>f.context.reactiveSourceMap(f.cast,f.root),/inventory/);
});

function heldPreparation(){
 const f=fixture(),voice=actors[0],owned=f.jobs.filter(row=>row.voiceId===voice);
 const manifest={sourceScope:scope,voiceId:voice,profileId:owned[0].profileId,requestedLineCount:28,generatedLineCount:0,lineCount:0,clips:[],heldPrivate:owned.map(row=>({...row,reason:'not rendered; selected production fallback'}))};
 const requestPath=resolve(f.root,'request.json');f.put(requestPath,f.plan);
 const authorityPath=resolve(f.root,'authority.json'),authority={status:'ROOT_SEALED_FINITE_NAMED_REACTIVE',executorThread:'01a13cd8-cbde-75b3-9876-7d75cbe6bef1',sourceScope:scope,helperSha256:helper,grantId:'synthetic-only',adapterSha256:'d'.repeat(64),protectedPublicPins:{'synthetic-public':'e'.repeat(64)},maximumCallsPerClip:1,automaticRetries:0,requestPath,requestSha256:f.hash(requestPath),selectedClipIds:[f.jobs[28].clipId],maximumNativeCalls:1,maximumAsrReadings:2,sourceSha256:f.plan.sourceSha256,musicRoot:resolve(f.root,'private-synthetic')};
 f.put(authorityPath,authority);const authorityProof={path:authorityPath,sha256:f.hash(authorityPath)},terminalProofs={};
 for(const phase of ['plan','render','process']){
  const path=resolve(f.root,phase+'.json');
  f.put(path,{phase,specificationSha256:authorityProof.sha256,logsComplete:true,producerSha256:authority.adapterSha256,ownedCleanupKills:[],postflightPinFailures:[],postflightProtectedPinsChecked:1,exitCode:0,rootRetired:true,timedOut:false,survivingOwnedChildren:[],supervisorError:null});
  terminalProofs[phase]={path,sha256:f.hash(path)};
 }
 const privateRoot=resolve(authority.musicRoot,f.plan.privateReviewFamily,scope,voice);
 f.put(resolve(privateRoot,'requests.json'),{sourceScope:scope,authoringHelperSha256:helper,requestedLineCount:28,jobs:owned,authoredPlanSha256:authority.requestSha256,sourceSha256:f.plan.sourceSha256,authoredPlanSourceSha256:f.plan.sourceSha256});
 const sealAuthority=()=>{
  f.put(authorityPath,authority);authorityProof.sha256=f.hash(authorityPath);
  for(const ref of Object.values(terminalProofs)){const row=JSON.parse(f.read(ref.path));row.specificationSha256=authorityProof.sha256;f.put(ref.path,row);ref.sha256=f.hash(ref.path)}
 };
 return {...f,manifest,authority,authorityProof,terminalProofs,privateRoot,sealAuthority};
}
const prepare=f=>f.context.prepareReactiveManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,f.selectionProof??null,f.root);
test('all-held voice has 28 explicit captions and zero generated takes; other owner allocation is separate',()=>{
 const f=heldPreparation(),result=prepare(f);
 assert.equal(result.heldPrivate.length,28);assert.equal(result.generatedLineCount,0);assert.equal(result.clips.length,0);assert.equal(result.approvedExistingReuse.length,0);
 assert.deepEqual(Object.keys(result.heldPrivate[0]),[...columns,'reason']);
 assert.equal(result.crowdReactiveAdmission.jobs.length,252);assert.equal(result.crowdReactiveAdmission.helperSha256,helper);
 const block=f.context.reactiveRecordingsBlock(f.cast,[result],f.root,f.root),runtime={};vm.runInNewContext(block+'globalThis.result=crowdReactiveRecordings;',runtime);
 assert.equal(Object.keys(runtime.result).length,0);
});
for(const [name,change] of Object.entries({
 missingTerminal:f=>delete f.terminalProofs.process,partial:f=>f.manifest.heldPrivate.pop(),duplicate:f=>f.manifest.heldPrivate[1]=f.manifest.heldPrivate[0],
 falseGenerated:f=>f.manifest.generatedLineCount=1,wrongHold:f=>f.manifest.heldPrivate[0].reason='held private; selected production fallback',
 cause:f=>delete f.manifest.heldPrivate[0].cause,english:f=>f.manifest.heldPrivate[0].english='Changed',scope:f=>f.manifest.sourceScope='sandale-roles-v1'
}))test('reject preparation '+name,()=>{const f=heldPreparation();change(f);assert.throws(()=>prepare(f));});
for(const [name,change] of Object.entries({
 executorThread:f=>f.authority.executorThread='other-thread',scope:f=>f.authority.sourceScope='sandale-roles-v1',helper:f=>f.authority.helperSha256='0'.repeat(64),
 adapter:f=>f.authority.adapterSha256='0'.repeat(64),retries:f=>f.authority.automaticRetries=1,calls:f=>f.authority.maximumNativeCalls=2
}))test('reject authority '+name,()=>{const f=heldPreparation();change(f);f.sealAuthority();assert.throws(()=>prepare(f));});
test('scoped frozen request must retain its own exact reviewed helper',()=>{
 const f=heldPreparation(),path=resolve(f.privateRoot,'requests.json'),request=JSON.parse(f.read(path));
 request.authoringHelperSha256='0'.repeat(64);f.put(path,request);assert.throws(()=>prepare(f),/28-slot plan/);
});
test('legacy private voice leaf cannot satisfy the new scoped freeze',()=>{
 const f=heldPreparation(),path=resolve(f.privateRoot,'requests.json'),legacy=resolve(f.authority.musicRoot,f.plan.privateReviewFamily,f.manifest.voiceId,'requests.json');
 f.put(legacy,f.read(path));f.files.delete(path);assert.throws(()=>prepare(f),/Unexpected file read/);
});
test('allocated held slot requires its actual raw receipt and WAV, not just allocation',()=>{
 const f=heldPreparation();f.authority.selectedClipIds=[f.jobs[0].clipId];f.sealAuthority();
 f.manifest.generatedLineCount=1;f.manifest.heldPrivate[0].reason='held private; selected production fallback';
 assert.throws(()=>prepare(f),/raw receipt\/media set/);
});
test('orphan raw and encoded files are rejected independently of accepted count',()=>{
 for(const [directory,name] of [['raw','unallocated.json'],['raw','unallocated-eos-trace.json'],['encoded','unallocated.mp3'],['encoded','unallocated-processed.wav']]){
  const f=heldPreparation();f.put(resolve(f.privateRoot,directory,name),'synthetic only');
  assert.throws(()=>prepare(f),/receipt\/media set/);
 }
});

function acceptedPreparation(){
 const f=heldPreparation(),job=f.jobs[0],rawPath=resolve(f.privateRoot,'raw',job.clipId+'.json'),encodedPath=resolve(f.privateRoot,'encoded',job.clipId+'.json'),mp3Path=resolve(f.privateRoot,'encoded',job.clipId+'.mp3'),wavPath=resolve(f.privateRoot,'raw',job.clipId+'.wav');
 f.authority.selectedClipIds=[job.clipId];f.authority.seeds={[job.clipId]:71000};f.authority.tokenCaps={[job.clipId]:250};f.authority.profileBindings={[job.voiceId]:{profileJsonSha256:'c'.repeat(64)}};f.authority.asrModelSha256='e'.repeat(64);f.sealAuthority();
 const trace={clipId:job.clipId,text:job.text,profileId:job.profileId,referenceSha256:job.referenceSha256,modelRevision:job.modelRevision,steps:[{step:1,completeBefore:false,completeAfter:false,nativeEosSuppressed:false,analyzerForcedEos:false,modelEosRestored:false,textPosition:0,textTokenCount:5,modelEosLogit:0,nativeEosLogit:0}]};
 const tracePath=resolve(f.privateRoot,'raw',job.clipId+'-eos-trace.json');f.put(tracePath,trace);f.put(wavPath,'synthetic raw');f.put(mp3Path,'synthetic mp3');
 const raw={...job,requestSha256:f.hash(resolve(f.privateRoot,'requests.json')),authoringHelperSha256:helper,rendererInputText:job.text,rendererInputBasis:'exact authored source',synthesisAttempt:1,seed:71000,profileJsonSha256:'c'.repeat(64),rawSha256:f.hash(wavPath),durationSeconds:1,listening:'pending',modelLicense:'MIT',referenceLicense:'CC0-1.0',decode:{eosReached:true,eosKind:'model-sampled',maxSpeechTokens:250,generatedSpeechTokens:5,attentionHooksBefore:0,attentionHooksAfter:0,temporaryAnalyzerHooksRemoved:0,modelEosRestoredSteps:0,eosSuppressionObservedSteps:0,alignmentFirstCompletedStep:null,eosPolicy:'Native analyzer unchanged; observation only',nativeAnalyzerSourceSha256:'f'.repeat(64),eosTraceSha256:f.hash(tracePath)},synthesis:{languageId:'de',device:'cuda',precision:'fp16',t3WeightPrecision:'float16',conditioningPrecision:'float32',referenceReconditionedForProfile:job.profileId,referenceConditioningVerifiedFloat32:true,inferenceMode:true,cpuThreads:2,exaggeration:.5,temperature:.65,repetitionPenalty:3,cfgWeight:.6}};
 f.put(rawPath,raw);
 const cues=[...job.text.matchAll(/[\p{L}\p{N}_]+/gu)].map((match,i)=>({word:match[0],charIndex:match.index,at:Number((i*.2).toFixed(3)),end:Number((i*.2+.1).toFixed(3))}));
 const encoded={...raw,sha256:f.hash(mp3Path),file:'assets/voices/candidate-dialogue/'+job.clipId+'.mp3',bytes:13,sampleRateHz:48000,channels:1,bitrateBitsPerSecond:128000,integratedLufs:-18,truePeakDbtp:-2,asr:job.text,asrWordExact:true,asrLiteralWordExact:true,asrScriptPrompt:null,asrLanguageId:'de',asrComputeType:'int8',asrEffectiveComputeType:'int8',asrCpuThreads:1,asrDevice:'cpu',asrModelSha256:f.authority.asrModelSha256,asrBeamSize:1,wordCues:cues,asrReadings:[{beamSize:1,transcript:job.text,words:cues.map(cue=>({word:cue.word,start:cue.at,end:cue.end}))}]};
 f.put(encodedPath,encoded);f.put(resolve(f.root,encoded.file),'synthetic mp3');
 const selection={status:'user-approved',scope:'whole-game-fixed-voice-cloning',date:'2026-10-16',instruction:'synthetic fixture only, never a real selection',clips:[{clipId:job.clipId,encodedSha256:encoded.sha256}]},selectionPath=resolve(f.root,'selection.json');
 f.put(selectionPath,selection);const selectionProof={path:selectionPath,sha256:f.hash(selectionPath)},approval={status:selection.status,scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256};
 f.manifest.generatedLineCount=1;f.manifest.lineCount=1;f.manifest.clips=[{...encoded,approval}];f.manifest.heldPrivate=f.manifest.heldPrivate.slice(1);
 return {...f,selectionProof,rawPath,encodedPath,tracePath,mp3Path,wavPath};
}
test('accepted path runs maintained fixed/cue/EOS/selection validators and preserves cause publicly',()=>{
 const f=acceptedPreparation(),result=prepare(f);
 assert.equal(result.clips.length,1);assert.equal(result.heldPrivate.length,27);assert.equal(result.generatedLineCount,1);
 assert.equal(result.clips[0].cause,'grass');assert.equal(result.clips[0].english,f.jobs[0].english);assert.equal(result.clips[0].listening,'pending');
 assert.equal(Object.hasOwn(result.clips[0],'asrReadings'),false);assert.equal(result.crowdReactiveAdmission.selectionSha256,f.selectionProof.sha256);
 assert.deepEqual(Object.keys(result.crowdReactiveAdmission.allocatedTakes),[f.jobs[0].clipId]);
 const block=f.context.reactiveRecordingsBlock(f.cast,[result],f.root,f.root),runtime={};vm.runInNewContext(block+'globalThis.result=crowdReactiveRecordings;',runtime);
 const recording=runtime.result['./'+result.clips[0].file];
 assert.equal(recording.clipId,f.jobs[0].clipId);assert.equal(recording.voiceId,f.jobs[0].voiceId);assert.equal(recording.english,f.jobs[0].english);assert.equal(recording.source,f.jobs[0].text);assert.equal(recording.wordCues.length,5);
});
test('producer processed WAV survives alongside accepted encoded pair without becoming evidence',()=>{
 const f=acceptedPreparation();f.put(resolve(f.privateRoot,'encoded',f.jobs[0].clipId+'-processed.wav'),'synthetic intermediate');
 const result=prepare(f);assert.equal(result.generatedLineCount,1);assert.equal(result.clips.length,1);
 assert.equal(Object.hasOwn(result.crowdReactiveAdmission.allocatedTakes[f.jobs[0].clipId],'processedSha256'),false);
});
test('allocated held processing intermediate cannot count as an encoded or accepted take',()=>{
 const f=acceptedPreparation(),id=f.jobs[0].clipId;
 f.files.delete(f.encodedPath);f.files.delete(f.mp3Path);f.put(resolve(f.privateRoot,'encoded',id+'-processed.wav'),'synthetic intermediate');
 f.manifest.clips=[];f.manifest.lineCount=0;f.manifest.heldPrivate.unshift({...f.jobs[0],reason:'held private; selected production fallback'});delete f.selectionProof;
 const result=prepare(f);assert.equal(result.generatedLineCount,1);assert.equal(result.clips.length,0);assert.equal(result.heldPrivate.length,28);
 assert.equal(Object.hasOwn(result.crowdReactiveAdmission.allocatedTakes[id],'encodedSha256'),false);
});
test('held rows cannot claim technical verification from an allocated failed raw take',()=>{
 const f=acceptedPreparation(),raw=JSON.parse(f.read(f.rawPath));raw.decode.eosReached=false;f.put(f.rawPath,raw);
 f.files.delete(f.encodedPath);f.files.delete(f.mp3Path);f.manifest.clips=[];f.manifest.lineCount=0;delete f.selectionProof;
 f.manifest.heldPrivate.unshift({...f.jobs[0],reason:'technically verified; awaiting clip/hash-specific use selection'});
 assert.throws(()=>prepare(f),/hold reason/);
});
test('allocated but unselected encoded take stays held with truthful raw evidence',()=>{
 const f=acceptedPreparation(),clip=f.manifest.clips[0];
 f.manifest.clips=[];f.manifest.lineCount=0;f.manifest.heldPrivate.unshift({...f.jobs[0],reason:'held private; selected production fallback'});delete f.selectionProof;
 const result=prepare(f);assert.equal(result.generatedLineCount,1);assert.equal(result.clips.length,0);assert.equal(result.heldPrivate.length,28);
 assert.equal(result.crowdReactiveAdmission.allocatedTakes[clip.clipId].encodedSha256,clip.sha256);
 assert.equal(Object.keys(result.crowdReactiveAdmission.takes).length,0);
});
for(const [name,change] of Object.entries({
 noSelection:f=>delete f.selectionProof,selectionDigest:f=>f.selectionProof.sha256='0'.repeat(64),selectionBytes:f=>f.manifest.clips[0].approval.encodedSha256='0'.repeat(64),
 omittedSelected:f=>{f.manifest.heldPrivate.unshift({...f.jobs[0],reason:'technically verified; awaiting clip/hash-specific use selection'});f.manifest.clips=[];f.manifest.lineCount=0},
 rawCause:f=>{const row=JSON.parse(f.read(f.rawPath));delete row.cause;f.put(f.rawPath,row)},
 encodedCause:f=>{const row=JSON.parse(f.read(f.encodedPath));delete row.cause;f.put(f.encodedPath,row)},
 encodedEnglish:f=>{const row=JSON.parse(f.read(f.encodedPath));row.english='Changed';f.put(f.encodedPath,row)},
 actualAudio:f=>f.put(f.mp3Path,'different synthetic bytes'),
 wrongTiming:f=>{const row=JSON.parse(f.read(f.encodedPath));row.asrReadings[0].words[0].start=.05;f.put(f.encodedPath,row);f.manifest.clips[0].asrReadings=row.asrReadings},
 trace:f=>{const row=JSON.parse(f.read(f.tracePath));row.steps[0].modelEosRestored=true;f.put(f.tracePath,row)},
 terminal:f=>{const ref=f.terminalProofs.process,row=JSON.parse(f.read(ref.path));row.rootRetired=false;f.put(ref.path,row);ref.sha256=f.hash(ref.path)}
}))test('reject accepted path '+name,()=>{const f=acceptedPreparation();change(f);assert.throws(()=>prepare(f));});
for(const [name,change] of Object.entries({
 loudness:row=>row.integratedLufs=-10,
 literalAsr:row=>row.asrLiteralWordExact=false,
 sourceWords:row=>{row.asr='Different words';row.asrReadings[0].transcript=row.asr},
 captionGeometry:row=>row.wordCues[0].charIndex=1,
 pendingListening:row=>row.listening='verified'
}))test('maintained take gates reject '+name,()=>{
 const f=acceptedPreparation(),encoded=JSON.parse(f.read(f.encodedPath));change(encoded);f.put(f.encodedPath,encoded);
 f.manifest.clips[0]={...encoded,approval:f.manifest.clips[0].approval};
 assert.throws(()=>prepare(f));
});
test('actual EOS validator rejects a consistently rehashed invalid trace',()=>{
 const f=acceptedPreparation(),trace=JSON.parse(f.read(f.tracePath));trace.steps[0].modelEosRestored=true;f.put(f.tracePath,trace);
 for(const path of [f.rawPath,f.encodedPath]){const row=JSON.parse(f.read(path));row.decode.eosTraceSha256=f.hash(f.tracePath);f.put(path,row)}
 f.manifest.clips[0].decode.eosTraceSha256=f.hash(f.tracePath);
 assert.throws(()=>prepare(f),/native EOS trace/);
});
test('private-free public replay still validates tuple, evidence, held reasons and selection',()=>{
 const f=acceptedPreparation(),result=prepare(f);
 for(const path of [...f.files.keys()])if(path.startsWith(f.authority.musicRoot+sep)||path===f.authorityProof.path||path===f.selectionProof.path||Object.values(f.terminalProofs).some(ref=>ref.path===path))f.files.delete(path);
 const block=f.context.reactiveRecordingsBlock(f.cast,[result],f.root,f.root);assert.ok(block.includes(result.clips[0].clipId));
 for(const change of [
  row=>delete row.clips[0].cause,row=>row.heldPrivate[0].english='Changed',row=>row.crowdReactiveAdmission.jobs.pop(),
  row=>row.crowdReactiveAdmission.jobs[0].cause='road',row=>row.crowdReactiveAdmission.helperSha256='0'.repeat(64),
  row=>delete row.crowdReactiveAdmission.allocatedTakes[row.clips[0].clipId],row=>row.crowdReactiveAdmission.selectionSha256=null,
  row=>row.heldPrivate[0].reason='held private; selected production fallback'
 ]){
  const changed=JSON.parse(JSON.stringify(result));change(changed);
  assert.throws(()=>f.context.reactiveRecordingsBlock(f.cast,[changed],f.root,f.root));
 }
});

function publicCatalog(f,result){
 const relative='assets/voices/candidate-dialogue/'+result.voiceId+'-reactive-manifest.json',path=resolve(f.root,relative);
 f.put(path,result);const ledger={[relative]:f.hash(path)},bound={...result,provenanceManifest:relative,provenanceManifestSha256:ledger[relative]},block=f.context.reactiveRecordingsBlock(f.cast,[bound],f.root,f.root);
 return {relative,path,source:'const crowdReactiveAdmissions=Object.freeze('+JSON.stringify(ledger)+');\n'+block+'const recordings=Object.freeze({\n ...crowdReactiveRecordings,\n});\n'};
}
test('ordinary CLI scan accepts anchored public replay without private evidence reads',()=>{
 const f=acceptedPreparation(),result=prepare(f),catalog=publicCatalog(f,result);
 for(const path of [...f.files.keys()])if(path.startsWith(f.authority.musicRoot+sep))f.files.delete(path);
 Object.assign(f.context,{cast:f.cast,source:catalog.source,args:['--check']});vm.runInContext(cli,f.context);
 assert.equal(f.context.source,catalog.source);
});
test('ordinary CLI scan fails closed for orphan manifests, ledgers, projections and spreads',()=>{
 for(const kind of ['manifest','ledger','block','spread','digest','missingBlock','missingSpread']){
  const f=heldPreparation(),result=prepare(f),catalog=publicCatalog(f,result);
  let source=catalog.source;
  if(kind==='manifest')source='const recordings=Object.freeze({});\n';
  if(['ledger','block','spread'].includes(kind)){f.files.delete(catalog.path);source=kind==='ledger'?'const crowdReactiveAdmissions=Object.freeze({});\n':kind==='block'?'const crowdReactiveRecordings=Object.freeze({});\n':' ...crowdReactiveRecordings,'}
  if(kind==='digest')f.put(catalog.path,{...result,unexpected:true});
  if(kind==='missingBlock')source=source.replace(/const crowdReactiveRecordings=[^\n]*\n/,'');
  if(kind==='missingSpread')source=source.replace(' ...crowdReactiveRecordings,','');
  Object.assign(f.context,{cast:f.cast,source,args:['--check']});assert.throws(()=>vm.runInContext(cli,f.context));
 }
});
