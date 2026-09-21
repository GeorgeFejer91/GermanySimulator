import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const world3d=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const beetleModel=readFileSync(new URL("../assets/models/traffic/classic-vw-beetle.glb",import.meta.url));
const trafficLicense=readFileSync(new URL("../assets/models/traffic/LICENSES.md",import.meta.url),"utf8");

assert.match(game,/kind=laneY>BORDER_Y\?"beetle":"trabant"/,"Berlin and Deutschland traffic must keep separate vehicle identities");
assert.match(game,/const trafficCars=\[\].*for\(let roadIndex=0;roadIndex<horizontalRoads\.length/s,"civilian traffic must populate the established horizontal road lanes");
assert.match(game,/queueGap=.*trafficForwardGap.*playerGap=.*trafficForwardGap.*obstacleGap=Math\.min\(queueGap,playerGap\)/s,"cars must queue behind both the player and stopped traffic");
assert.match(game,/car\.blockedByPlayer&&car\.speed<30.*playTrafficHorn\(car\)/s,"the directly obstructed driver must honk after stopping");
assert.match(game,/trafficCars\.map\(item=>\(\{item,r:TRAFFIC_CAR_RADIUS\}\)\)/,"civilian cars must block player movement");
assert.match(game,/getTrafficCars:\(\)=>trafficCars/,"the WebGL renderer must consume the canonical traffic simulation");
assert.match(world3d,/function makeTrafficCarSlot\(car\).*car\.kind==="beetle"/s,"WebGL must distinguish rounded Beetles from boxy Trabants");
assert.match(world3d,/loadAsync\("\.\/assets\/models\/traffic\/classic-vw-beetle\.glb\?v=20260921-1"\)/,"Berlin traffic must load the local classic Type 1 model");
assert.match(world3d,/installTrafficBeetleModel\(slot\).*slot\.fallback\.visible=false.*Keeping procedural classic Beetle/s,"the Type 1 model must keep a procedural missing-file fallback");
assert.match(world3d,/CylinderGeometry\(\.19,\.19,\.14,12\).*hub.*group\.add\(q,hub\)/s,"the historic Type 1 body scan must retain game-authored wheels and hubs when loaded");
assert.match(world3d,/car\.kind==="beetle".*glass.*1\.18,group.*SphereGeometry\(\.075/s,"loaded Beetles must retain glazing, bumpers, and attached lamps");
assert.ok(beetleModel.length<100_000,"the shared classic Type 1 model must stay lightweight");
assert.equal(createHash("sha256").update(beetleModel).digest("hex"),"e0ab5ecd8fc349d4ff4bfe8af1fcf99aca7049b5821deaf5d65e0749d14d5592","the licensed traffic model must match its recorded runtime artifact");
assert.match(trafficLicense,/CC BY-SA 4\.0.*E0AB5ECD8FC349D4FF4BFE8AF1FCF99ACA7049B5821DEAF5D65E0749D14D5592/s,"the traffic model must retain license and checksum provenance");

const helper=game.match(/function trafficForwardGap\(car,targetX\)\{[^}]+\}/)?.[0];
assert.ok(helper,"traffic gap helper must remain testable");
const sandbox={};
vm.runInNewContext(`const TRAFFIC_LANE_LENGTH=100;${helper};result=[trafficForwardGap({dir:1,x:90},10),trafficForwardGap({dir:-1,x:10},90),trafficForwardGap({dir:1,x:20},65)]`,sandbox);
assert.equal(JSON.stringify(sandbox.result),JSON.stringify([20,20,45]),"lane gaps must wrap consistently in both directions");

console.log("ambient traffic checks passed");
