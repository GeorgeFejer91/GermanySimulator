import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8");
const clips=[...game.matchAll(/\{text:"([^"]+)",recording:"(\.\/assets\/voices\/bayern\/[a-z-]+\.mp3)"\}/g)];
assert.equal(clips.length,8,"expected eight Bayern transcript/audio pairs");
assert.equal(new Set(clips.map(([,text])=>text)).size,8,"Bayern transcripts must be unique");
for(const [,text,path] of clips){assert.ok(text.trim(),`empty transcript for ${path}`);assert.ok(existsSync(join(root,path.slice(2))),`missing ${path}`)}

for(const [file,width,height] of [
 ["bayern-walker-sprite.png",4096,512],
 ["border-pourer-sprite.png",4096,768],
 ["merkel-sprite.png",3072,640],
]){
 const png=readFileSync(join(root,"assets",file));
 assert.equal(png.readUInt32BE(16),width,`${file} has the expected expanded column count`);
 assert.equal(png.readUInt32BE(20),height,`${file} has the expected direction/action rows`);
}
assert.match(game,/special:"bayern"/);
assert.match(game,/updateBayern\(n,dt\)/);
console.log("Bayern NPC asset contract OK");
