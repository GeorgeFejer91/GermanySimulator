import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const preview=readFileSync("sprite-preview.html","utf8");
const registry=JSON.parse(readFileSync("assets/sprite-sources/rigs/registry.json","utf8"));

assert.match(preview,/assets\/sprite-sources\/rigs\/registry\.json/);
assert.match(preview,/requestAnimationFrame\(animate\)/);
assert.match(preview,/id="mode"[\s\S]*ANIMATION PREVIEW/);
assert.match(preview,/id="focus-canvas" width="384" height="384"/);
assert.match(preview,/function setMode\(next\)[\s\S]*root\.hidden=focused[\s\S]*focusPreview\.hidden=!focused/);
assert.match(preview,/function updateFocus\(\)[\s\S]*sprites\.get\(character\.value\)[\s\S]*focusView=\{canvas:focusCanvas/);
assert.match(preview,/drawImage\(view\.image,frame\*128,view\.row\*128,128,128,0,0,size,size\)/);
assert.match(preview,/context\.scale\(-1,1\)/,"mirrored-left registrations must remain mirrored");
assert.doesNotMatch(preview,/(?:game|world3d)\.js/,"the preview must not boot the game runtime");
assert.equal(registry.sprites.length,6,"the registry remains the complete preview authority");
assert.ok(registry.sprites.every(sprite=>Object.keys(sprite.directions).length>=2));

console.log("Atlas grid and focused walking-animation modes use the complete sprite registry");
