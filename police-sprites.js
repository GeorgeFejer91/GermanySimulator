import {loadThreeTexture} from './asset-loaders.js?v=20261020-bounded-assets';

export const POLICE_TIERS=Object.freeze(['patrol','protective','riot','heavy']);
export const POLICE_SPRITE_LAYOUT=Object.freeze({columns:8,rows:7,cellWidth:160,cellHeight:192,pivot:472/614.4,cycleDistance:65.24});
export function policeTier(stars){return stars>=5?'heavy':stars>=4?'riot':stars>=3?'protective':'patrol'}

// Distance is collision-resolved game travel since the previous update, not speed.
export function policeSpriteFrame(state,{distance=0,dt=0,talking=false,gesture=null,facing=0,cameraYaw=0,reducedMotion=false}={}){
  const moving=Number.isFinite(distance)&&distance>.001;
  if(moving)state.distance=(state.distance||0)+distance;
  state.age=(state.age||0)+Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));
  const requested=!moving&&(talking||gesture)?(gesture==='ticket'||gesture==='fine'?'ticket':'warning'):null;
  if(requested&&requested!==state.action){state.action=requested;state.actionAge=0}
  else if(state.action)state.actionAge=(state.actionAge||0)+Math.min(.1,Math.max(0,dt||0));
  if(!requested&&state.action&&(moving||Math.floor(state.actionAge*8)%8>=6||reducedMotion))state.action=null;
  const angle=Math.atan2(Math.sin(facing-cameraYaw),Math.cos(facing-cameraYaw));
  const direction=Math.abs(angle)<Math.PI/4?0:Math.abs(angle)>Math.PI*.75?2:angle>0?1:3;
  let row=moving?direction:4,frame=moving?Math.floor((state.distance||0)/POLICE_SPRITE_LAYOUT.cycleDistance*8)%8:direction;
  if(!moving&&state.action){
    row=state.action==='ticket'?6:5;
    frame=reducedMotion?2:Math.floor(state.actionAge*8)%8;
  }
  return state.pose={row,frame,moving,direction};
}

export function createPoliceSprites(T,{queueAsset,camera,mobile=false}={}){
  const actors=new Map(),resources=new Map();let retired=false;
  const height=2.33*614.4/400;
  function release(resource){
    if(--resource.refs>0)return;
    resource.owner.retired=true;resource.owner.controller.abort();resource.texture?.dispose();
    if(resources.get(resource.key)===resource)resources.delete(resource.key);
  }
  function acquire(key,host){
    let resource=resources.get(key);if(resource){resource.refs++;return resource}
    resource={key,refs:1,texture:null,settled:false,failed:false,owner:{retired:false,controller:new AbortController()}};
    resources.set(key,resource);
    const load=async({signal}={})=>{
      try{
        const texture=await loadThreeTexture(T,`./assets/characters/police/${key}${mobile?'-mobile':''}.webp?v=20261023-police-adults`,signal,resource.owner.controller.signal);
        if(resource.owner.retired||retired||signal?.aborted){texture.dispose();return false}
        texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;texture.premultiplyAlpha=true;
        resource.texture=texture;return true;
      }catch(error){if(!resource.owner.retired){resource.failed=true;console.warn('Police paint unavailable; retaining 3D officer',error)}return false}
      finally{resource.settled=true}
    };
    // The game supplies its shared two-job, distance/visibility admission queue.
    const position=(x=0,z=0)=>{
      let nearest=host,best=Infinity;
      for(const state of actors.values())if(state.resource===resource||state.pending?.resource===resource){
        const distance=Math.hypot(state.host.position.x-x,state.host.position.z-z);
        if(distance<best){best=distance;nearest=state.host}
      }
      return {x:nearest.position.x,z:nearest.position.z};
    };
    if(queueAsset)queueAsset(position,2,load,resource.owner);
    else {resource.failed=true;resource.settled=true} // Never bypass admission.
    return resource;
  }
  function attach(actor,host,{tier='patrol',variant='male'}={}){
    detach(actor);if(retired)return null;
    tier=POLICE_TIERS.includes(tier)?tier:'patrol';variant=variant==='female'?'female':'male';
    const state={actor,host,tier,variant,resource:acquire(`${tier}-${variant}`,host),fallback:host.children.map(mesh=>({mesh,visible:mesh.visible})),mesh:null,distance:0,age:0,pose:null};
    actors.set(actor,state);return state;
  }
  function detach(actor){
    const state=actors.get(actor);if(!state)return;
    if(state.pending)release(state.pending.resource);
    for(const {mesh,visible} of state.fallback)mesh.visible=visible;
    if(state.mesh){state.host.remove(state.mesh);state.mesh.geometry.dispose();state.mesh.material.dispose()}
    release(state.resource);actors.delete(actor);
  }
  function update(actor,options={}){
    let state=actors.get(actor);if(!state||retired)return false;
    if(options.tier&&options.tier!==state.tier&&POLICE_TIERS.includes(options.tier)){
      // A tier swap retains the old paint until its replacement has decoded.
      if(state.pending?.tier!==options.tier){if(state.pending)release(state.pending.resource);state.pending={tier:options.tier,resource:acquire(`${options.tier}-${state.variant}`,state.host)}}
    }else if(options.tier&&state.pending){release(state.pending.resource);state.pending=null}
    if(state.pending?.resource.texture){release(state.resource);state.resource=state.pending.resource;state.tier=state.pending.tier;state.pending=null;if(state.mesh){state.mesh.material.map=state.resource.texture;state.mesh.material.needsUpdate=true}}
    const view=options.camera||camera;
    const cameraYaw=view?Math.atan2(view.position.x-state.host.position.x,view.position.z-state.host.position.z):0;
    const pose=policeSpriteFrame(state,{...options,cameraYaw});
    if(!state.mesh&&state.resource.texture){
      state.mesh=new T.Mesh(new T.PlaneGeometry(height*160/192,height),new T.MeshBasicMaterial({map:state.resource.texture,transparent:true,alphaTest:.08,depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide}));
      state.mesh.name=`${state.tier}-${state.variant} painted police`;state.mesh.userData.policePaint=true;state.host.add(state.mesh);
    }
    if(!state.mesh)return false;
    for(const {mesh} of state.fallback)mesh.visible=false;
    const uv=state.mesh.geometry.attributes.uv,u=pose.frame/8,v=1-(pose.row+1)/7;
    uv.setXY(0,u,v+1/7);uv.setXY(1,u+1/8,v+1/7);uv.setXY(2,u,v);uv.setXY(3,u+1/8,v);uv.needsUpdate=true;
    if(view){
      const yaw=state.mesh.rotation.setFromQuaternion(view.quaternion,'YXZ').y;
      state.mesh.quaternion.copy(state.host.quaternion).invert();state.mesh.rotateY(yaw);
      state.mesh.position.set(0,height*(POLICE_SPRITE_LAYOUT.pivot-.5),0).applyQuaternion(state.mesh.quaternion);
    }
    return true;
  }
  return {attach,update,detach,
    inspect(){return {mobile,retired,resources:[...resources.values()].map(r=>({key:r.key,refs:r.refs,loaded:!!r.texture,settled:r.settled,failed:r.failed})),actors:[...actors.values()].map(s=>({tier:s.tier,variant:s.variant,loaded:!!s.mesh,pose:s.pose,distance:s.distance,pending:s.pending?.tier||null}))}},
    dispose(){for(const actor of actors.keys())detach(actor);retired=true}
  };
}
