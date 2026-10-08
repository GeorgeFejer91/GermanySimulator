import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {sampleArc,sampleOwnedTrajectory,validateGaussianManifest,unpackGaussianRecords,createGaussianActor} from '../buergeramt-gaussian-animation.js';

const manifest=name=>JSON.parse(readFileSync(new URL(`../assets/buergeramt/animation/${name}.json`,import.meta.url)));
const clerk=manifest('clerk'),regular=manifest('aktenkurier');
const near=(actual,wanted)=>assert.ok(Math.abs(actual-wanted)<1e-6,`${actual} != ${wanted}`);

test('clerk arcs traverse authored segments linearly and reverse without intermediate holds',()=>{
 const first=sampleArc(clerk,{arc:'raise',phase:0,pose:'ready'});
 assert.equal(first.segment,0);assert.equal(first.u,0);
 const boundary=sampleArc(clerk,{arc:'raise',phase:1.3/3.1,pose:'ready'});
 assert.equal(boundary.segment,1);near(boundary.u,0);
 const middle=sampleArc(clerk,{arc:'raise',phase:1.9/3.1,pose:'ready'});
 assert.equal(middle.segment,1);near(middle.u,.5);
 const end=sampleArc(clerk,{arc:'raise',phase:1,pose:'ready'});
 assert.equal(end.segment,2);assert.equal(end.u,1);
 const backward=sampleArc(clerk,{arc:'raise-back',phase:0,pose:'raised'});
 assert.equal(backward.segment,2);assert.equal(backward.u,1);
 const reversedEnd=sampleArc(clerk,{arc:'raise-back',phase:1,pose:'raised'});
 assert.equal(reversedEnd.segment,0);assert.equal(reversedEnd.u,0);
 assert.deepEqual(sampleArc(clerk,{arc:null,pose:'raised'}).segment,2);
 assert.equal(sampleArc(clerk,{arc:null,pose:'ready'}).u,1);
});

test('regular four-second action is a continuous triangular traversal',()=>{
 const start=sampleArc(regular,{arc:'work-gesture-work',phase:0,pose:'work'});
 const gesture=sampleArc(regular,{arc:'work-gesture-work',phase:.5,pose:'gesture'});
 const returnMid=sampleArc(regular,{arc:'work-gesture-work',phase:.75,pose:'gesture'});
 const finish=sampleArc(regular,{arc:'work-gesture-work',phase:1,pose:'work'});
 assert.deepEqual([start.segment,start.u],[0,0]);
 assert.deepEqual([gesture.segment,gesture.u],[3,1]);
 assert.equal(returnMid.segment,2);near(returnMid.u,(1-.95)/(.55));
 assert.deepEqual([finish.segment,finish.u],[0,0]);
 assert.deepEqual([sampleArc(regular,{arc:null,pose:'work'}).segment,sampleArc(regular,{arc:null,pose:'work'}).u],[0,0]);
 assert.equal(sampleArc(regular,{arc:null,pose:'gesture'}).u,1);
});

test('packed records accept shipped variants and reject length, count and coordinate corruption',()=>{
 for(const [name,data] of [['clerk',clerk],['aktenkurier',regular]])for(const variant of ['desktop','mobile']){
  const spec=validateGaussianManifest(data,variant);
  const zipped=readFileSync(new URL(`../assets/buergeramt/animation/${spec.file}`,import.meta.url));
  const decoded=gunzipSync(zipped);
  const records=unpackGaussianRecords(data,variant,decoded.buffer.slice(decoded.byteOffset,decoded.byteOffset+decoded.byteLength));
  assert.equal(records.count,spec.sample_count);assert.equal(records.xy.length,spec.sample_count*spec.segment_count*4);
  assert.equal(records.start.length,records.end.length);
  assert(records.xy.every(Number.isFinite),name);
 }
 const bad=structuredClone(regular);bad.variants.desktop.sample_count=20224;
 assert.throws(()=>validateGaussianManifest(bad),/Invalid Gaussian/);
 const spec=regular.variants.desktop,short=new ArrayBuffer(spec.decoded_bytes-24);
 assert.throws(()=>unpackGaussianRecords(regular,'desktop',short),/record length/);
 const corrupt=gunzipSync(readFileSync(new URL(`../assets/buergeramt/animation/${spec.file}`,import.meta.url)));
 corrupt.writeFloatLE(Infinity,0);
 assert.throws(()=>unpackGaussianRecords(regular,'desktop',corrupt.buffer.slice(corrupt.byteOffset,corrupt.byteOffset+corrupt.byteLength)),/coordinate/);
});

test('paint shader returns endpoint sRGB after premultiplied linear-light blending',()=>{
 const source=readFileSync(new URL('../buergeramt-gaussian-animation.js',import.meta.url),'utf8');
 assert.match(source,/linearA\*paintA\.a,linearB\*paintB\.a/);
 assert.match(source,/linear\*12\.92,1\.055\*pow/);
 assert.match(source,/rgba=vec4\(srgb,alpha\)/);
 const toLinear=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
 const toSrgb=c=>c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055;
 const paint=(a,b,t)=>{
  const alpha=a[3]*(1-t)+b[3]*t;
  return [...Array(3)].map((_,i)=>toSrgb((toLinear(a[i])*a[3]*(1-t)+toLinear(b[i])*b[3]*t)/alpha)).concat(alpha);
 };
 const a=[.72,.21,.09,.8],b=[.13,.68,.91,.4];
 for(const [t,expected] of [[0,a],[1,b]])paint(a,b,t).forEach((value,i)=>near(value,expected[i]));
 assert(paint(a,b,.5)[0]>(a[0]+b[0])/2,'linear-light midpoint is brighter than raw sRGB average');
});

test('owned half-turn keeps exact endpoints and avoids linear midpoint collapse',()=>{
 const trajectory={segment:0,start_slot:12,end_slot:32,pivot_start:[0,0],pivot_end:[.2,0],angle_radians:Math.PI};
 const start=[1,0],end=[-.8,0];
 const first=sampleOwnedTrajectory(trajectory,start,end,0),middle=sampleOwnedTrajectory(trajectory,start,end,.5),last=sampleOwnedTrajectory(trajectory,start,end,1);
 first.forEach((value,i)=>near(value,start[i]));last.forEach((value,i)=>near(value,end[i]));
 near(middle[0],.1);near(middle[1],1);
 assert(Math.hypot(...middle)>Math.hypot((start[0]+end[0])/2,(start[1]+end[1])/2)*5,
   'the rotating part must retain its extent through a half-turn');
 const prepared=structuredClone(clerk);prepared.variants.desktop.trajectories=[trajectory];
 assert.equal(validateGaussianManifest(prepared).trajectories.length,1);
 for(const bad of [
  {...trajectory,segment:prepared.segments.length},
  {...trajectory,start_slot:32},
  {...trajectory,end_slot:prepared.variants.desktop.sample_count+1},
  {...trajectory,pivot_start:[4.01,0]},
  {...trajectory,pivot_end:[0,Infinity]},
  {...trajectory,angle_radians:Math.PI+.001},
 ]){
  const invalid=structuredClone(prepared);invalid.variants.desktop.trajectories=[bad];
  assert.throws(()=>validateGaussianManifest(invalid),/trajectory/);
 }
 const separate=structuredClone(prepared);separate.variants.desktop.trajectories=[trajectory,{...trajectory,start_slot:40,end_slot:50}];
 assert.equal(validateGaussianManifest(separate).trajectories.length,2,'two separately owned props can move in the same interval');
 const overlapping=structuredClone(prepared);overlapping.variants.desktop.trajectories=[trajectory,{...trajectory,start_slot:20,end_slot:50}];
 assert.throws(()=>validateGaussianManifest(overlapping),/trajectory/,'overlapping slot paths have ambiguous ownership');
 const excessive=structuredClone(prepared);excessive.variants.desktop.trajectories=Array.from({length:9},(_,n)=>({...trajectory,start_slot:n*2,end_slot:n*2+1}));
 assert.throws(()=>validateGaussianManifest(excessive),/trajectory/,'bound generated shader paths per segment');
});

test('actor uses one cloud, source floor and scale, and waits for its own completed sort',async()=>{
 const originalFetch=globalThis.fetch;
 const trajectory={segment:0,start_slot:12,end_slot:32,pivot_start:[0,0],pivot_end:[.2,0],angle_radians:Math.PI};
 globalThis.fetch=async url=>{const bytes=readFileSync(new URL(url));return{ok:true,json:async()=>{const data=JSON.parse(bytes.toString());data.variants.desktop.trajectories=[trajectory];return data},arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}};
 const textures=[];
 class DataTexture{constructor(data,w,h){this.data=data;this.width=w;this.height=h;this.disposals=0;textures.push(this)}dispose(){this.disposals++}}
 class Vector2{set(x,y){this.x=x;this.y=y}}
 class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(other){Object.assign(this,other);return this}}
 class SplatMesh{constructor(options){this.options=options;this.initialized=Promise.resolve();this.position=new Vector3();this.quaternion={copy(){}};this.scale={setScalar:value=>{this.size=value}};this.visible=false;this.generatorUpdates=0}updateGenerator(){this.generatorUpdates++}}
 let tint,shader='';
 class Dyno{constructor(options){this.options=options}apply(input){const names=Object.fromEntries(Object.keys(input).map(key=>[key,key]));shader=this.options.statements({inputs:names,outputs:{gsplat:'outGsplat'}});return{gsplat:'compiled'}}}
 const dyno={Gsplat:'Gsplat',Dyno,unindentLines:value=>value,dynoSampler2D:value=>value,
  dynoFloat:value=>({value}),dynoVec2:value=>({value}),dynoVec3:value=>(tint={value}),
  dynoBlock:(_input,_output,build)=>build({gsplat:'inGsplat'})};
 const owner={SplatMesh,dyno,started:0,completed:0,attached:[],retired:[],attach(mesh){this.attached.push(mesh)},retire(mesh,cleanup){this.retired.push(mesh);cleanup()},inspect(){return{ready:true,startedUpdates:this.started,completedUpdates:this.completed,activeSplats:10,pending:false,failure:''}}};
 const THREE={DataTexture,Vector2,Vector3,Quaternion:class{},Color:class{},FloatType:'float',UnsignedByteType:'byte',RGBAFormat:'rgba',NearestFilter:'nearest',ClampToEdgeWrapping:'clamp'};
 try{
  const actor=await createGaussianActor({THREE,owner,manifestUrl:new URL('../assets/buergeramt/animation/aktenkurier.json',import.meta.url),anchorPaint:false});
  assert.equal(owner.attached.length,1);assert.equal(owner.attached[0].options.maxSplats,regular.variants.desktop.sample_count);
  assert.equal(textures.length,3);assert.equal(textures[0].width,256);
  assert.match(shader,/int slot=cell\.x\+cell\.y\*256;/,'slot must be captured before adding the segment texture row');
  assert.match(shader,/if\(int\(segment\)==0&&slot>=12&&slot<32\)/);
  assert.match(shader,/p=mix\(pivotA,pivotB,u\)\+vec2\(cos\(theta\)/);
  assert(!shader.includes('${'),'trajectory code must be resolved before Spark compilation');
  const source={geometry:{parameters:{height:1.96}},scale:{y:1},position:new Vector3(3, .98,-4),rotation:{x:0,y:.4,z:0},quaternion:{}};
  assert.equal(actor.update({arc:'work-gesture-work',phase:.05,pose:'work'},source),false);
  near(owner.attached[0].position.y,0);near(owner.attached[0].size,1.96);
  owner.started=1;owner.completed=1;
  assert.equal(actor.update({arc:'work-gesture-work',phase:.05,pose:'work'},source),true);
  assert.equal(actor.inspect().visible,true);
  assert.equal(actor.inspect().trajectoryCount,1);
  assert.deepEqual(actor.inspect().activeTrajectory,trajectory);
  source.material={color:{r:.2,g:.5,b:.9},userData:{breath:{value:.4}}};
  actor.update({arc:'work-gesture-work',phase:.05,pose:'work'},source);
  assert.deepEqual([tint.value.x,tint.value.y,tint.value.z],[.2,.5,.9]);
  actor.dispose();assert.equal(owner.retired.length,1);assert(textures.every(texture=>texture.disposals===1));
 }finally{globalThis.fetch=originalFetch}
});
