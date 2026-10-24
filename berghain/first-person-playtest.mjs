import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceFiles as halleFiles} from './halle-playtest.mjs';
import {assertFirstPersonView,forward} from './fixture-playtest.mjs';
import {cross} from './lab-playtest.mjs';
import lounge from './lounge-playtest.mjs';

export const sourceFiles=()=>[...halleFiles(),...['berghain/footsteps.mjs','tests/berghain-footsteps.test.mjs','berghain/first-person-playtest.mjs',
 'berghain/check-architecture.mjs','tests/berghain-architecture.test.mjs','berghain/For-AI/ARCHITECTURAL-CHECKS.md',
 'tools/browser-diagnostics.mjs','tests/browser-audio-silence.test.mjs'].map(path=>({path,
 sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const sound=async page=>JSON.parse(await page.locator('#model').getAttribute('data-footsteps'));
export default {name:'First-person walking, original footsteps and authored room reverberation',sourceFiles,scenarios:[
 {id:'first-person-native-audio',modes:['quick','stress'],async run({page,baseURL,artifacts}){
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  const renders=await page.evaluate(async()=>{
   const {createStepBuffer,connectFootstepGraph,acousticProfiles}=await import('./footsteps.mjs');
   const rows=[];
   for(const room of ['outside','wc','halle']){
    const context=new OfflineAudioContext(2,Math.ceil(24000*4.6),24000);
    const graph=connectFootstepGraph(context,acousticProfiles[room]),source=context.createBufferSource();
    source.buffer=createStepBuffer(context,'concrete');source.connect(graph.input);source.start(0);
    const rendered=await context.startRendering();
    let peak=0,total=0,tail=0,last=0,finite=true;
    for(let c=0;c<2;c++)for(const [i,v]of rendered.getChannelData(c).entries()){
     finite&&=Number.isFinite(v);peak=Math.max(peak,Math.abs(v));total+=v*v;
     if(i>24000*2)tail+=v*v;if(i>24000*4.5)last+=v*v;
    }
    rows.push({room,peak,total,tail,last,finite,duration:rendered.duration,channels:rendered.numberOfChannels});
    source.disconnect();graph.nodes.forEach(n=>n.disconnect());
   }
   return rows;
  });
  await artifacts.json('native-footstep-pcm.json',{renders,qualification:'Actual production synthesis/effect graph rendered offline and measured silently; not a listening or measured-room-acoustics verdict'});
  for(const r of renders){assert.equal(r.finite,true);assert.ok(r.peak>.005&&r.peak<.9,JSON.stringify(r));assert.ok(r.total>0);assert.equal(r.channels,2);}
  assert.ok(renders[2].tail>0);assert.equal(renders[0].tail,0);assert.equal(renders[1].tail,0);
  return {renders};
 }},
 {id:'first-person-input-audio',modes:['quick','stress'],timeoutMs:120000,async run(ctx){
  const {page,baseURL,profile,context,artifacts}=ctx;
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  const start=await assertFirstPersonView(page);assert.equal((await sound(page)).steps,0);
  await forward(page,context,profile,5000);
  let blocked=await assertFirstPersonView(page),afterWalk=await sound(page),held,afterBlock,settled=false;
  const approach=[];
  for(let attempt=0;attempt<24;attempt++){
   await forward(page,context,profile,700);held=await assertFirstPersonView(page);afterBlock=await sound(page);
   const displacement=Math.hypot(held.position.x-blocked.position.x,held.position.z-blocked.position.z);
   approach.push({before:blocked.position,after:held.position,displacement,beforeSteps:afterWalk.steps,afterSteps:afterBlock.steps});
   if(displacement<.001){settled=true;break;}blocked=held;afterWalk=afterBlock;
  }
  await artifacts.json('closed-door-hold.json',{approach,blocked,held,afterWalk,afterBlock,settled});
  assert.ok(settled&&blocked.position.z<23&&blocked.position.z>22.28,'Real approach must settle against the closed doorway');
  assert.ok(afterWalk.steps>3,'Real accepted movement must schedule footsteps');
  assert.ok(Math.hypot(held.position.x-blocked.position.x,held.position.z-blocked.position.z)<.001);
  assert.equal(afterBlock.steps,afterWalk.steps,'Held input against the closed door cannot make extra steps');
  await cross(ctx);const inside=await assertFirstPersonView(page),indoor=await sound(page);
  assert.ok(inside.position.z<22&&indoor.steps>afterBlock.steps);assert.equal(indoor.room,'foyer');assert.ok(indoor.decay>0);
  await artifacts.screenshot(page,'first-person-entrance.png');
  await page.locator('#footsteps').click();assert.equal((await sound(page)).enabled,false);const muted=(await sound(page)).steps;
  await forward(page,context,profile,700);assert.equal((await sound(page)).steps,muted);
  await page.locator('#footsteps').click();await forward(page,context,profile,700);assert.ok((await sound(page)).steps>muted);
  await page.locator('#sources').click();await page.waitForFunction(()=>{
   const state=JSON.parse(document.querySelector('#model').dataset.footsteps);return state.voices===0&&state.context==='suspended';
  });
  const paused=await sound(page);await page.locator('#close-sources').click();
  await page.locator('#exterior').click();const exterior=await sound(page);assert.equal(exterior.voices,0);assert.equal(exterior.room,null);
  return {start,approach,blocked,held,afterWalk,afterBlock,inside,indoor,paused,exterior,
   qualification:'Real keyboard/touch movement, blocked door, entry, mute/unmute and modal/exterior cancellation. Native Web Audio is pre-muted by the harness; no perceptual listening or physical Android.'};
 }},
 {id:'first-person-slow-audio',modes:['stress'],timeoutMs:60000,async run({page,baseURL,profile,context,artifacts}){
  await page.addInitScript(()=>{
   const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),pending=new Map();let next=0;
   window.requestAnimationFrame=callback=>{
    const id=++next,record={timer:null,frame:null};pending.set(id,record);
    record.timer=setTimeout(()=>{record.frame=request(time=>{pending.delete(id);callback(time);});},100);return id;
   };
   window.cancelAnimationFrame=id=>{const record=pending.get(id);if(!record)return;clearTimeout(record.timer);if(record.frame!==null)cancel(record.frame);pending.delete(id);};
  });
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  let touch;
  if(profile.hasTouch){touch=await context.newCDPSession(page);const b=await page.locator('[data-move="forward"]').boundingBox();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});}
  else{await page.locator('#model').focus();await page.keyboard.down('w');}
  let before,after;
  try{
   await page.waitForTimeout(3500);before=await sound(page);assert.ok(before.steps>=3);
   await page.evaluate(()=>{const end=performance.now()+650;while(performance.now()<end){}});
   await page.waitForTimeout(1800);after=await sound(page);assert.ok(after.steps>before.steps,'One continuing gesture must recover footsteps after idle suspension during a stall');
  }finally{if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}else await page.keyboard.up('w');}
  await assertFirstPersonView(page);await page.locator('#model').click();
  await page.waitForFunction(()=>JSON.parse(document.querySelector('#model').dataset.footsteps).context==='suspended');
  const idle=await sound(page);assert.equal(idle.voices,0);
  await artifacts.json('slow-walk-audio.json',{before,after,idle,qualification:'Real single held keyboard/touch input; RAF deliberately delayed100ms, then650ms main-thread stall. Native audio scheduling remains enabled and muted.'});
  return {before,after,idle};
 }},
 {...lounge.scenarios.find(s=>s.id==='lounge-text-layout'),id:'first-person-text-layout'}
]};
