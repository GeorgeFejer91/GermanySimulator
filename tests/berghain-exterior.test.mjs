import test from 'node:test';
import assert from 'node:assert/strict';
import {addExteriorDetails} from '../assets/models/berghain/exterior-details.mjs';
import {calibrateStudy, calibration} from '../assets/models/berghain/calibration.mjs';

test('the exterior study adds distinct Halle elevations and preserves the walking entrance', () => {
  const oldPipe = {name: 'rainwater downpipe', shape: 'beam', section: 'shell'};
  const unrelated = {name: 'existing facade', shape: 'box', section: 'shell'};
  const layout = {parts: [oldPipe, unrelated], solids: [], floors: []};
  addExteriorDetails(layout);

  assert.ok(layout.parts.includes(unrelated));
  assert.ok(!layout.parts.includes(oldPipe));
  assert.ok(layout.solids.length > 0, 'low projecting details have collision');
  assert.ok(layout.solids.every(solid => solid.renderPart && layout.parts.includes(solid.renderPart)));
  assert.ok(layout.parts.some(part => part.name === 'Halle rear blind panel'));
  assert.ok(layout.parts.some(part => part.name === 'Halle side pier'));
  assert.ok(layout.parts.some(part => part.name === 'Halle closed service door'));
  assert.ok(layout.parts.some(part => part.name === 'mineral runoff tail'));
  assert.equal(layout.exteriorDetails.omission.name, 'smoking-room bridge');
  assert.ok(layout.parts.every(part => part === unrelated || part.sources?.length && part.confidence));

  const blocksEntrance = part => part !== unrelated && part.shape === 'box' &&
    part.center[2] > 22.25 && part.center[0] - part.size[0] / 2 < 1.2 &&
    part.center[0] + part.size[0] / 2 > -1.2 &&
    part.center[1] - part.size[1] / 2 < 3.3 && part.center[1] + part.size[1] / 2 > .2;
  assert.ok(!layout.parts.some(blocksEntrance), 'the door and body-height approach stay visibly clear');
});

test('new roof edges remain below the surveyed roof planes after the shared transform', () => {
  const layout = {parts: [], solids: [], floors: []};
  addExteriorDetails(layout);
  const added = [...layout.parts];
  calibrateStudy(layout, {});

  for (const solid of layout.solids.filter(solid => solid.renderPart?.sources)) {
    const matrix = solid.renderPart.matrix;
    const halfHeight = (Math.abs(matrix[1]) + Math.abs(matrix[5]) + Math.abs(matrix[9])) / 2;
    assert.ok(Math.abs(solid.y[0] - (matrix[13] - halfHeight)) < 1e-5, solid.name + ' lower collision');
    assert.ok(Math.abs(solid.y[1] - (matrix[13] + halfHeight)) < 1e-5, solid.name + ' upper collision');
    assert.ok(solid.polygon?.length === 4, solid.name + ' follows the sheared wall');
  }

  for (const part of added) {
    const roof = part.name.startsWith('Halle') ? calibration.hallRoof : calibration.mainRoof;
    if (part.shape === 'beam') {
      assert.ok([...part.start, ...part.end].every(Number.isFinite), part.name + ' has finite site endpoints');
      assert.ok(Math.max(part.start[1], part.end[1]) + part.width / 2 < roof + .08,
        part.name + ' extends beyond its roof plane');
    } else {
      assert.ok(part.matrix?.every(Number.isFinite), part.name + ' has a finite site transform');
      const matrix = part.matrix;
      const halfHeight = (Math.abs(matrix[1]) + Math.abs(matrix[5]) + Math.abs(matrix[9])) / 2;
      assert.ok(matrix[13] + halfHeight < roof + .08, part.name + ' extends beyond its roof plane');
    }
  }
  assert.ok(layout.exteriorBounds.min.every(Number.isFinite));
  assert.ok(layout.exteriorBounds.max.every(Number.isFinite));
  assert.ok(added.length < 500, 'the envelope stays within a bounded instanced-geometry cost');
});
