import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
const site=([x,y,z])=>studyToSite({x,y,z});
const parts=layout.parts.filter(p=>p.foyerFrame);
const limits=p=>layout.solids.find(s=>s.renderPart===p);
test('gallery piers and haunches meet the edge beam beneath the retained slab',()=>{
 const beam=parts.find(p=>p.name.endsWith('edge beam')),b=limits(beam);
 const slab=layout.parts.find(p=>p.name==='Berghain dance floor');
 assert.ok(slab,'main floor remains');
 assert.ok(Math.abs(b.y[1]-(slab.center[1]-slab.size[1]/2))<1e-7);
 const piers=parts.filter(p=>p.name.endsWith('pier'));assert.equal(piers.length,3);
 for(const p of piers){assert.ok(Math.abs(limits(p).y[0]-.05)<1e-8);assert.ok(Math.abs(limits(p).y[1]-b.y[0])<1e-8);}
 const haunches=parts.filter(p=>p.name.endsWith('haunch'));assert.equal(haunches.length,6);
 for(const p of haunches){assert.ok(Math.abs(limits(p).y[1]-b.y[0])<1e-8);assert.ok(limits(p).y[0]>3.7);}
 for(const p of parts.filter(p=>p.name.endsWith('soffit rib')))assert.ok(Math.abs(limits(p).y[1]-b.y[1])<1e-8);
});
test('the radiator has a nearby concrete pier behind its complete fin array',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const a=site([4.5,1.55,9.64]),b=site([4.5,1.55,9.05]);
  const ray=new THREE.Raycaster(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x-a.x,0,b.z-a.z).normalize());
  const hit=ray.intersectObject(model,true)[0];assert.ok(hit&&hit.distance>.001&&hit.distance<.08,'radiator must stand immediately in front of concrete');
  const group=layout.parts.filter(p=>[p.section,p.material,p.shape].join('/')===hit.object.name);
  const pier=group[hit.instanceId];assert.equal(pier.name,'Architecture foyer gallery pier');
  const inverse=new THREE.Matrix4().fromArray(pier.matrix).invert();
  for(const fin of layout.parts.filter(p=>p.name==='Architecture foyer radiator fin')){
   const q=new THREE.Vector3(...fin.center).applyMatrix4(inverse);
   assert.ok(Math.abs(q.x)<.5&&q.y>-.5&&q.y<.5,'every fin lies within the pier face');
  }
 }finally{disposeBerghainModel(model);}
});
test('pier collision blocks all approaches while the gallery arrival remains above it',()=>{
 for(const x of layout.architecturalCirculation.foyerFrame.author.pierXs){
  const center=site([x,.05,9.05]);assert.equal(canStand(center,layout),false);
  const pier=parts.find(p=>p.name.endsWith('pier')&&Math.abs(p.center[0]-center.x)<.01);
  const space={floors:[{x:[-100,100],z:[-100,100],y:.05}],solids:[limits(pier)]};
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   let p=site([x+dx*2,.05,9.05+dz*2]);assert.ok(canStand(p,space));
   const start={...p};p=moveVisitor(p,{x:(center.x-p.x)*2,z:(center.z-p.z)*2},space);
   assert.ok(canStand(p,space));assert.ok(Math.hypot(p.x-start.x,p.z-start.z)<2,'large movement cannot cross the pier');
  }
 }
 assert.ok(canStand(site([15.5,5.45,9.1]),layout),'existing upper return connects above the support');
 assert.ok(canStand(site([0,.05,14.4]),layout),'wardrobe crossing stays clear');
});
test('actual haunch vertices remain inside their declared overhead collision envelope',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{model.traverse(mesh=>{
  if(!mesh.isInstancedMesh)return;
  const group=layout.parts.filter(p=>[p.section,p.material,p.shape].join('/')===mesh.name);
  group.forEach((p,index)=>{if(!p.foyerFrame)return;const s=limits(p),matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);matrix.premultiply(mesh.matrixWorld);
   const vertex=new THREE.Vector3(),a=mesh.geometry.attributes.position;
   for(let i=0;i<a.count;i++){vertex.fromBufferAttribute(a,i).applyMatrix4(matrix);for(const axis of ['x','y','z'])assert.ok(vertex[axis]>=s[axis][0]-1e-5&&vertex[axis]<=s[axis][1]+1e-5);}
  });
 });}finally{disposeBerghainModel(model);}
});
