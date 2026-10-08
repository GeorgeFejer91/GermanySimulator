import test from 'node:test';
import assert from 'node:assert/strict';
import {createAmtGaussianScene} from '../buergeramt-gaussian-scene.js';
import {harness} from './amt-harness.mjs';
function fixture(mobile=false){
 const tasks=[],actor=(id,x,z)=>({id,mesh:{position:{x,z},material:{opacity:1}}}),clerk=actor('clerk',0,-2),regular=actor('archivbotin',1,-2);
 const state={generation:1,arc:null,pose:'ready',phase:1};
 const level={active:true,clerkPerformance:{animation:state},omen:{phase:''},characters:[{id:'archivbotin',mode:'work',animation:{generation:1,arc:null,pose:'work',phase:1}}]};
 const manager=createAmtGaussianScene({THREE:{},renderer:{},scene:{},queueLoad:task=>new Promise((resolve,reject)=>tasks.push(()=>Promise.resolve().then(task).then(resolve,reject))),mobile,reducedMotion:{matches:false}});
 return{tasks,manager,level,update:()=>manager.update(level,[clerk],[regular],{position:{x:0,z:0}})};
}
test('nearby consumers retain admitted slots without preparation churn',()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{const f=fixture();for(let n=0;n<20;n++)f.update();assert.equal(f.tasks.length,2);assert.equal(f.manager.inspect().actors.length,2);f.manager.clear()}
 finally{globalThis.document=old}
});
test('a queued job skipped while hidden releases its slot and can retry on return',async()=>{
 const old=globalThis.document;globalThis.document={hidden:false};
 try{const f=fixture(true);f.update();assert.equal(f.tasks.length,1);document.hidden=true;await f.tasks[0]();await new Promise(r=>setImmediate(r));assert.equal(f.manager.inspect().actors.length,0);document.hidden=false;f.update();assert.equal(f.tasks.length,2);f.manager.clear()}
 finally{globalThis.document=old}
});
test('hidden simulation calls cannot separate route/gait from Gaussian action time',()=>{
 const h=harness();h.enter();const actors=h.level.characters,clerk=h.level.clerkPerformance.animation;h.hide();h.level.update(.1);assert.deepEqual(h.level.characters,actors);assert.deepEqual(h.level.clerkPerformance.animation,clerk);
});
