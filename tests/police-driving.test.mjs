import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../game.js",import.meta.url),"utf8");
function functionSource(name){const start=source.indexOf(`function ${name}(`),open=source.indexOf("{",start);assert.ok(start>=0);let depth=1,quote=null,escape=false;for(let i=open+1;i<source.length;i++){const ch=source[i];if(quote){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch===quote)quote=null;continue}if(ch==='"'||ch==="'"||ch==="`"){quote=ch;continue}if(ch==="{")depth++;else if(ch==="}"&&!--depth)return source.slice(start,i+1)}throw new Error(name)}
function harness(){
 const h={WORLD:{w:10960,h:5360},roads:[],horizontalRoads:[],vehicleApproaches:[],TRAFFIC_MIN_X:-2200,TRAFFIC_MAX_X:13160,vehicleCameraVisible:()=>false,player:{x:8000,y:5000,r:16},goerlitzerPark:{x:10000,y:4000,w:100,h:100},wirtschaftswunderSite:{x:10000,y:4200,collisionRadius:142},kiesingerMemorial:{x:10000,y:4500},buildings:[],props:[],normObjects:[],trees:[],trains:[],trafficCars:[],policeVehicles:[],police:[],npcs:[],TREE_RADIUS:38,TRAIN_CAR_HALF_LENGTH:122,TRAIN_CAR_HALF_WIDTH:46,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by)};
 vm.createContext(h);vm.runInContext(["normObjectRadius","propRadius","groundContactBlocks","vehicleBodyDistance","orientedBodySeparation","vehicleMotionBlocked","vehicleOnRoad","nearestDrivingRoad","policeDrivingTarget","driveGroundVehicle","policeDrivingClearance","vehicleFullyOffMap","retirePoliceVehicle","finishPoliceExitRecovery"].map(functionSource).join("\n"),h);return h;
}
{
 const h=harness(),car={x:300,y:300,angle:0,driveSpeed:0,steeringAngle:0};h.policeVehicles=[car];h.driveGroundVehicle(car,0,.62,.2);
 assert.deepEqual([car.x,car.y,car.angle],[300,300,0],"standing police cars can steer their wheels but cannot rotate or strafe");
 h.driveGroundVehicle(car,200,0,.1);assert.equal(car.driveSpeed,9,"forward acceleration is bounded at 90 world-units/s²");
 h.driveGroundVehicle(car,0,0,.025);assert.equal(car.driveSpeed,3,"braking is bounded at 240 world-units/s² before contact");
}
for(const sign of [1,-1]){
 const h=harness(),car={x:500,y:500,angle:0,driveSpeed:sign*80,steeringAngle:0};h.policeVehicles=[car];
 for(let i=0;i<60;i++)h.driveGroundVehicle(car,sign*80,.5,1/60);
 assert.ok(sign>0?car.x>500:car.x<500,"reverse and forward travel follow signed velocity");assert.ok(sign>0?car.angle>0:car.angle<0,"reverse changes heading coherently with the same wheel steering");assert.ok(Math.abs(car.y-500)>5,"a steered car follows a curve rather than rotating at a fixed point");
 assert.ok(Math.abs(car.steeringAngle)<=.62,"wheel steering is bounded");
}
for(const kind of ["wall","person","car"]){
 const h=harness(),car={x:200,y:250,angle:0,driveSpeed:90,steeringAngle:0};h.policeVehicles=[car];
 if(kind==="wall")h.buildings=[{x:300,y:0,w:20,h:500}];if(kind==="person")h.npcs=[{x:310,y:250}];if(kind==="car")h.trafficCars=[{x:400,y:250,angle:0,vortexPhase:"road"}];
 for(let i=0;i<50;i++)h.driveGroundVehicle(car,90,0,.025);
 assert.equal(car.y,250,"a blocked police car cannot use the pedestrian sideways escape");assert.equal(car.angle,0);assert.ok(car.x<240,`${kind} must stop the full body`);assert.equal(car.driveSpeed,0,"contact must stop advance before interpenetration");
 const stoppedX=car.x;h.driveGroundVehicle(car,-55,0,.1);assert.ok(car.x<stoppedX,"a stopped car can safely back away through its rear clearance");
}
{
 const h=harness(),car={x:300,y:300,angle:0,driveSpeed:60,steeringAngle:.2},prop={x:396.1241527272462,y:239.2269210300996,w:26,h:26};h.policeVehicles=[car];h.props=[prop];
 const coarseTurn=Math.tan(.2)/105,end={x:300+Math.cos(coarseTurn/2),y:300+Math.sin(coarseTurn/2),angle:coarseTurn},middle={x:(300+end.x)/2,y:(300+end.y)/2,angle:coarseTurn/2};assert.ok(h.vehicleBodyDistance(prop.x,prop.y,car)>10&&h.vehicleBodyDistance(prop.x,prop.y,end)>10,"the curved tangent begins and ends fully clear");assert.ok(h.vehicleBodyDistance(prop.x,prop.y,middle)<10-.01,"the coarse one-unit curve would penetrate between those clear endpoints");
 const check=h.vehicleMotionBlocked;h.vehicleMotionBlocked=(x,y,item,fromX,fromY,fromAngle)=>{const blocked=check(x,y,item,fromX,fromY,fromAngle);if(!blocked)for(let i=0;i<=100;i++){const t=i/100,body={x:fromX+(x-fromX)*t,y:fromY+(y-fromY)*t,angle:fromAngle+(item.angle-fromAngle)*t};assert.ok(h.vehicleBodyDistance(prop.x,prop.y,body)>=10-.01,"accepted curved motion cannot graze through a small solid prop between endpoint checks")}return blocked};
 h.driveGroundVehicle(car,60,.2,1/60);assert.equal(car.driveSpeed,0,"a curved tangent obstacle brakes the car before its body cuts through");
}
{
 const h=harness(),car={x:300,y:300,angle:0,driveSpeed:80,steeringAngle:0};h.policeVehicles=[car];h.buildings=[{x:350,y:355,w:40,h:40}];
 for(let i=0;i<120;i++){h.driveGroundVehicle(car,80,.62,.025);assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y),false,"curved swept body motion cannot rotate a corner through a building")}
}
{
 const h=harness();h.roads=[{x:100,y:300,w:1000,h:260}];h.horizontalRoads=h.roads;h.vehicleApproaches=[{x:-2400,y:300,w:2500,h:260},{x:1100,y:300,w:12400,h:260}];Object.assign(h,{state:{wanted:3},player:{x:900,y:430,r:16,vx:120,vy:0},groundResponsePoint:()=>({x:300,y:430,a:0}),spawnPointVisible:()=>false,responderBlocked:()=>false,syncPoliceResponse:()=>{},policeHelicopters:[],onGardenGrass:()=>false,performance:{now:()=>0},playPolicePassby:()=>{}});
 vm.runInContext(["responseSpawn","updatePoliceResponse"].map(functionSource).join("\n"),h);const car=h.responseSpawn("car",0);assert.ok(car);h.policeVehicles.push(car);const initialX=car.x;
 for(let i=0;i<60;i++)h.updatePoliceResponse(.025);
 for(const key of ["x","y","angle","driveSpeed","steeringAngle","orbit"])assert.ok(Number.isFinite(car[key]),`actual spawn→pursuit must initialize finite ${key}`);assert.ok(car.x>initialX+10,"an actually spawned police car must accelerate and enter from beyond the map");assert.ok(h.vehicleOnRoad(car.x,car.y,car.angle));
}
{
 const h=harness();h.roads=[{x:100,y:300,w:1000,h:260},{x:540,y:100,w:260,h:1000}];
 const junctionCar={x:632.35,y:304.14,angle:.035};for(const along of [-94,0,94])for(const across of [-51,0,51]){const x=junctionCar.x+Math.cos(junctionCar.angle)*along-Math.sin(junctionCar.angle)*across,y=junctionCar.y+Math.sin(junctionCar.angle)*along+Math.cos(junctionCar.angle)*across;assert.ok(h.roads.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h),"nine support samples alone would wrongly accept this concave junction")}
 assert.equal(h.vehicleOnRoad(junctionCar.x,junctionCar.y,junctionCar.angle),false,"a road junction's uncovered concave corner cannot fit between body support samples");
 assert.equal(h.vehicleOnRoad(636,304.14,.035),true,"the same car is legal after clearing that road edge");
 const car={x:400,y:430,angle:0,driveSpeed:0,steeringAngle:0,roadBound:true,roadIndex:0};h.policeVehicles=[car];
 const projected=h.nearestDrivingRoad(700,1300);assert.equal(projected.y,997,"off-road pursuit points project onto a road with full car clearance");
 for(let i=0;i<600;i++){const target=h.policeDrivingTarget(car,670,900),turn=Math.atan2(Math.sin(Math.atan2(target.y-car.y,target.x-car.x)-car.angle),Math.cos(Math.atan2(target.y-car.y,target.x-car.x)-car.angle));h.driveGroundVehicle(car,Math.min(90,h.dist(car.x,car.y,target.x,target.y)*1.2),h.clamp(turn*1.6,-.62,.62),.025);assert.ok(h.vehicleOnRoad(car.x,car.y,car.angle),"the complete car stays inside the road union throughout a junction turn")}
 assert.ok(h.dist(car.x,car.y,670,900)<80,"intersections remain traversable with steering-based movement");
}
// Shipped narrow roads allow one aligned car; opposing cars must hold their solid clearance.
{
 const h=harness();h.roads=[{x:540,y:100,w:180,h:1000}];const projected=h.nearestDrivingRoad(545,300),car={x:projected.x,y:projected.y,angle:Math.PI/2};assert.equal(car.x,600);assert.ok(h.vehicleOnRoad(car.x,car.y,car.angle),"a projected narrow-road target clears the full aligned body");
 const a={x:630,y:300,angle:Math.PI/2,driveSpeed:80,steeringAngle:0,roadBound:true},b={x:630,y:650,angle:-Math.PI/2,driveSpeed:80,steeringAngle:0,roadBound:true};h.policeVehicles=[a,b];
 for(let i=0;i<100;i++){h.driveGroundVehicle(a,80,0,.025);h.driveGroundVehicle(b,80,0,.025);assert.ok(h.vehicleOnRoad(a.x,a.y,a.angle)&&h.vehicleOnRoad(b.x,b.y,b.angle));assert.ok(h.orientedBodySeparation({...a,halfLength:94,halfWidth:51},{...b,halfLength:94,halfWidth:51})>=-1e-6)}
 assert.equal(a.x,630);assert.equal(b.x,630);assert.equal(a.driveSpeed,0);assert.equal(b.driveSpeed,0,"opposing narrow-road cars stop instead of strafing through each other");
}
for(const [horizontalWidth,verticalWidth] of [[220,180],[240,220]]){
 const h=harness();h.roads=[{x:100,y:300,w:1000,h:horizontalWidth},{x:670-verticalWidth/2,y:100,w:verticalWidth,h:1000}];
 const car={x:400,y:300+horizontalWidth/2,angle:0,driveSpeed:0,steeringAngle:0,roadBound:true,roadIndex:0};h.policeVehicles=[car];
 for(let i=0;i<700;i++){const target=h.policeDrivingTarget(car,670,900),turn=Math.atan2(Math.sin(Math.atan2(target.y-car.y,target.x-car.x)-car.angle),Math.cos(Math.atan2(target.y-car.y,target.x-car.x)-car.angle));h.driveGroundVehicle(car,Math.min(90,h.dist(car.x,car.y,target.x,target.y)*1.2),h.clamp(turn*1.6,-.62,.62),.025);assert.ok(h.vehicleOnRoad(car.x,car.y,car.angle))}
 assert.ok(h.dist(car.x,car.y,670,900)<80,`the enlarged car can turn between ${horizontalWidth}/${verticalWidth}-wide shipped roads`);
}
assert.match(source,/reversing\?-55:forwardSpeed/,"blocked police cars must use a bounded reverse speed");assert.match(source,/car\.reverseTime=1\.2/,"reverse recovery must end after bounded time");
assert.doesNotMatch(source,/moveGroundResponder\(car,Math\.cos\(car\.angle\)/,"car pursuit must not reuse a walking sidestep controller");
console.log("Police bicycle steering, acceleration/braking, signed reverse, full-body contacts, road projection and junction traversal OK");
