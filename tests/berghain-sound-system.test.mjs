import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createSpeakerGeometries,speakerSpecifications} from '../assets/models/berghain/speaker-geometries.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';

test('main-hall sound equipment has sourced components and explicit arrangement uncertainty',()=>{
  assert.ok(layout.soundSystem?.components?.length,'Replace generic stacks with the documented component forms');
  const inventory=Object.fromEntries(['f218mk2','evo6el','evo6eh','f124'].map(type=>[type,layout.soundSystem.components.filter(c=>c.type===type).length]));
  assert.deepEqual(inventory,{f218mk2:12,evo6el:16,evo6eh:10,f124:6});
  assert.match(layout.soundSystem.confidence,/reported|inferred/i);
  assert.ok(layout.soundSystem.sources.includes('S05'));
  for(const component of layout.soundSystem.components){
    assert.equal(component.units,'metres');
    assert.match(component.confidence,/inferred/i);
    assert.ok(component.sources.length>=2);
  }
});

test('main-hall generic solid boxes and flat horn decals are replaced together',()=>{
  assert.ok(!layout.parts.some(p=>p.name==='speaker stack'||p.name==='speaker horn'),'Actual hollow speaker forms required');
  assert.ok(!layout.solids.some(s=>s.name==='speaker stack'),'Remove obsolete stack collision with its visible block');
});

test('actual speaker geometry retains independent manufacturer envelope dimensions and finite unit normals',()=>{
  const expected={evo6eh:[.661,.656,.565],evo6el:[.661,.484,.565],f218mk2:[1.326,.496,.723],f124:[.702,.992,1.056]};
  const geometries=createSpeakerGeometries();
  try{
    for(const [type,size]of Object.entries(expected)){
      const bounds=new THREE.Box3();
      for(const [name,geometry]of Object.entries(geometries).filter(([name])=>name.startsWith('speaker-'+type+'-'))){
        const position=geometry.attributes.position,normal=geometry.attributes.normal;
        assert.ok(position.count>30&&Array.from(position.array).every(Number.isFinite),name);
        for(let vertex=0;vertex<normal.count;vertex++)assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(normal,vertex).length()-1)<1e-5);
        bounds.union(geometry.boundingBox);
      }
      const measured=bounds.getSize(new THREE.Vector3()).multiply(new THREE.Vector3(...size));
      for(let axis=0;axis<3;axis++)assert.ok(Math.abs(measured.getComponent(axis)-size[axis])<.00002,type+' outer envelope');
    }
  }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});

test('horn apertures have real depth rather than a solid front or painted rectangle',()=>{
  const geometries=createSpeakerGeometries(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  try{
    for(const [type,y]of [['evo6eh',.202],['evo6el',.035],['f124',.15]]){
      const spec=speakerSpecifications[type],group=new THREE.Group();
      for(const [name,geometry]of Object.entries(geometries).filter(([name])=>name.startsWith('speaker-'+type+'-'))){
        const mesh=new THREE.Mesh(geometry,material);mesh.scale.set(spec.width,spec.height,spec.depth);group.add(mesh);
      }
      group.updateMatrixWorld(true);
      const hits=new THREE.Raycaster(new THREE.Vector3(0,y,1),new THREE.Vector3(0,0,-1),0,3).intersectObject(group);
      assert.ok(hits.length>0,type+' retains a back/throat');
      assert.ok(hits[0].distance>1-spec.depth/2+.12,type+' ray enters the actual aperture');
    }
  }finally{material.dispose();for(const geometry of Object.values(geometries))geometry.dispose();}
});

test('visible component surfaces fit their shared transformed collision envelopes',()=>{
  const geometries=createSpeakerGeometries(),point=new THREE.Vector3();
  let checked=0;
  try{
    for(const component of layout.soundSystem.components){
      const solid=layout.solids.find(s=>s.equipment===component.id);
      assert.ok(solid,'Every physical component has collision');
      for(const part of layout.parts.filter(p=>p.equipment===component.id)){
        const vertices=geometries[part.shape].attributes.position,matrix=new THREE.Matrix4().fromArray(part.matrix);
        for(let vertex=0;vertex<vertices.count;vertex++){
          point.fromBufferAttribute(vertices,vertex).applyMatrix4(matrix);
          for(const [axis,name]of ['x','y','z'].entries())assert.ok(point.getComponent(axis)>=solid[name][0]-.00002&&point.getComponent(axis)<=solid[name][1]+.00002,part.name+' visible surface outside collider');
        }
        checked++;
      }
    }
    assert.equal(checked,176);
  }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});

import {mainHallWorldPoint,mainHallOriginalPoint,mainBarWorldPoint,mainBarOriginalPoint} from '../assets/models/berghain/main-hall-registration.mjs';
const registered=(p,fn=mainHallWorldPoint)=>{const[x,y,z]=fn([p.x,p.y,p.z]);return{x,y,z};};
const hallSite=p=>registered(studyToSite(p));

test('a visitor stops at the bass wall and can traverse its western circulation aisle',()=>{
  const start=hallSite({x:2,y:5.45,z:-5.5});
  assert.ok(canStand(start,layout));
  const blocked=moveVisitor(start,{x:0,z:5},layout);
  assert.ok(canStand(blocked,layout)&&mainHallOriginalPoint(blocked).x>studyToSite({x:-1.6,y:5.45,z:-5.5}).x,'Bass wall blocks the whole body');
  let position=hallSite({x:-3.8,y:5.45,z:-10.5});
  assert.ok(canStand(position,layout),'Aisle begins at a legal position');
  const destination=hallSite({x:-3.8,y:5.45,z:-.5});
  for(let step=0;step<100;step++)position=moveVisitor(position,{x:(destination.x-position.x)/Math.max(1,100-step),z:(destination.z-position.z)/Math.max(1,100-step)},layout);
  assert.ok(Math.hypot(position.x-destination.x,position.z-destination.z)<.05&&canStand(position,layout),'Body-clear passage stays available beside sub wall');
});
