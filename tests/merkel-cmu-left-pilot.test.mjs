import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";

function pngSize(path){
 const png=readFileSync(path);
 assert.equal(png.toString("ascii",1,4),"PNG",`${path} must be a PNG`);
 return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const referenceRoot="assets/sprite-sources/reference/cmu-walk-69-01/";
const pilotRoot="assets/sprite-sources/candidates/merkel-cmu-left/";
const reference=JSON.parse(readFileSync(referenceRoot+"walk-cycle-21.json","utf8"));
const manifest=JSON.parse(readFileSync(pilotRoot+"manifest.json","utf8"));
const verification=JSON.parse(readFileSync(pilotRoot+"verification.json","utf8"));

assert.equal(reference.kind,"minimal-side-walk-pose-map");
assert.equal(reference.schemaVersion,2);
assert.equal(reference.source.subject,69);
assert.equal(reference.source.trial,1);
assert.equal(reference.source.insertedTPoseFrameExcluded,0);
assert.equal(reference.points.length,21);
assert.deepEqual(reference.points[0].joints,reference.points[20].joints);
assert.equal(reference.cycle.sequence,"left-forward -> right-forward -> left-forward");
assert.match(reference.cycle.smoothing,/periodic Fourier fit/);
assert.match(reference.cycle.bilateralNormalization,/half-cycle/);
assert.equal(reference.points[0].gaitState,"left-forward-contact");
assert.equal(reference.points[10].gaitState,"right-forward-contact");
assert.ok(reference.hardGateJoints.includes("LeftToeBase"));
assert.ok(reference.hardGateJoints.includes("RightToeBase"));
assert.equal(manifest.status,"candidate-unapproved");
assert.equal(manifest.schemaVersion,2);
assert.equal(manifest.scope,"merkel-left-only");
assert.deepEqual(manifest.directions,["left"]);
assert.equal(manifest.playbackFrames,20);
assert.equal(manifest.inspectionPoints,21);
assert.deepEqual(pngSize(pilotRoot+"merkel-sprite.png"),[2688,128]);
assert.deepEqual(pngSize(pilotRoot+"merkel-left-bones.png"),[2688,128]);
assert.deepEqual(pngSize(pilotRoot+"merkel-left-reference.png"),[2688,128]);
assert.equal(verification.status,"pass-unapproved");
assert.equal(verification.checks.distinctPlaybackFrames,20);
assert.equal(verification.checks.exactPixelClosure,true);
assert.ok(verification.checks.maxBoneDirectionErrorDegrees<0.01);
assert.equal(verification.checks.gaitSequence,"left-forward -> right-forward -> left-forward");
assert.deepEqual(verification.checks.fixedBodyRoot,[256,320]);
assert.match(verification.checks.footBones,/heel-ankle-toe/);
assert.ok(verification.checks.maxPerJointAccelerationPixels<=12);
assert.ok(verification.checks.maxLoopSeamAccelerationPixels<=8);

const check=spawnSync("python",["tools/verify-merkel-cmu-left-pilot.py"],{encoding:"utf8"});
assert.equal(check.status,0,check.stderr||check.stdout);
assert.match(check.stdout,/max bone-direction error/);

const runtime=readFileSync("game.js","utf8");
assert.doesNotMatch(runtime,/candidates\/merkel-cmu-left/);
assert.match(manifest.runtimeIsolation,/preview-only/);

console.log("Merkel left walk is grounded in pinned CMU bones, mechanically verified, and isolated from the game runtime");
