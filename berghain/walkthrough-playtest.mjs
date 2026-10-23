import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const position = page => page.locator('#model').getAttribute('data-position').then(JSON.parse);
async function ready(page, baseURL) {
  await page.goto(baseURL + '/geheim/');
  await page.locator('#model[data-ready="true"][data-view="interior"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function moveUntil(page, context, profile, direction, z, sign, artifacts) {
  const key = direction === 'forward' ? 'w' : 's';
  let touch;
  if (profile.hasTouch) {
    const box = await page.locator(`[data-move="${direction}"]`).boundingBox();
    touch = await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: box.x + box.width / 2, y: box.y + box.height / 2}]});
  } else {
    await page.locator('#model').focus(); await page.keyboard.down(key);
  }
  try {
    if (artifacts) {
      const moving = [];
      for(let frame=0;frame<3;frame++) {
        await page.waitForTimeout(90);
        await artifacts.screenshot(page,`moving-${frame}.png`);
        moving.push(await position(page));
      }
      artifacts.json('moving-gait.json',moving);
      assert.ok(moving[2].z < moving[0].z - .1,'rendered gait sequence uses accepted forward displacement');
    }
    await page.waitForFunction(({z, sign}) => JSON.parse(document.querySelector('#model').dataset.position).z * sign >= z * sign,
      {z, sign}, {timeout: 30000});
  } finally {
    if (touch) { await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); await touch.detach(); }
    else await page.keyboard.up(key);
  }
  return position(page);
}
async function cross(page, profile) {
  await page.locator('#interact').waitFor({state: 'visible'});
  if (profile.hasTouch) await page.locator('#interact').tap();
  else { await page.locator('#model').focus(); await page.keyboard.press('e'); }
  await page.waitForFunction(() => document.querySelector('#model').dataset.crossing === 'true');
  // A second real key press must not change the committed direction.
  await page.keyboard.press('e');
  await page.waitForFunction(() => document.querySelector('#model').dataset.crossing === 'false', null, {timeout: 30000});
  return position(page);
}

export default {
  name: 'Geheim controllable Berghain visitor',
  sourceFiles: () => ['geheim/index.html', 'berghain/model.html', 'berghain/viewer.mjs', 'berghain/viewer.css',
    'berghain/walkthrough.mjs', 'berghain/navigation.mjs', 'assets/models/berghain/avatar.mjs',
    'assets/models/berghain/model.mjs', 'assets/models/berghain/layout.mjs', 'assets/models/berghain/interior-fixtures.mjs', 'level-transitions.js',
    'assets/models/berghain/speaker-geometries.mjs','assets/models/berghain/sound-system.mjs',
    'assets/models/berghain/berghain-study.glb'].map(path => ({path,
      sha256: createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex')})),
  scenarios: [
    {id: 'share-preview', modes: [], profiles: ['desktop'], async run({page, baseURL, artifacts}) {
      await page.setViewportSize({width:1200,height:630});
      await page.goto(baseURL + '/berghain/share-preview.svg');
      await page.screenshot({path:artifacts.path('geheim.png'),scale:'css'});
      return {originalArtwork:'berghain/share-preview.svg',width:1200,height:630};
    }},
    {id: 'entrance-flow', modes: ['quick', 'stress'], timeoutMs: 120000, async run({page, context, profile, baseURL, artifacts}) {
      const failed = [];
      page.on('response', response => { if (response.status() >= 400) failed.push([response.status(), response.url()]); });
      await ready(page, baseURL);
      assert.equal(await page.locator('#model').getAttribute('data-avatar'), 'true');
      const start = await position(page);
      assert.ok(start.z > 27, 'direct fresh entry starts outside');
      await artifacts.screenshot(page, 'outside.png');
      await page.locator('#model').focus(); await page.keyboard.press('e');
      assert.deepEqual(await position(page), start, 'distant E cannot enter');
      const approach = await moveUntil(page, context, profile, 'forward', 24.6, -1, artifacts);
      assert.ok(approach.z > 22.4);
      await page.locator('#interact').waitFor({state: 'visible'});
      await page.waitForTimeout(100);
      artifacts.json('button-measurement.json', await page.locator('#interact').evaluate(async element => {
        const css = getComputedStyle(element), rect = element.getBoundingClientRect();
        const {prepareWithSegments,measureLineStats,measureNaturalWidth} = await import('../assets/vendor/pretext/dist/layout.js');
        const font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        const prepared = prepareWithSegments(element.textContent,font,{letterSpacing:parseFloat(css.letterSpacing)||0});
        const width = rect.width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-2;
        return {font,rect:{width:rect.width,height:rect.height},padding:[css.paddingLeft,css.paddingTop],width,
          lineHeight:css.lineHeight,stats:measureLineStats(prepared,width),natural:measureNaturalWidth(prepared),fit:element.dataset.fit};
      }));
      assert.equal(await page.locator('#interact').getAttribute('data-fit'), 'fit');
      await artifacts.screenshot(page, 'door-approach.png');
      await page.evaluate(() => {
        window.__crossingPositions = [];
        const canvas = document.querySelector('#model');
        window.__crossingObserver = new MutationObserver(() => {
          if (canvas.dataset.view === 'interior') window.__crossingPositions.push(JSON.parse(canvas.dataset.position));
        });
        window.__crossingObserver.observe(canvas, {attributes: true, attributeFilter: ['data-position']});
      });
      const inside = await cross(page, profile);
      assert.ok(inside.z < 21 && Math.abs(inside.y - .05) < .01, 'walk crosses actual entrance onto foyer floor');
      await artifacts.screenshot(page, 'inside.png');
      const samples = await page.evaluate(() => { window.__crossingObserver.disconnect(); return window.__crossingPositions; });
      assert.ok(samples.some(p => p.z > 22.28) && samples.some(p => p.z < 22.28), 'observed both sides of door');
      let largestStep = 0;
      for (let i = 1; i < samples.length; i++) largestStep = Math.max(largestStep, Math.hypot(samples[i].x - samples[i-1].x, samples[i].z - samples[i-1].z));
      assert.ok(largestStep <= .151, 'door crossing is continuous, not a room teleport: ' + largestStep);
      const explored = await moveUntil(page, context, profile, 'forward', 18.7, -1);
      assert.ok(explored.z < inside.z - .5, 'visitor remains controllable inside');
      await moveUntil(page, context, profile, 'back', 20.1, 1);
      const outside = await cross(page, profile);
      assert.ok(outside.z > 24, 'exit returns through same door to outdoors');
      await artifacts.screenshot(page, 'exit.png');
      await page.reload();
      await page.locator('#model[data-ready="true"]').waitFor();
      assert.ok((await position(page)).z > 27, 'refresh starts outside without state prerequisites');
      assert.deepEqual(failed, []);
      artifacts.json('route.json', {start, approach, inside, explored, outside, samples, largestStep});
      return {input: profile.hasTouch ? 'actual CDP touch holds and entrance taps; duplicate keyboard E' : 'real keyboard WASD and E',
        start, approach, inside, explored, outside, largestStep, samples: samples.length, failed};
    }},
    {id: 'interrupt-layout-lifecycle', modes: ['stress'], profiles: ['desktop'], async run({page, context, profile, baseURL, artifacts}) {
      await page.addInitScript(() => {
        const request = window.requestAnimationFrame.bind(window); window.__walkFrames = 0;
        window.requestAnimationFrame = fn => { window.__walkFrames++; return request(fn); };
      });
      await ready(page, baseURL);
      await moveUntil(page, context, profile, 'forward', 24.6, -1);
      await page.locator('#model').focus(); await page.keyboard.press('e');
      await page.waitForFunction(() => document.querySelector('#model').dataset.crossing === 'true');
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await page.waitForTimeout(200);
      const stopped = await position(page);
      await page.waitForTimeout(200);
      assert.deepEqual(await position(page), stopped, 'blur cancels pending crossing and held movement');
      await page.locator('#sources').click();
      await page.keyboard.press('e');
      assert.deepEqual(await position(page), stopped, 'modal cannot trigger entrance');
      await page.locator('#close-sources').click();
      const geometry = [];
      for (const viewport of [{width: 320, height: 740}, {width: 740, height: 320}, {width: 1280, height: 800}]) {
        await page.setViewportSize(viewport);
        for (const enlarged of [false, true]) {
          await page.evaluate(value => document.documentElement.style.fontSize = value ? '32px' : '16px', enlarged);
          await page.waitForTimeout(150);
          await page.locator('#interact').scrollIntoViewIfNeeded();
          const layout = await page.evaluate(() => {
            const action = document.querySelector('#interact'), touch = document.querySelector('#touch-controls');
            const a = action.getBoundingClientRect(), b = touch.getBoundingClientRect();
            return {horizontal: document.documentElement.scrollWidth > innerWidth + 1,
              fit: action.dataset.fit, measurement: document.documentElement.dataset.textMeasurement,
              action: {x:a.x,y:a.y,width:a.width,height:a.height},
              overlap: a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
              clipped: [...document.querySelectorAll('[data-measure]')].filter(el => el.getClientRects().length && el.scrollWidth > el.clientWidth + 2).map(el => el.id || el.textContent)};
          });
          artifacts.json('latest-layout.json', {viewport, enlarged, ...layout});
          assert.equal(layout.horizontal, false); assert.equal(layout.overlap, false);
          assert.equal(layout.fit, 'fit'); assert.equal(layout.measurement, 'pretext-0.0.9'); assert.deepEqual(layout.clipped, []);
          assert.ok(layout.action.height >= 44 && layout.action.width >= 44);
          geometry.push({viewport, enlarged, ...layout});
          if (viewport.width === 320 && enlarged) await artifacts.screenshot(page, '320px-200-percent.png');
        }
      }
      await page.setViewportSize({width: 1280, height: 800});
      await page.evaluate(() => document.documentElement.style.fontSize = '16px');
      await page.locator('#model').focus();
      await page.waitForTimeout(300);
      const frames = await page.evaluate(() => window.__walkFrames);
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => window.__walkFrames), frames, 'idle avatar must not keep rendering');
      const supported = await page.evaluate(() => {
        window.__walkContext = document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');
        if (!window.__walkContext) return false;
        window.__walkContext.loseContext(); return true;
      });
      assert.ok(supported);
      await page.getByText('Graphics paused.', {exact:false}).waitFor();
      await page.evaluate(() => window.__walkContext.restoreContext());
      await page.locator('#model[data-ready="true"]').waitFor();
      assert.deepEqual(await position(page), stopped, 'context restore must not resume cancelled crossing');
      const resumed = await cross(page, profile);
      assert.ok(resumed.z < 21);
      artifacts.json('layout.json', geometry);
      return {stopped, resumed, geometry, idleFrames:frames, contextLostRestored:true};
    }}
  ]
};
