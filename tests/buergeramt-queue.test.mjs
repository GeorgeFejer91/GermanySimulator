import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';

test('scans and invalid or stale name submissions never allocate a number or counter',()=>{
 const h=harness();h.register();const link=h.links[0];
 for(const message of [{type:'register',name:' '},{type:'register',name:'X'},{type:'register',id:'b'.repeat(24),name:'Erika Mustermann'}])link.message(message);
 h.advanceGame(40);assert.equal(h.level.registrationTicket,'');assert.equal(h.level.assignedCounter.number,0);assert.equal(h.level.activated,false);assert.equal(link.sent.some(m=>m.type==='ticket'),false);
});

test('name submission reserves exactly the second, third or fourth upcoming irregular call',()=>{
 for(const [random,offset] of [[0,2],[.5,3],[.999,4]]){
  const h=harness('host',{random:()=>random});h.register();const link=h.links[0];
  link.message({type:'register',name:'Erika Mustermann'});const ticket=link.sent.at(-1);assert.equal(ticket.type,'ticket');
  link.message({type:'register',name:'Erika Mustermann'});assert.equal(link.sent.at(-1).number,ticket.number);
  const calls=[];for(let i=0;i<offset;i++){h.advanceGame(3.2);calls.push(h.level.queueDisplay)}
  assert.equal(calls.at(-1),ticket.number);assert.equal(calls.slice(0,-1).includes(ticket.number),false);assert.equal(h.level.stage,'walk-counter');
  assert.equal(h.level.queueCalls.find(call=>call.counter===ticket.counter).number,ticket.number);
  h.advanceGame(3.2);assert.notEqual(h.level.queueDisplay,ticket.number);assert.equal(h.level.queueCalls[ticket.counter-1].number,ticket.number);
 }
});

function atDesk(h,desk){const x=[-5.8,-1.6,3.9,6.2][desk-1];h.moveTo(-2,-2.6);h.moveTo(-2,-6.4);h.moveTo(x===-5.8?-5.4:2.8,-6.4);h.moveTo(x===-5.8?-5.4:2.8,-8.15);h.moveTo(x,-8.15)}

test('every clerk refuses without a name or before the assigned call and owns that animation',()=>{
 for(let desk=1;desk<=4;desk++){
  const h=harness('host',{cinematics:true});h.config.cinematics=false;h.register();atDesk(h,desk);h.config.cinematics=true;h.level.interact();
  assert.equal(h.level.stage,'early');assert.equal(h.level.activeClerkCounter,desk);assert.equal(h.level.fever.id,'clerk');assert.equal(h.level.fever.active,true);h.advanceGame(8);assert.equal(h.level.clerkPerformance.animation.pose,'refusal');assert.equal(h.links[0].sent.some(m=>m.type==='call-arm'),false);
 }
});

test('a wrong clerk during the call refuses, keeps the original assignment and cannot pause expiry',()=>{
 const h=harness();h.wait();const assigned=h.level.assignedCounter.number;const wrong=assigned===1?2:1;atDesk(h,wrong);h.awaitCall();h.level.interact();assert.equal(h.level.stage,'early');assert.equal(h.level.activeClerkCounter,wrong);assert.equal(h.level.assignedCounter.number,assigned);
 h.advanceGame(13);assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.activated,false);assert.equal(h.links[0].sent.some(m=>m.type==='call-arm'),false);assert.equal(h.counts.form,0);
 h.level.interact();assert.equal(h.level.stage,'early');
});

test('the called code remains valid until its Schalter replacement even while other counters are called',()=>{
 const h=harness();h.wait();h.approachCounter();h.awaitCall();const ticket=h.level.registrationTicket,desk=h.level.assignedCounter.number;
 h.advanceGame(3.2);assert.notEqual(h.level.queueDisplay,ticket);assert.equal(h.level.queueCalls[desk-1].number,ticket);h.level.interact();assert.equal(h.level.stage,'counter');
});

test('ticket and call copy contains no imperative counter directions',()=>{
 assert.doesNotMatch(source('buergeramt.js'),/JETZT HINGEHEN|BEEILEN|VORZEITIG AN SCHALTER|→ SCHALTER/);
});
