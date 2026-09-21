import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";
import {join} from "node:path";

const game=readFileSync("game.js","utf8"),assetRoot=join("assets","audio","police");
const assets=[
 ["martinshorn-essen-loop.mp3",221_666,"b71adbe0aecf863c9c43ac3b00c9ff265891d72f4a7edaa221cdf4b5691d7f31"],
 ["german-police-passby.mp3",149_881,"948b9b08b5957740815c0c7aa0e22969979a59582fb2108ad1b258237657077e"]
];
for(const [name,size,hash] of assets){
 const path=join(assetRoot,name),data=readFileSync(path);
 assert.equal(statSync(path).size,size,`${name} size drifted`);
 assert.ok(data.subarray(0,3).toString("ascii")==="ID3"||(data[0]===0xff&&(data[1]&0xe0)===0xe0),`${name} is not an MP3`);
 assert.equal(createHash("sha256").update(data).digest("hex"),hash,`${name} checksum drifted`);
}
assert.match(game,/const POLICE_CHASE_SIREN_AUDIO="\.\/assets\/audio\/police\/martinshorn-essen-loop\.mp3"/);
assert.match(game,/POLICE_PASSBY_AUDIO="\.\/assets\/audio\/police\/german-police-passby\.mp3"/);
assert.match(game,/source\.loop=true/,"the longer authentic Martinshorn must sustain the chase");
assert.match(game,/state\.wanted>=2&&policeVehicles\.length/,"continuous chase audio must begin with the first police car");
assert.match(game,/Math\.min\(\.05,\(state\.wanted-2\)\*\.016\)/,"higher response tiers should add slight pass-by urgency");
assert.match(game,/if\(contactDistance<190&&car\.passbyReady\)/,"a nearby police car must trigger the sourced pass-by accent only once per approach");
assert.match(game,/\.catch\(playSiren\)/,"a missing pass-by recording must retain the synthesized alert fallback");
assert.match(game,/function loop\(now\).*updatePoliceChaseAudio\(\);update\(dt\)/,"chase audio must fade out while world simulation is modal or stopped");

console.log("Local German police chase audio contract OK");
