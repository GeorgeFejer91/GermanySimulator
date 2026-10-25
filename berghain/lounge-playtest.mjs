import {assertFirstPersonView} from './fixture-playtest.mjs';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand} from './navigation.mjs';
import {dragLook} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';

async function selectRoom(page,name){
  await page.locator('#room').selectOption(name);
  await page.waitForFunction(expected=>{
    const p=JSON.parse(document.querySelector('#model').dataset.position);
    return Math.hypot(p.x-expected.x,p.y-expected.y,p.z-expected.z)<.01;
  },viewpoints[name].position);
}

export async function travel(ctx,target,heading){
  const {page,context,profile}=ctx;
  const start=JSON.parse(await page.locator('#model').getAttribute('data-position'));
  if(Math.hypot(start.x-target.x,start.z-target.z)<.02){
    assert.ok(canStand(start,layout));assert.ok(Math.abs(start.y-target.y)<.05);
    return {yaw:heading,position:start,corrections:[]};
  }
  const yaw=Math.atan2(start.x-target.x,start.z-target.z);
  const turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
  await dragLook(page,context,profile,-turn/.004);
  const touch=profile.hasTouch?await context.newCDPSession(page):null;
  if(touch){
    const b=await page.locator('[data-move="forward"]').boundingBox();
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
  }else{await page.locator('#model').focus();await page.keyboard.down('w');}
  try{
    await page.waitForFunction(({start,target})=>{
      const p=JSON.parse(document.querySelector('#model').dataset.position),dx=target.x-start.x,dz=target.z-start.z;
      return (target.x-p.x)*dx+(target.z-p.z)*dz<.06*Math.hypot(dx,dz);
    },{start,target},{timeout:18000});
  }finally{
    if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}
    else await page.keyboard.up('w');
  }
  let end=JSON.parse(await page.locator('#model').getAttribute('data-position'));
  const corrections=[];
  for(let attempt=0;attempt<8&&Math.hypot(end.x-target.x,end.z-target.z)>=.23;attempt++){
    assert.ok(canStand(end,layout),'route is legal before corrective input');
    const remaining=(end.x-target.x)*Math.sin(yaw)+(end.z-target.z)*Math.cos(yaw);
    const forward=remaining>0,before=end;
    if(profile.hasTouch){
      const correction=await context.newCDPSession(page);
      const b=await page.locator(`[data-move="${forward?'forward':'back'}"]`).boundingBox();
      try{
        await correction.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
        await page.waitForTimeout(25);
      }finally{
        await correction.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await correction.detach();
      }
    }else await page.keyboard.press(forward?'w':'s',{delay:25});
    end=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    corrections.push({before,forward,end});
  }
  if(corrections.length)ctx.artifacts.log('route-correction',JSON.stringify({target,corrections}));
  assert.ok(canStand(end,layout),'full-body route remains legal');
  assert.ok(Math.hypot(end.x-target.x,end.z-target.z)<.23,JSON.stringify({target,end}));
  return {yaw,position:end,corrections};
}

const runtime=['geheim/index.html','berghain/model.html','berghain/viewer.mjs','berghain/viewer.css',
  'berghain/navigation.mjs','berghain/camera.mjs','berghain/walkthrough.mjs','level-transitions.js',
  'berghain/lounge-playtest.mjs','berghain/native-asset-playtest.mjs','berghain/fixture-playtest.mjs'];
function assets(directory='assets/models/berghain'){
  return readdirSync(new URL('../'+directory,import.meta.url),{withFileTypes:true}).flatMap(item=>
    item.isDirectory()?assets(directory+'/'+item.name):[directory+'/'+item.name]);
}
const suite={name:'Upper Panorama lounge and Felsenland study',
  sourceFiles:()=>[...runtime,...assets()].map(path=>({path,
    sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[
    {id:'lounge-text-layout',modes:['stress'],profiles:['desktop'],async run({page,baseURL,artifacts}){
      await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
      await page.locator('#enter').click();await selectRoom(page,'lounge');await page.evaluate(()=>document.fonts.ready);
      const samples=[];
      for(const viewport of [{width:320,height:740},{width:740,height:320},{width:1280,height:800},{width:2400,height:1400}]){
        await page.setViewportSize(viewport);
        for(const large of [false,true]){
          await page.evaluate(large=>document.documentElement.style.fontSize=large?'32px':'16px',large);
          await page.waitForTimeout(120);
          const sample=await page.evaluate(()=>{
            const select=document.querySelector('#room'),full=document.querySelector('#room-full-name');
            return {measurement:document.documentElement.dataset.textMeasurement,
              horizontal:document.documentElement.scrollWidth>innerWidth+1,
              clipped:[...document.querySelectorAll('[data-measure]')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id),
              selectWhiteSpace:getComputedStyle(select).whiteSpace,selectFit:select.dataset.fit,
              fullName:full.hidden?null:full.textContent,selected:select.selectedOptions[0].textContent};
          });
          assert.equal(sample.horizontal,false);assert.deepEqual(sample.clipped,[]);
          assert.equal(sample.measurement,'pretext-0.0.9');assert.equal(sample.selectWhiteSpace,'nowrap');
          assert.ok(sample.selectFit==='fit'||sample.fullName===sample.selected,'complete selected name remains readable');
          samples.push({viewport,large,...sample});
        }
      }
      await artifacts.screenshot(page,'lounge-long-name-200-percent.png');return {samples};
    }},
    {id:'lounge-source-native',modes:['quick','stress'],profiles:['desktop'],async run(ctx){
      const {page,baseURL,artifacts}=ctx;
      await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
      await page.locator('#enter').click();await selectRoom(page,'lounge');await page.evaluate(()=>document.fonts.ready);
      const position=JSON.parse(await page.locator('#model').getAttribute('data-position'));
      assert.ok(canStand(position,layout));
      await artifacts.screenshot(page,'upper-lounge-source.png');
      const native=await renderNativeAsset(page,{position,yaw:viewpoints.lounge.yaw});
      assert.equal(native.upperLounge.floorHeight,12.15);assert.equal(native.upperLounge.furniture.title,'Felsenland');
      assert.equal(native.equipment,44);assert.equal(native.artworks,layout.artworks.length);
      await artifacts.screenshot(page,'upper-lounge-native.png');await disposeNativeAsset(page);
      const comparisons=[],samples=[],rays=layout.parts.filter(p=>p.shape==='lounge-ceiling-facet'||p.shape==='lounge-faceted-pad').map(p=>({
        origin:[p.center[0],p.shape==='lounge-ceiling-facet'?13.83:13.4,p.center[2]],
        direction:[0,p.shape==='lounge-ceiling-facet'?1:-1,0]}));
      for(const [name,body,target]of [['seat-end',[12,12.15,14],[7,12.85,16.6]],['glass-side',[5,12.15,20],[8,13,16.6]]]){
        const stand={x:body[0],y:body[1],z:body[2]};assert.ok(canStand(stand,layout));
        comparisons.push(await compareMaterialRender(ctx,{position:[body[0],body[1]+1.68,body[2]],target}));
        const d=target.map((v,i)=>v-body[i]-(i===1?1.68:0)),yaw=Math.atan2(-d[0],-d[2]),pitch=Math.atan2(d[1],Math.hypot(d[0],d[2]));
        for(const clubNight of [false,true]){
          const render=await renderNativeAsset(page,{position:stand,yaw,pitch,fov:60,clubNight,rays});
          render.geometryProbes.source.forEach((v,i)=>assert.ok(v!==null&&Math.abs(v-render.geometryProbes.native[i])<.002,'actual source/native surfaces agree'));
          await artifacts.screenshot(page,name+'-'+(clubNight?'night':'day')+'.png');await disposeNativeAsset(page);
          samples.push({name,clubNight,geometry:render.geometryProbes,lighting:render.lighting});
        }
      }
      return {position,native,comparisons,samples,scope:'Room shortcut and controlled legal standing views; observed forms, estimated dimensions/layout; glass artwork imagery absent'};
    }},
    {id:'lounge-connected-route',modes:['stress'],timeoutMs:240000,async run(ctx){
      const {page,baseURL,artifacts}=ctx;
      await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
      await selectRoom(page,'panorama');let heading=viewpoints.panorama.yaw;const route=[];
      for(const target of layout.panoramaRegistration.loungeRoute.slice(1)){
        const result=await travel(ctx,target,heading);heading=result.yaw;route.push(result.position);
        if(target.y>15)await artifacts.screenshot(page,'upper-route-'+route.length+'.png');
      }
      assert.ok(Math.abs(route.at(-1).y-12.15)<.01);await assertFirstPersonView(page);
      assert.equal(await page.locator('#room').inputValue(),'lounge','natural ascent identifies the upper room');
      assert.equal(await page.locator('#location').textContent(),'Upper Panorama lounge');
      const roomArrival=route.at(-1),aisle=[[5.54,15.45],[11.4,15.45],[11.4,16.05],[12,16.05],[12,17.5],[10,18],[5,18],[5,20]].map(([x,z])=>({x,y:12.15,z}));
      for(const target of [...aisle,...aisle.toReversed().slice(1),roomArrival]){
        const result=await travel(ctx,target,heading);heading=result.yaw;route.push(result.position);
      }
      await dragLook(page,ctx.context,ctx.profile,-Math.atan2(Math.sin(viewpoints.lounge.yaw-heading),Math.cos(viewpoints.lounge.yaw-heading))/.004);heading=viewpoints.lounge.yaw;
      await artifacts.screenshot(page,'human-in-upper-lounge.png');
      for(const target of layout.panoramaRegistration.loungeRoute.toReversed().slice(1)){
        const result=await travel(ctx,target,heading);heading=result.yaw;route.push(result.position);
      }
      assert.ok(Math.abs(route.at(-1).y-9.05)<.01);
      assert.equal(await page.locator('#room').inputValue(),'panorama','natural descent restores the lower room');
      return {route,input:ctx.profile.hasTouch?'real touch steering and movement':'real mouse steering and WASD',
        evidence:'Panorama shortcut, then continuous corridor/stair/room/return; natural building entrance tested separately'};
    }}
  ]};
const route=suite.scenarios.find(s=>s.id==='lounge-connected-route');
export default {...suite,scenarios:[...suite.scenarios,{...route,id:'lounge-fallback-route',async run(ctx){
  await ctx.page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
  const result=await route.run(ctx);assert.equal(await ctx.page.locator('#model').getAttribute('data-materials'),'fallback');
  return {...result,fallback:true};
}}]};
