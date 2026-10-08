import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const world3d=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");

assert.match(game,/kind=laneY>BORDER_Y\?"beetle":"trabant"/,"Berlin and Deutschland traffic must keep separate vehicle identities");
assert.match(game,/const trafficCars=\[\].*for\(let roadIndex=0;roadIndex<horizontalRoads\.length/s,"civilian traffic must populate the established horizontal road lanes");
assert.match(game,/queueGap=.*trafficForwardGap.*playerGap=.*trafficForwardGap.*obstacleGap=Math\.min\(queueGap,playerGap,trafficGroundGap\(car\)\)/s,"cars must queue behind people, solid objects and stopped traffic");
assert.match(game,/car\.blockedByPlayer&&!wasBlocked\)\{playTrafficHorn\(car\);shoutTrafficDriver\(car\)/,"the directly obstructed driver must honk and shout as soon as braking begins");
assert.match(game,/for\(const item of \[\.\.\.trafficCars,\.\.\.policeVehicles\]\)/,"complete civilian and police car bodies must block player movement");
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

const trafficUpdate=game.match(/function updateTraffic\(dt\)\{[\s\S]*?\n\s*\}(?=\r?\nfunction nearestRailLocation)/)?.[0];
assert.ok(trafficUpdate,"traffic update must remain testable");
const reactions=[];
const trafficSandbox={trafficCars:[{x:500,y:100,dir:1,lane:"lane",roadIndex:0,vortexPhase:"road",speed:100,cruiseSpeed:120,acceleration:60,blockedByPlayer:false,honkCooldown:0,honkFlash:0,hold:0},{x:270,y:100,dir:1,lane:"lane",roadIndex:0,vortexPhase:"road",speed:100,cruiseSpeed:120,acceleration:60,blockedByPlayer:false,honkCooldown:0,honkFlash:0,hold:0}],player:{x:645,y:100,r:16},TRAFFIC_CAR_RADIUS:42,TRAFFIC_BRAKE_DISTANCE:190,TRAFFIC_STOP_GAP:36,TRAFFIC_MIN_X:0,TRAFFIC_MAX_X:1000,TRAFFIC_LANE_LENGTH:1000,wirtschaftswunderSite:{roadIndex:5},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),trafficGroundGap:()=>Infinity,responderBlocked:()=>false,playTrafficHorn:(car,aggressive)=>reactions.push(["horn",car,aggressive]),shoutTrafficDriver:car=>reactions.push(["shout",car]),updateWirtschaftswunderCar:()=>{},enterWirtschaftswunder:()=>{}};
trafficSandbox.vehicleMotionBlocked=()=>false;trafficSandbox.vehicleCameraVisible=()=>false;trafficSandbox.vehicleFullyOffMap=()=>true;
vm.runInNewContext(`${helper};${trafficUpdate};updateTraffic(.016);updateTraffic(.016)`,trafficSandbox);
assert.deepEqual(reactions.map(([kind])=>kind),["horn","shout"],"braking must trigger both reactions once on entry, before the car stops; queued cars stay quiet");
vm.runInNewContext("for(let i=0;i<90;i++)updateTraffic(.016)",trafficSandbox);
assert.equal(reactions.filter(([kind,,aggressive])=>kind==="horn"&&aggressive).length,1,"a sustained stop must escalate to a longer horn burst");

console.log("ambient traffic checks passed");
