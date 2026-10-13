// Forced actor/arc selection; unchanged production MP3, cue sampler and media lifecycle.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';

export async function auditMouthCompletion({page,output,name,nativePaint,revision,faceClip}){
 const walking=process.env.PLAYTEST_COMPLETION_WALK==='1';
 const actors=await page.evaluate(walking=>[...__lipRender.amtMoving.map(a=>a.id),...(walking?[]:__lipRender.amtCharacters.map(a=>a.performance?a.lipId:a.id))],walking);
 const selected=process.env.PLAYTEST_ACTOR?actors.filter(id=>process.env.PLAYTEST_ACTOR.split(',').includes(id)):actors;
 const results=[];
 for(const id of selected){
  const setup=await page.evaluate(async({id,walking,nativePaint})=>{
   __lipProbe.cancelSpeech();
   // Restore other forced arcs to their safe mains between independent cases;
   // a held interior fixture otherwise occupies a native handover slot forever.
   for(const key of Object.keys(lipTransformOverrides))delete lipTransformOverrides[key];
   window.lipAuditAtlas=!nativePaint;
   for(const a of __lipProbe.characters){const origin=lipActorOrigins.find(o=>o.id===a.id);a.x=origin.x;a.z=origin.z}
   const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);
   const moving=__lipRender.amtMoving.includes(actor),family=actor.performance?'clerk':moving?id:actor.name;
   const key=actor.performance&&actor.lead?'clerk':actor.animationId??actor.id;
   const voiceId=actor.performance?BuergeramtStory.clerkIdentity.voiceId:(BuergeramtStory.characters[id]??BuergeramtStory.patrons[id]).voiceId;
   const path=actor.performance?'./assets/voices/knick/knick-registration-identityfix-reply-1.mp3':`./assets/voices/amt-fever/${voiceId}-fever-1.mp3`;
   const clip=lipOriginalCatalog.recordings[path];if(!clip||clip.voiceId!==voiceId)throw Error('Missing exact actor recording: '+id);
   const manifest=await(await fetch('./assets/buergeramt/animation/'+family+'.json')).json();
   const arc=manifest.arcs[0],pose=manifest.segments[arc.segments[0].segment].from;
   lipTransformOverrides[key]={generation:BuergeramtLevel.clerkPerformance.animation?.generation??0,actionId:1,arc:actor.performance?arc.id:'work-gesture-work',pose,phase:0};
   if(walking)lipTransformOverrides[key]={mode:'walk',heading:0,phase:0};
   const state=__lipProbe.characters.find(a=>a.id===id);
   if(state){state.x=0;state.z=1.8;actor.mesh.position.set(0,actor.mesh.position.y,1.8)}
   __lipProbe.view.x=actor.mesh.position.x;__lipProbe.view.z=actor.mesh.position.z+1.25;__lipProbe.view.yaw=0;
   window.lipFixtureTime=0;window.lipTestSpeech=null;window.GermanySimulatorAudioText=lipControlledCatalog;
   __lipProbe.content(id==='clerk'?'FRAU KNICK':id,'Mama',[],null,null,null,{id,tone:'procedural',valence:0});Germany3D.sync();
   return{id,key,family,path,voiceId,source:clip.source,sha256:clip.sha256,durationMs:clip.durationMs,arc:arc.id,arcDuration:arc.duration,pose};
  },{id,walking,nativePaint});
  await page.waitForFunction(()=>!!window.lipTestSpeech);
  if(nativePaint&&!walking)await page.waitForFunction(key=>{Germany3D.sync();const a=Germany3D.amtGaussian.actors.find(a=>a.id===key)?.anchor;return a?.visible&&!a.pending&&a.phase<.1},setup.key,{timeout:30000}).catch(async error=>{
   const diagnostic=await page.evaluate(setup=>({setup,speech:BuergeramtLevel.lipSpeech,fever:BuergeramtLevel.fever,mood:BuergeramtLevel.characterMood,view:BuergeramtLevel.view,characters:BuergeramtLevel.characters,overrides:lipTransformOverrides,scene:Germany3D.amtGaussian,assets:Germany3DBridge.assetLoadStatus}),setup);
   writeFileSync(`${output}/${name}-${id}-warm-failure.json`,JSON.stringify(diagnostic,null,2));throw error;
  });
  else await page.waitForTimeout(300);
  await page.evaluate(setup=>{
   __lipProbe.cancelSpeech();window.lipFixtureTime=null;window.lipFixtureRenderTime=null;
   window.GermanySimulatorAudioText={...lipOriginalCatalog,recordedClip:(voice,text)=>voice===setup.voiceId&&text===setup.source?setup.path:null,candidateClip:()=>null};
   __lipProbe.startRecorded(setup.id,setup.path);
  },setup);
  await page.waitForFunction(path=>BuergeramtLevel.lipSpeech.mode==='recorded'&&BuergeramtLevel.lipSpeech.recording===path&&!BuergeramtLevel.lipSpeech.paused,setup.path,{timeout:20000});
  await page.evaluate(({setup,nativePaint,walking})=>{
   const media=__lipMediaPlayers.at(-1),run={media,trace:[],events:[],started:performance.now(),done:false,paused:false};window.__mouthCompletion=run;
   if(media.playbackRate!==1)throw Error('Completion probe requires native normal-speed media');
   const capture=label=>{
    const beforeRender=BuergeramtLevel.lipSpeech;Germany3D.sync();
    const speech=BuergeramtLevel.lipSpeech,actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===setup.id||a.lipId===setup.id);
    const anchor=Germany3D.amtGaussian.actors.find(a=>a.id===setup.key)?.anchor;
    const sample={label,wallMs:performance.now()-run.started,mediaTime:media.currentTime,ended:media.ended,mediaPaused:media.paused,beforeRender,speech,fever:BuergeramtLevel.fever,bodyPhase:lipTransformOverrides[setup.key].phase,direction:actor.direction,renderKey:actor.renderKey,cell:actor.cell??actor.frame,anchor,paint:Germany3D.amtLipSplat,sourceTint:actor.mesh.material.color.toArray(),hole:actor.mesh.material.userData.lipHole.value};
    run.trace.push(sample);if(label!=='sample')run.events.push(sample);return sample;
   };
   const tick=now=>{
    if(run.done)return;
    lipTransformOverrides[setup.key].phase=((now-run.started)/1000/(2*setup.arcDuration))%1;
    window.lipFixtureBodyTime=now;
    if(walking){
     const state=lipTransformOverrides[setup.key];state.phase=((now-run.started)/700)%1;state.heading=[0,Math.PI/2,Math.PI,-Math.PI/2][Math.min(3,Math.floor(media.currentTime/(setup.durationMs/1000)*4))];
    }else if(!nativePaint){
     const state=lipTransformOverrides[setup.key];state.mode=state.phase<.5?'work':'gesture';
     if(setup.key==='clerk'){state.row=Math.floor(state.phase*4);state.frame=Math.floor(state.phase*8)%8}
    }
    Germany3D.sync();
    if(media.currentTime>.7&&!run.paused){run.paused=true;media.pause();capture('pause');setTimeout(()=>capture('pause-hold'),180);setTimeout(()=>{capture('before-resume');media.play();capture('resume')},270)}
    if(media.ended){capture('natural-end');run.done=true;return}
    if(now-run.started>setup.durationMs+8000){capture('timeout');run.done=true;return}
    requestAnimationFrame(tick);
   };
   run.timer=setInterval(()=>capture('sample'),100);capture('start');requestAnimationFrame(tick);
  },{setup,nativePaint,walking});
  await page.waitForTimeout(1200);await page.screenshot({path:`${output}/${name}-${id}-recorded-scene.png`});await page.screenshot({path:`${output}/${name}-${id}-recorded-speaking.png`,clip:await faceClip(page,id,walking)});
  await page.waitForFunction(()=>__mouthCompletion.done,null,{timeout:setup.durationMs+10000});
  // Media can report ended during rAF before its queued end callback releases
  // the owner. Check the inactive boundary, then observe the actual cleanup.
  await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.mode==='idle'&&BuergeramtLevel.lipSpeech.actor===null,null,{timeout:2000});
  const run=await page.evaluate(()=>{clearInterval(__mouthCompletion.timer);Germany3D.sync();return{trace:__mouthCompletion.trace,events:__mouthCompletion.events,final:BuergeramtLevel.lipSpeech}});
  writeFileSync(`${output}/${name}-${id}-completion-trace.json`,JSON.stringify({setup,revision,run},null,2));
  await page.screenshot({path:`${output}/${name}-${id}-natural-end.png`,clip:await faceClip(page,id,walking)});
  const owned=run.trace.filter(row=>row.speech.active&&row.speech.mode==='recorded'&&row.speech.actor===id);
  assert(owned.every(row=>row.sourceTint.every(Number.isFinite)),`${id}: valid authored-style fixture mood keeps source paint finite`);
  assert(owned.length>10,`${id}: native recording must own sustained speech`);
  assert(owned.every(row=>row.speech.timing==='audio-cues'&&row.speech.recording===setup.path));
  assert(new Set(owned.map(row=>row.speech.shape.map(v=>v.toFixed(2)).join(','))).size>3,`${id}: native mouth cues must vary`);
  if(walking){
   assert(new Set(owned.map(row=>row.renderKey)).size>8,`${id}: walking paint must progress`);
   assert(new Set(owned.map(row=>row.direction)).size===4,`${id}: all camera-relative directions must occur`);
   for(const row of owned)assert.equal(row.paint.visible,row.direction!=='up'&&row.speech.shape.reduce((sum,v)=>sum+v,0)>.015,`${id}: only visible cue-owned walking mouths draw`);
  }else if(nativePaint){
   const painted=owned.filter(row=>row.anchor?.visible&&row.anchor.phase>.05&&row.anchor.phase<.95);
   assert(painted.length>=3,`${id}: actual native anchor must traverse interior phases`);
   assert(painted.every(row=>row.anchor.lipShape.every((v,i)=>v>=Math.min(row.beforeRender.shape[i],row.speech.shape[i])-.001&&v<=Math.max(row.beforeRender.shape[i],row.speech.shape[i])+.001)),`${id}: displayed native mouth follows the native playhead during the measured render interval`);
  }else {
   assert(owned.every(row=>row.renderKey.startsWith('atlas:')),`${id}: fallback completion must exercise the actual atlas`);
   assert(new Set(owned.map(row=>row.renderKey)).size>=2,`${id}: actual displayed fallback source must change`);
  }
  const paused=run.events.find(row=>row.label==='pause'),held=run.events.find(row=>row.label==='pause-hold'),resume=run.events.find(row=>row.label==='before-resume');
  assert(held.wallMs-paused.wallMs>=150&&resume.wallMs-paused.wallMs>=230);
  assert(Math.abs(resume.mediaTime-paused.mediaTime)<.03);assert.deepEqual(held.speech.shape,paused.speech.shape);assert.deepEqual(resume.speech.shape,paused.speech.shape);
  const ended=run.events.find(row=>row.label==='natural-end');assert(ended?.ended,`${id}: observe native ended instead of cancelling`);
  assert.equal(ended.speech.active,false);assert.deepEqual(ended.speech.shape,[0,0,0,0]);
  assert.equal(run.final.actor,null);assert.equal(run.final.mode,'idle');assert.deepEqual(run.final.shape,[0,0,0,0]);assert.equal(ended.hole,0);
  // Replay the same line, then replace its owner while retaining the old callback.
  const replacement=selected.find(other=>other!==id)??id;
  await page.evaluate(({setup,replacement})=>{
   __lipProbe.startRecorded(setup.id,setup.path);
   window.__mouthReplacement=replacement;
  },{setup,replacement});
  await page.waitForFunction(id=>BuergeramtLevel.lipSpeech.actor===id&&BuergeramtLevel.lipSpeech.mode==='recorded'&&!BuergeramtLevel.lipSpeech.paused,id);
  await page.evaluate(()=>{window.__oldMouthEnd=__lipMediaPlayers.at(-1).onended});
  const handoff=await page.evaluate(replacement=>{
   __lipProbe.cancelSpeech();window.GermanySimulatorAudioText=lipControlledCatalog;window.lipFixtureTime=0;window.lipTestSpeech=null;
   __lipProbe.content(replacement==='clerk'?'FRAU KNICK':replacement,'Mama',[],null,null,null,{id:replacement,tone:'procedural',valence:0});
   return BuergeramtLevel.lipSpeech;
  },replacement);
  await page.waitForFunction(()=>!!window.lipTestSpeech);
  const stale=await page.evaluate(()=>{const before=BuergeramtLevel.lipSpeech;__oldMouthEnd?.();Germany3D.sync();return{before,after:BuergeramtLevel.lipSpeech}});
  assert.equal(stale.before.actor,replacement);assert.deepEqual(stale.after,stale.before,'completed media callback cannot clear replacement speech');
  await page.evaluate(()=>__lipProbe.cancelSpeech());
  const result={setup,nativePaint,walking,forcedActorAndBodyArc:true,normalSpeed:true,silent:true,physicalAndroid:false,run,handoff,stale,revision};
  results.push(result);writeFileSync(`${output}/${name}-${id}-completion.json`,JSON.stringify(result,null,2));
  writeFileSync(`${output}/${name}-completion-progress.json`,JSON.stringify(results,null,2));
  console.log(name,id,'native completion / pause / replay / replacement PASS');
 }
 return results;
}

export async function auditClerkRequests({page,output,name,revision}){
 const targets=['raised','ready','refusal','contact','raised','contact','refusal','ready'];
 await page.evaluate(()=>{
  __lipProbe.cancelSpeech();Object.defineProperty(BuergeramtLevel,'clerkPerformance',{get:lipReadClerk});
  const actor=__lipRender.amtCharacters.find(a=>a.lead);__lipProbe.view.x=actor.mesh.position.x;__lipProbe.view.z=actor.mesh.position.z+1.25;__lipProbe.view.yaw=0;
  __lipProbe.clerkAnimation.reset(BuergeramtLevel.clerkPerformance.animation.generation);
  window.GermanySimulatorAudioText=lipControlledCatalog;window.lipTestSpeech=null;
  __lipProbe.content('FRAU KNICK','Mama',[],null,null,null,{id:'clerk',tone:'procedural',valence:0});
  __lipProbe.clerkAnimation.reset(BuergeramtLevel.clerkPerformance.animation.generation);Germany3D.sync();
 });
 await page.waitForFunction(()=>{Germany3D.sync();const a=Germany3D.amtGaussian.actors.find(a=>a.id==='clerk')?.anchor;return a?.visible&&!a.pending});
 await page.evaluate(targets=>{
  const path='./assets/voices/knick/knick-registration-identityfix-reply-1.mp3',clip=lipOriginalCatalog.recordings[path];
  window.GermanySimulatorAudioText={...lipOriginalCatalog,recordedClip:(voice,text)=>voice===clip.voiceId&&text===clip.source?path:null,candidateClip:()=>null};
  window.lipFixtureTime=null;window.lipFixtureRenderTime=null;
  const c=__lipProbe.clerkAnimation,run={targets,index:0,trace:[],events:[],last:performance.now(),done:false,starting:false};window.__clerkRequests=run;
  const speak=()=>{run.starting=true;__lipProbe.startRecorded('clerk',path)};
  const capture=label=>{const state=c.state,speech=BuergeramtLevel.lipSpeech,anchor=Germany3D.amtGaussian.actors.find(a=>a.id==='clerk')?.anchor;const row={label,at:performance.now(),state,speech,anchor};run.trace.push(row);if(label!=='sample')run.events.push(row)};
  speak();c.request(targets[0]);capture('request');
  const tick=now=>{
   if(run.done)return;
   c.advance(Math.min(.1,(now-run.last)/1000));run.last=now;Germany3D.sync();capture('sample');
   if(BuergeramtLevel.lipSpeech.mode==='recorded')run.starting=false;
   if(!BuergeramtLevel.lipSpeech.active&&!run.starting){capture('natural-end');speak()}
   const state=c.state;
   if(!state.arc&&state.pose===targets[run.index]){
    capture('target');run.index++;
    if(run.index===targets.length){run.done=true;__lipProbe.cancelSpeech();Germany3D.sync();capture('finish');return}
    c.request(targets[run.index]);capture('request');
   }
   requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
 },targets);
 await page.waitForFunction(()=>__clerkRequests.done,null,{timeout:35000});
 const result=await page.evaluate(()=>({trace:__clerkRequests.trace,events:__clerkRequests.events}));
 const arcs=['raise','raise-back','return-back','refuse-back','stamp-back','stamp','refuse','return'];
 for(const arc of arcs){
  const samples=result.trace.filter(row=>row.state.arc===arc);assert(samples.length>15,arc+' must play through the real clock');
  assert(samples[0].state.phase<.1&&samples.at(-1).state.phase>.9);
  for(let i=1;i<samples.length;i++)assert(samples[i].state.phase>=samples[i-1].state.phase,arc+' advances from zero to one');
  assert(samples.some(row=>row.speech.mode==='recorded'&&row.anchor?.visible&&row.anchor.phase>.1&&row.anchor.phase<.9),arc+' must draw an interior native source during real MP3 speech');
 }
 assert(result.events.some(row=>row.label==='natural-end'),'unchanged recording must naturally end during the long request chain');
 assert.equal(result.events.at(-1).speech.actor,null);assert.equal(result.events.at(-1).state.pose,'ready');
 const report={forcedTargets:targets,nativeClerkClock:true,unchangedNativeMp3:true,normalSpeed:true,revision,...result};
 writeFileSync(`${output}/${name}-clerk-requests.json`,JSON.stringify(report,null,2));console.log(name,'all forward / reverse clerk requests PASS');
 return report;
}
