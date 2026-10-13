// Silent seeded integration checks. The real registration path is exercised in
// tests/jwd-home.test.mjs; these use a test seam for city entry and arrest setup.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.JWD_OUTPUT||'output/jwd-home/browser');mkdirSync(out,{recursive:true});
const files=['game.js','world3d.js'],report={revision:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),cases:[],limits:['Seeded city placement and allocation; actual E/button/movement inputs thereafter','Arrest contact is forced through the production update, not a complete chase','Muted Chromium desktop and Android emulation; no physical device or listening evidence']};
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));if(!file.startsWith(root+sep))throw Error('path');let content=readFileSync(file);if(file===resolve(root,'game.js'))content=content.toString().replace('function loop(now){','window.__jwdTest={state,player,jwd,npcs,keys,update,awardAnmeldung,arrestPlayer,updateJwd,interact,currentMission,home:buildings.find(b=>b.id==="jwd-home"),contact(){police.push({x:player.x+31,y:player.y,speed:0,barkAt:Infinity});state.wanted=1;state.wantedCooldown=30;state.policeContactCooldown=0;update(.01)}};function loop(now){');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,viewport,entry] of [['desktop',{width:1280,height:800},'index.html'],['android-portrait',{width:390,height:844},'index.html'],['android-landscape',{width:844,height:390},'index.html']]){
  const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'});context.setDefaultTimeout(60000);
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/${entry}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__jwdTest&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden);
  await page.evaluate(()=>{const h=__jwdTest;h.state.started=true;h.state.modal=false;h.state.voiceOn=false;h.state.mission=1;h.state.pettyAuditTimer=10000;h.awardAnmeldung();document.getElementById('intro').classList.add('hidden');document.body.classList.remove('preloading');Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+30});Germany3D.sync()});
  const interact=async()=>name==='desktop'?page.keyboard.press('e'):page.locator('[data-key="KeyE"]').count()?page.locator('[data-key="KeyE"]').click():page.keyboard.press('e');
  const finish=async()=>{for(let i=0;i<8&&await page.evaluate(()=>__jwdTest.state.dialogue);i++)await page.locator('#dialogue-next').click()};
  await interact();assert.equal(await page.evaluate(()=>__jwdTest.jwd.visited),true);await finish();
  for(const id of ['jwd-swabian','jwd-parent','jwd-watcher']){
   await page.evaluate(id=>{const h=__jwdTest,n=h.npcs.find(n=>n.id===id);h.jwd.exitPending=false;Object.assign(h.player,{x:n.x,y:n.y+42});Germany3D.sync()},id);
   await interact();assert.equal(await page.evaluate(()=>__jwdTest.state.dialogue),true);if(id==='jwd-parent')assert.match(await page.locator('#dialogue-text').innerText(),/Heiko/);
   await page.screenshot({path:resolve(out,`${name}-${id}.png`)});await finish();
  }
  assert.equal(await page.evaluate(()=>__jwdTest.currentMission().target),'hausverwaltung');
  await page.evaluate(()=>{const h=__jwdTest;Object.assign(h.player,{x:1500,y:4550});h.contact();h.jwd.burglarVisit=h.jwd.visit;Germany3D.sync()});
  assert.equal(await page.evaluate(()=>__jwdTest.state.wanted),0);assert.equal(await page.evaluate(()=>__jwdTest.jwd.exitPending),true);
  await page.screenshot({path:resolve(out,`${name}-home.png`)});
  await page.keyboard.down('d');await page.waitForFunction(()=>__jwdTest.state.dialogue);await page.keyboard.up('d');
  const departure=await page.locator('#dialogue-text').innerText();await finish();assert.equal(await page.evaluate(()=>__jwdTest.jwd.exitPending),false);
  const before=await page.evaluate(()=>__jwdTest.player.x);await page.keyboard.down('d');await page.waitForTimeout(550);await page.keyboard.up('d');assert.ok(await page.evaluate(x=>__jwdTest.player.x>x+20,before),'player leaves after acknowledged complaint');
  await page.evaluate(()=>{const h=__jwdTest;h.jwd.exitPending=false;h.jwd.visit=2;h.jwd.burglarVisit=0;Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+95})});
  await page.waitForFunction(()=>__jwdTest.state.dialogue&&__jwdTest.state.dialogueData.speaker.startsWith('EDE'));
  await page.screenshot({path:resolve(out,`${name}-burglar.png`)});await finish();
  await page.waitForFunction(()=>!__jwdTest.jwd.burglar);assert.equal(await page.evaluate(()=>__jwdTest.jwd.burglarVisit),2);
  const textChecks=[];
  if(name==='desktop')for(const [lang,zoom] of [['de',1],['en',2]]){
   await page.setViewportSize({width:320,height:700});await page.evaluate(([lang,zoom])=>{document.documentElement.style.zoom=String(zoom);const h=__jwdTest;h.state.lang=lang;h.state.subtitlesOn=lang==='en';h.jwd.exitPending=false;const n=h.npcs.find(n=>n.id==='jwd-parent');h.jwd.met.delete(n.id);Object.assign(h.player,{x:n.x,y:n.y+42})},[lang,zoom]);
   await page.keyboard.press('e');await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>document.querySelector('#dialogue-text').dataset.measurement==='pretext-0.0.9');
   const check=await page.evaluate(()=>{const box=document.getElementById('dialogue'),text=document.getElementById('dialogue-text');return {scrollWidth:box.scrollWidth,width:box.clientWidth,overflow:getComputedStyle(box).overflowY,fit:text.dataset.pretextFit,measurement:text.dataset.measurement,button:document.getElementById('dialogue-next').textContent}});assert.ok(check.scrollWidth<=check.width+2,'dialogue must reflow without horizontal clipping');textChecks.push({lang,zoom,...check});await page.screenshot({path:resolve(out,`narrow-${lang}-${zoom}.png`)});await finish();
  }
  const assets=await page.evaluate(()=>Germany3D.inspectAssets().jwd);assert.equal(assets.houses.length,3);assert.equal(assets.actors.length,3);assert.deepEqual(errors,[]);
  report.cases.push({name,entry,departure,assets,textChecks,errors});await context.close();console.log(JSON.stringify({name,verdict:'PASS'}));
 }
 report.complete=true;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(done=>server.close(done))}
