import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import {registerStreetCharacterManifest,createStreetCharacterSprite} from '../street-character-sprites.js';

const world=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../assets/characters/street/manifest.json',import.meta.url),'utf8'));
function production(name){
 const start=world.indexOf(`  function ${name}(`),end=world.indexOf('\n  }',start);
 assert(start>=0&&end>start,name);return world.slice(start,end+4);
}
async function fixture(){
 registerStreetCharacterManifest(manifest);
 const camera=new THREE.PerspectiveCamera(48,1280/800,.1,150);
 camera.position.set(0,11.5,14);camera.lookAt(0,1,-2.7);camera.updateMatrixWorld();
 const actor={id:'player-default',x:0,y:0},host=new THREE.Group(),jobs=[],requests=[];
 const T={...THREE,TextureLoader:class{load(url,success){requests.push(success)}}};
 const paint=createStreetCharacterSprite(T,actor,host,(position,radius,task)=>{jobs.push(task);return {state:'pending'}},camera);
 const pending=jobs[0]();
 for(let i=0;i<100&&!requests.length;i++)await new Promise(setImmediate);
 assert.equal(requests.length,1);requests[0](new THREE.Texture({width:128,height:160}));assert.equal(await pending,true);
 const materials=new Set(),slots=[];
 const context={bridge:{player:actor,stationElevation:()=>0},playerMesh:{userData:{streetPaintView:{host,paint}}},
  X:x=>x,Z:y=>y,camera,buildingSightline:new THREE.Raycaster(),sightlineTarget:new THREE.Vector3(),sightlineDirection:new THREE.Vector3(),
  buildingSlots:slots,previousOcclusionTime:0,performance:{now:()=>0}};
 vm.createContext(context);
 vm.runInContext(['streetPlayerSightlineTargets','buildingObstructsPlayer','updateBuildingOcclusion'].map(production).join('\n'),context);
 function blocker(point,opacity=1){
  const material=new THREE.MeshBasicMaterial();Object.assign(material.userData,{baseOpacity:opacity,baseTransparent:opacity<1,baseDepthWrite:true});material.opacity=opacity;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.16,.08,.08),material);mesh.position.copy(camera.position).lerp(point,.8);
  const group=new THREE.Group();group.add(mesh);group.updateMatrixWorld(true);materials.add(material);
  const slot={group,mesh,viewBounds:new THREE.Box3().setFromObject(group),label:null,materials:new Set([material]),opacity:1};slots.push(slot);return slot;
 }
 return {camera,actor,host,paint,context,blocker,dispose(){paint.dispose();for(const slot of slots)slot.mesh.geometry.dispose();for(const material of materials)material.dispose()}};
}

test('actual painted head sightline drives the production fade while old vertical rays miss it',async()=>{
 const f=await fixture();
 try{
  const targets=f.context.streetPlayerSightlineTargets(),head=targets[0].clone(),slot=f.blocker(head);
  assert.equal(targets.length,12);
  assert.equal(f.context.buildingObstructsPlayer(slot),false,'Retained counterexample to procedural-only sampling');
  assert.equal(f.context.buildingObstructsPlayer(slot,targets),true);
  const position={...f.actor};f.context.updateBuildingOcclusion(1000,targets);
  assert.equal(slot.obstructing,true);assert(slot.opacity<.04);assert.deepEqual(f.actor,position);
  assert.equal(slot.mesh.material.depthWrite,false);
  slot.group.visible=false;f.context.updateBuildingOcclusion(2000,targets);
  assert.equal(slot.obstructing,false);assert(slot.opacity>.99);assert.equal(slot.mesh.material.depthWrite,true);
 }finally{f.dispose()}
});

test('opaque foot-only paint obstruction is detected without fading glass or decoration',async()=>{
 const f=await fixture();
 try{
  const targets=f.context.streetPlayerSightlineTargets(),slot=f.blocker(targets[10]);
  assert.equal(f.context.buildingObstructsPlayer(slot,targets),true);
  slot.mesh.material.userData.baseOpacity=.42;assert.equal(f.context.buildingObstructsPlayer(slot,targets),false);
  slot.mesh.material.userData.baseOpacity=1;slot.label=slot.mesh;assert.equal(f.context.buildingObstructsPlayer(slot,targets),false);
  slot.label=null;slot.mesh.userData.occlusionDecoration=true;assert.equal(f.context.buildingObstructsPlayer(slot,targets),false);
  delete slot.mesh.userData.occlusionDecoration;slot.mesh.visible=false;assert.equal(f.context.buildingObstructsPlayer(slot,targets),false);
 }finally{f.dispose()}
});

test('clear painted sightlines and missing paint retain the existing procedural branch',async()=>{
 const f=await fixture();
 try{
  const targets=f.context.streetPlayerSightlineTargets(),slot=f.blocker(targets[0]);
  slot.mesh.position.x+=2;slot.group.updateMatrixWorld(true);slot.viewBounds.setFromObject(slot.group);
  assert.equal(f.context.buildingObstructsPlayer(slot,targets),false);
  f.host.visible=false;assert.equal(f.context.streetPlayerSightlineTargets(),null);
  f.paint.dispose();assert.equal(f.context.streetPlayerSightlineTargets(),null);
  assert.equal(f.context.buildingObstructsPlayer(slot),false);
 }finally{f.dispose()}
});
