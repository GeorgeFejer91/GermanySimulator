import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import * as S from '../street-character-sprites.js';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return{promise,resolve}};
function registration(){return{rect:[.5,.75,.05,.02],axes:[6.4,0,0,3.2],profile:{corners:[-1,1],crease:[0,0,0,0,0],open_upper:[0,-.1,-.2,-.1,0],open_lower:[0,.2,.4,.2,0],source_upper:[0,0,0,0,0],source_lower:[0,0,0,0,0],width:[.1,.2],teeth:0}}}
function sources(standing=true){
 const person={id:'external-mouth-fixture',cell:[128,160],pivot:[64,150],figureHeight:136,figureWorldHeight:1.6,grid:[4,4],strideDistance:20,
  clips:{down:{offset:0,count:2},right:{offset:2,count:2},up:{offset:4,count:2},left:{offset:6,count:2},idle:{offset:8,count:1}},
  variants:{desktop:{file:'./assets/characters/street/external/atlas.webp',width:512,height:640,sha256:'b'.repeat(64)},mobile:{file:'./assets/characters/street/external/mobile.webp',width:256,height:320,sha256:'c'.repeat(64)}}};
 if(standing)person.standing={file:'./assets/characters/street/external/standing.webp',width:128,height:160,sha256:'a'.repeat(64)};
 const definition={schemaVersion:1,id:person.id,cell:person.cell,grid:person.grid,sources:{standing:person.standing?.sha256??null,desktop:person.variants.desktop.sha256,mobile:person.variants.mobile.sha256},standing:standing?registration():null,frames:Array.from({length:16},()=>registration())};
 return{person,definition};
}
async function fixture({standing=true,staticOnly=false,change,response,gate}={}){
 const {person,definition}=sources(standing);
 if(staticOnly){person.standingOnly=true;for(const key of ['grid','clips','variants','strideDistance'])delete person[key];definition.grid=null;definition.frames=[];definition.sources.desktop=definition.sources.mobile=null}
 change?.(definition);const bytes=new TextEncoder().encode(JSON.stringify(definition));
 person.mouthPaint={file:'./assets/characters/street/external/mouths.json',sha256:hash(bytes)};
 S.registerStreetCharacterManifest({schemaVersion:1,characters:{external:person}});
 const priorFetch=globalThis.fetch,fetches=[],requests=[],jobs=[];
 globalThis.fetch=async(url,options)=>{fetches.push({url,signal:options.signal});if(gate)await gate.promise;return response?response(bytes):new Response(bytes)};
 const T={...THREE,TextureLoader:class{load(url,ok){requests.push({url,ok})}}},camera=new THREE.PerspectiveCamera();
 function add(){const actor={voiceId:'external',x:0,y:0},host=new THREE.Group();const view=S.createStreetCharacterSprite(T,actor,host,(position,radius,task)=>{const job={task,state:'pending'};jobs.push(job);return job},camera);return{actor,host,view,initial:jobs.at(-1)}}
 const first=add();
 async function admit(member){const job=member.initial,pending=job.task();await Promise.resolve();if(requests.length){const source=standing?person.standing:person.variants.desktop;requests.shift().ok(new THREE.Texture({width:source.width,height:source.height}))}assert.equal(await pending,true);return member}
 await admit(first);
 function speak(member=first,distance=0){S.advanceStreetAnimation(member.actor,distance,.1,{dx:1,dy:0,speechStatus:'playing',cueToken:member,mediaTime:.4,mediaDuration:5,mouthOpen:.8});member.view.sync();return jobs.at(-1)}
 return{...first,person,definition,bytes,jobs,fetches,requests,add,admit,speak,restore(){globalThis.fetch=priorFetch;first.view.dispose()}};
}

test('title and ordinary standing paint never request external mouth data; native speech only queues admitted work',async()=>{
 const f=await fixture();try{
  for(let i=0;i<8;i++)f.view.sync();assert.equal(f.fetches.length,0);assert.equal(f.jobs.length,1);assert.equal(f.view.inspect().mouthPaint.loaded,false);
  S.advanceStreetAnimation(f.actor,0,.1,{speechStatus:'queued',cueToken:f,mouthOpen:1});f.view.sync();assert.equal(f.jobs.length,1,'queued captions do not request speech geometry');
  const job=f.speak();assert.equal(f.fetches.length,0);assert.equal(f.jobs.length,2);assert.equal(f.view.inspect().mouth.active,false);
  assert.equal(await job.task(),true);assert.equal(f.fetches.length,1);assert.match(f.fetches[0].url,/mouths\.json\?v=[a-f0-9]{64}$/);assert.equal(f.view.inspect().mouthPaint.loaded,true);assert.equal(f.view.inspect().mouth.active,true);
  for(let i=0;i<8;i++)f.speak();assert.equal(f.jobs.length,2);assert.equal(f.fetches.length,1);
 }finally{f.restore()}
});

test('explicit movement demand queues mouth data without waiting for it to admit walking paint',async()=>{
 const f=await fixture();try{
  const motion=f.view.prepareMotion();assert.equal(f.jobs.length,3);assert.equal(f.fetches.length,0);
  const pending=motion.task();await Promise.resolve();f.requests.shift().ok(new THREE.Texture({width:512,height:640}));assert.equal(await pending,true);
  assert.equal(f.view.inspect().stage,'motion');assert.equal(f.view.inspect().mouthPaint.loaded,false);assert.equal(await f.jobs[1].task(),true);
 }finally{f.restore()}
});

test('readiness samples the current walking cell and media cue without resetting accepted body distance',async()=>{
 const gate=deferred(),f=await fixture({standing:false,gate});try{
  const job=f.speak(undefined,6),pending=job.task();f.speak(undefined,12);const before=f.view.inspect().pose.slot,distance=S.inspectStreetSimulation(f.actor).distance;
  gate.resolve();assert.equal(await pending,true);assert.equal(f.view.inspect().pose.slot,before);assert.equal(S.inspectStreetSimulation(f.actor).distance,distance);assert.equal(distance,18);assert.equal(f.view.inspect().mouth.opening[0],.8);
 }finally{f.restore()}
});

test('two consumers share one byte request and one cancelled waiter cannot retire the live speaker',async()=>{
 const gate=deferred(),f=await fixture({gate});let second;try{
  second=await f.admit(f.add());const firstJob=f.speak(),secondJob=f.speak(second),abort=new AbortController();
  const firstPending=firstJob.task({signal:abort.signal}),secondPending=secondJob.task();assert.equal(f.fetches.length,1);
  abort.abort();assert.equal(await firstPending,false);assert.equal(f.fetches[0].signal.aborted,false);gate.resolve();assert.equal(await secondPending,true);
  assert.equal(second.view.inspect().mouth.active,true);assert.equal(f.view.inspect().mouth.active,false);f.view.dispose();assert.equal(f.fetches[0].signal.aborted,false);
  second.view.dispose();assert.equal(f.fetches[0].signal.aborted,true);
 }finally{second?.view.dispose();f.restore()}
});

test('missing, wrong-identity, wrong-dimension, mismatched-source and invalid-frame definitions preserve paint and never retry',async()=>{
 for(const options of [{response:()=>new Response('',{status:404})},{change:d=>d.id='somebody-else'},{change:d=>d.cell=[64,80]},{change:d=>d.grid=[2,8]},{change:d=>d.sources.desktop='0'.repeat(64)},{change:d=>d.frames.pop()},{change:d=>d.frames[1].rect[2]=0}]){
  const f=await fixture(options);try{
   const map=f.host.children[0].material.map,job=f.speak();assert.equal(await job.task(),false);assert.equal(f.view.inspect().mouthPaint.failed,true);assert(f.view.inspect().mouthPaint.error);assert.equal(f.view.inspect().failed,false);assert.equal(f.host.children[0].material.map,map);
   for(let i=0;i<8;i++)f.speak();assert.equal(f.jobs.length,2);assert.equal(f.fetches.length,1);assert.equal(f.view.inspect().mouth.active,false);
  }finally{f.restore()}
 }
});

test('a streaming oversized definition stops at 256 KiB and a hash mismatch cannot install untrusted profiles',async()=>{
 for(const response of [()=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(262145));controller.close()}})),()=>new Response('{}')]){
  const f=await fixture({response});try{assert.equal(await f.speak().task(),false);assert.equal(f.view.inspect().mouthPaint.failed,true);assert.match(f.view.inspect().mouthPaint.error,/256 KiB|hash/);assert.equal(f.view.inspect().mouth.active,false)}finally{f.restore()}
 }
});

test('final retirement aborts pending work and late bytes cannot reinstall mouth ownership',async()=>{
 const gate=deferred(),f=await fixture({gate});try{
  const pending=f.speak().task();f.view.dispose();assert.equal(f.fetches[0].signal.aborted,true);assert.equal(await pending,false);gate.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(f.view.inspect().mouthPaint.loaded,false);assert.equal(f.view.inspect().loaded,false);assert.equal(f.view.inspect().mouth,null);
 }finally{gate.resolve();f.restore()}
});

test('ending a native take while definition bytes are pending cannot reopen its mouth at readiness',async()=>{
 const gate=deferred(),f=await fixture({gate});try{
  const pending=f.speak().task(),cue=f.view.inspect().pose.cueToken;S.advanceStreetAnimation(f.actor,0,.1,{speechStatus:'cancelled',cueToken:cue});f.view.sync();
  gate.resolve();assert.equal(await pending,true);assert.equal(f.view.inspect().mouth.active,false);assert.equal(f.view.inspect().mouth.opening[0],0);
 }finally{gate.resolve();f.restore()}
});

test('standing-only source definitions bind null grid/variant identity without admitting movement',async()=>{
 const f=await fixture({staticOnly:true});try{assert.equal(await f.speak().task(),true);assert.equal(f.view.inspect().mouth.active,true);assert.equal(f.view.inspect().standingOnly,true);assert.equal(f.view.prepareMotion(),null);assert.equal(f.view.inspect().stage,'standing')}finally{f.restore()}
});

test('retirement before queued mouth admission prevents any request and final release evicts a loaded definition',async()=>{
 const f=await fixture();let next;try{
  const job=f.speak();f.view.dispose();assert.equal(await job.task(),false);assert.equal(f.fetches.length,0);
  next=await f.admit(f.add());assert.equal(await f.speak(next).task(),true);assert.equal(f.fetches.length,1);next.view.dispose();
  next=await f.admit(f.add());assert.equal(await f.speak(next).task(),true);assert.equal(f.fetches.length,2,'final owner release evicts definition bytes rather than retaining the cast');
 }finally{next?.view.dispose();f.restore()}
});

test('external metadata rejects traversal, mixed inline data and invalid hashes before asset admission',()=>{
 for(const change of [p=>p.mouthPaint.file='./assets/characters/street/../mouths.json',p=>p.mouthPaint.file='https://example.com/mouths.json',p=>p.mouthPaint.sha256='wrong',p=>p.mouthPaint.standing=null]){
  const {person}=sources();person.mouthPaint={file:'./assets/characters/street/external/mouths.json',sha256:'a'.repeat(64)};change(person);assert.throws(()=>S.registerStreetCharacterManifest({schemaVersion:1,characters:{external:person}}),/mouth/);
 }
});
