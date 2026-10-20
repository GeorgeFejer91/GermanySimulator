// Isolated silent production-renderer fixture. Held media cues test articulation;
// natural recorded-clock and tour coverage are collected by the game playtests.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
import {installedPlaywright,chromiumExecutable} from './browser-harness.mjs';
import {silenceBrowserAudio} from './browser-diagnostics.mjs';
const {chromium}=installedPlaywright(),root=resolve('.'),out=resolve('output/neighbors-checklist/rendered');mkdirSync(out,{recursive:true});
const fixture=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><body style="margin:0"><script type="module">
import * as T from '/assets/vendor/three/0.186.0/build/three.module.min.js';
import {createNeighborSprite} from '/neighbor-sprites.js';
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xd6d9d3);const aspect=innerWidth/innerHeight,h=Math.max(1.8,3.2/aspect),camera=new T.OrthographicCamera(-h*aspect,h*aspect,h,-h,.1,100);camera.position.set(0,1,12);camera.lookAt(0,1,0);
const roles=['parent','watcher','swabian','child'],pending=[],distances=[16.941176470588236,16.941176470588236,7.529411764705882,11.52];
const actors=roles.map((role,i)=>{const actor={id:role,jwdRole:role,x:0,y:0},host=new T.Group();host.position.x=(i-1.5)*1.45;scene.add(host);const paint=createNeighborSprite(T,actor,host,(_p,_priority,load)=>pending.push(load()),camera);return{actor,host,paint}});
let now=0;
window.step=({kind='talk',phase=.5,mouth=1,paused=false,reduced=false}={})=>{
now+=.05;for(const [i,{actor,paint}] of actors.entries()){
 actor.jwdGesture=null;actor.jwdMoving=0;actor.jwdWorking=false;actor.facing=Math.PI/2;
 const d={id:actor.id,active:true,speaking:mouth!==null,cueToken:'owned',mediaTime:kind==='notebook'?Math.max(.1,phase*10):.5,mediaDuration:10,mouthOpen:mouth??0,line:'Hallo, willkommen in der Nachbarschaft!'};
 if(['down','right','left','up'].includes(kind)){const distance=distances[i]/32;actor[kind==='down'||kind==='up'?'y':'x']+=kind==='up'||kind==='left'?-distance:distance;actor.jwdMoving=distance;}
 else if(['point','call','wash','sweep','inspect','notebook'].includes(kind)){
  actor.jwdGesture=kind==='notebook'&&i!==0?['','point','sweep','present'][i]:kind;
  actor.jwdGestureAge=phase*(kind==='notebook'?10:1.4);actor.jwdGestureDuration=kind==='notebook'?10:1.4;
 }
 paint.sync(now,{started:true,paused,busy:false},d,reduced);
}renderer.render(scene,camera);return actors.map(({paint})=>paint.inspect());};
window.faces=()=>{const copy=document.createElement('canvas');copy.width=renderer.domElement.width;copy.height=renderer.domElement.height;const ctx=copy.getContext('2d');ctx.drawImage(renderer.domElement,0,0);return actors.map(({actor,host,paint})=>{const p=paint.inspect().mouthProfile||({parent:[57,79,72.8],watcher:[60,81,70.5],swabian:[60,83,54.9],child:[55,70,62]}[actor.jwdRole]);if(!p)return null;const mesh=host.children.find(n=>n.material?.map?.image?.width>=1024);mesh.updateWorldMatrix(true,false);const local=new T.Vector3(((p[0]+p[1])/2/128-.5)*mesh.geometry.parameters.width,(.5-p[2]/192)*mesh.geometry.parameters.height,0).applyMatrix4(mesh.matrixWorld).project(camera);const x=Math.round((local.x*.5+.5)*copy.width),y=Math.round((.5-local.y*.5)*copy.height);return Array.from(ctx.getImageData(x-12,y-6,24,12).data)});};
window.finish=()=>{for(const {paint} of actors)paint.dispose();renderer.render(scene,camera);return renderer.info.memory};
await Promise.all(pending);step();window.ready=true;
</script>`;
const mime={'.js':'text/javascript','.webp':'image/webp','.png':'image/png'};
const server=createServer((req,res)=>{try{if(req.url==='/fixture'){res.setHeader('Content-Type','text/html');res.end(fixture);return}const file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+sep))throw Error('path');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={cases:[],limits:['Controlled production sprites and held articulation cues; no natural tour or listening claim.','Android emulation; physical Android NOT RUN.']};let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:chromiumExecutable(chromium),args:['--mute-audio']});
 for(const [name,viewport,dpr,reduced] of [['desktop',{width:1200,height:700},1,false],['android-portrait',{width:390,height:844},1,false],['android-landscape',{width:844,height:390},2,false],['reduced',{width:1200,height:700},1,true]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:reduced?'reduce':'no-preference',recordVideo:{dir:resolve(out,'video'),size:viewport}});await context.addInitScript(silenceBrowserAudio);
  const page=await context.newPage(),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/fixture');await page.waitForFunction(()=>window.ready);assert.ok((await page.evaluate(()=>step())).every(p=>p.loaded));
  for(const kind of ['talk','down','right','left','point','call','wash','sweep','inspect','notebook']){
   const state=await page.evaluate(a=>step(a),{kind,phase:.5,mouth:0,reduced});const closed=await page.evaluate(()=>faces());
   // Hold displacement-derived cell and body phase for the pixel comparison.
   const open=await page.evaluate(a=>{const r=step(a);return{state:r,faces:faces()}},{kind,phase:.5,mouth:1,reduced});
   const changed=closed.map((pixels,i)=>pixels?.reduce((n,v,j)=>n+(v!==open.faces[i][j]),0)||0);
   // Side walks keep the identical head; their changing legs are outside crops.
   assert.ok(changed.every(n=>n>0),name+' '+kind+' all four visible mouths change '+changed);
   checks.push({kind,changed,state:open.state});
   await page.screenshot({path:resolve(out,name+'-'+kind+'-open.png')});
  }
  for(let i=0;i<101;i++){await page.evaluate(a=>step(a),{kind:'notebook',phase:i/100,mouth:.7,reduced});if([0,5,10,50,80,90,99,100].includes(i))await page.screenshot({path:resolve(out,name+'-notebook-'+i+'.png')});await page.waitForTimeout(20)}
  const before=await page.evaluate(()=>step({kind:'notebook',phase:.85}));assert.deepEqual(await page.evaluate(()=>step({kind:'notebook',phase:.99,paused:true})),before);
  const cancelled=await page.evaluate(()=>step({kind:'talk',mouth:null}));assert.ok(cancelled.every(p=>p.mouthOpen===0));
  const disposed=await page.evaluate(()=>finish());assert.equal(disposed.textures,0);assert.deepEqual(errors,[]);report.cases.push({name,checks,disposed,errors});await context.close();console.log(name+': PASS');
 }
 report.complete=true;
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done))}
