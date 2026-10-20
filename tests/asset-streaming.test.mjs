import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import test from "node:test";
import {createRequire} from 'node:module';

const {createAssetQueue}=createRequire(import.meta.url)('../asset-queue.js');

const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
test('root title does not eagerly fetch the office-only phone SDK',()=>{
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(page,/<script[^>]+src=["'][^"']*vdoninja-sdk/);
});
function productionFunction(name){
  const start=renderer.search(new RegExp("(?:async )?function "+name+"\\("));
  assert.ok(start>=0,name+" exists");
  const brace=renderer.indexOf("{",start);let depth=0;
  for(let i=brace;i<renderer.length;i++){if(renderer[i]==="{")depth++;if(renderer[i]==="}"&&!--depth)return renderer.slice(start,i+1)}
  throw new Error("Unclosed function "+name);
}
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve()};
function fixture({shared=true,loader=true}={}){
  const requests=[],pending=[],warnings=[],installed=[];let now=0,active=0,maxActive=0;
  const player={x:0,y:0},level={active:false},body={classList:{contains:()=>false}};
  const streetBodies=[];let streetPrepareCalls=0;
  const bridge={player,buildings:[]};
  if(shared)bridge.queueAssetLoad=task=>{installed.push(task);return Promise.resolve().then(task)};
  const context=vm.createContext({bridge,amtDirectRoute:false,document:{hidden:false,body},window:{BuergeramtLevel:level},performance:{now:()=>now},X:x=>x*.02,Z:y=>y*.02,S:.02,
    cityModelJobs:[],startupModelJobs:new Set(),cityModelActive:0,startupModelsCaptured:false,lastCityAdmission:-Infinity,
    // Street paint is a separate world subsystem, independently covered by
    // street-character-* tests. Keep its startup hook observable here instead
    // of silently omitting a production dependency from the GLB fixture.
    prepareStreetPaint(){streetPrepareCalls++},forEachStreetBody(visit){for(const item of streetBodies)visit(item.actor,item.root)},
    updateAssetView:()=>{},isCityAssetVisible:()=>false,initialPlayerX:0,initialPlayerZ:0,cityAssetSlots:[],localModels:new Map(),console:{warn:(...args)=>warnings.push(args)},loadAmtImages:()=>{},
    modelLoaderWithSignal:loader=>loader,modelLoader:loader?{loadAsync(url){requests.push(url);active++;maxActive=Math.max(active,maxActive);return new Promise((resolve,reject)=>pending.push({url,resolve:value=>{active--;resolve(value)},reject:error=>{active--;reject(error)}}))}}:null,
    cityModelUrl:file=>"./assets/models/city-kit/"+file+".glb",fitResponseModel:()=>{}
  });
  vm.runInContext(["cityModelsEnabled","cityModelDistance","queueCityAsset","queueCityModel","startupModelsReady","streetStartupPresented","captureStartupAssets","prepareNearbyAssets","loadLocalModel","installCityModel","installTrainModel","installVehicleModel","installResponseModel","amtTexture"].map(productionFunction).join("\n"),context);
  return {context,requests,pending,warnings,installed,player,level,streetBodies,setTime:value=>{now=value},get streetPrepareCalls(){return streetPrepareCalls},get maxActive(){return maxActive}};
}
const source=()=>({scene:{clone:()=>({})}});
function group(x=0,z=0){return {position:{x,z},children:[],add(model){this.children.push(model)}}}
function city(f,file,x=0,z=0,radius=1){const target=group(x,z),fallback={visible:true};f.context.installCityModel(target,fallback,file,{x:radius,y:1,z:radius});return {target,fallback,job:f.context.cityModelJobs.at(-1)}}

test("city admission preloads only the starting neighborhood, sorted near first and with two source jobs",async()=>{
  const f=fixture(),a=city(f,"bench",25),b=city(f,"garden-shed",5),c=city(f,"streetlamp",15),far=city(f,"far-landmark",90);
  const streetRoot={userData:{streetPaintView:{startupRequired:true,presented:false,paint:{inspect:()=>({loaded:true})}}}};
  f.streetBodies.push({actor:{id:"street-startup"},root:streetRoot});
  for(const item of [a,b,c])f.context.startupModelJobs.add(item.job);f.context.startupModelsCaptured=true;
  assert.deepEqual(f.requests,[],"registration itself must not fetch a GLB");
  f.context.prepareNearbyAssets();await flush();assert.equal(f.streetPrepareCalls,1,"world admission also invokes the independent street-paint preparation hook");
  assert.deepEqual(f.requests,["./assets/models/city-kit/garden-shed.glb","./assets/models/city-kit/streetlamp.glb"]);
  assert.equal(f.context.cityModelActive,2);assert.equal(f.context.startupModelsReady(),false);
  f.pending[0].resolve(source());f.pending[1].resolve(source());await flush();
  assert.equal(f.requests.at(-1),"./assets/models/city-kit/bench.glb");
  f.pending[2].resolve(source());await flush();
  assert.equal(f.context.startupModelsReady(),true);assert.equal(f.context.streetStartupPresented(),false,"settled GLBs do not imply the separate street presentation gate is ready");
  streetRoot.userData.streetPaintView.presented=true;assert.equal(f.context.streetStartupPresented(),true);
  assert.equal(f.maxActive,2);assert.equal(far.fallback.visible,true);
  assert.ok([a,b,c].every(item=>!item.fallback.visible&&item.target.children.length===1));
  f.player.x=4500;f.setTime(500);f.context.prepareNearbyAssets();await flush();
  assert.equal(f.requests.at(-1),"./assets/models/city-kit/far-landmark.glb","actual player approach triggers the distant source");
});

test("one source URL serves separately fitted instances; failed sources remain fallback without retry churn",async()=>{
  const f=fixture(),a=city(f,"bench",1),b=city(f,"bench",2);
  f.context.startupModelsCaptured=true;f.context.prepareNearbyAssets();await flush();
  assert.equal(f.requests.length,1);f.pending[0].resolve(source());await flush();
  assert.equal(a.target.children.length,1);assert.equal(b.target.children.length,1);assert.notEqual(a.target.children[0],b.target.children[0]);
  city(f,"broken",3);f.setTime(500);f.context.prepareNearbyAssets();await flush();f.pending[1].reject(new Error("missing"));await flush();
  city(f,"broken",4);f.setTime(1000);f.context.prepareNearbyAssets();await flush();
  assert.equal(f.requests.filter(url=>url.includes("broken")).length,1);assert.equal(f.warnings.length,1);
  assert.ok(f.context.cityAssetSlots.filter(slot=>slot.file==="broken").every(slot=>slot.fallback.visible&&!slot.model));
});

test('timed-out city preparation cannot install a late model over its accepted fallback', {timeout:2000}, async()=>{
  const f=fixture(),queue=createAssetQueue({timeoutMs:20});
  let queued;f.context.bridge.queueAssetLoad=(task,options)=>queued=queue.enqueue(task,options);
  const entry=city(f,'delayed',1);f.context.startupModelsCaptured=true;
  f.context.prepareNearbyAssets();await flush();
  await assert.rejects(queued,{name:'TimeoutError'});await flush();
  assert.equal(entry.job.state,'settled');assert.equal(entry.job.failed,true);
  f.pending[0].resolve(source());await flush();
  assert.equal(entry.target.children.length,0,'late load must not install after the queue revoked its task');
  assert.equal(entry.fallback.visible,true);assert.equal(f.context.cityModelActive,0);
});

test("a settled title neighborhood stays bounded until Start then admits newly visible assets",async()=>{
 const f=fixture(),required=city(f,"required",1),extra=city(f,"newly-visible",90);
 f.context.bridge.preparingStart=true;f.context.startupModelJobs.add(required.job);f.context.startupModelsCaptured=true;
 f.context.prepareNearbyAssets();await flush();
 f.context.isCityAssetVisible=job=>job===extra.job;f.setTime(100);f.context.prepareNearbyAssets();await flush();
 assert.equal(f.requests.length,1,"startup camera drift must not expand the selected loading set");
 f.pending[0].resolve(source());await flush();
 assert.equal(f.context.startupModelsReady(),true);
 f.context.isCityAssetVisible=job=>job===extra.job;f.setTime(500);f.context.prepareNearbyAssets();await flush();
 assert.equal(f.requests.length,1);assert.equal(f.context.startupModelJobs.size,1);assert.equal(extra.fallback.visible,true);
 f.context.bridge.preparingStart=false;f.setTime(1000);f.context.prepareNearbyAssets();await flush();
 assert.equal(f.requests.length,2);f.pending[1].resolve(source());await flush();assert.equal(extra.fallback.visible,false);
});

test("required startup assets still finish after a resize moves them outside the camera",async()=>{
  const f=fixture(),required=city(f,"visible-before-resize",90),unneeded=city(f,"never-visible",100);
  f.context.isCityAssetVisible=job=>job===required.job;
  f.context.captureStartupAssets();f.context.startupModelsCaptured=true;
  assert.ok(f.context.startupModelJobs.has(required.job));
  // The newly narrow view no longer sees this required source, and it is far
  // outside the distance lead. Readiness must not strand it pending forever.
  f.context.isCityAssetVisible=()=>false;f.context.prepareNearbyAssets();await flush();
  assert.deepEqual(f.requests,["./assets/models/city-kit/visible-before-resize.glb"]);
  f.pending[0].resolve(source());await flush();assert.equal(f.context.startupModelsReady(),true);
  assert.equal(unneeded.job.state,"pending");assert.equal(unneeded.fallback.visible,true);
});

test("admission pauses while hidden or office active, including a previously queued shared task",async()=>{
  const f=fixture(),held=[];f.context.bridge.queueAssetLoad=task=>new Promise(resolve=>held.push(()=>Promise.resolve(task()).then(resolve)));
  city(f,"bench",0);f.context.startupModelsCaptured=true;f.context.document.hidden=true;
  f.context.prepareNearbyAssets();await flush();assert.equal(held.length,0);assert.equal(f.requests.length,0);
  f.context.document.hidden=false;f.level.active=true;f.context.prepareNearbyAssets();assert.equal(held.length,0);
  f.level.active=false;f.context.prepareNearbyAssets();assert.equal(held.length,1);
  f.context.document.hidden=true;await held.shift()();await flush();assert.equal(f.requests.length,0);assert.equal(f.context.cityModelJobs[0].state,"pending");
  f.context.document.hidden=false;f.setTime(500);f.context.prepareNearbyAssets();const running=held.shift()();await flush();assert.equal(f.requests.length,1);f.pending[0].resolve(source());await running;await flush();
  assert.equal(f.context.cityModelJobs[0].state,"settled");
});

test("prefetch includes the complete object radius and inactive game ticks do not churn installs",async()=>{
  const f=fixture();let calls=0;
  const job=f.context.queueCityAsset(()=>({x:40,z:0}),10,()=>{calls++;return true});f.context.startupModelsCaptured=true;
  assert.equal(f.context.cityModelDistance(job),30);f.context.prepareNearbyAssets();await flush();assert.equal(calls,1);
  for(let i=0;i<100;i++)f.context.prepareNearbyAssets();await flush();assert.equal(calls,1);
  f.context.queueCityAsset(()=>({x:0,z:0}),1,()=>{calls++;return true});f.context.prepareNearbyAssets();await flush();assert.equal(calls,1,"after startup, admission is limited to the existing 250 ms tick");
  f.setTime(250);f.context.prepareNearbyAssets();await flush();assert.equal(calls,2);
});

test("diagnostic admission retains the same two-job limit without the production bridge queue",async()=>{
  const f=fixture({shared:false});for(let i=0;i<5;i++)city(f,"asset-"+i,i);
  f.context.startupModelsCaptured=true;f.context.prepareNearbyAssets();await flush();assert.equal(f.requests.length,2);assert.equal(f.maxActive,2);
  f.pending[0].resolve(source());f.pending[1].resolve(source());await flush();assert.equal(f.requests.length,2,"settled playback jobs wait for the next admission tick");
  f.setTime(250);f.context.prepareNearbyAssets();await flush();assert.equal(f.requests.length,4);assert.equal(f.maxActive,2);
});

test("retired dynamic slots cancel queued installation and release registry references",async()=>{
  const f=fixture(),owner={retired:true};let calls=0;
  const job=f.context.queueCityModel(()=>({x:0,z:0}),1,()=>{calls++;return true},owner);f.context.startupModelJobs.add(job);f.context.startupModelsCaptured=true;
  f.context.prepareNearbyAssets();await flush();assert.equal(calls,0);assert.equal(job.state,"settled");assert.equal(job.owner,null);assert.equal(job.position,null);assert.equal(f.context.cityModelJobs.length,0);assert.equal(f.context.startupModelsReady(),true);
});

test("trains fetch their exact three sources sequentially only when any complete car approaches",async()=>{
  const f=fixture();f.context.trainModelUrls=["engine-a.glb","coach.glb","engine-c.glb"];f.context.fitTrainPart=model=>model;
  const slot={train:{cars:[{x:10000,y:0},{x:9000,y:0},{x:8000,y:0}]},cars:Array.from({length:3},()=>({group:group(),fallback:{visible:true}}))};
  f.context.installTrainModel(slot);f.context.startupModelsCaptured=true;f.context.prepareNearbyAssets();await flush();assert.equal(f.requests.length,0);
  f.player.x=8000;f.setTime(500);f.context.prepareNearbyAssets();await flush();assert.deepEqual(f.requests,["engine-a.glb"]);
  f.pending[0].resolve(source());await flush();assert.deepEqual(f.requests,["engine-a.glb","coach.glb"]);
  f.pending[1].resolve(source());await flush();assert.deepEqual(f.requests,["engine-a.glb","coach.glb","engine-c.glb"]);
  f.pending[2].resolve(source());await flush();assert.ok(slot.cars.every(car=>car.model&&!car.fallback.visible));assert.equal(f.maxActive,1);
});

test("direct office and unavailable model loader admit no city GLB work",async()=>{
  const f=fixture({loader:false});city(f,"bench");assert.equal(f.context.cityModelJobs.length,0);
  f.context.queueCityAsset(()=>({x:0,z:0}),1,()=>{throw new Error("direct office must not fetch city art")});f.context.amtDirectRoute=true;f.context.prepareNearbyAssets();await flush();assert.equal(f.context.cityModelActive,0);
});

test("office preparation requires an actual approach after startup and only while visible",()=>{
  const f=fixture(),calls=[];let started=false;
  f.context.bridge.getHUDState=()=>({started});f.context.bridge.buildings=[{id:"buergeramt",doorX:9000,doorY:9000}];
  f.context.loadAmtImages=options=>calls.push(options);
  f.context.startupModelsCaptured=true;f.context.prepareNearbyAssets();assert.equal(calls.length,0,"title must not preload the distant office");
  started=true;f.setTime(500);f.context.prepareNearbyAssets();assert.equal(calls.length,0,"starting the city does not download distant office assets");
  f.player.x=8500;f.player.y=8500;f.setTime(800);f.context.prepareNearbyAssets();assert.equal(calls.length,1);assert.equal(calls[0].background,true);
  f.context.document.hidden=true;f.setTime(1000);f.context.prepareNearbyAssets();assert.equal(calls.length,1);
  f.context.document.hidden=false;f.level.active=true;f.context.prepareNearbyAssets();assert.equal(calls.length,1);
});

test("office texture placeholders count settled required loads and share the asset admission queue",async()=>{
  const f=fixture(),tasks=[],images=[],callbacks=[];
  class Texture {image=null;userData={};listeners={};addEventListener(type,handler){this.listeners[type]=handler}dispose(){this.listeners.dispose?.()}}
  Object.assign(f.context,{AbortController,T:{Texture,SRGBColorSpace:"srgb",LinearFilter:"linear"},officeAssetPending:0,officeAssetFailures:0,officeAssetTotal:0,officePreparationBackground:false,
    amtTextureLoader:{load(url,onLoad,_progress,onError){images.push({url,onLoad,onError})}}});
  f.context.bridge.queueAssetLoad=task=>{const promise=Promise.resolve().then(task);tasks.push(promise);return promise};
  const texture=f.context.amtTexture("selected-mobile.webp",loaded=>callbacks.push(loaded),undefined,true);
  assert.equal(texture.image,null);assert.equal(f.context.officeAssetPending,1);assert.equal(f.context.officeAssetTotal,1);await flush();assert.equal(images.length,1);
  const image={width:768,height:768};images[0].onLoad({image});await tasks[0];await flush();
  assert.equal(texture.image,image);assert.equal(callbacks[0],texture);assert.equal(texture.colorSpace,"srgb");assert.equal(texture.generateMipmaps,false);assert.equal(f.context.officeAssetPending,0);
  f.context.amtTexture("missing.webp",undefined,undefined,true);await flush();images[1].onError(new Error("missing"));await tasks[1];await flush();assert.equal(f.context.officeAssetPending,0);assert.equal(f.context.officeAssetFailures,1);assert.equal(f.context.officeAssetTotal,2);
  const cancelled=f.context.amtTexture("departed-detail.webp");cancelled.dispose();await flush();assert.equal(images.length,2,"a discarded queued close-detail image does not start another request");
});


test("initial visible distant assets are critical readiness jobs before Start",async()=>{
 const f=fixture(),far=city(f,"visible-far",80);f.context.isCityAssetVisible=job=>job===far.job;
 f.context.captureStartupAssets();f.context.startupModelsCaptured=true;
 assert.equal(f.context.startupModelJobs.has(far.job),true);assert.equal(f.context.startupModelsReady(),false);
 f.context.prepareNearbyAssets();await flush();assert.equal(f.requests.length,1);
 f.pending[0].resolve(source());await flush();assert.equal(f.context.startupModelsReady(),true);
});
