import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('output/site'),out=resolve(process.env.LEVEL_OUTPUT||'output/level-links');
mkdirSync(out,{recursive:true});
const levels=JSON.parse(readFileSync(resolve(root,'level-links.json'),'utf8'));
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer((req,res)=>{
  try{
    let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+sep)&&file!==root)throw Error('Outside site');
    if(statSync(file).isDirectory())file=resolve(file,'index.html');
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
  }catch{res.writeHead(404);res.end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={complete:false,limits:['Silent audio state, no listening verdict','Android emulation; physical Android NOT RUN','Direct route starts, not natural mission-chain coverage'],cases:[]};
try{
  const profiles=[['desktop',{width:1280,height:800}],['android',{width:390,height:844}],['android-landscape',{width:844,height:390}]];
  if(process.env.LEVEL_PROFILE?.includes('android-small'))profiles.push(['android-small',{width:320,height:568}]);
  if(process.env.LEVEL_PROFILE?.includes('desktop-zoom'))profiles.push(['desktop-zoom',{width:1280,height:800}]);
  for(const [profile,viewport] of profiles.filter(([profile])=>!process.env.LEVEL_PROFILE||process.env.LEVEL_PROFILE.split(',').includes(profile))){
    const mobile=profile.startsWith('android');
    const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
    context.setDefaultTimeout(90000);
    await context.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
      const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
    });
    for(const level of levels.filter(level=>!process.env.LEVEL_CASE||process.env.LEVEL_CASE.split(',').includes(level.id))){
      console.log(`START ${profile}/${level.id}`);
      const page=await context.newPage(),errors=[],failed=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.status()>=400)failed.push({url:response.url(),status:response.status()})});
      const route=process.env.LEVEL_BASE_URL?new URL(encodeURIComponent(level.path)+'/',process.env.LEVEL_BASE_URL).href:`http://127.0.0.1:${server.address().port}/${encodeURIComponent(level.path)}/`;
      const response=await page.goto(route,{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200);
      const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
      try{await page.waitForFunction(()=>!document.body.classList.contains('preloading')&&document.getElementById('intro').classList.contains('hidden'))}catch(error){
        report.failure={profile,id:level.id,errors,failed,state:await page.evaluate(()=>({body:document.body.className,intro:document.getElementById('intro').className,hud:window.Germany3DBridge?.getHUDState(),player:window.Germany3DBridge?.player,startup:window.Germany3D?.startupStatus,characters:window.Germany3DBridge?.characterAssetStatus}))};throw error;
      }
      const firstTransition=await page.evaluate(()=>window.Germany3D?.levelTransition);
      if(firstTransition?.active)await page.screenshot({path:resolve(out,`${profile}-${level.id}-arrival-transition.png`)});
      if(level.id==='buergeramt')await page.waitForFunction(()=>window.BuergeramtLevel?.active);
      else if(level.id==='jobcenter')await page.waitForFunction(()=>window.Germany3D?.jobcenter?.active&&!window.Germany3D?.levelTransition?.active);
      else if(!['city','neighbors'].includes(level.id))try{await page.waitForFunction(id=>window.Germany3D?.indoorLevel===id,level.id)}catch(error){
        report.failure={profile,id:level.id,errors,failed,state:await page.evaluate(()=>({hud:window.Germany3DBridge?.getHUDState(),player:window.Germany3DBridge?.player,office:window.Germany3D?.indoorLevel,transition:window.Germany3D?.levelTransition,dialogue:document.getElementById('dialogue').textContent}))};
        await page.screenshot({path:resolve(out,`${profile}-${level.id}-failure.png`)});throw error;
      }
      if(profile==='desktop-zoom')await page.evaluate(()=>{document.documentElement.style.zoom='2'});
      let exitFit;
      if(level.id==='buergeramt'){
        await page.waitForFunction(()=>document.getElementById('amt-leave').dataset.pretextFit);
        exitFit=await page.locator('#amt-leave').evaluate(el=>{const r=el.getBoundingClientRect();return{fit:el.dataset.pretextFit,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,viewport:[innerWidth,innerHeight],font:getComputedStyle(el).fontSize}});
        assert.ok(!['unavailable','reflow','scroll'].includes(exitFit.fit),'public office exit must fit with Pretext');
        assert.ok(exitFit.left>=0&&exitFit.right<=viewport.width+1&&exitFit.top>=0&&exitFit.bottom<=viewport.height+1,'public office exit remains within the viewport');
      }
      const before=await page.evaluate(()=>({hud:Germany3DBridge.getHUDState(),player:{...Germany3DBridge.player},office:Germany3D.indoorLevel,jobcenter:Germany3D.jobcenter?.active,amt:BuergeramtLevel.active}));
      const arrivalSafety=await page.evaluate(citySafety);assert.deepEqual(arrivalSafety.blockers,[],`${profile}/${level.id} arrival statics/people clearance`);
      await page.screenshot({path:resolve(out,`${profile}-${level.id}.png`)});
      let returnSafety;
      if(!['city','neighbors'].includes(level.id)){
        await page.keyboard.down('KeyW');
        if(level.id==='buergeramt'){const exit=page.locator('#amt-leave:visible,#amt-exit:visible').first();if(mobile)await exit.tap();else await exit.click()}
        else await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!BuergeramtLevel.active&&!Germany3D.indoorLevel&&!Germany3D.jobcenter?.active&&!Germany3D.levelTransition?.active);
        returnSafety=await page.evaluate(citySafety);assert.deepEqual(returnSafety.blockers,[],`${profile}/${level.id} return statics/people clearance`);
        assert.equal(returnSafety.vx,0);assert.equal(returnSafety.vy,0);assert.deepEqual(returnSafety.held,[],`${profile}/${level.id} return clears held input`);
        await page.keyboard.up('KeyW');
        await page.keyboard.press('KeyE');
        if(level.id==='buergeramt')await page.waitForFunction(()=>BuergeramtLevel.active&&!Germany3D.levelTransition?.active);
        else if(level.id==='jobcenter')await page.waitForFunction(()=>Germany3D.jobcenter?.active&&!Germany3D.levelTransition?.active);
        else await page.waitForFunction(id=>Germany3D.indoorLevel===id,level.id);
      }
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(id=>!document.body.classList.contains('preloading')&&document.getElementById('intro').classList.contains('hidden')&&(id==='buergeramt'?BuergeramtLevel.active:id==='jobcenter'?Germany3D.jobcenter?.active:['city','neighbors'].includes(id)||Germany3D.indoorLevel===id),level.id);
      assert.deepEqual(errors,[],`${profile}/${level.id} page errors`);
      assert.deepEqual(failed,[],`${profile}/${level.id} HTTP failures`);
      report.cases.push({profile,id:level.id,before,firstTransition,arrivalSafety,returnSafety,exitFit,refresh:'PASS',errors,failed,verdict:'PASS'});
      console.log(`PASS ${profile}/${level.id}`);
      writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
      await page.close();
    }
    await context.close();
  }
  report.complete=true;
}catch(error){report.error=error.stack;throw error}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}

function citySafety(){
  const b=Germany3DBridge,p=b.player,blockers=[];
  const rectDistance=r=>{const dx=Math.max(r.x-p.x,0,p.x-r.x-r.w),dy=Math.max(r.y-p.y,0,p.y-r.y-r.h);return Math.hypot(dx,dy)};
  const circle=(o,r,label)=>{if(Math.hypot(p.x-o.x,p.y-o.y)<p.r+r-1e-6)blockers.push(label)};
  for(const building of b.buildings)if(p.x>building.x-p.r&&p.x<building.x+building.w+p.r&&p.y>building.y-p.r&&p.y<building.y+building.h+p.r)blockers.push('building:'+building.id);
  for(const tree of b.trees)circle(tree,b.TREE_RADIUS,'tree');
  for(const prop of b.props)if(!prop.decorative&&(!prop.stationFixture||prop.active)){
    if(prop.collisionRect){if(rectDistance(prop.collisionRect)<p.r-1e-6)blockers.push('prop:'+prop.id)}else circle(prop,prop.collisionRadius,'prop:'+prop.id);
  }
  for(const object of b.normObjects)circle(object,object.type==='hedge'?37:object.type==='chairs'?31:26,'norm:'+object.type);
  for(const npc of b.getNPCs())circle(npc,13,'npc:'+npc.id);
  return {blockers,vx:p.vx,vy:p.vy,held:Object.entries(b.getInput()).filter(([,held])=>held).map(([key])=>key),scope:'Independent building/tree/prop/norm/NPC body clearance; vehicle/train sweeps have separate deterministic checks'};
}
