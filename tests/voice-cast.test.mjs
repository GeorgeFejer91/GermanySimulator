import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const source=file=>readFileSync(resolve(root,file),"utf8");
const cast=JSON.parse(source("For-AI/VOICE-CAST.json"));
const context=vm.createContext({window:{}});
vm.runInContext(source("For-AI/AUDIO-TEXT-LIBRARY.js"),context);
const {voices,castVoices,roleVoices,recordings}=context.window.GermanySimulatorAudioText;
const game=source("game.js");
const story=source("buergeramt-story.js");
vm.runInContext(source("For-AI/QUIZ-CHARACTER-DICTIONARY.js"),context);
const quizPeople=context.window.GermanySimulatorQuizCharacters.characters;
const crowdNames=JSON.parse(game.match(/const crowdNames=(\[[^;]+\]);/)[1]);
const crowdVoiceIds=JSON.parse(game.match(/const crowdVoiceIds=(\[[^;]+\]);/)[1]);
const namedNpcs=game.slice(game.indexOf("const npcs=["),game.indexOf("].map(n=>n.special"));
const cityRoster=[...namedNpcs.matchAll(/id:"(city-[^"]+)",name:"[^"]+",fullName:"([^"]+)",voiceId:"([^"]+)"/g)].map(([,id,fullName,voiceId])=>({id,fullName,voiceId}));
assert.equal([...namedNpcs.matchAll(/fullName:"[^"]+"/g)].length,cityRoster.length,"every named city model has an ID and voice binding");
const officeContext=vm.createContext({window:{}});
vm.runInContext(story,officeContext);
const officeRoster=Object.entries(officeContext.window.BuergeramtStory.characters).map(([id,person])=>({id,fullName:person.fullName,voiceId:person.voiceId}));
assert.equal(cityRoster.length,cast.characters.filter(person=>person.gameCharacterId.startsWith("city-")).length,"all fixed nonpolitical city models are inventoried");
assert.equal(officeRoster.length,cast.characters.filter(person=>!person.gameCharacterId.startsWith("city-")).length,"all optional Bürgeramt walkers are inventoried");
assert.deepEqual(new Set(cityRoster.map(person=>person.voiceId)),new Set(cast.characters.filter(person=>person.gameCharacterId.startsWith("city-")).map(person=>person.voiceId)));
assert.deepEqual(new Set(officeRoster.map(person=>person.voiceId)),new Set(cast.characters.filter(person=>!person.gameCharacterId.startsWith("city-")).map(person=>person.voiceId)));
assert.deepEqual(new Set(crowdVoiceIds),new Set(cast.roleProfiles.filter(person=>person.voiceId.startsWith("crowd-")).map(person=>person.voiceId)));
for(const person of [...cityRoster,...officeRoster]){
 const recorded=cast.characters.find(candidate=>candidate.voiceId===person.voiceId);
 assert.equal(recorded?.fullName,person.fullName,`runtime name for ${person.voiceId}`);
}
for(const voiceId of ["spieler-hans-peter-mustermann","polizei-heinrich-wachtmeister","amt-brunhilde-knick","tourist-guenther-liegestuhl","touristin-walburga-handtuch"]){
 assert.ok(cast.roleProfiles.some(person=>person.voiceId===voiceId),`missing modeled role ${voiceId}`);
}

assert.equal(cast.characterCount,cast.characters.length);
assert.equal(cast.dialogueCount,cast.characters.reduce((total,person)=>total+person.dialogue.length,0));
assert.equal(cast.roleProfileCount,cast.roleProfiles.length);
assert.equal(cast.totalNewProfileCount,cast.characterCount+cast.roleProfileCount);
assert.equal(new Set(cast.characters.map(person=>person.voiceId)).size,cast.characterCount);
assert.equal(new Set(cast.characters.map(person=>person.secretTunnel.profileId)).size,cast.characterCount);
assert.equal(Object.keys(castVoices).length,cast.characterCount);

for(const person of cast.characters){
 const {gameCharacterId,voiceId,fullName,secretTunnel,reference}=person;
 assert.match(voiceId,/^(amt|stadt)-[a-z0-9-]+-[a-z0-9-]+$/);
 assert.ok(secretTunnel.profileId,/missing Secret Tunnel profile for ${voiceId}/);
 assert.equal(voices[voiceId].profileId,secretTunnel.profileId);
 assert.equal(voices[voiceId].profileName,secretTunnel.profileName);
 assert.equal(voices[voiceId].referenceSha256,reference.workingReferenceSha256);
 assert.equal(voices[voiceId].name,fullName);
 assert.ok(person.dialogue.every(item=>item.text&&item.locator),`missing exact dialogue for ${voiceId}`);
 if(gameCharacterId.startsWith("city-")){
  assert.ok(namedNpcs.includes(`id:"${gameCharacterId}",name:"${person.displayRole}",fullName:"${fullName}",voiceId:"${voiceId}"`),`game binding for ${voiceId}`);
 }else{
  assert.ok(story.includes(`${gameCharacterId}:{speaker:`),`story role ${gameCharacterId}`);
  assert.ok(story.includes(`fullName:"${fullName}",voiceId:"${voiceId}"`),`Amt binding for ${voiceId}`);
 }
}
for(const asset of cast.existingAssetProfiles){
 assert.equal(voices[asset.voiceId].profileId,asset.secretTunnelProfileId);
 assert.equal(voices[asset.voiceId].profileName,asset.secretTunnelProfileName);
 assert.equal(voices[asset.voiceId].referenceSha256,asset.referenceSha256);
 assert.ok(asset.source.every(item=>item.path&&item.sha256&&item.text));
}
assert.equal(Object.keys(roleVoices).length,cast.roleProfiles.length);
for(const clip of Object.values(recordings)){
 if(clip.trigger?.startsWith("player.")&&clip.targetVoiceId)assert.equal(clip.targetVoiceId,"spieler-hans-peter-mustermann",`replacement identity for ${clip.id}`);
}
for(const role of cast.roleProfiles){
 assert.equal(voices[role.voiceId].name,role.fullName);
 assert.equal(voices[role.voiceId].profileId,role.secretTunnelProfileId);
 assert.equal(voices[role.voiceId].profileName,role.secretTunnelProfileName);
 assert.equal(voices[role.voiceId].referenceSha256,role.reference.workingReferenceSha256);
 if(role.voiceId.startsWith("quiz-")){
  assert.ok(quizPeople.some(person=>person.name.replace(/^Dr\. /,"")===role.fullName&&person.voiceId===role.voiceId),`quiz identity ${role.voiceId}`);
 }else if(role.voiceId.startsWith("crowd-")){
  const index=crowdNames.indexOf(role.fullName.toLocaleUpperCase());
  assert.ok(index>=0,`crowd identity ${role.voiceId}`);
  assert.equal(crowdVoiceIds[index],role.voiceId);
  assert.equal(role.gender,index%2?"male":"female",`crowd name and visible archetype gender for ${role.voiceId}`);
  assert.equal(role.runtimeArchetype,index%2?"towel-man":"towel-woman",`runtime archetype for ${role.voiceId}`);
 }else if(role.voiceId==="amt-brunhilde-knick"){
  assert.ok(story.includes(`clerkIdentity:{speaker:"SACHBEARBEITERIN FRAU KNICK",fullName:"${role.fullName}",voiceId:"${role.voiceId}"}`),"modeled Bürgeramt clerk identity");
 }else{
  assert.ok(game.includes(`fullName:"${role.fullName}",voiceId:"${role.voiceId}"`),`3D role binding for ${role.voiceId}`);
 }
}
execFileSync(process.execPath,[resolve(root,"tools/build-voice-dialogue-inventory.mjs"),"--check"],{cwd:root,stdio:"pipe"});
console.log(`${cast.totalNewProfileCount} named game and Secret Tunnel voice bindings validated`);
