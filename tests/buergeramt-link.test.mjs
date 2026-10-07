import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {source} from './amt-harness.mjs';

function transport(role='host'){
 const window={};vm.runInNewContext(source('buergeramt-link.js'),{window,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams,console});
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
 const de=new URL(Link.phoneUrl(invitation)),en=new URL(Link.phoneUrl(invitation,true));assert.equal(new URLSearchParams(de.hash.slice(1)).has('captions'),false);assert.equal(new URLSearchParams(en.hash.slice(1)).get('captions'),'en');location.hash=en.hash;assert.deepEqual(JSON.parse(JSON.stringify(Link.fromHash())),invitation);
});
test('a bounded scan id reaches the host without form data',()=>{const h=transport();h.channel.receive({type:'scan',id:'a'.repeat(24)});assert.equal(h.messages.length,1);assert.equal(h.messages[0].id,'a'.repeat(24))});
test('only bounded police speech receipts reach the host',()=>{const h=transport();h.channel.receive({type:'police-done',index:-2,mode:'voice',durationMs:100,atMs:500});h.channel.receive({type:'police-start',index:-1,mode:'voice',readyDelayMs:25,atMs:400,seq:2});h.channel.receive({type:'police-done',index:-1,mode:'voice',durationMs:100,atMs:500,seq:3});assert.equal(h.messages.length,2);assert.equal(h.messages[1].index,-1)});
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
