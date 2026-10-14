// Isolated silent browser evidence. Forced overlay coincidences are not a mission-chain playthrough.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/gameplay-text');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);if(file===resolve(root,'game.js'))data=data.toString().replace('window.Germany3DBridge={','window.__hudTest={state,showWorldBark,startSubtitle,stopSpeech,announceCurrentRule,updateHud,toast};window.Germany3DBridge={');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={cases:[],limits:['Chromium desktop and Android emulation; no physical Android','Forced events/overlays; no full natural mission chain','All media, Web Audio and browser speech muted; no listening review']};
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['wide',{width:2560,height:1440}],['android-portrait',{width:390,height:844}],['android-small',{width:320,height:640}],['android-landscape',{width:844,height:390}]]){
  if(process.env.HUD_CASE&&name!==process.env.HUD_CASE)continue;
  const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   localStorage.setItem('germany-simulator-english-subtitles','on');localStorage.setItem('germany-anmeldung-v1','1');
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.startupReady&&window.Germany3DBridge?.startupAssetsReady,null,{timeout:120000});
  await page.waitForFunction(()=>document.getElementById('preload').hidden);await page.keyboard.press('s');await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click();__hudTest.stopSpeech();__hudTest.state.started=true;__hudTest.state.modal=false;__hudTest.state.dialogue=false;document.getElementById('intro').classList.add('hidden');document.getElementById('dialogue').hidden=true;__hudTest.state.voiceOn=false;__hudTest.state.ruleTimer=-10000;__hudTest.updateHud()});
  await page.evaluate(()=>{document.getElementById('toast').classList.remove('show');GermanyHUD.refresh()});
  await page.waitForFunction(()=>!document.getElementById('city-status').hidden);
  const snapshot=()=>page.evaluate(()=>{
   const shown=el=>!!el?.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
   const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   const ids=['germanness-hud','subtitle-toggle','file-toggle','city-status','mission-guide','city-notices','mission-fax','english-subtitle'];
   const boxes=Object.fromEntries(ids.filter(id=>shown(document.getElementById(id))).map(id=>[id,rect(document.getElementById(id))]));
   const dock=document.querySelector('.control-dock');if(shown(dock))boxes.dock=rect(dock);
   const noticeIds=[...document.getElementById('city-notices').children].filter(shown).map(el=>el.id);
   const overflow=[...document.querySelectorAll('#anmeldung-medal,.anmeldung-medal-label,#germanness-hud,#subtitle-toggle,#file-toggle,#city-notices button,#city-notices b,#city-notices p,#city-notices strong,#fax-title,#fax-text')].filter(shown).filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.id||el.tagName);
   return{boxes,noticeIds,overflow,hudLayout:document.body.dataset.hudLayout,hudFit:document.body.dataset.hudFit,caption:document.getElementById('english-subtitle').textContent,captionFit:document.getElementById('english-subtitle').dataset.fit,measurements:[...document.querySelectorAll('[data-measurement]')].filter(shown).map(el=>[el.id||el.tagName,el.dataset.measurement,el.dataset.pretextFit]),pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};
  });
  const check=async phase=>{await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))));const data=await snapshot();assert.deepEqual(data.overflow,[],name+' '+phase+' horizontal text overflow');assert.equal(data.pageOverflow,false);if(data.hudLayout==='paired'){assert.ok(Math.abs(data.boxes['germanness-hud'].y-data.boxes['subtitle-toggle'].y)<1,'matching top anchors');assert.ok(data.boxes['germanness-hud'].right+5<=data.boxes['subtitle-toggle'].x,'separated top controls')}else{assert.ok(data.boxes['germanness-hud'].bottom+5<=data.boxes['subtitle-toggle'].y,'enlarged text reflows below the meter')};assert.ok(data.noticeIds.length<=1,'only one temporary notice');for(const id of data.noticeIds){const bounds=await page.locator('#'+id).boundingBox();assert.ok(bounds.y>=data.boxes['file-toggle'].bottom+5,'notice below controls')}
   if(data.boxes.dock&&data.noticeIds.length)assert.ok(data.boxes['city-notices'].bottom<=data.boxes.dock.y-5,'notice above dock');
   if(data.boxes.dock&&data.boxes['english-subtitle'])assert.ok(Math.abs(data.boxes.dock.bottom-data.boxes['english-subtitle'].y)<1,'dock uses caption height in CSS pixels, including zoom');
   if(data.boxes.dock)assert.ok(data.boxes['city-status'].bottom<=data.boxes.dock.y-5,'top controls stay above movement controls');
   if(data.boxes['mission-guide'])for(const id of ['germanness-hud','subtitle-toggle','file-toggle','dock']){const a=data.boxes['mission-guide'],b=data.boxes[id];if(b)assert.ok(Math.min(a.right,b.right)<=Math.max(a.x,b.x)+1||Math.min(a.bottom,b.bottom)<=Math.max(a.y,b.y)+1,'Wegweiser does not cover '+id)}
   assert.ok(data.measurements.some(([,measurement])=>measurement==='pretext-0.0.9'),'actual runtime measurement');
   await page.screenshot({path:resolve(out,name+'-'+phase+'.png')});report.cases.push({name,phase,...data});return data;
  };
  await check('mission');
  if(process.env.HUD_REWARD_ONLY){
   for(const [phase,css] of [['text-200','html{font-size:32px!important}'],['spacing','#city-status *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}'],['zoom-200','html{zoom:2!important}']]){
    if(phase==='zoom-200')await page.setViewportSize({width:viewport.width*2,height:viewport.height*2});
    const style=await page.addStyleTag({content:css});await page.evaluate(()=>GermanyHUD.refresh());await page.waitForTimeout(200);
    const data=await page.locator('#anmeldung-medal').evaluate(el=>{const label=el.querySelector('.anmeldung-medal-label'),box=document.getElementById('germanness-hud');return {width:el.clientWidth,scroll:el.scrollWidth,labelWidth:label.clientWidth,labelScroll:label.scrollWidth,meterWidth:box.clientWidth,meterScroll:box.scrollWidth,fit:label.dataset.pretextFit,measurement:label.dataset.measurement}});
    assert.ok(data.scroll<=data.width+2&&data.labelScroll<=data.labelWidth+2&&data.meterScroll<=data.meterWidth+2,name+' '+phase+' medal remains readable');assert.equal(data.measurement,'pretext-0.0.9');report.cases.push({name,phase,medal:data});await page.screenshot({path:resolve(out,name+'-reward-'+phase+'.png')});await style.evaluate(el=>el.remove());await page.setViewportSize(viewport);
   }
   assert.deepEqual(errors,[]);await context.close();console.log(name,'reward PASS');continue;
  }
  if(name==='desktop'){
   await page.evaluate(()=>{__hudTest.state.voiceOn=true;__hudTest.announceCurrentRule()});
   await page.waitForFunction(()=>document.getElementById('police-bark').classList.contains('caption-only')&&!document.getElementById('english-subtitle').hidden,null,{timeout:15000});
   const recorded=await check('recorded');assert.equal(recorded.noticeIds.includes('police-bark'),false);
   await page.locator('#subtitle-toggle').click();assert.equal(await page.locator('#english-subtitle').getAttribute('lang'),'de');
   await page.locator('#subtitle-toggle').click();await page.evaluate(()=>{__hudTest.stopSpeech();__hudTest.state.voiceOn=false});
  }
  await page.evaluate(()=>__hudTest.showWorldBark('REGEL DES AUGENBLICKS','Schrebergarten-Rasen ist anzuschauen, nicht zu betreten. Zuwiderhandlung löst sofortige Gefahrenabwehr aus.',false));
  let data=await check('speech');assert.equal(data.noticeIds.includes('police-bark'),false);assert.ok(data.caption.includes('REGEL DES AUGENBLICKS'));assert.equal(data.boxes['mission-fax'],undefined,'speech defers mission paper');
  const complete=await page.evaluate(()=>{const source='Allotment-garden lawn is for viewing, not walking. Violations trigger immediate intervention.',speaker='REGEL DES AUGENBLICKS',parts=GermanySubtitleLayout.paginate(source,speaker);return{source,joined:parts.join(' ').replace(speaker+' · ','')}});assert.equal(complete.joined,complete.source,'every sentence survives caption pagination');
  await page.locator('#subtitle-toggle').click();await page.evaluate(()=>{__hudTest.stopSpeech();__hudTest.showWorldBark('POLIZEI','Bitte verlassen Sie sofort den Grünbereich.',false)});
  data=await check('german');assert.ok(data.caption.includes('Bitte verlassen'));assert.equal(data.noticeIds.length,0);assert.equal(await page.locator('#english-subtitle').getAttribute('lang'),'de');
  await page.setViewportSize({...viewport,width:Math.max(320,viewport.width-32)});await check('resize');await page.setViewportSize(viewport);
  await page.evaluate(()=>{__hudTest.toast('NEUER VORGANG');document.getElementById('border-alert').hidden=false;document.getElementById('wurst-alert').hidden=false;document.getElementById('wurst-alert-title').textContent='NÜRNBERGER ROSTBRATWURST';document.getElementById('wurst-alert-history').textContent='Ein langer Sammlereintrag bleibt lesbar, ohne die Bewegungssteuerung zu verdecken.';document.getElementById('law-unlock-prompt').hidden=false;document.getElementById('violation-alert').hidden=false;GermanyHUD.refresh()});
  data=await check('coincidence');assert.deepEqual(data.noticeIds,['violation-alert']);
  await page.evaluate(()=>{for(const id of ['violation-alert','law-unlock-prompt','border-alert'])document.getElementById(id).hidden=true;GermanyHUD.refresh()});
  data=await check('collection');assert.deepEqual(data.noticeIds,['wurst-alert']);
  await page.evaluate(()=>{__hudTest.stopSpeech();document.getElementById('wurst-alert').hidden=true;document.getElementById('toast').classList.remove('show')});
  await page.keyboard.press('m');await page.waitForFunction(()=>document.getElementById('case-file').open);
  assert.equal(await page.evaluate(()=>GermanyHUD.paused),true);assert.equal(await page.locator('#subtitle-toggle').evaluate(el=>el.closest('dialog').id),'case-file');
  const fileBounds=await page.locator('#case-file').boundingBox();await page.evaluate(()=>GermanyHUD.refresh());await page.waitForTimeout(250);assert.deepEqual(await page.locator('#case-file').boundingBox(),fileBounds,'file geometry stays stable after measuring its subtitle control');
  await page.screenshot({path:resolve(out,name+'-file.png')});await page.keyboard.press('Escape');
  for(const [phase,css] of [['text-200','html{font-size:32px!important} #english-subtitle{font-size:30px!important}'],['spacing','html{font-size:16px!important} #city-status *,.city-notices *,#english-subtitle{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}'],['zoom-200','html{zoom:2!important}']]){
   // Keep at least 320 CSS px of effective reflow width at 200% zoom.
   if(phase==='zoom-200')await page.setViewportSize({width:viewport.width*2,height:viewport.height*2});
   const style=await page.addStyleTag({content:css});await page.evaluate(()=>{__hudTest.showWorldBark('POLIZEI','Bitte verlassen Sie sofort den Grünbereich. Benutzen Sie den Zebrastreifen.',false);GermanyHUD.refresh()});await check(phase);await style.evaluate(el=>el.remove());await page.setViewportSize(viewport);
  }
  assert.deepEqual(errors,[],name+' browser errors');console.log(name,'PASS');await context.close();
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
