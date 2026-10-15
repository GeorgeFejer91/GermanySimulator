import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash}from'node:crypto';
const load=(search)=>{const window={};vm.runInNewContext(fs.readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),{window,location:{search},URLSearchParams});return window.GermanySimulatorAudioText};
const file='assets/voices/amt-fever/manifest.json';
test('approved default fever dialogue preserves alternate identities and exact speaker/text ownership',()=>{
 const manifest=JSON.parse(fs.readFileSync(file,'utf8')),window={};vm.runInNewContext(fs.readFileSync('buergeramt-voice-profiles.js','utf8'),{window});
 const context={window:{}};vm.runInNewContext(fs.readFileSync('buergeramt-story.js','utf8'),context);const story=context.window.BuergeramtStory;
 const authored=new Set([...Object.values(story.characters),...Object.values(story.patrons)].flatMap(a=>a.lines.map(l=>a.voiceId+'\0'+l.line)));
 for(const s of story.clerk)for(const text of [s.line,...s.choices.map(c=>c.reply)])authored.add(story.clerkIdentity.voiceId+'\0'+text);
 for(const text of story.outburst.lines)authored.add(story.clerkIdentity.voiceId+'\0'+text);
 authored.add(story.clerkIdentity.voiceId+'\0'+story.call.declined);
 authored.add(story.clerkIdentity.voiceId+'\0'+story.clerkRefusal);
 const history=new Set(JSON.parse(fs.readFileSync('assets/voices/candidate-dialogue/manifest.json','utf8')).clips.filter(c=>c.previousCandidate).map(c=>c.voiceId+'\0'+c.previousCandidate.text));
 const runtime=fs.readFileSync('buergeramt.js','utf8');assert.equal(new Set(manifest.clips.map(c=>c.voiceId)).size,12);
 assert.equal(manifest.clips.filter(c=>c.retiredReason).length,5);assert.equal(manifest.activeLineCount,36);
 const off=load(''),legacy=load('?voicePreview=1'),on=load('?voicePreview=1&amtVoices=fever');assert(on.feverPreviewEnabled);assert(!off.feverPreviewEnabled);assert(!legacy.feverPreviewEnabled);
 for(const clip of manifest.clips){
  const profile=window.BuergeramtVoiceProfiles.byVoiceId[clip.voiceId];assert.equal(clip.profileId,profile.candidateProfileId);
  if(clip.retiredReason){assert(/^amt-brunhilde-knick-fever-(17|18|19|20|21)$/.test(clip.clipId));assert(history.has(clip.voiceId+'\0'+clip.text));assert(!authored.has(clip.voiceId+'\0'+clip.text));}
  else assert(authored.has(clip.voiceId+'\0'+clip.text)||clip.voiceId===story.clerkIdentity.voiceId&&runtime.includes(clip.text));
  assert.equal(clip.modelLicense,'MIT');assert(clip.referenceLicense.includes('CC0'));assert.equal(clip.status,'user-approved default dialogue');assert(clip.asrWordExact||clip.asrOrthographicListeningFlag);
  if(clip.clipId==='amt-ruediger-nummermann-fever-2'){
   assert.equal(clip.approval.instructionKind,'current task authorization summary; not a verbatim quote');
   assert.equal(clip.approval.date,'2026-10-15');assert.equal(clip.globalSynthesisAttemptOrdinal,null);assert.equal(clip.invocationWithinGrant,1);
  }else assert.equal(clip.approval.instruction,'I approve, just implement it');
  assert.equal(clip.approval.listeningVerified,false);
  assert(Math.abs(clip.integratedLufs+18)<=.3);assert(clip.truePeakDbtp<=-1.5);if(clip.archiveRelativePath)assert.equal(clip.archiveRelativePath,'assets/'+clip.path);else assert.equal(createHash('sha256').update(fs.readFileSync(clip.path)).digest('hex'),clip.sha256);
  const path='./'+clip.path;for(const catalog of [off,legacy,on]){assert.equal(catalog.candidateClip(clip.voiceId,clip.text),clip.retiredReason?null:path);if(clip.retiredReason)assert.equal(catalog.recordedClip(clip.voiceId,clip.text),null);}
  if(clip.retiredReason){assert.equal(off.clips[clip.clipId],undefined);assert.equal(on.recordings[path],undefined)}
  else{assert.equal(off.clips[clip.clipId].path,path,'explicitly approved alternates enter the default foreground inventory');assert.equal(on.recordings[path].profileId,clip.profileId);assert.equal(on.recordings[path].source,clip.text)}assert(clip.english.trim());
  let previous=-1,last=-1;for(const cue of clip.wordCues){assert(cue.at>=previous);assert(cue.charIndex>last&&cue.charIndex<clip.text.length);assert(clip.text.slice(cue.charIndex).startsWith(cue.word));previous=cue.at;last=cue.charIndex}
  assert.equal(on.candidateClip(clip.voiceId,'A different sentence.'),null);
 }
 assert.equal(on.candidateClip('amt-horst-stempelmann','Wer die Finsternis sieht, hat sie selbst gewählt!'),'./assets/voices/horst-stempelmann/omen-candidate-02.mp3');
});
