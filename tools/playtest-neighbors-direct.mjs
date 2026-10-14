import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/neighbors-direct');mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{
 const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
 if(!file.startsWith(root+sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=process.env.NEIGHBORS_PUBLIC_URL||`http://127.0.0.1:${server.address().port}/`,report={base,cases:[],limits:['Natural query entry; controlled proximity placements for individual E/touch encounters and a legal return-route probe','Muted Chromium desktop/Android emulation; no physical device or listening review']};
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}],['failed-paint',{width:1280,height:800}]]){
  if(process.env.NEIGHBORS_PROFILE&&name!==process.env.NEIGHBORS_PROFILE)continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android')});context.setDefaultTimeout(60000);
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>{if(req.url().includes('/characters/neighbors/'))requests.push(req.url())});
  if(name==='failed-paint')await page.route('**/characters/neighbors/*.webp*',route=>route.abort());
  console.log(name+': direct entry');
  await page.goto(base+'?geheim=nachbarn',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3DBridge?.getHUDState().started&&document.getElementById('preload').hidden);
  const first=await page.evaluate(()=>({hud:Germany3DBridge.getHUDState(),status:Germany3D.neighborAssetStatus,player:[Germany3DBridge.player.x,Germany3DBridge.player.y],gate:Germany3DBridge.jwdGardens.gateAside,actors:Germany3D.inspectAssets().jwd.actors,mission:document.getElementById('mission-title').textContent,saved:localStorage.getItem('germany-anmeldung-v1'),intro:document.getElementById('intro').classList.contains('hidden')}));
  assert.equal(first.hud.busy,false);assert.equal(first.intro,true);assert.deepEqual(first.player,[first.gate.x,first.gate.y]);assert.match(first.mission,/NACHBARN|NEIGHBORS/);assert.equal(first.saved,null);assert.equal(first.status.total,3);assert.equal(first.status.settled,3);
  await page.waitForTimeout(300);
  const idle=await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors);
  for(const actor of idle){if(name==='failed-paint')assert.equal(actor.paint.failed,true);else{assert.ok(actor.paint.loaded&&actor.paint.visible);assert.equal(actor.workVisible,false);assert.equal(actor.paint.row,4);assert.notEqual(actor.paint.frame,first.actors.find(a=>a.id===actor.id).paint.frame)}}
  await page.screenshot({path:resolve(out,name+'-start.png')});
  const encounters=[];
  for(const id of ['jwd-parent','jwd-watcher','jwd-swabian']){
   await page.evaluate(id=>{const b=Germany3DBridge,n=b.getNPCs().find(n=>n.id===id);Object.assign(b.player,{x:n.x,y:n.y+42,vx:0,vy:0});Germany3D.sync()},id);
   if(name.startsWith('android'))await page.locator('.control-dock [data-key="KeyE"]').tap();else await page.keyboard.press('e');
   await page.waitForFunction(id=>Germany3DBridge.getNeighborDialogue()?.id===id&&!document.getElementById('dialogue').hidden,id);
   if(id==='jwd-watcher'&&name!=='failed-paint')await page.waitForFunction(()=>{const d=Germany3DBridge.getNeighborDialogue(),p=Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-watcher').paint;return d?.speaking&&d.mediaDuration>0&&d.mediaTime>.4&&d.mouthOpen>.1&&p.row===5&&p.frame>0});
   const encounter=await page.evaluate(id=>({id,dialogue:Germany3DBridge.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(n=>n.id===id).paint}),id);
   if(name!=='failed-paint')assert.ok(encounter.paint.loaded&&encounter.paint.visible);
   await page.screenshot({path:resolve(out,name+'-'+id+'-talk.png')});encounters.push(encounter);
   for(let line=0;line<4&&await page.evaluate(()=>!!Germany3DBridge.getNeighborDialogue());line++){
    await page.waitForFunction(()=>!document.getElementById('dialogue').hidden);
    await page.locator('#dialogue-next').click();await page.waitForTimeout(120);
   }
   await page.waitForFunction(()=>!Germany3DBridge.getHUDState().busy);
  }
  const after=await page.locator('#mission-title').textContent();assert.match(after,/ANMELDUNG II|REGISTRATION II/,'three actual final acknowledgements resume the next procedure');
  const walks=[];
  for(const id of ['jwd-parent','jwd-watcher','jwd-swabian']){
   await page.evaluate(id=>{const b=Germany3DBridge,n=b.getNPCs().find(n=>n.id===id);n.jwdWorking=false;n.jwdRoute=[{x:n.x,y:b.jwdGardens.crossY}];},id);
   await page.waitForFunction(([id,failed])=>{const a=Germany3D.inspectAssets().jwd.actors.find(n=>n.id===id);return a.paint?.row<4&&(failed||a.paint.visible)},[id,name==='failed-paint']);
   walks.push(await page.evaluate(id=>Germany3D.inspectAssets().jwd.actors.find(n=>n.id===id),id));
  }
  assert.deepEqual(errors,[]);report.cases.push({name,first,idle,encounters,after,walks,requests,errors});
  if(name==='desktop'){
   const seen=requests.length;await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Germany3D?.startupReady&&document.getElementById('preload').hidden);
   assert.equal(await page.evaluate(()=>Germany3DBridge.getHUDState().started),false);assert.equal(await page.locator('#intro').evaluate(el=>el.classList.contains('hidden')),false);assert.equal(requests.length,seen,'ordinary startup never admits distant neighbor paint');
  }
  await context.close();console.log(name+': PASS');
 }
 report.complete=true;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));server.closeAllConnections();await browser?.close();await new Promise(done=>server.close(done))}
