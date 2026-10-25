import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite as originalStudyPoint} from '../assets/models/berghain/calibration.mjs';
import {groundLabPoint} from '../assets/models/berghain/ground-registration.mjs';
const world=p=>{const [x,y,z]=groundLabPoint([p.x,p.y,p.z]);return{x,y,z};};
const studyToSite=p=>world(originalStudyPoint(p));
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

test('Lab is a sourced lower-floor reconstruction with explicit inferred placement, not an invented underground storey',()=>{
  assert.ok(layout.labOratory,'Lab.oratory is still missing from the complete building');
  assert.ok(layout.labOratory.sources.includes('A12')&&layout.labOratory.sources.includes('I22'));
  assert.match(layout.labOratory.confidence,/estimated/);
  assert.equal(layout.labOratory.floorHeight,.05);assert.equal(layout.labOratory.sanitaryDrop,1.2);
  assert.ok(canStand(viewpoints.lab.position,layout));
  for(const path of ['berghain/model.html','geheim/index.html'])
    assert.ok(readFileSync(new URL('../'+path,import.meta.url),'utf8').includes('value="lab"'));
});

test('Lab identification follows its calibrated footprint at both photographed relative levels',async()=>{
  const {labRoomAt}=await import('../assets/models/berghain/lab-oratory.mjs');
  assert.equal(labRoomAt(studyToSite({x:-8.5,y:.05,z:-8.5})),'lab');
  assert.equal(labRoomAt(studyToSite({x:-17.4,y:-1.15,z:5.1})),'lab');
  for(const p of [{x:5,y:.05,z:4},{x:-12,y:5.45,z:5},{x:0,y:.05,z:19}])assert.equal(labRoomAt(studyToSite(p)),null);
});

function follow(position,authorTarget){
  const target=studyToSite({x:authorTarget[0],y:0,z:authorTarget[1]});
  for(let i=0;i<240;i++){
    position=moveVisitor(position,{x:(target.x-position.x)/(240-i),z:(target.z-position.z)/(240-i)},layout);
    assert.ok(canStand(position,layout),'complete standing body supported on every substep');
  }
  assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.08,'reach '+authorTarget+'; actual '+JSON.stringify(position));
  return position;
}
test('a standing human walks within the separately selected Lab to the bar and sanitary landing and back',()=>{
  assert.ok(layout.labOratory);
  let p={...viewpoints.lab.position};
  const route=[[-12.8,-12.8],[-8.5,-8.5],[-8.5,2.6],[-17.4,.8],[-17.4,5.1]];
  for(const waypoint of route)p=follow(p,waypoint);
  assert.ok(Math.abs(p.y+1.15)<.06,'the actual sanitary descent reaches the lower landing');
  for(const waypoint of [...route.slice(0,-1).reverse(),[-8.5,-8.5]])p=follow(p,waypoint);
  assert.ok(Math.abs(p.y-.05)<.001,'continuous return reaches the original ground floor');
});

test('the sanitary opening is genuinely cut through both overlapping ground slabs',()=>{
  assert.ok(layout.labOratory);
  const p=studyToSite({x:-17.4,y:.05,z:5.1});assert.equal(canStand(p,layout),false,'ground must not cover the lower landing');
  const model=createBerghainModel();model.updateMatrixWorld(true);
  try{
    const ray=new THREE.Raycaster(new THREE.Vector3(p.x,.2,p.z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(model,true)[0];assert.ok(hit&&hit.point.y<-.9,'rendered hole must match the walkable descent');
  }finally{disposeBerghainModel(model);}
});

test('photographed Lab fixtures include pipe/gauge counter, insulators, barred cells, bunks and cast-iron sanitary panels',()=>{
  assert.ok(layout.labOratory);
  for(const id of ['lab-pipe-bar','lab-gauge-wall','lab-insulator-canopy','lab-cage-0','lab-bunk-0','lab-green-screen','lab-window-bench'])
    assert.ok(layout.fixtures.some(f=>f.id===id),id);
  const names=layout.parts.filter(p=>p.fixture?.startsWith('lab-')).map(p=>p.name);
  for(const form of ['gauge tick','pipe flange','insulator disc','cell bar','suspended sling','bunk pad','cast panel','valve wheel'])
    assert.ok(names.some(n=>n.endsWith(form)),form+' must be actual geometry');
  const bar=layout.fixtures.find(f=>f.id==='lab-pipe-bar');const [x,y,z]=bar.anchor;
  assert.equal(canStand({x,y,z},layout),false);
  const recovered=moveVisitor({x,y,z},{x:0,z:0},layout);
  assert.ok(canStand(recovered,layout),'invalid deep counter start recovers to a body-clear edge');
  assert.ok(Math.hypot(recovered.x-x,recovered.z-z)<1.5);
});

test('the hanging sling has a shaped sagging surface with finite normals',async()=>{
  const {createLabGeometries}=await import('../assets/models/berghain/lab-oratory.mjs');
  const geometries=createLabGeometries();
  try{
    const g=geometries['lab-sling'];assert.ok(g&&g.index&&g.attributes.position.count>100);
    assert.ok(g.attributes.position.array.every(Number.isFinite)&&g.attributes.normal.array.every(Number.isFinite));
    g.computeBoundingBox();assert.ok(g.boundingBox.max.y-g.boundingBox.min.y>.15,'sling is not a flat rectangular stand-in');
  }finally{for(const g of Object.values(geometries))g.dispose();}
});

test('the reachable sanitary screen posts and proud cast ornament stop the complete standing body',()=>{
  const oldWitness={x:-18.61420950413223,y:.05,z:6.9049882332221095},witness=world(oldWitness);
  // Start 20 cm away: the repaired conservative post box also blocks the old
  // 10 cm starting pose, so that pose no longer represents a legal approach.
  const start=world({x:oldWitness.x+.2*Math.sin(Math.PI/3),y:.05,z:oldWitness.z+.2*Math.cos(Math.PI/3)});
  assert.ok(canStand(start,layout),'the approach is legal before contact');
  assert.equal(canStand(witness,layout),false,'the previously reachable arm-through-post contact must be blocked');
  const end=moveVisitor(start,{x:witness.x-start.x,z:witness.z-start.z},layout);
  assert.ok(canStand(end,layout));assert.ok(Math.hypot(end.x-witness.x,end.z-witness.z)>.01);
  const ornament=world({x:-18.06906,y:.05,z:6.96123});
  assert.equal(canStand(ornament,layout),false,'clearance includes the cast relief in front of the plate');
  const posts=layout.parts.filter(p=>p.name==='lab-green-screen cast upright');
  assert.equal(posts.length,6);
  assert.ok(posts.every(p=>layout.solids.some(s=>s.renderPart===p)),'each rendered upright has a linked solid');
});

test('the fitted Lab ceiling contains retained fixtures and its ordinary-night boundaries are closed',()=>{
  assert.equal(layout.labOratory.ceilingHeight,3.76,'actual fitted ceiling underside below retained Halle slab');
  const model=createBerghainModel(),point=new THREE.Vector3(),matrix=new THREE.Matrix4();
  try{
    for(const part of layout.parts.filter(p=>p.fixture?.startsWith('lab-'))){
      const mesh=model.getObjectByName([part.section,part.material,part.shape].join('/'));
      matrix.fromArray(part.matrix);
      for(let i=0;i<mesh.geometry.attributes.position.count;i++){
        point.fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(matrix);
        assert.ok(point.y<3.76-.005,part.name+' clips the soffit');
      }
    }
    assert.equal(layout.parts.some(p=>/^Lab (raised steel-glass gate|gate track|gate upper head)$/.test(p.name)),false,'The former permanently open gate was not spatially supported');
    const ceiling=layout.parts.find(p=>p.name==='Ground fit Lab fitted ceiling');
    const ceilingInverse=new THREE.Matrix4().fromArray(ceiling.matrix).invert();
    for(const part of layout.parts.filter(p=>/^Ground fit Lab (north boundary|south event boundary)$/.test(p.name))){
      matrix.fromArray(part.matrix);
      for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5]){
        point.set(x,y,z).applyMatrix4(matrix).applyMatrix4(ceilingInverse);
        assert.ok(point.y<=-.5+.001,'closed boundary meets the lower roof underside without protruding through it');
      }
    }
  }finally{disposeBerghainModel(model);}
});

test('actual Lab fixture vertices do not cut through the retained structural columns',()=>{
  const model=createBerghainModel(),point=new THREE.Vector3(),instance=new THREE.Matrix4();
  const columns=layout.parts.filter(p=>p.name==='load-bearing column').map(p=>new THREE.Matrix4().fromArray(p.matrix).invert());
  let violations=0;
  try{
    for(const part of layout.parts.filter(p=>p.fixture?.startsWith('lab-'))){
      const mesh=model.getObjectByName([part.section,part.material,part.shape].join('/'));
      const vertices=mesh.geometry.attributes.position;instance.fromArray(part.matrix);
      for(let i=0;i<vertices.count;i++){
        point.fromBufferAttribute(vertices,i).applyMatrix4(instance);
        if(point.y>.05&&point.y<5.95&&columns.some(inverse=>{
          const local=point.clone().applyMatrix4(inverse);
          return Math.abs(local.x)<.498&&Math.abs(local.y)<.498&&Math.abs(local.z)<.498;
        }))violations++;
      }
    }
    assert.equal(violations,0,'furniture must be arranged around structural columns');
  }finally{disposeBerghainModel(model);}
});

test('Lab plaster and cast panels bind the authored weathering maps at metre scale',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/textures/manifest.json',import.meta.url)));
  assert.ok(manifest.families.aged,'reference walls and oxidised plates need actual aged surface maps');
  assert.equal(manifest.families.aged.metresPerTile,2.4);
  const model=createBerghainModel();
  try{
    const walls=[];model.traverse(m=>{if(m.isMesh&&m.name.includes('/labWall/'))walls.push(m);});
    assert.ok(walls.length&&walls.every(m=>m.material.userData.surface?.family==='aged'));
  }finally{disposeBerghainModel(model);}
});

test('portable asset retains Lab provenance and the actual lower-level geometry',()=>{
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString().trim());
  const metadata=gltf.nodes.find(n=>n.extras?.labOratory)?.extras;
  assert.ok(metadata?.labOratory);assert.equal(metadata.labOratory.sanitaryDrop,1.2);
  assert.ok(metadata.fixtures.some(f=>f.id==='lab-pipe-bar'));
  const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json',import.meta.url)));
  assert.ok(manifest.bounds.min[1]<-1.1);assert.equal(manifest.units,'metres');
});
