import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),output=resolve(process.env.PAPERWORK_OUTPUT||'output/game-completion/paperwork-browser');
mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer((request,response)=>{
  try{
    const path=decodeURIComponent(new URL(request.url,'http://localhost').pathname),file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep))throw Error('Path outside game');
    let bytes=readFileSync(file);
    if(file===resolve(root,'game.js'))bytes=bytes.toString().replace('function loop(now){','window.__paperworkTest={state,showForm,missions,forms,leaveIndoorBuilding};function loop(now){');
    response.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});response.end(bytes);
  }catch{response.writeHead(404);response.end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const sourceFiles=['game.js','styles.css','game-hud.js','index.html','assets/vendor/pretext/package.json'];
const revision=()=>Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')]));
const report={revision:revision(),cases:[],limits:['Mission and form presentation are seeded; no natural office/phone traversal claim.','Headless Chromium and Android emulation; physical Android and perceptual listening NOT RUN.','Media, Web Audio and browser speech remain session-muted.']};
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
  report.browser=browser.version();
  const profiles=[['desktop',{width:1280,height:800},'de',1],['narrow',{width:320,height:760},'de',1],['narrow-en',{width:320,height:760},'en',1],['landscape-en',{width:844,height:390},'en',1],['enlarged',{width:320,height:760},'de',2]];
  for(const [name,viewport,language,enlargement] of profiles){
    if(process.env.PAPERWORK_PROFILE&&name!==process.env.PAPERWORK_PROFILE)continue;
    console.log(JSON.stringify({stage:'start',profile:name}));
    const context=await browser.newContext({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
    context.setDefaultTimeout(90000);
    await context.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
      const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__paperworkTest&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&!document.body.classList.contains('preloading'));
    await page.evaluate(()=>document.fonts.ready);
    const forms=await page.evaluate(()=>__paperworkTest.missions.flatMap((mission,index)=>mission.form?[{type:mission.form,mission:index}]:[]));
    const cases=[];
    for(const form of forms){
      const declarations=await page.evaluate(({form,language,enlargement})=>{
        const game=__paperworkTest;Object.assign(game.state,{started:true,mission:form.mission,forms:0,gameOver:false,voiceOn:false,lang:language});
        document.getElementById('intro').classList.add('hidden');game.showForm(form.type);
        window.__paperworkFontBase??=new WeakMap();
        if(enlargement!==1)for(const node of document.querySelectorAll('#bureaucracy-form span,#bureaucracy-form h2,#bureaucracy-form p,#bureaucracy-form button,#bureaucracy-form input,#bureaucracy-form select')){
          if(!__paperworkFontBase.has(node))__paperworkFontBase.set(node,parseFloat(getComputedStyle(node).fontSize));
          node.style.fontSize=__paperworkFontBase.get(node)*enlargement+'px';
          if(Math.abs(parseFloat(getComputedStyle(node).fontSize)/__paperworkFontBase.get(node)-enlargement)>.01)throw Error('Nonuniform text enlargement');
        }
        return game.forms[form.type].fields.filter(field=>field[0]==='check').map(field=>field[1]);
      },{form,language,enlargement});
      for(const label of declarations){const checkbox=page.getByRole('checkbox',{name:label,exact:true});assert.equal(await checkbox.count(),1,form.type+' accessible declaration');await checkbox.check()}
      const fields=page.locator('#bureaucracy-form input:not([type=checkbox])');
      for(let index=0;index<await fields.count();index++)await fields.nth(index).fill('Hans-Peter Mustermann');
      const selects=page.locator('#bureaucracy-form select');
      for(let index=0;index<await selects.count();index++)await selects.nth(index).selectOption({index:1});
      await page.waitForFunction(()=>[...document.querySelectorAll('#form-fields .check>span')].every(node=>node.dataset.measurement==='pretext-0.0.9'));
      const fit=await page.evaluate(()=>{
        const modal=document.getElementById('form-modal'),paper=document.getElementById('bureaucracy-form');
        return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,paperOverflow:paper.scrollWidth>paper.clientWidth+1,fields:[...paper.querySelectorAll('#form-fields .check>span')].map(node=>({text:node.textContent,measurement:node.dataset.measurement,fit:node.dataset.pretextFit,width:node.clientWidth,height:node.clientHeight,lineHeight:getComputedStyle(node).lineHeight,overflow:node.scrollWidth>node.clientWidth+1})),visible:!modal.hidden};
      });
      if(fit.pageOverflow||fit.paperOverflow||fit.fields.some(field=>field.overflow)){
        writeFileSync(resolve(output,name+'-'+form.type+'-failure.json'),JSON.stringify(fit,null,2)+'\n');
        await page.screenshot({path:resolve(output,name+'-'+form.type+'-failure.png')});
      }
      assert.equal(fit.visible,true);assert.equal(fit.pageOverflow,false,name+' '+form.type+' page overflow');assert.equal(fit.paperOverflow,false,name+' '+form.type+' form overflow');assert.ok(fit.fields.every(field=>!field.overflow),name+' declaration clipping');
      if(['wohnung','citizenship'].includes(form.type))await page.screenshot({path:resolve(output,name+'-'+form.type+'.png')});
      await page.locator('#bureaucracy-form button[type=submit]').click();
      const result=await page.evaluate(()=>({mission:__paperworkTest.state.mission,forms:__paperworkTest.state.forms,active:__paperworkTest.state.activeForm,hidden:document.getElementById('form-modal').hidden}));
      assert.equal(result.mission,form.mission+1);assert.equal(result.forms,1);assert.equal(result.active,null);assert.equal(result.hidden,true);
      await page.evaluate(()=>document.getElementById('bureaucracy-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
      assert.equal(await page.evaluate(()=>__paperworkTest.state.forms),1,'replayed browser submission grants no duplicate');
      cases.push({type:form.type,fit,result});
    }
    assert.deepEqual(errors,[]);report.cases.push({name,viewport,language,enlargement,dpr:await page.evaluate(()=>devicePixelRatio),cases,errors});
    writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');await context.close();
  }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
assert.deepEqual(revision(),report.revision,'the tested source must remain frozen');
console.log(JSON.stringify({profiles:report.cases.length,forms:report.cases.reduce((count,row)=>count+row.cases.length,0),report:resolve(output,'report.json')}));
