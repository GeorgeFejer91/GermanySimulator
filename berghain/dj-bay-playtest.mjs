import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import ceiling from './saule-ceiling-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView,dragLook} from './fixture-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...ceiling.sourceFiles(),...['assets/models/berghain/main-dj-bay.mjs','tests/berghain-dj-bay.test.mjs','berghain/dj-bay-playtest.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const walk=fallback=>({id:fallback?'dj-bay-fallback':'dj-bay-walk',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:120000,async run(ctx){
 const {page,context,profile,artifacts}=ctx;if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await page.goto(ctx.baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 await page.locator('#room').selectOption('berghain');await page.waitForFunction(p=>{const a=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(a.x-p.x,a.z-p.z)<.001;},viewpoints.berghain.position);
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 let heading=viewpoints.berghain.yaw;const steps=[];
 for(const [i,[x,z]]of [[-11.2,viewpoints.berghain.position.z],[-11.2,-4],[-13.8,-4],[-13.8,1],[-11.2,1],[-11.2,-4]].entries()){
  const result=await travel(ctx,{x,y:5.45,z},heading);heading=result.yaw;steps.push(result);
  if([1,2,4].includes(i)){
   const yaw=Math.atan2(result.position.x+18.6,result.position.z+4),turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
   await dragLook(page,context,profile,-turn/.004);heading=yaw;
   await assertFirstPersonView(page);await artifacts.screenshot(page,`dj-bay-${i}.png`);
   const lighting=JSON.parse(await page.locator('#model').getAttribute('data-lighting'));
   assert.equal(lighting.room,'mainDJ');assert.equal(lighting.activeLights,3);assert.equal(lighting.shadowMaps,2);
  }
 }
 return {steps,fallback,scope:'Explicit main-floor selector, real keyboard/touch approach, near-guard side travel and return; no new private access or natural-admission claim'};
}});
const rendering={id:'dj-bay-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
 const comparisons=[];
 for(const view of [{position:[-11.2,7.13,-4],target:[-18.6,7.5,-4]},{position:[-11.2,7.13,1],target:[-18.6,7.5,-4]}])comparisons.push(await compareMaterialRender(ctx,view));
 const samples=[],o=layout.mainHallRegistration.djBay.opening,x=(o.front+o.back)/2;
 const rays=[{origin:[x,7.25,-4],direction:[0,0,1]},{origin:[x,7.25,-4],direction:[0,0,-1]},{origin:[x,7.25,-4],direction:[-1,0,0]},{origin:[x,7.7,-4],direction:[0,1,0]}];
 for(const [name,position,yaw]of [['front',{x:-11.2,y:5.45,z:-4},Math.PI/2],['oblique',{x:-11.2,y:5.45,z:1},Math.atan2(7.4,5)]])for(const clubNight of [false,true]){
  const result=await renderNativeAsset(ctx.page,{position,yaw,pitch:.15,fov:60,clubNight,rays});
  const g=result.geometryProbes;g.source.forEach((n,i)=>assert.ok(Math.abs(n-g.native[i])<.002));
  for(const values of Object.values(g)){assert.ok(Math.abs(values[0]-1.75)<.002);assert.ok(Math.abs(values[1]-1.75)<.002);assert.ok(values[2]>.15&&values[2]<.3);assert.ok(Math.abs(values[3]-.3)<.002);}
  if(clubNight)assert.equal(result.lighting.room,'mainDJ');
  await ctx.artifacts.screenshot(ctx.page,name+(clubNight?'-night':'-day')+'.png');await disposeNativeAsset(ctx.page);
  samples.push({name,clubNight,geometry:g,lighting:result.lighting});
 }
 return {comparisons,samples,scope:'Controlled source/native pixels, recess side/head/curtain rays and day/night frames; provisional photographic fit'};
}};
export default {name:'Main DJ bay source/native, night lighting and public approach',sourceFiles,scenarios:[walk(false),walk(true),rendering]};
