// Silent real-native-media / actual Spark evidence. Direct office, stepped entry.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/omen-mouth/browser';mkdirSync(output,{recursive:true});
let browser;
const rows=[];
try{
 for(const [name,width,height] of [['baseline',1280,800],['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['reduced-motion',1280,800],['missing-audio',1280,800],['splat-failure',1280,800]].filter(([n])=>!process.env.PLAYTEST_VIEWPORT||n===process.env.PLAYTEST_VIEWPORT)){
  // Release the GPU process between cases, as well as the visit-owned resources.
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=default','--renderer-process-limit=1']});
  const mobile=name.startsWith('android'),context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,reducedMotion:name==='reduced-motion'?'reduce':'no-preference'});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const silent=this.context.createGain();silent.gain.value=0;connect.call(silent,target);return connect.call(this,silent,...args)}return connect.call(this,target,...args)};
   const NativeAudio=Audio;window.omenPlayers=[];window.Audio=function(...args){const p=new NativeAudio(...args);p.muted=true;if(String(args[0]).includes('omen-candidate-02'))omenPlayers.push(p);return p};
   speechSynthesis.speak=u=>{u.volume=0;u.onstart?.();if(u.text.startsWith('Wer die Finsternis'))window.omenFallback=u;else u.onend?.()};
  });
  const page=await context.newPage(),errors=[],warnings=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text())});
  page.on('request',r=>{if(/lipsync|mouth-cues|omen-candidate/.test(r.url()))requests.push(r.url())});
  if(name==='baseline')await page.route('**/buergeramt-splat.js*',r=>r.fulfill({status:200,contentType:'text/javascript',body:execFileSync('git',['show',(process.env.BASELINE_COMMIT||'7ca04eff3f9205d726de55429a73676d2b41b992')+':buergeramt-splat.js'],{encoding:'utf8'})}));
  if(name==='missing-audio')await page.route('**/omen-candidate-02.mp3',r=>r.abort());
  if(name==='splat-failure')await page.route('**/omen/aktenkurier.splat',r=>r.abort());
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:8891/index.html')+'?geheim=buergeramt',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.ready&&Germany3D.amtCharacters.every(a=>a.loaded)&&Germany3D.amtOffice?.attached,null,{timeout:90000});
  await page.waitForFunction(()=>Germany3D.amtOmenSplat.ready||Germany3D.amtOmenSplat.skipped,null,{timeout:90000});
  await page.evaluate(()=>{const update=BuergeramtLevel.update.bind(BuergeramtLevel);window.omenUpdate=update;BuergeramtLevel.update=()=>{};window.omenStep=s=>{for(let t=0;t<s;t+=.025)update(Math.min(.025,s-t));Germany3D.sync()}});
  assert(!requests.some(r=>r.includes('omen-candidate-02')));
  await page.keyboard.press('ArrowUp');await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<150&&BuergeramtLevel.stage!=='omen';i++)omenStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));for(let i=0;i<300&&BuergeramtLevel.omen.phase==='approach';i++)omenStep(.025)});
  const inspect=()=>page.evaluate(()=>({phase:BuergeramtLevel.omen.phase,speech:BuergeramtLevel.omen.speech,splat:Germany3D.amtOmenSplat,life:BuergeramtLevel.omen.life,actor:Germany3D.amtCharacters.find(a=>a.name==='aktenkurier'),players:omenPlayers.map(p=>({src:p.getAttribute('src'),time:p.currentTime,paused:p.paused,ended:p.ended,muted:p.muted}))}));
  const samples=[];
  if(name==='missing-audio'){
   await page.waitForFunction(()=>!!window.omenFallback);await page.evaluate(()=>omenStep(.1));assert.equal((await inspect()).splat.mouth.open,0);await page.evaluate(()=>omenFallback.onend());
  }else{
   await page.waitForFunction(()=>omenPlayers.at(-1)?.currentTime>.1&&!omenPlayers.at(-1).paused);
   // Real playback trace, from native currentTime at render cadence, no seek.
   await page.evaluate(()=>{window.mouthTrace=[];BuergeramtLevel.update=omenUpdate;const started=performance.now();window.traceTimer=setInterval(()=>mouthTrace.push({at:performance.now()-started,phase:BuergeramtLevel.omen.phase,media:BuergeramtLevel.omen.speech?.mediaTime,mouth:Germany3D.amtOmenSplat.mouth}),30)});
   let held,paused,frameTiming;
   // Capture phonetic states through real playback, pausing without seeking.
   for(const [label,time] of [['closed',.47],['consonant',1.8],['open-vowel',2.04],['lip-bite',2.28],['rounded',3.86]]){
    await page.waitForFunction(time=>omenPlayers.at(-1).currentTime>=time,time);
    await page.evaluate(()=>{omenPlayers.at(-1).pause();BuergeramtLevel.update=()=>{}});await page.waitForFunction(()=>BuergeramtLevel.omen.speech.paused);await page.evaluate(()=>omenStep(0));await page.waitForTimeout(80);
    const state=await inspect();samples.push({label,state});await page.screenshot({path:`${output}/${name}-${label}.png`});
    if(label==='consonant'){
     held=state;await page.waitForTimeout(300);await page.evaluate(()=>omenStep(.2));paused=await inspect();assert.equal(held.speech.mediaTime,paused.speech.mediaTime);assert.equal(held.life.clock,paused.life.clock);
     if(name!=='baseline'&&name!=='splat-failure')assert.deepEqual(held.splat.mouth,paused.splat.mouth);
     frameTiming=await page.evaluate(()=>new Promise(resolve=>{const stamps=[],start=performance.now(),sync=Germany3D.sync;Germany3D.sync=function(...a){stamps.push(performance.now());return sync.apply(this,a)};const sample=now=>{if(now-start<1200)return requestAnimationFrame(sample);Germany3D.sync=sync;const intervals=stamps.slice(1).map((x,i)=>x-stamps[i]).sort((a,b)=>a-b);resolve({metric:'game sync dispatch ms',p50:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)],frames:intervals.length})};requestAnimationFrame(sample)}));
    }
    if(name!=='baseline'&&name!=='splat-failure'){if(label==='closed')assert.equal(state.splat.mouth.open,0);if(label==='open-vowel')assert(state.splat.mouth.open>.2);if(label==='rounded')assert(state.splat.mouth.round>.8)}
    await page.evaluate(()=>{BuergeramtLevel.update=omenUpdate;omenPlayers.at(-1).play()});
   }
   await page.evaluate(()=>clearInterval(traceTimer));
   await page.waitForFunction(()=>BuergeramtLevel.omen.phase==='glare',null,{timeout:8000});
   await page.evaluate(()=>{BuergeramtLevel.update=()=>{};omenStep(.05)});const end=await inspect();assert(end.players.at(-1).ended);
   if(name!=='baseline'&&name!=='splat-failure')assert.equal(end.splat.mouth.open,0);
   const trace=await page.evaluate(()=>mouthTrace);rows.push({name,frameTiming,held,paused,trace});
  }
  await page.screenshot({path:`${output}/${name}-glare.png`});await page.evaluate(()=>{for(let i=0;i<500&&BuergeramtLevel.omen.phase;i++)omenStep(.025)});await page.waitForTimeout(100);
  assert.equal((await inspect()).phase,'');await page.locator('#amt-direct-reset').evaluate(n=>n.click());await page.locator('#amt-leave').evaluate(n=>n.click());await page.waitForTimeout(80);
  assert((await inspect()).players.every(p=>p.paused));assert.deepEqual(errors,[]);assert(!warnings.some(w=>/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(w)));
  const row=rows.find(r=>r.name===name)||{name};Object.assign(row,{result:'PASS',silent:true,physicalAndroid:false,samples,errors,warnings,requests});if(!rows.includes(row))rows.push(row);
  writeFileSync(`${output}/results.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify({name,result:'PASS',frameTiming:row.frameTiming,errors}));await context.close();await browser.close();browser=null;
 }
}finally{await browser?.close()}
