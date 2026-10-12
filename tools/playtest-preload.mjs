// Silent isolated startup/UI checks; Android profiles are browser emulation.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PLAYTEST_OUTPUT||'output/preload');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.json':'application/json','.ttf':'font/ttf'};
const report={checks:[],hashes:Object.fromEntries(['index.html','game.js','world3d.js','preload.js','preload-fit.js','styles.css'].map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),limits:['Silent hardware Chromium; Android emulation, no physical device or listening review','Delayed/failed assets are injected fixtures; this is not full mission progression']};
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!file.startsWith(root+sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 report.browser=browser.version();
 async function session(viewport={width:1280,height:800},mobile=false){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Offline third parties prove the core engine and loader don't depend on the CDN/fonts.
  await page.route(/^https:\/\//,route=>route.abort());
  return {context,page,errors};
 }
 function pass(name,details={}){report.checks.push({name,verdict:'PASS',...details});console.log(name)}
 for(const [name,viewport,mobile] of [['desktop',{width:1280,height:800},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]){
  const {context,page,errors}=await session(viewport,mobile);let release;const held=new Promise(done=>release=done);
  await page.route('**/n-wagen-coach.glb*',async route=>{await held;await route.continue()});
  await page.goto(url,{waitUntil:'commit'});
  await page.waitForFunction(()=>window.Germany3D?.ready&&Number(document.getElementById('preload-meter').getAttribute('aria-valuenow'))>=20);
  assert.ok(await page.locator('#preload').isVisible());assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);
  await page.keyboard.press('s');assert.equal(await page.locator('#intro').evaluate(el=>el.classList.contains('hidden')),false);
  await page.screenshot({path:resolve(out,name+'-loading.png')});
  pass(name+' pending assets guard menu and keyboard Start');
  if(name==='desktop')for(const [width,height,zoom,textSize,copy,spacing] of [[320,568,1,16,'SPIELWELT WIRD VORBEREITET',false],[1280,800,2,16,'SPIELWELT WIRD VORBEREITET',false],[390,844,1,32,'ALLE BENÖTIGTEN SPIELRESSOURCEN WERDEN VORBEREITET',false],[844,390,1,32,'ALLE BENÖTIGTEN SPIELRESSOURCEN WERDEN VORBEREITET',false],[844,390,1,16,'PREPARING ALL REQUIRED GAME RESOURCES',true],[1920,1080,1,16,'SPIELWELT WIRD VORBEREITET',false]]){
   await page.setViewportSize({width,height});await page.evaluate(({zoom,textSize,copy,spacing})=>{document.documentElement.style.zoom=zoom;document.documentElement.style.fontSize=textSize+'px';const el=document.getElementById('preload-status');el.textContent=copy;el.style.lineHeight=spacing?'1.5':'';el.style.letterSpacing=spacing?'.12em':'';el.style.wordSpacing=spacing?'.16em':''}, {zoom,textSize,copy,spacing});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const bounds=await page.evaluate(()=>{const screen=document.getElementById('preload'),panel=document.querySelector('.preload-content'),a=screen.getBoundingClientRect(),b=panel.getBoundingClientRect();return {inside:b.left>=a.left&&b.right<=a.right+.5&&b.top>=a.top&&b.bottom<=a.bottom+.5,overflow:screen.scrollWidth>screen.clientWidth+1||screen.scrollHeight>screen.clientHeight+1,text:[...panel.querySelectorAll('[data-preload-text]:not([hidden])')].map(el=>({fit:el.dataset.pretextFit,measurement:el.dataset.measurement,overflow:el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1}))}});
   assert.ok(bounds.inside&&!bounds.overflow&&!bounds.text.some(t=>t.overflow),JSON.stringify(bounds));assert.ok(bounds.text.every(t=>t.measurement==='pretext-0.0.9'));
   pass('loader text layout',{width,height,zoom,textSize,copy,spacing,bounds});
  }
  await page.setViewportSize(viewport);await page.evaluate(()=>{document.documentElement.style.zoom='';document.documentElement.style.fontSize=''});
  release();await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:60000});
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);assert.equal(await page.locator('#start').isEnabled(),true);
  assert.equal(await page.locator('#preload-meter').getAttribute('aria-valuenow'),'100');
  assert.ok(await page.locator('#intro img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)));
  await page.screenshot({path:resolve(out,name+'-menu.png')});if(mobile)await page.locator('#start').tap();else await page.locator('#start').click();
  assert.ok(await page.locator('#humor-modal').isVisible());assert.deepEqual(errors,[]);
  pass(name+' reveals decoded menu with immediate pointer/touch Start');
  // Existing skip control is invoked as a fixture after proving normal Start.
  // This proves the level-start preload trigger, not the natural questionnaire.
  await page.evaluate(()=>document.getElementById('simulator-s').click());
  await page.waitForFunction(()=>Germany3D.officeAssetStatus.total>0);
  assert.ok(await page.locator('#preload').evaluate(el=>el.hidden));
  await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});
  const x=await page.evaluate(()=>Germany3DBridge.player.x);await page.keyboard.down('ArrowRight');
  await page.waitForFunction(x=>Germany3DBridge.player.x!==x,x,{timeout:10000});await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>Germany3D.officeAssetsReady,null,{timeout:60000});
  const office=await page.evaluate(()=>{const before=Germany3D.officeAssetStatus.total;Germany3D.prepareOfficeAssets();Germany3D.prepareOfficeAssets();return {before,after:Germany3D.officeAssetStatus.total,queue:Germany3DBridge.assetLoadStatus}});
  assert.equal(office.before,office.after);assert.ok(office.queue.active<=2);assert.deepEqual(errors,[]);
  pass(name+' quietly prepares office while city remains playable; repeated requests reuse it',{office});await context.close();
 }
 {
  const {context,page,errors}=await session();await page.route('**/*.glb*',route=>route.abort());
  await page.goto(url,{waitUntil:'commit'});await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:60000});
  assert.ok(await page.locator('#start').isEnabled());assert.ok(await page.evaluate(()=>Germany3D.startupStatus.failed>0));assert.deepEqual(errors,[]);
  pass('missing GLBs settle to existing world fallbacks and release menu');await context.close();
 }
 {
  const {context,page}=await session();await page.route('**/three.module.min.js',route=>route.abort());
  await page.goto(url,{waitUntil:'commit'});await page.locator('#preload-retry').waitFor({state:'visible'});
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);await page.screenshot({path:resolve(out,'engine-failure.png')});pass('engine failure shows readable retry while guarding menu');await context.close();
 }
 {
  const {context,page,errors}=await session({width:390,height:844},true);await page.goto(url+'/?geheim=buergeramt',{waitUntil:'commit'});
  await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:90000});
  assert.ok(await page.evaluate(()=>Germany3D.officeAssetsReady&&Germany3D.officeAssetStatus.total>0));assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(async()=>typeof (await import('./assets/vendor/spark/2.3.1/spark.module.js')).SplatMesh),'function');
  pass('optional office Spark imports resolve through the same pinned local engine');
  pass('direct office prepares its own assets and releases preload');await context.close();
 }
 report.verdict='PASS';
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(done=>server.close(done))}
