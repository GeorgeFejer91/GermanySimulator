// SOURCE DRAFT ONLY. The existing simulation owner supplies this plain playback record.
// No registry, timer, asset fetch, world movement, renderer or independent distance owner.
import {initialize as initializePlanner,advance as advancePlanner,reach} from './contact-planner.mjs?v=20261015-street-contact-v20-police-v2';

const KEY='streetContactPlayback',EPS=1e-8,SOURCE_NEUTRAL_PHASE=.25;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const phase=x=>((x%1)+1)%1;
function vector(value,length){return Array.isArray(value)&&value.length===length&&Array.from({length},(_,i)=>Object.hasOwn(value,i)&&finite(value[i])).every(Boolean);}
function near(a,b){return Math.abs(a-b)<=EPS+16*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b));}
function rootNear(a,b){return a.every((v,i)=>Math.abs(v-b[i])<=EPS);}
function definitionOkay(def){return def?.format==='gs-painted-parts'&&typeof def.id==='string'&&Array.isArray(def.skeleton?.legs)&&def.skeleton.legs.length===2&&finite(def.gait?.excursionWorld)&&def.gait.excursionWorld>0&&finite(def.gait.strideDistance)&&def.gait.strideDistance>0&&finite(def.gait.liftWorld)&&def.gait.liftWorld>=0&&finite(def.gait.baseHipDrop)&&finite(def.gait.maxHipDrop)&&def.gait.baseHipDrop>=0&&def.gait.maxHipDrop>=def.gait.baseHipDrop;}
function physicalDirection(yaw){const x=Math.sin(yaw),z=Math.cos(yaw);return Math.abs(x)>Math.abs(z)?x>0?'right':'left':z>0?'down':'up';}
function failure(bundle,code,detail={}){
  if(bundle&&!bundle.failure)bundle.failure={code,...detail};
  return {ok:false,contacts:null,code,...detail};
}
function alreadyFailed(bundle){return {ok:false,contacts:null,code:'CONTACT_PLAYBACK_ALREADY_FAILED',causeCode:bundle.failure.code};}
function readInput(owner,input){
  if(!owner||typeof owner!=='object'||Array.isArray(owner))return 'INVALID_PLAYBACK_OWNER';
  if(!input||!vector(input.rootWorld,3)||!finite(input.totalDistance2d)||input.totalDistance2d<0)return 'INVALID_ROOT_OR_TOTAL_DISTANCE';
  if(!finite(owner.distance)||!near(owner.distance,input.totalDistance2d))return 'OWNER_DISTANCE_MISMATCH';
  return null;
}
function snapshot(bundle,input){
  const state=bundle.planner,def=bundle.definition;
  if(state.failed)return failure(bundle,'PLANNER_UNSUPPORTED',{plannerDiagnostic:state.failed});
  if(!rootNear(state.root,input.rootWorld))return failure(bundle,'PLANNER_ROOT_MISMATCH');
  const expected=SOURCE_NEUTRAL_PHASE+(input.totalDistance2d-bundle.admissionDistance2d)/def.gait.strideDistance;
  if(!near(state.totalPhase,expected))return failure(bundle,'PLANNER_DISTANCE_PHASE_MISMATCH',{expected,actual:state.totalPhase});
  if(!Array.isArray(state.feet)||state.feet.length!==2||!state.feet.every(p=>vector(p,3)))return failure(bundle,'INVALID_PLANNER_CONTACTS');
  const feetWorld=state.feet.flat();
  if(!vector(feetWorld,6)||!finite(state.physicalYaw)||(state.support!==0&&state.support!==1))return failure(bundle,'INVALID_PLANNER_CONTACTS');
  for(let leg=0;leg<2;leg++)if(feetWorld[leg*3+1]<input.rootWorld[1]-EPS||feetWorld[leg*3+1]>input.rootWorld[1]+def.gait.liftWorld+EPS)return failure(bundle,'SOURCE_LIFT_RANGE_EXCEEDED');
  if(Math.abs(feetWorld[state.support*3+1]-input.rootWorld[1])>EPS)return failure(bundle,'SUPPORT_NOT_GROUNDED');
  let fit;
  try{fit=reach(def,input.rootWorld,state.feet,state.physicalYaw);}
  catch(error){return failure(bundle,'FAILED_PHYSICAL_REACH',{message:String(error?.message||error)});}
  if(!fit.ok||!finite(fit.drop)||fit.drop<def.gait.baseHipDrop||fit.drop>def.gait.maxHipDrop)return failure(bundle,'FAILED_PHYSICAL_REACH',{reach:fit});
  return {ok:true,contacts:{rootWorld:input.rootWorld.slice(),forwardWorld:[Math.sin(state.physicalYaw),0,Math.cos(state.physicalYaw)],feetWorld,supportFoot:state.support,hipDrop:fit.drop},
    nominalPhase:phase(input.totalDistance2d/def.gait.strideDistance),nominalDistance2d:input.totalDistance2d,
    contactSourcePhase:phase(state.totalPhase),contactTotalPhase:state.totalPhase,sourceNeutralPhaseOffset:SOURCE_NEUTRAL_PHASE,
    admissionDistance2d:bundle.admissionDistance2d,physicalYaw:state.physicalYaw,physicalViewDirection:physicalDirection(state.physicalYaw),
    viewStatus:'physical-yaw cardinal only; authored whole-body turn gate remains outstanding',contactEvents:state.contactEvents.slice()};
}

function safelySnapshot(bundle,input){
  try{return snapshot(bundle,input);}
  catch(error){return failure(bundle,'CONTACT_SNAPSHOT_REJECTED',{message:String(error?.message||error)});}
}

export function initializeStreetContactPlayback(owner,definition,input){
  const bad=readInput(owner,input);if(bad)return failure(null,bad);
  if(!definition)return failure(null,'LAZY_DEFINITION_UNAVAILABLE');
  if(!definitionOkay(definition))return failure(null,'INVALID_LAZY_DEFINITION');
  const current=owner[KEY];
  if(current){
    if(current.failure)return alreadyFailed(current);
    if(current.definition!==definition)return failure(current,'LAZY_DEFINITION_CHANGED');
    if(!rootNear(current.lastRoot,input.rootWorld)||!near(current.lastDistance2d,input.totalDistance2d))return failure(current,'REINITIALIZATION_WOULD_RESET_CONTACTS');
    return safelySnapshot(current,input);
  }
  // This must describe the actually displayed own neutral source, never velocity facing.
  const initialForward=input.initialPhysicalForwardWorld??[0,0,1];
  if(!vector(initialForward,3)||Math.abs(initialForward[1])>EPS||Math.hypot(initialForward[0],initialForward[2])<=EPS)return failure(null,'INVALID_INITIAL_SOURCE_FACING');
  const yaw=Math.atan2(initialForward[0],initialForward[2]);
  let planner;
  try{planner=initializePlanner(definition,input.rootWorld,yaw);}
  catch(error){return failure(null,'PLANNER_REJECTED_INITIALIZATION',{message:String(error?.message||error)});}
  const bundle={definition,admissionDistance2d:input.totalDistance2d,lastDistance2d:input.totalDistance2d,lastRoot:input.rootWorld.slice(),worldPer2d:4*definition.gait.excursionWorld/definition.gait.strideDistance,planner,failure:null};
  owner[KEY]=bundle;
  return safelySnapshot(bundle,input);
}

export function advanceStreetContactPlayback(owner,definition,input){
  const bad=readInput(owner,input);if(bad)return failure(owner?.[KEY],bad);
  const bundle=owner[KEY];if(!bundle)return failure(null,'CONTACT_PLAYBACK_NOT_INITIALIZED');
  if(bundle.failure)return alreadyFailed(bundle);
  if(definition!==bundle.definition)return failure(bundle,'LAZY_DEFINITION_CHANGED');
  if(!finite(input.acceptedDistance2d)||input.acceptedDistance2d<0||!finite(input.dt)||input.dt<0)return failure(bundle,'INVALID_ACCEPTED_STEP');
  const delta=input.totalDistance2d-bundle.lastDistance2d;
  if(delta<-EPS||!near(delta,input.acceptedDistance2d))return failure(bundle,'STALE_OR_MISMATCHED_DISTANCE',{counterDelta:delta,suppliedStep:input.acceptedDistance2d});
  if(Math.abs(input.rootWorld[1]-bundle.lastRoot[1])>EPS)return failure(bundle,'GROUND_ELEVATION_CHANGED');
  const acceptedWorld=input.acceptedDistance2d*bundle.worldPer2d,rootWorldDistance=Math.hypot(input.rootWorld[0]-bundle.lastRoot[0],input.rootWorld[2]-bundle.lastRoot[2]);
  if(!near(rootWorldDistance,acceptedWorld))return failure(bundle,'ACCEPTED_ROOT_DISTANCE_MISMATCH',{rootWorldDistance,acceptedWorld});
  if(input.paused===true&&(input.acceptedDistance2d!==0||delta!==0||!rootNear(input.rootWorld,bundle.lastRoot)))return failure(bundle,'PAUSED_OWNER_MOVED');
  try{advancePlanner(definition,bundle.planner,input.rootWorld.slice(),acceptedWorld,input.dt,{paused:input.paused===true});}
  catch(error){return failure(bundle,'PLANNER_REJECTED_STEP',{message:String(error?.message||error)});}
  // Bookkeeping observes the complete accepted step; it never writes owner.distance/root.
  bundle.lastDistance2d=input.totalDistance2d;bundle.lastRoot=input.rootWorld.slice();
  return safelySnapshot(bundle,input);
}
