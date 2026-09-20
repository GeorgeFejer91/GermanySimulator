import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";
import {join} from "node:path";

const game=readFileSync("game.js","utf8"),world3d=readFileSync("world3d.js","utf8"),assetRoot=join("assets","models","police-response");
const assets=[
 ["police-car.glb","e3659cca0b41f55d65526c5495bc5c8d23ce1c382dd401234371390b579f80e5"],
 ["black-helicopter.glb","fc2285de51397b639c3c974318fdd4ecf8ec295275bb216febc6bbc4788e0832"]
];
for(const [name,hash] of assets){
 const data=readFileSync(join(assetRoot,name));
 assert.equal(data.subarray(0,4).toString("ascii"),"glTF",`${name} is not a GLB`);
 assert.ok(statSync(join(assetRoot,name)).size<200_000,`${name} exceeds the bounded response-asset budget`);
 assert.equal(createHash("sha256").update(data).digest("hex"),hash,`${name} checksum drifted`);
}
const livery=readFileSync(join(assetRoot,"police-car-livery.png"));
assert.ok(livery.length<50_000,"the editable livery texture must stay lightweight");
assert.equal(createHash("sha256").update(livery).digest("hex"),"54b6c2235f23ea071425dc35691150997e4695a06b6feae5514ef10cbf8c8c11");
assert.match(readFileSync(join(assetRoot,"police-car.glb")).toString("latin1"),/GermanPoliceLivery/,"the GLB must embed the UV livery material");
const timingBody=game.match(/const OFFENSE_TIMING=Object\.freeze\(\{([^}]+)\}\)/)[1],timing=Object.fromEntries([...timingBody.matchAll(/(\w+):([\d.]+)/g)].map(([,key,value])=>[key,Number(value)]));
assert.ok(timing.warn<.45&&timing.road<3&&timing.grass<3&&timing.stationGrass<2.4,"surface warnings and stars must be slightly faster than the old curve");
assert.equal(timing.policeContactCooldown,5.8,"clustered foot contacts must be rate-limited so wanted escalation remains reachable");
assert.deepEqual(JSON.parse(`[${game.match(/const POLICE_RESPONSE_CARS=\[([^\]]+)\]/)[1]}]`),[0,0,1,2,3,4]);
assert.deepEqual(JSON.parse(`[${game.match(/POLICE_RESPONSE_HELICOPTERS=\[([^\]]+)\]/)[1]}]`),[0,0,0,0,1,2]);
assert.match(game,/if\(instant\|\|gained>0\)spawnPolice/,"the first gained star must call a foot response");
assert.match(game,/getPoliceVehicles:\(\)=>policeVehicles/);
assert.match(game,/getPoliceHelicopters:\(\)=>policeHelicopters/);
assert.match(game,/helicopter\.spotlight&&grass/,"helicopter pressure must remain tied to forbidden grass");
assert.match(game,/if\(state\.policeContactCooldown>0\)continue/);
assert.match(world3d,/police-response\/police-car\.glb/);
assert.match(world3d,/police-response\/black-helicopter\.glb/);
assert.match(world3d,/function makePoliceCarSlot\(car\)/,"WebGL needs a procedural car fallback");
assert.match(world3d,/function makePoliceHelicopterSlot\(helicopter\)/,"WebGL needs a procedural helicopter fallback");
assert.doesNotMatch(world3d,/box\(\.045,\.2,1\.9,blue/,"the old floating full-length blue stripe must stay removed");
console.log("Faster offenses and progressive police response contract OK");
