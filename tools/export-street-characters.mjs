import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {STREET_CATALOG, VERSION, buildStreetCharacter, createStreetGLB} from '../assets/models/street-characters/models.js';
import {CLIP_NAMES, WALK_DISTANCE} from '../assets/models/street-characters/rig.js';
const directory = new URL('../assets/models/street-characters/', import.meta.url);
await mkdir(directory, {recursive: true});
const manifest = {version: VERSION, status: 'candidate-unapproved', units: 'metres', axis: 'Y-up; +Z-front; foot midpoint origin',
  source: 'models.js + rig.js', clips: CLIP_NAMES, walkDistanceMetres: WALK_DISTANCE, models: {}};
for (const entry of STREET_CATALOG) {
  const model = buildStreetCharacter(entry.id), bytes = Buffer.from(createStreetGLB(entry.id)), file = `${entry.id}.glb`;
  const hash = createHash('sha256').update(bytes).digest('hex');
  await writeFile(new URL(file, directory), bytes);
  const readback = await readFile(new URL(file, directory));
  if (createHash('sha256').update(readback).digest('hex') !== hash) throw new Error(`Export verification failed: ${file}`);
  manifest.models[entry.id] = {file, title: entry.title, role: entry.role, triangles: model.triangles,
    vertices: model.joints.length, primitives: 1, bones: model.rig.length, dimensions: model.dimensions, bytes: bytes.length, sha256: hash};
}
manifest.totals = {models: STREET_CATALOG.length, bytes: Object.values(manifest.models).reduce((n, m) => n + m.bytes, 0)};
await writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.totals));
