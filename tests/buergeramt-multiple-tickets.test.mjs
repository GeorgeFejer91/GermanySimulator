import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

function phones(count=3){
 const h=harness('host',{fakeAudio:true,random:()=>0}),link=h.links[0],deliveries=[];
 link.peers=new Map();const send=link.send.bind(link);link.send=(type,data={},peer='')=>{deliveries.push({type,...data,peer});return send(type,data)};link.selectPeer=peer=>{link.peer=peer;return true};
 for(let i=0;i<count;i++){const peer='phone-'+i,id=i.toString(16).padStart(24,'0');link.peers.set(peer,{channel:link.channel});link.message({type:'scan',peer,id});link.message({type:'register',peer,id,name:'Person '+i});const ticket=deliveries.at(-1);link.message({type:'ticket-received',peer,id,number:ticket.number})}
 return{...h,link,deliveries};
}
function scene(h,seconds){const start=h.level.floorState.visualTime;for(let i=0;i<4000&&h.level.floorState.visualTime-start<seconds-1e-8;i++)h.level.update(.05);assert.ok(h.level.floorState.visualTime-start>=seconds-1e-8)}

test('every browser owns a unique reservation and receipt even with the same scan ID',()=>{
 const h=phones(80),tickets=h.level.tickets;assert.equal(tickets.length,80);assert.equal(new Set(tickets.map(t=>t.number)).size,80);assert.equal(new Set(tickets.map(t=>t.index)).size,80);assert(tickets.every(t=>t.received));
 const first=tickets[0];h.link.message({type:'scan',peer:'extra',id:first.scanId});h.link.message({type:'register',peer:'extra',id:first.scanId,name:'Extra Person'});const extra=h.level.tickets.find(t=>t.peer==='extra');assert.notEqual(extra.number,first.number);
 h.link.message({type:'ticket-received',peer:'extra',id:first.scanId,number:first.number});assert.equal(h.level.tickets.find(t=>t.peer==='extra').received,false);assert.equal(h.level.registrationTicket,first.number);
});

test('two prior calls precede admission and its board row stays valid for thirty seconds',()=>{
 const h=phones(1),ticket=h.level.tickets[0];scene(h,6.4);assert.equal(h.level.tickets[0].called,false);scene(h,3.2);assert.equal(h.level.tickets[0].called,true);assert.equal(h.level.queueCalls[ticket.counter-1].number,ticket.number);
 scene(h,27);assert.equal(h.level.queueCalls[ticket.counter-1].number,ticket.number);assert(h.level.tickets[0].deadline>2.8);h.link.message({type:'ticket-received',peer:ticket.peer,id:ticket.scanId,number:ticket.number});scene(h,3.1);assert.equal(h.level.tickets.length,0);assert.equal(h.level.activated,false);assert.equal(h.links.length,1);
});

test('any received called ticket can own the main counter interaction',()=>{
 for(let chosen=0;chosen<3;chosen++){
  const h=phones();scene(h,16);const ticket=h.level.tickets[chosen];assert(ticket.called);h.level.interact({desk:ticket.counter});assert.equal(h.level.stage,'counter');assert.equal(h.level.registrationTicket,ticket.number);assert.equal(h.link.peer,ticket.peer);assert(h.deliveries.some(m=>m.type==='queue-call'&&m.peer===ticket.peer&&m.number===ticket.number));
 }
});

test('one phone leaving retires only its ticket and keeps the shared invitation',()=>{
 const h=phones(),tickets=h.level.tickets,url=h.level.phoneUrl;h.link.message({type:'phone-hidden',peer:tickets[1].peer});assert.equal(h.level.tickets.length,2);
 h.link.emit('disconnected',{peer:tickets[2].peer});assert.equal(h.level.tickets.length,1);assert.equal(h.level.registrationTicket,tickets[0].number);assert.equal(h.level.phoneUrl,url);assert(h.deliveries.some(m=>m.type==='forfeit'&&m.peer===tickets[1].peer));
});

test('occupied counters emit no beeps until a new code can actually be processed',()=>{
 const h=phones(4);scene(h,19.2);assert(h.level.tickets.every(t=>t.called));const before=h.level.queueCalls.map(t=>t.number),beeps=h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.type==='square').length;
 scene(h,3.2);assert.deepEqual(h.level.queueCalls.map(t=>t.number),before);assert.equal(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.type==='square').length,beeps);
});

test('a replacement browser on the same URL restarts the selected phone monitor',()=>{
 const h=phones(1),url=h.level.phoneUrl,first=h.level.tickets[0];h.link.message({type:'phone-hidden',peer:first.peer});
 h.link.peers.set('replacement',{channel:h.link.channel});h.link.emit('connected',{peer:'replacement'});const id='f'.repeat(24);h.link.message({type:'scan',peer:'replacement',id});h.link.message({type:'register',peer:'replacement',id,name:'Replacement Person'});const ticket=h.level.tickets[0];h.link.message({type:'ticket-received',peer:'replacement',id,number:ticket.number});
 const count=h.deliveries.filter(m=>m.type==='sync-ping').length;h.tick(1501);assert(h.deliveries.filter(m=>m.type==='sync-ping').length>count);assert.equal(h.link.peer,'replacement');assert.equal(h.level.phoneUrl,url);
});
