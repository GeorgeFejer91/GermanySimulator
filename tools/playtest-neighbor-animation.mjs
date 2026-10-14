import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const gesturesOnly=process.env.NEIGHBOR_ANIMATION_GESTURES_ONLY==='1';
const root=resolve('.'),out=resolve('output/neighbors/'+(gesturesOnly?'animation-browser-final-gestures':'animation-browser'));mkdirSync(out,{recursive:true});
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body style="margin:0;background:#d6d9d3"><script type="module">
import * as T from '/assets/vendor/three/0.186.0/build/three.module.min.js';
import {createNeighborSprite} from '/neighbor-sprites.js';
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xd6d9d3);const aspect=innerWidth/innerHeight,halfHeight=Math.max(2,3.5/aspect),camera=new T.OrthographicCamera(-halfHeight*aspect,halfHeight*aspect,halfHeight,-halfHeight,.1,100);camera.position.set(0,1,12);camera.lookAt(0,1,0);
const roles=['parent','watcher','swabian','child'],distances=[16.941176470588236,16.941176470588236,7.529411764705882,11.52],pending=[];
const actors=roles.map((role,i)=>{const actor={id:'test-'+role,jwdRole:role,x:0,y:0,jwdWorking:false},host=new T.Group();host.position.set((i-1.5)*1.35,0,0);scene.add(host);const fallback=new T.Mesh(new T.BoxGeometry(.3,.8,.15),new T.MeshBasicMaterial({color:0xaa4422}));fallback.position.y=.4;host.add(fallback);const paint=createNeighborSprite(T,actor,host,(_position,_priority,load)=>pending.push(load()),camera);return{actor,host,paint,origin:host.position.x}});
let now=0;const hud={started:true,busy:false,paused:false};
window.step=({kind='idle',phase=0,dt=1/60,paused=false,mouth=.8}={})=>{now+=dt;hud.paused=paused;for(const [i,{actor,host,paint,origin}] of actors.entries()){
actor.jwdGesture=null;actor.jwdWorking=kind==='work'||kind==='work-left';actor.jwdMoving=0;actor.facing=kind==='work-left'?-Math.PI/2:Math.PI/2;let dialogue=null;
if(kind==='walk'){actor.x+=distances[i]/32;actor.jwdMoving=distances[i]/32;host.position.x=origin+actor.x*.02;}
else if(kind==='up'){actor.y-=distances[i]/32;actor.jwdMoving=distances[i]/32;}
else if(kind==='down'){actor.y+=distances[i]/32;actor.jwdMoving=distances[i]/32;}
else if(kind==='left'){actor.x-=distances[i]/32;actor.jwdMoving=distances[i]/32;host.position.x=origin+actor.x*.02;}
else if(kind==='point'||kind==='call'){actor.jwdGesture=kind;actor.jwdGestureAge=phase*1.4;actor.jwdGestureDuration=1.4;dialogue={id:actor.id,active:true,speaking:true,cueToken:kind,mediaTime:.5,mouthOpen:mouth};}
paint.sync(now,hud,dialogue,false);
}renderer.render(scene,camera);return actors.map(({paint})=>paint.inspect())};
window.finish=()=>{for(const {paint} of actors)paint.dispose();renderer.render(scene,camera);return{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}};
await Promise.all(pending);step();window.ready=true;
</script></body></html>`;
const mime={'.js':'text/javascript','.webp':'image/webp'};
const server=createServer((req,res)=>{try{if(req.url==='/fixture'){res.setHeader('Content-Type','text/html');res.end(fixture);return}const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+sep))throw Error('path');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={cases:[],limits:['Isolated production sprite renderer fixture; route/gameplay acceptance belongs to the neighborhood playtest.','Muted Chromium and Android emulation; physical device and perceptual audio NOT RUN.']};let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,viewport,dpr] of [['desktop',{width:1200,height:650},1],['mobile',{width:390,height:844},1],['mobile-hidpi',{width:390,height:844},3]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:name!=='desktop',hasTouch:name!=='desktop',recordVideo:{dir:resolve(out,'video'),size:viewport}});
  const page=await context.newPage(),errors=[],states=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(r.url().includes('/neighbors/'))requests.push(r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/fixture');await page.waitForFunction(()=>window.ready);const viewportInfo=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));assert.equal(viewportInfo.width,viewport.width);assert.equal(viewportInfo.dpr,dpr);assert.equal(requests.length,4);assert.ok(requests.every(url=>url.includes('-mobile.webp')===(name==='mobile')),'requested atlas variant must match the physical-pixel policy');
  for(const kind of gesturesOnly?[]:['walk','up','down','left']){
   const seen=Array.from({length:4},()=>new Set());
   for(let i=0;i<65;i++){const state=await page.evaluate(args=>step(args),{kind});states.push({kind,i,state});state.forEach((s,j)=>seen[j].add(s.frame));if([0,15,30,31,32,63,64].includes(i))await page.screenshot({path:resolve(out,name+'-'+kind+'-'+i+'.png')});await page.waitForTimeout(16)}
   assert.ok(seen.every(set=>set.size===32),'every walk sample must actually render');
  }
  for(const kind of ['point','call'])for(let i=0;i<24;i++){const state=await page.evaluate(args=>step(args),{kind,phase:i/23,dt:1.4/23});states.push({kind,i,state});if([0,5,11,17,22,23].includes(i))await page.screenshot({path:resolve(out,name+'-'+kind+'-'+i+'.png')});await page.waitForTimeout(60)}
  for(let i=0;i<48;i++){const state=await page.evaluate(args=>step(args),{kind:'work',dt:1/16});states.push({kind:'work',i,state});if([0,11,22,23,24,47].includes(i))await page.screenshot({path:resolve(out,name+'-work-'+i+'.png')});await page.waitForTimeout(60)}
  const mirrored=await page.evaluate(()=>step({kind:'work-left',dt:1/16}));assert.deepEqual(mirrored.map(s=>s.mirrored),[true,true,true,false]);states.push({kind:'work-left',state:mirrored});await page.screenshot({path:resolve(out,name+'-work-left.png')});
  const before=await page.evaluate(()=>step({kind:'point',phase:.5}));const paused=await page.evaluate(()=>step({kind:'point',phase:.9,paused:true}));assert.deepEqual(paused,before);
  const disposed=await page.evaluate(()=>finish());assert.equal(disposed.textures,0,'paint textures release on retirement');assert.deepEqual(errors,[]);
  report.cases.push({name,viewportInfo,requests,states,disposed,errors});await context.close();console.log(name+': PASS');
 }
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done))}
