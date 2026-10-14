export function createBuildingLevels({THREE:T,renderer,scene,camera,bridge,mobile,reducedMotion,getDoor,getBounds,getInterior,prepareExterior,loadEffects=()=>import('./level-transition-effects.js?v=20261014-building-levels')}){
  let active=null,resume=null,office=null,officeId='',failure='',lastResult=null;
  let effects=null,effectsPromise=null,effectsError=null;
  function requestEffects(){
    if(effects||effectsPromise)return;effectsError=null;
    try{
      const result=loadEffects();
      if(!result?.then){effects=result;return}
      effectsPromise=Promise.resolve(result).then(module=>{effects=module;effectsPromise=null},error=>{effectsError=error;effectsPromise=null});
    }catch(error){effectsError=error}
  }
  function releaseEffect(transition){transition.vortex?.dispose();transition.vortex=null;transition.flames?.dispose();transition.flames=null;transition.door?.setOpen(0);transition.source?.door.setOpen(0)}
  function returnToCity(transition){
    if(transition.returned)return;transition.returned=true;
    officeId='';document.body.classList.remove('office-inside');transition.onReturn?.();bridge.clearInput?.();
    prepareExterior();transition.door=getDoor(transition.id);transition.door?.setOpen(1);
  }
  function finish(transition){
    if(active===transition)active=null;
    releaseEffect(transition);document.body.classList.remove('level-transitioning');bridge.clearInput?.();
    lastResult={id:transition.id,kind:transition.kind,done:true,failure};
    if(transition.kind==='enter'){
      if(transition.office&&effects){office??=effects.createOfficeRoom(T);officeId=transition.id;office.door.setOpen(0);document.body.classList.add('office-inside')}
      if(!transition.returned){transition.returned=true;transition.onReturn?.()}
    }else if(!transition.returned)returnToCity(transition);
    transition.door?.setOpen(0);
  }
  function begin(id,kind,onReturn,{interior=false,fire=false}={}){
    if(active||kind==='enter'&&officeId)return false;
    if(kind==='voluntary'){
      officeId='';document.body.classList.remove('office-inside');getDoor(id)?.setOpen(0);bridge.clearInput?.();onReturn?.();prepareExterior();return true;
    }
    const source=kind==='eject'?(officeId===id?{camera:office.camera,door:office.door,render:view=>office.render(renderer,view)}:getInterior(id)):null;
    if(kind==='eject'&&!source){failure='Interior view unavailable';onReturn?.();prepareExterior();return true}
    const transition={id,kind,onReturn,office:interior,fire,source,door:getDoor(id),elapsed:0,returned:false,reduced:!!reducedMotion.matches,vortex:null,flames:null};
    if(source){transition.startCamera=source.camera.clone();transition.pullCamera=source.camera.clone();transition.exitPoint=source.door.group.localToWorld(new T.Vector3(0,1.68,0));}
    active=transition;failure='';bridge.clearInput?.();document.body.classList.add('level-transitioning');requestEffects();return true;
  }
  function capture(transition){
    transition.door??=getDoor(transition.id);transition.door?.setOpen(1);
    const point=transition.door?.center();
    if(!point)throw Error('No entrance door for '+transition.id);
    transition.vortex=effects.createLevelVortex({THREE:T,renderer,scene,camera,door:point,bounds:getBounds(transition.id),mobile,reducedMotion:transition.reduced});
  }
  function render(dt){
    const transition=active;
    if(!transition){if(!officeId)return false;office.render(renderer);return true}
    if(document.hidden||window.GermanyHUD?.paused)return true;
    try{
    if(!effects){
      if(effectsError)throw effectsError;
      if(transition.source){transition.startCamera.aspect=camera.aspect;transition.startCamera.updateProjectionMatrix();transition.source.render(transition.startCamera)}
      else renderer.render(scene,camera);
      return true;
    }
    if(transition.resumed){finish(transition);return true}
    if(reducedMotion.matches&&!transition.reduced){
      transition.reduced=true;transition.elapsed=.24;
    }
    transition.elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
    const frame=effects.buildingTransitionFrame(transition.kind,transition.elapsed,transition.reduced);transition.frame=frame;
      if(frame.done){finish(transition);return true}
      if(frame.stage==='pull'){
        transition.source.door.setOpen(frame.doorOpen);
        transition.pullCamera.aspect=camera.aspect;
        effects.sampleEjectionCamera(T,transition.pullCamera,transition.startCamera,transition.exitPoint,frame.stageProgress);
        transition.source.render(transition.pullCamera);
      }else{
        if(transition.kind==='eject'&&!transition.returned)returnToCity(transition);
        transition.door?.setOpen(frame.doorOpen);
        if(frame.stage==='door'||frame.stage==='close')renderer.render(scene,camera);
        else{
          if(!transition.vortex)capture(transition);
          transition.vortex.render(frame.collapse,transition.reduced);
        }
      }
      if(transition.fire&&frame.fire>0){transition.flames??=effects.createEjectionFlames(T,renderer);transition.flames.render(frame.fire,transition.elapsed)}
    }catch(error){failure=error.message;console.warn('Building transition keeps direct travel',error);finish(transition)}
    return true;
  }
  return {enter:(id,done,interior=false)=>begin(id,'enter',done,{interior}),leave:(id,{mode='voluntary',onReturn,fire=false}={})=>begin(id,mode,onReturn,{fire}),render,
    get active(){return !!active},get office(){return officeId},
    inspect(){return active?{active:true,id:active.id,kind:active.kind,elapsed:active.elapsed,...active.frame,door:active.door?.inspect(),sourceCamera:active.startCamera?{position:active.startCamera.position.toArray(),quaternion:active.startCamera.quaternion.toArray()}:null,camera:active.pullCamera?.position.toArray(),cameraAspect:active.pullCamera?.aspect,vortex:active.vortex?.inspect(),fire:!!active.fire,failure}:{active:false,office:officeId,last:lastResult,failure}},
    suspend(){if(!active)return;resume=active;active=null;releaseEffect(resume);document.body.classList.remove('level-transitioning')},
    resume(){const transition=resume;resume=null;if(!transition)return;if(effects)finish(transition);else{active=transition;transition.resumed=true;document.body.classList.add('level-transitioning')}},
    cancel(id){if(active&&(!id||active.id===id)){releaseEffect(active);active=null;document.body.classList.remove('level-transitioning');bridge.clearInput?.()}if(resume&&(!id||resume.id===id))resume=null;},
    dispose(){if(active)finish(active);resume=null;office?.dispose();office=null;officeId='';document.body.classList.remove('office-inside')}
  };
}
