import assert from 'node:assert/strict';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {assertFirstPersonView,dragLook,forward} from './fixture-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';

export default {name:'Panorama counter backdrop and service aisle',scenarios:[
 {id:'counterwall-stair-clearance',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
  const {page,context,profile,baseURL,artifacts}=ctx;
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  await page.locator('#room').selectOption('berghain');
  let heading=viewpoints.berghain.yaw;
  for(const target of [...layout.panoramaRegistration.mainApproach.slice(1,4),{x:-1.047,y:11.2972712952,z:5.89}]){
   const result=await travel(ctx,target,heading);heading=result.yaw;
  }
  await dragLook(page,context,profile,-(Math.PI/2-heading)/.004);
  const view=await assertFirstPersonView(page);assert.ok(Math.abs(view.position.y-11.2972712952)<.12);
  await artifacts.screenshot(page,'stair-at-former-beam.png');
  const rays=[{origin:view.camera,direction:[0,1,0]},{origin:view.camera,direction:[-1,0,0]}];
  const native=await renderNativeAsset(page,{position:view.position,yaw:Math.PI/2,fov:60,clubNight:true,rays});
  assert.equal(native.panoramaRegistration.stairClearance.retired.length,1);
  for(let i=0;i<2;i++){assert.ok(native.geometryProbes.source[i]>.3);assert.ok(Math.abs(native.geometryProbes.source[i]-native.geometryProbes.native[i])<.0001);}
  await artifacts.screenshot(page,'stair-native-at-former-beam.png');await disposeNativeAsset(page);
  return {view,native,scope:'Real input to formerly intersected stair position and same-eye source/native scene; five-lane body clearance tested separately'};
 }},
 {id:'counterwall-view',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
  const {page,context,profile,baseURL,artifacts}=ctx;
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  await page.locator('#room').selectOption('panorama');await assertFirstPersonView(page);
  await artifacts.screenshot(page,'arrival-night.png');
  const target={x:-12.8,y:13.25,z:14.4};
  const approach=await travel(ctx,target,viewpoints.panorama.yaw);
  await dragLook(page,context,profile,-(Math.PI/2-approach.yaw)/.004);
  const view=await assertFirstPersonView(page);
  await artifacts.screenshot(page,'counter-wall-night.png');
  const rays=[14.6,15.2,15.8,16.4].flatMap(y=>[10,12,14,16,18,20].map(z=>({origin:[-18.1,y,z],direction:[-1,0,0]})));
  const native=await renderNativeAsset(page,{position:view.position,yaw:Math.PI/2,fov:60,clubNight:true,rays});
  assert.equal(native.panoramaRegistration.counterWall.throughAccess,false);
  assert.equal(native.geometryProbes.source.length,24);
  for(let i=0;i<24;i++){
   assert.ok(native.geometryProbes.source[i]>.2&&native.geometryProbes.source[i]<.3);
   assert.ok(Math.abs(native.geometryProbes.source[i]-native.geometryProbes.native[i])<.00001);
  }
  assert.ok(native.lighting.activeLights<=3&&native.lighting.shadowMaps<=2);
  await artifacts.screenshot(page,'counter-wall-native-night.png');await disposeNativeAsset(page);
  // Real forward input reaches the visible counter/stools and remains blocked.
  await forward(page,context,profile,2200);
  const stopped=await assertFirstPersonView(page);
  await forward(page,context,profile,600);
  const blocked=await assertFirstPersonView(page);
  assert.ok(Math.hypot(stopped.position.x-blocked.position.x,stopped.position.z-blocked.position.z)<.03);
  await artifacts.screenshot(page,'counter-contact.png');
  return {approach,view,native,stopped,blocked,scope:'Real keyboard/touch approach from Panorama shortcut; source/native night backdrop and ray depths; physical device not tested'};
 }},
 {id:'counterwall-material-parity',profiles:['desktop'],modes:['stress'],timeoutMs:180000,run:ctx=>
  compareMaterialRender(ctx,{position:[-12.8,14.93,14.4],target:[-18.42,15.65,14.4]})}
]};
