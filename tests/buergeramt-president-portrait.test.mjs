import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

function approach(h){h.moveTo(0,4.8);h.moveTo(3.4,4.8);h.moveTo(3.4,2.8);h.level.update(0)}

test('the portrait requires a nearby E and its inner monologue returns without a mission reward',()=>{
 const h=harness('host',{voice:true,cinematics:false}),lookups=[];
 h.window.GermanySimulatorAudioText.recordedClip=(voiceId,text)=>{lookups.push({voiceId,text});return null};
 h.key('KeyE');h.key('KeyE','keyup');assert.notEqual(h.level.stage,'portrait');
 approach(h);assert.equal(h.node('amt-nearby').textContent,'E · BUNDESPRÄSIDENT BETRACHTEN');
 assert.notEqual(h.level.stage,'portrait','approach alone is silent');
 h.key('KeyE');h.key('KeyE','keyup');assert.equal(h.level.stage,'portrait');
 assert.equal(h.node('amt-speaker').textContent,'ICH');
 h.key('KeyE');h.key('KeyE','keyup');assert.equal(lookups.length,1,'duplicate E cannot skip or stack speech');
 const seen=[];for(let i=0;i<1600&&h.level.stage==='portrait';i++){const line=h.node('amt-line').textContent;if(seen.at(-1)!==line)seen.push(line);h.elapse(.05)}
 assert.equal(h.level.stage,'walk-sign');
 const authored=Array.from(h.window.BuergeramtStory.presidentPortrait.lines,row=>row.line);
 assert.equal(seen.length,2);assert.equal(seen.join(" "),authored.join(" "));
 assert.deepEqual(lookups.map(row=>row.text),authored);
 assert(lookups.every(row=>row.voiceId==='spieler-hans-peter-mustermann'));
 assert.equal(h.synth.spoken.length,0,'missing player audio preserves internal captions');
 assert.equal(h.counts.form,0);assert.equal(h.level.registrationTicket,'');
 assert.equal(h.node('amt-actions').children.length,0);
});

test('a phone ticket receipt during the monologue resumes the current waiting state',()=>{
 const h=harness('host',{cinematics:false});approach(h);h.level.interact();
 const link=h.links[0];link.message({type:'scan',id:'a'.repeat(24)});link.message({type:'register',name:'Hans-Peter Mustermann'});
 link.message({type:'ticket-received',id:link.scanId,number:h.level.registrationTicket});
 assert.equal(h.level.stage,'portrait');
 for(let i=0;i<1600&&h.level.stage==='portrait';i++)h.elapse(.05);
 assert.equal(h.level.stage,'waiting');assert.equal(h.counts.form,0);
});

test('closing cancels the monologue and stale continuations cannot reopen it',()=>{
 const h=harness('host',{cinematics:false});approach(h);h.level.interact();h.node('amt-leave').click();h.elapse(70);
 assert.equal(h.level.stage,'closed');assert.equal(h.level.active,false);assert.equal(h.counts.form,0);
 h.level.open(h.config);assert.equal(h.level.view.pitch,0,'reopening resets the portrait gaze');
});

test('the projecting frame keeps player bodies separated at ordinary and delayed frame steps',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness('host',{cinematics:false});approach(h);h.key('KeyS');
  for(let i=0;i<180;i++){h.level.update(dt);assert(h.level.view.z+.22<=5.27+.001,'body cannot pass into the projecting gold frame')}
  h.key('KeyS','keyup');assert(h.level.view.z>4.96,'player can approach the wall mount');
 }
});

test('office English subtitles require opt-in and refresh during a portrait part',()=>{
 const h=harness('host',{cinematics:false});let enabled=false;
 h.config.subtitlesOn=()=>enabled;h.level.replay(h.config);approach(h);h.level.interact();
 const box=h.node('english-subtitle');assert.equal(box.hidden,true);
 enabled=true;h.level.refreshSubtitle();assert.equal(box.hidden,false);
 assert.equal(box.textContent,h.window.BuergeramtStory.presidentPortrait.lines[0].english);
 enabled=false;h.level.refreshSubtitle();assert.equal(box.hidden,true);assert.equal(box.textContent,'');
 enabled=true;h.elapse(5);h.level.refreshSubtitle();assert.equal(box.hidden,false);
 h.node('amt-leave').click();assert.equal(box.hidden,true);assert.equal(box.textContent,'');
});
