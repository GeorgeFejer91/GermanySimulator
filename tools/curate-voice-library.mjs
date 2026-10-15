import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {constants,copyFileSync,existsSync,lstatSync,mkdirSync,readdirSync,readFileSync,realpathSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// One cast authority, one derived runtime table, one private archive. No daemon.
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const json=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const requireMatch=(ok,why)=>{if(!ok)throw Error(why)};
export function crowdCandidateBlock(cast,manifests,sourceRoot=root){
 const game=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),catalogSource=readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8');
 requireMatch(game.includes('personalizedLines=surface==="sidewalk"&&archetype?crowdCharacterBarks[n.voiceId]?.[region]:null')&&game.includes('variantPool=personalizedLines?`pedestrian-personalized:${n.voiceId}:${region}:${surface}`:family')&&game.includes('family=archetype?`pedestrian:${archetype.id}:${region}:${surface}`:`pedestrian:${region}:${surface}`'),'Crowd personalized selection or shared arbitration family changed');
 const match=game.match(/const crowdCharacterBarks=(Object\.freeze\([\s\S]*?\));\nconst crowdArchetypeById/);requireMatch(match,'Missing actor-owned crowd German dialogue');
 const barks=vm.runInNewContext(match[1]),window={};vm.runInNewContext(catalogSource,{window});
 const subtitles=window.GermanySimulatorAudioText.pools.crowdPersonalized,roles=Object.fromEntries(cast.roleProfiles.map(row=>[row.gameRole,row]));
 const entries={},seen=new Set(),seenVoices=new Set();
 for(const manifest of manifests){
  const voice=manifest.voiceId,owner=roles[voice],binding=cast.productionVoices[voice];
  requireMatch(owner&&binding&&owner.voiceId===voice&&Object.hasOwn(barks,voice)&&!seenVoices.has(voice),'Crowd manifest voice has no unique actor-owned source/profile');seenVoices.add(voice);
  requireMatch(manifest.profileId===binding.profileId&&manifest.requestedLineCount===4&&Array.isArray(manifest.clips)&&Array.isArray(manifest.heldPrivate)&&Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=4&&manifest.lineCount===manifest.clips.length,'Unaccounted crowd dialogue requests');
  const expected=new Map();
  for(const region of ['berlin','germany'])for(let slot=0;slot<2;slot++){
   const clipId=`${voice}-${region}-${String(slot+1).padStart(2,'0')}`;
   expected.set(clipId,{clipId,voiceId:voice,actorId:voice,region,slot,sourceLocator:`game.js crowdCharacterBarks[${voice}].${region}[${slot}]`,text:barks[voice][region][slot],english:subtitles[voice][region][slot],profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null});
  }
  const records=[...manifest.clips,...manifest.heldPrivate],identities=records.map(row=>row.clipId);
  requireMatch(records.length===4&&new Set(identities).size===4&&identities.every(id=>expected.has(id))&&expected.size===4,'Crowd manifest must account for exactly four unique owned region slots');
  for(const row of records){
   const source=expected.get(row.clipId);
   requireMatch(source&&Object.entries(source).every(([field,value])=>row[field]===value),'Crowd accepted/held row ownership, profile, text, subtitle or slot differs from source');
  }
  requireMatch(manifest.heldPrivate.every(row=>typeof row.reason==='string'&&row.reason.length>0),'Crowd held row must retain its private hold reason');
  for(const clip of manifest.clips){
   const region=clip.region,slot=clip.slot;
   requireMatch(['berlin','germany'].includes(region)&&[0,1].includes(slot),'Invalid crowd region/slot');
   const expectedId=`${voice}-${region}-${String(slot+1).padStart(2,'0')}`,locator=`game.js crowdCharacterBarks[${voice}].${region}[${slot}]`;
   requireMatch(clip.clipId===expectedId&&clip.actorId===voice&&clip.voiceId===voice&&clip.text===barks[voice][region][slot]&&clip.english===subtitles[voice][region][slot]&&clip.sourceLocator===locator,'Crowd clip text, subtitle, actor or stable slot differs from source');
   requireMatch(matchesProduction(cast,clip)&&clip.referenceOriginalSha256===binding.originalSha256,'Crowd clip selected profile/reference changed');
   fixedTakeAuthority(cast,clip);
   requireMatch(clip.file===`assets/voices/candidate-dialogue/${expectedId}.mp3`&&hash(resolve(sourceRoot,clip.file))===clip.sha256,'Crowd candidate asset path or bytes changed');
   const key=voice+'\u0000'+clip.text;requireMatch(!seen.has(key),'Duplicate crowd candidate line');seen.add(key);entries[key]=clip.file;
  }
 }
 return 'const crowdCandidateDialogue=Object.freeze('+JSON.stringify(entries)+');\n';
}
// SOURCE FRAGMENT for the existing curator; not a second executable pipeline.
const crowdAuthoringHelperSha256='92fb925a7ebfa742d70c4a5b9ec3c9d8640a0d46b8f5c9c80bf1ed63f41546af';
const crowdAdmissionPattern=/const crowdAdmissions=Object\.freeze\((\{[^\n]*\})\);\n/;
const crowdAdmissions=source=>JSON.parse(source.match(crowdAdmissionPattern)?.[1]||'{}');
function crowdSourceMap(cast,sourceRoot=root){
 const source=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),window={};
 const match=source.match(/const crowdCharacterBarks=(Object\.freeze\([\s\S]*?\));\nconst crowdArchetypeById/);
 requireMatch(match,'Missing genuine crowd source map');
 const barks=vm.runInNewContext(match[1]);vm.runInNewContext(readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),{window});
 const roles=Object.fromEntries(cast.roleProfiles.map(row=>[row.gameRole,row])),rows=[];
 for(const [actorId,regions] of Object.entries(barks)){
  const owner=roles[actorId],binding=cast.productionVoices[actorId];
  requireMatch(owner?.voiceId===actorId&&owner.secretTunnelProfileId===binding?.profileId&&owner.runtimeArchetype!=='street-wisdom'&&owner.dialogueSources.some(line=>line.includes(`actor-owned crowdCharacterBarks[${actorId}]`)),'Crowd source owner/profile changed');
  for(const region of ['berlin','germany']){
   requireMatch(regions[region]?.length===2&&window.GermanySimulatorAudioText.pools.crowdPersonalized[actorId]?.[region]?.length===2,'Crowd requires exactly two owned source/English lines per region');
   for(let slot=0;slot<2;slot++){
   const text=regions[region]?.[slot],english=window.GermanySimulatorAudioText.pools.crowdPersonalized[actorId]?.[region]?.[slot];
   requireMatch(typeof text==='string'&&text.trim()&&typeof english==='string'&&english.trim(),'Missing crowd source/English slot');
   const clipId=`${actorId}-${region}-${String(slot+1).padStart(2,'0')}`;
   rows.push({clipId,voiceId:actorId,actorId,region,slot,sourceLocator:`game.js crowdCharacterBarks[${actorId}].${region}[${slot}]`,text,english,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null});
   }
  }
 }
 requireMatch(rows.length===36&&new Set(rows.map(row=>row.clipId)).size===36,'Crowd native full36 source count changed');
 return new Map(rows.map(row=>[row.clipId,row]));
}
function crowdFullPlan(cast,snapshot,sourceRoot=root){
 requireMatch(typeof snapshot?.text==='string'&&snapshot.sha256===textHash(snapshot.text),'Crowd full36 request bytes changed');
 const plan=JSON.parse(snapshot.text),authored=crowdSourceMap(cast,sourceRoot);
 requireMatch(plan.family==='crowd-dialogue'&&plan.publicAssetFamily==='assets/voices/candidate-dialogue'&&plan.privateReviewFamily==='GermanySimulator crowd dialogue review 2026-10-15'&&plan.requestedLineCount===36&&plan.jobs?.length===36&&new Set(plan.jobs.map(row=>row.clipId)).size===36,'Not the genuine complete crowd request');
 for(const row of plan.jobs){const source=authored.get(row.clipId);requireMatch(source&&Object.keys(row).length===Object.keys(source).length&&Object.entries(source).every(([key,value])=>sameJson(row[key],value)),'Crowd full36 text/English/owner/selected profile drift');}
 return {plan,authored};
}
function crowdExactCues(clip){
 // Same caption geometry rules as cityClipAuthority; no city proof/alias changes.
 const words=[...clip.text.matchAll(/[\p{L}\p{N}_]+/gu)];let end=0,index=-1;
 requireMatch(Array.isArray(clip.wordCues)&&words.length>0&&clip.wordCues.length===words.length&&clip.wordCues.every((cue,i)=>{const valid=Object.keys(cue).length===4&&cue.word===words[i][0]&&cue.charIndex===words[i].index&&Number.isFinite(cue.at)&&Number.isFinite(cue.end)&&cue.at>=end&&cue.end>cue.at&&cue.end<=clip.durationSeconds+.05&&cue.charIndex>index;end=cue.end;index=cue.charIndex;return valid;}),'Incomplete crowd exact final-caption cues');
}
function crowdDefaultClipAuthority(cast,clip,proof,requestSha256){
 fixedTakeAuthority(cast,clip);crowdExactCues(clip);
 requireMatch(clip.file===`assets/voices/candidate-dialogue/${clip.clipId}.mp3`,'Crowd public file must be its canonical relative asset path');
 requireMatch(clip.authoringHelperSha256===crowdAuthoringHelperSha256&&clip.requestSha256===requestSha256&&clip.rendererInputText===clip.text&&clip.rendererInputBasis==='exact authored source'&&clip.synthesisAttempt===1&&clip.seed===71000,'Crowd clip is not the named current-generation first take');
 requireMatch(!['rescueParts','deliveryEditing','benchmarkOnly','recognitionVerification','actualInferenceText','nativeCompletion','exceptionAuthority','joinRetakeAuthority'].some(key=>key in clip),'Unsupported crowd edited/substituted take');
 const synth=clip.synthesis,decode=clip.decode,approval=clip.approval;
 requireMatch(synth?.languageId==='de'&&synth.device==='cuda'&&synth.precision==='fp16'&&synth.t3WeightPrecision==='float16'&&synth.conditioningPrecision==='float32'&&synth.referenceReconditionedForProfile===clip.profileId&&synth.referenceConditioningVerifiedFloat32===true&&synth.inferenceMode===true&&synth.cpuThreads===2&&synth.exaggeration===.5&&synth.temperature===.65&&synth.repetitionPenalty===3&&synth.cfgWeight===.6,'Crowd native conditioning/recipe drift');
 requireMatch(decode?.eosReached===true&&decode.attentionHooksBefore===0&&decode.attentionHooksAfter===0&&Number.isInteger(decode.generatedSpeechTokens)&&decode.generatedSpeechTokens>0&&decode.generatedSpeechTokens<=decode.maxSpeechTokens&&decode.maxSpeechTokens===proof.maxSpeechTokens&&!decode.modelEosRestoredSteps,'Crowd native EOS/token/hook proof missing');
 requireMatch(clip.asrLiteralWordExact===true&&clip.asrDevice==='cpu'&&clip.asrCpuThreads===1&&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&clip.asrModelSha256===proof.asrModelSha256&&clip.asrBeamSize===proof.asrBeamSize&&Number.isInteger(proof.asrReadings)&&proof.asrReadings>=1&&proof.asrReadings<=2&&clip.sampleRateHz===48000&&clip.channels===1&&clip.bitrateBitsPerSecond===128000&&Number.isInteger(clip.bytes)&&clip.bytes>0&&Number.isFinite(clip.durationSeconds)&&clip.durationSeconds>0&&clip.referenceLicense==='CC0-1.0'&&clip.modelLicense==='MIT','Crowd final native encoding/ASR/license missing');
 requireMatch(clip.listening==='pending'&&!clip.listeningConfirmed&&!clip.listeningVerified&&!approval?.listeningConfirmed&&!approval?.listeningVerified,'Crowd human listening is not supplied');
 requireMatch(sameJson(Object.keys(approval||{}).sort(),['clipId','date','encodedSha256','instruction','scope','status'])&&approval.status==='user-approved'&&approval.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(approval.date)&&approval.instruction?.trim()&&approval.clipId===clip.clipId&&approval.encodedSha256===clip.sha256,'Missing clip/hash-specific crowd use selection');
 for(const key of ['rawReceiptSha256','encodedReceiptSha256','rawSha256','encodedSha256','profileJsonSha256'])requireMatch(/^[a-f0-9]{64}$/.test(proof?.[key]),'Missing ROOT-verified private crowd byte proof');
 requireMatch(proof.rawSha256===clip.rawSha256&&proof.encodedSha256===clip.sha256&&proof.profileJsonSha256===clip.profileJsonSha256,'Crowd private/public byte lineage drift');
}
const crowdPublicJobFields=['clipId','voiceId','actorId','region','slot','sourceLocator','text','english','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','processing'];
const crowdPublicFields=(value,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]]));
function crowdPublicClip(clip){
 const row=crowdPublicFields(clip,[...crowdPublicJobFields,'seed','synthesisAttempt','authoringHelperSha256','rendererInputText','rendererInputBasis','requestSha256','profileJsonSha256','rawSha256','modelLicense','referenceLicense','durationSeconds','renderSeconds','processingSha256','integratedLufs','truePeakDbtp','asr','asrWordExact','asrLiteralWordExact','asrNormalization','asrModelSha256','asrLanguageId','asrComputeType','asrEffectiveComputeType','asrCpuThreads','asrDevice','asrScriptPrompt','asrBeamSize','file','sha256','bytes','sampleRateHz','channels','bitrateBitsPerSecond']);
 row.decode=crowdPublicFields(clip.decode,['maxSpeechTokens','attentionHooksBefore','generatedSpeechTokens','eosReached','t3InferenceSeconds','temporaryAnalyzerHooksRemoved','attentionHooksAfter']);
 row.synthesis=crowdPublicFields(clip.synthesis,['exaggeration','temperature','repetitionPenalty','cfgWeight','languageId','device','precision','t3WeightPrecision','conditioningPrecision','autocastPrecision','conditioningCached','referenceReconditionedForProfile','referenceConditioningVerifiedFloat32','modelSessionReused','cpuThreads','inferenceMode']);
 row.wordCues=clip.wordCues.map(cue=>crowdPublicFields(cue,['at','end','charIndex','word']));
 row.approval=crowdPublicFields(clip.approval,['status','scope','date','instruction','clipId','encodedSha256']);
 row.listening='pending';row.status='eligible exact-text recording; human listening pending';
 return row;
}
function crowdPublicPlan(cast,proof,sourceRoot=root){
 requireMatch(/^[a-f0-9]{64}$/.test(proof?.nativeSha256)&&sameJson(Object.keys(proof.sourceSha256||{}).sort(),['For-AI/AUDIO-TEXT-LIBRARY.js','For-AI/VOICE-CAST.json','game.js'])&&Object.values(proof.sourceSha256).every(value=>/^[a-f0-9]{64}$/.test(value)),'Invalid public crowd native-plan digest/source pins');
 const authored=crowdSourceMap(cast,sourceRoot);
 requireMatch(proof.jobs?.length===36&&new Set(proof.jobs.map(row=>row.clipId)).size===36,'Incomplete public crowd source slots');
 for(const row of proof.jobs){const source=authored.get(row.clipId);requireMatch(source&&Object.keys(row).length===crowdPublicJobFields.length&&Object.entries(source).every(([key,value])=>sameJson(row[key],value)),'Public crowd source/English/selected binding drift');}
 return {authored};
}
// Read and validate actual native receipts only when ROOT supplies real outcomes.
// Return public-safe hashes; private ASR reading payloads are never copied here.
export function prepareCrowdDefaultManifest(cast,manifest,authorityProof,sourceRoot=root){
 crowdCandidateBlock(cast,[],sourceRoot); // Existing caller/selection authority, without reading candidate assets.
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Crowd ROOT authority bytes changed');
 const authority=json(authorityProof.path);
 requireMatch(authority.status==='ROOT_SEALED_FINITE_CROWD9'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.grantId&&/^[a-f0-9]{40}$/.test(authority.sourceCommit)&&authority.helperSha256===crowdAuthoringHelperSha256&&authority.maximumNativeCalls===9&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===18&&authority.automaticRetries===0,'Not the reviewed finite crowd generation authority');
 requireMatch(hash(authority.requestPath)===authority.requestSha256,'Genuine crowd full36 request changed');
 const fullPlan={text:readFileSync(authority.requestPath,'utf8'),sha256:authority.requestSha256},{plan,authored}=crowdFullPlan(cast,fullPlan,sourceRoot);
 requireMatch(sameJson(plan.sourceSha256,authority.sourceSha256),'Crowd full36 plan differs from sealed generation source pins');
 const voice=manifest.voiceId,owned=plan.jobs.filter(row=>row.voiceId===voice),family=resolve(authority.musicRoot,plan.privateReviewFamily);
 requireMatch(owned.length===4&&manifest.profileId===cast.productionVoices[voice]?.profileId&&realpathSync(family)===family,'Crowd private family/voice alias or owner drift');
 const privateFile=relative=>{const file=resolve(family,voice,relative);requireMatch(realpathSync(file)===file&&file.startsWith(family+sep)&&!lstatSync(file).isSymbolicLink(),'Crowd private receipt/media alias');return file;};
 const requestPath=privateFile('requests.json'),requestSha256=hash(requestPath),request=json(requestPath);
 requireMatch(request.requestedLineCount===4&&sameJson(request.jobs,owned)&&request.authoredPlanSha256===authority.requestSha256&&sameJson(request.sourceSha256,plan.sourceSha256)&&sameJson(request.authoredPlanSourceSha256,plan.sourceSha256),'Crowd native four-slot plan differs from genuine full36 source');
 const takes={};
 for(const clip of manifest.clips){
  const job=authored.get(clip.clipId);requireMatch(job&&Object.hasOwn(authority.tokenCaps,clip.clipId)&&job.region==='germany'&&job.slot===0&&Object.entries(job).every(([key,value])=>sameJson(clip[key],value)),'Clip outside actual first9 owned source');
  const rawPath=privateFile(`raw/${clip.clipId}.json`),encodedPath=privateFile(`encoded/${clip.clipId}.json`),raw=json(rawPath),encoded=json(encodedPath);
  for(const [key,value] of Object.entries(job))requireMatch(sameJson(raw[key],value)&&sameJson(encoded[key],value),'Actual crowd receipt source/owner/profile drift');
  for(const [key,value] of Object.entries(raw))if(!['durationSeconds','status'].includes(key))requireMatch(sameJson(encoded[key],value),'Crowd raw/encoded lineage drift: '+key);
  for(const [key,value] of Object.entries(encoded))if(key!=='asrReadings'||clip[key]!==undefined)requireMatch(sameJson(clip[key],value),'Crowd public clip changed an actual encoded receipt field: '+key);
  requireMatch(raw.requestSha256===requestSha256&&raw.profileJsonSha256===authority.profileBindings[voice]?.profileJsonSha256&&raw.decode?.maxSpeechTokens===authority.tokenCaps[clip.clipId]&&encoded.asrModelSha256===authority.asrModelSha256&&encoded.asrReadings?.length>=1&&encoded.asrReadings.length<=2&&sameJson(encoded.asrReadings.map(row=>row.beamSize),encoded.asrReadings.length===1?[1]:[1,5])&&encoded.asrReadings.at(-1).transcript===encoded.asr,'Crowd actual private decoder/ASR evidence changed');
  requireMatch(hash(privateFile(`raw/${clip.clipId}.wav`))===raw.rawSha256&&hash(privateFile(`encoded/${clip.clipId}.mp3`))===encoded.sha256&&readFileSync(privateFile(`encoded/${clip.clipId}.mp3`)).length===encoded.bytes,'Crowd actual private audio bytes changed');
  const proof={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:raw.rawSha256,encodedSha256:encoded.sha256,profileJsonSha256:raw.profileJsonSha256,maxSpeechTokens:raw.decode.maxSpeechTokens,asrModelSha256:encoded.asrModelSha256,asrBeamSize:encoded.asrBeamSize,asrReadings:encoded.asrReadings.length};
  crowdDefaultClipAuthority(cast,clip,proof,requestSha256);takes[clip.clipId]=proof;
 }
 const records=[...manifest.clips,...manifest.heldPrivate],ids=records.map(row=>row.clipId);
 requireMatch(manifest.requestedLineCount===4&&manifest.clips.length===1&&manifest.lineCount===1&&records.length===4&&new Set(ids).size===4&&manifest.generatedLineCount===1,'Actual successful first9 manifest accounting changed');
 for(const row of records){const job=owned.find(job=>job.clipId===row.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value)),'Crowd manifest slot changed from full36 source');}
 requireMatch(manifest.heldPrivate.every(row=>row.region!=='germany'||row.slot!==0)&&manifest.heldPrivate.every(row=>row.reason==='not rendered; selected production fallback'&&(!row.failedGates||row.failedGates.length===0)),'Unrendered crowd slots must remain pending, not failed recordings');
 // Explicit public contract: no structured clone of private manifests/receipts.
 // Native request bytes keep their own digest; the public source projection is
 // not represented as byte-identical to that original private request file.
 const publicPlan={nativeSha256:fullPlan.sha256,sourceSha256:crowdPublicFields(plan.sourceSha256,['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js']),jobs:plan.jobs.map(job=>crowdPublicFields(job,crowdPublicJobFields))};
 const result={schemaVersion:1,voiceId:voice,profileId:manifest.profileId,fallback:cast.productionVoices[voice].fallback??'captions',status:'same-profile technical and independent ASR audit; perceptual listening not independently verified',requestedLineCount:4,generatedLineCount:1,lineCount:1,clips:manifest.clips.map(crowdPublicClip),heldPrivate:manifest.heldPrivate.map(row=>({...crowdPublicFields(row,crowdPublicJobFields),reason:'not rendered; selected production fallback'})),approvedExistingReuse:[]};
 result.crowdAdmission={status:'ROOT-verified-current-generation',authoritySha256:authorityProof.sha256,adapterSha256:authority.adapterSha256,helperSha256:crowdAuthoringHelperSha256,fullPlan:publicPlan,requestSha256,takes};
 return result;
}
export function crowdRecordingsBlock(cast,manifests,assetRoot=root,sourceRoot=root,mouthRows=null){
 // Existing validator retains all four unique source slots and selected binding.
 crowdCandidateBlock(cast,manifests,sourceRoot);
 const clips=[];
 for(const manifest of manifests){
  const selected=manifest.clips.filter(clip=>clip.approval?.status==='user-approved');if(!selected.length)continue;
  const admission=manifest.crowdAdmission;
  requireMatch(admission?.status==='ROOT-verified-current-generation'&&admission.helperSha256===crowdAuthoringHelperSha256&&/^[a-f0-9]{64}$/.test(admission.authoritySha256)&&/^[a-f0-9]{64}$/.test(admission.adapterSha256),'Missing current-generation crowd admission');
  const {authored}=crowdPublicPlan(cast,admission.fullPlan,sourceRoot);
  requireMatch(Object.keys(admission.takes).length===selected.length,'Crowd admitted take coverage changed');
  for(const clip of selected){const job=authored.get(clip.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(clip[key],value)),'Default crowd source/English/owner drift');crowdDefaultClipAuthority(cast,clip,admission.takes[clip.clipId],admission.requestSha256);clips.push({...clip,...(mouthRows?.[clip.clipId]?{mouthHz:40,mouthEnergy:mouthRows[clip.clipId].mouthEnergy}:{}),provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});}
 }
 return fixedRecordingsBlock(cast,{clips},'crowd-dialogue',assetRoot);
}

const originalFile=path=>{const names=readdirSync(path).filter(name=>/^original\.[a-z0-9]+$/i.test(name));requireMatch(names.length===1,'Missing/ambiguous original audio');return resolve(path,names[0])};
export function matchesProduction(cast,clip,requireReceipt=true){
 const selected=cast.productionVoices[clip.voiceId];
 const exception=cast.productionExceptions.find(p=>p.voiceId===clip.voiceId&&p.clipId===(clip.clipId||clip.id));
 const binding=exception||selected;
 const reference=binding&&(clip.referenceHashKind==='uploaded-original'?binding.originalSha256:binding.referenceSha256);
 return !binding?!requireReceipt:clip.profileId===binding.profileId&&
  ((!requireReceipt&&!clip.renderer)||clip.renderer===binding.renderer)&&
  ((!requireReceipt&&!clip.modelRevision)||clip.modelRevision===binding.modelRevision)&&
  ((!requireReceipt&&!clip.referenceSha256)||clip.referenceSha256===reference)&&
  (!clip.referenceOriginalSha256||clip.referenceOriginalSha256===binding.originalSha256)&&
  ((!requireReceipt&&!clip.processing)||(clip.processing??'')===(binding.processing??''));
}
export function writeArchiveMetadata(archive,relative,contents){
 const base=realpathSync(archive),target=resolve(base,relative);requireMatch(target.startsWith(base+sep),'Archive metadata escapes archive');
 mkdirSync(dirname(target),{recursive:true});requireMatch(realpathSync(dirname(target)).startsWith(base+sep)||realpathSync(dirname(target))===base,'Archive metadata directory is linked outside archive');
 if(existsSync(target)){const stat=lstatSync(target);requireMatch(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&realpathSync(target).startsWith(base+sep),'Archive metadata file is linked outside archive');}
 writeFileSync(target,contents);
}
function request(exe,operation,input={}){
 const result=spawnSync(exe,['--voice-cli'],{input:JSON.stringify({operation,input}),encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:8*1024*1024});
 requireMatch(!result.error&&result.status===0,`Voice Cloner ${operation} failed: ${result.error||result.stderr.slice(-300)}`);
 const response=JSON.parse(result.stdout);requireMatch(response.ok,`Voice Cloner ${operation}: ${JSON.stringify(response.error)}`);return response.result;
}
export function verifyProfiles(cast,profiles,data){
 const byId=new Map(profiles.map(p=>[p.id,p]));requireMatch(byId.size===profiles.length,'Duplicate live profile UUID');
 const bindings=[...Object.values(cast.productionVoices),...cast.productionExceptions];
 for(const binding of bindings){
  const profile=byId.get(binding.profileId);requireMatch(profile,`Missing production profile ${binding.profileId}`);
  for(const [key,value] of Object.entries({name:binding.profileName,original_sha256:binding.originalSha256,reference_sha256:binding.referenceSha256,saved:true}))requireMatch(profile[key]===value,`Profile drift ${binding.profileId}: ${key}`);
  if(data){const path=realpathSync(resolve(data,'profiles',binding.profileId));requireMatch(path.startsWith(realpathSync(data)+sep),`Profile escapes data root: ${binding.profileId}`);
   requireMatch(hash(originalFile(path))===binding.originalSha256&&hash(resolve(path,'reference.wav'))===binding.referenceSha256,`Reference audio drift ${binding.profileId}`);}
 }
 return bindings.length;
}
export function archiveFiles(source,destination){
 requireMatch(!existsSync(destination)||!lstatSync(destination).isSymbolicLink(),'Archive destination is linked');
 mkdirSync(destination,{recursive:true});
 const archiveBase=realpathSync(destination),liveBase=realpathSync(source);
 requireMatch(archiveBase!==liveBase&&!archiveBase.startsWith(liveBase+sep)&&!liveBase.startsWith(archiveBase+sep),'Archive aliases live profile data');
 const files=[];
 function walk(base,relative=''){
  for(const entry of readdirSync(base,{withFileTypes:true})){
   requireMatch(!entry.isSymbolicLink(),`Archive refuses linked file: ${entry.name}`);
   const name=relative?relative+'/'+entry.name:entry.name,path=resolve(base,entry.name);
   if(entry.isDirectory())walk(path,name);else{requireMatch(entry.isFile(),`Archive refuses non-file: ${name}`);files.push({path:name,sha256:hash(path)});}
  }
 }
 walk(source);
 for(const file of files){const from=resolve(source,file.path),to=resolve(destination,file.path);mkdirSync(dirname(to),{recursive:true});requireMatch(realpathSync(dirname(to)).startsWith(archiveBase+sep)||realpathSync(dirname(to))===archiveBase,'Linked archive directory');if(existsSync(to))requireMatch(!lstatSync(to).isSymbolicLink()&&realpathSync(to).startsWith(archiveBase+sep),'Linked archive file');else copyFileSync(from,to);requireMatch(hash(to)===file.sha256,`Archive mismatch: ${file.path}`);}
 return files;
}
export function cityDialogueTable(cast){
 const people=cast.characters.filter(person=>person.gameCharacterId?.startsWith('city-'));
 requireMatch(people.length===19&&new Set(people.map(person=>person.gameCharacterId)).size===19&&new Set(people.map(person=>person.voiceId)).size===19,'Expected nineteen distinct city dialogue owners');
 return Object.fromEntries(people.map(person=>{
  requireMatch(person.voiceId==='stadt-'+person.gameCharacterId.slice(5),'Wrong city actor/voice binding: '+person.gameCharacterId);
  requireMatch(cast.productionVoices[person.voiceId]&&person.dialogue.length===4,'Missing city voice or four owned lines: '+person.gameCharacterId);
  const owned={voiceId:person.voiceId},spoken=new Map();
  for(const region of ['germany','berlin']){
   owned[region]=[0,1].map(slot=>{
    const rows=person.dialogue.filter(row=>row.region===region&&row.slot===slot);
    requireMatch(rows.length===1,'Missing/duplicate city region slot: '+person.gameCharacterId+' '+region+' '+slot);
    const row=rows[0],locator='For-AI/VOICE-CAST.json characters[gameCharacterId='+person.gameCharacterId+'].dialogue[region='+region+',slot='+slot+']';
    requireMatch(typeof row.text==='string'&&row.text.trim()&&typeof row.english==='string'&&row.english.trim()&&row.locator===locator,'Invalid city source/English/locator: '+locator);
    requireMatch(!spoken.has(row.text)||spoken.get(row.text)===row.english,'Conflicting city English for same voice/source: '+person.voiceId);spoken.set(row.text,row.english);
    return{id:person.voiceId+'-'+String((region==='berlin'?2:0)+slot+1).padStart(2,'0'),text:row.text,english:row.english};
   });
  }
  return[person.gameCharacterId,owned];
 }));
}
export function runtimeBlock(cast){
 return '// Generated by tools/curate-voice-library.mjs --sync from VOICE-CAST.json.\n'+
  'const productionVoices=Object.freeze('+JSON.stringify(Object.fromEntries(Object.entries(cast.productionVoices).map(([id,p])=>[id,{profileId:p.profileId,profileName:p.profileName,originalSha256:p.originalSha256,referenceSha256:p.referenceSha256,renderer:p.renderer,modelRevision:p.modelRevision,processing:p.processing??null,...(p.fallback?{fallback:p.fallback}:{})}])))+');\n'+
  'const productionExceptions=Object.freeze('+JSON.stringify(Object.fromEntries(cast.productionExceptions.map(p=>[p.clipId,{voiceId:p.voiceId,profileId:p.profileId,originalSha256:p.originalSha256,referenceSha256:p.referenceSha256,renderer:p.renderer,modelRevision:p.modelRevision,processing:p.processing??null}])) )+');\n'+
  'const neighborVoices=Object.freeze('+JSON.stringify(Object.fromEntries(cast.existingAssetProfiles.filter(p=>p.gameRole==='jwd-neighbor').map(p=>[p.voiceId,{name:p.fullName,gameCharacterId:p.gameCharacterId,gender:p.gender,fallback:p.fallback,status:p.status}])))+');\n'+
  'const cityDialogue=Object.freeze('+JSON.stringify(cityDialogueTable(cast))+');\n'+
  'function productionClip(clip){const exception=productionExceptions[clip.id],binding=exception?.voiceId===clip.voiceId?exception:productionVoices[clip.voiceId];if(!binding)return !clip.fixedProduction;if(clip.profileId!==binding.profileId)return false;const expected={renderer:binding.renderer,modelRevision:binding.modelRevision,referenceSha256:clip.referenceHashKind==="uploaded-original"?binding.originalSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,processing:binding.processing??null};return Object.entries(expected).every(([key,value])=>(!clip.fixedProduction&&clip[key]===undefined)||clip[key]===value)}\n';
}
export const neighborSpokenWords=text=>text.normalize('NFKC')
 .toLocaleLowerCase('de')
 .replace(/(?<!\p{L})(sie|du|er|haben|ich|man|meinen|sag|sehen|wir|gibt)[’']s(?!\p{L})/gu,'$1 es')
 .replace(/people\s*(?:&|and)\s*culture/g,'people and culture')
 .replace(/(?<!\p{L})(?:maslos|maßlos)(?!\p{L})/gu,'maaslos')
 .replace(/(?<!\p{L})(daß|muß|bißchen)(?!\p{L})/gu,word=>({daß:'dass',muß:'muss',bißchen:'bisschen'})[word])
 .replace(/(?<!\p{L})feedback[-‐‑–—]gespräch(?!\p{L})/gu,'feedbackgespräch')
 .replace(/[-‐‑–—]/g,' ')
 .replace(/[^\p{L}\p{N}]+/gu,' ')
 .trim().replace(/\s+/g,' ')
 .replace(/\bso was\b/g,'sowas')
 .replace(/\bnoch mal\b/g,'nochmal')
 .replace(/\bkennen zu lernen\b/g,'kennenzulernen')
 .replace(/nachbarschafts offside\b/g,'nachbarschafts offsite')
 .replace(/\b\d+\b/g,number=>Number(number)<100?spokenWords(number):number);

export function validNeighborAsrInputTransform(clip,person){
 const transform=clip.asrInputTransform;
 if(transform===undefined)return clip.asrUnframedTranscript===undefined;
 const reviewedSources={
  'jwd-heiko-maaslos':{'heiko-story-21':20,'heiko-story-33':32},
  'jwd-theodore-maaslos':{'theodore-story-01':0}
 };
 const sourceIndex=reviewedSources[clip.voiceId]?.[clip.clipId];
 if(!transform||!Number.isInteger(sourceIndex)||person.dialogue[sourceIndex]?.text!==clip.text)return false;
 const textSha=createHash('sha256').update(clip.text).digest('hex');
 const hashes=['sourceMp3Sha256','decodedPcmSha256','paddedPcmSha256','asrInputWavSha256','asrReceiptSha256','asrModelSha256','asrBinarySha256','priorAsrReceiptSha256','priorAsrInputWavSha256'];
 return transform.kind==='leading-zero-silence-v1'&&transform.seconds===1&&
  transform.sampleRate===16000&&transform.channels===1&&transform.bitsPerSample===16&&
  Number.isInteger(transform.originalSampleCount)&&transform.originalSampleCount>0&&
  transform.prefixSampleCount===16000&&transform.paddedSampleCount===transform.originalSampleCount+16000&&
  Math.abs(transform.originalSampleCount-clip.durationSeconds*16000)<=1&&
  transform.sourceMp3Sha256===clip.sha256&&clip.sourceSha256===textSha&&
  hashes.every(key=>typeof transform[key]==='string'&&/^[a-f0-9]{64}$/.test(transform[key]))&&
  transform.decodedPcmSha256!==transform.paddedPcmSha256&&
  transform.asrModelSha256===clip.asrModelSha256&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null&&
  transform.speechSamplesUnmodified===true&&transform.zeroPrefixVerified===true&&transform.priorAsrWordExact===false&&
  typeof clip.asrUnframedTranscript==='string'&&clip.asrUnframedTranscript.trim().length>0&&
  neighborSpokenWords(clip.asrUnframedTranscript)!==neighborSpokenWords(clip.text);
}
export function neighborRecordingsBlock(cast,manifests,assetRoot=root){
 const entries={},bindings=[],bindingIndices=new Map(),seen=new Set();
 for(const manifest of manifests){
  const person=cast.existingAssetProfiles.find(p=>p.voiceId===manifest.voiceId&&p.gameRole==='jwd-neighbor');
  requireMatch(person&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,'Unaccounted neighbor lines');
  for(const clip of manifest.clips){
   requireMatch(matchesProduction(cast,clip)&&clip.renderer==='omnivoice-rs','Wrong fixed neighbor production receipt');
   requireMatch(person.gameCharacterId===clip.actorId&&person.dialogue.some(line=>line.text===clip.text&&line.english===clip.english),`Wrong neighbor source/speaker: ${clip.clipId}`);
   requireMatch(validNeighborAsrInputTransform(clip,person),'Unverified neighbor ASR input transform');
   if(['actualInferenceText','actualInferenceSha256','canonicalSourceSha256','renderNormalizationPolicy'].some(key=>clip[key]!==undefined)){
    const expanded=clip.text.replace(/(?<!\p{L})(sie|du|er|haben|ich|man|meinen|sag|sehen|wir|gibt)[’']s(?!\p{L})/giu,(_,base)=>base+' es');
    const textHash=text=>createHash('sha256').update(text).digest('hex');
    requireMatch(clip.voiceId==='jwd-heiko-maaslos'&&clip.renderNormalizationPolicy==='finite-authored-apostrophe-contractions-v1'&&expanded!==clip.text&&clip.actualInferenceText===expanded&&clip.canonicalSourceSha256===textHash(clip.text)&&clip.actualInferenceSha256===textHash(expanded)&&neighborSpokenWords(expanded)===neighborSpokenWords(clip.text),'Unverified neighbor render input');
   }
   const exact=typeof clip.asr==='string'&&neighborSpokenWords(clip.asr)===neighborSpokenWords(clip.text);
   const dialectAdvisory=clip.voiceId==='jwd-frau-schwabingen'&&cast.productionVoices[clip.voiceId]?.asrPolicy==='dialect-advisory'&&clip.asrVerificationMode==='dialect-advisory';
   requireMatch(clip.nativeCompletion?.completed===true&&clip.asrWordExact===exact&&clip.asrScriptPrompt===null&&/^[a-f0-9]{64}$/.test(clip.asrModelSha256)&&typeof clip.asr==='string'&&clip.asr.trim().length>0&&(exact||dialectAdvisory),'Missing independent final-encoding neighbor ASR or authorized dialect-advisory receipt');
   requireMatch(Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5&&clip.approval?.status==='user-approved','Unverified neighbor take');
   requireMatch(clip.file===`assets/voices/neighbors/${clip.clipId}.mp3`&&hash(resolve(assetRoot,clip.file))===clip.sha256,'Neighbor audio hash/path drift');
   requireMatch(clip.mouthHz===40&&clip.mouthEnergy.length===Math.ceil(clip.durationSeconds*40)&&clip.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255),'Invalid encoded-media mouth cue');
   const key=clip.voiceId+'\0'+clip.text;requireMatch(!seen.has(key),'Duplicate neighbor recording');seen.add(key);
   const {clipId,voiceId,actorId,profileId,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,sha256,mouthHz,mouthEnergy}=clip;
   const receipt={profileId,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,trigger:'jwd-neighbor-exact-dialogue',approval:clip.approval,provenanceManifest:manifest.provenanceManifest},receiptKey=JSON.stringify(receipt);
   if(!bindingIndices.has(receiptKey)){bindingIndices.set(receiptKey,bindings.length);bindings.push(receipt)}
   entries['./'+clip.file]={binding:bindingIndices.get(receiptKey),id:clipId,voiceId,actorId,sha256,mouthHz,mouthEnergy,fixedProduction:true,source:clip.text,english:clip.english,durationMs:Math.round(clip.durationSeconds*1000)};
  }
 }
 // Snapshot the verified manifest receipts once; do not inherit the current
 // production binding, which must still reject a stale recording.
 return 'const neighborRecordings=Object.freeze((()=>{const bindings='+JSON.stringify(bindings)+',entries='+JSON.stringify(entries)+';return Object.fromEntries(Object.entries(entries).map(([path,{binding,...clip}])=>[path,{...bindings[binding],...clip}]))})());\n';
}
export function editedDeliveryComplete(clip){
 const e=clip.deliveryEditing;if(e===undefined||e===null)return true;
 const kind=e.kind??'complete-prefix-extra-tail';
 if(!['complete-prefix-extra-tail','post-speech-silence-boundary'].includes(kind))return false;
 const quietTail=kind==='post-speech-silence-boundary',interval=e.verifiedSilentIntervalSeconds,stop=e.endSeconds;
 const following=quietTail?e.nextUnclassifiedActivityStartSeconds:e.nextUnwantedWordStartSeconds;
 const exactSource=spokenWords(e.sourceFullAsr)===spokenWords(clip.text);
 const wordProof=quietTail?(e.sourceFullAsrWordExact===true&&exactSource&&Array.isArray(interval)&&Math.abs(following-interval[1])<1e-7&&stop>=e.lastScriptedWordEndSeconds+.05):(spokenWords(e.sourceFullAsr).startsWith(spokenWords(clip.text))&&!exactSource);
 return Array.isArray(interval)&&interval.length===2&&[...interval,stop,e.lastScriptedWordEndSeconds,following,e.sourceFullGenerationDurationSeconds].every(Number.isFinite)&&
  e.sourceNativeEos===true&&['model-sampled','analyzer-forced'].includes(e.sourceEosKind)&&
  ['sourceFullRawSha256','sourceFullEncodedSha256','sourceEosTraceSha256'].every(key=>/^[a-f0-9]{64}$/.test(e[key]))&&
  e.sourceFullText===clip.text&&typeof e.authorization==='string'&&e.authorization.length>0&&
  wordProof&&
  e.startSample===0&&Number.isInteger(e.endSampleExclusive)&&e.sourceSampleRateHz===24000&&Math.abs(stop-e.endSampleExclusive/24000)<1e-7&&
  e.silenceThresholdDb===-38&&e.minimumSilenceSeconds===.2&&interval[1]-interval[0]>=.2&&interval[0]<stop&&stop<interval[1]&&
  e.lastScriptedWordEndSeconds<stop&&stop<following&&stop<e.sourceFullGenerationDurationSeconds&&
  typeof e.preservedFullTakeArchiveRelative==='string'&&e.preservedFullTakeArchiveRelative.length>0;
}
export function knickGenerationComplete(clip){
 return clip.decode?.eosReached===true&&editedDeliveryComplete(clip)&&recognitionComplete(clip)&&(!clip.rescueParts||(clip.rescueParts.length>0&&clip.rescueParts.every(part=>part.eosReached===true&&part.asrWordExact===true&&editedDeliveryComplete(part)&&spokenWords(part.text)===spokenWords(part.asr)&&['voiceId','profileId','referenceSha256','renderer','modelRevision'].every(key=>part[key]===clip[key])&&/^[a-f0-9]{64}$/.test(part.rawSha256)&&/^[a-f0-9]{64}$/.test(part.encodedSha256))&&spokenWords(clip.text)===spokenWords(clip.rescueParts.map(part=>part.text).join(' '))));
}
const segmentedAsrAuthorities={"knick-registration-identityfix":{"diagnosticSha256":"78d0ce846c42ff915ea6c58c283a836f05a417d379905d1fa1eeb28548b0d407","encodedSha256":"a68ed7c036b0b4ba79c19c5e6a5bbccc35022348b5fff77026713e1f7b9be2c9","originalEncodedReceiptSha256":"80711c3e6775807880f4b218b3201312a9713cd19903c7eba6451c479913c3c3","fullDecodedPcmSha256":"a8f2148f84e6e4ac9e26529060559a72aec87e3066f46a5bed428607553aaca2","boundaries":[0,56960,86400,129280,203520,234880],"authoritySha256":"be3bb20e33dd5f29e94e06a027ee8b324c420fa035b2ea6bf878281a54351ce4","voiceId":"amt-brunhilde-knick","profileId":"b080c7d95ecd418fb428282461d7fbe7","referenceSha256":"901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351","text":"Der Originalpass steckt in Ihrer Dokumentenmappe. Holen Sie ihn heraus. Ihr Telefon bleibt lautlos. Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen. Wie reichen Sie den Pass?","modelSha256":"e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da","chunkPcmSha256":["52bfcd53bf36a3490786b7c50b9404d2294abe163130df81e2152360358d4404","87ad6b24f47daed0308ea5952fbfcf8131442418de935fbcd6c7d015e42a5cca","7b02650b1f4d7019f4f8bded8da241d7166e73dd89d0500be1091aadc33ad65f","b8c5a1beafd9ef06efd1a64afcf1f74eab34946bb35f23c3f488c207cad3bf11","81c8cc1471a4ab9f1bc9149fa5840db5eb9f31411c0313ef8bfa87a3b8f3d70c"],"parts":[{"clipId":"knick-registration-identityfix-part-01","text":"Der Originalpass steckt in Ihrer Dokumentenmappe.","rawSha256":"ac65e3235221119f24286ab3bbfddc328dcbe6d4bf3743bd9b2a33252e0b6762","encodedSha256":"b8f3ab849b1a217a4593bb75faf3a46373aa41f89b88f379ab830e5f0cd734f2"},{"clipId":"knick-registration-identityfix-part-02","text":"Holen Sie ihn heraus.","rawSha256":"4d48c17a6e246797ef261f1a8aa8d02d98ed8d9c9a3d6bf84ea70d6ec26e9d32","encodedSha256":"e0178ef6d6e37fdff287d026aa8829b679d1254a5ed5f3be3c4660e762fe0665"},{"clipId":"knick-registration-identityfix-part-03","text":"Ihr Telefon bleibt lautlos.","rawSha256":"93bac22c667fdb66f596de6ef83523d24cb11fadef1f0240d65b9fc9c2787e55","encodedSha256":"43351690ce5753940b21f6ca377355aa0386822a70c82cb38ec59f368b46c2c1"},{"clipId":"knick-registration-identityfix-part-04","text":"Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen.","rawSha256":"b8be1b69835c5a635e4f582ff9c4b2e8fa3f810c29bf44f7cc236fed144cb057","encodedSha256":"9af94c56be7a6fb974deb51fe83f0a73c3d55aa6bd762cd0e9d8d8df79a25690"},{"clipId":"knick-registration-identityfix-part-05","text":"Wie reichen Sie den Pass?","rawSha256":"6143c752faebabf3f3e33692a9db0b7e4cac277c63f9c8beaac49c7e05908fe1","encodedSha256":"9e1c5c83349b9bf07e68042734a9ade8e8404066c26f185f31ffcf95eb8a830e"}],"selectedReadings":[{"beamSize":1,"transcript":"Der Originalpass steckt in Ihrer Dokumentenmappe."},{"beamSize":1,"transcript":"Holen Sie ihn heraus!"},{"beamSize":1,"transcript":"Ihr Telefon bleibt lautlos."},{"beamSize":1,"transcript":"Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen."},{"beamSize":1,"transcript":"Wie reichen Sie den Pass?"}]},"knick-registration-movein":{"diagnosticSha256":"f3e5dda674c0913fa972c2a6937e3d9db55eb953014efec50db687016570eb37","encodedSha256":"03d534b7db8e485e87aeccdc142096b35976f8beadb3457c90da5a419ee934da","originalEncodedReceiptSha256":"d2e71d9616ff840799cf8290e61cff1074a7430d43f2623aadf82db69f291ebc","fullDecodedPcmSha256":"75892a6c021180e335d25d8e29e09b832fc66b3e5bdc3e129a9cb81fca4a001a","boundaries":[0,19200,64000,115200,161280,222080,238080],"authoritySha256":"49bf27d8a4b9f76452ef16ddf65e7a8e6ef0e7b13f94b6819d2becf6c7998f0b","voiceId":"amt-brunhilde-knick","profileId":"b080c7d95ecd418fb428282461d7fbe7","referenceSha256":"901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351","text":"Einzugsdatum. Ihr Mietvertrag begann am Ersten. Den Schlüssel bekamen Sie am Dritten. Eingezogen sind Sie am Fünften. Drei Daten, aber nur eins wohnt in diesem Feld. Welches?","modelSha256":"e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da","chunkPcmSha256":["8b8650025fc808372954107a6cf8ab1bd7e542d883074e24603a8fa47d6fdfcb","faca89829beabb3b702fb536e3076134442098900afb4c464ee5233e2597fd17","e6d27776f831eb101dd662f3b52de0100bfc8def1bfb33a432566adc8447d40a","9d0e75b3c50722de26a8aa784269007427179838f0c3edd7ee99293653e091e6","ca679d3dac5c7d863e1191c0dd8a95c842b557c34925e949e411c1c13a0885b0","4847056ba26cf87f0785f176dc40be65098cad1d7e31c7394a5e1a7023bc3be5"],"parts":[{"clipId":"knick-registration-movein-part-01","text":"Einzugsdatum.","rawSha256":"57e738ef6fae55cfdb3661639027acccac82be38d6b0a2fc69ee6cb7e792250e","encodedSha256":"b0dfffc7a2371dc9fbd5418d501fc33aa4967b59129dc0f0beb49d01c39dabe0"},{"clipId":"knick-registration-movein-part-02","text":"Ihr Mietvertrag begann am Ersten.","rawSha256":"a928801556cbdb9ed5fdc7912213a63217210e775212672dc9faea81a679a999","encodedSha256":"4b74099e8072b5edf9f13f8146f6f934d1f807b2edd2c5b0c4bf7a1f309957ed"},{"clipId":"knick-registration-movein-part-03","text":"Den Schlüssel bekamen Sie am Dritten.","rawSha256":"378b0c832f0f61489e4b4ada92559011a5d1f428bcfd4a2baa0409e77c8cd037","encodedSha256":"5666e0ecd370a350ed6df8483eb698972cdff7f2cfe6f4ab63f141a81738ff5b"},{"clipId":"knick-registration-movein-part-04","text":"Eingezogen sind Sie am Fünften.","rawSha256":"0114257c9b8324542d8a7d0cf0fff4ac6af96eeadb95cf23444e1e34b13c0300","encodedSha256":"de1d31597d32dbfdc9af6f398a202175d34e6718cad2837e3566bfc81b8372b6"},{"clipId":"knick-registration-movein-part-05","text":"Drei Daten, aber nur eins wohnt in diesem Feld.","rawSha256":"ba34c6a3ba0fbbc9f7a71f008203076553e8b2f82b7fee116b8bb84d5897450b","encodedSha256":"d54b692b113039c89ef4a4d6295c7929897b683e999e6fb01986e63c11140f0b"},{"clipId":"knick-registration-movein-part-06","text":"Welches?","rawSha256":"3ebbbfa5a150006937041ce38f58e593d986106520f2878de1fd422daf33fe18","encodedSha256":"8c3253bb2dc8c1c6b3acb04076f6697212c4718b1b193f7cc58f3505293e381d"}],"selectedReadings":[{"beamSize":1,"transcript":"Einzugsdatum."},{"beamSize":1,"transcript":"Ihr Mietvertrag begann am 1."},{"beamSize":1,"transcript":"Den Schlüssel bekamen sie am dritten."},{"beamSize":1,"transcript":"Eingezogen sind sie am fünften."},{"beamSize":1,"transcript":"Drei Daten, aber nur eins wohnt in diesem Feld."},{"beamSize":5,"transcript":"Welches?"}]},"knick-registration-residencefix":{"diagnosticSha256":"d1a0a3d9f3c443aab416ccb73a7aba456e3a8143e6ad6eb101c0f4dddd685939","encodedSha256":"5f3320cb4462361bc0cbc127d8650cd8a77ba130517f115c7b1c6c8a17e519fd","originalEncodedReceiptSha256":"7d9d901d3a2987cbede1ed050e10a4a47b91a79be5116f37655f188297856c1b","fullDecodedPcmSha256":"c86ad26e8dcfb1dcffe7f624e155c20d16d988c0fc4ca48ef7e47f07482ca50f","boundaries":[0,56960,133760,169600,199680],"authoritySha256":"106ecd1bf77ca16865610edf4f21c4e89fe153b2d1105256c4f4939e5147a86f","voiceId":"amt-brunhilde-knick","profileId":"b080c7d95ecd418fb428282461d7fbe7","referenceSha256":"901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351","text":"Geben Sie die weiteren Wohnungen vollständig an. Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung und der Angaben zu Ihrer Wohnsituation. Was reichen Sie nach?","modelSha256":"e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da","chunkPcmSha256":["179426d7f779d9d32af7065b6c6ab67cbdfb749de91be613d482632d18b83095","e9d6a81951d85d375af8e107c7788dd6fb58ef3601fa0e43a1b2750d008044e1","49a2028815eaac2c81da023846c73f847da6567f6ffc9266aed14fa331ed9bcd","fec2c0b1e2344e03a1d34598a9ee7126001a025289460c8c2cf548e4be014d26"],"parts":[{"clipId":"knick-registration-residencefix-part-01","text":"Geben Sie die weiteren Wohnungen vollständig an.","rawSha256":"e3b3b8b7480ddc315cb1a4c5cee961ded34a457de7aa3bf22d558808c622f3b8","encodedSha256":"43321da20eb1965454a8add1a42d8e267675905daf05ef6520bddc297ffc46fc"},{"clipId":"knick-registration-residencefix-context-01","text":"Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung","rawSha256":"b49bb6eb661a6c0c3e87a0110b665d07d3528ba6a91a5776913348559f49e151","encodedSha256":"93ade980cffcfc6c435de5c30b3b9ffdc408f1dcd5807f67a34d9c76e76db4fc"},{"clipId":"knick-registration-residencefix-segment-03","text":"und der Angaben zu Ihrer Wohnsituation.","rawSha256":"c7a124406f93c778ef3d720e8c10c9c0a5621884f53a0f1041539e8d93da68b5","encodedSha256":"86a3b8f7edb78bf11d2e6020e406c9ef3f6c91e33f1edfc96911d701dbe22f82"},{"clipId":"knick-registration-residencefix-part-03","text":"Was reichen Sie nach?","rawSha256":"e8ec4cc90b06cd25bf4f753b5b0ba9ec406fed23031ad3a80b60ac77fd8a20eb","encodedSha256":"36a7017214d7c8205aaba3e1cc8fc8cc1132afe07d9a1976642c9923515afa68"}],"selectedReadings":[{"beamSize":1,"transcript":"Geben Sie die weiteren Wohnungen vollständig an."},{"beamSize":1,"transcript":"Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung."},{"beamSize":1,"transcript":"und der Angaben zu ihrer Wohnsituation."},{"beamSize":1,"transcript":"Was reichen sie nach?"}]}};
export function recognitionComplete(clip){
 const mode=clip.asrVerificationMode===undefined?'full-file-continuous':clip.asrVerificationMode;if(mode==='full-file-continuous'){const a=segmentedAsrAuthorities[clip.clipId];return !(a&&clip.sha256===a.encodedSha256&&clip.asrWordExact===true);}
 if(mode!=='full-encoded-contiguous-chunks')return false;
 const a=segmentedAsrAuthorities[clip.clipId],p=clip.segmentedAsrProof;if(!a||!p)return false;
 if(!['authoritySha256','diagnosticSha256','encodedSha256','fullDecodedPcmSha256','modelSha256','originalEncodedReceiptSha256'].every(key=>p[key]===a[key])||clip.sha256!==a.encodedSha256||!['voiceId','profileId','referenceSha256','text'].every(key=>clip[key]===a[key])||p.sampleRateHz!==16000||p.decodedPcmDtype!=='IEEE754 little-endian float32'||p.scriptPrompt!==null||clip.asrScriptPrompt!==null||p.modelSha256!==clip.asrModelSha256||typeof p.preservedOriginalEncodedReceiptRelative!=='string'||!p.preservedOriginalEncodedReceiptRelative||!Array.isArray(p.continuousFullLineReadings)||!p.continuousFullLineReadings.length||!Array.isArray(p.boundaries)||p.boundaries.length!==a.boundaries.length||!p.boundaries.every((value,index)=>Number.isInteger(value)&&value===a.boundaries[index])||p.totalDecodedSamples!==a.boundaries.at(-1))return false;
 const chunks=p.chunks,parts=clip.rescueParts;if(!Array.isArray(chunks)||!Array.isArray(parts)||chunks.length!==parts.length||chunks.length!==a.chunkPcmSha256.length)return false;
 let cursor=0;const transcripts=[];
 for(let index=0;index<chunks.length;index++){
  const c=chunks[index],part=parts[index];
  if(!Object.entries(a.parts[index]).every(([key,value])=>part[key]===value)||c.sourcePartClipId!==part.clipId||part.clipId!==a.parts[index].clipId||c.expectedText!==part.text||c.sourcePartRawSha256!==part.rawSha256||c.sourcePartEncodedSha256!==part.encodedSha256||!Number.isInteger(c.startSample)||!Number.isInteger(c.endSampleExclusive)||c.startSample!==cursor||cursor!==a.boundaries[index]||c.endSampleExclusive<=cursor||c.endSampleExclusive!==a.boundaries[index+1]||c.decodedPcmSha256!==a.chunkPcmSha256[index]||c.scriptPrompt!==null||!Array.isArray(c.readings)||!c.readings.length)return false;
  const transcript=c.readings.at(-1).transcript;if(typeof transcript!=='string'||spokenWords(part.text)!==spokenWords(transcript)||!Object.entries(a.selectedReadings[index]).every(([key,value])=>c.readings.at(-1)[key]===value))return false;
  cursor=c.endSampleExclusive;transcripts.push(transcript);
 }
 const combined=transcripts.join(' ');return cursor===p.totalDecodedSamples&&p.combinedAsr===combined&&clip.asr===combined&&spokenWords(clip.text)===spokenWords(combined);
}
function fixedAssetInventory(family,clips){
 const listed=clips.map(clip=>clip.file.slice(`assets/voices/${family}/`.length)).sort();
 const shipped=readdirSync(resolve(root,`assets/voices/${family}`)).filter(name=>name.endsWith('.mp3')).sort();
 requireMatch(JSON.stringify(listed)===JSON.stringify(shipped),`Unlisted or missing fixed recordings: ${family}`);
}
export function spokenWords(text){
 const units=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun'],small=[...units,'zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'],tens=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
 const numbers=Array.from({length:100},(_,n)=>n<20?small[n]:((n%10?(n%10===1?'ein':units[n%10])+'und':'')+tens[Math.floor(n/10)]));
 const ordinals=['','ersten','zweiten','dritten','vierten','fünften','sechsten','siebten','achten'];
 return text.toLowerCase().replaceAll('ß','ss').replace(/\bam\s+([1-9]|[12]\d|3[01])\.(?=\s|$)/g,(_,day)=>'am '+(ordinals[Number(day)]||numbers[Number(day)]+(Number(day)<20?'ten':'sten'))).replaceAll('§',' paragraph ').replace(/\b([01]?\d|2[0-3]):00(?=\s*uhr\b)/g,'$1').replace(/\bparagraf\b/g,'paragraph').replace(/\ba\s*38\b/g,'a achtunddreißig').match(/[\p{L}\p{N}_]+/gu)?.map(word=>(/^\d+$/.test(word)&&Number(word)<100?numbers[Number(word)]:word).replaceAll('ß','ss')).join('')||'';
}
function streetAuthority(source=readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8')){
 const window={};vm.runInNewContext(source,{window});vm.runInNewContext(readFileSync(resolve(root,'street-wisdom.js'),'utf8'),{window});
 const catalog=window.GermanySimulatorAudioText,definitions=window.StreetWisdom.definitions;
 requireMatch(definitions.flatMap(person=>person.ruleIndices).sort((a,b)=>a-b).join(',')===catalog.rules.map((_,i)=>i).join(','),'Street rule decks must own every rule exactly once');
 return {catalog,definitions};
}
export function streetRulesBlock(source){
 const {catalog,definitions}=streetAuthority(source),entries=Object.fromEntries(catalog.rules.map((row,index)=>{
  const person=definitions.find(person=>person.ruleIndices.includes(index)),id=`rule-${String(index+1).padStart(2,'0')}`;
  return [id,{id,voiceId:person.voiceId,actorId:person.id,trigger:'nearby-street-rule',source:row[1],text:row[1],english:catalog.ruleEnglish[index],recording:null}];
 }));
 return 'const streetRuleClips=Object.freeze('+JSON.stringify(entries)+');\n';
}
function fixedTakeAuthority(cast,clip){
 const binding=cast.productionVoices[clip.voiceId];
 requireMatch(matchesProduction(cast,clip),'Fixed profile/reference/renderer drift');
 requireMatch(clip.renderer===binding.renderer&&clip.modelRevision===binding.modelRevision&&clip.referenceSha256===binding.referenceSha256&&clip.referenceOriginalSha256===binding.originalSha256&&(clip.processing??'')===(binding.processing??''),`Incomplete fixed production receipt: ${clip.clipId}`);
  requireMatch(clip.asrWordExact&&typeof clip.asr==='string'&&spokenWords(clip.text)===spokenWords(clip.asr)&&Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5,`Unverified fixed take: ${clip.clipId}`);
  requireMatch(knickGenerationComplete(clip),`Missing or incomplete Knick generation receipt: ${clip.clipId}`);
  requireMatch(clip.asrScriptPrompt===null&&clip.asrLanguageId==='de'&&clip.asrComputeType==='int8'&&/^[a-f0-9]{64}$/.test(clip.asrModelSha256)&&[1,2,4].includes(clip.asrCpuThreads),`Missing independent final-encoding ASR receipt: ${clip.clipId}`);
}
export function fixedRecordingsBlock(cast,manifest,family='knick',assetRoot=root){
 requireMatch(['knick','street-wisdom','player-replies','office-ambient','city-dialogue','crowd-dialogue'].includes(family),'Unknown fixed recording family');
 const entries={},seen=new Set(),street=family==='street-wisdom'?streetAuthority():null,ambient=family==='office-ambient',city=family==='city-dialogue',crowd=family==='crowd-dialogue',assetFamily=crowd?'candidate-dialogue':family;
 let ambientRows=null,ambientPeople=null;
 if(ambient){const window={};vm.runInNewContext(readFileSync(resolve(root,'buergeramt-story.js'),'utf8'),{window});const story=window.BuergeramtStory;ambientRows=story.ambient;ambientPeople={...story.characters,...Object.fromEntries(['renter','parent','pensioner'].map((actor,i)=>[actor,Object.values(story.patrons)[i]])),...Object.fromEntries(Object.entries(story.clerks).map(([desk,person])=>['clerk-'+desk,person]))};}
 let replies=null;
 if(family==='player-replies'){
  const window={};vm.runInNewContext(readFileSync(resolve(root,'buergeramt-story.js'),'utf8'),{window});
  replies=Object.fromEntries(Object.entries(window.BuergeramtStory.registration.nodes).flatMap(([key,node])=>node.choices.map((choice,index)=>[`player-registration-${key.toLowerCase()}-${index+1}`,choice.label])));
  replies['player-president-portrait-1']=window.BuergeramtStory.presidentPortrait.lines.map(row=>row.line).join(' ');
  replies['player-potato-mirror']=window.BuergeramtStory.potatoMirror.line;
  const runtime=readFileSync(resolve(root,'buergeramt.js'),'utf8');
  for(const [key,text] of [['complete','Meldebestätigung und A38 mitnehmen.']]){requireMatch(runtime.includes('label:'+JSON.stringify(text)),'Player runtime choice changed');replies['player-'+key]=text;}
  // Preserve validated historical takes, but never expose the retired phone buttons.
  replies['player-phone-silent']='Telefon auf lautlos schalten.';
  replies['player-phone-ignore']='Nicht rangehen. Telefon weglegen.';
 }
 for(const clip of manifest.clips){
  requireMatch((family!=='knick'||clip.voiceId==='amt-brunhilde-knick')&&matchesProduction(cast,clip),'Fixed profile/reference/renderer drift');
  const binding=cast.productionVoices[clip.voiceId];
  fixedTakeAuthority(cast,clip);
  requireMatch(clip.english?.trim()&&clip.approval?.status==='user-approved',`Missing Knick subtitle/use approval: ${clip.clipId}`);
  requireMatch(clip.file.startsWith(`assets/voices/${assetFamily}/`)&&resolve(root,clip.file).startsWith(resolve(root,`assets/voices/${assetFamily}`)+sep),`Invalid fixed asset path: ${clip.clipId}`);
  requireMatch(hash(resolve(assetRoot,clip.file))===clip.sha256,`Knick audio hash drift: ${clip.clipId}`);
  const key=clip.voiceId+'\0'+clip.text;requireMatch(!seen.has(key),`Duplicate Knick line: ${clip.clipId}`);seen.add(key);
  let id=clip.clipId;
  if(ambient){const row=ambientRows.find(row=>row.id===id);requireMatch(row&&row.actor===clip.actorId&&row.text===clip.text&&row.english===clip.english&&ambientPeople[row.actor].voiceId===clip.voiceId,`Wrong ambient speaker/text: ${id}`);}
  if(replies)requireMatch(clip.voiceId==='spieler-hans-peter-mustermann'&&clip.actorId==='player'&&replies[clip.clipId]===clip.text,`Wrong player choice ownership/text: ${clip.clipId}`);
  if(clip.clipId==='player-potato-mirror'){
   const window={};vm.runInNewContext(readFileSync(resolve(root,'buergeramt-story.js'),'utf8'),{window});
   requireMatch(clip.english===window.BuergeramtStory.potatoMirror.english&&!clip.rescueParts&&clip.rendererInputText===clip.text,'Mirror requires exact source/translation in one continuous selected-player take');
  }
  if(replies&&['player-phone-silent','player-phone-ignore'].includes(clip.clipId))continue;
  if(street){
   const index=clip.ruleIndex,person=street.definitions.find(person=>person.ruleIndices.includes(index));
   requireMatch(Number.isInteger(index)&&person&&clip.actorId===person.id&&clip.voiceId===person.voiceId&&clip.clipId===`${person.id}-rule-${String(index+1).padStart(2,'0')}`&&clip.text===street.catalog.rules[index][1]&&clip.english===street.catalog.ruleEnglish[index],`Wrong street rule ownership/text: ${clip.clipId}`);
   id=`rule-${String(index+1).padStart(2,'0')}`;
  }
  entries['./'+clip.file]={id,...(street||replies||ambient||city||crowd?{clipId:clip.clipId,actorId:clip.actorId}:{}),voiceId:clip.voiceId,profileId:clip.profileId,fixedProduction:true,renderer:clip.renderer,modelRevision:clip.modelRevision,referenceSha256:clip.referenceSha256,referenceOriginalSha256:clip.referenceOriginalSha256,processing:clip.processing??null,source:clip.text,english:clip.english,...(city||crowd?{provenanceManifestSha256:clip.provenanceManifestSha256}:{}),...((city||crowd)&&clip.mouthEnergy?{mouthHz:clip.mouthHz,mouthEnergy:clip.mouthEnergy}:{}),trigger:family==='knick'?'buergeramt-exact-dialogue':city?'city-exact-dialogue':crowd?'crowd-owned-exact-dialogue':replies?'buergeramt-player-reply':ambient?'buergeramt-ambient':'nearby-street-rule',durationMs:Math.round(clip.durationSeconds*1000),wordCues:clip.wordCues,sha256:clip.sha256,approval:clip.approval,provenanceManifest:clip.provenanceManifest};
 }
 // Encode repeated receipts once, then expand the same complete fields into
 // every runtime entry. Receipts come from takes, never the current cast alias.
 const receipts=[],receiptKeys=new Map(),rows=[];
 for(const [path,entry] of Object.entries(entries)){
  const {voiceId,profileId,fixedProduction,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,approval,provenanceManifest,trigger,...payload}=entry;
  const receipt={voiceId,profileId,fixedProduction,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,approval,provenanceManifest,trigger},key=JSON.stringify(receipt);
  if(!receiptKeys.has(key)){receiptKeys.set(key,receipts.length);receipts.push(receipt)}
  const {wordCues,...fields}=payload;
  requireMatch(wordCues===undefined||Array.isArray(wordCues),'Invalid fixed-caption cue array');
  if(wordCues)requireMatch(wordCues.every(cue=>Object.keys(cue).length===4&&['at','end','charIndex','word'].every(key=>Object.hasOwn(cue,key))),'Unknown fixed-caption cue fields');
  const compactCues=wordCues?JSON.stringify(wordCues.map(cue=>[cue.at,cue.end,cue.charIndex,cue.word])):null;
  rows.push(JSON.stringify(path)+':{...r['+receiptKeys.get(key)+'],'+JSON.stringify(fields).slice(1,-1)+(compactCues?',wordCues:w('+compactCues+')':'')+'}');
 }
 // Tuples remove repeated field names in delivery, without rounding cue times
 // or changing the objects consumed by caption scheduling.
 return `const ${family==='knick'?'knick':city?'city':crowd?'crowd':replies?'playerReply':ambient?'officeAmbient':'streetWisdom'}Recordings=Object.freeze((()=>{const r=`+JSON.stringify(receipts)+';const w=cues=>cues.map(([at,end,charIndex,word])=>({at,end,charIndex,word}));return{'+rows.join(',')+'}})());\n';
}
const cityAuthoringHelperSha256='122d93bac3016f44b24cf04b97b7a2462d216226e33c9d6d6e05c5ae11a89349';
const citySourceFiles=['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'];
const textHash=text=>createHash('sha256').update(text).digest('hex');
const sameJson=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cityFrozenAuthoringPins=Object.freeze({'game.js':'c1510ca78f329b4cd35430791e2e1fecf1175def445c16806c531fc1b0b1e79e','For-AI/VOICE-CAST.json':'e8ef5bdab86e4390ef5329ac73fcb91afb897c562b93282798c049c7b3ef223b','For-AI/AUDIO-TEXT-LIBRARY.js':'ff557f6f9efd50910147eefe1b2233c17c1f16b6d7672dbd989d7ba8cc5d3807','tools/build-knick-voice.py':'122d93bac3016f44b24cf04b97b7a2462d216226e33c9d6d6e05c5ae11a89349'});
export function verifyCityAuthoringRoot(authoringRoot){
 const sourceRoot=realpathSync(authoringRoot);
 requireMatch(Object.entries(cityFrozenAuthoringPins).every(([path,digest])=>hash(resolve(sourceRoot,path))===digest),'City authoring root is not the frozen723 source');
 requireMatch(cityAuthoringHelperSha256===cityFrozenAuthoringPins['tools/build-knick-voice.py'],'City authoring producer pin changed');
 return sourceRoot;
}
export function verifyCityAdmissionTarget(cast,authoringRoot,destinationRoot=root){
 const frozenRoot=verifyCityAuthoringRoot(authoringRoot),targetRoot=realpathSync(destinationRoot);
 requireMatch(frozenRoot!==targetRoot&&!frozenRoot.startsWith(targetRoot+sep)&&!targetRoot.startsWith(frozenRoot+sep),'City authoring and destination roots alias');
 const frozenCast=json(resolve(frozenRoot,'For-AI/VOICE-CAST.json')),authoringRows=cityDialogueSources(frozenCast,frozenRoot),targetRows=cityDialogueSources(cast,targetRoot);
 requireMatch(authoringRows.length===76&&sameJson(authoringRows,targetRows),'City target source, English, profile, reference, or caller differs from frozen723');
 return {authoringRoot:frozenRoot,destinationRoot:targetRoot,authoringRows,targetRows};
}
export function cityDialogueSources(cast,sourceRoot=root){
 const source=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),window={},expected=cityDialogueTable(cast);
 const selector='function cityNpcDialogue(n){const owned=speechCatalog.cityDialogue?.[n.id],rows=owned?.[state.region];if(owned?.voiceId!==n.voiceId||!Array.isArray(rows)||rows.length!==2||rows.some(row=>typeof row.text!=="string"||!row.text.trim()||typeof row.english!=="string"||!row.english.trim()))return null;return rows}';
 const callers=[
  ' }else if(n.id?.startsWith("city-")){\n   const rows=cityNpcDialogue(n);if(!rows)return;\n   openDialogue(n.name,rows.map(row=>row.text),"!",()=>innerMonologue("lost",.55),n.voiceId,rows.map(row=>row.english));\n',
  ' }else if(n.id?.startsWith("city-")){\n   const rows=cityNpcDialogue(n);if(!rows)return;\n   openDialogue(n.name,rows.map(row=>row.text),"!",()=>innerMonologue("lost",.55),n.voiceId,rows.map(row=>row.english),false,false,n);\n'
 ];
 requireMatch(source.includes(selector)&&callers.filter(caller=>source.includes(caller)).length===1,'Owned city selector/caller/caption contract changed');
 vm.runInNewContext(readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),{window});
 requireMatch(sameJson(window.GermanySimulatorAudioText.cityDialogue,expected),'Missing/stale owned city public export');
 const start=source.indexOf('const npcs=['),stop=source.indexOf('].map(n=>',start);requireMatch(start>=0&&stop>start,'Missing city actor declaration');
 const actors=[...source.slice(start,stop).matchAll(/\{[^\n{}]*id:"(city-[a-z-]+)"[^\n{}]*fullName:"([^"]+)"[^\n{}]*voiceId:"([^"]+)"[^\n{}]*line:\d+[^\n{}]*\}/g)],rows=[];
 requireMatch(actors.length===19&&new Set(actors.map(row=>row[1])).size===19,'City requires nineteen distinct runtime actor owners');
 for(const [,actorId,name,voiceId] of actors){
  const person=cast.characters.find(person=>person.gameCharacterId===actorId),owned=expected[actorId],binding=cast.productionVoices[voiceId];
  requireMatch(person?.voiceId===voiceId&&owned?.voiceId===voiceId&&person.fullName===name,'Wrong city actor/selected voice identity');
  requireMatch(binding?.renderer==='ResembleAI/Chatterbox Multilingual V2 0.1.7'&&binding.modelRevision==='5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'&&binding.processing==null,'Wrong city renderer/revision/dry processing');
  for(const region of ['germany','berlin'])for(const slot of [0,1]){
   const clip=owned[region][slot],line=person.dialogue.find(line=>line.region===region&&line.slot===slot),text=clip.text;
   rows.push({clipId:clip.id,voiceId,actorId,region,slot,sourceLocator:line.locator,text,english:clip.english,sourceSha256:textHash(text),profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:null});
  }
 }
 requireMatch(rows.length===76&&new Set(rows.map(row=>row.clipId)).size===76,'City source IDs are not unique');return rows;
}
function citySnapshot(proof,label){
 requireMatch(typeof proof?.text==='string'&&proof.sha256===textHash(proof.text),`Changed city ${label} snapshot`);
 return JSON.parse(proof.text);
}
function cityManifestAuthority(cast,manifest,sourceRoot=root){
 const authored=new Map(cityDialogueSources(cast,sourceRoot).map(row=>[row.clipId,row])),request=citySnapshot(manifest.cityProvenance?.request,'request');
 requireMatch(typeof manifest.voiceId==='string'&&manifest.voiceId.startsWith('stadt-')&&Array.isArray(request.jobs)&&request.jobs.length>0&&request.jobs.length<=4&&request.jobs.every(row=>row.voiceId===manifest.voiceId&&sameJson(row,authored.get(row.clipId)))&&new Set(request.jobs.map(row=>row.clipId)).size===request.jobs.length,'Wrong city frozen request source/actor/binding');
 requireMatch(request.requestedLineCount===request.jobs.length&&sameJson(Object.keys(request.sourceSha256).sort(),[...citySourceFiles].sort())&&Object.values(request.sourceSha256).every(value=>/^[a-f0-9]{64}$/.test(value))&&/^[a-f0-9]{64}$/.test(request.authoredPlanSha256)&&sameJson(request.authoredPlanSourceSha256,request.sourceSha256)&&sameJson(request.approvedExistingReuse,[]),'Incomplete city frozen source provenance');
 const listed=[...manifest.clips,...manifest.heldPrivate],ids=listed.map(row=>row.clipId);
 requireMatch(manifest.requestedLineCount===request.jobs.length&&Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=request.jobs.length&&ids.length===request.jobs.length&&new Set(ids).size===ids.length&&ids.every(id=>request.jobs.some(row=>row.clipId===id)),'Unaccounted city requested/held lines');
 for(const held of manifest.heldPrivate){const job=authored.get(held.clipId);requireMatch(Object.entries(job).every(([key,value])=>sameJson(held[key],value))&&typeof held.reason==='string'&&held.reason.length>0,'Wrong city held source/fallback');}
 requireMatch(sameJson(Object.keys(manifest.cityProvenance.takes).sort(),manifest.clips.map(row=>row.clipId).sort()),'Missing/extra city take provenance');
 return {authored,request};
}
// One observed orthographic split, bound to its original genuine take. Never a
// general joined-letter recognition exception; raw/encoded receipts stay intact.
const cityCompoundCueAuthority={"clipId":"stadt-wolfgang-schulz-01","actorId":"city-wolfgang-schulz","voiceId":"stadt-wolfgang-schulz","profileId":"06c942339c3144298f6ce8ed7f09bf48","sourceSha256":"4036b54751beec56ebde11bf86418875a5798ffc8b11ef27b0492a9572f31f88","text":"Ich komme immer eine Viertelstunde zu früh. Dann bin ich pünktlich, wenn mir einfällt, was ich vergessen habe.","encodedSha256":"2cb1b47f27334f0196b87b08c1ac4397e03d093e2aad9d3eb14794cbe7cee08b","encodedReceiptSha256":"9bf1f952dada50cb2794843cc13770a7cbe4c18cdaf79297268403b5d4d89d57","rawSha256":"e1e7d12daec0d2a3e566371f65883df023355e8f3b612888bf5be171e0e48cfa","rawReceiptSha256":"3e6d822fa06cb7d33160f609f1b84553aa1925072f3b636527e69d9d883558be","requestSha256":"7aa5fe9c72f591aa9a779060144b1e866975ea2ea0a13ea2c222d0917b57b3c6","selectedReadingIndex":0,"selectedReadingSha256":"cb4e13dc31227a1947d333962e4b59abbafe26a77da156eae8d1064b6fd5930a"};
export function alignCityCompoundCues(text,reading,duration){
 const source=[...text.matchAll(/[\p{L}\p{N}_]+/gu)],words=reading?.words;
 requireMatch(source.length>0&&Array.isArray(words)&&words.length>0&&Number.isFinite(duration)&&duration>0,'Missing city compound source/timing');
 const heard=[];let previousEnd=0;
 for(const word of words){
  const tokens=typeof word.word==='string'?[...word.word.matchAll(/[\p{L}\p{N}_]+/gu)]:[];
  requireMatch(tokens.length===1&&Number.isFinite(word.start)&&Number.isFinite(word.end)&&word.start>=previousEnd&&word.end>word.start&&word.end<=duration,'Invalid observed city compound word/timing');
  heard.push(tokens[0][0].toLowerCase());previousEnd=word.end;
 }
 const transcript=typeof reading.transcript==='string'?[...reading.transcript.matchAll(/[\p{L}\p{N}_]+/gu)].map(word=>word[0].toLowerCase()):[];
 requireMatch(sameJson(transcript,heard),'City timed words differ from selected full transcript');
 const mapping=[],wordCues=[];let cursor=0,merges=0;
 for(const word of source){
  const first=cursor,expected=word[0].toLowerCase();
  if(heard[cursor]===expected)cursor++;
  else{
   requireMatch(expected==='viertelstunde'&&heard[cursor]==='viertel'&&heard[cursor+1]==='stunde'&&merges===0,'Unlisted city compound spelling or changed word');
   cursor+=2;merges++;
  }
  mapping.push({sourceWordIndex:mapping.length,observedStart:first,observedEndExclusive:cursor});
  wordCues.push({at:words[first].start,end:words[cursor-1].end,charIndex:word.index,word:word[0]});
 }
 requireMatch(cursor===words.length&&merges===1,'Incomplete/extra city compound words or missing authorized split');
 return {mapping,wordCues};
}
export function cityOrthographicCueProof(proof,request){
 const a=cityCompoundCueAuthority,encoded=citySnapshot(proof?.encoded,'compound encoded receipt'),raw=citySnapshot(proof?.raw,'compound raw receipt');
 requireMatch(proof.encoded.sha256===a.encodedReceiptSha256&&proof.raw.sha256===a.rawReceiptSha256&&request?.sha256===a.requestSha256,'Foreign city compound receipt/request');
 citySnapshot(request,'compound frozen request');
 for(const key of ['clipId','actorId','voiceId','profileId','sourceSha256','text'])requireMatch(encoded[key]===a[key]&&raw[key]===a[key],`Foreign city compound identity: ${key}`);
 requireMatch(encoded.sha256===a.encodedSha256&&encoded.rawSha256===a.rawSha256&&raw.rawSha256===a.rawSha256&&encoded.requestSha256===a.requestSha256&&raw.requestSha256===a.requestSha256,'Foreign city compound audio lineage');
 requireMatch(encoded.authoringHelperSha256===cityAuthoringHelperSha256&&raw.authoringHelperSha256===cityAuthoringHelperSha256&&encoded.asrWordExact===true&&encoded.asrLiteralWordExact===false&&Array.isArray(encoded.wordCues)&&encoded.wordCues.length===0,'City compound original flags/cues drift');
 const reading=encoded.asrReadings?.[a.selectedReadingIndex];
 requireMatch(a.selectedReadingIndex===encoded.asrReadings?.length-1&&reading?.transcript===encoded.asr&&reading.beamSize===encoded.asrBeamSize&&textHash(JSON.stringify(reading))===a.selectedReadingSha256&&/^[a-f0-9]{64}$/.test(encoded.asrModelSha256),'Foreign city compound selected reading');
 const aligned=alignCityCompoundCues(encoded.text,reading,encoded.durationSeconds);
 const value={kind:'german-compound-spacing-cue-alignment-v1',clipId:a.clipId,encodedReceiptSha256:a.encodedReceiptSha256,rawReceiptSha256:a.rawReceiptSha256,requestSha256:a.requestSha256,encodedSha256:a.encodedSha256,sourceSha256:a.sourceSha256,selectedReadingIndex:a.selectedReadingIndex,selectedReadingSha256:a.selectedReadingSha256,asrModelSha256:encoded.asrModelSha256,rule:{source:'Viertelstunde',observed:['viertel','Stunde']},...aligned};
 const text=JSON.stringify(value,null,2)+'\n';return {text,sha256:textHash(text)};
}
function verifiedCityOrthographicCues(proof,request){
 if(!proof.orthographicCues)return null;
 const supplied=citySnapshot(proof.orthographicCues,'compound cue supplement'),expected=cityOrthographicCueProof(proof,request);
 requireMatch(sameJson(supplied,JSON.parse(expected.text)),'City compound cue supplement drift');
 return supplied.wordCues;
}

function cityClipAuthority(cast,clip,proof,request,authored){
 const raw=citySnapshot(proof?.raw,'raw receipt'),encoded=citySnapshot(proof?.encoded,'encoded receipt'),job=authored.get(clip.clipId);
 requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(clip[key],value)&&sameJson(raw[key],value)&&sameJson(encoded[key],value)),'Wrong city source/translation/owner');
 requireMatch(raw.authoringHelperSha256===cityAuthoringHelperSha256&&raw.requestSha256===request.sha256&&/^[a-f0-9]{64}$/.test(raw.rawSha256)&&raw.rendererInputText===raw.text&&raw.rendererInputBasis==='exact authored source'&&Number.isInteger(raw.synthesisAttempt)&&raw.synthesisAttempt>=1&&raw.synthesisAttempt<=2&&Number.isFinite(raw.renderSeconds)&&raw.renderSeconds>=0&&Number.isFinite(raw.durationSeconds)&&raw.durationSeconds>0&&/^[a-f0-9]{64}$/.test(raw.profileJsonSha256),'Missing city genuine producer/completion binding');
 requireMatch(raw.decode?.eosReached===true&&Number.isInteger(raw.decode.maxSpeechTokens)&&raw.decode.maxSpeechTokens>0&&Number.isInteger(raw.decode.generatedSpeechTokens)&&raw.decode.generatedSpeechTokens>0&&raw.decode.generatedSpeechTokens<=raw.decode.maxSpeechTokens&&Number.isInteger(raw.decode.attentionHooksBefore)&&raw.decode.attentionHooksBefore>=0&&raw.decode.attentionHooksAfter===raw.decode.attentionHooksBefore&&Number.isFinite(raw.decode.t3InferenceSeconds)&&raw.decode.t3InferenceSeconds>=0&&!raw.decode.modelEosRestoredSteps,'Missing city synchronous native EOS/cleanup receipt');
 requireMatch(raw.synthesis?.inferenceMode===true&&raw.synthesis.referenceReconditionedForProfile===raw.profileId&&raw.synthesis.referenceConditioningVerifiedFloat32===true&&raw.synthesis.languageId==='de'&&raw.modelLicense==='MIT'&&typeof raw.referenceLicense==='string'&&raw.referenceLicense.length>0,'Missing city native conditioning/license receipt');
 for(const [key,value] of Object.entries(raw))if(!['durationSeconds','status'].includes(key))requireMatch(sameJson(encoded[key],value),`City raw/encoded lineage drift: ${key}`);
 requireMatch(!['rescueParts','deliveryEditing','benchmarkOnly','recognitionVerification','actualInferenceText','nativeCompletion'].some(key=>key in raw||key in encoded),'Unsupported city edited/substituted take');
 requireMatch(encoded.listening==='pending'&&clip.listening==='pending'&&!clip.listeningConfirmed&&!clip.listeningVerified&&!clip.approval?.listeningConfirmed&&!clip.approval?.listeningVerified,'City listening evidence is not supplied');
 requireMatch(encoded.sampleRateHz===48000&&encoded.channels===1&&encoded.bitrateBitsPerSecond===128000&&Number.isInteger(encoded.bytes)&&encoded.bytes>0&&Number.isFinite(encoded.durationSeconds)&&encoded.durationSeconds>0&&encoded.processing===null&&encoded.processingSha256===null,'Invalid city final encoding');
 const orthographicCues=verifiedCityOrthographicCues(proof,request);
 requireMatch(encoded.asrDevice==='cpu'&&encoded.asrComputeType==='int8'&&['int8','int8_float32'].includes(encoded.asrEffectiveComputeType)&&(encoded.asrLiteralWordExact===true||encoded.asrLiteralWordExact===false&&orthographicCues!==null)&&Array.isArray(encoded.asrReadings)&&encoded.asrReadings.length>0&&encoded.asrReadings.every(row=>[1,5].includes(row.beamSize)&&typeof row.transcript==='string')&&encoded.asrReadings.at(-1).transcript===encoded.asr,'Missing final city ASR readings');
 requireMatch(Object.entries(encoded).every(([key,value])=>sameJson(clip[key],value)),'City manifest differs from encoded receipt');
 const approval=clip.approval;
 requireMatch(sameJson(Object.keys(approval||{}).sort(),['clipId','date','encodedSha256','instruction','scope','status'])&&approval?.status==='user-approved'&&approval.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(approval.date)&&typeof approval.instruction==='string'&&approval.instruction.trim().length>0&&approval.clipId===clip.clipId&&approval.encodedSha256===clip.sha256,'Missing clip/hash-scoped city use authorization');
 requireMatch(clip.file===`assets/voices/city-dialogue/${clip.clipId}.mp3`&&Number.isFinite(clip.integratedLufs)&&Number.isFinite(clip.truePeakDbtp)&&clip.asrWordExact===true,'Invalid city public asset/levels');
 const wordCues=orthographicCues??clip.wordCues,expectedWords=[...clip.text.matchAll(/[\p{L}\p{N}_]+/gu)];let previousEnd=0,previousIndex=-1;
 requireMatch(Array.isArray(wordCues)&&expectedWords.length>0&&wordCues.length===expectedWords.length&&wordCues.every((cue,index)=>{const valid=cue.word===expectedWords[index][0]&&cue.charIndex===expectedWords[index].index&&Object.keys(cue).length===4&&Number.isFinite(cue.at)&&Number.isFinite(cue.end)&&cue.at>=previousEnd&&cue.end>cue.at&&cue.end<=clip.durationSeconds+.05&&Number.isInteger(cue.charIndex)&&cue.charIndex>previousIndex&&typeof cue.word==='string'&&cue.word.length>0&&clip.text.slice(cue.charIndex,cue.charIndex+cue.word.length)===cue.word;previousEnd=cue.end;previousIndex=cue.charIndex;return valid}),'Invalid city final caption cues');
 fixedTakeAuthority(cast,clip);
 return wordCues;
}
export function cityManifestProof(cast,manifest,reviewRoot,authoringHelperPath,sourceRoot=root){
 requireMatch(hash(authoringHelperPath)===cityAuthoringHelperSha256,'City authoring helper is not the reviewed producer');
 const base=realpathSync(reviewRoot),game=realpathSync(sourceRoot);
 requireMatch(base!==game&&!base.startsWith(game+sep)&&!game.startsWith(base+sep),'City private review aliases runtime');
 const privateFile=relative=>{const file=realpathSync(resolve(base,relative));requireMatch(file.startsWith(base+sep)&&!lstatSync(resolve(base,relative)).isSymbolicLink(),'City provenance path escapes private review');return file};
 const snapshot=relative=>{const text=readFileSync(privateFile(relative),'utf8');return{text,sha256:textHash(text)}};
 requireMatch(/^stadt-[a-z-]+$/.test(manifest.voiceId),'Unsafe city voice directory');
 const result=structuredClone(manifest);result.cityProvenance={request:snapshot(`${manifest.voiceId}/requests.json`),takes:{}};
 for(const clip of result.clips){requireMatch(new RegExp('^'+manifest.voiceId+'-0[1-4]$').test(clip.clipId),'Unsafe city clip ID');result.cityProvenance.takes[clip.clipId]={raw:snapshot(`${manifest.voiceId}/raw/${clip.clipId}.json`),encoded:snapshot(`${manifest.voiceId}/encoded/${clip.clipId}.json`)};if(clip.asrLiteralWordExact===false){const proof=result.cityProvenance.takes[clip.clipId];proof.orthographicCues=cityOrthographicCueProof(proof,result.cityProvenance.request);}}
 const {authored}=cityManifestAuthority(cast,result,sourceRoot);
 for(const name of citySourceFiles.slice(0,2))requireMatch(JSON.parse(result.cityProvenance.request.text).sourceSha256[name]===hash(resolve(sourceRoot,name)),`City admission source changed: ${name}`);
 for(const clip of result.clips){const proof=result.cityProvenance.takes[clip.clipId];cityClipAuthority(cast,clip,proof,result.cityProvenance.request,authored);const raw=JSON.parse(proof.raw.text),encoded=JSON.parse(proof.encoded.text),mp3=privateFile(`${manifest.voiceId}/encoded/${clip.clipId}.mp3`);requireMatch(hash(privateFile(`${manifest.voiceId}/raw/${clip.clipId}.wav`))===raw.rawSha256&&hash(mp3)===encoded.sha256&&readFileSync(mp3).length===encoded.bytes,'City private audio bytes drift');}
 return result;
}
export function cityRecordingsBlock(cast,manifests,assetRoot=root,sourceRoot=root,mouthSupplement=null){
 const clips=[],seen=new Set();
 const mouth=cityMouthEnergyRows(mouthSupplement,manifests,assetRoot);
 for(const manifest of manifests){const {authored}=cityManifestAuthority(cast,manifest,sourceRoot);for(const clip of manifest.clips){requireMatch(!seen.has(clip.clipId),'Duplicate city clip across manifests');seen.add(clip.clipId);const wordCues=cityClipAuthority(cast,clip,manifest.cityProvenance.takes[clip.clipId],manifest.cityProvenance.request,authored);clips.push({...clip,wordCues,...(mouth?.[clip.clipId]?{mouthHz:40,mouthEnergy:mouth[clip.clipId].mouthEnergy}:{}),provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256})}}
 return fixedRecordingsBlock(cast,{clips},'city-dialogue',assetRoot);
}
const cityAdmissionPattern=/const cityAdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);\n/;
function cityAdmissions(source){return JSON.parse(source.match(cityAdmissionPattern)?.[1]||'{}')}
const cityMouthEnergyPath='assets/voices/city-dialogue/city-mouth-energy.json';
const cityMouthEnergyPattern=/const cityMouthEnergyReceipt=Object\.freeze\((\{[^\n]*\})\);\n/;
const cityEnergyBuilderSha256='08de0ab462c3b3a3aa37108ffabee3f73b4453a984f389c301e0a7b86b24edd8';
const cityEnergyCanonicalBuilderSha256='b07e8bfd3577c34cc7677f083fd46f42d05c2fd37a861aa6e1ad273bc8053a3b';
const cityEnergyLineSha256='903ba63ae5bbbb4f2608578be579c0507b5cb1883d2839e2ea426f9dc4499604';
const cityEnergyFfmpegSha256='74db6c184a03dba2bdfe23e1a1f41cf5a8385bc1de6a7a1b26db1dc541abef93';
const cityEnergyMeasurementSha256='38391e53ba5f1fc21478271165317daaefa1c8d77f9a0ab81d4338f8816003ac';
function cityMouthEnergyRows(supplement,manifests,assetRoot){
 if(!supplement)return null;
 requireMatch(supplement.kind==='city-final-mp3-mouth-energy-supplement-v1'&&supplement.recipeBuilderSha256===cityEnergyBuilderSha256&&supplement.recipeCanonicalBuilderSha256===cityEnergyCanonicalBuilderSha256&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(supplement.admissionRecipeBuilderSha256)&&supplement.recipeLineSha256===cityEnergyLineSha256&&supplement.ffmpegSha256===cityEnergyFfmpegSha256&&supplement.measurementSha256===cityEnergyMeasurementSha256,'Foreign city mouth recipe/measurement');
 const clips=manifests.flatMap(manifest=>manifest.clips.map(clip=>({...clip,encodedReceiptSha256:manifest.cityProvenance.takes[clip.clipId].encoded.sha256}))),rows=supplement.clips;
 requireMatch(clips.length>=43&&rows&&Object.keys(rows).length===43&&Object.keys(rows).every(id=>clips.some(clip=>clip.clipId===id)),'Incomplete/extra city mouth supplement');
 for(const clip of clips.filter(clip=>Object.hasOwn(rows,clip.clipId))){const row=rows[clip.clipId];
  for(const key of ['clipId','voiceId','actorId','profileId','file','sha256','encodedReceiptSha256'])requireMatch(row[key]===clip[key],`Foreign city mouth ${key}: ${clip.clipId}`);
  requireMatch(hash(resolve(assetRoot,clip.file))===clip.sha256&&row.mouthHz===40&&Number.isInteger(row.sampleCount)&&row.sampleCount>0&&row.sampleCount<=240000&&Number.isFinite(row.durationSeconds)&&row.durationSeconds===row.sampleCount/24000&&/^[a-f0-9]{64}$/.test(row.pcmSha256)&&Array.isArray(row.mouthEnergy)&&row.mouthEnergy.length===Math.ceil(row.sampleCount/600)&&row.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255)&&row.energySha256===textHash(Buffer.from(row.mouthEnergy)),'Invalid city measured mouth bins');
 }
 return rows;
}
function cityMouthEnergyFromCatalog(source,manifests,assetRoot){
 const anchor=source.match(cityMouthEnergyPattern);if(!anchor)return null;
 const receipts=JSON.parse(anchor[1]);requireMatch(sameJson(Object.keys(receipts),[cityMouthEnergyPath]),'Foreign city mouth supplement anchor');
 const path=resolve(assetRoot,cityMouthEnergyPath);
 requireMatch(!lstatSync(path).isSymbolicLink()&&hash(path)===receipts[cityMouthEnergyPath],'City mouth supplement hash drift');
 const supplement=json(path);cityMouthEnergyRows(supplement,manifests,assetRoot);return supplement;
}
const crowdMouthEnergyPath='assets/voices/candidate-dialogue/crowd-mouth-energy.json';
const crowdMouthEnergyPattern=/const crowdMouthEnergyReceipt=Object\.freeze\((\{[^\n]*\})\);\n/;
const crowdMouthClipIds=['crowd-baerbel-brezel-germany-01','crowd-brigitte-bueroklammer-germany-01','crowd-elfriede-eingabe-germany-01','crowd-guenther-gartenzaun-germany-01','crowd-hildegard-brotzeit-germany-01','crowd-manfred-mittagsruhe-germany-01','crowd-ruediger-rasenkante-germany-01'];
function crowdMouthEnergyRows(supplement,manifests,assetRoot){
 if(!supplement)return null;
 requireMatch(supplement.kind==='crowd-final-mp3-mouth-energy-supplement-v1'&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(supplement.recipeBuilderSha256)&&supplement.recipeCanonicalBuilderSha256===cityEnergyCanonicalBuilderSha256&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(supplement.admissionRecipeBuilderSha256)&&supplement.recipeLineSha256===cityEnergyLineSha256&&supplement.ffmpegSha256===cityEnergyFfmpegSha256&&/^[a-f0-9]{64}$/.test(supplement.measurementSha256),'Foreign crowd mouth recipe/measurement');
 const clips=manifests.flatMap(manifest=>manifest.clips.filter(clip=>clip.approval?.status==='user-approved').map(clip=>({...clip,encodedReceiptSha256:manifest.crowdAdmission.takes[clip.clipId]?.encodedReceiptSha256,provenanceManifestSha256:manifest.provenanceManifestSha256}))),selectedClips=clips.filter(clip=>crowdMouthClipIds.includes(clip.clipId)),rows=supplement.clips;
 requireMatch(sameJson(selectedClips.map(clip=>clip.clipId).sort(),crowdMouthClipIds)&&rows&&sameJson(Object.keys(rows).sort(),crowdMouthClipIds),'Incomplete/extra crowd mouth supplement');
 for(const clip of selectedClips){const row=rows[clip.clipId];for(const key of ['clipId','voiceId','actorId','profileId','referenceSha256','file','sha256','encodedReceiptSha256','text','english'])requireMatch(row[key]===clip[key],`Foreign crowd mouth ${key}: ${clip.clipId}`);requireMatch(hash(resolve(assetRoot,clip.file))===clip.sha256&&row.mouthHz===40&&Number.isInteger(row.sampleCount)&&row.sampleCount>0&&row.sampleCount<=240000&&Number.isFinite(row.durationSeconds)&&row.durationSeconds===row.sampleCount/24000&&/^[a-f0-9]{64}$/.test(row.pcmSha256)&&Array.isArray(row.mouthEnergy)&&row.mouthEnergy.length===Math.ceil(row.sampleCount/600)&&row.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255)&&row.energySha256===textHash(Buffer.from(row.mouthEnergy)),'Invalid crowd measured mouth bins');}
 return rows;
}
function crowdMouthEnergyFromCatalog(source,manifests,assetRoot){
 const anchor=source.match(crowdMouthEnergyPattern);if(!anchor)return null;const receipts=JSON.parse(anchor[1]);requireMatch(sameJson(Object.keys(receipts),[crowdMouthEnergyPath]),'Foreign crowd mouth supplement anchor');const path=resolve(assetRoot,crowdMouthEnergyPath);requireMatch(!lstatSync(path).isSymbolicLink()&&hash(path)===receipts[crowdMouthEnergyPath],'Crowd mouth supplement hash drift');const supplement=json(path);crowdMouthEnergyRows(supplement,manifests,assetRoot);return supplement.clips;
}
function crowdMouthSnapshot(cast,manifests,sourceRoot,ffmpegPath){
 const catalogPath=resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),castPath=resolve(sourceRoot,'For-AI/VOICE-CAST.json'),gamePath=resolve(sourceRoot,'game.js'),builderPath=resolve(sourceRoot,'tools/build-neighbor-voices.mjs');return{catalogSha256:textHash(readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n')),castSha256:hash(castPath),gameSha256:hash(gamePath),builderSha256:hash(builderPath),ffmpegSha256:hash(ffmpegPath),manifests:Object.fromEntries(manifests.map(row=>[row.provenanceManifest,hash(resolve(sourceRoot,row.provenanceManifest))]).sort(([a],[b])=>a.localeCompare(b))),clips:Object.fromEntries(manifests.flatMap(row=>row.clips.filter(clip=>clip.approval?.status==='user-approved').map(clip=>[clip.clipId,{sha256:hash(resolve(sourceRoot,clip.file)),manifestSha256:row.provenanceManifestSha256,encodedReceiptSha256:row.crowdAdmission.takes[clip.clipId]?.encodedReceiptSha256}])).sort(([a],[b])=>a.localeCompare(b)))};
}
export function measureCrowdMouthEnergy(cast,ffmpegPath,runDirectory,sourceRoot=root){
 const catalogPath=resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),catalogSource=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n'),admissions=crowdAdmissions(catalogSource),directory=resolve(sourceRoot,'assets/voices/candidate-dialogue'),manifests=readdirSync(directory).filter(name=>name.endsWith('-crowd-manifest.json')).sort().map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`,path=resolve(sourceRoot,relative),sha256=hash(path),manifest=json(path);if(manifest.clips.some(clip=>clip.approval?.status==='user-approved'))requireMatch(admissions[relative]===sha256,'Unadmitted crowd mouth source manifest');return {...manifest,provenanceManifest:relative,provenanceManifestSha256:sha256}});crowdRecordingsBlock(cast,manifests,sourceRoot,sourceRoot);const clips=manifests.flatMap(manifest=>manifest.clips.filter(clip=>clip.approval?.status==='user-approved').map(clip=>({...clip,encodedReceiptSha256:manifest.crowdAdmission.takes[clip.clipId]?.encodedReceiptSha256,provenanceManifestSha256:manifest.provenanceManifestSha256}))).sort((a,b)=>a.clipId.localeCompare(b.clipId));requireMatch(sameJson(clips.map(clip=>clip.clipId),crowdMouthClipIds)&&hash(ffmpegPath)===cityEnergyFfmpegSha256,'Crowd measurement set/decoder drift');const builderPath=resolve(sourceRoot,'tools/build-neighbor-voices.mjs'),builder=readFileSync(builderPath,'utf8');requireMatch([cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(hash(builderPath))&&textHash(builder.replace(/\r\n/g,'\n'))===cityEnergyCanonicalBuilderSha256,'Crowd measurement builder drift');const lines=builder.split(/\r?\n/).filter(line=>line.startsWith('function energy(path){'));requireMatch(lines.length===1&&textHash(lines[0])===cityEnergyLineSha256,'Crowd measurement recipe drift');
 const runPath=resolve(runDirectory);mkdirSync(runPath);const sourceBefore=crowdMouthSnapshot(cast,manifests,sourceRoot,ffmpegPath),results=[];let decoderCalls=0;const measurementBegan=Date.now();try{for(const [index,clip] of clips.entries()){requireMatch(Date.now()-measurementBegan<120000,'Crowd mouth measurement decoder wall budget');const manifest=manifests.find(row=>row.clips.some(item=>item.clipId===clip.clipId)),mp3=resolve(sourceRoot,clip.file);requireMatch(hash(mp3)===clip.sha256,'Crowd measurement MP3 changed');let decoded=null,calls=0;const decode=(args,binary)=>{requireMatch(binary&&calls++===0&&sameJson(Array.from(args),['-hide_banner','-loglevel','error','-i',mp3,'-f','f32le','-ac','1','-ar','24000','pipe:1']),'Changed crowd measurement decoder request');decoderCalls++;const result=spawnSync(ffmpegPath,['-nostdin','-threads','1',...args],{encoding:null,windowsHide:true,timeout:10000,maxBuffer:1048576}),bytes=result.stdout??Buffer.alloc(0),outcome={clipId:clip.clipId,pid:result.pid??null,status:result.status??null,signal:result.signal??null,error:result.error?.code??null,stdoutBytes:bytes.length,stdoutSha256:textHash(bytes),exitRecordedBeforeValidation:true};writeFileSync(resolve(runPath,`decode-${String(index+1).padStart(2,'0')}.json`),JSON.stringify(outcome,null,2)+'\n',{flag:'wx'});requireMatch(!result.error&&result.status===0&&!result.signal&&bytes.length>0&&bytes.length<=1048576&&bytes.length%4===0,'Crowd measurement decoder failed');const sampleCount=bytes.length/4;requireMatch(sampleCount<=240000,'Crowd measurement duration exceeds bound');for(let i=0;i<bytes.length;i+=4)requireMatch(Number.isFinite(bytes.readFloatLE(i)),'Nonfinite crowd measurement PCM');decoded={pcmSha256:textHash(bytes),sampleCount,durationSeconds:sampleCount/24000};return bytes;};const energy=vm.runInNewContext('('+lines[0]+')',{ffmpeg:decode,Float32Array,Math},{timeout:1000})(mp3);requireMatch(calls===1&&decoded&&energy.mouthHz===40&&energy.durationSeconds===decoded.durationSeconds,'Crowd measurement recipe output invalid');results.push({clipId:clip.clipId,file:clip.file,sha256:clip.sha256,voiceId:clip.voiceId,actorId:clip.actorId,profileId:clip.profileId,referenceSha256:clip.referenceSha256,text:clip.text,english:clip.english,encodedReceiptSha256:clip.encodedReceiptSha256,manifestSha256:manifest.provenanceManifestSha256,decoded,measurement:{mouthHz:40,mouthEnergy:Array.from(energy.mouthEnergy)}});}
 const sourceAfter=crowdMouthSnapshot(cast,manifests,sourceRoot,ffmpegPath);requireMatch(sameJson(sourceBefore,sourceAfter),'Crowd source changed during measurement');const measurement={kind:'crowd-final-mp3-mouth-energy-7-measurement-candidate-v1',status:'MEASURED CANDIDATE ONLY',admission:'NOT PERFORMED',decodeCalls:7,inputCatalogSha256:sourceBefore.catalogSha256,recipeFileSha256:hash(builderPath),recipeFunctionLineSha256:cityEnergyLineSha256,ffmpegSha256:cityEnergyFfmpegSha256,sourceBefore,sourceAfter,results};const bytes=JSON.stringify(measurement,null,2)+'\n',measurementPath=resolve(runPath,'measurement.json');writeFileSync(measurementPath,bytes,{flag:'wx'});const terminal={status:measurement.status,decodeCalls:7,path:measurementPath,sha256:textHash(bytes),admission:'NOT PERFORMED'};writeFileSync(resolve(runPath,'terminal.json'),JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});return terminal;
 }catch(error){const terminal={status:'FAILED',decodeCalls:decoderCalls,error:String(error?.message??error),admission:'NOT PERFORMED'};writeFileSync(resolve(runPath,'terminal.json'),JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});throw error;}
}
export function admitCrowdMouthEnergy(cast,measurement,measurementSha256,ffmpegPath,sourceRoot=root){
 const catalogPath=resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),catalogSource=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n');requireMatch(!catalogSource.match(crowdMouthEnergyPattern),'Crowd mouth supplement already admitted');const supplementPath=resolve(sourceRoot,crowdMouthEnergyPath),supplementTemporary=supplementPath+'.crowd-mouth.tmp',catalogTemporary=catalogPath+'.crowd-mouth.tmp';requireMatch(!existsSync(supplementPath)&&!existsSync(supplementTemporary)&&!existsSync(catalogTemporary)&&!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1,'Occupied or linked crowd mouth destination');
 const admissions=crowdAdmissions(catalogSource),directory=resolve(sourceRoot,'assets/voices/candidate-dialogue'),manifests=readdirSync(directory).filter(name=>name.endsWith('-crowd-manifest.json')).sort().map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`,path=resolve(sourceRoot,relative),sha256=hash(path),manifest=json(path);if(manifest.clips.some(clip=>clip.approval?.status==='user-approved'))requireMatch(admissions[relative]===sha256,'Unadmitted crowd mouth source manifest');return {...manifest,provenanceManifest:relative,provenanceManifestSha256:sha256}});crowdRecordingsBlock(cast,manifests,sourceRoot,sourceRoot);const clips=manifests.flatMap(manifest=>manifest.clips.filter(clip=>clip.approval?.status==='user-approved').map(clip=>({...clip,encodedReceiptSha256:manifest.crowdAdmission.takes[clip.clipId]?.encodedReceiptSha256,provenanceManifestSha256:manifest.provenanceManifestSha256}))).sort((a,b)=>a.clipId.localeCompare(b.clipId));
 requireMatch(sameJson(clips.map(clip=>clip.clipId),crowdMouthClipIds)&&/^[a-f0-9]{64}$/.test(measurementSha256)&&measurement.kind==='crowd-final-mp3-mouth-energy-7-measurement-candidate-v1'&&measurement.status==='MEASURED CANDIDATE ONLY'&&measurement.admission==='NOT PERFORMED'&&measurement.decodeCalls===7&&measurement.inputCatalogSha256===textHash(catalogSource)&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(measurement.recipeFileSha256)&&measurement.recipeFunctionLineSha256===cityEnergyLineSha256&&measurement.ffmpegSha256===cityEnergyFfmpegSha256&&measurement.results.length===7&&sameJson(measurement.sourceBefore,measurement.sourceAfter)&&measurement.sourceBefore.catalogSha256===textHash(catalogSource)&&sameJson(measurement.sourceBefore,crowdMouthSnapshot(cast,manifests,sourceRoot,ffmpegPath)),'Foreign/incomplete crowd mouth measurement');const measured=new Map(measurement.results.map(row=>[row.clipId,row]));requireMatch(measured.size===7&&sameJson([...measured.keys()].sort(),crowdMouthClipIds)&&hash(ffmpegPath)===cityEnergyFfmpegSha256,'Missing/extra crowd measurement or foreign decoder');
 const builderPath=resolve(sourceRoot,'tools/build-neighbor-voices.mjs'),builder=readFileSync(builderPath,'utf8'),admissionRecipeBuilderSha256=hash(builderPath);requireMatch([cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(admissionRecipeBuilderSha256)&&textHash(builder.replace(/\r\n/g,'\n'))===cityEnergyCanonicalBuilderSha256,'Crowd mouth builder drift');const lines=builder.split(/\r?\n/).filter(line=>line.startsWith('function energy(path){'));requireMatch(lines.length===1&&textHash(lines[0])===cityEnergyLineSha256&&new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4,'Crowd mouth energy recipe/endian drift');
 const began=Date.now(),rows={};for(const clip of clips){requireMatch(Date.now()-began<120000,'Crowd mouth admission decoder wall budget');const manifest=manifests.find(row=>row.clips.some(item=>item.clipId===clip.clipId)),found=measured.get(clip.clipId);requireMatch(found&&found.sha256===clip.sha256&&found.file===clip.file&&found.voiceId===clip.voiceId&&found.actorId===clip.actorId&&found.profileId===clip.profileId&&found.referenceSha256===clip.referenceSha256&&found.encodedReceiptSha256===clip.encodedReceiptSha256&&found.manifestSha256===manifest.provenanceManifestSha256,'Foreign measured crowd identity/manifest');const mp3=resolve(sourceRoot,clip.file);requireMatch(hash(mp3)===clip.sha256,'Crowd mouth MP3 changed');let decoded=null,calls=0;const decode=(args,binary)=>{requireMatch(binary&&calls++===0&&sameJson(Array.from(args),['-hide_banner','-loglevel','error','-i',mp3,'-f','f32le','-ac','1','-ar','24000','pipe:1']),'Changed crowd mouth decoder request');const result=spawnSync(ffmpegPath,['-nostdin','-threads','1',...args],{encoding:null,windowsHide:true,timeout:10000,maxBuffer:1048576});requireMatch(!result.error&&result.status===0&&!result.signal&&result.stdout?.length>0&&result.stdout.length<=1048576&&result.stdout.length%4===0,'Crowd mouth decoder failed');const bytes=result.stdout,sampleCount=bytes.length/4;requireMatch(sampleCount<=240000,'Crowd mouth decoded duration exceeds bound');for(let i=0;i<bytes.length;i+=4)requireMatch(Number.isFinite(bytes.readFloatLE(i)),'Nonfinite crowd mouth PCM');decoded={pcmSha256:textHash(bytes),sampleCount,durationSeconds:sampleCount/24000};return bytes;};const energy=vm.runInNewContext('('+lines[0]+')',{ffmpeg:decode,Float32Array,Math},{timeout:1000})(mp3);requireMatch(calls===1&&decoded&&found.decoded.pcmSha256===decoded.pcmSha256&&found.decoded.sampleCount===decoded.sampleCount&&found.decoded.durationSeconds===decoded.durationSeconds&&energy.mouthHz===40&&energy.durationSeconds===decoded.durationSeconds&&sameJson(Array.from(energy.mouthEnergy),found.measurement.mouthEnergy),'Crowd mouth bins differ from actual final MP3');rows[clip.clipId]={clipId:clip.clipId,voiceId:clip.voiceId,actorId:clip.actorId,profileId:clip.profileId,referenceSha256:clip.referenceSha256,text:clip.text,english:clip.english,file:clip.file,sha256:clip.sha256,encodedReceiptSha256:clip.encodedReceiptSha256,pcmSha256:decoded.pcmSha256,sampleCount:decoded.sampleCount,durationSeconds:decoded.durationSeconds,mouthHz:40,mouthEnergy:Array.from(energy.mouthEnergy),energySha256:textHash(Buffer.from(energy.mouthEnergy))};}
 requireMatch(hash(ffmpegPath)===cityEnergyFfmpegSha256&&hash(builderPath)===admissionRecipeBuilderSha256,'Crowd mouth decoder/recipe changed during admission');const supplement={kind:'crowd-final-mp3-mouth-energy-supplement-v1',recipeBuilderSha256:measurement.recipeFileSha256,recipeCanonicalBuilderSha256:cityEnergyCanonicalBuilderSha256,admissionRecipeBuilderSha256,recipeLineSha256:cityEnergyLineSha256,ffmpegSha256:cityEnergyFfmpegSha256,measurementSha256,clips:rows};crowdMouthEnergyRows(supplement,manifests,sourceRoot);crowdRecordingsBlock(cast,manifests,sourceRoot,sourceRoot,rows);const bytes=JSON.stringify(supplement,null,2)+'\n',anchor='const crowdMouthEnergyReceipt=Object.freeze('+JSON.stringify({[crowdMouthEnergyPath]:textHash(bytes)})+');\n',nextCatalog=catalogSource.replace('const recordings=Object.freeze({',()=>anchor+'const recordings=Object.freeze({');requireMatch(nextCatalog.includes(anchor)&&readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n')===catalogSource,'Catalog changed before crowd mouth admission');let installed=false;try{writeFileSync(supplementTemporary,bytes,{flag:'wx'});renameSync(supplementTemporary,supplementPath);installed=true;writeFileSync(catalogTemporary,nextCatalog,{flag:'wx'});renameSync(catalogTemporary,catalogPath);}catch(error){if(existsSync(catalogTemporary))unlinkSync(catalogTemporary);if(existsSync(supplementTemporary))unlinkSync(supplementTemporary);if(installed)unlinkSync(supplementPath);throw error}return{clips:7,supplement:crowdMouthEnergyPath,sha256:textHash(bytes),catalogSync:'REQUIRED',cityRows:'UNCHANGED'};
}
export function admitCityMouthEnergy(cast,measurement,measurementSha256,ffmpegPath,sourceRoot=root){
 const catalogPath=resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),catalogSource=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n');
 requireMatch(!catalogSource.match(cityMouthEnergyPattern),'City mouth supplement already admitted');
 const supplementPath=resolve(sourceRoot,cityMouthEnergyPath),supplementTemporary=supplementPath+'.city-mouth.tmp',catalogTemporary=catalogPath+'.city-mouth.tmp';
 requireMatch(!existsSync(supplementPath)&&!existsSync(supplementTemporary)&&!existsSync(catalogTemporary)&&!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1,'Occupied or linked city mouth destination');
 const admissions=cityAdmissions(catalogSource),directory=resolve(sourceRoot,'assets/voices/city-dialogue');
 const manifests=readdirSync(directory).filter(name=>name.endsWith('-manifest.json')).sort().map(name=>{const path=`assets/voices/city-dialogue/${name}`,sha256=hash(resolve(sourceRoot,path));requireMatch(admissions[path]===sha256,'Unadmitted city mouth source manifest');return {...json(resolve(sourceRoot,path)),provenanceManifest:path,provenanceManifestSha256:sha256}});
 const clips=manifests.flatMap(manifest=>manifest.clips).sort((a,b)=>a.clipId.localeCompare(b.clipId));
 requireMatch(clips.length===43&&measurementSha256===cityEnergyMeasurementSha256&&measurement.kind==='city-final-mp3-mouth-energy-43-measurement-candidate-v2'&&measurement.status==='MEASURED CANDIDATE ONLY'&&measurement.admission==='NOT PERFORMED'&&measurement.decodeCalls===42&&measurement.reusedPilotCount===1&&measurement.inputSha256==='f25db16689246c7aabdcdc3540d4588760eaf12ef4ab8c29043f3bcbf022f7fa'&&measurement.recipeFileSha256===cityEnergyBuilderSha256&&measurement.recipeFunctionLineSha256===cityEnergyLineSha256&&measurement.ffmpegSha256===cityEnergyFfmpegSha256&&measurement.results.length===43&&sameJson(measurement.sourceBefore,measurement.sourceAfter)&&measurement.sourceBefore.catalogSha256===textHash(catalogSource),'Foreign/incomplete city mouth measurement');
 requireMatch(sameJson(measurement.results.map(row=>row.clipId).sort(),clips.map(row=>row.clipId).sort()),'Missing/extra measured city clip');
 const measured=new Map(measurement.results.map(row=>[row.clipId,row]));
 requireMatch(measured.size===43&&hash(ffmpegPath)===cityEnergyFfmpegSha256,'Foreign city mouth decoder');
 const builderPath=resolve(sourceRoot,'tools/build-neighbor-voices.mjs'),builder=readFileSync(builderPath,'utf8');
 const admissionRecipeBuilderSha256=hash(builderPath);
 // The measured Windows source and committed LF source differ only by CRLF.
 // Keep the original measurement pin and accept only these two exact files.
 requireMatch([cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(admissionRecipeBuilderSha256)&&textHash(builder.replace(/\r\n/g,'\n'))===cityEnergyCanonicalBuilderSha256,'City mouth builder drift');
 const lines=builder.split(/\r?\n/).filter(line=>line.startsWith('function energy(path){'));
 requireMatch(lines.length===1&&textHash(lines[0])===cityEnergyLineSha256,'City mouth energy function drift');
 requireMatch(new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4,'City mouth PCM endian drift');
 cityRecordingsBlock(cast,manifests,sourceRoot,sourceRoot);
 const began=Date.now(),rows={};
 for(const clip of clips){
  requireMatch(Date.now()-began<600000,'City mouth admission decoder wall budget');
  const found=measured.get(clip.clipId),manifest=manifests.find(row=>row.clips.some(item=>item.clipId===clip.clipId));
  requireMatch(found&&found.sha256===clip.sha256&&found.voiceId===clip.voiceId&&found.actorId===clip.actorId&&found.profileId===clip.profileId&&found.manifestSha256===manifest.provenanceManifestSha256,'Foreign measured city identity/manifest');
  const mp3=resolve(sourceRoot,clip.file);requireMatch(hash(mp3)===clip.sha256,'City mouth MP3 changed');
  let decoded=null,calls=0;
  const decode=(args,binary)=>{
   requireMatch(binary&&calls++===0&&sameJson(Array.from(args),['-hide_banner','-loglevel','error','-i',mp3,'-f','f32le','-ac','1','-ar','24000','pipe:1']),'Changed city mouth decoder request');
   const result=spawnSync(ffmpegPath,['-nostdin','-threads','1',...args],{encoding:null,windowsHide:true,timeout:10000,maxBuffer:1048576});
   requireMatch(!result.error&&result.status===0&&!result.signal&&result.stdout?.length>0&&result.stdout.length<=1048576&&result.stdout.length%4===0,'City mouth decoder failed');
   const bytes=result.stdout,sampleCount=bytes.length/4;requireMatch(sampleCount<=240000,'City mouth decoded duration exceeds bound');
   for(let i=0;i<bytes.length;i+=4)requireMatch(Number.isFinite(bytes.readFloatLE(i)),'Nonfinite city mouth PCM');
   decoded={pcmSha256:textHash(bytes),sampleCount,durationSeconds:sampleCount/24000};return bytes;
  };
  const energy=vm.runInNewContext('('+lines[0]+')',{ffmpeg:decode,Float32Array,Math},{timeout:1000})(mp3);
  requireMatch(calls===1&&decoded&&found.decoded.pcmSha256===decoded.pcmSha256&&found.decoded.sampleCount===decoded.sampleCount&&found.decoded.durationSeconds===decoded.durationSeconds&&energy.mouthHz===40&&energy.durationSeconds===decoded.durationSeconds&&sameJson(Array.from(energy.mouthEnergy),found.measurement.mouthEnergy),'City mouth bins differ from actual final MP3');
  rows[clip.clipId]={clipId:clip.clipId,voiceId:clip.voiceId,actorId:clip.actorId,profileId:clip.profileId,file:clip.file,sha256:clip.sha256,encodedReceiptSha256:manifest.cityProvenance.takes[clip.clipId].encoded.sha256,pcmSha256:decoded.pcmSha256,sampleCount:decoded.sampleCount,durationSeconds:decoded.durationSeconds,mouthHz:40,mouthEnergy:Array.from(energy.mouthEnergy),energySha256:textHash(Buffer.from(energy.mouthEnergy))};
 }
 requireMatch(hash(ffmpegPath)===cityEnergyFfmpegSha256&&hash(builderPath)===admissionRecipeBuilderSha256,'City mouth decoder/recipe changed during admission');
 const supplement={kind:'city-final-mp3-mouth-energy-supplement-v1',recipeBuilderSha256:cityEnergyBuilderSha256,recipeCanonicalBuilderSha256:cityEnergyCanonicalBuilderSha256,admissionRecipeBuilderSha256,recipeLineSha256:cityEnergyLineSha256,ffmpegSha256:cityEnergyFfmpegSha256,measurementSha256,clips:rows};
 cityMouthEnergyRows(supplement,manifests,sourceRoot);
 cityRecordingsBlock(cast,manifests,sourceRoot,sourceRoot,supplement);
 const bytes=JSON.stringify(supplement,null,2)+'\n',anchor='const cityMouthEnergyReceipt=Object.freeze('+JSON.stringify({[cityMouthEnergyPath]:textHash(bytes)})+');\n';
 const nextCatalog=catalogSource.replace('const recordings=Object.freeze({',()=>anchor+'const recordings=Object.freeze({');
 requireMatch(nextCatalog.includes(anchor)&&readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n')===catalogSource,'Catalog changed before city mouth admission');
 let installed=false;
 try{writeFileSync(supplementTemporary,bytes,{flag:'wx'});renameSync(supplementTemporary,supplementPath);installed=true;
  writeFileSync(catalogTemporary,nextCatalog,{flag:'wx'});renameSync(catalogTemporary,catalogPath);
 }catch(error){if(existsSync(catalogTemporary))unlinkSync(catalogTemporary);if(existsSync(supplementTemporary))unlinkSync(supplementTemporary);if(installed)unlinkSync(supplementPath);throw error}
 return {clips:43,supplement:cityMouthEnergyPath,sha256:textHash(bytes),catalogSync:'REQUIRED',listening:'NOT RUN',browserClockAlignment:'NOT VERIFIED'};
}
export function prepareCityManifest(cast,voiceId,reviewRoot,authoringHelperPath,authorization,sourceRoot=root){
 requireMatch(/^stadt-[a-z-]+$/.test(voiceId),'Unsafe city proposal voice');
 const base=realpathSync(reviewRoot),requestPath=realpathSync(resolve(base,voiceId,'requests.json'));
 requireMatch(requestPath.startsWith(base+sep),'City proposal request escapes private review');
 const request=json(requestPath),authored=new Map(cityDialogueSources(cast,sourceRoot).map(row=>[row.clipId,row]));
 requireMatch(Array.isArray(request.jobs)&&request.jobs.length>0&&request.jobs.length<=4&&request.jobs.every(row=>row.voiceId===voiceId&&sameJson(row,authored.get(row.clipId))),'Wrong city proposal frozen request');
 requireMatch(sameJson(Object.keys(authorization).sort(),['clips','date','instruction','scope','status'])&&authorization.status==='user-approved'&&authorization.scope==='whole-game-fixed-voice-cloning'&&typeof authorization.instruction==='string'&&authorization.instruction.trim().length>0&&/^\d{4}-\d{2}-\d{2}$/.test(authorization.date)&&authorization.clips&&Object.keys(authorization.clips).length>0&&Object.entries(authorization.clips).every(([id,sha256])=>request.jobs.some(row=>row.clipId===id)&&/^[a-f0-9]{64}$/.test(sha256)),'City proposal needs explicit clip/hash-scoped real use authorization');
 const clips=[],heldPrivate=[];
 for(const job of request.jobs){
  if(!Object.hasOwn(authorization.clips,job.clipId)){heldPrivate.push({...job,reason:'not selected for this admission; selected production caption fallback'});continue;}
  const receiptPath=realpathSync(resolve(base,voiceId,'encoded',job.clipId+'.json'));
  requireMatch(receiptPath.startsWith(base+sep),'City proposal encoded receipt escapes private review');
  const receipt=json(receiptPath);
  requireMatch(receipt.sha256===authorization.clips[job.clipId],'City proposal authorization does not match encoded receipt');
  const {status,date,instruction,scope}=authorization;
  clips.push({...receipt,approval:{status,date,instruction,scope,clipId:job.clipId,encodedSha256:receipt.sha256}});
 }
 const manifest={voiceId,requestedLineCount:request.jobs.length,generatedLineCount:request.jobs.filter(job=>existsSync(resolve(base,voiceId,'raw',job.clipId+'.json'))).length,clips,heldPrivate};
 return cityManifestProof(cast,manifest,reviewRoot,authoringHelperPath,sourceRoot);
}
export function cityAdmissionRoots(reviewRoot,authoringRoot,destinationRoot=root){
 const roots=[['private review',realpathSync(reviewRoot)],['frozen authoring',realpathSync(authoringRoot)],['current destination',realpathSync(destinationRoot)]];
 const key=path=>process.platform==='win32'?path.toLocaleLowerCase('en-US'):path;
 const nested=(child,parent)=>{child=key(child);parent=key(parent);return child===parent||child.startsWith(parent.endsWith(sep)?parent:parent+sep)};
 for(let i=0;i<roots.length;i++)for(let j=i+1;j<roots.length;j++)requireMatch(!nested(roots[i][1],roots[j][1])&&!nested(roots[j][1],roots[i][1]),`City ${roots[i][0]} and ${roots[j][0]} roots alias or nest`);
 return Object.fromEntries(roots.map(([name,path])=>[name,path]));
}
export function admitCityManifest(cast,manifest,reviewRoot,authoringHelperPath,authoringRoot,destinationRoot=root){
 const separated=cityAdmissionRoots(reviewRoot,authoringRoot,destinationRoot),compatibility=verifyCityAdmissionTarget(cast,separated['frozen authoring'],separated['current destination']),sourceRoot=compatibility.authoringRoot;
 const authoringCast=json(resolve(sourceRoot,'For-AI/VOICE-CAST.json'));
 requireMatch(realpathSync(authoringHelperPath)===realpathSync(resolve(sourceRoot,'tools/build-knick-voice.py')),'City producer helper must come from frozen723 authoring root');
 const verified=cityManifestProof(authoringCast,manifest,reviewRoot,authoringHelperPath,sourceRoot),request=citySnapshot(verified.cityProvenance?.request,'request'),targetById=new Map(compatibility.targetRows.map(row=>[row.clipId,row]));
 requireMatch(request.jobs.every(job=>sameJson(job,targetById.get(job.clipId))),'City admission job differs from current destination source/profile/English');
 requireMatch(verified.clips.length>0,'City admission requires an eligible recording');
 const directory=resolve(destinationRoot,'assets/voices/city-dialogue');
 const parent=realpathSync(resolve(destinationRoot,'assets/voices'));
 requireMatch(parent.startsWith(realpathSync(destinationRoot)+sep),'City asset parent escapes runtime');
 if(existsSync(directory))requireMatch(!lstatSync(directory).isSymbolicLink()&&realpathSync(directory).startsWith(parent+sep),'Linked city asset directory');
 const bytes=JSON.stringify(verified,null,2)+'\n',relative=`assets/voices/city-dialogue/${verified.voiceId}-manifest.json`,manifestPath=resolve(destinationRoot,relative),manifestTemporary=manifestPath+'.city-admit.tmp',created=[];
 const catalogPath=resolve(destinationRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),catalogSource=readFileSync(catalogPath,'utf8'),admissions=cityAdmissions(catalogSource),catalogTemporary=catalogPath+'.city-admit.tmp';
 requireMatch(!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1&&!existsSync(catalogTemporary),'Linked catalog or occupied city admission temporary file');
 const priorManifest=existsSync(manifestPath)?readFileSync(manifestPath,'utf8'):null;
 if(priorManifest!==null){requireMatch(admissions[relative]===textHash(priorManifest),'Existing city manifest has no authentic admission anchor');const prior=JSON.parse(priorManifest);requireMatch([...prior.clips,...prior.heldPrivate].every(row=>[...verified.clips,...verified.heldPrivate].some(next=>next.clipId===row.clipId))&&prior.clips.every(row=>verified.clips.some(next=>next.clipId===row.clipId&&next.sha256===row.sha256)),'City admission cannot discard prior slots or replace an admitted take');}
 admissions[relative]=textHash(bytes);
 const anchor='const cityAdmissionReceipts=Object.freeze('+JSON.stringify(admissions)+');\n';
 const nextCatalog=catalogSource.match(cityAdmissionPattern)?catalogSource.replace(cityAdmissionPattern,()=>anchor):catalogSource.replace('const recordings=Object.freeze({',()=>anchor+'const recordings=Object.freeze({');
 requireMatch(nextCatalog.includes(anchor),'Missing existing recording catalog anchor');
 for(const clip of verified.clips){const path=resolve(destinationRoot,clip.file);if(existsSync(path))requireMatch(!lstatSync(path).isSymbolicLink()&&lstatSync(path).nlink===1&&hash(path)===clip.sha256,'City admission refuses to replace an existing different/linked recording');}
 requireMatch(!existsSync(manifestTemporary),'Occupied city manifest temporary file');
 if(existsSync(manifestPath))requireMatch(!lstatSync(manifestPath).isSymbolicLink()&&lstatSync(manifestPath).nlink===1,'Linked city manifest');
 mkdirSync(directory,{recursive:true});
 let manifestInstalled=false;
 try{
  for(const clip of verified.clips){const target=resolve(destinationRoot,clip.file);if(!existsSync(target)){created.push(target);copyFileSync(resolve(reviewRoot,verified.voiceId,'encoded',clip.clipId+'.mp3'),target,constants.COPYFILE_EXCL)}requireMatch(hash(target)===clip.sha256,'City installed audio hash drift');}
  cityRecordingsBlock(cast,[{...verified,provenanceManifest:relative,provenanceManifestSha256:textHash(bytes)}],destinationRoot,destinationRoot);
  if(priorManifest!==bytes){created.push(manifestTemporary);writeFileSync(manifestTemporary,bytes,{flag:'wx'});renameSync(manifestTemporary,manifestPath);manifestInstalled=true;}
  requireMatch(readFileSync(manifestPath,'utf8')===bytes,'City installed manifest bytes drift');
  if(nextCatalog!==catalogSource){requireMatch(readFileSync(catalogPath,'utf8')===catalogSource,'Catalog changed during city admission');created.push(catalogTemporary);writeFileSync(catalogTemporary,nextCatalog,{flag:'wx'});renameSync(catalogTemporary,catalogPath)}
 }catch(error){if(manifestInstalled){if(priorManifest===null)unlinkSync(manifestPath);else{writeFileSync(manifestTemporary,priorManifest);renameSync(manifestTemporary,manifestPath)}}for(const file of created.reverse())if(existsSync(file))unlinkSync(file);throw error}
 return {voiceId:verified.voiceId,accepted:verified.clips.length,held:verified.heldPrivate.length,manifest:manifestPath,listening:'NOT RUN'};
}

// SOURCE FRAGMENT for the same curator as the reviewed v2 sanitizer.
// No CLI, synthesis, decoder, ASR, native manifest/export or write operation.
export function collectCrowd9PrivateManifestProposals(cast,authorityProof,terminalProofs,selectionProof=null,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Collector authority changed');
 const authority=json(authorityProof.path),phases=['plan','render','process'];
 requireMatch(authority.status==='ROOT_SEALED_FINITE_CROWD9'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.helperSha256===crowdAuthoringHelperSha256&&authority.maximumNativeCalls===9&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===18&&authority.automaticRetries===0,'Collector scope differs from actual first9 grant');
 const terminalHashes={};
 for(const phase of phases){
  const proof=terminalProofs?.[phase];requireMatch(proof?.sha256===hash(proof.path),'Missing/changed ROOT terminal evidence: '+phase);
  const terminal=json(proof.path);
  requireMatch(terminal.phase===phase&&terminal.specificationSha256===authorityProof.sha256&&terminal.producerSha256===authority.adapterSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&!terminal.supervisorError&&terminal.logsComplete===true&&Array.isArray(terminal.survivingOwnedChildren)&&terminal.survivingOwnedChildren.length===0&&Array.isArray(terminal.ownedCleanupKills)&&terminal.ownedCleanupKills.length===0&&Array.isArray(terminal.postflightPinFailures)&&terminal.postflightPinFailures.length===0&&terminal.postflightProtectedPinsChecked===Object.keys(authority.protectedPublicPins).length,'ROOT phase not completed/retired with preservation: '+phase);
  terminalHashes[phase]=proof.sha256;
 }
 requireMatch(hash(authority.requestPath)===authority.requestSha256,'Collector full36 native request changed');
 const fullPlan={text:readFileSync(authority.requestPath,'utf8'),sha256:authority.requestSha256},{plan,authored}=crowdFullPlan(cast,fullPlan,sourceRoot);
 requireMatch(sameJson(plan.sourceSha256,authority.sourceSha256),'Collector generation source pins differ');
 const family=resolve(authority.musicRoot,plan.privateReviewFamily);
 requireMatch(realpathSync(family)===family,'Collector private family canonical path changed');
 const privateFile=relative=>{const path=resolve(family,relative);requireMatch(path.startsWith(family+sep)&&realpathSync(path)===path&&!lstatSync(path).isSymbolicLink(),'Collector private path escaped or aliased');return path;};
 const summaries={},summaryHashes={};
 for(const phase of phases){
  const file=privateFile(`_batch9-control/${phase}-summary.json`),summary=json(file);
  requireMatch(summary.phase===phase&&summary.authoritySha256===authorityProof.sha256&&summary.adapterSha256===authority.adapterSha256&&summary.helperSha256===crowdAuthoringHelperSha256&&summary.publicExports===0&&summary.humanListeningVerified===false&&summary.automaticRetries===0&&summary.rows?.length===9,'Actual completed adapter summary missing/binding changed: '+phase);
  summaries[phase]=summary;summaryHashes[phase]=hash(file);
 }
 const selectedJobs=plan.jobs.filter(row=>Object.hasOwn(authority.tokenCaps,row.clipId));
 requireMatch(selectedJobs.length===9&&new Set(selectedJobs.map(row=>row.voiceId)).size===9&&selectedJobs.every(row=>row.region==='germany'&&row.slot===0),'Collector must account for exactly actual first9 Germany0 jobs');
 const allowedIds=new Set(selectedJobs.map(row=>row.clipId));
 for(const phase of ['render','process'])requireMatch(new Set(summaries[phase].rows.map(row=>row.clipId)).size===9&&summaries[phase].rows.every(row=>allowedIds.has(row.clipId)),'Duplicate/out-of-scope summary slot: '+phase);
 requireMatch(new Set(summaries.plan.rows.map(row=>row.voiceId)).size===9&&summaries.plan.rows.every(row=>selectedJobs.some(job=>job.voiceId===row.voiceId)),'Native plan summary voice coverage changed');
 let selection=null;const selections=new Map();
 if(selectionProof){
  requireMatch(selectionProof.sha256===hash(selectionProof.path),'ROOT clip/hash selection changed');selection=json(selectionProof.path);
  requireMatch(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&selection.instruction?.trim()&&Array.isArray(selection.clips),'Missing ROOT use selection');
  for(const row of selection.clips){requireMatch(allowedIds.has(row.clipId)&&!selections.has(row.clipId)&&/^[a-f0-9]{64}$/.test(row.encodedSha256),'Selection duplicate/outside actual first9');selections.set(row.clipId,row.encodedSha256);}
 }
 const proposals=[],inventory=[];let selectedCount=0,eligibleCount=0;
 for(const job of selectedJobs){
  const owned=plan.jobs.filter(row=>row.voiceId===job.voiceId),voice=job.voiceId;
  requireMatch(owned.length===4&&authored.has(job.clipId),'Invalid owned four-slot request');
  const requestPath=privateFile(`${voice}/requests.json`),requestHash=hash(requestPath),request=json(requestPath),planRow=summaries.plan.rows.find(row=>row.voiceId===voice);
  requireMatch(planRow.frozenRequestPath===requestPath&&planRow.sha256===requestHash&&summaries.plan.frozenRequestPins?.[requestPath]===requestHash&&request.requestedLineCount===4&&sameJson(request.jobs,owned)&&request.authoredPlanSha256===authority.requestSha256&&sameJson(request.sourceSha256,plan.sourceSha256)&&sameJson(request.authoredPlanSourceSha256,plan.sourceSha256),'Actual native four-slot plan changed');
  const pending=owned.filter(row=>row.clipId!==job.clipId).map(row=>({...row,reason:'not rendered; selected production fallback'}));
  for(const row of pending){
   for(const [folder,extension] of [['raw','json'],['raw','wav'],['encoded','json'],['encoded','mp3']])requireMatch(!existsSync(resolve(family,voice,folder,`${row.clipId}.${extension}`)),'One of the remaining27 has an artifact');
   requireMatch(!existsSync(resolve(family,voice,'encoded',`${row.clipId}-processed.wav`)),'One of the remaining27 has a native processing intermediate');
  }
  const rawPath=privateFile(`${voice}/raw/${job.clipId}.json`),raw=json(rawPath),rawHash=hash(rawPath),render=summaries.render.rows.find(row=>row.clipId===job.clipId),processed=summaries.process.rows.find(row=>row.clipId===job.clipId);
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.authoringHelperSha256===crowdAuthoringHelperSha256&&raw.requestSha256===requestHash&&raw.seed===71000&&raw.synthesisAttempt===1&&render.receiptSha256===rawHash&&render.rawSha256===raw.rawSha256&&render.profileId===job.profileId&&render.actualTakeWithinGrant===1&&render.globalHistoricalOrdinal===null&&render.nativeEosReached===(raw.decode?.eosReached===true)&&processed.receiptSha256===rawHash&&processed.rawSha256===raw.rawSha256,'Actual raw receipt/summary ownership or first-take evidence changed');
  requireMatch(hash(privateFile(`${voice}/raw/${job.clipId}.wav`))===raw.rawSha256,'Actual raw audio hash changed');
  const gates=[];let encoded=null,encodedHash=null;
  if(raw.decode?.eosReached!==true){
   gates.push('missing or failed native EOS');
   requireMatch(processed.asrReadings===0&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.json`))&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.mp3`))&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}-processed.wav`)),'Non-EOS take unexpectedly encoded or audited');
  }else{
   const path=privateFile(`${voice}/encoded/${job.clipId}.json`);encoded=json(path);encodedHash=hash(path);
   requireMatch(processed.encodedReceiptSha256===encodedHash&&processed.encodedSha256===encoded.sha256&&Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&encoded.rawSha256===raw.rawSha256&&encoded.requestSha256===requestHash&&encoded.authoringHelperSha256===crowdAuthoringHelperSha256,'Actual final encoding receipt/summary changed');
   requireMatch(hash(privateFile(`${voice}/encoded/${job.clipId}.mp3`))===encoded.sha256,'Actual encoded bytes changed');
   requireMatch(processed.asrWordExact===encoded.asrWordExact&&processed.asrReadings===encoded.asrReadings?.length&&processed.wordCueCount===encoded.wordCues?.length&&processed.levelsPass===(Math.abs(encoded.integratedLufs+18)<=.3&&encoded.truePeakDbtp<=-1.5),'Actual final gates differ from completed process summary');
   if(encoded.asrWordExact!==true)gates.push('independent spoken-word equivalence');
   if(encoded.asrLiteralWordExact!==true)gates.push('literal exact ASR required by current first9 contract');
   if(Math.abs(encoded.integratedLufs+18)>.3||!Number.isFinite(encoded.integratedLufs)||encoded.truePeakDbtp>-1.5||!Number.isFinite(encoded.truePeakDbtp))gates.push('encoded loudness/true peak');
   try{crowdExactCues(encoded);}catch(error){requireMatch(error.message==='Incomplete crowd exact final-caption cues','Unexpected caption integrity error');gates.push('incomplete exact final-caption cues');}
  }
  const eligible=gates.length===0;if(eligible){fixedTakeAuthority(cast,encoded);eligibleCount++;}
  const selected=selections.has(job.clipId);
  requireMatch(!selected||eligible&&selections.get(job.clipId)===encoded.sha256,'ROOT selection includes a failed candidate or wrong encoded hash');
  let proposal;
  if(selected){
   const approval={status:'user-approved',scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256};
   const {asrReadings,...actualEncodedFields}=encoded;
   proposal=prepareCrowdDefaultManifest(cast,{schemaVersion:1,voiceId:voice,profileId:job.profileId,requestedLineCount:4,generatedLineCount:1,lineCount:1,clips:[{...actualEncodedFields,approval}],heldPrivate:pending},authorityProof,sourceRoot);
   selectedCount++;
  }else{
   const held={...job,reason:eligible?'technically verified; awaiting clip/hash-specific use selection':'held private; selected production fallback',failedGates:gates};
   proposal={schemaVersion:1,voiceId:voice,profileId:job.profileId,fallback:cast.productionVoices[voice].fallback??'captions',status:'private partial proposal; no default admission',requestedLineCount:4,generatedLineCount:1,lineCount:0,clips:[],heldPrivate:[held,...pending],approvedExistingReuse:[]};
  }
  proposals.push(proposal);
  inventory.push({clipId:job.clipId,voiceId:voice,rawReceiptSha256:rawHash,rawSha256:raw.rawSha256,nativeEosReached:raw.decode?.eosReached===true,encodedReceiptSha256:encodedHash,encodedSha256:encoded?.sha256??null,technicalEligible:eligible,selectedForUse:selected,failedGates:gates,unrenderedOwnedSlots:3,humanListeningVerified:false});
 }
 requireMatch(proposals.length===9&&proposals.reduce((n,row)=>n+row.requestedLineCount,0)===36&&proposals.reduce((n,row)=>n+row.generatedLineCount,0)===9&&proposals.every(row=>row.clips.length+row.heldPrivate.length===4),'Nine partial manifests do not account for genuine36 scope');
 return {status:'private proposal collection only; no public copy/write/admission',authoritySha256:authorityProof.sha256,nativeFullPlanSha256:authority.requestSha256,terminalSha256:terminalHashes,adapterSummarySha256:summaryHashes,selectionSha256:selectionProof?.sha256??null,counts:{requested:36,generated:9,unrendered:27,technicalEligible:eligibleCount,selectedClips:selectedCount,heldGenerated:9-selectedCount,humanListeningVerified:0},inventory,partialManifestProposals:proposals};
}

export function main(args=process.argv.slice(2)){
 requireMatch(!(args.includes('--sync')&&args.includes('--rename-production')),'Rename production profiles first, then sync their verified bindings');
 const value=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
 const cast=json(resolve(root,'For-AI/VOICE-CAST.json'));
 requireMatch(new Set(Object.values(cast.productionVoices).map(p=>p.profileId)).size===Object.keys(cast.productionVoices).length,'Production characters share a profile UUID');
 const cityProposal=value('--prepare-city-manifest'),cityAdmission=value('--admit-city-manifest'),cityMouthAdmission=value('--admit-city-mouth-energy');
 const crowdMouthAdmission=value('--admit-crowd-mouth-energy');
 const crowdMouthMeasurement=value('--measure-crowd-mouth-energy');
 if(crowdMouthMeasurement){requireMatch(!crowdMouthAdmission&&!cityMouthAdmission&&!cityProposal&&!cityAdmission&&!args.includes('--sync')&&value('--crowd-mouth-ffmpeg'),'Crowd mouth measurement requires its pinned decoder and cannot sync/admit');console.log(JSON.stringify(measureCrowdMouthEnergy(cast,resolve(value('--crowd-mouth-ffmpeg')),resolve(crowdMouthMeasurement))));return;}
 if(crowdMouthAdmission){requireMatch(!cityMouthAdmission&&!cityProposal&&!cityAdmission&&!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&value('--crowd-mouth-ffmpeg'),'Crowd mouth admission requires measured receipt and pinned decoder, then separate catalog sync');const path=resolve(crowdMouthAdmission);console.log(JSON.stringify(admitCrowdMouthEnergy(cast,json(path),hash(path),resolve(value('--crowd-mouth-ffmpeg')))));return;}
 if(cityMouthAdmission){
  requireMatch(!cityProposal&&!cityAdmission&&!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&value('--city-mouth-ffmpeg'),'City mouth admission requires measured receipt and pinned decoder, then separate catalog sync');
  const path=resolve(cityMouthAdmission);console.log(JSON.stringify(admitCityMouthEnergy(cast,json(path),hash(path),resolve(value('--city-mouth-ffmpeg')))));return;
 }
 if(cityProposal){
  requireMatch(!cityAdmission&&!args.includes('--sync')&&value('--city-review-root')&&value('--city-authoring-helper')&&value('--city-use-authorization'),'City proposal requires explicit private proof and use authorization, without sync/admission');
  console.log(JSON.stringify(prepareCityManifest(cast,cityProposal,resolve(value('--city-review-root')),resolve(value('--city-authoring-helper')),json(resolve(value('--city-use-authorization')))),null,2));return;
 }
 if(cityAdmission){
  requireMatch(!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&value('--city-review-root')&&value('--city-authoring-helper')&&value('--city-authoring-root'),'City admission requires explicit proof, frozen authoring root, and helper paths; destination is this checkout');
  console.log(JSON.stringify(admitCityManifest(cast,json(resolve(cityAdmission)),resolve(value('--city-review-root')),resolve(value('--city-authoring-helper')),resolve(value('--city-authoring-root')),root)));return;
 }
 const manifest=json(resolve(root,'assets/voices/candidate-dialogue/manifest.json'));
 const catalogPath=resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js');let source=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n');
 const crowdDir=resolve(root,'assets/voices/candidate-dialogue'),crowdAdmitted=crowdAdmissions(source),crowdManifests=readdirSync(crowdDir).filter(name=>name.endsWith('-crowd-manifest.json')).sort().map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`,file=resolve(root,relative),sha256=hash(file),manifest=json(file);if(manifest.clips.some(clip=>clip.approval?.status==='user-approved'))requireMatch(crowdAdmitted[relative]===sha256,'Crowd default manifest lacks verified ROOT private admission');return {...manifest,provenanceManifest:relative,provenanceManifestSha256:sha256};});
 const crowdBlock=crowdCandidateBlock(cast,crowdManifests,root),crowdPattern=/const crowdCandidateDialogue=Object\.freeze\(\{[^\n]*\}\);\n/;
 if(args.includes('--sync'))source=source.replace(crowdPattern,()=>crowdBlock);
 else requireMatch(source.match(crowdPattern)?.[0]===crowdBlock,'Crowd candidate projection stale; run --sync');
 const crowdMouth=crowdMouthEnergyFromCatalog(source,crowdManifests,root);
 const crowdDefaults=crowdRecordingsBlock(cast,crowdManifests,root,root,crowdMouth),crowdDefaultsPattern=/const crowdRecordings=Object\.freeze\([^\n]*\);\n/;
 if(args.includes('--sync')){
  source=source.replace(crowdDefaultsPattern,'').replace('const recordings=Object.freeze({',()=>crowdDefaults+'const recordings=Object.freeze({');
  if(!source.includes(' ...crowdRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...crowdRecordings,');
 }else requireMatch(source.match(crowdDefaultsPattern)?.[0]===crowdDefaults,'Owned crowd default projection stale; run --sync');
 const marker=/\/\/ Generated by tools\/curate-voice-library\.mjs --sync from VOICE-CAST\.json\.\n[\s\S]*?function productionClip\(clip\)\{[^\n]+\}\n/;
 const expected=runtimeBlock(cast);
 if(args.includes('--sync')){source=source.replace(marker,'');source=source.replace('const legacyVoices=',()=>expected+'const legacyVoices=');}
 else requireMatch(source.match(marker)?.[0]===expected,'Runtime voice bindings stale; run --sync');
 if(args.includes('--sync')){
  const publicExport=/(window\.GermanySimulatorAudioText=Object\.freeze\(\{\n)(?: cityDialogue,\n)?/;
  requireMatch(publicExport.test(source),'Missing audio catalog public export');
  source=source.replace(publicExport,'$1 cityDialogue,\n');
 }

 const neighborDir=resolve(root,'assets/voices/neighbors');
 const neighborManifests=existsSync(neighborDir)?readdirSync(neighborDir).filter(name=>name.endsWith('-manifest.json')).sort().map(name=>({...json(resolve(neighborDir,name)),provenanceManifest:`assets/voices/neighbors/${name}`})):[];
 const neighborBlock=neighborRecordingsBlock(cast,neighborManifests),neighborPattern=/const neighborRecordings=Object\.freeze\([^\n]*\);\n/;
 if(args.includes('--sync')){
  source=source.replace(neighborPattern,'').replace('const recordings=Object.freeze({',()=>neighborBlock+'const recordings=Object.freeze({');
  if(!source.includes(' ...neighborRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...neighborRecordings,');
  source=source.replace('Object.entries(legacyVoices)','Object.entries({...legacyVoices,...neighborVoices})');
 }else requireMatch(source.match(neighborPattern)?.[0]===neighborBlock,'Neighbor recording lookup stale; run --sync');
 const rulesBlock=streetRulesBlock(source),rulesPattern=/const streetRuleClips=Object\.freeze\(\{[^\n]*\}\);\n/;
 if(args.includes('--sync')){source=source.replace(rulesPattern,'').replace('const trafficDialogue=',()=>rulesBlock+'const trafficDialogue=');source=source.replace('const clips=Object.freeze({...trafficDialogue,','const clips=Object.freeze({...streetRuleClips,...trafficDialogue,');}
 else requireMatch(source.match(rulesPattern)?.[0]===rulesBlock,'Street rule bindings stale; run --sync');
 const knickPath=resolve(root,'assets/voices/knick/manifest.json');
 if(existsSync(knickPath)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const clips=[];
  for(const path of ['assets/voices/knick/manifest.json','assets/voices/knick/ambient-manifest.json','assets/voices/knick/queue-call-manifest.json','assets/voices/knick/phone-reactions-manifest.json','assets/voices/knick/phone-dismissal-manifest.json'].filter(path=>existsSync(resolve(root,path)))){
   const manifest=json(resolve(root,path));
   // Unrendered and rejected lines have explicit selected-profile fallbacks.
   requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted Knick lines: ${path}`);
   clips.push(...manifest.clips.map(c=>({...c,provenanceManifest:path})));
  }
  const block=fixedRecordingsBlock(cast,{clips}),pattern=/const knickRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('knick',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...knickRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...knickRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Knick recording lookup stale; run --sync');
 }
 const streetDir=resolve(root,'assets/voices/street-wisdom');
 if(existsSync(streetDir)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const clips=[];
  for(const filename of readdirSync(streetDir).filter(name=>name.endsWith('-manifest.json')).sort()){
   const path=`assets/voices/street-wisdom/${filename}`,manifest=json(resolve(root,path));
   requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted street rules: ${path}`);
   clips.push(...manifest.clips.map(clip=>({...clip,provenanceManifest:path})));
  }
  const block=fixedRecordingsBlock(cast,{clips},'street-wisdom'),pattern=/const streetWisdomRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('street-wisdom',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...streetWisdomRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...streetWisdomRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Street rule recording lookup stale; run --sync');
 }
 const ambientDir=resolve(root,'assets/voices/office-ambient');
 if(existsSync(ambientDir)){
  const clips=[];
  for(const filename of readdirSync(ambientDir).filter(name=>name.endsWith('-manifest.json')).sort()){
   const path=`assets/voices/office-ambient/${filename}`,manifest=json(resolve(root,path));
   requireMatch(manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted ambient lines: ${path}`);
   clips.push(...manifest.clips.map(clip=>({...clip,provenanceManifest:path})));
  }
  const block=fixedRecordingsBlock(cast,{clips},'office-ambient'),pattern=/const officeAmbientRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('office-ambient',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...officeAmbientRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...officeAmbientRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Office ambient recording lookup stale; run --sync');
 }
 const repliesPath=resolve(root,'assets/voices/player-replies/spieler-hans-peter-mustermann-manifest.json');
 if(existsSync(repliesPath)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const manifest=json(repliesPath),clips=manifest.clips.map(clip=>({...clip,provenanceManifest:'assets/voices/player-replies/spieler-hans-peter-mustermann-manifest.json'}));
  requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,'Unaccounted player choices');
  const portraitPath='assets/voices/player-replies/spieler-hans-peter-mustermann-portrait-manifest.json';
  if(existsSync(resolve(root,portraitPath))){const portrait=json(resolve(root,portraitPath));requireMatch(portrait.clips.length===1&&portrait.requestedLineCount===1&&portrait.heldPrivate.length===0,'Incomplete continuous president monologue');clips.push(...portrait.clips.map(clip=>({...clip,provenanceManifest:portraitPath})));}
  const mirrorPath='assets/voices/player-replies/spieler-hans-peter-mustermann-mirror-manifest.json';
  if(existsSync(resolve(root,mirrorPath))){const mirror=json(resolve(root,mirrorPath));requireMatch(mirror.clips.length===1&&mirror.requestedLineCount===1&&mirror.heldPrivate.length===0,'Incomplete continuous mirror monologue');clips.push(...mirror.clips.map(clip=>({...clip,provenanceManifest:mirrorPath})));}
  const block=fixedRecordingsBlock(cast,{clips},'player-replies'),pattern=/const playerReplyRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('player-replies',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...playerReplyRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...playerReplyRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Player reply recording lookup stale; run --sync');
 }
 const cityDir=resolve(root,'assets/voices/city-dialogue');
 if(existsSync(cityDir)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const admissions=cityAdmissions(source);
  const manifests=readdirSync(cityDir).filter(name=>name.endsWith('-manifest.json')).sort().map(name=>{const path=`assets/voices/city-dialogue/${name}`,sha256=hash(resolve(root,path));requireMatch(admissions[path]===sha256,'City manifest has no verified private admission; use --admit-city-manifest');return {...json(resolve(root,path)),provenanceManifest:path,provenanceManifestSha256:sha256}});
  const supplement=cityMouthEnergyFromCatalog(source,manifests,root);
  const block=cityRecordingsBlock(cast,manifests,root,root,supplement),pattern=/const cityRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('city-dialogue',manifests.flatMap(manifest=>manifest.clips));
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...cityRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...cityRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'City recording lookup stale; run --sync');
 }
 const context={window:{},location:{search:'?voicePreview=1'},URLSearchParams};vm.runInNewContext(source,context);const catalog=context.window.GermanySimulatorAudioText;
 requireMatch(JSON.stringify(catalog.cityDialogue)===JSON.stringify(cityDialogueTable(cast)),'City dialogue public export missing/stale; run --sync');
 for(const [path,clip] of Object.entries(catalog.recordings)){
  if(clip.retiredReason)continue;
  // The compact playback projection omits generation receipt fields; manifests
  // and promotion validate complete receipts before this lookup is generated.
  requireMatch(matchesProduction(cast,clip,false),`Wrong default profile/renderer: ${clip.id}`);
  if(clip.sha256)requireMatch(hash(resolve(root,path))===clip.sha256,`Audio hash drift: ${clip.id}`);
 }
 const blocked=manifest.clips.filter(c=>!c.retiredReason&&!matchesProduction(cast,c));
 for(const clip of blocked){const path=catalog.candidateClip(clip.voiceId,clip.text);requireMatch(!path||path!==clip.path,`Old-profile candidate can play: ${clip.clipId}`);}
 const exe=value('--voice-exe'),data=value('--profile-data'),archiveArg=value('--archive-root');
 let archive;
 if(archiveArg){mkdirSync(resolve(archiveArg),{recursive:true});archive=realpathSync(archiveArg);const game=realpathSync(root);requireMatch(archive!==game&&!archive.startsWith(game+sep),'Private archive must stay outside game checkout');}
 requireMatch(!args.includes('--archive-assets')||archive,'Asset archive requires --archive-root');
 let profiles;
 if(exe){profiles=request(resolve(exe),'list').profiles;verifyProfiles(cast,profiles,data&&resolve(data));}
 // A failed receipt or live binding check must leave the playable catalogue intact.
 if(args.includes('--sync'))writeFileSync(catalogPath,source);
 if(args.includes('--rename-production')){
  requireMatch(exe,'Rename requires --voice-exe');
  const people=[...cast.characters,...cast.roleProfiles];
  for(const [voiceId,binding] of Object.entries(cast.productionVoices)){
   if(!binding.selection)continue;
   const person=people.find(p=>p.voiceId===voiceId),name=`GS ${person.fullName} (${voiceId})`;
   if(name===binding.profileName)continue;
   const renamed=request(resolve(exe),'rename',{voiceId:binding.profileId,name});requireMatch(renamed.id===binding.profileId&&renamed.name===name,'Rename not confirmed');
   binding.profileName=name;writeFileSync(resolve(root,'For-AI/VOICE-CAST.json'),JSON.stringify(cast,null,2)+'\n');
  }
  profiles=request(resolve(exe),'list').profiles;verifyProfiles(cast,profiles,data&&resolve(data));
 }
 if(args.includes('--archive-profiles')){
  requireMatch(exe&&data&&archive,'Archive requires --voice-exe, --profile-data and --archive-root');
  const base=realpathSync(data),privateArchive=resolve(archive);requireMatch(!privateArchive.startsWith(root+sep),'Private references must stay outside game checkout');
  const keep=new Set([...Object.values(cast.productionVoices).map(p=>p.profileId),...cast.productionExceptions.map(p=>p.profileId),...cast.preservedProfileIds]);
  const retiredIds=new Set(cast.retiredProfiles.map(p=>p.profileId));
  for(const id of retiredIds)requireMatch(!keep.has(id),`Cannot retire protected profile ${id}`);
  // Only explicitly curated IDs can be removed; discovery alone never authorizes deletion.
  const retired=profiles.filter(p=>retiredIds.has(p.id));
  const plans=retired.map(profile=>{
   requireMatch(/^[a-f0-9]{32}$/.test(profile.id),'Invalid profile UUID');
   const from=realpathSync(resolve(base,'profiles',profile.id));requireMatch(from.startsWith(base+sep),'Profile escapes data root');
   requireMatch(hash(originalFile(from))===profile.original_sha256&&hash(resolve(from,'reference.wav'))===profile.reference_sha256,'Retired reference hash mismatch');
   const destination=resolve(privateArchive,'profiles',profile.id),files=archiveFiles(from,destination);
   const receipt={profile,files,reason:'Unselected Germany Simulator legacy/duplicate profile; source identity and generated takes preserved.',castSha256:hash(resolve(root,'For-AI/VOICE-CAST.json'))};
   requireMatch(!existsSync(resolve(destination,'archive-receipt.json'))||!lstatSync(resolve(destination,'archive-receipt.json')).isSymbolicLink(),'Archive receipt is linked');
   writeArchiveMetadata(privateArchive,`profiles/${profile.id}/archive-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
   return {profile,files};
  });
  // Every reference is copied and verified before the first native deletion.
  for(const {profile} of plans){requireMatch(request(resolve(exe),'delete',{voiceId:profile.id}).deleted,`Delete not confirmed: ${profile.id}`);}
  profiles=request(resolve(exe),'list').profiles;verifyProfiles(cast,profiles,base);
  console.log(JSON.stringify({archivedProfiles:plans.map(p=>({id:p.profile.id,name:p.profile.name})),remainingProfiles:profiles.length}));
 }
 if(archive){
  const privateArchive=resolve(archive);mkdirSync(privateArchive,{recursive:true});
  const snapshots=['For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js','assets/voices/candidate-dialogue/manifest.json','assets/voices/amt-fever/manifest.json'];
  for(const path of snapshots)writeArchiveMetadata(privateArchive,'metadata/'+path,readFileSync(resolve(root,path)));
  const fever=json(resolve(root,'assets/voices/amt-fever/manifest.json'));
  const assets=[...manifest.clips.flatMap(c=>[c,...(c.previousCandidate?[c.previousCandidate]:[])]).filter(c=>c.retiredReason||!matchesProduction(cast,c)),...(manifest.retiredClips||[]),...fever.clips.filter(c=>c.retiredReason)];
  const receipts=[];
  for(const clip of assets){const from=resolve(root,clip.path),to=resolve(privateArchive,'assets',clip.path);requireMatch(from.startsWith(resolve(root,'assets/voices')+sep)&&to.startsWith(privateArchive+sep),'Invalid archive asset path');
   mkdirSync(dirname(to),{recursive:true});
   requireMatch(realpathSync(dirname(to)).startsWith(realpathSync(privateArchive)+sep)&&!realpathSync(dirname(to)).startsWith(realpathSync(root)+sep),'Archive directory escapes or aliases the game');
   if(existsSync(to))requireMatch(!lstatSync(to).isSymbolicLink()&&realpathSync(to).startsWith(realpathSync(privateArchive)+sep)&&!realpathSync(to).startsWith(realpathSync(root)+sep),'Archive audio is linked or aliases the game');
   if(existsSync(from)){requireMatch(lstatSync(from).isFile()&&!lstatSync(from).isSymbolicLink(),'Archive refuses linked audio');requireMatch(hash(from)===clip.sha256,`Archived asset hash mismatch: ${clip.clipId}`);if(!existsSync(to))copyFileSync(from,to);}
   requireMatch(hash(to)===clip.sha256,'Archived audio differs');receipts.push({...clip,archivePath:to});}
  writeArchiveMetadata(privateArchive,'asset-index.json',JSON.stringify({clips:receipts},null,2)+'\n');
  if(args.includes('--archive-assets')){
   for(const clip of assets){const from=resolve(root,clip.path);if(existsSync(from))unlinkSync(from);clip.archiveRelativePath='assets/'+clip.path;clip.retiredReason||='Superseded by the selected production profile on 2026-10-11; private archive retains exact audio and provenance.';}
   for(const [path,value] of [['assets/voices/candidate-dialogue/manifest.json',manifest],['assets/voices/amt-fever/manifest.json',fever]])writeFileSync(resolve(root,path),JSON.stringify(value,null,2)+'\n');
   const feverPattern=/const feverRecordings=Object\.freeze\((\{[^\n]+\})\);/;
   const entries=JSON.parse(source.match(feverPattern)[1]);for(const [path,clip] of Object.entries(entries))if(clip.retiredReason)delete entries[path];
   source=source.replace(feverPattern,()=>`const feverRecordings=Object.freeze(${JSON.stringify(entries)});`);writeFileSync(catalogPath,source);
   console.log(JSON.stringify({archivedAssets:assets.length}));
  }
 }
 console.log(JSON.stringify({productionCharacters:Object.keys(cast.productionVoices).length,sceneExceptions:cast.productionExceptions.length,blockedLegacyCandidates:blocked.length,archivedCandidates:manifest.clips.filter(c=>c.archiveRelativePath).length,liveProfilesVerified:profiles?true:false,liveProfileCount:profiles?.length}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
