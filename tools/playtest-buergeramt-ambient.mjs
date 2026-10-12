// Silent forced speech cues in the production office renderer; no listening claim.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(import.meta.dirname,'..'),out=resolve(root,process.env.AMT_AMBIENT_OUTPUT||'output/amt-ambient');mkdirSync(out,{recursive:true});
const source=readFileSync(resolve(root,'buergeramt.js'),'utf8'),marker='window.BuergeramtLevel=';
const instrumented=source.replace(marker,`window.__ambientTest={
 cue(index,voice=true){options.cinematics=false;options.voiceOn=()=>voice;queueClock=-1000;queueCallPending=-1;setStage("walk-sign");const row=story.ambient[index],person=ambientPeople[row.actor],target=characters.find(actor=>actor.id===row.actor)||person,desk=Number(row.actor.replace("clerk-","")),x=target.x??counterXs[desk-1],z=target.z??-9;view.x=x>0?2.8:-2.8;view.z=-5.5;view.yaw=Math.atan2(x-view.x,view.z-z);ambientKindBag.splice(0,ambientKindBag.length,"dialogue");ambientLastKind="";queueCallCooldown=Infinity;ambientLastVoice=ambientLastText="";ambientBag.splice(0,ambientBag.length,row);ambientClock=9;ambientStep(0);return{...row,voiceId:person.voiceId,caption:person.speaker+": "+row.text,path:GermanySimulatorAudioText?.recordedClip(person.voiceId,row.text)}},
 cancel(){cancelSpeech();ambient.textContent="";ambientClock=-1000},
 foreground(desk=1){view.x=counterXs[desk-1];view.z=-7.5;view.yaw=0;interactingCounter=desk;setStage("early");content(story.clerks[desk].speaker+" · SCHALTER "+desk,story.clerkRefusal,[])},
 hold(){ambientClock=-1000},
 inspect(){return{caption:ambient.textContent,mouth:lips.sample(),busy:officeSpeechBusy}}
};\n`+marker);
assert.notEqual(instrumented,source);
const worldSource=readFileSync(resolve(root,'world3d.js'),'utf8'),worldInstrumented=worldSource.replace('return{rotation:actor.mesh.rotation.y,height,foot:','return{counter:actor.counter,lead:actor.lead,lipId:actor.lipId,voiceId:actor.voiceId,narrativeId:actor.id,rotation:actor.mesh.rotation.y,height,foot:');
assert.notEqual(worldInstrumented,worldSource);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert(file.startsWith(root+sep));res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file))}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}/`,report={candidate:Object.fromEntries(['buergeramt.js','world3d.js','buergeramt-story.js','For-AI/AUDIO-TEXT-LIBRARY.js','assets/buergeramt/speech/mouth-cues.js'].map(path=>[path,createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')])),views:[],limits:['Forced ambient speech selection with queue clock held; natural wait and mission coverage not established','Captured ambient media pauses after observed playback; desk frame freezes at an observed native-media mouth opening','Muted native audio and speech stubs; no listening or physical Android device']};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/office-ambient/'))requests.push(r.url())});
  await context.addInitScript(()=>{
   window.__players=[];window.__machineSpeech=[];
   const NativeAudio=window.Audio;window.Audio=function(src){const media=new NativeAudio(src);media.muted=true;__players.push(media);return media};
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(u){__machineSpeech.push(u.text);u.onstart?.();u.onend?.()}}});
  });
  await page.route('**/buergeramt.js?*',route=>route.fulfill({contentType:'text/javascript',body:instrumented}));
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:worldInstrumented}));
  await page.goto(base+'?geheim=buergeramt',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__ambientTest&&window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active,null,{timeout:120000});
  assert.equal(requests.length,0,'ambient recordings must not preload');
  const rows=[];
  for(let index=0;index<21;index++){
   const cue=await page.evaluate(i=>__ambientTest.cue(i),index);assert(cue.path,cue.id);
   try{await page.waitForFunction(caption=>{const media=__players.at(-1);if(!media||media.currentTime<=.15||__ambientTest.inspect().caption!==caption)return false;window.__ambientCapture={...__ambientTest.inspect(),src:media.getAttribute('src'),volume:media.volume,muted:media.muted,machine:__machineSpeech.length};media.pause();return true},cue.caption,{timeout:12000})}catch(error){console.log(JSON.stringify({name,index,cue,state:await page.evaluate(()=>({...__ambientTest.inspect(),src:__players.at(-1)?.getAttribute('src'),time:__players.at(-1)?.currentTime,stage:BuergeramtLevel.stage,view:BuergeramtLevel.view}))}));throw error}
   await page.evaluate(()=>__ambientTest.hold());
   const state=await page.evaluate(()=>__ambientCapture);
   assert(state.src.split('?')[0]===cue.path);assert.equal(state.caption,cue.caption);assert.equal(state.mouth.actor,cue.actor);assert.equal(state.mouth.mode,'recorded');assert.equal(state.mouth.timing,'audio-cues');assert(state.muted);assert.equal(state.machine,0);assert(Math.abs(state.volume-.176)<1e-6);
   await page.waitForFunction(()=>document.getElementById('amt-ambient').dataset.pretextFit);
   const bounds=await page.locator('#amt-ambient').evaluate(el=>{const r=el.getBoundingClientRect();return{fit:el.dataset.pretextFit,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}});
   assert.notEqual(bounds.fit,'unavailable');assert(bounds.scrollWidth<=bounds.clientWidth+1);assert(bounds.scrollHeight<=bounds.clientHeight+1);assert(bounds.left>=0&&bounds.right<=viewport.width+1&&bounds.top>=0&&bounds.bottom<=viewport.height+1);
   if([0,1,9,14,20].includes(index))await page.screenshot({path:resolve(out,`${name}-${cue.id}.png`)});
   await page.evaluate(()=>__ambientTest.cancel());assert.equal(await page.evaluate(()=>__players.at(-1).getAttribute('src')),null);
   rows.push({id:cue.id,voiceId:cue.voiceId,actor:cue.actor,path:cue.path,caption:state.caption,mouthTiming:state.mouth.timing,bounds});
  }
  const first=rows[0],pattern='**/'+first.path.slice(2)+'*';await page.route(pattern,route=>route.fulfill({status:404,body:''}));
  await page.evaluate(()=>__ambientTest.cue(0));await page.waitForFunction(()=>__players.at(-1)?.getAttribute('src')===null,null,{timeout:12000});
  assert.equal(await page.evaluate(()=>__ambientTest.inspect().caption),first.caption);assert.equal(await page.evaluate(()=>__machineSpeech.length),0);await page.unroute(pattern);
  await page.evaluate(()=>__ambientTest.cancel());
  const off=await page.evaluate(()=>{const before=__players.length,cue=__ambientTest.cue(0,false);return{before,after:__players.length,caption:__ambientTest.inspect().caption,cue}});assert.equal(off.before,off.after);assert.equal(off.caption,off.cue.caption);
  await page.evaluate(()=>__ambientTest.cancel());
  await page.evaluate(()=>{const old=window.GermanySimulatorAudioText;window.GermanySimulatorAudioText=null;__ambientTest.cue(0);window.GermanySimulatorAudioText=old});assert.equal(await page.evaluate(()=>__machineSpeech.length),0);assert.equal(await page.evaluate(()=>__ambientTest.inspect().caption),first.caption);
  await page.evaluate(()=>__ambientTest.cancel());await page.evaluate(()=>__ambientTest.cue(0));await page.waitForFunction(()=>__players.at(-1)?.currentTime>.15);
  const paused=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));return{paused:__players.at(-1).paused,time:__players.at(-1).currentTime}});assert(paused.paused);
  await page.waitForTimeout(200);assert(Math.abs(await page.evaluate(()=>__players.at(-1).currentTime)-paused.time)<.01);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!__players.at(-1).paused);
  const backgroundIndex=await page.evaluate(()=>__players.length-1);
  await page.evaluate(()=>__ambientTest.foreground());assert.equal(await page.evaluate(index=>__players[index].getAttribute('src'),backgroundIndex),null);assert.equal(await page.evaluate(()=>__machineSpeech.length),0);
  const desks=[];
  for(const desk of [1,2,3,4]){
   await page.evaluate(()=>__ambientTest.cancel());await page.evaluate(desk=>__ambientTest.foreground(desk),desk);
   await page.waitForFunction(()=>__players.at(-1)?.currentTime>.15,null,{timeout:12000});
   await page.waitForFunction(()=>{const gaussian=Germany3D.amtGaussian,paint=gaussian.actors.find(actor=>actor.id==='clerk')?.anchor,splat=Germany3D.amtLipSplat,native=paint?.visible&&paint.lipShape.some(value=>value>.015),fallback=splat?.visible&&splat.actor==='clerk';if(!native&&!fallback)return false;const path=__players.at(-1).getAttribute('src').split('?')[0];window.__deskCapture={path,voiceId:GermanySimulatorAudioText.recordings[path].voiceId,speaker:document.getElementById('amt-speaker').textContent,mouth:BuergeramtLevel.lipSpeech.actor,activeCounter:BuergeramtLevel.activeClerkCounter,renderedMouth:{route:native?'native-anchor':'sprite-mouth',actor:splat?.actor,visible:true,paint:native?paint:splat},gaussian,clerks:Germany3D.amtCharacters.filter(actor=>actor.counter)};window.__deskRender=Germany3D.sync;Germany3D.sync=()=>{};return true},null,{timeout:12000});
   const data=await page.evaluate(()=>__deskCapture);
   assert.equal(data.voiceId,'amt-brunhilde-knick');assert(data.speaker.includes('FRAU KNICK'));assert.equal(data.activeCounter,desk);assert.equal(data.mouth,'clerk');
   assert.equal(data.renderedMouth.actor,'clerk');assert(data.renderedMouth.visible);assert.equal(new Set(data.clerks.map(actor=>actor.id)).size,4);
   assert.deepEqual(data.clerks.filter(actor=>actor.lead||actor.lipId==='clerk').map(actor=>actor.counter),[desk]);
   assert(data.clerks.every(actor=>actor.narrativeId==='amt-brunhilde-knick'&&actor.voiceId==='amt-brunhilde-knick'));desks.push({desk,...data});
   assert(data.gaussian.actors.filter(actor=>actor.id!=='clerk'&&actor.anchor?.visible).every(actor=>!actor.anchor.lipShape.some(value=>value>.015)),'speech must not fan out to other visible render slots');
   await page.screenshot({path:resolve(out,`${name}-knick-counter-${desk}.png`)});
   await page.evaluate(()=>Germany3D.sync=__deskRender);
  }
  // Same selected recording with audition lookup enabled.
  await page.evaluate(()=>history.replaceState(null,'','?geheim=buergeramt&voicePreview=1'));
  await page.evaluate(readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8'));
  await page.evaluate(()=>__ambientTest.cue(0));await page.waitForFunction(()=>__players.at(-1)?.currentTime>.15);assert.equal(await page.evaluate(()=>__players.at(-1).getAttribute('src').split('?')[0]),first.path);
  await page.evaluate(()=>__ambientTest.cancel());assert.deepEqual(errors,[]);
  const reflow=[];
  if(name==='desktop')for(const [label,width,zoom,spacing] of [['320px',320,1,false],['200-percent',640,2,false],['text-spacing',320,1,true]]){
   await page.setViewportSize({width,height:900});await page.evaluate(({zoom,spacing})=>{document.documentElement.style.zoom=String(zoom);if(spacing){const style=document.createElement('style');style.textContent='#amt-ambient{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}';document.head.append(style)}},{zoom,spacing});
   for(const index of [1,9,10,17]){
    await page.evaluate(i=>__ambientTest.cue(i,false),index);await page.waitForTimeout(100);
    const b=await page.locator('#amt-ambient').evaluate(el=>{const r=el.getBoundingClientRect();return{fit:el.dataset.pretextFit,width:r.width,top:r.top,bottom:r.bottom,right:r.right,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}});
    assert(b.scrollWidth<=b.clientWidth+1);assert(b.scrollHeight<=b.clientHeight+1);assert(b.top>=0&&b.bottom<=900&&b.right<=width+1);reflow.push({label,index,...b});
    if(index===17)await page.screenshot({path:resolve(out,`${name}-${label}.png`)});
    await page.evaluate(()=>__ambientTest.cancel());
   }
  }
  report.views.push({name,rows,desks,reflow,startupAmbientRequests:0,missingAudio:'exact silent captions',missingCatalogue:'exact silent captions',voiceOff:'no media',simulatedVisibility:'media pauses and resumes without playhead catch-up',foreground:'background media cancelled',preview:'same selected profile',errors});
  console.log(JSON.stringify({name,recorded:rows.length,voices:new Set(rows.map(row=>row.voiceId)).size,machineSpeech:0,evidence:'silent Chromium; Android emulation'}));await context.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
