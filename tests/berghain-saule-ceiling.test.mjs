import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createViewerLighting} from '../berghain/night-lighting.mjs';

async function previous(){
 const ground=new URL('../assets/models/berghain/ground-registration.mjs',import.meta.url);
 const absolute=(text,url)=>text.replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
 const data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
 const source=absolute(readFileSync(ground,'utf8').replace(' fitSauleCeiling(layout);',''),ground);
 const url=new URL('../assets/models/berghain/layout.mjs',import.meta.url);
 return import(data(absolute(readFileSync(url,'utf8').replace("'./ground-registration.mjs'",JSON.stringify(data(source))),url)));
}
const round=value=>Math.round(value*1e6)/1e6;
function hit(model,origin,direction){return new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(model,true)[0];}

test('circular ceiling cavities are real capped recesses, while the occupied floor stays solid',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  assert.equal(layout.saule.ceiling.pockets.length,6);
  for(const {center:[x,y,z],radius}of layout.saule.ceiling.pockets){
   assert.equal(round(hit(model,[x,4.6,z],[0,1,0]).point.y),5.05,'bore reaches the actual retained slab');
   assert.equal(round(hit(model,[x+radius+.1,4.6,z],[0,1,0]).point.y),4.7,'solid lip lies below the cap');
   assert.equal(round(hit(model,[x,6,z],[0,-1,0]).point.y),5.45,'no through-floor opening');
   // Inside the pocket, horizontal rays find both sides of a circular bore.
   for(const d of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]])
    assert.ok(Math.abs(hit(model,[x,4.85,z],d).distance-radius)<.003,'actual bore diameter is circular');
  }
 }finally{disposeBerghainModel(model);}
});

test('ceiling fit preserves every public floor, original collision envelope, fixture and viewpoint',async()=>{
 const before=await previous();
 assert.deepEqual(layout.floors,before.layout.floors);
 assert.deepEqual(layout.solids.filter(s=>!s.sauleCeiling),before.layout.solids);
 assert.deepEqual(layout.fixtures,before.layout.fixtures);assert.deepEqual(viewpoints,before.viewpoints);
 for(const key of ['architecturalCirculation','halle','labOratory','groundSanitary','mainHallRegistration','panoramaRegistration'])assert.deepEqual(layout[key],before.layout[key]);
 assert.deepEqual(layout.saule.rooms,before.layout.saule.rooms);
 const removed=p=>p.name==='structural beam'&&p.center[1]<6&&p.center[0]>-10&&p.center[0]<1;
 assert.equal(before.layout.parts.filter(removed).length,2);
 assert.deepEqual(layout.parts.filter(p=>!p.sauleCeiling),before.layout.parts.filter(p=>!removed(p)),'all other transforms, shapes and tones exact');
});

test('the two inherited beams retain their complete side-room portions and end faces',()=>{
 const sources=layout.saule.ceiling.removedGenericMembers,parts=layout.parts.filter(p=>p.name==='Säule ceiling retained side beam');
 assert.equal(parts.length,4);
 for(const old of sources){
  const matching=parts.filter(p=>Math.abs(p.center[0]-old.center[0])<.2);assert.equal(matching.length,2);
  const original=old.matrix;
  const corners=p=>[-.5,.5].flatMap(x=>[-.5,.5].flatMap(y=>[-.5,.5].map(z=>new THREE.Vector3(x,y,z).applyMatrix4(new THREE.Matrix4().fromArray(p)).toArray())));
  const ends=corners(original).sort((a,b)=>a[2]-b[2]);
  for(const v of [ends[0],ends.at(-1)])assert.ok(matching.some(p=>corners(p.matrix).some(q=>Math.hypot(...q.map((n,i)=>n-v[i]))<1e-8)),'outer beam end remains exact');
  assert.ok(matching.every(p=>p.center[1]===5.1&&p.matrix[5]===original[5]));
 }
});

test('headroom and live light paths stay clear along the pier aisle',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 const scene=new THREE.Scene(),lighting=createViewerLighting(scene);
 try{
  let samples=0;for(let x=-13.5;x<=6;x+=.25)for(const z of [-.5,0,.5]){
   const p={x,y:.05,z};assert.ok(canStand(p,layout));
   const q=moveVisitor(p,{x:.03,z:0},layout);assert.ok(canStand(q,layout));
   const overhead=hit(model,[x,1.85,z],[0,1,0]);assert.ok(overhead&&overhead.point.y>=4.19);samples++;
  }
  assert.ok(samples>200);
  lighting.update('interior',viewpoints.saule.position);
  const lights=[];scene.traverse(o=>{if(o.isSpotLight)lights.push(o);});assert.equal(lights.length,3);assert.equal(lights.filter(l=>l.castShadow).length,2);
  for(const light of lights){
   const d=light.target.position.clone().sub(light.position),distance=d.length();
   const h=new THREE.Raycaster(light.position,d.normalize(),.02,distance-.05).intersectObject(model,true)[0];
   assert.ok(!h,'central light ray is not buried in the ceiling '+JSON.stringify(light.position));
  }
 }finally{lighting.dispose();disposeBerghainModel(model);}
});
