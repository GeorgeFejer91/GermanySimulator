import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
const bodies=layout.parts.filter(p=>p.foyerPlatform&&p.name.endsWith(' body'));
const bounds=p=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
test('photographed low platform bodies rest on the foyer floor and clear stairs and structural solids',()=>{
 assert.equal(bodies.length,3);
 for(const body of bodies){
  const b=bounds(body),s=layout.solids.find(s=>s.renderPart===body);
  assert.ok(s);assert.ok(Math.abs(b.min.y-.05)<1e-7);assert.ok(b.max.y<.5);
  for(const axis of ['x','y','z']){assert.ok(Math.abs(b.min[axis]-s[axis][0])<1e-7);assert.ok(Math.abs(b.max[axis]-s[axis][1])<1e-7);}
  const top=layout.parts.find(p=>p.foyerPlatform===body.foyerPlatform&&p.name.endsWith(' top')),t=bounds(top);
  assert.ok(Math.abs(t.min.y-b.max.y)<1e-7);assert.ok(t.max.y<.5);
  for(const solid of layout.solids){
   if(solid.renderPart?.foyerPlatform===body.foyerPlatform)continue;
   assert.ok(['x','y','z'].some(a=>b.max[a]<=solid[a][0]+.001||b.min[a]>=solid[a][1]-.001),body.name+' intersects '+solid.name);
  }
 }
});
test('platform sides stop full visitor bodies and allow perimeter recovery at normal and delayed frame steps',()=>{
 assert.equal(bodies.length,3);
 for(const body of bodies)for(const dt of [1/60,1/30,.1]){
  const b=bounds(body),x=body.center[0],z=body.center[2];
  for(const [axis,sign]of [['x',-1],['x',1],['z',-1],['z',1]]){
   let p={x,y:.05,z};p[axis]=(sign<0?b.min[axis]:b.max[axis])+sign*.6;
   assert.ok(canStand(p,layout),'legal contact start');
   for(let t=0;t<1.5;t+=dt){const d={x:0,z:0};d[axis]=-sign*3*dt;p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout));}
   assert.ok(sign<0?p[axis]<b.min[axis]-.2:p[axis]>b.max[axis]+.2,'visible body blocks movement');
  }
  const corners=[[b.min.x-.55,b.min.z-.55],[b.max.x+.55,b.min.z-.55],[b.max.x+.55,b.max.z+.55],[b.min.x-.55,b.max.z+.55]];
  let p={x:corners[0][0],y:.05,z:corners[0][1]};assert.ok(canStand(p,layout));
  for(const [x,z]of [...corners.slice(1),corners[0]]){
   for(let i=0;i<500;i++){
    const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.01)break;
    const step=Math.min(1.6*dt,d);p=moveVisitor(p,{x:dx/d*step,z:dz/d*step},layout);assert.ok(canStand(p,layout));
   }
   assert.ok(Math.hypot(p.x-x,p.z-z)<.025,'body clears each corner');
  }
 }
});
test('wardrobe and main stair round trips remain clear beside the platforms',()=>{
 for(const dt of [1/60,1/30,.1]){
  const points=[...layout.architecturalCirculation.wardrobeConnection.siteRoute,...layout.architecturalCirculation.mainStair.siteRoute.slice(1)];
  let p={...points[0]};assert.ok(canStand(p,layout));
  for(const target of [...points.slice(1),...points.toReversed().slice(1)]){
   const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/(1.6*dt)),d={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
   for(let i=0;i<n;i++){p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout));}
   assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.025);assert.ok(Math.abs(p.y-target.y)<.12);
  }
 }
});
