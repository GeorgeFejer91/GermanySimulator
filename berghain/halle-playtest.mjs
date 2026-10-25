import {assertFirstPersonView} from './fixture-playtest.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {sourceFiles as previousFiles} from './saule-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';

const site=(x,z,y=.05)=>studyToSite({x,y,z});
const array=p=>[p.x,p.y,p.z];
const position=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));
export const sourceFiles=()=>[...previousFiles(),...['berghain/halle-playtest.mjs','tests/berghain-halle.test.mjs','tests/berghain-halle-camera.test.mjs'].map(path=>({path,
 sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];

export function halleCircuit(){
 const [west,east]=layout.halle.stairs,wc=layout.halle.wc;
 const corridor={x:3.5,y:.05,z:-31.55};
 return [corridor,{...west.lowerApproach,z:corridor.z},west.lowerApproach,west.upperApproach,
  site(-6.5,-28.7,4.25),site(-20.6,-28.7,4.25),site(-20.6,-37.2,4.25),site(-6.5,-37.2,4.25),
  site(-6.5,-32.3,4.25),site(-6.5,-28.7,4.25),site(6.5,-28.7,4.25),site(6.5,-37.2,4.25),
  site(20.6,-37.2,4.25),site(20.6,-28.7,4.25),site(6.5,-28.7,4.25),east.upperApproach,east.lowerApproach,
  {...east.lowerApproach,z:corridor.z},corridor,site(4,-34),wc.approach,wc.inside,wc.approach,
  site(4,-34),corridor,viewpoints.halle.position];
}

const appearance=[
 {id:'halle-lower-source-native',camera:{x:3.5,y:1.73,z:-36},target:site(-3,-38,8.3)},
 {id:'halle-upper-source-native',camera:site(16,-27,7.1),target:site(-8,-38,10.2)}
].map(view=>({id:view.id,modes:['quick','stress'],timeoutMs:150000,async run(ctx){
 const parity=await compareMaterialRender(ctx,{position:array(view.camera),target:array(view.target)});
 const origin=[-14,0,14].map(x=>site(x,-34,8));origin.push(site(0,-28,8));
 const rays=origin.map(p=>({origin:array(p),direction:[0,-1,0]}));
 const dx=view.target.x-view.camera.x,dy=view.target.y-view.camera.y,dz=view.target.z-view.camera.z;
 const native=await renderNativeAsset(ctx.page,{position:{...view.camera,y:view.camera.y-1.68},
  yaw:Math.atan2(-dx,-dz),pitch:Math.atan2(dy,Math.hypot(dx,dz)),fov:45,rays});
 assert.equal(native.halle.voids.length,3);assert.equal(native.halle.stairs.length,2);assert.equal(native.halle.upperHeight,4.25);
 assert.equal(native.halle.escapeExit.modelled,false);assert.equal(native.equipment,44);assert.equal(native.artworks,2);
 for(const distances of Object.values(native.geometryProbes)){
  distances.slice(0,3).forEach(d=>assert.ok(Math.abs(d-7.95)<.002,'The real void must remain open down to ground'));
  assert.ok(Math.abs(distances[3]-3.75)<.002,'The real upper slab must match its support height');
 }
 native.geometryProbes.source.forEach((d,i)=>assert.ok(Math.abs(d-native.geometryProbes.native[i])<.002));
 await ctx.artifacts.screenshot(ctx.page,'halle-native.png');await disposeNativeAsset(ctx.page);
 return {parity,native,scope:'Actual source/native structure; original photo-informed forms with explicitly inferred floor datum and plan'};
}}));

export default {name:'Halle provisional post-2022 concrete structure and local circulation',sourceFiles,scenarios:[...appearance,
 {id:'halle-body-circuit',modes:['quick','stress'],timeoutMs:240000,async run(ctx){
  const {page,baseURL,artifacts}=ctx;await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  await page.locator('#room').selectOption('halle');
  await page.waitForFunction(expected=>{
   const p=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(p.x-expected.x,p.y-expected.y,p.z-expected.z)<.01;
  },viewpoints.halle.position);
  let heading=0;const samples=[];
  for(const [i,target]of halleCircuit().entries()){
   const end=await travel(ctx,target,heading);heading=end.yaw;
   assert.ok(Math.abs(end.position.y-target.y)<.06,'Correct floor throughout the local circuit');
   const sample={target,position:end.position};samples.push(sample);
   if([2,3,6,8,11,13,15,16,20,21].includes(i)){
    await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
    sample.view=await assertFirstPersonView(page);
    await artifacts.screenshot(page,'halle-walking-'+i+'.png');
   }
   if([3,11,21].includes(i)){
    let requested=heading;sample.cameraTurns=[];
    for(const [turn,wanted]of [0,Math.PI/2,Math.PI,3*Math.PI/2,heading].entries()){
     const delta=Math.atan2(Math.sin(wanted-requested),Math.cos(wanted-requested));
     await dragLook(page,ctx.context,ctx.profile,-delta/.004);requested=wanted;
     await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
     const view=await assertFirstPersonView(page);
     sample.cameraTurns.push({yaw:wanted,view});
     if(turn<4)await artifacts.screenshot(page,'halle-camera-'+i+'-'+turn+'.png');
     await assertFirstPersonView(page);
    }
   }
  }
  assert.ok(Math.hypot((await position(page)).x-viewpoints.halle.position.x,(await position(page)).z-viewpoints.halle.position.z)<.25);
  await artifacts.json('halle-circuit.json',samples);
  return {samples,input:ctx.profile.hasTouch?'Real touch movement and steering':'Real keyboard/mouse movement',
   scope:'Halle room-selector start, then continuous two-flight/three-void circuit and WC approach/return; no natural exterior-Halle entry claim'};
 }},
 {id:'halle-guard-camera',modes:['stress'],timeoutMs:120000,async run(ctx){
  const {page,baseURL,artifacts}=ctx;await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  await page.locator('#room').selectOption('halle');
  await page.waitForFunction(expected=>Math.abs(JSON.parse(document.querySelector('#model').dataset.position).z-expected.z)<.01,viewpoints.halle.position);
  let heading=0;const samples=[];
  for(const target of halleCircuit().slice(0,4)){const end=await travel(ctx,target,heading);heading=end.yaw;}
  for(let i=0;i<8;i++){
   await dragLook(page,ctx.context,ctx.profile,-Math.PI/4/.004);await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
   const view=await assertFirstPersonView(page);samples.push(view);
   await artifacts.screenshot(page,'halle-landing-turn-'+i+'.png');
  }
  return {samples,scope:'Room shortcut then real stair ascent and eight camera turns; actual opaque guard geometry and eye-height first-person views'};
 }}]};
