// Private CPU feasibility hypothesis. Simulation supplies accepted roots/distance and its dt.
// This module neither changes roots/routes nor owns a timer or renders artwork.
const TAU=Math.PI*2,EPS=1e-10;
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
const mix=(a,b,t)=>a+(b-a)*t;
const forward=yaw=>[Math.sin(yaw),0,Math.cos(yaw)];
const right=yaw=>[Math.cos(yaw),0,-Math.sin(yaw)];
const copy=p=>p.slice();
const supportAt=phase=>((phase%1)+1)%1<.5?0:1;
function recordEvent(state,event){state.contactEvents.push(event);if(state.contactEvents.length>16)state.contactEvents.shift();}
export function reach(def,root,feet,yaw){
  const f=forward(yaw),r=right(yaw);let drop=def.gait.baseHipDrop,maximumHorizontal=0;
  const legs=[];
  for(let leg=0;leg<2;leg++){
    const p=def.skeleton.legs[leg],hip=p.hip.map((v,i)=>root[i]+(i===1?v:r[i]*p.hip[0]+f[i]*p.hip[2])),ankle=p.ankleOffset.map((v,i)=>feet[leg][i]+(i===1?v:r[i]*p.ankleOffset[0]+f[i]*p.ankleOffset[2])),horizontal=Math.hypot(hip[0]-ankle[0],hip[2]-ankle[2]),length=p.upperLength+p.lowerLength;
    if(horizontal>=length-EPS)return {ok:false,reason:'horizontal reach',leg,horizontal,length};
    drop=Math.max(drop,hip[1]-ankle[1]-Math.sqrt(length*length-horizontal*horizontal)+EPS);
    maximumHorizontal=Math.max(maximumHorizontal,horizontal);legs.push({hip,ankle,physical:p});
  }
  if(drop>def.gait.maxHipDrop)return {ok:false,reason:'maximum hip drop',drop,limit:def.gait.maxHipDrop};
  for(let leg=0;leg<2;leg++){const x=legs[leg],distance=Math.hypot(x.hip[0]-x.ankle[0],x.hip[1]-drop-x.ankle[1],x.hip[2]-x.ankle[2]);if(distance<=Math.abs(x.physical.upperLength-x.physical.lowerLength)+EPS)return {ok:false,reason:'folded leg',leg};}
  return {ok:true,drop,maximumHorizontal};
}
export function initialize(def,root=[0,0,0],yaw=0){
  const r=right(yaw),feet=def.skeleton.legs.map(p=>[root[0]+r[0]*p.soleX,root[1],root[2]+r[2]*p.soleX]);
  return {root:copy(root),phase:.25,totalPhase:.25,physicalYaw:yaw,requestedYaw:yaw,feet,velocity:[[0,0,0],[0,0,0]],support:0,swingStartPhase:.25,swingStartY:0,contactBoundaryPhase:.5,contactEvents:[],stopped:true,failed:null,substeps:0,reachCalls:0,targetPlans:0};
}
// Root-authorized clarification: physical yaw supplies foot orientation/lateral offset;
// accepted travel heading supplies longitudinal excursion, including backward stepping.
function landingTarget(def,root,yaw,leg,travelYaw){const r=right(yaw),f=forward(travelYaw),sx=def.skeleton.legs[leg].soleX,E=def.gait.excursionWorld;return [root[0]+r[0]*sx+f[0]*E,root[1],root[2]+r[2]*sx+f[2]*E];}
function plannedLanding(def,state,predictedRoot,free,requested){
  let best=null,bestScore=Infinity;
  // Bounded 1D yaw search. No universal feasibility claim beyond sampled candidates.
  const candidates=[requested,state.physicalYaw];for(let k=0;k<360;k++)candidates.push(state.physicalYaw+(k-180)*Math.PI/180);
  for(const yaw of candidates){const target=landingTarget(def,predictedRoot,yaw,free,requested),feet=state.feet.map(copy);feet[free]=target;state.reachCalls++;const fit=reach(def,predictedRoot,feet,yaw);if(!fit.ok)continue;const score=Math.abs(wrap(yaw-requested))+.000001*Math.abs(wrap(yaw-state.physicalYaw));if(score<bestScore){bestScore=score;best={yaw,target,fit};}}
  state.targetPlans++;return best;
}
function hermite(a,v,b,h,step){
  const u=step/h,u2=u*u,u3=u2*u;
  return {p:(2*u3-3*u2+1)*a+(u3-2*u2+u)*h*v+(-2*u3+3*u2)*b,v:((6*u2-6*u)*a+(3*u2-4*u+1)*h*v+(-6*u2+6*u)*b)/h};
}
function chooseCurrentYaw(def,state,root,feet,target,phaseStep,priorRoot,priorFeet){
  const delta=wrap(target-state.physicalYaw),limit=4*Math.PI*phaseStep,candidates=[Math.max(-limit,Math.min(limit,delta)),0];for(let k=-16;k<=16;k++)candidates.push(limit*k/16);candidates.sort((a,b)=>Math.abs(wrap(delta-a))-Math.abs(wrap(delta-b)));
  for(const amount of candidates){const yaw=state.physicalYaw+amount;let valid=true;for(const t of [.25,.5,.75,1]){const rr=root.map((v,i)=>mix(priorRoot[i],v,t)),ff=feet.map((p,leg)=>p.map((v,i)=>mix(priorFeet[leg][i],v,t)));state.reachCalls++;if(!reach(def,rr,ff,state.physicalYaw+amount*t).ok){valid=false;break;}}if(valid)return yaw;}
  return null;
}
export function advance(def,state,acceptedRoot,acceptedDistanceWorld,dt,{paused=false}={}){
  // If this hypothesis cannot satisfy an accepted step, retain that actual root and phase,
  // emit the failure and stop producing poses. Never alter motion to conceal failure.
  const startRoot=copy(state.root),dx=acceptedRoot[0]-startRoot[0],dz=acceptedRoot[2]-startRoot[2],measured=Math.hypot(dx,dz),worldCycle=4*def.gait.excursionWorld;
  if(Math.abs(measured-acceptedDistanceWorld)>1e-8)throw new TypeError('Accepted segment length mismatch');
  if(paused){if(acceptedDistanceWorld>EPS)throw new TypeError('Paused actor moved');return state;}
  if(state.failed){state.root=copy(acceptedRoot);state.totalPhase+=acceptedDistanceWorld/worldCycle;state.phase=((state.totalPhase%1)+1)%1;return state;}
  if(acceptedDistanceWorld<=EPS){
    const free=1-state.support;state.feet[free][1]=Math.max(acceptedRoot[1],state.feet[free][1]-(def.gait.liftWorld*Math.max(0,dt)/.12));state.velocity[free]=[0,0,0];state.stopped=true;state.root=copy(acceptedRoot);return state;
  }
  const requested=Math.atan2(dx,dz);state.requestedYaw=requested;
  const phaseAmount=acceptedDistanceWorld/worldCycle,endPhase=state.totalPhase+phaseAmount,startPhase=state.totalPhase;
  if(state.stopped){
    const bothGrounded=state.feet.every(p=>Math.abs(p[1]-startRoot[1])<EPS),before=state.feet.map(copy),priorSupport=state.support,globalPhaseBefore=state.totalPhase,travel=forward(requested);
    const along=state.feet.map(p=>(p[0]-startRoot[0])*travel[0]+(p[2]-startRoot[2])*travel[2]);
    if(bothGrounded&&along[1-state.support]>along[state.support]+EPS)state.support=1-state.support;
    const remainingWorld=along[state.support]+def.gait.excursionWorld;
    if(remainingWorld<=EPS){state.failed={code:'GROUNDED_SUPPORT_ALREADY_PAST_STANCE_END',phase:state.totalPhase,along};state.root=copy(acceptedRoot);state.totalPhase=endPhase;state.phase=((endPhase%1)+1)%1;return state;}
    state.contactBoundaryPhase=state.totalPhase+remainingWorld/worldCycle;
    recordEvent(state,{type:bothGrounded?'grounded-weight-transfer':'airborne-retained-support',bothGrounded,globalPhaseBefore,globalPhaseAfter:state.totalPhase,priorSupport,support:state.support,anchorBefore:before,anchorAfter:state.feet.map(copy),along,remainingWorld,boundary:state.contactBoundaryPhase,requested});
    state.swingStartPhase=state.totalPhase;state.swingStartY=state.feet[1-state.support][1]-startRoot[1];state.velocity[1-state.support]=[0,0,0];state.stopped=false;
  }
  while(state.totalPhase<endPhase-1e-12){
    const boundary=state.contactBoundaryPhase,step=Math.min(1/128,endPhase-state.totalPhase,boundary-state.totalPhase),nextPhase=state.totalPhase+step,fraction=(nextPhase-startPhase)/phaseAmount,root=acceptedRoot.map((v,i)=>mix(startRoot[i],v,fraction)),priorFeet=state.feet.map(copy),priorRoot=copy(state.root),free=1-state.support,remaining=boundary-state.totalPhase;
    const futureDistance=remaining*worldCycle,predictedRoot=[state.root[0]+Math.sin(requested)*futureDistance,root[1],state.root[2]+Math.cos(requested)*futureDistance],plan=plannedLanding(def,state,predictedRoot,free,requested);
    let diagnostic=null;
    if(!plan)diagnostic={code:'NO_REACHABLE_LANDING_YAW',phase:state.totalPhase,boundary,root,feet:state.feet.map(copy),requested};
    let feet=state.feet.map(copy);
    if(plan){
      for(const axis of [0,2]){const sample=hermite(state.feet[free][axis],state.velocity[free][axis],plan.target[axis],remaining,step);feet[free][axis]=sample.p;state.velocity[free][axis]=sample.v;}
      // Retained airborne start height already uses part of the source's lift range.
      // h00 and16u²(1-u)² both lie in[0,1], so this bounds Y by the source ceiling
      // without moving the retained start position or changing contact duration.
      const duration=boundary-state.swingStartPhase,u=(nextPhase-state.swingStartPhase)/duration,h=Math.max(0,def.gait.liftWorld-state.swingStartY);
      feet[free][1]=root[1]+state.swingStartY*(1-u)*(1-u)*(1+2*u)+h*16*u*u*(1-u)*(1-u);
      state.velocity[free][1]=(state.swingStartY*6*u*(u-1)+h*32*u*(1-u)*(1-2*u))/duration;
      const yaw=chooseCurrentYaw(def,state,root,feet,plan.yaw,step,priorRoot,priorFeet);
      if(yaw===null)diagnostic={code:'NO_CONTINUOUS_REACHABLE_CURRENT_YAW',phase:nextPhase,root,feet,priorFeet,priorYaw:state.physicalYaw,plannedYaw:plan.yaw,requested};
      else{state.physicalYaw=yaw;state.feet=feet;}
    }
    state.root=root;state.totalPhase=nextPhase;state.phase=((nextPhase%1)+1)%1;state.substeps++;
    if(diagnostic){state.failed=diagnostic;state.root=copy(acceptedRoot);state.totalPhase=endPhase;state.phase=((endPhase%1)+1)%1;return state;}
    if(Math.abs(nextPhase-boundary)<1e-10){
      state.feet[free][1]=root[1];state.velocity[free]=[0,0,0];state.support=free;state.swingStartPhase=nextPhase;state.swingStartY=0;
      const travel=forward(requested),along=(state.feet[free][0]-root[0])*travel[0]+(state.feet[free][2]-root[2])*travel[2],remainingWorld=along+def.gait.excursionWorld;
      if(remainingWorld<=EPS){state.failed={code:'LANDED_CONTACT_PAST_STANCE_END',phase:nextPhase,along};state.root=copy(acceptedRoot);state.totalPhase=endPhase;state.phase=((endPhase%1)+1)%1;return state;}
      state.contactBoundaryPhase=nextPhase+remainingWorld/worldCycle;
      recordEvent(state,{type:'distance-landing',globalPhase:nextPhase,support:free,anchor:copy(state.feet[free]),remainingWorld,boundary:state.contactBoundaryPhase});
    }
  }
  return state;
}
