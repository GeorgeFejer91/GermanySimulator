// Silent production keyboard paths, real WebGL screenshots and reflected poses.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/playwright/potato-mirror');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert(file.startsWith(root+sep));res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file))}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=(process.env.MIRROR_ORIGIN||`http://127.0.0.1:${server.address().port}`).replace(/\/$/,'');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
const report={cases:[],limits:['Office direct entry and replay disable the unrelated opening cinematic; approach/movement use real keyboard handlers and collision','Silent speech lifecycle; no perceptual listening or physical Android evidence']};
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}],['reflow-320',{width:320,height:640}],['zoom-200',{width:640,height:960}],['reduced-motion',{width:1280,height:800}],['missing-art',{width:1280,height:800}]]){
  if(process.env.MIRROR_CASE&&name!==process.env.MIRROR_CASE)continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference'}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));page.on('console',message=>{if(message.type()==='error'&&/WebGLProgram|GL_INVALID|VALIDATE_STATUS/.test(message.text()))errors.push(message.text())});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   window.__machine=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){this.speaking=false},speak(u){__machine.push(u.text);this.speaking=true;u.onstart?.();window.__mirrorUtterance=u}}});
  });
  if(name==='missing-art')await page.route('**/assets/buergeramt/**/*.webp*',r=>r.abort());
  await page.goto(`${origin}/?geheim=buergeramt`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active,null,{timeout:120000});
  if(name==='zoom-200')await page.addStyleTag({content:'html{zoom:2}'});
  const approach=await page.evaluate(()=>{
   const level=BuergeramtLevel;window.__mirrorEnglish=true;level.replay({cinematics:false,voiceOn:()=>true,subtitlesOn:()=>__mirrorEnglish,onClose:()=>{}});
   const update=level.update.bind(level);level.update=()=>{};window.__mirrorUpdate=update;
   const hold=(code,count)=>{dispatchEvent(new KeyboardEvent('keydown',{code}));for(let i=0;i<count;i++)update(1/60);dispatchEvent(new KeyboardEvent('keyup',{code}));};
   window.__mirrorHold=hold;
   // Pass north of the roaming Nummernflüsterer and the two queue barriers.
   const move=(code,reached)=>{let count=0;while(!reached()&&count++<900)hold(code,1);if(!reached())throw Error('Blocked approach '+code+': '+JSON.stringify(level.view));};
   move('KeyW',()=>level.view.z<=2.45);move('KeyA',()=>level.view.x<=-5.65);move('KeyS',()=>level.view.z>=3.0);
   dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowRight'}));update(.05);
   for(let i=0;i<110&&level.view.yaw<Math.PI-.0001;i++)update(Math.min(1/60,(Math.PI-level.view.yaw)/1.8));
   dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowRight'}));update(0);Germany3D.sync();
   return{view:level.view,prompt:document.getElementById('amt-nearby').textContent,stage:level.stage,reflection:Germany3D.amtPotatoMirror,characters:level.characters.map(a=>({id:a.id,x:a.x,z:a.z}))};
  });
  if(approach.prompt!=='E · SPIEGEL BETRACHTEN')console.log(JSON.stringify(approach));
  assert.equal(approach.prompt,'E · SPIEGEL BETRACHTEN');assert.equal(approach.stage,'walk-sign');assert.equal(approach.reflection.visible,true);
  await page.screenshot({path:resolve(out,name+'-front.png')});
  const motion=await page.evaluate(()=>{
   const level=BuergeramtLevel,poses=[];const sample=()=>{Germany3D.sync();poses.push({view:level.view,mirror:Germany3D.amtPotatoMirror})};
   // Sample between accepted inputs, rather than fabricating reflection state.
   dispatchEvent(new KeyboardEvent('keydown',{code:'KeyA'}));for(let i=0;i<6;i++){__mirrorUpdate(1/60);sample()}dispatchEvent(new KeyboardEvent('keyup',{code:'KeyA'}));
   dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<10;i++){__mirrorUpdate(1/60);sample()}dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));
   __mirrorHold('ArrowRight',6);sample();__mirrorUpdate(0);sample();return poses;
  });
  for(const row of motion){const s=row.mirror.mirror;assert(Math.abs(row.mirror.pose.x-row.view.x)<1e-9);assert(Math.abs(row.mirror.pose.z-s.z-(s.z-row.view.z))<1e-9);assert(Math.abs(row.mirror.pose.yaw-Math.PI-row.view.yaw)<1e-9)}
  assert(motion.slice(0,6).some(row=>row.mirror.joints.some(([x,z])=>Math.abs(z)>0)),'strafe articulates legs');
  if(!motion.slice(6,16).some(row=>row.mirror.joints.some(([x])=>Math.abs(x)>0)))console.log(JSON.stringify({approach:approach.view,motion:motion.map(row=>({view:row.view,pose:row.mirror.pose,joints:row.mirror.joints}))}));
  assert(motion.slice(6,16).some(row=>row.mirror.joints.some(([x])=>Math.abs(x)>0)),'forward travel articulates legs');
  assert(motion.at(-1).mirror.joints.every(([x,z])=>x===0&&z===0),'stopped joints plant');
  await page.screenshot({path:resolve(out,name+'-turned.png')});
  const blocked=await page.evaluate(()=>{__mirrorHold('ArrowLeft',6);dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'}));__mirrorHold('KeyW',80);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyR'}));__mirrorUpdate(0);Germany3D.sync();Germany3D.sync();return{view:BuergeramtLevel.view,mirror:Germany3D.amtPotatoMirror}});
  assert(blocked.view.z+.22<=5.14+.001);assert(blocked.mirror.joints.every(([x,z])=>x===0&&z===0));
  await page.keyboard.press('e');await page.waitForFunction(()=>BuergeramtLevel.stage==='mirror');
  await page.waitForFunction(()=>__machine.includes('Bin ich wirklich eine deutsche Kartoffel?'));
  await page.waitForFunction(()=>document.getElementById('english-subtitle').dataset.measurement==='pretext-0.0.9');
  const speech=await page.evaluate(()=>({speaker:document.getElementById('amt-speaker').textContent,line:document.getElementById('amt-line').textContent,english:document.getElementById('english-subtitle').textContent,lookups:__machine.filter(line=>line==='Bin ich wirklich eine deutsche Kartoffel?').length}));
  assert.equal(speech.speaker,'ICH');assert.equal(speech.line,'Bin ich wirklich eine deutsche Kartoffel?');assert.equal(speech.english,'Am I really a German potato?');
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__machine.filter(line=>line==='Bin ich wirklich eine deutsche Kartoffel?').length),1);
  const caption=await page.locator('#english-subtitle').evaluate(el=>{const r=el.getBoundingClientRect();return{fit:el.dataset.measurement,left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}});
  assert.notEqual(caption.fit,'unavailable');assert(caption.scrollWidth<=caption.clientWidth+1);assert(caption.scrollHeight<=caption.clientHeight+1);assert(caption.left>=0&&caption.right<=viewport.width+1&&caption.top>=0&&caption.bottom<=viewport.height+1);
  await page.screenshot({path:resolve(out,name+'-remark.png')});
  const german=await page.evaluate(()=>{__mirrorEnglish=false;BuergeramtLevel.refreshSubtitle();const box=document.getElementById('english-subtitle');return box.hidden?document.getElementById('amt-line').textContent:box.textContent});assert.equal(german,'Bin ich wirklich eine deutsche Kartoffel?');
  await page.evaluate(()=>{__mirrorUtterance.onend?.();__mirrorUpdate(1/60)});assert.equal(await page.evaluate(()=>BuergeramtLevel.stage),'walk-sign');
  await page.evaluate(()=>{__mirrorHold('KeyA',22);__mirrorHold('ArrowRight',29);Germany3D.sync()});
  await page.screenshot({path:resolve(out,name+'-aperture-edge.png')});
  await page.evaluate(()=>{__mirrorHold('ArrowLeft',29);__mirrorHold('KeyD',22);__mirrorUpdate(0);Germany3D.sync()});
  // Resize with a stationary reflection and resume the same production view.
  await page.setViewportSize({width:viewport.height,height:viewport.width});await page.evaluate(()=>Germany3D.sync());assert.equal(await page.evaluate(()=>Germany3D.amtPotatoMirror.visible),true);
  const closed=await page.evaluate(()=>{document.getElementById('amt-leave').click();Germany3D.sync();return{active:BuergeramtLevel.active,stage:BuergeramtLevel.stage,mirror:Germany3D.amtPotatoMirror,hidden:document.hidden}});if(closed.mirror.visible)console.log(JSON.stringify({closed}));assert.equal(closed.mirror.visible,false);
  await page.screenshot({path:resolve(out,name+'-closed.png')});
  assert.deepEqual(errors,[]);report.cases.push({name,approach,motion,blocked,speech,caption,errors,mirrorRequests:requests.filter(url=>url.includes('potato-mirror'))});
  await context.close();console.log(JSON.stringify({name,passed:true}));
 }
 const context=await browser.newContext();await context.addInitScript(()=>{const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)}});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`${origin}/3d.html`);await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:120000});assert.deepEqual(errors,[]);await context.close();
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
}finally{await browser.close();server.close()}
