const MANIFEST_URL='./assets/characters/street/manifest.json?v=20261016-street-atlas-pilot';
const playbackByActor=new WeakMap(),texturesByThree=new WeakMap(),imagesByConstructor=new WeakMap(),fallbackByHost=new WeakMap();
const rigDefinitions=new Map(),rigForwards={down:[0,0,1],right:[1,0,0],up:[0,0,-1],left:[-1,0,0]};
const rigCameraAxes=['right','up','forward'];
const RIG_BUFFER_LIMITS=Object.freeze({vertices:256,triangles:128});
let characters={},aliases=new Map(),manifestPromise=null;
let rigModulePromise=null;

function validateClip(clip,slots){
  if(!clip||!Number.isInteger(clip.offset)||clip.offset<0||!Number.isInteger(clip.count)||clip.count<1||clip.offset+clip.count>slots)throw new RangeError('Invalid street animation clip');
  if(clip.seconds!==undefined&&(!Number.isFinite(clip.seconds)||clip.seconds<=0))throw new RangeError('Invalid street clip duration');
}

function validateImage(image){
  if(!image||!/^\.\/assets\/characters\/street\/[a-z0-9_/-]+\.webp$/i.test(image.file)||image.file.includes('..'))throw new TypeError('Invalid street image path');
  if(typeof image.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(image.sha256))throw new TypeError('Invalid street image hash');
  if(!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.width>4096||image.height>4096)throw new RangeError('Invalid street image dimensions');
}

function validateMotionRig(rig){
  if(!rig||!/^\.\/assets\/characters\/street\/[a-z0-9_/-]+\.json$/i.test(rig.file)||rig.file.includes('..'))throw new TypeError('Invalid street rig path');
  if(typeof rig.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(rig.sha256))throw new TypeError('Invalid street rig hash');
  if(rig.contactPlayback!==undefined&&(!rig.contactPlayback||rig.contactPlayback.schemaVersion!==1||Object.keys(rig.contactPlayback).length!==1))throw new TypeError('Invalid accepted-step contact opt-in');
  for(const variant of ['desktop','mobile']){
    const atlas=rig.variants?.[variant];validateImage(atlas);
    if(atlas.width>2048||atlas.height>2048||atlas.width*atlas.height*4>16777216)throw new RangeError('Street rig atlas exceeds 2048 / 16 MiB');
  }
}

function validateAtlasMotion(person){
  const m=person.atlasMotion;
  if(!m||m.schemaVersion!==1||person.motionRig||!person.standing||!(person.strideDistance>0))throw new TypeError('Invalid street atlas motion capability');
  const cell=p=>p&&Number.isInteger(p.row)&&p.row>=0&&p.row<person.grid[1]&&Number.isInteger(p.col)&&p.col>=0&&p.col<person.grid[0];
  const duration=ms=>Number.isFinite(ms)&&ms>0&&ms<=1000;
  for(const dir of Object.keys(rigForwards)){
    const w=m.walks?.[dir],b=m.bridges?.[dir];
    if(!w||!cell({row:w.row,col:0})||!Number.isInteger(w.frames)||w.frames<1||w.frames>person.grid[0]||!duration(w.frame_ms))throw new RangeError('Invalid atlas walk');
    if(!b||!duration(b.frame_ms))throw new RangeError('Invalid atlas bridge');
    for(const key of ['stop_cols','start_cols'])if(!Array.isArray(b[key])||!b[key].length||b[key].length>16||!Array.from(b[key],col=>cell({row:b.row,col})).every(Boolean))throw new RangeError('Invalid atlas bridge cells');
    if(person.clips[dir].offset!==w.row*person.grid[0]||person.clips[dir].count!==w.frames)throw new RangeError('Atlas walk clip mismatch');
    for(const to of Object.keys(rigForwards))if(to!==dir){
      const frames=m.transitions?.[dir+'-to-'+to]?.frames,end=m.bridges?.[to];
      if(!Array.isArray(frames)||frames.length<1||frames.length>64||!Array.from(frames,p=>cell(p)&&duration(p.ms)).every(Boolean))throw new RangeError('Invalid atlas transition');
      if(!end||frames.length<=b.stop_cols.length+end.start_cols.length)throw new RangeError('Atlas transition lacks turn cells');
      const matches=(p,row,col,ms)=>p?.row===row&&p?.col===col&&p?.ms===ms;
      if(!b.stop_cols.every((col,i)=>matches(frames[i],b.row,col,b.frame_ms))||!end.start_cols.every((col,i)=>matches(frames[frames.length-end.start_cols.length+i],end.row,col,end.frame_ms)))throw new RangeError('Atlas transition bridge mismatch');
    }
  }
  if(!cell(m.neutral)||m.neutral.row!==m.bridges.down.row||m.neutral.col!==m.bridges.down.stop_cols.at(-1)||person.clips.idle.offset!==m.neutral.row*person.grid[0]+m.neutral.col||person.clips.idle.count!==1)throw new RangeError('Atlas neutral mismatch');
  if(m.settles!==undefined){
    if(!m.settles||typeof m.settles!=='object'||Array.isArray(m.settles))throw new TypeError('Invalid atlas phase settles');
    const walkCell=p=>Object.values(m.walks).some(w=>p.row===w.row&&p.col<w.frames);
    for(const [dir,phases] of Object.entries(m.settles)){
      if(!Object.hasOwn(rigForwards,dir)||!phases||typeof phases!=='object'||Array.isArray(phases))throw new TypeError('Invalid atlas settle direction');
      for(const [phase,settle] of Object.entries(phases)){
        if(!/^(0|[1-9]\d*)$/.test(phase)||!Number.isSafeInteger(Number(phase))||Number(phase)>=m.walks[dir].frames)throw new RangeError('Invalid atlas settle phase');
        const frames=settle?.frames,bridge=m.bridges[dir];
        if(!Array.isArray(frames)||frames.length<2||frames.length>16||!Array.from(frames,p=>cell(p)&&duration(p.ms)&&!walkCell(p)).every(Boolean))throw new RangeError('Invalid atlas settle cells');
        const end=frames.at(-1);
        if(end.row!==bridge.row||end.col!==bridge.stop_cols.at(-1))throw new RangeError('Atlas settle must end at facing neutral');
      }
    }
  }
  if(m.cycle_distance!==undefined)throw new TypeError('Atlas cycle is owned by strideDistance');
}

function validateOcclusionSamples(person){
  const samples=person.occlusionSamples;
  if(samples===undefined)return;
  if(!Array.isArray(samples)||samples.length<1||samples.length>16)throw new RangeError('Invalid street occlusion sample count');
  for(const sample of samples){
    if(!Array.isArray(sample)||sample.length!==2||![0,1].every(i=>Object.hasOwn(sample,i)&&Number.isFinite(sample[i])&&sample[i]>=0&&sample[i]<person.cell[i]))throw new RangeError('Invalid street occlusion sample pixel');
  }
}

function validateStandingOnly(voiceId,person){
  if(typeof voiceId!=='string'||!voiceId.trim()||typeof person.id!=='string'||!person.id.trim())throw new TypeError('Standing-only street identity required');
  if(!Array.isArray(person.cell)||person.cell.length!==2||![0,1].every(i=>Object.hasOwn(person.cell,i)&&Number.isInteger(person.cell[i])&&person.cell[i]>0&&person.cell[i]<=512))throw new RangeError('Invalid standing-only street cell');
  if(!Array.isArray(person.pivot)||person.pivot.length!==2||![0,1].every(i=>Object.hasOwn(person.pivot,i)&&Number.isFinite(person.pivot[i])&&person.pivot[i]>=0&&person.pivot[i]<=person.cell[i]))throw new RangeError('Invalid standing-only street pivot');
  if(!Number.isFinite(person.figureHeight)||person.figureHeight<=0||person.figureHeight>person.cell[1]||!Number.isFinite(person.figureWorldHeight)||person.figureWorldHeight<=0)throw new RangeError('Invalid standing-only street figure scale');
  validateImage(person.standing);
  if(person.standing.width!==person.cell[0]||person.standing.height!==person.cell[1])throw new RangeError('Standing-only street paint must match its cell');
  for(const key of ['grid','clips','variants','motionRig','strideDistance','speech','atlasMotion'])if(person[key]!==undefined)throw new TypeError('Standing-only street record cannot declare motion metadata: '+key);
}

export function registerStreetCharacterManifest(manifest){
  if(manifest?.schemaVersion!==1||!manifest.characters||Array.isArray(manifest.characters))throw new TypeError('Invalid street character manifest');
  const entries=Object.entries(manifest.characters),nextAliases=new Map();
  if(entries.length>64)throw new RangeError('Street cast exceeds manifest bound');
  for(const [voiceId,person] of entries){
    if(person?.standingOnly!==undefined&&typeof person.standingOnly!=='boolean')throw new TypeError('Street standingOnly capability must be boolean');
    if(person?.standingOnly===true)validateStandingOnly(voiceId,person);
    else{
    if(!person||!Array.isArray(person.grid)||person.grid.length!==2||person.grid.some(n=>!Number.isInteger(n)||n<1||n>64))throw new RangeError('Invalid street atlas grid');
    if(!Array.isArray(person.cell)||person.cell.length!==2||person.cell.some(n=>!Number.isInteger(n)||n<1))throw new RangeError('Invalid street atlas cell');
    if(!Array.isArray(person.pivot)||person.pivot.length!==2||person.pivot.some((n,i)=>!Number.isFinite(n)||n<0||n>person.cell[i]))throw new RangeError('Invalid street ground pivot');
    if(!(person.figureHeight>0)||!Number.isFinite(person.figureHeight)||!(person.figureWorldHeight>0)||!Number.isFinite(person.figureWorldHeight))throw new RangeError('Invalid street figure scale');
    if(person.strideDistance!==undefined&&(!Number.isFinite(person.strideDistance)||person.strideDistance<=0))throw new RangeError('Invalid street gait distance');
    const slots=person.grid[0]*person.grid[1];
    for(const name of ['down','right','up','left','idle'])if(!person.clips?.[name])throw new TypeError(`Missing street clip ${name}`);
    for(const clip of Object.values(person.clips))validateClip(clip,slots);
    for(const clip of Object.values(person.speech?.clips||{}))validateClip(clip,slots);
    if(person.motionRig!==undefined){
      validateMotionRig(person.motionRig);
      if(!person.standing||!person.strideDistance)throw new TypeError('Street rig requires standing and stride metadata');
    }else for(const variant of ['desktop','mobile']){
      const atlas=person.variants?.[variant];
      validateImage(atlas);
      if(atlas.width%person.grid[0]||atlas.height%person.grid[1])throw new RangeError('Invalid street atlas dimensions');
      if(atlas.width/person.grid[0]/person.cell[0]!==atlas.height/person.grid[1]/person.cell[1])throw new RangeError('Street atlas cell aspect does not match geometry');
    }
    if(person.standing!==undefined){
      validateImage(person.standing);
      if(person.standing.width!==person.cell[0]||person.standing.height!==person.cell[1])throw new RangeError('Street standing image must match the original cell');
    }
    }
    if(person.atlasMotion!==undefined)validateAtlasMotion(person);
    validateOcclusionSamples(person);
    for(const alias of [voiceId,person.id,person.actorId,...(person.aliases||[])].filter(Boolean)){
      if(typeof alias!=='string'||nextAliases.has(alias)&&nextAliases.get(alias)!==voiceId)throw new TypeError('Ambiguous street identity alias');
      nextAliases.set(alias,voiceId);
    }
  }
  characters=JSON.parse(JSON.stringify(manifest.characters));aliases=nextAliases;
  return characters;
}

export function resolveStreetCharacter(actor){
  if(!actor)return null;
  const ids=[actor.quizCharacterId,actor.streetCharacterId,actor.voiceId,actor.wisdomId,actor.id];
  for(const id of ids)if(aliases.has(id))return aliases.get(id);
  const quiz=globalThis.GermanySimulatorQuizCharacters?.characters||globalThis.window?.GermanySimulatorQuizCharacters?.characters||[];
  const advisers=globalThis.StreetWisdom?.definitions||globalThis.window?.StreetWisdom?.definitions||[];
  for(const person of [...quiz,...advisers])if(ids.includes(person.id)||ids.includes(person.voiceId))return person.voiceId;
  return null;
}

function playback(actor){
  if(!playbackByActor.has(actor))playbackByActor.set(actor,{distance:0,age:0,direction:'down',current:null,pending:null,pose:null,cueToken:null,retiredCues:[]});
  return playbackByActor.get(actor);
}

function atlasNeutral(person){
  const p=person.atlasMotion.neutral;
  return {clip:'neutral',frame:p.col,slot:p.row*person.grid[0]+p.col,direction:'down',moving:false,holdPosition:false,visible:true,mouthOpen:0};
}

function admitAtlasMotion(actor,person,owner){
  const animation=globalThis.TouristAnimations;
  if(!animation?.start||!animation?.stop)throw new Error('Atlas movement controller unavailable');
  const state=playback(actor),p=person.atlasMotion.neutral;
  const motion={owner,person,manifest:{...person.atlasMotion,cycle_distance:person.strideDistance},
    controller:{touristFacing:'down',touristRequested:'down',spriteRow:p.row,spriteFrame:p.col,gaitDistance:0},settled:true};
  state.atlasMotion=motion;state.pose=atlasNeutral(person);state.acceptedStepDistance=0;state.acceptedSegmentCount=0;
  state.contactRootWorld=null;state.simulationHeld=null;
  return {release(){if(state.atlasMotion===motion){state.atlasMotion=null;state.acceptedStepDistance=0;state.pose=atlasNeutral(person)}}};
}

function atlasPose(state,speech={}){
  const a=state.atlasMotion,n=a.controller;
  return state.pose={...speech,clip:n.touristTurn?.kind||(n.touristTurn?'turn':a.settled?'neutral':'walk'),
    frame:n.spriteFrame,slot:n.spriteRow*a.person.grid[0]+n.spriteFrame,direction:n.touristFacing,
    moving:!a.settled&&!n.touristTurn,mouthOpen:0,holdPosition:!!n.touristTurn,visible:true};
}

export function requestStreetSimulationMove(actor,dx,dy){
  const state=playbackByActor.get(actor),a=state?.atlasMotion;
  if(!a||state.simulationHeld||!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<=.0001)return false;
  const n=a.controller,animation=globalThis.TouristAnimations;
  if(n.touristTurn)animation.request(n,dx,dy,a.manifest,{planted:true});
  else if(a.settled){animation.start(n,dx,dy,a.manifest);a.settled=false}
  else animation.request(n,dx,dy,a.manifest,{planted:true});
  atlasPose(state,state.pose);
  return !!n.touristTurn;
}

function advanceAtlasMotion(state,person,distance,dt,options,speech){
  const a=state.atlasMotion;
  if(!a||state.simulationHeld)return state.pose={...atlasNeutral(person),...speech,mouthOpen:0};
  if(options.paused)return atlasPose(state,speech);
  const n=a.controller,animation=globalThis.TouristAnimations;
  if(!n.touristTurn&&!(distance>.0001)&&!a.settled)animation.stop(n,a.manifest);
  const active=n.touristTurn;
  animation.advance(n,distance,dt,a.manifest,person.strideDistance);
  if(active&&!n.touristTurn)a.settled=active.kind==='stop';
  return atlasPose(state,speech);
}

function acceptedContactRoot(state,options){
  const value=options.rootWorld;
  const valid=Array.isArray(value)&&value.length===3&&[0,1,2].every(i=>Object.hasOwn(value,i)&&Number.isFinite(value[i]));
  state.contactRootWorld=valid?value.slice():null;
}

function projectContactPose(state,pose){
  if(!state.contactBinding||!pose?.rigPose)return pose;
  const result=state.contactResult;
  if(!result?.ok){
    const {contacts,...rest}=pose.rigPose;
    pose.rigPose={...rest,contactFailure:result?.code||'CONTACT_RESULT_UNAVAILABLE'};
    return pose;
  }
  const {contactFailure,...rest}=pose.rigPose;
  pose.rigPose={...rest,contacts:result.contacts,direction:result.physicalViewDirection,
    forwardWorld:result.contacts.forwardWorld,contactSourcePhase:result.contactSourcePhase};
  return pose;
}

function advanceContacts(state,pose,acceptedDistance2d,dt,paused){
  const binding=state.contactBinding;
  if(!binding)return pose;
  if(state.simulationHeld){state.contactResult={ok:false,contacts:null,code:state.simulationHeld};return projectContactPose(state,pose)}
  if(state.simulationUpdating&&state.acceptedSegmentCount>0)return projectContactPose(state,pose);
  if(binding.retirementRequired){
    state.contactResult={ok:false,contacts:null,code:'CONTACT_DEFINITION_RETIREMENT_REQUIRED'};
    return projectContactPose(state,pose);
  }
  state.contactResult=binding.module.advanceStreetContactPlayback(state,binding.definition,{
    rootWorld:state.contactRootWorld,totalDistance2d:state.distance,acceptedDistance2d,dt,paused});
  return projectContactPose(state,pose);
}

function stageContacts(resources,person,id,actor){
  const state=playback(actor);
  if(resources.definition.contactPlayback!==undefined&&(!state.simulationOwned||state.simulationHeld))throw new Error('Accepted-step simulation admission unavailable or source handover required');
  if(resources.definition.contactPlayback===undefined){
    if(state.contactBinding)throw new Error('Street contact definition retirement required before downgrade');
    return null;
  }
  const key=`${id}:${person.motionRig.file}:${person.motionRig.sha256}`;
  let binding=state.contactBinding,result,temporary=null,committed=false,released=false;
  if(binding){
    if(binding.retirementRequired)throw new Error('Street contact definition retirement required');
    if(binding.key!==key||binding.definition.id!==resources.definition.id||binding.definition.sourceSha256!==resources.definition.sourceSha256)throw new Error('Street contact definition retirement required');
    result=state.contactResult;
  }else{
    if(!state.contactRootWorld)throw new Error('Street contact motion requires accepted options.rootWorld before admission');
    temporary={distance:state.distance};
    result=resources.module.initializeStreetContactPlayback(temporary,resources.definition,{
      rootWorld:state.contactRootWorld,totalDistance2d:state.distance,initialPhysicalForwardWorld:[0,0,1]});
    binding={key,module:resources.module,definition:resources.definition,visualReferences:0};
  }
  if(!result?.ok)throw new Error(`Street contact admission failed: ${result?.code||'missing result'}`);
  return {
    isInitialAdmission:temporary!==null,
    read(){
      if(released)throw new Error('Street contact visual lease released');
      const current=committed?state.contactResult:result;
      if(!current?.ok)throw new Error(`Street contact motion failed: ${current?.code||'missing result'}`);
      return current;
    },
    commit(){
      if(released||committed)return;
      if(temporary){
        if(state.contactBinding)throw new Error('Street contact staged admission superseded');
        state.streetContactPlayback=temporary.streetContactPlayback;
        state.contactBinding=binding;state.contactResult=result;
      }else if(state.contactBinding!==binding)throw new Error('Street contact binding changed');
      binding.visualReferences++;committed=true;projectContactPose(state,state.pose);
    },
    release(){if(released)return;released=true;if(committed)binding.visualReferences--}
  };
}

function contactInspection(actor){
  const state=playbackByActor.get(actor),binding=state?.contactBinding,result=state?.contactResult;
  return binding?{visualReferences:binding.visualReferences,key:binding.key,ok:result?.ok===true,
    code:result?.code||null,admissionDistance2d:result?.admissionDistance2d,
    nominalDistance2d:state.distance,contactSourcePhase:result?.contactSourcePhase,
    contactTotalPhase:result?.contactTotalPhase,physicalViewDirection:result?.physicalViewDirection}:null;
}

export function acceptsStreetSimulation(actor){
  const person=characters[resolveStreetCharacter(actor)];
  return person?.standingOnly!==true&&(person?.atlasMotion?.schemaVersion===1||person?.motionRig?.contactPlayback?.schemaVersion===1);
}

export function inspectStreetSimulation(actor){
  const state=playbackByActor.get(actor);
  return {owned:state?.simulationOwned===true,generation:state?.simulationGeneration||0,
    held:state?.simulationHeld||null,distance:state?.distance||0,
    pendingAcceptedDistance:state?.acceptedStepDistance||0,acceptedSegments:state?.acceptedSegmentCount||0,
    contact:contactInspection(actor),atlasMotion:state?.atlasMotion?{ready:true,slot:state.pose?.slot,phase:state.atlasMotion.controller.spriteFrame,
      facing:state.atlasMotion.controller.touristFacing,requested:state.atlasMotion.controller.touristRequested,
      gaitDistance:state.atlasMotion.controller.gaitDistance,plan:state.atlasMotion.controller.touristTurn?.kind||(state.atlasMotion.controller.touristTurn?'turn':null),
      planIndex:state.atlasMotion.controller.touristTurn?.index??null,settled:state.atlasMotion.settled}:null};
}

export function invalidateStreetSimulation(actor,reason='EXPLICIT_DISCONTINUITY'){
  if(!acceptsStreetSimulation(actor))return false;
  const state=playback(actor);state.simulationOwned=true;
  if(state.simulationHeld)return false;
  state.simulationGeneration=(state.simulationGeneration||0)+1;
  state.simulationHeld=String(reason).slice(0,160);state.acceptedStepDistance=0;state.acceptedSegmentCount=0;
  if(state.contactBinding)state.contactBinding.retirementRequired=true;
  state.contactBinding=null;delete state.streetContactPlayback;
  state.contactResult={ok:false,contacts:null,code:'SOURCE_HANDOVER_REQUIRED',reason:state.simulationHeld};
  if(state.pose?.rigPose){const {contacts,...rest}=state.pose.rigPose;state.pose.rigPose={...rest,contactFailure:'SOURCE_HANDOVER_REQUIRED'}}
  return true;
}

export function readmitStreetSimulationGeneration(actor,{rootWorld,standingSha256}){
  if(!acceptsStreetSimulation(actor)||!validRoot(rootWorld))return false;
  const person=characters[resolveStreetCharacter(actor)],state=playback(actor);
  if(!state.simulationHeld||standingSha256!==person.standing?.sha256)return false;
  state.contactRootWorld=rootWorld.slice();state.simulationHeld=null;
  state.contactResult=null;state.rigSettle=1;state.direction='down';state.rigForwardWorld=[0,0,1];
  if(person.atlasMotion&&state.atlasMotion){
    const p=person.atlasMotion.neutral;
    state.atlasMotion.controller={touristFacing:'down',touristRequested:'down',spriteRow:p.row,spriteFrame:p.col,gaitDistance:0};
    state.atlasMotion.settled=true;state.pose=atlasNeutral(person);
  }
  return true;
}

function validRoot(root){return Array.isArray(root)&&root.length===3&&[0,1,2].every(i=>Object.hasOwn(root,i)&&Number.isFinite(root[i]))}
function sameRoot(a,b){return validRoot(a)&&validRoot(b)&&a.every((v,i)=>Math.abs(v-b[i])<=1e-8)}
function rejectStreetSegment(actor,reason){invalidateStreetSimulation(actor,reason);return false}

export function acceptStreetSimulationSegment(actor,{fromRoot,toRoot,distance2d,dx,dy}){
  if(!acceptsStreetSimulation(actor))return false;
  const state=playback(actor);state.simulationOwned=true;
  if(state.simulationHeld)return false;
  const id=resolveStreetCharacter(actor),person=characters[id];
  if(state.contactBinding&&state.contactBinding.key!==`${id}:${person.motionRig.file}:${person.motionRig.sha256}`)return rejectStreetSegment(actor,'CONTACT_DEFINITION_RETIREMENT_REQUIRED');
  if(!validRoot(fromRoot)||!validRoot(toRoot)||!Number.isFinite(distance2d)||distance2d<=0||!Number.isFinite(dx)||!Number.isFinite(dy))return rejectStreetSegment(actor,'INVALID_ACCEPTED_SEGMENT');
  if(state.contactRootWorld&&!sameRoot(state.contactRootWorld,fromRoot))return rejectStreetSegment(actor,'UNOBSERVED_COORDINATE_DISCONTINUITY');
  const measured=Math.hypot(toRoot[0]-fromRoot[0],toRoot[2]-fromRoot[2]);
  if(Math.abs(Math.hypot(dx,dy)-distance2d)>1e-8||measured<=0||Math.abs(toRoot[1]-fromRoot[1])>1e-8)return rejectStreetSegment(actor,'ACCEPTED_ROOT_OR_ELEVATION_MISMATCH');
  state.distance+=distance2d;state.acceptedStepDistance=(state.acceptedStepDistance||0)+distance2d;
  state.acceptedSegmentCount=(state.acceptedSegmentCount||0)+1;
  state.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
  state.rigForwardWorld=[dx/distance2d,0,dy/distance2d];state.contactRootWorld=toRoot.slice();
  if(state.contactBinding){
    state.contactResult=state.contactBinding.module.advanceStreetContactPlayback(state,state.contactBinding.definition,
      {rootWorld:toRoot,totalDistance2d:state.distance,acceptedDistance2d:distance2d,dt:0,paused:false});
    if(!state.contactResult.ok)invalidateStreetSimulation(actor,state.contactResult.code);
    else projectContactPose(state,state.pose);
  }
  return !state.simulationHeld;
}

export function tickStreetSimulation(actor,dt,options){
  if(!acceptsStreetSimulation(actor))return false;
  const state=playback(actor);state.simulationOwned=true;
  if(!state.simulationHeld&&(!validRoot(options.rootWorld)||state.contactRootWorld&&!sameRoot(state.contactRootWorld,options.rootWorld)))invalidateStreetSimulation(actor,'UNOBSERVED_COORDINATE_DISCONTINUITY');
  if(!state.simulationHeld)state.contactRootWorld=options.rootWorld.slice();
  state.simulationUpdating=true;
  try{advanceStreetAnimation(actor,state.acceptedStepDistance||0,dt,{...options,simulationOwned:true})}
  finally{state.simulationUpdating=false;state.acceptedStepDistance=0;state.acceptedSegmentCount=0}
  return !state.simulationHeld;
}

export function hasStreetReaction(actor){
  if(characters[resolveStreetCharacter(actor)]?.standingOnly===true||characters[resolveStreetCharacter(actor)]?.atlasMotion)return false;
  const state=playbackByActor.get(actor);return !!(state?.current||state?.pending);
}

function validReactionSequence(person,sequence){
  if(person.standingOnly===true)return false;
  if(!sequence.length||sequence.length>16)return false;
  for(let i=0;i<sequence.length;i++)if(!Object.hasOwn(sequence,i)||typeof sequence[i]!=='string'||!Object.hasOwn(person.clips,sequence[i]))return false;
  return true;
}

function supportsReaction(person,rig,actor,names,stage){
  if(person?.atlasMotion)return false;
  const sequence=Array.isArray(names)?names:[names];
  if(!person||!validReactionSequence(person,sequence))return false;
  if(stage==='motion')return true;
  if(stage!=='rig'||!rig)return false;
  const direction=playbackByActor.get(actor)?.pose?.rigPose?.direction||'down';
  const clips=rig.definition.views[direction]?.upperClips;
  return sequence.every(name=>name!=='talk'&&clips?.[name]?.frames?.length>0);
}

export function requestStreetReaction(actor,names,options={}){
  const person=characters[resolveStreetCharacter(actor)];
  if(person?.atlasMotion)return false;
  if(!person)return false;
  const sequence=Array.isArray(names)?names:[names];
  if(!validReactionSequence(person,sequence))return false;
  const state=playback(actor);
  if(options.incidental&&(state.current||state.pending||state.pose?.speaking))return false;
  if(options.token!=null&&(state.current?.token===options.token||state.pending?.token===options.token))return false;
  if(options.preempt){state.current=null;state.age=0}
  state.pending={names:sequence.slice(),index:0,age:0,terminalShown:false,token:options.token};
  return true;
}

export function cancelStreetReaction(actor,options={}){
  const state=playbackByActor.get(actor);
  if(!state)return false;
  if(options.token!=null&&options.token!==state.current?.token&&options.token!==state.pending?.token)return false;
  state.current=null;state.pending=null;state.age=0;
  if(options.bodyOnly===true){
    if(characters[resolveStreetCharacter(actor)]?.standingOnly===true){
      if(state.pose)state.pose={...state.pose,holdPosition:false};
      return true;
    }
    if(state.pose){
      const person=characters[resolveStreetCharacter(actor)],prior=state.pose;
      const name=prior.moving?prior.direction:prior.speaking&&person?.clips.talk?'talk':'idle';
      const clip=person?.clips[name],speech=name==='talk'?person?.speech?.clips?.talk:null;
      const selected=speech||clip;
      const frame=prior.moving&&clip?Math.floor(state.distance/(person.strideDistance||17)*clip.count)%clip.count:speech?Math.round((prior.mouthOpen||0)*(speech.count-1)):0;
      state.pose={...prior,clip:name,frame,slot:selected?selected.offset+frame:0,holdPosition:false};
    }
    return true;
  }
  if(state.cueToken!=null)state.retiredCues=[...state.retiredCues,state.cueToken].slice(-8);
  state.cueToken=null;state.pose=null;
  return true;
}

function nativeSpeechState(state,options,paused){
  const token=options.cueToken??null,status=options.speechStatus;
  const current=()=>{
    const retainedStatus=paused&&state.pose?.speechStatus==='playing'?'paused':state.pose?.speechStatus||'inactive';
    const opening=retainedStatus==='playing'?state.pose?.mouthCue||0:0;
    return {speaking:retainedStatus==='playing',cueToken:state.cueToken,mouthOpen:opening,mouthCue:opening,speechStatus:retainedStatus};
  };
  const inactive=kind=>({speaking:false,cueToken:null,mouthOpen:0,mouthCue:0,speechStatus:kind});
  const retire=cue=>{if(cue!==null&&!state.retiredCues.includes(cue))state.retiredCues=[...state.retiredCues,cue].slice(-8)};
  if(!['queued','playing','paused','finished','cancelled'].includes(status))return inactive('unavailable');
  if(token===null){retire(state.cueToken);state.cueToken=null;return inactive('unavailable')}
  if(state.retiredCues.includes(token))return state.cueToken===null?inactive('inactive'):current();
  if(status==='finished'||status==='cancelled'){
    retire(token);
    if(state.cueToken!==token)return state.cueToken===null?inactive(status):current();
    state.cueToken=null;return inactive(status);
  }
  if(state.cueToken!==token){retire(state.cueToken);state.cueToken=token}
  const actualStatus=paused&&status==='playing'?'paused':status;
  const time=Number.isFinite(options.mediaTime)?Math.max(0,options.mediaTime):0;
  const duration=Number.isFinite(options.mediaDuration)?Math.max(0,options.mediaDuration):0;
  const opening=actualStatus==='playing'&&time>.025&&!(duration>0&&time>=duration-.015)&&Number.isFinite(options.mouthOpen)?Math.max(0,Math.min(1,options.mouthOpen)):0;
  return {speaking:actualStatus==='playing',cueToken:token,mouthOpen:opening,mouthCue:opening,speechStatus:actualStatus};
}

function speechState(state,options,paused){
  if(options.speechStatus!==undefined)return nativeSpeechState(state,options,paused);
  return {...legacySpeechState(state,options,paused),speechStatus:'legacy',mouthCue:0};
}

function legacySpeechState(state,options,paused){
  const token=options.cueToken??null;
  if(token!==null&&state.retiredCues.includes(token)&&state.cueToken!==null)return {
    speaking:true,cueToken:state.cueToken,mouthOpen:state.pose?.mouthOpen||0};
  const speaking=options.speaking===true&&token!==null&&!state.retiredCues.includes(token);
  if(state.cueToken!==null&&(!speaking||state.cueToken!==token))state.retiredCues=[...state.retiredCues,state.cueToken].slice(-8);
  if(!speaking){state.cueToken=null;return {speaking:false,cueToken:null,mouthOpen:0}}
  if(paused&&state.cueToken===token&&state.pose)return {speaking:true,cueToken:token,mouthOpen:state.pose.mouthOpen};
  state.cueToken=token;
  const time=Number(options.mediaTime)||0,duration=Number(options.mediaDuration)||0;
  const opening=time>.025&&!(duration>0&&time>=duration-.015)&&Number.isFinite(options.mouthOpen)?Math.max(0,Math.min(1,options.mouthOpen)):0;
  return {speaking:true,cueToken:token,mouthOpen:opening};
}

function reactionFrame(state,person,dt,reducedMotion){
  if(!state.current&&state.pending){state.current=state.pending;state.pending=null;return {clip:state.current.names[0],frame:0}}
  const action=state.current;
  if(!action)return null;
  if(action.terminalShown){
    action.index++;action.age=0;action.terminalShown=false;
    if(action.index>=action.names.length){state.current=null;return reactionFrame(state,person,0,reducedMotion)}
    return {clip:action.names[action.index],frame:0};
  }
  const name=action.names[action.index],clip=person.clips[name];
  action.age=Math.min(clip.seconds||.8,action.age+dt);
  const finished=action.age>=(clip.seconds||.8);
  const frame=finished?clip.count-1:reducedMotion?0:Math.min(clip.count-1,Math.floor(action.age/(clip.seconds||.8)*clip.count));
  action.terminalShown=finished;
  return {clip:name,frame};
}

export function advanceStreetAnimation(actor,actualDistance,dt,options={}){
  const person=characters[resolveStreetCharacter(actor)];
  if(!person)return {holdPosition:false,visible:false,clip:'idle',frame:0,slot:0};
  const state=playback(actor),paused=options.paused===true;
  if(acceptsStreetSimulation(actor)&&!options.simulationOwned)return state.pose||(person.atlasMotion?atlasNeutral(person):{holdPosition:false,visible:true,clip:'standing',frame:0,slot:0,direction:'down',moving:false});
  if(person.motionRig)acceptedContactRoot(state,options);
  const seconds=Number.isFinite(dt)?Math.max(0,dt):0;
  const dx=options.dx??(actor.x-state.x),dy=options.dy??(actor.y-state.y);
  state.x=actor.x;state.y=actor.y;
  const speechPaused=options.speechPaused===undefined?paused:options.speechPaused===true;
  const speech=speechState(state,options,speechPaused||!!state.simulationHeld);
  const advancingSpeech=speech.speechStatus==='playing'&&speech.speaking&&!state.simulationHeld;
  if(person.atlasMotion)return advanceAtlasMotion(state,person,actualDistance,seconds,options,speech);
  if(person.standingOnly===true){
    const moving=!paused&&Number.isFinite(actualDistance)&&actualDistance>.0001;
    if(moving)state.distance+=actualDistance;
    state.current=null;state.pending=null;
    state.pose={clip:'standing',frame:0,slot:0,direction:'down',moving,...speech,
      mouthOpen:0,holdPosition:false,visible:true};
    return state.pose;
  }
  if(paused&&state.pose&&!advancingSpeech){
    const pose={...state.pose,...speech};
    if(!speech.speaking&&state.pose.speaking&&pose.clip==='talk'&&!person.motionRig&&person.speech?.clips?.talk){pose.frame=0;pose.slot=person.speech.clips.talk.offset}
    state.pose=advanceContacts(state,pose,0,seconds,true);return state.pose;
  }
  const moving=!paused&&Number.isFinite(actualDistance)&&actualDistance>.0001;
  if(moving){
    if(!options.simulationOwned)state.distance+=actualDistance;
    if(Math.abs(dx)+Math.abs(dy)>.0001)state.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    if(person.motionRig){
      const length=Math.hypot(dx,dy);
      if(Number.isFinite(length)&&length>.0001)state.rigForwardWorld=[dx/length,0,dy/length];
    }
  }
  let selected;
  if(moving){
    const clip=person.clips[state.direction];
    selected={clip:state.direction,frame:Math.floor(state.distance/(person.strideDistance||17)*clip.count)%clip.count};
  }else if(!paused||advancingSpeech)selected=reactionFrame(state,person,seconds,options.reducedMotion);
  if(!selected){
    const name=speech.speaking&&person.clips.talk?'talk':options.waiting&&person.clips.wait?'wait':options.working&&person.clips.work?'work':'idle';
    if(state.pose?.clip!==name)state.age=0;else if(!paused||advancingSpeech)state.age+=seconds;
    const clip=person.clips[name];
    selected={clip:name,frame:options.reducedMotion?0:Math.floor(state.age/(clip.seconds||2)*clip.count)%clip.count};
    if(name==='talk')selected.frame=0;
  }
  let clip=person.clips[selected.clip],frame=selected.frame;
  const registered=selected.clip==='talk'&&!person.motionRig?person.speech?.clips?.talk:null;
  if(speech.speaking&&registered){clip=registered;frame=Math.round(speech.mouthOpen*(clip.count-1))}
  const pose={...selected,frame,slot:clip.offset+frame,direction:state.direction,moving,...speech,
    mouthOpen:registered&&speech.speaking?speech.mouthOpen:0,holdPosition:!!(state.current||state.pending),visible:true};
  if(paused&&state.pose?.rigPose){pose.rigPose=state.pose.rigPose;pose.settling=state.pose.settling}
  else if(person.motionRig){
    const previous=state.rigSettle??1;
    const settle=options.reducedMotion?(moving?0:1):Math.max(0,Math.min(1,previous+(moving?-seconds:seconds)/.12));
    state.rigSettle=settle;
    state.rigForwardWorld??=rigForwards[state.direction].slice();
    pose.rigPose={direction:state.direction,forwardWorld:state.rigForwardWorld,phase:(state.distance/person.strideDistance)%1,mode:settle===1?'hold':moving&&settle===0?'walk':'settle',settle};
    pose.settling=settle>0&&settle<1;
  }
  state.pose=advanceContacts(state,pose,moving?actualDistance:0,seconds,paused);return state.pose;
}

async function boundedRigJson(response){
  if(!response.ok)throw new Error(`Street rig HTTP ${response.status}`);
  let body='';
  if(response.body?.getReader){
    const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0;
    try{
      while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536)throw new RangeError('Street rig exceeds 64 KiB');body+=decoder.decode(value,{stream:true})}
      body+=decoder.decode();
    }finally{await reader.cancel();reader.releaseLock()}
  }else{
    body=await response.text();if(new TextEncoder().encode(body).byteLength>65536)throw new RangeError('Street rig exceeds 64 KiB');
  }
  return JSON.parse(body);
}

function acquireRigDefinition(id,person){
  const meta=person.motionRig,key=`${id}:${meta.file}:${meta.sha256}`;
  let entry=rigDefinitions.get(key);
  if(!entry){
    entry={references:1,retired:false,controller:new AbortController(),promise:null,reject:null};rigDefinitions.set(key,entry);
    entry.promise=new Promise((resolve,reject)=>{
      entry.reject=reject;
      (async()=>{
        rigModulePromise??=import('./street-character-rig.js?v=20261015-street-contact-v20-police-v2');
        const [module,definition]=await Promise.all([rigModulePromise,fetch(`${meta.file}?v=${meta.sha256}`,{signal:entry.controller.signal}).then(boundedRigJson)]);
        if(entry.retired)return;
        const limits=module.STREET_RIG_LIMITS;
        if(!limits||!Number.isInteger(limits.vertices)||!Number.isInteger(limits.triangles)||limits.vertices<1||limits.triangles<1||limits.vertices>RIG_BUFFER_LIMITS.vertices||limits.triangles>RIG_BUFFER_LIMITS.triangles)throw new RangeError('Street rig module exceeds fixed renderer capacity');
        module.validateStreetCharacterRigDefinition(definition);
        if((definition.contactPlayback!==undefined)!==(meta.contactPlayback!==undefined))throw new TypeError('Street accepted-step metadata/definition opt-in mismatch');
        if(definition.contactPlayback!==undefined&&(typeof module.initializeStreetContactPlayback!=='function'||typeof module.advanceStreetContactPlayback!=='function'||meta.contactPlayback?.schemaVersion!==1))throw new TypeError('Street contact definition lacks matching accepted-step opt-in');
        if(definition.mouthRegistration!==undefined&&typeof module.createStreetCharacterRigSampler!=='function')throw new TypeError('Street rig mouth factory unavailable');
        if(definition.id!==person.id&&definition.id!==id)throw new TypeError('Street rig identity mismatch');
        if(definition.gait.strideDistance!==person.strideDistance)throw new RangeError('Street rig stride mismatch');
        if(definition.figureWorldHeight!==undefined&&definition.figureWorldHeight!==person.figureWorldHeight)throw new RangeError('Street rig world height mismatch');
        resolve({module,definition});
      })().catch(reject);
    });
  }else entry.references++;
  let released=false;
  return {promise:entry.promise,release(){
    if(released)return;released=true;
    if(!--entry.references){entry.retired=true;entry.controller.abort();entry.reject(new Error('Street rig released'));if(rigDefinitions.get(key)===entry)rigDefinitions.delete(key)}
  }};
}

function rigSampler(resources,person){
  const sample=resources.definition.mouthRegistration!==undefined?resources.module.createStreetCharacterRigSampler(resources.definition):null;
  return {...resources,person,sample,packet:null,ordered:null,upperStatus:'closed neutral',pose:{direction:'down',phase:0,mode:'hold',settle:1,upper:null,mouth:null},mouth:{opening:0,shape:'open',sourceId:null,profileSha256:null},upper:{clip:'',frame:0},sampleFrame:{rootWorld:null,forwardWorld:null,camera:null}};
}

function sampleRig(rig,actor,frame,firstNeutral=false){
  const current=firstNeutral?null:playbackByActor.get(actor)?.pose,source=current?.rigPose;
  const p=rig.pose;p.direction=source?.direction||'down';p.phase=source?.phase||0;p.mode=source?.mode||'hold';p.settle=source?.settle??1;p.upper=null;
  if(rig.definition.contactPlayback!==undefined){
    if(!rig.contactLease)throw new Error('Street contact motion has no admitted simulation binding');
    const result=rig.contactLease.read();p.contacts=result.contacts;p.direction=result.physicalViewDirection;
    if(firstNeutral){
      if(!rig.contactLease.isInitialAdmission||result.physicalViewDirection!=='down'||result.contactSourcePhase!==result.sourceNeutralPhaseOffset)throw new Error('First neutral sample requires actual initial own front contacts');
      p.direction='down';p.phase=result.sourceNeutralPhaseOffset;p.mode='hold';p.settle=1;
    }
  }else delete p.contacts;
  const clip=rig.definition.views[p.direction].upperClips?.[current?.clip];
  if(current&&clip&&!current.moving&&current.clip!=='talk'){
    const count=rig.person.clips[current.clip].count;
    rig.upper.clip=current.clip;rig.upper.frame=count>1?Math.round(current.frame*(clip.frames.length-1)/(count-1)):0;p.upper=rig.upper;rig.upperStatus=current.clip;
  }else rig.upperStatus='closed neutral; requested view/clip unregistered';
  p.mouth=null;
  const profile=rig.definition.mouthRegistration?.views[p.direction];
  const neutralPaint=current?.moving===true||current?.clip==='talk';
  if(profile&&neutralPaint&&!p.upper&&current?.speechStatus==='playing'&&current.speaking===true&&Number.isFinite(current.mouthCue)&&current.mouthCue>0){
    Object.assign(rig.mouth,{opening:current.mouthCue,shape:'open',sourceId:profile.sourceId,profileSha256:profile.profileSha256});p.mouth=rig.mouth;
  }
  rig.sampleFrame.rootWorld=frame.rootWorld;rig.sampleFrame.camera=frame.camera;rig.sampleFrame.forwardWorld=p.contacts?.forwardWorld||source?.forwardWorld||frame.forwardWorld;
  rig.packet=rig.sample?rig.sample(p,rig.sampleFrame,rig.packet):rig.module.sampleStreetCharacterRig(rig.definition,p,rig.sampleFrame,rig.packet);
  rig.ordered=rig.module.orderStreetCharacterRigPacket(rig.packet,frame.camera.position,rig.ordered);
  if(rig.ordered.vertexCount>RIG_BUFFER_LIMITS.vertices||rig.ordered.triangleCount>RIG_BUFFER_LIMITS.triangles)throw new RangeError('Street rig packet exceeds fixed renderer capacity');
  return rig.ordered;
}

function rigGeometry(T,person){
  const geometry=new T.BufferGeometry();
  try{
    geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(RIG_BUFFER_LIMITS.vertices*3),3));geometry.setAttribute('uv',new T.BufferAttribute(new Float32Array(RIG_BUFFER_LIMITS.vertices*2),2));geometry.setIndex(new T.BufferAttribute(new Uint16Array(RIG_BUFFER_LIMITS.triangles*3),1));
    standingRigGeometry(geometry,person);return geometry;
  }catch(cause){geometry.dispose();throw cause}
}

function standingRigGeometry(geometry,person){
  const width=person.cell[0]*person.figureWorldHeight/person.figureHeight/2,height=person.cell[1]*person.figureWorldHeight/person.figureHeight/2;
  geometry.attributes.position.array.set([-width,height,0,width,height,0,-width,-height,0,width,-height,0]);
  geometry.index.array.set([0,2,1,2,3,1]);geometry.attributes.position.needsUpdate=geometry.index.needsUpdate=true;geometry.setDrawRange(0,6);
}

function threeRigFrame(host,camera,frame){
  host.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);
  const h=host.matrixWorld.elements,c=camera.matrixWorld.elements;
  for(let axis=0;axis<3;axis++){frame.rootWorld[axis]=h[12+axis];frame.camera.position[axis]=c[12+axis]}
  for(let index=0;index<3;index++){
    const name=rigCameraAxes[index],offset=index*4,sign=index===2?-1:1;
    const length=Math.hypot(c[offset],c[offset+1],c[offset+2]);
    for(let axis=0;axis<3;axis++)frame.camera[name][axis]=c[offset+axis]/length*sign;
  }
}

function applyThreeRig(sprite,rig,actor,host,camera,firstNeutral=false){
  threeRigFrame(host,camera,rig.frame);
  const pose=playbackByActor.get(actor)?.pose?.rigPose;rig.frame.forwardWorld=pose?.forwardWorld||rigForwards[pose?.direction||'down'];
  const packet=sampleRig(rig,actor,rig.frame,firstNeutral),geometry=sprite.geometry,p=geometry.attributes.position.array,uv=geometry.attributes.uv.array;
  validateThreeRigBuffers(geometry,packet.vertexCount,packet.triangleCount);
  const inverse=rig.hostInverse.copy(host.matrixWorld).invert().elements;
  for(let i=0;i<packet.vertexCount;i++){
    const x=packet.positionsWorld[i*3],y=packet.positionsWorld[i*3+1],z=packet.positionsWorld[i*3+2];
    p[i*3]=inverse[0]*x+inverse[4]*y+inverse[8]*z+inverse[12];p[i*3+1]=inverse[1]*x+inverse[5]*y+inverse[9]*z+inverse[13];p[i*3+2]=inverse[2]*x+inverse[6]*y+inverse[10]*z+inverse[14];
    uv[i*2]=packet.uvs[i*2];uv[i*2+1]=1-packet.uvs[i*2+1];
  }
  for(let i=0;i<packet.triangleCount*3;i++)geometry.index.array[i]=packet.indices[i];
  geometry.attributes.position.needsUpdate=geometry.attributes.uv.needsUpdate=geometry.index.needsUpdate=true;geometry.setDrawRange(0,packet.triangleCount*3);
  sprite.position.set(0,0,0);sprite.quaternion.identity();
}

function validateThreeRigBuffers(geometry,vertices,triangles){
  if(vertices>geometry.attributes.position.count||vertices>geometry.attributes.uv.count||triangles*3>geometry.index.count)throw new RangeError('Street rig module/packet exceeds allocated renderer buffers');
}

export function loadStreetCharacterManifest(){
  if(Object.keys(characters).length)return Promise.resolve(characters);
  if(!manifestPromise)manifestPromise=(async()=>{
    const response=await fetch(MANIFEST_URL,{cache:'no-cache',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(`Street manifest HTTP ${response.status}`);
    const body=await response.text();
    if(body.length>262144)throw new RangeError('Street manifest exceeds 256 KiB');
    return registerStreetCharacterManifest(JSON.parse(body));
  })();
  return manifestPromise;
}

function acquireTexture(T,id,variant,atlas){
  if(!texturesByThree.has(T))texturesByThree.set(T,new Map());
  const cache=texturesByThree.get(T),key=`${id}:${variant}:${atlas.file}:${atlas.sha256||''}`;
  let entry=cache.get(key);
  if(!entry){
    entry={references:1,texture:null,promise:null};cache.set(key,entry);
    entry.promise=new Promise((resolve,reject)=>new T.TextureLoader().load(`${atlas.file}?v=${atlas.sha256}`,texture=>{
      if(texture.image?.width!==atlas.width||texture.image?.height!==atlas.height){texture.dispose();cache.delete(key);reject(new RangeError('Street atlas dimensions do not match manifest'));return}
      texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;texture.premultiplyAlpha=true;
      entry.texture=texture;
      if(!entry.references){texture.dispose();cache.delete(key)}
      resolve(texture);
    },undefined,error=>{cache.delete(key);reject(error)}));
  }else entry.references++;
  let released=false;
  return {promise:entry.promise,release(){
    if(released)return;released=true;entry.references--;
    if(!entry.references&&entry.texture){entry.texture.dispose();if(cache.get(key)===entry)cache.delete(key)}
  }};
}

function applyPose(sprite,person,pose,host,camera,standing=false){
  const columns=standing?1:person.grid[0],rows=standing?1:person.grid[1],slot=standing?0:pose.slot;
  const column=slot%columns,row=Math.floor(slot/columns);
  const u0=column/columns,u1=(column+1)/columns,v0=1-(row+1)/rows,v1=1-row/rows;
  const uv=sprite.geometry.attributes.uv;
  uv.setXY(0,u0,v1);uv.setXY(1,u1,v1);uv.setXY(2,u0,v0);uv.setXY(3,u1,v0);uv.needsUpdate=true;
  sprite.quaternion.copy(host.quaternion).invert().multiply(camera.quaternion);
  const scale=person.figureWorldHeight/person.figureHeight;
  sprite.position.set((person.cell[0]/2-person.pivot[0])*scale,(person.pivot[1]-person.cell[1]/2)*scale,0).applyQuaternion(sprite.quaternion);
}

export function createStreetCharacterSprite(T,actor,host,queueAsset,camera){
  const id=resolveStreetCharacter(actor);if(!id)return null;
  const owner={retired:false};
  let fallback=null;
  let sprite=null,lease=null,person=null,idlePose=null,settled=false,failed=false,error=null,stage=null;
  let motionJob=null,motionLease=null,motionRequested=false,motionSettled=false,motionFailed=false,motionError=null;
  let rig=null,rigLease=null;
  let occlusionPoints=null,atlasMotionLease=null;
  const variant=(globalThis.innerWidth||1024)<=600?'mobile':'desktop';
  const position=()=>({x:host.position.x,z:host.position.z});
  const sample=()=>playbackByActor.get(actor)?.pose||idlePose;
  function removePaint(){
    if(sprite){
      const previous=sprite;sprite=null;
      fallback?.sprites.delete(previous);host.remove(previous);
      previous.geometry.dispose();previous.material.dispose();
    }
    if(fallback&&!fallback.sprites.size){
      for(const {mesh,visible} of fallback.meshes)mesh.visible=visible;
      if(fallbackByHost.get(host)===fallback)fallbackByHost.delete(host);
    }
    fallback=null;
  }
  function sync(admit=true){
    if(owner.retired||!sprite)return;
    const pose=person.atlasMotion&&stage==='motion'&&!atlasMotionLease?atlasNeutral(person):sample();sprite.visible=pose.visible!==false;
    if(stage==='rig'){
      try{applyThreeRig(sprite,rig,actor,host,camera)}
      catch(cause){
        failed=motionFailed=true;error=motionError=String(cause?.message||cause);
        motionLease?.release();motionLease=null;rig?.contactLease?.release();rigLease?.release();rigLease=null;rig=null;stage='standing';sprite.material.map=sprite.userData.standingTexture;
        standingRigGeometry(sprite.geometry,person);applyPose(sprite,person,pose,host,camera,true);
        console.warn('Street character rig unavailable',id,cause);
      }
    }else applyPose(sprite,person,pose,host,camera,stage==='standing');
    if(admit&&person.atlasMotion&&stage==='motion'&&!atlasMotionLease)atlasMotionLease=admitAtlasMotion(actor,person,owner);
    for(const other of fallback.sprites)if(other!==sprite)other.visible=false;
    for(const {mesh} of fallback.meshes)mesh.visible=false;
  }
  function prepareMotion(){
    if(owner.retired||person?.standingOnly===true||characters[id]?.standingOnly===true)return null;
    motionRequested=true;
    if(!settled||!sprite||!person.standing||motionJob)return motionJob||job;
    motionJob=queueAsset(position,2,async()=>{
      if(owner.retired)return false;
      try{
        let resources=null;
        if(person.motionRig){
          rigLease=acquireRigDefinition(id,person);resources=await rigLease.promise;if(owner.retired)return false;
          validateThreeRigBuffers(sprite.geometry,resources.module.STREET_RIG_LIMITS.vertices,resources.module.STREET_RIG_LIMITS.triangles);
        }
        motionLease=acquireTexture(T,id,variant,person.motionRig?person.motionRig.variants[variant]:person.variants[variant]);
        const texture=await motionLease.promise;
        if(owner.retired)return false;
        if(resources){
          const candidate=rigSampler(resources,person);candidate.frame={rootWorld:[0,0,0],forwardWorld:rigForwards.down,camera:{position:[0,0,0],right:[1,0,0],up:[0,1,0],forward:[0,0,-1]}};candidate.hostInverse=new T.Matrix4();
          candidate.contactLease=stageContacts(resources,person,id,actor);
          applyThreeRig(sprite,candidate,actor,host,camera,candidate.contactLease?.isInitialAdmission===true);candidate.contactLease?.commit();rig=candidate;sprite.material.map=texture;stage='rig';
          sync();return stage==='rig';
        }
        const previous={map:sprite.material.map,stage,position:sprite.position.clone(),quaternion:sprite.quaternion.clone(),visible:sprite.visible,uv:sprite.geometry.attributes.uv.array.slice()};
        try{sprite.material.map=texture;stage='motion';sync(false)}
        catch(cause){
          sprite.material.map=previous.map;stage=previous.stage;sprite.position.copy(previous.position);sprite.quaternion.copy(previous.quaternion);sprite.visible=previous.visible;
          sprite.geometry.attributes.uv.array.set(previous.uv);sprite.geometry.attributes.uv.needsUpdate=true;throw cause;
        }
        const standingLease=lease;lease=motionLease;motionLease=null;standingLease.release();
        return true;
      }catch(cause){
        if(!owner.retired){
          failed=motionFailed=true;error=motionError=String(cause?.message||cause);
          console.warn('Street character motion unavailable',id,cause);
        }
        return false;
      }finally{
        if(stage!=='rig'){
          motionLease?.release();motionLease=null;rigLease?.release();rigLease=null;
          if(person.motionRig&&sprite&&!owner.retired){standingRigGeometry(sprite.geometry,person);applyPose(sprite,person,sample(),host,camera,true)}
        }
        motionSettled=true;
      }
    },owner);
    return motionJob;
  }
  const job=queueAsset(position,2,async()=>{
    if(owner.retired)return false;
    let initialGeometry=null,initialMaterial=null;
    try{
      await loadStreetCharacterManifest();
      if(owner.retired)return false;
      person=characters[id];if(!person)throw new Error(`Street identity missing from manifest: ${id}`);
      if(person.standingOnly===true){motionRequested=false;motionSettled=true}
      idlePose={slot:person.standingOnly===true?0:person.clips.idle.offset,visible:true};
      stage=person.standing?'standing':'motion';
      lease=acquireTexture(T,id,person.standing?'standing':variant,person.standing||person.variants[variant]);
      const texture=await lease.promise;
      if(owner.retired)return false;
      const scale=person.figureWorldHeight/person.figureHeight;
      initialGeometry=person.motionRig?rigGeometry(T,person):new T.PlaneGeometry(person.cell[0]*scale,person.cell[1]*scale);
      initialMaterial=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide});
      sprite=new T.Mesh(initialGeometry,initialMaterial);initialGeometry=null;initialMaterial=null;
      if(person.motionRig){sprite.frustumCulled=false;sprite.userData.standingTexture=texture}
      sprite.name=`${person.name||id} painted street character`;sprite.userData.streetPaint=true;host.add(sprite);
      fallback=fallbackByHost.get(host);
      if(!fallback){fallback={meshes:host.children.filter(mesh=>!mesh.userData.streetPaint).map(mesh=>({mesh,visible:mesh.visible})),sprites:new Set()};fallbackByHost.set(host,fallback)}
      fallback.sprites.add(sprite);
      sync();
      return true;
    }catch(cause){
      if(!owner.retired){failed=true;error=String(cause?.message||cause);console.warn('Street character paint unavailable',id,cause)}
      removePaint();initialGeometry?.dispose();initialMaterial?.dispose();stage=null;
      lease?.release();lease=null;return false;
    }finally{settled=true;if(!person?.standing)motionSettled=true;if(motionRequested&&!owner.retired)prepareMotion()}
  },owner);
  return {
    sync,prepareMotion,
    occlusionTargets(){
      if(owner.retired||failed||stage!=='standing'||person?.standingOnly!==true||!person.occlusionSamples||!sprite?.parent||sprite.material.visible===false)return null;
      for(let node=sprite;node;node=node.parent)if(node.visible===false)return null;
      const samples=person.occlusionSamples,scale=person.figureWorldHeight/person.figureHeight;
      occlusionPoints??=samples.map(()=>new T.Vector3());
      sprite.updateWorldMatrix(true,false);
      for(let i=0;i<samples.length;i++)occlusionPoints[i].set((samples[i][0]-person.cell[0]/2)*scale,(person.cell[1]/2-samples[i][1])*scale,0).applyMatrix4(sprite.matrixWorld);
      return occlusionPoints;
    },
    canPlayReaction(names){return !owner.retired&&!!sprite&&!failed&&sprite.visible!==false&&supportsReaction(person,rig,actor,names,stage)},
    restore(){if(sprite)for(const {mesh} of fallback.meshes)mesh.visible=false},
    inspect(){return {id,variant,loaded:!!sprite,settled,failed,error,retired:owner.retired,jobState:job?.state||null,
      stage:sprite?stage:null,motionRequested,motionLoaded:!!sprite&&(stage==='motion'||stage==='rig'),motionSettled,motionFailed,motionError,motionJobState:motionJob?.state||null,
      textureReferences:Number(!!lease)+Number(!!motionLease),rigDefinitionReferences:Number(!!rigLease),rigPacket:rig?.ordered||null,rigUpperStatus:rig?.upperStatus||null,
      pose:playbackByActor.get(actor)?.pose||null,standingOnly:person?.standingOnly===true,height:person?.figureWorldHeight||null}},
    dispose(){
      if(owner.retired)return;owner.retired=true;
      atlasMotionLease?.release();atlasMotionLease=null;
      lease?.release();lease=null;
      motionLease?.release();motionLease=null;
      rig?.contactLease?.release();rigLease?.release();rigLease=null;rig=null;
      removePaint();
    }
  };
}

function acquireCanvasImage(ImageType,id,variant,atlas){
  if(typeof ImageType!=='function')throw new TypeError('Street Canvas image decoder unavailable');
  if(!imagesByConstructor.has(ImageType))imagesByConstructor.set(ImageType,new Map());
  const cache=imagesByConstructor.get(ImageType),key=`${id}:${variant}:${atlas.file}:${atlas.sha256}`;
  let entry=cache.get(key);
  if(!entry){
    const image=new ImageType();
    entry={references:1,image,promise:null,retired:false,reject:null};cache.set(key,entry);
    entry.promise=new Promise((resolve,reject)=>{
      entry.reject=reject;
      image.decoding='async';
      image.onload=async()=>{
        try{
          if(entry.retired)return;
          if(image.decode)await image.decode();
          if(entry.retired)return;
          if(image.naturalWidth!==atlas.width||image.naturalHeight!==atlas.height)throw new RangeError('Street Canvas image dimensions do not match manifest');
          image.onload=image.onerror=null;
          resolve(image);
        }catch(error){reject(error)}
      };
      image.onerror=()=>reject(new Error('Street Canvas image unavailable'));
      image.src=`${atlas.file}?v=${atlas.sha256}`;
    });
  }else entry.references++;
  let released=false;
  return {promise:entry.promise,release(){
    if(released)return;released=true;entry.references--;
    if(!entry.references){
      entry.retired=true;
      entry.image.onload=entry.image.onerror=null;
      entry.image.src='';
      entry.reject(new Error('Street Canvas image released'));
      if(cache.get(key)===entry)cache.delete(key);
    }
  }};
}

function drawRigTriangles(ctx,image,projected){
  const xy=projected.screenXY,uv=projected.uvs,indices=projected.indices,width=image.naturalWidth,height=image.naturalHeight;
  let drawn=0;
  for(let triangle=0;triangle<projected.triangleCount;triangle++){
    const i=indices[triangle*3]*2,j=indices[triangle*3+1]*2,k=indices[triangle*3+2]*2;
    const sx0=uv[i]*width,sy0=uv[i+1]*height,sx1=uv[j]*width,sy1=uv[j+1]*height,sx2=uv[k]*width,sy2=uv[k+1]*height;
    const determinant=sx0*(sy1-sy2)+sx1*(sy2-sy0)+sx2*(sy0-sy1);
    if(Math.abs(determinant)<1e-9)continue;
    const dx0=xy[i],dy0=xy[i+1],dx1=xy[j],dy1=xy[j+1],dx2=xy[k],dy2=xy[k+1];
    const a=(dx0*(sy1-sy2)+dx1*(sy2-sy0)+dx2*(sy0-sy1))/determinant,b=(dy0*(sy1-sy2)+dy1*(sy2-sy0)+dy2*(sy0-sy1))/determinant;
    const c=(dx0*(sx2-sx1)+dx1*(sx0-sx2)+dx2*(sx1-sx0))/determinant,d=(dy0*(sx2-sx1)+dy1*(sx0-sx2)+dy2*(sx1-sx0))/determinant;
    const e=(dx0*(sx1*sy2-sx2*sy1)+dx1*(sx2*sy0-sx0*sy2)+dx2*(sx0*sy1-sx1*sy0))/determinant,f=(dy0*(sx1*sy2-sx2*sy1)+dy1*(sx2*sy0-sx0*sy2)+dy2*(sx0*sy1-sx1*sy0))/determinant;
    ctx.save();
    try{ctx.beginPath();ctx.moveTo(dx0,dy0);ctx.lineTo(dx1,dy1);ctx.lineTo(dx2,dy2);ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,e,f);ctx.drawImage(image,0,0);drawn++}
    finally{ctx.restore()}
  }
  return drawn>0;
}

export function createStreetCharacterCanvasSprite(actor,queueAsset){
  const id=resolveStreetCharacter(actor);if(!id)return null;
  const owner={retired:false},ImageType=globalThis.Image;
  const variant=(globalThis.innerWidth||1024)<=600?'mobile':'desktop';
  const position=()=>({x:actor.x,z:actor.y});
  let person=null,idlePose=null,image=null,lease=null,settled=false,failed=false,error=null,stage=null;
  let motionJob=null,motionLease=null,motionRequested=false,motionSettled=false,motionFailed=false,motionError=null;
  let rig=null,rigLease=null,rigImage=null,atlasMotionLease=null;
  function prepareMotion(){
    if(owner.retired||person?.standingOnly===true||characters[id]?.standingOnly===true)return null;
    motionRequested=true;
    if(!settled||!image||!person.standing||motionJob)return motionJob||job;
    motionJob=queueAsset(position,2,async()=>{
      if(owner.retired)return false;
      try{
        let resources=null;
        if(person.motionRig){rigLease=acquireRigDefinition(id,person);resources=await rigLease.promise;if(owner.retired)return false}
        motionLease=acquireCanvasImage(ImageType,id,variant,person.motionRig?person.motionRig.variants[variant]:person.variants[variant]);
        const decoded=await motionLease.promise;
        if(owner.retired)return false;
        if(resources){
          const candidate=rigSampler(resources,person);candidate.contactLease=stageContacts(resources,person,id,actor);
          if(candidate.contactLease){const result=candidate.contactLease.read();sampleRig(candidate,actor,{rootWorld:result.contacts.rootWorld,forwardWorld:[0,0,1],camera:resources.definition.reference.camera},candidate.contactLease.isInitialAdmission)}
          candidate.contactLease?.commit();rig=candidate;rigImage=decoded;stage='rig';return true
        }
        image=decoded;stage='motion';
        const standingLease=lease;lease=motionLease;motionLease=null;standingLease.release();
        return true;
      }catch(cause){
        if(!owner.retired){
          failed=motionFailed=true;error=motionError=String(cause?.message||cause);
          console.warn('Street Canvas motion unavailable',id,cause);
        }
        return false;
      }finally{if(stage!=='rig'){motionLease?.release();motionLease=null;rigLease?.release();rigLease=null}motionSettled=true}
    },owner);
    return motionJob;
  }
  const job=queueAsset(position,2,async()=>{
    if(owner.retired)return false;
    try{
      await loadStreetCharacterManifest();
      if(owner.retired)return false;
      person=characters[id];if(!person)throw new Error(`Street identity missing from manifest: ${id}`);
      if(person.standingOnly===true){motionRequested=false;motionSettled=true}
      idlePose={slot:person.standingOnly===true?0:person.clips.idle.offset,visible:true};
      const standing=!!person.standing;
      lease=acquireCanvasImage(ImageType,id,standing?'standing':variant,person.standing||person.variants[variant]);
      const decoded=await lease.promise;
      if(owner.retired)return false;
      image=decoded;stage=standing?'standing':'motion';
      return true;
    }catch(cause){
      if(!owner.retired){failed=true;error=String(cause?.message||cause);console.warn('Street Canvas paint unavailable',id,cause)}
      lease?.release();lease=null;return false;
    }finally{settled=true;if(!person?.standing)motionSettled=true;if(motionRequested&&!owner.retired)prepareMotion()}
  },owner);
  return {
    prepareMotion,
    canPlayReaction(names){return !owner.retired&&!!image&&!failed&&playbackByActor.get(actor)?.pose?.visible!==false&&supportsReaction(person,rig,actor,names,stage)},
    drawRig(ctx,{frame,viewProjection,viewport}){
      if(owner.retired||stage!=='rig'||!rigImage)return false;
      if(playbackByActor.get(actor)?.pose?.visible===false)return false;
      try{
        const packet=sampleRig(rig,actor,frame),projected=rig.module.projectStreetCharacterRigPacket(packet,viewProjection,viewport,rig.projected);
        rig.projected=projected;
        return projected.visible&&drawRigTriangles(ctx,rigImage,projected);
      }catch(cause){
        failed=motionFailed=true;error=motionError=String(cause?.message||cause);stage='standing';
        motionLease?.release();motionLease=null;rig?.contactLease?.release();rigLease?.release();rigLease=null;rig=null;rigImage=null;
        console.warn('Street Canvas rig unavailable',id,cause);return false;
      }
    },
    draw(ctx,groundX,groundY,figurePixelHeight){
      if(owner.retired||!image||!Number.isFinite(groundX)||!Number.isFinite(groundY)||!Number.isFinite(figurePixelHeight)||figurePixelHeight<=0)return false;
      const pose=person.atlasMotion&&stage==='motion'&&!atlasMotionLease?atlasNeutral(person):playbackByActor.get(actor)?.pose||idlePose;
      if(pose.visible===false)return false;
      const standing=stage==='standing'||!!person.motionRig,columns=standing?1:person.grid[0],rows=standing?1:person.grid[1];
      const slot=standing?0:pose.slot,width=image.naturalWidth/columns,height=image.naturalHeight/rows;
      const scale=figurePixelHeight/person.figureHeight;
      ctx.drawImage(image,(slot%columns)*width,Math.floor(slot/columns)*height,width,height,
        groundX-person.pivot[0]*scale,groundY-person.pivot[1]*scale,person.cell[0]*scale,person.cell[1]*scale);
      if(person.atlasMotion&&stage==='motion'&&!atlasMotionLease)atlasMotionLease=admitAtlasMotion(actor,person,owner);
      return true;
    },
    inspect(){return {id,variant,loaded:!!image,settled,failed,error,retired:owner.retired,jobState:job?.state||null,
      stage,motionRequested,motionLoaded:!!image&&(stage==='motion'||stage==='rig'),motionSettled,motionFailed,motionError,motionJobState:motionJob?.state||null,
      imageReferences:Number(!!lease)+Number(!!motionLease),rigDefinitionReferences:Number(!!rigLease),rigPacket:rig?.ordered||null,rigUpperStatus:rig?.upperStatus||null,
      pose:playbackByActor.get(actor)?.pose||null,standingOnly:person?.standingOnly===true,height:person?.figureWorldHeight||null}},
    dispose(){
      if(owner.retired)return;owner.retired=true;
      atlasMotionLease?.release();atlasMotionLease=null;
      lease?.release();lease=null;motionLease?.release();motionLease=null;image=null;stage=null;
      rig?.contactLease?.release();rigLease?.release();rigLease=null;rig=null;rigImage=null;
    }
  };
}
