import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
const root=process.cwd(),code=process.env.STREET_ATLAS_MODULE_ROOT||root;
const S=await import(pathToFileURL(resolve(code,'street-character-sprites.js')));
const T=await import(pathToFileURL(resolve(root,'assets/vendor/three/0.186.0/build/three.core.js')));
vm.runInThisContext(readFileSync(resolve(code,'tourist-animation.js'),'utf8'));
const directions=['down','right','up','left'];
function person(){
 const walks=Object.fromEntries(directions.map((d,row)=>[d,{row,frames:16,frame_ms:60}]));
 const bridges=Object.fromEntries(directions.map((d,i)=>[d,{row:i+4,stop_cols:[0,1,2],start_cols:[3,4],frame_ms:70}]));
 const transitions={};
 for(const from of directions)for(const to of directions)if(from!==to)transitions[from+'-to-'+to]={frames:[...bridges[from].stop_cols.map(col=>({row:bridges[from].row,col,ms:70})),{row:8,col:directions.indexOf(to),ms:70},...bridges[to].start_cols.map(col=>({row:bridges[to].row,col,ms:70}))]};
 return {id:'packed-person',cell:[128,160],figureHeight:136,figureWorldHeight:1.6,pivot:[64,150],grid:[21,17],strideDistance:25.6,
  standing:{file:'./assets/characters/street/packed-standing.webp',width:128,height:160,sha256:'a'.repeat(64)},
  variants:{desktop:{file:'./assets/characters/street/packed-desktop.webp',width:2016,height:2040,sha256:'b'.repeat(64)},mobile:{file:'./assets/characters/street/packed-mobile.webp',width:1848,height:1870,sha256:'c'.repeat(64)}},
  clips:{...Object.fromEntries(directions.map((d,row)=>[d,{offset:row*21,count:16}])),idle:{offset:4*21+2,count:1}},
  atlasMotion:{schemaVersion:1,walks,bridges,transitions,neutral:{row:4,col:2},settles:{left:{'4':{frames:[{row:0,col:16,ms:70},{row:7,col:2,ms:70}]}}}}
 };
}
function register(p){return S.registerStreetCharacterManifest({schemaVersion:1,characters:{'packed-person':p}})}

test('21-column settle packing admits unused walk-row columns16..20 but rejects every actual walk cell',()=>{
 const p=person();
 for(let row=0;row<4;row++)for(let col=16;col<=20;col++){
  p.atlasMotion.settles.left['4'].frames[0]={row,col,ms:70};assert.doesNotThrow(()=>register(p),`dedicated ${row}:${col}`);
 }
 for(let row=0;row<4;row++)for(let col=0;col<16;col++){
  p.atlasMotion.settles.left['4'].frames[0]={row,col,ms:70};assert.throws(()=>register(p),`walk ${row}:${col}`);
 }
 for(const [row,col] of [[0,21],[17,0],[-1,16],[0,-1]]){p.atlasMotion.settles.left['4'].frames[0]={row,col,ms:70};assert.throws(()=>register(p))}
 const mismatch=person();mismatch.clips.right.offset=16;assert.throws(()=>register(mismatch));
});

for(const variant of ['desktop','mobile'])test(`packed ${variant} presentation preserves canonical scale/pivot and addresses21-column cells`,async()=>{
 const p=person();register(p);const a={voiceId:'packed-person',x:0,y:0},jobs=[],requests=[];
 const three={...T,TextureLoader:class{load(url,ok){requests.push({url,ok})}}},host=new T.Group(),camera=new T.PerspectiveCamera();camera.rotation.set(.4,.2,0);
 const queue=(position,radius,task,owner)=>{const job={task,owner};jobs.push(job);return job};
 const old=globalThis.innerWidth;globalThis.innerWidth=variant==='mobile'?390:1280;
 const view=S.createStreetCharacterSprite(three,a,host,queue,camera);
 try{
  const initial=jobs.at(-1).task();await Promise.resolve();requests.shift().ok(new T.Texture({width:128,height:160}));assert.equal(await initial,true);
  const pending=view.prepareMotion().task();await Promise.resolve();const request=requests.shift(),atlas=p.variants[variant];assert(request.url.startsWith(atlas.file));request.ok(new T.Texture({width:atlas.width,height:atlas.height}));assert.equal(await pending,true);view.sync();
  const sprite=host.children.find(x=>x.userData.streetPaint),scale=1.6/136;
  assert.equal(sprite.geometry.parameters.width,128*scale);assert.equal(sprite.geometry.parameters.height,160*scale);
  const localPivot=new T.Vector3((64-128/2)*scale,(160/2-150)*scale,0).applyQuaternion(sprite.quaternion).add(sprite.position);
  assert(localPivot.length()<1e-12,'canonical sole pivot stays on host root');
  const ratio=atlas.width/21/128;assert.equal(atlas.height/17/160,ratio);
  assert.deepEqual([64*ratio,150*ratio],variant==='desktop'?[48,112.5]:[44,103.125]);
  assert.equal(136*ratio,variant==='desktop'?102:93.5);
  assert.equal(view.inspect().pose.slot,86);
  const tick=dt=>S.tickStreetSimulation(a,dt,{rootWorld:[a.x*.02,0,0],paused:false});
  assert(S.requestStreetSimulationMove(a,-1,0));for(let i=0;S.inspectStreetSimulation(a).atlasMotion.plan;i++){assert(i<100);tick(.07)}
  a.x=-p.strideDistance*4.5/16;S.acceptStreetSimulationSegment(a,{fromRoot:[0,0,0],toRoot:[a.x*.02,0,0],dx:a.x,dy:0,distance2d:-a.x});tick(.01);
  assert.equal(S.inspectStreetSimulation(a).atlasMotion.slot,3*21+4);
  assert(S.requestStreetSimulationMove(a,1,0));assert.equal(S.inspectStreetSimulation(a).atlasMotion.slot,67);tick(.06);view.sync();
  assert.equal(S.inspectStreetSimulation(a).atlasMotion.slot,16,'dedicated cell in unused part of row0');
  const uv=Array.from(sprite.geometry.attributes.uv.array),expected=[16/21,1,17/21,1,16/21,1-1/17,17/21,1-1/17];
  uv.forEach((v,i)=>assert(Math.abs(v-expected[i])<1e-7));
 }finally{view.dispose();globalThis.innerWidth=old}
});
