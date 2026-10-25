import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {groundLabPoint} from '../assets/models/berghain/ground-registration.mjs';
import lounge,{travel} from './lounge-playtest.mjs';
import {enterNaturally} from './lab-playtest.mjs';
import {assertFirstPersonView,dragLook,forward} from './fixture-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...lounge.sourceFiles(),...['berghain/ground-layout-playtest.mjs','berghain/night-lighting.mjs','berghain/footsteps.mjs',
 'berghain/lab-playtest.mjs','berghain/halle-playtest.mjs','tests/berghain-ground-registration.test.mjs'].map(path=>({path,
 sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const world=([x,z,y=.05])=>({x,y,z});
const lab=(x,z,y=.05)=>{const p=studyToSite({x,y,z}),[a,b,c]=groundLabPoint([p.x,p.y,p.z]);return{x:a,y:b,z:c};};
async function select(ctx,room){
 await ctx.page.goto(ctx.baseURL+'/geheim/');await ctx.page.locator('#model[data-ready="true"]').waitFor();
 await ctx.page.locator('#room').selectOption(room);
 await ctx.page.waitForFunction(p=>{const a=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(a.x-p.x,a.y-p.y,a.z-p.z)<.01;},viewpoints[room].position);
}

export const groundRoute={id:'ground-body-route',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:300000,async run(ctx){
 const {page,artifacts}=ctx;await enterNaturally(ctx);let heading=0;const samples=[];
 const route=[studyToSite({x:5,y:.05,z:15}),...[[9,15],[9,0],[3,0],[-14,0],[3,0],[3,5],[-9,5],[-9,9],[-9,5],[-5,5],[-5,9],[-5,5],[-1,5],[-1,9],[-1,5],[-17.3,5],[-17.3,9.5],[-10.4,9.5,2.7],[-5,9.5,2.7],[.4,9.5,2.7],[6.8,9.5],[6.8,0],[9,0],[9,-2.2],[8.424688967975206,-2.2]].map(world),
  ...layout.architecturalCirculation.mainStair.siteRoute];
 for(const [i,target]of route.entries()){
  const end=await travel(ctx,target,heading);heading=end.yaw;
  assert.ok(Math.abs(end.position.y-target.y)<.06,'intended floor at '+i);
  const sample={i,target,...end};samples.push(sample);
  if([3,7,10,13,17,18,20,25,route.length-1].includes(i)){
   await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
   sample.camera=await assertFirstPersonView(page);sample.lighting=JSON.parse(await page.locator('#model').getAttribute('data-lighting'));
   await artifacts.screenshot(page,'ground-route-'+i+'.png');
  }
 }
 await artifacts.json('ground-route.json',samples);
 return {samples,input:ctx.profile.hasTouch?'real touch movement and steering':'real keyboard and mouse',scope:'Natural admission, foyer to Säule, each fitted WC, both balcony stairs and main-stair ascent; no forced actor placement'};
}};

export const labRoute={id:'lab-internal-route',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:150000,async run(ctx){
 await select(ctx,'lab');let heading=viewpoints.lab.yaw;const samples=[];
 for(const [i,target]of [lab(-12.8,-12.8),viewpoints.lab.position,lab(-8.5,2.6),lab(-17.4,.8),lab(-17.4,5.1,-1.15),lab(-17.4,.8),lab(-8.5,2.6),viewpoints.lab.position].entries()){
  const end=await travel(ctx,target,heading);heading=end.yaw;
  assert.ok(Math.abs(end.position.y-target.y)<.06);samples.push(end);
  if([0,3,4,7].includes(i)){await ctx.page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');await assertFirstPersonView(ctx.page);await ctx.artifacts.screenshot(ctx.page,'lab-route-'+i+'.png');}
 }
 return {samples,scope:'Explicit Lab room-selector start then real local bar/pit route; no ordinary-night public passage from Säule'};
}};

export const groundParity={id:'ground-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
 const comparisons=[];
 for(const view of [{position:[3,1.73,0],target:[-14,1.9,0]},{position:[-4,1.73,-4.8],target:[-4,2.25,-9.5]}])comparisons.push(await compareMaterialRender(ctx,view));
 const pit=lab(-17.4,5.1,-1.15);
 const rays=[{origin:[-5,4.5,9.5],direction:[0,1,0]},{origin:[pit.x,.2,pit.z],direction:[0,-1,0]}];
 const native=await renderNativeAsset(ctx.page,{position:{x:3,y:.05,z:0},yaw:Math.PI/2,fov:60,clubNight:true,rays});
 for(const samples of Object.values(native.geometryProbes)){
  assert.ok(samples[0]>=.24&&samples[0]<=.56,'actual retained overhead beam or slab');
  assert.ok(Math.abs(samples[1]-1.35)<.002,'native pit opening remains open to lower floor');
 }
 native.geometryProbes.source.forEach((v,i)=>assert.ok(Math.abs(v-native.geometryProbes.native[i])<.002));
 assert.equal(native.saule.pierCount,8);assert.equal(native.saule.rooms.balconyHeight,2.7);
 await ctx.artifacts.screenshot(ctx.page,'ground-native-night.png');await disposeNativeAsset(ctx.page);
 const views=[['bar',{x:-4,y:.05,z:-4.8},0],['wc',{x:-5,y:.05,z:4.8},Math.PI],['balcony',{x:-10,y:2.7,z:9.5},-Math.PI/2],['lab',viewpoints.lab.position,viewpoints.lab.yaw]];
 for(const [name,position,yaw]of views)for(const clubNight of [false,true]){
  await renderNativeAsset(ctx.page,{position,yaw,pitch:0,fov:60,clubNight});
  await ctx.artifacts.screenshot(ctx.page,name+(clubNight?'-night':'-day')+'.png');await disposeNativeAsset(ctx.page);
 }
 return {comparisons,native,scope:'Actual source/native pixels and ray checks plus controlled day/night views; coordinates remain fitted estimates'};
}};

export const labParity={id:'lab-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:150000,async run(ctx){
 const bar=layout.fixtures.find(f=>f.id==='lab-pipe-bar'),p=lab(-12.8,-12.8),pit=lab(-17.4,5.1,-1.15);
 const comparison=await compareMaterialRender(ctx,{position:[p.x,p.y+1.68,p.z],target:[bar.anchor[0],1.6,bar.anchor[2]]});
 const native=await renderNativeAsset(ctx.page,{position:viewpoints.lab.position,yaw:viewpoints.lab.yaw,fov:60,clubNight:true,
  rays:[{origin:[pit.x,.2,pit.z],direction:[0,-1,0]},{origin:[3,1.7,-10.5],direction:[0,0,-1]}]});
 for(const distances of Object.values(native.geometryProbes)){
  assert.ok(Math.abs(distances[0]-1.35)<.002,'actual lower landing');
  assert.ok(distances[1]<1.1,'closed connection remains opaque geometry');
 }
 native.geometryProbes.source.forEach((v,i)=>assert.ok(Math.abs(v-native.geometryProbes.native[i])<.002));
 assert.match(native.labOratory.access,/closed/);
 await ctx.artifacts.screenshot(ctx.page,'lab-native-night.png');await disposeNativeAsset(ctx.page);
 return {comparison,native,scope:'Actual source/native transformed fixtures and pit; closed event connection, no public natural-entry claim'};
}};

const fallback={id:'ground-fallback-contact',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:90000,async run(ctx){
 const {page,context,profile,artifacts}=ctx;
 await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await select(ctx,'saule');let heading=viewpoints.saule.yaw;
 for(const target of [world([3,-.8]),world([0,-.8])])heading=(await travel(ctx,target,heading)).yaw;
 await dragLook(page,context,profile,heading/.004);heading=0;
 const stopped=await forward(page,context,profile,1500),held=await forward(page,context,profile,500);
 assert.ok(Math.hypot(stopped.x-held.x,stopped.z-held.z)<.025,'pier stops continued real input');
 assert.equal(await page.locator('#model').getAttribute('data-materials'),'fallback');
 const views=[];
 for(let i=0;i<4;i++){
  await dragLook(page,context,profile,-Math.PI/2/.004);heading+=Math.PI/2;
  await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
  views.push(await assertFirstPersonView(page));await artifacts.screenshot(page,'fallback-contact-'+i+'.png');
 }
 await travel(ctx,world([0,-.8]),heading);
 return {stopped,held,views,scope:'Real contact, held input and four turns beside opaque pier with failed optional texture loads; no physical-device claim'};
}};

async function pitch(ctx,delta){
 const {page,context,profile}=ctx,b=await page.locator('#model').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
 if(profile.hasTouch){const c=await context.newCDPSession(page);try{
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+delta}]});
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }finally{await c.detach();}}
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+delta,{steps:4});await page.mouse.up();}
 await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
}
const stairLook={id:'ground-stair-look',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:180000,async run(ctx){
 await select(ctx,'saule');let heading=viewpoints.saule.yaw;const views=[];
 const route=[[3,5],[-17.3,5],[-17.3,9.5],[-10.4,9.5,2.7],[-13.7,9.5,1.6],[-10.4,9.5,2.7],[.4,9.5,2.7],[3.6,9.5,1.6],[6.8,9.5]];
 for(const [i,p]of route.entries()){
  heading=(await travel(ctx,world(p),heading)).yaw;
  if([3,4,6,7].includes(i)){
   const desired=i<5?Math.PI/2:-Math.PI/2,turn=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
   await dragLook(ctx.page,ctx.context,ctx.profile,-turn/.004);heading=desired;
   await pitch(ctx,150);const looked=await assertFirstPersonView(ctx.page);assert.ok(looked.direction[1]<-.5);
   await ctx.artifacts.screenshot(ctx.page,'stair-down-'+i+'.png');
   await pitch(ctx,-150);const restored=await assertFirstPersonView(ctx.page);assert.ok(Math.abs(restored.direction[1])<.01);
   views.push({i,looked,restored});
  }
 }
 return {views,scope:'Room-selector start then real movement and downward mouse/touch pitch at both stair tops and midflights; no camera setter'};
}};

export default {name:'Säule, WC balcony and separately accessed Lab ground arrangement',sourceFiles,scenarios:[groundParity,groundRoute,labRoute,labParity,fallback,stairLook]};
