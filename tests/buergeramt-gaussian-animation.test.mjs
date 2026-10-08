import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function clock(){
 const window={};vm.runInNewContext(source('buergeramt-animation-clock.js'),{window});
 return window.BuergeramtAnimationClock.createClerk();
}
function stepFor(clock,seconds,dt){for(let left=seconds;left>1e-9;){const step=Math.min(left,dt);clock.advance(step);left-=step}}

for(const dt of [1/60,1/30,.1])test(`clerk pose requests latch and reach safe anchors at ${dt}s steps`,()=>{
 const c=clock();c.reset(7);c.request('raised');
 stepFor(c,1,dt);const first=c.state;
 assert.equal(first.arc,'raise');assert.ok(first.phase>.31&&first.phase<.33);
 for(let n=0;n<4;n++)c.request('raised');
 assert.equal(c.state.actionId,first.actionId);assert.equal(c.state.phase,first.phase);
 c.request('contact');assert.equal(c.state.arc,'raise');
 stepFor(c,2.1,dt);assert.equal(c.state.arc,'stamp');assert.equal(c.state.fromPose,'raised');
 stepFor(c,2.25,dt);assert.equal(c.state.arc,null);assert.equal(c.state.pose,'contact');assert.equal(c.state.phase,1);
 c.request('refusal');stepFor(c,2.2,dt);assert.equal(c.state.pose,'refusal');assert.equal(c.state.arc,null);
 c.request('ready');stepFor(c,1.55,dt);assert.equal(c.state.pose,'ready');
 c.request('raised');stepFor(c,3.1,dt);assert.equal(c.state.pose,'raised');
 c.request('ready');assert.equal(c.state.arc,'raise-back');stepFor(c,3.1,dt);assert.equal(c.state.pose,'ready');
});

test('ambient sequence traverses each main arc without a held loop; mouth is independent',()=>{
 const c=clock();c.reset(3);c.advance(1);const body=c.state;
 c.setSpeech(true,5);assert.equal(c.state.phase,body.phase);assert.equal(c.state.actionId,body.actionId);
 assert.equal(c.state.mouthFrame,5);c.setSpeech(false);assert.equal(c.state.mouthFrame,0);
 stepFor(c,2.1,.1);assert.equal(c.state.arc,'stamp');
 stepFor(c,2.25,.1);assert.equal(c.state.arc,'refuse');
 stepFor(c,2.2,.1);assert.equal(c.state.arc,'return');
 stepFor(c,1.55,.1);assert.equal(c.state.arc,'raise');
});

test('a newer intent waits for the current main key and replaces the older queued target',()=>{
 const c=clock();c.reset(11);c.request('raised');c.advance(1);
 const action=c.state.actionId;c.request('contact');c.request('refusal');
 assert.equal(c.state.actionId,action);assert.equal(c.state.arc,'raise');
 c.advance(2.1);assert.equal(c.state.arc,'stamp');assert.equal(c.state.fromPose,'raised');
 c.advance(2.25);assert.equal(c.state.arc,'refuse');assert.equal(c.state.fromPose,'contact');
 c.advance(2.2);assert.equal(c.state.pose,'refusal');assert.equal(c.state.arc,null);
});

test('level speech boundaries do not reset Knick body and hidden time does not catch up',()=>{
 const h=harness('host',{voice:true});h.counter();
 const before=h.level.clerkPerformance.animation;assert.ok(['raise','stamp','refuse','return','raise-back','stamp-back','refuse-back','return-back'].includes(before.arc));
 const during=h.level.clerkPerformance.animation;
 h.synth.boundary(5);const spoken=h.level.clerkPerformance.animation;
 assert.equal(spoken.actionId,during.actionId);assert.equal(spoken.phase,during.phase);
 assert.equal(spoken.speaking,true);assert.equal(spoken.mouthFrame,1);
 h.hide();h.tick(5000);h.level.update(.1);
 assert.equal(h.level.clerkPerformance.animation.phase,spoken.phase);
 h.document.hidden=false;h.level.update(.1);
 assert.notEqual(h.level.clerkPerformance.animation.phase,spoken.phase);
 h.level.replay(h.config);
 const replay=h.level.clerkPerformance.animation;
 assert.ok(replay.generation>spoken.generation);assert.equal(replay.pose,'ready');assert.equal(replay.speaking,false);
});

test('moving regulars hold work and freeze background actions during dialogue',()=>{
 const h=harness();const initial=h.level.characters;
 assert.equal(initial.length,8);
 for(const actor of initial){assert.equal(actor.mode,'work');assert.equal(actor.animation.arc,null);assert.equal(actor.animation.pose,'work')}
 h.level.update(.1);const planted=h.level.characters;
 assert.ok(planted.every(actor=>actor.animation?.phase===1));
 h.counter();const paused=h.level.characters.filter(actor=>actor.animation);
 assert.ok(paused.length>0);
 h.level.update(.1);
 for(const actor of paused){const after=h.level.characters.find(item=>item.id===actor.id);assert.equal(after.animation.phase,actor.animation.phase)}
 const generation=paused[0].animation.generation;
 h.level.replay(h.config);
 assert.ok(h.level.characters[0].animation.generation>generation);
 assert.equal(h.level.characters[0].animation.phase,1);
});

for(const seconds of [1,3])test(`dialogue actor returns to the nearest work anchor after ${seconds}s`,()=>{
 const h=harness();h.enter();h.moveTo(3.4,1.2);h.level.interact();
 assert.equal(h.level.stage,'character');const id=h.level.characterMood.id;
 h.advanceGame(seconds);
 const spoken=h.level.characters.find(actor=>actor.id===id);
 assert.equal(spoken.mode,'gesture');assert.equal(spoken.animation.arc,'work-gesture-work');
 const phase=spoken.animation.phase;
 h.action();assert.notEqual(h.level.stage,'character');
 const released=h.level.characters.find(actor=>actor.id===id);
 assert.equal(released.mode,'gesture');assert.equal(released.animation.phase,phase);
 const origin=[released.x,released.z];
 h.advanceGame(.2);
 const settling=h.level.characters.find(actor=>actor.id===id);
 assert.equal(settling.mode,'gesture');assert.deepEqual([settling.x,settling.z],origin);
 assert(seconds===1?settling.animation.phase<phase:settling.animation.phase>phase);
 h.advanceGame(1.9);
 const returned=h.level.characters.find(actor=>actor.id===id);
 assert.notEqual(returned.mode,'gesture');
});

test('a regular speech boundary leaves the four-second body arc in place',()=>{
 const h=harness('host',{voice:true});h.enter();h.moveTo(3.4,1.2);h.level.interact();
 assert.equal(h.level.stage,'character');const id=h.level.characterMood.id;
 h.advanceGame(.6);const before=h.level.characters.find(actor=>actor.id===id).animation;
 h.synth.boundary(8);
 const after=h.level.characters.find(actor=>actor.id===id).animation;
 assert.equal(after.actionId,before.actionId);assert.equal(after.phase,before.phase);
});
