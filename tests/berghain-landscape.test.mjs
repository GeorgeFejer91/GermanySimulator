import test from 'node:test';
import assert from 'node:assert/strict';
import {addLandscape, landscapeMaterials} from '../assets/models/berghain/landscape.mjs';
import {calibrateStudy, studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand, moveVisitor} from '../berghain/navigation.mjs';
import {layout as integratedLayout} from '../assets/models/berghain/layout.mjs';

test('a visitor cannot occupy the opaque garden shrubs that collapse the follow camera', () => {
  assert.equal(canStand({x:35,y:.05,z:18},integratedLayout),false);
});

function site() {
  const layout = {parts: [{name: 'garden bar'}, {name: 'queue post'}],
    solids: [{name: 'garden bar'}, {name: 'queue rail'}],
    floors: [{name: 'forecourt', x: [-65, 65], z: [-65, 65], y: 0},
      {name: 'garden', x: [22.5, 49], z: [-19, 22], y: .05}]};
  addLandscape(layout);
  calibrateStudy(layout, {});
  return layout;
}

test('landscape replaces sparse legacy site pieces and keeps source uncertainty explicit', () => {
  const layout = site();
  assert.ok(layout.parts.length > 250, 'site needs articulated pavement, planting and service details');
  assert.ok(layout.parts.some(part => part.name === 'tree crown' && part.shape === 'sphere'));
  assert.ok(layout.parts.some(part => part.name === 'east garden wire-mesh fence'));
  assert.ok(layout.parts.some(part => part.name === 'entrance cobble'));
  assert.ok(!layout.parts.some(part => ['garden bar', 'queue post'].includes(part.name)));
  assert.ok(!layout.solids.some(solid => ['garden bar', 'queue rail'].includes(solid.name)));
  assert.match(layout.landscape.confidence, /inferred/);
  assert.ok(layout.landscape.sources.includes('P07') && layout.landscape.sources.includes('I01'));
  assert.ok(landscapeMaterials.leafDark && landscapeMaterials.meshScreen.transparent);
});

test('front entrance and garden gate remain clear for the complete walking visitor', () => {
  const layout = site();
  for (const [x, z0, z1, y] of [[0, 45, 24, 0], [29, 24, 15, .05]]) {
    for (let z = z0; z >= z1; z -= .25) {
      const point = studyToSite({x, y, z});
      assert.ok(canStand(point, layout), `blocked route x=${x}, z=${z}`);
    }
  }
  let position = studyToSite({x: 29, y: .05, z: 24});
  for (let i = 0; i < 90; i++) position = moveVisitor(position, {x: 0, z: -.1}, layout);
  assert.ok(position.z < studyToSite({x: 29, y: .05, z: 15}).z + .5, 'visitor reaches garden viewpoint');
});

test('visible ground furniture and trunks have calibrated collision bodies', () => {
  const layout = site();
  for (const name of ['tree trunk', 'garden bench seat', 'garden service counter', 'east garden wire-mesh fence']) {
    const solid = layout.solids.find(item => item.name === name);
    assert.ok(solid?.renderPart?.matrix, `${name} must render and collide`);
    assert.ok(solid.x[1] > solid.x[0] && solid.z[1] > solid.z[0]);
    assert.ok(solid.y[1] > solid.y[0]);
  }
  assert.equal(canStand(studyToSite({x: 35, y: .05, z: -13}), layout), false, 'visitor cannot walk through trunk');
  assert.equal(canStand(studyToSite({x: 38, y: .05, z: 8}), layout), false, 'visitor cannot walk through bench');
});

test('visible queue rails preserve the established lane and perimeter uprights collide', () => {
  const layout = site();
  for (const x of [-12, -6, 6, 12]) {
    const rail = layout.solids.find(solid => solid.name === 'queue barrier rail' &&
      Math.abs(solid.renderPart.center[0] - studyToSite({x, y: .8, z: 31.5}).x) < .01);
    assert.ok(rail?.renderPart?.matrix, `visible solid queue rail x=${x}`);
    assert.equal(canStand(studyToSite({x, y: 0, z: 30}), layout), false, `queue lane x=${x}`);
  }
  for (const name of ['garden gateway upright', 'service canopy upright']) {
    const posts = layout.solids.filter(solid => solid.name === name);
    assert.equal(posts.length, 2, `${name} has two visible collision bodies`);
    assert.ok(posts.every(solid => solid.renderPart?.matrix));
  }
  assert.match(layout.landscape.softPlanting, /nonblocking/);
  assert.equal(canStand(studyToSite({x: -6, y: 0, z: 30}), integratedLayout), false,
    'integrated viewer keeps legacy queue collision contract');
});

test('perimeter screening trunks stay clear of official annex ground footprints', () => {
  const layout = site();
  const annexes = layout.solids.filter(solid => solid.name.startsWith('unmodelled official annex'));
  for (const trunk of layout.solids.filter(solid => solid.name === 'tree trunk')) {
    for (const annex of annexes) {
      const overlapX = trunk.x[0] < annex.x[1] && trunk.x[1] > annex.x[0];
      const overlapZ = trunk.z[0] < annex.z[1] && trunk.z[1] > annex.z[0];
      assert.ok(!(overlapX && overlapZ), `tree trunk overlaps ${annex.name}`);
    }
  }
});

test('landscape uses the existing batched primitive renderer within its geometry allowance', () => {
  const layout = site();
  const triangleCost = {box: 12, beam: 12, cylinder: 48, sphere: 80};
  const triangles = layout.parts.reduce((sum, part) => sum + (triangleCost[part.shape] ?? 0), 0);
  const batches = new Set(layout.parts.map(part => [part.section, part.material, part.shape].join('/')));
  assert.ok(triangles < 25000, `landscape triangle estimate ${triangles}`);
  assert.ok(batches.size < 20, `landscape draw batches ${batches.size}`);
  assert.ok(layout.parts.every(part => ['box', 'beam', 'cylinder', 'sphere'].includes(part.shape)));
});
