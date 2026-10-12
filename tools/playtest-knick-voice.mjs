// Muted browser lifecycle checks; forced cues with the renderer omitted.
// This establishes playback ownership, not listening or natural mission coverage.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {createReadStream,readFileSync} from 'node:fs';
import {extname,resolve,sep} from 'node:path';
import {dirname} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||(process.env.CODEX_MCP_NODE_PATH?resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'):'playwright'));
const root=resolve(import.meta.dirname,'..'),source=readFileSync(resolve(root,'buergeramt.js'),'utf8');
const marker='window.BuergeramtLevel=';
assert(source.includes(marker));
const instrumented=source.replace(marker,`window.__knickVoiceTest={
 cue(text,voice=true,argument=false){active=true;options={voiceOn:()=>voice,cinematics:false};root.hidden=false;setStage(argument?"cancelled":"counter");content(argument?"FRAU KNICK · SCHALTER 3":story.clerkIdentity.speaker,text,[])},
 cancel(){cancelSpeech()},
 ambient(){active=true;options={voiceOn:()=>true,cinematics:false};setStage("walk-sign");ambientLastVoice=ambientLastText="";ambientBag.splice(0,ambientBag.length,story.ambient.find(row=>row.actor==="clerk-1"));ambientClock=9;ambientStep(0)}
};\n`+marker);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((request,response)=>{
 const file=resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://local').pathname).replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+sep)){response.writeHead(403).end();return}
 response.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
 createReadStream(file).on('error',()=>response.destroy()).pipe(response);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--disable-gpu','--autoplay-policy=no-user-gesture-required']});
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'}),page=await context.newPage(),errors=[],voiceRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(request.url().includes('/assets/voices/knick/'))voiceRequests.push(request.url())});
  await page.addInitScript(()=>{
   window.__players=[];window.__browserSpeech=[];
   const NativeAudio=window.Audio;window.Audio=function(src){const media=new NativeAudio(src);media.muted=true;window.__players.push(media);return media};
   const nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){this.muted=true;return nativePlay.call(this)};
   const NativeContext=window.AudioContext||window.webkitAudioContext;
   if(NativeContext)window.AudioContext=new Proxy(NativeContext,{construct(target,args){const ctx=Reflect.construct(target,args),sink=ctx.createGain();sink.gain.value=0;sink.connect(ctx.destination);return new Proxy(ctx,{get(object,key){if(key==='destination')return sink;const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value}})}});
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(utterance){window.__browserSpeech.push(utterance.text);utterance.onstart?.();utterance.onend?.()}}});
  });
  await page.route('**/world3d.js?*',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
  await page.route('**/buergeramt.js?*',route=>route.fulfill({status:200,contentType:'text/javascript',body:instrumented}));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__knickVoiceTest&&window.GermanySimulatorAudioText);
  assert.deepEqual(voiceRequests,[],'Knick library must not preload at startup');
  for(const search of ['','?voicePreview=1']){
   await page.evaluate(search=>history.replaceState(null,'',search||'/'),search);
   // The query gate is selected when the catalogue executes, as on navigation.
   await page.evaluate(readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'));
   const cue=await page.evaluate(()=>{const c=window.GermanySimulatorAudioText,clip=Object.values(c.recordings).find(r=>r.voiceId==='amt-brunhilde-knick'&&r.id.startsWith('knick-registration-'));if(!clip)throw Error('No eligible fixed-profile registration recording');window.__knickVoiceTest.cue(clip.source);return{source:clip.source,profileId:clip.profileId,path:c.recordedClip(clip.voiceId,clip.source)}});
   assert(cue.path.startsWith('./assets/voices/knick/'));
   await page.waitForFunction(()=>window.__players.at(-1)?.currentTime>0,null,{timeout:8000});
   const playing=await page.evaluate(()=>({src:window.__players.at(-1).getAttribute('src').split('?')[0],muted:window.__players.at(-1).muted,caption:document.getElementById('amt-line').textContent,browser:window.__browserSpeech.length}));
   assert.equal(cue.profileId,'b080c7d95ecd418fb428282461d7fbe7');assert.equal(playing.src,cue.path);assert.equal(playing.caption,cue.source);assert(playing.muted);assert.equal(playing.browser,0);
   await page.evaluate(()=>window.__knickVoiceTest.cancel());
   const missing='**/'+cue.path.slice(2)+'*';await page.route(missing,route=>route.fulfill({status:404,body:''}));
   await page.evaluate(text=>window.__knickVoiceTest.cue(text),cue.source);
   await page.waitForFunction(()=>window.__players.at(-1)?.getAttribute('src')===null,null,{timeout:8000});
   assert.deepEqual(await page.evaluate(()=>({src:window.__players.at(-1).getAttribute('src'),browser:window.__browserSpeech.length})),{src:null,browser:0});
   assert.equal(await page.locator('#amt-line').textContent(),cue.source);await page.unroute(missing);
   const off=await page.evaluate(text=>{const before=window.__players.length;window.__knickVoiceTest.cue(text,false);return{before,after:window.__players.length,caption:document.getElementById('amt-line').textContent}},cue.source);assert.equal(off.before,off.after);assert.equal(off.caption,cue.source);
   await page.evaluate(()=>window.__knickVoiceTest.cue('An exact unrecorded dynamic ticket line.'));assert.equal(await page.evaluate(()=>window.__browserSpeech.length),0);
   await page.evaluate(()=>window.__knickVoiceTest.cancel());
  }
  for(const index of [0,1,2,3,4]){
   const cue=await page.evaluate(index=>{const text=BuergeramtStory.outburst.lines[index],catalog=GermanySimulatorAudioText,path=catalog.recordedClip(BuergeramtStory.clerkIdentity.voiceId,text);window.__knickVoiceTest.cue(text,true,true);return{text,path,profile:catalog.recordings[path]?.profileId}},index);
   if(cue.path){assert(cue.path.startsWith('./assets/voices/knick/'),'argument must use the current counter voice');assert.equal(cue.profile,'b080c7d95ecd418fb428282461d7fbe7');await page.waitForFunction(()=>window.__players.at(-1)?.currentTime>0,null,{timeout:10000});}
   assert.equal(await page.locator('#amt-ambient').textContent(),'FRAU KNICK · SCHALTER 3 · '+cue.text);
   await page.evaluate(()=>window.__knickVoiceTest.cancel());
  }
  assert.equal(await page.evaluate(()=>window.__browserSpeech.length),0,'a held argument take cannot borrow a browser voice');
  await page.evaluate(()=>window.__knickVoiceTest.cancel());
  const ambientPath=await page.evaluate(()=>window.GermanySimulatorAudioText.recordedClip('amt-brunhilde-knick','Für die Kopie des Originals benötigen Sie das Original der Kopie.'));
  await page.evaluate(()=>window.__knickVoiceTest.ambient());
  await page.waitForFunction(()=>document.getElementById('amt-ambient').textContent.includes('Original der Kopie'),null,{timeout:8000});
  const ambient=await page.evaluate(()=>({caption:document.getElementById('amt-ambient').textContent,browser:window.__browserSpeech.length}));assert(ambient.caption.includes('Original der Kopie'));assert.equal(ambient.browser,0);
  if(ambientPath){const media=await page.evaluate(()=>({src:window.__players.at(-1).getAttribute('src').split('?')[0],volume:window.__players.at(-1).volume}));assert.equal(media.src,ambientPath);assert(Math.abs(media.volume-.176)<1e-6);}
  await page.evaluate(()=>window.__knickVoiceTest.cancel());assert.deepEqual(errors,[]);
  console.log(JSON.stringify({name,startupVoiceRequests:0,recorded:'new registration take from selected profile',preview:'checked',failedAudio:'HTTP404 retains captions',voiceOff:'no media',ambient:ambientPath?'selected recording and reduced gain':'caption fallback',browserSpeech:0,evidence:'silent forced DOM/media lifecycle; Android emulation'}));
  await context.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done))}
