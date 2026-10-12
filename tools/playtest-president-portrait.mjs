// Real keyboard approach, native media lifecycle, silent rendered desktop/mobile evidence.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/president-portrait');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert(file.startsWith(root+sep));const override=process.env.PORTRAIT_CANDIDATE&&resolve(process.env.PORTRAIT_CANDIDATE,"."+(path==="/"?"/index.html":path));const body=readFileSync(override&&existsSync(override)?override:file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(body)}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
const report={cases:[],limits:['Office replay disables the unrelated opening cinematic; the approach itself uses production keyboard input and collision','Silent native media playback; no perceptual listening or physical Android evidence']};
try{
 for(const [name,viewport,failure] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}],['reflow-320',{width:320,height:640}],['zoom-200',{width:640,height:960}],['fallback',{width:1280,height:800},true]]){
  if(process.env.PORTRAIT_CASE&&name!==process.env.PORTRAIT_CASE)continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android')}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
  await context.addInitScript(()=>{
   window.__media=[];window.__machine=[];
   const NativeAudio=window.Audio;window.Audio=function(src){const media=new NativeAudio(src);media.__requestedSrc=src;media.muted=true;__media.push(media);return media};
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(u){__machine.push(u.text);u.onstart?.();u.onend?.()}}});
  });
  if(failure){await page.route('**/president-steinmeier.webp?*',r=>r.abort());await page.route('**/player-president-portrait-*.mp3?*',r=>r.abort());}
  await page.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active,null,{timeout:120000});
  assert(!requests.some(url=>/player-president-portrait-.*\.mp3/.test(url)),'monologue must not preload');
  assert.equal(await page.locator('#subtitle-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#subtitle-toggle').click();await page.waitForFunction(()=>__machine.length===3);await page.waitForTimeout(800);
  if(name==='zoom-200')await page.addStyleTag({content:'html{zoom:2}'});
  const approach=await page.evaluate(()=>{
   const level=BuergeramtLevel;level.replay({cinematics:false,voiceOn:()=>true,subtitlesOn:()=>document.getElementById("subtitle-toggle").getAttribute("aria-pressed")==="true"});
   const update=level.update.bind(level);level.update=()=>{};window.__portraitStep=update;
   const move=(code,reached)=>{dispatchEvent(new KeyboardEvent('keydown',{code}));let count=0;while(!reached()&&count++<600)update(1/60);dispatchEvent(new KeyboardEvent('keyup',{code}));if(!reached())throw Error('Blocked approach '+code+': '+JSON.stringify(level.view));};
   move('KeyW',()=>level.view.z<4.8);move('KeyD',()=>level.view.x>=3.4);move('KeyW',()=>level.view.z<=2.85);update(0);
   const prompt=document.getElementById('amt-nearby').textContent,position=level.view;
   level.update=update;return{prompt,position,stage:level.stage};
  });
  assert.equal(approach.stage,'walk-sign');assert.equal(approach.prompt,'E · BUNDESPRÄSIDENT BETRACHTEN');
  await page.keyboard.press('e');await page.waitForFunction(()=>BuergeramtLevel.stage==='portrait');
  const lines=await page.evaluate(()=>[BuergeramtStory.presidentPortrait.lines.map(row=>row.line).join(' ')]),observed=[];
  for(let index=0;index<lines.length;index++){
   await page.waitForFunction(text=>document.getElementById('amt-line').textContent===text,lines.slice(index<2?0:2,index<2?2:4).join(" "),{timeout:25000});
   assert.equal(await page.locator('#amt-speaker').textContent(),'ICH');
   if(!failure){
    try{await page.waitForFunction(i=>__media.some(media=>media.src.includes('player-president-portrait-'+(i+1)+'.mp3')&&media.currentTime>.12),index,{timeout:15000})}catch(error){console.log(JSON.stringify(await page.evaluate(()=>({stage:BuergeramtLevel.stage,line:document.getElementById('amt-line').textContent,media:__media.map(m=>({src:m.src,time:m.currentTime,paused:m.paused,error:m.error?.code})),machine:__machine}))));throw error}
    const media=await page.evaluate(i=>{const player=__media.find(media=>media.src.includes('player-president-portrait-'+(i+1)+'.mp3'));return{src:player.src,time:player.currentTime,muted:player.muted}},index);assert(media.muted);observed.push(media);
   }
   await page.waitForFunction(()=>document.getElementById('amt-ambient').dataset.pretextFit);
   const subtitle=await page.locator('#english-subtitle').evaluate(el=>({hidden:el.hidden,text:el.textContent,display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility}));assert.equal(subtitle.hidden,false);assert.notEqual(subtitle.display,'none');assert.notEqual(subtitle.visibility,'hidden');assert(subtitle.text.trim());
   const bounds=await page.locator('#amt-ambient').evaluate(el=>{const r=el.getBoundingClientRect();return{fit:el.dataset.pretextFit,left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}});
   assert.notEqual(bounds.fit,'unavailable');assert(bounds.scrollWidth<=bounds.clientWidth+1);assert(bounds.scrollHeight<=bounds.clientHeight+1);assert(bounds.left>=0&&bounds.right<=viewport.width+1&&bounds.top>=0&&bounds.bottom<=viewport.height+1);
   await page.screenshot({path:resolve(out,name+'-portrait.png')});
  }
  await page.waitForFunction(()=>BuergeramtLevel.stage==='walk-sign',null,{timeout:25000});
  assert.equal(await page.evaluate(()=>__media.filter(media=>media.__requestedSrc?.includes('player-president-portrait-')).length),1,'one continuous media source for the whole monologue, including released failed sources');
  assert.equal(lines.length,1,'one complete authored monologue');
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>__machine.length),3,'only the subtitle opt-in authority uses browser speech');
  report.cases.push({name,approach,observed,errors});
  await context.close();console.log(JSON.stringify({name,passed:true}));
 }
 // The diagnostic entry shares the renderer and can still start independently.
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/3d.html`);await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:120000});assert.deepEqual(errors,[]);await page.close();
 writeFileSync(resolve(out,'playtest.json'),JSON.stringify(report,null,2));
}finally{await browser.close();server.close()}
