// Real city and Bürgeramt controllers in a muted browser; the renderer is
// omitted so this regression isolates the audio ownership handoff.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'game.js'),'utf8');
const marker='requestAnimationFrame(loop);\n})();';
if(!source.includes(marker))throw new Error('City loop insertion point changed');
const probe=`window.__amtAudioHandoff={
 ready(){startupNpcsCaptured=true;window.Germany3D={startupReady:true,sync(){},isWorldPointVisible(){return false}};refreshStartup()},
 prepare(){stopSpeech();state.started=true;state.modal=false;document.getElementById('intro').classList.add('hidden');document.getElementById('humor-modal').hidden=true},
 startTrain(){queueStimulus({family:'train',priority:STIMULUS_PRIORITY.CRITICAL,ambient:false,recording:'./test-train.wav',start:()=>{window.__trainStartedAt=performance.now()},done:()=>{window.__trainEndedAt=performance.now();setTimeout(()=>{window.BuergeramtLevel.update(.1);window.__gap50={busy:audioTextActive(),speech:window.__officeSpeech.length}},50);setTimeout(()=>{window.BuergeramtLevel.update(.1);window.__gap350={busy:audioTextActive(),speech:window.__officeSpeech.length}},350)}})},
 enter(){bureaucrat({id:'buergeramt'},missions[0])},
 snapshot(){const subtitle=document.getElementById('english-subtitle');return{cityBusy:audioTextActive(),family:activeStimulus?.family||null,office:window.BuergeramtLevel?.stage,trainTextHidden:document.getElementById('police-bark').hidden&&subtitle.hidden&&!subtitle.textContent,trainStartedAt:window.__trainStartedAt||null,trainEndedAt:window.__trainEndedAt||null,speech:window.__officeSpeech.length,gap50:window.__gap50||null,gap350:window.__gap350||null}}
};
`;
const instrumented=source.replace(marker,probe+marker);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server=createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+pathname.replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 try{response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});createReadStream(file).on('error',()=>response.destroy()).pipe(response)}
 catch{response.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile'});
  const page=await context.newPage(),errors=[];
  await page.addInitScript(()=>{
   window.__officeSpeech=[];
   window.__audioContexts=0;
   window.AudioContext=new Proxy(window.AudioContext,{construct(target,args){window.__audioContexts++;return Reflect.construct(target,args)}});
   const speech={speaking:false,pending:false,paused:false,getVoices:()=>[],cancel(){this.speaking=false;this.pending=false},pause(){this.paused=true},resume(){this.paused=false},speak(utterance){this.speaking=true;window.__officeSpeech.push({text:utterance.text,at:performance.now()});utterance.onstart?.()}};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:speech});
  });
  await page.route('**/game.js?*',route=>route.fulfill({status:200,contentType:'text/javascript',body:instrumented}));
  await page.route('**/world3d.js?*',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
  await page.route('**/test-train.wav',route=>{
   const samples=8000*2,buffer=Buffer.alloc(44+samples*2);
   buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(8000,24);buffer.writeUInt32LE(16000,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);
   return route.fulfill({status:200,contentType:'audio/wav',body:buffer});
  });
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.__amtAudioHandoff.ready());
  await page.locator('#start').click();
  await page.evaluate(()=>window.__amtAudioHandoff.prepare());
  await page.evaluate(()=>window.__amtAudioHandoff.startTrain());
  await page.waitForFunction(()=>window.__amtAudioHandoff.snapshot().trainStartedAt!==null);
  const result=await page.evaluate(()=>{
   const probe=window.__amtAudioHandoff,before=window.__officeSpeech.length,audioContexts=window.__audioContexts;
   probe.enter();
   const level=window.BuergeramtLevel;
   dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<16;i++)level.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));
   for(let i=0;i<90;i++)level.update(.1);
   return{before,after:window.__officeSpeech.length,audioContexts,afterAudioContexts:window.__audioContexts,...probe.snapshot()};
  });
  if(result.office!=='walk-sign'||!result.cityBusy||result.family!=='train'||!result.trainTextHidden||result.after!==result.before||result.afterAudioContexts!==result.audioContexts)throw new Error(`${name}: office audio started or train displayed text: ${JSON.stringify(result)}`);
  await page.waitForFunction(()=>window.__amtAudioHandoff.snapshot().gap350!==null,null,{timeout:10000});
  const final=await page.evaluate(()=>window.__amtAudioHandoff.snapshot());
  if(!final.gap50.busy||final.gap50.speech!==result.before||final.gap350.busy||final.gap350.speech!==result.before+1||errors.length)throw new Error(`${name}: audio gap failed: ${JSON.stringify({final,errors})}`);
  console.log(JSON.stringify({name,trainMs:Math.round(final.trainEndedAt-final.trainStartedAt),gap50:final.gap50,gap350:final.gap350}));
  await context.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
