// Independent, muted evidence for the frozen street-adviser candidate.
// --check parses response-only hooks without launching Chrome. Run browser work
// only after the synthesis owner explicitly reports CUDA unloaded.
// --final-audio checks final street recordings/captions without repeating world
// probes; --final-audio --check validates assets and reports catalog readiness.
// --pedestrian-ownership checks one authored legacy row through a named crowd
// actor after a narrow voice-ownership fix, without repeating accepted cases.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const root=fileURLToPath(new URL('..',import.meta.url)).replace(/[\\/]$/,'');
const output=resolve(process.env.PLAYTEST_OUTPUT||resolve(root,'output/street-wisdom'));
const cityOnly=process.argv.includes('--city-only');
const finalAudio=process.argv.includes('--final-audio');
const pedestrianOwnership=process.argv.includes('--pedestrian-ownership');
assert([cityOnly,finalAudio,pedestrianOwnership].filter(Boolean).length<=1,'Choose one focused evidence mode');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(resolve(root,path),'utf8').replace(/\r\n/g,'\n');
const world=read('world3d.js'),game=read('game.js');
const candidate=JSON.parse(read('output/street-wisdom-candidate.json'));
const files=Object.keys(candidate.sha256);
for(const path of ['index.html','3d.html','game.js','world3d.js','street-wisdom.js','tests/street-wisdom.test.mjs','tests/street-wisdom-encounters.test.mjs'])assert(files.includes(path),'Frozen source missing: '+path);
const hashes=()=>Object.fromEntries(files.map(path=>[path,digest(readFileSync(resolve(root,path)))]));
const before=hashes();
assert.deepEqual(before,candidate.sha256,'Refresh the frozen candidate before reviewing changed production sources');
const once=(source,anchor,replacement)=>{assert.equal(source.split(anchor).length,2,'Unique response hook: '+anchor.slice(0,65));return source.replace(anchor,replacement)};
const production=name=>{const start=world.indexOf(`  function ${name}(`),end=world.indexOf('\n  }',start);assert(start>=0&&end>start,name);return world.slice(start,end+4)};
const updateStart=game.indexOf('function update(dt)'),policeStart=game.indexOf(' for(let i=police.length-1',updateStart),ordinaryStart=game.indexOf('\n for(const n of npcs){',policeStart),ordinaryEnd=game.indexOf('\n state.ruleTimer+=dt;',ordinaryStart);
assert(updateStart>=0&&policeStart>updateStart&&ordinaryStart>policeStart&&ordinaryEnd>ordinaryStart,'Exact production motion seams');
const ordinaryLoop=game.slice(ordinaryStart,ordinaryEnd),escortLoop=game.slice(policeStart,ordinaryStart);

// No production file is edited. These closures expose existing owners and add
// only forced fixtures/observations to the bytes returned by the local server.
const gameHook=`
function swTickOrdinary(dt){${ordinaryLoop}}
function swTickEscort(dt){${escortLoop}}
const swEvents=[],swProbe=window.__streetGame={freeze:true,mode:'natural',events:swEvents,state,player,npcs,
 announceCurrentRule,interact,stopSpeech,updateHud,
 snapshot(){return {started:state.started,voiceOn:state.voiceOn,rule:state.rule,
  active:activeStimulus?{family:activeStimulus.family,text:activeStimulus.text,voiceId:activeStimulus.candidateVoiceId,mode:activeStimulus.subtitleMode,recording:activeStimulus.recording||null,metadata:speechCatalog.recordings?.[activeStimulus.recording]||null}:null,
  queued:stimulusQueue.map(item=>({family:item.family,text:item.text,voiceId:item.candidateVoiceId})),
  caption:textOnlyBark?{text:textOnlyBark.text,speaker:textOnlyBark.captionSpeaker}:null,
  bark:{hidden:document.getElementById('police-bark').hidden,speaker:document.getElementById('bark-speaker').textContent,text:document.getElementById('police-bark-text').textContent},
  advisers:npcs.filter(n=>n.wisdomId).map(n=>({id:n.id,voiceId:n.voiceId,cursor:n.wisdomRuleCursor||0,spokeAt:n.wisdomSpokeAt??null,arrested:!!n.arrested})),events:swEvents.slice()};},
 reset(){stopSpeech();swEvents.length=0;this.mode='natural';state.started=true;state.modal=false;state.gameOver=false;state.dialogue=null;state.subtitlesOn=true;nextAmbientAt=0;document.getElementById('intro').classList.add('hidden');document.getElementById('humor-modal').hidden=true;for(const n of npcs)if(n.wisdomId){n.arrested=false;n.wisdomSpokeAt=-Infinity;n.pause=0;}},
 releaseDecode(){this.rejectDecode?.(new Error('Forced pre-start decode rejection'));this.rejectDecode=null;},
 releaseRealDecode(){this.resolveDecode?.();this.resolveDecode=null;this.decodePending=null;},
 clearRecordingCache(){recordingPromises.clear();}
};
swProbe.borrowedPedestrian=()=>{
 swProbe.reset();swProbe.clearRecordingCache();state.region='germany';state.voiceOn=true;
 const actor=npcs.find(n=>n.crowd&&n.voiceId==='crowd-hildegard-brotzeit'),item=pedestrianBarks.germany.sidewalk.find(row=>row.recording&&row.text===GermanySimulatorAudioText.clips['thorsten-angry-nicht-weg'].text);
 if(!actor||!item||item.voiceId===actor.voiceId)throw Error('Actual named crowd / authored foreign row missing');
 const lines=crowdArchetypeById[actor.archetype].barks.germany,original=lines.slice(),family='pedestrian:'+actor.archetype+':germany:sidewalk';
 player.x=actor.x;player.y=actor.y+50;actor.barkAt=0;pedestrianBark.last=0;swEvents.length=0;
 try{lines.splice(0,lines.length,item);stimulusBags.delete(family);return {accepted:pedestrianBark(actor,'sidewalk'),actor:{id:actor.id,name:actor.name,voiceId:actor.voiceId,spriteKind:actor.spriteKind,x:actor.x,y:actor.y},profile:GermanySimulatorAudioText.productionVoices[actor.voiceId],authored:{...item},selected:GermanySimulatorAudioText.candidateClip(actor.voiceId,item.text)};}
 finally{lines.splice(0,lines.length,...original);stimulusBags.delete(family);}
};
const swOriginalBark=showWorldBark;
showWorldBark=function(speaker,text,urgent,recording,placement,options={}){
 if(options.family==='rule'||options.family?.startsWith('pedestrian:')){
  swEvents.push({stage:'request',speaker,text,voiceId:options.candidateVoiceId,recording:recording||null,time:performance.now()});
  const start=options.start;options={...options,start:()=>{swEvents.push({stage:'start',speaker,text,voiceId:options.candidateVoiceId,time:performance.now(),active:swProbe.snapshot().active,bark:swProbe.snapshot().bark});start?.();}};
 }
 return swOriginalBark(speaker,text,urgent,recording,placement,options);
};
const swOriginalQueue=queueStimulus;
queueStimulus=function(item){if(item.family==='rule'&&['missing','deferred'].includes(swProbe.mode)){item.recording='./__street-rule-fixture__.mp3';item.recordingSequence=null;}return swOriginalQueue(item);};
const swOriginalPrepare=prepareRecording;
prepareRecording=function(path){if(path==='./__street-rule-fixture__.mp3'&&swProbe.mode==='deferred')return new Promise((_,reject)=>{swProbe.rejectDecode=reject;});const actual=swOriginalPrepare(path);return swProbe.mode==='deferred-real'?actual.then(buffer=>new Promise(resolve=>{swProbe.decodePending={path,duration:buffer.duration};swProbe.resolveDecode=()=>resolve(buffer);})):actual;};
swProbe.motion={running:false,finished:false,elapsed:0,samples:[],events:[],
 begin(kind,index){
  swProbe.reset();state.voiceOn=false;state.quizApproach=null;
  const lists={npcs,buildings,props,trees,normObjects,trains,trafficCars,policeVehicles,police},snapshots=Object.fromEntries(Object.entries(lists).map(([key,list])=>[key,list.slice()]));
  const actor=npcs.filter(n=>n.wisdomId)[index],original={...actor},savedPlayer={...player};
  for(const list of Object.values(lists))list.splice(0,list.length);
  Object.assign(actor,{x:kind==='mixed-opposing'?300:286.8,y:kind==='boxed-reopen'?114:132,vx:12,vy:0,avoid:1,pause:0,arrested:false,routeBounds:{x:100,y:100,w:700,h:kind==='boxed-reopen'?28:72},min:113,max:787,wisdomExitCheck:0,wisdomBlocked:false,progressWindow:null,blockedTimer:0,wisdomRuleCursor:0});
  npcs.push(actor);player.x=8000;player.y=5000;
  if(kind==='mixed-opposing'){actor.y=136;const other={id:'fixture-ordinary-opposing',name:'Ordinary opposing pedestrian',x:360,y:136,vx:-12,vy:0,crowd:true,avoid:1,routeBounds:actor.routeBounds,min:113,max:787,pause:0};npcs.push(other);}
  if(kind==='corner-recovery'){actor.x=297;actor.y=124;buildings.push({x:230,y:145,w:200,h:27});props.push({x:320,y:127,collisionRadius:10,asset:'bollard'});}
  if(kind==='boxed-reopen')buildings.push({x:300,y:100,w:20,h:28},{x:260,y:100,w:13,h:28});
  if(kind==='escorted-retained-pause'){actor.pause=10;actor.arrested=true;actor.routeBounds=null;police.push({x:actor.x-23,y:actor.y-23,speed:20,escort:actor,voiceId:'polizei-heinrich-wachtmeister'});}
  const firstRule=StreetWisdom.definitions.find(d=>d.id===actor.wisdomId).ruleIndices[0],duration=kind==='speech-pause-resume'?1+GermanySimulatorAudioText.clips['rule-'+String(firstRule+1).padStart(2,'0')].text.length*.045+1+2.5:kind==='escorted-retained-pause'?3:6;
  Object.assign(this,{kind,actor,duration,running:true,finished:false,elapsed:0,samples:[],events:[],blockedAttempts:0,firstBlocked:[],probing:false,startedAt:performance.now(),previous:new Map(),speechStarted:false,reopened:false});
  const originalBlocker=responderBlocked,originalExitCheck=streetWisdomCanMove,motion=this;
  streetWisdomCanMove=function(...args){motion.probing=true;try{return originalExitCheck(...args)}finally{motion.probing=false}};
  responderBlocked=function(...args){const result=originalBlocker(...args);if(result&&!motion.probing&&args[3]===actor){motion.blockedAttempts++;if(motion.firstBlocked.length<20)motion.firstBlocked.push({seconds:motion.elapsed,x:args[0],y:args[1],fromX:args[4],fromY:args[5]});}return result;};
  this.restore=()=>{swProbe.stopSpeech();responderBlocked=originalBlocker;streetWisdomCanMove=originalExitCheck;for(const key of Object.keys(actor))if(!(key in original))delete actor[key];Object.assign(actor,original);Object.assign(player,savedPlayer);for(const [key,list] of Object.entries(lists))list.splice(0,list.length,...snapshots[key]);this.running=false;};
  return {kind,actorId:actor.id,duration,walls:buildings.slice(),props:props.slice(),initial:npcs.map(n=>({id:n.id,x:n.x,y:n.y,routeBounds:n.routeBounds})),loopSha256:${JSON.stringify(digest(ordinaryLoop))},escortSha256:${JSON.stringify(digest(escortLoop))}};
 },
 advance(dt){
  if(!this.running||!dt)return;const steps=Math.ceil(dt/.025);
  for(let step=0;step<steps;step++){
   const delta=Math.min(dt/steps,this.duration-this.elapsed);if(delta<=0)break;this.elapsed+=delta;
   if(this.kind==='boxed-reopen'&&!this.reopened&&this.elapsed>=2){buildings.splice(0,1);this.reopened=true;this.events.push({stage:'exit-reopened',seconds:this.elapsed});}
   if(this.kind==='speech-pause-resume'&&!this.speechStarted&&this.elapsed>=1){player.x=this.actor.x;player.y=this.actor.y+75;swProbe.announceCurrentRule(this.actor,true);this.speechStarted=true;this.events.push({stage:'actual-rule-start',seconds:this.elapsed,pause:this.actor.pause});}
   if(this.kind==='escorted-retained-pause')swTickEscort(delta);
   swTickOrdinary(delta);
  }
 },
 observe(now){
  if(!this.running)return;const r=window.__streetRender;
  for(const wall of r.motionWalls||[])wall.mesh.visible=buildings.includes(wall.source);
  for(const n of npcs){const q=r.npcMeshes.get(n);if(!q)continue;const old=this.previous.get(n.id)||{x:n.x,y:n.y,phase:q.userData.walkPhase||0},dx=n.x-old.x,dy=n.y-old.y,travel=Math.hypot(dx,dy),phase=q.userData.walkPhase||0;
   this.samples.push({seconds:this.elapsed,wallMilliseconds:now-this.startedAt,id:n.id,x:n.x,y:n.y,dx,dy,travel,phase,phaseDelta:phase-old.phase,phaseError:phase-old.phase-travel*.13,heading:q.rotation.y,travelHeading:travel>.01?Math.atan2(dx,dy):null,headingError:travel>.01?Math.abs(Math.atan2(Math.sin(q.rotation.y-Math.atan2(dx,dy)),Math.cos(q.rotation.y-Math.atan2(dx,dy)))):null,pause:n.pause||0,arrested:!!n.arrested,blocked:!!n.wisdomBlocked,swing:q.userData.walkSwing||0,limbs:['ll','rl','la','ra'].map(key=>q.userData[key]?.rotation.x??null)});
   this.previous.set(n.id,{x:n.x,y:n.y,phase});
  }
  if(this.elapsed>=this.duration){this.running=false;this.finished=true;}
 }
};
`;
const renderHook=`
window.__streetRender={T,scene,world,camera,renderer,bridge,npcMeshes,playerMesh,buildingSlots,trafficCarMeshes,
 X,Z,S,syncChar,updateBuildingOcclusion,updateGroupVisibility,buergeramtDoorGlow,
 bounds(object){if(!object)return null;object.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(object);return {min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new T.Vector3()).toArray()};},
 inspect(){return {camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),aspect:camera.aspect,fov:camera.fov},
  advisers:[...npcMeshes].filter(([n])=>n.wisdomId).map(([n,q])=>({id:n.id,voiceId:n.voiceId,bounds:this.bounds(q),rotation:q.rotation.toArray(),streetWisdom:!!q.userData.streetWisdom,streetCharacter:!!q.userData.streetCharacter})),
  player:this.bounds(playerMesh),door:buergeramtDoorGlow?buergeramtDoorGlow.size.toArray():null,
  buildings:buildingSlots.filter(s=>['buergeramt','bundestag','imbiss'].includes(s.building.id)).map(s=>({id:s.building.id,loaded:!!s.model,bounds:this.bounds(s.model||s.fallback),opacity:s.opacity})),
  cars:[...trafficCarMeshes].map(([n,s])=>({id:n.id,kind:s.kind,loaded:!!s.model,fallback:s.fallback.visible,bounds:this.bounds(s.model?.visible?s.model:s.fallback)})),memory:{...renderer.info.memory}};}
};
`;
let servedGame=once(game,'requestAnimationFrame(loop);\n})();',gameHook+'\nrequestAnimationFrame(loop);\n})();');
// Preserve every authored tree value, but let the response-only fixture save,
// clear and restore collision populations; production keeps its frozen array.
servedGame=once(servedGame,'trees=Object.freeze([','trees=Array.from([');
servedGame=once(servedGame,'if(dt){const steps=',"if(dt&&!window.__streetGame?.freeze){const steps=");
servedGame=once(servedGame,'window.Germany3DBridge?.refreshStartup?.();window.BuergeramtLevel?.update(dt);',"window.__streetGame?.motion?.advance(dt);window.Germany3DBridge?.refreshStartup?.();window.BuergeramtLevel?.update(dt);");
servedGame=once(servedGame,'window.Germany3D?.sync();requestAnimationFrame(loop)',"window.Germany3D?.sync();window.__streetGame?.motion?.observe(now);requestAnimationFrame(loop)");
let servedWorld=once(world,'  window.Germany3D={ready:true',renderHook+'\n  window.Germany3D={ready:true');
servedWorld=once(servedWorld,'updateGroupVisibility();updateBuergeramtDoorGlow(now);',"if(window.__streetRender.fixedCamera){camera.position.fromArray(window.__streetRender.fixedCamera.position);camera.lookAt(...window.__streetRender.fixedCamera.target);}updateGroupVisibility();updateBuergeramtDoorGlow(now);");
new vm.Script(servedGame,{filename:'response-game.js'});
execFileSync(process.execPath,['--input-type=module','--check'],{input:servedWorld,stdio:['pipe','pipe','pipe']});
const hooks={gameSha256:digest(servedGame),worldSha256:digest(servedWorld),ordinaryLoopSha256:digest(ordinaryLoop),escortLoopSha256:digest(escortLoop)};
function finalAudioContract(){
 const window={},context={window,location:{search:''},URLSearchParams};vm.runInNewContext(read('street-wisdom.js'),context);vm.runInNewContext(read('For-AI/AUDIO-TEXT-LIBRARY.js'),context);
 const library=window.GermanySimulatorAudioText,definitions=window.StreetWisdom.definitions,cast=JSON.parse(read('For-AI/VOICE-CAST.json')),rows=[],sources=['For-AI/AUDIO-TEXT-LIBRARY.js','For-AI/VOICE-CAST.json'];
 const expectedEligible=['rule-02','rule-03','rule-04','rule-05','rule-08','rule-10'],catalogErrors=[];
 for(const person of definitions){
  const manifestPath='assets/voices/street-wisdom/'+person.voiceId+'-manifest.json',manifest=JSON.parse(read(manifestPath)),binding=cast.productionVoices[person.voiceId];sources.push(manifestPath);
  assert(binding&&binding.fallback==='captions','Selected caption fallback: '+person.voiceId);assert.equal(manifest.profileId,binding.profileId);assert.equal(manifest.voiceId,person.voiceId);
  for(const [kind,items] of [['recorded',manifest.clips],['held',manifest.heldPrivate]])for(const item of items){
   const ruleId='rule-'+String(item.ruleIndex+1).padStart(2,'0'),clip=library.clips[ruleId];assert(person.ruleIndices.includes(item.ruleIndex),'Authored deck ownership');assert.equal(item.actorId,person.id);assert.equal(item.voiceId,person.voiceId);assert.equal(item.profileId,binding.profileId);assert.equal(item.text,clip.text);assert.equal(item.english,clip.english);
   const row={ruleId,clipId:item.clipId,ruleIndex:item.ruleIndex,actorId:person.id,voiceId:person.voiceId,profileId:binding.profileId,displayName:person.displayName,text:item.text,english:item.english,kind,manifestPath,path:null,sha256:null};
   if(kind==='recorded'){
    for(const [key,expected] of [['renderer',binding.renderer],['modelRevision',binding.modelRevision],['referenceSha256',binding.referenceSha256],['referenceOriginalSha256',binding.originalSha256]])assert.equal(item[key],expected,ruleId+' '+key);
    if(Object.hasOwn(binding,'processing'))assert.deepEqual(item.processing,binding.processing);assert.equal(item.decode?.eosReached,true);assert.equal(item.asrWordExact,true);assert.equal(item.approval?.status,'user-approved');assert(item.file.startsWith('assets/voices/street-wisdom/')&&!item.file.includes('..'));assert.equal(digest(readFileSync(resolve(root,item.file))),item.sha256,'Asset receipt '+ruleId);
    row.path='./'+item.file;row.sha256=item.sha256;sources.push(item.file);
   }
   const selected=library.candidateClip(person.voiceId,item.text),metadata=selected?library.recordings[selected]:null,clipVoice=clip.voiceId,profile=library.productionVoices[person.voiceId];
   if(clipVoice!==person.voiceId||profile?.profileId!==binding.profileId||profile?.fallback!=='captions')catalogErrors.push(ruleId+' current clip/profile binding');
   if(kind==='recorded'){
    if(selected?.replace(/^\.\//,'')!==row.path.slice(2)||metadata?.voiceId!==row.voiceId||metadata?.profileId!==row.profileId||metadata?.sha256!==row.sha256||metadata?.source!==row.text||![row.ruleId,row.clipId].includes(metadata?.id))catalogErrors.push(ruleId+' selected recording receipt');
   }else if(selected||library.recordedClip(person.voiceId,item.text))catalogErrors.push(ruleId+' held take is exposed');
   rows.push(row);
  }
 }
 rows.sort((a,b)=>a.ruleIndex-b.ruleIndex);assert.equal(rows.length,11);assert.equal(new Set(rows.map(row=>row.ruleId)).size,11);assert.deepEqual(rows.filter(row=>row.kind==='recorded').map(row=>row.ruleId),expectedEligible);assert.equal(rows.filter(row=>row.kind==='held').length,5);
 const reserved=new Set(definitions.map(d=>d.voiceId)),crowdRoles=cast.roleProfiles.filter(p=>p.voiceId.startsWith('crowd-')&&!reserved.has(p.voiceId)).map(p=>({voiceId:p.voiceId,fullName:p.fullName.toUpperCase(),gender:p.gender,profileId:cast.productionVoices[p.voiceId].profileId}));assert.equal(crowdRoles.length,9);
 const legacyPedestrian=library.clips['thorsten-angry-nicht-weg'];assert(legacyPedestrian.voiceId==='thorsten'&&legacyPedestrian.recording,'Actual authored legacy pedestrian recording');
 if(pedestrianOwnership)sources.push(legacyPedestrian.recording.replace(/^\.\//,''));
 return {rows,crowdRoles,legacyPedestrian,definitions:definitions.map(d=>({id:d.id,voiceId:d.voiceId,ruleIndices:Array.from(d.ruleIndices)})),catalogReady:catalogErrors.length===0,catalogErrors,sources};
}
const audioContract=finalAudio||pedestrianOwnership?finalAudioContract():null;
if(process.argv.includes('--check')){console.log(JSON.stringify({mode:'source-only',candidate:candidate.base,hashes:before,hooks,finalAudio:audioContract?{eligible:6,held:5,catalogReady:audioContract.catalogReady,catalogErrors:audioContract.catalogErrors}:null,browserLaunched:false,sourceWrites:0}));process.exit(0);}
if(finalAudio||pedestrianOwnership)assert(audioContract.catalogReady,'Final catalog must be synced before Chrome: '+audioContract.catalogErrors.join('; '));

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||(process.env.CODEX_MCP_NODE_PATH?resolve(dirname(process.env.CODEX_MCP_NODE_PATH),'node_modules/playwright'):'playwright'));
mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server=createServer((request,response)=>{try{const name=decodeURIComponent(new URL(request.url,'http://localhost').pathname),path=resolve(root,'.'+name);if(!path.startsWith(root+sep))throw Error('path');const bytes=name==='/game.js'?servedGame:name==='/world3d.js'?servedWorld:readFileSync(path);response.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});response.end(bytes);}catch{response.writeHead(404);response.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
const supportingPaths=Array.from(new Set(['index.html','3d.html','For-AI/AUDIO-TEXT-LIBRARY.js','For-AI/VOICE-CAST.json',...(audioContract?.sources||[])])),supportingHashes=()=>Object.fromEntries(supportingPaths.map(path=>[path,digest(readFileSync(resolve(root,path)))]));
const report={candidate,scope:pedestrianOwnership?'named ordinary pedestrian legacy-recording rejection':finalAudio?'final street recording and caption ownership':cityOnly?'city-only canvas companions':'complete camera and encounter review',audioContract,sourceBefore:before,hooks,harnessSha256:digest(readFileSync(fileURLToPath(import.meta.url))),supportingSourceSha256:supportingHashes(),cases:[],
 limits:['Muted headless Chrome; Android emulation, not a physical Android device','Forced simulation freeze/placement and isolated actual-mesh scenes are labeled separately from natural spawn frames','Intercepted tree array contains the exact authored values but is mutable only to clear/restore forced fixture collisions','World-canvas companion PNGs exclude HTML overlays; full browser screenshots retain them','Final-audio decode gates delay delivery of an actually decoded file; cancellation is checked by the production eligibility owner','No listening approval, full mission completion or performance claim','3d.html is diagnostic smoke only; its separate population does not contain the three canonical advisers','Rendered evidence requires independent pixel inspection; screenshot existence is not visual acceptance']};
report.runState='running';writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
let browser;
const record=(view,id,matrix,evidence,value,pass=true)=>{const row={view,id,matrix,evidence,verdict:pass?'PASS':'FAIL',value};report.cases.push(row);console.log(JSON.stringify({view,id,verdict:row.verdict}));return row;};
const screenshot=async(page,name)=>{const path=resolve(output,name+'.png');await page.screenshot({path});return path;};
const worldCanvas=async(page,name)=>{const png=await page.evaluate(()=>{const r=__streetRender;r.renderer.render(r.scene,r.camera);return r.renderer.domElement.toDataURL('image/png');}),path=resolve(output,name+'-world-canvas.png');writeFileSync(path,Buffer.from(png.split(',')[1],'base64'));return path;};
async function open(view,viewport,url){
 const context=await browser.newContext({viewport,isMobile:view!=='desktop',hasTouch:view!=='desktop'});
 await context.addInitScript(observeFinalAudio=>{
  window.__streetTtsCalls=[];
  window.__streetMediaPlays=[];
  const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{u.volume=0;window.__streetTtsCalls.push({text:u.text,volume:u.volume,time:performance.now()});return speak(u);};
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;window.__streetMediaPlays.push({src:this.currentSrc||this.src,time:performance.now()});return play.apply(this,args);};
  const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args);}return connect.call(this,target,...args);};
  if(observeFinalAudio){
   const owners=new WeakMap(),trace=window.__streetAudioTrace={decoded:[],starts:[]},decode=BaseAudioContext.prototype.decodeAudioData,start=AudioBufferSourceNode.prototype.start;
   BaseAudioContext.prototype.decodeAudioData=function(data,...args){const exact=data.slice(0);return decode.call(this,data,...args).then(async buffer=>{const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',exact)),n=>n.toString(16).padStart(2,'0')).join(''),owner={sha256:hash,encodedBytes:exact.byteLength,duration:buffer.duration,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate};owners.set(buffer,owner);trace.decoded.push({...owner,time:performance.now()});return buffer;});};
   AudioBufferSourceNode.prototype.start=function(...args){const result=start.apply(this,args),active=window.__streetGame?.snapshot().active;trace.starts.push({time:performance.now(),audioClass:this.audioClass||null,decoded:owners.get(this.buffer)||null,mode:active?.mode||null,text:active?.text||null,voiceId:active?.voiceId||null,recording:active?.recording||null,profileId:active?.metadata?.profileId||null,clipId:active?.metadata?.id||null,receiptSha256:active?.metadata?.sha256||null});return result;};
  }
 },finalAudio||pedestrianOwnership);
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(60000);
 await page.goto(base+url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Germany3D?.ready&&Germany3D.startupReady);
 return {context,page,errors};
}

// C1-C3: reuse the production-ray fixtures from the existing object harness.
// These run in an actual browser with real Three geometry, but are forced cases.
async function rayFixtures(page){
 return page.evaluate(({occlusion,fade})=>{
  const {T}=__streetRender,X=x=>x,Z=y=>y,bridge={player:{x:0,y:0},stationElevation:()=>0};
  const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.set(0,10,10);
  const buildingSightline=new T.Raycaster(),sightlineTarget=new T.Vector3(),sightlineDirection=new T.Vector3();
  const buildingSlots=[],checks=[];let previousOcclusionTime=0;
  const buildingObstructsPlayer=eval('('+occlusion+')'),updateBuildingOcclusion=eval('('+fade+')');
  const check=(id,condition)=>checks.push({id,verdict:condition?'PASS':'FAIL'});
  function slot(x,y,z,w,h,d,opacity=1){const material=new T.MeshBasicMaterial({opacity,transparent:opacity<1});material.userData={baseOpacity:opacity,baseTransparent:opacity<1,baseDepthWrite:true};const group=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);group.updateMatrixWorld(true);return{group,mesh,materials:new Set([material]),viewBounds:new T.Box3().setFromObject(group),opacity:1};}
  const tall=slot(0,3,4,2,6,2);check('opaque-blocker',buildingObstructsPlayer(tall));
  for(const [id,s] of [['clear-side',slot(1.5,3,4,1,6,2)],['low-roof',slot(0,.4,4,2,.8,2)],['behind-player',slot(0,3,-4,2,6,2)],['behind-camera',slot(0,3,14,2,6,2)],['glass-only',slot(0,3,4,2,6,2,.42)]])check(id,!buildingObstructsPlayer(s));
  check('lower-body-only',buildingObstructsPlayer(slot(0,.35,.5,2,.7,.5)));
  const gap=slot(0,3,4,2,6,2);gap.mesh.visible=false;const side=new T.Mesh(new T.BoxGeometry(.2,6,2),gap.mesh.material);side.position.set(2,3,4);gap.group.add(side);gap.group.updateMatrixWorld(true);check('mesh-gap',!buildingObstructsPlayer(gap));
  const second=slot(0,4,6,2,8,2),sibling=slot(3,3,4,1,6,2);buildingSlots.push(tall,second,sibling);updateBuildingOcclusion(1000/60);check('two-blockers-only',tall.opacity<1&&second.opacity<1&&sibling.opacity===1);buildingSlots.splice(1);
  const traces=[];for(const fps of [30,60]){tall.opacity=1;previousOcclusionTime=0;const trace=[];for(let i=1;i<=fps/2;i++){updateBuildingOcclusion(i*1000/fps);trace.push({seconds:i/fps,opacity:tall.opacity});}traces.push({fps,trace});check('onset-'+fps,tall.opacity<=.04);}
  tall.group.visible=false;tall.opacity=.03;previousOcclusionTime=0;for(let i=1;i<=60;i++)updateBuildingOcclusion(i*1000/60);check('restoration',tall.mesh.material.opacity===1&&!tall.mesh.material.transparent&&tall.mesh.material.depthWrite);
  return {checks,traces};
 },{occlusion:production('buildingObstructsPlayer'),fade:production('updateBuildingOcclusion')});
}

// C4-C5 forced close views clone the actual installed production people/props,
// retain their materials and use the existing renderer (no alternate renderer).
async function meshFrames(page){
 return page.evaluate(()=>{
  const r=__streetRender,{T,renderer}=r,source=[...r.npcMeshes].filter(([n])=>n.wisdomId);
  const scene=new T.Scene();scene.background=new T.Color(0x77756f);scene.add(new T.HemisphereLight(0xe4e0d6,0x454440,2.3));
  const sun=new T.DirectionalLight(0xf4f1e8,1.4);sun.position.set(-3,8,5);scene.add(sun);
  const models=source.map(([n,q],i)=>{const clone=q.clone(true),limbs=clone.children.filter(c=>c.isGroup);assertLimbs(limbs);Object.assign(clone.userData,{ll:limbs[0],rl:limbs[1],la:limbs[2],ra:limbs[3]});clone.position.set((i-1)*.75,0,.5);clone.rotation.set(0,0,0);scene.add(clone);return {n,clone};});
  function assertLimbs(limbs){if(limbs.length!==4)throw Error('Expected four actual production limb groups');}
  const player=r.playerMesh.clone(true);player.position.set(1.6,0,.5);player.rotation.set(0,0,0);scene.add(player);
  const wall=new T.Mesh(new T.PlaneGeometry(5,2.7),new T.MeshBasicMaterial({color:0x174ed6}));wall.position.set(0,1.2,0);scene.add(wall);
  const camera=new T.PerspectiveCamera(48,renderer.domElement.width/renderer.domElement.height,.1,30);camera.position.set(.25,1,4.7/Math.min(1,camera.aspect));camera.lookAt(.25,.85,0);
  const frame=label=>{renderer.render(scene,camera);const gl=renderer.getContext(),pixels=new Uint8Array(32*32*4),width=renderer.domElement.width,height=renderer.domElement.height;gl.readPixels(Math.floor(width/2)-16,Math.floor(height/2)-16,32,32,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return {label,png:renderer.domElement.toDataURL('image/png'),pixelShaInput:Array.from(pixels),camera:{position:camera.position.toArray(),target:[.25,.85,0]},player:{visible:player.visible,...r.bounds(player)},bounds:models.map(({n,clone})=>({id:n.id,visible:clone.visible,walkSwing:clone.userData.walkSwing,limbRotations:['ll','rl','la','ra'].map(key=>clone.userData[key].rotation.x),...r.bounds(clone)}))};};
  const frames=[];
  models.forEach(({clone})=>clone.visible=false);player.visible=false;const baseline=frame('opaque-wall-baseline');frames.push(baseline);
  models.forEach(({clone})=>clone.visible=true);player.visible=true;frames.push(frame('all-advisers-player-in-front'));
  models.forEach(({clone})=>clone.position.z=-.5);player.position.z=-.5;const behind=frame('all-advisers-player-behind');frames.push(behind);
  wall.material.transparent=true;wall.material.opacity=.03;wall.material.depthWrite=false;wall.material.needsUpdate=true;const faded=frame('all-advisers-player-through-faded-wall');frames.push(faded);
  wall.visible=false;models.forEach(({clone})=>clone.position.z=0);player.position.z=0;
  for(const [label,phase] of [['idle',0],['production-gait-positive',Math.PI/2],['production-gait-negative',Math.PI*1.5],['production-pause-settled',null]]){
   for(const [i,{n,clone}] of models.entries()){
    const actor={...n,pause:phase===null?1:0};
    clone.userData.worldX=actor.x-(phase||0)/.13;clone.userData.worldY=actor.y;clone.userData.walkPhase=0;
    if(phase!==null)clone.userData.walkSwing=0;
    for(let j=0;j<(phase===null?32:1);j++)r.syncChar(clone,actor);
    clone.position.set((i-1)*.75,0,0);clone.rotation.set(0,0,0);
   }
   frames.push(frame(label));
  }
  models.forEach(({clone},i)=>{clone.rotation.y=Math.PI/2;clone.position.z=i*.15;});frames.push(frame('side-props-and-feet'));
  models.forEach(({clone},i)=>{clone.visible=i===1;clone.position.set(0,0,0);clone.rotation.y=0;});player.position.set(0,0,.6);frames.push(frame('player-in-front-of-adviser'));player.position.z=-.6;frames.push(frame('player-behind-adviser'));
  player.visible=false;models[0].clone.visible=true;models[0].clone.position.z=.6;frames.push(frame('waltraud-in-front-of-horst'));models[0].clone.position.z=-.6;frames.push(frame('waltraud-behind-horst'));
  const same=(a,b)=>a.pixelShaInput.every((v,i)=>v===b.pixelShaInput[i]);
  const checks=[{id:'opaque-wall-hides-actual-body',verdict:same(baseline,behind)?'PASS':'FAIL'},{id:'faded-wall-reveals-actual-body',verdict:!same(behind,faded)?'PASS':'FAIL'}];
  wall.geometry.dispose();wall.material.dispose();return {checks,frames};
 });
}

async function encounters(page,view){
 const result=await page.evaluate(()=>{
  const p=__streetGame;p.reset();p.state.voiceOn=false;const advisers=p.npcs.filter(n=>n.wisdomId),original=p.npcs.map((n,index)=>({index,x:n.x,y:n.y}));
  for(const n of p.npcs)if(!n.wisdomId){n.x=10000;n.y=10000;}
  const checks=[],decks=[];const check=(id,pass,value)=>checks.push({id,verdict:pass?'PASS':'FAIL',value});
  p.state.started=false;p.player.x=advisers[0].x;p.player.y=advisers[0].y+50;check('prestart-no-rule',p.announceCurrentRule()===false&&p.events.length===0);p.state.started=true;
  p.player.x=-5000;p.player.y=-5000;check('far-no-rule',p.announceCurrentRule()===false&&p.events.length===0);
  const population=p.npcs.slice();p.npcs.splice(0,p.npcs.length,...population.filter(n=>!n.wisdomId));p.player.x=advisers[0].x;p.player.y=advisers[0].y+50;check('absent-speaker-no-rule',p.announceCurrentRule()===false&&p.announceCurrentRule(advisers[0],true)===false&&p.events.length===0);p.npcs.splice(0,p.npcs.length,...population);
  for(const n of advisers){
   const definition=StreetWisdom.definitions.find(d=>d.id===n.wisdomId),heard=[],expectedSpeaker=n.name+' · REGEL DES AUGENBLICKS';n.wisdomRuleCursor=0;n.wisdomSpokeAt=-Infinity;p.player.x=n.x;p.player.y=n.y+50;
   p.stopSpeech();p.announceCurrentRule();const nearby=p.events.filter(e=>e.stage==='start').at(-1);check(n.id+'-nearby-speaker',nearby?.voiceId===n.voiceId&&nearby?.speaker===expectedSpeaker,{expectedSpeaker,heard:nearby});n.wisdomRuleCursor=0;
   for(let i=0;i<definition.ruleIndices.length+1;i++){p.stopSpeech();p.announceCurrentRule(n,true);const last=p.events.filter(e=>e.stage==='start').at(-1),index=definition.ruleIndices[i%definition.ruleIndices.length];heard.push(last);check(n.id+'-deck-'+i,last?.voiceId===n.voiceId&&last?.speaker===expectedSpeaker&&last?.text===GermanySimulatorAudioText.clips['rule-'+String(index+1).padStart(2,'0')].text,{expected:index,heard:last});}decks.push({id:n.id,heard});
  }
  p.stopSpeech();p.events.length=0;const n=advisers[0];p.player.x=n.x;p.player.y=n.y+50;n.wisdomRuleCursor=0;n.wisdomSpokeAt=-Infinity;
  return {checks,decks,placement:{person:n.id,x:n.x,y:n.y},original};
 });
 record(view,'rule-decks-prestart-and-distance','X1','forced position/state; actual authored decks and broker',result,result.checks.every(c=>c.verdict==='PASS'));
 await page.keyboard.press('KeyE');
 let snapshot=await page.evaluate(()=>__streetGame.snapshot());
 record(view,'E-and-voice-off-caption','X1','real keyboard E at forced nearby placement; actual voice-off path',snapshot,snapshot.events.filter(e=>e.stage==='start').length===1&&!snapshot.bark.hidden&&!!snapshot.caption);
 await screenshot(page,view+'-E-voice-off-caption');
 await page.evaluate(()=>{const p=__streetGame;p.reset();p.state.voiceOn=true;p.mode='missing';const n=p.npcs.find(n=>n.wisdomId);p.player.x=n.x;p.player.y=n.y+50;p.announceCurrentRule(n,true);});
 await page.waitForFunction(()=>__streetGame.snapshot().events.some(e=>e.stage==='start'));
 snapshot=await page.evaluate(()=>({snapshot:__streetGame.snapshot(),tts:__streetTtsCalls.slice()}));
 record(view,'missing-audio-caption-no-TTS','X1','forced recording HTTP 404; actual broker fallback',snapshot,snapshot.snapshot.active?.mode==='silent'&&!snapshot.snapshot.bark.hidden&&snapshot.tts.length===0);
 await screenshot(page,view+'-missing-audio-caption');
 for(const cancellation of ['leave','arrest']){
  await page.evaluate(()=>{const p=__streetGame;p.reset();p.state.voiceOn=true;p.mode='deferred';const n=p.npcs.find(n=>n.wisdomId);p.player.x=n.x;p.player.y=n.y+50;p.announceCurrentRule(n,true);});
  await page.waitForFunction(()=>!!__streetGame.rejectDecode);
  const checked=await page.evaluate(async reason=>{const p=__streetGame,n=p.npcs.find(n=>n.wisdomId);if(reason==='leave')p.player.x=n.x+500;else n.arrested=true;p.releaseDecode();await new Promise(done=>setTimeout(done,100));return {...p.snapshot(),tts:__streetTtsCalls.slice()};},cancellation);
  record(view,'before-start-'+cancellation+'-cancels','X1','forced unresolved decode; actual production eligibility after '+cancellation,checked,!checked.active&&checked.events.every(e=>e.stage!=='start')&&checked.tts.length===0);
 }
 await page.evaluate(original=>{const p=__streetGame;p.reset();p.state.started=false;for(const row of original){const n=p.npcs[row.index];n.x=row.x;n.y=row.y;}},result.original);
}

// Timed, forced collision fixtures run the exact ordinary/escort blocks inside
// their production closure. The normal RAF then calls the actual world syncChar.
// Physics owns broader CPU coverage; these collect motion and pixels together.
async function movementFrames(page,view){
 for(const [kind,index] of [['mixed-opposing',1],['corner-recovery',0],['boxed-reopen',0],['speech-pause-resume',1],['escorted-retained-pause',2]]){
  const fixture=await page.evaluate(({kind,index})=>{
   const p=__streetGame,r=__streetRender,{T}=r,fixture=p.motion.begin(kind,index);
   const group=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(14,.02,1.44),new T.MeshStandardMaterial({color:0x77736c,roughness:1}));floor.position.set(r.X(450),-.01,r.Z(136));group.add(floor);
   r.motionWalls=r.bridge.buildings.map(source=>{const mesh=new T.Mesh(new T.BoxGeometry(source.w*r.S,.7,source.h*r.S),new T.MeshStandardMaterial({color:0x817767,roughness:1}));mesh.position.set(r.X(source.x+source.w/2),.35,r.Z(source.y+source.h/2));group.add(mesh);return{source,mesh};});
   for(const source of fixture.props){const mesh=new T.Mesh(new T.CylinderGeometry(source.collisionRadius*r.S,source.collisionRadius*r.S,.6,12),new T.MeshStandardMaterial({color:0x676965,roughness:1}));mesh.position.set(r.X(source.x),.3,r.Z(source.y));group.add(mesh);}
   r.motionFixture={group,worldVisible:r.world.visible,fixedCamera:r.fixedCamera};r.world.visible=false;r.scene.add(group);
   const target=[r.X(kind==='mixed-opposing'?330:286.8),.8,r.Z(kind==='boxed-reopen'?114:132)],distance=4.7/Math.min(1,r.camera.aspect);
   r.fixedCamera={position:[target[0],2.4,target[2]+distance],target};Germany3D.sync();
   for(const [n,q] of r.npcMeshes){q.userData.worldX=n.x;q.userData.worldY=n.y;q.userData.walkPhase=0;q.userData.walkSwing=0;p.motion.previous.set(n.id,{x:n.x,y:n.y,phase:0});}
   Germany3D.sync();return fixture;
  },{kind,index});
  const times=kind==='speech-pause-resume'?[0,.9,1.7,fixture.duration-2,fixture.duration-.15]:kind==='escorted-retained-pause'?[0,.5,1.5,2.8]:kind==='boxed-reopen'?[0,1.8,2.8,5.8]:[0,.8,2.8,5.8],frames=[];
  for(const targetSeconds of times){
   if(targetSeconds)await page.waitForFunction(seconds=>__streetGame.motion.elapsed>=seconds,targetSeconds);
   const capture=await page.evaluate(()=>{const r=__streetRender,m=__streetGame.motion;r.renderer.render(r.scene,r.camera);return {seconds:m.elapsed,png:r.renderer.domElement.toDataURL('image/png'),positions:__streetGame.npcs.map(n=>({id:n.id,x:n.x,y:n.y,pause:n.pause||0,arrested:!!n.arrested})),render:r.inspect(),lastSamples:m.samples.slice(-__streetGame.npcs.length)};});
   const path=resolve(output,view+'-motion-'+kind+'-'+targetSeconds.toFixed(2)+'.png');writeFileSync(path,Buffer.from(capture.png.split(',')[1],'base64'));capture.png=path;frames.push(capture);
  }
  await page.waitForFunction(()=>__streetGame.motion.finished);
  const trajectory=await page.evaluate(()=>{const m=__streetGame.motion;return{kind:m.kind,actorId:m.actor.id,duration:m.duration,elapsed:m.elapsed,events:m.events,blockedAttempts:m.blockedAttempts,firstBlocked:m.firstBlocked,samples:m.samples};});
  const actor=trajectory.samples.filter(row=>row.id===fixture.actorId),initial=fixture.initial.find(row=>row.id===fixture.actorId),checks=[],check=(id,pass,value)=>checks.push({id,verdict:pass?'PASS':'FAIL',value});
  check('gait-follows-accepted-displacement',actor.every(row=>Math.abs(row.phaseError)<1e-7),Math.max(...actor.map(row=>Math.abs(row.phaseError))));
  check('travel-heading',actor.every(row=>row.headingError===null||row.headingError<1e-7),Math.max(0,...actor.map(row=>row.headingError||0)));
  if(kind==='mixed-opposing'){const crossed=actor.find(row=>trajectory.samples.some(other=>other.id==='fixture-ordinary-opposing'&&other.seconds===row.seconds&&row.x>other.x));check('mixed-people-pass',!!crossed&&crossed.seconds<=5,crossed?.seconds??null);}
  if(kind==='corner-recovery'){check('prop-facade-actually-blocks-attempts',trajectory.blockedAttempts>0,trajectory.blockedAttempts);check('corner-makes-one-diameter-progress',Math.max(...actor.map(row=>Math.hypot(row.x-initial.x,row.y-initial.y)))>=26);}
  if(kind==='boxed-reopen'){
   const closed=actor.filter(row=>row.seconds<2),resume=actor.find(row=>row.seconds>=2&&row.travel>.001);check('closed-pocket-planted',closed.every(row=>row.travel===0&&row.phase===0));check('opened-pocket-resumes',!!resume&&resume.seconds<=2.8,resume?.seconds??null);check('opened-pocket-progress',Math.hypot(actor.at(-1).x-initial.x,actor.at(-1).y-initial.y)>=26);
  }
  if(kind==='speech-pause-resume'){
   const event=trajectory.events.find(event=>event.stage==='actual-rule-start'),paused=actor.filter(row=>event&&row.seconds>=event.seconds+.05&&row.pause>0),resumed=actor.find(row=>event&&row.seconds>event.seconds+.2&&row.pause<=0&&row.travel>.001);check('authored-rule-starts-pause',!!event&&paused.length>10,event);check('speech-pause-planted',paused.every(row=>row.travel===0&&Math.abs(row.phaseDelta)<1e-9));check('speech-pause-settles',paused.some(row=>Math.abs(row.swing)<.001));check('speech-resumes-travel',!!resumed,resumed?.seconds??null);
  }
  if(kind==='escorted-retained-pause')check('actual-escort-moves-with-pause',actor.some(row=>row.travel>.01&&row.arrested&&row.pause>0));
  record(view,'timed-motion-'+kind,'C4/P5','forced collision geometry/placement; exact production loop, actual RAF, installed native meshes and syncChar',{fixture,trajectory,frames,checks},checks.every(row=>row.verdict==='PASS'));
  await page.evaluate(()=>{const r=__streetRender,f=r.motionFixture;r.world.visible=f.worldVisible;r.fixedCamera=f.fixedCamera;r.scene.remove(f.group);f.group.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});r.motionWalls=[];r.motionFixture=null;__streetGame.motion.restore();Germany3D.sync();});
 }
}

async function finalIdentityChecks(page,view){
 await page.waitForFunction(()=>__streetGame.npcs.filter(n=>n.crowd).every(n=>__streetRender.npcMeshes.get(n)?.userData[n.spriteKind+'Sprite']));
 const value=await page.evaluate(expected=>{Germany3D.sync();const p=__streetGame,r=__streetRender,rows=p.npcs.filter(n=>n.crowd).map(n=>{const role=expected.find(e=>e.voiceId===n.voiceId),mesh=r.npcMeshes.get(n),profile=GermanySimulatorAudioText.productionVoices[n.voiceId];return {id:n.id,name:n.name,fullName:n.fullName,voiceId:n.voiceId,profileId:profile?.profileId,spriteKind:n.spriteKind,x:n.x,y:n.y,renderedSprite:!!mesh?.userData[n.spriteKind+'Sprite'],gender:role?.gender,pass:!!role&&role.fullName===n.fullName&&n.name.startsWith(n.fullName+' · ')&&n.id.startsWith(n.voiceId+'-')&&role.profileId===profile?.profileId&&role.gender===(n.spriteKind==='towelMan'?'male':n.spriteKind==='towelWoman'?'female':null)&&!!mesh?.userData[n.spriteKind+'Sprite']};});return {rows,count:rows.length,uniqueVoices:new Set(rows.map(n=>n.voiceId)).size,uniqueIds:new Set(rows.map(n=>n.id)).size};},audioContract.crowdRoles);
 record(view,'final-crowd-name-profile-sprite-parity','C4','actual unchanged spawn population, current cast/profile correspondence and installed native sprite identity',value,value.count===110&&value.uniqueVoices===9&&value.uniqueIds===110&&value.rows.every(row=>row.pass));
 const natural=await page.evaluate(()=>{Germany3D.sync();return __streetRender.inspect();}),frames=[];
 for(const adviser of natural.advisers){await page.evaluate(id=>{const p=__streetGame,n=p.npcs.find(n=>n.id===id);p.player.x=n.x;p.player.y=n.y+75;Germany3D.sync();},adviser.id);frames.push({id:adviser.id,path:await screenshot(page,view+'-final-natural-'+adviser.id)});}
 record(view,'final-natural-adviser-spawns','C4','authored adviser spawn positions unchanged; forced nearby camera/player framing, actual world meshes',{natural,frames},natural.advisers.length===3&&natural.advisers.every(n=>n.streetWisdom&&!n.streetCharacter));
}

async function finalAudioChecks(page,view){
 const normalize=path=>path?.replace(/^\.\//,''),rows=audioContract.rows;
 const begin=async(row,{voiceOn=true,mode='natural',cursor=null}={})=>page.evaluate(({row,voiceOn,mode,cursor})=>{
  const p=__streetGame;p.reset();p.clearRecordingCache();p.state.voiceOn=voiceOn;p.mode=mode;__streetAudioTrace.decoded.length=0;__streetAudioTrace.starts.length=0;__streetTtsCalls.length=0;
  const actor=p.npcs.find(n=>n.id===row.actorId);if(cursor!==null)actor.wisdomRuleCursor=cursor;p.player.x=actor.x;p.player.y=actor.y+50;return p.announceCurrentRule(actor,true);
 },{row,voiceOn,mode,cursor});
 const capture=()=>page.evaluate(()=>({snapshot:__streetGame.snapshot(),webAudio:{decoded:__streetAudioTrace.decoded.slice(),starts:__streetAudioTrace.starts.filter(row=>row.audioClass==='audio-text')},tts:__streetTtsCalls.slice()}));
 const exactCaption=(value,row)=>!value.snapshot.bark.hidden&&value.snapshot.bark.text===row.text&&value.snapshot.bark.speaker===row.displayName+' · REGEL DES AUGENBLICKS'&&value.tts.length===0;
 const waitStart=()=>page.waitForFunction(()=>__streetGame.events.some(e=>e.stage==='start'));
 for(const definition of audioContract.definitions){
  const deck=definition.ruleIndices.map(index=>rows.find(row=>row.ruleIndex===index)),firstEligible=deck.find(row=>row.kind==='recorded');
  for(let i=0;i<deck.length;i++){
   const row=deck[i];assert.equal(await begin(row,{cursor:i===0?0:null}),true);await waitStart();const value=await capture(),active=value.snapshot.active,starts=value.webAudio.starts;
   const owner=value.snapshot.advisers.find(n=>n.id===row.actorId),body=exactCaption(value,row)&&active?.voiceId===row.voiceId&&active?.text===row.text&&owner.cursor===i+1;
   const delivery=row.kind==='recorded'?active?.mode==='recorded'&&normalize(active.recording)===normalize(row.path)&&starts.length===1&&starts[0].mode==='recorded'&&starts[0].voiceId===row.voiceId&&starts[0].profileId===row.profileId&&normalize(starts[0].recording)===normalize(row.path)&&starts[0].receiptSha256===row.sha256&&starts[0].decoded?.sha256===row.sha256&&starts[0].decoded.duration>0&&value.webAudio.decoded.some(d=>d.sha256===row.sha256):active?.mode==='silent'&&!active.recording&&starts.length===0;
   record(view,'final-'+row.ruleId+'-'+row.kind,'AUDIO','forced nearby placement; actual authored deck, catalog and muted native decode/start or exact-caption hold',{expected:row,...value},body&&delivery);await screenshot(page,view+'-final-'+row.ruleId+'-'+row.kind);
  }
  assert.equal(await begin(deck[0],{voiceOn:false}),true);await waitStart();let value=await capture();record(view,'final-'+definition.id+'-deck-wrap','AUDIO','actual cursor after one complete production deck; voice-off caption',value,exactCaption(value,deck[0])&&value.snapshot.advisers.find(n=>n.id===definition.id).cursor===deck.length+1&&value.webAudio.starts.length===0);
  const cursor=definition.ruleIndices.indexOf(firstEligible.ruleIndex);
  assert.equal(await begin(firstEligible,{voiceOn:false,cursor}),true);await waitStart();value=await capture();record(view,'final-'+definition.id+'-voice-off','AUDIO','eligible authored take; actual voice-off path',value,exactCaption(value,firstEligible)&&value.snapshot.caption?.text===firstEligible.text&&!value.snapshot.active&&value.webAudio.starts.length===0);
  assert.equal(await begin(firstEligible,{mode:'missing',cursor}),true);await waitStart();value=await capture();record(view,'final-'+definition.id+'-failed-file','AUDIO','forced recording HTTP404; actual selected-profile caption fallback',value,exactCaption(value,firstEligible)&&value.snapshot.active?.mode==='silent'&&value.webAudio.starts.length===0);
  for(const reason of ['leave','arrest']){
   assert.equal(await begin(firstEligible,{mode:'deferred-real',cursor}),true);await page.waitForFunction(()=>!!__streetGame.decodePending);const pending=await capture();
   await page.evaluate(({actorId,reason})=>{const p=__streetGame,n=p.npcs.find(n=>n.id===actorId);if(reason==='leave')p.player.x=n.x+500;else n.arrested=true;p.releaseRealDecode();},{actorId:firstEligible.actorId,reason});
   await page.waitForFunction(()=>!__streetGame.snapshot().active);value=await capture();
   record(view,'final-'+definition.id+'-decoded-before-start-'+reason,'AUDIO','actual MP3/native decode; forced hold of decoded result, then production eligibility cancellation',{expected:firstEligible,pending,after:value},normalize(pending.snapshot.active?.recording)===normalize(firstEligible.path)&&pending.webAudio.decoded.some(d=>d.sha256===firstEligible.sha256)&&pending.webAudio.starts.length===0&&pending.snapshot.events.every(e=>e.stage!=='start')&&!value.snapshot.active&&value.snapshot.events.every(e=>e.stage!=='start')&&value.webAudio.starts.length===0&&value.tts.length===0);
  }
 }
 await page.evaluate(()=>__streetGame.stopSpeech());
}

async function pedestrianOwnershipCheck(page,view){
 const legacy=audioContract.legacyPedestrian,requests=[];
 page.on('request',request=>requests.push(request.url()));
 await page.evaluate(()=>{__streetAudioTrace.decoded.length=0;__streetAudioTrace.starts.length=0;__streetTtsCalls.length=0;__streetMediaPlays.length=0;});
 const fixture=await page.evaluate(()=>__streetGame.borrowedPedestrian());
 await page.waitForFunction(()=>__streetGame.events.some(row=>row.stage==='start'));
 const captured=await page.evaluate(()=>({snapshot:__streetGame.snapshot(),webAudio:{decoded:__streetAudioTrace.decoded.slice(),starts:__streetAudioTrace.starts.filter(row=>row.audioClass==='audio-text')},tts:__streetTtsCalls.slice(),media:__streetMediaPlays.slice()}));
 const start=captured.snapshot.events.find(row=>row.stage==='start'),request=captured.snapshot.events.find(row=>row.stage==='request'),role=audioContract.crowdRoles.find(row=>row.voiceId===fixture.actor.voiceId),path=legacy.recording.replace(/^\.\//,'/'),foreignHash=report.supportingSourceSha256[legacy.recording.replace(/^\.\//,'')];
 const receipt={fixture,requests,foreignHash,...captured,frame:await screenshot(page,view+'-named-pedestrian-legacy-rejection')};
 const caption=start?.bark&&!start.bark.hidden&&start.bark.text===legacy.text&&start.bark.speaker===fixture.actor.name;
 const ownership=fixture.accepted&&fixture.authored.text===legacy.text&&fixture.authored.recording===legacy.recording&&fixture.authored.voiceId==='thorsten'&&fixture.actor.voiceId==='crowd-hildegard-brotzeit'&&fixture.profile.profileId===role.profileId&&request?.voiceId===fixture.actor.voiceId&&!request.recording&&start?.active?.voiceId===fixture.actor.voiceId&&start.active.recording!==legacy.recording;
 const noForeign=!requests.some(url=>new URL(url).pathname===path)&&!captured.media.some(row=>new URL(row.src,base).pathname===path)&&!captured.webAudio.decoded.some(row=>row.sha256===foreignHash)&&!captured.webAudio.starts.some(row=>row.recording===legacy.recording||row.decoded?.sha256===foreignHash)&&captured.tts.every(row=>row.text===legacy.text&&row.volume===0);
 record(view,'named-pedestrian-authored-legacy-rejection','AUDIO/C4','forced actual legacy Thorsten row in native archetype pool; unchanged named ordinary actor and actual production producer/broker, ordinary muted fallback allowed',receipt,caption&&ownership&&noForeign);
 await page.evaluate(()=>__streetGame.stopSpeech());
}

async function cityFrames(page,view){
 await page.evaluate(()=>{__streetGame.state.started=true;__streetGame.state.modal=false;__streetGame.state.voiceOn=false;});
 for(const id of ['buergeramt','bundestag']){
  await page.evaluate(id=>{const r=__streetRender,b=r.bridge.buildings.find(b=>b.id===id);r.bridge.player.x=b.x+b.w/2;r.bridge.player.y=b.y+b.h+30;Germany3D.sync();Germany3D.prepareNearbyAssets();},id);
  await page.waitForFunction(()=>Germany3D.nearbyAssetsReady,null,{timeout:90000});
  const state=await page.evaluate(()=>{Germany3D.sync();return __streetRender.inspect();});
  state.worldCanvas=await worldCanvas(page,view+'-'+id+'-scale');
  record(view,id+'-scale','C5','actual loaded world, forced player placement; no scale mutation',state,state.buildings.some(b=>b.id===id&&b.loaded));await screenshot(page,view+'-'+id+'-scale');
 }
 const common=await page.evaluate(()=>{
  const r=__streetRender,p=__streetGame,b=r.bridge.buildings.find(b=>b.id==='buergeramt'),x=b.x+b.w/2,y=b.y+b.h+65,advisers=p.npcs.filter(n=>n.wisdomId),car=[...r.trafficCarMeshes.keys()][0];
  const saved={people:advisers.map(n=>({id:n.id,x:n.x,y:n.y})),player:{x:p.player.x,y:p.player.y},car:car?{id:car.id,x:car.x,y:car.y,angle:car.angle}:null};
  advisers.forEach((n,i)=>{n.x=x-35+i*50;n.y=y;n.pause=1;});p.player.x=x-80;p.player.y=y+30;if(car){car.x=x+150;car.y=y;car.angle=Math.PI/2;}
  const target=[r.X(x+35),.9,r.Z(y)-1],distance=12*Math.max(1,.8/r.camera.aspect);r.fixedCamera={position:[target[0],6,r.Z(y)+distance],target};Germany3D.sync();Germany3D.prepareNearbyAssets();return saved;
 });
 await page.waitForFunction(()=>Germany3D.nearbyAssetsReady,null,{timeout:90000});
 for(const fallback of [false,true]){
  const state=await page.evaluate(({fallback,carId})=>{const r=__streetRender,entry=[...r.trafficCarMeshes].find(([n])=>n.id===carId),slot=entry?.[1];if(slot){slot.fallback.visible=fallback||!slot.model;if(slot.model)slot.model.visible=!fallback;}Germany3D.sync();return r.inspect();},{fallback,carId:common.car?.id});
  state.worldCanvas=await worldCanvas(page,view+'-common-ground-'+(fallback?'fallback':'loaded'));
  record(view,'common-ground-'+(fallback?'fallback':'loaded')+'-car-door-people','C5','forced matched-distance placement/camera; actual unscaled meshes and audited door',state,state.advisers.length===3&&!!state.door&&state.cars.some(c=>c.id===common.car?.id&&(fallback?c.fallback:c.loaded)));
  await screenshot(page,view+'-common-ground-'+(fallback?'fallback':'loaded'));
 }
 await page.evaluate(saved=>{const r=__streetRender,p=__streetGame;r.fixedCamera=null;for(const row of saved.people){const n=p.npcs.find(n=>n.id===row.id);n.x=row.x;n.y=row.y;n.pause=0;}Object.assign(p.player,saved.player);if(saved.car){const entry=[...r.trafficCarMeshes].find(([n])=>n.id===saved.car.id);Object.assign(entry[0],saved.car);entry[1].fallback.visible=!entry[1].model;if(entry[1].model)entry[1].model.visible=true;}Germany3D.sync();},common);
 for(const fallback of [false,true]){
  const onset=await wallTransition(page,{fallback,obstructed:true});
  await page.waitForFunction(()=>Germany3D.buildingVisibility.find(b=>b.id==='buergeramt').opacity<=.04);
  let state=await page.evaluate(()=>Germany3D.buildingVisibility.find(b=>b.id==='buergeramt'));
  record(view,(fallback?'fallback':'loaded')+'-obstructed','C1','actual world renderer/RAF timing; forced building representation and player placement',{state,onset},state.obstructing&&state.opacity<=.04&&onset.targetTimingVerdict==='PASS');await screenshot(page,view+'-'+(fallback?'fallback':'loaded')+'-obstructed');
  const restoration=await wallTransition(page,{fallback,obstructed:false});
  await page.waitForFunction(()=>Germany3D.buildingVisibility.find(b=>b.id==='buergeramt').opacity>=.99);
  state=await page.evaluate(()=>Germany3D.buildingVisibility.find(b=>b.id==='buergeramt'));
  record(view,(fallback?'fallback':'loaded')+'-restored','C3','actual world renderer/RAF timing; forced clear player placement',{state,restoration},!state.obstructing&&state.opacity>=.99&&restoration.targetTimingVerdict==='PASS');await screenshot(page,view+'-'+(fallback?'fallback':'loaded')+'-restored');
  for(const side of ['facade','side']){
   await page.evaluate(side=>{const r=__streetRender,b=r.bridge.buildings.find(b=>b.id==='buergeramt');r.bridge.player.x=side==='side'?b.x+b.w+20:b.x+b.w/2;r.bridge.player.y=side==='side'?b.y+b.h*.6:b.y+b.h+20;Germany3D.sync();},side);
   await page.waitForFunction(()=>{const s=Germany3D.buildingVisibility.find(b=>b.id==='buergeramt');return !s.obstructing&&s.opacity>=.99;});
   state=await page.evaluate(()=>Germany3D.buildingVisibility.find(b=>b.id==='buergeramt'));
   record(view,(fallback?'fallback':'loaded')+'-clear-near-'+side,'C2','actual world renderer; forced proximity-negative placement',state,!state.obstructing&&state.opacity>=.99);await screenshot(page,view+'-'+(fallback?'fallback':'loaded')+'-clear-near-'+side);
  }
 }
 await page.evaluate(()=>{const r=__streetRender,s=r.buildingSlots.find(s=>s.building.id==='buergeramt');s.fallback.visible=!s.model;if(s.model)s.model.visible=true;});
}

// Observe the actual render loop. The simulated-time 30/60 FPS fixtures above
// stay separate from these wall-clock traces; a slow test host is visible here.
async function wallTransition(page,fixture){
 return page.evaluate(async({fallback,obstructed})=>{
  const r=__streetRender,s=r.buildingSlots.find(s=>s.building.id==='buergeramt'),b=s.building;
  s.fallback.visible=fallback;if(s.model)s.model.visible=!fallback;
  r.bridge.player.x=b.x+b.w/2;r.bridge.player.y=obstructed?b.y-24:b.y+b.h+30;
  const start=performance.now(),samples=[],duration=obstructed?600:1100;
  Germany3D.sync();
  do{await new Promise(requestAnimationFrame);const state=Germany3D.buildingVisibility.find(row=>row.id===b.id);samples.push({milliseconds:performance.now()-start,opacity:state.opacity,obstructing:state.obstructing});}while(samples.at(-1).milliseconds<duration);
  const reached=samples.find(row=>obstructed?row.opacity<=.04:row.opacity>=.99);
  const targetMilliseconds=obstructed?500:1000,captureToleranceMilliseconds=50;
  return {durationMilliseconds:samples.at(-1).milliseconds,targetMilliseconds,captureToleranceMilliseconds,targetTimingVerdict:reached&&reached.milliseconds<=targetMilliseconds+captureToleranceMilliseconds?'PASS':'FAIL',firstTargetMilliseconds:reached?.milliseconds??null,maxFrameMilliseconds:Math.max(...samples.map((row,i)=>row.milliseconds-(samples[i-1]?.milliseconds||0))),samples};
 },fixture);
}

try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--mute-audio','--autoplay-policy=no-user-gesture-required',...(process.env.PLAYTEST_GPU==='hardware'?[]:['--use-gl=angle','--use-angle=swiftshader'])]});
 for(const [view,viewport] of (pedestrianOwnership?[['desktop',{width:1280,height:800}]]:[['desktop',{width:1280,height:800}],['android-portrait-emulated',{width:390,height:844}],['android-landscape-emulated',{width:844,height:390}]])){
  const {context,page,errors}=await open(view,viewport,'/index.html');
  await page.evaluate(()=>document.getElementById('intro').classList.add('hidden'));
  if(pedestrianOwnership){await pedestrianOwnershipCheck(page,view);record(view,'pedestrian-ownership-console','AUDIO','actual browser pageerror events',errors,errors.length===0);await context.close();continue;}
  if(finalAudio){await finalIdentityChecks(page,view);await finalAudioChecks(page,view);record(view,'final-audio-console','AUDIO','actual browser pageerror events',errors,errors.length===0);await context.close();continue;}
  if(cityOnly){await cityFrames(page,view);record(view,'console','X1','actual browser pageerror events',errors,errors.length===0);await context.close();continue;}
  const natural=await page.evaluate(()=>{Germany3D.sync();return __streetRender.inspect();});record(view,'natural-adviser-spawns','C4/C5','unmodified production spawn positions, simulation frozen before start',natural,natural.advisers.length===3&&natural.advisers.every(n=>n.streetWisdom&&!n.streetCharacter));
  for(const id of natural.advisers.map(n=>n.id)){await page.evaluate(id=>{const n=__streetGame.npcs.find(n=>n.id===id);__streetGame.player.x=n.x;__streetGame.player.y=n.y+75;Germany3D.sync();},id);await screenshot(page,view+'-spawn-'+id);}
  const rays=await rayFixtures(page);record(view,'production-ray-and-fade-fixtures','C1/C2/C3','forced real-Three geometry; production functions in actual browser',rays,rays.checks.every(c=>c.verdict==='PASS'));
  const meshes=await meshFrames(page);for(const frame of meshes.frames){const {png,pixelShaInput}=frame;const path=resolve(output,view+'-'+frame.label+'.png');writeFileSync(path,Buffer.from(png.split(',')[1],'base64'));frame.png=path;frame.pixelSha256=digest(Buffer.from(pixelShaInput));delete frame.pixelShaInput;}
  record(view,'actual-people-props-depth-and-pose','C4/C5','forced isolated clones of actual installed meshes/materials, existing world renderer',meshes,meshes.checks.every(c=>c.verdict==='PASS'));
  await cityFrames(page,view);await movementFrames(page,view);await encounters(page,view);record(view,'console','X1','actual browser pageerror events',errors,errors.length===0);await context.close();
  const opt=await open(view,viewport,'/index.html?streetCharacters=1');await opt.page.evaluate(()=>{document.getElementById('intro').classList.add('hidden');const n=__streetGame.npcs.find(n=>n.wisdomId);__streetGame.player.x=n.x;__streetGame.player.y=n.y+75;Germany3D.sync();});await opt.page.waitForTimeout(1000);
  await opt.page.waitForFunction(()=>!!Germany3D.inspectAssets().streetCharacters);
  const isolation=await opt.page.evaluate(()=>{Germany3D.sync();return {...__streetRender.inspect(),optIn:Germany3D.inspectAssets().streetCharacters};});record(view,'opt-in-template-isolation','C4','actual optional module load, forced nearby player',isolation,isolation.advisers.length===3&&isolation.advisers.every(n=>n.streetWisdom&&!n.streetCharacter)&&!!isolation.optIn);await screenshot(opt.page,view+'-opt-in-isolation');record(view,'opt-in-console','X1','actual browser pageerror events',opt.errors,opt.errors.length===0);await opt.context.close();
 }
 if(!cityOnly&&!finalAudio&&!pedestrianOwnership){const smoke=await open('desktop',{width:1280,height:800},'/3d.html');record('desktop','3d-smoke','X1','actual diagnostic entry; no adviser population claim',await smoke.page.evaluate(()=>({ready:Germany3D.ready,inspection:Germany3D.inspectAssets()})),smoke.errors.length===0);await screenshot(smoke.page,'desktop-3d-smoke');await smoke.context.close();}
}catch(error){report.fatal={message:error.message,stack:error.stack};console.error(error);process.exitCode=1;}
finally{report.sourceAfter=hashes();report.sourceUnchanged=JSON.stringify(report.sourceAfter)===JSON.stringify(before);report.supportingSourceAfterSha256=supportingHashes();report.supportingUnchanged=JSON.stringify(report.supportingSourceAfterSha256)===JSON.stringify(report.supportingSourceSha256);if(!report.sourceUnchanged||(finalAudio||pedestrianOwnership)&&!report.supportingUnchanged)process.exitCode=1;if(report.cases.some(row=>row.verdict==='FAIL'))process.exitCode=1;report.runState=process.exitCode?'failed':'complete';writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();await new Promise(done=>server.close(done));console.log(JSON.stringify({report:resolve(output,'report.json'),cases:report.cases.length,sourceUnchanged:report.sourceUnchanged,supportingUnchanged:report.supportingUnchanged,browserPixelsNeedReview:true}));}
