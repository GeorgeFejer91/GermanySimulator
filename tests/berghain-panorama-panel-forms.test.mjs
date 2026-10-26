import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
const panels=layout.parts.filter(p=>p.name==='Panorama acoustic cloud');
const bounds=p=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));

test('Panorama panels represent photographed square and elongated forms in both orientations and differing depths',()=>{
 const ratios=panels.map(p=>Math.hypot(...p.matrix.slice(0,3))/Math.hypot(...p.matrix.slice(8,11)));
 assert.ok(ratios.some(r=>r>.9&&r<1.1),'I11/I19 show near-square panels');
 assert.ok(ratios.some(r=>r>1.55),'I11/I19 show wide panels');
 assert.ok(ratios.some(r=>r<.65),'I11/I19 show elongated panels perpendicular to the wide family');
 const depths=panels.map(p=>bounds(p).getSize(new THREE.Vector3()).y);
 assert.ok(Math.max(...depths)-Math.min(...depths)>.12,'I19 shows differing panel depths');
});

test('complete panel bodies retain clear ceiling/beam and neighbouring-panel separation and standing clearance',()=>{
 assert.equal(panels.length,16,'The cropped references do not establish a replacement whole-room inventory');
 const structure=layout.parts.filter(p=>['Panorama ceiling beam','Panorama fitted ceiling'].includes(p.name));
 for(let i=0;i<panels.length;i++){
  const a=bounds(panels[i]);
  assert.ok(a.min.y-layout.panoramaServices.floorHeight>3.5,'Overhead assemblies retain generous visitor head clearance');
  for(const p of [...structure,...panels.slice(i+1)])assert.ok(!a.intersectsBox(bounds(p)),panels[i].name+' must remain separate from '+p.name);
 }
});

test('panel form evidence distinguishes observed shapes from provisional anchors and inventory',()=>{
 const f=layout.panoramaServices.acousticForms;
 assert.ok(f,'Retain the scoped source evidence with the model');
 assert.ok(f.sources.includes('I11')&&f.sources.includes('I19'));
 assert.match(f.placement,/provisional/);assert.match(f.confidence,/estimated/);
 assert.match(f.inventory,/cropped/);
});


// Explicit pre-existing thin conduit/mount contacts from published 5711e11.
// These remain unresolved source details, not permission for new body overlap.
const priorContacts=new Set(["0/panorama-service-overhead exposed conduit/-15.44177,13.47000,14.37426", "0/panorama-service-overhead junction box/-15.44177,13.44000,20.37426", "0/panorama-service-overhead ceiling fixing/-15.44177,13.60750,20.37426", "1/panorama-service-overhead exposed conduit/-15.44177,13.47000,14.37426", "2/panorama-service-overhead exposed conduit/-15.44177,13.47000,14.37426", "3/panorama-service-overhead exposed conduit/-15.44177,13.47000,14.37426", "4/panorama-acoustic--19--17 hanger/-13.31250,13.61000,19.36683", "6/panorama-acoustic--13--17 hanger/-13.30726,13.61000,14.19420", "8/panorama-acoustic--19--12 hanger/-7.49091,13.61000,19.31983", "10/panorama-acoustic--13--12 hanger/-7.48634,13.61000,14.14690", "12/panorama-acoustic--19--7 hanger/-1.66932,13.61000,19.27283", "14/panorama-acoustic--13--7 hanger/-1.66543,13.61000,14.09960"]);
test('changed panels introduce no new full rendered-body intersections with retained equipment',()=>{
 const model=createBerghainModel(),counts=new Map();
 try{
  const bodies=layout.parts.map(p=>{const name=[p.section,p.material,p.shape].join('/'),mesh=model.getObjectByName(name),i=counts.get(name)||0;counts.set(name,i+1);
   const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);mesh.geometry.computeBoundingBox();
   return {part:p,box:mesh.geometry.boundingBox.clone().applyMatrix4(m),key:p.name+'/'+m.elements.slice(12,15).map(n=>n.toFixed(5)).join(',')};});
  const clouds=bodies.filter(b=>b.part.name==='Panorama acoustic cloud');
  for(const [i,cloud]of clouds.entries())for(const other of bodies){
   if(other===cloud)continue;
   const size=cloud.box.clone().intersect(other.box).getSize(new THREE.Vector3());
   if(size.x>1e-6&&size.y>1e-6&&size.z>1e-6)assert.ok(priorContacts.has(i+'/'+other.key),'New whole-body overlap at panel '+i+': '+other.key);
  }
 }finally{disposeBerghainModel(model);}
});

test('portable panel geometry matches every actual source vertex after fitted transforms',()=>{
 const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
 const length=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+length));
 const primitive=g.meshes.find(m=>m.name==='interior/pale/box').primitives[0];
 const accessor=g.accessors[primitive.attributes.POSITION],view=g.bufferViews[accessor.bufferView];
 assert.equal(accessor.componentType,5126);assert.ok(!view.byteStride);
 const native=new Float32Array(bytes.buffer,bytes.byteOffset+28+length+view.byteOffset+(accessor.byteOffset||0),accessor.count*3);
 const group=layout.parts.filter(p=>p.section==='interior'&&p.material==='pale'&&p.shape==='box'),model=createBerghainModel();
 try{
  const mesh=model.getObjectByName('interior/pale/box'),pos=mesh.geometry.attributes.position,m=new THREE.Matrix4(),v=new THREE.Vector3();let checked=0;
  for(const p of panels){const i=group.indexOf(p);assert.ok(i>=0);mesh.getMatrixAt(i,m);
   for(let j=0;j<pos.count;j++){v.fromBufferAttribute(pos,j).applyMatrix4(m);const n=(i*pos.count+j)*3;
    assert.ok(Math.hypot(v.x-native[n],v.y-native[n+1],v.z-native[n+2])<2e-5,'Portable panel vertices must preserve the actual fitted body');checked++;
   }
  }
  assert.equal(checked,384);
 }finally{disposeBerghainModel(model);}
});
