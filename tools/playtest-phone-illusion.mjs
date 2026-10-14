// Silent forced call over the production protocol; signaling is simulated.
// DOM/media checks and Android emulation, not physical-phone or listening evidence.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,sep,extname} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||(process.env.CODEX_MCP_NODE_PATH?resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'):'playwright'));
const noModel=!!process.env.PHONE_NO_MODEL;
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'output/playwright/'+(noModel?'phone-backup':'phone-illusion'));mkdirSync(out,{recursive:true});
const testName=process.env.PHONE_NAME||'Erika Anmeldung';
const adapter=`const NativeLink=BuergeramtLink;window.BuergeramtLink=class extends NativeLink{async start(){window.__testLink=this;window.__hangups=0;window.__receipts=[];this.addEventListener('message',e=>{__receipts.push({...e.detail,observedAt:performance.now()});if(e.detail.type==='hangup')window.__hangups++});const channel=Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send:data=>window.__outbound(JSON.parse(data)),close(){this.readyState='closed'}});window.__channel=channel;this.attach('test-peer',channel)}};`;
const source=readFileSync(resolve(root,'buergeramt.js'),'utf8');
const fixture=`window.__phoneIllusion={open(){window.Germany3D={ready:true,setAmtQr(){},sync(){},layoutMissionPointer(){},isWorldPointVisible(){return true}};open({voiceOn:()=>true,subtitlesOn:()=>false,cinematics:false,music(){},onForm(){},onCancel(outcome){window.__cancelOutcome=outcome},onClose(){}})},arm(){link.send('counter-start');phoneCallRound=1;link.send('call-arm',{id:story.call.id,round:1});link.send('call',{id:story.call.id,round:1,line:story.call.body,greeting:story.call.greeting(registeredName),ringAtPhoneMs:null,ringAtUtcMs:null,leadMs:600})},ring(){activated=true;callTriggered=true;phoneVisibility='visible';phoneLastSeen=performance.now();callOutcome='';callPending=true;callCommitted=true;setStage('counter');watchPhoneLink();timing.call={ringingAt:null};this.arm()},argument(){activated=true;callOutcome='answer';setStage('cancelled');sentPolice(-1);showOutburst()}};\n`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.woff2':'font/woff2','.wasm':'application/wasm','.wav':'audio/wav'};
const server=createServer((req,res)=>{try{const f=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root+sep))throw Error('path');let data=readFileSync(f);if(f===resolve(root,'buergeramt-link.js'))data=data.toString()+'\n'+adapter;if(f===resolve(root,'buergeramt.js'))data=source.replace('window.BuergeramtLevel=',fixture+'window.BuergeramtLevel=');if(f===resolve(root,'buergeramt-phone.js'))data=data.toString().replace('const preparedRecordings=new Map();',"const preparedRecordings=new Map();Object.defineProperty(window,'__phoneAudioState',{get:()=>({staticActive:!!staticSource,warmed:preparedRecordings.size})});");if(noModel&&f===resolve(root,'knick-speech-worker.js'))data='WebAssembly.validate=()=>false;\n'+data.toString();if(f===resolve(root,'world3d.js'))data='';res.writeHead(200,{'content-type':mime[extname(f)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
const report=[];
try{
 for(const [name,width,height,ui] of [['desktop',1280,800,'generic'],['android-portrait',390,844,'google'],['android-landscape',844,390,'samsung'],['reflow-320',320,720,'google'],['enlarged',640,900,'ios'],['text-spacing',390,844,'google']]){
  if(process.env.PHONE_CASE&&!process.env.PHONE_CASE.split(',').includes(name))continue;
  const officeContext=await browser.newContext({viewport:{width:1280,height:800}}),phoneContext=await browser.newContext({viewport:{width,height},isMobile:name!=='desktop',hasTouch:name!=='desktop',locale:name==='desktop'?'en-US':'de-DE',userAgent:name==='desktop'?undefined:'Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36'});
  for(const ctx of [officeContext,phoneContext])await ctx.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   window.__utterances=[];speechSynthesis.speak=u=>{__utterances.push(u.text);u.onerror?.()};window.__players=[];window.__mediaEvents=[];const NativeAudio=Audio;window.Audio=function(src){const media=new NativeAudio(src);media.muted=true;for(const event of ['playing','ended','error'])media.addEventListener(event,()=>__mediaEvents.push({event,src:media.src,at:performance.now(),staticActive:window.__phoneAudioState?.staticActive}));__players.push(media);return media};
  });
  const office=await officeContext.newPage(),phone=await phoneContext.newPage(),errors=[],pending=[],modelRequests=[];let ready=false;
  phone.on('request',request=>{if(request.url().endsWith('.onnx.bin'))modelRequests.push(request.url())});
  for(const p of [office,phone])p.on('pageerror',e=>errors.push(e.stack||e.message));
  await office.exposeBinding('__outbound',async(_,m)=>{if(!ready){pending.push(m);return}await phone.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m)});
  await phone.exposeBinding('__outbound',async(_,m)=>office.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m));
  await office.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});await office.waitForFunction(()=>window.__phoneIllusion);await office.evaluate(()=>__phoneIllusion.open());await office.waitForFunction(()=>!!window.__channel);
  const url=await office.evaluate(()=>BuergeramtLevel.phoneUrl);await phone.goto(url.replace('buergeramt-phone.html?','buergeramt-phone.html?callUi='+ui+'&'),{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>!!window.__channel);ready=true;
  for(const m of pending)await phone.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m);
  await phone.locator('#phone-submit:not([disabled])').waitFor();const preparationStarted=Date.now();await phone.locator('#phone-name').fill(testName);await phone.locator('#phone-submit').click();await office.waitForFunction(name=>BuergeramtLevel.registeredName===name,testName);
  const localSpeech=await phone.evaluate(()=>!!window.GermanyKripoSpeech);
  let preparation=null;
  if(localSpeech&&!noModel){
   await phone.waitForFunction(name=>GermanyKripoSpeech.peek(name,1)?.status==='ready',testName,{timeout:180000});
   const prepared=await phone.evaluate(async name=>{const r=GermanyKripoSpeech.peek(name,1);return{bytes:Array.from(new Uint8Array(await r.blob.arrayBuffer())),text:r.text,duration:r.duration,generationMs:r.generationMs,cache:GermanyKripoSpeech.inspect()}},testName);
   writeFileSync(resolve(out,name+'-greeting.wav'),Buffer.from(prepared.bytes));delete prepared.bytes;
   preparation={...prepared,readyMs:Date.now()-preparationStarted};console.log(name+' prepared '+JSON.stringify(preparation));
  }else if(noModel){assert.equal(await phone.evaluate(async name=>(await GermanyKripoSpeech.prepare(name,1)).status,testName),'failed');assert.equal(modelRequests.length,0,'unsupported SIMD must skip the model download')}
  assert.equal(await phone.evaluate(()=>__phoneAudioState.warmed),6,'fixed call clips warm after the first usable name');
  assert.equal(await phone.evaluate(()=>__mediaEvents.length),0,'preparation must not play audio');
  if(name==='enlarged')await phone.evaluate(()=>{document.documentElement.style.zoom='2'});
  if(name==='text-spacing')await phone.addStyleTag({content:'.phone-call *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}'});
  assert.equal(await phone.locator('#phone-silence,#phone-connect-status,#phone-call-line').count(),0);
  assert.doesNotMatch(await phone.locator('body').innerText(),/Telefon verbunden|Telefon getrennt|SILENCE CALLS|Verbindung zum Amt/i);
  await phone.screenshot({animations:'disabled',path:resolve(out,name+'-ticket.png')});
  await office.evaluate(ringing=>ringing?__phoneIllusion.ring():__phoneIllusion.arm(),!!process.env.PHONE_RINGING);await phone.locator('#phone-call:not([hidden])').waitFor();await phone.screenshot({animations:'disabled',path:resolve(out,name+'-ring.png')});
  if(process.env.PHONE_RINGING){
   await office.waitForFunction(()=>window.__cancelOutcome?.reason==='ringing',null,{timeout:65000}).catch(async error=>{writeFileSync(resolve(out,name+'-ringing-failed.json'),JSON.stringify(await office.evaluate(()=>({active:BuergeramtLevel.active,stage:BuergeramtLevel.stage,registration:BuergeramtLevel.registration,line:document.getElementById('amt-line').textContent,players:__players.map(p=>({src:p.src,time:p.currentTime,ended:p.ended,paused:p.paused})),receipts:__receipts})),null,2));throw error});
   assert.equal(await office.evaluate(()=>__players.some(p=>p.src.includes('knick-phone-ring-expulsion.mp3')&&p.ended)),true);
   assert.equal(await office.evaluate(()=>__receipts.some(m=>m.type==='call-missed')),false);assert.equal(await phone.locator('#phone-call').isVisible(),false);assert.deepEqual(errors,[]);
   report.push({name,status:'PASS',scope:'one unattended ringing call, four native Knick warnings, terminal expulsion callback; paired contexts and simulated signaling'});console.log(name+' PASS continuous ringing');await officeContext.close();await phoneContext.close();continue;
  }
  await office.evaluate(()=>__phoneIllusion.argument());await phone.locator('#phone-answer').click();
  await office.waitForFunction(()=>BuergeramtLevel.timing.cues[-1]?.startedAt!==null,null,{timeout:5000});await office.waitForFunction(()=>document.getElementById('amt-ambient').textContent.startsWith('KRIMINALPOLIZEI · '),null,{timeout:10000});
  const named=localSpeech&&!noModel;
  await phone.waitForFunction(named=>__players.some(p=>p.src.includes(named?'kriminalpolizei-opening-body.mp3':'kriminalpolizei-phone-01.mp3')&&p.currentTime>0&&!p.paused),named);const caption=await office.locator('#amt-ambient').textContent();
  assert.equal(await phone.evaluate(()=>__utterances.length),0);
  assert.equal(await phone.evaluate(()=>__players.some(p=>p.src.startsWith('blob:')&&p.ended)),named);
  assert.equal(await office.evaluate(()=>BuergeramtLevel.timing.cues[-1].startMode),named?'voice':'recording');
  assert.equal(caption,'KRIMINALPOLIZEI · '+await office.evaluate(named=>named?BuergeramtStory.call.opening(BuergeramtLevel.registeredName):BuergeramtStory.call.line,named));
  const onset=await phone.evaluate(()=>({events:__mediaEvents.slice(),state:__phoneAudioState}));assert(onset.state.staticActive&&onset.events.filter(e=>e.event==='playing').every(e=>e.staticActive),'call static spans every speech onset');
  if(named){const greetingEnd=onset.events.find(e=>e.event==='ended'&&e.src.startsWith('blob:')),bodyStart=onset.events.find(e=>e.event==='playing'&&e.src.includes('opening-body'));assert(greetingEnd&&bodyStart&&bodyStart.at-greetingEnd.at<1500,'prewarmed body follows the name without model work')}
  assert.equal(await phone.locator('#phone-choices').isVisible(),false);assert.equal(await phone.locator('#phone-active-controls').isVisible(),true);assert.match(await phone.locator('#phone-call-state').textContent(),/^\d{2}:\d{2}$/);await phone.waitForFunction(()=>document.getElementById('phone-hangup-label').dataset.pretextFit);assert.doesNotMatch(await phone.locator('#phone-call').innerText(),/Kriminalpolizei|Grünfläche|Welcher Schuh|CONNECTED|VERBUNDEN/i);
  await phone.screenshot({animations:'disabled',path:resolve(out,name+'-answered.png')});
  const bounds=await phone.evaluate(()=>({pageOverflow:document.documentElement.scrollWidth>innerWidth+1,callerFit:document.getElementById('phone-caller').dataset.pretextFit,clockFit:document.getElementById('phone-time').dataset.pretextFit,indicators:[...document.querySelectorAll('.call-indicators svg')].map(el=>{const r=el.getBoundingClientRect();return{x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height}}),callScroll:document.getElementById('phone-call').scrollHeight,callHeight:document.getElementById('phone-call').clientHeight,muted:__players.every(p=>p.muted)}));assert.equal(bounds.pageOverflow,false);assert.equal(bounds.muted,true);assert.equal(bounds.indicators.length,3);assert(bounds.indicators.every(r=>r.width>0&&r.height>0&&r.x>=0&&r.right<=width&&r.y>=0&&r.bottom<=height));assert(bounds.clockFit&&bounds.clockFit!=='unavailable');assert(bounds.callScroll<=bounds.callHeight+1,'native call must not require internal scrolling');assert(bounds.callerFit&&bounds.callerFit!=='unavailable');
  if(name==='desktop'||process.env.PHONE_FULL_ARGUMENT){
   await phone.waitForFunction(()=>__players.some(p=>p.src.includes('kriminalpolizei-phone-05.mp3')&&p.currentTime>0),null,{timeout:90000});
   const finalCaption=await office.locator('#amt-ambient').textContent();assert.equal(finalCaption,'KRIMINALPOLIZEI · '+await office.evaluate(()=>BuergeramtStory.police[3]));await phone.screenshot({animations:'disabled',path:resolve(out,name+'-report-demand.png')});
   await phone.waitForFunction(()=>__players.some(p=>p.src.includes('kriminalpolizei-phone-05.mp3')&&p.ended),null,{timeout:35000});
   const final=await phone.evaluate(()=>{const p=__players.find(p=>p.src.includes('kriminalpolizei-phone-05.mp3'));return{duration:p.duration,currentTime:p.currentTime,ended:p.ended,muted:p.muted}});
   const overlap=await office.evaluate(()=>{const t=BuergeramtLevel.timing;return [0,1,2].map(index=>({index,clerkMs:t.desk[index].endAt-t.cues[index].estimatedStartAt,policeMs:t.cues[index].estimatedEndAt-t.desk[index+1].startAt}))});
   for(const turn of overlap){assert(turn.clerkMs>0&&turn.clerkMs<=1100,`clerk overlap outside one-second window: ${JSON.stringify(turn)}`);assert(turn.policeMs>0&&turn.policeMs<=1100,`police overlap outside one-second window: ${JSON.stringify(turn)}`)}
   assert(final.ended&&final.currentTime>=14&&final.muted);await office.waitForFunction(()=>__receipts.some(m=>m.type==='call-ended'&&m.mode==='sound'),null,{timeout:6000});await office.waitForFunction(()=>!BuergeramtLevel.active,null,{timeout:30000});
   assert.equal(await office.evaluate(()=>window.__cancelOutcome?.reason),'kripo');assert.equal(await phone.evaluate(()=>__utterances.length),0);assert.equal(await phone.evaluate(()=>__phoneAudioState.staticActive),false);assert.deepEqual(errors,[]);report.push({name,status:'PASS',named,preparation,onset,modelRequests,bounds,caption,finalCaption,final,overlap,scope:'forced two-context full argument with natural final MP3 end; silent media, simulated signaling'});console.log(JSON.stringify({name,status:'PASS',overlap}));await officeContext.close();await phoneContext.close();continue;
  }
  await phone.locator('#phone-hangup').focus();await phone.keyboard.press('Enter');await phone.locator('#phone-call').waitFor({state:'hidden'});await office.waitForFunction(()=>window.__hangups===1);assert.equal(await phone.evaluate(()=>__players.every(p=>p.paused)),true);await office.waitForFunction(()=>__receipts.some(m=>m.type==='call-ended'&&m.mode==='sound'),null,{timeout:6000});await office.waitForFunction(()=>window.__cancelOutcome?.reason==='kripo',null,{timeout:15000});assert.equal(await phone.evaluate(()=>__utterances.length),0);assert.equal(await phone.evaluate(()=>__phoneAudioState.staticActive),false);await phone.locator('#phone-call').waitFor({state:'hidden'});assert.doesNotMatch(await phone.locator('body').innerText(),/SILENCE CALLS|Telefon getrennt|Telefon verbunden|CONNECTED|VERBUNDEN/i);assert.deepEqual(errors,[]);
  report.push({name,status:'PASS',named,preparation,onset,modelRequests,bounds,caption,scope:'forced two-context call, production protocol with simulated signaling, silent media'});console.log(name+' PASS');await officeContext.close();await phoneContext.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));server.closeAllConnections();await browser.close();await new Promise(done=>server.close(done))}
