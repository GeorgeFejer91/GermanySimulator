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
const files=['world3d.js','buergeramt.js','buergeramt-goop.js','buergeramt-floor.js','buergeramt-portrait-melt.js','buergeramt-lamps.js','index.html','3d.html'];
const sources=new Map(files.map(file=>[resolve(file),readFileSync(file)]));
if(process.env.FLOOR_SOURCE_FILE)sources.set(resolve('buergeramt-floor.js'),readFileSync(process.env.FLOOR_SOURCE_FILE));
if(process.env.PORTRAIT_SOURCE_FILE)sources.set(resolve('buergeramt-portrait-melt.js'),readFileSync(process.env.PORTRAIT_SOURCE_FILE));
function samplePortraitPaint(which,amount,clock,bareRgb=[54,43,25]){
  const width=128,height=160,target=new T.WebGLRenderTarget(width,height),scene=new T.Scene();
  const camera=new T.OrthographicCamera(-.725,.725,.97,-.97,.01,3);camera.position.z=1;
  const geometry=which==='frame'?presidentCanvas.geometry:new T.PlaneGeometry(1.45,1.94);
  const material=which==='frame'?presidentMaterial:new T.ShaderMaterial({
    uniforms:{amtPortraitPaint:{value:presidentMaterial.map},amtPortraitInfo:{value:new T.Vector4(0,0,1,1)},probeMelt:{value:amount},probeClock:{value:clock}},
    vertexShader:'varying vec2 paintUv;void main(){paintUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 paintUv;uniform float probeMelt,probeClock;'+portraitPaintGlsl+'void main(){float coverage=amtPaintFilm(vec2(paintUv.x,1.-paintUv.y),probeMelt,probeClock).a;gl_FragColor=vec4(vec3(coverage),1.);}'
  });
  scene.add(new T.Mesh(geometry,material));
  if(which==='frame'){
    const source=presidentFrame.children.find(mesh=>mesh.name==='Steinmeier liquid paint');
    if(source?.visible){const sheet=new T.Mesh(source.geometry,source.material);sheet.position.copy(source.position);scene.add(sheet);}
  }
  const previousTarget=renderer.getRenderTarget(),previousClear=renderer.autoClear,pixels=new Uint8Array(width*height*4);
  try{renderer.autoClear=true;renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);}
  finally{renderer.setRenderTarget(previousTarget);renderer.autoClear=previousClear;target.dispose();if(which!=='frame'){geometry.dispose();material.dispose();}}
  const low=[255,255,255],high=[0,0,0],sum=[0,0,0],bands=Array(8).fill(0);let covered=0,run=0,longest=0;
  for(let i=0;i<pixels.length;i+=4)for(let channel=0;channel<3;channel++){const value=pixels[i+channel];low[channel]=Math.min(low[channel],value);high[channel]=Math.max(high[channel],value);sum[channel]+=value;}
  for(let x=0;x<width;x++){const painted=pixels[(Math.floor(height/2)*width+x)*4]>127;if(painted){covered++;run++;longest=Math.max(longest,run)}else run=0;}
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,painted=which==='film'?pixels[i]>127:bareRgb.some((value,channel)=>Math.abs(pixels[i+channel]-value)>4);
    if(painted)bands[7-Math.floor(y*8/height)]++;
  }
  return{low,high,sum,range:high.map((value,index)=>value-low[index]),coverage:covered/width,connected:longest/width,bands:bands.map(count=>count/(width*height/8))};
}
const server=createServer((req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep))throw Error('path');let data=sources.get(file)||readFileSync(file);
    if(file===resolve('game.js'))data=data.toString().replace('const directConfig={','const directConfig={cinematics:false,');
    if(file===resolve('buergeramt.js'))data=data.toString().replace('window.BuergeramtLevel={',
      `window.__floorTest={pose(x,z,yaw=0){Object.assign(view,{x,z,yaw})},at(time){floorClock=time;visualClock=goop.motion(time);applyOfficeTempo()},recover(){activated=true;registeredName='Erika Mustermann';number=counterCalls[2];assignedCounter=3;counter.x=counterXs[2];deadline=200;view.x=counter.x;view.z=counter.z+1;setStage('walk-counter');},close(){close(false)},reopen(){open(options)},dialogue(){setStage('character')},stage:setStage,speech(){const row=Object.values(window.GermanySimulatorAudioText.recordings).filter(r=>r.voiceId==='amt-brunhilde-knick'&&r.source).sort((a,b)=>b.source.length-a.source.length)[0];if(!row)throw Error('Missing native Knick sample');options.voiceOn=()=>true;content(story.clerkIdentity.speaker,row.source)},media(){return recordedSpeech?{rate:recordedSpeech.playbackRate,preservesPitch:recordedSpeech.preservesPitch,time:recordedSpeech.currentTime,duration:recordedSpeech.duration,paused:recordedSpeech.paused}:null}};window.BuergeramtLevel={`);
    if(file===resolve('buergeramt-floor.js'))data=data.toString().replace('const floatMask=','const floatMask=!globalThis.__forceByteFloor&&').replace('return{update,setLights',`return{update,stats(){if(!targets)return null;const pixels=new Float32Array(width*height*4);renderer.readRenderTargetPixels(targets[read],0,0,width,height,pixels);let sum=0,squares=0,white=0,black=0,paint=0,colored=0,interfaces=0;for(let i=0;i<pixels.length;i+=4){const v=pixels[i];sum+=v;squares+=v*v;paint+=pixels[i+3];if(v>.8)white++;if(v<.2)black++;if(Math.abs(pixels[i]-pixels[i+1])+Math.abs(pixels[i+1]-pixels[i+2])>.012)colored++;const cell=i/4,x=cell%width,y=Math.floor(cell/width);if(x<width-1&&(v>.5)!=(pixels[i+4]>.5))interfaces+=19.2/height;if(y<height-1&&(v>.5)!=(pixels[i+width*4]>.5))interfaces+=15.4/width;}const count=width*height;return{mean:sum/count,variance:squares/count-(sum/count)**2,white:white/count,black:black/count,paint:paint/count,colored:colored/count,interfaceDensity:interfaces/(15.4*19.2)}},setLights`);
    if(file===resolve('world3d.js'))data=data.toString().replace('import {createAmtPortraitMelt}','import {createAmtPortraitMelt,portraitPaintGlsl}').replace('amtCamera.rotation.set(view.pitch||0,-view.yaw,0,"YXZ")','amtCamera.rotation.set(window.__floorPitch??view.pitch??0,-view.yaw,0,"YXZ")')
      .replace('  app.classList.add("three-ready");',`window.__floorGpu={samplePortraitPaint:${samplePortraitPaint.toString()},stats:()=>amtFloorEffect.stats(),advance(seconds){const start=BuergeramtLevel.floorState.time;for(let n=1;n<=Math.round(seconds*20);n++){__floorTest.at(start+n/20);amtFloorEffect.update(BuergeramtLevel.floorState,amtReducedMotion.matches,BuergeramtLevel.view,BuergeramtLevel.characters);amtPortraitMelt.update(BuergeramtLevel.floorState,amtReducedMotion.matches);amtLampWear.update(BuergeramtLevel.floorState,amtReducedMotion.matches)}},fade(strength){fadeAmtStructure(strength)},render(){renderer.render(amtScene,amtCamera)},backend(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}};app.classList.add("three-ready");`);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={complete:false,revision:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(sources.get(resolve(file))).digest('hex')])),cases:[],
  limits:['Forced camera/accelerated pigment state, not natural mission-chain evidence','Desktop Chromium and Android emulation; no physical Android','Media, Web Audio and speech muted; no listening review']};
const cases=[['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['procedural-fallback',1280,800],...(process.env.FLOOR_RECOVERY||process.env.PORTRAIT_LIQUID||process.env.PORTRAIT_OIL?[['reduced-motion',1280,800]]:[]),...(process.env.PORTRAIT_LIQUID||process.env.PORTRAIT_OIL?[['missing-portrait',1280,800]]:[])];
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
    if(name==='missing-portrait')await page.route('**/president-steinmeier.webp?*',route=>route.abort());
    page.on('pageerror',e=>{errors.push(e.message);console.log('page error:',e.message)});page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|GLSL/i.test(m.text()))errors.push(m.text())});
    await page.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
    console.log(name,'DOM ready');await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.officeAssetsReady,null,{timeout:120000});
    await page.evaluate(()=>{window.__floorStep=BuergeramtLevel.update;BuergeramtLevel.update=()=>{};window.__floorRender=Germany3D.sync;Germany3D.sync=()=>{};window.__floorPitch=-.58;__floorTest.pose(0,4.8);__floorTest.stage('walk-sign');__floorTest.at(0);__floorRender()});
    if(process.env.PORTRAIT_LIQUID||process.env.PORTRAIT_OIL){
      if(name==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
      const intact=await page.evaluate(()=>__floorGpu.samplePortraitPaint('frame',0,0));
      await page.evaluate(()=>{__floorTest.at(570);__floorRender()});
      const drained=await page.evaluate(()=>__floorGpu.samplePortraitPaint('frame',1,BuergeramtLevel.floorState.visualTime));
      if(name==='missing-portrait')assert.deepEqual(drained,intact,'missing art must retain its labeled fallback');
      else{assert(Math.max(...intact.range)>40,'actual paint is present before melting');assert(drained.range.every(range=>range<=1),'the entire picture leaves the frame at full melt');}
      await page.evaluate(()=>{__floorTest.at(BuergeramtGoop.ageForMelt(.25));__floorRender()});
      const film=name==='missing-portrait'?null:await page.evaluate(()=>__floorGpu.samplePortraitPaint('film',.25,BuergeramtLevel.floorState.visualTime));
      const softened=name==='missing-portrait'?null:await page.evaluate(bare=>__floorGpu.samplePortraitPaint('frame',.25,BuergeramtLevel.floorState.visualTime,bare),drained.low);
      if(softened){
        assert((softened.bands[0]+softened.bands[1])/2>.2,'paint remains near its original top while dissolving instead of the whole image falling');
        const middle=softened.bands.slice(2,7).reduce((sum,value)=>sum+value,0)/5;
        assert(middle<.95&&middle>.02,'interior paint erodes in place with some pigment remaining');
      }
      if(film){assert(film.coverage>.2,'thick runs carry substantial paint');assert(film.connected>.12,'oil includes broad merging runs');assert(film.bands.at(-1)<film.bands[0],'unequal liquid fronts leave gaps toward the floor');}
      await page.evaluate(()=>{__floorTest.at(0);__floorRender()});
      const captures=[];
      for(const age of [0,90,105,120,150,180,210,240,270,300,370,420,570]){
        await page.evaluate(age=>{__floorGpu.advance(age-BuergeramtLevel.floorState.time);const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+1.2,p.z-2.5,Math.atan2(-1.2,-2.5));window.__floorPitch=-.13;__floorRender()},age);
        const state=await page.evaluate(()=>({floor:Germany3D.amtFloor,portrait:Germany3D.amtPortraitMelt,pigment:__floorGpu.stats()}));
        assert.equal(state.portrait.paintMelt,name==='missing-portrait'?0:Math.min(1,state.floor.melt*2.2));
        if(age===150&&state.pigment&&name!=='missing-portrait'){assert(state.pigment.paint>.000001,'the whole sheet deposits paint soon after onset');assert(state.pigment.colored>.000001);}
        if(name==='missing-portrait'&&state.pigment){assert.equal(state.pigment.paint,0);assert.equal(state.pigment.colored,0);}
        await page.screenshot({path:resolve(out,`${name}-liquid-${age}s.png`)});captures.push({age,...state});
      }
      assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',intact,drained,softened,film,captures,errors});console.log(name,'oil PASS');await context.close();continue;
    }
    if(process.env.FLOOR_MOTION){
      await page.evaluate(()=>{__floorGpu.advance(675);__floorRender()});
      const states=[];
      const capture=async label=>{const state=await page.evaluate(()=>({floor:Germany3D.amtFloor,view:{...BuergeramtLevel.view}}));await page.screenshot({path:resolve(out,`${name}-${label}.png`)});states.push({label,...state});};
      const step=seconds=>page.evaluate(seconds=>{for(let i=0;i<Math.round(seconds*20);i++){__floorStep(.05);__floorRender()}},seconds);
      await capture('lit-start');
      await page.keyboard.down('KeyD');await step(1);await page.keyboard.up('KeyD');await capture('lit-walking');
      assert.ok(states.at(-1).view.walkedDistance>states[0].view.walkedDistance);
      await step(1);await capture('lit-stopped');
      assert.equal(states.at(-1).view.walkedDistance,states.at(-2).view.walkedDistance);
      await page.evaluate(()=>{__floorTest.pose(7.25,4.8);__floorStep(.1);__floorRender()});
      await page.keyboard.down('KeyD');await step(1);await capture('lit-wall-start');
      await step(1);await page.keyboard.up('KeyD');await capture('lit-wall-held');
      assert.equal(states.at(-1).view.walkedDistance,states.at(-2).view.walkedDistance);
      await page.evaluate(()=>{__floorTest.pose(0,4.8);__floorRender()});
      await page.keyboard.down('ArrowLeft');
      for(let n=0;n<6;n++){await step(.1);await capture('lit-camera-'+n);}
      await page.keyboard.up('ArrowLeft');
      await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>__floorRender());await capture('lit-reduced');
      assert.equal(states.at(-1).floor.targets,0);await page.evaluate(()=>__floorRender());await capture('lit-reduced-held');
      assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',states,errors});await context.close();continue;
    }
    if(process.env.FLOOR_RECOVERY){
      if(name==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
      const captures=[];
      await page.evaluate(()=>{__floorTest.at(1200);__floorRender()});
      const dark=await page.evaluate(()=>Germany3D.amtLamps);assert.equal(dark.dead,5);
      await page.evaluate(()=>{__floorTest.recover();__floorTest.stage('counter');__floorRender()});
      for(const time of [0,.1,45,90]){
        const previous=captures.at(-1)?.time||0;
        await page.evaluate(seconds=>{let left=seconds;while(left>1e-8){const dt=Math.min(.1,left);__floorStep(dt);left-=dt}__floorRender()},time-previous);
        const state=await page.evaluate(()=>({floor:Germany3D.amtFloor,portrait:Germany3D.amtPortraitMelt,lamps:Germany3D.amtLamps,clock:BuergeramtLevel.floorState}));
        const progress=time/90;assert.ok(Math.abs(state.clock.speed-(.65+.35*progress))<1e-8);
        assert.ok(Math.abs(state.clock.goop-(1-progress))<1e-8);assert.equal(state.portrait.melt,state.floor.melt);
        if(!process.env.PORTRAIT_SOURCE_FILE)assert.equal(state.portrait.paintMelt,Math.min(1,state.floor.melt*2.2));
        assert.ok(state.lamps.levels.every(level=>Math.abs(level-progress)<1e-6));assert.equal(state.floor.failure,null);
        if(time===90)assert.equal(state.floor.targets,0);
        const screenshot=await page.screenshot({path:resolve(out,`${name}-recovery-${time}s.png`)});
        captures.push({time,...state,screenshotHash:createHash('sha256').update(screenshot).digest('hex')});
        await page.evaluate(()=>{const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+1.2,p.z-2.5,Math.atan2(-1.2,-2.5));window.__floorPitch=-.13;__floorRender()});
        await page.screenshot({path:resolve(out,`${name}-portrait-recovery-${time}s.png`)});
        await page.evaluate(()=>{__floorTest.pose(BuergeramtLevel.assignedCounter.x,-7.15);window.__floorPitch=-.58;__floorRender()});
      }
      assert.deepEqual(errors,[]);report.cases.push({name,captures,errors});console.log(name,'recovery PASS');await context.close();continue;
    }
    const captures=[];
    for(const time of [0,30,60,89.9,90,90.1,120,150,210,290,370,420,450,510,570,600,780,900,1200]){
      await page.evaluate(time=>{__floorGpu.advance(time-BuergeramtLevel.floorState.time);__floorRender()},time);
      const state=await page.evaluate(()=>({...Germany3D.amtFloor,portrait:Germany3D.amtPortraitMelt,lamps:Germany3D.amtLamps,pigment:__floorGpu.stats(),render:Germany3D.inspectAssets().render,memory:Germany3D.inspectAssets().memory}));
      assert.equal(state.failure,null);assert.equal(state.time,time);assert.equal(state.targets,time<=90||name==='procedural-fallback'?0:2);assert.equal(state.speed,1-.35*state.melt);
      if(time<=90){assert.equal(state.melt,0);assert.equal(state.speed,1);assert.equal(state.portrait.dripsVisible,false);assert.equal(state.footsteps,0);assert.equal(state.steps,0);}
      assert.equal(state.depthWrite,true);assert.equal(state.transparent,false);assert.equal(state.opacity,1);
      const compact=mobile||width<=700;
      assert.deepEqual(state.resolution,compact?[128,160]:[256,320]);
      assert.equal(state.textureBytes,time<=90||name==='procedural-fallback'?0:(compact?128*160:256*320)*32);
      assert.equal(state.portrait.melt,state.melt);
      if(!process.env.PORTRAIT_SOURCE_FILE)assert.equal(state.portrait.paintMelt,Math.min(1,state.melt*2.2));if(time>=570&&state.pigment){assert.ok(state.pigment.paint>.00002,'portrait paint enters the persistent floor');assert.ok(state.pigment.colored>.00002,'actual portrait colors mix with the tiles');}if(state.pigment){assert.ok(state.pigment.white>.02&&state.pigment.black>.02,'retain both oils through the waves');assert.ok(state.pigment.variance>.025,'do not diffuse to a featureless grey floor');}
      if(time===420&&state.pigment){assert.ok(state.pigment.paint>.000001,'portrait paint reaches the floor before the previous drip onset');assert.ok(state.pigment.colored>.000001,'early deposited portrait colors mix into the black and white oil');}
      const screenshot=await page.screenshot({path:resolve(out,`${name}-${time}s.png`)});captures.push({time,...state,screenshotHash:createHash('sha256').update(screenshot).digest('hex')});
      if(time===60){
        // The central aisle avoids the Nummernflüsterer's x=-3.25..-2.65
        // patrol. A speed measurement must not depend on his boot-time pose.
        await page.evaluate(()=>{__floorTest.pose(1.8,4.8);__floorTest.stage('walk-sign');__floorRender()});
        const before=await page.evaluate(()=>BuergeramtLevel.view.x);
        await page.keyboard.down('KeyA');await page.evaluate(()=>{for(let n=0;n<10;n++){__floorStep(.1);__floorRender()}});await page.keyboard.up('KeyA');
        const walking=await page.evaluate(()=>({x:BuergeramtLevel.view.x,view:BuergeramtLevel.view,stage:BuergeramtLevel.stage,speed:BuergeramtLevel.timeScale,floor:Germany3D.amtFloor}));
        assert.ok(Math.abs(before-walking.x-3.6)<.01,`grace-period walking remains full speed: ${JSON.stringify({before,...walking})}`);assert.equal(walking.speed,1);assert.equal(walking.floor.targets,0);assert.equal(walking.floor.footsteps,0);
        captures.at(-1).graceWalking={before,...walking};
        await page.evaluate(()=>{__floorTest.pose(0,4.8);__floorTest.at(60);__floorRender()});
      }
      await page.evaluate(()=>{__floorTest.pose(BuergeramtStory.presidentPortrait.x,1.7,Math.PI);window.__floorPitch=0;__floorRender()});await page.screenshot({path:resolve(out,`${name}-portrait-${time}s.png`)});await page.evaluate(()=>{__floorTest.pose(0,4.8);window.__floorPitch=-.58;__floorRender()});
      if(time>=300){await page.evaluate(()=>{const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+2,p.z-3,Math.atan2(-2,-3));window.__floorPitch=-.1;__floorRender()});await page.screenshot({path:resolve(out,`${name}-portrait-contact-${time}s.png`)});await page.evaluate(()=>{__floorTest.pose(0,4.8);window.__floorPitch=-.58;__floorRender()});}
      if(time===900){await page.evaluate(()=>{window.__floorPitch=0;__floorRender()});await page.screenshot({path:resolve(out,name+'-eye-level.png')});await page.evaluate(()=>{window.__floorPitch=-.58;__floorRender()});}
      console.log(name,time,'seconds',state.steps,'steps',state.pigment);
    }
    const performanceSamples=[];
    if(process.env.FLOOR_PERF)for(let run=0;run<3;run++)performanceSamples.push(await page.evaluate(async()=>{
      const dispatch=[],intervals=[];let previous=performance.now();
      for(let frame=0;frame<120;frame++)await new Promise(done=>requestAnimationFrame(now=>{
        const dt=Math.min(.1,(now-previous)/1000);intervals.push(now-previous);previous=now;
        const start=performance.now();__floorStep(dt);__floorRender();dispatch.push(performance.now()-start);done();
      }));
      const summary=values=>{const sorted=values.sort((a,b)=>a-b);return {p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)}};
      return {dispatchMs:summary(dispatch),frameIntervalMs:summary(intervals)};
    }));
    if(process.env.FLOOR_PATTERN_ONLY){assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',captures,performanceSamples,errors});await context.close();continue;}
    // A held frame is identical: no paint re-seeding, unrelated global-time wave
    // or idle simulation hidden in the material hook.
    const heldPigment=await page.evaluate(()=>__floorGpu.stats());
    await page.evaluate(()=>__floorRender());assert.deepEqual(await page.evaluate(()=>__floorGpu.stats()),heldPigment);
    await page.evaluate(()=>{__floorTest.pose(1.8,4.8);__floorTest.stage('walk-sign');__floorRender()});
    const beforeWalk=await page.evaluate(()=>({x:BuergeramtLevel.view.x,ripples:Germany3D.amtFloor.footsteps}));
    await page.keyboard.down('KeyA');await page.evaluate(()=>{for(let n=0;n<10;n++){__floorStep(.1);__floorRender()}});await page.keyboard.up('KeyA');
    const afterWalk=await page.evaluate(()=>({x:BuergeramtLevel.view.x,ripples:Germany3D.amtFloor.footsteps,speed:BuergeramtLevel.timeScale}));
    assert.ok(Math.abs(beforeWalk.x-afterWalk.x-2.34)<.01,'accepted walking travels 65% of its original speed');assert.ok(afterWalk.ripples>beforeWalk.ripples,'walking must stir the liquid');
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
    const reduced=await page.evaluate(()=>Germany3D.amtFloor);assert.equal(reduced.targets,0);assert.equal(reduced.melt,1);assert.equal(reduced.speed,.65);
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
    if(name==='desktop'&&process.env.FLOOR_AUDIO!=='0'){
      await page.evaluate(()=>{__floorTest.at(900);__floorTest.speech()});await page.waitForFunction(()=>__floorTest.media()?.time>0,null,{timeout:15000});
      for(const age of [0,60,90,150,210,290,370,570]){await page.evaluate(age=>{__floorTest.at(age);__floorTest.speech()},age);await page.waitForFunction(()=>__floorTest.media()?.time>.5,null,{timeout:15000});const before=await page.evaluate(()=>({wall:performance.now(),...__floorTest.media()}));await page.waitForTimeout(2500);const after=await page.evaluate(()=>({wall:performance.now(),...__floorTest.media()}));const rate=(after.time-before.time)/((after.wall-before.wall)/1000);assert.equal(after.rate,await page.evaluate(age=>BuergeramtGoop.speed(age),age));assert.equal(after.preservesPitch,false);console.log('media rate',age,{expected:after.rate,observed:rate,before:before.time,after:after.time,paused:after.paused});assert.ok(Math.abs(rate-after.rate)<.08,'native media time must follow the shared rate');audio.push({age,before,after,observedRate:rate});}
    }
    const lampStages=[];
    for(const age of [600,780,900,1020,1110,1200]){
      await page.evaluate(age=>{__floorTest.at(age);__floorTest.pose(0,4.8);window.__floorPitch=.35;__floorRender()},age);
      const lamps=await page.evaluate(()=>Germany3D.amtLamps);assert.equal(lamps.age,age);assert.equal(lamps.clock,await page.evaluate(()=>BuergeramtLevel.floorState.visualTime));
      assert.equal(lamps.dead,[600,780,900,1020,1110,1200].indexOf(age));assert.equal(await page.evaluate(()=>BuergeramtLevel.timeScale),await page.evaluate(age=>BuergeramtGoop.speed(age),age));
      await page.screenshot({path:resolve(out,`${name}-lamps-${age}s.png`)});lampStages.push(lamps);
    }
    assert.ok(lampStages.at(-1).illumination<.01);
    const portraitFlow=[];
    if(name==='desktop')for(let age=0;age<=570;age+=30){
      await page.evaluate(age=>{const p=BuergeramtStory.presidentPortrait;__floorTest.at(age);__floorTest.pose(p.x+1.2,p.z-2.5,Math.atan2(-1.2,-2.5));window.__floorPitch=-.13;__floorRender()},age);
      const shot=await page.screenshot({path:resolve(out,`portrait-flow-${String(age).padStart(3,'0')}s.png`)});
      portraitFlow.push({age,...await page.evaluate(()=>Germany3D.amtPortraitMelt),hash:createHash('sha256').update(shot).digest('hex')});
    }
    const backend=await page.evaluate(()=>__floorGpu.backend());assert.deepEqual(errors,[]);
    report.cases.push({name,verdict:'PASS',backend,captures,walking,fade,reduced,visits,audio,lampStages,portraitFlow,performanceSamples,errors});console.log(name,'PASS');await context.close();
  }
  report.complete=true;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done));}
