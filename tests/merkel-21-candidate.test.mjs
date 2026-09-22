import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";

function pngSize(path){
 const png=readFileSync(path);
 assert.equal(png.toString("ascii",1,4),"PNG",`${path} must be a PNG`);
 return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const root="assets/sprite-sources/candidates/merkel-21/";
const manifest=JSON.parse(readFileSync(root+"manifest.json","utf8"));
assert.equal(manifest.status,"candidate-unapproved");
assert.equal(manifest.renderMode,"masked-key-local-layer-v1");
assert.equal(manifest.playbackFrames,20);
assert.equal(manifest.inspectionFrames,21);
assert.deepEqual(manifest.keyIndices,[0,2,5,7,10,12,15,17]);
assert.deepEqual(manifest.rows,["front-idle","left-walk","right-walk","back-walk","front-walk"]);
assert.equal(manifest.identityAuthority,"assets/sprite-archive/pre-rig-20260921/assets/sprite-sources/merkel-sprite-keys.png");
assert.deepEqual(pngSize(root+"merkel-sprite.png"),[2560,640]);
assert.deepEqual(pngSize(root+"merkel-audit-21.png"),[2688,512]);
assert.deepEqual(pngSize(root+"merkel-keys.png"),[2048,1024]);
assert.notEqual(manifest.rawHashes["left-keys-generated.png"],manifest.rawHashes["right-keys-generated.png"]);

const check=spawnSync("python",["tools/verify-merkel-21-candidate.py"],{encoding:"utf8"});
assert.equal(check.status,0,check.stderr||check.stdout);
assert.match(check.stdout,/20 unique playback frames, exact closure, stable identity plates, fixed ground/);

const runtime=readFileSync("game.js","utf8");
assert.match(runtime,/assets\/sprite-archive\/pre-rig-20260921\/assets\//);
assert.doesNotMatch(runtime,/candidates\/merkel-21/);

console.log("Merkel 21-point candidate remains preview-only and passes its deterministic visual contract");
