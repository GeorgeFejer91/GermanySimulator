import { createRequire } from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.GAME_URL||'http://127.0.0.1:8770/index.html';
const output=process.env.PLAYTEST_OUTPUT||'C:/Users/gfeje/Documents/GitHub/ChatDev/WareHouse/germany-playtest';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['mobile',{width:390,height:844}],['narrow',{width:320,height:700}]]){
  const page=await browser.newPage({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  page.on('requestfailed',r=>errors.push(`${name} request: ${r.url()} ${r.failure()?.errorText}`));
  await page.goto(`${url}?geheim=buergeramt`,{waitUntil:'commit',timeout:45000});
  await page.waitForFunction(()=>window.BuergeramtLevel?.active,{timeout:60000});
  await page.waitForFunction(()=>window.Germany3D?.ready,{timeout:60000});
  await page.evaluate(()=>window.Germany3D.sync());
  await page.screenshot({path:`${output}/world-${name}.png`});
  await page.getByRole('button',{name:'NUMMERNAUTOMAT SUCHEN'}).click();
  await page.evaluate(()=>window.Germany3D.sync());
  await page.waitForFunction(()=>document.getElementById('amt-objective').dataset.pretextFit,{timeout:10000});
  await page.screenshot({path:`${output}/world-walk-${name}.png`});
  if(name==='desktop'){
   await page.evaluate(()=>{for(const [code,frames] of [['KeyW',60],['KeyD',13]]){dispatchEvent(new KeyboardEvent('keydown',{code}));for(let i=0;i<frames;i++)BuergeramtLevel.update(.05);dispatchEvent(new KeyboardEvent('keyup',{code}))}Germany3D.sync()});
   await page.screenshot({path:`${output}/world-counter-closeup.png`});
  }
  const result=await page.evaluate(()=>({stage:BuergeramtLevel.stage,direct:document.body.classList.contains('amt-direct-mode'),restartVisible:getComputedStyle(document.getElementById('amt-direct-reset')).display!=='none',renderer:Germany3D.ready,pretext:document.getElementById('amt-objective').dataset.pretextFit,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1}));
  console.log(JSON.stringify({name,...result}));
  if(name==='desktop'){
   await page.getByRole('button',{name:'AMT VERLASSEN'}).click();
   await page.locator('#amt-direct-result:not([hidden])').waitFor();
   await page.screenshot({path:`${output}/world-direct-result.png`});
   await page.getByRole('link',{name:'NEUE NUMMER ZIEHEN'}).click();
   await page.waitForFunction(()=>BuergeramtLevel?.active&&BuergeramtLevel.stage==='entrance',{timeout:45000});
   console.log(JSON.stringify({name:'restart',active:await page.evaluate(()=>BuergeramtLevel.active)}));
  }
  if(name==='mobile'){await page.evaluate(()=>{document.documentElement.style.zoom='2'});await page.screenshot({path:`${output}/world-walk-zoom.png`});console.log(JSON.stringify({name:'zoom200',horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)}))}
  await page.close();
 }
 console.log(JSON.stringify({errors}));
}finally{await browser.close()}
