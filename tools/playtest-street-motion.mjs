import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PLAYTEST_OUTPUT||'output/street-motion/browser');
const candidateFile=process.env.STREET_MOTION_CANDIDATE?resolve(root,process.env.STREET_MOTION_CANDIDATE):null;
if(candidateFile&&!candidateFile.startsWith(root+sep))throw Error('candidate must be inside the game');
const candidate=candidateFile?JSON.parse(readFileSync(candidateFile,'utf8')):null;
const groundProjection=process.env.STREET_GROUND_PROJECTION==='1';
const cornerMode=process.env.STREET_CORNER_PROBE==='1';
const stanceMeasurements=(process.env.STREET_STANCE_MEASUREMENTS||'').split(';').filter(Boolean).flatMap(file=>JSON.parse(readFileSync(file,'utf8')).assessments);
const candidateUrl=candidateFile?'/'+candidateFile.slice(root.length+1).replaceAll('\\','/'):null;
const candidateSetup=candidate?`assetSources.__motionCandidateSprite=${JSON.stringify(candidateUrl)};assets.__motionCandidateSprite=new Image();npcSpriteAtlases.__motionCandidate={canvas:null,cols:${candidate.cols},rows:${candidate.rows},pad:0,drawSize:160,tourist:null,frameWidth:${candidate.frame_size[0]},frameHeight:${candidate.frame_size[1]},pivot:${JSON.stringify(candidate.pivot)}};Germany3DBridge.npcSpriteGrids.__motionCandidate={cols:${candidate.cols},rows:${candidate.rows},frameWidth:${candidate.frame_size[0]},frameHeight:${candidate.frame_size[1]},pivot:${JSON.stringify(candidate.pivot)}};`:'';
mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+sep))throw Error('outside root');
  let body=readFileSync(file);
  if(file===candidateFile&&groundProjection)body=JSON.stringify({...candidate,groundProjection:true});
  if(file===resolve(root,'game.js'))body=body.toString().replace('function loop(now){',candidateSetup+'window.__streetMotion={state,player,npcs,update,requestCharacterReaction,npcSpriteAtlases'+(cornerMode?',buildings,props,pedestrianLane,pedestrianRouteContains,staticBlocked,responderBlocked,propRadius,signedRectDistance':'')+'};'+(cornerMode?`const cornerMove=moveGroundResponder;moveGroundResponder=function(n,dx,dy,r){const h=window.__streetMotion;if(n!==h.selected)return cornerMove(n,dx,dy,r);const before={x:n.x,y:n.y},result=cornerMove(n,dx,dy,r);h.cornerMoves.push({requested:{dx,dy},before,after:{x:n.x,y:n.y},result});return result};`:'')+'function loop(now){if(window.__streetMotion.manual){requestAnimationFrame(loop);return}');
  if(file===resolve(root,'world3d.js'))body=body.toString().replace('window.Germany3D={ready:true','window.__streetRender={scene,camera,renderer,npcMeshes,playerMesh,policeMeshes};window.Germany3D={ready:true');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={candidate:Object.fromEntries(['game.js','world3d.js','tourist-animation.js','character-interactions.js',...(candidateFile?[candidateFile]:[])].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),candidateAtlas:candidateUrl,cases:[],limits:['Seeded selection and player placement; production update, collision, route, reaction and rendering functions.','Silent headless Chromium desktop and Android emulation; physical Android and listening not exercised.',...(candidate?['Candidate atlas injected onto existing body-clear crowd routes; this diagnoses the real shared loader/simulation/renderer, not normal cast selection or final artwork approval.']:[])]};
report.groundProjectionOverride=groundProjection;
report.candidate['billboard-ground.js']=createHash('sha256').update(readFileSync('billboard-ground.js')).digest('hex');
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-angle=default']});
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop',deviceScaleFactor:1});
  context.setDefaultTimeout(60000);
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
   let seed=161026;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  });
  const page=await context.newPage(),errors=[],warnings=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='warning'||message.type()==='error')warnings.push(message.text())});
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__streetRender&&window.__streetMotion&&Germany3D.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden);
  const population=await page.evaluate(()=>{
   const h=__streetMotion;h.manual=true;
   Object.assign(h.state,{started:true,modal:false,voiceOn:false,quizTimer:10000,pettyAuditTimer:10000});
   document.getElementById('intro').classList.add('hidden');document.getElementById('dialogue').classList.add('hidden');document.body.classList.remove('preloading');
   return {total:h.npcs.length,sandales:h.npcs.filter(n=>n.sandale).map(n=>({id:n.id,name:n.name,voiceId:n.voiceId,spriteKind:n.spriteKind,vx:n.vx,vy:n.vy})),player3D:!!__streetRender.playerMesh.userData.ll};
  });
  assert(population.player3D);assert(population.sandales.length>=20);
  assert(population.sandales.some(n=>n.spriteKind==='towelMan'&&n.vx));assert(population.sandales.some(n=>n.spriteKind==='towelWoman'&&n.vy));
  if(cornerMode){
   // Use shipped geometry and route rectangles. No replacement collision or
   // movement implementation: the served hook only records real move calls.
   const discovery=await page.evaluate(()=>{
    const h=__streetMotion;h.cornerMoves=[];
    const routes=[...new Map(h.npcs.filter(n=>!n.special&&!n.jwdRole&&n.routeBounds).map(n=>[JSON.stringify(n.routeBounds),n.routeBounds])).values()];
    const clean=(n,x,y)=>h.pedestrianRouteContains(n,x,y)&&!h.staticBlocked(x,y,13)&&!h.responderBlocked(x,y,13,n);
    const exit=(n)=>{for(const [dx,dy] of [[30,0],[-30,0],[0,30],[0,-30]]){let clear=true;for(let i=1;i<=30;i++)if(!clean(n,n.x+dx*i/30,n.y+dy*i/30)){clear=false;break}if(clear)return {x:n.x+dx,y:n.y+dy}}return null};
    const choices=[];
    for(const b of h.buildings)for(const sx of [-1,1])for(const sy of [-1,1])for(const bounds of routes){
     const x=(sx<0?b.x:b.x+b.w)+sx*14,y=(sy<0?b.y:b.y+b.h)+sy*14;
     const n={x,y,vx:-sx*18,vy:0,routeBounds:bounds},lane=h.pedestrianLane(n),dy=Math.sign(lane-y)*18;
     if(Math.sign(dy)!==-sy||!clean(n,x,y))continue;
     // A straight requested path must actually encounter this corner within 1s.
     if(!h.staticBlocked(x+n.vx*.9,y+dy*.9,13))continue;
     const legalExit=exit(n);if(legalExit)choices.push({type:'outer-corner',building:{id:b.id,x:b.x,y:b.y,w:b.w,h:b.h},x,y,vx:n.vx,vy:0,routeBounds:bounds,legalExit});
    }
    const props=[];
    for(const p of h.props.filter(p=>!p.decorative))for(const bounds of routes)for(const side of [-1,1]){
     const radius=h.propRadius(p),n={x:p.x+side*(radius+14),y:p.y,vx:-side*18,vy:0,routeBounds:bounds};
     if(!clean(n,n.x,n.y))continue;
     const facade=h.buildings.map(b=>({b,d:h.signedRectDistance(p.x,p.y,b)})).sort((a,b)=>a.d-b.d)[0];
     if(!facade||facade.d>120)continue;
     const dy=Math.sign(h.pedestrianLane(n)-n.y)*18;
     if(!h.staticBlocked(n.x+n.vx*.6,n.y+dy*.6,13))continue;
     const legalExit=exit(n);if(legalExit)props.push({type:'prop-by-facade',prop:{asset:p.asset,id:p.id,x:p.x,y:p.y,radius},building:{id:facade.b.id,distance:facade.d},x:n.x,y:n.y,vx:n.vx,vy:0,routeBounds:bounds,legalExit});
    }
    return {routeCount:routes.length,outerCandidates:choices.slice(0,8),propCandidates:props.slice(0,8),missing:['inside-L: no existing authored two-face concave-corner fixture identified','closed-exit: no existing authored fully enclosed legal pedestrian pocket identified']};
   });
   const scenarios=[];
   const selected=[discovery.outerCandidates[0],discovery.propCandidates[0]].filter(Boolean);
   if(discovery.outerCandidates[0])selected.push({...discovery.outerCandidates[0],type:'outer-corner-citizen-blocker',citizenBlocker:true});
   for(const setup of selected){
    const initial=await page.evaluate(({setup,scale})=>{
     const h=__streetMotion,n=h.npcs.find(n=>n.sandale&&n.spriteKind==='towelMan');
     if(!n)throw Error('Missing original Sandale pilot body');
     for(const other of h.npcs)other.arrested=true;
     h.selected=n;h.cornerMoves=[];
     Object.assign(n,{...setup,arrested:false,spriteKind:scale?'__motionCandidate':'towelMan',spriteScale:scale||n.spriteScale,spriteFrame:0,spriteRow:0,gaitDistance:0,touristFacing:null,touristRequested:null,touristTurn:null,characterInteraction:null,interactionRequest:null,pause:0,progressWindow:null,blockedTimer:0,reactionNear:true,reactionCooldown:10000,reactionPauseSeen:false,avoid:1,min:setup.routeBounds.x+13,max:setup.routeBounds.x+setup.routeBounds.w-13});
     n.barkAt=Infinity;h.state.quizApproach=null;h.state.modal=false;h.state.quizTimer=10000;h.state.pettyAuditTimer=10000;
     Object.assign(h.player,{x:n.x,y:n.y+150});
     let blocker=null;
     if(setup.citizenBlocker){
      const dy=Math.sign(h.pedestrianLane(n)-n.y)*18,length=Math.hypot(n.vx,dy),x=n.x-dy/length*27,y=n.y+n.vx/length*27;
      const other=h.npcs.find(o=>o!==n&&!o.special&&!o.jwdRole);
      if(!h.pedestrianRouteContains(n,x,y)||h.responderBlocked(x,y,13,other))return {status:'NOT RUN',reason:'Favored-side citizen placement is not body-clear legal ground',x,y};
      Object.assign(other,{x,y,arrested:true});blocker={id:other.id,x,y,radius:13};
     }
     Germany3DBridge.prepareNearbyAssets();Germany3D.sync();
     return {status:'READY',id:n.id,root:{x:n.x,y:n.y},radius:13,routeBounds:n.routeBounds,legalExit:setup.legalExit,blocker};
    },{setup,scale:candidate?(candidate.billboardWorldHeight||candidate.figureWorldHeight*candidate.frame_size[1]/candidate.figureHeight):null});
    if(initial.status!=='READY'){scenarios.push({setup,initial,status:'NOT RUN'});continue}
    await page.waitForFunction(()=>{Germany3DBridge.prepareNearbyAssets();Germany3D.prepareNearbyAssets();return !!__streetMotion.npcSpriteAtlases[__streetMotion.selected.spriteKind].canvas});
    const samples=[];
    for(let second=0;second<=5;second++){
     const chunk=await page.evaluate(({second})=>{
      const h=__streetMotion,n=h.selected,r=__streetRender,result=[];
      const snapshot=(time)=>({time,x:n.x,y:n.y,vx:n.vx,vy:n.vy,frame:n.spriteFrame,row:n.spriteRow,phase:n.gaitDistance||0,facing:n.touristFacing,turning:!!n.touristTurn,reaction:!!n.characterInteraction,pause:n.pause||0,target:{along:n.vx>0?n.max:n.min,lane:h.pedestrianLane(n)},legalGround:h.pedestrianRouteContains(n,n.x,n.y),bodyClear:!h.responderBlocked(n.x,n.y,13,n),camera:r.camera.position.toArray(),moves:h.cornerMoves.splice(0)});
      if(second===0){Germany3D.sync();return [snapshot(0)]}
      for(let f=0;f<60;f++){h.update(1/60);Germany3D.sync();result.push(snapshot(second-1+(f+1)/60))}return result;
     },{second});samples.push(...chunk);
     await page.screenshot({path:resolve(out,`${name}-${setup.type}-${second}s.png`)});
    }
    const last=samples.at(-1),netProgress=Math.hypot(last.x-initial.root.x,last.y-initial.root.y),illegal=samples.filter(s=>!s.legalGround||!s.bodyClear);
    const stillWalking=samples.filter((s,i)=>i&&Math.hypot(s.x-samples[i-1].x,s.y-samples[i-1].y)<1e-7&&!s.turning&&!s.reaction&&!samples[i-1].turning&&!samples[i-1].reaction&&s.phase!==samples[i-1].phase);
    scenarios.push({setup,initial,elapsedSeconds:5,dt:1/60,netProgress,requiredProgress:26,illegalSamples:illegal.length,blockedGaitAdvances:stillWalking.length,status:netProgress>=26&&!illegal.length&&!stillWalking.length?'PASS':'FAIL',samples});
   }
   report.cases.push({name,viewport,population,discovery,scenarios,errors});writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
   console.log(JSON.stringify({name,scenarios:scenarios.map(s=>({type:s.setup.type,status:s.status,netProgress:s.netProgress,illegal:s.illegalSamples})),missing:discovery.missing}));
   await context.close();continue;
  }
  const trajectories=[];
  for(const [kind,vertical] of [['towelMan',false],['towelWoman',false],['towelMan',true],['towelWoman',true]]){
   const selected=await page.evaluate(({kind,vertical,candidateScale})=>{
    const h=__streetMotion,n=h.npcs.filter(n=>n.sandale&&n.spriteKind===kind&&!!n.vy===vertical).sort((a,b)=>Math.hypot(a.x-h.player.x,a.y-h.player.y)-Math.hypot(b.x-h.player.x,b.y-h.player.y))[0];
    if(!n)throw Error('Missing Sandale route');
    if(candidateScale){n.spriteKind='__motionCandidate';n.spriteScale=candidateScale;n.spriteFrame=0;n.gaitDistance=0;n.touristFacing=null;n.touristRequested=null;n.touristTurn=null;n.characterInteraction=null;n.interactionRequest=null}
    h.selected=n;Object.assign(h.player,{x:n.x+(vertical?85:0),y:n.y+(vertical?0:85)});
    Object.assign(n,{reactionNear:true,reactionCooldown:10000,pause:0});n.barkAt=Infinity;
    h.state.quizTimer=10000;h.state.pettyAuditTimer=10000;Germany3DBridge.prepareNearbyAssets();Germany3D.sync();
    return {id:n.id,kind,vertical,x:n.x,y:n.y};
   },{kind,vertical,candidateScale:candidate?(candidate.billboardWorldHeight||candidate.figureWorldHeight*candidate.frame_size[1]/candidate.figureHeight):null});
   try{await page.waitForFunction(kind=>{Germany3DBridge.prepareNearbyAssets();Germany3D.prepareNearbyAssets();return !!__streetMotion.npcSpriteAtlases[kind].canvas},candidate?'__motionCandidate':kind)}
   catch(error){report.admissionFailure={name,kind,vertical,warnings,errors,status:await page.evaluate(()=>({characters:Germany3DBridge.characterAssetStatus,queue:Germany3DBridge.assetLoadStatus}))};throw error}
   await page.evaluate(()=>Germany3D.sync());
   const samples=await page.evaluate(()=>{
    const h=__streetMotion,n=h.selected,r=__streetRender,frames=[];
    const snapshot=()=>{const q=r.npcMeshes.get(n),g=q.userData.grid,m=h.npcSpriteAtlases[n.spriteKind].tourist;return {x:n.x,y:n.y,frame:n.spriteFrame,row:n.spriteRow,phase:n.gaitDistance||0,facing:n.touristFacing,turning:!!n.touristTurn,reaction:!!n.characterInteraction,painted:!!q.userData[n.spriteKind+'Sprite'],width:g?.frameWidth,height:g?.frameHeight,sourceHash:m?.sha256,image:m?.image,textureWidth:q.material?.map?.image?.width,depthTest:q.material?.depthTest,depthWrite:q.material?.depthWrite}};
    for(let frame=0;frame<360;frame++){h.update(1/60);if(frame%12===0){Germany3D.sync();frames.push(snapshot())}}
    Germany3D.sync();frames.push(snapshot());return frames;
   });
   assert(samples.every(s=>s.painted&&s.depthTest&&s.depthWrite),'accepted paint uses ordinary depth');
   assert(new Set(samples.map(s=>s.frame)).size>=4,'actual route uses distinct walk phases');
   assert(Math.hypot(samples.at(-1).x-samples[0].x,samples.at(-1).y-samples[0].y)>10,'actor makes actual legal route progress');
   await page.evaluate(()=>{const h=__streetMotion;Object.assign(h.player,{x:h.selected.x,y:h.selected.y+85});Germany3D.sync();Germany3D.sync()});
   assert(await page.locator('#preload').isHidden(),'visible world capture must be past the startup overlay');
   await page.screenshot({path:resolve(out,`${name}-${kind}-${vertical?'vertical':'horizontal'}.png`)});
   let floorProbe=null;
   if(candidate){
    floorProbe=await page.evaluate(async()=>{
     const T=await import('/assets/vendor/three/0.186.0/build/three.module.min.js');
     const h=__streetMotion,n=h.selected,r=__streetRender,q=r.npcMeshes.get(n),m=h.npcSpriteAtlases[n.spriteKind].tourist;
     const saved={spriteRow:n.spriteRow,spriteFrame:n.spriteFrame},scene=new T.Scene();scene.background=new T.Color(0xeee8db);
     const ground=Germany3DBridge.stationElevation(n.x,n.y),floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshBasicMaterial({colorWrite:false}));
     floor.position.set(q.position.x,ground+.008,q.position.z);floor.rotation.x=-Math.PI/2;floor.renderOrder=-100;scene.add(floor);
     const gl=r.renderer.getContext(),size=r.renderer.getDrawingBufferSize(new T.Vector2()),results=[];let worst=null;
     try{
      for(let frame=0;frame<m.walks[n.touristFacing].frames;frame++){
       n.spriteRow=m.walks[n.touristFacing].row;n.spriteFrame=frame;Germany3D.sync();
       const sprite=q.clone(false);scene.add(sprite);sprite.updateMatrixWorld(true);
       let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
       const point=new T.Vector3(),positions=sprite.geometry.attributes.position;
       for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(sprite.matrixWorld).project(r.camera);const x=(point.x+1)*size.x/2,y=(1-point.y)*size.y/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
       const x=Math.max(0,Math.floor(left)-2),y=Math.max(0,Math.floor(top)-2),width=Math.min(size.x,Math.ceil(right)+2)-x,height=Math.min(size.y,Math.ceil(bottom)+2)-y;
       if(width<=0||height<=0)throw Error('floor probe actor is outside camera');
       const before=new Uint8Array(width*height*4),after=new Uint8Array(before.length);
       floor.visible=false;r.renderer.render(scene,r.camera);gl.readPixels(x,size.y-y-height,width,height,gl.RGBA,gl.UNSIGNED_BYTE,before);
       floor.visible=true;r.renderer.render(scene,r.camera);gl.readPixels(x,size.y-y-height,width,height,gl.RGBA,gl.UNSIGNED_BYTE,after);
       let changed=0;for(let i=0;i<before.length;i+=4)if(Math.max(...before.subarray(i,i+3).map((value,c)=>Math.abs(value-after[i+c])))>1)changed++;
       results.push({frame,changedPixels:changed,crop:{x,y,width,height}});
       if(!worst||changed>worst.changedPixels){floor.visible=false;r.renderer.render(scene,r.camera);const beforePng=r.renderer.domElement.toDataURL();floor.visible=true;r.renderer.render(scene,r.camera);worst={frame,changedPixels:changed,beforePng,afterPng:r.renderer.domElement.toDataURL()}}
       scene.remove(sprite);
      }
      return {facing:n.touristFacing,sourceHash:m.sha256,groundHeight:ground+.008,results,worst,method:'Same production atlas/geometry/material/camera, depth-only plane at real sidewalk .008 height. Borrowed sprite in isolated scene; no depth settings disabled.'};
     }finally{Object.assign(n,saved);floor.geometry.dispose();floor.material.dispose();Germany3D.sync()}
    });
    for(const when of ['before','after']){const field=when+'Png';writeFileSync(resolve(out,`${name}-${kind}-${vertical?'vertical':'horizontal'}-floor-${when}.png`),Buffer.from(floorProbe.worst[field].split(',')[1],'base64'));delete floorProbe.worst[field]}
   }
   const stanceProbe=stanceMeasurements.length?await page.evaluate(async measurements=>{
    const T=await import('/assets/vendor/three/0.186.0/build/three.module.min.js');
    const h=__streetMotion,n=h.selected,r=__streetRender,q=r.npcMeshes.get(n),m=h.npcSpriteAtlases[n.spriteKind].tourist;
    const marks=measurements.find(item=>item.view.startsWith(n.touristFacing+'-')&&item.atlas_sha256===m.sha256);
    if(!marks)throw Error('No current stance annotations for loaded facing and bytes');
    const grid=q.userData.grid,geometry=q.geometry,base=q.userData.baseUv,positions=geometry.attributes.position,indices=geometry.index;
    q.updateMatrixWorld(true);
    const point=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),weights=new T.Vector3(),world=new T.Vector3(),vertex=new T.Vector3();
    const rootX=(n.x-Germany3DBridge.WORLD.w/2)*.02,rootZ=(n.y-Germany3DBridge.WORLD.h/2)*.02;
    const along=p=>n.touristFacing==='right'?p.x:n.touristFacing==='left'?-p.x:n.touristFacing==='down'?p.z:-p.z;
    const rootAlong=along({x:rootX,z:rootZ}),ground=Germany3DBridge.stationElevation(n.x,n.y)+.012,contacts=[];
    for(const contact of marks.contacts){
     const samples=[];
     for(const mark of contact.samples){
      const x=mark.cell_x??(mark.footXWindow[0]+mark.footXWindow[1])/2,y=mark.cell_y??mark.soleY;
      point.set((x+.5)/grid.frameWidth,1-(y+.5)/grid.frameHeight,0);
      let found=false;
      for(let i=0;i<indices.count;i+=3){
       const ids=[indices.getX(i),indices.getX(i+1),indices.getX(i+2)];
       for(const [v,id] of [[a,ids[0]],[b,ids[1]],[c,ids[2]]])v.set(base[id*2],base[id*2+1],0);
       T.Triangle.getBarycoord(point,a,b,c,weights);
       if(Math.min(weights.x,weights.y,weights.z)<-1e-7)continue;
       world.set(0,0,0);for(let j=0;j<3;j++)world.addScaledVector(vertex.fromBufferAttribute(positions,ids[j]),weights.getComponent(j));
       world.applyMatrix4(q.matrixWorld);
       // Intersect this displayed texel's camera ray with its actual support plane.
       const fraction=(ground-r.camera.position.y)/(world.y-r.camera.position.y);
       world.sub(r.camera.position).multiplyScalar(fraction).add(r.camera.position);
       samples.push({frame:mark.frame,phase:mark.frame/marks.frames_per_cycle,footOffset:(along(world)-rootAlong)/.02});found=true;break;
      }
      if(!found)throw Error('Sole annotation lies outside the displayed geometry');
     }
     contacts.push({foot:contact.foot,samples});
    }
    let covariance=0,variance=0,currentSquared=0,currentMax=0,count=0;
    for(const contact of contacts){
     const mean=key=>contact.samples.reduce((sum,s)=>sum+s[key],0)/contact.samples.length,phase=mean('phase'),offset=mean('footOffset');
     for(const sample of contact.samples){const dp=sample.phase-phase,dy=sample.footOffset-offset,error=m.cycle_distance*dp+dy;covariance+=dp*dy;variance+=dp*dp;currentSquared+=error*error;currentMax=Math.max(currentMax,Math.abs(error));count++}
    }
    return {facing:n.touristFacing,sourceHash:m.sha256,cycleDistance:m.cycle_distance,bestFitCycle:-covariance/variance,currentRmsGameUnits:Math.sqrt(currentSquared/count),currentMaxGameUnits:currentMax,contacts,camera:r.camera.position.toArray(),method:'Authored exact-encoded sole marks mapped through production mesh triangles and current camera onto the actual support plane. Ground-offset fit diagnoses slide; it does not approve anatomy or contact selection.'};
   },stanceMeasurements):null;
   const hold=await page.evaluate(()=>{
    const h=__streetMotion,n=h.selected;
    h.state.modal=true;const before={x:n.x,y:n.y,phase:n.gaitDistance,frame:n.spriteFrame,row:n.spriteRow};
    for(let i=0;i<120;i++)h.update(1/60);Germany3D.sync();
    const after={x:n.x,y:n.y,phase:n.gaitDistance,frame:n.spriteFrame,row:n.spriteRow};h.state.modal=false;return {before,after};
   });
   assert.deepEqual(hold.after,hold.before,'modal freezes ordinary route and gait');
   trajectories.push({...selected,samples,hold,floorProbe,stanceProbe});
  }
  let cameraTransitions=null;
  if(candidate&&groundProjection){
   cameraTransitions=await page.evaluate(()=>{
    const h=__streetMotion,r=__streetRender,n=h.selected,q=r.npcMeshes.get(n),saved={x:h.player.x,y:h.player.y};
    const memorial=Germany3DBridge.kiesingerMemorial,park=Germany3DBridge.goerlitzerPark,results=[];
    try{
     for(const [location,x,y] of [['memorial',memorial.x+75,memorial.y+195],['park',park.plaqueX,park.plaqueY]]){
      Object.assign(h.player,{x,y});Germany3D.sync();
      results.push({location,camera:[r.camera.position.x,r.camera.position.y,r.camera.position.z],billboardAngleError:q.quaternion.angleTo(r.camera.quaternion)});
     }
     return results;
    }finally{Object.assign(h.player,saved);Germany3D.sync()}
   });
  }
  assert.deepEqual(errors,[]);report.cases.push({name,viewport,population,trajectories,cameraTransitions,errors});
  writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
  assert(cameraTransitions===null||cameraTransitions.every(item=>item.billboardAngleError<1e-6),'ground projection must use the final camera in the same frame');
  console.log(JSON.stringify({name,sandales:population.sandales.length,routes:trajectories.length,errors}));
  await context.close();
 }
 report.complete=true;
}catch(error){report.failure=error.message;throw error}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.close()}
