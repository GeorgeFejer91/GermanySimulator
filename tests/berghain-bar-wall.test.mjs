import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {createMainBarGeometries} from '../assets/models/berghain/main-bar.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

test('the bar has the architect-reported eleven-metre room and actual circular reliefs in two rows',()=>{
 const wall=layout.mainBar.interiorFacade;
 assert.ok(wall,'The photographed historic interior facade is missing');
 assert.equal(wall.clearHeight,11);assert.ok(wall.sources.includes('A07')&&wall.sources.includes('I23'));
 assert.match(wall.confidence,/inferred|estimated/i);
 const reliefs=layout.parts.filter(p=>p.fixture==='main-bar-interior-facade'&&p.role==='circular relief');
 assert.equal(reliefs.length,10);
 const geometries=createMainBarGeometries(),geometry=geometries['main-bar-medallion'];
 try{
  assert.ok(geometry.attributes.position.count>100,'The circular profile must be actual curved geometry');
  const bounds=new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
  assert.ok(bounds.max.y-bounds.min.y>.99,'The normalized relief must retain real depth');
  for(const relief of reliefs){
   const actual=bounds.clone().applyMatrix4(new THREE.Matrix4().fromArray(relief.matrix));
   assert.ok(actual.max.x-actual.min.x>.04&&actual.max.x-actual.min.x<.1);
   assert.ok(actual.max.y-actual.min.y>1.1&&actual.max.y-actual.min.y<1.3);
  }
 }finally{for(const item of Object.values(geometries))item.dispose();}
 const ceiling=layout.solids.find(s=>s.name==='main-bar-interior-facade ceiling');
 assert.ok(ceiling);assert.ok(Math.abs(ceiling.y[0]-layout.mainBar.floorHeight-11)<.001);
});

test('recessed windows and flanking masonry have different actual depth in the source model',()=>{
 const wall=layout.mainBar.interiorFacade;assert.ok(wall,'The interior wall must own its original geometry');
 const model=createBerghainModel(),ray=new THREE.Raycaster();model.updateMatrixWorld(true);
 const partFor=hit=>{const [section,material,shape]=hit.object.name.split('/');return layout.parts.filter(p=>p.section===section&&p.material===material&&p.shape===shape)[hit.instanceId];};
 const hitAt=(z,y)=>{
  ray.set(new THREE.Vector3(17.1,y,z),new THREE.Vector3(1,0,0));
  const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent);
  assert.ok(hit);return {hit,part:partFor(hit)};
 };
 try{
  for(const bay of wall.bayCenters){
   const window=hitAt(bay[2],layout.mainBar.floorHeight+3.4);
   const masonry=hitAt(bay[2]+1.02,layout.mainBar.floorHeight+3.4);
   assert.equal(window.part.fixture,'main-bar-interior-facade');assert.match(window.part.name,/window backing/);
   assert.equal(masonry.part.fixture,'main-bar-interior-facade');
   assert.ok(window.hit.distance-masonry.hit.distance>.18,'The window must sit inside a real masonry reveal');
  }
 }finally{disposeBerghainModel(model);}
});

test('wall detailing preserves the full guest aisle and the service aisle behind the counter',()=>{
 assert.ok(layout.mainBar.interiorFacade,'The wall must be present for this route check');
 for(const x of [13.72,16.72]){
  let position={x,y:6.65,z:-8.7};assert.ok(canStand(position,layout));
  for(const z of [5.9,-8.7]){
   const start=position.z,steps=Math.ceil(Math.abs(z-start)/.05);
   for(let i=0;i<steps;i++)position=moveVisitor(position,{x:0,z:(z-start)/steps},layout);
   assert.ok(Math.abs(position.z-z)<.02,'Both full-body aisles must remain traversable');
  }
 }
});

test('the photographed upper relief row remains visible across the bar rather than hidden behind an inferred beam',()=>{
 const wall=layout.mainBar.interiorFacade,model=createBerghainModel(),ray=new THREE.Raycaster();model.updateMatrixWorld(true);
 try{
  const bay=wall.bayCenters[2];ray.set(new THREE.Vector3(13.72,12.65,bay[2]),new THREE.Vector3(1,0,0));
  const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent);
  assert.ok(hit);const [section,material,shape]=hit.object.name.split('/');
  const part=layout.parts.filter(p=>p.section===section&&p.material===material&&p.shape===shape)[hit.instanceId];
  assert.equal(part?.role,'circular relief','I23 views12/16 show a clear view of the upper reliefs across this room');
  assert.equal(layout.parts.filter(p=>p.name==='load-bearing column').length,15);
 }finally{disposeBerghainModel(model);}
});

test('the service fittings fit the actual new pilaster profiles without buried furniture vertices',()=>{
 const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),
  ring:new THREE.TorusGeometry(.5,.035,6,20),...createMainBarGeometries()};
 const piers=layout.solids.filter(s=>s.renderPart?.fixture==='main-bar-interior-facade'&&s.renderPart.role==='pilaster');
 const point=new THREE.Vector3();let buried=0;
 try{
  for(const part of layout.parts.filter(p=>p.fixture==='main-bar-service-worktop'||p.fixture==='main-long-bar'||p.fixture?.startsWith('main-bar-stool-'))){
   const vertices=geometries[part.shape].attributes.position,matrix=new THREE.Matrix4().fromArray(part.matrix);
   for(let i=0;i<vertices.count;i++){
    point.fromBufferAttribute(vertices,i).applyMatrix4(matrix);
    if(piers.some(s=>point.x>s.x[0]+.001&&point.x<s.x[1]-.001&&point.y>s.y[0]+.001&&point.y<s.y[1]-.001&&point.z>s.z[0]+.001&&point.z<s.z[1]-.001))buried++;
   }
  }
  assert.equal(buried,0,'Cabinet/worktop notches and bay-centred sinks must clear the photographed piers');
 }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});
