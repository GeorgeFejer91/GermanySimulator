import test from 'node:test';
import assert from 'node:assert/strict';
import {createAmtSplatOwner,createOmenSplat} from '../buergeramt-splat.js';

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}}
async function fixture(){
 let time=0;
 const members=new Set(),scene={add:x=>members.add(x),remove:x=>members.delete(x)};
 const jobs=[];
 class SparkRenderer{
  constructor(options){this.options=options;this.visible=false;this.activeSplats=12;this.disposals=0;this.dirty=0}
  setDirty(){this.dirty++}
  update(){const job=deferred();jobs.push(job);return job.promise}
  dispose(){this.disposals++}
 }
 class SplatMesh{
  constructor(){this.visible=true;this.disposals=0;this.matrices=0;this.position={set(){},copy(){}};this.rotation={y:0};this.quaternion={copy(){}};this.scale={setScalar(){}}}
  initialized=Promise.resolve();
  updateMatrixWorld(){this.matrices++}
  dispose(){this.disposals++}
 }
 const dyno={Gsplat:'Gsplat',dynoFloat:value=>({value}),dynoVec2:value=>({value}),dynoBlock:()=>({})};
 const owner=await createAmtSplatOwner({THREE:{},renderer:{},scene,signal:new AbortController().signal,sparkModule:{SparkRenderer,SplatMesh,dyno},nowMs:()=>time});
 return{owner,scene,members,jobs,SplatMesh,setTime:value=>time=value};
}

test('one pinned renderer updates at bounded cadence without overlapping sorts',async()=>{
 const f=await fixture(),{owner}=f,mesh=owner.attach(new f.SplatMesh()),camera={};
 assert.equal(owner.spark.options.autoUpdate,false);
 assert.equal(owner.spark.options.minSortIntervalMs,0);
 assert.equal(owner.spark.options.depthTest,true);
 assert.equal(owner.spark.options.depthWrite,false);
 assert.equal(owner.spark.options.maxStdDev,Math.sqrt(5));
 const first=owner.update(camera,60);await Promise.resolve();assert.equal(f.jobs.length,1);
 f.setTime(20);assert.equal(owner.update(camera,60),first);assert.equal(f.jobs.length,1);
 f.jobs[0].resolve();await first;
 f.setTime(10);assert.equal(owner.update(camera,60),null);
 f.setTime(17);const second=owner.update(camera,60);await Promise.resolve();assert.equal(f.jobs.length,2);
 f.jobs[1].resolve();await second;
 f.setTime(40);assert.equal(owner.update(camera,30),null);
 f.setTime(51);const third=owner.update(camera,30);await Promise.resolve();assert.equal(f.jobs.length,3);
 f.jobs[2].resolve();await third;
 assert.equal(mesh.matrices,3);assert.equal(owner.spark.dirty,3);
 await owner.dispose();assert.equal(owner.spark.disposals,1);
});

test('retirement detaches immediately but frees mesh and texture only after readback',async()=>{
 const f=await fixture(),{owner}=f,mesh=owner.attach(new f.SplatMesh()),camera={};
 const sorted=owner.update(camera);await Promise.resolve();
 let textures=0;owner.retire(mesh,()=>textures++);
 assert.equal(f.members.has(mesh),false);assert.equal(mesh.visible,false);
 assert.equal(mesh.disposals,0);assert.equal(textures,0);assert.equal(owner.inspect().retired,1);
 f.jobs[0].resolve();await sorted;
 assert.equal(mesh.disposals,1);assert.equal(textures,1);assert.equal(owner.inspect().retired,0);
 owner.retire(mesh,()=>textures++);assert.equal(mesh.disposals,1);assert.equal(textures,1);
 await owner.dispose();
});

test('dispose detaches the whole owner immediately and awaits pending cleanup once',async()=>{
 const f=await fixture(),{owner}=f,a=owner.attach(new f.SplatMesh()),b=owner.attach(new f.SplatMesh());
 owner.update({});await Promise.resolve();
 const done=owner.dispose();assert.equal(owner.dispose(),done);
 assert.equal(f.members.has(owner.spark),false);assert.equal(f.members.has(a),false);assert.equal(f.members.has(b),false);
 assert.equal(a.disposals,0);assert.equal(b.disposals,0);assert.equal(owner.spark.disposals,0);
 f.jobs[0].resolve();await done;
 assert.equal(a.disposals,1);assert.equal(b.disposals,1);assert.equal(owner.spark.disposals,1);
 assert.equal(owner.inspect().ready,false);
});

test('sort failure hides all splats, reports fallback, and settles without rejection',async()=>{
 const f=await fixture(),{owner}=f,mesh=owner.attach(new f.SplatMesh());
 const sorted=owner.update({});await Promise.resolve();f.jobs[0].reject(new Error('readback failed'));
 await sorted;
 assert.equal(owner.inspect().failure,'readback failed');assert.equal(owner.inspect().ready,false);
 assert.equal(owner.spark.visible,false);assert.equal(mesh.visible,false);
 assert.equal(owner.update({}),null);
 await owner.dispose();assert.equal(owner.spark.disposals,1);assert.equal(mesh.disposals,1);
});

test('an omen with a provided owner attaches and retires only its meshes',async()=>{
 const f=await fixture(),{owner}=f,originalFetch=globalThis.fetch;
 class Vector2{set(x,y){this.x=x;this.y=y}}
 class Vector3{set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(32)});
 try{
  const omen=await createOmenSplat({THREE:{Vector2,Vector3},renderer:{},scene:f.scene,signal:new AbortController().signal,owner});
  assert.equal(owner.inspect().meshes,2);
  assert.equal(f.jobs.length,0);
  assert.equal(omen.update({phase:''},{},{}),0);
  assert.equal(f.jobs.length,0);
  omen.dispose();assert.equal(owner.inspect().meshes,0);
  assert.equal(owner.inspect().ready,true);
  assert.equal(owner.spark.disposals,0);
  await owner.dispose();assert.equal(owner.spark.disposals,1);
 }finally{globalThis.fetch=originalFetch}
});

test('an existing actor sort cannot start the omen crossfade before omen meshes are sorted',async()=>{
 const f=await fixture(),{owner}=f,originalFetch=globalThis.fetch;
 class Vector2{set(x,y){this.x=x;this.y=y}}
 class Vector3{set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
 const THREE={Vector2,Vector3,MathUtils:{degToRad:degrees=>degrees*Math.PI/180}};
 const camera={fov:70,position:{x:0,z:3},quaternion:{},updateMatrixWorld(){},worldToLocal:target=>target};
 const actor={position:{x:1,z:-2},rotation:{y:0}};
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(32)});
 try{
  owner.attach(new f.SplatMesh());
  const actorSort=owner.update(camera);await Promise.resolve();
  const omen=await createOmenSplat({THREE,renderer:{},scene:f.scene,signal:new AbortController().signal,owner});
  const state={phase:'blackout',revealTime:1.2,strength:1,life:{time:1.2,depth:.9,opacity:1,pressure:1,pulse:0}};
  assert.equal(omen.update(state,actor,camera),0);
  f.jobs[0].resolve();await actorSort;
  assert.equal(omen.update(state,actor,camera),0);
  f.setTime(20);const omenSort=owner.update(camera);await Promise.resolve();f.jobs[1].resolve();await omenSort;
  assert(omen.update(state,actor,camera)>0);
  omen.dispose();await owner.dispose();
 }finally{globalThis.fetch=originalFetch}
});
