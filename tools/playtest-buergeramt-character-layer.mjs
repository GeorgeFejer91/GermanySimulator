// Silent forced encounters exercise the real renderer and simulation clocks.
// Android is emulated; these fixtures do not establish the natural mission route.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const out=process.env.PLAYTEST_OUTPUT||'output/character-morph/layers';fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary'};
const baseline=new Map(process.env.PROBE_REF?['world3d.js','buergeramt-painted-anchor.js','buergeramt-gaussian-animation.js','buergeramt-splat.js'].map(f=>[path.resolve(f),execFileSync('git',['show',process.env.PROBE_REF+':'+f])]):[]);
const root=path.resolve('.');
const server=createServer((req,res)=>{try{const file=path.resolve('.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(baseline.get(file)||fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser;
const results=[];
try{
 for(const profile of [{name:'desktop',width:1280,height:800},{name:'android-portrait',width:390,height:844},{name:'android-landscape',width:844,height:390},{name:'reduced-motion',width:1280,height:800},{name:'anchor-failure',width:1280,height:800},{name:'seated-patron',width:1280,height:800,id:'amt-konrad-wohnungszettel'},{name:'clerk',width:1280,height:800,id:'clerk'}].filter(p=>!process.env.PLAYTEST_VIEWPORT||p.name===process.env.PLAYTEST_VIEWPORT)){
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=default']});
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.name.startsWith('android')?2:1,isMobile:profile.name.startsWith('android'),hasTouch:profile.name.startsWith('android'),reducedMotion:profile.name==='reduced-motion'?'reduce':'no-preference'});
 context.setDefaultTimeout(120000);context.setDefaultNavigationTimeout(120000);
 await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){this.muted=true;this.volume=0;return play.apply(this,a)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...a){if(target instanceof AudioDestinationNode){const m=this.context.createGain();m.gain.value=0;connect.call(m,target);target=m}return connect.call(this,target,...a)};
   speechSynthesis.speak=u=>{u.volume=0;window.__speech=u;u.onstart?.()};
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(m.text()))errors.push(m.text())});
 await page.route('**/world3d.js*',async r=>{const response=await r.fetch();let body=baseline.get(path.resolve('world3d.js'))?.toString()||await response.text();body=body.replace(/  function renderAmt\((?:pullCamera=null)?\)\{/,`  window.__officeDepthProbe=()=>{
    const original=window.BuergeramtLevel,view=original.view,level={...original,omen:{...original.omen,phase:'',strength:0,life:{...original.omen.life,isolation:0}},fever:{active:false,strength:0}};
    // Keep centers on the same camera ray as distance changes.
    const point=(side,height,distance)=>new T.Vector3(view.x-Math.sin(view.yaw)*distance+Math.cos(view.yaw)*side,1.68+(height-1.68)*distance/3,view.z-Math.cos(view.yaw)*distance-Math.sin(view.yaw)*side);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const ctx=canvas.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(2,2,12,12);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const paint=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.035,depthWrite:false,fog:false}));paint.layers.set(1);paint.renderOrder=201;paint.position.copy(point(0,2.6,3));paint.rotation.y=-view.yaw;
    const blocker=new T.Mesh(new T.PlaneGeometry(.6,.6),new T.MeshBasicMaterial({color:0x0000ff,fog:false}));blocker.position.copy(point(0,2.6,2));blocker.rotation.y=-view.yaw;
    const near=new T.Mesh(new T.PlaneGeometry(.6,.6),new T.MeshBasicMaterial({color:0x00ff00,transparent:true,depthWrite:false,fog:false}));near.layers.set(1);near.renderOrder=201;near.position.copy(point(0,2.6,2.5));near.rotation.y=-view.yaw;near.visible=false;
    const overlay=omenScene.children[0],material=overlay.material;overlay.material=new T.MeshBasicMaterial({color:0xff00ff,depthTest:false,depthWrite:false});amtScene.add(paint,blocker,near);window.BuergeramtLevel=level;
    const sample=x=>{const p=point(x,2.6,3).project(amtCamera),gl=renderer.getContext(),rgba=new Uint8Array(4);gl.readPixels(Math.round((p.x+1)/2*gl.drawingBufferWidth),Math.round((p.y+1)/2*gl.drawingBufferHeight),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);return [...rgba]};
    try{
      renderAmt();const blocked=sample(0);blocker.visible=false;level.omen.strength=.5;renderAmt();const aboveEffect=sample(0),alphaEdge=sample(.46);
      level.omen.strength=0;near.visible=true;renderAmt();const nearPerson=sample(0);near.position.copy(point(0,2.6,4));renderAmt();const farPerson=sample(0);
      return{blocked,aboveEffect,alphaEdge,nearPerson,farPerson,view};
    }finally{window.BuergeramtLevel=original;amtScene.remove(paint,blocker,near);for(const mesh of [paint,blocker,near]){mesh.geometry.dispose();mesh.material.dispose()}texture.dispose();overlay.material.dispose();overlay.material=material;renderAmt()}
  };
  function renderAmt(pullCamera=null){`);await r.fulfill({response,body});});
 if(profile.name==='anchor-failure'){await page.route('**/animation/*-anchor-*.webp',r=>r.abort());await page.route('**/assets/models/**',r=>r.abort())}
 await page.route('**/buergeramt.js*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace(/const candidate=allowCatalogClip[^;]+;/,'const candidate=null;');body=body.replace('window.BuergeramtLevel={',`window.__endFever=()=>feverClock.done();window.__layerFixture=id=>{options.cinematics=true;omen.phase="";omen.strength=0;const actor=id==='clerk'?{id,x:3.9,z:-9.77}:characters.find(a=>a.id===id)??{...story.patrons[id],id,static:true};window.__layerActor=()=>Germany3D.amtCharacters.find(a=>a.name===id||a.id===id||id==='clerk'&&a.name==='clerk');const side=actor.z>2.8?-1:1;view.x=actor.x;view.z=actor.z+side*2.7;view.yaw=side<0?Math.PI:0;setStage("walk-sign");if(id==='clerk'){setStage('counter');encounterArmed=true;content(story.clerk[0].speaker,story.clerk[0].line)}else showCharacter(actor);};window.BuergeramtLevel={`);await r.fulfill({response,body});});
 await page.route('**/game.js*',async r=>{const response=await r.fetch(),body=(await response.text()).replace('const directConfig={','const directConfig=window.__layerRootConfig={');await r.fulfill({response,body})});
 await page.goto(base+'/index.html?geheim=buergeramt',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.Germany3D?.ready&&Germany3D.officeAssetsReady&&Germany3D.amtCharacters.every(a=>a.loaded),null,{timeout:90000});
 await page.evaluate(async id=>{
   BuergeramtLevel.replay({...window.__layerRootConfig,cinematics:false,voiceOn:()=>true,subtitlesOn:()=>false,cityAudioBusy:()=>false});
   const update=BuergeramtLevel.update.bind(BuergeramtLevel);BuergeramtLevel.update=()=>{};window.__step=seconds=>{for(let t=0;t<seconds;t+=1/60)update(Math.min(1/60,seconds-t));Germany3D.sync()};
   const {Mesh}=await import('three');const original=Mesh.prototype.updateMatrixWorld;window.__layerMeshes=new Map();Mesh.prototype.updateMatrixWorld=function(...a){if(this.userData.anchorActive)window.__layerMeshes.set(this.uuid,this);return original.apply(this,a)};
   window.__layerFixture(id);
 },profile.id||'nachtschichtmelderin');
 assert(await page.evaluate(()=>BuergeramtLevel.fever.active),'the forced encounter must own a fever state');
 await page.waitForTimeout(1400);
 const states=[];
 for(const [name,time] of [['entry',0],['rise',.35],['mid',.30],['full',.6],['arc',.4]]){
   await page.evaluate(time=>__step(time),time);await page.waitForTimeout(200);await page.evaluate(()=>Germany3D.sync());
   const state=await page.evaluate(()=>({fever:BuergeramtLevel.fever,actor:__layerActor(),gaussian:Germany3D.amtGaussian,patches:[...__layerMeshes.values()].filter(m=>m.visible).map(m=>({opacity:m.material.opacity,renderOrder:m.renderOrder,depthTest:m.material.depthTest,position:m.position.toArray(),scale:m.scale.toArray()})),render:Germany3D.inspectAssets().render}));
   if(!process.env.PROBE_REF){assert.equal(state.actor.renderOrder,200);assert.equal(state.actor.depthTest,true);assert.equal(state.actor.layer,2);assert(state.actor.opacity===0||state.actor.opacity===1);assert(state.gaussian.actors.every(a=>a.id===state.fever.id||!a.visible),'only the speaker owns a foreground cloud');for(const patch of state.patches){assert.equal(patch.opacity,1);assert.equal(patch.depthTest,true)}}
   states.push({name,...state});await page.screenshot({path:path.join(out,profile.name+'-'+name+'.png')});
 }
 await page.evaluate(()=>__endFever());
 for(const [name,time]of [['hold',.7],['release',.6],['restored',1.4]]){await page.evaluate(t=>__step(t),time);await page.waitForTimeout(100);states.push({name,...await page.evaluate(()=>({fever:BuergeramtLevel.fever,actor:__layerActor(),gaussian:Germany3D.amtGaussian}))});await page.screenshot({path:path.join(out,profile.name+'-'+name+'.png'),timeout:60000});}
 if(!process.env.PROBE_REF){const restored=states.at(-1);assert.equal(restored.fever.active,false);assert.equal(restored.actor.renderOrder,200);assert.equal(restored.actor.depthTest,true);assert.equal(restored.actor.layer,2);assert.equal(restored.actor.foreground,false);assert(await page.evaluate(()=>Germany3D.amtCharacters.every(a=>a.depthTest===true&&a.layer===2)),'every office person uses the actor pass with room depth outside encounters')}
 if(profile.name==='desktop'){await page.setViewportSize({width:960,height:640});await page.evaluate(()=>Germany3D.sync());await page.screenshot({path:path.join(out,'desktop-resized.png')});await page.setViewportSize({width:profile.width,height:profile.height});await page.evaluate(()=>Germany3D.sync())}
 const pixels=process.env.PROBE_REF?null:await page.evaluate(()=>__officeDepthProbe());
 fs.writeFileSync(path.join(out,profile.name+'-pixels.json'),JSON.stringify(pixels,null,2));
 console.log(JSON.stringify({profile:profile.name,pixels}));
 if(pixels){assert(pixels.blocked[2]>200&&pixels.blocked[0]<20,'solid room geometry hides the painting');assert(pixels.aboveEffect[0]>200&&pixels.aboveEffect[2]<20,'the actor pass follows the effect');assert(pixels.alphaEdge[0]>200&&pixels.alphaEdge[2]>200,'transparent paint reveals the effect');assert(pixels.nearPerson[1]>200&&pixels.nearPerson[0]<20,'nearer people draw last');assert(pixels.farPerson[0]>200&&pixels.farPerson[1]<20,'crossing person depth restores the opposite order')}
 const paused=await page.evaluate(()=>BuergeramtLevel.characters);await page.waitForTimeout(100);assert.deepEqual(await page.evaluate(()=>BuergeramtLevel.characters),paused,'rendering must not advance the action clock');
 await page.evaluate(id=>{__layerFixture(id);__step(.65)},profile.id||'nachtschichtmelderin');
 await page.locator('#amt-leave').evaluate(n=>n.click());
 await page.waitForFunction(()=>!BuergeramtLevel.active&&!Germany3D.levelTransition.active&&!document.body.classList.contains('amt-direct-mode'),null,{timeout:15000});
 await page.evaluate(()=>Germany3D.sync());const exited=await page.evaluate(()=>Germany3D.amtGaussian);assert.equal(exited.actors.length,0);assert.equal(exited.owner,null);
 if(!process.env.PROBE_REF)assert(await page.evaluate(()=>Germany3D.amtCharacters.every(a=>a.depthTest===true&&a.layer===1&&!a.foreground&&a.opacity===1)),'mid-encounter close restores every original sprite and its ordinary layer');
 assert(!await page.locator('#amt-direct-result').isVisible(),'the real root close callback restores the city');
 assert.deepEqual(errors,[]);results.push({profile,states,pixels,errors,exited});console.log(JSON.stringify({profile:profile.name,result:'PASS',states:states.length,pixels}));await context.close();await browser.close();browser=null;
 }
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({results,limits:['forced production-scene encounters and controlled geometry/pixel probes','speech mocked for visual fixtures; no playback or listening claim','Android emulation; physical Android NOT RUN']},null,2));await browser?.close();await new Promise(r=>server.close(r))}
