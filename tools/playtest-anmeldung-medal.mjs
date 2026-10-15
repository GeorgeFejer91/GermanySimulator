import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=resolve('output/game-completion/medal-visibility');mkdirSync(output,{recursive:true});
const files=['index.html','game.js','styles.css','game-hud.css'];
const source=Object.fromEntries(files.map(path=>[path,readFileSync(path,'utf8')]));
const revision=()=>Object.fromEntries(files.map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')]));
const aside=source['index.html'].match(/<aside id="germanness-hud"[\s\S]*?<\/aside>/)?.[0];assert.ok(aside);
const render=source['game.js'].split('\n').find(line=>line.startsWith('function renderAnmeldungBadge('));assert.ok(render);
const report={revision:revision(),cases:[],limits:['Controlled component inputs exercise the actual renderer and production markup/CSS. This does not test registration, storage, natural mission progression or the world.','Headless Chromium; mobile is viewport emulation, not physical Android. No game scripts, WebGL, audio or external assets are loaded.']};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--disable-gpu','--mute-audio']});
try{
 report.browser=browser.version();
 for(const [name,viewport] of [['desktop',{width:800,height:320}],['mobile',{width:390,height:500}]]){
  const page=await browser.newPage({viewport});
  await page.setContent(`<style>${source['styles.css']}\n${source['game-hud.css']}</style>${aside}<p id="anmeldung-badge" hidden></p>`);
  for(const lang of ['de','en'])for(const [state,earned] of [['fresh',false],['earned',true],['persisted-input',true],['reset',false]]){
   const actual=await page.evaluate(({render,lang,earned})=>{
    new Function('state','anmeldungAwarded',render+';renderAnmeldungBadge()')({lang},earned);
    const medal=document.getElementById('anmeldung-medal'),badge=document.getElementById('anmeldung-badge'),box=medal.getBoundingClientRect();
    return {hidden:medal.hidden,display:getComputedStyle(medal).display,width:box.width,height:box.height,title:medal.title,badgeHidden:badge.hidden,badge:badge.textContent};
   },{render,lang,earned});
   assert.equal(actual.hidden,!earned);assert.equal(actual.badgeHidden,!earned);assert.equal(actual.display,earned?'grid':'none');
   assert.equal(actual.width>0,earned);assert.equal(actual.height>0,earned);assert.match(actual.title,lang==='en'?/officially registered/:/amtlich gemeldet/);
   assert.match(actual.badge,lang==='en'?/ANMELDUNG COMPLETED/:/ANMELDUNG ABGESCHLOSSEN/);
   if(lang==='de'&&['fresh','earned','reset'].includes(state))await page.screenshot({path:resolve(output,`${name}-${state}.png`)});
   report.cases.push({name,viewport,lang,state,earned,actual});
  }
  await page.close();
 }
}finally{await browser.close()}
assert.deepEqual(revision(),report.revision,'component sources remain unchanged');
writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:report.cases.length,report:resolve(output,'report.json')}));
