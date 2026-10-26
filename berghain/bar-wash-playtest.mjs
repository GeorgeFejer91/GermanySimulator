import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {canStand} from './navigation.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
import {lookUp} from './suspended-subs-playtest.mjs';
import {sourceFiles as priorFiles} from './mineral-surface-playtest.mjs';
import {sourceFiles as glassFiles} from './bar-glass-playtest.mjs';
export const sourceFiles=()=>[...glassFiles(),...['berghain/bar-wash-playtest.mjs','tests/berghain-bar-wall.test.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];

const views=[{id:'return-wall',position:[4.48,7.13,-10.29],target:[-3,10.5,-14.6]},
 {id:'straight-wall',position:[-4.67,7.13,-9.89],target:[-5.3,9.5,-14.8]},
 {id:'return-counter',position:[4.48,7.13,-10.29],target:[-3,7.7,-14.6]}];
export const route=[[4,-7],[4,-10],[3,-10],[-4.67,-9.89],[3,-10],[4.48,-10.29],[5.5,-11],[5.5,-13]].map(([x,z])=>({x,y:5.45,z}));
// Check the entire swept route, not only legal endpoints; actual browser input is still required.
for(let i=1;i<route.length;i++)for(let t=0;t<=1;t+=.025){const a=route[i-1],b=route[i];assert.ok(canStand({x:a.x+(b.x-a.x)*t,y:5.45,z:a.z+(b.z-a.z)*t},layout),'Bar approach segment '+i);}
export async function walkBarWash(ctx,{fallback=false,restore=false}={}){
 const {page,baseURL,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/plaster-baseColor.png',r=>r.abort());
 await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 const arrival=viewpoints.berghain;await page.locator('#room').selectOption('berghain');
 await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.001;},arrival.position);
 let heading=arrival.yaw;const steps=[],looks=[];
 for(const [i,target]of route.entries()){
  const step=await travel(ctx,target,heading);heading=step.yaw;steps.push(step);
  if([3,5,7].includes(i)){
   const aim=i===3?{x:-5.3,z:-14.8}:i===5?{x:-3,z:-14.6}:{x:1,z:-14.6};
   const yaw=Math.atan2(step.position.x-aim.x,step.position.z-aim.z),turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
   await dragLook(page,context,profile,-turn/.004);heading=yaw;await lookUp(ctx,.25);
   await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
   looks.push(await assertFirstPersonView(page));await artifacts.screenshot(page,'wall-approach-'+i+'.png');await lookUp(ctx,-.25);
  }
 }
 if(restore){
  const before=await page.locator('#model').getAttribute('data-position');
  assert.ok(await page.evaluate(()=>{window.__barGlassContext=document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');window.__barGlassContext?.loseContext();return !!window.__barGlassContext;}));
  await page.getByText('Graphics paused.',{exact:false}).waitFor();await page.evaluate(()=>window.__barGlassContext.restoreContext());
  await page.locator('#model[data-ready="true"]').waitFor();assert.equal(await page.locator('#model').getAttribute('data-position'),before);
  await artifacts.screenshot(page,'wall-context-restored.png');
 }
 for(const target of [...route.slice(0,-1).reverse(),arrival.position]){const step=await travel(ctx,target,heading);heading=step.yaw;steps.push(step);}
 return {steps,looks,fallback,restore,scope:'Room selector then actual keyboard/touch approach along the straight bar, around its return, near-object turns and reverse route. No forced placement; Android emulation only.'};
}
export default {name:'Main-bar soft wall wash',sourceFiles,scenarios:[
 ...views.map(v=>({id:v.id,modes:['quick'],profiles:['desktop'],timeoutMs:180000,run:ctx=>compareMaterialRender(ctx,{...v,clubNight:true,practicalLighting:true})})),
 {id:'wall-walk',modes:['quick'],timeoutMs:240000,run:ctx=>walkBarWash(ctx,{restore:ctx.profile.id==='desktop'})},
 {id:'wall-fallback',modes:['quick'],timeoutMs:240000,run:ctx=>walkBarWash(ctx,{fallback:true})}
]};
