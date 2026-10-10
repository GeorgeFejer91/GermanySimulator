import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const window = {};
const savedPrivateIds = new Set([
  '833480652ccf455f8184cbe752861420', '44d0f901322e403fa5ad8140c68ae426',
  'eb4aab1842eb450eacbdd5d4ccc38ab6', 'e2b59f89c1a84259aaa8f7006741fae2',
  'b456ded2b16d4bc38f6751bfe52266e8', 'fd76c3fc053c4932b910fa504f376edc',
  'e7a5a74103884c308730d7effa496ce2', 'f55b40ca02e84ae696c396f211f880d6',
  'b080c7d95ecd418fb428282461d7fbe7', 'a1fd2081df674fba90118c4e6be303da',
  '2946f9d627084b68933cb72f64bc32b7', '65ebfa45e9394ccb9b4f4f5075ab672c'
]);
for (const file of ['buergeramt-story.js', 'buergeramt-voice-profiles.js']) {
  runInNewContext(readFileSync(new URL(file, root), 'utf8'), { window });
}

test('each named office speaker has one immutable, exact-text browser delivery', () => {
  const story = window.BuergeramtStory;
  const registry = window.BuergeramtVoiceProfiles;
  const expected = [
    ...Object.values(story.characters).map(character => character.voiceId),
    ...Object.values(story.patrons).map(character => character.voiceId),
    story.clerkIdentity.voiceId
  ];
  assert.equal(expected.length, 12);
  assert.equal(new Set(expected).size, 12);
  assert.deepEqual(Object.keys(registry.byVoiceId).sort(), expected.sort());
  assert.equal(Object.isFrozen(registry), true);
  assert.equal(Object.isFrozen(registry.byVoiceId), true);
  assert.equal(savedPrivateIds.size, 12);
  const boundPrivateIds = new Set();
  for (const [voiceId, profile] of Object.entries(registry.byVoiceId)) {
    assert.equal(Object.isFrozen(profile), true, voiceId);
    assert.equal(Object.isFrozen(profile.delivery), true, voiceId);
    assert.equal(registry.deliveryFor(voiceId), profile.delivery);
    assert.ok(profile.delivery.rate >= .78 && profile.delivery.rate <= .98, voiceId);
    assert.ok(profile.delivery.pitch >= .65 && profile.delivery.pitch <= 1.25, voiceId);
    assert.ok(JSON.stringify(story).includes(profile.sampleLine), voiceId);
    assert.ok(profile.demeanor && profile.rhythm && profile.texture && profile.synthesisPrompt, voiceId);
    assert.match(profile.candidateProfileId, /^[0-9a-f]{32}$/, voiceId);
    assert.ok(savedPrivateIds.has(profile.candidateProfileId), voiceId);
    assert.equal(profile.candidateStatus, 'private-unlistened', voiceId);
    boundPrivateIds.add(profile.candidateProfileId);
  }
  assert.equal(boundPrivateIds.size, 12);
  assert.equal(registry.deliveryFor('desk-clone'), null);
  assert.deepEqual({ ...registry.deliveryFor('amt-horst-stempelmann') }, { rate: .82, pitch: .72 });
});
