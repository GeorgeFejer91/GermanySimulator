import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {mainHallWorldPoint} from '../assets/models/berghain/main-hall-registration.mjs';
import {canStand} from './navigation.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook,assertFirstPersonView,forward} from './fixture-playtest.mjs';
import {lookUp} from './suspended-subs-playtest.mjs';
import {sourceFiles as priorFiles} from './bar-wash-playtest.mjs';
export const sourceFiles=()=>[...priorFiles(),...['berghain/foyer-platforms-playtest.mjs','tests/berghain-foyer-platforms.test.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
export const world=a=>{const p=studyToSite({x:a[0],y:a[1],z:a[2]}),q=mainHallWorldPoint([p.x,p.y,p.z]);return {x:q[0],y:q[1],z:q[2]};};
export const route=[{x:9,y:.05,z:19.48},{x:9,y:.05,z:0},{x:9,y:.05,z:-2.2},{x:8.424688967975206,y:.05,z:-2.2},
 ...[[8,.05,10.6],[15,.05,11.6],[18.7,.05,11.6],[18.7,.05,13.8],[19.7,.05,15.4],[19.7,.05,19.5],[19.7,.05,21],[15,.05,21],[15,.05,19.5],[15,.05,16],[15,.05,13.8]].map(world)];
for(let i=1;i<route.length;i++)for(let t=0;t<=1;t+=.02){const a=route[i-1],b=route[i];assert.ok(canStand({x:a.x+(b.x-a.x)*t,y:.05,z:a.z+(b.z-a.z)*t},layout),'Swept approach '+i);}
export async function walkPlatforms(ctx,{fallback=false,restore=false}={}){
 const {page,baseURL,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 const arrival=viewpoints.foyer;await page.locator('#room').selectOption('foyer');
 await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.001;},arrival.position);
 let heading=arrival.yaw;const steps=[],looks=[];
 for(const [i,target]of route.entries()){
  const step=await travel(ctx,target,heading);heading=step.yaw;steps.push(step);
  if([7,9,13,14].includes(i)){
   const aim=world(i===9?[17.4,.3,17.5]:i===13?[12.1,.3,18]:[12.1,.3,13.8]);
   const yaw=Math.atan2(step.position.x-aim.x,step.position.z-aim.z),turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
   await dragLook(page,context,profile,-turn/.004);heading=yaw;await lookUp(ctx,-.35);
   await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
   looks.push(await assertFirstPersonView(page));await artifacts.screenshot(page,'platform-approach-'+i+'.png');await lookUp(ctx,.35);
  }
 }
 // Approach the near platform using real input, then prove held input cannot
 // pass through its opaque low body. Recovery returns to the legal aisle.
 const stopped=await forward(page,context,profile,1400),held=await forward(page,context,profile,450);
 assert.ok(Math.hypot(stopped.x-held.x,stopped.z-held.z)<.025,'Platform stops held input');
 await lookUp(ctx,-.65);looks.push(await assertFirstPersonView(page));await artifacts.screenshot(page,'platform-contact.png');await lookUp(ctx,.65);
 if(restore){
  const before=await page.locator('#model').getAttribute('data-position');
  assert.ok(await page.evaluate(()=>{window.__platformContext=document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');window.__platformContext?.loseContext();return !!window.__platformContext;}));
  await page.getByText('Graphics paused.',{exact:false}).waitFor();await page.evaluate(()=>window.__platformContext.restoreContext());
  await page.locator('#model[data-ready="true"]').waitFor();assert.equal(await page.locator('#model').getAttribute('data-position'),before);
  await artifacts.screenshot(page,'platform-context-restored.png');
 }
 for(const target of [...route.toReversed(),arrival.position]){const step=await travel(ctx,target,heading);heading=step.yaw;steps.push(step);}
 return {steps,looks,stopped,held,fallback,restore,scope:'Foyer selector then real keyboard/touch approaches, contact, near-object turns and return. Android emulation only; no forced placement.'};
}
const view=(a,b)=>({position:Object.values(world(a)),target:Object.values(world(b))});
export default {name:'Karhard low foyer platforms',sourceFiles,scenarios:[
 {id:'platform-wide',modes:['quick'],profiles:['desktop'],timeoutMs:180000,run:ctx=>compareMaterialRender(ctx,view([19,1.73,12],[12,1.3,16]))},
 {id:'platform-top',modes:['quick'],profiles:['desktop'],timeoutMs:180000,run:ctx=>compareMaterialRender(ctx,view([15,1.73,13.8],[12.1,.4,13.8]))},
 {id:'platform-night',modes:['quick'],profiles:['desktop'],timeoutMs:180000,run:ctx=>compareMaterialRender(ctx,{...view([19,1.73,19],[12,1.3,16]),clubNight:true})},
 {id:'platform-walk',modes:['quick'],timeoutMs:300000,run:ctx=>walkPlatforms(ctx,{restore:ctx.profile.id==='desktop'})},
 {id:'platform-fallback',modes:['quick'],timeoutMs:300000,run:ctx=>walkPlatforms(ctx,{fallback:true})}
]};
