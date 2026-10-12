import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {potatoReflection,potatoMirrorAnchor,frameMirrorDouble,prepareMirrorCamera,createPotatoMirror} from '../buergeramt-potato-mirror.js';
import {harness} from './amt-harness.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function approach(h){h.moveTo(0,4.8);h.moveTo(-5.65,4.8);h.faceToward(-5.65,5.36)}

test('reflection has equal plane distance, parallel lateral travel, and reflected heading',()=>{
 const mirror={x:-5.65,z:5.36};
 for(const x of [-6.2,-5.65,-4.8])for(const z of [3.2,4.2,4.8])for(const yaw of [0,.4,Math.PI,4.1]){
  const pose=potatoReflection({x,z,yaw},mirror);
  const plane=mirror.z-.025;assert.equal(pose.x,x);assert(Math.abs((pose.z-plane)-(plane-z))<1e-12);
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
 assert.equal(effect.inspect().glass.depthWrite,true);
 const body=scene.getObjectByName('Reflected potato rig');
 const bounds=new THREE.Box3().setFromObject(body);assert(bounds.min.y>=-.001);assert(bounds.max.y>1.7&&bounds.max.y<1.9);
 let disposed=0;scene.traverse(object=>object.geometry?.addEventListener('dispose',()=>disposed++));
 effect.dispose();assert.equal(scene.children.length,0);assert(disposed>0);
});

test('live reflection clips the exterior and keeps the double in glass at far/off-axis views',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror,scene=new THREE.Scene(),effect=createPotatoMirror({THREE,scene,mirror});
 const pane=scene.getObjectByName('Kartoffelspiegel').children.find(o=>o.material?.name==='Live silvered mirror');
 for(const x of [-7.2,-5.65,0,7.2])for(const z of [-9,-5,0,4.9]){
  const camera=new THREE.PerspectiveCamera(69,1.6,.06,35),reflected=new THREE.PerspectiveCamera();camera.position.set(x,1.68,z);camera.lookAt(mirror.x,1.68,mirror.z);
  prepareMirrorCamera({THREE,camera,reflected,mirror,pane,textureMatrix:new THREE.Matrix4()});
  assert(Math.abs(reflected.position.z-(2*(mirror.z-.025)-z))<1e-12);
  const exterior=new THREE.Vector4(mirror.x,1.68,mirror.z+1,1).applyMatrix4(reflected.matrixWorldInverse).applyMatrix4(reflected.projectionMatrix);
  assert(exterior.w<0||exterior.z<-exterior.w,'near clipping/camera rejects the exterior');
  const anchor=potatoMirrorAnchor({x,z},mirror),crossX=(x+anchor.x)/2;
  assert(crossX>=mirror.x-mirror.width/2+.379&&crossX<=mirror.x+mirror.width/2-.379);
  effect.update({x,z,yaw:Math.PI,walkedDistance:0});assert.equal(effect.inspect().visible,true,'no distance disappearance');
  const projected=new THREE.Vector3(anchor.x,1.03,z).project(reflected);assert(projected.z>=-1&&projected.z<=1,'double remains inside reflection depth, including far view');
 }
 effect.dispose();
});

test('E needs front-side proximity and facing; exact player remark completes once without a reward',()=>{
 const h=harness('host',{voice:true,candidatePhone:true,cinematics:false}),lookups=[];
 vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),h.context);
 const catalog=h.window.GermanySimulatorAudioText,lookup=catalog.recordedClip;
 h.window.GermanySimulatorAudioText={...catalog,recordedClip:(voiceId,text)=>{lookups.push({voiceId,text});return lookup(voiceId,text)}};
 h.key('KeyE');h.key('KeyE','keyup');assert.notEqual(h.level.stage,'mirror');h.level.replay(h.config);lookups.length=0;
 approach(h);assert.equal(h.node('amt-nearby').textContent,'E · SPIEGEL BETRACHTEN');
 h.faceToward(-5.65,0);h.level.interact();assert.notEqual(h.level.stage,'mirror');h.level.replay(h.config);lookups.length=0;approach(h);
 h.faceToward(-5.65,5.36);h.level.interact();assert.equal(h.level.stage,'mirror');
 const text=h.window.BuergeramtStory.potatoMirror.line;
 assert.equal(h.node('amt-speaker').textContent,'ICH');assert.equal(h.node('amt-line').textContent,text);
 h.key('KeyE');h.key('KeyE','keyup');h.tick(20);assert.equal(lookups.length,1);
 assert.equal(lookups[0].voiceId,'spieler-hans-peter-mustermann');assert(!h.synth.spoken.some(u=>u.text===text));
 const audio=h.audio.recordings.at(-1);assert(audio.src.includes('player-potato-mirror.mp3'));assert.equal(h.audio.recordings.filter(a=>a.src.includes('player-potato-mirror.mp3')).length,1);
 audio.end();h.level.update(.05);assert.equal(h.level.stage,'walk-sign');assert.equal(h.counts.form,0);assert.equal(h.level.registrationTicket,'');
});

test('the visible-glass framing retains a self-image in partial, side and far views',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror;
 let partial=0;
 for(const x of [-7,-5.65,0,7])for(const z of [-9,-2,4.9])for(const offset of [-.5,0,.5]){
  const camera=new THREE.PerspectiveCamera(69,1.6,.06,35);camera.position.set(x,1.68,z);camera.lookAt(mirror.x,1.68,mirror.z);camera.rotateY(offset);camera.updateMatrixWorld();
  const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const framed=frameMirrorDouble({THREE,frustum,mirror,camera,preferred:potatoMirrorAnchor({x,z},mirror)});
  if(!framed)continue;partial++;
  assert(frustum.containsPoint(new THREE.Vector3(...framed.glassPoint)),'selected glass point is actually visible');
  assert(Math.abs((framed.x+x)/2-framed.glassPoint[0])<1e-9);
  assert(Math.abs((framed.y+1.03+1.68)/2-framed.glassPoint[1])<1e-9);
 }
 assert(partial>=24);
});

test('one capped target restores renderer state, pauses offscreen and retires on close',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror,scene=new THREE.Scene(),effect=createPotatoMirror({THREE,scene,mirror,mobile:true});
 const camera=new THREE.PerspectiveCamera(69,1.6,.06,35);camera.position.set(-5.65,1.68,3);camera.lookAt(-5.65,1.68,5.36);
 const outside={label:'previous target'},viewport=new THREE.Vector4(2,3,1280,800),scissor=new THREE.Vector4(4,5,640,400);
 const renderer={target:outside,autoClear:false,xr:{enabled:true},shadowMap:{autoUpdate:true},scissorTest:true,
  getDrawingBufferSize:v=>v.set(1280,800),getRenderTarget(){return this.target},setRenderTarget(t){this.target=t},getViewport:v=>v.copy(viewport),setViewport:v=>viewport.copy(v),getScissor:v=>v.copy(scissor),setScissor:v=>scissor.copy(v),getScissorTest(){return this.scissorTest},setScissorTest(v){this.scissorTest=v},clear(){}};
 effect.update({x:-5.65,z:3,yaw:Math.PI,walkedDistance:0});let captured=null,disposed=0;
 assert.equal(effect.render(renderer,camera,c=>{assert(c.isCamera);captured=renderer.target;captured.addEventListener('dispose',()=>disposed++);assert.equal(scene.getObjectByName('Kartoffelspiegel').visible,false)},0),true);
 assert.deepEqual(effect.inspect().reflection.target,[640,400]);assert.equal(effect.inspect().reflection.maxHz,60);
 assert.equal(effect.render(renderer,camera,()=>assert.fail('capture exceeded cadence'),3),false);
 effect.update({x:-5.53,z:3,yaw:Math.PI,walkedDistance:.12});effect.render(renderer,camera,()=>{},17);
 const advanced={x:-5.41,z:3,yaw:Math.PI,walkedDistance:.24};effect.update(advanced);effect.update(advanced);
 assert(effect.inspect().joints.some(([x,z])=>Math.abs(x)+Math.abs(z)>0),'repeated presentation of a physics position must not plant the next walking capture');
 effect.render(renderer,camera,()=>{},34);effect.update(advanced);assert(effect.inspect().joints.every(([x,z])=>x===0&&z===0));
 camera.rotation.set(0,0,0);assert.equal(effect.render(renderer,camera,()=>assert.fail('offscreen mirror captured'),60),false);
  const offscreenMove={...advanced,x:-5.2,walkedDistance:.45};effect.update(offscreenMove);
  effect.render(renderer,camera,()=>assert.fail('offscreen movement captured'),77);
  effect.update(offscreenMove);effect.render(renderer,camera,()=>assert.fail('offscreen stop captured'),94);
 camera.lookAt(-5.65,1.68,5.36);
  effect.update(offscreenMove);assert.equal(effect.inspect().pose.moving,false,'stationary reentry must plant the first visible pose');
  assert(effect.inspect().joints.every(([x,z])=>x===0&&z===0));assert(effect.render(renderer,camera,()=>{},111));
  assert.throws(()=>effect.render(renderer,camera,()=>{throw Error('draw failed')},130),/draw failed/);
 assert.equal(renderer.target,outside);assert.equal(renderer.autoClear,false);assert(renderer.xr.enabled&&renderer.shadowMap.autoUpdate&&renderer.scissorTest);
 assert.deepEqual(viewport.toArray(),[2,3,1280,800]);assert.deepEqual(scissor.toArray(),[4,5,640,400]);assert.equal(scene.getObjectByName('Kartoffelspiegel').visible,true);
 effect.update(null);assert.equal(effect.inspect().reflection.target,null);assert.equal(disposed,1);effect.dispose();assert.equal(scene.children.length,0);
});

test('voice off and speech failure retain the remark and opted-in English caption; close cancels continuation',()=>{
 for(const synthesis of [true,false]){
  const h=harness('host',{voice:false,synthesis,cinematics:false,phoneCaptions:true});approach(h);h.level.interact();
  assert.equal(h.node('english-subtitle').textContent,h.window.BuergeramtStory.potatoMirror.english);assert.equal(h.node('english-subtitle').hidden,false);
  h.elapse(10);assert.equal(h.level.stage,'walk-sign');
  h.level.interact();assert.equal(h.level.stage,'mirror');h.node('amt-leave').click();h.elapse(30);assert.equal(h.level.stage,'closed');
 }
});

test('a phone receipt during the remark resumes waiting for the current ticket',()=>{
 const h=harness('host',{cinematics:false});approach(h);h.level.interact();
 const link=h.links[0];link.message({type:'scan',id:'a'.repeat(24)});link.message({type:'register',name:'Hans-Peter Mustermann'});
 link.message({type:'ticket-received',id:link.scanId,number:h.level.registrationTicket});assert.equal(h.level.stage,'mirror');
 h.elapse(10);assert.equal(h.level.stage,'waiting');assert.equal(h.counts.form,0);
});

test('glass and closed recess reject maximum-speed bodies at ordinary and delayed steps',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness('host',{cinematics:false});approach(h);h.key('KeyR');h.key('KeyW');
  for(let i=0;i<180;i++){h.level.update(dt);assert(h.level.view.z+.22<=5.14+.001)}
  h.key('KeyW','keyup');h.key('KeyR','keyup');assert(h.level.view.z>4.84);
  h.moveTo(-3.2,4.8);assert(h.level.view.x>-3.3,'player can leave along the front of the mirror');
 }
});
