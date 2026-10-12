import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function transport(role='phone'){
 const window={};vm.runInNewContext(source('buergeramt-link.js'),{window,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams});
 const invitation={stream:'amt-goop-phone-test'},link=new window.BuergeramtLink(role,invitation),messages=[];
 class Channel extends EventTarget{
  readyState='open';bufferedAmount=0;sent=[];
  send(data){this.sent.push(JSON.parse(data))}
  close(){this.readyState='closed';this.dispatchEvent(new Event('close'))}
  receive(data){const event=new Event('message');event.data=JSON.stringify({v:3,session:invitation.stream,seq:1,...data});this.dispatchEvent(event)}
 }
 const channel=new Channel();link.addEventListener('message',event=>messages.push(event.detail));link.attach('current-peer',channel);
 return{link,channel,Channel,messages};
}

test('office tempo is finite, bounded, host-owned and cannot consume a sequence when malformed',()=>{
 const phone=transport(),host=transport('host');
 for(const payload of [{},{rate:null},{rate:'0.4'},{rate:.399999},{rate:1.000001},{rate:.4,extra:true}])phone.channel.receive({seq:100,type:'office-tempo',...payload});
 assert.equal(phone.messages.length,0);
 for(const [seq,rate] of [[1,1],[2,.7],[3,.4]])phone.channel.receive({seq,type:'office-tempo',rate});
 assert.deepEqual(phone.messages.map(message=>message.rate),[1,.7,.4]);
 phone.channel.receive({seq:3,type:'office-tempo',rate:1});phone.channel.receive({session:'retired-attempt',seq:999,type:'office-tempo',rate:1});
 assert.equal(phone.messages.length,3);
 assert.equal(host.link.send('office-tempo',{rate:.4}),true);assert.equal(phone.link.send('office-tempo',{rate:.4}),false);
 for(const rate of [NaN,Infinity,-Infinity,.399,1.001,'1',null])assert.equal(host.link.send('office-tempo',{rate}),false);
 host.channel.receive({type:'office-tempo',rate:.4});assert.equal(host.messages.length,0);
});

test('a retired phone channel cannot change the current attempt tempo',()=>{
 const phone=transport();phone.channel.receive({seq:9,type:'office-tempo',rate:.7});phone.channel.close();
 const replacement=new phone.Channel();phone.link.attach('replacement-peer',replacement);
 replacement.receive({type:'office-tempo',rate:.4});phone.channel.readyState='open';phone.channel.receive({seq:999,type:'office-tempo',rate:1});
 assert.deepEqual(phone.messages.map(message=>message.rate),[.7,.4]);
 phone.link.close();replacement.readyState='open';replacement.receive({seq:2,type:'office-tempo',rate:1});assert.equal(phone.messages.length,2);
});

test('recorded phone speech follows current and future tempo with pitch preservation disabled',()=>{
 const h=harness('phone',{candidatePhone:true,fakeAudio:true}),link=h.links[0];link.message({type:'office-tempo',rate:.7});h.incoming();h.node('phone-answer').click();h.tick(20);
 const first=h.audio.recordings[0];assert.equal(first.playbackRate,.7);assert.equal(first.defaultPlaybackRate,.7);assert.equal(first.preservesPitch,false);
 assert.equal(link.sent.find(message=>message.type==='police-start').atMs,16);
 link.message({type:'office-tempo',rate:.4});assert.equal(first.playbackRate,.4);
 first.end();h.tick(1);link.message({type:'police-line',index:0,line:h.window.BuergeramtStory.police[0]});h.tick(20);
 assert.equal(h.audio.recordings[1].playbackRate,.4);assert.equal(h.audio.recordings[1].preservesPitch,false);
 for(const rate of [.3,1.1,NaN,'0.4',null])link.message({type:'office-tempo',rate});assert.equal(h.audio.recordings[1].playbackRate,.4);
});

test('static noise and its filter follow tempo and disconnect immediately on hangup',()=>{
 const h=harness('phone',{candidatePhone:true,fakeAudio:true}),link=h.incoming();h.node('phone-answer').click();h.tick(20);
 const noise=h.audio.nodes.find(node=>node.kind==='buffer-source'),filter=h.audio.nodes.find(node=>node.kind==='filter');
 assert.equal(noise.playbackRate.value,1);link.message({type:'office-tempo',rate:.4});assert.equal(noise.playbackRate.value,.4);assert.equal(filter.frequency.value,880);
 h.node('phone-hangup').click();assert.equal(noise.disconnected,true);assert.equal(filter.disconnected,true);assert.ok(noise.stopped.length);
 const receipts=link.sent.filter(message=>message.type==='police-done').length;h.tick(150000);assert.equal(link.sent.filter(message=>message.type==='police-done').length,receipts);
});

test('ring pitch, authored burst envelopes and haptics use the same 0.4 tempo',()=>{
 const h=harness('phone',{fakeAudio:true}),link=h.links[0];link.message({type:'office-tempo',rate:.4});h.incoming();
 const tones=h.audio.nodes.filter(node=>node.kind==='oscillator');assert.equal(tones.length,4);
 for(const tone of tones)assert.equal(tone.frequency.value,176);
 for(const [index,at] of [0,.55,1.5,2.05].entries())assert.ok(Math.abs(tones[index].started[0]-at)<1e-9);
 assert.ok(Math.abs(tones[0].stopped[0]-.45)<1e-9);
 const gain=tones[0].connections[0];assert.ok(gain.gain.events.some(([kind,value,time])=>kind==='linear'&&value===.025&&Math.abs(time-.05)<1e-9));
 assert.deepEqual([...h.vibrations.at(-1)],[600,375,600,375,600]);
 h.tick(6999);assert.equal(h.audio.nodes.filter(node=>node.kind==='oscillator').length,4);h.tick(1);assert.equal(h.audio.nodes.filter(node=>node.kind==='oscillator').length,8);
});

test('tempo changes preserve accumulated repeating-ring phase without a second timer loop',()=>{
 const h=harness('phone',{fakeAudio:true}),link=h.incoming(),rings=()=>h.vibrations.filter(Array.isArray).length;
 assert.equal(rings(),1);h.tick(1000);link.message({type:'office-tempo',rate:.7});h.tick(1000);link.message({type:'office-tempo',rate:.4});
 const timerCount=h.timers.size;link.message({type:'office-tempo',rate:.4});assert.equal(h.timers.size,timerCount);
 h.tick(2749);assert.equal(rings(),1);h.tick(1);assert.equal(rings(),2);assert.equal(h.now(),4750);
 h.node('phone-decline').click();const count=rings();h.tick(20000);assert.equal(rings(),count);
});

test('tempo changes preserve the absolute committed first-ring deadline',()=>{
 const h=harness('phone',{fakeAudio:true}),link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'call-arm',id:'grass'});
 link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:1500,ringAtUtcMs:null,leadMs:2200});
 h.tick(500);link.message({type:'office-tempo',rate:.4});h.tick(999);assert.equal(h.node('phone-call').hidden,true);h.tick(1);assert.equal(h.node('phone-call').hidden,false);
 assert.equal(link.sent.find(message=>message.type==='call-scheduled').atMs,1500);
 assert.equal(h.audio.nodes.find(node=>node.kind==='oscillator').started[0],1.5);
 const updated=h.audio.nodes.filter(node=>node.kind==='oscillator').slice(-4);assert.equal(updated[0].frequency.value,176);assert.equal(updated[0].started[0],1.5);assert.ok(Math.abs(updated[0].stopped[0]-1.95)<1e-9);
});

test('the slowest authored call lead stays a bounded 5500 ms peer deadline',()=>{
 const host=transport('host'),payload={id:'grass',line:'Anruf.',ringAtPhoneMs:5500,ringAtUtcMs:null,leadMs:5500};
 assert.equal(host.link.send('call',payload),true);assert.equal(host.link.send('call',{...payload,leadMs:5501}),false);
 const h=harness('phone'),link=h.phoneReady();h.node('phone-name').value='Erika Mustermann';h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
 link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'office-tempo',rate:.4});link.message({type:'call-arm',id:'grass'});link.message({type:'call',...payload});
 assert.equal(link.sent.find(message=>message.type==='call-scheduled').mode,'peer');h.tick(5499);assert.equal(h.node('phone-call').hidden,true);h.tick(1);assert.equal(h.node('phone-call').hidden,false);
});

test('phone cutoff and observed receipts remain in wall time while playback slows',()=>{
 const h=harness('phone',{candidatePhone:true}),link=h.incoming();h.node('phone-answer').click();h.tick(500);const clip=h.audio.recordings[0],lateEnd=clip.onended;
 link.message({type:'police-cutoff',index:-1,stopAtPhoneMs:7216,stopAtUtcMs:null});link.message({type:'office-tempo',rate:.4});h.tick(6715);assert.equal(clip.paused,false);h.tick(1);assert.equal(clip.paused,true);
 const done=link.sent.filter(message=>message.type==='police-done');assert.equal(done.length,1);assert.equal(done[0].atMs,7216);assert.equal(done[0].durationMs,7200);
 lateEnd();assert.equal(link.sent.filter(message=>message.type==='police-done').length,1);
});

test('the slowest authored cutoff fits its bounded forward window',()=>{
 const h=harness('phone',{candidatePhone:true}),link=h.incoming();link.message({type:'office-tempo',rate:.4});h.node('phone-answer').click();h.tick(20);
 link.message({type:'police-cutoff',index:-1,stopAtPhoneMs:20021,stopAtUtcMs:null});h.tick(1);assert.equal(h.audio.recordings[0].paused,false);
 link.message({type:'police-cutoff',index:-1,stopAtPhoneMs:18016,stopAtUtcMs:null});h.tick(17994);assert.equal(h.audio.recordings[0].paused,false);h.tick(1);assert.equal(h.audio.recordings[0].paused,true);
 const done=link.sent.find(message=>message.type==='police-done');assert.equal(done.atMs,18016);assert.equal(done.durationMs,18000);
 assert.equal(transport().link.send('police-done',{index:-1,mode:'recording',durationMs:26200,atMs:26216}),true);
});

test('the recorded watchdog tolerates 0.4 playback and still terminates a stalled line',()=>{
 const h=harness('phone',{candidatePhone:true}),link=h.incoming();link.message({type:'office-tempo',rate:.4});h.node('phone-answer').click();h.tick(20);
 const clip=h.audio.recordings[0],limit=Math.max(20000,h.window.BuergeramtStory.call.line.length*140)/.4;
 h.tick(20001);assert.equal(clip.paused,false);assert.equal(link.sent.filter(message=>message.type==='police-done').length,0);
 h.tick(limit);assert.equal(clip.paused,true);assert.equal(link.sent.filter(message=>message.type==='police-done').length,1);
});

test('silent readable fallback conserves its progress under a gradual tempo change',()=>{
 const h=harness('phone',{synthesis:false}),link=h.incoming();h.node('phone-answer').click();
 const duration=Math.max(3500,h.window.BuergeramtStory.call.line.length*55);h.tick(1000);link.message({type:'office-tempo',rate:.4});
 const remaining=(duration-1000)/.4;h.tick(remaining-1);assert.equal(link.sent.filter(message=>message.type==='police-done').length,0);h.tick(1);
 const done=link.sent.find(message=>message.type==='police-done');assert.equal(done.mode,'fallback');assert.equal(done.atMs,1000+remaining);
});

test('Web Speech samples tempo for each onset without pretending to retime active speech',()=>{
 const h=harness('phone'),link=h.incoming();link.message({type:'office-tempo',rate:.4});h.node('phone-answer').click();h.tick(20);
 const first=h.synth.current;assert.ok(Math.abs(first.rate-.87*.4)<1e-9);assert.ok(Math.abs(first.pitch-.66*.4)<1e-9);
 link.message({type:'office-tempo',rate:.7});assert.ok(Math.abs(first.rate-.87*.4)<1e-9);h.synth.end();h.tick(1);
 link.message({type:'police-line',index:0,line:h.window.BuergeramtStory.police[0]});h.tick(20);assert.ok(Math.abs(h.synth.current.rate-.93*.7)<1e-9);
});

test('expired or hidden phone attempts cancel media and cannot absorb later tempo',()=>{
 for(const exit of ['forfeit','hidden']){
  const h=harness('phone',{candidatePhone:true,fakeAudio:true}),link=h.incoming();h.node('phone-answer').click();h.tick(20);const clip=h.audio.recordings[0];
  if(exit==='hidden')h.hide();else link.message({type:'forfeit'});
  link.message({type:'office-tempo',rate:.4});assert.equal(clip.paused,true);assert.equal(clip.playbackRate,1);h.tick(150000);
  assert.equal(link.sent.filter(message=>message.type==='police-done').length,0);assert.equal(h.node('phone-expired').hidden,false);
 }
});
