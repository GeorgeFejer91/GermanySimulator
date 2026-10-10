// Silent production-renderer fixture; mobile is browser emulation, not a device.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/mobile-gaussian-handoff';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const reports=[];
try{for(const [name,viewport,mobile] of [['portrait',{width:390,height:844},true],['landscape',{width:667,height:390},true],['desktop',{width:1280,height:800},false]]){
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2,reducedMotion:'no-preference'});
 await context.addInitScript(()=>{
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
  const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target instanceof AudioDestinationNode){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);target=mute}return connect.call(this,target,...args)};
 });
 const page=await context.newPage(),report={name,physicalDevice:false,fixture:'forced frozen background state; actual office manager, assets and render pass',errors:[],samples:[]};reports.push(report);
 page.on('pageerror',error=>report.errors.push(error.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 try{
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:8768/index.html')+'?geheim=buergeramt',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.Germany3D?.ready&&window.BuergeramtLevel?.active&&Germany3D.amtCharacters.every(a=>a.loaded),null,{timeout:120000});
  await page.evaluate(()=>{
   const level=BuergeramtLevel;level.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>false});level.update=()=>{};
   window.__handoff={selected:false,phase:0};
   const original=Object.getOwnPropertyDescriptor(level,'characters');
   Object.defineProperty(level,'view',{configurable:true,get:()=>({x:1.7,z:1.3,yaw:0})});
   Object.defineProperty(level,'stationaryAnimations',{configurable:true,get:()=>({'amt-wolfram-rentenbescheid':{generation:99,arc:'work-gesture-work',phase:__handoff.selected ? .4 : 0,pose:'work'}})});
   Object.defineProperty(level,'characters',{configurable:true,get:()=>original.get.call(level).map(a=>a.id==='kopiependler'?{...a,mode:'gesture',animation:{generation:99,arc:'work-gesture-work',phase:__handoff.phase,pose:'work'}}:{...a,mode:'walk',animation:null})});
   Object.defineProperty(level,'characterMood',{configurable:true,get:()=>__handoff.selected?{id:'kopiependler',tone:'procedural',valence:0}:null});
   Object.defineProperty(level,'fever',{configurable:true,get:()=>__handoff.selected?{active:true,id:'kopiependler',strength:.5,pressure:.26,time:1,progress:.2,theme:BuergeramtFever.themes.kopiependler}:{active:false,strength:0,time:0,pressure:0}});
   Germany3D.sync();
  });
  await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='amt-wolfram-rentenbescheid')?.visible},null,{timeout:90000});
  report.before=await page.evaluate(()=>Germany3D.amtGaussian);await page.screenshot({path:path.join(output,name+'-background.png')});
  await page.evaluate(()=>{__handoff.selected=true;Germany3D.sync()});
  await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='kopiependler')?.anchor?.technique==='native-texture-gaussians'},null,{timeout:60000});
  for(const phase of [0,.15,.3,.5,.7,.85,1]){
   await page.evaluate(phase=>{__handoff.phase=phase;Germany3D.sync()},phase);
   // Allow queued neighbor images to finish; simulation phase remains fixed.
   await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='kopiependler')?.anchor?.technique==='native-texture-gaussians'},null,{timeout:60000});
   const sample=await page.evaluate(()=>({gaussian:Germany3D.amtGaussian,actors:Germany3D.amtCharacters}));report.samples.push(sample);
   const actor=sample.gaussian.actors.find(a=>a.id==='kopiependler');assert(actor.visible&&actor.anchor.opacity===1);assert.equal(actor.cloudVisible,false);assert(actor.anchor.resident<=3);assert(sample.gaussian.actors.length<=sample.gaussian.limit);
   const sprite=sample.actors.find(a=>a.name==='kopiependler');assert.equal(sprite.opacity,0);assert.equal(sprite.height,1.84);assert(Math.abs(sprite.foot)<1e-6);assert(/^[a-f0-9]{6}$/i.test(sprite.tint),'fixture tint must stay finite');
   await page.screenshot({path:path.join(output,`${name}-${phase}.png`)});
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>Germany3D.sync());
  report.reduced=await page.evaluate(()=>({gaussian:Germany3D.amtGaussian,sprite:Germany3D.amtCharacters.find(a=>a.name==='kopiependler')}));assert.equal(report.reduced.sprite.opacity,1);assert(!report.reduced.gaussian.actors.some(a=>a.visible));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{__handoff.phase=0;Germany3D.sync()});
  await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='kopiependler')?.visible});
  await page.evaluate(()=>{__handoff.selected=false;Germany3D.sync()});
  await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='amt-wolfram-rentenbescheid')?.visible},null,{timeout:60000});
  report.restored=await page.evaluate(()=>Germany3D.amtGaussian);assert.equal(report.errors.length,0);report.result='PASS';
 }catch(error){report.result='FAIL';report.failure=error.stack;report.failedState=await page.evaluate(()=>({gaussian:window.Germany3D?.amtGaussian,actors:window.Germany3D?.amtCharacters})).catch(()=>null)}
 await context.close();console.log(JSON.stringify({name,result:report.result,failure:report.failure}));
 if(report.result==='FAIL'&&process.env.STOP_ON_FAILURE)break;
}}finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(reports,null,2));await browser.close()}
if(reports.some(r=>r.result==='FAIL'))process.exitCode=1;
