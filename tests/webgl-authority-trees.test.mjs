import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");

assert.match(index,/<canvas id="game" hidden aria-hidden="true"><\/canvas>/,"the retired Canvas surface must stay non-rendering");
assert.match(game,/function draw\(\)\{nearestInteract\(\)\}/,"the runtime view loop must not invoke the old Canvas renderer");
assert.doesNotMatch(game,/if\(!window\.Germany3D\?\.ready\)drawWorld\(\)/,"Canvas must not return as a WebGL fallback");
assert.match(renderer,/showRendererFailure/);
assert.match(renderer,/\(bridge\.trees\|\|\[\]\)\.forEach/,"Three.js must consume canonical tree placement");

const roadsStart=game.indexOf("const horizontalRoads=");
const roadsEnd=game.indexOf("const OFFENSE_TIMING=",roadsStart);
const roadSandbox={};
vm.runInNewContext(`
const CITY={w:9840,h:4240},RAIL_GUTTER=560;
${game.slice(roadsStart,roadsEnd)}
globalThis.roads=roads;
`,roadSandbox);

const treeBlock=game.match(/const TREE_RADIUS=(\d+),TREE_ROAD_CLEARANCE=(\d+),trees=Object\.freeze\(\[([\s\S]*?)\]\.map\(\(\[x,y\]\)=>offsetWorldPoint/);
assert.ok(treeBlock,"tree placement must be declared in canonical world data");
const radius=Number(treeBlock[1]),clearance=Number(treeBlock[2]);
const trees=[...treeBlock[3].matchAll(/\[(\d+),(\d+)\]/g)].map(match=>({x:Number(match[1])+560,y:Number(match[2])+560}));
assert.equal(trees.length,24,"the established tree count must be preserved");
assert.ok(clearance>=radius,"the road margin must clear the rendered tree crown");
for(const tree of trees)for(const road of roadSandbox.roads){
  const overlaps=tree.x>=road.x-clearance&&tree.x<=road.x+road.w+clearance&&tree.y>=road.y-clearance&&tree.y<=road.y+road.h+clearance;
  assert.equal(overlaps,false,`tree ${tree.x}/${tree.y} must stay clear of road ${road.x}/${road.y}`);
}

const assetBlock=game.match(/const assetSources=\{([^}]+)\}/)?.[1]||"";
assert.doesNotMatch(assetBlock,/\.svg/,"the canonical runtime must not preload the retired 2D world-art set");
assert.match(assetBlock,/merkelSprite/);assert.match(assetBlock,/borderPourerSprite/);

console.log("WebGL authority and road-safe tree placement checks passed");
