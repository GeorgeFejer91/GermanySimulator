// Sandale source and admission contracts use an in-memory synthetic filesystem.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import vm from 'node:vm';
const digest=value=>createHash('sha256').update(value).digest('hex');
const copy=readFileSync(new URL('../tools/curate-voice-library.mjs',import.meta.url),'utf8');
const start=copy.indexOf('// Sandale is a separate source scope;'),end=copy.indexOf('// SOURCE FRAGMENT for the existing curator;',start);
assert.ok(start>=0&&end>start);
// Execute the maintained functions in a synthetic filesystem; no native,
// private, profile, audio or model input is used by these tests.
const fragment=copy.slice(start,end).replaceAll('export function ','function ');
const helper=digest(readFileSync(new URL('../tools/build-knick-voice.py',import.meta.url)));
const columns=['clipId','voiceId','actorId','region','slot','sourceLocator','text','english','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','processing'];
function fixture(){
 const root=resolve('synthetic-sandale-source'),files=new Map(),put=(path,value)=>files.set(resolve(path),typeof value==='string'?value:JSON.stringify(value));
 const archetypes=[{id:'towel-man',voiceId:'tourist-guenther-liegestuhl',barks:{berlin:['Mann Berlin eins.','Mann Berlin zwei.'],germany:['Mann Deutschland eins.','Mann Deutschland zwei.']}},{id:'towel-woman',voiceId:'touristin-walburga-handtuch',barks:{berlin:['Frau Berlin eins.','Frau Berlin zwei.'],germany:['Frau Deutschland eins.','Frau Deutschland zwei.']}}];
 const cast={productionExceptions:[],roleProfiles:archetypes.map((row,i)=>({gameRole:i?'frau-sandale':'herr-sandale',voiceId:row.voiceId,secretTunnelProfileId:String(i+1).repeat(32),dialogueSources:[`game.js crowdArchetypes[${row.id}].barks[region]`],reference:{workingReferenceSha256:'b'.repeat(64),license:'CC0-1.0'}})),productionVoices:Object.fromEntries(archetypes.map((row,i)=>[row.voiceId,{profileId:String(i+1).repeat(32),referenceSha256:'a'.repeat(64),originalSha256:'b'.repeat(64),renderer:'ResembleAI/Chatterbox Multilingual V2 0.1.7',modelRevision:'5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18',fallback:'captions'}]))};
 put(resolve(root,'game.js'),'const crowdArchetypes=Object.freeze('+JSON.stringify(archetypes)+');\nconst crowdCharacterBarks=Object.freeze({});');
 put(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'window.GermanySimulatorAudioText={pools:{towelMan:["Man one.","Man two."],towelWoman:["Woman one.","Woman two."]}};');
 put(resolve(root,'For-AI/VOICE-CAST.json'),cast);
 const read=path=>{const value=files.get(resolve(path));if(value===undefined)throw Error('Unexpected file read: '+path);return value;};
 const hash=path=>resolve(path)===resolve(root,'tools/build-knick-voice.py')?helper:digest(read(path));
 const context={root,resolve,sep,vm,readFileSync:read,hash,textHash:digest,json:path=>JSON.parse(read(path)),sameJson:(a,b)=>JSON.stringify(a)===JSON.stringify(b),requireMatch:(ok,why)=>{if(!ok)throw Error(why)},crowdPublicJobFields:columns,
  existsSync:path=>[...files.keys()].some(file=>file===resolve(path)||file.startsWith(resolve(path)+sep)),readdirSync:path=>[...files.keys()].filter(file=>file.startsWith(resolve(path)+sep)).map(file=>file.slice(resolve(path).length+1)),realpathSync:path=>resolve(path),lstatSync:()=>({isSymbolicLink:()=>false}),crowdPublicFields:(value,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]])),crowdPublicClip:()=>{throw Error('No clip projection expected in all-held fixture')},fixedRecordingsBlock:(cast,manifest)=>{assert.equal(manifest.clips.length,0);return 'const crowdRecordings=Object.freeze({});\n'}};
 vm.createContext(context);vm.runInContext(fragment,context);
 const jobs=[...context.sandaleSourceMap(cast,root).values()];
 const plan={family:'crowd-dialogue',sourceScope:'sandale-roles-v1',publicAssetFamily:'assets/voices/candidate-dialogue',privateReviewFamily:'GermanySimulator crowd dialogue review 2026-10-15',authoringHelperSha256:helper,requestedLineCount:8,jobs,sourceSha256:Object.fromEntries(['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'].map(path=>[path,hash(resolve(root,path))]))};
 const snapshot=()=>{const text=JSON.stringify(plan);return {text,sha256:digest(text)}};
 return {root,files,put,hash,context,cast,archetypes,plan,jobs,snapshot};
}
test('extract eight exact slots, two roles and four slots per voice',()=>{
 const f=fixture();assert.equal(f.jobs.length,8);assert.deepEqual([...new Set(f.jobs.map(row=>row.actorId))],['herr-sandale','frau-sandale']);
 assert.equal(f.jobs[0].sourceLocator,'game.js crowdArchetypes[id=towel-man].barks.berlin[0]');assert.equal(Object.keys(f.jobs[0]).length,14);
 const output=f.context.sandaleFullPlan(f.cast,f.snapshot(),f.root);assert.equal(output.authored.size,8);
 f.plan.jobs.reverse();assert.equal(f.context.sandaleFullPlan(f.cast,f.snapshot(),f.root).authored.keys().next().value,f.plan.jobs[0].clipId);
});
for(const [name,change] of Object.entries({missingScope:f=>delete f.plan.sourceScope,oldCrowdScope:f=>f.plan.sourceScope='remaining27-first-takes',wrongHelper:f=>f.plan.authoringHelperSha256='0'.repeat(64),partial:f=>f.plan.jobs.pop(),duplicate:f=>f.plan.jobs[1]=f.plan.jobs[0],actorBorrow:f=>f.plan.jobs[0]={...f.plan.jobs[0],actorId:'crowd-baerbel-brezel'},voiceBorrow:f=>f.plan.jobs[0]={...f.plan.jobs[0],voiceId:'crowd-baerbel-brezel'},textDrift:f=>f.plan.jobs[0]={...f.plan.jobs[0],text:'Changed'},subtitleDrift:f=>f.plan.jobs[0]={...f.plan.jobs[0],english:'Changed'},extraField:f=>f.plan.jobs[0]={...f.plan.jobs[0],archetypeId:'towel-man'},sourcePin:f=>f.plan.sourceSha256['game.js']='0'.repeat(64)}))test('reject request '+name,()=>{const f=fixture();change(f);assert.throws(()=>f.context.sandaleFullPlan(f.cast,f.snapshot(),f.root));});
test('role or archetype profile borrowing fails source extraction',()=>{const f=fixture();f.cast.roleProfiles[0].secretTunnelProfileId=f.cast.roleProfiles[1].secretTunnelProfileId;assert.throws(()=>f.context.sandaleSourceMap(f.cast,f.root));});
for(const [name,change] of Object.entries({extraArchetype:f=>f.archetypes.push({...f.archetypes[0],id:'extra'}),extraRegion:f=>f.archetypes[0].barks.extra=['one','two'],archetypeBorrow:f=>f.archetypes[0].voiceId=f.archetypes[1].voiceId,missingOwnership:f=>f.cast.roleProfiles[0].dialogueSources=[],referenceDrift:f=>f.cast.roleProfiles[0].reference.workingReferenceSha256='0'.repeat(64),licenseDrift:f=>f.cast.roleProfiles[0].reference.license='unknown',processingDrift:f=>f.cast.productionVoices[f.archetypes[0].voiceId].processing='new filter'}))test('reject source '+name,()=>{const f=fixture();change(f);f.put(resolve(f.root,'game.js'),'const crowdArchetypes=Object.freeze('+JSON.stringify(f.archetypes)+');\nconst crowdCharacterBarks=Object.freeze({});');assert.throws(()=>f.context.sandaleSourceMap(f.cast,f.root));});
function heldPreparation(){
 const f=fixture(),voice=f.jobs[0].voiceId,owned=f.jobs.filter(row=>row.voiceId===voice),manifest={sourceScope:'sandale-roles-v1',voiceId:voice,profileId:owned[0].profileId,requestedLineCount:4,generatedLineCount:0,lineCount:0,clips:[],heldPrivate:owned.map(row=>({...row,reason:'not rendered; selected production fallback'}))};
 const requestPath=resolve(f.root,'request.json');f.put(requestPath,f.plan);const requestSha256=f.hash(requestPath),authorityPath=resolve(f.root,'authority.json');
 const authority={status:'ROOT_SEALED_FINITE_SANDALE',executorThread:'01a13cd8-cbde-75b3-9876-7d75cbe6bef1',adapterSha256:'d'.repeat(64),protectedPublicPins:{'synthetic-public':'e'.repeat(64)},sourceScope:'sandale-roles-v1',helperSha256:helper,grantId:'synthetic-only',maximumCallsPerClip:1,automaticRetries:0,requestPath,requestSha256,selectedClipIds:[f.jobs[4].clipId],maximumNativeCalls:1,maximumAsrReadings:2,sourceSha256:f.plan.sourceSha256,musicRoot:resolve(f.root,'private-synthetic')};
 f.put(authorityPath,authority);const authorityProof={path:authorityPath,sha256:f.hash(authorityPath)},terminalProofs={};
 for(const phase of ['plan','render','process']){const path=resolve(f.root,phase+'.json');f.put(path,{phase,specificationSha256:authorityProof.sha256,logsComplete:true,authoredPlanSha256:requestSha256,producerSha256:authority.adapterSha256,ownedCleanupKills:[],postflightPinFailures:[],postflightProtectedPinsChecked:1,exitCode:0,rootRetired:true,timedOut:false,censusStatus:'COMPLETE',postflightQualified:true,survivingOwnedChildren:[],supervisorError:null});terminalProofs[phase]={path,sha256:f.hash(path)}}
 f.put(resolve(authority.musicRoot,f.plan.privateReviewFamily,voice,'requests.json'),{sourceScope:'sandale-roles-v1',requestedLineCount:4,jobs:owned,authoredPlanSha256:requestSha256,sourceSha256:f.plan.sourceSha256,authoredPlanSourceSha256:f.plan.sourceSha256});
 return {...f,manifest,authority,authorityProof,terminalProofs};
}
test('all-held own voice remains four explicit captions; other voice selection does not become reuse',()=>{
 const f=heldPreparation(),result=f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,null,f.root);
 assert.equal(result.clips.length,0);assert.equal(result.heldPrivate.length,4);assert.equal(result.generatedLineCount,0);assert.equal(result.approvedExistingReuse.length,0);
 assert.equal(result.sandaleAdmission.helperSha256,helper);assert.equal(f.context.sandaleRecordingsBlock(f.cast,[result],f.root,f.root),'const sandaleRecordings=Object.freeze({});\n');
});
for(const [name,change] of Object.entries({missingTerminal:f=>delete f.terminalProofs.process,partialSlots:f=>f.manifest.heldPrivate.pop(),duplicateSlot:f=>f.manifest.heldPrivate[1]=f.manifest.heldPrivate[0],falseGeneratedCount:f=>f.manifest.generatedLineCount=1,wrongHold:f=>f.manifest.heldPrivate[0].reason='technically verified; awaiting clip/hash-specific use selection',oldScope:f=>f.manifest.sourceScope='remaining27-first-takes'}))test('reject preparation '+name,()=>{const f=heldPreparation();change(f);assert.throws(()=>f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,null,f.root));});
test('recordings reject a manifest without new Sandale admission evidence',()=>{const f=heldPreparation();assert.throws(()=>f.context.sandaleRecordingsBlock(f.cast,[f.manifest],f.root,f.root));});
test('actual reused public projector preserves selected clip identity, cues and truthful pending listening',()=>{
 const f=fixture(),begin=copy.indexOf('function crowdPublicClip(clip){'),finish=copy.indexOf('function crowdPublicPlan(',begin);
 assert.ok(begin>=0&&finish>begin);vm.runInContext(copy.slice(begin,finish),f.context);
 const clip={...f.jobs[0],sha256:'c'.repeat(64),decode:{eosReached:true,maxSpeechTokens:250},synthesis:{languageId:'de'},wordCues:[{at:0,end:.1,charIndex:0,word:'Mann'}],approval:{status:'user-approved',scope:'whole-game-fixed-voice-cloning',date:'2026-10-16',instruction:'synthetic fixture only',clipId:f.jobs[0].clipId,encodedSha256:'c'.repeat(64)},listening:'pending',asrReadings:[{transcript:'private diagnostic retained elsewhere'}]};
 const projected=f.context.crowdPublicClip(clip);
 assert.equal(projected.listening,'pending');assert.equal(projected.clipId,clip.clipId);assert.equal(projected.sha256,clip.sha256);
 assert.equal(JSON.stringify(projected.wordCues),JSON.stringify(clip.wordCues));assert.equal(JSON.stringify(projected.approval),JSON.stringify(clip.approval));assert.equal(Object.hasOwn(projected,'asrReadings'),false);
});
test('allocated held slot cannot claim generation without its actual raw receipt',()=>{
 const f=heldPreparation();f.authority.selectedClipIds=[f.jobs[0].clipId];f.put(f.authorityProof.path,f.authority);f.authorityProof.sha256=f.hash(f.authorityProof.path);
 for(const ref of Object.values(f.terminalProofs)){const receipt=JSON.parse(f.files.get(resolve(ref.path)));receipt.specificationSha256=f.authorityProof.sha256;f.put(ref.path,receipt);ref.sha256=f.hash(ref.path)}
 f.manifest.generatedLineCount=1;f.manifest.heldPrivate[0].reason='held private; selected production fallback';
 assert.throws(()=>f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,null,f.root),/raw receipt\/media set/);
});
test('unallocated raw receipt cannot be hidden behind all-held accounting',()=>{const f=heldPreparation();f.put(resolve(f.authority.musicRoot,f.plan.privateReviewFamily,f.manifest.voiceId,'raw','unallocated.json'),{});assert.throws(()=>f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,null,f.root),/raw receipt\/media set/);});
test('CLI refuses orphaned Sandale recording, spread or ledger after manifest deletion',()=>{
 const begin=copy.indexOf(" const sandaleDirectory=resolve(root,'assets/voices/candidate-dialogue')"),finish=copy.indexOf(" const context={window:{},location:{search:'?voicePreview=1'},URLSearchParams};",begin),cli=copy.slice(begin,finish);
 assert.ok(begin>=0&&finish>begin);
 for(const source of ['const sandaleRecordings=Object.freeze({});\n',' ...sandaleRecordings,','const sandaleAdmissions=Object.freeze({"assets/voices/candidate-dialogue/deleted-sandale-manifest.json":"abc"});\n'])assert.throws(()=>vm.runInNewContext(cli,{root:resolve('synthetic'),resolve,readdirSync:()=>[],source,args:['--check'],sameJson:(a,b)=>JSON.stringify(a)===JSON.stringify(b),requireMatch:(ok,why)=>{if(!ok)throw Error(why)}}),/manifest\/ledger set/);
});
function loadRealTakeValidators(context){
 for(const [begin,end] of [
  ['export function matchesProduction(', 'export function writeArchiveMetadata('],
  ['export function editedDeliveryComplete(', 'function fixedAssetInventory('],
  ['export function spokenWords(', 'function streetAuthority('],
  ['function fixedTakeAuthority(', '// Police text is authored by game.js;'],
  ['function crowdExactCues(', 'function crowdDefaultClipAuthority('],
  ['function crowdPublicClip(', 'function crowdPublicPlan('],
  ['function policeEosTraceAuthority(', '// ROOT-only post-run collector:'],
  ['export function fixedRecordingsBlock(', 'const cityAuthoringHelperSha256='],
 ]){
  const start=copy.indexOf(begin),stop=copy.indexOf(end,start);assert.ok(start>=0&&stop>start,begin);
  vm.runInContext(copy.slice(start,stop).replaceAll('export function ','function '),context);
 }
}
function acceptedPreparation(){
 const f=heldPreparation();loadRealTakeValidators(f.context);
 const job=f.jobs[0],privateRoot=resolve(f.authority.musicRoot,f.plan.privateReviewFamily,job.voiceId),rawPath=resolve(privateRoot,'raw',job.clipId+'.json'),encodedPath=resolve(privateRoot,'encoded',job.clipId+'.json'),mp3Path=resolve(privateRoot,'encoded',job.clipId+'.mp3');
 f.authority.selectedClipIds=[job.clipId];f.authority.seeds={[job.clipId]:71000};f.authority.tokenCaps={[job.clipId]:250};f.authority.profileBindings={[job.voiceId]:{profileJsonSha256:'c'.repeat(64)}};f.authority.asrModelSha256='e'.repeat(64);
 f.put(f.authorityProof.path,f.authority);f.authorityProof.sha256=f.hash(f.authorityProof.path);
 for(const ref of Object.values(f.terminalProofs)){const terminal=JSON.parse(f.files.get(resolve(ref.path)));terminal.specificationSha256=f.authorityProof.sha256;f.put(ref.path,terminal);ref.sha256=f.hash(ref.path)}
 const trace={clipId:job.clipId,text:job.text,profileId:job.profileId,referenceSha256:job.referenceSha256,modelRevision:job.modelRevision,steps:[{step:1,completeBefore:false,completeAfter:false,nativeEosSuppressed:false,analyzerForcedEos:false,modelEosRestored:false,textPosition:0,textTokenCount:3,modelEosLogit:0,nativeEosLogit:0}]};
 const tracePath=resolve(privateRoot,'raw',job.clipId+'-eos-trace.json');f.put(tracePath,trace);f.put(resolve(privateRoot,'raw',job.clipId+'.wav'),'synthetic raw');f.put(mp3Path,'synthetic mp3');
 const raw={...job,requestSha256:f.hash(resolve(privateRoot,'requests.json')),authoringHelperSha256:helper,rendererInputText:job.text,rendererInputBasis:'exact authored source',synthesisAttempt:1,seed:71000,profileJsonSha256:'c'.repeat(64),rawSha256:f.hash(resolve(privateRoot,'raw',job.clipId+'.wav')),durationSeconds:1,listening:'pending',modelLicense:'MIT',referenceLicense:'CC0-1.0',decode:{eosReached:true,eosKind:'model-sampled',maxSpeechTokens:250,generatedSpeechTokens:3,attentionHooksBefore:0,attentionHooksAfter:0,temporaryAnalyzerHooksRemoved:0,modelEosRestoredSteps:0,eosSuppressionObservedSteps:0,alignmentFirstCompletedStep:null,eosPolicy:'Native analyzer unchanged; observation only',nativeAnalyzerSourceSha256:'f'.repeat(64),eosTraceSha256:f.hash(tracePath)},synthesis:{languageId:'de',device:'cuda',precision:'fp16',t3WeightPrecision:'float16',conditioningPrecision:'float32',referenceReconditionedForProfile:job.profileId,referenceConditioningVerifiedFloat32:true,inferenceMode:true,cpuThreads:2,exaggeration:.5,temperature:.65,repetitionPenalty:3,cfgWeight:.6}};
 f.put(rawPath,raw);
 const cues=[...job.text.matchAll(/[\p{L}\p{N}_]+/gu)].map((match,i)=>({word:match[0],charIndex:match.index,at:Number((i*.2).toFixed(3)),end:Number((i*.2+.1).toFixed(3))}));
 const encoded={...raw,sha256:f.hash(mp3Path),file:`assets/voices/candidate-dialogue/${job.clipId}.mp3`,bytes:13,sampleRateHz:48000,channels:1,bitrateBitsPerSecond:128000,integratedLufs:-18,truePeakDbtp:-2,asr:job.text,asrWordExact:true,asrLiteralWordExact:true,asrScriptPrompt:null,asrLanguageId:'de',asrComputeType:'int8',asrEffectiveComputeType:'int8',asrCpuThreads:1,asrDevice:'cpu',asrModelSha256:f.authority.asrModelSha256,asrBeamSize:1,wordCues:cues,asrReadings:[{beamSize:1,transcript:job.text,words:cues.map(cue=>({word:cue.word,start:cue.at,end:cue.end}))}]};
 f.put(encodedPath,encoded);f.put(resolve(f.root,encoded.file),'synthetic mp3');
 const selection={status:'user-approved',scope:'whole-game-fixed-voice-cloning',date:'2026-10-16',instruction:'synthetic fixture only, never a real selection',clips:[{clipId:job.clipId,encodedSha256:encoded.sha256}]},selectionPath=resolve(f.root,'selection.json');f.put(selectionPath,selection);
 const selectionProof={path:selectionPath,sha256:f.hash(selectionPath)},approval={status:selection.status,scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256};
 f.manifest.generatedLineCount=1;f.manifest.lineCount=1;f.manifest.clips=[{...encoded,approval}];f.manifest.heldPrivate=f.manifest.heldPrivate.slice(1);
 return {...f,selectionProof,encodedPath};
}
test('accepted preparation uses actual fixed/cue/EOS validators, projector and recordings builder',()=>{
 const f=acceptedPreparation(),result=f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,f.selectionProof,f.root);
 assert.equal(result.clips.length,1);assert.equal(result.heldPrivate.length,3);assert.equal(result.sandaleAdmission.selectionSha256,f.selectionProof.sha256);assert.equal(result.clips[0].listening,'pending');
 result.sandaleAdmission.jobs=result.sandaleAdmission.jobs.map(row=>Object.fromEntries(Object.entries(row).reverse()));
 const block=f.context.sandaleRecordingsBlock(f.cast,[result],f.root,f.root),runtime={};vm.runInNewContext(block+'globalThis.result=sandaleRecordings',runtime);
 const value=runtime.result['./'+result.clips[0].file];assert.equal(value.voiceId,f.manifest.voiceId);assert.equal(value.sha256,result.clips[0].sha256);assert.equal(value.wordCues.length,3);
});
test('accepted clips without independently pinned selection fail despite supplied approved object',()=>{const f=acceptedPreparation();assert.throws(()=>f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,null,f.root),/independent ROOT use selection/);});
test('selection hash or selected encoded bytes cannot drift',()=>{for(const kind of ['proof','bytes']){const f=acceptedPreparation();if(kind==='proof')f.selectionProof.sha256='0'.repeat(64);else f.manifest.clips[0].approval.encodedSha256='0'.repeat(64);assert.throws(()=>f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,f.selectionProof,f.root));}});
test('accepted final word timing mismatch fails actual cue binding',()=>{const f=acceptedPreparation(),encoded=JSON.parse(f.files.get(resolve(f.encodedPath)));encoded.asrReadings[0].words[0].start=.05;f.put(f.encodedPath,encoded);f.manifest.clips[0].asrReadings=encoded.asrReadings;assert.throws(()=>f.context.prepareSandaleManifest(f.cast,f.manifest,f.authorityProof,f.terminalProofs,f.selectionProof,f.root),/word timings/);});
