import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createAmtTouchPicker} from '../buergeramt-touch-target.js';

function fixture(width=390,height=844){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(69,width/height,.06,35),targets=[];
 const picker=createAmtTouchPicker({THREE:T,scene,camera});
 function add(id,x,y,z,w=.8,h=1.8){
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial());mesh.position.set(x,y,z);scene.add(mesh);
  const target={objects:[mesh],interaction:{actorId:id}};targets.push(target);return mesh;
 }
 const project=mesh=>{scene.updateMatrixWorld(true);const p=mesh.getWorldPosition(new T.Vector3()).project(camera);return[(p.x+1)*width/2,(1-p.y)*height/2]};
 return{scene,camera,targets,add,project,pick:(x,y)=>picker(x,y,width,height,targets)};
}
test('selection follows the tap instead of the central or nearest world target in portrait and landscape',()=>{
 for(const [width,height] of [[390,844],[844,390]]){
  const h=fixture(width,height);h.add('central',0,0,-2);const off=h.add('off-center',1,0,-4);
  assert.deepEqual(h.pick(...h.project(off)),{actorId:'off-center'});
 }
});
test('near misses select visible bounds, distant empty space stays empty',()=>{
 const h=fixture();const actor=h.add('person',0,0,-4),[x,y]=h.project(actor);
 assert.deepEqual(h.pick(x+140,y),{actorId:'person'});assert.equal(h.pick(x,30),null);
});
test('hidden ancestors, off-screen and behind-camera targets cannot be selected',()=>{
 for(const invalid of ['hidden','parent','behind','offscreen']){
  const h=fixture(),actor=h.add('person',0,0,-4);
  if(invalid==='hidden')actor.visible=false;
  if(invalid==='parent'){const parent=new T.Group();parent.visible=false;h.scene.add(parent);parent.add(actor)}
  if(invalid==='behind')actor.position.z=4;
  if(invalid==='offscreen')actor.position.x=10;
  assert.equal(h.pick(195,422),null,invalid);
 }
});
test('opaque room geometry occludes targets while transparent glass permits them',()=>{
 const h=fixture();h.add('person',0,0,-4);
 const wall=new T.Mesh(new T.BoxGeometry(3,3,.1),new T.MeshBasicMaterial());wall.position.z=-2;h.scene.add(wall);
 assert.equal(h.pick(195,422),null);
 wall.material.transparent=true;wall.material.opacity=.3;assert.deepEqual(h.pick(195,422),{actorId:'person'});
});
test('nearer overlapping people own the tap, regardless of candidate iteration order or layer',()=>{
 const h=fixture();h.add('far',0,0,-5);const near=h.add('near',0,0,-3);near.layers.set(1);
 assert.deepEqual(h.pick(195,422),{actorId:'near'});h.targets.reverse();assert.deepEqual(h.pick(195,422),{actorId:'near'});
});
test('a partially visible target remains selectable, and a rear-facing exhibit does not',()=>{
 const h=fixture();const actor=h.add('person',0,0,-4);
 const wall=new T.Mesh(new T.BoxGeometry(.45,3,.1),new T.MeshBasicMaterial());wall.position.set(-.2,0,-2);h.scene.add(wall);
 assert.deepEqual(h.pick(195,422),{actorId:'person'});
 wall.visible=false;actor.rotation.y=Math.PI;assert.equal(h.pick(195,422),null);
});
test('counter and exhibit semantic identities survive picking without changing geometry',()=>{
 const h=fixture();const mesh=h.add('counter',0,0,-4);h.targets[0].interaction={desk:3};
 assert.deepEqual(h.pick(195,422),{desk:3});h.targets[0].interaction={mirror:true};assert.deepEqual(h.pick(195,422),{mirror:true});
 assert.deepEqual(mesh.position.toArray(),[0,0,-4]);
});
test('transparent atlas pixels do not select or hide a visible person behind the paint plane',()=>{
 for(const alphas of [[0,0,0],[255,0,255]]){
  const h=fixture();const front=h.add('front',0,0,-3);h.add('back',0,0,-5);
  const pixels=new Uint8Array(alphas.flatMap(alpha=>[255,255,255,alpha]));
  front.material.map=new T.DataTexture(pixels,3,1);front.material.transparent=true;front.material.alphaTest=.035;
  assert.deepEqual(h.pick(195,422),{actorId:'back'});
 }
});
test('only a confirmed visible replacement keeps its zero-opacity paint proxy eligible',()=>{
 const h=fixture();const actor=h.add('person',0,0,-4);actor.material.opacity=0;
 assert.equal(h.pick(195,422),null);h.targets[0].renderedProxy=true;assert.deepEqual(h.pick(195,422),{actorId:'person'});
 h.targets[0].renderedProxy=false;assert.equal(h.pick(195,422),null);
});
test('the private reflected-body layer cannot intercept scene interaction rays',()=>{
 const h=fixture();h.add('person',0,0,-4);
 const proxy=new T.Mesh(new T.BoxGeometry(2,2,.1),new T.MeshBasicMaterial());proxy.position.z=-2;proxy.layers.set(2);h.scene.add(proxy);
 assert.deepEqual(h.pick(195,422),{actorId:'person'});
});
test('a narrow visible edge within tap tolerance survives a nearly complete opaque obstruction',()=>{
 const h=fixture();h.add('person',0,0,-4);
 const wall=new T.Mesh(new T.PlaneGeometry(.39,3),new T.MeshBasicMaterial());wall.position.set(-.005,0,-2);h.scene.add(wall);
 assert.deepEqual(h.pick(195,422),{actorId:'person'});
});
