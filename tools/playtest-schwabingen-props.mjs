import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.PROPS_OUTPUT||'output/schwabingen-props/browser');mkdirSync(out,{recursive:true});
const report={sources:Object.fromEntries(['game.js','neighbor-sprites.js','schwabingen-props.js','world3d.js','index.html','tools/playtest-schwabingen-props.mjs'].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),cases:[],limits:['Silent headless Chromium, Android emulation; no physical-device or listening evidence.','Fixture uses actual Three.js and production sprite/prop renderer with controlled media clocks.','World cases seed an arrived tour stop and legal listening halo, then invoke the production speech handler; they do not prove the prior mission or walking route.']};
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body style="margin:0"><script type="module">
import * as T from '/assets/vendor/three/0.186.0/build/three.module.min.js';
import {createNeighborSprite} from '/neighbor-sprites.js';
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xd6d9d3);scene.add(new T.HemisphereLight(0xffffff,0x726b59,3));const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(1.5,2.6,6.5);camera.lookAt(.7,.9,0);
const host=new T.Group();scene.add(host);const actor={id:'jwd-swabian',jwdRole:'swabian',x:780,y:4708,jwdMoving:0};const pending=[];
const paint=createNeighborSprite(T,actor,host,(_p,_priority,load)=>pending.push(load()),camera);
const floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshStandardMaterial({color:0xa2a593}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;scene.add(floor);
const wall=new T.Mesh(new T.BoxGeometry(5,3,.12),new T.MeshBasicMaterial({color:0xc64682}));wall.position.set(0,1.5,1);wall.visible=false;scene.add(wall);
let now=0,dialogue=null;const hud={started:true,busy:false,paused:false};
window.step=({cue='schwabingen-weeds-law',time=2,token=1,paused=false,reduced=false,caption=false,occluded=false}={})=>{
 now+=.016;hud.paused=paused;dialogue=cue?{id:actor.id,active:true,cueId:cue,cueToken:token,mediaTime:time,mediaDuration:12,captionTime:caption?time:0,speaking:!caption,paused,mouthOpen:.7,cueTarget:{x:910,y:4700,height:.76}}:null;
 paint.sync(now,hud,dialogue,reduced);wall.visible=occluded;renderer.render(scene,camera);return{paint:paint.inspect(),memory:{...renderer.info.memory},calls:renderer.info.render.calls};
};
window.finish=()=>{paint.dispose();wall.visible=false;renderer.render(scene,camera);return{...renderer.info.memory}};
wall.visible=true;renderer.render(scene,camera);wall.visible=false;window.baselineMemory={...renderer.info.memory};await Promise.all(pending);step({cue:null});window.ready=true;
</script></body></html>`;
const seam='window.__propsTest={state,jwd,npcs,player,speakJwdTourLine,getNeighborStandingSpot,cancelJwdTour,stopSpeech,updateJwdTour,nextDialogue};function loop(now){';
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{try{
 const url=new URL(req.url,'http://localhost');if(url.pathname==='/props-fixture'){res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);return}
 const f=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!f.startsWith(root+sep))throw Error('path');let content=readFileSync(f);
 if(f===resolve(root,'game.js')){assert.ok(content.includes('function loop(now){'));content=content.toString().replace('function loop(now){',seam)}
 res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'});res.end(content);
}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const base='http://127.0.0.1:'+server.address().port;
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
let browser,activePage;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
 for(const [name,width,height,mobile,reduced,failure] of [['desktop',1280,800,false,false,false],['portrait',390,844,true,false,false],['landscape',844,390,true,false,false],['reduced',1280,800,false,true,false],['missing-art',390,844,true,false,true]]){
  if(process.env.PROPS_PROFILE&&process.env.PROPS_PROFILE!==name)continue;
  const result={name,errors:[],shots:[],checks:[]};report.cases.push(result);save();
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
  context.setDefaultTimeout(45000);
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
  });
  if(failure)await context.route('**/assets/characters/neighbors/*',route=>route.abort());
  const page=activePage=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  result.requestsFailed=[];page.on('requestfailed',r=>result.requestsFailed.push({url:r.url(),error:r.failure()?.errorText}));
  await page.goto(base+'/props-fixture');await page.waitForFunction(()=>window.ready);
  const shot=async label=>{const f=name+'-'+label+'.png';await page.screenshot({path:resolve(out,f)});result.shots.push(f)};
  const step=args=>page.evaluate(args=>step(args),{reduced,...args});
  result.fixtureBaseline=await page.evaluate(()=>baselineMemory);const initial=await step({cue:null});assert.equal(initial.paint.props.visible,false);assert.equal(initial.paint.props.meshes,0);
  for(const [cue,kind] of [['schwabingen-broom-welcome','cleaner'],['schwabingen-weeds-law','bottle'],['schwabingen-weeds-method','scraper'],['schwabingen-broom-rota','rota'],['schwabingen-bird-calendar-note','calendar'],['schwabingen-hedge-release','blackbird'],['schwabingen-attendance-leaf','leaf']]){
   const s=await step({cue});assert.equal(s.paint.props.kind,kind);assert.equal(s.paint.props.visible,true);result.checks.push({cue,paint:s.paint,memory:s.memory,calls:s.calls});await shot(kind);
  }
  const bird=[];for(const time of [0,.35,.7,1.05,1.4,1.75,2.1,4]){bird.push(await step({cue:'schwabingen-hedge-release',time}));if([0,.7,1.4,2.1].includes(time))await shot('flight-'+time)}result.flight=bird;
  const held=await step({cue:'schwabingen-weeds-law',time:2}),paused=await step({cue:'schwabingen-weeds-law',time:9,paused:true});assert.deepEqual(paused.paint.props,held.paint.props);
  const caption=await step({cue:'schwabingen-weeds-method',time:2,caption:true});assert.equal(caption.paint.props.kind,'scraper');
  const replay=await step({cue:'schwabingen-weeds-law',time:0,token:2});assert.equal(replay.paint.props.visible,false);
  const baseline=await step({cue:'schwabingen-weeds-law',time:2});for(let i=0;i<10;i++)await step({cue:'schwabingen-weeds-law',token:i+3});const repeated=await step({cue:'schwabingen-weeds-law'});assert.deepEqual(repeated.memory,baseline.memory);
  await step({cue:'schwabingen-weeds-law',occluded:true});await shot('opaque-wall');
  const cancelled=await step({cue:null});assert.equal(cancelled.paint.props.visible,false);await shot('cancelled');
  result.disposed=await page.evaluate(()=>finish());assert.deepEqual(result.disposed,result.fixtureBaseline);save();console.log(name+': fixture PASS');
  {
   await page.goto(base+'/?level=neighbors');await page.waitForFunction(()=>window.__propsTest&&window.Germany3D?.sync);
   await page.waitForFunction(()=>!document.body.classList.contains('preloading'),null,{timeout:90000});
   for(const cue of ['schwabingen-weeds-law','schwabingen-hedge-release']){
    const accepted=await page.evaluate(({cue,caption})=>{
     const h=__propsTest;h.cancelJwdTour();h.stopSpeech();h.state.dialogue=false;h.state.modal=false;h.state.started=true;h.state.mission=1;h.state.voiceOn=!caption;h.state.pettyAuditTimer=10000;h.jwd.allocated=true;h.jwd.visited=true;
     document.getElementById('intro').classList.add('hidden');document.body.classList.remove('preloading');
     const actor=h.npcs.find(n=>n.jwdRole==='swabian'),scripts=JwdStory.tours.swabian,script=scripts.find(s=>s.stops.some(stop=>stop.lines.some(line=>line.id===cue))),stop=script.stops.findIndex(stop=>stop.lines.some(line=>line.id===cue)),index=script.stops[stop].lines.findIndex(line=>line.id===cue);
     Object.assign(actor,script.stops[stop].point,{jwdWorking:false,jwdMoving:0,jwdTouring:true,jwdRoute:[]});h.jwd.tour={id:++h.jwd.tourSequence,actor,script,stop,line:index,phase:'ready',age:0};
     Object.assign(h.player,{x:actor.x,y:actor.y+70});const spot=h.getNeighborStandingSpot();if(!spot)throw Error('No legal listening halo');Object.assign(h.player,spot);h.speakJwdTourLine(h.jwd.tour);Germany3D.sync();return Germany3DBridge.getNeighborDialogue();
    },{cue,caption:cue==='schwabingen-hedge-release'});
    assert.equal(accepted.cueId,cue);
    await page.waitForFunction(cue=>{const d=Germany3DBridge.getNeighborDialogue(),p=Germany3D.inspectAssets().jwd.actors.find(a=>a.role==='swabian')?.paint?.props;return d?.cueId===cue&&p?.visible&&p.time>(cue==='schwabingen-hedge-release'?2.3:1)},cue,{timeout:45000});
    result.checks.push({worldCue:cue,observed:await page.evaluate(()=>({dialogue:Germany3DBridge.getNeighborDialogue(),actor:Germany3D.inspectAssets().jwd.actors.find(a=>a.role==='swabian')}))});await shot('world-'+cue);
    await page.evaluate(()=>{__propsTest.cancelJwdTour();Germany3D.sync()});assert.equal(await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors.find(a=>a.role==='swabian').paint.props.visible),false);
   }
  }
  {
   await page.evaluate(()=>{
    const h=__propsTest;h.cancelJwdTour();h.stopSpeech();h.state.dialogue=false;h.state.modal=false;h.state.voiceOn=false;
    const actor=h.npcs.find(n=>n.jwdRole==='swabian'),script=JwdStory.tours.swabian[0],stop=script.stops.findIndex(s=>s.id==='schwabingen-hedge');
    Object.assign(actor,script.stops[stop].point,{jwdWorking:false,jwdMoving:0,jwdTouring:true,jwdRoute:[]});
    h.jwd.tour={id:++h.jwd.tourSequence,actor,script,stop,line:0,phase:'ready',age:0};Object.assign(h.player,{x:780,y:4770});Object.assign(h.player,h.getNeighborStandingSpot());h.speakJwdTourLine(h.jwd.tour);
   });
   result.sequence=[];
   const observe=async label=>{const state=await page.evaluate(()=>{const h=__propsTest,n=h.npcs.find(n=>n.jwdRole==='swabian');return{actor:[n.x,n.y],moving:n.jwdMoving,phase:h.jwd.tour?.phase,scene:n.jwdBirdScene?{...n.jwdBirdScene}:null,paint:Germany3D.inspectAssets().jwd.actors.find(a=>a.role==='swabian')?.paint}});result.sequence.push({label,...state});await shot('sequence-'+label);save();return state};
   await observe('arrival');
   await page.waitForFunction(()=>__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene?.age>=2.2);await observe('perched');
   await page.waitForFunction(()=>__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene?.stain===1,null,{timeout:45000});await observe('droppings');
   await page.keyboard.press('KeyM');await page.waitForFunction(()=>GermanyHUD.paused);
   const frozen=await page.evaluate(()=>__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene.age);
   await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene.age),frozen,'case-file pause freezes the bird visit');
   await page.keyboard.press('KeyM');await page.waitForFunction(()=>!GermanyHUD.paused);
   await page.waitForFunction(()=>__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene?.phase==='clean',null,{timeout:45000});
   const cleaning=await observe('mopping');assert.ok(cleaning.actor[0]>848,'real actor walks across the paved strip to the patch');assert.equal(cleaning.paint.props.kind,'mop');assert.notEqual(cleaning.paint.row,11);
   await page.waitForFunction(()=>{const s=__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene;return s?.stain>0&&s.stain<.6});await observe('partly-clean');
   await page.waitForFunction(()=>__propsTest.npcs.find(n=>n.jwdRole==='swabian').jwdBirdScene?.phase==='done');const done=await observe('clean');assert.equal(done.scene.stain,0);
   assert.equal(result.sequence[0].scene.attempt,done.scene.attempt,'one visit across both dialogue lines');
  }
  assert.deepEqual(result.errors,[]);result.complete=true;save();await context.close();console.log(name+': PASS');
 }
 report.complete=true;save();console.log(JSON.stringify({complete:true,cases:report.cases.length,report:resolve(out,'report.json')}));
}catch(error){report.failure=error.stack;if(activePage&&!activePage.isClosed()){report.failureState=await activePage.evaluate(()=>({url:location.href,ready:document.readyState,game:!!window.__propsTest,renderer:!!window.Germany3D,rendererSync:!!window.Germany3D?.sync,preloading:document.body.classList.contains('preloading'),text:document.body.innerText.slice(-1000)}));await activePage.screenshot({path:resolve(out,'failure.png')})}save();throw error}finally{await browser?.close();await new Promise(done=>{server.close(done);server.closeAllConnections()})}
