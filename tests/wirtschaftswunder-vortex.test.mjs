import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");

assert.match(game,/wirtschaftswunderSite=Object\.freeze/,"the construction site must live in canonical simulation data");
assert.match(game,/car\.vortexPhase="swallowed"/,"traffic must disappear at the vortex center");
assert.match(game,/spawnX=car\.dir>0\?TRAFFIC_MIN_X:TRAFFIC_MAX_X/,"swallowed cars must respawn at the far lane edge");
assert.match(game,/other\.vortexPhase!=="road"\|\|Math\.abs\(other\.x-spawnX\)>TRAFFIC_BRAKE_DISTANCE/,"respawn must wait for a clear lane entry");
assert.match(game,/car\.vortexImpact=\+\+wirtschaftswunderImpact;playWirtschaftswunderCrush\(car\)/,"each swallowed car must emit one synchronized crush event");
assert.match(game,/function playWirtschaftswunderCrush\(car\).*createBuffer.*createOscillator/s,"the thunder-crush must be synthesized with deterministic noise and low oscillators");
assert.match(game,/function playWirtschaftswunderCrush\(car\).*soundEffectOutput/s,"the thunder-crush must use the shared sound-effect bus");
assert.match(renderer,/fillText\("WIRTSCHAFTSWUNDER!"/,"the physical signs must preserve the exact bold German phrase");
assert.match(renderer,/uTime.*uLayer.*uOpacity.*uImpact/s,"the vortex must use independently animated, impact-reactive depth layers");
assert.match(renderer,/PlaneGeometry\(mouth\*2,mouth\*2,48,48\)/,"the vortex surface must have enough geometry for visible radial ripples");
assert.match(renderer,/viewX.*viewZ.*layer\.index/s,"the renderer must preserve view-relative parallax");
assert.match(renderer,/new T\.Line\(geometry,material\).*strikeWirtschaftswunder\(impact\)/s,"swallow impacts must emit procedural lightning from the vortex");
assert.match(renderer,/slot\.group\.scale\.set\(scale\*\(1\+crush\*\.82\)/,"cars must visibly squash before they disappear");
assert.match(renderer,/slot\.group\.visible=car\.vortexPhase!=="swallowed"/,"swallowed traffic must be hidden, not deleted or duplicated");

console.log("Wirtschaftswunder vortex traffic and rendering contract OK");
