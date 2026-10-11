// Silent scripted scene. Production consumers/protocol; an in-memory channel
// replaces WebRTC signaling. This does not prove QR scanning or physical phones.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||(process.env.CODEX_MCP_NODE_PATH?resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'):'playwright'));
const root=resolve('.'),out=resolve('output/playwright/anmeldung');mkdirSync(out,{recursive:true});
const adapter=`\nconst NativeAmtLink=window.BuergeramtLink;window.BuergeramtLink=class extends NativeAmtLink{async start(){const channel=Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send:message=>window.__amtOutbound(JSON.parse(message)),close:()=>{channel.readyState='closed'}});window.__amtChannel=channel;this.attach('test-peer',channel)}};`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,f=resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!f.startsWith(root+sep))throw Error('path');let data=readFileSync(f);if(f===resolve('buergeramt-link.js'))data=data.toString()+adapter;if(f===resolve('game.js'))data=data.toString().replace('window.Germany3DBridge={','window.__registrationState=state;window.Germany3DBridge={').replace('const directConfig={','const directConfig={cinematics:false,');res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
const report={cases:[],limits:['Scripted direct entry and accelerated movement/queue; rendered DOM handlers sweep the full graph; no full city mission-chain or human playtest','Two isolated browser contexts, production protocol over simulated signaling; no natural QR/WebRTC evidence','Android emulation, no physical Android; silent audio state, no listening review'],revision:Object.fromEntries(['buergeramt.js','buergeramt-story.js','buergeramt-phone.js','buergeramt-link.js','world3d.js','game.js','index.html','buergeramt.css','assets/buergeramt/office-detail.js'].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]))};
async function walk(page,x,z){await page.evaluate(({x,z})=>{const level=BuergeramtLevel;for(const[axis,target,pos,neg]of [['x',x,'KeyD','KeyA'],['z',z,'KeyS','KeyW']]){let steps=0;while(Math.abs(level.view[axis]-target)>.07){if(++steps>300)throw Error('Blocked at '+JSON.stringify(level.view)+' going to '+axis+'='+target);const code=level.view[axis]<target?pos:neg;dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));window.__amtUpdate(Math.min(.05,Math.abs(level.view[axis]-target)/3.6));dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}))}}__amtRender()},{x,z})}
async function bounds(page){return page.evaluate(()=>{const targets=['#amt-line','#amt-actions button','#amt-counter-notice','#phone-call-silence','#phone-silence','#anmeldung-badge','#amt-mix summary','#subtitle-toggle','#amt-direct-reset','#amt-objective','.amt-board-hud'];const regions=[...document.querySelectorAll(targets.join(','))].filter(el=>!el.hidden&&el.getClientRects().length).map(el=>({id:el.id||el.textContent,fit:el.dataset.pretextFit,width:el.clientWidth,scroll:el.scrollWidth,height:el.clientHeight,scrollHeight:el.scrollHeight,box:el.getBoundingClientRect().toJSON()}));const upper=regions.filter(el=>!['amt-line','phone-call-silence','phone-silence','anmeldung-badge'].includes(el.id)&&!document.getElementById(el.id)?.closest('#amt-actions')),overlaps=[];for(let i=0;i<upper.length;i++)for(let j=i+1;j<upper.length;j++){const a=upper[i].box,b=upper[j].box;if(Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1)overlaps.push([upper[i].id,upper[j].id])}return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,regions,overlaps}})}
try{
 for(const [name,width,height,n] of [['desktop',1280,800,3],['android-portrait',390,844,1],['android-landscape',844,390,4],['reflow-320',320,720,2]]){
  if(process.env.ANMELDUNG_CASE&&!process.env.ANMELDUNG_CASE.split(',').includes(name))continue;console.log(name,'boot');
  const contextOptions={viewport:{width,height},isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),deviceScaleFactor:1};
  const context=await browser.newContext(contextOptions),phoneContext=await browser.newContext(contextOptions);
  const silentSetup=({n})=>{Math.random=()=>((n-1)+.1)/4;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const g=this.context.createGain();g.gain.value=0;connect.call(g,target);return connect.call(this,g,...args)}return connect.call(this,target,...args)};speechSynthesis.speak=u=>{u.onerror?.()};const request=Element.prototype.requestFullscreen;window.__fullscreenRequests=[];if(request)Element.prototype.requestFullscreen=function(...args){const record={active:navigator.userActivation.isActive,visibility:document.visibilityState};__fullscreenRequests.push(record);return request.apply(this,args).then(value=>{record.allowed=true;return value},error=>{record.error=error.name+': '+error.message;throw error})}};
  await Promise.all([context,phoneContext].map(c=>c.addInitScript(silentSetup,{n})));
  const office=await context.newPage(),phone=await phoneContext.newPage(),errors=[],queue=[];let phoneReady=false;
  for(const p of [office,phone])p.on('pageerror',e=>errors.push(e.message));
  await office.exposeBinding('__amtOutbound',async(_,msg)=>{if(!phoneReady){queue.push(msg);return}await phone.evaluate(msg=>__amtChannel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(msg)})),msg)});
  await phone.exposeBinding('__amtOutbound',async(_,msg)=>office.evaluate(msg=>__amtChannel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(msg)})),msg));
  const started=Date.now();await office.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
  await office.waitForFunction(()=>window.BuergeramtLevel?.active&&Germany3D?.officeAssetsReady,null,{timeout:120000});
  await office.evaluate(()=>{__registrationState.voiceOn=false;window.__amtUpdate=BuergeramtLevel.update;BuergeramtLevel.update=()=>{};window.__amtRender=Germany3D.sync;Germany3D.sync=()=>{}});
  const readyMs=Date.now()-started,url=await office.evaluate(()=>BuergeramtLevel.phoneUrl);await phone.goto(url,{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>!!window.__amtChannel);phoneReady=true;
  for(const msg of queue)await phone.evaluate(msg=>__amtChannel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(msg)})),msg);
  await phone.locator('#phone-ticket:not([hidden])').waitFor();await phone.locator('#phone-name').fill('Erika Anmeldung');await phone.locator('#phone-submit').click();
  await office.waitForFunction(()=>BuergeramtLevel.registeredName==='Erika Anmeldung');
  await walk(office,0,-2.6);
  const x=await office.evaluate(()=>BuergeramtLevel.assignedCounter.x);
  if(n===1){await walk(office,-2,-2.6);await walk(office,-2,-6.4);await walk(office,-5.4,-6.4);await walk(office,-5.4,-8.15);await walk(office,x,-8.15)}else{await walk(office,n===2?-2:3.9,-2.6);await walk(office,n===2?-2:3.9,-8.15);await walk(office,x,-8.15)}
  await office.evaluate(()=>{for(let i=0;i<320;i++)__amtUpdate(.05);__amtRender()});assert.equal(await office.evaluate(()=>BuergeramtLevel.stage),'walk-counter');console.log(name,'assigned');
  await office.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))));const assignedBounds=await bounds(office);assert.deepEqual(assignedBounds.overlaps,[],'office toolbar and assignment do not overlap');await office.screenshot({path:resolve(out,name+'-assigned.png')});
  await office.keyboard.press('e');await office.waitForFunction(()=>BuergeramtLevel.stage==='counter');await office.waitForTimeout(100);const fullscreen=await office.evaluate(()=>!!document.fullscreenElement);
  if(process.env.ANMELDUNG_SHORT){const label=await office.locator('#amt-board-counter').textContent(),display=await office.evaluate(()=>BuergeramtLevel.registrationTicket===document.querySelector('#amt-number-board').textContent);assert.equal(label,display?'SCHALTER '+n:'AUFRUF');report.cases.push({name,verdict:'PASS',scope:'assigned view, native fullscreen and dynamic HUD',counter:n,fullscreen,fullscreenRequests:await office.evaluate(()=>__fullscreenRequests),errors});console.log(name,'short PASS, fullscreen',fullscreen);await Promise.all([context.close(),phoneContext.close()]);continue}
  await phone.locator('#phone-call:not([hidden])').waitFor({timeout:15000});
  await phone.screenshot({path:resolve(out,name+'-ring.png')});
  if(name==='desktop'){
   await phone.locator('#phone-decline').click();await office.waitForFunction(()=>BuergeramtLevel.stage==='phone-warning');
   await office.locator('#amt-actions button').nth(1).click();await phone.locator('#phone-call:not([hidden])').waitFor({timeout:30000});
   await office.waitForFunction(()=>BuergeramtLevel.stage==='phone-warning',{},{timeout:10000});assert.equal(await office.evaluate(()=>BuergeramtLevel.registration.warnings),2);
  }
  await phone.locator('#phone-call-silence').click();await office.waitForFunction(()=>BuergeramtLevel.registration.phoneSilent);await office.locator('#amt-actions button').first().click();
  await office.waitForFunction(()=>document.querySelector('#amt-actions button')?.dataset.pretextFit);
  const questionBounds=await bounds(office);assert.equal(questionBounds.overflow,false);for(const region of questionBounds.regions)assert.ok(region.scroll<=region.width+1,'horizontal overflow '+region.id);
  await office.screenshot({path:resolve(out,name+'-question.png')});
  if(name==='desktop'){
   await office.evaluate(()=>{document.documentElement.style.zoom='2'});await office.waitForTimeout(150);report.zoom=await bounds(office);await office.screenshot({path:resolve(out,'desktop-200-percent.png')});await office.evaluate(()=>{document.documentElement.style.zoom='1'});
  }
  // Entry, telephone controls and the first answer use Playwright input above.
  // Traverse the remaining content through its rendered DOM handlers in one task
  // so repeated layout stabilization does not make this content sweep a GPU test.
  const choices=await office.evaluate(second=>{let count=0;while(BuergeramtLevel.stage!=='success'){const buttons=[...document.querySelectorAll('#amt-actions button')];if(buttons.length!==2)throw Error('Expected two answers at '+BuergeramtLevel.registration.node);buttons[second?1:0].click();if(BuergeramtLevel.stage!=='reply')throw Error('Expected response');document.querySelector('#amt-actions button').click();if(++count>60)throw Error('No completion')}return count},name==='reflow-320');
  assert.equal(await office.evaluate(()=>localStorage.getItem('germany-anmeldung-v1')),'1');await office.screenshot({path:resolve(out,name+'-success.png')});
  const successBounds=await bounds(office);assert.equal(successBounds.overflow,false);assert.deepEqual(errors,[]);
  report.cases.push({name,verdict:'PASS',readyMs,counter:n,choices,fullscreen,questionBounds,successBounds,errors});console.log(name,'PASS',choices,'questions, Schalter',n,'fullscreen',fullscreen);
  await Promise.all([context.close(),phoneContext.close()]);
 }
}catch(error){report.failure=error.stack;throw error}finally{writeFileSync(resolve(out,process.env.ANMELDUNG_REPORT||'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
