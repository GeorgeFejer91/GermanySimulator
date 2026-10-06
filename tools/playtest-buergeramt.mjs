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
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];let passed=false,desktop=null,phone=null;
try{
 desktop=await browser.newPage({viewport:{width:1280,height:800}});
 if(!process.env.GAME_FULL)await desktop.route(/(?:game\.js|world3d\.js|subtitle-layout\.js|quiz-layout\.js|QUIZ-CHARACTER-DICTIONARY\.js|AUDIO-TEXT-LIBRARY\.js|goerlitzer-park\.js)(?:\?|$)/,route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 desktop.on('pageerror',e=>errors.push(`desktop: ${e.message}`));
 desktop.on('console',e=>{if(e.type()==='error')errors.push(`desktop console: ${e.text()}`)});
 desktop.on('response',r=>{if(r.status()>=400)errors.push(`desktop HTTP ${r.status()}: ${r.url()}`)});
 await desktop.goto(base,{waitUntil:process.env.GAME_FULL?'commit':'domcontentloaded',timeout:45000});
 if(process.env.GAME_FULL)await desktop.waitForFunction(()=>window.BuergeramtLevel,null,{timeout:30000});
 if(process.env.GAME_FULL)await desktop.waitForFunction(()=>window.Germany3D?.ready,null,{timeout:60000});
 if(process.env.PAUSE_RENDER&&process.env.GAME_FULL)await desktop.evaluate(()=>{window.Germany3D.sync=()=>{}});
 await desktop.screenshot({path:`${output}/title-desktop.png`});
 await desktop.evaluate(voiceEnabled=>{document.getElementById('intro').classList.add('hidden');window.BuergeramtLevel.open({voiceOn:()=>voiceEnabled,onClose:()=>{},onCancel:()=>window.__amtOutcome='cancelled',onForm:()=>window.__amtOutcome='form'});window.__amtUpdate=BuergeramtLevel.update;BuergeramtLevel.update=()=>{}},!!process.env.DESK_VOICE);
 async function walk(key,frames){await desktop.evaluate(({key,frames})=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));for(let i=0;i<frames;i++)window.__amtUpdate(.05);window.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));window.Germany3D?.sync()},{key,frames})}
 await walk('KeyW',19);if(await desktop.evaluate(()=>BuergeramtLevel.stage!=='walk-sign'))throw new Error('Walking through the entrance failed');
 await walk('KeyW',37);
 if(await desktop.evaluate(()=>!!document.querySelector('#amt-ticket')||!BuergeramtLevel.qrSvg))throw new Error('Expected physical QR without popup');
 await desktop.screenshot({path:`${output}/ticket-desktop.png`});
 const link=await desktop.evaluate(()=>BuergeramtLevel.phoneUrl);
 phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(`phone: ${e.message}`));
 phone.on('console',e=>{if(e.type()==='error')errors.push(`phone console: ${e.text()}`)});
 phone.on('response',r=>{if(r.status()>=400)errors.push(`phone HTTP ${r.status()}: ${r.url()}`)});
 await phone.goto(link,{waitUntil:'commit',timeout:45000});
 let linked=false;
 try{await phone.locator('#phone-ticket:not([hidden])').waitFor({timeout:45000});linked=true}catch{errors.push('Phone pairing did not complete');console.log(JSON.stringify({name:'pairing-timeout',phone:await phone.evaluate(()=>({ready:document.readyState,formHidden:document.getElementById('phone-form')?.hidden,connection:document.getElementById('phone-connect-status')?.textContent,sdk:typeof VDONinjaSDK,link:typeof BuergeramtLink})),desktop:await desktop.evaluate(()=>({stage:BuergeramtLevel.stage,status:document.getElementById('amt-status').textContent,phoneUrlValid:!!BuergeramtLevel.phoneUrl})),errors}))}
 if(linked){
  if(process.env.TEST_RESCAN){const previous=await phone.locator('#phone-number').textContent();await phone.reload({waitUntil:'commit',timeout:45000});await phone.waitForFunction(old=>{const ticket=document.getElementById('phone-ticket'),number=document.getElementById('phone-number');return ticket&&!ticket.hidden&&number?.textContent!==old},previous,{timeout:45000});console.log(JSON.stringify({name:'repeat-scan',previous,next:await phone.locator('#phone-number').textContent()}))}
  await phone.screenshot({path:`${output}/phone-before-name.png`});
  if(branch==='answer'){
   await phone.screenshot({path:`${output}/phone-form.png`});
   await phone.setViewportSize({width:320,height:700});
   await phone.evaluate(()=>{document.documentElement.style.zoom='2'});
   await phone.screenshot({path:`${output}/phone-form-320-zoom200.png`});
   if(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Phone form overflows at 320px and 200% zoom');
   await phone.evaluate(()=>{document.documentElement.style.zoom=''}) ;
   await phone.setViewportSize({width:390,height:844});
  }
  if(!/^B-\d{3}$/.test(await phone.locator('#phone-number').textContent()))throw new Error('Scan did not allocate a lettered number');
  await phone.screenshot({path:`${output}/phone-ticket.png`});
  if(!await desktop.evaluate(()=>BuergeramtLevel.activated&&BuergeramtLevel.stage==='waiting'))throw new Error('Scan did not activate the game ticket');
  await phone.locator('#phone-name').fill('Alex Beispiel');
  await phone.locator('#phone-submit').click();
  await desktop.waitForFunction(()=>BuergeramtLevel.registeredName==='Alex Beispiel',null,{timeout:5000});
  await desktop.evaluate(()=>window.Germany3D?.sync());
  await desktop.screenshot({path:`${output}/waiting-room.png`});
  if(branch==='hidden'){
   await phone.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   await desktop.waitForFunction(()=>BuergeramtLevel.stage==='expired',null,{timeout:15000});
   await desktop.screenshot({path:`${output}/phone-hidden-forfeit.png`});
  }else{
  await walk('KeyD',23);await walk('KeyW',34);
  await desktop.evaluate(()=>BuergeramtLevel.interact());
  if(!await desktop.evaluate(()=>BuergeramtLevel.stage==='early'))throw new Error(`Early-counter approach failed: ${JSON.stringify(await desktop.evaluate(()=>({stage:BuergeramtLevel.stage,view:BuergeramtLevel.view,status:document.getElementById('amt-status').textContent})))}`);
  await desktop.screenshot({path:`${output}/early-reprimand.png`});
  await desktop.locator('#amt-actions button').first().evaluate(el=>el.click());
  await desktop.evaluate(()=>{for(let i=0;i<165;i++)window.__amtUpdate(.1)});
  if(!await desktop.evaluate(()=>BuergeramtLevel.stage==='walk-counter'))throw new Error('The queued ticket was not called');
  if(branch==='late'){
   await desktop.evaluate(()=>{for(let i=0;i<200;i++)window.__amtUpdate(.1)});
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
    try{await desktop.waitForFunction(nativeDirect?()=>!document.getElementById('amt-direct-result').hidden:()=>window.__amtOutcome==='cancelled',null,{timeout:process.env.DESK_VOICE?180000:120000})}
    catch(error){const state=await desktop.evaluate(()=>({stage:BuergeramtLevel.stage,outcome:window.__amtOutcome,line:document.getElementById('amt-line').textContent,timing:BuergeramtLevel.timing,speaking:!!speechSynthesis?.speaking,pending:!!speechSynthesis?.pending}));if(state.stage!=='closed'||state.outcome!=='cancelled'){console.log(JSON.stringify({name:'answer-timeout',state,errors}));throw error}}
   }
  }
  }
 }
 const state=await desktop.evaluate(()=>({stage:window.BuergeramtLevel.stage,outcome:window.__amtOutcome||(!document.getElementById('form-modal').hidden&&document.getElementById('form-code').textContent.startsWith('A38')?'form':null)||(!document.getElementById('amt-direct-result').hidden?'cancelled':null),timing:window.BuergeramtLevel.timing}));
 const receipts=[-1,0,1,2].map(index=>state.timing.cues[index]?.status||'missing');
 const cue=state.timing.cues,desk=state.timing.desk;
 const gap=(start,end)=>Number.isFinite(start)&&Number.isFinite(end)?Math.round(start-end):null;
 const beats=branch==='answer'?{firstResponseMs:gap(cue[0]?.estimatedStartAt,Math.max(desk[0]?.endAt??0,cue[-1]?.estimatedEndAt??0)),officerToClerkMs:gap(desk[1]?.startAt,cue[0]?.estimatedEndAt),clerkToOfficerMs:gap(cue[1]?.estimatedStartAt,desk[1]?.endAt),officerToClerkAgainMs:gap(desk[2]?.startAt,cue[1]?.estimatedEndAt),interruptionAtMs:gap(cue[2]?.estimatedStartAt,desk[2]?.startAt),overlapMs:Math.max(0,Math.round(Math.min(cue[2]?.estimatedEndAt??0,desk[2]?.endAt??0)-Math.max(cue[2]?.estimatedStartAt??0,desk[2]?.startAt??0)))}:null;
 const cues=branch==='answer'?[-1,0,1,2].map(index=>({index,status:cue[index]?.status,readyDelayMs:cue[index]?.readyDelayMs,durationMs:cue[index]?.durationMs,transportSkewMs:cue[index]?.errorMs,receiptJitter:cue[index]?.receiptJitter})):null;
 console.log(JSON.stringify({branch,linked,desktopStage:state.stage,outcome:state.outcome,timing:{rttMs:state.timing.rttMs,oneWayMs:state.timing.oneWayMs,jitterMs:state.timing.jitterMs,clockOffsetMs:state.timing.clockOffsetMs,clockUncertaintyMs:state.timing.clockUncertaintyMs,phoneReadyMs:state.timing.phoneReadyMs,deskStartLagMs:state.timing.deskStartLagMs,deskModes:branch==='answer'?Object.values(desk).map(item=>item.mode):null,receipts,cues,beats},desktopStatus:await desktop.locator('#amt-status').textContent(),phoneStatus:await phone.locator('#phone-status').textContent(),phoneConnectStatus:await phone.locator('#phone-connect-status').textContent(),phoneOs:await phone.evaluate(()=>document.documentElement.dataset.phoneOs),errors,output},null,2));
 passed=linked&&(branch==='answer'?state.outcome==='cancelled'&&state.timing.rttMs!==null&&receipts.every(value=>value==='verified'):branch==='decline'?state.outcome==='form'&&receipts[0]==='declined':state.stage==='expired');
}catch(error){console.error(error);console.error(JSON.stringify({errors}));errors.push(String(error))}finally{
 await Promise.race([Promise.allSettled([phone?.close(),desktop?.close()].filter(Boolean)),new Promise(resolve=>setTimeout(resolve,5000))]);
 await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
 process.exit(passed&&errors.length===0?0:1)
}
