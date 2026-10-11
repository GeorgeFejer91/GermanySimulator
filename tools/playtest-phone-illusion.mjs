// Silent forced call over the production protocol; signaling is simulated.
// DOM/media checks and Android emulation, not physical-phone or listening evidence.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,sep,extname} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||(process.env.CODEX_MCP_NODE_PATH?resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'):'playwright'));
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'output/playwright/phone-illusion');mkdirSync(out,{recursive:true});
const adapter=`const NativeLink=BuergeramtLink;window.BuergeramtLink=class extends NativeLink{async start(){window.__testLink=this;window.__hangups=0;this.addEventListener('message',e=>{if(e.detail.type==='hangup')window.__hangups++});const channel=Object.assign(new EventTarget(),{readyState:'open',bufferedAmount:0,send:data=>window.__outbound(JSON.parse(data)),close(){this.readyState='closed'}});window.__channel=channel;this.attach('test-peer',channel)}};`;
const source=readFileSync(resolve(root,'buergeramt.js'),'utf8');
const fixture=`window.__phoneIllusion={open(){window.Germany3D={ready:true,setAmtQr(){},sync(){},layoutMissionPointer(){}};open({voiceOn:()=>true,subtitlesOn:()=>false,cinematics:false,music(){},onForm(){},onCancel(){},onClose(){}})},arm(){link.send('call-arm',{id:story.call.id});link.send('call',{id:story.call.id,line:story.call.line,ringAtPhoneMs:null,ringAtUtcMs:null,leadMs:600})},argument(){activated=true;callOutcome='answer';setStage('cancelled');sentPolice(-1);showOutburst()}};\n`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try{const f=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root+sep))throw Error('path');let data=readFileSync(f);if(f===resolve(root,'buergeramt-link.js'))data=data.toString()+'\n'+adapter;if(f===resolve(root,'buergeramt.js'))data=source.replace('window.BuergeramtLevel=',fixture+'window.BuergeramtLevel=');if(f===resolve(root,'world3d.js'))data='';res.writeHead(200,{'content-type':mime[extname(f)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
const report=[];
try{
 for(const [name,width,height,ui] of [['desktop',1280,800,'generic'],['android-portrait',390,844,'google'],['android-landscape',844,390,'samsung'],['reflow-320',320,720,'google'],['enlarged',640,900,'ios']]){
  const officeContext=await browser.newContext({viewport:{width:1280,height:800}}),phoneContext=await browser.newContext({viewport:{width,height},isMobile:name!=='desktop',hasTouch:name!=='desktop',locale:name==='desktop'?'en-US':'de-DE',userAgent:name==='desktop'?undefined:'Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36'});
  for(const ctx of [officeContext,phoneContext])await ctx.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   speechSynthesis.speak=u=>u.onerror?.();window.__players=[];const NativeAudio=Audio;window.Audio=function(src){const media=new NativeAudio(src);media.muted=true;__players.push(media);return media};
  });
  const office=await officeContext.newPage(),phone=await phoneContext.newPage(),errors=[],pending=[];let ready=false;
  for(const p of [office,phone])p.on('pageerror',e=>errors.push(e.message));
  await office.exposeBinding('__outbound',async(_,m)=>{if(!ready){pending.push(m);return}await phone.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m)});
  await phone.exposeBinding('__outbound',async(_,m)=>office.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m));
  await office.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});await office.waitForFunction(()=>window.__phoneIllusion);await office.evaluate(()=>__phoneIllusion.open());await office.waitForFunction(()=>!!window.__channel);
  const url=await office.evaluate(()=>BuergeramtLevel.phoneUrl);await phone.goto(url.replace('buergeramt-phone.html?','buergeramt-phone.html?callUi='+ui+'&'),{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>!!window.__channel);ready=true;
  for(const m of pending)await phone.evaluate(m=>__channel.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)})),m);
  await phone.locator('#phone-ticket:not([hidden])').waitFor();await phone.locator('#phone-name').fill('Erika Anmeldung');await phone.locator('#phone-submit').click();await office.waitForFunction(()=>BuergeramtLevel.registeredName==='Erika Anmeldung');
  if(name==='enlarged')await phone.evaluate(()=>{document.documentElement.style.zoom='2'});
  assert.equal(await phone.locator('#phone-silence,#phone-connect-status,#phone-call-line').count(),0);
  assert.doesNotMatch(await phone.locator('body').innerText(),/Telefon verbunden|Telefon getrennt|SILENCE CALLS|Verbindung zum Amt/i);
  await phone.screenshot({path:resolve(out,name+'-ticket.png')});
  await office.evaluate(()=>__phoneIllusion.arm());await phone.locator('#phone-call:not([hidden])').waitFor();await phone.screenshot({path:resolve(out,name+'-ring.png')});
  await office.evaluate(()=>__phoneIllusion.argument());await phone.locator('#phone-answer').click();
  await phone.waitForFunction(()=>__players.at(-1)?.currentTime>0,null,{timeout:15000});await office.waitForFunction(()=>document.getElementById('amt-ambient').textContent.startsWith('KRIMINALPOLIZEI · '),null,{timeout:10000});
  const caption=await office.locator('#amt-ambient').textContent();assert.equal(caption,'KRIMINALPOLIZEI · '+await office.evaluate(()=>BuergeramtStory.call.line));
  assert.equal(await phone.locator('#phone-choices').isVisible(),false);assert.equal(await phone.locator('#phone-active-controls').isVisible(),true);assert.match(await phone.locator('#phone-call-state').textContent(),/^\d{2}:\d{2}$/);await phone.waitForFunction(()=>document.getElementById('phone-hangup-label').dataset.pretextFit);assert.doesNotMatch(await phone.locator('#phone-call').innerText(),/Kriminalpolizei|Grünfläche|Welcher Schuh|CONNECTED|VERBUNDEN/i);
  await phone.screenshot({path:resolve(out,name+'-answered.png')});
  const bounds=await phone.evaluate(()=>({pageOverflow:document.documentElement.scrollWidth>innerWidth+1,callerFit:document.getElementById('phone-caller').dataset.pretextFit,callScroll:document.getElementById('phone-call').scrollHeight,callHeight:document.getElementById('phone-call').clientHeight,muted:__players.every(p=>p.muted)}));assert.equal(bounds.pageOverflow,false);assert.equal(bounds.muted,true);assert(bounds.callScroll<=bounds.callHeight+1,'native call must not require internal scrolling');assert(bounds.callerFit&&bounds.callerFit!=='unavailable');
  await phone.locator('#phone-hangup').focus();await phone.keyboard.press('Enter');await phone.locator('#phone-call').waitFor({state:'hidden'});await office.waitForFunction(()=>window.__hangups===1);assert.equal(await phone.evaluate(()=>__players.every(p=>p.paused)),true);await office.evaluate(()=>__testLink.send('done'));await phone.locator('#phone-call').waitFor({state:'hidden'});assert.doesNotMatch(await phone.locator('body').innerText(),/SILENCE CALLS|Telefon getrennt|Telefon verbunden|CONNECTED|VERBUNDEN/i);assert.deepEqual(errors,[]);
  report.push({name,status:'PASS',bounds,caption,scope:'forced two-context call, production protocol with simulated signaling, silent media'});console.log(name+' PASS');await officeContext.close();await phoneContext.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
