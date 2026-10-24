import assert from 'node:assert/strict';
import lounge,{travel} from './lounge-playtest.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
import {cross} from './lab-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

const pos=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));
const lit=async page=>JSON.parse(await page.locator('#model').getAttribute('data-lighting'));
export default {name:'Photograph-informed entrance and reported admission sequence',sourceFiles:lounge.sourceFiles,scenarios:[
 {id:'admission-close-hinge',modes:['quick','stress'],timeoutMs:90000,async run(ctx){
  const {page,baseURL,artifacts}=ctx;const results=[];
  for(const x of [-.35,.35]){
   await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
   let heading=(await travel(ctx,{x:0,y:.05,z:23.6},0)).yaw;
   heading=(await travel(ctx,{x,y:.05,z:22.8},heading)).yaw;
   await artifacts.screenshot(page,x<0?'left-hinge-before.png':'right-hinge-before.png');
   await cross(ctx);assert.ok((await pos(page)).z<20.28);await assertFirstPersonView(page);
   results.push(await pos(page));
  }
  return {results,limits:'Real keyboard/touch close-hinge entry from both sides; substep speed/body separation proved in CPU regression.'};
 }},
 {id:'admission-natural-route',modes:['quick','stress'],timeoutMs:220000,async run(ctx){
  const {page,baseURL,artifacts}=ctx;
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  await assertFirstPersonView(page);await artifacts.screenshot(page,'outside-arrival.png');
  await dragLook(page,ctx.context,ctx.profile,1/.004);await artifacts.screenshot(page,'ring-assembly.png');
  await dragLook(page,ctx.context,ctx.profile,-1/.004);
  let heading=0;const records=[];
  // Real inputs through each switchback; door interaction then security/cashier/wardrobe.
  for(const target of layout.admission.route.slice(1,9)){
   const step=await travel(ctx,target,heading);heading=step.yaw;records.push(step);
  }
  await artifacts.screenshot(page,'door-approach.png');await cross(ctx);
  for(const [i,target] of layout.admission.route.slice(10).entries()){
   const step=await travel(ctx,target,heading);heading=step.yaw;records.push(step);
   if(i===0){assert.equal((await lit(page)).room,'admission');await artifacts.screenshot(page,'inspection-approach.png');}
   if(i===2){await dragLook(page,ctx.context,ctx.profile,heading/.004);heading=0;await artifacts.screenshot(page,'cashier-approach.png');}
  }
  assert.equal((await lit(page)).room,'foyer');await artifacts.screenshot(page,'wardrobe-arrival.png');
  // Reverse the public room route, leave by the same working entrance door.
  for(const target of [...layout.admission.route.slice(9,-1)].reverse()){
   const step=await travel(ctx,target,heading);heading=step.yaw;records.push(step);
  }
  const step=await travel(ctx,{x:0,y:.05,z:20.25},heading);heading=step.yaw;
  await cross(ctx);assert.ok((await pos(page)).z>24);await assertFirstPersonView(page);
  await artifacts.screenshot(page,'outside-return.png');await artifacts.json('route.json',records);
  return {segments:records.length,returned:await pos(page),limits:'Real keyboard/touch inputs, one visitor; emulated devices, no crowd simulation or measured-room claim.'};
 }},
 {id:'admission-source-native',modes:['quick','stress'],timeoutMs:150000,async run({page,baseURL,artifacts}){
  await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();await page.locator('#enter').click();
  const samples=[];
  for(const name of ['queue','admission']){
   await page.locator('#room').selectOption(name);await page.waitForTimeout(150);await assertFirstPersonView(page);
   await artifacts.screenshot(page,name+'-source.png');
   const view=viewpoints[name],a=studyToSite({x:-5.25,y:1.73,z:19});
   const rays=name==='admission'?[{origin:[a.x,a.y,a.z],direction:[0,1,0]},{origin:[a.x,a.y,a.z],direction:[-1,0,0]}]:[];
   const native=await renderNativeAsset(page,{position:view.position,yaw:view.yaw,fov:60,clubNight:true,rays});
   assert.ok(native.admission);assert.deepEqual(native.admission.sources,layout.admission.sources);
   for(let i=0;i<rays.length;i++)assert.ok(Math.abs(native.geometryProbes.source[i]-native.geometryProbes.native[i])<.005);
   await artifacts.screenshot(page,name+'-native.png');await disposeNativeAsset(page);samples.push({name,native});
  }
  await page.locator('#exterior').click();
  await page.waitForFunction(()=>document.querySelector('#model').dataset.view==='exterior');
  assert.equal((await lit(page)).daylight,true);
  await artifacts.screenshot(page,'restored-daylight.png');await artifacts.json('native.json',samples);return {samples};
 }},
 {id:'admission-fallback-labels',modes:['quick','stress'],timeoutMs:90000,async run({page,baseURL,artifacts}){
  await page.route('**/assets/models/berghain/textures/**',route=>route.abort());
  await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();await page.locator('#enter').click();
  const rows=[];
  for(const name of ['queue','admission']){
   await page.locator('#room').selectOption(name);
   for(const [width,height] of [[320,740],[740,320],[1280,800]])for(const font of [16,32]){
    await page.setViewportSize({width,height});
    await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',font);await page.waitForTimeout(120);
    rows.push(await page.evaluate(()=>{
     const controls=[...document.querySelectorAll('button,select')].filter(e=>!e.hidden&&e.getBoundingClientRect().width);
     return {viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,
      labels:controls.map(e=>({label:e.id,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,scroll:e.scrollWidth,client:e.clientWidth})),
      location:document.querySelector('#location').textContent,ready:document.querySelector('#model').dataset.ready,
      measurement:document.documentElement.dataset.textMeasurement,
      clipped:[...document.querySelectorAll('[data-measure]')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id),
      selected:document.querySelector('#room').selectedOptions[0].textContent,
      selectFit:document.querySelector('#room').dataset.fit,
      fullName:document.querySelector('#room-full-name').textContent};
    }));
    assert.equal(rows.at(-1).overflow,false);assert.equal(rows.at(-1).ready,'true');
    assert.equal(rows.at(-1).measurement,'pretext-0.0.9');assert.deepEqual(rows.at(-1).clipped,[]);
    assert.ok(rows.at(-1).selectFit==='fit'||rows.at(-1).selected===rows.at(-1).fullName);
   }
   await artifacts.screenshot(page,name+'-texture-fallback.png');
  }
  await artifacts.json('fallback-labels.json',rows);return {rows,limits:'Network-blocked surface textures; original geometry/material fallback; selected labels at three bounded sizes.'};
 }}
]};
