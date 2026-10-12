// Silent real-media queue checks; direct office entry, simulated signaling.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright'),root=resolve('.'),out=resolve('output/queue-call/browser');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};
const adapter=`\nconst NativeLink=BuergeramtLink;window.BuergeramtLink=class extends NativeLink{async start(){this.attach('fixture',Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send(){},close(){this.readyState='closed'}}))}};`;
const server=createServer((req,res)=>{try{const p=new URL(req.url,'http://local').pathname,f=resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!f.startsWith(root+sep))throw Error('path');let data=readFileSync(f);if(f===resolve('buergeramt-link.js'))data=data.toString()+adapter;if(f===resolve('game.js'))data=data.toString().replace('window.Germany3DBridge={','window.__queueAudioState=state;window.Germany3DBridge={').replace('const directConfig={','const directConfig=window.__queueConfig={cinematics:false,');res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--use-gl=angle','--use-angle=d3d11']});
const files=['buergeramt.js','buergeramt-story.js','buergeramt-lips.js','buergeramt-lipsync.js','buergeramt-gaussian-scene.js','world3d.js','assets/buergeramt/speech/mouth-cues.js','For-AI/AUDIO-TEXT-LIBRARY.js','assets/voices/knick/knick-queue-call.mp3','assets/voices/knick/queue-call-manifest.json'];
const report={revision:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),cases:[],limits:['Direct entry and simulated signaling, trusted keyboard movement then accelerated production movement for close capture; no natural city or physical QR flow','Close capture freezes the rendered frame at an observed early real-media playhead','Silent actual MP3 playback/OfflineAudioContext; no perceptual listening','Android emulation, no physical Android']};
try{for(const [name,width,height,failed] of [['desktop',1280,800,false],['android-portrait',390,844,false],['android-landscape',844,390,false],['missing-recording',390,844,true]]){
 if(process.env.QUEUE_AUDIO_CASE&&!process.env.QUEUE_AUDIO_CASE.split(',').includes(name))continue;
 const ctx=await browser.newContext({viewport:{width,height},isMobile:name!=='desktop',hasTouch:name!=='desktop'});
 await ctx.addInitScript(()=>{
  window.__queueSound={beeps:[],media:[]};window.__queueNativeConnect=AudioNode.prototype.connect;
  const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...a){if(target===this.context.destination){const g=this.context.createGain();g.gain.value=0;connect.call(g,target);return connect.call(this,g,...a)}return connect.call(this,target,...a)};
  const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...a){if(this.type==='square')__queueSound.beeps.push({hz:this.frequency.value,at:performance.now()});return start.apply(this,a)};
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){this.muted=true;this.volume=0;if(this.src.includes('knick-queue-call.mp3')&&!this.__queueObserved){this.__queueObserved=true;for(const event of ['playing','ended','error'])this.addEventListener(event,()=>setTimeout(()=>__queueSound.media.push({event,time:performance.now(),src:this.src,caption:document.getElementById('amt-ambient')?.textContent,actor:window.BuergeramtLevel?.lipSpeech.actor,active:window.BuergeramtLevel?.lipSpeech.active}),0))}return play.apply(this,a)};
  speechSynthesis.speak=u=>{u.volume=0;u.onerror?.()};
 });
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));if(failed)await page.route('**/knick-queue-call.mp3*',route=>route.fulfill({status:404,body:''}));
 await page.goto(base+'/?geheim=buergeramt',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.BuergeramtLevel?.active&&Germany3D?.officeAssetsReady,null,{timeout:90000});
 await page.evaluate(()=>{__queueAudioState.voiceOn=true});
 // Real trusted keyboard input, with the original movement/collision loop.
 await page.keyboard.down('KeyW');await page.waitForTimeout(1200);await page.keyboard.up('KeyW');await page.keyboard.down('KeyD');await page.waitForTimeout(1000);await page.keyboard.up('KeyD');await page.keyboard.down('KeyW');await page.waitForTimeout(2800);await page.keyboard.up('KeyW');
 if(failed){await page.waitForFunction(()=>document.getElementById('amt-ambient').textContent==='FRAU KNICK: Nächste bitte!',null,{timeout:9000});assert.equal(await page.evaluate(()=>__queueSound.media.some(e=>e.event==='playing')),false)}
 else{await page.waitForFunction(()=>__queueSound.media.some(e=>e.event==='playing'&&e.caption==='FRAU KNICK: Nächste bitte!'&&e.actor==='clerk-3'),null,{timeout:10000});await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.actor==='clerk-3'&&BuergeramtLevel.lipSpeech.active&&document.getElementById('amt-ambient').textContent==='FRAU KNICK: Nächste bitte!',null,{timeout:10000})}
 let peak=null;
 if(!failed){
  await page.evaluate(()=>{window.__queueStep=BuergeramtLevel.update;BuergeramtLevel.update=()=>{};window.__queueRender=Germany3D.sync;BuergeramtLevel.replay(__queueConfig)});
  for(const [x,z] of [[1,-2.6],[-2,-2.6],[-2,-6.4],[2.8,-6.4],[2.8,-8.15],[3.9,-8.15]])await page.evaluate(({x,z})=>{
   for(const [axis,target,pos,neg] of [['x',x,'KeyD','KeyA'],['z',z,'KeyS','KeyW']]){let steps=0;while(Math.abs(BuergeramtLevel.view[axis]-target)>.07){if(++steps>300)throw Error('Blocked at '+JSON.stringify(BuergeramtLevel.view));const code=BuergeramtLevel.view[axis]<target?pos:neg;dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));__queueStep(Math.min(.05,Math.abs(BuergeramtLevel.view[axis]-target)/3.6));dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}))}}__queueRender();
  },{x,z});
  await page.evaluate(()=>{BuergeramtLevel.update=__queueStep});
  try{await page.waitForFunction(()=>Germany3D.amtGaussian.actors.some(a=>a.id==='clerk'&&a.visible),null,{timeout:15000})}catch(error){report.captureFailure=await page.evaluate(()=>({view:BuergeramtLevel.view,stage:BuergeramtLevel.stage,gaussian:Germany3D.amtGaussian,actors:Germany3D.amtCharacters}));await page.screenshot({path:resolve(out,name+'-capture-failure.png')});throw error}
  await page.waitForFunction(()=>{const s=BuergeramtLevel.lipSpeech;if(s.actor!=='clerk-3'||s.time<.8||s.time>.96||s.shape[0]<.5)return false;__queueRender();window.__queuePeak={view:BuergeramtLevel.view,caption:document.getElementById('amt-ambient').textContent,lip:BuergeramtLevel.lipSpeech,gaussian:Germany3D.amtGaussian};Germany3D.sync=()=>{};return true},null,{timeout:12000});
  peak=await page.evaluate(()=>__queuePeak);assert.equal(peak.caption,'FRAU KNICK: Nächste bitte!');assert.ok(peak.gaussian.actors.some(a=>a.id==='clerk'&&a.visible));
 }
 await page.screenshot({path:resolve(out,name+'-call.png')});
 if(!failed)await page.evaluate(()=>{Germany3D.sync=__queueRender});
 const before=await page.evaluate(()=>({view:BuergeramtLevel.view,stage:BuergeramtLevel.stage,caption:document.getElementById('amt-ambient').textContent,lip:BuergeramtLevel.lipSpeech,sound:__queueSound,overflow:document.documentElement.scrollWidth>innerWidth+1}));assert.equal(before.overflow,false);assert.ok(before.sound.beeps.some(e=>e.hz===1480)&&before.sound.beeps.some(e=>e.hz===1960));
 const beepSource=readFileSync('buergeramt.js','utf8'),a=beepSource.indexOf('function queueBeep(){'),b=beepSource.indexOf('function playQueueCall()',a);
 const pcm=await page.evaluate(async code=>{const ctx=new OfflineAudioContext(1,24000,48000),fx=ctx.createGain();__queueNativeConnect.call(fx,ctx.destination);Function('mix','initOfficeAudio',code+'queueBeep()')({fx:1},()=>({ctx,fx}));const samples=(await ctx.startRendering()).getChannelData(0);let peak=0,sum=0,clipped=0;for(const v of samples){peak=Math.max(peak,Math.abs(v));sum+=v*v;if(Math.abs(v)>=1)clipped++}return{seconds:samples.length/48000,peak,rms:Math.sqrt(sum/samples.length),clipped,tail:Math.max(...samples.slice(18000).map(Math.abs))}},beepSource.slice(a,b));assert.ok(pcm.peak>.03&&pcm.peak<.08);assert.equal(pcm.clipped,0);assert.ok(pcm.tail<.001);
 await page.locator('#amt-mix summary').click();await page.locator('[data-amt-volume="fx"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.evaluate(()=>__queueSound.beeps.length=0);const code=await page.evaluate(()=>BuergeramtLevel.queueDisplay);await page.waitForFunction(code=>BuergeramtLevel.queueDisplay!==code,code,{timeout:5000});assert.equal(await page.evaluate(()=>__queueSound.beeps.length),0);
 await page.evaluate(()=>BuergeramtLevel.interact()); // optional local interaction/exit must stay responsive
 assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',failedRecording:failed,before,peak,pcm,effectsMuted:true,errors});console.log(name+' queue audio PASS');await ctx.close();
}}catch(e){report.failure=e.stack;throw e}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
