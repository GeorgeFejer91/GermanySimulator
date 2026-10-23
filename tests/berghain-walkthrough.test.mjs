import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {canStand,visitorRadius} from '../berghain/navigation.mjs';

test('avatar entrance requires proximity and traverses the actual doorway in both directions', async () => {
  const {createWalkthrough} = await import('../berghain/walkthrough.mjs');
  const walk = createWalkthrough();
  let position = {...walk.spawn};
  assert.equal(walk.interact(position), false, 'distant E must not enter');
  for (let i = 0; i < 32; i++) position = walk.step(position, {x: 0, z: -.15}, .05);
  assert.ok(position.z > 22.4 && position.z < 25, 'approach remains outdoors');
  assert.equal(walk.interact(position), true);
  assert.equal(walk.interact(position), false, 'duplicate action cannot restart travel');
  const entry = [];
  for (let i = 0; i < 80 && walk.travelling; i++) {
    const before = position;
    position = walk.step(position, {x: 0, z: 0}, .05);
    assert.ok(Math.hypot(position.x - before.x, position.z - before.z) <= .151, 'crossing must remain continuous');
    assert.ok(canStand(position, walk.space), 'full-body passage remains legal');
    entry.push({...position});
  }
  assert.ok(entry.some(p => p.z > 22) && entry.some(p => p.z < 22));
  assert.ok(position.z < 21 && Math.abs(position.y - .05) < .01);
  assert.equal(walk.travelling, false);
  assert.equal(walk.interact(position), true);
  for (let i = 0; i < 80 && walk.travelling; i++) position = walk.step(position, {x: 0, z: 0}, .05);
  assert.ok(position.z > 24 && canStand(position, layout));
  walk.dispose();
});

test('closed entrance blocks delayed movement and cancellation stops an automatic crossing', async () => {
  const {createWalkthrough} = await import('../berghain/walkthrough.mjs');
  const walk = createWalkthrough();
  let position = {x: 0, y: 0, z: 24.4};
  position = walk.step(position, {x: 0, z: -5}, .05);
  assert.ok(position.z > 22.4 && canStand(position, walk.space));
  assert.equal(walk.interact(position), true);
  position = walk.step(position, {x: 0, z: 0}, .05);
  walk.stop();
  const stopped = walk.step(position, {x: 0, z: 0}, .05);
  assert.deepEqual(stopped, position);
  assert.equal(walk.travelling, false);
  walk.dispose();
});

test('human avatar is adult-sized, grounded and idle joints stop when displacement stops', async () => {
  const {createVisitorAvatar} = await import('../assets/models/berghain/avatar.mjs');
  const avatar = createVisitorAvatar();
  const bounds = new THREE.Box3().setFromObject(avatar.group), size = bounds.getSize(new THREE.Vector3());
  assert.ok(size.y >= 1.75 && size.y <= 1.84, 'adult height in metres');
  assert.ok(bounds.min.y >= -.005 && bounds.min.y < .03, 'feet on ground');
  assert.ok(size.x <= .56, 'shoulders fit the existing body diameter');
  avatar.pose(.3, 0);
  assert.ok(avatar.joints.some(joint => Math.abs(joint.rotation.x) > .01));
  avatar.pose(0, 0);
  assert.ok(avatar.joints.every(joint => joint.rotation.x === 0), 'no walk-in-place animation');
  avatar.dispose();
});

test('third-person camera stays inside a closed entrance even when its centre ray fits between leaves', async () => {
  const {createWalkthrough} = await import('../berghain/walkthrough.mjs');
  const {createBerghainModel,disposeBerghainModel} = await import('../assets/models/berghain/model.mjs');
  const walk = createWalkthrough(), model = createBerghainModel(), camera = new THREE.PerspectiveCamera(45,1.5,.08,500);
  const inside = {x:0,y:.05,z:20.25};
  walk.step(inside,{x:0,z:0},0);
  const distance = walk.camera(camera,inside,0,0,model);
  assert.ok(distance > .65 && distance < 2.2, 'camera contracts on the actual door leaves');
  assert.ok(camera.position.z < 22.15, 'camera and avatar remain on the interior side');
  assert.equal(walk.avatar.group.visible,true);
  for(const aspect of [1280/650,390/570,844/170]) {
    camera.aspect=aspect; camera.updateProjectionMatrix(); walk.camera(camera,inside,0,0,model); camera.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(walk.avatar.group);
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const projected=new THREE.Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(projected.x)<.94&&Math.abs(projected.y)<.94,`complete avatar clipped at aspect ${aspect}: ${projected.toArray()}`);
    }
  }
  walk.dispose(); disposeBerghainModel(model);
});

test('the complete animated human stays inside the navigation body at every gait phase', async () => {
  const {createVisitorAvatar} = await import('../assets/models/berghain/avatar.mjs');
  const avatar = createVisitorAvatar(), point = new THREE.Vector3();
  let radius = 0, minimum = Infinity, maximum = -Infinity;
  for (let phase = 0; phase < 144; phase++) {
    avatar.pose(Math.PI / (4*144),0); avatar.group.updateMatrixWorld(true);
    avatar.group.traverse(mesh => {
      if(!mesh.isMesh)return;
      const positions=mesh.geometry.attributes.position;
      for(let i=0;i<positions.count;i++){
        point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
        radius=Math.max(radius,Math.hypot(point.x,point.z));
        minimum=Math.min(minimum,point.y); maximum=Math.max(maximum,point.y);
      }
    });
  }
  assert.ok(radius<=visitorRadius,`animated mesh radius ${radius} exceeds body ${visitorRadius}`);
  assert.ok(minimum>=-.005,`feet sink below ground: ${minimum}`);
  assert.ok(maximum<=1.801,`mesh exceeds 1.80m body height: ${maximum}`);
  avatar.dispose();
});
