// Displayed encoded-cell audit. The original route/body/media clocks remain production code.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';

export async function auditMouthFrames({page,output,name,revision,poseCue,faceClip}){
 const moving=await page.evaluate(()=>__lipRender.amtMoving.map(a=>({id:a.id,count:a.walkFrames})));
 const selected=process.env.PLAYTEST_ACTOR?moving.filter(a=>process.env.PLAYTEST_ACTOR.split(',').includes(a.id)):moving;
 const results=[];
 for(const {id,count} of process.env.PLAYTEST_ACTION_SAMPLES==='1'?[]:selected){
  await page.evaluate(id=>{
   const state=__lipProbe.characters.find(a=>a.id===id),actor=__lipRender.amtMoving.find(a=>a.id===id);
   state.x=0;state.z=1.8;actor.mesh.position.set(0,actor.height/2,1.8);__lipProbe.view.x=0;__lipProbe.view.z=3.05;__lipProbe.view.yaw=0;
  },id);
  for(const backend of ['detail','atlas'])for(const [direction,heading] of [['down',0],['right',Math.PI/2],['up',Math.PI],['left',-Math.PI/2]]){
   await page.evaluate(({id,heading,backend})=>{window.lipAuditAtlas=backend==='atlas';lipTransformOverrides[id]={mode:'walk',heading,phase:0};Germany3D.sync()}, {id,heading,backend});
   if(backend==='detail')await page.waitForFunction(({id,direction})=>{Germany3D.sync();const a=__lipRender.amtMoving.find(a=>a.id===id);return a.walkDirection===direction&&a.walkDetail?.image&&a.renderKey.startsWith('walk:')}, {id,direction});
   for(let sample=0;sample<count;sample++){
    await page.evaluate(({id,sample,count})=>{lipTransformOverrides[id].phase=(sample+.01)/count;Germany3D.sync()}, {id,sample,count});
    const cues=[];
    for(const [cue,index] of [['closed',0],['open',1],['wide',12],['round',10],['bite',5]]){
     await poseCue(page,id,index,30);
     const observation=await page.evaluate(id=>{
      Germany3D.sync();const a=__lipRender.amtMoving.find(a=>a.id===id);
      return{direction:a.direction,sample:a.mouthSample,key:a.renderKey,registration:GermanyAmtLips.displayedMouth(a),profile:GermanyAmtLips.displayedMouthProfile(a),frame:GermanyAmtLips.displayedMouthFrame(a),speech:BuergeramtLevel.lipSpeech,paint:Germany3D.amtLipSplat,hole:a.mesh.material.userData.lipHole.value,foot:a.mesh.position.y-a.height/2,native:Germany3D.amtGaussian.actors.find(item=>item.id===id)?.anchor??null};
     },id);
     assert.equal(observation.direction,direction);assert.equal(observation.sample,sample);assert.equal(observation.foot,0);assert.equal(observation.speech.actor,id);assert(observation.speech.active);
     if(direction==='up'){
      assert.equal(observation.registration,null);assert.equal(observation.profile,null);assert.equal(observation.paint.visible,false);assert.equal(observation.hole,0);
     }else{
      assert(observation.registration?.every(Number.isFinite));assert(observation.frame.axes.every(Number.isFinite));assert(observation.profile);
      assert.equal(observation.paint.visible,cue!=='closed');assert.equal(observation.hole,cue==='closed'?0:1);
      assert.equal(observation.native?.visible??false,false,'walking uses the displayed directional source, without a native action cloud');
      const path=`${output}/${name}-${id}-${backend}-${direction}-${sample}-${cue}.png`;
      await page.screenshot({path,clip:await faceClip(page,id,true)});observation.path=path;
     }
     cues.push({cue,observation});
    }
    results.push({id,backend,direction,sample,cues});
   }
  }
  writeFileSync(`${output}/${name}-walking-progress.json`,JSON.stringify({revision,results},null,2));console.log(name,id,'all walking cells / cues PASS');
 }
 if(process.env.PLAYTEST_ACTION_SAMPLES==='1')results.push(...await auditAtlasActionFrames({page,output,name,revision,poseCue,faceClip}));
 if(!process.env.PLAYTEST_ACTOR||process.env.PLAYTEST_ACTOR.split(',').includes('clerk')){
  await page.evaluate(()=>{const a=__lipRender.amtCharacters.find(a=>a.lead);__lipProbe.view.x=a.mesh.position.x;__lipProbe.view.z=a.mesh.position.z+1.25;__lipProbe.view.yaw=0});
  for(const backend of ['detail','atlas'])for(let frame=0;frame<8;frame++){
   await page.evaluate(({frame,backend})=>{window.lipAuditAtlas=backend==='atlas';lipTransformOverrides.clerk={row:5,frame};Germany3D.sync()}, {frame,backend});
   await page.waitForTimeout(100);
   for(const [cue,index] of [['closed',0],['open',1],['wide',12],['round',10],['bite',5]]){
    await poseCue(page,'clerk',index,30);
    const observation=await page.evaluate(()=>{Germany3D.sync();const a=__lipRender.amtCharacters.find(a=>a.lead);return{frame:a.frame,profile:GermanyAmtLips.displayedMouthProfile(a),paint:Germany3D.amtLipSplat,speech:BuergeramtLevel.lipSpeech,hole:a.mesh.material.userData.lipHole.value,key:a.renderKey}});
    assert.equal(observation.frame,40+frame);assert.equal(observation.speech.actor,'clerk');
    assert.equal(observation.key,backend==='detail'?'detail:0':'atlas:'+frame,'talk keeps the same breath sample and articulates unbaked ready paint');
    const preOpen=observation.profile.source_upper.some((v,i)=>Math.abs(v-observation.profile.source_lower[i])>.001);
    assert.equal(observation.paint.visible,cue!=='closed'||preOpen);assert.equal(observation.hole,observation.paint.visible?1:0);
    const path=`${output}/${name}-clerk-talk-${backend}-${frame}-${cue}.png`;
    await page.screenshot({path,clip:await faceClip(page,'clerk',true)});
    results.push({id:'clerk',backend,talkFrame:frame,cue,observation,path});
   }
  }
 }
 await page.evaluate(()=>{__lipProbe.cancelSpeech();window.lipAuditAtlas=false});
 return results;
}

async function auditAtlasActionFrames({page,output,name,revision,poseCue,faceClip}){
 const actors=await page.evaluate(()=>[...__lipRender.amtMoving,...__lipRender.amtCharacters].map(a=>({id:a.performance?a.lipId:a.id,moving:__lipRender.amtMoving.includes(a),performance:!!a.performance,lead:!!a.lead})));
 const selected=process.env.PLAYTEST_ACTOR?actors.filter(a=>process.env.PLAYTEST_ACTOR.split(',').includes(a.id)):actors,results=[];
 for(const metadata of selected){
  const {id,moving,performance,lead}=metadata;
  await page.evaluate(id=>{
   window.lipAuditAtlas=true;
   for(const a of __lipProbe.characters){const origin=lipActorOrigins.find(o=>o.id===a.id);a.x=origin.x;a.z=origin.z}
   const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id),state=__lipProbe.characters.find(a=>a.id===id);
   if(state){state.x=0;state.z=1.8;a.mesh.position.set(0,a.height/2,1.8)}
   __lipProbe.view.x=a.mesh.position.x;__lipProbe.view.z=a.mesh.position.z+1.25;__lipProbe.view.yaw=0;
  },id);
  const steps=moving?['work','gesture','look','flinch'].flatMap(mode=>Array.from({length:8},(_,frame)=>({mode,frame}))):performance&&lead?Array.from({length:40},(_,index)=>({row:Math.floor(index/8),frame:index%8})):Array.from({length:performance?8:64},(_,frame)=>({frame}));
  for(const step of steps){
   await page.evaluate(({id,moving,performance,lead,step})=>{
    const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);
    if(moving)lipTransformOverrides[id]=step;
    else if(performance&&lead)lipTransformOverrides.clerk=step;
    else window.lipFixtureBodyTime=performance?(step.frame-a.phase*8)*250:(step.frame+.01-a.phase*24)/24*1000;
    Germany3D.sync();
   },{...metadata,step});
   const cues=[];
   for(const [cue,index] of [['closed',0],['open',1],['wide',12],['round',10],['bite',5]]){
    await poseCue(page,id,index,30);
    const observation=await page.evaluate(id=>{
     Germany3D.sync();const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);
     return{key:a.renderKey,frame:a.frame??a.cell,sample:a.mouthSample,pose:a.mouthPose,profile:GermanyAmtLips.displayedMouthProfile(a),registration:GermanyAmtLips.displayedMouth(a),oralFrame:GermanyAmtLips.displayedMouthFrame(a),speech:BuergeramtLevel.lipSpeech,paint:Germany3D.amtLipSplat,hole:a.mesh.material.userData.lipHole.value};
    },id);
    assert(observation.key.startsWith('atlas:'),'capture actual baked atlas transport');assert(observation.registration.every(Number.isFinite));assert(observation.oralFrame.axes.every(Number.isFinite));assert.equal(observation.speech.actor,id);
    if(moving){assert.equal(observation.sample,step.frame);assert.equal(observation.pose,['work','gesture','look','flinch'].indexOf(step.mode))}
    else assert.equal(observation.frame,performance&&lead?step.row*8+step.frame:step.frame);
    const preOpen=observation.profile.source_upper.some((v,i)=>Math.abs(v-observation.profile.source_lower[i])>.001);
    assert.equal(observation.paint.visible,cue!=='closed'||preOpen);assert.equal(observation.hole,observation.paint.visible?1:0);
    const path=`${output}/${name}-${id}-action-${step.mode??step.row??'idle'}-${step.frame}-${cue}.png`;
    await page.screenshot({path,clip:await faceClip(page,id,true)});cues.push({cue,observation,path});
   }
   results.push({id,step,cues});
  }
  writeFileSync(`${output}/${name}-atlas-actions-progress.json`,JSON.stringify({revision,results},null,2));console.log(name,id,'all baked action / idle cells PASS');
 }
 return results;
}
