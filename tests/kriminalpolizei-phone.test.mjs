import assert from 'node:assert/strict';
import test from 'node:test';
import {harness} from './amt-harness.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const manifest=JSON.parse(read('assets/voices/kriminalpolizei/manifest.json'));
for(const search of ['', '?voicePreview=1']){
 const context=vm.createContext({window:{},location:{search},URLSearchParams});
 vm.runInContext(read('For-AI/AUDIO-TEXT-LIBRARY.js'),context);vm.runInContext(read('buergeramt-story.js'),context);
 const library=context.window.GermanySimulatorAudioText,story=context.window.BuergeramtStory;
 assert.equal(manifest.profileName,'GS Kriminalpolizei');assert.equal(manifest.profileId,'f700170f840543bca7413d3ccf6ac028');
 assert.equal(story.call.voiceId,library.speechFamilies.amtPolice.voiceId);assert.equal(library.voices.kriminalpolizei.profileId,manifest.profileId);
 assert.equal(manifest.clips.length,5);assert.match(story.call.line,/^Hier ist die Kriminalpolizei\./);assert.match(story.outburst.lines[1],/Die Dame hat einen Namen/);assert.ok(!story.outburst.lines[1].includes('Wachtmeister'));
 for(const [index,text] of [story.call.line,...story.police].entries()){
  const clip=manifest.clips[index];assert.equal(clip.text,text);assert.equal(clip.voiceId,story.call.voiceId);assert.equal(clip.profileId,manifest.profileId);
  assert.equal(library.recordedClip(story.call.voiceId,text),'./'+clip.path);
  assert.equal(library.recordedClip('polizei-heinrich-wachtmeister',text),null,'city police cannot take ownership of the phone recording');
  assert.equal(clip.asrWordExact,true);assert.ok(Math.abs(clip.integratedLufs+18)<=.3);assert.ok(clip.truePeakDbtp<=-1.5);assert.equal(clip.channels,1);assert.equal(clip.sampleRate,24000);
  const bytes=readFileSync(resolve(root,clip.path));assert.equal(bytes.length,clip.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
 }
 assert.equal(library.recordedClip('kriminalpolizei',story.call.line+' other words'),null,'mismatched speech must use the browser fallback');
}
console.log('PASS: default Kriminalpolizei recordings, exact speaker/text ownership, asset hashes and encoded speech targets');


test('the accepted name reaches only the short greeting before the fixed recorded body',()=>{
 const host=harness('host',{voice:true,phoneCaptions:true});host.counter();const hostLink=host.links[0],message=hostLink.sent.find(m=>m.type==='call');
 assert.match(message.greeting,/^Spricht hier Erika Mustermann\? Hier ist die Kriminalpolizei am Apparat!/);
 assert.equal(message.line,host.window.BuergeramtStory.call.body);assert(message.greeting.length<=170);
 const phone=harness('phone',{candidatePhone:true}),phoneLink=phone.phoneReady();phone.node('phone-name').value='Erika Mustermann';phone.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 phoneLink.message({type:'ticket',number:'B-223',counter:3});phoneLink.message({type:'counter-start'});phoneLink.message({type:'call-arm',id:message.id,round:message.round});
 phoneLink.message({...message,ringAtPhoneMs:0});phone.node('phone-answer').click();phone.tick(20);
 assert.equal(phone.synth.spoken.length,1);assert.equal(phone.synth.spoken[0].text,message.greeting);assert.equal(phone.synth.spoken[0].lang,'de-DE');
 hostLink.message(phoneLink.sent.find(m=>m.type==='answer'));hostLink.message(phoneLink.sent.find(m=>m.type==='police-start'));
 assert.equal(host.node('amt-ambient').textContent,'KRIMINALPOLIZEI · '+message.greeting+' '+message.line);
 assert.equal(host.node('english-subtitle').textContent,host.window.BuergeramtStory.call.openingEnglish('Erika Mustermann'));
 assert.equal(phone.node('phone-call-line').textContent,'');
 phone.synth.end();phone.tick(20);assert.equal(phone.audio.recordings.length,1);assert.equal(phoneLink.sent.filter(m=>m.type==='police-done').length,0);phone.audio.recordings[0].end();assert.equal(phoneLink.sent.filter(m=>m.type==='police-done').length,1);assert.equal(phone.synth.spoken.length,1);
 phoneLink.message({type:'forfeit'});assert.equal(phone.synth.current,null);assert.equal(phone.node('phone-call').hidden,true);
 const story=host.window.BuergeramtStory;
 for(const name of ['Jürgen Müller','Anne-Marie O’Neill','A'.repeat(80)]){assert(story.call.opening(name).includes(name));assert(story.call.opening(name).length<350)}
});

test('the body excerpt preserves exact Kripo source and verified silent cut',()=>{
 const clip=JSON.parse(read('assets/voices/kriminalpolizei/opening-body-manifest.json')).clips[0],h=harness();
 assert.equal(clip.text,h.window.BuergeramtStory.call.body);assert.equal(clip.profileId,manifest.profileId);assert.equal(clip.asrWordExact,true);
 assert.equal(clip.derivation.sourceSha256,manifest.clips[0].sha256);assert(clip.derivation.cropStartSeconds>clip.derivation.boundarySilenceStartSeconds);assert(clip.derivation.cropStartSeconds<clip.derivation.boundarySilenceEndSeconds);
 assert.equal(createHash('sha256').update(readFileSync(resolve(root,clip.path))).digest('hex'),clip.sha256);
});
