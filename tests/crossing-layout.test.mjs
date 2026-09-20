import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const start=game.indexOf("const horizontalRoads=");
const end=game.indexOf("const trafficLights=[];");
const sandbox={};

vm.runInNewContext(`
const CITY={w:9840,h:4240},RAIL_GUTTER=560;
const offsetWorldPoint=item=>({...item,x:item.x+RAIL_GUTTER,y:item.y+RAIL_GUTTER});
${game.slice(start,end)}
globalThis.layout={horizontalRoads,verticalRoads,crossings};
`,sandbox);

const {horizontalRoads,verticalRoads,crossings}=sandbox.layout;
assert.equal(crossings.length,horizontalRoads.length*verticalRoads.length*2+3);
for(let row=0;row<horizontalRoads.length;row++)for(let column=0;column<verticalRoads.length;column++){
  const pair=(row*verticalRoads.length+column)*2;
  const horizontal=crossings[pair],vertical=crossings[pair+1],roadH=horizontalRoads[row],roadV=verticalRoads[column];
  assert.deepEqual({...horizontal},{x:roadV.x,y:roadH.y-80,w:roadV.w,h:80},"east-west crossing must sit on the north approach");
  assert.deepEqual({...vertical},{x:roadV.x-90,y:roadH.y,w:90,h:roadH.h},"north-south crossing must sit on the west approach");
}

assert.match(game,/crossingSigns\.push\(\{x:c\.x\+c\.w\+28/,"each crossing should create one sign instead of a duplicate pair");
assert.match(renderer,/for\(let i=0;i<8;i\+=2\)/,"WebGL should render four zebra stripes per crossing");
assert.match(diagnostic,/crossings\.push\(\{x:v\.x,y:h\.y-80,w:v\.w,h:80\}\)/,"the direct 3D diagnostic must mirror the canonical crossing layout");

console.log("Set-back zebra-crossing layout contracts OK");
