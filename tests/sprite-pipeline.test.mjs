import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync,readFileSync} from "node:fs";

function pngSize(path){
 const png=readFileSync(path);
 assert.equal(png.toString("ascii",1,4),"PNG",`${path} must be a PNG`);
 return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const sheets=[
 ["assets/sprite-sources/merkel-sprite-keys.png",[2048,1280],"assets/merkel-sprite.png",[4096,640]],
 ["assets/sprite-sources/border-pourer-sprite-keys.png",[2048,1536],"assets/border-pourer-sprite.png",[4096,768]],
 ["assets/sprite-sources/bayern-walker-sprite-keys.png",[2048,1024],"assets/bayern-walker-sprite.png",[4096,512]],
 ["assets/sprite-sources/alice-weidel-sprite-keys.png",[2048,512],"assets/alice-weidel-sprite.png",[4096,256]],
 ...["towel-man","towel-woman"].map(name=>[`assets/sprite-sources/crowd-${name}-keys.png`,[2048,768],`assets/crowd-${name}.png`,[4096,384]])
];
for(const [source,sourceSize,runtime,runtimeSize] of sheets){
 assert.deepEqual(pngSize(source),sourceSize,`${source} must expose eight reviewed gait phases`);
 assert.deepEqual(pngSize(runtime),runtimeSize,`${runtime} must retain the 32-cell runtime gait`);
 assert.equal(readFileSync(runtime)[25],6,`${runtime} must preserve full RGBA edges`);
}

for(const [runtime,rows] of sheets.map(([, ,runtime,size])=>[runtime,size[1]/128])){
 const check=spawnSync("python",["tools/verify-sprite-atlas.py",runtime,"--cols","32","--rows",String(rows)],{encoding:"utf8"});
 assert.equal(check.status,0,check.stderr||check.stdout);
}

const registry=JSON.parse(readFileSync("assets/sprite-sources/rigs/registry.json","utf8"));
assert.equal(registry.version,3);
assert.equal(registry.sprites.length,6,"every atlas-backed character must use the shared rig contract");
assert.equal(registry.frameContract.renderMode,"biomechanical-rig-v3");
assert.equal(registry.frameContract.runtimeFrames,32);
assert.equal(registry.frameContract.keyFrames,8);
assert.equal(registry.frameContract.gaitModel,"eight-phase-double-support-v1");
assert.equal(registry.frameContract.interpolation,"bounded-cyclic-catmull-rom-coefficients");
for(const entry of registry.sprites){
 for(const field of ["parts","source","runtime","identityReference"]){
  assert.ok(existsSync(entry[field]),`${entry.id} must retain ${field}`);
 }
 assert.equal(entry.rows.length,pngSize(entry.runtime)[1]/128,`${entry.id} rows must match its runtime atlas`);
 assert.ok(entry.walkRows.every(row=>row>=0&&row<entry.rows.length));
 assert.ok(Object.values(entry.directions).every(reference=>entry.rows.includes(typeof reference==="string"?reference:reference.mirror)),`${entry.id} direction contract must resolve to rigged rows`);
}

const audit=JSON.parse(readFileSync("assets/sprite-sources/rigs/pose-audit.json","utf8"));
assert.equal(audit.version,2);
assert.equal(audit.registryVersion,3);
assert.equal(audit.renderMode,registry.frameContract.renderMode);
assert.equal(audit.gaitModel,registry.frameContract.gaitModel);
assert.equal(audit.sprites.length,registry.sprites.length);
for(const entry of registry.sprites){
 const audited=audit.sprites.find(sprite=>sprite.id===entry.id);
 assert.ok(audited,`${entry.id} must be present in the pose audit`);
 assert.deepEqual(audited.rows.map(row=>row.rowName),entry.rows);
 assert.ok(audited.rows.every(row=>row.frames.length===32),`${entry.id} needs one joint record per final frame`);
 assert.ok(audited.rows.every(row=>row.frames.every((frame,index)=>frame.frame===index)),`${entry.id} audit order must be one-to-one`);
}

const builder=readFileSync("tools/build-rigged-sprite-atlas.py","utf8");
for(const token of ["GAIT_ANCHORS","bounded_cyclic_catmull","gait_coefficients","solve_two_bone","solve_projected_three_bone","clean_part_sockets","stance","fixed root and ground line"]){
 assert.match(builder,new RegExp(token),`builder must contain ${token}`);
}
assert.match(builder,/image\.convert\("RGBa"\)\.resize/,"runtime downscaling must use premultiplied alpha");
assert.doesNotMatch(builder,/minterpolate|cv2/i,"the rig must not morph whole character frames");

const hardGate=spawnSync("python",["tools/verify-sprite-animation.py"],{encoding:"utf8"});
assert.equal(hardGate.status,0,hardGate.stderr||hardGate.stdout);
assert.match(hardGate.stdout,/PASS merz: 192 final cells; minimum 32 distinct poses/);
assert.match(hardGate.stdout,/PASS towel-woman: 96 final cells; minimum 32 distinct poses/);

const gate=readFileSync("tools/verify-sprite-animation.py","utf8");
for(const token of ["at least 28","stance foot slides forward","passing foot lacks toe clearance","passing crossover","cyclic loop seam jumps","head/top anchor jitters","--overlay-dir","poseAuditSha256","mirrored left arc"]){
 assert.match(gate,new RegExp(token),`verification gate must check ${token}`);
}

const runtime=readFileSync("game.js","utf8");
assert.match(runtime,/function advanceSpriteGait/,"runtime gait must advance from actual distance");
assert.match(runtime,/gaitDistance/);
assert.doesNotMatch(runtime,/spriteFrame=Math\.floor\(n\.animTime\*(32|40|60)/,"atlas pedestrians must not use wall-clock gait frames");

assert.ok(existsSync("assets/sprite-archive/pre-rig-20260921/MANIFEST.md"),"original generated keys must remain recoverable");
assert.ok(existsSync("assets/sprite-archive/pre-identity-lock-20260922/MANIFEST.md"),"the superseded identity-hold atlases must remain recoverable");
assert.ok(existsSync("assets/sprite-sources/reference/biomechanical-gait-proposal.png"),"the visual gait proposal must be retained with the pipeline");

console.log("Biomechanical 32-frame sprite gait, signed gate, and distance clock OK");
