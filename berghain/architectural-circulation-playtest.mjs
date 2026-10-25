import assert from 'node:assert/strict';
import lounge,{travel} from './lounge-playtest.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {smokingToAuthor} from '../assets/models/berghain/architectural-circulation.mjs';
import {canStand} from './navigation.mjs';
import {enterNaturally} from './lab-playtest.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
const site=([x,y,z])=>studyToSite({x,y,z});
const position=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));
const light=async page=>JSON.parse(await page.locator('#model').getAttribute('data-lighting'));
async function select(ctx,room){
 await ctx.page.goto(ctx.baseURL+'/geheim/');await ctx.page.locator('#model[data-ready="true"]').waitFor();
 await ctx.page.locator('#room').selectOption(room);await ctx.page.waitForTimeout(100);
 return viewpoints[room].yaw;
}
async function lookPitch(ctx,delta){
 const box=await ctx.page.locator('#model').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const touch=ctx.profile.hasTouch?await ctx.context.newCDPSession(ctx.page):null;
 for(let left=delta;Math.abs(left)>.01;){
  const dy=Math.sign(left)*Math.min(80,Math.abs(left));
  if(touch){
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await ctx.page.mouse.move(x,y);await ctx.page.mouse.down();await ctx.page.mouse.move(x,y+dy,{steps:4});await ctx.page.mouse.up();}
  left-=dy;
 }
 if(touch)await touch.detach();
}
async function routeView(ctx,heading,target,name){
 const p=await position(ctx.page),yaw=Math.atan2(p.x-target.x,p.z-target.z);
 const turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
 const pitch=Math.atan2(target.y-p.y-1.68,Math.hypot(target.x-p.x,target.z-p.z));
 await dragLook(ctx.page,ctx.context,ctx.profile,-turn/.004);
 await lookPitch(ctx,-pitch/.004);await assertFirstPersonView(ctx.page);
 await ctx.artifacts.screenshot(ctx.page,name+'.png');
 await lookPitch(ctx,pitch/.004);await dragLook(ctx.page,ctx.context,ctx.profile,turn/.004);
}
async function route(ctx,targets,heading,tag,views={}){
 const records=[];
 for(const [i,target] of targets.entries()){
  assert.ok(canStand(target,layout),'Body-clear route waypoint '+JSON.stringify(target));
  try{const step=await travel(ctx,target,heading);heading=step.yaw;records.push(step);}
  finally{await ctx.artifacts.json(tag+'-leg-'+i+'.json',{target,actual:await position(ctx.page)});}
  assert.ok(Math.abs((await position(ctx.page)).y-target.y)<.15,'Arrive at correct floor');
  await assertFirstPersonView(ctx.page);
  if(views[i])await routeView(ctx,heading,site(views[i]),tag+'-walking-'+i);
 }
 return {heading,records};
}
// Approach on the hall side of the glass screen. Cutting diagonally back
// around its far post clips the screen before reaching the stair foot.
const hallApproach=[[5,5.45,8],[14.1,5.45,8]].map(site);
export default {name:'Karhard architectural circulation, fixtures and night cues',sourceFiles:lounge.sourceFiles,scenarios:[
 {id:'architecture-source-native',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
  const v=site([18.8,8.75,-14.6]),target=site([17.4,12.3,-19]);
  const parity=await compareMaterialRender(ctx,{position:[v.x,v.y+1.68,v.z],target:[target.x,target.y,target.z]});
  const samples=[];
  for(const [name,a,b] of [
   ['main-stair',[5,.05,19],[10,3.1,15]],['main-wall',[5,5.45,-9],[5,12,-21]],
   ['eisbar',[18.8,8.75,-14.6],[17.4,12.3,-19]],['eisbar-lower',[14.1,5.45,-14],[18.8,10,-17]],
   ['smoking',smokingToAuthor([27,9.05,-20]),smokingToAuthor([24,7.25,-12])],
   ['smoking-exterior',[36,.05,15],[27,9,7]],['ground-toilets',[-13.2,.05,20.6],[-18,1,19.5]]
  ]){
   const p=site(a),t=site(b);assert.ok(canStand(p,layout),name);
   const yaw=Math.atan2(p.x-t.x,p.z-t.z),pitch=Math.atan2(t.y-(p.y+1.68),Math.hypot(t.x-p.x,t.z-p.z));
   const native=await renderNativeAsset(ctx.page,{position:p,yaw,pitch,fov:60,clubNight:name!=='smoking-exterior',rays:[{origin:[p.x,p.y+1.68,p.z],direction:[t.x-p.x,t.y-p.y-1.68,t.z-p.z]}]});
   assert.ok(native.architecturalCirculation&&native.groundSanitary&&native.mainHallDetails);
   const aHit=native.geometryProbes.source[0],bHit=native.geometryProbes.native[0];
   assert.ok(aHit!==null&&Math.abs(aHit-bHit)<.005);
   await ctx.artifacts.screenshot(ctx.page,name+'-native.png');await disposeNativeAsset(ctx.page);samples.push({name,native});
  }
  return {parity,samples,scope:'Controlled standard GLB views and source/native geometry; night cues except exterior; no natural-route claim'};
 }},
 {id:'architecture-main-stair',modes:['quick','stress'],timeoutMs:300000,async run(ctx){
  let heading;
  if(ctx.profile.id==='desktop'){await enterNaturally(ctx);heading=0;}
  else heading=await select(ctx,'foyer');
  const approach=[[0,.05,21.1],[5,.05,21.1],[5,.05,10.6]].map(site);
  let r=await route(ctx,[...approach,...layout.architecturalCirculation.mainStair.siteRoute],heading,'main-up',{2:[8,2.2,14],3:[12,4.2,15],4:[12,5.5,19],5:[12,4.5,15]});heading=r.heading;
  await ctx.artifacts.screenshot(ctx.page,'main-upper-arrival-source.png');
  const back=await route(ctx,layout.architecturalCirculation.mainStair.siteRoute.toReversed(),heading,'main-down');
  await ctx.artifacts.screenshot(ctx.page,'main-lower-return-source.png');
  assert.ok((await position(ctx.page)).y<.1);
  return {out:r.records,back:back.records,scope:ctx.profile.id==='desktop'?'Real exterior queue/admission entry and folded main stair ascent/descent':'Room-selector foyer arrival, then real touch input through every main stair leg in both directions; Android emulation'};
 }},
 {id:'architecture-smoking-route',modes:['quick','stress'],timeoutMs:240000,async run(ctx){
  let heading=await select(ctx,'berghain');
  let r=await route(ctx,[[5,5.45,8],[14,5.45,8],[20,5.45,8]].map(site).concat(layout.architecturalCirculation.smoking.siteRoute),heading,'tower-up',
   {5:smokingToAuthor([27,10.5,-14]),7:smokingToAuthor([27,10.7,-14])});heading=r.heading;
  assert.equal((await light(ctx.page)).room,'smoking');await ctx.artifacts.screenshot(ctx.page,'smoking-upper-source.png');
  const back=await route(ctx,layout.architecturalCirculation.smoking.siteRoute.toReversed(),heading,'tower-down');
  await ctx.artifacts.screenshot(ctx.page,'smoking-main-door-source.png');
  return {out:r.records,back:back.records,scope:'Main-floor room shortcut then real keyboard/touch approach through front-side doorway and outward smoking flights in both directions; upper doorway connects through the separately tested estimated Panorama passage'};
 }},
 {id:'architecture-eisbar-route',modes:['quick','stress'],timeoutMs:300000,async run(ctx){
  let heading=await select(ctx,'berghain');
  const e=layout.architecturalCirculation.eisbar;
  let r=await route(ctx,[...hallApproach,...e.siteGuestRoute],heading,'eisbar-counter',
    {2:[14.1,8,-17],3:[16.2,11,-18],6:[19.35,11,-17],8:[18.4,11.5,-19]});heading=r.heading;
  assert.equal((await light(ctx.page)).room,'eisbar');
  assert.ok(Math.abs((await position(ctx.page)).y-e.floorHeight)<.15);
  await routeView(ctx,heading,site([18.4,11.5,-19]),'eisbar-counter-source');
  const counterBack=await route(ctx,e.siteGuestRoute.toReversed(),heading,'eisbar-counter-return');
  const upper=await route(ctx,e.siteUpperRoute,counterBack.heading,'eisbar-upper',{3:[16.2,10.8,-18]});
  await ctx.artifacts.screenshot(ctx.page,'eisbar-upper-source.png');
  const back=await route(ctx,e.siteUpperRoute.toReversed(),upper.heading,'eisbar-down');
  await ctx.artifacts.screenshot(ctx.page,'eisbar-lower-source.png');
  return {out:r.records,counterBack:counterBack.records,upper:upper.records,back:back.records,scope:'Main-floor shortcut then real input to the raised counter and back, followed by upper stair roundtrip; endpoint remains a bounded service landing'};
 }},
 {id:'architecture-ground-toilets',modes:['quick','stress'],timeoutMs:180000,async run(ctx){
  let heading=await select(ctx,'foyer');
  const start=[[0,.05,14.4]].map(site),publicRoute=layout.groundSanitary.route;
  let r=await route(ctx,[...start,...publicRoute],heading,'ground-wc-entry',{0:[-8.8,.05,14.4],2:[-10.5,.05,19.6]});heading=r.heading;
  assert.equal((await light(ctx.page)).room,'groundToilets');await routeView(ctx,heading,site([-18,.05,19.6]),'ground-wc-source');
  const stallRoute=[];
  for(const stall of layout.groundSanitary.stalls){const [x,y]=stall.authorCenter;stallRoute.push(site([x,y,20.6]),stall.center,site([x,y,20.6]));}
  const stalls=await route(ctx,stallRoute,heading,'ground-wc-stalls');
  const back=await route(ctx,publicRoute.toReversed(),stalls.heading,'ground-wc-return');
  return {out:r.records,stalls:stalls.records,back:back.records,scope:'Foyer shortcut then real public corridor, east doorway, all three provisional stalls and return; no staff route'};
 }},
 {id:'architecture-room-controls',modes:['quick','stress'],timeoutMs:120000,async run(ctx){
  const {page,baseURL,artifacts}=ctx,rows=[],errors=[];
  page.on('console',message=>{if(/shader error|VALIDATE_STATUS|program not valid/i.test(message.text()))errors.push(message.text());});
  await page.route('**/assets/models/berghain/textures/**',r=>r.abort());
  await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();await page.locator('#enter').click();
  assert.equal(await page.locator('#model').getAttribute('data-materials'),'fallback');
  for(const name of ctx.rooms||['groundToilets','eisbar','smoking']){
   await page.locator('#room').selectOption(name);
   await page.waitForFunction(expected=>JSON.parse(document.querySelector('#model').dataset.lighting).room===expected,name,{timeout:5000});
   assert.equal((await light(page)).room,name);await assertFirstPersonView(page);
   assert.equal(await page.locator('#location').textContent(),viewpoints[name].label);
   for(const [width,height]of [[320,740],[740,320],[1280,800],[2400,1400]])for(const enlarged of [false,true]){
    await page.setViewportSize({width,height});
    await page.evaluate(large=>{document.documentElement.style.fontSize=large?'32px':'16px';document.body.style.letterSpacing=large?'.12em':'';document.body.style.wordSpacing=large?'.16em':'';},enlarged);
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(120);
    const row=await page.evaluate(()=>({measurement:document.documentElement.dataset.textMeasurement,
     horizontal:document.documentElement.scrollWidth>innerWidth+1,
     clipped:[...document.querySelectorAll('[data-measure]')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id),
     selected:document.querySelector('#room').selectedOptions[0].textContent,fit:document.querySelector('#room').dataset.fit,
     full:document.querySelector('#room-full-name').hidden?null:document.querySelector('#room-full-name').textContent}));
    assert.equal(row.measurement,'pretext-0.0.9');assert.equal(row.horizontal,false);assert.deepEqual(row.clipped,[]);
    assert.ok(row.fit==='fit'||row.full===row.selected);rows.push({name,width,height,enlarged,...row});
   }
   await page.setViewportSize(ctx.profile.viewport);await page.evaluate(()=>{document.documentElement.style.fontSize='16px';document.body.style.letterSpacing='';document.body.style.wordSpacing='';});
   await page.waitForTimeout(200);await dragLook(page,ctx.context,ctx.profile,5);await dragLook(page,ctx.context,ctx.profile,-5);await page.waitForTimeout(120);
   await artifacts.screenshot(page,name+'-fallback.png');
  }
  // The permanent playable route uses an additional walking-location update.
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  for(const name of ctx.rooms||['groundToilets','eisbar','smoking']){
   await page.locator('#room').selectOption(name);await page.waitForTimeout(80);
   assert.equal(await page.locator('#location').textContent(),viewpoints[name].label);
  }
  assert.deepEqual(errors,[]);await artifacts.json('new-room-labels.json',rows);
  return {rows,scope:'Room selectors and texture fallback; locked Pretext, four viewport sizes, 200% text with expanded spacing; no architectural accuracy claim'};
 }}
]};
