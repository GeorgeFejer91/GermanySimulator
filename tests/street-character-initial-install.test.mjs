// NOT RUN while the primary native/ASR resource owner is active.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import {registerStreetCharacterManifest,createStreetCharacterSprite} from '../street-character-sprites.js';

function prepare(rig=false){
  const person={id:'rollback-person',name:'Rollback fixture',cell:[128,160],pivot:[64,150],figureHeight:136,figureWorldHeight:1.6,grid:[8,8],strideDistance:20,
    clips:Object.fromEntries(['down','right','up','left','idle'].map((name,i)=>[name,{offset:i*4,count:4,seconds:.8}])),
    standing:{file:'./assets/characters/street/rollback-standing.webp',width:128,height:160,sha256:'a'.repeat(64)},
    variants:Object.fromEntries(['desktop','mobile'].map(v=>[v,{file:`./assets/characters/street/rollback-${v}.webp`,width:1024,height:1280,sha256:'b'.repeat(64)}]))};
  if(rig)person.motionRig={file:'./assets/characters/street/rollback-rig.json',sha256:'c'.repeat(64),variants:Object.fromEntries(['desktop','mobile'].map(v=>[v,{file:`./assets/characters/street/rollback-parts-${v}.webp`,width:256,height:256,sha256:'d'.repeat(64)}]))};
  registerStreetCharacterManifest({schemaVersion:1,characters:{'quiz-rollback':person}});
  return {id:'actual-rollback-actor',voiceId:'quiz-rollback',x:0,y:0};
}

function fixture(mode){
  const geometry=[],materials=[],textures=[],requests=[],jobs=[];
  function own(array,object){object.disposals=0;object.addEventListener('dispose',()=>object.disposals++);array.push(object);return object}
  const T={...THREE,
    TextureLoader:class{load(url,ok){requests.push({url,ok})}},
    PlaneGeometry:class extends THREE.PlaneGeometry{constructor(...args){super(...args);own(geometry,this)}},
    BufferGeometry:class extends THREE.BufferGeometry{
      constructor(...args){super(...args);own(geometry,this)}
      setIndex(index){if(mode==='rig-setup')throw new Error('injected rig attribute setup');return super.setIndex(index)}
    },
    MeshBasicMaterial:class extends THREE.MeshBasicMaterial{constructor(...args){if(mode==='material')throw new Error('injected material constructor');super(...args);own(materials,this)}},
    Mesh:class extends THREE.Mesh{constructor(...args){if(mode==='mesh')throw new Error('injected mesh constructor');super(...args)}}
  };
  const host=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());host.add(body);
  return {T,host,body,geometry,materials,textures,requests,jobs,
    queueAsset(position,radius,task,owner){const job={task,owner,state:'pending'};jobs.push(job);return job},
    finish(width=128,height=160){const r=requests.shift(),texture=own(textures,new THREE.Texture({width,height}));assert.ok(r);r.ok(texture);return texture}
  };
}
async function begin(f,actor,camera){
  const adapter=createStreetCharacterSprite(f.T,actor,f.host,f.queueAsset,camera),job=f.jobs.at(-1),pending=job.task();
  await Promise.resolve();return {adapter,pending};
}

for(const mode of ['sync','material','mesh','rig-setup'])test(`initial ${mode} failure rolls back paint and owned resources atomically`,async()=>{
  const a=prepare(mode==='rig-setup'),f=fixture(mode),camera=mode==='sync'?{quaternion:null}:new THREE.PerspectiveCamera();
  const oldWarn=console.warn;console.warn=()=>{};
  try{
    const {adapter,pending}=await begin(f,a,camera);f.finish();assert.equal(await pending,false);
    assert.equal(adapter.inspect().loaded,false);assert.equal(adapter.inspect().failed,true);assert.equal(adapter.inspect().stage,null);
    assert.equal(adapter.inspect().textureReferences,0);assert.deepEqual(f.host.children,[f.body]);assert.equal(f.body.visible,true);
    assert.equal(f.geometry.length,1);assert(f.geometry.every(x=>x.disposals===1));assert(f.materials.every(x=>x.disposals===1));assert(f.textures.every(x=>x.disposals===1));
    adapter.dispose();adapter.dispose();assert(f.geometry.every(x=>x.disposals===1));assert(f.materials.every(x=>x.disposals===1));assert(f.textures.every(x=>x.disposals===1));
  }finally{console.warn=oldWarn}
});

test('failed second paint on the same host retains the valid first paint and shared lease',async()=>{
  const a=prepare(),f=fixture('none'),camera=new THREE.PerspectiveCamera();
  const first=await begin(f,a,camera);const texture=f.finish();assert.equal(await first.pending,true);assert.equal(f.body.visible,false);
  const firstMesh=f.host.children.find(x=>x.userData.streetPaint),oldWarn=console.warn;console.warn=()=>{};
  try{
    const second=await begin(f,{...a,id:'second-physical-instance'},{quaternion:null});assert.equal(await second.pending,false);
    assert.equal(second.adapter.inspect().loaded,false);assert.equal(first.adapter.inspect().loaded,true);assert.equal(firstMesh.visible,true);assert.equal(f.body.visible,false);
    assert.deepEqual(f.host.children,[f.body,firstMesh]);assert.equal(texture.disposals,0);
    second.adapter.dispose();assert.equal(texture.disposals,0);assert.equal(firstMesh.visible,true);
    first.adapter.dispose();assert.equal(f.body.visible,true);assert.equal(texture.disposals,1);assert(f.geometry.every(x=>x.disposals===1));assert(f.materials.every(x=>x.disposals===1));
  }finally{console.warn=oldWarn;first.adapter.dispose()}
});

test('standing-only paint cannot accept a requested action; completed full-atlas paint can',async()=>{
  const a=prepare(),f=fixture('none'),first=await begin(f,a,new THREE.PerspectiveCamera());
  assert.equal(first.adapter.canPlayReaction('idle'),false);f.finish();assert.equal(await first.pending,true);assert.equal(first.adapter.canPlayReaction('idle'),false);
  const pending=first.adapter.prepareMotion().task();await Promise.resolve();f.finish(1024,1280);assert.equal(await pending,true);
  assert.equal(first.adapter.canPlayReaction(['idle','down']),true);
  for(const invalid of [Array(1),['toString'],['missing'],[]])assert.equal(first.adapter.canPlayReaction(invalid),false);
  first.adapter.dispose();assert.equal(first.adapter.canPlayReaction('idle'),false);
});

test('failed flat-motion sync restores standing map, UV, transform and original lease',async()=>{
  const a=prepare(),f=fixture('none'),camera=new THREE.PerspectiveCamera(),first=await begin(f,a,camera),standing=f.finish();assert.equal(await first.pending,true);
  const mesh=f.host.children[1],before={uv:Array.from(mesh.geometry.attributes.uv.array),position:mesh.position.toArray(),quaternion:mesh.quaternion.toArray()};
  // Make only this later sync fail; initial standing installation was valid.
  const originalQuaternion=mesh.quaternion.multiply;mesh.quaternion.multiply=()=>{throw new Error('injected motion sync')};
  const oldWarn=console.warn;console.warn=()=>{};
  try{
    const pending=first.adapter.prepareMotion().task();await Promise.resolve();const incoming=f.finish(1024,1280);assert.equal(await pending,false);
    assert.equal(first.adapter.inspect().stage,'standing');assert.equal(first.adapter.inspect().textureReferences,1);assert.equal(mesh.material.map,standing);assert.equal(standing.disposals,0);assert.equal(incoming.disposals,1);
    assert.deepEqual(Array.from(mesh.geometry.attributes.uv.array),before.uv);assert.deepEqual(mesh.position.toArray(),before.position);assert.deepEqual(mesh.quaternion.toArray(),before.quaternion);
    assert.equal(first.adapter.canPlayReaction('idle'),false);assert.equal(f.body.visible,false);
  }finally{mesh.quaternion.multiply=originalQuaternion;console.warn=oldWarn;first.adapter.dispose()}
  assert(f.geometry.every(x=>x.disposals===1));assert(f.materials.every(x=>x.disposals===1));assert(f.textures.every(x=>x.disposals===1));assert.equal(f.body.visible,true);
});
