import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {STREET_IDS, buildStreetCharacter, createStreetGLB} from '../assets/models/street-characters/models.js';
import {CLIP_NAMES, animationTracks, samplePose} from '../assets/models/street-characters/rig.js';
import {characterIdFor} from '../assets/models/street-characters/runtime.js';

const quaternionMultiply = (a, b) => [
  a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1], a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
  a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3], a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
function rotate(p, q) {
  const t = [2*(q[1]*p[2]-q[2]*p[1]), 2*(q[2]*p[0]-q[0]*p[2]), 2*(q[0]*p[1]-q[1]*p[0])];
  return [p[0]+q[3]*t[0]+q[1]*t[2]-q[2]*t[1], p[1]+q[3]*t[1]+q[2]*t[0]-q[0]*t[2], p[2]+q[3]*t[2]+q[0]*t[1]-q[1]*t[0]];
}
function transforms(model, pose) {
  const world = [];
  for (const bone of model.rig) {
    const local = pose[bone.name], parent = world[bone.parent];
    world.push(parent ? {rotation: quaternionMultiply(parent.rotation, local.rotation),
      position: rotate(local.translation, parent.rotation).map((v, i) => v + parent.position[i])}
      : {rotation: local.rotation, position: local.translation});
  }
  return world;
}
function unpack(bytes) {
  const view = new DataView(bytes);
  assert.equal(view.getUint32(0, true), 0x46546c67); assert.equal(view.getUint32(4, true), 2);
  assert.equal(view.getUint32(8, true), bytes.byteLength);
  const jsonLength = view.getUint32(12, true), binOffset = 28 + jsonLength;
  assert.equal(view.getUint32(16, true), 0x4e4f534a); assert.equal(view.getUint32(24 + jsonLength, true), 0x004e4942);
  const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, jsonLength)));
  assert.equal(gltf.buffers[0].byteLength, bytes.byteLength - binOffset);
  return gltf;
}

test('catalog and deterministic identity guards', () => {
  assert.equal(STREET_IDS.length, 8); assert.equal(new Set(STREET_IDS).size, 8);
  assert.throws(() => buildStreetCharacter('missing'), RangeError);
  assert.equal(characterIdFor({id: 'same', x: 0}), characterIdFor({id: 'same', x: 999}));
  assert.equal(characterIdFor({streetCharacterId: 'kehrwoche'}), 'kehrwoche');
});
for (const id of STREET_IDS) {
  const model = buildStreetCharacter(id);
  test(`${id}: geometry, skin, winding and budget`, () => {
    const count = model.joints.length;
    assert.ok(model.triangles > 2500 && model.triangles <= 6500);
    assert.equal(model.positions.length, count * 3); assert.equal(model.normals.length, count * 3); assert.equal(model.colors.length, count * 3);
    assert.equal(model.rig.length, 16); assert.equal(model.rig[0].parent, -1);
    model.rig.forEach((bone, i) => {assert.ok(bone.parent < i); assert.ok(bone.position.every(Number.isFinite));});
    assert.ok(model.joints.every(j => Number.isInteger(j) && j >= 0 && j < 16));
    assert.ok(model.indices.every(i => Number.isInteger(i) && i >= 0 && i < count));
    assert.ok(model.colors.every(c => Number.isFinite(c) && c >= 0 && c <= 1));
    assert.ok(Math.abs(model.bounds.min[1]) < 1e-6); assert.ok(model.dimensions[1] > 1.7 && model.dimensions[1] < 2.3);
    for (let i = 0; i < model.normals.length; i += 3) assert.ok(Math.abs(Math.hypot(...model.normals.slice(i, i + 3)) - 1) < 1e-5);
    for (let i = 0; i < model.indices.length; i += 3) {
      const [a,b,c] = model.indices.slice(i,i+3).map(n => model.positions.slice(n*3,n*3+3));
      const u=b.map((v,k)=>v-a[k]),v=c.map((n,k)=>n-a[k]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const n=model.normals.slice(model.indices[i]*3,model.indices[i]*3+3);
      assert.ok(normal.reduce((s,v,k)=>s+v*n[k],0)>0);
    }
  });
  test(`${id}: deterministic GLB and animation structure`, () => {
    const bytes = createStreetGLB(id), gltf = unpack(bytes);
    assert.ok(bytes.byteLength < 750000);
    const hash = b => createHash('sha256').update(new Uint8Array(b)).digest('hex');
    assert.equal(hash(bytes), hash(createStreetGLB(id)));
    assert.equal(gltf.meshes.length, 1); assert.equal(gltf.meshes[0].primitives.length, 1);
    assert.equal(gltf.skins[0].joints.length, 16); assert.deepEqual(gltf.animations.map(a => a.name), CLIP_NAMES);
    assert.equal(gltf.images, undefined); assert.equal(gltf.textures, undefined); assert.equal(gltf.extensionsRequired, undefined);
    for (const b of gltf.bufferViews) {assert.equal(b.byteOffset % 4, 0); assert.ok(b.byteOffset + b.byteLength <= gltf.buffers[0].byteLength);}
    for (const clip of CLIP_NAMES) for (const track of animationTracks(model, clip)) {
      assert.ok(track.values.every(Number.isFinite)); assert.equal(track.values.length, track.times.length * track.count);
      assert.deepEqual(track.values.slice(0, track.count), track.values.slice(-track.count));
      assert.ok(track.times.every((t,i)=>i===0||t>track.times[i-1]));
      if (track.path === 'rotation') for(let i=0;i<track.values.length;i+=4) assert.ok(Math.abs(Math.hypot(...track.values.slice(i,i+4))-1)<1e-6);
    }
  });
  test(`${id}: all four clips loop, remain in place and clear the floor`, () => {
    for (const clip of CLIP_NAMES) {
      assert.deepEqual(samplePose(model, clip, 0), samplePose(model, clip, 1));
      for (let frame = 0; frame <= 64; frame++) {
        const pose = samplePose(model, clip, frame / 64), world = transforms(model, pose);
        assert.deepEqual(pose.Root.translation, [0,0,0]);
        for (let i=0;i<model.joints.length;i++) {
          const joint=model.joints[i], bone=model.rig[joint], transform=world[joint];
          const relative=model.positions.slice(i*3,i*3+3).map((v,k)=>v-bone.position[k]);
          const p=rotate(relative,transform.rotation).map((v,k)=>v+transform.position[k]);
          assert.ok(p.every(Number.isFinite));
          assert.ok(p[1]>-.004, `${clip} frame ${frame}, ${bone.name}, y=${p[1]}`);
        }
      }
    }
  });
}
