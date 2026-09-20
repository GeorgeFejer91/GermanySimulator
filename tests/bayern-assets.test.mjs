import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8");
const clips=[...game.matchAll(/\{text:"([^"]+)",recording:"(\.\/assets\/voices\/bayern\/[a-z-]+\.mp3)"\}/g)];
assert.equal(clips.length,8,"expected eight Bayern transcript/audio pairs");
assert.equal(new Set(clips.map(([,text])=>text)).size,8,"Bayern transcripts must be unique");
for(const [,text,path] of clips){assert.ok(text.trim(),`empty transcript for ${path}`);assert.ok(existsSync(join(root,path.slice(2))),`missing ${path}`)}

const png=readFileSync(join(root,"assets/bayern-walker-sprite.png"));
assert.equal(png.readUInt32BE(16),1280,"sprite atlas width must remain five 256 px cells");
assert.equal(png.readUInt32BE(20),1024,"sprite atlas height must remain four 256 px cells");
assert.match(game,/special:"bayern"/);
assert.match(game,/updateBayern\(n,dt\)/);
console.log("Bayern NPC asset contract OK");
