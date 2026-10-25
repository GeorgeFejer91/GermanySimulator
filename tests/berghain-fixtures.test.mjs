import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createAcousticGrilleGeometry} from '../assets/models/berghain/interior-fixtures.mjs';
import {createVisitorAvatar} from '../assets/models/berghain/avatar.mjs';

test('source-derived furniture retains metre dimensions and explicit placement uncertainty',()=>{
  assert.ok(layout.fixtures?.length,'Distinctive furniture is required, not the old generic blocks');
  const bar=layout.fixtures.find(f=>f.id==='panorama-bar');
  assert.ok(bar.sources.includes('A13'));
  assert.ok(bar.dimensions.height>=1.05&&bar.dimensions.height<=1.2,'human-scale bar counter');
  assert.match(bar.confidence,/inferred/);
  const stool=layout.fixtures.find(f=>f.id==='panorama-stool-0');
  assert.ok(stool.dimensions.height>.7&&stool.dimensions.height<.8);
  assert.ok(stool.dimensions.width>.4&&stool.dimensions.width<.6);
  const seat=layout.fixtures.find(f=>f.id==='foyer-channel-seat-0');
  assert.ok(seat.sources.includes('I09'));
  assert.ok(seat.dimensions.seatHeight>=.4&&seat.dimensions.seatHeight<=.5);
});

test('fixture collision stops the full body while preserving a route beside the counter',()=>{
  assert.ok(layout.fixtures?.length,'Source-derived furniture required');
  const bar=layout.fixtures.find(f=>f.id==='panorama-bar'),[x,y,z]=bar.anchor;
  const start={x:x+3,y,z:z-3};
  assert.ok(canStand(start,layout));
  const blocked=moveVisitor(start,{x:-5,z:0},layout);
  assert.ok(blocked.x>x+.7&&canStand(blocked,layout),'No tunnelling through counter/stools');
  let alongside={...start};
  for(let i=0;i<40;i++)alongside=moveVisitor(alongside,{x:0,z:.15},layout);
  assert.ok(alongside.z>start.z+5.8&&canStand(alongside,layout),'Body-clear circulation beside bar');
});

test('all furniture instances have finite physical geometry and share the existing renderer',()=>{
  assert.ok(layout.fixtures?.length,'Source-derived furniture required');
  const model=createBerghainModel();
  const bounds=new THREE.Box3().setFromObject(model);
  assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));
  const shapes=new Set();
  model.traverse(mesh=>{if(mesh.isInstancedMesh){shapes.add(mesh.name.split('/').at(-1));assert.ok(mesh.count>0);}});
  assert.ok(shapes.has('cylinder')&&shapes.has('ring'),'Circular seats and foot rings are actual geometry');
  assert.ok(!layout.parts.some(p=>p.name==='foyer concrete seat'||p.name==='Panorama bar counter'),'Old box surrogates removed');
  disposeBerghainModel(model);
});

test('acoustic grille holes are open geometry with solid metal between them',()=>{
  const geometry=createAcousticGrilleGeometry(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const plate=new THREE.Mesh(geometry,material);plate.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(-.53,-.11,1),new THREE.Vector3(0,0,-1),0,2);
  assert.equal(ray.intersectObject(plate).length,0,'light/sightline passes through an opening');
  ray.ray.origin.x=-.455;
  assert.ok(ray.intersectObject(plate).length>0,'neighbouring plate remains opaque actual mesh');
  geometry.dispose();material.dispose();
});

test('Panorama hanging lights leave comfortable clearance over a standing visitor',()=>{
  const lenses=layout.parts.filter(p=>p.fixture?.startsWith('panorama-pendant')&&p.name.endsWith('lamp lens'));
  assert.equal(lenses.length,9);
  for(const part of lenses){
    const m=part.matrix,lowest=m[13]-(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))/2;
    assert.ok(lowest-layout.panoramaServices.floorHeight>=2.1,'inferred light placement must clear a standing person comfortably');
  }
});

test('the complete walking avatar clears suspended foyer furniture across all main-stair lanes',()=>{
  const ramp=layout.floors.find(f=>f.name==='main stair'),[a,b]=ramp.rampAxis;
  const fixtures=layout.parts.filter(p=>p.fixture?.includes('pendant')&&p.shape==='box').map(part=>({part,
    inverse:new THREE.Matrix4().fromArray(part.matrix).invert(),
    bounds:new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(part.matrix))}));
  const avatar=createVisitorAvatar(),point=new THREE.Vector3();let legal=0;
  try{
    for(const dx of [-.7,0,.7])for(let sample=0;sample<=100;sample++){
      const t=sample/100,length=Math.hypot(b[0]-a[0],b[1]-a[1]),position={x:a[0]+t*(b[0]-a[0])-dx*(b[1]-a[1])/length,y:ramp.y+t*(ramp.endY-ramp.y),z:a[1]+t*(b[1]-a[1])+dx*(b[0]-a[0])/length};
      if(!canStand(position,layout))continue;legal++;
      avatar.group.position.set(position.x,position.y,position.z);avatar.pose(.03,0);avatar.group.updateMatrixWorld(true);
      const body=new THREE.Box3().setFromObject(avatar.group);
      for(const fixture of fixtures){
        if(!body.intersectsBox(fixture.bounds))continue;
        avatar.group.traverse(mesh=>{
          if(!mesh.isMesh)return;
          const vertices=mesh.geometry.attributes.position;
          for(let vertex=0;vertex<vertices.count;vertex++){
            point.fromBufferAttribute(vertices,vertex).applyMatrix4(mesh.matrixWorld).applyMatrix4(fixture.inverse);
            assert.ok(!(Math.abs(point.x)<.499999&&Math.abs(point.y)<.499999&&Math.abs(point.z)<.499999),
              `visible avatar enters ${fixture.part.name} at ${JSON.stringify(position)}`);
          }
        });
      }
    }
    assert.ok(legal>250,'actual clear stair lanes must be sampled, not removed');
  }finally{avatar.dispose();}
});
