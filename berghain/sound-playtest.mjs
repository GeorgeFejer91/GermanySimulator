import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout} from '../assets/models/berghain/layout.mjs';
import {canStand} from './navigation.mjs';
import {dragLook,forward} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

const sourceFiles=['assets/models/berghain/speaker-geometries.mjs','assets/models/berghain/sound-system.mjs',
  'assets/models/berghain/layout.mjs','assets/models/berghain/model.mjs','assets/models/berghain/interior-fixtures.mjs',
  'assets/models/berghain/berghain-study.glb','assets/models/berghain/manifest.json',
  'berghain/viewer.mjs','berghain/navigation.mjs','berghain/walkthrough.mjs'];

export default {
  name:'Berghain reported main-hall speaker installation',
  sourceFiles:()=>sourceFiles.map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[{id:'speaker-room',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    const failed=[];page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
    await page.goto(baseURL+'/berghain/model.html');
    await page.locator('#model[data-ready="true"]').waitFor();await page.locator('#enter').click();await page.locator('#room').selectOption('berghain');
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const target=layout.soundSystem.components.find(c=>c.id==='main-stack-1-bass-1').position;
    const yaw=Math.atan2(before.x-target[0],before.z-target[2]);
    await dragLook(page,context,profile,-yaw/.004);
    await artifacts.screenshot(page,'main-hall-speaker-stack.png');
    const native=await renderNativeAsset(page,{position:before,yaw});
    assert.equal(native.equipment,44);assert.equal(native.fixtures,layout.fixtures.length);
    const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json',import.meta.url)));
    assert.equal(native.bytes,manifest.bytes);assert.equal(native.meshes,manifest.meshes);
    await artifacts.screenshot(page,'native-glb-speaker-stack.png');await disposeNativeAsset(page);
    const approach=await forward(page,context,profile,2000);
    await dragLook(page,context,profile,-(Math.PI/2-yaw)/.004);
    const stopped=await forward(page,context,profile,900),blocked=await forward(page,context,profile,700);
    artifacts.json('speaker-route.json',{before,approach,stopped,blocked,yaw});
    assert.ok(Math.hypot(stopped.x-before.x,stopped.z-before.z)>.5,'Actual approach reaches the speaker');
    assert.ok(canStand(blocked,layout));
    assert.ok(Math.hypot(blocked.x-stopped.x,blocked.z-stopped.z)<.025,'Visible speaker assembly blocks continued input');
    await artifacts.screenshot(page,'speaker-body-clearance.png');
    assert.deepEqual(failed,[]);
    return {before,approach,stopped,blocked,native,yaw,entryEvidence:'Authored room selection; diagonal approach then head-on blocking, natural entry tested separately'};
  }},
  {id:'avatar-at-speakers',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#room').selectOption('berghain');
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const target=layout.soundSystem.components.find(c=>c.id==='main-stack-1-bass-1').position;
    const yaw=Math.atan2(before.x-target[0],before.z-target[2]);
    await dragLook(page,context,profile,-yaw/.004);
    await artifacts.screenshot(page,'visitor-and-speaker-stack.png');
    const position=await forward(page,context,profile,3300);
    assert.ok(canStand(position,layout));assert.equal(await page.locator('#model').getAttribute('data-avatar'),'true');
    assert.ok(Number(await page.locator('#model').getAttribute('data-camera-distance'))>.65);
    await artifacts.screenshot(page,'visitor-speaker-clearance.png');
    return {before,position,roomShortcut:true};
  }},
  {id:'speaker-text-layout',modes:['stress'],profiles:['desktop'],async run({page,baseURL,artifacts}){
    await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#enter').click();await page.locator('#room').selectOption('berghain');
    const measurements=[];
    for(const viewport of [{width:320,height:740},{width:740,height:320},{width:1280,height:800},{width:2400,height:1400}]){
      await page.setViewportSize(viewport);
      for(const enlarged of [false,true]){
        await page.evaluate(large=>document.documentElement.style.fontSize=large?'32px':'16px',enlarged);
        await page.waitForTimeout(120);
        const result=await page.evaluate(()=>({horizontal:document.documentElement.scrollWidth>innerWidth+1,
          measurement:document.documentElement.dataset.textMeasurement,
          clipped:[...document.querySelectorAll('[data-measure]')].filter(el=>el.getClientRects().length&&el.scrollWidth>el.clientWidth+2).map(el=>el.id||el.textContent)}));
        assert.equal(result.horizontal,false);assert.deepEqual(result.clipped,[]);assert.equal(result.measurement,'pretext-0.0.9');
        measurements.push({viewport,enlarged,...result});
      }
    }
    await page.setViewportSize({width:320,height:740});await artifacts.screenshot(page,'speaker-320px-200-percent.png');
    return {measurements};
  }}]
};
