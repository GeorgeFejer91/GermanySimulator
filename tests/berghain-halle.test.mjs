import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,viewpoints,materials} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {halleCircuit} from '../berghain/halle-playtest.mjs';

const retired=new Set(['Halle upper west outer','Halle upper west inner','Halle west upper landing',
 'Halle west south landing','Halle upper east','Halle upper north','Halle west stair','Halle west stair tread',
 'Halle west stair rail','Halle upper west rail','Halle upper east rail','Halle column','Halle roof beam','historic boiler hopper']);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Preserve Halle's original acceptance oracle before later, independently
// tested circulation/detail additions. The joint main/Panorama section refreshes
// the non-Halle fingerprint; its scoped tests own that change. The independent
// published4652 comparison retained all691 Halle parts,450 solids and11 floors.
async function beforeArchitecturalAdditions(){
 const layoutURL=new URL('../assets/models/berghain/layout.mjs',import.meta.url);
 const encode=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
 const absolute=(source,url)=>source.replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
 const source=readFileSync(layoutURL,'utf8').replace('registerMainHall(layout,viewpoints);','').replace('addArchitecturalCirculation(layout);','').replace('addMainHallDetails(layout);','').replace('fitMainHallRoofFrame(layout);','').replace('addGroundSanitary(layout);','').replace('registerPanorama(layout,viewpoints);','').replace('registerGround(layout,viewpoints);','');
 const baselineURL=encode(absolute(source,layoutURL)),baseline=await import(baselineURL);
 const modelURL=new URL('../assets/models/berghain/model.mjs',import.meta.url);
 const modelSource=readFileSync(modelURL,'utf8').replace("from './layout.mjs'",`from '${baselineURL}'`);
 const factory=await import(encode(absolute(modelSource,modelURL)));
 return {...baseline,model:factory.createBerghainModel()};
}

const withoutTone=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='instanceTone'?undefined:item));
const site=(x,z,y=.05)=>studyToSite({x,y,z});
const inPolygon=(p,polygon)=>{
 let sign=0;
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],cross=(b[0]-a[0])*(p.z-a[1])-(b[1]-a[1])*(p.x-a[0]);
  if(Math.abs(cross)<1e-7)continue;
  if(sign&&sign*Math.sign(cross)<0)return false;
  sign=Math.sign(cross);
 }
 return true;
};
const walk=(start,target,step=.04)=>{
 let p={...start};const dx=target.x-p.x,dz=target.z-p.z,n=Math.ceil(Math.hypot(dx,dz)/step);
 for(let i=0;i<n;i++){p=moveVisitor(p,{x:dx/n,z:dz/n},layout);assert.ok(canStand(p,layout),'Every route sample must support the complete body');}
 assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.025,`Unreachable route target ${JSON.stringify({target,actual:p})}`);
 assert.ok(Math.abs(p.y-target.y)<.025,`Wrong route height ${p.y} versus ${target.y}`);
 return p;
};

export function preservedHalleFingerprint(space,views,palette,model){
 const counters=new Map(),parts=[],used=new Set();
 for(const part of space.parts){
  const key=[part.section,part.material,part.shape].join('/'),index=counters.get(key)||0;
  counters.set(key,index+1);if(part.section!=='halle'&&!part.name.startsWith('Halle'))continue;used.add(part.material);
  const mesh=model.getObjectByName(key),matrix=new THREE.Matrix4(),color=new THREE.Color();
  mesh.getMatrixAt(index,matrix);mesh.getColorAt(index,color);
  const geometry=mesh.geometry,attributes=Object.fromEntries(Object.entries(geometry.attributes).map(([name,attribute])=>[name,Array.from(attribute.array)]));
  parts.push([withoutTone(part),matrix.toArray(),color.toArray(),hash([attributes,geometry.index?Array.from(geometry.index.array):null])]);
 }
 return {parts:hash(parts),count:parts.length,
  solids:hash(withoutTone(space.solids.filter(s=>s.halle||s.name.startsWith('Halle')))),floors:hash(space.floors.filter(f=>f.halle||f.name.startsWith('Halle'))),
  views:hash(views.halle),materials:hash(Object.fromEntries([...used].sort().map(key=>[key,palette[key]]))),
  bounds:hash(space.exteriorBounds),inventory:hash(space.halle)};
}

test('the historical pre-ground-registration Halle assembly retains its published fingerprint',async()=>{
 const {layout,viewpoints,materials,model}=await beforeArchitecturalAdditions();
 try{assert.deepEqual(preservedHalleFingerprint(layout,viewpoints,materials,model),BASELINE_FINGERPRINT);}
 finally{disposeBerghainModel(model);}
});

test('Halle has three distinct real upper-floor voids, two concrete flights and documented uncertainty',()=>{
 assert.ok(layout.halle,'Missing coherent Halle assembly');
 assert.equal(layout.halle.upperHeight,4.25);assert.equal(layout.halle.stairs.length,2);
 assert.match(layout.halle.confidence,/provisional|inferred/i);
 assert.equal(layout.halle.escapeExit.modelled,false,'No unregistered facade cut');
 const upper=layout.floors.filter(f=>f.halle&&f.endY===undefined&&f.y===4.25);
 const empty=new Set();
 for(let x=-20.9;x<=20.9;x+=.4)for(let z=-43;z<=-23;z+=.3){
  const p=site(x,z,4.25);
  if(!upper.some(f=>inPolygon(p,f.polygon)))empty.add(`${Math.round((x+20.9)/.4)},${Math.round((z+43)/.3)}`);
 }
 let components=0;
 while(empty.size){
  components++;const queue=[empty.values().next().value];empty.delete(queue[0]);
  while(queue.length){const [x,z]=queue.pop().split(',').map(Number);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const key=`${x+dx},${z+dz}`;if(empty.delete(key))queue.push(key);
  }}
 }
 assert.equal(components,3,'Actual upper slab support must have exactly three separate airspaces');
 for(const x of [-14,0,14])assert.equal(canStand(site(x,-34,4.25),layout),false,'No invisible upper support in a void');
});

test('both concrete stairs and both narrow bridges carry the full visitor continuously in both directions',()=>{
 assert.ok(layout.halle,'Missing Halle stair circulation');
 for(const stair of layout.halle.stairs){
  assert.equal(stair.risers,24);assert.ok(Math.abs(stair.run-7.2)<1e-6);
  let p={...stair.lowerApproach};assert.ok(canStand(p,layout));
  p=walk(p,stair.upperApproach);p=walk(p,stair.lowerApproach,.24);
  assert.ok(Math.abs(p.y-.05)<.01);
 }
 for(const x of [-6.5,6.5]){
  const a=site(x,-28.8,4.25),b=site(x,-37.2,4.25);assert.ok(canStand(a,layout));
  walk(a,b);walk(b,a,.24);
 }
});

test('both landing-to-bridge seams carry every stair lane at small and delayed steps with real rendered slab coverage',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  for(const stair of layout.halle.stairs){
   const [a,b]=stair.axis,length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   const u={x:(b[0]-a[0])/length,z:(b[1]-a[1])/length},v={x:-u.z,z:u.x};
   const offset=(p,d)=>({...p,x:p.x+v.x*d,z:p.z+v.z*d});
   for(const lane of [-.88,-.65,0,.65,.88]){
    const low=offset(stair.lowerApproach,lane),high=offset(stair.upperApproach,lane);
    for(const step of [.02,.035,.04,.24]){walk(low,high,step);walk(high,low,step);}
   }
   const edge=site(stair.name.includes('west')?-7.5:7.5,-32.3,4.25);
   for(const lane of [-.88,0,.88])for(const distance of [-.01,-.002,0,.002,.01]){
    const p=offset(edge,lane),ray=new THREE.Raycaster(new THREE.Vector3(p.x+u.x*distance,6,p.z+u.z*distance),new THREE.Vector3(0,-1,0));
    assert.ok(Math.abs(ray.intersectObject(model,true)[0].distance-1.75)<.002,'Rendered landing and bridge must meet across the complete clear width');
   }
  }
 }finally{disposeBerghainModel(model);}
});

test('Halle guards, concrete waist, closed WC walls and fittings block bodies while the WC doorway remains reachable',()=>{
 assert.ok(layout.halle,'Missing physical Halle assembly');
 for(const guard of layout.halle.guards){
  const p={x:(guard.start[0]+guard.end[0])/2,y:(guard.start[1]+guard.end[1])/2,z:(guard.start[2]+guard.end[2])/2};
  assert.equal(canStand(p,layout),false,'The visible mesh guard needs physical coverage');
 }
 for(const stair of layout.halle.stairs){
  const [a,b]=stair.axis,dx=b[0]-a[0],dz=b[1]-a[1];
  assert.equal(canStand({x:a[0]+dx*.25,y:.05,z:a[1]+dz*.25},layout),false,'Low concrete waist must block the head');
 }
 const wc=layout.halle.wc;
 let p={...wc.approach};assert.ok(canStand(p,layout));p=walk(p,wc.inside);walk(p,wc.approach);
 for(const solid of layout.solids.filter(s=>s.halle&&s.role==='WC wall')){
  assert.equal(canStand({x:(solid.x[0]+solid.x[1])/2,y:.05,z:(solid.z[0]+solid.z[1])/2},layout),false);
 }
});

test('Halle actual original geometry stays bounded and its hoppers have four planar rectangular sides',()=>{
 assert.ok(layout.halle,'Missing original Halle geometry');const model=createBerghainModel();
 try{
  const hoppers=layout.parts.filter(p=>p.section==='halle'&&p.role==='hopper');assert.equal(hoppers.length,3);
  for(const p of layout.parts.filter(p=>p.section==='halle')){
   const mesh=model.getObjectByName([p.section,p.material,p.shape].join('/')),matrix=new THREE.Matrix4().fromArray(p.matrix);
   const v=new THREE.Vector3();
   for(let i=0;i<mesh.geometry.attributes.position.count;i++){
    v.fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(matrix);
    assert.ok(v.y>=-.31&&v.y<=22.8031,`${p.name} escapes vertical hull`);
    assert.ok(v.x>-20.2&&v.x<19&&v.z>-55&&v.z<-15,`${p.name} escapes Halle envelope`);
   }
  }
  for(const p of hoppers){
   const g=model.getObjectByName([p.section,p.material,p.shape].join('/')).geometry,positions=g.attributes.position;
   const corners=new Set();for(let i=0;i<positions.count;i++)if(positions.getY(i)>.49&&Math.hypot(positions.getX(i),positions.getZ(i))>.1)corners.add(`${positions.getX(i).toFixed(3)},${positions.getZ(i).toFixed(3)}`);
   assert.equal(corners.size,4,'The photographed hopper mouth is rectangular, not circular');
  }
 }finally{disposeBerghainModel(model);}
});

test('the entire Halle circuit connects stairs, all galleries and the WC without teleportation',()=>{
 let p={...viewpoints.halle.position};
 for(const target of halleCircuit())p=walk(p,target,.12);
 assert.ok(Math.hypot(p.x-viewpoints.halle.position.x,p.z-viewpoints.halle.position.z)<.025);
});

test('Halle rendered slabs expose three voids and its original indexed guards stay within their geometry budget',async()=>{
 const {model}=await beforeArchitecturalAdditions();model.updateMatrixWorld(true);
 try{
  for(const [x,z,distance]of [[-14,-34,7.95],[0,-34,7.95],[14,-34,7.95],[0,-28,3.75]]){
   const p=site(x,z,8),ray=new THREE.Raycaster(new THREE.Vector3(p.x,p.y,p.z),new THREE.Vector3(0,-1,0));
   assert.ok(Math.abs(ray.intersectObject(model,true)[0].distance-distance)<.002,'Rendered mesh must match the physical opening/slab');
  }
  const guards=model.getObjectByName('halle/steel/halle-mesh'),g=guards.geometry;
  assert.equal(guards.material.side,THREE.DoubleSide);assert.ok(g.index,'Indexed ribbons avoid duplicate rear triangles');
  const triangle=[0,1,2].map(i=>new THREE.Vector3().fromBufferAttribute(g.attributes.position,g.index.getX(i)));
  const center=triangle.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).multiplyScalar(1/3);
  const panel=new THREE.Mesh(g,guards.material);panel.updateMatrixWorld(true);
  for(const sign of [-1,1]){
   const ray=new THREE.Raycaster(center.clone().add(new THREE.Vector3(0,0,sign)),new THREE.Vector3(0,0,-sign));
   assert.ok(ray.intersectObject(panel).length,'Actual ribbon triangles are visible from either side');
  }
  // Admission has its own measured geometry budget and must not consume Halle's.
  let triangles=0,groups=0;model.traverse(mesh=>{if(mesh.isMesh&&!mesh.name.startsWith('admission/')){groups++;triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*(mesh.count??1);}});
  assert.ok(triangles<=658224+20000,`Triangle growth ${triangles-658224} exceeds the agreed provisional guard`);
  assert.ok(groups<=162+10,`Mesh/material-group growth ${groups-162} exceeds the agreed provisional guard`);
 }finally{disposeBerghainModel(model);}
});

// Exact Halle fingerprint independently matched against published 285186b.
// The former oracle hashed unrelated rooms that this change intentionally moves.
const BASELINE_FINGERPRINT={
  "parts": "cfa54a76d72c827cde2bb90d7118f2545f8c6e7c5fc7c43c561ce6cdb59dbc99",
  "count": 691,
  "solids": "7de254ca3fabbc37b9777f3609c481d54da6d17d755360bba537eaabfce034bc",
  "floors": "bab02f5dfc8f3aaa4373a94de30ade3a656b31b4cbaa3c95fe89e2bf25f02fc2",
  "views": "d83f0a09a9b33236bde2aad71d49b776fb1ba9aee5f512f0715ed6132defd442",
  "materials": "371588625fefe6d251ebf84b84ec5e8decfe71eb25f9e24f4268cc9004bf3c24",
  "bounds": "404f3286a2883f1ab3d0cef2a29671a2ee319641922cf96c6e703d409bf0874a",
  "inventory": "33a4c2b8e7c98944389d9c736b6240ee0419f052299b08f2ecf4d2966b5811ae"
};
