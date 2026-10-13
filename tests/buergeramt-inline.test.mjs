import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';

test('missing the call returns to walking, preserves the shared URL, and never opens a decision',()=>{
 const h=harness();h.wait();h.awaitCall();const old=h.links[0];
 const expiryScene=h.level.floorState.visualTime+30.1,limit=Math.ceil(30.1/(.05*h.window.BuergeramtGoop.minSpeed))+2;
 for(let i=0;i<limit&&h.level.floorState.visualTime<expiryScene;i++)h.level.update(.05);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.active,true);
 assert.equal(h.node('amt-actions').children.length,0);assert.equal(h.counts.form,0);
 assert(old.sent.some(m=>m.type==='forfeit'));assert.equal(h.links.at(-1),old);
 old.message({type:'scan',id:'c'.repeat(24)});assert.equal(h.level.stage,'walk-sign');
 h.tick(250);assert.equal(old.closed,false);
 const fresh=h.links.at(-1);fresh.message({type:'scan',id:'d'.repeat(24)});
 assert.equal(h.level.stage,'walk-sign');fresh.message({type:'register',name:'Neuer Versuch'});fresh.message({type:'ticket-received',id:fresh.scanId,number:h.level.registrationTicket});
 assert.equal(h.level.stage,'waiting');assert.equal(h.level.registration.warnings,0);
});

test('forfeit stamps the old companion and stops ticket retries and late reactivation',()=>{
 const h=harness('phone'),old=h.incoming();old.message({type:'forfeit'});
 assert.equal(h.node('phone-expired').hidden,false);assert.equal(h.node('phone-call').hidden,true);
 assert.equal(h.node('phone-form').hidden,true);assert.equal(h.node('phone-submit').disabled,true);
 const sent=old.sent.length;h.tick(10000);old.emit('connected',{});
 old.message({type:'ticket',number:'Z-7',counter:1});assert.equal(old.sent.length,sent);
 assert.equal(h.node('phone-expired').hidden,false);assert.equal(h.node('phone-number').textContent,'B-223');
});

test('a completed appointment does not get the expiry stamp',()=>{
 const h=harness('phone');h.incoming().message({type:'done'});
 assert.equal(h.node('phone-expired').hidden,true);
});
test('an interrupted office visit forfeits the companion instead of reporting completion',()=>{
 const h=harness();h.wait();const old=h.links[0];h.node('amt-leave').click();assert.equal(h.level.active,false);assert.equal(old.sent.at(-1).type,'forfeit');assert.equal(h.counts.close,1);h.tick(250);assert.equal(old.closed,true);
});

test('a manual QR hash navigation reloads the companion, including its expired state',()=>{
 const h=harness('phone');h.incoming().message({type:'forfeit'});let reloads=0;
 h.window.location.reload=()=>reloads++;h.window.dispatchEvent(new Event('hashchange'));
 assert.equal(reloads,1);assert.equal(h.node('phone-expired').hidden,false);
});

test('choices live in the scene HUD and the legacy sheet cannot become a popup',()=>{
 const h=harness();assert(h.node('amt-walk-hud').children.includes(h.node('amt-actions')));
 assert.doesNotMatch(source('buergeramt.css'),/interactive\s+\.amt-sheet\s*\{display:block/);
});
