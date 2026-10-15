import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const authoritySha256='38931e93c555200d42cdf681c62b239d97bcbd10b9a51ed30564205dcca8080a';
export const renderHelperSha256='19e5bd4af9c9ea5390987c1331a7e33ded02f435d3638965e43055869cb7a7f9';
export const renderAdapterSha256='070c53649af8d5946e431a55b12018ad6791fe5b73047295dfb16800dbd404f5';
export const unknownLicense='unknown; selected profile does not record reference license';
export const mode='traffic4-license-process-recovery01';
export const voiceId='verkehr-dieter-hupfer';
export const clipIds=['traffic-berlin-01','traffic-berlin-02','traffic-germany-01','traffic-germany-02'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const need=(value,message)=>{if(!value)throw Error(message)};
export const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
export function retired(row,authority,phase,exitCode){
 need(row.phase===phase&&row.specificationSha256===authoritySha256&&row.producerSha256===renderAdapterSha256&&row.exitCode===exitCode&&row.rootRetired===true&&row.timedOut===false&&!row.supervisorError&&row.logsComplete===true,'Prior phase did not retire with the expected outcome');
 need(['survivingOwnedChildren','ownedCleanupKills','postflightPinFailures','postflightPrivatePinFailures','postflightInputPinFailures'].every(key=>Array.isArray(row[key])&&row[key].length===0),'Prior phase has ownership/pin failures');
 need(row.postflightProtectedPinsChecked===authority.expectedProtectedPublicPinCount&&row.postflightProtectedPrivatePinsChecked===authority.expectedProtectedPrivatePinCount&&row.postflightInputPinsChecked===Object.keys(authority.inputPins).length,'Prior phase omitted protected inventories');
}
export function resolveLicense(cast,authority,expected){
 const owners=cast.existingAssetProfiles.filter(row=>row.voiceId===voiceId),binding=cast.productionVoices[voiceId];
 need(owners.length===1,'License metadata must have one existing-asset owner');
 const owner=owners[0],native=authority.profileBindings[voiceId];
 need(authority.voiceId===voiceId&&owner.secretTunnelProfileId===binding.profileId&&binding.profileId===native.profileId&&owner.sourceLicense==='CC0-1.0','License/profile owner mismatch');
 need(owner.referenceSha256===binding.originalSha256&&binding.referenceSha256===native.referenceSha256&&binding.originalSha256===native.referenceOriginalSha256,'Original/normalized reference identity mismatch');
 need(same(owner,expected.owner)&&same(binding,expected.binding)&&owner.source.length===3&&new Set(owner.source.map(row=>row.path)).size===3,'Source owner/components changed');
 need(owner.source.every(row=>/^assets\/voices\/thorsten-angry-[a-z-]+\.mp3$/.test(row.path)&&/^[a-f0-9]{64}$/.test(row.sha256)&&typeof row.text==='string'&&row.text.trim()),'Unverified source component');
 return {status:'verified-existing-asset-license-resolution',metadataOwner:'For-AI/VOICE-CAST.json existingAssetProfiles',voiceId,profileId:binding.profileId,referenceOriginalSha256:binding.originalSha256,referenceSha256:binding.referenceSha256,license:'CC0-1.0',castSha256:expected.castSha256,sourceComponents:owner.source.map(({path,sha256})=>({path,sha256})),originalRawReferenceLicense:unknownLicense};
}
export function rawIdentity(row,receiptSha256){return {clipId:row.clipId,receiptSha256,rawSha256:row.rawSha256,nativeEosReached:row.decode.eosReached,seed:row.seed,actualTakeWithinGrant:1,globalHistoricalOrdinal:row.synthesisAttempt,durationSeconds:row.durationSeconds,profileId:row.profileId,maxSpeechTokens:row.decode.maxSpeechTokens,generatedSpeechTokens:row.decode.generatedSpeechTokens};}
export function validateFacts(authority,request,plan,failed,ledger,raws,proof){
 need(proof.mode===mode&&proof.authoritySha256===authoritySha256&&proof.renderHelperSha256===renderHelperSha256&&proof.renderAdapterSha256===renderAdapterSha256,'Wrong recovery lineage');
 need(authority.status==='ROOT_SEALED_FINITE_VOICE_GAP12'&&authority.sealed===true&&authority.executorThread==='01a13cd8-cbde-75b3-9876-7d75cbe6bef1'&&authority.grantId&&authority.family==='traffic-dialogue'&&authority.privateReviewFamily==='GS-t4-v1'&&authority.voiceId===voiceId,'Wrong typed sealed family');
 need(authority.helperSha256===renderHelperSha256&&authority.adapterSha256===renderAdapterSha256&&authority.maximumNativeCalls===4&&authority.maximumAsrReadings===8&&authority.maximumCallsPerClip===1&&authority.automaticRetries===0&&authority.processPhaseWallSeconds===600,'Original finite bounds changed');
 need(proof.maximumAdditionalNativeCalls===0&&proof.maximumAsrReadings===8&&proof.automaticRetries===0&&proof.processingHelperSha256===renderHelperSha256,'Recovery cannot synthesize or expand ASR');
 need(same(request.jobs.map(row=>row.clipId),clipIds)&&same(authority.selectedClipIds,clipIds)&&request.producerSha256===renderHelperSha256&&request.family==='traffic-dialogue'&&request.privateReviewFamily==='GS-t4-v1'&&same(request.sourceSha256,authority.sourceSha256),'Request source/ownership changed');
 retired(plan,authority,'plan',0);retired(failed,authority,'render',1);
 need(ledger.requestSha256===proof.frozenRequestSha256&&same(ledger.chargedClipIds,clipIds),'Exactly four original native charges required');
 need(raws.length===4&&same(raws.map(row=>row.clipId),clipIds),'Exactly four raw receipts required');
 for(let index=0;index<raws.length;index++){
  const row=raws[index],job=request.jobs[index],pin=proof.rawRows[index];
  need(Object.entries(job).every(([key,value])=>same(row[key],value))&&row.authoringHelperSha256===renderHelperSha256&&row.requestSha256===proof.frozenRequestSha256&&row.profileJsonSha256===authority.profileBindings[voiceId].profileJsonSha256,'Raw source/profile/helper differs');
  need(row.seed===71000+index&&row.synthesisAttempt===1&&authority.seeds[row.clipId]===row.seed&&authority.attempts[row.clipId]===1&&row.rendererInputText===job.text&&row.rendererInputBasis==='exact authored source','Original first-take identity differs');
  need(row.referenceLicense===unknownLicense&&row.decode?.eosReached===true&&row.decode.maxSpeechTokens===authority.tokenCaps[row.clipId]&&row.decode.generatedSpeechTokens>0&&row.decode.generatedSpeechTokens<=row.decode.maxSpeechTokens&&row.decode.eosTraceSha256===pin.traceSha256&&row.decode.attentionHooksBefore===0&&row.decode.attentionHooksAfter===0,'Raw license/EOS evidence differs');
  need(row.rawSha256===pin.rawSha256&&Number.isFinite(row.durationSeconds)&&row.durationSeconds>0,'Raw bytes/native duration changed');
  const s=row.synthesis;need(s.device==='cuda'&&s.precision==='fp16'&&s.t3WeightPrecision==='float16'&&s.conditioningPrecision==='float32'&&s.autocastPrecision==='float16'&&s.conditioningCached===true&&s.referenceReconditionedForProfile===job.profileId&&s.referenceConditioningVerifiedFloat32===true&&s.cpuThreads===2&&s.inferenceMode===true&&s.exaggeration===.5&&s.temperature===.65&&s.repetitionPenalty===3&&s.cfgWeight===.6&&s.languageId==='de','Original native recipe differs');
 }
}
export function inspectRecovery(proof,{verifyAudio=true,stage='before-process'}={}){
 need(['before-process','after-process'].includes(stage),'Unknown recovery stage');
 for(const [file,expected] of Object.entries(proof.metadataPins))need(hash(file)===expected,'Pinned metadata/source changed: '+file);
 const authority=read(proof.authorityPath),request=read(authority.requestPath),raws=proof.rawRows.map(row=>read(row.receiptPath));
 validateFacts(authority,request,read(proof.planTerminalPath),read(proof.failedRenderTerminalPath),read(proof.nativeLedgerPath),raws,proof);
 const stderr=fs.readFileSync(proof.failedRenderStderrPath,'utf8');
 need(/validate_raw/.test(stderr)&&/line 287/.test(stderr)&&stderr.trim().endsWith('RuntimeError: Selected reference license drift')&&fs.readFileSync(proof.failedRenderStdoutPath).length===0,'Failure was not the pinned license-only validation stop');
 const planSummary=read(proof.planSummaryPath),frozen=read(proof.frozenRequestPath);
 need(planSummary.authoritySha256===authoritySha256&&planSummary.nativePlanInvocationThisGrant===true&&planSummary.frozenRequestPins[proof.frozenRequestPath]===proof.frozenRequestSha256&&same(frozen.jobs,request.jobs)&&frozen.authoredPlanSha256===authority.requestSha256,'Genuine original native plan/frozen request changed');
 const resolution=resolveLicense(read(proof.castPath),authority,proof.licenseEvidence);
 for(const pin of proof.rawRows){need(hash(pin.receiptPath)===pin.receiptSha256&&hash(pin.tracePath)===pin.traceSha256,'Raw receipt/EOS trace changed');if(verifyAudio)need(hash(pin.rawPath)===pin.rawSha256,'Completed raw WAV changed');}
 need(proof.licenseEvidence.sourceFiles.length===3&&proof.licenseEvidence.sourceFiles.every((file,index)=>file.path===resolution.sourceComponents[index].path&&file.sha256===resolution.sourceComponents[index].sha256&&authority.protectedPublicPins[file.fullPath]===file.sha256),'Licensed source files must already belong to the protected public inventory');
 if(verifyAudio)for(const component of proof.licenseEvidence.sourceFiles)need(hash(component.fullPath)===component.sha256,'Licensed source component bytes changed');
 const family=path.join(authority.musicRoot,'GS-t4-v1'),owned=path.join(family,voiceId);
 if(stage==='before-process'){
  need(!fs.existsSync(path.join(owned,'traffic-asr-read-ledger.json')),'ASR already charged; no recovery retry');
  for(const job of request.jobs)for(const suffix of ['.json','.mp3','-processed.wav'])need(!fs.existsSync(path.join(owned,'encoded',job.clipId+suffix)),'Encoded output already exists; preserve evidence');
  for(const name of ['process-started.json','process-summary.json','process-license-recovery01-started.json','process-license-recovery01-summary.json'])need(!fs.existsSync(path.join(family,'g',name)),'Processing phase already attempted');
  need(!fs.existsSync(path.join(family,'c/s')),'Processing cache already exists; no reset');
 }
 return {mode,authoritySha256,renderHelperSha256,renderAdapterSha256,processingAdapterSha256:proof.processingAdapterSha256,processingHelperSha256:renderHelperSha256,failedRenderTerminalSha256:proof.metadataPins[proof.failedRenderTerminalPath],maximumAdditionalNativeCalls:0,maximumAsrReadings:8,automaticRetries:0,actualOriginalNativeCalls:4,actualOriginalAsrReadings:0,resolution,rows:raws.map((row,index)=>rawIdentity(row,proof.rawRows[index].receiptSha256)),audioBytesVerified:verifyAudio,stage};
}

export function publicRecovery(proof,proofSha256){
 const resolution=resolveLicense(read(proof.castPath),read(proof.authorityPath),proof.licenseEvidence);
 return {mode,proofSha256,authoritySha256,failedRenderTerminalSha256:proof.metadataPins[proof.failedRenderTerminalPath],planTerminalSha256:proof.metadataPins[proof.planTerminalPath],renderHelperSha256,renderAdapterSha256,processingHelperSha256:proof.processingHelperSha256,processingAdapterSha256:proof.processingAdapterSha256,originalNativeCalls:4,additionalNativeCalls:0,maximumAsrReadings:8,automaticRetries:0,postflightRecoveryPinCount:Object.keys(proof.metadataPins).length+proof.rawRows.length+proof.licenseEvidence.sourceFiles.length,resolution,rawReceipts:Object.fromEntries(proof.rawRows.map(row=>[row.clipId,{rawReceiptSha256:row.receiptSha256,rawSha256:row.rawSha256,eosTraceSha256:row.traceSha256}]))};
}
export function encodedLicenseAuthority(clip,rawReceiptSha256,expected){
 need(clip.referenceLicense==='CC0-1.0'&&clip.originalRawReferenceLicense===unknownLicense&&clip.authoringHelperSha256===renderHelperSha256&&clip.processingHelperSha256===renderHelperSha256&&clip.processingAdapterSha256===expected.processingAdapterSha256&&clip.recoveryProofSha256===expected.proofSha256,'Encoded effective/original license or processing identity missing');
 need(expected.rawReceipts[clip.clipId]?.rawReceiptSha256===rawReceiptSha256&&expected.rawReceipts[clip.clipId]?.rawSha256===clip.rawSha256&&same(clip.referenceLicenseResolution,{...expected.resolution,rawReceiptSha256,recoveryProofSha256:expected.proofSha256}),'Encoded license resolution lost raw/profile/source proof');
}
export function processTerminalAuthority(row,authority,expected){
 need(row.phase==='process'&&row.specificationSha256===authoritySha256&&row.producerSha256===expected.processingAdapterSha256&&row.renderAdapterSha256===renderAdapterSha256&&row.recoveryProofSha256===expected.proofSha256&&row.failedRenderTerminalSha256===expected.failedRenderTerminalSha256&&row.additionalNativeCalls===0&&row.maximumAsrReadings===8,'Process recovery terminal lineage differs');
 need(row.exitCode===0&&row.rootRetired===true&&row.timedOut===false&&!row.supervisorError&&row.logsComplete===true&&['survivingOwnedChildren','ownedCleanupKills','postflightPinFailures','postflightPrivatePinFailures','postflightInputPinFailures','postflightRecoveryPinFailures'].every(key=>Array.isArray(row[key])&&row[key].length===0),'Recovery process ownership/pins failed');
 need(row.postflightProtectedPinsChecked===authority.expectedProtectedPublicPinCount&&row.postflightProtectedPrivatePinsChecked===authority.expectedProtectedPrivatePinCount&&row.postflightInputPinsChecked===Object.keys(authority.inputPins).length&&row.postflightRecoveryPinsChecked===expected.postflightRecoveryPinCount,'Recovery process omitted protected raw/source inventories');
}
export function publicRecoveryAuthority(proof,expected){
 need(same(proof.trafficLicenseRecovery,expected)&&proof.authoritySha256===authoritySha256,'Unknown public traffic recovery');
 const {plan,render,process}=proof.terminals;
 need(plan.sha256===expected.planTerminalSha256&&plan.exitCode===0&&render.sha256===expected.failedRenderTerminalSha256&&render.exitCode===1&&render.completionWitnessOnly===true&&render.licenseRecovery===expected.proofSha256&&process.exitCode===0&&process.licenseRecovery===expected.proofSha256,'Public recovery rewrote/lost original failed-render lineage');
 need(Object.values(proof.terminals).every(row=>row.rootRetired===true&&row.timedOut===false&&/^[a-f0-9]{64}$/.test(row.sha256)),'Public recovery phase ownership incomplete');
}
