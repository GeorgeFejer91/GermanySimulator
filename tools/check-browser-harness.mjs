import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {runSuite, serveDirectory} from './browser-harness.mjs';

mkdirSync('output/browser-tool-development', {recursive: true});
const directory = mkdtempSync(resolve('output/browser-tool-development/integration-'));
writeFileSync(resolve(directory, 'index.html'), `<!doctype html><form><label>Name<input id="name"></label><button>Save</button></form><output></output><script>
document.querySelector('form').onsubmit=event=>{event.preventDefault();document.querySelector('output').textContent=new URLSearchParams(location.search).has('fault')?'BROKEN':'Saved: '+document.getElementById('name').value;localStorage.setItem('previous-case','yes')};
</script>`);

async function form({page, baseURL, artifacts}, fault = false) {
  await page.goto(baseURL + (fault ? '/?fault=1' : '/'));
  assert.equal(await page.evaluate(() => localStorage.getItem('previous-case')), null);
  await page.locator('#name').fill('Ada');
  await page.locator('button').click();
  assert.equal(await page.locator('output').textContent(), 'Saved: Ada', 'Real form handler must save the entered name');
  await artifacts.screenshot(page, 'saved.png');
  return {random: await page.evaluate(() => Math.random())};
}
const scenario = (id, run, extra = {}) => ({id, run, modes: ['quick'], ...extra});
const scenarios = [scenario('form', form), scenario('isolated', form),
  scenario('broken-handler', context => form(context, true)),
  scenario('page-error', async ({page, baseURL}) => {
    await page.goto(baseURL);
    await Promise.all([page.waitForEvent('pageerror'), page.evaluate(() => { setTimeout(() => { throw Error('fixture page error'); }, 0); })]);
  }),
  scenario('timeout', async ({page}) => page.waitForFunction(() => false), {timeoutMs: 75}),
  scenario('crash', async ({context, page}) => { const cdp = await context.newCDPSession(page); await cdp.send('Page.crash'); }, {timeoutMs: 5000}),
  scenario('after-failure', form)
];
const report = await runSuite({name: 'Independent form fixture', scenarios}, {
  root: directory, output: resolve(directory, 'batch'), stdout: false, seed: 19
});
assert.equal(report.complete, true);
assert.equal(report.verdict, 'FAIL');
assert.deepEqual(report.cases.map(test => test.verdict), ['PASS', 'PASS', 'FAIL', 'FAIL', 'FAIL', 'FAIL', 'PASS']);
assert.equal(report.cases[0].details.random, report.cases[1].details.random);
assert.match(report.cases[2].error, /Real form handler/);
assert.match(report.cases[4].error, /deadline/);
assert.match(report.cases[5].error, /crashed/);
assert.ok(report.cases[5].elapsedMs < 5000, 'A crashed page must fail immediately rather than spend the whole deadline');
assert.ok(report.cases[3].diagnostics.pageErrors > 0);
assert.ok(report.cases.every(test => test.diagnostics.recent.length <= 64));
assert.ok(existsSync(resolve(directory, 'batch/broken-handler--desktop/failure.png')));

const suiteFile = resolve(directory, 'cli-suite.mjs');
writeFileSync(suiteFile, `export default {name:'CLI failure',scenarios:[{id:'reject',modes:['quick'],async run({page,baseURL}){await page.goto(baseURL);throw Error('deliberate CLI assertion')}}]};`);
const cli = spawnSync(process.execPath, ['tools/test-browser.mjs', 'quick', '--suite', suiteFile, '--root', directory,
  '--output', resolve(directory, 'cli'), '--trace'], {encoding: 'utf8', timeout: 30000});
assert.equal(cli.status, 1, cli.stderr);
assert.ok(Buffer.byteLength(cli.stdout) <= 12288);
assert.equal(JSON.parse(cli.stdout).verdict, 'FAIL');
assert.ok(existsSync(resolve(directory, 'cli/reject--desktop/trace.zip')));
assert.ok(existsSync(resolve(directory, 'batch/broken-handler--desktop/failure.png')), 'Diagnostic rerun must preserve the first failure');

const server = await serveDirectory(directory);
const firstCliReport = readFileSync(resolve(directory, 'cli/report.json'), 'utf8');
try {
  const external = await runSuite({name: 'Existing dev server', scenarios: [scenario('form', form)]}, {
    baseURL: server.url, root: directory, output: resolve(directory, 'cli'), stdout: false
  });
  assert.equal(external.verdict, 'PASS');
  assert.notEqual(external.reportPath, resolve(directory, 'cli/report.json'));
  assert.equal(readFileSync(resolve(directory, 'cli/report.json'), 'utf8'), firstCliReport);
  assert.equal((await fetch(server.url)).status, 200, 'Runner must not close a supplied server');
} finally { await server.close(); }

const interrupted = await runSuite({name: 'Cancellation', scenarios: [
  scenario('interrupt', async ({page}) => { process.emit('SIGINT'); await page.waitForFunction(() => false); }),
  scenario('pending', form)
]}, {root: directory, output: resolve(directory, 'interrupt'), stdout: false});
assert.equal(interrupted.complete, false);
assert.deepEqual(interrupted.cases.map(test => test.verdict), ['FAIL', 'NOT RUN']);

const disconnected = await runSuite({name: 'Browser lost', scenarios: [
  scenario('disconnect', async ({context}) => { await context.browser().close(); }), scenario('pending', form)
]}, {root: directory, output: resolve(directory, 'disconnect'), stdout: false});
assert.equal(disconnected.complete, false);
assert.deepEqual(disconnected.cases.map(test => test.verdict), ['FAIL', 'NOT RUN']);

assert.equal(JSON.parse(readFileSync(report.reportPath)).cases[2].verdict, 'FAIL');
const verification = {verdict: 'PASS', checks: ['real form', 'state isolation', 'seed', 'broken handler detection',
  'page errors', 'deadline', 'fail-fast crash', 'cleanup and recovery', 'CLI exit', 'trace', 'external server',
  'interruption', 'browser disconnect', 'original failure retained'], evidence: directory};
writeFileSync(resolve(directory, 'verification.json'), JSON.stringify(verification, null, 2));
console.log(JSON.stringify(verification));
