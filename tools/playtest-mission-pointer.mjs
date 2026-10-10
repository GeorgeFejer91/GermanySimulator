// Silent real-browser checks. Mission selection is forced; this is not a full mission-chain playthrough.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/sausage-pointer/browser');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);if(file===resolve(root,'game.js')){data=data.toString().replace('window.Germany3DBridge={','window.__pointerTest={state,missions,normObjects};window.Germany3DBridge={')}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={cases:[],limits:['Forced mission selection and diagnostic placement; no full natural mission chain','Android emulation only; physical Android not available','Audio muted at all outputs; no listening review']};
try{
 for(const [name,viewport,failure,diagnostic] of [['desktop',{width:1280,height:800},false,false],['android-portrait',{width:390,height:844},false,false],['android-landscape',{width:844,height:390},false,false],['fallback',{width:1280,height:800},true,false],['diagnostic',{width:1280,height:800},false,true]]){
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android')});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(failure)await page.route('**/mission-sausage/sausage.glb',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${diagnostic?'3d.html':'index.html'}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&(window.__pointerTest?Germany3DBridge.startupAssetsReady:true),null,{timeout:120000});
  if(!diagnostic){assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);await page.keyboard.press('s');await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});await page.waitForFunction(()=>Germany3D.inspectAssets().missionPointer.visible);}
  else await page.waitForFunction(()=>Germany3D.inspectAssets().missionPointer.visible);
  let pointer=await page.evaluate(()=>Germany3D.inspectAssets().missionPointer);assert.equal(pointer.loaded,!failure);assert.equal(pointer.target,'buergeramt');
  await page.screenshot({path:resolve(out,name+'.png')});
  const before=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));await page.keyboard.down('ArrowUp');await page.waitForTimeout(350);await page.keyboard.up('ArrowUp');
  const after=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>0);
  const missions=[];
  if(!diagnostic){
   for(let mission=0;mission<8;mission++){const result=await page.evaluate(mission=>{__pointerTest.state.mission=mission;Germany3D.sync();return{target:Germany3DBridge.getMissionWaypoint(),pointer:Germany3D.inspectAssets().missionPointer}},mission);assert.equal(result.pointer.target,result.target.id);const dx=result.target.x-after.x,dz=result.target.y-after.y;assert.ok(Math.abs(Math.sin(result.pointer.heading)-dx/Math.hypot(dx,dz))<1e-8);missions.push(result.target.id)}
   await page.evaluate(()=>{__pointerTest.state.mission=0;__pointerTest.state.modal=true;Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);
   await page.evaluate(()=>{__pointerTest.state.modal=false;Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),true);
   await page.keyboard.press('m');await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',pointer,missions,movement:Math.hypot(after.x-before.x,after.y-before.y),errors});console.log(name,'PASS');await context.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
