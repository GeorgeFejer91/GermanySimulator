import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runSuite,isMain} from './browser-harness.mjs';
import {enter} from './playtest-police-escalation.mjs';

function scenario(failed){return {id:failed?'failed-recording':'recorded-punishment',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:150000,actionTimeoutMs:90000,
 async run(ctx){
  const {page,artifacts}=ctx;await enter(ctx);
  let aborted=0;
  if(failed)await page.route('**/voices/neighbors/punishment-heiko-01.mp3*',route=>{aborted++;return route.abort()});
  await page.evaluate(()=>{
   const h=__police,story=JwdPunishment.stories.find(s=>s.id==='punishment-heiko-01');
   if(!story)throw Error('Missing admitted pilot story');
   h.jwd.punishmentSelector={next:()=>story};h.state.voiceOn=true;h.contact(3);
  });
  await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>__police.jwd.punishment?.phase==='lecture');
  assert.equal(await page.evaluate(()=>__police.jwd.punishment.story.id),'punishment-heiko-01');
  const started=Date.now(),origin=await page.evaluate(()=>({x:__police.player.x,y:__police.player.y}));
  const samples=[];
  if(!failed){
   await page.waitForFunction(()=>__police.getNeighborDialogue()?.speaking&&__police.getNeighborDialogue()?.mediaDuration>10);
   for(let i=0;i<12;i++){samples.push(await page.evaluate(()=>__police.getNeighborDialogue()));await page.waitForTimeout(120)}
   assert.ok(samples.some(s=>s?.mediaTime>0));assert.ok(samples.some(s=>s?.mouthOpen>0));
   assert.equal(await page.evaluate(()=>__police.state.dialogueData.captionFallback),false);
  }else{
   await page.waitForFunction(()=>__police.state.dialogueData.captionFallback);
   assert.ok(aborted>0,'the test must intercept the hash-versioned recording request');
   samples.push(await page.evaluate(()=>__police.getNeighborDialogue()));
  }
  await page.keyboard.press('e');await page.keyboard.press('ArrowDown');
  assert.deepEqual(await page.evaluate(()=>({x:__police.player.x,y:__police.player.y})),origin);
  assert.ok(await page.evaluate(()=>!!__police.jwd.punishment));
  await artifacts.screenshot(page,failed?'failed-voice-caption.png':'recorded-mouth.png');
  const reading=await page.evaluate(()=>__police.state.dialogueData.lines[0].trim().split(/\s+/u).length*.5);
  await page.waitForFunction(()=>!__police.jwd.punishment);
  const elapsedMs=Date.now()-started;
  if(failed)assert.ok(elapsedMs>=reading*1000-250,'failed voice preserves the full active reading interval');
  assert.equal(await page.evaluate(()=>__police.state.modal),false);
  artifacts.json('speech-receipt.json',{failed,elapsedMs,readingSeconds:reading,samples,earlyInputBlocked:true,released:true});
  return {failed,elapsedMs,readingSeconds:reading,mediaClock:!failed,mouthEnergy:!failed,earlyInputBlocked:true,released:true};
 }
}}
const suite={name:'Post-arrest speech delivery',limits:['Staged arrest and selected admitted Heiko story in the actual game; approach and delivery use production code.','Silent headless media state checks do not establish perceptual listening. Mobile profiles are emulation.'],scenarios:[scenario(false),scenario(true)],sourceFiles(root){return Object.fromEntries(['game.js','neighbor-punishment.js','For-AI/AUDIO-TEXT-LIBRARY.js','assets/voices/neighbors/punishment-heiko-01.mp3'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const result=await runSuite(suite,{profiles:['desktop'],output:'output/police-escalation/speech-browser'});if(result.verdict!=='PASS')process.exitCode=1}
