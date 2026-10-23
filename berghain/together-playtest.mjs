import assert from 'node:assert/strict';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';
import klo from './klo-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';

async function lowerLook({page,context,profile},pixels){
  const b=await page.locator('#model').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
  for(let left=pixels;left>.01;){
    const dy=Math.min(left,40,b.height/3);
    if(profile.hasTouch){
      const s=await context.newCDPSession(page);await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await s.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy}]});
      await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await s.detach();
    }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+dy,{steps:4});await page.mouse.up();}
    left-=dy;
  }
}
export default {name:'Together: reference-based relief anatomy and portable amber optics',sourceFiles:klo.sourceFiles,
 scenarios:[{id:'together-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
   const {page,context,profile,baseURL,artifacts}=ctx;
   await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
   await page.locator('#enter').click();await page.locator('#room').selectOption('klo');
   await artifacts.screenshot(page,'together-room-source.png');
   const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
   const target={x:bar.anchor[0]+1.6,y:bar.anchor[1],z:bar.anchor[2]+2.35};
   const end=await travel(ctx,target,viewpoints.klo.yaw);
   await dragLook(page,context,profile,end.yaw/.004);await lowerLook(ctx,100);
   await artifacts.screenshot(page,'together-close-source.png');
   const native=await renderNativeAsset(page,{position:end.position,yaw:0,pitch:-.4});
   assert.equal(native.artworks,2);assert.equal(native.physicalMaterials.length,4);
   for(const m of native.physicalMaterials){
     assert.ok(m.transmission>.3&&m.thickness>0&&m.ior>1);
     assert.equal(m.volumeChannel,1);assert.ok(m.volumeUVs>0&&m.normalMap&&m.coatNormalMap&&m.environmentMap);
   }
   await artifacts.screenshot(page,'together-close-native.png');await disposeNativeAsset(page);
   return {position:end.position,native,scope:'Actual source controls and native GLB material; authored figure count/order/optics still inferred; Baroque ornament absent'};
 }},{id:'together-detail-inspection',modes:['quick','stress'],timeoutMs:150000,async run({page,baseURL,artifacts}){
   await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
   const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
   const view={position:{x:bar.anchor[0]+2.35,y:bar.anchor[1]+.22,z:bar.anchor[2]+.95},yaw:0,pitch:-.85};
   const native=await renderNativeAsset(page,view);
   assert.equal(native.artworks,2);assert.equal(native.physicalMaterials.length,4);
   await artifacts.screenshot(page,'together-detail-native.png');await disposeNativeAsset(page);
   const macro={position:{x:bar.anchor[0]+2.83,y:bar.anchor[1]-.22,z:bar.anchor[2]+.35},yaw:0,pitch:-.67,fov:28};
   await renderNativeAsset(page,macro);await artifacts.screenshot(page,'together-head-macro-native.png');await disposeNativeAsset(page);
   return {scope:'Controlled above-case native-asset fidelity inspection; not a body-clear natural gameplay route',view,native};
 }},{id:'together-material-parity',modes:['quick','stress'],profiles:['desktop'],async run(ctx){
   const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
   return compareMaterialRender(ctx,{position:[bar.anchor[0]+2.55,bar.anchor[1]+1.8,bar.anchor[2]+.95],
     target:[bar.anchor[0]+2.25,bar.anchor[1]+1.1,bar.anchor[2]]});
 }}]};
