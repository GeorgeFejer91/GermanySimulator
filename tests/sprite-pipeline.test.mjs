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
 assert.deepEqual(pngSize(source),sourceSize,`${source} must retain its registered 256 px key grid`);
 assert.deepEqual(pngSize(runtime),runtimeSize,`${runtime} must contain three in-betweens per key interval at 128 px`);
 assert.equal(readFileSync(runtime)[25],6,`${runtime} must preserve full RGBA rather than a reduced palette`);
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
assert.equal(registry.sprites.length,6,"every atlas-backed character must have one registered cutout rig");
assert.deepEqual(registry.frameContract.contactPhases,[0,16]);
assert.deepEqual(registry.frameContract.passingPhases,[8,24]);
for(const entry of registry.sprites){
 assert.ok(existsSync(entry.parts),`${entry.id} must retain its high-resolution parts source`);
 assert.equal(entry.rows.length,pngSize(entry.runtime)[1]/128,`${entry.id} row registry must match its runtime atlas`);
}

const builder=readFileSync("tools/build-rigged-sprite-atlas.py","utf8");
assert.match(builder,/def solve_two_bone\(/,"walking legs must use a deterministic two-bone IK solve");
assert.match(builder,/range\(32\)/,"every row must be rendered as 32 direct rig poses");
assert.match(builder,/stitch_nearby_components/,"small generated joint openings must be stitched or rejected");
assert.match(builder,/convert\("RGBa"\).*resize/s,"runtime downscaling must use premultiplied alpha");
assert.doesNotMatch(builder,/minterpolate/,"the canonical renderer must not morph complete character frames");

const register=readFileSync("tools/register-sprite-grid.py","utf8");
assert.match(register,/--flip-cells/,"registration must normalize generator cells that face the wrong direction");
assert.match(register,/--component-grid/,"registration must isolate complete figures instead of retaining cross-cell fragments");
assert.match(register,/--normalize-scale/,"registration must bound generated body-scale drift");

const hardGate=spawnSync("python",["tools/verify-sprite-animation.py"],{encoding:"utf8"});
assert.equal(hardGate.status,0,hardGate.stderr||hardGate.stdout);
assert.match(hardGate.stdout,/PASS merz: signed visual review \+ anatomy\/loop gate/);
assert.match(hardGate.stdout,/PASS towel-woman: signed visual review \+ anatomy\/loop gate/);

const gate=readFileSync("tools/verify-sprite-animation.py","utf8");
assert.match(gate,/runtime_cols < 21/,"walking rows must be blocked below the 21-frame minimum");
assert.match(gate,/maxLowerLimbChange/,"the gate must verify readable lower-limb articulation");
assert.match(gate,/changed after visual review/,"pixel changes must invalidate the signed visual review");
assert.match(gate,/rigSha256/,"part-sheet changes must invalidate the signed visual review");

assert.ok(existsSync("assets/sprite-archive/pre-rig-20260921/MANIFEST.md"),"the replaced sprite assets must remain recoverable");

console.log("Registered cutout rigs and full-RGBA 32-frame runtime sprite atlases OK");
