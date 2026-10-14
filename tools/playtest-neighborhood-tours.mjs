// Silent, input-driven JWD tour QA. By default registration/home placement is a
// disclosed setup seam; JWD_DIRECT_ENTRY=1 uses the public /?geheim=nachbarn route.
// Tours then use keyboard or directional touch movement and E controls.
// A separate forced-distance probe checks cancellation without replaying the city.
// Run with preinstalled Playwright (PLAYWRIGHT_MODULE) and CHROMIUM_PATH. Optional:
// JWD_PROFILE=desktop|android-portrait|android-landscape, JWD_OUTPUT=<evidence dir>,
// JWD_PAINT_FAILURE=1 (three introductions), JWD_SKIP_REPEATS=1 (targeted replay),
// JWD_DIRECT_ENTRY=1 (natural public startup, no registration/mission/position seed).
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.JWD_OUTPUT||'output/neighborhood-tours/browser');
const directEntry=process.env.JWD_DIRECT_ENTRY==='1',entry=directEntry?'/?geheim=nachbarn':'/index.html';
mkdirSync(out,{recursive:true});
const sources=['index.html','3d.html','preload.js','styles.css','game-hud.js','game-hud.css','game.js','world3d.js','neighbor-story.js','neighbor-sprites.js','jwd-gardens.js','tools/playtest-neighborhood-tours.mjs','assets/characters/neighbors/manifest.json',...['heiko','inga','schwabingen','theodore'].flatMap(id=>['','-mobile'].map(variant=>`assets/characters/neighbors/${id}${variant}.webp`))];
const revision=()=>Object.fromEntries(sources.map(f=>[f,createHash('sha256').update(readFileSync(resolve(root,f))).digest('hex')]));
const report={revision:revision(),entryMode:directEntry?'public-direct-entry':'seeded-home',cases:[],limits:[
 directEntry?'The public /?geheim=nachbarn route supplies its own chapter prerequisites. The driver does not seed registration, mission, position, allocation, visits, or introduction credit; this proves direct entry, not the prior registration chain.':'Registration, mission 1, and initial home placement are seeded; this does not prove the prior registration chain.',
 'An initial petty-audit cooldown suppresses unrelated random city audits; neighborhood visitor and burglar scheduling stays live.',
 'Tour progression and player displacement use real browser keyboard events on desktop and CDP directional touch contacts on Android emulation; mobile stop interactions use touch-backed taps.',
 'Cancellation alone uses a disclosed distant-player placement; no completion/state/actor position is forced during the completed tours.',
 'The navigation planner uses production collision queries for every NPC, vehicle, train, solid, and elevation-changing segment and prefers paving; where a person fills a narrow path it permits a short grass-edge passing route, using ordinary player movement. It does not directly move the player or guides.',
 'When the production hint requests room to pass, the follower selects a nearby body-clear yielding position beyond the local actor group and backtrack corridor, then reaches it with the same physical controls. Yield targets and actual displacement are reported.',
 'Clearance traces sample rendered frames; independent physics checks own every-substep collision coverage.',
 'Projected sizes are visible mesh bounds, including transparent atlas padding, rather than alpha silhouettes.',
 'Headless Chromium desktop and Android emulation; physical Android and perceptual audio listening are NOT RUN.'
]};
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const seam=`window.__tourTest={state,player,jwd,npcs,keys,update,awardAnmeldung,currentMission,visitJwdHome,responderBlocked,staticBlocked,blocked,blockingPedestrian,dynamicBlocker,pedestrianRouteContains,home:buildings.find(b=>b.id==='jwd-home'),buildings,props};function loop(now){`;
const projection=`bounds:inspect(root),screen:(()=>{const mesh=root.children.find(c=>c.userData.neighborPaint&&c.visible)||root,b=new T.Box3().setFromObject(mesh),points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(camera);points.push({x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,z:p.z})}return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y)),camera:camera.position.toArray(),kind:mesh===root?'fallback-group':'paint-plane'}})(),facing:`;
const server=createServer((req,res)=>{try{
 const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
 if(!file.startsWith(root+sep))throw Error('path');let content=readFileSync(file);
 if(file===resolve(root,'game.js'))content=content.toString().replace('function loop(now){',seam);
 if(file===resolve(root,'world3d.js'))content=content.toString().replace('bounds:inspect(root),facing:',projection);
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content);
}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));

function installObserver(){
 const h=window.__tourTest,trace=[],frames=[],events=[];
 let previous=performance.now(),nextSample=0,tag='boot';
 const position=n=>({id:n.id,x:n.x,y:n.y,r:n===h.player?n.r:13,moving:n.jwdMoving||0,gesture:n.jwdGesture||null,route:n.jwdRoute?.map(p=>[p.x,p.y])||[],working:!!n.jwdWorking,complaint:n.complaint||0,phase:n.phase||null});
 h.qa={trace,frames,events,tag(value){tag=value},snapshot(){
  const t=h.jwd.tour,guide=t?.leader||t?.actor,stop=t?.script.stops[t.stop],line=stop?.lines[t?.line],speaker=line?.speaker==='child'?h.jwd.child:t?.actor,hint=document.getElementById('interact-hint'),hintStyle=hint&&getComputedStyle(hint),next=h.qa.navigation?.next;
  const describe=n=>n?{id:n.id||null,name:n.name||null,x:n.x,y:n.y,jwdRole:n.jwdRole||null}:null,probe=(x,y)=>({x,y,static:h.blocked(x,y),pedestrian:describe(h.blockingPedestrian(x,y)),dynamic:describe(h.dynamicBlocker(x,y,h.player.x,h.player.y))});
  const motionProbe=next&&!next.error?{x:probe(h.player.x+Math.sign(next.x-h.player.x),h.player.y),y:probe(h.player.x,h.player.y+Math.sign(next.y-h.player.y))}:null;
  return {tag,now:performance.now(),player:position(h.player),held:Object.keys(h.keys).filter(k=>h.keys[k]),navigation:h.qa.navigation,motionProbe,nearbyBodies:h.npcs.filter(n=>Math.hypot(n.x-h.player.x,n.y-h.player.y)<160).map(describe),hint:hint&&!hint.hidden&&hintStyle.display!=='none'&&hintStyle.visibility!=='hidden'?hint.textContent:null,met:[...h.jwd.met],mission:h.currentMission().target,dialogue:!!h.state.dialogue,roaming:!!h.state.dialogueData?.roaming,modal:!!h.state.modal,paused:!!GermanyHUD.paused,speaker:h.state.characterSpeaker?.id,line:h.state.dialogueData?.lines[h.state.dialogueData.i]||'',tour:t?{id:t.id,script:t.script.id,stop:t.stop,stopId:stop?.id,line:t.line,phase:t.phase,waiting:!!t.waiting,pathBlocked:!!t.pathBlocked,waitingForGuide:!!t.waitingForGuide,leader:guide?.id,point:stop?.point,guide:guide?position(guide):null,speaker:speaker?position(speaker):null}:null,actors:h.npcs.filter(n=>n.jwdRole).map(position),child:h.jwd.child?position(h.jwd.child):null};
 }};
 // Read-only paving graph, with a narrow grass-edge detour for the player when
 // a resident fills a path. NPC movement remains entirely production-owned.
 const grid=[],step=10,minX=610,minY=4450,maxX=1610,maxY=4790,r=h.player.r;
 for(let y=minY;y<=maxY;y+=step)for(let x=minX;x<=maxX;x+=step){
  const paved=JwdGardens.paths.some(b=>x>=b.x+r&&x<=b.x+b.w-r&&y>=b.y+r&&y<=b.y+b.h-r),near=JwdGardens.paths.some(b=>x>=b.x+r-30&&x<=b.x+b.w-r+30&&y>=b.y+r-30&&y<=b.y+b.h-r+30);
  if(!near||h.staticBlocked(x,y,r))continue;
  grid.push({x,y,paved,key:x+','+y});
 }
 const map=new Map(grid.map(n=>[n.key,n]));
 h.qa.yieldTarget=()=>{
  const t=h.jwd.tour,guide=t?.leader||t?.actor;if(!guide)return null;
  const actors=h.npcs,group=actors.filter(n=>n===guide||Math.hypot(n.x-guide.x,n.y-guide.y)<105),aim=guide.jwdRoute?.[0],back=guide.x-(Math.sign((aim?.x??guide.x)-guide.x)||1)*35;
  // Reserve the whole local group and the guide's short backtracking corridor,
  // rather than accepting the already-satisfied close-follow radius.
  const box={left:Math.min(back,...group.map(n=>n.x))-45,right:Math.max(back,...group.map(n=>n.x))+45,top:Math.min(guide.y,JwdGardens.crossY-30,...group.map(n=>n.y))-35,bottom:Math.max(guide.y,JwdGardens.crossY+24,...group.map(n=>n.y))+35};
  const candidates=grid.filter(p=>p.paved&&Math.hypot(p.x-guide.x,p.y-guide.y)>=80&&Math.hypot(p.x-guide.x,p.y-guide.y)<=165&&(p.x<box.left||p.x>box.right||p.y<box.top||p.y>box.bottom)&&actors.every(n=>Math.hypot(p.x-n.x,p.y-n.y)>=60)&&!h.responderBlocked(p.x,p.y,r,h.player,null,null));
  candidates.sort((a,b)=>Math.hypot(a.x-h.player.x,a.y-h.player.y)-Math.hypot(b.x-h.player.x,b.y-h.player.y));
  const target=candidates[0];return target?{x:target.x,y:target.y,group:group.map(n=>n.id),reserved:box}:null;
 };
 h.qa.plan=(target,range=65)=>{
  const p=h.player,paved=n=>JwdGardens.paths.some(b=>n.x>=b.x+r&&n.x<=b.x+b.w-r&&n.y>=b.y+r&&n.y<=b.y+b.h-r),recovering=!paved(p),cache=new Map(),rejectedGeneric=new Map();
  const recordGeneric=(x,y)=>{for(const n of h.npcs)if(!n.jwdRole&&Math.hypot(n.x-x,n.y-y)<r+13.1&&Math.hypot(n.x-p.x,n.y-p.y)<160)rejectedGeneric.set(n.id||n.name,{id:n.id||null,name:n.name||null,x:n.x,y:n.y})};
  const dynamic=n=>{if(!cache.has(n.key)){const blocked=h.responderBlocked(n.x,n.y,r,p,null,null);cache.set(n.key,blocked);if(blocked)recordGeneric(n.x,n.y)}return cache.get(n.key)};
  let edgeRoute=recovering;const lineClear=(a,b)=>{
   const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);
   let px=a.x,py=a.y;
   for(let i=1;i<=steps;i++){const x=a.x+(b.x-a.x)*i/steps,y=a.y+(b.y-a.y)*i/steps;
    if(!edgeRoute&&!paved({x,y}))return false;
    if(h.responderBlocked(x,y,r,p,px,py)){recordGeneric(x,y);return false}px=x;py=y;
   }return true;
  };
  const acceptable=n=>Math.hypot(n.x-target.x,n.y-target.y)<=range&&(!target.direction||(n.x-target.x)*target.direction.x+(n.y-target.y)*target.direction.y<=-30)&&(!target.keepClear||target.keepClear.every(p=>Math.hypot(n.x-p[0],n.y-p[1])>=35));
  if(acceptable(p))return null;
  // A stationary resident may occupy every nearby paved grid cell even though
  // the continuous player position is legal. Admit a clear grass-edge start
  // before declaring navigation unavailable, just as the later route search does.
  let start;
  for(const allowEdge of [recovering,true]){
   edgeRoute=allowEdge;start=grid.filter(n=>(n.paved||allowEdge)&&!dynamic(n)&&Math.hypot(n.x-p.x,n.y-p.y)<(allowEdge?200:24)&&lineClear(p,n)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
   if(start)break;
  }
  if(!start)return {error:'No paved start',player:[p.x,p.y],target,rejectedGeneric:[...rejectedGeneric.values()]};
  let queue,parents,goal=null;
  for(let attempt=0;attempt<2&&!goal;attempt++){
   edgeRoute=recovering||!start.paved||attempt===1;queue=[start];parents=new Map([[start.key,null]]);
   for(let i=0;i<queue.length;i++){
    const n=queue[i];if(acceptable(n)){goal=n;break}
    for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const next=map.get((n.x+dx)+','+(n.y+dy));if(!next||!edgeRoute&&!next.paved||parents.has(next.key)||dynamic(next))continue;parents.set(next.key,n);queue.push(next)}
   }
  }
  if(!goal&&target.direction){
   // A person can temporarily fill the narrow spine. Step to the available
   // passing edge and let production avoidance choose its legal side.
   const lateral=n=>Math.abs((n.x-target.x)*target.direction.y-(n.y-target.y)*target.direction.x);
   goal=queue.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<65&&Math.hypot(n.x-target.x,n.y-target.y)<150).sort((a,b)=>(lateral(b)-Math.hypot(b.x-p.x,b.y-p.y)*.1)-(lateral(a)-Math.hypot(a.x-p.x,a.y-p.y)*.1))[0];
  }
  if(!goal)return {error:'No paved route',player:[p.x,p.y],target,rejectedGeneric:[...rejectedGeneric.values()]};
  const route=[];for(let n=goal;n;n=parents.get(n.key))route.unshift(n);
  let next=route[0];for(const n of route){if(Math.hypot(n.x-p.x,n.y-p.y)>55||!lineClear(p,n))break;next=n}
  return {x:next.x,y:next.y,remaining:route.length,edgeRoute,rejectedGeneric:[...rejectedGeneric.values()]};
 };
 const frame=now=>{
  if(h.state.started&&!GermanyHUD.paused)frames.push(now-previous);previous=now;
  if(now>=nextSample&&h.state.started){nextSample=now+150;const s=h.qa.snapshot();
   const assets=Germany3D.inspectAssets();s.render={...assets.render};s.memory={...assets.memory};s.paints=assets.jwd.actors.map(a=>({id:a.id,paint:a.paint,screen:a.screen,bounds:a.bounds,swing:a.swing}));
   s.minimumBodyGap=Infinity;const bodies=[s.player,...s.actors];for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++)s.minimumBodyGap=Math.min(s.minimumBodyGap,Math.hypot(bodies[i].x-bodies[j].x,bodies[i].y-bodies[j].y)-bodies[i].r-bodies[j].r);
   trace.push(s);
  }requestAnimationFrame(frame);
 };requestAnimationFrame(frame);
}

try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 const profiles=[['desktop',{width:1280,height:800}],['android-portrait',{width:390,height:844}],['android-landscape',{width:844,height:390}]];
 for(const [name,viewport]of profiles){
  if(process.env.JWD_PROFILE&&name!==process.env.JWD_PROFILE)continue;
  const result={name,viewport,entry,entryMode:report.entryMode,checks:[],yieldActions:[],ambientDialogueRetries:[],genericBodyAvoidance:[],screenshots:[],errors:[],consoleErrors:[],requestFailures:[],warnings:[],complete:false};report.cases.push(result);save();console.log(name+': start');
  const mobile=name!=='desktop',context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});context.setDefaultTimeout(45000);
  if(process.env.JWD_PAINT_FAILURE==='1'){await context.route('**/assets/characters/neighbors/*.webp*',route=>route.abort());result.paintFailureInjected=true;}
  await context.addInitScript(trackDirectEntry=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
   if(trackDirectEntry){
    const trace=window.__jwdEntryTrace=[];let previous='';
    const observe=()=>{
     const h=window.__tourTest,preload=document.getElementById('preload'),neighbors=window.Germany3D?.neighborAssetStatus;
     const snapshot={preloading:document.body?.classList.contains('preloading')||false,preloadHidden:preload?preload.hidden:null,started:h?.state.started??null,allocated:h?.jwd.allocated??null,visited:h?.jwd.visited??null,met:h?.jwd.met.size??null,neighborTotal:neighbors?.total??null,neighborSettled:neighbors?.settled??null};
     const signature=JSON.stringify(snapshot);if(signature!==previous){previous=signature;trace.push({time:performance.now(),...snapshot})}
     if(!snapshot.started||snapshot.preloading||!snapshot.preloadHidden)requestAnimationFrame(observe);
    };requestAnimationFrame(observe);
   }
  },directEntry);
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')result.warnings.push(m.text());if(m.type()==='error'){result.consoleErrors.push(m.text());console.log(name+' console: '+m.text())}});page.on('requestfailed',request=>result.requestFailures.push({url:request.url(),error:request.failure()?.errorText}));
  const held=new Set(),touch=mobile?await context.newCDPSession(page):null,directions={a:'ArrowLeft',w:'ArrowUp',s:'ArrowDown',d:'ArrowRight'};
  const setKeys=async list=>{
   const next=new Set(list);if(mobile){
    if(next.size===held.size&&[...next].every(k=>held.has(k)))return;
    if(held.size)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});held.clear();
    if(next.size){const points=[];for(const key of next){const box=await page.locator(`.control-dock [data-key="${directions[key]}"]`).boundingBox();assert.ok(box,'directional touch control is visible');points.push({x:box.x+box.width/2,y:box.y+box.height/2,id:Object.keys(directions).indexOf(key)+1,radiusX:2,radiusY:2,force:1});held.add(key)}await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});}
   }else{for(const key of held)if(!next.has(key)){await page.keyboard.up(key);held.delete(key)}for(const key of next)if(!held.has(key)){await page.keyboard.down(key);held.add(key)}}
  };
  const snap=()=>page.evaluate(()=>({...__tourTest.qa.snapshot(),paints:__tourTest.qa.trace.at(-1)?.paints}));
  const shot=async label=>{
   await setKeys([]);const path=resolve(out,`${name}-${label}.png`);
   const layout=await page.evaluate(()=>{
    const h=__tourTest,t=h.jwd.tour,id=h.state.dialogue?h.state.characterSpeaker?.id:(t?.leader||t?.actor)?.id;
    const actor=Germany3D.inspectAssets().jwd.actors.find(n=>n.id===id),sprite=actor?.screen;if(!sprite)return null;
    const area=(sprite.right-sprite.left)*(sprite.bottom-sprite.top),overlays=[];
    for(const selector of ['#interact-hint','#dialogue','.control-dock','.english-subtitle']){
     const el=document.querySelector(selector);if(!el||el.hidden||!el.getClientRects().length)continue;
     const style=getComputedStyle(el);if(style.visibility==='hidden'||style.opacity==='0'||style.display==='none')continue;
     const r=el.getBoundingClientRect(),overlap=Math.max(0,Math.min(sprite.right,r.right)-Math.max(sprite.left,r.left))*Math.max(0,Math.min(sprite.bottom,r.bottom)-Math.max(sprite.top,r.top));
     overlays.push({selector,left:r.left,right:r.right,top:r.top,bottom:r.bottom,overlapPixels:overlap,spritePlaneFraction:area?overlap/area:0});
    }
    return {id,sprite,overlays,mode:'Projected mesh rectangle including transparent padding; measured immediately before screenshot'};
   });
   await page.screenshot({path});result.screenshots.push(path);if(layout)(result.sceneReadability??=[]).push({label,path,...layout});
  };
  const interact=async()=>{await setKeys([]);if(mobile)await page.locator('.control-dock [data-key="KeyE"]').tap();else await page.keyboard.press('e')};
  const finishDialogue=async()=>{for(let i=0;i<12&&(await snap()).dialogue;i++){await interact();await page.waitForTimeout(100)}};
  const stepToward=async(target,range=65)=>{
   const p=await page.evaluate(([target,range])=>{const h=__tourTest,next=h.qa.plan(target,range);h.qa.navigation={target,range,next};return {player:h.qa.snapshot().player,next}},[target,range]);
   for(const body of p.next?.rejectedGeneric||[])if(!result.genericBodyAvoidance.some(n=>n.id===body.id&&n.name===body.name))result.genericBodyAvoidance.push({...body,player:{x:p.player.x,y:p.player.y},next:p.next.error?null:{x:p.next.x,y:p.next.y},mode:'production collision query rejected occupied planning cells or segments; actual controls follow the selected clear route'});
   if(!p.next){await setKeys([]);return true}
   if(p.next.error){result.navigationWaits??={};result.navigationWaits[p.next.error]=(result.navigationWaits[p.next.error]||0)+1;await setKeys([]);await page.waitForTimeout(150);return false}
   if(p.next.edgeRoute)result.grassEdgePlanningSteps=(result.grassEdgePlanningSteps||0)+1;
   const dx=p.next.x-p.player.x,dy=p.next.y-p.player.y,keys=[];if(Math.abs(dx)>.5)keys.push(dx>0?'d':'a');if(Math.abs(dy)>.5)keys.push(dy>0?'s':'w');await setKeys(keys);const component=Math.min(...[Math.abs(dx),Math.abs(dy)].filter(d=>d>.5));await page.waitForTimeout(Math.min(85,Math.max(18,component/146*1000-10)));await setKeys([]);return false;
  };
  const approach=async id=>{const started=Date.now();while(Date.now()-started<35000){const s=await snap(),n=s.actors.find(n=>n.id===id);assert.ok(n,id+' exists');if(s.dialogue){await finishDialogue();continue}if(s.tour)return;if(await stepToward(n,68))return}throw Error('Approach timed out: '+id)};
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}${entry}`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__tourTest&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden);
   if(directEntry){
    await page.waitForFunction(()=>__tourTest.state.started&&window.__jwdEntryTrace?.at(-1)?.started);
    result.entryInitialState=await page.evaluate(()=>{const h=__tourTest;return {started:h.state.started,allocated:h.jwd.allocated,visited:h.jwd.visited,met:[...h.jwd.met],modal:h.state.modal,mission:h.currentMission().target,missionIndex:h.state.mission,forms:h.state.forms,germanness:h.state.germanness,player:{x:h.player.x,y:h.player.y},bodyBlocked:h.responderBlocked(h.player.x,h.player.y,h.player.r,h.player,null,null),preloading:document.body.classList.contains('preloading'),preloadHidden:document.getElementById('preload').hidden,introHidden:document.getElementById('intro').classList.contains('hidden')}});
    const initial=result.entryInitialState;assert.equal(initial.started,true);assert.equal(initial.allocated,true);assert.equal(initial.visited,true);assert.deepEqual(initial.met,[]);assert.equal(initial.modal,false);assert.equal(initial.mission,'jwd-neighbors');assert.equal(initial.bodyBlocked,false);assert.equal(initial.preloading,false);assert.equal(initial.preloadHidden,true);assert.equal(initial.introHidden,true);
    const trace=await page.evaluate(()=>window.__jwdEntryTrace),loading=trace.findIndex(s=>s.preloading&&s.started===false),started=trace.findIndex(s=>s.started===true);
    assert.ok(loading>=0&&started>loading,'public entry waits through the natural preload before starting');assert.ok(trace.every(s=>!s.started||!s.preloading&&s.preloadHidden),'startup never begins under the loading overlay');assert.equal(trace[started].neighborTotal,3);assert.equal(trace[started].neighborSettled,3);
    await page.evaluate(()=>{__tourTest.state.pettyAuditTimer=10000;__tourTest.state.voiceOn=true});
   }else await page.evaluate(()=>{const h=__tourTest;h.state.started=true;h.state.modal=false;h.state.mission=1;h.state.pettyAuditTimer=10000;h.state.voiceOn=true;h.awardAnmeldung();document.getElementById('intro').classList.add('hidden');document.body.classList.remove('preloading');Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+35});Germany3D.sync()});
   await page.evaluate(installObserver);
   if(directEntry){result.checks.push({name:'public neighborhood direct entry',verdict:'PASS',mode:'natural URL startup and preload; no registration, mission, position, allocation, visit, or completion seed'});await shot('public-direct-entry-ready')}
   else{await interact();assert.ok(await page.evaluate(()=>__tourTest.jwd.visited),'home is entered with actual interaction');await finishDialogue();result.checks.push({name:'initial home visit',verdict:'PASS',mode:'seeded registration/home position; real E/touch'})}
   // A cancellation attempt has no introduction credit. Actor motion is production.
   await approach('jwd-swabian');if(!(await snap()).tour){
    if(!mobile){await page.keyboard.down('d');await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__tourTest.keys.KeyD),false,'starting the tour clears held movement');await page.keyboard.up('d');result.checks.push({name:'tour dialogue releases held movement',verdict:'PASS',mode:'actual held D and E keys'});}
    else await interact();
   }await finishDialogue();
   const cancelBefore=await snap();assert.ok(cancelBefore.tour,'cancellation tour started');
   await page.evaluate(()=>{const h=__tourTest;h.qa.tag('forced-cancellation-distance');h.qa.cancelPosition={x:h.player.x,y:h.player.y};h.player.x=h.jwd.tour.actor.x+900;h.player.y=h.jwd.tour.actor.y;});
   await page.waitForFunction(()=>!__tourTest.jwd.tour);assert.deepEqual((await snap()).met,[],'cancellation must not count as meeting');
   await page.evaluate(()=>{const h=__tourTest;Object.assign(h.player,h.qa.cancelPosition);h.qa.tag('input-driven-tours')});
   result.checks.push({name:'cancelled tour earns no completion',verdict:'PASS',mode:'forced distance only'});
   let pauseChecked=false,dialogueReleaseChecked=false,lagChecked=false,lagAttemptStop='',childSeen=false,childLead=false;
   const screenshots=new Set();
   const completeTour=async(id,repeat=false)=>{
    let initial;const starting=Date.now();
    while(Date.now()-starting<45000){
     await approach(id);
     if(!result.paintFailureInjected)await page.waitForFunction(id=>Germany3D.inspectAssets().jwd.actors.find(a=>a.id===id)?.paint?.loaded,id,{timeout:20000,polling:250});
     if(!(await snap()).tour)await interact();initial=await snap();if(initial.tour)break;
     // An ambient encounter may open between the approach sample and E. That
     // E legitimately advances its dialogue; finish it and approach again.
     if(initial.dialogue){result.ambientDialogueRetries.push({target:id,at:initial.now,line:initial.line,met:initial.met,mode:'actual E/touch dialogue completion, then normal approach retry'});await finishDialogue()}
     else await page.waitForTimeout(100);
    }
    assert.ok(initial?.tour,'tour started by E after bounded ambient-dialogue handling');const expectedScript=initial.tour.script,priorMet=initial.met.length,priorComplaint=initial.actors.find(n=>n.id===id).complaint,expectedStops=await page.evaluate(()=>__tourTest.jwd.tour.script.stops.map(stop=>stop.id));
    await finishDialogue();let started=Date.now(),lastProgress=Date.now(),lastMarker='',lastPos=null,yieldAction=null;const stops=new Set(),lines=new Set();
    while(Date.now()-started<180000){
     const s=await snap();if(!s.tour){assert.ok(s.met.includes(id),'completion grants introduction');assert.deepEqual([...stops],expectedStops,'every authored stop was reached');if(!repeat)assert.equal(s.met.length,priorMet+1);else{assert.equal(s.met.length,priorMet);assert.equal(s.actors.find(n=>n.id===id).complaint,priorComplaint+1,'repeat completion advances the story cycle')}result.checks.push({name:expectedScript,verdict:'PASS',stops:[...stops],lines:[...lines],elapsedMs:Date.now()-started,mode:'real movement and E/touch'});console.log(name+': '+expectedScript+' PASS');return expectedScript}
     assert.equal(s.tour.script,expectedScript,'tour identity retained');stops.add(s.tour.stopId);if(s.line)lines.add(s.line);
     if(yieldAction&&s.tour.phase!=='walk'){yieldAction.arrived={x:s.player.x,y:s.player.y};yieldAction.finished=s.now;yieldAction.endReason='guide advanced to '+s.tour.phase;yieldAction=null}
     const marker=[s.tour.stop,s.tour.phase,s.tour.line].join(':');if(marker!==lastMarker||!lastPos||Math.hypot(s.tour.guide.x-lastPos.x,s.tour.guide.y-lastPos.y)>4){lastProgress=Date.now();lastMarker=marker;lastPos=s.tour.guide}
     if(Date.now()-lastProgress>15000)throw Error('Tour stuck: '+JSON.stringify(s));
     if(s.child&&!childSeen){childSeen=true;await shot('theodore-emerges')}
     if(s.tour.leader==='jwd-theodore')childLead=true;
     if(s.tour.phase==='walk'){
      const paint=s.paints?.find(p=>p.id===s.tour.leader)?.paint,key=s.tour.leader+'-walk-row-'+paint?.row;
      if(paint?.state==='walk'&&!screenshots.has(key)){screenshots.add(key);await shot(key)}
     }
     if(s.dialogue){await setKeys([]);const key=s.tour.stopId+'-'+s.speaker;if(!screenshots.has(key)){screenshots.add(key);await page.waitForTimeout(320);await shot(key)}await interact();await page.waitForTimeout(120);continue}
     if(s.tour.phase==='walk'&&(s.tour.pathBlocked||yieldAction)){
      if(!yieldAction){
       const target=await page.evaluate(()=>__tourTest.qa.yieldTarget());
       if(target){yieldAction={stop:s.tour.stopId,hint:s.hint,from:{x:s.player.x,y:s.player.y},target,guideBefore:{x:s.tour.guide.x,y:s.tour.guide.y},mode:mobile?'actual directional touch':'actual keyboard movement',started:s.now};result.yieldActions.push(yieldAction);console.log(name+': yielding room for '+s.tour.leader)}
      }
      if(yieldAction){
       if(await stepToward(yieldAction.target,10)){await setKeys([]);await page.waitForTimeout(550);const after=await snap();yieldAction.arrived={x:after.player.x,y:after.player.y};yieldAction.finished=after.now;yieldAction.guideAfter=after.tour?.guide?{x:after.tour.guide.x,y:after.tour.guide.y}:null;yieldAction=null}
       continue;
      }
     }
     if(s.tour.phase==='ready'){
      const target=s.tour.speaker||s.tour.guide;if(Math.hypot(s.player.x-target.x,s.player.y-target.y)>90){await stepToward(target,75);continue}
      if(!dialogueReleaseChecked){
       const right=mobile?await page.locator('.control-dock [data-key="ArrowRight"]').boundingBox():null,action=mobile?await page.locator('.control-dock [data-key="KeyE"]').boundingBox():null;
       await setKeys(['d']);assert.equal(await page.evaluate(mobile=>__tourTest.keys[mobile?'ArrowRight':'KeyD'],mobile),true);
       if(mobile){
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right.x+right.width/2,y:right.y+right.height/2,id:4},{x:action.x+action.width/2,y:action.y+action.height/2,id:5}]});
       }else await page.keyboard.press('e');
       assert.equal(await page.evaluate(mobile=>__tourTest.keys[mobile?'ArrowRight':'KeyD'],mobile),false,'tour dialogue clears held movement');assert.ok((await snap()).dialogue,'actual interaction opened stop dialogue');
       await setKeys([]);dialogueReleaseChecked=true;result.checks.push({name:'tour dialogue releases held movement',verdict:'PASS',mode:mobile?'actual held directional touch plus second-finger E touch':'actual held D and E keys'});await page.waitForTimeout(100);continue;
      }
      await interact();await page.waitForTimeout(100);continue;
     }
     if(s.tour.phase==='child-arrive'){await stepToward({x:1400,y:4570},10);continue}
     if(s.tour.phase==='walk'&&!pauseChecked){
      await setKeys([]);
      if(mobile)await page.locator('#file-toggle').tap();else{await page.keyboard.down('d');await page.keyboard.press('m');assert.equal(await page.evaluate(()=>__tourTest.keys.KeyD),false,'pause clears a held movement key');}
      await page.waitForFunction(()=>GermanyHUD.paused);await page.waitForTimeout(100);const before=await snap(),beforePaint=await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors.map(n=>[n.id,n.paint?.row,n.paint?.frame]));await page.waitForTimeout(500);const after=await snap(),afterPaint=await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors.map(n=>[n.id,n.paint?.row,n.paint?.frame]));assert.deepEqual(after.actors.map(n=>[n.id,n.x,n.y]),before.actors.map(n=>[n.id,n.x,n.y]));assert.deepEqual(afterPaint,beforePaint);
      if(mobile)await page.locator('#file-close').tap();else{await page.keyboard.up('d');await page.keyboard.press('m');}
      await page.waitForFunction(()=>!GermanyHUD.paused);assert.ok(await page.evaluate(()=>Object.values(__tourTest.keys).every(value=>!value)));pauseChecked=true;result.checks.push({name:'pause and resume',verdict:'PASS',mode:mobile?'actual file-button touch':'actual held D and M keys'});continue;
     }
     // Leaving the follower stationary proves a guide waits, when a segment is long enough.
     if(s.tour.phase==='walk'&&!lagChecked&&s.tour.stop>0&&s.tour.stopId!==lagAttemptStop){
      lagAttemptStop=s.tour.stopId;
      await setKeys([]);let waitStart=Date.now(),waiting=null;
      while(Date.now()-waitStart<5000){await page.waitForTimeout(100);const check=await snap();if(check.tour?.waiting){waiting=check;break}if(check.tour?.phase!=='walk')break}
      if(waiting){await page.waitForTimeout(350);const still=await snap();assert.ok(Math.hypot(still.tour.guide.x-waiting.tour.guide.x,still.tour.guide.y-waiting.tour.guide.y)<.01);await shot('guide-waits-for-player');lagChecked=true;result.checks.push({name:'guide waits for lagging player',verdict:'PASS',gap:Math.hypot(waiting.player.x-waiting.tour.guide.x,waiting.player.y-waiting.tour.guide.y),mode:'stationary player, production guide movement'});}
      continue;
     }
     const guide=s.tour.guide,aim=guide.route?.[0],dx=aim?aim[0]-guide.x:0,dy=aim?aim[1]-guide.y:0,length=Math.hypot(dx,dy),parent=s.actors.find(n=>n.id==='jwd-parent'),reserved=guide.id==='jwd-theodore'&&!guide.route.length&&parent?.route.length?[parent.route.at(-1)]:null;
     // Near the final stop, step beyond or beside the destination instead of
     // insisting on overtaking through a narrow occupied car/garden branch.
     const finalApproach=guide.route.length===1&&length<55;
     await stepToward(finalApproach?{...guide,keepClear:[aim]}:length>2?{...guide,direction:{x:dx/length,y:dy/length}}:reserved?{...guide,keepClear:reserved}:guide,67);
    }
    throw Error('Tour timeout: '+expectedScript);
   };
   for(const id of ['jwd-swabian','jwd-parent','jwd-watcher'])await completeTour(id);
   assert.equal((await snap()).mission,'hausverwaltung');assert.ok(childSeen&&childLead,'Theodore emerges and leads');assert.ok(pauseChecked&&lagChecked&&dialogueReleaseChecked,'pause, held-input, and lag checks ran');
   result.checks.push({name:'three introductions unlock next mission',verdict:'PASS'});
   result.checks.push({name:'Theodore emergence and leadership',verdict:'PASS'});
   await page.waitForFunction(()=>!__tourTest.jwd.child,null,{timeout:15000});
   result.checks.push({name:'Theodore returns home',verdict:'PASS',mode:'production return walk and despawn; no actor placement or cleanup forced'});
   if(!result.paintFailureInjected&&process.env.JWD_SKIP_REPEATS!=='1'){const repeatScripts=[];for(const id of ['jwd-swabian','jwd-parent','jwd-watcher'])repeatScripts.push(await completeTour(id,true));assert.ok(repeatScripts.every(id=>!id.includes('introduction')));result.checks.push({name:'repeat interaction variety',verdict:'PASS',scripts:repeatScripts});}
   else result.checks.push({name:'repeat interaction variety',verdict:'NOT RUN',reason:result.paintFailureInjected?'paint-failure case covers the three introductions':'JWD_SKIP_REPEATS=1; targeted rerun of the three introductions'});
   if(mobile){
    const input=await context.newCDPSession(page),button=await page.locator('.control-dock [data-key="ArrowRight"]').boundingBox();
    await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:button.x+button.width/2,y:button.y+button.height/2,id:1}]});
    await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__tourTest.keys.ArrowRight),true);
    await input.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>__tourTest.keys.ArrowRight),false);await input.detach();result.checks.push({name:'touch cancellation releases movement',verdict:'PASS',mode:'CDP touchStart/touchCancel'});
   }
   if(result.paintFailureInjected){const actors=await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors);assert.ok(actors.every(a=>!a.paint?.loaded));assert.ok(actors.every(a=>a.bounds.height>0));result.checks.push({name:'paint failure keeps rendered fallback and complete tours',verdict:'PASS'});}
   await shot('three-neighbors-complete');assert.deepEqual(result.errors,[]);
   assert.deepEqual(result.consoleErrors.filter(message=>!(result.paintFailureInjected&&message==='Failed to load resource: net::ERR_FAILED')),[],'no unexpected console errors');
   assert.deepEqual(result.requestFailures.filter(request=>request.error==='net::ERR_FAILED'&&!(result.paintFailureInjected&&/\/assets\/characters\/neighbors\/[^/]+\.webp(?:\?|$)/.test(request.url))),[],'failed requests are the deliberately blocked neighbor paints');
   result.complete=true;
  }catch(error){result.failure=error.stack;console.error(name+': '+error.message);try{await shot('failure');result.failureState=await snap()}catch{};if(process.env.JWD_FAIL_FAST!=='0')throw error}
  finally{
   await setKeys([]).catch(()=>{});
   if(directEntry)result.entryTrace=await page.evaluate(()=>window.__jwdEntryTrace||[]).catch(()=>[]);
   const evidence=await page.evaluate(()=>({trace:__tourTest?.qa?.trace||[],frames:__tourTest?.qa?.frames||[]})).catch(()=>({trace:[],frames:[]}));
   writeFileSync(resolve(out,`${name}-trace.json`),JSON.stringify(evidence.trace,null,2));
   const frames=evidence.frames.filter(n=>n>0&&n<10000).sort((a,b)=>a-b),percentile=p=>frames[Math.floor((frames.length-1)*p)]||0;
   result.performance={mode:'Instrumented tour session; frame observer and asset inspection included, not a clean benchmark',samples:frames.length,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),maxMs:frames.at(-1)||0,over50ms:frames.filter(n=>n>50).length};
   result.minimumSampledBodyGap=Math.min(...evidence.trace.map(t=>t.minimumBodyGap));
   result.ambientBurglar={duringTourSamples:evidence.trace.filter(t=>t.tour&&t.actors.some(a=>a.id==='jwd-burglar')).length,inspectDuringTourSamples:evidence.trace.filter(t=>t.tour&&t.actors.some(a=>a.id==='jwd-burglar'&&a.phase==='inspect')).length,inspectAfterTourSamples:evidence.trace.filter(t=>!t.tour&&t.actors.some(a=>a.id==='jwd-burglar'&&a.phase==='inspect')).length};
   result.guideMeshHeights={};for(const row of evidence.trace){const p=row.paints.find(p=>p.id===row.tour?.leader);if(!p||p.screen.right<0||p.screen.left>viewport.width||p.screen.bottom<0||p.screen.top>viewport.height)continue;const entry=result.guideMeshHeights[p.id]??={min:Infinity,max:0,samples:0};const height=p.screen.bottom-p.screen.top;entry.min=Math.min(entry.min,height);entry.max=Math.max(entry.max,height);entry.samples++;}
   result.observedPaintStates={};for(const row of evidence.trace)for(const p of row.paints){const key=p.id+' '+p.paint?.state+' row '+p.paint?.row;result.observedPaintStates[key]??={frames:[],minimumProjectedHeight:Infinity};const entry=result.observedPaintStates[key];if(!entry.frames.includes(p.paint?.frame))entry.frames.push(p.paint?.frame);entry.minimumProjectedHeight=Math.min(entry.minimumProjectedHeight,p.screen.bottom-p.screen.top)}
   save();await touch?.detach().catch(()=>{});await context.close();
  }
 }
}finally{report.finalRevision=revision();report.sourceChangedDuringRun=JSON.stringify(report.revision)!==JSON.stringify(report.finalRevision);report.complete=report.cases.every(c=>c.complete);save();server.closeAllConnections();await browser?.close();await new Promise(done=>server.close(done))}
