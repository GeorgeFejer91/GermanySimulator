import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {STREET_CATALOG} from '../assets/models/street-characters/models.js';
import {STREET_PERSONA_MAP, STREET_TEMPLATE_GENDER} from '../assets/models/street-characters/persona-map.js';

const root = resolve(import.meta.dirname, '..');
const source = name => readFileSync(resolve(root, name), 'utf8');
const hash = name => createHash('sha256').update(source(name)).digest('hex');
const requireMatch = (condition, message) => {if (!condition) throw new Error(message)};
const cast = JSON.parse(source('For-AI/VOICE-CAST.json'));
const fixed = cast.characters;
const roles = cast.roleProfiles;
const political = cast.existingAssetProfiles;
const people = [...fixed, ...roles, ...political];
const byVoice = new Map(people.map(person => [person.voiceId, person]));
requireMatch(byVoice.size === people.length, 'Duplicate voiceId in cast');
requireMatch(fixed.length === cast.characterCount && roles.length === cast.roleProfileCount,
  'Cast counts do not match the listed people');
requireMatch(fixed.length + roles.length === cast.totalNewProfileCount,
  'New profile count does not match the cast');

const newProfiles = [...fixed.map(person => person.secretTunnel?.profileId),
  ...roles.map(person => person.secretTunnelProfileId)];
requireMatch(newProfiles.every(id => /^[0-9a-f]{32}$/.test(id)) &&
  new Set(newProfiles).size === newProfiles.length, 'Missing or duplicate new Secret Tunnel UUID');
for (const person of [...fixed, ...roles]) {
  requireMatch(person.fullName && person.gender && person.generalDemeanor &&
    person.targetValence && person.targetArousal && person.reference,
  `Missing identity or demeanor audit for ${person.voiceId}`);
}

const runtimeFiles = ['game.js', 'world3d.js', 'buergeramt-story.js'];
const explicit = runtimeFiles.flatMap(file => [...source(file).matchAll(/\bvoiceId\s*:\s*["']([^"']+)["']/g)]
  .map(match => ({file, voiceId: match[1]})));
for (const entry of explicit) requireMatch(byVoice.has(entry.voiceId),
  `Uncatalogued explicit ${entry.voiceId} in ${entry.file}`);

const game = source('game.js');
const city = [...game.matchAll(/\{[^\n{}]*id:"(city-[^"]+)"[^\n{}]*fullName:"([^"]+)"[^\n{}]*voiceId:"([^"]+)"/g)]
  .map(([, gameCharacterId, fullName, voiceId]) => ({gameCharacterId, fullName, voiceId}));
requireMatch(city.length === 19, `Expected 19 named city NPCs; found ${city.length}`);
for (const person of city) requireMatch(byVoice.get(person.voiceId)?.fullName === person.fullName,
  `City model/speaker mismatch for ${person.gameCharacterId}`);

const crowdSource = game.match(/const crowdVoiceIds=\[([^\]]+)\]/)?.[1];
requireMatch(crowdSource, 'Missing crowd voice identity array');
const crowd = [...crowdSource.matchAll(/"([^"]+)"/g)].map(match => match[1]);
requireMatch(crowd.length === 12 && new Set(crowd).size === 12,
  'Expected twelve distinct named crowd identities');
for (const voiceId of crowd) requireMatch(byVoice.has(voiceId),
  `Uncatalogued crowd voice ${voiceId}`);

const world = source('world3d.js');
const office = [...world.matchAll(/amtCharacter\("([^"]+)"[^\n]*?\{([^{}]+)\}\);/g)]
  .map(([, modelKind, identity]) => {
    const value = key => identity.match(new RegExp(`${key}:"([^"]+)"`))?.[1] ?? null;
    return {modelKind, gameCharacterId: value('id'), fullName: value('fullName'),
      voiceId: value('voiceId'), decorativeCloneOf: value('decorativeCloneOf')};
  });
requireMatch(office.length === 6, `Expected six static Bürgeramt figures; found ${office.length}`);
const officeSpeakers = office.filter(person => person.gameCharacterId);
const officeClones = office.filter(person => person.decorativeCloneOf);
requireMatch(officeSpeakers.length === 4 && officeClones.length === 2,
  'Bürgeramt identity/clone distinction changed');
for (const person of officeSpeakers) requireMatch(person.gameCharacterId === person.voiceId &&
  byVoice.get(person.voiceId)?.fullName === person.fullName,
  `Bürgeramt model/speaker mismatch for ${person.gameCharacterId}`);
for (const person of officeClones) requireMatch(byVoice.has(person.decorativeCloneOf) &&
  !person.voiceId && !person.gameCharacterId, 'A decorative clerk clone gained a speech identity');

requireMatch(existsSync(resolve(root, 'assets/models/towel-pedestrians/man.glb')) &&
  existsSync(resolve(root, 'assets/models/towel-pedestrians/woman.glb')),
  'Towel pedestrian model missing');
for (const voiceId of ['spieler-hans-peter-mustermann', 'polizei-heinrich-wachtmeister',
  'tourist-guenther-liegestuhl', 'touristin-walburga-handtuch'])
  requireMatch(byVoice.has(voiceId), `Uncatalogued modeled speaker ${voiceId}`);

requireMatch(STREET_CATALOG.length === 8 && STREET_CATALOG.every(model =>
  model.id && model.title && !Object.hasOwn(model, 'voiceId')),
  'Street visual templates now own speaker identities; audit them as characters');
requireMatch(source('assets/models/street-characters/runtime.js').includes('characterIdFor(state)'),
  'Street visual templates no longer select from NPC state');
const streetSpeakers = [...city.map(person => person.voiceId), ...crowd];
requireMatch(Object.keys(STREET_TEMPLATE_GENDER).length === STREET_CATALOG.length &&
  STREET_CATALOG.every(model => Object.hasOwn(STREET_TEMPLATE_GENDER, model.id)),
  'Missing gender presentation for a street template');
requireMatch(Object.keys(STREET_PERSONA_MAP).length === streetSpeakers.length &&
  streetSpeakers.every(voiceId => Object.hasOwn(STREET_PERSONA_MAP, voiceId)),
  'Optional street pack needs an explicit template for every city and crowd speaker');
const streetPersonaMapping = streetSpeakers.map(voiceId => {
  const person = byVoice.get(voiceId), choice = STREET_PERSONA_MAP[voiceId];
  requireMatch(STREET_CATALOG.some(model => model.id === choice.templateId) &&
    STREET_TEMPLATE_GENDER[choice.templateId] === person.gender && choice.fit,
  `Street template/gender/demeanor review missing for ${voiceId}`);
  return {voiceId, fullName: person.fullName, gender: person.gender,
    targetValence: person.targetValence, targetArousal: person.targetArousal,
    generalDemeanor: person.generalDemeanor, templateId: choice.templateId, fit: choice.fit};
});

const report = {
  schemaVersion: 2,
  status: 'explicit_runtime_speakers_verified; optional_visual_template_mapping_curated; rendered_review_pending',
  sourceSha256: Object.fromEntries(['For-AI/VOICE-CAST.json', ...runtimeFiles,
    'assets/models/street-characters/models.js',
    'assets/models/street-characters/runtime.js',
    'assets/models/street-characters/persona-map.js'].map(file => [file, hash(file)])),
  counts: {newNonpoliticalProfiles: newProfiles.length, existingPoliticalProfiles: political.length,
    namedCityNpcBindings: city.length, namedCrowdIdentities: crowd.length,
    staticBuergeramtSpeakers: officeSpeakers.length, decorativeClerkClones: officeClones.length,
    optionalStreetVisualTemplates: STREET_CATALOG.length,
    mappedStreetSpeakers: streetPersonaMapping.length},
  staticBuergeramt: office,
  city,
  crowdVoiceIds: crowd,
  optionalStreetVisualTemplates: STREET_CATALOG.map(({id, title, role}) =>
    ({id, title, role, genderPresentation: STREET_TEMPLATE_GENDER[id]})),
  optionalStreetPersonaMapping: streetPersonaMapping,
  interpretation: 'The optional street meshes are appearance templates for 31 existing named city/crowd speakers. The runtime chooses an explicitly curated gender- and demeanor-fitting mesh by voiceId; unknown named speakers keep their existing artwork. A forced visual-debug URL can override the mesh for inspection only. Template titles are not displayed game identities and own no dialogue or voice profile. If one becomes a distinct speaking character, create a named cast entry and Secret Tunnel profile.',
  limits: 'This static audit verifies source bindings, declared gender presentation and curated persona choices, not perceptual voice identity, rendered mesh suitability, normal-play model rendering, or every dynamic dialogue line. The street pack remains opt-in pending visual review.'
};
const target = resolve(root, 'For-AI/VOICE-MODEL-COVERAGE-AUDIT.json');
const rendered = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check')) {
  requireMatch(source('For-AI/VOICE-MODEL-COVERAGE-AUDIT.json') === rendered,
    'Voice/model audit has changed; regenerate and review it');
  console.log(`Verified ${newProfiles.length} new profiles, ${city.length} city NPCs, ${crowd.length} crowd identities`);
} else {
  writeFileSync(target, rendered);
  console.log(`Wrote ${target}: ${newProfiles.length} new profiles, ${city.length} city NPCs, ${crowd.length} crowd identities`);
}
