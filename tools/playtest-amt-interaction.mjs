import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.INTERACTION_OUTPUT||'output/amt-interaction');mkdirSync(out,{recursive:true});
const host=readFileSync('buergeramt.js','utf8');
const seam=`window.__amtInteraction={seed(kind,yaw=0,stageName='walk-sign'){
 options.voiceOn=()=>false;options.cinematics=false;omen.phase='';for(const actor of characters){actor.x=100;actor.z=100}
 view.pitch=0;Object.assign(view,{x:0,z:0,yaw});
 if(kind==='patron'){view.x=-5.9;view.z=3.65}
 if(kind==='walker'||kind==='portrait-negative'||kind==='courier'){if(kind==='portrait-negative'){view.x=3.4;view.z=4.8}const actor=characters.find(n=>n.id===(kind==='courier'?'aktenkurier':'formularsammler'));actor.x=view.x;actor.z=view.z-2.25;actor.returning={phase:.5,direction:1}}
 if(kind==='desk'){view.x=counterXs[2];view.z=counter.z+2.4}
 if(kind==='portrait'){view.x=3.4;view.z=3;view.yaw=Math.PI}
 activated=false;registeredName='';deadline=0;setStage(stageName);
},step:dt=>update(dt)};`;
const server=createServer((req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep))throw Error('path');let data=readFileSync(file);if(file===resolve('buergeramt.js'))data=host.replace('window.BuergeramtLevel=',seam+'window.BuergeramtLevel=');const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const report={sourceHash:createHash('sha256').update(host).digest('hex'),cases:[],limits:['Forced position and stage; production keyboard, touch, selector and dialogue','Android emulation; no physical device','All media/Web Audio/speech muted; no listening review']};
try{for(const [name,width,height,mobile] of [['desktop',1280,800,false],['android-portrait',390,844,true]]){
 console.log(name,'boot');const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const g=this.context.createGain();g.gain.value=0;connect.call(g,target);return connect.call(this,g,...args)}return connect.call(this,target,...args)};const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;speak(u)}});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.officeAssetsReady,null,{timeout:120000});
 await page.evaluate(()=>{BuergeramtLevel.replay({voiceOn:()=>false,cinematics:false});BuergeramtLevel.update=()=>{}});
 for(const [kind,yaw,stageName,expected] of [['patron',0,'walk-sign','character'],['patron',55*Math.PI/180,'walk-counter','character'],['walker',0,'waiting','character'],['courier',0,'walk-sign','character'],['portrait-negative',0,'walk-sign','character'],['desk',0,'walk-sign','early'],['portrait',Math.PI,'walk-sign','portrait'],['walker',Math.PI,'walk-sign','walk-sign']]){
  await page.evaluate(args=>{BuergeramtLevel.replay({voiceOn:()=>false,cinematics:false});__amtInteraction.seed(...args);Germany3D.sync()},[kind,yaw,stageName]);
  const prompt=await page.locator('#amt-nearby').textContent();await page.keyboard.press('e');
  const result=await page.evaluate(()=>({stage:BuergeramtLevel.stage,speaker:document.getElementById('amt-speaker').textContent,mood:BuergeramtLevel.characterMood?.id}));assert.equal(result.stage,expected,`${name}: ${kind}, ${stageName}`);
  if(kind==='portrait-negative')assert.equal(result.mood,'formularsammler');
  if(kind==='patron')assert.equal(result.speaker,'KONRAD WOHNUNGSZETTEL');
  if(kind==='courier')assert.equal(result.mood,'aktenkurier');
  await page.screenshot({path:resolve(out,`${name}-${kind}-${stageName}.png`)});report.cases.push({name,kind,yaw,stageName,prompt,...result});
 }
 if(mobile){await page.evaluate(()=>{BuergeramtLevel.replay({voiceOn:()=>false,cinematics:false});__amtInteraction.seed('patron');Germany3D.sync()});await page.touchscreen.tap(width/2,height*.54);await page.touchscreen.tap(width/2,height*.54);assert.equal(await page.evaluate(()=>BuergeramtLevel.stage),'character');report.cases.push({name,kind:'double tap',stage:'character'})}
 assert.deepEqual(errors,[]);console.log(name,'PASS');await context.close();
}}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(done=>server.close(done))}
