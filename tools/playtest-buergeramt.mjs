import { createRequire } from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:8768/';
const output=process.env.PLAYTEST_OUTPUT||'C:/Users/gfeje/Documents/GitHub/ChatDev/WareHouse/germany-playtest';
const branch=process.env.TEST_BRANCH||'answer';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const errors=[];
try{
 const desktop=await browser.newPage({viewport:{width:1280,height:800}});
 if(!process.env.GAME_FULL)await desktop.route(/(?:game\.js|world3d\.js|subtitle-layout\.js|quiz-layout\.js|QUIZ-CHARACTER-DICTIONARY\.js|AUDIO-TEXT-LIBRARY\.js|goerlitzer-park\.js)(?:\?|$)/,route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 desktop.on('pageerror',e=>errors.push(`desktop: ${e.message}`));
 desktop.on('console',e=>{if(e.type()==='error')errors.push(`desktop console: ${e.text()}`)});
 await desktop.goto(base,{waitUntil:process.env.GAME_FULL?'commit':'domcontentloaded',timeout:45000});
 if(process.env.GAME_FULL)await desktop.waitForFunction(()=>window.BuergeramtLevel,{timeout:30000});
 if(process.env.GAME_FULL)await desktop.waitForFunction(()=>window.Germany3D?.ready,{timeout:30000});
 await desktop.screenshot({path:`${output}/title-desktop.png`});
 await desktop.evaluate(()=>{document.getElementById('intro').classList.add('hidden');window.BuergeramtLevel.open({voiceOn:()=>false,onClose:()=>{},onCancel:()=>window.__amtOutcome='cancelled',onForm:()=>window.__amtOutcome='form'})});
 await desktop.getByRole('button',{name:'NUMMERNAUTOMAT SUCHEN'}).click();
 async function walk(key,frames){await desktop.evaluate(({key,frames})=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));for(let i=0;i<frames;i++)BuergeramtLevel.update(.05);window.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));window.Germany3D?.sync()},{key,frames})}
 await walk('KeyW',44);await walk('KeyA',20);
 await desktop.evaluate(()=>BuergeramtLevel.interact());
 await desktop.locator('#amt-qr svg').waitFor();
 await desktop.screenshot({path:`${output}/ticket-desktop.png`});
 const link=await desktop.locator('#amt-phone-link').getAttribute('href');
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(`phone: ${e.message}`));
 phone.on('console',e=>{if(e.type()==='error')errors.push(`phone console: ${e.text()}`)});
 await phone.goto(link,{waitUntil:'commit',timeout:45000});
 await phone.locator('#phone-ticket').waitFor({timeout:15000});
 await phone.screenshot({path:`${output}/phone-ticket.png`});
 let linked=false;
 try{await phone.locator('#phone-read:not([disabled])').waitFor({timeout:30000});linked=true}catch{}
 if(linked){
  await phone.locator('#phone-read').click();
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='waiting',{timeout:10000});
  await desktop.evaluate(()=>window.Germany3D?.sync());
  await desktop.screenshot({path:`${output}/waiting-room.png`});
  await walk('KeyD',33);await walk('KeyW',17);
  await desktop.evaluate(()=>BuergeramtLevel.interact());
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='early',{timeout:1000});
  await desktop.screenshot({path:`${output}/early-reprimand.png`});
  await desktop.getByRole('button',{name:'ZURÜCK IN DEN WARTERAUM'}).click();
  await desktop.evaluate(()=>{for(let i=0;i<160;i++)BuergeramtLevel.update(.1)});
  await desktop.waitForFunction(()=>BuergeramtLevel.stage==='walk-counter',{timeout:1000});
  if(branch==='late'){
   await desktop.evaluate(()=>{for(let i=0;i<150;i++)BuergeramtLevel.update(.1)});
   await desktop.waitForFunction(()=>BuergeramtLevel.stage==='expired',{timeout:1000});
   await desktop.screenshot({path:`${output}/late-appointment.png`});
  }else{
   await desktop.evaluate(()=>BuergeramtLevel.interact());
   await phone.locator('#phone-call:not([hidden])').waitFor({timeout:15000});
   await phone.screenshot({path:`${output}/incoming-polizei.png`});
   await desktop.screenshot({path:`${output}/counter-call.png`});
   if(branch==='decline'){
    await phone.locator('#phone-decline').click();
    await desktop.getByRole('button',{name:'GESPRÄCH FORTSETZEN'}).click();
    for(let i=0;i<4;i++){await desktop.locator('#amt-actions button').first().click();await desktop.locator('#amt-actions button').first().click()}
    await desktop.waitForFunction(()=>window.__amtOutcome==='form',{timeout:5000});
   }else{
    await phone.locator('#phone-answer').click();
    await desktop.waitForFunction(()=>window.BuergeramtLevel.stage==='cancelled',{timeout:5000});
    await desktop.screenshot({path:`${output}/counter-outrage.png`});
    await phone.screenshot({path:`${output}/police-speaking.png`});
   }
  }
 }
 console.log(JSON.stringify({branch,linked,desktopStage:await desktop.evaluate(()=>window.BuergeramtLevel.stage),outcome:await desktop.evaluate(()=>window.__amtOutcome||null),desktopStatus:await desktop.locator('#amt-status').textContent(),phoneStatus:await phone.locator('#phone-status').textContent(),phoneOs:await phone.evaluate(()=>document.documentElement.dataset.phoneOs),errors,output},null,2));
}finally{await browser.close()}
