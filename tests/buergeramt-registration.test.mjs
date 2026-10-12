import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

function settle(h){for(let i=0;i<600&&!h.node('amt-actions').children.some(b=>!b.disabled);i++)h.tick(100);assert.ok(h.node('amt-actions').children.some(b=>!b.disabled),'dialogue must enable its next choices')}
function finish(h,option){h.links[0].message({type:'silence',id:'grass'});settle(h);let count=0;while(h.level.stage!=='success'){assert.equal(h.node('amt-actions').children.length,2);h.action(option);settle(h);assert.ok(++count<=60)}return count}

test('registration renders a single caption when speech starts',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'silence',id:'grass'});h.tick(16);h.synth.end();h.tick(16);
 assert(h.node('amt-line').textContent.length>0);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK · '+h.node('amt-line').textContent);
});

test('every registration node has two choices and an eventual completion route',()=>{
 const graph=harness().window.BuergeramtStory.registration,reachable=new Set(),queue=[graph.first],canComplete=new Set();
 while(queue.length){const id=queue.pop();if(reachable.has(id))continue;reachable.add(id);const node=graph.nodes[id];assert.equal(node.choices.length,2);for(const choice of node.choices){assert.ok(choice.next==='complete'||graph.nodes[choice.next]);if(choice.next!=='complete')queue.push(choice.next)}}
 assert.equal(reachable.size,Object.keys(graph.nodes).length);
 let changed=true;while(changed){changed=false;for(const[id,node]of Object.entries(graph.nodes))if(!canComplete.has(id)&&node.choices.some(c=>c.next==='complete'||canComplete.has(c.next))){canComplete.add(id);changed=true}}
 assert.equal(canComplete.size,reachable.size);
});
test('both answer policies finish, award once, and retain the A38 handoff',()=>{
 for(const option of [0,1]){const h=harness();let awarded=0;h.config.onRegistration=()=>awarded++;h.counter();const questions=finish(h,option);assert.ok(questions>=24);assert.equal(awarded,1);assert.match(h.node('amt-line').textContent,/ANMELDUNG ABGESCHLOSSEN/);h.links[0].message({type:'phone-hidden'});assert.equal(h.level.stage,'success');settle(h);h.action();h.tick(90000);assert.equal(h.counts.form,1);assert.equal(awarded,1);assert.equal(h.links[0].sent.at(-1).type,'done')}
});
test('ignoring a ringing phone provokes rapid warnings and a recoverable cancellation',()=>{
 const h=harness();h.counter();h.tick(5400);assert.equal(h.level.stage,'phone-warning');assert.equal(h.level.registration.warnings,1);assert.match(h.node('amt-line').textContent,/lautlos|LAUTLOS/);h.tick(18000);assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.form,0);assert.equal(h.node('amt-actions').children.length,0);const fresh=h.links.at(-1);fresh.message({type:'scan',id:'b'.repeat(24)});assert.equal(h.level.stage,'walk-sign');fresh.message({type:'register',name:'Erika Mustermann'});assert.equal(h.level.stage,'waiting');assert.equal(h.level.registration.warnings,0);
});
test('putting away the call re-arms it within 30 seconds and interrupts the preserved question',()=>{
 const h=harness();h.counter();h.links[0].message({type:'decline',id:'grass'});assert.equal(h.level.registration.warnings,1);settle(h);h.action(1);const question=h.window.BuergeramtStory.registration.nodes.presence.line;h.tick(27200);assert.equal(h.links[0].sent.filter(m=>m.type==='call').length,2);h.tick(3300);assert.equal(h.level.stage,'phone-warning');assert.equal(h.level.registration.warnings,2);settle(h);h.action();settle(h);assert.equal(h.node('amt-line').textContent,question);h.tick(90000);assert.equal(h.level.registration.warnings,2);assert.equal(h.level.registration.phoneSilent,true);
});
test('a selected player reply speaks before Knick and advances without another button',()=>{
 const h=harness('host',{voice:true});h.counter();h.links[0].message({type:'silence',id:'grass'});h.tick(16);h.synth.end();h.tick(16);
 const choice=h.node('amt-actions').children[0].textContent;assert(h.node('amt-actions').children[0].disabled,'listen to Knick before answering');h.synth.end();h.action();h.tick(16);
 assert.equal(h.node('amt-speaker').textContent,'ICH');assert.equal(h.synth.current.text,choice);assert.equal(h.node('amt-actions').children.length,0);
 h.synth.end();h.tick(16);assert.match(h.node('amt-speaker').textContent,/KNICK/);assert.equal(h.node('amt-actions').children.length,0);
 h.synth.end();assert.equal(h.node('amt-actions').children.length,2);assert.equal(h.level.registration.node,'identity');
});

test('every Schalter is allocated naturally and reachable on the public side of the desk',()=>{
 const seen=new Set();for(let phase=0;phase<4;phase++){const h=harness();h.enter();h.advanceGame(phase*3.2);h.counter();const n=h.level.assignedCounter.number;seen.add(n);assert.ok(h.level.view.z>=-8.32);assert.match(h.node('amt-counter-call').textContent,new RegExp('SCHALTER '+n));h.links[0].message({type:'silence',id:'grass'});assert.equal(h.level.stage,'reply')}assert.equal(seen.size,4);
});
test('the companion can accept repeat calls, and Lautlos stops ring and vibration for the slot',()=>{
 const h=harness('phone',{fakeAudio:true}),link=h.incoming();h.node('phone-decline').click();link.message({type:'call-arm',id:'grass'});link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:h.now(),ringAtUtcMs:null,leadMs:2200});assert.equal(h.node('phone-call').hidden,false);link.message({type:'silence',id:'grass'});assert.equal(h.node('phone-call').hidden,true);const vibrations=h.vibrations.length;h.tick(30000);assert.equal(h.vibrations.length,vibrations);link.message({type:'call-arm',id:'grass'});link.message({type:'call',id:'grass',line:'Anruf.',ringAtPhoneMs:h.now(),ringAtUtcMs:null,leadMs:2200});assert.equal(h.node('phone-call').hidden,true);assert.equal(link.sent.filter(m=>m.type==='silence').length,0,'phone has no silence action');
});
test('exit and replay invalidate the old repeat-call and warning timers',()=>{
 const h=harness();h.counter();const old=h.links[0];old.message({type:'decline',id:'grass'});h.level.replay(h.config);h.tick(60000);assert.equal(old.sent.filter(m=>m.type==='call').length,1);assert.equal(h.level.stage,'outside');assert.equal(h.level.registration.phoneSilent,false);
});
