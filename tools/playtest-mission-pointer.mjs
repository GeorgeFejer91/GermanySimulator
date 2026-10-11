// Silent real-browser checks. Mission selection is forced; this is not a full mission-chain playthrough.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PLAYTEST_OUTPUT||'output/wegweiser/browser');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);if(file===resolve(root,'game.js')){data=data.toString().replace('window.Germany3DBridge={','window.__pointerTest={state,missions,normObjects};window.Germany3DBridge={')}if(file===resolve(root,'world3d.js')){data=data.toString().replace('const missionPointer=new T.Group();','const missionPointer=new T.Group();window.__pointerMesh=missionPointer;')}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=default']});
const report={cases:[],limits:['Forced mission selection and diagnostic placement; no full natural mission chain','Android emulation only; physical Android not available','Audio muted at all outputs; no listening review','Modal/resize checks assert convergence within three browser frames, record wall time and use a 30 s stall watchdog; they do not establish a wall-clock responsiveness bound']};
// Enforce state deadlines on the browser clock. A delayed driver receipt is
// distinct from a late game/layout update on a busy Windows test host.
async function waitState(page,predicate,arg,options={}){
 const result=await page.evaluate(({source,arg,timeout})=>new Promise(resolve=>{
  const condition=Function('return ('+source+')')(),began=performance.now();
  const poll=()=>{try{const fit=!!condition(arg),elapsed=performance.now()-began;if(elapsed>timeout||fit){resolve({fit:fit&&elapsed<=timeout,satisfied:fit,elapsed,timeout});return}setTimeout(poll,50)}catch(error){resolve({fit:false,satisfied:false,error:String(error),elapsed:performance.now()-began,timeout})}};poll();
 }),{source:predicate.toString(),arg,timeout:options.timeout??30000});
 if(!result.fit){result.state=await page.evaluate(()=>({ready:window.Germany3D?.ready,startupReady:window.Germany3D?.startupReady,startupStatus:window.Germany3D?.startupStatus,startupAssetsReady:window.Germany3DBridge?.startupAssetsReady,assetLoadStatus:window.Germany3DBridge?.assetLoadStatus,started:window.__pointerTest?.state.started,rootFont:getComputedStyle(document.documentElement).fontSize,paused:window.GermanyHUD?.paused,visible:window.__pointerMesh?.visible,screen:window.__pointerMesh?.userData.screen,guideFit:document.getElementById('mission-guide')?.dataset.pointerFit,guideClass:document.getElementById('mission-guide')?.className,fileOpen:document.getElementById('case-file')?.open,modal:window.__pointerTest?.state.modal,viewport:[innerWidth,innerHeight]}));writeFileSync(resolve(out,'state-deadline-failure.json'),JSON.stringify(result,null,2));}
 assert.ok(result.fit,`State deadline failed: ${JSON.stringify(result)}`);return result;
}
// Layout correctness is a render/observer phase contract. Record wall time;
// the separate benchmark owns responsiveness rather than this frame assertion.
async function armFrameState(page,predicate,event,arg){
 await page.evaluate(({source,arg,event})=>{
  const condition=Function('return ('+source+')')();let began=null,frames=0,finished=false,resolve;
  const probe={promise:new Promise(done=>resolve=done),dispatch(type,code){if(began!==null||type!==event.type||event.code&&code!==event.code)return;began=performance.now();requestAnimationFrame(poll)}};
  const finish=fit=>{if(finished)return;finished=true;clearTimeout(watchdog);resolve({fit,frames,elapsed:began===null?null:performance.now()-began,event})};
  const watchdog=setTimeout(()=>finish(false),30000);
  const poll=()=>{if(finished)return;frames++;const fit=!!condition(arg);if(fit||frames===3)finish(fit);else requestAnimationFrame(poll)};
  window.__pointerFrameEvent=probe;
 },{source:predicate.toString(),arg,event});
}
async function readFrameState(page){
 const result=await page.evaluate(()=>__pointerFrameEvent.promise);
 assert.ok(result.fit,`Frame state failed: ${JSON.stringify(result)}`);return result;
}
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
 if(result.overlaps.length){console.log(JSON.stringify({viewport,...result}));await page.screenshot({timeout:120000,path:resolve(out,'clearance-failure.png')});}
 assert.deepEqual(result.overlaps,[],'Wurst is clear of visible HUD cards and controls');
 if(result.label){const l=result.label.bounds;assert.ok(l.left>=0&&l.right<=viewport.width&&l.top>=0&&l.bottom<=viewport.height,'complete label fits the screen');assert.deepEqual(result.obstacles.filter(r=>l.left<r.right&&l.right>r.left&&l.top<r.bottom&&l.bottom>r.top),[],'Wegweiser label is clear of cards and controls');}
 return result;
}
try{
 for(const [name,viewport,failure,diagnostic,largeText] of [['desktop',{width:1280,height:800},false,false],['android-portrait',{width:390,height:844},false,false],['android-landscape',{width:844,height:390},false,false],['narrow-desktop',{width:800,height:1280},false,false],['breakpoint-wide',{width:1001,height:800},false,false],['breakpoint-compact',{width:1000,height:800},false,false],['small-text',{width:320,height:568},false,false,true],['android-fallback',{width:390,height:844},true,false],['reduced-motion',{width:1280,height:800},false,false],['zoom',{width:1280,height:800},false,false],['fallback',{width:1280,height:800},true,false],['diagnostic',{width:1280,height:800},false,true]]){
  if(process.env.PLAYTEST_CASES&&!process.env.PLAYTEST_CASES.split(',').includes(name))continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference'});
  await context.addInitScript(()=>{
   // Register before the HUD's capture listener, which stops M propagation.
   addEventListener('keydown',event=>window.__pointerFrameEvent?.dispatch('keydown',event.code),true);
   addEventListener('resize',()=>window.__pointerFrameEvent?.dispatch('resize'),true);
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(failure)await page.route('**/mission-sausage/sausage.glb*',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${diagnostic?'3d.html':'index.html'}`,{waitUntil:'domcontentloaded',timeout:120000});
  if(name==='zoom')await page.addStyleTag({content:'html{zoom:2}'});
  if(largeText)await page.addStyleTag({content:'html{font-size:200% !important}'});
  await waitState(page,()=>window.Germany3D?.startupReady&&(window.__pointerTest?Germany3DBridge.startupAssetsReady:true),null,{timeout:120000});
  if(!diagnostic){assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);await page.keyboard.press('s');await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});await waitState(page,allowFile=>{const p=__pointerMesh;return p.visible||allowFile&&p.userData.screen.fit==='file'},largeText||name==='zoom');}
  else await waitState(page,()=>__pointerMesh.visible);
  await page.waitForTimeout(250);
  let pointer=await page.evaluate(()=>Germany3D.inspectAssets().missionPointer);assert.equal(pointer.loaded,!failure);assert.equal(pointer.target,'buergeramt');
  const initialPointer=pointer;let initialNoFit=null;
  if(!pointer.visible){initialNoFit=await checkClearance(page,true);await page.screenshot({timeout:120000,path:resolve(out,name+'-no-fit.png')});await page.locator('#file-toggle').click({position:{x:30,y:20}});await waitState(page,()=>GermanyHUD.paused&&document.getElementById('case-file').open);assert.ok((await page.locator('#mission-title').innerText()).trim());await page.screenshot({timeout:120000,path:resolve(out,name+'-initial-akte.png')});await page.keyboard.press('Escape');await page.setViewportSize({width:viewport.width,height:Math.max(viewport.height,largeText?844:1600)});await waitState(page,()=>__pointerMesh.visible);pointer=await page.evaluate(()=>Germany3D.inspectAssets().missionPointer)}
  const renderedViewport=page.viewportSize(),screenBefore=pointer.screen;await page.screenshot({timeout:120000,path:resolve(out,name+'-initial.png')});assert.ok(pointer.pixelBounds.top>=0&&pointer.pixelBounds.bottom<=renderedViewport.height,`${name}: complete Wurst remains visible beneath the shared header`);assert.ok(pointer.pixelBounds.left>=0&&pointer.pixelBounds.right<=renderedViewport.width);
  if(!diagnostic){await waitState(page,()=>__pointerMesh.userData.print?.fit==='one-line');assert.equal((await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.print)).text,'Wegweiser');assert.deepEqual(pointer.shape,[1.6,1.6,.84]);assert.equal(pointer.tip.depthWrite,false);}
  const clearance=await checkClearance(page),bearings=[];
  await page.screenshot({timeout:120000,path:resolve(out,name+'.png')});
  if(['desktop','android-portrait','fallback'].includes(name)){
   for(const [direction,dx,dz] of [['north',0,-500],['northeast',350,-350],['east',500,0],['southeast',350,350],['south',0,500],['southwest',-350,350],['west',-500,0],['northwest',-350,-350]]){
    await page.evaluate(([dx,dz])=>{window.__originalWaypoint??=Germany3DBridge.getMissionWaypoint;Germany3DBridge.getMissionWaypoint=()=>({id:'visual-bearing',x:Germany3DBridge.player.x+dx,y:Germany3DBridge.player.y+dz});Germany3D.sync()},[dx,dz]);
    const state=(await checkClearance(page)).pointer;assert.equal(state.pivot.sourceZ,-.42);for(let k=0;k<3;k++)assert.ok(Math.abs(state.pivot.position[k]-state.position[k])<1e-6,'the non-pointer pivot stays at the fixed HUD anchor');assert.ok(Math.hypot(state.pivot.centre[0]-state.position[0],state.pivot.centre[1]-state.position[1])>state.screen.size*.13,'body centre orbits the pivot');bearings.push({direction,pointer:state});await page.screenshot({timeout:120000,path:resolve(out,name+'-'+direction+'.png')});
   }
   await page.evaluate(()=>{Germany3DBridge.getMissionWaypoint=__originalWaypoint;Germany3D.sync()});
  }
  const transitions={},before=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));await page.keyboard.down('ArrowUp');try{await waitState(page,before=>Math.hypot(Germany3DBridge.player.x-before.x,Germany3DBridge.player.y-before.y)>0,before,{timeout:3000})}finally{await page.keyboard.up('ArrowUp')};
  const after=await page.evaluate(()=>({x:Germany3DBridge.player.x,y:Germany3DBridge.player.y}));assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>0);assert.deepEqual(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.screen),screenBefore);
  const missions=[];
  if(!diagnostic){
   for(let mission=0;mission<8;mission++){const result=await page.evaluate(mission=>{__pointerTest.state.mission=mission;Germany3D.sync();return{target:Germany3DBridge.getMissionWaypoint(),pointer:Germany3D.inspectAssets().missionPointer}},mission);assert.equal(result.pointer.target,result.target.id);const dx=result.target.x-after.x,dz=result.target.y-after.y;assert.ok(Math.abs(Math.sin(result.pointer.heading)-dx/Math.hypot(dx,dz))<1e-8);await checkClearance(page);missions.push(result.target.id)}
   await page.evaluate(()=>{__pointerTest.state.mission=0;__pointerTest.state.modal=true;Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),false);
   await page.evaluate(()=>{__pointerTest.state.modal=false;Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().missionPointer.visible),true);
   await armFrameState(page,()=>GermanyHUD.paused&&!__pointerMesh.visible,{type:'keydown',code:'KeyM'});await page.keyboard.press('m');transitions.fileHide=await readFrameState(page);await armFrameState(page,()=>!GermanyHUD.paused&&__pointerMesh.visible,{type:'keydown',code:'Escape'});await page.keyboard.press('Escape');transitions.fileShow=await readFrameState(page);
  }
  // Observer-owned DOM geometry can update independently of animation-frame sampling during orientation changes.
  await armFrameState(page,()=>{const r=document.getElementById('mission-pointer-space')?.getBoundingClientRect(),s=__pointerMesh.userData.screen;return !r?.width||Math.abs(s.x-(r.left+r.right)/2)<1&&Math.abs(s.y-r.top-Math.min(r.width,r.height)/2)<1&&Math.abs(s.size-Math.min(r.width,r.height))<1},{type:'resize'});await page.setViewportSize({width:viewport.height,height:viewport.width});transitions.resize=await readFrameState(page).catch(async error=>{console.log(JSON.stringify(await page.evaluate(()=>({screen:Germany3D.inspectAssets().missionPointer.screen,rect:document.getElementById('mission-pointer-space')?.getBoundingClientRect().toJSON(),fit:document.getElementById('mission-guide')?.dataset.pointerFit,visible:Germany3D.inspectAssets().missionPointer.visible,viewport:[innerWidth,innerHeight]}))));await page.screenshot({timeout:120000,path:resolve(out,'layout-failure.png')});throw error});const resizedClearance=await checkClearance(page,!!largeText||name==='zoom');await page.screenshot({timeout:120000,path:resolve(out,name+'-resize.png')});
  let restoredClearance=null;
  if(largeText){assert.equal(resizedClearance.fallback,'mission in Akte');await page.locator('#file-toggle').click({position:{x:30,y:20}});await waitState(page,()=>GermanyHUD.paused&&document.getElementById('case-file').open);assert.ok((await page.locator('#mission-title').innerText()).trim());await page.screenshot({timeout:120000,path:resolve(out,name+'-akte.png')});await page.keyboard.press('Escape');await page.setViewportSize({width:viewport.width,height:Math.max(viewport.height,844)});await waitState(page,()=>__pointerMesh.visible,null,{timeout:5000});restoredClearance=await checkClearance(page);await page.screenshot({timeout:120000,path:resolve(out,name+'-restored.png')});}
  assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',pointer,initialPointer,initialNoFit,bearings,clearance,resizedClearance,restoredClearance,transitions,largeText:!!largeText,viewport,renderedViewport,missions,movement:Math.hypot(after.x-before.x,after.y-before.y),errors});console.log(name,'PASS');await context.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
