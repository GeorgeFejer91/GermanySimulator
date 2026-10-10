import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:8793/index.html');
url.searchParams.set('geheim', 'buergeramt');

const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--mute-audio', '--use-gl=angle', '--use-angle=swiftshader']});
try {
  const page = await browser.newPage({viewport: {width: 1280, height: 800}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url.href, {waitUntil: 'commit', timeout: 60000});
  await page.waitForFunction(() => window.BuergeramtLevel?.active && window.Germany3D?.ready,
    null, {timeout: 180000});
  const cases = [
    {voiceId: 'amt-konrad-wohnungszettel', name: 'KONRAD WOHNUNGSZETTEL',
      line: 'Ich habe alle Unterlagen dabei. Hoffentlich reicht das.', x: -5.45, z: 2.5, viaZ: 3.05},
    {voiceId: 'amt-mechthild-elternbogen', name: 'MECHTHILD ELTERNBOGEN',
      line: 'Ich warte auf die Bestätigung für mein Kind.', x: 5.05, z: 2.5, viaZ: 4.8},
    {voiceId: 'amt-wolfram-rentenbescheid', name: 'WOLFRAM RENTENBESCHEID',
      line: 'Mein Bescheid ist seit drei Wochen unterwegs.', x: .7, z: -1.2, viaZ: 3.05},
  ];
  for (const expected of cases) {
    const result = await page.evaluate(({x, z, viaZ}) => {
      const level = BuergeramtLevel;
      const catalog = window.GermanySimulatorAudioText;
      let lookup = null;
      window.GermanySimulatorAudioText = {...catalog, candidateClip: (voiceId, text) => {
        lookup = {voiceId, text};
        return null;
      }};
      level.replay({cinematics: false, voiceOn: () => true, subtitlesOn: () => false});
      const realUpdate = level.update.bind(level);
      level.update = () => {};
      const step = () => realUpdate(1 / 60);
      const move = (key, reached) => {
        dispatchEvent(new KeyboardEvent('keydown', {code: key}));
        let count = 0;
        while (!reached() && count++ < 400) step();
        dispatchEvent(new KeyboardEvent('keyup', {code: key}));
        if (!reached()) throw new Error(`Could not reach ${key}: ${JSON.stringify(level.view)}`);
      };
      move('KeyW', () => level.stage === 'walk-sign' && level.view.z < 4.8);
      if (viaZ < 4) move('KeyW', () => level.view.z < viaZ);
      if (Math.abs(x) > .1) move(x < 0 ? 'KeyA' : 'KeyD', () => Math.abs(level.view.x - x) < .08);
      move('KeyW', () => level.view.z <= z + .07);
      step();
      const prompt = document.getElementById('amt-nearby').textContent;
      level.interact();
      const state = {prompt, stage: level.stage, speaker: document.getElementById('amt-speaker').textContent,
        line: document.getElementById('amt-line').textContent, moodId: level.characterMood?.id, lookup};
      document.querySelector('#amt-actions button')?.click();
      state.returnStage = level.stage;
      level.update = realUpdate;
      window.GermanySimulatorAudioText = catalog;
      return state;
    }, expected);
    assert.equal(result.stage, 'character', `${expected.voiceId} interaction`);
    assert.equal(result.moodId, expected.voiceId, `${expected.voiceId} cast identity`);
    assert.equal(result.speaker, expected.name, `${expected.voiceId} displayed name`);
    assert.equal(result.line, expected.line, `${expected.voiceId} spoken script`);
    assert.deepEqual(result.lookup, {voiceId: expected.voiceId, text: expected.line},
      `${expected.voiceId} exact clip lookup`);
    assert(result.prompt.includes(expected.name), `${expected.voiceId} proximity prompt`);
    assert.equal(result.returnStage, 'walk-sign', `${expected.voiceId} returns to the office`);
  }
  assert.deepEqual(errors, [], 'page errors');
  console.log(`Verified ${cases.length} static-patron interactions with exact cast identities and scripts`);
} finally {
  await browser.close();
}
