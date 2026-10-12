import test from 'node:test';
import assert from 'node:assert/strict';
import {linkSync,mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {archiveFiles,fixedRecordingsBlock,matchesProduction,runtimeBlock,spokenWords,streetRulesBlock,verifyProfiles,writeArchiveMetadata} from '../tools/curate-voice-library.mjs';
import {harness} from './amt-harness.mjs';
const cast=JSON.parse(readFileSync('For-AI/VOICE-CAST.json'));

test('a fixed recording cannot use a script-prompted transcript as independent evidence',()=>{
 const clip=JSON.parse(readFileSync('assets/voices/knick/manifest.json')).clips[0];
 Object.assign(clip,{decode:{eosReached:true},asrScriptPrompt:null,asrLanguageId:'de',asrComputeType:'int8',asrModelSha256:'a'.repeat(64),asrCpuThreads:1});
 assert.doesNotThrow(()=>fixedRecordingsBlock(cast,{clips:[clip]}));
 assert.throws(()=>fixedRecordingsBlock(cast,{clips:[{...clip,asrScriptPrompt:clip.text}]}),/independent final-encoding ASR receipt/);
 const missing={...clip};delete missing.asrModelSha256;
 assert.throws(()=>fixedRecordingsBlock(cast,{clips:[missing]}),/independent final-encoding ASR receipt/);
});

test('failed fixed-voice integration leaves the complete playable catalogue unchanged',()=>{
 const scratch=mkdtempSync(join(tmpdir(),'voice-sync-'));
 try{
  for(const folder of ['For-AI','tools','assets/voices/candidate-dialogue','assets/voices/knick'])mkdirSync(join(scratch,folder),{recursive:true});
  for(const path of ['For-AI/AUDIO-TEXT-LIBRARY.js','tools/curate-voice-library.mjs','street-wisdom.js'])writeFileSync(join(scratch,path),readFileSync(path));
  const altered=JSON.parse(JSON.stringify(cast));altered.productionVoices['amt-brunhilde-knick'].profileName='Changed projection for failed transaction';
  writeFileSync(join(scratch,'For-AI/VOICE-CAST.json'),JSON.stringify(altered));
  writeFileSync(join(scratch,'assets/voices/candidate-dialogue/manifest.json'),JSON.stringify({clips:[]}));
  const clip=JSON.parse(readFileSync('assets/voices/knick/manifest.json')).clips[0];
  clip.decode={...clip.decode,eosReached:false};delete clip.reusedApproved;
  writeFileSync(join(scratch,'assets/voices/knick/manifest.json'),JSON.stringify({requestedLineCount:1,generatedLineCount:1,clips:[clip],heldPrivate:[]}));
  const catalog=join(scratch,'For-AI/AUDIO-TEXT-LIBRARY.js'),before=readFileSync(catalog);
  assert.throws(()=>execFileSync(process.execPath,[join(scratch,'tools/curate-voice-library.mjs'),'--sync'],{stdio:'pipe'}),/Missing or incomplete Knick generation receipt/);
  assert.deepEqual(readFileSync(catalog),before);
 }finally{assert(scratch.startsWith(join(tmpdir(),'voice-sync-')));rmSync(scratch,{recursive:true,force:true});}
});

test('spoken-word equivalence preserves negation, cases and time values',()=>{
 assert.equal(spokenWords('Ab 22:00 Uhr gilt § 17.'),spokenWords('Ab zweiundzwanzig Uhr gilt Paragraph siebzehn.'));
 assert.equal(spokenWords('A38, an meinem Schalter Lärm.'),spokenWords('A achtunddreißig, an meinem Schalterlärm.'));
 for(const changed of ['Ab 22:30 Uhr gilt § 17.','Ab 23 Uhr gilt § 17.','Ab 22 Uhr gilt § 18.','Ab 22 Uhr gilt nicht § 17.'])assert.notEqual(spokenWords('Ab 22:00 Uhr gilt § 17.'),spokenWords(changed));
 assert.notEqual(spokenWords('Ihren Wohnsitz'),spokenWords('Ihrem Wohnsitz'));
});

test('German date ordinals normalize only am followed by a complete day ordinal',()=>{
 const days=['ersten','zweiten','dritten','vierten','fünften','sechsten','siebten','achten','neunten','zehnten','elften','zwölften','dreizehnten','vierzehnten','fünfzehnten','sechzehnten','siebzehnten','achtzehnten','neunzehnten','zwanzigsten','einundzwanzigsten','zweiundzwanzigsten','dreiundzwanzigsten','vierundzwanzigsten','fünfundzwanzigsten','sechsundzwanzigsten','siebenundzwanzigsten','achtundzwanzigsten','neunundzwanzigsten','dreißigsten','einunddreißigsten'];
 days.forEach((day,index)=>assert.equal(spokenWords(`Sie sind am ${day} eingezogen.`),spokenWords(`Sie sind am ${index+1}. eingezogen.`)));
 for(const changed of ['am 4.','am 5','am 5.5','am 0.','am 32.','mit 5.'])assert.notEqual(spokenWords('am Fünften'),spokenWords(changed));
});

test('every stable rule belongs to one dedicated street identity',()=>{
 const source=readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),window={};vm.runInNewContext(source,{window});vm.runInNewContext(readFileSync('street-wisdom.js','utf8'),{window});
 assert(source.replace(/\r\n/g,'\n').includes(streetRulesBlock(source)));
 const catalog=window.GermanySimulatorAudioText;
 catalog.rules.forEach((row,index)=>{
  const person=window.StreetWisdom.definitions.find(p=>p.ruleIndices.includes(index)),clip=catalog.clips[`rule-${String(index+1).padStart(2,'0')}`];
  assert.equal(clip.voiceId,person.voiceId);assert.equal(clip.text,row[1]);assert.equal(clip.english,catalog.ruleEnglish[index]);
  assert(!clip.path||clip.path.startsWith('./assets/voices/street-wisdom/'));assert.equal(catalog.productionVoices[person.voiceId].fallback,'captions');
 });
});
test('archive metadata cannot follow a junction or hardlink into live files',()=>{
 const scratch=mkdtempSync(join(tmpdir(),'voice-metadata-')),archive=join(scratch,'archive'),live=join(scratch,'live');
 try{
  mkdirSync(archive);mkdirSync(live);const protectedFile=join(live,'asset-index.json');writeFileSync(protectedFile,'protected');
  symlinkSync(live,join(archive,'metadata'),process.platform==='win32'?'junction':'dir');
  assert.throws(()=>writeArchiveMetadata(archive,'metadata/asset-index.json','overwrite'),/linked outside archive/);
  linkSync(protectedFile,join(archive,'asset-index.json'));
  assert.throws(()=>writeArchiveMetadata(archive,'asset-index.json','overwrite'),/linked outside archive/);
  assert.equal(readFileSync(protectedFile,'utf8'),'protected');
 }finally{rmSync(scratch,{recursive:true,force:true});}
});

test('redundant generation bindings and traffic recordings are removed',()=>{
 const window={};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),{window});const voices=window.GermanySimulatorAudioText.voices;
 assert.equal(Object.values(voices).filter(voice=>voice.engine==='qwen').length,0);
 for(const id of ['frau-knick','merz-character','merkel-character','soeder-character','weidel-character'])assert.equal(voices[id],undefined);
 assert.equal(voices['amt-brunhilde-knick'].generationAllowed,true);
 assert.equal(matchesProduction(cast,{voiceId:'frau-knick',profileId:'a137f87bde844d36b18e3a59c412cf2c'}),false);
 for(const id of ['traffic-berlin-01','traffic-berlin-02','traffic-germany-01','traffic-germany-02']){
  const clip=window.GermanySimulatorAudioText.clips[id];assert(clip.text&&clip.english);assert.equal(clip.recording,null);assert.equal(clip.path,undefined);
 }
 assert.equal(window.GermanySimulatorAudioText.speechFamilies.traffic.profileVoiceId,'verkehr-dieter-hupfer');
});
test('fixed production voices reject old identities, renderer changes and live reference drift',()=>{
 const binding=cast.productionVoices['amt-brunhilde-knick'];
 assert.equal(binding.profileId,'b080c7d95ecd418fb428282461d7fbe7');
 assert(matchesProduction(cast,{voiceId:'amt-brunhilde-knick',...binding}));
 assert(!matchesProduction(cast,{voiceId:'amt-brunhilde-knick',...binding,profileId:'1a28fb7903d344518617d755a7f5cbb0'}));
 assert(!matchesProduction(cast,{voiceId:'amt-brunhilde-knick',...binding,renderer:'omnivoice-rs'}));
 assert(!matchesProduction(cast,{voiceId:'amt-brunhilde-knick',...binding,modelRevision:'unreviewed-model'}));
 assert(!matchesProduction(cast,{voiceId:'amt-brunhilde-knick',...binding,referenceSha256:'changed-reference'}));
 assert(!matchesProduction(cast,{voiceId:'amt-brunhilde-knick',...binding,processing:'unreviewed-processing'}));
 for(const field of ['renderer','modelRevision','referenceSha256','processing']){const incomplete={voiceId:'amt-brunhilde-knick',...binding};delete incomplete[field];assert(!matchesProduction(cast,incomplete),field);}
 const profiles=[...Object.values(cast.productionVoices),...cast.productionExceptions].map(p=>({id:p.profileId,name:p.profileName,saved:true,original_sha256:p.originalSha256,reference_sha256:p.referenceSha256}));
 assert.equal(verifyProfiles(cast,profiles),profiles.length);
 profiles.find(p=>p.id===binding.profileId).reference_sha256='changed';
 assert.throws(()=>verifyProfiles(cast,profiles),/Profile drift/);
});

test('missing and failed Knick recordings retain captions without changing voice identity',()=>{
 const h=harness('host',{voice:true});
 vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),h.context);
 h.counter();h.links[0].message({type:'silence',id:'grass'});h.tick(16);
 assert.equal(h.synth.current,null);
 assert(h.node('amt-line').textContent.length>0);
 const current=h.node('amt-line').textContent;h.tick(1600);
 assert.equal(h.node('amt-line').textContent,current);
 assert.equal(h.window.GermanySimulatorAudioText.productionVoices['amt-brunhilde-knick'].fallback,'captions');
});

test('Knick remains caption-only if the catalogue is unavailable',()=>{
 const h=harness('host',{voice:true});delete h.window.GermanySimulatorAudioText;
 h.counter();h.links[0].message({type:'silence',id:'grass'});h.tick(16);
 assert.equal(h.synth.current,null);assert(h.node('amt-line').textContent.length>0);
});

test('counter forfeiture returns to the room without reviving a generic browser clerk voice',()=>{
 const h=harness('host',{voice:true});vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),h.context);
 h.counter();h.links[0].emit('status','Telefon getrennt');h.tick(16);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.node('amt-actions').children.length,0);
 assert.equal(h.level.activated,false);assert.equal(h.synth.current,null);
});

test('profile archival verifies copies and rejects an alias back into live data',()=>{
 const temp=mkdtempSync(join(tmpdir(),'gs-voice-archive-'));
 try{
  const live=join(temp,'live'),archive=join(temp,'archive'),alias=join(temp,'alias');mkdirSync(live);writeFileSync(join(live,'reference.wav'),'reference-test');
  const receipt=archiveFiles(live,archive);assert.equal(receipt.length,1);assert.equal(readFileSync(join(archive,'reference.wav'),'utf8'),'reference-test');
  symlinkSync(live,alias,process.platform==='win32'?'junction':'dir');assert.throws(()=>archiveFiles(live,alias),/linked|aliases/);
 }finally{rmSync(temp,{recursive:true,force:true})}
});
test('default and both audition modes never revive archived clerk speech',()=>{
 const candidates=JSON.parse(readFileSync('assets/voices/candidate-dialogue/manifest.json')).clips;
 for(const search of ['', '?voicePreview=1', '?voicePreview=1&amtVoices=fever']){
  const window={};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),{window,location:{search},URLSearchParams});const catalog=window.GermanySimulatorAudioText;
  assert.equal(catalog.productionVoices['amt-brunhilde-knick'].profileId,cast.productionVoices['amt-brunhilde-knick'].profileId);
  assert.equal(catalog.voices['amt-brunhilde-knick'].profileId,cast.productionVoices['amt-brunhilde-knick'].profileId);
  assert.equal(catalog.voices['amt-brunhilde-knick'].referenceSha256,cast.productionVoices['amt-brunhilde-knick'].referenceSha256);
  for(const c of candidates.filter(c=>c.voiceId==='amt-brunhilde-knick')){const path=catalog.candidateClip(c.voiceId,c.text);assert.notEqual(path,c.path);if(path)assert.equal(catalog.recordings[path].profileId,cast.productionVoices[c.voiceId].profileId);}
  assert.equal(catalog.recordedClip('amt-brunhilde-knick','Unrecorded exact sentence.'),null);
  assert.equal(catalog.candidateClip('amt-horst-stempelmann','Wer die Finsternis sieht, hat sie selbst gewählt!'),'./assets/voices/horst-stempelmann/omen-candidate-02.mp3');
 }
 assert(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8').replace(/\r\n/g,'\n').includes(runtimeBlock(cast)));
});
