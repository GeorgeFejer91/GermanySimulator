import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createMainBarGeometries} from '../assets/models/berghain/main-bar.mjs';

test('Main-bar first-person camera keeps the eye inside the legal body through turns',async()=>{
 const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
 const walk=createWalkthrough(),camera=new THREE.PerspectiveCamera(60,1.5,.08,500),direction=new THREE.Vector3();
 try{
  for(const position of [15.8,16.1].map(x=>studyToSite({x,y:5.45,z:-4}))){
   assert.ok(canStand(position,layout));
   for(let yaw=0;yaw<Math.PI*2;yaw+=.02)for(const pitch of [-.8,0,.8]){
    walk.camera(camera,position,yaw,pitch);
    assert.deepEqual(camera.position.toArray(),[position.x,position.y+1.68,position.z]);
    assert.equal(camera.fov,60);assert.equal(walk.avatar,undefined);
    camera.getWorldDirection(direction);
    assert.ok(direction.distanceTo(new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)))<1e-12);
   }
  }
 }finally{walk.dispose();}
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
  const glass=studyToSite({x:15.4,y:5.45,z:-5});
  assert.equal(canStand(glass,layout),false,'Visible glass must physically stop the full body');
  const targets=[[14,7],[16.1,7],[16.1,4],[16.1,-13.5],[16.1,4],[16.1,7],[14,7]];
  let position=studyToSite({x:targets[0][0],y:5.45,z:targets[0][1]});assert.ok(canStand(position,layout));
  for(const [x,z]of targets.slice(1)){
    const target=studyToSite({x,y:5.45,z}),dx=target.x-position.x,dz=target.z-position.z;
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

test('stools follow the visible curved counter with separated seats and complete collision bounds',()=>{
  const corner=layout.parts.find(p=>p.fixture==='main-long-bar'&&p.shape==='main-bar-corner-body');
  const seats=layout.parts.filter(p=>p.shape==='main-bar-stool-seat'&&p.center[2]>corner.center[2]+.1);
  assert.ok(seats.length>=3,'The straight row must continue around the return');
  const angles=seats.map(p=>Math.atan2(p.center[2]-corner.center[2],p.center[0]-corner.center[0]));
  assert.ok(Math.max(...angles)-Math.min(...angles)>.8,'Seats occupy different sides of the curve');
  const geometries={cylinder:new THREE.CylinderGeometry(.5,.5,1,12),ring:new THREE.TorusGeometry(.5,.035,6,20),...createMainBarGeometries()};
  const counter=new THREE.Mesh(geometries['main-bar-corner-body'],new THREE.MeshBasicMaterial());
  counter.matrixAutoUpdate=false;counter.matrix.fromArray(corner.matrix);counter.updateMatrixWorld(true);
  try{
    for(const seat of seats){
      const origin=new THREE.Vector3(...seat.center),direction=new THREE.Vector3(corner.center[0],origin.y,corner.center[2]).sub(origin).normalize();
      const hit=new THREE.Raycaster(origin,direction).intersectObject(counter)[0];
      assert.ok(hit&&hit.distance>.45&&hit.distance<.6,'Real curved cabinet remains separated from the seat');
      const solid=layout.solids.find(s=>s.fixture===seat.fixture);
      assert.ok(solid,'The complete stool assembly needs a collider');
      for(const part of layout.parts.filter(p=>p.fixture===seat.fixture)){
        const geometry=geometries[part.shape],matrix=new THREE.Matrix4().fromArray(part.matrix);
        for(let i=0;i<geometry.attributes.position.count;i++){
          const point=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i).applyMatrix4(matrix);
          for(const axis of ['x','y','z'])assert.ok(point[axis]>=solid[axis][0]-1e-6&&point[axis]<=solid[axis][1]+1e-6,'Actual mesh fits its stool collision');
        }
      }
      for(const other of layout.parts.filter(p=>p.shape==='main-bar-stool-seat'&&p!==seat))
        assert.ok(Math.hypot(seat.center[0]-other.center[0],seat.center[2]-other.center[2])>.6,'Separate stool bodies');
    }
  }finally{counter.material.dispose();for(const geometry of Object.values(geometries))geometry.dispose();}
});

test('the full visitor can walk around the furnished bar return in both directions and escape stool contact',()=>{
  const c=layout.parts.find(p=>p.fixture==='main-long-bar'&&p.shape==='main-bar-corner-body').center;
  const arc=Array.from({length:211},(_,i)=>{const a=(180-i*.5)*Math.PI/180;return{x:c[0]+2.9*Math.cos(a),y:5.45,z:c[2]+2.9*Math.sin(a)};});
  for(const route of [arc,[...arc].reverse()]){
    let position=route[0];assert.ok(canStand(position,layout));
    for(const target of route.slice(1)){
      position=moveVisitor(position,{x:target.x-position.x,z:target.z-position.z},layout);
      assert.ok(canStand(position,layout));
      assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<1e-6,'Continuous body-clear arc');
    }
  }
  for(const seat of layout.parts.filter(p=>p.shape==='main-bar-stool-seat'&&p.center[2]>c[2]+.1)){
    const dx=seat.center[0]-c[0],dz=seat.center[2]-c[2],length=Math.hypot(dx,dz),out={x:dx/length,z:dz/length};
    const start={x:seat.center[0]+out.x*.85,y:5.45,z:seat.center[2]+out.z*.85};assert.ok(canStand(start,layout));
    const stopped=moveVisitor(start,{x:-out.x*2,z:-out.z*2},layout);assert.ok(canStand(stopped,layout));
    assert.ok(Math.hypot(stopped.x-seat.center[0],stopped.z-seat.center[2])>.4,'Delayed step stops outside stool');
    const escaped=moveVisitor(stopped,{x:out.x*.8,z:out.z*.8},layout);assert.ok(canStand(escaped,layout));
    assert.ok(Math.hypot(escaped.x-stopped.x,escaped.z-stopped.z)>.56,'Reverse clears one full body diameter');
  }
});
