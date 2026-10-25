import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {upperLoungeStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
import {adjacentPanoramaPoint} from '../assets/models/berghain/panorama-section.mjs';
const studyToSite=({x,y,z})=>Object.fromEntries(adjacentPanoramaPoint(upperLoungeStudyPoint([x,y,z])).map((v,i)=>[['x','y','z'][i],v]));
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {surfaceFamilies} from '../assets/models/berghain/surface-data.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createLoungeGeometries} from '../assets/models/berghain/upper-lounge.mjs';

test('the added upper lounge retains primary references and estimated dimensions',()=>{
  assert.ok(layout.upperLounge,'The architect documents an additional lounge level');
  assert.deepEqual(layout.upperLounge.sources,['A13','I16','I18','I19','I20']);
  assert.match(layout.upperLounge.confidence,/estimated/);
  assert.ok(layout.upperLounge.floorHeight>9.05+2.7);
  assert.ok(layout.upperLounge.ceilingHeight-layout.upperLounge.floorHeight>=2.5);
  assert.ok(viewpoints.lounge&&canStand(viewpoints.lounge.position,layout));
  for(const path of ['berghain/model.html','geheim/index.html'])
    assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/value="lounge"/);
});

test('the lounge stair supports continuous full-body travel up, into the room and back',()=>{
  assert.ok(layout.upperLounge,'Upper lounge and stair required');
  let position={...viewpoints.panorama.position};
  for(const target of layout.panoramaRegistration.loungeRoute.slice(1,-2)){
    for(let i=0;i<300;i++)position=moveVisitor(position,{x:(target.x-position.x)/(300-i),z:(target.z-position.z)/(300-i)},layout);
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.1,'continuous lower corridor route');
  }
  assert.ok(canStand(position,layout),'lower approach');
  const high=studyToSite({x:-7.9,y:16.35,z:.8});
  for(let i=0;i<110;i++){
    position=moveVisitor(position,{x:(high.x-position.x)/Math.max(1,110-i),z:(high.z-position.z)/Math.max(1,110-i)},layout);
    assert.ok(canStand(position,layout),'continuous ascent');
  }
  assert.ok(Math.hypot(position.x-high.x,position.z-high.z)<.15,'upper landing reached');
  assert.ok(Math.abs(position.y-12.15)<.01,'additional level reached');
  const room=studyToSite({x:-11.4,y:16.35,z:.8});
  for(let i=0;i<50;i++)position=moveVisitor(position,{x:(room.x-position.x)/(50-i),z:(room.z-position.z)/(50-i)},layout);
  assert.ok(Math.hypot(position.x-room.x,position.z-room.z)<.15,'room connects to stair');
  for(const target of [high,studyToSite({x:-7.9,y:13.25,z:8.9})])
    for(let i=0;i<110;i++)position=moveVisitor(position,{x:(target.x-position.x)/(110-i),z:(target.z-position.z)/(110-i)},layout);
  assert.ok(Math.abs(position.y-9.05)<.01,'returns continuously to Panorama level');
});

test('the mezzanine slab, stair underside, rails and seating remain real body barriers',()=>{
  assert.ok(layout.upperLounge,'Upper lounge required');
  assert.equal(canStand(studyToSite({x:-7.9,y:13.25,z:7.5}),layout),false,'low stair underside');
  assert.equal(canStand(studyToSite({x:-14,y:13.25,z:1}),layout),true,'clear-height lower passage');
  assert.equal(canStand(studyToSite({x:-15.5,y:16.35,z:3}),layout),false,'sculptural seating');
  assert.equal(canStand(studyToSite({x:-14,y:16.35,z:-4.45}),layout),false,'overlook rail');
  const blocked=moveVisitor(studyToSite({x:-11.4,y:16.35,z:.8}),{x:0,z:-10},layout);
  assert.ok(canStand(blocked,layout)&&Math.abs(blocked.y-12.15)<.001,'no unsupported walk off gallery');
});

test('Felsenland is original padded geometry with its designer and observed form recorded',async()=>{
  assert.ok(layout.upperLounge?.furniture,'Sculptural lounge seating required');
  assert.equal(layout.upperLounge.furniture.designer,'Hermann August Weizenegger');
  assert.equal(layout.upperLounge.furniture.title,'Felsenland');
  const {createLoungeGeometries}=await import('../assets/models/berghain/upper-lounge.mjs');
  const geometries=createLoungeGeometries();
  assert.ok(Object.keys(geometries).length>0);
  for(const geometry of Object.values(geometries)){
    assert.ok(geometry.attributes.position.count>24,'padded edge detail');
    assert.ok([...geometry.attributes.position.array,...geometry.attributes.normal.array].every(Number.isFinite));
    geometry.dispose();
  }
  assert.ok(layout.parts.some(p=>p.fixture==='felsenland'&&p.shape==='lounge-faceted-pad'));
  assert.ok(layout.parts.some(p=>p.fixture==='felsenland'&&p.material==='loungePlum'));
});

test('the long chaise has a connected partial back and runs along the glazing',()=>{
  const seat=layout.parts.find(p=>p.name==='Felsenland long chaise upholstered seat');
  const back=layout.parts.find(p=>p.name==='Felsenland long chaise raised back');
  assert.ok(back,'I19/19 shows a back attached to part of the long chaise');
  const glazing=layout.parts.find(p=>p.name==='upper lounge glazed enclosure');
  const axis=(p,i)=>new THREE.Vector3(...p.matrix.slice(i,i+3)).normalize();
  assert.ok(Math.abs(axis(seat,0).dot(axis(glazing,8)))>.995,'long axis follows glazed wall');
  assert.ok(back.size[0]<seat.size[0]*.6&&back.size[0]>seat.size[0]*.3,'partial back');
  assert.ok(Math.abs(back.center[1]-back.size[1]/2-(seat.center[1]+seat.size[1]/2))<1e-6,'seat/back contact');
  const local=new THREE.Vector3(...back.center).applyMatrix4(new THREE.Matrix4().fromArray(seat.matrix).invert());
  assert.ok(Math.abs(local.x)>.15&&Math.abs(local.x)+back.size[0]/seat.size[0]/2<.49,'offset back remains supported');
});

test('faceted seats have outward surfaces and collision follows the cut corners',()=>{
  const geometries=createLoungeGeometries(),material=new THREE.MeshBasicMaterial();
  try{
    for(const p of layout.parts.filter(p=>p.shape==='lounge-faceted-pad')){
      const solid=layout.solids.find(s=>s.renderPart===p),matrix=new THREE.Matrix4().fromArray(p.matrix);
      assert.equal(solid.polygon.length,6,'no square invisible corner barrier');
      p.bodyFootprint.forEach(([x,z],i)=>{
        const v=new THREE.Vector3(x,0,z).applyMatrix4(matrix);
        assert.ok(Math.hypot(v.x-solid.polygon[i][0],v.z-solid.polygon[i][1])<1e-6);
      });
      const mesh=new THREE.Mesh(geometries[p.shape],material);mesh.updateMatrixWorld();
      for(const direction of [[0,-1,0],[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){
        const d=new THREE.Vector3(...direction),ray=new THREE.Raycaster(d.clone().multiplyScalar(-2),d);
        assert.ok(ray.intersectObject(mesh).length,'exterior ray sees outward surface '+direction);
      }
    }
  }finally{Object.values(geometries).forEach(g=>g.dispose());material.dispose();}
});

test('faceted ceiling forms meet the slab and retain standing clearance',()=>{
  const forms=layout.parts.filter(p=>p.shape==='lounge-ceiling-facet');
  assert.ok(forms.length>0,'I19/19 overhead forms must be represented');
  const geometries=createLoungeGeometries(),material=new THREE.MeshBasicMaterial();
  try{
    for(const p of forms){
      const mesh=new THREE.Mesh(geometries[p.shape],material);mesh.matrix.fromArray(p.matrix);mesh.matrixAutoUpdate=false;mesh.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(mesh);
      assert.ok(Math.abs(bounds.max.y-layout.upperLounge.ceilingHeight)<1e-6,'slab contact');
      assert.ok(bounds.min.y-layout.upperLounge.floorHeight>=2.1,'standing headroom');
      const ray=new THREE.Raycaster(new THREE.Vector3(p.center[0],layout.upperLounge.floorHeight+1.68,p.center[2]),new THREE.Vector3(0,1,0));
      assert.ok(ray.intersectObject(mesh)[0]?.distance>.4,'actual underside is outward and above eye');
    }
  }finally{Object.values(geometries).forEach(g=>g.dispose());material.dispose();}
});

test('the complete chaise clears the glazing and leaves the window-side seating connected',()=>{
 const geometries=createLoungeGeometries();geometries.box=new THREE.BoxGeometry(1,1,1);
 const bound=p=>{const g=geometries[p.shape];g.computeBoundingBox();return g.boundingBox.clone().applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));};
 try{
  const glassEast=Math.max(...layout.parts.filter(p=>/^Upper sanitary (clear frontage|frontage mullion)$/.test(p.name)).map(p=>bound(p).max.x));
  assert.ok(Number.isFinite(glassEast));
  for(const p of layout.parts.filter(p=>p.name.startsWith('Felsenland long chaise')))
   assert.ok(bound(p).min.x>glassEast+.12,'no seat, back or support intersects glass: '+p.name);
  let position={...viewpoints.lounge.position};
  const start={...position},points=[[5.54,15.45],[11.4,15.45],[11.4,16.05],[12,16.05],[12,17.5],[10,18],[5,18],[5,20]].map(([x,z])=>({x,y:12.15,z}));
  for(const target of [...points,...points.toReversed().slice(1),start]){
   for(let i=0;i<180;i++)position=moveVisitor(position,{x:(target.x-position.x)/(180-i),z:(target.z-position.z)/(180-i)},layout);
   assert.ok(canStand(position,layout)&&Math.hypot(position.x-target.x,position.z-target.z)<.04,'aisle/chaise-end round trip');
  }
 }finally{Object.values(geometries).forEach(g=>g.dispose());}
});

test('separate upholstered seats have nonintersecting actual projected footprints',()=>{
 const seats=layout.solids.filter(s=>s.renderPart?.shape==='lounge-faceted-pad');
 for(let i=0;i<seats.length;i++)for(let j=i+1;j<seats.length;j++){
  const a=seats[i].polygon,b=seats[j].polygon,axes=[];
  for(const poly of [a,b])poly.forEach((p,k)=>{const q=poly[(k+1)%poly.length],dx=q[0]-p[0],dz=q[1]-p[1],n=Math.hypot(dx,dz);axes.push([-dz/n,dx/n]);});
  const gap=Math.max(...axes.map(([x,z])=>{
   const aa=a.map(p=>p[0]*x+p[1]*z),bb=b.map(p=>p[0]*x+p[1]*z);
   return Math.max(Math.min(...aa)-Math.max(...bb),Math.min(...bb)-Math.max(...aa));
  }));
  assert.ok(gap>.05,seats[i].name+' intersects '+seats[j].name);
 }
});

test('lounge leather uses original small-scale PBR grain rather than cloth or source photographs',()=>{
  assert.ok(surfaceFamilies.leather,'Leather upholstery needs its own surface response');
  assert.equal(surfaceFamilies.leather.metresPerTile,.04);
  const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/textures/manifest.json',import.meta.url)));
  assert.match(manifest.origin,/no image inputs/);
  assert.equal(Object.keys(manifest.families.leather.maps).length,3);
});

test('visible lounge radiators block the body and the lower landing supports the full stair approach',()=>{
  for(const z of [-3.5,8.8])assert.equal(canStand(studyToSite({x:-19,y:16.35,z}),layout),false,'radiator metal is solid');
  for(const dx of [-.65,0,.65]){
    let position=studyToSite({x:-7.9+dx,y:13.25,z:8.9});
    assert.ok(canStand(position,layout),'full-width lower landing '+dx);
    const top=studyToSite({x:-7.9+dx,y:16.35,z:.8});
    for(let i=0;i<160;i++)position=moveVisitor(position,{x:(top.x-position.x)/(160-i),z:(top.z-position.z)/(160-i)},layout);
    assert.ok(Math.hypot(position.x-top.x,position.z-top.z)<.15,'full-width stair lane '+dx);
  }
});
