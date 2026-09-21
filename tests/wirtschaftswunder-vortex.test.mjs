import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");

assert.match(game,/wirtschaftswunderSite=Object\.freeze/,"the construction site must live in canonical simulation data");
assert.match(game,/car\.vortexPhase="swallowed"/,"traffic must disappear at the vortex center");
assert.match(game,/spawnX=car\.dir>0\?TRAFFIC_MIN_X:TRAFFIC_MAX_X/,"swallowed cars must respawn at the far lane edge");
assert.match(game,/other\.vortexPhase!=="road"\|\|Math\.abs\(other\.x-spawnX\)>TRAFFIC_BRAKE_DISTANCE/,"respawn must wait for a clear lane entry");
assert.match(renderer,/fillText\("WIRTSCHAFTSWUNDER!"/,"the physical signs must preserve the exact bold German phrase");
assert.match(renderer,/uTime.*uLayer.*uOpacity/s,"the vortex must use independently animated depth layers");
assert.match(renderer,/viewX.*viewZ.*layer\.index/s,"the renderer must preserve view-relative parallax");
assert.match(renderer,/slot\.group\.visible=car\.vortexPhase!=="swallowed"/,"swallowed traffic must be hidden, not deleted or duplicated");

console.log("Wirtschaftswunder vortex traffic and rendering contract OK");
