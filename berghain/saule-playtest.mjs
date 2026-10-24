import {assertFirstPersonView} from './fixture-playtest.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {sourceFiles as previousFiles} from './bar-wall-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {enterNaturally,cross} from './lab-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';

export const sourceFiles=()=>[...previousFiles(),...['berghain/saule-playtest.mjs','tests/berghain-saule.test.mjs'].map(path=>
 ({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const position=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));

export default {name:'Säule photographed concrete installations and continuous human circulation',sourceFiles,scenarios:[
 {id:'saule-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
   const pier=layout.fixtures.find(f=>f.id==='saule-pier-1'),[x,,z]=pier.anchor;
   const parity=await compareMaterialRender(ctx,{position:[x+3.6,3.3,z+4.7],target:[x,3.5,z]});
   const rays=[{origin:[x+2.8,2,z],direction:[-1,0,0]},
     {origin:[x+.9,4.5,z],direction:[0,1,0]},
     {origin:[x+1.1,1.5,z],direction:[0,-1,0]}];
   const native=await renderNativeAsset(ctx.page,{position:{x:x+3.7,y:.05,z:z+5.2},yaw:.46,pitch:.13,fov:65,rays});
   assert.equal(native.saule.pierCount,6);assert.equal(native.saule.capitalTop,6.25);
   assert.equal(native.fixtures,layout.fixtures.length);assert.equal(native.equipment,44);assert.equal(native.artworks,2);
   for(const samples of Object.values(native.geometryProbes)){
     assert.ok(Math.abs(samples[0]-2)<.002,'The actual massive body must replace the slim column silhouette');
     assert.ok(samples[1]>.85&&samples[1]<1.5,'Actual flared geometry must intercept a ray outside the body footprint');
     assert.ok(samples[2]>.95&&samples[2]<1.05,'The actual seat must stand at a human sitting height');
   }
   native.geometryProbes.source.forEach((distance,i)=>assert.ok(Math.abs(distance-native.geometryProbes.native[i])<.002));
   await ctx.artifacts.screenshot(ctx.page,'saule-installations-native.png');await disposeNativeAsset(ctx.page);
   return {parity,native,scope:'Original photo-derived concrete and channel geometry; grid/dimensions/currentness inferred; no full light-wash claim'};
 }},
 {id:'saule-natural-route',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
   const {page,artifacts}=ctx;await enterNaturally(ctx);let heading=0;const route=[];
   for(const [index,[x,z]]of [[5,15],[5,4],[5,-14],[5,4],[2,2.6],[-5.2,2.6],[2,2.6],[5,4],[5,15],[0,19.7],[0,20.25]].entries()){
     const end=await travel(ctx,studyToSite({x,y:.05,z}),heading);heading=end.yaw;route.push(end.position);
     await assertFirstPersonView(page);
     if([1,2,4,5,7].includes(index))await artifacts.screenshot(page,'human-saule-route-'+index+'.png');
   }
   await cross(ctx);assert.ok((await position(page)).z>22);
   await artifacts.screenshot(page,'outside-after-saule.png');
   return {route,input:ctx.profile.hasTouch?'Real touch movement and entrance tap':'Real keyboard/mouse and E',
     scope:'Natural exterior entry → Säule concrete aisle → Lab gate → reverse exit; no room selector or forced actor placement'};
 }},
 {id:'saule-human-camera',modes:['stress'],timeoutMs:120000,async run(ctx){
   const {page,baseURL,artifacts}=ctx;
   await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
   await page.locator('#room').selectOption('saule');
   await page.waitForFunction(expected=>{
     const p=JSON.parse(document.querySelector('#model').dataset.position);
     return Math.hypot(p.x-expected.x,p.y-expected.y,p.z-expected.z)<.01;
   },viewpoints.saule.position);
   const pier=layout.fixtures.find(f=>f.id==='saule-pier-4');
   const end=await travel(ctx,{x:pier.anchor[0]-2,y:.05,z:pier.anchor[2]+1.65},0);
   const samples=[];
   for(let i=0;i<8;i++){
     await dragLook(page,ctx.context,ctx.profile,-Math.PI/4/.004);
     await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
     const sample=await assertFirstPersonView(page);samples.push(sample);
     if(i%2===0)await artifacts.screenshot(page,'human-beside-pier-turn-'+i+'.png');
   }
   return {position:end.position,samples,scope:'Room shortcut then real movement and drag beside concrete/corbel/seat; first-person eye-height and opaque pier views, no natural-entry claim'};
 }}]};
