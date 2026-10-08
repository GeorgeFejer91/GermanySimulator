import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import test from "node:test";

const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
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
  const bridge={player,buildings:[]};
  if(shared)bridge.queueAssetLoad=task=>{installed.push(task);return Promise.resolve().then(task)};
  const context=vm.createContext({bridge,amtDirectRoute:false,document:{hidden:false,body},window:{BuergeramtLevel:level},performance:{now:()=>now},X:x=>x*.02,Z:y=>y*.02,S:.02,
    cityModelJobs:[],startupModelJobs:new Set(),cityModelActive:0,startupModelsCaptured:false,lastCityAdmission:-Infinity,
    updateAssetView:()=>{},isCityAssetVisible:()=>false,initialPlayerX:0,initialPlayerZ:0,cityAssetSlots:[],localModels:new Map(),console:{warn:(...args)=>warnings.push(args)},loadAmtImages:()=>{},
    modelLoader:loader?{loadAsync(url){requests.push(url);active++;maxActive=Math.max(active,maxActive);return new Promise((resolve,reject)=>pending.push({url,resolve:value=>{active--;resolve(value)},reject:error=>{active--;reject(error)}}))}}:null,
    cityModelUrl:file=>"./assets/models/city-kit/"+file+".glb",fitResponseModel:()=>{}
  });
  vm.runInContext(["cityModelsEnabled","cityModelDistance","queueCityAsset","queueCityModel","startupModelsReady","captureStartupAssets","prepareNearbyAssets","loadLocalModel","installCityModel","installTrainModel","installVehicleModel","installResponseModel","amtTexture"].map(productionFunction).join("\n"),context);
  return {context,requests,pending,warnings,installed,player,level,setTime:value=>{now=value},get maxActive(){return maxActive}};
}
const source=()=>({scene:{clone:()=>({})}});
function group(x=0,z=0){return {position:{x,z},children:[],add(model){this.children.push(model)}}}
function city(f,file,x=0,z=0,radius=1){const target=group(x,z),fallback={visible:true};f.context.installCityModel(target,fallback,file,{x:radius,y:1,z:radius});return {target,fallback,job:f.context.cityModelJobs.at(-1)}}

test("city admission preloads only the starting neighborhood, sorted near first and with two source jobs",async()=>{
  const f=fixture(),a=city(f,"bench",25),b=city(f,"garden-shed",5),c=city(f,"streetlamp",15),far=city(f,"far-landmark",90);
  for(const item of [a,b,c])f.context.startupModelJobs.add(item.job);f.context.startupModelsCaptured=true;
  assert.deepEqual(f.requests,[],"registration itself must not fetch a GLB");
  f.context.prepareNearbyAssets();await flush();
  assert.deepEqual(f.requests,["./assets/models/city-kit/garden-shed.glb","./assets/models/city-kit/streetlamp.glb"]);
  assert.equal(f.context.cityModelActive,2);assert.equal(f.context.startupModelsReady(),false);
  f.pending[0].resolve(source());f.pending[1].resolve(source());await flush();
  assert.equal(f.requests.at(-1),"./assets/models/city-kit/bench.glb");
  f.pending[2].resolve(source());await flush();
  assert.equal(f.context.startupModelsReady(),true);assert.equal(f.maxActive,2);assert.equal(far.fallback.visible,true);
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

test("office texture placeholders count settled required loads and share the asset admission queue",async()=>{
  const f=fixture(),tasks=[],images=[],callbacks=[];
  class Texture {image=null;userData={};listeners={};addEventListener(type,handler){this.listeners[type]=handler}dispose(){this.listeners.dispose?.()}}
  Object.assign(f.context,{T:{Texture,SRGBColorSpace:"srgb",LinearFilter:"linear"},officeAssetPending:0,officeAssetFailures:0,
    amtTextureLoader:{load(url,onLoad,_progress,onError){images.push({url,onLoad,onError})}}});
  f.context.bridge.queueAssetLoad=task=>{const promise=Promise.resolve().then(task);tasks.push(promise);return promise};
  const texture=f.context.amtTexture("selected-mobile.webp",loaded=>callbacks.push(loaded),undefined,true);
  assert.equal(texture.image,null);assert.equal(f.context.officeAssetPending,1);await flush();assert.equal(images.length,1);
  const image={width:768,height:768};images[0].onLoad({image});await tasks[0];await flush();
  assert.equal(texture.image,image);assert.equal(callbacks[0],texture);assert.equal(texture.colorSpace,"srgb");assert.equal(texture.generateMipmaps,false);assert.equal(f.context.officeAssetPending,0);
  f.context.amtTexture("missing.webp",undefined,undefined,true);await flush();images[1].onError(new Error("missing"));await tasks[1];await flush();assert.equal(f.context.officeAssetPending,0);assert.equal(f.context.officeAssetFailures,1);
  const cancelled=f.context.amtTexture("departed-detail.webp");cancelled.dispose();await flush();assert.equal(images.length,2,"a discarded queued close-detail image does not start another request");
});


test("initial visible distant assets are critical readiness jobs before Start",async()=>{
 const f=fixture(),far=city(f,"visible-far",80);f.context.isCityAssetVisible=job=>job===far.job;
 f.context.captureStartupAssets();f.context.startupModelsCaptured=true;
 assert.equal(f.context.startupModelJobs.has(far.job),true);assert.equal(f.context.startupModelsReady(),false);
 f.context.prepareNearbyAssets();await flush();assert.equal(f.requests.length,1);
 f.pending[0].resolve(source());await flush();assert.equal(f.context.startupModelsReady(),true);
});
