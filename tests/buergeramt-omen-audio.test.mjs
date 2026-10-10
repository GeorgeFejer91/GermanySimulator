import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

const verse='Wer die Finsternis sieht, hat sie selbst gewählt!';
const distance=h=>Math.hypot(h.level.omen.x-h.level.view.x,h.level.omen.z-h.level.view.z);
const stepToBlackout=h=>{
 for(let i=0;i<300&&h.level.omen.phase==='approach';i++)h.level.update(.05);
 assert.equal(h.level.omen.phase,'blackout');
};
const stepToGlare=h=>{stepToBlackout(h);h.tick(6000);assert.equal(h.level.omen.phase,'glare')};
const finishOmen=h=>{
 if(h.level.omen.phase==='approach')stepToBlackout(h);
 if(h.level.omen.phase==='blackout')h.tick(6000);
 for(let i=0;i<30&&h.level.omen.phase==='glare';i++)h.level.update(.05);
 for(let i=0;i<10&&h.level.omen.phase==='recover';i++)h.level.update(.05);
 assert.equal(h.level.omen.phase,'');
};
const flushPromises=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};

test('the approach pauses the queue and player, grows with distance, and waits until arrival to speak',()=>{
 const h=harness('host',{cinematics:true});h.enterUntilOmen();
 assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'approach');
 assert.notEqual(h.node('amt-line').textContent,verse);
 const board=h.level.queueDisplay,position=h.level.view;
 h.key('KeyW');
 let previousDistance=distance(h),previousStrength=h.level.omen.strength,progressed=false;
 for(let i=0;i<300&&h.level.omen.phase==='approach';i++){
  h.level.update(.05);const nextDistance=distance(h),nextStrength=h.level.omen.strength;
  assert.ok(nextDistance<=previousDistance+1e-6,'the courier moves toward the player');
  assert.ok(nextStrength>=previousStrength-1e-6,'darkness never recedes during approach');
  assert.equal(h.level.queueDisplay,board);assert.equal(h.level.view.x,position.x);assert.equal(h.level.view.z,position.z);
  if(h.level.omen.phase==='approach')assert.notEqual(h.node('amt-line').textContent,verse);
  progressed ||=nextStrength>previousStrength+1e-6;
  previousDistance=nextDistance;previousStrength=nextStrength;
 }
 h.key('KeyW','keyup');
 assert.ok(progressed);assert.equal(h.level.omen.phase,'blackout');
 assert.equal(h.level.omen.strength,1);assert.equal(h.node('amt-line').textContent,verse);
 assert.equal(h.level.queueDisplay,board);
});

test('the payoff holds for the line, releases abruptly, and returns camera, queue and walking',()=>{
 const h=harness('host',{cinematics:true});h.enterUntilOmen();stepToBlackout(h);
 const board=h.level.queueDisplay;h.advanceGame(4);assert.equal(h.level.queueDisplay,board);
 assert.equal(h.level.omen.strength,1);h.tick(6000);assert.equal(h.level.omen.phase,'glare');
 h.advanceGame(.65);assert.equal(h.level.omen.phase,'glare');assert.equal(h.level.omen.strength,1);
 h.advanceGame(.1);assert.equal(h.level.omen.phase,'recover');assert.equal(h.level.omen.strength,0);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.document.body.classList.contains('amt-omen'),false);
 const actorAtRelease=h.level.omen;h.advanceGame(.3);assert.equal(h.level.omen.phase,'');
 assert.ok(Math.abs(h.level.view.yaw)<.01);h.advanceGame(4);
 assert.notEqual(h.level.queueDisplay,board);
 assert.ok(Math.hypot(h.level.omen.x-actorAtRelease.x,h.level.omen.z-actorAtRelease.z)>.05,'courier returns to his route');
});

test('a scan and name registration survive approach, blackout, glare, and camera recovery',()=>{
 for(const phase of ['approach','blackout','glare','recover']){
  const h=harness('host',{cinematics:true});h.enterUntilOmen();
  if(phase==='blackout')stepToBlackout(h);
  if(phase==='glare'||phase==='recover')stepToGlare(h);
  if(phase==='recover'){h.advanceGame(.75);assert.equal(h.level.omen.phase,'recover')}
  assert.equal(h.level.omen.phase,phase);
  const link=h.links[0];link.message({type:'scan',id:'a'.repeat(24)});
  assert.equal(h.level.activated,true);assert.equal(link.sent.at(-1).type,'ticket');
  assert.equal(h.level.stage,phase==='recover'?'waiting':'omen');
  link.message({type:'register',name:'Erika Mustermann'});
  assert.equal(h.level.registeredName,'Erika Mustermann');
  finishOmen(h);assert.equal(h.level.stage,'waiting');assert.equal(h.level.activated,true);
  assert.equal(h.level.registeredName,'Erika Mustermann');
 }
});

test('phone forfeiture during the omen cancels it and cannot return to waiting',()=>{
 const h=harness('host',{cinematics:true});h.enterUntilOmen();
 const link=h.links[0];link.message({type:'scan',id:'a'.repeat(24)});link.message({type:'phone-hidden'});
 assert.equal(h.level.stage,'expired');assert.equal(h.level.activated,false);
 assert.equal(h.level.omen.phase,'');assert.equal(h.level.omen.strength,0);
 h.tick(10000);h.advanceGame(10);assert.equal(h.level.stage,'expired');
});

test('exit and replay cancel pending omen callbacks',()=>{
 for(const phase of ['approach','blackout'])for(const exit of ['close','replay']){
  const h=harness('host',{cinematics:true});h.enterUntilOmen();
  if(phase==='blackout')stepToBlackout(h);
  if(exit==='close')h.node('amt-exit').click();else h.level.replay(h.config);
  assert.equal(h.level.stage,exit==='close'?'closed':'outside');
  assert.equal(h.level.omen.phase,'');assert.equal(h.level.omen.strength,0);
  h.tick(10000);h.advanceGame(.5);assert.equal(h.level.stage,exit==='close'?'closed':'outside');
 }
});

test('city foreground audio defers the omen until it clears',()=>{
 let cityBusy=true;const h=harness('host',{cinematics:true,cityAudioBusy:()=>cityBusy,fakeAudio:true});
 h.enter();h.advanceGame(9);assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');
 assert.equal(h.audio.contexts.length,0);
 cityBusy=false;
 for(let i=0;i<100&&h.level.stage!=='omen';i++)h.level.update(.05);
 assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'approach');
});

test('late decoding after scene cancellation cannot start omen stems',async()=>{
 const h=harness('host',{cinematics:true,fakeAudio:true});h.enterUntilOmen();await flushPromises();
 assert.deepEqual(h.audio.fetches.filter(path=>path.includes('buergeramt-omen/')).sort(),[
  'assets/audio/buergeramt-omen/bed.ogg?v=20261008-frontal-score','assets/audio/buergeramt-omen/tension.ogg?v=20261008-frontal-score'
 ]);
 assert.equal(h.audio.pendingDecodes.length,2);
 const started=()=>h.audio.nodes.filter(node=>node.kind==='buffer-source'&&node.started.length).length;
 const before=started();h.node('amt-exit').click();
 h.audio.resolveDecodes();await flushPromises();assert.equal(started(),before);
 assert.equal(h.level.stage,'closed');
});

test('decoded stems and fallback oscillators stop on the abrupt release',async()=>{
 const h=harness('host',{cinematics:true,fakeAudio:true});h.enterUntilOmen();await flushPromises();
 assert.equal(h.audio.pendingDecodes.length,2);h.audio.resolveDecodes();await flushPromises();
 const stems=h.audio.nodes.filter(node=>node.kind==='buffer-source'&&node.loop&&node.started.length);
 assert.equal(stems.length,2);assert.ok(stems.every(node=>node.stopped[0]<=24));
 const fallback=h.audio.nodes.filter(node=>node.kind==='oscillator'&&[63.7,64.4,95.35,191.1].includes(node.frequency.value));
 assert.equal(fallback.length,4);assert.ok(fallback.every(node=>node.started.length===1));
 stepToGlare(h);h.advanceGame(.75);
 assert.equal(h.level.omen.strength,0);
 assert.ok([...stems,...fallback].every(node=>node.stopped.length>=2&&node.stopped.at(-1)<node.stopped[0]));
});

test('the existing EFFEKTE mute keeps the omen graph silent',async()=>{
 const h=harness('host',{cinematics:true,fakeAudio:true,officeFx:0});h.enterUntilOmen();await flushPromises();
 assert.equal(h.audio.contexts.length,1);
 assert.equal(h.audio.contexts[0].gains[1].gain.value,0);
 h.audio.resolveDecodes();await flushPromises();
 assert.equal(h.audio.contexts[0].gains[1].gain.value,0);
 assert.equal(h.level.omen.phase,'approach');
});

test('the bounded fallback frees its graph if the scene never advances',async()=>{
 const h=harness('host',{cinematics:true,fakeAudio:true});h.enterUntilOmen();await flushPromises();
 h.audio.resolveDecodes();await flushPromises();
 const fallback=h.audio.nodes.filter(node=>node.kind==='oscillator'&&[63.7,64.4,95.35,191.1].includes(node.frequency.value));
 const output=fallback[0].connections[0].connections[0];
 h.tick(24010);h.audio.flushEnded();
 assert.ok(fallback.every(node=>node.ended));assert.equal(output.disconnected,true);
});
