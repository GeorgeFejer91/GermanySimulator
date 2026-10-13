// Silent Chromium with production transport, queue, renderer and input handlers.
// Private seams supply signaling, repeatable legal poses and accelerated scene time.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const fallback=process.env.CODEX_MCP_NODE_PATH?resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'):'playwright';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||fallback);
const root=resolve('.'),out=resolve('output/playwright/multiple-tickets');mkdirSync(out,{recursive:true});
const files=['buergeramt.js','buergeramt-link.js','buergeramt-phone.js','buergeramt-phone.html','buergeramt-fit.js','buergeramt.css','buergeramt-touch-target.js','world3d.js','game.js','index.html','tools/playtest-multiple-tickets.mjs'];
const sources=new Map(files.map(file=>[file,readFileSync(file)]));
const adapter=`
const NativeLink=BuergeramtLink;window.BuergeramtLink=class extends NativeLink{
 async start(){window.__multipleLink=this;window.__multipleChannels=new Map();}
};
window.__prepareMultipleChannel=peer=>{
 const channel=Object.assign(new EventTarget(),{readyState:'connecting',bufferedAmount:0,
  send:message=>window.__multipleOutbound(peer,JSON.parse(message)),
  close(){this.readyState='closed';this.dispatchEvent(new Event('close'))}});
 __multipleChannels.set(peer,channel);__multipleLink.attach(peer,channel);
};
window.__openMultipleChannel=peer=>{const channel=__multipleChannels.get(peer);channel.readyState='open';channel.dispatchEvent(new Event('open'))};
window.__receiveMultipleMessage=(peer,message)=>__multipleChannels.get(peer)?.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(message)}));
`;
const seam=`
window.__multipleTickets={
 pose(x,z,yaw=0,pitch=0){clearOfficeInput();if(officeBlocked(x,z))throw Error('Solid pose '+x+','+z);Object.assign(view,{x,z,yaw,pitch});view.positionGeneration++;update(0);return{view:{...view},stage,nearest:nearestCounter()};},
 advance(seconds){const start=visualClock;let steps=0;while(visualClock-start<seconds){if(++steps>Math.ceil(seconds/.025)+2)throw Error('Queue clock stalled at '+stage);update(.05)}return{steps,advanced:visualClock-start,stage};},
 inspect(){return{peer:activePhonePeer,stage,queueIndex,number,view:{...view},tickets:[...phoneTickets.values()].map(ticket=>({...ticket})),calls:BuergeramtLevel.queueCalls};}
};
window.__multipleBeeps=[];
const originalQueueBeep=queueBeep;queueBeep=()=>{__multipleBeeps.push({index:queueIndex,calls:[...counterCalls]});originalQueueBeep()};
`;
const screenSeam=`window.__multipleClerkPoint=function(desk){const actor=amtCharacters.find(actor=>actor.counter===desk);if(!actor)return null;const box=new T.Box3().setFromObject(actor.mesh),point=box.getCenter(new T.Vector3());point.y=box.max.y-(box.max.y-box.min.y)*.2;point.project(amtCamera);const x=(point.x+1)*innerWidth/2,y=(1-point.y)*innerHeight/2;return{x,y,selection:pickAmtInteraction(x,y),position:[actor.mesh.position.x,actor.mesh.position.y,actor.mesh.position.z],nativeOpacity:actor.mesh.material.opacity}};`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.ttf':'font/ttf','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep))throw Error('path');let bytes=sources.get(file.slice(root.length+1).split(sep).join('/'))||readFileSync(file);if(file===resolve('buergeramt-link.js'))bytes=bytes.toString()+adapter;if(file===resolve('game.js'))bytes=bytes.toString().replace('const directConfig={','const directConfig=window.__multipleConfig={cinematics:false,');if(file===resolve('buergeramt.js'))bytes=bytes.toString().replace('window.BuergeramtLevel={',seam+'window.BuergeramtLevel={');if(file===resolve('world3d.js'))bytes=bytes.toString().replace('window.Germany3D={',screenSeam+'window.Germany3D={');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes)}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--use-gl=angle','--use-angle='+ (process.env.MULTIPLE_GPU==='software'?'swiftshader':'d3d11')]});
const report={complete:false,revision:Object.fromEntries([...sources].map(([file,bytes])=>[file,createHash('sha256').update(bytes).digest('hex')])),cases:[],limits:['Three separate phone browser contexts, production AmtLink validation/sequence and host queue; simulated WebRTC signaling and transport delivery','Direct-office route, legal forced approach and accelerated scene clock; no natural city mission-chain or physical-phone evidence','Real world geometry and rendering retained; desktop Chromium and Android emulation; audio logic enabled and all native outputs muted, no listening review']};
let activePage,activeCase;
const silent=()=>{Math.random=()=>.6;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return play.apply(this,args)};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const gain=this.context.createGain();gain.gain.value=0;connect.call(gain,target);return connect.call(this,gain,...args)}return connect.call(this,target,...args)};const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{utterance.volume=0;speak(utterance)}};
async function rendered(page){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));}
try{
 for(const [profile,width,height,mobile] of [['desktop',1280,800,false],['android-portrait',390,844,true]]){
  if(process.env.MULTIPLE_CASE&&!process.env.MULTIPLE_CASE.split(',').includes(profile))continue;
  const hostContext=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),phoneContexts=[];
  await hostContext.addInitScript(silent);const office=await hostContext.newPage(),phones=[],messages=[],errors=[];
  for(let i=0;i<3;i++){const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await context.addInitScript(silent);phoneContexts.push(context);phones.push(await context.newPage());}
  for(const [index,page] of [office,...phones].entries())page.on('pageerror',error=>errors.push({context:index,message:error.message}));
  let epoch=0,transportFailures=[];
  await office.exposeBinding('__multipleOutbound',async(_,peer,message)=>{messages.push({epoch,sender:'host',peer,...message});const phone=phones[Number(peer.slice(-1))-1];if(!phone||phone.isClosed())return;try{await phone.evaluate(message=>__receiveMultipleMessage('host',message),message)}catch(error){transportFailures.push({peer,type:message.type,error:error.message})}});
  for(let i=0;i<phones.length;i++)await phones[i].exposeBinding('__multipleOutbound',async(_,peer,message)=>{const identity='phone-'+(i+1);messages.push({epoch,sender:identity,peer,...message});try{await office.evaluate(({identity,message})=>__receiveMultipleMessage(identity,message),{identity,message})}catch(error){transportFailures.push({peer:identity,type:message.type,error:error.message})}});
  console.log(profile,'boot');await office.goto(`http://127.0.0.1:${server.address().port}/?geheim=buergeramt`,{waitUntil:'domcontentloaded',timeout:120000});
  await office.waitForFunction(()=>BuergeramtLevel.active&&Germany3D?.officeAssetsReady&&window.__multipleLink,null,{timeout:120000});
  await office.evaluate(()=>{window.__multipleUpdate=BuergeramtLevel.update;BuergeramtLevel.update=()=>{}});
  for(let selected=0;selected<3;selected++){
   epoch++;const label=profile+'-phone-'+(selected+1),result={label,profile,selectedPeer:'phone-'+(selected+1),verdict:'PENDING',messages:[],errors:[]};report.cases.push(result);activePage=office;activeCase=result;
   if(selected>0)await office.evaluate(()=>BuergeramtLevel.replay(__multipleConfig));
   const url=await office.evaluate(()=>BuergeramtLevel.phoneUrl),before=messages.length;
   for(let i=0;i<phones.length;i++){
    await phones[i].goto(url,{waitUntil:'domcontentloaded'});await phones[i].waitForFunction(()=>window.__multipleLink);
    assert.equal(await phones[i].locator('#phone-submit').isEnabled(),true);assert.equal(await phones[i].locator('#phone-form').isVisible(),true);
    await phones[i].locator('#phone-name').fill(['Erika Muster','Otto Muster','Luise Muster'][i]);await phones[i].locator('#phone-submit').click();
    assert.equal(messages.slice(before).some(message=>message.sender==='phone-'+(i+1)&&message.type==='register'),false,'early submit must wait for admission');
    await phones[i].evaluate(()=>__prepareMultipleChannel('host'));await office.evaluate(peer=>__prepareMultipleChannel(peer),'phone-'+(i+1));
    await office.evaluate(peer=>__openMultipleChannel(peer),'phone-'+(i+1));await phones[i].evaluate(()=>__openMultipleChannel('host'));
    await phones[i].locator('#phone-ticket:not([hidden])').waitFor();
   }
   await office.waitForFunction(()=>BuergeramtLevel.tickets.length===3&&BuergeramtLevel.tickets.every(ticket=>ticket.received));
   const allocation=await office.evaluate(()=>__multipleTickets.inspect());result.allocation=allocation;assert.equal(new Set(allocation.tickets.map(ticket=>ticket.number)).size,3);assert.equal(new Set(allocation.tickets.map(ticket=>ticket.peer)).size,3);
   for(let i=0;i<phones.length;i++){assert.equal(phones[i].url(),url);assert.equal(await phones[i].locator('#phone-number').textContent(),allocation.tickets.find(ticket=>ticket.peer==='phone-'+(i+1)).number);}
   const calls=await office.evaluate(()=>{let steps=0;while(BuergeramtLevel.tickets.some(ticket=>!ticket.called)){if(++steps>1200)throw Error('Tickets never called');__multipleUpdate(.05)}return __multipleTickets.inspect()});result.calls=calls;assert.equal(calls.tickets.filter(ticket=>ticket.called).length,3);
   const row=allocation.tickets.find(ticket=>ticket.peer===result.selectedPeer),hold=await office.evaluate(()=>__multipleTickets.advance(13.1));result.hold=hold;
   const held=await office.evaluate(()=>__multipleTickets.inspect());assert.equal(held.tickets.length,3);for(const ticket of held.tickets){assert.equal(held.calls[ticket.counter-1].number,ticket.number);assert(ticket.deadline>0,'called ticket must survive the old 12.8s window');}
   await office.evaluate(()=>__multipleTickets.pose(0,-.2,0,0));await rendered(office);await office.screenshot({path:resolve(out,label+'-held-anzeige.png')});
   await phones[selected].screenshot({path:resolve(out,label+'-called-ticket.png'),fullPage:true});
   const counterXs=[-5.8,-1.6,3.9,6.2],x=counterXs[row.counter-1],approach=await office.evaluate(({x,yaw})=>__multipleTickets.pose(x,-6.2,yaw,0),{x,yaw:mobile?.14:.45});result.approach=approach;assert.equal(approach.nearest,row.counter);
   await rendered(office);await office.screenshot({path:resolve(out,label+'-approach.png')});
   const point=await office.evaluate(desk=>__multipleClerkPoint(desk),row.counter);result.target=point;assert(point&&point.x>=0&&point.x<=width&&point.y>=0&&point.y<=height,'clerk must be visible before interaction');assert.equal(point.selection?.desk,row.counter);
   if(profile==='desktop'&&selected!==1){
    result.click=point;await office.mouse.click(point.x,point.y);
   }else await office.keyboard.press('e');
   await office.waitForFunction(peer=>__multipleTickets.inspect().peer===peer&&['counter','phone-warning','reply'].includes(BuergeramtLevel.stage),result.selectedPeer);
   await phones[selected].locator('#phone-call:not([hidden])').waitFor({timeout:15000});
   await rendered(office);await office.screenshot({path:resolve(out,label+'-admitted-clerk.png')});await phones[selected].screenshot({path:resolve(out,label+'-police-call.png')});
   const routed=messages.slice(before);for(let i=0;i<phones.length;i++){const peer='phone-'+(i+1),admitted=routed.filter(message=>message.sender==='host'&&message.peer===peer&&['counter-start','call-arm','call'].includes(message.type));assert.equal(admitted.length>0,i===selected,'counter/call packets must target only selected peer');assert.equal(await phones[i].locator('#phone-call').isVisible(),i===selected);}
   const other=(selected+1)%3,otherPeer='phone-'+(other+1);await office.evaluate(peer=>__multipleChannels.get(peer).close(),otherPeer);
   await office.waitForFunction(peer=>!BuergeramtLevel.tickets.some(ticket=>ticket.peer===peer),otherPeer);assert.equal(await office.evaluate(()=>BuergeramtLevel.phoneUrl),url);assert.equal(await phones[selected].locator('#phone-call').isVisible(),true);
   const remaining=(selected+2)%3,remainingPeer='phone-'+(remaining+1);await phones[remaining].evaluate(()=>__multipleLink.send('phone-hidden'));
   await office.waitForFunction(peer=>!BuergeramtLevel.tickets.some(ticket=>ticket.peer===peer),remainingPeer);assert.equal(await office.evaluate(()=>BuergeramtLevel.phoneUrl),url);
   const beeps=await office.evaluate(()=>__multipleBeeps);for(let i=1;i<beeps.length;i++)assert.notDeepEqual(beeps[i].calls,beeps[i-1].calls,'beeps require a changed board call');
   result.beeps=beeps;result.messages=routed;result.afterDisconnect=await office.evaluate(()=>__multipleTickets.inspect());result.errors=[...errors];result.transportFailures=[...transportFailures];assert.deepEqual(errors,[]);assert.deepEqual(transportFailures,[]);result.verdict='PASS';console.log(label,'PASS, Schalter',row.counter);
  }
  await hostContext.close();for(const context of phoneContexts)await context.close();activePage=activeCase=null;
 }
 report.complete=true;
}catch(error){report.failure=error.stack;if(activeCase){activeCase.verdict='FAIL';activeCase.failureState=await activePage.evaluate(()=>__multipleTickets.inspect()).catch(()=>null);await activePage.screenshot({path:resolve(out,activeCase.label+'-failure.png')}).catch(()=>{})}throw error}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));server.closeAllConnections();await browser.close();await new Promise(done=>server.close(done));}
