import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");
const world=readFileSync("world3d.js","utf8");

assert.match(game,/const HUD_REFRESH_SECONDS=\.1/,"HUD DOM refreshes must be rate-limited outside immediate state changes");
assert.match(game,/hudRefreshTimer-=dt;if\(hudRefreshTimer<=0\)\{hudRefreshTimer=HUD_REFRESH_SECONDS;updateHud\(\)\}/);
assert.match(game,/addEventListener\("blur",clearInput\)/,"focus loss must release held movement");
assert.match(game,/visibilitychange.*document\.hidden.*clearInput/,"backgrounding the page must release held movement");
const loopSource=game.match(/function loop\(now\)\{[^\n]+\}/)?.[0];
assert.ok(loopSource,"the simulation loop must exist");
const steps=[];
let syncs=0;
const pageState={hidden:false},gameState={started:true};
const loop=new Function("update","updatePoliceChaseAudio","draw","window","requestAnimationFrame","document","state",`let last=0;${loopSource};return loop`)(dt=>steps.push(dt),()=>{},()=>{},{Germany3D:{sync:()=>syncs++}},()=>{},pageState,gameState);
loop(100);
assert.equal(steps.length,4,"a 100 ms rendered frame should update simulation in bounded substeps");
assert.ok(Math.abs(steps.reduce((sum,dt)=>sum+dt,0)-.1)<1e-9,"slow frames must retain their elapsed gameplay time");
steps.length=0;loop(1000);
assert.ok(steps.length<=5&&steps.reduce((sum,dt)=>sum+dt,0)<=.1200001,"long stalls must stay bounded");
steps.length=0;syncs=0;pageState.hidden=true;loop(2000);
assert.equal(steps.length,0);assert.equal(syncs,0,"hidden tabs must not simulate or render");
pageState.hidden=false;gameState.started=false;
for(let now=2010;now<=3010;now+=10)loop(now);
assert.equal(steps.length,0,"the opening screen must not advance gameplay");
assert.equal(syncs,4,"opening-screen world rendering must stay at 4 Hz");
gameState.started=true;syncs=0;steps.length=0;
loop(3020);loop(3021);assert.equal(syncs,1,"high refresh displays must not double simulation/render work");

const syncChar=world.match(/function syncChar\(q,o,l=0\)\{[\s\S]*?\n  \}/)?.[0]||"";
assert.match(syncChar,/travel=Math\.hypot/,"procedural gait must follow actual movement");
assert.doesNotMatch(syncChar,/performance\.now/,"idle characters must not walk in place from wall-clock animation");
assert.match(world,/const atlasTextureCache=new Map\(\),atlasMaterialCache=new Map\(\)/);
assert.match(world,/new T\.Mesh\(geometry,material\)/,"atlas actors must share one material and texture per character kind");
assert.match(world,/r=camera\.quaternion;q\.quaternion\.copy\(r\)/,"atlas planes must remain camera-facing");

console.log("Runtime frame pacing, focus input, and shared sprite texture contracts OK");
