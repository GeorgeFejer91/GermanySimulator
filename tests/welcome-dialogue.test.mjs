import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js', import.meta.url), 'utf8');
function sourceOf(name) {
  const start = game.indexOf(`function ${name}(`);
  assert.notEqual(start, -1);
  let depth = 0;
  for (let i = game.indexOf('{', start); i < game.length; i++) {
    if (game[i] === '{') depth++;
    if (game[i] === '}' && --depth === 0) return game.slice(start, i + 1);
  }
  throw Error(`Unclosed ${name}`);
}
function briefing(region, voiceOn, lang) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {hidden: true, textContent: '', disabled: false, scrollTop: 99,
        classList: {toggle(name, on) {if (on) classes.add(name); else classes.delete(name)},
          contains: name => classes.has(name)}});
    }
    return elements.get(id);
  };
  const speech = [], stops = [], objectives = [];
  const state = {region, voiceOn, lang};
  const context = vm.createContext({window: {}, state,
    document: {getElementById: element, querySelector: element},
    stopSpeech: (...args) => stops.push(args), speak: (text, options) => speech.push({text, options}),
    STIMULUS_PRIORITY: {CRITICAL: 3}, toast: text => objectives.push(text),
    announceCurrentRule: () => objectives.push('rule'), updateHud() {},
    humorModal: element('humor-modal')});
  vm.runInContext(catalog, context);
  context.speechCatalog = context.window.GermanySimulatorAudioText;
  context.subtitleEnglish = new Map(Object.entries(context.window.GermanySimulatorAudioText.lines));
  vm.runInContext(['openDialogue', 'setDialogueVoiceBusy', 'speakDialogueLine', 'renderDialogue',
    'nextDialogue', 'openHumorWelcome', 'finishHumorCertification'].map(sourceOf).join('\n'), context);
  return {context, state, element, speech, stops, objectives};
}

for (const region of ['berlin', 'germany']) {
  for (const voiceOn of [true, false]) {
    test(`${region} welcome is readable and has two narrated pages, voice ${voiceOn}`, () => {
      const b = briefing(region, voiceOn, 'en');
      vm.runInContext('finishHumorCertification()', b.context);
      assert.equal(b.state.started, true);
      assert.equal(b.state.dialogueData.lines.length, 2);
      assert.equal(b.element('dialogue').hidden, false, 'text must appear before speech starts');
      assert.equal(b.element('dialogue').classList.contains('welcome'), true);
      assert.equal(b.element('dialogue-next').textContent, 'NEXT');
      assert.equal(b.element('dialogue-next').disabled, false);
      assert.equal(b.element('.dialogue-copy').scrollTop, 0);
      assert.match(b.element('dialogue-text').textContent, /drei.*Behördentagen/);
      assert.equal(b.speech.length, 1, 'the first page must request automatic narration');
      assert.equal(b.speech[0].text, b.element('dialogue-text').textContent);
      assert.match(b.speech[0].options.subtitle, /three.*days of administration/);
      assert.deepEqual(b.objectives, [], 'the objective must wait for the second advance');
      const staleDone = b.speech[0].options.done;
      vm.runInContext('nextDialogue()', b.context);
      assert.equal(b.state.dialogueData.i, 1);
      assert.equal(b.element('dialogue').hidden, false);
      assert.equal(b.element('dialogue-next').textContent, 'NEXT');
      assert.match(b.element('dialogue-text').textContent, /Polizeistern.*Zebrastreifen.*Brandmauer/);
      assert.equal(b.speech.length, 2);
      assert.equal(b.speech[1].text, b.element('dialogue-text').textContent);
      assert.match(b.speech[1].options.subtitle, /police star.*zebra crossing.*Brandmauer/);
      assert.equal(b.stops.length, voiceOn ? 2 : 1, 'Next cancels active narration');
      staleDone();
      assert.equal(b.state.dialogueVoiceBusy, voiceOn, 'old completion cannot release the new voice');
      vm.runInContext('nextDialogue();nextDialogue()', b.context);
      assert.equal(b.state.dialogue, false);
      assert.equal(b.state.modal, false);
      assert.equal(b.element('dialogue').hidden, true);
      assert.deepEqual(b.objectives, ['ERSTER VORGANG · BÜRGERAMT', 'rule']);
      assert.equal(b.speech.length, 2, 'there must be no third welcome page');
    });
  }
}

test('ordinary dialogue keeps its existing speech-start presentation after the welcome', () => {
  const b = briefing('berlin', true, 'de');
  vm.runInContext('openHumorWelcome();nextDialogue();nextDialogue();openDialogue("AMT",["Ein Satz."],"§")', b.context);
  assert.equal(b.element('dialogue').classList.contains('welcome'), false);
  assert.equal(b.element('dialogue').hidden, true);
  assert.equal(b.element('dialogue-next').textContent, 'VERSTANDEN');
  b.speech.at(-1).options.start();
  assert.equal(b.element('dialogue').hidden, false);
});
