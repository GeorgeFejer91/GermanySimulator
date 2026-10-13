import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createJobcenterRumble,sampleJobcenterRumble} from '../jobcenter-rumble.js';

const data=JSON.parse(readFileSync(new URL('../assets/audio/jobcenter/overlord.json',import.meta.url)));

test('measured encoded pauses give the rumble room while the final words stay foreground',()=>{
 assert.equal(data.audioSha256,createHash('sha256').update(readFileSync(new URL('../assets/audio/jobcenter/overlord.mp3',import.meta.url))).digest('hex'));
 assert.equal(data.sampleHz,40);assert.equal(data.energy.length,1072);assert.equal(data.attack.length,1072);
 assert.match(data.rumbleCues.basis,/24\.30 s retains full final sentence/);
 for(const [time,min,max] of [[7.7,.3,.35],[9,0,0],[11.5,.48,.53],[15.1,.6,.65],[24.2,.75,.86],[24.35,.02,.1],[25.5,.04,.09],[26.65,.15,.46]]){
  const value=sampleJobcenterRumble(data,time);
  assert.ok(value.level>=min&&value.level<=max,`${time}s: ${value.level}`);
  assert.ok(value.dismissal>=0&&value.dismissal<=1);
 }
 assert.equal(sampleJobcenterRumble(data,23.9).dismissal,0);
 assert.ok(sampleJobcenterRumble(data,25.5).dismissal>.4);
 for(const time of [-1,data.duration,data.duration+10,NaN])assert.deepEqual(sampleJobcenterRumble(data,time),{level:0,dismissal:0});
});

function fakeContext(){
 const made={buffers:[],sources:[],filters:[],gains:[]};
 const param=()=>({value:0,events:[],cancelScheduledValues(t){this.events.push(['cancel',t])},setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t])},linearRampToValueAtTime(v,t){this.value=v;this.events.push(['ramp',v,t])}});
 const node=()=>({connected:[],connect(other){this.connected.push(other)},disconnect(){this.disconnected=true}});
 const context={currentTime:0,
  createBuffer(channels,length,rate){assert.equal(channels,1);const buffer={length,sampleRate:rate,data:new Float32Array(length),getChannelData(){return this.data}};made.buffers.push(buffer);return buffer},
  createBufferSource(){const source={...node(),stops:[],start(t){this.started=t},stop(t){this.stops.push(t)}};made.sources.push(source);return source},
  createBiquadFilter(){const filter={...node(),frequency:param(),Q:param()};made.filters.push(filter);return filter},
  createGain(){const gain={...node(),gain:param()};made.gains.push(gain);return gain}
 };
 return {context,made};
}

function spectralMagnitude(samples,rate,hz){
 let re=0,im=0;for(let i=0;i<samples.length;i++){const phase=2*Math.PI*hz*i/rate;re+=samples[i]*Math.cos(phase);im+=samples[i]*Math.sin(phase)}
 return Math.hypot(re,im)/samples.length;
}

test('one seeded mono loop has bounded bass spectrum, level ramps, and finite lifetime',()=>{
 const first=fakeContext(),other=fakeContext(),output={};
 const cue=createJobcenterRumble(first.context,output),copy=createJobcenterRumble(other.context,{});
 assert.equal(cue.active,true);assert.equal(first.made.sources.length,1);assert.equal(first.made.filters.length,1);assert.equal(first.made.gains.length,1);
 const buffer=first.made.buffers[0],pcm=buffer.data;
 assert.equal(buffer.sampleRate,12000);assert.equal(pcm.byteLength,192000);
 assert.deepEqual(pcm,other.made.buffers[0].data,'the original synth is seeded and repeatable');
 const peak=Math.max(...pcm),floor=Math.min(...pcm),rms=Math.sqrt(pcm.reduce((sum,v)=>sum+v*v,0)/pcm.length);
 assert.ok(peak<=.681&&floor>=-.681&&rms>.1);
 assert.ok(Math.abs(pcm[0]-pcm.at(-1))<.09,'the periodic loop has no large boundary step');
 assert.ok(spectralMagnitude(pcm,12000,44)>spectralMagnitude(pcm,12000,500)*20);
 assert.ok(spectralMagnitude(pcm,12000,67)>spectralMagnitude(pcm,12000,500)*20);
 assert.equal(first.made.filters[0].type,'lowpass');assert.equal(first.made.filters[0].frequency.value,185);
 assert.deepEqual(first.made.sources[0].stops,[60]);
 cue.setLevel(.8);let events=first.made.gains[0].gain.events;assert.deepEqual(events.at(-1),['ramp',.144,.22]);
 first.context.currentTime=.5;cue.setLevel(.2);assert.deepEqual(events.at(-1),['ramp',.036,.545]);
 cue.dispose();assert.equal(cue.active,false);assert.equal(first.made.gains[0].gain.value,0);
 assert.deepEqual(first.made.sources[0].stops,[60,.5]);
 assert.ok(first.made.sources[0].disconnected&&first.made.filters[0].disconnected&&first.made.gains[0].disconnected);
 cue.setLevel(1);cue.dispose();assert.equal(events.at(-1)[0],'set');
 other.made.sources[0].onended();
 assert.equal(copy.active,false,'the 60-second stop also releases the graph');
 assert.ok(other.made.sources[0].disconnected&&other.made.filters[0].disconnected&&other.made.gains[0].disconnected);
 copy.dispose();
});
