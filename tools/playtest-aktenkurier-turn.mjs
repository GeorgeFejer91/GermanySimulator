// Silent production-renderer checks; actual entrance, controlled speech receipts.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/aktenkurier-turn/browser';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const cases=[['desktop',1280,800,1],['android-portrait',390,844,2],['android-landscape',844,390,2],
 ['mobile-low-dpr',390,844,1],['reduced-motion',1280,800,1],['asset-failure',1280,800,1],['fullbody-diagnostic',1280,800,1]];
const reports=[];
try{
 for(const [name,width,height,dpr] of cases.filter(([name])=>!process.env.PLAYTEST_VIEWPORT||process.env.PLAYTEST_VIEWPORT===name)){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:name.includes('android')||name.startsWith('mobile'),hasTouch:name.includes('android')||name.startsWith('mobile'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference'});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){this.muted=true;this.volume=0;return play.apply(this,a)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...a){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);target=mute}return connect.call(this,target,...a)};
   speechSynthesis.speak=u=>{u.volume=0;u.onstart?.();if(u.text.startsWith('Wer die Finsternis')){window.turnSpeech=u;u.onpause?.()}else u.onend?.()};
  });
  const page=await context.newPage(),errors=[],turnRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/aktenkurier-turn.*webp/.test(r.url()))turnRequests.push(r.url())});
  // Deliberately exercise the existing browser-voice fallback and its receipts.
  await page.route('**/assets/voices/**',r=>r.abort());
  if(name==='asset-failure')await page.route('**/aktenkurier-turn*.webp*',r=>r.abort());
  if(name==='fullbody-diagnostic')await page.route('**/world3d.js*',async r=>{
   const body=readFileSync('world3d.js','utf8').replace('new T.PerspectiveCamera(69,','new T.PerspectiveCamera(94,').replace('amtCamera.rotation.set(0,-view.yaw,0)','amtCamera.rotation.set(-.28,-view.yaw,0)');
   await r.fulfill({contentType:'text/javascript',body});
  });
  await page.goto(`${process.env.GAME_URL||'http://127.0.0.1:8876/index.html'}?geheim=buergeramt`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.ready&&Germany3D.amtOffice?.attached&&Germany3D.amtCharacters.every(a=>a.loaded),null,{timeout:90000});
  assert.equal(turnRequests.length,0,'turn art is absent before the encounter');
  await page.evaluate(()=>{const update=BuergeramtLevel.update.bind(BuergeramtLevel);BuergeramtLevel.update=()=>{};window.turnStep=s=>{for(let t=0;t<s-1e-9;t+=.025)update(Math.min(.025,s-t));Germany3D.sync()}});
  await page.keyboard.press('ArrowUp');
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<150&&BuergeramtLevel.stage!=='omen';i++)turnStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));for(let i=0;i<500&&BuergeramtLevel.omen.phase==='approach';i++)turnStep(.025)});
  await page.waitForFunction(()=>window.turnSpeech,null,{timeout:15000});
  if(name!=='asset-failure')await page.waitForFunction(()=>Germany3D.amtCharacters.find(a=>a.name==='aktenkurier').turnReady,null,{timeout:20000});
  const inspect=()=>page.evaluate(()=>({omen:BuergeramtLevel.omen,view:BuergeramtLevel.view,actor:Germany3D.amtCharacters.find(a=>a.name==='aktenkurier'),memory:Germany3D.inspectAssets().memory}));
  await page.evaluate(()=>{turnSpeech.onresume?.();turnSpeech.onend?.();for(let i=0;i<500&&BuergeramtLevel.omen.phase!=='turn';i++)turnStep(.025)});
  const start=await inspect(),frames=[];assert.equal(start.omen.phase,'turn');
  await page.evaluate(()=>turnStep(.05)); // Sample inside each pose, away from floating-point boundaries.
  for(let i=0;i<9;i++){
   if(i)await page.evaluate(()=>turnStep(.2));
   await page.waitForTimeout(40);
   const state=await inspect();frames.push(state);
   assert.equal(state.omen.phase,'turn');assert.deepEqual(state.actor.ground,start.actor.ground);assert.equal(state.actor.foot,0);
   assert(Math.abs(state.actor.rotation-Math.atan2(state.view.x-state.omen.x,state.view.z-state.omen.z))<1e-6,'no flat-sprite turn rotation');
   assert.equal(state.actor.depthTest,true);assert.equal(state.actor.opacity,1);
   if(name!=='asset-failure')assert.equal(state.actor.renderKey,`turn:${i}`);
   await page.screenshot({path:`${output}/${name}-turn-${i}.png`});
  }
  assert.equal(turnRequests.length,1,'only one client variant requested');
  assert.equal(/-mobile\.webp/.test(turnRequests[0]),name==='mobile-low-dpr');
  await page.evaluate(()=>turnStep(.2));const depart=await inspect();assert.equal(depart.omen.phase,'depart');
  await page.evaluate(()=>turnStep(1));const retreat=await inspect();assert(Math.hypot(retreat.omen.x-depart.omen.x,retreat.omen.z-depart.omen.z)>.25);
  await page.screenshot({path:`${output}/${name}-depart.png`});
  await page.evaluate(()=>{for(let i=0;i<500&&BuergeramtLevel.omen.phase;i++)turnStep(.025)});
  const released=await inspect();assert.equal(released.omen.phase,'');assert.equal(released.actor.turnPrepared,false);assert.equal(released.actor.visible,true);
  await page.locator('#amt-leave').evaluate(e=>e.click());assert.equal(await page.evaluate(()=>BuergeramtLevel.active),false);
  assert.deepEqual(errors,[]);
  reports.push({name,silent:true,physicalAndroid:false,evidence:'production entry; stepped simulation; controlled fallback speech; fullbody case has diagnostic camera only',turnRequests,start,frames,depart,retreat,released,errors});
  writeFileSync(`${output}/${name}.json`,JSON.stringify(reports.at(-1),null,2));
  console.log(JSON.stringify({name,result:'PASS',paintedViews:name==='asset-failure'?0:9,turnRequests:turnRequests.length}));
  await context.close();
 }
 writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));
}finally{await browser.close()}
