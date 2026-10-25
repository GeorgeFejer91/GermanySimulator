import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {groundRoomAt,groundLabPoint} from '../assets/models/berghain/ground-registration.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {footstepEnvironment} from '../berghain/footsteps.mjs';
import {createViewerLighting} from '../berghain/night-lighting.mjs';

const point=([x,z,y=.05])=>({x,y,z});
const circuit=[[9,15],[9,0],[3,0],[-14,0],[3,0],[3,5],[-9,5],[-9,9],[-9,5],[-5,5],[-5,9],[-5,5],[-1,5],[-1,9],[-1,5],[-17.3,5],[-17.3,9.5],[-10.4,9.5,2.7],[-5,9.5,2.7],[.4,9.5,2.7],[6.8,9.5],[6.8,0],[9,0],[9,15]].map(point);
function follow(start,targets,step){
 let p={...start};assert.ok(canStand(p,layout),'legal start');
 for(const target of targets){
  const dx=target.x-p.x,dz=target.z-p.z,n=Math.ceil(Math.hypot(dx,dz)/step);
  for(let i=0;i<n;i++){p=moveVisitor(p,{x:dx/n,z:dz/n},layout);assert.ok(canStand(p,layout),'legal body on every substep');}
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.03,JSON.stringify({target,actual:p}));
  assert.ok(Math.abs(p.y-target.y)<.03,'correct supported landing');
 }
 return p;
}

test('Säule joins the foyer, every fitted WC cubicle and both balcony stairs in both directions',()=>{
 for(const step of [.04,.24]){
  follow(circuit[0],circuit.slice(1),step);
  follow(circuit.at(-1),circuit.toReversed().slice(1),step);
 }
 for(const flight of layout.saule.rooms.stairs)for(const lane of [-.45,0,.45])for(const step of [.04,.24]){
  const a={...flight.lower,z:flight.lower.z+lane},b={...flight.upper,z:flight.upper.z+lane};
  follow(a,[b,a],step);
 }
});

test('actual rendered overhead geometry clears the body across both stairs and balcony passage',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);let minimum=Infinity,samples=0;
 try{
  for(let x=-16.8;x<=6.3;x+=.25)for(const z of x>=-11&&x<=1?[9.4,9.65,9.9]:[9.1,9.5,9.9]){
   const floor=layout.floors.find(f=>f.endY!==undefined&&f.name.startsWith('Ground fit Säule')&&x>=f.x[0]&&x<=f.x[1]);
   const y=x>=-11&&x<=1?2.7:floor?floor.y+(floor.endY-floor.y)*(x-floor.rampAxis[0][0])/(floor.rampAxis[1][0]-floor.rampAxis[0][0]):null;
   if(y===null)continue;
   const supported=moveVisitor({x,y,z},{x:0,z:0},layout);
   assert.ok(canStand(supported,layout)&&Math.hypot(supported.x-x,supported.z-z)<1e-6,'actual body fits below retained beams '+JSON.stringify({x,y,z}));
   for(const dx of [-.19,0,.19]){
    const ray=new THREE.Raycaster(new THREE.Vector3(x+dx,supported.y+1.8,z),new THREE.Vector3(0,1,0));
    const hit=ray.intersectObject(model,true)[0];assert.ok(hit,'the passage has a real overhead surface');
    const clearance=hit.distance+1.8;minimum=Math.min(minimum,clearance);samples++;
    assert.ok(clearance>=2.04,'no head-level beam intrusion');
   }
  }
  assert.ok(samples>700);assert.ok(Math.abs(minimum-layout.saule.rooms.headroom)<.002);
 }finally{disposeBerghainModel(model);}
});

test('balcony edges and closed Lab event boundaries physically stop bodies',()=>{
 for(const x of [-10.5,-5,.5]){
  assert.equal(canStand({x,y:2.7,z:6.1},layout),false);
  assert.equal(canStand({x,y:2.7,z:10.9},layout),false);
 }
 for(const z of [-11.5,-15.45,-30.83])assert.equal(canStand({x:3,y:.05,z},layout),false);
 const start={x:3,y:.05,z:-10},end=moveVisitor(start,{x:0,z:-4},layout);
 assert.ok(canStand(start,layout)&&canStand(end,layout));assert.ok(end.z>-11.2,'no passage through the closed event door');
 assert.match(layout.labOratory.access,/closed/);
 assert.match(layout.saule.rooms.wc.flinta,/unassigned/,'No invented assignment to a particular cubicle');
});

test('floor and balcony get distinct local light and acoustic responses without escaping the light budget',()=>{
 const scene=new THREE.Scene(),lighting=createViewerLighting(scene);
 try{
  for(const [p,room,acoustic] of [[point([-5,5]),'saule','saule'],[point([-5,9]),'sauleWC','wc'],[point([-5,9.5,2.7]),'sauleBalcony','saule']]){
   assert.equal(groundRoomAt(p),room);assert.equal(footstepEnvironment(p).room,acoustic);
   lighting.update('interior',p);assert.equal(lighting.state.room,room);
  }
  assert.equal(groundRoomAt({x:-5,y:5.45,z:9}),null,'the main-floor room is not a ground WC');
  assert.equal(footstepEnvironment(viewpoints.lab.position).room,'lab');
  const lights=[];scene.traverse(o=>{if(o.isSpotLight)lights.push(o);});
  assert.equal(lights.length,3);assert.equal(lights.filter(l=>l.castShadow).length,2);
 }finally{lighting.dispose();}
});

test('moving Lab preserves its original fitted physical envelopes including cast relief margins',async()=>{
 const before=await original();
 const old=before.layout.solids.filter(s=>s.renderPart?.fixture?.startsWith('lab-'));
 const actual=layout.solids.filter(s=>s.renderPart?.fixture?.startsWith('lab-'));
 assert.ok(old.length>20);assert.equal(actual.length,old.length);
 for(let i=0;i<old.length;i++){
  const s=old[i],a=actual[i];assert.equal(a.name,s.name);
  const vertices=s.polygon??[[s.x[0],s.z[0]],[s.x[1],s.z[0]],[s.x[1],s.z[1]],[s.x[0],s.z[1]]];
  const moved=vertices.map(([x,z])=>{const p=groundLabPoint([x,0,z]);const bank=/^lab-(pipe-bar|pipe-stool-|gauge-wall|insulator-canopy)/.test(s.renderPart.fixture);return[p[0],p[2]-(bank?3.5:0)];});
  assert.deepEqual(a.polygon,moved,'retain the entire contact outline');
  const shift=s.renderPart.fixture==='lab-insulator-canopy'?-.4:0;
  assert.deepEqual(a.y,s.y.map(y=>y+shift));
 }
});

async function original(){
 const url=new URL('../assets/models/berghain/layout.mjs',import.meta.url);
 const source=readFileSync(url,'utf8').replace('registerGround(layout,viewpoints);','')
  .replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}

test('the ground fit preserves unaffected geometry and tones and the complete upper Halle structure',async()=>{
 const before=await original();
 const key=p=>JSON.stringify([p.name,p.fixture,p.role,p.section,p.shape,p.material,p.matrix,p.center,p.size,p.start,p.end]);
 const toneGroups=new Map();
 for(const p of before.layout.parts){const k=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');if(!toneGroups.has(k))toneGroups.set(k,[]);toneGroups.get(k).push(p);}
 const tones=new Map();for(const ps of toneGroups.values())ps.forEach((p,i)=>tones.set(p,p.instanceTone??(.84+((i*193+ps.length*37)%101)/625)));
 const originals=new Map();for(const p of before.layout.parts){const k=key(p);if(!originals.has(k))originals.set(k,[]);originals.get(k).push(p);}
 const retained=layout.parts.filter(p=>!p.groundFit);assert.ok(retained.length>9000);
 for(const p of retained){const old=originals.get(key(p))?.shift();assert.ok(old,'unmodified geometry '+p.name);assert.equal(p.instanceTone,tones.get(old),'unmodified tone '+p.name);}
 const upper=parts=>parts.filter(p=>p.section==='halle'||p.name.startsWith('Halle')&&p.name!=='Halle ground');
 assert.deepEqual(upper(layout.parts),upper(before.layout.parts),'only the named ground slab is cut for the relocated sanitary pit');
 assert.deepEqual(layout.halle,before.layout.halle);
 assert.deepEqual(layout.exteriorBounds,before.layout.exteriorBounds);
});

test('the intact Lab bar bank and services clear the retained Halle frame and light trays',()=>{
 const model=createBerghainModel(),counts=new Map(),bounds=new Map();
 try{
  for(const p of layout.parts){
   const key=[p.section,p.material,p.shape].join('/'),index=counts.get(key)||0;counts.set(key,index+1);
   const mesh=model.getObjectByName(key),matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);
   const box=new THREE.Box3(),v=new THREE.Vector3();
   for(let i=0;i<mesh.geometry.attributes.position.count;i++)box.expandByPoint(v.fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(matrix));
   bounds.set(p,box);
  }
  const bank=layout.parts.filter(p=>/^lab-(pipe-bar|pipe-stool-|gauge-wall|insulator-canopy)/.test(p.fixture??''));
  assert.equal(bank.length,525,'move the complete bank, not isolated visibly intersecting pieces');
  const fitted=[...bank,...layout.parts.filter(p=>['Lab retained service run','Lab historic lintel'].includes(p.name))];
  const frame=layout.parts.filter(p=>p.section==='halle'&&bounds.get(p).min.y<3.9);
  assert.ok(frame.length>100);
  for(const a of fitted)for(const b of frame){
   const x=bounds.get(a),y=bounds.get(b);
   const penetration=Math.min(...['x','y','z'].map(k=>Math.min(x.max[k],y.max[k])-Math.max(x.min[k],y.min[k])));
   assert.ok(penetration<.005,a.name+' intersects '+b.name+' by '+penetration+'m');
  }
 }finally{disposeBerghainModel(model);}
});

test('new ground glass uses the standard blended depth policy while retained materials stay unchanged',()=>{
 const model=createBerghainModel();
 try{
  const glass=model.getObjectByName('interior/groundGlass/box');assert.ok(glass);
  assert.equal(glass.material.transparent,true);assert.equal(glass.material.depthWrite,false);
  assert.equal(glass.material.opacity,.32);
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString().trim());
  assert.equal(gltf.materials.find(m=>m.name==='interior/groundGlass/box').alphaMode,'BLEND');
 }finally{disposeBerghainModel(model);}
});

test('both stair guards recover a re-entered body onto full support at normal and delayed steps',()=>{
 // Actual rejected v2 contacts: the old guard offered a recovery point 4 mm
 // outside the body's fully supported floor area. Keep all four witnesses.
 for(const [x,y]of [[-13.9,1.5029310344827584],[3.65,1.5150000000000001]])
 for(const z of [8.939649122807014,10.060350877192986]){
  const start={x,y,z},inward=z<9.5?1:-1;
  assert.equal(canStand(start,layout),false,'manual re-entry begins inside the guard');
  const recovered=moveVisitor(start,{x:0,z:0},layout);
  assert.ok(canStand(recovered,layout),'zero-input recovery must restore full support');
  assert.ok(Math.hypot(recovered.x-x,recovered.z-z)<.1,'recovery stays local');
  for(const dt of [1/60,1/30,.1])for(const [dx,dz]of [[0,inward],[1,0],[-1,0],[Math.SQRT1_2,inward*Math.SQRT1_2],[-Math.SQRT1_2,inward*Math.SQRT1_2]]){
   let p={...start};
   for(let step=0;step<Math.ceil(.5/dt);step++){
    p=moveVisitor(p,{x:dx*1.6*dt,z:dz*1.6*dt},layout);
    assert.ok(canStand(p,layout),'reverse/tangent movement stays supported after re-entry');
   }
   assert.ok(Math.hypot(p.x-recovered.x,p.z-recovered.z)>.1,'legal input escapes the guard contact');
  }
 }
});
