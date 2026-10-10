import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {omenMouthTrack as track} from '../assets/buergeramt/omen/mouth-cues.js';
import {sampleOmenMouth} from '../buergeramt-lipsync.js';
import {omenSplatPose} from '../buergeramt-splat.js';
const speech=t=>({mode:'voice',recording:track.recording,recordingSha256:track.audioSha256,mediaTime:t});
test('phonetic articulation is bound to approved bytes and covers the whole utterance',()=>{
 const bytes=readFileSync(new URL('../'+track.recording.slice(2),import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),track.audioSha256);
 assert.equal(track.duration,4.76);assert.equal(track.cues[0][0],0);assert.equal(track.cues.at(-1)[1],track.duration);
 assert(track.cues.length>=20);assert(new Set(track.cues.map(c=>c[2])).size>=6);
 for(let i=0;i<track.cues.length;i++){const [a,b]=track.cues[i];assert(b>a);if(i)assert.equal(a,track.cues[i-1][1])}
 assert.equal(track.energy.length,Math.ceil(track.duration*track.sampleHz));assert(track.energy.every(x=>x>=0&&x<=1));
});
test('mouth shapes articulate closures, vowels, rounding and lower-lip bites with smooth transitions',()=>{
 assert.equal(sampleOmenMouth(speech(.47)).open,0);assert.equal(sampleOmenMouth(speech(2.62)).open,0);
 assert(sampleOmenMouth(speech(2.04)).open>sampleOmenMouth(speech(1.8)).open);
 assert(sampleOmenMouth(speech(3.86)).round>.9);assert(sampleOmenMouth(speech(2.28)).bite>.9);
 for(const [boundary] of track.cues.slice(1)){
  const a=sampleOmenMouth(speech(boundary-.00001)),b=sampleOmenMouth(speech(boundary+.00001));
  for(const key of ['open','spread','round','bite'])assert(Math.abs(a[key]-b[key])<.02,`${key} jumps at ${boundary}`);
 }
});
test('unowned, failed, ended, silent and non-speaking scene states retain the original closed mouth',()=>{
 for(const state of [null,{...speech(2),mode:'done'},{...speech(2),mode:'fallback'},{...speech(2),recording:'other.mp3'},{...speech(2),recordingSha256:'other'},speech(4.76),speech(NaN)])assert.equal(sampleOmenMouth(state).open,0);
 for(const phase of ['approach','glare','unwind','turn','depart','recover',''])assert.equal(omenSplatPose({phase,speech:speech(2)}).mouth.open,0);
 const paused={...speech(2.04),paused:true};assert.deepEqual(sampleOmenMouth(paused),sampleOmenMouth({...paused}));
 assert.deepEqual(omenSplatPose({phase:'blackout',speech:paused},true).mouth,sampleOmenMouth(paused),'semantic articulation survives reduced motion');
});
