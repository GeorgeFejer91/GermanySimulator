import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function sourceOf(name){
 const start=game.indexOf(`function ${name}(`);
 assert.notEqual(start,-1,name);
 let depth=0,opened=false;
 for(let i=game.indexOf('){',start)+1;i<game.length;i++){
  if(game[i]==='{'){depth++;opened=true}
  else if(game[i]==='}'&&opened&&--depth===0)return game.slice(start,i+1);
 }
 throw Error(name);
}
const names=['neighborActivityActive','citySpeechAllowed','stimulusEligible','hasStimulusFamily','nextVariant','queueStimulus','stationAtPlayer','playerOnRailTrack','trainAudioContextAllowed','trainAnnouncementVolume','requestTrainAnnouncement','updateTrainAnnouncement','stopRecordedSpeech','stopSpeech','finishStimulus','playRecordedStimulus','openDialogue','interact','useLawPower','showWorldBark','speak','speakRecorded','startCitizenshipQuiz'];
function harness(){
 let now=10000,resolveRecording,stops=0,starts=0,captionFallback=0;
 const timers=new Map(),sources=[],gains=[],buffer={duration:48};let timerId=0;
 const context=vm.createContext({
  performance:{now:()=>now},Math,Map,Promise,
  document:{hidden:false,getElementById:()=>({hidden:true,classList:{remove(){},toggle(){}} ,dataset:{}})},window:{},
  setTimeout:(callback,delay)=>{timers.set(++timerId,{callback,delay});return timerId},clearTimeout:id=>timers.delete(id),
  uiTone(){},clearSubtitle(){},hideWorldBark(){},cancelHumorScold(){},setAudioText(){},startSubtitle(){},clearInput(){},renderDialogue(){},
  pumpStimuli(){},foregroundOutput:()=>({}),playCaptionStimulus(){captionFallback++},playSyntheticStimulus(){captionFallback++},
  prepareRecording:()=>new Promise(resolve=>resolveRecording=resolve),
  clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),dist:(x,y,a,b)=>Math.hypot(x-a,y-b),
  nearestRailLocation:(loop,x)=>({distance:Math.abs(x-loop.x)}),
  audio:{currentTime:0,state:'running',createBufferSource(){const source={connect:target=>target,start(){starts++},stop(){stops++},onended:null};sources.push(source);return source},createGain(){const node={gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(v){node.target=v}},connect:target=>target,disconnect(){node.disconnected=true}};gains.push(node);return node}},
 });
 vm.runInContext(`
 const state={started:true,voiceOn:true,mission:1,modal:false,dialogue:false,gameOver:false};
 const player={x:50,y:50,r:10},keys={},jwd={allocated:false,visited:true,met:new Set(),tour:null};
 const jwdLane={x:2000,y:2000,w:500,h:300},stations=[{x:0,y:0,w:100,h:100},{x:500,y:0,w:100,h:100}],railLoops=[{x:800}],npcs=[],buildings=[];
 const TRAIN_IDLE_SECONDS=5,TRAIN_FADE_DISTANCE=320,TRAIN_PLAYER_OBSTRUCTION_AUDIO='children.mp3',TRAIN_PLATFORM_AUDIO=['ordinary.mp3'];
 const STIMULUS_PRIORITY={AMBIENT:1,NEARBY:3,CRITICAL:5},AUDIO_MIX={AMBIENT_TTL_MS:4000,MAX_TRANSIENT_QUEUE:4,TRAIN_GAP_MS:6500,ATTACK_SECONDS:.12,FOREGROUND:1,REQUIRED_GAP_MS:250},AUDIO_CLASS={TEXT:'audio-text'};
 const stimulusQueue=[],stimulusBags=new Map();
 let textOnlyBark=null,activeStimulus=null,stimulusGeneration=0,stimulusTimer=null,nextAmbientAt=0,recordedSpeechSource=null,recordedSpeechGain=null;
 let trainAnnouncementNextAt=0,trainIdleSeconds=0,trainIdleStation=null,trainIdleX=player.x,trainIdleY=player.y;
 const ensureAudio=()=>audio;
 ${names.map(sourceOf).join('\n')}
 globalThis.api={state,player,keys,jwd,stations,pending:stimulusQueue,updateTrainAnnouncement,requestTrainAnnouncement,trainAnnouncementVolume,citySpeechAllowed,stimulusEligible,queueStimulus,openDialogue,interact,useLawPower,showWorldBark,speak,speakRecorded,startCitizenshipQuiz,
  idle:()=>trainIdleSeconds,active:()=>activeStimulus,generation:()=>stimulusGeneration,
  begin(){activeStimulus=stimulusQueue.shift();playRecordedStimulus(activeStimulus,stimulusGeneration);return activeStimulus},
  seedActive(item){activeStimulus=item},playRecordedStimulus,
  stopSpeech,finishStimulus};
 `,context);
 const api=context.api;
 return {api,context,timers,sources,gains,setNow:n=>now=n,advance(seconds){for(let i=0;i<Math.round(seconds*40);i++)api.updateTrainAnnouncement(.025)},async load(){resolveRecording(buffer);await new Promise(setImmediate)},stats:()=>({starts,stops,captionFallback})};
}

test('ordinary announcements require five idle seconds wholly inside the same station',()=>{
 const h=harness(),a=h.api;
 h.advance(4.975);assert.equal(a.pending.length,0);
 h.advance(.05);assert.equal(a.pending[0]?.recording,'ordinary.mp3');
 a.pending.length=0;a.player.x=101;h.advance(10);assert.equal(a.pending.length,0);
 a.player.x=5;h.advance(10);assert.equal(a.pending.length,0,'body crossing station edge is outside');
 a.player.x=50;h.advance(3);a.player.x=550;h.advance(3);assert.equal(a.pending.length,0,'station identity resets dwell');
 h.advance(2.1);assert.equal(a.pending.length,1);
});
test('movement, held movement keys, pause and modal ownership reset idle time',()=>{
 for(const interrupt of ['move','key','pause','modal','hidden']){
  const h=harness(),a=h.api;h.advance(4);
  if(interrupt==='move')a.player.x+=1;
  if(interrupt==='key')a.keys.KeyW=true;
  if(interrupt==='pause')h.context.window.GermanyHUD={paused:true};
  if(interrupt==='modal')a.state.modal=true;
  if(interrupt==='hidden')h.context.document.hidden=true;
  h.advance(.025);a.keys.KeyW=false;h.context.window.GermanyHUD={paused:false};a.state.modal=false;h.context.document.hidden=false;
  h.advance(1.5);assert.equal(a.pending.length,0,interrupt);
 }
});
test('queued or decoding station announcements die when the player leaves or starts walking',async()=>{
 const h=harness(),a=h.api;h.advance(5.1);const item=a.begin();
 a.player.x=120;h.advance(.025);assert.equal(a.active(),null,'invalidated decode releases immediately');await h.load();
 assert.equal(h.stats().starts,0);assert.equal(a.active(),null);assert.ok(item.done);
 const retry=harness();retry.advance(5.1);retry.api.keys.KeyD=true;retry.advance(.025);
 assert.equal(retry.api.pending.length,0);
});
test('distance fade stays attached to its source and fully releases inaudible playback',async()=>{
 const h=harness(),a=h.api;h.advance(5.1);const item=a.begin();await h.load();
 assert.equal(h.stats().starts,1);assert.equal(item.distanceGain.gain.value,1);
 a.player.x=260;h.advance(.025);assert.equal(item.distanceGain.target,.5);
 a.player.x=550;h.advance(.025);assert.equal(a.active(),null,'another station cannot restore old audio');
 assert.equal(h.stats().stops,1);assert.equal(item.distanceGain.disconnected,true);
 assert.equal(a.pending.length,0,'leaving does not reserve a replay');
});
test('only children audio can bypass station dwell, and never without actual track contact',()=>{
 const h=harness(),a=h.api;
 assert.equal(a.requestTrainAnnouncement(0,'children.mp3',5,'track'),false);
 assert.equal(a.requestTrainAnnouncement(0,'ordinary.mp3',5,'platform'),false,'critical priority cannot bypass dwell');
 a.player.x=800;h.advance(.025);assert.equal(a.pending[0]?.recording,'children.mp3');
 a.player.x=700;h.advance(.025);assert.equal(a.pending.length,0,'track cue rechecks contact at admission');
 a.player.x=800;a.state.modal=true;assert.equal(a.requestTrainAnnouncement(0,'children.mp3',5,'track'),false);
});
test('neighbor activity rejects every competing speech tier and silent caption path',()=>{
 const h=harness(),a=h.api;a.jwd.tour={};
 for(const family of ['train','train-obstruction','police','rule','border','inner-monologue','featured','quiz-result']){
  assert.equal(a.queueStimulus({family,priority:5}),false,family);
  assert.equal(a.stimulusEligible({family}),false,family);
 }
 a.state.voiceOn=false;assert.equal(a.showWorldBark('POLIZEI','text'),false);
 a.state.voiceOn=true;assert.equal(a.queueStimulus({family:'dialogue',priority:5}),true);
 a.jwd.tour=null;assert.equal(a.citySpeechAllowed('police'),true);
});
test('meeting objective protects neighborhood proximity and disables unrelated E/section actions',()=>{
 const h=harness(),a=h.api;a.jwd.allocated=true;a.player.x=2200;a.player.y=2100;
 assert.equal(a.citySpeechAllowed('train'),false);a.interact();a.useLawPower();
 assert.equal(a.state.modal,false);assert.equal(a.state.lawCooldown,undefined);
 for(const id of ['one','two','three'])a.jwd.met.add(id);
 assert.equal(a.citySpeechAllowed('train'),true,'ordinary world resumes after three meetings');
 a.jwd.met.clear();a.player.x=900;assert.equal(a.citySpeechAllowed('train'),true,'objective alone does not silence the whole city');
});
test('neighbor entry cancels an active train and discards pending world cues',async()=>{
 const h=harness(),a=h.api;h.advance(5.1);const item=a.begin();await h.load();
 a.pending.push({family:'police',priority:5});a.jwd.tour={};h.advance(.025);
 assert.equal(a.active(),null);assert.equal(a.pending.length,0);assert.equal(h.stats().stops,1);
 a.seedActive({family:'dialogue'});h.advance(.025);assert.equal(a.active().family,'dialogue');
 assert.equal(item.distanceGain.disconnected,true);
});
test('conversation takeover cancels train immediately and ignores its late completion',async()=>{
 const h=harness(),a=h.api;h.advance(5.1);const item=a.begin(),oldGeneration=a.generation();await h.load();
 a.openDialogue('HEIKO',['hello'],'!',null);const replacement={family:'dialogue'};a.seedActive(replacement);
 a.finishStimulus(item,oldGeneration);
 assert.equal(a.active(),replacement);assert.equal(a.state.dialogue,true);assert.equal(h.stats().stops,1);
});
test('stalled recording preparation releases broker and cannot start after timeout',async()=>{
 const h=harness(),a=h.api;h.advance(5.1);a.begin();
 const deadline=[...h.timers.values()].find(t=>t.delay===8000);assert.ok(deadline);deadline.callback();
 assert.equal(a.active(),null);await h.load();assert.equal(h.stats().starts,0);
});
test('text fallback from slow decode cannot later be replaced by delayed audio',async()=>{
 const h=harness(),a=h.api,item={family:'dialogue',text:'hello',recording:'slow.mp3'};a.seedActive(item);a.playRecordedStimulus(item,a.generation());
 [...h.timers.values()].find(t=>t.delay===8000).callback();assert.equal(h.stats().captionFallback,1);
 await h.load();assert.equal(h.stats().starts,0);assert.equal(h.stats().captionFallback,1);
});


test('voice-off neighbor dialogue retains start/done and caption timing',()=>{
 for(const method of ['speak','speakRecorded']){
  const h=harness(),a=h.api;a.jwd.tour={};a.state.voiceOn=false;let started=0,done=0;
  const options={family:'dialogue',start:()=>started++,done:()=>done++};
  if(method==='speak')a.speak('neighbor words',options);else a.speakRecorded('neighbor words','take.mp3',options);
  assert.equal(started,1);assert.equal(done,0);
  [...h.timers.values()].find(t=>t.delay===3200).callback();assert.equal(done,1);
 }
});
test('already approaching quiz cannot take ownership when entering neighbor activity',()=>{
 const h=harness(),a=h.api;a.jwd.allocated=true;a.player.x=2200;a.player.y=2100;
 const quizzer={quizzer:true};a.state.quizApproach=quizzer;a.state.quizApproachQuestion={};
 assert.equal(a.startCitizenshipQuiz(quizzer),false);assert.equal(a.state.modal,false);assert.equal(a.state.quizQuestion,undefined);
 h.advance(.025);assert.equal(a.state.quizApproach,null);assert.equal(a.state.quizApproachQuestion,null);assert.ok(a.state.quizTimer>=12);
});
