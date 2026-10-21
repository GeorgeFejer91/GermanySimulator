import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runSuite,isMain} from './browser-harness.mjs';

export async function enter({page,baseURL,root}){
 const source=readFileSync(resolve(root,'game.js'),'utf8');
 await page.route('**/game.js*',route=>route.fulfill({contentType:'text/javascript',body:source.replace('function loop(now){',`window.__police={state,player,jwd,npcs,keys,policeContact,arrestPlayer,moveGroundResponder,update,updateJwdPunishment,updateJwdPerformance,nextDialogue,stopSpeech,getNeighborDialogue,getStimulus:()=>activeStimulus,responderBlocked,home:buildings.find(b=>b.id==='jwd-home'),getPolice:()=>police,contact(tier){state.neighborLevel=false;state.wanted=tier;state.wantedCooldown=30;state.policeContactCooldown=0;police.push({x:player.x+31,y:player.y,speed:0,barkAt:Infinity});update(.01)}};function loop(now){`)}));
 await page.goto(baseURL+'/?geheim=nachbarn',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__police?.state.started&&Germany3D?.startupReady,null,{timeout:90000});
 await page.evaluate(()=>{
  const h=__police;h.stopSpeech();h.state.dialogue=h.state.modal=false;h.state.voiceOn=false;h.state.pettyAuditTimer=10000;h.state.quizTimer=10000;h.state.neighborLevel=false;
  h.jwd.allocated=false;h.jwd.visited=false;h.jwd.atHome=false;h.jwd.met.clear();h.jwd.gardenCooldown=10000;
  document.getElementById('dialogue').hidden=true;Object.assign(h.player,{x:2360,y:2320});
 });
}
const scenario={id:'escalation',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape','reduced'],timeoutMs:180000,actionTimeoutMs:90000,
 async run(ctx){
  const {page,artifacts,profile}=ctx;await enter(ctx);
  const initial=await page.evaluate(()=>({x:__police.player.x,y:__police.player.y,energy:__police.player.energy}));
  await page.evaluate(()=>__police.contact(1));
  await page.waitForFunction(()=>__police.state.dialogue);
  assert.equal(await page.evaluate(()=>__police.player.x),initial.x);assert.equal(await page.evaluate(()=>__police.player.y),initial.y);
  assert.equal(await page.evaluate(()=>__police.player.energy),initial.energy);
  await artifacts.screenshot(page,'warning.png');await page.locator('#dialogue-next').click();
  await page.evaluate(()=>__police.contact(2));
  await page.waitForFunction(()=>__police.state.dialogueData.paymentCents===3500);
  await page.waitForFunction(()=>document.getElementById('dialogue-next').dataset.measurement==='pretext-0.0.9');
  assert.match(await page.locator('#dialogue-next').textContent(),/35/);
  await artifacts.screenshot(page,'fine.png');await page.locator('#dialogue-next').click();
  assert.equal(await page.evaluate(()=>__police.state.policeAccountCents),6500);
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__police.state.policeAccountCents),6500);
  await page.evaluate(()=>__police.contact(3));
  await page.waitForFunction(()=>__police.jwd.punishment?.phase==='waiting');
  assert.equal(await page.evaluate(()=>__police.jwd.allocated),false);assert.equal(await page.evaluate(()=>__police.jwd.met.size),0);
  const origin=await page.evaluate(()=>({x:__police.player.x,y:__police.player.y}));
  assert.equal(await page.evaluate(()=>__police.responderBlocked(__police.player.x,__police.player.y,__police.player.r,__police.player)),false);
  if(profile.isMobile)await page.locator('.control-dock [data-key="ArrowDown"]').tap();else await page.keyboard.press('ArrowDown');
  try{await page.waitForFunction(()=>__police.jwd.punishment?.phase==='lecture')}catch(error){artifacts.json('approach-failure.json',await page.evaluate(()=>({punishment:__police.jwd.punishment,player:__police.player,modal:__police.state.modal,dialogue:__police.state.dialogue,neighbors:__police.npcs.filter(n=>n.jwdRole)})));throw error}
  const before=await page.evaluate(()=>({id:__police.jwd.punishment.story.id,actor:__police.jwd.punishment.actor.id,age:__police.state.dialogueData.lineAge,position:{x:__police.player.x,y:__police.player.y},modal:__police.state.modal,text:__police.state.dialogueData.lines[0]}));
  assert.deepEqual(before.position,origin);assert.equal(before.modal,true);
  await page.keyboard.press('e');await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>__police.jwd.punishment.story.id),before.id);
  assert.deepEqual(await page.evaluate(()=>({x:__police.player.x,y:__police.player.y})),origin);
  await page.waitForFunction(()=>document.getElementById('dialogue-text').dataset.measurement==='pretext-0.0.9');
  const layout=await page.evaluate(()=>{
   const d=document.getElementById('dialogue'),p=document.getElementById('dialogue-text'),r=d.getBoundingClientRect();
   return {visible:getComputedStyle(d).display!=='none',left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:[innerWidth,innerHeight],textOverflow:p.scrollWidth>p.clientWidth+1,measurement:p.dataset.measurement,fit:p.dataset.pretextFit};
  });
  assert.equal(layout.visible,true);assert.ok(layout.left>=0&&layout.right<=layout.viewport[0]+1&&layout.top>=0&&layout.bottom<=layout.viewport[1]+1);assert.equal(layout.textOverflow,false);
  await artifacts.screenshot(page,'locked-lecture.png');
  const held=await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return __police.state.dialogueData.lineAge;
  });
  await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>__police.state.dialogueData.lineAge),held);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForFunction(()=>!__police.jwd.punishment,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>__police.state.modal),false);assert.equal(await page.evaluate(()=>__police.jwd.allocated),false);
  await page.keyboard.down('ArrowDown');await page.waitForFunction(({x,y})=>Math.hypot(__police.player.x-x,__police.player.y-y)>5,origin);await page.keyboard.up('ArrowDown');
  // A new arrest owns a fresh attempt and another shuffled speaker/story.
  await page.evaluate(()=>{__police.state.neighborLevel=false;__police.contact(5)});
  await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>__police.jwd.punishment?.story);
  const next=await page.evaluate(()=>({id:__police.jwd.punishment.story.id,actor:__police.jwd.punishment.actor.id}));
  assert.notEqual(next.id,before.id);assert.notEqual(next.actor,before.actor);
  artifacts.json('receipt.json',{initial,origin,before,next,layout,hiddenClockHeld:true,paymentCents:3500});
  return {warningInPlace:true,paymentOnce:true,threeStarHomeReturn:true,unregisteredCreditPreserved:true,exitGate:true,earlySkipRejected:true,captionCompletesNaturally:true,hiddenClockHeld:true,newSpeaker:true,layout};
 }
};
const suite={name:'Police escalation and neighbor punishment',limits:['Silent headless Chromium; Android emulation; no physical-device or perceptual-listening claim.','Starts from the existing direct neighbor entry, then stages city player placement and wanted contacts through production update. This is not natural mission/chase coverage.','Caption completion runs on the real game clock. Visibility is an injected browser lifecycle condition.'],scenarios:[scenario],sourceFiles(root){return Object.fromEntries(['game.js','world3d.js','neighbor-punishment.js','game-hud.css','game-hud.js','index.html'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const r=await runSuite(suite,{profiles:['desktop'],output:'output/police-escalation/browser'});if(r.verdict!=='PASS')process.exitCode=1}
