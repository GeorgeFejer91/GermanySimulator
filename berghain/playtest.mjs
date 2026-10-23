import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {surfaceFamilies} from '../assets/models/berghain/surface-data.mjs';
import {materialScenario} from './material-playtest.mjs';

async function ready(page, baseURL) {
  await page.goto(baseURL + '/berghain/model.html');
  await page.locator('#model[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function walkTo(page, key, axis, value, sign) {
  await page.locator('#model').focus();
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(({axis, value, sign}) => {
      const position = JSON.parse(document.querySelector('#model').dataset.position);
      return position[axis] * sign >= value * sign;
    }, {axis, value, sign}, {timeout: 20000});
  } catch (error) {
    throw new Error(`Walk ${key} to ${axis}=${value}: actual ${await page.locator('#model').getAttribute('data-position')}`, {cause: error});
  } finally { await page.keyboard.up(key); }
  const crossed = JSON.parse(await page.locator('#model').getAttribute('data-position'));
  let aligned = crossed;
  // A delayed protocol key-up can carry the pilot past a ramp or doorway.
  // Correct both axes through real input before the next leg of the route.
  {
    for (let attempt = 0; attempt < 12 && Math.abs(aligned[axis] - value) > .18; attempt++) {
      const correction = axis === 'x' ? (aligned.x < value ? 'd' : 'a') : (aligned.z < value ? 's' : 'w');
      await page.keyboard.press(correction, {delay: 60});
      aligned = JSON.parse(await page.locator('#model').getAttribute('data-position'));
    }
    assert.ok(Math.abs(aligned[axis] - value) <= .18, `Pilot could not align to ${axis}=${value}: ${JSON.stringify(aligned)}`);
  }
  return {crossed, aligned};
}

export default {
  name: 'Berghain architectural viewer',
  sourceFiles: () => ['berghain/model.html', 'berghain/viewer.css', 'berghain/viewer.mjs', 'berghain/navigation.mjs', 'berghain/camera.mjs',
    'assets/models/berghain/layout.mjs', 'assets/models/berghain/model.mjs', 'assets/models/berghain/interior-fixtures.mjs', 'assets/models/berghain/berghain-study.glb',
    'assets/models/berghain/speaker-geometries.mjs','assets/models/berghain/sound-system.mjs',
    'assets/models/berghain/survey-data.mjs', 'assets/models/berghain/survey-model.mjs',
    'assets/models/berghain/berghain-exterior-lod2.glb', 'assets/models/berghain/survey-manifest.json',
    'assets/models/berghain/calibration.mjs', 'assets/models/berghain/manifest.json',
    'assets/models/berghain/surface-materials.mjs','assets/models/berghain/surface-data.mjs',
    'assets/models/berghain/textures/manifest.json',
    ...Object.values(surfaceFamilies).flatMap(family=>['baseColor','roughness','normal'].map(kind=>'assets/models/berghain/'+family[kind]))]
    .map(path => ({path, sha256: createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex')})),
  scenarios: [
    materialScenario,
    {id: 'official-exterior', modes: ['stress'], profiles: ['desktop'], async run({page, baseURL, artifacts}) {
      await ready(page, baseURL);
      const measured = await page.evaluate(async () => {
        const THREE = await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
        const {createSurveyModel} = await import('../assets/models/berghain/survey-model.mjs');
        const {GLTFLoader} = await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
        const model = createSurveyModel();
        const data = await (await fetch('../assets/models/berghain/berghain-exterior-lod2.glb')).arrayBuffer();
        const loaded = await new GLTFLoader().parseAsync(data, '');
        const expected = new THREE.Box3().setFromObject(model), actual = new THREE.Box3().setFromObject(loaded.scene);
        const scene = new THREE.Scene(); scene.background = new THREE.Color('#b3b3a6'); scene.add(loaded.scene);
        scene.add(new THREE.HemisphereLight('#ffffff', '#55554a', 2));
        const sun = new THREE.DirectionalLight('#fff2d8', 3); sun.position.set(-30, 60, 40); scene.add(sun);
        // Isolated asset-render evidence only; this does not test the study's walking routes.
        const canvas = document.createElement('canvas'); canvas.id = 'survey-evidence';
        Object.assign(canvas.style, {position: 'absolute', inset: '0', width: '100%', height: '100%'});
        document.querySelector('#viewport').append(canvas);
        const rect = canvas.getBoundingClientRect(), renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        renderer.setSize(rect.width, rect.height, false);
        const camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, .1, 400);
        const target = actual.getCenter(new THREE.Vector3());
        window.surveyEvidenceView = angle => {
          camera.position.set(target.x + Math.sin(angle) * 110, target.y + 43, target.z + Math.cos(angle) * 110);
          camera.lookAt(target); renderer.render(scene, camera);
        };
        window.surveyEvidenceView(-.65);
        document.querySelector('#location').textContent = 'Official LoD2 exterior';
        document.querySelector('#accuracy').textContent = 'Berlin building DEBE02YY200004SX · four connected volumes';
        document.querySelector('#instructions').textContent = 'Isolated asset render · no interior or window detail in LoD2';
        let meshes = 0; loaded.scene.traverse(node => { if (node.isMesh) meshes++; });
        return {bytes: data.byteLength, meshes, expected: {min: expected.min.toArray(), max: expected.max.toArray()},
          actual: {min: actual.min.toArray(), max: actual.max.toArray()}};
      });
      const manifest = JSON.parse(readFileSync(new URL('../assets/models/berghain/survey-manifest.json', import.meta.url)));
      assert.equal(measured.bytes, manifest.bytes); assert.equal(measured.meshes, manifest.meshes);
      for (const edge of ['min', 'max']) for (let axis = 0; axis < 3; axis++) {
        assert.ok(Math.abs(measured.actual[edge][axis] - measured.expected[edge][axis]) < .002);
        assert.ok(Math.abs(measured.actual[edge][axis] - manifest.bounds[edge][axis]) < .002);
      }
      await artifacts.screenshot(page, 'official-exterior-front.png');
      await page.evaluate(() => window.surveyEvidenceView(Math.PI + .65));
      await artifacts.screenshot(page, 'official-exterior-rear.png');
      return {measured, scope: 'Isolated source/GLB exterior render; study interior not calibrated yet'};
    }},
    {id: 'walk-stairs', modes: ['stress'], profiles: ['desktop', 'android-portrait'], timeoutMs: 110000,
      async run({page, baseURL, artifacts}) {
        await ready(page, baseURL);
        await page.locator('#enter').click();
        const canvas = await page.locator('#model').boundingBox();
        const cx = canvas.x + canvas.width / 2, cy = canvas.y + canvas.height / 2;
        await page.mouse.move(cx, cy); await page.mouse.down();
        await page.mouse.move(cx - 75, cy); await page.mouse.up();
        const site = (x, z) => studyToSite({x, y: 0, z});
        const mainBottom = site(7.95, 20.85), mainTop = site(7.95, 8.9);
        const panoramaBottom = site(-5, 8.9), panoramaTop = site(-5, -5.5);
        const halleBottom = site(-17, -24.2), halleTop = site(-17, -40);
        await walkTo(page, 's', 'z', mainBottom.z, 1);
        const mainApproach = await walkTo(page, 'd', 'x', mainBottom.x, 1);
        await walkTo(page, 'w', 'z', mainTop.z, -1);
        const routes = [{name: 'main', approach: mainApproach, upper: JSON.parse(await page.locator('#model').getAttribute('data-position'))}];
        await artifacts.screenshot(page, 'main-upper-landing.png');
        await walkTo(page, 's', 'z', mainBottom.z, 1);
        routes[0].lower = JSON.parse(await page.locator('#model').getAttribute('data-position'));
        await page.locator('#room').selectOption('berghain');
        await walkTo(page, 's', 'z', panoramaBottom.z, 1);
        const panoramaApproach = await walkTo(page, 'a', 'x', panoramaBottom.x, -1);
        await walkTo(page, 'w', 'z', panoramaTop.z, -1);
        routes.push({name: 'Panorama', approach: panoramaApproach, upper: JSON.parse(await page.locator('#model').getAttribute('data-position'))});
        await artifacts.screenshot(page, 'panorama-upper-landing.png');
        await walkTo(page, 's', 'z', panoramaBottom.z, 1);
        routes[1].lower = JSON.parse(await page.locator('#model').getAttribute('data-position'));
        await page.locator('#room').selectOption('halle');
        await walkTo(page, 's', 'z', halleBottom.z, 1);
        const halleApproach = await walkTo(page, 'a', 'x', halleBottom.x, -1);
        await walkTo(page, 'w', 'z', halleTop.z, -1);
        routes.push({name: 'Halle', approach: halleApproach, upper: JSON.parse(await page.locator('#model').getAttribute('data-position'))});
        await artifacts.screenshot(page, 'halle-upper-landing.png');
        await walkTo(page, 's', 'z', halleBottom.z, 1);
        routes[2].lower = JSON.parse(await page.locator('#model').getAttribute('data-position'));
        await artifacts.json('routes.json', {routes});
        assert.ok(Math.abs(routes[0].upper.y - 6.65) < .01 && Math.abs(routes[0].lower.y - .05) < .01);
        assert.ok(Math.abs(routes[1].upper.y - 13.25) < .01 && Math.abs(routes[1].lower.y - 6.65) < .01);
        assert.ok(Math.abs(routes[2].upper.y - 7.05) < .01 && Math.abs(routes[2].lower.y - .05) < .01);
        return {routes, input: 'actual keyboard movement from authored room viewpoints; no state injection'};
      }},
    {id: 'tour', modes: ['quick', 'stress'], async run({page, context, baseURL, artifacts, profile}) {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console',message=>{if(/shader error|VALIDATE_STATUS|program not valid/i.test(message.text())) errors.push(message.text());});
      await ready(page, baseURL);
      assert.equal(await page.locator('#model').getAttribute('data-materials'),'ready');
      assert.equal(await page.locator('#model').getAttribute('data-surface-textures'),'12');
      await artifacts.screenshot(page, 'exterior.png');
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
      const initial = await page.locator('#model').getAttribute('data-position');
      await page.locator('#model').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(before => document.querySelector('#model').dataset.position !== before, initial);
      await page.getByRole('button', {name: 'Go inside', exact: true}).click();
      await page.waitForFunction(() => document.querySelector('#model').dataset.view === 'interior');
      await page.locator('#model').focus();
      const before = JSON.parse(await page.locator('#model').getAttribute('data-position'));
      await page.keyboard.down('w');
      await page.waitForTimeout(650);
      await page.keyboard.up('w');
      const after = JSON.parse(await page.locator('#model').getAttribute('data-position'));
      assert.ok(Math.hypot(after.x - before.x, after.z - before.z) > .25, 'walking must move the real camera');
      await page.keyboard.down('w');
      await page.getByRole('button', {name: 'Sources & accuracy', exact: true}).click();
      await page.waitForTimeout(150);
      const stopped = await page.locator('#model').getAttribute('data-position');
      await page.waitForTimeout(150);
      assert.equal(await page.locator('#model').getAttribute('data-position'), stopped, 'dialog must clear held movement');
      await page.keyboard.up('w');
      await page.getByRole('button', {name: 'Close', exact: true}).click();
      if (profile.id.startsWith('android')) {
        await page.getByRole('button', {name: 'Go inside', exact: true}).click();
        const control = await page.getByRole('button', {name: 'Walk forward', exact: true}).boundingBox();
        const touch = await context.newCDPSession(page);
        const start = JSON.parse(await page.locator('#model').getAttribute('data-position'));
        await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: control.x + control.width / 2, y: control.y + control.height / 2}]});
        await page.waitForTimeout(500);
        await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
        const end = JSON.parse(await page.locator('#model').getAttribute('data-position'));
        assert.ok(Math.hypot(end.x - start.x, end.z - start.z) > .25, 'real touch hold must move the visitor');
        await touch.detach();
      }
      for (const room of ['foyer', 'berghain', 'panorama', 'saule', 'halle', 'garden']) {
        await page.locator('#room').selectOption(room);
        await page.waitForFunction(name => document.querySelector('#room').value === name && document.querySelector('#model').dataset.view === 'interior', room);
        await page.waitForTimeout(80);
        await artifacts.screenshot(page, room + '.png');
      }
      const parsed = await page.evaluate(async () => {
        const THREE = await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
        const {GLTFLoader} = await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
        const response = await fetch('../assets/models/berghain/berghain-study.glb');
        if (!response.ok) throw Error('GLB download failed: ' + response.status);
        const bytes = await response.arrayBuffer();
        const gltf = await new GLTFLoader().parseAsync(bytes, '');
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        let meshes = 0;
        gltf.scene.traverse(node => { if (node.isMesh) { meshes++; node.geometry.dispose(); node.material.dispose(); } });
        return {bytes: bytes.byteLength, meshes, min: bounds.min.toArray(), max: bounds.max.toArray()};
      });
      const manifest = JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json', import.meta.url)));
      assert.equal(parsed.bytes, manifest.bytes); assert.equal(parsed.meshes, manifest.meshes);
      for (let axis = 0; axis < 3; axis++) assert.ok(Math.abs(parsed.max[axis] - manifest.bounds.max[axis]) < .01);
      await page.getByRole('button', {name: 'Exterior', exact: true}).click();
      await page.waitForFunction(() => document.querySelector('#model').dataset.view === 'exterior');
      const labelGeometry = await page.locator('#room').evaluate(element => ({fit: element.dataset.fit, width: element.clientWidth, height: element.clientHeight}));
      artifacts.json('control-geometry.json', labelGeometry);
      assert.deepEqual(errors, []);
      return {profile: profile.id, parsed, input: 'keyboard movement, orbit, room selection, modal cancellation', errors};
    }},
    {id: 'text-layout', modes: ['stress'], async run({page, baseURL, artifacts}) {
      await ready(page, baseURL);
      const measurements = [];
      for (const viewport of [{width: 320, height: 740}, {width: 740, height: 320}, {width: 1280, height: 800}, {width: 2400, height: 1400}]) {
        await page.setViewportSize(viewport);
        for (const enlarged of [false, true]) {
          await page.evaluate(large => document.documentElement.style.fontSize = large ? '32px' : '16px', enlarged);
          await page.getByRole('button', {name: 'Go inside', exact: true}).click();
          await page.locator('#room').selectOption('panorama');
          await page.waitForTimeout(120);
          const result = await page.evaluate(() => ({horizontal: document.documentElement.scrollWidth > innerWidth + 1,
            measurement: document.documentElement.dataset.textMeasurement,
            clipped: [...document.querySelectorAll('[data-measure]')].filter(element => element.getClientRects().length && element.scrollWidth > element.clientWidth + 2).map(element => element.id || element.textContent)}));
          assert.equal(result.horizontal, false, 'page horizontal overflow at ' + JSON.stringify({viewport, enlarged}));
          assert.deepEqual(result.clipped, []);
          assert.equal(result.measurement, 'pretext-0.0.9');
          measurements.push({viewport, enlarged, ...result});
        }
      }
      await page.setViewportSize({width: 320, height: 740});
      await artifacts.screenshot(page, '320px-text-200-percent.png');
      return {measurements};
    }},
    {id: 'engine-failure', modes: ['stress'], async run({page, baseURL}) {
      await page.route('**/vendor/three/**', route => route.abort());
      await page.goto(baseURL + '/berghain/model.html');
      await page.getByText('The 3D viewer could not load.', {exact: false}).waitFor();
      assert.ok(await page.locator('#loading').isVisible());
      return {fallback: 'visible failure with direct catalogue path'};
    }},
    {id: 'texture-failure', modes: ['stress'], async run({page, baseURL, artifacts}) {
      await page.route('**/assets/models/berghain/textures/*.png',route=>route.abort());
      await ready(page,baseURL);
      assert.equal(await page.locator('#model').getAttribute('data-materials'),'fallback');
      assert.match(await page.locator('#loading').textContent(),/Showing basic materials/);
      assert.ok(await page.locator('#loading').isVisible());
      await page.locator('#enter').click(); await page.locator('#model').focus();
      const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
      await page.keyboard.down('w'); await page.waitForTimeout(350); await page.keyboard.up('w');
      const after=JSON.parse(await page.locator('#model').getAttribute('data-position'));
      assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.25,'Basic-material fallback must remain usable');
      await artifacts.screenshot(page,'texture-fallback.png');
      return {input:'Real keyboard movement with all material images unavailable',before,after};
    }},
    {id: 'graphics-lifecycle', modes: ['stress'], profiles: ['desktop'], async run({page, baseURL, artifacts}) {
      await page.addInitScript(() => {
        const request = window.requestAnimationFrame.bind(window);
        window.__studyFrameRequests = 0;
        window.requestAnimationFrame = callback => { window.__studyFrameRequests++; return request(callback); };
      });
      await ready(page, baseURL);
      await page.waitForTimeout(250);
      const before = await page.evaluate(() => window.__studyFrameRequests);
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => window.__studyFrameRequests), before, 'idle viewer must not schedule continuous frames');
      const supported = await page.evaluate(() => {
        window.__studyContextLoss = document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');
        if (!window.__studyContextLoss) return false;
        window.__studyContextLoss.loseContext(); return true;
      });
      assert.ok(supported, 'context-loss fixture must be available');
      await page.getByText('Graphics paused.', {exact: false}).waitFor();
      await page.evaluate(() => window.__studyContextLoss.restoreContext());
      await page.locator('#model[data-ready="true"]').waitFor();
      assert.equal(await page.locator('#loading').isVisible(), false);
      await artifacts.screenshot(page, 'restored-context.png');
      return {idleFrameRequestsBefore: before, idleFrameRequestsAfter: before, lostAndRestored: true};
    }}
  ]
};
