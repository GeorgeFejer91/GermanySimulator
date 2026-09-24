import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";
import {join} from "node:path";
import vm from "node:vm";

const game=readFileSync("game.js","utf8"),assetRoot=join("assets","audio","police");
const assets=[
 ["martinshorn-essen-loop.mp3",221_666,"b71adbe0aecf863c9c43ac3b00c9ff265891d72f4a7edaa221cdf4b5691d7f31"],
 ["german-police-passby.mp3",149_881,"948b9b08b5957740815c0c7aa0e22969979a59582fb2108ad1b258237657077e"]
];
for(const [name,size,hash] of assets){
 const path=join(assetRoot,name),data=readFileSync(path);
 assert.equal(statSync(path).size,size,`${name} size drifted`);
 assert.ok(data.subarray(0,3).toString("ascii")==="ID3"||(data[0]===0xff&&(data[1]&0xe0)===0xe0),`${name} is not an MP3`);
 assert.equal(createHash("sha256").update(data).digest("hex"),hash,`${name} checksum drifted`);
}
assert.match(game,/const POLICE_CHASE_SIREN_AUDIO="\.\/assets\/audio\/police\/martinshorn-essen-loop\.mp3"/);
assert.match(game,/POLICE_PASSBY_AUDIO="\.\/assets\/audio\/police\/german-police-passby\.mp3"/);
assert.match(game,/source\.loop=true/,"the longer authentic Martinshorn must sustain the chase");
assert.match(game,/state\.wanted>=2&&policeVehicles\.length/,"continuous chase audio must begin with the first police car");
assert.match(game,/Math\.min\(\.05,\(state\.wanted-2\)\*\.016\)/,"higher response tiers should add slight pass-by urgency");
assert.match(game,/if\(contactDistance<190&&car\.passbyReady\)/,"a nearby police car must trigger the sourced pass-by accent only once per approach");
assert.match(game,/\.catch\(\(\)=>\{if\(eligible\(\)\)playSiren\(\)\}\)/,"a missing pass-by recording must retain the synthesized alert fallback only while the approach is active");
assert.match(game,/function loop\(now\).*updatePoliceChaseAudio\(\);draw\(\)/,"chase audio must follow the latest simulated state, including modal transitions");

const passbySource=game.match(/function playPolicePassby\([^\n]+/)?.[0];
assert.ok(passbySource,"the pass-by cue must exist");
let rejectRecording,synthFallbacks=0;
const recording=new Promise((_,reject)=>rejectRecording=reject);
const context=vm.createContext({performance:{now:()=>1000},recording,playSiren:()=>synthFallbacks++});
vm.runInContext(`
 let policePassbyNextAt=0;
 const state={started:true,modal:false,gameOver:false,wanted:2},player={x:0,y:0},car={x:100,y:0},policeVehicles=[car],POLICE_PASSBY_AUDIO="passby.mp3";
 const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),prepareRecording=()=>globalThis.recording;
 ${passbySource}
 playPolicePassby(car);
 state.modal=true;
`,context);
rejectRecording(new Error("asset unavailable"));
await recording.catch(()=>{});
await Promise.resolve();
assert.equal(synthFallbacks,0,"a late failed pass-by must not sound over a modal");

console.log("Local German police chase audio contract OK");
