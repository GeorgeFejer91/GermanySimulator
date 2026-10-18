import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname,basename,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.STREET_RENDER_OUTPUT||'output/street-cast/renderer');
const streetDirectory=resolve(process.env.STREET_CANDIDATE_DIR||'assets/characters/street');
for(const path of [out,streetDirectory])if(!path.startsWith(root+sep))throw Error('Fixture paths must remain inside the repository');
const manifestFile=resolve(streetDirectory,'candidate-manifest.json');mkdirSync(out,{recursive:true});
const rigMode=!!JSON.parse(readFileSync(manifestFile,'utf8')).characters['quiz-hartmut-keller']?.motionRig;
const audioFile='assets/voices/profile-auditions/quiz-hartmut-keller-approach-review.mp3';
const pcm=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',audioFile,'-f','f32le','-ac','1','-ar','24000','pipe:1'],{windowsHide:true,maxBuffer:8_000_000});
if(pcm.status!==0)throw Error(String(pcm.stderr));
const samples=new Float32Array(pcm.stdout.buffer.slice(pcm.stdout.byteOffset,pcm.stdout.byteOffset+pcm.stdout.byteLength)),energy=[];
for(let i=0;i<samples.length;i+=600){let sum=0;for(let j=i;j<Math.min(samples.length,i+600);j++)sum+=samples[j]**2;energy.push(Math.sqrt(sum/Math.min(600,samples.length-i)))}
const peak=[...energy].sort((a,b)=>a-b)[Math.floor(energy.length*.95)]||1;
const mediaCue={file:'/'+audioFile,sha256:createHash('sha256').update(readFileSync(audioFile)).digest('hex'),hz:40,values:energy.map(v=>Math.min(1,(v/peak)**.7))};
const fixture=`<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0"><script type="module">
import * as T from '/assets/vendor/three/0.186.0/build/three.module.min.js';
import {registerStreetCharacterManifest,createStreetCharacterSprite,createStreetCharacterCanvasSprite,advanceStreetAnimation,requestStreetReaction,cancelStreetReaction} from '/street-character-sprites.js';
import {createNeighborSprite} from '/neighbor-sprites.js';
const manifest=await(await fetch('/assets/characters/street/candidate-manifest.json')).json();registerStreetCharacterManifest(manifest);
const person=manifest.characters['quiz-hartmut-keller'];window.streetStride=person.strideDistance||17;const pending=[],queue=(_position,_priority,job)=>{pending.push(job());return {state:'fixture-admitted'}};
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xe8e4d8);
const rigMode=${rigMode},half=Math.max(1.35,3.4/(innerWidth/innerHeight)),camera=rigMode?new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,100):new T.OrthographicCamera(-half*innerWidth/innerHeight,half*innerWidth/innerHeight,half,-half,.1,100);camera.position.set(...(rigMode?[0,11.5,14]:[0,3.5,9]));camera.lookAt(...(rigMode?[0,1,-2.7]:[0,.9,0]));
const floor=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshBasicMaterial({color:0xd0cec0}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const blocker=new T.Mesh(new T.BoxGeometry(.7,1.9,.1),new T.MeshBasicMaterial({color:0x55605a}));blocker.position.set(-1.5,.95,.5);blocker.visible=false;scene.add(blocker);
const actors=[-1.5,0].map((x,i)=>{const actor={id:'fixture-hartmut-'+i,voiceId:'quiz-hartmut-keller',x:0,y:0},host=new T.Group();host.position.x=x;scene.add(host);const fallback=new T.Mesh(new T.BoxGeometry(.3,.8,.1),new T.MeshBasicMaterial({color:0xad4422}));fallback.position.y=.4;host.add(fallback);const paint=createStreetCharacterSprite(T,actor,host,queue,camera);return {actor,host,paint,fallback,origin:x}});
const neighbor={id:'fixture-heiko',jwdRole:'parent',x:0,y:0,jwdWorking:false,jwdMoving:0},neighborHost=new T.Group();neighborHost.position.x=1.6;scene.add(neighborHost);const neighborPaint=createNeighborSprite(T,neighbor,neighborHost,queue,camera);
let nativeAudio=null;
window.floorProbe=()=>{
 const selected=actors[0],packet=selected.paint.inspect().rigPacket;if(!packet)throw Error('Pavement probe requires admitted physical rig');
 const visibility=actors.map(({host})=>host.visible),neighborVisible=neighborHost.visible,oldFloor={visible:floor.visible,colorWrite:floor.material.colorWrite,renderOrder:floor.renderOrder};
 try{
  actors.forEach(({host},i)=>host.visible=i===0);neighborHost.visible=false;floor.material.colorWrite=false;floor.renderOrder=-100;
  const dimensions=new T.Vector2();renderer.getDrawingBufferSize(dimensions);let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  const point=new T.Vector3();for(let i=0;i<packet.vertexCount;i++){point.fromArray(packet.positionsWorld,i*3).project(camera);const x=(point.x+1)*dimensions.x/2,y=(1-point.y)*dimensions.y/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
  const x=Math.max(0,Math.floor(left)-2),y=Math.max(0,Math.floor(top)-2),width=Math.min(dimensions.x,Math.ceil(right)+2)-x,height=Math.min(dimensions.y,Math.ceil(bottom)+2)-y;
  if(width<=0||height<=0||width>512||height>512)throw Error('Pavement readback crop outside bounded probe');
  const gl=renderer.getContext(),before=new Uint8Array(width*height*4),after=new Uint8Array(before.length);
  floor.visible=false;renderer.render(scene,camera);gl.readPixels(x,dimensions.y-y-height,width,height,gl.RGBA,gl.UNSIGNED_BYTE,before);
  floor.visible=true;renderer.render(scene,camera);gl.readPixels(x,dimensions.y-y-height,width,height,gl.RGBA,gl.UNSIGNED_BYTE,after);
  let changedPixels=0,maximumChannelDifference=0;for(let i=0;i<before.length;i+=4){let difference=0;for(let c=0;c<4;c++)difference=Math.max(difference,Math.abs(before[i+c]-after[i+c]));maximumChannelDifference=Math.max(maximumChannelDifference,difference);if(difference>1)changedPixels++}
  return {pose:selected.paint.inspect().pose,crop:{x,y,width,height},changedPixels,maximumChannelDifference,method:'Actual unchanged floor writes depth only; same textured rig, camera and background rendered with floor off/on. No source paint replacement.'};
 }finally{actors.forEach(({host},i)=>host.visible=visibility[i]);neighborHost.visible=neighborVisible;Object.assign(floor, {visible:oldFloor.visible,renderOrder:oldFloor.renderOrder});floor.material.colorWrite=oldFloor.colorWrite;renderer.render(scene,camera)}
};
window.canvasProbe=async()=>{
 const canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;const ctx=canvas.getContext('2d'),paint=createStreetCharacterCanvasSprite(actors[0].actor,queue);
 try{
  await pending.at(-1);const start=pending.length;paint.prepareMotion();await Promise.all(pending.slice(start));
  const matrix=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),c=camera.matrixWorld.elements,h=actors[0].host.matrixWorld.elements;
  const frame={rootWorld:[h[12],h[13],h[14]],forwardWorld:[0,0,1],camera:{position:[c[12],c[13],c[14]],right:[c[0],c[1],c[2]],up:[c[4],c[5],c[6]],forward:[-c[8],-c[9],-c[10]]}};
  ctx.fillStyle='#e8e4d8';ctx.fillRect(0,0,canvas.width,canvas.height);const drawn=paint.drawRig(ctx,{frame,viewProjection:matrix.elements,viewport:{x:0,y:0,width:canvas.width,height:canvas.height}});
  const three=actors[0].paint.inspect().rigPacket,other=paint.inspect().rigPacket;if(!drawn||!three||!other)throw Error('Canvas rig did not render');
  if(three.vertexCount!==other.vertexCount||three.triangleCount!==other.triangleCount)throw Error('Canvas/Three canonical topology differs');
  let maxWorldDifference=0;for(let i=0;i<three.vertexCount*3;i++)maxWorldDifference=Math.max(maxWorldDifference,Math.abs(three.positionsWorld[i]-other.positionsWorld[i]));
  return {drawn,vertexCount:other.vertexCount,triangleCount:other.triangleCount,maxWorldDifference,png:canvas.toDataURL('image/png'),limits:'Real Canvas affine image drawing; world geometry equality does not imply pixel-identical perspective UV interiors.'};
 }finally{paint.dispose()}
};
window.step=({dt=1/60,distance=0,dx=0,dy=0,paused=false,reducedMotion=false,speaking=false,cueToken=null,mediaTime=0,mediaDuration=0,mouthOpen=0}={})=>{const poses=actors.map(({actor,host,paint,origin})=>{actor.x+=dx;actor.y+=dy;host.position.set(origin+actor.x*.02,0,actor.y*.02);const pose=advanceStreetAnimation(actor,distance,dt,{dx,dy,paused,reducedMotion,speaking,cueToken,mediaTime,mediaDuration,mouthOpen});paint.sync();return pose});neighborPaint.sync(0,{started:true,busy:false,paused:false},null,reducedMotion);renderer.render(scene,camera);return poses};
window.react=name=>{for(const {actor} of actors){cancelStreetReaction(actor);requestStreetReaction(actor,name,{token:name})}return step({dt:0})};
window.prepareMotion=async()=>{const start=pending.length;for(const {paint} of actors)paint.prepareMotion();await Promise.all(pending.slice(start));step({dt:0});return inspect()};
window.cover=value=>{blocker.visible=value;renderer.render(scene,camera)};
window.startMedia=async()=>{for(const {actor} of actors)cancelStreetReaction(actor);step({dt:0});const cue=${JSON.stringify(mediaCue)};nativeAudio=new Audio(cue.file);nativeAudio.muted=true;nativeAudio.volume=0;window.mediaTrace=[];window.mediaEnded=false;window.mediaDone=new Promise(done=>nativeAudio.addEventListener('ended',()=>{window.mediaEnded=true;step({speaking:false,cueToken:'native-take'});done()},{once:true}));
const tick=()=>{if(!nativeAudio)return;const poses=step({dt:0,speaking:!nativeAudio.ended,cueToken:'native-take',mediaTime:nativeAudio.currentTime,mediaDuration:nativeAudio.duration,mouthOpen:cue.values[Math.floor(nativeAudio.currentTime*cue.hz)]||0});mediaTrace.push({time:nativeAudio.currentTime,ended:nativeAudio.ended,paused:nativeAudio.paused,poses});if(!nativeAudio.ended)requestAnimationFrame(tick)};await nativeAudio.play();requestAnimationFrame(tick)};
window.mediaState=()=>({time:nativeAudio.currentTime,paused:nativeAudio.paused,ended:nativeAudio.ended});
window.pauseMedia=()=>{nativeAudio.pause();return mediaState()};window.resumeMedia=()=>nativeAudio.play();
window.inspect=()=>({actors:actors.map(({paint,fallback})=>({...paint.inspect(),fallbackVisible:fallback.visible})),neighbor:neighborPaint.inspect(),memory:{...renderer.info.memory},calls:renderer.info.render.calls,variant:innerWidth<=600?'mobile':'desktop'});
window.finish=()=>{nativeAudio?.pause();nativeAudio=null;for(const {paint} of actors)paint.dispose();neighborPaint.dispose();floor.geometry.dispose();floor.material.dispose();blocker.geometry.dispose();blocker.material.dispose();scene.remove(floor,blocker);renderer.render(scene,camera);return {...renderer.info.memory}};
await Promise.all(pending);step({dt:0});window.ready=true;
</script></body></html>`;
const mime={'.js':'text/javascript','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/fixture'){res.setHeader('Content-Type','text/html');res.end(fixture);return}const pathname=decodeURIComponent(url.pathname);const path=pathname.startsWith('/assets/characters/street/')?resolve(streetDirectory,basename(pathname)):resolve(root,'.'+pathname);if(!path.startsWith(root+sep))throw Error('path');res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={sourceHashes:Object.fromEntries(['street-character-sprites.js',...(rigMode?['street-character-rig.js']:[]),relative(root,manifestFile)].map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')])),streetAssetDirectory:relative(root,streetDirectory),rigMode,camera:rigMode?'Actual city Perspective48, [0,11.5,14] ->[0,1,-2.7]':'Historical low-angle orthographic prototype',media:{file:audioFile,sha256:mediaCue.sha256,alignment:'40 Hz final-encoded RMS amplitude, not phoneme alignment; existing candidate take used for silent lifecycle fixture only'},cases:[],limits:['Forced isolated production sprite adapter fixture; no natural quiz approach/gameplay claim.','Desktop and Android emulation, not a physical Android device.','All media muted before navigation; native completion observed silently, no perceptual listening.','Candidate atlas remains unapproved until visual/physics/camera acceptance and integrated source gates.']};
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader']});
 for(const [name,viewport,dpr] of [['desktop',{width:1200,height:650},1],['android-emulated',{width:390,height:844},2]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:name!=='desktop',hasTouch:name!=='desktop',recordVideo:{dir:resolve(out,'video'),size:viewport}});
  await context.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)}});
  const page=await context.newPage(),errors=[],requests=[],states=[],floorProbes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/characters/street/'))requests.push(r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/fixture');await page.waitForFunction(()=>window.ready);
  const initial=await page.evaluate(()=>inspect());assert(initial.actors.every(a=>a.loaded&&!a.failed));assert(initial.actors.every(a=>a.stage==='standing'),'initial source is individual standing paint');assert.equal(requests.filter(url=>new URL(url).pathname.endsWith('.webp')).length,1,'same identity shares one standing texture request');await page.screenshot({path:resolve(out,name+'-standing-ready.png')});const motion=await page.evaluate(()=>prepareMotion());assert(motion.actors.every(a=>a.motionLoaded&&a.stage===(rigMode?'rig':'motion')));assert.equal(requests.filter(url=>new URL(url).pathname.endsWith('.webp')).length,2,'one standing plus one selected shared motion texture');
  const headings=[['right',1,0],['down',0,1],['left',-1,0],['up',0,-1],...(rigMode?[['down-right',Math.SQRT1_2,Math.SQRT1_2],['up-left',-Math.SQRT1_2,-Math.SQRT1_2],['up-right',Math.SQRT1_2,-Math.SQRT1_2],['down-left',-Math.SQRT1_2,Math.SQRT1_2]]:[])];
  for(const [kind,dx,dy] of headings){
   const seen=new Set();for(let i=0;i<32;i++){const poses=await page.evaluate(({dx,dy,rigMode})=>{const distance=window.streetStride/16;return step({distance,dx:dx*distance,dy:dy*distance,dt:distance/(rigMode?88:52)})},{dx,dy,rigMode});poses.forEach(p=>seen.add(p.frame));states.push({kind,i,poses});if([0,7,15,31].includes(i))await page.screenshot({path:resolve(out,name+'-'+kind+'-'+i+'.png')});if(rigMode&&[3,7,11,15].includes(i)){const probe=await page.evaluate(()=>floorProbe());floorProbes.push({kind,i,...probe});assert.equal(probe.changedPixels,0,'physical painted shoes must not disappear behind the actual camera floor')}await page.waitForTimeout(25)}assert.equal(seen.size,16);
  }
  let canvasResult=null;
  if(rigMode){
   const distance=await page.evaluate(()=>window.streetStride*9/16);await page.evaluate(distance=>step({distance,dy:-distance,dt:distance/88}),distance);
   for(const dt of [.03,.03,.06]){const poses=await page.evaluate(dt=>step({dt}),dt);states.push({kind:'phase-specific-stop',dt,poses});const probe=await page.evaluate(()=>floorProbe());floorProbes.push({kind:'phase-specific-stop',...probe});assert.equal(probe.changedPixels,0)}
   await page.screenshot({path:resolve(out,name+'-held-production-floor.png')});canvasResult=await page.evaluate(()=>canvasProbe());assert.equal(canvasResult.maxWorldDifference,0);writeFileSync(resolve(out,name+'-canvas-held.png'),Buffer.from(canvasResult.png.split(',')[1],'base64'));delete canvasResult.png;
  }
  for(const kind of ['greet','wait','work','review','success','failure','look']){
   await page.evaluate(kind=>react(kind),kind);for(let i=0;i<26;i++){const poses=await page.evaluate(()=>step({dt:.06}));states.push({kind,i,poses});if([0,6,12,18,25].includes(i))await page.screenshot({path:resolve(out,name+'-'+kind+'-'+i+'.png')});await page.waitForTimeout(40)}
  }
  await page.evaluate(()=>react('work'));const before=await page.evaluate(()=>step({dt:.25}));const paused=await page.evaluate(()=>step({dt:10,paused:true}));assert.deepEqual(paused,before);
  await page.evaluate(()=>react('idle'));await page.evaluate(()=>startMedia());await page.waitForTimeout(700);const pauseAt=await page.evaluate(()=>pauseMedia());assert(pauseAt.paused);await page.waitForTimeout(200);const pauseAfter=await page.evaluate(()=>mediaState());assert(pauseAfter.paused);assert(Math.abs(pauseAfter.time-pauseAt.time)<.05);await page.screenshot({path:resolve(out,name+'-native-media-paused.png')});await page.evaluate(()=>resumeMedia());await page.evaluate(()=>mediaDone);const mediaTrace=await page.evaluate(()=>mediaTrace);assert(await page.evaluate(()=>mediaEnded));if(rigMode)assert(mediaTrace.every(row=>row.poses.every(p=>p.mouthOpen===0)),'unregistered rig mouths must stay honestly closed');else assert(mediaTrace.some(row=>row.poses.some(p=>p.clip==='talk'&&p.frame>0)),'native media must drive registered visible articulation');
  await page.screenshot({path:resolve(out,name+'-native-media-ended.png')});await page.evaluate(()=>cover(true));await page.screenshot({path:resolve(out,name+'-opaque-blocker.png')});await page.evaluate(()=>cover(false));
  const final=await page.evaluate(()=>inspect()),disposed=await page.evaluate(()=>finish());assert.equal(disposed.textures,0);assert.deepEqual(errors,[]);report.cases.push({name,viewport,dpr,initial,final,disposed,requests,states,floorProbes,canvasResult,mediaPause:{before:pauseAt,after:pauseAfter},mediaTrace,errors});await context.close();console.log(name+': PASS');
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done))}
