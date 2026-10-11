import test from 'node:test';
import assert from 'node:assert/strict';
import {linkSync,mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import {archiveFiles,matchesProduction,runtimeBlock,verifyProfiles,writeArchiveMetadata} from '../tools/curate-voice-library.mjs';
import {harness} from './amt-harness.mjs';
const cast=JSON.parse(readFileSync('For-AI/VOICE-CAST.json'));
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
 assert.equal(verifyProfiles(cast,profiles),62);
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

test('counter forfeiture notices cannot revive a generic browser clerk voice',()=>{
 const h=harness('host',{voice:true});vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),h.context);
 h.counter();h.links[0].emit('status','Telefon getrennt');h.tick(16);
 assert.equal(h.level.stage,'expired');assert.equal(h.node('amt-speaker').textContent,'ANMELDESCHALTER');
 assert.match(h.node('amt-line').textContent,/Ihre Nummer ist gestrichen/);assert.equal(h.synth.current,null);
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
