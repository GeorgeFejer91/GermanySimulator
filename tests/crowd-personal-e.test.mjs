import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
const sourceRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const game=readFileSync(resolve(sourceRoot,'game.js'),'utf8');
const catalogScope={window:{},location:{search:''},URLSearchParams};
vm.runInNewContext(readFileSync(resolve(sourceRoot,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),catalogScope);
const catalog=catalogScope.window.GermanySimulatorAudioText;
function functionSource(name,source=game){
 const start=source.indexOf(`function ${name}(`);assert.notEqual(start,-1,name);
 const signature=source.slice(start).match(/\)\s*\{/);assert.ok(signature,name);
 const body=source.indexOf('{',start+signature.index);let depth=0;
 for(let index=body;index<source.length;index++){
  if(source[index]==='{')depth++;
  else if(source[index]==='}'&&--depth===0)return source.slice(start,index+1);
 }
 throw Error('Unclosed source function: '+name);
}
const dataStart=game.indexOf('const crowdArchetypes='),dataEnd=game.indexOf('\n',game.indexOf('const crowdArchetypeOrder='));
const crowdData=game.slice(dataStart,dataEnd);
function harness(region='germany',voiceOn=true){
 const elements=new Map(),timers=[],history=[],events=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:true,textContent:'',disabled:false,classList:{toggle(){},remove(){}}});return elements.get(id)};
 const state={started:true,modal:false,dialogue:false,gameOver:false,region,lang:'en',voiceOn,subtitlesOn:true,mission:2,forms:1,wanted:0};
 const scope=vm.createContext({state,npcs:[],police:[],player:{x:0,y:0},buildings:[],props:[],normObjects:[],goerlitzerPark:{plaqueX:9999,plaqueY:9999},kiesingerMemorial:{x:9999,y:9999},jwd:{tour:null},
  window:{Germany3D:{levelTransition:{active:false}}},document:{getElementById:element,querySelector:element},speechCatalog:catalog,
  performance:{now:()=>10000},Math,STIMULUS_PRIORITY:{CRITICAL:100,REACTIVE:50},AUDIO_MIX:{REQUIRED_GAP_MS:250,AMBIENT_GAP_MS:2500,AMBIENT_TTL_MS:4000,MAX_TRANSIENT_QUEUE:4},
  npcLines:['GENERIC_ZERO','GENERIC_ONE','GENERIC_TWO','GENERIC_THREE'],npcDenglisch:['GENERIC_BERLIN_ZERO','GENERIC_BERLIN_ONE','GENERIC_BERLIN_TWO','GENERIC_BERLIN_THREE'],
  dist:(x,y,a,b)=>Math.hypot(x-a,y-b),neighborActivityActive:()=>false,currentMission:()=>({target:'fixture-office'}),
  requestCharacterReaction:(actor,names)=>{events.push({kind:'reaction',actor,names});return true},
  innerMonologue:(...args)=>events.push({kind:'inner',args}),toast:text=>events.push({kind:'toast',text}),interactBuilding:building=>events.push({kind:'building',building}),
  stopRecordedSpeech:()=>events.push({kind:'stop-recorded'}),clearSubtitle:()=>events.push({kind:'clear-caption'}),hideWorldBark:()=>{},cancelHumorScold:()=>{},setAudioText:()=>{},
  startSubtitle:item=>events.push({kind:'subtitle',text:item.text,english:item.subtitle}),
  setTimeout:(callback,delay)=>{timers.push({callback,delay,cleared:false});return timers.length},clearTimeout:id=>{if(timers[id-1])timers[id-1].cleared=true},
  setInterval:()=>0,clearInterval:()=>{},history,events
 });
 vm.runInContext(readFileSync(resolve(sourceRoot,'street-wisdom.js'),'utf8'),scope);scope.StreetWisdom=scope.window.StreetWisdom;
 const declarations=['crowdNames','crowdVoiceIds'].map(name=>game.match(new RegExp(`const ${name}=[^\\n]+;`))[0]).join('\n');
 const names=['addCrowdPedestrian','personalCrowdDialogue','worldNpcLine','cityInteractionTarget','interact','openDialogue','setDialogueVoiceBusy','speakDialogueLine','renderDialogue','nextDialogue','speak','queueStimulus','stimulusEligible','citySpeechAllowed','stopSpeech','finishStimulus','playCaptionStimulus','playSyntheticStimulus'];
 vm.runInContext(`let crowdIndex=0,stimulusQueue=[],activeStimulus=null,stimulusTimer=null,stimulusGeneration=1,recordedSpeechSource=null,recordedSpeechGain=null,nextAmbientAt=0,textOnlyBark=null;
 const quizCharacterLibrary={characters:[]};
 ${crowdData}\n${declarations}\n${names.map(name=>functionSource(name)).join('\n')}
 function pumpStimuli(){if(activeStimulus||!stimulusQueue.length)return;activeStimulus=stimulusQueue.shift();history.push(activeStimulus);if(!activeStimulus.recording)playSyntheticStimulus(activeStimulus,stimulusGeneration)}
 function showWorldBark(speaker,text,urgent,recording,placement,options){events.push({kind:'silent-caption',speaker,text,options});options.start?.();}
 for(let index=0;index<24;index++)addCrowdPedestrian(5000+index*100,5000,12,0,4900,8000,false);
 globalThis.fixture={choose(voiceId){const actor=npcs.find(n=>n.voiceId===voiceId);if(!actor)throw Error('No actual spawned persona');actor.x=0;actor.y=0;return actor},active:()=>activeStimulus,generation:()=>stimulusGeneration,queue:()=>stimulusQueue,installAmbient(actor){activeStimulus={actor,family:'pedestrian:old',actorSpeechStatus:'playing'};stimulusQueue.push({actor,family:'pedestrian:queued'});return activeStimulus},start(item){item.subtitleMode='recorded';item.speechStarted=true;item.start?.(item)},finish(item,generation=stimulusGeneration){finishStimulus(item,generation)}};
 `,scope,{timeout:2000});
 return {scope,state,elements,timers,history,events,actor:voice=>scope.fixture.choose(voice),run:script=>vm.runInContext(script,scope,{timeout:1000}),fixture:scope.fixture};
}
test('actual E target/handler opens all nine ordinary profiles with exact regional source and English pairs',()=>{
 const authority=vm.createContext({});vm.runInContext(crowdData+'\nglobalThis.personal=crowdCharacterBarks',authority);
 for(const region of ['germany','berlin'])for(const voiceId of Object.keys(authority.personal)){
  const h=harness(region),actor=h.actor(voiceId);h.run('interact()');
  assert.equal(h.state.dialogue,true);assert.equal(h.state.modal,true);assert.equal(h.state.dialogueData.actor,actor);assert.equal(h.state.dialogueData.voiceId,voiceId);
  assert.deepEqual(Array.from(h.state.dialogueData.lines),Array.from(authority.personal[voiceId][region]));
  assert.deepEqual(Array.from(h.state.dialogueData.subtitles),Array.from(catalog.pools.crowdPersonalized[voiceId][region]));
  assert.equal(h.history.length,1);const request=h.history[0];
  assert.equal(request.actor,actor);assert.equal(request.actorId,actor.id);assert.equal(request.actorVoiceId,voiceId);assert.equal(request.actorProfileId,catalog.productionVoices[voiceId].profileId);
  assert.equal(request.subtitle,catalog.pools.crowdPersonalized[voiceId][region][0]);
  assert.equal(request.recording,catalog.candidateClip(voiceId,authority.personal[voiceId][region][0]));
  assert.equal(h.state.mission,2);assert.equal(h.state.forms,1);assert.equal(h.state.wanted,0);
 }
});
test('modal takeover cancels old ambient work and stale completions cannot replace the next owned line',()=>{
 const h=harness(),actor=h.actor('crowd-baerbel-brezel'),old=h.fixture.installAmbient(actor);h.run('interact()');
 assert.equal(old.actorSpeechStatus,'cancelled');assert.equal(h.fixture.queue().length,0);assert.equal(h.history.length,1);
 const first=h.history[0],generation=h.fixture.generation();h.fixture.start(first);assert.equal(h.elements.get('dialogue').hidden,false);
 h.run('interact()');assert.equal(h.state.dialogueData.i,1);assert.equal(h.history.length,2);const second=h.history[1];
 assert.notEqual(first.cueToken,second.cueToken);assert.equal(h.state.dialogueVoiceBusy,true);assert.equal(h.elements.get('dialogue').hidden,true);
 first.start?.();first.done?.();h.fixture.finish(first,generation);
 assert.equal(h.fixture.active(),second);assert.equal(h.state.dialogueData.i,1);assert.equal(h.state.dialogueData.lineComplete,false);assert.equal(h.state.dialogueVoiceBusy,true);assert.equal(h.elements.get('dialogue').hidden,true);
 h.fixture.start(second);h.fixture.finish(second);h.run('interact()');
 assert.equal(h.state.dialogue,false);assert.equal(h.state.modal,false);assert.equal(h.events.filter(row=>row.kind==='inner').length,1);
});
test('held first line uses current caption fallback and next exact line keeps the same individual profile',()=>{
 const h=harness(),actor=h.actor('crowd-irmgard-aktenordner');h.run('interact()');const first=h.history[0];
 assert.equal(first.recording,null);assert.equal(catalog.productionVoices[actor.voiceId].fallback,'captions');assert.equal(first.subtitleMode,'silent');assert.equal(h.elements.get('dialogue').hidden,false);
 assert.equal(h.events.filter(row=>row.kind==='subtitle').at(-1).english,catalog.pools.crowdPersonalized[actor.voiceId].germany[0]);
 h.run('interact()');const second=h.history[1];assert.equal(second.actorVoiceId,actor.voiceId);assert.equal(second.actorProfileId,first.actorProfileId);assert.equal(second.recording,catalog.candidateClip(actor.voiceId,h.state.dialogueData.lines[1]));assert.ok(second.recording);
});
test('voice-off remains readable; unrelated targets and invalid ownership keep existing routes',()=>{
 const h=harness('berlin',false),actor=h.actor('crowd-hildegard-brotzeit');h.run('interact()');
 assert.equal(h.history.length,0);assert.equal(h.elements.get('dialogue').hidden,false);assert.equal(h.state.dialogueData.actor,actor);assert.equal(h.state.dialogueData.voiceId,actor.voiceId);
 const silent=h.events.find(row=>row.kind==='silent-caption');assert.equal(silent.text,h.state.dialogueData.lines[0]);assert.equal(silent.options.subtitle,catalog.pools.crowdPersonalized[actor.voiceId].berlin[0]);
 for(const property of ['quizzer','quizCharacterId','wisdomId','jwdRole','special']){
  const plain=harness(),n=plain.actor('crowd-baerbel-brezel');n[property]=true;plain.scope.person=n;assert.equal(plain.run('personalCrowdDialogue(person)'),null);
 }
 const office=harness();office.actor('crowd-baerbel-brezel');office.scope.buildings.push({id:'fixture-office',doorX:0,doorY:0});office.run('interact()');assert.equal(office.history.length,0);assert.equal(office.events.find(row=>row.kind==='building').building.id,'fixture-office');
 for(const property of ['arrested','lawPending']){const invalid=harness(),n=invalid.actor('crowd-baerbel-brezel');n[property]=true;invalid.run('interact()');assert.equal(invalid.state.dialogue,false);assert.equal(invalid.history.length,0)}
 const malformed=harness(),n=malformed.actor('crowd-baerbel-brezel');malformed.scope.person=n;
 malformed.scope.speechCatalog={...catalog,pools:{...catalog.pools,crowdPersonalized:{...catalog.pools.crowdPersonalized,[n.voiceId]:{...catalog.pools.crowdPersonalized[n.voiceId],germany:['INCOMPLETE_TRANSLATION_FIXTURE']}}}};
 assert.equal(malformed.run('personalCrowdDialogue(person)'),null);malformed.run('interact()');assert.deepEqual(Array.from(malformed.state.dialogueData.lines),[malformed.scope.npcLines[n.line],malformed.scope.npcLines[(n.line+3)%malformed.scope.npcLines.length]]);
});
