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
const server=createServer((req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));if(!file.startsWith(root+sep))throw Error('path');let content=readFileSync(file);if(file===resolve(root,'game.js'))content=content.toString().replace('function loop(now){','window.__jwdTest={state,player,jwd,npcs,keys,update,awardAnmeldung,arrestPlayer,updateJwd,interact,currentMission,lane:jwdLane,rich:buildings.find(b=>b.id==="jwd-kranz"),home:buildings.find(b=>b.id==="jwd-home"),contact(){police.push({x:player.x+31,y:player.y,speed:0,barkAt:Infinity});state.wanted=1;state.wantedCooldown=30;state.policeContactCooldown=0;update(.01)}};function loop(now){');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,viewport,entry] of [['desktop',{width:1280,height:800},'index.html'],['android-portrait',{width:390,height:844},'index.html'],['android-landscape',{width:844,height:390},'index.html']]){
  if(process.env.JWD_PROFILE&&name!==process.env.JWD_PROFILE)continue;
  console.log(name+': start');
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
  const occupiedDoor=await page.evaluate(async()=>{
   const h=__jwdTest;h.state.modal=true;h.jwd.exitPending=false;h.jwd.burglarVisit=h.jwd.visit;
   Object.assign(h.player,{x:h.rich.doorX,y:h.rich.doorY+35});
   const thief={id:'jwd-burglar',name:'EDE',jwdRole:'burglar',phase:'retreat',x:h.player.x-90,y:h.player.y,vx:0,vy:0,routeBounds:h.lane};h.npcs.push(thief);h.jwd.burglar=thief;
   for(let i=0;i<90;i++){h.updateJwd(1/60);Germany3D.sync();await new Promise(requestAnimationFrame)}
   const before=[thief.x,thief.y];for(let i=0;i<60;i++){h.updateJwd(1/60);Germany3D.sync();await new Promise(requestAnimationFrame)}
   const after=[thief.x,thief.y],swing=Germany3D.inspectAssets().jwd.actors.find(n=>n.role==='burglar').swing;
   h.player.y+=90;for(let i=0;i<180&&h.jwd.burglar;i++){h.updateJwd(1/60);Germany3D.sync();await new Promise(requestAnimationFrame)}
   h.state.modal=false;return {before,after,swing,departed:!h.jwd.burglar};
  });assert.deepEqual(occupiedDoor.before,occupiedDoor.after);assert.ok(Math.abs(occupiedDoor.swing)<.001);assert.ok(occupiedDoor.departed);
  const sweeps=[];
  if(name==='desktop')for(const speed of [190,380])sweeps.push(await page.evaluate(async speed=>{
   const h=__jwdTest,b=h.home;h.state.modal=true;h.jwd.exitPending=false;h.player.y=b.y-24;h.player.x=b.x-260;
   const trace=[];for(let i=0;i<Math.ceil((b.w+520)/speed*60);i++){h.player.x+=speed/60;Germany3D.sync();trace.push(Germany3D.inspectAssets().jwd.houses.find(n=>n.id===b.id).opacity);await new Promise(requestAnimationFrame)}
   for(let i=0;i<60;i++){Germany3D.sync();await new Promise(requestAnimationFrame)}
   const restored=Germany3D.inspectAssets().jwd.houses.find(n=>n.id===b.id).opacity;h.state.modal=false;return {speed,min:Math.min(...trace),restored,trace};
  },speed));for(const sweep of sweeps){assert.ok(sweep.min<.1);assert.ok(sweep.restored>.99)}
  const textChecks=[];
  if(name==='desktop')for(const [lang,zoom] of [['de',1],['en',2]]){
   await page.setViewportSize({width:320,height:700});await page.evaluate(([lang,zoom])=>{document.documentElement.style.zoom=String(zoom);const h=__jwdTest;h.state.lang=lang;h.state.subtitlesOn=lang==='en';h.jwd.exitPending=false;const n=h.npcs.find(n=>n.id==='jwd-parent');h.jwd.met.delete(n.id);Object.assign(h.player,{x:n.x,y:n.y+42})},[lang,zoom]);
   await page.keyboard.press('e');await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>document.querySelector('#english-subtitle').dataset.measurement==='pretext-0.0.9'&&!document.querySelector('#english-subtitle').hidden);
   const check=await page.evaluate(()=>{const box=document.getElementById('english-subtitle'),dialogue=document.getElementById('dialogue');return {actionsWidth:dialogue.clientWidth,actionsScroll:dialogue.scrollWidth,scrollWidth:box.scrollWidth,width:box.clientWidth,height:box.clientHeight,scrollHeight:box.scrollHeight,fit:box.dataset.fit,measurement:box.dataset.measurement,lang:box.lang,text:box.textContent}});assert.ok(check.scrollWidth<=check.width+2,'caption must reflow without horizontal clipping');assert.ok(check.actionsScroll<=check.actionsWidth+2,'dialogue actions stay inside the enlarged viewport');assert.equal(check.lang,lang);textChecks.push({lang,zoom,...check});await page.screenshot({path:resolve(out,`narrow-${lang}-${zoom}.png`)});await finish();

  }
  const assets=await page.evaluate(()=>Germany3D.inspectAssets().jwd);assert.equal(assets.houses.length,6);assert.equal(assets.actors.length,3);assert.deepEqual(errors,[]);
  report.cases.push({name,entry,departure,assets,occupiedDoor,sweeps,textChecks,errors});await context.close();console.log(JSON.stringify({name,verdict:'PASS'}));
 }
 report.complete=true;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));server.closeAllConnections();await browser?.close();await new Promise(done=>server.close(done))}
