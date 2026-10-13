import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

const binding=JSON.parse(readFileSync('For-AI/VOICE-CAST.json')).productionVoices['amt-brunhilde-knick'];
const words=['','eins','zwei','drei','vier'];
function monitorLink(h){
 h.link=h.links.at(-1);h.link.selectPeer=peer=>{h.link.peer=peer;return true};
 const send=h.link.send.bind(h.link);
 h.link.send=(type,data={},peer=h.link.peer)=>{
  if(type==='sync-ping')h.context.setTimeout(()=>h.link.message({type:'sync-pong',peer,id:data.id,receivedAtMs:h.now(),sentAtMs:h.now()}),0);
  return send(type,data);
 };
}
function speech(h,{initialName=''}={}){
 monitorLink(h);
 const requests=[],clips=[],cache=new Map();let releases=0,disposed=0,preparationCancelled=0;
 h.window.GermanyKnickSpeech={initialName,prepare(name,counter){
  let resolve;const promise=new Promise(done=>resolve=result=>{if(result.status==='ready')cache.set(name+counter,result);done(result)});requests.push({name,counter,resolve});return promise;
 },textFor:(name,counter)=>`${name}, bitte zu Schalter ${words[counter]}!`,
 peek:(name,counter)=>cache.get(name+counter)||null,
 lease(result){return result?.status==='ready'?{url:'blob:local/knick',text:result.text,
  profileId:binding.profileId,referenceSha256:binding.referenceSha256,
  durationSeconds:4,english:result.english,release(){releases++}}:null},
 cancelPreparation(){preparationCancelled++;for(const request of requests)request.resolve({status:'disabled',reason:'cancelled'})},dispose(){disposed++}};
 h.window.GermanySimulatorAudioText.productionVoices={'amt-brunhilde-knick':binding};
 h.context.Audio=class{
  constructor(src){this.src=src;this.duration=4;this.currentTime=0;this.paused=true;clips.push(this)}
  play(){this.paused=false;h.context.setTimeout(()=>this.onplaying?.(),16);return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){this.src=''}load(){}
  end(){this.currentTime=this.duration;this.onended?.()}
 };
 return {requests,clips,evict(name,counter){cache.delete(name+counter)},get releases(){return releases},get disposed(){return disposed},get preparationCancelled(){return preparationCancelled}};
}
function register(h,name='Erika Mustermann',peer='phone-1',received=true){
 h.enter();h.link.peers??=new Map();h.link.peers.set(peer,{channel:h.link.channel});
 const id='a'.repeat(24);h.link.message({type:'scan',peer,id});h.link.message({type:'register',peer,id,name});
 const ticket=h.level.tickets.find(t=>t.peer===peer);
 if(received)h.link.message({type:'ticket-received',peer,id,number:ticket.number});return ticket;
}
async function ready(request,extra={}){request.resolve({status:'ready',text:`${request.name}, bitte zu Schalter ${words[request.counter]}!`,english:`${request.name}, please go to counter ${request.counter}!`,...extra});await Promise.resolve();await Promise.resolve()}
function voiceToggle(h){
 const state={voiceOn:true};Object.assign(h.context,{state,stopSpeech(){},setDialogueVoiceBusy(){}});h.config.voiceOn=()=>state.voiceOn;
 const assignment=source('game.js').split(/\r?\n/).find(line=>line.startsWith('document.getElementById("voice-toggle").onclick='));
 assert(assignment);vm.runInContext(assignment,h.context);return h.node('voice-toggle');
}
function loadSpeechManager(h){
 const workers=[];h.document.currentScript={src:'https://example.test/knick-speech.js'};
 Object.assign(h.context,{Blob,ArrayBuffer,state:{voiceOn:true},Worker:class{
  constructor(){this.posts=[];workers.push(this)}
  postMessage(message){this.posts.push(structuredClone(message))}terminate(){this.terminated=true}
  model(bytes){this.onmessage({data:structuredClone({kind:'model-buffer',bytes,
   profileId:binding.profileId,referenceSha256:binding.referenceSha256},{transfer:[bytes]})})}
  ready(){const {id,text}=this.posts.at(-1);this.onmessage({data:{id,text,status:'ready',wav:new ArrayBuffer(64),duration:4,
   profileId:binding.profileId,referenceSha256:binding.referenceSha256}})}
 }});
 vm.runInContext(source('knick-speech.js'),h.context);return workers;
}

test('a received ticket waits for its name audio, then its own call window begins',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h);const ticket=register(h);
 assert.equal(s.requests.length,1);assert.equal(s.requests[0].name,'Erika Mustermann');
 h.elapse(60);assert.equal(h.level.tickets[0].called,false);assert.equal(h.level.tickets[0].deadline,0);
 assert.equal(s.clips.length,0);assert.equal(h.level.stage,'waiting');
 await ready(s.requests[0]);h.elapse(13);
 assert.equal(h.level.tickets[0].called,true);assert.equal(s.clips.length,1);
 assert.equal(s.clips[0].src,'blob:local/knick');
 assert.equal(h.node('amt-ambient').textContent,`FRAU KNICK: Erika Mustermann, bitte zu Schalter ${words[ticket.counter]}!`);
 assert.equal(h.level.lipSpeech.actor,`clerk-${ticket.counter}`);assert.equal(h.synth.spoken.length,0);
 s.clips[0].end();assert.equal(s.releases,1);assert.equal(h.level.audioTextBusy,false);
});

test('failed synthesis still calls the ticket and retains the exact name caption',async()=>{
 const h=harness('host',{voice:true}),s=speech(h);const ticket=register(h,'Jürgen Müller');
 s.requests[0].resolve({status:'failed',reason:'unavailable'});await Promise.resolve();h.elapse(14);
 assert.equal(h.level.tickets[0].called,true);assert.equal(s.clips.length,0);assert.equal(h.synth.spoken.length,0);
 assert.equal(h.node('amt-ambient').textContent,`FRAU KNICK: Jürgen Müller, bitte zu Schalter ${words[ticket.counter]}!`);
});

test('muted voices do not request a model or wait for synthesis',()=>{
 const h=harness('host'),s=speech(h);register(h);h.elapse(14);
 assert.equal(s.requests.length,0);assert.equal(h.level.tickets[0].called,true);assert.equal(s.clips.length,0);
});

test('a retired reservation cannot accept late audio for its replacement',async()=>{
 const h=harness('host',{voice:true}),s=speech(h);register(h,'Erika Mustermann');
 h.link.message({type:'phone-hidden',peer:'phone-1'});assert.equal(h.level.tickets.length,0);
 register(h,'Jürgen Müller');assert.equal(s.requests.length,2);await ready(s.requests[0]);h.elapse(45);
 assert.equal(h.level.tickets[0].name,'Jürgen Müller');assert.equal(h.level.tickets[0].called,false);
 assert.equal(s.clips.length,0);await ready(s.requests[1]);h.elapse(13);
 assert.equal(h.level.tickets[0].called,true);
 assert.match(h.node('amt-ambient').textContent,/Jürgen Müller, bitte zu Schalter /);assert.doesNotMatch(h.node('amt-ambient').textContent,/Erika/);
});

test('the opening name prefills only the first phone and never overrides a second visitor',()=>{
 const h=harness('host'),s=speech(h,{initialName:'George Fejer'}),sent=[];
 h.link.send=(type,data={},peer)=>{sent.push({type,...data,peer});return true};
 register(h,'George Fejer','first');register(h,'Erika Mustermann','second');
 assert.deepEqual(sent.filter(m=>m.type==='known-name'),[{type:'known-name',id:'a'.repeat(24),name:'George Fejer',peer:'first'}]);
 assert.equal(s.requests.length,0);
});

test('the phone uses an available opening name and preserves a name already typed locally',()=>{
 const h=harness('phone');const link=h.phoneReady(),id=link.sent.find(m=>m.type==='scan').id;
 link.message({type:'known-name',id,name:'George Fejer'});assert.equal(h.node('phone-name').value,'George Fejer');
 h.node('phone-name').value='Erika Mustermann';link.message({type:'known-name',id,name:'George Fejer'});
 assert.equal(h.node('phone-name').value,'Erika Mustermann');
 link.message({type:'known-name',id:'b'.repeat(24),name:'Other Name'});assert.equal(h.node('phone-name').value,'Erika Mustermann');
});

test('exit disposes preparation and stale completion cannot speak after replay',async()=>{
 const h=harness('host',{voice:true}),s=speech(h);register(h);h.level.replay(h.config);assert.equal(s.disposed,1);
 await ready(s.requests[0]);h.elapse(15);assert.equal(s.clips.length,0);assert.equal(h.level.activated,false);
});

test('a late current receipt schedules its name announcement exactly once',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h);
 const ticket=register(h,'Erika Mustermann','phone-1',false);await ready(s.requests[0]);h.elapse(13);
 assert.equal(h.level.tickets[0].called,true);assert.equal(h.level.tickets[0].received,false);assert.equal(s.clips.length,0);
 const receipt={type:'ticket-received',peer:'phone-1',id:'a'.repeat(24),number:ticket.number};
 h.link.message(receipt);h.elapse(1);
 assert.equal(h.level.tickets[0].received,true);assert.equal(s.clips.length,1);
 assert.equal(h.node('amt-ambient').textContent,`FRAU KNICK: Erika Mustermann, bitte zu Schalter ${words[ticket.counter]}!`);
 s.clips[0].end();h.link.message(receipt);h.elapse(1);assert.equal(s.clips.length,1);
});

test('retiring an independently speaking visitor stops only her announcement',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h);
 register(h,'Anna Müller','first');register(h,'Erika Mustermann','second');await ready(s.requests[1]);h.elapse(17);
 assert.equal(s.clips.length,1);assert.equal(s.clips[0].paused,false);
 assert.match(h.node('amt-ambient').textContent,/Erika Mustermann/);
 h.link.message({type:'phone-hidden',peer:'second'});
 assert.equal(h.level.tickets.length,1);assert.equal(h.level.tickets[0].name,'Anna Müller');
 assert.equal(s.clips[0].paused,true);assert.equal(s.clips[0].src,'');assert.equal(s.releases,1);
 assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.level.audioTextBusy,false);
 s.clips[0].end();h.elapse(15);assert.equal(s.clips.length,1);assert.equal(h.level.tickets[0].called,false);
});

test('failed and muted names retain their English translation independently of a recording',async()=>{
 for(const voice of [true,false]){
  const h=harness('host',{voice,phoneCaptions:true}),s=speech(h),ticket=register(h,'Jürgen Müller');
  if(voice){s.requests[0].resolve({status:'failed',reason:'unavailable'});await Promise.resolve()}
  h.elapse(14);
  assert.equal(h.node('english-subtitle').lang,'en');
  assert.equal(h.node('english-subtitle').textContent,`Jürgen Müller, please go to counter ${ticket.counter}!`);
  assert.equal(s.clips.length,0);assert.equal(h.synth.spoken.length,0);
 }
});

test('a selected name recording keeps the exact German caption and English subtitle',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true,phoneCaptions:true}),s=speech(h),ticket=register(h,'Jürgen Müller');
 await ready(s.requests[0]);h.elapse(13);
 assert.equal(s.clips.length,1);assert.equal(h.synth.spoken.length,0);
 assert.equal(h.node('amt-ambient').textContent,`FRAU KNICK: Jürgen Müller, bitte zu Schalter ${words[ticket.counter]}!`);
 assert.equal(h.node('english-subtitle').textContent,`Jürgen Müller, please go to counter ${ticket.counter}!`);
 assert.equal(h.level.lipSpeech.actor,`clerk-${ticket.counter}`);s.clips[0].end();assert.equal(s.releases,1);
});

test('voice off releases an active name recording without changing its committed appointment',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true,phoneCaptions:true}),s=speech(h),toggle=voiceToggle(h),ticket=register(h);
 await ready(s.requests[0]);h.elapse(13);const player=s.clips[0],deadline=h.level.tickets[0].deadline;
 assert.equal(player.paused,false);assert.equal(h.level.lipSpeech.active,true);assert.equal(h.level.audioTextBusy,true);
 assert.equal(h.level.stage,'walk-counter');toggle.click();
 assert.equal(h.context.state.voiceOn,false);assert.equal(s.preparationCancelled,1);assert.equal(player.paused,true);
 assert.equal(player.src,'');assert.equal(s.releases,1);assert.equal(h.level.audioTextBusy,false);
 assert.equal(h.level.lipSpeech.active,false);assert.equal(h.level.lipSpeech.actor,null);assert(h.level.lipSpeech.shape.every(value=>value===0));
 assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.node('english-subtitle').hidden,true);
 assert.equal(h.level.stage,'walk-counter');assert.equal(h.level.registrationTicket,ticket.number);
 assert.equal(h.level.tickets[0].called,true);assert.equal(h.level.tickets[0].deadline,deadline);
 player.onplaying();player.end();h.elapse(1);
 assert.equal(s.clips.length,1);assert.equal(s.releases,1);assert.equal(h.node('amt-ambient').textContent,'');
 assert.equal(h.level.lipSpeech.active,false);assert.equal(h.level.registration.points,0);
});

test('voice off preserves an unrelated mission recording and its completion gate',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true,phoneCaptions:true}),s=speech(h),toggle=voiceToggle(h),ticket=register(h);
 await ready(s.requests[0]);h.elapse(13);s.clips[0].end();
 const story=h.window.BuergeramtStory,question=story.registration.nodes[story.registration.first].line,path='fixture-mission-clerk.mp3';
 h.window.GermanySimulatorAudioText.recordedClip=(voiceId,text)=>voiceId===story.clerkIdentity.voiceId&&text===question?path:null;
 h.window.GermanySimulatorAudioText.recordings={[path]:{source:question,english:'Mission question',durationSeconds:4}};
 h.level.interact({desk:ticket.counter});h.tick(16);const mission=s.clips[1],subtitle=h.node('english-subtitle').textContent;
 assert.equal(mission.src,path);assert.equal(mission.paused,false);assert.equal(h.level.lipSpeech.active,true);
 assert.equal(h.level.registration.node,story.registration.first);assert.equal(h.node('amt-line').textContent,question);
 assert.equal(h.node('amt-actions').children[0].disabled,true);toggle.click();
 assert.equal(h.context.state.voiceOn,false);assert.equal(mission.paused,false);assert.equal(mission.src,path);
 assert.equal(s.releases,1);assert.equal(h.level.lipSpeech.active,true);assert.equal(h.level.audioTextBusy,true);
 assert.equal(h.node('english-subtitle').textContent,subtitle);assert.equal(h.node('amt-line').textContent,question);
 assert.equal(h.level.stage,'counter');assert.equal(h.level.registration.node,story.registration.first);
 assert.equal(h.node('amt-actions').children[0].disabled,true);mission.end();
 assert.equal(h.level.audioTextBusy,false);assert.equal(h.node('amt-actions').children[0].disabled,false);
});

test('a recording for another counter cannot replace the current exact announcement',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true,phoneCaptions:true}),s=speech(h),ticket=register(h,'Jürgen Müller');
 const lease=h.window.GermanyKnickSpeech.lease;
 h.window.GermanyKnickSpeech.lease=result=>({...lease(result),text:`Jürgen Müller, bitte zu Schalter ${words[ticket.counter===1?2:1]}!`});
 await ready(s.requests[0]);h.elapse(13);
 assert.equal(s.clips.length,0);assert.equal(s.releases,1);assert.equal(h.synth.spoken.length,0);
 assert.equal(h.node('amt-ambient').textContent,`FRAU KNICK: Jürgen Müller, bitte zu Schalter ${words[ticket.counter]}!`);
 assert.equal(h.node('english-subtitle').textContent,`Jürgen Müller, please go to counter ${ticket.counter}!`);
});

test('completed tickets retain speech metadata without retaining the synthesized WAV',async()=>{
 const h=harness('host',{voice:true}),s=speech(h),blob=new Blob([new Uint8Array(4096)]);
 register(h);await ready(s.requests[0],{blob,wav:new ArrayBuffer(4096)});
 const ticket=h.level.tickets[0];assert.equal(ticket.speech.status,'ready');
 assert.equal(ticket.speech.blob,undefined);assert.equal(ticket.speech.wav,undefined);
 assert.equal(h.window.GermanyKnickSpeech.peek(ticket.name,ticket.counter).blob,blob);
});

test('an evicted name is prepared again before its board call starts the deadline',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h),ticket=register(h);
 await ready(s.requests[0]);s.evict(ticket.name,ticket.counter);h.elapse(13);
 assert.equal(s.requests.length,2);assert.equal(h.level.tickets[0].called,false);
 assert.equal(h.level.tickets[0].deadline,0);assert.equal(s.clips.length,0);
 await ready(s.requests[1]);h.elapse(13);
 assert.equal(h.level.tickets[0].called,true);assert.equal(s.clips.length,1);
 assert.match(h.node('amt-ambient').textContent,/Erika Mustermann, bitte zu Schalter /);
});

test('a committed call keeps its selected clip through subsequent cache eviction',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h),ticket=register(h);await ready(s.requests[0]);
 for(let i=0;i<400&&!h.level.tickets[0].called;i++)h.elapse(.05);
 assert.equal(h.level.tickets[0].called,true);assert.equal(s.clips.length,0);
 s.evict(ticket.name,ticket.counter);h.elapse(1);
 assert.equal(s.requests.length,1);assert.equal(s.clips.length,1);
 assert.match(h.node('amt-ambient').textContent,/Erika Mustermann, bitte zu Schalter /);
 s.clips[0].end();assert.equal(s.releases,1);
});

test('clearing the opening field leaves the second form as the first usable name source',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h),workers=loadSpeechManager(h);
 const input=new EventTarget();input.value='';input.checkValidity=()=>input.value.trim().length>=2;
 h.context.openingNameInput=input;
 const preparation=source('game.js').match(/function prepareHumorName\(input\)\{[\s\S]*?\n\}/)?.[0];
 assert(preparation);vm.runInContext(preparation+'\nprepareHumorName(openingNameInput);',h.context);
 input.value='Anna Müller';input.dispatchEvent(new Event('change'));h.tick(50);
 input.value='';input.dispatchEvent(new Event('change'));
 assert.equal(h.window.GermanyKnickSpeech.initialName,'');assert.equal(workers[0].terminated,true);
 assert.equal(h.window.GermanyKnickSpeech.inspect().pending,0);
 const ticket=register(h,'Jürgen Müller');h.tick(50);
 assert.equal(h.link.sent.filter(message=>message.type==='known-name').length,0);
 assert.equal(workers.length,2);assert.equal(workers[1].posts.length,1);
 assert.equal(workers[1].posts[0].text,`Jürgen Müller, bitte zu Schalter ${words[ticket.counter]}!`);
 workers[0].ready();assert.equal(h.window.GermanyKnickSpeech.inspect().cached,0);
 workers[1].ready();await Promise.resolve();await Promise.resolve();h.elapse(13);
 assert.equal(h.level.tickets[0].name,'Jürgen Müller');assert.equal(s.clips.length,1);
 assert.match(h.node('amt-ambient').textContent,/Jürgen Müller, bitte zu Schalter /);assert.doesNotMatch(h.node('amt-ambient').textContent,/Anna Müller/);
 s.clips[0].end();h.window.GermanyKnickSpeech.dispose();
});

test('office replay clears model RAM and ignores the retired worker before a fresh name',async()=>{
 const h=harness('host',{voice:true,fakeAudio:true}),s=speech(h),workers=loadSpeechManager(h),manager=h.window.GermanyKnickSpeech;
 register(h);h.tick(50);const old=workers[0];old.model(Uint8Array.from([11,23,37,41]).buffer);
 old.ready();await Promise.resolve();await Promise.resolve();h.elapse(13);
 assert.equal(s.clips.length,1);assert.equal(s.clips[0].paused,false);h.level.replay(h.config);monitorLink(h);
 assert.equal(h.window.GermanyKnickSpeech,manager);assert.equal(old.terminated,true);assert.equal(manager.inspect().cached,0);
 assert.equal(s.clips[0].paused,true);assert.equal(s.clips[0].src,'');old.model(Uint8Array.from([99]).buffer);
 const ticket=register(h,'Jürgen Müller');h.tick(50);const current=workers[1];
 assert.equal(Object.hasOwn(current.posts[0],'modelBytes'),false);
 assert.equal(current.posts[0].text,`Jürgen Müller, bitte zu Schalter ${words[ticket.counter]}!`);
 current.ready();await Promise.resolve();await Promise.resolve();h.elapse(13);
 assert.equal(s.clips.length,2);assert.equal(s.clips[1].paused,false);
 assert.equal(h.node('amt-ambient').textContent,`FRAU KNICK: Jürgen Müller, bitte zu Schalter ${words[ticket.counter]}!`);
 s.clips[1].end();manager.dispose();
});

test('name transport rejects C0 and C1 controls without consuming a valid sequence',()=>{
 const window={};vm.runInNewContext(source('buergeramt-link.js'),{window,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams});
 for(const role of ['host','phone']){
  const invitation={stream:'amt-name-controls'},link=new window.BuergeramtLink(role,invitation),messages=[],sent=[];
  const channel=Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send(text){sent.push(JSON.parse(text))}});
  link.attach('peer',channel);link.addEventListener('message',event=>messages.push(event.detail));
  const outgoing=role==='host'?'known-name':'register',incoming=role==='host'?'register':'known-name',id='a'.repeat(24);
  const receive=(name,seq)=>{const event=new Event('message');event.data=JSON.stringify({v:3,session:invitation.stream,seq,type:incoming,id,name});channel.dispatchEvent(event)};
  for(const code of [0,31,127,128,133,159]){
   const name='Name'+String.fromCharCode(code)+'Other';assert.equal(link.send(outgoing,{id,name},'peer'),false);receive(name,100);
  }
  assert.equal(sent.length,0);assert.equal(messages.length,0);
  assert.equal(link.send(outgoing,{id,name:'Jürgen Müller'},'peer'),true);receive('Jürgen Müller',1);
  assert.equal(sent[0].seq,1);assert.equal(messages.length,1);assert.equal(messages[0].name,'Jürgen Müller');
 }
});

test('the readiness regression rejects an intentionally removed causal gate',()=>{
 const broken=source('buergeramt.js').replace('if(held||speechHeld)','if(held)');
 assert.notEqual(broken,source('buergeramt.js'));
 const h=harness('host',{voice:true,hostSource:broken});speech(h);register(h);h.elapse(20);
 assert.equal(h.level.tickets[0].called,true,'the mutant exposes the pending ticket too early');
});
