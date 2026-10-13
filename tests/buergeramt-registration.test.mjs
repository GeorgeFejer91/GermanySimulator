import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';
function settle(h){for(let i=0;i<1000&&!h.node('amt-actions').children.some(b=>!b.disabled);i++)h.tick(100);assert.ok(h.node('amt-actions').children.some(b=>!b.disabled),'dialogue must enable its next choices')}
function finish(h,option){h.links[0].message({type:'phone-hidden'});settle(h);let count=0;while(h.level.stage!=='success'){assert.equal(h.node('amt-actions').children.length,2);h.action(option);settle(h);assert.ok(++count<=60)}return count}
function arrived(h,round=h.level.registration.callRound){h.links[0].message({type:'call-ringing',id:'grass',round,atMs:h.now()});h.tick(Math.ceil(600/h.level.timeScale))}
test('every question is reachable with two choices and finite completion',()=>{
 const graph=harness().window.BuergeramtStory.registration,reachable=new Set(),queue=[graph.first];
 while(queue.length){const id=queue.pop();if(reachable.has(id))continue;reachable.add(id);const node=graph.nodes[id];assert.equal(node.choices.length,2);for(const choice of node.choices){assert.ok(choice.next==='complete'||graph.nodes[choice.next]);if(choice.next!=='complete')queue.push(choice.next)}}
 assert.equal(reachable.size,Object.keys(graph.nodes).length);
 const lengths=new Map();function length(id,visited=new Set()){if(id==='complete')return 0;assert(!visited.has(id),'no question loop');if(lengths.has(id))return lengths.get(id);const result=1+Math.max(...graph.nodes[id].choices.map(c=>length(c.next,new Set([...visited,id]))));lengths.set(id,result);return result}assert(length(graph.first)<=60);
});
test('ten correct answers earn ten points; foolish answers take over twice as long',()=>{
 const lengths=[];for(const option of [0,1]){const h=harness();let awarded=0,reward;h.config.onRegistration=value=>{awarded++;reward=value};h.counter();lengths.push(finish(h,option));assert.equal(awarded,1);assert.equal(reward.points,h.level.registration.points);assert.match(h.node('amt-status').textContent,/AKTENPUNKTE/);if(option===0){assert.equal(reward.points,10);assert.equal(reward.detours,0)}else{assert(reward.points<10);assert(reward.detours>0)}h.links[0].message({type:'phone-hidden'});assert.equal(h.level.stage,'success');settle(h);h.action();h.tick(90000);assert.equal(h.counts.form,1);assert.equal(awarded,1);assert.equal(h.links[0].sent.at(-1).type,'done')}assert.equal(lengths[0],10);assert(lengths[1]>lengths[0]*2);
});
test('sending and scheduling cannot annoy Knick; confirmed arrival does exactly once',()=>{
 const h=harness();h.counter();assert.equal(h.node('amt-line').textContent,h.window.BuergeramtStory.registration.nodes.presence.line);const link=h.links[0],round=h.level.registration.callRound;link.message({type:'call-scheduled',id:'grass',round,atMs:h.now()+2200,mode:'receipt',lateMs:0});h.tick(9000);assert.equal(h.level.registration.warnings,0);
 arrived(h);assert.equal(h.level.registration.warnings,1);assert.equal(h.node('amt-actions').children.length,0);arrived(h);assert.equal(h.level.registration.warnings,1);link.message({type:'silence',id:'grass'});assert.equal(h.level.registration.phoneSilent,false);link.message({type:'phone-hidden'});assert.equal(h.level.registration.phoneSilent,true);assert.equal(h.level.registration.silenceEvidence,'hidden');settle(h);assert.equal(h.level.registration.node,'presence');
});
test('missed and declined calls repeat and each new arrival increases annoyance',()=>{
 for(const outcome of ['decline','call-missed']){const h=harness();h.counter();const link=h.links[0];for(let n=1;n<=3;n++){arrived(h);assert.equal(h.level.registration.warnings,n);const oldRound=h.level.registration.callRound;link.message({type:outcome,id:'grass',round:oldRound});h.tick(Math.ceil(24000/h.level.timeScale)+1100);assert.equal(h.level.registration.callRound,oldRound+1);arrived(h,oldRound);assert.equal(h.level.registration.warnings,n)}arrived(h);assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.form,0)}
});
test('browser hide, disconnect and timeout permit silence only at the counter; wake revokes it',()=>{
 const waiting=harness();waiting.wait();waiting.links[0].message({type:'phone-hidden'});assert.equal(waiting.level.stage,'walk-sign');
 for(const loss of ['hidden','disconnected','heartbeat']){const h=harness();h.counter();const link=h.links[0];if(loss==='hidden')link.message({type:'phone-hidden'});else if(loss==='disconnected')link.emit('status','Telefon getrennt');else{link.emit('connected',{});h.tick(9001)}assert.equal(h.level.registration.phoneSilent,true,loss);assert.equal(h.level.stage,'reply');const round=h.level.registration.callRound;link.message({type:'phone-visible'});assert.equal(h.level.registration.phoneSilent,false);assert.equal(h.level.registration.callRound,round+1)}
});
test('live traffic prevents silence; retired links cannot satisfy a new appointment',()=>{
 const h=harness();h.counter();const old=h.links[0];old.emit('connected',{});for(let n=0;n<10;n++){h.tick(1400);old.message({type:'sync-pong',id:999,receivedAtMs:h.now(),sentAtMs:h.now()})}assert.equal(h.level.registration.phoneSilent,false);h.level.replay(h.config);old.message({type:'phone-hidden'});assert.equal(h.level.registration.phoneSilent,false);assert.equal(h.level.registration.points,0);
});

test('backgrounding the game cannot stand in for putting the companion away',()=>{
 const h=harness();h.counter();const link=h.links[0];link.emit('connected',{});h.hide();h.tick(30000);assert.equal(h.level.registration.phoneSilent,false);
 h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));h.tick(1500);assert.equal(h.level.registration.phoneSilent,false);
 link.message({type:'sync-pong',id:999,receivedAtMs:h.now(),sentAtMs:h.now()});h.tick(6000);assert.equal(h.level.registration.phoneSilent,false);
});

test('a reachable phone withholds the spoken approval and final point until real away evidence',()=>{
 const h=harness();h.counter();settle(h);while(h.level.registration.node!=='final'){h.action(0);settle(h)}
 h.action(0);h.tick(10000);assert.equal(h.level.stage,'phone-warning');assert.equal(h.level.registration.completed,false);assert.equal(h.level.registration.points,9);assert.doesNotMatch(h.node('amt-line').textContent,/ANGEMELDET/);
 h.links[0].message({type:'phone-hidden'});settle(h);assert.equal(h.level.stage,'success');assert.equal(h.level.registration.points,10);
});
test('the player speaks before Knick and points commit once after her answer',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'phone-hidden'});h.tick(16);h.synth.end();h.tick(16);const choice=h.node('amt-actions').children[0].textContent;assert(h.node('amt-actions').children[0].disabled);h.synth.end();h.action();h.tick(16);assert.equal(h.node('amt-speaker').textContent,'ICH');assert.equal(h.synth.current.text,choice);assert.equal(h.level.registration.points,0);h.synth.end();h.tick(16);assert.match(h.node('amt-speaker').textContent,/KNICK/);h.synth.end();assert.equal(h.level.registration.points,1);assert.equal(h.level.registration.node,'identity');
});
test('all four allocated counters use metadata at the public side of the desk',()=>{
 const seen=new Set();for(let phase=0;phase<4;phase++){const h=harness();h.enter();h.advanceGame(phase*3.2);h.counter();const n=h.level.assignedCounter.number;seen.add(n);assert.ok(h.level.view.z>=-8.32);assert.equal(h.level.queueCalls[n-1].number,h.level.registrationTicket);assert(h.links[0].sent.some(m=>m.type==='counter-start'));h.links[0].message({type:'phone-hidden'});assert.equal(h.level.stage,'reply')}assert.equal(seen.size,4);
});
