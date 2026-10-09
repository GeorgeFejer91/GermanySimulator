import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

// Usage: node tools/audit-voice-release-readiness.mjs --music-root <library> [--check]
// Read-only --check verifies the saved report against current cast/catalogue and review data.
const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const musicArg = args.indexOf('--music-root');
if (musicArg < 0 || !args[musicArg + 1]) throw new Error('Pass --music-root <German emotional voice databases>');
const music = resolve(args[musicArg + 1]);
const check = args.includes('--check');
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const sha256 = data => createHash('sha256').update(data).digest('hex');
const requireMatch = (condition, message) => {if (!condition) throw new Error(message)};

function parseCsv(source) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {field += '"'; i++}
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {row.push(field); field = ''}
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += c;
  }
  requireMatch(!quoted, 'Unclosed CSV quote');
  if (row.length || field) {row.push(field); rows.push(row)}
  const [header, ...body] = rows;
  return body.map((cells, index) => {
    requireMatch(cells.length === header.length, `CSV field count on row ${index + 2}`);
    return Object.fromEntries(header.map((key, i) => [key, cells[i]]));
  });
}

const castPath = resolve(root, 'For-AI/VOICE-CAST.json');
const catalogPath = resolve(root, 'For-AI/AUDIO-TEXT-LIBRARY.js');
const candidatePath = resolve(root, 'assets/voices/candidate-dialogue/manifest.json');
const coveragePath = resolve(music, 'GERMANY-SIMULATOR-VOICE-ASSET-COVERAGE.csv');
const queuePath = resolve(music, 'VOICE-CANDIDATE-REVIEW-QUEUE.csv');
const reviewPath = resolve(music, 'GermanySimulator normalized voice review 2026-10-09/word-review.json');
const cast = json(castPath);
const candidate = json(candidatePath);
const coverage = parseCsv(read(coveragePath).toString('utf8').replace(/^\uFEFF/, ''));
const queue = parseCsv(read(queuePath).toString('utf8').replace(/^\uFEFF/, ''));
const review = json(reviewPath);
const sandbox = {window: {}, location: {search: ''}, URLSearchParams};
vm.runInNewContext(read(catalogPath).toString('utf8'), sandbox, {filename: catalogPath, timeout: 3000});
const catalog = sandbox.window.GermanySimulatorAudioText;
requireMatch(catalog && catalog.candidatePreviewEnabled === false, 'Default catalogue preview state changed');
const people = [...cast.characters, ...cast.roleProfiles];
requireMatch(people.length === cast.totalNewProfileCount && people.length === 56, 'Cast profile count changed');
const byVoice = new Map(people.map(p => [p.voiceId, p]));
const byCoverage = new Map(coverage.map(p => [p.voiceId, p]));
requireMatch(byVoice.size === people.length && byCoverage.size === people.length, 'Duplicate or missing profile IDs');
requireMatch(candidate.clips.length === candidate.lineCount && review.clips.length === candidate.clips.length,
  'Candidate/review row count changed');
const byClip = new Map(review.clips.map(c => [c.clipId, c]));
const byQueuedClip = new Map(queue.map(c => [c.clipId, c]));
requireMatch(byClip.size === candidate.clips.length && byQueuedClip.size === candidate.clips.length,
  'Duplicate or missing review queue clip');
const candidateCounts = new Map();
const normalizedExact = new Map();
const approvedCounts = new Map();
for (const clip of candidate.clips) {
  const person = byVoice.get(clip.voiceId);
  const inspected = byClip.get(clip.clipId);
  const queued = byQueuedClip.get(clip.clipId);
  requireMatch(person && inspected && inspected.voiceId === clip.voiceId && inspected.sourceSha256 === clip.sha256,
    `Candidate/review mismatch: ${clip.clipId}`);
  requireMatch(queued && queued.voiceId === clip.voiceId && queued.mp3Sha256 === clip.sha256 &&
    queued.script === clip.text, `Human review queue mismatch: ${clip.clipId}`);
  const profileId = person.secretTunnel?.profileId ?? person.secretTunnelProfileId;
  requireMatch(clip.profileId === profileId && inspected.profileId === profileId,
    `Candidate profile mismatch: ${clip.clipId}`);
  candidateCounts.set(clip.voiceId, (candidateCounts.get(clip.voiceId) ?? 0) + 1);
  if (inspected.normalizedWordPercent === 100) normalizedExact.set(clip.voiceId,
    (normalizedExact.get(clip.voiceId) ?? 0) + 1);
  const gates = ['heardWords', 'speakerIdentityFits', 'demeanorFits', 'intonationFits',
    'artifactsAbsent', 'sourceRightsCleared', 'approveForGame'];
  if (gates.every(key => queued[key].trim().toLowerCase() === 'yes')) approvedCounts.set(clip.voiceId,
    (approvedCounts.get(clip.voiceId) ?? 0) + 1);
}
const defaultCounts = new Map();
for (const recording of Object.values(catalog.recordings)) {
  if (byVoice.has(recording.voiceId)) defaultCounts.set(recording.voiceId,
    (defaultCounts.get(recording.voiceId) ?? 0) + 1);
}
const rows = people.map(person => {
  const saved = byCoverage.get(person.voiceId);
  const profileId = person.secretTunnel?.profileId ?? person.secretTunnelProfileId;
  requireMatch(saved && saved.profileId === profileId && saved.fullName === person.fullName,
    `Music/game identity mismatch: ${person.voiceId}`);
  const optInCandidateCount = candidateCounts.get(person.voiceId) ?? 0;
  requireMatch(optInCandidateCount === Number(saved.optInCandidateMp3Count),
    `Music/game candidate count mismatch: ${person.voiceId}`);
  return {
    voiceId: person.voiceId, fullName: person.fullName, profileId,
    defaultRecordingCount: defaultCounts.get(person.voiceId) ?? 0,
    optInCandidateCount,
    candidateHumanApprovedCount: approvedCounts.get(person.voiceId) ?? 0,
    normalizedDiagnosticWordExactCount: normalizedExact.get(person.voiceId) ?? 0,
    normalizedDiagnosticWordBelow100Count: optInCandidateCount - (normalizedExact.get(person.voiceId) ?? 0),
    privateOrAuditionCount: Number(saved.profileAuditionMp3Count) + Number(saved.quizPreviewSegmentCount) +
      Number(saved.newPrivateScoredMp3Count) + Number(saved.privateQuizPromptReviewMp3Count) +
      Number(saved.supplementaryPrivateAuditionCount),
    releaseState: defaultCounts.get(person.voiceId) ? 'default_recording_present' : 'no_default_recording',
  };
});
const report = {
  schemaVersion: 1,
  scope: '56 new nonpolitical voice profiles; direct default recordings only. Legacy targetVoiceId is editorial and not credited.',
  diagnosticNote: 'A Whisper word match is a diagnostic, not human listening or release approval. Private auditions are not game assets.',
  sourceSha256: {
    cast: sha256(read(castPath)), catalog: sha256(read(catalogPath)),
    candidateManifest: sha256(read(candidatePath)), musicCoverageCsv: sha256(read(coveragePath)),
    humanReviewQueueCsv: sha256(read(queuePath)),
    normalizedWordReview: sha256(read(reviewPath)),
  },
  profileCount: rows.length,
  profilesWithDefaultRecording: rows.filter(r => r.defaultRecordingCount).length,
  profilesWithOptInCandidate: rows.filter(r => r.optInCandidateCount).length,
  optInCandidateCount: rows.reduce((n, r) => n + r.optInCandidateCount, 0),
  candidateHumanApprovedCount: rows.reduce((n, r) => n + r.candidateHumanApprovedCount, 0),
  normalizedDiagnosticWordExactCount: rows.reduce((n, r) => n + r.normalizedDiagnosticWordExactCount, 0),
  rows,
};
const output = resolve(music, 'GERMANY-SIMULATOR-VOICE-RELEASE-READINESS.json');
const serialized = JSON.stringify(report, null, 2) + '\n';
if (check) requireMatch(read(output).toString('utf8') === serialized, 'Release-readiness report is stale');
else writeFileSync(output, serialized);
console.log(JSON.stringify({output, check, profiles: report.profileCount,
  default: report.profilesWithDefaultRecording, optInProfiles: report.profilesWithOptInCandidate,
  optInCandidates: report.optInCandidateCount, diagnostic100: report.normalizedDiagnosticWordExactCount}));
