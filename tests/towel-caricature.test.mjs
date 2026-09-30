import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createTowelPoseStyle, installTowelCaricature, towelCaricatureProfile,
  towelPropEmphasis, towelSkinTone} from '../towel-caricature.js';

// CPU contract tests, not a substitute for rendering the actual GLBs in WebGL.
class Vector {
  constructor(x = 1, y = 1, z = 1) {this.set(x, y, z);}
  set(x, y, z) {this.x = x; this.y = y; this.z = z; return this;}
  copy(v) {return this.set(v.x, v.y, v.z);}
  clone() {return new Vector(this.x, this.y, this.z);}
}
const coordinates = v => [v.x, v.y, v.z];
function rig() {
  const bones = ['head', 'chest', 'hand.L', 'handR', 'foot.L'].map(name =>
    ({name, isBone: true, scale: new Vector(), position: new Vector(2, 3, 4)}));
  const actor = {scale: new Vector(2, 2, 2), traverse(fn) {bones.forEach(fn);}};
  return {actor, bones};
}

for (const kind of ['man', 'woman']) {
  test(`${kind}: broader, compact proportions with immutable profiles`, () => {
    const profile = towelCaricatureProfile(kind);
    assert.ok(profile.body[0] > 1 && profile.body[1] < 1 && profile.body[2] > 1);
    assert.ok(profile.head >= 1.25 && profile.head <= 1.4);
    assert.ok(Object.isFrozen(profile) && Object.isFrozen(profile.body));
    assert.ok(Object.isFrozen(profile.chest));
  });
  test(`${kind}: paused frames never accumulate scale`, () => {
    const {actor, bones} = rig(), style = createTowelPoseStyle(actor, kind);
    style.setEnabled(true);
    const expectedRoot = coordinates(actor.scale), expectedHead = coordinates(bones[0].scale);
    for (let frame = 0; frame < 1000; frame++) {style.beforePose(); style.afterPose();}
    assert.deepEqual(coordinates(actor.scale), expectedRoot);
    assert.deepEqual(coordinates(bones[0].scale), expectedHead);
    assert.deepEqual(coordinates(bones[4].scale), [1, 1, 1]);
    for (const bone of bones) assert.deepEqual(coordinates(bone.position), [2, 3, 4]);
  });
  test(`${kind}: toggling restores the last animated scale, not an invented rest pose`, () => {
    const {actor, bones} = rig(), style = createTowelPoseStyle(actor, kind);
    style.setEnabled(true);
    style.beforePose();
    bones[0].scale.set(.98, 1.02, 1.01); // Simulate a sampled animation channel.
    style.afterPose();
    for (let i = 0; i < 100; i++) {style.setEnabled(false); style.setEnabled(true);}
    style.setEnabled(false);
    assert.deepEqual(coordinates(actor.scale), [2, 2, 2]);
    assert.deepEqual(coordinates(bones[0].scale), [.98, 1.02, 1.01]);
    style.beforePose(); style.afterPose();
    assert.deepEqual(coordinates(bones[0].scale), [.98, 1.02, 1.01]);
  });
}

test('unknown identities and rigs without a head fail explicitly', () => {
  assert.throws(() => towelCaricatureProfile('third-tourist'), RangeError);
  assert.throws(() => createTowelPoseStyle({scale: new Vector(), traverse() {}}, 'man'), /head bone/);
});

test('signature props are emphasized; sandal contact geometry is not reshaped', () => {
  assert.equal(towelPropEmphasis('Moustache_half'), 1.45);
  assert.equal(towelPropEmphasis('Sunglasses lens.001'), 1.13);
  assert.equal(towelPropEmphasis('Rolled reservation towel'), 1.12);
  assert.equal(towelPropEmphasis('Rolled_towel_end001'), 1.12);
  for (const name of ['Sandal sole L', 'Sandal sole R', 'Continuous human body, face and hands']) {
    assert.equal(towelPropEmphasis(name), 1);
  }
});

test('skin palette is bounded, ordered and deterministic across the full byte range', () => {
  let previous = -1;
  const tones = new Set();
  for (let value = 0; value <= 255; value++) {
    const tone = towelSkinTone(value, value, value);
    assert.ok(tone.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255));
    const brightness = tone.reduce((sum, channel) => sum + channel, 0);
    assert.ok(brightness >= previous);
    previous = brightness;
    tones.add(tone.join(','));
    assert.ok(Object.isFrozen(tone));
  }
  assert.equal(tones.size, 6);
});

// Minimal scene/material fixtures exercise ownership and restoration without a
// graphics context. They intentionally do not make claims about shader output.
class Resource {
  constructor(options = {}) {Object.assign(this, options); this.disposed = false;}
  dispose() {this.disposed = true;}
}
class Color {constructor(value) {this.value = value;} clone() {return new Color(this.value);}}
class Geometry extends Resource {
  constructor() {super(); this.center = new Vector(4, 5, 6); this.operations = [];}
  clone() {const result = new Geometry(); result.center.copy(this.center); return result;}
  computeBoundingBox() {this.boundingBox = {getCenter: out => out.copy(this.center)};}
  computeBoundingSphere() {}
  translate(x, y, z) {this.operations.push(['translate', x, y, z]);}
  scale(x, y, z) {this.operations.push(['scale', x, y, z]);}
}
const fakeThree = {DataTexture: Resource, MeshBasicMaterial: Resource, MeshToonMaterial: Resource,
  Color, Vector3: Vector, RedFormat: 1, NearestFilter: 2, BackSide: 3};

test('material and prop edits are reversible and never dispose borrowed GLB assets', () => {
  const {actor, bones} = rig();
  const originalMaterial = {name: 'brown hair', color: new Color(0x574332)};
  const originalGeometry = new Geometry();
  const mesh = {isMesh: true, name: 'Moustache half', geometry: originalGeometry,
    material: originalMaterial, frustumCulled: true};
  actor.traverse = fn => [...bones, mesh].forEach(fn);
  const style = installTowelCaricature(fakeThree, actor, 'man');
  const styledMaterial = mesh.material, styledGeometry = mesh.geometry;
  assert.notEqual(styledMaterial, originalMaterial);
  assert.notEqual(styledGeometry, originalGeometry);
  assert.equal(originalGeometry.operations.length, 0);
  assert.deepEqual(styledGeometry.operations, [
    ['translate', -4, -5, -6], ['scale', 1.45, 1.45, 1.45], ['translate', 4, 5, 6]
  ]);
  for (let i = 0; i < 30; i++) {
    style.setEnabled(false);
    assert.equal(mesh.material, originalMaterial);
    assert.equal(mesh.geometry, originalGeometry);
    assert.equal(mesh.frustumCulled, true);
    style.setEnabled(true);
    assert.equal(mesh.material, styledMaterial);
    assert.equal(mesh.geometry, styledGeometry);
  }
  style.dispose();
  assert.equal(mesh.material, originalMaterial);
  assert.equal(mesh.geometry, originalGeometry);
  assert.equal(originalGeometry.disposed, false);
  assert.equal(styledGeometry.disposed, true);
  assert.equal(styledMaterial.disposed, true);
  assert.deepEqual(coordinates(actor.scale), [2, 2, 2]);
});
