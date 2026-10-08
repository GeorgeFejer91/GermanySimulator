// Silent, isolated lab runs. Uses the project's existing Playwright installation.
// PLAYWRIGHT_MODULE and CHROMIUM_PATH select already-installed tools.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),output=resolve(process.env.BENCH_OUTPUT||'output/browser-performance');
mkdirSync(output,{recursive:true});
// Only these source files are overridden; asset comparisons require an isolated checkout.
const baseline=process.env.BENCH_REF?new Map(['game.js','world3d.js','tourist-animation.js','index.html','3d.html','buergeramt.js','buergeramt-fit.js'].map(file=>[resolve(root,file),execFileSync('git',['show',process.env.BENCH_REF+':'+file])])):null;
const source=file=>baseline?.get(resolve(file))||readFileSync(file);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(source(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={revision:Object.fromEntries(['game.js','world3d.js','tourist-animation.js'].map(file=>[file,createHash('sha256').update(source(file)).digest('hex')])),conditions:{sourceRef:process.env.BENCH_REF||'working tree',browser:'',network:'local uncompressed HTTP; cold browser context',cpu:process.env.BENCH_THROTTLE?'4x emulated slowdown':'no CPU throttling',gpu:process.env.BENCH_GPU==='hardware'?'ANGLE hardware renderer (queried per run)':'ANGLE SwiftShader software rendering',dpr:2},runs:[],limits:['Lab evidence only; no field data or physical Android; hardware renderer queried, GPU timing unavailable','Start uses the existing S keyboard shortcut to skip the humor questionnaire','Opening-screen and gameplay samples are separate; screenshots are representative frames']};
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.BENCH_GPU==='hardware'?['--mute-audio']:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});report.conditions.browser=browser.version();
 for(const [name,viewport] of (process.env.BENCH_OFFICE?[['office-desktop',{width:1280,height:800}],['office-android-emulated',{width:390,height:844}]]:[['desktop',{width:1280,height:800}],['android-emulated',{width:390,height:844}]]))for(let run=0;run<Number(process.env.BENCH_RUNS||3);run++){
  const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:name.includes('android'),hasTouch:name.includes('android')});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
   window.__inputLatencies=[];window.__inputPending=null;addEventListener('keydown',event=>{if(window.__inputPose&&(event.code==='ArrowRight'||event.code==='ArrowLeft'))__inputPending={at:performance.now(),before:__inputPose()}},true);
   window.__longTasks=[];new PerformanceObserver(list=>__longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  });
  const page=await context.newPage(),errors=[],resources=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
  const urls=new Map();cdp.on('Network.requestWillBeSent',e=>urls.set(e.requestId,e.request.url));cdp.on('Network.loadingFinished',e=>resources.push({url:urls.get(e.requestId),bytes:e.encodedDataLength}));
  if(process.env.BENCH_PROFILE)await cdp.send('Profiler.enable');
  if(process.env.BENCH_THROTTLE){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750})}
  console.log(JSON.stringify({stage:'start',name,run}));
  await page.goto(`http://127.0.0.1:${server.address().port}/${process.env.BENCH_OFFICE?'?geheim=buergeramt':''}`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:120000});
  const readyMs=await page.evaluate(()=>performance.now());
  const gpu=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');const d=gl?.getExtension('WEBGL_debug_renderer_info');return d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):'unavailable'});
  // Wait for accepted city assets, not audio playback or optional candidates.
  await page.waitForFunction(office=>office?(Germany3D.officeAssetsReady??(Germany3D.amtCharacters.length===14&&Germany3D.amtCharacters.every(a=>a.loaded))):(Germany3D.startupReady===undefined?Germany3D.inspectAssets().buildings.every(b=>b.loaded)&&Object.keys(Germany3DBridge.npcSpriteGrids).every(k=>Germany3DBridge.getNpcSpriteCanvas(k)):Germany3D.startupReady&&Germany3DBridge.startupAssetsReady),!!process.env.BENCH_OFFICE,{timeout:120000});
  const loadedMs=await page.evaluate(()=>performance.now());
  if(process.env.BENCH_OFFICE)await page.waitForFunction(()=>Germany3D.amtCharacters.length===14&&Germany3D.amtCharacters.every(a=>a.loaded),null,{timeout:120000});
  await page.evaluate(()=>{window.__mutations={};new MutationObserver(records=>{for(const r of records){const key=(r.target.id||r.target.parentElement?.id||r.target.nodeName)+':'+(r.attributeName||r.type);__mutations[key]=(__mutations[key]||0)+1}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});const original=Germany3D.sync;window.__frames=[];Germany3D.sync=function(...args){const now=performance.now();__frames.push(now);return original.apply(this,args)}});
  async function sample(){await page.evaluate(()=>{__frames.length=0;__mutations={}});await page.waitForTimeout(3000);return page.evaluate(()=>{const frames=__frames.slice(),times=frames.slice(1).map((t,i)=>t-frames[i]).sort((a,b)=>a-b),assets=Germany3D.inspectAssets(),canvas=document.getElementById('world3d');return{syncCalls:frames.length,frameMs:{p50:times[Math.floor(times.length*.5)]||null,p95:times[Math.floor(times.length*.95)]||null},drawingBuffer:[canvas.width,canvas.height],render:assets.render,memory:assets.memory,mutations:__mutations}})}
  const intro=await sample(),startupResources=resources.slice(),startupAssets=await page.evaluate(()=>({models:Germany3D.startupStatus,characters:Germany3DBridge.characterAssetStatus,queue:Germany3DBridge.assetLoadStatus,office:Germany3D.officeAssetStatus}));
  if(!process.env.BENCH_OFFICE)await page.keyboard.press('s');await page.waitForTimeout(1000);
  // Invoke the existing Next control to dismiss welcome lines, including a
  // pending speech start. This is a debug shortcut, not natural mission proof.
  await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});
  await page.evaluate(office=>{
   const pose=()=>office?{x:BuergeramtLevel.view.x,y:BuergeramtLevel.view.yaw}:{x:Germany3DBridge.player.x,y:Germany3DBridge.player.y};
   window.__inputLatencies=[];window.__inputPending=null;
   window.__inputPose=pose;
   const sync=Germany3D.sync;Germany3D.sync=function(...args){const result=sync.apply(this,args);if(__inputPending){const p=pose();if(Math.hypot(p.x-__inputPending.before.x,p.y-__inputPending.before.y)>1e-6){__inputLatencies.push(performance.now()-__inputPending.at);__inputPending=null}}return result};
  },!!process.env.BENCH_OFFICE);
  const before=await page.evaluate(office=>office?{x:BuergeramtLevel.view.x,y:BuergeramtLevel.view.yaw}:{x:Germany3DBridge.player.x,y:Germany3DBridge.player.y},!!process.env.BENCH_OFFICE);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
  const after=await page.evaluate(office=>office?{x:BuergeramtLevel.view.x,y:BuergeramtLevel.view.yaw}:{x:Germany3DBridge.player.x,y:Germany3DBridge.player.y},!!process.env.BENCH_OFFICE);
  for(let i=0;i<8;i++){const key=i%2?'ArrowLeft':'ArrowRight';await page.keyboard.down(key);await page.waitForTimeout(45);await page.keyboard.up(key);await page.waitForTimeout(100)}
  const inputLatency=await page.evaluate(()=>{const times=__inputLatencies.toSorted((a,b)=>a-b);return{accepted:times.length,p50:times[Math.floor(times.length*.5)]||null,p95:times[Math.floor(times.length*.95)]||null}});
  if(process.env.BENCH_PROFILE)await cdp.send('Profiler.start');
  const gameplay=await sample();
  if(process.env.BENCH_PROFILE){const {profile}=await cdp.send('Profiler.stop');writeFileSync(resolve(output,`${name}-${run}.cpuprofile`),JSON.stringify(profile));const totals=new Map(),nodes=new Map(profile.nodes.map(n=>[n.id,n.callFrame]));profile.samples?.forEach((id,i)=>{const f=nodes.get(id),key=f.functionName+' @ '+f.url+':'+(f.lineNumber+1);totals.set(key,(totals.get(key)||0)+(profile.timeDeltas?.[i]||0))});console.log(JSON.stringify({name,run,cpuSelfMs:[...totals].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([fn,us])=>[fn,Math.round(us/1000)])}))}if(run===0)await page.screenshot({path:resolve(output,`${name}.png`)});
  const item={name,run,gpu,readyMs,loadedMs,startupBytes:startupResources.reduce((n,r)=>n+r.bytes,0),startupRequests:startupResources.length,startupAssets,inputLatency,largest:startupResources.toSorted((a,b)=>b.bytes-a.bytes).slice(0,12),intro,gameplay,moved:Math.hypot(after.x-before.x,after.y-before.y),longTasks:await page.evaluate(()=>__longTasks),errors};
  report.runs.push(item);console.log(JSON.stringify({...item,largest:undefined,longTasks:item.longTasks.length}));
  if(process.env.BENCH_CHECK){if(errors.length||!(item.moved>0)||inputLatency.accepted<8)throw Error(`${name}: browser errors or movement failed`);if(!process.env.BENCH_OFFICE&&item.startupBytes>18000000)throw Error(`${name}: startup exceeds 18 MB local transfer budget`);if(!process.env.BENCH_OFFICE&&intro.syncCalls>16)throw Error(`${name}: opening-screen render exceeds 4 Hz budget`);if(gameplay.drawingBuffer[0]*gameplay.drawingBuffer[1]>1600000)throw Error(`${name}: drawing buffer exceeds 1.6 MP`);if(!process.env.BENCH_OFFICE&&startupResources.some(r=>/intro-song\.mp3|\/sprite-sources\/|\.blend/.test(r.url)))throw Error(`${name}: deferred/authoring resource fetched at boot`)}
  await context.close();
 }
 writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({output,runs:report.runs.length,verdict:process.env.BENCH_CHECK?'PASS':'MEASURED'}));
}finally{await browser?.close();await new Promise(done=>server.close(done))}
