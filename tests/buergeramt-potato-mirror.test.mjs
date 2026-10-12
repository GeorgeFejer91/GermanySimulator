import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {potatoReflection,createPotatoMirror} from '../buergeramt-potato-mirror.js';
import {harness} from './amt-harness.mjs';

function approach(h){h.moveTo(0,4.8);h.moveTo(-5.65,4.8);h.faceToward(-5.65,5.36)}

test('reflection has equal plane distance, parallel lateral travel, and reflected heading',()=>{
 const mirror={x:-5.65,z:5.36};
 for(const x of [-6.2,-5.65,-4.8])for(const z of [3.2,4.2,4.8])for(const yaw of [0,.4,Math.PI,4.1]){
  const pose=potatoReflection({x,z,yaw},mirror);
  assert.equal(pose.x,x);assert(Math.abs((pose.z-mirror.z)-(mirror.z-z))<1e-12);
  const forward=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),pose.yaw);
  assert(Math.abs(forward.x-Math.sin(yaw))<1e-12);assert(Math.abs(forward.z-Math.cos(yaw))<1e-12);
 }
});

test('the jointed model plants when blocked, paused or re-entered and disposes its resources',()=>{
 const scene=new THREE.Scene(),mirror={x:-5.65,z:5.36,width:3,height:3.3,depth:3.12};
 const effect=createPotatoMirror({THREE,scene,mirror});
 const view={x:-5.65,z:4.3,yaw:Math.PI,walkedDistance:0,positionGeneration:1};
 effect.update(view);assert.equal(effect.inspect().visible,true);
 effect.update({...view,z:4.4,walkedDistance:.1});assert(effect.inspect().joints.some(([x])=>Math.abs(x)>0));
 effect.update({...view,z:4.4,walkedDistance:.1});assert(effect.inspect().joints.every(([x,z])=>x===0&&z===0));
 effect.update({...view,z:4.5,walkedDistance:.2,positionGeneration:2});assert.equal(effect.inspect().pose.moving,false);
 effect.update({...view,z:8});assert.equal(effect.inspect().visible,false,'outside cannot see the potato');
 effect.update(null);assert.equal(effect.inspect().pose,null);assert.equal(effect.inspect().visible,false);
 effect.update(view);assert.equal(effect.inspect().pose.moving,false);
 assert.equal(effect.inspect().glass.depthWrite,false);
 const group=scene.children[0],body=group.getObjectByName('Reflected potato rig');
 const bounds=new THREE.Box3().setFromObject(body);assert(bounds.min.y>=-.001);assert(bounds.max.y>1.7&&bounds.max.y<1.9);
 let disposed=0;group.traverse(object=>object.geometry?.addEventListener('dispose',()=>disposed++));
 effect.dispose();assert.equal(scene.children.length,0);assert(disposed>0);
});

test('surrogate clipping agrees with independent camera rays through the mirror opening',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror,scene=new THREE.Scene();
 const effect=createPotatoMirror({THREE,scene,mirror});
 const material=scene.getObjectByName('Reflected potato rig').children[0].material,planes=material.clippingPlanes;
 assert.equal(planes.length,5);
 for(const cameraX of [-6.4,-5.65,-4.02]){
  const eye=new THREE.Vector3(cameraX,1.68,4.92);effect.update({x:cameraX,z:eye.z,yaw:4,walkedDistance:0});
  for(const px of [-7,-6,-5,-4])for(const py of [.1,1,2,3])for(const pz of [5.5,6,7]){
   const point=new THREE.Vector3(px,py,pz),t=(mirror.z-.025-eye.z)/(pz-eye.z);
   const crossX=eye.x+(px-eye.x)*t,crossY=eye.y+(py-eye.y)*t;
   const expected=crossX>=mirror.x-mirror.width/2+.06&&crossX<=mirror.x+mirror.width/2-.06&&crossY>=.08&&crossY<=mirror.height-.08;
   assert.equal(planes.every(plane=>plane.distanceToPoint(point)>=-1e-9),expected,JSON.stringify({cameraX,px,py,pz,crossX,crossY}));
  }
 }
 effect.dispose();
});

test('E needs front-side proximity and facing; exact player remark completes once without a reward',()=>{
 const h=harness('host',{voice:true,cinematics:false}),lookups=[];
 h.window.GermanySimulatorAudioText.recordedClip=(voiceId,text)=>{lookups.push({voiceId,text});return null};
 h.key('KeyE');h.key('KeyE','keyup');assert.notEqual(h.level.stage,'mirror');
 approach(h);assert.equal(h.node('amt-nearby').textContent,'E · SPIEGEL BETRACHTEN');
 h.faceToward(-5.65,0);h.level.interact();assert.notEqual(h.level.stage,'mirror');
 h.faceToward(-5.65,5.36);h.level.interact();assert.equal(h.level.stage,'mirror');
 assert.equal(h.node('amt-speaker').textContent,'ICH');assert.equal(h.node('amt-line').textContent,'Bin ich wirklich eine deutsche Kartoffel?');
 h.key('KeyE');h.key('KeyE','keyup');h.tick(20);assert.equal(lookups.length,1);
 assert.equal(lookups[0].voiceId,'spieler-hans-peter-mustermann');assert.equal(h.synth.spoken.at(-1).text,'Bin ich wirklich eine deutsche Kartoffel?');
 h.synth.end();h.level.update(.05);assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.form,0);assert.equal(h.level.registrationTicket,'');
});

test('voice off and speech failure retain the remark and opted-in English caption; close cancels continuation',()=>{
 for(const synthesis of [true,false]){
  const h=harness('host',{voice:false,synthesis,cinematics:false,phoneCaptions:true});approach(h);h.level.interact();
  assert.equal(h.node('english-subtitle').textContent,'Am I really a German potato?');assert.equal(h.node('english-subtitle').hidden,false);
  h.elapse(5);assert.equal(h.level.stage,'walk-sign');
  h.level.interact();assert.equal(h.level.stage,'mirror');h.node('amt-leave').click();h.elapse(30);assert.equal(h.level.stage,'closed');
 }
});

test('a phone receipt during the remark resumes waiting for the current ticket',()=>{
 const h=harness('host',{cinematics:false});approach(h);h.level.interact();
 const link=h.links[0];link.message({type:'scan',id:'a'.repeat(24)});link.message({type:'register',name:'Hans-Peter Mustermann'});
 link.message({type:'ticket-received',id:link.scanId,number:h.level.registrationTicket});assert.equal(h.level.stage,'mirror');
 h.elapse(5);assert.equal(h.level.stage,'waiting');assert.equal(h.counts.form,0);
});

test('glass and closed recess reject maximum-speed bodies at ordinary and delayed steps',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness('host',{cinematics:false});approach(h);h.key('KeyR');h.key('KeyW');
  for(let i=0;i<180;i++){h.level.update(dt);assert(h.level.view.z+.22<=5.14+.001)}
  h.key('KeyW','keyup');h.key('KeyR','keyup');assert(h.level.view.z>4.84);
  h.moveTo(-3.2,4.8);assert(h.level.view.x>-3.3,'player can leave along the front of the mirror');
 }
});
