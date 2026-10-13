// Silent two-context production protocol and UI; simulated signaling/visibility,
// seeded counter approach and accelerated caption-only reading (not audio timing).
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'));
const root=resolve('.'),out=resolve('output/playwright/schalter');mkdirSync(out,{recursive:true});
const adapter=`const NativeLink=BuergeramtLink;window.BuergeramtLink=class extends NativeLink{async start(){const channel=Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send:data=>window.__outbound(JSON.parse(data)),close(){this.readyState='closed'}});window.__channel=channel;this.attach('fixture-peer',channel)}};`;
const seam=`window.__schalter={approach(){for(let i=0;i<400&&stage==='waiting';i++)update(.05);if(stage!=='walk-counter')throw Error(stage);Object.assign(view,{x:counter.x,z:-8.15,yaw:0,pitch:0});},replay(){replayConfig=options;close(false);open(replayConfig)}};let replayConfig;`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://local').pathname,f=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!f.startsWith(root+sep))throw Error('path');let data=readFileSync(f);if(f===resolve('buergeramt-link.js'))data=data.toString()+'\n'+adapter;if(f===resolve('game.js'))data=data.toString().replace('const directConfig={','const directConfig={cinematics:false,').replace('window.Germany3DBridge={','window.__schalterState=state;window.Germany3DBridge={');if(f===resolve('buergeramt.js'))data=data.toString().replace('window.BuergeramtLevel={',seam+'window.BuergeramtLevel={').replace(/function speechReadableMs\(text,delivery\)\{[^\n]+\}/,'function speechReadableMs(){return 40}');res.writeHead(200,{'content-type':mime[extname(f)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
const report={cases:[],limits:['Simulated signaling and phone visibility; no real QR/WebRTC or physical-phone evidence','Counter approach seeded after real ticket receipt and board call; not natural traversal','Caption reading accelerated; native phone audio remains enabled but all outputs muted; no listening review']};
try{
 for(const [name,width,height,zoom]of [['desktop',1280,800,1],['android-portrait',390,844,1],['android-landscape',844,390,1],['reflow-320',320,720,1],['zoom-200',640,900,2]]){
  if(process.env.SCHALTER_CASE&&!process.env.SCHALTER_CASE.split(',').includes(name))continue;
  console.log(name,'boot');const mobile=name.startsWith('android'),opts={viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile};
  const hostContext=await browser.newContext(opts),phoneContext=await browser.newContext(opts);
  for(const c of [hostContext,phoneContext])await c.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   speechSynthesis.speak=u=>u.onerror?.();window.__media=[];const NativeAudio=Audio;window.Audio=function(src){const media=new NativeAudio(src);media.muted=true;__media.push(media);return media};
  });
  const office=await hostContext.newPage(),phone=await phoneContext.newPage(),errors=[],messages=[],pending=[];let ready=false;
  for(const p of [office,phone])p.on('pageerror',e=>errors.push(e.message));
  await office.exposeBinding('__outbound',async(_,m)=>{messages.push({sender:'host',...m});if(!ready){pending.push(m);return}if(!phone.isClosed())await phone.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m)});
  await phone.exposeBinding('__outbound',async(_,m)=>{messages.push({sender:'phone',...m});if(!office.isClosed())await office.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m)});
  await office.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
  await office.waitForFunction(()=>BuergeramtLevel.active&&Germany3D?.officeAssetsReady,null,{timeout:120000});
  await office.evaluate(()=>{__schalterState.voiceOn=false;window.__normalUpdate=BuergeramtLevel.update;BuergeramtLevel.update=()=>{}});
  const url=await office.evaluate(()=>BuergeramtLevel.phoneUrl);await phone.goto(url,{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>window.__channel);ready=true;for(const m of pending)await phone.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m);
  await phone.locator('#phone-submit:not([disabled])').waitFor();await phone.locator('#phone-name').fill('Erika Anmeldung');await phone.locator('#phone-submit').click();await office.waitForFunction(()=>BuergeramtLevel.activated);
  await office.evaluate(()=>__schalter.approach());await office.keyboard.press('e');await phone.locator('#phone-call:not([hidden])').waitFor();
  await office.waitForFunction(()=>BuergeramtLevel.registration.warnings===1);assert.equal(await office.getByRole('button',{name:'Telefon auf lautlos schalten.',exact:true}).count(),0);
  await phone.screenshot({path:resolve(out,name+'-incoming.png')});
  if(name==='desktop'){
   await phone.locator('#phone-call').waitFor({state:'hidden',timeout:20000});
   await phone.locator('#phone-call:not([hidden])').waitFor({timeout:35000});await office.waitForFunction(()=>BuergeramtLevel.registration.warnings===2);
   const rings=messages.filter(m=>m.type==='call-ringing');assert.equal(rings.length,2);assert(rings[1].round>rings[0].round);assert(messages.some(m=>m.type==='call-missed'));
  }else await phone.locator('#phone-decline').click();
  await phone.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  await office.waitForFunction(()=>BuergeramtLevel.registration.phoneSilent);await office.locator('#amt-actions button:not([disabled])').first().waitFor();
  if(zoom!==1)await office.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);BuergeramtFit()},zoom);
  await office.waitForFunction(()=>document.getElementById('amt-status').dataset.pretextFit);
  await office.screenshot({path:resolve(out,name+'-question.png')});
  let questions=0;while(await office.evaluate(()=>BuergeramtLevel.stage!=='success')){assert(++questions<=60);await office.locator('#amt-actions button:not([disabled])').nth(name==='reflow-320'?1:0).click();await office.waitForTimeout(130);await office.locator('#amt-actions button:not([disabled])').first().waitFor()}
  assert.equal(questions,name==='reflow-320'?52:10);
  const result=await office.evaluate(()=>({registration:BuergeramtLevel.registration,status:document.getElementById('amt-status').textContent,fit:document.getElementById('amt-status').dataset.pretextFit,overflow:document.documentElement.scrollWidth>innerWidth+1,statusBox:document.getElementById('amt-status').getBoundingClientRect().toJSON(),statusOverflow:document.getElementById('amt-status').scrollWidth>document.getElementById('amt-status').clientWidth+1}));
  assert.equal(result.overflow,false);assert.equal(result.statusOverflow,false);assert(result.statusBox.width>100&&result.statusBox.height>10,'score must be visible at compact sizes');assert.notEqual(result.fit,'unavailable');if(name!=='reflow-320')assert.equal(result.registration.points,10);
  await office.screenshot({path:resolve(out,name+'-success.png')});assert.deepEqual(errors,[]);report.cases.push({name,questions,result,ringReceipts:messages.filter(m=>m.type==='call-ringing'),errors});console.log(name,'PASS',questions,'questions');
  ready=false;await hostContext.close();await phoneContext.close();
 }
}catch(error){report.failure=error.stack;throw error}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));server.closeAllConnections();await browser.close();await new Promise(done=>server.close(done))}
