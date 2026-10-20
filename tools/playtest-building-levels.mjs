import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {runSuite,isMain,resizeViewport} from './browser-harness.mjs';

export async function verifyDialogueControls(page){
 const geometry=await page.evaluate(()=>{
  const caption=document.getElementById('english-subtitle'),c=caption.getBoundingClientRect(),captionVisible=!caption.hidden&&c.width>0&&c.height>0;
  const controls=[...document.querySelectorAll('#dialogue .dialogue-actions button')].map(button=>{
   const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return {id:button.id,label:button.textContent,top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,
    measurement:button.dataset.measurement,fit:button.dataset.pretextFit,
    onScreen:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
    exposed:!!hit&&button.contains(hit),overlap:captionVisible&&r.right>c.left&&r.left<c.right&&r.bottom>c.top&&r.top<c.bottom};
  });
  return {viewport:[innerWidth,innerHeight],captionVisible,caption:{top:c.top,bottom:c.bottom,height:c.height},controls};
 });
 assert.equal(geometry.captionVisible,true,'office readability check requires a visible spoken caption');
 assert.ok(geometry.controls.length===2&&geometry.controls.every(button=>button.width>0&&button.height>0&&button.onScreen&&button.exposed&&!button.overlap),'office actions must remain exposed above captions: '+JSON.stringify(geometry));
 return geometry;
}

export async function runBuildingTransitions({page,context,baseURL,profile,iterations,artifacts,root}){
  const mobile=!!profile.isMobile,reduced=profile.reducedMotion==='reduce',name=profile.id==='android-portrait'?'android':profile.id;
  context.setDefaultTimeout(90000);
  await context.route('**/jobcenter.js?*',async route=>{
   const code=readFileSync(resolve(root,'jobcenter.js'),'utf8'),anchor='  v.door.dispose();';
   assert.equal(code.split(anchor).length,2,'room disposal instrumentation requires the current production release owner');
   const probe=`  const resources=new Set();
  v.scene.traverse(object=>{if(object.geometry)resources.add(object.geometry);for(const material of [object.material].flat().filter(Boolean)){resources.add(material);for(const value of Object.values(material))if(value?.isTexture)resources.add(value)}});
  const receipt={owned:resources.size,disposed:0};(window.__roomDisposals??=[]).push(receipt);
  for(const resource of resources)resource.addEventListener('dispose',function disposed(){receipt.disposed++;resource.removeEventListener('dispose',disposed)});
`;
   await route.fulfill({status:200,contentType:'text/javascript',body:code.replace(anchor,probe+anchor)});
  });
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
  const errors=[],warnings=[],captures=[];let renderError=false;
  page.on('pageerror',error=>{if(errors.length<128)errors.push(error.message);artifacts.log('check','PAGE ERROR '+error.message)});
  page.on('console',message=>{if(['error','warning'].includes(message.type())){const text=message.text();if(warnings.length<128)warnings.push(text);if(/shader error|VALIDATE_STATUS|GL_INVALID|3D renderer unavailable|Building transition keeps direct travel/i.test(text)&&!text.includes('injected level capture failure'))renderError=true;}});
  await page.goto(new URL('index.html',baseURL+'/').href,{waitUntil:'domcontentloaded'});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&window.Germany3DBridge?.startupAssetsReady&&!document.body.classList.contains('preloading')&&!document.getElementById('start').disabled);
  await page.keyboard.press('KeyS');await page.waitForFunction(()=>document.getElementById('intro').classList.contains('hidden'));
  await page.evaluate(()=>{for(let i=0;i<12;i++)document.getElementById('dialogue-next').click();
   window.__transitionFrames=[];window.__transitionFrameCount=0;window.__transitionHold=null;window.__transitionHeld=false;
   const update=Germany3D.update;Germany3D.update=function(dt){if(!__transitionHeld)update.call(this,dt)};
   const sync=Germany3D.sync;Germany3D.sync=function(){if(__transitionHeld)return;const start=performance.now();sync();const s=Germany3D.levelTransition;
    if(s.active){__transitionFrameCount++;if(__transitionFrames.length<4096)__transitionFrames.push({id:s.id,kind:s.kind,stage:s.stage,progress:s.stageProgress,cost:performance.now()-start,vortex:s.vortex});
     const hold=__transitionHold;if(hold&&s.stage===hold.stage&&s.stageProgress>=hold.at){__transitionHeld=true;__transitionHold=null;}}
   };
  });
  artifacts.log('check',name+' ready');
  async function arm(stage,at){await page.evaluate(hold=>{__transitionHeld=false;__transitionHold=hold},{stage,at})}
  async function shot(label,stage,at){
   if(stage){await arm(stage,at);await page.waitForFunction(()=>__transitionHeld)}
   const path=artifacts.path(name+'-'+label+'.png');await page.screenshot({path});const state=await page.evaluate(()=>Germany3D.levelTransition);captures.push({label,path,state});
   await page.evaluate(()=>{__transitionHeld=false;__transitionHold=null});return state;
  }
  async function enter(id,offset=124,approach=70){
   artifacts.log('check',name+' enter '+id);
   const clear=await page.evaluate(({id,offset})=>{const b=Germany3DBridge.buildings.find(b=>b.id===id);Object.assign(Germany3DBridge.player,{x:b.doorX,y:b.doorY+offset,vx:0,vy:0});Germany3DBridge.clearInput();const p=Germany3DBridge.player;return !Germany3DBridge.buildings.some(other=>p.x>other.x-p.r&&p.x<other.x+other.w+p.r&&p.y>other.y-p.r&&p.y<other.y+other.h+p.r)},{id,offset});
   assert.equal(clear,true,'fixture must start outside every building body: '+id);
   await page.waitForFunction(id=>{const b=Germany3DBridge.buildings.find(b=>b.id===id),v=Germany3D.levelDoors.find(d=>d.id===id);return v&&Math.abs(Germany3DBridge.player.x-b.doorX)<1},id);
   await page.keyboard.down('ArrowUp');await page.waitForFunction(({id,approach})=>Germany3DBridge.player.y< Germany3DBridge.buildings.find(b=>b.id===id).doorY+approach,{id,approach});await page.keyboard.up('ArrowUp');
   await page.keyboard.press('KeyE');
  }
  async function touchExitDoor(){
   const {height}=page.viewportSize(),touchY=Math.min(400,height-40);
   for(const delta of [-240,-240,-240,-(Math.PI/.004-720)]){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y:touchY,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:310+delta,y:touchY,id:1}]});
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
   else{const viewport=page.viewportSize(),x=Math.round(viewport.width*.7),y=Math.min(400,viewport.height-40);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+40,y:y+30,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
   const view=await page.evaluate(()=>Germany3D.jobcenter);assert.ok(view.x<-.65);
   if(process.env.LEVEL_FAST)await page.evaluate(()=>{const audio=__levelMedia.at(-1);audio.currentTime=Math.max(0,audio.duration-.6)});
   const pull=await shot('eject-pull','pull',.35);assert.equal(pull.id,'jobcenter');assert.ok(Math.abs(pull.sourceCamera.position[0])<.001,'camera-relative Jobcenter view is the source');
   if(mobile){
    await page.evaluate(()=>{__transitionHeld=true});await resizeViewport(page,{width:844,height:390});
    await arm('pull',.5);await page.waitForFunction(()=>__transitionHeld);
    const landscape=await shot('eject-landscape');assert.equal(landscape.cameraAspect,844/390);
    await page.evaluate(()=>{__transitionHeld=true});await resizeViewport(page,{width:390,height:844});
    await arm('pull',.65);await page.waitForFunction(()=>__transitionHeld);
    const portrait=await shot('eject-portrait');assert.equal(portrait.cameraAspect,390/844);
   }
   await shot('eject-fire','pull',.82);await shot('rebuild-building','rebuild',.15);await shot('rebuild-world','rebuild',.6);
   await page.waitForFunction(()=>!Germany3D.levelTransition.active&&!Germany3D.jobcenter.active);await shot('ejected');
   assert.ok(await page.evaluate(()=>__levelMedia.every(media=>media.paused&&!media.getAttribute('src'))));
  }
  // Re-entry follows the real E handler; ordinary leaving must not create an outro.
  // Global renderer counts include independently streaming city models/actors.
  // Observe actual dispose events for the room's unique owned resources instead.
  const warmMemory=[],roomDisposals=[];
  for(let i=0;i<Math.max(2,iterations);i++){
   const releasedBefore=await page.evaluate(()=>window.__roomDisposals?.length||0);
   await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active&&!Germany3D.levelTransition.active);
   if(mobile&&!i)await touchExitDoor();else await page.keyboard.press(i?'Escape':'KeyE');
   assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active||Germany3D.levelTransition.active),false);
   const released=await page.evaluate(()=>window.__roomDisposals||[]);
   assert.equal(released.length,releasedBefore+1,'each warm exit must release one actual room');
   const disposal=released.at(-1);roomDisposals.push(disposal);
   assert.ok(disposal.owned>0&&disposal.disposed===disposal.owned,'every owned room resource must emit disposal: '+JSON.stringify(disposal));
   warmMemory.push(await page.evaluate(()=>Germany3D.inspectAssets().memory));
   artifacts.log('check','warmed visit '+JSON.stringify({iteration:i,memory:warmMemory.at(-1),city:await page.evaluate(()=>Germany3D.startupStatus)}));
  }
  await enter('finanzamt');await page.waitForFunction(()=>Germany3D.indoorLevel==='finanzamt'&&!Germany3D.levelTransition.active);await page.locator('#dialogue').waitFor({state:'visible'});await resizeViewport(page,profile.viewport);await shot('ordinary-office');const officeControls=await verifyDialogueControls(page);artifacts.log('check','ordinary office controls exposed '+JSON.stringify(officeControls));
  assert.equal(await page.locator('#dialogue').isVisible(),true);await page.keyboard.press('KeyE');await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>!Germany3D.indoorLevel);assert.equal(await page.evaluate(()=>Germany3D.levelTransition.active),false);
  await enter('buergeramt',80,50);await page.waitForFunction(()=>Germany3D.officeAssetsReady);
  await page.waitForFunction(()=>BuergeramtLevel.active&&!Germany3D.levelTransition.active);
  await page.waitForFunction(()=>typeof window.VDONinjaSDK==='function');
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
   await resizeViewport(page,{width:1024,height:720});await page.waitForFunction(()=>Germany3D.levelTransition.stage==='collapse');
   await page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
   await page.waitForFunction(()=>Germany3D.indoorLevel==='hausverwaltung'&&!Germany3D.levelTransition.active);await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>!!Germany3D.indoorLevel||Germany3D.levelTransition.active),false);await resizeViewport(page,{width:1280,height:800});
   await page.evaluate(()=>{window.__failLevelCapture=true});await enter('finanzamt');await page.waitForFunction(()=>Germany3D.indoorLevel==='finanzamt'&&!Germany3D.levelTransition.active);
   assert.match(await page.evaluate(()=>Germany3D.levelTransition.failure),/injected level capture failure/);
   await page.evaluate(()=>{window.__failLevelCapture=false});await page.keyboard.press('Escape');
  }
  // JWD remains outdoors: its house door is geometry, not an artificial episode.
  await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='jwd-home');Object.assign(Germany3DBridge.player,{x:b.doorX,y:b.doorY+35});});await page.keyboard.press('KeyE');
  assert.equal(await page.evaluate(()=>Germany3D.levelTransition.active||!!Germany3D.indoorLevel),false);
  const doors=await page.evaluate(()=>Germany3D.levelDoors);assert.equal(doors.length,await page.evaluate(()=>Germany3DBridge.buildings.length));assert.ok(doors.every(door=>door.height>=1.97&&door.leafAngles.length===2));
  if(mobile){await resizeViewport(page,{width:844,height:390});await shot('landscape');}
  const frames=await page.evaluate(()=>__transitionFrames),costs=frames.map(frame=>frame.cost).sort((a,b)=>a-b);
  assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(warning=>/shader error|VALIDATE_STATUS|GL_INVALID|3D renderer unavailable|Building transition keeps direct travel/i.test(warning)&&!warning.includes('injected level capture failure')),[]);
  assert.equal(renderError,false,'render errors must fail even after the warning buffer fills');
  return {name,captures,doors,warmMemory,roomDisposals,officeControls,frames:await page.evaluate(()=>__transitionFrameCount),sampledFrames:frames.length,renderCostP95:costs[Math.floor(costs.length*.95)],errors,warnings,limits:['Seeded city placement and welcome dismissal; staged forced exit; synthetic visibility and BFCache events; room disposal events observed through instrumentation; global renderer counts include city streaming']};
}

export const buildingScenario={id:'lifecycle',modes:['stress'],timeoutMs:300000,actionTimeoutMs:90000,contextOptions:{deviceScaleFactor:1},run:runBuildingTransitions};
if(isMain(import.meta.url)){
  const profile=process.env.LEVEL_CASE;
  const profiles=profile?[profile==='android'?'android-portrait':profile]:['desktop','android-portrait','reduced'];
  const report=await runSuite({name:'building-transitions',scenarios:[buildingScenario]}, {mode:'stress',profiles,iterations:2,suitePath:'./tools/browser-game-suite.mjs',output:process.env.LEVEL_OUTPUT||'output/level-transitions/browser'});
  process.exitCode=report.verdict==='PASS'?0:1;
}
