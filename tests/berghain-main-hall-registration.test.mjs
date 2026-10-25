import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

const corners=p=>[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>
 new THREE.Vector3(x,.5,z).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix)).toArray());
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function subtract(subject,clip){
 let inside=subject;const result=[],sign=Math.sign(area(clip));
 for(let i=0;i<clip.length&&inside.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],next=[],outside=[];
  const side=p=>sign*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));
  for(let j=0;j<inside.length;j++){
   const p=inside[j],q=inside[(j+1)%inside.length],u=side(p),v=side(q);
   (u>=0?next:outside).push(p);
   if((u>=0)!==(v>=0)){const t=u/(u-v),r=p.map((n,k)=>n+t*(q[k]-n));next.push(r);outside.push(r);}
  }
  if(outside.length>2&&Math.abs(area(outside))>1e-8)result.push(outside);inside=next;
 }
 return result;
}

test('all eight fitted capital top faces meet the slab union, without filling the central void',()=>{
 const slabs=layout.parts.filter(p=>p.shape==='box'&&p.matrix&&Math.abs(p.center[1]-p.size[1]/2-5.05)<1e-6&&
  ['floor','concrete'].includes(p.material)).map(p=>corners(p).map(q=>[q[0],q[2]]));
 const caps=layout.parts.filter(p=>p.shape==='saule-capital');assert.equal(caps.length,8);
 for(const cap of caps){
  let uncovered=[corners(cap).map(q=>[q[0],q[2]])];
  for(const slab of slabs)uncovered=uncovered.flatMap(p=>subtract(p,slab));
  assert.ok(uncovered.reduce((sum,p)=>sum+Math.abs(area(p)),0)<1e-6,'complete capital top, not only its center, must touch the slab');
 }
 assert.equal(canStand({x:12,y:5.45,z:0},layout),false,'the main foyer volume remains open');
 assert.ok(canStand({x:10,y:.05,z:0},layout),'retained ground circulation remains below the void, between its supports');
 assert.equal(layout.parts.filter(p=>/^Lab (raised|gate)/.test(p.name)).length,0,'Unsupported permanent Lab gate retired by the ground fit');
});

test('complete Panorama tread and guard envelopes clear the full-size upper side piers',()=>{
 const piers=layout.solids.filter(s=>s.name==='Hall fit side frame pier');assert.equal(piers.length,8);
 const stair=layout.parts.filter(p=>p.name.startsWith('panorama stair')||p.name.startsWith('Panorama stair'));
 assert.ok(stair.length>20,'test the rendered stair assembly');
 for(const p of stair){
  const box=new THREE.Box3().setFromPoints(Array.from({length:8},(_,i)=>
   new THREE.Vector3(i&1?.5:-.5,i&2?.5:-.5,i&4?.5:-.5).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix))));
  for(const s of piers)assert.ok(['x','y','z'].some(k=>box.max[k]<=s[k][0]+1e-6||box.min[k]>=s[k][1]-1e-6),p.name+' intersects '+JSON.stringify(s.x));
 }
 for(const s of piers){assert.ok(Math.abs(s.x[1]-s.x[0]-.8)<1e-6);assert.ok(Math.abs(s.z[1]-s.z[0]-.8)<1e-6);}
});

function walk(points,dt){
 let p={...points[0]};assert.ok(canStand(p,layout),'legal start '+JSON.stringify(p));
 for(const target of [...points.slice(1),...points.toReversed().slice(1)]){
  const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/(1.6*dt));
  const d={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
  for(let i=0;i<n;i++){p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout),'every accepted body state is legal');}
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.025,JSON.stringify({p,target,dt}));
  assert.ok(Math.abs(p.y-target.y)<.12,'correct landing height');
 }
}
test('Eisbar onward flight has usable center and lateral lanes at ordinary and delayed steps',()=>{
 const route=layout.architecturalCirculation.eisbar.siteUpperRoute;
 for(const dt of [1/60,1/30,.1]){
  walk(route,dt);
  for(const offset of [-.1,.1])walk(route.slice(2).map(p=>({...p,z:p.z+offset})),dt);
 }
});

test('registered descriptive anchors and public connectors agree with their actual assemblies',()=>{
 const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
 assert.ok(Math.hypot(...bar.anchor.map((x,i)=>x-layout.kloBar.barAnchor[i]))<1e-8);
 assert.deepEqual(layout.architecturalCirculation.wardrobeConnection.siteRoute.at(-1),layout.architecturalCirculation.mainStair.siteRoute[0]);
 assert.match(layout.mainHallRegistration.backstage,/No inferred private room/);
 assert.match(layout.mainHallRegistration.section.eisbarOpening,/estimated/i);
});

// Moving a full pier through either flight or its landing guard must fail,
// even when a central visitor route remains navigable.
test('complete Eisbar stair and landing guard envelopes clear the upper side piers',()=>{
 const piers=layout.solids.filter(p=>p.name==='Hall fit side frame pier');
 const parts=layout.parts.filter(p=>/^Architecture Eisbar (narrow|intermediate middle)|^Hall fit Eisbar landing opening/.test(p.name));
 assert.ok(parts.length>200);
 for(const p of parts){
  const box=new THREE.Box3().setFromPoints(Array.from({length:8},(_,i)=>new THREE.Vector3(i&1?.5:-.5,i&2?.5:-.5,i&4?.5:-.5).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix))));
  for(const s of piers)assert.ok(['x','y','z'].some(k=>box.max[k]<=s[k][0]+1e-6||box.min[k]>=s[k][1]-1e-6),p.name+' intersects pier '+JSON.stringify({part:p.center,pier:s.x}));
 }
});

test('lower Eisbar guarded side lanes retain full body clearance',()=>{
 const f=layout.floors.find(f=>f.name==='Eisbar narrow lower stair'),[a,b]=f.rampAxis;
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]),normal=[-(b[1]-a[1])/length,(b[0]-a[0])/length];
 const direction=[(b[0]-a[0])/length,(b[1]-a[1])/length];
 for(const offset of [-.29,0,.29])for(const dt of [1/60,.1]){
  const start={x:b[0]+direction[0]*.4+normal[0]*offset,z:b[1]+direction[1]*.4+normal[1]*offset,y:f.endY};
  const top={x:a[0]-direction[0]*.4+normal[0]*offset,z:a[1]-direction[1]*.4+normal[1]*offset,y:f.y};
  let p={...start};assert.ok(canStand(p,layout));
  for(const target of [top,start]){
   const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/(1.6*dt)),d={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
   for(let i=0;i<n;i++){p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout),'every accepted foot position is legal');}
   assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.025,'guarded side lane blocked '+JSON.stringify({offset,dt,p,target}));
  }
 }
});

test('Eisbar landing opening has centre and side lanes in both directions',()=>{
 const route=layout.architecturalCirculation.eisbar.siteUpperRoute.slice(1,3);
 for(const dx of [-.1,0,.1])for(const dt of [1/60,1/30,.1]){
  const points=route.map(p=>({...p,x:p.x+dx}));let p={...points[0]};assert.ok(canStand(p,layout));
  for(const target of [points[1],points[0]]){
   const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/(1.6*dt)),d={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
   for(let i=0;i<n;i++){p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout));}
   assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.025,'landing lane blocked '+JSON.stringify({dx,dt,p,target}));
  }
 }
});
