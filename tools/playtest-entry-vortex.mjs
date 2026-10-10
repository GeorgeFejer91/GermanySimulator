// Isolated silent browser proof. Relocation/clock seams are test-server-only.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),baseline=process.env.ENTRY_BASELINE==='1',out=resolve(process.env.ENTRY_OUTPUT||`output/entry-vortex/${baseline?'baseline-browser':'browser'}`);mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary'};
const source=file=>baseline&&['game.js','world3d.js'].includes(file)?readFileSync(resolve('output/entry-vortex/baseline',file)):readFileSync(resolve(file));
const server=createServer((req,res)=>{try{
  const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!file.startsWith(root+sep))throw Error('path');
  let data=source(file.slice(root.length+1));
  if(file===resolve(root,'game.js'))data=data.toString().replace('window.Germany3DBridge={','window.__entryState=state;window.Germany3DBridge={');
  if(!baseline&&file===resolve(root,'world3d.js'))data=data.toString().replace('  app.classList.add("three-ready");','  window.__entryStep=dt=>{entryLastTime=performance.now()-dt*1000;Germany3D.sync()};app.classList.add("three-ready");');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={baseline,revision:Object.fromEntries(['game.js','world3d.js','buergeramt-entry.js'].map(f=>[f,createHash('sha256').update(source(f)).digest('hex')])),cases:[],limits:['Forced city entrance placement; real keyboard/touch entry, no complete natural mission-chain proof','Android emulation; no physical Android','Media, WebAudio and speech muted before navigation; no listening claim']};
try{
  const cases=baseline?[['desktop',1280,800],['android-portrait',390,844]]:[['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['reduced-motion',1280,800],['fallback',1280,800],['module-failure',1280,800],['diagnostic',1280,800]];
  for(const [name,width,height] of cases){
    if(process.env.ENTRY_CASE&&name!==process.env.ENTRY_CASE)continue;
    const mobile=name.startsWith('android'),context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2,reducedMotion:name==='reduced-motion'?'reduce':'no-preference'});
    await context.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
      speechSynthesis.speak=u=>{u.volume=0;u.onstart?.();u.onend?.()};
      window.__entryFrames=[];window.__entryLongTasks=[];
      new PerformanceObserver(list=>__entryLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask'});
    });
    const page=await context.newPage(),errors=[],warnings=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')warnings.push(m.text())});
    if(name==='fallback')await page.route('**/city-kit/municipal-office.glb*',route=>route.abort());
    if(name==='module-failure')await page.route('**/buergeramt-entry.js*',route=>route.abort());
    const boot=Date.now();await page.goto(`http://127.0.0.1:${server.address().port}/${name==='diagnostic'?'3d.html':'index.html'}`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.Germany3D?.startupReady&&(Germany3DBridge.startupAssetsReady??true),null,{timeout:120000});
    const readyMs=Date.now()-boot;
    if(name==='diagnostic'){
      await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='buergeramt');Germany3DBridge.player.x=b.doorX;Germany3DBridge.player.y=b.doorY+35;Germany3D.sync()});
      await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.nearbyAssetsReady},null,{timeout:120000});
      const capture=await page.evaluate(()=>{window.__entrySync=Germany3D.sync;Germany3D.sync=()=>{};window.__diagnosticDone=0;Germany3D.enterBuergeramt(()=>__diagnosticDone++);for(let i=0;i<56;i++){Germany3D.sync=__entrySync;__entryStep(.025);Germany3D.sync=()=>{}}return Germany3D.amtEntry});
      assert.equal(capture.active,true);await page.screenshot({path:resolve(out,'diagnostic-spiral.png')});
      await page.evaluate(()=>{for(let i=0;i<100&&Germany3D.amtEntry.active;i++){Germany3D.sync=__entrySync;__entryStep(.025);Germany3D.sync=()=>{}}Germany3D.sync=__entrySync});
      assert.equal(await page.evaluate(()=>__diagnosticDone),1);assert.equal(await page.evaluate(()=>Germany3D.amtEntry.active),false);assert.deepEqual(errors,[]);
      report.cases.push({name,verdict:'PASS',readyMs,capture,errors,warnings,driver:'Shared renderer effect called directly; diagnostic has no office episode'});console.log(name,'PASS');await context.close();continue;
    }
    if(name!=='diagnostic'){await page.keyboard.press('s');await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click()});}
    await page.evaluate(()=>{
      const b=Germany3DBridge.buildings.find(b=>b.id==='buergeramt');Germany3DBridge.player.x=b.doorX;Germany3DBridge.player.y=b.doorY+35;Germany3D.sync();Germany3D.prepareOfficeAssets();
    });
    await page.waitForFunction(()=>Germany3D.officeAssetsReady&&Germany3D.nearbyAssetsReady,null,{timeout:120000});
    const before=await page.evaluate(()=>({assets:Germany3D.inspectAssets(),player:{x:Germany3DBridge.player.x,y:Germany3DBridge.player.y},mission:__entryState.mission}));
    const gpu=await page.evaluate(()=>{const gl=document.getElementById('world3d').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'});
    await page.screenshot({path:resolve(out,name+'-before.png')});
    const captures=[];
    for(let repeat=0;repeat<(baseline||name==='module-failure'||name==='reduced-motion'?1:3);repeat++){
      // Step the exact same production renderer for phase captures on visit one.
      if(!baseline&&name!=='module-failure')await page.evaluate(()=>{window.__entrySync=Germany3D.sync;Germany3D.sync=()=>{}});
      const start=Date.now();
      if(mobile)await page.locator('.control-dock [data-key="KeyE"]').tap();else await page.keyboard.press('e');
      if(!baseline&&name!=='module-failure'){
        await page.waitForFunction(()=>Germany3D.amtEntry.active,null,{timeout:15000});
        assert.equal(await page.evaluate(()=>BuergeramtLevel.active),false);
        await page.evaluate(()=>{Germany3D.sync=__entrySync});
        if(repeat>0)await page.evaluate(()=>{window.__entryFrames=[];window.__entryCosts=[];Germany3D.sync=function(){const start=performance.now();if(Germany3D.amtEntry.active)__entryFrames.push(start);__entrySync();__entryCosts.push(performance.now()-start)}});
        if(repeat===0){
          await page.evaluate(()=>{Germany3D.sync=()=>{}});
          for(const [label,seconds] of (name==='reduced-motion'?[['fade',.1]]:[['dissolve',.65],['spiral',.75],['collapse',1.05]])){
            const capture=await page.evaluate(seconds=>{for(let t=0;t<seconds;t+=.025){Germany3D.sync=__entrySync;__entryStep(Math.min(.025,seconds-t));Germany3D.sync=()=>{}}return Germany3D.amtEntry},seconds);
            assert.equal(capture.active,true);assert.ok(capture.captureBytes<=8*960*960);assert.ok(capture.splats<=18500);
            if(before.assets.doorRadiance)assert.ok(capture.door.every((v,i)=>Math.abs(v-before.assets.doorRadiance.position[i])<1e-8),'vortex matches the visible doorway center');
            captures.push({label,...capture});await page.screenshot({path:resolve(out,name+'-'+label+'.png')});
          }
          // Resize the live frozen view; hidden time must never advance it.
          await page.setViewportSize({width:height,height:width});
          await page.waitForFunction(size=>innerWidth===size.width&&innerHeight===size.height,{width:height,height:width});
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          await page.evaluate(()=>{Germany3D.sync=__entrySync;__entryStep(0);Germany3D.sync=()=>{}});
          await page.screenshot({path:resolve(out,name+'-resized.png')});
          await page.setViewportSize({width,height});
          const at=await page.evaluate(()=>Germany3D.amtEntry.elapsed);
          await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Germany3D.sync=__entrySync;__entryStep(20)});
          assert.equal(await page.evaluate(()=>Germany3D.amtEntry.elapsed),at);
          await page.evaluate(()=>{delete document.hidden;dispatchEvent(new Event('visibilitychange'));Germany3D.sync=__entrySync});
        }
      }
      await page.waitForFunction(()=>BuergeramtLevel.active,null,{timeout:20000}).catch(async error=>{
        report.failedCase={name,repeat,errors,warnings,state:await page.evaluate(()=>({entry:Germany3D.amtEntry,office:BuergeramtLevel.active,stage:BuergeramtLevel.stage,hidden:document.hidden,modal:__entryState.modal,started:__entryState.started,syncRestored:Germany3D.sync===window.__entrySync}))};
        await page.screenshot({path:resolve(out,name+'-failed.png')});throw error;
      });
      if(!baseline&&name!=='module-failure')await page.evaluate(()=>{Germany3D.sync=__entrySync});
      const entryMs=Date.now()-start;
      assert.equal(await page.evaluate(()=>BuergeramtLevel.stage),'outside');
      assert.equal(await page.evaluate(()=>Germany3D.amtEntry?.active||false),false);
      assert.equal(await page.evaluate(()=>__entryState.mission),before.mission);
      // Check the real office movement control after the transition completes.
      const z=await page.evaluate(()=>BuergeramtLevel.view.z);
      if(mobile&&width<700){const box=await page.locator('[data-amt-key="KeyW"]').boundingBox(),cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await page.waitForFunction(z=>BuergeramtLevel.view.z<z,z,{timeout:10000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
      else{await page.keyboard.down('w');await page.waitForFunction(z=>BuergeramtLevel.view.z<z,z,{timeout:10000});await page.keyboard.up('w');}
      assert.ok(await page.evaluate(z=>BuergeramtLevel.view.z<z,z));
      await page.screenshot({path:resolve(out,name+`-office-${repeat}.png`)});
      await page.locator('#amt-leave').click();await page.waitForTimeout(120);
      const after=await page.evaluate(()=>({assets:Germany3D.inspectAssets(),player:{x:Germany3DBridge.player.x,y:Germany3DBridge.player.y},entry:Germany3D.amtEntry}));
      assert.deepEqual(after.player,before.player);
      const frames=repeat>0?await page.evaluate(()=>{
        const times=__entryFrames.slice(1).map((t,i)=>t-__entryFrames[i]).sort((a,b)=>a-b),costs=__entryCosts.slice().sort((a,b)=>a-b);
        const percentile=(values,p)=>values[Math.min(values.length-1,Math.floor(values.length*p))]??null;
        return {count:times.length,p50:percentile(times,.5),p95:percentile(times,.95),cpuP95:percentile(costs,.95)};
      }):null;
      captures.push({repeat,entryMs,after,frames});
    }
    if(!baseline&&name==='desktop'){
      await page.evaluate(()=>{Germany3D.sync=()=>{}});await page.keyboard.press('e');
      assert.equal(await page.evaluate(()=>Germany3D.amtEntry.active),true);
      const restored=await page.evaluate(()=>{
        dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
        const released=!Germany3D.amtEntry.active&&!BuergeramtLevel.active;
        dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));Germany3D.sync=__entrySync;
        return {released,office:BuergeramtLevel.active,stage:BuergeramtLevel.stage};
      });
      assert.deepEqual(restored,{released:true,office:true,stage:'outside'});captures.push({restored});
      await page.locator('#amt-leave').click();
    }
    if(name!=='module-failure')assert.deepEqual(warnings.filter(w=>/shader|WebGL|GL_INVALID/i.test(w)),[]);
    assert.deepEqual(errors,[]);
    const result={name,verdict:'PASS',readyMs,gpu,before,captures,errors,warnings};report.cases.push(result);console.log(name,'PASS',readyMs+'ms ready');await context.close();
  }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
