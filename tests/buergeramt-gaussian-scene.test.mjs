import test from 'node:test';
import assert from 'node:assert/strict';
import {createAmtGaussianScene,amtActorOwnsSpeech} from '../buergeramt-gaussian-scene.js';
import {harness} from './amt-harness.mjs';
function fixture(mobile=false){
 const tasks=[],actor=(id,x,z)=>({id,mesh:{position:{x,z},material:{opacity:1}}}),clerk=actor('clerk',0,-2),regular=actor('archivbotin',1,-2);
 const state={generation:1,arc:null,pose:'ready',phase:1};
 const level={active:true,clerkPerformance:{animation:state},omen:{phase:''},characters:[{id:'archivbotin',mode:'work',animation:{generation:1,arc:null,pose:'work',phase:1}}]};
 const manager=createAmtGaussianScene({THREE:{},renderer:{},scene:{},queueLoad:task=>new Promise((resolve,reject)=>tasks.push(()=>Promise.resolve().then(task).then(resolve,reject))),mobile,reducedMotion:{matches:false}});
 return{tasks,manager,level,clerk,regular,update:()=>manager.update(level,[clerk],[regular],{position:{x:0,z:0}})};
}

test('desk-addressed queue speech stays on Knick when any counter is the lead',()=>{
 for(const assigned of [0,1,2,3,4])for(let counter=1;counter<=4;counter++){
  const lead=counter===(assigned||3),actor={id:'amt-brunhilde-knick',performance:true,counter,lipId:lead?'clerk':'clerk-'+counter};
  const id=lead?'clerk':'clerk-'+counter,speech={active:true,actor:'clerk-3'};
  assert.equal(amtActorOwnsSpeech(speech,id,actor),counter===3,`assigned ${assigned}, counter ${counter}`);
  assert.equal(amtActorOwnsSpeech({...speech,active:false},id,actor),false);
 }
 assert.equal(amtActorOwnsSpeech({active:true,actor:'archivbotin'},'archivbotin',{id:'archivbotin'}),true);
});
test('nearby consumers retain admitted slots without preparation churn',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{const f=fixture();for(let n=0;n<20;n++)f.update();assert.equal(f.tasks.length,2);assert.equal(f.manager.inspect().actors.length,2);f.manager.clear()}
 finally{globalThis.document=old}
});

test('a speaking non-lead counter owns the bounded mobile paint slot',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{
  const f=fixture(true),desk={...f.clerk,id:'amt-brunhilde-knick',animationId:'clerk-desk-4',performance:true,counter:4,lead:false,lipId:'clerk-4'};
  f.level.stationaryAnimations={'clerk-desk-4':{generation:1,arc:null,pose:'ready',phase:1}};
  f.level.lipSpeech={active:true,actor:'clerk-4',shape:[1,.25,0,0]};
  f.manager.update(f.level,[f.clerk,desk],[f.regular],{position:{x:0,z:0}});
  assert.deepEqual(f.manager.inspect().actors.map(actor=>actor.id),['clerk-desk-4']);
  assert.equal(f.manager.inspect().actors.length,1);f.manager.clear();
 }finally{globalThis.document=old}
});
test('a queued job skipped while hidden releases its slot and can retry on return',async()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{const f=fixture(true);f.update();assert.equal(f.tasks.length,1);document.hidden=true;await f.tasks[0]();await new Promise(r=>setImmediate(r));assert.equal(f.manager.inspect().actors.length,0);document.hidden=false;f.update();assert.equal(f.tasks.length,2);f.manager.clear()}
 finally{globalThis.document=old}
});
test('hidden simulation calls cannot separate route/gait from Gaussian action time',()=>{
 const h=harness();h.enter();const actors=h.level.characters,clerk=h.level.clerkPerformance.animation;h.hide();h.level.update(.1);assert.deepEqual(h.level.characters,actors);assert.deepEqual(h.level.clerkPerformance.animation,clerk);
});

test('only the isolated speaker prepares a cloud; ordinary actors resume their slots after release',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{const f=fixture();f.level.fever={active:true,id:'archivbotin',strength:.5};f.update();
  assert.deepEqual(f.manager.inspect().actors.map(a=>a.id),['archivbotin']);assert.equal(f.tasks.length,1);
  f.level.fever.active=false;f.update();assert.equal(f.tasks.length,2);assert.equal(f.manager.inspect().actors.length,2);f.manager.clear();
 }finally{globalThis.document=old}
});

test('a frozen background patron releases the single mobile slot to the isolated speaker',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{
  const f=fixture(true);f.clerk.mesh.position.x=20;
  const patron={id:'konrad',name:'konrad',animationId:'konrad',mesh:{position:{x:0,z:-2},material:{opacity:1}}};
  f.level.stationaryAnimations={konrad:{generation:1,arc:'work-gesture-work',phase:.4,pose:'gesture'}};
  const update=()=>f.manager.update(f.level,[f.clerk,patron],[f.regular],{position:{x:0,z:0}});
  update();assert.deepEqual(f.manager.inspect().actors.map(a=>a.id),['konrad']);
  // Dialogue freezes this background phase while it hides its Gaussian paint.
  f.level.characterMood={id:'archivbotin'};f.level.fever={active:true,id:'archivbotin',strength:.5};
  for(let n=0;n<20;n++)update();
  assert.deepEqual(f.manager.inspect().actors.map(a=>a.id),['archivbotin']);
  assert.equal(f.tasks.length,2,'prepare the new speaker once, without waiting for the frozen patron');
  assert.equal(patron.mesh.material.opacity,1,'restore the existing background sprite');
  assert.equal(f.manager.inspect().actors.length,1,'preserve the mobile residency cap');
  f.manager.clear();assert.equal(f.manager.inspect().actors.length,0);
 }finally{globalThis.document=old}
});
