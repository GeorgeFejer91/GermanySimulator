import {inspectRecovery as inspectTrafficLicenseRecovery,retired as verifyTrafficPrior,processTerminalAuthority as verifyTrafficProcess,encodedLicenseAuthority as verifyTrafficEncodedLicense,publicRecoveryAuthority as verifyTrafficPublic} from './traffic4-license-evidence.mjs';
const trafficLicenseRecoveryExpected={"mode":"traffic4-license-process-recovery01","proofSha256":"72d72f7ca99e4c22b4f6a79100dd6f6963d858024215125b0a2a8dab0a9803db","authoritySha256":"38931e93c555200d42cdf681c62b239d97bcbd10b9a51ed30564205dcca8080a","failedRenderTerminalSha256":"1b80c1a3b76b9fbd1fe3887f25feaa40d8df32144750c2ecbeb84affaf1a64b4","planTerminalSha256":"cb5e56a7e2d3deadbdade14b041b73f97fa82dff8ec16dc9a3f44e431c74e441","renderHelperSha256":"19e5bd4af9c9ea5390987c1331a7e33ded02f435d3638965e43055869cb7a7f9","renderAdapterSha256":"070c53649af8d5946e431a55b12018ad6791fe5b73047295dfb16800dbd404f5","processingHelperSha256":"19e5bd4af9c9ea5390987c1331a7e33ded02f435d3638965e43055869cb7a7f9","processingAdapterSha256":"8c1cc6dbbc9c8d066f9fd1bd03f2eb4eece885b1335603c7de7d46732020b6a1","originalNativeCalls":4,"additionalNativeCalls":0,"maximumAsrReadings":8,"automaticRetries":0,"postflightRecoveryPinCount":38,"resolution":{"status":"verified-existing-asset-license-resolution","metadataOwner":"For-AI/VOICE-CAST.json existingAssetProfiles","voiceId":"verkehr-dieter-hupfer","profileId":"093079ce208a4f7e8f0d50bb5170ea1f","referenceOriginalSha256":"9e1b68ae4440101bb804763ce1737498ff3ea22ee570eca151e122286e664bfc","referenceSha256":"b21959ef323483ad5c5eadcaf1ecdabe74b312d9ec9997a422ae21a8dfdbdbdd","license":"CC0-1.0","castSha256":"8f30c7f7f61396d9462b61affc9d2aa116218d1023d04a6b191634e2f44a134f","sourceComponents":[{"path":"assets/voices/thorsten-angry-nicht-weg.mp3","sha256":"61a7d884aef5d3029384f0bff3d0b78ae75464cdbdd9e848ac9020d48e94ebbf"},{"path":"assets/voices/thorsten-angry-duemmer.mp3","sha256":"66d2613ee3f5e9f6de1c6b41e16dc27b9776b26520a772235977074db1e88141"},{"path":"assets/voices/thorsten-angry-klappt-nicht.mp3","sha256":"853e5bd8f21336589461ab264eb3508be4a38c8dc75c7185aaa41c77bc3042f7"}],"originalRawReferenceLicense":"unknown; selected profile does not record reference license"},"rawReceipts":{"traffic-berlin-01":{"rawReceiptSha256":"f7628cb4484f9eedfbc7431e70508e26cdd44c10a88ab81c97fa11c537905c11","rawSha256":"252f5ef344e2719a50c25ad3d303229c20b9783bb9d988852256b591ee625b16","eosTraceSha256":"a25feebfa56ce959e38057929960994a5cce2c5d44f86c2d878e1b473eb88298"},"traffic-berlin-02":{"rawReceiptSha256":"554c98756341ee86acc6c0db3a57bffa2357ad6f9a952287d9de3dde728f3b60","rawSha256":"40b9063ddf1d441072b76c412a0a3ac05cf426da4f9b4187a87ebdc3d47fae1b","eosTraceSha256":"3a102e1c311e94a23347f7b881023b52c72f0c2e7cbd070d4c1c5112e80732a6"},"traffic-germany-01":{"rawReceiptSha256":"6b3e438e8c2c861e04736fd12acdd89650830ff551beece5b42a016ebaedeb2b","rawSha256":"04ae259102c86cef8eefafe363cfbba4eb91d7e993922f1ddadf183b52e13066","eosTraceSha256":"0518d4daf58dc5a017247ad92129b913853e07254db4bbdd1f4d55c29dfddd50"},"traffic-germany-02":{"rawReceiptSha256":"2c41977ea141e8fc1c2e9c88a2d9c75004424e4642cae7e02980ef7343924f35","rawSha256":"1a256d96f468b3313ed1cb4093458326e0bff9178187517bac2021c3f1bbf508","eosTraceSha256":"31a7f4e5ed18953b2b51a98a491c528c6d30760d10bd5176d77b54fe083ad7eb"}}};
import {validateContinuationReceipt as verifyPolice8Continuation} from './police8-continuation-evidence.mjs';
const police8ContinuationProofSha256='8d3bb36a2af1e16369fe7fcde592ee7ee41117df9a63b758d0f52d33828679a6',police8PriorResourceStopSha256='e42c456f245a31e7b0147c03d47b98c2cfb1ba759f1c9d3225a080e5f3af06ae';
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
  const generationScope=manifest.generationScope??'first9',voiceScope=voice+'\0'+generationScope;
  requireMatch(['first9','remaining27-first-takes','exact-ruediger-pilot-homophone'].includes(generationScope)&&owner&&binding&&owner.voiceId===voice&&Object.hasOwn(barks,voice)&&!seenVoices.has(voiceScope),'Crowd manifest has duplicate voice/grant scope or no actor-owned source/profile');seenVoices.add(voiceScope);
  if(generationScope==='remaining27-first-takes')requireMatch(manifest.generatedLineCount===3&&manifest.clips.every(clip=>!(clip.region==='germany'&&clip.slot===0))&&manifest.heldPrivate.filter(row=>row.region==='germany'&&row.slot===0&&row.reason==='outside remaining27 grant; first batch preserved').length===1,'Remaining27 cannot claim old Germany0 or miscount its actual generation');
  if(generationScope==='exact-ruediger-pilot-homophone')ruedigerPilotHomophoneManifestAuthority(cast,manifest,sourceRoot);
  requireMatch(manifest.profileId===binding.profileId&&manifest.requestedLineCount===4&&Array.isArray(manifest.clips)&&Array.isArray(manifest.heldPrivate)&&Number.isInteger(manifest.generatedLineCount)&&(generationScope==='exact-ruediger-pilot-homophone'?manifest.generatedLineCount===0:manifest.generatedLineCount>=manifest.clips.length)&&manifest.generatedLineCount<=4&&manifest.lineCount===manifest.clips.length,'Unaccounted crowd dialogue requests');
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
   if(generationScope!=='exact-ruediger-pilot-homophone')fixedTakeAuthority(cast,clip);
   requireMatch(clip.file===`assets/voices/candidate-dialogue/${expectedId}.mp3`&&hash(resolve(sourceRoot,clip.file))===clip.sha256,'Crowd candidate asset path or bytes changed');
   const key=voice+'\u0000'+clip.text;requireMatch(!seen.has(key),'Duplicate crowd candidate line');seen.add(key);entries[key]=clip.file;
  }
 }
 return 'const crowdCandidateDialogue=Object.freeze('+JSON.stringify(entries)+');\n';
}
// Sandale is a separate source scope; named-crowd grants never authorize it.
const sandaleScope='sandale-roles-v1';
const sandaleAuthoringHelperSha256='c40faafb6a62c5858b6a85c37d277b86d7d0efbdaf74ce61cc8b058a8524096c';
const sandaleRoles=[['herr-sandale','towel-man','tourist-guenther-liegestuhl','towelMan'],['frau-sandale','towel-woman','touristin-walburga-handtuch','towelWoman']];
export function sandaleSourceMap(cast,sourceRoot=root){
 const game=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),match=game.match(/const crowdArchetypes=(Object\.freeze\([\s\S]*?\));\r?\nconst crowdCharacterBarks=/),window={};
 requireMatch(match,'Missing Sandale archetype source');
 const archetypes=vm.runInNewContext(match[1]);vm.runInNewContext(readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),{window});
 requireMatch(Array.isArray(archetypes)&&archetypes.length===2&&new Set(archetypes.map(row=>row.id)).size===2,'Sandale archetype set changed');
 const rows=[];
 for(const [actorId,archetypeId,voiceId,pool] of sandaleRoles){
  const sources=archetypes.filter(row=>row.id===archetypeId),owners=cast.roleProfiles.filter(row=>row.gameRole===actorId),binding=cast.productionVoices[voiceId],english=window.GermanySimulatorAudioText?.pools?.[pool];
  requireMatch(sources.length===1&&sources[0].voiceId===voiceId&&owners.length===1&&owners[0].voiceId===voiceId&&owners[0].secretTunnelProfileId===binding?.profileId&&binding.fallback==='captions'&&Array.isArray(english)&&english.length===2,'Sandale role, voice, selected profile or subtitle pool drift');
  requireMatch(sameJson(Object.keys(sources[0].barks||{}).sort(),['berlin','germany'])&&owners[0].dialogueSources?.some(line=>line.includes(`crowdArchetypes[${archetypeId}].barks[region]`))&&owners[0].reference?.workingReferenceSha256===binding.originalSha256&&owners[0].reference?.license==='CC0-1.0'&&binding.renderer==='ResembleAI/Chatterbox Multilingual V2 0.1.7'&&binding.modelRevision==='5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'&&(binding.processing??null)===null,'Sandale source ownership, reference/license or dry recipe drift');
  for(const region of ['berlin','germany']){
   requireMatch(Array.isArray(sources[0].barks[region])&&sources[0].barks[region].length===2,'Sandale requires two exact lines per region');
   for(let slot=0;slot<2;slot++){
    const text=sources[0].barks[region][slot];requireMatch(typeof text==='string'&&text.trim()&&typeof english[slot]==='string'&&english[slot].trim(),'Missing Sandale text/subtitle');
    rows.push({clipId:`${voiceId}-${region}-${String(slot+1).padStart(2,'0')}`,voiceId,actorId,region,slot,sourceLocator:`game.js crowdArchetypes[id=${archetypeId}].barks.${region}[${slot}]`,text,english:english[slot],profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null});
   }
  }
 }
 requireMatch(rows.length===8&&new Set(rows.map(row=>row.clipId)).size===8,'Sandale exact eight-slot set changed');return new Map(rows.map(row=>[row.clipId,row]));
}
export function sandaleFullPlan(cast,snapshot,sourceRoot=root){
 requireMatch(typeof snapshot?.text==='string'&&snapshot.sha256===textHash(snapshot.text),'Sandale request bytes changed');
 const plan=JSON.parse(snapshot.text),authored=sandaleSourceMap(cast,sourceRoot),sourceFiles=['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'];
 requireMatch(plan.family==='crowd-dialogue'&&plan.sourceScope===sandaleScope&&plan.publicAssetFamily==='assets/voices/candidate-dialogue'&&plan.privateReviewFamily==='GermanySimulator crowd dialogue review 2026-10-15'&&plan.requestedLineCount===8&&plan.jobs?.length===8&&new Set(plan.jobs.map(row=>row.clipId)).size===8,'Not the exact Sandale request');
 requireMatch(sameJson(Object.keys(plan.sourceSha256||{}).sort(),sourceFiles.slice().sort())&&sourceFiles.every(path=>plan.sourceSha256[path]===hash(resolve(sourceRoot,path)))&&plan.authoringHelperSha256===sandaleAuthoringHelperSha256&&hash(resolve(sourceRoot,'tools/build-knick-voice.py'))===sandaleAuthoringHelperSha256,'Sandale current source/producer pins changed');
 requireMatch(plan.jobs.every(row=>authored.has(row.clipId)&&Object.keys(row).length===crowdPublicJobFields.length&&Object.entries(authored.get(row.clipId)).every(([key,value])=>sameJson(row[key],value))),'Sandale ordered source/English/owner/profile drift');
 return {plan,authored:new Map(plan.jobs.map(row=>[row.clipId,row]))};
}
function sandaleManifestSlots(cast,manifest,authored){
 const owned=[...authored.values()].filter(row=>row.voiceId===manifest.voiceId),records=[...(manifest.clips||[]),...(manifest.heldPrivate||[])];
 requireMatch(manifest.sourceScope===sandaleScope&&owned.length===4&&manifest.profileId===cast.productionVoices[manifest.voiceId]?.profileId&&manifest.requestedLineCount===4&&Array.isArray(manifest.clips)&&Array.isArray(manifest.heldPrivate)&&manifest.lineCount===manifest.clips.length&&Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=4&&records.length===4&&new Set(records.map(row=>row.clipId)).size===4,'Sandale per-voice accounting differs from four unique slots');
 for(const row of records){const job=owned.find(job=>job.clipId===row.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value)),'Sandale accepted/held source ownership drift');}
 requireMatch(manifest.heldPrivate.every(row=>typeof row.reason==='string'&&row.reason.trim()),'Sandale held reason missing');return owned;
}
function sandaleClipAuthority(cast,clip,proof,requestSha256,seed){
 fixedTakeAuthority(cast,clip);crowdExactCues(clip);
 requireMatch(clip.file===`assets/voices/candidate-dialogue/${clip.clipId}.mp3`&&clip.authoringHelperSha256===sandaleAuthoringHelperSha256&&clip.requestSha256===requestSha256&&clip.rendererInputText===clip.text&&clip.rendererInputBasis==='exact authored source'&&clip.synthesisAttempt===1&&clip.seed===seed,'Sandale is not the exact current first take');
 requireMatch(!['rescueParts','deliveryEditing','benchmarkOnly','recognitionVerification','actualInferenceText','nativeCompletion','exceptionAuthority','joinRetakeAuthority','codeSwitchParent','codeSwitchSegment'].some(key=>key in clip),'Unsupported Sandale edited/substituted take');
 const synth=clip.synthesis,decode=clip.decode,approval=clip.approval;
 requireMatch(synth?.languageId==='de'&&synth.device==='cuda'&&synth.precision==='fp16'&&synth.t3WeightPrecision==='float16'&&synth.conditioningPrecision==='float32'&&synth.referenceReconditionedForProfile===clip.profileId&&synth.referenceConditioningVerifiedFloat32===true&&synth.inferenceMode===true&&synth.cpuThreads===2&&synth.exaggeration===.5&&synth.temperature===.65&&synth.repetitionPenalty===3&&synth.cfgWeight===.6,'Sandale native recipe drift');
 requireMatch(decode?.eosReached===true&&decode.attentionHooksBefore===0&&decode.attentionHooksAfter===0&&Number.isInteger(decode.generatedSpeechTokens)&&decode.generatedSpeechTokens>0&&decode.generatedSpeechTokens<=decode.maxSpeechTokens&&decode.maxSpeechTokens===proof.maxSpeechTokens&&!decode.modelEosRestoredSteps,'Sandale native EOS/token/hook evidence missing');
 requireMatch(clip.asrLiteralWordExact===true&&clip.asrDevice==='cpu'&&clip.asrCpuThreads===1&&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&clip.asrModelSha256===proof.asrModelSha256&&clip.asrBeamSize===proof.asrBeamSize&&Number.isInteger(proof.asrReadings)&&proof.asrReadings>=1&&proof.asrReadings<=2&&clip.sampleRateHz===48000&&clip.channels===1&&clip.bitrateBitsPerSecond===128000&&Number.isInteger(clip.bytes)&&clip.bytes>0&&Number.isFinite(clip.durationSeconds)&&clip.durationSeconds>0&&clip.referenceLicense==='CC0-1.0'&&clip.modelLicense==='MIT','Sandale encoded ASR/delivery/license evidence missing');
 requireMatch(clip.listening==='pending'&&!clip.listeningConfirmed&&!clip.listeningVerified&&!approval?.listeningConfirmed&&!approval?.listeningVerified,'Sandale perceptual listening not supplied');
 requireMatch(sameJson(Object.keys(approval||{}).sort(),['clipId','date','encodedSha256','instruction','scope','status'])&&approval.status==='user-approved'&&approval.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(approval.date)&&approval.instruction?.trim()&&approval.clipId===clip.clipId&&approval.encodedSha256===clip.sha256,'Missing Sandale clip/hash-specific selection');
 for(const key of ['rawReceiptSha256','encodedReceiptSha256','rawSha256','encodedSha256','profileJsonSha256','eosTraceSha256'])requireMatch(/^[a-f0-9]{64}$/.test(proof?.[key]),'Sandale byte evidence missing');
 requireMatch(proof.rawSha256===clip.rawSha256&&proof.encodedSha256===clip.sha256&&proof.profileJsonSha256===clip.profileJsonSha256,'Sandale private/public lineage drift');
}
export function prepareSandaleManifest(cast,manifest,authorityProof,terminalProofs,selectionProof=null,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Sandale authority bytes changed');const authority=json(authorityProof.path);
 requireMatch(authority.status==='ROOT_SEALED_FINITE_SANDALE'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.sourceScope===sandaleScope&&authority.helperSha256===sandaleAuthoringHelperSha256&&authority.grantId?.trim()&&/^[a-f0-9]{64}$/.test(authority.adapterSha256)&&authority.protectedPublicPins&&Object.keys(authority.protectedPublicPins).length>0&&authority.maximumCallsPerClip===1&&authority.automaticRetries===0,'No Sandale-specific finite authority');
 requireMatch(hash(authority.requestPath)===authority.requestSha256,'Sandale authored request changed');const snapshot={text:readFileSync(authority.requestPath,'utf8'),sha256:authority.requestSha256},{plan,authored}=sandaleFullPlan(cast,snapshot,sourceRoot);
 const selected=authority.selectedClipIds;
 requireMatch(Array.isArray(selected)&&selected.length>0&&selected.length<=8&&new Set(selected).size===selected.length&&selected.every(id=>authored.has(id))&&authority.maximumNativeCalls===selected.length&&authority.maximumAsrReadings===selected.length*2&&sameJson(authority.sourceSha256,plan.sourceSha256),'Sandale finite selected set/source limits changed');
 const terminals={};for(const phase of ['plan','render','process']){const ref=terminalProofs?.[phase];requireMatch(ref&&hash(ref.path)===ref.sha256,'Missing Sandale phase receipt');const terminal=json(ref.path);requireMatch(terminal.phase===phase&&terminal.specificationSha256===authorityProof.sha256&&terminal.logsComplete===true&&terminal.producerSha256===authority.adapterSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&Array.isArray(terminal.survivingOwnedChildren)&&terminal.survivingOwnedChildren.length===0&&Array.isArray(terminal.ownedCleanupKills)&&terminal.ownedCleanupKills.length===0&&Array.isArray(terminal.postflightPinFailures)&&terminal.postflightPinFailures.length===0&&terminal.postflightProtectedPinsChecked===Object.keys(authority.protectedPublicPins||{}).length&&!terminal.supervisorError,'Sandale phase did not retire successfully');terminals[phase]={sha256:ref.sha256,exitCode:0,rootRetired:true,timedOut:false};}
 const owned=sandaleManifestSlots(cast,manifest,authored),voice=manifest.voiceId,family=resolve(authority.musicRoot,plan.privateReviewFamily);
 requireMatch(realpathSync(family)===family,'Sandale private family alias');
 const privateFile=relative=>{const file=resolve(family,voice,relative);requireMatch(realpathSync(file)===file&&file.startsWith(family+sep)&&!lstatSync(file).isSymbolicLink(),'Sandale private receipt/media alias');return file;};
 const requestPath=privateFile('requests.json'),requestSha256=hash(requestPath),request=json(requestPath);
 requireMatch(request.sourceScope===sandaleScope&&request.requestedLineCount===4&&sameJson(request.jobs,owned)&&request.authoredPlanSha256===authority.requestSha256&&sameJson(request.sourceSha256,plan.sourceSha256)&&sameJson(request.authoredPlanSourceSha256,plan.sourceSha256),'Sandale native four-slot plan changed');
 const ownedSelected=selected.filter(id=>owned.some(row=>row.clipId===id)),rawDirectory=resolve(family,voice,'raw');
 const rawNames=existsSync(rawDirectory)?readdirSync(rawDirectory):[],rawIds=rawNames.filter(name=>name.endsWith('.json')&&!name.endsWith('-eos-trace.json')).map(name=>name.slice(0,-5)),wavIds=rawNames.filter(name=>name.endsWith('.wav')).map(name=>name.slice(0,-4));
 requireMatch(sameJson(rawIds.sort(),ownedSelected.slice().sort())&&sameJson(wavIds.sort(),ownedSelected.slice().sort()),'Sandale raw receipt/media set differs from finite allocation');
 for(const id of ownedSelected){
  const raw=json(privateFile(`raw/${id}.json`)),job=authored.get(id),seed=71000+owned.findIndex(row=>row.clipId===id);
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.requestSha256===requestSha256&&raw.authoringHelperSha256===sandaleAuthoringHelperSha256&&raw.rendererInputText===job.text&&raw.rendererInputBasis==='exact authored source'&&raw.synthesisAttempt===1&&raw.seed===seed&&authority.seeds?.[id]===seed&&raw.profileJsonSha256===authority.profileBindings?.[voice]?.profileJsonSha256&&hash(privateFile(`raw/${id}.wav`))===raw.rawSha256,'Sandale allocated raw take missing or misbound');
 }
 requireMatch(manifest.generatedLineCount===rawIds.length,'Sandale generated count differs from actual raw receipts');
 let selection=null;const selections=new Map();
 requireMatch(manifest.clips.length===0||selectionProof,'Sandale accepted clips require independent ROOT use selection');
 if(selectionProof){
  requireMatch(selectionProof.sha256===hash(selectionProof.path),'Sandale ROOT use selection bytes changed');selection=json(selectionProof.path);
  requireMatch(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&selection.instruction?.trim()&&Array.isArray(selection.clips),'Missing Sandale ROOT use selection');
  for(const row of selection.clips){requireMatch(selected.includes(row.clipId)&&!selections.has(row.clipId)&&/^[a-f0-9]{64}$/.test(row.encodedSha256),'Sandale use selection duplicate or outside allocated slots');selections.set(row.clipId,row.encodedSha256);}
  requireMatch(sameJson([...selections.keys()].filter(id=>owned.some(row=>row.clipId===id)).sort(),manifest.clips.map(row=>row.clipId).sort()),'Sandale manifest omits or adds selected own-voice clips');
 }
 const takes={};
 for(const clip of manifest.clips){
  requireMatch(ownedSelected.includes(clip.clipId),'Sandale clip outside finite generation selection');
  requireMatch(selections.get(clip.clipId)===clip.sha256&&Object.entries({status:selection.status,scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:clip.clipId,encodedSha256:clip.sha256}).every(([key,value])=>clip.approval?.[key]===value),'Sandale approval differs from independent ROOT clip/hash selection');
  const rawPath=privateFile(`raw/${clip.clipId}.json`),encodedPath=privateFile(`encoded/${clip.clipId}.json`),raw=json(rawPath),encoded=json(encodedPath),job=authored.get(clip.clipId),seed=71000+owned.findIndex(row=>row.clipId===clip.clipId);
  for(const [key,value] of Object.entries(job))requireMatch(sameJson(raw[key],value)&&sameJson(encoded[key],value),'Sandale actual receipt source drift');
  for(const [key,value] of Object.entries(raw))if(!['durationSeconds','status'].includes(key))requireMatch(sameJson(encoded[key],value),'Sandale raw/encoded lineage drift: '+key);
  for(const [key,value] of Object.entries(encoded))requireMatch(sameJson(clip[key],value),'Sandale supplied clip differs from encoded receipt: '+key);
  requireMatch(raw.requestSha256===requestSha256&&raw.profileJsonSha256===authority.profileBindings?.[voice]?.profileJsonSha256&&raw.seed===seed&&authority.seeds?.[clip.clipId]===seed&&raw.decode?.maxSpeechTokens===authority.tokenCaps?.[clip.clipId]&&encoded.asrModelSha256===authority.asrModelSha256,'Sandale actual recipe bindings changed');
  const readings=encoded.asrReadings;requireMatch(Array.isArray(readings)&&(sameJson(readings.map(row=>row.beamSize),[1])||sameJson(readings.map(row=>row.beamSize),[1,5]))&&readings.at(-1).transcript===encoded.asr&&readings.at(-1).beamSize===encoded.asrBeamSize,'Sandale final encoded ASR reading mismatch');
  const words=readings.at(-1).words?.flatMap(word=>[...word.word.matchAll(/[\p{L}\p{N}_]+/gu)].map(match=>({word:match[0].toLowerCase(),at:word.start,end:word.end})));
  crowdExactCues(encoded);requireMatch(words?.length===encoded.wordCues.length&&encoded.wordCues.every((cue,i)=>words[i].word===cue.word.toLowerCase()&&words[i].at===cue.at&&words[i].end===cue.end),'Sandale cues differ from final encoded word timings');
  const tracePath=privateFile(`raw/${clip.clipId}-eos-trace.json`),trace=json(tracePath);requireMatch(hash(tracePath)===raw.decode?.eosTraceSha256&&trace.clipId===clip.clipId&&trace.text===clip.text&&trace.profileId===clip.profileId&&trace.referenceSha256===clip.referenceSha256&&trace.modelRevision===clip.modelRevision&&policeEosTraceAuthority(raw.decode,trace),'Sandale native EOS trace missing or misbound');
  requireMatch(hash(privateFile(`raw/${clip.clipId}.wav`))===raw.rawSha256&&hash(privateFile(`encoded/${clip.clipId}.mp3`))===encoded.sha256&&readFileSync(privateFile(`encoded/${clip.clipId}.mp3`)).length===encoded.bytes,'Sandale actual audio bytes changed');
  const proof={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:raw.rawSha256,encodedSha256:encoded.sha256,profileJsonSha256:raw.profileJsonSha256,eosTraceSha256:hash(tracePath),maxSpeechTokens:raw.decode.maxSpeechTokens,asrModelSha256:encoded.asrModelSha256,asrBeamSize:encoded.asrBeamSize,asrReadings:readings.length};
  sandaleClipAuthority(cast,clip,proof,requestSha256,seed);takes[clip.clipId]=proof;
 }
 for(const row of manifest.heldPrivate)requireMatch(ownedSelected.includes(row.clipId)?['held private; selected production fallback','technically verified; awaiting clip/hash-specific use selection'].includes(row.reason):row.reason==='not rendered; selected production fallback','Sandale hold reason misstates allocation');
 return {schemaVersion:1,sourceScope:sandaleScope,voiceId:voice,profileId:manifest.profileId,fallback:'captions',requestedLineCount:4,generatedLineCount:ownedSelected.length,lineCount:manifest.clips.length,clips:manifest.clips.map(crowdPublicClip),heldPrivate:manifest.heldPrivate.map(row=>({...crowdPublicFields(row,crowdPublicJobFields),reason:row.reason})),approvedExistingReuse:[],sandaleAdmission:{status:'ROOT-verified-native-sandale',authoritySha256:authorityProof.sha256,grantId:authority.grantId,helperSha256:sandaleAuthoringHelperSha256,authoredPlanSha256:authority.requestSha256,selectionSha256:selectionProof?.sha256??null,requestSha256,sourceSha256:plan.sourceSha256,jobs:plan.jobs,selectedClipIds:selected,terminals,takes}};
}
export function sandaleRecordingsBlock(cast,manifests,assetRoot=root,sourceRoot=root){
 const authored=sandaleSourceMap(cast,sourceRoot),clips=[],seen=new Set();
 for(const manifest of manifests){
  const owned=sandaleManifestSlots(cast,manifest,authored),admission=manifest.sandaleAdmission;
  requireMatch(!seen.has(manifest.voiceId),'Duplicate Sandale voice manifest');seen.add(manifest.voiceId);
  requireMatch(admission?.status==='ROOT-verified-native-sandale'&&admission.helperSha256===sandaleAuthoringHelperSha256&&/^[a-f0-9]{64}$/.test(admission.authoritySha256)&&/^[a-f0-9]{64}$/.test(admission.authoredPlanSha256)&&/^[a-f0-9]{64}$/.test(admission.requestSha256)&&admission.jobs?.length===8&&new Set(admission.jobs.map(row=>row.clipId)).size===8&&admission.jobs.every(row=>authored.has(row.clipId)&&Object.keys(row).length===crowdPublicJobFields.length&&Object.entries(authored.get(row.clipId)).every(([key,value])=>sameJson(row[key],value)))&&sameJson(Object.keys(admission.takes||{}).sort(),manifest.clips.map(row=>row.clipId).sort()),'Sandale admission/source/take coverage missing');
  requireMatch(Array.isArray(admission.selectedClipIds)&&new Set(admission.selectedClipIds).size===admission.selectedClipIds.length&&admission.selectedClipIds.every(id=>authored.has(id))&&manifest.generatedLineCount===admission.selectedClipIds.filter(id=>owned.some(row=>row.clipId===id)).length,'Sandale selected coverage drift');
  requireMatch(['plan','render','process'].every(phase=>{const row=admission.terminals?.[phase];return row&&/^[a-f0-9]{64}$/.test(row.sha256)&&row.exitCode===0&&row.rootRetired===true&&row.timedOut===false}),'Sandale successful terminal evidence missing');
  requireMatch(manifest.clips.length===0||/^[a-f0-9]{64}$/.test(admission.selectionSha256),'Sandale public selection evidence missing');
  for(const clip of manifest.clips){requireMatch(admission.selectedClipIds.includes(clip.clipId),'Unselected Sandale take');sandaleClipAuthority(cast,clip,admission.takes[clip.clipId],admission.requestSha256,71000+admission.jobs.filter(row=>row.voiceId===manifest.voiceId).findIndex(row=>row.clipId===clip.clipId));clips.push({...clip,provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});}
 }
 return fixedRecordingsBlock(cast,{clips},'crowd-dialogue',assetRoot,sourceRoot).replace('const crowdRecordings=','const sandaleRecordings=');
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
// BEGIN exact Ruediger pilot homophone projection v1
// One recorded bilingual token, not a change to any general normalizer.
const ruedigerPilotHomophone = Object.freeze({
 clipId:'crowd-ruediger-rasenkante-berlin-01',voiceId:'crowd-ruediger-rasenkante',profileId:'3cc9340471d3480ba090545b5a9024c9',
 text:'Die Rasenkante ist not an invitation; your Schuh steht im Zuständigkeitsbereich.',
 textSha256:'aa38b8c45fb36b873a247cd9ad75f611be84ab3376f897ecf7013063a304da0b',
 referenceSha256:'8db1f5eae831948b72cdc608f3bf358592369b70a4bb27aab102ecb27c23a8f1',referenceOriginalSha256:'5f3d748de3d95a8090b3d506cf2cf47358d2e7b079e661a1ac186959a2513636',
 profileJsonSha256:'49082127b04f09fb892b1afb93e56ea791c2009cecb60099e404400f8f441b2e',
 // Encoded requestSha256 is the frozen private parent plan; authoredPlanSha256 is the authored request.
 requestSha256:'0c923bbaf40e409b31b3f15062143e7bff4429384d4df2ab53bcfc77e93ad5ce',authoredPlanSha256:'81b201157323b499e4b7aea3af2b7320532d754ecfbcc12db362555e9014f516',pilotPlanSha256:'a2435147eaac1b3f390ace42102ede200b7b847b52c5957b4a2488943eee05ab',
 authoringHelperSha256:'c946668c0bc7b4f2e6b689cb24cd7edcf3c935cdffdf13bd860e24d0aad53230',segmentHelperSha256:'07c729b4a15753de37ca526c03e80c6a19b3346235936857cb97ac0d0b3d8bfb',
 sha256:'77da21c122e47c5bf7ab834b2c2caace42f8d82df638fa28acb33a5cfb181606',encodedReceiptSha256:'2ed8acea7dce0cafeffb2501a8876235413e543caa631109db125295039c896f',
 authoritySha256:'39d1efea1fe2658d806a23b86bbbbd4996caf97cfbcdfd2222e24e4726779618',terminalSha256:'6048d6fdbca3d1e1f4d3f0a4ac429139e59b5a5663655243d95183ec430300e3',
 asrModelSha256:'e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da',
 renderer:'ResembleAI/Chatterbox Multilingual V2 0.1.7',modelRevision:'5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'
});
const ruedigerPilotDigest=bytes=>createHash('sha256').update(bytes).digest('hex');
const ruedigerPilotHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const ruedigerPilotCollectedEvidence=new WeakMap();
function requireRuedigerPilotCollectedEvidence(collection){
 requireMatch(collection&&ruedigerPilotCollectedEvidence.get(collection)===ruedigerPilotDigest(JSON.stringify(collection)),'Pilot manifest requires unchanged evidence from the full private collector');
}
const ruedigerPilotWords=text=>typeof text==='string'?(text.match(/[\p{L}\p{N}_]+/gu)||[]).map(word=>word.toLowerCase()):[];
const ruedigerPilotSegments=Object.freeze([
 {text:'Die Rasenkante ist',sourceStart:0,sourceEnd:18,languageId:'de'},
 {text:'not an invitation; your Schuh',sourceStart:19,sourceEnd:48,languageId:'en'},
 {text:'steht im Zuständigkeitsbereich.',sourceStart:49,sourceEnd:80,languageId:'de'}
]);

export function projectRuedigerPilotHomophoneCues(clip){
 const a=ruedigerPilotHomophone;
 requireMatch(clip&&typeof clip==='object'&&!Array.isArray(clip),'Missing exact-pilot metadata');
 for(const key of ['clipId','voiceId','profileId','text','textSha256','referenceSha256','referenceOriginalSha256','requestSha256','authoredPlanSha256','pilotPlanSha256','authoringHelperSha256','sha256','renderer','modelRevision'])requireMatch(clip[key]===a[key],'Exact-pilot identity changed: '+key);
 requireMatch(ruedigerPilotDigest(clip.text)===a.textSha256&&clip.actorId===a.voiceId&&clip.region==='berlin'&&clip.slot===0&&clip.sourceLocator==='game.js crowdCharacterBarks[crowd-ruediger-rasenkante].berlin[0]','Exact-pilot authored owner changed');
 requireMatch(clip.codeSwitchParent===true&&clip.phaseScope==='new code-switch diagnostic phase'&&clip.processing===null&&clip.synthesisAttempt===0&&clip.synthesisAttemptBasis==='joined diagnostic segments; no whole-parent TTS call or first-take claim','Exact-pilot parent kind changed');
 requireMatch(clip.asrWordExact===false&&clip.asrLiteralWordExact===false&&clip.codeSwitchStrictParentGate===false&&Array.isArray(clip.wordCues)&&clip.wordCues.length===0,'Original literal failure was changed');
 requireMatch(!clip.listeningVerified&&!clip.listeningConfirmed&&!['deliveryEditing','recognitionVerification','rescueParts','benchmarkOnly','actualInferenceText'].some(key=>Object.hasOwn(clip,key)),'Unsupported pilot editing or listening claim');
 requireMatch(clip.sampleRateHz===48000&&clip.channels===1&&clip.bitrateBitsPerSecond===128000&&Number.isInteger(clip.bytes)&&clip.bytes>0&&Number.isFinite(clip.durationSeconds)&&clip.durationSeconds>0&&Number.isFinite(clip.integratedLufs)&&Math.abs(clip.integratedLufs+18)<=.3&&Number.isFinite(clip.truePeakDbtp)&&clip.truePeakDbtp<=-1.5,'Pilot final format or levels failed');
 requireMatch(clip.decode?.eosReached===true&&clip.decode.allSegmentEosObserved===true&&clip.decode.basis==='three separate segment native EOS observations; joined parent is not a native model call'&&ruedigerPilotHash(clip.rawSha256),'Pilot parent EOS/raw proof missing');
 const join=clip.codeSwitchJoin,parts=clip.codeSwitchParts,continuation=clip.codeSwitchParentContinuation;
 requireMatch(join?.method==='existing FFmpeg concat of ordered dry 24 kHz mono segment PCM'&&join.sampleRateHz===24000&&join.channels===1&&join.insertedSilence===false&&join.crossfade===false&&join.edit===false&&join.filterGraph==='[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]'&&join.joinedPcmSha256===clip.rawSha256&&ruedigerPilotHash(join.ffmpegSha256)&&ruedigerPilotHash(join.ffprobeSha256),'Pilot dry join changed');
 requireMatch(Array.isArray(parts)&&parts.length===3&&Array.isArray(clip.segments)&&clip.segments.length===3,'Pilot segment set changed');
 for(let i=0;i<3;i++){
  const part=parts[i],segment=ruedigerPilotSegments[i],declared=clip.segments[i];
  requireMatch(declared?.index===i&&declared.joinBefore===(i?' ':'')&&Object.entries(segment).every(([key,value])=>declared[key]===value&&part?.[key]===value),'Pilot segment source/spans changed');
  requireMatch(part.clipId===a.clipId+'-codeswitch-pilot-part-'+String(i+1).padStart(2,'0')&&part.voiceId===a.voiceId&&part.profileId===a.profileId&&part.referenceSha256===a.referenceSha256&&part.authoringHelperSha256===a.segmentHelperSha256&&part.renderer===a.renderer&&part.modelRevision===a.modelRevision&&part.rendererInputText===segment.text&&part.seed===71000+i&&part.synthesisAttempt===1,'Pilot segment ownership/recipe changed');
  requireMatch(part.rawSampleRateHz===24000&&part.rawChannels===1&&part.encodedSampleRateHz===48000&&part.encodedChannels===1&&part.asrDiagnosticOnly===true&&part.asrLanguageId===segment.languageId&&Object.hasOwn(part,'asrScriptPrompt')&&part.asrScriptPrompt===null&&part.asrModelSha256===a.asrModelSha256,'Pilot segment diagnostic recipe changed');
  for(const key of ['rawSha256','encodedSha256','eosTraceSha256','rawReceiptSha256','diagnosticReceiptSha256'])requireMatch(ruedigerPilotHash(part[key]),'Pilot segment byte proof missing: '+key);
  const decode=part.decode,synth=part.synthesis;
  requireMatch(part.eosReached===true&&decode?.eosReached===true&&decode.eosTraceSha256===part.eosTraceSha256&&decode.attentionHooksBefore===0&&decode.attentionHooksAfter===0&&Number.isInteger(decode.generatedSpeechTokens)&&decode.generatedSpeechTokens>0&&Number.isInteger(decode.maxSpeechTokens)&&decode.generatedSpeechTokens<=decode.maxSpeechTokens&&!decode.modelEosRestoredSteps,'Pilot native segment EOS/hooks failed');
  requireMatch(synth?.languageId===segment.languageId&&synth.device==='cuda'&&synth.precision==='fp16'&&synth.t3WeightPrecision==='float16'&&synth.conditioningPrecision==='float32'&&synth.referenceReconditionedForProfile===a.profileId&&synth.referenceConditioningVerifiedFloat32===true&&synth.exaggeration===.5&&synth.temperature===.65&&synth.repetitionPenalty===3&&synth.cfgWeight===.6&&synth.cpuThreads===2&&synth.inferenceMode===true,'Pilot native conditioning/recipe failed');
 }
 requireMatch(sameJson(join.segmentPcmSha256,parts.map(part=>part.rawSha256)),'Pilot join input hashes changed');
 requireMatch(continuation?.selector==='--continue-code-switch-parent'&&continuation.segmentAuthoringHelperSha256===a.segmentHelperSha256&&continuation.parentAuthoringHelperSha256===a.authoringHelperSha256&&ruedigerPilotHash(continuation.ledgerSha256BeforeParentAsr)&&sameJson(continuation.segmentDiagnosticReceiptSha256,parts.map(part=>part.diagnosticReceiptSha256)),'Pilot continuation provenance changed');
 requireMatch(clip.asrLanguageId==='de'&&clip.asrDevice==='cpu'&&clip.asrCpuThreads===1&&clip.asrComputeType==='int8'&&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&clip.asrModelSha256===a.asrModelSha256&&Object.hasOwn(clip,'asrScriptPrompt')&&clip.asrScriptPrompt===null&&!['prompt','initial_prompt','initialPrompt','prefix','hotwords'].some(key=>Object.hasOwn(clip,key)),'Pilot parent ASR recipe changed');
 const readings=clip.asrReadings,expected=[...clip.text.matchAll(/[\p{L}\p{N}_]+/gu)],heardExpected=expected.map(word=>word[0].toLowerCase());heardExpected[7]='shoe';
 requireMatch(expected.length===11&&expected[7][0]==='Schuh'&&expected[7].index===43&&expected[7].index+expected[7][0].length===48&&Array.isArray(readings)&&readings.length===2&&readings[0]?.beamSize===1&&readings[1]?.beamSize===5&&clip.asrBeamSize===5&&clip.asr===readings[1].transcript,'Pilot retained beam selection changed');
 for(const reading of readings){
  requireMatch(sameJson(Object.keys(reading).sort(),['beamSize','transcript','transcribeSeconds','words','inputScope','encodedSha256','asrModelSha256','languageId','device','cpuThreads','computeType','effectiveComputeType','scriptPrompt','wordTimestamps'].sort()),'Pilot retained reading fields changed');
  requireMatch(reading.inputScope==='full encoded parent'&&reading.encodedSha256===a.sha256&&reading.asrModelSha256===a.asrModelSha256&&reading.languageId==='de'&&reading.device==='cpu'&&reading.cpuThreads===1&&reading.computeType==='int8'&&reading.effectiveComputeType===clip.asrEffectiveComputeType&&reading.scriptPrompt===null&&reading.wordTimestamps===true&&Number.isFinite(reading.transcribeSeconds)&&reading.transcribeSeconds>=0&&Array.isArray(reading.words)&&sameJson(ruedigerPilotWords(reading.transcript),heardExpected),'Pilot transcript has more than the named homophone discrepancy');
 }
 const selected=readings[1];
 requireMatch(selected.words.length===11,'Pilot selected word timings are incomplete');
 const wordCues=selected.words.map((row,i)=>{
  requireMatch(row&&sameJson(Object.keys(row).sort(),['end','start','word'])&&sameJson(ruedigerPilotWords(row.word),[heardExpected[i]])&&Number.isFinite(row.start)&&Number.isFinite(row.end),'Pilot timing row differs from retained transcript');
  return {at:row.start,end:row.end,charIndex:expected[i].index,word:expected[i][0]};
 });
 crowdExactCues({text:clip.text,durationSeconds:clip.durationSeconds,wordCues});
 return {verificationMode:'full-encoded-parent-single-token-homophone',asrWordExact:false,asrLiteralWordExact:false,originalStrictParentGate:false,asrHomophoneWordEquivalent:true,selectedBeamSize:5,projection:{tokenIndex:7,charIndex:43,charEndExclusive:48,heard:'shoe',authored:'Schuh'},wordCues};
}

// Existing collector pattern: exact private bytes are read only by ROOT's later invocation.
// No inference, media decode, mutation, catalogue update or publication operation.
export function collectRuedigerPilotHomophoneProjection(authorityProof,terminalProof){
 const a=ruedigerPilotHomophone,observed=[];
 const readBound=(path,expected,maxBytes=16*1024*1024)=>{
  const absolute=resolve(path),stat=lstatSync(absolute);
  requireMatch(stat.isFile()&&!stat.isSymbolicLink()&&realpathSync(absolute)===absolute&&stat.size>0&&stat.size<=maxBytes,'Pilot evidence is linked, absent or oversized');
  const bytes=readFileSync(absolute),sha256=ruedigerPilotDigest(bytes);
  requireMatch(!expected||sha256===expected,'Pilot evidence bytes changed: '+absolute);
  observed.push({path:absolute,sha256});return {bytes,sha256};
 };
 const parseBound=(path,expected)=>{const record=readBound(path,expected);return {...record,value:JSON.parse(record.bytes.toString('utf8').replace(/^\uFEFF/,''))};};
 requireMatch(authorityProof?.sha256===a.authoritySha256&&terminalProof?.sha256===a.terminalSha256,'Not the fixed pilot authority/terminal proof');
 const authority=parseBound(authorityProof.path,a.authoritySha256).value,terminal=parseBound(terminalProof.path,a.terminalSha256).value;
 requireMatch(authority.status==='ROOT_SEALED_FINITE_CODESWITCH_PARENT_CONTINUATION'&&authority.executor==='ROOT_ONLY'&&authority.authorityTemplateOnly===false&&authority.publicationAuthorized===false&&authority.retryBudget===0&&authority.maxNewGenerations===0&&authority.maxSegmentDiagnosticAsr===0&&authority.maxParentGermanAsr===2&&authority.maxTotalAsr===5&&authority.voiceId===a.voiceId&&authority.profileId===a.profileId&&authority.profileMetadataSha256===a.profileJsonSha256&&authority.referenceNormalizedSha256===a.referenceSha256&&authority.referenceOriginalSha256===a.referenceOriginalSha256&&authority.adapterSha256===a.authoringHelperSha256&&authority.requestSha256===a.authoredPlanSha256&&authority.privateParentPlanSha256===a.requestSha256&&authority.privateSegmentPlanSha256===a.pilotPlanSha256,'Pilot finite authority or authored/private plan mapping changed');
 requireMatch(terminal.phase==='process'&&terminal.executionScope==='code-switch-parent-only-continuation-v1'&&terminal.specificationSha256===a.authoritySha256&&terminal.producerSha256===a.authoringHelperSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.censusStatus==='COMPLETE'&&terminal.timedOut===false&&terminal.failedStart===false&&!terminal.supervisorError&&!terminal.fatalError&&terminal.logsComplete===true&&terminal.postflightProtectedPinsChecked===42&&terminal.postflightProtectedPrivatePinsChecked===18,'Pilot completed producer/retirement coverage failed');
 for(const key of ['survivingOwnedChildren','ownedCleanupKills','postflightPinFailures','postflightPrivatePinFailures','postflightSourceMirrorPinFailures','pilotLedgerAuditFailures'])requireMatch(Array.isArray(terminal[key])&&terminal[key].length===0,'Pilot retirement/provenance failure: '+key);
 requireMatch(terminal.parentStrictGermanGate===false&&terminal.cueGate==='FAIL'&&terminal.cueQualified===false&&terminal.postflightQualified===false&&terminal.publicationAuthorized===false&&terminal.admissionDecision==='HOLD','Original failed gates were rewritten');
 const history=terminal.parentContinuation,summary=terminal.pilotLedgerSummary;
 requireMatch(history?.priorProvenanceVerified===true&&history.priorRenderPostflightQualified===true&&history.priorRenderExitCode===0&&history.priorProcessPostflightQualified===false&&history.priorProcessExitCode===1&&history.priorExpectedPublicPinCount===35&&history.priorExpectedPrivatePinCount===18&&history.newGenerationCalls===0&&history.newSegmentDiagnosticAsrCalls===0&&history.newParentGermanAsrCalls===2&&history.retryBudget===0&&history.lifetimeMaxTotalAsr===5,'Pilot historical/remaining-call provenance changed');
 requireMatch(summary?.generationCalls===3&&summary.segmentDiagnosticAsrCalls===3&&summary.parentGermanAsrCalls===2&&summary.totalAsrCalls===5&&summary.newGenerationCalls===0&&summary.newSegmentDiagnosticAsrCalls===0&&summary.newParentGermanAsrCalls===2&&summary.retryBudget===0&&ruedigerPilotHash(summary.ledgerSha256)&&summary.initialLedgerSha256===history.initialLedgerSha256&&summary.initialClaimsSha256===summary.preservedInitialClaimsSha256&&summary.initialClaimsSha256===history.initialClaimsSha256&&summary.initialClaimsSha256===history.preservedInitialClaimsSha256,'Pilot spent ledger conservation failed');
 const privateRoot=resolve(authority.musicRoot,authority.privateReviewFamily,a.voiceId),rescueRoot=resolve(privateRoot,'sentence-rescue');
 const parent=parseBound(resolve(privateRoot,'encoded',a.clipId+'.json'),a.encodedReceiptSha256),clip=parent.value;
 const projection=projectRuedigerPilotHomophoneCues(clip);
 requireMatch(clip.codeSwitchParentContinuation.ledgerSha256BeforeParentAsr===summary.initialLedgerSha256,'Parent does not bind the initial ledger');
 const mp3=readBound(resolve(privateRoot,'encoded',a.clipId+'.mp3'),a.sha256);
 requireMatch(mp3.bytes.length===clip.bytes,'Parent encoded byte count changed');
 const raw=parseBound(resolve(privateRoot,'raw',a.clipId+'.json'));
 for(const key of ['clipId','text','textSha256','voiceId','profileId','referenceSha256','referenceOriginalSha256','rawSha256','requestSha256','authoredPlanSha256','pilotPlanSha256','authoringHelperSha256','codeSwitchParts','codeSwitchJoin','decode','codeSwitchParentContinuation'])requireMatch(sameJson(raw.value[key],clip[key]),'Parent raw/encoded lineage changed: '+key);
 readBound(resolve(privateRoot,'raw',a.clipId+'.wav'),clip.rawSha256);
 const ledger=parseBound(resolve(privateRoot,'code-switch-pilot-ledger.json'),summary.ledgerSha256).value;
 requireMatch(ledger.pilotId===a.clipId+'-codeswitch-pilot-v1'&&Array.isArray(ledger.claims)&&ledger.claims.length===8,'Pilot ledger identity/count changed');
 const counts=new Set();
 for(let i=0;i<8;i++){
  const claim=ledger.claims[i];requireMatch(claim&&sameJson(Object.keys(claim).sort(),['action','chargedBeforeCall','key'])&&claim.chargedBeforeCall===true&&Number.isInteger(claim.key),'Pilot ledger claim is not a typed spent call');
  const key=claim.action+':'+claim.key;requireMatch(!counts.has(key),'Duplicate pilot charge');counts.add(key);
  requireMatch(i<6?(['generate','segmentDiagnosticAsr'].includes(claim.action)&&[0,1,2].includes(claim.key)):(claim.action==='parentGermanAsr'&&claim.key===(i===6?1:5)),'Pilot ledger has an extra or reordered charge');
 }
 // PowerShell hashes its compact six-claim JSON; these keys retain their original serialized order.
 requireMatch(ruedigerPilotDigest(JSON.stringify(ledger.claims.slice(0,6)))===summary.initialClaimsSha256,'Original six spent claims changed');
 const parentPlan=parseBound(resolve(privateRoot,'requests.json'),a.requestSha256).value;
 const segmentPlan=parseBound(resolve(rescueRoot,'requests.json'),a.pilotPlanSha256).value;
 readBound(authority.requestPath,a.authoredPlanSha256);
 requireMatch(parentPlan.jobs?.length===1&&parentPlan.jobs[0].clipId===a.clipId&&parentPlan.jobs[0].text===a.text&&segmentPlan.jobs?.length===3,'Frozen pilot plans no longer own this source');
 for(let i=0;i<3;i++){
  const part=clip.codeSwitchParts[i],rawPart=parseBound(resolve(rescueRoot,'raw',part.clipId+'.json'),part.rawReceiptSha256).value,diagnostic=parseBound(resolve(rescueRoot,'encoded',part.clipId+'.json'),part.diagnosticReceiptSha256).value;
  for(const [key,value] of Object.entries(segmentPlan.jobs[i]))requireMatch(sameJson(rawPart[key],value)&&sameJson(diagnostic[key],value),'Saved segment/frozen plan changed: '+key);
  for(const key of ['authoringHelperSha256','requestSha256','rawSha256','decode','synthesis','seed','synthesisAttempt','rendererInputText','profileJsonSha256','referenceLicense','modelLicense','rawSampleRateHz','rawChannels'])requireMatch(Object.hasOwn(rawPart,key)&&sameJson(rawPart[key],diagnostic[key]),'Saved raw/diagnostic provenance changed: '+key);
  requireMatch(rawPart.requestSha256===a.pilotPlanSha256&&rawPart.profileJsonSha256===a.profileJsonSha256&&rawPart.referenceLicense==='CC0-1.0'&&rawPart.modelLicense==='MIT'&&rawPart.rawSha256===part.rawSha256&&sameJson(rawPart.decode,part.decode)&&sameJson(rawPart.synthesis,part.synthesis)&&diagnostic.sha256===part.encodedSha256&&diagnostic.asr===part.asr&&diagnostic.asrModelSha256===a.asrModelSha256&&diagnostic.asrDiagnosticOnly===true&&diagnostic.asrBeamSize===1&&diagnostic.asrDevice==='cpu'&&diagnostic.asrCpuThreads===1&&diagnostic.asrComputeType==='int8'&&diagnostic.asrLanguageId===part.languageId&&diagnostic.asrScriptPrompt===null,'Saved segment license, bytes or ASR provenance failed');
  readBound(resolve(rescueRoot,'raw',part.clipId+'.wav'),part.rawSha256);
  const partMp3=readBound(resolve(rescueRoot,'encoded',part.clipId+'.mp3'),part.encodedSha256);requireMatch(partMp3.bytes.length===diagnostic.bytes,'Segment encoded byte count changed');
  const trace=parseBound(resolve(rescueRoot,'raw',part.clipId+'-eos-trace.json'),part.eosTraceSha256).value;
  for(const key of ['clipId','text','profileId','referenceSha256','modelRevision'])requireMatch(trace[key]===rawPart[key],'Segment trace belongs to another source');
 }
 // Preserve current source/profile ownership and recipe, using the existing cast binding authority.
 const cast=parseBound(resolve(authority.sourceRoot,'For-AI/VOICE-CAST.json'),authority.sourcePins['For-AI/VOICE-CAST.json']).value;
 requireMatch(matchesProduction(cast,clip)&&cast.productionVoices[a.voiceId]?.profileId===a.profileId,'Pilot selected production profile/recipe drift');
 for(const record of observed)requireMatch(hash(record.path)===record.sha256,'Pilot evidence changed during projection collection');
 const receipt={schema:'exact-pilot-homophone-cue-projection-v1',qualified:true,...projection,clipId:a.clipId,voiceId:a.voiceId,profileId:a.profileId,textSha256:a.textSha256,originalEncodedReceiptSha256:parent.sha256,encodedSha256:a.sha256,rawReceiptSha256:raw.sha256,rawSha256:clip.rawSha256,authoritySha256:a.authoritySha256,continuationTerminalSha256:a.terminalSha256,ledgerSha256:summary.ledgerSha256,originalCueGate:'FAIL',originalPostflightQualified:false,referenceLicense:'CC0-1.0',modelLicense:'MIT',technicalEligible:true,listeningVerified:false,publicationAuthorized:false,status:'homophone-equivalent; literal ASR mismatch retained',generationCalls:3,parentGenerationCalls:0,segmentDiagnosticAsrCalls:3,parentGermanAsrCalls:2,totalAsrCalls:5,retryBudget:0,evidenceFiles:observed.map(record=>({sha256:record.sha256}))};
 const collection={projection:receipt,clip:ruedigerPilotPublicClip(clip)};
 ruedigerPilotCollectedEvidence.set(collection,ruedigerPilotDigest(JSON.stringify(collection)));
 return collection;
}
// Explicit public projection: never spread a private receipt or expose its paths.
function ruedigerPilotPublicClip(clip){
 const publicClip=crowdPublicFields(clip,[...crowdPublicJobFields,'textSha256','codeSwitchParent','phaseScope','synthesisAttempt','synthesisAttemptBasis','rawSha256','requestSha256','authoredPlanSha256','pilotPlanSha256','authoringHelperSha256','sampleRateHz','channels','bitrateBitsPerSecond','bytes','durationSeconds','integratedLufs','truePeakDbtp','asr','asrWordExact','asrLiteralWordExact','codeSwitchStrictParentGate','asrLanguageId','asrDevice','asrCpuThreads','asrComputeType','asrEffectiveComputeType','asrModelSha256','asrScriptPrompt','asrBeamSize','sha256','file']);
 publicClip.segments=clip.segments.map(row=>crowdPublicFields(row,['index','text','sourceStart','sourceEnd','languageId','joinBefore']));
 publicClip.decode=crowdPublicFields(clip.decode,['eosReached','basis','allSegmentEosObserved']);
 publicClip.codeSwitchJoin=crowdPublicFields(clip.codeSwitchJoin,['method','sampleRateHz','channels','insertedSilence','crossfade','edit','ffmpegSha256','ffprobeSha256','filterGraph','segmentPcmSha256','joinedPcmSha256']);
 publicClip.codeSwitchParentContinuation=crowdPublicFields(clip.codeSwitchParentContinuation,['selector','segmentAuthoringHelperSha256','parentAuthoringHelperSha256','ledgerSha256BeforeParentAsr','segmentDiagnosticReceiptSha256']);
 publicClip.codeSwitchParts=ruedigerPilotPartsForPublic(clip.codeSwitchParts);
 publicClip.asrReadings=clip.asrReadings.map(reading=>({...crowdPublicFields(reading,['beamSize','transcript','transcribeSeconds','inputScope','encodedSha256','asrModelSha256','languageId','device','cpuThreads','computeType','effectiveComputeType','scriptPrompt','wordTimestamps']),words:reading.words.map(word=>crowdPublicFields(word,['word','start','end']))}));
 publicClip.wordCues=[];
 // The joined parent has no native profile receipt of its own; the collector
 // checked this exact profile hash in the authority and all three raw parts.
 publicClip.profileJsonSha256=ruedigerPilotHomophone.profileJsonSha256;
 publicClip.referenceLicense='CC0-1.0';publicClip.modelLicense='MIT';publicClip.listening='pending';
 return publicClip;
}
function ruedigerPilotPartsForPublic(parts){
 return parts.map(part=>({...crowdPublicFields(part,['clipId','text','sourceStart','sourceEnd','languageId','voiceId','profileId','referenceSha256','rawSha256','encodedSha256','rendererInputText','authoringHelperSha256','renderer','modelRevision','rawSampleRateHz','rawChannels','encodedSampleRateHz','encodedChannels','asrModelSha256','asr','asrLanguageId','asrScriptPrompt','asrDiagnosticOnly','eosReached','eosTraceSha256','seed','synthesisAttempt','rawReceiptSha256','diagnosticReceiptSha256']),decode:crowdPublicFields(part.decode,['eosReached','eosTraceSha256','attentionHooksBefore','attentionHooksAfter','generatedSpeechTokens','maxSpeechTokens','modelEosRestoredSteps']),synthesis:crowdPublicFields(part.synthesis,['languageId','device','precision','t3WeightPrecision','conditioningPrecision','referenceReconditionedForProfile','referenceConditioningVerifiedFloat32','exaggeration','temperature','repetitionPenalty','cfgWeight','cpuThreads','inferenceMode'])}));
}
// END exact Ruediger pilot homophone projection v1

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
 const clips=[],ruedigerPilotHomophoneEvidence={};
 for(const manifest of manifests){
  const selected=manifest.clips.filter(clip=>clip.approval?.status==='user-approved');if(!selected.length)continue;
  const admission=manifest.crowdAdmission;
  if(manifest.generationScope==='exact-ruediger-pilot-homophone'){
   const clip=ruedigerPilotHomophoneManifestAuthority(cast,manifest,sourceRoot);
   ruedigerPilotHomophoneEvidence[clip.clipId]=admission;
   clips.push({...clip,...(mouthRows?.[clip.clipId]?{mouthHz:40,mouthEnergy:mouthRows[clip.clipId].mouthEnergy}:{}),provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});
   continue;
  }
  requireMatch(admission?.status==='ROOT-verified-current-generation'&&admission.helperSha256===crowdAuthoringHelperSha256&&/^[a-f0-9]{64}$/.test(admission.authoritySha256)&&/^[a-f0-9]{64}$/.test(admission.adapterSha256),'Missing current-generation crowd admission');
  const {authored}=crowdPublicPlan(cast,admission.fullPlan,sourceRoot);
  requireMatch(Object.keys(admission.takes).length===selected.length,'Crowd admitted take coverage changed');
  for(const clip of selected){const job=authored.get(clip.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(clip[key],value)),'Default crowd source/English/owner drift');if(manifest.generationScope==='remaining27-first-takes'){
    requireMatch(admission.generationScope==='remaining27-first-takes'&&/^[a-f0-9]{64}$/.test(admission.nativePlanOriginSha256),'Remaining27 generation proof/origin missing');
    crowdRemainingClipAuthority(cast,clip,admission.takes[clip.clipId],admission.requestSha256);
   }else crowdDefaultClipAuthority(cast,clip,admission.takes[clip.clipId],admission.requestSha256);clips.push({...clip,...(mouthRows?.[clip.clipId]?{mouthHz:40,mouthEnergy:mouthRows[clip.clipId].mouthEnergy}:{}),provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});}
 }
 return fixedRecordingsBlock(cast,{clips,ruedigerPilotHomophoneEvidence},'crowd-dialogue',assetRoot,sourceRoot);
}

// Scoped extension for remaining27; original first9 validators remain unchanged.
export function crowdRemainingSeed(job){
 if(job.region==='germany'&&job.slot===1)return 71000;
 if(job.region==='berlin'&&job.slot===0)return 71001;
 if(job.region==='berlin'&&job.slot===1)return 71002;
 throw Error('Germany0 is outside remaining27 generation');
}
export function verifyCrowdRemainingSeed(job,seed){requireMatch(seed===crowdRemainingSeed(job),'Wrong owned remaining27 native seed');return seed;}
export function verifyCrowdGenerationManifestLedger(manifest,relative,digest,ledger){
 const scope=manifest.generationScope??'first9';requireMatch(scope==='first9'||scope==='remaining27-first-takes'||scope==='exact-ruediger-pilot-homophone','Unknown crowd generation scope');
 if(scope==='remaining27-first-takes')requireMatch(relative===`assets/voices/candidate-dialogue/${manifest.voiceId}-remaining27-crowd-manifest.json`,'Remaining27 manifest filename does not own its voice/scope');
 if(scope==='exact-ruediger-pilot-homophone')requireMatch(relative===ruedigerPilotHomophoneManifestPath&&manifest.voiceId===ruedigerPilotHomophone.voiceId&&manifest.clips?.length===1&&manifest.clips[0].clipId===ruedigerPilotHomophone.clipId&&manifest.clips[0].sha256===ruedigerPilotHomophone.sha256&&/^[a-f0-9]{64}$/.test(digest)&&ledger[relative]===digest,'Exact-pilot manifest lacks its own ROOT admission anchor or scope identity');
 if(manifest.clips.some(clip=>clip.approval?.status==='user-approved'))requireMatch(ledger[relative]===digest,'Crowd default manifest lacks verified ROOT private admission');
}
function crowdRemainingClipAuthority(cast,clip,proof,requestSha256){
 verifyCrowdRemainingSeed(clip,clip.seed);
 fixedTakeAuthority(cast,clip);crowdExactCues(clip);
 requireMatch(clip.file===`assets/voices/candidate-dialogue/${clip.clipId}.mp3`,'Crowd public file must be its canonical relative asset path');
 requireMatch(clip.authoringHelperSha256===crowdAuthoringHelperSha256&&clip.requestSha256===requestSha256&&clip.rendererInputText===clip.text&&clip.rendererInputBasis==='exact authored source'&&clip.synthesisAttempt===1&&clip.seed===crowdRemainingSeed(clip),'Crowd clip is not the named current-generation first take');
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
export function prepareCrowdRemaining27Manifest(cast,manifest,authorityProof,sourceRoot=root){
 crowdCandidateBlock(cast,[],sourceRoot); // Existing caller/selection authority, without reading candidate assets.
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Crowd ROOT authority bytes changed');
 const authority=json(authorityProof.path);
 requireMatch(authority.status==='ROOT_SEALED_FINITE_CROWD27'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.grantId&&/^[a-f0-9]{40}$/.test(authority.sourceCommit)&&authority.helperSha256===crowdAuthoringHelperSha256&&authority.maximumNativeCalls===27&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===54&&authority.automaticRetries===0,'Not the reviewed remaining27 generation authority');
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
  const job=authored.get(clip.clipId);requireMatch(job&&Object.hasOwn(authority.tokenCaps,clip.clipId)&&crowdRemainingSeed(job)===authority.seeds[clip.clipId]&&Object.entries(job).every(([key,value])=>sameJson(clip[key],value)),'Clip outside actual remaining27 owned source');
  const rawPath=privateFile(`raw/${clip.clipId}.json`),encodedPath=privateFile(`encoded/${clip.clipId}.json`),raw=json(rawPath),encoded=json(encodedPath);
  for(const [key,value] of Object.entries(job))requireMatch(sameJson(raw[key],value)&&sameJson(encoded[key],value),'Actual crowd receipt source/owner/profile drift');
  for(const [key,value] of Object.entries(raw))if(!['durationSeconds','status'].includes(key))requireMatch(sameJson(encoded[key],value),'Crowd raw/encoded lineage drift: '+key);
  for(const [key,value] of Object.entries(encoded))if(key!=='asrReadings'||clip[key]!==undefined)requireMatch(sameJson(clip[key],value),'Crowd public clip changed an actual encoded receipt field: '+key);
  requireMatch(raw.requestSha256===requestSha256&&raw.profileJsonSha256===authority.profileBindings[voice]?.profileJsonSha256&&raw.decode?.maxSpeechTokens===authority.tokenCaps[clip.clipId]&&encoded.asrModelSha256===authority.asrModelSha256&&encoded.asrReadings?.length>=1&&encoded.asrReadings.length<=2&&sameJson(encoded.asrReadings.map(row=>row.beamSize),encoded.asrReadings.length===1?[1]:[1,5])&&encoded.asrReadings.at(-1).transcript===encoded.asr,'Crowd actual private decoder/ASR evidence changed');
  requireMatch(hash(privateFile(`raw/${clip.clipId}.wav`))===raw.rawSha256&&hash(privateFile(`encoded/${clip.clipId}.mp3`))===encoded.sha256&&readFileSync(privateFile(`encoded/${clip.clipId}.mp3`)).length===encoded.bytes,'Crowd actual private audio bytes changed');
  const proof={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:raw.rawSha256,encodedSha256:encoded.sha256,profileJsonSha256:raw.profileJsonSha256,maxSpeechTokens:raw.decode.maxSpeechTokens,asrModelSha256:encoded.asrModelSha256,asrBeamSize:encoded.asrBeamSize,asrReadings:encoded.asrReadings.length};
  crowdRemainingClipAuthority(cast,clip,proof,requestSha256);takes[clip.clipId]=proof;
 }
 const records=[...manifest.clips,...manifest.heldPrivate],ids=records.map(row=>row.clipId);
 requireMatch(manifest.requestedLineCount===4&&manifest.clips.length>=1&&manifest.clips.length<=3&&manifest.lineCount===manifest.clips.length&&records.length===4&&new Set(ids).size===4&&manifest.generatedLineCount===3,'Actual successful remaining27 manifest accounting changed');
 for(const row of records){const job=owned.find(job=>job.clipId===row.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value)),'Crowd manifest slot changed from full36 source');}
 requireMatch(manifest.heldPrivate.filter(row=>row.region==='germany'&&row.slot===0).length===1&&manifest.heldPrivate.every(row=>row.region==='germany'&&row.slot===0?row.reason==='outside remaining27 grant; first batch preserved':[['held private; selected production fallback','technically verified; awaiting clip/hash-specific use selection'].includes(row.reason),crowdRemainingSeed(row)>=71000].every(Boolean)),'Remaining27 must preserve the first-batch slot outside this grant');
 const selectedIds=plan.jobs.filter(row=>!(row.region==='germany'&&row.slot===0)).map(row=>row.clipId);
 requireMatch(authority.generationScope==='remaining27-first-takes'&&sameJson(authority.selectedClipIds,selectedIds)&&selectedIds.length===27,'Wrong remaining27 authority selection');
 const allowedFailures=['missing or failed native EOS','independent spoken-word equivalence','literal exact ASR required by current remaining27 contract','encoded loudness/true peak','incomplete exact final-caption cues'];
 requireMatch(manifest.heldPrivate.every(row=>!row.failedGates||Array.isArray(row.failedGates)&&row.failedGates.every(gate=>allowedFailures.includes(gate))),'Private failure payload cannot enter remaining27 public manifest');
 // Explicit public contract: no structured clone of private manifests/receipts.
 // Native request bytes keep their own digest; the public source projection is
 // not represented as byte-identical to that original private request file.
 const publicPlan={nativeSha256:fullPlan.sha256,sourceSha256:crowdPublicFields(plan.sourceSha256,['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js']),jobs:plan.jobs.map(job=>crowdPublicFields(job,crowdPublicJobFields))};
 const result={schemaVersion:1,generationScope:'remaining27-first-takes',voiceId:voice,profileId:manifest.profileId,fallback:cast.productionVoices[voice].fallback??'captions',status:'same-profile technical and independent ASR audit; perceptual listening not independently verified',requestedLineCount:4,generatedLineCount:3,lineCount:manifest.clips.length,clips:manifest.clips.map(crowdPublicClip),heldPrivate:manifest.heldPrivate.map(row=>({...crowdPublicFields(row,crowdPublicJobFields),reason:row.reason,...(row.failedGates?{failedGates:[...row.failedGates]}:{})})),approvedExistingReuse:[]};
 result.crowdAdmission={status:'ROOT-verified-current-generation',generationScope:'remaining27-first-takes',nativePlanOriginSha256:authority.reusedNativePlanSummarySha256,authoritySha256:authorityProof.sha256,adapterSha256:authority.adapterSha256,helperSha256:crowdAuthoringHelperSha256,fullPlan:publicPlan,requestSha256,takes};
 return result;
}

// This wrapper exposes the unchanged seven-clip measurement subset for review fixtures.
export function verifyCrowdMouthEnergySubset(supplement,manifests,assetRoot=root){return crowdMouthEnergyRows(supplement,manifests,assetRoot);}

export function collectCrowd27PrivateManifestProposals(cast,authorityProof,terminalProofs,selectionProof=null,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Remaining27 authority changed');
 const authority=json(authorityProof.path),phases=['plan','render','process'],terminalHashes={};
 requireMatch(authority.status==='ROOT_SEALED_FINITE_CROWD27'&&authority.generationScope==='remaining27-first-takes'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.helperSha256===crowdAuthoringHelperSha256&&authority.maximumNativeCalls===27&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===54&&authority.automaticRetries===0,'Not the exact remaining27 first-take grant');
 for(const phase of phases){
  const proof=terminalProofs?.[phase];requireMatch(proof?.sha256===hash(proof.path),'Missing/changed remaining27 terminal: '+phase);const terminal=json(proof.path);
  requireMatch(terminal.phase===phase&&terminal.specificationSha256===authorityProof.sha256&&terminal.producerSha256===authority.adapterSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&!terminal.supervisorError&&terminal.logsComplete===true&&Array.isArray(terminal.survivingOwnedChildren)&&!terminal.survivingOwnedChildren.length&&Array.isArray(terminal.ownedCleanupKills)&&!terminal.ownedCleanupKills.length&&Array.isArray(terminal.postflightPinFailures)&&!terminal.postflightPinFailures.length&&terminal.postflightProtectedPinsChecked===Object.keys(authority.protectedPublicPins).length&&terminal.postflightProtectedPrivatePinsChecked===57&&Array.isArray(terminal.postflightPrivatePinFailures)&&!terminal.postflightPrivatePinFailures.length,'Remaining27 phase did not retire with conservation: '+phase);terminalHashes[phase]=proof.sha256;
 }
 requireMatch(authority.pendingPrivatePinPaths?.length===0&&authority.requiredProtectedPrivatePaths.length===57&&new Set(authority.requiredProtectedPrivatePaths).size===57&&Object.keys(authority.protectedPrivatePins).length===57&&authority.requiredProtectedPrivatePaths.every(path=>Object.hasOwn(authority.protectedPrivatePins,path)),'Original first-batch protection incomplete');
 for(const [path,digest] of Object.entries(authority.protectedPrivatePins))requireMatch(hash(path)===digest,'Original first-batch private bytes changed');
 requireMatch(hash(authority.requestPath)===authority.requestSha256,'Remaining27 full36 request changed');
 const {plan,authored}=crowdFullPlan(cast,{text:readFileSync(authority.requestPath,'utf8'),sha256:authority.requestSha256},sourceRoot);
 requireMatch(sameJson(plan.sourceSha256,authority.sourceSha256),'Remaining27 source pins differ');
 const selectedJobs=plan.jobs.filter(row=>!(row.region==='germany'&&row.slot===0)),voices=[...new Set(selectedJobs.map(row=>row.voiceId))];
 requireMatch(selectedJobs.length===27&&voices.length===9&&sameJson(selectedJobs.map(row=>row.clipId),authority.selectedClipIds)&&selectedJobs.every(row=>authority.seeds[row.clipId]===crowdRemainingSeed(row)),'Remaining27 selection/seed ownership changed');
 const family=resolve(authority.musicRoot,plan.privateReviewFamily);requireMatch(realpathSync(family)===family,'Remaining27 family alias');
 const privateFile=relative=>{const path=resolve(family,relative);requireMatch(path.startsWith(family+sep)&&realpathSync(path)===path&&!lstatSync(path).isSymbolicLink(),'Remaining27 private path alias/escape');return path;};
 const summaries={},summaryHashes={};
 for(const phase of phases){
  const path=privateFile(`_batch27-control/${phase}-summary.json`),summary=json(path);requireMatch(summary.phase===phase&&summary.authoritySha256===authorityProof.sha256&&summary.adapterSha256===authority.adapterSha256&&summary.helperSha256===crowdAuthoringHelperSha256&&summary.selectedClipCount===27&&summary.publicExports===0&&summary.humanListeningVerified===false&&summary.automaticRetries===0&&summary.rows?.length===(phase==='plan'?9:27),'Remaining27 adapter summary changed: '+phase);summaries[phase]=summary;summaryHashes[phase]=hash(path);
 }
 requireMatch(summaries.plan.nativePlanInvocationThisGrant===false&&summaries.plan.nativePlanOriginSha256===authority.reusedNativePlanSummarySha256&&summaries.plan.nativePlanOriginAuthoritySha256===authority.predecessorAuthoritySha256&&hash(authority.reusedNativePlanSummaryPath)===authority.reusedNativePlanSummarySha256,'Genuine existing native-plan reuse origin changed');
 const ids=new Set(authority.selectedClipIds);
 for(const phase of ['render','process'])requireMatch(new Set(summaries[phase].rows.map(row=>row.clipId)).size===27&&summaries[phase].rows.every(row=>ids.has(row.clipId)),'Remaining27 summary duplicate/out-of-scope clip');
 const selection=selectionProof?(requireMatch(selectionProof.sha256===hash(selectionProof.path),'Remaining27 use selection changed'),json(selectionProof.path)):null,selections=new Map();
 if(selection){requireMatch(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&selection.instruction?.trim()&&Array.isArray(selection.clips),'Missing remaining27 use selection');for(const row of selection.clips){requireMatch(ids.has(row.clipId)&&!selections.has(row.clipId)&&/^[a-f0-9]{64}$/.test(row.encodedSha256),'Selection duplicate/outside remaining27');selections.set(row.clipId,row.encodedSha256);}}
 const proposals=[],inventory=[];let eligibleCount=0,selectedCount=0;
 for(const voice of voices){
  const owned=plan.jobs.filter(row=>row.voiceId===voice),batch=owned.filter(row=>ids.has(row.clipId)),prior=owned.find(row=>row.region==='germany'&&row.slot===0);requireMatch(owned.length===4&&batch.length===3&&prior,'Wrong remaining27 four-slot ownership');
  const requestPath=privateFile(`${voice}/requests.json`),requestHash=hash(requestPath),request=json(requestPath),planRow=summaries.plan.rows.find(row=>row.voiceId===voice);
  requireMatch(planRow?.frozenRequestPath===requestPath&&planRow.sha256===requestHash&&summaries.plan.frozenRequestPins[requestPath]===requestHash&&sameJson(request.jobs,owned)&&request.requestedLineCount===4&&request.authoredPlanSha256===authority.requestSha256&&sameJson(request.sourceSha256,plan.sourceSha256)&&sameJson(request.authoredPlanSourceSha256,plan.sourceSha256),'Existing actual four-slot request changed');
  const clips=[],held=[{...prior,reason:'outside remaining27 grant; first batch preserved'}];
  for(const job of batch){
   const rawPath=privateFile(`${voice}/raw/${job.clipId}.json`),raw=json(rawPath),rawHash=hash(rawPath),render=summaries.render.rows.find(row=>row.clipId===job.clipId),processed=summaries.process.rows.find(row=>row.clipId===job.clipId);
   requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.authoringHelperSha256===crowdAuthoringHelperSha256&&raw.requestSha256===requestHash&&raw.seed===crowdRemainingSeed(job)&&raw.synthesisAttempt===1&&render.receiptSha256===rawHash&&render.rawSha256===raw.rawSha256&&render.profileId===job.profileId&&render.actualTakeWithinGrant===1&&render.globalHistoricalOrdinal===null&&render.nativeEosReached===(raw.decode?.eosReached===true)&&processed.receiptSha256===rawHash&&processed.rawSha256===raw.rawSha256,'Remaining27 actual raw/summary provenance changed');
   requireMatch(hash(privateFile(`${voice}/raw/${job.clipId}.wav`))===raw.rawSha256,'Remaining27 raw bytes changed');
   const gates=[];let encoded=null,encodedHash=null;
   if(raw.decode?.eosReached!==true){gates.push('missing or failed native EOS');requireMatch(processed.asrReadings===0&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.json`))&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.mp3`))&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}-processed.wav`)),'Non-EOS remaining27 take has encoding/intermediate/audit');}
   else{
    const path=privateFile(`${voice}/encoded/${job.clipId}.json`);encoded=json(path);encodedHash=hash(path);
    requireMatch(processed.encodedReceiptSha256===encodedHash&&processed.encodedSha256===encoded.sha256&&Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&encoded.rawSha256===raw.rawSha256&&encoded.requestSha256===requestHash&&encoded.authoringHelperSha256===crowdAuthoringHelperSha256,'Remaining27 actual encoded receipt changed');
    requireMatch(hash(privateFile(`${voice}/encoded/${job.clipId}.mp3`))===encoded.sha256,'Remaining27 encoded bytes changed');
    requireMatch(processed.asrWordExact===encoded.asrWordExact&&processed.asrReadings===encoded.asrReadings?.length&&processed.wordCueCount===encoded.wordCues?.length&&processed.levelsPass===(Math.abs(encoded.integratedLufs+18)<=.3&&encoded.truePeakDbtp<=-1.5),'Remaining27 final gates differ from completed summary');
    if(encoded.asrWordExact!==true)gates.push('independent spoken-word equivalence');
    if(encoded.asrLiteralWordExact!==true)gates.push('literal exact ASR required by current remaining27 contract');
    if(Math.abs(encoded.integratedLufs+18)>.3||!Number.isFinite(encoded.integratedLufs)||encoded.truePeakDbtp>-1.5||!Number.isFinite(encoded.truePeakDbtp))gates.push('encoded loudness/true peak');
    try{crowdExactCues(encoded);}catch(error){requireMatch(error.message==='Incomplete crowd exact final-caption cues','Unexpected remaining27 caption integrity error');gates.push('incomplete exact final-caption cues');}
   }
   const eligible=gates.length===0;if(eligible){fixedTakeAuthority(cast,encoded);eligibleCount++;}
   const selected=selections.has(job.clipId);requireMatch(!selected||eligible&&selections.get(job.clipId)===encoded.sha256,'Use selection includes a failed/wrong-hash remaining27 take');
   if(selected){const {asrReadings,...actualEncodedFields}=encoded;clips.push({...actualEncodedFields,approval:{status:'user-approved',scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256}});selectedCount++;}
   else held.push({...job,reason:eligible?'technically verified; awaiting clip/hash-specific use selection':'held private; selected production fallback',failedGates:gates});
   inventory.push({clipId:job.clipId,voiceId:voice,nativeSeed:raw.seed,actualSynthesisAttempt:1,rawReceiptSha256:rawHash,rawSha256:raw.rawSha256,nativeEosReached:raw.decode?.eosReached===true,encodedReceiptSha256:encodedHash,encodedSha256:encoded?.sha256??null,technicalEligible:eligible,selectedForUse:selected,failedGates:gates,humanListeningVerified:false});
  }
  const manifest={schemaVersion:1,generationScope:'remaining27-first-takes',voiceId:voice,profileId:owned[0].profileId,fallback:cast.productionVoices[voice].fallback??'captions',status:'private remaining27 generation proposal; prior slot preserved',requestedLineCount:4,generatedLineCount:3,lineCount:clips.length,clips,heldPrivate:held,approvedExistingReuse:[]};
  proposals.push(clips.length?prepareCrowdRemaining27Manifest(cast,manifest,authorityProof,sourceRoot):manifest);
 }
 requireMatch(proposals.length===9&&inventory.length===27&&proposals.every(row=>row.clips.length+row.heldPrivate.length===4),'Remaining27 proposals lost owned slots');
 return{status:'private remaining27 proposal collection only; no public writes',authoritySha256:authorityProof.sha256,nativeFullPlanSha256:authority.requestSha256,terminalSha256:terminalHashes,adapterSummarySha256:summaryHashes,selectionSha256:selectionProof?.sha256??null,counts:{nativeRequestSlots:36,generatedThisGrant:27,priorProtectedSlots:9,unrendered:0,technicalEligible:eligibleCount,selectedNewClips:selectedCount,heldGenerated:27-selectedCount,humanListeningVerified:0},inventory,partialManifestProposals:proposals};
}


const crowdInterruptedGate='interrupted ASR result unknown; no retry';
const crowdInterruptedReason='held private; interrupted ASR unknown; no retry';
export function verifyCrowd27RecoveryAccounting(authority,summary){
 const prior=authority.completedPriorClipIds,selected=authority.selectedClipIds,held=authority.heldInterruptedClipIds,ids=authority.allRenderedClipIds;
 requireMatch(prior?.length===21&&selected?.length===5&&sameJson(held,['crowd-manfred-mittagsruhe-germany-02'])&&ids?.length===27&&new Set([...prior,...selected,...held]).size===27&&ids.every(id=>[...prior,...selected,...held].includes(id)),'Recovery must account for exact21saved+5new+1interrupted');
 requireMatch(summary.originalProcessSuccessful===false&&summary.previousCompletedCount===21&&summary.newRecoveryCompletedCount===5&&summary.heldInterruptedCount===1&&summary.selectedClipCount===27&&summary.newNativeCalls===0&&Number.isInteger(summary.newAsrReadings)&&summary.newAsrReadings>=5&&summary.newAsrReadings<=10&&summary.overallExactAsrCountKnown===false&&sameJson(summary.unknownInterruptedAsrReadings,{minimum:0,maximum:2}),'Recovery cannot replace original failure with success or invent exact interrupted read count');
 requireMatch(Array.isArray(summary.rows)&&sameJson(summary.rows.map(row=>row.clipId),ids),'Recovery aggregate rows missing/duplicated/reordered');
 for(const row of summary.rows){
  if(held.includes(row.clipId))requireMatch(row.processingOrigin==='original-process-interrupted-held-unknown'&&row.asrReadings===null&&row.technicalEligible===false&&sameJson(row.asrReadingsBounds,{minimum:0,maximum:2}),'Interrupted take cannot become completed or eligible');
  else requireMatch(row.processingOrigin===(prior.includes(row.clipId)?'saved-before-original-process-interruption':'new-recovery5-process')&&Number.isInteger(row.asrReadings)&&row.asrReadings>=1&&row.asrReadings<=2&&sameJson(row.asrBeams,row.asrReadings===1?[1]:[1,5]),'Recovery completed row origin/read count changed');
 }
 const known=summary.rows.filter(row=>!held.includes(row.clipId)).reduce((sum,row)=>sum+row.asrReadings,0),newReadings=summary.rows.filter(row=>selected.includes(row.clipId)).reduce((sum,row)=>sum+row.asrReadings,0);
 requireMatch(summary.knownCompletedAsrReadings===known&&summary.newAsrReadings===newReadings&&summary.overallAsrReadingsUpperBound===known+2&&known+2<=54,'Recovery exceeded original54ASR worst-case budget');
 return true;
}
function verifyCrowd27RecoveryEvidence(recoveryAuthorityProof,recoveryTerminalProof,recoverySummaryProof){
 requireMatch(recoveryAuthorityProof?.sha256===hash(recoveryAuthorityProof.path),'Recovery authority bytes changed');
 const recovery=json(recoveryAuthorityProof.path);
 requireMatch(recovery.status==='ROOT_SEALED_FINITE_CROWD27_PROCESS_RECOVERY5'&&recovery.generationScope==='remaining27-processing-recovery5'&&recovery.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&recovery.helperSha256===crowdAuthoringHelperSha256&&recovery.grantId&&recovery.maximumNativeCalls===0&&recovery.maximumCallsPerClip===0&&recovery.maximumAsrReadings===10&&recovery.automaticRetries===0&&recovery.processPhaseWallSeconds===900,'Not the explicit process-only recovery5 grant');
 requireMatch(recovery.pendingPrivatePinPaths?.length===0&&Object.keys(recovery.protectedPrivatePins).length===178&&new Set(recovery.requiredProtectedPrivatePaths).size===178&&recovery.requiredProtectedPrivatePaths.every(path=>Object.hasOwn(recovery.protectedPrivatePins,path))&&Object.keys(recovery.protectedPublicPins).length===262,'Recovery conservation scope changed');
 for(const [path,digest] of Object.entries(recovery.protectedPrivatePins))requireMatch(hash(path)===digest,'Recovery changed a protected prior/private artifact');
 requireMatch(recoveryTerminalProof?.sha256===hash(recoveryTerminalProof.path),'Recovery terminal changed');
 const terminal=json(recoveryTerminalProof.path);
 requireMatch(terminal.phase==='process'&&terminal.specificationSha256===recoveryAuthorityProof.sha256&&terminal.producerSha256===recovery.adapterSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&!terminal.supervisorError&&terminal.logsComplete===true&&Array.isArray(terminal.survivingOwnedChildren)&&!terminal.survivingOwnedChildren.length&&Array.isArray(terminal.ownedCleanupKills)&&!terminal.ownedCleanupKills.length&&terminal.postflightProtectedPinsChecked===262&&Array.isArray(terminal.postflightPinFailures)&&!terminal.postflightPinFailures.length&&terminal.postflightProtectedPrivatePinsChecked===178&&Array.isArray(terminal.postflightPrivatePinFailures)&&!terminal.postflightPrivatePinFailures.length,'Recovery process did not retire successfully with conservation');
 const originalAuthorityProof={path:recovery.originalAuthorityPath,sha256:recovery.originalAuthoritySha256};
 requireMatch(hash(originalAuthorityProof.path)===originalAuthorityProof.sha256,'Original generation authority changed');
 const original=json(originalAuthorityProof.path),terminals={},terminalHashes={};
 requireMatch(original.status==='ROOT_SEALED_FINITE_CROWD27'&&original.maximumNativeCalls===27&&original.maximumAsrReadings===54&&sameJson(original.selectedClipIds,recovery.allRenderedClipIds)&&sameJson(original.sourceSha256,recovery.sourceSha256)&&original.helperSha256===recovery.helperSha256&&original.requestSha256===recovery.requestSha256,'Recovery original generation/source changed');
 for(const phase of ['plan','render','process']){
  const proof=recovery.originalTerminals[phase];requireMatch(proof?.sha256===hash(proof.path),'Original phase terminal changed: '+phase);const row=json(proof.path);
  requireMatch(row.phase===phase&&row.specificationSha256===originalAuthorityProof.sha256&&row.producerSha256===original.adapterSha256&&row.rootRetired===true&&row.survivingOwnedChildren?.length===0&&row.ownedCleanupKills?.length===0&&row.postflightProtectedPinsChecked===262&&row.postflightProtectedPrivatePinsChecked===57&&row.postflightPinFailures?.length===0&&row.postflightPrivatePinFailures?.length===0,'Original retirement/conservation changed');
  if(phase==='process')requireMatch(row.exitCode===-1&&row.timedOut===false&&row.supervisorError==='Root or owned child PID reused; child lineage is ambiguous','Original process failure must remain failed');
  else requireMatch(row.exitCode===0&&row.timedOut===false&&!row.supervisorError&&row.logsComplete===true,'Original plan/render did not succeed');
  terminals[phase]=row;terminalHashes[phase]=proof.sha256;
 }
 requireMatch(hash(recovery.failureInventoryPath)===recovery.failureInventorySha256,'Failure inventory bytes changed');
 const failureInventory=json(recovery.failureInventoryPath);
 requireMatch(failureInventory.authoritySha256===originalAuthorityProof.sha256&&failureInventory.failedTerminalSha256===terminalHashes.process&&failureInventory.conservationFailures?.length===0,'Failure inventory belongs to another phase');
 const priorInventory=failureInventory.rows.filter(row=>row.artifacts['encoded.json']).map(row=>row.clipId),heldInventory=failureInventory.rows.filter(row=>!row.artifacts['encoded.json']&&(row.artifacts['encoded.mp3']||row.artifacts['encoded-processed.wav'])).map(row=>row.clipId),untouchedInventory=failureInventory.rows.filter(row=>!row.artifacts['encoded.json']&&!row.artifacts['encoded.mp3']&&!row.artifacts['encoded-processed.wav']).map(row=>row.clipId);
 requireMatch(failureInventory.rows.length===27&&failureInventory.rows.every(row=>row.artifacts['raw.json']&&row.artifacts['raw.wav'])&&sameJson(priorInventory,recovery.completedPriorClipIds)&&sameJson(heldInventory,recovery.heldInterruptedClipIds)&&sameJson(untouchedInventory,recovery.selectedClipIds),'Recovery partition differs from actual failure byte inventory');
 const family=resolve(recovery.musicRoot,recovery.privateReviewFamily),control=resolve(family,'_batch27-recovery5-control');
 requireMatch(recoverySummaryProof?.path===resolve(control,'process-summary.json')&&hash(recoverySummaryProof.path)===recoverySummaryProof.sha256&&realpathSync(recoverySummaryProof.path)===recoverySummaryProof.path&&!lstatSync(recoverySummaryProof.path).isSymbolicLink(),'Recovery summary path/bytes changed');
 const summary=json(recoverySummaryProof.path);
 requireMatch(summary.phase==='process'&&summary.generationScope==='remaining27-processing-recovery5'&&summary.authoritySha256===recoveryAuthorityProof.sha256&&summary.adapterSha256===recovery.adapterSha256&&summary.helperSha256===crowdAuthoringHelperSha256&&summary.originalAuthoritySha256===originalAuthorityProof.sha256&&sameJson(summary.originalTerminalsSha256,terminalHashes)&&summary.failureInventorySha256===recovery.failureInventorySha256&&summary.publicExports===0&&summary.humanListeningVerified===false&&summary.automaticRetries===0,'Recovery aggregate provenance changed');
 verifyCrowd27RecoveryAccounting(recovery,summary);
 const expectedCharges=[];
 for(const row of summary.rows.filter(row=>recovery.selectedClipIds.includes(row.clipId)))for(const beam of row.asrBeams){
  const path=resolve(control,'asr-charges',`${row.clipId}-beam${beam}.json`),charge=json(path);requireMatch(realpathSync(path)===path&&!lstatSync(path).isSymbolicLink()&&charge.authoritySha256===recoveryAuthorityProof.sha256&&charge.clipId===row.clipId&&charge.beamSize===beam,'Recovery durable ASR charge changed');expectedCharges.push(`${row.clipId}-beam${beam}.json`);
 }
 requireMatch(sameJson(readdirSync(resolve(control,'asr-charges')).sort(),expectedCharges.sort()),'Recovery has duplicate/foreign/unreported ASR charges');
 for(const row of failureInventory.rows)for(const artifact of Object.values(row.artifacts))if(artifact)requireMatch(recovery.protectedPrivatePins[artifact.path]===artifact.sha256,'Failure artifact not preserved by recovery');
 const publicProof={schemaVersion:1,status:'ROOT-verified-processing-recovery5',recoveryAuthoritySha256:recoveryAuthorityProof.sha256,recoveryAdapterSha256:recovery.adapterSha256,recoveryTerminalSha256:recoveryTerminalProof.sha256,aggregateSummarySha256:recoverySummaryProof.sha256,failedOriginalProcessTerminalSha256:terminalHashes.process,failureInventorySha256:recovery.failureInventorySha256,originalProcessSuccessful:false,aggregatePreviouslyCompleted:21,aggregateRecoveryCompleted:5,aggregateHeldInterrupted:1,overallExactAsrCountKnown:false,unknownInterruptedAsrReadings:{minimum:0,maximum:2}};
 return {recovery,originalAuthorityProof,original,terminalHashes,summary,summarySha256:recoverySummaryProof.sha256,failureInventory,publicProof};
}

function prepareCrowdRemaining27RecoveryManifest(cast,manifest,evidence,sourceRoot=root){
 const authorityProof=evidence.originalAuthorityProof;
 crowdCandidateBlock(cast,[],sourceRoot); // Existing caller/selection authority, without reading candidate assets.
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Crowd ROOT authority bytes changed');
 const authority=json(authorityProof.path);
 requireMatch(authority.status==='ROOT_SEALED_FINITE_CROWD27'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.grantId&&/^[a-f0-9]{40}$/.test(authority.sourceCommit)&&authority.helperSha256===crowdAuthoringHelperSha256&&authority.maximumNativeCalls===27&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===54&&authority.automaticRetries===0,'Not the reviewed remaining27 generation authority');
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
  const job=authored.get(clip.clipId);requireMatch(job&&Object.hasOwn(authority.tokenCaps,clip.clipId)&&crowdRemainingSeed(job)===authority.seeds[clip.clipId]&&Object.entries(job).every(([key,value])=>sameJson(clip[key],value)),'Clip outside actual remaining27 owned source');
  const rawPath=privateFile(`raw/${clip.clipId}.json`),encodedPath=privateFile(`encoded/${clip.clipId}.json`),raw=json(rawPath),encoded=json(encodedPath);
  for(const [key,value] of Object.entries(job))requireMatch(sameJson(raw[key],value)&&sameJson(encoded[key],value),'Actual crowd receipt source/owner/profile drift');
  for(const [key,value] of Object.entries(raw))if(!['durationSeconds','status'].includes(key))requireMatch(sameJson(encoded[key],value),'Crowd raw/encoded lineage drift: '+key);
  for(const [key,value] of Object.entries(encoded))if(key!=='asrReadings'||clip[key]!==undefined)requireMatch(sameJson(clip[key],value),'Crowd public clip changed an actual encoded receipt field: '+key);
  requireMatch(raw.requestSha256===requestSha256&&raw.profileJsonSha256===authority.profileBindings[voice]?.profileJsonSha256&&raw.decode?.maxSpeechTokens===authority.tokenCaps[clip.clipId]&&encoded.asrModelSha256===authority.asrModelSha256&&encoded.asrReadings?.length>=1&&encoded.asrReadings.length<=2&&sameJson(encoded.asrReadings.map(row=>row.beamSize),encoded.asrReadings.length===1?[1]:[1,5])&&encoded.asrReadings.at(-1).transcript===encoded.asr,'Crowd actual private decoder/ASR evidence changed');
  requireMatch(hash(privateFile(`raw/${clip.clipId}.wav`))===raw.rawSha256&&hash(privateFile(`encoded/${clip.clipId}.mp3`))===encoded.sha256&&readFileSync(privateFile(`encoded/${clip.clipId}.mp3`)).length===encoded.bytes,'Crowd actual private audio bytes changed');
  const proof={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:raw.rawSha256,encodedSha256:encoded.sha256,profileJsonSha256:raw.profileJsonSha256,maxSpeechTokens:raw.decode.maxSpeechTokens,asrModelSha256:encoded.asrModelSha256,asrBeamSize:encoded.asrBeamSize,asrReadings:encoded.asrReadings.length};
  crowdRemainingClipAuthority(cast,clip,proof,requestSha256);takes[clip.clipId]=proof;
 }
 const records=[...manifest.clips,...manifest.heldPrivate],ids=records.map(row=>row.clipId);
 requireMatch(manifest.requestedLineCount===4&&manifest.clips.length>=1&&manifest.clips.length<=3&&manifest.lineCount===manifest.clips.length&&records.length===4&&new Set(ids).size===4&&manifest.generatedLineCount===3,'Actual successful remaining27 manifest accounting changed');
 for(const row of records){const job=owned.find(job=>job.clipId===row.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value)),'Crowd manifest slot changed from full36 source');}
 requireMatch(manifest.heldPrivate.filter(row=>row.region==='germany'&&row.slot===0).length===1&&manifest.heldPrivate.every(row=>row.region==='germany'&&row.slot===0?row.reason==='outside remaining27 grant; first batch preserved':[['held private; selected production fallback','technically verified; awaiting clip/hash-specific use selection',crowdInterruptedReason].includes(row.reason),crowdRemainingSeed(row)>=71000].every(Boolean)),'Remaining27 must preserve the first-batch slot outside this grant');
 const selectedIds=plan.jobs.filter(row=>!(row.region==='germany'&&row.slot===0)).map(row=>row.clipId);
 requireMatch(authority.generationScope==='remaining27-first-takes'&&sameJson(authority.selectedClipIds,selectedIds)&&selectedIds.length===27,'Wrong remaining27 authority selection');
 requireMatch(manifest.clips.every(row=>!evidence.recovery.heldInterruptedClipIds.includes(row.clipId))&&manifest.heldPrivate.every(row=>row.reason!==crowdInterruptedReason||evidence.recovery.heldInterruptedClipIds.includes(row.clipId)&&sameJson(row.failedGates,[crowdInterruptedGate])),'Interrupted take cannot be selected/relabelled');
 const allowedFailures=[crowdInterruptedGate,'missing or failed native EOS','independent spoken-word equivalence','literal exact ASR required by current remaining27 contract','encoded loudness/true peak','incomplete exact final-caption cues'];
 requireMatch(manifest.heldPrivate.every(row=>!row.failedGates||Array.isArray(row.failedGates)&&row.failedGates.every(gate=>allowedFailures.includes(gate))),'Private failure payload cannot enter remaining27 public manifest');
 // Explicit public contract: no structured clone of private manifests/receipts.
 // Native request bytes keep their own digest; the public source projection is
 // not represented as byte-identical to that original private request file.
 const publicPlan={nativeSha256:fullPlan.sha256,sourceSha256:crowdPublicFields(plan.sourceSha256,['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js']),jobs:plan.jobs.map(job=>crowdPublicFields(job,crowdPublicJobFields))};
 const result={schemaVersion:1,generationScope:'remaining27-first-takes',voiceId:voice,profileId:manifest.profileId,fallback:cast.productionVoices[voice].fallback??'captions',status:'same-profile technical and independent ASR audit; perceptual listening not independently verified',requestedLineCount:4,generatedLineCount:3,lineCount:manifest.clips.length,clips:manifest.clips.map(crowdPublicClip),heldPrivate:manifest.heldPrivate.map(row=>({...crowdPublicFields(row,crowdPublicJobFields),reason:row.reason,...(row.failedGates?{failedGates:[...row.failedGates]}:{})})),approvedExistingReuse:[]};
 result.crowdAdmission={status:'ROOT-verified-current-generation',generationScope:'remaining27-first-takes',nativePlanOriginSha256:authority.reusedNativePlanSummarySha256,authoritySha256:authorityProof.sha256,adapterSha256:authority.adapterSha256,helperSha256:crowdAuthoringHelperSha256,fullPlan:publicPlan,requestSha256,takes};
 result.crowdAdmission.processingRecovery={...evidence.publicProof};
 return result;
}


export function collectCrowd27Recovery5ManifestProposals(cast,recoveryAuthorityProof,recoveryTerminalProof,recoverySummaryProof,selectionProof=null,sourceRoot=root){
 const evidence=verifyCrowd27RecoveryEvidence(recoveryAuthorityProof,recoveryTerminalProof,recoverySummaryProof);
 const authorityProof=evidence.originalAuthorityProof,authority=evidence.original,terminalHashes=evidence.terminalHashes,phases=['plan','render','process'];
 requireMatch(authority.pendingPrivatePinPaths?.length===0&&authority.requiredProtectedPrivatePaths.length===57&&new Set(authority.requiredProtectedPrivatePaths).size===57&&Object.keys(authority.protectedPrivatePins).length===57&&authority.requiredProtectedPrivatePaths.every(path=>Object.hasOwn(authority.protectedPrivatePins,path)),'Original first-batch protection incomplete');
 for(const [path,digest] of Object.entries(authority.protectedPrivatePins))requireMatch(hash(path)===digest,'Original first-batch private bytes changed');
 requireMatch(hash(authority.requestPath)===authority.requestSha256,'Remaining27 full36 request changed');
 const {plan,authored}=crowdFullPlan(cast,{text:readFileSync(authority.requestPath,'utf8'),sha256:authority.requestSha256},sourceRoot);
 requireMatch(sameJson(plan.sourceSha256,authority.sourceSha256),'Remaining27 source pins differ');
 const selectedJobs=plan.jobs.filter(row=>!(row.region==='germany'&&row.slot===0)),voices=[...new Set(selectedJobs.map(row=>row.voiceId))];
 requireMatch(selectedJobs.length===27&&voices.length===9&&sameJson(selectedJobs.map(row=>row.clipId),authority.selectedClipIds)&&selectedJobs.every(row=>authority.seeds[row.clipId]===crowdRemainingSeed(row)),'Remaining27 selection/seed ownership changed');
 const family=resolve(authority.musicRoot,plan.privateReviewFamily);requireMatch(realpathSync(family)===family,'Remaining27 family alias');
 const privateFile=relative=>{const path=resolve(family,relative);requireMatch(path.startsWith(family+sep)&&realpathSync(path)===path&&!lstatSync(path).isSymbolicLink(),'Remaining27 private path alias/escape');return path;};
 const summaries={process:evidence.summary},summaryHashes={process:evidence.summarySha256};
 for(const phase of ['plan','render']){
  const path=privateFile(`_batch27-control/${phase}-summary.json`),summary=json(path),name=phase[0].toUpperCase()+phase.slice(1);
  requireMatch(hash(path)===evidence.recovery['original'+name+'SummarySha256']&&path===evidence.recovery['original'+name+'SummaryPath']&&summary.phase===phase&&summary.authoritySha256===authorityProof.sha256&&summary.adapterSha256===authority.adapterSha256&&summary.helperSha256===crowdAuthoringHelperSha256&&summary.selectedClipCount===27&&summary.publicExports===0&&summary.humanListeningVerified===false&&summary.automaticRetries===0&&summary.rows?.length===(phase==='plan'?9:27),'Original successful adapter summary changed');summaries[phase]=summary;summaryHashes[phase]=hash(path);
 }
 requireMatch(summaries.plan.nativePlanInvocationThisGrant===false&&summaries.plan.nativePlanOriginSha256===authority.reusedNativePlanSummarySha256&&summaries.plan.nativePlanOriginAuthoritySha256===authority.predecessorAuthoritySha256&&hash(authority.reusedNativePlanSummaryPath)===authority.reusedNativePlanSummarySha256,'Genuine existing native-plan reuse origin changed');
 const ids=new Set(authority.selectedClipIds);
 for(const phase of ['render','process'])requireMatch(new Set(summaries[phase].rows.map(row=>row.clipId)).size===27&&summaries[phase].rows.every(row=>ids.has(row.clipId)),'Remaining27 summary duplicate/out-of-scope clip');
 const selection=selectionProof?(requireMatch(selectionProof.sha256===hash(selectionProof.path),'Remaining27 use selection changed'),json(selectionProof.path)):null,selections=new Map();
 if(selection){requireMatch(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&selection.instruction?.trim()&&Array.isArray(selection.clips),'Missing remaining27 use selection');for(const row of selection.clips){requireMatch(ids.has(row.clipId)&&!selections.has(row.clipId)&&/^[a-f0-9]{64}$/.test(row.encodedSha256),'Selection duplicate/outside remaining27');selections.set(row.clipId,row.encodedSha256);}}
 const proposals=[],inventory=[];let eligibleCount=0,selectedCount=0;
 for(const voice of voices){
  const owned=plan.jobs.filter(row=>row.voiceId===voice),batch=owned.filter(row=>ids.has(row.clipId)),prior=owned.find(row=>row.region==='germany'&&row.slot===0);requireMatch(owned.length===4&&batch.length===3&&prior,'Wrong remaining27 four-slot ownership');
  const requestPath=privateFile(`${voice}/requests.json`),requestHash=hash(requestPath),request=json(requestPath),planRow=summaries.plan.rows.find(row=>row.voiceId===voice);
  requireMatch(planRow?.frozenRequestPath===requestPath&&planRow.sha256===requestHash&&summaries.plan.frozenRequestPins[requestPath]===requestHash&&sameJson(request.jobs,owned)&&request.requestedLineCount===4&&request.authoredPlanSha256===authority.requestSha256&&sameJson(request.sourceSha256,plan.sourceSha256)&&sameJson(request.authoredPlanSourceSha256,plan.sourceSha256),'Existing actual four-slot request changed');
  const clips=[],held=[{...prior,reason:'outside remaining27 grant; first batch preserved'}];
  for(const job of batch){
   const rawPath=privateFile(`${voice}/raw/${job.clipId}.json`),raw=json(rawPath),rawHash=hash(rawPath),render=summaries.render.rows.find(row=>row.clipId===job.clipId),processed=summaries.process.rows.find(row=>row.clipId===job.clipId);
   requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.authoringHelperSha256===crowdAuthoringHelperSha256&&raw.requestSha256===requestHash&&raw.seed===crowdRemainingSeed(job)&&raw.synthesisAttempt===1&&render.receiptSha256===rawHash&&render.rawSha256===raw.rawSha256&&render.profileId===job.profileId&&render.actualTakeWithinGrant===1&&render.globalHistoricalOrdinal===null&&render.nativeEosReached===(raw.decode?.eosReached===true)&&processed.receiptSha256===rawHash&&processed.rawSha256===raw.rawSha256,'Remaining27 actual raw/summary provenance changed');
   requireMatch(hash(privateFile(`${voice}/raw/${job.clipId}.wav`))===raw.rawSha256,'Remaining27 raw bytes changed');
   if(evidence.recovery.heldInterruptedClipIds.includes(job.clipId)){
    requireMatch(!selections.has(job.clipId)&&processed.processingOrigin==='original-process-interrupted-held-unknown'&&processed.asrReadings===null&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.json`)),'Interrupted unknown take cannot be selected or completed');
    held.push({...job,reason:crowdInterruptedReason,failedGates:[crowdInterruptedGate]});
    inventory.push({clipId:job.clipId,voiceId:voice,nativeSeed:raw.seed,actualSynthesisAttempt:1,rawReceiptSha256:rawHash,rawSha256:raw.rawSha256,nativeEosReached:true,encodedReceiptSha256:null,encodedSha256:null,technicalEligible:false,selectedForUse:false,failedGates:[crowdInterruptedGate],asrReadingsKnown:false,asrReadingsBounds:{minimum:0,maximum:2},humanListeningVerified:false});
    continue;
   }
   const gates=[];let encoded=null,encodedHash=null;
   if(raw.decode?.eosReached!==true){gates.push('missing or failed native EOS');requireMatch(processed.asrReadings===0&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.json`))&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}.mp3`))&&!existsSync(resolve(family,voice,'encoded',`${job.clipId}-processed.wav`)),'Non-EOS remaining27 take has encoding/intermediate/audit');}
   else{
    const path=privateFile(`${voice}/encoded/${job.clipId}.json`);encoded=json(path);encodedHash=hash(path);
    requireMatch(processed.encodedReceiptSha256===encodedHash&&processed.encodedSha256===encoded.sha256&&Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&encoded.rawSha256===raw.rawSha256&&encoded.requestSha256===requestHash&&encoded.authoringHelperSha256===crowdAuthoringHelperSha256,'Remaining27 actual encoded receipt changed');
    requireMatch(hash(privateFile(`${voice}/encoded/${job.clipId}.mp3`))===encoded.sha256,'Remaining27 encoded bytes changed');
    requireMatch(processed.asrWordExact===encoded.asrWordExact&&processed.asrReadings===encoded.asrReadings?.length&&processed.wordCueCount===encoded.wordCues?.length&&processed.levelsPass===(Math.abs(encoded.integratedLufs+18)<=.3&&encoded.truePeakDbtp<=-1.5),'Remaining27 final gates differ from completed summary');
    if(encoded.asrWordExact!==true)gates.push('independent spoken-word equivalence');
    if(encoded.asrLiteralWordExact!==true)gates.push('literal exact ASR required by current remaining27 contract');
    if(Math.abs(encoded.integratedLufs+18)>.3||!Number.isFinite(encoded.integratedLufs)||encoded.truePeakDbtp>-1.5||!Number.isFinite(encoded.truePeakDbtp))gates.push('encoded loudness/true peak');
    try{crowdExactCues(encoded);}catch(error){requireMatch(error.message==='Incomplete crowd exact final-caption cues','Unexpected remaining27 caption integrity error');gates.push('incomplete exact final-caption cues');}
   }
   const eligible=gates.length===0;if(eligible){fixedTakeAuthority(cast,encoded);eligibleCount++;}
   const selected=selections.has(job.clipId);requireMatch(!selected||eligible&&selections.get(job.clipId)===encoded.sha256,'Use selection includes a failed/wrong-hash remaining27 take');
   if(selected){const {asrReadings,...actualEncodedFields}=encoded;clips.push({...actualEncodedFields,approval:{status:'user-approved',scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256}});selectedCount++;}
   else held.push({...job,reason:eligible?'technically verified; awaiting clip/hash-specific use selection':'held private; selected production fallback',failedGates:gates});
   inventory.push({clipId:job.clipId,voiceId:voice,nativeSeed:raw.seed,actualSynthesisAttempt:1,rawReceiptSha256:rawHash,rawSha256:raw.rawSha256,nativeEosReached:raw.decode?.eosReached===true,encodedReceiptSha256:encodedHash,encodedSha256:encoded?.sha256??null,technicalEligible:eligible,selectedForUse:selected,failedGates:gates,humanListeningVerified:false});
  }
  const manifest={schemaVersion:1,generationScope:'remaining27-first-takes',voiceId:voice,profileId:owned[0].profileId,fallback:cast.productionVoices[voice].fallback??'captions',status:'private remaining27 generation proposal; prior slot preserved',requestedLineCount:4,generatedLineCount:3,lineCount:clips.length,clips,heldPrivate:held,approvedExistingReuse:[]};
  proposals.push(clips.length?prepareCrowdRemaining27RecoveryManifest(cast,manifest,evidence,sourceRoot):manifest);
 }
 requireMatch(proposals.length===9&&inventory.length===27&&proposals.every(row=>row.clips.length+row.heldPrivate.length===4),'Remaining27 proposals lost owned slots');
 return{status:'private remaining27 recovery5 proposal collection; original process remains failed; no public writes',processingRecovery:evidence.publicProof,authoritySha256:authorityProof.sha256,nativeFullPlanSha256:authority.requestSha256,terminalSha256:terminalHashes,adapterSummarySha256:summaryHashes,selectionSha256:selectionProof?.sha256??null,counts:{nativeRequestSlots:36,generatedInOriginalGrant:27,newGeneratedInRecovery:0,previouslyCompletedEncodings:21,newRecoveryEncodings:5,heldInterruptedEncodings:1,priorProtectedSlots:9,unrendered:0,technicalEligible:eligibleCount,selectedNewClips:selectedCount,heldGenerated:27-selectedCount,humanListeningVerified:0},inventory,partialManifestProposals:proposals};
}

const crowdRemainingMouthEnergyPath='assets/voices/candidate-dialogue/crowd-remaining27-mouth-energy.json';
const crowdRemainingMouthSources=Object.freeze({"crowd-baerbel-brezel-berlin-01":"c54dcbe0e32f6e2b9daac9d3bec309992f2d3af9a76a1c4b248debdd26ddfd54","crowd-baerbel-brezel-germany-02":"516c3ada8401cd8330df1a012e66b57caadf183544178b646473504666cd710b","crowd-brigitte-bueroklammer-berlin-02":"b58e9f43d40c5f8614cf5222fb02d3e89d7573b069879af4a62b42f461b346c7","crowd-brigitte-bueroklammer-germany-02":"dce9f5bb553a83e3d9b95b1e0c87ab5b19f6217756dbff53fffcc690ade4451f","crowd-elfriede-eingabe-germany-02":"a09ab7e98d2917c98c1b2dbce883e22ec86225ee7c475f46426cf1a9165dcf6d","crowd-guenther-gartenzaun-germany-02":"cc1289890944d46931c75688df857d86b338fbcfc66c465c6733dd1bc65b7cde","crowd-hildegard-brotzeit-berlin-02":"75cae48effcb228f2e47acbd66dde86c8d0f38a676b9376524972524f132f5e0","crowd-hildegard-brotzeit-germany-02":"16bba1d4c28235e48b4ca4d95196db6f1582bf5143aba15b0e61018894c1b290","crowd-irmgard-aktenordner-germany-02":"79d5c60feaae09ef37c1a54523a6ff54d78ff091d0841e84da1c087e5aaa06a5","crowd-klaus-dieter-knoedel-germany-02":"aabc1ac6b8f8acc0efb8dd165e61d70834202a8c5ba1c42b64cd9f756879ad45","crowd-ruediger-rasenkante-germany-02":"c879d90a6c577bc9b05b8ffe20142345084a4f4e144c24b0ae7a3557cbdb8238"});
const crowdRemainingMouthIds=Object.keys(crowdRemainingMouthSources).sort();

const crowdOriginalMouthSha256='9b801594e398ff2398fe3daf330c3c18f06bb8fc02e9dc63a8ff25186116a2c8';
function crowdRemainingMouthManifests(cast,sourceRoot){
 const source=readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8').replace(/\r\n/g,'\n'),admissions=crowdAdmissions(source);
 requireMatch(sameJson(cast,json(resolve(sourceRoot,'For-AI/VOICE-CAST.json'))),'Mouth cast differs from current source file');
 const manifests=readdirSync(resolve(sourceRoot,'assets/voices/candidate-dialogue')).filter(name=>name.endsWith('-crowd-manifest.json')).sort().map(name=>{
  const relative=`assets/voices/candidate-dialogue/${name}`,path=resolve(sourceRoot,relative),sha256=hash(path),manifest=json(path);
  verifyCrowdGenerationManifestLedger(manifest,relative,sha256,admissions);
  return {...manifest,provenanceManifest:relative,provenanceManifestSha256:sha256};
 });
 crowdRecordingsBlock(cast,manifests,sourceRoot,sourceRoot);
 const clips=manifests.flatMap(manifest=>manifest.clips.filter(clip=>clip.approval?.status==='user-approved').map(clip=>({...clip,encodedReceiptSha256:manifest.crowdAdmission.takes[clip.clipId]?.encodedReceiptSha256,provenanceManifestSha256:manifest.provenanceManifestSha256}))).sort((a,b)=>a.clipId.localeCompare(b.clipId));
 requireMatch(sameJson(clips.map(clip=>clip.clipId).sort(),[...crowdMouthClipIds,...crowdRemainingMouthIds].sort()),'Mouth scope must be original7 plus exact admitted11');
 const selected=clips.filter(clip=>Object.hasOwn(crowdRemainingMouthSources,clip.clipId));
 requireMatch(selected.length===11&&selected.every(clip=>clip.sha256===crowdRemainingMouthSources[clip.clipId]),'Remaining11 selected MP3 hash changed');
 return {source,manifests,selected};
}
function crowdMouthRuntimeRows(source){
 const window={};vm.runInNewContext(source,{window},{timeout:1000});
 requireMatch(window.GermanySimulatorAudioText?.recordings,'Missing runtime recordings source');
 return window.GermanySimulatorAudioText.recordings;
}
function crowdRemainingMouthSnapshot(cast,manifests,sourceRoot,ffmpegPath){
 const source=readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),runtime=crowdMouthRuntimeRows(source);
 const {unaffected}=crowdRemainingMouthRuntimeSelection(runtime);
 return {...crowdMouthSnapshot(cast,manifests,sourceRoot,ffmpegPath),catalogRawSha256:hash(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js')),curatorSourceSha256:hash(resolve(sourceRoot,'tools/curate-voice-library.mjs')),executedCuratorSha256:hash(fileURLToPath(import.meta.url)),oldSupplementSha256:hash(resolve(sourceRoot,crowdMouthEnergyPath)),runtimeRecordingsCount:Object.keys(runtime).length,unaffectedRuntimeCount:Object.keys(unaffected).length,unaffectedRuntimeSha256:textHash(JSON.stringify(unaffected))};
}
function crowdRemainingMouthRecipe(sourceRoot,ffmpegPath){
 const path=resolve(sourceRoot,'tools/build-neighbor-voices.mjs'),source=readFileSync(path,'utf8'),lines=source.split(/\r?\n/).filter(line=>line.startsWith('function energy(path){'));
 requireMatch(hash(ffmpegPath)===cityEnergyFfmpegSha256&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(hash(path))&&textHash(source.replace(/\r\n/g,'\n'))===cityEnergyCanonicalBuilderSha256,'Mouth decoder/builder bytes changed');
 requireMatch(lines.length===1&&textHash(lines[0])===cityEnergyLineSha256&&new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4,'Mouth shared RMS recipe/endian changed');
 return {line:lines[0],builderSha256:hash(path)};
}
function crowdRemainingMouthRun(runDirectory,sourceRoot){
 const path=resolve(runDirectory),parent=dirname(path),source=resolve(sourceRoot);
 requireMatch(!existsSync(path)&&path!==source&&!path.startsWith(source+sep)&&realpathSync(parent)===parent&&lstatSync(parent).isDirectory(),'Mouth run must be a fresh directory outside source tree');
 mkdirSync(path);return path;
}
function crowdRemainingMouthDecode(clip,index,ffmpegPath,recipe,runPath,sourceRoot){
 const mp3=resolve(sourceRoot,clip.file);requireMatch(hash(mp3)===clip.sha256,'Mouth MP3 bytes changed');
 let decoded=null,calls=0;
 const decode=(args,binary)=>{
  requireMatch(binary&&calls++===0&&sameJson(Array.from(args),['-hide_banner','-loglevel','error','-i',mp3,'-f','f32le','-ac','1','-ar','24000','pipe:1']),'Changed mouth PCM decoder request');
  const began=Date.now(),result=spawnSync(ffmpegPath,['-nostdin','-threads','1',...args],{encoding:null,windowsHide:true,timeout:10000,maxBuffer:1048576}),bytes=result.stdout??Buffer.alloc(0),stderr=result.stderr??Buffer.alloc(0);
  const outcome={clipId:clip.clipId,sourceMp3Sha256:clip.sha256,ffmpegSha256:cityEnergyFfmpegSha256,pid:result.pid??null,status:result.status??null,signal:result.signal??null,error:result.error?.code??null,elapsedMs:Date.now()-began,stdoutBytes:bytes.length,stdoutSha256:textHash(bytes),stderrBytes:stderr.length,stderrSha256:textHash(stderr),exitRecordedBeforeValidation:true};
  writeFileSync(resolve(runPath,`decode-${String(index+1).padStart(2,'0')}.json`),JSON.stringify(outcome,null,2)+'\n',{flag:'wx'});
  requireMatch(!result.error&&result.status===0&&!result.signal&&bytes.length>0&&bytes.length<=1048576&&bytes.length%4===0,'Mouth PCM decoder failed');
  const sampleCount=bytes.length/4;requireMatch(sampleCount<=240000,'Mouth PCM duration exceeds bound');
  for(let offset=0;offset<bytes.length;offset+=4)requireMatch(Number.isFinite(bytes.readFloatLE(offset)),'Nonfinite mouth PCM');
  decoded={pcmSha256:textHash(bytes),sampleCount,durationSeconds:sampleCount/24000};return bytes;
 };
 const measured=vm.runInNewContext('('+recipe.line+')',{ffmpeg:decode,Float32Array,Math},{timeout:1000})(mp3);
 requireMatch(calls===1&&decoded&&measured.mouthHz===40&&measured.durationSeconds===decoded.durationSeconds,'Shared mouth RMS output changed');
 return {decoded,measurement:{mouthHz:40,mouthEnergy:Array.from(measured.mouthEnergy)}};
}
function crowdRemainingMouthRunAfter(runPath,sourceBefore,capture,error=null){
 let sourceAfter=null,snapshotError=null;
 try{sourceAfter=capture();}catch(failure){snapshotError=String(failure?.message??failure)}
 const conserved=sourceAfter!==null&&sameJson(sourceBefore,sourceAfter);
 writeFileSync(resolve(runPath,'source-after.json'),JSON.stringify({sourceAfter,snapshotError,conserved},null,2)+'\n',{flag:'wx'});
 if(error||!conserved){writeFileSync(resolve(runPath,'terminal.json'),JSON.stringify({status:'FAILED',error:String(error?.message??error??'Source snapshot changed'),sourceConserved:conserved,snapshotError,publicAdmission:'NOT PERFORMED'},null,2)+'\n',{flag:'wx'});throw error??Error('Source changed during mouth decode')}
 return sourceAfter;
}
export function verifyCrowdRemainingMouthRows(supplement,manifests,assetRoot=root){
 requireMatch(supplement?.kind==='crowd-final-mp3-mouth-energy-remaining11-supplement-v1'&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(supplement.recipeBuilderSha256)&&supplement.recipeCanonicalBuilderSha256===cityEnergyCanonicalBuilderSha256&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(supplement.admissionRecipeBuilderSha256)&&supplement.recipeLineSha256===cityEnergyLineSha256&&supplement.ffmpegSha256===cityEnergyFfmpegSha256&&/^[a-f0-9]{64}$/.test(supplement.measurementSha256)&&/^[a-f0-9]{64}$/.test(supplement.admissionDecodeReceiptSha256)&&supplement.priorSevenSupplementSha256===crowdOriginalMouthSha256,'Foreign remaining11 mouth recipe/proof');
 const selected=manifests.flatMap(manifest=>manifest.clips.filter(clip=>clip.approval?.status==='user-approved'&&Object.hasOwn(crowdRemainingMouthSources,clip.clipId)).map(clip=>({...clip,encodedReceiptSha256:manifest.crowdAdmission.takes[clip.clipId]?.encodedReceiptSha256}))),rows=supplement.clips;
 requireMatch(sameJson(selected.map(clip=>clip.clipId).sort(),crowdRemainingMouthIds)&&rows&&sameJson(Object.keys(rows).sort(),crowdRemainingMouthIds),'Missing/extra remaining11 measured rows');
 for(const clip of selected){const row=rows[clip.clipId];
  requireMatch(clip.sha256===crowdRemainingMouthSources[clip.clipId],'Remaining11 admitted MP3 selection changed');
  for(const key of ['clipId','voiceId','actorId','profileId','referenceSha256','file','sha256','encodedReceiptSha256','text','english'])requireMatch(row[key]===clip[key],`Foreign remaining11 mouth ${key}: ${clip.clipId}`);
  requireMatch(hash(resolve(assetRoot,clip.file))===clip.sha256&&row.mouthHz===40&&Number.isInteger(row.sampleCount)&&row.sampleCount>0&&row.sampleCount<=240000&&row.durationSeconds===row.sampleCount/24000&&/^[a-f0-9]{64}$/.test(row.pcmSha256)&&Array.isArray(row.mouthEnergy)&&row.mouthEnergy.length===Math.ceil(row.sampleCount/600)&&row.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255)&&row.energySha256===textHash(Buffer.from(row.mouthEnergy)),'Invalid remaining11 measured bins');
 }
 return rows;
}
export function crowdExpandedMouthEnergyFromCatalog(source,manifests,assetRoot=root){
 const anchor=source.match(crowdMouthEnergyPattern);if(!anchor)return null;
 const receipts=JSON.parse(anchor[1]);
 requireMatch(receipts[crowdMouthEnergyPath]===crowdOriginalMouthSha256,'Original seven mouth supplement changed');
 if(sameJson(Object.keys(receipts),[crowdMouthEnergyPath]))return crowdMouthEnergyFromCatalog(source,manifests,assetRoot);
 requireMatch(sameJson(Object.keys(receipts),[crowdMouthEnergyPath,crowdRemainingMouthEnergyPath]),'Foreign crowd mouth receipt scope');
 const oldPath=resolve(assetRoot,crowdMouthEnergyPath),newPath=resolve(assetRoot,crowdRemainingMouthEnergyPath);
 requireMatch(!lstatSync(oldPath).isSymbolicLink()&&!lstatSync(newPath).isSymbolicLink()&&hash(oldPath)===crowdOriginalMouthSha256&&hash(newPath)===receipts[crowdRemainingMouthEnergyPath],'Mouth supplement byte drift');
 const original=crowdMouthEnergyRows(json(oldPath),manifests,assetRoot),remaining=verifyCrowdRemainingMouthRows(json(newPath),manifests,assetRoot);
 requireMatch(!Object.keys(remaining).some(id=>Object.hasOwn(original,id)),'Mouth supplement overlaps original seven');
 return {...original,...remaining};
}
export function crowdRemainingMouthRuntimeSelection(runtime){
 const selected=Object.entries(runtime).filter(([,row])=>crowdRemainingMouthIds.includes(row.clipId));
 requireMatch(selected.length===11&&sameJson(selected.map(([,row])=>row.clipId).sort(),crowdRemainingMouthIds),'Missing/duplicate remaining11 runtime clip identity');
 const targets=Object.fromEntries(selected.map(([path,row])=>[row.clipId,{path,row}]));
 const unaffected=Object.fromEntries(Object.entries(runtime).filter(([,row])=>!crowdRemainingMouthIds.includes(row.clipId)).sort(([a],[b])=>a.localeCompare(b)));
 return {targets,unaffected};
}
export function verifyCrowdRemainingMouthProjection(cast,manifests,sourceRoot,source,rows){
 const current=crowdMouthRuntimeRows(source),block=crowdRecordingsBlock(cast,manifests,sourceRoot,sourceRoot,rows),projected=JSON.parse(vm.runInNewContext(block+'\nJSON.stringify(crowdRecordings)',{},{timeout:1000})),next={...current,...projected};
 requireMatch(sameJson(Object.keys(current).sort(),Object.keys(next).sort()),'Mouth projection added/removed recordings');
 const beforeSelection=crowdRemainingMouthRuntimeSelection(current),afterSelection=crowdRemainingMouthRuntimeSelection(projected);
 for(const id of crowdRemainingMouthIds)requireMatch(beforeSelection.targets[id].path===afterSelection.targets[id].path&&beforeSelection.targets[id].row.sha256===crowdRemainingMouthSources[id]&&afterSelection.targets[id].row.sha256===crowdRemainingMouthSources[id]&&Object.hasOwn(rows,id),'Remaining11 runtime path/MP3/sidecar identity changed');
 const withoutMouth=row=>Object.fromEntries(Object.entries(row).filter(([key])=>key!=='mouthHz'&&key!=='mouthEnergy'));
 for(const [path,before] of Object.entries(current)){
  const id=before.clipId;
  if(crowdRemainingMouthIds.includes(id))requireMatch(sameJson(withoutMouth(before),withoutMouth(next[path]))&&next[path].mouthHz===40&&sameJson(next[path].mouthEnergy,rows[id].mouthEnergy),'New mouth projection changed approved recording identity');
  else requireMatch(sameJson(before,next[path]),'Mouth projection changed an unaffected recording: '+path);
 }
 return {affected:11,unaffected:Object.keys(beforeSelection.unaffected).length,originalSeven:'UNCHANGED'};
}

export function measureCrowdRemainingMouthEnergy(cast,ffmpegPath,runDirectory,sourceRoot=root){
 const context=crowdRemainingMouthManifests(cast,sourceRoot),recipe=crowdRemainingMouthRecipe(sourceRoot,ffmpegPath);
 const receipts=JSON.parse(context.source.match(crowdMouthEnergyPattern)?.[1]??'{}');
 requireMatch(sameJson(Object.keys(receipts),[crowdMouthEnergyPath])&&receipts[crowdMouthEnergyPath]===crowdOriginalMouthSha256&&!existsSync(resolve(sourceRoot,crowdRemainingMouthEnergyPath)),'Remaining11 mouth scope already installed or original receipt changed');
 crowdMouthEnergyFromCatalog(context.source,context.manifests,sourceRoot);
 const capture=()=>crowdRemainingMouthSnapshot(cast,context.manifests,sourceRoot,ffmpegPath),sourceBefore=capture(),runPath=crowdRemainingMouthRun(runDirectory,sourceRoot),results=[];
 requireMatch(textHash(context.source)===sourceBefore.catalogSha256,'Catalog changed between context read and snapshot');
 writeFileSync(resolve(runPath,'source-before.json'),JSON.stringify(sourceBefore,null,2)+'\n',{flag:'wx'});
 const began=Date.now();let attempted=0,sourceAfter;
 try{
  for(const [index,clip] of context.selected.entries()){
   requireMatch(Date.now()-began<120000,'Remaining11 mouth measurement wall budget');attempted++;
   const measured=crowdRemainingMouthDecode(clip,index,ffmpegPath,recipe,runPath,sourceRoot);
   results.push({clipId:clip.clipId,file:clip.file,sha256:clip.sha256,voiceId:clip.voiceId,actorId:clip.actorId,profileId:clip.profileId,referenceSha256:clip.referenceSha256,text:clip.text,english:clip.english,encodedReceiptSha256:clip.encodedReceiptSha256,manifestSha256:clip.provenanceManifestSha256,...measured});
  }
  requireMatch(Date.now()-began<120000,'Remaining11 mouth phase wall budget');
  sourceAfter=crowdRemainingMouthRunAfter(runPath,sourceBefore,capture);
 }catch(error){
  if(!existsSync(resolve(runPath,'terminal.json')))crowdRemainingMouthRunAfter(runPath,sourceBefore,capture,error);
  throw error;
 }
 requireMatch(results.length===11&&attempted===11,'Incomplete remaining11 mouth measurement');
 const measurement={kind:'crowd-final-mp3-mouth-energy-remaining11-measurement-candidate-v1',status:'MEASURED CANDIDATE ONLY',admission:'NOT PERFORMED',decodeCalls:11,inputCatalogSha256:sourceBefore.catalogSha256,recipeFileSha256:recipe.builderSha256,recipeFunctionLineSha256:cityEnergyLineSha256,ffmpegSha256:cityEnergyFfmpegSha256,priorSevenSupplementSha256:crowdOriginalMouthSha256,sourceBefore,sourceAfter,results};
 const bytes=JSON.stringify(measurement,null,2)+'\n',path=resolve(runPath,'measurement.json');writeFileSync(path,bytes,{flag:'wx'});
 const terminal={status:measurement.status,decodeCalls:11,path,sha256:textHash(bytes),elapsedMs:Date.now()-began,sourceConserved:true,admission:'NOT PERFORMED'};
 writeFileSync(resolve(runPath,'terminal.json'),JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});return terminal;
}
export function admitCrowdRemainingMouthEnergy(cast,measurement,measurementSha256,ffmpegPath,runDirectory,sourceRoot=root){
 const context=crowdRemainingMouthManifests(cast,sourceRoot),recipe=crowdRemainingMouthRecipe(sourceRoot,ffmpegPath),catalogPath=resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js');
 const originalCatalog=readFileSync(catalogPath),receipts=JSON.parse(context.source.match(crowdMouthEnergyPattern)?.[1]??'{}');
 requireMatch(sameJson(Object.keys(receipts),[crowdMouthEnergyPath])&&receipts[crowdMouthEnergyPath]===crowdOriginalMouthSha256&&!existsSync(resolve(sourceRoot,crowdRemainingMouthEnergyPath)),'Remaining11 admission already installed or original receipt changed');
 const originalRows=crowdMouthEnergyFromCatalog(context.source,context.manifests,sourceRoot),capture=()=>crowdRemainingMouthSnapshot(cast,context.manifests,sourceRoot,ffmpegPath),sourceBefore=capture();
 requireMatch(/^[a-f0-9]{64}$/.test(measurementSha256)&&measurement?.kind==='crowd-final-mp3-mouth-energy-remaining11-measurement-candidate-v1'&&measurement.status==='MEASURED CANDIDATE ONLY'&&measurement.admission==='NOT PERFORMED'&&measurement.decodeCalls===11&&measurement.priorSevenSupplementSha256===crowdOriginalMouthSha256&&measurement.inputCatalogSha256===sourceBefore.catalogSha256&&[cityEnergyBuilderSha256,cityEnergyCanonicalBuilderSha256].includes(measurement.recipeFileSha256)&&measurement.recipeFunctionLineSha256===cityEnergyLineSha256&&measurement.ffmpegSha256===cityEnergyFfmpegSha256&&sameJson(measurement.sourceBefore,measurement.sourceAfter)&&sameJson(measurement.sourceBefore,sourceBefore),'Foreign/stale remaining11 mouth measurement');
 const measured=new Map(measurement.results.map(row=>[row.clipId,row]));
 requireMatch(measurement.results.length===11&&measured.size===11&&sameJson([...measured.keys()].sort(),crowdRemainingMouthIds),'Missing/extra remaining11 measurements');
 const runPath=crowdRemainingMouthRun(runDirectory,sourceRoot),rows={},began=Date.now();let sourceAfter,attempted=0;
 requireMatch(textHash(context.source)===sourceBefore.catalogSha256,'Catalog changed between context read and snapshot');
 writeFileSync(resolve(runPath,'source-before.json'),JSON.stringify(sourceBefore,null,2)+'\n',{flag:'wx'});
 try{
  for(const [index,clip] of context.selected.entries()){
   requireMatch(Date.now()-began<120000,'Remaining11 mouth admission wall budget');
   const found=measured.get(clip.clipId);
   for(const key of ['clipId','file','sha256','voiceId','actorId','profileId','referenceSha256','text','english','encodedReceiptSha256'])requireMatch(found[key]===clip[key],'Measured remaining11 identity changed: '+key);
   requireMatch(found.manifestSha256===clip.provenanceManifestSha256,'Measured remaining11 manifest changed');attempted++;
   const actual=crowdRemainingMouthDecode(clip,index,ffmpegPath,recipe,runPath,sourceRoot);
   requireMatch(sameJson(actual.decoded,found.decoded)&&found.measurement?.mouthHz===40&&sameJson(actual.measurement.mouthEnergy,found.measurement.mouthEnergy),'Remaining11 bins differ from exact final MP3 re-decode');
   rows[clip.clipId]={clipId:clip.clipId,voiceId:clip.voiceId,actorId:clip.actorId,profileId:clip.profileId,referenceSha256:clip.referenceSha256,text:clip.text,english:clip.english,file:clip.file,sha256:clip.sha256,encodedReceiptSha256:clip.encodedReceiptSha256,...actual.decoded,mouthHz:40,mouthEnergy:actual.measurement.mouthEnergy,energySha256:textHash(Buffer.from(actual.measurement.mouthEnergy))};
  }
  requireMatch(Date.now()-began<120000,'Remaining11 mouth phase wall budget');
  sourceAfter=crowdRemainingMouthRunAfter(runPath,sourceBefore,capture);
 }catch(error){
  if(!existsSync(resolve(runPath,'terminal.json')))crowdRemainingMouthRunAfter(runPath,sourceBefore,capture,error);
  throw error;
 }
 requireMatch(attempted===11,'Incomplete remaining11 admission re-decode');
 const decodeReceipt={kind:'crowd-remaining11-mouth-admission-decode-receipt-v1',decodeCalls:11,measurementSha256,ffmpegSha256:cityEnergyFfmpegSha256,recipeFunctionLineSha256:cityEnergyLineSha256,sourceBefore,sourceAfter,children:Object.fromEntries(Array.from({length:11},(_,index)=>`decode-${String(index+1).padStart(2,'0')}.json`).map(name=>[name,hash(resolve(runPath,name))]))};
 const decodeBytes=JSON.stringify(decodeReceipt,null,2)+'\n';writeFileSync(resolve(runPath,'decode-receipt.json'),decodeBytes,{flag:'wx'});
 const supplement={kind:'crowd-final-mp3-mouth-energy-remaining11-supplement-v1',recipeBuilderSha256:measurement.recipeFileSha256,recipeCanonicalBuilderSha256:cityEnergyCanonicalBuilderSha256,admissionRecipeBuilderSha256:recipe.builderSha256,recipeLineSha256:cityEnergyLineSha256,ffmpegSha256:cityEnergyFfmpegSha256,measurementSha256,admissionDecodeReceiptSha256:textHash(decodeBytes),priorSevenSupplementSha256:crowdOriginalMouthSha256,clips:rows};
 verifyCrowdRemainingMouthRows(supplement,context.manifests,sourceRoot);
 const projection=verifyCrowdRemainingMouthProjection(cast,context.manifests,sourceRoot,context.source,{...originalRows,...rows});
 const supplementPath=resolve(sourceRoot,crowdRemainingMouthEnergyPath),supplementTemporary=supplementPath+'.remaining11.tmp',catalogTemporary=catalogPath+'.remaining11.tmp';
 requireMatch(!existsSync(supplementPath)&&!existsSync(supplementTemporary)&&!existsSync(catalogTemporary)&&!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1,'Occupied/linked remaining11 admission destination');
 const bytes=JSON.stringify(supplement,null,2)+'\n',anchor='const crowdMouthEnergyReceipt=Object.freeze('+JSON.stringify({[crowdMouthEnergyPath]:crowdOriginalMouthSha256,[crowdRemainingMouthEnergyPath]:textHash(bytes)})+');\n',nextCatalog=context.source.replace(crowdMouthEnergyPattern,()=>anchor);
 requireMatch(nextCatalog.includes(anchor)&&sameJson(sourceBefore,capture())&&readFileSync(catalogPath).equals(originalCatalog),'Source changed before remaining11 admission');
 let installed=false,catalogInstalled=false;
 try{
  writeFileSync(supplementTemporary,bytes,{flag:'wx'});writeFileSync(catalogTemporary,nextCatalog,{flag:'wx'});
  requireMatch(hash(supplementTemporary)===textHash(bytes)&&hash(catalogTemporary)===textHash(nextCatalog),'Staged remaining11 bytes changed');
  requireMatch(hash(catalogPath)===textHash(originalCatalog)&&sameJson(sourceBefore,capture()),'Source changed while staging remaining11 data');
  renameSync(supplementTemporary,supplementPath);installed=true;renameSync(catalogTemporary,catalogPath);catalogInstalled=true;
 }catch(error){
  if(existsSync(catalogTemporary)&&hash(catalogTemporary)===textHash(nextCatalog))unlinkSync(catalogTemporary);
  if(existsSync(supplementTemporary)&&hash(supplementTemporary)===textHash(bytes))unlinkSync(supplementTemporary);
  if(installed&&!catalogInstalled&&hash(supplementPath)===textHash(bytes))unlinkSync(supplementPath);
  writeFileSync(resolve(runPath,'terminal.json'),JSON.stringify({status:'FAILED',phase:'publication',catalogInstalled,supplementInstalled:installed,error:String(error?.message??error)},null,2)+'\n',{flag:'wx'});throw error;
 }
 const terminal={status:'ADMITTED DATASET; CATALOG SYNC REQUIRED',decodeCalls:11,clips:11,supplement:crowdRemainingMouthEnergyPath,sha256:textHash(bytes),catalogSha256:hash(catalogPath),oldSupplementSha256:hash(resolve(sourceRoot,crowdMouthEnergyPath)),projection,measurementSha256,admissionDecodeReceiptSha256:textHash(decodeBytes),elapsedMs:Date.now()-began,listening:'NOT RUN',browserClockAlignment:'NOT VERIFIED'};
 writeFileSync(resolve(runPath,'terminal.json'),JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});return terminal;
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
 .replace(/(?<!\p{L})vertrauens[-‐‑–—]booster(?!\p{L})/gu,'vertrauensbooster')
 .replace(/(?<!\p{L})starter[-‐‑–—]paket(?!\p{L})/gu,'starterpaket')
 .replace(/(?<!\p{L})vulkan[-‐‑–—]kuchen(?!\p{L})/gu,'vulkankuchen')
 .replace(/[-‐‑–—]/g,' ')
 .replace(/[^\p{L}\p{N}]+/gu,' ')
 .trim().replace(/\s+/g,' ')
 .replace(/\bihr nicht reagieren richtig einordnen\b/g,'ihr nichtreagieren richtig einordnen')
 .replace(/\bso was\b/g,'sowas')
 .replace(/\bnoch mal\b/g,'nochmal')
 .replace(/\bkennen zu lernen\b/g,'kennenzulernen')
 .replace(/\bdran bleibt\b/g,'dranbleibt')
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
const heikoProfessorRenderReference=Object.freeze({
 policy:'literal-reference-pcm-excerpt-v1',profileId:'fec92a799b3a48879cc2d90ce2ae2e10',
 profileReferenceSha256:'1ccb91c8cc1fd03ee28fd46b0d727e7f69717ed70e15210c538a1283dca26c06',
 sourceStartSample:0,sourceEndSampleExclusive:97920,sourceSampleRateHz:24000,sourceChannels:1,sourceBitsPerSample:16,
 referenceSha256:'012b9c85f149767274b44fc9a977c7bf8e6d69d69cfaaa9fc5d1e7aa8aac975f',
 referencePcmSha256:'55accb637a508f3161f03889d4c2a4bc4d2e81ef5acd81a8662eb42e5976945a',
 referenceText:'Hello everybody, my name is Heiko Schmidt.',
 referenceTextSha256:'c918935c45756afc17c6b8a252f30d9862ec81da105cdfbb0ff5873b504ed6e9',
 inputProofSha256:'b501efa381506adec6b0992cedbf0c3f33f63ca28758babdfdb5e9e6868b5465',
 boundaryEvidenceSha256:'8351bc24487fcbb95d0560694dcd4775521c7fd1bba92ff7b8bc30c6e6498845'
});
export function validNeighborReferenceConditioning(clip){
 const reference=clip.referenceConditioning,parameters=clip.nativeCompletion?.inferenceParameters;
 if(reference===undefined)return true;
 return clip.voiceId==='jwd-heiko-maaslos'&&clip.profileId===heikoProfessorRenderReference.profileId&&
  clip.referenceSha256===heikoProfessorRenderReference.profileReferenceSha256&&
  clip.referenceOriginalSha256===heikoProfessorRenderReference.profileReferenceSha256&&
  clip.nativeParts===undefined&&clip.nativeCompletion?.kind===undefined&&
  reference!==null&&typeof reference==='object'&&!Array.isArray(reference)&&
  Object.keys(reference).length===Object.keys(heikoProfessorRenderReference).length&&
  Object.entries(heikoProfessorRenderReference).every(([key,value])=>reference[key]===value)&&
  parameters?.numStep===64&&parameters?.speed===.9&&parameters?.device==='cuda'&&
  parameters?.dtype==='f16'&&parameters?.preprocessPrompt===true;
}
export function validNeighborRenderInput(clip){
 const fields=['actualInferenceText','actualInferenceSha256','canonicalSourceSha256','renderNormalizationPolicy'];
 if(fields.every(key=>clip[key]===undefined))return true;
 if(clip.voiceId!=='jwd-heiko-maaslos'||typeof clip.text!=='string')return false;
 if(clip.nativeParts!==undefined||clip.nativeCompletion?.kind!==undefined)return false;
 let expected;
 if(clip.renderNormalizationPolicy==='finite-authored-apostrophe-contractions-v1'){
  expected=clip.text.replace(/(?<!\p{L})(sie|du|er|haben|ich|man|meinen|sag|sehen|wir|gibt)[’']s(?!\p{L})/giu,(_,base)=>base+' es');
 }else if(clip.renderNormalizationPolicy==='finite-spoken-tag-and-elision-punctuation-v1'){
  expected=clip.text.replace(/, ja\?/g,'. Ja?').replace(/\bhab\b/g,"hab'");
 }else if(clip.renderNormalizationPolicy==='finite-spoken-short-form-pause-v1'){
  expected=clip.text.replace(/sag[’']s/g,'sag … es').replace(/\bhab ihm\b/g,'hab … ihm').replace(/, ja\?/g,'; ja?');
 }else return false;
 return expected!==clip.text&&clip.actualInferenceText===expected&&
  clip.canonicalSourceSha256===textHash(clip.text)&&clip.actualInferenceSha256===textHash(expected)&&
  neighborSpokenWords(expected)===neighborSpokenWords(clip.text);
}
export function neighborNativeCompletion(clip){
 const completion=clip.nativeCompletion;
 if(!validNeighborReferenceConditioning(clip)||!validNeighborRenderInput(clip))return false;
 if(completion?.completed!==true)return false;
 if(completion.kind===undefined)return clip.nativeParts===undefined&&
  !['join','parentSynthesisCalls','partSynthesisCalls','authorizationSha256'].some(key=>completion[key]!==undefined);
 if(completion.kind!=='ordered-complete-native-parts'||clip.voiceId!=='jwd-heiko-maaslos')return false;
 const parts=clip.nativeParts,join=completion.join,validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
 if(!Array.isArray(parts)||parts.length<2||parts.length>20||completion.parentSynthesisCalls!==0||
  completion.basis!=='ordered complete native parts; no parent model call'||!validHash(completion.authorizationSha256)||
  completion.partSynthesisCalls!==parts.reduce((sum,part)=>sum+part.synthesisCalls,0)||
  join?.method!=='ffmpeg-concat-pcm'||join.sampleRateHz!==24000||join.channels!==1||
  join.insertedSilence!==false||join.crossfade!==false||join.trim!==false||!validHash(join.ffmpegSha256)||
  !validHash(join.outputAudioSha256)||join.outputAudioSha256!==clip.nativeAudioSha256||
  !Number.isInteger(join.outputSamples)||join.outputSamples<=0||
  !Array.isArray(join.partAudioSha256)||join.partAudioSha256.length!==parts.length)return false;
 let end=0,samples=0;
 for(const [index,part] of parts.entries()){
  const parameters=part.nativeCompletion?.inferenceParameters;
  if(part.index!==index||!Number.isInteger(part.sourceStart)||!Number.isInteger(part.sourceEnd)||
   part.sourceStart<end||part.sourceEnd<=part.sourceStart||part.sourceEnd>clip.text.length||
   !/^\s*$/.test(clip.text.slice(end,part.sourceStart))||part.text!==clip.text.slice(part.sourceStart,part.sourceEnd)||
   !part.text.trim()||!Number.isInteger(part.synthesisCalls)||part.synthesisCalls<1||part.synthesisCalls>(part.renderNormalizationPolicy==='finite-spoken-short-form-pause-v1'?3:2)||
   !['voiceId','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','processing'].every(key=>part[key]===clip[key])||
   !['nativeAudioSha256','nativeAnnotationSha256','encodedSha256','asrModelSha256'].every(key=>validHash(part[key]))||
   part.nativeAudioSha256!==join.partAudioSha256[index]||!Number.isInteger(part.nativeSamples)||part.nativeSamples<=0||
   part.nativeSampleRateHz!==24000||part.nativeChannels!==1||part.nativeCompletion?.completed!==true||
   part.nativeCompletion.kind!==undefined||!neighborNativeCompletion(part)||!validHash(part.nativeCompletion.inferenceSha256)||!validHash(part.nativeCompletion.binarySha256)||
   !Number.isInteger(part.seed)||![32,64].includes(parameters?.numStep)||![.9,1].includes(parameters?.speed)||
   parameters?.device!=='cuda'||parameters?.dtype!=='f16'||parameters?.preprocessPrompt!==true||
   part.asrScriptPrompt!==null||part.asrWordExact!==true||typeof part.asr!=='string'||
   neighborSpokenWords(part.asr)!==neighborSpokenWords(part.text))return false;
  end=part.sourceEnd;samples+=part.nativeSamples;
 }
 return /^\s*$/.test(clip.text.slice(end))&&samples===join.outputSamples;
}
// These final encodings were independently decoded and checked against every
// contiguous ASR input window. Keep the failed whole-file readings in the proof.
const neighborWindowAuthorities=Object.freeze({
 'heiko-story-24':{encodedSha256:'cf9d612014ff425760dfbc81bb57c5232af45aa5fe0c2d95a945ec14822c481f',proofSha256:'1ee63a1fef234af2e3782fb6fee74427ff727312cec8756e6a72cb78e7e74cb9'},
 'heiko-story-27':{encodedSha256:'e5249c6bf73e81e88a2ed92cfd895285027bc8179bf6862710df2f0f1cb9c0c8',proofSha256:'b621dffc14f04cae06c0c65b301f5f96c66580b49fa1c55be7366c671ab41855'}
});
export function neighborWindowRecognition(clip){
 const mode=clip.asrVerificationMode,proof=clip.asrWindowProof;
 const authority=neighborWindowAuthorities[clip.clipId];
 if(mode!=='exhaustive-final-encoding-windows-v1')return proof===undefined&&!Object.values(neighborWindowAuthorities).some(row=>row.encodedSha256===clip.sha256);
 if(!authority||clip.voiceId!=='jwd-heiko-maaslos'||clip.sha256!==authority.encodedSha256||
  !proof||textHash(JSON.stringify(proof))!==authority.proofSha256||
  clip.asrInputTransform!==undefined||clip.asrUnframedTranscript!==undefined||
  !neighborNativeCompletion(clip)||clip.nativeCompletion?.kind!=='ordered-complete-native-parts'||
  proof.kind!==mode||proof.encodedSha256!==clip.sha256||proof.sourceSha256!==textHash(clip.text)||
  proof.sampleRateHz!==16000||proof.channels!==1||proof.bitsPerSample!==16||
  proof.scriptPrompt!==null||proof.speechSamplesUnmodified!==true||proof.exhaustiveCoverageVerified!==true||
  proof.modelSha256!==clip.asrModelSha256||clip.asrScriptPrompt!==null||clip.asrWordExact!==true||
  !Array.isArray(proof.windows)||proof.windows.length!==clip.nativeParts.length||
  !Array.isArray(proof.priorWholeReadings)||proof.priorWholeReadings.length===0||
  !proof.priorWholeReadings.every(row=>row.exact===false&&typeof row.transcript==='string'&&neighborSpokenWords(row.transcript)!==neighborSpokenWords(clip.text)))return false;
 const coverage=proof.nativeCoverage,join=clip.nativeCompletion.join;
 if(coverage?.kind!==clip.nativeCompletion.kind||coverage.sampleRateHz!==join.sampleRateHz||coverage.channels!==join.channels||
  coverage.totalSamples!==join.outputSamples||coverage.joinedNativeAudioSha256!==clip.nativeAudioSha256||
  coverage.joinedNativePcmSha256!==join.outputPcmSha256||coverage.assemblyReceiptSha256!==clip.nativeAnnotationSha256||
  coverage.authorizationSha256!==clip.nativeCompletion.authorizationSha256||
  JSON.stringify(coverage.partAudioSha256)!==JSON.stringify(join.partAudioSha256)||
  JSON.stringify(coverage.partPcmSha256)!==JSON.stringify(join.partPcmSha256)||
  (proof.nativeSynthesisAccounting!==undefined&&JSON.stringify(proof.nativeSynthesisAccounting)!==JSON.stringify(clip.nativeSynthesisAccounting)))return false;
 const accounting=proof.nativeSynthesisAccounting;
 if(accounting&&(accounting.selectedLeafCalls!==clip.nativeCompletion.partSynthesisCalls||
  accounting.selectedLeaves.length!==clip.nativeParts.length||
  !accounting.selectedLeaves.every((leaf,index)=>{
   const part=clip.nativeParts[index];
   return ['index','sourceStart','sourceEnd','nativeAudioSha256','nativePcmSha256','synthesisCalls'].every(key=>leaf[key]===part[key])&&leaf.sourceSha256===textHash(part.text);
  })))return false;
 let end=0,samples=0;
 for(const [index,window]of proof.windows.entries()){
  const part=clip.nativeParts[index];samples+=part.nativeSamples;
  const boundary=index===proof.windows.length-1?proof.totalSamples:Math.round(samples*2/3);
  if(window.index!==index||window.sourceStart!==part.sourceStart||window.sourceEnd!==part.sourceEnd||
   window.startSample!==end||window.endSampleExclusive!==boundary||boundary<=end||
   typeof window.transcript!=='string'||neighborSpokenWords(window.transcript)!==neighborSpokenWords(part.text))return false;
  end=boundary;
 }
 return end===proof.totalSamples&&end===Math.round(clip.nativeCompletion.join.outputSamples*2/3)&&
  clip.asr===proof.windows.map(row=>row.transcript).join(' ')&&neighborSpokenWords(clip.asr)===neighborSpokenWords(clip.text);
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
   requireMatch(validNeighborRenderInput(clip),'Unverified neighbor render input');
   requireMatch(neighborWindowRecognition(clip),'Unverified neighbor final-encoding ASR windows');
   const exact=typeof clip.asr==='string'&&neighborSpokenWords(clip.asr)===neighborSpokenWords(clip.text);
   const dialectAdvisory=clip.voiceId==='jwd-frau-schwabingen'&&cast.productionVoices[clip.voiceId]?.asrPolicy==='dialect-advisory'&&clip.asrVerificationMode==='dialect-advisory';
   requireMatch(neighborNativeCompletion(clip)&&clip.asrWordExact===exact&&clip.asrScriptPrompt===null&&/^[a-f0-9]{64}$/.test(clip.asrModelSha256)&&typeof clip.asr==='string'&&clip.asr.trim().length>0&&(exact||dialectAdvisory),'Missing independent final-encoding neighbor ASR or authorized dialect-advisory receipt');
   requireMatch(Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5&&clip.approval?.status==='user-approved','Unverified neighbor take');
   requireMatch(clip.file===`assets/voices/neighbors/${clip.clipId}.mp3`&&hash(resolve(assetRoot,clip.file))===clip.sha256,'Neighbor audio hash/path drift');
   requireMatch(clip.mouthHz===40&&clip.mouthEnergy.length===Math.ceil(clip.durationSeconds*40)&&clip.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255),'Invalid encoded-media mouth cue');
   const key=clip.voiceId+'\0'+clip.text;requireMatch(!seen.has(key),'Duplicate neighbor recording');seen.add(key);
   const {clipId,voiceId,actorId,profileId,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,sha256,mouthHz,mouthEnergy}=clip;
   const nativePartReferenceInputs=clip.nativeParts?.flatMap((part,index)=>part.referenceConditioning?[{index,referenceConditioning:part.referenceConditioning}]:[])||[];
   const renderFields=['actualInferenceText','actualInferenceSha256','canonicalSourceSha256','renderNormalizationPolicy'];
   const renderInput=take=>Object.fromEntries(renderFields.flatMap(key=>take[key]!==undefined?[[key,take[key]]]:[]));
   const nativePartRenderInputs=clip.nativeParts?.flatMap((part,index)=>part.actualInferenceText!==undefined?[{index,...renderInput(part)}]:[])||[];
   const receipt={profileId,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,trigger:'jwd-neighbor-exact-dialogue',approval:clip.approval,provenanceManifest:manifest.provenanceManifest,...(clip.referenceConditioning?{referenceConditioning:clip.referenceConditioning}:{}),...(nativePartReferenceInputs.length?{nativePartReferenceInputs}:{}),...renderInput(clip),...(nativePartRenderInputs.length?{nativePartRenderInputs}:{})},receiptKey=JSON.stringify(receipt);
   if(!bindingIndices.has(receiptKey)){bindingIndices.set(receiptKey,bindings.length);bindings.push(receipt)}
   entries['./'+clip.file]={binding:bindingIndices.get(receiptKey),id:clipId,voiceId,actorId,sha256,mouthHz,mouthEnergy,fixedProduction:true,source:clip.text,english:clip.english,durationMs:Math.round(clip.durationSeconds*1000),...(clip.asrWindowProof?{asrVerificationMode:clip.asrVerificationMode,asrWindowProofSha256:textHash(JSON.stringify(clip.asrWindowProof))}:{})};
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
// Police text is authored by game.js; English captions are the matching six
// entries in the public police transcript pool for both regional variants.
export function policeDialogueSources(cast,sourceRoot=root){
 const game=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),catalogSource=readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8');
 const match=game.match(/const policeBarks=(\{[\s\S]*?\});\nconst TRAIN_ANNOUNCEMENT_AUDIO/);requireMatch(match,'Missing authored policeBarks source');
 const barks=vm.runInNewContext('('+match[1]+')'),window={};vm.runInNewContext(catalogSource,{window});
 const english=window.GermanySimulatorAudioText?.pools?.police,voiceId='polizei-heinrich-wachtmeister',owner=cast.roleProfiles.find(row=>row.gameRole==='police'),binding=cast.productionVoices[voiceId];
 requireMatch(owner?.voiceId===voiceId&&owner.dialogueSources?.includes('game.js policeBarks[region]')&&binding?.profileId===owner.secretTunnelProfileId&&binding.profileId==='24b741bbe55d4f3a843aa481c3459a96'&&binding.referenceSha256==='abd1b50a64b82e4ec6ff903c4d286094fb9cbca2f756a1b35e45f6b455729ee7'&&binding.originalSha256==='718d21fd8dc250521a21882f86795cf8652845df7c128e655c0e2e771ac3207e','Police selected-profile source binding changed');
 requireMatch(Array.isArray(english)&&english.length===6&&['berlin','germany'].every(region=>Array.isArray(barks[region])&&barks[region].length===6),'Police region/text pool is not the authored six-line set');
 const rows=[];for(const region of ['berlin','germany'])for(let slot=0;slot<6;slot++)rows.push({clipId:`${voiceId}-${region}-${String(slot+1).padStart(2,'0')}`,voiceId,actorId:'police',region,slot,sourceLocator:`game.js policeBarks.${region}[${slot}]`,text:barks[region][slot],english:english[slot],profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null});
 requireMatch(rows.length===12&&new Set(rows.map(row=>row.clipId)).size===12,'Police exact source set changed');return rows;
}
export function policeManifestAuthority(cast,manifest,sourceRoot=root){
 const authored=new Map(policeDialogueSources(cast,sourceRoot).map(row=>[row.clipId,row])),admission=manifest.policeAdmission;
 requireMatch(manifest.voiceId==='polizei-heinrich-wachtmeister'&&manifest.profileId===cast.productionVoices[manifest.voiceId]?.profileId&&manifest.requestedLineCount===12&&Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=12&&Array.isArray(manifest.clips)&&Array.isArray(manifest.heldPrivate),'Police manifest scope/accounting changed');
 requireMatch(admission?.status==='ROOT-verified-native-police12'&&/^[a-f0-9]{64}$/.test(admission.authoritySha256)&&/^[a-f0-9]{64}$/.test(admission.requestSha256)&&admission.requestSha256===admission.frozenRequestSha256&&/^[a-f0-9]{64}$/.test(admission.authoredPlanSha256)&&admission.sourceHead==='6213f6429cc0ccdb64353f2729bfb732ec757a80'&&sameJson(admission.sourcePins,policeFrozenSourcePins)&&sameJson(Object.keys(admission.terminals||{}).sort(),['plan','process','render'])&&['plan','render','process'].every(phase=>{const row=admission.terminals[phase];return row?.exitCode===0&&row.rootRetired===true&&row.timedOut===false&&/^[a-f0-9]{64}$/.test(row.sha256)})&&/^[a-f0-9]{64}$/.test(admission.nativeLedgerSha256)&&((manifest.clips.length===0&&admission.asrLedgerSha256===null)||/^[a-f0-9]{64}$/.test(admission.asrLedgerSha256)),'Missing successful police phase/ledger provenance');
 const all=[...manifest.clips,...manifest.heldPrivate],ids=all.map(row=>row.clipId);requireMatch(all.length===12&&new Set(ids).size===12&&ids.every(id=>authored.has(id))&&manifest.lineCount===manifest.clips.length,'Police manifest must account for exactly twelve owned slots');
 for(const row of all){const job=authored.get(row.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value)),'Police accepted/held source, subtitle, slot, or profile drift');}
 requireMatch(sameJson(Object.keys(admission.takes||{}).sort(),manifest.clips.map(row=>row.clipId).sort()),'Police private receipt proof coverage differs from accepted clips');
 for(const clip of manifest.clips){const proof=admission.takes[clip.clipId],beams=clip.asrReadings?.map(row=>row.beamSize);fixedTakeAuthority(cast,clip);requireMatch(clip.decode?.eosReached===true&&clip.asrLiteralWordExact===true&&clip.asrWordExact===true&&clip.asrComputeType==='int8'&&clip.asrDevice==='cpu'&&clip.asrCpuThreads===1&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null&&clip.asrModelSha256==='e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da'&&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&(sameJson(beams,[1])||sameJson(beams,[1,5])),'Police candidate lacks EOS and exact German ASR');requireMatch(clip.asrBeamSize===beams.at(-1)&&clip.asr===clip.asrReadings.at(-1).transcript,'Police final ASR summary does not match its last reading');for(const key of ['rawReceiptSha256','encodedReceiptSha256','rawSha256','encodedSha256','profileJsonSha256'])requireMatch(/^[a-f0-9]{64}$/.test(proof?.[key]),'Police private proof hash missing');requireMatch(proof.rawSha256===clip.rawSha256&&proof.encodedSha256===clip.sha256&&proof.profileJsonSha256===clip.profileJsonSha256&&clip.approval?.status==='user-approved'&&clip.approval.scope==='whole-game-fixed-voice-cloning'&&clip.approval.clipId===clip.clipId&&clip.approval.encodedSha256===clip.sha256,'Police selected bytes lack exact proof/approval');}
 return authored;
}
export function policeRecordingsBlock(cast,manifests,assetRoot=root,sourceRoot=root){
 const clips=[];for(const manifest of manifests){policeManifestAuthority(cast,manifest,sourceRoot);for(const clip of manifest.clips){requireMatch(hash(resolve(assetRoot,clip.file))===clip.sha256&&clip.file===`assets/voices/police-dialogue/${clip.clipId}.mp3`,'Police public asset path/bytes changed');clips.push({...clip,provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});}}
 return fixedRecordingsBlock(cast,{clips},'police-dialogue',assetRoot,sourceRoot);
}
const policeAdmissionPattern=/const policeAdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);\n/;
function policeAdmissions(source){return JSON.parse(source.match(policeAdmissionPattern)?.[1]||'{}')}

const policeFrozenSourcePins=Object.freeze({'game.js':'47b70c188a5e6978a1ad04f0f4106833fe19baf364891ba5315413bd1cc4d1ac','For-AI/VOICE-CAST.json':'8f30c7f7f61396d9462b61affc9d2aa116218d1023d04a6b191634e2f44a134f','For-AI/AUDIO-TEXT-LIBRARY.js':'cd6d3abecb6dc1abb344a9cae794ea9d160e90e2faf0798aafa69a35358f14d6'});

// Finite German quiz questions are a distinct authoring family. These pins are
// the current source snapshot used by the sealed German9 request, not the old
// police or preview receipts.
const quizGerman9SourcePins=Object.freeze({'game.js':'2e0b82b73ab2c23d4922d28650edda6ebff730c88d0f1400348b1317e3339cf5','For-AI/VOICE-CAST.json':'8f30c7f7f61396d9462b61affc9d2aa116218d1023d04a6b191634e2f44a134f','For-AI/AUDIO-TEXT-LIBRARY.js':'267388a27742baa2ed1be1515d5fb5095e4618c32f357541912336e2c1bc9980','For-AI/QUIZ-CHARACTER-DICTIONARY.js':'d73c92953858a2a9db32cc46abad04b202584015e3a6cac61cc4666d7c28e56a'});
const quizGerman9ClipIds=Object.freeze(['quiz-gisela-becker-question-24-germany','quiz-ruediger-schmidt-question-g-b2-01-germany','quiz-sabine-krueger-question-g-b1-01-germany','quiz-uwe-moeller-question-24-germany','quiz-brigitte-neumann-question-kl-01-germany','quiz-klaus-dieter-wagner-question-fs-01-germany','quiz-heike-hoffmann-question-24-germany','quiz-dietmar-schulz-question-g-c1-01-germany','quiz-hartmut-keller-question-fs-01-germany']);

export function quizGerman9DialogueSources(cast,request,inventory,inventorySha256,sourceRoot=root,options={}){
 const game=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),audioText=readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),dictionarySource=readFileSync(resolve(sourceRoot,'For-AI/QUIZ-CHARACTER-DICTIONARY.js'),'utf8');
 requireMatch(options.admittedCatalog===true||Object.entries(quizGerman9SourcePins).every(([path,digest])=>hash(resolve(sourceRoot,path))===digest),'German9 authoring source snapshot changed');
 const match=game.match(/const citizenshipQuestions=(\[[\s\S]*?\]);\nconst berlinCitizenshipQuestions=/);requireMatch(match,'Missing German9 citizenship question source');
 const questions=vm.runInNewContext(match[1]),window={};vm.runInNewContext(audioText,{window});vm.runInNewContext(dictionarySource,{window});
 const catalog=window.GermanySimulatorAudioText,characters=window.GermanySimulatorQuizCharacters?.characters,inventoryRows=options.admittedCatalog===true?[...(options.manifest?.clips||[]),...(options.manifest?.heldPrivate||[])]:inventory?.jobs;
 requireMatch(Array.isArray(questions)&&Array.isArray(characters)&&Array.isArray(inventoryRows)&&(options.admittedCatalog===true||inventory.status==='CURRENT_SOURCE_INVENTORY_ONLY_NOT_AUTHORIZED724CALLS'&&inventory.eligibleQuestionSlots===724&&sameJson(inventory.sourceSha256,quizGerman9SourcePins)),'Missing exact 724-slot quiz inventory');
 requireMatch(request.family==='quiz-dialogue'&&request.publicAssetFamily==='assets/voices/quiz-segments'&&request.fullEligibleQuestionSlots===724&&/^[a-f0-9]{64}$/.test(request.fullInventorySha256||'')&&sameJson(request.sourceSha256,quizGerman9SourcePins)&&(options.admittedCatalog===true||request.fullInventorySha256===inventorySha256&&sameJson(request.sourceSha256,quizGerman9SourcePins)),'German9 request does not bind the public quiz inventory/source');
 requireMatch(Array.isArray(request.jobs)&&request.jobs.length===9&&sameJson(request.jobs.map(row=>row.clipId),quizGerman9ClipIds)&&new Set(request.jobs.map(row=>row.voiceId)).size===9,'German9 must own exactly nine distinct quiz question slots');
 const rows=[];
 for(const job of request.jobs){
  const sourceMatch=/^game\.js citizenshipQuestions\[(\d+)\]\.question$/.exec(job.sourceLocator),index=sourceMatch?Number(sourceMatch[1]):-1,q=questions[index],questionId=String(q?.source),character=characters.find(row=>row.id===job.quizCharacterId),owner=cast.roleProfiles.find(row=>row.gameRole===job.voiceId),binding=cast.productionVoices[job.voiceId],questionCategory=q?.type==='fahrschule'?'traffic':q?.type==='grammar'?`grammar-${q.level.toLowerCase()}`:q?.type==='technik'?'technik':'civic',caption=catalog.questions?.[questionId];
  requireMatch(sourceMatch&&q&&questionId===String(job.questionId)&&q.question===job.text&&job.region==='germany'&&job.segment==='question'&&job.questionCategory===questionCategory&&job.actorId===character?.id&&job.voiceId===character?.voiceId&&character.categories.includes(questionCategory),'German9 clip does not match the authored character/question/category');
  requireMatch(job.sourceLocator===`game.js citizenshipQuestions[${index}].question`&&job.englishSourceLocator===`For-AI/AUDIO-TEXT-LIBRARY.js questions[${JSON.stringify(questionId)}]`&&caption===job.english&&job.english.trim(),'German9 German source/English subtitle locator changed');
  requireMatch(owner?.voiceId===job.voiceId&&owner.secretTunnelProfileId===job.profileId&&binding?.profileId===job.profileId&&binding.referenceSha256===job.referenceSha256&&binding.originalSha256===job.referenceOriginalSha256&&binding.renderer===job.renderer&&binding.modelRevision===job.modelRevision&&(binding.processing??null)===(job.processing??null),'German9 selected profile/reference/renderer binding changed');
  const inventoryRow=inventoryRows.find(row=>row.clipId===job.clipId);requireMatch(inventoryRow&&(options.admittedCatalog===true||sameJson(inventoryRow,job)),'German9 request job is not an exact row in the 724-slot inventory');
  rows.push({...job,sourceSha256:textHash(job.text)});
 }
 return rows;
}

function quizGerman9WordCues(clip){
 const tokens=[...clip.text.matchAll(/[\p{L}\p{N}_]+/gu)],cues=clip.wordCues;
 requireMatch(Array.isArray(cues)&&tokens.length>0&&cues.length===tokens.length,'German9 take lacks exact word cue coverage');
 let previousEnd=0,previousIndex=-1;
 requireMatch(cues.every((cue,index)=>{const valid=Object.keys(cue).length===4&&Number.isFinite(cue.at)&&Number.isFinite(cue.end)&&cue.at>=previousEnd&&cue.end>cue.at&&cue.end<=clip.durationSeconds+.05&&Number.isInteger(cue.charIndex)&&cue.charIndex>previousIndex&&cue.charIndex===tokens[index].index&&cue.word===tokens[index][0]&&clip.text.slice(cue.charIndex,cue.charIndex+cue.word.length)===cue.word;previousEnd=cue.end;previousIndex=cue.charIndex;return valid}),'German9 caption cues do not preserve exact source-word order/timing');
 return cues;
}

export function quizGerman9ManifestAuthority(cast,manifest,request,inventory,inventorySha256,sourceRoot=root,options={}){
 const authoredRows=quizGerman9DialogueSources(cast,request,inventory,inventorySha256,sourceRoot,{...options,manifest}),authored=new Map(authoredRows.map(row=>[row.clipId,row])),listed=[...(manifest.clips||[]),...(manifest.heldPrivate||[])],ids=listed.map(row=>row.clipId);
 requireMatch(manifest.voiceId==='quiz-german9-finite'&&manifest.requestedLineCount===9&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=9&&manifest.lineCount===manifest.clips.length&&listed.length===9&&new Set(ids).size===9&&ids.every(id=>authored.has(id)),'German9 manifest does not account for exactly the granted nine questions');
 for(const row of listed){const job=authored.get(row.clipId);requireMatch(job&&Object.entries(job).filter(([key])=>key!=='sourceSha256').every(([key,value])=>sameJson(row[key],value)),'German9 accepted/held question source, English, actor, or profile drift');}
 const admission=manifest.quizAdmission;
 requireMatch(admission?.status==='ROOT-verified-finite-quiz-german9'&&admission.grantId==='ROOT-finite-quiz-German9-shortpath-20261015-v3'&&admission.authoritySha256==='0e509a29631667254f11cb85e8694f050daa7cafb52c24af47684b1e4eee29b4'&&admission.requestSha256==='a17982691b6bc3d60631c88c9337821beec0e045196948c20cd669ccfee885a9'&&admission.requestSha256===admission.authoredPlanSha256&&/^[a-f0-9]{40}$/.test(admission.sourceCommit||'')&&admission.inventorySha256===inventorySha256,'German9 authority/request/source-commit/inventory provenance mismatch');
 requireMatch(/^[a-f0-9]{64}$/.test(admission.frozenRequestsSha256),'German9 frozen request digest format mismatch');
 requireMatch(sameJson(Object.keys(admission.frozenRequests||{}).sort(),[...quizGerman9ClipIds].sort()),'German9 frozen request map identity mismatch');
 requireMatch(Object.values(admission.frozenRequests||{}).every(value=>/^[a-f0-9]{64}$/.test(value)),'German9 frozen request map value mismatch');
 requireMatch(textHash(JSON.stringify(admission.frozenRequests))===admission.frozenRequestsSha256,'German9 frozen request map digest mismatch');
 requireMatch(sameJson(admission.sourcePins,quizGerman9SourcePins),'German9 authoring source pin map mismatch');
 requireMatch(sameJson(Object.keys(admission.terminals||{}).sort(),['plan','process','render'])&&Object.values(admission.terminals).every(row=>/^[a-f0-9]{64}$/.test(row.sha256)&&/^[a-f0-9]{64}$/.test(row.summarySha256)&&row.exitCode===0&&row.rootRetired===true&&row.timedOut===false),'German9 phase terminal proof mismatch');
 requireMatch(sameJson(Object.keys(admission.takes||{}).sort(),manifest.clips.map(row=>row.clipId).sort()),'German9 selected receipt coverage mismatch');
 for(const clip of manifest.clips){
  const beams=clip.asrReadings?.map(row=>row.beamSize);fixedTakeAuthority(cast,clip);
  requireMatch(clip.file===`assets/voices/quiz-segments/${clip.clipId}.mp3`&&clip.region==='germany'&&clip.segment==='question'&&clip.decode?.eosReached===true&&clip.asrLiteralWordExact===true&&clip.asrWordExact===true&&clip.asrDevice==='cpu'&&clip.asrComputeType==='int8'&&clip.asrCpuThreads===1&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null&&clip.asrModelSha256==='e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da'&&clip.asrEffectiveComputeType==='int8_float32'&&(sameJson(beams,[1])||sameJson(beams,[1,5]))&&clip.asrBeamSize===beams.at(-1)&&clip.asr===clip.asrReadings.at(-1).transcript,'German9 accepted take lacks EOS, literal exact final German ASR, or exact independent recipe');
  requireMatch(Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5,'German9 accepted take fails final loudness/peak limits');quizGerman9WordCues(clip);
  const proof=manifest.quizAdmission.takes?.[clip.clipId];requireMatch(proof&&proof.encodedSha256===clip.sha256&&proof.rawSha256===clip.rawSha256&&proof.profileJsonSha256===clip.profileJsonSha256&&/^[a-f0-9]{64}$/.test(proof.rawReceiptSha256)&&/^[a-f0-9]{64}$/.test(proof.encodedReceiptSha256),'German9 accepted take lacks raw/encoded/profile proof hashes');
 }
 return authoredRows;
}

export function quizGerman9RecordingsBlock(cast,manifest,request,inventory,inventorySha256,assetRoot=root,sourceRoot=root,options={}){
 const authoredRows=quizGerman9ManifestAuthority(cast,manifest,request,inventory,inventorySha256,sourceRoot,options);
 for(const clip of manifest.clips)requireMatch(hash(resolve(assetRoot,clip.file))===clip.sha256,'German9 public MP3 bytes changed');
 return fixedRecordingsBlock(cast,{clips:manifest.clips,authoredRows,quizAdmission:manifest.quizAdmission},'quiz-dialogue',assetRoot,sourceRoot);
}

const quizGerman9RequestKeys=Object.freeze(['clipId','voiceId','actorId','quizCharacterId','region','slot','questionId','questionCategory','segment','sourceLocator','englishSourceLocator','text','english','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','processing']);
export function checkQuizGerman9AdmittedCatalog(cast,source,assetRoot=root,sourceRoot=root){
 const relative='assets/voices/quiz-segments/quiz-german9-manifest.json',file=resolve(assetRoot,relative),admissions=quizGerman9Admissions(source);
 if(!existsSync(file)){requireMatch(!Object.hasOwn(admissions,relative),'German9 catalog anchor exists without its public manifest');return false;}
 const manifestBytes=readFileSync(file,'utf8'),manifest=json(file),manifestSha256=textHash(manifestBytes);
 requireMatch(admissions[relative]===manifestSha256,'German9 public manifest anchor/hash changed');
 const admission=manifest.quizAdmission,inventorySha256=admission?.inventorySha256,rows=[...(manifest.clips||[]),...(manifest.heldPrivate||[])];
 requireMatch(/^[a-f0-9]{64}$/.test(inventorySha256||'')&&rows.length===9,'German9 public manifest lacks its finite inventory/accounting proof');
 const rowById=new Map(rows.map(row=>[row.clipId,row])),jobs=quizGerman9ClipIds.map(id=>{const row=rowById.get(id);return row&&Object.fromEntries(quizGerman9RequestKeys.map(key=>[key,row[key]]))});
 const request={family:'quiz-dialogue',publicAssetFamily:'assets/voices/quiz-segments',fullEligibleQuestionSlots:724,fullInventorySha256:inventorySha256,sourceSha256:admission.sourcePins,jobs};
 const inventory={jobs,status:'ADMITTED_PUBLIC_CATALOG_PROJECTION',eligibleQuestionSlots:724,sourceSha256:admission.sourcePins};
 const catalogManifest={...manifest,clips:manifest.clips.map(clip=>({...clip,provenanceManifest:relative,provenanceManifestSha256:manifestSha256}))};
 const block=quizGerman9RecordingsBlock(cast,catalogManifest,request,inventory,inventorySha256,assetRoot,sourceRoot,{admittedCatalog:true}),expected=source.match(/const quizGerman9Recordings=Object\.freeze\([^\n]*\);\n/)?.[0];
 requireMatch(expected===block&&source.includes(' ...quizGerman9Recordings,'),'German9 admitted recording block is stale; run the explicit admission path');
 return true;
}

export function quizGerman9EncodedEligibility(job,encoded){
 const failures=[];
 if(encoded?.decode?.eosReached!==true)failures.push('native EOS');
 if(encoded?.asrWordExact!==true||encoded?.asrLiteralWordExact!==true||typeof encoded?.asr!=='string'||spokenWords(job.text)!==spokenWords(encoded.asr))failures.push('literal exact German ASR');
 if(!Number.isFinite(encoded?.integratedLufs)||!Number.isFinite(encoded?.truePeakDbtp)||Math.abs(encoded.integratedLufs+18)>.3||encoded.truePeakDbtp>-1.5)failures.push('final MP3 loudness/peak');
 if(encoded?.asrDevice!=='cpu'||encoded?.asrComputeType!=='int8'||encoded?.asrEffectiveComputeType!=='int8_float32'||encoded?.asrCpuThreads!==1||encoded?.asrLanguageId!=='de'||encoded?.asrScriptPrompt!==null||encoded?.asrModelSha256!=='e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da')failures.push('independent ASR recipe');
 const beams=encoded?.asrReadings?.map(row=>row.beamSize);
 if(!(sameJson(beams,[1])||sameJson(beams,[1,5]))||encoded?.asrBeamSize!==beams?.at(-1)||encoded?.asr!==encoded?.asrReadings?.at(-1)?.transcript)failures.push('final one-or-two-reading ASR ledger');
 if(!Array.isArray(encoded?.wordCues)||!Number.isFinite(encoded?.durationSeconds))failures.push('caption cues/duration');
 return {eligible:failures.length===0,failedGates:failures};
}

export function quizGerman9DurationEvidence(raw,encoded,rawSummary,processSummary,rawSha256,encodedSha256){
 return Number.isFinite(raw?.durationSeconds)&&raw.durationSeconds>0&&Number.isFinite(encoded?.durationSeconds)&&encoded.durationSeconds>0&&
  Number.isFinite(rawSummary?.durationSeconds)&&Number.isFinite(processSummary?.durationSeconds)&&
  rawSummary.durationSeconds===raw.durationSeconds&&processSummary.durationSeconds===encoded.durationSeconds&&
  /^[a-f0-9]{64}$/.test(rawSha256||'')&&/^[a-f0-9]{64}$/.test(encodedSha256||'')&&
  rawSummary.rawSha256===rawSha256&&processSummary.encodedSha256===encodedSha256;
}

export function quizGerman9TerminalPassed(terminal,phase,authoritySha256,adapterSha256,pinCounts){
 const resource=terminal?.resource;
 return terminal?.phase===phase&&terminal.specificationSha256===authoritySha256&&terminal.producerSha256===adapterSha256&&terminal.rootRetired===true&&terminal.exitCode===0&&terminal.timedOut===false&&!terminal.supervisorError&&terminal.logsComplete===true&&Array.isArray(terminal.survivingOwnedChildren)&&terminal.survivingOwnedChildren.length===0&&Array.isArray(terminal.ownedCleanupKills)&&terminal.ownedCleanupKills.length===0&&terminal.postflightProtectedPinsChecked===pinCounts.public&&Array.isArray(terminal.postflightPinFailures)&&terminal.postflightPinFailures.length===0&&terminal.postflightProtectedPrivatePinsChecked===pinCounts.private&&Array.isArray(terminal.postflightPrivatePinFailures)&&terminal.postflightPrivatePinFailures.length===0&&terminal.postflightInputPinsChecked===pinCounts.input&&Array.isArray(terminal.postflightInputPinFailures)&&terminal.postflightInputPinFailures.length===0&&Number.isFinite(resource?.availableMiB)&&resource.availableMiB>=2048&&Number.isFinite(resource?.virtualFreeMiB)&&resource.virtualFreeMiB>=12000&&(phase!=='render'||(Number.isFinite(resource?.gpuFreeMiB)&&resource.gpuFreeMiB>=5500));
}

export function collectQuizGerman9PrivateManifestProposal(cast,authorityProof,terminalProofs,inventoryProof,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'German9 sealed authority changed');
 const authority=json(authorityProof.path),requestPath=resolve(authority.requestPath),request=json(requestPath),inventoryPath=resolve(inventoryProof?.path||''),inventory=json(inventoryPath),inventorySha256=hash(inventoryPath),authored=quizGerman9DialogueSources(cast,request,inventory,inventorySha256,sourceRoot),sourceSha256=Object.fromEntries(Object.keys(quizGerman9SourcePins).map(path=>[path,hash(resolve(sourceRoot,path))]));
 requireMatch(authorityProof.sha256==='0e509a29631667254f11cb85e8694f050daa7cafb52c24af47684b1e4eee29b4'&&authority.status==='ROOT_SEALED_FINITE_QUIZ_GERMAN9'&&authority.executorThread&&authority.sealed===true&&/^[a-f0-9]{40}$/.test(authority.sourceCommit||'')&&authority.grantId==='ROOT-finite-quiz-German9-shortpath-20261015-v3'&&authority.adapterSha256==='254901d8f554a96fa4d152d71860751957b3996bb82f1ed19be77b73f6f69563'&&authority.helperSha256==='722853a79b5838c480fbf93c8f036f6d96a82eb62f9c40b4943cbb797d437fe0'&&authority.requestSha256==='a17982691b6bc3d60631c88c9337821beec0e045196948c20cd669ccfee885a9'&&authority.requestSha256===hash(requestPath)&&hash(authority.helperPath)===authority.helperSha256,'Not the exact sealed German9 authority/request/helper');
 requireMatch(authority.privateReviewFamily==='GermanySimulator G9 v3 2026-10-15'&&authority.maximumNativeCalls===9&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===18&&authority.automaticRetries===0&&typeof authority.nativePlanInvocationThisGrant==='string'&&authority.nativePlanInvocationThisGrant.includes('genuine native execute(plan) once per9voice')&&sameJson(authority.selectedClipIds,quizGerman9ClipIds)&&Object.keys(authority.seeds||{}).length===9&&quizGerman9ClipIds.every(id=>authority.seeds[id]===71000&&Number.isInteger(authority.tokenCaps[id])&&authority.tokenCaps[id]>=1&&authority.tokenCaps[id]<=1000),'German9 finite identity/call/seed/token limits changed');
 requireMatch(sameJson(authority.sourceSha256,quizGerman9SourcePins)&&sameJson(request.sourceSha256,sourceSha256)&&sameJson(authority.sourceSha256,sourceSha256)&&request.producerSha256===authority.helperSha256&&request.fullInventorySha256===inventorySha256&&request.fullEligibleQuestionSlots===724,'German9 current source/inventory pins differ from the sealed plan');
 requireMatch(authority.expectedProtectedPublicPinCount===875&&authority.expectedProtectedPrivatePinCount===1607&&Object.keys(authority.inputPins||{}).length===185&&Object.keys(authority.protectedPublicPins||{}).length===875&&Object.keys(authority.protectedPrivatePins||{}).length===1607&&Array.isArray(authority.pendingPrivatePinPaths)&&authority.pendingPrivatePinPaths.length===0,'German9 protected pin counts or seal incompleteness changed');
 const rootPath=realpathSync(authority.musicRoot),familyPath=resolve(rootPath,authority.privateReviewFamily),family=realpathSync(familyPath),source=realpathSync(sourceRoot);requireMatch(family===familyPath&&source!==family&&!source.startsWith(family+sep)&&!family.startsWith(source+sep),'German9 source/private family alias or scope drift');
 const privateFile=(privateRoot,relative)=>{const path=resolve(privateRoot,relative);requireMatch(path.startsWith(privateRoot+sep)&&existsSync(path)&&!lstatSync(path).isSymbolicLink()&&realpathSync(path)===path,'German9 private proof path alias or missing file');return path;};
 const hashes=map=>Object.fromEntries(Object.entries(map||{}).map(([path,digest])=>{requireMatch(/^[a-f0-9]{64}$/.test(digest)&&existsSync(path)&&!lstatSync(path).isSymbolicLink()&&hash(path)===digest,'German9 protected file pin changed');return [path,digest]}));
 // Terminal postflight records bind all 185 input pins; avoid rehashing
 // bundled model weights here. Recheck the sealed 875 public and 1,607
 // private protected receipts/metadata exactly as inventoried.
 hashes(authority.protectedPublicPins);hashes(authority.protectedPrivatePins);
 const phaseNames=['plan','render','process'],terminals={},terminalHashes={},summaries={};
 for(const phase of phaseNames){
  const proof=terminalProofs?.[phase];requireMatch(proof?.sha256===hash(proof.path),'German9 phase terminal changed: '+phase);const terminal=json(proof.path);
  requireMatch(proof.path.toLowerCase().endsWith(`${phase}-quiz-german9-v3-primary-terminal.json`)&&quizGerman9TerminalPassed(terminal,phase,authorityProof.sha256,authority.adapterSha256,{public:authority.expectedProtectedPublicPinCount,private:authority.expectedProtectedPrivatePinCount,input:Object.keys(authority.inputPins).length}),'German9 phase terminal failed a bounded retirement/resource/protected-pin check: '+phase);
  const summaryPath=privateFile(resolve(family,'_german9-control'),`${phase}-summary.json`),summary=json(summaryPath);requireMatch(summary.authoritySha256===authorityProof.sha256&&summary.adapterSha256===authority.adapterSha256&&summary.helperSha256===authority.helperSha256&&summary.phase===phase&&summary.rows?.length===9&&summary.selectedClipCount===9&&summary.publicExports===0&&summary.humanListeningVerified===false&&summary.automaticRetries===0,'German9 genuine phase summary scope mismatch: '+phase);
  if(phase==='plan')requireMatch(summary.nativePlanInvocationThisGrant===true&&Object.keys(summary.frozenRequestPins||{}).length===9,'German9 plan did not freeze nine requests');
  terminals[phase]={sha256:proof.sha256,exitCode:0,rootRetired:true,timedOut:false,summarySha256:hash(summaryPath)};terminalHashes[phase]=proof.sha256;summaries[phase]=summary;
 }
 const plan=summaries.plan,render=summaries.render,processResult=summaries.process,clips=[],heldPrivate=[],takes={},frozenRequests={},privateAudit=[];let generatedLineCount=0;
 const renderById=new Map(render.rows.map(row=>[row.clipId,row])),processById=new Map(processResult.rows.map(row=>[row.clipId,row]));
 requireMatch(renderById.size===9&&processById.size===9&&quizGerman9ClipIds.every(id=>renderById.has(id)&&processById.has(id)),'German9 render/process summaries do not cover exactly the nine owned slots');
 for(const job of request.jobs){
  const privateRoot=realpathSync(resolve(family,job.voiceId));requireMatch(privateRoot===resolve(family,job.voiceId),'German9 actor root alias');
  const requestFile=privateFile(privateRoot,'requests.json'),privateRequest=json(requestFile),frozenHash=hash(requestFile),frozenRow=plan.frozenRequestPins[requestFile];
  const expectedFrozen={requestedLineCount:1,sourceSha256:request.sourceSha256,jobs:[job],approvedExistingReuse:[],authoredPlanSha256:authority.requestSha256,authoredPlanSourceSha256:request.sourceSha256};
  requireMatch(frozenRow===frozenHash&&sameJson(privateRequest,expectedFrozen),'German9 frozen one-job actor request drift');frozenRequests[job.clipId]=frozenHash;
  const rawPath=privateFile(privateRoot,`raw/${job.clipId}.json`),raw= json(rawPath),wavPath=privateFile(privateRoot,`raw/${job.clipId}.wav`),rawSha=hash(wavPath),rawEvidence=renderById.get(job.clipId),processEvidence=processById.get(job.clipId),profile=authority.profileBindings[job.voiceId];
  generatedLineCount++;const synth=raw.synthesis,decode=raw.decode;
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.authoringHelperSha256===authority.helperSha256&&raw.requestSha256===frozenHash&&raw.seed===71000&&raw.synthesisAttempt===1&&raw.rendererInputText===job.text&&!raw.rescueParts&&!raw.deliveryEditing&&raw.profileJsonSha256===profile.profileJsonSha256&&raw.referenceSha256===job.referenceSha256&&raw.referenceOriginalSha256===job.referenceOriginalSha256&&raw.referenceLicense==='CC0-1.0','German9 raw receipt author/source/profile/seed mismatch');
  requireMatch(synth?.device==='cuda'&&synth.precision==='fp16'&&synth.t3WeightPrecision==='float16'&&synth.conditioningPrecision==='float32'&&synth.exaggeration===.5&&synth.temperature===.65&&synth.repetitionPenalty===3&&synth.cfgWeight===.6&&synth.languageId==='de'&&synth.cpuThreads===2&&synth.inferenceMode===true&&synth.referenceReconditionedForProfile===job.profileId&&synth.referenceConditioningVerifiedFloat32===true,'German9 raw synthesis recipe mismatch');
  requireMatch(decode?.maxSpeechTokens===authority.tokenCaps[job.clipId]&&Number.isInteger(decode.generatedSpeechTokens)&&decode.generatedSpeechTokens>0&&decode.generatedSpeechTokens<=decode.maxSpeechTokens&&typeof decode.eosReached==='boolean'&&decode.attentionHooksBefore===0&&decode.attentionHooksAfter===0&&hash(rawPath)===rawEvidence.receiptSha256&&rawSha===rawEvidence.rawSha256&&rawEvidence.nativeEosReached===decode.eosReached&&rawEvidence.seed===71000&&rawEvidence.actualTakeWithinGrant===1&&rawEvidence.globalHistoricalOrdinal===null&&rawEvidence.profileId===job.profileId&&Number.isFinite(raw.durationSeconds)&&rawEvidence.durationSeconds===raw.durationSeconds&&rawEvidence.maxSpeechTokens===decode.maxSpeechTokens&&rawEvidence.generatedSpeechTokens===decode.generatedSpeechTokens,'German9 raw duration/receipt/EOS/render summary differs from native file');
  const identity=['clipId','rawSha256','receiptSha256','seed','actualTakeWithinGrant','globalHistoricalOrdinal','profileId','maxSpeechTokens','generatedSpeechTokens'];requireMatch(identity.every(key=>sameJson(processEvidence[key],rawEvidence[key])),'German9 process summary changed immutable raw identity');
  if(!decode.eosReached){requireMatch(processEvidence.asrReadings===0&&typeof processEvidence.status==='string'&&processEvidence.status.includes('held private'),'German9 no-EOS output must remain held without ASR');heldPrivate.push({...job,reason:'held private; observed native EOS did not complete'});privateAudit.push({clipId:job.clipId,status:'held',reason:'native EOS',rawReceiptSha256:hash(rawPath),rawSha256:rawSha,rawDurationSeconds:raw.durationSeconds});continue;}
  const encodedPath=privateFile(privateRoot,`encoded/${job.clipId}.json`),encoded=json(encodedPath),mp3Path=privateFile(privateRoot,`encoded/${job.clipId}.mp3`),mp3Sha=hash(mp3Path);
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&encoded.authoringHelperSha256===authority.helperSha256&&encoded.requestSha256===frozenHash&&encoded.profileJsonSha256===profile.profileJsonSha256&&encoded.rawSha256===rawSha&&encoded.rendererInputText===job.text&&encoded.seed===71000&&encoded.synthesisAttempt===1&&sameJson(encoded.synthesis,synth)&&sameJson(encoded.decode,decode)&&encoded.sha256===mp3Sha,'German9 encoded MP3/raw lineage/recipe changed');
  requireMatch(quizGerman9DurationEvidence(raw,encoded,rawEvidence,processEvidence,rawSha,mp3Sha)&&processEvidence.encodedReceiptSha256===hash(encodedPath)&&processEvidence.encodedSha256===encoded.sha256&&processEvidence.asrWordExact===encoded.asrWordExact&&processEvidence.asrReadings===encoded.asrReadings.length&&processEvidence.levelsPass===(Number.isFinite(encoded.integratedLufs)&&Number.isFinite(encoded.truePeakDbtp)&&Math.abs(encoded.integratedLufs+18)<=.3&&encoded.truePeakDbtp<=-1.5)&&processEvidence.wordCueCount===encoded.wordCues.length,'German9 raw/encoded summary duration, receipt, ASR, or levels diverge from final files');
  const readings=encoded.asrReadings,beams=readings?.map(row=>row.beamSize);requireMatch(Array.isArray(readings)&&(sameJson(beams,[1])||sameJson(beams,[1,5]))&&readings.every(row=>typeof row.transcript==='string'&&row.transcript.trim())&&encoded.asrBeamSize===beams.at(-1)&&encoded.asr===readings.at(-1).transcript&&encoded.asrDevice==='cpu'&&encoded.asrComputeType==='int8'&&encoded.asrEffectiveComputeType==='int8_float32'&&encoded.asrCpuThreads===1&&encoded.asrLanguageId==='de'&&encoded.asrScriptPrompt===null&&encoded.asrModelSha256==='e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da','German9 independent ASR dtype/device/language/reading ledger mismatch');
  const eligibility=quizGerman9EncodedEligibility(job,encoded);
  const privateTake={clipId:job.clipId,status:eligibility.eligible?'accepted':'held',failedGates:eligibility.failedGates,rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:rawSha,encodedSha256:mp3Sha,rawDurationSeconds:raw.durationSeconds,encodedDurationSeconds:encoded.durationSeconds,eosReached:decode.eosReached,asrWordExact:encoded.asrWordExact,asrLiteralWordExact:encoded.asrLiteralWordExact,asrReadings:encoded.asrReadings.length,levelsPass:processEvidence.levelsPass};privateAudit.push(privateTake);
  if(!eligibility.eligible){heldPrivate.push({...job,reason:'held private; '+eligibility.failedGates.join(', ')+' gate failed'});continue;}
  const clip={...encoded,file:`assets/voices/quiz-segments/${job.clipId}.mp3`,approval:{status:'user-approved',scope:'ROOT-sealed-finite-German9',grantId:authority.grantId,clipId:job.clipId,encodedSha256:encoded.sha256,listeningConfirmed:false}};quizGerman9WordCues(clip);fixedTakeAuthority(cast,clip);
  clips.push(clip);takes[job.clipId]={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:rawSha,encodedSha256:mp3Sha,profileJsonSha256:profile.profileJsonSha256,sourceSha256:job.sourceSha256};
 }
 requireMatch(generatedLineCount===9&&clips.length+heldPrivate.length===9,'German9 proposals must account for nine genuine first attempts');
 const frozenRequestsSha256=textHash(JSON.stringify(frozenRequests));
 const manifest={schemaVersion:1,voiceId:'quiz-german9-finite',profileId:'multiple-existing-quiz-profiles',fallback:'existing quiz presentation remains unchanged',status:'finite German9 proposal; only EOS, literal exact German ASR, levels, cues and source-bound takes accepted; held rows remain private',requestedLineCount:9,generatedLineCount,lineCount:clips.length,clips,heldPrivate,approvedExistingReuse:[],quizAdmission:{status:'ROOT-verified-finite-quiz-german9',grantId:authority.grantId,authoritySha256:authorityProof.sha256,authoredPlanSha256:authority.requestSha256,requestSha256:authority.requestSha256,frozenRequests,frozenRequestsSha256,sourceCommit:authority.sourceCommit,sourcePins:{...sourceSha256},inventorySha256,terminals,takes}};
 quizGerman9ManifestAuthority(cast,manifest,request,inventory,inventorySha256,sourceRoot);
 return {status:'private quiz proposal only; no public copy/catalog sync',authoritySha256:authorityProof.sha256,terminalHashes,counts:{requested:9,generated:generatedLineCount,accepted:clips.length,held:heldPrivate.length},manifest,privateAudit};
}

const quizAdmissionPattern=/const quizGerman9AdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);\n/;
function quizGerman9Admissions(source){return JSON.parse(source.match(quizAdmissionPattern)?.[1]||'{}')}
export function assertQuizGerman9TargetsAbsent(destination,manifest){
 const assetDir=resolve(destination,'assets/voices/quiz-segments');
 for(const clip of manifest.clips){const target=resolve(destination,clip.file);requireMatch(target.startsWith(assetDir+sep)&&!existsSync(target),'German9 admission refuses to overwrite any existing preview/recording');}
}
export function admitQuizGerman9PrivateProposals(cast,authorityProof,terminalProofs,inventoryProof,sourceRoot=root,destinationRoot=root,commitIo={}){
 const destination=realpathSync(destinationRoot),source=realpathSync(sourceRoot);requireMatch(destination!==source&&!destination.startsWith(source+sep)&&!source.startsWith(destination+sep),'German9 authoring source and destination must be separate roots');
 const collected=collectQuizGerman9PrivateManifestProposal(cast,authorityProof,terminalProofs,inventoryProof,source),manifest=collected.manifest;
 requireMatch(manifest.clips.length>0,'German9 admission requires at least one exact eligible take');
 const relative='assets/voices/quiz-segments/quiz-german9-manifest.json',manifestPath=resolve(destination,relative),catalogPath=resolve(destination,'For-AI/AUDIO-TEXT-LIBRARY.js'),assetDir=resolve(destination,'assets/voices/quiz-segments'),voicesRoot=realpathSync(resolve(destination,'assets/voices'));
 requireMatch(realpathSync(assetDir)===assetDir&&assetDir.startsWith(voicesRoot+sep),'German9 asset family aliases or escapes assets/voices');
 requireMatch(!existsSync(manifestPath),'German9 admission never overwrites an existing quiz manifest');
 const catalogSource=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n'),manifestTemporary=manifestPath+'.german9-admit.tmp',catalogTemporary=catalogPath+'.german9-admit.tmp';
 requireMatch(!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1&&!existsSync(manifestTemporary)&&!existsSync(catalogTemporary)&&!catalogSource.includes('const quizGerman9Recordings=Object.freeze('),'German9 catalog target or transaction temporary is already occupied');
 const admissionMap=quizGerman9Admissions(catalogSource);requireMatch(!Object.hasOwn(admissionMap,relative),'German9 admission anchor already exists');
 const bytes=JSON.stringify(manifest,null,2)+'\n',manifestSha256=textHash(bytes),catalogManifest={...manifest,clips:manifest.clips.map(clip=>({...clip,provenanceManifest:relative,provenanceManifestSha256:manifestSha256}))};
 const authoredRequest=json(resolve(json(authorityProof.path).requestPath)),inventory=json(resolve(inventoryProof.path)),inventorySha256=hash(resolve(inventoryProof.path));
 assertQuizGerman9TargetsAbsent(destination,manifest);
 const created=[];let manifestInstalled=false,catalogInstalled=false,copyBytes=commitIo.copyFileSync||copyFileSync,writeBytes=commitIo.writeFileSync||writeFileSync,rename=commitIo.renameSync||renameSync,unlink=commitIo.unlinkSync||unlinkSync;
 try{
  for(const clip of manifest.clips){const target=resolve(destination,clip.file);created.push(target);copyBytes(resolve(json(authorityProof.path).musicRoot,json(authorityProof.path).privateReviewFamily,clip.voiceId,'encoded',clip.clipId+'.mp3'),target,constants.COPYFILE_EXCL);requireMatch(hash(target)===clip.sha256,'Installed German9 MP3 hash drift');}
  const block=quizGerman9RecordingsBlock(cast,catalogManifest,authoredRequest,inventory,inventorySha256,destination,source);
  admissionMap[relative]=manifestSha256;const anchor='const quizGerman9AdmissionReceipts=Object.freeze('+JSON.stringify(admissionMap)+');\n';
  const nextCatalog=catalogSource.replace('const recordings=Object.freeze({',()=>anchor+block+'const recordings=Object.freeze({\n ...quizGerman9Recordings,');requireMatch(nextCatalog!==catalogSource&&nextCatalog.includes(anchor)&&nextCatalog.includes(' ...quizGerman9Recordings,'),'German9 catalog insertion point missing');
  created.push(manifestTemporary);writeBytes(manifestTemporary,bytes,{flag:'wx'});rename(manifestTemporary,manifestPath);manifestInstalled=true;requireMatch(readFileSync(manifestPath,'utf8')===bytes,'Installed German9 manifest changed');
  created.push(catalogTemporary);writeBytes(catalogTemporary,nextCatalog,{flag:'wx'});rename(catalogTemporary,catalogPath);catalogInstalled=true;requireMatch(readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n')===nextCatalog,'Installed German9 catalog changed');
 }catch(error){
  if(catalogInstalled){const rollback=catalogPath+'.german9-rollback.tmp';if(existsSync(rollback))unlink(rollback);writeBytes(rollback,catalogSource,{flag:'wx'});rename(rollback,catalogPath);}
  if(manifestInstalled)unlink(manifestPath);for(const file of created.reverse())if(existsSync(file))unlink(file);throw error;
 }
 return {family:'quiz-dialogue',requested:9,generated:manifest.generatedLineCount,accepted:manifest.clips.length,held:manifest.heldPrivate.length,manifest:manifestPath,manifestSha256,admissionAnchor:manifestSha256,listening:'NOT RUN',oldQuizPreviews:'preserved'};
}

function policeEosTraceAuthority(decode,trace){
 if(!decode||decode.eosPolicy!=='Native analyzer unchanged; observation only'||! /^[a-f0-9]{64}$/.test(decode.nativeAnalyzerSourceSha256)||!Number.isInteger(decode.maxSpeechTokens)||decode.maxSpeechTokens<250||decode.maxSpeechTokens>1000||!Number.isInteger(decode.generatedSpeechTokens)||decode.generatedSpeechTokens<1||decode.generatedSpeechTokens>decode.maxSpeechTokens)return false;
 if(!Number.isInteger(decode.eosSuppressionObservedSteps)||!Number.isInteger(decode.modelEosRestoredSteps)||decode.modelEosRestoredSteps!==0||!Number.isInteger(decode.temporaryAnalyzerHooksRemoved)||decode.temporaryAnalyzerHooksRemoved<0||!Number.isInteger(decode.attentionHooksBefore)||!Number.isInteger(decode.attentionHooksAfter)||decode.attentionHooksBefore!==decode.attentionHooksAfter)return false;
 if(!Array.isArray(trace.steps)||trace.steps.length<1||trace.steps.some((row,index)=>row.step!==index+1||typeof row.completeBefore!=='boolean'||typeof row.completeAfter!=='boolean'||typeof row.nativeEosSuppressed!=='boolean'||typeof row.analyzerForcedEos!=='boolean'||row.modelEosRestored!==false||!Number.isInteger(row.textPosition)||!Number.isInteger(row.textTokenCount)||!Number.isFinite(row.modelEosLogit)||!Number.isFinite(row.nativeEosLogit)||row.nativeEosSuppressed!==(row.nativeEosLogit===-(2**15))||row.analyzerForcedEos!==(row.nativeEosLogit===2**15)))return false;
 if(trace.steps.some((row,index)=>index>0&&row.completeBefore!==trace.steps[index-1].completeAfter))return false;
 const suppressionCount=trace.steps.filter(row=>row.nativeEosSuppressed).length,restoredCount=trace.steps.filter(row=>row.modelEosRestored).length,final=trace.steps.at(-1),expectedKind=decode.eosReached?(final.analyzerForcedEos?'analyzer-forced':'model-sampled'):'budget-exhausted';
 if(decode.eosSuppressionObservedSteps!==suppressionCount||decode.modelEosRestoredSteps!==restoredCount||decode.eosKind!==expectedKind)return false;
 const firstComplete=trace.steps.find(row=>row.completeAfter)?.step??null;if(decode.alignmentFirstCompletedStep!==firstComplete)return false;
 return true;
}// ROOT-only post-run collector: verifies sealed phase terminals and the
// producer's private ledgers/receipts, then returns public-safe proposals.
// It never publishes files or promotes held candidates.
export function collectPolice12PrivateManifestProposals(cast,authorityProof,terminalProofs,selectionProof,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Police finite authority changed');
 const authority=json(authorityProof.path),authored=policeDialogueSources(cast,sourceRoot),sourceSha256=Object.fromEntries(['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'].map(path=>[path,hash(resolve(sourceRoot,path))]));
 requireMatch(authority.status==='ROOT_SEALED_FINITE_POLICE12'&&authority.executor==='ROOT_ONLY'&&authority.grantId&&authority.sourceHead==='6213f6429cc0ccdb64353f2729bfb732ec757a80'&&authority.adapterSha256==='7b6e10479e6d050549d093e531d4aed86694ea51febfa3486611bccc862c2687'&&authority.maximumNativeCalls===12&&authority.maximumCallsPerClip===1&&authority.maximumAsrReadings===24&&authority.automaticRetries===0&&authority.rendererDevice==='cuda'&&authority.rendererPrecision==='fp16'&&authority.referenceConditioningPrecision==='float32'&&authority.rendererCpuThreads===2&&authority.observeEos===true&&authority.asrDevice==='cpu'&&authority.asrComputeType==='int8'&&authority.asrThreads===1&&authority.asrLanguage==='de'&&authority.asrScriptPrompt===null&&sameJson(authority.asrBeamSizes,[1,5]),'Not the exact finite police grant/recipe');
 requireMatch(sameJson(authority.sourcePins,sourceSha256)&&hash(authority.requestPath)===authority.requestSha256,'Police request/source pins changed');
 const request=json(authority.requestPath);requireMatch(request.family==='police-dialogue'&&request.privateReviewFamily===authority.privateReviewFamily&&request.publicAssetFamily==='assets/voices/police-dialogue'&&request.jobs.length===12&&sameJson(request.sourcePins,sourceSha256),'Police authored request changed');
 const planRows=new Map(authored.map(row=>[row.clipId,row]));for(const job of request.jobs)requireMatch(planRows.has(job.clipId)&&Object.entries(planRows.get(job.clipId)).every(([key,value])=>sameJson(job[key],value)),'Police request differs from authored source/profile/captions');
 const family=resolve(authority.musicRoot,authority.privateReviewFamily),privateRoot=resolve(family,authority.voiceId);requireMatch(realpathSync(family)===family&&realpathSync(privateRoot)===privateRoot&&privateRoot.startsWith(family+sep),'Police private root aliases or escapes its exact family');
 const privateFile=relative=>{const path=resolve(privateRoot,relative);requireMatch(path.startsWith(privateRoot+sep)&&existsSync(path)&&!lstatSync(path).isSymbolicLink()&&realpathSync(path)===path,'Police private receipt/media alias or missing file');return path;};
 const requestPath=privateFile('requests.json'),privateRequest=json(requestPath);const frozenRequestSha256=hash(requestPath);requireMatch(privateRequest.authoredPlanSha256===authority.requestSha256&&sameJson(privateRequest.authoredPlanSourceSha256,sourceSha256)&&sameJson(privateRequest.jobs,request.jobs),'Frozen police request bytes/source differ from sealed plan');
 const terminals={},terminalHashes={};for(const phase of ['plan','render','process']){const proof=terminalProofs?.[phase];requireMatch(proof?.sha256===hash(proof.path),'Missing/changed police terminal '+phase);const terminal=json(proof.path);requireMatch(terminal.phase===phase&&terminal.specificationSha256===authorityProof.sha256&&terminal.producerSha256===authority.adapterSha256&&terminal.authoredPlanSha256===authority.requestSha256&&terminal.frozenRequestSha256===frozenRequestSha256&&terminal.requestSha256===frozenRequestSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&!terminal.supervisorError&&terminal.logsComplete===true&&Array.isArray(terminal.survivingOwnedChildren)&&terminal.survivingOwnedChildren.length===0&&Array.isArray(terminal.ownedCleanupKills)&&terminal.ownedCleanupKills.length===0&&Array.isArray(terminal.postflightPinFailures)&&terminal.postflightPinFailures.length===0&&Array.isArray(terminal.postflightSourceMirrorPinFailures)&&terminal.postflightSourceMirrorPinFailures.length===0&&terminal.postflightProtectedPinsChecked===authority.expectedPublicPinCount&&Array.isArray(terminal.postflightPrivatePinFailures)&&terminal.postflightPrivatePinFailures.length===0&&terminal.postflightProtectedPrivatePinsChecked===authority.expectedPrivatePinCount,'Police phase terminal did not pass bounded retirement/pin checks: '+phase);terminalHashes[phase]=proof.sha256;terminals[phase]={sha256:proof.sha256,exitCode:terminal.exitCode,rootRetired:true,timedOut:false};}
 const nativeLedgerPath=privateFile('police-native-call-ledger.json'),nativeLedger=json(nativeLedgerPath),ids=request.jobs.map(row=>row.clipId);requireMatch(nativeLedger.requestSha256===frozenRequestSha256&&sameJson([...nativeLedger.chargedClipIds].sort(),[...ids].sort())&&new Set(nativeLedger.chargedClipIds).size===12,'Police native call ledger must account for twelve unique one-shot calls');
 const asrLedgerPath=resolve(privateRoot,'police-asr-read-ledger.json'),hasAsrLedger=existsSync(asrLedgerPath);if(hasAsrLedger)requireMatch(!lstatSync(asrLedgerPath).isSymbolicLink()&&realpathSync(asrLedgerPath)===asrLedgerPath,'Police ASR ledger alias');const asrLedger=hasAsrLedger?json(asrLedgerPath):{requestSha256:frozenRequestSha256,chargedReadings:[]},asrKeys=asrLedger.chargedReadings.map(row=>`${row.clipId}\0${row.beamSize}`);requireMatch(asrLedger.requestSha256===frozenRequestSha256&&asrLedger.chargedReadings.length<=24&&new Set(asrKeys).size===asrKeys.length&&asrLedger.chargedReadings.every(row=>ids.includes(row.clipId)&&[1,5].includes(row.beamSize)),'Police ASR ledger has duplicate/foreign/over-cap readings');
 const selection=selectionProof?json(selectionProof.path):null;if(selectionProof)requireMatch(selectionProof.sha256===hash(selectionProof.path)&&selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&selection.instruction?.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&Array.isArray(selection.clips),'Police clip/hash selection must trace the existing user instruction');
 const selected=new Map((selection?.clips||[]).map(row=>[row.clipId,row.encodedSha256]));requireMatch(selected.size===(selection?.clips||[]).length&&[...selected].every(([id,sha256])=>ids.includes(id)&&/^[a-f0-9]{64}$/.test(sha256)),'Police selection has duplicate/foreign clip IDs or invalid hashes');
 const clips=[],heldPrivate=[],takes={};let generatedLineCount=0;
 for(const job of request.jobs){const producerIndex=request.jobs.indexOf(job),expectedRendererInput=job.text.replace(/\bA38\b/g,'A achtunddreißig').replace(/§/g,'Paragraph '),expectedRendererInputBasis=expectedRendererInput===job.text?'exact authored source':'German letter-number spoken equivalent';const rawPath=resolve(privateRoot,'raw',`${job.clipId}.json`);if(!existsSync(rawPath)){heldPrivate.push({...job,reason:'held private; native attempt produced no completed raw receipt'});continue;}requireMatch(!lstatSync(rawPath).isSymbolicLink()&&realpathSync(rawPath)===rawPath,'Police raw receipt alias');generatedLineCount++;const raw=json(rawPath),wavPath=privateFile(`raw/${job.clipId}.wav`),tracePath=privateFile(`raw/${job.clipId}-eos-trace.json`),trace=json(tracePath),synthesis=raw.synthesis;requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.requestSha256===frozenRequestSha256&&raw.authoringHelperSha256===authority.adapterSha256&&raw.seed===71000+producerIndex&&raw.synthesisAttempt===1&&raw.rendererInputText===expectedRendererInput&&raw.rendererInputBasis===expectedRendererInputBasis&&raw.profileJsonSha256===authority.profileMetadataSha256&&raw.referenceSha256===job.referenceSha256&&raw.referenceOriginalSha256===job.referenceOriginalSha256&&raw.renderer==='ResembleAI/Chatterbox Multilingual V2 0.1.7'&&raw.modelRevision==='5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'&&synthesis?.device==='cuda'&&synthesis.precision==='fp16'&&synthesis.t3WeightPrecision==='float16'&&synthesis.conditioningPrecision==='float32'&&synthesis.autocastPrecision==='float16'&&synthesis.conditioningCached===true&&synthesis.referenceReconditionedForProfile===authority.profileId&&synthesis.referenceConditioningVerifiedFloat32===true&&synthesis.cpuThreads===2&&synthesis.inferenceMode===true&&synthesis.exaggeration===.5&&synthesis.temperature===.65&&synthesis.repetitionPenalty===3&&synthesis.cfgWeight===.6&&synthesis.languageId==='de'&&raw.decode?.eosTraceSha256===hash(tracePath)&&trace.clipId===job.clipId&&trace.text===job.text&&trace.profileId===authority.profileId&&trace.referenceSha256===job.referenceSha256&&trace.modelRevision===authority.modelRevision&&policeEosTraceAuthority(raw.decode,trace)&&hash(wavPath)===raw.rawSha256,'Police raw take/request/profile/renderer/EOS trace bytes changed');if(raw.decode.eosReached!==true){heldPrivate.push({...job,reason:'held private; raw take did not reach native EOS'});continue;}
  const encodedReceiptPath=resolve(privateRoot,'encoded',`${job.clipId}.json`),encodedAudioPath=resolve(privateRoot,'encoded',`${job.clipId}.mp3`);if(!existsSync(encodedReceiptPath)||!existsSync(encodedAudioPath)){heldPrivate.push({...job,reason:'held private; native EOS or final encoding/ASR eligibility not established'});continue;}
  requireMatch(!lstatSync(encodedReceiptPath).isSymbolicLink()&&!lstatSync(encodedAudioPath).isSymbolicLink()&&realpathSync(encodedReceiptPath)===encodedReceiptPath&&realpathSync(encodedAudioPath)===encodedAudioPath,'Police encoded receipt/audio alias');const encoded=json(encodedReceiptPath);
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&encoded.requestSha256===frozenRequestSha256&&encoded.authoringHelperSha256===raw.authoringHelperSha256&&encoded.seed===raw.seed&&encoded.synthesisAttempt===raw.synthesisAttempt&&encoded.rendererInputText===raw.rendererInputText&&encoded.rendererInputBasis===raw.rendererInputBasis&&encoded.profileJsonSha256===authority.profileMetadataSha256&&encoded.rawSha256===raw.rawSha256&&sameJson(encoded.decode,raw.decode)&&sameJson(encoded.synthesis,raw.synthesis)&&hash(encodedAudioPath)===encoded.sha256&&readFileSync(encodedAudioPath).length===encoded.bytes,'Police encoded receipt/raw lineage/EOS/audio bytes changed');if(encoded.decode?.eosReached!==true){heldPrivate.push({...job,reason:'held private; encoded take does not preserve verified native EOS'});continue;}
  const readingRows=asrLedger.chargedReadings.filter(row=>row.clipId===job.clipId).map(row=>row.beamSize),encodedBeams=encoded.asrReadings.map(row=>row.beamSize);requireMatch(sameJson(readingRows,encodedBeams)&&(sameJson(readingRows,[])||sameJson(readingRows,[1])||sameJson(readingRows,[1,5]))&&encoded.asrReadings.every(row=>typeof row.transcript==='string'&&row.transcript.trim())&&(!readingRows.length||encoded.asrBeamSize===readingRows.at(-1)&&encoded.asr===encoded.asrReadings.at(-1).transcript)&&encoded.asrDevice==='cpu'&&encoded.asrComputeType==='int8'&&encoded.asrCpuThreads===1&&encoded.asrLanguageId==='de'&&encoded.asrScriptPrompt===null&&encoded.asrModelSha256===authority.asrModelSha256&&['int8','int8_float32'].includes(encoded.asrEffectiveComputeType),'Police ASR receipt settings/readings differ from durable one-shot ledger');
  const proof={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedReceiptPath),rawSha256:raw.rawSha256,encodedSha256:encoded.sha256,profileJsonSha256:raw.profileJsonSha256};const approvedHash=selected.get(job.clipId);
  if(!readingRows.length||!spokenWords(job.text)||spokenWords(job.text)!==spokenWords(encoded.asr)||encoded.asrLiteralWordExact!==true){heldPrivate.push({...job,reason:'held private; no literal exact German ASR transcript established',candidateSha256:encoded.sha256});continue;}
  if(approvedHash!==encoded.sha256){heldPrivate.push({...job,reason:'technically verified; not selected for fixed playback',candidateSha256:encoded.sha256});continue;}
  const clip={...encoded,approval:{status:'user-approved',scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256}};fixedTakeAuthority(cast,clip);requireMatch(clip.decode?.eosReached===true&&clip.asrLiteralWordExact===true&&clip.asrWordExact===true&&clip.asrDevice==='cpu'&&clip.asrCpuThreads===1&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null&&clip.asrModelSha256===authority.asrModelSha256&&clip.asrComputeType==='int8'&&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&clip.asrBeamSize===encodedBeams.at(-1)&&clip.asr===clip.asrReadings.at(-1).transcript,'Selected police take is not literal German EOS final ASR');clips.push(clip);takes[job.clipId]=proof;
 }
 const manifest={schemaVersion:1,voiceId:authority.voiceId,profileId:authority.profileId,fallback:'captions',status:'selected clips passed same-profile literal German ASR and native EOS; held slots remain caption fallback; perceptual listening not independently verified',requestedLineCount:12,generatedLineCount,lineCount:clips.length,clips,heldPrivate,approvedExistingReuse:[],policeAdmission:{status:'ROOT-verified-native-police12',authoritySha256:authorityProof.sha256,authoredPlanSha256:authority.requestSha256,frozenRequestSha256,requestSha256:frozenRequestSha256,sourceHead:authority.sourceHead,sourcePins:{...sourceSha256},terminals,nativeLedgerSha256:hash(nativeLedgerPath),asrLedgerSha256:hasAsrLedger?hash(asrLedgerPath):null,takes}};
 policeManifestAuthority(cast,manifest,sourceRoot);return {status:'private police proposal only; no public copy/catalog sync',authoritySha256:authorityProof.sha256,terminalHashes,counts:{requested:12,generated:generatedLineCount,selected:clips.length,held:heldPrivate.length},manifest};
}

// Revalidates the exact private receipts before installing selected files.
// All checks happen before the first write; created files are rolled back if
// the manifest/catalog transaction fails.
export function admitPolice12PrivateProposals(cast,authorityProof,terminalProofs,selectionProof,sourceRoot=root,destinationRoot=root,commitIo={}){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Police finite authority changed before admission');const authority=json(authorityProof.path),source=realpathSync(sourceRoot),destination=realpathSync(destinationRoot),familyPath=resolve(authority.musicRoot,authority.privateReviewFamily),family=realpathSync(familyPath);requireMatch(family===familyPath,'Police private family path aliases');const privatePath=resolve(family,authority.voiceId),privateRoot=realpathSync(privatePath);requireMatch(privateRoot===privatePath,'Police private actor path aliases');
 const pathKey=path=>process.platform==='win32'?path.toLocaleLowerCase('en-US'):path,nested=(child,parent)=>{child=pathKey(child);parent=pathKey(parent);return child===parent||child.startsWith(parent.endsWith(sep)?parent:parent+sep)};
 for(const [a,b] of [[source,destination],[source,family],[source,privateRoot],[destination,family],[destination,privateRoot]])requireMatch(!nested(a,b)&&!nested(b,a),'Police source, destination, and private roots must be separate');
 const collected=collectPolice12PrivateManifestProposals(cast,authorityProof,terminalProofs,selectionProof,source),manifest=collected.manifest;
 requireMatch(manifest.clips.length>0,'Police admission requires at least one exact selected recording');
 const directory=resolve(destination,'assets/voices/police-dialogue'),voicesRoot=realpathSync(resolve(destination,'assets/voices'));
 requireMatch(voicesRoot.startsWith(destination+sep),'Police asset parent escapes destination');
 if(existsSync(directory))requireMatch(!lstatSync(directory).isSymbolicLink()&&realpathSync(directory).startsWith(voicesRoot+sep),'Linked police asset directory');
 const relative='assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json',manifestPath=resolve(destination,relative),manifestTemporary=manifestPath+'.police-admit.tmp',catalogPath=resolve(destination,'For-AI/AUDIO-TEXT-LIBRARY.js'),catalogSource=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n'),catalogTemporary=catalogPath+'.police-admit.tmp';
 requireMatch(!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1&&!existsSync(catalogTemporary),'Linked catalog or occupied police admission temporary file');
 const admissions=policeAdmissions(catalogSource),priorText=existsSync(manifestPath)?readFileSync(manifestPath,'utf8'):null;
 if(priorText!==null){requireMatch(admissions[relative]===textHash(priorText),'Existing police manifest lacks its exact admission anchor');const prior=JSON.parse(priorText),current=new Map(manifest.clips.map(row=>[row.clipId,row.sha256]));policeManifestAuthority(cast,prior,destination);requireMatch(prior.clips.every(row=>current.get(row.clipId)===row.sha256),'Police admission cannot replace or discard a prior selected take');}
 const bytes=JSON.stringify(manifest,null,2)+'\n';admissions[relative]=textHash(bytes);const anchor='const policeAdmissionReceipts=Object.freeze('+JSON.stringify(admissions)+');\n';
 const nextCatalog=catalogSource.match(policeAdmissionPattern)?catalogSource.replace(policeAdmissionPattern,()=>anchor):catalogSource.replace('const recordings=Object.freeze({',()=>anchor+'const recordings=Object.freeze({');
 requireMatch(nextCatalog.includes(anchor),'Missing police admission anchor');
 for(const clip of manifest.clips){const target=resolve(destination,clip.file),rootPrefix=resolve(destination,'assets/voices/police-dialogue')+sep;requireMatch(target.startsWith(rootPrefix),'Police audio path escapes owned family');if(existsSync(target))requireMatch(!lstatSync(target).isSymbolicLink()&&lstatSync(target).nlink===1&&hash(target)===clip.sha256,'Police admission refuses to replace a different/linked recording');}
 requireMatch(!existsSync(manifestTemporary),'Occupied police manifest temporary file');if(existsSync(manifestPath))requireMatch(!lstatSync(manifestPath).isSymbolicLink()&&lstatSync(manifestPath).nlink===1,'Linked police manifest');
 mkdirSync(directory,{recursive:true});const created=[];let manifestInstalled=false,copyBytes=commitIo.copyFileSync||copyFileSync,writeBytes=commitIo.writeFileSync||writeFileSync,rename=commitIo.renameSync||renameSync,unlink=commitIo.unlinkSync||unlinkSync;
 try{
  for(const clip of manifest.clips){const target=resolve(destination,clip.file);if(!existsSync(target)){created.push(target);copyBytes(resolve(privateRoot,'encoded',clip.clipId+'.mp3'),target,constants.COPYFILE_EXCL);}requireMatch(hash(target)===clip.sha256,'Installed police audio hash drift');}
  policeRecordingsBlock(cast,[{...manifest,provenanceManifest:relative,provenanceManifestSha256:textHash(bytes)}],destination,destination);
  created.push(manifestTemporary);writeBytes(manifestTemporary,bytes,{flag:'wx'});rename(manifestTemporary,manifestPath);manifestInstalled=true;
  requireMatch(readFileSync(manifestPath,'utf8')===bytes,'Installed police manifest bytes drift');
  if(nextCatalog!==catalogSource){requireMatch(readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n')===catalogSource,'Catalog changed during police admission');created.push(catalogTemporary);writeBytes(catalogTemporary,nextCatalog,{flag:'wx'});rename(catalogTemporary,catalogPath);}
 }catch(error){if(manifestInstalled){if(priorText===null)unlink(manifestPath);else{writeBytes(manifestTemporary,priorText,{flag:'wx'});rename(manifestTemporary,manifestPath);}}for(const file of created.reverse())if(existsSync(file))unlink(file);throw error;}
 return {voiceId:manifest.voiceId,accepted:manifest.clips.length,held:manifest.heldPrivate.length,manifest:manifestPath,admissionAnchor:textHash(bytes),listening:'NOT RUN'};
}

const voiceGapProducerSha256='19e5bd4af9c9ea5390987c1331a7e33ded02f435d3638965e43055869cb7a7f9',voiceGapAdapterSha256='070c53649af8d5946e431a55b12018ad6791fe5b73047295dfb16800dbd404f5';
const voiceGapConfigs=Object.freeze({
 'police-dialogue':{privateFamily:'GS-p8-v1',voiceId:'polizei-heinrich-wachtmeister',count:8,attempt:2,assetFamily:'police-dialogue',manifest:'polizei-heinrich-wachtmeister-gap-manifest.json'},
 'traffic-dialogue':{privateFamily:'GS-t4-v1',voiceId:'verkehr-dieter-hupfer',count:4,attempt:1,assetFamily:'traffic-dialogue',manifest:'verkehr-dieter-hupfer-gap-manifest.json'}
});
const voiceGapFrozenSourcePins={"game.js":"2e0b82b73ab2c23d4922d28650edda6ebff730c88d0f1400348b1317e3339cf5","For-AI/VOICE-CAST.json":"8f30c7f7f61396d9462b61affc9d2aa116218d1023d04a6b191634e2f44a134f","For-AI/AUDIO-TEXT-LIBRARY.js":"267388a27742baa2ed1be1515d5fb5095e4618c32f357541912336e2c1bc9980"};
const voiceGapPublicTakeFields=["originalRawReferenceLicense","referenceLicenseResolution","processingHelperSha256","processingAdapterSha256","recoveryProofSha256","clipId", "voiceId", "actorId", "region", "slot", "sourceLocator", "text", "english", "profileId", "referenceSha256", "referenceOriginalSha256", "renderer", "modelRevision", "processing", "seed", "synthesisAttempt", "authoringHelperSha256", "rendererInputText", "decode", "rendererInputBasis", "requestSha256", "profileJsonSha256", "rawSha256", "modelLicense", "referenceLicense", "durationSeconds", "renderSeconds", "synthesis", "listening", "status", "processingSha256", "normalization", "integratedLufs", "truePeakDbtp", "asr", "asrWordExact", "asrLiteralWordExact", "asrNormalization", "asrModel", "asrCpuThreads", "asrDevice", "asrEffectiveComputeType", "asrLanguageId", "asrComputeType", "asrScriptPrompt", "asrBeamSize", "asrReadings", "asrModelSha256", "asrModelDirectoryName", "wordCues", "sha256", "bytes", "sampleRateHz", "channels", "bitrateBitsPerSecond"];
const voiceGapAdmissionPattern=/const voiceGapAdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);\n/;
const voiceGapBlockPattern=/const voiceGapRecordings=Object\.freeze\([^\n]*\);\n/;
function voiceGapAdmissions(source){return JSON.parse(source.match(voiceGapAdmissionPattern)?.[1]||'{}')}

export function voiceGapSources(cast,family,sourceRoot=root){
 const config=voiceGapConfigs[family];requireMatch(config,'Unknown typed voice-gap family');
 if(family==='police-dialogue'){
  const ids=new Set(['berlin-01','berlin-02','berlin-03','berlin-04','berlin-06','germany-01','germany-02','germany-04'].map(key=>config.voiceId+'-'+key));
  return policeDialogueSources(cast,sourceRoot).filter(row=>ids.has(row.clipId));
 }
 const source=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),window={};vm.runInNewContext(readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),{window});
 requireMatch(source.match(/function shoutTrafficDriver\(car\)[^\n]*candidateVoiceId:"([a-z0-9-]+)"/)?.[1]===config.voiceId,'Traffic trigger lost its selected owner');
 const binding=cast.productionVoices[config.voiceId];requireMatch(binding?.profileId==='093079ce208a4f7e8f0d50bb5170ea1f','Traffic profile changed');
 return ['berlin','germany'].flatMap(region=>[0,1].map(slot=>{
  const clipId=`traffic-${region}-${String(slot+1).padStart(2,'0')}`,clip=window.GermanySimulatorAudioText.clips[clipId];
  requireMatch(clip?.text&&clip.english,'Missing exact traffic transcript/subtitle');
  return {clipId,voiceId:config.voiceId,actorId:'traffic-driver',region,slot,sourceLocator:`For-AI/AUDIO-TEXT-LIBRARY.js clips["${clipId}"].text`,text:clip.text,english:clip.english,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null};
 }));
}

const retainedCompoundAuthorities=Object.freeze({"traffic-germany-01":{"family":"traffic-dialogue","clipId":"traffic-germany-01","voiceId":"verkehr-dieter-hupfer","actorId":"traffic-driver","region":"germany","slot":0,"sourceLocator":"For-AI/AUDIO-TEXT-LIBRARY.js clips[\"traffic-germany-01\"].text","text":"Augen auf, du Vollpfosten!","english":"Open your eyes, you complete moron!","profileId":"093079ce208a4f7e8f0d50bb5170ea1f","referenceSha256":"b21959ef323483ad5c5eadcaf1ecdabe74b312d9ec9997a422ae21a8dfdbdbdd","referenceOriginalSha256":"9e1b68ae4440101bb804763ce1737498ff3ea22ee570eca151e122286e664bfc","renderer":"ResembleAI/Chatterbox Multilingual V2 0.1.7","modelRevision":"5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18","processing":null,"authoringHelperSha256":"19e5bd4af9c9ea5390987c1331a7e33ded02f435d3638965e43055869cb7a7f9","encodedSha256":"2d642c90f6b425868dd0fa747a29ccc9011bbddd8a1a2e1e6fdba12bea0a7fa7","encodedReceiptSha256":"5cef48046c1440d5ffd6a018d5d16acd6e9b64c90d25791e98e268169dfa5c43","rawReceiptSha256":"6b3e438e8c2c861e04736fd12acdd89650830ff551beece5b42a016ebaedeb2b","rawSha256":"04ae259102c86cef8eefafe363cfbba4eb91d7e993922f1ddadf183b52e13066","requestSha256":"a86677d4574481c1e4ea3edd37832148d41ca9b215e5b269a13e34a97dfad324","profileJsonSha256":"bfbafb2660d5b94b2bb0ecd8ed618199257e599549d61a95dfe43997f10026e2","synthesisAttempt":1,"seed":71002,"durationSeconds":3.04,"selectedReadingIndex":0,"selectedBeamSize":1,"selectedReadingSha256":"98d941225ae19d0f0658a34c8d6b4db7debccc866af457c66311c6df5d9f89dc","selectedWordArraySha256":"3c903ba01e22a643bd841f905cb8371163597affea3083d4fe236a22e1984ca9","sourcePins":{"game.js":"2e0b82b73ab2c23d4922d28650edda6ebff730c88d0f1400348b1317e3339cf5","For-AI/VOICE-CAST.json":"8f30c7f7f61396d9462b61affc9d2aa116218d1023d04a6b191634e2f44a134f","For-AI/AUDIO-TEXT-LIBRARY.js":"267388a27742baa2ed1be1515d5fb5095e4618c32f357541912336e2c1bc9980"}},"polizei-heinrich-wachtmeister-germany-01":{"family":"police-dialogue","clipId":"polizei-heinrich-wachtmeister-germany-01","voiceId":"polizei-heinrich-wachtmeister","actorId":"police","region":"germany","slot":0,"sourceLocator":"game.js policeBarks.germany[0]","text":"HALT! STEHENBLEIBEN!","english":"Stop! Stop immediately!","profileId":"24b741bbe55d4f3a843aa481c3459a96","referenceSha256":"abd1b50a64b82e4ec6ff903c4d286094fb9cbca2f756a1b35e45f6b455729ee7","referenceOriginalSha256":"718d21fd8dc250521a21882f86795cf8652845df7c128e655c0e2e771ac3207e","renderer":"ResembleAI/Chatterbox Multilingual V2 0.1.7","modelRevision":"5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18","processing":null,"authoringHelperSha256":"19e5bd4af9c9ea5390987c1331a7e33ded02f435d3638965e43055869cb7a7f9","encodedSha256":"c8c325e24a12658ababd99246f5ebcb57d07be9e8c969c92b8f0dae514c8277d","encodedReceiptSha256":"e3799c96387e1abff03d896dd16b65504db55eb819d0e512f1d2beb72d312005","rawReceiptSha256":"2d72f629bd08003551b40aa6e69490a1c64a12cb7302cf2530a90211f17bfd03","rawSha256":"f7df70b5aa541eff9a8f9c3adf6a17134e25d1818a673dbd41dad87dbbc53545","requestSha256":"e27cbf36f6d1aeb0ef039ab62622832df955f88a723c1349ba945888be47e297","profileJsonSha256":"d707598529a3bbd1774ee2364dde64d25dc3281555f03181b18d750bd4bef2cf","synthesisAttempt":2,"seed":171005,"durationSeconds":2.8,"selectedReadingIndex":0,"selectedBeamSize":1,"selectedReadingSha256":"250ee98bf68a99349cc18d75c8f264d27a9bd328a9efdfd37b4d96121ed8a675","selectedWordArraySha256":"9bd1cfa32d85ea5c2632e312217dffc106b0ec482e7b82024c57a04f38ee93c4","sourcePins":{"game.js":"2e0b82b73ab2c23d4922d28650edda6ebff730c88d0f1400348b1317e3339cf5","For-AI/VOICE-CAST.json":"8f30c7f7f61396d9462b61affc9d2aa116218d1023d04a6b191634e2f44a134f","For-AI/AUDIO-TEXT-LIBRARY.js":"267388a27742baa2ed1be1515d5fb5095e4618c32f357541912336e2c1bc9980"}}});
const retainedCompoundIds=Object.freeze({'traffic-germany-01':'traffic-dialogue','polizei-heinrich-wachtmeister-germany-01':'police-dialogue'});
export function alignRetainedSourceWords(text,reading,duration){
 const source=typeof text==='string'?[...text.matchAll(/[\p{L}\p{N}_]+/gu)]:[],words=reading?.words;
 requireMatch(source.length>0&&Array.isArray(words)&&words.length>0&&Number.isFinite(duration)&&duration>0,'Missing retained source/timing');
 const heard=[];let previousEnd=0;
 for(const word of words){
  const tokens=typeof word?.word==='string'?[...word.word.matchAll(/[\p{L}\p{N}_]+/gu)]:[];
  requireMatch(tokens.length===1&&Number.isFinite(word.start)&&Number.isFinite(word.end)&&word.start>=previousEnd&&word.end>word.start&&word.end<=duration,'Invalid retained observed word/timing');
  heard.push(tokens[0][0].toLowerCase());previousEnd=word.end;
 }
 const transcript=typeof reading.transcript==='string'?[...reading.transcript.matchAll(/[\p{L}\p{N}_]+/gu)].map(word=>word[0].toLowerCase()):[];
 requireMatch(sameJson(transcript,heard),'Retained timed words differ from selected transcript');
 const mapping=[],wordCues=[];let cursor=0;
 for(const word of source){
  const first=cursor,expected=word[0].toLowerCase();let observed='';
  while(cursor<heard.length&&observed!==expected){
   if(cursor>first)requireMatch(words[cursor].start===words[cursor-1].end,'Gap inside retained compound');
   observed+=heard[cursor];requireMatch(expected.startsWith(observed),'Changed retained word or one observed word spans source words');cursor++;
  }
  requireMatch(observed===expected&&cursor>first,'Incomplete retained source word');
  mapping.push({sourceWordIndex:mapping.length,observedStart:first,observedEndExclusive:cursor});
  wordCues.push({at:words[first].start,end:words[cursor-1].end,charIndex:word.index,word:word[0]});
 }
 requireMatch(cursor===words.length,'Extra retained observed words');return {mapping,wordCues};
}
export function verifiedRetainedCompoundCues(clip,take,requestSha256){
 const supplement=take?.retainedSourceWordAlignment;if(supplement===undefined)return null;
 const family=Object.hasOwn(retainedCompoundIds,clip.clipId)?retainedCompoundIds[clip.clipId]:null;
 const authority=Object.hasOwn(retainedCompoundAuthorities,clip.clipId)?retainedCompoundAuthorities[clip.clipId]:null;
 requireMatch(family&&authority,'Retained compound authority is not sealed');
 requireMatch(clip.asrWordExact===true&&clip.asrLiteralWordExact===false&&Array.isArray(clip.wordCues)&&clip.wordCues.length===0,'Retained original flags/cues changed');
 requireMatch(typeof supplement?.text==='string'&&supplement.sha256===textHash(supplement.text),'Changed retained alignment snapshot');
 const readingIndex=clip.asrReadings?.length-1,reading=clip.asrReadings?.[readingIndex];
 requireMatch(reading&&Array.isArray(reading.words)&&reading.words.length>0&&readingIndex>=0&&reading.beamSize===clip.asrBeamSize&&reading.transcript===clip.asr,'Retained selected reading changed');
 const bindings={family,clipId:clip.clipId,voiceId:clip.voiceId,actorId:clip.actorId,region:clip.region,slot:clip.slot,sourceLocator:clip.sourceLocator,text:clip.text,english:clip.english,profileId:clip.profileId,referenceSha256:clip.referenceSha256,referenceOriginalSha256:clip.referenceOriginalSha256,renderer:clip.renderer,modelRevision:clip.modelRevision,processing:clip.processing??null,authoringHelperSha256:clip.authoringHelperSha256,encodedSha256:clip.sha256,encodedReceiptSha256:take.encodedReceiptSha256,rawReceiptSha256:take.rawReceiptSha256,rawSha256:clip.rawSha256,requestSha256,profileJsonSha256:clip.profileJsonSha256,synthesisAttempt:clip.synthesisAttempt,seed:clip.seed,durationSeconds:clip.durationSeconds,selectedReadingIndex:readingIndex,selectedBeamSize:reading.beamSize,selectedReadingSha256:textHash(JSON.stringify(reading)),selectedWordArraySha256:textHash(JSON.stringify(reading.words)),sourcePins:voiceGapFrozenSourcePins};
 requireMatch(clip.requestSha256===requestSha256&&take.encodedSha256===clip.sha256&&take.rawSha256===clip.rawSha256&&take.profileJsonSha256===clip.profileJsonSha256,'Retained receipt/request lineage changed');
 requireMatch(sameJson(Object.keys(authority).sort(),Object.keys(bindings).sort())&&Object.entries(bindings).every(([key,value])=>sameJson(authority[key],value)),'Foreign or stale retained alignment authority');
 const aligned=alignRetainedSourceWords(clip.text,reading,clip.durationSeconds);
 requireMatch(aligned.mapping.some(row=>row.observedEndExclusive-row.observedStart>1),'Retained proof has no compound grouping');
 const expected={kind:'voice-gap-retained-source-word-alignment-v1',ruleRevision:'ordered-adjacent-measured-tokens-to-one-source-word-v1',bindings,...aligned};
 requireMatch(sameJson(JSON.parse(supplement.text),expected),'Retained alignment payload differs from independent recomputation');return aligned.wordCues;
}
function voiceGapClipAuthority(cast,clip,config,take=null,requestSha256=null){
 fixedTakeAuthority(cast,clip);const aligned=verifiedRetainedCompoundCues(clip,take,requestSha256),wordCues=aligned??clip.wordCues;crowdExactCues({...clip,wordCues});
 const beams=clip.asrReadings?.map(row=>row.beamSize);
 requireMatch(clip.voiceId===config.voiceId&&clip.synthesisAttempt===config.attempt&&clip.authoringHelperSha256===voiceGapProducerSha256
  &&clip.rendererInputText===clip.text&&clip.decode?.eosReached===true&&(clip.asrLiteralWordExact===true||aligned!==null)
  &&clip.asrDevice==='cpu'&&clip.asrComputeType==='int8'&&clip.asrCpuThreads===1&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null
  &&clip.asrModelSha256==='e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da'
  &&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&(sameJson(beams,[1])||sameJson(beams,[1,5]))
  &&clip.asrBeamSize===beams.at(-1)&&clip.asr===clip.asrReadings.at(-1).transcript
  &&clip.approval?.status==='user-approved'&&clip.approval.scope==='whole-game-fixed-voice-cloning'
  &&clip.approval.clipId===clip.clipId&&clip.approval.encodedSha256===clip.sha256,'Voice-gap take lacks exact owned literal/aligned EOS/ASR/use proof');
 return wordCues;
}

export function voiceGapManifestAuthority(cast,manifest,sourceRoot=root){
 const config=voiceGapConfigs[manifest.family],proof=manifest.voiceGapAdmission;
 const trafficRecovered=Boolean(proof?.trafficLicenseRecovery);
 if(trafficRecovered){requireMatch(manifest.family==='traffic-dialogue','License recovery is traffic-only');verifyTrafficPublic(proof,trafficLicenseRecoveryExpected);}
 requireMatch(!manifest.clips.some(clip=>clip.recoveryProofSha256)&&!manifest.clips.some(clip=>clip.originalRawReferenceLicense)||trafficRecovered,'Resolved-license takes require preserved failed-render proof');
 requireMatch(config&&manifest.kind==='voice-gap12'&&manifest.voiceId===config.voiceId&&manifest.profileId===cast.productionVoices[config.voiceId].profileId
  &&manifest.requestedLineCount===config.count&&manifest.generatedLineCount===config.count&&manifest.lineCount===manifest.clips.length,'Typed gap manifest accounting changed');
 const jobs=new Map(voiceGapSources(cast,manifest.family,sourceRoot).map(row=>[row.clipId,row])),all=[...manifest.clips,...manifest.heldPrivate];
 requireMatch(all.length===config.count&&new Set(all.map(row=>row.clipId)).size===config.count&&all.every(row=>jobs.has(row.clipId)&&Object.entries(jobs.get(row.clipId)).every(([key,value])=>sameJson(row[key],value)))&&manifest.heldPrivate.every(row=>typeof row.reason==='string'&&row.reason.trim()),'Gap accepted/held owned slots changed');
 requireMatch(proof?.status==='ROOT-verified-finite-voice-gap12'&&proof.producerSha256===voiceGapProducerSha256&&proof.adapterSha256===voiceGapAdapterSha256
  &&sameJson(proof.sourcePins,voiceGapFrozenSourcePins)&&['authoritySha256','authoredPlanSha256','frozenRequestSha256','nativeLedgerSha256'].every(key=>/^[a-f0-9]{64}$/.test(proof[key]))
  &&sameJson(Object.keys(proof.terminals||{}).sort(),['plan','process','render'])&&Object.entries(proof.terminals).every(([phase,row])=>row.exitCode===(trafficRecovered&&phase==='render'?1:0)&&row.rootRetired===true&&row.timedOut===false&&/^[a-f0-9]{64}$/.test(row.sha256))
  &&(proof.asrLedgerSha256===null||/^[a-f0-9]{64}$/.test(proof.asrLedgerSha256)),'Missing typed gap finite phase/source proof');
 requireMatch(sameJson(Object.keys(proof.takes||{}).sort(),manifest.clips.map(row=>row.clipId).sort()),'Gap public receipt proof coverage changed');
 for(const clip of manifest.clips){
  const take=proof.takes[clip.clipId];voiceGapClipAuthority(cast,clip,config,take,proof.frozenRequestSha256);
  if(trafficRecovered)verifyTrafficEncodedLicense(clip,take?.rawReceiptSha256,trafficLicenseRecoveryExpected);
  requireMatch(clip.file===`assets/voices/${config.assetFamily}/${clip.clipId}.mp3`&&clip.requestSha256===proof.frozenRequestSha256&&clip.seed===71000+[...jobs.keys()].indexOf(clip.clipId)+(config.attempt-1)*100000
   &&['rawReceiptSha256','encodedReceiptSha256','rawSha256','encodedSha256','profileJsonSha256'].every(key=>/^[a-f0-9]{64}$/.test(take?.[key]))
   &&take.rawSha256===clip.rawSha256&&take.encodedSha256===clip.sha256&&take.profileJsonSha256===clip.profileJsonSha256,'Gap public take/hash lineage changed');
  if(config.attempt===2)requireMatch(take.priorSynthesisAttempt===1&&/^[a-f0-9]{64}$/.test(take.priorRawReceiptSha256),'Police next take lost historical take1 proof');
 }
 const continued=proof.terminals.render.continuation,processed=proof.terminals.process.continuation;
 requireMatch(!proof.terminals.plan.continuation&&(!processed||continued),'Continuation cannot replace a native plan or lose its render predecessor');
 if(continued){
  requireMatch(manifest.family==='police-dialogue'&&proof.authoritySha256==='99a70315fb2dc8d231afa985204715d59f2cf91dc94ba6a0037bf0456424d25f'&&continued.id==='police8-render-resource-continuation01'&&continued.proofSha256===police8ContinuationProofSha256&&continued.priorFailedTerminalSha256===police8PriorResourceStopSha256&&continued.renderSupervisorAttempt===2&&continued.phaseSupervisorAttempt===2&&continued.zeroCallWitnessStage==='before-render'&&continued.chargedGenerationCallsBeforeRender===0&&continued.asrReadingsBeforeRender===0&&/^[a-f0-9]{64}$/.test(continued.preflightReceiptSha256),'Public continuation lost the preserved zero-call resource failure');
  requireMatch(processed&&processed.id===continued.id&&processed.proofSha256===continued.proofSha256&&processed.priorFailedTerminalSha256===continued.priorFailedTerminalSha256&&processed.renderSupervisorAttempt===2&&processed.phaseSupervisorAttempt===1&&processed.zeroCallWitnessStage==='before-render'&&processed.chargedGenerationCallsBeforeRender===0&&processed.asrReadingsBeforeRender===0&&processed.preflightReceiptSha256===continued.preflightReceiptSha256&&processed.finalRenderTerminalSha256===proof.terminals.render.sha256,'Public process lost the successful continued render binding');
 }
 return jobs;
}

export function collectVoiceGapPrivateManifestProposals(cast,authorityProof,terminalProofs,selectionProof,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Gap authority changed');
 const authority=json(authorityProof.path),config=voiceGapConfigs[authority.family];
 requireMatch(config&&authority.status==='ROOT_SEALED_FINITE_VOICE_GAP12'&&authority.sealed===true&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.grantId
  &&authority.privateReviewFamily===config.privateFamily&&authority.voiceId===config.voiceId&&authority.helperSha256===voiceGapProducerSha256&&authority.adapterSha256===voiceGapAdapterSha256
  &&authority.maximumNativeCalls===config.count&&authority.maximumAsrReadings===config.count*2&&authority.maximumCallsPerClip===1&&authority.automaticRetries===0,'Unknown finite8/4 gap authority');
 const pins=Object.fromEntries(Object.keys(voiceGapFrozenSourcePins).map(name=>[name,hash(resolve(sourceRoot,name))]));
 requireMatch(sameJson(pins,voiceGapFrozenSourcePins)&&sameJson(authority.sourceSha256,pins)&&hash(authority.requestPath)===authority.requestSha256,'Gap frozen source/request changed');
 const request=json(authority.requestPath),jobs=voiceGapSources(cast,authority.family,sourceRoot);
 requireMatch(request.family===authority.family&&request.gapCompletionBatch==='fixed-voice-gap12-2026-10-15'&&request.privateReviewFamily===config.privateFamily&&request.publicAssetFamily===`assets/voices/${config.assetFamily}`
  &&request.producerSha256===voiceGapProducerSha256&&sameJson(request.sourceSha256,pins)&&sameJson(request.jobs,jobs),'Gap request differs from exact source/owner/profile');
 const family=resolve(authority.musicRoot,config.privateFamily),privateRoot=resolve(family,config.voiceId);
 requireMatch(realpathSync(family)===family&&realpathSync(privateRoot)===privateRoot&&privateRoot.startsWith(family+sep),'Gap private roots alias/escape');
 const privateFile=relative=>{const path=resolve(privateRoot,relative);requireMatch(path.startsWith(privateRoot+sep)&&existsSync(path)&&!lstatSync(path).isSymbolicLink()&&realpathSync(path)===path,'Gap private file missing/aliased');return path;};
 const frozenPath=privateFile('requests.json'),frozen=json(frozenPath),frozenHash=hash(frozenPath);
 requireMatch(sameJson(frozen,{requestedLineCount:config.count,sourceSha256:pins,jobs,approvedExistingReuse:[],authoredPlanSha256:authority.requestSha256,authoredPlanSourceSha256:pins}),'Gap native plan not exact/frozen');
 let trafficRecovery=null;
 if(terminalProofs?.trafficLicenseRecovery){
  const binding=terminalProofs.trafficLicenseRecovery;
  requireMatch(authorityProof.sha256===trafficLicenseRecoveryExpected.authoritySha256&&authority.family==='traffic-dialogue'&&binding.sha256===trafficLicenseRecoveryExpected.proofSha256&&hash(binding.path)===binding.sha256,'Unknown explicit traffic processing recovery');
  trafficRecovery=inspectTrafficLicenseRecovery(json(binding.path),{verifyAudio:true,stage:'after-process'});
 }
 const terminals={},summaries={};for(const phase of ['plan','render','process']){
  const proof=terminalProofs?.[phase];requireMatch(proof?.sha256===hash(proof.path),'Gap terminal bytes changed');const row=json(proof.path);
  if(trafficRecovery&&phase==='render'){
   requireMatch(proof.sha256===trafficLicenseRecoveryExpected.failedRenderTerminalSha256,'Original failed traffic render must remain byte-exact');
   verifyTrafficPrior(row,authority,'render',1);
   summaries.render={rows:trafficRecovery.rows,completionWitnessOnly:true};
   terminals.render={sha256:proof.sha256,exitCode:1,rootRetired:true,timedOut:false,completionWitnessOnly:true,licenseRecovery:trafficLicenseRecoveryExpected.proofSha256};
   continue;
  }
  if(trafficRecovery&&phase==='process')verifyTrafficProcess(row,authority,trafficLicenseRecoveryExpected);
  requireMatch(row.phase===phase&&row.specificationSha256===authorityProof.sha256&&row.producerSha256===(trafficRecovery&&phase==='process'?trafficLicenseRecoveryExpected.processingAdapterSha256:voiceGapAdapterSha256)&&row.exitCode===0&&row.rootRetired===true&&row.timedOut===false&&!row.supervisorError&&row.logsComplete===true
   &&['survivingOwnedChildren','ownedCleanupKills','postflightPinFailures','postflightPrivatePinFailures','postflightInputPinFailures'].every(key=>Array.isArray(row[key])&&row[key].length===0)
   &&row.postflightProtectedPinsChecked===authority.expectedProtectedPublicPinCount&&row.postflightProtectedPrivatePinsChecked===authority.expectedProtectedPrivatePinCount&&row.postflightInputPinsChecked===Object.keys(authority.inputPins).length,'Gap phase did not retire with all pins intact');
  const summaryPath=resolve(family,'g',trafficRecovery&&phase==='process'?'process-license-recovery01-summary.json':phase+'-summary.json'),summary=json(summaryPath);
  requireMatch(summary.authoritySha256===authorityProof.sha256&&summary.adapterSha256===(trafficRecovery&&phase==='process'?trafficLicenseRecoveryExpected.processingAdapterSha256:voiceGapAdapterSha256)&&summary.helperSha256===voiceGapProducerSha256&&summary.phase===phase&&summary.publicExports===0&&summary.automaticRetries===0
   &&summary.rows.length===(phase==='plan'?1:config.count),'Gap phase summary missing/incomplete');
  if(trafficRecovery&&phase==='process')requireMatch(summary.recoveryProofSha256===trafficLicenseRecoveryExpected.proofSha256&&summary.failedRenderTerminalSha256===trafficLicenseRecoveryExpected.failedRenderTerminalSha256&&summary.renderAdapterSha256===voiceGapAdapterSha256&&summary.additionalNativeCalls===0&&summary.originalNativeCalls===4&&Number.isInteger(summary.actualAsrReadings)&&summary.actualAsrReadings>=4&&summary.actualAsrReadings<=8,'Traffic process lost finite recovery accounting');
  if(phase==='plan')requireMatch(summary.nativePlanInvocationThisGrant===true&&summary.frozenRequestPins?.[frozenPath]===frozenHash,'Gap plan summary lacks genuine frozen request');
  else requireMatch(new Set(summary.rows.map(row=>row.clipId)).size===config.count&&summary.rows.every(row=>jobs.some(job=>job.clipId===row.clipId)),'Gap summary owned IDs changed');
  let continuation=null;
  if(row.continuation){
   requireMatch(authorityProof.sha256==='99a70315fb2dc8d231afa985204715d59f2cf91dc94ba6a0037bf0456424d25f'&&config.count===8&&phase!=='plan'&&hash(row.continuation.proofPath)===police8ContinuationProofSha256,'Unknown explicit police8 continuation');
   continuation=verifyPolice8Continuation(json(row.continuation.proofPath),police8ContinuationProofSha256,row);
  }
  if(phase==='process'&&terminals.render?.continuation)requireMatch(continuation&&continuation.finalRenderTerminalSha256===terminalProofs.render.sha256,'Process must bind the successful continued render terminal');
  const logSuffix=trafficRecovery&&phase==='process'?'-license-recovery01':continuation?'-voice-gap-v1-continuation01':'-voice-gap-v1';
  const label=config.count===8?'police8':'traffic4',stdoutPath=resolve(family,'_primary-logs',`${label}-${phase}${logSuffix}-stdout.txt`),stderrPath=resolve(family,'_primary-logs',`${label}-${phase}${logSuffix}-stderr.txt`);
  requireMatch(hash(stdoutPath)===row.stdoutSha256&&hash(stderrPath)===row.stderrSha256,'Gap terminal log bytes changed');
  const emitted=JSON.parse(readFileSync(stdoutPath,'utf8').trim().split(/\r?\n/).at(-1));
  requireMatch(emitted.phase===phase&&emitted.count===summary.rows.length&&emitted.summarySha256===hash(summaryPath)&&emitted.publicExports===0,'Gap summary no longer matches retired adapter stdout');
  summaries[phase]=summary;
  terminals[phase]={sha256:proof.sha256,summarySha256:hash(summaryPath),exitCode:0,rootRetired:true,timedOut:false,...(continuation?{continuation}:{}),...(trafficRecovery&&phase==='process'?{licenseRecovery:trafficLicenseRecoveryExpected.proofSha256}:{})};
 }
 const ledgerPath=privateFile(authority.family.split('-')[0]+'-native-call-ledger.json'),ledger=json(ledgerPath),ids=jobs.map(row=>row.clipId);
 requireMatch(ledger.requestSha256===frozenHash&&sameJson([...ledger.chargedClipIds].sort(),[...ids].sort())&&new Set(ledger.chargedClipIds).size===config.count,'Gap native charges not exactly one per owned clip');
 const asrPath=resolve(privateRoot,authority.family.split('-')[0]+'-asr-read-ledger.json'),hasAsr=existsSync(asrPath),asr=hasAsr?json(privateFile(authority.family.split('-')[0]+'-asr-read-ledger.json')):{requestSha256:frozenHash,chargedReadings:[]};
 requireMatch(asr.requestSha256===frozenHash&&asr.chargedReadings.length<=2*config.count&&new Set(asr.chargedReadings.map(row=>row.clipId+'\0'+row.beamSize)).size===asr.chargedReadings.length&&asr.chargedReadings.every(row=>ids.includes(row.clipId)&&[1,5].includes(row.beamSize)),'Gap ASR duplicate/foreign/over-cap charges');
 const selection=selectionProof?json(selectionProof.path):null;
 if(selectionProof)requireMatch(selectionProof.sha256===hash(selectionProof.path)&&selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&selection.instruction?.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&Array.isArray(selection.clips),'Gap exact clip/hash use selection invalid');
 const selected=new Map((selection?.clips||[]).map(row=>[row.clipId,row.encodedSha256]));requireMatch(selected.size===(selection?.clips||[]).length&&[...selected].every(([id,value])=>ids.includes(id)&&/^[a-f0-9]{64}$/.test(value)),'Gap selection duplicate/foreign');
 const alignments=selection?.retainedSourceWordAlignments??{};
 requireMatch(alignments&&typeof alignments==='object'&&!Array.isArray(alignments)&&Object.keys(alignments).every(id=>Object.hasOwn(retainedCompoundIds,id)&&selected.has(id)),'Foreign/unselected retained alignment supplement');
 const clips=[],heldPrivate=[],takes={};
 for(let index=0;index<jobs.length;index++){
  const job=jobs[index],rawPath=privateFile('raw/'+job.clipId+'.json'),raw=json(rawPath),tracePath=privateFile('raw/'+job.clipId+'-eos-trace.json'),trace=json(tracePath),s=raw.synthesis;
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.requestSha256===frozenHash&&raw.authoringHelperSha256===voiceGapProducerSha256&&raw.profileJsonSha256===authority.profileBindings[config.voiceId].profileJsonSha256
   &&raw.synthesisAttempt===config.attempt&&raw.seed===71000+index+(config.attempt-1)*100000&&authority.seeds[job.clipId]===raw.seed&&authority.attempts[job.clipId]===config.attempt&&raw.rendererInputText===job.text
   &&s.device==='cuda'&&s.precision==='fp16'&&s.t3WeightPrecision==='float16'&&s.conditioningPrecision==='float32'&&s.autocastPrecision==='float16'&&s.conditioningCached===true&&s.referenceReconditionedForProfile===job.profileId&&s.referenceConditioningVerifiedFloat32===true&&s.cpuThreads===2&&s.inferenceMode===true
   &&s.exaggeration===.5&&s.temperature===.65&&s.repetitionPenalty===3&&s.cfgWeight===.6&&s.languageId==='de'
   &&raw.decode.maxSpeechTokens===authority.tokenCaps[job.clipId]&&raw.decode.eosTraceSha256===hash(tracePath)&&trace.clipId===job.clipId&&trace.text===job.text&&trace.profileId===job.profileId&&trace.referenceSha256===job.referenceSha256&&trace.modelRevision===job.modelRevision&&policeEosTraceAuthority(raw.decode,trace)
   &&hash(privateFile('raw/'+job.clipId+'.wav'))===raw.rawSha256,'Gap raw owned take/recipe/EOS trace changed');
  const rendered=summaries.render.rows.find(row=>row.clipId===job.clipId),processed=summaries.process.rows.find(row=>row.clipId===job.clipId);
  const rawIdentity={clipId:job.clipId,receiptSha256:hash(rawPath),rawSha256:raw.rawSha256,nativeEosReached:raw.decode.eosReached,seed:raw.seed,actualTakeWithinGrant:1,globalHistoricalOrdinal:config.attempt,profileId:job.profileId,maxSpeechTokens:raw.decode.maxSpeechTokens,generatedSpeechTokens:raw.decode.generatedSpeechTokens};
  requireMatch(Object.entries(rawIdentity).every(([key,value])=>sameJson(rendered[key],value)&&sameJson(processed[key],value)),'Gap render/process summary raw identity changed');
  requireMatch(Number.isFinite(raw.durationSeconds)&&raw.durationSeconds>0&&rendered.durationSeconds===raw.durationSeconds,'Gap raw summary/native sample duration changed');
  const prior=request.executionPolicy.priorAttempts[job.clipId];
  if(config.attempt===2){requireMatch(prior&&hash(prior.rawReceiptPath)===prior.rawReceiptSha256,'Prior police take1 receipt changed');const old=json(prior.rawReceiptPath);requireMatch(old.clipId===job.clipId&&old.profileId===job.profileId&&old.referenceSha256===job.referenceSha256&&old.text===job.text&&old.synthesisAttempt===prior.synthesisAttempt&&old.synthesisAttempt===1&&old.rawSha256===prior.rawSha256&&old.seed===prior.seed,'Police next take lost actual historical first-take identity');}
  if(raw.decode.eosReached!==true){requireMatch(processed.durationSeconds===raw.durationSeconds&&!asr.chargedReadings.some(row=>row.clipId===job.clipId)&&processed.asrReadings===0&&!processed.encodedReceiptSha256,'Incomplete EOS must retain raw duration and be held before ASR');heldPrivate.push({...job,reason:'held private; native EOS incomplete'});continue;}
  const encodedPath=privateFile('encoded/'+job.clipId+'.json'),encoded=json(encodedPath),audioPath=privateFile('encoded/'+job.clipId+'.mp3'),beams=asr.chargedReadings.filter(row=>row.clipId===job.clipId).map(row=>row.beamSize);
  if(trafficRecovery)verifyTrafficEncodedLicense(encoded,hash(rawPath),trafficLicenseRecoveryExpected);
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&encoded.authoringHelperSha256===raw.authoringHelperSha256&&encoded.requestSha256===raw.requestSha256&&encoded.profileJsonSha256===raw.profileJsonSha256&&encoded.rawSha256===raw.rawSha256&&encoded.synthesisAttempt===raw.synthesisAttempt&&encoded.seed===raw.seed&&encoded.rendererInputText===raw.rendererInputText&&sameJson(encoded.decode,raw.decode)&&sameJson(encoded.synthesis,raw.synthesis)&&hash(audioPath)===encoded.sha256&&readFileSync(audioPath).length===encoded.bytes
   &&sameJson(beams,encoded.asrReadings.map(row=>row.beamSize))&&(sameJson(beams,[1])||sameJson(beams,[1,5]))&&encoded.asrDevice==='cpu'&&encoded.asrComputeType==='int8'&&encoded.asrCpuThreads===1&&encoded.asrLanguageId==='de'&&encoded.asrScriptPrompt===null&&encoded.asrModelSha256===authority.asrModelSha256&&['int8','int8_float32'].includes(encoded.asrEffectiveComputeType)
   &&encoded.asrReadings.every(row=>typeof row.transcript==='string'&&row.transcript.trim())&&encoded.asrBeamSize===beams.at(-1)&&encoded.asr===encoded.asrReadings.at(-1).transcript,'Gap encoded raw/ASR/audio lineage changed');
  requireMatch(Number.isFinite(encoded.durationSeconds)&&encoded.durationSeconds>0&&processed.durationSeconds===encoded.durationSeconds&&processed.encodedReceiptSha256===hash(encodedPath)&&processed.encodedSha256===encoded.sha256&&processed.asrWordExact===encoded.asrWordExact&&processed.asrReadings===encoded.asrReadings.length&&processed.wordCueCount===encoded.wordCues?.length&&processed.levelsPass===(Math.abs(encoded.integratedLufs+18)<=.3&&encoded.truePeakDbtp<=-1.5),'Gap process summary encoded facts/duration changed');
  const take={rawReceiptSha256:hash(rawPath),encodedReceiptSha256:hash(encodedPath),rawSha256:raw.rawSha256,encodedSha256:encoded.sha256,profileJsonSha256:raw.profileJsonSha256,...(prior?{priorSynthesisAttempt:1,priorRawReceiptSha256:prior.rawReceiptSha256}:{} )};
  if(Object.hasOwn(alignments,job.clipId))take.retainedSourceWordAlignment=alignments[job.clipId];
  const aligned=verifiedRetainedCompoundCues(encoded,take,frozenHash);
  if(encoded.asrWordExact!==true||(encoded.asrLiteralWordExact!==true&&aligned===null)||spokenWords(job.text)!==spokenWords(encoded.asr)||Math.abs(encoded.integratedLufs+18)>.3||encoded.truePeakDbtp>-1.5){heldPrivate.push({...job,reason:'held private; literal words/levels not eligible',candidateSha256:encoded.sha256});continue;}
  if(selected.get(job.clipId)!==encoded.sha256){heldPrivate.push({...job,reason:'technically eligible; not selected',candidateSha256:encoded.sha256});continue;}
  const clip=Object.fromEntries(voiceGapPublicTakeFields.filter(key=>Object.hasOwn(encoded,key)).map(key=>[key,encoded[key]]));
  clip.file=`assets/voices/${config.assetFamily}/${job.clipId}.mp3`;clip.approval={status:'user-approved',scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:job.clipId,encodedSha256:encoded.sha256};voiceGapClipAuthority(cast,clip,config,take,frozenHash);clips.push(clip);
  takes[job.clipId]=take;
 }
 const manifest={schemaVersion:1,kind:'voice-gap12',family:authority.family,voiceId:config.voiceId,profileId:cast.productionVoices[config.voiceId].profileId,fallback:'captions',status:'exact selected next/first takes; listening NOT RUN',requestedLineCount:config.count,generatedLineCount:config.count,lineCount:clips.length,clips,heldPrivate,approvedExistingReuse:[],voiceGapAdmission:{status:'ROOT-verified-finite-voice-gap12',authoritySha256:authorityProof.sha256,authoredPlanSha256:authority.requestSha256,frozenRequestSha256:frozenHash,producerSha256:voiceGapProducerSha256,adapterSha256:voiceGapAdapterSha256,sourcePins:pins,terminals,nativeLedgerSha256:hash(ledgerPath),asrLedgerSha256:hasAsr?hash(asrPath):null,takes,...(trafficRecovery?{trafficLicenseRecovery:trafficLicenseRecoveryExpected}:{})}};
 voiceGapManifestAuthority(cast,manifest,sourceRoot);return {status:'private typed voice-gap proposal; no public copy',manifest,counts:{requested:config.count,generated:config.count,selected:clips.length,held:heldPrivate.length}};
}

export function voiceGapRecordingsBlock(cast,manifests,assetRoot=root,sourceRoot=root){
 const groups={'police-dialogue':{clips:[],voiceGapEvidence:{}},'traffic-dialogue':{clips:[],voiceGapEvidence:{}}},seen=new Set();
 for(const manifest of manifests){voiceGapManifestAuthority(cast,manifest,sourceRoot);for(const clip of manifest.clips){requireMatch(!seen.has(clip.clipId),'Duplicate gap selected clip');seen.add(clip.clipId);const group=groups[manifest.family];group.clips.push({...clip,provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});group.voiceGapEvidence[clip.clipId]={take:manifest.voiceGapAdmission.takes[clip.clipId],requestSha256:manifest.voiceGapAdmission.frozenRequestSha256};}}
 const expressions=Object.entries(groups).map(([family,manifest])=>{const block=fixedRecordingsBlock(cast,manifest,family,assetRoot,sourceRoot);return block.slice(block.indexOf('=')+1).trim().slice(0,-1)});
 return 'const voiceGapRecordings=Object.freeze({...'+expressions.join(',...')+'});\n';
}

function voiceGapManifests(cast,source,assetRoot=root,sourceRoot=root){
 const anchors=voiceGapAdmissions(source),manifests=[];
 for(const config of Object.values(voiceGapConfigs)){
  const relative=`assets/voices/${config.assetFamily}/${config.manifest}`,path=resolve(assetRoot,relative);
  if(!existsSync(path)){requireMatch(!Object.hasOwn(anchors,relative),'Missing anchored gap manifest');continue;}
  requireMatch(!lstatSync(path).isSymbolicLink()&&lstatSync(path).nlink===1&&realpathSync(path)===path&&anchors[relative]===hash(path),'Gap manifest unanchored/aliased');
  const manifest=json(path);voiceGapManifestAuthority(cast,manifest,sourceRoot);manifests.push({...manifest,provenanceManifest:relative,provenanceManifestSha256:anchors[relative]});
 }
 requireMatch(Object.keys(anchors).length===manifests.length,'Unknown gap manifest admission anchor');return manifests;
}

function installVoiceGapCatalog(source,block,anchors){
 const anchor='const voiceGapAdmissionReceipts=Object.freeze('+JSON.stringify(anchors)+');\n';
 let next=source.replace(voiceGapAdmissionPattern,'').replace(voiceGapBlockPattern,'');
 requireMatch(next.includes('const recordings=Object.freeze({'),'Missing catalog insertion point');
 next=next.replace('const recordings=Object.freeze({',()=>anchor+block+'const recordings=Object.freeze({');
 if(!next.includes(' ...voiceGapRecordings,'))next=next.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...voiceGapRecordings,');
 return next;
}

export function verifyVoiceGapCatalogConservation(oldRecords,newRecords,{prior,manifest,relative,priorManifestText,nextManifestText}){
 const config=voiceGapConfigs[manifest.family],nextDigest=textHash(nextManifestText),members=new Map();
 requireMatch(config&&relative===`assets/voices/${config.assetFamily}/${config.manifest}`&&sameJson(JSON.parse(nextManifestText),manifest),'Gap rollover target/serialized manifest changed');
 if(prior){
  const {provenanceManifest,provenanceManifestSha256,...body}=prior;
  requireMatch(typeof priorManifestText==='string'&&provenanceManifest===relative&&provenanceManifestSha256===textHash(priorManifestText)&&sameJson(JSON.parse(priorManifestText),body)&&prior.family===manifest.family&&prior.voiceId===manifest.voiceId,'Gap rollover prior manifest/anchor changed');
  for(const clip of prior.clips){
   const next=manifest.clips.find(row=>row.clipId===clip.clipId);
   requireMatch(next&&next.file===clip.file&&next.sha256===clip.sha256&&!members.has('./'+clip.file),'Gap rollover cannot replace a prior selected take');
   members.set('./'+clip.file,clip);
  }
 }else requireMatch(priorManifestText===null,'Gap rollover has an unvalidated prior manifest');
 requireMatch(Object.entries(oldRecords).every(([key,row])=>{
  const member=members.get(key),next=newRecords[key];
  if(!member)return sameJson(next,row);
  return row.clipId===member.clipId&&row.sha256===member.sha256&&row.provenanceManifest===relative&&row.provenanceManifestSha256===prior.provenanceManifestSha256&&next?.provenanceManifest===relative&&next.provenanceManifestSha256===nextDigest&&sameJson(next,{...row,provenanceManifestSha256:nextDigest});
 })&&Object.keys(newRecords).length===Object.keys(oldRecords).length+manifest.clips.filter(clip=>!Object.hasOwn(oldRecords,'./'+clip.file)).length,'Gap catalog changed an existing recording object beyond its exact owned manifest digest rollover');
}
export function admitVoiceGapPrivateProposals(cast,authorityProof,terminalProofs,selectionProof,sourceRoot=root,destinationRoot=root,commitIo={}){
 const authority=json(authorityProof.path),config=voiceGapConfigs[authority.family],source=realpathSync(sourceRoot),destination=realpathSync(destinationRoot);
 requireMatch(config&&source!==destination&&!source.startsWith(destination+sep)&&!destination.startsWith(source+sep),'Gap source/destination must be separate');
 const family=resolve(authority.musicRoot,config.privateFamily),privateRoot=realpathSync(resolve(family,config.voiceId));
 requireMatch(!privateRoot.startsWith(destination+sep)&&!destination.startsWith(privateRoot+sep),'Gap private/public roots overlap');
 const result=collectVoiceGapPrivateManifestProposals(cast,authorityProof,terminalProofs,selectionProof,source),manifest=result.manifest;
 requireMatch(manifest.clips.length>0,'Gap admission needs eligible selected files');
 const catalogPath=resolve(destination,'For-AI/AUDIO-TEXT-LIBRARY.js'),priorCatalog=readFileSync(catalogPath,'utf8');
 requireMatch(!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1,'Linked catalog');
 const current=voiceGapManifests(cast,priorCatalog,destination,source),relative=`assets/voices/${config.assetFamily}/${config.manifest}`;
 const prior=current.find(row=>row.provenanceManifest===relative),selected=new Map(manifest.clips.map(row=>[row.clipId,row.sha256]));
 if(prior)requireMatch(prior.clips.every(row=>selected.get(row.clipId)===row.sha256),'Gap admission cannot discard/replace prior selected takes');
 const oldPolicePath=resolve(destination,'assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json'),oldPolice=existsSync(oldPolicePath)?json(oldPolicePath):null;
 if(oldPolice){policeManifestAuthority(cast,oldPolice,source);requireMatch(policeAdmissions(priorCatalog)['assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json']===hash(oldPolicePath)&&oldPolice.clips.every(row=>!selected.has(row.clipId)&&hash(resolve(destination,row.file))===row.sha256),'Gap may not replace historical police defaults');}
 const preservedPolice=oldPolice?{manifestSha256:hash(oldPolicePath),clips:oldPolice.clips.map(row=>[row.file,row.sha256])}:null;
 const manifestPath=resolve(destination,relative),directory=dirname(manifestPath),voicesRoot=realpathSync(resolve(destination,'assets/voices'));
 requireMatch(directory.startsWith(voicesRoot+sep)&&(!existsSync(directory)||!lstatSync(directory).isSymbolicLink()&&realpathSync(directory)===directory),'Gap asset directory aliases/escapes');
 const priorManifest=existsSync(manifestPath)?readFileSync(manifestPath,'utf8'):null,manifestTemp=manifestPath+'.gap.tmp',catalogTemp=catalogPath+'.gap.tmp';
 requireMatch(!existsSync(manifestTemp)&&!existsSync(catalogTemp)&&(!existsSync(manifestPath)||!lstatSync(manifestPath).isSymbolicLink()&&lstatSync(manifestPath).nlink===1),'Occupied/linked gap transaction paths');
 const bytes=JSON.stringify(manifest,null,2)+'\n',anchors=voiceGapAdmissions(priorCatalog);anchors[relative]=textHash(bytes);
 const nextManifests=current.filter(row=>row.provenanceManifest!==relative).concat([{...manifest,provenanceManifest:relative,provenanceManifestSha256:textHash(bytes)}]);
 mkdirSync(directory,{recursive:true});const created=[];let installed=false;
 const copy=commitIo.copyFileSync||copyFileSync,write=commitIo.writeFileSync||writeFileSync,rename=commitIo.renameSync||renameSync,unlink=commitIo.unlinkSync||unlinkSync;
 try{
  for(const clip of manifest.clips){const target=resolve(destination,clip.file);requireMatch(target.startsWith(directory+sep),'Gap asset path escaped');if(!existsSync(target)){created.push(target);copy(resolve(privateRoot,'encoded',clip.clipId+'.mp3'),target,constants.COPYFILE_EXCL);}requireMatch(!lstatSync(target).isSymbolicLink()&&lstatSync(target).nlink===1&&hash(target)===clip.sha256,'Gap installed bytes differ/alias');}
  const block=voiceGapRecordingsBlock(cast,nextManifests,destination,source),next=installVoiceGapCatalog(priorCatalog,block,anchors),before={window:{}},after={window:{}};
  vm.runInNewContext(priorCatalog,before);vm.runInNewContext(next,after);
  const oldRecords=before.window.GermanySimulatorAudioText.recordings,newRecords=after.window.GermanySimulatorAudioText.recordings;
  verifyVoiceGapCatalogConservation(oldRecords,newRecords,{prior,manifest,relative,priorManifestText:priorManifest,nextManifestText:bytes});
  if(preservedPolice)requireMatch(hash(oldPolicePath)===preservedPolice.manifestSha256&&preservedPolice.clips.every(([file,digest])=>hash(resolve(destination,file))===digest),'Historical police defaults changed during staging');
  requireMatch(readFileSync(catalogPath,'utf8')===priorCatalog,'Catalog changed during gap transaction');
  created.push(manifestTemp);write(manifestTemp,bytes,{flag:'wx'});rename(manifestTemp,manifestPath);installed=true;
  created.push(catalogTemp);write(catalogTemp,next,{flag:'wx'});rename(catalogTemp,catalogPath);
 }catch(error){if(installed){if(priorManifest===null)unlink(manifestPath);else{write(manifestTemp,priorManifest,{flag:'wx'});rename(manifestTemp,manifestPath);}}for(const file of created.reverse())if(existsSync(file))unlink(file);throw error;}
 return {voiceId:config.voiceId,accepted:manifest.clips.length,held:manifest.heldPrivate.length,manifest:manifestPath,admissionAnchor:textHash(bytes),preservedPoliceDefaults:preservedPolice?.clips.length??0,listening:'NOT RUN'};
}

export function fixedRecordingsBlock(cast,manifest,family='knick',assetRoot=root,sourceRoot=root){
 requireMatch(['knick','street-wisdom','player-replies','office-ambient','city-dialogue','crowd-dialogue','police-dialogue','traffic-dialogue','quiz-dialogue'].includes(family),'Unknown fixed recording family');
 const entries={},seen=new Set(),street=family==='street-wisdom'?streetAuthority():null,ambient=family==='office-ambient',city=family==='city-dialogue',crowd=family==='crowd-dialogue',police=family==='police-dialogue',traffic=family==='traffic-dialogue',quiz=family==='quiz-dialogue',assetFamily=crowd?'candidate-dialogue':family==='quiz-dialogue'?'quiz-segments':family;
 const policeRows=police?new Map(policeDialogueSources(cast,sourceRoot).map(row=>[row.clipId,row])):null;
 const trafficRows=traffic?new Map(voiceGapSources(cast,'traffic-dialogue',sourceRoot).map(row=>[row.clipId,row])):null;
 const quizRows=quiz?new Map((manifest.authoredRows||[]).map(row=>[row.clipId,row])):null;
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
  let wordCues=clip.wordCues;
  requireMatch((family!=='knick'||clip.voiceId==='amt-brunhilde-knick')&&matchesProduction(cast,clip),'Fixed profile/reference/renderer drift');
  const binding=cast.productionVoices[clip.voiceId];
  const ruedigerPilotProof=family==='crowd-dialogue'?manifest.ruedigerPilotHomophoneEvidence?.[clip.clipId]:null;
  if(ruedigerPilotProof)ruedigerPilotHomophoneClipAuthority(cast,clip,ruedigerPilotProof,sourceRoot);else fixedTakeAuthority(cast,clip);
  requireMatch(clip.english?.trim()&&clip.approval?.status==='user-approved',`Missing fixed subtitle/use authority: ${clip.clipId}`);
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
  if(police){const authored=policeRows.get(clip.clipId);requireMatch(authored&&Object.entries(authored).every(([key,value])=>sameJson(clip[key],value)),'Wrong police actor/region/slot/source, subtitle, or selected binding');const gap=manifest.voiceGapEvidence?.[clip.clipId];if(gap)wordCues=voiceGapClipAuthority(cast,clip,voiceGapConfigs['police-dialogue'],gap.take,gap.requestSha256);else requireMatch(clip.asrLiteralWordExact===true&&clip.asrDevice==='cpu'&&clip.asrComputeType==='int8'&&clip.asrCpuThreads===1&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null&&clip.asrModelSha256==='e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da'&&['int8','int8_float32'].includes(clip.asrEffectiveComputeType)&&clip.approval?.status==='user-approved'&&clip.approval.scope==='whole-game-fixed-voice-cloning'&&clip.approval.clipId===clip.clipId&&clip.approval.encodedSha256===clip.sha256,'Police take lacks literal German ASR or exact clip/hash use authorization');}
  if(quiz){const authored=quizRows?.get(clip.clipId);requireMatch(authored&&['actorId','voiceId','questionId','questionCategory','segment','sourceLocator','englishSourceLocator','text','english','profileId','referenceSha256','referenceOriginalSha256'].every(key=>sameJson(clip[key],authored[key]))&&clip.segment==='question'&&clip.region==='germany'&&clip.approval?.status==='user-approved'&&clip.approval?.listeningConfirmed===false&&clip.approval?.scope==='ROOT-sealed-finite-German9'&&clip.approval.grantId===manifest.quizAdmission?.grantId&&clip.approval.clipId===clip.clipId&&clip.approval.encodedSha256===clip.sha256,'Wrong German9 actor/question/source/profile or finite grant binding');quizGerman9WordCues(clip);}
   if(traffic){const authored=trafficRows.get(clip.clipId);requireMatch(authored&&Object.entries(authored).every(([key,value])=>sameJson(clip[key],value)),'Wrong traffic actor/region/text/subtitle/profile');const gap=manifest.voiceGapEvidence?.[clip.clipId];wordCues=voiceGapClipAuthority(cast,clip,voiceGapConfigs['traffic-dialogue'],gap?.take,gap?.requestSha256);}
  if(street){
   const index=clip.ruleIndex,person=street.definitions.find(person=>person.ruleIndices.includes(index));
   requireMatch(Number.isInteger(index)&&person&&clip.actorId===person.id&&clip.voiceId===person.voiceId&&clip.clipId===`${person.id}-rule-${String(index+1).padStart(2,'0')}`&&clip.text===street.catalog.rules[index][1]&&clip.english===street.catalog.ruleEnglish[index],`Wrong street rule ownership/text: ${clip.clipId}`);
   id=`rule-${String(index+1).padStart(2,'0')}`;
  }
  entries['./'+clip.file]={id,...(street||replies||ambient||city||crowd||police||traffic||quiz?{clipId:clip.clipId,actorId:clip.actorId}:{}),...(quiz?{questionId:clip.questionId,questionCategory:clip.questionCategory,segment:clip.segment,sourceLocator:clip.sourceLocator,englishSourceLocator:clip.englishSourceLocator}:{}),voiceId:clip.voiceId,profileId:clip.profileId,fixedProduction:true,renderer:clip.renderer,modelRevision:clip.modelRevision,referenceSha256:clip.referenceSha256,referenceOriginalSha256:clip.referenceOriginalSha256,processing:clip.processing??null,source:clip.text,english:clip.english,...(ruedigerPilotProof?{generationScope:ruedigerPilotProof.generationScope,verificationMode:clip.verificationMode,verificationStatus:'homophone-equivalent',asrWordExact:false,asrLiteralWordExact:false,asrHomophoneWordEquivalent:true,originalStrictParentGate:false,originalEncodedReceiptSha256:ruedigerPilotProof.projection.originalEncodedReceiptSha256,projectionSha256:ruedigerPilotProof.projectionSha256,synthesisAttempt:0,segmentGenerationCalls:3,parentGenerationCalls:0,parentGermanAsrCalls:2,totalAsrCalls:5,listening:'pending',listeningVerified:false}:{}),...(city||crowd||police||traffic||quiz?{provenanceManifestSha256:clip.provenanceManifestSha256}:{}),...((city||crowd)&&clip.mouthEnergy?{mouthHz:clip.mouthHz,mouthEnergy:clip.mouthEnergy}:{}),trigger:family==='knick'?'buergeramt-exact-dialogue':city?'city-exact-dialogue':crowd?'crowd-owned-exact-dialogue':police?'police-exact-dialogue':traffic?'traffic-owned-exact-dialogue':quiz?'quiz-exact-question':replies?'buergeramt-player-reply':ambient?'buergeramt-ambient':'nearby-street-rule',durationMs:Math.round(clip.durationSeconds*1000),wordCues,sha256:clip.sha256,approval:clip.approval,provenanceManifest:clip.provenanceManifest};
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
 return `const ${family==='knick'?'knick':city?'city':crowd?'crowd':police?'police':traffic?'traffic':quiz?'quizGerman9':replies?'playerReply':ambient?'officeAmbient':'streetWisdom'}Recordings=Object.freeze((()=>{const r=`+JSON.stringify(receipts)+';const w=cues=>cues.map(([at,end,charIndex,word])=>({at,end,charIndex,word}));return{'+rows.join(',')+'}})());\n';
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
const ambientMouthPath='assets/voices/ambient-mouth-energy.json';
const ambientMouthIds=['street-dietmar-din-norm-rule-03','street-dietmar-din-norm-rule-06','street-horst-hausordnung-rule-02','street-horst-hausordnung-rule-05','street-horst-hausordnung-rule-08','street-waltraud-wartemarke-rule-04','street-waltraud-wartemarke-rule-10','crowd-ruediger-rasenkante-berlin-01','quiz-gisela-becker-question-24-germany','quiz-ruediger-schmidt-question-g-b2-01-germany','quiz-sabine-krueger-question-g-b1-01-germany','quiz-heike-hoffmann-question-24-germany'];
export function validateAmbientMouthEnergy(supplement,catalog,assetRoot=root){
 requireMatch(supplement.kind==='ambient-final-mp3-mouth-energy-supplement-v1'&&supplement.generationCalls===0&&supplement.recipeModule==='tools/neighbor-voice-processing.mjs'&&supplement.recipeModuleSha256==='fd26a84815d1ce7cb5a94726d7ca2bf386431da80ecbabfbcd280a19cb63fd98'&&supplement.recipeFunctionSha256==='327151f9fa13b35f22b938161ed745f861750516b717f319ce33e2bd32d970b3'&&supplement.decoderSha256===cityEnergyFfmpegSha256,'Ambient mouth measurement recipe changed');
 requireMatch(sameJson(supplement.decodeRecipe,['-nostdin','-threads','1','-hide_banner','-loglevel','error','-i','<final-mp3>','-f','f32le','-ac','1','-ar','24000','pipe:1']),'Ambient mouth decoder recipe changed');
 requireMatch(sameJson(Object.keys(supplement.clips).sort(),[...ambientMouthIds].sort()),'Ambient mouth clip scope changed');
 const rows={};
 for(const [id,row] of Object.entries(supplement.clips)){
  const path='./'+row.file,clip=catalog.recordings[path];
  requireMatch(clip&&row.clipId===id&&clip.clipId===id&&catalog.candidateClip(row.voiceId,row.source)===path,'Ambient mouth recording is not the existing default');
  for(const key of ['voiceId','actorId','profileId','referenceSha256','referenceOriginalSha256','renderer','modelRevision','source','english','sha256','provenanceManifest'])requireMatch(row[key]===clip[key],'Ambient mouth recording identity changed: '+key);
  requireMatch(sameJson(row.processing,clip.processing??null)&&hash(resolve(assetRoot,row.file))===row.sha256&&readFileSync(resolve(assetRoot,row.file)).length===row.encodedBytes&&hash(resolve(assetRoot,row.provenanceManifest))===row.provenanceManifestSha256,'Ambient mouth encoded audio/admission bytes changed');
  requireMatch(row.mouthHz===40&&Number.isSafeInteger(row.sampleCount)&&row.sampleCount>0&&row.sampleCount<=720000&&row.durationSeconds===row.sampleCount/24000&&/^[a-f0-9]{64}$/.test(row.pcmSha256)&&Array.isArray(row.mouthEnergy)&&row.mouthEnergy.length===Math.ceil(row.sampleCount/600)&&row.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255)&&row.energySha256===textHash(Buffer.from(row.mouthEnergy)),'Invalid ambient final-MP3 mouth bins');
  rows[path]={mouthHz:40,mouthEnergy:row.mouthEnergy};
 }
 return rows;
}
export function ambientMouthRecordingsBlock(source,assetRoot=root){
 const receipt=source.match(/const ambientMouthEnergyReceipt=Object\.freeze\((\{[^\n]*\})\);/),file=resolve(assetRoot,ambientMouthPath);
 if(!receipt){requireMatch(!existsSync(file),'Ambient mouth supplement lacks its catalog anchor');return '';}
 const receipts=JSON.parse(receipt[1]);requireMatch(sameJson(Object.keys(receipts),[ambientMouthPath])&&hash(file)===receipts[ambientMouthPath],'Ambient mouth supplement hash drift');
 const context={window:{},location:{search:''},URLSearchParams};vm.runInNewContext(source,context);
 const rows=validateAmbientMouthEnergy(json(file),context.window.GermanySimulatorAudioText,assetRoot);
 return 'const ambientMouthRecordings=clips=>Object.freeze(Object.fromEntries(Object.entries('+JSON.stringify(rows)+').filter(([path])=>Object.hasOwn(clips,path)).map(([path,cue])=>[path,{...clips[path],...cue}])));\n';
}
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

const reactiveScope='named-crowd-reactive-v1';
const reactiveAuthoringHelperSha256=sandaleAuthoringHelperSha256;
const reactivePublicJobFields=[...crowdPublicJobFields,'cause'];
const reactiveActors=['crowd-baerbel-brezel','crowd-brigitte-bueroklammer','crowd-elfriede-eingabe','crowd-guenther-gartenzaun','crowd-hildegard-brotzeit','crowd-irmgard-aktenordner','crowd-klaus-dieter-knoedel','crowd-manfred-mittagsruhe','crowd-ruediger-rasenkante'];
const reactiveSourceFiles=['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js'];
export function reactiveSourceMap(cast,sourceRoot=root){
 const game=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),matches=[...game.matchAll(/const crowdReactiveBarks=(Object\.freeze\([\s\S]*?\));\s*\nconst germannessVoice=/g)];
 requireMatch(matches.length===1,'Missing or ambiguous named reactive source map');
 const barks=vm.runInNewContext(matches[0][1],Object.create(null),{timeout:1000}),inventory=json(resolve(sourceRoot,'For-AI/VOICE-DIALOGUE-INVENTORY.json')).pools?.crowdReactiveBarks,rows=[];
 const frozen=value=>value===null||typeof value!=='object'||Object.isFrozen(value)&&Object.values(value).every(frozen);
 requireMatch(frozen(barks),'Reactive source must be recursively immutable');
 requireMatch(sameJson(Object.keys(barks).sort(),reactiveActors)&&sameJson(inventory,barks),'Reactive source owner set or derived public inventory changed');
 for(const actorId of reactiveActors){
  const owners=cast.roleProfiles.filter(row=>row.gameRole===actorId),owner=owners[0],binding=cast.productionVoices[actorId],regions=barks[actorId];
  requireMatch(owners.length===1&&owner.voiceId===actorId&&owner.runtimeArchetype!=='street-wisdom'&&owner.secretTunnelProfileId===binding?.profileId&&Array.isArray(owner.dialogueSources)&&owner.dialogueSources.filter(line=>line==='game.js actor-owned crowdReactiveBarks['+actorId+'][region][cause]; grass4/road4/jaywalker6 per region').length===1,'Reactive source owner/profile changed');
  requireMatch(owner.reference?.workingReferenceSha256===binding.originalSha256&&owner.reference?.license==='CC0-1.0'&&binding.fallback==='captions'&&binding.renderer==='ResembleAI/Chatterbox Multilingual V2 0.1.7'&&binding.modelRevision==='5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'&&(binding.processing??null)===null&&/^[a-f0-9]{32}$/.test(binding.profileId)&&[binding.originalSha256,binding.referenceSha256].every(value=>/^[a-f0-9]{64}$/.test(value)),'Reactive selected reference/license/dry recipe changed');
  requireMatch(sameJson(Object.keys(regions).sort(),['berlin','germany']),'Reactive region set changed');
  for(const region of ['berlin','germany']){
   requireMatch(sameJson(Object.keys(regions[region]).sort(),['grass','jaywalker','road']),'Reactive cause set changed');
   for(const [cause,count] of [['grass',4],['road',4],['jaywalker',6]]){
    const lines=regions[region][cause];
    requireMatch(Array.isArray(lines)&&lines.length===count,'Reactive cause-local source count changed');
    for(let slot=0;slot<count;slot++){
     const row=lines[slot];
     requireMatch(row&&sameJson(Object.keys(row).sort(),['english','id','text'])&&typeof row.id==='string'&&/^[a-z0-9-]+$/.test(row.id)&&typeof row.text==='string'&&row.text.trim()&&typeof row.english==='string'&&row.english.trim(),'Reactive stable ID/text/English row malformed');
     rows.push({clipId:row.id,voiceId:actorId,actorId,region,slot,sourceLocator:'game.js crowdReactiveBarks['+actorId+'].'+region+'.'+cause+'['+slot+']',text:row.text,english:row.english,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null,cause});
    }
   }
  }
 }
 requireMatch(rows.length===252&&new Set(rows.map(row=>row.clipId)).size===252&&new Set(rows.map(row=>row.profileId)).size===9,'Reactive exact nine-owner/252-slot set changed');
 return new Map(rows.map(row=>[row.clipId,row]));
}
function reactiveJobsMatch(jobs,authored){
 return Array.isArray(jobs)&&jobs.length===252&&new Set(jobs.map(row=>row.clipId)).size===252&&jobs.every(row=>authored.has(row.clipId)&&Object.keys(row).length===reactivePublicJobFields.length&&Object.entries(authored.get(row.clipId)).every(([key,value])=>sameJson(row[key],value)));
}
export function reactiveFullPlan(cast,snapshot,sourceRoot=root){
 requireMatch(typeof snapshot?.text==='string'&&snapshot.sha256===textHash(snapshot.text),'Reactive request bytes changed');
 const plan=JSON.parse(snapshot.text),authored=reactiveSourceMap(cast,sourceRoot);
 requireMatch(plan.family==='crowd-dialogue'&&plan.sourceScope===reactiveScope&&plan.publicAssetFamily==='assets/voices/candidate-dialogue'&&plan.privateReviewFamily==='GermanySimulator crowd dialogue review 2026-10-15'&&plan.requestedLineCount===252&&reactiveJobsMatch(plan.jobs,authored),'Not the exact reactive 252-row source/English/owner/profile request');
 requireMatch(sameJson(Object.keys(plan.sourceSha256||{}).sort(),reactiveSourceFiles.slice().sort())&&reactiveSourceFiles.every(path=>plan.sourceSha256[path]===hash(resolve(sourceRoot,path)))&&plan.authoringHelperSha256===reactiveAuthoringHelperSha256&&hash(resolve(sourceRoot,'tools/build-knick-voice.py'))===reactiveAuthoringHelperSha256,'Reactive current source/producer pins changed');
 return {plan,authored:new Map(plan.jobs.map(row=>[row.clipId,row]))};
}
function reactiveManifestSlots(cast,manifest,authored){
 const owned=[...authored.values()].filter(row=>row.voiceId===manifest.voiceId),records=[...(manifest.clips||[]),...(manifest.heldPrivate||[])];
 requireMatch(manifest.sourceScope===reactiveScope&&owned.length===28&&manifest.profileId===cast.productionVoices[manifest.voiceId]?.profileId&&manifest.requestedLineCount===28&&Array.isArray(manifest.clips)&&Array.isArray(manifest.heldPrivate)&&manifest.lineCount===manifest.clips.length&&Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=28&&records.length===28&&new Set(records.map(row=>row.clipId)).size===28,'Reactive per-voice accounting differs from 28 unique slots');
 for(const row of records){const job=owned.find(job=>job.clipId===row.clipId);requireMatch(job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value)),'Reactive accepted/held source identity drift');}
 requireMatch(manifest.heldPrivate.every(row=>typeof row.reason==='string'&&row.reason.trim()),'Reactive held reason missing');
 return owned;
}
function reactiveHoldReasons(manifest,selected){
 for(const row of manifest.heldPrivate)requireMatch(selected.includes(row.clipId)?row.reason==='held private; selected production fallback':row.reason==='not rendered; selected production fallback','Reactive hold reason misstates allocation');
}
export function prepareReactiveManifest(cast,manifest,authorityProof,terminalProofs,selectionProof=null,sourceRoot=root){
 requireMatch(authorityProof?.sha256===hash(authorityProof.path),'Reactive authority bytes changed');
 const authority=json(authorityProof.path);
 requireMatch(authority.status==='ROOT_SEALED_FINITE_NAMED_REACTIVE'&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.sourceScope===reactiveScope&&authority.helperSha256===reactiveAuthoringHelperSha256&&authority.grantId?.trim()&&/^[a-f0-9]{64}$/.test(authority.adapterSha256)&&authority.protectedPublicPins&&Object.keys(authority.protectedPublicPins).length>0&&authority.maximumCallsPerClip===1&&authority.automaticRetries===0,'No reactive-specific finite ROOT authority');
 requireMatch(hash(authority.requestPath)===authority.requestSha256,'Reactive authored request changed');
 const {plan,authored}=reactiveFullPlan(cast,{text:readFileSync(authority.requestPath,'utf8'),sha256:authority.requestSha256},sourceRoot),selected=authority.selectedClipIds;
 requireMatch(Array.isArray(selected)&&selected.length>0&&selected.length<=252&&new Set(selected).size===selected.length&&selected.every(id=>authored.has(id))&&authority.maximumNativeCalls===selected.length&&authority.maximumAsrReadings===selected.length*2&&sameJson(authority.sourceSha256,plan.sourceSha256),'Reactive finite selected set/source limits changed');
 const terminals={};
 for(const phase of ['plan','render','process']){
  const ref=terminalProofs?.[phase];requireMatch(ref&&hash(ref.path)===ref.sha256,'Missing reactive phase receipt');
  const terminal=json(ref.path);
  requireMatch(terminal.phase===phase&&terminal.specificationSha256===authorityProof.sha256&&terminal.logsComplete===true&&terminal.producerSha256===authority.adapterSha256&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&Array.isArray(terminal.survivingOwnedChildren)&&terminal.survivingOwnedChildren.length===0&&Array.isArray(terminal.ownedCleanupKills)&&terminal.ownedCleanupKills.length===0&&Array.isArray(terminal.postflightPinFailures)&&terminal.postflightPinFailures.length===0&&terminal.postflightProtectedPinsChecked===Object.keys(authority.protectedPublicPins).length&&!terminal.supervisorError,'Reactive phase did not retire successfully');
  terminals[phase]={sha256:ref.sha256,exitCode:0,rootRetired:true,timedOut:false};
 }
 const owned=reactiveManifestSlots(cast,manifest,authored),voice=manifest.voiceId,family=resolve(authority.musicRoot,plan.privateReviewFamily,reactiveScope);
 requireMatch(realpathSync(family)===family,'Reactive private scope alias');
 const privateFile=relative=>{const file=resolve(family,voice,relative);requireMatch(realpathSync(file)===file&&file.startsWith(resolve(family,voice)+sep)&&!lstatSync(file).isSymbolicLink(),'Reactive private receipt/media alias');return file;};
 const requestPath=privateFile('requests.json'),requestSha256=hash(requestPath),request=json(requestPath);
 requireMatch(request.sourceScope===reactiveScope&&request.authoringHelperSha256===reactiveAuthoringHelperSha256&&request.requestedLineCount===28&&sameJson(request.jobs,owned)&&request.authoredPlanSha256===authority.requestSha256&&sameJson(request.sourceSha256,plan.sourceSha256)&&sameJson(request.authoredPlanSourceSha256,plan.sourceSha256),'Reactive native 28-slot plan changed');
 const ownedSelected=selected.filter(id=>owned.some(row=>row.clipId===id)),rawDirectory=resolve(family,voice,'raw'),encodedDirectory=resolve(family,voice,'encoded');
 const rawNames=existsSync(rawDirectory)?readdirSync(rawDirectory):[],encodedNames=existsSync(encodedDirectory)?readdirSync(encodedDirectory):[];
 const rawIds=rawNames.filter(name=>name.endsWith('.json')&&!name.endsWith('-eos-trace.json')).map(name=>name.slice(0,-5)),wavIds=rawNames.filter(name=>name.endsWith('.wav')).map(name=>name.slice(0,-4));
 const encodedIds=encodedNames.filter(name=>name.endsWith('.json')).map(name=>name.slice(0,-5)),mp3Ids=encodedNames.filter(name=>name.endsWith('.mp3')).map(name=>name.slice(0,-4));
 requireMatch(sameJson(rawIds.sort(),ownedSelected.slice().sort())&&sameJson(wavIds.sort(),ownedSelected.slice().sort())&&rawNames.every(name=>ownedSelected.some(id=>[id+'.json',id+'.wav',id+'-eos-trace.json'].includes(name))),'Reactive raw receipt/media set differs from finite allocation');
 requireMatch(sameJson(encodedIds.sort(),mp3Ids.sort())&&encodedIds.every(id=>ownedSelected.includes(id))&&encodedNames.every(name=>ownedSelected.some(id=>[id+'.json',id+'.mp3',id+'-processed.wav'].includes(name))),'Reactive encoded receipt/media set contains an orphan or unallocated take');
 const allocatedTakes={};
 for(const id of ownedSelected){
  const rawPath=privateFile('raw/'+id+'.json'),raw=json(rawPath),job=authored.get(id),seed=71000+owned.findIndex(row=>row.clipId===id),profileJsonSha256=authority.profileBindings?.[voice]?.profileJsonSha256;
  requireMatch(Object.entries(job).every(([key,value])=>sameJson(raw[key],value))&&raw.requestSha256===requestSha256&&raw.authoringHelperSha256===reactiveAuthoringHelperSha256&&raw.rendererInputText===job.text&&raw.rendererInputBasis==='exact authored source'&&raw.synthesisAttempt===1&&raw.seed===seed&&authority.seeds?.[id]===seed&&/^[a-f0-9]{64}$/.test(profileJsonSha256)&&raw.profileJsonSha256===profileJsonSha256&&hash(privateFile('raw/'+id+'.wav'))===raw.rawSha256,'Reactive allocated raw take missing or misbound');
  const evidence={rawReceiptSha256:hash(rawPath),rawSha256:raw.rawSha256,profileJsonSha256,seed};
  if(encodedIds.includes(id)){
   const encodedPath=privateFile('encoded/'+id+'.json'),encoded=json(encodedPath),audioPath=privateFile('encoded/'+id+'.mp3');
   requireMatch(Object.entries(job).every(([key,value])=>sameJson(encoded[key],value))&&Object.entries(raw).every(([key,value])=>['durationSeconds','status'].includes(key)||sameJson(encoded[key],value))&&hash(audioPath)===encoded.sha256&&readFileSync(audioPath).length===encoded.bytes,'Reactive allocated encoded source/lineage/media changed');
   evidence.encodedReceiptSha256=hash(encodedPath);evidence.encodedSha256=encoded.sha256;
  }
  allocatedTakes[id]=evidence;
 }
 requireMatch(manifest.generatedLineCount===rawIds.length,'Reactive generated count differs from actual raw receipts');
 let selection=null;const selections=new Map();
 requireMatch(manifest.clips.length===0||selectionProof,'Reactive accepted clips require independent ROOT use selection');
 if(selectionProof){
  requireMatch(selectionProof.sha256===hash(selectionProof.path),'Reactive ROOT use selection bytes changed');selection=json(selectionProof.path);
  requireMatch(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&selection.instruction?.trim()&&Array.isArray(selection.clips),'Missing reactive ROOT use selection');
  for(const row of selection.clips){requireMatch(selected.includes(row.clipId)&&!selections.has(row.clipId)&&/^[a-f0-9]{64}$/.test(row.encodedSha256),'Reactive use selection duplicate or outside allocated slots');selections.set(row.clipId,row.encodedSha256);}
  requireMatch(sameJson([...selections.keys()].filter(id=>owned.some(row=>row.clipId===id)).sort(),manifest.clips.map(row=>row.clipId).sort()),'Reactive manifest omits or adds selected own-voice clips');
 }
 const takes={};
 for(const clip of manifest.clips){
  requireMatch(ownedSelected.includes(clip.clipId)&&encodedIds.includes(clip.clipId),'Reactive clip outside actual encoded finite selection');
  requireMatch(selections.get(clip.clipId)===clip.sha256&&Object.entries({status:selection.status,scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:clip.clipId,encodedSha256:clip.sha256}).every(([key,value])=>clip.approval?.[key]===value),'Reactive approval differs from independent ROOT clip/hash selection');
  const rawPath=privateFile('raw/'+clip.clipId+'.json'),encodedPath=privateFile('encoded/'+clip.clipId+'.json'),raw=json(rawPath),encoded=json(encodedPath),seed=allocatedTakes[clip.clipId].seed;
  for(const [key,value] of Object.entries(encoded))requireMatch(sameJson(clip[key],value),'Reactive supplied clip differs from encoded receipt: '+key);
  requireMatch(raw.decode?.maxSpeechTokens===authority.tokenCaps?.[clip.clipId]&&encoded.asrModelSha256===authority.asrModelSha256,'Reactive actual recipe bindings changed');
  const readings=encoded.asrReadings;
  requireMatch(Array.isArray(readings)&&(sameJson(readings.map(row=>row.beamSize),[1])||sameJson(readings.map(row=>row.beamSize),[1,5]))&&readings.at(-1).transcript===encoded.asr&&readings.at(-1).beamSize===encoded.asrBeamSize,'Reactive final encoded ASR reading mismatch');
  const words=readings.at(-1).words?.flatMap(word=>[...word.word.matchAll(/[\p{L}\p{N}_]+/gu)].map(match=>({word:match[0].toLowerCase(),at:word.start,end:word.end})));
  crowdExactCues(encoded);requireMatch(words?.length===encoded.wordCues.length&&encoded.wordCues.every((cue,i)=>words[i].word===cue.word.toLowerCase()&&words[i].at===cue.at&&words[i].end===cue.end),'Reactive cues differ from final encoded word timings');
  const tracePath=privateFile('raw/'+clip.clipId+'-eos-trace.json'),trace=json(tracePath);
  requireMatch(hash(tracePath)===raw.decode?.eosTraceSha256&&trace.clipId===clip.clipId&&trace.text===clip.text&&trace.profileId===clip.profileId&&trace.referenceSha256===clip.referenceSha256&&trace.modelRevision===clip.modelRevision&&policeEosTraceAuthority(raw.decode,trace),'Reactive native EOS trace missing or misbound');
  const proof={...allocatedTakes[clip.clipId],eosTraceSha256:hash(tracePath),maxSpeechTokens:raw.decode.maxSpeechTokens,asrModelSha256:encoded.asrModelSha256,asrBeamSize:encoded.asrBeamSize,asrReadings:readings.length};
  sandaleClipAuthority(cast,clip,proof,requestSha256,seed);takes[clip.clipId]=proof;
 }
 reactiveHoldReasons(manifest,ownedSelected);
 return {schemaVersion:1,sourceScope:reactiveScope,voiceId:voice,profileId:manifest.profileId,fallback:'captions',requestedLineCount:28,generatedLineCount:rawIds.length,lineCount:manifest.clips.length,clips:manifest.clips.map(clip=>({...crowdPublicClip(clip),cause:clip.cause})),heldPrivate:manifest.heldPrivate.map(row=>({...crowdPublicFields(row,reactivePublicJobFields),reason:row.reason})),approvedExistingReuse:[],crowdReactiveAdmission:{status:'ROOT-verified-native-named-reactive',authoritySha256:authorityProof.sha256,grantId:authority.grantId,helperSha256:reactiveAuthoringHelperSha256,authoredPlanSha256:authority.requestSha256,selectionSha256:selectionProof?.sha256??null,requestSha256,sourceSha256:plan.sourceSha256,jobs:plan.jobs,selectedClipIds:selected,terminals,allocatedTakes,takes}};
}
export function reactiveRecordingsBlock(cast,manifests,assetRoot=root,sourceRoot=root){
 const authored=reactiveSourceMap(cast,sourceRoot),clips=[],seen=new Set();
 for(const manifest of manifests){
  const owned=reactiveManifestSlots(cast,manifest,authored),admission=manifest.crowdReactiveAdmission;
  requireMatch(!seen.has(manifest.voiceId),'Duplicate reactive voice manifest');seen.add(manifest.voiceId);
  requireMatch(admission?.status==='ROOT-verified-native-named-reactive'&&admission.helperSha256===reactiveAuthoringHelperSha256&&admission.grantId?.trim()&&[admission.authoritySha256,admission.authoredPlanSha256,admission.requestSha256].every(value=>/^[a-f0-9]{64}$/.test(value))&&sameJson(Object.keys(admission.sourceSha256||{}).sort(),reactiveSourceFiles.slice().sort())&&Object.values(admission.sourceSha256).every(value=>/^[a-f0-9]{64}$/.test(value))&&reactiveJobsMatch(admission.jobs,authored)&&sameJson(Object.keys(admission.takes||{}).sort(),manifest.clips.map(row=>row.clipId).sort()),'Reactive admission/source/take coverage missing');
  const selected=admission.selectedClipIds;
  requireMatch(Array.isArray(selected)&&selected.length>0&&selected.length<=252&&new Set(selected).size===selected.length&&selected.every(id=>authored.has(id)),'Reactive selected coverage drift');
  const ownedSelected=selected.filter(id=>owned.some(row=>row.clipId===id)),ordered=admission.jobs.filter(row=>row.voiceId===manifest.voiceId);
  requireMatch(manifest.generatedLineCount===ownedSelected.length&&sameJson(Object.keys(admission.allocatedTakes||{}).sort(),ownedSelected.slice().sort()),'Reactive generated/raw evidence coverage drift');
  for(const id of ownedSelected){
   const proof=admission.allocatedTakes[id];
   requireMatch(['rawReceiptSha256','rawSha256','profileJsonSha256'].every(key=>/^[a-f0-9]{64}$/.test(proof?.[key]))&&proof.seed===71000+ordered.findIndex(row=>row.clipId===id)&&(!Object.hasOwn(proof,'encodedReceiptSha256')&&!Object.hasOwn(proof,'encodedSha256')||['encodedReceiptSha256','encodedSha256'].every(key=>/^[a-f0-9]{64}$/.test(proof[key]))),'Reactive allocated byte evidence missing');
  }
  requireMatch(sameJson(Object.keys(admission.terminals||{}).sort(),['plan','process','render'])&&['plan','render','process'].every(phase=>{const row=admission.terminals[phase];return row&&/^[a-f0-9]{64}$/.test(row.sha256)&&row.exitCode===0&&row.rootRetired===true&&row.timedOut===false}),'Reactive successful terminal evidence missing');
  requireMatch(manifest.clips.length===0||/^[a-f0-9]{64}$/.test(admission.selectionSha256),'Reactive public selection evidence missing');
  reactiveHoldReasons(manifest,ownedSelected);
  for(const clip of manifest.clips){
   requireMatch(ownedSelected.includes(clip.clipId)&&Object.entries(admission.allocatedTakes[clip.clipId]).every(([key,value])=>sameJson(admission.takes[clip.clipId]?.[key],value)),'Reactive accepted take differs from allocated evidence');
   sandaleClipAuthority(cast,clip,admission.takes[clip.clipId],admission.requestSha256,71000+ordered.findIndex(row=>row.clipId===clip.clipId));
   clips.push({...clip,provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256});
  }
 }
 return fixedRecordingsBlock(cast,{clips},'crowd-dialogue',assetRoot,sourceRoot).replace('const crowdRecordings=','const crowdReactiveRecordings=');
}
// BEGIN exact Ruediger pilot homophone admission v1
// The named joined parent has its own truthful proof; ordinary fixed-take gates do not change.
const ruedigerPilotHomophoneScope='exact-ruediger-pilot-homophone';
const ruedigerPilotHomophoneManifestPath='assets/voices/candidate-dialogue/crowd-ruediger-rasenkante-exact-pilot-homophone-crowd-manifest.json';
const ruedigerPilotHomophoneHold='outside exact pilot disposition; existing production preserved';
const ruedigerPilotProjectionFields=['schema','qualified','verificationMode','asrWordExact','asrLiteralWordExact','originalStrictParentGate','asrHomophoneWordEquivalent','selectedBeamSize','projection','wordCues','clipId','voiceId','profileId','textSha256','originalEncodedReceiptSha256','encodedSha256','rawReceiptSha256','rawSha256','authoritySha256','continuationTerminalSha256','ledgerSha256','originalCueGate','originalPostflightQualified','referenceLicense','modelLicense','technicalEligible','listeningVerified','publicationAuthorized','status','generationCalls','parentGenerationCalls','segmentDiagnosticAsrCalls','parentGermanAsrCalls','totalAsrCalls','retryBudget','evidenceFiles'];
function ruedigerPilotHomophoneProjectionAuthority(clip,projection){
 const a=ruedigerPilotHomophone;
 requireMatch(projection&&sameJson(Object.keys(projection).sort(),ruedigerPilotProjectionFields.slice().sort()),'Pilot homophone sidecar public fields changed');
 const derived=projectRuedigerPilotHomophoneCues(clip);
 requireMatch(Object.entries(derived).every(([key,value])=>sameJson(projection[key],value)),'Pilot homophone sidecar is not the exact retained-timing projection');
 requireMatch(projection.schema==='exact-pilot-homophone-cue-projection-v1'&&projection.qualified===true&&projection.clipId===a.clipId&&projection.voiceId===a.voiceId&&projection.profileId===a.profileId&&projection.textSha256===a.textSha256&&projection.originalEncodedReceiptSha256===a.encodedReceiptSha256&&projection.encodedSha256===a.sha256&&projection.authoritySha256===a.authoritySha256&&projection.continuationTerminalSha256===a.terminalSha256&&projection.rawSha256===clip.rawSha256&&ruedigerPilotHash(projection.rawReceiptSha256)&&ruedigerPilotHash(projection.ledgerSha256),'Pilot homophone sidecar identity or byte lineage changed');
 requireMatch(projection.originalCueGate==='FAIL'&&projection.originalPostflightQualified===false&&projection.referenceLicense==='CC0-1.0'&&projection.modelLicense==='MIT'&&projection.technicalEligible===true&&projection.listeningVerified===false&&projection.publicationAuthorized===false&&projection.status==='homophone-equivalent; literal ASR mismatch retained'&&projection.generationCalls===3&&projection.parentGenerationCalls===0&&projection.segmentDiagnosticAsrCalls===3&&projection.parentGermanAsrCalls===2&&projection.totalAsrCalls===5&&projection.retryBudget===0,'Pilot sidecar rewrote original failure, license or listening status');
 const evidence=projection.evidenceFiles;
 requireMatch(Array.isArray(evidence)&&evidence.length>=25&&evidence.every(row=>row&&sameJson(Object.keys(row),['sha256'])&&ruedigerPilotHash(row.sha256)),'Pilot public evidence must contain only exact byte digests');
 const required=[a.encodedReceiptSha256,a.sha256,projection.rawReceiptSha256,clip.rawSha256,a.authoritySha256,a.terminalSha256,projection.ledgerSha256,a.requestSha256,a.pilotPlanSha256,a.authoredPlanSha256,...clip.codeSwitchParts.flatMap(part=>['rawReceiptSha256','diagnosticReceiptSha256','rawSha256','encodedSha256','eosTraceSha256'].map(key=>part[key]))];
 requireMatch(required.every(digest=>evidence.some(row=>row.sha256===digest)),'Pilot sidecar lacks original parent/segment/ledger byte proof');
 return derived;
}
function ruedigerPilotHomophoneClipAuthority(cast,clip,admission,sourceRoot=root){
 const a=ruedigerPilotHomophone;
 requireMatch(admission?.status==='ROOT-verified-exact-ruediger-pilot-homophone'&&admission.generationScope===ruedigerPilotHomophoneScope&&admission.authoritySha256===a.authoritySha256&&admission.helperSha256===a.authoringHelperSha256&&admission.requestSha256===a.requestSha256&&admission.authoredPlanSha256===a.authoredPlanSha256&&admission.pilotPlanSha256===a.pilotPlanSha256&&ruedigerPilotHash(admission.selectionSha256),'Missing exact-pilot admission/selection lineage');
 requireMatch(clip.clipId===a.clipId&&clip.file==='assets/voices/candidate-dialogue/'+a.clipId+'.mp3'&&clip.sha256===a.sha256&&clip.profileJsonSha256===a.profileJsonSha256&&matchesProduction(cast,clip),'Pilot public clip selected profile, bytes or path changed');
 const binding=cast.productionVoices[a.voiceId],owners=cast.roleProfiles.filter(row=>row.gameRole===a.voiceId);
 requireMatch(owners.length===1&&owners[0].voiceId===a.voiceId&&owners[0].secretTunnelProfileId===a.profileId&&owners[0].reference?.license==='CC0-1.0'&&owners[0].reference?.workingReferenceSha256===a.referenceOriginalSha256&&binding?.profileId===a.profileId&&binding.originalSha256===a.referenceOriginalSha256&&binding.referenceSha256===a.referenceSha256&&binding.renderer===a.renderer&&binding.modelRevision===a.modelRevision&&(binding.processing??null)===null&&clip.referenceLicense==='CC0-1.0'&&clip.modelLicense==='MIT','Pilot current owner/reference/license/recipe changed');
 const authored=crowdSourceMap(cast,sourceRoot).get(a.clipId);
 requireMatch(authored&&Object.entries(authored).every(([key,value])=>sameJson(clip[key],value)),'Pilot current authored text, English, actor or selected source tuple changed');
 requireMatch(Array.isArray(clip.originalWordCues)&&clip.originalWordCues.length===0&&clip.asrWordExact===false&&clip.asrLiteralWordExact===false&&clip.codeSwitchStrictParentGate===false&&clip.asrHomophoneWordEquivalent===true&&clip.verificationMode==='full-encoded-parent-single-token-homophone','Pilot original failed gates or named verification mode changed');
 const original={...clip,wordCues:clip.originalWordCues},derived=ruedigerPilotHomophoneProjectionAuthority(original,admission.projection);
 requireMatch(sameJson(clip.wordCues,derived.wordCues)&&admission.projectionSha256===textHash(JSON.stringify(admission.projection)),'Pilot projected cues or sidecar digest changed');
 const approval=clip.approval;
 requireMatch(sameJson(Object.keys(approval||{}).sort(),['clipId','date','encodedSha256','instruction','scope','status'])&&approval.status==='user-approved'&&approval.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(approval.date)&&typeof approval.instruction==='string'&&approval.instruction.trim()&&approval.clipId===a.clipId&&approval.encodedSha256===a.sha256,'Pilot lacks exact clip/hash use selection');
 requireMatch(clip.listening==='pending'&&clip.listeningVerified===false&&clip.listeningConfirmed===false&&clip.status==='homophone-equivalent; literal ASR mismatch retained; human listening pending','Pilot does not have a human listening claim');
 requireMatch(sameJson(Object.keys(admission.takes||{}),[a.clipId]),'Pilot admission must prove only the exact selected parent');
 const take=admission.takes[a.clipId];
 requireMatch(take.rawReceiptSha256===admission.projection.rawReceiptSha256&&take.encodedReceiptSha256===a.encodedReceiptSha256&&take.rawSha256===clip.rawSha256&&take.encodedSha256===a.sha256&&take.profileJsonSha256===a.profileJsonSha256&&take.projectionSha256===admission.projectionSha256&&take.ledgerSha256===admission.projection.ledgerSha256&&take.segmentGenerationCalls===3&&take.parentGenerationCalls===0&&take.parentGermanAsrCalls===2&&take.totalAsrCalls===5&&take.synthesisAttempt===0,'Pilot take proof lost joined-parent byte lineage or actual call accounting');
 return derived;
}
function ruedigerPilotHomophoneManifestAuthority(cast,manifest,sourceRoot=root){
 const a=ruedigerPilotHomophone;
 requireMatch(manifest.generationScope===ruedigerPilotHomophoneScope&&manifest.schemaVersion===1&&manifest.voiceId===a.voiceId&&manifest.profileId===a.profileId&&manifest.fallback==='captions'&&manifest.requestedLineCount===4&&manifest.generatedLineCount===0&&manifest.joinedLineCount===1&&manifest.segmentGenerationCalls===3&&manifest.parentGenerationCalls===0&&manifest.parentGermanAsrCalls===2&&manifest.totalAsrCalls===5&&manifest.lineCount===1&&Array.isArray(manifest.clips)&&manifest.clips.length===1&&manifest.clips[0]?.clipId===a.clipId&&Array.isArray(manifest.heldPrivate)&&manifest.heldPrivate.length===3&&Array.isArray(manifest.approvedExistingReuse)&&manifest.approvedExistingReuse.length===0,'Pilot manifest is not one joined parent and three preserved slots');
 const owned=[...crowdSourceMap(cast,sourceRoot).values()].filter(row=>row.voiceId===a.voiceId),records=[...manifest.clips,...manifest.heldPrivate];
 requireMatch(owned.length===4&&new Set(records.map(row=>row.clipId)).size===4&&records.every(row=>{const job=owned.find(job=>job.clipId===row.clipId);return job&&Object.entries(job).every(([key,value])=>sameJson(row[key],value))}),'Pilot manifest changed a current owned source/English slot');
 requireMatch(manifest.heldPrivate.every(row=>row.clipId!==a.clipId&&row.reason===ruedigerPilotHomophoneHold&&sameJson(Object.keys(row).sort(),[...crowdPublicJobFields,'reason'].sort())),'Pilot must preserve other production slots without claiming generation or reuse');
 ruedigerPilotHomophoneClipAuthority(cast,manifest.clips[0],manifest.crowdAdmission,sourceRoot);
 return manifest.clips[0];
}
export function prepareRuedigerPilotHomophoneManifest(cast,collection,selectionProof,sourceRoot=root){
 requireRuedigerPilotCollectedEvidence(collection);
 const a=ruedigerPilotHomophone;
 requireMatch(sameJson(cast,json(resolve(sourceRoot,'For-AI/VOICE-CAST.json'))),'Pilot admission cast differs from current public source');
 requireMatch(collection&&collection.clip&&collection.projection,'Missing ROOT-collected exact-pilot source proof');
 const original=ruedigerPilotPublicClip(collection.clip),projection=collection.projection;
 ruedigerPilotHomophoneProjectionAuthority(original,projection);
 requireMatch(selectionProof&&ruedigerPilotHash(selectionProof.sha256)&&selectionProof.sha256===hash(selectionProof.path),'Pilot clip/hash use selection bytes changed');
 const selection=json(selectionProof.path);
 requireMatch(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&/^\d{4}-\d{2}-\d{2}$/.test(selection.date)&&typeof selection.instruction==='string'&&selection.instruction.trim()&&!selection.listeningVerified&&!selection.listeningConfirmed&&Array.isArray(selection.clips)&&selection.clips.length===1&&sameJson(Object.keys(selection.clips[0]).sort(),['clipId','encodedSha256'])&&selection.clips[0].clipId===a.clipId&&selection.clips[0].encodedSha256===a.sha256,'Pilot selection must name only the exact retained parent bytes');
 const approval={status:selection.status,scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:a.clipId,encodedSha256:a.sha256},projectionSha256=textHash(JSON.stringify(projection));
 const clip={...original,file:'assets/voices/candidate-dialogue/'+a.clipId+'.mp3',originalWordCues:[],wordCues:projection.wordCues,asrHomophoneWordEquivalent:true,verificationMode:projection.verificationMode,approval,listening:'pending',listeningVerified:false,listeningConfirmed:false,status:'homophone-equivalent; literal ASR mismatch retained; human listening pending'};
 const owned=[...crowdSourceMap(cast,sourceRoot).values()].filter(row=>row.voiceId===a.voiceId);
 const take={rawReceiptSha256:projection.rawReceiptSha256,encodedReceiptSha256:a.encodedReceiptSha256,rawSha256:clip.rawSha256,encodedSha256:a.sha256,profileJsonSha256:a.profileJsonSha256,projectionSha256,ledgerSha256:projection.ledgerSha256,segmentGenerationCalls:3,parentGenerationCalls:0,parentGermanAsrCalls:2,totalAsrCalls:5,synthesisAttempt:0};
 const result={schemaVersion:1,generationScope:ruedigerPilotHomophoneScope,voiceId:a.voiceId,profileId:a.profileId,fallback:'captions',status:'homophone-equivalent; original literal/strict/cue failure retained; human listening pending',requestedLineCount:4,generatedLineCount:0,joinedLineCount:1,segmentGenerationCalls:3,parentGenerationCalls:0,parentGermanAsrCalls:2,totalAsrCalls:5,lineCount:1,clips:[clip],heldPrivate:owned.filter(row=>row.clipId!==a.clipId).map(row=>({...crowdPublicFields(row,crowdPublicJobFields),reason:ruedigerPilotHomophoneHold})),approvedExistingReuse:[],crowdAdmission:{status:'ROOT-verified-exact-ruediger-pilot-homophone',generationScope:ruedigerPilotHomophoneScope,authoritySha256:a.authoritySha256,helperSha256:a.authoringHelperSha256,requestSha256:a.requestSha256,authoredPlanSha256:a.authoredPlanSha256,pilotPlanSha256:a.pilotPlanSha256,selectionSha256:selectionProof.sha256,projectionSha256,projection,takes:{[a.clipId]:take}}};
 ruedigerPilotHomophoneManifestAuthority(cast,result,sourceRoot);
 return result;
}
// END exact Ruediger pilot homophone admission v1

export function main(args=process.argv.slice(2)){
 requireMatch(!(args.includes('--sync')&&args.includes('--rename-production')),'Rename production profiles first, then sync their verified bindings');
 const value=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
 const cast=json(resolve(root,'For-AI/VOICE-CAST.json'));
 requireMatch(new Set(Object.values(cast.productionVoices).map(p=>p.profileId)).size===Object.keys(cast.productionVoices).length,'Production characters share a profile UUID');
 const gapCollect=value('--collect-voice-gap-private-proposal'),gapAdmit=value('--admit-voice-gap-private-proposal');
 if(gapCollect||gapAdmit){
  const sourceRoot=resolve(value('--gap-source-root')||root),selectionPath=value('--gap-selection-proof'),phases=['plan','render','process'];
  requireMatch(!(gapCollect&&gapAdmit)&&!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&!args.includes('--rename-production')&&!value('--voice-exe')&&selectionPath&&phases.every(phase=>value('--gap-'+phase+'-terminal')),'Gap modes require exclusive authority, all terminals, source and exact selection proof');
  const authorityPath=resolve(gapAdmit||gapCollect),proof={path:authorityPath,sha256:hash(authorityPath)},selectionFile=resolve(selectionPath),selection={path:selectionFile,sha256:hash(selectionFile)};
  const terminals=Object.fromEntries(phases.map(phase=>{const path=resolve(value('--gap-'+phase+'-terminal'));return [phase,{path,sha256:hash(path)}]}));
  console.log(JSON.stringify(gapAdmit?admitVoiceGapPrivateProposals(cast,proof,terminals,selection,sourceRoot,root):collectVoiceGapPrivateManifestProposals(cast,proof,terminals,selection,sourceRoot),null,2));return;
 }
 const policeCollect=value('--collect-police-private-proposal');
 const policeAdmit=value('--admit-police-private-proposal');
 if(policeCollect||policeAdmit){
  const sourceRoot=resolve(value('--police-source-root')||root),planPath=value('--police-plan-terminal'),renderPath=value('--police-render-terminal'),processPath=value('--police-process-terminal'),selectionPath=value('--police-selection-proof');
  requireMatch(!(policeCollect&&policeAdmit)&&!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&!args.includes('--rename-production')&&!value('--voice-exe')&&planPath&&renderPath&&processPath&&selectionPath,'Police proposal/admission modes are exclusive; pass all three phase terminals and exact selection proof without other curator operations');
  const selectionFile=resolve(selectionPath),terminals={plan:{path:resolve(planPath),sha256:hash(resolve(planPath))},render:{path:resolve(renderPath),sha256:hash(resolve(renderPath))},process:{path:resolve(processPath),sha256:hash(resolve(processPath))}};
  const authorityFile=resolve(policeAdmit||policeCollect),authorityProof={path:authorityFile,sha256:hash(authorityFile)},selectionProof={path:selectionFile,sha256:hash(selectionFile)};
  const result=policeAdmit?admitPolice12PrivateProposals(cast,authorityProof,terminals,selectionProof,sourceRoot,root):collectPolice12PrivateManifestProposals(cast,authorityProof,terminals,selectionProof,sourceRoot);
  console.log(JSON.stringify(result,null,2));return;
 }
 const quizAdmit=value('--admit-quiz-german9-private-proposal');
 if(quizAdmit){
  const sourceRoot=resolve(value('--quiz-source-root')||root),destinationRoot=resolve(value('--quiz-destination-root')||root),inventoryPath=value('--quiz-inventory'),planPath=value('--quiz-plan-terminal'),renderPath=value('--quiz-render-terminal'),processPath=value('--quiz-process-terminal');
  requireMatch(!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&!args.includes('--rename-production')&&!value('--voice-exe')&&inventoryPath&&planPath&&renderPath&&processPath,'German9 admission is exclusive; pass the 724-slot public inventory and all three sealed phase terminals');
  const authorityPath=resolve(quizAdmit),inventoryFile=resolve(inventoryPath),terminals={plan:{path:resolve(planPath),sha256:hash(resolve(planPath))},render:{path:resolve(renderPath),sha256:hash(resolve(renderPath))},process:{path:resolve(processPath),sha256:hash(resolve(processPath))}};
  const authorityProof={path:authorityPath,sha256:hash(authorityPath)},inventoryProof={path:inventoryFile,sha256:hash(inventoryFile)};
  console.log(JSON.stringify(admitQuizGerman9PrivateProposals(cast,authorityProof,terminals,inventoryProof,sourceRoot,destinationRoot),null,2));return;
 }
 const cityProposal=value('--prepare-city-manifest'),cityAdmission=value('--admit-city-manifest'),cityMouthAdmission=value('--admit-city-mouth-energy');
 const crowdMouthAdmission=value('--admit-crowd-mouth-energy');
 const crowdMouthMeasurement=value('--measure-crowd-mouth-energy');
 const remainingMouthMeasurement=value('--measure-crowd-remaining-mouth-energy'),remainingMouthAdmission=value('--admit-crowd-remaining-mouth-energy');
 if(remainingMouthMeasurement||remainingMouthAdmission){
  requireMatch(!(remainingMouthMeasurement&&remainingMouthAdmission)&&!crowdMouthMeasurement&&!crowdMouthAdmission&&!cityMouthAdmission&&!cityProposal&&!cityAdmission&&!args.includes('--sync')&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')&&value('--crowd-mouth-ffmpeg'),'Remaining11 mouth requires one bounded phase and pinned decoder');
  const decoder=resolve(value('--crowd-mouth-ffmpeg'));
  if(remainingMouthMeasurement){console.log(JSON.stringify(measureCrowdRemainingMouthEnergy(cast,decoder,resolve(remainingMouthMeasurement))));return;}
  requireMatch(value('--crowd-mouth-admission-run'),'Remaining11 mouth admission requires a fresh per-child log directory');
  const path=resolve(remainingMouthAdmission);console.log(JSON.stringify(admitCrowdRemainingMouthEnergy(cast,json(path),hash(path),decoder,resolve(value('--crowd-mouth-admission-run')))));return;
 }
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
 checkQuizGerman9AdmittedCatalog(cast,source,root,root);
 const gapManifests=voiceGapManifests(cast,source,root,root);
 const policeDirectory=resolve(root,'assets/voices/police-dialogue'),policeAccepted=policeAdmissions(source),policeManifests=existsSync(policeDirectory)?readdirSync(policeDirectory).filter(name=>name.endsWith('-manifest.json')&&!name.endsWith('-gap-manifest.json')).sort().map(name=>{const relative=`assets/voices/police-dialogue/${name}`,path=resolve(root,relative),sha256=hash(path);requireMatch(policeAccepted[relative]===sha256,'Police manifest has no verified private-use admission');const value=json(path);policeManifestAuthority(cast,value,root);return {...value,provenanceManifest:relative,provenanceManifestSha256:sha256}}):[];
 const policeBlock=policeRecordingsBlock(cast,policeManifests,root,root),policeBlockPattern=/const policeRecordings=Object\.freeze\([\s\S]*?\}\)\(\)\);\n/;
 if(policeManifests.length||gapManifests.some(row=>row.family==='police-dialogue'))fixedAssetInventory('police-dialogue',[...policeManifests,...gapManifests.filter(row=>row.family==='police-dialogue')].flatMap(row=>row.clips));
 if(args.includes('--sync')){source=source.replace(policeBlockPattern,'').replace('const recordings=Object.freeze({',()=>policeBlock+'const recordings=Object.freeze({');if(!source.includes(' ...policeRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...policeRecordings,');}
 else requireMatch(source.match(policeBlockPattern)?.[0]===policeBlock,'Police recording lookup stale; run --sync');
 if(gapManifests.length||source.match(voiceGapBlockPattern)){
  const gapBlock=voiceGapRecordingsBlock(cast,gapManifests,root,root);
  if(args.includes('--sync'))source=installVoiceGapCatalog(source,gapBlock,voiceGapAdmissions(source));
  else requireMatch(source.match(voiceGapBlockPattern)?.[0]===gapBlock,'Typed gap recording projection stale; run --sync');
 }
 if(gapManifests.some(row=>row.family==='traffic-dialogue'))fixedAssetInventory('traffic-dialogue',gapManifests.filter(row=>row.family==='traffic-dialogue').flatMap(row=>row.clips));
 const crowdDir=resolve(root,'assets/voices/candidate-dialogue'),crowdAdmitted=crowdAdmissions(source),crowdManifests=readdirSync(crowdDir).filter(name=>name.endsWith('-crowd-manifest.json')).sort().map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`,file=resolve(root,relative),sha256=hash(file),manifest=json(file);verifyCrowdGenerationManifestLedger(manifest,relative,sha256,crowdAdmitted);return {...manifest,provenanceManifest:relative,provenanceManifestSha256:sha256};});
 const crowdBlock=crowdCandidateBlock(cast,crowdManifests,root),crowdPattern=/const crowdCandidateDialogue=Object\.freeze\(\{[^\n]*\}\);\n/;
 if(args.includes('--sync'))source=source.replace(crowdPattern,()=>crowdBlock);
 else requireMatch(source.match(crowdPattern)?.[0]===crowdBlock,'Crowd candidate projection stale; run --sync');
 const crowdMouth=crowdExpandedMouthEnergyFromCatalog(source,crowdManifests,root);
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
 const reactiveDirectory=resolve(root,'assets/voices/candidate-dialogue'),reactiveNames=existsSync(reactiveDirectory)?readdirSync(reactiveDirectory).filter(name=>name.endsWith('-reactive-manifest.json')).sort():[];
 if(reactiveNames.length||source.includes('const crowdReactiveAdmissions=')||source.includes('const crowdReactiveRecordings=')||source.includes(' ...crowdReactiveRecordings,')){
  const ledger=JSON.parse(source.match(/const crowdReactiveAdmissions=Object\.freeze\((\{[^\n]*\})\);\n/)?.[1]||'{}');
  requireMatch(reactiveNames.length>0&&sameJson(Object.keys(ledger).sort(),reactiveNames.map(name=>'assets/voices/candidate-dialogue/'+name).sort()),'Reactive manifest/ledger set is missing or stale');
  const reactiveManifests=reactiveNames.map(name=>{const relative='assets/voices/candidate-dialogue/'+name,file=resolve(root,relative),digest=hash(file),manifest=json(file);requireMatch(name===manifest.voiceId+'-reactive-manifest.json'&&ledger[relative]===digest,'Reactive manifest lacks its separate verified admission anchor');return {...manifest,provenanceManifest:relative,provenanceManifestSha256:digest}});
  const block=reactiveRecordingsBlock(cast,reactiveManifests,root,root),pattern=/const crowdReactiveRecordings=Object\.freeze\([^\n]*\);\n/;
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...crowdReactiveRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...crowdReactiveRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block&&source.includes(' ...crowdReactiveRecordings,'),'Reactive recording lookup stale; run --sync only after separate admission');
 }
 const sandaleDirectory=resolve(root,'assets/voices/candidate-dialogue'),sandaleNames=readdirSync(sandaleDirectory).filter(name=>name.endsWith('-sandale-manifest.json')).sort();
 if(sandaleNames.length||source.includes('const sandaleAdmissions=')||source.includes('const sandaleRecordings=')||source.includes(' ...sandaleRecordings,')){
  const ledger=JSON.parse(source.match(/const sandaleAdmissions=Object\.freeze\((\{[^\n]*\})\);\n/)?.[1]||'{}');
  requireMatch(sandaleNames.length>0&&sameJson(Object.keys(ledger).sort(),sandaleNames.map(name=>`assets/voices/candidate-dialogue/${name}`).sort()),'Sandale manifest/ledger set is missing or stale');
  const sandaleManifests=sandaleNames.map(name=>{const relative=`assets/voices/candidate-dialogue/${name}`,file=resolve(root,relative),digest=hash(file),manifest=json(file);requireMatch(name===`${manifest.voiceId}-sandale-manifest.json`&&ledger[relative]===digest,'Sandale manifest lacks its separate verified admission anchor');return {...manifest,provenanceManifest:relative,provenanceManifestSha256:digest}});
  const block=sandaleRecordingsBlock(cast,sandaleManifests,root,root),pattern=/const sandaleRecordings=Object\.freeze\([^\n]*\);\n/;
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...sandaleRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...sandaleRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block&&source.includes(' ...sandaleRecordings,'),'Sandale recording lookup stale; run --sync only after separate admission');
 }

 const ambientMouthBlock=ambientMouthRecordingsBlock(source),ambientMouthPattern=/const ambientMouthRecordings=[^\n]*\n/;
 if(ambientMouthBlock){
  if(args.includes('--sync')){
   source=source.replace(ambientMouthPattern,'').replace('const recordings=Object.freeze({',()=>ambientMouthBlock+'const recordings=Object.freeze({');
   if(!source.includes(' ...ambientMouthRecordings('))source=source.replace(' ...streetWisdomRecordings,',' ...streetWisdomRecordings,\n ...ambientMouthRecordings({...streetWisdomRecordings,...crowdRecordings,...quizGerman9Recordings}),');
  }else requireMatch(source.match(ambientMouthPattern)?.[0]===ambientMouthBlock&&source.includes(' ...ambientMouthRecordings({...streetWisdomRecordings,...crowdRecordings,...quizGerman9Recordings}),'),'Ambient mouth projection stale; run --sync');
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
