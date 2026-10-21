import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';

const root = path.resolve(process.env.GERMANY_SIMULATOR_ROOT || process.cwd());
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const game = read('game.js');
const office = read('buergeramt.js');
const cast = JSON.parse(read('For-AI/VOICE-CAST.json'));
const storyContext = { window: {} };
vm.runInNewContext(read('buergeramt-story.js'), storyContext, { timeout: 3000 });
const story = storyContext.window.BuergeramtStory;
const libraryContext = { window: {} };
vm.runInNewContext(read('For-AI/AUDIO-TEXT-LIBRARY.js'), libraryContext, { timeout: 3000 });
const library = libraryContext.window.GermanySimulatorAudioText;
const fixedIds = [
  'amt-horst-stempelmann', 'amt-gisela-aktenberg', 'amt-dieter-papiermann',
  'amt-ruediger-nummermann', 'amt-ingrid-feierabend', 'amt-baerbel-pfennig',
  'amt-uwe-kopitz', 'amt-hilde-wartenscheidt', 'amt-konrad-wohnungszettel',
  'amt-mechthild-elternbogen', 'amt-wolfram-rentenbescheid',
  'polizei-heinrich-wachtmeister', 'verkehr-dieter-hupfer', 'merz', 'merkel'
];
const officeIds = new Set([
  ...Object.values(story.characters).map(row => row.voiceId),
  ...Object.values(story.patrons).map(row => row.voiceId)
]);
const cityText = new Map([
  ['polizei-heinrich-wachtmeister', Object.values(library.clips).find(row => row.voiceId === 'polizei-heinrich-wachtmeister')?.source],
  ['verkehr-dieter-hupfer', library.clips['traffic-germany-01']?.source],
  ['merz', Object.values(library.recordings).find(row => row.voiceId === 'merz')?.source],
  ['merkel', Object.values(library.recordings).find(row => row.voiceId === 'merkel')?.source]
]);

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const next = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, next < 0 ? undefined : next);
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function catalogWithPoliciesRemoved() {
  const copy = plain(library);
  for (const id of fixedIds) delete copy.productionVoices[id].fallback;
  return copy;
}

function cityFixture(activeLibrary, voice, text, browserVoices = []) {
  const spoken = [], timers = [], events = [];
  const item = { candidateVoiceId: voice, voiceKey: voice, text, family: 'caption-regression', start: () => events.push('start'), done: () => events.push('done') };
  const context = {
    window: { speechSynthesis: {} }, speechCatalog: activeLibrary, item, Math,
    performance: { now: () => 100 }, stimulusEligible: () => true, voiceHash: () => 0,
    clearTimeout: () => {}, clearInterval: () => {}, setInterval: () => 1,
    setTimeout: (callback, ms) => { timers.push({ callback, ms }); return timers.length; },
    speechSynthesis: { getVoices: () => browserVoices, speak: utterance => spoken.push(utterance), cancel: () => {} },
    SpeechSynthesisUtterance: class { constructor(value) { this.text = value; } },
    startSubtitle: row => events.push({ caption: row.text }), finishStimulus: row => row.done?.(),
    prepareRecording: () => Promise.reject(new Error('SIMULATED_MISSING_MEDIA_NO_FETCH'))
  };
  vm.createContext(context);
  vm.runInContext(`let activeStimulus=item,stimulusGeneration=1,stimulusTimer;
    ${functionSource(game, 'officialComputerVoice')}
    ${functionSource(game, 'playCaptionStimulus')}
    ${functionSource(game, 'playSyntheticStimulus')}
    ${functionSource(game, 'syncLockedDialogueAudioFocus')}
    ${functionSource(game, 'playRecordedStimulus')}`, context);
  return {
    spoken, timers, events, item,
    missing() { vm.runInContext('playSyntheticStimulus(item,1)', context); },
    async failedRecording() {
      item.recording = './SIMULATED_MISSING.mp3';
      vm.runInContext('playRecordedStimulus(item,1)', context);
      await new Promise(resolve => setImmediate(resolve));
    }
  };
}

function officeFixture(activeLibrary, voice, text, missing) {
  const spoken = [], timers = [], events = [];
  const lips = { start() {}, finish() {}, boundary() {}, pause() {}, resume() {} };
  const context = {
    window: { GermanySimulatorAudioText: activeLibrary, speechSynthesis: {} }, story: { clerks: {} }, text, voice, lips,
    attempt: 1, cue: 1, active: true, officeSpeechBusy: false, recordedSpeech: null, recordedCleanup: null,
    speechGateTimer: null, clerkSpeaking: false, clerkAnimation: null, hostVoiceStartupMs: null, hostVoiceAttempts: 0,
    mix: { voice: 1 }, line: { textContent: text }, speechReadableMs: () => 3500, timeScale: () => 1,
    performance: { now: () => 100 }, options: { voiceOn: () => true, cityAudioBusy: () => false },
    startOfficeSubtitle: value => events.push({ caption: value }), refreshSubtitle() {}, officeSubtitle: null,
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    defer: (callback, ms) => { const timer = { callback, ms, cancelled: false }; timers.push(timer); return timer; },
    clearTimer: timer => { if (timer) timer.cancelled = true; }, requestAnimationFrame: callback => callback(),
    speechSynthesis: { speak: utterance => spoken.push(utterance), cancel() {} },
    SpeechSynthesisUtterance: class { constructor(value) { this.text = value; } },
    Audio: class { constructor() { this.currentTime = 0; this.duration = 1; } play() { return Promise.reject(new Error('SIMULATED_MISSING_MEDIA_NO_AUDIO')); } pause() {} removeAttribute() {} load() {} },
    completed: mode => events.push({ completed: mode }), started: mode => events.push({ started: mode })
  };
  context.window.SpeechSynthesisUtterance = context.SpeechSynthesisUtterance;
  vm.createContext(context);
  vm.runInContext(`${functionSource(office, 'say')};say(text,completed,started,null,null,voice,${!missing})`, context);
  return { spoken, timers, events };
}

function officeRows() {
  return [
    ...Object.values(story.characters).map(character => ({ voiceId: character.voiceId, text: character.lines[0].line ?? character.lines[0].text })),
    ...Object.values(story.patrons).map(patron => ({ voiceId: patron.voiceId, text: patron.lines[0].line ?? patron.lines[0].text }))
  ];
}

test('all 15 active fixed-speaker bindings expose captions as their fallback policy', () => {
  assert.equal(fixedIds.length, 15);
  for (const id of fixedIds) {
    assert.equal(cast.productionVoices[id]?.fallback, 'captions', `${id} cast fallback`);
    assert.equal(library.productionVoices[id]?.fallback, 'captions', `${id} runtime fallback`);
  }
  assert.equal(officeIds.size, 11);
  assert.deepEqual([...officeIds].sort(), fixedIds.filter(id => id.startsWith('amt-')).sort());
});

test('city fixed voices use readable captions for missing clips and failed recording loads', async () => {
  for (const [voice, text] of cityText) {
    assert.ok(text, `current authored source text exists for ${voice}`);
    for (const failLoad of [false, true]) {
      const run = cityFixture(library, voice, text);
      if (failLoad) await run.failedRecording(); else run.missing();
      assert.equal(run.spoken.length, 0, `${voice} must not request browser speech`);
      assert.equal(run.item.subtitleMode, 'silent');
      assert.equal(run.events.filter(event => event === 'start').length, 1);
      assert.ok(run.events.some(event => event.caption === text), `${voice} exact current source caption`);
      const readableTimer = run.timers.at(-1);
      assert.ok(readableTimer.ms >= 3200 && readableTimer.ms <= 16000);
      readableTimer.callback();
      assert.equal(run.events.filter(event => event === 'done').length, 1);
    }
  }
});

test('the real office say helper captions all 11 current story roles on missing and failed recordings', async () => {
  const rows = officeRows();
  assert.equal(rows.length, 11);
  assert.deepEqual(new Set(rows.map(row => row.voiceId)), officeIds);
  for (const { voiceId, text } of rows) {
    assert.ok(text, `${voiceId} has authored current story text`);
    for (const missing of [true, false]) {
      const run = officeFixture(library, voiceId, text, missing);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(run.spoken.length, 0, `${voiceId} must not request generic speech`);
      assert.ok(run.events.some(event => event.caption === text), `${voiceId} exact story caption`);
      assert.ok(run.events.some(event => event.started === 'fallback'));
      const timer = run.timers.findLast(row => !row.cancelled);
      assert.ok(timer?.ms > 0);
      timer.callback();
      assert.equal(run.events.filter(event => event.completed === 'fallback').length, 1);
    }
  }
});

test('Merz and Merkel wrappers retain their IDs with both known and missing recorded lines', () => {
  for (const [name, id] of [['speakMerkelLine', 'merkel'], ['speakMerzLine', 'merz']]) {
    const text = Object.values(library.recordings).find(row => row.voiceId === id)?.source;
    assert.ok(text, `current story recording text for ${id}`);
    for (const hasRecording of [true, false]) {
      const calls = [];
      const context = {
        text,
        MERKEL_RECORDINGS: hasRecording ? { [text]: 'fixture-selected.mp3' } : {},
        MERZ_RECORDINGS: hasRecording ? { [text]: 'fixture-selected.mp3' } : {},
        speak: (value, options) => calls.push({ mode: 'generic-missing-path', value, options }),
        speakRecorded: (value, url, options) => calls.push({ mode: 'recorded-path', value, url, options })
      };
      vm.runInNewContext(`${functionSource(game, name)};${name}(text)`, context);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].value, text);
      assert.equal(calls[0].options.candidateVoiceId, id);
      assert.equal(calls[0].mode, hasRecording ? 'recorded-path' : 'generic-missing-path');
    }
  }
});

test('caption policies prevent generic city and office speech in a test-only counterfactual', async () => {
  const withoutPolicies = catalogWithPoliciesRemoved();
  const city = cityFixture(withoutPolicies, 'polizei-heinrich-wachtmeister', cityText.get('polizei-heinrich-wachtmeister'));
  city.missing();
  assert.equal(city.spoken.length, 1);
  const officeText = officeRows().find(row => row.voiceId === 'amt-horst-stempelmann').text;
  const officeRun = officeFixture(withoutPolicies, 'amt-horst-stempelmann', officeText, true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(officeRun.spoken.length, 1);
});

test('kriminalpolizei and narrator retain their documented non-fixed-caption exceptions', () => {
  assert.ok(cast.productionVoices.kriminalpolizei);
  assert.notEqual(cast.productionVoices.kriminalpolizei.fallback, 'captions');
  assert.notEqual(library.productionVoices.kriminalpolizei?.fallback, 'captions');
  assert.equal(cast.productionVoices.narrator, undefined);
  assert.equal(library.productionVoices.narrator, undefined);
  assert.equal(library.clips['kriminalpolizei-phone-01']?.voiceId, 'kriminalpolizei');
  assert.ok(library.speechFamilies?.amtPolice);
  const phone = read('buergeramt-phone.js');
  assert.match(phone, /kriminalpolizei-phone-/);
  assert.match(phone, /GermanyKripoSpeech/);
  assert.match(phone, /recordedClip|candidateClip/);
  const narrator = cityFixture(library, 'narrator', 'Bitte lesen Sie dieses Formular.', [{lang: 'de-DE', name: 'Microsoft Hedda', voiceURI: 'hedda', localService: true}]);
  narrator.missing();
  assert.equal(narrator.spoken.length, 1);
  assert.equal(narrator.spoken[0].text, 'Bitte lesen Sie dieses Formular.');
});
