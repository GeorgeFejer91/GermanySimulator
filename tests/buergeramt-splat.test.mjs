import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {omenSplatPose} from '../buergeramt-splat.js';
import {harness} from './amt-harness.mjs';

test('depth unfolds towards the player during approach and shares the score pulse',()=>{
  const h=harness('host',{cinematics:true});h.enterUntilOmen();
  let previous=0,middle=false;
  for(let i=0;i<400&&h.level.omen.phase==='approach';i++){
    h.level.update(.025);const omen=h.level.omen,pose=omenSplatPose(omen);
    assert(pose.reveal>=previous&&pose.reveal<=1);previous=pose.reveal;
    assert.equal(pose.turn,0);assert.equal(pose.pulse,omen.life.pulse);
    assert.equal(pose.pressure,omen.life.pressure);
    assert(pose.opacity>=0&&pose.opacity<=1);
    if(omen.phase==='approach'&&pose.reveal>.2&&pose.reveal<.8){middle=true;assert(pose.opacity>0)}
  }
  assert(middle,'volume must already exist before arrival');
  assert.equal(omenSplatPose(h.level.omen).reveal,1);
  const quiet=omenSplatPose(h.level.omen,true);
  assert.equal(quiet.opacity,1);assert.equal(quiet.turn,0);assert.equal(quiet.ripple,0);assert.equal(quiet.time,0);assert.equal(quiet.pulse,0);
  for(const phase of ['', 'recover'])assert.equal(omenSplatPose({...h.level.omen,phase}).opacity,0);
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
