import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import { registerStreetCharacterManifest, resolveStreetCharacter, createStreetCharacterSprite, advanceStreetAnimation } from '../street-character-sprites.js';

const manifest = JSON.parse(await readFile(new URL('../assets/characters/street/manifest.json', import.meta.url), 'utf8'));
const playerId = 'spieler-hans-peter-mustermann';
const sample = [64, 23];
const scale = 1.5 / 136;

function fixture(id = 'player-default') {
  registerStreetCharacterManifest(manifest);
  const actor = { id, x: 0, y: 0 };
  const host = new THREE.Group();
  host.position.set(2, 3, -4);
  host.rotation.y = 0.71;
  const camera = new THREE.PerspectiveCamera(48, 1280 / 800, 0.1, 150);
  camera.position.set(0, 11.5, 14);
  camera.lookAt(0, 1, -2.7);
  camera.updateMatrixWorld();
  const requests = [], jobs = [];
  const T = { ...THREE, TextureLoader: class { load(url, success, progress, fail) { requests.push({ url, success, fail }); } } };
  const queue = (position, radius, task, owner) => { const job = { task, owner, state: 'pending' }; jobs.push(job); return job; };
  const adapter = createStreetCharacterSprite(T, actor, host, queue, camera);
  return { actor, host, camera, requests, jobs, adapter };
}

async function finish(fixture) {
  const pending = fixture.jobs[0].task();
  for (let i = 0; i < 100 && !fixture.requests.length; i++) await new Promise(setImmediate);
  assert.equal(fixture.requests.length, 1);
  fixture.requests[0].success(new THREE.Texture({ width: 128, height: 160 }));
  assert.equal(await pending, true);
}

function nearVector(actual, expected) {
  assert.ok(actual.distanceTo(expected) < 1e-10, `expected ${expected.toArray()}, got ${actual.toArray()}`);
}

test('optional occlusion pixel metadata is finite, bounded, sparse-safe and leaves registry atomic', () => {
  registerStreetCharacterManifest(manifest);
  assert.deepEqual(manifest.characters[playerId].occlusionSamples[0], sample);
  assert.equal(manifest.characters[playerId].occlusionSamples.length, 12);
  for (const bad of [null, [], Array.from({ length: 17 }, () => [64, 23]), [[-1, 23]], [[128, 23]], [[64, 160]], [[NaN, 23]], [[Infinity, 23]], [[64]], [[64, 23, 1]], [new Array(2)]]) {
    const copy = structuredClone(manifest);
    copy.characters[playerId].occlusionSamples = bad;
    assert.throws(() => registerStreetCharacterManifest(copy), /occlusion sample/);
    assert.equal(resolveStreetCharacter({ id: 'player-default' }), playerId);
  }
});

test('occlusion targets follow displayed sprite matrix with head, torso and feet; no camera shortcut or new work', async () => {
  const f = fixture();
  try {
    assert.equal(f.adapter.occlusionTargets(), null);
    assert.equal(f.jobs.length, 1);
    await finish(f);
    const paint = f.host.children.find(child => child.userData.streetPaint);
    assert.ok(paint);
    const first = f.adapter.occlusionTargets();
    assert.equal(first.length, 12);
    const head = f.host.position.clone().add(new THREE.Vector3(0, (150 - 23) * scale, 0));
    const torso = f.host.position.clone().add(new THREE.Vector3(0, (150 - 72) * scale, 0));
    const foot = f.host.position.clone().add(new THREE.Vector3((48 - 64) * scale, (150 - 142) * scale, 0));
    nearVector(first[0], head);
    nearVector(first[3], torso);
    nearVector(first[10], foot);
    const before = first[0].clone(), footBefore = first[10].clone();
    f.camera.lookAt(10, 1, -2.7);
    f.camera.updateMatrixWorld();
    assert.strictEqual(f.adapter.occlusionTargets(), first);
    assert.strictEqual(first[0], f.adapter.occlusionTargets()[0]);
    nearVector(first[0], before);
    f.adapter.sync();
    nearVector(f.adapter.occlusionTargets()[0], before);
    assert.ok(first[10].distanceTo(footBefore) > 0.01, 'off-center samples rotate around the upright centerline');
    const yaw = new THREE.Euler().setFromQuaternion(f.camera.quaternion, 'YXZ').y;
    const upright = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    nearVector(first[10], f.host.position.clone().add(new THREE.Vector3((48 - 64) * scale, (150 - 142) * scale, 0).applyQuaternion(upright)));
    f.host.position.x += 1;
    nearVector(f.adapter.occlusionTargets()[0], before.clone().add(new THREE.Vector3(1, 0, 0)));
    const cue = advanceStreetAnimation(f.actor, 0, 0, { speechStatus: 'playing', cueToken: 'native-player', mediaTime: 0.4, mediaDuration: 2, mouthOpen: 0.7 });
    assert.equal(cue.cueToken, 'native-player');
    f.adapter.occlusionTargets();
    assert.equal(f.adapter.inspect().pose.cueToken, 'native-player');
    assert.equal(f.jobs.length, 1);
    assert.equal(f.requests.length, 1);
    f.host.visible = false;
    assert.equal(f.adapter.occlusionTargets(), null);
    f.host.visible = true;
    paint.visible = false;
    assert.equal(f.adapter.occlusionTargets(), null);
    paint.visible = true;
    assert.strictEqual(f.adapter.occlusionTargets(), first);
    f.adapter.dispose();
    assert.equal(f.adapter.occlusionTargets(), null);
  } finally { f.adapter.dispose(); }
});

test('standing character without approved silhouette anchors yields no occlusion targets', async () => {
  const f = fixture('city-ute-ruhe');
  try {
    await finish(f);
    assert.equal(f.adapter.inspect().stage, 'standing');
    assert.equal(f.adapter.occlusionTargets(), null);
    assert.equal(f.jobs.length, 1);
  } finally { f.adapter.dispose(); }
});
