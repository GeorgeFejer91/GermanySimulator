import assert from 'node:assert/strict';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand} from './navigation.mjs';
import {travel} from './lounge-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import lounge from './lounge-playtest.mjs';

export default {name:'Klo Bar, sanitary architecture and continuous visitor route',
 sourceFiles:()=>lounge.sourceFiles(),
 scenarios:[
  {id:'klo-source-native',modes:['quick','stress'],async run({page,baseURL,artifacts}){
    const failed=[];page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
    await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#enter').click();const results=[];
    for(const key of ['klo','toilets']){
      await page.locator('#room').selectOption(key);
      await page.waitForFunction(expected=>JSON.parse(document.querySelector('#model').dataset.position).y===expected,6.65);
      await artifacts.screenshot(page,key+'-source.png');
      const native=await renderNativeAsset(page,{position:viewpoints[key].position,yaw:viewpoints[key].yaw,pitch:viewpoints[key].pitch||0});
      assert.equal(native.kloBar.artwork.status,'Figure sequence not yet modelled');
      assert.equal(native.fixtures,layout.fixtures.length);assert.equal(native.equipment,44);
      assert.equal(native.kloBar.sources.includes('I21'),true);
      await artifacts.screenshot(page,key+'-native.png');await disposeNativeAsset(page);results.push({key,native});
    }
    assert.deepEqual(failed,[]);return {results,failed,scope:'Actual source renderer and portable GLB; room shortcuts, estimated placement; Together figures remain required'};
  }},
  {id:'klo-connected-route',modes:['stress'],timeoutMs:240000,async run(ctx){
    const {page,baseURL,artifacts}=ctx;
    await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#room').selectOption('berghain');let heading=0;const route=[];
    const outward=[[5,0],[-6.35,0],[-6.35,3.8],[-8.05,3.8],[-8.05,-4.1],[-9,-4.1],[-9,-8.3],[-13.8,-8.3],[-13.8,-10],[-18.2,-10]];
    for(let i=0;i<outward.length;i++){
      const [x,z]=outward[i];artifacts.json('route-progress.json',{route,next:{x,z}});
      const result=await travel(ctx,studyToSite({x,y:6.65,z}),heading);heading=result.yaw;route.push(result.position);
      if(i===3){assert.equal(await page.locator('#room').inputValue(),'klo');await artifacts.screenshot(page,'human-entered-klo-bar.png');}
      if(i===7){assert.equal(await page.locator('#room').inputValue(),'toilets');await artifacts.screenshot(page,'human-toilet-corridor.png');}
    }
    assert.equal(await page.locator('#location').textContent(),'Toilets');
    assert.equal(await page.locator('#model').getAttribute('data-avatar'),'true');
    await artifacts.screenshot(page,'human-open-cubicle.png');
    const native=await renderNativeAsset(page,{position:route.at(-1),yaw:Math.PI/2,pitch:-.75});
    await artifacts.screenshot(page,'native-hollow-pan-and-cubicle.png');await disposeNativeAsset(page);
    for(const [x,z]of [...outward.slice(0,-1).reverse(),[5,5]]){
      const result=await travel(ctx,studyToSite({x,y:6.65,z}),heading);heading=result.yaw;route.push(result.position);
    }
    assert.ok(route.every(p=>p.y===6.65&&canStand(p,layout)));
    assert.equal(await page.locator('#room').inputValue(),'berghain');
    await artifacts.screenshot(page,'human-returned-to-main-floor.png');
    return {route,native,input:ctx.profile.hasTouch?'Actual CDP touch holds/steering':'Actual keyboard and mouse',
      scope:'Main-floor shortcut then continuous bar/WC/open-cubicle/return; natural exterior entrance covered separately'};
  }},
  {id:'klo-room-labels',modes:['stress'],profiles:['desktop'],async run({page,baseURL,artifacts}){
    await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#enter').click();const results=[];
    for(const viewport of [{width:320,height:740},{width:740,height:320}])for(const enlarged of [false,true])for(const key of ['klo','toilets']){
      await page.setViewportSize(viewport);await page.evaluate(large=>document.documentElement.style.fontSize=large?'32px':'16px',enlarged);
      await page.locator('#room').selectOption(key);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
      const fit=await page.evaluate(()=>({measurement:document.documentElement.dataset.textMeasurement,
        horizontal:document.documentElement.scrollWidth>innerWidth+1,
        clipped:[...document.querySelectorAll('[data-measure]')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id),
        selected:document.querySelector('#room').selectedOptions[0].textContent,fit:document.querySelector('#room').dataset.fit,
        full:document.querySelector('#room-full-name').hidden?null:document.querySelector('#room-full-name').textContent}));
      assert.equal(fit.measurement,'pretext-0.0.9');assert.equal(fit.horizontal,false);assert.deepEqual(fit.clipped,[]);
      assert.ok(fit.fit==='fit'||fit.full===fit.selected);results.push({viewport,enlarged,key,fit});
    }
    await artifacts.screenshot(page,'new-room-labels-200-percent.png');return {results};
  }}
 ]};
