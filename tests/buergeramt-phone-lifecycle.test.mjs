import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

function ticketed(options={}){
 const h=harness('phone',options),link=h.phoneReady();
 h.node('phone-name').value='Erika Mustermann';
 h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 link.message({type:'ticket',number:'B-223',counter:3});
 return{h,link};
}
function arm(h,link,round){link.message({type:'call-arm',id:'grass',round});return link.sent.filter(m=>m.type==='call-ready')}
function call(h,link,round,delay=0){link.message({type:'call',id:'grass',round,line:'Polizei.',ringAtPhoneMs:h.now()+delay,ringAtUtcMs:null,leadMs:2200})}
const sent=(link,type)=>link.sent.filter(m=>m.type===type);

test('hidden before counter still forfeits and closes the phone ticket',()=>{
 const {h,link}=ticketed();h.hide();
 assert.equal(sent(link,'phone-hidden').length,1);
 assert.equal(link.closed,true);
 assert.equal(h.node('phone-expired').hidden,false);
});

test('a call cannot arm before the host confirms counter admission',()=>{
 const {h,link}=ticketed();arm(h,link,1);call(h,link,1);
 assert.equal(sent(link,'call-ready').length,0);assert.equal(sent(link,'call-ringing').length,0);
 link.message({type:'counter-start'});arm(h,link,1);call(h,link,1);
 assert.equal(sent(link,'call-ready').length,1);assert.equal(sent(link,'call-ringing').length,1);
});

test('counter metadata makes hide a local stop, and visible reports recovery',()=>{
 const {h,link}=ticketed({fakeAudio:true});link.message({type:'counter-start'});arm(h,link,1);call(h,link,1);
 assert.equal(sent(link,'call-ringing').length,1);assert.equal(h.node('phone-call').hidden,false);
 h.hide();assert.equal(sent(link,'phone-hidden').length,1);assert.equal(link.closed,false);
 assert.equal(h.node('phone-expired').hidden,true);assert.equal(h.node('phone-call').hidden,true);
 h.tick(20000);assert.equal(sent(link,'call-missed').length,0);
 h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(sent(link,'phone-visible').length,1);
 arm(h,link,2);call(h,link,2);assert.equal(sent(link,'call-ringing').length,2);
});

test('pagehide closes the link without stamping an admitted counter ticket expired',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});h.window.dispatchEvent(new Event('pagehide'));
 assert.equal(sent(link,'phone-hidden').length,1);assert.equal(link.closed,true);
 assert.equal(h.node('phone-expired').hidden,true);
});

test('offline and channel loss stop output after counter without premature expiry',()=>{
 for(const loss of ['offline','status']){
  const {h,link}=ticketed();link.message({type:'counter-start'});arm(h,link,1);call(h,link,1);
  if(loss==='offline')h.window.dispatchEvent(new Event('offline'));else link.emit('status','Telefon getrennt');
  assert.equal(h.node('phone-call').hidden,true);
  assert.equal(h.node('phone-expired').hidden,true);
  if(loss==='offline')assert.equal(sent(link,'phone-hidden').length,1);
  h.tick(15000);assert.equal(sent(link,'call-missed').length,0);
 }
});

test('online recovery reports visibility and can accept a fresh round',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});arm(h,link,1);call(h,link,1);
 h.window.dispatchEvent(new Event('offline'));assert.equal(h.node('phone-call').hidden,true);
 arm(h,link,2);assert.equal(sent(link,'call-ready').length,1,'offline phone stays quiet');
 h.window.dispatchEvent(new Event('online'));assert.equal(sent(link,'phone-visible').length,1);
 arm(h,link,2);assert.equal(sent(link,'call-ready').length,2);
});

test('an unsent hidden notice is retried rather than masked by heartbeat replies',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});
 link.fail=true;h.hide();assert.equal(sent(link,'phone-hidden').length,0);
 link.fail=false;link.message({type:'sync-ping',id:7});
 assert.equal(sent(link,'phone-hidden').length,1);
 assert.equal(sent(link,'sync-pong').length,0);
});

test('a visible heartbeat repeats recovery metadata after a failed visible notice',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});h.hide();
 link.fail=true;h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(sent(link,'phone-visible').length,0);
 link.fail=false;link.message({type:'sync-ping',id:8});
 assert.equal(sent(link,'phone-visible').length,1);
 assert.equal(sent(link,'sync-pong').length,1);
});

test('offline before the counter expires the ticket',()=>{
 const {h,link}=ticketed();h.window.dispatchEvent(new Event('offline'));
 assert.equal(sent(link,'phone-hidden').length,1);assert.equal(link.closed,true);
 assert.equal(h.node('phone-expired').hidden,false);
});

test('visible heartbeat recovers a host liveness timeout without a visibility event',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});arm(h,link,1);call(h,link,1);
 link.message({type:'silence',id:'grass'});assert.equal(h.node('phone-call').hidden,true);
 link.message({type:'sync-ping',id:9});arm(h,link,2);call(h,link,2);
 assert.equal(sent(link,'phone-visible').length,1);assert.equal(h.node('phone-call').hidden,false);
 assert.deepEqual(sent(link,'call-ringing').map(m=>m.round),[1,2]);
});

test('ring receipt starts at visible reveal once, and unanswered ring misses after office tempo',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});arm(h,link,1);call(h,link,1,1000);
 assert.equal(sent(link,'call-scheduled').length,1);assert.equal(sent(link,'call-ringing').length,0);
 h.node('phone-answer').click();assert.equal(sent(link,'answer').length,0,'a pending call cannot be answered before reveal');
 h.tick(999);assert.equal(sent(link,'call-ringing').length,0);
 h.tick(1);assert.equal(sent(link,'call-ringing').length,1);
 assert.equal(sent(link,'call-ringing')[0].round,1);
 h.tick(2800);assert.equal(sent(link,'call-ringing').length,1,'ring bursts cannot repeat reveal receipt');
 h.tick(9199);assert.equal(sent(link,'call-missed').length,0);
 h.tick(1);assert.deepEqual(sent(link,'call-missed').map(m=>m.round),[1]);
 assert.equal(h.node('phone-call').hidden,true);
 assert.equal(arm(h,link,1).length,1,'replayed round must not rearm');
 assert.equal(arm(h,link,2).length,2,'next round is available');
});

test('stale call payloads cannot ring a later arm and answer cancels missed deadline',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});arm(h,link,4);call(h,link,3);
 assert.equal(sent(link,'call-scheduled').length,0);
 call(h,link,4);assert.equal(sent(link,'call-ringing').length,1);
 h.node('phone-answer').click();assert.deepEqual(sent(link,'answer').map(m=>m.round),[4]);
 h.tick(25000);assert.equal(sent(link,'call-missed').length,0);
});

test('office tempo adjusts the remaining unanswered window',()=>{
 const {h,link}=ticketed();link.message({type:'counter-start'});arm(h,link,1);call(h,link,1);
 h.tick(2000);link.message({type:'office-tempo',rate:.5});
 h.tick(19999);assert.equal(sent(link,'call-missed').length,0);
 h.tick(1);assert.equal(sent(link,'call-missed').length,1);
});
