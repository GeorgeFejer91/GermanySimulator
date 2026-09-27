import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";

const dir="assets/sprite-sources/candidates/merkel-3d/";
const manifest=JSON.parse(readFileSync(dir+"manifest.json","utf8"));
assert.equal(manifest.status,"candidate-unapproved");
assert.equal(manifest.playbackFrames,32);
assert.equal(manifest.inspectionPoints,33);
assert.deepEqual(manifest.rows,{left:0,right:1,up:2,down:3});
assert.match(manifest.appearance,/not a finished or approved/);
assert.match(manifest.movementAuthority,/analytic contact-constrained leg IK/);
assert.match(manifest.runtimeIsolation,/preview-only/);
for(const [name,hash] of Object.entries(manifest.artifacts)){
  assert.equal(createHash("sha256").update(readFileSync(dir+name)).digest("hex"),hash,name);
}
const check=spawnSync("python",["tools/verify-merkel-3d-pilot.py"],{encoding:"utf8"});
assert.equal(check.status,0,check.stderr||check.stdout);
const result=JSON.parse(check.stdout);
assert.deepEqual(result.closurePixelMaxDifference,{left:0,right:0,up:0,down:0});
assert.ok(result.maximumJointGap<1e-5);
assert.ok(result.maximumWorldFootSlipPerFrame<1e-5);
assert.ok(result.maximumFloorPenetration<1e-5);
for(const file of ["game.js","world3d.js"]){
  assert.doesNotMatch(readFileSync(file,"utf8"),/candidates\/merkel-3d/);
}
const preview=readFileSync("sprite-preview.html","utf8");
assert.match(preview,/"3d":\{[\s\S]*?frames:\{merkel:32\},playbackFrames:32/);
assert.match(preview,/merkel-bones\.png/);
assert.match(preview,/merkel-audit\.png",frames:33,playbackFrames:32/);
console.log("The four-view 3D pilot has real shoe-contact/rig evidence, 32 playback poses, and no game integration");
