import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";

const check=spawnSync("python",["tools/verify-merkel-3d-pilot.py","--neutral"],{encoding:"utf8"});
assert.equal(check.status,0,check.stderr||check.stdout);
const result=JSON.parse(check.stdout);
assert.equal(result.uniformSourceLandmarksVerified,true);
assert.deepEqual(result.closurePixelMaxDifference,{left:0,right:0,up:0,down:0});
assert.ok(result.maximumWorldFootSlipPerFrame<1e-5);

const dir="assets/sprite-sources/candidates/merkel-neutral-appearance/";
const art=JSON.parse(readFileSync(dir+"manifest.json","utf8"));
const hash=path=>createHash("sha256").update(readFileSync(path)).digest("hex");
assert.equal(art.status,"appearance-key-unapproved");
assert.equal(art.frames,1,"never present the still as a finished animation");
assert.equal(hash(art.motionGuide),art.motionGuideSha256);
assert.equal(hash(art.originalSheet),art.originalSheetSha256);
for(const [name,expected] of Object.entries(art.artifacts))assert.equal(hash(dir+name),expected,name);
const preview=readFileSync("sprite-preview.html","utf8");
assert.match(preview,/value="neutral">NEUTRAL · SHARED/);
assert.match(preview,/title:"Shared neutral walking guide"/);
assert.match(preview,/guide-closure\.png",frames:33,playbackFrames:32/);
assert.match(preview,/NEW APPEARANCE KEY · STILL ONLY/);
assert.match(preview,/appearancePreview\.hidden=!source\.appearanceRoot/);
assert.match(preview,/source\.title\|\|NAMES\[sprite\.id\]/,"mannequin cannot be labeled Merkel");
console.log("Shared neutral motion has uncaricatured source joints, grounded feet and exact closure; character artwork stays separate");
