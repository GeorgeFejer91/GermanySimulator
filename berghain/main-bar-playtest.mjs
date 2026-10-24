import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import rail from './balustrade-playtest.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {travel} from './lounge-playtest.mjs';
import {enterNaturally,cross} from './lab-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';

export const sourceFiles=()=>[...rail.sourceFiles(),...['berghain/main-bar-playtest.mjs','tests/berghain-main-bar.test.mjs'].map(path=>
 ({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const array=p=>[p.x,p.y,p.z];
async function screenCamera(ctx,{fallback=false,restore=false}={}){
 const {page,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/*.png',route=>route.abort());
 await enterNaturally(ctx);let heading=0;
 for(const [x,z,y]of [[5,21.15,.05],[8,21.15,.05],[8,8.9,6.65],[14,7,6.65],[16.1,7,6.65],[16.1,-4,6.65],[15.8,-4,6.65]]){
  heading=(await travel(ctx,studyToSite({x,y,z}),heading)).yaw;
 }
 if(fallback){
  assert.equal(await page.locator('#model').getAttribute('data-materials'),'fallback');
  await page.waitForFunction(()=>document.querySelector('#loading').dataset.fit==='fit');
  const canvas=await page.locator('#model').boundingBox(),notice=await page.locator('#loading').boundingBox();
  assert.ok(notice.y+notice.height<canvas.y+canvas.height*.3,'The full fallback notice must stay above the central human, including a short landscape canvas');
 }
 if(restore){
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const before=await page.locator('#model').getAttribute('data-position');
  assert.ok(await page.evaluate(()=>{window.__barContext=document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');window.__barContext?.loseContext();return !!window.__barContext;}));
  await page.getByText('Graphics paused.',{exact:false}).waitFor();await page.evaluate(()=>window.__barContext.restoreContext());
  await page.locator('#model[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#model').getAttribute('data-position'),before);
 }
 const samples=[];
 for(let i=0;i<=16;i++){
  if(i){await dragLook(page,context,profile,-Math.PI/8/.004);heading+=Math.PI/8;}
  await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
  const sample={yaw:heading,distance:Number(await page.locator('#model').getAttribute('data-camera-distance')),avatar:await page.locator('#model').getAttribute('data-avatar')};samples.push(sample);
  if(i%4===0||sample.avatar!=='true')await artifacts.screenshot(page,'glass-screen-yaw-'+i+'.png');
 }
 await artifacts.json('glass-screen-camera.json',{samples,fallback,restore});
 assert.ok(samples.every(s=>s.distance>.65&&s.avatar==='true'),'The steel/glass screen must preserve the controllable human: '+JSON.stringify(samples.filter(s=>s.avatar!=='true')));
 return {samples,fallback,restore,scope:'Natural exterior entry and stair/aisle route, real yaw gestures beside the screen; no forced placement'};
}
export default {name:'Photographed long bar and glazed separation',sourceFiles,scenarios:[
{id:'main-bar-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
 const {page,artifacts}=ctx;
 const parity=await compareMaterialRender(ctx,{position:array(studyToSite({x:16.1,y:8.5,z:5.4})),target:array(studyToSite({x:18.4,y:7.4,z:-6}))});
 const screen=layout.mainBar.screenAnchor;
 const rays=[{origin:[screen[0]+.7,8.35,screen[2]+.2],direction:[-1,0,0]},
   {origin:[screen[0]+.7,8.35,screen[2]+8.2],direction:[-1,0,0]}];
 const position=studyToSite({x:16.1,y:6.65,z:3.8}),target=studyToSite({x:18.4,y:6.65,z:-7});
 const yaw=Math.atan2(position.x-target.x,position.z-target.z);
 const native=await renderNativeAsset(page,{position,yaw,rays});
 assert.equal(native.mainBar.counterHeight,1.12);assert.equal(native.equipment,44);assert.equal(native.artworks,2);
 for(const probe of Object.values(native.geometryProbes)){
  assert.ok(probe[0]>.67&&probe[0]<.71,'Actual glass mesh crosses the bar/hall boundary');
  assert.ok(probe[1]===null||probe[1]>2,'The physical open end remains open in source/native');
 }
 native.geometryProbes.source.forEach((d,i)=>{if(d===null)assert.equal(native.geometryProbes.native[i],null);else assert.ok(Math.abs(d-native.geometryProbes.native[i])<.002);});
 await artifacts.screenshot(page,'long-bar-aisle-native.png');await disposeNativeAsset(page);
 return {parity,native,scope:'Same-light controlled source/native view and real glass/open-end geometry. Dimensions/current arrangement inferred.'};
}},
{id:'main-bar-natural-route',modes:['quick','stress'],timeoutMs:200000,async run(ctx){
 const {page,artifacts}=ctx;await enterNaturally(ctx);let heading=0;const route=[];
 const targets=[[5,21.15,.05],[8,21.15,.05],[8,8.9,6.65],[14,7,6.65],[16.1,7,6.65],[16.1,4,6.65],[16.1,-13.5,6.65]];
 for(const [i,[x,z,y]]of targets.entries()){
  const end=await travel(ctx,studyToSite({x,y,z}),heading);heading=end.yaw;route.push(end.position);
  assert.equal(await page.locator('#model').getAttribute('data-avatar'),'true','Human remains visible on the actual bar approach');
  if([4,5,6].includes(i))await artifacts.screenshot(page,'human-long-bar-'+i+'.png');
 }
 for(const [x,z,y]of [...targets.slice(0,-1).reverse(),[0,19.7,.05],[0,20.25,.05]]){
  const end=await travel(ctx,studyToSite({x,y,z}),heading);heading=end.yaw;route.push(end.position);
 }
 await cross(ctx);const exit=JSON.parse(await page.locator('#model').getAttribute('data-position'));
 assert.ok(Math.abs(exit.z-24.85)<.025&&Math.abs(exit.x)<.025);
 await artifacts.screenshot(page,'outside-after-long-bar.png');
 return {route,exit,input:ctx.profile.hasTouch?'Real CDP touch holds/steering and entrance tap':'Real keyboard/mouse and E',scope:'Actual exterior entry, main stair, south screen end, full bar aisle, reverse stair and exit; no room selector/forced placement'};
}},
{id:'main-bar-screen-camera',modes:['stress'],timeoutMs:180000,run:screenCamera},
{id:'main-bar-screen-fallback',modes:['stress'],timeoutMs:180000,run:ctx=>screenCamera(ctx,{fallback:true})},
{id:'main-bar-screen-restored',modes:['stress'],profiles:['desktop'],timeoutMs:180000,run:ctx=>screenCamera(ctx,{restore:true})}
]};
