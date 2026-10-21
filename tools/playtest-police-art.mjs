import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runSuite,isMain} from './browser-harness.mjs';
import {enter} from './playtest-police-escalation.mjs';

const scenario={id:'police-art',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape','reduced'],timeoutMs:180000,actionTimeoutMs:60000,
 async run(ctx){
  const {page,artifacts}=ctx;await enter(ctx);
  await page.evaluate(()=>{
   const h=__police;h.state.modal=true;h.state.neighborLevel=true;h.state.wanted=2;h.state.policeContactCooldown=10000;
   const list=h.getPolice();list.length=0;
   // Stage two clear live actors; every movement after release uses production pursuit.
   let selected=null;for(let dx=0;dx<=400&&!selected;dx+=40)for(let dy=0;dy<=400&&!selected;dy+=40){const x=2360+dx,y=2320+dy;if(!h.responderBlocked(x,y,16,h.player)&&!h.responderBlocked(x-60,y+65,14,null)&&!h.responderBlocked(x+60,y+65,14,null))selected={x,y}}
   if(!selected)throw Error('No body-clear art staging point');Object.assign(h.player,selected);
   for(const [index,variant] of ['male','female'].entries())list.push({x:selected.x+(index?60:-60),y:selected.y+65,policeVariant:variant,speed:110,barkAt:Infinity,facing:0,avoid:index?1:-1});
  });
  const states=[];
  for(const [stars,tier] of [[2,'patrol'],[3,'protective'],[4,'riot'],[5,'heavy']]){
   await page.evaluate(stars=>{__police.state.wanted=stars;Germany3D.sync()},stars);
   await page.waitForFunction(tier=>{const p=Germany3D.inspectAssets().policePaint;return p.actors.length===2&&p.actors.every(a=>a.loaded&&a.tier===tier&&!a.pending)},tier);
   const record=await page.evaluate(()=>Germany3D.inspectAssets().policePaint);states.push({stars,tier,...record});
   assert.deepEqual(record.actors.map(a=>a.variant).sort(),['female','male']);assert.equal(record.resources.length,2,'retired tier textures are released');
   await artifacts.screenshot(page,`${tier}-world.png`);
  }
  // Exercise actual pursuit, then let ordinary one-star contact own the stop.
  // Suppressing contact alone permits legal sidestepping; it does not promise a standstill.
  await page.evaluate(()=>{for(const p of __police.getPolice())delete p.facing;__police.state.modal=false;window.__policeSamples=[]});
  await page.waitForFunction(()=>{
   const p=Germany3D.inspectAssets().policePaint;__policeSamples.push(p.actors.map(a=>({distance:a.distance,pose:a.pose})));
   return __policeSamples.some(sample=>sample.some(a=>a.pose?.moving));
  });
  await page.waitForFunction(()=>{
   const p=Germany3D.inspectAssets().policePaint;__policeSamples.push(p.actors.map(a=>({distance:a.distance,pose:a.pose})));
   return new Set(__policeSamples.flat().filter(a=>a.pose?.moving).map(a=>a.pose.frame)).size>=3;
  });
  await artifacts.screenshot(page,'pursuit-walk.png');
  const moving=await page.evaluate(()=>__policeSamples);
  await page.evaluate(()=>{__police.state.neighborLevel=false;__police.state.wanted=1;__police.state.wantedCooldown=30;__police.state.policeContactCooldown=0});
  try{await page.waitForFunction(()=>__police.state.dialogue&&__police.getPolice().length===1&&__police.getPolice()[0].encounter,null,{timeout:12000})}catch(error){artifacts.json('contact-failure.json',await page.evaluate(()=>({state:__police.state,player:__police.player,actors:__police.getPolice(),jwd:{punishment:__police.jwd.punishment,atHome:__police.jwd.atHome,exitPending:__police.jwd.exitPending}})));throw error}
  await page.waitForFunction(()=>{const p=Germany3D.inspectAssets().policePaint;return p.actors.length===1&&p.actors[0].tier==='patrol'&&!p.actors[0].pending&&!p.actors[0].pose.moving});
  const stopped=await page.evaluate(()=>({paint:Germany3D.inspectAssets().policePaint,player:{x:__police.player.x,y:__police.player.y},actors:__police.getPolice().map(p=>({x:p.x,y:p.y})),samples:__policeSamples}));
  for(const p of stopped.actors)assert.ok(Math.hypot(p.x-stopped.player.x,p.y-stopped.player.y)>=29.99,'whole bodies stop outside the player');
  await artifacts.screenshot(page,'planted-warning.png');await page.waitForTimeout(350);
  const held=await page.evaluate(()=>Germany3D.inspectAssets().policePaint.actors);
  assert.equal(held[0].distance,stopped.paint.actors[0].distance);assert.equal(held[0].pose.moving,false);assert.equal(held[0].pose.row,5);
  await page.locator('#dialogue-next').click();
  await page.waitForFunction(()=>Germany3D.inspectAssets().policePaint.actors.length===0);
  const released=await page.evaluate(()=>Germany3D.inspectAssets().policePaint);assert.equal(released.resources.length,0);
  artifacts.json('art-receipt.json',{states,moving,stopped,held,released,actualPursuit:true,bodySeparation:true});
  return {tiers:states.map(s=>({tier:s.tier,resources:s.resources})),genders:['male','female'],actualPursuit:true,distinctMovingFrames:new Set(moving.flat().filter(a=>a.pose?.moving).map(a=>a.pose.frame)).size,plantedDuringContact:true,releasedAfterAcknowledgement:true,selectedMobile:states[0].mobile};
 }
};
const suite={name:'Integrated police paint',limits:['Silent staged actors in the actual game renderer; pursuit after release uses production movement.','Android profiles are emulation. No physical-device or perceptual-listening claim.','Depth/scale specialist review remains separate.'],scenarios:[scenario],sourceFiles(root){return Object.fromEntries(['game.js','world3d.js','police-sprites.js','assets/characters/police/manifest.json'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const r=await runSuite(suite,{profiles:['desktop','android-portrait'],output:'output/police-escalation/art-browser'});if(r.verdict!=='PASS')process.exitCode=1}
