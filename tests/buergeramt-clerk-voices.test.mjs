import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {harness} from './amt-harness.mjs';

const cast=JSON.parse(readFileSync('For-AI/VOICE-CAST.json'));
const window={};
runInNewContext(readFileSync('buergeramt-story.js','utf8'),{window});
runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),{window});
const story=window.BuergeramtStory,catalog=window.GermanySimulatorAudioText;

test('all fifteen in-room people have distinct selected profiles and normalized references',()=>{
 const people=[...Object.values(story.characters),...Object.values(story.patrons),...Object.values(story.clerks)];
 assert.equal(people.length,15);
 const bindings=people.map(person=>cast.productionVoices[person.voiceId]);
 assert.equal(new Set(people.map(person=>person.voiceId)).size,15);
 assert.equal(new Set(bindings.map(binding=>binding.profileId)).size,15);
 assert.equal(new Set(bindings.map(binding=>binding.referenceSha256)).size,15);
 for(const person of people){
  const binding=cast.productionVoices[person.voiceId];assert(binding?.profileId,person.fullName);
  assert.equal(catalog.voices[person.voiceId].name,person.fullName);
  assert.equal(catalog.voices[person.voiceId].profileId,binding.profileId);
 }
 assert.equal(story.clerks[3],story.clerkIdentity);
});

function approach(h,desk){
 const x=[-5.8,-1.6,3.9,6.2][desk-1];
 h.moveTo(-2,-2.6);h.moveTo(-2,-6.4);h.moveTo(x===-5.8?-5.4:2.8,-6.4);h.moveTo(x===-5.8?-5.4:2.8,-8.15);h.moveTo(x,-8.15);
}

test('each refusal requests its own profile and keeps exact captions for unavailable takes',()=>{
 for(let desk=1;desk<=4;desk++){
  const h=harness('host',{voice:true}),seen=[];
  h.window.GermanySimulatorAudioText={productionVoices:catalog.productionVoices,recordedClip:(voiceId,text)=>{seen.push({voiceId,text});return null}};
  h.register();approach(h,desk);h.level.interact();h.tick(20);
  assert.equal(h.level.stage,'early');assert.equal(h.level.activeClerkCounter,desk);
  assert.equal(h.node('amt-speaker').textContent,story.clerks[desk].speaker+' · SCHALTER '+desk);
  assert.equal(h.node('amt-line').textContent,story.clerkRefusal);
  assert.deepEqual(seen,[{voiceId:story.clerks[desk].voiceId,text:story.clerkRefusal}]);
  assert.equal(h.synth.current,null,'an unavailable clone must not borrow a browser voice');
 }
});

test('clerk ownership survives a missing catalogue and ambient remarks use the right counter profile',()=>{
 for(const desk of [1,2,4]){
  const h=harness('host',{voice:true});delete h.window.GermanySimulatorAudioText;
  h.register();approach(h,desk);h.level.interact();h.tick(20);
  assert.equal(h.synth.current,null);assert.equal(h.node('amt-line').textContent,story.clerkRefusal);
 }
 const h=harness('host',{voice:true}),seen=[];
 h.window.GermanySimulatorAudioText={productionVoices:catalog.productionVoices,recordedClip:(voiceId,text)=>{seen.push({voiceId,text});return null}};
 h.register();
 for(let i=0;i<12&&seen.length<5;i++){h.advanceGame(8.6);h.synth.end();h.tick(20000)}
 for(const row of seen){assert(story.ambient.some(line=>line.text===row.text));assert(cast.productionVoices[row.voiceId]);}
 assert.equal(h.synth.spoken.length,0,'ambient recordings never fall back to machine speech');
});
