import { readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const id = 'crowd-brigitte-bueroklammer';
const own = `assets/sprite-sources/resident-motion/${id}/adult-v1/`;
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const save = (name, value) => writeFileSync(own + name, JSON.stringify(value, null, 2) + '\n');
const registryPath = 'assets/characters/street/manifest.json';
const oldMotionPath = `assets/characters/residents/${id}/manifest.json`;
const oldSpecPath = 'assets/sprite-sources/resident-motion/crowd-motion-spec.json';
const person = JSON.parse(readFileSync(registryPath)).characters[id];
const oldMotion = JSON.parse(readFileSync(oldMotionPath));
const oldSpec = JSON.parse(readFileSync(oldSpecPath)).characters[id];
save('pre-admission-person.json', person);
save('pre-admission-motion.json', oldMotion);
save('pre-admission-source.json', oldSpec);
save('pre-admission-family.json', {
  character: id,
  publishedPresentation: 'standingOnly; no selected published locomotion family',
  sourceAuthority: oldMotionPath,
  sourceSha256: sha(oldMotionPath),
  legacyUnselectedCycleDistance: oldMotion.cycle_distance,
  interactions: oldMotion.interactions,
  settingsSource: 'tools/build-resident-motion.py',
  settingsSourceSha256: sha('tools/build-resident-motion.py'),
  quietSettings: {
    idle: { sway_pixels: 1.2, nod_pixels: 1, lift_pixels: 0 },
    look: { sway_pixels: 4, nod_pixels: 4, lift_pixels: 0 },
    success: { sway_pixels: 2, nod_pixels: -3, lift_pixels: 10 },
    failure: { sway_pixels: 4, nod_pixels: 4, lift_pixels: 0 }
  }
});
copyFileSync(oldSpec.source, own + 'identity-original.png');
const context = { window: {} };
vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js', 'utf8'), context);
const catalog = context.window.GermanySimulatorAudioText;
const recordings = Object.entries(catalog.recordings).filter(([, clip]) => clip.voiceId === id);
const files = ['For-AI/AUDIO-TEXT-LIBRARY.js', 'For-AI/VOICE-CAST.json', ...readdirSync('assets/voices/candidate-dialogue').filter(name => name.startsWith(id + '-')).map(name => 'assets/voices/candidate-dialogue/' + name)];
save('voice-baseline.json', {
  id, profileId: catalog.productionVoices[id].profileId,
  selectedRecordingCount: recordings.length,
  selectedRecordings: recordings.map(([file, clip]) => ({ file, sha256: clip.sha256, source: clip.source, mouthHz: clip.mouthHz ?? null })),
  hashes: Object.fromEntries(files.map(path => [path, sha(path)])),
  policy: 'No voice, recording, visible line or audio catalog change authorized for this art packet.'
});
const pins = [registryPath, oldMotionPath, oldSpecPath, oldSpec.source, 'tools/build-resident-motion.py', 'game.js', 'world3d.js', 'street-character-sprites.js',
  'assets/characters/bayern/manifest.json', 'assets/characters/bayern/character-atlas.png',
  'assets/tourists/towelMan/manifest.json', 'assets/tourists/towelMan/character-atlas.png',
  'assets/tourists/towelWoman/manifest.json', 'assets/tourists/towelWoman/character-atlas.png'];
save('baseline-hashes.json', { base: '78e86bc1c878fe95c757906f1a84dc58c2ed1309', files: Object.fromEntries(pins.map(path => [path, sha(path)])) });
console.log(JSON.stringify({ id, own, selectedRecordingCount: recordings.length, baselineFiles: pins.length }));
