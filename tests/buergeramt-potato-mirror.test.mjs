import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {potatoReflection,mirrorGlassVisible,prepareMirrorCamera,createPotatoMirror} from '../buergeramt-potato-mirror.js';
import {harness} from './amt-harness.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function approach(h){h.moveTo(0,4.8);h.moveTo(-5.65,4.8);h.faceToward(-5.65,5.36)}
function mirrorRenderer(){
 const viewport=new THREE.Vector4(0,0,1280,800),scissor=viewport.clone();
 return{target:null,autoClear:true,xr:{enabled:false},shadowMap:{autoUpdate:true},scissorTest:false,
  getDrawingBufferSize:v=>v.set(1280,800),getRenderTarget(){return this.target},setRenderTarget(t){this.target=t},getViewport:v=>v.copy(viewport),setViewport:v=>viewport.copy(v),getScissor:v=>v.copy(scissor),setScissor:v=>scissor.copy(v),getScissorTest(){return this.scissorTest},setScissorTest(v){this.scissorTest=v},clear(){}};
}
test('native preparation covers the owned reflection target and restores renderer state before awaiting',async()=>{
 const scene=new THREE.Scene(),mirror=harness().window.BuergeramtStory.potatoMirror,effect=createPotatoMirror({THREE,scene,mirror}),renderer=mirrorRenderer(),camera=new THREE.PerspectiveCamera(),root=new THREE.Mesh();
 const original=new THREE.WebGLRenderTarget(19,23);renderer.target=original;renderer.setViewport(new THREE.Vector4(2,3,17,18));renderer.setScissor(new THREE.Vector4(4,5,8,9));renderer.scissorTest=true;
 let release,calls=0;const gate=new Promise(resolve=>{release=resolve});
 renderer.compileAsync=(mesh,view,lights)=>{calls++;assert.equal(mesh,root);assert.equal(view,camera);assert.equal(lights,scene);assert.notEqual(renderer.target,original);assert.equal(renderer.target.texture.type,THREE.HalfFloatType);return gate};
 try{
  const pending=effect.prepare(renderer,root,camera,scene);assert.equal(calls,1);assert.equal(renderer.target,original);assert.equal(renderer.scissorTest,true);assert.deepEqual(renderer.getViewport(new THREE.Vector4()).toArray(),[2,3,17,18]);assert.deepEqual(renderer.getScissor(new THREE.Vector4()).toArray(),[4,5,8,9]);assert.equal(effect.inspect().reflection.frames,0);
  release();await pending;
  renderer.compileAsync=()=>{throw Error('compile failed')};assert.throws(()=>effect.prepare(renderer,root,camera,scene),/compile failed/);assert.equal(renderer.target,original);assert.equal(renderer.scissorTest,true);
 }finally{release();effect.dispose();original.dispose();root.geometry.dispose();root.material.dispose()}
});

test('the reflected-camera proxy stays at the real player position, including impossible and partial self-image views',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror;
 for(const [x,z,offset,pitch=0] of [[-5.65,3,0],[-5.65,-9,0],[0,0,0],[-7.2,0,0],[-6.8,3,0],[-5.65,3,.8],[-5.65,3,0,.72]]){
  const scene=new THREE.Scene(),effect=createPotatoMirror({THREE,scene,mirror}),camera=new THREE.PerspectiveCamera(69,1.6,.06,35);
  camera.position.set(x,1.68,z);camera.lookAt(mirror.x,1.68,mirror.z);camera.rotateY(offset);camera.rotateX(pitch);
  const yaw=Math.atan2(mirror.x-x,z-mirror.z)-offset;
  effect.update({x,z,yaw,walkedDistance:0});assert(effect.render(mirrorRenderer(),camera,()=>{},100),'visible glass still reflects the room');
  const rig=scene.getObjectByName('Reflected potato rig');
  assert.deepEqual(rig.position.toArray(),[x,0,z],'mirror must not move the player to fit its visible glass');
  const reflectedEye=new THREE.Vector3(...effect.inspect().reflection.camera),body=rig.localToWorld(new THREE.Vector3(0,1.03,0));
  const fraction=((mirror.z-.025)-reflectedEye.z)/(body.z-reflectedEye.z),glassPoint=reflectedEye.clone().lerp(body,fraction);
  assert(Math.abs(fraction-.5)<1e-12);assert(Math.abs(glassPoint.x-x)<1e-12,'self-image ray crosses the mirror at the actual player x');
  if(x===0||x===-7.2)assert(glassPoint.x<mirror.x-mirror.width/2||glassPoint.x>mirror.x+mirror.width/2,'side-on self-image ray misses the finite aperture');
  effect.dispose();
 }
});

test('mirror rendering preserves billboard Euler state and subsequent main facing across repeated frames',()=>{
 const source=readFileSync('world3d.js','utf8'),start=source.indexOf('    amtPotatoMirror.render(renderer,amtCamera,mirrorCamera=>{'),end=source.indexOf('    drawView(amtCamera);',start);
 assert(start>=0&&end>start);
 const actors=Array.from({length:3},(_,i)=>({id:'actor-'+i,mesh:new THREE.Mesh(new THREE.PlaneGeometry(1,2),new THREE.MeshBasicMaterial({opacity:.3+i*.2}))}));
 actors.forEach((a,i)=>{a.mesh.position.set(i-1,1,0);a.mesh.visible=i!==0});
 const camera=new THREE.PerspectiveCamera();camera.position.set(3,1,-5);
 let fail=false,draws=0;
 const context=vm.createContext({renderer:{},amtCamera:camera,amtCharacters:actors.slice(0,2),amtMoving:actors.slice(2),amtOmenSplat:null,
  amtGaussian:{inspect:()=>({actors:[{id:'actor-0',cloudVisible:true}]}),withReflectedView:(_,draw)=>draw()},
  amtPotatoMirror:{render:(_,__,draw)=>draw(camera)},drawView:()=>{
   draws++;for(const a of actors){const toward=new THREE.Vector3(camera.position.x-a.mesh.position.x,0,camera.position.z-a.mesh.position.z).normalize();assert(new THREE.Vector3(0,0,1).applyQuaternion(a.mesh.quaternion).distanceTo(toward)<1e-12)}
   assert.equal(actors[0].mesh.visible,true);assert.equal(actors[0].mesh.material.opacity,1);if(fail)throw Error('draw failed');
  }});
 for(const yaw of [2.8,-2.8,Math.PI/2+.001,-Math.PI/2-.001,.4])for(let frame=0;frame<4;frame++){
  actors.forEach(a=>{a.mesh.rotation.y=yaw;assert(new THREE.Vector3(0,0,1).applyQuaternion(a.mesh.quaternion).distanceTo(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)))<1e-12,'next main frame faces its camera')});
  const poses=actors.map(a=>[a.mesh.rotation.toArray(),a.mesh.visible,a.mesh.material.opacity]);
  fail=frame===3;if(fail)assert.throws(()=>vm.runInContext(source.slice(start,end),context),/draw failed/);else vm.runInContext(source.slice(start,end),context);
  actors.forEach((a,i)=>assert.deepEqual([a.mesh.rotation.toArray(),a.mesh.visible,a.mesh.material.opacity],poses[i],'mirror must restore the main pose exactly, including error path'));
 }
 assert.equal(draws,20);
});

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

test('live reflection clips the exterior and retains physical eye/body depth at near and far views',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror,scene=new THREE.Scene(),effect=createPotatoMirror({THREE,scene,mirror});
 const pane=scene.getObjectByName('Kartoffelspiegel').children.find(o=>o.material?.name==='Live silvered mirror');
 for(const x of [-7.2,-5.65,0,7.2])for(const z of [-9,-5,0,4.9]){
  const camera=new THREE.PerspectiveCamera(69,1.6,.06,35),reflected=new THREE.PerspectiveCamera();camera.position.set(x,1.68,z);camera.lookAt(mirror.x,1.68,mirror.z);
  prepareMirrorCamera({THREE,camera,reflected,mirror,pane,textureMatrix:new THREE.Matrix4()});
  assert(Math.abs(reflected.position.z-(2*(mirror.z-.025)-z))<1e-12);
  const exterior=new THREE.Vector4(mirror.x,1.68,mirror.z+1,1).applyMatrix4(reflected.matrixWorldInverse).applyMatrix4(reflected.projectionMatrix);
  assert(exterior.w<0||exterior.z<-exterior.w,'near clipping/camera rejects the exterior');
  effect.update({x,z,yaw:Math.PI,walkedDistance:0});assert.equal(effect.inspect().visible,true,'no distance disappearance');
  assert.deepEqual(scene.getObjectByName('Reflected potato rig').position.toArray(),[x,0,z]);
  if(x===mirror.x){const projected=new THREE.Vector3(x,1.03,z).project(reflected);assert(projected.z>=-1&&projected.z<=1,'aligned physical body retains valid near/far reflection depth without remapping')}
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

test('finite-glass capture includes partial views and rejects offscreen glass independently of self-image visibility',()=>{
 const mirror=harness().window.BuergeramtStory.potatoMirror;
 for(const aspect of [1.6,390/844,844/390]){
  const camera=new THREE.PerspectiveCamera(69,aspect,.06,35);camera.position.set(mirror.x,1.68,3);
  const visible=()=>{camera.updateMatrixWorld();return mirrorGlassVisible({THREE,frustum:new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),mirror})};
  camera.lookAt(mirror.x,1.68,mirror.z);assert(visible());
  camera.rotateY(Math.atan(Math.tan(69*Math.PI/360)*aspect)+.2);assert(visible(),'glass edge remains visible after the self-image leaves view');
  camera.lookAt(mirror.x,1.68,mirror.z);camera.rotateY(Math.PI);assert.equal(visible(),false);
 }
 const camera=new THREE.PerspectiveCamera(69,1.6,.06,35);camera.position.set(0,1.68,0);camera.lookAt(mirror.x,1.68,mirror.z);camera.updateMatrixWorld();
 assert(mirrorGlassVisible({THREE,frustum:new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),mirror}),'off-axis room reflection must continue when the self-image misses glass');
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
