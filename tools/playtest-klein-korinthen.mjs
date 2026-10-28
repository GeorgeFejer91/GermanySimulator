import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {installedPlaywright,chromiumExecutable,serveDirectory} from './browser-harness.mjs';
import {silenceBrowserAudio} from './browser-diagnostics.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'output/klein-korinthen');mkdirSync(out,{recursive:true});
const {chromium}=installedPlaywright(),server=await serveDirectory(root);
const browser=await chromium.launch({headless:true,executablePath:chromiumExecutable(chromium),args:['--mute-audio','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});await context.addInitScript(silenceBrowserAudio);
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
const snapshot=()=>page.evaluate(()=>window.__kleinKorinthen.snapshot());
try{
  await page.goto(server.url+'/labor/vereinigung-7f3c9d/');await page.waitForFunction(()=>window.__kleinKorinthen);await page.waitForTimeout(1500);
  await page.screenshot({path:out+'/title.png'});await page.locator('#start').click();await page.waitForTimeout(600);await page.screenshot({path:out+'/arrival.png'});
  const initial=await snapshot();console.log(JSON.stringify({phase:'startup',state:initial.state,drawCalls:initial.drawCalls,triangles:initial.triangles,errors}));
  if(process.argv.includes('--smoke'))process.exitCode=errors.length?1:0;
  else{
    // World-space waypoints are reached only with real keyboard motion.
    async function walk(x,z){
      for(let i=0;i<350;i++){
        const p=(await snapshot()).player,dx=x-p.x,dz=z-p.z;if(Math.hypot(dx,dz)<.42)return;
        const forward=-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz,side=Math.cos(p.yaw)*dx-Math.sin(p.yaw)*dz;
        const held=['Shift'];if(Math.abs(forward)>.08)held.push(forward>0?'w':'s');if(Math.abs(side)>.08)held.push(side>0?'d':'a');
        for(const k of held)await page.keyboard.down(k);await page.waitForTimeout(Math.min(180,Math.max(45,Math.hypot(dx,dz)*160)));for(const k of held)await page.keyboard.up(k);
      }throw Error(`Could not walk to ${x},${z}: ${JSON.stringify((await snapshot()).player)}`);
    }
    async function dialogue(){for(let i=0;i<8&&await page.locator('#conversation').isVisible();i++)await page.locator('#dialogue-next').click();}
    await walk(-9,37);await page.keyboard.press('e');await dialogue();assert.equal((await snapshot()).state.stage,'patrol');
    await page.screenshot({path:out+'/joined.png'});
    async function measure(id,point){await walk(...point);await page.keyboard.press('e');await page.locator('#evidence').waitFor({state:'visible'});assert.equal((await snapshot()).state.measured.includes(id),true);console.log('Measured '+id);}
    await walk(-6,30);await measure('kk-01',[-5.3,26]);await page.screenshot({path:out+'/measurement.png'});await page.locator('#file-report').click();
    await walk(-5.3,20);await walk(5.3,20);await measure('kk-02',[5.3,15]);await page.locator('#file-report').click();assert.equal((await snapshot()).state.reports.length,1);assert.equal((await snapshot()).state.mistakes,1);
    await walk(5.3,8);await walk(-5.3,8);await measure('kk-03',[-5.3,1]);await page.locator('#file-report').click();
    await walk(-5.3,-10);await walk(5.3,-10);await measure('kk-04',[5.3,-18]);await page.locator('#file-report').click();await dialogue();
    await walk(5.3,-51.5);await walk(47,-51.5);await measure('kk-09',[47,-20]);await page.locator('#file-report').click();
    await measure('kk-07',[47,17]);await page.locator('#file-report').click();await dialogue();assert.equal((await snapshot()).state.stage,'return');
    await walk(47,52.5);await walk(-12,52.5);await walk(-12,40);await walk(-9,33);await walk(-18,33);await page.keyboard.press('e');await dialogue();await page.locator('#certificate').waitFor({state:'visible'});assert.equal((await snapshot()).state.stage,'member');
    await page.screenshot({path:out+'/certificate.png'});await page.locator('#continue').click();await dialogue();
    await page.reload();await page.waitForFunction(()=>window.__kleinKorinthen);assert.equal((await snapshot()).state.stage,'member');
    assert.deepEqual(errors,[]);writeFileSync(out+'/natural-flow.json',JSON.stringify({verdict:'PASS',snapshot:await snapshot(),errors},null,2));console.log('PASS natural keyboard mission, legal rejection, graduation and reload');
  }
}catch(error){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});writeFileSync(out+'/failure.json',JSON.stringify({error:error.stack,snapshot:await snapshot().catch(()=>null),errors},null,2));throw error}
finally{await context.close();await browser.close();await server.close()}
