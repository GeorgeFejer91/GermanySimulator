// Finite policeContact2 replay checks. Native generation remains a ROOT phase.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {policeContactSources} from './police-contact-voice-source.mjs';
const root=resolve(import.meta.dirname,'..'),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(ok,message)=>{if(!ok)throw Error(message)},validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);

export function policeContactManifestAuthority(cast,manifest,checks,sourceRoot=root){
 const rows=policeContactSources(cast,sourceRoot),expected=new Map(rows.map(row=>[row.clipId,row])),proof=manifest.policeContactAdmission;
 need(manifest.voiceId==='polizei-heinrich-wachtmeister'&&manifest.requestedLineCount===2&&manifest.lineCount===manifest.clips?.length&&Array.isArray(manifest.heldPrivate),'Wrong policeContact2 scope');
 const all=[...manifest.clips,...manifest.heldPrivate];
 need(all.length===2&&new Set(all.map(row=>row.clipId)).size===2&&all.every(row=>expected.has(row.clipId)),'PoliceContact2 must account for both exact sources');
 need(proof?.status==='ROOT-verified-native-policeContact2'&&proof.sourceScope==='police-contact-two-v1'&&proof.listening==='NOT RUN','PoliceContact2 lacks separate ROOT admission');
 for(const key of ['authoritySha256','requestSha256','frozenRequestSha256','adapterSha256','sharedHelperSha256','profileMetadataSha256','asrModelSha256','nativeLedgerSha256','asrLedgerSha256','proposalSha256','selectionSha256'])need(validHash(proof[key]),'Missing policeContact2 proof hash: '+key);
 need(proof.asrModelSha256==='69f74147e3334731bc3a76048724833325d2ec74642fb52620eda87352e3d4f1','PoliceContact2 independent model changed');
 need(proof.terminals&&['plan','render','process','proposal'].every(phase=>{
  const terminal=proof.terminals[phase];return validHash(terminal?.sha256)&&terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false;
 }),'PoliceContact2 ROOT phase retirement missing');
 need(proof.nativeCalls>=manifest.clips.length&&proof.nativeCalls<=4&&Number.isInteger(proof.nativeCalls)&&proof.asrCalls>=manifest.clips.length&&proof.asrCalls<=8&&Number.isInteger(proof.asrCalls),'PoliceContact2 finite call budget changed');
 for(const row of all){const owned=expected.get(row.clipId);need(Object.entries(owned).every(([key,value])=>JSON.stringify(row[key])===JSON.stringify(value)),'PoliceContact2 exact source/English/actor/binding drift');}
 for(const clip of manifest.clips){
  checks.fixedTakeAuthority(cast,clip);
  need(checks.matchesProduction(cast,clip)&&clip.decode?.eosReached===true&&clip.asrLiteralWordExact===true&&clip.asrWordExact===true,'PoliceContact2 requires native EOS and literal words');
  need(clip.asrModelSha256===proof.asrModelSha256&&clip.asrDevice==='cpu'&&clip.asrComputeType==='int8'&&clip.asrCpuThreads===1&&clip.asrLanguageId==='de'&&clip.asrScriptPrompt===null,'PoliceContact2 ASR recipe changed');
  const take=proof.takes?.[clip.clipId];need(take&&['rawReceiptSha256','encodedReceiptSha256','rawSha256','encodedSha256','eosTraceSha256'].every(key=>validHash(take[key]))&&take.rawSha256===clip.rawSha256&&take.encodedSha256===clip.sha256&&take.eosTraceSha256===clip.decode.eosTraceSha256,'PoliceContact2 selected private-byte proof missing');
  need(clip.approval?.status==='user-approved'&&clip.approval.scope==='whole-game-fixed-voice-cloning'&&clip.approval.clipId===clip.clipId&&clip.approval.encodedSha256===clip.sha256&&clip.approval.listening==='NOT RUN','PoliceContact2 clip/hash use selection missing');
  need(clip.mouthHz===40&&Array.isArray(clip.mouthEnergy)&&clip.mouthEnergy.length===Math.ceil(clip.durationSeconds*40-1e-7)&&clip.mouthEnergy.some(value=>value>0)&&clip.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255),'PoliceContact2 encoded mouth measurement missing');
  const mouth=clip.mouthMeasurement;need(mouth?.encodedSha256===clip.sha256&&['decodedPcmSha256','decoderSha256','recipeSha256'].every(key=>validHash(mouth[key]))&&mouth.decodedSamples===Math.round(clip.durationSeconds*24000),'PoliceContact2 mouth byte proof missing');
  const words=[...clip.text.matchAll(/[\p{L}\p{N}_]+/gu)],cues=clip.wordCues;need(Array.isArray(cues)&&cues.length===words.length&&cues.every((cue,index)=>cue.word===words[index][0]&&cue.charIndex===words[index].index&&Number.isFinite(cue.at)&&Number.isFinite(cue.end)&&cue.at>=0&&cue.end>=cue.at&&cue.end<=clip.durationSeconds&&(index===0||cue.at>=cues[index-1].at)),'PoliceContact2 complete owned word cues missing');
 }
 return rows;
}

export function policeContactRecordingsBlock(cast,manifest,checks,assetRoot=root,sourceRoot=root){
 policeContactManifestAuthority(cast,manifest,checks,sourceRoot);const entries={};
 for(const clip of manifest.clips){
  need(clip.file===`assets/voices/police-contact/${clip.clipId}.mp3`&&digest(readFileSync(resolve(assetRoot,clip.file)))===clip.sha256,'PoliceContact2 asset path/hash changed');
  entries['./'+clip.file]={id:clip.clipId,clipId:clip.clipId,actorId:'police',voiceId:clip.voiceId,profileId:clip.profileId,fixedProduction:true,renderer:clip.renderer,modelRevision:clip.modelRevision,referenceSha256:clip.referenceSha256,referenceOriginalSha256:clip.referenceOriginalSha256,processing:clip.processing??null,source:clip.text,english:clip.english,trigger:'police-exact-dialogue',durationMs:Math.round(clip.durationSeconds*1000),wordCues:clip.wordCues,mouthHz:clip.mouthHz,mouthEnergy:clip.mouthEnergy,sha256:clip.sha256,approval:clip.approval,provenanceManifest:manifest.provenanceManifest,provenanceManifestSha256:manifest.provenanceManifestSha256};
 }
 return 'const policeContactRecordings=Object.freeze('+JSON.stringify(entries)+');\n';
}
