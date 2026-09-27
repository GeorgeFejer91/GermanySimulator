import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const preview=readFileSync("sprite-preview.html","utf8");
const registry=JSON.parse(readFileSync("assets/sprite-sources/rigs/registry.json","utf8"));

assert.match(preview,/assets\/sprite-sources\/rigs\/registry\.json/);
assert.match(preview,/requestAnimationFrame\(animate\)/);
assert.match(preview,/id="source"[\s\S]*value="stable" selected>GAME · STABLE[\s\S]*value="experimental">EXPERIMENTAL/);
assert.match(preview,/value="candidate">CANDIDATE · 21/);
assert.match(preview,/value="mocap">2D · CMU PILOT/);
assert.match(preview,/value="3d">3D · MERKEL/);
assert.match(preview,/stable:\{label:"GAME · STABLE",root:"assets\/sprite-archive\/pre-rig-20260921\/assets\/"[\s\S]*frames:\{merkel:24\}/);
assert.match(preview,/experimental:\{label:"EXPERIMENTAL",root:"assets\/"/);
assert.match(preview,/candidate:\{[\s\S]*?label:"CANDIDATE · MERKEL 21",root:"assets\/sprite-sources\/candidates\/merkel-21\/"/);
assert.match(preview,/mocap:\{[\s\S]*?root:"assets\/sprite-sources\/candidates\/merkel-cmu-left\/"[\s\S]*?directions:\["left"\]/);
assert.match(preview,/assets\/sprite-sources\/candidates\/merkel-21\/manifest\.json/);
assert.match(preview,/assets\/sprite-sources\/candidates\/merkel-cmu-left\/manifest\.json/);
for(const view of ["audit","bones","onion","difference"]){
 assert.match(preview,new RegExp(`${view}:\\{file:"merkel-`),`candidate preview must expose ${view} evidence`);
}
assert.match(preview,/reference:\{file:"merkel-left-reference\.png"/);
assert.match(preview,/id="mode"[\s\S]*FOCUS VIEW/);
assert.match(preview,/id="focus-canvas" width="384" height="384"/);
assert.match(preview,/function setMode\(next\)[\s\S]*root\.hidden=focused[\s\S]*focusPreview\.hidden=!focused/);
assert.match(preview,/function updateFocus\(\)[\s\S]*sprites\.get\(character\.value\)[\s\S]*focusView=\{canvas:focusCanvas,sprite/);
assert.match(preview,/function setSource\(\)[\s\S]*sprite\.frames=source\.frames\[sprite\.id\]\|\|32[\s\S]*sprite\.image\.src=/);
assert.match(preview,/sprite\.article\.hidden=!allowed\(sprite\.id\)/,"candidate source must filter the grid to Merkel");
assert.match(preview,/Math\.floor\(cycle\*frames\)/);
assert.match(preview,/tileContext\.drawImage\(image,frame\*128,row\*128,128,128,0,0,128,128\)/);
assert.match(preview,/context\.drawImage\(tileCanvas,0,0,128,128,0,0,size,size\)/);
assert.match(preview,/context\.scale\(-1,1\)/,"mirrored-left registrations must remain mirrored");
assert.doesNotMatch(preview,/(?:game|world3d)\.js/,"the preview must not boot the game runtime");
assert.equal(registry.sprites.length,6,"the registry remains the complete preview authority");
assert.ok(registry.sprites.every(sprite=>Object.keys(sprite.directions).length>=2));
assert.match(preview,/Object\.hasOwn\(SOURCES,requestedSource\)/,"deep links must validate their source");
assert.match(preview,/history\.replaceState/);
assert.match(preview,/prepareWithSegments/);
assert.match(preview,/measureLineStats/);
assert.match(preview,/document\.fonts\.load/);
assert.doesNotMatch(preview,/overflow:hidden/i,"text may not be clipped to make it fit");

console.log("Stable sprites and 2D/3D walking studies share the accessible, deep-linked preview without changing the game loader");
