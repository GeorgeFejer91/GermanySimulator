import test from 'node:test';
import assert from 'node:assert/strict';
import {linkSync,mkdtempSync,mkdirSync,readdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {archiveFiles,fixedRecordingsBlock,matchesProduction,neighborRecordingsBlock,neighborSpokenWords,runtimeBlock,spokenWords,streetRulesBlock,verifyProfiles,writeArchiveMetadata} from '../tools/curate-voice-library.mjs';
import {harness} from './amt-harness.mjs';
const cast=JSON.parse(readFileSync('For-AI/VOICE-CAST.json'));

test('compact caption delivery preserves every authored word, timestamp and character offset',()=>{
 let total=0;
 for(const [family,name] of [['knick','knick'],['player-replies','playerReply'],['office-ambient','officeAmbient'],['street-wisdom','streetWisdom']]){
  const folder=`assets/voices/${family}`,clips=readdirSync(folder).filter(name=>name==='manifest.json'||name.endsWith('-manifest.json')).flatMap(name=>JSON.parse(readFileSync(`${folder}/${name}`)).clips);
  const block=fixedRecordingsBlock(cast,{clips},family),context={};
  vm.runInNewContext(block+`;this.entries=${name}Recordings;`,context);
  for(const [path,clip] of Object.entries(context.entries)){
   const authored=clips.find(source=>'./'+source.file===path);assert.ok(authored,path);
   assert.deepEqual(JSON.parse(JSON.stringify(clip.wordCues)),authored.wordCues,path);total+=clip.wordCues.length;
  }
 }
 assert.ok(total>3900,'the full existing caption corpus must survive delivery');
});

test('neighbor takes bind exact speaker/text, unprompted encoded words and measured mouth energy',()=>{
 const manifest=JSON.parse(readFileSync('assets/voices/neighbors/inga-manifest.json'));
 assert.doesNotThrow(()=>neighborRecordingsBlock(cast,[manifest]));
 const context={window:{}};vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);const catalog=context.window.GermanySimulatorAudioText;
 for(const clip of manifest.clips){assert.equal(catalog.recordedClip(clip.voiceId,clip.text),'./'+clip.file);assert.equal(catalog.candidateClip(clip.voiceId,clip.text),'./'+clip.file,'the production speech producer must resolve approved neighbor audio without a preview flag')}
 const clip=manifest.clips[0],one={...manifest,requestedLineCount:1,clips:[clip],heldPrivate:[]};
 for(const change of [{actorId:'jwd-parent'},{asr:clip.asr+' nicht'},{asrScriptPrompt:clip.text},{mouthHz:20},{mouthEnergy:[256]}])assert.throws(()=>neighborRecordingsBlock(cast,[{...one,clips:[{...clip,...change}]}]));
 assert.equal(neighborSpokenWords('Inga Maaslos, People & Culture.'),neighborSpokenWords('Inga Maslos, People and Culture.'));
 assert.notEqual(neighborSpokenWords('Inga Maaslos'),neighborSpokenWords('Inga Maslow'));
 assert.notEqual(neighborSpokenWords('Sie möchten dazugehören'),neighborSpokenWords('Sie möchten nicht dazugehören'));
});

test('neighbor render-input receipts permit only a truthful finite contraction expansion',()=>{
 const manifest=JSON.parse(readFileSync('assets/voices/neighbors/heiko-manifest.json'));
 const original=manifest.clips.find(clip=>/[’']s\b/u.test(clip.text));assert.ok(original);
 const expanded=original.text.replace(/(?<!\p{L})(sie|du|er|haben|ich|man|meinen|sag|sehen|wir|gibt)[’']s(?!\p{L})/giu,(_,base)=>base+' es');
 assert.notEqual(expanded,original.text);
 const textHash=text=>createHash('sha256').update(text).digest('hex');
 const clip={...original,actualInferenceText:expanded,actualInferenceSha256:textHash(expanded),canonicalSourceSha256:textHash(original.text),renderNormalizationPolicy:'finite-authored-apostrophe-contractions-v1'};
 const check=take=>neighborRecordingsBlock(cast,[{...manifest,requestedLineCount:1,heldPrivate:[],clips:[take]}]);
 assert.doesNotThrow(()=>check(clip));
 for(const change of [{actualInferenceText:expanded+' nicht'},{actualInferenceSha256:'0'.repeat(64)},{canonicalSourceSha256:'0'.repeat(64)},{renderNormalizationPolicy:'unreviewed'},{renderNormalizationPolicy:undefined},{actualInferenceText:original.text,actualInferenceSha256:textHash(original.text)}])assert.throws(()=>check({...clip,...change}),/Unverified neighbor render input/);
 for(const key of ['actualInferenceText','actualInferenceSha256','canonicalSourceSha256']){const partial={...clip};delete partial[key];assert.throws(()=>check(partial),/Unverified neighbor render input/)}
 assert.doesNotThrow(()=>check(original),'unchanged historical receipts stay valid');
});

test('optional Feedback compound hyphen preserves words without accepting a different garden noun',()=>{
 for(const hyphen of ['-','‐','‑','–','—'])assert.equal(neighborSpokenWords(`Feedback${hyphen}Gespräch`),neighborSpokenWords('Feedbackgespräch'));
 assert.notEqual(neighborSpokenWords('Feedback Gespräch'),neighborSpokenWords('Feedbackgespräch'));
 assert.notEqual(neighborSpokenWords('Feedback-Gespräche'),neighborSpokenWords('Feedbackgespräch'));
 assert.notEqual(neighborSpokenWords('kein Feedback-Gespräch'),neighborSpokenWords('Feedbackgespräch'));
 assert.notEqual(neighborSpokenWords('Gartenswerk'),neighborSpokenWords('Gartenzwerg'));
 assert.notEqual(neighborSpokenWords('Garten-Werk'),neighborSpokenWords('Gartenzwerg'));
});

test('fixed runtime takes reject engine, model, reference and processing drift even with the same profile',()=>{
 const context={};vm.runInNewContext(runtimeBlock(cast)+';this.accepts=productionClip;',context);
 const voiceId='spieler-hans-peter-mustermann',binding=cast.productionVoices[voiceId];
 const clip={voiceId,profileId:binding.profileId,fixedProduction:true,renderer:binding.renderer,modelRevision:binding.modelRevision,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,processing:null};
 assert(context.accepts(clip));
 assert.equal(context.accepts({...clip,voiceId:'unallocated'}),false);
 for(const key of ['profileId','renderer','modelRevision','referenceSha256','referenceOriginalSha256','processing']){
  assert.equal(context.accepts({...clip,[key]:'wrong'}),false,key+' drift');
  const incomplete={...clip};delete incomplete[key];assert.equal(context.accepts(incomplete),false,key+' absent');
 }
});

test('only the selected Schwabingen dialect permits explicitly advisory ASR with an honest mismatch receipt',()=>{
 const inga=JSON.parse(readFileSync('assets/voices/neighbors/inga-manifest.json')),fixture=structuredClone(cast);
 const voiceId='jwd-frau-schwabingen',binding=fixture.productionVoices[voiceId];
 assert.equal(binding.profileId,'e556ceff3dbb4091989d0f32da52d811');assert.equal(binding.asrPolicy,'dialect-advisory');
 const person=fixture.existingAssetProfiles.find(p=>p.voiceId===voiceId),clip={...inga.clips[0],voiceId,actorId:person.gameCharacterId,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing,asr:'Whisper normalizes a dialect phrase differently',asrWordExact:false,asrVerificationMode:'dialect-advisory'};
 person.dialogue=[{text:clip.text,english:clip.english}];
 const manifest={...inga,voiceId,requestedLineCount:1,clips:[clip],heldPrivate:[]};
 assert.doesNotThrow(()=>neighborRecordingsBlock(fixture,[manifest]));
 for(const change of [{asrWordExact:true},{asrVerificationMode:'word-exact'},{asr:''},{profileId:'92ca1e419cd84a0092aafb6eed32ac8d'},{nativeCompletion:{completed:false}}])assert.throws(()=>neighborRecordingsBlock(fixture,[{...manifest,clips:[{...clip,...change}]}]));
 const unapproved=structuredClone(fixture);delete unapproved.productionVoices[voiceId].asrPolicy;
 assert.throws(()=>neighborRecordingsBlock(unapproved,[manifest]));
 const other={...inga,requestedLineCount:1,clips:[{...inga.clips[0],asr:clip.asr,asrWordExact:false,asrVerificationMode:'dialect-advisory'}],heldPrivate:[]};
 fixture.productionVoices[other.voiceId].asrPolicy='dialect-advisory';
 assert.throws(()=>neighborRecordingsBlock(fixture,[other]),'another voice cannot use the Swabian exception');
});

test('shared neighbor receipts retain each take and reject a later production selection',()=>{
 const manifest=JSON.parse(readFileSync('assets/voices/neighbors/inga-manifest.json')),context={};
 vm.runInNewContext(runtimeBlock(cast)+neighborRecordingsBlock(cast,[manifest])+';this.entries=neighborRecordings;this.selected=productionVoices;this.accepts=productionClip;',context);
 for(const clip of manifest.clips){
  const entry=context.entries['./'+clip.file];assert(context.accepts(entry));assert.equal(entry.binding,undefined);
  for(const field of ['profileId','renderer','modelRevision','referenceSha256','referenceOriginalSha256','processing','sha256'])assert.equal(entry[field],clip[field],field);
  assert.deepEqual(Array.from(entry.mouthEnergy),clip.mouthEnergy);assert.deepEqual(JSON.parse(JSON.stringify(entry.approval)),clip.approval);
 }
 context.selected[manifest.voiceId].profileId='unselected';
 assert.ok(Object.values(context.entries).every(entry=>!context.accepts(entry)),'recorded receipts must not inherit the current selected profile');
});

test('compact recording exports retain complete take receipts for strict lookup',()=>{
 const clips=JSON.parse(readFileSync('assets/voices/knick/manifest.json')).clips.slice(0,2),context={};
 vm.runInNewContext(runtimeBlock(cast)+fixedRecordingsBlock(cast,{clips})+';this.entries=knickRecordings;this.accepts=productionClip;',context);
 for(const clip of clips){
  const entry=context.entries['./'+clip.file];assert(context.accepts(entry));
  for(const field of ['voiceId','profileId','renderer','modelRevision','referenceSha256','referenceOriginalSha256','processing'])assert.equal(entry[field],clip[field]??null,field);
  const incomplete={...entry};delete incomplete.renderer;assert.equal(context.accepts(incomplete),false);
 }
});

test('the mirror has one exact selected-player take and no browser-voice substitution',()=>{
 const manifest=JSON.parse(readFileSync('assets/voices/player-replies/spieler-hans-peter-mustermann-mirror-manifest.json'));
 const context={window:{}};vm.runInNewContext(readFileSync('buergeramt-story.js','utf8'),context);const story=context.window.BuergeramtStory;
 vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);const catalog=context.window.GermanySimulatorAudioText;
 assert.equal(manifest.clips.length,1);const clip=manifest.clips[0];
 assert.equal(clip.voiceId,story.playerIdentity.voiceId);assert(matchesProduction(cast,clip));
 assert.equal(clip.text,story.potatoMirror.line);assert.equal(clip.english,story.potatoMirror.english);
 assert.equal(clip.rendererInputText,clip.text);assert.equal(clip.rescueParts,undefined);
 const path=catalog.recordedClip(clip.voiceId,clip.text);assert(path?.endsWith('/player-potato-mirror.mp3'));
 assert.equal(catalog.recordings[path].sha256,clip.sha256);assert.equal(catalog.productionVoices[clip.voiceId].fallback,'captions');
});

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
 h.counter();h.links[0].message({type:'phone-hidden'});h.tick(16);
 assert.equal(h.synth.current,null);
 assert(h.node('amt-line').textContent.length>0);
 const current=h.node('amt-line').textContent;h.tick(1600);
 assert.equal(h.node('amt-line').textContent,current);
 assert.equal(h.window.GermanySimulatorAudioText.productionVoices['amt-brunhilde-knick'].fallback,'captions');
});

test('Knick remains caption-only if the catalogue is unavailable',()=>{
 const h=harness('host',{voice:true});delete h.window.GermanySimulatorAudioText;
 h.counter();h.links[0].message({type:'phone-hidden'});h.tick(16);
 assert.equal(h.synth.current,null);assert(h.node('amt-line').textContent.length>0);
});

test('pre-counter forfeiture returns to the room without reviving a generic browser clerk voice',()=>{
 const h=harness('host',{voice:true});vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),h.context);
 h.wait();h.links[0].emit('disconnected',{peer:''});h.tick(16);
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

test('neighbor ASR orthography preserves number values, boundaries and negation',()=>{
 assert.equal(neighborSpokenWords('Theodor, acht, sechs Sprachen.'),neighborSpokenWords('Theodor, 8, 6 Sprachen.'));
 assert.equal(neighborSpokenWords('Dass er das weiß.'),neighborSpokenWords('Daß er das weiß.'));
 assert.equal(neighborSpokenWords('Maaslos muss ein bisschen warten.'),neighborSpokenWords('Maßlos muß ein bißchen warten.'));
 assert.notEqual(neighborSpokenWords('Maße'),neighborSpokenWords('Masse'));
 assert.notEqual(neighborSpokenWords('Er muss warten.'),neighborSpokenWords('Er musste warten.'));
 assert.equal(neighborSpokenWords('Bei uns machen wir’s auch. Haben Sie’s gesehen?'),neighborSpokenWords('Bei uns machen wir es auch. Haben Sie es gesehen?'));
 assert.equal(neighborSpokenWords("Wenn er's weiß, gibt's keine Fragen."),neighborSpokenWords('Wenn er es weiß, gibt es keine Fragen.'));
 assert.equal(neighborSpokenWords('Man schiebt so was weiter.'),neighborSpokenWords('Man schiebt sowas weiter.'));
 // Duden lists noch mal / nochmal as alternative spellings, not lexical substitutions.
 // https://www.duden.de/rechtschreibung/noch_mal
 assert.equal(neighborSpokenWords('Wir besprechen das noch mal.'),neighborSpokenWords('Wir besprechen das nochmal.'));
 for(const changed of ['nochmals','noch einmal','noch mal nicht','nochmals nicht'])assert.notEqual(neighborSpokenWords('nochmal'),neighborSpokenWords(changed));
 // https://www.duden.de/rechtschreibung/kennenlernen lists this exact infinitive spelling pair.
 assert.equal(neighborSpokenWords('Zeit, uns kennenzulernen.'),neighborSpokenWords('Zeit, uns kennen zu lernen.'));
 for(const changed of ['kennen zu lernen nicht','lernen zu kennen','kennen zulernen','zu lernen'])assert.notEqual(neighborSpokenWords('kennenzulernen'),neighborSpokenWords(changed));
 assert.notEqual(neighborSpokenWords('so etwas'),neighborSpokenWords('sowas'));
 assert.notEqual(neighborSpokenWords('so was nicht'),neighborSpokenWords('sowas'));
 for(const [source,changed] of [["Peter's Auto",'Peter es Auto'],['wir s','wir es'],['wirs','wir es'],['machen wir’s nicht','machen wir es'],['das','da es']])assert.notEqual(neighborSpokenWords(source),neighborSpokenWords(changed));
 assert.equal(neighborSpokenWords('zweiundzwanzig Minuten'),neighborSpokenWords('22 Minuten'));
 for(const [source,changed] of [['acht Sprachen','6 Sprachen'],['acht Sprachen','18 Sprachen'],['sechs Sprachen','sechs nicht Sprachen'],['elf Minuten Freizeit','11 Minuten'],['einundzwanzig','zwei eins'],['achtzehn','acht zehn'],['Maaslos','Masloss']])assert.notEqual(neighborSpokenWords(source),neighborSpokenWords(changed));
});
