import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const source=path=>readFileSync(resolve(root,path));
const manifest=JSON.parse(source("assets/voices/candidate-dialogue/manifest.json"));
const cast=JSON.parse(source("For-AI/VOICE-CAST.json"));
const owners=new Map([...cast.characters.map(person=>[person.voiceId,{profileId:person.secretTunnel.profileId,referenceSha256:person.reference.workingReferenceSha256}]),...cast.roleProfiles.map(person=>[person.voiceId,{profileId:person.secretTunnelProfileId,referenceSha256:person.reference.workingReferenceSha256}])]);
const authored=new Set(cast.characters.flatMap(person=>person.dialogue.map(line=>person.voiceId+"\0"+line.text)));
const inventory=JSON.parse(source("For-AI/VOICE-DIALOGUE-INVENTORY.json"));
const officeStory=source("buergeramt-story.js").toString();
const officeRuntime=source("buergeramt.js").toString();
for(const lines of Object.values(inventory.pools.policeBarks))for(const line of lines)authored.add("polizei-heinrich-wachtmeister\0"+line);
for(const line of [inventory.pools.buergeramtPolicePhone.call,...inventory.pools.buergeramtPolicePhone.replies])authored.add("polizei-heinrich-wachtmeister\0"+line);
for(const contexts of Object.values(inventory.pools.innerMonologues))for(const lines of Object.values(contexts))for(const line of lines)authored.add("spieler-hans-peter-mustermann\0"+line);
const crowdArchetypes=new Map(inventory.pools.crowdArchetypes.map(archetype=>[archetype.id,archetype]));
for(const person of cast.roleProfiles.filter(person=>person.voiceId.startsWith("crowd-"))){
 const archetype=crowdArchetypes.get(person.runtimeArchetype);
 assert.ok(archetype,`missing crowd archetype ${person.voiceId}`);
 for(const lines of Object.values(archetype.barks))for(const line of lines)authored.add(person.voiceId+"\0"+line);
}
const library=source("For-AI/AUDIO-TEXT-LIBRARY.js").toString();
const load=search=>{
 const context=vm.createContext({window:{},location:{search},URLSearchParams});
 vm.runInContext(library,context);
 return context.window.GermanySimulatorAudioText;
};
const off=load("");
const on=load("?voicePreview=1");
assert.equal(manifest.lineCount,203);
assert.equal(manifest.clips.filter(clip=>clip.asrWordExact).length,151);
assert.equal(manifest.clips.filter(clip=>clip.voiceId==="polizei-heinrich-wachtmeister"&&!clip.clipId.includes("-phone-")).length,12);
assert.equal(manifest.clips.filter(clip=>clip.clipId.startsWith("polizei-heinrich-wachtmeister-phone-")).length,4);
assert.equal(manifest.clips.filter(clip=>clip.voiceId==="spieler-hans-peter-mustermann").length,37);
const crowdClips=manifest.clips.filter(clip=>clip.voiceId.startsWith("crowd-"));
assert.equal(crowdClips.length,36);
assert.equal(new Set(crowdClips.map(clip=>clip.voiceId)).size,12);
assert.equal(on.candidatePreviewEnabled,true);
assert.equal(off.candidatePreviewEnabled,false);
const keys=new Set();
for(const clip of manifest.clips){
 const key=clip.voiceId+"\0"+clip.text;
 assert.ok(!keys.has(key),`duplicate candidate ${clip.clipId}`);
 keys.add(key);
 assert.ok(authored.has(key)||clip.voiceId==="amt-brunhilde-knick"&&(officeStory.includes(clip.text)||officeRuntime.includes(clip.text)),`unowned line ${clip.clipId}`);
 assert.equal(clip.profileId,owners.get(clip.voiceId)?.profileId,`profile binding ${clip.clipId}`);
 assert.equal(clip.referenceSha256,owners.get(clip.voiceId)?.referenceSha256,`reference binding ${clip.clipId}`);
 assert.equal(on.candidateClip(clip.voiceId,clip.text),clip.path);
 assert.equal(off.candidateClip(clip.voiceId,clip.text),null);
 assert.equal(createHash("sha256").update(source(clip.path)).digest("hex"),clip.sha256);
}
assert.equal(on.candidateClip("amt-horst-stempelmann","a different line"),null);
const game=source("game.js").toString(),amt=source("buergeramt.js").toString(),phone=source("buergeramt-phone.js").toString();
assert.ok(game.includes("speechCatalog.candidateClip?.(candidateVoiceId||voiceKey,text)"));
assert.ok(game.includes("n.voiceId"));
assert.ok(game.includes("candidateVoiceId:n.voiceId"));
assert.ok(game.includes('candidateVoiceId:"polizei-heinrich-wachtmeister"'));
assert.ok(amt.includes("story.clerkIdentity.voiceId"));
assert.ok(amt.includes("candidateClip?.(voiceId,text)"));
assert.ok(phone.includes('candidateClip?.("polizei-heinrich-wachtmeister",text)'));
