import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {installedPlaywright,chromiumExecutable,serveDirectory} from './browser-harness.mjs';
import {silenceBrowserAudio} from './browser-diagnostics.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'output/klein-korinthen');mkdirSync(out,{recursive:true});
const {chromium}=installedPlaywright(),server=await serveDirectory(root),browser=await chromium.launch({headless:true,executablePath:chromiumExecutable(chromium),args:['--mute-audio']});
const results=[];
try{
 for(const profile of [{id:'desktop',width:1440,height:900},{id:'portrait',width:390,height:844,mobile:true},{id:'landscape',width:844,height:390,mobile:true},{id:'reflow',width:320,height:640,mobile:true},{id:'large',width:1920,height:1080}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:!!profile.mobile,hasTouch:!!profile.mobile,deviceScaleFactor:1});await context.addInitScript(silenceBrowserAudio);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Explicit UI fixture: same controller at A0, with invitation already completed.
  let fixturePosition='x: -26, z: 35';
  await page.route('**/levels/klein-korinthen/content.mjs',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('x: -8, z: 45',fixturePosition)})});
  await context.addInitScript(()=>{if(!localStorage.getItem('gta-klein-korinthen-v1'))localStorage.setItem('gta-klein-korinthen-v1',JSON.stringify({version:2,stage:'patrol',permits:[],measured:[],reports:[]}))});
  await page.goto(server.url+'/labor/vereinigung-7f3c9d/');await page.waitForFunction(()=>window.__kleinKorinthen);
  await page.screenshot({path:out+'/'+profile.id+'-title.png'});await page.locator('#start').click();
  const states=[];
  async function inspect(name){await page.waitForTimeout(120);const info=await page.evaluate(()=>({fit:document.documentElement.dataset.textMeasurement,noFit:[...document.querySelectorAll('[data-fit-state="no-fit"]')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,text:e.innerText,width:e.clientWidth,height:e.clientHeight,lines:e.dataset.measuredLines,lineHeight:getComputedStyle(e).lineHeight})),overflow:[...document.querySelectorAll('dialog[open],button,[data-fit]')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id||e.textContent.slice(0,30)),pageOverflow:document.documentElement.scrollWidth>innerWidth+2}));states.push({name,...info});await page.screenshot({path:out+'/'+profile.id+'-'+name+'.png'});}
  await inspect('world');await page.locator('#map-button').click();await inspect('map');await page.keyboard.press('Escape');await page.locator('#ledger-button').click();await inspect('ledger');await page.keyboard.press('Escape');await page.locator('#menu-button').click();await inspect('settings');await page.keyboard.press('Escape');
  await page.keyboard.press('e');await page.locator('#paperwork').waitFor({state:'visible'});await inspect('form-question');
  await page.locator('[data-choice="hilfe"]').click();await inspect('form-rejected');await page.locator('[data-choice="feststellung"]').click();await inspect('form-accepted');await page.locator('#form-close').click();
  for(const fixture of [{id:'E31',position:'x: -8, z: 26.7',answer:'genehmigung',permits:['A0'],reports:[]},{id:'C5',position:'x: 12, z: 40.5',answer:'vollstaendig',permits:['A0','E31'],reports:['kk-01','kk-03','kk-04','kk-06','kk-07']}]){
    fixturePosition=fixture.position;await page.evaluate(f=>localStorage.setItem('gta-klein-korinthen-v1',JSON.stringify({version:2,stage:f.reports.length?'return':'patrol',permits:f.permits,measured:f.reports,reports:f.reports})),fixture);
    await page.reload();await page.waitForFunction(()=>window.__kleinKorinthen);await page.locator('#start').click();await page.waitForTimeout(150);await page.keyboard.press('e');await page.locator('#paperwork').waitFor({state:'visible'});await inspect(fixture.id+'-question');
    assert.ok(await page.locator('#paperwork').evaluate(d=>d.scrollHeight<=d.clientHeight+2),'Form actions must fit the supported viewport');
    assert.equal(await page.evaluate(()=>document.activeElement?.dataset.choice),await page.locator('#form-choices button').first().getAttribute('data-choice'));
    await page.locator('#form-choices button').first().click();await inspect(fixture.id+'-rejected');await page.locator(`[data-choice="${fixture.answer}"]`).click();await inspect(fixture.id+'-accepted');await page.locator('#form-close').click();
  }
  // Scripted long-caption layout fixture; natural dialogue/voice ownership is tested separately.
  await page.evaluate(async()=>{const {LINES,CAST}=await import('/levels/klein-korinthen/content.mjs'),line=LINES.finalAudit,actor=CAST[line.speaker];for(const[id,value]of Object.entries({'spoken':line.de,'translation':line.en,'speaker-name':actor.name,'speaker-role':actor.role}))document.getElementById(id).textContent=value;document.getElementById('conversation').showModal();document.getElementById('conversation').scrollTop=0});await inspect('long-dialogue-fixture');await page.keyboard.press('Escape');
  if(profile.id==='desktop'){await page.evaluate(()=>document.documentElement.style.fontSize='36px');await page.locator('#menu-button').click();await inspect('text-200');await page.keyboard.press('Escape');await page.keyboard.press('e');await inspect('form-text-200');await page.keyboard.press('Escape')}
  results.push({profile:profile.id,errors,states});await context.close();
 }
 // Host integration: real iframe handshake, settings, pause/resume, removal and clean remount.
 const context=await browser.newContext({viewport:{width:1200,height:800}});await context.addInitScript(silenceBrowserAudio);const page=await context.newPage();
 await page.route('**/integration-host',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0"><div id="host" style="height:100vh"></div></body></html>'}));
 await page.goto(server.url+'/integration-host');
 await page.evaluate(async()=>{const {mountKleinKorinthen}=await import('/levels/klein-korinthen/adapter.mjs');window.hostMount=mountKleinKorinthen;window.level=mountKleinKorinthen({container:document.getElementById('host'),settings:{audio:false,englishSubtitles:false}});await window.level.ready});
 let frame=page.frames().find(f=>f.url().includes('embedded=1'));assert.ok(frame);assert.equal(await frame.locator('#audio-enabled').isChecked(),false);
 await frame.locator('#start').click();await page.evaluate(()=>window.level.pause());await page.waitForTimeout(100);assert.equal((await frame.evaluate(()=>window.__kleinKorinthen.snapshot())).paused,true);
 await page.evaluate(()=>window.level.resume());await page.waitForTimeout(100);assert.equal((await frame.evaluate(()=>window.__kleinKorinthen.snapshot())).paused,false);
 await page.evaluate(()=>window.level.dispose());assert.equal(page.frames().length,1);
 await page.evaluate(async()=>{window.level=window.hostMount({container:document.getElementById('host'),state:{version:1,stage:'patrol',measured:[],reports:[],mistakes:0},settings:{audio:false}});await window.level.ready});
 frame=page.frames().find(f=>f.url().includes('embedded=1'));assert.equal((await frame.evaluate(()=>window.__kleinKorinthen.snapshot())).state.stage,'patrol');await page.evaluate(()=>window.level.dispose());await context.close();
 results.push({integration:'PASS',checks:['mount handshake','audio/subtitle settings','pause','resume','dispose','remount with host state']});
 writeFileSync(out+'/ui-matrix.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 assert.ok(results.filter(r=>r.profile).every(r=>!r.errors.length&&r.states.every(s=>!s.overflow.length&&!s.pageOverflow)),'Rendered UI overflow or errors');
}finally{await browser.close();await server.close()}
