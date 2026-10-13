import assert from 'node:assert/strict';
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
