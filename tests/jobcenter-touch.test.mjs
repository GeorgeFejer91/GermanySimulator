import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createJobcenterEncounter} from '../jobcenter.js';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
const data=JSON.parse(readFileSync(new URL('../assets/audio/jobcenter/overlord.json',import.meta.url)));
async function fixture(run){
 const names=['window','document','matchMedia','Audio','fetch','performance','innerWidth','innerHeight'];
 const originals=Object.fromEntries(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let now=0;const elements=[],media=[],keys={};
 class Element extends EventTarget{append(){}remove(){}setAttribute(){}setPointerCapture(){}focus(){}}
 class Media{constructor(){this.currentTime=0;this.paused=true;this.plays=0;media.push(this)}play(){this.paused=false;this.plays++;return Promise.resolve()}pause(){this.paused=true}removeAttribute(){}load(){}}
 const doc=new EventTarget();doc.hidden=false;doc.head=new Element();doc.body={classList:{add(){},remove(){}}};doc.getElementById=id=>id==='app'?new Element():null;doc.createElement=()=>{const e=new Element();elements.push(e);return e};
 const values={window:new EventTarget(),document:doc,matchMedia:()=>({matches:false}),Audio:Media,fetch:async()=>({ok:true,json:async()=>data}),performance:{now:()=>now},innerWidth:390,innerHeight:844};
 for(const [k,value] of Object.entries(values))Object.defineProperty(globalThis,k,{value,configurable:true});
 const encounter=createJobcenterEncounter(T,{render(){}},{getInput:()=>keys,clearInput:()=>{for(const k in keys)delete keys[k]}});
 const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
 const open=async()=>{encounter.open();await flush();return elements.findLast(e=>e.id==='jobcenter-input')};
 const tick=(dt=.1)=>{now+=dt*1000;encounter.render()};
 const pointer=(surface,type,id,x,y)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,pointerType:'touch',clientX:x,clientY:y});surface.dispatchEvent(e)};
 const spread=surface=>{pointer(surface,'pointerdown',1,140,490);pointer(surface,'pointerdown',2,250,490);pointer(surface,'pointermove',1,80,490);pointer(surface,'pointermove',2,310,490)};
 try{await run({encounter,surface:await open(),pointer,spread,tick,flush,media,doc,win:window,open})}
 finally{encounter.close();for(const k of names){if(originals[k])Object.defineProperty(globalThis,k,originals[k]);else delete globalThis[k]}}
}
test('spread-and-hold moves at bounded running speed; inward pinch retreats without changing look',async()=>{
 for(const dt of [1/60,1/30,.1])await fixture(({encounter,surface,pointer,spread,tick})=>{
  const initial=encounter.inspect();spread(surface);for(let i=0;i<2/dt;i++)tick(dt);
  const forward=encounter.inspect();assert.ok(Math.abs(forward.z-(34-14))<1e-7);assert.equal(forward.x,0);assert.equal(forward.yaw,initial.yaw);assert.equal(forward.pitch,initial.pitch);
  pointer(surface,'pointermove',1,180,490);pointer(surface,'pointermove',2,210,490);for(let i=0;i<2/dt;i++)tick(dt);
  assert.ok(Math.abs(encounter.inspect().z-(34-14+7.2))<1e-7);
 });
});
test('neutral separation and two-finger pan do not creep or change view; one-finger controls remain available',async()=>fixture(({encounter,surface,pointer,tick})=>{
 pointer(surface,'pointerdown',1,140,490);pointer(surface,'pointerdown',2,250,490);pointer(surface,'pointermove',2,258,490);tick();assert.equal(encounter.inspect().z,34);
 pointer(surface,'pointermove',1,160,510);pointer(surface,'pointermove',2,270,510);tick();assert.equal(encounter.inspect().z,34);assert.equal(encounter.inspect().yaw,0);
 pointer(surface,'pointerup',1,160,510);pointer(surface,'pointerup',2,270,510);
 pointer(surface,'pointerdown',3,70,650);pointer(surface,'pointermove',3,70,575);tick();assert.ok(encounter.inspect().z<34);pointer(surface,'pointerup',3,70,575);
 const before=encounter.inspect();pointer(surface,'pointerdown',4,280,400);pointer(surface,'pointermove',4,310,360);tick();assert.equal(encounter.inspect().z,before.z);assert.ok(encounter.inspect().yaw<before.yaw);assert.ok(encounter.inspect().pitch>before.pitch);
}));
test('lifting or cancelling either pinch finger stops movement until both fingers are lifted',async()=>{
 for(const type of ['pointerup','pointercancel','lostpointercapture'])for(const id of [1,2])await fixture(({encounter,surface,pointer,spread,tick})=>{
  spread(surface);tick();pointer(surface,type,id,180,490);const stopped=encounter.inspect().z;
  pointer(surface,'pointermove',id===1?2:1,70,400);for(let i=0;i<8;i++)tick();assert.equal(encounter.inspect().z,stopped);
  pointer(surface,'pointerdown',3,300,600);pointer(surface,'pointermove',3,370,600);tick();assert.equal(encounter.inspect().z,stopped);
  for(const remaining of [1,2,3])pointer(surface,'pointerup',remaining,0,0);spread(surface);tick();assert.ok(encounter.inspect().z<stopped);
 });
});
test('third touch, blur, hidden page, HUD pause and rotation cannot retain pinch thrust',async()=>{
 for(const stop of ['third','blur','hidden','pause','resize'])await fixture(({encounter,surface,pointer,spread,tick,doc,win})=>{
  spread(surface);tick();
  if(stop==='third')pointer(surface,'pointerdown',3,195,700);
  if(stop==='blur')win.dispatchEvent(new Event('blur'));
  if(stop==='hidden'){doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'))}
  if(stop==='pause')win.GermanyHUD={paused:true};
  if(stop==='resize')win.dispatchEvent(new Event('resize'));
  tick();const stopped=encounter.inspect().z;
  if(stop==='blur')win.dispatchEvent(new Event('focus'));
  if(stop==='hidden'){doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'))}
  if(stop==='pause')win.GermanyHUD.paused=false;
  pointer(surface,'pointermove',1,30,490);pointer(surface,'pointermove',2,360,490);for(let i=0;i<8;i++)tick();assert.equal(encounter.inspect().z,stopped);
 });
});
test('pinch crosses the real approach gate once, and retired surfaces cannot move a new visit',async()=>fixture(async({encounter,surface,pointer,spread,tick,flush,media,open})=>{
 spread(surface);for(let i=0;i<60;i++)tick();await flush();assert.equal(encounter.inspect().phase,'speaking');assert.equal(encounter.inspect().mediaStarted,true);
 const starts=media[0].plays;for(let i=0;i<5;i++)tick();assert.equal(media[0].plays,starts);
 encounter.close();const next=await open();pointer(surface,'pointermove',2,380,490);tick();assert.equal(encounter.inspect().z,34);
 spread(next);tick();assert.ok(encounter.inspect().z<34);
}));

test('only a completed tap on the real entrance can leave; cancellation and lost capture remain inside',async()=>fixture(({encounter,surface,pointer,tick})=>{
 tick();const exit=encounter.exitView();
 exit.camera.lookAt(exit.door.center());exit.camera.updateMatrixWorld(true);exit.door.group.updateWorldMatrix(true,true);
 for(const type of ['pointercancel','lostpointercapture']){
  pointer(surface,'pointerdown',10,195,422);pointer(surface,type,10,195,422);
  assert.equal(encounter.active,true,type+' must not activate the door');
 }
 pointer(surface,'pointerdown',11,195,422);pointer(surface,'pointerup',11,195,422);
 assert.equal(encounter.active,false,'a completed raycast hit still returns voluntarily');
}));
