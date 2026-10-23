import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';

test('official exterior preserves the identified cadastral building and LoD2 dimensions', async () => {
  const {survey} = await import('../assets/models/berghain/survey-data.mjs');
  const {createSurveyModel} = await import('../assets/models/berghain/survey-model.mjs');
  assert.equal(survey.buildingId, 'DEBE02YY200004SX');
  assert.equal(survey.licence, 'dl-de-zero-2.0');
  assert.equal(survey.parts.length, 4);
  assert.ok(Math.abs(survey.frontage - 37.9497434115) < .00001);
  assert.ok(Math.abs(survey.cadastralArea - 3432.10) < .01);
  const model = createSurveyModel();
  const bounds = new THREE.Box3().setFromObject(model);
  assert.ok(Math.abs(bounds.min.y) < .001);
  assert.ok(Math.abs(bounds.max.y - 22.803) < .002);
  assert.ok(bounds.min.x < -35.58 && bounds.max.x > 18.97, 'include both western annexes');
  assert.ok(bounds.min.z < -54.56 && Math.abs(bounds.max.z - 22) < .002);
  let vertices = 0, groundArea = 0;
  const worldMin = [Infinity, Infinity, Infinity], worldMax = [-Infinity, -Infinity, -Infinity];
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    const position = mesh.geometry.attributes.position, normal = mesh.geometry.attributes.normal;
    vertices += position.count;
    for (let i = 0; i < position.count; i++) {
      assert.ok(Number.isFinite(position.getX(i) + position.getY(i) + position.getZ(i)));
      assert.ok(Math.abs(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1) < .0001);
      const [ux, un] = survey.frame.xAxisEastNorth, [east, north, altitude] = survey.frame.origin;
      const x = position.getX(i), depth = survey.frame.frontZ - position.getZ(i);
      const world = [east + x * ux - depth * un, north + x * un + depth * ux, altitude + position.getY(i)];
      for (let axis = 0; axis < 3; axis++) {
        worldMin[axis] = Math.min(worldMin[axis], world[axis]);
        worldMax[axis] = Math.max(worldMax[axis], world[axis]);
      }
    }
    if (mesh.name === 'GroundSurface') for (let i = 0; i < position.count; i += 3) {
      const ax = position.getX(i), az = position.getZ(i), bx = position.getX(i + 1), bz = position.getZ(i + 1);
      groundArea += Math.abs((bx - ax) * (position.getZ(i + 2) - az) - (bz - az) * (position.getX(i + 2) - ax)) / 2;
    }
  });
  assert.ok(vertices > 100, 'real roof/wall/ground surfaces required');
  // Independent original EPSG:25833 source bounds, not derived from the local mesh.
  for (const [actual, expected] of [[worldMin, [394318.997, 5819009.577, 35.288]],
    [worldMax, [394393.933, 5819098.896, 58.091]]]) {
    for (let axis = 0; axis < 3; axis++) assert.ok(Math.abs(actual[axis] - expected[axis]) < .002);
  }
  assert.ok(Math.abs(groundArea - 3432.1) < .1, 'triangulation must preserve the cadastral footprint area');
});

test('walkable study uses official outer mass dimensions without scaling the visitor', async () => {
  const {layout} = await import('../assets/models/berghain/layout.mjs');
  const {createBerghainModel} = await import('../assets/models/berghain/model.mjs');
  const {visitorRadius, eyeHeight} = await import('../berghain/navigation.mjs');
  assert.equal(visitorRadius, .28); assert.equal(eyeHeight, 1.68);
  assert.ok(layout.calibration, 'the walking asset must consume the acquired exterior dimensions');
  const model = createBerghainModel();
  const roof = model.getObjectByName('roof');
  const bounds = new THREE.Box3().setFromObject(roof);
  assert.ok(Math.abs(bounds.max.y - 22.803) < .02, 'northern roof follows actual higher volume');
  assert.ok(bounds.min.z < -54.5, 'northern depth must no longer use the 22 m guess');
  assert.ok(Math.abs(layout.calibration.frontage - 37.9497434118) < .00001);
  assert.equal(model.children.filter(group => group.name.startsWith('official annex ')).length, 2);
  assert.ok(!layout.parts.some(part => part.name === 'roof plant'), 'unsupported rooftop box removed');
});
