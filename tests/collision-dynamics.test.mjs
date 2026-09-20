import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");

assert.match(game,/function staticBlocked\(x,y,r=player\.r\)/);
assert.match(game,/for\(const p of props\)if\(dist\(x,y,p\.x,p\.y\)<r\+propRadius\(p\)\)/,"street props must be solid");
assert.match(game,/for\(const o of normObjects\)if\(dist\(x,y,o\.x,o\.y\)<r\+26\)/,"mission objects must be solid");
assert.match(game,/function responderBlocked\(x,y,r,self\)/);
assert.match(game,/trainAt\(x,y,r\)/,"ground actors must not pass through trains");
assert.match(game,/moveGroundResponder\(car,dx\/d\*step,dy\/d\*step,38\)/,"pursuit cars must use collision-aware movement");
assert.match(game,/moveGroundResponder\(p,rdx\/d\*step,rdy\/d\*step,14\)/,"foot police must use collision-aware movement");
assert.match(game,/dynamicBlocker\(nx,player\.y,px,player\.y\)/,"the player must not walk deeper into response vehicles");
assert.match(game,/groundObstacles=.*\.\.\.policeVehicles.*\.\.\.police.*\.\.\.npcs/,"trains must detect people and ground police responses");
assert.match(game,/allowed=Math\.min\(allowed,Math\.max\(0,groundGap-TRAIN_PLAYER_STOP_GAP\)\)/,"trains must hard-limit advance before a ground obstacle");
assert.match(game,/allowed=Math\.max\(0,gap-TRAIN_MIN_GAP\)/,"trains must retain same-track no-overlap spacing");
assert.match(game,/headingX=velocity>10\?player\.vx\/velocity/,"cars must predict the player's current trajectory");
assert.match(game,/slot=\(car\.index-\(policeVehicles\.length-1\)\/2\)\*82/,"cars must fan into blocking formation slots");
assert.match(game,/if\(velocity<10\).*radius=175\+car\.index\*24/,"cars must orbit the player when no trajectory is available");
assert.match(game,/desiredSpeed=d<30\?0/,"cars must brake at their blocking position");

console.log("Predictive interception, ground collision, and train-spacing contracts OK");
