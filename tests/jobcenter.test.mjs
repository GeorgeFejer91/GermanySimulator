import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {stepJobcenter,sampleJobcenterEnvelope,createJobcenterEncounter,createJobcenterBuilding} from '../jobcenter.js';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const data=JSON.parse(readFileSync(new URL('../assets/audio/jobcenter/overlord.json',import.meta.url)));
const fresh=()=>({x:0,z:34,yaw:0,pitch:0,time:0,distance:34,pressure:0});
test('approach is necessary; movement remains unbounded and frame-rate independent',()=>{
 for(const dt of [1/60,1/30,.1]){
  const s=fresh();for(let i=0;i<10/dt;i++)assert.equal(stepJobcenter(s,{KeyS:true},dt),false);
  assert.ok(Math.abs(s.distance-70)<1e-7);assert.equal(s.pressure,0);
  let entered=false;for(let i=0;i<18/dt;i++)entered=stepJobcenter(s,{KeyW:true},dt)||entered;
  assert.ok(entered);assert.ok(s.pressure>.9);
  for(let i=0;i<120/dt;i++)stepJobcenter(s,{KeyD:true,KeyR:true},dt);
  assert.ok(s.x>800,'no invisible room wall or city boundary');
 }
 const a=fresh(),b=fresh();stepJobcenter(a,{KeyW:true},.1);stepJobcenter(b,{KeyW:true,KeyD:true},.1);
 assert.ok(Math.abs(Math.hypot(b.x,b.z-34)-Math.hypot(a.x,a.z-34))<1e-9,'diagonals cannot move faster');
 const turned=fresh();turned.yaw=Math.PI;stepJobcenter(turned,{KeyW:true},.1);assert.ok(turned.z>34,'forward follows view');
});
test('encoded-media envelopes are finite, bounded and end in silence',()=>{
 assert.ok(data.duration>25&&data.duration<30);assert.equal(data.sampleHz,40);
 assert.ok(Math.abs(data.energy.length/data.sampleHz-data.duration)<.1);
 const observed=[];for(let t=0;t<data.duration;t+=.025){const e=sampleJobcenterEnvelope(data,t);assert.ok(Number.isFinite(e.energy)&&e.energy>=0&&e.energy<=1);assert.ok(e.attack>=0&&e.attack<=1);observed.push(e.energy)}
 assert.ok(Math.max(...observed)>.9);assert.ok(Math.min(...observed)<.01);
 assert.deepEqual(sampleJobcenterEnvelope(data,data.duration+1),{energy:0,attack:0});
 assert.equal(createHash('sha256').update(readFileSync(new URL('../assets/audio/jobcenter/overlord.mp3',import.meta.url))).digest('hex'),'ba05a622509a990deee97950c9ae99a47868a9969067c991d7c55ac1920f7379');
});
test('city entry/exit preserves missions and rejects an occupied ejection point',()=>{
 const start=game.indexOf('function enterJobcenter('),end=game.indexOf('\nfunction interact()',start),entry=game.slice(start,end);
 for(const occupied of [false,true]){
  let config;const player={x:100,y:230,r:16,vx:10,vy:20},state={modal:false,mission:4,forms:2,voiceOn:true,subtitlesOn:false};
  const h={player,state,window:{Germany3D:{enterJobcenter:c=>(config=c,true)}},speechClip:()=>({text:data.text,recording:'voice'}),speechCatalog:{recordings:{}},stopSpeech(){},stopPoliceChaseLoop(){},clearInput(){},setAmtMusicMuted(){},clearSubtitle(){},updateHud(){},responderBlocked:()=>occupied};
  vm.createContext(h);vm.runInContext(entry,h);h.enterJobcenter({doorX:100,doorY:200});
  assert.equal(state.modal,true);assert.equal(player.vx,0);config.onClose('ended');
  assert.equal(state.modal,false);assert.equal(state.mission,4);assert.equal(state.forms,2);assert.equal(player.y,occupied?230:265);
 }
});
test('root and diagnostic reserve the same clear roadside parcel and usable entrance',()=>{
 const diagnostic=readFileSync(new URL('../3d.html',import.meta.url),'utf8');
 const line=s=>s.split('\n').find(l=>l.startsWith('{id:"jobcenter"'));
 assert.equal(line(game),line(diagnostic));
 const b=vm.runInNewContext('('+line(game).trim().replace(/,$/,'')+')');
 assert.ok(b.x>=9180+72,'east sidewalk has full body clearance');assert.ok(b.x+b.w<9840);
 assert.ok(b.doorY>b.y+b.h+16);assert.ok(b.doorY<2000-72);
 assert.match(game,/if\(b.id==="jobcenter"\)\{enterJobcenter\(b\);return\}/);
});

test('facade details stay below the roof while the door retains human clearance',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'document');
 const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
 Object.defineProperty(globalThis,'document',{value:{createElement:()=>({getContext:()=>context})},configurable:true});
 try{
  const line=game.split('\n').find(l=>l.startsWith('{id:"jobcenter"'));
  const b=vm.runInNewContext('('+line.trim().replace(/,$/,'')+')');
  const {group}=createJobcenterBuilding(T,b.w*.02,b.h*.02,b.hgt*.038);
  const bounds=new T.Box3().setFromObject(group);
  assert.ok(Math.abs(bounds.max.y-b.hgt*.038)<1e-6,'upper windows and glass bay must fit the reduced facade');
  assert.ok(bounds.max.y<7,'office stays below the 8.22 m government landmark');
  assert.ok(group.userData.jobcenter.doorHeight>1.45+.5,'existing person clears entrance');
  group.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose()});
 }finally{if(original)Object.defineProperty(globalThis,'document',original);else delete globalThis.document}
});

test('media receipts own ejection; pause, failure and stale visits have bounded cleanup',async()=>{
 const names=['window','document','matchMedia','Audio','fetch','performance','innerWidth','innerHeight'];
 const originals=Object.fromEntries(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let now=0;const media=[],keys={},closed=[],elements=[];
 class Element extends EventTarget{append(){} remove(){this.removed=true} setAttribute(){} setPointerCapture(){} focus(){} }
 class Media{constructor(){this.currentTime=0;this.paused=true;media.push(this)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}removeAttribute(){this.src=''}load(){} }
 const doc=new EventTarget();doc.hidden=false;doc.head=new Element();doc.body={classList:{add(){},remove(){}}};doc.createElement=()=>{const e=new Element();elements.push(e);return e};doc.getElementById=id=>id==='app'?new Element():null;
 const values={window:new EventTarget(),document:doc,matchMedia:()=>({matches:false}),Audio:Media,fetch:async()=>({ok:true,json:async()=>data}),performance:{now:()=>now},innerWidth:1280,innerHeight:800};
 for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{value,configurable:true});
 try{
  const encounter=createJobcenterEncounter(T,{render(){}},{getInput:()=>keys,clearInput:()=>{for(const k in keys)delete keys[k]}});
  const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve()};
  const tick=()=>{now+=100;encounter.render()};
  const enter=async()=>{encounter.open({onClose:r=>closed.push(r)});await flush();keys.KeyW=true;for(let i=0;i<60;i++)tick();delete keys.KeyW;await flush();assert.equal(encounter.inspect().phase,'speaking')};
  await enter();const first=media.at(-1),oldEnd=first.onended;
  first.currentTime=3;tick();assert.ok(encounter.inspect().energy>0);
  for(let i=0;i<20;i++)tick();assert.equal(encounter.active,true,'elapsed scene time cannot finish the voice');
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));const before=encounter.inspect().z;keys.KeyW=true;tick();assert.equal(encounter.inspect().z,before);assert.equal(first.paused,true);
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(first.paused,false);
  first.currentTime=data.duration;first.onended();assert.equal(encounter.active,false);assert.deepEqual(closed,['ended']);assert.equal(first.paused,true);assert.equal(first.src,'');
  await enter();oldEnd();assert.equal(encounter.active,true,'stale completion cannot eject a new visit');
  media.at(-1).onerror();assert.equal(encounter.inspect().failed,true);
  for(let i=0;i<270;i++)tick();assert.equal(encounter.active,false);assert.deepEqual(closed,['ended','fallback-ended']);
  encounter.open({onClose:r=>closed.push(r)});await flush();encounter.close();assert.equal(elements.every(e=>e.removed),true);assert.ok(media.every(m=>m.paused));
 }finally{for(const name of names){if(originals[name])Object.defineProperty(globalThis,name,originals[name]);else delete globalThis[name]}}
});
