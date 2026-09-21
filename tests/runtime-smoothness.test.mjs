import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");
const world=readFileSync("world3d.js","utf8");

assert.match(game,/const HUD_REFRESH_SECONDS=\.1/,"HUD DOM refreshes must be rate-limited outside immediate state changes");
assert.match(game,/hudRefreshTimer-=dt;if\(hudRefreshTimer<=0\)\{hudRefreshTimer=HUD_REFRESH_SECONDS;updateHud\(\)\}/);
assert.match(game,/addEventListener\("blur",clearInput\)/,"focus loss must release held movement");
assert.match(game,/visibilitychange.*document\.hidden.*clearInput/,"backgrounding the page must release held movement");

const syncChar=world.match(/function syncChar\(q,o,l=0\)\{[\s\S]*?\n  \}/)?.[0]||"";
assert.match(syncChar,/travel=Math\.hypot/,"procedural gait must follow actual movement");
assert.doesNotMatch(syncChar,/performance\.now/,"idle characters must not walk in place from wall-clock animation");
assert.match(world,/const atlasTextureCache=new Map\(\),atlasMaterialCache=new Map\(\)/);
assert.match(world,/new T\.Mesh\(geometry,material\)/,"atlas actors must share one material and texture per character kind");
assert.match(world,/q\.quaternion\.copy\(camera\.quaternion\)/,"atlas planes must remain camera-facing");

console.log("Runtime frame pacing, focus input, and shared sprite texture contracts OK");
