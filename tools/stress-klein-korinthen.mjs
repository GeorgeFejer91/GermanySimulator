import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {installedPlaywright,chromiumExecutable,serveDirectory} from './browser-harness.mjs';
import {silenceBrowserAudio} from './browser-diagnostics.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'output/klein-korinthen');mkdirSync(out,{recursive:true});
const {chromium}=installedPlaywright(),server=await serveDirectory(root),browser=await chromium.launch({headless:true,executablePath:chromiumExecutable(chromium),args:['--mute-audio']});
const report={mode:'silent Chromium desktop; synthetic UI fixtures and real input',checks:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800}});await context.addInitScript(silenceBrowserAudio);
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/stress-host',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body style="margin:0"><div id="host" style="height:100vh"></div>'}));
 await page.goto(server.url+'/stress-host');
 await page.evaluate(async()=>{window.mount=(await import('/levels/klein-korinthen/adapter.mjs')).mountKleinKorinthen;window.events=[]});
 const resources=[],inputLatency=[];
 for(let i=0;i<15;i++){
   await page.evaluate(async()=>{window.visit=window.mount({container:document.getElementById('host'),settings:{audio:true},onComplete:e=>window.events.push(e)});await window.visit.ready});
   const frame=page.frames().find(f=>f.url().includes('embedded=1'));assert.ok(frame);await frame.locator('#start').click();await page.waitForTimeout(1200);
   const snap=()=>frame.evaluate(()=>window.__kleinKorinthen.snapshot()),before=await snap();
   // Pause must clear held keys; resuming must not resurrect a missing key-up.
   await page.keyboard.down('w');await page.waitForTimeout(100);await page.evaluate(()=>window.visit.pause());await page.waitForTimeout(120);const stopped=await snap();
   await page.waitForTimeout(100);assert.deepEqual((await snap()).player,stopped.player);assert.equal((await snap()).stats.frames,stopped.stats.frames);
   await page.evaluate(()=>window.visit.resume());await page.waitForTimeout(120);assert.deepEqual((await snap()).player,stopped.player);await page.keyboard.up('w');
   // Modal churn and resize exercise bounded labels, input cancellation and GPU owners.
   for(let j=0;j<8;j++){await frame.evaluate(()=>{window.inputFrame=null;document.addEventListener('click',()=>{const start=performance.now();requestAnimationFrame(()=>window.inputFrame=performance.now()-start)},{once:true,capture:true})});await frame.locator(j%2?'#ledger-button':'#map-button').click();await frame.waitForFunction(()=>window.inputFrame!==null);inputLatency.push(await frame.evaluate(()=>window.inputFrame));await page.keyboard.press('Escape')}
   await page.setViewportSize(i%2?{width:1280,height:800}:{width:390,height:844});await page.waitForTimeout(150);
   const after=await snap();assert.equal(after.paused,false);assert.equal(after.dialogs.length,0);assert.deepEqual(after.state,before.state);assert.ok(after.drawCalls<65);assert.ok(after.triangles<120000);
   resources.push({profile:i%2?'portrait-start':'desktop-start',before:before.stats.resources,after:after.stats.resources});report.resources=resources;assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
   await page.evaluate(()=>{window.visit.dispose();window.visit.dispose()});assert.equal(page.frames().length,1);assert.equal(await page.locator('iframe').count(),0);
 }
 // Compare the same spawn and viewport: Three uploads visible labels lazily, so
 // unlike-for-unlike viewport counts are not evidence of resource retention.
 for(const profile of ['portrait-start','desktop-start']){const group=resources.filter(r=>r.profile===profile);for(const r of group)assert.deepEqual(r.before,group[0].before)}
 assert.ok(resources.every(r=>r.after.geometries<80&&r.after.textures<40&&r.after.programs<8));
 inputLatency.sort((a,b)=>a-b);const inputP95=inputLatency[Math.floor(inputLatency.length*.95)];assert.ok(inputP95<=200);report.input={samples:inputLatency.length,p95Ms:inputP95,maxMs:Math.max(...inputLatency),scope:'actual menu click to next rendered frame; lab'};
 assert.equal(await page.evaluate(()=>window.events.length),0);report.checks.push({name:'15 mount/pause/held-key/resume/16-modal-actions/resize/dispose cycles',verdict:'PASS',resources});
 await page.evaluate(async()=>{const early=window.mount({container:document.getElementById('host')});early.dispose();try{await early.ready;throw Error('unexpected ready')}catch(e){if(e.name!=='AbortError')throw e}});
 report.checks.push({name:'dispose before initialization rejects ready and removes iframe',verdict:'PASS'});
 // Corrupt standalone storage must recover to arrival, with no reward.
 await context.addInitScript(()=>localStorage.setItem('gta-klein-korinthen-v1','{broken'));
 await page.goto(server.url+'/labor/vereinigung-7f3c9d/');await page.waitForFunction(()=>window.__kleinKorinthen);assert.equal(await page.evaluate(()=>window.__kleinKorinthen.snapshot().state.stage),'arrival');
 const titleStart=await page.evaluate(()=>window.__kleinKorinthen.snapshot().stats.frames);await page.waitForTimeout(760);const titleFrames=await page.evaluate(()=>window.__kleinKorinthen.snapshot().stats.frames)-titleStart;assert.ok(titleFrames<=4);report.checks.push({name:'title render throttling',verdict:'PASS',titleFrames,durationMs:760});await page.locator('#start').click();
 report.renderer=await page.evaluate(()=>{const canvas=document.getElementById('world'),gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info');return{vendor:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),width:canvas.width,height:canvas.height}});assert.ok(report.renderer.width*report.renderer.height<=1600000);
 const intervals=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();function tick(now){samples.push(now-last);last=now;if(samples.length<180)requestAnimationFrame(tick);else resolve(samples.slice(10))}requestAnimationFrame(tick)}));
 intervals.sort((a,b)=>a-b);const p95=intervals[Math.floor(intervals.length*.95)];assert.ok(p95<50,`p95 ${p95} ms exceeds 20 fps lab regression floor`);
 report.checks.push({name:'corrupt save recovery and 170 steady frame intervals',verdict:'PASS',p50Ms:intervals[Math.floor(intervals.length*.5)],p95Ms:p95,maxMs:Math.max(...intervals),thresholdP95Ms:50,scope:'local lab regression; not physical Android or field performance'});
 assert.deepEqual(report.errors,[]);report.verdict='PASS';await context.close();
}catch(error){report.verdict='FAIL';report.failure=error.stack;throw error}
finally{writeFileSync(out+'/stress.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();await server.close()}
