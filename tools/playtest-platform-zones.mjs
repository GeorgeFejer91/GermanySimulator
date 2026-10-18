import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),out=resolve(process.env.ZONE_OUTPUT||'output/platform-audio/browser');mkdirSync(out,{recursive:true});
const hook=`window.__zone={state,player,stations,npcs,props,stopSpeech,updateTrainAnnouncement,trainAnnouncementVolume,showFeaturedSpriteBark,featuredSpriteEligible,movePlayerGround,stationElevation,staticBlocked,
 accelerate(){for(const source of [recordedSpeechSource].flat())if(source)source.playbackRate.value=32},
 prepare(){stopSpeech();Object.assign(state,{started:true,modal:false,dialogue:false,gameOver:false,mission:1,voiceOn:true,quizTimer:9999,pettyAuditTimer:9999});jwd.allocated=false;jwd.tour=null;document.getElementById('intro').classList.add('hidden');for(const id of ['humor-modal','dialogue','form-modal'])document.getElementById(id).hidden=true;for(const n of npcs)n.barkAt=performance.now()+100000;trainAnnouncementNextAt=0},
 snapshot(){return {family:activeStimulus?.family,started:!!activeStimulus?.speechStarted,volume:activeStimulus?.distanceGain?.gain.value,recording:activeStimulus?.recording,text:activeStimulus?.text,audioActor:activeStimulus?.audioActor?.special,origin:activeStimulus?.origin,pending:stimulusQueue.map(s=>s.family)}},
 walk(s,dt=1/60,lateral=0){const cx=s.accessX+s.accessW/2,cy=s.accessY+s.accessH/2,dx=s.side==='west'?-1:s.side==='east'?1:0,dy=s.side==='north'?-1:s.side==='south'?1:0;Object.assign(player,{x:dx?cx-dx*90:cx+lateral,y:dy?cy-dy*90:cy+lateral,vx:0,vy:0});const start={x:player.x,y:player.y};let blockedAt=null;for(let i=0;i<Math.ceil(230/(160*dt));i++){const x=player.x,y=player.y;movePlayerGround(dx*160*dt,dy*160*dt);if(Math.hypot(player.x-x,player.y-y)<.01&&!blockedAt)blockedAt={x,y,height:stationElevation(x,y)}}const entered=stationAtPlayer()?.id===s.id,finish={x:player.x,y:player.y,height:stationElevation(player.x,player.y)};for(let i=0;i<Math.ceil(230/(160*dt));i++)movePlayerGround(-dx*160*dt,-dy*160*dt);return {id:s.id,dt,lateral,start,finish,entered,exited:dx*(player.x-start.x)+dy*(player.y-start.y)<=1&&stationElevation(player.x,player.y)===0,blockedAt}}
};function loop(now){`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!file.startsWith(root+sep))throw Error('path');let bytes=readFileSync(file);if(file===resolve(root,'game.js')){if(process.env.ZONE_GAME_SOURCE)bytes=readFileSync(process.env.ZONE_GAME_SOURCE);bytes=bytes.toString().replace('function loop(now){',hook)}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
const hashes=()=>Object.fromEntries(['game.js','world3d.js','assets/models/satire-kit/loader.js'].map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
const report={hashes:hashes(),limits:['Seeded station approaches; production movement/collision and native muted audio. Character first clips accelerated at 32x to obtain real native ended receipts, then unaccelerated follow-up starts. Android emulated, no physical device or listening evidence.'],profiles:[]};
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-angle=default']});
 for(const [name,viewport,mobile] of [['desktop',{width:1280,height:800},false],['android',{width:390,height:844},true]]){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}return connect.call(this,target,...args)};const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)}});
  const page=await context.newPage(),profile={name,errors:[]};report.profiles.push(profile);page.on('pageerror',e=>profile.errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.__zone&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:90000});
  await page.locator('#start').click();await page.evaluate(()=>__zone.prepare());
  profile.walks=await page.evaluate(()=>__zone.stations.flatMap(s=>[1/60,1/30,.1].flatMap(dt=>[-100,0,100].map(offset=>__zone.walk(s,dt,offset)))));
  writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
  if(process.env.ZONE_BASELINE){console.log(name+': '+profile.walks.filter(w=>!w.entered||!w.exited).length+' failed traversals');await context.close();continue}
  assert.deepEqual(profile.walks.filter(w=>!w.entered||!w.exited),[]);
  await page.evaluate(()=>{__zone.prepare();const s=__zone.stations[0];Object.assign(__zone.player,{x:s.x+80,y:s.y+s.h/2});__zone.updateTrainAnnouncement(0)});
  await page.waitForFunction(()=>__zone.snapshot().family==='train'&&__zone.snapshot().started,null,{timeout:20000});
  profile.platform=await page.evaluate(()=>{const h=__zone,s=h.snapshot().origin,volumes=[];for(const t of [0,.25,.5,.75,1]){Object.assign(h.player,{x:s.x+s.w*t,y:s.y+s.h/2});h.updateTrainAnnouncement(0);volumes.push(h.trainAnnouncementVolume({origin:s}))}return {s,volumes}});
  assert.ok(profile.platform.volumes.every(v=>v===1));
  await page.screenshot({path:resolve(out,name+'-platform.png')});
  await page.evaluate(()=>{const h=__zone,s=h.snapshot().origin;Object.assign(h.player,{x:s.x+s.w+160,y:s.y+s.h/2});h.updateTrainAnnouncement(0)});
  await page.waitForFunction(()=>{const v=__zone.snapshot().volume;return v>.49&&v<.51});
  profile.fade=await page.evaluate(()=>__zone.snapshot());
  await page.evaluate(()=>{const h=__zone,s=h.snapshot().origin;h.player.x=s.x+s.w+321;h.updateTrainAnnouncement(0)});
  assert.notEqual((await page.evaluate(()=>__zone.snapshot())).family,'train');
  profile.stationCaptures=[];
  for(const side of ['north','south','west','east']){
   const station=await page.evaluate(side=>{const h=__zone,s=h.stations.find(s=>s.side===side);h.prepare();Object.assign(h.player,{x:s.x+s.w/2,y:s.y+s.h/2,vx:0,vy:0});return s},side);
   await page.waitForTimeout(600);await page.screenshot({path:resolve(out,name+'-'+side+'-fallback.png')});profile.stationCaptures.push(station.id);
  }
  profile.characters=[];
  for(const special of ['merkel','borderPourer','bayern','alice']){
   const family=special==='merkel'?'politician:merkel':special==='borderPourer'?'politician:merz':special;
   await page.evaluate(special=>{const h=__zone;h.prepare();const n=h.npcs.find(n=>n.special===special);h.state.region=special==='merkel'?'berlin':'germany';Object.assign(h.player,{x:n.x+65,y:n.y});n.barkAt=0},special);
   await page.waitForFunction(f=>__zone.snapshot().family===f&&__zone.snapshot().started,family,{timeout:25000});
   const first=await page.evaluate(()=>{const h=__zone,s=h.snapshot();h.accelerate();return s});assert.equal(first.audioActor,special);assert.ok(first.volume>.99);
   await page.waitForFunction(first=>{const s=__zone.snapshot();return s.family===first.family&&s.started&&(s.recording!==first.recording||s.text!==first.text)},first,{timeout:20000});
   profile.characters.push({special,first,next:await page.evaluate(()=>__zone.snapshot())});
   await page.screenshot({path:resolve(out,name+'-'+special+'.png')});
  }
  await page.goto(`http://127.0.0.1:${server.address().port}/?satireKit=1`);
  await page.waitForFunction(()=>window.__zone&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:90000});
  await page.locator('#start').click();
  profile.loaded=[];
  for(const id of ['nordwest','nordost','suedwest','suedost']){
   await page.evaluate(id=>{const h=__zone,s=h.stations.find(s=>s.id===id);h.prepare();Object.assign(h.player,{x:s.x+s.w/2,y:s.y+s.h-22,vx:0,vy:0})},id);
   await page.waitForFunction(id=>__zone.props.filter(p=>p.stationId===id&&p.stationFixture).every(p=>p.active),id,{timeout:30000});
   const walks=await page.evaluate(id=>[1/60,1/30,.1].map(dt=>__zone.walk(__zone.stations.find(s=>s.id===id),dt,0)),id);profile.loaded.push({id,walks});assert.deepEqual(walks.filter(w=>!w.entered||!w.exited),[]);
   await page.evaluate(id=>{const h=__zone,s=h.stations.find(s=>s.id===id);Object.assign(h.player,{x:s.x+s.w/2,y:s.side==='north'?s.y+s.h+25:s.y-25})},id);
   await page.waitForTimeout(400);await page.screenshot({path:resolve(out,name+'-'+id+'-loaded.png')});
  }
  assert.deepEqual(profile.errors,[]);console.log(name+': '+profile.walks.length+' station traversals and native zone audio PASS');await context.close();
 }
}finally{report.hashesUnchanged=JSON.stringify(report.hashes)===JSON.stringify(hashes());writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(done=>server.close(done))}
