// Silent GPU evidence. The server adds private camera/time seams for accelerated
// texture evolution; production movement, hidden clocks and lifecycle are separate.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.FLOOR_OUTPUT||'output/oil-floor/browser');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg','.glb':'model/gltf-binary'};
const files=['world3d.js','buergeramt.js','buergeramt-goop.js','buergeramt-floor.js','index.html','3d.html'];
const sources=new Map(files.map(file=>[resolve(file),readFileSync(file)]));
const server=createServer((req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep))throw Error('path');let data=sources.get(file)||readFileSync(file);
    if(file===resolve('game.js'))data=data.toString().replace('const directConfig={','const directConfig={cinematics:false,');
    if(file===resolve('buergeramt.js'))data=data.toString().replace('window.BuergeramtLevel={',
      `window.__floorTest={pose(x,z,yaw=0){Object.assign(view,{x,z,yaw})},at(time){floorClock=time;visualClock=goop.motion(time);applyOfficeTempo()},close(){close(false)},reopen(){open(options)},dialogue(){setStage('character')},stage:setStage,speech(){const row=Object.values(window.GermanySimulatorAudioText.recordings).find(r=>r.voiceId==='amt-brunhilde-knick'&&r.source);if(!row)throw Error('Missing native Knick sample');options.voiceOn=()=>true;content(story.clerkIdentity.speaker,row.source)},media(){return recordedSpeech?{rate:recordedSpeech.playbackRate,preservesPitch:recordedSpeech.preservesPitch,time:recordedSpeech.currentTime,duration:recordedSpeech.duration,paused:recordedSpeech.paused}:null}};window.BuergeramtLevel={`);
    if(file===resolve('buergeramt-floor.js'))data=data.toString().replace('const floatMask=','const floatMask=!globalThis.__forceByteFloor&&').replace('return{update,dispose()',`return{update,stats(){if(!targets)return null;const pixels=floatMask?new Float32Array(width*height):new Uint8Array(width*height*4);renderer.readRenderTargetPixels(targets[read],0,0,width,height,pixels);let sum=0,squares=0,white=0,black=0;for(let i=0;i<pixels.length;i+=floatMask?1:4){const v=floatMask?pixels[i]:(pixels[i]*65536+pixels[i+1]*256+pixels[i+2])/16777215;sum+=v;squares+=v*v;if(v>.8)white++;if(v<.2)black++}const count=width*height;return{mean:sum/count,variance:squares/count-(sum/count)**2,white:white/count,black:black/count}},dispose()`);
    if(file===resolve('world3d.js'))data=data.toString().replace('amtCamera.rotation.set(0,-view.yaw,0)','amtCamera.rotation.set(window.__floorPitch||0,-view.yaw,0)')
      .replace('  app.classList.add("three-ready");',`window.__floorGpu={stats:()=>amtFloorEffect.stats(),advance(seconds){const start=BuergeramtLevel.floorState.time;for(let n=1;n<=Math.round(seconds*20);n++){__floorTest.at(start+n/20);amtFloorEffect.update(BuergeramtLevel.floorState,amtReducedMotion.matches,BuergeramtLevel.view,BuergeramtLevel.characters)}},fade(strength){fadeAmtStructure(strength)},render(){renderer.render(amtScene,amtCamera)},backend(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}};app.classList.add("three-ready");`);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={complete:false,revision:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(sources.get(resolve(file))).digest('hex')])),cases:[],
  limits:['Forced camera/accelerated pigment state, not natural mission-chain evidence','Desktop Chromium and Android emulation; no physical Android','Media, Web Audio and speech muted; no listening review']};
const cases=[['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['procedural-fallback',1280,800]];
try{
  for(const [name,width,height]of cases){
    if(process.env.FLOOR_CASE&&!process.env.FLOOR_CASE.split(',').includes(name))continue;
    console.log(name,'boot');const mobile=name.startsWith('android');
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
    if(name==='procedural-fallback')await context.addInitScript(()=>{window.__forceByteFloor=true;});
    await context.addInitScript(()=>{
      Math.random=()=>.6;
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const g=this.context.createGain();g.gain.value=0;connect.call(g,target);return connect.call(this,g,...args)}return connect.call(this,target,...args)};
      const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|GLSL/i.test(m.text()))errors.push(m.text())});
    await page.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.officeAssetsReady,null,{timeout:120000});
    await page.evaluate(()=>{window.__floorStep=BuergeramtLevel.update;BuergeramtLevel.update=()=>{};window.__floorRender=Germany3D.sync;Germany3D.sync=()=>{};window.__floorPitch=-.58;__floorTest.pose(0,4.8);__floorTest.stage('walk-sign');__floorTest.at(0);__floorRender()});
    const captures=[];
    for(const time of [0,15,60,105,150,210,360]){
      await page.evaluate(time=>{__floorGpu.advance(time-BuergeramtLevel.floorState.time);__floorRender()},time);
      const state=await page.evaluate(()=>({...Germany3D.amtFloor,pigment:__floorGpu.stats(),render:Germany3D.inspectAssets().render,memory:Germany3D.inspectAssets().memory}));
      assert.equal(state.failure,null);assert.equal(state.time,time);assert.equal(state.targets,time===0||name==='procedural-fallback'?0:2);assert.equal(state.speed,1-.6*state.melt);
      assert.equal(state.depthWrite,true);assert.equal(state.transparent,false);assert.equal(state.opacity,1);
      assert.equal(state.textureBytes,time===0||name==='procedural-fallback'?0:(width<=700?128*160:256*320)*8);
      if(state.pigment){assert.ok(state.pigment.white>.02&&state.pigment.black>.02,'retain both oils through six minutes');assert.ok(state.pigment.variance>.025,'do not diffuse to a featureless grey floor');}
      const screenshot=await page.screenshot({path:resolve(out,`${name}-${time}s.png`)});captures.push({time,...state,screenshotHash:createHash('sha256').update(screenshot).digest('hex')});
      if(time===210){await page.evaluate(()=>{window.__floorPitch=0;__floorRender()});await page.screenshot({path:resolve(out,name+'-eye-level.png')});await page.evaluate(()=>{window.__floorPitch=-.58;__floorRender()});}
      console.log(name,time,'seconds',state.steps,'steps',state.pigment);
    }
    // A held frame is identical: no paint re-seeding, unrelated global-time wave
    // or idle simulation hidden in the material hook.
    await page.evaluate(()=>__floorRender());assert.deepEqual(await page.evaluate(()=>__floorGpu.stats()),captures.at(-1).pigment);
    const beforeWalk=await page.evaluate(()=>({x:BuergeramtLevel.view.x,ripples:Germany3D.amtFloor.footsteps}));
    await page.keyboard.down('KeyA');await page.evaluate(()=>{for(let n=0;n<10;n++){__floorStep(.1);__floorRender()}});await page.keyboard.up('KeyA');
    const afterWalk=await page.evaluate(()=>({x:BuergeramtLevel.view.x,ripples:Germany3D.amtFloor.footsteps,speed:BuergeramtLevel.timeScale}));
    assert.ok(Math.abs(beforeWalk.x-afterWalk.x-1.44)<.01,'accepted walking travels 40% of its original speed');assert.ok(afterWalk.ripples>beforeWalk.ripples,'walking must stir the liquid');
    await page.evaluate(()=>{for(let n=0;n<200;n++){__floorStep(.05);__floorRender()}});
    const walking=await page.evaluate(()=>({before:Germany3D.amtFloor,pigment:__floorGpu.stats()}));assert.ok(walking.before.footsteps>afterWalk.ripples,'nearby NPC roots also make ripples');assert.ok(walking.before.activeRipples<=walking.before.rippleLimit);
    await page.screenshot({path:resolve(out,name+'-walking-ripples.png')});
    const progression=await page.evaluate(()=>({clock:BuergeramtLevel.floorState.time,targets:Germany3D.amtFloor.targets}));
    await page.evaluate(()=>{__floorTest.dialogue();__floorStep(.1);__floorRender()});
    assert.ok(await page.evaluate(time=>Math.abs(BuergeramtLevel.floorState.time-time-.1)<1e-8,progression.clock));
    // Existing material isolation must restore the original flags exactly.
    const fade=await page.evaluate(()=>{const samples=[];for(const v of [0,.2,.6,1,.6,.2,0]){__floorGpu.fade(v);__floorGpu.render();samples.push({strength:v,...Germany3D.amtFloor})}return samples});
    for(const s of fade){assert.equal(s.opacity,1-s.strength);assert.equal(s.transparent,s.strength>0);assert.equal(s.depthWrite,s.strength===0);}
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>__floorRender());
    const reduced=await page.evaluate(()=>Germany3D.amtFloor);assert.equal(reduced.targets,0);assert.equal(reduced.melt,1);assert.equal(reduced.speed,.4);
    await page.screenshot({path:resolve(out,name+'-reduced.png')});await page.emulateMedia({reducedMotion:'no-preference'});
    // Explicit close releases resources even on the direct-office route, which
    // intentionally skips the normal city render path while closed.
    const visits=[];
    for(let i=0;i<3;i++){
      await page.evaluate(()=>{__floorTest.close()});assert.equal(await page.evaluate(()=>Germany3D.amtFloor.targets),0);
      await page.evaluate(()=>{__floorTest.reopen();__floorTest.pose(0,4.8);__floorTest.stage('walk-sign');__floorTest.at(0);__floorRender();__floorGpu.advance(30);__floorRender()});
      visits.push(await page.evaluate(()=>({floor:Germany3D.amtFloor,memory:Germany3D.inspectAssets().memory})));
    }
    assert.ok(visits.at(-1).memory.textures<=visits[0].memory.textures+2,'no rising floor texture cache across visits');
    const audio=[];
    if(name==='desktop'){
      await page.evaluate(()=>{__floorTest.at(210);__floorTest.speech()});await page.waitForFunction(()=>__floorTest.media()?.time>0,null,{timeout:15000});
      for(const age of [210,105,0]){await page.evaluate(age=>__floorTest.at(age),age);const before=await page.evaluate(()=>({wall:performance.now(),...__floorTest.media()}));await page.waitForTimeout(800);const after=await page.evaluate(()=>({wall:performance.now(),...__floorTest.media()}));const rate=(after.time-before.time)/((after.wall-before.wall)/1000);assert.equal(after.rate,age===210?.4:age===105?.7:1);assert.equal(after.preservesPitch,false);assert.ok(Math.abs(rate-after.rate)<.08,'native media time must follow the shared rate');audio.push({age,before,after,observedRate:rate});}
    }
    const backend=await page.evaluate(()=>__floorGpu.backend());assert.deepEqual(errors,[]);
    report.cases.push({name,verdict:'PASS',backend,captures,walking,fade,reduced,visits,audio,errors});console.log(name,'PASS');await context.close();
  }
  report.complete=true;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done));}
