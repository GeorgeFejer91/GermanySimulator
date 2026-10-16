import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import {matchesProduction,runtimeBlock} from '../tools/curate-voice-library.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cast=JSON.parse(readFileSync(resolve(root,'For-AI/VOICE-CAST.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'),context,{timeout:3000});
const catalog=context.window.GermanySimulatorAudioText;
const sha=value=>createHash('sha256').update(value).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const expectedProfiles=[
  {
    "voiceId": "bayern",
    "profileName": "GS Bayern-Beauftragter (bayern)",
    "profileIdSha256": "a113fe905e4c8a047a83d97acd8244bfffdb4b635ebe7402809f9d05e893418a",
    "originalSha256": "d1801a3382b02506efd0474168b6920259dfabf60352dc445ce934ef81e31305",
    "referenceSha256": "629d0361cbe86d36e67e1e21d6fca8512314dbffbb7b0980d895a2226e9c7870",
    "profileMetadataSha256": "c7f70ddaef3be67dd44aede61cf2d6a3cc60ba29d31000f2b73f0d0b721e1b2f",
    "nativeSaveReceiptSha256": "3e798cea6b16ed2146a8250eaa6e123c2ab276a94e533c11d172f84a8ca1d54a",
    "sourcePath": "assets/voices/bayern/baden-wuerttemberg-not-bayern.mp3",
    "sourceText": "Und als letzten Punkt: Baden-Württemberg. Ah, nicht Bayern."
  },
  {
    "voiceId": "alice",
    "profileName": "GS Alice Weidel (alice satire)",
    "profileIdSha256": "a1053bd5258ae7da4c4c808818d7e6d3ba19600b96d4509368bb4eac6fe37dd0",
    "originalSha256": "f9891eaba1cc5bad71dbca8acd79a10769bc721fd9c711ce00ee2196715f8f22",
    "referenceSha256": "3e6960680737c537a9c09695088bf8e2c5e1c588a9e6561facb0237ef1988a28",
    "profileMetadataSha256": "714beec98a52c1e8cf2deaf14884b5990d0499bf814acd7a316905fcbf0880ae",
    "nativeSaveReceiptSha256": "3e798cea6b16ed2146a8250eaa6e123c2ab276a94e533c11d172f84a8ca1d54a",
    "sourcePath": "assets/voices/alice-weidel/traditionelle-familie.mp3",
    "sourceText": "Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens."
  }
];
const expectedLegacy=[
  {
    "id": "bayern-baden-wuerttemberg-not-bayern",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/baden-wuerttemberg-not-bayern.mp3",
    "source": "Und als letzten Punkt: Baden-Württemberg. Ah, nicht Bayern.",
    "recordingObjectSha256": "329867aab874041c4c20960f8e7a807e6ebd349ee2c73c9b5b2935d88c05e10c"
  },
  {
    "id": "bayern-wie-schoen-bayern-ist",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/wie-schoen-bayern-ist.mp3",
    "source": "Wie schön Bayern ist. Geh nach Bayern. In Bayern gibt's Bayern. Nur in Bayern gibt's Bayern.",
    "recordingObjectSha256": "83a83f9456203345b108fd802479e88b1815e23f1bc147c38d8c8c4f3dedf071"
  },
  {
    "id": "bayern-stichwort-bayern",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/stichwort-bayern.mp3",
    "source": "Für Bayern ist das wichtig. Stichwort Bayern.",
    "recordingObjectSha256": "d7dfb7909cf8f9564bdf3430fc03ee77bb5d94b68368aab9ce3d63b11318e453"
  },
  {
    "id": "bayern-bayern-leben",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/bayern-leben.mp3",
    "source": "Oh ja, man muss Bayern nicht mögen, man muss Bayern leben.",
    "recordingObjectSha256": "cfc02f8b6031165b98a9bbeabd66adfd05392a13a6691213b993b6ce31234a0d"
  },
  {
    "id": "bayern-warum-weil-bayern",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/warum-weil-bayern.mp3",
    "source": "Warum? Weil Bayern.",
    "recordingObjectSha256": "b6757f9a54c433da565a11e099ff28266eacd41694c256a02ff71ae4904c6656"
  },
  {
    "id": "bayern-ich-will-nur-eins-sagen",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/ich-will-nur-eins-sagen.mp3",
    "source": "Ich will nur eins sagen: Bayern, Bayern, Bayern, Bayern.",
    "recordingObjectSha256": "be77fb7e95c7025895e391f8922f158b179bbd3672e662988af9fb3b483741ee"
  },
  {
    "id": "bayern-rettung-bayerns",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/rettung-bayerns.mp3",
    "source": "Ein Bayern kam aus Bayern. Das war die Rettung Bayerns.",
    "recordingObjectSha256": "0a20fd73071b141655b5ee71a4536c9af116b5488fed723f3ed1920290b75651"
  },
  {
    "id": "bayern-gott-schuetze-bayern",
    "voiceId": "bayern",
    "path": "./assets/voices/bayern/gott-schuetze-bayern.mp3",
    "source": "Gott schütze Bayern.",
    "recordingObjectSha256": "fb48a5fff62bef421ee02c59f723c2f7d739008643d96f713226b0845a1c20e1"
  },
  {
    "id": "alice-deutschland-schweiz",
    "voiceId": "alice",
    "path": "./assets/voices/alice-weidel/deutschland-schweiz.mp3",
    "source": "Ich liebe Deutschland. Besonders aus der Schweiz.",
    "recordingObjectSha256": "3b8b9ee877df7e383dd3ea63629a85a6ca8a1a3b70b369b3d8a3aacd698a1d0a"
  },
  {
    "id": "alice-hitler-ddr-leberkaese",
    "voiceId": "alice",
    "path": "./assets/voices/alice-weidel/hitler-ddr-leberkaese.mp3",
    "source": "Adolf Hitler war ein Linker. Die DDR hieß schließlich auch Demokratische Republik. Und Deutsche Leberkäse besteht selbstverständlich aus Leber und Käse.",
    "recordingObjectSha256": "17f8434414104dec777f48b2ec6487a61d8e14628d4ca7c24cd8c8dadfa41b7c"
  },
  {
    "id": "alice-nationalsozialisten-sozialisten",
    "voiceId": "alice",
    "path": "./assets/voices/alice-weidel/nationalsozialisten-sozialisten.mp3",
    "source": "Die Nationalsozialisten waren Sozialisten, sonst hätte man sie ja Nationalirgendwas genannt.",
    "recordingObjectSha256": "9a782c6b686127826fbec5b95470f4c05618deb85e251c7afb71eefaca0710cd"
  },
  {
    "id": "alice-traditionelle-familie",
    "voiceId": "alice",
    "path": "./assets/voices/alice-weidel/traditionelle-familie.mp3",
    "source": "Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens.",
    "recordingObjectSha256": "f3e082ac578501bc70575780fb309d7ee24ebf80f2cbc305078f7be418d0ac1d"
  },
  {
    "id": "alice-eliten-sind-das-problem",
    "voiceId": "alice",
    "path": "./assets/voices/alice-weidel/eliten-sind-das-problem.mp3",
    "source": "Eliten sind das Problem. Aber zum Glück habe ich Wirtschaft studiert, bei Goldman Sachs gearbeitet und wohne in der Schweiz.",
    "recordingObjectSha256": "9c71aa26d2ac4febbb789e41a0b1039e4c69cb4fc625168808fa8fcf5d3f7af0"
  }
];

test('69 voice identities include exactly two distinct saved own-source cameos',()=>{
 assert.equal(Object.keys(cast.productionVoices).length,67,'fixed production allocations stay separate');
 assert.equal(Object.values(catalog.voices).filter(voice=>voice.profileId).length,69);
 const cameos=cast.existingAssetProfiles.filter(asset=>asset.gameRole==='city-political-cameo');
 assert.deepEqual(cameos.map(asset=>asset.voiceId).sort(),['alice','bayern']);
 const productionIds=new Set(Object.values(cast.productionVoices).map(voice=>voice.profileId));
 const savedIds=new Set();
 for(const expected of expectedProfiles){
  const asset=cameos.find(row=>row.voiceId===expected.voiceId),voice=catalog.voices[expected.voiceId];
  assert.ok(asset,expected.voiceId);
  assert.equal(asset.gameCharacterId,expected.voiceId);
  assert.equal(asset.secretTunnelProfileName,expected.profileName);
  assert.equal(sha(asset.secretTunnelProfileId),expected.profileIdSha256,'actual native saved identity');
  assert.equal(voice.profileId,asset.secretTunnelProfileId);
  assert.equal(voice.profileName,asset.secretTunnelProfileName);
  assert.equal(asset.originalSha256,expected.originalSha256);
  assert.equal(voice.originalSha256,expected.originalSha256);
  assert.equal(asset.referenceSha256,expected.referenceSha256);
  assert.equal(voice.referenceSha256,expected.referenceSha256);
  assert.equal(asset.savedProfileVerification.profileMetadataSha256,expected.profileMetadataSha256);
  assert.equal(asset.savedProfileVerification.nativeSaveReceiptSha256,expected.nativeSaveReceiptSha256);
  assert.deepEqual(plain(asset.source),[{path:expected.sourcePath,sha256:expected.originalSha256,text:expected.sourceText}]);
  assert.match(asset.sourceLicense,/user-supplied/i);
  assert.match(asset.sourceLicense,/unverified/i);
  assert.doesNotMatch(asset.sourceLicense,/CC0/);
  assert.equal(cast.productionVoices[expected.voiceId],undefined);
  assert.notEqual(voice.generationAllowed,true);
  assert.equal(voice.renderer,undefined,'a saved reference is not a rendered take');
  assert.equal(productionIds.has(voice.profileId),false,'never borrow a production character profile');
  savedIds.add(voice.profileId);
 }
 assert.equal(savedIds.size,2);
});

test('all thirteen supplied recording objects and exact source lookups are unchanged',()=>{
 assert.equal(expectedLegacy.length,13);
 assert.equal(expectedLegacy.filter(row=>row.voiceId==='bayern').length,8);
 assert.equal(expectedLegacy.filter(row=>row.voiceId==='alice').length,5);
 for(const expected of expectedLegacy){
  const recording=catalog.recordings[expected.path];
  assert.ok(recording,expected.id);
  assert.equal(sha(JSON.stringify(recording)),expected.recordingObjectSha256,expected.id+' complete original object');
  assert.equal(catalog.recordedClip(expected.voiceId,expected.source),expected.path,expected.id+' exact lookup');
  assert.equal(catalog.clips[expected.id].voiceId,expected.voiceId);
  assert.equal(recording.profileId,undefined,'no new UUID stamped on old audio');
  assert.notEqual(recording.fixedProduction,true);
 }
});

test('saved cameo references cannot masquerade as fixed generated takes',()=>{
 const scope={};vm.runInNewContext(runtimeBlock(cast)+';globalThis.accepts=productionClip;',scope);
 for(const expected of expectedProfiles){
  const voice=catalog.voices[expected.voiceId];
  const fake={voiceId:expected.voiceId,profileId:voice.profileId,fixedProduction:true,referenceSha256:voice.referenceSha256,referenceOriginalSha256:voice.originalSha256};
  assert.equal(scope.accepts(fake),false);
  assert.equal(matchesProduction(cast,fake),false);
 }
});

test('all 67 existing fixed voices retain exact-profile rejection',()=>{
 const scope={};vm.runInNewContext(runtimeBlock(cast)+';globalThis.accepts=productionClip;',scope);
 const unrelated=catalog.voices.bayern.profileId;
 for(const [voiceId,binding] of Object.entries(cast.productionVoices)){
  const valid={voiceId,profileId:binding.profileId,fixedProduction:true,renderer:binding.renderer,modelRevision:binding.modelRevision,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,processing:binding.processing??null};
  assert.equal(matchesProduction(cast,valid),true,voiceId+' selected profile');
  assert.equal(scope.accepts(valid),true,voiceId+' selected runtime profile');
  assert.equal(matchesProduction(cast,{...valid,profileId:unrelated}),false,voiceId+' foreign saved profile');
  assert.equal(scope.accepts({...valid,profileId:unrelated}),false,voiceId+' foreign runtime profile');
 }
});
