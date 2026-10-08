import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const source=path=>readFileSync(resolve(root,path));
const manifest=JSON.parse(source("assets/voices/candidate-dialogue/manifest.json"));
const cast=JSON.parse(source("For-AI/VOICE-CAST.json"));
const authored=new Set(cast.characters.flatMap(person=>person.dialogue.map(line=>person.voiceId+"\0"+line.text)));
const library=source("For-AI/AUDIO-TEXT-LIBRARY.js").toString();
const load=search=>{
 const context=vm.createContext({window:{},location:{search},URLSearchParams});
 vm.runInContext(library,context);
 return context.window.GermanySimulatorAudioText;
};
const off=load("");
const on=load("?voicePreview=1");
assert.equal(manifest.lineCount,114);
assert.equal(manifest.clips.filter(clip=>clip.asrWordExact).length,78);
assert.equal(on.candidatePreviewEnabled,true);
assert.equal(off.candidatePreviewEnabled,false);
const keys=new Set();
for(const clip of manifest.clips){
 const key=clip.voiceId+"\0"+clip.text;
 assert.ok(!keys.has(key),`duplicate candidate ${clip.clipId}`);
 keys.add(key);
 assert.ok(authored.has(key)||clip.voiceId==="amt-brunhilde-knick",`unowned line ${clip.clipId}`);
 assert.equal(on.candidateClip(clip.voiceId,clip.text),clip.path);
 assert.equal(off.candidateClip(clip.voiceId,clip.text),null);
 assert.equal(createHash("sha256").update(source(clip.path)).digest("hex"),clip.sha256);
}
assert.equal(on.candidateClip("amt-horst-stempelmann","a different line"),null);
const game=source("game.js").toString(),amt=source("buergeramt.js").toString();
assert.ok(game.includes("speechCatalog.candidateClip?.(voiceKey,text)"));
assert.ok(game.includes("n.voiceId"));
assert.ok(amt.includes("story.clerkIdentity.voiceId"));
assert.ok(amt.includes("candidateClip?.(voiceId,text)"));
