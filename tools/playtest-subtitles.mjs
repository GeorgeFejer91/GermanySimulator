// Silent forced speech fixtures test the shared captions, not mission progression.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/subtitles');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{
 const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert(file.startsWith(root+sep));
 let body=readFileSync(file);
 if(file===resolve(root,'game.js'))body=body.toString().replace('window.Germany3DBridge={','window.__subtitleTest={state,speak,speakRecorded,stopSpeech,openDialogue,get active(){return activeStimulus}};window.Germany3DBridge={');
 if(file===resolve(root,'buergeramt.js'))body=body.toString().replace('window.BuergeramtLevel={','window.__officeSubtitleTest={content,cancelSpeech};window.BuergeramtLevel={');
 res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
const report={cases:[],limits:['Forced production speech paths; no natural mission chain','Silent audio state checks; no listening or physical Android evidence']};
try{
 for(const [name,viewport,zoom,spacing] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}],['reflow-320',{width:320,height:640}],['zoom-200',{width:640,height:1280},2],['text-200',{width:320,height:900}],['text-spacing',{width:390,height:844},1,true]]){
  if(process.env.SUBTITLE_CASE&&name!==process.env.SUBTITLE_CASE)continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android')}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(()=>{
   localStorage.removeItem('germany-simulator-english-subtitles');window.__spoken=[];window.__players=[];
   const NativeAudio=window.Audio;window.Audio=function(src){const media=new NativeAudio(src);media.muted=true;__players.push(media);return media};
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(u){__spoken.push(u);u.onstart?.();if(u.text.includes('Untertitel')||u.text.includes('Lerneifers')||u.text.includes('verwaltungstechnisch'))u.onend?.()}}});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&window.__subtitleTest,null,{timeout:120000});
  await page.evaluate(()=>document.getElementById('intro').classList.add('hidden'));
  if(zoom)await page.addStyleTag({content:`html{zoom:${zoom}}`});
  if(spacing)await page.addStyleTag({content:'#english-subtitle{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}'});
  if(name==='text-200')await page.addStyleTag({content:'html{font-size:32px!important} #english-subtitle{font-size:30px!important}'});
  assert.equal(await page.locator('#subtitle-toggle').textContent(),'UNTERTITEL: DEUTSCH');
  const source='Bitte verlassen Sie sofort den Grünbereich. Benutzen Sie den Zebrastreifen.',english='Please leave the green area immediately. Use the pedestrian crossing.';
  await page.evaluate(({source,english})=>__subtitleTest.speak(source,{subtitle:english,voiceKey:'POLIZEI'}),{source,english});
  await page.waitForFunction(()=>!document.getElementById('english-subtitle').hidden);
  const inspect=()=>page.evaluate(()=>{
   const box=document.getElementById('english-subtitle'),button=document.getElementById('subtitle-toggle'),r=box.getBoundingClientRect();
   return{text:box.textContent,lang:box.lang,hidden:box.hidden,fit:box.dataset.fit,measurement:box.dataset.measurement,left:r.left,right:r.right,bottom:r.bottom,width:box.clientWidth,scrollWidth:box.scrollWidth,height:box.clientHeight,scrollHeight:box.scrollHeight,buttonText:button.textContent,buttonMeasurement:button.dataset.measurement,buttonOverflow:button.scrollWidth>button.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,duplicate:getComputedStyle(document.getElementById('amt-ambient')).display};
  });
  const check=async()=>{await page.waitForFunction(()=>document.getElementById('english-subtitle').dataset.measurement==='pretext-0.0.9');await page.waitForTimeout(100);const s=await inspect();assert(!s.hidden);assert(!s.pageOverflow);assert(!s.buttonOverflow);assert.equal(s.measurement,'pretext-0.0.9');assert.equal(s.buttonMeasurement,'pretext-0.0.9');assert(s.scrollWidth<=s.width+1);assert(s.scrollHeight<=s.height+1||s.fit==='scroll');assert(s.left>=0&&s.right<=viewport.width+1&&s.bottom<=viewport.height+1);return s};
  const german=await check();assert.equal(german.lang,'de');assert(source.includes(german.text));
  await page.locator('#subtitle-toggle').click();const translated=await check();assert.equal(translated.lang,'en');assert(english.includes(translated.text));
  assert.equal(await page.evaluate(()=>__spoken[0].lang),'de-DE','subtitle switch must preserve German speech');
  await page.evaluate(()=>__spoken[0].onend());
  await page.waitForFunction(()=>__spoken.length===4,null,{timeout:10000});
  assert.equal(await page.evaluate(()=>__spoken.slice(1).every(u=>u.lang==='de-DE')),true);
  await page.locator('#subtitle-toggle').click();assert.equal(await page.locator('#subtitle-toggle').textContent(),'UNTERTITEL: DEUTSCH');
  await page.evaluate(source=>{__subtitleTest.state.voiceOn=false;__subtitleTest.openDialogue('FRAU KNICK',[source],'?');},source);
  const silent=await check();assert.equal(silent.lang,'de');assert(silent.text.includes('Bitte verlassen'));
  assert.equal(await page.locator('.dialogue-copy').evaluate(el=>el.getClientRects().length),0);
  assert.equal(await page.locator('#portrait').evaluate(el=>el.getClientRects().length),0);
  assert.equal(await page.locator('#dialogue-next').evaluate(el=>el.dataset.measurement),'pretext-0.0.9');
  await page.evaluate(()=>{__subtitleTest.stopSpeech();__subtitleTest.state.voiceOn=true;__subtitleTest.state.dialogue=false;__subtitleTest.state.modal=false;document.getElementById('dialogue').hidden=true});
  if(name==='desktop'){
   const clip=JSON.parse(readFileSync(resolve(root,'assets/voices/merz/manifest.json'),'utf8')).clips.toSorted((a,b)=>b.durationSeconds-a.durationSeconds)[0];
   await page.evaluate(clip=>__subtitleTest.speakRecorded(clip.text,clip.path,{subtitle:clip.english,voiceKey:'FRIEDRICH MERZ'}),clip);
   await page.waitForFunction(()=>__subtitleTest.active?.subtitleMode==='recorded',null,{timeout:20000});
   const recordedGerman=await check();assert.equal(recordedGerman.lang,'de');
   await page.locator('#subtitle-toggle').click();const recordedEnglish=await check();assert.equal(recordedEnglish.lang,'en');
   assert.equal(await page.evaluate(()=>__subtitleTest.active?.subtitleMode),'recorded','changing subtitle language preserves the recording');
   await page.evaluate(()=>__subtitleTest.stopSpeech());await page.locator('#subtitle-toggle').click();
   report.recorded={source:clip.text,recordedGerman,recordedEnglish};
  }
  // Office fallback retains full German and English text through the same rail.
  await page.evaluate(async()=>{__subtitleTest.stopSpeech();await Germany3D.prepareOfficeAssets();});
  await page.waitForFunction(()=>Germany3D.officeAssetsReady,null,{timeout:120000});
  await page.evaluate(({source,english})=>{
   BuergeramtLevel.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>__subtitleTest.state.subtitlesOn,cityAudioBusy:()=>!!__subtitleTest.active,cityAudioActive:()=>!!__subtitleTest.active});
   __officeSubtitleTest.content('FRAU KNICK',source,[],()=>{},null,null,null,{subtitle:english,readableMs:60000});
  },{source,english});
  const officeGerman=await check();assert.equal(officeGerman.lang,'de');assert.equal(officeGerman.duplicate,'none');assert(source.includes(officeGerman.text));
  await page.locator('#subtitle-toggle').click();const officeEnglish=await check();assert.equal(officeEnglish.lang,'en');assert(english.includes(officeEnglish.text));
  await page.locator('#subtitle-toggle').click();const officeReturn=await check();assert.equal(officeReturn.lang,'de');assert(!officeReturn.hidden);
  await page.screenshot({path:resolve(out,name+'.png')});
  await page.evaluate(()=>__officeSubtitleTest.cancelSpeech());assert.equal(await page.locator('#english-subtitle').evaluate(el=>el.hidden),true);
  assert.deepEqual(errors,[]);report.cases.push({name,german,translated,silent,officeGerman,officeEnglish,officeReturn,errors});
  await context.close();console.log(JSON.stringify({name,passed:true}));
 }
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
}finally{await browser.close();server.close()}
