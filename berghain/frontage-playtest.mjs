import assert from 'node:assert/strict';
import {compareMaterialRender} from './material-playtest.mjs';
import {forward,assertFirstPersonView} from './fixture-playtest.mjs';
import {cross} from './lab-playtest.mjs';
export default {name:'Observed entrance elevation',scenarios:[
 {id:'frontage-source-native',modes:['stress'],timeoutMs:180000,
  run:ctx=>compareMaterialRender(ctx,{position:[0,12,62],target:[0,11,21]})},
 {id:'frontage-fallback',modes:['stress'],timeoutMs:120000,async run({page,baseURL,artifacts}){
  await page.route('**/assets/models/berghain/textures/**',r=>r.abort());
  await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#model').getAttribute('data-materials'),'fallback');
  await artifacts.screenshot(page,'exterior-reset-fallback.png');
  return {scope:'Actual exterior reset with failed surface textures; no diagnostic camera override',materials:'fallback'};
 }},
 {id:'frontage-open-door',modes:['stress'],timeoutMs:120000,async run(ctx){
  const {page,baseURL,context,profile,artifacts}=ctx;
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  await forward(page,context,profile,5000);
  const before=await assertFirstPersonView(page);assert.ok(before.position.z>22.28&&before.position.z<23);
  if(profile.hasTouch)await page.locator('#interact').tap();
  else{await page.locator('#model').focus();await page.keyboard.press('e');}
  await page.waitForFunction(()=>document.querySelector('#model').dataset.crossing==='true');
  await artifacts.screenshot(page,'open-door-crossing.png');
  await page.waitForFunction(()=>document.querySelector('#model').dataset.crossing==='false',null,{timeout:20000});
  const inside=await assertFirstPersonView(page);assert.ok(inside.position.z<21);
  await artifacts.screenshot(page,'inside-entrance.png');
  await cross(ctx);const outside=await assertFirstPersonView(page);assert.ok(outside.position.z>24);
  return {before,inside,outside,scope:'Real keyboard/touch approach, opened door and complete entry/return; body/visible-mesh sweep checked independently'};
 }}
]};
