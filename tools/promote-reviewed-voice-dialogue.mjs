import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, dirname, resolve, sep} from 'node:path';

// Run after the human queue has yes in every review column for accepted clips.
// node tools/promote-reviewed-voice-dialogue.mjs --music-root <library> [--check]
const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const musicArg = args.indexOf('--music-root');
if (musicArg < 0 || !args[musicArg + 1]) throw new Error('Pass --music-root <German emotional voice databases>');
const music = resolve(args[musicArg + 1]);
const check = args.includes('--check');
const dryRun = args.includes('--dry-run');
if (check && dryRun) throw new Error('Choose --check or --dry-run');
const requireMatch = (ok, why) => {if (!ok) throw new Error(why)};
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const hash = path => createHash('sha256').update(read(path)).digest('hex');
const within = (base, relative) => {
  const target = resolve(base, relative);
  requireMatch(target.startsWith(base + sep), `Path escapes ${base}: ${relative}`);
  return target;
};
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

const queuePath = resolve(music, 'VOICE-CANDIDATE-REVIEW-QUEUE.csv');
const queue = parseCsv(read(queuePath).toString('utf8').replace(/^\uFEFF/, ''));
const candidatePath = resolve(root, 'assets/voices/candidate-dialogue/manifest.json');
const normalizedPath = resolve(music, 'GermanySimulator normalized voice review 2026-10-09/manifest.json');
const manifestPath = resolve(root, 'assets/voices/approved-dialogue/manifest.json');
const catalogPath = resolve(root, 'For-AI/AUDIO-TEXT-LIBRARY.js');
const candidates = json(candidatePath);
const normalized = json(normalizedPath);
const cast = json(resolve(root, 'For-AI/VOICE-CAST.json'));
const oldManifest = json(manifestPath);
requireMatch(normalized.sourceManifestSha256 === hash(candidatePath), 'Normalized source manifest is stale');
const byVoice = new Map([...cast.characters, ...cast.roleProfiles].map(p => [p.voiceId, p]));
const byQueue = new Map(queue.map(row => [row.clipId, row]));
const byNormalized = new Map(normalized.copies.map(row => [row.clipId, row]));
requireMatch(byQueue.size === queue.length && byNormalized.size === normalized.copies.length,
  'Duplicate review or normalized clip ID');
const approvalFields = ['heardWords', 'speakerIdentityFits', 'demeanorFits', 'intonationFits',
  'artifactsAbsent', 'sourceRightsCleared', 'approveForGame'];
const approved = [];
const approvedSourceFiles = [];
const keys = new Set();
for (const clip of candidates.clips) {
  const person = byVoice.get(clip.voiceId);
  const row = byQueue.get(clip.clipId);
  const copy = byNormalized.get(clip.clipId);
  const profileId = person?.secretTunnel?.profileId ?? person?.secretTunnelProfileId;
  requireMatch(person && row && copy && clip.profileId === profileId && row.profileId === profileId &&
    copy.profileId === profileId && row.voiceId === clip.voiceId && copy.voiceId === clip.voiceId &&
    row.script === clip.text && copy.script === clip.text && row.mp3Sha256 === clip.sha256 &&
    copy.sourceSha256 === clip.sha256 && row.normalizedSha256 === copy.outputSha256,
  `Review provenance mismatch: ${clip.clipId}`);
  if (row.approveForGame.trim().toLowerCase() !== 'yes') continue;
  requireMatch(approvalFields.every(field => row[field].trim().toLowerCase() === 'yes'),
    `Incomplete human gate: ${clip.clipId}`);
  requireMatch(Math.abs(copy.outputLufs + 18) <= .3 && copy.outputTruePeakDbtp <= -1.5,
    `Delivery level outside approved target: ${clip.clipId}`);
  const source = within(music, row.normalizedReviewFile);
  requireMatch(basename(source) === copy.copyFile && hash(source) === copy.outputSha256,
    `Normalized MP3 hash mismatch: ${clip.clipId}`);
  requireMatch(hash(within(root, clip.path)) === clip.sha256,
    `Original candidate MP3 hash mismatch: ${clip.clipId}`);
  const key = clip.voiceId + '\0' + clip.text;
  requireMatch(!keys.has(key), `Duplicate approved voice/text: ${clip.clipId}`);
  keys.add(key);
  const path = `assets/voices/approved-dialogue/${clip.clipId}.mp3`;
  approved.push({clipId: clip.clipId, voiceId: clip.voiceId, fullName: person.fullName,
    profileId, text: clip.text, path, sha256: copy.outputSha256,
    sourceCandidateSha256: clip.sha256, sourceReferenceSha256: clip.referenceSha256,
    renderer: clip.renderer, modelRevision: clip.modelRevision, modelLicense: clip.modelLicense,
    referenceDataset: person.reference?.dataset ?? null,
    referenceLicense: person.reference?.releaseLicense ?? null,
    humanReviewQueueSha256: hash(queuePath)});
  approvedSourceFiles.push({source, path: within(root, path), sha256: copy.outputSha256});
}
requireMatch(approved.length === queue.filter(row => row.approveForGame.trim().toLowerCase() === 'yes').length,
  'Approved review row absent from candidate manifest');
const byId = new Map(approved.map(clip => [clip.clipId, clip]));
for (const old of oldManifest.clips) requireMatch(byId.get(old.clipId)?.sha256 === old.sha256,
  `Previously promoted clip was revoked or changed: ${old.clipId}; resolve its game use explicitly`);
const nextManifest = {schemaVersion: 1, status: 'human-approved normalized dialogue for default gameplay',
  clips: approved};
const manifestText = JSON.stringify(nextManifest, null, 2) + '\n';
const catalog = read(catalogPath).toString('utf8');
const lines = approved.map(clip => ` ${JSON.stringify([clip.voiceId, clip.text, clip.path])}`);
const block = `const approvedDialogue=Object.freeze(Object.fromEntries([\n${lines.join(',\n')}\n].map(([voiceId,text,path])=>[voiceId+"\\u0000"+text,path])));`;
const pattern = /const approvedDialogue=Object\.freeze\(Object\.fromEntries\(\[[\s\S]*?\n\]\.map\(\(\[voiceId,text,path\]\)=>\[voiceId\+"\\u0000"\+text,path\]\)\)\);/;
requireMatch(pattern.test(catalog), 'Approved lookup block not found in audio text library');
const updatedCatalog = catalog.replace(pattern, block);
if (check) {
  requireMatch(read(manifestPath).toString('utf8') === manifestText && catalog === updatedCatalog,
    'Approved manifest or catalogue lookup is stale');
  for (const file of approvedSourceFiles) requireMatch(existsSync(file.path) && hash(file.path) === file.sha256,
    `Published MP3 missing or altered: ${file.path}`);
} else if (!dryRun) {
  for (const file of approvedSourceFiles) {
    mkdirSync(dirname(file.path), {recursive: true});
    if (!existsSync(file.path)) copyFileSync(file.source, file.path);
    requireMatch(hash(file.path) === file.sha256, `Published MP3 collision: ${file.path}`);
  }
  writeFileSync(manifestPath, manifestText);
  if (updatedCatalog !== catalog) writeFileSync(catalogPath, updatedCatalog);
}
console.log(JSON.stringify({check, dryRun, approved: approved.length, manifestPath}));
