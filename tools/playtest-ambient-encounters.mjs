import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {streetMotionDeliveryDefinitionBytes} from '../street-motion-delivery.js';
import {registerStreetCharacterManifest} from '../street-character-sprites.js';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const voiceId=process.env.AMBIENT_VOICE_ID||'quiz-hartmut-keller';
const nativeOnly=process.env.AMBIENT_NATIVE_ONLY==='1';
const candidateAssetRoot=root=>resolve(root,process.env.AMBIENT_CANDIDATE_ASSETS||'.');

function packedCandidate(root){
 const manifest=JSON.parse(readFileSync(resolve(root,process.env.AMBIENT_CANDIDATE_MANIFEST||'output/ambient-city-animation/hartmut-candidate-manifest.json'))),person=manifest.characters[voiceId];
 assert(person,'Selected ambient character missing from candidate');
 const file=person.variants.desktop.file.slice(0,person.variants.desktop.file.lastIndexOf('/')+1)+'delivery/motion-delivery.json',bytes=readFileSync(resolve(candidateAssetRoot(root),file)),receipt=JSON.parse(bytes);
 assert.equal(digest(streetMotionDeliveryDefinitionBytes(person)),receipt.definitionSha256,'Packed candidate must bind the complete original person');
 person.motionDelivery={file,sha256:digest(bytes)};return manifest;
}

function cityProbe(root,contacts,manifest){
 const definitions={};for(const [id,person]of Object.entries(manifest.characters))if(person.motionDelivery?.file){const bytes=readFileSync(resolve(candidateAssetRoot(root),person.motionDelivery.file));assert.equal(digest(bytes),person.motionDelivery.sha256);definitions[id]=JSON.parse(bytes)}
 return renderProbe.replace('__CONTACT_ROWS__',JSON.stringify(contacts)).replace('__DELIVERY_DEFINITIONS__',JSON.stringify(definitions));
}

function gameProbe(actorVoiceId=voiceId){return `
(()=>{
 let actor=null,routeSetup=null,tracing=false;const routeVoiceId=${JSON.stringify(actorVoiceId)},selectedQuestionId=${JSON.stringify(process.env.AMBIENT_QUESTION_ID||null)};const events=[],motion=[],preview=new URLSearchParams(location.search).get('ambientAuthoring')==='1';
 const trace=entry=>{if(tracing&&motion.length<25000)motion.push({at:performance.now(),...entry})};
 const originalHold=holdStreetMovement;
 holdStreetMovement=function(n,dx,dy){if(n!==actor)return originalHold(n,dx,dy);const before=window.__ambientMotionInspect?.(n),held=originalHold(n,dx,dy);trace({kind:'request',requested:{dx,dy},held,root:{x:n.x,y:n.y},velocity:{x:n.vx,y:n.vy},lane:n.routeBounds?pedestrianLane(n):null,before,after:window.__ambientMotionInspect?.(n)});return held};
 const originalAccepted=notifyStreetAccepted;
 notifyStreetAccepted=function(n,x,y){const result=originalAccepted(n,x,y);if(n===actor)trace({kind:'accepted',from:{x,y},to:{x:n.x,y:n.y},dx:n.x-x,dy:n.y-y,simulation:window.__ambientMotionInspect?.(n)});return result};
 const originalBlocked=responderBlocked;
 responderBlocked=function(x,y,r,n,fromX=n?.x,fromY=n?.y){const result=originalBlocked(x,y,r,n,fromX,fromY);if(n===actor)trace({kind:'collision-query',x,y,fromX,fromY,blocked:result,...(result?{routeBlocked:!pedestrianRouteContains(n,x,y,r),staticMotionBlocked:Number.isFinite(fromX)&&Number.isFinite(fromY)?groundStaticMotionBlocked(x,y,r,fromX,fromY):staticBlocked(x,y,r),nearCitizens:npcs.filter(other=>other!==n&&Math.hypot(other.x-x,other.y-y)<r+14).map(other=>({id:other.id,x:other.x,y:other.y})),playerDistance:Math.hypot(player.x-x,player.y-y)}:{})});return result};
 const originalReaction=requestCharacterReaction;
 requestCharacterReaction=function(n,names,options){const accepted=originalReaction(n,names,options);if(n===actor)events.push({kind:'reaction',names,accepted,at:performance.now()});return accepted};
 const originalQuiz=startCitizenshipQuiz;
 startCitizenshipQuiz=function(n){const accepted=originalQuiz(n);if(n===actor)events.push({kind:'quiz-start',accepted,at:performance.now()});return accepted};
 const originalSpeak=speak;
 speak=function(text,options){if(preview&&options?.family==='quiz'&&options.candidateVoiceId===routeVoiceId){
   events.push({kind:'isolated-audition-substitution',originalPrompt:text,exactPreviewText:window.__ambientPreviewClip.source,at:performance.now()});
   return originalSpeak(window.__ambientPreviewClip.source,{...options,candidateSegments:null,subtitle:window.__ambientPreviewClip.source});
 }return originalSpeak(text,options)};
 function snapshot(){
  const speech=actor?getStreetSpeech(actor):null,portraitCanvas=document.querySelector(".quiz-portrait-frame canvas");
  let portraitPixels=null;if(portraitCanvas){const bytes=portraitCanvas.getContext("2d").getImageData(0,0,portraitCanvas.width,portraitCanvas.height).data;let hash=2166136261,alpha=0;for(let i=0;i<bytes.length;i++){hash=Math.imul(hash^bytes[i],16777619);if(i%4===3&&bytes[i])alpha++}portraitPixels={hash:hash>>>0,alpha,actorId:portraitCanvas.dataset.actor}}
  return{portrait:window.Germany3D?.quizPortrait,portraitPixels,at:performance.now(),started:state.started,modal:state.modal,quizQuestion:state.quizQuestion?.source||null,approaching:state.quizApproach===actor,
   actor:actor?{id:actor.id,voiceId:actor.voiceId,x:actor.x,y:actor.y,vx:actor.vx,vy:actor.vy,asked:!!actor.quizAsked,pause:actor.pause||0,blockedTimer:actor.blockedTimer||0,routeBounds:actor.routeBounds,lane:actor.routeBounds?pedestrianLane(actor):null,legalGround:pedestrianRouteContains(actor,actor.x,actor.y),bodyClear:!originalBlocked(actor.x,actor.y,13,actor,null,null),staticClear:!staticBlocked(actor.x,actor.y,13),progress:actor.progressWindow||null}:null,
   player:{x:player.x,y:player.y,surface:playerSurface(),wanted:state.wanted,offence:state.offence},speech:speech?{status:speech.speechStatus,time:speech.mediaTime,duration:speech.mediaDuration,opening:speech.mouthOpen,paused:speech.paused}:null,
   stimulus:activeStimulus?{family:activeStimulus.family,mode:activeStimulus.subtitleMode,recording:activeStimulus.recording||null,started:!!activeStimulus.speechStarted}:null,
   quizVisible:!document.getElementById('quiz-modal').hidden,choicesEnabled:[...document.querySelectorAll('#quiz-choices button')].some(button=>!button.disabled),
   expectedAnswer:state.quizQuestion?.answer??null,events:events.slice(-32),city:window.__ambientCityInspect?.(actor?.id)};
 }
 window.__ambientEncounter={snapshot,
  traceStart(){motion.length=0;tracing=true;return snapshot()},
  traceStop(){tracing=false;return motion.slice()},
  setup(){return routeSetup},
  geometry(){return{buildings:buildings.map(b=>({id:b.id,x:b.x,y:b.y,w:b.w,h:b.h,distance:signedRectDistance(actor.x,actor.y,b)})).sort((a,b)=>a.distance-b.distance).slice(0,5),props:props.filter(p=>!p.decorative).map(p=>({id:p.id,asset:p.asset,x:p.x,y:p.y,radius:propRadius(p),distance:Math.hypot(actor.x-p.x,actor.y-p.y)-propRadius(p)})).sort((a,b)=>a.distance-b.distance).slice(0,5),trees:trees.map(p=>({x:p.x,y:p.y,distance:Math.hypot(actor.x-p.x,actor.y-p.y)-TREE_RADIUS})).sort((a,b)=>a.distance-b.distance).slice(0,3)}},
  quizTarget(){
   const horizontal=!!actor.vx,sign=Math.sign(actor.vx||actor.vy)||1,lane=pedestrianLane(actor);
   const targets=[120*sign,-120*sign,90*sign,-90*sign].map(along=>({x:horizontal?actor.x+along:lane,y:horizontal?lane:actor.y+along}));
   const target=targets.find(p=>pedestrianRouteContains(actor,p.x,p.y)&&!onGardenGrass(p.x,p.y)&&(!onRoad(p.x,p.y)||onCrossing(p.x,p.y))&&!originalBlocked(p.x,p.y,player.r,player,null,null));
   if(!target)return{status:'NOT RUN',reason:'No clear player target on the existing route'};
   Object.assign(player,target);return{status:'READY',target,staging:'Player target only; actor retained its actual post-probe root',distance:Math.hypot(actor.x-player.x,actor.y-player.y)};
  },
  sample(){const sample=snapshot();if(sample.city)delete sample.city.ambient;return sample},
  admit(){stopSpeech();if(!state.started)finishHumorCertification(false);state.voiceOn=false;state.modal=false;state.dialogue=false;state.quizTimer=100000;state.pettyAuditTimer=100000;nextAmbientAt=performance.now()+100000;document.getElementById('dialogue').hidden=true;return snapshot()},
  stage(){
   stopSpeech();if(!state.started)finishHumorCertification(false);Object.assign(state,{modal:false,dialogue:false,gameOver:false,voiceOn:false,subtitlesOn:true,quizApproach:null,quizApproachQuestion:null,quizQuestion:null,quizTimer:100000,pettyAuditTimer:100000});
   document.getElementById('dialogue').hidden=true;document.getElementById('humor-modal').hidden=true;document.getElementById('quiz-modal').hidden=true;
   actor??=npcs.filter(n=>n.voiceId===routeVoiceId&&n.quizzer&&!n.arrested&&!n.lawPending).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
   if(!actor)throw Error('Existing eligible selected ambient actor missing');
   const offsets=[[0,150],[150,0],[-150,0],[0,-150],[110,110],[-110,110],[110,-110],[-110,-110]],point=offsets.map(([x,y])=>({x:actor.x+x,y:actor.y+y})).find(p=>!staticBlocked(p.x,p.y,player.r));
   if(!point)throw Error('No nearby body-clear staged player point');
   if(!routeSetup){player.x=point.x;player.y=point.y}actor.quizAsked=false;actor.pause=0;actor.reactionNear=true;actor.reactionCooldown=100000;
   nextAmbientAt=performance.now()+100000;trainAnnouncementNextAt=performance.now()+100000;
   for(const n of npcs)n.barkAt=performance.now()+100000;
   updateHud();Germany3DBridge.prepareNearbyAssets();Germany3D.prepareNearbyAssets();events.length=0;
   return{staged:routeSetup?'Initial legal route fixture; no actor root/animation changes after setup':'Player placed near an existing Hartmut at his natural route; eligibility/timers staged, city and actor root retained',routeSetup,...snapshot()};
  },
  guards(){const prior=state.modal;state.modal=true;const modal=startCitizenshipQuiz(actor);state.modal=prior;const arrested=actor.arrested;actor.arrested=true;const arrest=startCitizenshipQuiz(actor);actor.arrested=arrested;const foreign=startCitizenshipQuiz({...actor});return{modal,arrest,foreign}},
  begin(){stopSpeech();const character=quizCharacterForActor(actor),next=quizQuestionForCharacter(character),question=selectedQuestionId?citizenshipQuestions.find(q=>String(q.source)===selectedQuestionId&&character.categories.includes(quizQuestionCategory(q))):next;if(!question||!state.quizBag.includes(citizenshipQuestions.indexOf(question)))throw Error('No actual matching available quiz question');state.voiceOn=true;state.quizApproach=actor;state.quizApproachQuestion=question;actor.quizFollowTime=0;events.push({kind:'staged-eligible-approach',question:question.source,selectedQuestionId,at:performance.now()});return snapshot()},
  async preparePreview(){
   if(!preview)throw Error('Authoring preview is opt-in only');const clip=window.__ambientPreviewClip,buffer=await prepareRecording(clip.path),bins=[];
   for(let bin=0;bin<Math.ceil(buffer.duration*40);bin++){let sum=0,count=0;const from=Math.floor(bin*buffer.sampleRate/40),to=Math.min(buffer.length,Math.floor((bin+1)*buffer.sampleRate/40));for(let channel=0;channel<buffer.numberOfChannels;channel++){const pcm=buffer.getChannelData(channel);for(let sample=from;sample<to;sample++){sum+=pcm[sample]*pcm[sample];count++}}bins.push(count?Math.sqrt(sum/count):0)}
   const scale=Math.max(.04,...bins)*.75;clip.mouthEnergy=bins.map(rms=>Math.round(255*Math.max(0,Math.min(1,(rms-.012)/scale))));
   return{duration:buffer.duration,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,decodedBytes:buffer.length*buffer.numberOfChannels*4,mouthHz:40,energySamples:clip.mouthEnergy.length,range:[Math.min(...clip.mouthEnergy),Math.max(...clip.mouthEnergy)],method:'Browser-decoded exact MP3 40 Hz RMS; estimated opening, no phoneme alignment'};
  }
 };
 const routeKind=new URLSearchParams(location.search).get('ambientRoute');
 if(routeKind){
  actor=npcs.find(n=>n.voiceId===routeVoiceId&&(routeVoiceId==='crowd-irmgard-aktenordner'||n.quizzer)&&!n.arrested&&!n.lawPending);if(!actor)throw Error('No existing selected street actor');
  const original={x:actor.x,y:actor.y,vx:actor.vx,vy:actor.vy,routeBounds:actor.routeBounds},routes=[...new Map([actor,...npcs.filter(n=>!n.special&&!n.jwdRole)].filter(n=>n.routeBounds).map(n=>[JSON.stringify(n.routeBounds),n.routeBounds])).values()];
  const clean=(n,x,y)=>pedestrianRouteContains(n,x,y)&&!originalBlocked(x,y,13,n,null,null),sweep=(n,from,to)=>{const count=Math.ceil(Math.hypot(to.x-from.x,to.y-from.y));for(let i=0;i<=count;i++)if(!clean(n,from.x+(to.x-from.x)*i/count,from.y+(to.y-from.y)*i/count))return false;return true};
  const exit=n=>[[30,0],[-30,0],[0,30],[0,-30]].map(([dx,dy])=>({x:n.x+dx,y:n.y+dy})).find(p=>sweep(n,n,p));
  const choices=[],knownMainCorner=routeVoiceId==='crowd-irmgard-aktenordner'&&routeKind==='corner';
  if(knownMainCorner){const b=buildings.find(b=>b.id==='spaeti');if(!b||b.x!==690||b.y!==1180||b.w!==250||b.h!==145)throw Error('Frozen Spaeti geometry changed');const routeBounds={x:573,y:1308,w:965,h:72},n={...actor,x:954,y:1339,vx:-14,vy:0,routeBounds},legalExit={x:984,y:1339};if(!clean(n,n.x,n.y)||!sweep(n,n,legalExit))throw Error('Known Spaeti fixture no longer legal');choices.push({kind:'corner',x:n.x,y:n.y,vx:n.vx,vy:0,routeBounds,building:{id:b.id,x:b.x,y:b.y,w:b.w,h:b.h},legalExit,fixedKnownFixture:true})}
  if(routeKind==='clear')for(const bounds of routes){
   const horizontal=bounds.w>bounds.h,n={...actor,routeBounds:bounds,vx:horizontal?14:0,vy:horizontal?0:14},lane=pedestrianLane(n),minimum=(horizontal?bounds.x:bounds.y)+40,maximum=(horizontal?bounds.x+bounds.w:bounds.y+bounds.h)-240;
   for(let along=minimum;along<=maximum;along+=40){const start={x:horizontal?along:lane,y:horizontal?lane:along},end={x:start.x+(horizontal?200:0),y:start.y+(horizontal?0:200)};if(sweep(n,start,end)){choices.push({kind:'clear',...start,vx:n.vx,vy:n.vy,routeBounds:bounds,clearEnd:end});break}}
   if(choices.length)break;
  }
  if(routeKind==='corner'&&!knownMainCorner)for(const b of buildings)for(const sx of [-1,1])for(const sy of [-1,1])for(const bounds of routes){
   const n={...actor,x:(sx<0?b.x:b.x+b.w)+sx*14,y:(sy<0?b.y:b.y+b.h)+sy*14,vx:-sx*14,vy:0,routeBounds:bounds},dy=Math.sign(pedestrianLane(n)-n.y)*18;
   if(Math.sign(dy)!==-sy||!clean(n,n.x,n.y)||!staticBlocked(n.x+n.vx*.9,n.y+dy*.9,13))continue;const legalExit=exit(n);if(legalExit)choices.push({kind:'corner',x:n.x,y:n.y,vx:n.vx,vy:0,routeBounds:bounds,building:{id:b.id,x:b.x,y:b.y,w:b.w,h:b.h},legalExit});
  }
  if(routeKind==='prop')for(const p of props.filter(p=>!p.decorative))for(const bounds of routes)for(const side of [-1,1])for(const cross of [p.y,bounds.y+bounds.h/2,bounds.y+14,bounds.y+bounds.h-14]){
   const n={...actor,x:p.x+side*(propRadius(p)+14),y:cross,vx:-side*14,vy:0,routeBounds:bounds},dy=Math.sign(pedestrianLane(n)-n.y)*18;
   const facade=buildings.map(b=>({id:b.id,d:signedRectDistance(p.x,p.y,b)})).sort((a,b)=>a.d-b.d)[0];
   const next={x:n.x+n.vx*.6,y:n.y+dy*.6},propBlocks=p.collisionRect?groundContactBlocks(signedRectDistance(next.x,next.y,p.collisionRect),signedRectDistance(n.x,n.y,p.collisionRect),13):groundContactBlocks(Math.hypot(next.x-p.x,next.y-p.y),Math.hypot(n.x-p.x,n.y-p.y),13+propRadius(p));
   if(!propBlocks||!clean(n,n.x,n.y)||!staticBlocked(next.x,next.y,13))continue;const legalExit=exit(n);if(legalExit)choices.push({kind:'prop',x:n.x,y:n.y,vx:n.vx,vy:0,routeBounds:bounds,prop:{id:p.id,asset:p.asset,x:p.x,y:p.y,radius:propRadius(p)},building:facade,legalExit});
  }
  const chosen=(routeKind==='corner'?choices.find(c=>c.building?.id==='spaeti'):null)||choices[0];if(!chosen){routeSetup={status:'NOT RUN',reason:'No legal '+routeKind+' source fixture',beforeWorldAdmission:!window.Germany3D?.ready};return}
  Object.assign(actor,{x:chosen.x,y:chosen.y,vx:chosen.vx,vy:chosen.vy,routeBounds:{...chosen.routeBounds},pause:0,blockedTimer:0,progressWindow:null,avoid:1});
  actor.min=(actor.vx?actor.routeBounds.x:actor.routeBounds.y)+13;actor.max=(actor.vx?actor.routeBounds.x+actor.routeBounds.w:actor.routeBounds.y+actor.routeBounds.h)-13;
  const heading=Math.sign(actor.vx||actor.vy),crosses=actor.vx?[actor.y,actor.routeBounds.y+actor.routeBounds.h/2,actor.routeBounds.y+15,actor.routeBounds.y+actor.routeBounds.h-15]:[actor.x,actor.routeBounds.x+actor.routeBounds.w/2,actor.routeBounds.x+15,actor.routeBounds.x+actor.routeBounds.w-15];
  const playerPoints=[-70,-110,-160,70,110,160].flatMap(offset=>crosses.map(cross=>({x:actor.vx?actor.x+heading*offset:cross,y:actor.vx?cross:actor.y+heading*offset})));
  const playerPoint=playerPoints.find(p=>pedestrianRouteContains(actor,p.x,p.y,player.r)&&!onGardenGrass(p.x,p.y)&&(!onRoad(p.x,p.y)||onCrossing(p.x,p.y))&&!originalBlocked(p.x,p.y,player.r,player,null,null));
  if(!playerPoint){routeSetup={status:'NOT RUN',reason:'No legal player fixture point on this source route',chosen,beforeWorldAdmission:!window.Germany3D?.ready};return}Object.assign(player,playerPoint);routeSetup={kind:routeKind,original,chosen,candidates:choices.length,initialRoot:{x:actor.x,y:actor.y},player:playerPoint,legal:clean(actor,actor.x,actor.y),beforeWorldAdmission:!window.Germany3D?.ready};
 }
})();
`}

const renderProbe=`const ambientContactRows=__CONTACT_ROWS__,ambientDeliveries=__DELIVERY_DEFINITIONS__;let ambientSoleCanvas=null;
window.__ambientMotionInspect=n=>inspectStreetSimulation(n);
window.__ambientCityInspect=actorId=>{
 const textures=new Set(),resident=new Map(),rows=[];let selected=null;
 const retain=(id,n,source)=>{if(!source)return;const key=id+':'+source.file+':'+source.sha256;let entry=resident.get(key);if(!entry){entry={key,file:source.file,width:source.width,height:source.height,decodedBytes:source.width*source.height*4,owners:[]};resident.set(key,entry)}entry.owners.push(n.id)};
 for(const [n,root]of npcMeshes){const id=registeredStreetPaint(n);if(!id)continue;const view=root.userData.streetPaintView,paint=view?.paint.inspect(),distance=Math.hypot(n.x-bridge.player.x,n.y-bridge.player.y)*S,visible=isWorldPointVisible(n.x,n.y,0,'npc');
  if(view)for(const child of view.host.children)if(child.material?.map)textures.add(child.material.map);
  const person=streetPaintManifest[id],delivery=ambientDeliveries[id];
  if(paint?.loaded){if(paint.stage==='standing')retain(id,n,person.standing);else if(paint.motionLoaded){if(delivery&&paint.delivery){if(paint.delivery.movementLoaded)retain(id,n,delivery.packs.movement.variants[paint.variant]);if(paint.delivery.reactionLoaded)retain(id,n,delivery.packs.reactions.variants[paint.variant])}else retain(id,n,person.motionRig?.variants[paint.variant]||person.variants[paint.variant])}}
  const row={actorId:n.id,voiceId:n.voiceId,characterId:id,distance,nearby:distance<=30,visible,prepared:!!view,loaded:!!paint?.loaded,motionLoaded:!!paint?.motionLoaded,displayed:!!view?.host.visible,delivery:paint?.delivery||null};rows.push(row);
  if(n.id===actorId){
   const soles=[],mesh=view?.host.children.find(child=>child.material?.map),pose=paint?.pose,assessment=ambientContactRows.find(a=>a.view===pose?.direction+'-'+paint?.variant),points=pose?.clip==='walk'?assessment?.contacts.flatMap(contact=>contact.samples.filter(sample=>sample.frame%assessment.frames_per_cycle===pose.frame).map(sample=>({...sample,foot:contact.foot})))||[]:[];
   let sourceCell=null;
   if(mesh){const image=mesh.material.map.image,uv=mesh.geometry.attributes.uv,x=Math.round(uv.getX(0)*image.width),y=Math.round((1-uv.getY(0))*image.height),w=Math.round((uv.getX(1)-uv.getX(0))*image.width),h=Math.round((uv.getY(0)-uv.getY(2))*image.height),grid=[Math.round(image.width/w),Math.round(image.height/h)],physicalSlot=Math.round(y/h)*grid[0]+Math.round(x/w),pack=delivery?Object.entries(delivery.packs).find(([,p])=>p.grid[0]===grid[0]&&p.grid[1]===grid[1]&&p.slots[physicalSlot]===pose?.slot):null;
    sourceCell={logicalSlot:pose?.slot,physicalSlot,grid,rect:[x,y,w,h],pack:pack?.[0]||null,file:pack?.[1].variants[paint.variant].file||(paint.stage==='standing'?person.standing?.file:person.variants?.[paint.variant]?.file)};
   }
   if(mesh&&points.length){
    const image=mesh.material.map.image,[sourceX,sourceY,cellWidth,cellHeight]=sourceCell.rect;
    ambientSoleCanvas??=document.createElement('canvas');ambientSoleCanvas.width=cellWidth;ambientSoleCanvas.height=cellHeight;
    const context=ambientSoleCanvas.getContext('2d',{willReadFrequently:true});context.clearRect(0,0,cellWidth,cellHeight);context.drawImage(image,sourceX,sourceY,cellWidth,cellHeight,0,0,cellWidth,cellHeight);const pixels=context.getImageData(0,0,cellWidth,cellHeight).data;
    for(const point of points){let x=point.cell_x,y=point.cell_y??point.soleY;
     if(x===undefined){const xs=[];for(let px=point.footXWindow[0];px<=point.footXWindow[1];px++)if(pixels[(Math.round(y)*cellWidth+px)*4+3]>80)xs.push(px);if(!xs.length)continue;x=xs.reduce((a,b)=>a+b,0)/xs.length}
     const sole=mesh.localToWorld(new T.Vector3((x/cellWidth-.5)*mesh.geometry.parameters.width,(.5-y/cellHeight)*mesh.geometry.parameters.height,0)),ground=bridge.stationElevation(n.x,n.y),ray=sole.clone().sub(camera.position),t=(ground-camera.position.y)/ray.y,floorPoint=camera.position.clone().addScaledVector(ray,t);
     soles.push({foot:point.foot,sourceContactFrame:point.frame,sourcePixel:[x,y],world:sole.toArray(),heightAboveRootGround:sole.y-ground,floorIntersection:floorPoint.toArray()});
    }
   }
   const pivot=mesh?mesh.localToWorld(new T.Vector3((person.pivot[0]/person.cell[0]-.5)*mesh.geometry.parameters.width,(.5-person.pivot[1]/person.cell[1])*mesh.geometry.parameters.height,0)):null;
   selected={...row,paint:paint||null,sourceCell,simulation:inspectStreetSimulation(n),hasReaction:hasStreetReaction(n),support:{pivotWorld:pivot?.toArray()||null,rootWorld:[X(n.x),bridge.stationElevation(n.x,n.y),Z(n.y)],matrixWorld:mesh?.matrixWorld.toArray()||null,geometry:mesh?.geometry.parameters||null,soles}};
  }
 }
 const unique=filter=>[...new Set(rows.filter(filter).map(row=>row.voiceId))];
 return{selected,ambient:{totalActors:rows.length,distinct:unique(()=>true),nearby:unique(row=>row.nearby),visible:unique(row=>row.visible),prepared:unique(row=>row.prepared),loaded:unique(row=>row.loaded),motionLoaded:unique(row=>row.motionLoaded),rows},
  textureBytes:[...resident.values()].reduce((sum,entry)=>sum+entry.decodedBytes,0),textureCount:resident.size,residentTextures:[...resident.values()],displayedTextureBytes:[...textures].reduce((sum,texture)=>sum+(texture.image?.width||0)*(texture.image?.height||0)*4,0),displayedTextureCount:textures.size,textureAccounting:'Unique leased decoded character images, including retained movement and ready reaction packs; excludes temporary decode/upload and unmeasured GPU copies',memory:{...renderer.info.memory},render:{...renderer.info.render},drawingBuffer:renderer.getDrawingBufferSize(new T.Vector2()).toArray(),camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),aspect:camera.aspect,fov:camera.fov}};
};`;

function previewCatalog(source,audition){
 const clip={path:'./'+audition.path,id:audition.clipId,voiceId:audition.voiceId,profileId:audition.profileId,referenceSha256:audition.referenceSha256,renderer:audition.renderer,modelRevision:audition.modelRevision,source:audition.text,english:audition.text,sha256:audition.sha256,durationMs:Math.round(audition.durationSeconds*1000),mouthHz:40,mouthEnergy:[]};
 return source+`\n(()=>{if(new URLSearchParams(location.search).get('ambientAuthoring')!=='1')return;const prior=window.GermanySimulatorAudioText,clip=${JSON.stringify(clip)},binding={...prior.productionVoices[clip.voiceId],referenceSha256:clip.referenceSha256};window.__ambientPreviewClip=clip;window.GermanySimulatorAudioText=Object.freeze({...prior,productionVoices:Object.freeze({...prior.productionVoices,[clip.voiceId]:binding}),recordings:Object.freeze({...prior.recordings,[clip.path]:clip}),candidateClip(id,text){return id===clip.voiceId&&text===clip.source?clip.path:prior.candidateClip(id,text)}});})();`;
}

async function snapshot(page,context){
 const data=await page.evaluate(()=>({state:__ambientEncounter.snapshot(),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,clientWidth:document.documentElement.clientWidth,visualWidth:visualViewport?.width},resources:performance.getEntriesByType('resource').filter(entry=>/\/assets\/characters\/(?:street|street-speakers|residents)\//.test(entry.name)).map(entry=>({url:new URL(entry.name).pathname,transfer:entry.transferSize,encoded:entry.encodedBodySize,decoded:entry.decodedBodySize})),heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null}));
 data.resourceTotals=data.resources.reduce((sum,row)=>({requests:sum.requests+1,transfer:sum.transfer+row.transfer,encoded:sum.encoded+row.encoded,decoded:sum.decoded+row.decoded}),{requests:0,transfer:0,encoded:0,decoded:0});
 return data;
}

async function motionCapture(page,milliseconds){
 return page.evaluate(async milliseconds=>{
  __ambientEncounter.traceStart();const samples=[],start=performance.now();
  while(performance.now()-start<milliseconds){const sample=__ambientEncounter.sample();delete sample.city.residentTextures;samples.push(sample);await new Promise(done=>setTimeout(done,55))}
  return{samples,trace:__ambientEncounter.traceStop()};
 },milliseconds);
}

function motionSummary(capture){
 const {samples,trace}=capture,first=samples[0],last=samples.at(-1),walk=samples.filter(s=>s.city.selected.paint?.pose?.clip==='walk'),accepted=trace.filter(s=>s.kind==='accepted'),requests=trace.filter(s=>s.kind==='request'),rendered=samples.filter(s=>s.city.selected.paint?.pose),pivots=samples.filter(s=>s.city.selected.support.pivotWorld);
 let longestWalkMs=0,start=null,lastDirection=null;
 for(const sample of samples){const pose=sample.city.selected.paint?.pose;if(pose?.clip==='walk'&&pose.direction===lastDirection){start??=sample.at;longestWalkMs=Math.max(longestWalkMs,sample.at-start)}else start=pose?.clip==='walk'?sample.at:null;lastDirection=pose?.direction}
 return{elapsedMs:last.at-first.at,netProgress:Math.hypot(last.actor.x-first.actor.x,last.actor.y-first.actor.y),acceptedDistance:accepted.reduce((sum,s)=>sum+Math.hypot(s.dx,s.dy),0),acceptedSegments:accepted.length,heldRequests:requests.filter(s=>s.held).length,totalRequests:requests.length,
  requestDirections:[...new Set(requests.map(s=>Math.abs(s.requested.dx)>Math.abs(s.requested.dy)?s.requested.dx>0?'right':'left':s.requested.dy>0?'down':'up'))],
  planStarts:requests.filter(s=>s.after?.atlasMotion?.plan&&!s.before?.atlasMotion?.plan).map(s=>({at:s.at,root:s.root,requested:s.requested,from:s.before.atlasMotion.facing,to:s.after.atlasMotion.requested,kind:s.after.atlasMotion.plan})),
  walkPhases:[...new Set(walk.map(s=>s.city.selected.paint.pose.direction+':'+s.city.selected.paint.pose.frame))],longestWalkMs,
  illegalGround:samples.filter(s=>!s.actor.legalGround).length,bodyBlockedSamples:samples.filter(s=>!s.actor.bodyClear).length,blockedQueries:trace.filter(s=>s.kind==='collision-query'&&s.blocked).length,
  missingPaintSamples:samples.length-rendered.length,soleSamples:samples.flatMap(s=>s.city.selected.support.soles).length,pivotMaxHeightError:pivots.length?Math.max(...pivots.map(s=>Math.abs(s.city.selected.support.pivotWorld[1]-s.city.selected.support.rootWorld[1]))):null,
  firstRoot:first.actor,lastRoot:last.actor,variant:rendered.at(-1)?.city.selected.paint.variant||null,drawingBuffer:last.city.drawingBuffer};
}

export default {
 name:'Staged ambient city encounter and isolated native-media preview',
 sourceFiles:()=>['game.js','world3d.js','street-character-sprites.js','street-motion-delivery.js','street-character-mouth.js','character-interactions.js','tourist-animation.js'],
 limits:['Existing actor and production city/camera/HUD; player placement and encounter eligibility are staged.','Audition playback is an explicitly isolated served-only authoring preview, not default voice admission or full quiz prompt recording.','Silent headless desktop/mobile emulation; no physical-device, listening, anatomy approval or natural encounter certification.'],
 scenarios:[{id:'ambient-quiz-city',modes:['quick','stress'],timeoutMs:240000,
 async run({page,context,baseURL,artifacts,root,profile}){
  const main=process.env.AMBIENT_MAIN==='1',manifestBytes=main?readFileSync(resolve(root,'assets/characters/street/manifest.json')):null,manifest=main?JSON.parse(manifestBytes):packedCandidate(root),person=manifest.characters[voiceId];assert(person.mouthPaint?.file,'Source-bound selected candidate required');
  const manifestResponses=[];page.on('response',response=>{if(new URL(response.url()).pathname==='/assets/characters/street/manifest.json')manifestResponses.push(response.body().then(body=>digest(body)))});
  const audition=nativeOnly?null:JSON.parse(readFileSync(resolve(root,'assets/voices/profile-auditions/manifest.json'))).clips.find(clip=>clip.voiceId===voiceId);
  if(audition)assert.equal(digest(readFileSync(resolve(root,audition.path))),audition.sha256);
  const originalGame=readFileSync(resolve(root,'game.js'),'utf8'),originalWorld=readFileSync(resolve(root,'world3d.js'),'utf8'),catalog=readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8');
  assert.equal(originalGame.split('function loop(now){').length,2);assert.equal(originalWorld.split('window.Germany3D={ready:true').length,2);
  if(!main)await page.route('**/assets/characters/street/manifest.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
  if(!main&&process.env.AMBIENT_CANDIDATE_ASSETS){
   const prefix='/'+person.variants.desktop.file.slice(2,person.variants.desktop.file.lastIndexOf('/')+1),assets=candidateAssetRoot(root);
   await page.route('**/assets/characters/street-speakers/'+voiceId+'/**',route=>{
    const pathname=new URL(route.request().url()).pathname;if(!pathname.startsWith(prefix))return route.continue();
    const path=resolve(assets,'.'+pathname);assert(path.startsWith(assets+'/')||path.startsWith(assets+'\\'),'Candidate asset escaped staging root');
    return route.fulfill({body:readFileSync(path),contentType:pathname.endsWith('.json')?'application/json':'image/webp'});
   });
  }
  await page.route('**/game.js?*',route=>route.fulfill({contentType:'text/javascript',body:originalGame.replace('function loop(now){',gameProbe()+'function loop(now){')}));
  const contactRows=nativeOnly?[]:['contact-measurements.json','vertical-contact-measurements.json'].flatMap(file=>JSON.parse(readFileSync(resolve(root,'output/ambient-city-animation/hartmut-final-pixels/hartmut-keller',file))).assessments);
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:originalWorld.replace('window.Germany3D={ready:true',cityProbe(root,contactRows,manifest)+'window.Germany3D={ready:true')}));
  if(audition)await page.route('**/For-AI/AUDIO-TEXT-LIBRARY.js?*',route=>route.fulfill({contentType:'text/javascript',body:previewCatalog(catalog,audition)}));
  const evidence={hashes:{game:digest(originalGame),world:digest(originalWorld),candidate:main?digest(manifestBytes):digest(JSON.stringify(manifest)),audition:audition?.sha256||null},manifestSource:main?'Exact MAIN bytes served without manifest or asset interception':'Served candidate overlay',nativeOnly,actorVoiceId:voiceId,paths:[]};
  for(const authoring of nativeOnly?[false]:[false,true]){
   const path={mode:authoring?'isolated-authoring-audition':nativeOnly?'unaltered-production-catalog':'default-catalog-caption'};evidence.paths.push(path);artifacts.json('encounter.json',evidence);
   await page.goto(baseURL+'/?'+(authoring?'ambientAuthoring=1':''),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__ambientEncounter&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:120000});
   path.title=await snapshot(page,context);if(main){evidence.servedManifestHashes=await Promise.all(manifestResponses);assert.deepEqual(evidence.servedManifestHashes,[digest(manifestBytes)])}artifacts.json('encounter.json',evidence);await artifacts.screenshot(page,(authoring?'preview':'default')+'-title.png');
   await page.locator('#start').click();path.started=await snapshot(page,context);
   path.stage=await page.evaluate(()=>__ambientEncounter.stage());artifacts.json('encounter.json',evidence);
   try{await page.waitForFunction(()=>{const paint=__ambientEncounter.snapshot().city?.selected?.paint;return paint?.failed||paint?.mouthPaint.failed||paint?.motionLoaded&&paint?.mouthPaint.loaded},null,{timeout:45000})}
   catch(error){path.readinessFailure=await snapshot(page,context);artifacts.json('encounter.json',evidence);throw error}
   path.admission=await snapshot(page,context);artifacts.json('encounter.json',evidence);assert.equal(path.admission.state.city?.selected?.paint?.failed,false);assert.equal(path.admission.state.city?.selected?.paint?.mouthPaint.failed,false);
   path.ready=await snapshot(page,context);path.guards=await page.evaluate(()=>__ambientEncounter.guards());assert.deepEqual(path.guards,{modal:false,arrest:false,foreign:false});
   if(authoring){path.decode=await page.evaluate(()=>__ambientEncounter.preparePreview());assert(path.decode.range[1]>0)}
   if(nativeOnly){path.quizTarget=await page.evaluate(()=>__ambientEncounter.quizTarget());assert.equal(path.quizTarget.status,'READY','Player must stand on the selected actor existing legal route')}
   path.approach=await page.evaluate(()=>__ambientEncounter.begin());artifacts.json('encounter.json',evidence);await artifacts.screenshot(page,(authoring?'preview':'default')+'-approach.png');
   try{await page.waitForFunction(()=>__ambientEncounter.snapshot().quizVisible,null,{timeout:45000})}
   catch(error){path.approachFailure=await snapshot(page,context);artifacts.json('encounter.json',evidence);throw error}
   path.quiz=await snapshot(page,context);
   assert(path.quiz.state.events.some(event=>event.kind==='quiz-start'&&event.accepted));assert(path.quiz.state.events.some(event=>event.kind==='reaction'&&event.accepted));
   await artifacts.screenshot(page,(authoring?'preview':'default')+'-quiz.png');
   path.modalSamples=await page.evaluate(async()=>{const result=[],start=performance.now();while(performance.now()-start<900){result.push(__ambientEncounter.sample());await new Promise(done=>setTimeout(done,90))}return result});artifacts.json('encounter.json',evidence);
   if(nativeOnly){assert(path.modalSamples.some(sample=>sample.portrait?.active&&sample.portrait.actorId===sample.actor.id&&sample.portraitPixels?.alpha>100));assert(new Set(path.modalSamples.map(sample=>sample.portraitPixels?.hash).filter(Boolean)).size>1,'Live portrait must visibly change with the actual performer')}
   assert.equal(new Set(path.modalSamples.map(sample=>sample.actor.x+','+sample.actor.y)).size,1,'modal holds focused actor translation while its authored performance may continue');
   if(authoring||nativeOnly){assert(path.modalSamples.some(sample=>sample.speech?.status==='playing'&&sample.speech.time>0));assert(path.modalSamples.some(sample=>sample.city.selected.paint.mouth.active&&sample.city.selected.paint.mouth.opening[0]>0))}
   else {assert.equal(path.quiz.state.speech,null,'held audition cannot silently acquire the default mouth');assert.equal(path.quiz.state.stimulus.mode,'silent')}
   await page.waitForFunction(()=>__ambientEncounter.snapshot().choicesEnabled,null,{timeout:25000});path.nativeOrCaptionCompleted=await snapshot(page,context);
   const answer=path.nativeOrCaptionCompleted.state.expectedAnswer;await page.locator('#quiz-choices button[data-answer="'+answer+'"]').click();
   path.afterAnswer=await snapshot(page,context);assert.equal(path.afterAnswer.state.modal,false);
   path.recovery=await page.evaluate(async()=>{const samples=[],start=performance.now();let held=false;while(performance.now()-start<18000){const sample=__ambientEncounter.sample();samples.push(sample);held||=sample.city.selected.hasReaction;if(held&&!sample.city.selected.hasReaction)break;await new Promise(done=>setTimeout(done,60))}return samples});
   assert(path.recovery.some(sample=>sample.city.selected.hasReaction),'answer reaction must own body');assert.equal(path.recovery.at(-1).city.selected.hasReaction,false,'reaction returns to route');
   const final=path.recovery.at(-1);await page.waitForFunction(previous=>{const actor=__ambientEncounter.snapshot().actor;return Math.hypot(actor.x-previous.x,actor.y-previous.y)>.05},final.actor,{timeout:10000});
   path.returned=await snapshot(page,context);if(nativeOnly){assert.equal(path.returned.state.portrait.active,false);assert.equal(path.returned.state.portraitPixels,null)}await artifacts.screenshot(page,(authoring?'preview':'default')+'-returned.png');
   if(authoring||nativeOnly){
    await page.locator('#file-toggle').click();await page.waitForFunction(()=>GermanyHUD.paused);const pausedBefore=await page.evaluate(()=>__ambientEncounter.sample());await page.waitForTimeout(350);const pausedAfter=await page.evaluate(()=>__ambientEncounter.sample());
    assert.equal(pausedAfter.city.selected.paint.pose.slot,pausedBefore.city.selected.paint.pose.slot);assert.deepEqual(pausedAfter.actor,pausedBefore.actor);path.caseFilePause={before:pausedBefore,after:pausedAfter};await page.locator('#file-close').click();
    const before=await page.evaluate(()=>__ambientEncounter.snapshot().player),cdp=profile.isMobile?await context.newCDPSession(page):null;
    for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){
     let box;
     if(cdp){box=await page.locator('.control-dock [data-key="'+key+'"]').boundingBox();if(!box)continue;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]})}else await page.keyboard.down(key);
     let moved=false;
     try{await page.waitForFunction(before=>{const player=__ambientEncounter.snapshot().player;return Math.hypot(player.x-before.x,player.y-before.y)>90},before,{timeout:1800});moved=true}
     catch(error){if(error.name!=='TimeoutError')throw error}
     finally{if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.keyboard.up(key)}
     if(moved)break;
    }
    await cdp?.detach();path.playerAside={before,after:await page.evaluate(()=>__ambientEncounter.snapshot().player),method:profile.isMobile?'native touch control':'native keyboard'};
    path.supportSamples=await page.evaluate(async()=>{const samples=[],start=performance.now();while(performance.now()-start<6500){samples.push(__ambientEncounter.sample());await new Promise(done=>setTimeout(done,70))}return samples});
   }
   artifacts.json('encounter.json',evidence);
  }
  return{modes:evidence.paths.map(path=>({mode:path.mode,titleVisible:path.title.state.city.ambient.visible.length,stagedVisible:path.ready.state.city.ambient.visible.length,stagedNearby:path.ready.state.city.ambient.nearby.length,textureBytes:path.ready.state.city.textureBytes,resources:path.ready.resourceTotals,modalSamples:path.modalSamples.length,recoverySamples:path.recovery.length})),limits:this.limits};
 }},{id:'ambient-route-diagnostic',modes:['stress'],timeoutMs:360000,
 async run({page,context,baseURL,artifacts,root,profile}){
  const main=process.env.AMBIENT_ROUTE_SOURCE==='main-irmgard',manifestBytes=main?readFileSync(resolve(root,'assets/characters/street/manifest.json')):null,manifest=main?JSON.parse(manifestBytes):packedCandidate(root),actorVoiceId=main?'crowd-irmgard-aktenordner':voiceId,game=readFileSync(resolve(root,'game.js'),'utf8'),world=readFileSync(resolve(root,'world3d.js'),'utf8'),contacts=main?[]:['contact-measurements.json','vertical-contact-measurements.json'].flatMap(file=>JSON.parse(readFileSync(resolve(root,'output/ambient-city-animation/hartmut-final-pixels/hartmut-keller',file))).assessments);
  if(main){assert.equal(process.env.AMBIENT_ROUTE_CASES,'corner');assert.equal(digest(game),process.env.AMBIENT_ROUTE_GAME_SHA,'Frozen game source pin required');assert.equal(digest(manifestBytes),process.env.AMBIENT_ROUTE_MANIFEST_SHA,'Exact raw MAIN manifest pin required');registerStreetCharacterManifest(manifest);assert(manifest.characters[actorVoiceId].atlasMotion);assert.equal(manifest.characters[actorVoiceId].mouthPaint,undefined);assert.equal(manifest.characters[actorVoiceId].motionDelivery,undefined)}
  const manifestResponses=[];
  page.on('response',response=>{if(new URL(response.url()).pathname==='/assets/characters/street/manifest.json')manifestResponses.push(response.body().then(body=>({url:response.url(),sha256:digest(body),bytes:body.length}))) });
  if(!main)await page.route('**/assets/characters/street/manifest.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
  await page.route('**/game.js?*',route=>route.fulfill({contentType:'text/javascript',body:game.replace('function loop(now){',gameProbe(actorVoiceId)+'function loop(now){')}));
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:world.replace('window.Germany3D={ready:true',cityProbe(root,contacts,manifest)+'window.Germany3D={ready:true')}));
  const evidence={hashes:{game:digest(game),world:digest(world),manifest:main?digest(manifestBytes):digest(JSON.stringify(manifest))},manifestSource:main?'Exact MAIN filesystem bytes, no manifest interception':'Serialized opt-in Hartmut candidate interception',actorVoiceId,profile:profile.id,cases:[],limits:main?['Known legal Spaeti fixture stages an existing published Irmgard once before world admission; exact raw MAIN manifest is served unchanged.','No actor root teleport after setup, no manual animation phase injection, no replacement physics/controller; real city update and accepted-step observer.','Irmgard is not a quizzer: no quiz/audio/mouth/delivery readiness requirement or held voice preview.','No Hartmut source-contact marks applied to Irmgard; actual mesh UV/pivot/root observations only. Physical Android and sole-contact certification NOT RUN.']:['Natural route retained for reproduction; clear/corner/prop initial fixtures stage the same existing Hartmut once before world admission.','No actor root teleport after setup, no manual animation phase injection, no replacement physics/controller; real city update and accepted-step observer.','Player quiz target/eligibility staged, existing guarded handlers and DOM answer route used. Default caption behavior only; held audition is not admitted here.','Source soles use actual displayed texture UV crop; short samples do not certify continuous planting or physical Android performance.']};
  for(const kind of (process.env.AMBIENT_ROUTE_CASES||'natural,clear,corner,prop').split(',')){
   const entry={kind};evidence.cases.push(entry);artifacts.json('route-diagnostic.json',evidence);
   await page.goto(baseURL+'/?'+(kind==='natural'?'':'ambientRoute='+kind),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__ambientEncounter&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:120000});
   entry.title=await snapshot(page,context);evidence.servedManifestResponses=await Promise.all(manifestResponses);if(main){assert.equal(evidence.servedManifestResponses.length,1);assert.equal(evidence.servedManifestResponses[0].sha256,evidence.hashes.manifest,'Served MAIN bytes must equal frozen raw file')}entry.initialSetup=await page.evaluate(()=>__ambientEncounter.setup());
   if(entry.initialSetup?.status==='NOT RUN'){entry.status='NOT RUN';entry.reason=entry.initialSetup.reason;artifacts.json('route-diagnostic.json',evidence);continue}
   if(kind!=='natural'){assert.equal(entry.initialSetup.beforeWorldAdmission,true);assert.equal(entry.initialSetup.legal,true)}
   if(main)entry.initialMovementTraceStart=await page.evaluate(()=>__ambientEncounter.traceStart());await page.locator('#start').click();entry.stage=await page.evaluate(()=>__ambientEncounter.stage());
   await page.waitForFunction(()=>{const p=__ambientEncounter.snapshot().city.selected?.paint;return p?.failed||p?.motionLoaded&&(p.id==='crowd-irmgard-aktenordner'||p?.mouthPaint.loaded)},null,{timeout:45000});
   if(main&&await page.locator('#fax-dismiss').isVisible()){await page.locator('#fax-dismiss').click();await page.waitForFunction(()=>document.getElementById('mission-fax').hidden,null,{timeout:4000})}
   entry.ready=await snapshot(page,context);entry.geometry=await page.evaluate(()=>__ambientEncounter.geometry());assert.equal(entry.ready.state.city.selected.paint.failed,false);if(!main)assert.equal(entry.ready.state.city.selected.paint.delivery.movementLoaded,true);else assert.equal(entry.ready.state.city.selected.characterId,actorVoiceId);
   assert.equal(entry.ready.state.city.selected.paint.variant,profile.isMobile?'mobile':'desktop');if(main){entry.initialMovementTrace=await page.evaluate(()=>__ambientEncounter.traceStop());const accepted=entry.initialMovementTrace.filter(t=>t.kind==='accepted');entry.initialAcceptedSegments=accepted.length;entry.initialAcceptedChainContinuous=accepted.every((t,i)=>!i||Math.hypot(t.from.x-accepted[i-1].to.x,t.from.y-accepted[i-1].to.y)<1e-7);if(accepted.length){entry.initialAcceptedRoot=accepted[0].from;assert(Math.hypot(accepted[0].from.x-954,accepted[0].from.y-1339)<1e-7,'Initial corner trace starts at actual staged root')}assert.equal(entry.initialAcceptedChainContinuous,true)}
   entry.capture=await motionCapture(page,kind==='clear'?10000:kind==='natural'?7000:5500);entry.summary=motionSummary(entry.capture);
   entry.status=entry.summary.netProgress>=26&&!entry.summary.illegalGround&&!entry.summary.bodyBlockedSamples?'PASS':'FAIL';
   if(kind==='clear')entry.continuousGait=entry.summary.walkPhases.length>=8&&entry.summary.longestWalkMs>=2000?'PASS':'FAIL';
   if(main){entry.allLeftPhases=Array.from({length:16},(_,i)=>'left:'+i).every(phase=>entry.summary.walkPhases.includes(phase));entry.maxAcceptedSegmentLength=Math.max(0,...entry.capture.trace.filter(t=>t.kind==='accepted').map(t=>Math.hypot(t.dx,t.dy)));entry.quiz='NOT RUN: published Irmgard is not a quizzer';if(!entry.allLeftPhases||entry.maxAcceptedSegmentLength>1.001)entry.status='FAIL';if(await page.locator('#fax-dismiss').isVisible()){await page.locator('#fax-dismiss').click();await page.waitForFunction(()=>document.getElementById('mission-fax').hidden,null,{timeout:4000})}}
   artifacts.json('route-diagnostic.json',evidence);await artifacts.screenshot(page,kind+'-route.png');if(main)assert.equal(entry.status,'PASS','Exact MAIN Irmgard corner must meet26px/legal/all16phase/continuous-step checks');
   if(!main&&(kind==='corner'||kind==='prop')){
    entry.quizTarget=await page.evaluate(()=>__ambientEncounter.quizTarget());
    if(entry.quizTarget.status==='READY'){
     entry.approach=await page.evaluate(()=>__ambientEncounter.begin());
     entry.quizTrace=await page.evaluate(async()=>{__ambientEncounter.traceStart();const samples=[],start=performance.now();while(performance.now()-start<14000){const sample=__ambientEncounter.sample();delete sample.city.residentTextures;samples.push(sample);if(sample.quizVisible||!sample.approaching)break;await new Promise(done=>setTimeout(done,65))}return{samples,trace:__ambientEncounter.traceStop()}});
     entry.quizStarted=entry.quizTrace.samples.at(-1).quizVisible;artifacts.json('route-diagnostic.json',evidence);await artifacts.screenshot(page,kind+'-quiz-approach.png');
     if(entry.quizStarted){
      const quiz=await snapshot(page,context);entry.quiz=quiz;assert.equal(quiz.state.speech,null,'No held audition may enter the default catalog');
      await page.waitForFunction(()=>__ambientEncounter.snapshot().choicesEnabled,null,{timeout:25000});const answer=await page.evaluate(()=>__ambientEncounter.snapshot().expectedAnswer);await page.locator('#quiz-choices button[data-answer="'+answer+'"]').click();
      entry.returnCapture=await motionCapture(page,12000);entry.returnSummary=motionSummary(entry.returnCapture);entry.returned=entry.returnCapture.samples.some(s=>s.city.selected.hasReaction)&&!entry.returnCapture.samples.at(-1).city.selected.hasReaction;entry.final=await snapshot(page,context);await artifacts.screenshot(page,kind+'-returned.png');
     }
    }
   }
   artifacts.json('route-diagnostic.json',evidence);
  }
  return{cases:evidence.cases.map(c=>({kind:c.kind,status:c.status,continuousGait:c.continuousGait,summary:c.summary,quizStarted:c.quizStarted,returned:c.returned,returnSummary:c.returnSummary})),limits:evidence.limits};
 }},{id:'ambient-resource-cohort',modes:['stress'],profiles:['desktop'],timeoutMs:180000,
 async run({page,context,baseURL,artifacts,root}){
  const file=resolve(root,process.env.AMBIENT_RESOURCE_MANIFEST||'output/ambient-city-animation/all-resident-resource-manifest.json'),manifest=JSON.parse(readFileSync(file));
  const game=readFileSync(resolve(root,'game.js'),'utf8'),world=readFileSync(resolve(root,'world3d.js'),'utf8');
  await page.route('**/assets/characters/street/manifest.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
  await page.route('**/game.js?*',route=>route.fulfill({contentType:'text/javascript',body:game.replace('function loop(now){',gameProbe()+'function loop(now){')}));
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:world.replace('window.Germany3D={ready:true',cityProbe(root,[],manifest)+'window.Germany3D={ready:true')}));
  const evidence={candidate:file,manifestSha256:digest(JSON.stringify(manifest)),gameSha256:digest(game),worldSha256:digest(world),limits:['Resource-only opt-in cohort: placeholder standing images and actual candidate motion sources; no art, scale or actor animation approval.','Production camera, normal motion demand/retirement policy; snapshots sample currently admitted views rather than guaranteeing every cast member loads.']};
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__ambientEncounter&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:120000});
  evidence.title=await snapshot(page,context);await page.locator('#start').click();await page.evaluate(()=>__ambientEncounter.admit());
  await page.waitForFunction(()=>__ambientCityInspect().ambient.motionLoaded.length>0,null,{timeout:90000});await page.waitForFunction(()=>Germany3D.nearbyAssetsReady,null,{timeout:90000});
  evidence.started=await snapshot(page,context);await artifacts.screenshot(page,'cohort-started.png');artifacts.json('cohort.json',evidence);
  return{title:{distinct:evidence.title.state.city.ambient.loaded.length,textureBytes:evidence.title.state.city.textureBytes,resources:evidence.title.resourceTotals},started:{visible:evidence.started.state.city.ambient.visible,nearby:evidence.started.state.city.ambient.nearby,admitted:evidence.started.state.city.ambient.prepared,motion:evidence.started.state.city.ambient.motionLoaded,textureBytes:evidence.started.state.city.textureBytes,memory:evidence.started.state.city.memory,resources:evidence.started.resourceTotals},limits:evidence.limits};
 }},{id:'ambient-floor-probe',modes:['stress'],timeoutMs:120000,
 async run({page,context,baseURL,artifacts,root,profile}){
  const manifest=packedCandidate(root),game=readFileSync(resolve(root,'game.js'),'utf8'),world=readFileSync(resolve(root,'world3d.js'),'utf8');
  const contacts=['contact-measurements.json','vertical-contact-measurements.json'].flatMap(file=>JSON.parse(readFileSync(resolve(root,'output/ambient-city-animation/hartmut-final-pixels/hartmut-keller',file))).assessments);
  await page.route('**/assets/characters/street/manifest.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
  await page.route('**/game.js?*',route=>route.fulfill({contentType:'text/javascript',body:game.replace('function loop(now){',gameProbe()+'function loop(now){')}));
  await page.route('**/world3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:world.replace('window.Germany3D={ready:true',cityProbe(root,contacts,manifest)+'window.Germany3D={ready:true')}));
  const evidence={hashes:{game:digest(game),world:digest(world),manifest:digest(JSON.stringify(manifest)),contacts:digest(JSON.stringify(contacts))},limits:['Staged player location near an existing natural-route actor; no actor root teleport, contact locking or replacement physics.','Source contact samples wrap at frames_per_cycle; actual displayed mesh matrix, camera, root and source-pixel floor intersections are observations.','Short observed contacts cannot certify continuous foot planting or an unseen route/camera/device.']};
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__ambientEncounter&&window.Germany3D?.startupReady&&Germany3DBridge.startupAssetsReady&&document.getElementById('preload').hidden,null,{timeout:90000});
  await page.locator('#start').click();evidence.stage=await page.evaluate(()=>__ambientEncounter.stage());await page.waitForFunction(()=>__ambientEncounter.snapshot().city.selected?.paint?.motionLoaded,null,{timeout:45000});
  const before=await page.evaluate(()=>__ambientEncounter.snapshot().player);await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(before=>{const player=__ambientEncounter.snapshot().player;return Math.hypot(player.x-before.x,player.y-before.y)>90},before,{timeout:2000})}finally{await page.keyboard.up('ArrowRight')}
  evidence.playerAside={before,after:await page.evaluate(()=>__ambientEncounter.snapshot().player),method:'Native keyboard input; mobile context remains touch-capable emulation'};
  evidence.ready=await snapshot(page,context);evidence.samples=await page.evaluate(async()=>{const samples=[],start=performance.now();while(performance.now()-start<7000){samples.push(__ambientEncounter.sample());await new Promise(done=>setTimeout(done,65))}return samples});
  const soleSamples=evidence.samples.flatMap(sample=>sample.city.selected.support.soles.map(sole=>({at:sample.at,actor:sample.actor,phase:sample.city.selected.paint.pose.frame,direction:sample.city.selected.paint.pose.direction,...sole})));
  evidence.summary={samples:evidence.samples.length,soleSamples:soleSamples.length,observedPhases:[...new Set(evidence.samples.filter(sample=>sample.city.selected.paint.pose.clip==='walk').map(sample=>sample.city.selected.paint.pose.direction+':'+sample.city.selected.paint.pose.frame))],pivotMaxHeightError:Math.max(...evidence.samples.map(sample=>Math.abs(sample.city.selected.support.pivotWorld[1]-sample.city.selected.support.rootWorld[1]))),soleHeightRange:soleSamples.length?[Math.min(...soleSamples.map(sole=>sole.heightAboveRootGround)),Math.max(...soleSamples.map(sole=>sole.heightAboveRootGround))]:null};
  assert(soleSamples.length>0,'Actual displayed contact phases must be sampled');await artifacts.screenshot(page,'floor-probe.png');artifacts.json('floor-probe.json',evidence);return{...evidence.summary,variant:evidence.ready.state.city.selected.paint.variant,viewport:evidence.ready.viewport,limits:evidence.limits};
 }}]
};
