import {appendFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

export function silenceBrowserAudio() {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    this.muted = true;
    this.volume = 0;
    return play.apply(this, args);
  };
  if (globalThis.AudioNode) {
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (target, ...args) {
      if (target === this.context.destination) {
        const silent = this.context.createGain();
        silent.gain.value = 0;
        connect.call(silent, target);
        return connect.call(this, silent, ...args);
      }
      return connect.call(this, target, ...args);
    };
  }
  if (globalThis.speechSynthesis) {
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = utterance => { utterance.volume = 0; speak(utterance); };
  }
}

export function seedBrowserRandom(seed) {
  let state = seed;
  Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

export function createArtifacts(directory) {
  mkdirSync(directory, {recursive: true});
  const files = [], recent = [];
  let logBytes = 0, dropped = 0, pageErrors = 0;
  function path(name) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) throw Error('Artifact names must be plain filenames');
    const filename = resolve(directory, name);
    if (!files.includes(filename)) files.push(filename);
    return filename;
  }
  function log(type, message) {
    if (type === 'pageerror' || type === 'crash') pageErrors++;
    const entry = {type, message: String(message).slice(0, 2048)};
    recent.push(entry);
    if (recent.length > 64) recent.shift();
    const line = JSON.stringify(entry) + '\n';
    if (logBytes + Buffer.byteLength(line) <= 8 * 1024 * 1024) {
      appendFileSync(path('events.jsonl'), line);
      logBytes += Buffer.byteLength(line);
    } else dropped++;
  }
  return {
    directory, path, log,
    json(name, value) { writeFileSync(path(name), JSON.stringify(value, null, 2)); },
    screenshot(page, name = 'checkpoint.png') { return page.screenshot({path: path(name), timeout: 5000}); },
    summary() { return {files: [...files], recent: [...recent], logBytes, dropped, pageErrors}; }
  };
}

export async function browserMetrics(context, page) {
  let cdp;
  try {
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const {metrics} = await cdp.send('Performance.getMetrics');
    const dom = await cdp.send('Memory.getDOMCounters');
    const values = Object.fromEntries(metrics.map(metric => [metric.name, metric.value]));
    return {jsHeapUsedBytes: values.JSHeapUsedSize, jsHeapTotalBytes: values.JSHeapTotalSize, ...dom};
  } catch (error) {
    return {unavailable: error.message};
  } finally {
    if (cdp) await cdp.detach().catch(() => {});
  }
}

export function compactSummary(report) {
  const failed = report.cases.filter(test => test.verdict === 'FAIL');
  const summary = {
    verdict: report.verdict, complete: report.complete,
    passed: report.cases.filter(test => test.verdict === 'PASS').length,
    failed: failed.length, notRun: report.cases.filter(test => test.verdict === 'NOT RUN').length,
    elapsedMs: report.elapsedMs, runnerPeakRssBytes: report.runnerPeakRssBytes,
    largestEndHeapBytes: Math.max(0, ...report.cases.map(test => test.browserMemory?.jsHeapUsedBytes || 0)) || null,
    report: report.reportPath,
    failures: failed.slice(0, 8).map(test => ({scenario: test.scenario, profile: test.profile,
      error: (test.error || test.cleanupError)?.slice(0, 500), reproduce: test.reproduce})),
    ...(report.error ? {error: report.error.slice(0, 1000)} : {})
  };
  const budget = report.verdict === 'PASS' ? 4096 : 12288;
  let line = JSON.stringify(summary);
  while (Buffer.byteLength(line + '\n') > budget && summary.failures.length) {
    summary.failures.pop();
    summary.additionalFailuresInReport = true;
    line = JSON.stringify(summary);
  }
  if (Buffer.byteLength(line + '\n') > budget) {
    return JSON.stringify({verdict: report.verdict, complete: report.complete, report: report.reportPath.slice(-1500), details: 'See report'}) + '\n';
  }
  return line + '\n';
}
