import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createPoliceSprites,policeSpriteFrame,policeTier,POLICE_SPRITE_LAYOUT} from '../police-sprites.js';

test('wanted escalation selects four readable equipment tiers',()=>{
  assert.deepEqual([1,2,3,4,5].map(policeTier),['patrol','patrol','protective','riot','heavy']);
});
test('blocked police freeze distance clock and hold neutral complete feet',()=>{
  const state={};
  const p=policeSpriteFrame(state,{distance:POLICE_SPRITE_LAYOUT.cycleDistance/4,facing:Math.PI/2});
  assert.equal(p.row,1);assert.equal(p.frame,2);
  for(let i=0;i<10;i++)assert.equal(policeSpriteFrame(state,{distance:0,dt:.1,facing:Math.PI/2}).row,4);
  assert.equal(state.distance,POLICE_SPRITE_LAYOUT.cycleDistance/4);
  assert.equal(policeSpriteFrame(state,{distance:POLICE_SPRITE_LAYOUT.cycleDistance/4,facing:Math.PI/2}).frame,4);
});
test('actions use painted ticket and warning keys only while planted',()=>{
  assert.equal(policeSpriteFrame({},{gesture:'ticket'}).row,6);
  assert.equal(policeSpriteFrame({},{talking:true}).row,5);
  assert.equal(policeSpriteFrame({},{gesture:'ticket',distance:1}).row,0);
  assert.equal(policeSpriteFrame({age:100},{talking:true,reducedMotion:true}).frame,2);
});
test('a cancelled planted gesture lowers its arm before returning to idle',()=>{
  const state={};policeSpriteFrame(state,{gesture:'warning'});
  for(let i=0;i<4;i++)policeSpriteFrame(state,{gesture:'warning',dt:.1});
  assert.equal(policeSpriteFrame(state,{dt:.1}).row,5);
  for(let i=0;i<4;i++)policeSpriteFrame(state,{dt:.1});
  assert.equal(policeSpriteFrame(state,{dt:0}).row,4);
});
test('view-relative facing uses actual front, rear and both side rows',()=>{
  assert.deepEqual([0,Math.PI/2,Math.PI,-Math.PI/2].map(facing=>policeSpriteFrame({},{facing,distance:1}).row),[0,1,2,3]);
  assert.equal(policeSpriteFrame({},{facing:Math.PI,cameraYaw:Math.PI,distance:1}).row,0);
});

test('admitted adult paint uses its authored figure height and planted stride',async()=>{
  const original={fetch:globalThis.fetch,Image:globalThis.Image},jobs=[],sizes=[];
  const T={
    Texture:class{dispose(){}},
    PlaneGeometry:class{constructor(width,height){sizes.push({width,height});this.attributes={uv:{setXY(){}}}}dispose(){}},
    MeshBasicMaterial:class{constructor(options){Object.assign(this,options)}dispose(){}},
    Mesh:class{constructor(geometry,material){Object.assign(this,{geometry,material,userData:{}})}}
  };
  const system=createPoliceSprites(T,{queueAsset:(_position,_priority,run)=>jobs.push(run)});
  try{
    globalThis.fetch=async()=>({ok:true,blob:async()=>new Blob(['police source'])});
    globalThis.Image=class{set src(value){if(value)queueMicrotask(()=>this.onload?.())}};
    const fallback={visible:true},host={position:{x:0,z:0},children:[fallback],add(){},remove(){}},actor={};
    system.attach(actor,host);assert.equal(await jobs[0](),true);
    assert.equal(system.update(actor),true);assert.equal(fallback.visible,false);
    assert.ok(Math.abs(sizes[0].height-2.33*614.4/400)<1e-12,'the whole adult source occupies2.33world units');
    assert.ok(Math.abs(sizes[0].width/sizes[0].height-160/192)<1e-12);
    assert.equal(POLICE_SPRITE_LAYOUT.cycleDistance,65.24);
    assert.equal(POLICE_SPRITE_LAYOUT.pivot,472/614.4);
  }finally{system.dispose();Object.assign(globalThis,original)}
});
test('one admitted texture job is shared; final detach aborts it and preserves fallback',()=>{
  const jobs=[],owner={};
  const system=createPoliceSprites({}, {queueAsset:(position,priority,run,lifetime)=>jobs.push({position,priority,run,lifetime}),mobile:true});
  const one={},two={},mesh={visible:true};
  const host={position:{x:0,z:0},children:[mesh]};
  system.attach(one,host,{tier:'heavy',variant:'female'});system.attach(two,host,{tier:'heavy',variant:'female'});
  assert.equal(jobs.length,1);assert.equal(system.inspect().resources[0].refs,2);
  assert.equal(system.update(one,{distance:1}),false);assert.equal(mesh.visible,true);
  system.detach(one);assert.equal(jobs[0].lifetime.retired,false);
  system.detach(two);assert.equal(jobs[0].lifetime.controller.signal.aborted,true);assert.equal(system.inspect().resources.length,0);
  system.dispose();assert.equal(system.inspect().retired,true);
});
test('tier replacement cancellation releases both pending and current requests',()=>{
  const jobs=[],system=createPoliceSprites({}, {queueAsset:(p,n,run,lifetime)=>jobs.push(lifetime)}),actor={};
  system.attach(actor,{position:{x:0,z:0},children:[]});system.update(actor,{tier:'heavy'});
  assert.equal(system.inspect().resources.length,2);
  system.update(actor,{dt:.1});assert.equal(system.inspect().resources.length,2);
  system.detach(actor);assert.equal(system.inspect().resources.length,0);assert.ok(jobs.every(j=>j.controller.signal.aborted));
});

test('shared pending texture admission follows the nearest surviving officer',()=>{
  const jobs=[],system=createPoliceSprites({}, {queueAsset:(position,priority,run,lifetime)=>jobs.push({position,lifetime})});
  const far={},near={},farHost={position:{x:1000,z:1000},children:[]},nearHost={position:{x:0,z:0},children:[]};
  system.attach(far,farHost);system.attach(near,nearHost);
  assert.equal(jobs.length,1);
  assert.deepEqual(jobs[0].position(0,0),{x:0,z:0},'admission must consider every live consumer');
  assert.deepEqual(jobs[0].position(1000,1000),{x:1000,z:1000});
  system.detach(far);nearHost.position.x=12;nearHost.position.z=34;
  assert.deepEqual(jobs[0].position(1000,1000),{x:12,z:34},'a retired first host cannot strand the survivor');
  assert.equal(system.inspect().resources[0].refs,1);assert.equal(jobs[0].lifetime.retired,false);
  system.detach(near);assert.equal(jobs[0].lifetime.retired,true);
});
test('every encoded gender/equipment/client atlas is bound to a digest and bounded decode',()=>{
  const path=new URL('../assets/characters/police/manifest.json',import.meta.url);
  const manifest=JSON.parse(readFileSync(path));assert.equal(Object.keys(manifest.variants).length,8);
  assert.equal(manifest.figureHeightWorld,2.33);assert.equal(manifest.sourceFigureHeight,400);
  assert.equal(manifest.sourceFrameHeight,614.4);assert.equal(manifest.cycleDistance,POLICE_SPRITE_LAYOUT.cycleDistance);
  for(const variants of Object.values(manifest.variants))for(const [client,asset] of Object.entries(variants)){
    const bytes=readFileSync(new URL(asset.file,path));assert.equal(bytes.length,asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
    assert.ok(asset.width<=2048&&asset.height<=2048);assert.equal(asset.decodedRGBA,asset.width*asset.height*4);
    assert.ok(asset.bytes<2*1024*1024);assert.ok(asset.decodedRGBA<16*1024*1024);
    assert.equal(asset.width,client==='mobile'?960:1280);
  }
});
