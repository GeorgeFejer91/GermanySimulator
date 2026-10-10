import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";
import {join} from "node:path";
import vm from "node:vm";

const game=readFileSync("game.js","utf8"),world3d=readFileSync("world3d.js","utf8"),assetRoot=join("assets","models","police-response");
const assets=[
 ["black-helicopter.glb","fc2285de51397b639c3c974318fdd4ecf8ec295275bb216febc6bbc4788e0832"]
];
for(const [name,hash] of assets){
 const data=readFileSync(join(assetRoot,name));
 assert.equal(data.subarray(0,4).toString("ascii"),"glTF",`${name} is not a GLB`);
 assert.ok(statSync(join(assetRoot,name)).size<200_000,`${name} exceeds the bounded response-asset budget`);
 assert.equal(createHash("sha256").update(data).digest("hex"),hash,`${name} checksum drifted`);
}
const timingBody=game.match(/const OFFENSE_TIMING=Object\.freeze\(\{([^}]+)\}\)/)[1],timing=Object.fromEntries([...timingBody.matchAll(/(\w+):([\d.]+)/g)].map(([,key,value])=>[key,Number(value)]));
assert.ok(timing.warn<.45&&timing.road<3&&timing.grass<3&&timing.stationGrass<2.4,"surface warnings and stars must be slightly faster than the old curve");
assert.equal(timing.policeContactCooldown,5.8,"clustered foot contacts must be rate-limited so wanted escalation remains reachable");
assert.deepEqual(JSON.parse(`[${game.match(/const POLICE_RESPONSE_CARS=\[([^\]]+)\]/)[1]}]`),[0,0,1,2,3,4]);
assert.deepEqual(JSON.parse(`[${game.match(/POLICE_RESPONSE_HELICOPTERS=\[([^\]]+)\]/)[1]}]`),[0,0,0,0,1,2]);
assert.match(game,/if\(instant\|\|gained>0\)spawnPolice/,"the first gained star must call a foot response");
assert.match(game,/function spawnPointVisible\(x,y,padding,kind="officer"\)/,"response spawns need one renderer-aware visibility gate");
assert.match(game,/if\(spawnPointVisible\(x,y,padding,kind\)\|\|responderBlocked\(x,y,radius,null\)\)continue/,"response candidates must be both offscreen and collision-free");
assert.match(game,/if\(!police\.length\)\{const point=groundResponsePoint/,"law-power reinforcements must use the same offscreen spawn path");
assert.match(game,/getPoliceVehicles:\(\)=>policeVehicles/);
assert.match(game,/getPoliceHelicopters:\(\)=>policeHelicopters/);
assert.match(game,/helicopter\.spotlight&&grass/,"helicopter pressure must remain tied to forbidden grass");
assert.match(game,/if\(state\.policeContactCooldown>0\)continue/);
assert.match(world3d,/police:\{file:"police-estate"/,"the police car must load the original German estate model");
assert.match(world3d,/police-response\/black-helicopter\.glb/);
assert.match(world3d,/function makePoliceCarSlot\(car\)/,"WebGL needs a procedural car fallback");
assert.match(world3d,/function makePoliceHelicopterSlot\(helicopter\)/,"WebGL needs a procedural helicopter fallback");
assert.match(world3d,/window\.Germany3D=\{ready:true,isWorldPointVisible,/,"the active Three.js camera must report its padded frustum to the simulation");
assert.doesNotMatch(world3d,/box\(\.045,\.2,1\.9,blue/,"the old floating full-length blue stripe must stay removed");
const barks=[];
const barkScope=vm.createContext({performance:{now:()=>10000},state:{region:"germany",wanted:0},police:[],STIMULUS_PRIORITY:{REACTIVE:2},
 nextVariant:()=>"OTHER POLICE LINE",hasStimulusFamily:()=>false,
 showWorldBark:(...args)=>barks.push(args),groundResponsePoint:()=>({x:0,y:0}),
 clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),syncPoliceResponse:()=>{},
 announcePoliceResponse:()=>{},violationAlert:()=>{},toast:()=>{},updateHud:()=>{}});
const barkPool=game.slice(game.indexOf("const policeBarks="),game.indexOf("\nconst TRAIN_ANNOUNCEMENT_AUDIO="));
const barkFunction=game.slice(game.indexOf("function policeBark("),game.indexOf("\nfunction jaywalkerBark("));
vm.runInContext(`${barkPool}\n${barkFunction}\nglobalThis.bark=policeBark`,barkScope);
barkScope.bark(true,"RASENBETRETUNG IM SCHREBERGARTEN");
assert.equal(barks.at(-1)[1],"NICHT ÜBER DEN RASEN!");
assert.equal(barks.at(-1)[5].candidateVoiceId,"polizei-heinrich-wachtmeister");
barkScope.state.region="berlin";
barkScope.bark(true,"GRÜNFLÄCHENNUTZUNG OHNE ERLAUBNIS");
assert.equal(barks.at(-1)[1],"Nicht auf ze grass, bitte!");
barkScope.bark(true,"SPAZIERGANG OHNE VORGANG");
assert.equal(barks.at(-1)[1],"OTHER POLICE LINE");
const wantedFunction=game.slice(game.indexOf("function wanted("),game.indexOf("\nfunction escalate("));
const spawnFunction=game.slice(game.indexOf("function spawnPolice("),game.indexOf("\nfunction updatePoliceResponse("));
vm.runInContext(`${spawnFunction}\n${wantedFunction}\nglobalThis.offend=wanted`,barkScope);
barkScope.state.region="germany";
barkScope.offend(1,"RASENBETRETUNG IM SCHREBERGARTEN",false);
assert.equal(barks.at(-1)[1],"NICHT ÜBER DEN RASEN!","a real grass star must call Heinrich's grass bark");
console.log("Faster offenses and progressive police response contract OK");
