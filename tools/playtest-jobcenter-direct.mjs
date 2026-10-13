import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/jobcenter');mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=process.env.JOBCENTER_TEST_BASE||`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
const report={base,limits:['Silent media/Web Audio/speech checks; no listening review','Android emulation, not physical Android','Direct URL is the actual entry path; no player teleport or media seeking'],cases:[]};
function silence(){
 const play=HTMLMediaElement.prototype.play;window.__jobMedia=[];HTMLMediaElement.prototype.play=function(...args){this.muted=true;if(this.src.includes('/jobcenter/')&&!window.__jobMedia.includes(this))window.__jobMedia.push(this);return play.apply(this,args)};
 const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
 const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
 window.__contexts=[];const Context=window.AudioContext;window.AudioContext=class extends Context{constructor(...args){super(...args);window.__contexts.push(this)}};
}
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:name==='android',hasTouch:name==='android'});context.setDefaultTimeout(90000);await context.addInitScript(silence);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await page.goto(base+'?geheim=jobcenter',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.jobcenter.active&&!document.body.classList.contains('preloading'));
  const initial=await page.evaluate(()=>({visit:Germany3D.jobcenter,hud:Germany3DBridge.getHUDState(),player:{...Germany3DBridge.player},door:Germany3DBridge.buildings.find(b=>b.id==='jobcenter'),titleHidden:document.getElementById('intro').classList.contains('hidden'),humorHidden:document.getElementById('humor-modal').hidden,contexts:window.__contexts.map(c=>c.state)}));
  assert.equal(initial.titleHidden,true);assert.equal(initial.humorHidden,true);assert.equal(initial.hud.started,true);assert.equal(initial.hud.busy,true);assert.equal(initial.visit.phase,'approach');assert.equal(initial.visit.distance,34);
  assert.equal(initial.player.x,initial.door.doorX);assert.ok([65,95,120,150].includes(initial.player.y-initial.door.doorY));
  await page.screenshot({path:resolve(out,`direct-${name}-entry.png`)});
  if(name==='desktop'){
   await page.keyboard.down('KeyW');await page.waitForFunction(()=>Germany3D.jobcenter.mediaStarted&&Germany3D.jobcenter.playback>.5);await page.keyboard.up('KeyW');
  }else{
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:70,y:650,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:70,y:575,id:1}]});
   await page.waitForFunction(()=>Germany3D.jobcenter.mediaStarted&&Germany3D.jobcenter.playback>.5);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const speaking=await page.evaluate(()=>({visit:Germany3D.jobcenter,contexts:window.__contexts.map(c=>c.state)}));
  assert.equal(speaking.visit.failed,false);assert.ok(speaking.contexts.includes('running'),'first movement gesture unlocks the effect context');
  if(name==='desktop'){
   await page.waitForFunction(()=>!Germany3D.jobcenter.active,{},{timeout:40000});
   await page.waitForFunction(()=>!Germany3D.jobcenter.release);
  }else{await page.setViewportSize({width:844,height:390});await page.screenshot({path:resolve(out,'direct-android-landscape.png')});await page.keyboard.press('Escape')}
  const exit=await page.evaluate(()=>({visit:Germany3D.jobcenter,hud:Germany3DBridge.getHUDState(),player:{...Germany3DBridge.player},media:window.__jobMedia.map(m=>({src:m.getAttribute('src'),paused:m.paused}))}));
  assert.equal(exit.hud.busy,false);assert.equal(exit.visit.active,false);assert.equal(exit.player.x,initial.door.doorX);assert.ok([65,95,120,150].includes(exit.player.y-initial.door.doorY));assert.ok(exit.media.every(m=>m.paused&&!m.src));
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active),false,'direct URL cannot reopen after exit');
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active),false);
  await page.screenshot({path:resolve(out,`direct-${name}-street.png`)});assert.deepEqual(errors,[]);
  report.cases.push({name,initial,speaking,exit,errors});console.log(JSON.stringify({name,result:'PASS'}));await context.close();
 }
 for(const route of ['', '3d.html']){
  const context=await browser.newContext();await context.addInitScript(silence);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+route);await page.waitForFunction(()=>window.Germany3D?.ready);assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active),false);
  if(!route)assert.equal(await page.locator('#intro').evaluate(e=>!e.classList.contains('hidden')),true);
  assert.deepEqual(errors,[]);report.cases.push({route,result:'PASS',errors});await context.close();
 }
 writeFileSync(resolve(out,'direct-browser-report.json'),JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(done=>server.close(done))}
