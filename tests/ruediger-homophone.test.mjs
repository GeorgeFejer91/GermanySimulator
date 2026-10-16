// Exact-pilot homophone projection and admission regression checks.
// Synthetic metadata exercises the real pure projection and unchanged cue gate.
// It cannot prove original receipt/audio/authority/terminal byte admission.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const source = readFileSync(new URL('../tools/curate-voice-library.mjs', import.meta.url), 'utf8');
const beginMarker = '// BEGIN exact Ruediger pilot homophone projection v1';
const endMarker = '// END exact Ruediger pilot homophone projection v1';
function sourceBetween(start, end) {
  const at = source.indexOf(start);
  assert.ok(at >= 0, `Missing production source anchor: ${start}`);
  assert.equal(source.indexOf(start, at + start.length), -1, `Duplicate production anchor: ${start}`);
  const stop = source.indexOf(end, at + start.length);
  assert.ok(stop > at, `Missing production end anchor: ${end}`);
  return source.slice(at, stop);
}

const projectionSource = sourceBetween(beginMarker, endMarker).replace(/^export /gm, '');
const cueSource = sourceBetween('function crowdExactCues(clip){', beginMarker);
function loadProduction(extraGlobals = {}, includeAdmission = false) {
  const context = vm.createContext({
    createHash,
    requireMatch: (condition, why) => { if (!condition) throw Error(why); },
    sameJson: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    ...extraGlobals,
  });
  const admissionSource = includeAdmission ? [
    sourceBetween('// BEGIN exact Ruediger pilot homophone admission v1', '// END exact Ruediger pilot homophone admission v1'),
    sourceBetween('export function matchesProduction(', 'export function writeArchiveMetadata('),
    sourceBetween('const crowdPublicJobFields=', 'function crowdPublicClip('),
    sourceBetween('export function verifyCrowdGenerationManifestLedger(', 'function crowdRemainingClipAuthority('),
  ].join('\n').replace(/^export /gm, '') : '';
  new vm.Script(`${cueSource}\n${projectionSource}\n${admissionSource}\n` +
    'globalThis.projectionUnderTest = projectRuedigerPilotHomophoneCues;\n' +
    'globalThis.collectorUnderTest = collectRuedigerPilotHomophoneProjection;\n' +
    'globalThis.cueGateUnderTest = crowdExactCues;\n' +
    (includeAdmission ? 'globalThis.sidecarUnderTest = ruedigerPilotHomophoneProjectionAuthority;\n' +
      'globalThis.clipAuthorityUnderTest = ruedigerPilotHomophoneClipAuthority;\n' +
      'globalThis.manifestAuthorityUnderTest = ruedigerPilotHomophoneManifestAuthority;\n' +
      'globalThis.prepareUnderTest = prepareRuedigerPilotHomophoneManifest;\n' +
      'globalThis.manifestLedgerUnderTest = verifyCrowdGenerationManifestLedger;\n' : ''),
    { filename: 'extracted-pilot-homophone-production-source.mjs' }).runInContext(context);
  return context;
}
// Pure cases receive no process, require, fetch, media, filesystem or ledger capability.
const context = loadProduction();
const project = context.projectionUnderTest;
const exactCues = context.cueGateUnderTest;

const TEXT = 'Die Rasenkante ist not an invitation; your Schuh steht im Zuständigkeitsbereich.';
const HEARD = 'Die Rasenkante ist not an invitation; your shoe steht im Zuständigkeitsbereich.';
const WORDS = ['Die', 'Rasenkante', 'ist', 'not', 'an', 'invitation', 'your', 'Schuh', 'steht', 'im', 'Zuständigkeitsbereich'];
const OFFSETS = [0, 4, 15, 19, 23, 26, 38, 43, 49, 55, 58];
// Deliberately retain sub-millisecond precision to catch timestamp rounding.
const TIMES = [[.04125, .19125], [.23125, .69125], [.72125, .90125],
  [.93125, 1.13125], [1.16125, 1.29125], [1.32125, 1.88125],
  [1.91125, 2.14125], [2.17125, 2.43125], [2.46125, 2.70125],
  [2.73125, 2.89125], [2.92125, 3.75125]];
const sha = value => createHash('sha256').update(value).digest('hex');
const expectedCues = () => WORDS.map((word, index) => ({
  at: TIMES[index][0], end: TIMES[index][1], charIndex: OFFSETS[index], word,
}));

function assertUnchanged(clip, action) {
  const snapshot = structuredClone(clip);
  const serialized = JSON.stringify(clip);
  const digest = sha(serialized);
  try {
    return action();
  } finally {
    assert.deepEqual(clip, snapshot, 'The original receipt object must not be mutated');
    assert.equal(JSON.stringify(clip), serialized, 'The original fixture serialization must remain exact');
    assert.equal(sha(JSON.stringify(clip)), digest, 'The original fixture serialization hash must remain exact');
  }
}

function rejectMutation(mutate, message) {
  const clip = validClip();
  mutate(clip);
  assertUnchanged(clip, () => assert.throws(() => project(clip), undefined, message));
}

function assertProjection(clip) {
  const projected = assertUnchanged(clip, () => project(clip));
  assert.equal(projected.verificationMode, 'full-encoded-parent-single-token-homophone');
  assert.equal(projected.asrWordExact, false);
  assert.equal(projected.asrLiteralWordExact, false);
  assert.equal(projected.originalStrictParentGate, false);
  assert.equal(projected.asrHomophoneWordEquivalent, true);
  assert.equal(projected.selectedBeamSize, 5);
  assert.deepEqual(structuredClone(projected.projection), {
    tokenIndex: 7, charIndex: 43, charEndExclusive: 48, heard: 'shoe', authored: 'Schuh',
  });
  assert.deepEqual(structuredClone(projected.wordCues), expectedCues());
  assert.equal(projected.wordCues.length, 11);
  for (let index = 0; index < 11; index++) {
    assert.equal(projected.wordCues[index].at, TIMES[index][0]);
    assert.equal(projected.wordCues[index].end, TIMES[index][1]);
  }
  assert.equal(clip.asrWordExact, false);
  assert.equal(clip.asrLiteralWordExact, false);
  assert.equal(clip.codeSwitchStrictParentGate, false);
  assert.deepEqual(clip.wordCues, []);
  return projected;
}

// These public identity constants come from the fixed pilot source contract.
// All raw/trace/diagnostic hashes and durations below are synthetic, not reads.
const ID = Object.freeze({
  clipId: 'crowd-ruediger-rasenkante-berlin-01',
  voiceId: 'crowd-ruediger-rasenkante',
  profileId: '3cc9340471d3480ba090545b5a9024c9',
  textSha256: 'aa38b8c45fb36b873a247cd9ad75f611be84ab3376f897ecf7013063a304da0b',
  referenceSha256: '8db1f5eae831948b72cdc608f3bf358592369b70a4bb27aab102ecb27c23a8f1',
  referenceOriginalSha256: '5f3d748de3d95a8090b3d506cf2cf47358d2e7b079e661a1ac186959a2513636',
  requestSha256: '0c923bbaf40e409b31b3f15062143e7bff4429384d4df2ab53bcfc77e93ad5ce',
  authoredPlanSha256: '81b201157323b499e4b7aea3af2b7320532d754ecfbcc12db362555e9014f516',
  pilotPlanSha256: 'a2435147eaac1b3f390ace42102ede200b7b847b52c5957b4a2488943eee05ab',
  authoringHelperSha256: 'c946668c0bc7b4f2e6b689cb24cd7edcf3c935cdffdf13bd860e24d0aad53230',
  sha256: '77da21c122e47c5bf7ab834b2c2caace42f8d82df638fa28acb33a5cfb181606',
  renderer: 'ResembleAI/Chatterbox Multilingual V2 0.1.7',
  modelRevision: '5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18',
});
const SEGMENT_HELPER = '07c729b4a15753de37ca526c03e80c6a19b3346235936857cb97ac0d0b3d8bfb';
const ASR_MODEL = 'e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da';
const AUTHORITY_SHA = '39d1efea1fe2658d806a23b86bbbbd4996caf97cfbcdfd2222e24e4726779618';
const TERMINAL_SHA = '6048d6fdbca3d1e1f4d3f0a4ac429139e59b5a5663655243d95183ec430300e3';
const SEGMENTS = [
  { text: 'Die Rasenkante ist', sourceStart: 0, sourceEnd: 18, languageId: 'de' },
  { text: 'not an invitation; your Schuh', sourceStart: 19, sourceEnd: 48, languageId: 'en' },
  { text: 'steht im Zuständigkeitsbereich.', sourceStart: 49, sourceEnd: 80, languageId: 'de' },
];

function validClip() {
  const parts = SEGMENTS.map((segment, index) => {
    const eosTraceSha256 = sha(`synthetic trace ${index}`);
    return {
      ...segment, clipId: `${ID.clipId}-codeswitch-pilot-part-${String(index + 1).padStart(2, '0')}`,
      voiceId: ID.voiceId, profileId: ID.profileId, referenceSha256: ID.referenceSha256,
      authoringHelperSha256: SEGMENT_HELPER, renderer: ID.renderer, modelRevision: ID.modelRevision,
      rendererInputText: segment.text, seed: 71000 + index, synthesisAttempt: 1,
      rawSampleRateHz: 24000, rawChannels: 1, encodedSampleRateHz: 48000, encodedChannels: 1,
      asrDiagnosticOnly: true, asrLanguageId: segment.languageId, asrScriptPrompt: null,
      asrModelSha256: ASR_MODEL,
      // English mismatch remains diagnostic. It is never required to be literal-exact.
      asr: index === 1 ? 'Not an invitation, your shoe!' : segment.text,
      rawSha256: sha(`synthetic raw PCM ${index}`), encodedSha256: sha(`synthetic segment MP3 ${index}`),
      eosTraceSha256, rawReceiptSha256: sha(`synthetic raw JSON ${index}`),
      diagnosticReceiptSha256: sha(`synthetic diagnostic JSON ${index}`), eosReached: true,
      decode: { eosReached: true, eosTraceSha256, attentionHooksBefore: 0, attentionHooksAfter: 0,
        generatedSpeechTokens: 100, maxSpeechTokens: 300 },
      synthesis: { languageId: segment.languageId, device: 'cuda', precision: 'fp16',
        t3WeightPrecision: 'float16', conditioningPrecision: 'float32',
        referenceReconditionedForProfile: ID.profileId, referenceConditioningVerifiedFloat32: true,
        exaggeration: .5, temperature: .65, repetitionPenalty: 3, cfgWeight: .6,
        cpuThreads: 2, inferenceMode: true },
    };
  });
  const rawSha256 = sha('synthetic full joined PCM');
  return {
    ...ID, text: TEXT, actorId: ID.voiceId, region: 'berlin', slot: 0,
    sourceLocator: 'game.js crowdCharacterBarks[crowd-ruediger-rasenkante].berlin[0]',
    codeSwitchParent: true, phaseScope: 'new code-switch diagnostic phase', processing: null,
    synthesisAttempt: 0,
    synthesisAttemptBasis: 'joined diagnostic segments; no whole-parent TTS call or first-take claim',
    asrWordExact: false, asrLiteralWordExact: false, codeSwitchStrictParentGate: false, wordCues: [],
    sampleRateHz: 48000, channels: 1, bitrateBitsPerSecond: 128000, bytes: 64000,
    durationSeconds: 3.8, integratedLufs: -18.02, truePeakDbtp: -1.7, rawSha256,
    decode: { eosReached: true, allSegmentEosObserved: true,
      basis: 'three separate segment native EOS observations; joined parent is not a native model call' },
    segments: SEGMENTS.map((segment, index) => ({ ...segment, index, joinBefore: index ? ' ' : '' })),
    codeSwitchParts: parts,
    codeSwitchJoin: {
      method: 'existing FFmpeg concat of ordered dry 24 kHz mono segment PCM',
      sampleRateHz: 24000, channels: 1, insertedSilence: false, crossfade: false, edit: false,
      filterGraph: '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
      joinedPcmSha256: rawSha256, ffmpegSha256: sha('synthetic FFmpeg'), ffprobeSha256: sha('synthetic FFprobe'),
      segmentPcmSha256: parts.map(part => part.rawSha256),
    },
    codeSwitchParentContinuation: {
      selector: '--continue-code-switch-parent', segmentAuthoringHelperSha256: SEGMENT_HELPER,
      parentAuthoringHelperSha256: ID.authoringHelperSha256,
      ledgerSha256BeforeParentAsr: sha('synthetic immutable six-claim prefix'),
      segmentDiagnosticReceiptSha256: parts.map(part => part.diagnosticReceiptSha256),
    },
    asr: HEARD, asrLanguageId: 'de', asrDevice: 'cpu', asrCpuThreads: 1,
    asrComputeType: 'int8', asrEffectiveComputeType: 'int8_float32', asrModelSha256: ASR_MODEL,
    asrScriptPrompt: null, asrBeamSize: 5,
    asrReadings: [1, 5].map(beamSize => ({
      beamSize, transcript: HEARD, transcribeSeconds: .25,
      words: WORDS.map((word, index) => ({ word: index === 7 ? ' shoe' : ` ${word}`,
        // A different first-beam clock exposes accidental use of the wrong reading.
        start: TIMES[index][0] + (beamSize === 1 ? .003 : 0),
        end: TIMES[index][1] + (beamSize === 1 ? .003 : 0) })),
      inputScope: 'full encoded parent', encodedSha256: ID.sha256, asrModelSha256: ASR_MODEL,
      languageId: 'de', device: 'cpu', cpuThreads: 1, computeType: 'int8',
      effectiveComputeType: 'int8_float32', scriptPrompt: null, wordTimestamps: true,
    })),
  };
}

function setField(clip, path, value) {
  const keys = path.split('.');
  const key = keys.pop();
  const owner = keys.reduce((item, part) => item[part], clip);
  owner[key] = value;
}

function rejectionCases(name, cases) {
  test(name, async t => {
    for (const [label, mutate] of cases) {
      await t.test(label, () => rejectMutation(mutate, label));
    }
  });
}

function fieldCases(entries) {
  return entries.map(([path, value]) => [path, clip => setField(clip, path, value)]);
}

function changeHeardTokens(clip, mutate) {
  const tokens = WORDS.map((word, index) => index === 7 ? 'shoe' : word);
  mutate(tokens);
  const transcript = tokens.join(' ');
  clip.asr = transcript;
  for (const reading of clip.asrReadings) reading.transcript = transcript;
  // Keep transcript/row agreement so a lexical rejection cannot be attributed
  // only to stale row labels. Counts and permitted words must hold independently.
  clip.asrReadings[1].words = tokens.map((word, index) => ({
    word, start: TIMES[index]?.[0] ?? 3.78, end: TIMES[index]?.[1] ?? 3.79,
  }));
}

test('one named token projects eleven authored cues without changing failed evidence', () => {
  const clip = validClip();
  const first = assertProjection(clip);
  assert.equal(first.wordCues[7].word, 'Schuh');
  assert.equal(clip.asrReadings[1].words[7].word, ' shoe');
  assert.equal(clip.codeSwitchParts[1].asr, 'Not an invitation, your shoe!');
  assert.equal(Object.hasOwn(first, 'qualified'), false, 'Pure projection is not byte-bound admission');
  assert.notEqual(first.publicationAuthorized, true);
  first.wordCues[7].word = 'mutated returned value';
  assertProjection(clip); // No returned-array alias or persistent projection state.
});

test('ordinary ASR case and punctuation variations preserve the same one-token projection', () => {
  const clip = validClip();
  clip.asrReadings[0].transcript = 'DIE, Rasenkante ist: not an invitation — your SHOE steht im Zuständigkeitsbereich!';
  clip.asrReadings[1].transcript = 'Die Rasenkante ist not an invitation; your shoe steht im Zuständigkeitsbereich.';
  clip.asr = clip.asrReadings[1].transcript;
  for (const row of clip.asrReadings[1].words) row.word = ` (${row.word.trim().toUpperCase()})! `;
  assertProjection(clip);
  clip.asrEffectiveComputeType = 'int8';
  for (const reading of clip.asrReadings) reading.effectiveComputeType = 'int8';
  assertProjection(clip);
});

test('ordinary exact cue validation remains exact and does not invent a homophone mode', () => {
  const ordinary = { text: 'Schuh steht.', durationSeconds: 1,
    wordCues: [{ word: 'Schuh', charIndex: 0, at: .1, end: .4 },
      { word: 'steht', charIndex: 6, at: .4, end: .8 }] };
  const before = structuredClone(ordinary);
  assert.equal(exactCues(ordinary), undefined);
  assert.deepEqual(ordinary, before);
  ordinary.wordCues[0].word = 'shoe';
  assert.throws(() => exactCues(ordinary));
  assert.throws(() => project(before), /identity|owner|metadata/i);
});

test('missing and non-record inputs cannot enter the named path', () => {
  for (const value of [undefined, null, [], 'receipt', 1, false]) {
    assert.throws(() => project(value), /metadata/);
  }
});

rejectionCases('fixed identity, source and plan mappings cannot be borrowed or substituted', [
  ...Object.keys(ID).map(key => [key, clip => { clip[key] = `${clip[key]}-changed`; }]),
  ...fieldCases([
    ['actorId', 'crowd-another-person'], ['region', 'germany'], ['slot', 1],
    ['sourceLocator', 'game.js crowdCharacterBarks[crowd-ruediger-rasenkante].berlin[1]'],
    ['text', TEXT.replace('Schuh', 'shoe')], ['codeSwitchParent', false],
    ['phaseScope', 'ordinary crowd'], ['processing', 'different process'], ['synthesisAttempt', 1],
    ['synthesisAttemptBasis', 'native whole-parent generation'],
  ]),
  ['changed source punctuation with a correspondingly refreshed hash', clip => {
    clip.text = TEXT.replace(';', ','); clip.textSha256 = sha(clip.text);
  }],
  ['authored request cannot stand in for private parent plan', clip => {
    clip.requestSha256 = ID.authoredPlanSha256;
  }],
]);

rejectionCases('original failed exactness, empty cues and absent editing claims are preserved', [
  ...['asrWordExact', 'asrLiteralWordExact', 'codeSwitchStrictParentGate'].flatMap(key => [
    [`${key}=true`, clip => { clip[key] = true; }],
    [`${key} absent`, clip => { delete clip[key]; }],
  ]),
  ['prepopulated cues', clip => { clip.wordCues = expectedCues(); }],
  ['null cue array', clip => { clip.wordCues = null; }],
  ...['deliveryEditing', 'recognitionVerification', 'rescueParts', 'benchmarkOnly', 'actualInferenceText']
    .map(key => [`${key} even if false`, clip => { clip[key] = false; }]),
  ...fieldCases([['listeningVerified', true], ['listeningConfirmed', true]]),
]);

rejectionCases('complete retained beam history and summary are required', [
  ['beams reordered', clip => { clip.asrReadings.reverse(); }],
  ['only beam 1', clip => { clip.asrReadings.pop(); }],
  ['third reading', clip => { clip.asrReadings.push(structuredClone(clip.asrReadings[1])); }],
  ['selected beam 1', clip => { clip.asrBeamSize = 1; }],
  ['summary differs from selected transcript', clip => { clip.asr += ' extra'; }],
  ['first transcript has a second discrepancy', clip => {
    clip.asrReadings[0].transcript = HEARD.replace('steht', 'stand');
  }],
]);

rejectionCases('parent ASR recipe cannot supply prompts or change model, language or compute', [
  ...fieldCases([
    ['asrLanguageId', 'en'], ['asrDevice', 'cuda'], ['asrCpuThreads', 2],
    ['asrComputeType', 'float32'], ['asrEffectiveComputeType', 'float32'],
    ['asrModelSha256', sha('different ASR')], ['asrScriptPrompt', TEXT],
  ]),
  ['missing explicit no-prompt field', clip => { delete clip.asrScriptPrompt; }],
  ...['prompt', 'initial_prompt', 'initialPrompt', 'prefix', 'hotwords']
    .map(key => [`unexpected ${key}`, clip => { clip[key] = null; }]),
]);

rejectionCases('each retained reading must carry the complete original full-parent recipe', [
  ...[0, 1].flatMap(index => fieldCases([
    [`asrReadings.${index}.inputScope`, 'segment diagnostic'],
    [`asrReadings.${index}.encodedSha256`, sha('another encoded file')],
    [`asrReadings.${index}.asrModelSha256`, sha('another decoder')],
    [`asrReadings.${index}.languageId`, 'en'], [`asrReadings.${index}.device`, 'cuda'],
    [`asrReadings.${index}.cpuThreads`, 2], [`asrReadings.${index}.computeType`, 'float32'],
    [`asrReadings.${index}.effectiveComputeType`, 'int8'],
    [`asrReadings.${index}.scriptPrompt`, TEXT], [`asrReadings.${index}.wordTimestamps`, false],
    [`asrReadings.${index}.transcribeSeconds`, NaN], [`asrReadings.${index}.words`, null],
  ])),
  ['unknown retained prompt field', clip => { clip.asrReadings[1].hotwords = 'Schuh'; }],
  ['missing retained field', clip => { delete clip.asrReadings[0].scriptPrompt; }],
]);

rejectionCases('the one discrepancy must be shoe at token seven and no other word', [
  ...['shoes', 'shoo', 'Schuh', 'boot', 'Schuhe'].map(word => [word, clip => {
    changeHeardTokens(clip, tokens => { tokens[7] = word; });
  }]),
  ...[[2, 'is'], [6, 'ihr'], [8, 'stand']].map(([index, word]) => [`extra mismatch at ${index}`, clip => {
    changeHeardTokens(clip, tokens => { tokens[index] = word; });
  }]),
  ['missing negation', clip => { changeHeardTokens(clip, tokens => tokens.splice(3, 1)); }],
  ['duplicate shoe', clip => { changeHeardTokens(clip, tokens => tokens.splice(7, 0, 'shoe')); }],
  ['extra trailing word', clip => { changeHeardTokens(clip, tokens => tokens.push('bitte')); }],
  ['shoe at the wrong index', clip => {
    changeHeardTokens(clip, tokens => { [tokens[6], tokens[7]] = [tokens[7], tokens[6]]; });
  }],
]);

rejectionCases('selected timing rows cannot be split, merged, relabelled or supplemented', [
  ['missing row', clip => { clip.asrReadings[1].words.splice(4, 1); }],
  ['extra row', clip => { clip.asrReadings[1].words.push({ word: 'extra', start: 3.77, end: 3.79 }); }],
  ['two lexical tokens in one row', clip => { clip.asrReadings[1].words[7].word = 'your shoe'; }],
  ['no lexical token in row', clip => { clip.asrReadings[1].words[7].word = '...'; }],
  ['row token differs from transcript', clip => { clip.asrReadings[1].words[7].word = 'boot'; }],
  ['extra row field', clip => { clip.asrReadings[1].words[7].confidence = 1; }],
  ['missing start', clip => { delete clip.asrReadings[1].words[7].start; }],
  ['null row', clip => { clip.asrReadings[1].words[7] = null; }],
]);

rejectionCases('the unchanged cue geometry rejects invalid or overlapping retained intervals', [
  ...[NaN, Infinity, -Infinity, '0.1'].map(value => [`invalid start ${String(value)}`, clip => {
    clip.asrReadings[1].words[0].start = value;
  }]),
  ...[NaN, Infinity, -Infinity, '0.2'].map(value => [`invalid end ${String(value)}`, clip => {
    clip.asrReadings[1].words[0].end = value;
  }]),
  ['negative start', clip => { clip.asrReadings[1].words[0].start = -.01; }],
  ['zero interval', clip => { clip.asrReadings[1].words[0].end = TIMES[0][0]; }],
  ['backward interval', clip => { clip.asrReadings[1].words[0].end = 0; }],
  ['overlap', clip => { clip.asrReadings[1].words[1].start = TIMES[0][1] - .001; }],
  ['reordered intervals with unchanged word order', clip => {
    const rows = clip.asrReadings[1].words;
    [rows[0].start, rows[0].end, rows[1].start, rows[1].end] = [rows[1].start, rows[1].end, rows[0].start, rows[0].end];
  }],
  ['end beyond original duration tolerance', clip => { clip.asrReadings[1].words[10].end = clip.durationSeconds + .051; }],
]);

rejectionCases('duration, encoded format and finite levels are independent gates', [
  ...[undefined, null, 0, -1, NaN, Infinity].map(value => [`duration ${String(value)}`, clip => {
    clip.durationSeconds = value;
  }]),
  ...fieldCases([
    ['sampleRateHz', 24000], ['channels', 2], ['bitrateBitsPerSecond', 96000],
    ['bytes', 0], ['bytes', 1.5], ['bytes', '64000'],
    ['integratedLufs', NaN], ['integratedLufs', -17.699], ['integratedLufs', -18.301],
    ['truePeakDbtp', NaN], ['truePeakDbtp', -1.499],
  ]).map(([name, mutate], index) => [`${name} case ${index}`, mutate]),
]);

rejectionCases('joined-parent and dry-concat evidence cannot be replaced by a native-parent claim', fieldCases([
  ['decode.eosReached', false], ['decode.allSegmentEosObserved', false], ['decode.basis', 'native parent EOS'],
  ['rawSha256', 'not a hash'], ['codeSwitchJoin.method', 'new renderer'],
  ['codeSwitchJoin.sampleRateHz', 48000], ['codeSwitchJoin.channels', 2],
  ['codeSwitchJoin.insertedSilence', true], ['codeSwitchJoin.crossfade', true], ['codeSwitchJoin.edit', true],
  ['codeSwitchJoin.filterGraph', '[0:a]anull[out]'], ['codeSwitchJoin.joinedPcmSha256', sha('different PCM')],
  ['codeSwitchJoin.ffmpegSha256', 'bad'], ['codeSwitchJoin.ffprobeSha256', 'bad'],
  ['codeSwitchJoin.segmentPcmSha256.1', sha('different part')],
]));

rejectionCases('all three source spans and same-speaker segment identities remain mandatory', [
  ['missing source segment', clip => { clip.segments.pop(); }],
  ['extra source segment', clip => { clip.segments.push(structuredClone(clip.segments[2])); }],
  ['missing rendered segment', clip => { clip.codeSwitchParts.pop(); }],
  ['duplicate rendered segment', clip => { clip.codeSwitchParts[1] = structuredClone(clip.codeSwitchParts[0]); }],
  ...[0, 1, 2].flatMap(index => fieldCases([
    [`segments.${index}.index`, 9], [`segments.${index}.joinBefore`, '\n'],
    [`segments.${index}.sourceStart`, -1], [`codeSwitchParts.${index}.sourceEnd`, 999],
    [`codeSwitchParts.${index}.text`, 'changed segment'], [`codeSwitchParts.${index}.languageId`, 'fr'],
    [`codeSwitchParts.${index}.clipId`, 'another part'], [`codeSwitchParts.${index}.voiceId`, 'another speaker'],
    [`codeSwitchParts.${index}.profileId`, 'another profile'], [`codeSwitchParts.${index}.referenceSha256`, sha('other reference')],
    [`codeSwitchParts.${index}.authoringHelperSha256`, ID.authoringHelperSha256],
    [`codeSwitchParts.${index}.renderer`, 'another renderer'], [`codeSwitchParts.${index}.modelRevision`, 'another revision'],
    [`codeSwitchParts.${index}.rendererInputText`, 'changed model input'], [`codeSwitchParts.${index}.seed`, 7],
    [`codeSwitchParts.${index}.synthesisAttempt`, 2],
  ])),
]);

rejectionCases('segment native EOS, decoder hooks and own-profile conditioning are not waived', [
  ...fieldCases([
    ['codeSwitchParts.1.eosReached', false], ['codeSwitchParts.1.decode.eosReached', false],
    ['codeSwitchParts.1.decode.eosTraceSha256', sha('different trace')],
    ['codeSwitchParts.1.decode.attentionHooksBefore', 1], ['codeSwitchParts.1.decode.attentionHooksAfter', 1],
    ['codeSwitchParts.1.decode.generatedSpeechTokens', 0], ['codeSwitchParts.1.decode.generatedSpeechTokens', 301],
    ['codeSwitchParts.1.decode.maxSpeechTokens', 100.5], ['codeSwitchParts.1.decode.modelEosRestoredSteps', 1],
    ['codeSwitchParts.1.synthesis.languageId', 'de'], ['codeSwitchParts.1.synthesis.device', 'cpu'],
    ['codeSwitchParts.1.synthesis.precision', 'fp32'], ['codeSwitchParts.1.synthesis.t3WeightPrecision', 'float32'],
    ['codeSwitchParts.1.synthesis.conditioningPrecision', 'float16'],
    ['codeSwitchParts.1.synthesis.referenceReconditionedForProfile', 'another profile'],
    ['codeSwitchParts.1.synthesis.referenceConditioningVerifiedFloat32', false],
    ['codeSwitchParts.1.synthesis.exaggeration', .6], ['codeSwitchParts.1.synthesis.temperature', .7],
    ['codeSwitchParts.1.synthesis.repetitionPenalty', 2], ['codeSwitchParts.1.synthesis.cfgWeight', .5],
    ['codeSwitchParts.1.synthesis.cpuThreads', 3], ['codeSwitchParts.1.synthesis.inferenceMode', false],
  ]),
  ...[0, 2].map(index => [`other segment ${index} EOS missing`, clip => {
    delete clip.codeSwitchParts[index].decode.eosReached;
  }]),
]);

rejectionCases('diagnostics stay diagnostic and continuation preserves old-helper segment evidence', [
  ...fieldCases([
    ['codeSwitchParts.1.rawSampleRateHz', 48000], ['codeSwitchParts.1.rawChannels', 2],
    ['codeSwitchParts.1.encodedSampleRateHz', 24000], ['codeSwitchParts.1.encodedChannels', 2],
    ['codeSwitchParts.1.asrDiagnosticOnly', false], ['codeSwitchParts.1.asrLanguageId', 'de'],
    ['codeSwitchParts.1.asrScriptPrompt', TEXT], ['codeSwitchParts.1.asrModelSha256', sha('other model')],
    ['codeSwitchParentContinuation.selector', '--render'],
    ['codeSwitchParentContinuation.segmentAuthoringHelperSha256', ID.authoringHelperSha256],
    ['codeSwitchParentContinuation.parentAuthoringHelperSha256', SEGMENT_HELPER],
    ['codeSwitchParentContinuation.ledgerSha256BeforeParentAsr', 'not a digest'],
    ['codeSwitchParentContinuation.segmentDiagnosticReceiptSha256.1', sha('changed diagnostic')],
  ]),
  ['missing no-prompt marker', clip => { delete clip.codeSwitchParts[1].asrScriptPrompt; }],
  ['reordered reused diagnostics', clip => { clip.codeSwitchParentContinuation.segmentDiagnosticReceiptSha256.reverse(); }],
  ...['rawSha256', 'encodedSha256', 'eosTraceSha256', 'rawReceiptSha256', 'diagnosticReceiptSha256']
    .map(key => [`missing ${key}`, clip => { delete clip.codeSwitchParts[1][key]; }]),
]);

test('collector rejects a changed authority or terminal proof before any I/O', () => {
  const calls = [];
  const unexpectedRead = path => { calls.push(path); throw Error('Unexpected I/O'); };
  const isolated = loadProduction({ resolve, lstatSync: unexpectedRead,
    realpathSync: unexpectedRead, readFileSync: unexpectedRead });
  const authority = { path: resolve('synthetic-authority.json'), sha256: AUTHORITY_SHA };
  const terminal = { path: resolve('synthetic-terminal.json'), sha256: TERMINAL_SHA };
  assert.throws(() => isolated.collectorUnderTest({ ...authority, sha256: sha('wrong authority') }, terminal),
    /Not the fixed pilot authority\/terminal proof/);
  assert.throws(() => isolated.collectorUnderTest(authority, { ...terminal, sha256: sha('wrong terminal') }),
    /Not the fixed pilot authority\/terminal proof/);
  assert.deepEqual(calls, [], 'Proof identity must fail before even a file stat');
});

test('collector hashes original authority bytes before JSON parsing or any subsequent read', () => {
  const authorityPath = resolve('synthetic-authority.json');
  const terminalPath = resolve('synthetic-terminal.json');
  // Invalid JSON distinguishes the intended digest error from a premature parse.
  const bytes = Buffer.from('synthetic non-JSON authority bytes', 'utf8');
  const before = Buffer.from(bytes);
  assert.notEqual(sha(bytes), AUTHORITY_SHA);
  const calls = [];
  const isolated = loadProduction({
    resolve,
    lstatSync: path => {
      calls.push(['stat', path]);
      return { isFile: () => true, isSymbolicLink: () => false, size: bytes.length };
    },
    realpathSync: path => { calls.push(['realpath', path]); return path; },
    readFileSync: path => {
      calls.push(['read', path]);
      assert.equal(path, authorityPath, 'No terminal or private receipt may be read after bad authority bytes');
      return bytes;
    },
  });
  assert.throws(() => isolated.collectorUnderTest(
    { path: authorityPath, sha256: AUTHORITY_SHA }, { path: terminalPath, sha256: TERMINAL_SHA }),
  /Pilot evidence bytes changed:/);
  assert.deepEqual(calls, [['stat', authorityPath], ['realpath', authorityPath], ['read', authorityPath]]);
  assert.deepEqual(bytes, before, 'The collector must preserve the supplied original bytes');
});

// Still outside these synthetic tests: the actual receipt/audio/authority/terminal
// bytes, exact spent ledger claims, original cue FAIL and source/cast bindings.
// There is deliberately no fake-hash collector positive. ROOT owns the saved-byte
// collector check. The worker neither read those files nor repeated ROOT's
// reported actual retained-timing check, and did not execute these tests.

// Admission helpers below validate synthetic public metadata, not private bytes.
// No collector brand is created and prepare is never given a forged success.
const PROFILE_JSON_SHA = '49082127b04f09fb892b1afb93e56ea791c2009cecb60099e404400f8f441b2e';
const ENCODED_RECEIPT_SHA = '2ed8acea7dce0cafeffb2501a8876235413e543caa631109db125295039c896f';
const PILOT_SCOPE = 'exact-ruediger-pilot-homophone';
const MANIFEST_PATH = 'assets/voices/candidate-dialogue/crowd-ruediger-rasenkante-exact-pilot-homophone-crowd-manifest.json';
const HOLD_REASON = 'outside exact pilot disposition; existing production preserved';
const JOB_KEYS = ['clipId', 'voiceId', 'actorId', 'region', 'slot', 'sourceLocator', 'text', 'english',
  'profileId', 'referenceSha256', 'referenceOriginalSha256', 'renderer', 'modelRevision', 'processing'];

function syntheticSidecar(original) {
  const rawReceiptSha256 = sha('synthetic joined raw receipt');
  const ledgerSha256 = sha('synthetic completed eight-claim ledger');
  const evidence = [ENCODED_RECEIPT_SHA, ID.sha256, rawReceiptSha256, original.rawSha256,
    AUTHORITY_SHA, TERMINAL_SHA, ledgerSha256, ID.requestSha256, ID.pilotPlanSha256, ID.authoredPlanSha256,
    ...original.codeSwitchParts.flatMap(part => ['rawReceiptSha256', 'diagnosticReceiptSha256',
      'rawSha256', 'encodedSha256', 'eosTraceSha256'].map(key => part[key]))];
  return {
    schema: 'exact-pilot-homophone-cue-projection-v1', qualified: true,
    verificationMode: 'full-encoded-parent-single-token-homophone',
    asrWordExact: false, asrLiteralWordExact: false, originalStrictParentGate: false,
    asrHomophoneWordEquivalent: true, selectedBeamSize: 5,
    projection: { tokenIndex: 7, charIndex: 43, charEndExclusive: 48, heard: 'shoe', authored: 'Schuh' },
    wordCues: expectedCues(), clipId: ID.clipId, voiceId: ID.voiceId, profileId: ID.profileId,
    textSha256: ID.textSha256, originalEncodedReceiptSha256: ENCODED_RECEIPT_SHA,
    encodedSha256: ID.sha256, rawReceiptSha256, rawSha256: original.rawSha256,
    authoritySha256: AUTHORITY_SHA, continuationTerminalSha256: TERMINAL_SHA, ledgerSha256,
    originalCueGate: 'FAIL', originalPostflightQualified: false, referenceLicense: 'CC0-1.0',
    modelLicense: 'MIT', technicalEligible: true, listeningVerified: false, publicationAuthorized: false,
    status: 'homophone-equivalent; literal ASR mismatch retained', generationCalls: 3,
    parentGenerationCalls: 0, segmentDiagnosticAsrCalls: 3, parentGermanAsrCalls: 2,
    totalAsrCalls: 5, retryBudget: 0, evidenceFiles: evidence.map(sha256 => ({ sha256 })),
  };
}

function admissionFixture() {
  const original = { ...validClip(), english: 'The lawn edge is not an invitation; your shoe is in the area of responsibility.' };
  const projection = syntheticSidecar(original);
  const projectionSha256 = sha(JSON.stringify(projection));
  const clip = {
    ...structuredClone(original), file: `assets/voices/candidate-dialogue/${ID.clipId}.mp3`,
    profileJsonSha256: PROFILE_JSON_SHA, referenceLicense: 'CC0-1.0', modelLicense: 'MIT',
    originalWordCues: [], wordCues: expectedCues(), asrHomophoneWordEquivalent: true,
    verificationMode: 'full-encoded-parent-single-token-homophone',
    approval: { status: 'user-approved', scope: 'whole-game-fixed-voice-cloning', date: '2026-10-16',
      instruction: 'Synthetic fixture selection only.', clipId: ID.clipId, encodedSha256: ID.sha256 },
    listening: 'pending', listeningVerified: false, listeningConfirmed: false,
    status: 'homophone-equivalent; literal ASR mismatch retained; human listening pending',
  };
  const jobs = ['berlin', 'germany'].flatMap(region => [0, 1].map(slot => {
    const row = { ...original, region, slot, clipId: `${ID.voiceId}-${region}-${String(slot + 1).padStart(2, '0')}`,
      sourceLocator: `game.js crowdCharacterBarks[${ID.voiceId}].${region}[${slot}]` };
    if (row.clipId !== ID.clipId) {
      row.text = `Synthetic preserved ${region} slot ${slot}.`;
      row.english = `Synthetic preserved caption ${region} ${slot}.`;
    }
    return Object.fromEntries(JOB_KEYS.map(key => [key, row[key]]));
  }));
  const take = {
    rawReceiptSha256: projection.rawReceiptSha256, encodedReceiptSha256: ENCODED_RECEIPT_SHA,
    rawSha256: clip.rawSha256, encodedSha256: ID.sha256, profileJsonSha256: PROFILE_JSON_SHA,
    projectionSha256, ledgerSha256: projection.ledgerSha256, segmentGenerationCalls: 3,
    parentGenerationCalls: 0, parentGermanAsrCalls: 2, totalAsrCalls: 5, synthesisAttempt: 0,
  };
  const admission = {
    status: 'ROOT-verified-exact-ruediger-pilot-homophone', generationScope: PILOT_SCOPE,
    authoritySha256: AUTHORITY_SHA, helperSha256: ID.authoringHelperSha256,
    requestSha256: ID.requestSha256, authoredPlanSha256: ID.authoredPlanSha256,
    pilotPlanSha256: ID.pilotPlanSha256, selectionSha256: sha('synthetic explicit use selection'),
    projectionSha256, projection, takes: { [ID.clipId]: take },
  };
  const manifest = {
    schemaVersion: 1, generationScope: PILOT_SCOPE, voiceId: ID.voiceId, profileId: ID.profileId,
    fallback: 'captions', status: 'homophone-equivalent; original literal/strict/cue failure retained; human listening pending',
    requestedLineCount: 4, generatedLineCount: 0, joinedLineCount: 1, segmentGenerationCalls: 3,
    parentGenerationCalls: 0, parentGermanAsrCalls: 2, totalAsrCalls: 5, lineCount: 1,
    clips: [clip], heldPrivate: jobs.filter(row => row.clipId !== ID.clipId).map(row => ({ ...row, reason: HOLD_REASON })),
    approvedExistingReuse: [], crowdAdmission: admission,
  };
  const cast = {
    productionVoices: { [ID.voiceId]: { profileId: ID.profileId, originalSha256: ID.referenceOriginalSha256,
      referenceSha256: ID.referenceSha256, renderer: ID.renderer, modelRevision: ID.modelRevision, processing: null } },
    productionExceptions: [],
    roleProfiles: [{ gameRole: ID.voiceId, voiceId: ID.voiceId, secretTunnelProfileId: ID.profileId,
      reference: { license: 'CC0-1.0', workingReferenceSha256: ID.referenceOriginalSha256 } }],
  };
  return { original, projection, clip, admission, manifest, take, jobs, cast, sourceRoot: resolve('synthetic-public-source') };
}

function loadAdmission(fixture, extraGlobals = {}) {
  return loadProduction({
    root: fixture.sourceRoot, textHash: sha,
    crowdSourceMap: (_cast, sourceRoot) => {
      assert.equal(sourceRoot, fixture.sourceRoot);
      return new Map(fixture.jobs.map(row => [row.clipId, row]));
    },
    ...extraGlobals,
  }, true);
}

function admissionRejections(name, cases, target = 'manifest') {
  test(name, async t => {
    for (const [label, mutate] of cases) await t.test(label, () => {
      const fixture = admissionFixture();
      mutate(fixture);
      const isolated = loadAdmission(fixture);
      const invoke = target === 'sidecar'
        ? () => isolated.sidecarUnderTest(fixture.original, fixture.projection)
        : () => isolated.manifestAuthorityUnderTest(fixture.cast, fixture.manifest, fixture.sourceRoot);
      assertUnchanged(fixture, () => assert.throws(invoke, undefined, label));
    });
  });
}

test('synthetic public metadata retains failed original gates and exact joined-parent accounting', () => {
  const fixture = admissionFixture();
  const isolated = loadAdmission(fixture);
  const projected = assertUnchanged(fixture, () => isolated.sidecarUnderTest(fixture.original, fixture.projection));
  assert.deepEqual(structuredClone(projected.wordCues), expectedCues());
  const admittedClip = assertUnchanged(fixture, () => isolated.manifestAuthorityUnderTest(
    fixture.cast, fixture.manifest, fixture.sourceRoot));
  assert.equal(admittedClip, fixture.clip);
  assert.equal(admittedClip.asrWordExact, false);
  assert.equal(admittedClip.asrLiteralWordExact, false);
  assert.equal(admittedClip.codeSwitchStrictParentGate, false);
  assert.deepEqual(admittedClip.originalWordCues, []);
  assert.deepEqual(fixture.original.wordCues, []);
  assert.deepEqual(admittedClip.wordCues, expectedCues());
  assert.equal(fixture.manifest.generatedLineCount, 0);
  assert.equal(fixture.manifest.joinedLineCount, 1);
  assert.equal(fixture.manifest.segmentGenerationCalls, 3);
  assert.equal(fixture.manifest.parentGenerationCalls, 0);
  assert.equal(fixture.projection.publicationAuthorized, false);
});

admissionRejections('public sidecar fields, fixed lineage and original failure status are strict', [
  ['extra public field', f => { f.projection.privatePath = '/not-public'; }],
  ['missing public field', f => { delete f.projection.technicalEligible; }],
  ...fieldCases([
    ['projection.schema', 'ordinary exact'], ['projection.qualified', false],
    ['projection.clipId', 'another clip'], ['projection.voiceId', 'another voice'],
    ['projection.profileId', 'another profile'], ['projection.textSha256', sha('changed text')],
    ['projection.originalEncodedReceiptSha256', sha('other receipt')], ['projection.encodedSha256', sha('other MP3')],
    ['projection.authoritySha256', sha('other authority')], ['projection.continuationTerminalSha256', sha('other terminal')],
    ['projection.rawSha256', sha('other raw')], ['projection.rawReceiptSha256', 'bad'], ['projection.ledgerSha256', 'bad'],
    ['projection.asrWordExact', true], ['projection.asrLiteralWordExact', true], ['projection.originalStrictParentGate', true],
    ['projection.originalCueGate', 'PASS'], ['projection.originalPostflightQualified', true],
    ['projection.referenceLicense', 'unknown'], ['projection.modelLicense', 'unknown'],
    ['projection.listeningVerified', true], ['projection.publicationAuthorized', true],
    ['projection.status', 'literal exact'], ['projection.technicalEligible', false],
    ['projection.generationCalls', 4], ['projection.parentGenerationCalls', 1],
    ['projection.segmentDiagnosticAsrCalls', 2], ['projection.parentGermanAsrCalls', 1],
    ['projection.totalAsrCalls', 4], ['projection.retryBudget', 1],
    ['projection.selectedBeamSize', 1], ['projection.projection.tokenIndex', 6],
    ['projection.projection.charIndex', 44], ['projection.projection.charEndExclusive', 47],
  ]),
], 'sidecar');

admissionRejections('sidecar evidence must retain every required digest without exposing paths', [
  ['fewer than 25 evidence rows', f => { f.projection.evidenceFiles.pop(); }],
  ['duplicate digest displaces required segment evidence', f => {
    f.projection.evidenceFiles[24] = { ...f.projection.evidenceFiles[0] };
  }],
  ['same count but missing parent receipt', f => { f.projection.evidenceFiles[0].sha256 = sha('unrelated proof'); }],
  ['same count but missing final segment trace', f => { f.projection.evidenceFiles[24].sha256 = sha('unrelated trace'); }],
  ['evidence row exposes path', f => { f.projection.evidenceFiles[0].path = '/private'; }],
  ['evidence row is a string', f => { f.projection.evidenceFiles[0] = ENCODED_RECEIPT_SHA; }],
  ['evidence digest is malformed', f => { f.projection.evidenceFiles[0].sha256 = 'bad'; }],
], 'sidecar');

admissionRejections('admission cannot change retained cue timing or turn literal failure into success', [
  ...fieldCases([
    ['clip.asrWordExact', true], ['clip.asrLiteralWordExact', true], ['clip.codeSwitchStrictParentGate', true],
    ['clip.asrHomophoneWordEquivalent', false], ['clip.verificationMode', 'literal-exact'],
    ['clip.wordCues.7.word', 'shoe'], ['clip.wordCues.7.charIndex', 44],
    ['clip.wordCues.7.at', TIMES[7][0] + .001], ['clip.wordCues.7.end', TIMES[7][1] + .001],
    ['clip.asrReadings.1.words.7.start', TIMES[7][0] + .001],
    ['admission.projectionSha256', sha('different sidecar')],
  ]),
  ['original cue array fabricated', f => { f.clip.originalWordCues = expectedCues(); }],
  ['original cue array missing', f => { delete f.clip.originalWordCues; }],
  ['sidecar timestamp shifted despite refreshed sidecar digest', f => {
    f.projection.wordCues[7].at += .001;
    f.admission.projectionSha256 = sha(JSON.stringify(f.projection));
    f.take.projectionSha256 = f.admission.projectionSha256;
  }],
]);

admissionRejections('selected asset, current reference, owner and authored caption cannot drift', [
  ...fieldCases([
    ['clip.file', '../retained.mp3'], ['clip.sha256', sha('different asset')],
    ['clip.profileJsonSha256', sha('different saved profile')], ['clip.referenceSha256', sha('other working reference')],
    ['clip.referenceOriginalSha256', sha('other original')], ['clip.referenceLicense', 'unknown'], ['clip.modelLicense', 'unknown'],
    ['clip.english', 'Changed caption'], ['clip.actorId', 'another actor'], ['clip.slot', 1],
    ['cast.roleProfiles.0.voiceId', 'another voice'], ['cast.roleProfiles.0.secretTunnelProfileId', 'other profile'],
    ['cast.roleProfiles.0.reference.license', 'unknown'], ['cast.roleProfiles.0.reference.workingReferenceSha256', sha('other original')],
  ]),
  ['duplicate current role owner', f => { f.cast.roleProfiles.push(structuredClone(f.cast.roleProfiles[0])); }],
  ['selected binding reference changed', f => { f.cast.productionVoices[ID.voiceId].referenceSha256 = sha('new binding'); }],
  ['selected processing changed', f => { f.cast.productionVoices[ID.voiceId].processing = 'another recipe'; }],
  ['current authored source changed', f => { f.jobs[0].text = 'Changed source'; }],
  ['current selected source missing', f => { f.jobs.shift(); }],
]);

admissionRejections('exact use approval and pending listening cannot be borrowed or expanded', [
  ...fieldCases([
    ['clip.approval.status', 'pending'], ['clip.approval.scope', 'all clips'],
    ['clip.approval.date', 'invalid-date'], ['clip.approval.instruction', '   '],
    ['clip.approval.clipId', 'another clip'], ['clip.approval.encodedSha256', sha('other asset')],
    ['clip.listening', 'passed'], ['clip.listeningVerified', true], ['clip.listeningConfirmed', true],
    ['clip.status', 'literal exact recording'],
  ]),
  ['additional approval field', f => { f.clip.approval.listeningVerified = false; }],
  ['missing approval', f => { delete f.clip.approval; }],
]);

admissionRejections('manifest and take counts preserve one join, three segments and zero parent generations', [
  ...fieldCases([
    ['manifest.generationScope', 'first9'], ['manifest.schemaVersion', 2], ['manifest.fallback', 'browser'],
    ['manifest.requestedLineCount', 36], ['manifest.generatedLineCount', 1], ['manifest.joinedLineCount', 0],
    ['manifest.segmentGenerationCalls', 2], ['manifest.parentGenerationCalls', 1],
    ['manifest.parentGermanAsrCalls', 1], ['manifest.totalAsrCalls', 4], ['manifest.lineCount', 2],
    ['take.segmentGenerationCalls', 2], ['take.parentGenerationCalls', 1],
    ['take.parentGermanAsrCalls', 1], ['take.totalAsrCalls', 4], ['take.synthesisAttempt', 1],
    ['take.encodedReceiptSha256', sha('other receipt')], ['take.rawReceiptSha256', sha('other raw receipt')],
    ['take.profileJsonSha256', sha('other profile receipt')],
    ['admission.generationScope', 'remaining27-first-takes'], ['admission.requestSha256', ID.authoredPlanSha256],
    ['admission.helperSha256', SEGMENT_HELPER], ['admission.selectionSha256', 'bad'],
  ]),
  ['second claimed take', f => { f.admission.takes.other = structuredClone(f.take); }],
  ['other slot claimed as approved reuse', f => { f.manifest.approvedExistingReuse.push({ clipId: f.jobs[1].clipId }); }],
  ['missing preserved slot', f => { f.manifest.heldPrivate.pop(); }],
  ['duplicate preserved slot', f => { f.manifest.heldPrivate[1] = structuredClone(f.manifest.heldPrivate[0]); }],
  ['preserved row falsely claims generation', f => { f.manifest.heldPrivate[0].generated = true; }],
  ['preserved row has another hold reason', f => { f.manifest.heldPrivate[0].reason = 'generated'; }],
]);

test('exact pilot manifest needs its own filename and ROOT digest anchor even without an approval field', async t => {
  const fixture = admissionFixture();
  const isolated = loadAdmission(fixture);
  const minimal = { generationScope: PILOT_SCOPE, voiceId: ID.voiceId, clips: [{ clipId: ID.clipId, sha256: ID.sha256 }] };
  const digest = sha('synthetic public manifest bytes');
  assert.equal(isolated.manifestLedgerUnderTest(minimal, MANIFEST_PATH, digest, { [MANIFEST_PATH]: digest }), undefined);
  const cases = [
    ['unknown scope', (m, state) => { m.generationScope = 'any-homophone'; }],
    ['wrong voice', m => { m.voiceId = 'crowd-another-person'; }],
    ['wrong clip', m => { m.clips[0].clipId = 'another clip'; }],
    ['wrong asset', m => { m.clips[0].sha256 = sha('other MP3'); }],
    ['missing clip', m => { m.clips = []; }],
    ['second clip', m => { m.clips.push({ ...m.clips[0] }); }],
    ['ordinary manifest filename', (_m, state) => { state.path = `assets/voices/candidate-dialogue/${ID.voiceId}-crowd-manifest.json`; }],
    ['scope filename traversal', (_m, state) => { state.path = `assets/voices/candidate-dialogue/../${MANIFEST_PATH}`; }],
    ['missing anchor', (_m, state) => { state.ledger = {}; }],
    ['stale anchor', (_m, state) => { state.ledger[MANIFEST_PATH] = sha('older manifest'); }],
    ['non-digest anchor', (_m, state) => { state.digest = 'bad'; state.ledger[MANIFEST_PATH] = 'bad'; }],
  ];
  for (const [label, mutate] of cases) await t.test(label, () => {
    const manifest = structuredClone(minimal);
    const state = { path: MANIFEST_PATH, digest, ledger: { [MANIFEST_PATH]: digest } };
    mutate(manifest, state);
    assertUnchanged({ manifest, state }, () => assert.throws(() => isolated.manifestLedgerUnderTest(
      manifest, state.path, state.digest, state.ledger), /scope|anchor|identity/));
  });
});

test('prepare rejects a complete but unbranded synthetic collection before any I/O', () => {
  const fixture = admissionFixture();
  const calls = [];
  const unexpectedIO = (...args) => { calls.push(args); throw Error('Unexpected I/O'); };
  const isolated = loadAdmission(fixture, { resolve, json: unexpectedIO, hash: unexpectedIO,
    readFileSync: unexpectedIO, lstatSync: unexpectedIO, realpathSync: unexpectedIO });
  const collection = { clip: fixture.original, projection: fixture.projection };
  const selection = { path: resolve('synthetic-selection.json'), sha256: sha('synthetic selection bytes') };
  assertUnchanged({ fixture, collection, selection }, () => assert.throws(() => isolated.prepareUnderTest(
    fixture.cast, collection, selection, fixture.sourceRoot),
  /requires unchanged evidence from the full private collector/));
  assert.deepEqual(calls, [], 'Unbranded proof must be rejected before cast or selection reads');
});

// A mutated genuine collector object is intentionally not fabricated here:
// minting its private WeakMap brand would bypass the very collector being tested.
// ROOT owns the actual saved-byte collection/prepare positive and its mutation case.
