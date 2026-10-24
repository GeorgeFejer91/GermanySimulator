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
  assert.equal(layout.balustrades?.length,6,'Both original stairs and both foyer-gallery runs need infill');
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
  for(const [x,z0,z1,lower,upper]of [[8,20.5,9.4,.05,6.65],[-5,8.5,-5,6.65,13.25]]){
    const a=studyToSite({x,y:lower,z:z0+.6}),b=studyToSite({x,y:upper,z:z1-.6});
    let position={...a};
    const dx=b.x-a.x,dz=b.z-a.z,steps=Math.ceil(Math.hypot(dx,dz)/.08);
    for(let i=0;i<steps;i++)position=moveVisitor(position,{x:dx/steps,z:dz/steps},layout);
    assert.ok(position.y>=upper-.01&&canStand(position,layout),'Continuous original stair ascent must reach its upper landing');
    for(let i=0;i<steps;i++)position=moveVisitor(position,{x:-dx/steps,z:-dz/steps},layout);
    assert.ok(position.y<=lower+.01&&canStand(position,layout),'Continuous return must reach the lower landing');
  }
});

test('portable GLB contains the same original-balustrade assemblies as the editable model',()=>{
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  assert.equal(gltf.nodes[0].extras.balustrades?.length,6,'The shipped native asset must include the updated assemblies');
  assert.deepEqual(gltf.nodes[0].extras.balustrades,layout.balustrades);
});

test('a legal visitor beside an open gallery guard remains readable during camera turns',async()=>{
  const {createWalkthrough}=await import('../berghain/walkthrough.mjs');
  const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
  const walk=createWalkthrough(),model=createBerghainModel(),camera=new THREE.PerspectiveCamera(60,1.5,.08,500);
  try{
    for(const z of [8.8,8.9,9.0,9.03]){
      const position=studyToSite({x:-2,y:6.65,z});assert.ok(canStand(position,layout));
      walk.step(position,{x:0,z:0},0);
      for(let yaw=0;yaw<=Math.PI*2;yaw+=Math.PI/16){
        const distance=walk.camera(camera,position,yaw,0,model);
        assert.ok(distance>.65,`Guard at study z=${z}, yaw=${yaw} hides the visitor at ${distance}m`);
        assert.equal(walk.avatar.group.visible,true);
      }
      for(const aspect of [1280/650,390/570,844/170]){
        camera.aspect=aspect;camera.updateProjectionMatrix();walk.camera(camera,position,0,0,model);camera.updateMatrixWorld(true);
        const bounds=new THREE.Box3().setFromObject(walk.avatar.group);
        for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
          const projected=new THREE.Vector3(x,y,z).project(camera);
          assert.ok(Math.abs(projected.x)<.94&&Math.abs(projected.y)<.94,'The complete visitor stays in frame beside a guard');
        }
      }
      let previous;
      for(let yaw=-.3;yaw<=.3;yaw+=.02){
        walk.camera(camera,position,yaw,0,model);
        if(previous)assert.ok(camera.position.distanceTo(previous)<.2,'Small turns beside the guard must not jump through picket gaps');
        previous=camera.position.clone();
      }
    }
    const clear=studyToSite({x:-2,y:6.65,z:7.8});assert.ok(canStand(clear,layout));
    const distance=walk.camera(camera,clear,0,0,model);
    assert.ok(Math.abs(distance-4.2)<.0001,'A clear distant view retains its original camera radius');
    assert.ok(Math.abs(camera.position.y-clear.y-.95-Math.sin(.32)*4.2)<.0001,'A distant guard must not lift the camera');
    const below=studyToSite({x:-2,y:.05,z:8.9});assert.ok(canStand(below,layout));
    const belowDistance=walk.camera(camera,below,0,0,model);
    assert.ok(Math.abs((camera.position.y-below.y-.95)/belowDistance-Math.sin(.32))<.0001,'The same guard overhead must not lift a ground-floor camera');
  }finally{walk.dispose();disposeBerghainModel(model);}
});
