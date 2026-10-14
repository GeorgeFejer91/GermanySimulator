// Silent real-browser encounter checks. City placement is an explicit diagnostic shortcut.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PLAYTEST_OUTPUT||'output/jobcenter');mkdirSync(out,{recursive:true});
const baselineJob=process.env.PLAYTEST_BASE_REF?execFileSync('git',['show',process.env.PLAYTEST_BASE_REF+':jobcenter.js'],{encoding:'utf8'}):null;
const baselineEntry=baselineJob?execFileSync('git',['show',process.env.PLAYTEST_BASE_REF+':buergeramt-entry.js'],{encoding:'utf8'}):null;
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{let file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+sep))throw Error('path');const body=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(body)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={revision:Object.fromEntries(['jobcenter.js','speech-mouth.js','buergeramt-entry.js','level-transitions.js','building-levels.js','level-transition-effects.js','assets/audio/jobcenter/overlord.json','assets/audio/jobcenter/overlord.mp3','world3d.js','game.js','tools/playtest-jobcenter.mjs'].map(f=>[f,createHash('sha256').update(f==='jobcenter.js'&&baselineJob?baselineJob:f==='buergeramt-entry.js'&&baselineEntry?baselineEntry:readFileSync(f)).digest('hex')])),baselineRef:process.env.PLAYTEST_BASE_REF??null,limits:['Silent audio state checks; no listening verdict','Android emulation, not a physical device','City placement is forced; final approach and entry use production input','An early pull frame holds only the fixture render clock for its screenshot'],cases:[]};
const mouthTargets=[['closed',1.465],['open',1.95],['round',3.645],['bite',4.13],['wide-open',6.105],['quiet',26.635]];
const silenceAudio=()=>{
   const play=HTMLMediaElement.prototype.play;window.__jobMedia=[];HTMLMediaElement.prototype.play=function(...args){this.muted=true;if(this.src.includes('/jobcenter/')&&!window.__jobMedia.includes(this))window.__jobMedia.push(this);return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
};
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:name==='android',hasTouch:name==='android'});context.setDefaultTimeout(90000);
  await context.addInitScript(silenceAudio);
  if(process.env.PLAYTEST_MOUTH_CUES==='1')await context.addInitScript(targets=>{
   window.__jobMouthCapture={targets,index:0,ready:-1};const seen=new WeakSet(),play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(...args){
    if(this.src.includes('/jobcenter/')&&!seen.has(this)){
     seen.add(this);const player=this;window.__jobMouthTimer=setInterval(()=>{const c=__jobMouthCapture,t=c.targets[c.index];if(t&&!player.paused&&player.currentTime>=t[1]){player.pause();c.ready=c.index}},5);
    }
    return play.apply(this,args);
   };
  },mouthTargets);
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR '+e.message)});page.on('request',r=>requests.push(r.url()));
  if(baselineJob)await page.route('**/jobcenter.js?*',route=>route.fulfill({contentType:'text/javascript',body:baselineJob}));
  if(baselineEntry)await page.route('**/buergeramt-entry.js?*',route=>route.fulfill({contentType:'text/javascript',body:baselineEntry}));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  try{await page.waitForFunction(()=>window.Germany3D?.startupReady&&window.Germany3DBridge?.startupAssetsReady)}catch(error){console.log(await page.evaluate(()=>({ready:window.Germany3D?.ready,startup:window.Germany3D?.startupStatus,characters:window.Germany3DBridge?.characterAssetStatus,hidden:document.hidden})));throw error}
  console.log(JSON.stringify({name,stage:'ready'}));
  assert.equal(requests.some(u=>u.includes('audio/jobcenter')),false,'no audio on boot');
  await page.waitForFunction(()=>!document.body.classList.contains('preloading')&&!document.getElementById('start').disabled);
  await page.keyboard.press('KeyS');
  await page.waitForFunction(()=>document.getElementById('intro').classList.contains('hidden'));
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>Germany3DBridge.getHUDState().busy))break;await page.keyboard.press('KeyE');}
  await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='jobcenter');Object.assign(Germany3DBridge.player,{x:b.doorX,y:b.doorY+120});});
  await page.waitForTimeout(600);await page.screenshot({path:resolve(out,name+'-exterior.png')});
  await page.keyboard.down('KeyW');await page.waitForTimeout(330);await page.keyboard.up('KeyW');
  console.log(await page.evaluate(()=>({stage:'at-door',player:Germany3DBridge.player,hud:Germany3DBridge.getHUDState(),dialogue:document.getElementById('dialogue').hidden})));
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active&&!Germany3D.levelTransition.active);
  await page.waitForTimeout(500);const initial=await page.evaluate(()=>Germany3D.jobcenter);assert.equal(initial.phase,'approach');
  await page.screenshot({path:resolve(out,name+'-distant.png')});
  if(name==='desktop'){
   await page.keyboard.down('PageUp');await page.waitForFunction(p=>Germany3D.jobcenter.pitch>p+.12,initial.pitch);await page.keyboard.up('PageUp');const up=await page.evaluate(()=>Germany3D.jobcenter);assert.equal(up.x,initial.x);assert.equal(up.z,initial.z);
   await page.screenshot({path:resolve(out,name+'-arrow-up.png')});
   await page.keyboard.down('PageDown');await page.waitForFunction(p=>Germany3D.jobcenter.pitch<=p,initial.pitch);await page.keyboard.up('PageDown');
   await page.mouse.move(850,400);const beforeHover=await page.evaluate(()=>Germany3D.jobcenter);await page.mouse.move(890,360,{steps:4});const hover=await page.evaluate(()=>Germany3D.jobcenter);assert.ok(hover.yaw<beforeHover.yaw&&hover.pitch>beforeHover.pitch);assert.equal(hover.z,beforeHover.z);
   await page.mouse.move(850,400,{steps:4});assert.equal(await page.locator('#jobcenter-input').evaluate(e=>getComputedStyle(e).cursor),'none');
   await page.keyboard.down('KeyS');await page.waitForTimeout(600);await page.keyboard.up('KeyS');
   assert.ok((await page.evaluate(()=>Germany3D.jobcenter.distance))>initial.distance,'walking away is unrestricted');
   await page.keyboard.down('KeyW');await page.waitForFunction(()=>Germany3D.jobcenter.phase==='speaking');await page.keyboard.up('KeyW');
  }else{
   // Actual touchscreen drag in the left movement half; right half remains look.
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:70,y:650,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:70,y:575,id:1}]});
   await page.waitForFunction(()=>Germany3D.jobcenter.phase==='speaking');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.waitForFunction(()=>Germany3D.jobcenter.mediaStarted&&Germany3D.jobcenter.playback>1);
  await page.screenshot({path:resolve(out,name+'-speaking.png')});
  const speaking=await page.evaluate(()=>Germany3D.jobcenter);assert.ok(speaking.energy>0);assert.ok(speaking.pressure>initial.pressure);
  if(!baselineJob)await page.evaluate(()=>{
   window.__jobEarlyPullHeld=false;window.__jobEarlyPullArmed=true;const sync=Germany3D.sync;
   Germany3D.sync=function(){if(__jobEarlyPullHeld)return;sync();const transition=Germany3D.levelTransition;
    if(__jobEarlyPullArmed&&transition.kind==='eject'&&transition.stage==='pull'&&transition.stageProgress>=.025)__jobEarlyPullHeld=true;
   };
  });
  await page.evaluate(()=>{window.__jobCueSamples=[];window.__jobCueTimer=setInterval(()=>{const j=Germany3D.jobcenter;if(j.active)window.__jobCueSamples.push({time:j.playback,level:j.rumbleLevel,dismissal:j.dismissal,heat:j.heat,active:j.rumbleActive})},100)});
  const samples=await page.evaluate(async()=>{const rows=[];for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,90));rows.push({time:Germany3D.jobcenter.playback,energy:Germany3D.jobcenter.energy})}return rows});
  if(process.env.PLAYTEST_MOUTH_CUES!=='1')assert.ok(new Set(samples.map(s=>Math.round(s.energy*100))).size>2,'fire responds to changing media energy');
  const mouthCaptures=[];
  const captureMouth=async index=>{
   await page.waitForFunction(index=>__jobMouthCapture.ready===index,index);await page.evaluate(()=>Germany3D.sync());
   const state=await page.evaluate(()=>({scene:Germany3D.jobcenter,mediaTime:__jobMedia.at(-1).currentTime,paused:__jobMedia.at(-1).paused}));
   const [label,target]=mouthTargets[index],path=resolve(out,name+'-mouth-'+label+'.png');
   assert(state.paused);assert(Math.abs(state.mediaTime-target)<.04,'native pause should remain inside its acoustic cue');
   await page.screenshot({path});
   if(!baselineJob){
    if(['closed','quiet'].includes(label))assert.equal(state.scene.mouth[0],0);
    if(label==='round')assert(state.scene.mouth[2]>.5);
    if(label==='bite')assert(state.scene.mouth[3]>.5);
   }
   mouthCaptures.push({label,target,path,state});
   await page.evaluate(()=>{__jobMouthCapture.index++;__jobMouthCapture.ready=-1;__jobMedia.at(-1).play()});
  };
  if(process.env.PLAYTEST_MOUTH_CUES==='1')for(let i=0;i<5;i++)await captureMouth(i);
  if(name==='desktop'){
   await page.keyboard.down('KeyW');await page.waitForTimeout(1700);await page.keyboard.up('KeyW');
   await page.screenshot({path:resolve(out,name+'-furious.png')});
   // Hidden-page boundary is injected; real media pause/resume is observed.
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   assert.equal(await page.evaluate(()=>Germany3D.jobcenter.rumbleActive),false,'hidden visit releases rumble source');
   const paused=await page.evaluate(()=>window.__jobMedia.at(-1).currentTime);await page.waitForTimeout(650);
   assert.ok(Math.abs((await page.evaluate(()=>window.__jobMedia.at(-1).currentTime))-paused)<.03);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
  }else{
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);await page.screenshot({path:resolve(out,name+'-landscape.png')});
  }
  await page.waitForFunction(()=>Germany3D.jobcenter.heat>.75,null,{timeout:45000});
  await page.screenshot({path:resolve(out,name+'-white-heat.png')});
  if(process.env.PLAYTEST_MOUTH_CUES==='1'){await captureMouth(5);await page.evaluate(()=>clearInterval(__jobMouthTimer))}
  let releaseStart;
  if(baselineJob){
   await page.waitForFunction(()=>!Germany3D.jobcenter.active,null,{timeout:5000});
   releaseStart=await page.evaluate(()=>({release:Germany3D.jobcenter.release,busy:Germany3DBridge.getHUDState().busy,player:{...Germany3DBridge.player}}));
   await page.screenshot({path:resolve(out,name+'-release-start.png')});
   await page.waitForFunction(()=>!Germany3D.jobcenter.release);
  }else{
   await page.waitForFunction(()=>__jobEarlyPullHeld,null,{timeout:5000});
   releaseStart=await page.evaluate(()=>({transition:Germany3D.levelTransition,scene:Germany3D.jobcenter,busy:Germany3DBridge.getHUDState().busy,player:{...Germany3DBridge.player}}));
   assert.equal(releaseStart.busy,true,'native ended retains visit ownership until the original door is crossed');
   assert.equal(releaseStart.scene.rumbleActive,false,'the recorded voice and rumble stop before the pull');
   assert.equal(releaseStart.transition.stage,'pull');assert.ok(releaseStart.transition.stageProgress<.2,'capture precedes fire engulfment');
   await page.screenshot({path:resolve(out,name+'-release-start.png')});
   await page.evaluate(()=>{__jobEarlyPullHeld=false;__jobEarlyPullArmed=false});
   await page.waitForFunction(()=>Germany3D.levelTransition.stage==='rebuild');
   await page.screenshot({path:resolve(out,name+'-release-middle.png')});
   await page.waitForFunction(()=>!Germany3D.jobcenter.active&&!Germany3D.levelTransition.active);
  }

  const cueSamples=await page.evaluate(()=>{clearInterval(window.__jobCueTimer);return window.__jobCueSamples});
  assert.ok(cueSamples.some(s=>s.active&&s.level>.4),'long speech pauses produce rumble');
  assert.ok(cueSamples.some(s=>s.dismissal>.7),'final dismissal builds the threat');
  assert.ok(cueSamples.some(s=>s.active&&s.level<.1),'speech ducks the rumble');
  const exit=await page.evaluate(()=>({player:{...Germany3DBridge.player},class:document.body.classList.contains('jobcenter-inside'),media:window.__jobMedia.map(m=>({src:m.getAttribute('src'),paused:m.paused})),surface:!!document.getElementById('jobcenter-input')}));
  assert.equal(exit.class,false);assert.equal(exit.surface,false);assert.ok(exit.media.every(m=>m.paused&&!m.src));
  await page.screenshot({path:resolve(out,name+'-ejected.png')});
  // Re-entry and explicit recovery never keep the old audio or controls.
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>Germany3D.jobcenter.active&&!Germany3D.levelTransition.active);await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>Germany3D.jobcenter.active),false);
  assert.deepEqual(errors,[]);report.cases.push({name,initial,speaking,samples,mouthCaptures,cueSamples,releaseStart,exit,errors});
  console.log(JSON.stringify({name,result:'PASS'}));await context.close();
 }
 // Shared diagnostic uses the identical facade and encounter renderer.
 const diagnostic=await browser.newContext();await diagnostic.addInitScript(silenceAudio);const p=await diagnostic.newPage();await p.goto(`http://127.0.0.1:${server.address().port}/3d.html`);await p.waitForFunction(()=>window.Germany3D?.ready);assert.ok(await p.evaluate(()=>Germany3DBridge.buildings.some(b=>b.id==='jobcenter')));await diagnostic.close();
 writeFileSync(resolve(out,'browser-report.json'),JSON.stringify(report,null,2));
}finally{await browser.close();server.close()}

