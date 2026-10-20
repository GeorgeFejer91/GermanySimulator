// Temporary read-only CI observer. Assertions, profiles and deadlines are unchanged.
const fs = require('node:fs');
const path = require('node:path');
const lib = require(path.resolve('tools/browser-ci/node_modules/playwright'));
const launch = lib.chromium.launch.bind(lib.chromium);
module.exports = {...lib, chromium: {executablePath: () => lib.chromium.executablePath(), async launch(options) {
  const browser = await launch({...options, args: [...options.args, '--use-angle=gl']});
  const probeContext = await browser.newContext();
  const probePage = await probeContext.newPage();
  const graphics = await probePage.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return debug ? {renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL), version: gl.getParameter(gl.VERSION)} : null;
  });
  fs.mkdirSync('output/browser-ci', {recursive: true});
  fs.writeFileSync('output/browser-ci/graphics.json', JSON.stringify(graphics));
  await probeContext.close();
  if (!graphics) { await browser.close(); throw Error('ANGLE OpenGL WebGL2 unavailable'); }
  const newContext = browser.newContext.bind(browser);
  let pageId = 0;
  browser.newContext = async options => {
    const context = await newContext(options);
    await context.addInitScript(() => {
      const events = [], frames = [];
      const state = () => ({now: performance.now(), hidden: document.hidden, focused: document.hasFocus(),
        active: document.activeElement?.outerHTML.slice(0, 200), fullscreen: !!document.fullscreenElement,
        hud: window.Germany3DBridge?.getHUDState(), held: {...window.Germany3DBridge?.getInput()},
        player: window.Germany3DBridge ? {x: Germany3DBridge.player.x, y: Germany3DBridge.player.y} : null});
      const log = event => queueMicrotask(() => {
        events.push({type: event.type, key: event.code, prevented: event.defaultPrevented, ...state()});
        if (events.length > 80) events.shift();
      });
      for (const type of ['keydown', 'keyup', 'focus', 'blur', 'visibilitychange', 'fullscreenchange'])
        window.addEventListener(type, log);
      let last = performance.now();
      function frame(now) { frames.push(now - last); last = now; if (frames.length > 64) frames.shift(); requestAnimationFrame(frame); }
      requestAnimationFrame(frame);
      window.__ciDiagnostic = () => {
        const canvas = document.getElementById('world3d'), gl = canvas?.getContext('webgl2');
        const debug = gl?.getExtension('WEBGL_debug_renderer_info');
        return {...state(), events, frames, render: window.Germany3D?.inspectAssets?.().render,
          graphics: debug ? {vendor: gl.getParameter(debug.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)} : null,
          canvas: canvas ? {width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight} : null};
      };
    });
    context.on('page', page => {
      const id = ++pageId;
      async function snapshot(label, error) {
        const start = performance.now();
        let state;
        try { state = await page.evaluate(() => window.__ciDiagnostic?.()); }
        catch (error) { state = {unavailable: error.message}; }
        fs.mkdirSync('output/browser-ci', {recursive: true});
        fs.appendFileSync('output/browser-ci/diagnostic.jsonl', JSON.stringify({id, url: page.url(), label,
          error: error?.message, evaluationMs: performance.now() - start, state}) + '\n');
      }
      const up = page.keyboard.up.bind(page.keyboard);
      page.keyboard.up = async key => { await up(key); if (key.startsWith('Arrow')) await snapshot('keyup:' + key); };
      const screenshot = page.screenshot.bind(page);
      page.screenshot = async options => {
        const start = performance.now();
        try { const image = await screenshot(options); await snapshot('screenshot:pass:' + (performance.now() - start)); return image; }
        catch (error) { await snapshot('screenshot:fail:' + (performance.now() - start), error); throw error; }
      };
    });
    return context;
  };
  return browser;
}}};
