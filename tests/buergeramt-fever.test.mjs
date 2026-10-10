import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function clock(){const window={};vm.runInNewContext(source('buergeramt-fever.js'),{window});return window.BuergeramtFever}
test('every distinct Bürgeramt identity owns a unique authored motif',()=>{
 const h=harness('host'),themes=h.window.BuergeramtFever.themes;
 const ids=[...Object.keys(h.window.BuergeramtStory.characters),...Object.keys(h.window.BuergeramtStory.patrons),'clerk'];
 assert.equal(ids.length,12);assert.deepEqual(Object.keys(themes).sort(),ids.sort());assert.equal(new Set(Object.values(themes).map(t=>t.motif)).size,12);
});
test('walking and waiting never start an unrequested hallucination',()=>{
 const h=harness('host',{cinematics:true});h.enter();h.advanceGame(40);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');assert.equal(h.level.fever.active,false);
 h.level.replay(h.config);h.enterUntilOmen();assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'approach');
});
test('E starts the correct patron theme, speech receipts own progress, return releases smoothly',()=>{
 const h=harness('host',{cinematics:true,voice:true,speechAutoStart:false});h.enter();h.approachRegistration();h.key('KeyE');h.tick(16);
 assert.equal(h.level.fever.id,'amt-konrad-wohnungszettel');assert.equal(h.level.fever.mode,'waiting');
 h.synth.start();h.advanceGame(1.2);assert.equal(h.level.fever.strength,1);
 h.synth.boundary(10);const progress=h.level.fever.progress;h.synth.boundary(5);assert.equal(h.level.fever.progress,progress);
 h.synth.pause();const time=h.level.fever.time;h.advanceGame(20);assert.equal(h.level.fever.time,time);
 h.synth.resume();h.advanceGame(.1);assert(h.level.fever.time>time);
 const before=h.level.fever.strength;h.action();assert.equal(h.level.fever.phase,'release');assert.equal(h.level.fever.strength,before);
 h.advanceGame(.5);assert(h.level.fever.strength>0&&h.level.fever.strength<before);h.advanceGame(1.1);assert.equal(h.level.fever.active,false);
});
test('replay and hidden-page calls cannot leak an old encounter or sound graph',()=>{
 const h=harness('host',{cinematics:true,voice:true,fakeAudio:true});h.enter();h.approachRegistration();h.key('KeyE');h.tick(16);h.synth.start();h.advanceGame(1.2);
 const old=h.synth.current,time=h.level.fever.time;h.hide();h.advanceGame(5);assert.equal(h.level.fever.time,time);
 h.document.hidden=false;h.level.replay(h.config);old.onend?.();old.onboundary?.({charIndex:20});old.onresume?.();
 assert.equal(h.level.fever.active,false);assert.equal(h.level.stage,'outside');
 const started=h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length);assert(started.length>=4);assert(started.slice(1).every(n=>n.stopped.length),'all encounter nodes have bounded stops; room hum belongs to its closed context');
});
test('continuous envelope is monotonic at entry and exit without boundary or fallback jumps',()=>{
 const c=clock().create();c.begin({id:'pfandarchitektin',text:'Ein langer Satz.',cue:1,generation:1});c.start('voice',{durationMs:9000});
 let previous=0;for(let i=0;i<72;i++){c.advance(1/60);assert(c.inspect().strength>=previous);assert(c.inspect().strength-previous<.022);previous=c.inspect().strength}
 c.boundary(6);const progress=c.inspect().progress;c.fallback();c.advance(.1);assert(c.inspect().progress>=progress);c.done();
 for(let i=0;i<40;i++)c.advance(1/60);previous=c.inspect().strength;
 for(let i=0;i<91;i++){c.advance(1/60);assert(c.inspect().strength<=previous+1e-8);assert(previous-c.inspect().strength<.019);previous=c.inspect().strength}
 assert.equal(c.inspect().active,false);
});

test('a long paused encounter rebuilds its bounded sound bed only on visible resume',()=>{
 const h=harness('host',{cinematics:true,voice:true,fakeAudio:true});h.enter();h.approachRegistration();h.key('KeyE');h.tick(16);h.synth.start();h.advanceGame(1.2);
 h.synth.pause();h.tick(46000);h.audio.flushEnded();h.advanceGame(.05);
 const before=h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).length;
 h.advanceGame(3);assert.equal(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).length,before);
 h.synth.resume();h.advanceGame(.1);assert.equal(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).length,before+3);
 h.node('amt-exit').click();h.tick(100);h.audio.flushEnded();assert(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).slice(1).every(n=>n.ended));
});
