import {createServer} from 'node:http';
import {createReadStream, existsSync, realpathSync, statSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, relative, isAbsolute, extname, dirname, join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {silenceBrowserAudio, seedBrowserRandom, createArtifacts, browserMetrics, compactSummary} from './browser-diagnostics.mjs';

export const browserProfiles = [
  {id: 'desktop', viewport: {width: 1280, height: 800}, deviceScaleFactor: 2},
  {id: 'android-portrait', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
  {id: 'android-landscape', viewport: {width: 844, height: 390}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
  {id: 'reduced', viewport: {width: 1280, height: 800}, deviceScaleFactor: 1, reducedMotion: 'reduce'}
];

export async function resizeViewport(page,viewport){
  await page.evaluate(async()=>{if(document.fullscreenElement)await document.exitFullscreen()});
  await page.setViewportSize(viewport);
}

export function installedPlaywright() {
  const require = createRequire(import.meta.url);
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  try { return require('playwright'); }
  catch (error) {
    const bundled = resolve(dirname(process.execPath), '../node_modules/playwright');
    if (existsSync(bundled)) return require(bundled);
    throw Error('Playwright unavailable; set PLAYWRIGHT_MODULE to an existing installation', {cause: error});
  }
}

export function chromiumExecutable(chromium) {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const candidates = [chromium.executablePath()];
  if (process.platform === 'win32') for (const folder of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
    if (folder) candidates.push(join(folder, 'Google/Chrome/Application/chrome.exe'));
  }
  const filename = candidates.find(candidate => existsSync(candidate));
  if (!filename) throw Error('Chromium unavailable; set CHROMIUM_PATH to an existing executable');
  return filename;
}

export async function serveDirectory(directory) {
  const root = realpathSync(directory);
  const mime = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
    '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.wasm': 'application/wasm'};
  const server = createServer((request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.split(/[\\/]/).some(part => part.startsWith('.'))) throw Error('Hidden path');
      const filename = realpathSync(resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname)));
      const within = relative(root, filename);
      if (within.startsWith('..') || isAbsolute(within) || !statSync(filename).isFile()) throw Error('Outside root');
      response.writeHead(200, {'Content-Type': mime[extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      if (request.method === 'HEAD') response.end();
      else { const stream = createReadStream(filename); stream.on('error', () => response.destroy()); stream.pipe(response); }
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  return {url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(done => { server.close(done); server.closeAllConnections(); })};
}

function selectCases(suite, options) {
  if (!Array.isArray(suite?.scenarios) || suite.scenarios.some(test => !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(test.id) || typeof test.run !== 'function')) throw Error('Suite requires named runnable scenarios');
  if (new Set(suite.scenarios.map(test => test.id)).size !== suite.scenarios.length) throw Error('Scenario IDs must be unique');
  const profiles = suite.profiles || browserProfiles;
  if (profiles.some(profile => !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(profile.id))) throw Error('Profiles require plain IDs');
  const profileIds = options.profiles || (options.mode === 'stress' ? ['desktop', 'android-portrait', 'android-landscape'] : ['desktop']);
  const scenarioIds = options.scenarios || suite.scenarios.filter(test => test.modes.includes(options.mode)).map(test => test.id);
  for (const id of profileIds) if (!profiles.some(profile => profile.id === id)) throw Error(`Unknown profile: ${id}`);
  for (const id of scenarioIds) if (!suite.scenarios.some(test => test.id === id)) throw Error(`Unknown scenario: ${id}`);
  const cases = scenarioIds.flatMap(id => {
    const scenario = suite.scenarios.find(test => test.id === id);
    return profileIds.filter(profile => !scenario.profiles || scenario.profiles.includes(profile)).map(profile => ({scenario, profile: profiles.find(p => p.id === profile)}));
  });
  if (!cases.length) throw Error('Selection contains no runnable cases');
  return cases;
}

function reproduction(options, scenario, profile, seed) {
  if (!options.suitePath) return `Programmatic suite: rerun its caller with scenarios=['${scenario.id}'], profiles=['${profile.id}'], seed=${seed}, iterations=${options.iterations}, trace=true`;
  const args = ['node', 'tools/test-browser.mjs', options.mode, '--suite', options.suitePath,
    '--scenario', scenario.id, '--profile', profile.id, '--seed', String(seed), '--iterations', String(options.iterations)];
  if (options.baseURL) args.push('--base-url', options.baseURL);
  else args.push('--root', options.root);
  args.push('--trace');
  return args.map(arg => /^[a-zA-Z0-9_./:=+-]+$/.test(arg) ? arg : "'" + arg.replaceAll("'", "''") + "'").join(' ');
}

async function executeCase(browser, baseURL, planned, options, report, signal) {
  const {scenario, profile} = planned;
  const seed = options.seed;
  const artifacts = createArtifacts(resolve(options.output, scenario.id + '--' + profile.id));
  const result = {scenario: scenario.id, profile: profile.id, seed, iterations: options.iterations,
    verdict: 'FAIL', reproduce: reproduction(options, scenario, profile, seed)};
  const started = performance.now();
  let context, page, timer, abort, disconnected;
  const caseController = new AbortController();
  try {
    const {id, ...contextOptions} = profile;
    result.contextOptions = {...contextOptions, ...scenario.contextOptions};
    context = await browser.newContext(result.contextOptions);
    context.setDefaultTimeout(scenario.actionTimeoutMs || 30000);
    await context.addInitScript(silenceBrowserAudio);
    await context.addInitScript(seedBrowserRandom, seed);
    if (options.trace) await context.tracing.start({screenshots: true, snapshots: true, sources: true});
    page = await context.newPage();
    const browserFailure = new Promise((_, reject) => {
      page.on('pageerror', error => { artifacts.log('pageerror', error.message); reject(error); });
      page.on('crash', () => { artifacts.log('crash', 'Page crashed'); reject(Error('Browser page crashed')); });
      disconnected = () => reject(Error('Browser disconnected'));
      browser.once('disconnected', disconnected);
    });
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) artifacts.log(message.type(), message.text()); });
    const task = Promise.resolve().then(() => scenario.run({page, context, baseURL, profile, seed,
      iterations: options.iterations, mode: options.mode, root: options.root, artifacts, signal: caseController.signal}));
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { caseController.abort(); reject(Error(`Scenario deadline exceeded (${scenario.timeoutMs || 120000} ms)`)); }, scenario.timeoutMs || 120000);
      abort = () => { caseController.abort(); reject(Error('Run interrupted')); };
      signal.addEventListener('abort', abort, {once: true});
      if (signal.aborted) abort();
    });
    result.details = await Promise.race([task, deadline, browserFailure]);
    if (artifacts.summary().pageErrors) throw Error('Browser page error; see events.jsonl');
    result.browserMemory = await browserMetrics(context, page);
    result.verdict = 'PASS';
  } catch (error) {
    result.error = error.stack || error.message;
    if (page && !page.isClosed()) {
      try { await artifacts.screenshot(page, 'failure.png'); }
      catch (captureError) { artifacts.log('capture-error', captureError.message); }
    }
  } finally {
    clearTimeout(timer);
    caseController.abort();
    if (abort) signal.removeEventListener('abort', abort);
    if (disconnected) browser.removeListener('disconnected', disconnected);
    if (context) {
      if (options.trace) {
        try { await context.tracing.stop({path: artifacts.path('trace.zip')}); }
        catch (error) { result.cleanupError = error.message; result.verdict = 'FAIL'; }
      }
      try { await context.close(); }
      catch (error) { result.cleanupError = error.message; result.verdict = 'FAIL'; }
    }
    result.elapsedMs = Math.round(performance.now() - started);
    result.diagnostics = artifacts.summary();
    if (result.diagnostics.pageErrors && result.verdict === 'PASS') {
      result.error = 'Browser page error during cleanup; see events.jsonl';
      result.verdict = 'FAIL';
    }
    artifacts.json('result.json', result);
    report.runnerPeakRssBytes = Math.max(report.runnerPeakRssBytes, process.memoryUsage().rss);
  }
  return result;
}

export async function runSuite(suite, supplied = {}) {
  const options = {mode: 'quick', seed: 1, iterations: 10, root: process.cwd(), ...supplied};
  options.root = resolve(options.root || process.cwd());
  options.output = resolve(options.output || `output/browser-tests/${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`);
  if (existsSync(resolve(options.output, 'report.json'))) options.output = resolve(options.output, `run-${Date.now()}-${process.pid}`);
  if (!['quick', 'stress'].includes(options.mode)) throw Error('Mode must be quick or stress');
  if (!Number.isInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff) throw Error('Seed must be an unsigned 32-bit integer');
  if (!Number.isSafeInteger(options.iterations) || options.iterations < 1) throw Error('Iterations must be a positive integer');
  if (options.baseURL && !/^https?:\/\//.test(options.baseURL)) throw Error('baseURL must use HTTP or HTTPS');
  const planned = selectCases(suite, options);
  mkdirSync(options.output, {recursive: true});
  const report = {suite: suite.name, complete: false, verdict: 'FAIL', seed: options.seed, mode: options.mode,
    reportPath: resolve(options.output, 'report.json'), cases: [], runnerPeakRssBytes: process.memoryUsage().rss,
    runnerMemoryMethod: 'Process RSS sampled every 250 ms and at case boundaries; excludes browser/GPU processes',
    limits: ['Headless silent Chromium; mobile profiles are emulation, not physical-device evidence',
      'Heap, DOM and renderer counters are partial memory measurements; seeded randomness does not fix browser scheduling', ...(suite.limits || [])]};
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  const started = performance.now();
  let browser, server;
  const memoryTimer = setInterval(() => { report.runnerPeakRssBytes = Math.max(report.runnerPeakRssBytes, process.memoryUsage().rss); }, 250);
  try {
    server = options.baseURL ? null : await serveDirectory(options.root);
    const {chromium} = installedPlaywright();
    const args=['--mute-audio'];
    // Opt-in software OpenGL for the Linux CI runner, with Xvfb and Mesa.
    if(process.env.CHROMIUM_MESA==='1')args.push('--enable-gpu','--use-cmd-decoder=passthrough','--use-gl=angle','--use-angle=gl','--ozone-platform=x11','--ignore-gpu-blocklist');
    report.browserArguments=args;
    browser = await chromium.launch({headless: true, handleSIGINT: false, handleSIGTERM: false,
      executablePath: chromiumExecutable(chromium), args});
    report.browser = browser.version();
    report.baseURL = options.baseURL || server.url;
    if (suite.sourceFiles) report.sourceHashes = await suite.sourceFiles(options.root);
    for (const next of planned) {
      if (controller.signal.aborted || !browser.isConnected()) break;
      report.cases.push(await executeCase(browser, report.baseURL, next, options, report, controller.signal));
      writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    }
    report.complete = report.cases.length === planned.length && !controller.signal.aborted;
  } catch (error) { report.error = error.stack || error.message; }
  finally {
    clearInterval(memoryTimer);
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    for (const missing of planned.slice(report.cases.length)) report.cases.push({scenario: missing.scenario.id, profile: missing.profile.id, verdict: 'NOT RUN'});
    try { if (browser) await browser.close(); }
    catch (error) { report.error = `Browser cleanup: ${error.message}`; }
    try { if (server) await server.close(); }
    catch (error) { report.error = `Server cleanup: ${error.message}`; }
    report.elapsedMs = Math.round(performance.now() - started);
    report.verdict = report.complete && !report.error && report.cases.every(test => test.verdict === 'PASS') ? 'PASS' : 'FAIL';
    writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
  }
  if (options.stdout !== false) process.stdout.write(compactSummary(report));
  return report;
}

export function isMain(moduleURL) { return !!process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === moduleURL; }
