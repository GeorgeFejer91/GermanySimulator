import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';
import {createAmtGaussianScene} from '../buergeramt-gaussian-scene.js';

test('all five additional stationary performances use simulation time and freeze hidden/dialogue backgrounds',()=>{
 const h=harness(),before=JSON.parse(JSON.stringify(h.level.stationaryAnimations));
 assert.equal(Object.keys(before).length,5);h.level.update(.1);
 const advanced=JSON.parse(JSON.stringify(h.level.stationaryAnimations));
 for(const id of Object.keys(before))assert.notEqual(advanced[id].phase,before[id].phase);
 h.hide();h.level.update(.1);assert.deepEqual(JSON.parse(JSON.stringify(h.level.stationaryAnimations)),advanced);
 h.document.hidden=false;h.counter();const held=JSON.parse(JSON.stringify(h.level.stationaryAnimations));
 h.level.update(.1);assert.deepEqual(JSON.parse(JSON.stringify(h.level.stationaryAnimations)),held);
 const generation=held['clerk-desk-1'].generation;h.level.replay(h.config);
 const reset=JSON.parse(JSON.stringify(h.level.stationaryAnimations));
 assert(reset['clerk-desk-1'].generation>generation);
 for(const id of Object.keys(before))assert.equal(reset[id].phase,before[id].phase);
});

test('stationary figures have unique slots while reusing the correct family pack and residency cap',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{
  const actor=(name,id,x,performance=false)=>({name,id,performance,mesh:{position:{x,z:0},material:{opacity:1}}});
  const stationary=[actor('clerk','amt-brunhilde-knick',0,true),actor('clerk',undefined,20,true),actor('clerk',undefined,40,true),
   actor('renter','amt-konrad-wohnungszettel',60),actor('parent','amt-mechthild-elternbogen',80),actor('pensioner','amt-wolfram-rentenbescheid',100)];
  stationary[1].animationId='clerk-desk-1';stationary[2].animationId='clerk-desk-2';
  const ready={generation:1,arc:null,pose:'ready',phase:1},work={generation:1,arc:null,pose:'work',phase:1};
  const level={active:true,clerkPerformance:{animation:ready},omen:{phase:''},characters:[],stationaryAnimations:{'clerk-desk-1':ready,'clerk-desk-2':ready,'amt-konrad-wohnungszettel':work,'amt-mechthild-elternbogen':work,'amt-wolfram-rentenbescheid':work}};
  const manager=createAmtGaussianScene({THREE:{},renderer:{},scene:{},queueLoad:()=>new Promise(()=>{}),mobile:true,reducedMotion:{matches:false}});
  for(const [index,item] of stationary.entries()){
   manager.update(level,stationary,[],{position:{x:item.mesh.position.x,z:2}});
   assert.equal(manager.inspect().actors.length,1);assert.equal(manager.inspect().actors[0].id,index===0?'clerk':item.animationId??item.id);manager.clear();
  }
 }finally{globalThis.document=old}
});

test('Frau Knick browser speech consumes her profile without changing displayed words',()=>{
 const h=harness('host',{voice:true});h.counter();h.tick(20);
 assert.equal(h.synth.current.rate,.89);assert.equal(h.synth.current.pitch,.77);
 assert.equal(h.synth.current.text,h.node('amt-line').textContent);
});

test('turning to another speaker releases an off-camera frozen transition without replacing visible paint',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{
  const actor=(id,z)=>({id,name:'renter',mesh:{position:{x:0,z},material:{opacity:1},geometry:{parameters:{width:1}},scale:{x:1}}});
  const clerk=actor('clerk',-20),a=actor('a',-2),b=actor('b',2);
  const state={generation:1,arc:'work-gesture-work',phase:.3};
  const level={active:true,clerkPerformance:{animation:state},omen:{phase:''},characters:[],stationaryAnimations:{a:state,b:state}};
  const manager=createAmtGaussianScene({THREE:{},renderer:{},scene:{},queueLoad:()=>new Promise(()=>{}),mobile:true,reducedMotion:{matches:false}});
  const camera={position:{x:0,z:0},rotation:{y:0},fov:69,aspect:1};
  manager.update(level,[clerk,a,b],[],camera);assert.equal(manager.inspect().actors[0].id,'a');
  level.characterMood={id:'b'};manager.update(level,[clerk,a,b],[],camera);
  assert.equal(manager.inspect().actors[0].id,'a','in-view mid-arc painting retains its slot');
  camera.rotation.y=Math.PI;manager.update(level,[clerk,a,b],[],camera);
  assert.equal(manager.inspect().actors[0].id,'b','off-camera frozen actor cannot starve the new speaker');manager.clear();
 }finally{globalThis.document=old}
});
