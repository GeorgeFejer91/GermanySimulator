// Silent production-scene QA. Android is browser emulation, never physical-device evidence.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/amt-gaussian-arcs/scene';
const base=new URL(process.env.GAME_URL||'http://127.0.0.1:8768/index.html');
base.searchParams.set('geheim','buergeramt');
const cases=[
  {name:'desktop',viewport:{width:1280,height:800},mobile:false,dpr:1,reduced:false},
  {name:'android-emulated',viewport:{width:390,height:844},mobile:true,dpr:2,reduced:false},
  {name:'desktop-reduced-motion',viewport:{width:1280,height:800},mobile:false,dpr:1,reduced:true},
].filter(item=>!process.env.PLAYTEST_VIEWPORT||item.name===process.env.PLAYTEST_VIEWPORT);
assert(cases.length,`Unknown PLAYTEST_VIEWPORT ${process.env.PLAYTEST_VIEWPORT}`);
const heights={aktenkurier:1.96,archivbotin:1.77,formularsammler:1.85,nummernfluesterer:1.84,
  nachtschichtmelderin:1.8,pfandarchitektin:1.72,kopiependler:1.84,warteschlangenpoetin:1.83};
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,
  args:process.env.PLAYTEST_GPU==='hardware'?['--mute-audio']:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});

async function installSilentAudio(context){
  await context.addInitScript(()=>{
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
    const speak=speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
    const connect=AudioNode.prototype.connect,mutes=new WeakMap();
    AudioNode.prototype.connect=function(destination,...args){
      if(destination instanceof AudioDestinationNode){let mute=mutes.get(destination);
        if(!mute){mute=this.context.createGain();mute.gain.value=0;connect.call(mute,destination);mutes.set(destination,mute)}
        destination=mute}
      return connect.call(this,destination,...args);
    };
  });
}
async function fixture(page){
  await page.evaluate(()=>{
    const level=BuergeramtLevel;
    level.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>false,onClose:()=>{}});
    const update=level.update.bind(level),view=Object.getOwnPropertyDescriptor(level,'view');
    window.__gaussianActualView=()=>view.get.call(level);
    level.update=()=>{};
    window.__gaussianTick=count=>{for(let n=0;n<count;n++)update(1/60)};
    window.__gaussianFocus={id:null,point:null,distance:2.7};
    Object.defineProperty(level,'view',{configurable:true,get(){
      const actual=view.get.call(level),focus=window.__gaussianFocus;
      if(focus.point)return focus.point;
      const actor=focus.id&&level.characters.find(item=>item.id===focus.id);
      return actor?{...actual,x:actor.x,z:actor.z-focus.distance,yaw:Math.PI}:actual;
    }});
  });
  // The wrapper records the transform actually submitted by the native Spark
  // mesh. It delegates unchanged to Object3D and does not change the game clock.
  await page.evaluate(async()=>{
    const {SplatMesh}=await import('./assets/vendor/spark/2.3.1/spark.module.js');
    const {Mesh}=await import('three');
    const original=SplatMesh.prototype.updateMatrixWorld;
    window.__gaussianTransforms=new Map();
    window.__paintedTransforms=new Map();
    const originalPaint=Mesh.prototype.updateMatrixWorld;
    Mesh.prototype.updateMatrixWorld=function(...args){
      if(this.userData.anchorActive)window.__paintedTransforms.set(this.uuid,{x:this.position.x,y:this.position.y,z:this.position.z,scale:this.scale.y,visible:this.visible});
      return originalPaint.apply(this,args);
    };
    SplatMesh.prototype.updateMatrixWorld=function(...args){
      window.__gaussianTransforms.set(this.uuid,{x:this.position.x,y:this.position.y,z:this.position.z,
        scale:this.scale.y,visible:this.visible});
      return original.apply(this,args);
    };
  });
}
async function screenshot(page,dir,name){
  // Frozen simulation poses still need fresh generator/sort output. A pending
  // earlier update can otherwise leave a screenshot showing the previous key.
  const target=await page.evaluate(()=>{Germany3D.sync();const state=Germany3D.amtGaussian;
    return state.actors.some(actor=>actor.visible&&actor.effect>.001)?state.owner.startedUpdates+2:null});
  if(target!==null){
    await page.waitForFunction(target=>{Germany3D.sync();const state=Germany3D.amtGaussian;return state.owner.completedUpdates>=target||!state.actors.some(actor=>actor.visible&&actor.effect>.001)},target,{timeout:60000});
    await page.waitForTimeout(90);
    const final=await page.evaluate(()=>{Germany3D.sync();return Germany3D.amtGaussian.owner.startedUpdates+1});
    await page.waitForFunction(target=>{Germany3D.sync();const state=Germany3D.amtGaussian;return state.owner.completedUpdates>=target||!state.actors.some(actor=>actor.visible&&actor.effect>.001)},final,{timeout:60000});
  }
  await page.evaluate(()=>Germany3D.sync());
  await page.screenshot({path:path.join(dir,`${name}.png`),timeout:60000});
}
async function navigateToConversation(page){
  // Same canonical keyboard route as playtest-buergeramt-animation.mjs. The
  // character is chosen by the game's proximity interaction, not test state.
  await page.evaluate(()=>{
    const move=(axis,target,pos,neg)=>{let n=0;
      while(Math.abs(BuergeramtLevel.view[axis]-target)>.07&&n++<300){
        const current=BuergeramtLevel.view[axis],code=current<target?pos:neg;
        dispatchEvent(new KeyboardEvent('keydown',{code}));__gaussianTick(1);
        dispatchEvent(new KeyboardEvent('keyup',{code}));
      }
      if(n>=300)throw new Error(`Could not walk ${axis} to ${target}`);
    };
    move('z',-2.6,'KeyS','KeyW');move('x',3.4,'KeyD','KeyA');move('z',1.2,'KeyS','KeyW');
    BuergeramtLevel.interact();
  });
  const opened=await page.evaluate(()=>({stage:BuergeramtLevel.stage,speaker:BuergeramtLevel.characterMood?.id}));
  assert.equal(opened.stage,'character','the proximity interaction must naturally open dialogue');
  assert(heights[opened.speaker],`unexpected naturally selected speaker ${opened.speaker}`);
  await page.evaluate(id=>{__gaussianFocus.id=id;__gaussianFocus.point=null;Germany3D.sync()},opened.speaker);
  return opened.speaker;
}
async function observation(page,id){
  return page.evaluate(id=>{
    Germany3D.sync();
    const state=BuergeramtLevel.characters.find(actor=>actor.id===id);
    const painted=Germany3D.amtCharacters.find(actor=>actor.name===id);
    const transforms=[...__gaussianTransforms.values()].filter(item=>item.visible&&
      Math.hypot(item.x-state.x,item.z-state.z)<.02);
    const anchorTransforms=[...__paintedTransforms.values()].filter(item=>item.visible&&Math.hypot(item.x-state.x,item.z-state.z)<.02);
    return{stage:BuergeramtLevel.stage,state,painted,gaussian:Germany3D.amtGaussian,
      transform:transforms.at(-1)??null,anchorTransform:anchorTransforms.at(-1)??null};
  },id);
}
function assertPlanted(sample,id){
  const transform=sample.anchorTransform??sample.transform;
  assert(transform,`${id} needs a visible native paint or Spark transform`);
  assert(Math.abs(transform.x-sample.state.x)<1e-4&&Math.abs(transform.z-sample.state.z)<1e-4,
    `${id} Gaussian and painted source have different world XZ`);
  assert(Math.abs(transform.y-(sample.anchorTransform?transform.scale/2:0))<1e-4,`${id} root must remain on the source floor`);
  const expected=heights[id]*(sample.painted.detail?1+.0025*sample.painted.breath:1);
  assert(Math.abs(transform.scale-expected)<.005,`${id} height must follow source plane scale`);
}
async function runCase(item){
  const dir=path.join(output,item.name);fs.mkdirSync(dir,{recursive:true});
  const report={name:item.name,viewport:item.viewport,dpr:item.dpr,physicalAndroid:false,
    reducedMotion:item.reduced,errors:[],warnings:[],gaussianRequests:[],arc:[]};
  const context=await browser.newContext({viewport:item.viewport,isMobile:item.mobile,hasTouch:item.mobile,
    deviceScaleFactor:item.dpr,reducedMotion:item.reduced?'reduce':'no-preference'});
  await installSilentAudio(context);
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(`page: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(`console: ${message.text()}`);
    if(message.type()==='warning')report.warnings.push(message.text())});
  page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')
    report.errors.push(`request: ${request.url()} ${request.failure()?.errorText}`)});
  page.on('response',response=>{if(response.status()>=400)report.errors.push(`HTTP ${response.status()}: ${response.url()}`)});
  page.on('request',request=>{if(request.url().includes('/animation/'))report.gaussianRequests.push(request.url())});
  try{
    await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.ready&&
      Germany3D.amtCharacters.every(actor=>actor.loaded),null,{timeout:120000});
    await fixture(page);
    if(!item.reduced){
      // Existing Frau Knick pilot: whole main-to-main cycle, then render-only
      // pause and residence release. This leaves the real simulation untouched.
      await page.evaluate(()=>{__gaussianFocus.point={x:3.9,z:-7.45,yaw:0};Germany3D.sync()});
      await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='clerk')?.ready},null,{timeout:90000});
      await page.evaluate(()=>{__gaussianTick(186);Germany3D.sync()});
      await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(a=>a.id==='clerk')?.visible},null,{timeout:60000});
      await screenshot(page,dir,'clerk-raised');
      for(const [name,ticks] of [['contact',99],['refusal',132],['ready',93]]){
        await page.evaluate(n=>{__gaussianTick(n);Germany3D.sync()},ticks);
        await screenshot(page,dir,`clerk-${name}`);
      }
      const before=await page.evaluate(()=>BuergeramtLevel.clerkPerformance.animation);
      await page.waitForTimeout(180);
      assert.deepEqual(await page.evaluate(()=>BuergeramtLevel.clerkPerformance.animation),before,
        'render-only wall time must not advance the clerk action');
      report.clerk={animation:before,gaussian:await page.evaluate(()=>Germany3D.amtGaussian)};
      assert.equal(report.clerk.gaussian.actors.find(actor=>actor.id==='clerk').variant,item.mobile?'mobile':'desktop');
      await page.evaluate(()=>{__gaussianFocus.point={x:-7.45,z:8,yaw:0};Germany3D.sync()});
      await page.waitForFunction(()=>{Germany3D.sync();return !Germany3D.amtGaussian.actors.some(a=>a.id==='clerk')},null,{timeout:10000});
    }
    await page.evaluate(()=>{__gaussianFocus.point=null;__gaussianFocus.id=null;
      BuergeramtLevel.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>false,onClose:()=>{}})});
    const id=await navigateToConversation(page);report.speaker=id;
    const held=await page.evaluate(()=>BuergeramtLevel.characters.filter(actor=>actor.id!==BuergeramtLevel.characterMood?.id));
    if(item.reduced){
      await page.evaluate(()=>{__gaussianTick(120);Germany3D.sync()});
      const sample=await observation(page,id);
      assert.equal(sample.gaussian.actors.length,0,'reduced motion must not admit Gaussian actors');
      assert.equal(sample.painted.visible,true,'reduced motion must retain painted character');
      assert.deepEqual(await page.evaluate(()=>BuergeramtLevel.characters.filter(actor=>actor.id!==BuergeramtLevel.characterMood?.id)),held,
        'dialogue must freeze other actors under reduced motion');
      report.reduced={painted:sample.painted,gaussian:sample.gaussian};
      await screenshot(page,dir,'conversation-painted-fallback');
    }else{
      await page.waitForFunction(id=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(actor=>actor.id===id)?.visible},id,{timeout:90000});
      const start=await observation(page,id),startXZ=[start.state.x,start.state.z];
      assertPlanted(start,id);
      assert.equal(start.state.animation.arc,'work-gesture-work');
      assert(start.gaussian.actors.length<=start.gaussian.limit,'nearby splat residency must stay bounded');
      await screenshot(page,dir,'conversation-work-start');
      for(let sampleIndex=1;sampleIndex<=16;sampleIndex++){
        await page.evaluate(()=>{__gaussianTick(15);Germany3D.sync()});
        const sample=await observation(page,id);
        const expected=sampleIndex/16;
        assert(Math.abs(sample.state.animation.phase-expected)<1e-4,
          `continuous four-second work→gesture→work phase ${sampleIndex}`);
        assert.equal(sample.state.animation.arc,'work-gesture-work');
        assert(Math.hypot(sample.state.x-startXZ[0],sample.state.z-startXZ[1])<1e-8,
          'speaker stays planted during dialogue');
        assertPlanted(sample,id);
        assert(sample.gaussian.actors.find(actor=>actor.id===id)?.visible,'native Gaussian must remain visible across the arc');
        assert(sample.gaussian.actors.length<=sample.gaussian.limit,'nearby splat residency must stay bounded');
        report.arc.push({seconds:sampleIndex/4,phase:sample.state.animation.phase,
          segment:sample.gaussian.actors.find(actor=>actor.id===id).segment,
          blend:sample.gaussian.actors.find(actor=>actor.id===id).blend,
          rootY:sample.anchorTransform?sample.anchorTransform.y-sample.anchorTransform.scale/2:sample.transform.y,
          scale:(sample.anchorTransform??sample.transform).scale});
        if(sampleIndex%2===0)await screenshot(page,dir,`conversation-${String(sampleIndex/4).replace('.','_')}s`);
      }
      await page.evaluate(()=>{__gaussianTick(1);Germany3D.sync()});
      assert((await observation(page,id)).state.animation.phase<.01,
        'the next simulation tick must cross the work loop seam');
      assert.deepEqual(await page.evaluate(()=>BuergeramtLevel.characters.filter(actor=>actor.id!==BuergeramtLevel.characterMood?.id)),held,
        'dialogue must freeze other actors while the speaker moves');
      const frozen=await page.evaluate(id=>BuergeramtLevel.characters.find(actor=>actor.id===id).animation,id);
      await page.waitForTimeout(180);
      assert.deepEqual(await page.evaluate(id=>BuergeramtLevel.characters.find(actor=>actor.id===id).animation,id),frozen,
        'wall time and speech scheduling must not reset or advance the body arc');
      await page.evaluate(()=>{__gaussianFocus.point={x:-7.45,z:8,yaw:0};Germany3D.sync()});
      await page.waitForFunction(id=>{Germany3D.sync();return !Germany3D.amtGaussian.actors.some(actor=>actor.id===id)},id,{timeout:10000});
      report.retired=await page.evaluate(()=>Germany3D.amtGaussian);
      await page.evaluate(id=>{__gaussianFocus.point=null;__gaussianFocus.id=id;Germany3D.sync()},id);
      await page.waitForFunction(id=>{Germany3D.sync();return Germany3D.amtGaussian.actors.find(actor=>actor.id===id)?.visible},id,{timeout:90000});
      // Dismiss from a nonterminal phase. Desktop tests the reverse branch;
      // Android tests forward completion. Both must reach a work anchor first.
      const ticks=item.mobile?159:21;await page.evaluate(n=>{__gaussianTick(n);Germany3D.sync()},ticks);
      const pre=await observation(page,id),direction=pre.state.animation.phase<.5?-1:1;
      assert.equal(direction,item.mobile?1:-1);
      await page.locator('#amt-actions button').first().evaluate(button=>button.click());
      let after=await observation(page,id);
      assert.equal(after.stage,'walk-sign','dismissal resumes the canonical walk stage immediately');
      assert.equal(after.state.mode,'gesture','selected speaker finishes the authored return before walking');
      assert(Math.abs(after.state.animation.phase-pre.state.animation.phase)<1e-4,'dismissal must not jump body phase');
      let elapsed=0,previous=after.state.animation.phase;
      while(after.state.mode==='gesture'&&elapsed<2.1){
        await page.evaluate(()=>{__gaussianTick(1);Germany3D.sync()});elapsed+=1/60;
        after=await observation(page,id);
        if(after.state.mode==='gesture'){
          assert((after.state.animation.phase-previous)*direction>=-1e-6,'return phase must move toward its main endpoint');
          previous=after.state.animation.phase;
          assert(Math.hypot(after.state.x-startXZ[0],after.state.z-startXZ[1])<1e-8,
            'selected speaker must not walk before returning to work');
        }
      }
      assert(after.state.mode!=='gesture','return must reach a work anchor within two seconds');
      report.return={startPhase:pre.state.animation.phase,direction,seconds:elapsed,modeAfter:after.state.mode};
      await screenshot(page,dir,'conversation-return-complete');
      const resumeBefore=after.state;
      // Let the ordinary look/work reaction finish while the real player moves
      // clear of the existing route guard; the camera still follows the figure.
      await page.keyboard.down('s');
      await page.evaluate(()=>{__gaussianTick(120);Germany3D.sync()});
      await page.keyboard.up('s');
      const resumed=await observation(page,id);
      assert.equal(resumed.state.mode,'walk','ordinary reaction must resume the original route');
      assert(Math.hypot(resumed.state.x-resumeBefore.x,resumed.state.z-resumeBefore.z)>.01,
        'resumed walking must displace the body');
      await page.evaluate(()=>{__gaussianTick(6);Germany3D.sync()});
      const gait=await observation(page,id),walkDistance=Math.hypot(gait.state.x-resumed.state.x,gait.state.z-resumed.state.z);
      const phaseDelta=(gait.state.phase-resumed.state.phase+1)%1;
      assert.equal(gait.state.mode,'walk');
      assert(walkDistance>0&&Math.abs(phaseDelta-walkDistance*8.5/8)<1e-5,
        'gait must follow resumed route displacement');
      report.walkResume={mode:resumed.state.mode,displacement:Math.hypot(resumed.state.x-resumeBefore.x,resumed.state.z-resumeBefore.z),
        walkDistance,phaseDelta,player:await page.evaluate(()=>__gaussianActualView())};
      await screenshot(page,dir,'conversation-resume-walk');
    }
    await page.evaluate(()=>BuergeramtLevel.replay({cinematics:false,voiceOn:()=>false,subtitlesOn:()=>false,onClose:()=>{}}));
    const replay=await page.evaluate(()=>({stage:BuergeramtLevel.stage,gaussian:Germany3D.amtGaussian,
      modes:BuergeramtLevel.characters.map(actor=>actor.mode)}));
    assert.equal(replay.stage,'outside');assert(replay.modes.every(mode=>mode==='work'));
    if(!item.reduced)assert.notEqual(replay.gaussian.generation,report.retired.generation,
      'replay must replace the old Gaussian generation');
    report.replay={generation:replay.gaussian.generation,actors:replay.gaussian.actors.length,
      visible:replay.gaussian.actors.filter(actor=>actor.visible).length};
    await page.evaluate(()=>{Germany3D.sync();document.getElementById('amt-leave').click()});
    const closed=await page.evaluate(()=>({active:BuergeramtLevel.active,gaussian:Germany3D.amtGaussian}));
    assert.equal(closed.active,false);assert.equal(closed.gaussian.actors.length,0,
      'closing the level must retire Gaussian consumers immediately');
    report.close={active:closed.active,actors:closed.gaussian.actors.length};
    await page.waitForTimeout(250); // let an in-flight Spark sort/retirement settle
    assert(report.gaussianRequests.every(url=>!url.endsWith('.webp')||/-anchor-\d+\.webp$/.test(url)),
      'Gaussian runtime loads compact records and registered runtime anchors');
    assert.equal(report.errors.length,0,`browser errors: ${report.errors.join('; ')}`);
    report.result='PASS';
  }catch(error){
    report.result='FAIL';report.errors.push(String(error));
    report.failureState=await page.evaluate(()=>({stage:window.BuergeramtLevel?.stage,
      mood:window.BuergeramtLevel?.characterMood,gaussian:window.Germany3D?.amtGaussian})).catch(()=>null);
    await page.screenshot({path:path.join(dir,'failure.png'),timeout:15000}).catch(()=>{});
  }finally{
    fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
    await context.close();
  }
  return report;
}

const results=[];
try{for(const item of cases)results.push(await runCase(item))}finally{await browser.close()}
fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({fixture:'Natural proximity interaction; original level.update(1/60) manually stepped; production Spark render pass; silent headless '+(process.env.PLAYTEST_GPU==='hardware'?'hardware ANGLE':'SwiftShader')+'; Android browser emulation only',results},null,2));
console.log(JSON.stringify(results.map(({name,result,speaker,return:turn,errors})=>({name,result,speaker,return:turn,errors})),null,2));
if(results.some(result=>result.result!=='PASS'||result.errors.length))process.exitCode=1;
