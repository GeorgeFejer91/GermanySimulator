import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const game=readFileSync('game.js','utf8');

test('street advisers face accepted displacement and hold their gait while stopped',()=>{
 const source=readFileSync('world3d.js','utf8'),start=source.indexOf('  function syncChar('),end=source.indexOf('\n  }',start),q={userData:{worldX:0,worldY:0,...Object.fromEntries(['ll','rl','la','ra'].map(part=>[part,{rotation:{x:0}}]))},position:{set(){}},rotation:{y:1}},o={wisdomId:'street-waltraud-wartemarke',x:0,y:1,vx:12,vy:0,pause:0};
 const h=vm.createContext({q,o,X:x=>x,Z:y=>y,bridge:{player:{x:5,y:1},stationElevation:()=>0}});vm.runInContext(source.slice(start,end+4)+';syncChar(q,o)',h);
 assert.equal(q.rotation.y,0,'a perpendicular avoidance step faces its accepted movement');const phase=q.userData.walkPhase;
 o.vx=-12;vm.runInContext('syncChar(q,o)',h);assert.equal(q.rotation.y,0);assert.equal(q.userData.walkPhase,phase);
 o.pause=1;vm.runInContext('syncChar(q,o)',h);assert.equal(q.rotation.y,Math.PI/2,'stopped speech faces the nearby player');assert.equal(q.userData.walkPhase,phase);
 o.y=2;vm.runInContext('syncChar(q,o)',h);assert.equal(q.rotation.y,0,'escort movement follows accepted travel even during a retained speech pause');assert(q.userData.walkPhase>phase);
});

test('a boxed adviser waits until a swept body-clear exit opens',()=>{
 const person={x:0,y:0},h=vm.createContext({person,blocked:true,responderBlocked:(x,y)=>h.blocked&&(Math.abs(x)>1||Math.abs(y)>1)});vm.runInContext(sourceOf('streetWisdomCanMove'),h);
 assert.equal(vm.runInContext('streetWisdomCanMove(person)',h),false);
 assert.deepEqual(person,{x:0,y:0},'checking an exit never moves the person');
 h.blocked=false;assert.equal(vm.runInContext('streetWisdomCanMove(person)',h),true);
});

test('slow advisers leave a body-clear lane for ordinary same-direction walkers',()=>{
 const h=vm.createContext({npcs:[],groundStaticMotionBlocked:()=>false});vm.runInContext(sourceOf('pedestrianLane'),h);
 for(const vertical of [false,true])for(const direction of [-1,1]){
  const actor={routeBounds:{x:0,y:0,w:72,h:72},vx:vertical?0:12*direction,vy:vertical?12*direction:0},ordinary=h.pedestrianLane(actor),wisdom=h.pedestrianLane({...actor,wisdomId:'street-waltraud-wartemarke'});
  assert(Math.abs(ordinary-wisdom)>26,'two radius-13 bodies can pass without overlap');assert(wisdom>=13&&wisdom<=59);
 }
});
test('advisers step into the other legal lane for nearby ordinary oncoming traffic',()=>{
 const h=vm.createContext({npcs:[],pedestrianRouteContains:()=>true,groundStaticMotionBlocked:()=>false});vm.runInContext(sourceOf('pedestrianLane'),h);
 for(const vertical of [false,true])for(const direction of [-1,1]){
  const actor={x:200,y:200,routeBounds:{x:100,y:100,w:400,h:400},wisdomId:'street-waltraud-wartemarke',vx:vertical?0:12*direction,vy:vertical?12*direction:0},other={x:actor.x+(vertical?0:60*direction),y:actor.y+(vertical?60*direction:0),vx:-actor.vx,vy:-actor.vy};
  h.npcs=[actor,other];const lane=h.pedestrianLane(actor),oncoming=h.pedestrianLane(other.routeBounds?other:{...other,routeBounds:actor.routeBounds});assert(Math.abs(lane-oncoming)>26);
  const baseline=h.pedestrianLane({...actor,wisdomId:undefined});assert.equal(lane,baseline);
  other.arrested=true;assert.notEqual(h.pedestrianLane(actor),lane);other.arrested=false;
  if(vertical)other.y=actor.y-40*direction;else other.x=actor.x-40*direction;assert.notEqual(h.pedestrianLane(actor),lane,'the adviser returns after the passing body clears');
 }
});
function sourceOf(name){const start=game.indexOf(`function ${name}(`);assert(start>=0);let depth=0,opened=false;for(let i=start;i<game.length;i++){if(game[i]==='{'){depth++;opened=true}else if(game[i]==='}'&&opened&&--depth===0)return game.slice(start,i+1)}throw Error(name)}
function fixture(){
 const context=vm.createContext({window:{},performance:{now:()=>context.clock},clock:25000,requests:[],busy:false,hudUpdates:0});
 vm.runInContext(readFileSync('street-wisdom.js','utf8'),context);context.StreetWisdom=context.window.StreetWisdom;
 vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);
 vm.runInContext(`const speechCatalog=window.GermanySimulatorAudioText;
 const state={started:true,modal:false,gameOver:false,rule:7,ruleTimer:10};
 const player={x:0,y:0},definition=StreetWisdom.definitions[0],person={id:definition.id,wisdomId:definition.id,voiceId:definition.voiceId,name:definition.displayName,x:100,y:0,wisdomRuleCursor:0},npcs=[person];
 const STIMULUS_PRIORITY={AMBIENT:1,NEARBY:3};
 const dist=(x,y,a,b)=>Math.hypot(x-a,y-b),stimulusBusy=()=>busy,hasStimulusFamily=()=>false;
 const speechClip=id=>speechCatalog.clips[id],showWorldBark=(...args)=>requests.push(args),updateHud=()=>hudUpdates++;
 ${sourceOf('announceCurrentRule')}
 globalThis.api={state,player,person,announceCurrentRule};`,context);
 return context;
}
test('rules belong to a nearby adviser and commit HUD and cooldown only on speech start',()=>{
 const h=fixture(),{state,player,person,announceCurrentRule}=h.api;
 assert.equal(announceCurrentRule(),true);assert.equal(h.requests.length,1);
 const [speaker,text,urgent,recording,placement,options]=h.requests[0];
 assert.match(speaker,/WALTRAUD WARTEMARKE/);assert.equal(options.candidateVoiceId,person.voiceId);assert.equal(recording,'');
 assert.equal(text,h.window.GermanySimulatorAudioText.rules[0][1]);assert(options.subtitle);
 assert.equal(state.rule,7);assert.equal(person.wisdomSpokeAt,undefined);assert.equal(person.wisdomRuleCursor,0);
 player.x=400;assert.equal(options.isEligible(),false);player.x=0;person.arrested=true;assert.equal(options.isEligible(),false);person.arrested=false;
 options.start();assert.equal(state.rule,0);assert.equal(state.ruleTimer,0);assert.equal(person.wisdomSpokeAt,25);assert.equal(person.wisdomRuleCursor,1);assert.equal(h.hudUpdates,1);
 assert.equal(announceCurrentRule(),false);h.clock=49000;assert.equal(announceCurrentRule(),true);
 assert.equal(h.requests[1][1],h.window.GermanySimulatorAudioText.rules[3][1]);
});
test('distant, arrested, office, modal and occupied encounters emit no rule popup',()=>{
 const h=fixture(),{state,player,person,announceCurrentRule}=h.api;
 player.x=400;assert.equal(announceCurrentRule(),false);player.x=0;
 person.arrested=true;assert.equal(announceCurrentRule(),false);person.arrested=false;
 h.window.BuergeramtLevel={active:true};assert.equal(announceCurrentRule(),false);h.window.BuergeramtLevel.active=false;
 state.modal=true;assert.equal(announceCurrentRule(),false);state.modal=false;h.busy=true;assert.equal(announceCurrentRule(),false);
 assert.equal(h.requests.length,0);
});
test('missing fixed street recordings keep the broker and captions without browser synthesis',()=>{
 let starts=0,captions=0,finished=0,timeout;
 const item={text:'An exact street rule.',candidateVoiceId:'crowd-waltraud-wartemarke',start:()=>starts++};
 const h=vm.createContext({item,stimulusEligible:()=>true,performance:{now:()=>1000},setTimeout:(callback)=>{timeout=callback;return 1},startSubtitle:()=>captions++,finishStimulus:()=>finished++});
 vm.runInContext(`const speechCatalog={productionVoices:{'crowd-waltraud-wartemarke':{fallback:'captions'}}};let activeStimulus=item,stimulusGeneration=3,stimulusTimer;${sourceOf('playCaptionStimulus')};${sourceOf('playSyntheticStimulus')};playSyntheticStimulus(item,3);`,h);
 assert.equal(starts,1);assert.equal(captions,1);assert.equal(finished,0);assert.equal(item.subtitleMode,'silent');assert(item.subtitleDuration>0);timeout();assert.equal(finished,1);
});
