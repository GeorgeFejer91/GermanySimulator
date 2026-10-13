// Silent rendered sequences: controlled camera poses, unchanged production facing.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.FACING_OUTPUT||'output/office-facing');mkdirSync(out,{recursive:true});
const baseline=process.env.FACING_REF;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert(file.startsWith(root+sep));res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(readFileSync(file))}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=(process.env.FACING_ORIGIN||`http://127.0.0.1:${server.address().port}`).replace(/\/$/,'');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
const report={source:baseline||origin,cases:[],limits:['Camera poses and frozen simulation are fixture controls; production camera, actor updates and WebGL render run unchanged','Silent desktop/Android emulation, no physical device or perceptual audio review']};
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}],['missing-native',{width:1280,height:800}]]){
  if(process.env.FACING_CASE&&name!==process.env.FACING_CASE)continue;
  const context=await browser.newContext({viewport,isMobile:name==='portrait'||name==='landscape',hasTouch:name==='portrait'||name==='landscape'}),page=await context.newPage(),errors=[];let blockedNative=0;
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(u){u.onstart?.();u.onend?.()}}});
  });
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGLProgram|GL_INVALID|VALIDATE_STATUS/.test(m.text()))errors.push(m.text())});
  if(name==='missing-native')await page.route('**/assets/buergeramt/animation/**',r=>{blockedNative++;return r.abort()});
  await page.route('**/world3d.js*',async route=>{
   let source=baseline?execFileSync('git',['show',baseline+':world3d.js'],{encoding:'utf8',maxBuffer:8_000_000}):await(await route.fetch()).text();
   const needle='    function drawView(renderCamera,reflection=false){';assert(source.includes(needle));
   source=source.replace(needle,needle+`\n    if(window.__facingFrames){const sprites=[...amtCharacters,...amtMoving].map(a=>({id:a.id,mesh:a.mesh})),paint=[];amtScene.traverse(mesh=>{if(mesh.visible&&mesh.userData.anchorActive)paint.push({id:'native',mesh})});window.__facingFrames.push({reflection,camera:renderCamera.position.toArray(),actors:[...sprites,...paint].map(({id,mesh})=>{const expected=new T.Vector3(renderCamera.position.x-mesh.position.x,0,renderCamera.position.z-mesh.position.z).normalize(),normal=new T.Vector3(0,0,1).applyQuaternion(mesh.quaternion);return{id,position:mesh.position.toArray(),rotation:mesh.rotation.toArray(),normal:normal.toArray(),error:normal.distanceTo(expected),visible:mesh.visible}})});}`);
   await route.fulfill({contentType:'text/javascript',body:source});
  });
  if(baseline)await page.route('**/buergeramt-splat.js*',route=>route.fulfill({contentType:'text/javascript',body:execFileSync('git',['show',baseline+':buergeramt-splat.js'],{encoding:'utf8'})}));
  await page.goto(`${origin}/?geheim=buergeramt`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active,null,{timeout:120000});
  await page.evaluate(()=>{
   const level=BuergeramtLevel;level.replay({cinematics:false,voiceOn:()=>false,onClose:()=>{}});
   window.__facingUpdate=level.update.bind(level);level.update=()=>{};window.__facingRealView=Object.getOwnPropertyDescriptor(level,'view').get;window.__facingView=level.view;
   Object.defineProperty(level,'view',{configurable:true,get:()=>({...__facingView})});
  });
  const cases=[];
  for(const [pose,x,z,targetX,targetZ] of [['rear',-3.5,-3.5,-5.65,5.36],['side',-6.8,-1,-5.65,5.36],['offscreen',-3.5,-3.5,0,-10],['near',-5.65,4,-5.65,5.36],['partial',-3.5,-3.5,-10,5.36]]){
   await page.evaluate(({x,z,targetX,targetZ})=>{__facingView={...__facingView,x,z,yaw:Math.atan2(targetX-x,z-targetZ)};window.__facingFrames=[];Germany3D.sync()},{x,z,targetX,targetZ});
   await page.waitForFunction(()=>__facingFrames.filter(f=>!f.reflection).length>=30,null,{timeout:30000});
   const frames=await page.evaluate(()=>{const frames=__facingFrames;window.__facingFrames=null;return frames});
   const main=frames.filter(f=>!f.reflection),reflected=frames.filter(f=>f.reflection),maxError=Math.max(...frames.flatMap(f=>f.actors.map(a=>a.error)));
   await page.screenshot({path:resolve(out,`${name}-${pose}.png`)});
   // Repeated still frames reveal the whole-painting half-turn, independently of gait.
   await page.evaluate(()=>{window.__facingSync=Germany3D.sync;Germany3D.sync=()=>{}});
   for(let frame=0;frame<4;frame++){await page.evaluate(()=>__facingSync());await page.screenshot({path:resolve(out,`${name}-${pose}-${frame}.png`)})}
   await page.evaluate(()=>{Germany3D.sync=__facingSync});
   const item={pose,mainFrames:main.length,reflectionFrames:reflected.length,nativeFrames:frames.filter(f=>f.actors.some(a=>a.id==='native')).length,maxError,frames};cases.push(item);
   if(!process.env.FACING_EXPECT_BUG)assert(maxError<1e-9,`${name}/${pose}: character facing oscillates (${maxError})`);
   if(pose==='rear'||pose==='near')assert(reflected.length>0,'mirror captures while in view');if(pose==='offscreen')assert.equal(reflected.length,0);
  }
  const movement=await page.evaluate(()=>{window.__facingFrames=[];const before=__facingRealView();dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<8;i++){__facingUpdate(1/60);__facingView=__facingRealView();Germany3D.sync()}dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));return{before,after:__facingRealView(),frames:__facingFrames}});
  assert(movement.after.walkedDistance>movement.before.walkedDistance);if(!process.env.FACING_EXPECT_BUG)assert(movement.frames.every(f=>f.actors.every(a=>a.error<1e-9)));
  await page.setViewportSize({width:viewport.height,height:viewport.width});await page.evaluate(()=>Germany3D.sync());
  await page.evaluate(()=>{document.getElementById('amt-leave').click();Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.amtPotatoMirror.visible),false);
  if(name==='missing-native'){assert(blockedNative>0,'real native manifests were blocked');assert(cases.every(c=>c.nativeFrames===0),'failed native art uses ordinary sprite fallback')}
  assert.deepEqual(errors,[]);report.cases.push({name,cases,movement,blockedNative,errors});await context.close();console.log(JSON.stringify({name,maxError:Math.max(...cases.map(c=>c.maxError)),blockedNative,captured:true}));
 }
 const context=await browser.newContext();await context.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};speechSynthesis.speak=u=>{}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${origin}/3d.html`);await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:120000});assert.deepEqual(errors,[]);await context.close();
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close()}
