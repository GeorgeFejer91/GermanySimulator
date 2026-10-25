import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

test('the full visitor cannot cross the foyer balustrade between its main posts',()=>{
  const point=studyToSite({x:-11.1,y:6.65,z:9.4});
  const ahead=studyToSite({x:-11.1,y:6.65,z:10.4});
  const length=Math.hypot(ahead.x-point.x,ahead.z-point.z);
  const normal={x:(ahead.x-point.x)/length,z:(ahead.z-point.z)/length};
  const space={floors:[{x:[-100,100],z:[-100,100],y:6.65}],
    solids:layout.solids.filter(solid=>solid.balustrade==='foyer-gallery-west')};
  for(const offset of [-.21,0,.19]){
    const start={x:point.x+offset-normal.x*.75,y:6.65,z:point.z-normal.z*.75};
    assert.ok(canStand(start,space));
    const stopped=moveVisitor(start,{x:normal.x*1.5,z:normal.z*1.5},space);
    const crossing=(stopped.x-point.x-offset)*normal.x+(stopped.z-point.z)*normal.z;
    assert.ok(crossing<-.27,'Dense visible steel infill must stop the body on the approach side');
    assert.ok(canStand(stopped,space));
  }
});

test('each documented rail run has complete human-height infill with exact visible-part solids',()=>{
  assert.deepEqual(layout.balustrades.map(a=>a.id),['panorama-stair-left','panorama-stair-right','foyer-gallery-west'],
    'Main switchback and east return now use the photographed plate-sided guards');
  const cube=new THREE.BoxGeometry(1,1,1),point=new THREE.Vector3();
  try{
    for(const assembly of layout.balustrades){
      assert.ok(assembly.sources.length&&/estimated/i.test(assembly.confidence));
      const parts=layout.parts.filter(part=>part.balustrade===assembly.id&&part.role==='picket');
      assert.ok(parts.length>10,'Infill must fill a run rather than add an isolated decorative bar');
      for(const part of parts){
        const solid=layout.solids.find(s=>s.renderPart===part);
        assert.ok(solid,'Every visible vertical bar needs matching collision');
        const matrix=new THREE.Matrix4().fromArray(part.matrix);
        for(let i=0;i<cube.attributes.position.count;i++){
          point.fromBufferAttribute(cube.attributes.position,i).applyMatrix4(matrix);
          for(const [axis,key]of ['x','y','z'].entries())assert.ok(point.getComponent(axis)>=solid[key][0]-.000001&&point.getComponent(axis)<=solid[key][1]+.000001);
        }
        assert.ok(part.size[1]>.9&&part.size[1]<1.05,'Post-calibration vertical bars must retain human-scale height');
      }
      const tops=layout.parts.filter(part=>part.balustrade===assembly.id&&part.role==='handrail');
      assert.equal(tops.length,1);
      assert.ok(Math.abs(tops[0].start[1]-assembly.start[1]-1.08)<.00001);
      assert.ok(Math.abs(tops[0].end[1]-assembly.end[1]-1.08)<.00001,'Upper Panorama guard must not be shortened by roof calibration');
    }
  }finally{cube.dispose();}
});

test('continuous stair-centre ascent/descent and clear ground beneath the upper flight remain legal',()=>{
  assert.equal(canStand(studyToSite({x:8,y:.05,z:11}),layout),true);
  const route=layout.architecturalCirculation.mainStair.siteRoute;
  let p={...route[0]};
  for(const target of [...route.slice(1),...route.toReversed().slice(1)]){
    const steps=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.06),dx=(target.x-p.x)/steps,dz=(target.z-p.z)/steps;
    for(let i=0;i<steps;i++){p=moveVisitor(p,{x:dx,z:dz},layout);assert.ok(canStand(p,layout));}
    assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.03&&Math.abs(p.y-target.y)<.03,'Folded main stair reaches every landing');
  }
  const upperRoute=layout.panoramaRegistration.stairRoute;
  let position={...upperRoute[0]};
  for(const target of [...upperRoute.slice(1),...upperRoute.toReversed().slice(1)]){
    const n=Math.ceil(Math.hypot(target.x-position.x,target.z-position.z)/.04),dx=(target.x-position.x)/n,dz=(target.z-position.z)/n;
    for(let i=0;i<n;i++)position=moveVisitor(position,{x:dx,z:dz},layout);
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.06&&Math.abs(position.y-target.y)<.06,'Relocated Panorama stair and landing stay continuously accessible');
  }
});

test('portable GLB contains the same original-balustrade assemblies as the editable model',()=>{
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  assert.equal(gltf.nodes[0].extras.balustrades?.length,3,'The shipped native asset must retain the three unchanged original assemblies');
  assert.deepEqual(gltf.nodes[0].extras.balustrades,layout.balustrades);
  assert.deepEqual(gltf.nodes[0].extras.architecturalCirculation,layout.architecturalCirculation,'Native export includes new circulation and uncertainty metadata');
});

test('Gallery-guard first-person camera keeps the eye inside the legal body through turns',async()=>{
 const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
 const walk=createWalkthrough(),camera=new THREE.PerspectiveCamera(60,1.5,.08,500),direction=new THREE.Vector3();
 try{
  for(const position of [8.8,8.9,9.0,9.03].map(z=>studyToSite({x:-2,y:6.65,z}))){
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
