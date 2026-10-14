import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createLevelDoor} from '../level-transitions.js';
import {buildingTransitionFrame,sampleEjectionCamera} from '../level-transition-effects.js';

test('entry consumes the surroundings before the destination and opens the door first',()=>{
  const opening=buildingTransitionFrame('enter',.21);
  assert.equal(opening.stage,'door');
  assert.ok(opening.doorOpen>0&&opening.doorOpen<1);
  assert.equal(opening.collapse,0);
  const middle=buildingTransitionFrame('enter',2);
  assert.equal(middle.stage,'collapse');
  assert.equal(middle.doorOpen,1);
  assert.ok(middle.collapse>0&&middle.collapse<.72,'building must remain until the surroundings finish');
  assert.equal(buildingTransitionFrame('enter',3.82).done,true);
});

test('forced exits pull the camera before reversing the vortex; voluntary exits are immediate',()=>{
  assert.equal(buildingTransitionFrame('eject',.5).stage,'pull');
  const reverse=buildingTransitionFrame('eject',2);
  assert.equal(reverse.stage,'rebuild');
  assert.ok(reverse.collapse>0&&reverse.collapse<1);
  assert.equal(buildingTransitionFrame('eject',4.73).done,true);
  assert.equal(buildingTransitionFrame('voluntary',0).done,true);
  for(const kind of ['enter','eject']){
    assert.equal(buildingTransitionFrame(kind,.24,true).done,true);
    assert.equal(buildingTransitionFrame(kind,0,true).fire,0);
    assert.equal(buildingTransitionFrame(kind,NaN).progress,0);
    let previous=0;
    for(let time=0;time<6;time+=.025){const frame=buildingTransitionFrame(kind,time);assert.ok(frame.progress>=previous&&frame.progress<=1);previous=frame.progress;}
  }
  assert.throws(()=>buildingTransitionFrame('teleport',0),RangeError);
});

test('doors have real hinged leaves, a dark aperture and idempotent restoration',()=>{
  const door=createLevelDoor(T,{width:1.4,height:2.4});
  const before=new T.Box3().setFromObject(door.group);
  assert.ok(before.max.y>=2.4);
  door.setOpen(1);
  assert.ok(door.inspect().leafAngles.every(angle=>Math.abs(angle)>1.4));
  assert.equal(door.inspect().open,1);
  assert.ok(new T.Box3().setFromObject(door.group).max.z>before.max.z+.5);
  door.setOpen(0);door.setOpen(0);
  assert.deepEqual(door.inspect().leafAngles,[0,0]);
  assert.ok(new T.Box3().setFromObject(door.group).equals(before));
  door.dispose();door.dispose();
});

test('the ejection arc starts at the actual view and crosses the original doorway',()=>{
  for(const yaw of [0,Math.PI/2,Math.PI,-2.6]){
    const source=new T.PerspectiveCamera(68,1.6,.03,100);
    source.position.set(3.2,1.68,-8.4);source.rotation.set(.4,yaw,0,'YXZ');
    const door=new T.Vector3(0,1.68,5.55),camera=source.clone();
    sampleEjectionCamera(T,camera,source,door,0);
    assert.ok(camera.position.distanceTo(source.position)<1e-10);
    assert.ok(camera.quaternion.angleTo(source.quaternion)<1e-7);
    let previous=camera.position.clone();
    for(let i=1;i<=60;i++){
      sampleEjectionCamera(T,camera,source,door,i/60);
      assert.ok([...camera.position,...camera.quaternion].every(Number.isFinite));
      assert.ok(camera.position.distanceTo(previous)<1.5,'continuous arc, no teleport before the portal');
      previous.copy(camera.position);
    }
    assert.ok(camera.position.z>door.z+.5);
    assert.ok(Math.abs(camera.position.x-door.x)<.001);
  }
});
