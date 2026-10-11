// Silent real-browser checks. Mission selection is forced; this is not a full mission-chain playthrough.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PLAYTEST_OUTPUT||'output/wegweiser/browser');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);if(file===resolve(root,'game.js')){data=data.toString().replace('window.Germany3DBridge={','window.__pointerTest={state,missions,normObjects};window.Germany3DBridge={')}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=default']});
const report={cases:[],limits:['Forced mission selection and diagnostic placement; no full natural mission chain','Android emulation only; physical Android not available','Audio muted at all outputs; no listening review']};
async function checkClearance(page,allowFileFallback=false){
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 const result=await page.evaluate(()=>{
  const pointer=Germany3D.inspectAssets().missionPointer,b=pointer.pixelBounds;
  const obstacles=[...document.querySelectorAll('#city-status > *, #city-notices > *, #subtitle-toggle, #mission-fax, .control-dock, .hud, .help')].flatMap(el=>{
   const style=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height||style.visibility==='hidden'||Number(style.opacity)===0)return[];
   return[{name:el.id||el.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom}];
  });
  const label=document.getElementById('wegweiser-label'),labelRect=label?.getBoundingClientRect();return{pointer,label:label?{text:label.textContent,fit:label.dataset.pretextFit,font:getComputedStyle(label).fontFamily,bounds:{left:labelRect.left,right:labelRect.right,top:labelRect.top,bottom:labelRect.bottom}}:null,obstacles,overlaps:obstacles.filter(r=>b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top)};
 });
 if(allowFileFallback&&!result.pointer.visible){assert.equal(result.pointer.screen.fit,'file');assert.ok(result.obstacles.some(r=>r.name==='file-toggle'),'mission remains accessible in Akte');return {...result,fallback:'mission in Akte'};}
 assert.equal(result.pointer.visible,true,'active navigation has a visible Wurst');
 const b=result.pointer.pixelBounds,viewport=page.viewportSize();
 assert.ok(b.top>=0&&b.left>=0&&b.right<=viewport.width&&b.bottom<=viewport.height,'complete Wurst fits inside the screen');
 if(result.overlaps.length){console.log(JSON.stringify({viewport,...result}));await page.screenshot({path:resolve(out,'clearance-failure.png')});}
 assert.deepEqual(result.overlaps,[],'Wurst is clear of visible HUD cards and controls');
 if(result.label){const l=result.label.bounds;assert.ok(l.left>=0&&l.right<=viewport.width&&l.top>=0&&l.bottom<=viewport.height,'complete label fits the screen');assert.deepEqual(result.obstacles.filter(r=>l.left<r.right&&l.right>r.left&&l.top<r.bottom&&l.bottom>r.top),[],'Wegweiser label is clear of cards and controls');}
 return result;
}
try{
 for(const [name,viewport,failure,diagnostic,largeText] of [['desktop',{width:1280,height:800},false,false],['android-portrait',{width:390,height:844},false,false],['android-landscape',{width:844,height:390},false,false],['narrow-desktop',{width:800,height:1280},false,false],['breakpoint-wide',{width:1001,height:800},false,false],['breakpoint-compact',{width:1000,height:800},false,false],['small-text',{width:320,height:568},false,false,true],['android-fallback',{width:390,height:844},true,false],['reduced-motion',{width:1280,height:800},false,false],['zoom',{width:1280,height:800},false,false],['fallback',{width:1280,height:800},true,false],['diagnostic',{width:1280,height:800},false,true]]){
  if(process.env.PLAYTEST_CASES&&!process.env.PLAYTEST_CASES.split(',').includes(name))continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference'});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(failure)await page.route('**/mission-sausage/sausage.glb*',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${diagnostic?'3d.html':'index.html'}`,{waitUntil:'domcontentloaded',timeout:120000});
  if(name==='zoom')await page.addStyleTag({content:'html{zoom:2}'});
  if(largeText)await page.addStyleTag({content:'html{font-size:200% !important}'});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&(window.__pointerTest?Germany3DBridge.startupAssetsReady:true),null,{timeout:120000});
  if(!diagnostic){assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);await page.keyboard.press('s');await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});await page.waitForFunction(()=>Germany3D.inspectAssets().missionPointer.visible);}
  else await page.waitForFunction(()=>Germany3D.inspectAssets().missionPointer.visible);
  await page.waitForTimeout(250);
  let pointer=await page.evaluate(()=>Germany3D.inspectAssets().missionPointer);assert.equal(pointer.loaded,!failure);assert.equal(pointer.target,'buergeramt');
  const screenBefore=pointer.screen;await page.screenshot({path:resolve(out,name+'-initial.png')});assert.ok(pointer.pixelBounds.top>=0&&pointer.pixelBounds.bottom<=viewport.height,`${name}: complete Wurst remains visible beneath the shared header`);assert.ok(pointer.pixelBounds.left>=0&&pointer.pixelBounds.right<=viewport.width);
  if(!diagnostic){await page.waitForFunction(()=>Germany3D.inspectAssets().missionPointer.print?.fit==='one-line');assert.equal((await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.print)).text,'Wegweiser');assert.deepEqual(pointer.shape,[1.65,1.65,.7]);assert.equal(pointer.tip.depthWrite,false);}
  const clearance=await checkClearance(page);
  await page.screenshot({path:resolve(out,name+'.png')});
  if(['desktop','android-portrait','fallback'].includes(name)){
   for(const [direction,dx,dz] of [['north',0,-500],['east',500,0],['south',0,500],['west',-500,0]]){
    await page.evaluate(([dx,dz])=>{window.__originalWaypoint??=Germany3DBridge.getMissionWaypoint;Germany3DBridge.getMissionWaypoint=()=>({id:'visual-bearing',x:Germany3DBridge.player.x+dx,y:Germany3DBridge.player.y+dz});Germany3D.sync()},[dx,dz]);
    await checkClearance(page);await page.screenshot({path:resolve(out,name+'-'+direction+'.png')});
   }
   await page.evaluate(()=>{Germany3DBridge.getMissionWaypoint=__originalWaypoint;Germany3D.sync()});
  }
  const before=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));await page.keyboard.down('ArrowUp');try{await page.waitForFunction(before=>Math.hypot(Germany3DBridge.player.x-before.x,Germany3DBridge.player.y-before.y)>0,before,{timeout:3000})}finally{await page.keyboard.up('ArrowUp')};
  const after=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>0);assert.deepEqual(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.screen),screenBefore);
  const missions=[];
  if(!diagnostic){
   for(let mission=0;mission<8;mission++){const result=await page.evaluate(mission=>{__pointerTest.state.mission=mission;Germany3D.sync();return{target:Germany3DBridge.getMissionWaypoint(),pointer:Germany3D.inspectAssets().missionPointer}},mission);assert.equal(result.pointer.target,result.target.id);const dx=result.target.x-after.x,dz=result.target.y-after.y;assert.ok(Math.abs(Math.sin(result.pointer.heading)-dx/Math.hypot(dx,dz))<1e-8);await checkClearance(page);missions.push(result.target.id)}
   await page.evaluate(()=>{__pointerTest.state.mission=0;__pointerTest.state.modal=true;Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);
   await page.evaluate(()=>{__pointerTest.state.modal=false;Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),true);
   await page.keyboard.press('m');await page.waitForFunction(()=>GermanyHUD.paused&&!Germany3D.inspectAssets().missionPointer.visible,null,{timeout:3000});await page.keyboard.press('Escape');await page.waitForFunction(()=>!GermanyHUD.paused&&Germany3D.inspectAssets().missionPointer.visible,null,{timeout:3000});
  }
  await page.setViewportSize({width:viewport.height,height:viewport.width});await page.waitForFunction(()=>{const r=document.getElementById('mission-pointer-space')?.getBoundingClientRect(),s=Germany3D.inspectAssets().missionPointer.screen;return !r?.width||Math.abs(s.x-(r.left+r.right)/2)<1&&Math.abs(s.y-r.top-Math.min(r.width,r.height)/2)<1&&Math.abs(s.size-Math.min(r.width,r.height))<1},null,{timeout:5000}).catch(async error=>{console.log(JSON.stringify(await page.evaluate(()=>({screen:Germany3D.inspectAssets().missionPointer.screen,rect:document.getElementById('mission-pointer-space')?.getBoundingClientRect().toJSON(),fit:document.getElementById('mission-guide')?.dataset.pointerFit,visible:Germany3D.inspectAssets().missionPointer.visible,viewport:[innerWidth,innerHeight]}))));await page.screenshot({path:resolve(out,'layout-failure.png')});throw error});const resizedClearance=await checkClearance(page,!!largeText);await page.screenshot({path:resolve(out,name+'-resize.png')});
  let restoredClearance=null;
  if(largeText){assert.equal(resizedClearance.fallback,'mission in Akte');await page.locator('#file-toggle').click({position:{x:30,y:20}});await page.waitForFunction(()=>GermanyHUD.paused&&document.getElementById('case-file').open);assert.ok((await page.locator('#mission-title').innerText()).trim());await page.screenshot({path:resolve(out,name+'-akte.png')});await page.keyboard.press('Escape');await page.setViewportSize(viewport);await page.waitForFunction(()=>Germany3D.inspectAssets().missionPointer.visible,null,{timeout:5000});restoredClearance=await checkClearance(page);await page.screenshot({path:resolve(out,name+'-restored.png')});}
  assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',pointer,clearance,resizedClearance,restoredClearance,largeText:!!largeText,missions,movement:Math.hypot(after.x-before.x,after.y-before.y),errors});console.log(name,'PASS');await context.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
