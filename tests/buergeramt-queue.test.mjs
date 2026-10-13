import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';

test('scans and invalid or stale name submissions never allocate a number or counter',()=>{
 const h=harness();h.register();const link=h.links[0];
 for(const message of [{type:'register',name:' '},{type:'register',name:'X'},{type:'register',id:'b'.repeat(24),name:'Erika Mustermann'}])link.message(message);
 h.advanceGame(40);assert.equal(h.level.registrationTicket,'');assert.equal(h.level.assignedCounter.number,0);assert.equal(h.level.activated,false);assert.equal(link.sent.some(m=>m.type==='ticket'),false);
});

test('name submission reserves after two or three other upcoming irregular call',()=>{
 for(const [random,offset] of [[0,3],[.5,4],[.999,4]]){
  const h=harness('host',{random:()=>random});h.register();const link=h.links[0];
  link.message({type:'register',name:'Erika Mustermann'});const ticket=link.sent.at(-1);assert.equal(ticket.type,'ticket');
  assert.equal(h.level.activated,false);link.message({type:'ticket-received',id:link.scanId,number:ticket.number});
  link.message({type:'register',name:'Erika Mustermann'});assert.equal(link.sent.at(-1).number,ticket.number);
  const calls=[];for(let i=0;i<offset;i++){advanceScene(h,3.2);calls.push(h.level.queueDisplay)}
  assert.equal(calls.at(-1),ticket.number);assert.equal(calls.slice(0,-1).includes(ticket.number),false);assert.equal(h.level.stage,'walk-counter');
  assert.equal(h.level.queueCalls.find(call=>call.counter===ticket.counter).number,ticket.number);
  advanceScene(h,3.2);assert.notEqual(h.level.queueDisplay,ticket.number);assert.equal(h.level.queueCalls[ticket.counter-1].number,ticket.number);
 }
});

// Authored queue windows belong to scene time; residence and test wall time
// already start decelerating during these short scenarios.
function advanceScene(h,seconds){
 const start=h.level.floorState.visualTime,limit=Math.ceil(seconds/(.05*h.window.BuergeramtGoop.minSpeed))+2;
 for(let i=0;i<limit&&h.level.floorState.visualTime-start<seconds-1e-8;i++)h.level.update(.05);
 assert.ok(h.level.floorState.visualTime-start>=seconds-1e-8,'scene-time budget completes');
}

function atDesk(h,desk){const x=[-5.8,-1.6,3.9,6.2][desk-1];h.moveTo(-2,-2.6);h.moveTo(-2,-6.4);h.moveTo(x===-5.8?-5.4:2.8,-6.4);h.moveTo(x===-5.8?-5.4:2.8,-8.15);h.moveTo(x,-8.15);h.faceToward(x,-8.15)}

test('every clerk refuses without a name or before the assigned call and owns that animation',()=>{
 for(let desk=1;desk<=4;desk++){
  const h=harness('host',{cinematics:true});h.config.cinematics=false;h.register();atDesk(h,desk);h.config.cinematics=true;h.level.interact();
  assert.equal(h.level.stage,'early');assert.equal(h.level.activeClerkCounter,desk);assert.equal(h.level.fever.id,'clerk');assert.equal(h.level.fever.active,true);h.advanceGame(8);assert.equal(h.level.clerkPerformance.animation.pose,'refusal');assert.equal(h.links[0].sent.some(m=>m.type==='call-arm'),false);
 }
});

test('a wrong clerk during the call refuses, keeps the original assignment and cannot pause expiry',()=>{
 const h=harness();h.wait();const assigned=h.level.assignedCounter.number;const wrong=assigned===1?2:1;atDesk(h,wrong);h.awaitCall();h.level.interact();assert.equal(h.level.stage,'early');assert.equal(h.level.activeClerkCounter,wrong);assert.equal(h.level.assignedCounter.number,assigned);
 advanceScene(h,30.1);assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.activated,false);assert.equal(h.links[0].sent.some(m=>m.type==='call-arm'),false);assert.equal(h.counts.form,0);
 h.level.interact();assert.equal(h.level.stage,'early');
});

test('the called code remains valid until its Schalter replacement even while other counters are called',()=>{
 const h=harness();h.wait();h.approachCounter();h.awaitCall();const ticket=h.level.registrationTicket,desk=h.level.assignedCounter.number;
 advanceScene(h,3.2);assert.notEqual(h.level.queueDisplay,ticket);assert.equal(h.level.queueCalls[desk-1].number,ticket);h.faceToward(h.level.assignedCounter.x,h.level.assignedCounter.z);h.level.interact();assert.equal(h.level.stage,'counter');
});

test('ticket and call copy contains no imperative counter directions',()=>{
 assert.doesNotMatch(source('buergeramt.js'),/JETZT HINGEHEN|BEEILEN|VORZEITIG AN SCHALTER|→ SCHALTER/);
 assert.doesNotMatch(source('index.html'),/amt-counter-notice|amt-board-hud/);
 assert.doesNotMatch(source('buergeramt-phone.html'),/phone-counter/);
});

test('all four board rows have distinct calls before registration, and only the newly called row changes',()=>{
 const h=harness(),before=JSON.parse(JSON.stringify(h.level.queueCalls));
 assert.deepEqual(before.map(c=>c.counter),[1,2,3,4]);assert.equal(new Set(before.map(c=>c.number)).size,4);assert.ok(before.every(c=>/^[A-Z]-\d{1,3}$/.test(c.number)));
 // Queue calls use scene time, which begins decelerating immediately inside.
 advanceScene(h,3.2);h.level.update(.001);const after=h.level.queueCalls;assert.equal(after.filter((c,i)=>c.number!==before[i].number).length,1);assert.equal(h.level.activated,false);
});

test('a reserved ticket cannot open the clerk until the matching phone receipt arrives',()=>{
 const h=harness();h.register();const link=h.links[0];link.message({type:'register',name:'Erika Mustermann'});const ticket=link.sent.at(-1);
 h.approachCounter();advanceScene(h,12.8);assert.equal(h.level.activated,false);assert.equal(h.level.stage,'walk-sign');
 assert.equal(h.level.queueCalls[ticket.counter-1].number,ticket.number);
 link.message({type:'ticket-received',id:'b'.repeat(24),number:ticket.number});link.message({type:'ticket-received',id:link.scanId,number:'Z-999'});assert.equal(h.level.activated,false);
 link.message({type:'ticket-received',id:link.scanId,number:ticket.number});assert.equal(h.level.activated,true);assert.equal(h.level.stage,'walk-counter');
 h.faceToward(h.level.assignedCounter.x,h.level.assignedCounter.z);h.level.interact();assert.equal(h.level.stage,'counter');assert.equal(h.level.activeClerkCounter,ticket.counter);
});

test('duplicate and overdue ticket receipts cannot restart or extend the call window',()=>{
 const h=harness();h.wait();const link=h.links[0],number=h.level.registrationTicket;h.awaitCall();advanceScene(h,27);
 link.message({type:'ticket-received',id:link.scanId,number});advanceScene(h,3);assert.equal(h.level.activated,false);assert.equal(h.level.stage,'walk-sign');
 link.message({type:'ticket-received',id:link.scanId,number});assert.equal(h.level.activated,false);
 const late=harness();late.register();const pending=late.links[0];pending.message({type:'register',name:'Erika Mustermann'});advanceScene(late,50);
 pending.message({type:'ticket-received',id:pending.scanId,number:late.level.registrationTicket});assert.equal(late.level.activated,false);assert.equal(late.level.stage,'walk-sign');assert.equal(pending.sent.at(-1).type,'forfeit');
});

test('failed ticket send rolls back the reservation and pending phone loss retires the ticket',()=>{
 const h=harness();h.register();const link=h.links[0];link.fail=true;link.message({type:'register',name:'Erika Mustermann'});assert.equal(h.level.registrationTicket,'');assert.equal(h.level.assignedCounter.number,0);assert.equal(h.level.activated,false);
 link.fail=false;link.message({type:'register',name:'Erika Mustermann'});const ticket=link.sent.at(-1);link.message({type:'phone-hidden'});assert.equal(h.level.activated,false);assert.equal(h.links.at(-1),link);
 link.message({type:'ticket-received',id:link.scanId,number:ticket.number});assert.equal(h.level.activated,false);
});
