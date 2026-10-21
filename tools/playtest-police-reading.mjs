import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runSuite,isMain,resizeViewport} from './browser-harness.mjs';
import {enter} from './playtest-police-escalation.mjs';

const scenario={id:'readable-lecture',modes:['quick'],profiles:['desktop'],timeoutMs:120000,
 async run(ctx){
  const {page,artifacts}=ctx;await enter(ctx);await page.evaluate(()=>__police.contact(3));await page.keyboard.press('ArrowDown');
  await page.waitForFunction(()=>__police.jwd.punishment?.phase==='lecture');
  await page.evaluate(()=>{__police.state.dialogueData.lineAge=-100000});
  // Inspect the full authored corpus in the real locked reading surface.
  // This is a layout diagnostic, not 24 natural gameplay/voice deliveries.
  const rows=[];
  for(const [label,width,height,zoom] of [['narrow',320,568,1],['zoom',1280,800,2],['landscape',844,390,1]]){
   await resizeViewport(page,{width,height});
   await page.evaluate(zoom=>{document.documentElement.style.zoom=zoom;document.documentElement.style.fontSize=zoom===2?'20px':'';dispatchEvent(new Event('resize'))},zoom);
   await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.body).getPropertyValue('--humor-viewport-width'))-innerWidth/(parseFloat(getComputedStyle(document.documentElement).zoom)||1))<1);
   await page.addStyleTag({content:'#dialogue-text{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}'});
   const result=await page.evaluate(async()=>{
    const shell=document.getElementById('dialogue'),copy=shell.querySelector('.dialogue-copy'),text=document.getElementById('dialogue-text'),rows=[];
    for(const story of JwdPunishment.stories){
     text.textContent=story.lines[0].de;copy.scrollTop=0;await new Promise(requestAnimationFrame);
     const box=shell.getBoundingClientRect();copy.scrollTop=copy.scrollHeight;
     rows.push({id:story.id,box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},viewport:[innerWidth,innerHeight],horizontalOverflow:copy.scrollWidth>copy.clientWidth+1,readableHeight:copy.clientHeight,canReachEnd:copy.scrollTop+copy.clientHeight>=copy.scrollHeight-1,fontSize:getComputedStyle(text).fontSize});
    }
    return rows;
   });
   artifacts.json(`${label}-layout.json`,result);
   for(const row of result){assert.ok(row.box.left>=-.1&&row.box.right<=width+.1&&row.box.top>=-.1&&row.box.bottom<=height+.1,`${label} ${row.id}: panel in viewport ${JSON.stringify(row.box)}`);assert.equal(row.horizontalOverflow,false,`${label} ${row.id}: no horizontal clipping`);assert.ok(row.readableHeight>=60);assert.equal(row.canReachEnd,true)}
   rows.push({label,width,height,zoom,stories:result});await artifacts.screenshot(page,`${label}-text-spacing.png`);
  }
  artifacts.json('reading-layout.json',{rows,corpusStories:24,diagnosticTextReplacement:true,cssZoom:true});
  return {stories:24,layouts:rows.map(r=>r.label),allTextReachable:true,diagnosticTextReplacement:true,cssZoom:true};
 }
};
const suite={name:'Locked lecture reading surface',scenarios:[scenario],limits:['Actual locked panel with diagnostic replacement of authored text; not proof of24natural deliveries.','CSS zoom and expanded text spacing are layout checks; no physical-device or perceptual-listening claim.'],sourceFiles(root){return Object.fromEntries(['game.js','neighbor-punishment.js','game-hud.css','game-hud.js','index.html'].map(path=>[path,createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const result=await runSuite(suite,{profiles:['desktop'],output:'output/police-escalation/reading'});if(result.verdict!=='PASS')process.exitCode=1}
