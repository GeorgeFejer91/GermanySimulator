import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

function pngSize(path){
 const png=readFileSync(path);
 assert.equal(png.toString("ascii",1,4),"PNG",`${path} must be a PNG`);
 return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

const sheets=[
 ["assets/sprite-sources/merkel-sprite-keys.png",[1536,1280],"assets/merkel-sprite.png",[3072,640]],
 ["assets/sprite-sources/border-pourer-sprite-keys.png",[2048,1536],"assets/border-pourer-sprite.png",[4096,768]],
 ["assets/sprite-sources/bayern-walker-sprite-keys.png",[2048,1024],"assets/bayern-walker-sprite.png",[4096,512]]
];
for(const [source,sourceSize,runtime,runtimeSize] of sheets){
 assert.deepEqual(pngSize(source),sourceSize,`${source} must retain its registered 256 px key grid`);
 assert.deepEqual(pngSize(runtime),runtimeSize,`${runtime} must contain three in-betweens per key interval at 128 px`);
}

const builder=readFileSync("tools/build-sprite-transitions.py","utf8");
assert.match(builder,/minterpolate=fps=/,"sprite transitions must use motion-compensated interpolation");
assert.match(builder,/key_frames\[0\], key_frames\[0\]/,"the transition build must close the loop seam");
assert.match(builder,/frames\[index \* factor\] = key\.copy\(\)/,"authored keys must remain exact interval boundaries");

console.log("Registered key sheets and four-times expanded runtime sprite atlases OK");
