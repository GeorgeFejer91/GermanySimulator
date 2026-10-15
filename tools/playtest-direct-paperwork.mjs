import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(process.env.PAPERWORK_SITE||'.'),output=resolve(process.env.PAPERWORK_OUTPUT||'output/game-completion/direct-paperwork-browser');
mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer((request,response)=>{
  try{
    let path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep))throw Error('Path outside game');
    let bytes=readFileSync(file);
    if(file===resolve(root,'game.js'))bytes=bytes.toString().replace(' function restartAmt(){',' window.__directPaperworkTest={directConfig,restartAmt};\n function restartAmt(){').replace('function loop(now){','window.__paperworkTest={state};function loop(now){');
    if(file===resolve(root,'buergeramt.js'))bytes=bytes.toString().replace('window.BuergeramtLevel={',"window.__directOfficeHandoff=()=>leaveOffice('voluntary',options.onForm);window.BuergeramtLevel={");
    response.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});response.end(bytes);
  }catch{response.writeHead(404);response.end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const sourceFiles=['game.js','buergeramt.js','styles.css','game-hud.js','index.html','assets/vendor/pretext/package.json'];
const revision=()=>Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')]));
const report={revision:revision(),cases:[],limits:['Office success handoff is staged at the production leaveOffice call used by finish, including its close/return/onForm chain; success prerequisites and natural traversal are not claimed.','Headless desktop and Android emulation; physical device and perceptual listening NOT RUN.']};
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});report.browser=browser.version();
  for(const [name,viewport,mobile] of [['desktop',{width:1280,height:800},false],['android',{width:390,height:844},true]])for(const [route,path] of [['page','/buergeramt/'],['query','/?geheim=buergeramt']]){
    const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});context.setDefaultTimeout(90000);
    await context.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};
      const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};
      const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)};
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}${path}`,{waitUntil:'domcontentloaded'});
    console.log(JSON.stringify({name,route,stage:'loaded'}));
    await page.waitForFunction(()=>window.__directPaperworkTest&&window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active&&!document.body.classList.contains('preloading'));
    console.log(JSON.stringify({name,route,stage:'office-ready'}));
    await page.waitForFunction(()=>BuergeramtLevel.active);await page.evaluate(()=>__directOfficeHandoff());await page.locator('#form-modal').waitFor({state:'visible'});await page.waitForFunction(()=>!BuergeramtLevel.active);
    const fields=page.locator('#bureaucracy-form input:not([type=checkbox])');
    async function fill(){
      for(let index=0;index<await fields.count();index++)await fields.nth(index).fill('Hans-Peter Mustermann');
      const selects=page.locator('#bureaucracy-form select');for(let index=0;index<await selects.count();index++)await selects.nth(index).selectOption({index:1});
      const checks=page.locator('#bureaucracy-form input[type=checkbox]');for(let index=0;index<await checks.count();index++)await checks.nth(index).check();
    }
    await fill();console.log(JSON.stringify({name,route,stage:'filled'}));await page.locator('#bureaucracy-form button[type=submit]').click();
    await page.locator('#amt-direct-result').waitFor({state:'visible'});
    const inspect=()=>page.evaluate(()=>({forms:__paperworkTest.state.forms,mission:__paperworkTest.state.mission,dialogue:__paperworkTest.state.dialogue,modal:__paperworkTest.state.modal,resultHidden:document.getElementById('amt-direct-result').hidden,formHidden:document.getElementById('form-modal').hidden,active:__paperworkTest.state.activeForm,title:document.getElementById('amt-direct-result-title').textContent,overflow:document.documentElement.scrollWidth>innerWidth+1}));
    const first=await inspect();assert.equal(first.forms,1);assert.equal(first.mission,1);assert.equal(first.dialogue,false);assert.equal(first.formHidden,true);assert.equal(first.active,null);assert.equal(first.overflow,false);assert.equal(first.title,'ANMELDUNG ABGESCHLOSSEN');
    await page.screenshot({path:resolve(output,name+'-'+route+'-result.png')});
    await page.evaluate(()=>document.getElementById('bureaucracy-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));assert.equal((await inspect()).forms,1);
    const replay=page.locator('#amt-direct-result a');await replay.focus();assert.equal(await replay.evaluate(node=>document.activeElement===node),true);await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.getElementById('amt-direct-result').hidden&&__paperworkTest.state.forms===0);
    const reset=await inspect();assert.equal(reset.mission,0);assert.equal(reset.formHidden,true);assert.equal(reset.active,null);assert.equal(reset.dialogue,false);
    await page.waitForFunction(()=>BuergeramtLevel.active);await page.evaluate(()=>__directOfficeHandoff());await page.locator('#form-modal').waitFor({state:'visible'});await page.waitForFunction(()=>!BuergeramtLevel.active);await fill();console.log(JSON.stringify({name,route,stage:'filled'}));await page.locator('#bureaucracy-form button[type=submit]').click();await page.locator('#amt-direct-result').waitFor({state:'visible'});assert.equal((await inspect()).forms,1);
    assert.deepEqual(errors,[]);report.cases.push({name,route,viewport,first,reset,errors});writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({name,route,result:'PASS'}));await context.close();
  }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
assert.deepEqual(revision(),report.revision,'source remains frozen');console.log(JSON.stringify({cases:report.cases.length,report:resolve(output,'report.json')}));
