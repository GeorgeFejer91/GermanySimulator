import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const game=readFileSync('game.js','utf8');
const first=game.indexOf('function pedestrianLane('),last=game.indexOf('function createPedestrianMover(',first);
assert(first>=0&&last>first);
const collisionFirst=game.indexOf('function responderBlocked('),collisionLast=game.indexOf('function moveGroundResponder(',collisionFirst);
assert(collisionFirst>=0&&collisionLast>collisionFirst);
function fixture({horizontal=true,direction=-1,wisdom=false}={}){
 const actor={x:100,y:100,vx:horizontal?direction*14:0,vy:horizontal?0:direction*14,routeBounds:{x:64,y:64,w:72,h:72},...(wisdom?{wisdomId:'own-wisdom'}:{})};
 const scope=vm.createContext({npcs:[actor],police:[],trafficCars:[],policeVehicles:[],trains:[],player:{x:1000,y:1000,r:16},groundStaticMotionBlocked:()=>false,pedestrianRouteContains:()=>true,stationElevation:()=>0,dist:(x,y,a,b)=>Math.hypot(x-a,y-b),Math});
 vm.runInContext(game.match(/^function groundContactBlocks\([^\n]+/m)[0]+'\n'+game.slice(collisionFirst,collisionLast)+'\n'+game.slice(first,last),scope);
 return{actor,scope,lane:()=>scope.pedestrianLane(actor),blocker:(x,y,kind='npc')=>{const body={x,y};if(kind==='player')Object.assign(scope.player,body);else scope[kind==='police'?'police':'npcs'].push(body)}};
}

for(const horizontal of [true,false])for(const direction of [-1,1])for(const kind of ['player','npc','police'])test(`an obstructed lane keeps the clear parallel line (${horizontal?'horizontal':'vertical'}, ${direction}, ${kind})`,()=>{
 const f=fixture({horizontal,direction});
 const nominal=f.lane();assert.notEqual(nominal,100);
 // The root is clear; the intended lane endpoint is blocked by a live body.
 f.blocker(horizontal?100:nominal+direction*14,horizontal?nominal-direction*14:100,kind);
 assert.equal(f.lane(),100);
});

test('a dynamic body between clear lateral endpoints blocks the whole lane change',()=>{
 const f=fixture();f.actor.y=128;
 // Nominal84 is44units away; both endpoint distances exceed the26-unit
 // citizen clearance, but the segment crosses the circle beside its centre.
 f.blocker(115,106);
 assert.equal(f.lane(),128);
});

test('a tangent lane change and a clear lane retain the authored lane',()=>{
 const f=fixture();f.blocker(126,92);
 assert.equal(f.lane(),84);
 f.scope.npcs.pop();assert.equal(f.lane(),84);
});

test('a lane change can leave an existing contact while moving away',()=>{
 const f=fixture();f.blocker(100,125);
 assert.equal(f.lane(),84);
});

test('a moving blocker releases its lane and the actor does not block itself',()=>{
 const f=fixture();f.blocker(100,70);
 assert.equal(f.lane(),100);
 f.scope.npcs[1].x=300;assert.equal(f.lane(),84);
});

test('static projecting geometry still keeps the current line',()=>{
 const f=fixture();f.scope.groundStaticMotionBlocked=()=>true;
 assert.equal(f.lane(),100);
});

test('an actor already in its lane needs no path queries',()=>{
 const f=fixture();f.actor.y=84;
 f.scope.responderBlocked=()=>{throw Error('No lateral path exists')};
 assert.equal(f.lane(),84);
});

test('initial route placement is not travel from an off-route declaration',()=>{
 const f=fixture();f.actor.y=128;f.blocker(115,106);
 assert.equal(f.scope.pedestrianLane(f.actor,true),84);
 f.scope.groundStaticMotionBlocked=()=>true;
 assert.equal(f.scope.pedestrianLane(f.actor,true),128);
});

test('route initialization explicitly selects placement lane semantics',()=>{
 const f=fixture();f.actor.y=128;f.blocker(115,106);
 const start=game.indexOf('function initializePedestrianRoutes('),end=game.indexOf('\ninitializePedestrianRoutes();',start);
 Object.assign(f.scope,{horizontalRoads:[{y:136,h:20}],verticalRoads:[],sidewalkSegments:[{min:0,max:200}],verticalSidewalkSegments:[],stations:[],SIDEWALK_WIDTH:72,
  movePedestrian:{invalidate(){}},notifyStreetDiscontinuity(){},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),staticBlocked:()=>false});
 f.scope.npcs[1].special='fixture-blocker';
 vm.runInContext(game.slice(start,end),f.scope);
 f.scope.initializePedestrianRoutes();
 assert.equal(f.actor.x,100);assert.equal(f.actor.y,84,'Placement may start across a blocked path when its actual destination is clear');
});
