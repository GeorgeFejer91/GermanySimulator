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
assert.equal(manifest.lineCount,223);
assert.equal(manifest.clips.filter(clip=>clip.asrWordExact).length,156);
assert.equal(manifest.clips.filter(clip=>clip.voiceId==="polizei-heinrich-wachtmeister"&&!clip.clipId.includes("-phone-")).length,12);
assert.equal(manifest.clips.filter(clip=>clip.clipId.startsWith("polizei-heinrich-wachtmeister-phone-")).length,4);
assert.equal(manifest.clips.filter(clip=>clip.voiceId==="spieler-hans-peter-mustermann").length,45);
const bilingual=manifest.clips.filter(clip=>clip.asrSegmentWordExact);
assert.equal(bilingual.length,11);
for(const clip of bilingual){
 assert.equal(clip.renderSegments.length,clip.asrSegments.length);
 assert.ok(clip.asrSegments.every((segment,index)=>segment.asrWordExact&&segment.language===clip.renderSegments[index].language&&segment.text===clip.renderSegments[index].text));
}
const partsEquivalent=manifest.clips.filter(clip=>clip.asrBilingualPartsEquivalent);
assert.equal(partsEquivalent.length,3);
assert.ok(partsEquivalent.every(clip=>clip.asrSegments.every(part=>part.asrWordExact||part.asrCompoundEquivalent)));
const clockEquivalent=text=>text.normalize("NFKC").toLowerCase().replaceAll("textilewillenserklärung","textile willenserklärung").replace(/\b(?:sieben|07|7)\s*(?:uhr|[.:,])\s*(?:vier|04|4)(?:\s*uhr)?\b/g,"07:04").match(/[\p{L}\p{N}]+/gu)?.join(" ")||"";
const clockClips=manifest.clips.filter(clip=>clip.asrClockEquivalent);
assert.equal(clockClips.length,4);
for(const clip of clockClips){
 assert.equal(clip.asrWordExact,false);
 assert.equal(clockEquivalent(clip.asr),clockEquivalent(clip.text));
 assert.equal(clip.asrSegments.length,clip.renderSegments.length);
 assert.ok(clip.asrSegments.every((part,index)=>clockEquivalent(part.asr)===clockEquivalent(clip.renderSegments[index].text)));
}
const clockBilingual=manifest.clips.filter(clip=>clip.asrBilingualPartsClockEquivalent);
assert.equal(clockBilingual.length,3);
for(const clip of clockBilingual){
 assert.equal(clip.asrWordExact,false);
 assert.equal(clip.asrSegments.length,2);
 assert.equal(clockEquivalent(clip.asrSegments[0].asr),clockEquivalent(clip.renderSegments[0].text));
 assert.equal(clip.asrSegments[1].asr.toLowerCase(),"reserved");
}
const crowdClips=manifest.clips.filter(clip=>clip.voiceId.startsWith("crowd-"));
assert.equal(crowdClips.length,48);
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
const playerLines=new Set(Object.values(inventory.pools.innerMonologues).flatMap(contexts=>Object.values(contexts).flat()));
assert.equal(playerLines.size,45);
for(const line of playerLines)assert.ok(keys.has("spieler-hans-peter-mustermann\0"+line),`missing player audition ${line}`);
for(const person of cast.roleProfiles.filter(person=>person.voiceId.startsWith("crowd-"))){
 const archetype=crowdArchetypes.get(person.runtimeArchetype);
 for(const line of new Set(Object.values(archetype.barks).flat()))assert.ok(keys.has(person.voiceId+"\0"+line),`missing crowd audition ${person.voiceId}: ${line}`);
}
assert.equal(on.candidateClip("amt-horst-stempelmann","a different line"),null);
const game=source("game.js").toString(),amt=source("buergeramt.js").toString(),phone=source("buergeramt-phone.js").toString();
assert.ok(game.includes("id=candidateVoiceId||voiceKey,recording=speechCatalog.candidateClip?.(id,text)"));
assert.ok(game.includes("speechCatalog.candidateSequence?.(id,candidateSegments)"));
assert.ok(game.includes("n.voiceId"));
assert.ok(game.includes("candidateVoiceId:n.voiceId"));
assert.ok(game.includes('candidateVoiceId:"polizei-heinrich-wachtmeister"'));
assert.ok(amt.includes("story.clerkIdentity.voiceId"));
assert.ok(amt.includes("candidateClip?.(voiceId,text)"));
assert.ok(phone.includes('candidateClip?.("polizei-heinrich-wachtmeister",text)'));
