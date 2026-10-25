import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createViewerLighting} from '../berghain/night-lighting.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

test('club-night lighting removes daylight and restores the exterior inspection view',()=>{
  const scene=new THREE.Scene(), rig=createViewerLighting(scene);
  rig.update('exterior',viewpoints.foyer.position);
  assert.equal(rig.state.daylight,true);
  for(const room of ['queue','admission','foyer','berghain','panorama','klo','toilets','lab','halle','garden']){
    rig.update('interior',viewpoints[room].position);
    assert.equal(rig.state.daylight,false,room);
    assert.ok(rig.state.ambient<=.85,room);
    if(!['queue','garden'].includes(room)){
      assert.ok(rig.state.ambient>=.6,room+' has orientation fill');
      const fill=scene.getObjectByProperty('isHemisphereLight',true);
      assert.ok(fill.color.r>fill.color.g&&fill.color.g>fill.color.b,room+' stays warm');
      assert.ok(fill.groundColor.r>fill.groundColor.b,room+' floor bounce stays warm');
    }
    assert.ok(rig.state.activeLights>0,room);
    assert.ok(rig.state.shadowMaps<=2,room);
  }
  rig.update('exterior',viewpoints.foyer.position);
  assert.equal(rig.state.daylight,true);
  assert.equal(scene.fog,null);
  rig.dispose();assert.equal(scene.children.length,0);
});

test('admission lights remain inside the low room and select only on its floor',()=>{
  const scene=new THREE.Scene(),rig=createViewerLighting(scene);
  rig.update('interior',viewpoints.admission.position);
  assert.equal(rig.state.room,'admission');
  scene.traverse(light=>{
    if(light.isSpotLight&&light.visible){
      assert.ok(light.position.y<3.05-.1);
      assert.ok(light.position.y>1.8);
    }
  });
  rig.update('interior',{...viewpoints.admission.position,y:5.45});
  assert.notEqual(rig.state.room,'admission');
  rig.dispose();
});

test('lounge practical lights sit beneath its opaque ceiling',()=>{
  const scene=new THREE.Scene(),rig=createViewerLighting(scene);
  rig.update('interior',viewpoints.lounge.position);
  assert.equal(rig.state.room,'lounge');
  scene.traverse(light=>{
    if(light.isSpotLight&&light.visible){
      assert.ok(light.position.y<layout.upperLounge.ceilingHeight-.1);
      assert.ok(light.position.y>layout.upperLounge.floorHeight+1.8);
    }
  });
  rig.dispose();
});

test('night lighting has no timer, moving visitor lamp, or allocation on repeated updates',()=>{
  const scene=new THREE.Scene(), rig=createViewerLighting(scene);
  rig.update('interior',viewpoints.berghain.position);
  const positions=scene.children.flatMap(o=>o.children).filter(o=>o.isLight).map(o=>o.position.toArray());
  const objects=[];scene.traverse(o=>objects.push(o.uuid));
  for(let i=0;i<100;i++)rig.update('interior',{...viewpoints.berghain.position,x:viewpoints.berghain.position.x+i*.001});
  assert.deepEqual(scene.children.flatMap(o=>o.children).filter(o=>o.isLight).map(o=>o.position.toArray()),positions);
  const after=[];scene.traverse(o=>after.push(o.uuid));assert.deepEqual(after,objects);
  rig.dispose();
});

test('Klo practical lights are below the model ceiling soffit',()=>{
  const ceiling=layout.parts.find(p=>p.name==='Klo red ceiling');
  assert.ok(ceiling);
  const soffit=ceiling.matrix[13]-Math.abs(ceiling.matrix[5])/2;
  const scene=new THREE.Scene(),rig=createViewerLighting(scene);
  rig.update('interior',viewpoints.klo.position);
  assert.equal(rig.state.room,'klo');
  scene.traverse(light=>{
    if(light.isSpotLight&&light.visible)assert.ok(light.position.y<soffit-.1);
  });
  rig.dispose();
});

test('Panorama light sources clear the actual suspended acoustic geometry',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene),model=createBerghainModel();
 model.updateMatrixWorld(true);rig.update('interior',viewpoints.panorama.position);
 try{
  const ray=new THREE.Raycaster();let checked=0;
  scene.traverse(light=>{
   if(!light.isSpotLight||!light.visible)return;
   ray.set(light.position,light.target.position.clone().sub(light.position).normalize());
   ray.far=.2;
   const hits=ray.intersectObject(model,true).filter(h=>!h.object.material.transparent&&!h.object.material.transmission);
   assert.equal(hits.length,0,light.name+' must not emit from inside an opaque panel; shadow near clipping is not clearance');
   checked++;
  });
  assert.equal(checked,3);
 }finally{rig.dispose();disposeBerghainModel(model);}
});

test('main-floor cues reach opposing architecture and the floor without near-clipped emitters',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene),model=createBerghainModel();
 model.updateMatrixWorld(true);rig.update('interior',viewpoints.berghain.position);
 const lights=[];scene.traverse(o=>{if(o.isSpotLight&&o.visible)lights.push(o);});
 try{
  assert.equal(lights.length,3);
  const hits=lights.map(light=>{
   const direction=light.target.position.clone().sub(light.position).normalize();
   const ray=new THREE.Raycaster(light.position,direction,0,light.distance);
   const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent&&!h.object.material.transmission);
   assert.ok(hit,light.name+' reaches a real opaque surface');
   assert.ok(hit.distance>.3,light.name+' emits outside the opaque rig');
   return hit;
  });
  assert.ok(hits[0].point.z>lights[0].position.z+5,'left wash reaches the opposite architectural plane');
  assert.ok(hits[1].point.z<lights[1].position.z-5,'right wash reaches the opposite architectural plane');
  for(const hit of hits.slice(0,2))assert.ok(hit.point.y>7&&hit.point.y<12,'wall wash lands above visitor height');
  assert.ok(Math.abs(hits[2].point.y-5.45)<.01,'separate pool reaches the actual dance floor');
  assert.ok(lights.slice(0,2).every(l=>l.castShadow),'architectural washes respect intervening opaque geometry');
 }finally{rig.dispose();disposeBerghainModel(model);}
});

test('foyer wash emits below its actual soffit and reaches the ground',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene),model=createBerghainModel();
 try{
  model.updateMatrixWorld(true);rig.update('interior',viewpoints.foyer.position);assert.equal(rig.state.room,'foyer');
  const light=scene.getObjectByName('club cue 1');assert.ok(light?.visible&&light.castShadow);
  const ray=new THREE.Raycaster(light.position,light.target.position.clone().sub(light.position).normalize(),0,light.distance);
  const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent&&!h.object.material.transmission);
  assert.ok(hit&&hit.distance>1&&hit.point.y<1,'foyer wash is intercepted above ground '+JSON.stringify(hit&&{distance:hit.distance,point:hit.point.toArray()}));
 }finally{rig.dispose();disposeBerghainModel(model);}
});

test('ordinary Panorama WC cues clear the cubicle panels and reach the floor',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene),model=createBerghainModel();
 try{
  model.updateMatrixWorld(true);rig.update('interior',{x:5.7,y:9.05,z:17});
  assert.equal(rig.state.room,'panoramaToilets');let count=0;
  scene.traverse(light=>{
   if(!light.isSpotLight||!light.visible)return;
   const ray=new THREE.Raycaster(light.position,light.target.position.clone().sub(light.position).normalize(),0,light.distance);
   const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent&&!h.object.material.transmission);
   assert.ok(hit&&hit.distance>1.5&&Math.abs(hit.point.y-9.05)<.01,
    light.name+' must reach the supported floor, not a near cubicle divider: '+JSON.stringify(hit&&{distance:hit.distance,point:hit.point.toArray()}));
   count++;
  });assert.equal(count,3);
 }finally{rig.dispose();disposeBerghainModel(model);}
});
