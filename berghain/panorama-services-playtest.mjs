import {assertFirstPersonView} from './fixture-playtest.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand} from './navigation.mjs';
import {dragLook,forward} from './fixture-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

async function lookUp({page,context,profile}){
  const b=await page.locator('#model').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
  if(profile.hasTouch){
    const touch=await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-75}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();
  }else{
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-75,{steps:4});await page.mouse.up();
  }
}

const paths=['assets/models/berghain/panorama-services.mjs','assets/models/berghain/layout.mjs',
  'assets/models/berghain/model.mjs','assets/models/berghain/interior-fixtures.mjs',
  'assets/models/berghain/berghain-study.glb','assets/models/berghain/manifest.json',
  'berghain/native-asset-playtest.mjs','berghain/panorama-services-playtest.mjs','berghain/lounge-playtest.mjs',
  'berghain/viewer.mjs','berghain/navigation.mjs','berghain/camera.mjs','berghain/walkthrough.mjs'];
export default {name:'Panorama fitted ceiling, acoustic clouds and exposed services',
  sourceFiles:()=>paths.map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[
    {id:'panorama-services-source-native',modes:['quick','stress'],async run(ctx){
      const {page,context,profile,baseURL,artifacts}=ctx;
      await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
      await page.locator('#enter').click();await page.locator('#room').selectOption('panorama');
      await dragLook(page,context,profile,-295);await lookUp(ctx);
      const position=JSON.parse(await page.locator('#model').getAttribute('data-position'));
      await artifacts.screenshot(page,'panorama-services-source.png');
      const native=await renderNativeAsset(page,{position,yaw:1.18,pitch:.3});
      assert.equal(native.panoramaServices.ceilingHeight,17.95);
      assert.equal(native.fixtures,layout.fixtures.length);assert.equal(native.equipment,44);assert.equal(native.artworks,layout.artworks.length);
      await artifacts.screenshot(page,'panorama-services-native.png');await disposeNativeAsset(page);
      return {position,native,scope:'Room shortcut; observed later architect photos15/16; dimensions/counts/positions estimated'};
    }},
    {id:'panorama-radiator-visitor',modes:['stress'],timeoutMs:180000,async run(ctx){
      const {page,context,profile,baseURL,artifacts}=ctx;
      await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
      await page.locator('#room').selectOption('panorama');let heading=0;const route=[];
      for(const [x,z]of [[-11.65,-9],[-7.4,-9],[-7.4,-20.4],[-19.9,-20.4]]){
        artifacts.json('route-progress.json',{route,next:{x,z}});
        const result=await travel(ctx,studyToSite({x,y:13.25,z}),heading);heading=result.yaw;route.push(result.position);
      }
      const fixture=layout.fixtures.find(f=>f.id==='panorama-radiator-0'),[x,y,z]=fixture.anchor;
      const final=await travel(ctx,{x:x+1.15,y,z},heading);heading=final.yaw;route.push(final.position);
      await dragLook(page,context,profile,-Math.atan2(Math.sin(Math.PI/2-heading),Math.cos(Math.PI/2-heading))/.004);
      await artifacts.screenshot(page,'radiator-human-approach.png');
      const stopped=await forward(page,context,profile,900),blocked=await forward(page,context,profile,700);
      assert.ok(canStand(stopped,layout)&&stopped.x>x+.28);
      assert.ok(Math.hypot(blocked.x-stopped.x,blocked.z-stopped.z)<.025,'radiator prevents continued full-body motion');
      await assertFirstPersonView(page);
      await artifacts.screenshot(page,'radiator-human-contact.png');
      const native=await renderNativeAsset(page,{position:final.position,yaw:Math.PI/2,pitch:-.75});
      await artifacts.screenshot(page,'radiator-native-detail.png');await disposeNativeAsset(page);
      return {route,stopped,blocked,native,scope:'Panorama shortcut followed by real keyboard/touch route and visible radiator collision'};
    }}
  ]};
