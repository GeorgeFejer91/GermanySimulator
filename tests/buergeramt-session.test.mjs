import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

test('walking through the open doorway continues into the room',()=>{
 const h=harness();h.key('KeyW');h.advanceGame(1.5);h.key('KeyW','keyup');
 assert.equal(h.level.stage,'walk-sign');assert.ok(h.level.view.z<5.55);
});
test('the entrance action cannot pass through the facade wing',()=>{
 const h=harness();h.moveTo(1.65,6.3);h.level.interact();assert.equal(h.level.stage,'outside');
});
test('the clerk encounter remains on the public side of the desk',()=>{
 const h=harness();h.counter();assert.ok(h.level.view.z>=-8.32);
});
test('an invalid frame delta cannot corrupt first-person movement',()=>{
 const h=harness();h.key('KeyW');const before=h.level.view;h.level.update(Number.NaN);h.key('KeyW','keyup');assert.deepEqual(h.level.view,before);
});

test('the board calls continuously and each scan issues a fresh active ticket without a popup',()=>{
 const h=harness();assert.equal(h.level.queueDisplay,'B-041');h.enter();h.advanceGame(4);const firstCall=h.level.queueDisplay;assert.match(firstCall,/^[A-Z]-\d+/);h.advanceGame(4);assert.notEqual(h.level.queueDisplay,firstCall);assert.equal(h.level.stage,'walk-sign');
 h.links[0].message({type:'scan',id:'a'.repeat(24)});const first=h.links[0].sent.at(-1);assert.equal(first.type,'ticket');assert.equal(h.level.activated,true);assert.equal(h.level.stage,'waiting');assert.equal(h.node('amt-level').classList.contains('walking'),true);
 h.links[0].message({type:'scan',id:'a'.repeat(24)});assert.equal(h.links[0].sent.at(-1).number,first.number);
 h.links[0].message({type:'scan',id:'b'.repeat(24)});const second=h.links[0].sent.at(-1);assert.equal(second.type,'ticket');assert.notEqual(second.number,first.number);
 h.links[0].message({type:'register',name:'  Erika   Mustermann '});assert.equal(h.level.registeredName,'Erika Mustermann');
});
test('a new scan after a missed appointment starts another counter opportunity',()=>{
 const h=harness();h.wait();const first=h.links[0].sent.at(-1).number;h.advanceGame(17);assert.equal(h.level.stage,'walk-counter');h.advanceGame(20);assert.equal(h.level.stage,'expired');h.links[0].message({type:'scan',id:'b'.repeat(24)});assert.equal(h.level.stage,'waiting');assert.equal(h.level.activated,true);assert.notEqual(h.links[0].sent.at(-1).number,first);
});
test('decline completes all clerk questions and grants A38 exactly once',()=>{
 const h=harness();h.counter();assert.equal(h.node('amt-actions').children.length,0);h.links[0].message({type:'decline',id:'grass'});h.action();
 let finalButton;for(let i=0;i<4;i++){assert.equal(h.node('amt-actions').children.length,3);h.action();finalButton=h.action()}
 assert.deepEqual(h.counts,{form:1,cancel:0,close:0});assert.equal(h.level.active,false);assert.equal(h.level.activated,false);finalButton.click();assert.equal(h.counts.form,1);
 assert.deepEqual(h.music,[true,false]);
});
test('answer automatically cancels without ever issuing A38',()=>{
 const h=harness();h.counter();h.links[0].message({type:'answer',id:'grass'});assert.equal(h.level.stage,'cancelled');assert.equal(h.node('amt-actions').children.length,0);
 h.tick(150000);assert.deepEqual(h.counts,{form:0,cancel:1,close:0});assert.equal(h.level.active,false);
 assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,3);
});
test('early approach reprimands; late arrival expires without A38',()=>{
 const h=harness();h.wait();h.moveTo(4,-8.15);h.level.interact();assert.equal(h.level.stage,'early');assert.match(h.node('amt-line').textContent,/dienstliche Tätigkeit/);h.action();
 h.advanceGame(16);assert.equal(h.level.stage,'walk-counter');h.advanceGame(20);assert.equal(h.level.stage,'expired');assert.equal(h.level.activated,false);h.action(1);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
test('a delayed decline cannot resurrect a forfeited appointment',()=>{
 const h=harness();h.counter();h.links[0].message({type:'phone-hidden'});assert.equal(h.level.stage,'expired');h.links[0].message({type:'decline',id:'grass'});assert.equal(h.level.stage,'expired');assert.equal(h.counts.form,0);
});
test('a delayed answer cannot resurrect a forfeited appointment',()=>{
 const h=harness();h.counter();h.links[0].emit('status','Telefon getrennt');h.links[0].message({type:'answer',id:'grass'});assert.equal(h.level.stage,'expired');h.tick(90000);assert.equal(h.counts.form,0);assert.equal(h.counts.cancel,0);
});
test('a failed ticket delivery does not start a queue slot',()=>{
 const h=harness();h.enter();h.links[0].fail=true;h.links[0].message({type:'scan',id:'a'.repeat(24)});assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.activated,false);
});
test('failed police-call delivery cannot trap the player at the counter',()=>{
 const h=harness();h.wait();h.moveTo(4,-8.15);h.advanceGame(16);h.links[0].fail=true;h.level.interact();assert.equal(h.level.stage,'expired');assert.equal(h.node('amt-actions').children.length,2);
});
test('replay ignores old link messages and status events',()=>{
 const h=harness();const old=h.links[0];h.level.replay(h.config);old.message({type:'register',name:'OLD ATTEMPT'});old.emit('status','old status');assert.equal(h.level.registeredName,'');assert.notEqual(h.node('amt-status').textContent,'old status');
});
test('replay cancels the previous argument timers',()=>{
 const h=harness();h.counter();h.links[0].message({type:'answer',id:'grass'});h.tick(4000);h.level.replay(h.config);h.counter();h.links[1].message({type:'answer',id:'grass'});
 h.tick(27501);assert.equal(h.counts.cancel,0);assert.equal(h.level.stage,'cancelled');h.tick(150000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
test('key release during a modal does not leave movement stuck',()=>{
 const h=harness();h.wait();h.moveTo(4,-8.15);h.key('KeyW');h.level.interact();assert.equal(h.level.stage,'early');h.key('KeyW','keyup');h.action();const before=h.level.view;h.level.update(.1);assert.deepEqual(h.level.view,before);
});
test('stale choice and continuation buttons cannot skip clerk stages',()=>{
 const h=harness();h.counter();h.links[0].message({type:'decline',id:'grass'});h.action();const oldChoice=h.node('amt-actions').children[0];oldChoice.click();const oldNext=h.node('amt-actions').children[0];oldNext.click();const second=h.node('amt-line').textContent;oldNext.click();oldChoice.click();assert.equal(h.node('amt-line').textContent,second);assert.equal(h.counts.form,0);
});
test('identical speech from a previous attempt cannot start after replay',()=>{
 const h=harness('host',{voice:true});h.wait();h.moveTo(4,-8.15);h.level.interact();h.level.replay(h.config);h.wait();h.moveTo(4,-8.15);h.level.interact();h.tick(20);assert.equal(h.synth.spoken.length,1);assert.equal(h.synth.spoken[0].text,h.node('amt-line').textContent);
});
test('returning to walking cancels speech whose modal is now hidden',()=>{
 const h=harness('host',{voice:true});h.wait();h.moveTo(4,-8.15);h.level.interact();h.tick(20);assert.equal(h.synth.speaking,true);h.action();assert.equal(h.synth.speaking,false);
});
test('the host remains playable without a browser speech implementation',()=>{
 const h=harness('host',{synthesis:false});h.enter();assert.equal(h.level.stage,'walk-sign');h.level.replay(h.config);assert.equal(h.level.stage,'outside');
});
test('answered call waits for each screen, then overlaps one deliberate interruption',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'answer',id:'grass'});h.tick(20);const first=h.node('amt-line').textContent;h.tick(6000);assert.equal(h.node('amt-line').textContent,first);h.synth.end();h.tick(500);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,0);
 h.links[0].message({type:'police-done',index:-1});h.tick(700);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,1);assert.equal(h.node('amt-line').textContent,first);
 h.links[0].message({type:'police-done',index:0});h.tick(350);assert.match(h.node('amt-line').textContent,/Herr Wachtmeister/);h.synth.end();h.tick(350);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,2);
 h.links[0].message({type:'police-done',index:1});h.tick(350);assert.match(h.node('amt-line').textContent,/vierundsiebzig/);h.tick(950);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,3);assert.match(h.node('amt-line').textContent,/vierundsiebzig/);
});
test('phone scan asks for a ticket immediately; the name can be added afterwards',()=>{
 const h=harness('phone');assert.equal(h.node('phone-ticket').hidden,true);h.phoneReady();assert.equal(h.links[0].sent[0].type,'scan');assert.equal(h.node('phone-form').hidden,false);assert.equal(h.node('phone-number').textContent,'B-223');h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(h.links[0].sent.at(-1).type,'register');assert.equal(h.node('phone-form').hidden,true);
});
test('phone retries the same scan until a ticket arrives',()=>{
 const h=harness('phone'),link=h.links[0];link.emit('connected',{});const first=link.sent.at(-1);h.tick(3001);const scans=link.sent.filter(message=>message.type==='scan');assert.equal(scans.length,3);assert.ok(scans.every(message=>message.id===first.id));link.message({type:'ticket',number:'B-223'});h.tick(3001);assert.equal(link.sent.filter(message=>message.type==='scan').length,3);
});
test('name submission silently unlocks audio after the ticket',()=>{
 const h=harness('phone');let resumes=0;h.window.AudioContext=class{resume(){resumes++;return Promise.resolve()}};h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(resumes,1);assert.ok(h.vibrations.every(pattern=>pattern===0));assert.equal(h.fullscreenRequests.length,1);h.links[0].message({type:'ticket',number:'B-224'});assert.equal(h.node('phone-number').textContent,'B-224');assert.equal(h.node('phone-ticket').hidden,false);
});
test('incoming call repeats vibration and stops it after decline',()=>{
 const h=harness('phone');h.incoming();const first=h.vibrations.length;assert.ok(first>=1);h.tick(3000);assert.ok(h.vibrations.length>first);h.node('phone-decline').click();assert.equal(h.vibrations.at(-1),0);
});
test('phone answer/decline are one-shot and sent with the current call id',()=>{
 for(const decision of ['answer','decline']){const h=harness('phone');h.incoming();h.node('phone-'+decision).click();h.node('phone-'+decision).click();const decisions=h.links[0].sent.filter(m=>m.type===decision);assert.equal(decisions.length,1);assert.equal(decisions[0].id,'grass')}
});
test('a failed phone answer is not presented as an accepted call',()=>{
 const h=harness('phone');h.incoming();h.links[0].fail=true;h.node('phone-answer').click();assert.equal(h.node('phone-call').hidden,true);assert.match(h.node('phone-status').textContent,/verfallen/);assert.equal(h.links[0].closed,true);
});
test('forfeiture removes the incoming/active call and cancels pending speech',()=>{
 for(const answered of [false,true]){const h=harness('phone');h.incoming();if(answered)h.node('phone-answer').click();h.links[0].message({type:'forfeit'});h.tick(20);assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.spoken.length,0);assert.match(h.node('phone-status').textContent,/verfallen/)}
});
test('a late call cannot revive a forfeited phone slot',()=>{
 const h=harness('phone');h.phoneReady();h.links[0].message({type:'forfeit'});h.links[0].message({type:'call',id:'grass',line:'Später Anruf'});assert.equal(h.node('phone-call').hidden,true);assert.match(h.node('phone-status').textContent,/verfallen/);
});
test('disconnect clears the phone call and speech',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.tick(20);assert.equal(h.synth.speaking,true);h.links[0].emit('status','Telefon getrennt');assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.speaking,false);
});
test('backgrounding an active phone forfeits it and stops call audio',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.tick(20);h.hide();assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.speaking,false);assert.equal(h.links[0].closed,true);assert.equal(h.links[0].sent.at(-1).type,'phone-hidden');
});
test('ticket delivered to an already hidden phone is forfeited',()=>{
 const h=harness('phone');h.document.hidden=true;h.phoneReady();assert.equal(h.links[0].sent.at(-1).type,'phone-hidden');assert.match(h.node('phone-status').textContent,/verfallen/);
});
test('police lines queue without replacing the text of speech still playing',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.tick(20);const first=h.node('phone-call-line').textContent;h.links[0].message({type:'police-line',index:0,line:'Die nächste polizeiliche Zeile.'});h.tick(20);assert.equal(h.synth.spoken.length,1);assert.equal(h.node('phone-call-line').textContent,first);h.synth.end();assert.equal(h.links[0].sent.at(-1).index,-1);h.tick(300);assert.equal(h.synth.spoken.length,2);assert.equal(h.node('phone-call-line').textContent,'Die nächste polizeiliche Zeile.');h.synth.end();assert.equal(h.links[0].sent.at(-1).index,0);
});
test('declining prevents subsequent police speech or a duplicate call',()=>{
 const h=harness('phone');h.incoming();h.node('phone-decline').click();h.links[0].message({type:'police-line',index:0,line:'Darf nicht sprechen.'});h.links[0].message({type:'call',id:'grass',line:'Doppelter Anruf'});h.tick(30);assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.spoken.length,0);
});
test('done keeps an earlier forfeiture outcome instead of claiming success',()=>{
 const h=harness('phone');h.incoming();h.links[0].message({type:'forfeit'});h.links[0].message({type:'done'});assert.match(h.node('phone-status').textContent,/verfallen/);
});
test('page exit cancels the clock and all pending phone callbacks',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.window.dispatchEvent(new Event('pagehide'));h.tick(90000);assert.equal(h.synth.spoken.length,0);assert.equal(h.timers.size,0);assert.equal(h.links[0].closed,true);
});
test('a failed clerk voice retains a readable automatic-argument line',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'answer',id:'grass'});h.tick(20);const first=h.node('amt-line').textContent;h.synth.current.onerror();h.tick(2000);assert.equal(h.node('amt-line').textContent,first);assert.equal(h.counts.cancel,0);
});
test('a failed police voice displays its line instead of silently skipping it',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.tick(20);h.node('phone-call-line').hidden=true;h.synth.current.onerror();assert.equal(h.node('phone-call-line').hidden,false);assert.equal(h.node('phone-call-line').textContent,h.window.BuergeramtStory.call.line);
});

test('a synchronous speech failure retains the automatic clerk line for reading',()=>{
 const h=harness('host',{voice:true});h.synth.speak=()=>{throw new Error('Speech service unavailable')};h.counter();h.links[0].message({type:'answer',id:'grass'});const first=h.node('amt-line').textContent;h.tick(2000);assert.equal(h.node('amt-line').textContent,first);assert.equal(h.counts.cancel,0);h.tick(150000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
