import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import previous from './dj-bay-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView,dragLook} from './fixture-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...previous.sourceFiles(),...['assets/models/berghain/upper-sanitary.mjs','tests/berghain-upper-sanitary.test.mjs','berghain/upper-sanitary-playtest.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const walk=fallback=>({id:fallback?'upper-sanitary-fallback':'upper-sanitary-walk',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:150000,async run(ctx){
 const {page,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await page.goto(ctx.baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 await page.locator('#room').selectOption('lounge');
 await page.waitForFunction(p=>{const a=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(a.x-p.x,a.z-p.z)<.001;},viewpoints.lounge.position);
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 let heading=viewpoints.lounge.yaw;const steps=[],room=layout.upperLounge.sanitary;
 const aim=async(target,pitchDelta=0)=>{
  const p=JSON.parse(await page.locator('#model').getAttribute('data-position'));
  const yaw=Math.atan2(p.x-target[0],p.z-target[1]),turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
  await dragLook(page,context,profile,-turn/.004,pitchDelta);heading=yaw;
 };
 const go=async p=>{const r=await travel(ctx,p,heading);heading=r.yaw;steps.push(r);};
 for(const p of room.route.slice(1)){
  await go(p);await assertFirstPersonView(page);
  assert.equal(JSON.parse(await page.locator('#model').getAttribute('data-lighting')).room,'upperSanitary');
 }
 await aim([3.025,16]);await artifacts.screenshot(page,'sanitary-aisle.png');
 for(const p of room.route.toReversed().slice(1))await go(p);
 for(const p of [room.overlookRoute[1],...room.overlookRoute.slice(2)])await go(p);
 await aim([-.88825,14.4396]);await assertFirstPersonView(page);await artifacts.screenshot(page,'guarded-overlook.png');
 for(const p of room.overlookRoute.toReversed().slice(1))await go(p);
 await go(room.route[0]);
 return {steps,fallback,scope:'Explicit upper-lounge selector; real keyboard/touch doorway, entire aisle, separate guarded overlook and return. Front-stair and current arrangement remain unverified.'};
}});
const rendering={id:'upper-sanitary-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
 const comparisons=[];
 for(const view of [{position:[3.825,13.83,13.05],target:[3.1,12.7,17]},{position:[1.85,13.83,14.45],target:[-.88825,10.73,14.4396]}])comparisons.push(await compareMaterialRender(ctx,view));
 const samples=[],rays=[{origin:[3.025,12.65,16],direction:[0,-1,0]},{origin:[3.825,13.5,16],direction:[1,0,0]},{origin:[3.025,11.70,16],direction:[0,1,0]}];
 for(const [name,position,yaw,pitch]of [['aisle',{x:3.825,y:12.15,z:13.05},2.96,-.27],['overlook',{x:1.85,y:12.15,z:14.45},Math.PI/2,-.4]])for(const clubNight of [false,true]){
  const result=await renderNativeAsset(ctx.page,{position,yaw,pitch,fov:60,clubNight,rays});
  const g=result.geometryProbes;g.source.forEach((n,i)=>assert.ok(Math.abs(n-g.native[i])<.002));
  assert.ok(Math.abs(g.source[0]-.685)<.003);assert.ok(Math.abs(g.source[2]-.05)<.003);
  await ctx.artifacts.screenshot(ctx.page,name+(clubNight?'-night':'-day')+'.png');await disposeNativeAsset(ctx.page);
  samples.push({name,clubNight,geometry:g,lighting:result.lighting});
 }
 return {comparisons,samples,scope:'Source/native matching camera and material pixels, bowl/glazing rays, day/night frames from legal positions; estimated source registration'};
}};
export default {name:'Upper sanitary room and guarded Panorama overlook',sourceFiles,scenarios:[walk(false),walk(true),rendering]};
