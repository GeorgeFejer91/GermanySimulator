import assert from 'node:assert/strict';
import test from 'node:test';
import {harness,source} from './amt-harness.mjs';
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


for(const named of [true,false])test(`${named?'named':'backup'} opening captions match the admitted media and wait for the whole opening`,()=>{
 const host=harness('host',{voice:true,phoneCaptions:true});host.counter();const hostLink=host.links[0],message=hostLink.sent.find(m=>m.type==='call');
 vm.runInContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),host.context);
 assert.match(message.greeting,/^Spricht hier Erika Mustermann\? Hier ist die Kriminalpolizei am Apparat!/);
 assert.equal(message.line,host.window.BuergeramtStory.call.body);assert(message.greeting.length<=170);
 const phone=harness('phone',{candidatePhone:true}),played=[],Audio=phone.window.Audio;
 vm.runInContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),phone.context);
 phone.window.Audio=phone.context.Audio=class extends Audio{play(){played.push(this);return super.play()}};
 let released=0;
 if(named){const binding=phone.window.GermanySimulatorAudioText.productionVoices.kriminalpolizei;
  phone.window.GermanyKripoSpeech={validName:value=>value,rememberName(){},dispose(){},peek:()=>({status:'ready',text:message.greeting}),
   lease:()=>({url:'blob:selected-kripo',text:message.greeting,voiceId:'kriminalpolizei',profileId:binding.profileId,
    referenceSha256:binding.referenceSha256,release(){released++}})}}
 const phoneLink=phone.phoneReady();phone.node('phone-name').value='Erika Mustermann';phone.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 phoneLink.message({type:'ticket',number:'B-223',counter:3});phoneLink.message({type:'counter-start'});phoneLink.message({type:'call-arm',id:message.id,round:message.round});
 phoneLink.message({...message,ringAtPhoneMs:0});phone.node('phone-answer').click();phone.tick(20);
 assert.equal(phone.synth.spoken.length,0);assert.equal(played.length,1);
 assert.equal(played[0].src,named?'blob:selected-kripo':'./assets/voices/kriminalpolizei/kriminalpolizei-phone-01.mp3');
 assert.equal(phoneLink.sent.find(m=>m.type==='police-start').mode,named?'voice':'recording');
 hostLink.message(phoneLink.sent.find(m=>m.type==='answer'));hostLink.message(phoneLink.sent.find(m=>m.type==='police-start'));
 const story=host.window.BuergeramtStory,catalog=host.window.GermanySimulatorAudioText;
 assert.equal(host.node('amt-ambient').textContent,'KRIMINALPOLIZEI · '+(named?story.call.opening('Erika Mustermann'):story.call.line));
 assert.equal(host.node('english-subtitle').textContent,named?story.call.openingEnglish('Erika Mustermann'):catalog.clips['kriminalpolizei-phone-01'].english);
 assert.equal(phone.node('phone-call-line').textContent,'');
 assert.equal(phoneLink.sent.filter(m=>m.type==='police-done').length,0);host.tick(20000);assert.equal(hostLink.sent.filter(m=>m.type==='police-line').length,0);
 played[0].end();
 if(named){assert.equal(released,1);assert.equal(played.length,2);assert.equal(played[1].src,'./assets/voices/kriminalpolizei/kriminalpolizei-opening-body.mp3');
  phone.tick(20);assert.equal(phoneLink.sent.filter(m=>m.type==='police-done').length,0);played[1].end()}
 assert.equal(phoneLink.sent.filter(m=>m.type==='police-done').length,1);assert.equal(phone.synth.spoken.length,0);
 hostLink.message(phoneLink.sent.find(m=>m.type==='police-done'));assert.match(host.node('amt-ambient').textContent,/^FRAU KNICK · /);
 phoneLink.message({type:'forfeit'});assert.equal(phone.synth.current,null);assert.equal(phone.node('phone-call').hidden,true);
 for(const name of ['Jürgen Müller','Anne-Marie O’Neill','A'.repeat(80)]){assert(story.call.opening(name).includes(name));assert(story.call.opening(name).length<350)}
});

test('the body excerpt preserves exact Kripo source and verified silent cut',()=>{
 const clip=JSON.parse(read('assets/voices/kriminalpolizei/opening-body-manifest.json')).clips[0],h=harness();
 assert.equal(clip.text,h.window.BuergeramtStory.call.body);assert.equal(clip.profileId,manifest.profileId);assert.equal(clip.asrWordExact,true);
 assert.equal(clip.derivation.sourceSha256,manifest.clips[0].sha256);assert(clip.derivation.cropStartSeconds>clip.derivation.boundarySilenceStartSeconds);assert(clip.derivation.cropStartSeconds<clip.derivation.boundarySilenceEndSeconds);
 assert.equal(createHash('sha256').update(readFileSync(resolve(root,clip.path))).digest('hex'),clip.sha256);
});
