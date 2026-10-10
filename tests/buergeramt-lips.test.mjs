import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';
await import('../buergeramt-lips.js');
const {createTrack,score,poseAt,mouths}=globalThis.GermanyAmtLips;

test('German lip shapes close consonants and blend continuously at every boundary',()=>{
 const keys=score('Mama, fünf schöne Euro!');
 assert.equal(poseAt(keys,.5)[0],0);
 assert(poseAt(keys,1.5)[0]>.9);
 assert(poseAt(keys,6.5)[3]>.9,'f contacts the lower lip');
 for(let i=1;i<23;i++){
  const a=poseAt(keys,i-1e-6),b=poseAt(keys,i+1e-6);
  assert(a.every((v,k)=>Math.abs(v-b[k])<.0001),'no held flipbook or midpoint snap');
 }
 for(let i=0;i<24;i+=.01)assert(poseAt(keys,i).every(v=>v>=0&&v<=1));
});

test('recorded articulation follows media time, freezes on pause, and closes on end',()=>{
 let now=0;const track=createTrack(()=>now),media={duration:4,currentTime:.3,paused:false,ended:false};
 track.prepare('clerk','Mama');track.start('voice',media);
 const first=track.sample();now+=20000;assert.deepEqual(track.sample().shape,first.shape);
 media.currentTime=1.5;const open=track.sample();assert(open.shape[0]>.9);
 media.paused=true;now+=9000;assert.deepEqual(track.sample().shape,open.shape);
 media.paused=false;media.currentTime=2.5;assert.equal(track.sample().shape[0],0);
 media.ended=true;assert.deepEqual(track.sample().shape,[0,0,0,0]);
 track.finish();assert.equal(track.sample().actor,null);
});

test('browser boundaries, pause/resume and missing speech keep their owning clock',()=>{
 let now=0;const track=createTrack(()=>now);
 track.prepare('aktenkurier','Mama fünf');assert.equal(track.sample().active,false);
 track.start('voice');now=100;track.boundary(0);now=200;track.pause();const paused=track.sample();
 now=8000;assert.deepEqual(track.sample().shape,paused.shape);track.resume();assert.deepEqual(track.sample().shape,paused.shape);
 now+=200;track.boundary(5);assert.equal(track.sample().receipt,true);track.boundary(0);assert(track.sample().index>=5);
 track.start('fallback');assert.deepEqual(track.sample().shape,[0,0,0,0]);
});

function probe(options={}){
 const h=harness('host',{voice:true,...options});
 vm.runInContext(source('buergeramt.js').replace(/\}\)\(\);\s*$/,'window.__lipProbe={content,showCharacter,characters,setStage,ambientStep};})();'),h.context);
 h.window.BuergeramtLevel.open(h.config);return{h,p:h.window.__lipProbe,level:h.window.BuergeramtLevel};
}
test('every authored clerk and roaming line owns lips; late completion cannot cancel a new speaker',()=>{
 const {h,p,level}=probe();p.setStage('character');
 for(const [id,character] of Object.entries(h.window.BuergeramtStory.characters)){
  for(const line of character.lines){p.content(character.speaker,line.line,[],null,null,null,{id,tone:line.tone,valence:line.valence});h.tick(16);assert.equal(level.lipSpeech.actor,id);assert.equal(level.lipSpeech.active,true);h.synth.end();assert.equal(level.lipSpeech.active,false)}
 }
 const story=h.window.BuergeramtStory;
 const registration=Object.values(story.registration?.nodes||{}).flatMap(node=>[node.line,...node.choices.map(c=>c.reply)]).filter(Boolean);
 for(const line of [...story.clerk.flatMap(node=>[node.line,...node.choices.map(c=>c.reply)]),...registration,...story.outburst.lines,story.call.declined]){
  p.content(story.clerkIdentity.speaker,line);h.tick(16);assert.equal(level.lipSpeech.actor,'clerk');assert.equal(level.clerkPerformance.frame,0);h.synth.end();assert.equal(level.clerkPerformance.speaking,false);
 }
 p.content('DER AKTENKURIER',story.omen.line,[],null,null,null,{id:'aktenkurier'});h.tick(16);const old=h.synth.current;
 p.content(story.clerkIdentity.speaker,'Mama');h.tick(16);old.onend();assert.equal(level.lipSpeech.actor,'clerk');
 level.replay(h.config);assert.equal(level.lipSpeech.actor,null);old.onboundary({charIndex:1});assert.equal(level.lipSpeech.actor,null);
});

test('ambient clerks and waiting voices share ownership; voice-off stays neutral',()=>{
 const {h,p,level}=probe();p.setStage('waiting');
 for(const actor of ['renter','clerk-1','clerk-2','pensioner','clerk-4']){
  p.ambientStep(9);assert.equal(level.lipSpeech.actor,actor);assert.equal(level.lipSpeech.active,true);h.synth.end();assert.equal(level.lipSpeech.actor,null);
 }
 const quiet=probe({voice:false});quiet.p.content('FRAU KNICK','Mama');assert.equal(quiet.level.lipSpeech.active,false);
 assert(Object.values(mouths).every(rect=>rect.length===4&&rect.every(v=>Number.isFinite(v)&&v>0&&v<1)));
});
