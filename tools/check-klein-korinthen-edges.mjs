import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {installedPlaywright,chromiumExecutable,serveDirectory} from './browser-harness.mjs';
import {silenceBrowserAudio} from './browser-diagnostics.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'output/klein-korinthen');
const {chromium}=installedPlaywright(),server=await serveDirectory(root),browser=await chromium.launch({headless:true,executablePath:chromiumExecutable(chromium),args:['--mute-audio']});
const results=[];
try{
 for(const mode of ['touch','voice','missing-audio','missing-pretext','missing-world']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await context.addInitScript(silenceBrowserAudio);
  if(mode==='missing-audio')await context.route('**/voices/*.mp3',r=>r.abort());
  if(mode==='missing-pretext')await context.route('**/pretext/dist/layout.js',r=>r.abort());
  if(mode==='missing-world')await context.route('**/klein-korinthen/world.mjs',r=>r.abort());
  const page=await context.newPage();await page.goto(server.url+'/labor/vereinigung-7f3c9d/');await page.waitForFunction(()=>window.__kleinKorinthen);
  if(mode==='missing-world'){assert.equal(await page.locator('#start').isDisabled(),true);assert.match(await page.locator('#loading').innerText(),/konnte nicht starten/);}
  else{
   await page.locator('#start').tap();const snap=()=>page.evaluate(()=>window.__kleinKorinthen.snapshot());
   if(mode==='touch'){
    const client=await context.newCDPSession(page),r=await page.locator('#stick').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2,before=await snap();
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-32,id:0}]});await page.waitForTimeout(650);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const moved=await snap();assert.ok(moved.player.z<before.player.z-.5);await page.waitForTimeout(180);assert.ok(Math.abs((await snap()).player.z-moved.player.z)<.05);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:450,id:0}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:350,y:450,id:0}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(Math.abs((await snap()).player.yaw-before.player.yaw)>.1);
    await client.detach();await page.waitForTimeout(500);await page.locator('#map-button').tap();await page.locator('#map-dialog').waitFor({state:'visible',timeout:3000});
   }else if(mode==='missing-pretext'){await page.locator('#menu-button').tap();assert.equal(await page.evaluate(()=>document.documentElement.dataset.textMeasurement),'unavailable');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
   else{
    await page.keyboard.down('a');await page.waitForTimeout(320);await page.keyboard.up('a');await page.keyboard.down('w');await page.waitForTimeout(2500);await page.keyboard.up('w');await page.locator('#interact').tap();
    await page.locator('#conversation').waitFor({state:'visible'});assert.ok((await page.locator('#spoken').innerText()).length>20);
    if(mode==='missing-audio')await page.waitForFunction(()=>/nicht verfügbar|gesperrt/.test(document.getElementById('voice-status').textContent));
    else{await page.waitForFunction(()=>window.__kleinKorinthen.snapshot().stats.voiceEnds>=1,{},{timeout:20000});assert.equal((await snap()).stats.voiceStarts,1);}
    await page.keyboard.press('Escape');assert.equal((await snap()).voice.playing,false);assert.equal((await snap()).state.stage,'patrol');
   }
  }
  results.push({mode,verdict:'PASS'});await context.close();
 }
 writeFileSync(out+'/edge-cases.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await server.close()}
