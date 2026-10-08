import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

const line='Wer die Finsternis sieht, hat sie selbst gewählt!';
const flushPromises=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function arrive(h){
 h.enterUntilOmen();
 for(let i=0;i<300&&h.level.omen.phase==='approach';i++)h.level.update(.05);
 assert.equal(h.level.omen.phase,'blackout');assert.equal(h.node('amt-line').textContent,line);
}
function speaking(options={}){
 const h=harness('host',{cinematics:true,voice:true,...options});arrive(h);h.tick(16);
 assert.ok(h.synth.current,'the browser received the exact utterance');
 return h;
}

test('the authored omen delivery reaches the actual browser utterance; clerk speech retains its defaults',()=>{
 const h=speaking(),delivery=h.window.BuergeramtStory.omen.delivery,utterance=h.synth.current;
 assert.equal(utterance.text,line);assert.equal(utterance.rate,delivery.rate);assert.equal(utterance.pitch,delivery.pitch);
 assert.equal(delivery.rate,.82);assert.equal(delivery.pitch,.72);
 assert.ok(delivery.contour.every(mark=>line.includes(mark.word)&&mark.tension>=0&&mark.tension<=1&&mark.semitones>=-6&&mark.semitones<=3));
 assert.equal(h.level.omen.speech.mode,'voice');assert.equal(h.level.omen.speech.rate,delivery.rate);assert.equal(h.level.omen.speech.pitch,delivery.pitch);
 const desk=harness('host',{voice:true});desk.counter();
 assert.equal(desk.synth.current.rate,.96);assert.equal(desk.synth.current.pitch,1);
});

test('arrival waits for an observed voice start before speech progress or ducking',()=>{
 const h=speaking({speechAutoStart:false,fakeAudio:true});
 assert.equal(h.level.omen.speech.mode,'waiting');assert.equal(h.level.omen.speech.startedAt,null);
 assert.equal(h.level.omen.speech.progress,0);
 const oscillators=h.audio.nodes.filter(node=>node.kind==='oscillator').slice(-4);
 const output=oscillators[0].connections[0].connections[0];
 const before=output.gain.events.at(-1);
 h.tick(900);h.level.update(0);
 assert.equal(h.level.omen.speech.mode,'waiting');assert.equal(h.level.omen.speech.progress,0);
 assert.equal(output.gain.events.at(-1)[1],before[1]);
 h.synth.start();assert.equal(h.level.omen.speech.mode,'voice');
 assert.equal(h.level.omen.speech.startedAt,h.now());
 assert.ok(output.gain.events.at(-1)[1]<before[1],'the score ducks under the observed voice');
});

test('slow and fast word receipts lead the score without an independent progress timer',()=>{
 const h=speaking();
 const first=line.indexOf('Finsternis'),last=line.indexOf('gewählt');
 h.tick(80);h.synth.boundary(first,.08);
 assert.equal(h.level.omen.speech.timing,'boundary');assert.equal(h.level.omen.speech.charIndex,first);
 assert.ok(Math.abs(h.level.omen.speech.progress-first/line.length)<1e-9);
 assert.equal(h.level.omen.speech.tension,.55);assert.equal(h.level.omen.speech.semitones,.5);
 const progress=h.level.omen.speech.progress;
 h.tick(5000);h.level.update(0);assert.equal(h.level.omen.speech.progress,progress);
 h.tick(30);h.synth.boundary(last,5.11);
 assert.ok(h.level.omen.speech.progress>progress);
 assert.equal(h.level.omen.speech.tension,1);assert.equal(h.level.omen.speech.semitones,-3.2);
 assert.equal(h.level.omen.phase,'blackout');
});

test('the first valid word boundary at index zero holds through later silence',()=>{
 const h=speaking();h.synth.boundary(0,0);
 assert.equal(h.level.omen.speech.timing,'boundary');
 assert.equal(h.level.omen.speech.charIndex,0);
 assert.equal(h.level.omen.speech.progress,0);
 h.tick(5000);h.level.update(0);
 assert.equal(h.level.omen.speech.progress,0);
 assert.equal(h.level.omen.phase,'blackout');
});

test('invalid, duplicate, and out-of-order word indices cannot rewind the music',()=>{
 const h=speaking(),first=line.indexOf('sieht');
 for(const index of [-1,1.5,line.length+1,Number.NaN])h.synth.boundary(index);
 assert.equal(h.level.omen.speech.charIndex,-1);
 h.synth.boundary(first);const state=h.level.omen.speech;
 for(const index of [first,first-1,-1,line.length+1,1.5])h.synth.boundary(index);
 assert.equal(h.level.omen.speech.charIndex,first);
 assert.equal(h.level.omen.speech.progress,state.progress);
 assert.equal(h.level.omen.speech.tension,state.tension);
});

test('pause freezes estimated timing and ducking; resume continues after the paused span',()=>{
 const h=speaking({fakeAudio:true});h.tick(1100);h.level.update(0);
 const before=h.level.omen.speech.progress;assert.ok(before>0);
 const oscillators=h.audio.nodes.filter(node=>node.kind==='oscillator').slice(-4);
 const output=oscillators[0].connections[0].connections[0];
 h.synth.pause();assert.equal(h.level.omen.speech.paused,true);
 const pausedGain=output.gain.events.at(-1)[1];
 h.synth.boundary(line.indexOf('selbst'));assert.equal(h.level.omen.speech.charIndex,-1);
 h.tick(1800);h.level.update(0);assert.equal(h.level.omen.speech.progress,before);
 assert.equal(output.gain.events.at(-1)[1],pausedGain);
 h.synth.resume();assert.equal(h.level.omen.speech.paused,false);
 h.tick(600);h.level.update(0);assert.ok(h.level.omen.speech.progress>before);
 assert.equal(h.level.omen.phase,'blackout');
});

test('a voice pause beyond the completion watchdog holds the blackout until resumed and ended',()=>{
 const h=speaking();h.tick(1000);h.level.update(0);
 const progress=h.level.omen.speech.progress,board=h.level.queueDisplay;
 h.synth.pause();assert.equal(h.level.omen.speech.paused,true);
 h.tick(25000);h.advanceGame(4);
 assert.equal(h.level.omen.phase,'blackout');
 assert.equal(h.level.omen.speech.mode,'voice');
 assert.equal(h.level.omen.speech.progress,progress);
 assert.equal(h.level.queueDisplay,board);
 h.synth.resume();h.tick(500);h.level.update(0);
 assert.ok(h.level.omen.speech.progress>progress);
 assert.equal(h.level.omen.phase,'blackout');
 h.synth.end();assert.equal(h.level.omen.phase,'glare');
});

test('a delayed voice start falls back to the visible line on a rate-scaled clock',()=>{
 const h=speaking({speechAutoStart:false});h.tick(1783);
 assert.equal(h.level.omen.speech.mode,'waiting');assert.equal(h.level.omen.speech.progress,0);
 h.tick(1);assert.equal(h.level.omen.speech.mode,'fallback');
 assert.equal(h.level.omen.speech.timing,'estimated');
 assert.equal(h.level.omen.speech.startedAt,h.now());
 assert.equal(h.node('amt-line').textContent,line);
 const stale=h.synth.spoken.at(-1);h.tick(1500);h.level.update(0);
 assert.ok(h.level.omen.speech.progress>0);assert.ok(h.level.omen.speech.progress<.92);
 stale.onstart?.();stale.onboundary?.({charIndex:line.indexOf('gewählt')});
 assert.equal(h.level.omen.speech.mode,'fallback');assert.equal(h.level.omen.speech.timing,'estimated');
 h.tick(3000);assert.equal(h.level.omen.phase,'glare');
});

test('voice failure switches to estimated timing without rewinding an observed word',()=>{
 const h=speaking(),at=line.indexOf('selbst');h.synth.boundary(at);
 const before=h.level.omen.speech.progress;h.synth.current.onerror();
 assert.equal(h.level.omen.speech.mode,'fallback');assert.equal(h.level.omen.speech.timing,'estimated');
 assert.ok(h.level.omen.speech.progress>=before);
 h.tick(700);h.level.update(0);assert.ok(h.level.omen.speech.progress>before);
});

test('estimated progress caps before the real end; onend starts the 0.7-second glare',()=>{
 const h=speaking();h.tick(5000);h.level.update(0);
 assert.equal(h.level.omen.phase,'blackout');assert.equal(h.level.omen.speech.progress,.92);
 h.synth.end();assert.equal(h.level.omen.speech.mode,'done');
 assert.equal(h.level.omen.speech.progress,1);assert.equal(h.level.omen.phase,'glare');
 h.advanceGame(.65);assert.equal(h.level.omen.phase,'glare');
 h.advanceGame(.1);assert.equal(h.level.omen.strength,0);
});

test('word contours reach both decoded stems while EFFEKTE mute remains authoritative',async()=>{
 const h=harness('host',{cinematics:true,voice:true,fakeAudio:true,officeFx:0});h.enterUntilOmen();await flushPromises();
 h.audio.resolveDecodes();await flushPromises();
 for(let i=0;i<300&&h.level.omen.phase==='approach';i++)h.level.update(.05);
 assert.equal(h.level.omen.phase,'blackout');h.tick(16);
 const stems=h.audio.nodes.filter(node=>node.kind==='buffer-source'&&node.loop&&node.started.length);
 assert.equal(stems.length,2);assert.equal(h.audio.contexts[0].gains[1].gain.value,0);
 const before=stems.map(node=>node.playbackRate.value);
 h.synth.boundary(line.indexOf('gewählt'));
 assert.ok(stems.every((node,index)=>node.playbackRate.value!==before[index]));
 assert.ok(stems.every(node=>Number.isFinite(node.playbackRate.value)&&node.playbackRate.value>0));
 assert.equal(h.audio.contexts[0].gains[1].gain.value,0);
});

test('old word, pause, resume and end callbacks cannot change a replayed encounter',()=>{
 const h=speaking(),old=h.synth.current;
 h.level.replay(h.config);arrive(h);h.tick(16);
 const fresh=h.level.omen.speech;
 assert.equal(fresh.mode,'voice');assert.equal(fresh.progress,0);
 old.onboundary?.({charIndex:line.indexOf('gewählt'),elapsedTime:3});
 old.onpause?.();old.onresume?.();old.onend?.();
 assert.equal(h.level.omen.phase,'blackout');
 assert.equal(h.level.omen.speech.progress,0);assert.equal(h.level.omen.speech.paused,false);
 assert.equal(h.level.omen.speech.mode,'voice');
});
