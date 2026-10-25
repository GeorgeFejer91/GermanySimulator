import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,materials} from '../assets/models/berghain/layout.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

test('the counter has a continuous opaque interior backdrop above its worktop',()=>{
 // Sample a visible plane independently of the wall implementation: the old
 // generic facade exposes openings throughout this area in I19 comparison.
 const boxes=layout.parts.filter(p=>p.section==='interior'&&p.shape==='box'&&p.matrix&&
  !materials[p.material].transparent&&!materials[p.material].transmission).map(p=>
   new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix)));
 for(const y of [14.6,15.2,15.8,16.4])for(const z of [10,11,12,13,14,15,16,17,18,19,20]){
  const ray=new THREE.Ray(new THREE.Vector3(-18.1,y,z),new THREE.Vector3(-1,0,0));
  assert.ok(boxes.some(b=>{const hit=ray.intersectBox(b,new THREE.Vector3());return hit&&hit.x>=-18.55;}),`opaque inner plane at ${y},${z}`);
 }
});

test('wall, service opening and overhead panels have visible body barriers without becoming a through-route',()=>{
 const wall=layout.parts.filter(p=>p.fixture==='panorama-counter-wall');
 assert.ok(wall.length>0);
 for(const p of wall.filter(p=>p.shape==='box')){
  const b=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
  const s=layout.solids.find(s=>s.renderPart===p);assert.ok(s,p.name);
  for(const [axis,i] of [['x',0],['y',1],['z',2]])assert.deepEqual(s[axis],[b.min.getComponent(i),b.max.getComponent(i)]);
 }
 // Use a supported test plane so a missing floor cannot masquerade as a wall.
 const space={floors:[{x:[-30,0],y:13.25,z:[0,30]}],solids:layout.solids.filter(s=>s.renderPart?.fixture==='panorama-counter-wall')};
 for(const z of [8.8,14.5,19.5]){
  const p=moveVisitor({x:-17.8,y:13.25,z},{x:-2,z:0},space);
  assert.ok(p.x>=-18.07,'closed wall/recess must stop the full body');
 }
 assert.equal(layout.panoramaRegistration.counterWall.throughAccess,false);
 assert.match(layout.panoramaRegistration.counterWall.confidence,/estimated/);
});

test('the retained service aisle is body-clear and the rack stays separate from the lining',()=>{
 const route=[{x:-16.85,y:13.25,z:9.3},{x:-16.85,y:13.25,z:17.8}];
 let p={...route[0]};assert.ok(canStand(p,layout));
 for(const target of [route[1],route[0]]){
  const n=Math.ceil(Math.abs(target.z-p.z)/.02),dz=(target.z-p.z)/n;
  for(let i=0;i<n;i++){p=moveVisitor(p,{x:0,z:dz},layout);assert.ok(canStand(p,layout));}
  assert.ok(Math.abs(p.z-target.z)<.04);
 }
 const rack=layout.solids.find(s=>s.name==='panorama-bottle-rack assembly clearance');
 const lining=layout.solids.filter(s=>s.renderPart?.fixture==='panorama-counter-wall'&&s.y[0]<15&&s.z[0]<rack.z[1]&&s.z[1]>rack.z[0]);
 assert.ok(rack.x[0]-Math.max(...lining.map(s=>s.x[1]))>.25,'rack does not intersect the wall');
});

test('the actual structural beams leave full-body headroom across all five Panorama stair lanes',()=>{
 const beams=layout.parts.filter(p=>p.name==='structural beam').map(p=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix)));
 for(const dz of [-.9,-.7,0,.7,.9]){
  const [a,b]=layout.panoramaRegistration.stairRoute.slice(0,2).map(p=>({...p,z:p.z+dz}));
  let p={...a};assert.ok(canStand(p,layout));
  for(const target of [b,a]){
   const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.025),step={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
   for(let i=0;i<n;i++){
    p=moveVisitor(p,step,layout);assert.ok(canStand(p,layout));
    const body=new THREE.Box3(new THREE.Vector3(p.x-.28,p.y+.12,p.z-.28),new THREE.Vector3(p.x+.28,p.y+1.8,p.z+.28));
    assert.ok(beams.every(b=>!b.intersectsBox(body)),'visible beam intersects the occupied body '+JSON.stringify(p));
   }
   assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.09);
  }
 }
 assert.equal(layout.panoramaRegistration.stairClearance.retired.length,1);
});
