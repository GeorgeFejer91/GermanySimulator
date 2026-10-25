import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

function bounds(model){
 const result=new Map(),counts=new Map();
 for(const p of layout.parts){
  const key=[p.section,p.material,p.shape].join('/'),index=counts.get(key)||0;counts.set(key,index+1);
  const mesh=model.getObjectByName(key),matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);mesh.geometry.computeBoundingBox();
  result.set(p,mesh.geometry.boundingBox.clone().applyMatrix4(matrix));
 }
 return result;
}
test('the photographed broad central roof is not replaced by the generic upper box grid',()=>{
 assert.equal(layout.parts.filter(p=>['structural beam','cross beam'].includes(p.name)&&p.center[1]>18).length,0);
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  for(const x of [-14,-6,1])for(const z of [-5,0,5]){
   const ray=new THREE.Raycaster(new THREE.Vector3(x,19.5,z),new THREE.Vector3(0,1,0));
   const hit=ray.intersectObject(model,true)[0];assert.ok(hit&&/roof/.test(hit.object.name));
   assert.ok(Math.abs(hit.point.y-layout.calibration.mainRoof)<.002,'Existing official roof remains the upper boundary');
  }
  assert.match(layout.mainHallDetails.roofFrame.confidence,/estimated/);
 }finally{disposeBerghainModel(model);}
});
test('bracketed runways carry the industrial bridge and its wheels meet their rails',()=>{
 const model=createBerghainModel(),boxes=bounds(model);
 try{
  const heads=layout.parts.filter(p=>p.name==='Hall fit long side head'),rails=layout.parts.filter(p=>p.name==='Hall roof runway head'),wheels=layout.parts.filter(p=>p.name==='Hall roof bridge wheel');
  assert.equal(heads.length,2);assert.equal(rails.length,2);assert.equal(wheels.length,4);
  for(const rail of rails){
   const b=boxes.get(rail),head=heads.find(p=>Math.abs(p.center[2]-rail.center[2])<1),h=boxes.get(head);
   assert.ok(b.min.x>=h.min.x&&b.max.x<=h.max.x,'Rail stays within its supporting head');
   const brackets=layout.parts.filter(p=>p.name==='Hall roof runway bracket'&&Math.abs(p.center[2]-rail.center[2])<.1);
   const girder=layout.parts.find(p=>p.name==='Hall roof runway girder lower flange'&&Math.abs(p.center[2]-rail.center[2])<.01);
   assert.equal(brackets.length,4);
   for(const bracket of brackets){
    const support=boxes.get(bracket),base=boxes.get(girder);
    assert.ok(Math.abs(support.max.y-base.min.y)<.002&&support.min.z<=base.min.z&&support.max.z>=base.max.z,'Bracket carries the runway width');
    assert.ok(Math.min(Math.abs(support.min.z-h.max.z),Math.abs(support.max.z-h.min.z))<.002,'Bracket meets the concrete inner face');
   }
   for(const wheel of wheels.filter(p=>Math.abs(p.center[2]-rail.center[2])<.01))
    assert.ok(Math.abs(boxes.get(wheel).min.y-b.max.y)<.002,'Real wheel bounds meet the running surface');
  }
  for(const p of layout.parts.filter(p=>p.hallRoofFrame)){
   const b=boxes.get(p);assert.ok(b.max.y<layout.calibration.mainRoof,'Industrial assembly fits under the retained roof');
   for(const f of layout.floors){
    if(b.max.x<f.x[0]||b.min.x>f.x[1]||b.max.z<f.z[0]||b.min.z>f.z[1])continue;
    assert.ok(b.min.y-Math.max(f.y,f.endY??f.y)>1.8,'New hardware clears all overlapping walking floors');
   }
  }
 }finally{disposeBerghainModel(model);}
});
test('the main industrial bridge is static and distinct from the existing Eisbar hoist',()=>{
 assert.ok(layout.parts.some(p=>p.name==='Architecture Eisbar crane track'));
 assert.ok(layout.parts.some(p=>p.name==='Hall roof bridge web'));
 const info=layout.mainHallDetails.roofFrame;
 assert.match(info.role,/industrial bridge/);assert.match(info.confidence,/current/);
 assert.ok(layout.floors.every(p=>!p.hallRoofFrame),'The overhead study creates no invented accessible destination');
});

test('overhead machinery clears the retained concrete piers',()=>{
 const model=createBerghainModel(),boxes=bounds(model);
 try{
  const piers=layout.parts.filter(p=>p.name==='Hall fit side frame pier');assert.equal(piers.length,8);
  for(const p of layout.parts.filter(p=>p.hallRoofFrame))for(const pier of piers){
   const a=boxes.get(p),b=boxes.get(pier);
   assert.ok(['x','y','z'].some(axis=>Math.min(a.max[axis],b.max[axis])-Math.max(a.min[axis],b.min[axis])<.00001),
    `${p.name} intersects pier at ${pier.center}`);
  }
 }finally{disposeBerghainModel(model);}
});

test('the side piers meet the actual roof without changing their floor footprint',()=>{
 const model=createBerghainModel(),boxes=bounds(model);model.updateMatrixWorld(true);
 try{
  for(const p of layout.parts.filter(p=>p.name==='Hall fit side frame pier')){
   const b=boxes.get(p),ray=new THREE.Raycaster(new THREE.Vector3(p.center[0],19.9,p.center[2]),new THREE.Vector3(0,1,0));
   const roof=ray.intersectObject(model,true).find(h=>/roof/.test(h.object.name));
   assert.ok(roof&&Math.abs(roof.point.y-b.max.y)<.002,'Pier top meets the retained roof');
   assert.ok(Math.abs(b.min.y-5.45)<.002);assert.ok(Math.abs(b.max.x-b.min.x-.8)<.002&&Math.abs(b.max.z-b.min.z-.8)<.002);
   const solid=layout.solids.find(s=>s.renderPart===p);assert.ok(solid);
   assert.ok(Math.abs(solid.y[1]-b.max.y)<.002,'Collider follows the visible top');
  }
 }finally{disposeBerghainModel(model);}
});
