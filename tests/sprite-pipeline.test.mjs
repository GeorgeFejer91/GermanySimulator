import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync,readFileSync} from "node:fs";

function pngSize(path){
 const png=readFileSync(path);
 assert.equal(png.toString("ascii",1,4),"PNG",`${path} must be a PNG`);
 return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const sheets=[
 ["assets/sprite-sources/merkel-sprite-keys.png",[1536,1280],"assets/merkel-sprite.png",[4096,640]],
 ["assets/sprite-sources/border-pourer-sprite-keys.png",[2048,1536],"assets/border-pourer-sprite.png",[4096,768]],
 ["assets/sprite-sources/bayern-walker-sprite-keys.png",[2048,1024],"assets/bayern-walker-sprite.png",[4096,512]],
 ["assets/sprite-sources/alice-weidel-sprite-keys.png",[2048,512],"assets/alice-weidel-sprite.png",[4096,256]],
 ...["towel-man","towel-woman"].map(name=>[`assets/sprite-sources/crowd-${name}-keys.png`,[2048,768],`assets/crowd-${name}.png`,[4096,384]])
];
for(const [source,sourceSize,runtime,runtimeSize] of sheets){
 assert.deepEqual(pngSize(source),sourceSize,`${source} must retain its original authored key grid`);
 assert.deepEqual(pngSize(runtime),runtimeSize,`${runtime} must retain the 32-cell runtime clock`);
 assert.equal(readFileSync(runtime)[25],6,`${runtime} must preserve full RGBA edges`);
}

for(const [runtime,cols,rows] of [
 ["assets/merkel-sprite.png",32,5],
 ["assets/border-pourer-sprite.png",32,6],
 ["assets/bayern-walker-sprite.png",32,4],
 ["assets/alice-weidel-sprite.png",32,2],
 ...["towel-man","towel-woman"].map(name=>[`assets/crowd-${name}.png`,32,3])
]){
 const check=spawnSync("python",["tools/verify-sprite-atlas.py",runtime,"--cols",String(cols),"--rows",String(rows)],{encoding:"utf8"});
 assert.equal(check.status,0,check.stderr||check.stdout);
}

const registry=JSON.parse(readFileSync("assets/sprite-sources/rigs/registry.json","utf8"));
assert.equal(registry.version,2);
assert.equal(registry.sprites.length,6,"every atlas-backed character must have one identity source");
assert.equal(registry.frameContract.renderMode,"authored-key-hold-v1");
assert.equal(registry.frameContract.runtimeFrames,32);
assert.equal(registry.frameContract.interpolation,"none");
for(const entry of registry.sprites){
 assert.ok(existsSync(entry.source),`${entry.id} must retain its original image-generated keys`);
 assert.equal(entry.rows.length,pngSize(entry.runtime)[1]/128,`${entry.id} row registry must match its runtime atlas`);
 assert.ok(entry.walkRows.every(row=>row>=0&&row<entry.rows.length));
 assert.ok(Object.values(entry.directions).every(reference=>entry.rows.includes(typeof reference==="string"?reference:reference.mirror)),`${entry.id} direction contract must resolve to authored rows`);
}

const audit=JSON.parse(readFileSync("assets/sprite-sources/identity-audit.json","utf8"));
assert.equal(audit.version,2,"the final atlas must retain a one-to-one identity audit");
assert.equal(audit.sprites.length,registry.sprites.length,"every sprite needs a final-cell identity audit");
for(const entry of registry.sprites){
 const audited=audit.sprites.find(sprite=>sprite.id===entry.id);
 assert.ok(audited,`${entry.id} must be present in the identity audit`);
 assert.deepEqual(audited.rows.map(row=>row.rowName),entry.rows,`${entry.id} audited rows must match direction authority`);
 assert.ok(audited.rows.every(row=>row.frames.length===32),`${entry.id} needs one source identity record per final frame`);
 assert.ok(audited.rows.every(row=>new Set(row.frames.map(frame=>frame.sourceKey)).size===entry.keyCols),`${entry.id} must expose every authored pose`);
}

const builder=readFileSync("tools/build-identity-locked-sprite-atlas.py","utf8");
assert.match(builder,/source_key_for_runtime/);
assert.match(builder,/image\.convert\("RGBa"\)\.resize/,"runtime downscaling must use premultiplied alpha");
assert.match(builder,/sourcePixelSha256/,"every final cell must bind its original authored source pixels");
assert.match(builder,/runtimePixelSha256/,"every final cell must bind its delivered runtime pixels");
assert.doesNotMatch(builder,/minterpolate|cv2|ImageChops\.blend/i,"the canonical builder must not morph complete character frames");

const hardGate=spawnSync("python",["tools/verify-sprite-animation.py"],{encoding:"utf8"});
assert.equal(hardGate.status,0,hardGate.stderr||hardGate.stdout);
assert.match(hardGate.stdout,/PASS merz: 192 final cells are exact authored poses/);
assert.match(hardGate.stdout,/PASS towel-woman: 96 final cells are exact authored poses/);

const gate=readFileSync("tools/verify-sprite-animation.py","utf8");
assert.match(gate,/runtime_frames < 21/,"walking rows must be blocked below the 21-frame runtime minimum");
assert.match(gate,/maxLowerLimbChange/,"the gate must verify readable lower-limb articulation");
assert.match(gate,/changed after visual review/,"pixel changes must invalidate the signed visual review");
assert.match(gate,/source identity hash failed/,"the audit must bind every final frame to one authored source frame");
assert.match(gate,/is not its exact authored source pose/,"the gate must reject invented or morphed runtime pixels");
assert.match(gate,/horizontal anchor drifts|ground anchor drifts/,"the gate must reject unstable registration");
assert.match(gate,/--overlay-dir/,"the gate must render final-atlas frame-by-frame contact sheets");
assert.match(gate,/identityAuditSha256/,"the signed review must bind the one-to-one identity audit");
assert.match(gate,/mirrored left arc/,"runtime mirrored-left exposure must be validated independently");

assert.ok(existsSync("assets/sprite-archive/pre-rig-20260921/MANIFEST.md"),"the original pre-rig archive must remain recoverable");
assert.ok(existsSync("assets/sprite-archive/pre-identity-lock-20260922/MANIFEST.md"),"the replaced cutout-rig assets must remain recoverable");

console.log("Identity-locked authored sprite atlases and exact final-frame gate OK");
