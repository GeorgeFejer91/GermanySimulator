import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createViewerLighting} from '../berghain/night-lighting.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';

test('club-night lighting removes daylight and restores the exterior inspection view',()=>{
  const scene=new THREE.Scene(), rig=createViewerLighting(scene);
  rig.update('exterior',viewpoints.foyer.position);
  assert.equal(rig.state.daylight,true);
  for(const room of ['queue','admission','foyer','berghain','panorama','klo','toilets','lab','halle','garden']){
    rig.update('interior',viewpoints[room].position);
    assert.equal(rig.state.daylight,false,room);
    assert.ok(rig.state.ambient<=(['queue','admission'].includes(room)?.7:.2),room);
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
  rig.update('interior',{...viewpoints.admission.position,y:6.65});
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
