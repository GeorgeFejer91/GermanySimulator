import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {architecturalRoomAt,architecturalCues} from '../berghain/architectural-lighting.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';

import {mainHallWorldPoint,mainBarWorldPoint,mainHallOriginalPoint} from '../assets/models/berghain/main-hall-registration.mjs';
const registered=(p,kind)=>{const q=studyToSite({x:p[0],y:p[1],z:p[2]});if(!kind)return q;const[x,y,z]=(kind==='eisbar'?mainBarWorldPoint:mainHallWorldPoint)([q.x,q.y,q.z]);return{x,y,z};};

test('new routes select their own cue on the correct floor before generic garden/Panorama classification',()=>{
  for(const [p,room] of [
    [[23.6,9.05,7],'smoking'],[[23.6,5.45,7],'smoking'],[[23.6,.05,8],'smokingEscape'],
    [[16,8.75,-20],'eisbar'],[[12,5,18],'mainStair'],[[-15,.05,20.6],'groundToilets'],
    [[23.6,17,7],null],[[25,13.25,-20],null],[[-15,5.45,20.6],null],[[5,5.45,5],null]
  ])assert.equal(architecturalRoomAt(registered(p,['eisbar','mainStair'].includes(room)?room:null)),room);
  for(const lights of Object.values(architecturalCues((position,target,color,intensity,angle,range)=>({position,target,color,intensity,angle,range})))){
    assert.ok(lights.length>0&&lights.length<=3);
    assert.ok(lights.every(l=>l.position.every(Number.isFinite)&&l.target.every(Number.isFinite)&&l.intensity<=160));
  }
});

test('the upper stair approach is lit before descent without changing ground or upper-room cues',()=>{
  for(const [p,room] of [
    [[12,5.45,7.4],'mainStair'],[[12,5.45,8],'mainStair'],[[12,5.45,8.8],'mainStair'],[[12,5.45,9.5],'mainStair'],
    [[12,.05,8],null],[[12,9.05,8],null],[[12,5.45,7.2],null],[[4.9,5.45,8],null],[[17.3,5.45,8],null]
  ])assert.equal(architecturalRoomAt(registered(p,'mainStair')),room,JSON.stringify(p));
});

test('visible truss cables meet the actual roof mesh and all four circular recesses have closed dark centres',()=>{
  const model=createBerghainModel();model.updateMatrixWorld(true);
  try{
    const hangers=layout.parts.filter(p=>p.name==='main detail truss suspension');
    assert.equal(hangers.length,6);
    for(const h of hangers){
      const ray=new THREE.Raycaster(new THREE.Vector3(h.end[0],h.end[1]-.02,h.end[2]),new THREE.Vector3(0,1,0));
      const roof=model.getObjectByName('DEBE3DqCCB6bZkIF roof');
      assert.ok(Math.abs(ray.intersectObject(roof)[0].distance-.02)<.002);
    }
    const discs=layout.parts.filter(p=>p.name==='main detail dark wall recess');
    assert.equal(discs.length,4);
    assert.equal(new Set(discs.map(p=>p.center[0].toFixed(2))).size,2,'Two flanking pairs, with matching vertical centres');
    // The innermost torus hole is radius .465*.86; the dark disc covers it.
    assert.ok(discs.every(p=>p.size[0]/2>.465*.86));
    assert.match(layout.mainHallDetails.maintenanceAccess,/endpoint.*unverified/);
    assert.equal(layout.floors.some(f=>/maintenance/.test(f.name)),false,'Visible maintenance access is not an invented public route');
  }finally{disposeBerghainModel(model);}
});

test('the photographed overhead rig has connected cross and longitudinal lattice runs',()=>{
  const runs=layout.parts.filter(p=>p.name.startsWith('main detail truss ')&&p.material==='aluminium');
  assert.ok(runs.length>100,'inspect the complete open lattice');
  const segments=runs.map(p=>[new THREE.Vector3(...p.start),new THREE.Vector3(...p.end)]);
  const roots=segments.map((_,i)=>i),root=i=>roots[i]===i?i:(roots[i]=root(roots[i]));
  const touches=(p,[a,b])=>new THREE.Line3(a,b).closestPointToPoint(p,true,new THREE.Vector3()).distanceTo(p)<1e-6;
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++)
    if(segments[i].some(p=>touches(p,segments[j]))||segments[j].some(p=>touches(p,segments[i])))roots[root(i)]=root(j);
  assert.equal(new Set(segments.map((_,i)=>root(i))).size,1,'isolated crossbars do not reproduce the connected rig');
  assert.ok(segments.some(([a,b])=>Math.abs(b.x-a.x)>7&&Math.abs(b.z-a.z)<.2),'longitudinal runs cross the gaps between transverse members');
  assert.ok(segments.some(([a,b])=>Math.abs(b.z-a.z)>10&&Math.abs(b.x-a.x)<.2),'cross-runs retain the hall width');
  assert.ok(runs.every(p=>p.shape==='beam'&&p.width<=.045),'open chords and webs must not become a solid overhead box');
});
