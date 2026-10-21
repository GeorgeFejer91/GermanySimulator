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
const names=['neighborActivityActive','citySpeechAllowed','stimulusEligible','hasStimulusFamily','nextVariant','queueStimulus','signedRectDistance','stationAudioAtPlayer','stationAtPlayer','playerOnRailTrack','trainAudioContextAllowed','trainAnnouncementVolume','requestTrainAnnouncement','updateTrainAnnouncement','stopRecordedSpeech','stopSpeech','finishStimulus','playRecordedStimulus','openDialogue','cityInteractionTarget','currentMission','interact','useLawPower','showWorldBark','speak','speakRecorded','startCitizenshipQuiz'];
const stationWorld=vm.createContext({RAIL_GUTTER:560,CITY:{w:9840,h:4240},crossings:[]});
vm.runInContext(game.match(/const horizontalRoads=[^\n]+\nconst verticalRoads=[^\n]+/)[0]+'\n'+game.slice(game.indexOf('const STATION_RISE='),game.indexOf('const TRAIN_CAR_OFFSETS='))+'\nglobalThis.stations=stations',stationWorld);
const productionStations=JSON.parse(JSON.stringify(stationWorld.stations));
function harness(realStations=false){
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
 const state={started:true,voiceOn:true,mission:1,modal:false,dialogue:false,gameOver:false},missions=[{},{}];
 const player={x:50,y:50,r:10},keys={},jwd={allocated:false,visited:true,met:new Set(),tour:null};
 const jwdLane={x:2000,y:2000,w:500,h:300},stations=${JSON.stringify(realStations?productionStations:[{x:0,y:0,w:100,h:100,side:'north',accessX:0,accessY:100,accessW:100,accessH:105},{x:500,y:0,w:100,h:100,side:'north',accessX:500,accessY:100,accessW:100,accessH:105}])},railLoops=${realStations?'[]':'[{x:800}]'},npcs=[],buildings=[];
 const TRAIN_PLAYER_OBSTRUCTION_AUDIO='children.mp3',TRAIN_PLATFORM_AUDIO=['ordinary.mp3'];
 const STIMULUS_PRIORITY={AMBIENT:1,NEARBY:3,CRITICAL:5},AUDIO_MIX={AMBIENT_TTL_MS:4000,MAX_TRANSIENT_QUEUE:4,TRAIN_GAP_MS:6500,ATTACK_SECONDS:.12,FOREGROUND:1,REQUIRED_GAP_MS:250},AUDIO_CLASS={TEXT:'audio-text'};
 const stimulusQueue=[],stimulusBags=new Map();
 let textOnlyBark=null,activeStimulus=null,stimulusGeneration=0,stimulusTimer=null,nextAmbientAt=0,recordedSpeechSource=null,recordedSpeechGain=null;
 ${game.slice(game.indexOf('const TRAIN_IDLE_SECONDS='),game.indexOf('function finishStimulus('))}
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

test('ordinary station announcements become eligible after one second, including while walking',()=>{
 const h=harness(),a=h.api;
 a.keys.KeyD=true;h.advance(.975);assert.equal(a.pending.length,0);
 a.player.x=55;h.advance(.075);assert.equal(a.pending[0]?.recording,'ordinary.mp3');
 a.player.x=5;h.advance(.025);assert.equal(a.pending.length,1,'body may cross platform edge');
 a.player.x=148;h.advance(.025);assert.equal(a.pending.length,1,'48-unit platform vicinity');
 a.player.x=149;h.advance(.025);assert.equal(a.pending.length,0,'outside source area cancels pending');
 a.player.x=550;h.advance(.5);assert.equal(a.pending.length,0,'station change starts a fresh short wait');
 h.advance(.55);assert.equal(a.pending.length,1,'second station triggers independently');
});

test('all 18 stations cover their full platforms, entrance widths and side ramps',()=>{
 assert.equal(productionStations.length,18);
 for(const station of productionStations){
  const points=[];
  for(const fx of [0,.5,1])for(const fy of [0,.5,1])points.push([station.x+station.w*fx,station.y+station.h*fy]);
  for(const fx of [0,.5,1])for(const fy of [0,.5,1])points.push([station.accessX+station.accessW*fx,station.accessY+station.accessH*fy]);
  if(['west','east'].includes(station.side))for(const y of [station.y,station.y+station.h/2,station.y+station.h])points.push([station.x-105,y],[station.x+station.w+105,y]);
  for(const [x,y] of points){
   const h=harness(true),a=h.api;Object.assign(a.player,{x,y});a.keys.KeyD=true;
   h.advance(.975);assert.equal(a.pending.length,0,station.id+' must wait briefly');
   h.advance(.075);assert.equal(a.pending[0]?.origin.id,station.id,`${station.id} (${x}, ${y})`);
  }
 }
});

test('pause, hidden pages, conversation, modal and leaving the station reset the short wait',()=>{
 for(const interrupt of ['pause','modal','hidden','dialogue','voice-off','outside']){
  const h=harness(),a=h.api;h.advance(.75);
  if(interrupt==='pause')h.context.window.GermanyHUD={paused:true};
  if(interrupt==='modal')a.state.modal=true;
  if(interrupt==='hidden')h.context.document.hidden=true;
  if(interrupt==='dialogue')a.state.dialogue=true;
  if(interrupt==='outside')a.player.x=350;
  if(interrupt==='voice-off')a.state.voiceOn=false;
  h.advance(10);assert.equal(a.pending.length,0,interrupt);
  h.context.window.GermanyHUD={paused:false};a.state.modal=false;a.state.dialogue=false;a.state.voiceOn=true;h.context.document.hidden=false;a.player.x=50;
  h.advance(.5);assert.equal(a.pending.length,0,interrupt);
  h.advance(.55);assert.equal(a.pending.length,1,interrupt+' recovers');
 }
});

test('queued or decoding station announcements survive walking and cancel outside their source area',async()=>{
 const h=harness(),a=h.api;h.advance(1.05);a.begin();
 a.keys.KeyD=true;a.player.x=90;h.advance(.025);await h.load();assert.equal(h.stats().starts,1);
 const retry=harness();retry.advance(1.05);const stale=retry.api.begin();retry.api.player.x=149;retry.advance(.025);await retry.load();
 assert.equal(retry.stats().starts,0);assert.equal(retry.api.active(),null);assert.ok(stale.done);
});

test('distance fade stays attached to its source and fully releases inaudible playback',async()=>{
 const h=harness(),a=h.api;h.advance(5.1);const item=a.begin();await h.load();
 assert.equal(h.stats().starts,1);assert.equal(item.distanceGain.gain.value,1);
 a.player.x=260;h.advance(.025);assert.equal(item.distanceGain.target,.5);
 a.player.x=550;h.advance(.025);assert.equal(a.active(),null,'another station cannot restore old audio');
 assert.equal(h.stats().stops,1);assert.equal(item.distanceGain.disconnected,true);
 assert.equal(a.pending.length,0,'leaving does not reserve a replay');
});
test('completion keeps the 6.5-second repeat gap despite movement and re-entry',async()=>{
 const h=harness(),a=h.api;h.advance(1.05);const item=a.begin();await h.load();
 a.finishStimulus(item,a.generation());
 a.player.x=350;h.advance(.025);a.player.x=50;h.advance(1.05);
 h.setNow(16499);h.advance(.025);assert.equal(a.pending.length,0);
 h.setNow(16500);h.advance(.025);assert.equal(a.pending[0]?.recording,'ordinary.mp3');
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
