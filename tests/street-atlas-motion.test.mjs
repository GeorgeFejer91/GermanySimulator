import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

const root=process.cwd(),code=process.env.STREET_ATLAS_MODULE_ROOT||root;
const S=await import(pathToFileURL(resolve(code,'street-character-sprites.js')));
const THREE=await import(pathToFileURL(resolve(root,'assets/vendor/three/0.186.0/build/three.core.js')));
vm.runInThisContext(readFileSync(resolve(code,'tourist-animation.js'),'utf8'));
const original=JSON.parse(readFileSync('assets/characters/street/manifest.json','utf8')).characters['crowd-irmgard-aktenordner'];
const slot=(row,col)=>row*original.grid[0]+col;
const walkSlot=(direction,phase=0)=>slot(original.atlasMotion.walks[direction].row,phase);
const neutralSlot=()=>slot(original.atlasMotion.neutral.row,original.atlasMotion.neutral.col);
const bridgeSlot=(direction,kind,index=0)=>{const b=original.atlasMotion.bridges[direction];return slot(b.row,b[kind][index])};
const isWalkSlot=value=>Object.values(original.atlasMotion.walks).some(w=>Math.floor(value/original.grid[0])===w.row&&value%original.grid[0]<w.frames);
const selectedAtlas=view=>original.variants[view.inspect().variant];
const manifest=person=>({schemaVersion:1,characters:{'crowd-irmgard-aktenordner':person}});
function actor(){S.registerStreetCharacterManifest(manifest(structuredClone(original)));return {voiceId:'crowd-irmgard-aktenordner',x:0,y:0}}
function tick(a,dt=.07,paused=false){return S.tickStreetSimulation(a,dt,{rootWorld:[a.x*.02,0,a.y*.02],paused})}
function info(a){return S.inspectStreetSimulation(a).atlasMotion}
function finish(a){const entry=info(a)?.slot;for(let i=0;info(a)?.plan;i++){assert(i<100,'plan bounded');const held=info(a);if(isWalkSlot(held.slot)){assert.equal(held.planIndex,0,'only exact settle entry may use a walk cell');assert.equal(held.slot,entry,'held plan cannot progress ordinary gait')}tick(a)}}
function move(a,dx,dy){const from=[a.x*.02,0,a.y*.02];a.x+=dx;a.y+=dy;assert(S.acceptStreetSimulationSegment(a,{fromRoot:from,toRoot:[a.x*.02,0,a.y*.02],dx,dy,distance2d:Math.hypot(dx,dy)}))}
function fixture(){
 const jobs=[],requests=[],T={...THREE,TextureLoader:class{load(url,ok,progress,fail){requests.push({url,ok,fail})}}};
 const host=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 const queue=(position,radius,task,owner)=>{const job={task,owner};jobs.push(job);return job};
 return {T,host,camera,jobs,requests,queue,decode(w,h){const r=requests.shift();assert(r);const texture=new THREE.Texture({width:w,height:h});r.ok(texture);return texture}};
}
async function standing(a,f){const view=S.createStreetCharacterSprite(f.T,a,f.host,f.queue,f.camera),pending=f.jobs.at(-1).task();await Promise.resolve();f.decode(original.standing.width,original.standing.height);assert.equal(await pending,true);return view}
async function motion(view,f){const pending=view.prepareMotion().task();await Promise.resolve();const atlas=selectedAtlas(view);f.decode(atlas.width,atlas.height);assert.equal(await pending,true)}
async function ready(){const a=actor(),f=fixture(),v=await standing(a,f);await motion(v,f);v.sync();return {a,f,v}}

test('atlas metadata rejects unbounded cells, bad timing, bridge mismatch and competing owner',()=>{
 for(const change of [p=>p.atlasMotion.walks.down.frames=17,p=>p.atlasMotion.transitions['down-to-up'].frames[0].ms=0,p=>p.atlasMotion.neutral.col=0,p=>p.atlasMotion.cycle_distance=4,p=>p.atlasMotion.bridges.left.stop_cols=[-1],p=>p.atlasMotion.transitions['down-to-right'].frames[0].col=7,p=>p.motionRig={}]){
  const p=structuredClone(original);change(p);assert.throws(()=>S.registerStreetCharacterManifest(manifest(p)));
 }
});

test('no holds before decode/presentation, then neutral, matching start and all sixteen distance phases',async()=>{
 const a=actor(),f=fixture();assert.equal(S.requestStreetSimulationMove(a,1,0),false);
 const v=await standing(a,f);assert.equal(S.requestStreetSimulationMove(a,1,0),false);
 await motion(v,f);assert.equal(info(a),null);assert.equal(S.requestStreetSimulationMove(a,1,0),false);
 v.sync();assert.equal(info(a).slot,neutralSlot());assert.equal(info(a).settled,true);
 assert.equal(S.requestStreetSimulationMove(a,0,1),true);assert.equal(info(a).slot,bridgeSlot('down','start_cols'));finish(a);
 assert.equal(info(a).slot,walkSlot('down'));const seen=new Set();
 move(a,0,original.strideDistance/32);tick(a);
 assert.equal(original.atlasMotion.walks.down.frames,16);
 for(let i=0;i<16;i++){assert.equal(S.requestStreetSimulationMove(a,0,1),false);move(a,0,original.strideDistance/16);tick(a);assert.equal(info(a).phase,(i+1)%16);assert.equal(info(a).slot,walkSlot('down',(i+1)%16));seen.add(info(a).phase)}
 assert.equal(seen.size,16);assert.equal(S.inspectStreetSimulation(a).pendingAcceptedDistance,0);
 assert.equal(S.requestStreetReaction(a,'idle'),false);assert.equal(v.canPlayReaction('idle'),false);v.dispose();
});

test('multiple accepted segments count once, renderer cannot tick, paused held turn cannot advance',async()=>{
 const {a,v}=await ready();S.requestStreetSimulationMove(a,1,0);finish(a);
 move(a,.8,0);move(a,.8,0);tick(a);assert.equal(info(a).gaitDistance,1.6);
 const initial=structuredClone(info(a));for(let i=0;i<10;i++){v.sync();S.advanceStreetAnimation(a,100,1,{dx:100,dy:0})}assert.deepEqual(info(a),initial);
 assert.equal(S.requestStreetSimulationMove(a,0,-1),true);const before=structuredClone(info(a));
 for(let i=0;i<5;i++){S.requestStreetSimulationMove(a,0,-1);tick(a,.5,true);v.sync()}assert.deepEqual(info(a),before);
 const root=[a.x,a.y];finish(a);assert.deepEqual([a.x,a.y],root);assert.equal(info(a).facing,'up');v.dispose();
});

test('direction requests coalesce and stop/start return through authored bridge neutral',async()=>{
 const {a,v}=await ready();S.requestStreetSimulationMove(a,1,0);finish(a);move(a,original.strideDistance*12/16,0);tick(a);
 S.requestStreetSimulationMove(a,0,-1);tick(a);const index=info(a).planIndex;
 for(let i=0;i<5;i++)S.requestStreetSimulationMove(a,-1,0);
 assert.equal(info(a).planIndex,index);assert.equal(info(a).requested,'left');finish(a);
 assert.equal(info(a).facing,'up');assert.equal(S.requestStreetSimulationMove(a,-1,0),true);finish(a);assert.equal(info(a).facing,'left');
 tick(a);assert.equal(info(a).plan,'stop');finish(a);assert.equal(info(a).slot,bridgeSlot('left','stop_cols',original.atlasMotion.bridges.left.stop_cols.length-1));assert.equal(info(a).settled,true);
 assert.equal(S.requestStreetSimulationMove(a,-1,0),true);assert.equal(info(a).slot,bridgeSlot('left','start_cols'));finish(a);assert.equal(info(a).slot,walkSlot('left'));v.dispose();
});

test('failed movement texture leaves standing and no holds',async()=>{
 const a=actor(),f=fixture(),v=await standing(a,f),warn=console.warn;console.warn=()=>{};
 try{const pending=v.prepareMotion().task();await Promise.resolve();f.requests.shift().fail(new Error('fixture missing atlas'));assert.equal(await pending,false)}finally{console.warn=warn}
 v.sync();assert.equal(v.inspect().stage,'standing');assert.equal(info(a),null);assert.equal(S.requestStreetSimulationMove(a,1,0),false);v.dispose();
});

test('retiring older presentation does not clear superseding owner; final disposal releases holds',async()=>{
 const {a,v}=await ready(),f2=fixture(),v2=await standing(a,f2);await motion(v2,f2);v2.sync();
 assert(S.requestStreetSimulationMove(a,1,0));v.dispose();assert.equal(info(a).ready,true);assert.equal(S.requestStreetSimulationMove(a,1,0),true);
 v2.dispose();assert.equal(info(a),null);assert.equal(S.requestStreetSimulationMove(a,1,0),false);
});

test('retirement during pending decode cannot admit an invisible owner',async()=>{
 const a=actor(),f=fixture(),v=await standing(a,f);const pending=v.prepareMotion().task();await Promise.resolve();v.dispose();const atlas=selectedAtlas(v);f.decode(atlas.width,atlas.height);assert.equal(await pending,false);
 assert.equal(info(a),null);assert.equal(S.requestStreetSimulationMove(a,1,0),false);
});

test('Canvas requires an actual successful draw before admission',async()=>{
 const a=actor(),jobs=[],images=[];const old=globalThis.Image;
 globalThis.Image=class{constructor(){images.push(this)}set src(value){this.url=value}async decode(){} };
 const queue=(position,radius,task,owner)=>{const job={task,owner};jobs.push(job);return job};
 try{
  const view=S.createStreetCharacterCanvasSprite(a,queue),pending=jobs.at(-1).task();await Promise.resolve();Object.assign(images[0],{naturalWidth:original.standing.width,naturalHeight:original.standing.height});await images[0].onload();assert.equal(await pending,true);
  const motion=view.prepareMotion().task();await Promise.resolve();const atlas=selectedAtlas(view);Object.assign(images[1],{naturalWidth:atlas.width,naturalHeight:atlas.height});await images[1].onload();assert.equal(await motion,true);
  assert.equal(info(a),null);assert.throws(()=>view.draw({drawImage(){throw new Error('draw failure')}},0,0,136));assert.equal(info(a),null);
  const calls=[];assert(view.draw({drawImage(...args){calls.push(args)}},0,0,136));const [cols,rows]=original.grid,{row,col}=original.atlasMotion.neutral;assert.equal(calls[0][1],col*atlas.width/cols);assert.equal(calls[0][2],row*atlas.height/rows);assert.equal(calls[0][3],atlas.width/cols);assert.equal(calls[0][4],atlas.height/rows);assert.equal(info(a).slot,neutralSlot());
  assert(S.requestStreetSimulationMove(a,1,0));view.dispose();assert.equal(info(a),null);assert.equal(S.requestStreetSimulationMove(a,1,0),false);
 }finally{globalThis.Image=old}
});


test('discontinuity requires matching standing readmission and resumes from neutral',async()=>{
 const {a,v}=await ready();S.requestStreetSimulationMove(a,1,0);tick(a);
 S.invalidateStreetSimulation(a,'fixture teleport');a.x=20;tick(a);
 assert.equal(S.requestStreetSimulationMove(a,1,0),false);
 assert.equal(S.readmitStreetSimulationGeneration(a,{rootWorld:[.4,0,0],standingSha256:'wrong'}),false);
 assert.equal(S.readmitStreetSimulationGeneration(a,{rootWorld:[.4,0,0],standingSha256:original.standing.sha256}),true);
 assert.equal(info(a).slot,neutralSlot());assert.equal(info(a).settled,true);assert.equal(info(a).plan,null);
 assert.equal(S.requestStreetSimulationMove(a,0,1),true);assert.equal(info(a).slot,bridgeSlot('down','start_cols'));v.dispose();
});


test('optional phase settles validate direction, phase, dedicated cells, duration and facing neutral',()=>{
 const build=()=>{const p=structuredClone(original),b=p.atlasMotion.bridges.left;p.atlasMotion.settles={left:{'4':{frames:[{row:b.row,col:5,ms:70},{row:b.row,col:b.stop_cols.at(-1),ms:70}]}}};return p};
 assert.doesNotThrow(()=>S.registerStreetCharacterManifest(manifest(build())));
 for(const change of [
  p=>p.atlasMotion.settles.back=p.atlasMotion.settles.left,
  p=>p.atlasMotion.settles.left['16']=p.atlasMotion.settles.left['4'],
  p=>p.atlasMotion.settles.left['04']=p.atlasMotion.settles.left['4'],
  p=>p.atlasMotion.settles.left['4'].frames.pop(),
  p=>p.atlasMotion.settles.left['4'].frames=Array(17).fill({row:7,col:2,ms:70}),
  p=>p.atlasMotion.settles.left['4'].frames[0].row=p.atlasMotion.walks.left.row,
  p=>p.atlasMotion.settles.left['4'].frames[0].col=p.grid[0],
  p=>p.atlasMotion.settles.left['4'].frames[0].ms=0,
  p=>p.atlasMotion.settles.left['4'].frames[1].row=p.atlasMotion.bridges.down.row,
  p=>p.atlasMotion.settles.left['4'].frames[1].col=0,
  p=>delete p.atlasMotion.settles.left['4'].frames[0]
 ]){const p=build();change(p);assert.throws(()=>S.registerStreetCharacterManifest(manifest(p)))}
});

test('atlas observer projects optional phase settle without a second clock or visible entry pop',async()=>{
 const b=original.atlasMotion.bridges.left,savedSettles=original.atlasMotion.settles;
 original.atlasMotion.settles={left:{'4':{frames:[5,6,b.stop_cols.at(-1)].map(col=>({row:b.row,col,ms:70}))}}};
 let v;
 try{
  const readyView=await ready();const a=readyView.a;v=readyView.v;S.requestStreetSimulationMove(a,-1,0);finish(a);
  move(a,-original.strideDistance*4.5/16,0);tick(a);assert.equal(info(a).phase,4);
  const before=structuredClone(info(a));assert(S.requestStreetSimulationMove(a,1,0));assert.equal(info(a).slot,before.slot);
  for(let i=0;i<3;i++){v.sync();tick(a,.5,true)}assert.equal(info(a).slot,before.slot);assert.equal(info(a).gaitDistance,before.gaitDistance);
  tick(a,.06);assert.equal(info(a).slot,slot(b.row,5));finish(a);assert.equal(info(a).facing,'right');
 }finally{v?.dispose();original.atlasMotion.settles=savedSettles}
});
