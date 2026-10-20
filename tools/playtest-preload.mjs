import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runSuite,isMain,resizeViewport} from './browser-harness.mjs';

export function startupSourceFiles(root){return Object.fromEntries(['index.html','game.js','world3d.js','asset-queue.js','asset-loaders.js','tourist-animation.js','preload.js','preload-fit.js','styles.css'].map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')]))}

async function runStartup({page,context,baseURL:url,profile,artifacts}){
  const mobile=!!profile.isMobile,viewport=profile.viewport,name=!mobile?'desktop':profile.id==='android-portrait'?'portrait':'landscape';
  const checks=[];const pass=(name,details={})=>{checks.push({name,verdict:'PASS',...details});artifacts.log('check',name)};
  const errors=[];page.on('pageerror',error=>{if(errors.length<100)errors.push(error.message)});
  let officeTransportRequested=false;page.on('request',request=>{if(request.url().includes('/vdoninja/'))officeTransportRequested=true});
  await page.route(/^https:\/\//,route=>route.abort());
let release;const held=new Promise(done=>release=done);
  await page.route('**/n-wagen-coach.glb*',async route=>{await held;await route.continue()});
  await page.goto(url,{waitUntil:'commit'});
  await page.waitForFunction(()=>window.Germany3D?.ready&&Number(document.getElementById('preload-meter').getAttribute('aria-valuenow'))>=20);
  assert.ok(await page.locator('#preload').isVisible());assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);
  await page.keyboard.press('s');assert.equal(await page.locator('#intro').evaluate(el=>el.classList.contains('hidden')),false);
  await page.screenshot({path:artifacts.path(name+'-loading.png')});
  pass(name+' pending assets guard menu and keyboard Start');
  if(name==='desktop')for(const [width,height,zoom,textSize,copy,spacing] of [[320,568,1,16,'SPIELWELT WIRD VORBEREITET',false],[1280,800,2,16,'SPIELWELT WIRD VORBEREITET',false],[390,844,1,32,'ALLE BENÖTIGTEN SPIELRESSOURCEN WERDEN VORBEREITET',false],[844,390,1,32,'ALLE BENÖTIGTEN SPIELRESSOURCEN WERDEN VORBEREITET',false],[844,390,1,16,'PREPARING ALL REQUIRED GAME RESOURCES',true],[1920,1080,1,16,'SPIELWELT WIRD VORBEREITET',false]]){
   await resizeViewport(page,{width,height});await page.evaluate(({zoom,textSize,copy,spacing})=>{document.documentElement.style.zoom=zoom;document.documentElement.style.fontSize=textSize+'px';const el=document.getElementById('preload-status');el.textContent=copy;el.style.lineHeight=spacing?'1.5':'';el.style.letterSpacing=spacing?'.12em':'';el.style.wordSpacing=spacing?'.16em':''}, {zoom,textSize,copy,spacing});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const bounds=await page.evaluate(()=>{const screen=document.getElementById('preload'),panel=document.querySelector('.preload-content'),a=screen.getBoundingClientRect(),b=panel.getBoundingClientRect();return {inside:b.left>=a.left&&b.right<=a.right+.5&&b.top>=a.top&&b.bottom<=a.bottom+.5,overflow:screen.scrollWidth>screen.clientWidth+1||screen.scrollHeight>screen.clientHeight+1,text:[...panel.querySelectorAll('[data-preload-text]:not([hidden])')].map(el=>({fit:el.dataset.pretextFit,measurement:el.dataset.measurement,overflow:el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1}))}});
   assert.ok(bounds.inside&&!bounds.overflow&&!bounds.text.some(t=>t.overflow),JSON.stringify(bounds));assert.ok(bounds.text.every(t=>t.measurement==='pretext-0.0.9'));
   pass('loader text layout',{width,height,zoom,textSize,copy,spacing,bounds});
  }
  await resizeViewport(page,viewport);await page.evaluate(()=>{document.documentElement.style.zoom='';document.documentElement.style.fontSize=''});
  release();await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:60000});
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);assert.equal(await page.locator('#start').isEnabled(),true);
  assert.equal(officeTransportRequested,false,'the root title must not fetch the office-only phone SDK');
  assert.equal(await page.locator('#preload-meter').getAttribute('aria-valuenow'),'100');
  assert.ok(await page.locator('#intro img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)));
  await page.screenshot({path:artifacts.path(name+'-menu.png')});if(mobile)await page.locator('#start').tap();else await page.locator('#start').click();
  assert.ok(await page.locator('#humor-modal').isVisible());assert.deepEqual(errors,[]);
  pass(name+' reveals decoded menu with immediate pointer/touch Start');
  // Existing skip control is invoked as a fixture after proving normal Start.
  // This proves the level-start preload trigger, not the natural questionnaire.
  await page.evaluate(()=>document.getElementById('simulator-s').click());
  await page.waitForFunction(()=>Germany3DBridge.getHUDState().started);
  assert.equal(await page.evaluate(()=>Germany3D.officeAssetStatus.total),0,'city Start must not fetch the distant office');
  assert.ok(await page.locator('#preload').evaluate(el=>el.hidden));
  await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});
  const x=await page.evaluate(()=>Germany3DBridge.player.x);await page.keyboard.down('ArrowRight');
  await page.waitForFunction(x=>Germany3DBridge.player.x!==x,x,{timeout:10000});await page.keyboard.up('ArrowRight');
  assert.equal(await page.evaluate(()=>Germany3D.officeAssetStatus.total),0,'ordinary city input must not trigger distant office work');
  // Diagnostic placement isolates asset approach; it does not prove the natural mission route.
  await page.evaluate(()=>{const office=Germany3DBridge.buildings.find(b=>b.id==='buergeramt');Germany3DBridge.player.x=office.doorX;Germany3DBridge.player.y=office.doorY+300;Germany3D.prepareNearbyAssets()});
  await page.waitForFunction(()=>Germany3D.officeAssetStatus.total>0);
  await page.waitForFunction(()=>Germany3D.officeAssetsReady,null,{timeout:60000});
  const office=await page.evaluate(()=>{const before=Germany3D.officeAssetStatus.total;Germany3D.prepareOfficeAssets();Germany3D.prepareOfficeAssets();return {before,after:Germany3D.officeAssetStatus.total,queue:Germany3DBridge.assetLoadStatus}});
  assert.equal(office.before,office.after);assert.ok(office.queue.active<=2);assert.deepEqual(errors,[]);
  pass(name+' defers distant office until staged approach; repeated requests reuse prepared assets',{office});
  return {checks};
}

async function runMissingModels({page,baseURL:url,artifacts}){
  const checks=[];const pass=(name,details={})=>{checks.push({name,verdict:'PASS',...details});artifacts.log('check',name)};
  const errors=[];page.on('pageerror',error=>{if(errors.length<100)errors.push(error.message)});
  await page.route(/^https:\/\//,route=>route.abort());
await page.route('**/*.glb*',route=>route.abort());
  await page.goto(url,{waitUntil:'commit'});await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:60000});
  assert.ok(await page.locator('#start').isEnabled());assert.ok(await page.evaluate(()=>Germany3D.startupStatus.failed>0));assert.deepEqual(errors,[]);
  pass('missing GLBs settle to existing world fallbacks and release menu');
  return {checks};
}

async function runEngineFailure({page,baseURL:url,artifacts}){
  const checks=[];const pass=(name,details={})=>{checks.push({name,verdict:'PASS',...details});artifacts.log('check',name)};
  const errors=[];page.on('pageerror',error=>{if(errors.length<100)errors.push(error.message)});
  await page.route(/^https:\/\//,route=>route.abort());
await page.route('**/three.module.min.js',route=>route.abort());
  await page.goto(url,{waitUntil:'commit'});await page.locator('#preload-retry').waitFor({state:'visible'});
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);await page.screenshot({path:artifacts.path('engine-failure.png')});pass('engine failure shows readable retry while guarding menu');
  return {checks};
}

async function runOfficeStartup({page,baseURL:url,artifacts}){
  const checks=[];const pass=(name,details={})=>{checks.push({name,verdict:'PASS',...details});artifacts.log('check',name)};
  const errors=[];page.on('pageerror',error=>{if(errors.length<100)errors.push(error.message)});
  await page.route(/^https:\/\//,route=>route.abort());
await page.goto(url+'/?geheim=buergeramt',{waitUntil:'commit'});
  await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:90000});
  assert.ok(await page.evaluate(()=>Germany3D.officeAssetsReady&&Germany3D.officeAssetStatus.total>0));assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(async()=>typeof (await import('./assets/vendor/spark/2.3.1/spark.module.js')).SplatMesh),'function');
  pass('optional office Spark imports resolve through the same pinned local engine');
  pass('direct office prepares its own assets and releases preload');
  return {checks};
}

export const startupScenarios=[
  {id:'startup',modes:['quick','stress'],timeoutMs:180000,run:runStartup},
  {id:'startup-missing-models',modes:['stress'],profiles:['desktop'],run:runMissingModels},
  {id:'startup-engine-failure',modes:['stress'],profiles:['desktop'],run:runEngineFailure},
  {id:'startup-office',modes:['stress'],profiles:['android-portrait'],run:runOfficeStartup}
];
if(isMain(import.meta.url)){
  const report=await runSuite({name:'startup',scenarios:startupScenarios,sourceFiles:startupSourceFiles},{mode:'stress',suitePath:'./tools/browser-game-suite.mjs',scenarios:startupScenarios.map(s=>s.id),output:process.env.PLAYTEST_OUTPUT||'output/preload'});
  process.exitCode=report.verdict==='PASS'?0:1;
}
