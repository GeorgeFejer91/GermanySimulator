import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import * as S from '../street-character-sprites.js';
import {motionObserverSource} from './street-simulation-fixture-source.mjs';

for(const file of ['tourist-animation.js','character-interactions.js'])vm.runInThisContext(readFileSync(file,'utf8'));
const original=JSON.parse(readFileSync('assets/characters/street/manifest.json','utf8')).characters['crowd-irmgard-aktenordner'];
function person(){const p=structuredClone(original);p.atlasMotion.interactions={neutral:{...p.atlasMotion.neutral},states:{greet:{row:15,col:3,durations_ms:[50,120,80]},review:{row:15,col:8,durations_ms:[60,180,70]},success:{row:16,col:1,durations_ms:[50,140,80]}}};return p}
const manifest=p=>({schemaVersion:1,characters:{'reaction-fixture':{...p,id:'reaction-fixture',actorId:'reaction-fixture',aliases:[]}}});
const info=a=>S.inspectStreetSimulation(a);
async function ready(p=person()){
 S.registerStreetCharacterManifest(manifest(p));const actor={voiceId:'reaction-fixture',x:0,y:0},jobs=[],requests=[];
 const T={...THREE,TextureLoader:class{load(url,ok){requests.push({url,ok})}}};
 const view=S.createStreetCharacterSprite(T,actor,new THREE.Group(),(position,radius,task)=>{const job={task};jobs.push(job);return job},new THREE.PerspectiveCamera());
 async function admit(job,w,h){const pending=job.task();await Promise.resolve();requests.shift().ok(new THREE.Texture({width:w,height:h}));assert.equal(await pending,true)}
 await admit(jobs[0],p.standing.width,p.standing.height);await admit(view.prepareMotion(),p.variants.desktop.width,p.variants.desktop.height);view.sync();
 const scope=vm.createContext({state:{started:true},document:{hidden:false},window:{},player:{},npcs:[actor],police:[],console});
 vm.runInContext(motionObserverSource(readFileSync('game.js','utf8'))+'\nglobalThis.install=o=>streetMotionObserver=o;globalThis.held=holdStreetMovement;globalThis.accept=notifyStreetAccepted;globalThis.tick=finishStreetSimulationTick;',scope);
 scope.install({accepts:S.acceptsStreetSimulation,requestMove:S.requestStreetSimulationMove,accepted(a,x,y){assert(S.acceptStreetSimulationSegment(a,{fromRoot:[x*.02,0,y*.02],toRoot:[a.x*.02,0,a.y*.02],dx:a.x-x,dy:a.y-y,distance2d:Math.hypot(a.x-x,a.y-y)}))},tick(a,dt,paused,speechPaused){S.tickStreetSimulation(a,dt,{rootWorld:[a.x*.02,0,a.y*.02],paused,speechPaused,...scope.speech})},failed(a,error){assert.fail(error)}});
 const tick=(dt=.02)=>{scope.tick(dt);view.sync();return view.inspect().pose};
 const step=(dx=0,dy=1)=>{if(scope.held(actor,dx,dy))return false;const x=actor.x,y=actor.y;actor.x+=dx;actor.y+=dy;scope.accept(actor,x,y);return true};
 return{actor,view,scope,tick,step,p,T,requests};
}
function finish(f){for(let i=0;S.hasStreetReaction(f.actor);i++){assert(i<1500,'reaction must complete');f.tick()}}
function finishTurn(f){for(let i=0;info(f.actor).atlasMotion.plan;i++){assert(i<500);f.tick()}}

test('atlas interaction metadata validates all cells and dwell bounds before replacing the cast',()=>{
 for(const change of [p=>p.atlasMotion.interactions.neutral.row=99,p=>p.atlasMotion.interactions.neutral.col=1,p=>p.atlasMotion.interactions.states.greet.durations_ms=[],p=>p.atlasMotion.interactions.states.greet.durations_ms[0]=0,p=>p.atlasMotion.interactions.states.greet.col=p.grid[0]-1,p=>delete p.atlasMotion.interactions.states.greet.durations_ms[1],p=>p.atlasMotion.interactions.states.greet.durations_ms=Array(65).fill(50)]){
  const p=person();change(p);assert.throws(()=>S.registerStreetCharacterManifest(manifest(p)),/interaction/i);
 }
});

test('canonical image admission reuses existing asset families and rejects external or traversing paths',()=>{
 for(const family of ['street','street-speakers','residents']){const p=person();p.variants.desktop.file='./assets/characters/'+family+'/fixture/atlas.webp';assert.doesNotThrow(()=>S.registerStreetCharacterManifest(manifest(p)))}
 for(const path of ['https://example.com/assets/characters/street/atlas.webp','./assets/characters/street/../residents/atlas.webp','./assets/characters/unrelated/atlas.webp','./assets/characters/residents/atlas.png']){const p=person();p.variants.desktop.file=path;assert.throws(()=>S.registerStreetCharacterManifest(manifest(p)),/image path/)}
});

test('an admitted atlas can play real planner reactions from neutral without replaying walking cells',async()=>{
 const f=await ready();try{
  assert(f.view.canPlayReaction(['review','success']));assert.equal(f.view.canPlayReaction('missing'),false);
  const token={};assert(S.requestStreetReaction(f.actor,['review','success'],{token}));assert(S.hasStreetReaction(f.actor));
  assert.equal(f.step(1,0),false);assert.deepEqual([f.actor.x,f.actor.y],[0,0]);
  const first=f.tick(0);assert.equal(first.slot,f.p.atlasMotion.neutral.row*f.p.grid[0]+f.p.atlasMotion.neutral.col);assert.equal(first.holdPosition,true);
  const slots=[];for(let i=0;S.hasStreetReaction(f.actor);i++){assert(i<1500);slots.push(f.tick().slot)}
  for(const state of [f.p.atlasMotion.interactions.states.review,f.p.atlasMotion.interactions.states.success])for(let col=0;col<state.durations_ms.length;col++)assert(slots.includes(state.row*f.p.grid[0]+state.col+col));
  assert.equal(info(f.actor).distance,0);assert.equal(f.view.inspect().pose.holdPosition,false);assert.equal(info(f.actor).atlasMotion.facing,'down');
 }finally{f.view.dispose()}
});

test('walking settles, reacts and resumes its heading while the accepted-step observer holds root and gait distance',async()=>{
 const f=await ready();try{
  f.step(1,0);finishTurn(f);assert(f.step(4,0));f.tick();const distance=info(f.actor).distance,gait=info(f.actor).atlasMotion.gaitDistance,root=[f.actor.x,f.actor.y];
  assert(S.requestStreetReaction(f.actor,'greet',{token:{}}));const slots=[];
  for(let i=0;S.hasStreetReaction(f.actor);i++){assert(i<1500);assert.equal(f.step(-1,0),false);slots.push(f.tick().slot);assert.equal(info(f.actor).distance,distance);assert.deepEqual([f.actor.x,f.actor.y],root);if(S.hasStreetReaction(f.actor))assert.equal(info(f.actor).atlasMotion.gaitDistance,gait)}
  assert.equal(info(f.actor).atlasMotion.facing,'right');assert.equal(f.view.inspect().pose.holdPosition,false);assert(f.step(1,0));f.tick();assert.equal(info(f.actor).distance,distance+1);
 }finally{f.view.dispose()}
});

test('a queued reaction waits for its existing turn and ignores repeated and incidental replacement requests',async()=>{
 const f=await ready();try{
  f.step(1,0);const before=info(f.actor).atlasMotion;assert(before.plan);
  const token={};assert(S.requestStreetReaction(f.actor,'review',{token}));assert.equal(S.requestStreetReaction(f.actor,'review',{token}),false);assert.equal(S.requestStreetReaction(f.actor,'greet',{incidental:true}),false);
  assert.equal(f.step(-1,0),false);assert.equal(info(f.actor).atlasMotion.requested,'right');
  finishTurn(f);assert(S.hasStreetReaction(f.actor));finish(f);assert.equal(info(f.actor).atlasMotion.facing,'right');
 }finally{f.view.dispose()}
});

test('body pause freezes reaction timing while native speech remains independently owned',async()=>{
 const f=await ready();try{
  const cue={};f.scope.speech={speechStatus:'playing',cueToken:cue,mediaTime:.4,mediaDuration:5,mouthOpen:.7};
  assert(S.requestStreetReaction(f.actor,'greet',{token:{}}));f.tick(.15);const held=f.view.inspect().pose.slot;
  f.scope.state.modal=true;for(let i=0;i<5;i++)f.tick(.5);assert.equal(f.view.inspect().pose.slot,held);assert.equal(f.view.inspect().pose.mouthCue,.7);assert.equal(f.view.inspect().pose.speechStatus,'playing');
  f.scope.state.modal=false;finish(f);assert.equal(f.view.inspect().pose.speaking,true);
 }finally{f.view.dispose()}
});

test('token-scoped cancellation and preemption recover without a pose teleport or stale callback clearing the next action',async()=>{
 const f=await ready();try{
  const old={},next={},cue={};f.scope.speech={speechStatus:'playing',cueToken:cue,mediaTime:.4,mediaDuration:5,mouthOpen:.5};
  S.requestStreetReaction(f.actor,['greet','success'],{token:old});f.tick(.2);const prior=f.view.inspect().pose.slot;
  assert.equal(S.cancelStreetReaction(f.actor,{token:{},bodyOnly:true}),false);assert(S.cancelStreetReaction(f.actor,{token:old,bodyOnly:true}));assert.equal(f.view.inspect().pose.slot,prior);assert.equal(f.view.inspect().pose.speaking,true);
  assert(S.requestStreetReaction(f.actor,'review',{token:next,preempt:true}));assert.equal(S.cancelStreetReaction(f.actor,{token:old,bodyOnly:true}),false);
  finish(f);assert.equal(f.view.inspect().pose.holdPosition,false);assert.equal(info(f.actor).distance,0);
 }finally{f.view.dispose()}
});

test('missing interaction capability and reduced motion retain explicit support and bounded completion',async()=>{
 const p=person();delete p.atlasMotion.interactions;const f=await ready(p);try{assert.equal(f.view.canPlayReaction('greet'),false);assert.equal(S.requestStreetReaction(f.actor,'greet'),false);assert.equal(S.hasStreetReaction(f.actor),false)}finally{f.view.dispose()}
 const reduced=await ready();try{reduced.scope.speech={reducedMotion:true};assert(S.requestStreetReaction(reduced.actor,'review'));finish(reduced);assert.equal(reduced.view.inspect().pose.holdPosition,false)}finally{reduced.view.dispose()}
});

test('retirement and explicit source readmission cannot retain a stale reaction lock',async()=>{
 const f=await ready();try{
  S.requestStreetReaction(f.actor,'greet',{token:{}});f.tick(.2);assert(S.hasStreetReaction(f.actor));
  S.invalidateStreetSimulation(f.actor,'fixture discontinuity');assert(S.readmitStreetSimulationGeneration(f.actor,{rootWorld:[0,0,0],standingSha256:f.p.standing.sha256}));
  assert.equal(S.hasStreetReaction(f.actor),false);assert.equal(f.view.inspect().pose.holdPosition,false);
  S.requestStreetReaction(f.actor,'greet',{token:{}});f.tick(.2);f.view.dispose();assert.equal(S.hasStreetReaction(f.actor),false);assert.equal(info(f.actor).atlasMotion,null);
 }finally{f.view.dispose()}
});

test('a superseding visual owner retains the active reaction and old disposal cannot retire its controller',async()=>{
 const f=await ready();let replacement;try{
  S.requestStreetReaction(f.actor,'review',{token:{}});f.tick(.2);const previous=f.view.inspect().pose.slot,jobs=[];
  replacement=S.createStreetCharacterSprite(f.T,f.actor,new THREE.Group(),(position,radius,task)=>{const job={task};jobs.push(job);return job},new THREE.PerspectiveCamera());
  const standing=jobs[0].task();await Promise.resolve();f.requests.shift().ok(new THREE.Texture({width:f.p.standing.width,height:f.p.standing.height}));
  assert.equal(await standing,true);assert.equal(await replacement.prepareMotion().task(),true);replacement.sync();
  assert.equal(replacement.inspect().pose.slot,previous);assert(S.hasStreetReaction(f.actor));f.view.dispose();assert(S.hasStreetReaction(f.actor));finish(f);assert.equal(replacement.inspect().pose.holdPosition,false);
 }finally{replacement?.dispose();f.view.dispose()}
});
