import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const noModel=!!process.env.KNICK_NO_MODEL;
const root=resolve('.'),out=resolve('output/playwright/'+(noModel?'knick-backup':'knick-local-speech'));mkdirSync(out,{recursive:true});
let modelTransfers=0,modelTransferBytes=0;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm',
 '.json':'application/json','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.webp':'image/webp',
 '.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2','.ttf':'font/ttf'};
const adapter=`
const NativeSpeechLink=BuergeramtLink;window.BuergeramtLink=class extends NativeSpeechLink{
 async start(){window.__speechLink=this;const host=this;this.attach('fixture',Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send(raw){const m=JSON.parse(raw);if(m.type==='sync-ping')setTimeout(()=>{const now=performance.now();host.dispatchEvent(new CustomEvent('message',{detail:{type:'sync-pong',peer:'fixture',id:m.id,receivedAtMs:now,sentAtMs:now}}))},0)},close(){this.readyState='closed'}}))}
};`;
const seam=`
window.__speechFixture={
 submit(name){const peer='fixture',id='a'.repeat(24);receiveAdmission({type:'scan',id},peer,link);receiveAdmission({type:'register',id,name},peer,link);const ticket=phoneTickets.get(peer);receiveAdmission({type:'ticket-received',id,number:ticket.number},peer,link);return{number:ticket.number,counter:ticket.counter}},
 advance(seconds){const start=visualClock;for(let i=0;visualClock-start<seconds&&i<seconds*80;i++)update(.05)},
 pose(){clearOfficeInput();Object.assign(view,{x:2.8,z:-6.4,yaw:0,pitch:0});update(0)},
 inspect(){return{stage,tickets:[...phoneTickets.values()].map(t=>({number:t.number,counter:t.counter,called:t.called,deadline:t.deadline,speech:t.speech?.status})),speechBusy:officeSpeechBusy,cue,attempt,visualClock,queueClock,queueCallPending,queueCallReadyAt,namedTicket:queueNamedTicket?.number,queueCallSpeaking,counterCalls:counterCalls.slice()}}
};`;
const server=createServer((req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
 if(!file.startsWith(root+sep))throw Error('path');let bytes=readFileSync(file);
 if(file===resolve('buergeramt-link.js'))bytes=bytes.toString()+adapter;
 if(file===resolve('buergeramt.js'))bytes=bytes.toString().replace('window.BuergeramtLevel={',seam+'window.BuergeramtLevel={');
 if(file===resolve('game.js'))bytes=bytes.toString().replace('const directConfig={','const directConfig=window.__speechConfig={cinematics:false,');
 if(noModel&&file===resolve('knick-speech-worker.js'))bytes='WebAssembly.validate=()=>false;\n'+bytes.toString();
 if(path.endsWith('.onnx.bin')){modelTransfers++;modelTransferBytes+=bytes.length}
 const immutable=path.endsWith('.onnx.bin')||path.startsWith('/assets/vendor/');
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':immutable?'public,max-age=31536000,immutable':'no-cache'});res.end(bytes);
}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const base=`http://127.0.0.1:${server.address().port}`,report={complete:false,browser:browser.version(),
 evidence:'Headless Chromium; local static assets, simulated admission signaling, production speech worker/renderer/controllers. Legal pose and accelerated scene clock are fixture seams. No physical phone or listening evidence.',cases:[]};
const silent=()=>{
 const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.volume=0;return play.apply(this,args)};
 const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target instanceof AudioDestinationNode){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
 const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
 window.__nameMedia=[];
 window.__recordingEvents=[];const NativeAudio=Audio;window.Audio=function(src){const media=new NativeAudio(src);media.volume=0;media.addEventListener('playing',()=>__recordingEvents.push(media.src));return media};
 document.addEventListener('playing',event=>{if(event.target instanceof HTMLMediaElement&&event.target.src.startsWith('blob:'))__nameMedia.push({event:'playing',at:performance.now()})},true);
};
try{
 for(const [name,width,height,mobile] of (process.env.KNICK_UI_ONLY?[]:[['desktop',1280,800,false],['android-portrait',390,844,true],['android-landscape',844,390,true]])){
  if(process.env.KNICK_CASE&&!process.env.KNICK_CASE.split(',').includes(name))continue;
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});await context.addInitScript(silent);
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
  const transferStart=modelTransfers,byteStart=modelTransferBytes;
  page.on('request',request=>requests.push(request.url()));
  console.log(name+' office boot');await page.goto(base+'/?geheim=buergeramt',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>BuergeramtLevel?.active&&Germany3D?.officeAssetsReady&&window.__speechFixture,null,{timeout:120000});
  assert(!requests.some(url=>url.includes('/knick/browser/')||url.includes('/onnxruntime/')),'no model before a name');
  await page.keyboard.press('KeyW');await page.evaluate(()=>{__speechFixture.pose();const sync=Germany3D.sync;window.__nameFrames=[];Germany3D.sync=function(...args){if(GermanyKnickSpeech.inspect().active)__nameFrames.push(performance.now());return sync.apply(this,args)}});const ticket=await page.evaluate(()=>__speechFixture.submit('Erika Mustermann'));
  if(noModel){
   await page.waitForFunction(()=>__speechFixture.inspect().tickets[0]?.speech==='failed',null,{timeout:10000});
   await page.evaluate(()=>{__speechFixture.pose();__speechFixture.advance(12)});
   await page.waitForFunction(()=>document.getElementById('amt-ambient').textContent==='FRAU KNICK: '+BuergeramtStory.queueCall.line,null,{timeout:20000});
   assert.equal(await page.evaluate(()=>BuergeramtLevel.lipSpeech.actor),`clerk-${ticket.counter}`);
   assert.equal(await page.evaluate(()=>__recordingEvents.some(src=>new URL(src).pathname===new URL(GermanySimulatorAudioText.recordedClip(BuergeramtStory.queueCall.voiceId,BuergeramtStory.queueCall.line),location.href).pathname)),true,'backup recording actually plays');
   assert.equal(modelTransfers-transferStart,0);assert(!requests.some(url=>url.includes('/onnxruntime/')));assert.deepEqual(errors,[]);
   await page.screenshot({path:resolve(out,name+'-announcement.png')});report.cases.push({name,backup:'accepted recorded next caller',counter:ticket.counter,modelTransfers:0,errors});await context.close();continue;
  }
  const started=Date.now();await page.waitForFunction(()=>GermanyKnickSpeech.inspect().active);
  const before=await page.evaluate(()=>BuergeramtLevel.view.yaw),inputStart=Date.now();await page.keyboard.down('ArrowRight');
  await page.waitForFunction(yaw=>BuergeramtLevel.view.yaw!==yaw,before,{timeout:2000});await page.keyboard.up('ArrowRight');const inputMs=Date.now()-inputStart;
  await page.waitForFunction(()=>['ready','failed'].includes(__speechFixture.inspect().tickets[0]?.speech),null,{timeout:180000});
  assert.equal(await page.evaluate(()=>__speechFixture.inspect().tickets[0]?.speech),'ready','real worker synthesis must succeed');
  const coldMs=Date.now()-started;const during=await page.evaluate(()=>{const times=__nameFrames.slice(1).map((t,i)=>t-__nameFrames[i]).sort((a,b)=>a-b);return{frames:__nameFrames.length,p95:times[Math.floor(times.length*.95)]}});assert(during.frames>5);
  const wav=await page.evaluate(async counter=>{
   const prepared=await GermanyKnickSpeech.prepare('Erika Mustermann',counter);
   return {bytes:Array.from(new Uint8Array(await prepared.blob.arrayBuffer())),duration:prepared.duration,generationMs:prepared.generationMs};
  },ticket.counter);
  writeFileSync(resolve(out,name+'-erika.wav'),Buffer.from(wav.bytes));
  await page.evaluate(()=>{__speechFixture.pose();__speechFixture.advance(12)});
  await page.waitForFunction(()=>document.getElementById('amt-ambient').textContent.startsWith('FRAU KNICK: Erika Mustermann, bitte zu Schalter '),null,{timeout:20000}).catch(async error=>{const diagnostic=await page.evaluate(()=>({state:__speechFixture.inspect(),cache:GermanyKnickSpeech.inspect(),ambient:document.getElementById('amt-ambient').textContent,lip:BuergeramtLevel.lipSpeech,events:__nameMedia}));console.log(JSON.stringify({name,diagnostic}));writeFileSync(resolve(out,name+'-failure.json'),JSON.stringify(diagnostic,null,2));await page.screenshot({path:resolve(out,name+'-failure.png')});throw error});
  assert.equal(await page.evaluate(()=>BuergeramtLevel.lipSpeech.actor),`clerk-${ticket.counter}`);
  await page.screenshot({path:resolve(out,name+'-announcement.png')});
  await page.waitForFunction(()=>!BuergeramtLevel.audioTextBusy,null,{timeout:20000});
  const warmed=await page.evaluate(async()=>{
   const start=performance.now(),result=await GermanyKnickSpeech.prepare('Jürgen Müller',3);
   return {status:result.status,ms:performance.now()-start,generationMs:result.generationMs,duration:result.duration};
  });assert.equal(warmed.status,'ready');
  await page.waitForFunction(()=>!GermanyKnickSpeech.inspect().worker,null,{timeout:15000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(modelTransfers-transferStart,1,'an idle worker restart reuses the in-memory model buffer');
  assert.equal(await page.evaluate(async()=>typeof caches==='undefined'||!(await caches.keys()).some(key=>key.startsWith('knick-speech-model'))),true,'no persistent speech model cache');
  assert(!requests.some(url=>url.includes('Erika')||url.includes('Mustermann')||url.includes('Müller')),'names never enter HTTP requests');
  assert.deepEqual(errors,[]);report.cases.push({name,coldMs,warmed,inputDuringPreparationMs:inputMs,renderDuringPreparation:during,announcementSeconds:wav.duration,
   generationMs:wav.generationMs,modelTransfers:modelTransfers-transferStart,modelTransferBytes:modelTransferBytes-byteStart,idleWorkerReleased:true,errors});
  console.log(name+' PASS '+JSON.stringify(report.cases.at(-1)));await context.close();
 }
 if(!noModel&&!process.env.KNICK_NAMES_ONLY){
 const context=await browser.newContext({viewport:{width:1280,height:800}});await context.addInitScript(silent);
 await context.addInitScript(value=>window.__uiOnly=value,!!process.env.KNICK_UI_ONLY);
 const page=await context.newPage(),requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Germany3D?.startupReady&&!document.body.classList.contains('preloading'),null,{timeout:120000});
 if(process.env.KNICK_UI_ONLY)await page.evaluate(()=>document.getElementById('voice-toggle').click());
 await page.locator('#start').click();await page.locator('#humor-name').fill('Jürgen Müller');await page.locator('#humor-title').click();
 await page.waitForFunction(()=>GermanyKnickSpeech.initialName==='Jürgen Müller'&&GermanyKnickSpeech.inspect().cached===(window.__uiOnly?0:4),null,{timeout:180000});
 assert.equal(await page.locator('#humor-name').getAttribute('autocomplete'),'name');
 assert.equal(await page.locator('#humor-name').getAttribute('maxlength'),'80');
 const fit=await page.locator('#humor-name').evaluate(el=>({label:el.parentElement.querySelector('span').dataset.pretextFit,
  overflow:document.documentElement.scrollWidth>innerWidth+1}));assert.equal(fit.overflow,false);assert(fit.label&&fit.label!=='unavailable');
 await page.screenshot({path:resolve(out,'first-form-name.png')});
 report.cases.push({name:'opening-form',preparedVariants:process.env.KNICK_UI_ONLY?0:4,nameOrigin:'typed initial form',fit});await context.close();
 for(const [label,width,height,language,zoom] of [['name-320-de',320,844,'de',1],['name-320-en',320,844,'en',1],['name-zoom-de',1280,800,'de',2],['name-zoom-en',1280,800,'en',2]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width===320,hasTouch:width===320});await ctx.addInitScript(silent);
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.Germany3D?.startupReady&&!document.body.classList.contains('preloading'),null,{timeout:120000});
  if(language==='en')await p.locator('[data-lang="en"]').click();await p.evaluate(()=>document.getElementById('voice-toggle').click());
  await p.locator('#start').click();if(zoom!==1)await p.evaluate(z=>{document.documentElement.style.zoom=z;dispatchEvent(new Event('resize'))},zoom);
  await p.locator('#humor-name').fill('Alexandra-Christiane Müller-Lüdenscheidt');await p.locator('#humor-name').blur();await p.locator('#humor-name').evaluate(el=>el.scrollIntoView({block:'center'}));
  await p.waitForFunction(()=>document.querySelector('#humor-name')?.parentElement.querySelector('span').dataset.measurement==='pretext-0.0.9');
  const geometry=await p.locator('#humor-name').evaluate(el=>{const l=el.parentElement.querySelector('span'),r=el.getBoundingClientRect(),lr=l.getBoundingClientRect(),paper=document.querySelector('.humor-paper').getBoundingClientRect();return{label:l.textContent,fit:l.dataset.pretextFit,measurement:l.dataset.measurement,optional:!el.required,verticalBounds:[r.top,r.bottom],verticalVisible:r.top>=0&&r.bottom<=Math.min(innerHeight,document.getElementById('english-subtitle').hidden?innerHeight:document.getElementById('english-subtitle').getBoundingClientRect().top),viewport:innerWidth,zoom:getComputedStyle(document.documentElement).zoom,variable:getComputedStyle(document.body).getPropertyValue('--humor-viewport-width'),paperBounds:[paper.left,paper.right],paperInside:paper.left>=0&&paper.right<=innerWidth+1,inside:r.left>=0&&r.right<=innerWidth+1,labelInside:lr.left>=0&&lr.right<=innerWidth+1,overflow:document.documentElement.scrollWidth>innerWidth+1}});
  if(!geometry.paperInside)console.log(JSON.stringify({label,geometry}));assert(geometry.optional&&geometry.inside&&geometry.labelInside&&geometry.paperInside&&geometry.verticalVisible);assert(!geometry.overflow);assert.notEqual(geometry.fit,'unavailable');assert.deepEqual(errors,[]);
  await p.screenshot({path:resolve(out,label+'.png')});report.cases.push({name:label,language,zoom,geometry,errors});await ctx.close();
 }
 }
 report.complete=true;
}catch(error){report.failure=error.stack;throw error}finally{
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));
}
