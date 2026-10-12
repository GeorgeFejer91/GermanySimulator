// Silent input/render diagnostics; forced actor headings test view/cache behavior.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,sep,extname,basename} from 'node:path';
import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.TURN_OUTPUT||'output/turn-smoothing/turns');mkdirSync(out,{recursive:true});
const baseline=process.env.TURN_BASELINE?resolve(process.env.TURN_BASELINE):null;
const source=file=>readFileSync(baseline&&existsSync(resolve(baseline,basename(file)))?resolve(baseline,basename(file)):file);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer((req,res)=>{try{
  const path=new URL(req.url,'http://local').pathname,file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));assert.ok(file.startsWith(root+sep));let body=source(file);
  if(file===resolve('game.js'))body=body.toString().replace('const directConfig={','const directConfig={cinematics:false,');
  if(file===resolve('buergeramt.js'))body=body.toString().replace('updateCharacters(elapsed);','if(!window.__holdPatrol)updateCharacters(elapsed);').replace('window.BuergeramtLevel={','window.__turnFixture={view,characters,setStage,get turnVelocity(){return typeof turnVelocity==="undefined"?0:turnVelocity}};window.BuergeramtLevel={');
  if(file===resolve('world3d.js'))body=body.toString().replace('  app.classList.add("three-ready");',`window.__turnRender={walk:()=>({spare:typeof amtWalkSpare==='undefined'?null:amtWalkSpare.inspect(),actors:amtMoving.map(a=>({id:a.id,direction:a.direction,cell:a.cell,frame:a.renderKey,foot:a.mesh.position.y-a.height*a.mesh.scale.y/2,width:a.walkDetail?.image?.width||0,height:a.walkDetail?.image?.height||0}))}),gpu(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}};app.classList.add("three-ready");`);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={complete:false,baseline,revision:Object.fromEntries(['game.js','buergeramt.js','world3d.js','buergeramt-walk-view.js','buergeramt-fit.js','buergeramt.css','buergeramt-goop.js','buergeramt-floor.js','index.html','3d.html'].map(file=>[file,createHash('sha256').update(source(resolve(file))).digest('hex')])),cases:[],limits:['Headless Chromium desktop and Android emulation; no physical Android or GPU/display timing','Keyboard and CDP touch are real browser input; pointercancel/blur/visibility events and actor headings are injected fixtures','Audio remains enabled but muted; no listening review or natural mission-chain claim']};
const summary=values=>{const sorted=values.toSorted((a,b)=>a-b);return{count:sorted.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)}};
try{
  for(const [name,width,height]of [['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390]]){
    if(process.env.TURN_CASE&&!process.env.TURN_CASE.split(',').includes(name))continue;
    const mobile=name.startsWith('android'),context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:mobile,hasTouch:mobile});
    await context.addInitScript(()=>{
      let seed=424242;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const g=this.context.createGain();g.gain.value=0;connect.call(g,target);return connect.call(this,g,...args)}return connect.call(this,target,...args)};
      const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
      window.__touches=[];document.addEventListener('pointerdown',e=>{if(e.target.dataset?.amtKey)__touches.push({id:e.pointerId,key:e.target.dataset.amtKey})},true);
    });
    const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader|GLSL/i.test(m.text()))errors.push(m.text())});
    await page.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.officeAssetsReady,null,{timeout:120000});
    await page.waitForTimeout(1000);
    await page.evaluate(()=>{window.__turnFrames=[];const sync=Germany3D.sync;Germany3D.sync=function(...args){const result=sync.apply(this,args);__turnFrames.push({at:performance.now(),yaw:BuergeramtLevel.view.yaw,...__turnRender.walk()});return result}});
    const captures=[];
    for(const key of ['ArrowRight','ArrowLeft']){
      await page.keyboard.down(key);
      for(let n=0;n<3;n++){await page.waitForTimeout(200);const path=resolve(out,`${name}-${key}-${n}.png`);await page.screenshot({path});captures.push(path)}
      await page.keyboard.up(key);await page.waitForTimeout(180);
    }
    await page.waitForFunction(()=>Math.abs(__turnFixture.turnVelocity)<1e-8,null,{timeout:30000});
    const stopped=await page.evaluate(()=>BuergeramtLevel.view.yaw);const frameCount=await page.evaluate(()=>__turnFrames.length);await page.waitForFunction(count=>__turnFrames.length>count+3,frameCount,{timeout:30000});
    assert.ok(Math.abs(await page.evaluate(()=>BuergeramtLevel.view.yaw)-stopped)<1e-6,'released turn settles');
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.keyboard.up('ArrowRight');
    const blurred=await page.evaluate(()=>BuergeramtLevel.view.yaw);await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>BuergeramtLevel.view.yaw),blurred,'blur releases momentum');
    let touch=null;
    if(mobile){
      await page.evaluate(()=>Object.assign(__turnFixture.view,{x:0,z:4.8,yaw:0}));
      const point=async key=>{const b=await page.locator(`[data-amt-key="${key}"]`).boundingBox();assert.ok(b);return{x:b.x+b.width/2,y:b.y+b.height/2}};
      const forward=await point('KeyW'),right=await point('KeyD'),cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...forward,id:1},{...right,id:2}]});await page.waitForTimeout(160);
      await page.evaluate(()=>{const p=__touches.findLast(p=>p.key==='KeyD');assertPointer(p);function assertPointer(p){if(!p)throw Error('Missing native strafe pointer');document.querySelector('[data-amt-key="KeyD"]').dispatchEvent(new PointerEvent('pointercancel',{pointerId:p.id,bubbles:true}))}});
      const before=await page.evaluate(()=>({...BuergeramtLevel.view}));await page.waitForTimeout(160);const after=await page.evaluate(()=>({...BuergeramtLevel.view}));
      assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.05,'movement finger survives one pointer cancellation');assert.equal(after.yaw,before.yaw,'cancelled turn stops');
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touch={before,after};
      // The second finger drags the room while the first keeps walking.
      const look={x:width*.48,y:height*.48,id:3};
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...forward,id:1},look]});
      const swipeStart=await page.evaluate(()=>({...BuergeramtLevel.view}));
      for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...forward,id:1},{...look,x:look.x+i*12}]});await page.waitForTimeout(30)}
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const swipeEnd=await page.evaluate(()=>({...BuergeramtLevel.view}));
      assert.ok(swipeEnd.yaw>swipeStart.yaw+.15,'native touch drag turns the view');assert.ok(Math.hypot(swipeEnd.x-swipeStart.x,swipeEnd.z-swipeStart.z)>.05,'move and look coexist');touch.swipe={before:swipeStart,after:swipeEnd};
    }
    // Isolate view/cache transitions at the accepted physical sprite scale.
    await page.evaluate(()=>{window.__holdPatrol=true;const a=__turnFixture.characters[0];a.mode='walk';a.heading=Math.PI/2;Object.assign(__turnFixture.view,{x:a.x,z:a.z+2,yaw:0});});
    await page.waitForFunction(()=>__turnRender.walk().actors[0].direction==='right'&&__turnRender.walk().actors[0].width>0,null,{timeout:120000});
    const detailSnapshots=[];
    for(const heading of [-Math.PI/2,Math.PI/2,-Math.PI/2,Math.PI/2]){
      await page.evaluate(heading=>{__turnFixture.characters[0].heading=heading},heading);await page.waitForFunction(direction=>{const a=__turnRender.walk().actors[0];return a.direction===direction&&a.width>0},heading>0?'right':'left',{timeout:120000});detailSnapshots.push(await page.evaluate(()=>__turnRender.walk()));
    }
    const detailRequests=requests.filter(url=>/aktenkurier-walk-(right|left)-detail/.test(url));
    if(!baseline){assert.ok(detailRequests.length<=2,'A/B views load at most once');assert.ok(detailSnapshots.every(s=>Math.abs(s.actors[0].foot)<1e-8),'direction changes keep foot pivot');if(mobile)assert.ok(detailRequests.every(url=>url.includes('-mobile.webp')),'DPR 2 still selects mobile walk sheets')}
    const trace=await page.evaluate(()=>__turnFrames),intervals=trace.slice(1).map((s,i)=>s.at-trace[i].at);
    const frameMs=summary(intervals),gpu=await page.evaluate(()=>__turnRender.gpu());assert.ok(frameMs.count>20);assert.deepEqual(errors,[]);
    const ui=[];
    if(mobile&&!baseline){
      for(const [label,w,h,zoom,text]of [['normal',width,height,1,1],['reflow-320',320,640,1,1],['text-200',320,844,1,2],['zoom-200',844,780,2,1]]){
        await page.setViewportSize({width:w,height:h});
        await page.evaluate(({zoom,text})=>{document.documentElement.style.zoom=zoom;let style=document.getElementById('turn-ui-font');if(!style){style=document.createElement('style');style.id='turn-ui-font';document.head.append(style)}style.textContent=`.amt-touch-controls button{font-size:${15*text}px!important}`;BuergeramtFit()}, {zoom,text});
        await page.waitForTimeout(200);
        const buttons=await page.evaluate(()=>Array.from(document.querySelectorAll('.amt-touch-controls button')).map(b=>{const r=b.getBoundingClientRect();return{text:b.innerText,fit:b.dataset.pretextFit,x:r.x,y:r.y,width:r.width,height:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,clipped:b.scrollWidth>b.clientWidth+1||b.scrollHeight>b.clientHeight+1}}));
        assert.ok(buttons.every(b=>b.inside&&!b.clipped&&b.fit&&b.fit!=='unavailable'),label+' touch labels fit with actual Pretext and rendered bounds');ui.push({label,buttons});
        const overlap=await page.evaluate(()=>{const hint=document.getElementById('amt-nearby'),a=hint.getBoundingClientRect();return a.width>0&&Array.from(document.querySelectorAll('.amt-touch-controls button')).some(b=>{const r=b.getBoundingClientRect();return Math.min(a.right,r.right)>Math.max(a.left,r.left)+1&&Math.min(a.bottom,r.bottom)>Math.max(a.top,r.top)+1})});
        assert.equal(overlap,false,label+' interaction hint clears touch controls');
        await page.screenshot({path:resolve(out,`${name}-ui-${label}.png`)});
      }
    }
    await page.evaluate(()=>__turnFixture.setStage('closed'));await page.evaluate(()=>BuergeramtLevel.replay({voiceOn:()=>false,subtitlesOn:()=>false,cityAudioBusy:()=>false,cityAudioActive:()=>false,music(){},onClose(){},onCancel(){},onForm(){},cinematics:false}));
    if(!baseline)assert.equal(await page.evaluate(()=>__turnRender.walk().spare),null,'replay releases spare');
    writeFileSync(resolve(out,`${name}-trace.json`),JSON.stringify(trace));
    report.cases.push({name,gpu,frameMs,captures,touch,ui,detailRequests,detailSnapshots,errors});console.log(JSON.stringify({name,frameMs,detailRequests:detailRequests.length,verdict:'PASS'}));await context.close();
  }
  report.complete=true;
}catch(error){report.failure=error.message;throw error}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
