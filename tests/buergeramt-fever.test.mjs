import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function clock(){const window={};vm.runInNewContext(source('buergeramt-fever.js'),{window});return window.BuergeramtFever}
function approachPatron(h){h.config.cinematics=false;h.enter();h.approachRegistration();h.config.cinematics=true;h.key('KeyE');h.tick(16)}

for(const recorded of [false,true])test(`a phone ticket during Konrad ${recorded?'recording':'browser speech'} waits for completion and returns to waiting`,()=>{
 let player;
 const h=harness('host',{cinematics:true,voice:true});
 if(recorded){
  vm.runInContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),h.context);
  h.context.Audio=class{
   constructor(src){this.src=src;this.duration=4.02;this.currentTime=0;this.paused=true;player=this}
   play(){this.paused=false;h.context.setTimeout(()=>this.onplaying?.(),16);return Promise.resolve()}
   pause(){this.paused=true;this.onpause?.()}removeAttribute(){this.src=''}load(){}
  };
 }
 approachPatron(h);
 const utterance=h.synth.current,cancellations=h.synth.cancelCount;
 assert.equal(h.level.fever.id,'amt-konrad-wohnungszettel');
 const line='Ich habe alle Unterlagen dabei. Hoffentlich reicht das.';
 assert.equal(h.node('amt-line').textContent,line);
 if(recorded){assert.equal(utterance,null);assert(player.src.includes('amt-konrad-wohnungszettel-fever-1.mp3'));player.currentTime=1.9;player.ontimeupdate()}
 else{assert.equal(utterance.text,line);h.synth.boundary(line.indexOf('Hoffentlich'))}
 h.links[0].message({type:'scan',id:'konrad-phone-scan'});
 assert.equal(h.links[0].sent.at(-1).type,'ticket');assert.equal(h.level.activated,true);
 assert.equal(h.level.stage,'character');assert.equal(h.synth.current,utterance);
 if(recorded){assert.equal(player.paused,false);assert(player.src.includes('amt-konrad-wohnungszettel-fever-1.mp3'))}
 assert.equal(h.synth.cancelCount,cancellations);assert.equal(h.level.audioTextBusy,true);
 h.advanceGame(8);assert.equal(h.level.stage,'character');assert.equal(h.level.fever.phase,'speaking');
 if(recorded){player.currentTime=player.duration;player.onended()}else h.synth.end();h.advanceGame(2.5);
 assert.equal(h.level.stage,'waiting');assert.equal(h.level.fever.active,false);
 assert.equal(h.level.activated,true);assert.equal(h.node('amt-ambient').textContent,'');
});
test('every distinct Bürgeramt identity owns a unique authored motif',()=>{
 const h=harness('host'),themes=h.window.BuergeramtFever.themes;
 const ids=[...Object.keys(h.window.BuergeramtStory.characters),...Object.keys(h.window.BuergeramtStory.patrons),'clerk'];
 assert.equal(ids.length,12);assert.deepEqual(Object.keys(themes).sort(),ids.sort());assert.equal(new Set(Object.values(themes).map(t=>t.motif)).size,12);
});
test('the courier approaches automatically once; other identities wait for E',()=>{
 const h=harness('host',{cinematics:true});h.enterUntilOmen();
 assert.equal(h.level.stage,'omen');assert.equal(h.level.omen.phase,'approach');assert.equal(h.node('amt-actions').children.length,0);
 h.advanceGame(12);h.elapse(35);assert.equal(h.level.stage,'walk-sign');
 h.moveTo(3.4,1.2);h.elapse(40);assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'');assert.equal(h.level.fever.active,false);
});
test('E starts the correct patron theme and returns automatically after the voice and smooth fade',()=>{
 const h=harness('host',{cinematics:true,voice:true,speechAutoStart:false});approachPatron(h);
 assert.equal(h.level.fever.id,'amt-konrad-wohnungszettel');assert.equal(h.level.fever.mode,'waiting');
 h.synth.start();h.advanceGame(1.2);assert.equal(h.level.fever.strength,1);
 h.synth.boundary(10);const progress=h.level.fever.progress;h.synth.boundary(5);assert.equal(h.level.fever.progress,progress);
 h.synth.pause();const time=h.level.fever.time;h.advanceGame(20);assert.equal(h.level.fever.time,time);
 h.synth.resume();h.advanceGame(.1);assert(h.level.fever.time>time);
 assert.equal(h.node('amt-actions').children.length,0);assert.equal(h.node('amt-walk-hud').classList.contains('sequence'),true);
 h.key('KeyE');assert.equal(h.level.stage,'character');const before=h.level.fever.strength;h.synth.end();assert.equal(h.level.fever.phase,'hold');
 h.advanceGame(.7);assert.equal(h.level.fever.phase,'release');assert.equal(h.level.stage,'character');
 h.advanceGame(.5);assert(h.level.fever.strength>0&&h.level.fever.strength<before);h.advanceGame(1.3);assert.equal(h.level.fever.active,false);
 assert.equal(h.level.stage,'walk-sign');assert.equal(h.node('amt-ambient').textContent,'');assert.equal(h.node('amt-walk-hud').classList.contains('sequence'),false);
});
test('replay and hidden-page calls cannot leak an old encounter or sound graph',()=>{
 const h=harness('host',{cinematics:true,voice:true,fakeAudio:true});approachPatron(h);h.synth.start();h.advanceGame(1.2);
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
 const h=harness('host',{cinematics:true,voice:true,fakeAudio:true});approachPatron(h);h.synth.start();h.advanceGame(1.2);
 h.synth.pause();h.tick(46000);h.audio.flushEnded();h.advanceGame(.05);
 const before=h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).length;
 h.advanceGame(3);assert.equal(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).length,before);
 h.synth.resume();h.advanceGame(.1);assert.equal(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).length,before+3);
 h.node('amt-exit').click();h.tick(100);h.audio.flushEnded();assert(h.audio.nodes.filter(n=>n.kind==='oscillator'&&n.started.length).slice(1).every(n=>n.ended));
});
