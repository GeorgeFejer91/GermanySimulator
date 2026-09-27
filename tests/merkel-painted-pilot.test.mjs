import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const result=spawnSync("python",["tools/verify-merkel-painted-pilot.py"],{encoding:"utf8"});
assert.equal(result.status,0,result.stderr||result.stdout);
const check=JSON.parse(result.stdout);
assert.equal(check.frames,32);
assert.equal(check.closurePixelMaxDifference,0);
assert.ok(check.maximumBoneDifferenceFrom3D<1e-5);
assert.ok(check.maximumAlphaDifferenceFrom3D<=1);
const preview=readFileSync("sprite-preview.html","utf8");
assert.match(preview,/value="painted">PAINTED · MERKEL/);
assert.match(preview,/painted:\{[\s\S]*?root:"assets\/sprite-sources\/candidates\/merkel-painted-left\/"[\s\S]*?directions:\["left"\]/);
assert.match(preview,/paintedManifest\.playbackFrames/);
console.log("ImageGen paint is bound to unchanged 3D poses with exact pixel closure and no game integration");
