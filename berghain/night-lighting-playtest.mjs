import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceFiles as firstPersonFiles} from './first-person-playtest.mjs';
export const sourceFiles=()=>[...firstPersonFiles(),...['berghain/night-lighting.mjs','berghain/night-lighting-playtest.mjs','tests/berghain-night-lighting.test.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];

export default {name:'Club-night lighting and retained first-person room visibility',sourceFiles,scenarios:[
  {id:'night-room-tour',modes:['quick','stress'],timeoutMs:120000,async run({page,baseURL,artifacts}){
    await page.goto(baseURL+'/berghain/model.html');
    await page.locator('#model[data-ready="true"]').waitFor();
    const baseline=process.env.BERGHAIN_BASELINE;
    await page.locator('#enter').click();
    const rows=[];
    for(const room of ['foyer','berghain','panorama','lounge','klo','toilets','saule','lab','halle','garden']){
      await page.locator('#room').selectOption(room);
      await page.waitForTimeout(200);
      const state=await page.locator('#model').evaluate(e=>({lighting:e.dataset.lighting?JSON.parse(e.dataset.lighting):null,position:JSON.parse(e.dataset.position),drawCalls:+e.dataset.drawCalls,triangles:+e.dataset.triangles}));
      assert.ok(state.drawCalls>0);
      if(!baseline){assert.equal(state.lighting.daylight,false);assert.ok(state.lighting.ambient<=.2);}
      await artifacts.screenshot(page,room+'.png');rows.push({room,...state});
    }
    await page.locator('#exterior').click();
    await page.waitForFunction(()=>document.querySelector('#model').dataset.view==='exterior');
    if(!baseline)assert.equal(JSON.parse(await page.locator('#model').getAttribute('data-lighting')).daylight,true);
    await artifacts.screenshot(page,'exterior.png');
    await artifacts.json('room-tour.json',{rows,qualification:'Room-selector rendered views. No natural-route, photometric, current-rig or physical-device claim.'});
    return {rows};
  }}
]};
