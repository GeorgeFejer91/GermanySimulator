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
  const page=await browser.newPage({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  page.on('console',e=>{if(e.type()==='error'||e.type()==='warning')errors.push(`${name} console: ${e.text()}`)});
  page.on('requestfailed',r=>{if(!r.url().includes('/assets/intro-song.mp3')||r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(`${name} request: ${r.url()} ${r.failure()?.errorText}`)});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${name} HTTP ${r.status()}: ${r.url()}`)});
  page.on('request',r=>{if(r.url().includes('/buergeramt/'))modelRequests.push(r.url())});
  await page.goto(`${url}?geheim=buergeramt`,{waitUntil:'commit',timeout:45000});
  try{await page.waitForFunction(()=>window.BuergeramtLevel?.active,null,{timeout:20000})}
  catch(error){console.log(JSON.stringify({name:'level-start-timeout',state:await page.evaluate(()=>({readyState:document.readyState,level:!!window.BuergeramtLevel,active:window.BuergeramtLevel?.active,renderer:window.Germany3D?.ready,body:document.body.className})),errors}));throw error}
  await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:60000});
  try{await page.waitForFunction(()=>Germany3D.amtCharacters.length===14&&Germany3D.amtCharacters.every(x=>x.loaded),null,{timeout:75000})}
  catch(error){await page.screenshot({path:`${output}/world-sprite-timeout-${name}.png`,timeout:15000}).catch(()=>{});console.log(JSON.stringify({name:'sprite-load-timeout',actors:await page.evaluate(()=>Germany3D.amtCharacters),requests:modelRequests,resources:await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('/buergeramt/')).map(x=>({name:x.name,duration:x.duration,bytes:x.transferSize}))),errors}));throw error}
  await page.waitForFunction(()=>Germany3D.amtOffice?.attached,null,{timeout:30000});
  if(name==='desktop')console.log(JSON.stringify({name:'office-detail',...await page.evaluate(()=>{const {attached,compact,instances,triangles,staticDrawCalls,textures,texturePixels,props,obstacles}=Germany3D.amtOffice;return{attached,compact,instances,triangles,staticDrawCalls,textures,texturePixels,props,obstacleCount:obstacles.length}})}));
  if(name==='desktop'){const before=await page.evaluate(()=>Germany3D.amtCharacters.map(x=>x.frame));await page.waitForTimeout(160);await page.evaluate(()=>Germany3D.sync());const after=await page.evaluate(()=>Germany3D.amtCharacters.map(x=>x.frame));if(before.every((frame,i)=>frame===after[i]))errors.push('Bürgeramt sprite frame did not advance');const moving=await page.evaluate(()=>Germany3D.amtCharacters.filter(x=>x.position));if(moving.length!==8||moving.some(x=>!x.loaded))errors.push('Moving Bürgeramt cast did not load');console.log(JSON.stringify({name:'sprite-atlases',before,after,moving,requests:modelRequests.length}))}
  await page.evaluate(()=>window.Germany3D.sync());
  await page.screenshot({path:`${output}/world-${name}.png`,timeout:60000});
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD'}));for(let i=0;i<10;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD'}));dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<19;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))});
  const wing=await page.evaluate(()=>({stage:BuergeramtLevel.stage,z:BuergeramtLevel.view.z}));
  if(wing.stage!=='outside'||wing.z<5.55)throw new Error(`Facade wing allowed entry: ${JSON.stringify(wing)}`);
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyA'}));for(let i=0;i<10;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyA'}));dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<19;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))});
  const entrance=await page.evaluate(()=>({stage:BuergeramtLevel.stage,z:BuergeramtLevel.view.z}));
  if(entrance.stage!=='walk-sign'||entrance.z>=5.55)throw new Error(`Open doorway blocked walking: ${JSON.stringify(entrance)}`);
  await page.evaluate(()=>window.Germany3D.sync());
  await page.waitForFunction(()=>document.getElementById('amt-objective').dataset.pretextFit,null,{timeout:10000});
  await page.screenshot({path:`${output}/world-walk-${name}.png`});
  if(name==='desktop'){
   await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<37;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));Germany3D.sync()});
   await page.evaluate(()=>{for(let i=0;i<180;i++)BuergeramtLevel.update(.05);Germany3D.sync()});
   const omen=await page.evaluate(()=>({stage:BuergeramtLevel.stage,phase:BuergeramtLevel.omen.phase,strength:BuergeramtLevel.omen.strength,line:document.getElementById('amt-line').textContent}));
   if(omen.stage!=='omen'||omen.strength<.95||omen.line!=='Wer die Finsternis sieht, hat sie selbst gewählt!')throw new Error(`Aktenkurier beat failed: ${JSON.stringify(omen)}`);
   await page.screenshot({path:`${output}/world-aktenkurier-omen.png`});
   await page.waitForTimeout(6500);
   await page.evaluate(()=>{for(let i=0;i<40;i++)BuergeramtLevel.update(.05);Germany3D.sync()});
   if(await page.evaluate(()=>BuergeramtLevel.stage!=='walk-sign'||BuergeramtLevel.omen.strength!==0))throw new Error('Aktenkurier beat did not release the office');
   await page.screenshot({path:`${output}/world-qr-closeup.png`});
   await page.evaluate(()=>BuergeramtLevel.interact());
   if(await page.evaluate(()=>BuergeramtLevel.stage!=='walk-sign'||!!document.querySelector('#amt-ticket')))throw new Error('QR interaction opened an unwanted popup');
   await page.evaluate(()=>{for(const [code,frames] of [['KeyD',23],['KeyW',34]]){dispatchEvent(new KeyboardEvent('keydown',{code}));for(let i=0;i<frames;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code}))}Germany3D.sync()});
   await page.screenshot({path:`${output}/world-clerk-closeup.png`});
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
