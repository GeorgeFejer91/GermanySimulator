import test from 'node:test';
import assert from 'node:assert/strict';
import {createFootsteps,createStepBuffer,createRoomImpulse,footstepEnvironment,acousticProfiles} from '../berghain/footsteps.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';

class AudioFixture {
 state='suspended';currentTime=0;sampleRate=24000;destination={};
 node(){return {connect(){},disconnect(){},gain:{value:0},frequency:{value:0},pan:{value:0}};}
 createBuffer(channels,length,sampleRate){const data=Array.from({length:channels},()=>new Float32Array(length));return {length,sampleRate,duration:length/sampleRate,numberOfChannels:channels,getChannelData:i=>data[i]};}
 createGain(){return this.node();}createBiquadFilter(){return this.node();}createConvolver(){return this.node();}createStereoPanner(){return this.node();}
 createBufferSource(){return {...this.node(),playbackRate:{value:1},start(){},stop(){}};}
 async resume(){this.state='running';this.onstatechange?.();}async suspend(){this.state='suspended';this.onstatechange?.();}async close(){this.state='closed';this.onstatechange?.();}
}
test('footsteps follow accepted distance and stay silent for blocked motion, teleports and mute',async()=>{
 const context=new AudioFixture(),sound=createFootsteps({contextFactory:()=>context});
 try{
  const a={x:0,y:0,z:29},b={...a,z:28.6};sound.advance(a,b);assert.equal(sound.state.steps,0);
  await sound.unlock();sound.advance(a,b);assert.equal(sound.state.steps,0);
  const c={...b,z:28.2};sound.advance(b,c);assert.equal(sound.state.steps,1);
  for(let i=0;i<100;i++)sound.advance(c,c);assert.equal(sound.state.steps,1);
  sound.advance(c,{...c,z:-32});assert.equal(sound.state.steps,1,'Room teleport cannot make a footstep');
  sound.setEnabled(false);sound.advance(a,b);assert.equal(sound.state.steps,1);assert.equal(sound.state.voices,0);
  sound.setEnabled(true);await sound.unlock();sound.advance(a,{...a,z:28.5});assert.equal(sound.state.steps,1,'Mute/reset clears stride remainder');
 }finally{sound.dispose();}
 assert.equal(sound.state.disposed,true);assert.equal(context.state,'closed');
});
test('reset owns every source, reverberation connection and pending unlock',async()=>{
 const context=new AudioFixture(),sound=createFootsteps({contextFactory:()=>context});
 sound.unlock();sound.reset();await Promise.resolve();assert.equal(context.state,'suspended');
 await sound.unlock();sound.advance({x:0,y:.05,z:16},{x:0,y:.05,z:15.5});sound.advance({x:0,y:.05,z:15.5},{x:0,y:.05,z:15.1});
 assert.equal(sound.state.steps,1);assert.equal(sound.state.voices,1);sound.reset();assert.equal(sound.state.voices,0);assert.equal(sound.state.room,null);sound.dispose();
});
test('original synthesized step and impulse buffers are finite, reproducible and surface dependent',()=>{
 const context=new AudioFixture();
 for(const surface of ['concrete','metal','tile','grit']){
  const a=createStepBuffer(context,surface),b=createStepBuffer(context,surface);
  assert.deepEqual(a.getChannelData(0),b.getChannelData(0));
  const samples=a.getChannelData(0);assert.ok(samples.every(Number.isFinite));assert.equal(Math.abs(samples[0]),0);
  assert.ok(Math.max(...samples.map(Math.abs))>.05&&Math.max(...samples.map(Math.abs))<.9);assert.ok(Math.abs(samples.at(-1))<.00001);
 }
 assert.notDeepEqual(createStepBuffer(context,'metal').getChannelData(0),createStepBuffer(context,'concrete').getChannelData(0));
 const impulse=createRoomImpulse(context,acousticProfiles.halle.decay);
 assert.equal(impulse.numberOfChannels,2);assert.equal(impulse.duration,4);assert.notDeepEqual(impulse.getChannelData(0),impulse.getChannelData(1));
 const data=impulse.getChannelData(0),energy=(a,b)=>data.slice(a,b).reduce((s,v)=>s+v*v,0);
 assert.ok(energy(2400,12000)>energy(72000,81600)*1000);
});
test('room reverberation and stair surfaces follow actual positions instead of selected labels',()=>{
 assert.equal(footstepEnvironment({x:0,y:0,z:29}).room,'outside');
 assert.equal(footstepEnvironment(viewpoints.halle.position).room,'halle');
 assert.equal(footstepEnvironment(viewpoints.saule.position).room,'saule');
 assert.equal(footstepEnvironment(viewpoints.foyer.position).room,'foyer');
 assert.equal(footstepEnvironment(layout.halle.wc.inside).room,'wc');
 const stair=layout.halle.stairs[0],[a,b]=stair.axis;
 assert.equal(footstepEnvironment({x:(a[0]+b[0])/2,y:2.15,z:(a[1]+b[1])/2}).surface,'concrete');
 assert.ok(acousticProfiles.halle.decay>acousticProfiles.wc.decay&&acousticProfiles.outside.wet===0);
});

test('slow continuous accepted motion keeps audio awake, and look-only unlock returns to idle',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const context=new AudioFixture();
 context.createBufferSource=()=>({...context.node(),playbackRate:{value:1},start(){},stop(){setTimeout(()=>this.onended?.(),270);}});
 const sound=createFootsteps({contextFactory:()=>context});
 try{
  await sound.unlock();let p={x:0,y:0,z:29};
  for(let i=0;i<30;i++){const next={...p,z:p.z-.15};sound.advance(p,next);p=next;t.mock.timers.tick(100);}
  assert.equal(sound.state.steps,6,'A single held gesture at10FPS must keep making footsteps');assert.equal(context.state,'running');
  t.mock.timers.tick(1000);assert.equal(context.state,'suspended');assert.equal(sound.state.voices,0);
  await sound.unlock();t.mock.timers.tick(1000);assert.equal(context.state,'suspended','Looking without walking has a finite idle deadline');
 }finally{sound.dispose();}
});

test('missing stereo panning or the whole audio API cannot break walking',async()=>{
 const context=new AudioFixture();context.createStereoPanner=undefined;
 const sound=createFootsteps({contextFactory:()=>context});
 try{await sound.unlock();sound.advance({x:0,y:0,z:29},{x:0,y:0,z:28.5});sound.advance({x:0,y:0,z:28.5},{x:0,y:0,z:28.1});assert.equal(sound.state.steps,1);}finally{sound.dispose();}
 const unavailable=createFootsteps({contextFactory:()=>{throw Error('Audio API absent');}});
 try{assert.doesNotThrow(()=>unavailable.unlock());assert.equal(unavailable.state.unavailable,true);}finally{unavailable.dispose();}
});

test('accepted motion wakes previously unlocked audio after a long frame gap without a fresh gesture',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const context=new AudioFixture();
 context.createBufferSource=()=>({...context.node(),playbackRate:{value:1},start(){},stop(){setTimeout(()=>this.onended?.(),270);}});
 const sound=createFootsteps({contextFactory:()=>context});
 try{
  await sound.unlock();sound.advance({x:0,y:0,z:29},{x:0,y:0,z:28.5});sound.advance({x:0,y:0,z:28.5},{x:0,y:0,z:28.1});
  t.mock.timers.tick(500);assert.equal(context.state,'suspended');
  let p={x:0,y:0,z:28.1};
  for(let i=0;i<20;i++){const next={...p,z:p.z-.15};sound.advance(p,next);p=next;await Promise.resolve();t.mock.timers.tick(100);}
  assert.ok(sound.state.steps>=5,'Continuing accepted motion must recover steps after the stall');assert.equal(context.state,'running');
  sound.reset();sound.advance(p,{...p,z:p.z-.4});assert.equal(context.state,'suspended','Reset revokes the unlocked movement intent');
 }finally{sound.dispose();}
});

test('a delayed initial audio resume gets its idle deadline after resolution',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const context=new AudioFixture();
 context.resume=()=>new Promise(resolve=>setTimeout(()=>{context.state='running';resolve();},500));
 const sound=createFootsteps({contextFactory:()=>context});
 try{
  const unlocked=sound.unlock();t.mock.timers.tick(500);await unlocked;assert.equal(context.state,'running');
  sound.advance({x:0,y:0,z:29},{x:0,y:0,z:28.5});sound.advance({x:0,y:0,z:28.5},{x:0,y:0,z:28.1});assert.equal(sound.state.steps,1);
  t.mock.timers.tick(1000);assert.equal(context.state,'suspended');
 }finally{sound.dispose();}
});
