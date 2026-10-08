// Headless WebGL check of one naturally triggered queue reaction. Audio is muted
// before navigation; the game's audio scheduling and rendering still run.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/skill-upgrade/browser-animation';
const base=new URL(process.env.GAME_URL||'http://127.0.0.1:8793/index.html');
const officeUrl=new URL(base);officeUrl.searchParams.set('geheim','buergeramt');
const prototypeUrl=new URL('3d.html',base);
fs.mkdirSync(output,{recursive:true});
const cases=[
 ['desktop',{width:1280,height:800},false,1],
 ['android-portrait',{width:390,height:844},true,2],
 ['android-landscape',{width:844,height:390},true,2],
].filter(([name])=>!process.env.PLAYTEST_VIEWPORT||process.env.PLAYTEST_VIEWPORT===name);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
const results=[];

async function silent(context){
 await context.addInitScript(()=>{
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
  const speak=speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
  const connect=AudioNode.prototype.connect,mutes=new WeakMap();
  AudioNode.prototype.connect=function(destination,...args){
   if(destination instanceof AudioDestinationNode){let mute=mutes.get(destination);if(!mute){mute=this.context.createGain();mute.gain.value=0;connect.call(mute,destination);mutes.set(destination,mute)}destination=mute}
   return connect.call(this,destination,...args);
  };
 });
}
function observe(page,report){
 page.on('pageerror',e=>report.errors.push(`page: ${e.message}`));
 page.on('console',e=>{if(e.type()==='error')report.errors.push(`console: ${e.text()}`);if(e.type()==='warning')report.warnings.push(e.text())});
 page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')report.errors.push(`request: ${r.url()} ${r.failure()?.errorText}`)});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`HTTP ${r.status()}: ${r.url()}`)});
}
async function record(page,dir,label,images){
 await page.evaluate(()=>Germany3D.sync());
 const file=path.join(dir,`${label}.png`),data=await page.screenshot({path:file,timeout:60000});
 images.push({label,data});return file;
}
async function strip(browser,viewport,images,dir){
 const width=Math.min(360,viewport.width),height=Math.round(viewport.height*width/viewport.width),rows=Math.ceil(images.length/4);
 const page=await browser.newPage({viewport:{width:width*4,height:(height+28)*rows},deviceScaleFactor:1});
 const cards=images.map(({label,data})=>`<div><img src="data:image/png;base64,${data.toString('base64')}"><span>${label}</span></div>`).join('');
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#202126;color:#fff;font:13px Arial;display:grid;grid-template-columns:repeat(4,${width}px)}div{height:${height+28}px;border:1px solid #555}img{display:block;width:${width}px;height:${height}px}span{padding:5px}</style>${cards}`);
 await page.locator('img').first().evaluate(img=>img.decode());
 await page.screenshot({path:path.join(dir,'reaction-strip.png'),fullPage:true});
 await page.close();
}

async function officeCase(name,viewport,mobile,dpr){
 const dir=path.join(output,`browser-${name}`);fs.mkdirSync(dir,{recursive:true});
 const report={name,emulation:mobile?'Android browser emulation':'Chromium desktop',viewport,dpr,errors:[],warnings:[],frames:[]},images=[];
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:dpr});
 await silent(context);const page=await context.newPage();observe(page,report);
 try{
  await page.goto(officeUrl.href,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.ready,null,{timeout:60000});
  // Fixture: stop only the game loop's public update call. Manual steps invoke
  // the original production update at 60 Hz. Render observed samples explicitly;
  // drawing every fast-forward tick needlessly stalls software WebGL under load.
  await page.evaluate(()=>{
   BuergeramtLevel.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>false});
   const level=BuergeramtLevel,update=level.update.bind(level),view=Object.getOwnPropertyDescriptor(level,'view');
   level.update=()=>{};window.__animationStep=()=>update(1/60);
   window.__animationFocus={id:null,distance:6.2};
   Object.defineProperty(level,'view',{configurable:true,get(){const actual=view.get.call(level),focus=window.__animationFocus;if(!focus.id)return actual;const actor=level.characters.find(a=>a.id===focus.id);return actor?{...actual,x:actor.x,z:actor.z-focus.distance,yaw:Math.PI}:actual}});
   window.__animationRestore=()=>Object.defineProperty(level,'view',view);
  });
  await page.waitForFunction(()=>Germany3D.amtOffice?.attached&&Germany3D.amtCharacters.length===14&&Germany3D.amtCharacters.every(a=>a.loaded),null,{timeout:90000});
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<50&&BuergeramtLevel.stage==='outside';i++)__animationStep();dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}))});
  assert.equal(await page.evaluate(()=>BuergeramtLevel.stage),'walk-sign','entry must reach the canonical office');
  await record(page,dir,'entry',images);
  const queue=await page.evaluate(()=>BuergeramtLevel.queueDisplay);
  const call=await page.evaluate(start=>{for(let i=0;i<360;i++){__animationStep();if(BuergeramtLevel.queueDisplay!==start)return BuergeramtLevel.queueDisplay}return null},queue);
  assert(call,'a natural background queue call must fire');report.queueCall=call;
  await record(page,dir,'queue-call-entry',images);
  const selected=await page.evaluate(()=>{for(let i=0;i<420;i++){const actor=BuergeramtLevel.characters.find(a=>a.mode==='flinch');if(actor)return actor.id;__animationStep()}return null});
  assert(selected,'a naturally called actor must enter flinch');report.actor=selected;
  await page.evaluate(id=>{__animationFocus.id=id;__animationFocus.distance=6.2;Germany3D.sync()},selected);
  const first=await page.evaluate(id=>BuergeramtLevel.characters.find(a=>a.id===id),selected);
  report.startPosition=[first.x,first.z];
  const sprite=await page.evaluate(async id=>{const mobile=matchMedia('(max-width: 700px)').matches,img=new Image();img.src=`./assets/buergeramt/characters/${id}-motion${mobile?'-mobile':''}.webp`;await img.decode();const columns=img.naturalWidth/(mobile?160:320);return{mobile,atlas:[img.naturalWidth,img.naturalHeight],columns,walkFrames:columns===12?16:8}},selected);
  assert([8,12].includes(sprite.columns),`unexpected atlas grid ${JSON.stringify(sprite)}`);report.sprite=sprite;
  const seen=new Set();report.near=[];
  for(let tick=0;tick<90;tick++){
   const state=await page.evaluate(id=>BuergeramtLevel.characters.find(a=>a.id===id),selected);
   if(state.mode!=='flinch')break;
   if(!seen.has(state.frame)){
    seen.add(state.frame);assert(Math.hypot(state.x-first.x,state.z-first.z)<1e-8,'flinch must stay planted');
    await page.evaluate(()=>{__animationFocus.distance=6.2;Germany3D.sync()});
    const far=await page.evaluate(id=>Germany3D.amtCharacters.find(a=>a.name===id),selected);
    const expected=4*sprite.walkFrames+3*8+state.frame;
    assert.equal(far.frame,expected,`far renderer cell for flinch ${state.frame}`);assert.equal(far.detail,false,'far action uses encoded atlas');
    await record(page,dir,`flinch-${String(state.frame).padStart(2,'0')}-far`,images);
    report.frames.push({stateFrame:state.frame,phase:state.phase,renderCell:far.frame,farDetail:far.detail});
    if([0,4,7].includes(state.frame)){
     await page.evaluate(()=>{__animationFocus.distance=2.7;Germany3D.sync()});
     await page.waitForFunction(id=>{Germany3D.sync();return Germany3D.amtCharacters.find(a=>a.name===id)?.detail},selected,{timeout:12000});
     const near=await page.evaluate(id=>Germany3D.amtCharacters.find(a=>a.name===id),selected);
     assert.equal(near.frame,expected);report.near.push({stateFrame:state.frame,renderCell:near.frame,detail:near.detail,texelHeight:near.texelHeight});
     await record(page,dir,`flinch-${state.frame}-near-source-detail`,images);
    }
   }
   await page.evaluate(()=>__animationStep());
  }
  assert.deepEqual([...seen].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7],'full one-shot must sample all eight visible atlas cells');
  const exit=await page.evaluate(id=>{for(let i=0;i<50;i++){__animationStep();const actor=BuergeramtLevel.characters.find(a=>a.id===id);if(actor.mode==='work')return actor}return null},selected);
  assert(exit,'flinch must exit to work');await record(page,dir,'work-exit',images);
  // A real character interaction opens the modal stage; other clips must hold.
  await page.evaluate(()=>{__animationRestore();BuergeramtLevel.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>false});const move=(axis,target,pos,neg)=>{let n=0;while(Math.abs(BuergeramtLevel.view[axis]-target)>.07&&n++<300){const current=BuergeramtLevel.view[axis],code=current<target?pos:neg;dispatchEvent(new KeyboardEvent('keydown',{code}));__animationStep();dispatchEvent(new KeyboardEvent('keyup',{code}))}};move('z',-2.6,'KeyS','KeyW');move('x',3.4,'KeyD','KeyA');move('z',1.2,'KeyS','KeyW');BuergeramtLevel.interact()});
  assert.equal(await page.evaluate(()=>BuergeramtLevel.stage),'character','nearby conversation must open the modal');
  const held=await page.evaluate(()=>BuergeramtLevel.characters);
  await page.evaluate(()=>{for(let i=0;i<120;i++)__animationStep()});
  const paused=await page.evaluate(()=>BuergeramtLevel.characters);
  const speaker=await page.evaluate(()=>BuergeramtLevel.characterMood?.id);
  assert.deepEqual(paused.filter(a=>a.id!==speaker),held.filter(a=>a.id!==speaker),'modal must freeze other actor actions');
  await record(page,dir,'modal-paused',images);
  await page.locator('#amt-actions button').first().evaluate(button=>button.click());
  assert.equal(await page.evaluate(()=>BuergeramtLevel.stage),'walk-sign','conversation must resume walking');
  await page.evaluate(()=>{for(let i=0;i<20;i++)__animationStep()});
  await record(page,dir,'resumed',images);
  await page.locator('#amt-direct-reset').click();
  await page.waitForFunction(()=>window.BuergeramtLevel?.active&&BuergeramtLevel.stage==='outside'&&window.Germany3D?.ready,null,{timeout:60000});
  assert((await page.evaluate(()=>BuergeramtLevel.characters)).every(a=>a.mode==='work'),'replay must clear old action');
  await record(page,dir,'replay',images);
  await strip(browser,viewport,images,dir);
  report.result=report.errors.length?'FAIL':'PASS';
 }catch(error){report.result='FAIL';report.errors.push(String(error));report.failureState=await page.evaluate(()=>({stage:window.BuergeramtLevel?.stage,actors:window.Germany3D?.amtCharacters,office:window.Germany3D?.amtOffice?.attached})).catch(()=>null);await page.screenshot({path:path.join(dir,'failure.png'),timeout:10000}).catch(()=>{})}
 finally{report.screenshots=images.map(x=>x.label);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));await context.close()}
 return report;
}

try{
 for(const [name,viewport,mobile,dpr] of cases)results.push(await officeCase(name,viewport,mobile,dpr));
 if(cases.some(([name])=>name==='desktop')){
  const context=await browser.newContext({viewport:{width:1280,height:800}});await silent(context);
  const page=await context.newPage(),report={name:'3d-startup',errors:[],warnings:[]};observe(page,report);
  try{await page.goto(prototypeUrl.href,{waitUntil:'commit',timeout:60000});await page.waitForFunction(()=>window.Germany3D?.ready&&document.querySelector('canvas'),null,{timeout:60000});await page.screenshot({path:path.join(output,'browser-3d-startup.png')});report.result=report.errors.length?'FAIL':'PASS'}
  catch(error){report.result='FAIL';report.errors.push(String(error))}
  finally{results.push(report);await context.close()}
 }
 fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({silent:true,physicalAndroid:false,fixture:'game.update wrapper frozen; original update(1/60), real Germany3D.sync at observed samples; renderer-only camera focus; near action detail is one static source pose',results},null,2));
 console.log(JSON.stringify(results.map(({name,result,actor,frames,errors,warnings})=>({name,result,actor,frames:frames?.length,errors,warnings}))));
 if(results.some(r=>r.result!=='PASS'||r.errors.length))process.exitCode=1;
}finally{await browser.close()}
