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
for(const line of [inventory.pools.buergeramtPolicePhone.call,...inventory.pools.buergeramtPolicePhone.replies])authored.add(inventory.pools.buergeramtPolicePhone.voiceId+"\0"+line);
for(const contexts of Object.values(inventory.pools.innerMonologues))for(const lines of Object.values(contexts))for(const line of lines)authored.add("spieler-hans-peter-mustermann\0"+line);
const crowdArchetypes=new Map(inventory.pools.crowdArchetypes.map(archetype=>[archetype.id,archetype]));
// The frozen 48 crowd auditions retain their original body scripts; dedicated
// advisers now use separately verified rule decks instead of these auditions.
const historicalCrowdArchetype=person=>crowdArchetypes.get(person.runtimeArchetype==='street-wisdom'?(person.gender==='male'?'towel-man':'towel-woman'):person.runtimeArchetype);
for(const person of cast.roleProfiles.filter(person=>person.voiceId.startsWith("crowd-"))){
 const archetype=historicalCrowdArchetype(person);
 assert.ok(archetype,`missing crowd archetype ${person.voiceId}`);
 for(const lines of Object.values(archetype.barks))for(const line of lines)authored.add(person.voiceId+"\0"+line);
}

// This immutable source receipt describes only the displaced city auditions.
// Current recording completeness is a separate strict production coverage gate.
const historicalBytes=source("assets/voices/candidate-dialogue/historical-city-source.json");
const historical=JSON.parse(historicalBytes),digest=value=>createHash("sha256").update(value).digest("hex");
assert.equal(historical.schemaVersion,1);
assert.deepEqual(historical.historicalSource,{
 path:"For-AI/VOICE-CAST.json",commit:"415e95d9159837240c74870f3b0281be52434f68",
 gitBlob:"786775713b56b962a2c1e4d97ab6284ed108f45f",sha256:"119cad66ca6fe2d1d3257353f325f1e8550caa983566b7c9de42a0efc85a3a16"
});
assert.equal(historical.candidateManifestSha256,digest(source("assets/voices/candidate-dialogue/manifest.json")));
assert.equal(historical.bindings.length,19);assert.equal(historical.links.length,76);
const historicalBindings=new Map(),historicalCity=new Map(),historicalSlots=new Set();
for(const binding of historical.bindings){
 assert.match(binding.actorId,/^city-[a-z-]+$/);assert.equal(binding.voiceId,"stadt-"+binding.actorId.slice(5));
 assert.match(binding.profileId,/^[a-f0-9]{32}$/);assert.match(binding.referenceSha256,/^[a-f0-9]{64}$/);
 assert.equal(binding.referenceHashKind,"uploaded-original");assert.ok(!historicalBindings.has(binding.voiceId));
 historicalBindings.set(binding.voiceId,binding);
}
for(const row of historical.links){
 const binding=historicalBindings.get(row.voiceId),clip=manifest.clips.find(clip=>clip.clipId===row.clipId);
 assert.ok(binding&&clip,"historical clip link "+row.clipId);assert.equal(row.actorId,binding.actorId);
 assert.ok(row.region==="germany"||row.region==="berlin");assert.ok(row.slot===0||row.slot===1);
 assert.equal(row.clipId,row.voiceId+"-"+String((row.region==="berlin"?2:0)+row.slot+1).padStart(2,"0"),"historical slot "+row.clipId);
 const slot=row.actorId+"\0"+row.region+"\0"+row.slot;assert.ok(!historicalSlots.has(slot));historicalSlots.add(slot);
 assert.match(row.sourceLocator,row.region==="berlin"?/^game\.js npcDenglisch\[[0-9]\]$/:/^game\.js npcLines\[[0-9]\]$/,"historical source locator");
 assert.equal(row.spokenSha256,digest(clip.text),"historical spoken source "+row.clipId);
 for(const field of ["voiceId","profileId","referenceSha256","referenceHashKind"])assert.equal(clip[field],binding[field],"historical "+field+" "+row.clipId);
 const key=row.voiceId+"\0"+clip.text;assert.ok(!historicalCity.has(key));historicalCity.set(key,row);
}
for(const binding of historicalBindings.values())assert.equal(historical.links.filter(row=>row.actorId===binding.actorId).length,4);
// Reviewed source artifact pin also protects precise source indices and snapshot links.
assert.equal(digest(historicalBytes),"ed2beb0131f98161ba0cd3ee3ab649e3addc9d48a36bade37d8f0432ac2658c6","historical receipt changed; review its committed source, not current scripts");

const library=source("For-AI/AUDIO-TEXT-LIBRARY.js").toString();
const load=search=>{
 const context=vm.createContext({window:{},location:{search},URLSearchParams});
 vm.runInContext(library,context);
 return context.window.GermanySimulatorAudioText;
};
const off=load("");
const on=load("?voicePreview=1");
assert.equal(manifest.lineCount,236);
assert.equal(manifest.clips.filter(clip=>clip.asrWordExact).length,170);
const originalCandidates=manifest.clips.filter(clip=>!clip.provenanceManifest);
assert.equal(originalCandidates.length,223);
const a38=manifest.clips.find(clip=>clip.clipId==="amt-brunhilde-knick-09");
assert.ok(a38?.asrWordExact);
assert.match(a38.asr,/\bA38\b/);
assert.equal(a38.construction?.type,"same-profile-segment-splice");
assert.equal(a38.construction?.sourceWavSha256?.length,2);
const dieter=manifest.clips.find(clip=>clip.clipId==="amt-dieter-papiermann-02");
assert.ok(dieter?.asrWordExact);
assert.match(dieter.asr,/Frau Knick nennt das ein freies Zeitfenster/);
assert.equal(dieter.construction?.type,"same-profile-segment-splice");
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
const policeDefaults=JSON.parse(source('assets/voices/police-dialogue/polizei-heinrich-wachtmeister-manifest.json')).clips;
for(const clip of originalCandidates){
 const key=clip.voiceId+"\0"+clip.text;
 assert.ok(!keys.has(key),`duplicate candidate ${clip.clipId}`);
 keys.add(key);
 assert.ok(clip.retiredReason||historicalCity.has(key)||authored.has(key)||clip.voiceId==="amt-brunhilde-knick"&&(officeStory.includes(clip.text)||officeRuntime.includes(clip.text)),`unowned line ${clip.clipId}`);
 const owner=historicalBindings.get(clip.voiceId)||owners.get(clip.voiceId);
 assert.equal(clip.profileId,owner?.profileId,`profile binding ${clip.clipId}`);
 assert.equal(clip.referenceSha256,owner?.referenceSha256,`reference binding ${clip.clipId}`);
 const official=off.candidateClip(clip.voiceId,clip.text);
 const selected=cast.productionVoices[clip.voiceId],oldProfile=selected&&clip.profileId!==selected.profileId;
 assert.equal(on.candidateClip(clip.voiceId,clip.text),official||(clip.retiredReason||oldProfile?null:clip.path));
 const fever=JSON.parse(source('./assets/voices/amt-fever/manifest.json')).clips.find(c=>c.voiceId===clip.voiceId&&c.text===clip.text);
 const knick=JSON.parse(source('./assets/voices/knick/manifest.json')).clips.find(c=>c.voiceId===clip.voiceId&&c.text===clip.text);
 const police=policeDefaults.find(c=>c.voiceId===clip.voiceId&&c.text===clip.text);
 assert.equal(official,clip.clipId==='amt-horst-stempelmann-03'?'./assets/voices/horst-stempelmann/omen-candidate-02.mp3':knick?'./'+knick.file:fever?'./'+fever.path:police?'./'+police.file:null);
 if(clip.archiveRelativePath)assert.equal(clip.archiveRelativePath,'assets/'+clip.path);
 else assert.equal(createHash("sha256").update(source(clip.path)).digest("hex"),clip.sha256);
}
// Historical auditions do not establish current personalized city production coverage.
for(const person of cast.characters.filter(person=>!person.gameCharacterId?.startsWith("city-")))for(const line of person.dialogue){
 assert.ok(keys.has(person.voiceId+"\0"+line.text),`missing fixed-character audition ${person.voiceId}: ${line.text}`);
}
const officeContext=vm.createContext({window:{}});
vm.runInContext(officeStory,officeContext);
const office=officeContext.window.BuergeramtStory;
const clerkLines=[...office.clerk.flatMap(counter=>[counter.line,...counter.choices.map(choice=>choice.reply)]),...office.outburst.lines];
assert.equal(clerkLines.length,20); // The current final dismissal uses its fixed production recording.
for(const line of clerkLines)assert.ok(keys.has("amt-brunhilde-knick\0"+line),`missing clerk audition ${line}`);
const policeLines=Object.values(inventory.pools.policeBarks).flat();
assert.equal(new Set(policeLines).size,12);
for(const line of policeLines)assert.ok(keys.has("polizei-heinrich-wachtmeister\0"+line),`missing police audition ${line}`);
const playerLines=new Set(Object.values(inventory.pools.innerMonologues).flatMap(contexts=>Object.values(contexts).flat()));
assert.equal(playerLines.size,45);
for(const line of playerLines)assert.ok(keys.has("spieler-hans-peter-mustermann\0"+line),`missing player audition ${line}`);
for(const person of cast.roleProfiles.filter(person=>person.voiceId.startsWith("crowd-"))){
 const archetype=historicalCrowdArchetype(person);
 for(const line of new Set(Object.values(archetype.barks).flat()))assert.ok(keys.has(person.voiceId+"\0"+line),`missing crowd audition ${person.voiceId}: ${line}`);
}
assert.equal(on.candidateClip("amt-horst-stempelmann","a different line"),null);
const game=source("game.js").toString(),amt=source("buergeramt.js").toString(),phone=source("buergeramt-phone.js").toString();
assert.ok(game.includes("id=candidateVoiceId||voiceKey,recording=speechCatalog.candidateClip?.(id,text)"));
assert.ok(game.includes("speechCatalog.candidateSequence?.(id,candidateSegments)"));
assert.ok(game.includes("n.voiceId"));
assert.ok(game.includes("candidateVoiceId:n.voiceId"));
assert.ok(game.includes('candidateVoiceId:"polizei-heinrich-wachtmeister"'));
assert.ok(amt.includes("clerk?.voiceId"),"each selected counter clerk must request her own voice");
assert.ok(amt.includes("candidateClip?.(voiceId,text)"));
assert.ok(phone.includes('catalog?.recordedClip?.(voiceId,source)||catalog?.candidateClip?.(voiceId,source)'));
