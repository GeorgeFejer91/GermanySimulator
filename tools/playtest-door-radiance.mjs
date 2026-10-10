// Silent rendered proof; test-only relocation/clock seam is never shipped to players.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/door-radiance/browser');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);if(file===resolve(root,'game.js'))data=data.toString().replace('window.Germany3DBridge={','window.__doorState=state;window.Germany3DBridge={');if(file===resolve(root,'world3d.js'))data=data.toString().replace('  app.classList.add("three-ready");','  window.__doorTest={at(time){buergeramtDoorGlow.time=time;Germany3D.sync()}};app.classList.add("three-ready");');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={revision:Object.fromEntries(['world3d.js','game.js','3d.html'].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),cases:[],limits:['Forced entrance relocation and phase captures; no natural mission-chain proof','Android emulation only; no physical Android','Headless and media/WebAudio/speech muted; no listening claim']};
try{
 for(const [name,viewport,failure,diagnostic] of [['desktop',{width:1280,height:800},false,false],['android-portrait',{width:390,height:844},false,false],['android-landscape',{width:844,height:390},false,false],['fallback',{width:1280,height:800},true,false],['diagnostic',{width:1280,height:800},false,true]]){
  const mobile=name.startsWith('android'),context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(failure)await page.route('**/city-kit/municipal-office.glb*',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${diagnostic?'3d.html':'index.html'}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&(Germany3DBridge.startupAssetsReady??true),null,{timeout:120000});
  if(!diagnostic){assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance.visible),false);await page.keyboard.press('s');await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});}
  const before=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));
  if(mobile){const b=await page.locator('.control-dock [data-key="ArrowUp"]').boundingBox();assert.ok(b&&b.width>0);const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await page.waitForTimeout(300);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else {await page.keyboard.down('ArrowUp');await page.waitForTimeout(300);await page.keyboard.up('ArrowUp');}
  const after=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>0);
  const pose=await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='buergeramt'),p=Germany3DBridge.player;p.x=b.doorX;p.y=b.doorY+200;Germany3D.sync();return{x:p.x,y:p.y}});
  await page.waitForFunction(failure=>{Germany3D.sync();const d=Germany3D.inspectAssets().doorRadiance;return d.visible&&(failure?!d.loaded:!!d.loaded)&&Germany3D.nearbyAssetsReady},failure,{timeout:120000});
  await page.waitForTimeout(250);if(!diagnostic)await page.waitForFunction(()=>document.getElementById('border-alert').hidden);
  const captures=[];
  for(const [time,phase] of [[1,'black'],[4,'red'],[7,'gold']]){const d=await page.evaluate(time=>{__doorTest.at(time);return Germany3D.inspectAssets().doorRadiance},time);assert.equal(d.phase,phase);assert.equal(d.depthTest,true);assert.equal(d.depthWrite,false);assert.ok(d.doorSize[0]>.8&&d.doorSize[1]>=1.7);assert.ok(d.lightIntensity>0);captures.push(d);if(name==='desktop'||phase==='gold')await page.screenshot({path:resolve(out,name+'-'+phase+'.png')});}
  if(name==='desktop'){
   await page.evaluate(()=>{window.__doorCycle=[];window.__doorSample=setInterval(()=>__doorCycle.push(Germany3D.inspectAssets().doorRadiance),100)});await page.waitForTimeout(9500);
   const cycle=await page.evaluate(()=>{clearInterval(__doorSample);return __doorCycle});assert.deepEqual([...new Set(cycle.map(d=>d.phase))].sort(),['black','gold','red']);assert.ok(Math.max(...cycle.map(d=>d.pulse))-Math.min(...cycle.map(d=>d.pulse))>.3);report.cycle=cycle;
  }
  if(!diagnostic){await page.locator('#file-toggle').click();const before=await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance.time);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance.time),before);await page.keyboard.press('Escape');}
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);const reduced=await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance);assert.equal(reduced.phase,'gold');assert.equal(reduced.rayTime,0);assert.equal(reduced.pulse,.9);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance.time),reduced.time);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{Germany3DBridge.player.x+=6000;Germany3D.sync()});const hidden=await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance);assert.equal(hidden.visible,false);assert.equal(hidden.lightIntensity,0);
  await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance.time),hidden.time);
  await page.evaluate(p=>{Object.assign(Germany3DBridge.player,p);Germany3D.sync()},pose);assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().doorRadiance.visible),true);
  assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',captures,reduced,hidden,movement:Math.hypot(after.x-before.x,after.y-before.y),errors});console.log(name,'PASS');await context.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
