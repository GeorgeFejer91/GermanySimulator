import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import * as S from '../street-character-sprites.js';
import {motionObserverSource} from './street-simulation-fixture-source.mjs';

for(const file of ['tourist-animation.js','character-interactions.js'])vm.runInThisContext(readFileSync(file,'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
function typed(value){
 if(value===null)return ['null'];
 if(typeof value==='number'){const buffer=Buffer.alloc(8);buffer.writeDoubleBE(value);return ['number',buffer.toString('hex')]}
 if(Array.isArray(value))return ['array',value.map(typed)];
 if(typeof value==='object')return ['object',Object.keys(value).sort().map(k=>[k,typed(value[k])])];
 return [typeof value,value];
}
const canonical=value=>JSON.stringify(typed(value));
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();await new Promise(setImmediate)};
const registration=()=>({rect:[.5,.7,.1,.1],axes:[.8,0,0,1],profile:{corners:[-1,1],crease:[0,0,0,0,0],open_upper:[0,-.1,-.2,-.1,0],open_lower:[0,.2,.4,.2,0],source_upper:[0,0,0,0,0],source_lower:[0,0,0,0,0],width:[.1,.2],teeth:0}});

function sources(){
 const dirs=['down','right','up','left'],image=(file,w,h,letter)=>({file:'./assets/characters/street-speakers/delivery-test/'+file+'.webp',width:w,height:h,sha256:letter.repeat(64)});
 const p={id:'delivery-test',cell:[8,10],grid:[4,9],pivot:[4,9],figureHeight:8,figureWorldHeight:1.6,strideDistance:20,
  standing:image('standing',8,10,'a'),variants:{desktop:image('desktop',32,90,'b'),mobile:image('mobile',16,45,'c')},
  clips:Object.fromEntries(dirs.map((d,i)=>[d,{offset:i*4,count:4,seconds:.24}])),
  atlasMotion:{schemaVersion:1,walks:Object.fromEntries(dirs.map((d,i)=>[d,{row:i,frames:4,frame_ms:60}])),
   bridges:Object.fromEntries(dirs.map((d,i)=>[d,{row:i+4,stop_cols:[0],start_cols:[1],frame_ms:50}])),transitions:{},neutral:{row:4,col:0},
   interactions:{neutral:{row:4,col:0},states:{greet:{row:8,col:2,durations_ms:[100,150]},review:{row:8,col:2,durations_ms:[110,160]}}}}};
 p.clips.idle={offset:16,count:1,seconds:1};
 for(const [i,from] of dirs.entries())for(const [j,to] of dirs.entries())if(from!==to)p.atlasMotion.transitions[from+'-to-'+to]={frames:[{row:i+4,col:0,ms:50},{row:8,col:0,ms:70},{row:j+4,col:1,ms:50}]};
 p.mouthPaint={standing:registration(),frames:Array.from({length:36},()=>registration())};
 const movement=[...Array(16).keys(),16,17,20,21,24,25,28,29,32],reactions=[34,35];
 const definition={schemaVersion:1,id:p.id,logical:{cell:p.cell,grid:p.grid},definitionHashFormat:'typed-json-f64-v1',definitionSha256:hash(canonical(p)),sources:{},packs:{}};
 for(const [name,atlas] of Object.entries(p.variants))definition.sources[name]={...atlas,cell:name==='desktop'?[8,10]:[4,5]};
 for(const [kind,slots] of Object.entries({movement,reactions})){
  const rows=Math.ceil(slots.length/16),variants={};
  for(const [name,cell] of [['desktop',[8,10]],['mobile',[4,5]]])variants[name]=image(kind+'-'+name,cell[0]*16,cell[1]*rows,kind==='movement'?'d':'e');
  definition.packs[kind]={grid:[16,rows],slots:[...slots,...Array(rows*16-slots.length).fill(null)],variants};
 }
 p.motionDelivery=definition;return{p,definition};
}

async function fixture({mobile=false,external=false,change,fetchResponse}={}){
 const {p,definition}=sources();change?.(p,definition);
 const prior={width:globalThis.innerWidth,height:globalThis.innerHeight,dpr:globalThis.devicePixelRatio,fetch:globalThis.fetch,Image:globalThis.Image};
 globalThis.innerWidth=mobile?960:1200;globalThis.innerHeight=mobile?540:900;globalThis.devicePixelRatio=3;
 const fetches=[];
 if(external){const bytes=new TextEncoder().encode(JSON.stringify(definition));p.motionDelivery={file:'./assets/characters/street-speakers/delivery-test/delivery/motion-delivery.json',sha256:hash(bytes)};globalThis.fetch=async(url,options)=>{fetches.push({url,signal:options.signal});return fetchResponse?fetchResponse(bytes):new Response(bytes)}}
 S.registerStreetCharacterManifest({schemaVersion:1,characters:{delivery:p}});
 const jobs=[],requests=[],textures=[],views=[],waiting=[];
 const T={...THREE,TextureLoader:class{load(url,ok,progress,fail){const request={url,ok,fail};requests.push(request);waiting.shift()?.(request)}}};
 const nextRequest=()=>{const request=requests.find(r=>!r.done);return request?Promise.resolve(request):new Promise(resolve=>waiting.push(resolve))};
 const queue=(position,radius,task,owner)=>{const j={task,owner,state:'pending'};jobs.push(j);return j};
 function add(actor={voiceId:'delivery',x:0,y:0}){const host=new THREE.Group(),view=S.createStreetCharacterSprite(T,actor,host,queue,new THREE.PerspectiveCamera());views.push(view);return{actor,host,view,initial:jobs.at(-1)}}
 const first=add();
 async function finish(job,kind='standing'){
  const pending=job.task(),request=await Promise.race([nextRequest(),pending.then(result=>{assert.equal(result,true,'admission failed before '+kind+' request');return null})]);assert(request,'source request '+kind);request.done=true;
  const a=kind==='standing'?p.standing:definition.packs[kind].variants[mobile?'mobile':'desktop'];
  const texture=new THREE.Texture({width:a.width,height:a.height});texture.disposals=0;texture.addEventListener('dispose',()=>texture.disposals++);textures.push(texture);request.ok(texture);assert.equal(await pending,true);return texture;
 }
 await finish(first.initial);
 async function motion(member=first){await finish(member.view.prepareMotion(),'movement');member.view.sync();return member}
 const scope=vm.createContext({state:{started:true},document:{hidden:false},window:{},player:{},npcs:[first.actor],police:[],console});
 vm.runInContext(motionObserverSource(readFileSync('game.js','utf8'))+'\nglobalThis.install=o=>streetMotionObserver=o;globalThis.held=holdStreetMovement;globalThis.accept=notifyStreetAccepted;globalThis.tick=finishStreetSimulationTick;',scope);
 scope.install({accepts:S.acceptsStreetSimulation,requestMove:S.requestStreetSimulationMove,accepted(a,x,y){assert(S.acceptStreetSimulationSegment(a,{fromRoot:[x*.02,0,y*.02],toRoot:[a.x*.02,0,a.y*.02],dx:a.x-x,dy:a.y-y,distance2d:Math.hypot(a.x-x,a.y-y)}))},tick(a,dt,paused,speechPaused){S.tickStreetSimulation(a,dt,{rootWorld:[a.x*.02,0,a.y*.02],paused,speechPaused,...scope.speech})},failed(a,error){assert.fail(error)}});
 function tick(dt=.02){scope.tick(dt);for(const v of views)v.sync();return first.view.inspect().pose}
 function step(dx=0,dy=1){const a=first.actor;if(scope.held(a,dx,dy))return false;const x=a.x,y=a.y;a.x+=dx;a.y+=dy;scope.accept(a,x,y);return true}
 return{...first,p,definition,jobs,requests,textures,T,queue,views,add,finish,motion,scope,tick,step,fetches,
  dispose(){for(const v of views)v.dispose();for(const [key,value] of Object.entries({innerWidth:prior.width,innerHeight:prior.height,devicePixelRatio:prior.dpr,fetch:prior.fetch,Image:prior.Image})){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}};
}
function complete(f){for(let i=0;S.hasStreetReaction(f.actor);i++){assert(i<500);f.tick()}}

test('opt-in metadata rejects source/mapping/grid errors before replacing the cast',()=>{
 for(const change of [(p,d)=>d.sources.desktop.sha256='f'.repeat(64),(p,d)=>d.logical.grid=[9,4],(p,d)=>d.packs.movement.slots[0]=null,(p,d)=>delete d.packs.movement.slots[0],(p,d)=>d.packs.reactions.slots[1]=34,(p,d)=>d.packs.movement.variants.mobile.width++,(p,d)=>p.motionDelivery={file:'./assets/characters/street/../delivery.json',sha256:'a'.repeat(64)}]){
  const {p,definition}=sources();change(p,definition);assert.throws(()=>S.registerStreetCharacterManifest({schemaVersion:1,characters:{delivery:p}}),/delivery/i);
 }
});

test('title never fetches delivery or reaction; explicit motion loads only the packed movement image',async()=>{
 const f=await fixture({external:true});try{
  for(let i=0;i<10;i++)f.view.sync();assert.equal(f.fetches.length,0);assert.equal(f.requests.length,1);
  await f.motion();assert.equal(f.fetches.length,1);assert.equal(f.requests.length,2);assert.match(f.requests[1].url,/movement-desktop/);assert.equal(f.view.inspect().delivery.loaded,true);assert.equal(f.view.inspect().delivery.reactionLoaded,false);
  assert.equal(S.requestStreetReaction(f.actor,'missing'),false);assert.equal(f.jobs.length,2);
 }finally{f.dispose()}
});

test('actual controllers settle and hold pending before planning while a reaction image is delayed',async()=>{
 const f=await fixture();try{
  await f.motion();f.step(1,0);for(let i=0;S.inspectStreetSimulation(f.actor).atlasMotion.plan;i++){assert(i<50);f.tick()}assert(f.step(5,0));f.tick();
  const before=S.inspectStreetSimulation(f.actor),root=[f.actor.x,f.actor.y];assert(S.requestStreetReaction(f.actor,'greet',{token:{}}));
  const reactionJob=f.jobs.at(-1);assert.equal(f.jobs.length,3);
  for(let i=0;i<30;i++){assert.equal(f.step(1,0),false);f.tick(.2)}
  const wait=f.view.inspect();assert.equal(wait.pose.clip,'neutral');assert.equal(wait.pose.holdPosition,true);assert.equal(S.inspectStreetSimulation(f.actor).atlasMotion.settled,true);assert.equal(S.inspectStreetSimulation(f.actor).distance,before.distance);assert.deepEqual([f.actor.x,f.actor.y],root);assert.equal(wait.delivery.reactionLoaded,false);
  await f.finish(reactionJob,'reactions');const observed=[];for(let i=0;S.hasStreetReaction(f.actor);i++){assert(i<500);observed.push(f.tick(.01).slot)}
  assert(observed.includes(34));assert(observed.includes(35));assert.equal(S.inspectStreetSimulation(f.actor).atlasMotion.facing,'right');assert.equal(f.view.inspect().delivery.reactionLoaded,false);assert.equal(f.textures[2].disposals,1);assert.equal(f.textures[1].disposals,0);
 }finally{f.dispose()}
});

test('Three UV and mouth coordinates use physical pack cells; compact axes retain half scale',async()=>{
 for(const mobile of [false,true]){const f=await fixture({mobile});try{
  await f.motion();const mesh=f.host.children[0],uv=mesh.geometry.attributes.uv;
  assert(Math.abs(uv.getX(0)-0)<1e-7);assert(Math.abs(uv.getY(0)-.5)<1e-7,'logical neutral16 -> packed16 in second row');
  S.requestStreetReaction(f.actor,'greet');await f.finish(f.jobs.at(-1),'reactions');
  f.scope.speech={speechStatus:'playing',cueToken:{},mediaTime:.3,mediaDuration:4,mouthOpen:.6};
  for(let i=0;f.view.inspect().pose.slot!==34;i++){assert(i<100);f.tick(.01)}
  assert.equal(mesh.material.map.image.width,mobile?64:128);assert.equal(uv.getX(0),0);assert.equal(uv.getY(0),1);
  const mouth=f.view.inspect().mouth;assert.equal(mouth.active,true);assert.deepEqual(mouth.rect,[.5/16,.7,.1/16,.1]);assert.deepEqual(mouth.axes,mobile?[.4,0,0,.5]:[.8,0,0,1]);assert.equal(f.view.inspect().pose.slot,34);
 }finally{f.dispose()}}
});

test('pending cancellation prevents queued and late installs and finite failure leaves movement playable without retries',async()=>{
 const f=await fixture();try{
  await f.motion();const token={};S.requestStreetReaction(f.actor,'greet',{token});const queued=f.jobs.at(-1);assert(S.cancelStreetReaction(f.actor,{token,bodyOnly:true}));assert.equal(await queued.task(),false);assert.equal(f.requests.length,2);
  const next={};S.requestStreetReaction(f.actor,'review',{token:next});const active=f.jobs.at(-1).task();await flush();const late=f.requests.at(-1);assert(S.cancelStreetReaction(f.actor,{token:next,bodyOnly:true}));assert.equal(await active,false);
  const abandoned=new THREE.Texture({width:128,height:10});abandoned.disposals=0;abandoned.addEventListener('dispose',()=>abandoned.disposals++);late.ok(abandoned);await flush();assert.equal(abandoned.disposals,1);assert.equal(f.view.inspect().delivery.reactionLoaded,false);
  S.requestStreetReaction(f.actor,'review',{token:{}});const failure=f.jobs.at(-1).task();await flush();f.requests.at(-1).fail(new Error('source unavailable'));assert.equal(await failure,false);
  for(let i=0;i<40;i++)f.tick();assert.equal(S.hasStreetReaction(f.actor),false);assert.equal(f.view.inspect().failed,false);assert.equal(f.view.inspect().delivery.reactionFailed,true);assert.equal(f.view.inspect().pose.holdPosition,false);
  const count=f.jobs.length;for(let i=0;i<20;i++)f.tick();assert.equal(f.jobs.length,count);assert.equal(S.requestStreetReaction(f.actor,'greet'),false);
 }finally{f.dispose()}
});

test('preemption keeps valid page ownership and old cancellation cannot clear the new request',async()=>{
 const f=await fixture();try{
  await f.motion();const old={},next={};S.requestStreetReaction(f.actor,'greet',{token:old});await f.finish(f.jobs.at(-1),'reactions');f.tick(.15);
  S.requestStreetReaction(f.actor,'review',{token:next,preempt:true});assert.equal(S.cancelStreetReaction(f.actor,{token:old,bodyOnly:true}),false);complete(f);assert.equal(f.view.inspect().delivery.reactionLoaded,false);assert.equal(f.textures[2].disposals,1);
 }finally{f.dispose()}
});

test('two actors share movement/reaction images; final consumer release disposes once',async()=>{
 const f=await fixture();let second;try{
  await f.motion();second=f.add();await f.finish(second.initial);assert.equal(await second.view.prepareMotion().task(),true);second.view.sync();assert.equal(f.requests.length,3);
  S.requestStreetReaction(f.actor,'greet');S.requestStreetReaction(second.actor,'review');const a=f.jobs.at(-2).task(),b=f.jobs.at(-1).task();await flush();assert.equal(f.requests.length,4);
  const texture=new THREE.Texture({width:128,height:10});texture.disposals=0;texture.addEventListener('dispose',()=>texture.disposals++);f.requests.at(-1).ok(texture);assert.equal(await a,true);assert.equal(await b,true);
  f.view.dispose();assert.equal(texture.disposals,0);second.view.dispose();assert.equal(texture.disposals,1);assert.equal(f.textures[1].disposals,1);
 }finally{second?.view.dispose();f.dispose()}
});

test('body pause freezes readiness hold while independent native speech continues',async()=>{
 const f=await fixture();try{
  await f.motion();S.requestStreetReaction(f.actor,'greet');f.tick(.02);const slot=f.view.inspect().pose.slot;f.scope.state.modal=true;
  f.scope.speech={speechStatus:'playing',cueToken:{},mediaTime:.7,mediaDuration:4,mouthOpen:.8};for(let i=0;i<5;i++)f.tick(.8);
  assert.equal(f.view.inspect().pose.slot,slot);assert.equal(f.view.inspect().pose.mouthCue,.8);await f.finish(f.jobs.at(-1),'reactions');assert.equal(f.view.inspect().pose.slot,slot);
  f.scope.state.modal=false;complete(f);
 }finally{f.dispose()}
});

test('superseding visual owner retains active source phase and page while old disposal cannot retire it',async()=>{
 const f=await fixture();let next;try{
  await f.motion();S.requestStreetReaction(f.actor,'greet');await f.finish(f.jobs.at(-1),'reactions');
  for(let i=0;f.view.inspect().pose.slot!==34;i++){assert(i<100);f.tick(.01)}const before=f.view.inspect().pose.slot;
  next=f.add(f.actor);await f.finish(next.initial);assert.equal(await next.view.prepareMotion().task(),true);next.view.sync();
  assert.equal(next.view.inspect().pose.slot,before);assert.equal(next.host.children[0].material.map,f.textures[2]);assert.equal(next.host.children[0].geometry.attributes.uv.getX(0),0);
  f.view.dispose();assert.equal(f.textures[2].disposals,0);assert(S.hasStreetReaction(f.actor));complete(f);assert.equal(next.view.inspect().delivery.reactionLoaded,false);assert.equal(f.textures[2].disposals,1);
 }finally{next?.view.dispose();f.dispose()}
});

test('full-person definition pin rejects changed mouth, gait, pivot and identity with identical source pixels',async()=>{
 for(const change of [p=>p.mouthPaint.frames[34].axes[0]=.6,p=>p.strideDistance=21,p=>p.pivot=[3,9],(p,d)=>{p.id='other-person';d.id=p.id}]){
  const f=await fixture({change});try{assert.equal(await f.view.prepareMotion().task(),false);assert.match(f.view.inspect().delivery.error,/definition hash|identity/);assert.equal(f.requests.length,1)}finally{f.dispose()}
 }
});

test('one aborted image waiter preserves the shared fetch; final retirement aborts decode and rejects late install',async()=>{
 const f=await fixture();let second;try{
  await f.motion();second=f.add();await f.finish(second.initial);assert.equal(await second.view.prepareMotion().task(),true);second.view.sync();
  const fetches=[];let showImage;const imageReady=new Promise(resolve=>showImage=resolve);
  globalThis.fetch=async(url,options)=>{fetches.push({url,signal:options.signal});return new Response(new Uint8Array([1,2,3]))};
  globalThis.Image=class{constructor(){this.width=128;this.height=10}set src(value){this.url=value;if(value)showImage(this)}};
  S.requestStreetReaction(f.actor,'greet');S.requestStreetReaction(second.actor,'review');const firstAbort=new AbortController(),secondAbort=new AbortController();
  const first=f.jobs.at(-2).task({signal:firstAbort.signal}),next=f.jobs.at(-1).task({signal:secondAbort.signal});const image=await imageReady,late=image.onload;
  assert.equal(fetches.length,1);firstAbort.abort();assert.equal(await first,false);assert.equal(fetches[0].signal.aborted,false);assert.match(image.url,/^blob:/);
  second.view.dispose();assert.equal(await next,false);assert.equal(fetches[0].signal.aborted,true);assert.equal(image.url,'');late();await flush();assert.equal(second.view.inspect().delivery.reactionLoaded,false);
 }finally{second?.view.dispose();f.dispose()}
});

test('external hash/identity/oversize failures retain standing without requesting full atlas fallback',async()=>{
 for(const options of [{fetchResponse:()=>new Response('{}')},{fetchResponse:()=>new Response(new Uint8Array(262145))},{change:(p,d)=>d.id='other'}]){
  const f=await fixture({external:true,...options});try{assert.equal(await f.view.prepareMotion().task(),false);assert.equal(f.view.inspect().stage,'standing');assert.equal(f.requests.length,1);assert.equal(f.view.inspect().delivery.failed,true)}finally{f.dispose()}
 }
});

test('retirement during external definition fetch aborts its last lease and cannot admit late bytes',async()=>{
 let release;const delayed=new Promise(resolve=>release=resolve);const f=await fixture({external:true,fetchResponse:async bytes=>{await delayed;return new Response(bytes)}});
 try{
  const pending=f.view.prepareMotion().task();assert.equal(f.fetches.length,1);f.view.dispose();assert.equal(f.fetches[0].signal.aborted,true);assert.equal(await pending,false);
  release();await flush();assert.equal(f.view.inspect().delivery.loaded,false);assert.equal(f.view.inspect().loaded,false);assert.equal(f.requests.length,1);
 }finally{release();f.dispose()}
});

test('Canvas crops the selected physical pack and shares the same controller readiness gate',async()=>{
 const f=await fixture();let canvas;try{
  const images=[],draws=[],waiting=[];globalThis.Image=class{set src(value){this.url=value;if(value){images.push(this);waiting.shift()?.(this)}}decode(){return Promise.resolve()}};
  const actor={voiceId:'delivery',x:0,y:0};canvas=S.createStreetCharacterCanvasSprite(actor,f.queue);
  async function image(job,width,height){const count=images.length,pending=job.task(),i=images.length>count?images.at(-1):await new Promise(resolve=>waiting.push(resolve));i.naturalWidth=width;i.naturalHeight=height;i.onload();assert.equal(await pending,true);return i}
  await image(f.jobs.at(-1),8,10);await image(canvas.prepareMotion(),128,20);
  const ctx={drawImage(...args){draws.push(args)}};canvas.draw(ctx,30,40,80);assert.deepEqual(draws.at(-1).slice(1,5),[0,10,8,10]);
  S.requestStreetReaction(actor,'greet');S.tickStreetSimulation(actor,.5,{rootWorld:[0,0,0]});canvas.draw(ctx,30,40,80);assert.equal(canvas.inspect().pose.slot,16);
  await image(f.jobs.at(-1),128,10);for(let i=0;canvas.inspect().pose.slot!==34;i++){assert(i<100);S.tickStreetSimulation(actor,.01,{rootWorld:[0,0,0]});canvas.draw(ctx,30,40,80)}
  assert.deepEqual(draws.at(-1).slice(1,5),[0,0,8,10]);assert.match(draws.at(-1)[0].url,/reactions-desktop/);
 }finally{canvas?.dispose();f.dispose()}
});
