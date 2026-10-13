// Silent real-browser encounter checks. City placement is an explicit diagnostic shortcut.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/jobcenter');mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{let file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+sep))throw Error('path');const body=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(body)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={limits:['Silent audio state checks; no listening verdict','Android emulation, not a physical device','City placement is forced; final approach and entry use production input'],cases:[]};
const silenceAudio=()=>{
   const play=HTMLMediaElement.prototype.play;window.__jobMedia=[];HTMLMediaElement.prototype.play=function(...args){this.muted=true;if(this.src.includes('/jobcenter/')&&!window.__jobMedia.includes(this))window.__jobMedia.push(this);return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
};
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:name==='android',hasTouch:name==='android'});context.setDefaultTimeout(90000);
  await context.addInitScript(silenceAudio);
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR '+e.message)});page.on('request',r=>requests.push(r.url()));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  try{await page.waitForFunction(()=>window.Germany3D?.startupReady&&window.Germany3DBridge?.startupAssetsReady)}catch(error){console.log(await page.evaluate(()=>({ready:window.Germany3D?.ready,startup:window.Germany3D?.startupStatus,characters:window.Germany3DBridge?.characterAssetStatus,hidden:document.hidden})));throw error}
  console.log(JSON.stringify({name,stage:'ready'}));
  assert.equal(requests.some(u=>u.includes('audio/jobcenter')),false,'no audio on boot');
  await page.waitForFunction(()=>!document.body.classList.contains('preloading')&&!document.getElementById('start').disabled);
  await page.keyboard.press('KeyS');
  await page.waitForFunction(()=>document.getElementById('intro').classList.contains('hidden'));
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>Germany3DBridge.getHUDState().busy))break;await page.keyboard.press('KeyE');}
  await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='jobcenter');Object.assign(Germany3DBridge.player,{x:b.doorX,y:b.doorY+120});});
  await page.waitForTimeout(600);await page.screenshot({path:resolve(out,name+'-exterior.png')});
  await page.keyboard.down('KeyW');await page.waitForTimeout(330);await page.keyboard.up('KeyW');
  console.log(await page.evaluate(()=>({stage:'at-door',player:Germany3DBridge.player,hud:Germany3DBridge.getHUDState(),dialogue:document.getElementById('dialogue').hidden})));
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active);
  await page.waitForTimeout(500);const initial=await page.evaluate(()=>Germany3D.jobcenter);assert.equal(initial.phase,'approach');
  await page.screenshot({path:resolve(out,name+'-distant.png')});
  if(name==='desktop'){
   await page.keyboard.down('ArrowUp');await page.waitForFunction(p=>Germany3D.jobcenter.pitch>p+.12,initial.pitch);await page.keyboard.up('ArrowUp');const up=await page.evaluate(()=>Germany3D.jobcenter);assert.equal(up.x,initial.x);assert.equal(up.z,initial.z);
   await page.screenshot({path:resolve(out,name+'-arrow-up.png')});
   await page.keyboard.down('ArrowDown');await page.waitForFunction(p=>Germany3D.jobcenter.pitch<=p,initial.pitch);await page.keyboard.up('ArrowDown');
   await page.mouse.move(850,400);const beforeHover=await page.evaluate(()=>Germany3D.jobcenter);await page.mouse.move(890,360,{steps:4});const hover=await page.evaluate(()=>Germany3D.jobcenter);assert.ok(hover.yaw<beforeHover.yaw&&hover.pitch>beforeHover.pitch);assert.equal(hover.z,beforeHover.z);
   await page.mouse.move(850,400,{steps:4});assert.equal(await page.locator('#jobcenter-input').evaluate(e=>getComputedStyle(e).cursor),'none');
   await page.keyboard.down('KeyS');await page.waitForTimeout(600);await page.keyboard.up('KeyS');
   assert.ok((await page.evaluate(()=>Germany3D.jobcenter.distance))>initial.distance,'walking away is unrestricted');
   await page.keyboard.down('KeyW');await page.waitForFunction(()=>Germany3D.jobcenter.phase==='speaking');await page.keyboard.up('KeyW');
  }else{
   // Actual touchscreen drag in the left movement half; right half remains look.
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:70,y:650,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:70,y:575,id:1}]});
   await page.waitForFunction(()=>Germany3D.jobcenter.phase==='speaking');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.waitForFunction(()=>Germany3D.jobcenter.mediaStarted&&Germany3D.jobcenter.playback>1);
  await page.screenshot({path:resolve(out,name+'-speaking.png')});
  const speaking=await page.evaluate(()=>Germany3D.jobcenter);assert.ok(speaking.energy>0);assert.ok(speaking.pressure>initial.pressure);
  await page.evaluate(()=>{window.__jobCueSamples=[];window.__jobCueTimer=setInterval(()=>{const j=Germany3D.jobcenter;if(j.active)window.__jobCueSamples.push({time:j.playback,level:j.rumbleLevel,dismissal:j.dismissal,active:j.rumbleActive})},100)});
  const samples=await page.evaluate(async()=>{const rows=[];for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,90));rows.push({time:Germany3D.jobcenter.playback,energy:Germany3D.jobcenter.energy})}return rows});
  assert.ok(new Set(samples.map(s=>Math.round(s.energy*100))).size>2,'fire responds to changing media energy');
  if(name==='desktop'){
   await page.keyboard.down('KeyW');await page.waitForTimeout(1700);await page.keyboard.up('KeyW');
   await page.screenshot({path:resolve(out,name+'-furious.png')});
   // Hidden-page boundary is injected; real media pause/resume is observed.
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   assert.equal(await page.evaluate(()=>Germany3D.jobcenter.rumbleActive),false,'hidden visit releases rumble source');
   const paused=await page.evaluate(()=>window.__jobMedia.at(-1).currentTime);await page.waitForTimeout(650);
   assert.ok(Math.abs((await page.evaluate(()=>window.__jobMedia.at(-1).currentTime))-paused)<.03);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
  }else{
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);await page.screenshot({path:resolve(out,name+'-landscape.png')});
  }
  await page.waitForFunction(()=>!Germany3D.jobcenter.active,null,{timeout:45000});
  const cueSamples=await page.evaluate(()=>{clearInterval(window.__jobCueTimer);return window.__jobCueSamples});
  assert.ok(cueSamples.some(s=>s.active&&s.level>.4),'long speech pauses produce rumble');
  assert.ok(cueSamples.some(s=>s.dismissal>.7),'final dismissal builds the threat');
  assert.ok(cueSamples.some(s=>s.active&&s.level<.1),'speech ducks the rumble');
  const exit=await page.evaluate(()=>({player:{...Germany3DBridge.player},class:document.body.classList.contains('jobcenter-inside'),media:window.__jobMedia.map(m=>({src:m.getAttribute('src'),paused:m.paused})),surface:!!document.getElementById('jobcenter-input')}));
  assert.equal(exit.class,false);assert.equal(exit.surface,false);assert.ok(exit.media.every(m=>m.paused&&!m.src));
  await page.screenshot({path:resolve(out,name+'-ejected.png')});
  // Re-entry and explicit recovery never keep the old audio or controls.
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active);await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active),false);
  assert.deepEqual(errors,[]);report.cases.push({name,initial,speaking,samples,cueSamples,exit,errors});
  console.log(JSON.stringify({name,result:'PASS'}));await context.close();
 }
 // Shared diagnostic uses the identical facade and encounter renderer.
 const diagnostic=await browser.newContext();await diagnostic.addInitScript(silenceAudio);const p=await diagnostic.newPage();await p.goto(`http://127.0.0.1:${server.address().port}/3d.html`);await p.waitForFunction(()=>window.Germany3D?.ready);assert.ok(await p.evaluate(()=>Germany3DBridge.buildings.some(b=>b.id==='jobcenter')));await diagnostic.close();
 writeFileSync(resolve(out,'browser-report.json'),JSON.stringify(report,null,2));
}finally{await browser.close();server.close()}

