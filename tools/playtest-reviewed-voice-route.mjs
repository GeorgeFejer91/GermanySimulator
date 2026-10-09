// Browser-level regression for exact voice/text promotion. A synthetic approval
// exists only in the served JS; this test does not alter the game catalogue.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {createReadStream, readFileSync} from 'node:fs';
import {extname, resolve, sep} from 'node:path';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(import.meta.dirname, '..');
const catalogPath = resolve(root, 'For-AI/AUDIO-TEXT-LIBRARY.js');
const catalog = readFileSync(catalogPath, 'utf8');
const candidate = JSON.parse(readFileSync(resolve(root, 'assets/voices/candidate-dialogue/manifest.json'), 'utf8'));
const approved = candidate.clips.find(clip => clip.voiceId === 'polizei-heinrich-wachtmeister' &&
  clip.text === 'NICHT ÜBER DEN RASEN!');
if (!approved) throw new Error('Police grass candidate missing');
const synthetic = catalog.replace(/(const approvedDialogue=Object\.freeze\(Object\.fromEntries\(\[\r?\n)(\r?\n\]\.map)/,
  `$1 ${JSON.stringify([approved.voiceId, approved.text, approved.path])}$2`);
if (synthetic === catalog) throw new Error('Approved lookup insertion point changed');
const game = readFileSync(resolve(root, 'game.js'), 'utf8');
const marker = 'requestAnimationFrame(loop);\n})();';
if (!game.includes(marker)) throw new Error('Game probe insertion point changed');
const probe = `window.__voiceRouteTest={
  bark(text,legacy){state.started=true;state.modal=false;showWorldBark('POLIZEI',text,true,legacy,'',
    {family:'voice-route-test',candidateVoiceId:'polizei-heinrich-wachtmeister',
      priority:STIMULUS_PRIORITY.CRITICAL,ambient:false});
    return activeStimulus?.recording||stimulusQueue.find(item=>item.family==='voice-route-test')?.recording||null},
  reset(){stopSpeech()}
};\n`;
const instrumented = game.replace(marker, probe + marker);
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + pathname.replace(/\/$/, '/index.html'));
  if (!file.startsWith(root + sep)) {response.writeHead(403).end(); return}
  response.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream'});
  createReadStream(file).on('error', () => response.destroy()).pipe(response);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({headless: true,
  executablePath: process.env.CHROMIUM_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--mute-audio']});
try {
  for (const [caseName, serveApproved, previewEnabled] of [
    ['default', false, false], ['preview', false, true], ['approved', true, false]]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/game.js?*', route => route.fulfill({status: 200, contentType: 'text/javascript', body: instrumented}));
    await page.route('**/world3d.js?*', route => route.fulfill({status: 200, contentType: 'text/javascript', body: ''}));
    await page.route('**/For-AI/AUDIO-TEXT-LIBRARY.js?*', route => route.fulfill({status: 200,
      contentType: 'text/javascript', body: serveApproved ? synthetic : catalog}));
    await page.goto(base + (previewEnabled ? '?voicePreview=1' : ''), {waitUntil: 'domcontentloaded'});
    const result = await page.evaluate(text => {
      const noLegacy = window.__voiceRouteTest.bark(text, '');
      window.__voiceRouteTest.reset();
      const withLegacy = window.__voiceRouteTest.bark(text, 'assets/voices/legacy.mp3');
      return {noLegacy, withLegacy, catalogPath: window.GermanySimulatorAudioText.candidateClip(
        'polizei-heinrich-wachtmeister', text)};
    }, approved.text);
    const expected = serveApproved || previewEnabled ? approved.path : null;
    if (result.noLegacy !== expected || result.catalogPath !== expected ||
      result.withLegacy !== (expected || 'assets/voices/legacy.mp3') || errors.length) {
      throw new Error(`${caseName} route mismatch: ${JSON.stringify({result, errors})}`);
    }
    console.log(JSON.stringify({caseName, ...result}));
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
