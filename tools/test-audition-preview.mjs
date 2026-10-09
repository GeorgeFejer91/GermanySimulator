import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'For-AI/AUDIO-TEXT-LIBRARY.js'), 'utf8');
const candidate = JSON.parse(readFileSync(resolve(root, 'assets/voices/candidate-dialogue/manifest.json'), 'utf8'));
const auditionPaths = new Set(['assets/voices/profile-auditions/manifest.json',
  'assets/voices/quiz-segments/manifest.json']);
const imported = candidate.clips.filter(clip => auditionPaths.has(clip.provenanceManifest));
assert.equal(imported.length, 13);

function catalog(search) {
  const context = {window: {}, location: {search}, URLSearchParams};
  vm.runInNewContext(source, context, {timeout: 3000});
  return context.window.GermanySimulatorAudioText;
}

const normal = catalog('');
const preview = catalog('?voicePreview=1');
for (const clip of imported) {
  assert.equal(normal.candidateClip(clip.voiceId, clip.text), null,
    `Default playback must not select ${clip.clipId}`);
  assert.equal(preview.candidateClip(clip.voiceId, clip.text), clip.path,
    `Opt-in playback must find ${clip.clipId}`);
}
const quiz = JSON.parse(readFileSync(resolve(root, 'assets/voices/quiz-segments/manifest.json'), 'utf8'));
const segments = quiz.clips.map(clip => clip.text);
assert.equal(normal.candidateSequence('quiz-brigitte-neumann', segments), null);
assert.equal(JSON.stringify(preview.candidateSequence('quiz-brigitte-neumann', segments)),
  JSON.stringify(quiz.clips.map(clip => clip.path)));
assert.equal(preview.candidateSequence('quiz-dietmar-schulz',
  [imported.find(clip => clip.voiceId === 'quiz-dietmar-schulz').text, 'missing context', 'missing question']), null);
console.log(JSON.stringify({reviewCandidates: imported.length, default: 'gated',
  brigitteQuizPreview: 'three segments', incompleteQuiz: 'browser fallback'}));
