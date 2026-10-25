import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createViewerLighting} from '../berghain/night-lighting.mjs';

async function previous(){
 const absolute=(text,url)=>text.replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
 const data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
 const registration=new URL('../assets/models/berghain/main-hall-registration.mjs',import.meta.url);
 const source=absolute(readFileSync(registration,'utf8').replace(' fitMainDJBay(layout);',''),registration);
 const url=new URL('../assets/models/berghain/layout.mjs',import.meta.url);
 return import(data(absolute(readFileSync(url,'utf8').replace("'./main-hall-registration.mjs'",JSON.stringify(data(source))),url)));
}
const retired=p=>/^Hall fit DJ |^main DJ (platform|desk)$/.test(p.name);
const changed=p=>p.djBay||p.djBayMount;
const mount=p=>/^main detail (circular wall frame|dark wall recess|closed wall service hatch|maintenance )/.test(p.name??'')||/^main-satellite-[01](?: |$)/.test(p.equipment??p.id??'');
const hit=(model,origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(model,true)[0];

test('DJ correction preserves public floors, routes, fixtures, guards and unrelated assemblies',async()=>{
 const before=await previous();
 assert.deepEqual(layout.floors,before.layout.floors);assert.deepEqual(viewpoints,before.viewpoints);
 assert.deepEqual(layout.fixtures,before.layout.fixtures);
 for(const key of ['architecturalCirculation','saule','halle','labOratory','groundSanitary','mainBar','panoramaRegistration'])assert.deepEqual(layout[key],before.layout[key]);
 assert.deepEqual(layout.parts.filter(p=>!changed(p)),before.layout.parts.filter(p=>!retired(p)&&!mount(p)));
 assert.deepEqual(layout.solids.filter(s=>!changed(s.renderPart??{})),before.layout.solids.filter(s=>!retired(s.renderPart??{})&&!mount(s.renderPart??{})));
 const sound=structuredClone(layout.soundSystem);
 for(const component of sound.components)if(mount(component)){component.position[0]-=.33;component.matrix[12]-=.33;}
 const rounded=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='number'?Math.round(v*1e9)/1e9:v));
 assert.deepEqual(rounded(sound),rounded(before.layout.soundSystem),'only complete wall satellites follow their wall; all PA dimensions and remaining components retained');
 assert.match(layout.mainHallRegistration.djBay.privateWC,/V11.*2024.*V12.*2026/);
 assert.match(layout.mainHallRegistration.djBay.limits,/unregistered/);
});

test('complete counter assembly clears guard rods and both satellite cabinets clear their mounting wall',()=>{
 const front=layout.mainHallRegistration.djBay.opening.front;
 for(const p of layout.parts.filter(p=>/^main-satellite-[01]$/.test(p.equipment??''))){
  const radius=[0,4,8].reduce((sum,i)=>sum+Math.abs(p.matrix[i])*.5,0);
  assert.ok(p.center[0]-radius>front+.05,'whole cabinet envelope clear of concrete: '+p.name);
 }
 const rods=layout.parts.filter(p=>p.name==='main detail booth upright');assert.equal(rods.length,3);
 const rodBack=Math.min(...rods.map(p=>Math.min(p.start[0],p.end[0])-p.width/2));
 const furniture=layout.parts.filter(p=>p.name==='main DJ desk'||/^DJ bay (counter |deck |mixer$)/.test(p.name));assert.equal(furniture.length,12);
 for(const p of furniture){
  const radius=[0,4,8].reduce((sum,i)=>sum+Math.abs(p.matrix[i])*.5,0);
  assert.ok(p.center[0]+radius<rodBack-.03,'furniture stays behind the complete guard body: '+p.name);
 }
});

test('opening has real side returns below the service hatch and near the adjacent door head',()=>{
 const o=layout.mainHallRegistration.djBay.opening;
 const door=layout.parts.find(p=>p.name==='DJ bay closed white door');
 assert.ok(o.high-(door.center[1]+door.size[1]/2)>0&&o.high-(door.center[1]+door.size[1]/2)<.6);
 assert.ok(o.high-o.low>2&&o.high-o.low<2.6,'human-scale fitted opening');
 for(const p of layout.parts.filter(p=>p.name==='main detail closed wall service hatch'))assert.ok(p.center[1]-p.size[1]/2>o.high+.5,'hatches sit above the complete opening');
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const center=(o.z[0]+o.z[1])/2,x=(o.front+o.back)/2,y=7.25;
  for(const sign of [-1,1])assert.ok(Math.abs(hit(model,[x,y,center],[0,0,sign]).distance-1.75)<.002,'real return faces');
  assert.ok(hit(model,[x,y,center],[-1,0,0]).distance>.15,'curtain is recessed');
  assert.ok(Math.abs(hit(model,[x,7.7,center],[0,1,0]).point.y-o.high)<.002);
 }finally{disposeBerghainModel(model);}
});

test('thin counter, equipment and unchanged guard have actual supporting surfaces',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const counter=layout.parts.find(p=>p.name==='main DJ desk');assert.ok(counter.size[1]<.15);
  for(const p of layout.parts.filter(p=>p.name==='DJ bay counter leg')){
   const bottom=p.center[1]-p.size[1]/2,top=p.center[1]+p.size[1]/2;
   assert.ok(Math.abs(hit(model,[p.center[0],bottom+.005,p.center[2]],[0,-1,0]).distance-.005)<.002);
   assert.ok(Math.abs(hit(model,[p.center[0],top-.005,p.center[2]],[0,1,0]).distance-.005)<.002,'counter top begins at the support top');
  }
  for(const p of layout.parts.filter(p=>p.name==='main detail booth upright')){
   const [x,y,z]=p.start;
   assert.ok(Math.abs(hit(model,[x+.035,y+.005,z],[0,-1,0]).point.y-y)<.002,'guard is supported by deck');
  }
  assert.ok(counter.center[1]+counter.size[1]/2<5.45+1.68,'ordinary eye sees over counter');
 }finally{disposeBerghainModel(model);}
});

test('public approach and return remain body-clear, while private curtain and platform stay closed',()=>{
 for(const dt of [1/60,1/30,.1]){
  let p={x:-11.2,y:5.45,z:-4};assert.ok(canStand(p,layout));
  const points=[{x:-13.8,y:5.45,z:-4},{x:-13.8,y:5.45,z:1},{x:-11.2,y:5.45,z:1},{x:-11.2,y:5.45,z:-4}];
  for(const target of points){
   const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/(1.6*dt)),d={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
   for(let i=0;i<n;i++){p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout));}
   assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.03);
  }
 }
 for(const x of [-15.5,-18])assert.equal(canStand({x,y:5.45,z:-4},layout),false);
});

test('local red curtain and counter washes reach their surfaces within the shared light budget',()=>{
 const scene=new THREE.Scene(),lighting=createViewerLighting(scene),model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const state=lighting.update('interior',{x:-11.2,y:5.45,z:-4});assert.equal(state.room,'mainDJ');
  assert.equal(state.activeLights,3);assert.equal(state.shadowMaps,2);
  const lights=[];scene.traverse(o=>{if(o.isSpotLight&&o.visible)lights.push(o);});assert.equal(lights.length,3);
  for(const light of lights){
   const direction=light.target.position.clone().sub(light.position),length=direction.length();
   const nearest=hit(model,light.position.toArray(),direction.normalize().toArray());
   assert.ok(!nearest||nearest.distance>=length-.04,'no intervening wall, fixture body or booth blocks the cue');
  }
  assert.equal(lighting.update('interior',{x:-8,y:5.45,z:-4}).room,'berghain');
  assert.equal(lighting.update('interior',{x:-11.2,y:.05,z:-4}).room,'saule');
 }finally{lighting.dispose();disposeBerghainModel(model);}
});
