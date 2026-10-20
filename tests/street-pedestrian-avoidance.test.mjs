import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as S from '../street-character-sprites.js';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import {motionObserverSource,pedestrianAvoidanceSource} from './street-simulation-fixture-source.mjs';

const game=readFileSync('game.js','utf8').replaceAll('\r\n','\n'),world=readFileSync('world3d.js','utf8');
vm.runInThisContext(readFileSync('tourist-animation.js','utf8'));
const person=JSON.parse(readFileSync('assets/characters/street/manifest.json','utf8')).characters['crowd-irmgard-aktenordner'];
const legacy=JSON.parse(readFileSync('assets/tourists/towelWoman/manifest.json','utf8'));legacy.movementOnly=true;
function between(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return source.slice(a,b)}
const block=(a,b)=>between(game,a,b);
const oneLine=name=>{const match=game.match(new RegExp('^function '+name+'\\([^\\n]+','m'));assert(match,name);return match[0]};
const lane=block('function pedestrianLane(','function createPedestrianMover(');
const stall=block('function pedestrianRouteStalled(','function streetWisdomCanMove(');
const movement=block('function responderBlocked(','function blocked(');
const ordinary=block('\n for(const n of npcs){\n   if(n.jwdRole)','\n state.ruleTimer');
const registered=between(world,'  function registeredStreetPaint(','  function npcSpriteRequired(');
const ownsExpression=world.match(/^\s*ownsMovement:actor=>(.+),$/m)?.[1];assert(ownsExpression,'Actual ownership predicate');

// Reduced saved failure geometry: stationary player29.01 ahead of a13-radius pedestrian,
// source speed13 on an actual1286x72 sidewalk; no report/output-path dependency.
const ROOT=[9084.192233333328,2546.8],BOUNDS={x:8202,y:2488,w:1286,h:72};
const rootWorld=n=>[n.x*.02,0,n.y*.02];

// Same dimension-only TextureLoader admission pattern as street-atlas-motion.test.mjs.
// It exercises production presentation ownership, not native image/GPU loading.
async function presentation(actor,kind){
 if(kind==='none')return null;
 S.registerStreetCharacterManifest({schemaVersion:1,characters:{'crowd-irmgard-aktenordner':structuredClone(person)}});
 const jobs=[],requests=[],T={...THREE,TextureLoader:class{load(url,ok){requests.push(ok)}}};
 const queue=(position,radius,task,owner)=>{const job={task,owner};jobs.push(job);return job};
 const view=S.createStreetCharacterSprite(T,actor,new THREE.Group(),queue,new THREE.PerspectiveCamera());
 const decode=(w,h)=>{const ok=requests.shift();assert(ok);ok(new THREE.Texture({width:w,height:h}))};
 let pending=jobs.at(-1).task();await Promise.resolve();decode(person.standing.width,person.standing.height);assert.equal(await pending,true);
 if(kind==='admitted'){
  pending=view.prepareMotion().task();await Promise.resolve();const variant=person.variants[view.inspect().variant];decode(variant.width,variant.height);assert.equal(await pending,true);view.sync();
  const tick=()=>S.tickStreetSimulation(actor,1/60,{rootWorld:rootWorld(actor),paused:false});
  const finish=()=>{for(let i=0;S.inspectStreetSimulation(actor).atlasMotion.plan;i++){assert(i<100);tick()}};
  S.requestStreetSimulationMove(actor,1,0);finish();tick();finish();
  assert.equal(S.inspectStreetSimulation(actor).atlasMotion.settled,true);
  assert.equal(S.inspectStreetSimulation(actor).atlasMotion.facing,'right');
 }
 return view;
}

async function fixture({avoid=1,kind='admitted',raw=false,boxed=false,noExit=false,npcBlocker=false,staticBuilding=false,staticCorner=false,sealedBody=false}={}){
 const actor={id:'irmgard-navigation-test',voiceId:'crowd-irmgard-aktenordner',spriteKind:'towelWoman',
  x:ROOT[0],y:ROOT[1],vx:13,vy:0,crowd:true,pause:0,avoid,min:BOUNDS.x+13,max:BOUNDS.x+BOUNDS.w-13,
  routeBounds:noExit?{x:BOUNDS.x,y:ROOT[1]-13,w:BOUNDS.w,h:26}:{...BOUNDS},spriteRow:0,spriteFrame:0};
 if(staticCorner){actor.vx=-14;actor.routeBounds.y=ROOT[1]-19.790336}
 const blocker=npcBlocker?{id:'stationary-body',jwdRole:'fixture-only',x:ROOT[0]+26.01,y:ROOT[1],vx:0,vy:0}:null;
 const player={x:npcBlocker||staticBuilding||staticCorner?ROOT[0]+1000:ROOT[0]+29.01,y:ROOT[1],r:16};
 if(sealedBody){
  actor.vx=14;actor.routeBounds={x:ROOT[0]-419.3672602666692,y:ROOT[1]-52,w:965,h:72};
  actor.min=actor.routeBounds.x+13;actor.max=actor.routeBounds.x+actor.routeBounds.w-13;
  player.x=ROOT[0]+31.6327397333308;player.y=ROOT[1]-21;
 }
 const npcs=blocker?[actor,blocker]:[actor],police=[];
 const view=await presentation(actor,kind),start=[actor.x,actor.y];
 const counts={held:0,accepted:0,blocked:0,acceptedSegments:0,ownedFailures:0},vectors=[];
 let scope;
 const bridge={player,getPolice:()=>police},api={...S};
 const accepted=(n,x,y,toX,toY)=>{
  assert.equal(scope.responderBlocked(toX,toY,13,n,x,y),false,'Every accepted segment has native body/route permission');
  const accepted=S.acceptStreetSimulationSegment(n,{fromRoot:[x*.02,0,y*.02],toRoot:[toX*.02,0,toY*.02],dx:toX-x,dy:toY-y,distance2d:Math.hypot(toX-x,toY-y)});
  if(scope.owns())assert(accepted,'The presented movement owner accepts its legal segment');counts.acceptedSegments++;
 };
 scope=vm.createContext({actor,player,npcs,police,bridge,api,accepted,Math,
  state:{started:true,modal:false,gameOver:false},document:{hidden:false},window:{},
  inspectStreetSimulation:S.inspectStreetSimulation,resolveStreetCharacter:S.resolveStreetCharacter,
  streetPaintManifest:{'crowd-irmgard-aktenordner':person},TouristAnimations:globalThis.TouristAnimations,
  npcSpriteAtlases:{towelWoman:{tourist:legacy}},FEATURED_GAIT_CYCLE_DISTANCE:41.6,CROWD_GAIT_CYCLE_DISTANCE:24,NPC_COMPLAINT_DISTANCE:82,
  trafficCars:[],policeVehicles:[],trains:[],
  groundStaticMotionBlocked:(x,y,r,fromX,fromY)=>boxed&&(x!==actor.x||y!==actor.y)||staticBuilding&&x>=ROOT[0]-100-r&&x<=ROOT[0]+300+r&&y<ROOT[1]-.8||staticCorner&&scope.groundContactBlocks(scope.signedRectDistance(x,y,scope.cornerBuilding),scope.signedRectDistance(fromX,fromY,scope.cornerBuilding),r),
  cornerBuilding:{x:ROOT[0]-263.0360896,y:ROOT[1]-147.790336,w:250,h:145},
  staticBlocked:()=>false,stationElevation:()=>0,
  dist:(x,y,a,b)=>Math.hypot(x-a,y-b),clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
  pedestrianBark:()=>{},playerSurface:()=> 'clear-fixture',requestNpcInteractions:()=>{throw Error('Unexpected interaction load')},
  before(n){return {x:n.x,y:n.y,distance:S.inspectStreetSimulation(n).distance}},
  after(n,before,value){
   counts[value===null?'held':value?'accepted':'blocked']++;
   if(value===null){assert.equal(n.x,before.x);assert.equal(n.y,before.y);assert.equal(S.inspectStreetSimulation(n).distance,before.distance)}
   assert.equal(scope.responderBlocked(n.x,n.y,13,n,n.x,n.y),false,'Committed root remains body/route legal');
  },record(dx,dy){vectors.push([dx,dy])},failure(reason){counts.ownedFailures++;throw Error(reason)}
 });
 const route=raw?ordinary.replace('const moved=paintedMovement?movePedestrian(n,dx,dy,13):moveGroundResponder(n,dx,dy,13);','const moved=moveGroundResponder(n,dx,dy,13);'):ordinary;
 if(raw)assert.notEqual(route,ordinary,'Baseline mutation reaches the real route caller');
 vm.runInContext(motionObserverSource(game)+'\n'+oneLine('groundContactBlocks')+'\n'+oneLine('signedRectDistance')+'\n'+oneLine('pedestrianRouteContains')+'\n'+movement+'\n'+lane+'\n'+stall+'\n'+
  block('function orientCrowdSprite(','for(const road of horizontalRoads)')+'\n'+block('function advanceSpriteGait(','function holdFeaturedTurn(')+'\n'+
  oneLine('requestCharacterReaction')+'\n'+oneLine('updateCharacterReaction')+'\n'+registered+`
  const nativeMove=moveGroundResponder;
  moveGroundResponder=(n,dx,dy,r)=>{record(dx,dy);const old=before(n),value=nativeMove(n,dx,dy,r);after(n,old,value);return value};
  ${pedestrianAvoidanceSource(game)}
  streetMotionObserver={
   accepts:actor=>registeredStreetPaint(actor)!==null&&api.acceptsStreetSimulation(actor),
   ownsMovement:actor=>${ownsExpression},requestMove:api.requestStreetSimulationMove,accepted,
   tick:(n,dt,paused)=>api.tickStreetSimulation(n,dt,{rootWorld:[n.x*.02,0,n.y*.02],paused}),
   discontinuity:api.invalidateStreetSimulation,failed:(n,reason)=>failure(reason)
  };
  orientCrowdSprite(actor,13,0);
  globalThis.step=dt=>{${route}finishStreetSimulationTick(dt)};
  globalThis.direct=(dx,dy)=>movePedestrian(actor,dx,dy,13);
  globalThis.progress=(x,y)=>movePedestrian.progress(actor,x,y);
  globalThis.invalidate=()=>movePedestrian.invalidate(actor);
  globalThis.owns=()=>streetMotionObserver.ownsMovement(actor);
  globalThis.lane=()=>pedestrianLane(actor);
 `,scope);
 let elapsed=0,frame=0;
 const run=(seconds,timing=[1/60])=>{
  const end=elapsed+seconds;
  while(elapsed<end-1e-12){const dt=Math.min(timing[frame++%timing.length],end-elapsed),steps=Math.max(1,Math.ceil(dt/.025));
   for(let k=0;k<steps;k++)scope.step(dt/steps);elapsed+=dt;view?.sync();
   assert.equal(counts.ownedFailures,0);assert.equal(S.inspectStreetSimulation(actor).held,null);
  }
 };
 return {actor,player,blocker,npcs,view,scope,start,counts,vectors,run,
  net:()=>Math.hypot(actor.x-start[0],actor.y-start[1]),dispose:()=>view?.dispose()};
}

for(const [label,timing] of [['30Hz',[1/30]],['60Hz',[1/60]],['120Hz',[1/120]],['14/20ms',[.014,.020]]])for(const avoid of [1,-1]){
 test(`ordinary pedestrian clears a body diameter in five seconds (${label}, avoid ${avoid})`,async()=>{
  const f=await fixture({avoid});try{assert.equal(f.scope.owns(),true);f.run(5,timing);
   assert(f.net()>=26,'Legal maneuver must progress a complete pedestrian diameter');
   assert(f.counts.acceptedSegments>0);assert(f.counts.held>0);assert.equal(f.actor.vx,13);assert.equal(f.counts.blocked,0);
  }finally{f.dispose()}
 });
}

for(const timing of [[1/60],[.014,.020]])test(`the ordinary route completes the bypass and returns to its natural lane (${timing.join('/')})`,async()=>{
 const f=await fixture();try{
  // Finite simulated test horizon, not a new gameplay/performance deadline.
  for(let i=0,elapsed=0;elapsed<16-1e-12;i++){
   const dt=Math.min(timing[i%timing.length],16-elapsed);f.run(dt,[dt]);elapsed+=dt;const a=S.inspectStreetSimulation(f.actor).atlasMotion;
   if(f.actor.x>=f.player.x+29&&Math.abs(f.actor.y-f.scope.lane())<=1e-8&&a.facing==='right'&&!a.plan)break;
  }
  assert(f.actor.x>=f.player.x+29,'Whole body reaches the far blocker tangent');
  assert(Math.abs(f.actor.y-f.scope.lane())<=1e-8,'Real lane correction is restored');
  const a=S.inspectStreetSimulation(f.actor).atlasMotion;assert.equal(a.facing,'right');assert.equal(a.plan,null);
  assert.equal(f.scope.progress(f.actor.x,f.actor.y),null,'Completed maneuver releases navigation authority');
  assert.equal(f.actor.vx,13);
 }finally{f.dispose()}
});

test('mutating the ordinary route back to the raw resolver makes the progress regression red',async()=>{
 const f=await fixture({raw:true});try{f.run(5);assert.throws(()=>assert(f.net()>=26),assert.AssertionError)}finally{f.dispose()}
});

test('an unreachable lane inside a static building keeps a clear parallel walk',async()=>{
 const f=await fixture({staticBuilding:true});try{
  // Reduced production failure: body legal along a building edge, preferred
  // lane inside its inflated wall. Lateral corrections must not alternate
  // planted turns with each collision fallback.
  f.run(5);
  assert(f.net()>=26,'Legal route advances a body diameter instead of cycling turns');
  assert.equal(f.actor.y,f.start[1],'Static-blocked lane does not pull the body into the wall');
  const phases=new Set();
  for(let i=0;i<600;i++){f.run(1/60);const pose=f.view.inspect().pose;if(pose?.clip==='walk')phases.add(pose.frame)}
  assert.equal(phases.size,16,'Clear parallel walking displays a complete distance-driven cycle');
 }finally{f.dispose()}
});

for(const timing of [[1/60],[.014,.020]])test(`a locally clear lane at a projecting static corner has a persistent legal exit (${timing.join('/')})`,async()=>{
 const f=await fixture({staticCorner:true});try{
  // Exact translated Spaeti failure geometry: preferred lateral point is
  // locally clear east of the building, but continuing left on it is blocked.
  f.run(5.5,timing);
  assert(f.net()>=26,'Corner movement clears a body diameter without repeated fallback turns');
  f.run(10,timing);
  assert(f.actor.x<f.start[0]-100,'Pedestrian passes the corner along its legal route');
  assert.equal(f.actor.vx,-14,'Static bypass preserves the route heading');
 }finally{f.dispose()}
});

for(const timing of [[1/60],[1/30],[.1]])for(const avoid of [1,-1])test(`a player sealing both route sides causes one legal retreat (${timing}, avoid ${avoid})`,async()=>{
 const f=await fixture({sealedBody:true,avoid});try{
  for(let elapsed=0;elapsed<5&&f.actor.vx>0;elapsed+=timing[0])f.run(timing[0],timing);
  assert.equal(f.actor.vx,-14);
  const reversalX=f.actor.x;f.run(5,timing);
  assert(f.actor.x<reversalX-26,'No-fit recovery clears a body diameter after reversing');
  assert.equal(f.actor.vx,-14);
  const phases=new Set();
  for(let i=0;i<300;i++){f.run(1/60);const pose=f.view.inspect().pose;if(pose?.clip==='walk'&&pose.direction==='left')phases.add(pose.frame)}
  assert.equal(phases.size,16,'Retreat resumes the full distance-driven walking cycle');
  assert(f.actor.x<reversalX-70);assert.equal(f.counts.ownedFailures,0);
 }finally{f.dispose()}
});

test('native boxed and no-exit cases retain blocked/reverse recovery',async()=>{
 for(const kind of ['none','admitted']){const boxed=await fixture({kind,boxed:true});try{
  boxed.run(1/60);assert.deepEqual([boxed.actor.x,boxed.actor.y],boxed.start);assert.equal(boxed.actor.vx,-13);
  assert.equal(boxed.counts.blocked,1);assert.equal(boxed.counts.held,0);assert.equal(boxed.scope.progress(...boxed.start),null);
 }finally{boxed.dispose()}}
 const narrow=await fixture({kind:'none',noExit:true});try{
  narrow.run(1/60);assert(narrow.actor.x<narrow.start[0],'No lateral exit keeps native legal reverse');assert.equal(narrow.actor.y,narrow.start[1]);
  assert.equal(narrow.scope.progress(...narrow.start),null,'No false active-maneuver recovery credit');
 }finally{narrow.dispose()}
});

test('moving or removing a blocker abandons the stale side maneuver',async()=>{
 for(const remove of [false,true]){
  const f=await fixture({kind:'none',npcBlocker:remove});try{
   f.scope.direct(13/60,0);assert(f.scope.progress(...f.start)>0);
   if(remove)f.npcs.splice(f.npcs.indexOf(f.blocker),1);else f.player.x+=200;
   const from=[f.actor.x,f.actor.y];f.scope.direct(13/60,0);
   assert(f.actor.x>from[0]);assert.equal(f.actor.y,from[1]);assert.equal(f.scope.progress(...from),null);
  }finally{f.dispose()}
 }
});

test('legitimate heading, root relocation and route changes invalidate the old maneuver',async()=>{
 for(const change of ['heading','root','route']){
  const f=await fixture({kind:'none'});try{
   f.scope.direct(13/60,0);assert(f.scope.progress(...f.start)>0);
   if(change==='heading')f.actor.vx=-13;
   if(change==='root'){f.actor.x-=60;f.actor.y-=.5;f.scope.notifyStreetDiscontinuity(f.actor,'route-recovery')}
   if(change==='route')f.actor.routeBounds={x:BOUNDS.x,y:f.actor.y-13,w:BOUNDS.w,h:30};
   const from=[f.actor.x,f.actor.y];f.scope.direct(f.actor.vx/60,0);
   assert.equal(f.scope.progress(...from),null,'Changed authority cannot retain old leg');
   if(change!=='route'){assert.equal(f.actor.y,from[1]);assert((f.actor.x-from[0])*Math.sign(f.actor.vx)>0)}
   assert.equal(f.counts.ownedFailures,0);
  }finally{f.dispose()}
 }
});

test('explicit and production initialization reset the same-object navigation generation',async()=>{
 const f=await fixture({kind:'none'});try{
  f.scope.direct(13/60,0);assert(f.scope.progress(...f.start)>0);f.scope.invalidate();assert.equal(f.scope.progress(...f.start),null);
  const before=[f.actor.x,f.actor.y];f.scope.direct(13/60,0);assert(f.scope.progress(...before)>0);
  Object.assign(f.scope,{horizontalRoads:[{y:BOUNDS.y+72,h:240}],verticalRoads:[],sidewalkSegments:[{min:BOUNDS.x,max:BOUNDS.x+BOUNDS.w}],verticalSidewalkSegments:[],stations:[],SIDEWALK_WIDTH:72});
  vm.runInContext(block('function initializePedestrianRoutes(){','initializePedestrianRoutes();')+'\ninitializePedestrianRoutes();',f.scope);
  assert.equal(f.scope.progress(f.actor.x,f.actor.y),null,'Actual initialization clears the existing WeakMap entry');
 }finally{f.dispose()}
});

test('standing-only and disposed presentations do not suppress legacy turn ownership',async()=>{
 for(const disposed of [false,true]){
  const f=await fixture({kind:disposed?'admitted':'standing'});try{
   if(disposed)f.view.dispose();assert.equal(f.scope.owns(),false);
   globalThis.TouristAnimations.start(f.actor,0,-1,legacy);const turn=f.actor.touristTurn;assert(turn);
   const elapsed=turn.elapsed;f.run(1/60);
   assert.deepEqual([f.actor.x,f.actor.y],f.start);assert(turn.elapsed>elapsed,'Actual legacy guard advances while no presented atlas owns movement');
   assert.equal(f.counts.accepted,0);
  }finally{f.dispose()}
 }
});

test('an unpresented pedestrian retains native movement and forward-progress recovery',async()=>{
 const f=await fixture({kind:'none'});try{
  f.run(.1);assert(f.counts.accepted>0);assert.equal(f.scope.owns(),false);
  assert.equal(f.scope.progress(...f.start),null);assert(!f.actor.progressWindow?.maneuver);
 }finally{f.dispose()}
});

test('a relocated legacy pedestrian resets stale stall history before resuming its route',async()=>{
 const f=await fixture({kind:'none'});try{
  f.player.x=f.actor.x+1000;f.actor.voiceId='fixture-legacy';f.actor.spriteKind=null;f.actor.vx=-13;f.actor.vy=0;
  const oldRoot=[f.actor.x,f.actor.y];
  f.actor.progressWindow={x:oldRoot[0],y:oldRoot[1],elapsed:.35,direction:-1};f.actor.blockedTimer=.3;
  f.actor.x+=60;
  assert(f.scope.pedestrianRouteContains(f.actor,f.actor.x,f.actor.y,13),'Relocated complete body remains on its legal route');
  f.scope.notifyStreetDiscontinuity(f.actor,'fixture-relocation');
  assert.equal(f.actor.blockedTimer,0,'A discontinuity clears the stale no-progress clock');
  assert.equal(f.actor.progressWindow,null,'A discontinuity starts a new route-progress window at the new root');
  const relocatedX=f.actor.x;f.run(.4,[1/60]);
  assert(f.actor.x<relocatedX,'Legacy movement resumes from the relocated root');
  assert.equal(f.actor.vx,-13,'Stale pre-relocation coordinates must not trigger a false stall reversal');
  assert.equal(f.actor.pause,0);
 }finally{f.dispose()}
});
