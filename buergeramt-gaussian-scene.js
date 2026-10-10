// Optional close-up paint interpolation. The simulation owns every action;
// the existing render pass and two-job admission queue own preparation/update.
export function createAmtGaussianScene({THREE,renderer,scene,queueLoad,mobile=false,reducedMotion}){
  const slots=new Map(),failedActors=new Map(),limit=mobile?1:2;
  let generation=null,controller=new AbortController(),owner=null,ownerPromise=null,failure='';
  const enqueue=task=>queueLoad?queueLoad(task):Promise.resolve().then(task);
  async function getOwner(){
    if(owner)return owner;
    if(failure)throw new Error(failure);
    if(!ownerPromise){
      const request=controller;
      ownerPromise=import('./buergeramt-splat.js?v=20261010-liquid').then(module=>
        module.createAmtSplatOwner({THREE,renderer,scene,signal:request.signal})).then(value=>{
        if(request!==controller||request.signal.aborted){void value.dispose();throw new DOMException('Retired office','AbortError')}
        owner=value;return value;
      }).catch(error=>{if(!request.signal.aborted)failure=error.message;throw error});
    }
    return ownerPromise;
  }
  function retire(entry){
    entry.controller.abort();entry.effect?.dispose();slots.delete(entry.id);
    entry.actor.mesh.material.opacity=1;
  }
  function clear(){
    if(generation===null&&!slots.size&&!ownerPromise)return;
    for(const entry of [...slots.values()])retire(entry);
    controller.abort();void owner?.dispose();owner=null;ownerPromise=null;
    controller=new AbortController();failure='';generation=null;failedActors.clear();
  }
  function prepareGeneration(value){if(generation!==null&&generation!==value)clear();generation=value}
  function inView(actor,camera){
    if(!camera.rotation||!Number.isFinite(camera.fov)||!Number.isFinite(camera.aspect))return true;
    const dx=actor.mesh.position.x-camera.position.x,dz=actor.mesh.position.z-camera.position.z,yaw=camera.rotation.y;
    const forward=-dx*Math.sin(yaw)-dz*Math.cos(yaw),side=dx*Math.cos(yaw)-dz*Math.sin(yaw);
    const tangent=Math.tan(camera.fov*Math.PI/360)*camera.aspect;
    // Conservative full-billboard margin: a visible edge retains its slot.
    const radius=(actor.mesh.geometry?.parameters.width??1.6)*(actor.mesh.scale?.x??1)/2+.15;
    return forward+radius>0&&Math.abs(side)<=Math.max(0,forward)*tangent+radius*(1+tangent);
  }
  function safeAnchor(item){
    const state=item?.state;if(!state)return true;
    if(item.manifestId&&item.id!=='clerk'){
      // Stationary sprite fallback is the original work/ready painting. Both
      // admission and slot handover wait for that painting, never a raised key.
      if(item.manifestId==='clerk')return !state.arc&&state.pose==='ready'||state.arc==='raise'&&state.phase<.035||state.arc==='return'&&state.phase>.965;
      return !state.arc||state.phase<.035||state.phase>.965;
    }
    return !state.arc||(state.arc==='work-gesture-work'?state.phase<.035||Math.abs(state.phase-.5)<.035||state.phase>.965:state.phase<.035||state.phase>.965);
  }
  function update(level,stationary,moving,camera){
    if(!level.active){clear();return}
    prepareGeneration(level.clerkPerformance.animation?.generation??0);
    const blocked=!!level.omen.phase,states=level.characters;
    const stationaryStates=level.stationaryAnimations??{};
    const candidates=[...stationary.map((actor,index)=>({id:index===0?'clerk':actor.animationId??actor.id,
      manifestId:actor.performance||index===0?'clerk':actor.name,actor,
      state:index===0?level.clerkPerformance.animation:stationaryStates[actor.animationId??actor.id]})),
      ...moving.map(actor=>{const source=states.find(s=>s.id===actor.id);return{id:actor.id,actor,state:source?.mode==='work'?{...source.animation,arc:null,pose:'work'}:source?.animation}})]
      .map(item=>({...item,inView:inView(item.actor,camera),distance:Math.hypot(camera.position.x-item.actor.mesh.position.x,camera.position.z-item.actor.mesh.position.z)}))
      .sort((a,b)=>{
        const priority=item=>level.characterMood?.id===item.id?-2:item.id==='clerk'&&item.distance<5?-1:0;
        return priority(a)-priority(b)||Number(b.inView)-Number(a.inView)||a.distance-b.distance;
      });
    const preferred=candidates.find(item=>item.inView&&item.state&&item.distance<5);
    for(const entry of [...slots.values()]){
      const current=candidates.find(item=>item.id===entry.id);
      const atMain=safeAnchor(current);
      if(!current||current.distance>7||preferred&&!slots.has(preferred.id)&&entry.id!==preferred.id&&(atMain||!current.inView)&&slots.size>=limit)retire(entry);
    }
    if(!blocked&&!document.hidden&&!reducedMotion.matches&&!failure){
      for(const item of candidates){
        if(!item.inView||!item.state||item.distance>=6||slots.has(item.id)||failedActors.has(item.id)||slots.size>=limit)continue;
        const request=new AbortController(),entry={...item,controller:request,effect:null,admitted:false,failure:''};
        slots.set(item.id,entry);
        const prepare=async()=>{
          if(request.signal.aborted||controller.signal.aborted||document.hidden)return null;
          const [module,shared]=await Promise.all([import('./buergeramt-gaussian-animation.js?v=20261010-liquid'),getOwner()]);
          request.signal.throwIfAborted();
          return module.createGaussianActor({THREE,owner:shared,manifestUrl:`./assets/buergeramt/animation/${item.manifestId??item.id}.json?v=20261010-cast`,variant:mobile?'mobile':'desktop',signal:request.signal,queueLoad:enqueue});
        };
        enqueue(prepare).then(effect=>{
          if(request.signal.aborted||slots.get(item.id)!==entry){effect?.dispose();return}
          if(!effect){retire(entry);return}
          entry.effect=effect;
        }).catch(error=>{if(!request.signal.aborted){failedActors.set(item.id,error.message);retire(entry)}});
      }
    }
    for(const item of candidates){
      const entry=slots.get(item.id),state=item.state;
      if(!(blocked&&item.id==='aktenkurier'))item.actor.mesh.material.opacity=1;
      if(!entry?.effect)continue;
      const eligible=!blocked&&!reducedMotion.matches&&item.distance<5&&!!state&&!owner?.inspect().failure;
      if(!eligible)entry.admitted=false;
      // Preparation never replaces a painting halfway through an action.
      const atMain=state&&safeAnchor(item);
      if(eligible&&atMain)entry.admitted=true;
      entry.effect.update(state,item.actor.mesh,{visible:eligible&&entry.admitted,reducedMotion:reducedMotion.matches});
      if(entry.effect.inspect().visible){item.actor.mesh.material.opacity=0}
    }
  }
  return{getOwner,prepareGeneration,update,clear,
    render(camera){owner?.update(camera,[...slots.values()].some(entry=>entry.admitted)?60:30)},
    inspect(){return{generation,limit,failure:failure||owner?.inspect().failure||'',failedActors:Object.fromEntries(failedActors),owner:owner?.inspect()??null,
      actors:[...slots.values()].map(e=>({...e.effect?.inspect(),id:e.id,manifestId:e.manifestId??e.id,loading:!e.effect&&!e.failure,admitted:e.admitted,failure:e.failure||e.effect?.inspect().failure||''}))}},
  };
}
