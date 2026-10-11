// Silent production-renderer fixture. Forced dialogue is not a natural-flow claim.
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const nativePaint=process.env.PLAYTEST_NATIVE_PAINT==='1';
const revision=Object.fromEntries(['buergeramt.js','world3d.js','buergeramt-lips.js','buergeramt-lipsync.js','buergeramt-mouth-paint.js','buergeramt-splat.js','buergeramt-gaussian-scene.js','buergeramt-painted-anchor.js','assets/buergeramt/speech/mouth-cues.js'].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/lip-motion/review';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const reports=[];
async function faceClip(page,id){
 return page.evaluate(async({id,nativePaint})=>{
  const T=await import('https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js');
  const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id),height=actor.mesh.geometry.parameters.height*actor.mesh.scale.y;
  let rect,aspect=actor.mesh.geometry.parameters.width/actor.mesh.geometry.parameters.height;
  if(nativePaint){
   const entry=Germany3D.amtGaussian.actors.find(a=>a.anchor?.visible&&(a.id===id||a.id===actor.id||id===actor.lipId));
   const manifest=await(await fetch('./assets/buergeramt/animation/'+entry.manifestId+'.json')).json();
   const {nativeMouthRect}=await import('./buergeramt-mouth-paint.js?v=20261011-acoustic-mouth');rect=nativeMouthRect(manifest,entry.anchor.state);aspect=manifest.canvas_xy[0]/manifest.canvas_xy[1];
  }else rect=GermanyAmtLips.mouths[actor.lipId||actor.id||actor.name];
  const points=[];
  for(const x of [-3,3])for(const y of [-3,3]){
   const p=new T.Vector3((rect[0]+x*rect[2]-.5)*height*aspect,(rect[1]+y*rect[3]-.5)*height,0);
   p.applyQuaternion(actor.mesh.quaternion).add(actor.mesh.position).project(__lipRender.camera);points.push([(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2]);
  }
  const x=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))),y=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1]))));
  return{x,y,width:Math.max(1,Math.min(innerWidth-x,Math.ceil(Math.max(...points.map(p=>p[0])))-x)),height:Math.max(1,Math.min(innerHeight-y,Math.ceil(Math.max(...points.map(p=>p[1])))-y))};
 },{id,nativePaint});
}
try{
 for(const [name,width,height] of [['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['reduced-motion',1280,800],['asset-failure',1280,800]].filter(([name])=>!process.env.PLAYTEST_VIEWPORT||process.env.PLAYTEST_VIEWPORT.split(',').includes(name))){
  const context=await browser.newContext({viewport:{width,height},isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference',...(process.env.PLAYTEST_VIDEO&&name==='desktop'?{recordVideo:{dir:output+'/video',size:{width,height}}}:{})});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}return connect.call(this,target,...args)};
   speechSynthesis.speak=u=>{u.volume=0;window.lipTestSpeech=u;u.onstart?.();u.onpause?.()};speechSynthesis.cancel=()=>{};
  });
  const page=await context.newPage(),errors=[],warnings=[];
  page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror',e.message)});page.on('console',m=>{if(m.type()==='error'){warnings.push(m.text());console.log('browser',m.text().slice(0,500))}});
  await page.route('**/buergeramt-lips.js?*',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('buergeramt-lips.js','utf8').replace('createTrack(now=()=>performance.now())','createTrack(now=()=>window.lipFixtureTime??performance.now())')}));
  await page.route('**/buergeramt.js?*',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('buergeramt.js','utf8').replace('requestAnimationFrame(()=>{if(current()&&!settled)','queueMicrotask(()=>{if(current()&&!settled)').replace(/\}\)\(\);\s*$/,'window.__lipProbe={content,view,setStage,characters,cancelSpeech,showCharacter,beginOmen,resetOmen,omen,get options(){return options}};})();')}));
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('world3d.js','utf8').replace('updateAmtMouth(level,now);','updateAmtMouth(level,window.lipFixtureRenderTime??now);').replace('window.Germany3D={ready:true,','window.__lipRender={scene:amtScene,camera:amtCamera,renderer,amtMoving,amtCharacters};window.Germany3D={ready:true,')}));
  if(name==='asset-failure')await page.route('**/omen/aktenkurier.splat',route=>route.abort('failed'));
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:8876/index.html')+'?geheim=buergeramt&voicePreview=1',{waitUntil:'domcontentloaded',timeout:90000});
  try{await page.waitForFunction(()=>window.Germany3D?.ready&&window.BuergeramtLevel?.active&&Germany3D.officeAssetsReady,null,{timeout:90000})}
  catch(error){console.log(await page.evaluate(()=>({level:!!window.BuergeramtLevel,active:window.BuergeramtLevel?.active,renderer:window.Germany3D?.ready,lips:!!window.GermanyAmtLips,status:window.Germany3D?.officeAssetStatus})));throw error}
  console.log(name,'ready');
  await page.evaluate(nativePaint=>{
   window.lipOriginalCatalog=GermanySimulatorAudioText;window.GermanySimulatorAudioText={...GermanySimulatorAudioText,candidateClip:()=>null};
   // This fixture checks the atlas fallback; active native Gaussian paint has
   // its own production-scene fixture. Disable only admission in this context.
   const nativeCharacters=Object.getOwnPropertyDescriptor(BuergeramtLevel,'characters').get,nativeClerk=Object.getOwnPropertyDescriptor(BuergeramtLevel,'clerkPerformance').get;
   if(!nativePaint){
    // A work-mode actor synthesizes its own native work anchor; select the
    // frozen gesture fallback so a null animation actually prevents admission.
    Object.defineProperty(BuergeramtLevel,'characters',{get:()=>nativeCharacters().map(a=>({...a,mode:'gesture',animation:null}))});
    Object.defineProperty(BuergeramtLevel,'clerkPerformance',{get:()=>({...nativeClerk(),animation:null})});
    Object.defineProperty(BuergeramtLevel,'stationaryAnimations',{get:()=>({})});
   }else{
    // Hold native work anchors for this articulation fixture. Natural body
    // admission and return arcs are covered by the separate scene playtest.
    const stationary=Object.getOwnPropertyDescriptor(BuergeramtLevel,'stationaryAnimations').get;
    Object.defineProperty(BuergeramtLevel,'stationaryAnimations',{get:()=>Object.fromEntries(Object.entries(stationary()).map(([id,state])=>[id,{...state,arc:null,pose:id.startsWith('clerk-desk')?'ready':'work'}]))});
    Object.defineProperty(BuergeramtLevel,'clerkPerformance',{get:()=>{const state=nativeClerk();return{...state,animation:{...state.animation,arc:null,pose:'ready',phase:1}}}});
   }
   window.lipOriginalUpdate=BuergeramtLevel.update;BuergeramtLevel.update=()=>{};__lipProbe.options.voiceOn=()=>true;window.lipFixtureTime=0;window.lipFixtureRenderTime=performance.now();__lipProbe.setStage('character');
   window.lipActorOrigins=__lipProbe.characters.map(a=>({id:a.id,x:a.x,z:a.z}));
  },nativePaint);
  const actors=await page.evaluate(()=>[...__lipRender.amtMoving.map(a=>a.id),...__lipRender.amtCharacters.map(a=>a.performance?a.lipId:a.id)]);
  if(process.env.PLAYTEST_ACTOR)for(let i=actors.length-1;i>=0;i--)if(!process.env.PLAYTEST_ACTOR.split(',').includes(actors[i]))actors.splice(i,1);
  if(process.env.PLAYTEST_OMEN_ONLY)actors.length=0;
  const snapshots=[];let renderCost=null;
  for(const id of actors){
   await page.evaluate(id=>{
    for(const a of __lipProbe.characters){const origin=lipActorOrigins.find(o=>o.id===a.id);a.x=origin.x;a.z=origin.z}
    const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);
    const state=__lipProbe.characters.find(a=>a.id===id);
    // Present each native actor in an unobstructed fixture lane, away from walls.
    if(state){state.x=0;state.z=1.8;actor.mesh.position.set(0,actor.mesh.position.y,1.8)}
    const x=state?.x??actor.mesh.position.x,z=state?.z??actor.mesh.position.z;
    __lipProbe.view.x=x;__lipProbe.view.z=z+1.25;__lipProbe.view.yaw=0;
    Germany3D.sync();
   },id);
   await page.waitForTimeout(300);
   await page.evaluate(id=>{
    // Fixture-only text exercises the local visemes. Node tests cover authored lines.
    const who=id==='clerk'?'FRAU KNICK':id;
    window.lipTestSpeech=null;
    __lipProbe.content(who,'Mama fünf Omi schöne Euro!',[],null,null,null,{id,tone:'procedural',valence:0});
    Germany3D.sync();
   },id);
   await page.waitForFunction(id=>window.lipTestSpeech&&BuergeramtLevel.lipSpeech.actor===id&&BuergeramtLevel.lipSpeech.mode==='voice',id,{timeout:15000}).catch(async error=>{console.log('speech-start',await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,text:document.getElementById('amt-line').textContent,utterance:window.lipTestSpeech?.text})));throw error});
   await page.waitForTimeout(220); // close-detail readiness
   await page.evaluate(()=>{lipTestSpeech.onresume?.();window.lipFixtureTime=0;lipTestSpeech.onboundary({charIndex:1});window.lipFixtureTime=35;window.lipFixtureRenderTime+=100;Germany3D.sync();lipTestSpeech.onpause?.()});
   await page.waitForTimeout(120);
   await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});await page.waitForTimeout(100);
   const open=await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,splat:Germany3D.amtLipSplat,actor:(()=>{const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===BuergeramtLevel.lipSpeech.actor||a.lipId===BuergeramtLevel.lipSpeech.actor);return{hole:a.mesh.material.userData.lipHole.value,foot:a.mesh.position.y-a.mesh.geometry.parameters.height/2,crop:a.renderKey}})(),memory:Germany3D.inspectAssets().memory}));
   assert.equal(open.speech.actor,id);assert.equal(open.speech.paused,true);assert(open.speech.shape[0]>.75);assert.equal(open.splat.kernels,425);assert.equal(open.actor.foot,0);
   if(nativePaint){
    await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.some(a=>a.anchor?.visible&&a.anchor.lipShape[0]>.75)},null,{timeout:90000}).catch(async error=>{writeFileSync(`${output}/${name}-${id}-failure.json`,JSON.stringify(await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,gaussian:Germany3D.amtGaussian,clerk:BuergeramtLevel.clerkPerformance,view:BuergeramtLevel.view})),null,2));throw error});
    open.gaussian=await page.evaluate(()=>Germany3D.amtGaussian);open.splat=await page.evaluate(()=>Germany3D.amtLipSplat);assert.equal(open.splat.visible,false);
   }else{assert.equal(open.splat.visible,true);assert.equal(open.actor.hole,1);assert.equal(open.splat.depthTest,true);assert.equal(open.splat.layer,2,'mouth shares the final actor pass')}
   if(!nativePaint&&id===actors[0])renderCost=await page.evaluate(()=>{
    const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===BuergeramtLevel.lipSpeech.actor||a.lipId===BuergeramtLevel.lipSpeech.actor),patch=a.mesh.children.find(m=>m.geometry?.instanceCount===425);
    const sample=()=>{const times=[];for(let n=0;n<30;n++){const at=performance.now(),r=__lipRender.renderer,s=__lipRender.scene,c=__lipRender.camera;
     r.render(s,c);const background=s.background;s.background=null;r.autoClear=false;c.layers.set(1);
     try{r.render(s,c)}finally{c.layers.set(0);r.autoClear=true;s.background=background}
     times.push(performance.now()-at)}times.sort((a,b)=>a-b);return{p50Ms:times[15],p95Ms:times[28],calls:__lipRender.renderer.info.render.calls,triangles:__lipRender.renderer.info.render.triangles,memory:{...__lipRender.renderer.info.memory}}};
    const active=sample();patch.visible=false;a.mesh.material.userData.lipHole.value=0;const baseline=sample();patch.visible=true;a.mesh.material.userData.lipHole.value=1;
    return{active,baseline,scope:'same frozen production scene, CPU submission only; GPU timing unavailable'};
   });
   await page.screenshot({path:`${output}/${name}-${id}-open.png`});
   const face=await faceClip(page,id);await page.screenshot({path:`${output}/${name}-${id}-face-open.png`,clip:face});
   await page.evaluate(()=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:5});window.lipFixtureTime+=35;window.lipFixtureRenderTime+=100;Germany3D.sync();lipTestSpeech.onpause?.()});await page.waitForTimeout(120);
   await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const bite=await page.evaluate(()=>BuergeramtLevel.lipSpeech);assert(bite.shape[3]>.75);
   if(nativePaint)assert(await page.evaluate(()=>Germany3D.amtGaussian.actors.some(a=>a.anchor?.visible&&a.anchor.lipShape[3]>.75)));
   await page.screenshot({path:`${output}/${name}-${id}-bite.png`});
   await page.evaluate(()=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:10});window.lipFixtureTime+=35;window.lipFixtureRenderTime+=100;Germany3D.sync();lipTestSpeech.onpause?.()});await page.waitForTimeout(120);
   await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const round=await page.evaluate(()=>BuergeramtLevel.lipSpeech);assert(round.shape[2]>.75);
   if(nativePaint)assert(await page.evaluate(()=>Germany3D.amtGaussian.actors.some(a=>a.anchor?.visible&&a.anchor.lipShape[2]>.75)));
   await page.screenshot({path:`${output}/${name}-${id}-round.png`});
   await page.screenshot({path:`${output}/${name}-${id}-face-round.png`,clip:face});
   // A closed consonant in a fresh owned utterance keeps the same speaking
   // body key. Ending speech here used to switch the clerk's painting and
   // confound mouth-only comparisons with a stamp/head pose change.
   await page.evaluate(id=>{window.lipFixtureTime=0;window.lipTestSpeech=null;__lipProbe.content(id==='clerk'?'FRAU KNICK':id,'Mama fünf Omi schöne Euro!',[],null,null,null,{id,tone:'procedural',valence:0})},id);
   await page.waitForFunction(()=>!!window.lipTestSpeech);
   await page.evaluate(()=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:0});window.lipFixtureTime=35;Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const closed=await page.evaluate(()=>Germany3D.amtLipSplat);assert.equal(closed.visible,false);
   assert.equal(await page.evaluate(()=>BuergeramtLevel.lipSpeech.shape[0]),0);
   await page.screenshot({path:`${output}/${name}-${id}-closed.png`});
   await page.screenshot({path:`${output}/${name}-${id}-face-closed.png`,clip:face});
   await page.evaluate(()=>{lipTestSpeech.onend?.();Germany3D.sync()});
   assert.equal(await page.evaluate(()=>Germany3D.amtLipSplat.actor),null);
   snapshots.push({id,open,bite,round,closed,face});
   console.log(name,id,'PASS');
  }
  if(nativePaint){
   await page.evaluate(()=>{BuergeramtLevel.update=lipOriginalUpdate;document.getElementById('amt-leave').click();Germany3D.sync()});
   assert.equal(await page.evaluate(()=>Germany3D.amtGaussian.actors.length),0);assert.deepEqual(errors,[]);
   reports.push({name,nativePaint,silent:true,physicalAndroid:false,forcedDialogue:true,stationaryWorkAnchors:true,revision,snapshots,errors,warnings});
   await context.close();writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify({name,result:'PASS',nativePaint,actors:actors.length,errors}));continue;
  }
  // Native MP3 plays normally: do not seek or substitute a wall clock.
  const nativeWindow={start:await page.evaluate(()=>performance.now()/1000)};
  await page.evaluate(()=>{
   window.lipFixtureTime=null;window.lipFixtureRenderTime=null;window.GermanySimulatorAudioText=lipOriginalCatalog;
   const a=__lipRender.amtCharacters[0];__lipProbe.view.x=a.mesh.position.x;__lipProbe.view.z=a.mesh.position.z+1.6;
   __lipProbe.content('FRAU KNICK',BuergeramtStory.clerk[0].line);Germany3D.sync();
  });
  await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.mode==='recorded',null,{timeout:15000});
  const mediaTrace=await page.evaluate(async()=>{
   const trace=[];for(let i=0;i<40;i++){const sample=BuergeramtLevel.lipSpeech;if(sample.mode!=='recorded')break;trace.push(sample);if(sample.time-trace[0].time>=1.1)break;await new Promise(r=>setTimeout(r,120))}return trace;
  });
  writeFileSync(`${output}/${name}-native-media.json`,JSON.stringify(mediaTrace,null,2));
  assert(mediaTrace.at(-1).time>mediaTrace[0].time+.8);
  assert(mediaTrace.some(s=>s.shape[0]>.5)&&mediaTrace.some(s=>s.shape[0]<.01),'real speech contains both an audible opening and a closure');
  assert(mediaTrace.every(s=>s.timing==='audio-cues'),'the approved MP3 must use its acoustic binding');
  nativeWindow.end=await page.evaluate(()=>performance.now()/1000);
  await page.screenshot({path:`${output}/${name}-recorded-clerk.png`});
  await page.evaluate(()=>__lipProbe.cancelSpeech());
  // A real opaque blocker must occlude the mouth with its source actor.
  const occlusion=await page.evaluate(async()=>{
   const T=await import('https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js');
   window.GermanySimulatorAudioText={...lipOriginalCatalog,candidateClip:()=>null};__lipProbe.content('FRAU KNICK','Mama');
   await new Promise(r=>setTimeout(r,35));lipTestSpeech.onpause();Germany3D.sync();
   const a=__lipRender.amtCharacters[0],wall=new T.Mesh(new T.PlaneGeometry(.9,1),new T.MeshBasicMaterial({color:0x2560a0}));
   wall.position.set(a.mesh.position.x,1.5,a.mesh.position.z+.6);__lipRender.scene.add(wall);Germany3D.sync();
   window.lipTestWall=wall;return{depthTest:Germany3D.amtLipSplat.depthTest,depthWrite:Germany3D.amtLipSplat.depthWrite};
  });
  await page.screenshot({path:`${output}/${name}-opaque-occlusion.png`});
  await page.evaluate(()=>{lipTestWall.removeFromParent();lipTestWall.geometry.dispose();lipTestWall.material.dispose();__lipProbe.cancelSpeech();Germany3D.sync()});
  // Exercise the production Spark handover (or its failed-load painted fallback).
  await page.evaluate(()=>{__lipProbe.resetOmen();__lipProbe.setStage('outside');Germany3D.sync()});
  await page.waitForFunction(fail=>fail?Germany3D.amtOmenSplat.skipped:Germany3D.amtOmenSplat.ready,name==='asset-failure',{timeout:45000});
  await page.evaluate(()=>{
   window.lipFixtureTime=0;window.lipTestSpeech=null;
   for(const a of __lipProbe.characters){const origin=lipActorOrigins.find(o=>o.id===a.id);a.x=origin.x;a.z=origin.z}
   const a=__lipProbe.characters[0];a.x=0;a.z=1.8;
   __lipProbe.view.x=0;__lipProbe.view.z=3.8;__lipProbe.view.yaw=0;
   __lipProbe.setStage('omen');__lipProbe.beginOmen(a);
   __lipProbe.content(BuergeramtStory.omen.speaker,'Mama fünf Omi schöne Euro!',[],null,null,null,{id:'aktenkurier',tone:'dread',valence:-.9});
   __lipProbe.omen.revealTime=3;__lipProbe.omen.lifeTime=3;Germany3D.sync();
  });
  await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.mode==='voice'&&window.lipTestSpeech,null,{timeout:15000});
  if(name!=='asset-failure')await page.waitForFunction(()=>Germany3D.amtOmenSplat.activeSplats>0,null,{timeout:45000});
  const omenFrames=[];
  for(const [pose,index] of [['open',1],['bite',5],['round',10]]){
   await page.evaluate(index=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:index});window.lipFixtureTime+=43},index);
   await page.waitForTimeout(160);await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   omenFrames.push(await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,volume:Germany3D.amtOmenSplat,paint:Germany3D.amtLipSplat})));
   await page.screenshot({path:`${output}/${name}-omen-${pose}.png`});
  }
  writeFileSync(`${output}/${name}-omen-diagnostics.json`,JSON.stringify(omenFrames,null,2));
  if(name==='asset-failure')assert(omenFrames.every(f=>f.paint.visible&&!f.volume.ready&&f.volume.skipped));
  else{
   assert(omenFrames.every(f=>f.volume.visible&&f.volume.mouthSplats===96&&f.volume.activeSplats>0));
   assert(omenFrames[0].volume.mouth.open>.75);assert(omenFrames[1].volume.mouth.bite>.75);assert(omenFrames[2].volume.mouth.round>.75);
  }
  await page.evaluate(()=>{__lipProbe.cancelSpeech();Germany3D.sync()});
  await page.evaluate(()=>{BuergeramtLevel.update=lipOriginalUpdate});
  await page.locator('#amt-leave').evaluate(n=>n.click());
  await page.waitForFunction(()=>{if(BuergeramtLevel.active)return false;Germany3D.sync();return Germany3D.amtLipSplat===null},null,{timeout:15000});
  assert.equal(await page.evaluate(()=>Germany3D.amtLipSplat),null);
  assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(w=>/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(w)),[]);
  reports.push({name,silent:true,physicalAndroid:false,forcedDialogue:true,revision,snapshots,mediaTrace,nativeWindow,occlusion,omenFrames,renderCost,errors,warnings});
  const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${name}-motion.webm`);
  writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify({name,result:'PASS',actors:actors.length,errors}));
 }
}finally{await browser.close()}
