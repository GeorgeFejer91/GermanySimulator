// Real Three.js geometry checks plus diagnostic views of the canonical city.
// Run: node tools/playtest-object-consistency.mjs (PLAYWRIGHT_MODULE may override).
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/[\\/]$/,'');
const output=resolve(process.env.PLAYTEST_OUTPUT||'output/object-consistency');mkdirSync(output,{recursive:true});
const source=readFileSync(resolve(root,'world3d.js'),'utf8');
function production(name){const start=source.indexOf(`  function ${name}(`),end=source.indexOf('\n  }',start);if(start<0||end<start)throw Error(name);return source.slice(start,end+4)}
async function settleVisibility(page,id,obstructing){
 // Capture the actual completed state rather than assuming software-rendered
 // diagnostic frames meet a wall-clock screenshot delay. Fade timing has its
 // separate production-function checks below.
 await page.waitForFunction(({id,obstructing})=>{Germany3D.sync();Germany3D.prepareNearbyAssets();const state=Germany3D.buildingVisibility.find(b=>b.id===id);return Germany3D.nearbyAssetsReady&&state.obstructing===obstructing&&(obstructing?state.opacity<=.04:state.opacity>=.99)},{id,obstructing},{polling:200,timeout:30000});
}
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server=createServer((request,response)=>{try{const file=resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));if(!file.startsWith(root+sep))throw Error('path');const bytes=readFileSync(file);response.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});response.end(bytes)}catch{response.writeHead(404);response.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
const report={revision:Object.fromEntries(['world3d.js','game.js','3d.html'].map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')])),cases:[],limits:['Android emulation only; no physical device','City screenshots use diagnostic player placement with simulation paused at opening screen','Diagnostic animation-frame requests are limited to about 2 fps; no gameplay performance claim','External ChatDev stages were not executed']};
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:process.env.PLAYTEST_GPU==='hardware'?['--mute-audio']:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-emulated',{width:390,height:844}],['android-landscape-emulated',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
  context.setDefaultTimeout(120000);context.setDefaultNavigationTimeout(120000);
  console.log(JSON.stringify({stage:'start',view:name}));
  await context.addInitScript(()=>{
   // Bound software-renderer work in this paused diagnostic, without changing
   // production source or claiming natural gameplay/performance coverage.
   window.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),500);
   window.cancelAnimationFrame=id=>clearTimeout(id);
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:60000});
  await page.waitForFunction(()=>Germany3D.startupReady&&Germany3DBridge.startupAssetsReady,null,{timeout:60000});
  const fixture=await page.evaluate(async ({occlusion,fade,atlas,vehicleView,vehicleScale,url})=>{
   const T=await import(url),X=x=>x,Z=y=>y,S=.02;
   const bridge={player:{x:0,y:0},stationElevation:()=>0};
   const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.set(0,10,10);
   const buildingSightline=new T.Raycaster(),sightlineTarget=new T.Vector3(),sightlineDirection=new T.Vector3();
   const buildingObstructsPlayer=eval(`(${occlusion.trim()})`);
   const buildingSlots=[],checks=[];let previousOcclusionTime=0;
   const updateBuildingOcclusion=eval(`(${fade.trim()})`);
   function check(id,condition){checks.push({id,verdict:condition?'PASS':'FAIL'});if(!condition)throw Error(id)}
   function slot(x,y,z,w,h,d,opacity=1){const material=new T.MeshBasicMaterial({opacity,transparent:opacity<1});material.userData={baseOpacity:opacity,baseTransparent:opacity<1,baseDepthWrite:true};const group=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);group.updateMatrixWorld(true);return{group,mesh,materials:new Set([material]),viewBounds:new T.Box3().setFromObject(group),opacity:1}}
   const tall=slot(0,3,4,2,6,2);check('actual-opaque-obstruction',buildingObstructsPlayer(tall));
   check('near-side-with-clear-sightline',!buildingObstructsPlayer(slot(1.5,3,4,1,6,2)));
   check('low-roof-below-ray',!buildingObstructsPlayer(slot(0,.4,4,2,.8,2)));
   check('lower-body-only-obstruction',buildingObstructsPlayer(slot(0,.35,.5,2,.7,.5)));
   check('behind-player',!buildingObstructsPlayer(slot(0,3,-4,2,6,2)));
   check('behind-camera',!buildingObstructsPlayer(slot(0,3,14,2,6,2)));
   const glass=slot(0,3,4,2,6,2,.42);check('authored-glass-alone',!buildingObstructsPlayer(glass));
   tall.mesh.material.opacity=.03;check('faded-solid-stays-detected',buildingObstructsPlayer(tall));
   tall.group.visible=false;check('hidden-fallback',!buildingObstructsPlayer(tall));tall.group.visible=true;
   tall.label=tall.mesh;check('label-only',!buildingObstructsPlayer(tall));delete tall.label;
   tall.mesh.userData.occlusionDecoration=true;check('apron-only',!buildingObstructsPlayer(tall));delete tall.mesh.userData.occlusionDecoration;
   const second=slot(0,4,6,2,8,2),neighbor=slot(3,3,4,1,6,2);buildingSlots.push(tall,second,neighbor);updateBuildingOcclusion(1000/60);check('multiple-blockers-only',tall.opacity<1&&second.opacity<1&&neighbor.opacity===1);buildingSlots.length=0;
   check('stationary-silhouette-stability',Array.from({length:20},()=>buildingObstructsPlayer(tall)).every(Boolean));
   const empty=slot(0,3,4,2,6,2);empty.mesh.visible=false;const frame=new T.Mesh(new T.BoxGeometry(.2,6,2),empty.mesh.material);frame.position.set(2,3,4);empty.group.add(frame);empty.group.updateMatrixWorld(true);check('empty-space-inside-bounds',!buildingObstructsPlayer(empty));
   bridge.stationElevation=()=>8;check('raised-player-above-roof',!buildingObstructsPlayer(slot(0,2,4,2,4,2)));bridge.stationElevation=()=>0;
   buildingSlots.push(tall);tall.mesh.material.opacity=1;tall.opacity=1;previousOcclusionTime=0;updateBuildingOcclusion(1000/60);check('smooth-first-frame',tall.opacity>.03&&tall.opacity<1);
   const rates=[];for(const fps of [30,60,120]){tall.opacity=1;previousOcclusionTime=0;for(let i=1;i<=fps/2;i++)updateBuildingOcclusion(i*1000/fps);rates.push(tall.opacity)}check('elapsed-time-fade-parity',Math.max(...rates)-Math.min(...rates)<1e-8);
   tall.group.visible=false;previousOcclusionTime=0;tall.opacity=.03;updateBuildingOcclusion(1000/60);check('smooth-restore',tall.opacity>.03&&tall.opacity<1);
   // Pixel checks use the actual production sprite material and ordinary depth.
   const painted=document.createElement('canvas');painted.width=painted.height=16;painted.getContext('2d').fillStyle='#ff0000';painted.getContext('2d').fillRect(2,2,12,12);
   bridge.getNpcSpriteCanvas=()=>painted;bridge.npcSpriteGrids={probe:{cols:1,rows:1,frameWidth:16,frameHeight:16}};
   const atlasTextureCache=new Map(),atlasMaterialCache=new Map(),atlasSprite=eval(`(${atlas.trim()})`);
   const sprite=atlasSprite('probe',2),wall=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:0x0000ff}));
   const scene=new T.Scene();scene.add(sprite,wall);const view=new T.PerspectiveCamera(48,1,.1,20);view.position.set(0,0,5);view.lookAt(0,0,0);
   const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(64,64);renderer.outputColorSpace=T.SRGBColorSpace;
   function pixel(z){sprite.position.z=z;renderer.render(scene,view);const rgba=new Uint8Array(4);renderer.getContext().readPixels(32,32,1,1,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,rgba);return [...rgba]}
   const front=pixel(1),back=pixel(-1);check('sprite-in-front-of-wall',front[0]>200&&front[2]<20);check('sprite-behind-wall',back[2]>200&&back[0]<20);check('sprite-pixel-depth',sprite.material.depthWrite&&sprite.material.depthTest);
   wall.material.transparent=true;wall.material.opacity=.03;wall.material.depthWrite=false;wall.material.needsUpdate=true;const faded=pixel(-1);check('sprite-visible-through-faded-wall',faded[0]>180);
   const vehicleViewFrustum=new T.Frustum(),vehicleViewMatrix=new T.Matrix4(),vehicleViewBounds=new T.Box3(),isVehicleVisible=eval(`(${vehicleView.trim()})`);
   camera.position.set(0,1,10);camera.lookAt(0,1,0);camera.updateProjectionMatrix();
   check('vehicle-full-body-visible',isVehicleVisible(0,0,0));
   check('vehicle-center-outside-body-visible',isVehicleVisible(6,0,Math.PI/4));
   check('vehicle-complete-body-outside-view',!isVehicleVisible(8,0,0));
   camera.aspect=4;camera.updateProjectionMatrix();check('vehicle-wide-view-edge-body',isVehicleVisible(22,0,0));check('vehicle-wide-view-hidden-body',!isVehicleVisible(26,0,0));
   bridge.vehicleElevation=()=>10;check('vehicle-platform-height-in-view-test',!isVehicleVisible(0,0,0));camera.position.y=11;camera.lookAt(0,11,0);check('vehicle-raised-camera-and-car',isVehicleVisible(0,0,0));
   const vehicleSlot={renderScale:1.4,group:new T.Group()},syncVehicleScale=eval(`(${vehicleScale.trim()})`);
   syncVehicleScale(vehicleSlot);check('live-traffic-retains-scale',vehicleSlot.group.scale.toArray().every(v=>v===1.4));
   syncVehicleScale(vehicleSlot,.4,.6);check('vortex-multiplies-base-scale',Math.abs(vehicleSlot.group.scale.x-1.4*.4*(1+.6*.82))<1e-12);syncVehicleScale(vehicleSlot);check('vortex-restores-base-scale',vehicleSlot.group.scale.toArray().every(v=>v===1.4));
   renderer.dispose();return{checks,fadeAtHalfSecond:rates};
  },{occlusion:production('buildingObstructsPlayer'),fade:production('updateBuildingOcclusion'),atlas:production('atlasSprite'),vehicleView:production('isVehicleVisible'),vehicleScale:production('syncVehicleScale'),url:source.match(/const THREE_URL="([^"]+)"/)[1]});
  await page.evaluate(()=>document.getElementById('intro').classList.add('hidden'));
  const city=[];
  // Exercise the distinct native power-plant and uniformly fitted landmark
  // paths as well as the ordinary city-kit facade.
  for(const id of ['akw','bundestag'])for(const side of ['north','south']){
   // Exercise the tall tower separately from the hall that hides only the legs.
   await page.evaluate(({id,side})=>{const b=Germany3DBridge.buildings.find(b=>b.id===id);Germany3DBridge.player.x=b.x+b.w/2-(id==='akw'?255:0);Germany3DBridge.player.y=side==='north'?b.y-24:b.y+b.h+24;Germany3D.sync()},{id,side});await settleVisibility(page,id,side==='north');
   const visibility=await page.evaluate(id=>Germany3D.buildingVisibility.find(b=>b.id===id),id);city.push({id,view:side,...visibility});
   if((side==='north'&&visibility.opacity>.04)||(side==='south'&&visibility.opacity<.99))throw Error(`${name} ${id} ${side} opacity ${visibility.opacity}`);
   await page.screenshot({path:resolve(output,`${name}-${id}-${side}.png`)});
  }
  await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='akw');Germany3DBridge.player.x=b.x+b.w/2;Germany3DBridge.player.y=b.y-24;Germany3D.sync()});await settleVisibility(page,'akw',true);
  const plantHall=await page.evaluate(()=>Germany3D.buildingVisibility.find(b=>b.id==='akw'));city.push({view:'power-plant-lower-body-blocked',...plantHall});
  if(plantHall.opacity>.04)throw Error(`${name} plant hall hides legs without fading`);
  await page.screenshot({path:resolve(output,`${name}-akw-lower-body-blocked.png`)});
  for(const [view,side] of [['clear-near-facade','south'],['clear-near-side','west'],['obstructed','north'],['restored','south']]){
   await page.evaluate(side=>{const b=Germany3DBridge.buildings.find(b=>b.id==='buergeramt'),p=Germany3DBridge.player;p.x=side==='west'?b.x-24:b.x+b.w/2;p.y=side==='north'?b.y-24:side==='west'?b.y+b.h/2:b.y+b.h+24;Germany3D.sync()},side);
   await settleVisibility(page,'buergeramt',side==='north');
   const state=await page.evaluate(()=>({...Germany3D.inspectAssets().buildings.find(b=>b.id==='buergeramt'),...Germany3D.buildingVisibility.find(b=>b.id==='buergeramt')}));
   city.push({view,...state});await page.screenshot({path:resolve(output,`${name}-${view}.png`)});
   if((side==='north'&&state.opacity>.04)||(side!=='north'&&state.opacity<.99))throw Error(`${name} ${view} opacity ${state.opacity}`);
  }
  await page.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='bundestag');Germany3DBridge.player.x=b.doorX;Germany3DBridge.player.y=b.doorY+80;Germany3D.sync()});
  await settleVisibility(page,'bundestag',false);await page.screenshot({path:resolve(output,`${name}-bundestag.png`)});
  const assets=await page.evaluate(()=>Germany3D.inspectAssets()),landmark=assets.buildings.find(b=>b.id==='bundestag'),rathaus=assets.buildings.find(b=>b.id==='buergeramt');
  if(landmark.bounds.height<8||landmark.bounds.height<=rathaus.bounds.height)throw Error('Bundestag scale hierarchy');
  if(errors.length)throw Error(errors.join('\n'));
  await page.close();
  const direct=await context.newPage();direct.on('pageerror',error=>errors.push(`3d.html: ${error.message}`));
  await direct.goto(`http://127.0.0.1:${server.address().port}/3d.html`,{waitUntil:'domcontentloaded'});
  await direct.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:60000});
  await direct.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='bundestag');Germany3DBridge.player.x=b.doorX;Germany3DBridge.player.y=b.doorY+80;Germany3D.sync();Germany3D.prepareNearbyAssets()});
  await direct.waitForFunction(()=>{Germany3D.prepareNearbyAssets();return Germany3D.nearbyAssetsReady&&Germany3D.inspectAssets().buildings.find(b=>b.id==='bundestag')?.loaded},null,{timeout:60000});
  const diagnostic=await direct.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='bundestag');Germany3DBridge.player.x=b.doorX;Germany3DBridge.player.y=b.doorY+80;Germany3D.sync();return Germany3D.inspectAssets().buildings.find(b=>b.id==='bundestag')});
  if(Math.abs(diagnostic.bounds.height-landmark.bounds.height)>.001)throw Error('3d.html landmark mismatch');
  await direct.screenshot({path:resolve(output,`${name}-3d-landmark.png`)});await direct.close();
  const fallback=await context.newPage();fallback.on('pageerror',error=>errors.push(`fallback: ${error.message}`));
  await fallback.route('**/assets/models/**/*.glb*',route=>route.abort());
  await fallback.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  await fallback.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:60000});
  await fallback.evaluate(()=>{document.getElementById('intro').classList.add('hidden');const b=Germany3DBridge.buildings.find(b=>b.id==='buergeramt');Germany3DBridge.player.x=b.x+b.w/2;Germany3DBridge.player.y=b.y-24;Germany3D.sync()});
  await settleVisibility(fallback,'buergeramt',true);
  const fallbackBlocked=await fallback.evaluate(()=>({...Germany3D.buildingVisibility.find(b=>b.id==='buergeramt'),...Germany3D.inspectAssets().buildings.find(b=>b.id==='buergeramt')}));
  if(fallbackBlocked.loaded||!fallbackBlocked.fallback||fallbackBlocked.opacity>.04)throw Error('procedural fallback did not reveal player');
  await fallback.screenshot({path:resolve(output,`${name}-fallback-obstructed.png`)});
  await fallback.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='buergeramt');Germany3DBridge.player.y=b.y+b.h+24;Germany3D.sync()});await settleVisibility(fallback,'buergeramt',false);
  const fallbackRestored=await fallback.evaluate(()=>Germany3D.buildingVisibility.find(b=>b.id==='buergeramt'));
  if(fallbackRestored.opacity<.99)throw Error('procedural fallback did not restore');
  const fallbackLandmark=[];
  for(const id of ['akw','bundestag'])for(const side of ['north','south']){
   await fallback.evaluate(({id,side})=>{const b=Germany3DBridge.buildings.find(b=>b.id===id);Germany3DBridge.player.x=b.x+b.w/2-(id==='akw'?255:0);Germany3DBridge.player.y=side==='north'?b.y-24:b.y+b.h+24;Germany3D.sync()},{id,side});await settleVisibility(fallback,id,side==='north');
   const visibility=await fallback.evaluate(id=>Germany3D.buildingVisibility.find(b=>b.id===id),id);fallbackLandmark.push({side,...visibility});
   if((side==='north'&&visibility.opacity>.04)||(side==='south'&&visibility.opacity<.99))throw Error(`${name} fallback ${id} ${side} opacity ${visibility.opacity}`);
  }
  await fallback.evaluate(()=>{const b=Germany3DBridge.buildings.find(b=>b.id==='akw');Germany3DBridge.player.x=b.x+b.w/2;Germany3DBridge.player.y=b.y-24;Germany3D.sync()});await settleVisibility(fallback,'akw',true);
  const fallbackPlantHall=await fallback.evaluate(()=>Germany3D.buildingVisibility.find(b=>b.id==='akw'));fallbackLandmark.push({view:'lower-body-blocked',...fallbackPlantHall});
  if(fallbackPlantHall.opacity>.04)throw Error(`${name} fallback plant hall hides legs without fading`);
  await fallback.close();
  if(errors.length)throw Error(errors.join('\n'));
  report.cases.push({name,verdict:'PASS',fixture,city,landmark,rathaus,diagnostic,fallbackBlocked,fallbackRestored,fallbackLandmark,render:assets.render});await context.close();console.log(JSON.stringify({stage:'complete',view:name}));
 }
 writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({verdict:'PASS',cases:report.cases.map(c=>({name:c.name,geometryChecks:c.fixture.checks.length})),output,limits:report.limits}));
}finally{await browser?.close();await new Promise(done=>server.close(done))}
