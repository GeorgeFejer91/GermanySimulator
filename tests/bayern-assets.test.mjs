import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8");
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync(join(root,"For-AI/AUDIO-TEXT-LIBRARY.js"),"utf8"),context);
const clips=Object.values(context.window.GermanySimulatorAudioText.clips).filter(clip=>clip.voiceId==="bayern");
assert.equal(clips.length,8,"expected eight Bayern transcript/audio pairs");
assert.equal(new Set(clips.map(clip=>clip.text)).size,8,"Bayern transcripts must be unique");
for(const clip of clips){assert.ok(clip.text.trim(),`empty transcript for ${clip.path}`);assert.ok(existsSync(join(root,clip.path.slice(2))),`missing ${clip.path}`);assert.ok(game.includes(`speechClip("${clip.id}")`),`${clip.id} must be selected by stable ID`)}

for(const [file,width,height] of [
 ["bayern-walker-sprite.png",4096,512],
 ["border-pourer-sprite.png",4096,768],
 ["merkel-sprite.png",4096,640],
]){
 const png=readFileSync(join(root,"assets",file));
 assert.equal(png.readUInt32BE(16),width,`${file} has the expected expanded column count`);
 assert.equal(png.readUInt32BE(20),height,`${file} has the expected direction/action rows`);
}
assert.match(game,/special:"bayern"/);
assert.match(game,/updateBayern\(n,dt\)/);
console.log("Bayern NPC asset contract OK");
