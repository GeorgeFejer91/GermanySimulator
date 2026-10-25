import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {panoramaStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
import {dancePanoramaPoint} from '../assets/models/berghain/panorama-section.mjs';
const studyToSite=({x,y,z})=>Object.fromEntries(dancePanoramaPoint(panoramaStudyPoint([x,y+4.2,z])).map((v,i)=>[['x','y','z'][i],v]));
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

test('Panorama ceiling and services retain observed forms and estimated dimensions',()=>{
  assert.ok(layout.panoramaServices,'The later architect photographs show the missing fitted ceiling and services');
  const room=layout.panoramaServices;
  assert.ok(room.sources.includes('I19'));
  assert.match(room.confidence,/estimated/);
  assert.ok(room.ceilingHeight-room.floorHeight>=4.2&&room.ceilingHeight-room.floorHeight<=5);
  assert.ok(room.photoViews.includes(15)&&room.photoViews.includes(16));
  assert.match(room.switchgearHistory,/Klo Bar/);
});

test('the fitted ceiling blocks head penetration while preserving all actual viewpoints',()=>{
  assert.ok(layout.panoramaServices,'Fitted ceiling required');
  const ceiling=layout.solids.filter(s=>s.name==='Panorama fitted ceiling');
  assert.equal(ceiling.length,1);
  for(const [name,view]of Object.entries(viewpoints))assert.ok(canStand(view.position,layout),name);
  const position=studyToSite({x:-15,y:layout.panoramaServices.ceilingHeight-1.75,z:-15});
  const floor=layout.floors.find(f=>f.name==='Panorama Bar');
  assert.equal(canStand(position,{floors:[{...floor,y:position.y}],solids:ceiling}),false);
});

test('radiators have cylindrical headers, individual ribs and matching physical barriers',()=>{
  const radiators=layout.fixtures.filter(f=>f.id.startsWith('panorama-radiator-'));
  assert.equal(radiators.length,6);
  for(const fixture of radiators){
    assert.ok(fixture.sources.includes('I19'));
    const rendered=layout.parts.filter(p=>p.fixture===fixture.id);
    assert.equal(rendered.filter(p=>p.name.endsWith('cast rib')).length,24);
    assert.equal(rendered.filter(p=>p.name.endsWith('header')&&p.shape==='cylinder').length,2);
    const solids=layout.solids.filter(s=>s.renderPart?.fixture===fixture.id);
    assert.equal(solids.filter(s=>/cast rib|header/.test(s.name)).length,26);
    assert.equal(solids.filter(s=>s.name.endsWith('mounting foot')).length,2);
    assert.equal(solids.filter(s=>/supply pipe|valve stem/.test(s.name)).length,4);
    assert.equal(solids.length,32);
    for(const solid of solids){
      const m=new THREE.Matrix4().fromArray(solid.renderPart.matrix);
      const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(m);
      assert.ok(Math.abs(bounds.min.y-solid.y[0])<1e-6&&Math.abs(bounds.max.y-solid.y[1])<1e-6);
    }
    const [x,y,z]=fixture.anchor,start={x,y,z:z-1.15};
    // Some photographed window seats are in front of these radiators. Probe
    // the radiator itself so that a seat cannot mask a missing metal collider.
    const probe={floors:[{x:[-100,100],z:[-100,100],y}],solids};
    assert.ok(canStand(start,probe),fixture.id+' isolated approach');
    const stopped=moveVisitor(start,{x:0,z:1.8},probe);
    assert.ok(stopped.z<z-.28&&canStand(stopped,probe),'visible radiator stops full body');
  }
});

test('clouds and shortened suspension fit below the new ceiling',()=>{
  assert.ok(layout.panoramaServices,'Ceiling required');
  const clouds=layout.parts.filter(p=>p.name==='Panorama acoustic cloud');
  assert.ok(clouds.length>=12,'Observed staggered acoustic treatment is modelled');
  const rods=layout.parts.filter(p=>(p.fixture?.startsWith('panorama-pendant-')||p.fixture?.startsWith('panorama-acoustic-')||p.fixture==='panorama-dj-table')&&/drop cable|suspension|hanger/.test(p.name));
  assert.ok(rods.length>=14);
  for(const part of [...clouds,...rods]){
    const m=part.matrix,top=m[13]+(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))/2;
    assert.ok(top<=layout.panoramaServices.ceilingHeight+.001,part.name+' must terminate at the ceiling');
    const low=m[13]-(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))/2;
    if(part.fixture!=='panorama-dj-table')assert.ok(low-layout.panoramaServices.floorHeight>=2.1,part.name+' standing head clearance');
  }
});

test('original service fixtures export through the existing model without new texture families',()=>{
  const model=createBerghainModel();
  try{
    assert.ok(model.userData.panoramaServices,'Portable hierarchy retains source and uncertainty');
    const parts=layout.parts.filter(p=>p.fixture?.startsWith('panorama-service-'));
    assert.ok(parts.some(p=>p.shape==='cylinder')&&parts.length>20,'Round conduit and visible fittings are actual geometry');
    for(const part of parts)assert.ok(part.matrix.every(Number.isFinite));
  }finally{disposeBerghainModel(model);}
});

test('floating acoustic clouds remain separate from the transverse structural beams',()=>{
  const bounds=part=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5))
    .applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
  const clouds=layout.parts.filter(p=>p.name==='Panorama acoustic cloud');
  const beams=layout.parts.filter(p=>p.name==='Panorama ceiling beam');
  assert.equal(clouds.length,16);assert.equal(beams.length,3);
  for(const cloud of clouds)for(const beam of beams)
    assert.equal(bounds(cloud).intersectsBox(bounds(beam)),false,'separate suspended panel and load-bearing beam');
});

test('visible conduit and clamps block the full visitor body',()=>{
  const fixture=layout.fixtures.find(f=>f.id==='panorama-service-tubes-0');
  const [x,y,z]=fixture.anchor;
  assert.equal(canStand({x,y,z},layout),false,'standing torso cannot occupy the two visible tubes');
});

test('radiator valve protrusions block the whole body beyond the rib envelope',()=>{
  for(const id of ['panorama-radiator-0','panorama-radiator-2']){
    const fixture=layout.fixtures.find(f=>f.id===id),[x,y,z]=fixture.anchor;
    for(const side of [-1,1])assert.equal(canStand({x:x+side*.78,y,z:z-.40},layout),false,'full-body cylinder cannot overlap protruding valve');
  }
});
