import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildLevelPages, geheimPage} from '../tools/build-level-pages.mjs';

test('walking preserves full-body wall clearance even across a delayed frame', async () => {
  const moduleURL = new URL('../berghain/navigation.mjs', import.meta.url);
  assert.ok(existsSync(moduleURL), 'Berghain movement implementation is required');
  const {moveVisitor} = await import(moduleURL);
  const space = {floors: [{x: [-10, 10], z: [-10, 10], y: 0}],
    solids: [{x: [-.1, .1], z: [-5, 5], y: [0, 3]}]};
  const result = moveVisitor({x: -2, y: 0, z: 0}, {x: 4, z: 0}, space);
  assert.ok(result.x <= -.38 + .001, 'visitor must not tunnel through thin wall');
  const slide = moveVisitor(result, {x: 1, z: 1}, space);
  assert.ok(slide.z > .9 && slide.x <= -.38 + .001, 'wall contact must permit legal sliding');
});

test('stairs follow floor height and visitors cannot walk off upper floors', async () => {
  const moduleURL = new URL('../berghain/navigation.mjs', import.meta.url);
  assert.ok(existsSync(moduleURL), 'Berghain movement implementation is required');
  const {moveVisitor} = await import(moduleURL);
  const space = {solids: [], floors: [{x: [-2, 2], z: [0, 6], y: 0, endY: 3},
    {x: [-2, 2], z: [6, 9], y: 3}]};
  let position = {x: 0, y: 0, z: .5};
  position = moveVisitor(position, {x: 0, z: 7}, space);
  assert.ok(Math.abs(position.y - 3) < .01);
  const edge = moveVisitor(position, {x: 5, z: 0}, space);
  assert.ok(edge.x <= 1.72 + .001 && edge.y === 3);
});

test('calibrated polygon walls block the body without filling their bounding box', async () => {
  const {canStand, moveVisitor} = await import('../berghain/navigation.mjs');
  const space = {floors: [{x: [-10, 10], z: [-10, 10], y: 0}], solids: [{x: [-1.1, 1.1], z: [-5, 5], y: [0, 3],
    polygon: [[-1.1, -5], [-.9, -5], [1.1, 5], [.9, 5]]}]};
  assert.ok(canStand({x: .8, y: 0, z: -4}, space), 'empty portion of AABB stays traversable');
  const stopped = moveVisitor({x: -3, y: 0, z: 0}, {x: 6, z: 0}, space);
  assert.ok(stopped.x < -.38 && canStand(stopped, space), 'delayed motion cannot cross a sheared wall');
  const ledge = {solids: [], floors: [{x: [-2, 2], z: [-5, 0], y: 0}, {x: [-2, 2], z: [0, 5], y: .5}]};
  const before = moveVisitor({x: 0, y: 0, z: -1}, {x: 0, z: 3}, ledge);
  assert.ok(before.z < 0 && before.y === 0, 'ramp footprint allowance must not increase maximum step height');
});

test('every room viewpoint is on a legal floor and outside full-body solids', async () => {
  const layoutURL = new URL('../assets/models/berghain/layout.mjs', import.meta.url);
  assert.ok(existsSync(layoutURL), 'Reference-tagged layout is required');
  const {layout, viewpoints} = await import(layoutURL);
  const {canStand} = await import('../berghain/navigation.mjs');
  for (const [name, view] of Object.entries(viewpoints)) {
    assert.ok(canStand(view.position, layout), 'blocked viewpoint: ' + name);
    assert.ok(view.confidence && view.sources.length, 'missing evidence for ' + name);
  }
});

test('calibrated solid height bounds match their actual rendered box matrices', async () => {
  const {layout} = await import('../assets/models/berghain/layout.mjs');
  for (const solid of layout.solids.filter(solid => solid.renderPart)) {
    const matrix = solid.renderPart.matrix;
    const radius = (Math.abs(matrix[1]) + Math.abs(matrix[5]) + Math.abs(matrix[9])) / 2;
    assert.ok(Math.abs(solid.y[0] - (matrix[13] - radius)) < .00001, solid.name + ' lower bound');
    assert.ok(Math.abs(solid.y[1] - (matrix[13] + radius)) < .00001, solid.name + ' upper bound');
  }
});

test('stair undersides and floor slabs block the visitor body', async () => {
  const {layout} = await import('../assets/models/berghain/layout.mjs');
  const {canStand} = await import('../berghain/navigation.mjs');
  const {studyToSite} = await import('../assets/models/berghain/calibration.mjs');
  assert.equal(canStand(studyToSite({x: 8, y: .05, z: 18.5}), layout), false, 'low stair underside must block head penetration');
  assert.equal(canStand(studyToSite({x: 8, y: .05, z: 11}), layout), true, 'full-height clearance beneath upper flight should remain available');
  const halleUndersides=layout.halle.stairs.flatMap(stair=>[.25,.3].map(t=>({
    x:stair.axis[0][0]+(stair.axis[1][0]-stair.axis[0][0])*t,y:.05,
    z:stair.axis[0][1]+(stair.axis[1][1]-stair.axis[0][1])*t})));
  for (const point of [{x: 6.831869, y: .05, z: 17.937928}, {x: -4.505546, y: 6.65, z: 7.223457},...halleUndersides]) {
    assert.equal(canStand(point, layout), false, 'full cylinder must not pass through a tread underside: ' + JSON.stringify(point));
  }
});

test('main, Panorama and both Halle stairs connect both landings continuously in both directions', async () => {
  const {layout} = await import('../assets/models/berghain/layout.mjs');
  const {canStand, moveVisitor} = await import('../berghain/navigation.mjs');
  for (const name of ['main stair', 'Panorama stair']) {
    const ramp = layout.floors.find(floor => floor.name === name);
    const x = (ramp.x[0] + ramp.x[1]) / 2, z = ramp.z[1] - .5;
    let position = {x, z, y: ramp.y + (ramp.endY - ramp.y) * (z - ramp.z[0]) / (ramp.z[1] - ramp.z[0])};
    assert.ok(canStand(position, layout), name + ' start');
    const routeSteps = Math.ceil((ramp.z[1] - ramp.z[0] + 1) / .1);
    for (let i = 0; i < routeSteps; i++) {
      position = moveVisitor(position, {x: 0, z: -.1}, layout);
      assert.ok(canStand(position, layout), name + ' uphill body');
    }
    assert.ok(position.z < ramp.z[0] - .3, name + ' must reach upper landing');
    assert.ok(Math.abs(position.y - ramp.y) < .01, name + ' upper height');
    for (let i = 0; i < routeSteps + 15; i++) {
      position = moveVisitor(position, {x: 0, z: .1}, layout);
      assert.ok(canStand(position, layout), name + ' downhill body');
    }
    assert.ok(position.z > ramp.z[1] + .3, name + ' must reach lower landing');
    assert.ok(Math.abs(position.y - ramp.endY) < .01, name + ' lower height');
  }
  for(const stair of layout.halle.stairs){
    let position={...stair.lowerApproach};assert.ok(canStand(position,layout));
    for(const target of [stair.upperApproach,stair.lowerApproach]){
      const dx=target.x-position.x,dz=target.z-position.z,count=Math.ceil(Math.hypot(dx,dz)/.1);
      for(let i=0;i<count;i++){
        position=moveVisitor(position,{x:dx/count,z:dz/count},layout);
        assert.ok(canStand(position,layout),stair.name+' complete-body route');
      }
      assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.02,stair.name+' landing');
      assert.ok(Math.abs(position.y-target.y)<.01,stair.name+' landing height');
    }
  }
});

test('an overlapping start recovers locally and visible queue rails block walking', async () => {
  const {moveVisitor, canStand} = await import('../berghain/navigation.mjs');
  const space = {floors: [{x: [-10, 10], z: [-10, 10], y: 0}], solids: [{x: [-.1, .1], z: [-5, 5], y: [0, 3]}]};
  const recovered = moveVisitor({x: 0, y: 0, z: 0}, {x: 1, z: 0}, space);
  assert.ok(canStand(recovered, space), 'invalid spawn must resolve outside wall');
  const {layout} = await import('../assets/models/berghain/layout.mjs');
  const {studyToSite} = await import('../assets/models/berghain/calibration.mjs');
  assert.equal(canStand(studyToSite({x: -12, y: 0, z: 30}), layout), false, 'queue rail is a visible body-height solid');
});

test('static build includes the hidden viewer and excludes private research copies', () => {
  const directory = mkdtempSync(join(tmpdir(), 'berghain-publication-'));
  const root = join(directory, 'source'), output = join(directory, 'site');
  try {
    mkdirSync(join(root, 'assets/social'), {recursive: true});
    mkdirSync(join(root, 'berghain/references/downloads'), {recursive: true});
    mkdirSync(join(root, 'berghain/For-AI'), {recursive: true});
    writeFileSync(join(root, 'index.html'), '<html><head><title>Game</title></head></html>');
    writeFileSync(join(root, 'building-catalogue.js'), 'module.exports={catalogue:[]}');
    writeFileSync(join(root, 'assets/social-preview.png'), 'fixture');
    writeFileSync(join(root, 'assets/social/neighbors.png'), 'fixture');
    writeFileSync(join(root, 'berghain/model.html'), '<html lang="en"><head><meta name="robots" content="noindex"></head><body></body></html>');
    writeFileSync(join(root, 'berghain/footsteps.mjs'), 'export const footstep = true;');
    writeFileSync(join(root, 'berghain/night-lighting.mjs'), 'export const night = true;');
    writeFileSync(join(root, 'berghain/references/downloads/private.jpg'), 'research-only');
    writeFileSync(join(root, 'berghain/AGENTS.md'), 'instructions');
    writeFileSync(join(root, 'berghain/For-AI/SOURCES.md'), 'Public source catalogue');
    writeFileSync(join(root, 'berghain/For-AI/INTERIOR.md'), 'Public artwork and sound-system inventory');
    mkdirSync(join(root, 'geheim'));
    writeFileSync(join(root, 'geheim/index.html'), 'stale generated page');
    buildLevelPages(root, output);
    assert.ok(existsSync(join(output, 'berghain/model.html')));
    assert.ok(existsSync(join(output, 'berghain/footsteps.mjs')), 'The public first-person viewer must ship its imported footstep module');
    assert.ok(existsSync(join(output, 'berghain/night-lighting.mjs')), 'The viewer must ship its imported lighting module');
    const secret = readFileSync(join(output, 'geheim/index.html'), 'utf8');
    assert.match(secret, /data-play="true"/);
    assert.match(secret, /<base href="\.\.\/berghain\/">/);
    assert.match(secret, /name="robots" content="noindex"/);
    assert.ok(existsSync(join(output, 'berghain/For-AI/SOURCES.md')));
    assert.ok(existsSync(join(output, 'berghain/For-AI/INTERIOR.md')), 'catalogue interior link must resolve in the built site');
    assert.ok(!existsSync(join(output, 'berghain/references')), 'research downloads must remain local');
    assert.ok(!existsSync(join(output, 'berghain/AGENTS.md')), 'authoring instructions are not viewer runtime');
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test('Geheim source matches its generated alias and advertises its own valid preview', () => {
  const template = readFileSync(new URL('../berghain/model.html',import.meta.url),'utf8');
  const page = readFileSync(new URL('../geheim/index.html',import.meta.url),'utf8');
  assert.equal(page.replaceAll('\r\n','\n'),geheimPage(template).replaceAll('\r\n','\n'));
  assert.match(page,/og:url" content="https:\/\/germanysimulator.de\/geheim\//);
  assert.match(page,/twitter:card" content="summary_large_image/);
  assert.match(page,/og:image:width" content="1200/);
  const preview = readFileSync(new URL('../assets/social/geheim.png',import.meta.url));
  assert.deepEqual([...preview.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(preview.readUInt32BE(16),1200); assert.equal(preview.readUInt32BE(20),630);
});

test('hidden viewer is noindex and absent from ordinary game navigation', () => {
  const pageURL = new URL('../berghain/model.html', import.meta.url);
  assert.ok(existsSync(pageURL), 'Hidden model page is required');
  assert.match(readFileSync(pageURL, 'utf8'), /name="robots" content="noindex,\s*nofollow"/);
  for (const name of ['index.html', '3d.html', 'game-hud.js']) {
    assert.ok(!readFileSync(new URL('../' + name, import.meta.url), 'utf8').includes('berghain/model.html'));
  }
});

test('exterior reset frames the actual shell bounds on desktop and portrait', async () => {
  const moduleURL = new URL('../berghain/camera.mjs', import.meta.url);
  assert.ok(existsSync(moduleURL), 'Aspect-aware exterior framing is required');
  const {fitExteriorRadius, exteriorTarget} = await import(moduleURL);
  const {layout} = await import('../assets/models/berghain/layout.mjs');
  const THREE = await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
  for (const aspect of [390 / 577, 320 / 600, 1280 / 690, 844 / 270]) {
    const radius = fitExteriorRadius(aspect, .7, 1.28);
    const camera = new THREE.PerspectiveCamera(45, aspect, .08, 500);
    camera.position.set(exteriorTarget[0] + Math.sin(.7) * Math.sin(1.28) * radius, exteriorTarget[1] + Math.cos(1.28) * radius,
      exteriorTarget[2] + Math.cos(.7) * Math.sin(1.28) * radius);
    camera.lookAt(...exteriorTarget); camera.updateMatrixWorld();
    const {min, max} = layout.exteriorBounds;
    for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
      const point = new THREE.Vector3(x, y, z).project(camera);
      assert.ok(Math.abs(point.x) <= .901 && Math.abs(point.y) <= .901, 'shell cropped at aspect ' + aspect);
    }
  }
});
