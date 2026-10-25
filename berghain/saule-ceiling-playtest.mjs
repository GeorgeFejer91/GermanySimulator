import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {viewpoints} from '../assets/models/berghain/layout.mjs';
import ground from './ground-layout-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView} from './fixture-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...ground.sourceFiles(),...['assets/models/berghain/saule-ceiling.mjs','tests/berghain-saule-ceiling.test.mjs','berghain/saule-ceiling-playtest.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
async function lookUp(ctx,dy){
 const {page,context,profile}=ctx,b=await page.locator('#model').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
 if(profile.hasTouch){
  const touch=await context.newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();
 }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+dy,{steps:6});await page.mouse.up();}
 await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
}

const walking=fallback=>({id:fallback?'ceiling-fallback':'ceiling-walk',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:120000,async run(ctx){
 const {page,artifacts}=ctx;if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await page.goto(ctx.baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 await page.locator('#room').selectOption('saule');await page.waitForFunction(p=>{const a=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(a.x-p.x,a.z-p.z)<.001;},viewpoints.saule.position);
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 let heading=viewpoints.saule.yaw;const views=[];
 for(const [i,x]of [3,-9,-14,3].entries()){
  if(i)heading=(await travel(ctx,{x,y:.05,z:0},heading)).yaw;
  await lookUp(ctx,-110);const view=await assertFirstPersonView(page);
  const pitch=Math.asin(view.direction[1]);assert.ok(pitch>.35&&pitch<.5,'real vertical gesture exposes ceiling');
  views.push(view);await artifacts.screenshot(page,`ceiling-look-${i}.png`);await lookUp(ctx,110);
 }
 const lighting=JSON.parse(await page.locator('#model').getAttribute('data-lighting'));
 assert.equal(lighting.activeLights,3);assert.equal(lighting.shadowMaps,2);
 return {views,lighting,fallback,scope:'Explicit Säule room-selector start, then real keyboard/touch travel and upward/downward looking through all pier bays; no new admission claim'};
}});

const rendering={id:'ceiling-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
 const comparisons=[];
 for(const view of [{position:[3,1.73,0],target:[-9,4.65,0]},{position:[-9,1.73,1],target:[-9,4.7,-2.9]}])comparisons.push(await compareMaterialRender(ctx,view));
 const views=[];
 for(const [name,position,yaw,pitch]of [['aisle',{x:3,y:.05,z:0},Math.PI/2,.30],['pocket',{x:-9,y:.05,z:1},0,.65]])for(const clubNight of [false,true]){
  const result=await renderNativeAsset(ctx.page,{position,yaw,pitch,fov:60,clubNight,rays:[{origin:[-9,4.6,-2.9],direction:[0,1,0]},{origin:[-9,6,-2.9],direction:[0,-1,0]}]});
  for(const values of Object.values(result.geometryProbes)){assert.ok(Math.abs(values[0]-.45)<.002);assert.ok(Math.abs(values[1]-.55)<.002);}
  result.geometryProbes.source.forEach((n,i)=>assert.ok(Math.abs(n-result.geometryProbes.native[i])<.002));
  assert.equal(result.saule.ceiling.pockets.length,6);
  await ctx.artifacts.screenshot(ctx.page,name+(clubNight?'-night':'-day')+'.png');await disposeNativeAsset(ctx.page);
  views.push({name,clubNight,geometry:result.geometryProbes});
 }
 return {comparisons,views,scope:'Source/native pixels and actual capped recess rays, plus controlled day/night views; fitted geometry, not survey accuracy'};
}};
export default {name:'Säule ceiling source/native, real input and fallback',sourceFiles,scenarios:[walking(false),walking(true),rendering]};
