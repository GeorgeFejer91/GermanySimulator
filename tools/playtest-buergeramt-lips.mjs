// Silent production-renderer fixture. Forced dialogue is not a natural-flow claim.
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {auditMouthCompletion,auditClerkRequests} from './audit-mouth-completion.mjs';
import {auditMouthFrames} from './audit-mouth-frames.mjs';
const baselineFiles=['tools/playtest-buergeramt-lips.mjs','tools/audit-mouth-completion.mjs','tools/audit-mouth-frames.mjs','speech-mouth.js','jobcenter.js','assets/audio/jobcenter/overlord.json','buergeramt.js','world3d.js','buergeramt-lips.js','buergeramt-mouth-paint.js','buergeramt-painted-anchor.js','buergeramt-gaussian-scene.js','buergeramt-gaussian-animation.js'];
const sources=process.env.PLAYTEST_BASE_REF?new Map(baselineFiles.map(file=>[file,execFileSync('git',['show',process.env.PLAYTEST_BASE_REF+':'+file],{encoding:'utf8',maxBuffer:8_000_000})])):null;
const fixtureSource=file=>sources?.get(file)??readFileSync(file,'utf8');
const motionOnly=process.env.PLAYTEST_MOTION_ONLY==='1';
const nativePaint=motionOnly||process.env.PLAYTEST_NATIVE_PAINT==='1';
const transforms=process.env.PLAYTEST_TRANSFORMS==='1';
const poseOnly=process.env.PLAYTEST_POSE_ONLY==='1';
const cueMatrix=process.env.PLAYTEST_CUE_MATRIX==='1';
const completionOnly=process.env.PLAYTEST_COMPLETION_ONLY==='1';
const samplesOnly=process.env.PLAYTEST_SAMPLES_ONLY==='1';
const clerkRequestsOnly=process.env.PLAYTEST_CLERK_REQUESTS_ONLY==='1';
if(motionOnly&&sources)throw new Error('Motion capture requires the current production source');
const nativeIds=['clerk','aktenkurier','archivbotin','formularsammler','nummernfluesterer','nachtschichtmelderin','pfandarchitektin','kopiependler','warteschlangenpoetin','renter','parent','pensioner'];
const readRevision=()=>Object.fromEntries(['buergeramt.js','world3d.js','buergeramt-lips.js','buergeramt-lipsync.js','buergeramt-mouth-paint.js','buergeramt-splat.js','buergeramt-gaussian-scene.js','buergeramt-painted-anchor.js','assets/buergeramt/speech/mouth-cues.js','assets/buergeramt/characters/mouth-profiles.json',...(nativePaint?nativeIds.map(id=>'assets/buergeramt/animation/'+id+'.json'):[])].map(f=>[f,createHash('sha256').update(fixtureSource(f)).digest('hex')]));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/lip-motion/review';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
const reports=[];
async function poseCue(page,id,index,settleMs=150){
 await page.evaluate(id=>{window.lipFixtureTime=0;window.lipTestSpeech=null;__lipProbe.content(id==='clerk'?'FRAU KNICK':id,'Mama fünf Omi schöne Euro!',[],null,null,null,{id,tone:'procedural',valence:0})},id);
 await page.waitForFunction(()=>!!window.lipTestSpeech);
 await page.evaluate(index=>{
  lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:index});window.lipFixtureTime=35;
  const progress=BuergeramtLevel.lipSpeech.index-index;
  if(!(progress>0))throw Error('Controlled speech cue did not advance');
  window.lipFixtureTime=35*.5/progress;window.lipFixtureRenderTime+=100;
  Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync();
 },index);await page.waitForTimeout(settleMs);
}
async function faceClip(page,id,forceAtlas=false){
 return page.evaluate(async({id,nativePaint})=>{
  const T=await import('https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js');
  const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id),height=actor.mesh.geometry.parameters.height*actor.mesh.scale.y;
  let rect,aspect=actor.mesh.geometry.parameters.width/actor.mesh.geometry.parameters.height;
  if(nativePaint){
   const gaussianId=actor.performance&&actor.lead?'clerk':actor.animationId??actor.id;
   const entry=Germany3D.amtGaussian.actors.find(a=>a.anchor?.visible&&a.id===gaussianId);
   const manifest=await(await fetch('./assets/buergeramt/animation/'+entry.manifestId+'.json')).json();
   const {nativeMouthRect}=await import('./buergeramt-mouth-paint.js?v=20261013-character-lips');
   const pair=entry.anchor.pair,a=nativeMouthRect(manifest,pair.from),b=nativeMouthRect(manifest,pair.to);
   const left=Math.min(a[0]-3*a[2],b[0]-3*b[2]),right=Math.max(a[0]+3*a[2],b[0]+3*b[2]);
   const bottom=Math.min(a[1]-3*a[3],b[1]-3*b[3]),top=Math.max(a[1]+3*a[3],b[1]+3*b[3]);
   rect=[(left+right)/2,(bottom+top)/2,(right-left)/6,(top-bottom)/6];aspect=manifest.canvas_xy[0]/manifest.canvas_xy[1];
  }else rect=GermanyAmtLips.displayedMouth(actor);
  const points=[];
  for(const x of [-3,3])for(const y of [-3,3]){
   const p=new T.Vector3((rect[0]+x*rect[2]-.5)*height*aspect,(rect[1]+y*rect[3]-.5)*height,0);
   p.applyQuaternion(actor.mesh.quaternion).add(actor.mesh.position).project(__lipRender.camera);points.push([(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2]);
  }
  const x=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))),y=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1]))));
  return{x,y,width:Math.max(1,Math.min(innerWidth-x,Math.ceil(Math.max(...points.map(p=>p[0])))-x)),height:Math.max(1,Math.min(innerHeight-y,Math.ceil(Math.max(...points.map(p=>p[1])))-y))};
 },{id,nativePaint:nativePaint&&!forceAtlas});
}
try{
 const viewports=[['desktop',1280,800],['android-portrait',390,844],['android-landscape',844,390],['reduced-motion',1280,800],['asset-failure',1280,800],['profile-failure',1280,800]]
  .filter(([name])=>!process.env.PLAYTEST_VIEWPORT||process.env.PLAYTEST_VIEWPORT.split(',').includes(name));
 const cases=motionOnly?viewports.filter(([name])=>name==='desktop'||name==='android-portrait')
  .flatMap(([name,width,height])=>['clerk','aktenkurier'].filter(actor=>!process.env.PLAYTEST_MOTION_ACTOR||process.env.PLAYTEST_MOTION_ACTOR.split(',').includes(actor)).map(actor=>[name+'-'+actor,width,height,actor])):viewports;
 if(motionOnly&&!cases.length)throw new Error('Motion capture needs desktop or android-portrait');
 for(const [name,width,height,motionActor] of cases){
  const revision=readRevision();
  const context=await browser.newContext({viewport:{width,height},isMobile:name.startsWith('android'),hasTouch:name.startsWith('android'),reducedMotion:name==='reduced-motion'?'reduce':'no-preference',...(motionOnly||process.env.PLAYTEST_VIDEO&&name==='desktop'?{recordVideo:{dir:output+'/video',size:{width,height}}}:{})});
  await context.addInitScript(()=>{
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;(window.__lipMediaPlayers??=[]).push(this);return play.apply(this,args)};
   const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}return connect.call(this,target,...args)};
   speechSynthesis.speak=u=>{u.volume=0;window.lipTestSpeech=u;u.onstart?.();u.onpause?.()};speechSynthesis.cancel=()=>{};
  });
  const page=await context.newPage(),errors=[],warnings=[];page.setDefaultTimeout(60000);
  if(sources)await page.route('**/*.js?*',route=>{const file=new URL(route.request().url()).pathname.split('/').at(-1);return sources.has(file)?route.fulfill({contentType:'text/javascript',body:sources.get(file)}):route.continue()});
  page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror',e.stack)});page.on('console',m=>{if(m.type()==='error'){warnings.push(m.text());console.log('browser',m.text().slice(0,500))}});
  page.on('requestfailed',request=>console.log('requestfailed',request.url(),request.failure()?.errorText));
  await page.route('**/buergeramt-lips.js?*',route=>route.fulfill({contentType:'text/javascript',body:fixtureSource('buergeramt-lips.js').replace('createTrack(now=()=>performance.now())','createTrack(now=()=>window.lipFixtureTime??performance.now())').replace(/(const poseGaps=\{[^\n]+\};)/,'$1window.__lipGapTable=poseGaps;')}));
  await page.route('**/buergeramt.js?*',route=>route.fulfill({contentType:'text/javascript',body:fixtureSource('buergeramt.js').replace('createTrack(()=>visualClock*1000)','createTrack(()=>window.lipFixtureTime??visualClock*1000)').replace('requestAnimationFrame(()=>{if(current()&&!settled)','queueMicrotask(()=>{if(current()&&!settled)').replace(/\}\)\(\);\s*$/,'window.__lipProbe={content,view,setStage,characters,cancelSpeech,showCharacter,beginOmen,resetOmen,omen,get clerkAnimation(){return clerkAnimation},startRecorded(id,path){const clip=GermanySimulatorAudioText.recordings[path];cancelSpeech();line.textContent=clip.source;lips.prepare(id,clip.source,1);say(clip.source,()=>{},null,null,{rate:1},clip.voiceId)},get options(){return options}};})();')}));
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:fixtureSource('world3d.js').replace('mobile:amtMobile,reducedMotion:amtReducedMotion});',nativePaint?'mobile:amtMobile,reducedMotion:amtReducedMotion});':'mobile:amtMobile,reducedMotion:{matches:true}});').replace('animateAmtCharacters(now,level);animateAmtMoving(now,level);','animateAmtCharacters(window.lipFixtureBodyTime??now,level);animateAmtMoving(window.lipFixtureBodyTime??now,level);').replace('const actionDetail=close&&','const actionDetail=window.lipAuditAtlas!==true&&close&&').replace('const walkDetail=close&&','const walkDetail=window.lipAuditAtlas!==true&&close&&').replace('const detailed=close&&!!actor.detail?.image;','const detailed=window.lipAuditAtlas!==true&&close&&!!actor.detail?.image;').replace('updateAmtMouth(level,now);','updateAmtMouth(level,window.lipFixtureRenderTime??now);').replace('window.Germany3D={ready:true,','window.__lipRender={scene:amtScene,camera:amtCamera,renderer,amtMoving,amtCharacters};window.Germany3D={ready:true,')}));
  if(name==='profile-failure')await page.route('**/characters/mouth-profiles.json*',route=>route.abort('failed'));
  if(name==='asset-failure')await page.route('**/omen/aktenkurier.splat*',route=>route.abort('failed'));
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:8876/index.html')+'?geheim=buergeramt&voicePreview=1',{waitUntil:'commit',timeout:45000});
  try{await page.waitForFunction(()=>window.Germany3D?.ready&&window.BuergeramtLevel?.active&&Germany3D.officeAssetsReady,null,{timeout:90000})}
  catch(error){console.log(await page.evaluate(()=>({level:!!window.BuergeramtLevel,active:window.BuergeramtLevel?.active,renderer:window.Germany3D?.ready,lips:!!window.GermanyAmtLips,status:window.Germany3D?.officeAssetStatus})));throw error}
  console.log(name,'ready');
  await page.evaluate(({nativePaint,transforms,motionOnly})=>{
   window.lipTransformOverrides={};
   window.lipOriginalCatalog=GermanySimulatorAudioText;
   // Synthetic shape probes explicitly bypass Knick's captions-only missing
   // recording policy. The real-media pass restores the production catalogue.
   const clerkVoice=BuergeramtStory.clerkIdentity.voiceId;
   window.lipControlledCatalog={...lipOriginalCatalog,recordedClip:()=>null,candidateClip:()=>null,productionVoices:{...lipOriginalCatalog.productionVoices,[clerkVoice]:{...lipOriginalCatalog.productionVoices?.[clerkVoice],fallback:'browser'}}};
   window.GermanySimulatorAudioText=lipControlledCatalog;
   // This fixture checks the atlas fallback; active native Gaussian paint has
   // its own production-scene fixture. Disable only admission in this context.
   const nativeCharacters=Object.getOwnPropertyDescriptor(BuergeramtLevel,'characters').get,nativeClerk=Object.getOwnPropertyDescriptor(BuergeramtLevel,'clerkPerformance').get;
   window.lipReadClerk=nativeClerk;
   if(motionOnly){
    Object.defineProperty(BuergeramtLevel,'characters',{get:()=>nativeCharacters().map(a=>({...a,mode:a.id==='aktenkurier'?'gesture':a.mode,animation:lipTransformOverrides[a.id]??a.animation}))});
   }else if(!nativePaint){
    // A work-mode actor synthesizes its own native work anchor; select the
    // frozen gesture fallback so a null animation actually prevents admission.
    Object.defineProperty(BuergeramtLevel,'characters',{get:()=>nativeCharacters().map(a=>({...a,mode:lipTransformOverrides[a.id]?.mode??'gesture',phase:lipTransformOverrides[a.id]?.phase??a.phase,frame:lipTransformOverrides[a.id]?.frame??a.frame,heading:lipTransformOverrides[a.id]?.heading??a.heading,animation:null}))});
    Object.defineProperty(BuergeramtLevel,'clerkPerformance',{get:()=>({...nativeClerk(),row:lipTransformOverrides.clerk?.row??nativeClerk().row,frame:lipTransformOverrides.clerk?.frame??nativeClerk().frame,animation:null})});
    Object.defineProperty(BuergeramtLevel,'stationaryAnimations',{get:()=>({})});
   }else{
    // Hold native work anchors for this articulation fixture. Natural body
    // admission and return arcs are covered by the separate scene playtest.
    const stationary=Object.getOwnPropertyDescriptor(BuergeramtLevel,'stationaryAnimations').get;
    Object.defineProperty(BuergeramtLevel,'characters',{get:()=>nativeCharacters().map(a=>({...a,mode:lipTransformOverrides[a.id]?.mode??(transforms?'gesture':a.mode),phase:lipTransformOverrides[a.id]?.phase??a.phase,frame:lipTransformOverrides[a.id]?.frame??a.frame,heading:lipTransformOverrides[a.id]?.heading??a.heading,animation:lipTransformOverrides[a.id]?.mode==='walk'?null:lipTransformOverrides[a.id]??(transforms?{...a.animation,arc:null,pose:'work',phase:1}:a.animation)}))});
    Object.defineProperty(BuergeramtLevel,'stationaryAnimations',{get:()=>Object.fromEntries(Object.entries(stationary()).map(([id,state])=>[id,lipTransformOverrides[id]??{...state,arc:null,pose:id.startsWith('clerk-desk')?'ready':'work'}]))});
    Object.defineProperty(BuergeramtLevel,'clerkPerformance',{get:()=>{const state=nativeClerk();return{...state,row:lipTransformOverrides.clerk?.row??0,animation:lipTransformOverrides.clerk??{...state.animation,arc:null,pose:'ready',phase:1}}}});
   }
   window.lipOriginalUpdate=BuergeramtLevel.update;BuergeramtLevel.update=()=>{};__lipProbe.options.voiceOn=()=>true;window.lipFixtureTime=0;window.lipFixtureRenderTime=performance.now();__lipProbe.setStage('character');
   window.lipActorOrigins=__lipProbe.characters.map(a=>({id:a.id,x:a.x,z:a.z}));
  },{nativePaint,transforms,motionOnly});
  if(clerkRequestsOnly){
   const requests=await auditClerkRequests({page,output,name,revision});assert.deepEqual(errors,[]);
   reports.push({name,requests,revision,silent:true,physicalAndroid:false,errors,warnings});
   const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${name}-clerk-requests.webm`);writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));continue;
  }
  if(samplesOnly){
   const samples=await auditMouthFrames({page,output,name,revision,poseCue,faceClip});
   assert.deepEqual(errors,[]);reports.push({name,samples,revision,silent:true,physicalAndroid:false,errors,warnings});
   const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${name}-samples.webm`);writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));continue;
  }
  if(completionOnly){
   const completion=await auditMouthCompletion({page,output,name,nativePaint,revision,faceClip});
   assert.deepEqual(errors,[]);
   reports.push({name,nativePaint,completion,silent:true,physicalAndroid:false,revision,errors,warnings});
   const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${name}-completion.webm`);writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));continue;
  }
  if(motionOnly){
   const clipPath=motionActor==='clerk'?'./assets/voices/knick/knick-registration-identityfix-reply-1.mp3':'./assets/voices/amt-fever/amt-horst-stempelmann-fever-1.mp3';
   const setup=await page.evaluate(async({actor,clipPath})=>{
    const clip=lipOriginalCatalog.recordings[clipPath];if(!clip?.source||!clip?.sha256)throw Error('Exact native recording missing: '+clipPath);
    const manifest=await(await fetch('./assets/buergeramt/animation/'+actor+'.json')).json();
    const openStates=manifest.states.filter(state=>state.mouth_gap?.some(value=>Math.abs(value)>.015)).map(state=>state.id);
    if(actor==='aktenkurier'&&!openStates.length)throw Error('Expected a pre-open Aktenkurier source');
    const source=__lipProbe.characters.find(a=>a.id===actor),rendered=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===actor||a.lipId===actor);
    if(source){source.x=0;source.z=1.8;rendered.mesh.position.set(0,rendered.mesh.position.y,1.8)}
    __lipProbe.view.x=source?.x??rendered.mesh.position.x;__lipProbe.view.z=(source?.z??rendered.mesh.position.z)+1.25;__lipProbe.view.yaw=0;
    if(actor==='aktenkurier')lipTransformOverrides.aktenkurier={generation:0,actionId:1,arc:'work-gesture-work',pose:'work',phase:0};
    // Prime the production paired paintings while the existing body clock is
    // fixed at its initial pose. The real clip starts only after both sources
    // are ready; no fixture clock is used during its speech or body motion.
    window.lipTestSpeech=null;
    __lipProbe.content(actor==='clerk'?BuergeramtStory.clerkIdentity.speaker:BuergeramtStory.characters.aktenkurier.speaker,'Mama',[],()=>{},null,null,actor==='clerk'?null:{id:actor,tone:'procedural',valence:0});
    Germany3D.sync();
    return{clipPath,clipSha256:clip.sha256,source:clip.source,duration:clip.durationMs/1000,openStates,arcDuration:manifest.arcs.find(a=>a.id==='work-gesture')?.duration??null};
   },{actor:motionActor,clipPath});
   await page.waitForFunction(actor=>window.lipTestSpeech&&BuergeramtLevel.lipSpeech.actor===actor&&BuergeramtLevel.lipSpeech.mode==='voice',motionActor,{timeout:15000});
   await page.evaluate(()=>lipTestSpeech.onpause?.());
   await page.waitForFunction(actor=>{
    Germany3D.sync();const anchor=Germany3D.amtGaussian.actors.find(a=>a.id===actor)?.anchor;
    return anchor?.visible&&!anchor.pending&&anchor.technique==='native-texture-gaussians'&&anchor.phase<.1&&anchor.pair?.from===(actor==='clerk'?'ready':'work');
   },motionActor,{timeout:20000}).catch(async error=>{
    const diagnostic=await page.evaluate(actor=>({speech:BuergeramtLevel.lipSpeech,clerk:BuergeramtLevel.clerkPerformance,actor:BuergeramtLevel.characters.find(a=>a.id===actor),paint:Germany3D.amtGaussian.actors.find(a=>a.id===actor),owner:Germany3D.amtGaussian.owner}),motionActor);
    writeFileSync(`${output}/${name}-warm-failure.json`,JSON.stringify(diagnostic,null,2));throw error;
   });
   const warm=await page.evaluate(({actor,clipPath})=>{
    const anchor=Germany3D.amtGaussian.actors.find(a=>a.id===actor).anchor;
    const ready={pair:anchor.pair,phase:anchor.phase,technique:anchor.technique,resident:anchor.resident};
    __lipProbe.cancelSpeech();window.lipFixtureTime=null;window.lipFixtureRenderTime=null;
    window.GermanySimulatorAudioText={...lipOriginalCatalog,recordedClip:(_voice,text)=>text===lipOriginalCatalog.recordings[clipPath].source?clipPath:null,candidateClip:()=>null};
    const who=actor==='clerk'?BuergeramtStory.clerkIdentity.speaker:BuergeramtStory.characters.aktenkurier.speaker;
    __lipProbe.content(who,lipOriginalCatalog.recordings[clipPath].source,[],()=>{},null,null,actor==='clerk'?null:{id:actor,tone:'procedural',valence:0});
    return ready;
   },{actor:motionActor,clipPath});
   await page.waitForFunction(path=>BuergeramtLevel.lipSpeech.mode==='recorded'&&BuergeramtLevel.lipSpeech.recording===path&&!BuergeramtLevel.lipSpeech.paused,clipPath,{timeout:20000});
   await page.evaluate(({actor,clipPath,duration,arcDuration})=>{
    const media=window.__lipMediaPlayers?.find(item=>item.src.includes(clipPath.replace(/^\.\//,'')));if(!media)throw Error('Native media player unavailable');
    const motion={trace:[],events:[],done:false,media,startedAt:performance.now(),lastFrame:performance.now(),paused:false,resumed:false,cancelled:false};window.__lipMotion=motion;
    const sample=label=>{
     const speech=BuergeramtLevel.lipSpeech,anchor=Germany3D.amtGaussian.actors.find(a=>a.id===actor)?.anchor;
     const state={label,wallSeconds:(performance.now()-motion.startedAt)/1000,mediaSeconds:media.currentTime,mediaPaused:media.paused,cueSeconds:speech.time,owner:speech.actor,mode:speech.mode,timing:speech.timing,recording:speech.recording,shape:speech.shape,paused:speech.paused,bodyPhase:actor==='clerk'?BuergeramtLevel.clerkPerformance.animation?.phase:lipTransformOverrides.aktenkurier?.phase,bodyArc:actor==='clerk'?BuergeramtLevel.clerkPerformance.animation?.arc:lipTransformOverrides.aktenkurier?.arc,anchor:anchor?{visible:anchor.visible,pair:anchor.pair,phase:anchor.phase,state:anchor.state,lipShape:anchor.lipShape}:null};
     motion.trace.push(state);if(label!=='sample')motion.events.push(state);return state;
    };
    const tick=now=>{
     if(motion.done)return;
     const dt=Math.min(.1,Math.max(0,(now-motion.lastFrame)/1000));motion.lastFrame=now;
     lipOriginalUpdate(dt);
     if(actor==='aktenkurier')lipTransformOverrides.aktenkurier.phase=((now-motion.startedAt)/1000/(2*arcDuration))%1;
     Germany3D.sync();
     if(media.currentTime>=1.8&&!motion.paused){motion.paused=true;media.pause();sample('pause');setTimeout(()=>{if(!motion.done)sample('pause-hold')},180);setTimeout(()=>{if(motion.done)return;sample('before-resume');motion.resumed=true;media.play();sample('resume')},260)}
     if(motion.resumed&&media.currentTime>=duration-.2&&!motion.cancelled){sample('before-cancel');motion.cancelled=true;__lipProbe.cancelSpeech();Germany3D.sync();sample('cancel');motion.done=true;return}
     if((now-motion.startedAt)/1000>duration+4){motion.events.push({label:'timeout',mediaSeconds:media.currentTime});motion.done=true;return}
     requestAnimationFrame(tick);
    };
    sample('start');motion.timer=setInterval(()=>sample('sample'),100);requestAnimationFrame(tick);
   },{actor:motionActor,clipPath,duration:setup.duration,arcDuration:setup.arcDuration});
   await page.waitForTimeout(1250);await page.screenshot({path:`${output}/${name}-speaking.png`});
   await page.waitForFunction(()=>window.__lipMotion?.done,null,{timeout:16000});
   const motion=await page.evaluate(()=>{clearInterval(__lipMotion.timer);BuergeramtLevel.update=lipOriginalUpdate;return{trace:__lipMotion.trace,events:__lipMotion.events}});
   writeFileSync(`${output}/${name}-trace.json`,JSON.stringify({name,actor:motionActor,forcedScene:true,silent:true,physicalAndroid:false,normalSpeed:true,clip:setup,warm,revision,...motion,errors,warnings},null,2));
   const samples=motion.trace,owned=samples.filter(s=>s.mode==='recorded'&&s.owner===motionActor);
   assert(owned.length>20,'native clip must own a sustained motion interval');
   assert(owned.every(s=>s.timing==='audio-cues'&&s.recording===clipPath),'media playhead must own the unchanged cue track');
   assert(owned.at(-1).mediaSeconds-owned[0].mediaSeconds>setup.duration-1,'native audio must progress at normal speed');
   assert(new Set(owned.map(s=>s.shape.map(v=>v.toFixed(2)).join(','))).size>3,'real cue shapes must change');
   assert(Math.max(...owned.map(s=>s.bodyPhase??0))-Math.min(...owned.map(s=>s.bodyPhase??0))>.15,'body phase must advance continuously');
   const paintedMotion=owned.filter(s=>s.anchor?.visible&&s.anchor.phase>.05&&s.anchor.phase<.95);
   assert(paintedMotion.length>=5,'native painted anchor must be visible through intermediate body phases');
   assert(new Set(paintedMotion.map(s=>s.shape.map(value=>value.toFixed(2)).join(','))).size>2,'real cues must change on a moving painted anchor');
   const pause=motion.events.find(s=>s.label==='pause'),hold=motion.events.find(s=>s.label==='pause-hold'),beforeResume=motion.events.find(s=>s.label==='before-resume');
   assert(pause?.mediaPaused&&hold?.mediaPaused&&beforeResume?.mediaPaused&&motion.events.some(s=>s.label==='resume'),'pause and resume must be observed');
   assert(beforeResume.wallSeconds-pause.wallSeconds>.2&&Math.abs(beforeResume.mediaSeconds-pause.mediaSeconds)<.03,'paused media playhead must hold');
   assert(Math.abs(hold.cueSeconds-pause.cueSeconds)<.03&&Math.abs(beforeResume.cueSeconds-pause.cueSeconds)<.03,'paused cue time must hold');
   assert.deepEqual(hold.shape,pause.shape);assert.deepEqual(beforeResume.shape,pause.shape);
   const cancelled=motion.events.find(s=>s.label==='cancel');
   assert(cancelled?.owner===null&&cancelled.mode==='idle'&&cancelled.shape.every(value=>value===0),'cancellation must restore exact resting cue');
   if(motionActor==='aktenkurier')assert(owned.some(s=>setup.openStates.includes(s.anchor?.pair?.from)||setup.openStates.includes(s.anchor?.pair?.to)),'pre-open source must appear during speech');
   assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(w=>/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(w)),[]);
   const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${name}-motion.webm`);
   reports.push({name,actor:motionActor,forcedScene:true,silent:true,physicalAndroid:false,normalSpeed:true,clip:setup,warm,revision,paintedMotionFrames:paintedMotion.length,trace:`${output}/${name}-trace.json`,video:`${output}/${name}-motion.webm`,errors,warnings});
   writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify({name,result:'PASS',clip:clipPath,samples:samples.length}));continue;
  }
  if(name==='profile-failure'){
   await page.evaluate(()=>{__lipProbe.content('DER AKTENKURIER','Mama fünf Omi!',[],null,null,null,{id:'aktenkurier'});Germany3D.sync()});
   await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.actor==='aktenkurier'&&window.lipTestSpeech,null,{timeout:15000});
   await page.evaluate(()=>{lipTestSpeech.onresume?.();window.lipFixtureTime=0;lipTestSpeech.onboundary({charIndex:1});window.lipFixtureTime=35;Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const fallback=await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,splat:Germany3D.amtLipSplat,profiles:__lipRender.amtMoving.map(a=>GermanyAmtLips.displayedMouthProfile(a)),holes:__lipRender.amtMoving.map(a=>a.mesh.material.userData.lipHole.value)}));
   assert.equal(fallback.speech.actor,'aktenkurier');assert(fallback.speech.active);assert.equal(fallback.splat?.visible??false,false);assert(fallback.profiles.every(p=>p===null));assert(fallback.holes.every(h=>h===0));assert.deepEqual(errors,[]);
   await page.screenshot({path:output+'/'+name+'.png'});reports.push({name,silent:true,revision,fallback,errors,warnings});await context.close();writeFileSync(output+'/results.json',JSON.stringify(reports,null,2));console.log(name,'PASS');continue;
  }
  const actors=await page.evaluate(()=>[...__lipRender.amtMoving.map(a=>a.id),...__lipRender.amtCharacters.map(a=>a.performance?a.lipId:a.id)]);
  if(process.env.PLAYTEST_ACTOR)for(let i=actors.length-1;i>=0;i--)if(!process.env.PLAYTEST_ACTOR.split(',').includes(actors[i]))actors.splice(i,1);
  if(process.env.PLAYTEST_OMEN_ONLY)actors.length=0;
  const snapshots=[];let renderCost=null;
  for(const id of actors){
   await page.evaluate(id=>{
    for(const a of __lipProbe.characters){const origin=lipActorOrigins.find(o=>o.id===a.id);a.x=origin.x;a.z=origin.z}
    const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);
    const state=__lipProbe.characters.find(a=>a.id===id);
    // Present each native actor in an unobstructed fixture lane, away from walls.
    if(state){state.x=0;state.z=1.8;actor.mesh.position.set(0,actor.mesh.position.y,1.8)}
    const x=state?.x??actor.mesh.position.x,z=state?.z??actor.mesh.position.z;
    __lipProbe.view.x=x;__lipProbe.view.z=z+1.25;__lipProbe.view.yaw=0;
    Germany3D.sync();
   },id);
   await page.waitForTimeout(300);
   await page.evaluate(id=>{
    // Fixture-only text exercises the local visemes. Node tests cover authored lines.
    const who=id==='clerk'?'FRAU KNICK':id;
    window.lipTestSpeech=null;
    __lipProbe.content(who,'Mama fünf Omi schöne Euro!',[],null,null,null,{id,tone:'procedural',valence:0});
    Germany3D.sync();
   },id);
   await page.waitForFunction(id=>window.lipTestSpeech&&BuergeramtLevel.lipSpeech.actor===id&&BuergeramtLevel.lipSpeech.mode==='voice',id,{timeout:15000}).catch(async error=>{console.log('speech-start',await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,text:document.getElementById('amt-line').textContent,utterance:window.lipTestSpeech?.text})));throw error});
   await page.waitForTimeout(220); // close-detail readiness
   await page.evaluate(()=>{lipTestSpeech.onresume?.();window.lipFixtureTime=0;lipTestSpeech.onboundary({charIndex:1});window.lipFixtureTime=35;window.lipFixtureRenderTime+=100;Germany3D.sync();lipTestSpeech.onpause?.()});
   await page.waitForTimeout(120);
   await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});await page.waitForTimeout(100);
   const open=await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,splat:Germany3D.amtLipSplat,actor:(()=>{const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===BuergeramtLevel.lipSpeech.actor||a.lipId===BuergeramtLevel.lipSpeech.actor);return{hole:a.mesh.material.userData.lipHole.value,foot:a.mesh.position.y-a.mesh.geometry.parameters.height/2,crop:a.renderKey}})(),memory:Germany3D.inspectAssets().memory}));
   assert.equal(open.speech.actor,id);assert.equal(open.speech.paused,true);assert(open.speech.shape[0]>.75);assert.equal(open.splat.kernels,425);assert.equal(open.actor.foot,0);
   if(nativePaint){
    await page.waitForFunction(()=>{Germany3D.sync();return Germany3D.amtGaussian.actors.some(a=>a.anchor?.visible&&a.anchor.lipShape[0]>.75)},null,{timeout:90000}).catch(async error=>{writeFileSync(`${output}/${name}-${id}-failure.json`,JSON.stringify(await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,gaussian:Germany3D.amtGaussian,clerk:BuergeramtLevel.clerkPerformance,view:BuergeramtLevel.view})),null,2));throw error});
    open.gaussian=await page.evaluate(()=>Germany3D.amtGaussian);open.splat=await page.evaluate(()=>Germany3D.amtLipSplat);assert.equal(open.splat.visible,false);
   }else{assert.equal(open.splat.visible,true);assert.equal(open.actor.hole,1);assert.equal(open.splat.depthTest,true);assert.equal(open.splat.layer,2,'mouth shares the final actor pass')}
   if(!nativePaint&&id===actors[0])renderCost=await page.evaluate(()=>{
    const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===BuergeramtLevel.lipSpeech.actor||a.lipId===BuergeramtLevel.lipSpeech.actor),patch=a.mesh.children.find(m=>m.geometry?.instanceCount===425);
    const sample=()=>{const times=[];for(let n=0;n<30;n++){const at=performance.now(),r=__lipRender.renderer,s=__lipRender.scene,c=__lipRender.camera;
     r.render(s,c);const background=s.background;s.background=null;r.autoClear=false;c.layers.set(1);
     try{r.render(s,c)}finally{c.layers.set(0);r.autoClear=true;s.background=background}
     times.push(performance.now()-at)}times.sort((a,b)=>a-b);return{p50Ms:times[15],p95Ms:times[28],calls:__lipRender.renderer.info.render.calls,triangles:__lipRender.renderer.info.render.triangles,memory:{...__lipRender.renderer.info.memory}}};
    const active=sample();patch.visible=false;a.mesh.material.userData.lipHole.value=0;const baseline=sample();patch.visible=true;a.mesh.material.userData.lipHole.value=1;
    return{active,baseline,scope:'same frozen production scene, CPU submission only; GPU timing unavailable'};
   });
   await page.screenshot({path:`${output}/${name}-${id}-open.png`});
   const face=await faceClip(page,id);await page.screenshot({path:`${output}/${name}-${id}-face-open.png`,clip:face});
   const transformationFrames=[];
   if(transforms){
    const metadata=await page.evaluate(id=>{const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id),moving=__lipRender.amtMoving.includes(a);return{key:a.performance&&a.lead?'clerk':a.animationId??a.id,manifestId:a.performance?'clerk':moving?a.id:a.name,performance:!!a.performance,moving}},id);
    let steps=nativePaint?metadata.performance?
     ['raise','stamp','refuse','return'].flatMap(arc=>[0,.5,1].map(phase=>({arc,phase}))):[0,.25,.5,.75,1].map(phase=>({arc:'work-gesture-work',phase})):
     metadata.performance?[0,1,2,3,4,5].map(row=>({row})):metadata.moving?['work','gesture','look','flinch'].map(mode=>({mode})):[];
    if(nativePaint&&process.env.PLAYTEST_ALL_KEYS==='1'){
     const manifest=JSON.parse(readFileSync('assets/buergeramt/animation/'+metadata.manifestId+'.json'));
     steps=manifest.arcs.flatMap(arc=>[0,...arc.segments.flatMap(s=>[(s.start+s.end)/2,s.end])].map(time=>({arc:metadata.performance?arc.id:'work-gesture-work',phase:time/arc.duration*(metadata.performance?1:.5)})));
     if(metadata.performance)steps.push(...steps.slice().map(step=>({...step,arc:step.arc+'-back'})));
     if(!metadata.performance)steps.push(...steps.slice().reverse().map(step=>({...step,phase:1-step.phase})));
    }
    for(const [number,step] of steps.entries()){
     await page.evaluate(({key,step})=>{lipTransformOverrides[key]={generation:BuergeramtLevel.clerkPerformance.animation?.generation??0,actionId:1,pose:key.startsWith('clerk')?'ready':'work',...step};Germany3D.sync()}, {key:metadata.key,step});
     if(nativePaint)await page.waitForFunction(({key,step})=>{Germany3D.sync();const a=Germany3D.amtGaussian.actors.find(a=>a.id===key);return a?.anchor?.visible&&a.anchor.technique==='native-texture-gaussians'&&a.anchor.lipShape[0]>.75&&!a.anchor.pending}, {key:metadata.key,step},{timeout:90000});
     const target=await page.evaluate(()=>Germany3D.amtGaussian.owner?.activeSplats>0?Germany3D.amtGaussian.owner.startedUpdates+2:NaN);
     if(Number.isFinite(target))await page.waitForFunction(target=>{Germany3D.sync();return Germany3D.amtGaussian.owner.completedUpdates>=target},target,{timeout:45000});
     else await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{Germany3D.sync();requestAnimationFrame(()=>{Germany3D.sync();resolve()})})));
     if(!nativePaint)assert.equal(await page.evaluate(()=>Germany3D.amtGaussian.actors.length),0,'atlas fixture must disable native admission at every pose');
     const frame=await page.evaluate(id=>{const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);return{speech:BuergeramtLevel.lipSpeech,registration:GermanyAmtLips.displayedMouth(a),crop:a.renderKey,foot:a.mesh.position.y-a.mesh.geometry.parameters.height*a.mesh.scale.y/2,gaussian:Germany3D.amtGaussian}},id);
     assert.equal(frame.foot,0);assert(frame.speech.shape[0]>.75);assert(frame.registration?.every(Number.isFinite));
     await page.screenshot({path:`${output}/${name}-${id}-transform-${number}.png`});
     const crop=await faceClip(page,id);await page.screenshot({path:`${output}/${name}-${id}-transform-face-${number}.png`,clip:crop});
     transformationFrames.push({step,frame});
     if(cueMatrix){
      const cues=[['closed',0,[0,0,0,0]],['wide',12,[.65,1,0,0]],['round',10,[.62,0,1,0]],['bite',5,[.18,.1,0,1]]];
      const articulated=[];
      for(const [cue,index,expected] of cues){
       await poseCue(page,id,index);
       const observed=await page.evaluate(({id,key})=>{
        Germany3D.sync();const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);
        return{speech:BuergeramtLevel.lipSpeech,anchor:Germany3D.amtGaussian.actors.find(a=>a.id===key)?.anchor,registration:GermanyAmtLips.displayedMouth(actor),foot:actor.mesh.position.y-actor.mesh.geometry.parameters.height*actor.mesh.scale.y/2};
       },{id,key:metadata.key});
       assert.equal(observed.speech.actor,id);assert(observed.speech.active);
       observed.speech.shape.forEach((value,i)=>assert(Math.abs(value-expected[i])<1e-6,`${id}/${cue}: wrong cue component ${i}`));
       assert.equal(observed.foot,0);assert(observed.registration.every(Number.isFinite));
       if(nativePaint){assert(observed.anchor?.visible);assert.deepEqual(observed.anchor.lipShape,observed.speech.shape)}
       const path=`${output}/${name}-${id}-transform-${number}-${cue}.png`;
       await page.screenshot({path,clip:await faceClip(page,id)});
       articulated.push({cue,expected,observed,path});
      }
      transformationFrames.at(-1).cueMatrix=articulated;
      await poseCue(page,id,1);
     }
     if(!nativePaint&&process.env.PLAYTEST_POSE_CLOSURES==='1'){
      await poseCue(page,id,0);
      const closure=await page.evaluate(id=>{const a=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===id||a.lipId===id);return{speech:BuergeramtLevel.lipSpeech,profile:GermanyAmtLips.displayedMouthProfile(a),pose:a.mouthPose,key:a.renderKey,opacity:a.mesh.material.opacity,mapped:!!a.mesh.material.map?.image,hole:a.mesh.material.userData.lipHole.value,paint:Germany3D.amtLipSplat}},id);
      assert.equal(closure.speech.actor,id);assert(closure.speech.active);assert.deepEqual(closure.speech.shape,[0,0,0,0]);
      writeFileSync(output+'/'+name+'-'+id+'-pose-closure-'+number+'.json',JSON.stringify(closure,null,2));
      const preOpen=closure.profile.source_upper.some((v,i)=>Math.abs(v-closure.profile.source_lower[i])>.001);assert.equal(closure.paint.visible,preOpen);assert.equal(closure.hole,preOpen?1:0);
      await page.screenshot({path:output+'/'+name+'-'+id+'-pose-closed-'+number+'.png',clip:await faceClip(page,id)});
      await page.evaluate(()=>{__lipProbe.cancelSpeech();Germany3D.sync()});await page.waitForTimeout(100);
      await page.screenshot({path:output+'/'+name+'-'+id+'-pose-inactive-'+number+'.png',clip:await faceClip(page,id)});
      transformationFrames[transformationFrames.length-1].closure=closure;
      await poseCue(page,id,1);
     }

    }
    await page.evaluate(key=>{delete lipTransformOverrides[key];Germany3D.sync()},metadata.key);
    await page.waitForTimeout(200);
   }
   await page.evaluate(()=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:5});window.lipFixtureTime+=35;window.lipFixtureRenderTime+=100;Germany3D.sync();lipTestSpeech.onpause?.()});await page.waitForTimeout(120);
   await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const bite=await page.evaluate(()=>BuergeramtLevel.lipSpeech);assert(bite.shape[3]>.75);
   if(nativePaint)assert(await page.evaluate(()=>Germany3D.amtGaussian.actors.some(a=>a.anchor?.visible&&a.anchor.lipShape[3]>.75)));
   await page.screenshot({path:`${output}/${name}-${id}-bite.png`});
   await page.evaluate(()=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:10});window.lipFixtureTime+=35;window.lipFixtureRenderTime+=100;Germany3D.sync();lipTestSpeech.onpause?.()});await page.waitForTimeout(120);
   await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const round=await page.evaluate(()=>BuergeramtLevel.lipSpeech);assert(round.shape[2]>.75);
   if(nativePaint)assert(await page.evaluate(()=>Germany3D.amtGaussian.actors.some(a=>a.anchor?.visible&&a.anchor.lipShape[2]>.75)));
   await page.screenshot({path:`${output}/${name}-${id}-round.png`});
   await page.screenshot({path:`${output}/${name}-${id}-face-round.png`,clip:face});
   // A closed consonant in a fresh owned utterance keeps the same speaking
   // body key. Ending speech here used to switch the clerk's painting and
   // confound mouth-only comparisons with a stamp/head pose change.
   await page.evaluate(id=>{window.lipFixtureTime=0;window.lipTestSpeech=null;__lipProbe.content(id==='clerk'?'FRAU KNICK':id,'Mama fünf Omi schöne Euro!',[],null,null,null,{id,tone:'procedural',valence:0})},id);
   await page.waitForFunction(()=>!!window.lipTestSpeech);
   await page.evaluate(()=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:0});window.lipFixtureTime=35;Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   const closed=await page.evaluate(()=>{
    const speech=BuergeramtLevel.lipSpeech,paint=Germany3D.amtLipSplat;
    const actor=[...__lipRender.amtMoving,...__lipRender.amtCharacters].find(a=>a.id===speech.actor||a.lipId===speech.actor);
    const key=actor?.performance?'clerk':actor?.lipId||actor?.id||actor?.name;
    const profile=GermanyAmtLips.displayedMouthProfile?.(actor);
    const gap=profile?profile.source_upper.map((value,index)=>value-profile.source_lower[index]):window.__lipGapTable?.[key]?.[actor?.mouthPose??0]??window.__lipGapTable?.[key]?.[0]??[0,0];
    return{speech,paint,gap,pose:actor?.mouthPose??null,hole:actor?.mesh.material.userData.lipHole.value};
   });
   assert.equal(closed.speech.actor,id);assert.equal(closed.speech.active,true);assert.deepEqual(closed.speech.shape,[0,0,0,0]);
   // A closed consonant still owns the source when that painted pose has an
   // open cavity. Only the truly closed source can omit the fallback patch.
   const needsClosure=closed.gap.some(value=>Math.abs(value)>.015);
   assert.equal(closed.paint.visible,nativePaint?false:needsClosure);
   if(!nativePaint)assert.equal(closed.hole,needsClosure?1:0);
   await page.screenshot({path:`${output}/${name}-${id}-closed.png`});
   await page.screenshot({path:`${output}/${name}-${id}-face-closed.png`,clip:face});
   await page.evaluate(()=>{lipTestSpeech.onend?.();Germany3D.sync()});
   assert.equal(await page.evaluate(()=>Germany3D.amtLipSplat.actor),null);
   await page.screenshot({path:`${output}/${name}-${id}-inactive.png`});
   await page.screenshot({path:`${output}/${name}-${id}-face-inactive.png`,clip:face});
   snapshots.push({id,open,bite,round,closed,face,transformationFrames});
   writeFileSync(`${output}/${name}-progress.json`,JSON.stringify({name,nativePaint,silent:true,complete:false,revision,snapshots,errors,warnings},null,2));
   console.log(name,id,'PASS');
  }
  if(nativePaint||poseOnly){
   await page.evaluate(()=>{BuergeramtLevel.update=lipOriginalUpdate;document.getElementById('amt-leave').click();Germany3D.sync()});
   assert.equal(await page.evaluate(()=>Germany3D.amtGaussian.actors.length),0);assert.deepEqual(errors,[]);
   reports.push({name,nativePaint,atlasAdmissionDisabled:!nativePaint,poseOnly,silent:true,physicalAndroid:false,forcedDialogue:true,stationaryWorkAnchors:true,revision,snapshots,errors,warnings});
   await context.close();writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify({name,result:'PASS',nativePaint,actors:actors.length,errors}));continue;
  }
  // Native MP3 plays normally: do not seek or substitute a wall clock.
  const nativeWindow={start:await page.evaluate(()=>performance.now()/1000)};
  await page.evaluate(recordingPath=>{
   window.lipFixtureTime=null;window.lipFixtureRenderTime=null;window.GermanySimulatorAudioText=lipOriginalCatalog;
   const a=__lipRender.amtCharacters[0];__lipProbe.view.x=a.mesh.position.x;__lipProbe.view.z=a.mesh.position.z+1.6;
   const text=recordingPath?lipOriginalCatalog.recordings[recordingPath]?.source:BuergeramtStory.clerk[0].line;
   if(!text)throw Error('No catalogued source for recording probe');
   __lipProbe.content('FRAU KNICK',text);Germany3D.sync();
  },process.env.PLAYTEST_RECORDING||null);
  await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.mode==='recorded',null,{timeout:15000});
  const mediaTrace=await page.evaluate(async()=>{
   const trace=[];for(let i=0;i<40;i++){const sample=BuergeramtLevel.lipSpeech;if(sample.mode!=='recorded')break;trace.push(sample);if(sample.time-trace[0].time>=1.1)break;await new Promise(r=>setTimeout(r,120))}return trace;
  });
  writeFileSync(`${output}/${name}-native-media.json`,JSON.stringify(mediaTrace,null,2));
  assert(mediaTrace.at(-1).time>mediaTrace[0].time+.8);
  assert(mediaTrace.some(s=>s.shape[0]>.5)&&mediaTrace.some(s=>s.shape[0]<.01),'real speech contains both an audible opening and a closure');
  assert(mediaTrace.every(s=>s.timing==='audio-cues'),'the approved MP3 must use its acoustic binding');
  if(process.env.PLAYTEST_RECORDING)assert(mediaTrace.every(s=>s.recording===process.env.PLAYTEST_RECORDING),'recording probe keeps its exact catalogue selection');
  nativeWindow.end=await page.evaluate(()=>performance.now()/1000);
  await page.screenshot({path:`${output}/${name}-recorded-clerk.png`});
  await page.evaluate(()=>__lipProbe.cancelSpeech());
  // A real opaque blocker must occlude the mouth with its source actor.
  const occlusion=await page.evaluate(async()=>{
   const T=await import('https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js');
   window.GermanySimulatorAudioText=lipControlledCatalog;__lipProbe.content('FRAU KNICK','Mama');
   await new Promise(r=>setTimeout(r,35));lipTestSpeech.onpause();Germany3D.sync();
   const a=__lipRender.amtCharacters[0],wall=new T.Mesh(new T.PlaneGeometry(.9,1),new T.MeshBasicMaterial({color:0x2560a0}));
   wall.position.set(a.mesh.position.x,1.5,a.mesh.position.z+.6);__lipRender.scene.add(wall);Germany3D.sync();
   window.lipTestWall=wall;return{depthTest:Germany3D.amtLipSplat.depthTest,depthWrite:Germany3D.amtLipSplat.depthWrite};
  });
  await page.screenshot({path:`${output}/${name}-opaque-occlusion.png`});
  await page.evaluate(()=>{lipTestWall.removeFromParent();lipTestWall.geometry.dispose();lipTestWall.material.dispose();__lipProbe.cancelSpeech();Germany3D.sync()});
  // Exercise the production Spark handover (or its failed-load painted fallback).
  await page.evaluate(()=>{__lipProbe.resetOmen();__lipProbe.setStage('outside');Germany3D.sync()});
  await page.waitForFunction(fail=>fail?Germany3D.amtOmenSplat.skipped:Germany3D.amtOmenSplat.ready,name==='asset-failure',{timeout:45000});
  await page.evaluate(()=>{
   window.lipFixtureTime=0;window.lipTestSpeech=null;
   for(const a of __lipProbe.characters){const origin=lipActorOrigins.find(o=>o.id===a.id);a.x=origin.x;a.z=origin.z}
   const a=__lipProbe.characters[0];a.x=0;a.z=1.8;
   __lipProbe.view.x=0;__lipProbe.view.z=3.8;__lipProbe.view.yaw=0;
   __lipProbe.setStage('omen');__lipProbe.beginOmen(a);
   __lipProbe.content(BuergeramtStory.omen.speaker,'Mama fünf Omi schöne Euro!',[],null,null,null,{id:'aktenkurier',tone:'dread',valence:-.9});
   __lipProbe.omen.revealTime=3;__lipProbe.omen.lifeTime=3;Germany3D.sync();
  });
  await page.waitForFunction(()=>BuergeramtLevel.lipSpeech.mode==='voice'&&window.lipTestSpeech,null,{timeout:15000});
  if(name!=='asset-failure')await page.waitForFunction(()=>Germany3D.amtOmenSplat.activeSplats>0,null,{timeout:45000});
  const omenFrames=[];
  for(const [pose,index] of [['open',1],['bite',5],['round',10]]){
   await page.evaluate(index=>{lipTestSpeech.onresume?.();lipTestSpeech.onboundary({charIndex:index});window.lipFixtureTime+=43},index);
   await page.waitForTimeout(160);await page.evaluate(()=>{Germany3D.sync();lipTestSpeech.onpause?.();Germany3D.sync()});
   if(name!=='asset-failure'){
    const target=await page.evaluate(()=>Germany3D.amtGaussian.owner.startedUpdates+2);
    await page.waitForFunction(target=>{Germany3D.sync();return Germany3D.amtGaussian.owner.completedUpdates>=target},target,{timeout:45000});
   }
   omenFrames.push(await page.evaluate(()=>({speech:BuergeramtLevel.lipSpeech,volume:Germany3D.amtOmenSplat,paint:Germany3D.amtLipSplat})));
   await page.screenshot({path:`${output}/${name}-omen-${pose}.png`});
  }
  writeFileSync(`${output}/${name}-omen-diagnostics.json`,JSON.stringify(omenFrames,null,2));
  if(name==='asset-failure')assert(omenFrames.every(f=>f.paint.visible&&!f.volume.ready&&f.volume.skipped));
  else{
   assert(omenFrames.every(f=>f.volume.visible&&f.volume.mouthSplats===96&&f.volume.activeSplats>0));
   assert(omenFrames[0].volume.mouth.open>.75);assert(omenFrames[1].volume.mouth.bite>.75);assert(omenFrames[2].volume.mouth.round>.75);
  }
  await page.evaluate(()=>{__lipProbe.cancelSpeech();Germany3D.sync()});
  await page.evaluate(()=>{BuergeramtLevel.update=lipOriginalUpdate});
  await page.locator('#amt-leave').evaluate(n=>n.click());
  await page.waitForFunction(()=>{if(BuergeramtLevel.active)return false;Germany3D.sync();return Germany3D.amtLipSplat===null},null,{timeout:15000});
  assert.equal(await page.evaluate(()=>Germany3D.amtLipSplat),null);
  assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(w=>/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(w)),[]);
  reports.push({name,nativePaint,atlasAdmissionDisabled:!nativePaint,silent:true,physicalAndroid:false,forcedDialogue:true,revision,snapshots,mediaTrace,nativeWindow,occlusion,omenFrames,renderCost,errors,warnings});
  const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${name}-motion.webm`);
  writeFileSync(`${output}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify({name,result:'PASS',actors:actors.length,errors}));
 }
}finally{await browser.close()}
