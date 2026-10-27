import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createDjChainGeometry} from '../assets/models/berghain/panorama-dj-console.mjs';
const fixture=layout.fixtures.find(f=>f.id==='panorama-dj-table');
test('sloped retained console is fitted on the public side and inside its physical footprint',()=>{
 const pieces=layout.parts.filter(p=>p.consoleDetail),clearance=layout.solids.find(s=>s.fixture===fixture.id);
 assert.ok(fixture.console.sources.includes('I19'));
 for(const p of pieces){
  const local=p.shape==='dj-chain'?new THREE.Box3(new THREE.Vector3(-.59,-.59,-.09),new THREE.Vector3(.59,.59,.09)):
   new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5));
  local.applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
  for(const axis of ['x','y','z'])assert.ok(local.min[axis]>=clearance[axis][0]-1e-8&&local.max[axis]<=clearance[axis][1]+1e-8,p.name+' '+axis);
 }
 const panels=pieces.filter(p=>p.name.endsWith('instrument panel'));assert.equal(panels.length,3);
 for(const p of panels){const normal=new THREE.Vector3(0,0,1).transformDirection(new THREE.Matrix4().fromArray(p.matrix));assert.ok(normal.x<-.8&&normal.y>.3,'meter front must face the west public aisle and upward');}
});

test('instrument panels meet the tabletop and do not penetrate retained playback equipment',()=>{
 const tabletop=layout.parts.find(p=>p.fixture===fixture.id&&p.name.endsWith('table surface'));
 const legs=layout.parts.filter(p=>p.fixture===fixture.id&&p.name.endsWith('table leg'));
 assert.equal(legs.length,4);
 for(const leg of legs){assert.ok(Math.abs(leg.center[1]-leg.size[1]/2-layout.panoramaServices.floorHeight)<1e-8,'retained rod must meet the floor');assert.ok(leg.center[1]+leg.size[1]/2>=tabletop.center[1]-tabletop.size[1]/2,'retained rod must meet the tabletop underside');}
 const panels=layout.parts.filter(p=>p.name==='Panorama console sloped instrument panel');
 const equipment=layout.parts.filter(p=>p.fixture===fixture.id&&!p.consoleDetail&&/deck|platter|mixer/.test(p.name));
 function obb(p){const m=new THREE.Matrix4().fromArray(p.matrix),axes=[0,1,2].map(i=>new THREE.Vector3().setFromMatrixColumn(m,i));return {center:new THREE.Vector3().setFromMatrixPosition(m),half:axes.map(a=>a.length()/2),axes:axes.map(a=>a.normalize())};}
 function penetrates(a,b){
  const axes=[...a.axes,...b.axes,...a.axes.flatMap(u=>b.axes.map(v=>new THREE.Vector3().crossVectors(u,v)))];
  const delta=new THREE.Vector3().subVectors(b.center,a.center);
  for(const axis of axes){if(axis.lengthSq()<1e-15)continue;axis.normalize();const radius=o=>o.axes.reduce((sum,v,i)=>sum+Math.abs(v.dot(axis))*o.half[i],0);if(radius(a)+radius(b)-Math.abs(delta.dot(axis))<=1e-8)return false;}
  return true;
 }
 for(const p of panels){
  const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
  assert.ok(Math.abs(bounds.min.y-(tabletop.center[1]+tabletop.size[1]/2))<1e-8,'panel must touch the tabletop');
  for(const e of equipment)assert.equal(penetrates(obb(p),obb(e)),false,p.name+' must clear '+e.name);
 }
});
test('chain segments connect their retained desk and ceiling endpoints without gaps',()=>{
 const geometry=createDjChainGeometry();assert.equal(geometry.index.count/3,96);geometry.dispose();
 assert.equal(layout.parts.filter(p=>p.fixture===fixture.id&&p.name.endsWith('suspension')).length,0);
 for(const chain of fixture.console.chains){
  const links=layout.parts.filter(p=>p.consoleDetail&&p.shape==='dj-chain'&&Math.abs(p.center[2]-chain.z)<1e-8);
  assert.equal(links.length,chain.count);assert.ok(chain.pitch<chain.height);
  assert.ok(Math.abs(links[0].center[1]-chain.height/2-chain.bottom)<1e-8);
  assert.ok(Math.abs(links.at(-1).center[1]+chain.height/2-chain.top)<1e-8);
 }
});
