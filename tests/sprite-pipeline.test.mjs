import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";

function pngSize(path){
 const png=readFileSync(path);
 assert.equal(png.toString("ascii",1,4),"PNG",`${path} must be a PNG`);
 return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const sheets=[
 ["assets/sprite-sources/merkel-sprite-keys.png",[1536,1280],"assets/merkel-sprite.png",[3072,640]],
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
 ["assets/merkel-sprite.png",24,5],
 ["assets/border-pourer-sprite.png",32,6],
 ["assets/bayern-walker-sprite.png",32,4],
 ["assets/alice-weidel-sprite.png",32,2],
 ...["towel-man","towel-woman"].map(name=>[`assets/crowd-${name}.png`,32,3])
]){
 const check=spawnSync("python",["tools/verify-sprite-atlas.py",runtime,"--cols",String(cols),"--rows",String(rows)],{encoding:"utf8"});
 assert.equal(check.status,0,check.stderr||check.stdout);
}

const builder=readFileSync("tools/build-sprite-transitions.py","utf8");
assert.match(builder,/minterpolate=fps=/,"sprite transitions must use motion-compensated interpolation");
assert.match(builder,/key_frames\[0\], key_frames\[0\]/,"the transition build must close the loop seam");
assert.match(builder,/frames\[index \* factor\] = key\.copy\(\)/,"authored keys must remain exact interval boundaries");
assert.match(builder,/convert\("RGBa"\).*resize/s,"runtime downscaling must use premultiplied alpha");
assert.doesNotMatch(builder,/\.quantize\(/,"runtime atlases must retain full-quality alpha edges");

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

console.log("Registered key sheets and full-RGBA four-times expanded runtime sprite atlases OK");
