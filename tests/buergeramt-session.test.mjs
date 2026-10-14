import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';
function recordedPhone({named=false}={}){
 const h=harness('phone',{candidatePhone:true}),played=[],Audio=h.window.Audio;
 vm.runInContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),h.context);
 h.window.Audio=h.context.Audio=class extends Audio{
  constructor(src){super(src);this.volume=1}play(){played.push(this);this.paused=false;return super.play()}
 };
 if(named){const binding=h.window.GermanySimulatorAudioText.productionVoices.kriminalpolizei;
  h.window.GermanyKripoSpeech={validName:value=>value,rememberName(){},dispose(){},peek:()=>({status:'ready',text:h.window.BuergeramtStory.call.greeting('Erika Mustermann')}),
   lease:()=>({url:'blob:prepared-kripo',voiceId:'kriminalpolizei',profileId:binding.profileId,referenceSha256:binding.referenceSha256,release(){}})}}
 h.played=played;return h;
}
function personalizedIncoming(h){
 const link=h.phoneReady(),story=h.window.BuergeramtStory;
 h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'call-arm',id:'grass'});
 link.message({type:'call',id:'grass',line:story.call.body,greeting:story.call.greeting('Erika Mustermann'),ringAtPhoneMs:h.now(),ringAtUtcMs:null,leadMs:2200});return link;
}
function completeOpening(h){
 const link=h.links[0];link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:20,atMs:h.now()});h.tick(20);
 link.message({type:'police-done',index:-1,mode:'voice',durationMs:20,atMs:h.now()});h.tick(h.window.BuergeramtStory.outburst.cutAfterMs[0]/h.level.timeScale+40);
 assert.equal(link.sent.filter(m=>m.type==='police-line').at(-1).index,0);
}

test('the appointment page exposes no call transcript, silence action or pairing status',()=>{
 assert.doesNotMatch(source('buergeramt-phone.html'),/phone-call-line|phone-silence|phone-connect-status|Verbindung|SILENCE CALLS/);
 const h=harness('phone');h.incoming();const status=h.node('phone-status').textContent;
 h.node('phone-answer').click();h.tick(2020);assert.equal(h.node('phone-call-state').textContent,'00:02');assert.equal(h.node('phone-choices').hidden,true);assert.equal(h.node('phone-status').textContent,status);
 h.links[0].message({type:'done'});assert.equal(h.node('phone-call').hidden,true);const end=h.node('phone-call-state').textContent;h.tick(3000);assert.equal(h.node('phone-call-state').textContent,end);
});

test('phone playback receipts own desktop police captions and stale receipts cannot replace the clerk',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});
 assert.equal(h.node('amt-ambient').textContent,'');
 link.message({type:'police-start',index:-1,mode:'recording',readyDelayMs:20,atMs:h.now()});
 assert.equal(h.node('amt-ambient').textContent,'KRIMINALPOLIZEI · '+h.window.BuergeramtStory.call.line);
 assert.equal(h.node('english-subtitle').hidden,false);assert.equal(h.node('english-subtitle').lang,'de');assert.equal(h.node('english-subtitle').textContent,h.window.BuergeramtStory.call.line);
 link.message({type:'police-done',index:-1,mode:'recording',durationMs:100,atMs:h.now()+100});h.tick(20);
 const clerk=h.node('amt-ambient').textContent;assert.ok(clerk.includes(h.window.BuergeramtStory.outburst.lines[0]));
 link.message({type:'police-start',index:-1,mode:'recording',readyDelayMs:20,atMs:h.now()});assert.equal(h.node('amt-ambient').textContent,clerk);
 link.message({type:'police-start',index:0,mode:'recording',readyDelayMs:20,atMs:h.now()});assert.equal(h.node('amt-ambient').textContent,clerk,'unsolicited line cannot start a caption');
});

test('the smartphone game browser does not show telephone subtitles',()=>{
 const h=harness('host',{voice:true,phonePlatform:'Android'}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});link.message({type:'police-start',index:-1,mode:'recording',readyDelayMs:20,atMs:h.now()});assert.equal(h.node('amt-ambient').textContent,'');
 link.message({type:'police-done',index:-1,mode:'recording',durationMs:100,atMs:h.now()+100});h.tick(20);assert.ok(h.node('amt-ambient').textContent.includes(h.window.BuergeramtStory.outburst.lines[0]));
});

test('office speech owns admission until completion, with no busy voice-off fallback',()=>{
 const h=harness('host',{voice:true});h.counter();assert.equal(h.level.audioTextBusy,true,'office voice must block city approval admission');
 h.synth.end();assert.equal(h.level.audioTextBusy,false);
 const silent=harness('host',{voice:false});silent.counter();assert.equal(silent.level.audioTextBusy,false);
});

test('pending city approval gates office speech and office exit cannot cancel its active voice',()=>{
 let pending=true,active=false;
 const h=harness('host',{voice:true,cityAudioBusy:()=>pending});h.config.cityAudioActive=()=>active;
 h.counter();h.tick(80);assert.equal(h.synth.spoken.length,0);assert.equal(h.level.audioTextBusy,false);
 active=true;h.synth.speak({text:'Englische Untertitel sind äußerst wichtig.'});const cancellations=h.synth.cancelCount;
 h.node('amt-leave').click();assert.equal(h.synth.cancelCount,cancellations);assert.equal(h.synth.current.text,'Englische Untertitel sind äußerst wichtig.');
 pending=false;
});

test('office admission starts inside with the QR route immediately available',()=>{
 const initial=harness();assert.equal(initial.level.stage,'walk-sign');assert.equal(initial.level.view.z,4.8);
 const h=harness();h.key('KeyW');h.advanceGame(1.5);h.key('KeyW','keyup');
 assert.equal(h.level.stage,'walk-sign');assert.ok(h.level.view.z<5.55);
});
test('the closed entrance stops sprinting and E cannot enter the retained hallway',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness();h.key('KeyS');h.key('KeyR');
  for(let n=0;n<Math.ceil(2/dt);n++)h.level.update(dt);
  h.key('KeyS','keyup');h.key('KeyR','keyup');
  assert(h.level.view.z<=5.12+1e-9,'door and handle clearance includes the player body');
  assert(h.level.view.z>4.8,'the player can approach the closed door');
  const before=h.level.view;h.level.interact();assert.deepEqual(h.level.view,before);
  assert.notEqual(h.level.stage,'outside','E may address a visible nearby visitor but cannot open the hallway');
  h.level.replay(h.config);assert.equal(h.level.view.z,4.8);assert.equal(h.level.stage,'walk-sign');
 }
});
test('the clerk encounter remains on the public side of the desk',()=>{
 const h=harness();h.counter();assert.ok(h.level.view.z>=-8.32);
});
test('Frau Knick speaks through the current body action instead of pinning a talk row',()=>{
 const h=harness('host',{voice:true});h.counter();const before=h.level.clerkPerformance;
 assert.equal(before.speaking,true);assert.notEqual(before.row,5);
 h.advanceGame(.25);const after=h.level.clerkPerformance;
 assert.equal(after.speaking,true);assert.equal(after.animation.generation,before.animation.generation);
 assert(after.animation.actionId!==before.animation.actionId||after.animation.phase!==before.animation.phase,'speech keeps the authored body phase advancing');
 const pose=after.animation.arc&&after.animation.phase>=.5?after.animation.toPose:after.animation.pose;
 assert.equal(after.row,{ready:0,raised:2,contact:3,refusal:4}[pose]);
 h.synth.end();assert.equal(h.level.clerkPerformance.speaking,false);
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
 h.tick(6000);h.advanceGame(12.5);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');assert.equal(h.level.omen.strength,0);
 assert.equal(h.level.characterMood,null);assert.ok(Math.abs(h.level.view.yaw)<.01);assert.equal(h.document.body.classList.contains('amt-omen'),false);h.advanceGame(4);
 assert.notEqual(h.level.queueDisplay,board);
 assert.notEqual(h.level.characters[0].mode,'gesture');
});
test('a nearby regular owns the visible dialogue mood and releases the queue on return',()=>{
 const h=harness();h.enter();h.moveTo(3.4,1.2);{const actor=h.level.characters.find(a=>a.id==='formularsammler');h.faceToward(actor.x,actor.z)}const actor=h.level.characters.find(a=>a.id==='formularsammler');
 assert.ok(Math.hypot(h.level.view.x-actor.x,h.level.view.z-actor.z)<1.65);
 const board=h.level.queueDisplay;h.level.interact();assert.equal(h.level.stage,'character');
 assert.equal(h.level.characterMood.id,'formularsammler');assert.equal(h.level.characterMood.tone,'dread');
 assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.characters.formularsammler.lines[0].line);
 h.advanceGame(4);assert.equal(h.level.queueDisplay,board);assert.equal(h.node('amt-actions').children.length,0);h.elapse(15);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.characterMood,null);
});

test('city audio gates optional actor speech and a replaced cue never starts later',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy,random:()=>0});
 h.enter();h.moveTo(3.4,1.2);{const actor=h.level.characters.find(a=>a.id==='formularsammler');h.faceToward(actor.x,actor.z)}const before=h.synth.spoken.length;h.level.interact();
 assert.equal(h.level.stage,'character');h.tick(2500);assert.equal(h.synth.spoken.length,before);
 h.level.replay(h.config);cityBusy=false;h.tick(500);assert.equal(h.synth.spoken.length,before);
 h.enter();h.moveTo(3.4,1.2);{const actor=h.level.characters.find(a=>a.id==='formularsammler');h.faceToward(actor.x,actor.z)}h.level.interact();assert.equal(h.level.stage,'character');h.tick(20);
 assert.equal(h.synth.spoken.length,before+1);
});

test('city audio gates waiting-room speech and releases it when the city clears',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy,random:()=>0});
 h.enter();h.advanceGame(9);const before=h.synth.spoken.length;
 assert.equal(before,0);assert.equal(h.node('amt-ambient').textContent,'');
 cityBusy=false;h.level.update(.1);h.tick(20);assert.equal(h.synth.spoken.length,0);
 assert(h.window.BuergeramtStory.ambient.some(row=>h.node('amt-ambient').textContent.endsWith(row.text)));
});

test('city audio defers the optional omen and its tone until the city clears',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:true,cityAudioBusy:()=>cityBusy});
 h.enter();h.advanceGame(9);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');
 cityBusy=false;h.level.update(.1);h.tick(20);h.synth.end();h.advanceGame(9);
 assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'blackout');
});

test('the clerk speech watchdog starts after city audio clears, not while waiting',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.wait();const link=h.links[0];link.message({type:'register',name:'Erika Mustermann'});
 h.approachCounter();h.awaitCall();assert.equal(h.level.stage,'walk-counter');
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
 h.approachCounter();h.awaitCall();cityBusy=true;
 h.synth.speak=utterance=>utterance.onerror?.();h.level.interact();h.tick(3000);
 assert.equal(link.sent.filter(message=>message.type==='call-arm').length,0);
 cityBusy=false;h.tick(40);h.tick(16);
 assert.equal(link.sent.filter(message=>message.type==='call-arm').length,1);
 assert.equal(h.level.clerkPerformance.speaking,false);
});

test('replay and voice-off release deferred city-to-office speech safely',()=>{
 let cityBusy=true;const h=harness('host',{voice:true,cinematics:false,cityAudioBusy:()=>cityBusy});
 h.enter();h.moveTo(3.4,1.2);{const actor=h.level.characters.find(a=>a.id==='formularsammler');h.faceToward(actor.x,actor.z)}h.level.interact();const before=h.synth.spoken.length;
 h.level.replay(h.config);cityBusy=false;h.tick(1000);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.synth.spoken.length,before);
 cityBusy=true;h.enter();h.moveTo(3.4,1.2);{const actor=h.level.characters.find(a=>a.id==='formularsammler');h.faceToward(actor.x,actor.z)}h.level.interact();h.config.voiceOn=()=>false;
 cityBusy=false;h.tick(40);assert.equal(h.synth.spoken.length,before);
 assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.characters.formularsammler.lines[0].line);
});

test('the board calls continuously but scanning only opens name admission',()=>{
 const h=harness();assert.match(h.level.queueDisplay,/^[A-Z]{1,2}-\d{3}$/);h.enter();h.advanceGame(4);const first=h.level.queueDisplay;h.advanceGame(4);assert.notEqual(h.level.queueDisplay,first);
 h.links[0].message({type:'scan',id:'a'.repeat(24)});assert.equal(h.links[0].sent.at(-1).type,'scan-ready');assert.equal(h.level.registrationTicket,'');assert.equal(h.level.assignedCounter.number,0);assert.equal(h.level.activated,false);
 h.links[0].message({type:'register',name:'  Erika   Mustermann '});const ticket=h.links[0].sent.at(-1);assert.equal(ticket.type,'ticket');assert.equal(h.level.registeredName,'Erika Mustermann');h.links.at(-1).message({type:'ticket-received',id:h.links.at(-1).scanId,number:h.level.registrationTicket});assert.equal(h.level.stage,'waiting');
 h.links[0].message({type:'scan',id:'a'.repeat(24)});assert.equal(h.links[0].sent.at(-1).number,ticket.number);
 h.links[0].message({type:'scan',id:'b'.repeat(24)});assert.equal(h.level.registrationTicket,'');assert.equal(h.level.assignedCounter.number,0);
});
test('a new scan after expiry requires a new name submission',()=>{
 const h=harness();h.wait();const first=h.level.registrationTicket;h.awaitCall();const expiryScene=h.level.floorState.visualTime+30.1;for(let i=0;i<1002&&h.level.floorState.visualTime<expiryScene;i++)h.level.update(.05);assert.equal(h.level.stage,'walk-sign');h.links.at(-1).message({type:'scan',id:'b'.repeat(24)});assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.activated,false);h.links.at(-1).message({type:'register',name:'Erika Mustermann'});h.links.at(-1).message({type:'ticket-received',id:h.links.at(-1).scanId,number:h.level.registrationTicket});assert.equal(h.level.stage,'waiting');assert.notEqual(h.level.registrationTicket,first);
});
test('silencing completes the automatic registration and grants A38 exactly once',()=>{
 const h=harness();h.counter();h.links[0].message({type:'phone-hidden'});h.tick(16000);let questions=0;
 while(h.level.stage!=='success'){assert.equal(h.node('amt-actions').children.length,2);h.action();h.tick(30000);if(++questions>60)throw Error('Registration did not end')}
 assert.equal(questions,10);assert.equal(h.level.registration.completed,true);const button=h.action();h.tick(16000);assert.equal(h.counts.form,1);button.click();assert.equal(h.counts.form,1);
});

test('answer automatically cancels without ever issuing A38',()=>{
 const h=harness();h.counter();h.links[0].message({type:'answer',id:'grass'});assert.equal(h.level.stage,'cancelled');assert.equal(h.node('amt-actions').children.length,0);
 h.tick(150000);assert.deepEqual(h.counts,{form:0,cancel:1,close:0});assert.equal(h.level.active,false);
 assert.equal(h.links[0].sent.at(-1).type,'forfeit','a cancelled appointment must stamp the companion');
 assert.equal(h.links[0].sent.filter(m=>m.type==='police-line').length,4);
});
test('early approach reprimands and its dialogue does not extend the appointment',()=>{
 const h=harness();h.wait();h.approachCounter();h.level.interact();assert.equal(h.level.stage,'early');assert.match(h.node('amt-line').textContent,/dienstliche Tätigkeit/);assert.equal(h.node('amt-actions').children.length,0);h.elapse(60);assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.activated,false);assert.equal(h.node('amt-actions').children.length,0);assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.form,0);
});
test('a delayed decline cannot resurrect a forfeited appointment',()=>{
 const h=harness();h.wait();h.links[0].message({type:'phone-hidden'});assert.equal(h.level.stage,'walk-sign');h.links[0].message({type:'decline',id:'grass'});assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.form,0);
});
test('a delayed answer cannot resurrect a forfeited appointment',()=>{
 const h=harness();h.wait();h.links[0].emit('disconnected',{peer:''});h.links[0].message({type:'answer',id:'grass'});assert.equal(h.level.stage,'walk-sign');h.tick(90000);assert.equal(h.counts.form,0);assert.equal(h.counts.cancel,0);
});
test('a failed ticket delivery does not start a queue slot',()=>{
 const h=harness();h.enter();h.links[0].fail=true;h.links[0].message({type:'scan',id:'a'.repeat(24)});assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.activated,false);
});
test('failed police-call delivery cannot trap the player at the counter',()=>{
 const h=harness();h.wait();h.links[0].message({type:'register',name:'Erika Mustermann'});h.approachCounter();h.awaitCall();h.links[0].fail=true;h.level.interact();h.tick(16);assert.equal(h.level.stage,'counter');assert.equal(h.level.registration.phoneSilent,false);h.links[0].fail=false;h.tick(2100);assert(h.links[0].sent.some(m=>m.type==='call'));assert.equal(h.level.registration.warnings,0);
});
test('the name button is required before any ticket or host call',()=>{
 const h=harness();h.register();h.approachCounter();h.advanceGame(16);h.level.interact();assert.equal(h.level.stage,'early');assert.equal(h.level.registrationTicket,'');assert.equal(h.links[0].sent.filter(m=>m.type==='call-arm').length,0);
 const ready=harness();ready.counter();assert.equal(ready.level.stage,'counter');assert.equal(ready.links[0].sent.filter(m=>m.type==='call').length,1);
});
test('the phone keeps the call hidden until its scheduled ring and cancels later vibration on decline',()=>{
 const h=harness('phone'),link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'call-arm',id:'grass'});assert.equal(link.sent.at(-1).type,'call-ready');
 const baseline=h.vibrations.length;link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:1500,ringAtUtcMs:null,leadMs:2200});assert.equal(h.node('phone-call').hidden,true);assert.equal(link.sent.at(-1).type,'call-scheduled');assert.equal(link.sent.at(-1).mode,'peer');h.tick(1499);assert.equal(h.vibrations.length,baseline);h.tick(1);assert.equal(h.node('phone-call').hidden,false);assert.ok(h.vibrations.length>baseline);h.node('phone-decline').click();const count=h.vibrations.length;h.tick(6000);assert.equal(h.vibrations.length,count);assert.equal(h.vibrations.at(-1),0);
});
test('a qualified UTC anchor schedules the phone when the direct peer offset is unavailable',async()=>{
 const anchor={utcOffsetMs:100000,sampledAtMs:0,uncertaintyMs:20};
 const phoneClock={sample:async()=>anchor,usable:a=>!!a,utcAt:(a,mono)=>a.utcOffsetMs+mono,monoAt:(a,utc)=>utc-a.utcOffsetMs};
 const h=harness('phone',{phoneClock});await Promise.resolve();const link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'call-arm',id:'grass'});
 link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:null,ringAtUtcMs:101000,leadMs:2200});assert.equal(link.sent.at(-1).mode,'utc');assert.equal(link.sent.at(-1).atMs,1000);h.tick(999);assert.equal(h.node('phone-call').hidden,true);h.tick(1);assert.equal(h.node('phone-call').hidden,false);
});
test('replay ignores old link messages and status events',()=>{
 const h=harness();const old=h.links[0];h.level.replay(h.config);old.message({type:'register',name:'OLD ATTEMPT'});old.emit('status','old status');assert.equal(h.level.registeredName,'');assert.notEqual(h.node('amt-status').textContent,'old status');
});
test('replay cancels the previous argument timers',()=>{
 const h=harness();h.counter();h.links[0].message({type:'answer',id:'grass'});h.tick(4000);h.level.replay(h.config);h.counter();h.links[1].message({type:'answer',id:'grass'});
 h.tick(27501);assert.equal(h.counts.cancel,0);assert.equal(h.level.stage,'cancelled');h.tick(150000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
test('key release during a sequence does not leave movement stuck',()=>{
 const h=harness();h.wait();h.approachCounter();h.key('KeyW');h.level.interact();assert.equal(h.level.stage,'early');h.key('KeyW','keyup');h.elapse(14);const before=h.level.view;h.level.update(.1);assert.deepEqual(h.level.view,before);
});
test('a stale automatic continuation cannot skip clerk stages after replay',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'decline',id:'grass'});h.tick(16);const old=h.synth.current;h.synth.end();h.level.replay(h.config);h.counter();const line=h.node('amt-line').textContent;
 old.onend?.();h.advanceGame(.5);assert.equal(h.node('amt-line').textContent,line);assert.equal(h.level.stage,'counter');assert.equal(h.node('amt-actions').children.length,2);assert(h.node('amt-actions').children.every(b=>b.disabled));assert.equal(h.counts.form,0);
});
test('identical speech from a previous attempt cannot start after replay',()=>{
 const h=harness('host',{voice:true});h.wait();h.approachCounter();h.level.interact();h.level.replay(h.config);h.wait();h.approachCounter();h.level.interact();h.tick(20);assert.equal(h.synth.spoken.length,1);assert.equal(h.synth.spoken[0].text,h.node('amt-line').textContent);
});
test('walking resumes only after the in-scene speech completes',()=>{
 const h=harness('host',{voice:true});h.wait();h.approachCounter();h.level.interact();h.tick(20);assert.equal(h.synth.speaking,true);assert.equal(h.node('amt-actions').children.length,0);h.synth.end();h.advanceGame(.3);assert.equal(h.level.stage,'waiting');assert.equal(h.synth.speaking,false);assert.equal(h.node('amt-ambient').textContent,'');
});
test('starting a clerk cue does not cancel an already idle speech engine',()=>{
 const h=harness('host',{voice:true});h.counter();h.tick(20);h.synth.end();const before=h.synth.cancelCount;h.links[0].message({type:'answer',id:'grass'});assert.equal(h.synth.cancelCount,before);
});
test('the host remains playable without a browser speech implementation',()=>{
 const h=harness('host',{synthesis:false});h.enter();assert.equal(h.level.stage,'walk-sign');h.level.replay(h.config);assert.equal(h.level.stage,'walk-sign');
});
test('both speakers cut off each other throughout the escalating argument',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});
 completeOpening(h);
 for(let index=0;index<3;index++){
  link.message({type:'police-start',index,mode:'voice',readyDelayMs:20,atMs:h.now()});
  const start=h.now();assert.equal(h.level.timing.desk[index].endAt,null,'the clerk keeps speaking over the officer');
  h.tick(999);assert.equal(h.level.timing.desk[index].endAt,null);h.tick(1);
  assert.equal(h.level.timing.desk[index].mode,'interrupted');assert.equal(h.level.timing.desk[index].endAt,start+1000);
  const target=Math.round(h.window.BuergeramtStory.outburst.phoneCutAfterMs[index+1]/h.level.timeScale);h.tick(target-1000+40);
  assert.equal(h.level.timing.cues[index].interrupted,true);assert.ok(link.sent.some(m=>m.type==='police-cutoff'&&m.index===index));
  assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.outburst.lines[index+1]);
  const cut=link.sent.find(m=>m.type==='police-cutoff'&&m.index===index);
  assert.equal(cut.stopAtPhoneMs-h.level.timing.desk[index+1].startAt,984,'desk audio starts one second before the cutoff, allowing its 16 ms startup');
  link.message({type:'police-done',index,mode:'voice',durationMs:target,atMs:h.now()});
  if(index<2){h.tick(h.window.BuergeramtStory.outburst.cutAfterMs[index+1]/h.level.timeScale+20);assert.equal(link.sent.filter(m=>m.type==='police-line').at(-1).index,index+1)}
 }
 h.synth.end();h.tick(200);assert.equal(link.sent.filter(m=>m.type==='police-line').at(-1).index,3);link.message({type:'police-done',index:3,mode:'voice',durationMs:10,atMs:h.now()});assert.equal(h.level.timing.cues[3].doneAt,null,'done without start cannot end the report demand');link.message({type:'police-start',index:3,mode:'voice',readyDelayMs:20,atMs:h.now()});h.tick(14000);assert(!link.sent.some(m=>m.type==='police-cutoff'&&m.index===3));assert.equal(h.counts.cancel,0);link.message({type:'police-done',index:3,mode:'voice',durationMs:14000,atMs:h.now()});
 assert.equal(link.sent.at(-1).type,'call-end');assert.notEqual(h.node('amt-line').textContent,h.window.BuergeramtStory.phoneDismissal.line);
 link.message({type:'call-ended',id:'grass',round:h.level.registration.callRound,mode:'sound'});h.tick(20);
 assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.phoneDismissal.line);h.synth.end();h.tick(250);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
test('a late mapped phone onset keeps clerk overlap within one wall-clock second',async()=>{
 const service={sample:async()=>({utcOffsetMs:100000}),usable:a=>!!a,utcAt:(a,t)=>a.utcOffsetMs+t,monoAt:(a,t)=>t-a.utcOffsetMs};
 const h=harness('host',{voice:true,phoneClock:service}),link=h.links[0];await Promise.resolve();h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);
 const start=h.now();h.tick(600);link.message({type:'police-start',index:0,mode:'recording',readyDelayMs:20,atMs:5000,atUtcMs:100000+start});
 const caption=h.node('english-subtitle').textContent;assert.equal(caption,h.window.BuergeramtStory.police[0]);
 h.tick(399);assert.equal(h.level.timing.desk[0].endAt,null);h.tick(1);assert.equal(h.level.timing.desk[0].endAt,start+1000);
 assert.equal(h.node('english-subtitle').textContent,caption,'stopping the outgoing clerk preserves the current police caption');
});

test('closing during overlap cancels the old clerk stop before a new visit',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);
 link.message({type:'police-start',index:0,mode:'voice',readyDelayMs:20,atMs:h.now()});h.tick(400);h.level.replay(h.config);
 const before=h.synth.cancelCount;h.tick(2000);assert.equal(h.synth.cancelCount,before);assert.equal(h.level.stage,'walk-sign');assert.equal(Object.keys(h.level.timing.desk).length,0);
});

test('a naturally short officer turn clears the pending stop before the next clerk',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);
 link.message({type:'police-start',index:0,mode:'voice',readyDelayMs:20,atMs:h.now()});h.tick(200);link.message({type:'police-done',index:0,mode:'voice',durationMs:200,atMs:h.now()});
 h.tick(20);const current=h.synth.current;h.tick(1000);assert.equal(h.synth.current,current);assert.equal(h.level.timing.desk[1].endAt,null);
});

test('the host measures round trip delay on its own clock and ignores stale pongs',()=>{
 const h=harness(),link=h.links[0];link.emit('connected',{});assert.deepEqual(link.sent.filter(m=>m.type==='sync-ping').at(-1),{type:'sync-ping',id:1});h.tick(120);link.message({type:'sync-pong',id:1,receivedAtMs:50,sentAtMs:70});assert.equal(h.level.timing.rttMs,100);assert.equal(h.level.timing.oneWayMs,50);assert.equal(h.level.timing.clockOffsetMs,0);assert.equal(h.level.timing.clockUncertaintyMs,50);
 h.tick(1380);assert.equal(link.sent.at(-1).id,2);h.tick(260);link.message({type:'sync-pong',id:2,receivedAtMs:1600,sentAtMs:1610});assert.equal(h.level.timing.rttMs,250);assert.equal(h.level.timing.oneWayMs,125);assert.equal(h.level.timing.jitterMs,150);assert.equal(h.level.timing.clockUncertaintyMs,125);
 link.message({type:'sync-pong',id:1,receivedAtMs:50,sentAtMs:70});assert.equal(h.level.timing.jitterMs,150);h.level.replay(h.config);assert.equal(h.level.timing.rttMs,null);assert.equal(h.links[1].sent.filter(m=>m.type==='sync-ping').length,0);
});
test('police receipts verify duration and do not advance a turn twice',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];link.emit('connected',{});h.tick(20);link.message({type:'sync-pong',id:1,receivedAtMs:10,sentAtMs:10});h.counter();link.message({type:'answer',id:'grass'});h.tick(20);link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:20,atMs:h.now()});h.tick(320);link.message({type:'police-done',index:-1,mode:'voice',durationMs:320,atMs:h.now()});assert.equal(h.level.timing.cues[-1].status,'verified');const doneAt=h.level.timing.cues[-1].doneAt;
 link.message({type:'police-done',index:-1,mode:'voice',durationMs:9000,atMs:h.now()});assert.equal(h.level.timing.cues[-1].doneAt,doneAt);h.tick(20);h.synth.end();h.tick(700);assert.equal(link.sent.filter(m=>m.type==='police-line').length,1);
 link.message({type:'police-start',index:0,mode:'voice',readyDelayMs:50,atMs:h.now()});h.tick(800);link.message({type:'police-done',index:0,mode:'voice',durationMs:100,atMs:h.now()});assert.equal(h.level.timing.cues[0].status,'drift');
});
test('clock-offset mapping keeps phone speech time stable when a receipt arrives late',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];link.emit('connected',{});h.tick(100);link.message({type:'sync-pong',id:1,receivedAtMs:5045,sentAtMs:5055});assert.equal(h.level.timing.clockOffsetMs,5000);h.counter();link.message({type:'answer',id:'grass'});h.tick(20);link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:20,atMs:5120});h.tick(900);link.message({type:'police-done',index:-1,mode:'voice',durationMs:300,atMs:5420});const cue=h.level.timing.cues[-1];assert.equal(cue.status,'verified');assert.equal(cue.estimatedStartAt,120);assert.equal(cue.estimatedEndAt,420);assert.equal(cue.receiptJitter,true);
});
test('a late phone receipt cannot replace a timed-out turn',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});h.tick(18000);assert.equal(h.level.timing.cues[-1].status,'timeout');link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:0,atMs:h.now()});link.message({type:'police-done',index:-1,mode:'voice',durationMs:100,atMs:h.now()});assert.equal(h.level.timing.cues[-1].status,'timeout');assert.ok(Number.isFinite(h.level.timing.cues[-1].lateDoneAt));h.tick(4000);assert.equal(link.sent.filter(m=>m.type==='police-line').length,1);
});
test('the personalized opening finishes naturally before the clerk interrupts',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});h.tick(17000);
 assert.equal(h.level.timing.cues[-1].status,'waiting');link.message({type:'police-start',index:-1,mode:'voice',readyDelayMs:4000,atMs:h.now()});h.tick(9000);
 assert.equal(h.level.timing.desk[0],undefined);assert(!link.sent.some(m=>m.type==='police-cutoff'&&m.index===-1));
 link.message({type:'police-done',index:-1,mode:'voice',durationMs:9000,atMs:h.now()});h.tick(20);
 assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.outburst.lines[0]);
});

test('a disconnected phone releases the argument without waiting through four timeouts',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});link.emit('status','Telefon getrennt');h.tick(5999);assert.notEqual(h.node('amt-line').textContent,h.window.BuergeramtStory.phoneDismissal.line);h.tick(1);assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.phoneDismissal.line);h.tick(10000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});
test('a stale interrupted phone completion cannot skip the next clerk line',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);link.message({type:'police-start',index:0,mode:'voice',readyDelayMs:500,atMs:h.now()});h.tick(4600);const text=h.node('amt-line').textContent;assert.match(text,/Die Dame hat einen Namen/);link.message({type:'police-done',index:-1,mode:'voice',durationMs:500,atMs:h.now()});link.message({type:'police-done',index:0,mode:'voice',durationMs:500,atMs:h.now()});assert.equal(h.node('amt-line').textContent,text);assert.equal(link.sent.filter(m=>m.type==='police-line').length,1);
});
test('one backup opening receipt starts on observed playback and the companion still answers pings',()=>{
 const h=recordedPhone(),link=personalizedIncoming(h);link.message({type:'sync-ping',id:19});assert.deepEqual(link.sent.at(-1),{type:'sync-pong',id:19,receivedAtMs:0,sentAtMs:0});
 h.node('phone-answer').click();assert.equal(h.synth.spoken.length,0);assert.equal(h.played.length,1);assert.equal(link.sent.filter(m=>m.type==='police-start').length,0);
 h.tick(16);assert.equal(link.sent.at(-1).type,'police-start');assert.equal(link.sent.at(-1).index,-1);assert.equal(link.sent.at(-1).atMs,16);
 h.tick(240);assert.equal(link.sent.filter(m=>m.type==='police-done').length,0);h.played[0].end();
 const done=link.sent.at(-1);assert.equal(done.type,'police-done');assert.equal(done.index,-1);assert.equal(done.mode,'recording');assert.equal(done.durationMs,240);assert.equal(done.atMs,h.now());
});
test('phone recording uses the Kriminalpolizei voice and paired timing receipts',()=>{
 const h=harness('phone',{candidatePhone:true});h.incoming();const link=h.links[0];h.node('phone-answer').click();h.tick(20);
 assert.equal(h.audio.recordings.length,1);assert.match(h.audio.recordings[0].src,/kriminalpolizei-phone-01\.mp3$/);
 assert.equal(h.synth.spoken.length,0);assert.equal(link.sent.at(-1).type,'police-start');assert.equal(link.sent.at(-1).mode,'recording');assert.equal(h.node('phone-call-line').hidden,true);
 h.tick(400);h.audio.recordings[0].end();const done=link.sent.at(-1);assert.equal(done.type,'police-done');assert.equal(done.mode,'recording');assert.equal(done.index,-1);assert.equal(done.durationMs,404);
});
test('a failed fixed phone recording uses timed fallback without browser speech',()=>{
 const h=harness('phone',{candidatePhone:true});h.incoming();h.node('phone-answer').click();h.audio.recordings[0].fail();h.tick(20);
 assert.equal(h.audio.recordings[0].paused,true);assert.equal(h.synth.spoken.length,0);assert.equal(h.links[0].sent.at(-1).mode,'fallback');h.tick(20000);assert.equal(h.links[0].sent.filter(m=>m.type==='police-done').length,1);
});
test('an absent media API uses immediate bounded fallback without browser speech or a phone transcript',()=>{
 const h=harness('phone',{speechAutoStart:false}),link=personalizedIncoming(h);h.node('phone-answer').click();
 const start=link.sent.at(-1);assert.equal(start.type,'police-start');assert.equal(start.mode,'fallback');assert.equal(start.atMs,0);assert.equal(h.node('phone-call-line').hidden,true);
 assert.equal(h.synth.current,null);assert.equal(h.synth.spoken.length,0);h.tick(20000);assert.equal(link.sent.filter(m=>m.type==='police-done').length,1);
});
test('later fixed police lines use immediate timed fallback when their recordings are unavailable',()=>{
 const h=harness('phone');h.incoming();const link=h.links[0];h.node('phone-answer').click();h.tick(20000);link.message({type:'police-line',index:0,line:'Können Sie mich hören?'});
 assert.equal(link.sent.at(-1).type,'police-start');assert.equal(link.sent.at(-1).index,0);assert.equal(link.sent.at(-1).mode,'fallback');assert.equal(h.synth.spoken.length,0);
});
test('a prepared greeting failure before onset plays the full recorded backup with one receipt pair',()=>{
 const h=recordedPhone({named:true}),link=personalizedIncoming(h);h.node('phone-answer').click();h.played[0].fail();h.tick(20);
 assert.equal(h.played.length,2);assert.equal(h.played[1].src,'./assets/voices/kriminalpolizei/kriminalpolizei-phone-01.mp3');
 assert.equal(h.synth.spoken.length,0);assert.equal(link.sent.filter(m=>m.type==='police-start').length,1);
 assert.equal(link.sent.find(m=>m.type==='police-start').mode,'recording');h.played[1].end();assert.equal(link.sent.filter(m=>m.type==='police-done').length,1);
});
test('phone scan opens the form and only its submission reveals the ticket',()=>{
 const h=harness('phone'),link=h.phoneReady();assert.equal(link.sent[0].type,'scan');assert.equal(h.node('phone-ticket').hidden,true);assert.equal(h.node('phone-form').hidden,false);
 link.message({type:'ticket',number:'ZA-731',counter:1});assert.equal(h.node('phone-ticket').hidden,true);
 h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(link.sent.at(-1).type,'register');link.message({type:'ticket',number:'ZA-731',counter:1});assert.equal(h.node('phone-number').textContent,'ZA-731');assert.equal(link.sent.at(-1).type,'ticket-received');assert.equal(link.sent.at(-1).number,'ZA-731');assert.equal(h.node('phone-ticket').hidden,false);
});
test('phone retries name submission until its allocated ticket arrives',()=>{
 const h=harness('phone'),link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));h.tick(3001);const submitted=link.sent.filter(m=>m.type==='register');assert.equal(submitted.length,3);assert.ok(submitted.every(m=>m.id===link.sent[0].id));link.message({type:'ticket',number:'B-223',counter:3});h.tick(3001);assert.equal(link.sent.filter(m=>m.type==='register').length,3);
});

test('the phone displays its code before confirming it and retries a failed receipt',()=>{
 const h=harness('phone'),link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 const original=link.send.bind(link);let displayed=false;link.send=(type,payload)=>{if(type==='ticket-received')displayed=h.node('phone-number').textContent===payload.number&&!h.node('phone-ticket').hidden;return original(type,payload)};
 link.fail=true;link.message({type:'ticket',number:'B-223',counter:3});assert.equal(displayed,true);assert.equal(h.node('phone-ticket').hidden,false);assert.equal(link.sent.filter(m=>m.type==='ticket-received').length,0);
 link.fail=false;h.tick(1500);assert.equal(link.sent.filter(m=>m.type==='ticket-received').length,1);assert.equal(link.sent.at(-1).id,link.sent.find(m=>m.type==='register').id);h.tick(5000);assert.equal(link.sent.filter(m=>m.type==='ticket-received').length,1);
});

test('an immediate ticket response cannot be lost or leave the phone allocation pending',()=>{
 const h=harness('phone'),link=h.phoneReady(),original=link.send.bind(link);
 link.send=(type,payload)=>{const sent=original(type,payload);if(type==='register'&&sent)link.message({type:'ticket',number:'ZA-731',counter:1});return sent};
 h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 assert.equal(h.node('phone-number').textContent,'ZA-731');assert.equal(h.node('phone-ticket').hidden,false);assert.equal(h.node('phone-admission-status').hidden,true);assert.equal(link.sent.at(-1).type,'ticket-received');
});
test('name submission silently unlocks audio before ticket delivery',()=>{
 const h=harness('phone');let resumes=0;h.window.AudioContext=class{createGain(){return{gain:{value:0},connect(){}}}resume(){resumes++;return Promise.resolve()}};h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(resumes,1);assert.ok(h.vibrations.every(pattern=>pattern===0));assert.equal(h.fullscreenRequests.length,1);h.links[0].message({type:'ticket',number:'B-224',counter:3});assert.equal(h.node('phone-number').textContent,'B-224');assert.equal(h.node('phone-ticket').hidden,false);
});
test('incoming call repeats vibration and stops it after decline',()=>{
 const h=harness('phone');h.incoming();const first=h.vibrations.length;assert.ok(first>=1);h.tick(3000);assert.ok(h.vibrations.length>first);h.node('phone-decline').click();assert.equal(h.vibrations.at(-1),0);
});
test('the prepared name greeting keeps normal media volume and does not enter browser speech',()=>{
 const h=recordedPhone({named:true});
 personalizedIncoming(h);h.node('phone-answer').click();
 assert.equal(h.played[0].src,'blob:prepared-kripo');assert.equal(h.played[0].volume,1);assert.equal(h.synth.spoken.length,0);
});
test('phone answer/decline are one-shot and sent with the current call id',()=>{
 for(const decision of ['answer','decline']){const h=harness('phone');h.incoming();h.node('phone-'+decision).click();h.node('phone-'+decision).click();const decisions=h.links[0].sent.filter(m=>m.type===decision);assert.equal(decisions.length,1);assert.equal(decisions[0].id,'grass')}
});
test('the caller stays Unbekannte Nummer while subtitles and browser language select call controls',()=>{
 for(const [options,english] of [[{phoneLanguage:'de-DE'},false],[{phoneLanguage:'en-GB'},true],[{phoneLanguage:'de-DE',phoneCaptions:true},true],[{phoneLanguage:'fr-FR'},false]]){
  const h=harness('phone',options);h.incoming();assert.equal(h.node('phone-caller').textContent,'Unbekannte Nummer');assert.equal(h.node('phone-call').lang,english?'en':'de');assert.equal(h.node('phone-call-state').textContent,english?'INCOMING CALL':'EINGEHENDER ANRUF');h.node('phone-answer').click();assert.equal(h.node('phone-call-state').textContent,'00:00');
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
 const h=harness('phone');h.incoming();h.links[0].fail=true;h.node('phone-answer').click();assert.equal(h.node('phone-call').hidden,true);assert.equal(h.node('phone-expired').hidden,true);assert.equal(h.links[0].closed,true);
});
test('forfeiture removes the incoming/active call and cancels pending speech',()=>{
 for(const answered of [false,true]){const h=harness('phone');h.incoming();if(answered)h.node('phone-answer').click();h.links[0].message({type:'forfeit'});h.tick(20);assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.spoken.length,0);assert.match(h.node('phone-status').textContent,/verfallen/)}
});
test('a late call cannot revive a forfeited phone slot',()=>{
 const h=harness('phone');h.phoneReady();h.links[0].message({type:'forfeit'});h.links[0].message({type:'call',id:'grass',line:'Später Anruf'});assert.equal(h.node('phone-call').hidden,true);assert.match(h.node('phone-status').textContent,/verfallen/);
});
test('disconnect clears the recorded phone call and rejects its late completion',()=>{
 const h=recordedPhone();personalizedIncoming(h);h.node('phone-answer').click();h.tick(20);const clip=h.played[0],late=clip.onended;
 assert.equal(clip.paused,false);h.links[0].emit('status','Telefon getrennt');assert.equal(h.node('phone-call').hidden,true);assert.equal(clip.paused,true);
 late();h.tick(20000);assert.equal(h.links[0].sent.filter(message=>message.type==='police-done').length,0);assert.equal(h.synth.spoken.length,0);
});
test('backgrounding an admitted phone stops audio without premature expiry',()=>{
 const h=harness('phone');h.incoming();h.node('phone-answer').click();h.tick(20);h.hide();assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.speaking,false);assert.equal(h.links[0].closed,false);assert.equal(h.node('phone-expired').hidden,true);assert.equal(h.links[0].sent.at(-1).type,'phone-hidden');
});
test('ticket delivered to an already hidden phone is forfeited',()=>{
 const h=harness('phone'),link=h.phoneReady();h.node('phone-name').value='Erika';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));h.hide();link.message({type:'ticket',number:'B-223',counter:3});assert.equal(link.sent.at(-1).type,'phone-hidden');assert.match(h.node('phone-status').textContent,/verfallen/);
});
test('police lines queue without revealing transcripts on the phone',()=>{
 const h=harness('phone',{candidatePhone:true});h.incoming();h.node('phone-answer').click();h.tick(20);h.links[0].message({type:'police-line',index:0,line:'Die nächste polizeiliche Zeile.'});h.tick(20);assert.equal(h.audio.recordings.length,1);
 h.audio.recordings[0].end();assert.equal(h.links[0].sent.at(-1).index,-1);h.tick(20);assert.equal(h.audio.recordings.length,2);assert.equal(h.node('phone-call-line').hidden,true);assert.equal(h.synth.spoken.length,0);h.audio.recordings[1].end();assert.equal(h.links[0].sent.at(-1).index,0);
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
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'answer',id:'grass'});h.links[0].message({type:'police-done',index:-1,mode:'voice',durationMs:0,atMs:h.now()});h.tick(20);const first=h.node('amt-line').textContent;h.synth.current.onerror();h.tick(2000);assert.equal(h.node('amt-line').textContent,first);assert.equal(h.counts.cancel,0);
});
test('a stalled clerk voice starts a readable fallback within the learned startup limit and rejects late speech',()=>{
 const h=harness('host',{voice:true});let late;h.synth.speak=utterance=>{late=utterance};h.counter();h.links[0].message({type:'answer',id:'grass'});h.links[0].message({type:'police-done',index:-1,mode:'voice',durationMs:0,atMs:h.now()});h.tick(1199);assert.equal(h.level.timing.desk[0].startAt,null);h.tick(1);assert.equal(h.level.timing.desk[0].startMode,'fallback');assert.equal(h.level.timing.desk[0].startAt,h.now());late.onstart();late.onend();assert.equal(h.level.timing.desk[0].endAt,null);h.tick(100);assert.equal(h.counts.cancel,0);
});
test('a failed police voice retains desktop fallback receipts without displaying phone text',()=>{
 const h=harness('phone',{candidatePhone:true});h.incoming();h.node('phone-answer').click();h.audio.recordings[0].fail();assert.equal(h.links[0].sent.at(-1).mode,'fallback');assert.equal(h.node('phone-call-line').hidden,true);assert.equal(h.node('phone-call-line').textContent,'');assert.equal(h.synth.spoken.length,0);
});

test('a synchronous speech failure retains the automatic clerk line for reading',()=>{
 const h=harness('host',{voice:true});h.synth.speak=()=>{throw new Error('Speech service unavailable')};h.counter();h.links[0].message({type:'answer',id:'grass'});const first=h.node('amt-line').textContent;h.tick(2000);assert.equal(h.node('amt-line').textContent,first);assert.equal(h.counts.cancel,0);h.tick(150000);assert.equal(h.counts.cancel,1);assert.equal(h.counts.form,0);
});

test('a cutoff stops only the active phone line and emits one completion receipt',()=>{
 const h=harness('phone',{candidatePhone:true});h.incoming();h.node('phone-answer').click();h.tick(500);const link=h.links[0],clip=h.audio.recordings[0],lateEnd=clip.onended;
 link.message({type:'police-cutoff',index:0});assert.equal(clip.paused,false,'wrong index must not stop the opening');
 link.message({type:'police-cutoff',index:-1});assert.equal(clip.paused,true);assert.equal(link.sent.filter(m=>m.type==='police-done').length,1);assert.equal(link.sent.at(-1).mode,'recording');
 link.message({type:'police-cutoff',index:-1});lateEnd();assert.equal(link.sent.filter(m=>m.type==='police-done').length,1);
 link.message({type:'police-line',index:0,line:h.window.BuergeramtStory.police[0]});h.tick(20);assert.equal(h.audio.recordings.length,2);assert.equal(link.sent.at(-1).type,'police-start');
});

test('a scheduled cutoff stops at the phone deadline despite late delivery',()=>{
 const h=harness('phone',{candidatePhone:true});h.incoming();h.node('phone-answer').click();h.tick(500);const link=h.links[0],clip=h.audio.recordings[0];
 link.message({type:'police-cutoff',index:-1,stopAtPhoneMs:7216,stopAtUtcMs:null});h.tick(6715);assert.equal(clip.paused,false);h.tick(1);assert.equal(clip.paused,true);
 const done=link.sent.filter(m=>m.type==='police-done');assert.equal(done.length,1);assert.equal(done[0].durationMs,7200);assert.equal(done[0].atMs,7216);
});

test('TimeAPI UTC maps a phone cutoff when a peer deadline is unavailable',async()=>{
 const service={sample:async()=>({utcOffsetMs:100000}),usable:a=>!!a,utcAt:(a,t)=>a.utcOffsetMs+t,monoAt:(a,t)=>t-a.utcOffsetMs};
 const h=harness('phone',{candidatePhone:true,phoneClock:service});await Promise.resolve();h.incoming();h.node('phone-answer').click();h.tick(20);const link=h.links[0];assert.equal(link.sent.at(-1).atUtcMs,100016);
 link.message({type:'police-cutoff',index:-1,stopAtPhoneMs:null,stopAtUtcMs:107216});h.tick(7195);assert.equal(h.audio.recordings[0].paused,false);h.tick(1);assert.equal(h.audio.recordings[0].paused,true);
});

test('the host maps a TimeAPI speech timestamp rather than adding delivery delay',async()=>{
 const service={sample:async()=>({utcOffsetMs:100000}),usable:a=>!!a,utcAt:(a,t)=>a.utcOffsetMs+t,monoAt:(a,t)=>t-a.utcOffsetMs};
 const h=harness('host',{phoneClock:service}),link=h.links[0];await Promise.resolve();h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);const start=h.now();h.tick(600);
 link.message({type:'police-start',index:0,mode:'recording',readyDelayMs:20,atMs:5000,atUtcMs:100000+start});
 const budget=Math.round(4500/h.level.timeScale),cut=link.sent.find(m=>m.type==='police-cutoff');assert.equal(cut.stopAtPhoneMs,5000+budget);assert.equal(cut.stopAtUtcMs,100000+start+budget);assert.equal(h.level.timing.cues[0].clockDomain,'utc');
 h.tick(budget-1601);assert.equal(h.level.timing.desk[1],undefined);h.tick(1);assert.equal(h.level.timing.desk[1].startAt,start+budget-1000);
});

test('cutoff send failure retries and waits for natural completion without false interruption',()=>{
 const h=harness('host',{voice:true}),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);link.fail=true;
 link.message({type:'police-start',index:0,mode:'recording',readyDelayMs:20,atMs:h.now()});h.tick(8000);
 assert.notEqual(h.level.timing.cues[0].interrupted,true);assert.equal(h.level.timing.cues[0].cutoffSendFailed,true);assert.equal(h.level.timing.desk[1],undefined);
 link.fail=false;link.message({type:'police-done',index:0,mode:'recording',durationMs:8000,atMs:h.now()});h.tick(20);assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.outburst.lines[1]);
});

test('a transient cutoff send failure recovers before the shared deadline',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});completeOpening(h);link.fail=true;
 link.message({type:'police-start',index:0,mode:'recording',readyDelayMs:20,atMs:h.now()});h.tick(50);link.fail=false;h.tick(50);
 assert.equal(link.sent.filter(m=>m.type==='police-cutoff').length,1);assert.equal(h.level.timing.cues[0].interrupted,true);h.tick(link.sent.find(m=>m.type==='police-cutoff').stopAtPhoneMs-h.now()-1000);assert.equal(h.level.timing.desk[1].startAt,h.now());
});

test('active spoof calls show elapsed time and native hang-up, never police text',()=>{
 const h=harness('phone',{candidatePhone:true,fakeAudio:true});h.incoming();assert.equal(h.node('phone-active-controls').hidden,true);
 h.node('phone-answer').click();h.tick(20);assert.equal(h.node('phone-call-state').textContent,'00:00');assert.equal(h.node('phone-active-controls').hidden,false);assert.equal(h.node('phone-choices').hidden,true);
 h.tick(61000);assert.equal(h.node('phone-call-state').textContent,'01:01');const caption=h.node('phone-call-state').textContent,clip=h.audio.recordings[0];
 h.node('phone-hangup').click();assert.equal(h.links[0].sent.at(-1).type,'hangup');assert.equal(h.node('phone-call').hidden,false);assert.equal(h.node('phone-call-state').textContent,'Anruf beendet');assert.equal(h.node('phone-active-controls').hidden,true);assert.equal(clip.paused,true);assert(h.audio.nodes.filter(n=>n.kind==='buffer-source').every(n=>n.stopped.length));
 const sent=h.links[0].sent.length;h.node('phone-hangup').click();h.links[0].message({type:'police-line',index:0,line:'This must never appear or start.'});h.tick(2000);assert.equal(h.links[0].sent.length,sent);assert.equal(h.audio.recordings.length,1);assert.notEqual(h.node('phone-call-state').textContent,caption);
});
test('hanging up releases an answered police wait once and keeps the cancelled appointment outcome',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'answer',id:'grass'});assert.equal(h.level.stage,'cancelled');
 h.links[0].message({type:'hangup',id:'wrong'});assert.equal(h.level.timing.cues[-1].status,'waiting');
 h.links[0].message({type:'hangup',id:'grass'});const text=h.node('amt-line').textContent;assert.notEqual(text,h.window.BuergeramtStory.phoneDismissal.line);
 h.links[0].message({type:'hangup',id:'grass'});assert.equal(h.node('amt-line').textContent,text);h.links[0].message({type:'call-ended',id:'grass',round:h.level.registration.callRound,mode:'sound'});assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.phoneDismissal.line);
 for(let i=0;i<10&&h.level.active;i++){h.tick(500);h.synth.end();h.tick(16000)}
 assert.equal(h.counts.form,0);assert.equal(h.counts.cancel,1);
});
test('pre-ring interference has one louder pulsed tone and crackle, honors mute and cleans up on replay',()=>{
 const h=harness('host',{fakeAudio:true});h.counter();h.links[0].message({type:'call-ready',id:'grass',atMs:h.now()});
 const tone=h.audio.nodes.find(n=>n.kind==='oscillator'&&n.amtFrequency===217),noise=h.audio.nodes.find(n=>n.kind==='buffer-source'&&n.loop);
 assert(tone&&noise);assert.equal(noise.buffer.length,15360);assert.equal(tone.started[0],noise.started[0]);assert.equal(tone.stopped[0],noise.stopped[0]);assert(Math.abs(tone.stopped[0]-tone.started[0]-(h.level.timing.call.ringAtMs-h.level.timing.call.signalAtMs)/1000)<1e-8);
 const envelope=tone.connections[0].connections[0],peaks=envelope.gain.events.filter(([kind,v])=>kind==='linear'&&v===.16);
 assert.equal(peaks.length,6);assert.equal(noise.connections[0].type,'bandpass');assert.equal(noise.connections[0].frequency.value,2400);
 h.level.replay(h.config);h.audio.flushEnded();assert(tone.disconnected&&noise.disconnected&&envelope.disconnected);
 const muted=harness('host',{fakeAudio:true,officeFx:0});muted.counter();muted.links[0].message({type:'call-ready',id:'grass',atMs:muted.now()});assert.equal(muted.audio.nodes.some(n=>n.kind==='oscillator'&&n.frequency.value===217),false);
});

test('failed hang-up reporting still stops local call media and closes the channel',()=>{
 const h=harness('phone',{candidatePhone:true,fakeAudio:true});h.incoming();h.node('phone-answer').click();h.tick(20);const clip=h.audio.recordings[0];h.links[0].fail=true;
 h.node('phone-hangup').click();assert.equal(h.links[0].closed,true);assert.equal(h.node('phone-call').hidden,true);assert.equal(h.node('phone-active-controls').hidden,true);assert.equal(clip.paused,true);assert.equal(h.node('phone-expired').hidden,true);
 h.links[0].message({type:'police-line',index:0,line:'A stale line.'});h.tick(4000);assert.equal(h.audio.recordings.length,1);assert(h.audio.nodes.filter(n=>n.kind==='buffer-source').every(n=>n.stopped.length));
});
