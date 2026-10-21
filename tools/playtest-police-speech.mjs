import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runSuite,isMain} from './browser-harness.mjs';
import {enter} from './playtest-police-escalation.mjs';

function scenario(failed,family='heiko'){const storyId=`punishment-${family}-01`;return {id:failed?'failed-recording':family==='heiko'?'recorded-punishment':`recorded-punishment-${family}`,modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:150000,actionTimeoutMs:90000,
 async run(ctx){
  const {page,artifacts}=ctx;await enter(ctx);
  let aborted=0;
  if(failed)await page.route(`**/voices/neighbors/${storyId}.mp3*`,route=>{aborted++;return route.abort()});
  await page.evaluate(storyId=>{
   const h=__police,story=JwdPunishment.stories.find(s=>s.id===storyId);
   if(!story)throw Error('Missing admitted pilot story');
   h.jwd.punishmentSelector={next:()=>story};h.state.voiceOn=true;h.contact(3);
  },storyId);
  await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>__police.jwd.punishment?.phase==='lecture');
  assert.equal(await page.evaluate(()=>__police.jwd.punishment.story.id),storyId);
  const started=Date.now(),origin=await page.evaluate(()=>({x:__police.player.x,y:__police.player.y}));
  const samples=[];
  if(!failed){
   await page.waitForFunction(()=>__police.getNeighborDialogue()?.speaking&&__police.getNeighborDialogue()?.mediaDuration>10);
   for(let i=0;i<12;i++){samples.push(await page.evaluate(()=>__police.getNeighborDialogue()));await page.waitForTimeout(120)}
   assert.ok(samples.some(s=>s?.mediaTime>0));assert.ok(samples.some(s=>s?.mouthOpen>0));
   assert.equal(await page.evaluate(()=>__police.state.dialogueData.captionFallback),false);
   const mediaBefore=await page.evaluate(()=>{const time=__police.getNeighborDialogue().mediaTime;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return time});
   await page.waitForTimeout(650);
   const mediaAfter=await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return __police.getNeighborDialogue().mediaTime});
   assert.ok(mediaAfter-mediaBefore<.15,'hidden time must not consume the forced recording');
   await page.evaluate(()=>{window.__policeHud=GermanyHUD;window.GermanyHUD={...GermanyHUD,paused:true}});
   await page.waitForTimeout(150);
   const pausedBefore=await page.evaluate(()=>__police.getNeighborDialogue().mediaTime);await page.waitForTimeout(650);
   await page.evaluate(()=>{window.GermanyHUD=window.__policeHud;delete window.__policeHud});
   const pausedAfter=await page.evaluate(()=>__police.getNeighborDialogue().mediaTime);
   assert.ok(pausedAfter-pausedBefore<.15,'a staged HUD pause must preserve recorded playback position');
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
const policeRecordings={id:'recorded-police-contacts',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:150000,actionTimeoutMs:90000,async run(ctx){
 const {page,artifacts}=ctx;await enter(ctx);const receipts=[];
 await page.evaluate(()=>{__police.state.voiceOn=true});
 for(const tier of [1,2]){
  const id=tier===1?'police-contact-warning':'police-contact-fine';
  await page.evaluate(tier=>__police.contact(tier),tier);
  await page.waitForFunction(id=>{const item=__police.getStimulus();return item?.clip?.clipId===id&&item.speechStarted&&item.subtitleMode==='recorded'},id);
  const receipt=await page.evaluate(()=>{const item=__police.getStimulus();return {id:item.clip.clipId,voiceId:item.clip.voiceId,source:item.clip.source,text:__police.state.dialogueData.lines[0],duration:item.subtitleDuration,mouthFrames:item.clip.mouthEnergy?.length,started:performance.now()}});
  assert.equal(receipt.source,receipt.text);assert.equal(receipt.voiceId,'polizei-heinrich-wachtmeister');assert.ok(receipt.duration>5&&receipt.mouthFrames>200);
  await page.waitForTimeout(500);
  assert.ok(await page.evaluate(()=>__police.getStimulus()?.subtitleElapsed()>0));
  await page.waitForFunction(()=>__police.state.dialogueData.lineComplete);
  assert.equal(await page.evaluate(()=>!!__police.state.dialogueData.captionFallback),false);
  await artifacts.screenshot(page,id+'.png');await page.locator('#dialogue-next').click();
  receipts.push(receipt);
 }
 assert.equal(await page.evaluate(()=>__police.state.policeAccountCents),6500);
 artifacts.json('police-recording-receipt.json',{receipts,paymentCents:3500,listening:'NOT RUN'});
 return {recordings:2,exactSource:true,selectedVoice:true,naturalMediaCompletion:true,paymentOnce:true};
}};
const suite={name:'Post-arrest speech delivery',limits:['Staged wanted contacts and selected admitted neighbor stories in the actual game; approach and delivery use production code.','Silent headless media state checks do not establish perceptual listening. Mobile profiles are emulation.'],scenarios:[scenario(false),scenario(true),scenario(false,'inga'),scenario(false,'schwabingen'),policeRecordings],sourceFiles(root){return Object.fromEntries(['game.js','neighbor-punishment.js','For-AI/AUDIO-TEXT-LIBRARY.js','assets/voices/neighbors/punishment-heiko-01.mp3','assets/voices/neighbors/punishment-inga-01.mp3','assets/voices/neighbors/punishment-schwabingen-01.mp3','assets/voices/police-contact/police-contact-warning.mp3','assets/voices/police-contact/police-contact-fine.mp3'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const result=await runSuite(suite,{profiles:['desktop'],output:'output/police-escalation/speech-browser'});if(result.verdict!=='PASS')process.exitCode=1}
