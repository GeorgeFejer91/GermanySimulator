import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {speechMouthTracks} from '../assets/buergeramt/speech/mouth-cues.js';
import {resolveMouthTrack,sampleTimedMouth} from '../buergeramt-lipsync.js';
import '../buergeramt-lips.js';

test('every approved office recording has contiguous phonetic cues bound to its unchanged bytes',()=>{
 const context=vm.createContext({window:{location:{search:''}},URLSearchParams});
 vm.runInContext(readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8'),context);
 const catalog=context.window.GermanySimulatorAudioText.recordings;
 const expected=Object.entries(catalog).filter(([,clip])=>clip.voiceId?.startsWith('amt-'));
 assert(expected.length>0,'the approved office catalogue must contain speech');assert.equal(Object.keys(speechMouthTracks).length,expected.length);
 for(const [path,clip] of expected){
  const track=speechMouthTracks[path],hash=createHash('sha256').update(readFileSync(new URL('../'+path.slice(2),import.meta.url))).digest('hex');
  assert.equal(track.audioSha256,hash);assert.equal(track.audioSha256,clip.sha256);
  assert.equal(track.sampleHz,100);assert.equal(track.cues[0][0],0);
  assert(Math.abs(track.cues.at(-1)[1]-track.duration)<=.011);
  for(let i=0;i<track.cues.length;i++){const [a,b,shape]=track.cues[i];assert(b>a);assert('ABCDEFGHX'.includes(shape));if(i)assert.equal(a,track.cues[i-1][1])}
  const energy=Uint8Array.from(atob(track.energyBase64),c=>c.charCodeAt(0));assert.equal(energy.length,Math.ceil(Math.round(track.duration*16000)/160));
  assert.equal(resolveMouthTrack(path,'different bytes'),null);
  let opened=false;
  for(let n=0;n<energy.length-1;n++){
   const t=n/100,p=sampleTimedMouth(track,t);assert([p.open,p.spread,p.round,p.bite].every(v=>v>=0&&v<=1));
   if(energy[n]===0)assert(p.open<1e-10,'measured silence closes the aperture');
   if(p.open>.6)opened=true;
  }
  assert(opened,clip.id+' must open beyond a lip tremor');
  for(const [edge] of track.cues.slice(1)){
   const a=sampleTimedMouth(track,edge-1e-6),b=sampleTimedMouth(track,edge+1e-6);
   for(const key of ['open','spread','round','bite'])assert(Math.abs(a[key]-b[key])<.001);
  }
 }
});

test('acoustic bins preserve partial samples without floating-point extra bins',()=>{
 assert.equal(Math.ceil(Math.round(4.48*16000)/160),448);
 assert.equal(Math.ceil(Math.round((71681/16000)*16000)/160),449);
});

test('unequal acoustic intervals use the audio playhead through pause, seeking and rate changes',()=>{
 const track={duration:2,sampleHz:100,energyBase64:btoa(String.fromCharCode(...Array(200).fill(255))),cues:[[0,.12,'A'],[.12,1.71,'D'],[1.71,2,'X']]};
 const binding={track,sample:t=>sampleTimedMouth(track,t)},media={currentTime:.5,duration:2,paused:false,ended:false,playbackRate:1};let wall=0;
 const speech=GermanyAmtLips.createTrack(()=>wall);speech.prepare('clerk','M a');speech.start('voice',media,binding);
 assert.equal(speech.sample().shape[0],1);wall+=90000;assert.equal(speech.sample().shape[0],1,'wall time never moves a recorded mouth');
 media.playbackRate=2;media.currentTime=1.5;assert.equal(speech.sample().shape[0],1);
 media.paused=true;const held=speech.sample();wall+=100000;assert.deepEqual(speech.sample().shape,held.shape);
 media.currentTime=1.9;assert.equal(speech.sample().shape[0],0,'a paused seek follows the actual frozen audio position');
 media.ended=true;assert.deepEqual(speech.sample().shape,[0,0,0,0]);speech.finish();assert.equal(speech.sample().actor,null);
});

test('coarticulation holds the acoustic boundary at its centre with at most 40 ms release',()=>{
 const track={duration:1,sampleHz:100,energyBase64:btoa(String.fromCharCode(...Array(100).fill(255))),cues:[[0,.5,'A'],[.5,1,'D']]};
 assert.equal(sampleTimedMouth(track,.459).open,0);assert.equal(sampleTimedMouth(track,.5).open,.5);assert(Math.abs(sampleTimedMouth(track,.541).open-1)<1e-12);
 assert(Math.abs(sampleTimedMouth(track,.48).open-.15625)<1e-12);assert(Math.abs(sampleTimedMouth(track,.52).open-.84375)<1e-12);
 for(const t of [NaN,Infinity,-1,1,2])assert.equal(sampleTimedMouth(track,t).open,0);
});
