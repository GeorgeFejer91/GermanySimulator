import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve('output/neighbors/browser');mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{
  const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+sep))throw Error('path');
  let content=readFileSync(file);
  if(file===resolve(root,'game.js'))content=content.toString().replace('function loop(now){','window.__neighborTest={state,player,jwd,npcs,awardAnmeldung,talkJwdNeighbor,nextDialogue,getAudio:()=>audio};function loop(now){');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content);
}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const report={cases:[],limits:['Seeded registration/home placement; production neighbor dialogue and routes','Muted headless Chromium and Android emulation; no physical Android or listening review']};
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
  for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android',{width:390,height:844}],['android-landscape',{width:844,height:390}],['failed-paint',{width:1280,height:800}]]){
    if(process.env.NEIGHBOR_PROFILE&&name!==process.env.NEIGHBOR_PROFILE)continue;
    console.log(name+': start');
    const context=await browser.newContext({viewport,isMobile:name.startsWith('android'),hasTouch:name.startsWith('android')});
    context.setDefaultTimeout(60000);
    await context.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
      const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)};
    });
    const page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>{if(req.url().includes('/characters/neighbors/'))requests.push(req.url())});
    if(name==='failed-paint')await page.route('**/characters/neighbors/*.webp*',route=>route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__neighborTest&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden);
    assert.equal(requests.length,0,'distant neighbor paint stays out of city startup');
    await page.evaluate(()=>{
      const h=__neighborTest;Object.assign(h.state,{started:true,modal:false,voiceOn:false,mission:1,pettyAuditTimer:10000,quizTimer:10000});
      h.awardAnmeldung();h.jwd.visited=true;h.jwd.exitPending=false;h.jwd.gardenCooldown=10000;
      document.getElementById('intro').classList.add('hidden');document.body.classList.remove('preloading');
      const home=Germany3DBridge.buildings.find(b=>b.id==='jwd-home');Object.assign(h.player,{x:home.doorX,y:home.doorY+55});Germany3D.sync();
    });
    if(name!=='failed-paint')await page.waitForFunction(()=>Germany3D.inspectAssets().jwd.actors.every(n=>n.paint?.loaded));
    else await page.waitForTimeout(1500);
    const cases=[];
    for(const id of ['jwd-parent','jwd-watcher','jwd-swabian']){
      await page.evaluate(id=>{const h=__neighborTest,n=h.npcs.find(n=>n.id===id);h.jwd.atHome=false;h.jwd.exitPending=false;Object.assign(h.player,{x:n.x,y:n.y+42});h.talkJwdNeighbor(n);Germany3D.sync()},id);
      const frames=[];
      for(let sample=0;sample<32;sample++){
        await page.waitForTimeout(125);
        frames.push(await page.evaluate(id=>Germany3D.inspectAssets().jwd.actors.find(n=>n.id===id).paint,id));
        if(name==='failed-paint'||frames.at(-1).state==='listen')break;
      }
      if(name!=='failed-paint'){
        assert.ok(frames.every(f=>f.loaded&&f.visible&&f.row!==5),'caption-only conversation keeps the mouth closed');
        assert.ok(frames.some(f=>['look','greet','listen'].includes(f.state)),'owned conversation has planted interaction states');
        assert.equal(frames.at(-1).state,'listen','entry finishes in a holdable listener');
      }else assert.ok(frames.every(f=>!f.loaded),'failed paint preserves procedural speaker');
      await page.screenshot({path:resolve(out,`${name}-${id}.png`)});
      await page.evaluate(()=>{const h=__neighborTest;while(h.state.dialogue)h.nextDialogue()});
      cases.push({id,frames});
    }
    if(name!=='failed-paint'){
      await page.evaluate(()=>{const h=__neighborTest,n=h.npcs.find(n=>n.id==='jwd-watcher');Object.assign(h.player,{x:n.x,y:n.y+42});h.state.voiceOn=true;h.jwd.met.delete(n.id);h.talkJwdNeighbor(n);Germany3D.sync()});
      await page.waitForFunction(()=>{const d=Germany3DBridge.getNeighborDialogue(),paint=Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-watcher').paint;if(d?.speaking&&d.mediaDuration>0&&d.mediaTime>1.2&&d.mouthOpen>.1&&paint.frame>0&&paint.state==='talk'){window.__neighborSpeechCapture={dialogue:d,paint};return true}return false});
      const speech=await page.evaluate(()=>__neighborSpeechCapture);
      assert.equal(speech.paint.state,'talk');assert.equal(speech.paint.row,5);assert.ok(speech.paint.frame>0);
      await page.evaluate(async()=>{await __neighborTest.getAudio().suspend();Germany3D.sync()});
      const paused=await page.evaluate(()=>({dialogue:Germany3DBridge.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-watcher').paint}));
      await page.waitForTimeout(180);
      const held=await page.evaluate(()=>({dialogue:Germany3DBridge.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-watcher').paint}));
      assert.ok(held.dialogue.paused);assert.equal(held.dialogue.mediaTime,paused.dialogue.mediaTime);assert.equal(held.paint.frame,paused.paint.frame);
      await page.screenshot({path:resolve(out,`${name}-inga-recorded-mouth.png`)});
      if(name==='desktop'){
        await page.evaluate(()=>__neighborTest.getAudio().resume());
        await page.waitForFunction(()=>__neighborTest.state.dialogue&&!__neighborTest.state.dialogueVoiceBusy&&Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-watcher').paint.state==='listen');
        const ended=await page.evaluate(()=>({dialogue:Germany3DBridge.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-watcher').paint,met:__neighborTest.jwd.met.has('jwd-watcher')}));
        assert.equal(ended.dialogue.speaking,false);assert.equal(ended.paint.mouthOpen,0);assert.equal(ended.met,false,'media end cannot complete the introduction');
        cases.push({id:'inga-natural-recorded-completion',ended});
      }
      await page.evaluate(async()=>{await __neighborTest.getAudio().resume();__neighborTest.state.voiceOn=false;while(__neighborTest.state.dialogue)__neighborTest.nextDialogue()});
      cases.push({id:'inga-recorded-native-clock',speech,paused,held});
    }
    await page.evaluate(()=>{
      const h=__neighborTest;h.jwd.atHome=false;h.jwd.exitPending=false;h.jwd.gardenCooldown=10000;
      const n=h.npcs.find(n=>n.id==='jwd-parent');n.jwdWorking=false;n.jwdRoute=[{x:n.x,y:Germany3DBridge.jwdGardens.crossY}];
    });
    const walking=[];
    for(let sample=0;sample<12;sample++){
      await page.waitForTimeout(80);
      walking.push(await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors.find(n=>n.id==='jwd-parent')));
    }
    if(name!=='failed-paint')assert.ok(walking.some(n=>n.paint?.visible&&n.paint.row<4),'accepted travel displays walk paint');
    assert.deepEqual(errors,[]);report.cases.push({name,cases,walking,requests,errors});
    await context.close();console.log(name+': PASS');
  }
  report.complete=true;
}finally{
  writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));server.closeAllConnections();await browser?.close();await new Promise(done=>server.close(done));
}
