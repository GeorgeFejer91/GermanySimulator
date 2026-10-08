import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {omenSplatPose} from '../buergeramt-splat.js';
import {harness} from './amt-harness.mjs';

test('only blackout/glare unfold the character, with bounded motion and immediate restoration',()=>{
  for(const phase of ['', 'approach','recover'])assert.equal(omenSplatPose({phase,revealTime:4}).opacity,0);
  let previous=-1;
  for(let time=0;time<20;time+=.025){
    const pose=omenSplatPose({phase:'blackout',revealTime:time,speech:{tension:1}});
    assert(pose.reveal>=previous&&pose.reveal<=1);previous=pose.reveal;
    assert(pose.opacity>=0&&pose.opacity<=1);assert(Math.abs(pose.turn)<25*Math.PI/180);
    assert(pose.ripple>=0&&pose.ripple<=1);
  }
  assert.equal(omenSplatPose({phase:'blackout',revealTime:0}).opacity,0);
  assert.equal(omenSplatPose({phase:'blackout',revealTime:2}).reveal,1);
  const quiet=omenSplatPose({phase:'blackout',revealTime:4,speech:{tension:1}},true);
  assert.equal(quiet.opacity,1);assert.equal(quiet.turn,0);assert.equal(quiet.ripple,0);assert.equal(quiet.time,0);
});

test('the simulation reveal clock resets on arrival, replay, and cancellation',()=>{
  const h=harness('host',{cinematics:true,synthesis:true});h.enterUntilOmen();
  const visit=h.level.omen.visit;
  for(let i=0;i<400&&h.level.omen.phase==='approach';i++)h.level.update(.025);
  assert.equal(h.level.omen.phase,'blackout');assert.equal(h.level.omen.revealTime,0);
  h.level.update(.1);assert.equal(h.level.omen.revealTime,.1);
  h.level.replay(h.config);assert(h.level.omen.visit>visit);assert.equal(h.level.omen.revealTime,0);
  assert.equal(h.level.omen.phase,'');
});

test('the shipped Gaussian body has bounded count, positive scales, real depth, and recorded provenance',()=>{
  const dir=new URL('../assets/buergeramt/omen/',import.meta.url);
  const manifest=JSON.parse(readFileSync(new URL('manifest.json',dir))),data=readFileSync(new URL(manifest.file,dir));
  assert.equal(data.length,manifest.bytes);assert.equal(data.length,manifest.splats*32);
  assert(manifest.splats<=40000);assert(data.length<=1280000);
  assert.equal(createHash('sha256').update(data).digest('hex'),manifest.sha256);
  let front=0,rear=0;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let offset=0;offset<data.length;offset+=32){
    for(let axis=0;axis<3;axis++){
      const p=data.readFloatLE(offset+axis*4),scale=data.readFloatLE(offset+12+axis*4);
      assert(Number.isFinite(p)&&scale>0&&scale<.02);min[axis]=Math.min(min[axis],p);max[axis]=Math.max(max[axis],p);
    }
    if(data.readFloatLE(offset+8)>0)front++;else rear++;
  }
  assert.deepEqual([min,max],manifest.centerBounds);assert.equal(front,manifest.frontSplats);assert.equal(rear,manifest.rearSplats);
  assert(max[2]-min[2]>.3);assert(min[1]>=0&&max[1]<1.97);assert(max[0]-min[0]<.8);
});
