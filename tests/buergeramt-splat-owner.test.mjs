import test from 'node:test';
import assert from 'node:assert/strict';
import {createAmtSplatOwner,createOmenSplat} from '../buergeramt-splat.js';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}}
async function fixture(actorLayer=0){
 let time=0;
 const members=new Set(),scene={add:x=>members.add(x),remove:x=>members.delete(x)};
 const jobs=[],cameras=[];
 class SparkRenderer{
  constructor(options){this.options=options;this.material={depthTest:options.depthTest};this.layers={set(value){this.mask=1<<value}};this.visible=false;this.activeSplats=12;this.disposals=0;this.dirty=0}
  setDirty(){this.dirty++}
  update({camera}){cameras.push(camera);const job=deferred();jobs.push(job);return job.promise}
  dispose(){this.disposals++}
 }
 class SplatMesh{
  constructor(){this.visible=true;this.userData={};this.disposals=0;this.matrices=0;this.position={set(){},copy(){}};this.rotation={y:0};this.quaternion={copy(){}};this.scale={setScalar(){}}}
  initialized=Promise.resolve();
  updateMatrixWorld(){this.matrices++}
  dispose(){this.disposals++}
 }
 const dyno={Gsplat:'Gsplat',dynoFloat:value=>({value}),dynoVec2:value=>({value}),dynoBlock:()=>({})};
 const renderer={setTransparentSort(value){this.sort=value}},camera={name:'office-camera'};
 const owner=await createAmtSplatOwner({THREE:{},renderer,scene,camera,actorLayer,signal:new AbortController().signal,sparkModule:{SparkRenderer,SplatMesh,dyno},nowMs:()=>time});
 return{owner,renderer,scene,camera,members,jobs,cameras,SplatMesh,setTime:value=>time=value};
}
test('paint preparation uses the existing native renderer and office scene, rejecting retirement',async()=>{
 const f=await fixture(1),gate=deferred(),mesh={visible:false,material:{fog:true}};let calls=0;
 f.owner.attachPaint(mesh);
 const variants=[];f.renderer.compileAsync=(root,camera,scene)=>{calls++;variants.push(root.material.fog);assert.equal(root,mesh);assert.equal(camera,f.camera);assert.equal(scene,f.scene);assert.equal(root.visible,false);return gate.promise};
 let finished=false;const ready=f.owner.preparePaint(mesh).then(()=>{finished=true});
 await Promise.resolve();assert.equal(calls,1);assert.equal(finished,false);gate.resolve();await ready;assert.deepEqual(variants,[true,false]);assert.equal(mesh.material.fog,true);
 const pending=deferred();f.renderer.compileAsync=()=>pending.promise;
 const retired=f.owner.preparePaint(mesh);f.owner.retirePaint(mesh);pending.resolve();await assert.rejects(retired,{name:'AbortError'});
 await f.owner.dispose();
});

test('secondary mirror views adapt sorting without replacing the main GPU update camera',async()=>{
 const f=await fixture(1),main={name:'main'},mirror={name:'mirror'};f.owner.attach(new f.SplatMesh());
 f.owner.update(mirror,0);await Promise.resolve();assert.equal(f.jobs.length,0);
 const first=f.owner.update(main);await Promise.resolve();f.owner.update(mirror,0);assert.deepEqual(f.cameras,[main]);
 f.jobs[0].resolve();await first;f.setTime(100);f.owner.update(mirror,0);assert.equal(f.jobs.length,1);
 const next=f.owner.update(main);await Promise.resolve();assert.deepEqual(f.cameras,[main,main]);f.jobs[1].resolve();await next;await f.owner.dispose();
});

test('reflected native paint faces its camera, hides packed data and restores even after a draw error',async()=>{
 const f=await fixture(1),camera=new THREE.PerspectiveCamera(69,1.6,.06,35);camera.position.set(-5.65,1.68,7.67);camera.lookAt(-5.65,1,0);
 const paint=new THREE.Mesh();paint.visible=true;paint.userData.anchorActive=true;paint.position.set(-3,1,0);paint.rotation.y=.4;
 f.owner.attachPaint(paint);f.owner.attach(new f.SplatMesh());f.owner.update(camera,0);
 const quaternion=paint.quaternion.clone();assert(f.owner.spark.visible);
 assert.throws(()=>f.owner.withReflectedView(camera,()=>{
  f.owner.update(camera,0);assert.equal(f.owner.spark.visible,false);assert.equal(f.jobs.length,0);
  assert(Math.abs(paint.rotation.y-Math.atan2(camera.position.x-paint.position.x,camera.position.z-paint.position.z))<1e-12);
  throw Error('reflection draw failed');
 }),/reflection draw failed/);
 assert(paint.quaternion.equals(quaternion));assert(f.owner.spark.visible);
 f.owner.update(camera,0);assert(f.owner.spark.visible);assert.equal(f.jobs.length,0);
 f.owner.retirePaint(paint);await f.owner.dispose();
});

test('repeated mirror draws preserve large-yaw paint and face both cameras without half-turns',async()=>{
 const f=await fixture(1),paint=new THREE.Mesh(),source=new THREE.Mesh();paint.visible=true;paint.position.set(-3,1,0);f.owner.attachPaint(paint);
 const camera=new THREE.PerspectiveCamera();camera.position.set(2,1,-5);
 for(const yaw of [2.8,-2.8,Math.PI/2+.001,-Math.PI/2-.001,.4])for(let frame=0;frame<4;frame++){
  source.rotation.set(0,yaw,0);paint.quaternion.copy(source.quaternion);
  const rotation=paint.rotation.clone(),quaternion=paint.quaternion.clone();
  const draw=()=>f.owner.withReflectedView(camera,()=>{
   const normal=new THREE.Vector3(0,0,1).applyQuaternion(paint.quaternion),toward=new THREE.Vector3(camera.position.x-paint.position.x,0,camera.position.z-paint.position.z).normalize();
   assert(normal.distanceTo(toward)<1e-12,'native reflected painting faces the reflected camera');if(frame===3)throw Error('draw failed');
  });
  if(frame===3)assert.throws(draw,/draw failed/);else draw();
  assert.deepEqual(paint.rotation.toArray(),rotation.toArray(),'mirror preserves exact Euler representation');
  assert(paint.quaternion.angleTo(quaternion)<1e-7);assert.equal(f.jobs.length,0);
 }
 f.owner.retirePaint(paint);await f.owner.dispose();
});

test('a shared Gaussian batch sorts between two paint planes without owning their depth',async()=>{
 for(const [farDepth,nearDepth,projectionScale,projectionOffset] of [[4.05,1.18,-1,-.2],[5,4,-.1,-.8]]){
  const f=await fixture(),{owner}=f;
  const paint=z=>({visible:true,userData:{anchorActive:true},updateMatrixWorld(){},getWorldPosition:()=>({applyMatrix4:()=>({x:0,y:0,z:-z})})});
  const far=paint(farDepth),near=paint(nearDepth);owner.attachPaint(far);owner.attachPaint(near);
  const elements=Array(16).fill(0);elements[10]=projectionScale;elements[14]=projectionOffset;
  const camera={position:{clone:()=>({})},projectionMatrix:{elements},updateMatrixWorld(){}};owner.update(camera);
  const z=depth=>-depth*projectionScale+projectionOffset,item=(object,z,id)=>({object,z,id,groupOrder:0,renderOrder:0});
  const ordered=[item(near,z(nearDepth),3),item(owner.spark,z(-2),1),item(far,z(farDepth),2)].sort(f.renderer.sort);
  assert.deepEqual(ordered.map(x=>x.object),[far,owner.spark,near]);assert.equal(owner.inspect().meshes,0);assert.equal(owner.inspect().paintedAnchors,2);
  owner.retirePaint(far);assert(f.renderer.sort);owner.retirePaint(near);assert(f.renderer.sort);await owner.dispose();assert.equal(f.renderer.sort,null);
 }
});

test('courier body keeps near/far person order after paint retirement and excludes the camera tunnel',async()=>{
 const f=await fixture(1),{owner}=f;
 const paint={visible:true,userData:{anchorActive:false}};owner.attachPaint(paint);owner.retirePaint(paint);
 const body=owner.attach(new f.SplatMesh()),tunnel=owner.attach(new f.SplatMesh());
 body.renderOrder=tunnel.renderOrder=200;tunnel.userData.amtSortExclude=true;
 body.getWorldPosition=()=>({applyMatrix4:()=>({x:0,y:0,z:-3})});
 tunnel.getWorldPosition=()=>({applyMatrix4:()=>({x:0,y:0,z:0})});
 const elements=Array(16).fill(0);elements[10]=-1;elements[14]=-.2;
 const pending=owner.update({position:{clone:()=>({})},projectionMatrix:{elements},updateMatrixWorld(){}});await Promise.resolve();
 const near={},far={},item=(object,z,id)=>({object,z,id,groupOrder:0,renderOrder:200});
 const ordered=[item(near,1.8,3),item(owner.spark,-2,1),item(far,3.8,2)].sort(f.renderer.sort);
 assert.deepEqual(ordered.map(x=>x.object),[far,owner.spark,near]);
 const done=owner.dispose();assert.equal(f.renderer.sort,null,'restore sort before deferred GPU cleanup');
 f.jobs[0].resolve();await pending;await done;
});

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

test('foreground paint and splats share an actor pass while respecting room depth',async()=>{
 const f=await fixture(1),mesh=f.owner.attach(new f.SplatMesh());mesh.renderOrder=200;mesh.userData.amtForeground=true;
 const paint={layers:{set(value){this.mask=1<<value}}};f.owner.attachPaint(paint);
 assert.equal(f.owner.spark.layers.mask,2);assert.equal(paint.layers.mask,2);f.owner.retirePaint(paint);
 const sorted=f.owner.update({});await Promise.resolve();assert.equal(f.owner.spark.renderOrder,200);assert.equal(f.owner.spark.material.depthTest,true);
 f.jobs[0].resolve();await sorted;f.owner.retire(mesh);f.setTime(20);f.owner.update({});
 assert.equal(f.owner.spark.renderOrder,0);assert.equal(f.owner.spark.material.depthTest,true);assert.equal(f.owner.spark.visible,false);
 await f.owner.dispose();
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

test('an existing actor sort cannot hand over the omen before its own meshes are sorted',async()=>{
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
  assert.equal(omen.update({...state,life:{...state.life,opacity:0}},actor,camera),0);
  assert.equal(omen.update(state,actor,camera),0);
  f.jobs[0].resolve();await actorSort;
  assert.equal(omen.update(state,actor,camera),0);
  f.setTime(20);const omenSort=owner.update(camera);await Promise.resolve();f.jobs[1].resolve();await omenSort;
  assert(omen.update(state,actor,camera)>0);
  omen.dispose();await owner.dispose();
 }finally{globalThis.fetch=originalFetch}
});
