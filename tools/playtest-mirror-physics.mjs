// Controlled viewpoints, real mirror rendering, and a color-only identification pass.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.MIRROR_PHYSICS_OUTPUT||'output/mirror-physics');mkdirSync(out,{recursive:true});
const ref=process.env.MIRROR_PHYSICS_REF,baseline=ref?new Map(['world3d.js','buergeramt-potato-mirror.js'].map(f=>[resolve(f),execFileSync('git',['show',ref+':'+f])])):null;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert(file.startsWith(root+sep));res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(baseline?.get(file)||readFileSync(file))}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=(process.env.MIRROR_PHYSICS_ORIGIN||`http://127.0.0.1:${server.address().port}`).replace(/\/$/,'');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
const report={source:ref||'working tree',cases:[],limits:['View and simulation are controlled fixtures, not a natural mission playthrough','Native screenshots plus identification color retaining production geometry, transforms, layers and depth','Silent Chromium desktop/Android emulation; no physical-device or listening evidence']};
const python=process.env.PYTHON_PATH||'python';
const countMask=(on,off)=>Number(execFileSync(python,['-c',"from PIL import Image;import numpy as n;import sys;a=n.asarray(Image.open(sys.argv[1]).convert('RGB')).astype('int16');b=n.asarray(Image.open(sys.argv[2]).convert('RGB')).astype('int16');print(n.count_nonzero((a[:,:,1]>150)&(a[:,:,1]-a[:,:,0]>50)&(a[:,:,1]-a[:,:,2]>50)&(a[:,:,1]-b[:,:,1]>40)))",on,off],{encoding:'utf8'}));
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}],['missing-skin',{width:1280,height:800}]]){
  if(process.env.MIRROR_PHYSICS_CASE&&name!==process.env.MIRROR_PHYSICS_CASE)continue;
  const context=await browser.newContext({viewport,isMobile:name==='portrait'||name==='landscape',hasTouch:name==='portrait'||name==='landscape'}),page=await context.newPage(),errors=[];
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(u){u.onstart?.();u.onend?.()}}});
  });
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGLProgram|GL_INVALID|VALIDATE_STATUS/.test(m.text()))errors.push(m.text())});
  let blockedSkin=0;if(name==='missing-skin')await page.route('**/potato-skin.webp*',r=>{blockedSkin++;return r.abort()});
  await page.route('**/world3d.js*',async route=>{
   let code=await(await route.fetch()).text();
   const needle='  window.Germany3D={ready:true,';assert(code.includes(needle));
   code=code.replace(needle,"  window.__mirrorPhysics={THREE:T,scene:amtScene,rig:amtScene.getObjectByName('Reflected potato rig')};\n"+needle);
   const capture='    amtPotatoMirror.render(renderer,amtCamera,mirrorCamera=>{';assert(code.includes(capture));
   code=code.replace(capture,capture+"\n      if(window.__hideMirrorProxy)__mirrorPhysics.rig.visible=false;");
   await route.fulfill({contentType:'text/javascript',body:code});
  });
  await page.goto(`${origin}/?geheim=buergeramt`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active&&window.__mirrorPhysics,null,{timeout:120000});
  await page.evaluate(()=>{
   const level=BuergeramtLevel;level.replay({cinematics:false,voiceOn:()=>false,onClose:()=>{}});level.update=()=>{};
   window.__mirrorPhysicsView=level.view;Object.defineProperty(level,'view',{configurable:true,get:()=>({...__mirrorPhysicsView})});
   const p=__mirrorPhysics;p.originals=[];p.idMaterial=new p.THREE.MeshBasicMaterial({color:0x00ff00,toneMapped:false,fog:false,depthTest:true,depthWrite:true});
   p.rig.traverse(mesh=>{if(mesh.isMesh)p.originals.push([mesh,mesh.material])});
  });
  async function capture(label,identify,hide=false){
   const before=await page.evaluate(({identify,hide})=>{__hideMirrorProxy=hide;const p=__mirrorPhysics;p.originals.forEach(([mesh,material])=>mesh.material=identify?p.idMaterial:material);return Germany3D.amtPotatoMirror.reflection.frames},{identify,hide});
   await page.waitForFunction(frame=>{Germany3D.sync();return Germany3D.amtPotatoMirror.reflection.frames>frame},before,{timeout:20000});
   const file=resolve(out,label+'.png');await page.locator('#world3d').screenshot({path:file});return file;
  }
  const cases=[];
  const partialOffset=Math.atan(Math.tan(69*Math.PI/360)*viewport.width/viewport.height)+.2;
  // In landscape the tall reception cabinet covers the centered distant image.
  // Move the positive sightline left; retain the blocked position as a negative.
  for(const [pose,x,z,offset,expected,pitch=0,faceCenter=true] of [['near',-5.65,3,0,true],['far',name==='landscape'?-6.1:-5.65,-9,0,true],...(name==='landscape'?[['far-occluded',-5.65,-9,0,false]]:[]),['outside-right',0,0,0,false],['outside-left',-7.2,0,0,false],['edge-left',-6.8,3,0,true,0,false],['edge-right',-4.45,3,0,true,0,false],['edge-center-look',-6.8,3,0,name!=='portrait'],['partial-look',-5.65,3,partialOffset,false],['upper-glass',-5.65,3,0,false,.72]]){
   await page.evaluate(({x,z,offset,pitch,faceCenter})=>{const m=BuergeramtStory.potatoMirror;__mirrorPhysicsView={...__mirrorPhysicsView,x,z,yaw:(faceCenter?Math.atan2(m.x-x,z-m.z):Math.PI)-offset,pitch};__hideMirrorProxy=false;Germany3D.sync()},{x,z,offset,pitch,faceCenter});
   const native=await capture(`${name}-${pose}`,false),off=await capture(`${name}-${pose}-reference`,true,true),on=await capture(`${name}-${pose}-id`,true);
   const pixels=countMask(on,off),state=await page.evaluate(()=>({mirror:Germany3D.amtPotatoMirror,position:__mirrorPhysics.rig.position.toArray()}));
   cases.push({pose,expected,pixels,state,native});
   if(!process.env.MIRROR_PHYSICS_EXPECT_BUG){assert.deepEqual(state.position,[x,0,z],pose+' proxy shifted');assert.equal(pixels>0,expected,`${name}/${pose}: self image pixels=${pixels}`)}
  }
  await page.evaluate(()=>{__mirrorPhysicsView={...__mirrorPhysicsView,x:-5.65,z:3,yaw:Math.PI,pitch:0};const p=__mirrorPhysics;p.blocker=new p.THREE.Mesh(new p.THREE.BoxGeometry(1.2,1.2,.2),new p.THREE.MeshBasicMaterial({color:0x222222}));p.blocker.position.set(-5.65,.6,3.6);p.scene.add(p.blocker);});
  const off=await capture(`${name}-blocker-reference`,true,true),on=await capture(`${name}-blocker-id`,true),blocked=countMask(on,off);
  await capture(`${name}-blocker`,false);const clear=cases.find(c=>c.pose==='near').pixels;
  if(!process.env.MIRROR_PHYSICS_EXPECT_BUG)assert(blocked<clear*.75,`${name}: room depth failed to occlude the reflected lower body (${blocked}/${clear})`);
  await page.evaluate(()=>{const p=__mirrorPhysics;p.blocker.removeFromParent();p.blocker.geometry.dispose();p.blocker.material.dispose();});
  await page.setViewportSize({width:viewport.height,height:viewport.width});const resize=await capture(`${name}-resized`,false);
  await page.evaluate(()=>{__hideMirrorProxy=false;document.getElementById('amt-leave').click();Germany3D.sync();__mirrorPhysics.idMaterial.dispose()});assert.equal(await page.evaluate(()=>Germany3D.amtPotatoMirror.visible),false);
  assert.deepEqual(errors,[]);if(name==='missing-skin')assert(blockedSkin>0,'real skin failure requested');
  report.cases.push({name,cases,blocked,clear,blockedSkin,resize,errors});await context.close();console.log(JSON.stringify({name,cases:cases.map(c=>({pose:c.pose,pixels:c.pixels})),blocked,clear,passed:!process.env.MIRROR_PHYSICS_EXPECT_BUG}));
 }
 if(process.env.MIRROR_PHYSICS_EXPECT_BUG)assert(report.cases.some(p=>p.cases.some(c=>!c.expected&&c.pixels>0)),'baseline must reproduce impossible self visibility');
 const context=await browser.newContext();await context.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};speechSynthesis.speak=()=>{}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${origin}/3d.html`);await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:120000});assert.deepEqual(errors,[]);await context.close();
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close()}
