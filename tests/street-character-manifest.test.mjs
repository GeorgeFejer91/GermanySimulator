import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { registerStreetCharacterManifest, resolveStreetCharacter, advanceStreetAnimation, requestStreetReaction } from '../street-character-sprites.js';

const manifest = JSON.parse(await readFile(new URL('../assets/characters/street/manifest.json', import.meta.url), 'utf8'));
const entries = Object.entries(manifest.characters);

test('all forty-three installed standing sprites match shipped manifest hashes and literal identity aliases', async () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(entries.length, 43);
  registerStreetCharacterManifest(manifest);
  const aliases = new Set();
  let encodedBytes = 0;
  for (const [id, person] of entries) {
    assert.equal(person.id, id);
    assert.equal(person.standingOnly, true);
    assert.deepEqual(person.cell, [128, 160]);
    assert.deepEqual(person.pivot, [64, 150]);
    assert.equal(person.figureHeight, 136);
    assert.equal(person.standing.file, `./assets/characters/street/${id}-standing.webp`);
    assert.equal(person.standing.width, 128);
    assert.equal(person.standing.height, 160);
    assert.equal(person.figureWorldHeight, id === 'spieler-hans-peter-mustermann' ? 1.5 : id === 'polizei-heinrich-wachtmeister' ? 1.56 : 1.6);
    const bytes = await readFile(new URL(`../assets/characters/street/${id}-standing.webp`, import.meta.url));
    encodedBytes += bytes.length;
    assert.equal(createHash('sha256').update(bytes).digest('hex'), person.standing.sha256, id);
    for (const alias of person.aliases) {
      assert.equal(typeof alias, 'string');
      assert.ok(!alias.includes('$'));
      assert.ok(!aliases.has(alias), `duplicate alias ${alias}`);
      aliases.add(alias);
      assert.equal(resolveStreetCharacter({ id: alias }), id);
    }
  }
  assert.equal(encodedBytes, 734544);
  assert.equal(resolveStreetCharacter({ id: 'player-default' }), 'spieler-hans-peter-mustermann');
  assert.equal(resolveStreetCharacter({ voiceId: 'polizei-heinrich-wachtmeister', id: 'police-27' }), 'polizei-heinrich-wachtmeister');
  assert.equal(resolveStreetCharacter({ id: 'crowd-baerbel-brezel-7' }), null);
});

test('standing-only admission keeps motion and mouth claims absent', () => {
  registerStreetCharacterManifest(manifest);
  const actor = { id: 'city-ute-ruhe', x: 0, y: 0 };
  const pose = advanceStreetAnimation(actor, 4, 0.1, { speaking: true, cueToken: 'test' });
  assert.equal(pose.clip, 'standing');
  assert.equal(pose.slot, 0);
  assert.equal(pose.mouthOpen, 0);
  assert.equal(requestStreetReaction(actor, 'wave'), false);
  const malformed = structuredClone(manifest);
  malformed.characters['stadt-ute-ruhe'].clips = { idle: { offset: 0, count: 1 } };
  assert.throws(() => registerStreetCharacterManifest(malformed), /cannot declare motion metadata/);
  assert.equal(resolveStreetCharacter(actor), 'stadt-ute-ruhe');
});
