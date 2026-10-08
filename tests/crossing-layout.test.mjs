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
const CITY={w:9840,h:4240},RAIL_GUTTER=560,WORLD={w:CITY.w+1120,h:CITY.h+1120};
const offsetWorldPoint=item=>({...item,x:item.x+RAIL_GUTTER,y:item.y+RAIL_GUTTER});
${game.slice(start,end)}
${game.slice(game.indexOf('const STATION_RISE='),game.indexOf('const TRAIN_CAR_OFFSETS='))}
globalThis.layout={horizontalRoads,verticalRoads,vehicleApproaches,crossings,trafficLights};
`,sandbox);

const {horizontalRoads,verticalRoads,vehicleApproaches,crossings,trafficLights}=sandbox.layout;
const controlledCount=horizontalRoads.length*verticalRoads.length*2+3;
assert.equal(crossings.length,controlledCount+6,'side-platform routes have six explicit uncontrolled crossings');
for(let row=0;row<horizontalRoads.length;row++)for(let column=0;column<verticalRoads.length;column++){
  const pair=(row*verticalRoads.length+column)*2;
  const horizontal=crossings[pair],vertical=crossings[pair+1],roadH=horizontalRoads[row],roadV=verticalRoads[column];
  assert.deepEqual({...horizontal},{x:roadV.x,y:roadH.y-80,w:roadV.w,h:80},"east-west crossing must sit on the north approach");
  assert.deepEqual({...vertical},{x:roadV.x-90,y:roadH.y,w:90,h:roadH.h},"north-south crossing must sit on the west approach");
}

assert.equal(trafficLights.length,controlledCount*2,"each controlled zebra needs a signal facing each approach");
for(let crossingId=0;crossingId<crossings.length;crossingId++){
  const c=crossings[crossingId],a=trafficLights[crossingId*2],b=trafficLights[crossingId*2+1];
  if(c.uncontrolled){assert.ok(c.stationId);assert.ok(!trafficLights.some(light=>light.crossingId===crossingId),'uncontrolled platform crossings do not invent signal state');continue}
  assert.equal(a.crossingId,crossingId);assert.equal(b.crossingId,crossingId);assert.equal(a.phaseOffset,b.phaseOffset);
  assert.deepEqual([a.x,a.y],[b.waitX,b.waitY],"the opposite approach must look directly at this signal");
  assert.deepEqual([b.x,b.y],[a.waitX,a.waitY],"paired signals must face inward across the same zebra");
  assert.deepEqual([a.turn,b.turn],c.w>c.h?[3,1]:[2,0]);
}
assert.match(renderer,/for\(let i=0;i<8;i\+=2\)/,"WebGL should render four zebra stripes per crossing");
assert.match(renderer,/g\.rotation\.y=\(light\.turn\|\|0\)\*Math\.PI\/2/,"WebGL signal heads must face their waiting pedestrian");
assert.match(diagnostic,/crossings\.push\(\{x:v\.x,y:h\.y-80,w:v\.w,h:80\}\)/,"the direct 3D diagnostic must mirror the canonical crossing layout");

const eventStart=game.includes("function crossingBank")?game.indexOf("function crossingBank"):game.indexOf("function updateGermannessEvents");
const eventEnd=game.indexOf("function useLawPower",eventStart);
function rewardFixture(c={x:0,y:0,w:100,h:40},side=-1){
 const horizontal=c.w>c.h,span=horizontal?c.w:c.h,origin=horizontal?c.x:c.y;
 const pose=(along,across=.5)=>horizontal?[along,c.y+c.h*across]:[c.x+c.w*across,along];
 const near=pose(side<0?origin-24:origin+span+24),far=pose(side<0?origin+span+24:origin-24);
 const eventSandbox={c,near,far,horizontal,actualRoads:crossings.includes(c)?[...horizontalRoads,...verticalRoads,...vehicleApproaches]:null};
 vm.runInNewContext(`
const state={ampelClock:0,lawCooldown:0,wasOnRoad:false,crossingRun:null,crossRewardAt:-9};
const player={x:near[0],y:near[1]},crossings=[c];
const trafficLights=c.uncontrolled?[]:[near,far].map(([waitX,waitY])=>({crossingId:0,waitX,waitY,phaseOffset:0,green:false,rewardCycle:-1,waitedCycle:-9,waitTime:0}));
const points=[],dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),inRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
// The road continues past the stripe's lateral edges: stepping off a zebra
// while still in the carriageway must invalidate the run.
const onRoad=(x,y)=>actualRoads?actualRoads.some(r=>inRect(x,y,r)):horizontal?x>=c.x&&x<=c.x+c.w:y>=c.y&&y<=c.y+c.h;
const toast=()=>{},addGermanness=(amount,reason)=>points.push({amount,reason});
${game.slice(eventStart,eventEnd)}
globalThis.events={state,player,trafficLights,points,step(x,y,dt=.025,mag=1){const px=player.x,py=player.y;player.x=x;player.y=y;updateGermannessEvents(dt,mag,px,py)}};
`,eventSandbox);
 // Paint can overhang a carriageway; the midpoint is an actual on-road pose.
 return {...eventSandbox.events,near,far,pose,inside:pose(origin+span/2)};
}
const events=rewardFixture();
events.step(...events.near,1.6,0);
assert.equal(events.trafficLights[0].waitedCycle,0,"standing at a red approach should arm, not award, the Ampel bonus");
assert.equal(events.points.length,0,"waiting alone must not award Germanness");
events.state.ampelClock=6.01;events.step(...events.inside);
assert.equal(events.state.crossingRun.signalGreen,true);assert.equal(events.state.crossingRun.waitedAtRed,true);
events.step(...events.far);
assert.equal(events.points[0].amount,2,"a red wait followed by a completed green crossing earns both points");
assert.equal(events.trafficLights[0].rewardCycle,0,"a completed bonus consumes that approach's red wait");
const waitedRetreat=rewardFixture();waitedRetreat.step(...waitedRetreat.near,1.6,0);
waitedRetreat.state.ampelClock=6.01;waitedRetreat.step(...waitedRetreat.inside);waitedRetreat.step(...waitedRetreat.near);
assert.equal(waitedRetreat.points.length,0,"waiting at red cannot turn a same-side retreat into a two-point crossing");
assert.equal(waitedRetreat.trafficLights[0].rewardCycle,-1,"an incomplete crossing leaves the red-wait bonus available");

let generated=0;
for(const c of crossings)for(const side of [-1,1]){
 const retreat=rewardFixture(c,side);retreat.state.ampelClock=6.01;
 retreat.step(...retreat.inside);retreat.step(...retreat.near);
 assert.equal(retreat.points.length,0,`same-pavement retreat must earn nothing: ${JSON.stringify(c)}, side ${side}`);
 const offStripe=rewardFixture(c,side);offStripe.state.ampelClock=6.01;
 offStripe.step(...offStripe.inside);
 const mid=c.w>c.h?c.x+c.w/2:c.y+c.h/2;
 offStripe.step(...offStripe.pose(mid,1.01));offStripe.step(...offStripe.far);
 assert.equal(offStripe.points.length,0,"leaving the marked strip before completing the road crossing earns nothing");
 const spawn=rewardFixture(c,side);spawn.state.ampelClock=6.01;
 [spawn.player.x,spawn.player.y]=spawn.inside;spawn.step(...spawn.inside);spawn.step(...spawn.far);
 assert.equal(spawn.points.length,0,"starting inside the road does not count as entry from a pavement");
 for(const lateral of [.1,.5,.9]){
  const full=rewardFixture(c,side);full.state.ampelClock=6.01;
  full.step(...full.inside);full.step(...full.pose(mid,lateral));full.step(...full.far);
  assert.equal(full.points.length,1,"a complete in-strip crossing earns exactly once in either direction");
  assert.equal(full.points[0].amount,1);
  full.step(...full.far);assert.equal(full.points.length,1,"standing on the destination pavement does not repeat a reward");
  generated++;
 }
 const red=rewardFixture(c,side);red.step(...red.inside);red.state.ampelClock=6.01;red.step(...red.far);
 assert.equal(red.points.length,c.uncontrolled?1:0,"a later green cannot repair entry on red; uncontrolled crossings need no signal");
 const corner=rewardFixture(c,side);corner.state.ampelClock=6.01;
 const outside=corner.pose(side<0?(c.w>c.h?c.x:c.y)-1:(c.w>c.h?c.x+c.w:c.y+c.h)+1,-.01);
 [corner.player.x,corner.player.y]=outside;corner.step(...corner.inside);corner.step(...corner.far);
 assert.equal(corner.points.length,0,"entering diagonally from outside the stripe's approach is not a completed zebra crossing");
}
// Advance across the actual carriageways, including the three longer painted
// strips and all six station approaches. Every accepted pose is one unit apart.
let roadTraversals=0;
for(const c of crossings)for(const side of [-1,1])for(const waitAtRed of [false,true]){
 const full=rewardFixture(c,side),axis=c.w>c.h?0:1;
 if(waitAtRed)full.step(...full.near,1.6,0);
 full.state.ampelClock=6.01;
 for(let along=full.near[axis];side*(along-full.far[axis])>=0;along-=side)full.step(...full.pose(along),1/146,1);
 assert.equal(full.points.length,1,`actual road crossing must reward once: ${JSON.stringify(c)}, side ${side}`);
 assert.equal(full.points[0].amount,waitAtRed&&!c.uncontrolled?2:1,'red wait earns its bonus on actual pavement-to-pavement crossings');
 roadTraversals++;
}
const cooldown=rewardFixture();cooldown.state.ampelClock=6.01;
cooldown.step(...cooldown.inside);cooldown.step(...cooldown.far);
cooldown.step(99,20);cooldown.step(...cooldown.near);
assert.equal(cooldown.points.length,1,"the existing four-second reward cooldown is preserved");
assert.match(game,/updateGermannessEvents\(dt,mag,px,py\)/,"production supplies the pre-movement pose, rather than treating an on-road spawn as entry");

console.log(`Zebra geometry, facing Ampels, ${generated} generated traces and ${roadTraversals} stepped actual-road traversals OK`);
