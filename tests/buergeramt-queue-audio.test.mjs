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
  play(){this.paused=false;h.context.setTimeout(()=>{this.startedAt=h.now();this.onplaying?.()},16);return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){this.src=''}load(){}
  end(){this.currentTime=this.duration;this.onended?.()}
 };
 return clips;
}
const beeps=h=>h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.type==='square');
function awaitShout(h,clips){const before=clips.length;for(let i=0;i<6000&&clips.length===before;i++)h.elapse(.05);assert.equal(clips.length,before+1);return clips.at(-1)}

test('each new board call schedules exactly one bounded abrasive double beep',()=>{
 const h=harness('host',{fakeAudio:true});h.enter();const before=h.level.queueDisplay;h.advanceGame(3.2);
 assert.notEqual(h.level.queueDisplay,before);assert.deepEqual(beeps(h).map(n=>n.amtFrequency),[1480,1960]);assert.ok(beeps(h).every(n=>Math.abs(n.frequency.value-n.amtFrequency*h.level.timeScale)<1e-8));
 const [a,b]=beeps(h);assert.ok(Math.abs((b.started[0]-a.started[0])/(a.stopped[0]-a.started[0])-.18/.17)<1e-8,'both scheduled spans use the same onset tempo');assert.ok(beeps(h).every(n=>n.stopped[0]-n.started[0]<=.17/.5+1e-8));
 assert(beeps(h).every(osc=>osc.connections[0].gain.events.some(([kind,value])=>kind==='linear'&&value===.012)));
 h.level.update(0);h.level.update(0);assert.equal(beeps(h).length,2);h.advanceGame(3.2);assert.equal(beeps(h).length,4);
 h.hide();h.advanceGame(10);assert.equal(beeps(h).length,4);
});

test('the occasional recorded shout retains Knick ownership and the same quiet level as other ambience',()=>{
 const h=harness('host',{fakeAudio:true,voice:true}),clips=recording(h);h.enter();h.elapse(30);assert.equal(clips.length,0);
 const clip=awaitShout(h,clips);assert.equal(h.node('amt-ambient').textContent,'');assert(Math.abs(clip.volume-.176)<1e-8);
 const lastBeep=beeps(h).at(-1);assert(h.now()/1000>=lastBeep.stopped[0]);
 h.tick(16);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK: Nächste bitte!');assert.equal(h.level.lipSpeech.actor,'clerk-3');
 assert.equal(h.level.activated,false);clips[0].end();assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.level.audioTextBusy,false);
});

test('35–75 second quiet gaps yield to speech and never build a queue of announcements',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cityAudioBusy:()=>cityBusy}),clips=recording(h);h.enter();h.elapse(120);assert.equal(clips.length,0);
 cityBusy=false;h.level.update(0);h.tick(16);assert.equal(clips.length,1);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK: Nächste bitte!');
 h.elapse(20);assert.equal(clips.length,1);clips[0].end();const ended=h.level.floorState.visualTime;h.elapse(34);assert.equal(clips.length,1);awaitShout(h,clips);h.tick(16);assert(h.level.floorState.visualTime-ended>=35);assert(h.level.floorState.visualTime-ended<100);
 cityBusy=true;clips[1].end();h.elapse(180);assert.equal(clips.length,2);h.tick(Math.ceil(360/h.level.timeScale));assert.equal(clips.length,2);cityBusy=false;h.level.update(0);h.tick(16);assert.equal(clips.length,3);h.elapse(10);assert.equal(clips.length,3);
});

test('voice-off uses a short exact caption without fetching speech, and replay clears queued/active calls',()=>{
 const h=harness('host',{fakeAudio:true}),clips=recording(h);h.enter();for(let i=0;i<6000&&h.node('amt-ambient').textContent!=='FRAU KNICK: Nächste bitte!';i++)h.elapse(.05);
 assert.equal(clips.length,0);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK: Nächste bitte!');h.tick(Math.ceil(1200/h.level.timeScale));assert.equal(h.node('amt-ambient').textContent,'');
 h.advanceGame(3.2);h.level.replay(h.config);h.tick(5000);h.level.update(0);assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.level.stage,'walk-sign');assert.ok(h.audio.contexts[0].state==='closed');
});

test('effects mute does not create an audio context for the queue beep',()=>{
 const src=source('buergeramt.js'),a=src.indexOf('function queueBeep(){'),b=src.indexOf('function playQueueCall()',a);let initialized=false;
 vm.runInNewContext(src.slice(a,b)+'queueBeep()',{mix:{fx:0},initOfficeAudio(){initialized=true;throw Error('muted')}});assert.equal(initialized,false);
});

test('a seeded five-minute room gives every office texture turns and keeps speech diverse',()=>{
 let seed=57;const h=harness('host',{fakeAudio:true,voice:true,random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}}),clips=recording(h),voices=[];
 const lookup=h.window.GermanySimulatorAudioText.recordedClip;
 h.window.GermanySimulatorAudioText.recordedClip=(voiceId,text)=>{if(text!==cue.text)voices.push(voiceId);return lookup(voiceId,text)};
 h.enter();for(let i=0;i<10000&&h.level.floorState.visualTime<300;i++){h.elapse(.1);for(const clip of clips)if(!clip.ended&&clip.startedAt!==undefined&&h.now()-clip.startedAt>=2200){clip.ended=true;clip.end()}}
 const counts=Object.fromEntries([1700,180,1100].map(hz=>[hz,h.audio.nodes.filter(node=>node.kind==='filter'&&node.frequency.value===hz).length]));
 counts.phone=h.audio.nodes.filter(node=>node.kind==='oscillator'&&node.amtFrequency===425).length/4;
 assert(Object.values(counts).every(count=>count>=4));assert(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=1,'one turn of each effect per bag');
 assert(voices.length>=8&&voices.length<=2*Math.min(...Object.values(counts))+2);assert(new Set(voices).size>=6);
 assert(clips.length>=3&&clips.length<=7,'rare announcements cannot dominate');assert.equal(h.synth.spoken.length,0);
 const before=h.audio.nodes.length;h.hide();h.elapse(120);assert.equal(h.audio.nodes.length,before);
});

test('the shipped queue shout retains exact selected-profile and encoded audit ownership',()=>{
 const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url))),binding=cast.productionVoices['amt-brunhilde-knick'];
 assert.equal(cue.text,'Nächste bitte!');assert.equal(cue.actorId,'clerk-3');assert.equal(cue.profileId,binding.profileId);assert.equal(cue.referenceSha256,binding.referenceSha256);assert.equal(cue.processing,binding.processing);assert.equal(cue.asrScriptPrompt,null);assert.equal(cue.asrWordExact,true);assert.ok(Math.abs(cue.integratedLufs+18)<=.3);assert.ok(cue.truePeakDbtp<=-1.5);
});
