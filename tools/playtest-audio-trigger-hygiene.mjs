import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),out=resolve(process.env.AUDIO_TEST_OUTPUT||'output/audio-trigger-hygiene/browser');mkdirSync(out,{recursive:true});
const report={hashes:Object.fromEntries(['game.js','world3d.js'].map(f=>[f,createHash('sha256').update(readFileSync(resolve(root,f))).digest('hex')])),cases:[],limits:['Station, track and neighbor starting positions are seeded. Production simulation, broker, native MP3 decode/playback and input handlers remain active.','Headless Chromium desktop and Android emulation; all output muted before navigation. No physical Android or perceptual listening claim.']};
const hook=`window.__audioProbe={state,player,jwd,npcs,stations,railLoops,pointOnRailLoop,stopSpeech,openDialogue,requestTrainAnnouncement,updateTrainAnnouncement,queueStimulus,citySpeechAllowed,
 prepare(){stopSpeech();Object.assign(state,{started:true,modal:false,dialogue:false,gameOver:false,mission:1,voiceOn:true,quizTimer:9999,pettyAuditTimer:9999});jwd.allocated=false;jwd.tour=null;document.getElementById('intro').classList.add('hidden');document.getElementById('dialogue').hidden=true;document.getElementById('humor-modal').hidden=true;trainAnnouncementNextAt=0;trainStationSeconds=0;trainAudioStation=null;trainIdleSeconds=0;trainIdleStation=null;for(const n of npcs)n.barkAt=performance.now()+100000;const s=stations.find(s=>s.side==='south'&&s.x>7000);Object.assign(player,{x:s.x+s.w/2,y:s.y+s.h/2,vx:0,vy:0});return {station:s,at:performance.now()}},
 snapshot(){return {at:performance.now(),idle:trainIdleSeconds,residence:trainStationSeconds,queuedAt:activeStimulus?.queuedAt,x:player.x,y:player.y,family:activeStimulus?.family,recording:activeStimulus?.recording,started:!!activeStimulus?.speechStarted,volume:activeStimulus?.distanceGain?.gain.value,origin:activeStimulus?.origin,pending:stimulusQueue.map(s=>s.family),modal:state.modal,dialogue:state.dialogue,contextAllowed:trainAudioContextAllowed(),speechAllowed:citySpeechAllowed('train'),audioState:audio?.state,assetQueue:Germany3DBridge.assetLoadStatus,recordings:[...recordingPromises.keys()],paused:window.GermanyHUD?.paused,nearby:nearbyFeaturedSprite()?.id,activeText:audioTextActive(),eligible:activeStimulus?stimulusEligible(activeStimulus):null,allowed:citySpeechAllowed('train'),subtitle:document.getElementById('english-subtitle').textContent}}
};function loop(now){`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!file.startsWith(root+sep))throw Error('path');let bytes=readFileSync(file);if(file===resolve(root,'game.js'))bytes=bytes.toString().replace('function loop(now){',hook);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser,currentPage;
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,viewport,mobile] of [['desktop',{width:1280,height:800},false],['android-portrait',{width:390,height:844},true],['android-landscape',{width:844,height:390},true]]){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){this.muted=true;this.volume=0;return play.apply(this,a)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),result={name,checks:[],errors:[]};report.cases.push(result);currentPage=page;save();
  page.on('pageerror',e=>result.errors.push(e.message));
  result.media=[];page.on('response',r=>{if(r.url().includes('/audio/trains/'))result.media.push({url:r.url(),status:r.status()})});page.on('requestfailed',r=>result.errors.push({url:r.url(),failure:r.failure()}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__audioProbe&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:90000});
  await page.locator('#start').click();
  await page.evaluate(()=>{document.getElementById('simulator-s').click();for(let i=0;i<12;i++)document.getElementById('dialogue-next').click()});
  result.setup=await page.evaluate(()=>__audioProbe.prepare());
  assert.notEqual((await page.evaluate(()=>__audioProbe.snapshot())).family,'train');result.checks.push('no early station start');
  const before=await page.evaluate(()=>__audioProbe.snapshot());
  if(mobile){const box=await page.locator('.control-dock [data-key="ArrowRight"]').boundingBox();assert.ok(box);const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await page.waitForFunction(x=>Math.abs(__audioProbe.player.x-x)>3,before.x);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  else {await page.keyboard.down('ArrowRight');await page.waitForFunction(x=>Math.abs(__audioProbe.player.x-x)>3,before.x);await page.keyboard.up('ArrowRight')}
  const moved=await page.evaluate(()=>__audioProbe.snapshot());assert.ok(moved.idle<.5);result.checks.push('real directional input remains available during station admission');
  await page.waitForFunction(()=>__audioProbe.snapshot().family==='train',null,{timeout:5000});
  result.admitted=await page.evaluate(()=>__audioProbe.snapshot());assert.ok(result.admitted.queuedAt-result.setup.at>=900);assert.ok(result.admitted.queuedAt-result.setup.at<3000);
  await page.waitForFunction(()=>{const s=__audioProbe.snapshot();return s.family==='train'&&s.started},null,{timeout:10000});
  result.started=await page.evaluate(()=>__audioProbe.snapshot());assert.equal(result.started.queuedAt,result.admitted.queuedAt);result.checks.push('one-second admission while walking starts its own native recording without a retry');
  await page.screenshot({path:resolve(out,name+'-station.png')});
  result.fade=await page.evaluate(()=>{const h=__audioProbe,s=h.snapshot().origin;h.player.x=s.x+s.w+160;h.player.y=s.y+s.h/2;h.updateTrainAnnouncement(0);return h.snapshot()});
  await page.waitForFunction(()=>{const s=__audioProbe.snapshot();return s.volume<.65&&s.volume>.35});
  result.fadeSettled=await page.evaluate(()=>__audioProbe.snapshot());result.checks.push('native distance gain falls to half at 160 units');
  result.far=await page.evaluate(()=>{const h=__audioProbe,s=h.snapshot().origin;h.player.x=s.x+s.w+321;h.updateTrainAnnouncement(0);return h.snapshot()});assert.notEqual(result.far.family,'train');result.checks.push('inaudible source stopped and released');
  await page.evaluate(()=>{const h=__audioProbe;h.stopSpeech();const s=h.stations[0];h.player.x=s.x+s.w+49;h.player.y=s.y+s.h/2;h.updateTrainAnnouncement(10)});
  assert.notEqual((await page.evaluate(()=>__audioProbe.snapshot())).family,'train');result.checks.push('outside the full station area cannot trigger despite elapsed time');
  result.stationMap=await page.evaluate(()=>__audioProbe.stations.map((s,index)=>{
   const h=__audioProbe;h.prepare();h.player.x=s.accessX+s.accessW/2;h.player.y=s.accessY+s.accessH/2;h.updateTrainAnnouncement(1.05);return {id:s.id,...h.snapshot()};
  }));
  for(const actual of result.stationMap){assert.equal(actual.origin?.id,actual.id);assert.equal(actual.family,'train');assert.ok(!actual.recording.includes('buxtehude'))}
  result.checks.push('all 18 entrance areas admit the correct station recording with staged elapsed time');
  await page.evaluate(()=>{const h=__audioProbe;h.prepare();const p=h.pointOnRailLoop(h.railLoops[0],1000);h.player.x=p.x;h.player.y=p.y;h.updateTrainAnnouncement(.025)});
  await page.waitForFunction(()=>{const s=__audioProbe.snapshot();return s.family==='train'&&s.started&&s.recording.includes('buxtehude')},null,{timeout:15000});
  result.track=await page.evaluate(()=>__audioProbe.snapshot());assert.ok(result.track.idle<5);result.checks.push('actual track contact starts native children recording without station dwell');
  result.neighbor=await page.evaluate(()=>{const h=__audioProbe;h.prepare();h.jwd.tour={actor:h.npcs.find(n=>n.jwdRole==='watcher'),phase:'ready'};h.requestTrainAnnouncement(0,'',5,'track');const accepted=h.queueStimulus({family:'police',text:'unrelated',priority:5});h.jwd.tour=null;h.jwd.allocated=true;h.jwd.met.clear();h.player.x=1100;h.player.y=4650;h.updateTrainAnnouncement(0);return {accepted,...h.snapshot()}});
  assert.equal(result.neighbor.accepted,false);assert.equal(result.neighbor.allowed,false);assert.notEqual(result.neighbor.family,'train');result.checks.push('neighbor protection rejects critical world speech');
  await page.screenshot({path:resolve(out,name+'-neighbors.png')});
  result.takeover=await page.evaluate(()=>{const h=__audioProbe;h.prepare();h.queueStimulus({family:'train',recording:'./assets/audio/trains/ice-0815-buxtehude-bahnhofshalle-subtle.mp3',priority:5});h.openDialogue('TEST',['Conversation'],'!');return h.snapshot()});
  assert.equal(result.takeover.dialogue,true);assert.notEqual(result.takeover.family,'train');result.checks.push('dialogue immediately owns broker after train cancellation');
  assert.deepEqual(result.errors,[]);save();console.log(name+': '+result.checks.length+' checks PASS');await context.close();
 }
}catch(error){report.failure=String(error);if(currentPage){report.last=await currentPage.evaluate(()=>__audioProbe.snapshot()).catch(()=>null);await currentPage.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});}throw error}finally{save();await browser?.close();await new Promise(done=>server.close(done))}
