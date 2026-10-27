import assert from 'node:assert/strict';
import lounge,{travel} from './lounge-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
import {viewpoints} from '../assets/models/berghain/layout.mjs';
export default {name:'Panorama retained DJ console',sourceFiles:lounge.sourceFiles,scenarios:[
 ...[
  ['console-face',[-3,10.73,14.5],[-1.1,10.31,14.44]],
  ['console-chains',[-3.5,10.73,16.5],[-.59,12.1,14.44]]
 ].map(([id,position,target])=>({id,modes:['quick','stress'],timeoutMs:150000,
  async run(ctx){return compareMaterialRender(ctx,{position,target,clubNight:true});}})),
 {id:'console-public-approach',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
  const {page,baseURL,artifacts}=ctx;const records=[];
  async function approach(fallback){
   await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
   await page.locator('#room').selectOption('panorama');const v=viewpoints.panorama;
   await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.001;},v.position);
   let heading=v.yaw;
   for(const target of [{x:-3,y:9.05,z:12.37519208},{x:-3,y:9.05,z:14.44}]){const row=await travel(ctx,target,heading);heading=row.yaw;records.push(row);}
   const look=-Math.PI/2,turn=Math.atan2(Math.sin(look-heading),Math.cos(look-heading));
   await dragLook(page,ctx.context,ctx.profile,-turn/.004);await assertFirstPersonView(page);
   await artifacts.screenshot(page,fallback?'fallback-console.png':'public-console.png');
   const start=JSON.parse(await page.locator('#model').getAttribute('data-position'));
   await page.locator('#exterior').click();assert.equal(JSON.parse(await page.locator('#model').getAttribute('data-lighting')).daylight,true);
   return start;
  }
  const loaded=await approach(false);
  await page.route('**/assets/models/berghain/textures/**',r=>r.abort());const fallback=await approach(true);
  assert.ok(Math.hypot(loaded.x-fallback.x,loaded.z-fallback.z)<.2);
  await artifacts.json('approach.json',{records,loaded,fallback});return {segments:records.length,scope:'Actual keyboard/touch public approach, unavailable texture fallback and daylight restoration; not a measured architectural survey'};
 }}
]};
