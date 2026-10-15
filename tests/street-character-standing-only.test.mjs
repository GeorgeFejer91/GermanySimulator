// SOURCE ONLY. No imports/tests/decodes before primary grants the exact job.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import {registerStreetCharacterManifest,resolveStreetCharacter,advanceStreetAnimation,
  requestStreetReaction,cancelStreetReaction,hasStreetReaction,
  createStreetCharacterSprite,createStreetCharacterCanvasSprite} from '../street-character-sprites.js';

function person(){return{id:'standing-fixture',name:'Own standing fixture',standingOnly:true,
  cell:[128,160],pivot:[64,150],figureHeight:136,figureWorldHeight:1.6,
  standing:{file:'./assets/characters/street/own-standing-fixture.webp',sha256:'a'.repeat(64),width:128,height:160}}}
function register(value=person()){return registerStreetCharacterManifest({schemaVersion:1,characters:{'quiz-standing-fixture':value}})}
const actor=id=>({id,voiceId:'quiz-standing-fixture',x:5,y:8});
async function until(check){for(let i=0;i<100&&!check();i++)await new Promise(setImmediate);assert.ok(check(),'bounded decoder fixture did not reach expected state')}

function fixture(){
  register();const requests=[],images=[],jobs=[],saved={fetch:globalThis.fetch,Image:globalThis.Image,warn:console.warn};
  let fetches=0;globalThis.fetch=()=>{fetches++;throw new Error('Standing-only must not fetch motion/rig')};console.warn=()=>{};
  globalThis.Image=class{set src(value){this.url=value;if(value)images.push(this)}decode(){return Promise.resolve()}};
  const T={...THREE,TextureLoader:class{load(url,ok,progress,fail){requests.push({url,ok,fail})}}};
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,11.5,14);camera.lookAt(0,1,-2.7);camera.updateMatrixWorld();
  const queue=(position,radius,task,owner)=>{const job={task,owner,state:'pending'};jobs.push(job);return job};
  return{T,camera,queue,requests,images,jobs,fetches:()=>fetches,
    host(){const host=new THREE.Group();host.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()));return host},
    finishTexture(){const request=requests.shift();assert.ok(request);const texture=new THREE.Texture({width:128,height:160});texture.disposals=0;texture.addEventListener('dispose',()=>texture.disposals++);request.ok(texture);return texture},
    finishImage(){const image=images.shift();assert.ok(image);image.naturalWidth=128;image.naturalHeight=160;image.onload();return image},
    restore(){globalThis.fetch=saved.fetch;globalThis.Image=saved.Image;console.warn=saved.warn}};
}

test('explicit standing-only manifest needs no motion metadata and identity aliases remain exact',()=>{
  const own=person();own.actorId='physical-owned';own.aliases=['jwd-owned'];const registered=register(own);
  assert.equal(registered['quiz-standing-fixture'].standingOnly,true);
  for(const key of ['grid','clips','variants','motionRig','strideDistance'])assert.equal(Object.hasOwn(registered['quiz-standing-fixture'],key),false);
  assert.equal(resolveStreetCharacter({id:'physical-owned'}),'quiz-standing-fixture');
  assert.equal(resolveStreetCharacter({id:'jwd-owned'}),'quiz-standing-fixture');
  assert.equal(resolveStreetCharacter({id:'owned'}),null);
  assert.equal(requestStreetReaction(actor('body'),['idle','work']),false);
  assert.equal(hasStreetReaction(actor('body')),false);
});

test('invalid own standing/scale/capability records reject without replacing previous registry',()=>{
  register();const invalid=[
    value=>{delete value.standing},value=>{value.standing.sha256='wrong'},
    value=>{value.standing.width=64},value=>{value.pivot=[64,161]},
    value=>{value.cell=[,160]},value=>{value.figureHeight=161},
    value=>{value.figureWorldHeight=0},value=>{value.id=''},
    value=>{value.standingOnly='true'},value=>{value.clips={}},
    value=>{value.variants={}},value=>{value.motionRig={}},
    value=>{value.grid=[1,1]},value=>{value.strideDistance=1}
  ];
  for(const mutate of invalid){const value=person();mutate(value);assert.throws(()=>register(value));assert.equal(resolveStreetCharacter({voiceId:'quiz-standing-fixture'}),'quiz-standing-fixture')}
});

test('Three standing-only is queued lazily, owns its ground registration and never prepares motion',async()=>{
  const f=fixture(),a=actor('physical-A'),host=f.host(),adapter=createStreetCharacterSprite(f.T,a,host,f.queue,f.camera);
  try{
    assert.equal(f.requests.length,0);assert.equal(f.jobs.length,1);assert.equal(adapter.prepareMotion(),null);assert.equal(f.jobs.length,1);
    const pending=f.jobs[0].task();await until(()=>f.requests.length===1);const texture=f.finishTexture();assert.equal(await pending,true);
    const inspect=adapter.inspect();assert.equal(inspect.loaded,true);assert.equal(inspect.standingOnly,true);assert.equal(inspect.stage,'standing');
    assert.equal(inspect.motionLoaded,false);assert.equal(inspect.motionRequested,false);assert.equal(inspect.motionSettled,true);assert.equal(inspect.rigDefinitionReferences,0);
    assert.equal(adapter.canPlayReaction('work'),false);assert.equal(adapter.prepareMotion(),null);assert.equal(f.jobs.length,1);assert.equal(f.fetches(),0);
    const body=host.children[0],paint=host.children.find(x=>x.userData.streetPaint);assert.equal(body.visible,false);assert.equal(paint.material.map,texture);
    assert.equal(paint.geometry.parameters.width,128*1.6/136);assert.equal(paint.geometry.parameters.height,160*1.6/136);
    assert.deepEqual([a.x,a.y],[5,8]);adapter.sync();assert.equal(paint.visible,true);
    adapter.dispose();adapter.dispose();assert.equal(texture.disposals,1);assert.equal(body.visible,true);
  }finally{adapter.dispose();f.restore()}
});

test('Canvas standing-only draws its complete own cell and cannot draw a rig or queue motion',async()=>{
  const f=fixture(),a=actor('physical-canvas'),adapter=createStreetCharacterCanvasSprite(a,f.queue),draws=[];
  try{
    assert.equal(f.images.length,0);assert.equal(adapter.prepareMotion(),null);
    const pending=f.jobs[0].task();await until(()=>f.images.length===1);const own=f.finishImage();assert.equal(await pending,true);
    assert.equal(adapter.inspect().standingOnly,true);assert.equal(adapter.inspect().motionLoaded,false);assert.equal(adapter.canPlayReaction('work'),false);
    const ctx={drawImage(...args){draws.push(args)}};
    assert.equal(adapter.draw(ctx,40,60,136),true);assert.strictEqual(draws[0][0],own);assert.deepEqual(draws[0].slice(1),[0,0,128,160,-24,-90,128,160]);
    assert.equal(adapter.drawRig(ctx,{}),false);assert.equal(adapter.prepareMotion(),null);assert.equal(f.jobs.length,1);assert.equal(f.fetches(),0);
    adapter.dispose();adapter.dispose();assert.equal(adapter.inspect().imageReferences,0);assert.equal(adapter.draw(ctx,40,60,136),false);
  }finally{adapter.dispose();f.restore()}
});

test('two physical actors share only their own art lease; native cues and body cancellation stay independent',async()=>{
  const f=fixture(),a=actor('physical-A'),b=actor('physical-B'),adapters=[];
  try{
    for(const value of[a,b])adapters.push(createStreetCharacterSprite(f.T,value,f.host(),f.queue,f.camera));
    const pending=f.jobs.map(job=>job.task());await until(()=>f.requests.length===1);const texture=f.finishTexture();assert.deepEqual(await Promise.all(pending),[true,true]);
    const cue=token=>({speechStatus:'playing',cueToken:token,mediaTime:.4,mediaDuration:2,mouthOpen:.8});
    const first=advanceStreetAnimation(a,2,.1,{...cue('A'),dx:2,dy:0}),second=advanceStreetAnimation(b,0,.1,cue('B'));
    assert.equal(first.clip,'standing');assert.equal(first.mouthOpen,0);assert.equal(first.holdPosition,false);assert.equal(first.cueToken,'A');assert.equal(second.cueToken,'B');
    assert.equal(requestStreetReaction(a,'success'),false);assert.equal(hasStreetReaction(a),false);assert.equal(cancelStreetReaction(a,{bodyOnly:true}),true);
    assert.equal(adapters[0].inspect().pose.cueToken,'A');assert.equal(cancelStreetReaction(b),true);
    assert.equal(advanceStreetAnimation(b,0,.1,cue('B')).speaking,false);
    const paused=advanceStreetAnimation(a,0,.1,{...cue('A'),paused:true});assert.equal(paused.cueToken,'A');assert.equal(paused.speechStatus,'paused');
    adapters[0].dispose();assert.equal(texture.disposals,0);adapters[1].dispose();assert.equal(texture.disposals,1);
  }finally{for(const adapter of adapters)adapter.dispose();f.restore()}
});

test('initial standing decode failure cannot report body or motion readiness',async()=>{
  const f=fixture(),host=f.host(),adapter=createStreetCharacterSprite(f.T,actor('failed'),host,f.queue,f.camera);
  try{
    const pending=f.jobs[0].task();await until(()=>f.requests.length===1);f.requests.shift().fail(new Error('injected standing decode failure'));
    assert.equal(await pending,false);assert.equal(adapter.inspect().loaded,false);assert.equal(adapter.inspect().motionLoaded,false);assert.equal(adapter.inspect().failed,true);
    assert.equal(host.children.length,1);assert.equal(host.children[0].visible,true);assert.equal(adapter.prepareMotion(),null);assert.equal(f.jobs.length,1);
  }finally{adapter.dispose();f.restore()}
});

test('legacy full-motion manifest still uses its original reactions and pose path',async()=>{
  const legacy=JSON.parse(await readFile(new URL('./fixtures/street-legacy-candidate-manifest.json',import.meta.url),'utf8'));
  registerStreetCharacterManifest(legacy);const a={id:'legacy-physical',voiceId:'quiz-hartmut-keller',x:0,y:0};
  assert.equal(requestStreetReaction(a,'work'),true);const pose=advanceStreetAnimation(a,0,.1);
  assert.equal(pose.clip,'work');assert.ok(pose.rigPose);assert.equal(hasStreetReaction(a),true);assert.equal(cancelStreetReaction(a,{bodyOnly:true}),true);
});
