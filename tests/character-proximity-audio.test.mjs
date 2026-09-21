import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const neuland=new URL("../assets/voices/merkel/neuland-0-3s.mp3",import.meta.url),data=readFileSync(neuland);

assert.equal(statSync(neuland).size,73_394,"normalized Neuland clip size drifted");
assert.equal(createHash("sha256").update(data).digest("hex"),"6e6df76d99db89e462335ae6a8fb6d7909c0611015b58a98fd9c8a3e0a8cb336","normalized Neuland clip checksum drifted");
assert.match(game,/const MERKEL_NEULAND_LINE="Das Internet ist für uns alle Neuland\."/);
assert.match(game,/\[MERKEL_NEULAND_LINE\]:"\.\/assets\/voices\/merkel\/neuland-0-3s\.mp3"/);
assert.match(game,/function updateMerkel\(n,dt\)[\s\S]*if\(proximityAudioReady\(n\)\)[\s\S]*showWorldBark\(n\.name,line,false/,"Merkel must bark automatically on proximity");
assert.match(game,/function updateBorderPourer\(n,dt\)[\s\S]*proximityAudioReady\(n\)[\s\S]*family:"politician:merz"/,"Merz must bark automatically on proximity");
assert.match(game,/function updateBayern\(n,dt\)\{\s*if\(state\.region==="germany"&&proximityAudioReady\(n\)\)bayernBark\(n\)/,"Bayern must bark automatically on proximity");
assert.match(game,/function updateAlice\(n,dt\)\{\s*if\(state\.region==="germany"&&proximityAudioReady\(n\)\)aliceBark\(n\)/,"Alice must loop her own recordings automatically on proximity");
assert.match(game,/nextVariant\("politician:"\+n\.politician,lines\)/,"politician pools must remain owner-locked and no-repeat");
assert.match(game,/nextVariant\("bayern",bayernClips\)/,"Bayern recordings must use their no-repeat bag");
assert.match(game,/nextVariant\("alice",aliceClips\)/,"Alice recordings must use their own no-repeat bag");

console.log("Automatic Merkel, Merz, Bayern, and Alice proximity audio contracts OK");
