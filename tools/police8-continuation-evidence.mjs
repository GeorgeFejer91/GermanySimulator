import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const authoritySha256='99a70315fb2dc8d231afa985204715d59f2cf91dc94ba6a0037bf0456424d25f';
const adapterSha256='070c53649af8d5946e431a55b12018ad6791fe5b73047295dfb16800dbd404f5';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const requireEvidence=(ok,why)=>{if(!ok)throw Error(why)};

export function requireRetired(terminal,authority,phase,exitCode){
 requireEvidence(terminal.phase===phase&&terminal.specificationSha256===authoritySha256&&terminal.producerSha256===adapterSha256&&terminal.exitCode===exitCode&&terminal.rootRetired===true&&terminal.timedOut===false&&!terminal.supervisorError&&terminal.logsComplete===true
  &&['survivingOwnedChildren','ownedCleanupKills','postflightPinFailures','postflightPrivatePinFailures','postflightInputPinFailures'].every(key=>Array.isArray(terminal[key])&&terminal[key].length===0)
  &&terminal.postflightProtectedPinsChecked===authority.expectedProtectedPublicPinCount&&terminal.postflightProtectedPrivatePinsChecked===authority.expectedProtectedPrivatePinCount&&terminal.postflightInputPinsChecked===Object.keys(authority.inputPins).length,'Not the exact retired/pin-conserved phase');
}

export function requireResourceOnlyFacts(facts){
 requireEvidence(facts.stdout.trim()===''&&facts.stderr.trim().endsWith('RuntimeError: Physical/commit resource floor not met')
  &&facts.stderr.includes('resources = resource_gate(phase, authority)')&&facts.stderr.includes('in resource_gate')&&facts.stderr.includes('physical >= 2048 and commit >= 12000')
  &&!facts.stderr.includes('model.generate')&&!facts.stderr.includes('in render')&&!facts.stderr.includes('in process'),'Wrong failure class; only inner resource gate before native startup is supported');
 requireEvidence(facts.guardBeforeStartAndImport===true,'Resource gate order not proven against pinned adapter');
 requireEvidence(facts.renderStarted===false&&facts.renderNativeLog===false&&facts.renderSummary===false&&facts.renderCache===false
  &&facts.processStarted===false&&facts.nativeLedger===false&&facts.asrLedger===false&&facts.retakeLedger===false
  &&facts.rawFiles.length===0&&facts.encodedFiles.length===0,'Native-start/charge/output evidence exists; not a zero-call continuation');
 return {failureClass:'inner-resource-before-start',chargedGenerationCalls:0,asrReadings:0,rawOutputs:0};
}

export function inspectPrior(proof){
 requireEvidence(proof.kind==='police8-inner-resource-continuation01'&&proof.authoritySha256===authoritySha256&&hash(proof.authorityPath)===authoritySha256,'Not the preserved sealed police8 authority');
 const authority=read(proof.authorityPath);
 requireEvidence(authority.status==='ROOT_SEALED_FINITE_VOICE_GAP12'&&authority.sealed===true&&authority.family==='police-dialogue'&&authority.privateReviewFamily==='GS-p8-v1'&&authority.voiceId==='polizei-heinrich-wachtmeister'
  &&authority.maximumNativeCalls===8&&authority.maximumAsrReadings===16&&authority.maximumCallsPerClip===1&&authority.automaticRetries===0&&authority.adapterSha256===adapterSha256,'Changed finite police8 grant');
 for(const [file,expected] of Object.entries(proof.metadataPins))requireEvidence(hash(file)===expected,'Prior failure/plan metadata changed: '+file);
 const directory=path.dirname(proof.authorityPath),family=path.resolve(authority.musicRoot,authority.privateReviewFamily),owned=path.join(family,authority.voiceId);
 requireEvidence(proof.failedTerminalPath===path.join(directory,'police8-render-voice-gap-v1-primary-terminal.json')&&proof.failedTerminalSha256===hash(proof.failedTerminalPath),'Wrong preserved failure terminal');
 const failed=read(proof.failedTerminalPath),plan=read(path.join(directory,'police8-plan-voice-gap-v1-primary-terminal.json'));
 requireRetired(failed,authority,'render',1);requireRetired(plan,authority,'plan',0);
 const stdoutFile=path.join(family,'_primary-logs','police8-render-voice-gap-v1-stdout.txt'),stderrFile=path.join(family,'_primary-logs','police8-render-voice-gap-v1-stderr.txt');
 requireEvidence(hash(stdoutFile)===failed.stdoutSha256&&hash(stderrFile)===failed.stderrSha256,'Failed phase log hashes changed');
 const frozenPath=path.join(owned,'requests.json'),summary=read(path.join(family,'g','plan-summary.json'));
 requireEvidence(summary.authoritySha256===authoritySha256&&summary.nativePlanInvocationThisGrant===true&&summary.rows.length===1&&summary.frozenRequestPins[frozenPath]===hash(frozenPath),'Genuine frozen plan changed');
 const frozen=read(frozenPath),request=read(authority.requestPath);
 requireEvidence(hash(authority.requestPath)===authority.requestSha256&&frozen.authoredPlanSha256===authority.requestSha256&&JSON.stringify(frozen.jobs)===JSON.stringify(request.jobs),'Frozen eight-row request changed');
 const adapter=fs.readFileSync(proof.adapterPath,'utf8');requireEvidence(hash(proof.adapterPath)===adapterSha256,'Adapter changed');
 const start=adapter.indexOf('def run_phase('),guard=adapter.indexOf('resources = resource_gate(phase, authority)',start),marker=adapter.indexOf('exclusive_json(control / (phase + "-started.json")',start),native=adapter.indexOf('spec.loader.exec_module(native)',start);
 return {authority,family,owned,failure:failed,stdout:fs.readFileSync(stdoutFile,'utf8'),stderr:fs.readFileSync(stderrFile,'utf8'),guardBeforeStartAndImport:guard>start&&marker>guard&&native>marker};
}

export function beforeRender(proof){
 const prior=inspectPrior(proof),{family,owned}=prior;
 const files=folder=>fs.existsSync(folder)?fs.readdirSync(folder):[];
 const facts={...prior,renderStarted:fs.existsSync(path.join(family,'g','render-started.json')),renderNativeLog:fs.existsSync(path.join(family,'g','render-native.log')),renderSummary:fs.existsSync(path.join(family,'g','render-summary.json')),renderCache:fs.existsSync(path.join(family,'c','r')),
  processStarted:fs.existsSync(path.join(family,'g','process-started.json')),nativeLedger:fs.existsSync(path.join(owned,'police-native-call-ledger.json')),asrLedger:fs.existsSync(path.join(owned,'police-asr-read-ledger.json')),retakeLedger:fs.existsSync(path.join(owned,'retake-attempts.json')),rawFiles:files(path.join(owned,'raw')),encodedFiles:files(path.join(owned,'encoded'))};
 return {...requireResourceOnlyFacts(facts),authoritySha256,priorFailedTerminalSha256:proof.failedTerminalSha256};
}

export function requireContinuationFields(proof,proofSha256,receipt,authority,check,finalRenderSha256=null){
 const continuation=receipt.continuation;requireRetired(receipt,authority,receipt.phase,0);
 requireEvidence(['render','process'].includes(receipt.phase)&&continuation?.id==='police8-render-resource-continuation01'&&continuation.proofSha256===proofSha256&&continuation.priorFailedTerminalSha256===proof.failedTerminalSha256
  &&continuation.renderSupervisorAttempt===2&&continuation.phaseSupervisorAttempt===(receipt.phase==='render'?2:1)&&continuation.zeroCallWitnessStage==='before-render'&&continuation.chargedGenerationCallsBeforeRender===0&&continuation.asrReadingsBeforeRender===0,'Final phase lost explicit prior resource-stop/zero-charge continuation');
 requireEvidence(continuation.preflightReceiptPath===proof.livePreflightReceiptPath&&/^[a-f0-9]{64}$/.test(continuation.preflightReceiptSha256),'Wrong live preflight path/hash');
 requireEvidence(check.kind==='police8-live-zero-call-preflight'&&check.proofSha256===proofSha256&&check.authoritySha256===authoritySha256&&check.priorFailedTerminalSha256===proof.failedTerminalSha256&&check.chargedGenerationCalls===0&&check.asrReadings===0&&check.rawOutputs===0,'Missing live zero-call preflight');
 if(receipt.phase==='process')requireEvidence(finalRenderSha256===continuation.finalRenderTerminalSha256,'Process is not bound to the successful continued render');
 return {id:continuation.id,proofSha256,priorFailedTerminalSha256:proof.failedTerminalSha256,renderSupervisorAttempt:2,phaseSupervisorAttempt:receipt.phase==='render'?2:1,zeroCallWitnessStage:'before-render',chargedGenerationCallsBeforeRender:0,asrReadingsBeforeRender:0,preflightReceiptSha256:continuation.preflightReceiptSha256,...(receipt.phase==='process'?{finalRenderTerminalSha256:continuation.finalRenderTerminalSha256}:{})};
}

export function validateContinuationReceipt(proof,proofSha256,receipt){
 const prior=inspectPrior(proof),continuation=receipt.continuation;
 requireEvidence(continuation?.preflightReceiptPath===proof.livePreflightReceiptPath&&hash(continuation.preflightReceiptPath)===continuation.preflightReceiptSha256,'Continuation preflight evidence changed');
 const check=read(continuation.preflightReceiptPath),renderSha256=receipt.phase==='process'?hash(proof.continuedRenderTerminalPath):null;
 const result=requireContinuationFields(proof,proofSha256,receipt,prior.authority,check,renderSha256);
 if(receipt.phase==='process'){const render=read(proof.continuedRenderTerminalPath);requireEvidence(render.phase==='render','Continuation predecessor is not render');validateContinuationReceipt(proof,proofSha256,render);}
 return result;
}
