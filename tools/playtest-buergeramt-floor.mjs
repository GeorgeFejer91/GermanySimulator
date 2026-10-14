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
function samplePigmentRegion(){
  if(!targets)return null;
  const pixels=new Float32Array(width*height*4),bins=[0,.25,.75,1.5,2.5].slice(1).map(edge=>({edge,paintArea:0,coloredArea:0,mixedArea:0}));
  renderer.readRenderTargetPixels(targets[read],0,0,width,height,pixels);
  const cellArea=15.4*19.2/(width*height);let farColoredArea=0,paintMass=0,travelMass=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const worldX=-7.7+(x+.5)*15.4/width,worldZ=-10.45+(y+.5)*19.2/height;
    const travel=amtPortraitInfo.value.y-worldZ;
    if(Math.abs(worldX-amtPortraitInfo.value.x)>1.5||travel<0||travel>2.5)continue;
    const i=(y*width+x)*4,alpha=pixels[i+3],chroma=Math.max(...pixels.slice(i,i+3))-Math.min(...pixels.slice(i,i+3));
    const bin=bins.find(bin=>travel<bin.edge);if(!bin)continue;
    if(alpha>.01)bin.paintArea+=cellArea;
    if(chroma>.02){bin.coloredArea+=cellArea;if(alpha>.03&&alpha<.95)bin.mixedArea+=cellArea;if(travel>.3)farColoredArea+=cellArea;}
    paintMass+=alpha*cellArea;travelMass+=alpha*travel*cellArea;
  }
  return{bins,farColoredArea,paintMass,meanTravel:paintMass?travelMass/paintMass:0};
}
function withoutPaintProbe(render){
  const original=uniforms.amtFloorOil.value,ready=amtPortraitInfo.value.w;let gray;
  try{
    if(targets){
      const pixels=new Float32Array(width*height*4);renderer.readRenderTargetPixels(targets[read],0,0,width,height,pixels);
      for(let i=0;i<pixels.length;i+=4){pixels[i+1]=pixels[i+2]=pixels[i];pixels[i+3]=0;}
      gray=new T.DataTexture(pixels,width,height,T.RGBAFormat,T.FloatType);gray.minFilter=gray.magFilter=T.LinearFilter;gray.needsUpdate=true;uniforms.amtFloorOil.value=gray;
    }
    amtPortraitInfo.value.w=0;render();
  }finally{uniforms.amtFloorOil.value=original;amtPortraitInfo.value.w=ready;gray?.dispose();}
}
function samplePortraitPaint(which,amount,clock,bareRgb=[54,43,25],raw=false){
  const width=128,height=160,target=new T.WebGLRenderTarget(width,height),scene=new T.Scene();
  const camera=new T.OrthographicCamera(-.725,.725,.97,-.97,.01,3);camera.position.z=1;
  const geometry=which==='frame'?presidentCanvas.geometry:new T.PlaneGeometry(1.45,1.94);
  const material=which==='frame'?presidentMaterial:new T.ShaderMaterial({
    uniforms:{amtPortraitPaint:{value:presidentMaterial.map},amtPortraitInfo:{value:new T.Vector4(0,0,1,1)},probeMelt:{value:amount},probeClock:{value:clock}},
    vertexShader:'varying vec2 paintUv;void main(){paintUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 paintUv;uniform float probeMelt,probeClock;'+portraitPaintGlsl+'void main(){vec4 film=amtPaintFilm(vec2(paintUv.x,1.-paintUv.y),probeMelt,probeClock);gl_FragColor=vec4('+(which==='pigment'?'film.rgb*film.a':'vec3(film.a)')+',1.);}'
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
  return{low,high,sum,range:high.map((value,index)=>value-low[index]),coverage:covered/width,connected:longest/width,bands:bands.map(count=>count/(width*height/8)),pixels:raw?pixels:undefined};
}
// Track independently colored facial landmarks through the actual production
// material. This distinguishes a drooping face from uniform portrait runoff.
function sampleFaceDroop(){
  const width=256,height=320,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#101010';ctx.fillRect(0,0,width,height);
  const marks=[['leftEye',.44,.255,'#ff0000'],['rightEye',.60,.27,'#00ff00'],['mouth',.51,.375,'#0000ff'],['chin',.50,.46,'#ff00ff']];
  for(const [,x,y,color]of marks){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x*width,y*height,6,5,0,0,Math.PI*2);ctx.fill();}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const original=presidentMaterial.map,target=new T.WebGLRenderTarget(width,height),scene=new T.Scene();
  const camera=new T.OrthographicCamera(-.725,.725,.97,-.97,.01,3);camera.position.z=1;
  const source=presidentFrame.children.find(mesh=>mesh.name==='Steinmeier liquid paint');
  const mesh=new T.Mesh(source.geometry,source.material);mesh.position.copy(source.position);scene.add(mesh);
  const previousTarget=renderer.getRenderTarget(),previousClear=renderer.autoClear;
  const samples=[];
  try{
    amtPortraitMelt.setTexture(texture);
    for(const amount of [.001,.12]){
      __floorTest.at(BuergeramtGoop.ageForMelt(amount));__floorRender();
      renderer.autoClear=true;renderer.setRenderTarget(target);renderer.render(scene,camera);
      const pixels=new Uint8Array(width*height*4),found=Object.fromEntries(marks.map(([name])=>[name,{count:0,x:0,y:0}]));
      renderer.readRenderTargetPixels(target,0,0,width,height,pixels);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const i=(y*width+x)*4,[r,g,b]=pixels.slice(i,i+3);
        const name=r>70&&g<40&&b<40?'leftEye':g>70&&r<40&&b<40?'rightEye':b>70&&r<40&&g<40?'mouth':r>70&&b>70&&g<40?'chin':null;
        if(name){const mark=found[name];mark.count++;mark.x+=(x+.5)/width;mark.y+=1-(y+.5)/height;}
      }
      for(const mark of Object.values(found)){mark.x/=mark.count;mark.y/=mark.count;}
      samples.push(found);renderer.setRenderTarget(previousTarget);
    }
  }finally{renderer.setRenderTarget(previousTarget);renderer.autoClear=previousClear;amtPortraitMelt.setTexture(original);target.dispose();texture.dispose();__floorTest.at(0);__floorRender();}
  return Object.fromEntries(marks.map(([name])=>[name,{before:samples[0][name],after:samples[1][name],drop:samples[1][name].y-samples[0][name].y}]));
}
// Neutral pigment must remain neutral at both view directions: the user removed
// the previous white reflection overlay, including its strongest close-up view.
function samplePaintSurface(){
  const size=160,target=new T.WebGLRenderTarget(size,size),scene=new T.Scene(),camera=new T.PerspectiveCamera(50,1,.01,10);
  const source=presidentFrame.children.find(mesh=>mesh.name==='Steinmeier liquid paint'),material=source.material.clone();
  material.onBeforeCompile=shader=>{source.material.onBeforeCompile(shader);shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position=vec4(uv*2.-1.,0.,1.);');};
  material.customProgramCacheKey=()=>source.material.customProgramCacheKey()+':paint-probe';
  scene.add(new T.Mesh(source.geometry,material));
  const neutral=new T.DataTexture(new Uint8Array([72,72,72,255]),1,1);neutral.colorSpace=T.SRGBColorSpace;neutral.needsUpdate=true;
  const original=presidentMaterial.map,previous=renderer.getRenderTarget(),auto=renderer.autoClear,clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha(),images=[];
  try{
    amtPortraitMelt.setTexture(neutral);__floorTest.at(BuergeramtGoop.ageForMelt(.25));__floorRender();renderer.setClearColor(0,0);
    for(const x of [-1.2,1.2]){
      camera.position.set(x,0,3);camera.lookAt(0,0,0);renderer.autoClear=true;renderer.setRenderTarget(target);renderer.render(scene,camera);
      const pixels=new Uint8Array(size*size*4);renderer.readRenderTargetPixels(target,0,0,size,size,pixels);images.push(pixels);
    }
  }finally{renderer.setRenderTarget(previous);renderer.autoClear=auto;renderer.setClearColor(clear,alpha);amtPortraitMelt.setTexture(original);material.dispose();neutral.dispose();target.dispose();__floorTest.at(0);__floorRender();}
  let covered=0,changed=0,maximum=0;
  for(let i=0;i<images[0].length;i+=4)if(images[0][i+3]>240&&images[1][i+3]>240){covered++;maximum=Math.max(maximum,images[0][i],images[1][i]);if(Math.abs(images[0][i]-images[1][i])>8)changed++;}
  return{covered,changedFraction:changed/covered,maximum};
}
function sampleContinuousRunoff(amount=1){
  const samples=[],speeds=[];let downwardSteps=0,previous=[];
  // Render a full slow cycle. Components separate free pearls from connected
  // rivulets; density and centroid motion are measured from pixels, not phases.
  for(let step=0;step<80;step++){
    const frame=__floorGpu.samplePortraitPaint('film',amount,486+step*.25,undefined,true),seen=new Uint8Array(128*160),drops=[],streams=[];
    // Exclude the framed-image seam, which joins every run across the top row.
    for(let start=0;start<128*156;start++){
      if(seen[start]||frame.pixels[start*4]<127)continue;
      const queue=[start];seen[start]=1;let minX=128,maxX=0,minY=160,maxY=0,sx=0,sy=0;
      for(let cursor=0;cursor<queue.length;cursor++){
        const index=queue[cursor],x=index%128,y=Math.floor(index/128);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sx+=x;sy+=y;
        for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy,n=ny*128+nx;if(nx>=0&&nx<128&&ny>=0&&ny<156&&!seen[n]&&frame.pixels[n*4]>=127){seen[n]=1;queue.push(n);}}
      }
      const w=maxX-minX+1,h=maxY-minY+1;
      if(minY>2&&maxY<152&&w>=4&&h>=5&&w/h>.3&&w/h<1.8&&queue.length/(w*h)>.55)drops.push({x:sx/queue.length,y:sy/queue.length,w,h,area:queue.length});
      if(maxY>153&&h>60&&w/h<.5)streams.push({w,h,area:queue.length});
    }
    for(const drop of drops){
      const old=previous.filter(old=>Math.abs(old.x-drop.x)<2&&old.y-drop.y>.2&&old.y-drop.y<35).sort((a,b)=>Math.abs(a.x-drop.x)-Math.abs(b.x-drop.x))[0];
      if(old){downwardSteps++;speeds.push((old.y-drop.y)/.25);}
    }
    samples.push({clock:486+step*.25,drops,streams,ground:frame.bands.at(-1),coverage:frame.bands.reduce((a,b)=>a+b)/8});previous=drops;
  }
  speeds.sort((a,b)=>a-b);
  return{samples,downwardSteps,meanDrops:samples.reduce((n,s)=>n+s.drops.length,0)/samples.length,medianSpeed:speeds[Math.floor(speeds.length/2)],meanStreams:samples.reduce((n,s)=>n+s.streams.length,0)/samples.length,detachedFrames:samples.filter(s=>s.drops.length).length,groundFrames:samples.filter(s=>s.ground>.005).length};
}
function sampleRunoffSource(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#0000ff';ctx.fillRect(0,0,64,64);ctx.fillStyle='#ff0000';ctx.fillRect(0,0,64,38);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const original=presidentMaterial.map,samples=[];
  try{presidentMaterial.map=texture;for(const amount of [.25,.55,1])for(const clock of [0,233,486,700]){
    const {pixels}=__floorGpu.samplePortraitPaint('pigment',amount,clock,undefined,true);let upper=0,lower=0;
    // Ignore the first contact row where the framed image blends into runoff.
    for(let y=0;y<144;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(pixels[i]>32)upper++;if(pixels[i+2]>32)lower++;}
    samples.push({amount,clock,upper,lower});
  }}finally{presidentMaterial.map=original;texture.dispose();}
  return samples;
}
function sampleFloorColor(){
  const width=256,height=224,target=new T.WebGLRenderTarget(width,height),scene=new T.Scene();
  target.texture.colorSpace=T.SRGBColorSpace;
  let source;amtScene.updateMatrixWorld(true);amtScene.traverse(item=>{if(item.material===floor)source=item;if(item.isLight)scene.add(item.clone());});
  const mesh=new T.Mesh(source.geometry,floor);mesh.matrixAutoUpdate=false;mesh.matrix.copy(source.matrixWorld);scene.add(mesh);
  const p=BuergeramtStory.presidentPortrait,camera=new T.OrthographicCamera(-2,2,1.75,-1.75,.01,10);
  camera.position.set(p.x,5,p.z-1.75);camera.up.set(0,0,1);camera.lookAt(p.x,0,p.z-1.75);
  const previous=renderer.getRenderTarget(),auto=renderer.autoClear,pixels=new Uint8Array(width*height*4),neutral=new Uint8Array(width*height*4);
  try{renderer.autoClear=true;renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);
    amtFloorEffect.withoutPaintProbe(()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,neutral);});}
  finally{renderer.setRenderTarget(previous);renderer.autoClear=auto;target.dispose();}
  let colored=0,farColored=0,weightedX=0,weightedZ=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,delta=[0,1,2].map(channel=>pixels[i+channel]-neutral[i+channel]),chroma=Math.max(...delta)-Math.min(...delta);
    if(chroma>24){colored++;const z=p.z-3.5+(y+.5)*3.5/height;if(p.z-z>.3)farColored++;weightedX+=p.x+2-(x+.5)*4/width;weightedZ+=z;}
  }
  return{coloredArea:colored*14/(width*height),farColoredArea:farColored*14/(width*height),center:colored?{x:weightedX/colored,z:weightedZ/colored}:null};
}
const server=createServer((req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep))throw Error('path');let data=sources.get(file)||readFileSync(file);
    if(file===resolve('game.js'))data=data.toString().replace('const directConfig={','const directConfig={cinematics:false,');
    if(file===resolve('buergeramt.js'))data=data.toString().replace('window.BuergeramtLevel={',
      `window.__floorTest={pose(x,z,yaw=0){Object.assign(view,{x,z,yaw})},at(time){floorClock=time;visualClock=goop.motion(time);applyOfficeTempo()},recover(){activated=true;registeredName='Erika Mustermann';number=counterCalls[2];assignedCounter=3;counter.x=counterXs[2];deadline=200;view.x=counter.x;view.z=counter.z+1;setStage('walk-counter');},close(){close(false)},reopen(){open(options)},dialogue(){setStage('character')},stage:setStage,speech(){const row=Object.values(window.GermanySimulatorAudioText.recordings).filter(r=>r.voiceId==='amt-brunhilde-knick'&&r.source).sort((a,b)=>b.source.length-a.source.length)[0];if(!row)throw Error('Missing native Knick sample');options.voiceOn=()=>true;content(story.clerkIdentity.speaker,row.source)},media(){return recordedSpeech?{rate:recordedSpeech.playbackRate,preservesPitch:recordedSpeech.preservesPitch,time:recordedSpeech.currentTime,duration:recordedSpeech.duration,paused:recordedSpeech.paused}:null}};window.BuergeramtLevel={`);
    if(file===resolve('buergeramt-floor.js'))data=data.toString().replace('const floatMask=','const floatMask=!globalThis.__forceByteFloor&&').replace('return{update,setLights',`return{update,samplePigmentRegion:${samplePigmentRegion.toString()},withoutPaintProbe:${withoutPaintProbe.toString()},stats(){if(!targets)return null;const pixels=new Float32Array(width*height*4);renderer.readRenderTargetPixels(targets[read],0,0,width,height,pixels);let sum=0,squares=0,white=0,black=0,paint=0,colored=0,interfaces=0;for(let i=0;i<pixels.length;i+=4){const v=pixels[i];sum+=v;squares+=v*v;paint+=pixels[i+3];if(v>.8)white++;if(v<.2)black++;if(Math.abs(pixels[i]-pixels[i+1])+Math.abs(pixels[i+1]-pixels[i+2])>.012)colored++;const cell=i/4,x=cell%width,y=Math.floor(cell/width);if(x<width-1&&(v>.5)!=(pixels[i+4]>.5))interfaces+=19.2/height;if(y<height-1&&(v>.5)!=(pixels[i+width*4]>.5))interfaces+=15.4/width;}const count=width*height;return{mean:sum/count,variance:squares/count-(sum/count)**2,white:white/count,black:black/count,paint:paint/count,colored:colored/count,interfaceDensity:interfaces/(15.4*19.2)}},setLights`);
    if(file===resolve('world3d.js'))data=data.toString().replace('import {createAmtPortraitMelt}','import {createAmtPortraitMelt,portraitPaintGlsl}').replace('amtCamera.rotation.set(view.pitch||0,-view.yaw,0,"YXZ")','amtCamera.rotation.set(window.__floorPitch??view.pitch??0,-view.yaw,0,"YXZ")')
      .replace('  app.classList.add("three-ready");',`window.__floorGpu={sampleRunoffSource:${sampleRunoffSource.toString()},samplePaintSurface:${samplePaintSurface.toString()},sampleContinuousRunoff:${sampleContinuousRunoff.toString()},samplePortraitPaint:${samplePortraitPaint.toString()},sampleFaceDroop:${sampleFaceDroop.toString()},floorColor:${sampleFloorColor.toString()},region:()=>amtFloorEffect.samplePigmentRegion(),stats:()=>amtFloorEffect.stats(),advance(seconds){const start=BuergeramtLevel.floorState.time;for(let n=1;n<=Math.round(seconds*20);n++){__floorTest.at(start+n/20);amtFloorEffect.update(BuergeramtLevel.floorState,amtReducedMotion.matches,BuergeramtLevel.view,BuergeramtLevel.characters);amtPortraitMelt.update(BuergeramtLevel.floorState,amtReducedMotion.matches);amtLampWear.update(BuergeramtLevel.floorState,amtReducedMotion.matches)}},fade(strength){fadeAmtStructure(strength)},render(){renderer.render(amtScene,amtCamera)},backend(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}};app.classList.add("three-ready");`);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={complete:false,revision:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(sources.get(resolve(file))).digest('hex')])),cases:[],
  limits:['Forced camera/accelerated pigment state, not natural mission-chain evidence','Desktop Chromium and Android emulation; no physical Android','Media, Web Audio and speech muted; no listening review']};
const portraitMode=process.env.PORTRAIT_LIQUID||process.env.PORTRAIT_OIL||process.env.PORTRAIT_DROOP||process.env.FLOOR_PAINT_MIX;
const cases=[['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['procedural-fallback',1280,800],...(process.env.FLOOR_RECOVERY||portraitMode?[['reduced-motion',1280,800]]:[]),...(portraitMode?[['missing-portrait',1280,800]]:[])];
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
    if(portraitMode){
      if(name==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
      const faceDroop=name==='missing-portrait'?null:await page.evaluate(()=>__floorGpu.sampleFaceDroop());
      if(faceDroop){
        writeFileSync(resolve(out,`${name}-face-droop.json`),JSON.stringify(faceDroop,null,2));
        for(const [feature,mark]of Object.entries(faceDroop)){
          assert(mark.before.count>30&&mark.after.count>30,`${feature} remains visible during early softening`);
          assert(mark.drop>(feature==='mouth'||feature==='chin'?.07:.04),`${feature} visibly droops before dissolving (drop ${mark.drop})`);
        }
        assert(faceDroop.leftEye.drop-faceDroop.rightEye.drop>.025,'eyes sag unevenly');
        assert(faceDroop.mouth.drop>faceDroop.leftEye.drop&&faceDroop.chin.drop>faceDroop.mouth.drop,'lower face stretches progressively farther');
      }
      const paintSurface=name==='missing-portrait'?null:await page.evaluate(()=>__floorGpu.samplePaintSurface());
      if(paintSurface){writeFileSync(resolve(out,`${name}-paint-probe.json`),JSON.stringify(paintSurface,null,2));assert(paintSurface.covered>1000,'paint probe has substantial opaque paint');assert(paintSurface.maximum<=20&&paintSurface.changedFraction<.001,'neutral paint has no added white wavy highlights');}
      const intact=await page.evaluate(()=>__floorGpu.samplePortraitPaint('frame',0,0));
      await page.evaluate(()=>{__floorTest.at(570);__floorRender()});
      const continuous=await page.evaluate(()=>__floorGpu.samplePortraitPaint('frame',1,BuergeramtLevel.floorState.visualTime));
      if(name==='missing-portrait')assert.deepEqual(continuous,intact,'missing art must retain its labeled fallback');
      else{assert(Math.max(...intact.range)>40,'actual paint is present before melting');assert(Math.max(...continuous.range)>40&&continuous.bands.every(coverage=>coverage>.98),'the entire framed image remains populated at full melt');}
      const runoffSource=name==='missing-portrait'?null:await page.evaluate(()=>__floorGpu.sampleRunoffSource());
      if(runoffSource){writeFileSync(resolve(out,`${name}-runoff-source.json`),JSON.stringify(runoffSource,null,2));for(const sample of runoffSource){assert(sample.lower>50,'paint pearls carry real lower-image pigment');assert.equal(sample.upper,0,'facial-source paint does not repeat as eyes below the frame');}}
      const runoff=name==='missing-portrait'?null:await page.evaluate(()=>({early:__floorGpu.sampleContinuousRunoff(.16),late:__floorGpu.sampleContinuousRunoff()}));
      if(runoff){
        writeFileSync(resolve(out,`${name}-runoff.json`),JSON.stringify(runoff,null,2));
        await page.evaluate(()=>{const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+1.2,p.z-2.5,Math.atan2(-1.2,-2.5));window.__floorPitch=-.13;__floorRender()});
        await page.screenshot({path:resolve(out,`${name}-rivulets-probe.png`)});
        assert(runoff.early.meanDrops>4,'many separate paint pearls precede the streams');
        assert(runoff.early.medianSpeed<45&&runoff.early.downwardSteps>60,'pearls visibly descend at a slow pace');
        assert(runoff.late.meanStreams>=3&&runoff.late.meanStreams>runoff.early.meanStreams+2,'beads increasingly join into long lower-edge rivulets');
        assert(runoff.late.detachedFrames>50,'free rounded beads remain beside the mature rivulets');
        assert(runoff.late.groundFrames>60,'fresh streams continually reach the floor');
      }
      await page.evaluate(()=>{__floorTest.at(BuergeramtGoop.ageForMelt(.25));__floorRender()});
      const film=name==='missing-portrait'?null:await page.evaluate(()=>__floorGpu.samplePortraitPaint('film',.25,BuergeramtLevel.floorState.visualTime));
      const softened=name==='missing-portrait'?null:await page.evaluate(()=>__floorGpu.samplePortraitPaint('frame',.25,BuergeramtLevel.floorState.visualTime));
      if(softened){
        assert(softened.bands.every(coverage=>coverage>.98),'the image stays full while its features distort');
      }
      if(film)assert(film.bands.some(coverage=>coverage>.01)&&film.bands.every(coverage=>coverage<.7),'separate paint pearls leave open wall between them');
      await page.evaluate(()=>{__floorTest.at(0);__floorRender()});
      const captures=[];
      for(const age of [0,90,105,120,150,180,210,240,270,300,370,420,570,900]){
        await page.evaluate(age=>{__floorGpu.advance(age-BuergeramtLevel.floorState.time);const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+1.2,p.z-2.5,Math.atan2(-1.2,-2.5));window.__floorPitch=-.13;__floorRender()},age);
        const state=await page.evaluate(()=>({floor:Germany3D.amtFloor,portrait:Germany3D.amtPortraitMelt,pigment:__floorGpu.stats(),region:__floorGpu.region()}));
        assert.equal(state.portrait.paintMelt,name==='missing-portrait'?0:Math.min(1,state.floor.melt*2.2));
        if(age===150&&state.pigment&&name!=='missing-portrait'){assert(state.pigment.paint>.000001,'runoff deposits paint soon after onset');assert(state.pigment.colored>.000001);}
        if(name==='missing-portrait'&&state.pigment){assert.equal(state.pigment.paint,0);assert.equal(state.pigment.colored,0);}
        if(age===900&&name!=='missing-portrait'){
          state.continuous=await page.evaluate(()=>__floorGpu.samplePortraitPaint('frame',1,BuergeramtLevel.floorState.visualTime));
          assert(Math.max(...state.continuous.range)>40&&state.continuous.bands.every(coverage=>coverage>.98),'the painting remains filled fifteen minutes into the visit');
        }
        await page.screenshot({path:resolve(out,`${name}-liquid-${age}s.png`)});captures.push({age,...state});
        if([120,150,180,240,570,900].includes(age)){
          await page.evaluate(()=>{const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+1.2,p.z-4,Math.atan2(-1.2,-4));window.__floorPitch=0;__floorRender()});
          await page.screenshot({path:resolve(out,`${name}-paint-flow-${age}s.png`)});
        }
        if(process.env.FLOOR_PAINT_MIX&&[150,180,240,370,570].includes(age)){
          state.floorColor=await page.evaluate(()=>__floorGpu.floorColor());
          await page.evaluate(()=>{const p=BuergeramtStory.presidentPortrait;__floorTest.pose(p.x+1.6,p.z-2.6,Math.atan2(-1.6,-2.6));window.__floorPitch=-.62;__floorRender()});
          await page.screenshot({path:resolve(out,`${name}-floor-paint-${age}s.png`)});
          writeFileSync(resolve(out,`${name}-mix-${age}s.json`),JSON.stringify(state,null,2));
          if(state.region&&name!=='missing-portrait'&&age===240){
            assert(state.region.farColoredArea>.10,'portrait colors spread visibly beyond the wall contact strip');
            assert(state.region.bins.slice(1).some(bin=>bin.mixedArea>.05),'transport mixes portrait pigment with the floor oils');
          }
          if(name!=='missing-portrait'&&[240,570].includes(age))assert(state.floorColor.farColoredArea>.10,'the production floor visibly retains source color after transport');
          if(name==='missing-portrait')assert.equal(state.floorColor.coloredArea,0,'lights and floor reflections do not count as portrait pigment');
          if(age===570&&state.floorColor.center){
            await page.evaluate(center=>{__floorTest.pose(center.x,center.z-1.6,Math.PI);window.__floorPitch=-1.;__floorRender()},state.floorColor.center);
            await page.screenshot({path:resolve(out,`${name}-floor-color-follow-${age}s.png`)});
          }
        }
      }
      assert.deepEqual(errors,[]);report.cases.push({name,verdict:'PASS',faceDroop,paintSurface,runoff,intact,continuous,softened,film,captures,errors});console.log(name,'oil PASS');await context.close();continue;
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
