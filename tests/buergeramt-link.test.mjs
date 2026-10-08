import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {source} from './amt-harness.mjs';

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
test('only valid phone registration reaches the host',()=>{const h=transport();h.channel.receive({type:'register',name:'Erika Mustermann'});assert.equal(h.messages.length,1);assert.equal(h.messages[0].name,'Erika Mustermann')});
test('the QR invitation can carry the host subtitle preference without changing pairing credentials',()=>{
 const window={},location={href:'https://example.test/index.html',hash:''};vm.runInNewContext(source('buergeramt-link.js'),{window,location,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams});
 const invitation={room:'amt-test',secret:'a'.repeat(32),stream:'amt-ticket-test'},Link=window.BuergeramtLink;
 const de=new URL(Link.phoneUrl(invitation)),en=new URL(Link.phoneUrl(invitation,true));assert.equal(new URLSearchParams(de.hash.slice(1)).has('captions'),false);assert.equal(new URLSearchParams(en.hash.slice(1)).get('captions'),'en');assert.equal(de.searchParams.has('voicePreview'),false);location.href='https://example.test/index.html?voicePreview=1';const audition=new URL(Link.phoneUrl(invitation));assert.equal(audition.searchParams.get('voicePreview'),'1');assert.equal(new URLSearchParams(audition.hash.slice(1)).get('secret'),invitation.secret);location.hash=en.hash;assert.deepEqual(JSON.parse(JSON.stringify(Link.fromHash())),invitation);
});
test('a bounded scan id reaches the host without form data',()=>{const h=transport();h.channel.receive({type:'scan',id:'a'.repeat(24)});assert.equal(h.messages.length,1);assert.equal(h.messages[0].id,'a'.repeat(24))});
test('only bounded police speech receipts reach the host',()=>{const h=transport();h.channel.receive({type:'police-done',index:-2,mode:'voice',durationMs:100,atMs:500});h.channel.receive({type:'police-start',index:-1,mode:'voice',readyDelayMs:25,atMs:400,seq:2});h.channel.receive({type:'police-done',index:-1,mode:'voice',durationMs:100,atMs:500,seq:3});assert.equal(h.messages.length,2);assert.equal(h.messages[1].index,-1)});
test('recorded audition mode uses the existing bounded police receipt contract',()=>{const h=transport();h.channel.receive({type:'police-start',index:-1,mode:'recording',readyDelayMs:25,atMs:400});h.channel.receive({type:'police-done',index:-1,mode:'recording',durationMs:900,atMs:1300,seq:2});assert.equal(h.messages.length,2);assert.equal(h.messages[1].mode,'recording')});
test('timing handshake rejects invalid IDs, modes and durations',()=>{const host=transport(),phone=transport('phone');for(const bad of [{type:'sync-pong',id:0,receivedAtMs:1,sentAtMs:1},{type:'sync-pong',id:1.5,receivedAtMs:1,sentAtMs:1},{type:'sync-pong',id:1,receivedAtMs:12,sentAtMs:11},{type:'sync-pong',id:1,receivedAtMs:0,sentAtMs:12001},{type:'police-start',index:3,mode:'voice',readyDelayMs:0,atMs:1},{type:'police-start',index:0,mode:'bogus',readyDelayMs:0,atMs:1},{type:'police-start',index:0,mode:'voice',readyDelayMs:-1,atMs:1},{type:'police-done',index:0,mode:'voice',durationMs:-1,atMs:1},{type:'police-done',index:0,mode:'voice',durationMs:60001,atMs:1}])host.channel.receive(bad);assert.equal(host.messages.length,0);host.channel.receive({type:'sync-pong',id:7,receivedAtMs:50,sentAtMs:55});assert.equal(host.messages.length,1);phone.channel.receive({type:'sync-ping',id:7});assert.equal(phone.messages.length,1);assert.equal(phone.link.send('sync-pong',{id:7,receivedAtMs:50,sentAtMs:55}),true);assert.equal(host.link.send('sync-ping',{id:7}),true)});
test('call targets and scheduling receipts reject malformed clock modes and lead times',()=>{
 const host=transport(),phone=transport('phone');
 for(const bad of [{type:'call-ready',id:'grass',atMs:-1},{type:'call-scheduled',id:'grass',atMs:10,mode:'unknown',lateMs:0},{type:'call-scheduled',id:'grass',atMs:10,mode:'peer',lateMs:-1}])host.channel.receive(bad);
 for(const bad of [{type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:10,ringAtUtcMs:null,leadMs:50},{type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:-1,ringAtUtcMs:null,leadMs:2200},{type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:null,ringAtUtcMs:'tomorrow',leadMs:2200}])phone.channel.receive(bad);
 assert.equal(host.messages.length,0);assert.equal(phone.messages.length,0);
 host.channel.receive({type:'call-scheduled',id:'grass',atMs:2200,mode:'peer',lateMs:0});phone.channel.receive({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:2200,ringAtUtcMs:null,leadMs:2200});assert.equal(host.messages.length,1);assert.equal(phone.messages.length,1);
});
test('unrecognized types cannot consume the valid sequence',()=>{const h=transport();h.channel.receive({seq:100,type:'unknown'});h.channel.receive({seq:2,type:'register',name:'Erika Mustermann'});assert.equal(h.messages.length,1);assert.equal(h.messages[0].seq,2)});
test('wrong-direction messages cannot consume the sequence',()=>{const h=transport();h.channel.receive({seq:100,type:'done'});h.channel.receive({seq:2,type:'phone-hidden'});assert.equal(h.messages.length,1);assert.equal(h.messages[0].type,'phone-hidden')});
test('session, version and sequence checks reject replay or invalid envelopes',()=>{
 const h=transport();for(const bad of [{session:'other'},{v:1},{v:2},{seq:0},{seq:-1},{seq:1.5},{seq:Number.MAX_SAFE_INTEGER+1}])h.channel.receive({type:'phone-hidden',...bad});
 assert.equal(h.messages.length,0);h.channel.receive({type:'phone-hidden'});h.channel.receive({type:'phone-hidden'});assert.equal(h.messages.length,1);
});
test('malformed JSON and non-string data are ignored',()=>{const h=transport();for(const data of ['{','null','[]','42',new Uint8Array(4)])h.channel.raw(data);assert.equal(h.messages.length,0)});
test('payloads reject missing or extra fields, controls and excessive lengths',()=>{
 const h=transport();for(const bad of [{type:'register'},{type:'register',name:' '},{type:'register',name:'X'},{type:'register',name:'x'.repeat(81)},{type:'register',name:'Good\u0000Name'},{type:'register',name:'Erika Mustermann',admin:true},{type:'phone-hidden',extra:1},{type:'answer',id:'wrong'}])h.channel.receive(bad);assert.equal(h.messages.length,0);
});
test('phone accepts tickets, calls and bounded police lines only from the host',()=>{
 const h=transport('phone');h.channel.receive({type:'ticket',number:'B-223'});h.channel.receive({seq:2,type:'call-arm',id:'grass'});h.channel.receive({seq:3,type:'call',id:'grass',line:'Polizei.',ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200});h.channel.receive({seq:4,type:'police-line',index:0,line:'Bitte antworten.'});assert.equal(h.messages.length,4);
 for(const bad of [{type:'register',name:'Erika Mustermann'},{type:'ticket',number:'Z-223'},{type:'police-line',index:-1,line:'Nein'},{type:'police-line',index:3,line:'Nein'},{type:'police-line',index:1,line:' '},{type:'call',id:'grass',line:'x'.repeat(350),ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200}])h.channel.receive({seq:100,...bad});assert.equal(h.messages.length,4);
});
test('a refreshed channel may restart sequence numbers, but the old channel stays inert',()=>{
 const h=transport();h.channel.receive({seq:20,type:'phone-hidden'});h.channel.close();const next=new h.Channel();h.link.attach('peer-2',next);next.receive({type:'register',name:'New Name'});h.channel.raw(JSON.stringify({v:3,session:'amt-ticket-unit-test',seq:999,type:'register',name:'Old Name'}));assert.equal(h.messages.length,2);assert.equal(h.messages[1].name,'New Name');
});
test('messages arriving after close never reach consumers',()=>{const h=transport();h.link.close();h.channel.readyState='open';h.channel.receive({type:'phone-hidden'});assert.equal(h.messages.length,0)});
test('closed links never attach a new channel',()=>{const h=transport();h.link.close();const next=new h.Channel();h.link.attach('peer-2',next);assert.equal(h.link.channel,null)});
test('payloads cannot override the outbound envelope',()=>{
 const h=transport();for(const payload of [{number:'B-223',type:'done'},{number:'B-223',seq:999},{number:'B-223',session:'other'},{number:'B-223',v:0}])assert.equal(h.link.send('ticket',payload),false);assert.equal(h.channel.sent.length,0);
});
test('outbound roles, fields and bounded values are validated',()=>{
 const h=transport();assert.equal(h.link.send('answer',{id:'grass'}),false);assert.equal(h.link.send('activated',{unexpected:true}),false);assert.equal(h.link.send('police-line',{index:9,line:'Nein'}),false);assert.equal(h.link.send('ticket',{number:'B-223'}),true);assert.equal(h.channel.sent[0].type,'ticket');assert.equal(h.channel.sent[0].seq,1);
});
test('channel send races are returned as failure rather than uncaught exceptions',()=>{const h=transport();h.channel.fail=true;assert.doesNotThrow(()=>assert.equal(h.link.send('activated'),false))});
test('congested, closed and oversized sends fail without publishing',()=>{
 const h=transport();h.channel.bufferedAmount=65537;assert.equal(h.link.send('activated'),false);h.channel.bufferedAmount=0;assert.equal(h.link.send('call',{id:'grass',line:'界'.repeat(349),ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200}),false);assert.equal(h.channel.sent.length,0);h.link.close();assert.equal(h.link.send('done'),false);
});
test('the incoming payload limit is measured in UTF-8 bytes, not just JS characters',()=>{const h=transport('phone');h.channel.receive({type:'call',id:'grass',line:'界'.repeat(349),ringAtPhoneMs:500,ringAtUtcMs:null,leadMs:2200});assert.equal(h.messages.length,0)});
test('ordinary failed payload validation does not advance outbound sequence numbers',()=>{const h=transport();assert.equal(h.link.send('nonsense'),false);assert.equal(h.link.send('ticket',{number:'B-223'}),true);assert.equal(h.channel.sent[0].seq,1)});

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
    ['register',{name}],['sync-pong',{id:choose([1,2147483647,integer(2147483647)+1]),receivedAtMs:at,sentAtMs:at+duration}],
    ['police-start',receipt],['phone-hidden',{}]
   ]:[
    ['ticket',{number:'B-'+String(integer(1000)).padStart(3,'0')}],['police-line',{index:integer(3),line}],
    ['call',{id:'grass',line,ringAtPhoneMs:choose([null,at]),ringAtUtcMs:choose([null,at]),leadMs:choose([600,5000,integer(4401)+600])}],['done',{}]
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
   assert.deepEqual(JSON.parse(JSON.stringify(receiver.messages.at(-1))),message,'accepted payload changed');valid++;
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
