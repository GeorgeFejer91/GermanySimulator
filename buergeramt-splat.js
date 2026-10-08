// Gaussian rendering shares the existing scene clock and render pass.
const clamp=value=>Math.max(0,Math.min(1,value));
const TUNNEL_RINGS=32,TUNNEL_AROUND=96;

export function omenSplatPose(omen,reducedMotion=false){
  const live=['approach','blackout','glare'].includes(omen.phase),life=omen.life||{};
  const reveal=live?clamp(life.depth||0):0;
  return {
    live,reveal,
    opacity:live?clamp(life.opacity||0):0,
    turn:0,
    pressure:live?clamp(life.pressure||0):0,
    pulse:reducedMotion?0:clamp(life.pulse||0),
    ripple:reducedMotion?0:reveal*(.3+.7*clamp(life.pressure||0))*(omen.speech?.paused ? .15 : 1),
    time:reducedMotion?0:Math.max(0,life.time||0),
  };
}

export async function createAmtSplatOwner({THREE,renderer,scene,signal,sparkModule,nowMs=()=>performance.now()}){
  const {SparkRenderer,SplatMesh,dyno}=sparkModule??await import('./assets/vendor/spark/2.3.1/spark.module.js');
  signal?.throwIfAborted();
  const spark=new SparkRenderer({renderer,autoUpdate:false,enableLod:false,enableDriveLod:false,enableLodFetching:false,
    minSortIntervalMs:0,maxStdDev:Math.sqrt(5),maxPixelRadius:48,depthTest:true,depthWrite:false});
  spark.visible=false;
  scene.add(spark);
  const meshes=new Set(),retired=new Map(),freed=new WeakSet();
  let pending=null,lastUpdate=-Infinity,startedUpdates=0,completedUpdates=0,failure='',disposed=false,disposePromise=null;
  function hide(){spark.visible=false;for(const mesh of meshes)mesh.visible=false}
  function fail(error){failure=error?.message||String(error);hide()}
  function flushRetired(){
    if(pending)return;
    for(const [mesh,cleanup] of retired){
      retired.delete(mesh);
      freed.add(mesh);
      try{mesh.dispose?.()}catch(error){fail(error)}
      try{cleanup?.()}catch(error){fail(error)}
    }
  }
  const owner={
    spark,SplatMesh,dyno,
    attach(mesh){if(disposed||failure)throw new Error('Bürgeramt splat owner unavailable');if(retired.has(mesh)||freed.has(mesh))throw new Error('Retired splat cannot be attached');if(!meshes.has(mesh)){meshes.add(mesh);scene.add(mesh)}return mesh},
    retire(mesh,cleanup){
      if(!mesh||retired.has(mesh)||freed.has(mesh))return;
      meshes.delete(mesh);mesh.visible=false;scene.remove(mesh);retired.set(mesh,cleanup);
      flushRetired();
    },
    update(camera,rate=60){
      if(disposed||failure||!camera)return null;
      const visible=[...meshes].filter(mesh=>mesh.visible);
      spark.visible=visible.length>0;
      if(!visible.length||pending)return pending;
      try{
        const hz=Math.max(1,Math.min(60,Number.isFinite(rate)?rate:60)),now=nowMs();
        if(now-lastUpdate<1000/hz)return null;
        lastUpdate=now;
        for(const mesh of visible)mesh.updateMatrixWorld?.(true);
        spark.setDirty?.();
        startedUpdates++;
        // The catch makes fire-and-forget render-pass calls safe. Retired meshes
        // and Spark readback targets live until this exact update settles.
        pending=Promise.resolve().then(()=>spark.update({scene,camera})).then(()=>{completedUpdates++}).catch(fail).finally(()=>{pending=null;flushRetired()});
        return pending;
      }catch(error){fail(error);return null}
    },
    inspect(){return{ready:!disposed&&!failure,visible:!disposed&&spark.visible,pending:!!pending,meshes:meshes.size,retired:retired.size,activeSplats:spark.activeSplats||0,startedUpdates,completedUpdates,failure,disposed}},
    dispose(){
      if(disposePromise)return disposePromise;
      disposed=true;hide();scene.remove(spark);
      for(const mesh of [...meshes])owner.retire(mesh);
      signal?.removeEventListener?.('abort',onAbort);
      disposePromise=Promise.resolve(pending).then(()=>{flushRetired();spark.dispose()}).catch(fail);
      return disposePromise;
    },
  };
  const onAbort=()=>{void owner.dispose()};
  signal?.addEventListener?.('abort',onAbort,{once:true});
  if(signal?.aborted){await owner.dispose();signal.throwIfAborted()}
  return owner;
}

export async function createOmenSplat({THREE,renderer,scene,signal,owner:sharedOwner}){
  const owner=sharedOwner??await createAmtSplatOwner({THREE,renderer,scene,signal});
  const {SplatMesh,dyno}=owner;
  try{signal?.throwIfAborted()}catch(error){if(!sharedOwner)await owner.dispose();throw error}
  let bytes,count;
  try{
    const response=await fetch(new URL('./assets/buergeramt/omen/aktenkurier.splat',import.meta.url),{signal});
    if(!response.ok)throw new Error('Omen splat unavailable');
    bytes=await response.arrayBuffer();count=bytes.byteLength/32;
    if(!Number.isInteger(count)||count<1||count>40000)throw new Error('Invalid omen splat size');
    signal?.throwIfAborted();
  }catch(error){if(!sharedOwner)await owner.dispose();throw error}
  const depth=dyno.dynoFloat(0),clock=dyno.dynoFloat(0),ripple=dyno.dynoFloat(0),pulse=dyno.dynoFloat(0);
  const modifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>{
    const effect=new dyno.Dyno({
      inTypes:{gsplat:dyno.Gsplat,depth:'float',clock:'float',ripple:'float',pulse:'float'},
      outTypes:{gsplat:dyno.Gsplat},inputs:{gsplat,depth,clock,ripple,pulse},
      statements:({inputs:i,outputs:o})=>[`
        ${o.gsplat} = ${i.gsplat};
        vec3 p = ${i.gsplat}.center;
        float expand = ${i.depth};
        float t = ${i.clock};
        float wave = ${i.ripple};
        // Sculpted rear shell stays absent while the projection is still flat.
        float shell = p.z < 0.0 ? smoothstep(0.06, 0.65, expand) : 1.0;
        float planted = smoothstep(0.12, 0.72, p.y);
        float face = smoothstep(1.44, 1.7, p.y);
        float tremor = sin(p.y*15.0-t*2.0+p.x*8.0);
        float loosen = sin(expand*3.14159265)*wave;
        p.z *= expand;
        p.x += loosen*planted*(1.0-face*.7)*.035*sin(p.y*73.0+p.x*121.0);
        p.z += loosen*planted*.09*cos(p.y*33.0-p.x*52.0);
        p.x += wave*planted*(1.0-face*.72)*0.014*tremor;
        // Local +Z faces the viewer: the coat pushes towards them with the score.
        p.z += wave*planted*(1.0-face*.8)*(.02+.055*${i.pulse});
        ${o.gsplat}.center = p;
        ${o.gsplat}.scales.z *= mix(0.12, 1.0, expand);
        ${o.gsplat}.scales *= 1.0+loosen*.55;
        ${o.gsplat}.rgba.a *= shell;
        // Bruised, cold paint; preserve face detail without rainbow cycling.
        vec3 ink = vec3(.39,.35,.50)+vec3(.07,.035,.09)*sin(p.y*6.5-t*.65);
        ${o.gsplat}.rgba.rgb = mix(${o.gsplat}.rgba.rgb,
          ${o.gsplat}.rgba.rgb*ink,
          wave*(.42-face*.32));
      `],
    });
    return {gsplat:effect.outputs.gsplat};
  });
  const tunnelClock=dyno.dynoFloat(0),tunnelAim=dyno.dynoVec2(new THREE.Vector2()),tunnelFov=dyno.dynoFloat(1);
  const tunnelModifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>{
    const effect=new dyno.Dyno({
      inTypes:{gsplat:dyno.Gsplat,clock:'float',aim:'vec2',fov:'float',pulse:'float'},
      outTypes:{gsplat:dyno.Gsplat},inputs:{gsplat,clock:tunnelClock,aim:tunnelAim,fov:tunnelFov,pulse},
      statements:({inputs:i,outputs:o})=>[`
        ${o.gsplat} = ${i.gsplat};
        vec3 p = ${i.gsplat}.center;
        float u = -p.z;
        float a = atan(p.y,p.x)+${i.clock}*.18+u*4.8;
        float curl = 1.0-.10*${i.pulse}+.075*sin(a*5.0-u*12.0+${i.clock}*1.2);
        float widening = 1.0-u;
        vec2 radius = vec2(.58+widening*1.35,1.00+widening*.95)*${i.fov};
        p.xy = u*(vec2(cos(a),sin(a))*radius*curl+${i.aim});
        ${o.gsplat}.center = p;
        ${o.gsplat}.scales.xy *= ${i.fov};
        float veins = .5+.5*sin(a*3.0-u*19.0-${i.clock}*.4);
        vec3 ink = mix(vec3(.009,.005,.018),vec3(.12,.035,.17),veins*.65);
        ${o.gsplat}.rgba.rgb = ink;
      `],
    });
    return {gsplat:effect.outputs.gsplat};
  });
  let mesh,tunnel,disposed=false;
  try{
    mesh=new SplatMesh({maxSplats:count,lod:false,enableLod:false,editable:false,raycastable:false,
      objectModifier:modifier,
      constructSplats:async splats=>{
        const data=new DataView(bytes),point=new THREE.Vector3(),scale=new THREE.Vector3(),quaternion=new THREE.Quaternion(),color=new THREE.Color();
        // Small chunks bound the optional install work; no loader worker pool persists.
        for(let n=0;n<count;n++){
          if(n%2048===0){signal.throwIfAborted();if(n)await new Promise(resolve=>setTimeout(resolve,0))}
          const i=n*32;
          point.set(data.getFloat32(i,true),data.getFloat32(i+4,true),data.getFloat32(i+8,true));
          scale.set(data.getFloat32(i+12,true),data.getFloat32(i+16,true),data.getFloat32(i+20,true));
          quaternion.set((data.getUint8(i+29)-128)/128,(data.getUint8(i+30)-128)/128,(data.getUint8(i+31)-128)/128,(data.getUint8(i+28)-128)/128).normalize();
          color.setRGB(data.getUint8(i+24)/255,data.getUint8(i+25)/255,data.getUint8(i+26)/255);
          splats.pushSplat(point,scale,quaternion,data.getUint8(i+27)/255,color);
        }
      },
    });
    await mesh.initialized;signal?.throwIfAborted();
    // A camera-local, hollow volume: real depth-sorted Gaussians, no extra asset.
    tunnel=new SplatMesh({maxSplats:TUNNEL_RINGS*TUNNEL_AROUND,lod:false,enableLod:false,
      editable:false,raycastable:false,objectModifier:tunnelModifier,constructSplats:splats=>{
        const point=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion(),color=new THREE.Color(.015,.01,.025);
        for(let ring=0;ring<TUNNEL_RINGS;ring++)for(let n=0;n<TUNNEL_AROUND;n++){
          const u=.12+.88*ring/(TUNNEL_RINGS-1),a=(n+.5*(ring%2))/TUNNEL_AROUND*Math.PI*2;
          point.set(Math.cos(a)*u,Math.sin(a)*u,-u);
          const size=u*(.070+.015*Math.sin(n*2.4+ring*.9));
          scale.set(size,size*1.35,.027);
          splats.pushSplat(point,scale,rotation,.80,color);
        }
      }});
    await tunnel.initialized;signal?.throwIfAborted();
    mesh.visible=false;tunnel.visible=false;
    owner.attach(mesh);owner.attach(tunnel);
  }catch(error){
    if(mesh)owner.retire(mesh);
    if(tunnel)owner.retire(tunnel);
    if(!sharedOwner)await owner.dispose();
    throw error;
  }
  let pose=omenSplatPose({}),readyAfterSort=null;
  const target=new THREE.Vector3();
  return {
    update(omen,actor,camera,reducedMotion=false){
      if(disposed||!owner.inspect().ready)return 0;
      pose=omenSplatPose(omen,reducedMotion);
      mesh.visible=tunnel.visible=pose.live;
      if(pose.live&&readyAfterSort===null)readyAfterSort=owner.inspect().startedUpdates+1;
      if(!pose.live)readyAfterSort=null;
      if(pose.live){
        depth.value=pose.reveal;clock.value=pose.time;ripple.value=pose.ripple;pulse.value=pose.pulse*pose.pressure;
        mesh.opacity=pose.opacity;
        mesh.position.set(actor.position.x,0,actor.position.z);
        mesh.rotation.y=Math.atan2(camera.position.x-actor.position.x,camera.position.z-actor.position.z);
        mesh.needsUpdate=true;
        camera.updateMatrixWorld(true);
        target.set(actor.position.x,1.04,actor.position.z);camera.worldToLocal(target);
        const distance=Math.max(.8,-target.z);
        tunnel.position.copy(camera.position);tunnel.quaternion.copy(camera.quaternion);
        tunnel.scale.setScalar(distance);
        tunnelAim.value.set(target.x/distance,target.y/distance);
        tunnelFov.value=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5));
        tunnelClock.value=reducedMotion?0:pose.time;
        tunnel.opacity=clamp(omen.strength||0)*pose.reveal;
        tunnel.needsUpdate=true;
      }
      if(!sharedOwner)owner.update(camera,30);
      return readyAfterSort!==null&&owner.inspect().completedUpdates>=readyAfterSort&&owner.spark.activeSplats>0?pose.opacity:0;
    },
    inspect(){const status=owner.inspect();return {ready:!disposed&&status.ready,count,tunnelCount:TUNNEL_RINGS*TUNNEL_AROUND,tunnelVisible:!disposed&&tunnel.visible,tunnelTime:tunnelClock.value,facingY:mesh.rotation.y,bytes:bytes.byteLength,failure:status.failure,activeSplats:status.activeSplats,pending:status.pending,visible:!disposed&&mesh.visible&&status.visible,...pose}},
    dispose(){
      if(disposed)return;disposed=true;
      owner.retire(mesh);owner.retire(tunnel);
      if(!sharedOwner)return owner.dispose();
    },
  };
}
