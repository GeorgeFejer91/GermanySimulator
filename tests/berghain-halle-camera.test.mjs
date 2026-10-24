import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {createWalkthrough} from '../berghain/walkthrough.mjs';
import {canStand} from '../berghain/navigation.mjs';
import {halleCircuit} from '../berghain/halle-playtest.mjs';

test('Halle-stair/bridge/WC first-person camera keeps the eye inside the legal body through turns',async()=>{
 const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
 const walk=createWalkthrough(),camera=new THREE.PerspectiveCamera(60,1.5,.08,500),direction=new THREE.Vector3();
 try{
  for(const position of halleCircuit()){
   assert.ok(canStand(position,layout));
   for(let yaw=0;yaw<Math.PI*2;yaw+=.02)for(const pitch of [-.8,0,.8]){
    walk.camera(camera,position,yaw,pitch);
    assert.deepEqual(camera.position.toArray(),[position.x,position.y+1.68,position.z]);
    assert.equal(camera.fov,60);assert.equal(walk.avatar,undefined);
    camera.getWorldDirection(direction);
    assert.ok(direction.distanceTo(new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)))<1e-12);
   }
  }
 }finally{walk.dispose();}
});
