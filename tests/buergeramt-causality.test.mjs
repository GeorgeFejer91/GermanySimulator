import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

test('a fresh scan cancels a pending call-arm timeout and the next appointment can ring',()=>{
 const h=harness();h.wait();h.approachCounter();h.awaitCall();h.level.interact();h.tick(16);
 const link=h.links[0];assert.equal(link.sent.at(-1).type,'call-arm');
 link.message({type:'scan',id:'b'.repeat(24)});h.tick(1100);
 assert.equal(link.sent.filter(m=>m.type==='call').length,0);
 link.message({type:'register',name:'Neue Anmeldung'});
 link.message({type:'ticket-received',id:link.scanId,number:h.level.registrationTicket});
 h.approachCounter();h.awaitCall();h.level.interact();h.tick(16);
 assert.equal(link.sent.filter(m=>m.type==='call-arm').length,2);
 link.message({type:'call-ready',id:'grass'});
 assert.equal(link.sent.filter(m=>m.type==='call').length,1);
});

test('re-entry starts a fresh ambient dialogue bag',()=>{
 const h=harness('host',{random:()=>0});
 function firstRemark(){h.enter();for(let i=0;i<200&&!h.node('amt-ambient').textContent;i++)h.elapse(.1);return h.node('amt-ambient').textContent}
 const first=firstRemark();assert.ok(first);
 h.node('amt-leave').click();h.level.open(h.config);
 assert.equal(firstRemark(),first);
});

test('rescanning during optional encounters resumes current admission rather than the obsolete ticket',()=>{
 for(const kind of ['portrait','character']){
  const h=harness();h.wait();
  if(kind==='portrait'){h.moveTo(0,4.8);h.moveTo(3.4,4.8);h.moveTo(3.4,2.8)}
  else h.moveTo(3.4,1.2);{const actor=h.level.characters.find(a=>a.id==='formularsammler');h.faceToward(actor.x,actor.z)}
  h.level.interact();assert.equal(h.level.stage,kind);
  h.links[0].message({type:'scan',id:'b'.repeat(24)});
  for(let i=0;i<2000&&h.level.stage===kind;i++)h.elapse(.05);
  assert.equal(h.level.stage,'walk-sign',kind);assert.equal(h.level.activated,false,kind);
  assert.equal(h.level.registrationTicket,'',kind);
  assert.equal(h.node('amt-status').textContent,'NAME AM TELEFON EINTRAGEN',kind);
 }
});

test('exiting at each consequential stage isolates the next visit from old events and timers',()=>{
 const setups={
  entrance:()=>{},waiting:h=>h.wait(),called:h=>{h.wait();h.approachCounter();h.awaitCall()},
  ringing:h=>h.counter(),warning:h=>{h.counter();h.links[0].message({type:'decline',id:'grass'})},
  registration:h=>{h.counter();h.links[0].message({type:'silence',id:'grass'});h.tick(30000)},
  argument:h=>{h.counter();h.links[0].message({type:'answer',id:'grass'})},
  omen:h=>h.enterUntilOmen()
 };
 for(const [name,setup] of Object.entries(setups)){
  const h=harness('host',{cinematics:name==='omen'});setup(h);const old=h.links[0];
  h.node('amt-leave').click();assert.equal(h.level.active,false,name);
  h.level.open(h.config);const board=JSON.stringify(h.level.queueCalls),actors=JSON.stringify(h.level.characters);
  for(const message of [{type:'scan',id:'a'.repeat(24)},{type:'register',name:'Old Visit'},
   {type:'ticket-received',id:old.scanId,number:'A-004'},{type:'call-ready',id:'grass'},
   {type:'answer',id:'grass'},{type:'police-start',index:-1,mode:'voice',readyDelayMs:0,atMs:h.now()},
   {type:'police-done',index:-1,mode:'voice',durationMs:0,atMs:h.now()},{type:'phone-hidden'}])old.message(message);
  old.emit('status','Telefon getrennt');h.tick(180000);
  assert.equal(h.level.stage,'outside',name);assert.equal(h.level.activated,false,name);
  assert.equal(h.level.registrationTicket,'',name);assert.equal(h.level.registeredName,'',name);
  assert.equal(h.level.assignedCounter.number,0,name);assert.equal(h.level.registration.node,'',name);
  assert.equal(h.level.registration.completed,false,name);assert.equal(h.level.registration.phoneSilent,false,name);
  assert.equal(h.level.registration.warnings,0,name);assert.equal(h.level.registration.stamps.length,0,name);
  assert.equal(h.level.omen.phase,'',name);assert.equal(h.level.floorState.time,0,name);
  assert.equal(h.level.floorState.visualTime,0,name);assert.equal(h.level.audioTextBusy,false,name);
  assert.equal(h.node('amt-ambient').textContent,'',name);assert.equal(h.node('amt-actions').children.length,0,name);
  assert.equal(JSON.stringify(h.level.queueCalls),board,name);assert.equal(JSON.stringify(h.level.characters),actors,name);
  assert.equal(h.counts.form,0,name);assert.equal(h.counts.cancel,0,name);assert.equal(old.closed,true,name);
  h.config.cinematics=false;h.counter();assert.equal(h.level.stage,'counter',name);
  assert.equal(h.links.at(-1).sent.filter(m=>m.type==='call').length,1,name);
 }
});
