import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {source} from './amt-harness.mjs';

test('one- and two-letter tickets, calls and receipts pass transport validation, malformed codes do not',()=>{
 for(const number of ['A-004','ZA-731','XB-018']){
  const host=transport(),phone=transport('phone'),receipt={id:'a'.repeat(24),number};
  assert.equal(host.link.send('ticket',{number,counter:2}),true);assert.equal(host.link.send('queue-call',{number,counter:2}),true);
  phone.channel.receive({type:'ticket',number,counter:2});phone.channel.receive({type:'queue-call',number,counter:2,seq:2});
  assert.equal(phone.messages.length,2);assert.equal(phone.link.send('ticket-received',receipt),true);
  host.channel.receive({type:'ticket-received',...receipt});assert.equal(host.messages.length,1);
 }
 for(const number of ['ABC-123','za-123','A--123','-123','ZA-','ZA-1234567890123']){
  const host=transport(),phone=transport('phone');
  assert.equal(host.link.send('ticket',{number,counter:2}),false);assert.equal(host.link.send('queue-call',{number,counter:2}),false);
  assert.equal(phone.link.send('ticket-received',{id:'a'.repeat(24),number}),false);
 }
});

test('only the phone sends a bounded ticket receipt with the scan ID and exact code',()=>{
 const host=transport(),phone=transport('phone'),receipt={id:'a'.repeat(24),number:'B-041'};
 for(const bad of [{...receipt,id:'bad'},{...receipt,id:[receipt.id]},{...receipt,number:'41'},{...receipt,counter:3},{number:receipt.number}])host.channel.receive({type:'ticket-received',...bad});
 assert.equal(host.messages.length,0);host.channel.receive({type:'ticket-received',...receipt});assert.equal(host.messages.length,1);
 assert.equal(phone.link.send('ticket-received',receipt),true);assert.equal(host.link.send('ticket-received',receipt),false);phone.channel.receive({type:'ticket-received',...receipt});assert.equal(phone.messages.length,0);
});

function transport(role='host',linkSource=source('buergeramt-link.js')){
 const window={};vm.runInNewContext(linkSource,{window,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams,console});
 const invitation={stream:'amt-ticket-unit-test'},link=new window.BuergeramtLink(role,invitation),messages=[];
 class Channel extends EventTarget{
  readyState='open';bufferedAmount=0;sent=[];fail=false;
  send(text){if(this.fail)throw new Error('Channel closed during send');this.sent.push(JSON.parse(text))}
  close(){this.readyState='closed';this.dispatchEvent(new Event('close'))}
  raw(data){const e=new Event('message');e.data=data;this.dispatchEvent(e)}
  receive(data){this.raw(JSON.stringify({v:3,session:invitation.stream,seq:1,...data}))}
 }
 link.addEventListener('message',e=>messages.push(e.detail));const channel=new Channel();link.attach('peer-1',channel);
 return{link,channel,Channel,messages};
}
test('only valid phone registration reaches the host',()=>{const h=transport();h.channel.receive({type:'register',id:'a'.repeat(24),name:'Erika Mustermann'});assert.equal(h.messages.length,1);assert.equal(h.messages[0].name,'Erika Mustermann')});
test('the QR invitation can carry the host subtitle preference without changing pairing credentials',()=>{
 const window={},location={href:'https://example.test/index.html',hash:''};vm.runInNewContext(source('buergeramt-link.js'),{window,location,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams});
 const invitation={room:'amt-test',secret:'a'.repeat(32),stream:'amt-ticket-test'},Link=window.BuergeramtLink;
 const de=new URL(Link.phoneUrl(invitation)),en=new URL(Link.phoneUrl(invitation,true));assert.equal(new URLSearchParams(de.hash.slice(1)).has('captions'),false);assert.equal(new URLSearchParams(en.hash.slice(1)).get('captions'),'en');assert.equal(de.searchParams.has('voicePreview'),false);location.href='https://example.test/index.html?voicePreview=1';const audition=new URL(Link.phoneUrl(invitation));assert.equal(audition.searchParams.get('voicePreview'),'1');assert.equal(new URLSearchParams(audition.hash.slice(1)).get('secret'),invitation.secret);location.hash=en.hash;assert.deepEqual(JSON.parse(JSON.stringify(Link.fromHash())),invitation);
});
test('a bounded scan id reaches the host without form data',()=>{const h=transport();h.channel.receive({type:'scan',id:'a'.repeat(24)});assert.equal(h.messages.length,1);assert.equal(h.messages[0].id,'a'.repeat(24))});
test('only bounded police speech receipts reach the host',()=>{const h=transport();h.channel.receive({type:'police-done',index:-2,mode:'voice',durationMs:100,atMs:500});h.channel.receive({type:'police-start',index:-1,mode:'voice',readyDelayMs:25,atMs:400,seq:2});h.channel.receive({type:'police-done',index:-1,mode:'voice',durationMs:100,atMs:500,seq:3});assert.equal(h.messages.length,2);assert.equal(h.messages[1].index,-1)});
test('only the host may schedule a bounded phone cutoff',()=>{
 const phone=transport('phone'),host=transport(),payload={stopAtPhoneMs:7200,stopAtUtcMs:1791648007200};
 for(const index of [-2,3,NaN,1.5])phone.channel.receive({type:'police-cutoff',index,...payload});
 for(const stopAtPhoneMs of [-1,1e12+1,'7200'])phone.channel.receive({type:'police-cutoff',index:-1,...payload,stopAtPhoneMs});
 phone.channel.receive({type:'police-cutoff',index:-1,...payload,unexpected:true});assert.equal(phone.messages.length,0);
 phone.channel.receive({type:'police-cutoff',index:-1,...payload});assert.equal(phone.messages.length,1);
 host.channel.receive({type:'police-cutoff',index:0,...payload});assert.equal(host.messages.length,0);
 assert.equal(phone.link.send('police-cutoff',{index:0,...payload}),false);assert.equal(host.link.send('police-cutoff',{index:2,...payload}),true);
});
test('recorded audition mode uses the existing bounded police receipt contract',()=>{const h=transport();h.channel.receive({type:'police-start',index:-1,mode:'recording',readyDelayMs:25,atMs:400});h.channel.receive({type:'police-done',index:-1,mode:'recording',durationMs:900,atMs:1300,seq:2});assert.equal(h.messages.length,2);assert.equal(h.messages[1].mode,'recording')});
test('timing handshake rejects invalid IDs, modes and durations',()=>{const host=transport(),phone=transport('phone');for(const bad of [{type:'sync-pong',id:0,receivedAtMs:1,sentAtMs:1},{type:'sync-pong',id:1.5,receivedAtMs:1,sentAtMs:1},{type:'sync-pong',id:1,receivedAtMs:12,sentAtMs:11},{type:'sync-pong',id:1,receivedAtMs:0,sentAtMs:12001},{type:'police-start',index:4,mode:'voice',readyDelayMs:0,atMs:1},{type:'police-start',index:0,mode:'bogus',readyDelayMs:0,atMs:1},{type:'police-start',index:0,mode:'voice',readyDelayMs:-1,atMs:1},{type:'police-done',index:0,mode:'voice',durationMs:-1,atMs:1},{type:'police-done',index:0,mode:'voice',durationMs:60001,atMs:1}])host.channel.receive(bad);assert.equal(host.messages.length,0);host.channel.receive({type:'sync-pong',id:7,receivedAtMs:50,sentAtMs:55});assert.equal(host.messages.length,1);phone.channel.receive({type:'sync-ping',id:7});assert.equal(phone.messages.length,1);assert.equal(phone.link.send('sync-pong',{id:7,receivedAtMs:50,sentAtMs:55}),true);assert.equal(host.link.send('sync-ping',{id:7}),true)});
test('call targets and scheduling receipts reject malformed clock modes and lead times',()=>{
 const host=transport(),phone=transport('phone');
 for(const bad of [{type:'call-ready',id:'grass',round:1,atMs:-1},{type:'call-scheduled',id:'grass',round:1,atMs:10,mode:'unknown',lateMs:0},{type:'call-scheduled',id:'grass',round:1,atMs:10,mode:'peer',lateMs:-1}])host.channel.receive(bad);
 for(const bad of [{type:'call',id:'grass',round:1,line:'Anruf.',ringAtPhoneMs:10,ringAtUtcMs:null,leadMs:50},{type:'call',id:'grass',round:1,line:'Anruf.',ringAtPhoneMs:-1,ringAtUtcMs:null,leadMs:2200},{type:'call',id:'grass',round:1,line:'Anruf.',ringAtPhoneMs:null,ringAtUtcMs:'tomorrow',leadMs:2200}])phone.channel.receive(bad);
 assert.equal(host.messages.length,0);assert.equal(phone.messages.length,0);
 host.channel.receive({type:'call-scheduled',id:'grass',round:1,atMs:2200,mode:'peer',lateMs:0});phone.channel.receive({type:'call',id:'grass',round:1,line:'Anruf.',ringAtPhoneMs:2200,ringAtUtcMs:null,leadMs:2200});assert.equal(host.messages.length,1);assert.equal(phone.messages.length,1);
});
test('unrecognized types cannot consume the valid sequence',()=>{const h=transport();h.channel.receive({seq:100,type:'unknown'});h.channel.receive({seq:2,type:'register',id:'a'.repeat(24),name:'Erika Mustermann'});assert.equal(h.messages.length,1);assert.equal(h.messages[0].seq,2)});
test('wrong-direction messages cannot consume the sequence',()=>{const h=transport();h.channel.receive({seq:100,type:'done'});h.channel.receive({seq:2,type:'phone-hidden'});assert.equal(h.messages.length,1);assert.equal(h.messages[0].type,'phone-hidden')});
test('session, version and sequence checks reject replay or invalid envelopes',()=>{
 const h=transport();for(const bad of [{session:'other'},{v:1},{v:2},{seq:0},{seq:-1},{seq:1.5},{seq:Number.MAX_SAFE_INTEGER+1}])h.channel.receive({type:'phone-hidden',...bad});
 assert.equal(h.messages.length,0);h.channel.receive({type:'phone-hidden'});h.channel.receive({type:'phone-hidden'});assert.equal(h.messages.length,1);
});
test('malformed JSON and non-string data are ignored',()=>{const h=transport();for(const data of ['{','null','[]','42',new Uint8Array(4)])h.channel.raw(data);assert.equal(h.messages.length,0)});
test('payloads reject missing or extra fields, controls and excessive lengths',()=>{
 const h=transport();for(const bad of [{type:'register'},{type:'register',id:'a'.repeat(24),name:' '},{type:'register',id:'a'.repeat(24),name:'X'},{type:'register',id:'a'.repeat(24),name:'x'.repeat(81)},{type:'register',id:'a'.repeat(24),name:'Good\u0000Name'},{type:'register',id:'a'.repeat(24),name:'Erika Mustermann',admin:true},{type:'phone-hidden',extra:1},{type:'answer',id:'wrong'}])h.channel.receive(bad);assert.equal(h.messages.length,0);
});
test('phone accepts tickets, calls and bounded police lines only from the host',()=>{
 const h=transport('phone');h.channel.receive({type:'ticket',counter:3,number:'B-223'});h.channel.receive({seq:2,type:'call-arm',id:'grass',round:1});h.channel.receive({seq:3,type:'call',id:'grass',round:1,line:'Polizei.',ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200});h.channel.receive({seq:4,type:'police-line',index:3,line:'Bitte antworten.'});assert.equal(h.messages.length,4);
 for(const bad of [{type:'register',id:'a'.repeat(24),name:'Erika Mustermann'},{type:'ticket',number:'Z-223'},{type:'police-line',index:-1,line:'Nein'},{type:'police-line',index:4,line:'Nein'},{type:'police-line',index:1,line:' '},{type:'call',id:'grass',round:1,line:'x'.repeat(350),ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200}])h.channel.receive({seq:100,...bad});assert.equal(h.messages.length,4);
});
test('a refreshed channel may restart sequence numbers, but the old channel stays inert',()=>{
 const h=transport();h.channel.receive({seq:20,type:'phone-hidden'});h.channel.close();const next=new h.Channel();h.link.attach('peer-2',next);next.receive({type:'register',id:'a'.repeat(24),name:'New Name'});h.channel.raw(JSON.stringify({v:3,session:'amt-ticket-unit-test',seq:999,type:'register',id:'a'.repeat(24),name:'Old Name'}));assert.equal(h.messages.length,2);assert.equal(h.messages[1].name,'New Name');
});
test('messages arriving after close never reach consumers',()=>{const h=transport();h.link.close();h.channel.readyState='open';h.channel.receive({type:'phone-hidden'});assert.equal(h.messages.length,0)});
test('closed links never attach a new channel',()=>{const h=transport();h.link.close();const next=new h.Channel();h.link.attach('peer-2',next);assert.equal(h.link.channel,null)});
test('payloads cannot override the outbound envelope',()=>{
 const h=transport();for(const payload of [{number:'B-223',type:'done'},{number:'B-223',seq:999},{number:'B-223',session:'other'},{number:'B-223',v:0}])assert.equal(h.link.send('ticket',payload),false);assert.equal(h.channel.sent.length,0);
});
test('outbound roles, fields and bounded values are validated',()=>{
 const h=transport();assert.equal(h.link.send('answer',{id:'grass'}),false);assert.equal(h.link.send('activated',{unexpected:true}),false);assert.equal(h.link.send('police-line',{index:9,line:'Nein'}),false);assert.equal(h.link.send('ticket',{number:'B-223',counter:3}),true);assert.equal(h.channel.sent[0].type,'ticket');assert.equal(h.channel.sent[0].seq,1);
});
test('channel send races are returned as failure without consuming a sequence',()=>{const h=transport(),ticket={number:'B-223',counter:3};h.channel.fail=true;assert.doesNotThrow(()=>assert.equal(h.link.send('ticket',ticket),false));h.channel.fail=false;assert.equal(h.link.send('ticket',ticket),true);assert.equal(h.channel.sent[0].seq,1)});
test('congested, closed and oversized sends fail without publishing',()=>{
 const h=transport();h.channel.bufferedAmount=65537;assert.equal(h.link.send('activated'),false);h.channel.bufferedAmount=0;assert.equal(h.link.send('call',{id:'grass',round:1,line:'界'.repeat(349),ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200}),false);assert.equal(h.channel.sent.length,0);h.link.close();assert.equal(h.link.send('done'),false);
});
test('the incoming payload limit is measured in UTF-8 bytes, not just JS characters',()=>{const h=transport('phone');h.channel.receive({type:'call',id:'grass',round:1,line:'界'.repeat(349),ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200});assert.equal(h.messages.length,0)});
test('ordinary failed payload validation does not advance outbound sequence numbers',()=>{const h=transport();assert.equal(h.link.send('nonsense'),false);assert.equal(h.link.send('ticket',{number:'B-223',counter:3}),true);assert.equal(h.channel.sent[0].seq,1)});

function generatedProtocol(linkSource=source('buergeramt-link.js')){
 let valid=0,rejected=0;
 const coverage={types:new Set(),nameLengths:new Set(),pongClocks:new Set(),pongDurations:new Set(),policeClocks:new Set()};
 for(let seed=1;seed<=32;seed++)for(const role of ['host','phone']){
  let random=seed;
  const integer=max=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return Math.floor(random/2**32*max)};
  const choose=items=>items[integer(items.length)];
  const receiver=transport(role,linkSource),sender=transport(role==='host'?'phone':'host',linkSource);
  for(let step=0;step<16;step++){
   const at=choose([0,1,1e12-12000,integer(1000000)]),duration=choose([0,1,12000,integer(12001)]);
   const receipt={index:choose([-1,0,1,2]),mode:choose(['voice','recording','fallback']),readyDelayMs:choose([0,60000,integer(60001)]),atMs:at};
   const name=choose(['Erika','界界','Name '+integer(1000),'x'.repeat(80)]);
   const line=choose(['Bitte antworten.','界'.repeat(90),'x'.repeat(349)]);
   const [type,data]=choose(role==='host'?[
    ['register',{id:'a'.repeat(24),name}],['sync-pong',{id:choose([1,2147483647,integer(2147483647)+1]),receivedAtMs:at,sentAtMs:at+duration}],
    ['police-start',receipt],['phone-hidden',{}]
   ]:[
    ['ticket',{counter:1+integer(4),number:'B-'+String(integer(1000)).padStart(3,'0')}],['police-line',{index:integer(3),line}],
    ['call',{id:'grass',round:1+integer(1000000),line,ringAtPhoneMs:choose([null,at]),ringAtUtcMs:choose([null,at]),leadMs:choose([600,4400,integer(3801)+600])}],['done',{}]
   ]);
   coverage.types.add(type);
   if(type==='register')coverage.nameLengths.add(data.name.length);
   if(type==='sync-pong'){coverage.pongClocks.add(data.receivedAtMs);coverage.pongDurations.add(data.sentAtMs-data.receivedAtMs)}
   if(type==='police-start')coverage.policeClocks.add(data.atMs);
   assert.equal(sender.link.send(type,data),true,`valid generator rejected: seed ${seed}, ${role}, step ${step}`);
   const message=sender.channel.sent.at(-1),count=receiver.messages.length;
   const missing={...message};const key=Object.keys(data)[0];if(key)delete missing[key];else missing.extra=1;
   const malformed=[{...message,session:'other'},{...message,v:2},{...message,seq:0},{...message,seq:step+.5},
    {...message,type:'unknown'},{v:3,session:message.session,seq:message.seq,type:role==='host'?'done':'phone-hidden'},missing];
   for(const invalid of malformed){
    // High malformed sequences must not block the following valid message.
    if(invalid.seq===message.seq)invalid.seq+=10000;
    receiver.channel.raw(JSON.stringify(invalid));
    assert.equal(receiver.messages.length,count,`malformed envelope reached a consumer: seed ${seed}, ${role}, step ${step}`);
    rejected++;
   }
   receiver.channel.raw(JSON.stringify({...message,seq:message.seq+10000,unexpected:true}));
   assert.equal(receiver.messages.length,count,'unexpected field consumed sequence');rejected++;
   receiver.channel.raw(JSON.stringify(message));
   assert.equal(receiver.messages.length,count+1,`valid sequence lost: seed ${seed}, ${role}, step ${step}`);
   assert.deepEqual(JSON.parse(JSON.stringify(receiver.messages.at(-1))),{...message,peer:'peer-1'},'accepted payload changed');valid++;
   receiver.channel.raw(JSON.stringify(message));
   assert.equal(receiver.messages.length,count+1,'replay reached a consumer');rejected++;
  }
 }
 return{valid,rejected,coverage};
}

test('seeded protocol sequences preserve payloads and reject malformed, foreign and replayed messages',()=>{
 const {valid,rejected,coverage}=generatedProtocol();assert.deepEqual({valid,rejected},{valid:1024,rejected:9216});
 assert.equal(coverage.types.size,8,'exercise every selected message family');
 for(const length of [2,80])assert(coverage.nameLengths.has(length),'missing name boundary '+length);
 for(const clock of [0,1,1e12-12000]){
  assert(coverage.pongClocks.has(clock),'missing pong clock boundary '+clock);
  assert(coverage.policeClocks.has(clock),'missing police clock boundary '+clock);
 }
 for(const duration of [0,1,12000])assert(coverage.pongDurations.has(duration),'missing pong duration boundary '+duration);
});
test('generated properties fail when replay or exact-payload guards are deliberately removed',()=>{
 const original=source('buergeramt-link.js');
 const replay=original.replace('||msg.seq<=lastSeq','');assert.notEqual(replay,original);
 assert.throws(()=>generatedProtocol(replay),/replay reached a consumer/);
 const fields=original.replace('if(keys.length!==fields.length||keys.some(key=>!fields.includes(key)))return false;','');assert.notEqual(fields,original);
 assert.throws(()=>generatedProtocol(fields),/malformed envelope reached a consumer|unexpected field consumed sequence/);
});

test('only the phone may hang up its exact current call',()=>{
 const host=transport(),phone=transport('phone');
 host.channel.receive({type:'hangup',id:'wrong',round:1});host.channel.receive({type:'hangup',id:'grass',round:1,extra:true});assert.equal(host.messages.length,0);
 host.channel.receive({type:'hangup',id:'grass',round:1});assert.equal(host.messages.length,1);
 phone.channel.receive({type:'hangup',id:'grass',round:1});assert.equal(phone.messages.length,0);
 assert.equal(phone.link.send('hangup',{id:'grass',round:1}),true);assert.equal(host.link.send('hangup',{id:'grass',round:1}),false);
});

test('counter and visibility metadata have one owner, and phone silence cannot authorize a reply',()=>{
 const host=transport(),phone=transport('phone');
 for(const type of ['counter-start','silence'])assert.equal(phone.link.send(type,type==='silence'?{id:'grass'}:{}),false);
 for(const type of ['phone-hidden','phone-visible'])assert.equal(host.link.send(type),false);
 assert.equal(host.link.send('counter-start'),true);
 assert.equal(phone.link.send('phone-visible'),true);
 host.channel.receive({type:'silence',id:'grass'});
 phone.channel.receive({type:'counter-start'});
 assert.equal(host.messages.length,0);
 assert.equal(phone.messages.length,1);
});

test('call round is required and bounded in both directions',()=>{
 const host=transport(),phone=transport('phone');
 const call={id:'grass',round:1,line:'Polizei.',ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200};
 for(const round of [undefined,0,1.5,1000001,'1']){
  for(const type of ['call-ready','call-scheduled','call-ringing','call-missed','answer','decline','hangup']){
   const fields=type==='call-ready'||type==='call-ringing'?{atMs:500}:type==='call-scheduled'?{atMs:500,mode:'peer',lateMs:0}:{};
   assert.equal(phone.link.send(type,{id:'grass',round,...fields}),false,type+' round '+round);
  }
  assert.equal(host.link.send('call-arm',{id:'grass',round}),false);
  assert.equal(host.link.send('call',{...call,round}),false);
 }
 for(const round of [1,1000000]){
  assert.equal(host.link.send('call-arm',{id:'grass',round}),true);
  assert.equal(host.link.send('call',{...call,round}),true);
  assert.equal(phone.link.send('call-ringing',{id:'grass',round,atMs:500}),true);
  assert.equal(phone.link.send('call-missed',{id:'grass',round}),true);
 }
});

test('fourth police line permits natural receipts but no cutoff',()=>{
 const host=transport(),phone=transport('phone');
 assert.equal(host.link.send('police-line',{index:3,line:'Letzte Warnung.'}),true);
 assert.equal(phone.link.send('police-start',{index:3,mode:'voice',readyDelayMs:0,atMs:20}),true);
 assert.equal(phone.link.send('police-done',{index:3,mode:'voice',durationMs:40,atMs:60}),true);
 assert.equal(host.link.send('police-cutoff',{index:3,stopAtPhoneMs:null,stopAtUtcMs:null}),false);
});

test('shared invitations keep peer sequences independent and send each ticket only to its owner',()=>{
 const h=transport(),second=new h.Channel();h.link.attach('peer-2',second);
 h.channel.receive({type:'register',id:'a'.repeat(24),name:'Erika Mustermann',seq:12});
 second.receive({type:'register',id:'a'.repeat(24),name:'Otto Mustermann'});
 second.receive({type:'register',id:'a'.repeat(24),name:'Duplicate'});
 assert.deepEqual(h.messages.map(m=>[m.peer,m.name]),[['peer-1','Erika Mustermann'],['peer-2','Otto Mustermann']]);
 assert.equal(h.link.peer,'peer-1');
 assert.equal(h.link.send('ticket',{number:'B-223',counter:3},'peer-2'),true);
 assert.equal(h.link.send('ticket',{number:'C-014',counter:1}),true);
 assert.equal(h.link.send('queue-call',{number:'B-223',counter:3},'peer-2'),true);
 assert.deepEqual(h.channel.sent.map(m=>[m.seq,m.number]),[[1,'C-014']]);
 assert.deepEqual(second.sent.map(m=>[m.seq,m.number]),[[1,'B-223'],[2,'B-223']]);
 assert.equal(h.link.send('ticket',{number:'Z-999',counter:4},'unknown'),false);
 assert.equal(h.link.selectPeer('peer-2'),true);assert.equal(h.link.channel,second);
 assert.equal(h.link.lastSeq,1);assert.equal(h.link.seq,2);
 assert.equal(h.link.send('counter-start'),true);assert.equal(second.sent.at(-1).seq,3);
 assert.equal(h.link.selectPeer('unknown'),false);assert.equal(h.link.peer,'peer-2');
});

test('peer identity comes from its channel and a spoof cannot consume its valid sequence',()=>{
 const h=transport(),second=new h.Channel();h.link.attach('peer-2',second);
 second.receive({type:'phone-hidden',peer:'peer-1',seq:100});
 assert.equal(h.messages.length,0);
 second.receive({type:'phone-visible',seq:1});
 assert.equal(h.messages.length,1);assert.equal(h.messages[0].peer,'peer-2');
});

test('closing one phone leaves other phones connected and global close tears down every channel',()=>{
 const h=transport(),second=new h.Channel(),third=new h.Channel(),connected=[],disconnected=[],statuses=[];
 h.link.addEventListener('connected',e=>connected.push(e.detail.peer));
 h.link.addEventListener('disconnected',e=>disconnected.push(e.detail.peer));
 h.link.addEventListener('status',e=>statuses.push(e.detail));
 h.link.attach('peer-2',second);h.link.attach('peer-3',third);
 h.link.attach('peer-2',second);assert.deepEqual(connected,['peer-2','peer-3']);
 h.channel.close();assert.deepEqual(disconnected,['peer-1']);assert.equal(h.link.peer,'peer-2');
 assert.equal(statuses.includes('Telefon getrennt'),false);
 second.receive({type:'phone-visible'});assert.equal(h.messages.at(-1).peer,'peer-2');
 h.link.close();assert.equal(second.readyState,'closed');assert.equal(third.readyState,'closed');
 assert.equal(h.link.peers.size,0);assert.equal(h.link.send('done',{},'peer-3'),false);
 second.readyState='open';second.receive({type:'phone-hidden',seq:2});
 assert.equal(h.messages.length,1);assert.deepEqual(disconnected,['peer-1']);
});

test('duplicate host channel-open notifications share one pending channel request',async()=>{
 const h=transport();let opens=0,resolve;
 h.link.sdk={openChannel:()=>{opens++;return new Promise(done=>{resolve=done})}};
 const opening=h.link.openHostChannel('peer-2');
 await h.link.openHostChannel('peer-2');assert.equal(opens,1);
 const second=new h.Channel();resolve(second);await opening;
 await h.link.openHostChannel('peer-2');assert.equal(opens,1);
 assert.equal(h.link.peers.get('peer-2').channel,second);
});

test('queue calls have host ownership and the same bounded code and counter as tickets',()=>{
 const host=transport(),phone=transport('phone'),payload={number:'A-001',counter:2};
 assert.equal(host.link.send('queue-call',payload),true);assert.equal(phone.link.send('queue-call',payload),false);
 for(const bad of [{...payload,number:'bad'},{...payload,counter:0},{...payload,counter:5},{...payload,peer:'spoof'}])phone.channel.receive({type:'queue-call',...bad});
 assert.equal(phone.messages.length,0);phone.channel.receive({type:'queue-call',...payload});assert.equal(phone.messages.length,1);
});

test('long queue codes remain bounded and survive ticket, receipt and queue-call delivery',()=>{
 const host=transport(),phone=transport('phone'),number='Z-123456789012',payload={number,counter:4},receipt={number,id:'a'.repeat(24)};
 assert.equal(host.link.send('ticket',payload),true);assert.equal(host.link.send('queue-call',payload),true);
 assert.equal(phone.link.send('ticket-received',receipt),true);
 phone.channel.receive({type:'ticket',...payload});phone.channel.receive({type:'queue-call',...payload,seq:2});host.channel.receive({type:'ticket-received',...receipt});
 assert.equal(phone.messages.length,2);assert.equal(host.messages.length,1);
 for(const invalid of ['Z-1234567890123','ZZZ-1000','z-1000','Z-','Z-1.5']){
  assert.equal(host.link.send('ticket',{...payload,number:invalid}),false);
  assert.equal(host.link.send('queue-call',{...payload,number:invalid}),false);
  assert.equal(phone.link.send('ticket-received',{...receipt,number:invalid}),false);
 }
});
