// Installed Playwright, isolated silent Chromium. Real CDP touch events drive
// production input; a private pose seam only selects repeatable room positions.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.NAV_OUTPUT||'output/phone-navigation/browser');mkdirSync(out,{recursive:true});
const files=['index.html','buergeramt.js','buergeramt.css','buergeramt-fit.js','buergeramt-goop.js','world3d.js','tools/playtest-buergeramt-navigation.mjs'];
const sources=new Map(files.map(f=>[f,readFileSync(f)]));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.json':'application/json','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname),file=resolve(root,'.'+relative);
 if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);
 if(file===resolve('game.js'))data=data.toString().replace('const directConfig={','const directConfig={cinematics:false,');
 if(file===resolve('buergeramt.js'))data=data.toString().replace('window.BuergeramtLevel={','window.__navigationTest={pose(x=1.8,z=4.8,yaw=0,pitch=0){clearOfficeInput();Object.assign(view,{x,z,yaw,pitch});view.positionGeneration++;setStage("walk-sign");const target=nearbyInteraction();return{stage,view:{...view},blocked:officeBlocked(x,z),target:target.mirror?"mirror":target.portrait?"portrait":target.actor?.id||target.desk}},caption(){startOfficeSubtitle("Bitte bleiben Sie in der Warteschlange. Ihre Unterlagen werden geprüft.",null,60000)}};window.BuergeramtLevel={');
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={complete:false,revision:Object.fromEntries([...sources].map(([f,b])=>[f,createHash('sha256').update(b).digest('hex')])),cases:[],limits:['Real Chromium touch/keyboard input; forced room pose, no natural mission claim','Desktop and Android emulation; physical phone and listening NOT RUN']};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
let activePage,activeResult;
try{
 const profiles=[['portrait',390,844,true],['small',320,568,true],['landscape',844,390,true],['wide-touch',1024,768,true],['desktop',1280,800,false]];
 for(const [name,width,height,mobile] of profiles.filter(p=>!process.env.NAV_CASE||process.env.NAV_CASE.split(',').includes(p[0]))){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){this.muted=true;this.volume=0;return play.apply(this,a)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...a){if(target===this.context.destination){const sink=this.context.createGain();sink.gain.value=0;connect.call(sink,target);return connect.call(this,sink,...a)}return connect.call(this,target,...a)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
   window.__navigationEvents=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>window.__navigationEvents.push({type,id:e.pointerId,target:e.target.id,trusted:e.isTrusted}));
   addEventListener('keydown',e=>__navigationEvents.push({type:e.type,code:e.code,target:e.target.id,stage:window.BuergeramtLevel?.stage,trusted:e.isTrusted}),true);
  });
  const page=await context.newPage(),result={name,verdict:'PENDING',layouts:[],gestures:[],camera:[],errors:[]};report.cases.push(result);page.on('pageerror',e=>result.errors.push(e.message));
  activePage=page;activeResult=result;
  console.log(name,'boot');await page.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active,null,{timeout:120000});
  await page.evaluate(()=>{__navigationTest.pose();BuergeramtFit()});await page.waitForTimeout(200);
  const inspect=()=>page.evaluate(()=>({view:BuergeramtLevel.view,stage:BuergeramtLevel.stage,stick:document.getElementById('amt-move-stick').classList.contains('is-active'),look:document.getElementById('amt-look-zone').classList.contains('is-active')}));
  const layout=async(label)=>{
   await page.evaluate(()=>BuergeramtFit());await page.waitForTimeout(150);
   const data=await page.evaluate(()=>{
    const ids=['amt-move-stick','amt-touch-e','amt-nearby','amt-objective','english-subtitle','amt-mix','subtitle-toggle'],boxes=Object.fromEntries(ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return[id,{x:r.x,y:r.y,w:r.width,h:r.height,visible:!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'}]}));
    const labels=[...document.querySelectorAll('.amt-nav-label,#amt-touch-e')].filter(e=>e.getClientRects().length).map(e=>({text:e.innerText,fit:e.dataset.pretextFit,w:e.clientWidth,h:e.clientHeight,scrollW:e.scrollWidth,scrollH:e.scrollHeight}));
    return{viewport:[innerWidth,innerHeight],boxes,labels,short:document.body.classList.contains('amt-nav-short'),overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   await page.screenshot({path:resolve(out,`${name}-${label}.png`)});result.layouts.push({label,...data});return data;
  };
  const checkLayout=(data,label)=>{
   assert.equal(data.overflow,false,label);for(const e of data.labels){assert.ok(e.fit&&e.fit!=='unavailable',`${label}: actual Pretext fit ${e.text}`);assert.ok(e.scrollW<=e.w+1&&e.scrollH<=e.h+1,`${label}: clipped ${e.text}`)}
   const separate=(a,b)=>a.x+a.w<=b.x+1||b.x+b.w<=a.x+1||a.y+a.h<=b.y+1||b.y+b.h<=a.y+1;
   for(const other of ['amt-mix','subtitle-toggle']){const a=data.boxes[other],b=data.boxes['amt-nearby'];if(a.visible&&b.visible)assert.ok(separate(a,b),`${label}: nearby hint overlaps toolbar`)}
   for(const id of ['amt-move-stick','amt-touch-e']){const b=data.boxes[id];assert.equal(b.visible,mobile);if(mobile){assert.ok(b.w>=44&&b.h>=44);assert.ok(b.x>=-1&&b.y>=-1&&b.x+b.w<=data.viewport[0]+1&&b.y+b.h<=data.viewport[1]+1,`${label}: control outside viewport`);for(const other of ['english-subtitle','amt-objective','amt-mix','subtitle-toggle']){const a=data.boxes[other];if(a.visible)assert.ok(separate(a,b),`${label}: ${id} overlaps ${other}`)}}}
   if(mobile)assert.ok(separate(data.boxes['amt-move-stick'],data.boxes['amt-touch-e']),'thumb and action must not overlap');
  };
  const initial=await layout('initial');
  checkLayout(initial,'initial');
  if(mobile){
   const cdp=await context.newCDPSession(page),points=new Map();
   // Chromium's legacy WebTouch path ends the listed finger; its newer
   // SyntheticPointerActions path ends omitted fingers on a reduced move set.
   // Keep that driver distinction separate from the production release checks.
   const touch=async(type,id,x,y)=>{
    if(type==='touchEnd'){
     const ended=points.get(id);points.delete(id);
     if(points.size){try{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[ended]});return}catch(error){if(!error.message.includes('TouchEnd'))throw error;type='touchMove'}}
    }else if(type==='touchCancel')points.clear();else points.set(id,{id,x,y,radiusX:8,radiusY:8,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...points.values()]});
   };
   const b=initial.boxes['amt-move-stick'],x=b.x+b.w/2,y=b.y+b.h/2,rx=width*.77,ry=height*.48;
   await touch('touchStart',1,x,y);await touch('touchMove',1,x-b.w*.38,y);await page.waitForTimeout(120);
   await touch('touchStart',2,rx,ry);const before=await inspect();await touch('touchMove',2,rx+45,ry-35);await page.waitForFunction(distance=>BuergeramtLevel.view.walkedDistance>distance+.1,before.view.walkedDistance,{timeout:1000});const both=await inspect();
   result.gestures.push({label:'simultaneous',before,after:both});assert.equal(both.stick,true);assert.equal(both.look,true);assert.ok(both.view.yaw>before.view.yaw+.1&&both.view.pitch>before.view.pitch+.1);assert.ok(both.view.walkedDistance>before.view.walkedDistance+.1);
   await page.screenshot({path:resolve(out,`${name}-two-fingers.png`)});
   await touch('touchEnd',2);const onlyMove=await inspect();await page.waitForTimeout(150);const moving=await inspect();assert.equal(moving.look,false);assert.equal(moving.stick,true);assert.ok(moving.view.walkedDistance>onlyMove.view.walkedDistance+.1);result.gestures.push({label:'look-lift-keeps-walk',before:onlyMove,after:moving});
   await touch('touchStart',3,rx,ry);const pointerId=await page.evaluate(()=>__navigationEvents.findLast(e=>e.type==='pointerdown'&&e.target==='amt-move-stick').id);await page.evaluate(id=>document.getElementById('amt-move-stick').releasePointerCapture(id),pointerId);
   await touch('touchMove',1,x-b.w*.38-1,y);await touch('touchMove',3,rx+30,ry);await page.waitForTimeout(80);const lost=await inspect();result.gestures.push({label:'capture-loss',after:lost});assert.equal(lost.stick,false);assert.equal(lost.look,true);await touch('touchMove',3,rx+60,ry);await page.waitForFunction(yaw=>BuergeramtLevel.view.yaw>yaw,lost.view.yaw,{timeout:1000});const looking=await inspect();assert.ok(looking.view.yaw>lost.view.yaw);result.gestures.push({label:'capture-loss-keeps-look',before:lost,after:looking});
   await touch('touchCancel');const stopped=await inspect();await page.waitForTimeout(100);const idle=await inspect();assert.equal(idle.stick,false);assert.equal(idle.look,false);assert.ok(Math.abs(idle.view.walkedDistance-stopped.view.walkedDistance)<1e-8);result.gestures.push({label:'cancel-all',before:stopped,after:idle});
   await page.evaluate(()=>__navigationTest.pose());await touch('touchStart',4,x,y);await touch('touchMove',4,x,y-b.h*.38);await page.locator('#amt-mix summary').click();const mixer=await inspect();assert.equal(mixer.stick,false);assert.equal(mixer.look,false);result.gestures.push({label:'mixer-releases-input',after:mixer});await touch('touchCancel');await page.locator('#amt-mix summary').click();
   await page.evaluate(()=>__navigationTest.pose());await touch('touchStart',6,x,y);await touch('touchMove',6,x-b.w*.38,y);await page.locator('#amt-mix summary').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('amt-mix').open&&!document.getElementById('amt-move-stick').classList.contains('is-active'));const keyboardMixer=await inspect();await page.waitForTimeout(100);assert.equal((await inspect()).view.walkedDistance,keyboardMixer.view.walkedDistance);result.gestures.push({label:'keyboard-mixer-releases-input',after:keyboardMixer});await touch('touchCancel');await page.keyboard.press('Enter');
   await page.evaluate(()=>__navigationTest.caption());checkLayout(await layout('caption'),'caption');
   if(['portrait','small','landscape'].includes(name)){
    await page.evaluate(()=>{document.documentElement.style.zoom='2';BuergeramtFit()});checkLayout(await layout('zoom-200'),'zoom-200');
    await page.evaluate(()=>{document.documentElement.style.zoom='';document.documentElement.style.fontSize='200%';BuergeramtFit()});checkLayout(await layout('text-200'),'text-200');
    await page.evaluate(()=>{document.documentElement.style.fontSize='';document.documentElement.style.letterSpacing='.12em';document.documentElement.style.wordSpacing='.16em';BuergeramtFit()});checkLayout(await layout('text-spacing'),'text-spacing');
    await page.evaluate(()=>{document.documentElement.style.letterSpacing='';document.documentElement.style.wordSpacing=''});
   }
   if(name==='portrait'){
    await page.evaluate(()=>__navigationTest.pose());await touch('touchStart',5,x,y);await touch('touchMove',5,x-b.w*.38,y);
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);const rotated=await inspect();assert.equal(rotated.stick,false);assert.equal(rotated.look,false);result.gestures.push({label:'rotation-releases-input',after:rotated});await touch('touchCancel');checkLayout(await layout('rotated'),'rotated');
    await page.setViewportSize({width,height});await page.evaluate(()=>__navigationTest.pose());await page.waitForTimeout(200);
    const delta=Math.max(280,Math.min(width,height))*.35;
    await touch('touchStart',7,rx,ry);await touch('touchMove',7,rx,ry-delta);await page.waitForFunction(()=>BuergeramtLevel.view.pitch===.9);result.camera.push({label:'pitch-up',state:await inspect()});await page.screenshot({path:resolve(out,`${name}-pitch-up.png`)});
    const beforePitchWalk=await inspect();await touch('touchStart',8,x,y);await touch('touchMove',8,x-b.w*.38,y);await page.waitForFunction(distance=>BuergeramtLevel.view.walkedDistance>distance+.1,beforePitchWalk.view.walkedDistance);const pitchWalk=await inspect();assert.equal(pitchWalk.view.pitch,.9);result.camera.push({label:'pitch-retained-while-walking',before:beforePitchWalk,after:pitchWalk});await page.screenshot({path:resolve(out,`${name}-pitch-walking.png`)});await touch('touchEnd',8);
    await touch('touchMove',7,rx,ry+delta);await page.waitForFunction(()=>BuergeramtLevel.view.pitch===-.9);result.camera.push({label:'pitch-down',state:await inspect()});await page.screenshot({path:resolve(out,`${name}-pitch-down.png`)});await touch('touchCancel');
   }
  }else{
   await page.mouse.move(850,400);await page.mouse.down();const before=await inspect();await page.mouse.move(910,350,{steps:4});await page.mouse.up();const after=await inspect();assert.ok(after.view.yaw>before.view.yaw&&after.view.pitch>before.view.pitch);result.gestures.push({label:'desktop-drag',before,after});
   await page.keyboard.down('PageDown');await page.waitForTimeout(120);await page.keyboard.up('PageDown');assert.ok((await inspect()).view.pitch<after.view.pitch);
  }
  if(['portrait','desktop'].includes(name)){
   // Forced approach positions; native E/tap still owns every scene transition.
   const fixtures=[['portrait',3.4,4.9,Math.PI],['mirror',-5.65,4.6,Math.PI],['character',-5.9,2.59,0]];
   for(const [stage,x,z,yaw] of fixtures){
    const approach=await page.evaluate(p=>__navigationTest.pose(...p),[x,z,yaw,.6]);const before=await inspect();const row={label:`native-${stage}-from-nonzero-pitch`,approach,before};result.camera.push(row);
    assert.equal(approach.stage,'walk-sign');assert.equal(approach.blocked,false,'camera approach must be outside solid geometry and people');if(stage!=='character')assert.equal(approach.target,stage,'forced approach must select intended E target');
    if(mobile)await page.locator('#amt-touch-e').tap();else await page.keyboard.press('e');
    await page.waitForFunction(expected=>BuergeramtLevel.stage===expected,stage,{timeout:5000});await page.waitForTimeout(1000);const after=await inspect();
    assert.equal(after.stage,stage);assert.equal(after.stick,false);assert.equal(after.look,false);
    const target=stage==='portrait'?Math.atan2(.54,5.43-z):0;assert.ok(Math.abs(after.view.pitch-target)<.05,`${stage}: scripted pitch owns view`);
    assert.equal(await page.locator('#amt-look-zone').evaluate(e=>getComputedStyle(e).display),'none');
    row.after=after;await page.screenshot({path:resolve(out,`${name}-scripted-${stage}.png`)});
   }
  }
  result.events=await page.evaluate(()=>__navigationEvents);assert.ok(result.events.some(e=>e.trusted&&e.type==='pointermove'));assert.deepEqual(result.errors,[]);result.verdict='PASS';console.log(name,'PASS');await context.close();activePage=null;
 }
 report.complete=true;
}catch(error){report.failure=error.stack;if(activePage){activeResult.verdict='FAIL';activeResult.failureState=await activePage.evaluate(()=>({view:BuergeramtLevel?.view,stage:BuergeramtLevel?.stage,character:BuergeramtLevel?.characterMood,omen:BuergeramtLevel?.omen,focus:document.activeElement.id,events:__navigationEvents,stick:document.getElementById('amt-move-stick')?.classList.contains('is-active'),look:document.getElementById('amt-look-zone')?.classList.contains('is-active')})).catch(()=>null);await activePage.screenshot({path:resolve(out,`${activeResult.name}-failure.png`)}).catch(()=>{})}throw error}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done));}
