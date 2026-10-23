import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {kloRoomAt,createKloGeometries} from '../assets/models/berghain/klo-bar.mjs';

test('natural room identification uses calibrated footprints and floor elevation',()=>{
  assert.equal(kloRoomAt(studyToSite({x:-13,y:6.65,z:5})),'klo');
  assert.equal(kloRoomAt(studyToSite({x:-13.8,y:6.65,z:-8.3})),'toilets');
  for(const p of [{x:5,y:6.65,z:5},{x:-13,y:13.25,z:5},{x:-13,y:.05,z:5}])
    assert.equal(kloRoomAt(studyToSite(p)),null);
});

test('steel pan has a genuine hollow rim and interior rather than a capped cylinder',()=>{
  const geometries=createKloGeometries(),g=geometries['wc-bowl'];
  assert.ok(g.attributes.position.count>200);
  const vertices=g.attributes.position.array;
  assert.ok([...vertices,...g.attributes.normal.array].every(Number.isFinite));
  assert.ok([...Array(vertices.length/3).keys()].some(i=>Math.abs(vertices[i*3+1]-.5)<.001&&Math.hypot(vertices[i*3],vertices[i*3+2])<.42));
  g.dispose();
});

test('Klo Bar and toilets carry primary evidence, explicit placement estimates and legal viewpoints',()=>{
  assert.ok(layout.kloBar,'Missing Klo Bar must be reconstructed as a room');
  assert.ok(layout.kloBar.sources.includes('ART04')&&layout.kloBar.sources.includes('I21'));
  assert.match(layout.kloBar.confidence,/estimated/);
  assert.equal(layout.kloBar.floorHeight,6.65);
  assert.ok(layout.kloBar.ceilingHeight-6.65>=2.8);
  assert.match(layout.kloBar.artwork.status,/Partial figure reconstruction/);
  assert.match(layout.panoramaServices.switchgearHistory,/Klo Bar/);
  for(const key of ['klo','toilets']){
    assert.ok(viewpoints[key]&&canStand(viewpoints[key].position,layout),key+' body clearance');
    for(const path of ['berghain/model.html','geheim/index.html'])
      assert.ok(readFileSync(new URL('../'+path,import.meta.url),'utf8').includes('value="'+key+'"'));
  }
});

test('main floor connects continuously to bar, toilets, an open cubicle and back',()=>{
  assert.ok(layout.kloBar);
  const outward=[[5,0],[-6.35,0],[-6.35,3.8],[-8.05,3.8],[-8.05,-4.1],[-9,-4.1],[-9,-8.3],[-13.8,-8.3],[-13.8,-10],[-18.2,-10]];
  let position={...viewpoints.berghain.position};
  for(const pair of [...outward,...outward.slice(0,-1).reverse(),[5,5]]){
    const target=studyToSite({x:pair[0],y:6.65,z:pair[1]});
    for(let step=0;step<180;step++){
      position=moveVisitor(position,{x:(target.x-position.x)/(180-step),z:(target.z-position.z)/(180-step)},layout);
      assert.ok(canStand(position,layout),'body-clear continuous route');
    }
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.1,'reach '+pair+' actual '+JSON.stringify(position));
    assert.equal(position.y,6.65,'no teleport or floor change');
  }
});

test('segmented glazed counter, retained switchgear mesh and stool metal are actual exported geometry',()=>{
  assert.ok(layout.kloBar);
  const counter=layout.parts.filter(p=>p.fixture==='klo-switchgear-bar');
  assert.ok(counter.filter(p=>p.name.endsWith('display glass')).length>=6);
  assert.ok(counter.filter(p=>p.name.endsWith('wire mesh')).length>50);
  assert.ok(counter.some(p=>p.name.endsWith('switch handle')));
  const stools=layout.fixtures.filter(f=>f.id.startsWith('klo-stool-'));
  assert.ok(stools.length>=8);
  for(const stool of stools){
    const solids=layout.solids.filter(s=>s.renderPart?.fixture===stool.id);
    assert.ok(solids.some(s=>s.name.endsWith('splayed leg'))&&solids.some(s=>s.name.endsWith('seat')));
  }
  const model=createBerghainModel();
  try{assert.ok(model.userData.kloBar);assert.equal(model.userData.kloBar.artwork.lengthMetres,9);}
  finally{disposeBerghainModel(model);}
});

test('sanitary fittings include hollow bowls, protected lights, sinks with taps and exposed drainage',()=>{
  assert.ok(layout.kloBar);
  const bowls=layout.parts.filter(p=>p.shape==='wc-bowl');
  assert.ok(bowls.length>=4);
  assert.ok(layout.parts.some(p=>p.name.endsWith('flush plate')));
  assert.ok(layout.parts.some(p=>p.name.endsWith('paper canister')));
  assert.ok(layout.parts.some(p=>p.name.endsWith('light louvre')));
  assert.ok(layout.parts.some(p=>p.name.endsWith('tap spout')));
  assert.ok(layout.parts.some(p=>p.name.endsWith('trap pipe')));
  const mesh=layout.parts.filter(p=>p.name==='WC cubicle upper mesh');
  assert.ok(mesh.length>100,'Photographed open transoms are mesh geometry');
  for(const p of mesh)assert.ok(p.matrix[13]-p.size[1]/2>6.65+2.5,'mesh transoms remain above standing head height');
  for(const p of bowls)assert.ok(p.matrix.every(Number.isFinite));
});

test('closed cubicle doors and glazed bar counters stop full-body motion',()=>{
  assert.ok(layout.kloBar);
  const start=studyToSite({x:-16.3,y:6.65,z:-12});
  assert.ok(canStand(start,layout));
  const stopped=moveVisitor(start,{x:-3,z:0},layout);
  assert.ok(stopped.x>studyToSite({x:-17.4,y:6.65,z:-12}).x&&canStand(stopped,layout));
  const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
  const front={x:bar.anchor[0]+1.5,y:6.65,z:bar.anchor[2]+2.2};
  assert.ok(canStand(front,layout));
  const blocked=moveVisitor(front,{x:0,z:-4},layout);
  assert.ok(blocked.z>bar.anchor[2]+.5&&canStand(blocked,layout));
});

test('an invalid deep start within the wash assembly recovers to the nearest body-clear edge',()=>{
  const [x,y,z]=layout.fixtures.find(f=>f.id==='wc-wash-core').anchor;
  assert.equal(canStand({x,y,z},layout),false);
  const recovered=moveVisitor({x,y,z},{x:0,z:0},layout);
  assert.ok(canStand(recovered,layout),'a deeply overlapping restored position cannot stay inside steel');
  assert.ok(Math.hypot(recovered.x-x,recovered.z-z)<=1.01,'local recovery to the nearest whole-assembly edge');
});
