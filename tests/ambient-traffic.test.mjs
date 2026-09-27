import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const world3d=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");

assert.match(game,/kind=laneY>BORDER_Y\?"beetle":"trabant"/,"Berlin and Deutschland traffic must keep separate vehicle identities");
assert.match(game,/const trafficCars=\[\].*for\(let roadIndex=0;roadIndex<horizontalRoads\.length/s,"civilian traffic must populate the established horizontal road lanes");
assert.match(game,/queueGap=.*trafficForwardGap.*playerGap=.*trafficForwardGap.*obstacleGap=Math\.min\(queueGap,playerGap\)/s,"cars must queue behind both the player and stopped traffic");
assert.match(game,/car\.blockedByPlayer&&car\.speed<30.*playTrafficHorn\(car\)/s,"the directly obstructed driver must honk after stopping");
assert.match(game,/trafficCars\.map\(item=>\(\{item,r:TRAFFIC_CAR_RADIUS\}\)\)/,"civilian cars must block player movement");
assert.match(game,/getTrafficCars:\(\)=>trafficCars/,"the WebGL renderer must consume the canonical traffic simulation");
assert.match(world3d,/function makeTrafficCarSlot\(car\).*car\.kind==="beetle"/s,"WebGL must distinguish rounded Beetles from boxy Trabants");
assert.match(world3d,/assets\/models\/vehicles\/.*spec\.file/s,"traffic must use the complete local fleet models");
assert.match(world3d,/async function installVehicleModel.*slot\.fallback\.visible=false.*Keeping procedural/s,"every vehicle keeps a complete missing-file fallback");
assert.doesNotMatch(world3d,/installTrafficBeetleModel|slot\.tail\.color/,"obsolete body-scan overlays must not surround the complete GLBs");

const helper=game.match(/function trafficForwardGap\(car,targetX\)\{[^}]+\}/)?.[0];
assert.ok(helper,"traffic gap helper must remain testable");
const sandbox={};
vm.runInNewContext(`const TRAFFIC_LANE_LENGTH=100;${helper};result=[trafficForwardGap({dir:1,x:90},10),trafficForwardGap({dir:-1,x:10},90),trafficForwardGap({dir:1,x:20},65)]`,sandbox);
assert.equal(JSON.stringify(sandbox.result),JSON.stringify([20,20,45]),"lane gaps must wrap consistently in both directions");

console.log("ambient traffic checks passed");
