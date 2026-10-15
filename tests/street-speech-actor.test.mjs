import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {neighborProtectionSource} from './quiz-harness.mjs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const catalogSource=readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8');

function fn(text,name){
 const start=text.indexOf('function '+name+'(');assert(start>=0,name);let quote='',escape=false,signature=0,body=-1,depth=0;
 for(let i=text.indexOf('(',start);i<text.length;i++){
  const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue}
  if(body<0){if(c==='(')signature++;if(c===')')signature--;if(c==='{'&&signature===0){body=i;depth=1}continue}
  if(c==='{')depth++;if(c==='}'&&!--depth)return text.slice(start,i+1);
 }throw Error('Function boundary '+name);
}
const functions=['recordedMouthOpening','speechActorCurrent','getStreetSpeech','stimulusEligible','chooseStimulusIndex','queueStimulus','finishStimulus','playCaptionStimulus','playSyntheticStimulus','playRecordedStimulus','pumpStimuli','ensureAudio','speak','speakRecorded','stopRecordedSpeech','hideWorldBark','stopSpeech','showWorldBark','openDialogue','setDialogueVoiceBusy','speakDialogueLine','renderDialogue','nextDialogue'].map(n=>fn(source,n)).join('\n');
function fixture(){
 const scope={window:{},URLSearchParams,location:{search:''}};vm.createContext(scope);vm.runInContext(catalogSource,scope);const catalog=scope.window.GermanySimulatorAudioText;
 const deferred=[],sources=[],timers=new Set(),elements=new Map();
 const node=id=>{if(!elements.has(id))elements.set(id,{hidden:true,disabled:false,textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}}});return elements.get(id)};
 const actor={id:'fixture-klein-A',voiceId:'stadt-klaus-dieter-klein'},other={id:'fixture-klein-B',voiceId:actor.voiceId};
 const path='./assets/voices/city-dialogue/stadt-klaus-dieter-klein-01.mp3',clip=catalog.recordings[path];
 Object.assign(scope,{state:{voiceOn:true,started:true,mission:1,dialogue:false,modal:false,lang:'en',region:'germany'},player:{x:0,y:0},npcs:[actor,other],activeStimulus:null,textOnlyBark:null,recordedSpeechSource:null,recordedSpeechGain:null,stimulusGeneration:0,stimulusSequence:0,stimulusQueue:[],stimulusLastServed:new Map(),nextAmbientAt:0,stimulusTimer:null,
  speechCatalog:catalog,STIMULUS_PRIORITY:{AMBIENT:1,REACTIVE:2,CRITICAL:3},AUDIO_MIX:{AMBIENT_TTL_MS:4000,MAX_TRANSIENT_QUEUE:4,REQUIRED_GAP_MS:250,AMBIENT_GAP_MS:2500,ATTACK_SECONDS:.01,FOREGROUND:1},AUDIO_CLASS:{TEXT:'text'},
  document:{hidden:false,getElementById:node,querySelector:node},jwd:{tour:null,allocated:true,met:new Set(['jwd-swabian','jwd-parent','jwd-watcher'])},performance,
  setTimeout(callback,delay){let timer;timer=setTimeout(()=>{timers.delete(timer);callback()},delay);timers.add(timer);return timer},clearTimeout(timer){clearTimeout(timer);timers.delete(timer)},
  prepareRecording(url){let accept,reject;const promise=new Promise((a,b)=>{accept=a;reject=b});deferred.push({url,accept,reject});return promise},
  foregroundOutput:()=>({}),setAudioText(){},clearSubtitle(){scope.caption=null},startSubtitle(item){scope.caption=item.text},uiTone(){},cancelHumorScold(){},cancelJwdTour(){throw Error('Unexpected tour')},requestCharacterReaction(){},
  speakMerkelLine(){throw Error('Not this fixture owner')},speakMerzLine(){throw Error('Not this fixture owner')}});
 scope.audio={state:'running',currentTime:10,resume(){this.state='running';return Promise.resolve()},
  createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(target){return target}}},
  createBufferSource(){const s={buffer:null,onended:null,stops:0,startAt:null,connect(target){return target},start(time){this.startAt=time},stop(){this.stops++}};sources.push(s);return s}};
 vm.runInContext(neighborProtectionSource+functions,scope,{filename:'canonical-street-speech-production-slices'});
 const request=(owner=actor,extra={})=>{scope.speak(clip.source,{candidateVoiceId:owner?.voiceId||actor.voiceId,voiceKey:'Fixture owned speaker',actor:owner,subtitle:clip.english,...extra});return scope.activeStimulus};
 const flush=()=>new Promise(done=>setImmediate(done));
 const start=async(index=0,duration=2)=>{deferred[index].accept({duration,length:duration*48000,numberOfChannels:1});await flush();await flush()};
 return{h:scope,actor,other,path,clip,catalog,node,deferred,sources,request,start,flush,dispose(){for(const timer of timers)clearTimeout(timer)}};
}
function actorTest(name,run){
 test(name,async t=>{const f=fixture();t.after(()=>f.dispose());await run(f)});
}
actorTest('Exact object, active prestart and stable native token; pending queue never projected',async f=>{
 const item=f.request(),queued=f.h.getStreetSpeech(f.actor);assert.equal(queued.speechStatus,'queued');assert.equal(queued.mouthOpen,0);assert.equal(f.h.getStreetSpeech(f.other),null);
 f.request(f.other);assert.equal(f.h.stimulusQueue.length,1);assert.equal(f.h.getStreetSpeech(f.other),null);assert.equal(f.h.getStreetSpeech(f.actor).cueToken,queued.cueToken);
 await f.start();f.h.audio.currentTime+=.3;const playing=f.h.getStreetSpeech(f.actor);assert.equal(playing.speechStatus,'playing');assert.equal(playing.cueToken,queued.cueToken);assert.equal(playing.mediaTime,f.h.audio.currentTime-10);const energyIndex=Math.min(f.clip.mouthEnergy.length-1,Math.floor(playing.mediaTime*f.clip.mouthHz));assert.equal(playing.mouthOpen,Number(f.clip.mouthEnergy[energyIndex])/255,'Current Klein measured envelope follows native time');
 const savedEnergy=f.clip.mouthEnergy;delete f.clip.mouthEnergy;assert.equal(f.h.getStreetSpeech(f.actor).mouthOpen,0,'Missing measured energy stays closed');f.clip.mouthEnergy=savedEnergy;assert.equal(f.h.activeStimulus,item);
 return{queued:queued.speechStatus,playing:playing.speechStatus,publicMeasuredEnergyVerified:true,missingEnergyClosed:true,pendingOtherInvisible:true};
});
actorTest('Measured public energy and native time; pause retains token and closes',async f=>{
 const path='./assets/voices/neighbors/ede-burglar-01.mp3',clip=f.catalog.recordings[path];f.actor.voiceId=clip.voiceId;
 f.h.speakRecorded(clip.source,path,{candidateVoiceId:clip.voiceId,actor:f.actor});const queued=f.h.getStreetSpeech(f.actor);await f.start(0,clip.durationMs/1000||10);
 const index=Array.from(clip.mouthEnergy).findIndex((v,i)=>i>2&&v>0);assert(index>0);const elapsed=(index+.1)/clip.mouthHz;f.h.audio.currentTime=10+elapsed;
 const playing=f.h.getStreetSpeech(f.actor);assert(Math.abs(playing.mouthOpen-clip.mouthEnergy[index]/255)<1e-9);assert.equal(playing.cueToken,queued.cueToken);
 f.h.window.GermanyHUD={paused:true};const paused=f.h.getStreetSpeech(f.actor);assert.equal(paused.speechStatus,'paused');assert.equal(paused.mouthOpen,0);assert.equal(paused.cueToken,queued.cueToken);
 f.h.window.GermanyHUD.paused=false;f.h.audio.currentTime+=.05;assert.equal(f.h.getStreetSpeech(f.actor).speechStatus,'playing');assert.equal(f.h.getStreetSpeech(f.actor).cueToken,queued.cueToken);
 return{publicEnergyPath:path,index,measuredValue:playing.mouthOpen,pauseClosed:true,boundary:'AudioContext clock/source/buffer are explicit doubles; public energy unchanged'};
});
actorTest('Owner/id/profile invalidation neutralizes projection without changing audio eligibility or completion',async f=>{
 let done=0;const item=f.request(f.actor,{done:()=>done++});const eligible=f.h.stimulusEligible(item);f.h.npcs.splice(0,1);assert.equal(f.h.getStreetSpeech(f.actor),null);assert.equal(f.h.stimulusEligible(item),eligible);
 await f.start();assert.equal(f.sources[0].startAt,10);f.sources[0].onended();assert.equal(done,1);assert.equal(f.h.activeStimulus,null);
 return{removedOwnerNeutral:true,originalAudioStartAndDoneRetained:true};
});
actorTest('Invalid initial actor association stays neutral; foreign query cannot stop current owner',async f=>{
 const invalid={id:'unknown',voiceId:f.actor.voiceId};f.request(invalid);assert(f.h.activeStimulus);assert.equal(f.h.activeStimulus.actor,null);assert.equal(f.h.getStreetSpeech(invalid),null);f.h.stopSpeech();
 const own=f.request(),generation=f.h.stimulusGeneration;assert.equal(f.h.getStreetSpeech(f.other),null);assert.equal(f.h.activeStimulus,own);assert.equal(f.h.stimulusGeneration,generation);assert.equal(f.sources.length,0);
 return{neutralInvalidMetadata:true,foreignQueryReadOnly:true};
});
actorTest('Reused id/voice/profile/reference invalidates only projection, not existing request',async f=>{
 const item=f.request(),token=f.h.getStreetSpeech(f.actor).cueToken,binding=f.catalog.productionVoices[f.actor.voiceId];
 for(const [object,key]of [[f.actor,'id'],[f.actor,'voiceId'],[binding,'profileId'],[binding,'referenceSha256'],[binding,'renderer'],[binding,'modelRevision']]){
  const original=object[key];object[key]='changed-owner-proof';assert.equal(f.h.getStreetSpeech(f.actor),null);assert.equal(f.h.activeStimulus,item);assert(f.h.stimulusEligible(item));object[key]=original;assert.equal(f.h.getStreetSpeech(f.actor).cueToken,token);
 }
 const clip=f.catalog.recordings[f.path],original=clip.profileId;clip.profileId='foreign-profile';assert.equal(f.h.getStreetSpeech(f.actor),null);clip.profileId=original;
 return{sixOwnerProofMutationsNeutral:true,foreignRecordedProfileClosed:true,originalEligibilityRetained:true};
});
actorTest('Natural native ended callback exposes finished then absence; cancelled decode cannot restart',async f=>{
 let terminal;const item=f.request(f.actor,{done:()=>terminal=f.h.getStreetSpeech(f.actor)});await f.start();f.sources[0].onended();assert.equal(terminal.speechStatus,'finished');assert.equal(terminal.mouthOpen,0);assert.equal(f.h.getStreetSpeech(f.actor),null);assert.equal(item.actorSpeechStatus,'finished');
 const pending=f.request(),token=f.h.getStreetSpeech(f.actor).cueToken;f.h.stopSpeech();assert.equal(pending.actorSpeechStatus,'cancelled');assert.equal(f.h.getStreetSpeech(f.actor),null);await f.start(1);assert.equal(f.sources.length,1,'Retired decode cannot create source');assert.notEqual(token,item.actorCueToken);
 return{nativeTerminalThenAbsent:true,oldDecodeRejected:true,boundary:'Explicit source onended event double; no playback claim'};
});
actorTest('Failed recording caption terminal cannot masquerade as native; voice-off and unbound remain absent',async f=>{
 let terminal='not-called';const item=f.request(f.actor,{done:()=>terminal=f.h.getStreetSpeech(f.actor)});f.deferred[0].reject(Error('Fixture decode failure'));await f.flush();await f.flush();assert.equal(item.subtitleMode,'silent');assert.equal(f.h.getStreetSpeech(f.actor),null);f.h.finishStimulus(item,f.h.stimulusGeneration);assert.equal(terminal,null);assert.equal(item.actorSpeechStatus,'cancelled');
 f.h.state.voiceOn=false;f.request();assert.equal(f.h.getStreetSpeech(f.actor),null);f.h.hideWorldBark();f.h.state.voiceOn=true;f.request(null);assert.equal(f.h.getStreetSpeech(f.actor),null);
 return{silentDoneHasNoNativeProjection:true,voiceOffUnboundClosed:true};
});
actorTest('Dialogue actor default cannot inherit stale pointer; explicit noncity metadata retained',async f=>{
 f.h.state.characterSpeaker=f.other;f.h.openDialogue('CITY OWNER',[f.clip.source],'!',null,f.actor.voiceId,[f.clip.english]);assert.equal(f.h.state.dialogueData.actor,null);assert.equal(f.h.activeStimulus.actor,null);assert.equal(f.h.getStreetSpeech(f.other),null);
 f.h.openDialogue('EXPLICIT OWNER',[f.clip.source],'!',null,f.actor.voiceId,[f.clip.english],false,false,f.actor);assert.equal(f.h.state.dialogueData.actor,f.actor);assert.equal(f.h.activeStimulus.actor,f.actor);assert.equal(f.h.getStreetSpeech(f.actor).speechStatus,'queued');
 return{defaultDialogueActorUnbound:true,explicitActorIndependentOfStalePointer:true};
});
actorTest('Actual quiz answer captures physical owner before clear and keeps rewards/text',async f=>{
 const events=[];Object.assign(f.h,{uiTone(){},addGermanness:(n,label)=>events.push({n,label}),requestCharacterReaction(){},speechClip:id=>f.catalog.clips[id],showWorldBark:(...args)=>events.push({bark:args})});
 vm.runInContext(fn(source,'answerCitizenshipQuiz'),f.h);const q={answer:1,type:'civic',source:'OWNED',choices:['A','B','C','D']};Object.assign(f.h.state,{quizQuestion:q,quizCopy:q,quizCharacter:{name:'Owned Persona',title:'Own Title',voiceId:f.actor.voiceId},quizNpc:f.actor});f.h.answerCitizenshipQuiz(0);f.h.answerCitizenshipQuiz(0);
 const bark=events.find(e=>e.bark).bark;assert.equal(bark[5].actor,f.actor);assert.equal(bark[5].candidateVoiceId,f.actor.voiceId);assert.equal(f.h.state.quizNpc,null);assert.equal(events.filter(e=>e.n).length,1);assert.equal(events.find(e=>e.n).n,-1);
 return{capturedBeforeClear:true,wrongAnswerOnce:true,bodyOrRewardChanges:false};
});

actorTest('Neighbor protection rejects city speech and silent captions while retaining owned dialogue',async f=>{
 f.h.jwd.tour={actor:{id:'jwd-parent'}};
 for(const family of ['pedestrian','quiz','quiz-result','police','train']){
  assert.equal(f.h.stimulusEligible({family}),false);
  assert.equal(f.request(f.actor,{family}),null);assert.equal(f.h.stimulusQueue.length,0);assert.equal(f.deferred.length,0);
  let captionStarted=false;f.h.state.voiceOn=false;
  assert.equal(f.h.showWorldBark('CITY',f.clip.source,true,'','',{family,start:()=>captionStarted=true}),false);
  assert.equal(captionStarted,false);assert.equal(f.h.textOnlyBark,null);assert.equal(f.node('police-bark').hidden,true);f.h.state.voiceOn=true;
 }
 assert.equal(f.h.stimulusEligible({family:'dialogue'}),true);
 const dialogue=f.request();assert.equal(dialogue.actor,f.actor);await f.start();assert.equal(f.h.getStreetSpeech(f.actor).speechStatus,'playing');
});

actorTest('Protection entered during native decode retires city request; leaving permits same actor',async f=>{
 let done=0;const item=f.request(f.actor,{family:'pedestrian',done:()=>done++});assert(item);assert.equal(f.deferred.length,1);
 f.h.jwd.met.clear();Object.assign(f.h.player,{x:f.h.jwdLane.x,y:f.h.jwdLane.y});
 assert.equal(f.h.stimulusEligible(item),false);await f.start();assert.equal(f.sources.length,0);assert.equal(done,1);assert.equal(f.h.activeStimulus,null);assert.equal(f.h.getStreetSpeech(f.actor),null);
 f.h.player.x=f.h.jwdLane.x-121;assert.equal(f.h.stimulusEligible({family:'pedestrian'}),true);
 const retry=f.request(f.actor,{family:'pedestrian'});assert.equal(retry.actor,f.actor);await f.start(1);assert.equal(f.sources.length,1);assert.equal(f.h.getStreetSpeech(f.actor).speechStatus,'playing');
});
