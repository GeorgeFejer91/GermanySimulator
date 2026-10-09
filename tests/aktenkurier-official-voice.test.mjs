import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {harness} from './amt-harness.mjs';
const source=readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8');
const text='Wer die Finsternis sieht, hat sie selbst gewählt!';
const path='./assets/voices/horst-stempelmann/omen-candidate-02.mp3';
const voiceId='amt-horst-stempelmann';
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function recorded({voice=true,start=true}={}){
 const h=harness('host',{cinematics:true,voice});vm.runInContext(source,h.context);
 const players=[];
 h.context.Audio=class{
  constructor(src){this.src=src;this.currentTime=0;this.duration=4.76;this.paused=true;players.push(this)}
  play(){this.paused=false;if(start)h.context.setTimeout(()=>{if(!this.paused)this.onplaying?.()},16);return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}
  removeAttribute(){this.src=''} load(){}
  at(seconds){this.currentTime=seconds;this.ontimeupdate?.()}
  end(){this.paused=true;this.onended?.()}
 };
 h.enterUntilOmen();for(let i=0;i<300&&h.level.omen.phase==='approach';i++)h.level.update(.05);h.tick(16);
 return {h,players,get player(){return players.at(-1)}};
}
test('the accepted second profile retains candidate one and supplies default exact-speaker audio',()=>{
 const context=vm.createContext({window:{},location:{search:''},URLSearchParams});vm.runInContext(source,context);
 const catalog=context.window.GermanySimulatorAudioText,cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url)));
 const horst=cast.characters.find(p=>p.voiceId===voiceId),second=horst.secretTunnel.candidateProfiles[0];
 assert.equal(horst.secretTunnel.profileId,'c4c533edd860444e9e02ce0d22a78e8d');assert.equal(second.candidateNumber,2);
 assert.equal(second.profileId,'09b19a96ec8848138ab0a0910af09ece');assert.equal(catalog.voices[voiceId].candidateProfiles[0].profileId,second.profileId);
 const clip=catalog.clips['aktenkurier-omen-candidate-02'];assert.equal(clip.profileId,second.profileId);assert.equal(clip.source,text);
 assert.equal(catalog.candidatePreviewEnabled,false);assert.equal(catalog.candidateClip(voiceId,text),path);
 assert.equal(catalog.candidateClip('amt-gisela-aktenberg',text),null);assert.equal(catalog.candidateClip(voiceId,text+' '),null);
 assert.equal(catalog.candidateClip(voiceId,horst.dialogue[0].text),null);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path.slice(2),import.meta.url))).digest('hex'),clip.sha256);
 assert(clip.wordCues.every((cue,i)=>cue.at>=0&&cue.at<clip.durationSeconds&&(!i||cue.at>=clip.wordCues[i-1].at)&&text.slice(cue.charIndex).startsWith(cue.word)));
});
test('recording playback owns the word contour and only its real end starts the stare',()=>{
 const {h,player}=recorded();assert.equal(h.synth.current,null);assert.equal(player.src,path);
 assert.equal(h.level.omen.speech.recording,path);assert.equal(h.level.omen.speech.durationMs,4760);
 player.at(1.6);assert.equal(h.level.omen.speech.charIndex,text.indexOf('Finsternis'));assert.equal(h.level.omen.speech.timing,'recording-cues');
 player.at(3.95);assert.equal(h.level.omen.speech.charIndex,text.indexOf('gewählt'));
 h.tick(5000);assert.equal(h.level.omen.phase,'blackout');player.end();assert.equal(h.level.omen.phase,'glare');
 assert.equal(h.level.omen.speech.progress,1);h.advanceGame(3.2);assert.equal(h.level.omen.phase,'glare');
});
test('pause suspends the recording watchdog and Gaussian life; resume keeps the same playhead',()=>{
 const {h,player}=recorded();player.at(1.6);h.advanceGame(.2);player.pause();const before=h.level.omen.life;
 h.tick(22000);h.advanceGame(1);assert.equal(h.level.omen.phase,'blackout');assert.equal(h.level.omen.life.clock,before.clock);
 assert.equal(h.level.omen.speech.paused,true);player.play();h.tick(16);assert.equal(h.level.omen.speech.paused,false);
 assert.equal(h.level.omen.speech.charIndex,text.indexOf('Finsternis'));player.at(3.95);player.end();assert.equal(h.level.omen.phase,'glare');
});
test('hiding pauses native playback and resumes it without a new utterance',()=>{
 const {h,player}=recorded();player.at(1.6);h.hide();h.hide();assert.equal(player.paused,true);assert.equal(h.level.omen.speech.paused,true);
 h.tick(23000);assert.equal(h.level.omen.phase,'blackout');h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));h.tick(16);
 assert.equal(player.paused,false);assert.equal(h.level.omen.speech.paused,false);assert.equal(h.synth.current,null);
});
test('a missing recording uses the same browser words without rewinding the life contour',()=>{
 const {h,player}=recorded();player.at(3.5);const before=h.level.omen.speech.progress;player.onerror();h.tick(16);
 assert.equal(player.src,'');assert.equal(h.synth.current.text,text);h.synth.boundary(0);h.level.update(0);
 assert(h.level.omen.speech.progress>=before);player.at(4.5);player.end();assert.equal(h.level.omen.phase,'blackout');
 h.synth.end();assert.equal(h.level.omen.phase,'glare');
});
test('a recording that never starts is stopped before browser fallback; late events are ignored',()=>{
 const {h,player}=recorded({start:false});h.tick(1816);assert.equal(player.src,'');assert.equal(h.synth.current.text,text);
 const before=h.level.omen.speech.charIndex;player.onplaying?.();player.at(4.5);player.end();assert.equal(h.level.omen.phase,'blackout');assert.equal(h.level.omen.speech.charIndex,before);
});
test('replay cancels playback and stale recording callbacks cannot release the new encounter',()=>{
 const {h,player}=recorded();h.level.replay(h.config);assert.equal(player.paused,true);assert.equal(player.src,'');
 h.enterUntilOmen();for(let i=0;i<300&&h.level.omen.phase==='approach';i++)h.level.update(.05);h.tick(16);
 const before=h.level.omen.speech.charIndex;player.at(4.5);player.onplaying?.();player.onpause?.();player.end();
 assert.equal(h.level.omen.phase,'blackout');assert.equal(h.level.omen.speech.charIndex,before);assert.equal(h.level.omen.speech.paused,false);
});
test('hiding during recording startup does not consume its timeout or start fallback speech',()=>{
 const {h,player}=recorded({start:false});h.hide();h.tick(23000);assert.equal(h.synth.current,null);assert.equal(h.level.omen.phase,'blackout');
 h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));player.onplaying();
 assert.equal(h.level.omen.speech.recording,path);assert.equal(h.level.omen.speech.paused,false);player.end();assert.equal(h.level.omen.phase,'glare');
});
test('a recording stall is bounded and releases through the same-text browser fallback',()=>{
 const {h,player}=recorded();h.tick(20016);assert.equal(player.src,'');assert.equal(h.synth.current.text,text);
 assert.equal(h.level.omen.phase,'blackout');h.synth.end();assert.equal(h.level.omen.phase,'glare');
});
test('voice-off never creates or loads the official recording',()=>{
 const {h,players}=recorded({voice:false});assert.equal(players.length,0);assert.equal(h.level.omen.speech.mode,'fallback');assert.equal(h.node('amt-line').textContent,text);
});
