import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runSuite,isMain} from './browser-harness.mjs';

async function enter({page,baseURL,root}){
 const source=readFileSync(resolve(root,'game.js'),'utf8');
 await page.route('**/game.js*',route=>route.fulfill({contentType:'text/javascript',body:source.replace('function loop(now){','window.__repair={state,player,jwd,npcs,getNeighborStandingSpot,getNeighborDialogue,getMissionWaypoint,talkJwdNeighbor,cancelJwdTour,stopSpeech,summonJwdChild,speakJwdTourLine,getAudio:()=>audio};function loop(now){')}));
 await page.goto(baseURL+'/?geheim=nachbarn',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__repair?.state.started&&Germany3D?.startupReady);
 await page.evaluate(()=>{const h=__repair;h.state.voiceOn=true;h.state.pettyAuditTimer=10000;h.jwd.gardenCooldown=10000;h.jwd.atHome=false});
}

const starts=['jwd-parent','jwd-watcher','jwd-swabian'].map(id=>({id:'first-'+id,modes:['quick'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:90000,
 async run(ctx){const {page,artifacts,profile}=ctx;await enter(ctx);
  const selection=await page.evaluate(id=>{const h=__repair,n=h.npcs.find(n=>n.id===id);Object.assign(h.player,{x:n.x,y:n.y+65});const halo=h.getNeighborStandingSpot(),waypoint=h.getMissionWaypoint();Object.assign(h.player,halo);return{halo,waypoint}},id);
  assert.equal(selection.halo.actorId,id);assert.equal(selection.waypoint.id,id);
  if(profile.id.startsWith('android'))await page.locator('.control-dock [data-key="KeyE"]').tap();else await page.keyboard.press('e');
  await page.waitForFunction(id=>{const d=__repair.getNeighborDialogue();return d?.id===id&&d.speaking&&d.mediaTime>.4&&d.mouthOpen>.1},id);
  const receipt=await page.evaluate(()=>({actor:__repair.jwd.tour.actor.id,dialogue:__repair.getNeighborDialogue(),paint:Germany3D.inspectAssets().jwd.actors.find(a=>a.id===__repair.jwd.tour.actor.id).paint,dialogueDisplay:getComputedStyle(document.getElementById('dialogue')).display,met:[...__repair.jwd.met],subtitles:document.getElementById('english-subtitle').textContent}));
  assert.equal(receipt.actor,id);assert.equal(receipt.dialogueDisplay,'none');assert.equal(receipt.met.length,0);assert.ok(receipt.paint.mouthOpen>0);
  if(id==='jwd-parent')assert.match(receipt.dialogue.line,/Heiko Maaslos/);
  artifacts.json('first-speaker.json',{selection,...receipt});await artifacts.screenshot(page,'first-speaker.png');
  if(id==='jwd-parent'&&profile.id==='desktop'){
   const box=await page.evaluate(()=>{const el=document.getElementById('dialogue');el.style.display='grid';const c=getComputedStyle(el),r=el.getBoundingClientRect();return{background:c.backgroundColor,border:c.borderTopColor,width:r.width,height:r.height,buttons:[...el.querySelectorAll('button')].map(b=>b.hidden)}});
   assert.equal(box.background,'rgb(238, 232, 216)');assert.equal(box.border,'rgb(116, 109, 94)');assert.ok(box.buttons.every(Boolean));artifacts.json('old-empty-panel-counterfactual.json',box);
   await artifacts.screenshot(page,'old-empty-panel-counterfactual.png');await page.evaluate(()=>document.getElementById('dialogue').style.removeProperty('display'));
   assert.equal(await page.locator('#dialogue').isVisible(),false);
  }
  await page.evaluate(()=>__repair.cancelJwdTour());return{actor:id,nativeSpeech:true,emptyPanelAbsent:true,stagedApproach:true};
 }
}));

const writer={id:'hartmut-writing',modes:['quick'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:180000,
 async run(ctx){const {page,artifacts}=ctx;await enter(ctx);await page.keyboard.press('e');
  await page.evaluate(()=>{
   const h=__repair,n=h.npcs.find(n=>n.id==='jwd-parent');if(h.jwd.tour)h.cancelJwdTour();h.talkJwdNeighbor(n);h.stopSpeech();h.state.dialogue=false;h.state.modal=false;document.getElementById('dialogue').hidden=true;
   const t=h.jwd.tour;t.stop=4;t.line=0;t.phase='ready';h.summonJwdChild(t);const child=h.jwd.child;
   Object.assign(child,{x:1090,y:4710,jwdRoute:[],jwdMoving:0});Object.assign(n,{x:1090,y:4650,jwdRoute:[],jwdMoving:0});t.leader=child;
   Object.assign(h.player,h.getNeighborStandingSpot());window.__writingSamples=[];
   window.__writingProbe=setInterval(()=>{if(h.jwd.tour!==t)return;const spot=h.getNeighborStandingSpot();if(spot)Object.assign(h.player,spot);const d=h.getNeighborDialogue();if(!d)return;const a=Germany3D.inspectAssets().jwd.actors;__writingSamples.push({dialogue:d,parent:a.find(a=>a.id==='jwd-parent')?.paint,child:a.find(a=>a.id==='jwd-theodore')?.paint})},50);
   h.speakJwdTourLine(t);
  });
  await page.waitForFunction(()=>{const d=__repair.getNeighborDialogue();return d?.id==='jwd-parent'&&d.speaking&&d.mediaTime>1});
  await artifacts.screenshot(page,'heiko-writing-before-child.png');
  await page.waitForFunction(()=>{const d=__repair.getNeighborDialogue();return d?.id==='jwd-theodore'&&d.speaking&&d.mediaTime>1&&d.mouthOpen>.1});
  await page.evaluate(()=>__repair.getAudio().suspend());
  const held=await page.evaluate(()=>{Germany3D.sync();return{d:__repair.getNeighborDialogue(),a:Germany3D.inspectAssets().jwd.actors}});await page.waitForTimeout(150);
  const paused=await page.evaluate(()=>({d:__repair.getNeighborDialogue(),a:Germany3D.inspectAssets().jwd.actors}));
  assert.equal(held.d.mediaTime,paused.d.mediaTime);for(const id of ['jwd-parent','jwd-theodore'])assert.equal(held.a.find(a=>a.id===id).paint.frame,paused.a.find(a=>a.id===id).paint.frame);
  await artifacts.screenshot(page,'heiko-writing-hartmut-speaking.png');await page.evaluate(()=>__repair.getAudio().resume());
  await page.waitForFunction(()=>__repair.getNeighborDialogue()?.line.startsWith('So, Hartmut vorgestellt'),null,{timeout:60000});
  const samples=await page.evaluate(()=>{clearInterval(__writingProbe);return __writingSamples});
  const child=samples.filter(s=>s.dialogue.id==='jwd-theodore'&&s.dialogue.speaking&&s.dialogue.mediaTime>.1);
  assert.ok(child.length>20);assert.ok(child.at(-1).dialogue.mediaTime>child.at(-1).dialogue.mediaDuration*.9);
  assert.ok(child.every(s=>s.parent.row===14&&s.parent.mouthOpen===0&&s.parent.cueToken===null));assert.ok(new Set(child.map(s=>s.parent.frame)).size>4);
  const parent=samples.filter(s=>s.dialogue.line.startsWith('Ach, hier also')&&s.dialogue.speaking);assert.ok(parent.length>10);assert.ok(parent.every(s=>s.parent.row===14));
  artifacts.json('writing-native-clock.json',{held,paused,samples});await page.evaluate(()=>__repair.cancelJwdTour());
  return{childNativeSamples:child.length,parentNativeSamples:parent.length,fullChildLine:true,listenerMouthClosed:true,pauseHeld:true,stagedBeat:true};
 }
};
const suite={name:'Neighbor repair',limits:['Silent headless Chromium; Android emulation, not physical hardware or listening.','First-adult cases stage only the player approach and use real E/touch input. The writing case stages the authored play-path beat and follows native media to completion; it is not natural full-tour traversal.','The old-panel screenshot deliberately restores the previous display rule to identify its empty DOM owner.'],scenarios:[...starts,writer],sourceFiles(root){return Object.fromEntries(['game.js','neighbor-story.js','neighbor-sprites.js','game-hud.css','assets/characters/neighbors/heiko.webp','assets/characters/neighbors/heiko-mobile.webp'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]))}};
export default suite;
if(isMain(import.meta.url)){const r=await runSuite(suite,{profiles:['desktop','android-portrait','android-landscape'],output:'output/neighbors-repair/browser'});if(r.verdict!=='PASS')process.exitCode=1;}
