import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {admissionRoomAt} from '../assets/models/berghain/admission.mjs';

const site=(x,z,y=.05)=>studyToSite({x,y,z});
const route=[[0,29],[0,30],[-4.2,30],[-4.2,23.6],[-2.6,23.6],[-2.6,28.4],[-1.2,28.4],[-1.2,23.5],[0,23.5],[0,20.25],[-6.3,20.25],[-6.3,19],[-3.2,19],[-5.3,19],[-6.6,17.4],[-6.6,15.2],[-8.8,14.4],[-11,14.4]];

function follow(points,step){
  let position=site(...points[0]);
  assert.ok(canStand(position,layout));
  for(const point of points.slice(1)){
    const target=site(...point),distance=Math.hypot(target.x-position.x,target.z-position.z),count=Math.ceil(distance/step);
    const displacement={x:(target.x-position.x)/count,z:(target.z-position.z)/count};
    for(let i=0;i<count;i++){
      position=moveVisitor(position,displacement,layout);
      assert.ok(canStand(position,layout),'each accepted body is legal');
    }
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.025,`route blocked toward ${point}, actual ${JSON.stringify(position)}`);
  }
}

test('calibrated queue, check, cashier and curtain route reaches wardrobe and returns',()=>{
  assert.ok(layout.admission,'admission evidence and room must be present');
  for(const step of [.04,.16,.65]){follow(route,step);follow([...route].reverse(),step);}
});

test('new barriers, counters and enclosure are physical while their public paths stay clear',()=>{
  for(const [x,z] of [[-3.4,26],[-1.8,25],[-.6,26],[-7.8,20.3],[-7.8,18.7],[-3.1,18.15],[-8.7,19],[-5,16.4]])
    assert.equal(canStand(site(x,z),layout),false,`solid body ${x},${z}`);
  for(const name of ['queue tube','inspection counter body','cashier counter','admission west wall','ring structure base']){
    assert.ok(layout.solids.some(s=>s.admission&&s.name===name&&s.renderPart?.matrix),`${name}: calibrated visible body`);
  }
  assert.equal(canStand(site(-6,30),layout),false,'legacy queue collision retained');
  for(let z=29;z>19;z-=.15)assert.ok(canStand(site(0,z),layout),`direct entrance corridor ${z}`);
});

test('door registration clears the physical visitor and matches the real hinged-door traversal',async()=>{
  const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
  const walk=createWalkthrough();
  try{
    assert.deepEqual(layout.admission.door.center,{x:0,y:0,z:22.28});
    // The calibrated left queue rail occupies x=-.25 at this approach depth.
    for(const offset of [-.1,0,.25]){
      let p={x:offset,y:0,z:24.1};
      assert.ok(canStand(p,walk.space),'interaction starts outside every queue barrier');
      assert.ok(walk.interact(p));
      for(let i=0;i<120&&walk.travelling;i++){
        p=walk.step(p,{x:0,z:0},.04);
        assert.ok(canStand(p,walk.space),'the real open leaves and jambs cannot intersect the visitor');
      }
      assert.ok(Math.abs(p.x)<.02&&p.z<20.28,'automatic admission completes through the exact aperture');
      assert.ok(walk.interact(p));
      for(let i=0;i<120&&walk.travelling;i++)p=walk.step(p,{x:0,z:0},.04);
      assert.ok(p.z>24.8,'return traverses the same doorway');
    }
    for(const p of layout.parts.filter(p=>p.doorFrame&&p.name.includes('head'))){
      assert.ok(p.center[1]-p.size[1]/2>=2.45-1e-9,'full adult headroom');
    }
  }finally{walk.dispose();}
});

test('admission room classification and source confidence distinguish route evidence from estimates',()=>{
  for(const [x,z] of [[-5.7,20.15],[-3.2,19],[-6.6,17.4]])assert.equal(admissionRoomAt(site(x,z)),true);
  for(const [x,z] of [[0,20.25],[-6.6,15.2],[-1.2,28.4],[-15,15.7]])assert.equal(admissionRoomAt(site(x,z)),false);
  assert.equal(admissionRoomAt(site(-5.7,20.15,5.45)),false,'upper floor cannot inherit admission lights');
  assert.ok(layout.admission.interior.supported.includes('bag-check room left of entrance'));
  assert.ok(layout.admission.interior.estimated.includes('cashier orientation'));
  for(const p of layout.parts.filter(p=>p.admission)){
    assert.ok(p.sources.length&&/estimated/.test(p.confidence));
    if(p.zone==='interior')assert.deepEqual(p.sources,['ENT03','ENT04']);
  }
});

test('source geometry is instanced, bounded, and its collision uses the visible calibrated assemblies',()=>{
  const model=createBerghainModel();
  try{
    const group=model.getObjectByName('admission'),bounds=new THREE.Box3().setFromObject(group);
    assert.ok(group&&group.children.every(mesh=>mesh.isInstancedMesh));
    assert.deepEqual(model.userData.admission,layout.admission);
    assert.ok(bounds.min.y>=-.01&&bounds.max.y<6.3,'admission geometry stays on the ground floor and immediate forecourt');
    const boundary=[site(-16,16),site(16,30)];
    assert.ok(bounds.min.x>boundary[0].x&&bounds.max.x<boundary[1].x);
    assert.ok(bounds.min.z>boundary[0].z&&bounds.max.z<boundary[1].z);
    let triangles=0,instances=0;
    for(const mesh of group.children){
      triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*mesh.count;
      instances+=mesh.count;
      assert.ok(mesh.boundingBox&&mesh.boundingSphere,'culled batches have measured bounds');
    }
    assert.ok(instances<2200,`bounded primitive instances: ${instances}`);
    assert.ok(triangles<40000,`bounded submitted triangles: ${triangles}`);
    assert.ok(group.children.length<=35,`bounded draw groups: ${group.children.length}`);
    // Read the actual generated cylinder and box geometry rather than assuming
    // calibrated authored size is still aligned with its rendered axes.
    const matrix=new THREE.Matrix4();
    for(const name of ['queue tube','inspection counter body','cashier counter','admission west wall','ring structure base']){
      const solids=layout.solids.filter(s=>s.admission&&s.name===name);
      for(const solid of solids){
        const p=solid.renderPart,mesh=group.getObjectByName(['admission',p.material,p.shape].join('/'));
        const peers=layout.parts.filter(q=>q.section==='admission'&&q.material===p.material&&q.shape===p.shape);
        mesh.getMatrixAt(peers.indexOf(p),matrix);
        mesh.geometry.computeBoundingBox();
        const b=mesh.geometry.boundingBox.clone().applyMatrix4(matrix);
        for(const [min,max,axis] of [[b.min.x,b.max.x,'x'],[b.min.y,b.max.y,'y'],[b.min.z,b.max.z,'z']]){
          assert.ok(min>=solid[axis][0]-.002&&max<=solid[axis][1]+.002,`${name}: ${axis} rendered body covered by collision`);
          assert.ok(max-min>0);
        }
      }
    }
    const sheets=layout.parts.filter(p=>p.name==='parted plastic curtain strip');
    const middle=site(-6.6,16.4);
    for(const p of sheets){
      const b=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
      assert.ok(b.max.x<middle.x-.4||b.min.x>middle.x+.4,'visible curtain leaves a body-clear centre gap');
    }
  }finally{disposeBerghainModel(model);}
});
