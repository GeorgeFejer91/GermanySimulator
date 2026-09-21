import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");

assert.match(game,/function staticBlocked\(x,y,r=player\.r\)/);
assert.match(game,/for\(const p of props\)if\(dist\(x,y,p\.x,p\.y\)<r\+propRadius\(p\)\)/,"street props must be solid");
assert.match(game,/for\(const o of normObjects\)if\(dist\(x,y,o\.x,o\.y\)<r\+26\)/,"mission objects must be solid");
assert.match(game,/function responderBlocked\(x,y,r,self\)/);
assert.match(game,/trainAt\(x,y,r\)/,"ground actors must not pass through trains");
const moveSource=game.match(/function moveGroundResponder\(entity,dx,dy,r\)\{[^\n]+\}/)?.[0];
assert.ok(moveSource,"shared ground responder movement must exist");
const moveGroundResponder=new Function("responderBlocked",`return (${moveSource})`);
const sidestep={x:0,y:0,avoid:1};
assert.equal(moveGroundResponder((x)=>x>0)(sidestep,2,0,12),true,"an actor blocked ahead must keep moving around the barrier");
assert.deepEqual(sidestep,{x:0,y:1.44,avoid:1},"a zero-length axis must not mask the collision-avoidance sidestep");
const backoff={x:0,y:0,avoid:1};
assert.equal(moveGroundResponder((x,y)=>x>=0||y!==0)(backoff,2,0,12),true,"an actor blocked ahead and on both sides must back away");
assert.equal(backoff.x,-1.1,"the final escape attempt must move away from the barrier");
assert.match(game,/moveGroundResponder\(car,dx\/d\*step,dy\/d\*step,38\)/,"pursuit cars must use collision-aware movement");
assert.match(game,/moveGroundResponder\(p,rdx\/d\*step,rdy\/d\*step,14\)/,"foot police must use collision-aware movement");
assert.match(game,/else moveGroundResponder\(n,dx\/d\*88\*dt,dy\/d\*88\*dt,12\)/,"approaching quiz pedestrians must route around barriers");
assert.match(game,/playerHit\|\|!moveGroundResponder\(n,dx,dy,12\)/,"ordinary pedestrians must route around barriers");
assert.match(game,/dynamicBlocker\(nx,player\.y,px,player\.y\)/,"the player must not walk deeper into response vehicles");
assert.match(game,/groundObstacles=.*\.\.\.policeVehicles.*\.\.\.police.*\.\.\.npcs/,"trains must detect people and ground police responses");
assert.match(game,/groundAllowed=blockedByGround\?Math\.max\(0,groundGap-TRAIN_PLAYER_STOP_GAP\):Infinity/,"trains must hard-limit advance before a ground obstacle");
assert.match(game,/available=Math\.max\(0,distance-TRAIN_MIN_GAP\).*a\.motion\*=factor;b\.motion\*=factor/,"opposing and following trains must share the same hard no-overlap spacing");
assert.match(game,/headingX=velocity>10\?player\.vx\/velocity/,"cars must predict the player's current trajectory");
assert.match(game,/slot=\(car\.index-\(policeVehicles\.length-1\)\/2\)\*82/,"cars must fan into blocking formation slots");
assert.match(game,/if\(velocity<10\).*radius=175\+car\.index\*24/,"cars must orbit the player when no trajectory is available");
assert.match(game,/desiredSpeed=d<30\?0/,"cars must brake at their blocking position");

console.log("Predictive interception, ground collision, and train-spacing contracts OK");
