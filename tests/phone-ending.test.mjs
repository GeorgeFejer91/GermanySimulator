import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

function phoneCall(options={}){
 const h=harness('phone',{candidatePhone:true,fakeAudio:true,...options}),link=h.phoneReady(),story=h.window.BuergeramtStory;
 h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'counter-start'});link.message({type:'call-arm',id:'grass',round:1});
 link.message({type:'call',id:'grass',round:1,line:story.call.body,greeting:story.call.greeting('Erika Mustermann'),ringAtPhoneMs:h.now(),ringAtUtcMs:null,leadMs:2200});
 h.node('phone-answer').click();return h;
}
const receipts=(h,type)=>h.links[0].sent.filter(m=>m.type===type);
const endRequest={type:'call-end',id:'grass',round:1};
const endingTone=h=>h.audio.nodes.find(n=>n.kind==='oscillator'&&n.frequency.value===425);
const staticNoise=h=>h.audio.nodes.find(n=>n.kind==='buffer-source'&&n.loop);

// Two production controllers with separate fake clocks/DOM/media and an ordered
// in-memory message queue. Counter admission is supplied by the existing harness;
// this does not test QR/WebRTC delivery, real audio onset or physical devices.
function paired(){
 const host=harness('host',{voice:true}),phone=harness('phone',{candidatePhone:true,fakeAudio:true});
 const cancellations=[];host.config.onCancel=result=>cancellations.push(result);host.counter();
 const hostLink=host.links[0],phoneLink=phone.phoneReady(),call=hostLink.sent.findLast(m=>m.type==='call');
 phone.tick(host.now());phone.node('phone-name').value='Erika Mustermann';phone.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 phoneLink.message({type:'ticket',number:host.level.registrationTicket,counter:host.level.assignedCounter.number});
 const queue=[],trace=[];
 for(const [from,to,side] of [[hostLink,phoneLink,'host'],[phoneLink,hostLink,'phone']]){
  const send=from.send.bind(from);from.send=(type,payload={})=>{const accepted=send(type,payload);if(accepted){const message={type,...payload};queue.push({to,message,side});trace.push({side,...message})}return accepted};
 }
 let drop=()=>false;
 function pump(){let count=0;while(queue.length){assert(++count<200,'bounded message handoff');const event=queue.shift();if(!drop(event))event.to.message(event.message)}}
 function tick(ms){let remaining=ms;while(remaining>0){const step=Math.min(20,remaining);host.tick(step);phone.tick(step);phone.audio.flushEnded();pump();remaining-=step}}
 function until(predicate,limit=30000){for(let elapsed=0;!predicate()&&elapsed<limit;elapsed+=20)tick(20);assert(predicate(),'paired state must arrive within its bounded wait')}
 phoneLink.message({type:'counter-start'});phoneLink.message({type:'call-arm',id:call.id,round:call.round});phoneLink.message(call);pump();until(()=>!phone.node('phone-call').hidden);
 return{host,phone,hostLink,phoneLink,cancellations,trace,pump,tick,until,setDrop:fn=>{drop=fn}};
}

test('the greeting starts in Answer and static spans greeting, fixed recording and inter-line gaps',()=>{
 const h=phoneCall(),noise=staticNoise(h),greeting=h.synth.current;
 assert.equal(h.synth.spoken.length,1);assert.equal(greeting.text,h.window.BuergeramtStory.call.greeting('Erika Mustermann'));assert.equal(greeting.lang,'de-DE');assert.equal(h.now(),0);
 assert(noise);assert.equal(noise.stopped.length,0);h.tick(200);h.synth.end();h.tick(20);
 assert.equal(receipts(h,'police-start').length,1);assert.equal(receipts(h,'police-done').length,0);
 h.audio.recordings[0].end();assert.equal(receipts(h,'police-done').length,1);assert.equal(noise.stopped.length,0);
 h.tick(5000);assert.equal(noise.stopped.length,0);h.links[0].message({type:'police-line',index:0,line:h.window.BuergeramtStory.police[0]});h.tick(20);
 assert.equal(h.synth.spoken.length,1,'fixed dialogue never re-enters WebSpeech');assert.equal(staticNoise(h),noise);assert.equal(h.audio.nodes.filter(n=>n.kind==='buffer-source'&&n.loop).length,1);
 h.links[0].message(endRequest);assert(noise.stopped.length);assert.equal(h.synth.current,null);assert.equal(h.node('phone-call').hidden,true);
});

test('the fixed opening body uses the catalogue exact text after the name greeting',()=>{
 const h=phoneCall(),lookups=[];h.window.GermanySimulatorAudioText.recordedClip=(voiceId,text)=>{lookups.push({voiceId,text});return './assets/voices/kriminalpolizei/kriminalpolizei-opening-body.mp3'};
 assert.equal(lookups.length,0);h.synth.end();assert.deepEqual(lookups,[{voiceId:'kriminalpolizei',text:h.window.BuergeramtStory.call.body}]);h.tick(20);h.audio.recordings[0].end();
 assert.equal(receipts(h,'police-start').length,1);assert.equal(receipts(h,'police-done').length,1);assert.equal(h.synth.spoken.length,1);
});

test('correct call-end owns clunk and 425 Hz line tone, and emits one sound receipt on actual ending',()=>{
 const h=phoneCall(),link=h.links[0];link.message({...endRequest,round:2});link.message({...endRequest,id:'other'});assert.equal(endingTone(h),undefined);assert.equal(h.node('phone-call').hidden,false);
 link.message(endRequest);const tone=endingTone(h),nodeCount=h.audio.nodes.length;
 assert(tone);assert.equal(tone.started[0],.22);assert.equal(tone.stopped[0],1.86);assert.equal(receipts(h,'call-ended').length,0);
 const clunk=h.audio.nodes.find(n=>n.kind==='buffer-source'&&!n.loop);assert.equal(clunk.buffer.length,5760);assert.equal(clunk.started[0],0);assert.equal(clunk.stopped[0],.12);
 link.message(endRequest);assert.equal(h.audio.nodes.length,nodeCount);h.tick(1859);h.audio.flushEnded();assert.equal(receipts(h,'call-ended').length,0);
 h.tick(1);h.audio.flushEnded();assert.deepEqual(receipts(h,'call-ended'),[{type:'call-ended',id:'grass',round:1,mode:'sound'}]);h.tick(10000);h.audio.flushEnded();assert.equal(receipts(h,'call-ended').length,1);
});

test('phone ending has a four-second fallback if its audio completion disappears',()=>{
 const h=phoneCall();h.links[0].message(endRequest);const late=endingTone(h).onended;
 h.tick(3999);assert.equal(receipts(h,'call-ended').length,0);h.tick(1);assert.equal(receipts(h,'call-ended').at(-1).mode,'fallback');late();assert.equal(receipts(h,'call-ended').length,1);
});

test('unavailable audio reports an ending fallback without inventing a sound completion',()=>{
 const h=phoneCall({fakeAudio:false});h.links[0].message(endRequest);assert.deepEqual(receipts(h,'call-ended'),[{type:'call-ended',id:'grass',round:1,mode:'fallback'}]);h.tick(6000);assert.equal(receipts(h,'call-ended').length,1);
});

for(const interruption of ['hidden','pagehide','forfeit','done','disconnect'])test(`${interruption} during phone ending disposes sources and rejects late completion`,()=>{
 const h=phoneCall();h.links[0].message(endRequest);const tone=endingTone(h),late=tone.onended;
 if(interruption==='hidden')h.hide();else if(interruption==='pagehide')h.window.dispatchEvent(new Event('pagehide'));else if(interruption==='disconnect')h.links[0].emit('status','Telefon getrennt');else h.links[0].message({type:interruption});
 late();h.tick(6000);h.audio.flushEnded();assert.equal(receipts(h,'call-ended').length,0);assert.equal(tone.disconnected,true);assert.equal(h.node('phone-call').hidden,true);assert.equal(h.synth.current,null);
});

test('user hang-up uses the same audible ending and never restarts queued police speech',()=>{
 const h=phoneCall(),link=h.links[0];h.node('phone-hangup').click();assert.equal(receipts(h,'hangup').length,1);assert(endingTone(h));assert.equal(receipts(h,'call-ended').length,0);
 h.node('phone-hangup').click();link.message({type:'police-line',index:0,line:h.window.BuergeramtStory.police[0]});h.tick(1860);h.audio.flushEnded();
 assert.equal(receipts(h,'hangup').length,1);assert.equal(receipts(h,'call-ended').length,1);assert.equal(receipts(h,'call-ended')[0].mode,'sound');assert.equal(h.audio.recordings.length,0);assert.equal(h.synth.spoken.length,1);
});

test('paired complete conversation ends phone audio before exact dismissal and kripo ejection',()=>{
 const p=paired(),{host,phone}=p,story=host.window.BuergeramtStory;
 phone.node('phone-answer').click();p.pump();assert.equal(host.level.stage,'cancelled');assert.equal(host.node('amt-ambient').textContent,'KRIMINALPOLIZEI · '+story.call.opening('Erika Mustermann'));
 const noise=staticNoise(phone);p.tick(200);phone.synth.end();p.tick(20);phone.audio.recordings[0].end();p.pump();
 for(let i=0;i<3;i++){
  p.until(()=>phone.audio.recordings.length===i+2);p.tick(20);assert.equal(noise.stopped.length,0);phone.audio.recordings[i+1].end();p.pump();
 }
 p.tick(20);host.synth.end();p.pump();p.until(()=>phone.audio.recordings.length===5);p.tick(20);assert.equal(noise.stopped.length,0);
 phone.audio.recordings[4].end();p.pump();assert(endingTone(phone));assert(noise.stopped.length);assert.equal(p.cancellations.length,0);assert.notEqual(host.node('amt-line').textContent,story.phoneDismissal.line);
 const remaining=endingTone(phone).stopped[0]*1000-phone.now();p.tick(remaining-1);assert.notEqual(host.node('amt-line').textContent,story.phoneDismissal.line);p.tick(1);
 assert.equal(host.node('amt-line').textContent,story.phoneDismissal.line);assert.equal(p.cancellations.length,0);p.tick(20);host.synth.end();p.tick(20);
 assert.equal(p.cancellations.length,1);assert.equal(p.cancellations[0].reason,'kripo');assert.equal(host.counts.form,0);assert.equal(host.level.active,false);assert.equal(phone.synth.spoken.length,1);
 assert.equal(p.trace.filter(m=>m.type==='police-start'&&m.index===-1).length,1);assert.equal(p.trace.filter(m=>m.type==='police-done'&&m.index===-1).length,1);assert.equal(p.trace.filter(m=>m.type==='call-ended').length,1);
});

test('paired hang-up waits for accepted ending; missing receipt reaches six-second host fallback',()=>{
 for(const dropReceipt of [false,true]){
  const p=paired(),{host,phone}=p;phone.node('phone-answer').click();p.pump();p.setDrop(event=>dropReceipt&&event.message.type==='call-ended');
  phone.node('phone-hangup').click();p.pump();const started=host.now(),dismissal=host.window.BuergeramtStory.phoneDismissal.line;
  const soundMs=Math.ceil(endingTone(phone).stopped[0]*1000-phone.now());
  p.hostLink.message({type:'call-ended',id:'grass',round:host.level.registration.callRound+1,mode:'sound'});p.tick(soundMs-1);assert.notEqual(host.node('amt-line').textContent,dismissal);p.tick(1);
  if(dropReceipt){assert.notEqual(host.node('amt-line').textContent,dismissal);p.tick(5999-(host.now()-started));assert.notEqual(host.node('amt-line').textContent,dismissal);p.tick(1)}
  assert.equal(host.node('amt-line').textContent,dismissal);p.hostLink.message({type:'call-ended',id:'grass',round:host.level.registration.callRound,mode:'sound'});p.tick(20);host.synth.end();p.tick(20);
  assert.equal(p.cancellations.length,1);assert.equal(p.cancellations[0].reason,'kripo');
 }
});

test('paired unanswered ringing reaches four reactions, stops phone output and ejects with ringing reason',()=>{
 const p=paired(),{host,phone}=p,round=host.level.registration.callRound;
 for(let count=1;count<=4;count++){
  p.until(()=>host.level.registration.warnings===count);assert.equal(host.node('amt-line').textContent,host.window.BuergeramtStory.phoneWarnings[count-1]);assert.equal(host.level.registration.callRound,round);
 }
 assert.equal(host.level.stage,'cancelled');assert.equal(phone.node('phone-call').hidden,true);assert.equal(phone.vibrations.at(-1),0);assert.equal(p.cancellations.length,0);
 assert.equal(p.trace.filter(m=>m.type==='call-ringing').length,1);assert.equal(p.trace.filter(m=>m.type==='call-missed').length,0);
 p.tick(20);host.synth.end();p.tick(20);assert.equal(p.cancellations.length,1);assert.equal(p.cancellations[0].reason,'ringing');assert.equal(host.counts.form,0);
});

test('replay while awaiting the phone ending rejects old receipt and fallback timer',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'answer',id:'grass'});link.message({type:'hangup',id:'grass'});const round=h.level.registration.callRound;
 h.level.replay(h.config);link.message({type:'call-ended',id:'grass',round,mode:'sound'});h.tick(10000);assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.cancel,0);assert.notEqual(h.node('amt-line').textContent,h.window.BuergeramtStory.phoneDismissal.line);
});

test('an unhandled incoming call keeps ringing past twelve seconds without a missed event',()=>{
 const h=harness('phone',{fakeAudio:true});h.incoming();const before=h.vibrations.length;h.tick(60000);assert.equal(h.node('phone-call').hidden,false);assert(h.vibrations.length>before);assert.equal(receipts(h,'call-missed').length,0);
});

test('declining stops ongoing warnings while preserving the next-call delay',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'call-ringing',id:'grass',atMs:h.now()});h.tick(Math.ceil(600/h.level.timeScale));assert.equal(h.level.registration.warnings,1);
 const round=h.level.registration.callRound;link.message({type:'decline',id:'grass'});h.tick(Math.ceil(13000/h.level.timeScale));assert.equal(h.level.registration.warnings,1,'a declined call no longer supplies ringing pressure');assert.equal(h.level.registration.callRound,round);
});

test('a quick decline preserves its initial arrival reaction but cannot start ongoing warnings',()=>{
 const h=harness(),link=h.links[0];h.counter();link.message({type:'call-ringing',id:'grass',atMs:h.now()});link.message({type:'decline',id:'grass'});h.tick(Math.ceil(600/h.level.timeScale));assert.equal(h.level.registration.warnings,1);h.tick(Math.ceil(13000/h.level.timeScale));assert.equal(h.level.registration.warnings,1);
});
