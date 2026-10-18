import assert from 'node:assert/strict';
import {browserMetrics} from './browser-diagnostics.mjs';

async function inputState(page) {
  return page.evaluate(() => ({
    held: Object.entries(Germany3DBridge.getInput()).filter(([, held]) => held).map(([key]) => key),
    player: {x: Germany3DBridge.player.x, y: Germany3DBridge.player.y},
    paused: GermanyHUD.paused, queue: Germany3DBridge.assetLoadStatus
  }));
}

async function runInputRecovery({page, context, baseURL, profile, iterations, mode, artifacts}) {
  const checks = [];
  const pass = name => { checks.push(name); artifacts.log('check', name); };
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setFocusEmulationEnabled', {enabled: true});
  await page.goto(baseURL, {waitUntil: 'commit'});
  await page.waitForFunction(() => window.Germany3D?.startupReady && window.Germany3DBridge?.startupAssetsReady
    && !document.body.classList.contains('preloading'), null, {timeout: 90000});
  await page.keyboard.press('KeyS');
  await page.waitForFunction(() => document.getElementById('intro').classList.contains('hidden'));
  await page.evaluate(() => { for (let i = 0; i < 12; i++) document.getElementById('dialogue-next').click(); });
  const before = await inputState(page);
  let moved = false;
  for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    const position = await inputState(page);
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(position => Math.hypot(Germany3DBridge.player.x - position.x,
        Germany3DBridge.player.y - position.y) > 0.1, position.player, {timeout: 1500});
      moved = true;
    } catch (error) {
      if (error.name !== 'TimeoutError') throw error;
    } finally { await page.keyboard.up(key); }
    if (moved) break;
  }
  assert.ok(moved, 'At least one native directional input must move the production player');
  pass('native movement is observable');

  const sequences = mode === 'quick' ? 10 : iterations * 10;
  for (let i = 0; i < sequences; i++) await page.keyboard.press(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'][i % 4]);
  assert.deepEqual((await inputState(page)).held, [], 'Input burst must release all keys');
  pass(`${sequences} native input sequences release cleanly`);

  await page.keyboard.down('ArrowRight');
  assert.ok((await inputState(page)).held.includes('ArrowRight'));
  await page.evaluate(() => dispatchEvent(new Event('blur')));
  assert.deepEqual((await inputState(page)).held, [], 'Synthetic blur must release held input');
  await page.keyboard.up('ArrowRight');
  pass('held input releases on synthetic blur');

  await page.keyboard.down('ArrowUp');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, value: true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.deepEqual((await inputState(page)).held, [], 'Synthetic hidden state must release input');
  await page.keyboard.up('ArrowUp');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.keyboard.down('ArrowLeft');
  assert.ok((await inputState(page)).held.includes('ArrowLeft'), 'Resume must accept fresh native input');
  await page.keyboard.up('ArrowLeft');
  pass('synthetic visibility recovery accepts fresh native input');

  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('KeyM');
  await page.waitForFunction(() => GermanyHUD.paused);
  assert.deepEqual((await inputState(page)).held, [], 'Opening the case file releases movement');
  const pausedAt = await inputState(page);
  await page.keyboard.press('ArrowUp');
  assert.deepEqual((await inputState(page)).player, pausedAt.player, 'Paused movement must not advance the player');
  await page.keyboard.up('ArrowRight');
  await page.locator('#file-close').click();
  await page.waitForFunction(() => !GermanyHUD.paused);
  assert.deepEqual((await inputState(page)).held, []);
  pass('native case-file pause and resume release movement');

  if (profile.hasTouch) {
    const button = page.locator('.control-dock [data-key="ArrowRight"]');
    const bounds = await button.boundingBox();
    assert.ok(bounds, 'Touch movement control must be visible');
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1}]});
    assert.ok((await inputState(page)).held.includes('ArrowRight'));
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchCancel', touchPoints: []});
    assert.deepEqual((await inputState(page)).held, [], 'Native touch cancellation must release movement');
    pass('native touch cancellation releases movement');
  }

  const viewport = profile.viewport;
  await page.setViewportSize({width: viewport.height, height: viewport.width});
  await page.waitForFunction(() => {
    const canvas = document.getElementById('world3d');
    return canvas.clientWidth === innerWidth && canvas.clientHeight === innerHeight;
  });
  await page.setViewportSize(viewport);
  await page.waitForFunction(() => document.getElementById('world3d').clientWidth === innerWidth);
  assert.deepEqual((await inputState(page)).held, []);
  pass('resize and orientation changes preserve released input');
  await artifacts.screenshot(page, 'recovered.png');
  const after = await inputState(page);
  const resources = await page.evaluate(() => Germany3D.inspectAssets().memory);
  const memory = await browserMetrics(context, page);
  await cdp.detach();
  return {checks, sequences, before, after, resources, memory,
    limits: ['S/welcome dismissal are fixtures; movement and pause use production keyboard handlers',
      'Blur/visibility are synthetic events; touch cancellation uses native CDP input; Android is emulated']};
}

export const inputScenario = {id: 'input', modes: ['quick', 'stress'], timeoutMs: 180000, run: runInputRecovery};
