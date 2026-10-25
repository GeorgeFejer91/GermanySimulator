import assert from 'node:assert/strict';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {travel} from './lounge-playtest.mjs';
import lounge from './lounge-playtest.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
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
  if(layout.admission){
    let heading=0;
    for(const target of layout.admission.route.slice(1,9))heading=(await travel(ctx,target,heading)).yaw;
    await cross(ctx);
    for(const target of [...layout.admission.route.slice(10),studyToSite({x:0,y:.05,z:14.4}),studyToSite({x:0,y:.05,z:19.7})])
      heading=(await travel(ctx,target,heading)).yaw;
    await dragLook(page,context,profile,heading/.004);
    return;
  }
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
 scenarios:[{id:'lab-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:150000,async run(ctx){
   const {labParity}=await import('./ground-layout-playtest.mjs');return labParity.run(ctx);
 }},{id:'lab-internal-route',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
   const {labRoute}=await import('./ground-layout-playtest.mjs');return labRoute.run(ctx);
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
