import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fixedTakeAuthority,matchesProduction} from '../tools/curate-voice-library.mjs';
import {policeContactSources} from '../tools/police-contact-voice-source.mjs';
import {policeContactManifestAuthority,policeContactRecordingsBlock} from '../tools/police-contact-recordings.mjs';
const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8')),checks={fixedTakeAuthority,matchesProduction},h='a'.repeat(64),model='69f74147e3334731bc3a76048724833325d2ec74642fb52620eda87352e3d4f1';
// Deliberately synthetic media/proofs: these tests do not establish generated audio.
function fixture(){
 const legacy=JSON.parse(readFileSync(new URL('../assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json',import.meta.url),'utf8')).clips[0];
 const clips=policeContactSources(cast).map(row=>({...structuredClone(legacy),...row,file:`assets/voices/police-contact/${row.clipId}.mp3`,asr:row.text,asrReadings:[{beamSize:1,transcript:row.text}],asrBeamSize:1,asrModelSha256:model,durationSeconds:2,wordCues:[...row.text.matchAll(/[\p{L}\p{N}_]+/gu)].map((word,index,words)=>({word:word[0],charIndex:word.index,at:index/words.length*1.9,end:(index+1)/words.length*1.9})),mouthHz:40,mouthEnergy:Array(80).fill(64),mouthMeasurement:{encodedSha256:legacy.sha256,decodedPcmSha256:h,decodedSamples:48000,decoderSha256:h,recipeSha256:h},approval:{status:'user-approved',scope:'whole-game-fixed-voice-cloning',clipId:row.clipId,encodedSha256:legacy.sha256,listening:'NOT RUN'}}));
 return {voiceId:'polizei-heinrich-wachtmeister',requestedLineCount:2,lineCount:2,clips,heldPrivate:[],policeContactAdmission:{status:'ROOT-verified-native-policeContact2',sourceScope:'police-contact-two-v1',listening:'NOT RUN',authoritySha256:h,requestSha256:h,frozenRequestSha256:h,adapterSha256:h,sharedHelperSha256:h,profileMetadataSha256:h,asrModelSha256:model,nativeLedgerSha256:h,asrLedgerSha256:h,proposalSha256:h,selectionSha256:h,nativeCalls:2,asrCalls:2,terminals:Object.fromEntries(['plan','render','process','proposal'].map(phase=>[phase,{sha256:h,exitCode:0,rootRetired:true,timedOut:false}])),takes:Object.fromEntries(clips.map(clip=>[clip.clipId,{rawReceiptSha256:h,encodedReceiptSha256:h,rawSha256:clip.rawSha256,encodedSha256:clip.sha256,eosTraceSha256:clip.decode.eosTraceSha256}]))}};
}
test('policeContact2 replay retains its finite independent authority and selected exact source pairs',()=>{
 const manifest=fixture();assert.equal(policeContactManifestAuthority(cast,manifest,checks).length,2);
 for(const change of [m=>m.policeContactAdmission.nativeCalls=5,m=>m.policeContactAdmission.terminals.render.rootRetired=false,m=>m.clips[0].text+=' Nein.',m=>m.clips[1].english+=' Wrong.',m=>m.clips[0].asr='Missing words',m=>m.clips[0].asrScriptPrompt='expected source',m=>m.clips[0].approval.listening='verified',m=>m.clips[0].mouthMeasurement.encodedSha256=h]){
  const changed=structuredClone(manifest);change(changed);assert.throws(()=>policeContactManifestAuthority(cast,changed,checks));
 }
});
test('policeContact2 replay checks actual media hashes before creating exact lookup entries',()=>{
 const area=mkdtempSync(resolve(tmpdir(),'gs-police-contact-fixture-'));assert.ok(area.startsWith(resolve(tmpdir())));
 try{
  const manifest=fixture();for(const clip of manifest.clips){const path=resolve(area,clip.file),bytes=Buffer.from('synthetic:'+clip.clipId);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes);clip.sha256=createHash('sha256').update(bytes).digest('hex');clip.approval.encodedSha256=clip.sha256;clip.mouthMeasurement.encodedSha256=clip.sha256;manifest.policeContactAdmission.takes[clip.clipId].encodedSha256=clip.sha256;}
  const block=policeContactRecordingsBlock(cast,manifest,checks,area);assert.match(block,/policeContactRecordings/);assert.match(block,/police-contact-warning/);assert.match(block,/police-contact-fine/);
  writeFileSync(resolve(area,manifest.clips[0].file),'changed');assert.throws(()=>policeContactRecordingsBlock(cast,manifest,checks,area),/path\/hash/);
 }finally{rmSync(area,{recursive:true,force:true});}
});
