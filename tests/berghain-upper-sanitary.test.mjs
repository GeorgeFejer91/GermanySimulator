import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createViewerLighting} from '../berghain/night-lighting.mjs';
const room=layout.upperLounge.sanitary;

test('cutting the recesses preserves the original mineral floor surface in source and export',()=>{
 const model=createBerghainModel();
 try{
  const slab=model.getObjectByName('interior/floor/upper-sanitary-slab');
  const retained=model.getObjectByName('interior/floor/box');
  assert.deepEqual(slab.material.userData.surface,retained.material.userData.surface);
  assert.equal(slab.material.userData.surface.family,'mineral');
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString().trim());
  const mesh=gltf.meshes.find(m=>m.name==='interior/floor/upper-sanitary-slab');
  const material=gltf.materials[mesh.primitives[0].material];
  assert.ok(material.pbrMetallicRoughness.baseColorTexture);
  assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture);assert.ok(material.normalTexture);
 }finally{disposeBerghainModel(model);}
});

function walk(route,step){
 let p={...route[0]};assert.ok(canStand(p,layout),'legal start');
 for(const target of [...route.slice(1),...route.toReversed().slice(1)]){
  const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/step),dx=(target.x-p.x)/n,dz=(target.z-p.z)/n;
  for(let i=0;i<n;i++){p=moveVisitor(p,{x:dx,z:dz},layout);assert.ok(canStand(p,layout),'complete body legal');}
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.08,JSON.stringify({target,p}));
  assert.ok(Math.abs(p.y-target.y)<.14);
 }
}

test('separate upper room and overlook connect to the shared landing in both directions',()=>{
 for(const step of [1.6/60,1.6/30,.16]){
  walk([...layout.panoramaRegistration.loungeRoute,...room.route.slice(1)],step);
  walk(room.overlookRoute,step);
 }
 for(const dx of [-.06,.06])walk(room.route.map((p,i)=>i?{...p,x:p.x+dx}:p),.025);
 assert.equal(layout.interiorTopology.panoramaToilets.floorHeight,9.05);
 assert.match(room.approach,/front stair remains unregistered/);
});

test('upper aperture reveals the DJ while the supported guard contains walking',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const origin=new THREE.Vector3(1.85,13.83,14.45),target=new THREE.Vector3(-.888250608,10.73,14.439587580);
  const hits=new THREE.Raycaster(origin,target.clone().sub(origin).normalize(),0,origin.distanceTo(target)-.1).intersectObject(model,true);
  assert.deepEqual(hits.filter(h=>!h.object.material.transparent).map(h=>h.object.name),[]);
  let p={x:1.85,y:12.15,z:14.45};for(let i=0;i<30;i++)p=moveVisitor(p,{x:-.16,z:0},layout);
  assert.ok(canStand(p,layout)&&p.x>1.40,'guard excludes the unsupported gap');
 }finally{disposeBerghainModel(model);}
});

test('six recessed bowls have real slab openings and a complete station barrier',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  for(const {center:[x,y,z]} of room.stations){
   const hits=new THREE.Raycaster(new THREE.Vector3(x,y+.5,z),new THREE.Vector3(0,-1,0),0,1).intersectObject(model,true);
   assert.ok(hits.length);assert.match(hits[0].object.name,/upper-sanitary-bowl/);
   assert.ok(Math.abs(hits[0].point.y-(y-.185))<.003,'recess bottom instead of an uncut slab');
   assert.equal(canStand({x,y,z},layout),false,'no walkable virtual floor in bowl');
   assert.ok(canStand({x:3.825,y,z},layout),'aisle alongside each station');
   const below=new THREE.Raycaster(new THREE.Vector3(x,11.70,z),new THREE.Vector3(0,1,0),0,1).intersectObject(model,true);
   assert.ok(below.length);assert.match(below[0].object.name,/upper-sanitary-slab/);
   assert.ok(Math.abs(below[0].point.y-11.75)<.003,'recess retains the original solid underside');
  }
 }finally{disposeBerghainModel(model);}
});

test('room practicals clear the ceiling and reuse the bounded club light budget',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene);
 try{
  rig.update('interior',{x:3.825,y:12.15,z:15});assert.equal(rig.state.room,'upperSanitary');
  assert.equal(rig.state.daylight,false);assert.equal(rig.state.activeLights,3);assert.equal(rig.state.shadowMaps,2);
  scene.traverse(l=>{if(l.isSpotLight&&l.visible){assert.ok(l.position.y<14.675);assert.ok(l.position.x>2.6&&l.position.x<4.25);}});
  rig.update('interior',{x:1.85,y:12.15,z:14.45});assert.equal(rig.state.room,'panoramaOverlook');
  assert.equal(rig.state.activeLights,3);assert.equal(rig.state.shadowMaps,2);
  assert.equal(scene.children[0].children.filter(l=>l.isSpotLight&&l.visible&&l.position.x<0).length,2,'retain the adjacent dance-floor washes');
 }finally{rig.dispose();}
});
