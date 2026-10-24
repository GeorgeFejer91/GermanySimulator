import assert from 'node:assert/strict';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {travel} from './lounge-playtest.mjs';
import lounge from './lounge-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';

const position=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));
export async function cross({page,profile}){
  await page.locator('#interact').waitFor({state:'visible'});
  if(profile.hasTouch)await page.locator('#interact').tap();
  else{await page.locator('#model').focus();await page.keyboard.press('e');}
  await page.waitForFunction(()=>document.querySelector('#model').dataset.crossing==='true');
  await page.waitForFunction(()=>document.querySelector('#model').dataset.crossing==='false',null,{timeout:20000});
}
export async function enterNaturally(ctx){
  const {page,baseURL,profile,context}=ctx;
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  let touch;
  if(profile.hasTouch){
    touch=await context.newCDPSession(page);const b=await page.locator('[data-move="forward"]').boundingBox();
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
  }else{await page.locator('#model').focus();await page.keyboard.down('w');}
  try{await page.waitForFunction(()=>JSON.parse(document.querySelector('#model').dataset.position).z<24.9);}
  finally{
    if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}
    else await page.keyboard.up('w');
  }
  await cross(ctx);assert.ok((await position(page)).z<22);
}

export default {name:'Lab.oratory photographed industrial interior and connected human circulation',sourceFiles:lounge.sourceFiles,
 scenarios:[{id:'lab-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
   const {page,baseURL,artifacts}=ctx;
   await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
   await page.locator('#enter').click();await page.locator('#room').selectOption('lab');
   await artifacts.screenshot(page,'lab-room-source.png');
   const a=studyToSite({x:-5,y:1.8,z:2.6}),b=studyToSite({x:-3,y:1.8,z:2.6});
   const span=Math.hypot(a.x-b.x,a.z-b.z),asArray=p=>[p.x,p.y,p.z];
   const rays=[{origin:asArray(a),direction:[b.x-a.x,0,b.z-a.z]},
     {origin:asArray(b),direction:[a.x-b.x,0,a.z-b.z]},
     ...[-4.3,-3.5,-3.8].map(x=>({origin:asArray(studyToSite({x,y:.05,z:2.6})),direction:[0,1,0]}))];
   const native=await renderNativeAsset(page,{position:viewpoints.lab.position,yaw:viewpoints.lab.yaw,rays});
   for(const samples of Object.values(native.geometryProbes)){
     assert.ok(samples[0]>span&&samples[1]>span,'real clear gate aperture in both directions');
     assert.ok(Math.abs(samples[2]-4.1)<.002,'lower Lab roof ends at its own seam');
     assert.ok(samples[3]>5.9,'taller Säule roof remains beyond the seam');
     assert.ok(Math.abs(samples[4]-2.6)<.002,'raised gate retains its real clear height');
   }
   native.geometryProbes.source.forEach((d,i)=>assert.ok(Math.abs(d-native.geometryProbes.native[i])<.002,'source/native portal rays match'));
   assert.equal(native.labOratory.sanitaryDrop,1.2);assert.equal(native.fixtures,layout.fixtures.length);
   assert.equal(native.artworks,2);assert.equal(native.equipment,44);
   await artifacts.screenshot(page,'lab-room-native.png');await disposeNativeAsset(page);
   const close=await travel(ctx,studyToSite({x:-12.8,y:.05,z:-12.8}),viewpoints.lab.yaw);
   const bar=layout.fixtures.find(f=>f.id==='lab-pipe-bar');
   const yaw=Math.atan2(close.position.x-bar.anchor[0],close.position.z-bar.anchor[2]);
   await dragLook(page,ctx.context,ctx.profile,-(yaw-close.yaw)/.004);
   await artifacts.screenshot(page,'lab-pipe-bar-source.png');
   await renderNativeAsset(page,{position:close.position,yaw});
   await artifacts.screenshot(page,'lab-pipe-bar-native.png');await disposeNativeAsset(page);
   const cage=layout.fixtures.find(f=>f.id==='lab-cage-0'),screen=layout.fixtures.find(f=>f.id==='lab-green-screen');
   for(const [name,view]of [
     ['lab-cells',{position:{x:cage.anchor[0]+.3,y:.05,z:cage.anchor[2]+2.4},yaw:.12,pitch:-.05}],
     ['lab-green-cast',{position:{x:screen.anchor[0]+3.2,y:.05,z:screen.anchor[2]+.3},yaw:Math.PI/2,pitch:0}],
     ['lab-sanitary-opening',{position:studyToSite({x:-17.4,y:.05,z:.8}),yaw:Math.PI,pitch:-.6}]
   ]){
     await renderNativeAsset(page,view);await artifacts.screenshot(page,name+'-native.png');await disposeNativeAsset(page);
   }
   return {native,close:close.position,scope:'Source controls/native GLB and controlled native detail; footprint/dimensions/currentness inferred'};
 }},{id:'lab-natural-route',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
   const {page,artifacts}=ctx;await enterNaturally(ctx);let heading=0;const route=[];
   await artifacts.screenshot(page,'human-entered-from-outside.png');
   const targets=[[5,15],[5,4],[2,2.6],[-5.2,2.6],[-8.5,2.6],[-8.5,-8.5],[-12.8,-12.8],[-8.5,-8.5],[-8.5,2.6],[-17.4,.8],[-17.4,5.1]];
   for(let i=0;i<targets.length;i++){
     const [x,z]=targets[i],end=await travel(ctx,studyToSite({x,y:i===targets.length-1?-1.15:.05,z}),heading);
     heading=end.yaw;route.push(end.position);
     if([3,6,9,10].includes(i))await artifacts.screenshot(page,['','','','human-through-lab-gate','','','human-at-lab-bar','','','human-at-sanitary-stair','human-lower-sanitary-landing'][i]+'.png');
   }
   assert.ok(Math.abs(route.at(-1).y+1.15)<.06);assert.equal(await page.locator('#room').inputValue(),'lab');
   const camera=Number(await page.locator('#model').getAttribute('data-camera-distance'));assert.ok(Number.isFinite(camera)&&camera>.08);
   for(const [x,z]of [...targets.slice(0,-1).reverse(),[0,19.7],[0,20.25]]){
     const end=await travel(ctx,studyToSite({x,y:.05,z}),heading);heading=end.yaw;route.push(end.position);
   }
   assert.ok(Math.abs(route.at(-1).y-.05)<.001);await cross(ctx);assert.ok((await position(page)).z>22);
   await artifacts.screenshot(page,'human-outside-after-lab.png');
   await page.reload();await page.locator('#model[data-ready="true"]').waitFor();assert.ok((await position(page)).z>22);
   return {route,camera,input:ctx.profile.hasTouch?'Real touch movement and door tap':'Real keyboard/mouse and E',
     scope:'Natural exterior approach/entry → Säule → Lab/bar → real sanitary descent/return → exterior exit/refresh; no selector or forced placement'};
 }},{id:'lab-material-parity',modes:['stress'],profiles:['desktop'],async run(ctx){
   const bar=layout.fixtures.find(f=>f.id==='lab-pipe-bar');
   return compareMaterialRender(ctx,{position:[bar.anchor[0]+1,2.2,bar.anchor[2]+3],target:[bar.anchor[0],1.9,bar.anchor[2]-.7]});
 }},{id:'lab-text-layout',modes:['stress'],profiles:['desktop'],async run({page,baseURL,artifacts}){
   await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();await page.locator('#enter').click();
   const samples=[];
   for(const viewport of [{width:320,height:740},{width:740,height:320},{width:1280,height:800},{width:2400,height:1400}])
     for(const enlarged of [false,true]){
       await page.setViewportSize(viewport);await page.evaluate(v=>document.documentElement.style.fontSize=v?'32px':'16px',enlarged);
       await page.locator('#room').selectOption('lab');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(120);
       const sample=await page.evaluate(()=>({measurement:document.documentElement.dataset.textMeasurement,
         horizontal:document.documentElement.scrollWidth>innerWidth+1,
         clipped:[...document.querySelectorAll('[data-measure]')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id),
         selected:document.querySelector('#room').selectedOptions[0].textContent,fit:document.querySelector('#room').dataset.fit,
         full:document.querySelector('#room-full-name').hidden?null:document.querySelector('#room-full-name').textContent}));
       assert.equal(sample.measurement,'pretext-0.0.9');assert.equal(sample.horizontal,false);assert.deepEqual(sample.clipped,[]);
       assert.ok(sample.fit==='fit'||sample.full===sample.selected);samples.push({viewport,enlarged,...sample});
     }
   await artifacts.screenshot(page,'lab-name-200-percent.png');return {samples};
 }},{id:'surface-admission-resume',modes:['stress'],async run({page,baseURL}){
   await page.addInitScript(()=>{
     window.__testHidden=true;
     Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__testHidden});
     let api;
     Object.defineProperty(window,'GermanyAssetQueue',{configurable:true,get:()=>api,set:value=>{
       api=value;const create=api.createAssetQueue;
       api.createAssetQueue=options=>{
         const queue=create(options),enqueue=queue.enqueue;
         const evidence={queue,active:0,peak:0,started:0,hiddenStarts:0};window.__surfaceAdmission=evidence;
         queue.enqueue=(task,settings)=>enqueue(async args=>{
           evidence.active++;evidence.started++;evidence.peak=Math.max(evidence.peak,evidence.active);
           if(document.hidden)evidence.hiddenStarts++;
           try{return await task(args);}finally{evidence.active--;}
         },settings);return queue;
       };
     }});
   });
   await page.goto(baseURL+'/geheim/');
   await page.waitForFunction(()=>window.__surfaceAdmission?.queue.inspect().pending===26);
   assert.equal(await page.evaluate(()=>window.__surfaceAdmission.started),0,'hidden-state loader starts no optional image work');
   await page.evaluate(()=>{window.__testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
   await page.locator('#model[data-ready="true"]').waitFor();
   const evidence=await page.evaluate(()=>{const {active,peak,started,hiddenStarts,queue}=window.__surfaceAdmission;
     delete document.hidden;return {active,peak,started,hiddenStarts,queue:queue.inspect()};});
   assert.equal(evidence.peak,2);assert.equal(evidence.started,26);assert.equal(evidence.hiddenStarts,0);
   assert.equal(evidence.active,0);assert.deepEqual(evidence.queue,{active:0,pending:0});
   return {...evidence,scope:'Real image loads and shared queue; deterministic simulated hidden getter/visibility event, not a physical background-device qualification'};
 }}]};
