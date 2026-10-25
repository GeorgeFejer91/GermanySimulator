import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,entranceElevation} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand} from '../berghain/navigation.mjs';

test('entrance elevation follows observed twelve openings, nine grilles and seventeen vents',()=>{
 const windows=layout.parts.filter(p=>p.name==='south tier window');
 assert.equal(windows.length,48);
 for(const y of [4.875,7.225,11.675,16.05])assert.equal(windows.filter(p=>Math.abs(p.center[1]-y)<.001).length,12);
 assert.equal(layout.parts.filter(p=>p.name==='south attic grille recess').length,9);
 assert.equal(layout.parts.filter(p=>p.name==='south upper attic vent').length,17);
 const row=windows.filter(p=>Math.abs(p.center[1]-11.675)<.001).sort((a,b)=>a.center[0]-b.center[0]);
 const spacing=row.slice(1).map((p,i)=>p.center[0]-row[i].center[0]);
 assert.ok(spacing[0]>spacing[3]*1.6&&spacing.at(-1)>spacing[7]*1.35,'wide blind fields at both ends');
 assert.ok(row.every(p=>p.size[0]>1.2&&p.size[0]<1.6),'photo-estimated narrow openings');
 assert.match(entranceElevation.confidence,/estimated/);
 assert.match(entranceElevation.panorama,/unresolved/);
});

test('visible masonry joints stop at the open entrance, including above head height',()=>{
 const strips=layout.parts.filter(p=>p.name==='south rustication'&&p.center[1]<3.4);
 const a=studyToSite({x:-1.59,y:.1,z:21.9}),b=studyToSite({x:1.59,y:3.3,z:22.5});
 const opening=new THREE.Box3(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z));
 for(const part of strips){
  const box=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5))
   .applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
  assert.equal(box.intersectsBox(opening),false,'rustication visibly spans entrance at '+part.center);
 }
});

test('revised facade remains continuous collision with the entrance approach below it',()=>{
 for(let x=-21.8;x<22;x+=.2){
  const p=studyToSite({x,y:7,z:22});
  assert.equal(canStand(p,layout),false,'facade gap at '+x);
 }
 // Rendering and collision must agree for every changed opaque panel/window.
 for(const s of layout.solids.filter(s=>s.name?.startsWith('south ')&&s.renderPart)){
  const m=s.renderPart.matrix,half=(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))/2;
  assert.ok(Math.abs(s.y[0]-(m[13]-half))<1e-6);
  assert.ok(Math.abs(s.y[1]-(m[13]+half))<1e-6);
 }
 assert.ok(canStand(studyToSite({x:0,y:.05,z:23.5}),layout));
});
