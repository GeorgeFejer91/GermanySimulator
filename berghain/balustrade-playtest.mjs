import {assertFirstPersonView} from './fixture-playtest.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand} from './navigation.mjs';
import lounge,{travel} from './lounge-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';
import {enterNaturally,cross} from './lab-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';

const extraInputs=[
  "asset-queue.js",
  "berghain/artwork-playtest.mjs",
  "berghain/balustrade-playtest.mjs",
  "berghain/build-materials.py",
  "berghain/build-together-volume.mjs",
  "berghain/build-together.py",
  "berghain/export-model.mjs",
  "berghain/exterior-playtest.mjs",
  "berghain/klo-playtest.mjs",
  "berghain/lab-playtest.mjs",
  "berghain/material-playtest.mjs",
  "berghain/panorama-services-playtest.mjs",
  "berghain/playtest.mjs",
  "berghain/sound-playtest.mjs",
  "berghain/together-playtest.mjs",
  "berghain/walkthrough-playtest.mjs",
  "tests/berghain-artworks.test.mjs",
  "tests/berghain-balustrades.test.mjs",
  "tests/berghain-exterior.test.mjs",
  "tests/berghain-fixtures.test.mjs",
  "tests/berghain-klo.test.mjs",
  "tests/berghain-lab.test.mjs",
  "tests/berghain-landscape.test.mjs",
  "tests/berghain-lounge.test.mjs",
  "tests/berghain-materials.test.mjs",
  "tests/berghain-model.test.mjs",
  "tests/berghain-panorama-services.test.mjs",
  "tests/berghain-sound-system.test.mjs",
  "tests/berghain-survey.test.mjs",
  "tests/berghain-together.test.mjs",
  "tests/berghain-walkthrough.test.mjs",
  "tools/build-level-pages.mjs"
];
export const sourceFiles=()=>[...lounge.sourceFiles(),...extraInputs.map(path=>({path,
  sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const array=point=>[point.x,point.y,point.z];
const mainStair=layout.architecturalCirculation.mainStair.routes.map(([x,y,z])=>[x,z,y]);

async function nearGuard(ctx,{fallback=false,restore=false}={}){
 const {page,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await enterNaturally(ctx);let heading=0;
 const route=[];
 for(const [x,z,y]of [[5,21.15,.05],...mainStair,[4.5,9,5.45],[-2,8.85,5.45]]){
  const end=await travel(ctx,studyToSite({x,y,z}),heading);heading=end.yaw;route.push(end.position);
 }
 const target=0,turn=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));
 await dragLook(page,context,profile,-turn/.004);heading=target;
 if(fallback)assert.equal(await page.locator('#model').getAttribute('data-materials'),'fallback');
 const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
 let touch;
 if(profile.hasTouch){touch=await context.newCDPSession(page);const b=await page.locator('[data-move="back"]').boundingBox();
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
 }else{await page.locator('#model').focus();await page.keyboard.down('s');}
 await page.waitForTimeout(1100);const blocked=JSON.parse(await page.locator('#model').getAttribute('data-position'));
 await page.waitForTimeout(400);const held=JSON.parse(await page.locator('#model').getAttribute('data-position'));
 if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}else await page.keyboard.up('s');
 assert.ok(canStand(held,layout));assert.ok(Math.hypot(held.x-blocked.x,held.z-blocked.z)<.025,'Continued input must remain stopped by the visible guard');
 assert.ok(Math.hypot(held.x-before.x,held.z-before.z)<.35,'Guard must prevent crossing into the void');
 if(restore){
  // Capture after the real input release has reached the render loop.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const released=JSON.parse(await page.locator('#model').getAttribute('data-position'));
  assert.ok(await page.evaluate(()=>{window.__railContext=document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');window.__railContext?.loseContext();return !!window.__railContext;}));
  await page.getByText('Graphics paused.',{exact:false}).waitFor();await page.evaluate(()=>window.__railContext.restoreContext());
  await page.locator('#model[data-ready="true"]').waitFor();
  const restored=JSON.parse(await page.locator('#model').getAttribute('data-position'));
  await artifacts.json('restored-position.json',{held,released,restored,toleranceMetres:.000001});
  assert.ok(Math.hypot(restored.x-released.x,restored.y-released.y,restored.z-released.z)<.000001,'Graphics restore must preserve the released position within one micrometre');
  await artifacts.screenshot(page,'near-rail-restored.png');
 }
 const samples=[];
 for(let i=0;i<=16;i++){
  if(i){await dragLook(page,context,profile,-Math.PI/8/.004);heading+=Math.PI/8;}
  const sample={yaw:heading,...await assertFirstPersonView(page)};
  samples.push(sample);
  if(i%4===0)await artifacts.screenshot(page,'near-rail-yaw-'+i+'.png');
 }
 await artifacts.json('camera-yaw-samples.json',{route,samples,scope:'Actual exterior entry, real stair ascent and gallery approach followed by real pointer drags; no forced placement or room selector'});
 assert.ok(samples.every(s=>s.perspective==='first-person'&&s.avatar==='false'));
 const returned=await travel(ctx,studyToSite({x:-2,y:5.45,z:7.8}),heading);
 await dragLook(page,context,profile,Math.atan2(Math.sin(returned.yaw),Math.cos(returned.yaw))/.004);
 const clearDistance=Number(await page.locator('#model').getAttribute('data-camera-distance'));
 assert.equal(clearDistance,0,'First-person camera has no follow distance');
 await assertFirstPersonView(page);
 await artifacts.screenshot(page,'clear-camera-restored.png');
 return {route,before,blocked,held,samples,clearDistance,fallback,restore};
}

export default {name:'Original foyer and stair balustrades',sourceFiles,scenarios:[{
  id:'rail-close-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
    const {page,baseURL,artifacts}=ctx;
    const view={position:array(studyToSite({x:-2,y:8.7,z:7.9})),target:array(studyToSite({x:-2,y:7.2,z:9.4}))};
    const parity=await compareMaterialRender(ctx,view);
    const bars=layout.parts.filter(p=>p.balustrade==='foyer-gallery-west'&&p.role==='picket');
    const a=bars[Math.floor(bars.length*.7)].center,b=bars[Math.floor(bars.length*.7)+1].center;
    const rays=[a,a.map((v,i)=>(v+b[i])/2)].map(p=>({origin:[p[0],p[1],p[2]+1],direction:[0,0,-1]}));
    const camera=studyToSite({x:-2,y:5.45,z:8.1}),target=studyToSite({x:-2,y:5.45,z:10});
    const yaw=Math.atan2(camera.x-target.x,camera.z-target.z);
    const native=await renderNativeAsset(page,{position:camera,yaw,pitch:-.35,rays});
    assert.equal(native.balustrades.length,3);assert.equal(native.artworks,2);assert.equal(native.equipment,44);
    for(const distances of Object.values(native.geometryProbes)){
      assert.ok(distances[0]>.97&&distances[0]<1.01,'The actual steel bar stops a sightline');
      assert.ok(distances[1]===null||distances[1]>1.05,'The visible opening between bars remains open');
    }
    native.geometryProbes.source.forEach((distance,i)=>{
      if(distance===null)assert.equal(native.geometryProbes.native[i],null);
      else assert.ok(Math.abs(distance-native.geometryProbes.native[i])<.002);
    });
    await artifacts.screenshot(page,'foyer-balustrade-native.png');await disposeNativeAsset(page);
    return {parity,native,scope:'Controlled close-up, standard GLB, real mesh holes; no natural-route claim'};
  }
},{id:'rail-natural-stairs',modes:['quick','stress'],timeoutMs:360000,async run(ctx){
  const {page,artifacts}=ctx;
  await enterNaturally(ctx);let heading=0;const route=[];
  const site=([x,z,y])=>studyToSite({x,y,z});
  const main=[...[[5,21.15,.05],...mainStair,[14,8,5.45],[5,8,5.45],[5,5,5.45]].map(site),...layout.panoramaRegistration.mainApproach.slice(1)];
  const back=[...main.toReversed().slice(1),...[[0,19.7,.05],[0,20.25,.05]].map(site)];
  for(const [index,target]of [...main,...back].entries()){
    assert.ok(canStand(target,layout),'Route waypoint must clear the actual retained structure');
    try{
      const result=await travel(ctx,target,heading);heading=result.yaw;route.push(result.position);
    }finally{
      await artifacts.json('route-leg-'+index+'.json',{index,target,position:JSON.parse(await page.locator('#model').getAttribute('data-position'))});
    }
    await assertFirstPersonView(page);
    if([2,5,6,8,11].includes(index))await artifacts.screenshot(page,'human-original-stairs-'+index+'.png');
  }
  assert.ok(canStand(route.at(-1),layout));
  await assertFirstPersonView(page);
  await cross(ctx);
  const exit=JSON.parse(await page.locator('#model').getAttribute('data-position'));
  assert.ok(Math.abs(exit.z-24.85)<.025&&Math.abs(exit.x)<.025,'Exit must reach the actual doorway outside destination');
  assert.match(await page.locator('#interact').textContent(),/Enter Berghain/);
  await artifacts.screenshot(page,'human-returned-outside.png');
  return {route,exit,input:ctx.profile.hasTouch?'CDP touch movement and steering':'real keyboard and mouse',
    scope:'Actual exterior E/tap entry, both original stairs and upper landing, continuous descent/exit; no selector or forced placement'};
}},
{id:'rail-near-camera',modes:['quick','stress'],timeoutMs:150000,run:nearGuard},
{id:'rail-near-camera-fallback',modes:['stress'],timeoutMs:150000,run:ctx=>nearGuard(ctx,{fallback:true})},
{id:'rail-near-camera-restored',modes:['stress'],profiles:['desktop'],timeoutMs:150000,run:ctx=>nearGuard(ctx,{restore:true})}
]};
