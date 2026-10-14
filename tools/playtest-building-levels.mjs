// Silent browser checks. Placement/signaling shortcuts are reported separately.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.LEVEL_OUTPUT||'output/level-transitions/browser');mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={complete:false,browser:browser.version(),limits:['Silent media-state checks, no perceptual listening','Android emulation, no physical-device evidence','City placement and welcome dismissal are fixtures; approach and E/touch controls use production handlers','Bürgeramt forced-outro renderer is staged; phone/dismissal causality is exercised by the Node production-controller tests'],cases:[]};
let lastPage=null;
try{
 for(const name of (process.env.LEVEL_CASE?[process.env.LEVEL_CASE]:['desktop','android','reduced'])){
  const mobile=name==='android',reduced=name==='reduced',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
  context.setDefaultTimeout(90000);
  await context.route('**/level-transition-effects.js?*',async route=>{
   const code=readFileSync(resolve(root,'level-transition-effects.js'),'utf8');
   const instrumented=code.replace('  const drawing=renderer.getDrawingBufferSize','  if(globalThis.__failLevelCapture)throw Error("injected level capture failure");\n  const drawing=renderer.getDrawingBufferSize');
   await route.fulfill({status:200,contentType:'text/javascript',body:instrumented});
  });
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;window.__levelMedia=[];HTMLMediaElement.prototype.play=function(...args){this.muted=true;if(this.src.includes('/jobcenter/')&&!__levelMedia.includes(this))__levelMedia.push(this);return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[],warnings=[],captures=[];
  lastPage=page;
  page.on('pageerror',error=>{errors.push(error.message);console.log('PAGE ERROR '+error.message)});
  page.on('console',message=>{if(['error','warning'].includes(message.type())){warnings.push(message.text());if(/shader|WebGL|Building transition|renderer unavailable/i.test(message.text()))console.log(message.text())}});
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&window.Germany3DBridge?.startupAssetsReady&&!document.body.classList.contains('preloading')&&!document.getElementById('start').disabled);
  await page.keyboard.press('KeyS');await page.waitForFunction(()=>document.getElementById('intro').classList.contains('hidden'));
  await page.evaluate(()=>{for(let i=0;i<12;i++)document.getElementById('dialogue-next').click();
   window.__transitionFrames=[];window.__transitionHold=null;window.__transitionHeld=false;
   const sync=Germany3D.sync;Germany3D.sync=function(){if(__transitionHeld)return;const start=performance.now();sync();const s=Germany3D.levelTransition;
    if(s.active){__transitionFrames.push({id:s.id,kind:s.kind,stage:s.stage,progress:s.stageProgress,cost:performance.now()-start,vortex:s.vortex});
     const hold=__transitionHold;if(hold&&s.stage===hold.stage&&s.stageProgress>=hold.at){__transitionHeld=true;__transitionHold=null;}}
   };
  });
  console.log(name+' ready');
  async function arm(stage,at){await page.evaluate(hold=>{__transitionHeld=false;__transitionHold=hold},{stage,at})}
  async function shot(label,stage,at){
   if(stage){await arm(stage,at);await page.waitForFunction(()=>__transitionHeld)}
   const path=resolve(out,name+'-'+label+'.png');await page.screenshot({path});const state=await page.evaluate(()=>Germany3D.levelTransition);captures.push({label,path,state});
   await page.evaluate(()=>{__transitionHeld=false;__transitionHold=null});return state;
  }
  async function enter(id,offset=124,approach=70){
   console.log(name+' enter '+id);
   const clear=await page.evaluate(({id,offset})=>{const b=Germany3DBridge.buildings.find(b=>b.id===id);Object.assign(Germany3DBridge.player,{x:b.doorX,y:b.doorY+offset,vx:0,vy:0});Germany3DBridge.clearInput();const p=Germany3DBridge.player;return !Germany3DBridge.buildings.some(other=>p.x>other.x-p.r&&p.x<other.x+other.w+p.r&&p.y>other.y-p.r&&p.y<other.y+other.h+p.r)},{id,offset});
   assert.equal(clear,true,'fixture must start outside every building body: '+id);
   await page.waitForFunction(id=>{const b=Germany3DBridge.buildings.find(b=>b.id===id),v=Germany3D.levelDoors.find(d=>d.id===id);return v&&Math.abs(Germany3DBridge.player.x-b.doorX)<1},id);
   await page.keyboard.down('ArrowUp');await page.waitForFunction(({id,approach})=>Germany3DBridge.player.y< Germany3DBridge.buildings.find(b=>b.id===id).doorY+approach,{id,approach});await page.keyboard.up('ArrowUp');
   await page.keyboard.press('KeyE');
  }
  async function touchExitDoor(){
   for(const delta of [-240,-240,-240,-(Math.PI/.004-720)]){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y:400,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:310+delta,y:400,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }
   const target=await page.evaluate(async()=>{
    await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
    const T=await import('./assets/vendor/three/0.186.0/build/three.module.min.js'),v=Germany3D.jobcenter,camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.03,100000);
    camera.position.set(0,1.65,0);camera.rotation.set(v.pitch,v.yaw,0,'YXZ');camera.updateMatrixWorld(true);
    const point=new T.Vector3(...v.door.position).project(camera);return{x:(point.x+1)*innerWidth/2,y:(1-point.y)*innerHeight/2};
   });
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...target,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await enter('jobcenter');
  if(!reduced){await shot('entry-door','door',.4);await shot('entry-world','collapse',.45);await shot('entry-building','collapse',.83)}
  await page.waitForFunction(()=>!Germany3D.levelTransition.active&&Germany3D.jobcenter.active);
  await shot('jobcenter');
  if(reduced){
   const started=Date.now();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>Germany3D.levelTransition.active||Germany3D.jobcenter.active),false);assert.ok(Date.now()-started<1500);
  }else{
   await page.keyboard.down('KeyW');await page.waitForFunction(()=>Germany3D.jobcenter.phase==='speaking');await page.keyboard.up('KeyW');
   await page.keyboard.down('KeyA');await page.waitForFunction(()=>Germany3D.jobcenter.x<-.65);await page.keyboard.up('KeyA');
   if(!mobile){await page.mouse.move(800,350);await page.mouse.move(880,400,{steps:5})}
   else{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:400,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:340,y:430,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
   const view=await page.evaluate(()=>Germany3D.jobcenter);assert.ok(view.x<-.65);
   if(process.env.LEVEL_FAST)await page.evaluate(()=>{const audio=__levelMedia.at(-1);audio.currentTime=Math.max(0,audio.duration-.6)});
   const pull=await shot('eject-pull','pull',.35);assert.equal(pull.id,'jobcenter');assert.ok(Math.abs(pull.sourceCamera.position[0])<.001,'camera-relative Jobcenter view is the source');
   if(mobile){
    await page.evaluate(()=>{__transitionHeld=true});await page.setViewportSize({width:844,height:390});
    await arm('pull',.5);await page.waitForFunction(()=>__transitionHeld);
    const landscape=await shot('eject-landscape');assert.equal(landscape.cameraAspect,844/390);
    await page.evaluate(()=>{__transitionHeld=true});await page.setViewportSize({width:390,height:844});
    await arm('pull',.65);await page.waitForFunction(()=>__transitionHeld);
    const portrait=await shot('eject-portrait');assert.equal(portrait.cameraAspect,390/844);
   }
   await shot('eject-fire','pull',.82);await shot('rebuild-building','rebuild',.15);await shot('rebuild-world','rebuild',.6);
   await page.waitForFunction(()=>!Germany3D.levelTransition.active&&!Germany3D.jobcenter.active);await shot('ejected');
   assert.ok(await page.evaluate(()=>__levelMedia.every(media=>media.paused&&!media.getAttribute('src'))));
  }
  // Re-entry follows the real E handler; ordinary leaving must not create an outro.
  const warmMemory=[];
  for(let i=0;i<2;i++){
   await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active&&!Germany3D.levelTransition.active);
   if(mobile&&!i)await touchExitDoor();else await page.keyboard.press(i?'Escape':'KeyE');
   assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active||Germany3D.levelTransition.active),false);
   warmMemory.push(await page.evaluate(()=>Germany3D.inspectAssets().memory));
  }
  assert.ok(warmMemory[1].geometries<=warmMemory[0].geometries&&warmMemory[1].textures<=warmMemory[0].textures,'warmed visits must release transition/room resources');
  await enter('finanzamt');await page.waitForFunction(()=>Germany3D.indoorLevel==='finanzamt'&&!Germany3D.levelTransition.active);await page.locator('#dialogue').waitFor({state:'visible'});await shot('ordinary-office');
  assert.equal(await page.locator('#dialogue').isVisible(),true);await page.keyboard.press('KeyE');await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>!Germany3D.indoorLevel);assert.equal(await page.evaluate(()=>Germany3D.levelTransition.active),false);
  await page.waitForFunction(()=>Germany3D.officeAssetsReady);
  await enter('buergeramt',80,50);await page.waitForFunction(()=>BuergeramtLevel.active&&!Germany3D.levelTransition.active);
  await page.keyboard.press('KeyE');assert.equal(await page.evaluate(()=>BuergeramtLevel.active||Germany3D.levelTransition.active),false);
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>BuergeramtLevel.active&&!Germany3D.levelTransition.active);
  await page.keyboard.down('KeyA');await page.waitForFunction(()=>BuergeramtLevel.view.x<-.5);await page.keyboard.up('KeyA');
  const amtBefore=await page.evaluate(()=>BuergeramtLevel.view);
  await page.evaluate(()=>Germany3D.leaveBuilding('buergeramt',{mode:'eject',fire:true,onReturn:()=>document.getElementById('amt-leave').click()}));
  if(!reduced){const pull=await shot('amt-pull','pull',.3);assert.ok(Math.abs(pull.sourceCamera.position[0]-amtBefore.x)<.05);await shot('amt-fire','pull',.85);await shot('amt-rebuild','rebuild',.4)}
  await page.waitForFunction(()=>!Germany3D.levelTransition.active&&!BuergeramtLevel.active);
  if(name==='desktop'){
   await enter('hausverwaltung',28,20);await page.waitForFunction(()=>Germany3D.levelTransition.active&&Germany3D.levelTransition.elapsed>.12);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   const stopped=await page.evaluate(()=>Germany3D.levelTransition.elapsed);await page.waitForTimeout(200);
   assert.equal(await page.evaluate(()=>Germany3D.levelTransition.elapsed),stopped,'hidden time must not advance the arc');
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
   await page.setViewportSize({width:1024,height:720});await page.waitForFunction(()=>Germany3D.levelTransition.stage==='collapse');
   await page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
   await page.waitForFunction(()=>Germany3D.indoorLevel==='hausverwaltung'&&!Germany3D.levelTransition.active);await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>!!Germany3D.indoorLevel||Germany3D.levelTransition.active),false);await page.setViewportSize({width:1280,height:800});
   await page.evaluate(()=>{window.__failLevelCapture=true});await enter('finanzamt');await page.waitForFunction(()=>Germany3D.indoorLevel==='finanzamt'&&!Germany3D.levelTransition.active);
   assert.match(await page.evaluate(()=>Germany3D.levelTransition.failure),/injected level capture failure/);
   await page.evaluate(()=>{window.__failLevelCapture=false});await page.keyboard.press('Escape');
  }
  // JWD remains outdoors: its house door is geometry, not an artificial episode.
  await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='jwd-home');Object.assign(Germany3DBridge.player,{x:b.doorX,y:b.doorY+35});});await page.keyboard.press('KeyE');
  assert.equal(await page.evaluate(()=>Germany3D.levelTransition.active||!!Germany3D.indoorLevel),false);
  const doors=await page.evaluate(()=>Germany3D.levelDoors);assert.equal(doors.length,await page.evaluate(()=>Germany3DBridge.buildings.length));assert.ok(doors.every(door=>door.height>=1.97&&door.leafAngles.length===2));
  if(mobile){await page.setViewportSize({width:844,height:390});await shot('landscape');}
  const frames=await page.evaluate(()=>__transitionFrames),costs=frames.map(frame=>frame.cost).sort((a,b)=>a-b);
  assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(warning=>/shader error|VALIDATE_STATUS|GL_INVALID|3D renderer unavailable|Building transition keeps direct travel/i.test(warning)&&!warning.includes('injected level capture failure')),[]);
  report.cases.push({name,verdict:'PASS',captures,doors,warmMemory,frames:frames.length,renderCostP95:costs[Math.floor(costs.length*.95)],errors,warnings});console.log(name+' PASS');await context.close();
 }
 report.complete=true;
}catch(error){
 report.error=error.message;
 if(lastPage&&!lastPage.isClosed()){
  report.failureState=await lastPage.evaluate(()=>({player:{...Germany3DBridge.player},input:Germany3DBridge.getInput(),hud:Germany3DBridge.getHUDState(),paused:GermanyHUD?.paused,transition:Germany3D.levelTransition,office:Germany3D.indoorLevel,amt:{active:BuergeramtLevel.active,leaving:BuergeramtLevel.leaving},body:document.body.className,dialogue:document.getElementById('dialogue').hidden})).catch(()=>null);
  await lastPage.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});
 }
 throw error;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done));}
