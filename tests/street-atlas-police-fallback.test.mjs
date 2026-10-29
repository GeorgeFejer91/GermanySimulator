import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {installSpriteDepth} from '../sprite-depth.js';
import {createPoliceSprites} from '../police-sprites.js';
const source=readFileSync('world3d.js','utf8');
function declaration(name,next){
  const begin=source.indexOf('  function '+name+'('),end=source.indexOf('  function '+next+'(',begin);
  assert(begin>=0&&end>begin);return source.slice(begin,end);
}
function fixture(){
  const originalImage={width:1536,height:832},adultImage={width:96,height:192};
  const adultMaterial=new T.MeshBasicMaterial({map:new T.Texture(adultImage)});
  const person={id:'adult',figureWorldHeight:2.33,standingOnly:true,standing:{}};
  const camera=new T.PerspectiveCamera();camera.rotation.set(-.65,.8,.1,'YXZ');
  const scope=vm.createContext({T,installSpriteDepth,camera,world:new T.Group(),
    M:Object.fromEntries(['player','police','skin','dark'].map(k=>[k,new T.MeshBasicMaterial()])),
    streetPaintManifest:{adult:person},atlasTextureCache:new Map(),atlasMaterialCache:new Map(),
    personFallbackMaterial:()=>adultMaterial,
    resolveStreetCharacter:actor=>actor.voiceId==='quiz-hartmut-keller'?'adult':null,
    createAtlasCharacterMouth:()=>({sync(){}}),projectBillboardFeet:()=>{},
    bridge:{player:{},getPolice:()=>[],stationElevation:()=>.3,getNpcSpriteCanvas:()=>originalImage,
      npcSpriteGrids:{towelMan:{frameWidth:192,frameHeight:208,cols:8,rows:4,pivot:[96,203]},bayern:{frameWidth:192,frameHeight:208,cols:8,rows:4}}},
    Germany3DBridge:{npcSpriteGrids:{}},X:x=>x*.02,Z:y=>y*.02});
  const box=source.match(/^  const box=.*$/m)[0];
  vm.runInContext(box+declaration('character','jwdCharacter')+
    declaration('atlasSprite','syncMerkel')+declaration('registeredStreetPaint','npcSpriteRequired'),scope);
  const actor={voiceId:'quiz-hartmut-keller',spriteKind:'towelMan',x:10,y:20,spriteFrame:3,spriteRow:2};
  return {scope,person,actor,originalImage,adultImage,adultMaterial,camera};
}

test('late registered quiz atlas roots use the adult fallback before their first sync',()=>{
  const f=fixture(),root=f.scope.npcSprite(f.actor);
  assert.equal(root.material,f.adultMaterial);
  assert(Math.abs(root.geometry.parameters.height*176/192-2.33)<1e-12);
  assert.equal(root.userData.towelManSprite,true,'late atlas replacement guard remains stable');
  const geometry=root.geometry;
  for(let i=0;i<10;i++)f.scope.fitStreetFallback(root,f.person);
  assert.equal(root.geometry,geometry);
});

test('a fitted quiz fallback preserves full UVs and its adult source through camera pitch',()=>{
  const f=fixture(),root=f.scope.npcSprite(f.actor);
  f.scope.fitStreetFallback(root,f.person);
  const geometry=root.geometry,uv=Array.from(geometry.attributes.uv.array);
  f.scope.syncAtlasSprite(root,f.actor,1.21);root.updateMatrixWorld(true);
  assert.equal(root.material.map.image,f.adultImage,'atlas sync must not overwrite the shared placeholder texture');
  assert.deepEqual(Array.from(geometry.attributes.uv.array),uv,'atlas cell UVs must not crop the placeholder');
  const height=geometry.parameters.height;
  const foot=root.localToWorld(new T.Vector3(0,height*(.5-184/192),0));
  const crown=root.localToWorld(new T.Vector3(0,height*(.5-8/192),0));
  assert(Math.abs(foot.y-.3)<1e-6);assert(Math.abs(crown.y-2.63)<1e-6);
});

test('Sandale and special atlas actors retain their own source, dimensions and ownership',()=>{
  const f=fixture();
  for(const [extra,height] of [[{sandale:true},2.42],[{special:'bayern'},2.91],[{voiceId:'unregistered'},2.42]]){
    const root=f.scope.npcSprite({...f.actor,...extra});
    assert.equal(root.material.map.image,f.originalImage);
    assert.equal(root.geometry.parameters.height,height);
    assert.equal(root.userData.streetFallbackHeight,undefined);
  }
});

test('fitting an existing quiz root disposes its old quad once and preserves a pending paint owner',()=>{
  const f=fixture();f.scope.streetPaintManifest=null;
  const root=f.scope.npcSprite(f.actor),previous=root.geometry,pending={loaded:false,failed:false};
  root.userData.streetPaintView=pending;let disposals=0;previous.addEventListener('dispose',()=>disposals++);
  f.scope.fitStreetFallback(root,f.person);const fitted=root.geometry;
  for(let i=0;i<40;i++)f.scope.fitStreetFallback(root,f.person);
  assert.notEqual(fitted,previous);assert.equal(root.geometry,fitted);assert.equal(disposals,1);
  assert.equal(root.userData.streetPaintView,pending);assert.equal(root.visible,true);
});

test('police fallback and native adult body share a root-to-crown span',()=>{
  const f=fixture(),root=f.scope.character('police');root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(root);
  assert(Math.abs(bounds.min.y)<1e-6,'officer soles start at their host root');
  assert(Math.abs(bounds.max.y-2.33)<1e-6,'officer crown matches selected adult paint');
  for(const name of ['ll','rl','la','ra']){
    const limb=root.userData[name];assert(limb?.isMesh);
    assert(root.getObjectById(limb.id),'existing movement owner retains the same limb objects');
  }
});

test('fitting the police visual does not change the articulated player',()=>{
  const f=fixture(),root=f.scope.character('player');root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(root);
  assert(Math.abs(bounds.min.y-.02)<1e-6);assert(Math.abs(bounds.max.y-1.5)<1e-6);
  assert.equal(root.userData.ll.position.y,.27);assert.equal(root.userData.la.position.y,.76);
});

test('admitted officer paint retains the fallback crown and sole through camera pitch and host yaw',async()=>{
  const f=fixture(),host=f.scope.character('police'),actor={},jobs=[];
  host.position.set(1,.3,2);
  const system=createPoliceSprites(T,{camera:f.camera,queueAsset:(_position,_priority,run)=>jobs.push(run)});
  const original={fetch:globalThis.fetch,Image:globalThis.Image};
  try{
    globalThis.fetch=async()=>({ok:true,blob:async()=>new Blob(['police source'])});
    globalThis.Image=class{set src(value){if(value)queueMicrotask(()=>this.onload?.())}};
    system.attach(actor,host);assert.equal(await jobs[0](),true);
    for(const pitch of [-.8,0,.6])for(const yaw of [-1.2,0,.7]){
      f.camera.rotation.set(pitch,.8,.12,'YXZ');host.rotation.y=yaw;system.update(actor);host.updateMatrixWorld(true);
      const paint=host.children.find(node=>node.userData.policePaint),height=paint.geometry.parameters.height;
      const foot=paint.localToWorld(new T.Vector3(0,height*(.5-472/614.4),0));
      const crown=paint.localToWorld(new T.Vector3(0,height*(.5-72/614.4),0));
      assert(foot.distanceTo(host.position)<1e-6,'source sole remains on the officer host');
      assert(Math.abs(crown.y-host.position.y-2.33)<1e-6,'painted crown preserves upright adult fallback stature');
    }
  }finally{system.dispose();Object.assign(globalThis,original)}
});
