// Muted real-WebGL integration evidence; direct office route, stepped controller.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/omen-splat/review';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const reports=[];
try{
  const cases=[['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['reduced-motion',1280,800],['asset-failure',1280,800]];
  for(const [name,width,height] of cases.filter(([name])=>!process.env.PLAYTEST_VIEWPORT||name===process.env.PLAYTEST_VIEWPORT)){
    const context=await browser.newContext({viewport:{width,height},isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference',recordVideo:name==='desktop'?{dir:output,size:{width,height}}:undefined});
    await context.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}return connect.call(this,target,...args)};
      speechSynthesis.speak=utterance=>{utterance.volume=0;utterance.onstart?.();if(utterance.text.startsWith('Wer die Finsternis')){window.omenTestSpeech=utterance;utterance.onpause?.()}else utterance.onend?.()};
      window.omenLongTasks=[];new PerformanceObserver(list=>omenLongTasks.push(...list.getEntries().map(item=>item.duration))).observe({type:'longtask'});
    });
    const page=await context.newPage(),errors=[],warnings=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text())});
    page.on('request',r=>{if(/spark|omen\/aktenkurier|buergeramt-splat/.test(r.url()))requests.push(r.url())});
    if(name==='asset-failure')await page.route('**/omen/aktenkurier.splat',route=>route.abort('failed'));
    const base=process.env.GAME_URL||'http://127.0.0.1:8876/index.html';
    await page.goto(base+'?geheim=buergeramt',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.ready&&Germany3D.amtCharacters.every(a=>a.loaded)&&Germany3D.amtOffice?.attached,null,{timeout:90000});
    await page.evaluate(()=>{const update=BuergeramtLevel.update.bind(BuergeramtLevel);window.omenOriginalUpdate=update;BuergeramtLevel.update=()=>{};window.omenStep=seconds=>{for(let t=0;t<seconds;t+=.025)update(Math.min(.025,seconds-t));Germany3D.sync()}});
    const inspect=()=>page.evaluate(()=>({omen:BuergeramtLevel.omen,view:BuergeramtLevel.view,stage:BuergeramtLevel.stage,splat:Germany3D.amtOmenSplat,actor:Germany3D.amtCharacters.find(a=>a.name==='aktenkurier'),assets:Germany3D.inspectAssets()}));
    await page.waitForFunction(()=>Germany3D.amtOmenSplat.ready||Germany3D.amtOmenSplat.skipped,null,{timeout:30000});
    const prepared=await inspect();
    if(name!=='asset-failure')assert.equal(prepared.splat.ready,true,JSON.stringify({prepared,warnings}));
    else assert.equal(prepared.splat.ready,false);
    await page.keyboard.press('ArrowUp');
    await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<150&&BuergeramtLevel.stage!=='omen';i++)omenStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))});
    assert.equal((await inspect()).omen.phase,'approach');
    await page.screenshot({path:`${output}/${name}-approach.png`});
    const approachPhases=[];
    for(const strength of [.18,.45,.75]){
      await page.evaluate(strength=>{for(let i=0;i<300&&BuergeramtLevel.omen.strength<strength&&BuergeramtLevel.omen.phase==='approach';i++)omenStep(.025)},strength);
      await page.waitForTimeout(150);
      const state=await inspect();approachPhases.push(state);
      assert.equal(state.omen.phase,'approach');
      if(name!=='asset-failure'){
        assert(state.splat.reveal>0&&state.splat.reveal<1);
        assert.equal(state.splat.turn,0);
        const yaw=Math.atan2(state.view.x-state.omen.x,state.view.z-state.omen.z);
        assert(Math.abs(state.splat.facingY-yaw)<1e-6,'courier faces player');
        assert.equal(state.splat.pulse,name==='reduced-motion'?0:state.omen.life.pulse);
      }
      await page.screenshot({path:`${output}/${name}-approach-${strength}.png`});
    }
    await page.evaluate(()=>{for(let i=0;i<300&&BuergeramtLevel.omen.phase==='approach';i++)omenStep(.025)});
    assert.equal((await inspect()).omen.phase,'blackout');
    await page.evaluate(()=>{omenTestSpeech.onresume?.();omenTestSpeech.onboundary?.({charIndex:omenTestSpeech.text.indexOf('Finsternis')})});
    await page.waitForTimeout(200);
    const phases=[];
    for(let i=0;i<35;i++){
      await page.evaluate(()=>omenStep(.1));await page.waitForTimeout(100);
      if([0,4,9,15,28].includes(i)){
        const state=await inspect();phases.push(state);
        await page.screenshot({path:`${output}/${name}-morph-${i}.png`});
      }
    }
    const peak=await inspect();
    if(name!=='asset-failure'){
      assert.equal(peak.splat.visible,true);assert.equal(peak.splat.reveal,1);assert.equal(peak.actor.visible,false);
      assert.equal(peak.splat.tunnelVisible,true);assert.equal(peak.splat.tunnelCount,3072);
      if(name==='reduced-motion'){assert.equal(peak.splat.turn,0);assert.equal(peak.splat.ripple,0);assert.equal(peak.splat.tunnelTime,0)}
    }else assert.equal(peak.actor.visible,true);
    const frameSamples=[];
    for(let run=0;run<3;run++)frameSamples.push(await page.evaluate(()=>new Promise(resolve=>{
      BuergeramtLevel.update=omenOriginalUpdate;
      const stamps=[],start=performance.now();
      const sync=Germany3D.sync;Germany3D.sync=function(...args){stamps.push(performance.now());return sync.apply(this,args)};
      const frame=now=>{if(now-start<1500)return requestAnimationFrame(frame);
        BuergeramtLevel.update=()=>{};Germany3D.sync=sync;const times=stamps.slice(1).map((t,i)=>t-stamps[i]).sort((a,b)=>a-b);
        resolve({metric:'game sync dispatch interval',p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],frames:times.length,memory:Germany3D.inspectAssets().memory});};
      requestAnimationFrame(frame);
    })));
    // Existing speech completion owns the abrupt release.
    await page.evaluate(()=>{omenTestSpeech.onresume?.();omenTestSpeech.onend?.();omenStep(.75)});await page.waitForTimeout(200);
    const released=await inspect();assert.equal(released.splat.ready,false);assert.equal(released.actor.visible,true);assert.equal(released.omen.strength,0);
    await page.screenshot({path:`${output}/${name}-release.png`});
    // Replay cancels the old owner and creates a bounded fresh effect.
    await page.locator('#amt-direct-reset').evaluate(node=>node.click());
    await page.waitForFunction(visit=>{const s=Germany3D.amtOmenSplat;return s.visit>visit&&!s.loading&&(s.ready||s.skipped)},prepared.splat.visit,{timeout:30000});
    const replay=await inspect();assert(replay.splat.visit>prepared.splat.visit);
    assert.equal(replay.splat.ready,name!=='asset-failure');
    await page.locator('#amt-leave').evaluate(node=>node.click());await page.waitForTimeout(300);
    const exited=await inspect();assert.equal(exited.splat.ready,false);assert.equal(exited.splat.loading,false);
    assert.deepEqual(errors,[]);
    const unexpectedWarnings=warnings.filter(w=>/Shader Error|VALIDATE_STATUS|GL_INVALID|TypeError/.test(w)&&!(name==='asset-failure'&&w.startsWith('Bürgeramt omen keeps painted fallback TypeError: Failed to fetch')));
    assert.equal(unexpectedWarnings.length,0,JSON.stringify(unexpectedWarnings));
    const evidence=await page.evaluate(()=>({longTasks:omenLongTasks,gpu:(()=>{const gl=document.getElementById('world3d').getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'})()}));
    reports.push({name,silent:true,physicalAndroid:false,prepared,approachPhases,phases,peak,released,replay,exited,frameSamples,requests,errors,warnings,evidence});
    await context.close();writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));
    console.log(JSON.stringify({name,result:'PASS',count:peak.splat.count,errors,gpu:evidence.gpu,p95:frameSamples.map(s=>s.p95),warnings}));
  }
}finally{await browser.close()}
