import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {architecturalRoomAt,architecturalCues} from '../berghain/architectural-lighting.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';

test('new routes select their own cue on the correct floor before generic garden/Panorama classification',()=>{
  for(const [p,room] of [
    [[23.6,9.05,7],'smoking'],[[23.6,5.45,7],'smoking'],[[23.6,.05,8],'smokingEscape'],
    [[16,8.75,-20],'eisbar'],[[12,5,18],'mainStair'],[[-15,.05,20.6],'groundToilets'],
    [[23.6,17,7],null],[[25,13.25,-20],null],[[-15,5.45,20.6],null],[[5,5.45,5],null]
  ])assert.equal(architecturalRoomAt(studyToSite({x:p[0],y:p[1],z:p[2]})),room);
  for(const lights of Object.values(architecturalCues((position,target,color,intensity,angle,range)=>({position,target,color,intensity,angle,range})))){
    assert.ok(lights.length>0&&lights.length<=3);
    assert.ok(lights.every(l=>l.position.every(Number.isFinite)&&l.target.every(Number.isFinite)&&l.intensity<=160));
  }
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
