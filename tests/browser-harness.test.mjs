import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {serveDirectory, runSuite} from '../tools/browser-harness.mjs';
import {createArtifacts, compactSummary} from '../tools/browser-diagnostics.mjs';

mkdirSync('output/browser-tool-development', {recursive: true});
const directory = mkdtempSync(resolve('output/browser-tool-development/unit-'));

test('static server serves the selected root and closes open connections', async () => {
  writeFileSync(resolve(directory, 'index.html'), '<button>Local fixture</button>');
  mkdirSync(resolve(directory, '.git'));
  writeFileSync(resolve(directory, '.git/config'), 'private');
  const server = await serveDirectory(directory);
  try {
    const response = await fetch(server.url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(await response.text(), '<button>Local fixture</button>');
    assert.equal((await fetch(server.url + '/.git/config')).status, 404);
    assert.equal((await fetch(server.url + '/%2e%2e%5cpackage.json')).status, 404);
    assert.equal((await fetch(server.url + '/missing')).status, 404);
    assert.equal((await fetch(server.url, {method: 'POST'})).status, 405);
    assert.equal((await fetch(server.url, {method: 'HEAD'})).status, 200);
  } finally { await server.close(); }
  await assert.rejects(fetch(server.url));
});

test('diagnostics bound both retained events and disk output without losing error counts', () => {
  const artifacts = createArtifacts(resolve(directory, 'bounded'));
  for (let i = 0; i < 4500; i++) artifacts.log('pageerror', 'x'.repeat(4096));
  const summary = artifacts.summary();
  assert.equal(summary.recent.length, 64);
  assert.equal(summary.pageErrors, 4500);
  assert.ok(summary.dropped > 0);
  assert.ok(statSync(summary.files[0]).size <= 8 * 1024 * 1024);
  assert.ok(summary.recent.every(event => event.message.length <= 2048));
  assert.throws(() => artifacts.path('../outside.json'), /plain filenames/);
  artifacts.json('details.json', {answer: 42});
  assert.equal(JSON.parse(readFileSync(artifacts.path('details.json'))).answer, 42);
});

test('compact reports stay within byte limits and retain failure evidence pointers', () => {
  for (const verdict of ['PASS', 'FAIL']) {
    const report = {verdict, complete: true, elapsedMs: 1, reportPath: '/output/report.json', cases: [], runnerPeakRssBytes: 1};
    for (let i = 0; i < 1000; i++) report.cases.push({scenario: 'case-' + i, profile: 'desktop', verdict,
      error: 'ü'.repeat(5000), reproduce: 'x'.repeat(5000)});
    const output = compactSummary(report);
    assert.ok(Buffer.byteLength(output) <= (verdict === 'PASS' ? 4096 : 12288));
    const decoded = JSON.parse(output);
    assert.equal(decoded.verdict, verdict);
    assert.equal(decoded.report, report.reportPath);
    assert.equal(decoded.failed, verdict === 'FAIL' ? 1000 : 0);
  }
});

test('invalid selections and numeric options fail before launching browsers', async () => {
  const suite = {name: 'validation', scenarios: [{id: 'form', modes: ['quick'], run() { throw Error('Must not run'); }}]};
  for (const options of [{seed: -1}, {seed: Infinity}, {seed: 2 ** 32}, {iterations: 0}, {iterations: 1.5},
    {mode: 'unknown'}, {scenarios: ['absent']}, {profiles: ['absent']}, {baseURL: 'file:///tmp'}]) {
    await assert.rejects(runSuite(suite, {...options, stdout: false}));
  }
  await assert.rejects(runSuite({...suite, scenarios: [...suite.scenarios, ...suite.scenarios]}), /unique/);
});

test('setup failure preserves an incomplete report and unexecuted cases', async () => {
  const previous = process.env.CHROMIUM_PATH;
  process.env.CHROMIUM_PATH = resolve(directory, 'missing-chromium.exe');
  try {
    const report = await runSuite({name: 'setup failure', scenarios: [{id: 'pending', modes: ['quick'], run() { throw Error('Must not run'); }}]},
      {root: directory, output: resolve(directory, 'setup-failure'), stdout: false});
    assert.equal(report.complete, false);
    assert.equal(report.verdict, 'FAIL');
    assert.deepEqual(report.cases.map(test => test.verdict), ['NOT RUN']);
    assert.ok(report.error);
    assert.equal(JSON.parse(readFileSync(report.reportPath)).complete, false);
  } finally {
    if (previous === undefined) delete process.env.CHROMIUM_PATH;
    else process.env.CHROMIUM_PATH = previous;
  }
});
