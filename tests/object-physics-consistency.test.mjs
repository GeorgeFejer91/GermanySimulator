import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("../game.js",import.meta.url),"utf8");
function functionSource(name){
 const start=source.indexOf(`function ${name}(`);assert.ok(start>=0,`${name} must exist`);
 const open=source.indexOf("{",start);let depth=1,quote=null,escape=false;
 for(let i=open+1;i<source.length;i++){
  const ch=source[i];if(quote){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch===quote)quote=null;continue}
  if(ch==='"'||ch==="'"||ch==="`"){quote=ch;continue}
  if(ch==="{")depth++;else if(ch==="}"&&!--depth)return source.slice(start,i+1);
 }
 throw new Error(`Unclosed function ${name}`);
}
const names=["normObjectRadius","propRadius","staticBlocked","trainCarDistance","trainAt","groundContactBlocks","signedRectDistance","vehicleBodyDistance","orientedBodySeparation","vehicleMotionBlocked","vehicleOnRoad","dynamicBlocker","groundStaticMotionBlocked","pedestrianRouteContains","responderBlocked","moveGroundResponder","blocked","blockingPedestrian","movePlayerGround","pedestrianLane","pedestrianRouteStalled","initializePedestrianRoutes"];
function harness(){
 const context={WORLD:{w:10960,h:5360},CITY:{w:9840,h:4240},RAIL_GUTTER:560,SIDEWALK_WIDTH:72,TREE_RADIUS:38,TRAFFIC_CAR_RADIUS:42,TRAIN_CAR_HALF_LENGTH:122,TRAIN_CAR_HALF_WIDTH:46,player:{x:8000,y:5000,r:16},goerlitzerPark:{x:10000,y:4000,w:100,h:100},wirtschaftswunderSite:{x:10000,y:4200,collisionRadius:142},kiesingerMemorial:{x:10000,y:4500},buildings:[],props:[],normObjects:[],trees:[],trains:[],trafficCars:[],policeVehicles:[],police:[],npcs:[],horizontalRoads:[],verticalRoads:[],sidewalkSegments:[],verticalSidewalkSegments:[],crossings:[],stations:[],stationElevation:()=>0,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by)};
 vm.createContext(context);vm.runInContext(names.map(functionSource).join("\n"),context);return context;
}

// Loaded n-Wagen depth 4.82 and fallback depth 4.72 use the same solid envelope.
assert.match(source,/TRAIN_CAR_HALF_LENGTH=122/,"train bodies must cover the rendered 120.5-unit coach half-length");
{
 const h=harness(),coach={x:300,y:300,angle:0};h.trains=[{cars:[coach]}];
 assert.equal(h.trainCarDistance(425,300,coach),3,"coach nose clearance uses its full fitted length");
 assert.ok(h.trainAt(425,300,13),"a person cannot enter the visible end of a coach");
 assert.ok(2*(780+h.TRAIN_CAR_HALF_LENGTH)<1820,"the seven-coach body fits the enforced center gap");
}

assert.match(source,/const VEHICLE_RENDER_SCALE=1\.4;/,"canonical car rendering and physics share the larger proportion");
assert.match(source,/Germany3DBridge=.*VEHICLE_RENDER_SCALE/,"renderer consumes canonical vehicle scale");

// Ordinary benches reserve their loaded/fallback ground footprint; small side benches use explicit bounds.
{
 const h=harness(),bench={x:300,y:300,asset:"bench",w:90,h:55};h.props=[bench];assert.equal(h.propRadius(bench),52);
 const walker={x:337,y:300,crowd:true};h.npcs=[walker];assert.equal(h.responderBlocked(walker.x,walker.y,13,walker,walker.x,walker.y),true,"a citizen cannot stand inside the visible end of an ordinary bench");
 h.npcs=[];const car={x:bench.x-130,y:bench.y,angle:0};assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y),true,"a car's full nose must stop before the bench's visible ground footprint");assert.equal(h.propRadius({...bench,collisionRadius:35,fallbackOnly:true}),35,"small canonical side benches preserve their measured explicit footprint");
}
for(const [asset,w,height] of [["bicyclerack",85,45],["litterbin",30,48],["bollard",18,44],["liege-blau",115,72],["liege-rot",115,72],["picknicktisch",115,55],["schubkarre",85,42],["wertstoffcontainer",112,64],["zwerg-giesskanne",47,65],["zwerg-schild",47,65],["pfandautomat",54,70],["kaffee",48,66],["faxkiosk",54,86],["bierkasten",42,35]]){
 const h=harness(),prop={asset,x:300,y:300,w,h:height};h.props=[prop];const groundWidth=Math.max(26,w),groundDepth=Math.max(21,groundWidth*.55);
 for(const sx of [-1,1])for(const sy of [-1,1]){const actor={x:prop.x+sx*(groundWidth/2+12.5),y:prop.y+sy*groundDepth/2};h.npcs=[actor];assert.equal(h.responderBlocked(actor.x,actor.y,13,actor,actor.x,actor.y),true,`${asset} must stop an actor touching a real procedural ground corner`)}
 assert.equal(h.propRadius({...prop,h:height*10}),h.propRadius(prop),"vertical art height cannot inflate the ground footprint");
}
for(const [asset,x,z] of [["fahrrad",40.25,2.25],["db",33.75,2.25],["faxbillboard",86.5,2.5],["dumpster-fire",83.5,48.75],["gartenzwerg",16.25,16.25]]){
 const h=harness(),prop={asset,x:300,y:300,w:100,h:100},actor={x:300+x,y:300+z};h.props=[prop];h.npcs=[actor];assert.ok(h.propRadius(prop)>=Math.hypot(x,z),`${asset} collider encloses its rendered rigid ground footprint`);assert.equal(h.responderBlocked(actor.x,actor.y,13,actor,actor.x,actor.y),true);
}
for(const [type,radius] of [["hedge",37],["chairs",31],["bin",26]]){
 const h=harness(),object={x:300,y:300,type};h.normObjects=[object];assert.equal(h.normObjectRadius(object),radius);const walker={x:340,y:300};h.npcs=[walker];assert.equal(h.responderBlocked(walker.x,walker.y,13,walker,walker.x,walker.y),type!=="bin","hedges and chair groups reserve their visible rigid ground footprint");assert.equal(h.staticBlocked(340,300,13),type!=="bin");h.npcs=[];const car={x:300-94-radius+1,y:300,angle:0};assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y),true,"vehicles use the same typed norm-object clearance");
}

// A train's hard advance limit reserves the enlarged car's additional body radius.
{
 const h=harness();Object.assign(h,{railLoops:[{length:10000}],TRAIN_PLAYER_LOOKAHEAD:2100,TRAIN_PLAYER_STOP_GAP:970,TRAIN_MIN_GAP:1820,performance:{now:()=>0},document:{getElementById:()=>({hidden:true})},railHoldTimer:0,playerHoldingLast:false,railLawNextAt:99999,updateTrainAnnouncement:()=>{},nearestRailLocation:(_loop,x,y)=>({progress:x,distance:Math.abs(y-300)}),wrapRailProgress:(x,length)=>(x%length+length)%length,syncTrainTransform:()=>{}});
 h.trains=[{progress:1000,loopIndex:0,dir:1,speed:20000,acceleration:100,cruiseSpeed:20000,baseSpeed:20000,collisionCooldown:0,bouncePause:0,pause:0,chaos:100,bump:0}];h.policeVehicles=[{x:2200,y:300,angle:0}];vm.runInContext(functionSource("updateBorderTrains"),h);h.updateBorderTrains(.025);
 assert.ok(h.trains[0].progress<=1139+1e-6,"a high-speed train cannot consume the enlarged car's extra forward clearance");
 const coach={x:h.trains[0].progress+780,y:300,angle:0,halfLength:122,halfWidth:46},car={...h.policeVehicles[0],halfLength:94,halfWidth:51};assert.ok(h.orientedBodySeparation(coach,car)>=0,"the leading coach cannot overlap the large car's full footprint");
}

// Full car geometry includes bonnet, boot and wheels, at every heading.
for(const angle of [0,Math.PI/2,Math.PI/4]){
 const h=harness(),car={x:300,y:300,angle,vortexPhase:"road"};h.trafficCars=[car];
 const nose={x:300+Math.cos(angle)*105,y:300+Math.sin(angle)*105,crowd:true};h.npcs=[nose];
 assert.equal(h.responderBlocked(nose.x,nose.y,13,nose,nose.x,nose.y),true,"visible vehicle front/rear must stay solid beyond the obsolete center-circle radius");
 const side={x:300-Math.sin(angle)*57,y:300+Math.cos(angle)*57,crowd:true};h.npcs=[side];
 assert.equal(h.responderBlocked(side.x,side.y,13,side,side.x,side.y),true,"the full car width including its wheels is solid");
 assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y),true,"car placement/respawn cannot enclose a citizen");
}
{
 const h=harness(),car={x:300,y:300,angle:0,vortexPhase:"road"};h.policeVehicles=[car];h.npcs=[{x:401,y:363}];
 car.angle=.03;assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y,0),true,"rotation cannot swing a bonnet through a person");car.angle=0;assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y),false);
 h.npcs=[];h.buildings=[{x:350,y:355,w:40,h:40}];car.angle=.4;assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y,0),true,"rotation cannot swing a bonnet through a building corner");
}

// Actual civilian lanes keep the enlarged cars apart and clear of both kerbs.
{
 const h=harness();h.BORDER_Y=1680;h.offsetWorldPoint=item=>({...item,x:item.x+560,y:item.y+560});
 const between=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)+start.length));
 vm.runInContext(`${between("const horizontalRoads=","const SIDEWALK_WIDTH=")}\n${between("const VEHICLE_RENDER_SCALE=","const borderGates=")}\nglobalThis.spawnedTraffic=trafficCars;globalThis.drivingRoads=horizontalRoads;`,h);
 for(const car of h.spawnedTraffic){assert.ok(h.vehicleOnRoad(car.x,car.y,car.angle),"every actual initial car's enlarged body stays on its road");assert.equal(h.vehicleMotionBlocked(car.x,car.y,car,car.x,car.y),false,"actual traffic initialization leaves complete bodies disjoint")}
 for(const road of h.drivingRoads){const a={x:road.x+300,y:road.y+road.h*.25,angle:0,halfLength:94,halfWidth:51},b={...a,y:road.y+road.h*.75,angle:Math.PI};assert.ok(h.orientedBodySeparation(a,b)>0,"opposite civilian lanes can pass side by side on every shipped horizontal road")}
}

// Player overlap recovery obeys the same monotonic contacts as other actors.
{
 const h=harness();h.player={x:140,y:100,r:16};h.buildings=[{x:150,y:0,w:100,h:200}];h.movePlayerGround(-3.65,0);assert.ok(h.player.x<140,"a partially overlapped player can move outward in ordinary walking steps");const x=h.player.x;h.movePlayerGround(3.65,0);assert.equal(h.player.x,x,"the player cannot increase overlap");
 h.buildings=[];h.player={x:140,y:100,r:16};h.npcs=[{x:160,y:100,crowd:true}];h.movePlayerGround(-3.65,0);assert.ok(h.player.x<140,"the player can escape an invalid crowd contact safely");
}

// Verify every accepted tangent segment, not only a move's final point.
{
 const h=harness(),walker={x:100,y:100,avoid:1};h.npcs=[walker];h.props=[{x:102.275,y:122.9,w:26,h:26}];
 const check=h.responderBlocked;h.responderBlocked=(x,y,r,self,fromX,fromY)=>{const blocked=check(x,y,r,self,fromX,fromY);if(!blocked)for(let i=0;i<=20;i++){const t=i/20;assert.ok(h.dist(fromX+(x-fromX)*t,fromY+(y-fromY)*t,102.275,122.9)>=23-.01,"accepted motion cannot cut through a tangent prop beyond the .01-unit contact tolerance")}return blocked};
 h.moveGroundResponder(walker,4.55,0,13);
}

// No-fit opposing traffic reverses after low net progress instead of jittering forever.
for(const dt of [1/60,1/30,.1]){
 const h=harness(),bounds={x:100,y:100,w:400,h:28},a={x:180,y:114,vx:14,vy:0,crowd:true,routeBounds:bounds,avoid:1},b={x:240,y:114,vx:-14,vy:0,crowd:true,routeBounds:bounds,avoid:1};h.npcs=[a,b];let reversals=0;
 for(let frame=0;frame<8/dt;frame++)for(const n of [a,b]){const beforeX=n.x,beforeY=n.y;h.moveGroundResponder(n,n.vx*dt,0,13);if(h.pedestrianRouteStalled(n,beforeX,beforeY,dt)){n.vx*=-1;reversals++}}
 assert.ok(reversals>0,"tiny temporary advances must not reset the route's net-progress stall detection");assert.ok(h.dist(a.x,a.y,b.x,b.y)>=26-1e-6);
}

// All pedestrian pairings are physical, including the formerly pass-through crowd.
for(const crowd of [false,true]){
 const h=harness(),walker={x:100,y:100,crowd,avoid:1};h.npcs.push(walker,{x:127,y:100,crowd:true});
 assert.equal(h.responderBlocked(102,100,13,walker),true,"crowd and named citizens must block one another");
 h.player.x=128;h.player.y=100;h.npcs.length=1;
 assert.equal(h.responderBlocked(102,100,13,walker),true,"citizens cannot move through the player");
 assert.equal(h.blockingPedestrian(100,100),walker,"every visible pedestrian must block the player");
}

// Swept steps prevent a large requested move from jumping a thin wall or actor.
for(const obstacle of ["wall","prop","person","car","train"]){
 const h=harness(),walker={x:100,y:100,avoid:1,routeBounds:{x:80,y:70,w:500,h:60}};h.npcs.push(walker);
 if(obstacle==="wall")h.buildings.push({x:150,y:10,w:2,h:250});
 if(obstacle==="prop")h.props.push({x:150,y:100,w:42,h:64});
 if(obstacle==="person")h.npcs.push({x:150,y:100,crowd:true});
 if(obstacle==="car")h.trafficCars.push({x:215,y:100,vortexPhase:"road"});
 if(obstacle==="train")h.trains.push({cars:[{x:260,y:100,angle:0}]});
 h.moveGroundResponder(walker,100,0,13);
 assert.ok(walker.x<150,`${obstacle} cannot be tunneled through by a long step`);
 assert.equal(h.responderBlocked(walker.x,walker.y,13,walker,walker.x,walker.y),false,`${obstacle} leaves no final penetration`);
}

// Existing overlap can only decrease; no unconditional escape through a wall.
{
 const h=harness(),walker={x:140,y:100,avoid:1};h.npcs.push(walker);h.buildings.push({x:150,y:0,w:100,h:200});
 assert.equal(h.responderBlocked(142,100,13,walker),true,"recovery cannot increase static overlap");
 assert.equal(h.responderBlocked(138,100,13,walker),false,"an already intersecting actor can escape outward gradually");
 h.moveGroundResponder(walker,2,0,13);assert.ok(walker.x<140,"a blocked escape must back away safely");
 const trapped={x:100,y:100,avoid:1};h.npcs=[trapped];h.buildings=[{x:0,y:0,w:99,h:200},{x:101,y:0,w:200,h:200}];
 assert.equal(h.moveGroundResponder(trapped,1,0,13),false,"a surrounded actor must stop instead of being pushed deeper");
}

// Opposing walkers move beside each other while their complete circles stay on pavement.
for(const vertical of [false,true]){
 const h=harness(),bounds=vertical?{x:100,y:100,w:72,h:700}:{x:100,y:100,w:700,h:72},a={x:vertical?136:220,y:vertical?220:136,crowd:true,avoid:1,routeBounds:bounds},b={x:vertical?136:500,y:vertical?500:136,crowd:true,avoid:1,routeBounds:bounds};h.npcs=[a,b];
 let closest=Infinity;
 for(let frame=0;frame<1600;frame++){
  h.moveGroundResponder(a,vertical?0:.224,vertical?.224:0,13);h.moveGroundResponder(b,vertical?0:-.224,vertical?-.224:0,13);
  closest=Math.min(closest,h.dist(a.x,a.y,b.x,b.y));
  assert.ok(h.pedestrianRouteContains(a,a.x,a.y)&&h.pedestrianRouteContains(b,b.x,b.y),"sidesteps must preserve body clearance at both kerbs");
 }
 assert.ok(closest>=26-1e-6,"people must never interpenetrate while passing");
 assert.ok(vertical?a.y>b.y:a.x>b.x,"opposing walkers must make progress and pass each other");
}

// A player blocking the middle of a sidewalk must not trap a moving citizen.
{
 const h=harness(),walker={x:180,y:136,crowd:true,avoid:1,routeBounds:{x:100,y:100,w:700,h:72}};h.npcs=[walker];h.player.x=260;h.player.y=120;
 for(let frame=0;frame<700;frame++){h.moveGroundResponder(walker,.28,0,13);assert.ok(h.dist(walker.x,walker.y,h.player.x,h.player.y)>=29-1e-6);assert.ok(h.pedestrianRouteContains(walker,walker.x,walker.y))}
 assert.ok(walker.x>h.player.x+29,"a citizen can pass beside a stationary player without leaving the sidewalk");
}

// Initialization uses the actual city geometry, including its finite road ends.
{
 const h=harness(),layout=source.slice(source.indexOf("const horizontalRoads="),source.indexOf("const schreber="));h.offsetWorldPoint=item=>({...item,x:item.x+560,y:item.y+560});
 vm.runInContext(`${layout}\nglobalThis.horizontalRoads=horizontalRoads;globalThis.verticalRoads=verticalRoads;`,h);
 h.sidewalkSegments=[];for(let start=573,i=0;i<=h.verticalRoads.length;i++){const road=h.verticalRoads[i],end=road?road.x-72:10371;if(end-start>180)h.sidewalkSegments.push({min:start,max:end});if(road)start=road.x+road.w+72}
 h.verticalSidewalkSegments=[];for(let start=573,i=0;i<=h.horizontalRoads.length;i++){const road=h.horizontalRoads[i],end=road?road.y-72:4787;if(end-start>180)h.verticalSidewalkSegments.push({min:start,max:end});if(road)start=road.y+road.h+72}
 h.npcs=[{x:5100+560,y:720+560,vx:13,vy:0},{x:4200+560,y:3450+560,vx:0,vy:10}];h.initializePedestrianRoutes();
 for(const n of h.npcs){assert.ok(h.pedestrianRouteContains(n,n.x,n.y));assert.equal(h.staticBlocked(n.x,n.y,13),false)}
 assert.ok(h.npcs[0].y>=1380-72+13,"a named citizen formerly above the pavement must start inside it");
 assert.ok(h.npcs[1].x>=4960-72+13,"a vertical walker must start inside the vertical pavement");
}

// Exercise every actual ordinary-city spawn and its route against shipped footprints.
{
 const h=harness();Object.assign(h,{window:{},matchMedia:()=>({matches:true}),location:{search:""},URLSearchParams,offsetWorldPoint:item=>({...item,x:item.x+560,y:item.y+560}),npcSpriteAtlases:{},npcLines:[""],crowdArchetypeOrder:[{id:"towel-man",label:"TOWEL",sprite:"towelMan"}]});
 vm.runInContext(readFileSync(new URL("../goerlitzer-park.js",import.meta.url),"utf8"),h);h.goerlitzerPark=h.window.GoerlitzerPark;
 const between=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)+start.length)),line=prefix=>source.split(/\r?\n/).find(text=>text.startsWith(prefix));
 vm.runInContext(`${between("const horizontalRoads=","const OFFENSE_TIMING=")}\n${line("const BORDER_Y=")}\n${line("const borderGates=")}\n${line("const wirtschaftswunderSite=")}\n${line("const kiesingerMemorial=")}\n${between("const STATION_RISE=","const TRAIN_CAR_OFFSETS=")}\n${between("const desktopBillboards=","const stableSpriteRoot=")}\n${between("const buildings=","const missions=")}\n${between("const WURST_TYPES=","const state=")}\n${between("const npcs=","window.Germany3DBridge=")}\ninitializePedestrianRoutes();globalThis.city={npcs,buildings,props,trees,aliceDumpster};`,h);
 const citizens=h.city.npcs.filter(n=>!n.special);assert.ok(citizens.length>60,"check the whole shipped crowd rather than two synthetic actors");
 for(const n of citizens){assert.ok(h.pedestrianRouteContains(n,n.x,n.y),`${n.name} must start with full-body pavement clearance`);assert.equal(h.staticBlocked(n.x,n.y,13),false,`${n.name} spawn must clear every static footprint`);assert.equal(h.responderBlocked(n.x,n.y,13,n,n.x,n.y),false,`${n.name} spawn cannot overlap another solid body`)}
 for(let frame=0;frame<120;frame++)for(const n of citizens){
  const lane=h.pedestrianLane(n),correction=h.clamp(lane-(n.vx?n.y:n.x),-.45,.45),dx=(n.vx||0)*.025+(n.vx?0:correction),dy=(n.vy||0)*.025+(n.vx?correction:0);
  if(!h.moveGroundResponder(n,dx,dy,13)||(n.vx?(n.x<=n.min+1||n.x>=n.max-1):(n.y<=n.min+1||n.y>=n.max-1))){if(n.vx)n.vx*=-1;else n.vy*=-1}
  assert.ok(h.pedestrianRouteContains(n,n.x,n.y),`${n.name} must remain on full-body legal pavement`);assert.equal(h.staticBlocked(n.x,n.y,13),false,`${n.name} cannot enter scenery`);
 }
 const landmark=h.city.buildings.find(b=>b.id==="bundestag");
 for(const prop of h.city.props)if(!prop.decorative)assert.ok(h.signedRectDistance(prop.x,prop.y,landmark)>=h.propRadius(prop),`expanded Bundestag must not enclose ${prop.asset||prop.satireId} at ${prop.x}/${prop.y}`);
 for(const tree of h.city.trees)assert.ok(h.signedRectDistance(tree.x,tree.y,landmark)>=38,"expanded Bundestag must not enclose a tree");
 const alice=h.city.npcs.find(n=>n.special==="alice"),site=h.city.aliceDumpster,beforeX=alice.x,beforeY=alice.y;assert.equal(alice.x,site.x+site.orbitRadius,"Alice's already offset site must not receive a second city offset");assert.equal(alice.y,site.y);
 Object.assign(h,{state:{region:"berlin"},ALICE_WALK_SPEED:78,FEATURED_GAIT_CYCLE_DISTANCE:41.6,npcSpriteAtlases:{alice:{tourist:null}},advanceSpriteGait:()=>{}});vm.runInContext(functionSource("updateAlice"),h);h.updateAlice(alice,1/60);assert.ok(h.dist(alice.x,alice.y,beforeX,beforeY)<=78/60+1e-6,"Alice's first frame must remain bounded by walking speed rather than teleporting through the city");
}

console.log("Physical contacts, swept solids, safe overlap recovery, full-body pavement and opposing passing behavior OK");
