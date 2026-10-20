import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {startupScenarios, startupSourceFiles} from './playtest-preload.mjs';
import {buildingScenario} from './playtest-building-levels.mjs';
import {inputScenario} from './playtest-input-recovery.mjs';
import {keyboardScenarios} from './playtest-keyboard-access.mjs';

export default {
  name: 'Germany Simulator development checks',
  scenarios: [...startupScenarios, inputScenario, buildingScenario,...keyboardScenarios],
  sourceFiles(root) {
    const files = ['jobcenter.js','street-character-sprites.js','neighbor-sprites.js','buergeramt-link.js','buergeramt-gaussian-scene.js','buergeramt-painted-anchor.js','buergeramt-gaussian-animation.js','assets/models/satire-kit/loader.js', 'building-levels.js', 'building-catalogue.js', 'modal-focus.js', 'game-hud.js', 'level-transitions.js', 'level-transition-effects.js', 'buergeramt.js',
      'tools/browser-harness.mjs', 'tools/browser-diagnostics.mjs', 'tools/browser-game-suite.mjs',
      'tools/playtest-preload.mjs', 'tools/playtest-building-levels.mjs', 'tools/playtest-input-recovery.mjs', 'tools/playtest-keyboard-access.mjs'];
    return {...startupSourceFiles(root), ...Object.fromEntries(files.map(file => [file,
      createHash('sha256').update(readFileSync(file.startsWith('tools/')?new URL('../'+file,import.meta.url):resolve(root,file))).digest('hex')]))};
  },
  limits: ['Developer diagnostics; not a replacement for release budgets, natural mission proof, visual review or physical-device checks',
    'Source hashes identify local files; --base-url may serve a different build',
    'Lifecycle includes staged scene placement, forced exit, synthetic hidden/resume and injected capture failure']
};
