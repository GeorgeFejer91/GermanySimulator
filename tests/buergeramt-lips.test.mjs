import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';
await import('../buergeramt-lips.js');
const {createTrack,score,poseAt,mouths}=globalThis.GermanyAmtLips;

test('mouth registration belongs to the displayed pose and atlas cell, never speech time',()=>{
 const {displayedMouth}=globalThis.GermanyAmtLips,actor={id:'aktenkurier',mouthPose:0,renderKey:'detail:4'};
 const work=displayedMouth(actor);actor.mouthPose=1;const gesture=displayedMouth(actor);assert.notDeepEqual(work,gesture);
 actor.mouthPose=2;assert.notDeepEqual(displayedMouth(actor),gesture);
 actor.mouthPose=null;assert.equal(displayedMouth(actor),null,'a rear/turn cell cannot reuse a frontal face');
 actor.mouthPose=1;actor.renderKey='atlas:72';actor.mouthSample=0;const first=displayedMouth(actor);
 actor.mouthSample=2;assert.notDeepEqual(displayedMouth(actor),first,'the registered face follows the baked body field');
 actor.mouthSample=0;assert.deepEqual(displayedMouth(actor),first);
 const clerk={performance:true,lipId:'clerk-2',mouthPose:0,renderKey:'detail:0'};const ready=displayedMouth(clerk);clerk.mouthPose=3;assert.notDeepEqual(displayedMouth(clerk),ready);
});

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

test('an unanalyzed preview recording retains the explicitly estimated fallback',()=>{
 let now=0;const track=createTrack(()=>now),media={duration:4,currentTime:.3,paused:false,ended:false};
 track.prepare('clerk','Mama');track.start('voice',media);
 const first=track.sample();now+=20000;assert.deepEqual(track.sample().shape,first.shape);
 media.currentTime=1.5;const open=track.sample();assert(open.shape[0]>.9);
 media.paused=true;now+=9000;assert.deepEqual(track.sample().shape,open.shape);
 media.paused=false;media.currentTime=2.5;assert.equal(track.sample().shape[0],0);
 media.ended=true;assert.deepEqual(track.sample().shape,[0,0,0,0]);
 track.finish();assert.equal(track.sample().actor,null);
});

test('late acoustic loading cannot play or bind a cancelled speaker',async()=>{
 const {h,p,level}=probe(),pending=[],players=[];
 h.window.GermanyAmtLips.loadRecording=()=>new Promise(resolve=>pending.push(resolve));
 h.window.GermanySimulatorAudioText={candidateClip:()=> './clip.mp3',recordings:{'./clip.mp3':{sha256:'hash'}}};
 h.context.Audio=class{
  constructor(){this.currentTime=.5;this.duration=2;this.paused=true;this.ended=false;this.plays=0;players.push(this)}
  play(){this.plays++;this.paused=false;this.onplaying?.();return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){}load(){}
 };
 p.content('DER AKTENKURIER','Erste Zeile',[],null,null,null,{id:'aktenkurier'});
 p.content('FRAU KNICK','Zweite Zeile');
 const binding={track:{recording:'./clip.mp3'},sample:()=>({open:1,spread:.2,round:0,bite:0,viseme:'D'})};
 pending[0](binding);await new Promise(setImmediate);assert.equal(players[0].plays,0);
 pending[1](binding);await new Promise(setImmediate);assert.equal(players[1].plays,1);assert.equal(level.lipSpeech.actor,'clerk');assert.equal(level.lipSpeech.timing,'audio-cues');assert.equal(level.lipSpeech.shape[0],1);
 level.replay(h.config);assert.equal(level.lipSpeech.actor,null);
});

test('slow acoustic preparation gets its own deadline before the playback watchdog',async()=>{
 const {h,p,level}=probe(),pending=[],players=[];
 h.window.GermanyAmtLips.loadRecording=()=>new Promise(resolve=>pending.push(resolve));
 h.window.GermanySimulatorAudioText={candidateClip:()=> './clip.mp3',recordings:{'./clip.mp3':{sha256:'hash'}}};
 h.context.Audio=class{
  constructor(){this.currentTime=.5;this.duration=2;this.paused=true;this.ended=false;this.plays=0;players.push(this)}
  play(){this.plays++;this.paused=false;this.onplaying?.();return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){}load(){}
 };
 p.content('FRAU KNICK','Langsame Vorbereitung');h.tick(4000);
 assert.equal(h.synth.current,null,'do not silently replace an existing recording during cue import');
 assert.equal(players[0].plays,0);
 pending[0]({track:{recording:'./clip.mp3'},sample:()=>({open:1,spread:0,round:0,bite:0,viseme:'D'})});
 await new Promise(setImmediate);assert.equal(players[0].plays,1);assert.equal(level.lipSpeech.timing,'audio-cues');
 level.replay(h.config);assert.equal(level.lipSpeech.active,false);
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
 for(const [id,patron] of Object.entries(story.patrons))for(const line of patron.lines){
  p.content(patron.speaker,line.line,[],null,null,null,{id,tone:line.tone,valence:line.valence});h.tick(16);
  assert.equal(level.lipSpeech.actor,id);assert.equal(level.lipSpeech.active,true);h.synth.end();assert.equal(level.lipSpeech.active,false);
 }
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
 for(const clerk of Object.values(h.window.BuergeramtStory.clerks))h.window.GermanySimulatorAudioText.productionVoices[clerk.voiceId].fallback='captions';
 for(let index=0;index<21;index++){
  const before=h.synth.spoken.length;
  for(let turn=0;turn<6;turn++){p.ambientStep(9);h.tick(20);if(level.lipSpeech.actor)break;}const actor=level.lipSpeech.actor;
  assert(h.window.BuergeramtStory.ambient.some(row=>row.actor===actor&&h.node('amt-ambient').textContent.endsWith(row.text)));
  assert.equal(level.lipSpeech.active,false);assert.equal(h.synth.spoken.length,before);h.tick(15000);
  assert.equal(level.lipSpeech.actor,null);
 }
 const quiet=probe({voice:false});quiet.p.content('FRAU KNICK','Mama');assert.equal(quiet.level.lipSpeech.active,false);
 assert(Object.values(mouths).every(rect=>rect.length===4&&rect.every(v=>Number.isFinite(v)&&v>0&&v<1)));
});

test('replacement recordings use new cache URLs while retaining canonical mouth ownership',()=>{
 const {h,p}=probe(),path='./selected-knick.mp3',players=[],bindings=[],sha='a'.repeat(64);
 h.window.GermanySimulatorAudioText={productionVoices:{'amt-brunhilde-knick':{fallback:'captions'}},recordedClip:()=>path,recordings:{[path]:{sha256:sha}}};
 h.window.GermanyAmtLips.loadRecording=(path,hash)=>{bindings.push({path,hash});return null};
 h.context.Audio=class{constructor(src){this.src=src;players.push(this)}play(){return Promise.resolve()}pause(){}removeAttribute(){}load(){}};
 p.content('FRAU KNICK','Die genaue Zeile.');assert.equal(players.at(-1).src,path+'?v='+sha);assert.deepEqual(bindings.at(-1),{path,hash:sha});
 const replacement='b'.repeat(64);h.window.GermanySimulatorAudioText.recordings[path].sha256=replacement;
 p.content('FRAU KNICK','Die genaue Zeile.');assert.equal(players.at(-1).src,path+'?v='+replacement);assert.deepEqual(bindings.at(-1),{path,hash:replacement});
});

test('Knick waits for a slow native start, keeps hidden startup alive and still bounds failure',()=>{
 const {h,p,level}=probe(),players=[],text='Ich sitze hier ja nur...';
 h.window.GermanySimulatorAudioText={productionVoices:{'amt-brunhilde-knick':{fallback:'captions'}},recordedClip:()=> './selected-knick.mp3',recordings:{'./selected-knick.mp3':{sha256:'selected-hash'}}};
 h.context.Audio=class{
  constructor(src){this.src=src;this.currentTime=0;this.duration=7;this.paused=true;this.ended=false;players.push(this)}
  play(){this.paused=false;return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){this.src=''}load(){}
 };
 p.content('FRAU KNICK',text);const slow=players.at(-1);h.tick(2500);
 assert.equal(slow.src,'./selected-knick.mp3');assert.equal(level.lipSpeech.mode,'waiting');assert.equal(h.synth.current,null);
 slow.currentTime=.05;slow.onplaying();assert.equal(level.lipSpeech.mode,'recorded');assert.equal(level.clerkPerformance.speaking,true);assert.equal(h.node('amt-ambient').textContent,'FRAU KNICK · '+text);
 slow.ended=true;slow.onended();assert.equal(level.lipSpeech.actor,null);
 p.content('FRAU KNICK',text);const failed=players.at(-1);h.tick(4016);assert.equal(failed.src,'');assert.equal(level.lipSpeech.mode,'fallback');assert.equal(h.synth.current,null);
 p.content('FRAU KNICK',text);const hidden=players.at(-1);h.tick(1000);h.hide();h.tick(23000);assert.equal(hidden.src,'./selected-knick.mp3');
 h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));h.tick(2500);assert.equal(hidden.src,'./selected-knick.mp3');hidden.currentTime=.05;hidden.onplaying();assert.equal(level.lipSpeech.mode,'recorded');
 level.replay(h.config);hidden.onplaying();assert.equal(level.lipSpeech.actor,null);assert.equal(hidden.src,'');
});

test('native playback survives slow media progress and bounds a true stall without losing pause ownership',()=>{
 const {h,p,level}=probe(),players=[];
 h.window.GermanySimulatorAudioText={productionVoices:{'amt-brunhilde-knick':{fallback:'captions'}},recordedClip:()=> './selected-knick.mp3',recordings:{'./selected-knick.mp3':{sha256:'selected-hash'}}};
 h.context.Audio=class{
  constructor(src){this.src=src;this.currentTime=0;this.duration=9;this.paused=true;this.ended=false;players.push(this)}
  play(){this.paused=false;this.onplaying?.();return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}removeAttribute(){this.src=''}load(){}
 };
 p.content('FRAU KNICK','Eine langsame Aufnahme.');const slow=players.at(-1);
 h.tick(19000);slow.currentTime=.7;slow.ontimeupdate();h.tick(19000);
 assert.equal(slow.src,'./selected-knick.mp3','advancing native media outlives its wall duration');assert.equal(level.lipSpeech.mode,'recorded');
 slow.ontimeupdate();h.tick(1016);assert.equal(slow.src,'','unchanged timeupdate does not extend the finite stall limit');assert.equal(level.lipSpeech.mode,'fallback');assert.equal(h.synth.current,null);
 p.content('FRAU KNICK','Eine weitere Aufnahme.');const resumed=players.at(-1);
 h.tick(19000);resumed.currentTime=.8;h.hide();h.tick(23000);assert.equal(resumed.src,'./selected-knick.mp3');
 h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));h.tick(1016);
 assert.equal(resumed.src,'./selected-knick.mp3','resuming samples progress even without timeupdate');resumed.currentTime=1.2;resumed.ontimeupdate();
 resumed.ended=true;resumed.onended();assert.equal(level.lipSpeech.actor,null);
 p.content('FRAU KNICK','Die neue Zeile.');const newest=players.at(-1);resumed.onended();assert.equal(newest.src,'./selected-knick.mp3');assert.equal(level.lipSpeech.mode,'recorded');
 level.replay(h.config);h.tick(23000);assert.equal(newest.src,'');assert.equal(level.lipSpeech.actor,null);
});
