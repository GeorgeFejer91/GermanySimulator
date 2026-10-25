import assert from 'node:assert/strict';
import lounge,{travel} from './lounge-playtest.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {assertFirstPersonView,dragLook} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';

const position=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));
async function select(ctx,room){
 await ctx.page.goto(ctx.baseURL+'/geheim/');await ctx.page.locator('#model[data-ready="true"]').waitFor();
 await ctx.page.locator('#room').selectOption(room);await ctx.page.waitForTimeout(100);
 return viewpoints[room].yaw;
}
async function route(ctx,targets,heading,name){
 const records=[];
 for(const [i,target] of targets.entries()){
  try{const r=await travel(ctx,target,heading);heading=r.yaw;records.push(r);}
  finally{await ctx.artifacts.json(name+'-'+i+'.json',{target,actual:await position(ctx.page)});}
  assert.ok(Math.abs((await position(ctx.page)).y-target.y)<.15,'correct floor');
  await assertFirstPersonView(ctx.page);
 }
 return {heading,records};
}
export default {name:'Panorama frontage, sanitary and smoking connections',sourceFiles:lounge.sourceFiles,scenarios:[
 {id:'panorama-registration-views',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
  const samples=[];
  for(const room of ['panorama','lounge','smoking']){
   await select(ctx,room);await assertFirstPersonView(ctx.page);
   await ctx.artifacts.screenshot(ctx.page,room+'-source.png');
   const v=viewpoints[room],native=await renderNativeAsset(ctx.page,{position:v.position,yaw:v.yaw,pitch:v.pitch||0,fov:60,clubNight:true});
   assert.ok(native.panoramaRegistration);assert.deepEqual(native.panoramaRegistration.matrix,layout.panoramaRegistration.matrix);
   assert.ok(native.lighting.activeLights<=3&&native.lighting.shadowMaps<=2);
   await ctx.artifacts.screenshot(ctx.page,room+'-native.png');await disposeNativeAsset(ctx.page);samples.push({room,native});
  }
  return {samples,scope:'Room shortcuts and same-camera source/native night views; Android emulation where selected'};
 }},
 {id:'panorama-registration-parity',profiles:['desktop'],modes:['stress'],timeoutMs:180000,async run(ctx){
  const p=viewpoints.panorama.position;
  return compareMaterialRender(ctx,{position:[p.x,p.y+1.68,p.z],target:[-15.6,14.4,14.4]});
 }},
 {id:'panorama-public-connections',modes:['stress'],timeoutMs:360000,async run(ctx){
  let heading=await select(ctx,'berghain');const r=layout.panoramaRegistration,records=[];
  const path=r.mainApproach;
  let run=await route(ctx,path,heading,'main-up');heading=run.heading;records.push(run);
  await ctx.artifacts.screenshot(ctx.page,'panorama-stair-arrival.png');
  assert.equal(await ctx.page.locator('#room').inputValue(),'panorama','natural ascent identifies Panorama');
  for(const [name,targets] of [['toilets',r.toiletRoute],['lounge',r.loungeRoute]]){
   run=await route(ctx,targets,heading,name+'-out');heading=run.heading;records.push(run);
   await ctx.artifacts.screenshot(ctx.page,name+'-arrival.png');
   run=await route(ctx,targets.toReversed(),heading,name+'-return');heading=run.heading;records.push(run);
  }
  const smoking=[...r.loungeRoute.slice(0,-2),...r.smokingRoute];
  run=await route(ctx,smoking,heading,'smoking-out');heading=run.heading;records.push(run);
  await ctx.artifacts.screenshot(ctx.page,'smoking-public-door.png');
  run=await route(ctx,smoking.toReversed(),heading,'smoking-return');heading=run.heading;records.push(run);
  run=await route(ctx,r.stairRoute.toReversed(),heading,'main-down');records.push(run);
  assert.ok(Math.abs((await position(ctx.page)).y-6.65)<.1);
  return {records,scope:'Main-floor shortcut followed by real keyboard/touch main-to-Panorama, WC, upper lounge, smoking and return; no teleport between destinations'};
 }}
]};
