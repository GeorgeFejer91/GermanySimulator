import { createRequire } from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:8768/';
const output=process.env.PLAYTEST_OUTPUT||'C:/Users/gfeje/Documents/GitHub/ChatDev/WareHouse/germany-playtest';
const branch=process.env.TEST_BRANCH||'answer';
if(!['answer','decline','hidden','late'].includes(branch))throw new Error(`Unsupported TEST_BRANCH: ${branch}`);
const nativeDirect=!!process.env.GAME_FULL&&new URL(base).searchParams.get('geheim')==='buergeramt';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const errors=[];let passed=false,desktop=null,phone=null;
try{
 desktop=await browser.newPage({viewport:{width:1280,height:800}});
 if(!process.env.GAME_FULL)await desktop.route(/(?:game\.js|world3d\.js|subtitle-layout\.js|quiz-layout\.js|QUIZ-CHARACTER-DICTIONARY\.js|AUDIO-TEXT-LIBRARY\.js|goerlitzer-park\.js)(?:\?|$)/,route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 desktop.on('pageerror',e=>errors.push(`desktop: ${e.message}`));
 desktop.on('console',e=>{if(e.type()==='error')errors.push(`desktop console: ${e.text()}`)});
 desktop.on('response',r=>{if(r.status()>=400)errors.push(`desktop HTTP ${r.status()}: ${r.url()}`)});
 await desktop.goto(base,{waitUntil:process.env.GAME_FULL?'commit':'domcontentloaded',timeout:45000});
 if(process.env.GAME_FULL)await desktop.waitForFunction(()=>window.BuergeramtLevel,null,{timeout:30000});
 if(process.env.GAME_FULL)await desktop.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:30000});
 if(process.env.PAUSE_RENDER&&process.env.GAME_FULL)await desktop.evaluate(()=>{window.Germany3D.sync=()=>{}});
 await desktop.screenshot({path:`${output}/title-desktop.png`});
 await desktop.evaluate(()=>{document.getElementById('intro').classList.add('hidden');window.BuergeramtLevel.open({voiceOn:()=>false,onClose:()=>{},onCancel:()=>window.__amtOutcome='cancelled',onForm:()=>window.__amtOutcome='form'})});
 async function walk(key,frames){await desktop.evaluate(({key,frames})=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));for(let i=0;i<frames;i++)BuergeramtLevel.update(.05);window.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));window.Germany3D?.sync()},{key,frames})}
 await walk('KeyW',10);await desktop.evaluate(()=>BuergeramtLevel.interact());
 await walk('KeyW',37);
 await desktop.evaluate(()=>BuergeramtLevel.interact());
 await desktop.locator('#amt-qr svg').waitFor();
 await desktop.screenshot({path:`${output}/ticket-desktop.png`});
 const link=await desktop.locator('#amt-phone-link').getAttribute('href');
 phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(`phone: ${e.message}`));
 phone.on('console',e=>{if(e.type()==='error')errors.push(`phone console: ${e.text()}`)});
 phone.on('response',r=>{if(r.status()>=400)errors.push(`phone HTTP ${r.status()}: ${r.url()}`)});
 await phone.goto(link,{waitUntil:'commit',timeout:45000});
 let linked=false;
 try{await phone.locator('#phone-submit:not([disabled])').waitFor({timeout:30000});linked=true}catch{errors.push('Phone pairing did not complete')}
 if(linked){
  if(branch==='answer'){
   await phone.screenshot({path:`${output}/phone-form.png`});
   await phone.setViewportSize({width:320,height:700});
   await phone.evaluate(()=>{document.documentElement.style.zoom='2'});
   await phone.screenshot({path:`${output}/phone-form-320-zoom200.png`});
   if(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Phone form overflows at 320px and 200% zoom');
   await phone.evaluate(()=>{document.documentElement.style.zoom=''}) ;
   await phone.setViewportSize({width:390,height:844});
  }
  await phone.locator('#phone-name').fill('Alex Beispiel');
  await phone.locator('#phone-submit').click();
  await phone.locator('#phone-ticket:not([hidden])').waitFor({timeout:15000});
  await phone.screenshot({path:`${output}/phone-ticket.png`});
  if(await desktop.evaluate(()=>BuergeramtLevel.activated))throw new Error('Queue activated before registration counter');
  console.log(JSON.stringify({beforeRegistration:await desktop.evaluate(()=>({stage:BuergeramtLevel.stage,active:BuergeramtLevel.active,buttons:[...document.querySelectorAll('#amt-actions button')].map(x=>x.textContent),rootClass:document.getElementById('amt-level').className,buttonDisplay:getComputedStyle(document.querySelector('#amt-actions button')).display}))}));
  await desktop.locator('#amt-actions button').first().evaluate(el=>el.click());
  await walk('KeyA',26);await walk('KeyS',15);
  await desktop.evaluate(()=>BuergeramtLevel.interact());
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='registration-done',null,{timeout:5000});
  await desktop.locator('#amt-actions button').first().evaluate(el=>el.click());
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='waiting',null,{timeout:10000});
  await desktop.evaluate(()=>window.Germany3D?.sync());
  await desktop.screenshot({path:`${output}/waiting-room.png`});
  if(branch==='hidden'){
   await phone.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   await desktop.waitForFunction(()=>BuergeramtLevel.stage==='expired',null,{timeout:15000});
   await desktop.screenshot({path:`${output}/phone-hidden-forfeit.png`});
  }else{
  await walk('KeyD',48);await walk('KeyW',50);
  await desktop.evaluate(()=>BuergeramtLevel.interact());
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='early',null,{timeout:1000});
  await desktop.screenshot({path:`${output}/early-reprimand.png`});
  await desktop.locator('#amt-actions button').first().evaluate(el=>el.click());
  await desktop.evaluate(()=>{for(let i=0;i<165;i++)BuergeramtLevel.update(.1)});
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='walk-counter',null,{timeout:1000});
  if(branch==='late'){
   await desktop.evaluate(()=>{for(let i=0;i<200;i++)BuergeramtLevel.update(.1)});
   await desktop.waitForFunction(()=>BuergeramtLevel.stage==='expired',null,{timeout:1000});
   await desktop.screenshot({path:`${output}/late-appointment.png`});
  }else{
   await desktop.evaluate(()=>BuergeramtLevel.interact());
   await phone.locator('#phone-call:not([hidden])').waitFor({timeout:15000});
   await phone.screenshot({path:`${output}/incoming-polizei.png`});
   await desktop.screenshot({path:`${output}/counter-call.png`});
   if(branch==='decline'){
    await phone.locator('#phone-decline').click();
    await desktop.locator('#amt-actions button').first().evaluate(el=>el.click());
    for(let i=0;i<4;i++){await desktop.locator('#amt-actions button').first().evaluate(el=>el.click());await desktop.locator('#amt-actions button').first().evaluate(el=>el.click())}
    try{await desktop.waitForFunction(nativeDirect?()=>!document.getElementById('form-modal').hidden&&document.getElementById('form-code').textContent.startsWith('A38'):()=>window.__amtOutcome==='form',null,{timeout:5000})}
    catch(error){console.log(JSON.stringify({name:'decline-terminal-timeout',state:await desktop.evaluate(()=>({stage:BuergeramtLevel.stage,active:BuergeramtLevel.active,formVisible:!document.getElementById('form-modal').hidden,formCode:document.getElementById('form-code').textContent,directResultVisible:!document.getElementById('amt-direct-result').hidden,actions:[...document.querySelectorAll('#amt-actions button')].map(x=>x.textContent),line:document.getElementById('amt-line').textContent})),errors}));throw error}
   }else{
    await phone.locator('#phone-answer').click();
    await desktop.waitForFunction(()=>window.BuergeramtLevel.stage==='cancelled',null,{timeout:5000});
    await desktop.screenshot({path:`${output}/counter-outrage.png`});
    await phone.screenshot({path:`${output}/police-speaking.png`});
    await desktop.waitForFunction(nativeDirect?()=>!document.getElementById('amt-direct-result').hidden:()=>window.__amtOutcome==='cancelled',null,{timeout:120000});
   }
  }
  }
 }
 const state=await desktop.evaluate(()=>({stage:window.BuergeramtLevel.stage,outcome:window.__amtOutcome||(!document.getElementById('form-modal').hidden&&document.getElementById('form-code').textContent.startsWith('A38')?'form':null)||(!document.getElementById('amt-direct-result').hidden?'cancelled':null)}));
 console.log(JSON.stringify({branch,linked,desktopStage:state.stage,outcome:state.outcome,desktopStatus:await desktop.locator('#amt-status').textContent(),phoneStatus:await phone.locator('#phone-status').textContent(),phoneConnectStatus:await phone.locator('#phone-connect-status').textContent(),phoneOs:await phone.evaluate(()=>document.documentElement.dataset.phoneOs),errors,output},null,2));
 passed=linked&&(branch==='answer'?state.outcome==='cancelled':branch==='decline'?state.outcome==='form':state.stage==='expired');
}catch(error){console.error(error);errors.push(String(error))}finally{
 await Promise.race([Promise.allSettled([phone?.close(),desktop?.close()].filter(Boolean)),new Promise(resolve=>setTimeout(resolve,5000))]);
 await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
 process.exit(passed&&errors.length===0?0:1)
}
