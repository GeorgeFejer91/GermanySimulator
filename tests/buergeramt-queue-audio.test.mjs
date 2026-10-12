import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {harness,source} from './amt-harness.mjs';

const cue=JSON.parse(readFileSync(new URL('../assets/voices/knick/queue-call-manifest.json',import.meta.url))).clips[0];
function recording(h){
 const clips=[];h.window.GermanySimulatorAudioText.recordedClip=(id,text)=>id===cue.voiceId&&text===cue.text?'./'+cue.file:null;
 h.window.GermanySimulatorAudioText.recordings={['./'+cue.file]:cue};
 h.context.Audio=class{
  constructor(src){this.src=src;this.duration=cue.durationSeconds;this.currentTime=0;this.paused=true;clips.push(this)}
  play(){this.paused=false;h.context.setTimeout(()=>this.onplaying?.(),16);return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){this.src=''}load(){}
  end(){this.currentTime=this.duration;this.onended?.()}
 };
 return clips;
}
const beeps=h=>h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.type==='square');

test('each new board call schedules exactly one bounded abrasive double beep',()=>{
 const h=harness('host',{fakeAudio:true});h.enter();h.advanceGame(3.2);
 assert.equal(h.level.queueDisplay,'Z-7');assert.deepEqual(beeps(h).map(n=>n.amtFrequency),[1480,1960]);assert.ok(beeps(h).every(n=>Math.abs(n.frequency.value-n.amtFrequency*h.level.timeScale)<1e-8));
 const [a,b]=beeps(h);assert.ok(Math.abs((b.started[0]-a.started[0])/(a.stopped[0]-a.started[0])-.18/.17)<1e-8,'both scheduled spans use the same onset tempo');assert.ok(beeps(h).every(n=>n.stopped[0]-n.started[0]<=.17/.4+1e-8));
 h.level.update(0);h.level.update(0);assert.equal(beeps(h).length,2);h.advanceGame(3.2);assert.equal(beeps(h).length,4);
 h.hide();h.advanceGame(10);assert.equal(beeps(h).length,4);
});

test('the exact recorded shout follows the beep, belongs to Knick at desk three, and starts its caption on playing',()=>{
 const h=harness('host',{fakeAudio:true,voice:true}),clips=recording(h);h.enter();h.advanceGame(3.2);
 const delay=Math.ceil(360*(beeps(h)[0].stopped[0]-beeps(h)[0].started[0])/.17);
 assert.equal(clips.length,0);h.tick(delay-1);h.level.update(0);assert.equal(clips.length,0);
 h.tick(1);h.level.update(0);assert.equal(clips.length,1);assert.equal(h.node('amt-ambient').textContent,'');
 h.tick(16);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK: Nächste bitte!');assert.equal(h.level.lipSpeech.actor,'clerk-3');
 assert.equal(h.level.activated,false);clips[0].end();assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.level.audioTextBusy,false);
});

test('queued calls do not interrupt speech and only the latest pending announcement survives',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cityAudioBusy:()=>cityBusy}),clips=recording(h);h.enter();h.advanceGame(10);h.tick(10000);h.level.update(0);assert.equal(clips.length,0);
 cityBusy=false;h.level.update(0);h.tick(16);assert.equal(clips.length,1);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK: Nächste bitte!');
 h.advanceGame(6.4);h.tick(10000);h.level.update(0);assert.equal(clips.length,1);clips[0].end();h.level.update(0);h.tick(16);assert.equal(clips.length,2);
});

test('voice-off uses a short exact caption without fetching speech, and replay clears queued/active calls',()=>{
 const h=harness('host',{fakeAudio:true}),clips=recording(h);h.enter();h.advanceGame(3.2);h.tick(Math.ceil(360/h.level.timeScale));h.level.update(0);
 assert.equal(clips.length,0);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK: Nächste bitte!');h.tick(Math.ceil(1200/h.level.timeScale));assert.equal(h.node('amt-ambient').textContent,'');
 h.advanceGame(3.2);h.level.replay(h.config);h.tick(5000);h.level.update(0);assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.level.stage,'outside');assert.ok(h.audio.contexts[0].state==='closed');
});

test('effects mute does not create an audio context for the queue beep',()=>{
 const src=source('buergeramt.js'),a=src.indexOf('function queueBeep(){'),b=src.indexOf('function playQueueCall()',a);let initialized=false;
 vm.runInNewContext(src.slice(a,b)+'queueBeep()',{mix:{fx:0},initOfficeAudio(){initialized=true;throw Error('muted')}});assert.equal(initialized,false);
});

test('the shipped queue shout retains exact selected-profile and encoded audit ownership',()=>{
 const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url))),binding=cast.productionVoices['amt-brunhilde-knick'];
 assert.equal(cue.text,'Nächste bitte!');assert.equal(cue.actorId,'clerk-3');assert.equal(cue.profileId,binding.profileId);assert.equal(cue.referenceSha256,binding.referenceSha256);assert.equal(cue.processing,binding.processing);assert.equal(cue.asrScriptPrompt,null);assert.equal(cue.asrWordExact,true);assert.ok(Math.abs(cue.integratedLufs+18)<=.3);assert.ok(cue.truePeakDbtp<=-1.5);
});
