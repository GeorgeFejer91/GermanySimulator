import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {createWalkthrough} from '../berghain/walkthrough.mjs';

const boundsOf=part=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5))
  .applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
const partsFor=id=>layout.parts.filter(p=>p.fixture===id);

test('Säule has grounded massive concrete bodies and actual flared capitals below the retained upper floor',()=>{
  assert.ok(layout.saule?.sources.includes('A15'),'Use the inspected architect concrete installations');
  const piers=layout.fixtures.filter(f=>f.id.startsWith('saule-pier-'));
  assert.equal(piers.length,6);
  const model=createBerghainModel();
  try{
    for(const pier of piers){
      const parts=partsFor(pier.id),body=parts.find(p=>p.role==='pier body'),cap=parts.find(p=>p.role==='flared capital');
      assert.ok(body&&cap);
      assert.ok(body.size[0]>1.2&&body.size[2]>1.5,'Photographed heavy concrete masses must replace the pencil-like lower silhouette');
      const b=boundsOf(body),c=boundsOf(cap);
      assert.ok(Math.abs(b.min.y-.05)<1e-6&&Math.abs(c.min.y-b.max.y)<1e-6,'Body stands on the floor and meets the capital');
      assert.ok(Math.abs(c.max.y-6.25)<1e-6,'Capital meets the existing upper-floor underside');
      const mesh=model.getObjectByName([cap.section,cap.material,cap.shape].join('/'));
      const vertices=mesh.geometry.attributes.position;
      const top=[],bottom=[];
      for(let i=0;i<vertices.count;i++)(vertices.getY(i)>0?top:bottom).push(Math.abs(vertices.getX(i)));
      assert.ok(Math.max(...top)>Math.max(...bottom)*1.3,'Actual capital geometry must flare, rather than relying on its box bounds');
      assert.equal(canStand({x:body.center[0],y:.05,z:body.center[2]},layout),false);
      for(const p of parts){
        const solid=layout.solids.find(s=>s.renderPart===p);
        assert.ok(solid,'Every visible Säule installation component retains fitted physical coverage');
        const instance=model.getObjectByName([p.section,p.material,p.shape].join('/'));
        for(let i=0;i<instance.geometry.attributes.position.count;i++){
          const v=new THREE.Vector3().fromBufferAttribute(instance.geometry.attributes.position,i).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
          assert.ok(v.x>=solid.x[0]-1e-6&&v.x<=solid.x[1]+1e-6&&v.y>=solid.y[0]-1e-6&&v.y<=solid.y[1]+1e-6&&v.z>=solid.z[0]-1e-6&&v.z<=solid.z[1]+1e-6);
        }
      }
    }
  }finally{disposeBerghainModel(model);}
});

test('continuous metal belts enclose the piers and padded concrete seats have actual support',()=>{
  assert.ok(layout.saule?.sources.includes('I24'),'The custom luminaire installer owns the belt evidence');
  for(const id of layout.fixtures.filter(f=>f.id.startsWith('saule-pier-')).map(f=>f.id)){
    const parts=partsFor(id),body=parts.find(p=>p.role==='pier body');
    const belt=parts.filter(p=>p.role==='belt housing'),lenses=parts.filter(p=>p.role==='recessed lens');
    assert.equal(belt.length,4);assert.equal(lenses.length,8);
    for(const p of belt){
      const contact=boundsOf(body).intersect(boundsOf(p));
      assert.ok(!contact.isEmpty(),'Belt channel must connect to the concrete');
    }
    for(const seat of parts.filter(p=>p.role==='seat cushion')){
      const base=parts.find(p=>p.role==='seat plinth'),a=boundsOf(base),b=boundsOf(seat);
      assert.ok(Math.abs(a.min.y-.05)<1e-6&&Math.abs(a.max.y-b.min.y)<1e-6,'Cushion sits on grounded concrete');
      assert.ok(a.min.x<=b.min.x&&a.max.x>=b.max.x&&a.min.z<=b.min.z&&a.max.z>=b.max.z);
    }
  }
  assert.equal(layout.parts.filter(p=>p.role==='seat cushion'&&p.fixture?.startsWith('saule-pier-')).length,4);
  assert.equal(layout.parts.filter(p=>p.name==='Säule column light').length,3,'Only the unreconstructed outer row retains its historical placeholder');
});

test('the full body can pass the concrete installations and return to the Lab connection and main stair',()=>{
  assert.ok(layout.saule,'The new physical structure must be present for this route check');
  const targets=[[5,15],[5.7,15],[5.7,4],[5,4],[5,-14],[5,4],[2,2.6],[-5.2,2.6],[2,2.6],[5,4],[5.7,4],[5.7,15],[5,15]];
  let position=studyToSite({x:5,y:.05,z:15});assert.ok(canStand(position,layout));
  for(const [x,z]of targets.slice(1)){
    const target=studyToSite({x,y:.05,z}),dx=target.x-position.x,dz=target.z-position.z,steps=Math.ceil(Math.hypot(dx,dz)/.04);
    for(let i=0;i<steps;i++){position=moveVisitor(position,{x:dx/steps,z:dz/steps},layout);assert.ok(canStand(position,layout));}
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.02,'Continuous body-clear motion must reach the intended waypoint');
  }
});

test('Säule-pier first-person camera keeps the eye inside the legal body through turns',async()=>{
 const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
 const walk=createWalkthrough(),camera=new THREE.PerspectiveCamera(60,1.5,.08,500),direction=new THREE.Vector3();
 try{
  for(const position of layout.fixtures.filter(f=>/^saule-pier-/.test(f.id)).map(f=>({x:f.anchor[0]-2,y:.05,z:f.anchor[2]+1.65}))){
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
