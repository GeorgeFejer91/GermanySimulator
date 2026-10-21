import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {timedCaptions,captionAt,captionAtProgress} from '../subtitle-protocol.js';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function fn(name){
 const start=source.indexOf(`function ${name}(`),end=source.indexOf('\nfunction ',start+1);
 assert.ok(start>=0&&end>start,name);return source.slice(start,end);
}
function fixture(){
 const box={hidden:true,textContent:'',lang:''},app={classList:{remove(){},toggle(){}}},frames=new Map(),timers=new Map();
 let frameId=0,timerId=0,decode,nativeSource,now=0;
 const gain={gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){return this},disconnect(){}};
 const h={state:{subtitlesOn:false},audioTextLibrary:{recordings:{}},document:{getElementById:id=>id==='app'?app:box},
  window:{GermanySubtitleLayout:{timedCaptions:(cues,speaker)=>timedCaptions(cues,text=>text.split('|').map((part,i)=>i||!speaker?part:speaker+' · '+part)),captionAt,captionAtProgress}},
  activeStimulus:null,textOnlyBark:null,subtitleFrame:0,stimulusGeneration:1,recordedSpeechSource:null,recordedSpeechGain:null,stimulusTimer:null,stimulusQueue:[],
  AUDIO_CLASS:{TEXT:'text'},AUDIO_MIX:{ATTACK_SECONDS:.02,FOREGROUND:1,REQUIRED_GAP_MS:0},
  performance:{now:()=>now},requestAnimationFrame:callback=>{frames.set(++frameId,callback);return frameId},cancelAnimationFrame:id=>frames.delete(id),
  setTimeout:callback=>{timers.set(++timerId,callback);return timerId},clearTimeout:id=>timers.delete(id),stimulusEligible:()=>true,foregroundOutput:()=>({}),
  prepareRecording:()=>new Promise(resolve=>decode=resolve),setAudioText(){},pumpStimuli(){},playSyntheticStimulus(){assert.fail('the decoded recording must own playback')}};
 h.audio={state:'running',currentTime:7,createGain:()=>gain,createBufferSource:()=>nativeSource={connect(){return gain},start(when){this.when=when},stop(){},disconnect(){}}};h.ensureAudio=()=>h.audio;
 h.englishSubtitle=item=>item.subtitle||'';
 vm.createContext(h);vm.runInContext(['clearSubtitle','setSubtitle','startSubtitle','finishStimulus','syncLockedDialogueAudioFocus','playRecordedStimulus'].map(fn).join('\n'),h);
 const frame=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback())};
 const item={recording:'heiko.mp3',text:'Erster Satz.|Zweiter Satz.',subtitle:'First sentence.|Second sentence.',captionSpeaker:'HEIKO',family:'dialogue'};
 h.activeStimulus=item;
 return{h,box,item,frame,frames,decode:()=>decode({duration:2}),source:()=>nativeSource,advanceWall:()=>now+=100000};
}

test('neighbor captions start after decoding and follow native playback time in both languages',async()=>{
 const f=fixture();let done=0;f.item.done=()=>done++;
 f.h.playRecordedStimulus(f.item,1);assert.equal(f.box.hidden,true,'no caption during queued/decode wait');
 f.decode();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.source().when,7);assert.equal(f.box.textContent,'HEIKO · Erster Satz.');
 f.advanceWall();for(let i=0;i<30;i++)f.frame();assert.equal(f.box.textContent,'HEIKO · Erster Satz.','render and wall clocks cannot run ahead of the recording');
 f.h.audio.currentTime=8.25;f.frame();assert.equal(f.box.textContent,'Zweiter Satz.');
 f.h.state.subtitlesOn=true;f.h.startSubtitle(f.item);assert.equal(f.box.textContent,'Second sentence.','language toggle preserves the current media position');assert.equal(f.box.lang,'en');
 f.h.audio.state='suspended';f.advanceWall();f.frame();assert.equal(f.box.textContent,'Second sentence.','suspended native media holds the caption');
 f.h.audio.state='running';f.h.audio.currentTime=8.7;f.frame();assert.equal(f.box.textContent,'Second sentence.');
 f.source().onended();assert.equal(done,1);assert.equal(f.box.hidden,true);assert.equal(f.box.textContent,'');
});

test('a replaced speaker and late subtitle refresh cannot overwrite the current child caption',()=>{
 const f=fixture();f.item.subtitleMode='recorded';f.item.subtitleDuration=2;f.item.subtitleElapsed=()=>0;f.h.startSubtitle(f.item);
 const lateFrame=[...f.frames.values()][0],child={text:'Hartmut ist dran.',subtitle:'Hartmut is speaking.',subtitleDuration:3,subtitleElapsed:()=>0,captionSpeaker:'HARTMUT'};
 f.h.activeStimulus=child;f.h.startSubtitle(child);const expected=f.box.textContent;
 lateFrame();assert.equal(f.box.textContent,expected);
 f.h.startSubtitle(f.item);assert.equal(f.box.textContent,expected,'stale refresh must not clear or flash the old speaker');
 f.h.clearSubtitle();lateFrame();assert.equal(f.box.hidden,true);assert.equal(f.box.textContent,'');
});
