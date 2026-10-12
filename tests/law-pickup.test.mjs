import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('game.js','utf8');
function fn(name){const start=source.indexOf(`function ${name}(`),next=source.indexOf('\nfunction ',start+1);assert(start>=0);return source.slice(start,next<0?source.length:next)}
export function pickupHarness(){
 const h={WORLD:{w:10960,h:5360},roads:[{x:0,y:300,w:10960,h:240}],horizontalRoads:[],vehicleApproaches:[{x:-2400,y:300,w:15800,h:240}],TRAFFIC_MIN_X:-2200,TRAFFIC_MAX_X:13160,vehicleCameraVisible:()=>false,player:{x:800,y:620,r:16,facing:Math.PI/2,vx:0,vy:0},state:{started:true,wanted:0,region:'germany'},goerlitzerPark:{x:10000,y:4000,w:100,h:100},wirtschaftswunderSite:{x:10000,y:4200,collisionRadius:142},kiesingerMemorial:{x:10000,y:4500},buildings:[],props:[],normObjects:[],trees:[],trains:[],trafficCars:[],policeVehicles:[],policeHelicopters:[],police:[],npcs:[],TREE_RADIUS:38,TRAIN_CAR_HALF_LENGTH:122,TRAIN_CAR_HALF_WIDTH:46,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),stationElevation:()=>0,performance:{now:()=>0},onGardenGrass:()=>false,playPolicePassby:()=>{},showWorldBark:()=>{},toast:()=>{},POLICE_RESPONSE_CARS:[0,0,1,2,3,4],POLICE_RESPONSE_HELICOPTERS:[0,0,0,0,1,2]};
 h.horizontalRoads=h.roads;vm.createContext(h);
 const names=['normObjectRadius','propRadius','groundCircleCandidates','groundContactBlocks','signedRectDistance','vehicleBodyDistance','orientedBodySeparation','vehicleMotionBlocked','vehicleOnRoad','nearestDrivingRoad','policeDrivingTarget','driveGroundVehicle','policeDrivingClearance','vehicleFullyOffMap','retirePoliceVehicle','finishPoliceExitRecovery','groundStaticMotionBlocked','staticBlocked','trainCarDistance','pedestrianRouteContains','responderBlocked','moveGroundResponder','policeCarDoor','pickupSegmentClear','pickupDetour','walkPickupActor','updateLawPickup','syncPoliceResponse','updatePoliceResponse','lawPowerTarget'];
 // These source seams exercise production collision and state transitions, with no renderer mocks in the geometry oracle.
 vm.runInContext(names.map(fn).join('\n'),h);return h;
}
{
 const h=pickupHarness(),front={x:850,y:620,crowd:true},behind={x:780,y:620,crowd:true},side={x:815,y:690,crowd:true};h.npcs=[behind,side,front];assert.equal(h.lawPowerTarget(),front);
 const blocker={x:817,y:645,crowd:true};h.npcs.push(blocker);assert.equal(h.lawPowerTarget(),blocker,'a person touching the forward path outranks a more distant centered person');h.npcs.pop();
 front.lawPending=true;assert.equal(h.lawPowerTarget(),null,'never substitute a person behind or beside the player');front.lawPending=false;h.buildings=[{x:825,y:610,w:10,h:20}];assert.equal(h.lawPowerTarget(),null,'a hidden person behind a solid is not addressed');
}
for(const dt of [1/60,1/30,.1]){
 const h=pickupHarness(),n={x:875,y:600,crowd:true,name:'Testperson',lawPending:true},car={x:875,y:480,angle:0,speed:205,driveSpeed:0,steeringAngle:0,roadBound:true,roadIndex:0,lifecycle:'active',index:0,orbit:0,avoid:1,hitCooldown:1,lawPickup:{target:n,parking:{x:875,y:480},phase:'approach',officer:null}};h.npcs=[n];h.policeVehicles=[car];let minPeople=Infinity,minCar=Infinity;const phases=new Set();
 for(let elapsed=0;elapsed<30&&!car.retiring;elapsed+=dt){h.updatePoliceResponse(dt);phases.add(car.lawPickup.phase);const p=car.lawPickup.officer;if(p){minPeople=Math.min(minPeople,h.dist(p.x,p.y,n.x,n.y));minCar=Math.min(minCar,h.vehicleBodyDistance(p.x,p.y,car));assert(h.vehicleBodyDistance(p.x,p.y,car)>=14-.01,'officer remains outside solid car until boarding')}if(h.npcs.includes(n))assert(h.vehicleBodyDistance(n.x,n.y,car)>=13-.01,'detainee stays outside car until boarding')}
 assert(car.retiring,`pickup completes at dt=${dt}; phase=${car.lawPickup.phase}, n=${n.x},${n.y}, p=${car.lawPickup.officer?.x},${car.lawPickup.officer?.y}, path=${JSON.stringify(n.pickupRoute)}`);assert.equal(car.passengerName,n.name);assert(!h.npcs.includes(n));assert.equal(h.police.length,0);assert(minPeople>=27-.01);assert(minCar>=14-.01);assert(phases.has('fetch')&&phases.has('escort')&&phases.has('return'));
 const x=car.x;for(let i=0;i<60;i++)h.updatePoliceResponse(dt);assert(car.x!==x,'loaded car departs through production driving');assert(h.vehicleOnRoad(car.x,car.y,car.angle));
}
assert.match(source,/speakRecorded\(quote,recording,\{[^\n]+hideCaption:true/,'law power is audio-only');
assert.match(source,/if\(item.hideCaption\|\|/,'recorded and browser fallback captions honor the law exception');
assert.doesNotMatch(fn('useLawPower'),/showWorldBark/,'law power cannot open the obstructing text paper');
for(const dt of [1/60,1/30,.1])for(const wall of [{x:840,y:575,w:70,h:32},{x:900,y:575,w:70,h:32},{x:900,y:555,w:90,h:52}]){
 const h=pickupHarness(),n={x:875,y:640,crowd:true,name:'Blocked person',lawPending:true},car={x:wall.x===840?875:965,y:480,angle:0,speed:205,driveSpeed:0,steeringAngle:0,roadBound:true,roadIndex:0,lifecycle:'active',index:0,orbit:0,avoid:1,hitCooldown:1,lawPickup:{target:n,parking:{x:wall.x===840?875:965,y:480},phase:'approach',officer:null}};h.player.x=h.player.y=700;h.buildings=[wall];h.npcs=[n];h.policeVehicles=[car];
 for(let elapsed=0;elapsed<20&&!car.retiring;elapsed+=dt){h.updatePoliceResponse(dt);for(const actor of [...h.police,...h.npcs])assert(h.signedRectDistance(actor.x,actor.y,wall)>=(actor===n?13:14)-.01,'detours retain the full body wall clearance')}
 assert(car.retiring,`blocked escort must recover at ${dt}, wall ${wall.x}; phase=${car.lawPickup.phase}, n=${n.x},${n.y}, p=${car.lawPickup.officer?.x},${car.lawPickup.officer?.y}, path=${JSON.stringify(n.pickupRoute)}`);assert.equal(car.passengerName,n.name);
}
{
 const h=pickupHarness(),actor={x:500,y:700,crowd:true},goal={x:700,y:700};h.npcs=[actor];h.buildings=[{x:470,y:670,w:60,h:5},{x:470,y:725,w:60,h:5},{x:470,y:670,w:5,h:60},{x:525,y:670,w:5,h:60}];
 for(let i=0;i<60;i++)h.walkPickupActor(actor,goal,85,1/30,13);const planted={x:actor.x,y:actor.y,phase:actor.walkPhase};for(let i=0;i<60;i++)h.walkPickupActor(actor,goal,85,1/30,13);assert.equal(actor.x,planted.x);assert.equal(actor.y,planted.y);assert.equal(actor.walkPhase,planted.phase,'an enclosed actor holds its gait instead of vibrating at a wall');
}
console.log('Forward targets, solid-body pickup/departure and blocked escort detours pass at 30/60 fps and delayed frames');
