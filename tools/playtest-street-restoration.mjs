import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PLAYTEST_OUTPUT||'output/street-restoration/browser');mkdirSync(out,{recursive:true});
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+sep))throw Error('outside game');let body=readFileSync(file);
  if(file===resolve('game.js'))body=body.toString().replace('function loop(now){','window.__restore={state,player,npcs,police,keys,spawnPolice,update,npcSpriteAtlases,requestCharacterReaction,updateCharacterReaction};function loop(now){if(window.__restore.manual){requestAnimationFrame(loop);return}');
  if(file===resolve('world3d.js'))body=body.toString().replace('window.Germany3D={ready:true','window.__restoreRender={npcMeshes,policeMeshes,playerMesh,renderer,camera};window.Germany3D={ready:true');
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={candidate:Object.fromEntries(['game.js','world3d.js','tourist-animation.js','index.html','assets/tourists/towelMan/manifest.json','assets/tourists/towelWoman/manifest.json','assets/tourists/towelMan/movement-atlas.webp','assets/tourists/towelWoman/movement-atlas.webp'].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),cases:[],limits:['Seeded state/placement; production movement, sprite admission, rendering and police spawn.','Silent headless Chromium and Android emulation; physical device and perceptual audio NOT RUN.']};
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop',deviceScaleFactor:1});context.setDefaultTimeout(90000);
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
   let seed=161026;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  });
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
  const releaseFull={};for(const kind of ['towelMan','towelWoman']){const gate=new Promise(resolve=>{releaseFull[kind]=resolve});await page.route(`**/tourists/${kind}/character-atlas.webp`,async route=>{await gate;await route.continue()})}
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__restoreRender&&window.__restore&&Germany3D.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden);
  assert(!requests.some(url=>/tourists\/(towelMan|towelWoman)\/character-atlas\.(webp|png)/.test(url)),'title must retain only movement delivery');
  const population=await page.evaluate(()=>{
   const h=__restore;h.manual=true;Object.assign(h.state,{started:true,modal:false,voiceOn:false,quizTimer:10000,pettyAuditTimer:10000});
   document.getElementById('intro').classList.add('hidden');document.getElementById('dialogue').classList.add('hidden');
   return {total:h.npcs.length,sandales:h.npcs.filter(n=>n.sandale).map(n=>{
    const atlas=h.npcSpriteAtlases[n.spriteKind],heading=n.vx?(n.vx>0?'right':'left'):(n.vy>0?'down':'up'),walk=atlas.tourist?.walks[heading];
    return {id:n.id,name:n.name,voiceId:n.voiceId,spriteKind:n.spriteKind,initial:{loaded:!!atlas.canvas&&!!walk,heading,frame:n.spriteFrame,row:n.spriteRow,valid:!!walk&&n.spriteFrame>=0&&n.spriteFrame<walk.frames&&n.spriteRow===walk.row&&!n.spriteFlip}};
   })};
  });
  assert.equal(population.sandales.length,36);
  assert(population.sandales.some(n=>n.initial.loaded),'startup must prepare an original Sandale atlas');
  if(population.sandales.some(n=>n.initial.loaded&&!n.initial.valid))report.startupFailure={name,population};
  assert(population.sandales.filter(n=>n.initial.loaded).every(n=>n.initial.valid),'loaded Sandales must start on a valid authored facing and phase');
  const reactions=[];
  for(const kind of ['towelMan','towelWoman']){
   const before=await page.evaluate(kind=>{const h=__restore,n=h.npcs.filter(n=>n.sandale&&n.spriteKind===kind).sort((a,b)=>Math.hypot(a.x-h.player.x,a.y-h.player.y)-Math.hypot(b.x-h.player.x,b.y-h.player.y))[0];h.reactionActor=n;Object.assign(h.player,{x:n.x,y:n.y+85});for(let i=0;i<60;i++)Germany3D.sync();Object.assign(n,{characterInteraction:null,interactionRequest:null,touristTurn:null});return {movementOnly:!!h.npcSpriteAtlases[kind].tourist.movementOnly,accepted:h.requestCharacterReaction(n,'waving')}},kind);assert(before.accepted);assert(before.movementOnly,'explicit reaction begins on movement-only delivery');
   const held=await page.evaluate(()=>{const h=__restore,n=h.reactionActor,before={row:n.spriteRow,frame:n.spriteFrame};h.updateCharacterReaction(n,.2);Germany3D.sync();return {before,after:{row:n.spriteRow,frame:n.spriteFrame},movementOnly:!!h.npcSpriteAtlases[n.spriteKind].tourist.movementOnly}});assert(held.movementOnly);assert.deepEqual(held.before,held.after);
   releaseFull[kind]();
   await page.waitForFunction(kind=>!__restore.npcSpriteAtlases[kind].tourist.movementOnly,kind);
   await page.evaluate(()=>{const h=__restore,n=h.reactionActor;for(let i=0;i<600&&n.spriteRow!==11;i++)h.updateCharacterReaction(n,1/60);Germany3D.sync()});
   await page.screenshot({path:resolve(out,`${name}-${kind}-reaction.png`)});
   const reaction=await page.evaluate(()=>{const h=__restore,n=h.reactionActor,r=__restoreRender;for(let i=0;i<100&&!n.characterInteraction;i++)h.updateCharacterReaction(n,1/60);let frames=[];for(let i=0;i<200;i++){h.updateCharacterReaction(n,1/60);Germany3D.sync();frames.push(n.spriteRow)}const q=r.npcMeshes.get(n),source=Germany3DBridge.getNpcSpriteCanvas(n.spriteKind);return {rows:[...new Set(frames)],textureCurrent:q.material.map.image===source,textureHeight:source.naturalHeight,interactionPending:!!n.interactionRequest}});
   assert(reaction.rows.some(row=>row>=10),'full authored reaction poses must be presented');assert(reaction.textureCurrent);assert(!reaction.interactionPending);reactions.push({kind,before,held,reaction});
  }
  const routes=[];
  for(const [kind,vertical] of [['towelMan',false],['towelWoman',false],['towelMan',true],['towelWoman',true]]){
   await page.evaluate(({kind,vertical})=>{
    const h=__restore;h.selected=h.npcs.filter(n=>n.sandale&&n.spriteKind===kind&&!!n.vy===vertical).sort((a,b)=>Math.hypot(a.x-h.player.x,a.y-h.player.y)-Math.hypot(b.x-h.player.x,b.y-h.player.y))[0];
    const n=h.selected;if(!n)throw Error('missing route');Object.assign(h.player,{x:n.x+(vertical?85:0),y:n.y+(vertical?0:85)});Object.assign(n,{reactionNear:true,reactionCooldown:10000,pause:0,barkAt:Infinity,characterInteraction:null,interactionRequest:null});
    Germany3DBridge.prepareNearbyAssets();Germany3D.sync();
   },{kind,vertical});
   await page.waitForFunction(kind=>{Germany3DBridge.prepareNearbyAssets();Germany3D.prepareNearbyAssets();return !!__restore.npcSpriteAtlases[kind].canvas},kind);
   const route=await page.evaluate(()=>{
    const h=__restore,n=h.selected,r=__restoreRender,samples=[];
    for(let frame=0;frame<180;frame++){h.update(1/60);if(frame%6===0){Germany3D.sync();const q=r.npcMeshes.get(n);samples.push({x:n.x,y:n.y,row:n.spriteRow,frame:n.spriteFrame,phase:n.gaitDistance,paintTakeover:!!q.userData.streetPaintView,depthTest:q.material.depthTest,depthWrite:q.material.depthWrite})}}
    h.state.modal=true;const before={x:n.x,y:n.y,phase:n.gaitDistance,frame:n.spriteFrame,row:n.spriteRow};for(let i=0;i<60;i++)h.update(1/60);const after={x:n.x,y:n.y,phase:n.gaitDistance,frame:n.spriteFrame,row:n.spriteRow};h.state.modal=false;
    Object.assign(h.player,{x:n.x,y:n.y+85});Germany3D.sync();Germany3D.sync();
    const manifest=h.npcSpriteAtlases[n.spriteKind].tourist;return {id:n.id,kind:n.spriteKind,vertical:!!n.vy,samples,hold:{before,after},source:{image:manifest.image,sha256:manifest.delivery?.sha256||manifest.sha256}};
   });
   assert(route.samples.every(s=>!s.paintTakeover&&s.depthTest&&s.depthWrite));assert(new Set(route.samples.map(s=>s.frame)).size>=4);
   assert(Math.hypot(route.samples.at(-1).x-route.samples[0].x,route.samples.at(-1).y-route.samples[0].y)>10);assert.deepEqual(route.hold.before,route.hold.after);
   await page.screenshot({path:resolve(out,`${name}-${kind}-${vertical?'vertical':'horizontal'}.png`)});routes.push(route);
  }
  const models=await page.evaluate(()=>{
   const h=__restore,r=__restoreRender;h.state.wanted=2;h.spawnPolice(1,false);Germany3D.sync();const officer=h.police.at(-1);if(!officer)throw Error('no legal police spawn');
   const describe=q=>{let planes=0,volumes=0;q.traverse(node=>{if(node.isMesh){if(node.geometry.type==='PlaneGeometry')planes++;else volumes++}});return {planes,volumes,paintTakeover:!!q.userData.streetPaintView,legs:[q.userData.ll?.rotation.x,q.userData.rl?.rotation.x],phase:q.userData.walkPhase}};
   const before={player:describe(r.playerMesh),officer:describe(r.policeMeshes.get(officer))},samples=[];
   h.keys.ArrowRight=true;h.keys.ShiftLeft=true;
   for(let frame=0;frame<30;frame++){h.update(1/60);Germany3D.sync();const q=r.policeMeshes.get(officer);if(!q)throw Error('officer retired during probe');samples.push({player:describe(r.playerMesh),officer:describe(q)})}
   h.keys.ArrowRight=false;h.keys.ShiftLeft=false;return {before,samples};
  });
  for(const role of ['player','officer']){assert(models.samples.every(s=>s[role].planes===0&&s[role].volumes>=6&&!s[role].paintTakeover));assert(new Set(models.samples.map(s=>s[role].legs[0])).size>4,role+' must animate limbs through actual displacement')}
  await page.waitForFunction(()=>document.getElementById('violation-alert').hidden&&document.getElementById('border-alert').hidden&&!document.getElementById('toast').classList.contains('show'));
  await page.screenshot({path:resolve(out,`${name}-3d-running.png`)});assert.deepEqual(errors,[]);
  report.cases.push({name,viewport,population,routes,reactions,models,errors});writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({name,sandales:population.sandales.length,routes:routes.length,reactions:reactions.length,models:'3D',errors}));await context.close();
 }
 report.complete=true;
}catch(error){report.failure=error.message;throw error}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.close()}
