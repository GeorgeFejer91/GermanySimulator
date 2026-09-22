import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const preview=readFileSync("sprite-preview.html","utf8");
const registry=JSON.parse(readFileSync("assets/sprite-sources/rigs/registry.json","utf8"));

assert.match(preview,/assets\/sprite-sources\/rigs\/registry\.json/);
assert.match(preview,/requestAnimationFrame\(animate\)/);
assert.match(preview,/id="source"[\s\S]*value="stable" selected>GAME · STABLE[\s\S]*value="experimental">EXPERIMENTAL/);
assert.match(preview,/value="candidate">CANDIDATE · MERKEL 21/);
assert.match(preview,/stable:\{label:"GAME · STABLE",root:"assets\/sprite-archive\/pre-rig-20260921\/assets\/"[\s\S]*frames:\{merkel:24\}/);
assert.match(preview,/experimental:\{label:"EXPERIMENTAL",root:"assets\/"/);
assert.match(preview,/candidate:\{label:"CANDIDATE · MERKEL 21",root:"assets\/sprite-sources\/candidates\/merkel-21\/"/);
assert.match(preview,/assets\/sprite-sources\/candidates\/merkel-21\/manifest\.json/);
for(const view of ["audit","skeleton","onion","difference"]){
 assert.match(preview,new RegExp(`${view}:"merkel-`),`candidate preview must expose ${view} evidence`);
}
assert.match(preview,/id="mode"[\s\S]*ANIMATION PREVIEW/);
assert.match(preview,/id="focus-canvas" width="384" height="384"/);
assert.match(preview,/function setMode\(next\)[\s\S]*root\.hidden=focused[\s\S]*focusPreview\.hidden=!focused/);
assert.match(preview,/function updateFocus\(\)[\s\S]*sprites\.get\(character\.value\)[\s\S]*focusView=\{canvas:focusCanvas,sprite/);
assert.match(preview,/function setSource\(\)[\s\S]*sprite\.frames=source\.frames\[sprite\.id\]\|\|32[\s\S]*sprite\.image\.src=/);
assert.match(preview,/sprite\.article\.hidden=!allowed\(sprite\.id\)/,"candidate source must filter the grid to Merkel");
assert.match(preview,/Math\.floor\(cycle\*frames\)/);
assert.match(preview,/drawImage\(image,frame\*128,row\*128,128,128,0,0,size,size\)/);
assert.match(preview,/context\.scale\(-1,1\)/,"mirrored-left registrations must remain mirrored");
assert.doesNotMatch(preview,/(?:game|world3d)\.js/,"the preview must not boot the game runtime");
assert.equal(registry.sprites.length,6,"the registry remains the complete preview authority");
assert.ok(registry.sprites.every(sprite=>Object.keys(sprite.directions).length>=2));

console.log("Stable, experimental, and Merkel 21-point sprites share the focused preview without changing the game loader");
