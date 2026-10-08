import { createRequire } from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.GAME_URL||'http://127.0.0.1:8770/index.html';
const output=process.env.PLAYTEST_OUTPUT||'C:/Users/gfeje/Documents/GitHub/ChatDev/WareHouse/germany-playtest';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
const errors=[],modelRequests=[];let passed=false;
try{
 const cases=[['desktop',{width:1280,height:800}],['mobile',{width:390,height:844}],['narrow',{width:320,height:700}]];
 for(const [name,viewport] of (process.env.PLAYTEST_VIEWPORT?cases.filter(([id])=>id===process.env.PLAYTEST_VIEWPORT):process.env.PLAYTEST_DESKTOP_ONLY?cases.slice(0,1):cases)){
  const page=await browser.newPage({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop',deviceScaleFactor:name==='mobile'?2:1});
  await page.addInitScript(()=>{
   // Silence this isolated session while preserving production scheduling.
   const play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(target,...args){
    if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}
    return connect.call(this,target,...args);
   };
   const speak=speechSynthesis.speak.bind(speechSynthesis);
   speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
  });
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  page.on('console',e=>{if(e.type()==='error'||e.type()==='warning')errors.push(`${name} console: ${e.text()}`)});
  page.on('requestfailed',r=>{
   const cancelled=r.failure()?.errorText==='net::ERR_ABORTED';
   const optional=r.url().includes('/assets/intro-song.mp3')||r.url().startsWith('https://timeapi.io/api/Time/current/zone?timeZone=UTC');
   if(!(cancelled&&optional))errors.push(`${name} request: ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on('response',r=>{if(r.status()>=400)errors.push(`${name} HTTP ${r.status()}: ${r.url()}`)});
  page.on('request',r=>{if(r.url().includes('/buergeramt/'))modelRequests.push(r.url())});
  await page.goto(`${url}?geheim=buergeramt`,{waitUntil:'commit',timeout:45000});
  try{await page.waitForFunction(()=>window.BuergeramtLevel?.active,null,{timeout:20000})}
  catch(error){console.log(JSON.stringify({name:'level-start-timeout',state:await page.evaluate(()=>({readyState:document.readyState,level:!!window.BuergeramtLevel,active:window.BuergeramtLevel?.active,renderer:window.Germany3D?.ready,body:document.body.className})),errors}));throw error}
  await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:60000});
  if(name==='mobile')await page.waitForFunction(()=>document.getElementById('world3d').height/innerHeight===2,null,{timeout:10000});
  try{await page.waitForFunction(()=>Germany3D.amtCharacters.length===14&&Germany3D.amtCharacters.every(x=>x.loaded),null,{timeout:75000})}
  catch(error){await page.screenshot({path:`${output}/world-sprite-timeout-${name}.png`,timeout:15000}).catch(()=>{});console.log(JSON.stringify({name:'sprite-load-timeout',actors:await page.evaluate(()=>Germany3D.amtCharacters),requests:modelRequests,resources:await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('/buergeramt/')).map(x=>({name:x.name,duration:x.duration,bytes:x.transferSize}))),errors}));throw error}
  await page.waitForFunction(()=>Germany3D.amtOffice?.attached,null,{timeout:30000});
  if(name==='desktop')console.log(JSON.stringify({name:'office-detail',...await page.evaluate(()=>{const {attached,compact,instances,triangles,staticDrawCalls,textures,texturePixels,props,obstacles}=Germany3D.amtOffice;return{attached,compact,instances,triangles,staticDrawCalls,textures,texturePixels,props,obstacleCount:obstacles.length}})}));
  if(name==='desktop'){
   const before=await page.evaluate(()=>Germany3D.amtCharacters.map(x=>({frame:x.frame,breath:x.breath})));
   await page.waitForTimeout(160);await page.evaluate(()=>Germany3D.sync());
   const after=await page.evaluate(()=>Germany3D.amtCharacters.map(x=>({frame:x.frame,breath:x.breath})));
   if(before.every((item,i)=>item.frame===after[i].frame))errors.push('Bürgeramt sprite frame did not advance');
   if(before.every((item,i)=>Math.abs(item.breath-after[i].breath)<.001))errors.push('Bürgeramt paint breath did not advance');
   const moving=await page.evaluate(()=>Germany3D.amtCharacters.filter(x=>x.position));
   if(moving.length!==8||moving.some(x=>!x.loaded))errors.push('Moving Bürgeramt cast did not load');
   console.log(JSON.stringify({name:'sprite-atlases',before,after,moving,requests:modelRequests.length}));
  }
  // Render normally, but step the simulation explicitly below so slow texture
  // uploads/screenshots cannot consume a narrative beat between assertions.
  await page.evaluate(()=>{window._amtStep=BuergeramtLevel.update.bind(BuergeramtLevel);BuergeramtLevel.update=()=>{}});
  {
   await page.evaluate(()=>{window._amtCharactersDescriptor=Object.getOwnPropertyDescriptor(BuergeramtLevel,'characters');window._amtPose={id:'aktenkurier',direction:'right',phase:0};const view=BuergeramtLevel.view;Object.defineProperty(BuergeramtLevel,'characters',{configurable:true,get(){return window._amtCharactersDescriptor.get.call(this).map(actor=>actor.id===window._amtPose.id?{...actor,x:view.x+1,z:view.z-2,mode:'walk',...window._amtPose,frame:Math.floor(window._amtPose.phase*8)}:actor)}});Germany3D.sync()});
   for(const id of ['aktenkurier','archivbotin'])for(const [row,direction] of ['down','right','up','left'].entries()){
    await page.evaluate(pose=>{window._amtPose=pose;Germany3D.sync()},{id,direction,phase:0});
    await page.waitForFunction(({id,height})=>{Germany3D.sync();const actor=Germany3D.amtCharacters.find(item=>item.name===id);return actor?.detail&&actor.texelHeight===height},{id,height:name==='narrow'?1664:3328},{timeout:20000});
    const frames=await page.evaluate(id=>Array.from({length:17},(_,i)=>{window._amtPose.phase=(i%16)/16;Germany3D.sync();return Germany3D.amtCharacters.find(item=>item.name===id).frame}),id);
    if(frames.some((frame,i)=>frame!==row*16+i%16))throw new Error(`Dense walk indexing failed: ${name} ${id} ${direction} ${frames}`);
    await page.screenshot({path:`${output}/world-detail-${id}-${direction}-${name}.png`});
   }
   await page.evaluate(()=>{Object.defineProperty(BuergeramtLevel,'characters',window._amtCharactersDescriptor);delete window._amtCharactersDescriptor;delete window._amtPose;Germany3D.sync()});
   // The exhaustive texture probes may span several route loops. Start the
   // narrative checks from their own fresh attempt, with production reset logic.
   await page.locator('#amt-direct-reset').evaluate(el=>el.click());
  }
  await page.evaluate(()=>window.Germany3D.sync());
  await page.screenshot({path:`${output}/world-${name}.png`,timeout:60000});
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD'}));for(let i=0;i<10;i++)window._amtStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD'}));dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<19;i++)window._amtStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))});
  const wing=await page.evaluate(()=>({stage:BuergeramtLevel.stage,z:BuergeramtLevel.view.z}));
  if(wing.stage!=='outside'||wing.z<5.55)throw new Error(`Facade wing allowed entry: ${JSON.stringify(wing)}`);
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyA'}));for(let i=0;i<10;i++)window._amtStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyA'}));dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<19;i++)window._amtStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))});
  const entrance=await page.evaluate(()=>({stage:BuergeramtLevel.stage,z:BuergeramtLevel.view.z}));
  if(entrance.stage!=='walk-sign'||entrance.z>=5.55)throw new Error(`Open doorway blocked walking: ${JSON.stringify(entrance)}`);
  await page.evaluate(()=>window.Germany3D.sync());
  await page.waitForFunction(()=>document.getElementById('amt-objective').dataset.pretextFit,null,{timeout:10000});
  await page.screenshot({path:`${output}/world-walk-${name}.png`});
  if(name==='mobile'){
   await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<37;i++)window._amtStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));for(let i=0;i<180;i++)window._amtStep(.05);Germany3D.sync()});
   const scene=await page.evaluate(()=>({stage:BuergeramtLevel.stage,strength:BuergeramtLevel.omen.strength}));
   if(scene.stage!=='omen'||scene.strength<.95)throw new Error(`Mobile Aktenkurier beat failed: ${JSON.stringify(scene)}`);
   await page.waitForFunction(()=>Germany3D.amtCharacters.find(actor=>actor.name==='aktenkurier')?.detail,null,{timeout:10000});
   const courier=await page.evaluate(()=>Germany3D.amtCharacters.find(actor=>actor.name==='aktenkurier'));
   if(!courier.detail||courier.texelHeight!==832)throw new Error(`Aktenkurier close art did not load: ${JSON.stringify(courier)}`);
   await page.screenshot({path:`${output}/world-aktenkurier-omen-mobile.png`});
  }
  if(name==='desktop'){
   await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<37;i++)window._amtStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));Germany3D.sync()});
   await page.evaluate(()=>{for(let i=0;i<180;i++)window._amtStep(.05);Germany3D.sync()});
   const omen=await page.evaluate(()=>({stage:BuergeramtLevel.stage,phase:BuergeramtLevel.omen.phase,strength:BuergeramtLevel.omen.strength,line:document.getElementById('amt-line').textContent}));
   if(omen.stage!=='omen'||omen.strength<.95||omen.line!=='Wer die Finsternis sieht, hat sie selbst gewählt!')throw new Error(`Aktenkurier beat failed: ${JSON.stringify(omen)}`);
   await page.screenshot({path:`${output}/world-aktenkurier-omen.png`});
   await page.waitForTimeout(6500);
   await page.evaluate(()=>{for(let i=0;i<40;i++)window._amtStep(.05);Germany3D.sync()});
   if(await page.evaluate(()=>BuergeramtLevel.stage!=='walk-sign'||BuergeramtLevel.omen.strength!==0))throw new Error('Aktenkurier beat did not release the office');
   await page.screenshot({path:`${output}/world-qr-closeup.png`});
   await page.evaluate(()=>BuergeramtLevel.interact());
   if(await page.evaluate(()=>BuergeramtLevel.stage!=='walk-sign'||!!document.querySelector('#amt-ticket')))throw new Error('QR interaction opened an unwanted popup');
   // Clear the seat row before strafing into the x=3 aisle; the omen can stop
   // beside a chair, so a fixed right-then-forward script can hit its side.
   const clerkRoute=await page.evaluate(()=>{
    for(let i=0;i<10&&BuergeramtLevel.omen.phase;i++)window._amtStep(.05);
    const before=BuergeramtLevel.view,turn=Math.atan2(Math.sin(-before.yaw),Math.cos(-before.yaw)),key=turn>=0?'ArrowRight':'ArrowLeft';
    dispatchEvent(new KeyboardEvent('keydown',{code:key}));let remaining=Math.abs(turn)/1.8;
    while(remaining>0){const dt=Math.min(.05,remaining);window._amtStep(dt);remaining-=dt}dispatchEvent(new KeyboardEvent('keyup',{code:key}));
    dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));
    for(let i=0;i<80&&BuergeramtLevel.view.z>-2.5;i++)window._amtStep(.05);
    dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));
    const strafe=BuergeramtLevel.view.x<3?'KeyD':'KeyA';dispatchEvent(new KeyboardEvent('keydown',{code:strafe}));
    for(let i=0;i<80&&Math.abs(BuergeramtLevel.view.x-3)>.01;i++)window._amtStep(Math.min(.05,Math.abs(BuergeramtLevel.view.x-3)/3.6));
    dispatchEvent(new KeyboardEvent('keyup',{code:strafe}));dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));
    for(let i=0;i<200&&BuergeramtLevel.view.z>-7.5;i++)window._amtStep(.05);
    dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));Germany3D.sync();return {before,after:BuergeramtLevel.view};
   });
   console.log(JSON.stringify({name:'clerk-route',...clerkRoute}));
   if(Math.hypot(clerkRoute.after.x-3.9,clerkRoute.after.z+9.77)>4.4)throw new Error(`Clerk route blocked: ${JSON.stringify(clerkRoute)}`);
   await page.screenshot({path:`${output}/world-clerk-closeup.png`});
   await page.evaluate(()=>{const view=BuergeramtLevel.view,target=Math.atan2(3.9-view.x,view.z+9.77),turn=Math.atan2(Math.sin(target-view.yaw),Math.cos(target-view.yaw)),code=turn>=0?'ArrowRight':'ArrowLeft';dispatchEvent(new KeyboardEvent('keydown',{code}));let remaining=Math.abs(turn)/1.8;while(remaining>0){const dt=Math.min(.05,remaining);window._amtStep(dt);remaining-=dt}dispatchEvent(new KeyboardEvent('keyup',{code}));Germany3D.sync()});
   await page.waitForFunction(()=>Germany3D.amtCharacters[0]?.detail,null,{timeout:20000});
   const clerk=await page.evaluate(()=>Germany3D.amtCharacters[0]);
   if(!clerk.detail||clerk.texelHeight!==1664)throw new Error(`Clerk close art did not load: ${JSON.stringify(clerk)}`);
   await page.screenshot({path:`${output}/world-clerk-detail.png`});
  }
  const result=await page.evaluate(()=>({stage:BuergeramtLevel.stage,direct:document.body.classList.contains('amt-direct-mode'),restartVisible:getComputedStyle(document.getElementById('amt-direct-reset')).display!=='none',renderer:Germany3D.ready,pretext:document.getElementById('amt-objective').dataset.pretextFit,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1}));
  console.log(JSON.stringify({name,...result}));
  if(!result.direct||!result.renderer||!result.restartVisible||result.horizontalOverflow||!['one-line','wrapped'].includes(result.pretext))throw new Error(`Invalid world checkpoint ${name}: ${JSON.stringify(result)}`);
  if(name==='desktop'){
   await page.locator('#amt-leave').evaluate(el=>el.click());
   await page.locator('#amt-direct-result:not([hidden])').waitFor();
   await page.screenshot({path:`${output}/world-direct-result.png`});
   await page.locator('#amt-direct-result a').evaluate(el=>el.click());
   await page.waitForFunction(()=>BuergeramtLevel?.active&&BuergeramtLevel.stage==='outside',null,{timeout:45000});
   console.log(JSON.stringify({name:'restart',active:await page.evaluate(()=>BuergeramtLevel.active)}));
  }
  if(name!=='desktop'){await page.evaluate(()=>{document.documentElement.style.zoom='2'});await page.screenshot({path:`${output}/world-walk-${name}-zoom200.png`});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);console.log(JSON.stringify({name:`${name}-zoom200`,horizontalOverflow:overflow}));if(overflow)throw new Error(`World overflow at ${viewport.width}px / 200% zoom`)}
  await page.close();
 }
 console.log(JSON.stringify({errors}));passed=true;
}catch(error){console.error(error);errors.push(String(error))}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(passed&&errors.length===0?0:1)}
