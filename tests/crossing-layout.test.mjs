import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const start=game.indexOf("const horizontalRoads=");
const end=game.indexOf("const schreber=");
const sandbox={};

vm.runInNewContext(`
const CITY={w:9840,h:4240},RAIL_GUTTER=560;
const offsetWorldPoint=item=>({...item,x:item.x+RAIL_GUTTER,y:item.y+RAIL_GUTTER});
${game.slice(start,end)}
globalThis.layout={horizontalRoads,verticalRoads,crossings,trafficLights};
`,sandbox);

const {horizontalRoads,verticalRoads,crossings,trafficLights}=sandbox.layout;
assert.equal(crossings.length,horizontalRoads.length*verticalRoads.length*2+3);
for(let row=0;row<horizontalRoads.length;row++)for(let column=0;column<verticalRoads.length;column++){
  const pair=(row*verticalRoads.length+column)*2;
  const horizontal=crossings[pair],vertical=crossings[pair+1],roadH=horizontalRoads[row],roadV=verticalRoads[column];
  assert.deepEqual({...horizontal},{x:roadV.x,y:roadH.y-80,w:roadV.w,h:80},"east-west crossing must sit on the north approach");
  assert.deepEqual({...vertical},{x:roadV.x-90,y:roadH.y,w:90,h:roadH.h},"north-south crossing must sit on the west approach");
}

assert.equal(trafficLights.length,crossings.length*2,"each zebra needs a signal facing each approach");
for(let crossingId=0;crossingId<crossings.length;crossingId++){
  const c=crossings[crossingId],a=trafficLights[crossingId*2],b=trafficLights[crossingId*2+1];
  assert.equal(a.crossingId,crossingId);assert.equal(b.crossingId,crossingId);assert.equal(a.phaseOffset,b.phaseOffset);
  assert.deepEqual([a.x,a.y],[b.waitX,b.waitY],"the opposite approach must look directly at this signal");
  assert.deepEqual([b.x,b.y],[a.waitX,a.waitY],"paired signals must face inward across the same zebra");
  assert.deepEqual([a.turn,b.turn],c.w>c.h?[3,1]:[2,0]);
}
assert.match(renderer,/for\(let i=0;i<8;i\+=2\)/,"WebGL should render four zebra stripes per crossing");
assert.match(renderer,/g\.rotation\.y=\(light\.turn\|\|0\)\*Math\.PI\/2/,"WebGL signal heads must face their waiting pedestrian");
assert.match(diagnostic,/crossings\.push\(\{x:v\.x,y:h\.y-80,w:v\.w,h:80\}\)/,"the direct 3D diagnostic must mirror the canonical crossing layout");

const eventStart=game.indexOf("function updateGermannessEvents");
const eventEnd=game.indexOf("function useLawPower",eventStart);
const eventSandbox={};
vm.runInNewContext(`
const state={ampelClock:0,lawCooldown:0,wasOnRoad:false,crossingRun:null,crossRewardAt:-9};
const player={x:-24,y:20};
const crossings=[{x:0,y:0,w:100,h:40}];
const trafficLights=[
 {crossingId:0,x:124,y:20,waitX:-24,waitY:20,phaseOffset:0,green:false,rewardCycle:-1,waitedCycle:-9,waitTime:0},
 {crossingId:0,x:-24,y:20,waitX:124,waitY:20,phaseOffset:0,green:false,rewardCycle:-1,waitedCycle:-9,waitTime:0}
];
const points=[],dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),inRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
const onRoad=(x,y)=>inRect(x,y,crossings[0]),toast=()=>{},addGermanness=(amount,reason)=>points.push({amount,reason});
${game.slice(eventStart,eventEnd)}
globalThis.events={state,player,trafficLights,points,updateGermannessEvents};
`,eventSandbox);
const events=eventSandbox.events;
events.updateGermannessEvents(1.6,0);
assert.equal(events.trafficLights[0].waitedCycle,0,"standing at a red approach should arm, not award, the Ampel bonus");
assert.equal(events.points.length,0,"waiting alone must not award Germanness");
events.state.ampelClock=6.01;events.player.x=1;events.updateGermannessEvents(.01,1);
assert.equal(events.state.crossingRun.signalGreen,true);assert.equal(events.state.crossingRun.waitedAtRed,true);
events.player.x=101;events.updateGermannessEvents(.01,1);
assert.equal(events.points[0].amount,2,"a red wait followed by a completed green crossing earns both points");
events.points.length=0;Object.assign(events.state,{ampelClock:0,wasOnRoad:false,crossingRun:null,crossRewardAt:-9});events.trafficLights.forEach(light=>Object.assign(light,{waitedCycle:-9,rewardCycle:-1,waitTime:0}));events.player.x=1;events.updateGermannessEvents(0,1);events.player.x=101;events.updateGermannessEvents(.01,1);
assert.equal(events.points.length,0,"entering on red must invalidate the crossing reward");

console.log("Zebra geometry, facing Ampels, and green-crossing rewards OK");
