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
test('Frau Knick uses her talk row only while her visible counter line is active',()=>{
 const h=harness();h.counter();assert.equal(h.level.clerkPerformance.row,5);assert.equal(h.level.clerkPerformance.speaking,true);
 h.tick(10000);assert.equal(h.level.clerkPerformance.speaking,false);assert.notEqual(h.level.clerkPerformance.row,5);
});
test('an invalid frame delta cannot corrupt first-person movement',()=>{
 const h=harness();h.key('KeyW');const before=h.level.view;h.level.update(Number.NaN);h.key('KeyW','keyup');assert.deepEqual(h.level.view,before);
});
test('office regulars patrol and handle paperwork without changing the ticket',()=>{
 const h=harness(),start=h.level.characters;h.advanceGame(2.5);const later=h.level.characters;
 assert.equal(later.length,8);assert.ok(later.some((actor,i)=>actor.mode==='walk'&&Math.hypot(actor.x-start[i].x,actor.z-start[i].z)>.2));
 assert.equal(h.level.activated,false);assert.equal(h.links[0].sent.filter(m=>m.type==='ticket').length,0);
});

test('dense walk sampling preserves distance cadence and exposes intermediate phases',()=>{
 const h=harness();h.advanceGame(2.5);
 let previous=h.level.characters;
 const fine=new Set();let checked=0;
 for(let i=0;i<120;i++){
  h.level.update(.01);const current=h.level.characters;
  for(let j=0;j<current.length;j++){
   const a=previous[j],b=current[j];
   assert.ok(b.phase>=0&&b.phase<1);
   assert.equal(b.frame,Math.floor(b.phase*8));
   if(a.mode==='walk'&&b.mode==='walk'&&a.direction===b.direction){
    const distance=Math.hypot(b.x-a.x,b.z-a.z);
    const phaseStep=(b.phase-a.phase+1)%1;
    // Existing route arrival may snap <.025 world units without taking a step.
    if(phaseStep===0)assert.ok(distance<.025);
    else assert.ok(Math.abs(phaseStep-distance*8.5/8)<1e-10);
    fine.add(Math.floor(b.phase*16));checked++;
   }
  }
  previous=current;
 }
 assert.ok(checked>100);assert.ok([...fine].some(frame=>frame%2===1));
});
test('the Aktenkurier approaches, delivers the dark verse in a spotlight, and resumes his route',()=>{
 const h=harness('host',{cinematics:true});h.enterUntilOmen();assert.equal(h.level.omen.phase,'approach');h.advanceGame(9);
 assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'blackout');
 assert.ok(h.level.omen.strength>.95);assert.ok(Math.hypot(h.level.omen.x-h.level.view.x,h.level.omen.z-h.level.view.z)<1.8);
 assert.ok(Math.abs(h.level.view.yaw)>.1);assert.equal(h.document.body.classList.contains('amt-omen'),true);
 assert.equal(h.node('amt-line').textContent,'Wer die Finsternis sieht, hat sie selbst gewählt!');
 const board=h.level.queueDisplay;h.advanceGame(2);assert.equal(h.level.queueDisplay,board);
 h.tick(6000);h.advanceGame(1.5);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');assert.equal(h.level.omen.strength,0);
 assert.equal(h.level.characterMood,null);assert.ok(Math.abs(h.level.view.yaw)<.01);assert.equal(h.document.body.classList.contains('amt-omen'),false);h.advanceGame(4);
 assert.notEqual(h.level.queueDisplay,board);
 assert.notEqual(h.level.characters[0].mode,'gesture');
});
test('a nearby regular owns the visible dialogue mood and releases the queue on return',()=>{
 const h=harness();h.enter();h.moveTo(3.4,1.2);const actor=h.level.characters.find(a=>a.id==='formularsammler');
 assert.ok(Math.hypot(h.level.view.x-actor.x,h.level.view.z-actor.z)<1.65);
 const board=h.level.queueDisplay;h.level.interact();assert.equal(h.level.stage,'character');
 assert.equal(h.level.characterMood.id,'formularsammler');assert.equal(h.level.characterMood.tone,'dread');
 assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.characters.formularsammler.lines[0].line);
 h.advanceGame(4);assert.equal(h.level.queueDisplay,board);h.action();
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.characterMood,null);
});

test('city audio gates optional actor speech and a replaced cue never starts later',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.enter();h.moveTo(3.4,1.2);const before=h.synth.spoken.length;h.level.interact();
 assert.equal(h.level.stage,'character');h.tick(2500);assert.equal(h.synth.spoken.length,before);
 h.action();cityBusy=false;h.tick(500);assert.equal(h.synth.spoken.length,before);
 h.level.interact();assert.equal(h.level.stage,'character');h.tick(20);
 assert.equal(h.synth.spoken.length,before+1);
});

test('city audio gates waiting-room speech and releases it when the city clears',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.enter();h.advanceGame(9);const before=h.synth.spoken.length;
 assert.equal(before,0);assert.equal(h.node('amt-ambient').textContent,'');
 cityBusy=false;h.level.update(.1);assert.equal(h.synth.spoken.length,1);
 assert.match(h.node('amt-ambient').textContent,/WARTERAUM/);
});

test('city audio defers the optional omen and its tone until the city clears',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:true,cityAudioBusy:()=>cityBusy});
 h.enter();h.advanceGame(9);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');
 cityBusy=false;h.advanceGame(9);
 assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'blackout');
});

test('the clerk speech watchdog starts after city audio clears, not while waiting',()=>{
 let cityBusy=false;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.wait();const link=h.links[0];link.message({type:'register',name:'Erika Mustermann'});
 h.moveTo(4,-8.15);h.advanceGame(16);assert.equal(h.level.stage,'walk-counter');
 cityBusy=true;h.synth.speak=()=>{};h.level.interact();h.tick(3000);
 assert.equal(h.level.clerkPerformance.speaking,false);
 assert.equal(link.sent.filter(message=>message.type==='call-arm').length,0);
 cityBusy=false;h.tick(40);h.tick(1799);
 assert.equal(link.sent.filter(message=>message.type==='call-arm').length,0);
 h.tick(1);assert.equal(link.sent.filter(message=>message.type==='call-arm').length,1);
});

test('a failed clerk voice releases the handoff after city audio clears',()=>{
 let cityBusy=false;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.wait();const link=h.links[0];link.message({type:'register',name:'Erika Mustermann'});
 h.moveTo(4,-8.15);h.advanceGame(16);cityBusy=true;
 h.synth.speak=utterance=>utterance.onerror?.();h.level.interact();h.tick(3000);
 assert.equal(link.sent.filter(message=>message.type==='call-arm').length,0);
 cityBusy=false;h.tick(40);h.tick(16);
 assert.equal(link.sent.filter(message=>message.type==='call-arm').length,1);
 assert.equal(h.level.clerkPerformance.speaking,true);
});

test('replay and voice-off release deferred city-to-office speech safely',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.enter();h.moveTo(3.4,1.2);h.level.interact();const before=h.synth.spoken.length;
 h.level.replay(h.config);cityBusy=false;h.tick(1000);
 assert.equal(h.level.stage,'outside');assert.equal(h.synth.spoken.length,before);
 cityBusy=true;h.enter();h.moveTo(3.4,1.2);h.level.interact();h.config.voiceOn=()=>false;
 cityBusy=false;h.tick(40);assert.equal(h.synth.spoken.length,before);
 assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.characters.formularsammler.lines[0].line);
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
 const h=harness();h.counter();assert.equal(h.node('amt-actions').children.length,0);h.links[0].message({type:'decline',id:'grass'});assert.equal(h.level.timing.cues[-1].status,'declined');h.action();
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
 const h=harness();h.wait();h.links[0].message({type:'register',name:'Erika Mustermann'});h.moveTo(4,-8.15);h.advanceGame(16);h.links[0].fail=true;h.level.interact();assert.equal(h.level.stage,'expired');assert.equal(h.node('amt-actions').children.length,2);
});
test('the name button is required before the host arms a call, then readiness schedules its lead-in',()=>{
 const h=harness();h.wait();h.moveTo(4,-8.15);h.advanceGame(16);h.level.interact();assert.equal(h.level.stage,'walk-counter');assert.equal(h.links[0].sent.filter(m=>m.type==='call-arm').length,0);
 h.links[0].message({type:'register',name:'Erika Mustermann'});h.level.interact();assert.equal(h.links[0].sent.at(-1).type,'call-arm');assert.equal(h.links[0].sent.filter(m=>m.type==='call').length,0);
 h.links[0].message({type:'answer',id:'grass'});assert.equal(h.level.stage,'counter');
 h.links[0].message({type:'call-ready',id:'grass',atMs:h.now()});const plan=h.links[0].sent.at(-1);assert.equal(plan.type,'call');assert.equal(plan.leadMs,2200);assert.equal(plan.ringAtPhoneMs,null);assert.equal(plan.ringAtUtcMs,null);assert.equal(h.level.timing.call.ringAtMs-h.level.timing.call.signalAtMs,900);
});
test('the phone keeps the call hidden until its scheduled ring and cancels later vibration on decline',()=>{
 const h=harness('phone'),link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));link.message({type:'call-arm',id:'grass'});assert.equal(link.sent.at(-1).type,'call-ready');
 const baseline=h.vibrations.length;link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:1500,ringAtUtcMs:null,leadMs:2200});assert.equal(h.node('phone-call').hidden,true);assert.equal(link.sent.at(-1).type,'call-scheduled');assert.equal(link.sent.at(-1).mode,'peer');h.tick(1499);assert.equal(h.vibrations.length,baseline);h.tick(1);assert.equal(h.node('phone-call').hidden,false);assert.ok(h.vibrations.length>baseline);h.node('phone-decline').click();const count=h.vibrations.length;h.tick(6000);assert.equal(h.vibrations.length,count);assert.equal(h.vibrations.at(-1),0);
});
test('a qualified UTC anchor schedules the phone when the direct peer offset is unavailable',async()=>{
 const anchor={utcOffsetMs:100000,sampledAtMs:0,uncertaintyMs:20};
 const phoneClock={sample:async()=>anchor,usable:a=>!!a,utcAt:(a,mono)=>a.utcOffsetMs+mono,monoAt:(a,utc)=>utc-a.utcOffsetMs};
 const h=harness('phone',{phoneClock});await Promise.resolve();const link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));link.message({type:'call-arm',id:'grass'});
 link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:null,ringAtUtcMs:101000,leadMs:2200});assert.equal(link.sent.at(-1).mode,'utc');assert.equal(link.sent.at(-1).atMs,1000);h.tick(999);assert.equal(h.node('phone-call').hidden,true);h.tick(1);assert.equal(h.node('phone-call').hidden,false);
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
test('starting a clerk cue does not cancel an already idle speech engine',()=>{
 const h=harness('host',{voice:true});h.counter();h.tick(20);h.synth.end();const before=h.synth.cancelCount;h.links[0].message({type:'answer',id:'grass'});assert.equal(h.synth.cancelCount,before);
});
test('the host remains playable without a browser speech implementation',()=>{
 const h=harness('host',{synthesis:false});h.enter();assert.equal(h.level.stage,'walk-sign');h.level.replay(h.config);assert.equal(h.level.stage,'outside');
});
test('answered call waits for each screen, then overlaps one deliberate interruption',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'answer',id:'grass'});h.tick(20);const first=h.node('amt-line').textContent;h.tick(6000);assert.equal(h.node('amt-line').textContent,first);h.synth.end();h.tick(500);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,0);
 h.links[0].message({type:'police-done',index:-1,mode:'voice',durationMs:0,atMs:h.now()});h.tick(700);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,1);assert.equal(h.node('amt-line').textContent,first);
 h.links[0].message({type:'police-done',index:0,mode:'voice',durationMs:0,atMs:h.now()});h.tick(500);assert.match(h.node('amt-line').textContent,/Herr Wachtmeister/);h.synth.end();h.tick(350);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,2);
 h.links[0].message({type:'police-done',index:1,mode:'voice',durationMs:0,atMs:h.now()});h.tick(500);assert.match(h.node('amt-line').textContent,/vierundsiebzig/);h.tick(7000);assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,3);assert.match(h.node('amt-line').textContent,/vierundsiebzig/);
});
test('the host measures round trip delay on its own clock and ignores stale pongs',()=>{
 const h=harness(),link=h.links[0];link.emit('connected',{});assert.deepEqual(link.sent.at(-1),{type:'sync-ping',id:1});h.tick(120);link.message({type:'sync-pong',id:1,receivedAtMs:50,sentAtMs:70});assert.equal(h.level.timing.rttMs,100);assert.equal(h.level.timing.oneWayMs,50);assert.equal(h.level.timing.clockOffsetMs,0);assert.equal(h.level.timing.clockUncertaintyMs,50);
 h.tick(1380);assert.equal(link.sent.at(-1).id,2);h.tick(260);link.message({type:'sync-pong',id:2,receivedAtMs:1600,sentAtMs:1610});assert.equal(h.level.timing.rttMs,250);assert.equal(h.level.timing.oneWayMs,125);assert.equal(h.level.timing.jitterMs,150);assert.equal(h.level.timing.clockUncertaintyMs,125);
 link.message({type:'sync-pong',id:1,receivedAtMs:50,sentAtMs:70});assert.equal(h.level.timing.jitterMs,150);h.level.replay(h.config);assert.equal(h.level.timing.rttMs,null);assert.equal(h.links[1].sent.length,0);
});
test('police receipts verify duration and do not advance a turn twice',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];link.emit('connected',{});h.tick(20);link.message({type:'sync-pong',id:1,receivedAtMs:10,sentAtMs:10});h.counter();link.message({type:'answer',id:'grass'});h.tick(20);link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:20,atMs:h.now()});h.tick(320);link.message({type:'police-done',index:-1,mode:'voice',durationMs:320,atMs:h.now()});assert.equal(h.level.timing.cues[-1].status,'verified');const doneAt=h.level.timing.cues[-1].doneAt;
 link.message({type:'police-done',index:-1,mode:'voice',durationMs:9000,atMs:h.now()});assert.equal(h.level.timing.cues[-1].doneAt,doneAt);h.synth.end();h.tick(700);assert.equal(link.sent.filter(m=>m.type==='police-line').length,1);
 link.message({type:'police-start',index:0,mode:'voice',readyDelayMs:50,atMs:h.now()});h.tick(800);link.message({type:'police-done',index:0,mode:'voice',durationMs:100,atMs:h.now()});assert.equal(h.level.timing.cues[0].status,'drift');
});
test('clock-offset mapping keeps phone speech time stable when a receipt arrives late',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];link.emit('connected',{});h.tick(100);link.message({type:'sync-pong',id:1,receivedAtMs:5045,sentAtMs:5055});assert.equal(h.level.timing.clockOffsetMs,5000);h.counter();link.message({type:'answer',id:'grass'});h.tick(20);link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:20,atMs:5120});h.tick(900);link.message({type:'police-done',index:-1,mode:'voice',durationMs:300,atMs:5420});const cue=h.level.timing.cues[-1];assert.equal(cue.status,'verified');assert.equal(cue.estimatedStartAt,120);assert.equal(cue.estimatedEndAt,420);assert.equal(cue.receiptJitter,true);
});
test('a late phone receipt cannot replace a timed-out turn',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});h.tick(18000);assert.equal(h.level.timing.cues[-1].status,'timeout');link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:0,atMs:h.now()});link.message({type:'police-done',index:-1,mode:'voice',durationMs:100,atMs:h.now()});assert.equal(h.level.timing.cues[-1].status,'timeout');assert.ok(Number.isFinite(h.level.timing.cues[-1].lateDoneAt));h.tick(700);assert.equal(link.sent.filter(m=>m.type==='police-line').length,1);
});
test('a confirmed phone speech start extends only its own completion deadline',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});h.tick(17000);assert.equal(h.level.timing.cues[-1].status,'waiting');link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:4000,atMs:h.now()});h.tick(23000);assert.equal(h.level.timing.cues[-1].status,'waiting');h.tick(1000);assert.equal(h.level.timing.cues[-1].status,'timeout');
});
test('a disconnected phone releases the argument without waiting through four timeouts',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});link.emit('status','Telefon getrennt');assert.equal(h.level.timing.cues[-1].status,'disconnected');h.tick(100000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
test('the officer interrupts after Frau Knick says her counter handles applications',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});h.tick(20);h.synth.end();link.message({type:'police-done',index:-1,mode:'voice',durationMs:0,atMs:h.now()});h.tick(700);assert.equal(link.sent.filter(m=>m.type==='police-line').length,1);
 h.tick(500);link.message({type:'police-start',index:0,mode:'voice',readyDelayMs:500,atMs:h.now()});assert.equal(h.level.timing.phoneReadyMs,500);assert.equal(h.level.timing.startLagMs,500);link.message({type:'police-done',index:0,mode:'voice',durationMs:0,atMs:h.now()});h.tick(500);h.synth.end();h.tick(1);assert.equal(link.sent.filter(m=>m.type==='police-line').length,2);
 link.message({type:'police-done',index:1,mode:'voice',durationMs:0,atMs:h.now()});h.tick(500);assert.match(h.node('amt-line').textContent,/vierundsiebzig/);h.tick(1800);assert.equal(link.sent.filter(m=>m.type==='police-line').length,2);const boundary=h.node('amt-line').textContent.indexOf('!')-9;h.synth.current.onboundary({charIndex:boundary});assert.equal(link.sent.filter(m=>m.type==='police-line').length,3);h.synth.current.onboundary({charIndex:boundary+1});assert.equal(link.sent.filter(m=>m.type==='police-line').length,3);
});
test('phone emits start and finish receipts around actual speech, and answers pings',()=>{
 const h=harness('phone');h.incoming();const link=h.links[0];link.message({type:'sync-ping',id:19});assert.deepEqual(link.sent.at(-1),{type:'sync-pong',id:19,receivedAtMs:0,sentAtMs:0});h.node('phone-answer').click();h.tick(20);assert.equal(link.sent.at(-1).type,'police-start');assert.equal(link.sent.at(-1).index,-1);assert.ok(link.sent.at(-1).readyDelayMs>=0);assert.equal(link.sent.at(-1).atMs,16);h.tick(240);h.synth.end();const done=link.sent.at(-1);assert.equal(done.type,'police-done');assert.equal(done.index,-1);assert.equal(done.mode,'voice');assert.ok(done.durationMs>=240&&done.durationMs<=260);assert.equal(done.atMs,h.now());
});
test('stalled phone speech becomes readable within 1.8 seconds and ignores a late start',()=>{
 const h=harness('phone');let late;h.synth.speak=utterance=>{late=utterance};h.incoming();const link=h.links[0];h.node('phone-answer').click();h.tick(1799);assert.equal(link.sent.filter(m=>m.type==='police-start').length,0);h.tick(1);const start=link.sent.at(-1);assert.equal(start.type,'police-start');assert.equal(start.mode,'fallback');assert.equal(h.node('phone-call-line').hidden,false);late.onstart();late.onerror();assert.equal(link.sent.filter(m=>m.type==='police-start').length,1);h.tick(10000);assert.equal(link.sent.filter(m=>m.type==='police-done').length,1);
});
test('a measured quick phone voice start shortens the next stalled-line watchdog',()=>{
 const h=harness('phone');h.incoming();const link=h.links[0];h.node('phone-answer').click();h.tick(20);h.synth.end();h.tick(1);h.synth.speak=()=>{};link.message({type:'police-line',index:0,line:'Können Sie mich hören?'});h.tick(1199);assert.equal(link.sent.filter(m=>m.type==='police-start'&&m.index===0).length,0);h.tick(1);const start=link.sent.at(-1);assert.equal(start.type,'police-start');assert.equal(start.index,0);assert.equal(start.mode,'fallback');
});
test('a failed first phone voice also shortens the next stalled-line watchdog',()=>{
 const h=harness('phone');h.incoming();const link=h.links[0];h.node('phone-answer').click();h.tick(20);h.synth.current.onerror();h.tick(10000);h.synth.speak=()=>{};link.message({type:'police-line',index:0,line:'Können Sie mich hören?'});h.tick(1199);assert.equal(link.sent.filter(m=>m.type==='police-start'&&m.index===0).length,0);h.tick(1);const start=link.sent.at(-1);assert.equal(start.type,'police-start');assert.equal(start.index,0);assert.equal(start.mode,'fallback');
});
test('phone scan asks for a ticket immediately; the name can be added afterwards',()=>{
 const h=harness('phone');assert.equal(h.node('phone-ticket').hidden,true);h.phoneReady();assert.equal(h.links[0].sent[0].type,'scan');assert.equal(h.node('phone-form').hidden,false);assert.equal(h.node('phone-number').textContent,'B-223');h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(h.links[0].sent.at(-1).type,'register');assert.equal(h.node('phone-form').hidden,true);
});
test('phone retries the same scan until a ticket arrives',()=>{
 const h=harness('phone'),link=h.links[0];link.emit('connected',{});const first=link.sent.at(-1);h.tick(3001);const scans=link.sent.filter(message=>message.type==='scan');assert.equal(scans.length,3);assert.ok(scans.every(message=>message.id===first.id));link.message({type:'ticket',number:'B-223'});h.tick(3001);assert.equal(link.sent.filter(message=>message.type==='scan').length,3);
});
test('name submission silently unlocks audio after the ticket',()=>{
 const h=harness('phone');let resumes=0;h.window.AudioContext=class{createGain(){return{gain:{value:0},connect(){}}}resume(){resumes++;return Promise.resolve()}};h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(resumes,1);assert.ok(h.vibrations.every(pattern=>pattern===0));assert.equal(h.fullscreenRequests.length,1);h.links[0].message({type:'ticket',number:'B-224'});assert.equal(h.node('phone-number').textContent,'B-224');assert.equal(h.node('phone-ticket').hidden,false);
});
test('incoming call repeats vibration and stops it after decline',()=>{
 const h=harness('phone');h.incoming();const first=h.vibrations.length;assert.ok(first>=1);h.tick(3000);assert.ok(h.vibrations.length>first);h.node('phone-decline').click();assert.equal(h.vibrations.at(-1),0);
});
test('phone police speech automatically uses maximum browser volume',()=>{
 const h=harness('phone');
 h.incoming();h.node('phone-answer').click();h.tick(20);
 assert.equal(h.synth.spoken[0].text,h.node('phone-call-line').textContent);
 assert.equal(h.synth.spoken[0].volume,1);
});
test('phone answer/decline are one-shot and sent with the current call id',()=>{
 for(const decision of ['answer','decline']){const h=harness('phone');h.incoming();h.node('phone-'+decision).click();h.node('phone-'+decision).click();const decisions=h.links[0].sent.filter(m=>m.type===decision);assert.equal(decisions.length,1);assert.equal(decisions[0].id,'grass')}
});
test('the incoming caller stays unknown, with host subtitles ahead of the phone browser language',()=>{
 for(const [options,expected] of [[{phoneLanguage:'de-DE'},'Unbekannte Nummer'],[{phoneLanguage:'en-GB'},'Unknown number'],[{phoneLanguage:'de-DE',phoneCaptions:true},'Unknown number'],[{phoneLanguage:'fr-FR'},'Unbekannte Nummer']]){
  const h=harness('phone',options);h.incoming();assert.equal(h.node('phone-caller').textContent,expected);assert.equal(h.node('phone-call').lang,expected==='Unknown number'?'en':'de');assert.equal(h.node('phone-call-state').textContent,expected==='Unknown number'?'INCOMING CALL':'EINGEHENDER ANRUF');h.node('phone-answer').click();assert.equal(h.node('phone-call-state').textContent,expected==='Unknown number'?'CONNECTED':'VERBUNDEN');
 }
});
test('Google Phone drags right to answer or left to decline, with tap fallback',()=>{
 const options={phoneAgent:'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36',phonePlatform:'Android'};
 const gesture=(el,type,x,y=0)=>{const e=new Event(type);Object.assign(e,{pointerId:1,clientX:x,clientY:y,isPrimary:true});el.dispatchEvent(e)};
 const h=harness('phone',options);h.incoming();assert.equal(h.document.documentElement.dataset.callUi,'google');const button=h.node('phone-answer');gesture(button,'pointerdown',0);gesture(button,'pointermove',20);gesture(button,'pointerup',20);button.click();assert.equal(h.links[0].sent.filter(m=>m.type==='answer').length,0);
 gesture(button,'pointerdown',0);gesture(button,'pointermove',160);gesture(button,'pointerup',160);button.click();assert.equal(h.links[0].sent.filter(m=>m.type==='answer').length,1);
 const decline=harness('phone',options);decline.incoming();const handle=decline.node('phone-answer');gesture(handle,'pointerdown',0);gesture(handle,'pointermove',-160);gesture(handle,'pointerup',-160);handle.click();assert.equal(decline.links[0].sent.filter(m=>m.type==='decline').length,1);
 const tap=harness('phone',options);tap.incoming();tap.node('phone-swipe-label').click();assert.equal(tap.links[0].sent.filter(m=>m.type==='answer').length,1);
});
test('Samsung Phone drags either handset away from its starting point',()=>{
 const options={phoneAgent:'Mozilla/5.0 (Linux; Android 15; SM-S928B) SamsungBrowser/28.0 Mobile',phonePlatform:'Android'};
 const gesture=(el,type,x)=>{const e=new Event(type);Object.assign(e,{pointerId:1,clientX:x,clientY:0,isPrimary:true});el.dispatchEvent(e)};
 for(const [id,dx,expected] of [['phone-answer',40,'answer'],['phone-decline',-40,'decline']]){
  const h=harness('phone',options);h.incoming();assert.equal(h.document.documentElement.dataset.callUi,'samsung');const button=h.node(id);gesture(button,'pointerdown',0);gesture(button,'pointermove',dx);gesture(button,'pointerup',dx);button.click();assert.equal(h.links[0].sent.filter(m=>m.type===expected).length,1);
 }
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
test('a stalled clerk voice starts a readable fallback within the learned startup limit and rejects late speech',()=>{
 const h=harness('host',{voice:true});let late;h.synth.speak=utterance=>{late=utterance};h.counter();h.links[0].message({type:'answer',id:'grass'});h.tick(1199);assert.equal(h.level.timing.desk[0].startAt,null);h.tick(1);assert.equal(h.level.timing.desk[0].startMode,'fallback');assert.equal(h.level.timing.desk[0].startAt,h.now());late.onstart();late.onend();assert.equal(h.level.timing.desk[0].endAt,null);h.tick(100);assert.equal(h.counts.cancel,0);
});
test('a failed police voice displays its line instead of silently skipping it',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.tick(20);h.node('phone-call-line').hidden=true;h.synth.current.onerror();assert.equal(h.node('phone-call-line').hidden,false);assert.equal(h.node('phone-call-line').textContent,h.window.BuergeramtStory.call.line);
});

test('a synchronous speech failure retains the automatic clerk line for reading',()=>{
 const h=harness('host',{voice:true});h.synth.speak=()=>{throw new Error('Speech service unavailable')};h.counter();h.links[0].message({type:'answer',id:'grass'});const first=h.node('amt-line').textContent;h.tick(2000);assert.equal(h.node('amt-line').textContent,first);assert.equal(h.counts.cancel,0);h.tick(150000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
