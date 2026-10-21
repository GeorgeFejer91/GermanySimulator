import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runSuite,isMain} from './browser-harness.mjs';

const suite={name:'Neighbor notebook production speech',limits:[
 'Public neighbor entry; the test places the follower on the production standing halo. This is staged dialogue/media evidence, not natural navigation.',
 'Recorded audio runs silently; no perceptual listening or physical-device claim.'
],scenarios:[{id:'notebook-recorded-flow',modes:['quick'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:180000,actionTimeoutMs:30000,
 async run({page,baseURL,root,artifacts,profile}){
  const source=readFileSync(resolve(root,'game.js'),'utf8');
  await page.route('**/game.js*',route=>route.fulfill({contentType:'text/javascript',body:source.replace('function loop(now){','window.__notebookTest={state,player,jwd,npcs,talkJwdNeighbor,cancelJwdTour,getNeighborStandingSpot,getNeighborDialogue,getAudio:()=>audio};function loop(now){')}));
  await page.goto(baseURL+'/?geheim=nachbarn',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__notebookTest?.state.started&&Germany3D?.startupReady);
  await page.evaluate(()=>{
   const h=__notebookTest,n=h.npcs.find(n=>n.id==='jwd-parent');h.state.voiceOn=true;h.state.pettyAuditTimer=10000;h.jwd.gardenCooldown=10000;
   Object.assign(h.player,{x:n.x,y:n.y+60});
   window.__notebookSamples=[];
   window.__notebookCheckpoint='reading';
   window.__notebookProbe=setInterval(()=>{
    const spot=h.jwd.tour?.actor.id==='jwd-parent'?h.getNeighborStandingSpot():null;if(spot)Object.assign(h.player,{x:spot.x,y:spot.y});
    const d=h.getNeighborDialogue();if(d?.line.startsWith('Moment, ich habe mir nur')){
     const paint=Germany3D.inspectAssets().jwd.actors.find(a=>a.id==='jwd-parent').paint;
     const last=__notebookSamples.at(-1);
     if(__notebookSamples.length<600&&(!last||last.dialogue.mediaTime!==d.mediaTime||last.paint.row!==paint.row))__notebookSamples.push({time:performance.now(),dialogue:d,paint});
     // Capture boundaries belong to this browser/media clock. Slow host PNG
     // collection must not let the short writing interval finish unnoticed.
     const read=__notebookCheckpoint==='reading'&&d.speaking&&d.mediaTime>1&&d.mouthOpen>.1&&paint.row===13;
     const check=__notebookCheckpoint==='checking'&&d.speaking&&paint.row===14;
     if(read||check){
      window.__notebookReceipt={dialogue:d,paint};window.__notebookCheckpoint='suspending';
      h.getAudio().suspend().then(()=>{Germany3D.sync();window.__notebookCheckpoint=read?'read-held':'check-held'});
     }
    }
   },40);
  });
  if(profile.id.startsWith('android'))await page.locator('.control-dock [data-key="KeyE"]').tap();else await page.keyboard.press('e');
  const invitation=await page.evaluate(()=>({actor:__notebookTest.jwd.tour?.actor.id,phase:__notebookTest.jwd.tour?.phase}));
  artifacts.json('invitation-receipt.json',invitation);assert.equal(invitation.actor,'jwd-parent','trusted interaction must start Heiko before follower staging');
  await page.waitForFunction(()=>__notebookTest.getNeighborDialogue()?.line.startsWith('Moment, ich habe mir nur'),null,{timeout:90000});
  await page.waitForFunction(()=>window.__notebookCheckpoint==='read-held',null,{timeout:30000});
  const spoken=await page.evaluate(()=>__notebookReceipt);artifacts.json('reading-receipt.json',spoken);
  await artifacts.screenshot(page,'notebook-native-reading.png');
  const held=await page.evaluate(()=>({dialogue:__notebookTest.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(a=>a.id==='jwd-parent').paint}));
  await page.waitForTimeout(200);
  const paused=await page.evaluate(()=>({dialogue:__notebookTest.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(a=>a.id==='jwd-parent').paint}));
  assert.equal(paused.dialogue.mediaTime,held.dialogue.mediaTime);assert.equal(paused.paint.frame,held.paint.frame);assert.equal(paused.paint.row,held.paint.row);assert.ok(paused.dialogue.paused);
  await page.evaluate(()=>{window.__notebookCheckpoint='checking';return __notebookTest.getAudio().resume()});
  await page.waitForFunction(()=>window.__notebookCheckpoint==='check-held',null,{timeout:30000});
  artifacts.json('checking-receipt.json',await page.evaluate(()=>__notebookReceipt));
  await artifacts.screenshot(page,'notebook-native-checking.png');
  await page.evaluate(()=>{window.__notebookCheckpoint='finishing';return __notebookTest.getAudio().resume()});
  await page.waitForFunction(()=>!__notebookTest.getNeighborDialogue()?.line.startsWith('Moment, ich habe mir nur'),null,{timeout:30000});
  const evidence=await page.evaluate(()=>{clearInterval(__notebookProbe);return{samples:__notebookSamples,met:[...__notebookTest.jwd.met]}});
  assert.equal(evidence.met.includes('jwd-parent'),false,'one checklist line is not introduction credit');
  const owned=evidence.samples.filter(s=>s.dialogue.speaking);assert.ok(owned.length>10);assert.ok(new Set(owned.map(s=>s.paint.mouthOpen)).size>3,'native media produces changing openings');assert.ok(owned.some(s=>s.paint.row===13)&&owned.some(s=>s.paint.row===14));
  await page.evaluate(()=>__notebookTest.cancelJwdTour());
  await page.waitForFunction(()=>!__notebookTest.getNeighborDialogue());
  const ended=await page.evaluate(()=>Germany3D.inspectAssets().jwd.actors.find(a=>a.id==='jwd-parent').paint);assert.equal(ended.mouthOpen,0);
  artifacts.json('native-clock.json',{spoken,held,paused,ended,...evidence});
  return{recordedSamples:owned.length,stagedHalo:true,pauseHeld:true,cancellationClosed:true};
 }
}],sourceFiles(root){return Object.fromEntries(['game.js','neighbor-story.js','neighbor-sprites.js','assets/characters/neighbors/heiko.webp','assets/voices/neighbors/heiko-story-37.mp3'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const report=await runSuite(suite,{profiles:['desktop','android-portrait','android-landscape'],output:'output/neighbors-checklist/production-flow-final'});if(report.verdict!=='PASS')process.exitCode=1;}
