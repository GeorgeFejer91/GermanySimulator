import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import previous,{lookUp} from './suspended-subs-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView,dragLook} from './fixture-playtest.mjs';
import {canStand} from './navigation.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...previous.sourceFiles(),...['tests/berghain-panorama-pa.test.mjs','berghain/panorama-pa-playtest.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
export const route=[[-3,12.37519],[-7.5,12.37519],[-7.5,14.5],[-10.5,14.5],[-10.5,18],[-4.5,18],[-4.5,14.5]].map(([x,z])=>({x,y:9.05,z}));
async function face(ctx,target){
  const view=await assertFirstPersonView(ctx.page),d=target.map((v,i)=>v-view.camera[i]);
  const yaw=Math.atan2(-d[0],-d[2]),pitch=Math.atan2(d[1],Math.hypot(d[0],d[2]));
  const oldYaw=Math.atan2(-view.direction[0],-view.direction[2]),oldPitch=Math.asin(view.direction[1]);
  assert.ok(Math.abs(pitch)<1.15);
  await dragLook(ctx.page,ctx.context,ctx.profile,-Math.atan2(Math.sin(yaw-oldYaw),Math.cos(yaw-oldYaw))/.004);
  await lookUp(ctx,pitch-oldPitch);return assertFirstPersonView(ctx.page);
}
async function walkTo(ctx,target){
  const view=await assertFirstPersonView(ctx.page);await lookUp(ctx,-Math.asin(view.direction[1]));
  return travel(ctx,target,Math.atan2(-view.direction[0],-view.direction[2]));
}
const walk=fallback=>({id:fallback?'panorama-pa-fallback':'panorama-pa-walk',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:180000,async run(ctx){
  const {page,artifacts}=ctx;if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
  await page.goto(ctx.baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();await page.locator('#room').selectOption('panorama');
  await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.001;},viewpoints.panorama.position);
  assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
  const steps=[],views=[];
  for(const [i,target]of route.entries()){
    steps.push(await walkTo(ctx,target));
    if([2,4,6].includes(i)){
      const target=i===2?[-7.5,12.7,16.6]:i===4?[-12,13,18]:[-3.7,13,12.5];
      const view=await face(ctx,target);assert.ok(canStand(view.position,layout));views.push(view);await artifacts.screenshot(page,'pa-look-'+i+'.png');
    }
  }
  for(const target of route.toReversed().slice(1))steps.push(await walkTo(ctx,target));steps.push(await walkTo(ctx,viewpoints.panorama.position));
  return{steps,views,fallback,scope:'Explicit Panorama room selector, real mouse/keyboard or CDP touch walking and upward looks, return. No forced body/camera placement. Physical Android not run.'};
}});
const rendering={id:'panorama-pa-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
  const comparisons=[];
  for(const view of [{position:[-8,10.73,14.5],target:[-3.7,13,12.5]},{position:[-8,10.73,14.5],target:[-7.5,12.7,16.6]}])comparisons.push(await compareMaterialRender(ctx,view));
  const rays=layout.soundSystem.panorama.components.map(c=>{
    const m=new THREE.Matrix4().fromArray(c.matrix),origin=new THREE.Vector3(0,0,1).applyMatrix4(m),direction=new THREE.Vector3(0,0,-1).transformDirection(m);
    return{origin:origin.toArray(),direction:direction.toArray()};
  });
  const samples=[];
  for(const [name,body,target]of [['hang',[-8,9.05,14.5],[-3.7,13,12.5]],['subs',[-8,9.05,14.5],[-7.5,12.7,16.6]],['opposite',[-3,9.05,14.5],[-12,13,18]]]){
    const position={x:body[0],y:body[1],z:body[2]};assert.ok(canStand(position,layout));
    const d=target.map((v,i)=>v-body[i]-(i===1?1.68:0)),yaw=Math.atan2(-d[0],-d[2]),pitch=Math.atan2(d[1],Math.hypot(d[0],d[2]));
    for(const clubNight of [false,true]){
      const result=await renderNativeAsset(ctx.page,{position,yaw,pitch,fov:60,clubNight,rays});
      result.geometryProbes.source.forEach((n,i)=>assert.ok(Math.abs(n-result.geometryProbes.native[i])<.002,'Exported surface ray agrees'));
      await ctx.artifacts.screenshot(ctx.page,name+'-'+(clubNight?'night':'day')+'.png');await disposeNativeAsset(ctx.page);
      samples.push({name,clubNight,geometry:result.geometryProbes,lighting:result.lighting});
    }
  }
  return{comparisons,samples,scope:'Legal standing-eye source/native pixels, 22 transformed perforation rays, opposite views and day/night controlled renders.'};
}};
export default{name:'Panorama PA and preserved room circulation',sourceFiles,scenarios:[walk(false),walk(true),rendering]};
