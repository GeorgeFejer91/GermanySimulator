// Isolated silent Chromium; Android cases are emulation, and pairing is stubbed.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/fullscreen');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={cases:[],limits:['Silent Chromium desktop and Android emulation; no physical device or listening review','Phone pairing/messages are stubbed; no live QR connection']};
const stub=`class BuergeramtLink extends EventTarget {
 static fromHash(){return{room:'test',secret:'test',stream:'test'}}
 send(type){if(type==='register')setTimeout(()=>{for(const detail of [{type:'call-arm',id:'grass'},{type:'call',id:'grass',line:'Wer hat diesen Antrag genehmigt?',ringAtPhoneMs:performance.now(),ringAtUtcMs:null,leadMs:2200}])this.dispatchEvent(new CustomEvent('message',{detail}))},0);return true}
 close(){} async start(){window.__phoneLink=this;queueMicrotask(()=>{this.dispatchEvent(new Event('connected'));this.dispatchEvent(new CustomEvent('message',{detail:{type:'ticket',number:'B-007'}}))})}
}
window.BuergeramtLink=BuergeramtLink;`;
try{
 for(const route of ['/','/3d.html','/buergeramt-phone.html'])for(const profile of ['desktop','android']){
  const context=await browser.newContext({viewport:profile==='desktop'?{width:1280,height:800}:{width:390,height:844},isMobile:profile==='android',hasTouch:profile==='android'});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  if(route.includes('phone'))await context.route('**/buergeramt-link.js*',r=>r.fulfill({contentType:'text/javascript',body:stub}));
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}${route}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.GermanyFullscreen);
  assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false,'normal browser blocks gesture-free load');
  if(route.includes('phone'))await page.locator('#phone-number').waitFor({state:'visible'});
  await page.keyboard.press('Shift');assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
  if(profile==='android')await page.touchscreen.tap(12,12);else await page.keyboard.press('w');
  await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
  await page.evaluate(()=>document.exitFullscreen());
  await page.keyboard.press('w');assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false,'exit remains respected');
  if(route.includes('phone')){
   assert.equal(await page.locator('#phone-submit').isEnabled(),true,JSON.stringify(await page.evaluate(()=>({hidden:document.hidden,status:document.getElementById('phone-status').textContent,connection:document.getElementById('phone-connect-status').textContent}))));
   await page.locator('#phone-name').fill('Erika Mustermann');await page.locator('#phone-submit').click();
   await page.locator('#phone-call').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false,'submit respects exit');
   assert.equal(await page.locator('#phone-call-silence').count(),0);await page.locator('#phone-decline').click();assert.ok(await page.locator('#phone-silence').isVisible());
  }
  await page.keyboard.press('Alt+Enter');await page.waitForFunction(()=>document.fullscreenElement);
  await page.keyboard.press('Alt+Enter');await page.waitForFunction(()=>!document.fullscreenElement);
  await page.screenshot({path:resolve(out,`${route==='/'?'root':route.includes('phone')?'phone':'3d'}-${profile}.png`)});
  report.cases.push({route,profile,fullscreen:'load rejected; first interaction entered; exit respected; explicit toggle passed',errors});assert.deepEqual(errors,[]);
  await context.close();
 }
 for(const ui of ['ios','google','samsung','generic'])for(const [width,height,zoom] of [[390,844,1],[320,700,1],[320,700,2],[844,390,1]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:ui==='google'||ui==='samsung',hasTouch:true,locale:ui==='ios'?'en-US':'de-DE'});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  await context.route('**/buergeramt-link.js*',r=>r.fulfill({contentType:'text/javascript',body:stub}));
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/buergeramt-phone.html?callUi=${ui}#captions=${ui==='ios'?'en':'de'}`,{waitUntil:'domcontentloaded'});
  await page.locator('#phone-name').tap();await page.waitForFunction(()=>document.fullscreenElement);
  await page.locator('#phone-name').fill('Erika Mustermann');await page.locator('#phone-submit').tap();await page.locator('#phone-call').waitFor({state:'visible'});
  if(zoom===2)await page.evaluate(()=>document.documentElement.style.zoom=2);
  await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.getElementById('phone-answer-label').dataset.pretextFit);
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('phone-call')).opacity==='1');
  const geometry=await page.evaluate(()=>{
   const call=document.getElementById('phone-call'),ids=['phone-answer','phone-decline','phone-caller','phone-call-state'];
   return{pageWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,callWidth:call.scrollWidth,callClient:call.clientWidth,controls:ids.map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return{id,left:r.left,right:r.right,width:el.scrollWidth,client:el.clientWidth}}),fit:[...call.querySelectorAll('[data-pretext-fit]')].map(el=>[el.id,el.dataset.pretextFit]),silence:!!call.querySelector('#phone-call-silence')};
  });
  assert.equal(geometry.silence,false);assert.ok(geometry.pageWidth<=geometry.viewport+1);assert.ok(geometry.callWidth<=geometry.callClient+1);
  for(const box of geometry.controls){assert.ok(box.left>=-1&&box.right<=width+1,JSON.stringify({ui,width,height,zoom,box}));assert.ok(box.width<=box.client+2)}
  assert.ok(geometry.fit.length>0);assert.ok(geometry.fit.every(([,fit])=>fit!=='unavailable'));assert.deepEqual(errors,[]);
  await page.screenshot({path:resolve(out,`${ui}-${width}x${height}-z${zoom}.png`)});
  report.cases.push({ui,width,height,zoom,geometry,errors});await context.close();
 }
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(`PASS: ${report.cases.length} fullscreen/call layout cases; ${out}`);
}finally{await browser.close();await new Promise(done=>server.close(done))}
