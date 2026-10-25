import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {smokingToAuthor} from '../assets/models/berghain/architectural-circulation.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

test('one full-height Panorama room contains all six photographed window bays',()=>{
 const room=layout.floors.find(f=>f.name==='Panorama Bar');
 const windows=layout.parts.filter(p=>p.name==='south tier window'&&p.center[1]>9&&p.center[1]<14)
  .sort((a,b)=>a.center[0]-b.center[0]).slice(0,6);
 assert.equal(windows.length,6);
 for(const p of windows){
  assert.ok(p.center[0]-p.size[0]/2>room.x[0]&&p.center[0]+p.size[0]/2<room.x[1]);
  assert.ok(room.y<p.center[1]-p.size[1]/2,'window sill stays above walking floor');
  assert.ok(layout.panoramaServices.ceilingHeight>p.center[1]+p.size[1]/2,'complete window height fits');
 }
 const upper=layout.floors.find(f=>f.name==='upper Panorama lounge');
 assert.ok(upper.x[0]>room.x[1],'adjacent upper slab does not bisect six-window volume');
 assert.match(layout.panoramaRegistration.section.confidence,/estimated/);
});

test('room widening preserves the metre spacing inside each radiator assembly',()=>{
 const fixtures=layout.fixtures.filter(f=>f.id.startsWith('panorama-radiator-'));
 assert.equal(fixtures.length,6);
 for(const f of fixtures){
  const valves=layout.parts.filter(p=>p.fixture===f.id&&p.name.endsWith('valve stem'));
  assert.equal(valves.length,2);
  assert.ok(Math.abs(Math.hypot(...valves[0].center.map((x,i)=>x-valves[1].center[i]))-1.56)<1e-7,
   'A larger room must not pull a rigid radiator apart');
 }
});

test('the main hall reaches the Eisbar stair on the hall side of the glass screen',()=>{
 const route=layout.architecturalCirculation.eisbar.mainApproach;
 for(const points of [route,route.toReversed()]){
  let p={...points[0]};
  for(const target of points.slice(1)){
   const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.025);
   const step={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
   for(let i=0;i<n;i++)p=moveVisitor(p,step,layout);
   assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.03,'Full body must clear each approach segment '+JSON.stringify({p,target}));
   assert.ok(Math.abs(p.y-target.y)<.03);
  }
 }
});

test('Klo keeps its full-height fittings below the Panorama floor construction',()=>{
 const ceiling=layout.solids.find(s=>s.name==='Klo red ceiling');
 const slab=layout.solids.find(s=>s.name==='Panorama Bar');
 assert.ok(ceiling.y[1]<=slab.y[0]+1e-8,'separate finish meets slab underside without penetrating the walking room');
 assert.ok(layout.kloBar.ceilingHeight-layout.kloBar.floorHeight>=3.1);
 const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
 assert.equal(bar.dimensions.height,3.02,'no fixture compression to conceal section error');
});

test('the extended smoking upper landing has a physical guard beyond the return flight',()=>{
 const site=([x,y,z])=>{const q=smokingToAuthor([x,y,z]);return studyToSite({x:q[0],y:q[1],z:q[2]});};
 const start=site([28.6,9.05,-16.5]),target=site([28.6,9.05,-15.1]);
 const space={floors:[{x:[-100,100],z:[-100,100],y:9.05}],solids:layout.solids};
 assert.ok(canStand(start,space));
 const end=moveVisitor(start,{x:target.x-start.x,z:target.z-start.z},space);
 assert.ok(Math.hypot(end.x-target.x,end.z-target.z)>.4,'missing floor support cannot substitute for a guard');
 const stairs=layout.architecturalCirculation.stairs.filter(s=>s.name.includes('smoking')&&s.name.includes('enclosed'));
 for(const s of stairs){
  const rise=Math.abs(s.author.y[1]-s.author.y[0])/s.steps;
  assert.ok(rise>.15&&rise<.19);
  assert.ok(Math.abs(s.author.z[1]-s.author.z[0])<4,'incline occupies projecting portion, with a level approach');
 }
});

test('the six rigid radiators sit below the actual glazed openings and inner frames',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const groups=new Map();
  for(const p of layout.parts){const key=[p.section,p.material,p.shape].join('/');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  const windows=layout.parts.filter(p=>p.name==='south tier window'&&p.center[1]>9&&p.center[1]<14).sort((a,b)=>a.center[0]-b.center[0]).slice(0,6);
  for(const f of layout.fixtures.filter(f=>f.id.startsWith('panorama-radiator-'))){
   const bounds=new THREE.Box3();
   model.traverse(mesh=>{if(!mesh.isInstancedMesh)return;const parts=groups.get(mesh.name);if(!parts)return;
    mesh.geometry.computeBoundingBox();
    for(let i=0;i<parts.length;i++)if(parts[i].fixture===f.id){const matrix=new THREE.Matrix4();mesh.getMatrixAt(i,matrix);bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(matrix).applyMatrix4(mesh.matrixWorld));}
   });
   const window=windows.toSorted((a,b)=>Math.abs(a.center[0]-f.anchor[0])-Math.abs(b.center[0]-f.anchor[0]))[0];
   const sill=window.center[1]-window.size[1]/2;
   assert.ok(bounds.max.y<=sill+1e-5,`Radiator ${f.id} top ${bounds.max.y} overlaps glazing sill ${sill}`);
   const height=bounds.max.y-bounds.min.y;
   assert.ok(height>.79&&height<.82,'Preserve the rigid radiator rather than shrinking it to hide the mismatch');
   const index=windows.indexOf(window),inner=layout.parts.filter(p=>p.name===`Panorama window room ${index} inner upright`);
   assert.equal(inner.length,4);
   for(const p of inner)assert.ok(Math.abs(p.center[1]-p.size[1]/2-sill)<1e-5,'Inner frame and actual facade opening must share a sill');
  }
 }finally{disposeBerghainModel(model);}
});
