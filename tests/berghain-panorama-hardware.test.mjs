import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

test('photographed high wall housings are not duplicated as a free-hanging room-wide grille grid',()=>{
 assert.equal(layout.fixtures.filter(f=>f.id.startsWith('panorama-acoustic-')).length,0);
 assert.equal(layout.parts.filter(p=>p.fixture?.startsWith('panorama-acoustic-')).length,0);
 assert.equal(layout.parts.filter(p=>p.name.includes('high perforated face')).length,7,'Retain the separately fitted wall-band study');
 assert.equal(layout.parts.filter(p=>p.name==='Panorama acoustic cloud').length,16);
 assert.equal(layout.fixtures.filter(f=>f.id.startsWith('panorama-pendant-')).length,3);
});

test('complete overhead service bodies clear solid panels, ceiling and transverse beams',()=>{
 const model=createBerghainModel(),counts=new Map();
 try{
  const bodies=layout.parts.map(p=>{const key=[p.section,p.material,p.shape].join('/'),mesh=model.getObjectByName(key),i=counts.get(key)||0;counts.set(key,i+1);const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);mesh.geometry.computeBoundingBox();return{p,b:mesh.geometry.boundingBox.clone().applyMatrix4(m)};});
  const service=bodies.filter(v=>v.p.fixture==='panorama-service-overhead');
  const structure=bodies.filter(v=>['Panorama acoustic cloud','Panorama fitted ceiling','Panorama ceiling beam'].includes(v.p.name));
  assert.equal(service.length,18);
  for(const a of service)for(const z of structure){const d=a.b.clone().intersect(z.b).getSize(new THREE.Vector3());
   assert.ok(!(d.x>1e-6&&d.y>1e-6&&d.z>1e-6),a.p.name+' penetrates '+z.p.name);}
  const ceiling=structure.find(v=>v.p.name==='Panorama fitted ceiling');
  const fixings=service.filter(v=>v.p.name.endsWith('ceiling fixing'));assert.equal(fixings.length,8);
  for(const f of fixings){
   assert.ok(Math.abs(f.b.max.y-ceiling.b.min.y)<2e-5,'Fixing must meet the actual soffit, not float below it');
   const joints=service.filter(v=>v.p.name.endsWith('junction box')&&Math.hypot(v.p.center[0]-f.p.center[0],v.p.center[2]-f.p.center[2])<1e-6);
   assert.equal(joints.length,1);assert.ok(Math.abs(f.b.min.y-joints[0].b.max.y)<2e-5,'Fixing must remain attached to its junction');
  }
 }finally{disposeBerghainModel(model);}
});

test('hardware correction records withdrawn grid inference and estimated service registration',()=>{
 const h=layout.panoramaServices.overheadHardware;assert.ok(h);
 assert.ok(h.sources.includes('A13')&&h.sources.includes('I19'));
 assert.equal(h.retiredFreeHangingEnclosures,9);
 assert.match(h.reason,/wall band/);assert.match(h.placement,/estimated/);
});

test('portable service geometry preserves every actual fitted vertex',()=>{
 const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url)),length=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+length));
 const model=createBerghainModel(),counts=new Map(),v=new THREE.Vector3();let checked=0;
 try{
  for(const p of layout.parts){const key=[p.section,p.material,p.shape].join('/'),i=counts.get(key)||0;counts.set(key,i+1);if(p.fixture!=='panorama-service-overhead')continue;
   const mesh=model.getObjectByName(key),primitive=g.meshes.find(m=>m.name===key).primitives[0],a=g.accessors[primitive.attributes.POSITION],view=g.bufferViews[a.bufferView];
   const native=new Float32Array(bytes.buffer,bytes.byteOffset+28+length+view.byteOffset+(a.byteOffset||0),a.count*3),m=new THREE.Matrix4();mesh.getMatrixAt(i,m);
   const pos=mesh.geometry.attributes.position;
   for(let j=0;j<pos.count;j++){v.fromBufferAttribute(pos,j).applyMatrix4(m);const n=(i*pos.count+j)*3;assert.ok(Math.hypot(v.x-native[n],v.y-native[n+1],v.z-native[n+2])<2e-5,p.name+' portable vertex');checked++;}
  }
  assert.ok(checked>500,'Cover all boxes and round service members');
 }finally{disposeBerghainModel(model);}
});
