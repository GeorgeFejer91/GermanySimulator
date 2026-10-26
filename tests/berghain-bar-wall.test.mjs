import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {createMainBarGeometries} from '../assets/models/berghain/main-bar.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

import {mainHallWorldPoint,mainHallOriginalPoint,mainBarWorldPoint,mainBarOriginalPoint} from '../assets/models/berghain/main-hall-registration.mjs';
const registered=(p,fn=mainHallWorldPoint)=>{const[x,y,z]=fn([p.x,p.y,p.z]);return{x,y,z};};
const barPoint=p=>registered(p,mainBarWorldPoint);

test('the bar has the architect-reported eleven-metre room and actual circular reliefs in two rows',()=>{
 const wall=layout.mainBar.interiorFacade;
 assert.ok(wall,'The photographed historic interior facade is missing');
 assert.equal(wall.clearHeight,11);assert.ok(wall.sources.includes('A07')&&wall.sources.includes('I23'));
 assert.match(wall.confidence,/inferred|estimated/i);
 const reliefs=layout.parts.filter(p=>p.fixture==='main-bar-interior-facade'&&p.role==='circular relief');
 assert.equal(reliefs.length,10);
 const geometries=createMainBarGeometries(),geometry=geometries['main-bar-medallion'];
 try{
  assert.ok(geometry.attributes.position.count>100,'The circular profile must be actual curved geometry');
  const bounds=new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
  assert.ok(bounds.max.y-bounds.min.y>.99,'The normalized relief must retain real depth');
  for(const relief of reliefs){
   const actual=bounds.clone().applyMatrix4(new THREE.Matrix4().fromArray(relief.matrix));
   assert.ok(actual.max.z-actual.min.z>.04&&actual.max.z-actual.min.z<.1);
   assert.ok(actual.max.y-actual.min.y>1.1&&actual.max.y-actual.min.y<1.3);
  }
 }finally{for(const item of Object.values(geometries))item.dispose();}
 const roof=layout.solids.filter(s=>s.name==='main-bar-interior-facade ceiling'||
  s.renderPart?.fixture==='main-bar-interior-facade'&&s.renderPart.role==='roof beam');
 assert.ok(roof.length);assert.ok(Math.abs(Math.min(...roof.map(s=>s.y[0]))-layout.mainBar.floorHeight-11)<.001);
});

test('the photographed blue gridded roof sits in real recesses above concrete cross-beams',()=>{
 const facade=layout.mainBar.interiorFacade,roof=facade.roof;
 assert.ok(roof,'The flat ceiling is missing the photographed roof construction');
 assert.match(roof.confidence,/inferred/i);
 const parts=layout.parts.filter(p=>p.fixture==='main-bar-interior-facade');
 const beams=parts.filter(p=>p.role==='roof beam'),panes=parts.filter(p=>p.role==='roof appearance pane');
 assert.ok(beams.length>=6&&panes.length>=48,'Roof beams, pane cells and steel lattice must be real geometry');
 assert.ok(parts.some(p=>p.role==='roof lattice'));
 assert.equal(parts.some(p=>p.name==='main-bar-interior-facade ceiling'),false,'The old flat ceiling cannot hide the new recesses');
 const model=createBerghainModel();model.updateMatrixWorld(true);
 const hitAt=(x,z)=>{
  const ray=new THREE.Raycaster(new THREE.Vector3(x,layout.mainBar.floorHeight+10.5,z),new THREE.Vector3(0,1,0));
  const hit=ray.intersectObject(model,true)[0];assert.ok(hit);
  const [section,material,shape]=hit.object.name.split('/');
  return {y:hit.point.y,part:layout.parts.filter(p=>p.section===section&&p.material===material&&p.shape===shape)[hit.instanceId]};
 };
 try{
  const pane=panes.find(p=>p.center[0]<roof.center[0]&&p.center[2]>roof.center[2]),beam=beams.find(p=>p.name.endsWith('roof cross-beam'));
  const panelHit=hitAt(pane.center[0],pane.center[2]),beamHit=hitAt(beam.center[0],pane.center[2]);
  assert.equal(panelHit.part.role,'roof appearance pane');assert.equal(beamHit.part.role,'roof beam');
  assert.ok(panelHit.y-beamHit.y>.3,'Blue panes must be geometrically above the beam underside');
  for(const p of panes)assert.equal(model.getObjectByName([p.section,p.material,p.shape].join('/')).material.transparent,false,'Unverified optical material must not create a hole through the roof');
  const columns=layout.solids.filter(s=>s.name==='load-bearing column');
  for(const p of parts.filter(p=>p.role==='roof appearance pane'||p.role==='roof lattice')){
   const actual=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
   for(const c of columns){
    const overlap=actual.clone().intersect(new THREE.Box3(new THREE.Vector3(c.x[0],c.y[0],c.z[0]),new THREE.Vector3(c.x[1],c.y[1],c.z[1])));
    assert.ok(overlap.isEmpty()||overlap.getSize(new THREE.Vector3()).toArray().some(v=>v<.001),'Roof appearance panes and lattice must stop at retained column profiles');
   }
  }
 }finally{disposeBerghainModel(model);}
});

test('the lower circular reliefs and their panels are fully visible above the service worktop',()=>{
 const parts=layout.parts.filter(p=>p.fixture==='main-bar-interior-facade');
 const worktop=Math.max(...layout.solids.filter(s=>s.renderPart?.fixture==='main-bar-service-worktop'&&/worktop/.test(s.name)).map(s=>s.y[1]));
 const geometries=createMainBarGeometries(),disc=geometries['main-bar-medallion'];disc.computeBoundingBox();
 try{
  const lower=parts.filter(p=>p.role==='circular relief'&&p.center[1]<layout.mainBar.floorHeight+4);
  assert.equal(lower.length,5);
  for(const p of lower){
   const bounds=disc.boundingBox.clone().applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
   assert.ok(bounds.min.y>worktop+.2,'I23 views12/13/16 show the lower relief fully above the rear worktop');
  }
  const rims=layout.solids.filter(s=>s.renderPart?.fixture==='main-bar-interior-facade'&&/relief panel horizontal rim/.test(s.name)&&s.y[1]<layout.mainBar.floorHeight+4);
  assert.ok(Math.min(...rims.map(s=>s.y[0]))>worktop+.1,'The lower relief panel must also clear the worktop');
 }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});

test('bar plaster uses its own physical maps and practical beams reach the actual pilaster faces',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const wall=model.getObjectByName('interior/mainBarPlaster/box');
  assert.ok(wall,'The photographed wall must have its own worn plaster surface');
  assert.equal(wall.material.userData.surface.family,'plaster');
  const lights=[];model.traverse(object=>{if(object.isSpotLight)lights.push(object);});
  assert.equal(lights.length,6,'Localized warm pilaster wash must exist as actual lights');
  const wallMeshes=[];model.getObjectByName('interior').traverse(object=>{if(object.isMesh)wallMeshes.push(object);});
  for(const light of lights){
   const from=light.getWorldPosition(new THREE.Vector3()),to=light.target.getWorldPosition(new THREE.Vector3());
   const underSlab=['bar pilaster uplight 1','bar pilaster uplight 6'].includes(light.name);
   assert.ok(to.y>from.y+(underSlab?1.3:3)&&from.y>layout.mainBar.floorHeight+.94,'Aim upward from above the service worktop, below any intercepting slab');
   const hits=new THREE.Raycaster(from,to.sub(from).normalize(),.02,light.distance).intersectObjects(wallMeshes,false);
   assert.ok(hits.length&&hits[0].object===wall,'The real cone center must reach plaster, not pass through the wall');
   assert.ok(light.color.r>light.color.b*1.5&&light.decay===2&&light.castShadow===false);
   assert.ok(light.intensity>0&&light.distance<=12&&light.angle<Math.PI/3);
  }
 }finally{disposeBerghainModel(model);}
});

test('every practical housing rests on an actual bracket connected to its pilaster',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const parts=layout.parts.filter(p=>p.material==='mainBarFixture'&&p.shape==='box');
  const mesh=model.getObjectByName('interior/mainBarFixture/box');
  const bounds=part=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
  const housings=parts.filter(p=>p.role==='bar practical housing'),brackets=parts.filter(p=>p.role==='bar practical bracket');
  assert.equal(housings.length,6);assert.equal(brackets.length,6,'End fixtures need a real mount as well as the four over the worktop');
  for(const housing of housings){
   const box=bounds(housing),origin=box.getCenter(new THREE.Vector3());origin.y=box.min.y+.001;
   const hit=new THREE.Raycaster(origin,new THREE.Vector3(0,-1,0),0,.15).intersectObject(mesh,false)[0];
   assert.ok(hit&&hit.distance<.003&&parts[hit.instanceId].role==='bar practical bracket','The underside must physically meet its support');
   const bracket=parts[hit.instanceId],support=bounds(bracket);
   const stems=layout.parts.filter(p=>p.fixture==='main-bar-interior-facade'&&p.name.includes('pilaster stem'));
   assert.ok(stems.some(p=>{const size=support.clone().intersect(bounds(p)).getSize(new THREE.Vector3());return size.x*size.y*size.z>.0001;}),'Support must enter the actual pilaster');
   assert.ok(layout.solids.some(s=>s.renderPart===bracket),'The visible bracket must retain its physical solid');
  }
 }finally{disposeBerghainModel(model);}
});

test('recessed windows and flanking masonry have different actual depth in the source model',()=>{
 const wall=layout.mainBar.interiorFacade;assert.ok(wall,'The interior wall must own its original geometry');
 const model=createBerghainModel(),ray=new THREE.Raycaster();model.updateMatrixWorld(true);
 const partFor=hit=>{const [section,material,shape]=hit.object.name.split('/');return layout.parts.filter(p=>p.section===section&&p.material===material&&p.shape===shape)[hit.instanceId];};
 const hitAt=(z,y)=>{
  const p=barPoint({x:17.1,y,z});ray.set(new THREE.Vector3(p.x,p.y,p.z),new THREE.Vector3(0,0,-1));
  const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent);
  assert.ok(hit);return {hit,part:partFor(hit)};
 };
 try{
  for(const bay of wall.bayCenters){
   const window=hitAt(mainBarOriginalPoint({x:bay[0],y:bay[1],z:bay[2]}).z,layout.mainBar.floorHeight+3.4);
   const masonry=hitAt(mainBarOriginalPoint({x:bay[0],y:bay[1],z:bay[2]}).z+1.02,layout.mainBar.floorHeight+3.4);
   assert.equal(window.part.fixture,'main-bar-interior-facade');assert.match(window.part.name,/window backing/);
   assert.equal(masonry.part.fixture,'main-bar-interior-facade');
   assert.ok(window.hit.distance-masonry.hit.distance>.18,'The window must sit inside a real masonry reveal');
  }
 }finally{disposeBerghainModel(model);}
});

test('wall detailing preserves the full guest aisle and the service aisle behind the counter',()=>{
 assert.ok(layout.mainBar.interiorFacade,'The wall must be present for this route check');
 for(const x of [13.72,16.72]){
  let position=barPoint({x,y:5.45,z:-8.7});assert.ok(canStand(position,layout));
  for(const z of [5.9,-8.7]){
   const start=mainBarOriginalPoint(position).z,steps=Math.ceil(Math.abs(z-start)/.05);
   for(let i=0;i<steps;i++)position=moveVisitor(position,{x:(z-start)/steps,z:0},layout);
   assert.ok(Math.abs(mainBarOriginalPoint(position).z-z)<.02,'Both full-body aisles must remain traversable');
  }
 }
});

test('the photographed upper relief row remains visible across the bar rather than hidden behind an inferred beam',()=>{
 const wall=layout.mainBar.interiorFacade,model=createBerghainModel(),ray=new THREE.Raycaster();model.updateMatrixWorld(true);
 try{
  const bay=wall.bayCenters[2],old=mainBarOriginalPoint({x:bay[0],y:bay[1],z:bay[2]}),p=barPoint({x:13.72,y:11.65,z:old.z});ray.set(new THREE.Vector3(p.x,p.y,p.z),new THREE.Vector3(0,0,-1));
  const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent);
  assert.ok(hit);const [section,material,shape]=hit.object.name.split('/');
  const part=layout.parts.filter(p=>p.section===section&&p.material===material&&p.shape===shape)[hit.instanceId];
  assert.equal(part?.role,'circular relief','I23 views12/16 show a clear view of the upper reliefs across this room');
  assert.equal(layout.parts.filter(p=>p.name==='load-bearing column').length,7);
 }finally{disposeBerghainModel(model);}
});

test('the service fittings fit the actual new pilaster profiles without buried furniture vertices',()=>{
 const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),
  ring:new THREE.TorusGeometry(.5,.035,6,20),...createMainBarGeometries()};
 const piers=layout.solids.filter(s=>s.renderPart?.fixture==='main-bar-interior-facade'&&s.renderPart.role==='pilaster');
 const point=new THREE.Vector3();let buried=0;
 try{
  for(const part of layout.parts.filter(p=>p.fixture==='main-bar-service-worktop'||p.fixture==='main-long-bar'||p.fixture?.startsWith('main-bar-stool-'))){
   const vertices=geometries[part.shape].attributes.position,matrix=new THREE.Matrix4().fromArray(part.matrix);
   for(let i=0;i<vertices.count;i++){
    point.fromBufferAttribute(vertices,i).applyMatrix4(matrix);
    if(piers.some(s=>point.x>s.x[0]+.001&&point.x<s.x[1]-.001&&point.y>s.y[0]+.001&&point.y<s.y[1]-.001&&point.z>s.z[0]+.001&&point.z<s.z[1]-.001))buried++;
   }
  }
  assert.equal(buried,0,'Cabinet/worktop notches and bay-centred sinks must clear the photographed piers');
 }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});

test('the practical wash reaches the lower pilaster instead of leaving a detached oval',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const lights=[];model.traverse(o=>{if(o.isSpotLight)lights.push(o);});
  for(const light of lights){
   const from=light.getWorldPosition(new THREE.Vector3()),target=light.target.getWorldPosition(new THREE.Vector3());
   // Probe the actual wall plane 35 cm above its lamp, within the photographed lower wash.
   const probe=new THREE.Vector3(target.x,from.y+.35,target.z),axis=target.clone().sub(from).normalize();
   const direction=probe.sub(from).normalize(),cosine=direction.dot(axis);
   const attenuation=THREE.MathUtils.smoothstep(cosine,Math.cos(light.angle),Math.cos(light.angle*(1-light.penumbra)));
   assert.ok(attenuation>.1,'Lower wall must receive a soft nonzero beam, not start above the lower relief');
   const hit=new THREE.Raycaster(from,direction,.02,.6).intersectObject(model,true).find(h=>h.object===model.getObjectByName('interior/mainBarPlaster/box'));
   assert.ok(hit,'The probe must reach the real pilaster, not an empty inferred plane');
  }
 }finally{disposeBerghainModel(model);}
});
