import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createMainBarGeometries} from '../assets/models/berghain/main-bar.mjs';

test('the screen crossbars do not hide the human during a full camera turn',async()=>{
 const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
 const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
 const walk=createWalkthrough(),model=createBerghainModel(),camera=new THREE.PerspectiveCamera(60,1.5,.08,500);
 try{
  for(const x of [15.8,16.1]){
   const position=studyToSite({x,y:6.65,z:-4});assert.ok(canStand(position,layout));walk.step(position,{x:0,z:0},0);
   for(let yaw=0;yaw<Math.PI*2;yaw+=Math.PI/32){
    const distance=walk.camera(camera,position,yaw,0,model);
    assert.ok(distance>.65,`Screen at x=${x}, yaw=${yaw} hides the human at ${distance}m`);
    assert.equal(walk.avatar.group.visible,true);
    for(let frame=0;frame<90&&walk.cameraTurning;frame++){
     const previous=camera.position.clone();walk.camera(camera,position,yaw,0,model);
     const beforeAngle=Math.atan2(previous.x-position.x,previous.z-position.z),afterAngle=Math.atan2(camera.position.x-position.x,camera.position.z-position.z);
     assert.ok(Math.abs(Math.atan2(Math.sin(afterAngle-beforeAngle),Math.cos(afterAngle-beforeAngle)))<.051,'Bound the azimuth change; real opaque obstacles may still contract the radius immediately');
    }
    assert.equal(walk.cameraTurning,false,'The demand-driven camera must settle');
    assert.ok(Math.abs(camera.position.y-position.y-.95-Math.sin(.32)*camera.position.distanceTo(new THREE.Vector3(position.x,position.y+.95,position.z)))<.0001,'Retain the ordinary walking elevation');
    const bounds=new THREE.Box3().setFromObject(walk.avatar.group);
    for(const aspect of [1280/650,390/570,844/170]){
     camera.aspect=aspect;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
     for(const bx of [bounds.min.x,bounds.max.x])for(const by of [bounds.min.y,bounds.max.y])for(const bz of [bounds.min.z,bounds.max.z]){
      const projected=new THREE.Vector3(bx,by,bz).project(camera);
      assert.ok(Math.abs(projected.x)<.94&&Math.abs(projected.y)<.94,'The complete human must fit beside the screen');
     }
    }
   }
  }
  const below=studyToSite({x:15.8,y:.05,z:-4});
  const distance=walk.camera(camera,below,0,0,model);
  assert.ok(Math.abs((camera.position.y-below.y-.95)/distance-Math.sin(.32))<.0001,'A screen on another floor must not lift this camera');
 }finally{walk.dispose();disposeBerghainModel(model);}
});

test('the long-bar assembly replaces the two-metre placeholder with photo-informed human-scale furniture',()=>{
  assert.ok(layout.mainBar?.sources.includes('I23'),'The architect long-bar sequence must own the assembly evidence');
  const bar=layout.fixtures.find(f=>f.id==='main-long-bar');
  assert.ok(bar&&bar.dimensions.height>=1.05&&bar.dimensions.height<=1.17,'A usable guest counter is about 1.1m above the floor');
  assert.ok(!layout.parts.some(p=>['bar hall counter','bar back','bar bottle'].includes(p.name)),'Remove the generic bar, window-side back block and floating bottle grid');
  const stools=layout.fixtures.filter(f=>f.id.startsWith('main-bar-stool-'));
  assert.ok(stools.length>=14&&stools.every(f=>f.dimensions.seatHeight>.70&&f.dimensions.seatHeight<.82));
  assert.ok(layout.parts.some(p=>p.fixture==='main-long-bar'&&p.role==='luminous band'));
  assert.ok(layout.parts.some(p=>p.fixture==='main-long-bar'&&p.shape==='main-bar-corner-top'),'The photographed rounded return must be actual geometry');
});

test('the actual glass screen separates the hall while the body can enter, traverse and leave the guest aisle',()=>{
  const glass=studyToSite({x:15.4,y:6.65,z:-5});
  assert.equal(canStand(glass,layout),false,'Visible glass must physically stop the full body');
  const targets=[[14,7],[16.1,7],[16.1,4],[16.1,-13.5],[16.1,4],[16.1,7],[14,7]];
  let position=studyToSite({x:targets[0][0],y:6.65,z:targets[0][1]});assert.ok(canStand(position,layout));
  for(const [x,z]of targets.slice(1)){
    const target=studyToSite({x,y:6.65,z}),dx=target.x-position.x,dz=target.z-position.z;
    const steps=Math.ceil(Math.hypot(dx,dz)/.06);
    for(let i=0;i<steps;i++)position=moveVisitor(position,{x:dx/steps,z:dz/steps},layout);
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.02,'Full body must traverse the real bar aisle');
    assert.ok(canStand(position,layout));
  }
});

test('actual bar meshes fit around the retained concrete columns and stool collision uses human-sized seats',()=>{
  const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),
    ring:new THREE.TorusGeometry(.5,.035,6,20),...createMainBarGeometries()};
  const columns=layout.solids.filter(s=>s.name==='load-bearing column');
  assert.equal(columns.length,15,'Retain the structural grid');
  const point=new THREE.Vector3();let intersections=0;
  try{
    for(const part of layout.parts.filter(p=>p.fixture?.startsWith('main-'))){
      const geometry=geometries[part.shape],matrix=new THREE.Matrix4().fromArray(part.matrix);
      for(let i=0;i<geometry.attributes.position.count;i++){
        point.fromBufferAttribute(geometry.attributes.position,i).applyMatrix4(matrix);
        if(columns.some(c=>point.x>c.x[0]+.001&&point.x<c.x[1]-.001&&point.y>c.y[0]+.001&&point.y<c.y[1]-.001&&point.z>c.z[0]+.001&&point.z<c.z[1]-.001))intersections++;
      }
    }
    assert.equal(intersections,0,'No rendered bar/glass/furniture vertex may be buried in retained concrete');
    for(const solid of layout.solids.filter(s=>s.fixture?.startsWith('main-bar-stool-'))){
      assert.ok(solid.x[1]-solid.x[0]<.51&&solid.z[1]-solid.z[0]<.51,'A custom seat must not acquire a one-metre unit-box collider');
    }
  }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});
