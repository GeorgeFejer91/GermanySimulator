// Gaussian rendering shares the existing scene clock and render pass.
import {sampleOmenMouth} from './buergeramt-lipsync.js?v=20261013-mouth-audit';
const clamp=value=>Math.max(0,Math.min(1,value));
const TUNNEL_RINGS=32,TUNNEL_AROUND=96;
const MOUTH_SPLATS=96;

export function omenReliefGain(camera={}){
  // Keep the projecting sleeve/prop inside narrow views. Progress, support and
  // the lip rig remain shared; only the final amount of relief is fitted.
  const aspect=Number.isFinite(camera.aspect)?Math.max(.1,camera.aspect):1;
  const fov=Number.isFinite(camera.fov)?Math.max(20,Math.min(120,camera.fov)):69;
  return Math.max(1,Math.min(3.4,5.3*aspect*Math.tan(fov*Math.PI/360)/Math.tan(69*Math.PI/360)));
}

export function omenSplatPose(omen,reducedMotion=false){
  const live=['approach','blackout','glare','unwind'].includes(omen.phase),life=omen.life||{};
  const speech=omen.lipSpeech,owned=omen.phase==='blackout'&&speech?.active&&speech.actor==='aktenkurier'&&['recorded','voice'].includes(speech.mode);
  const mouth=owned?{open:speech.shape[0],spread:speech.shape[1],round:speech.shape[2],bite:speech.shape[3],time:speech.time,viseme:speech.viseme||'estimated'}:sampleOmenMouth(!speech&&omen.phase==='blackout'?omen.speech:null);
  const reveal=live?clamp(life.depth||0):0;
  return {
    live,reveal,
    // The registered body morphs in depth, never dissolves into the room.
    // life.opacity remains the simulation's handover window, not body alpha.
    opacity:live&&life.opacity>0?1:0,
    turn:0,
    pressure:live?clamp(life.pressure||0):0,
    pulse:reducedMotion?0:clamp(life.pulse||0),
    ripple:reducedMotion?0:reveal*(.3+.7*clamp(life.pressure||0))*(omen.speech?.paused ? .15 : 1)*(life.motion??1),
    time:reducedMotion?0:Math.max(0,life.time||0),
    mouth,
  };
}

export async function createAmtSplatOwner({THREE,renderer,scene,actorLayer=0,signal,sparkModule,nowMs=()=>performance.now()}){
  const {SparkRenderer,SplatMesh,dyno}=sparkModule??await import('./assets/vendor/spark/2.3.1/spark.module.js');
  signal?.throwIfAborted();
  const spark=new SparkRenderer({renderer,autoUpdate:false,enableLod:false,enableDriveLod:false,enableLodFetching:false,
    minSortIntervalMs:0,maxStdDev:Math.sqrt(5),maxPixelRadius:48,depthTest:true,depthWrite:false});
  spark.visible=false;spark.layers?.set(actorLayer);
  scene.add(spark);
  const meshes=new Set(),paints=new Set(),retired=new Map(),freed=new WeakSet();
  let paintDepth=null;
  // Sort the shared batch at its body anchors, including after native paint
  // retires. Spark's own origin does not locate the courier in the room.
  const transparentSort=(a,b)=>a.groupOrder-b.groupOrder||a.renderOrder-b.renderOrder||
    (b.object===spark&&paintDepth!==null?paintDepth:b.z)-(a.object===spark&&paintDepth!==null?paintDepth:a.z)||a.id-b.id;
  renderer.setTransparentSort?.(transparentSort);
  let pending=null,lastUpdate=-Infinity,startedUpdates=0,completedUpdates=0,failure='',disposed=false,disposePromise=null,reflectedPaintOnly=false;
  function hide(){spark.visible=false;for(const mesh of meshes)mesh.visible=false;for(const mesh of paints){mesh.visible=false;mesh.userData.anchorActive=false}}
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
    attachPaint(mesh){if(disposed||failure)throw new Error('Bürgeramt paint owner unavailable');mesh.layers?.set(actorLayer);paints.add(mesh);scene.add(mesh)},
    retirePaint(mesh){paints.delete(mesh);mesh.visible=false;scene.remove(mesh);if(!paints.size)paintDepth=null},
    withReflectedView(camera,draw){
      const prior=reflectedPaintOnly,visible=spark.visible,poses=[...paints].filter(mesh=>mesh.visible).map(mesh=>[mesh,mesh.rotation.clone()]);
      reflectedPaintOnly=true;spark.visible=false;
      try{
        for(const [mesh] of poses)mesh.rotation.set(0,Math.atan2(camera.position.x-mesh.position.x,camera.position.z-mesh.position.z),0);
        return draw();
      }finally{for(const [mesh,rotation] of poses)mesh.rotation.copy(rotation);reflectedPaintOnly=prior;spark.visible=visible}
    },
    attach(mesh){if(disposed||failure)throw new Error('Bürgeramt splat owner unavailable');if(retired.has(mesh)||freed.has(mesh))throw new Error('Retired splat cannot be attached');if(!meshes.has(mesh)){meshes.add(mesh);scene.add(mesh)}return mesh},
    retire(mesh,cleanup){
      if(!mesh||retired.has(mesh)||freed.has(mesh))return;
      meshes.delete(mesh);mesh.visible=false;scene.remove(mesh);retired.set(mesh,cleanup);
      flushRetired();
    },
    update(camera,rate=60){
      if(disposed||failure||!camera)return null;
      camera.updateMatrixWorld?.(true);
      const visible=[...meshes].filter(mesh=>mesh.visible);
      const painted=[...paints].filter(mesh=>mesh.userData.anchorActive);
      const anchors=painted.length?painted:visible.filter(mesh=>!mesh.userData?.amtSortExclude&&typeof mesh.getWorldPosition==='function');
      // Three r186 sorts homogeneous clip Z without dividing by W.
      paintDepth=anchors.length?anchors.reduce((sum,mesh)=>{mesh.updateMatrixWorld(true);const p=mesh.getWorldPosition(camera.position.clone()).applyMatrix4(camera.matrixWorldInverse),e=camera.projectionMatrix.elements;return sum+e[2]*p.x+e[6]*p.y+e[10]*p.z+e[14]},0)/anchors.length:null;
      spark.renderOrder=Math.max(0,...visible.map(mesh=>mesh.renderOrder??0));
      if(spark.material)spark.material.depthTest=true;
      spark.visible=visible.length>0&&!reflectedPaintOnly;
      // Secondary views adapt depth order without dispatching another GPU
      // update or replacing the main camera's asynchronous sort owner.
      if(rate===0||!visible.length||pending)return pending;
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
    inspect(){return{ready:!disposed&&!failure,visible:!disposed&&spark.visible,pending:!!pending,meshes:meshes.size,paintedAnchors:paints.size,retired:retired.size,activeSplats:spark.activeSplats||0,startedUpdates,completedUpdates,failure,disposed}},
    dispose(){
      if(disposePromise)return disposePromise;
      disposed=true;hide();scene.remove(spark);
      renderer.setTransparentSort?.(null);
      for(const mesh of [...paints])owner.retirePaint(mesh);
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
    const response=await fetch(new URL('./assets/buergeramt/omen/aktenkurier.splat?v=20261011-mouth-consistency',import.meta.url),{signal});
    if(!response.ok)throw new Error('Omen splat unavailable');
    bytes=await response.arrayBuffer();count=bytes.byteLength/32;
    if(!Number.isInteger(count)||count<1||count>40000-MOUTH_SPLATS)throw new Error('Invalid omen splat size');
    signal?.throwIfAborted();
  }catch(error){if(!sharedOwner)await owner.dispose();throw error}
  const depth=dyno.dynoFloat(0),clock=dyno.dynoFloat(0),ripple=dyno.dynoFloat(0),pulse=dyno.dynoFloat(0);
  const reliefGain=dyno.dynoFloat(3.4);
  const mouth=dyno.dynoVec2(new THREE.Vector2()),mouthShape=dyno.dynoVec2(new THREE.Vector2());
  const modifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>{
    const effect=new dyno.Dyno({
      inTypes:{gsplat:dyno.Gsplat,depth:'float',clock:'float',ripple:'float',pulse:'float',reliefGain:'float',mouth:'vec2',mouthShape:'vec2'},
      outTypes:{gsplat:dyno.Gsplat},inputs:{gsplat,depth,clock,ripple,pulse,reliefGain,mouth,mouthShape},
      statements:({inputs:i,outputs:o})=>[`
        ${o.gsplat} = ${i.gsplat};
        vec3 p = ${i.gsplat}.center;
        // Registered lip centre: detail pixel (346.5,134), in floor-based metres.
        float lipX = 0.0636, lipY = 1.64315;
        float opening = ${i.mouth}.x, spreading = ${i.mouth}.y;
        float rounding = ${i.mouthShape}.x, biting = ${i.mouthShape}.y;
        if (p.z > 0.30) {
          // A small, depth-sorted Gaussian oral cavity; absent at rest.
          p.x = lipX+(p.x-lipX)*(1.0+spreading*0.24-rounding*0.30);
          p.y = lipY-opening*0.013+(p.y-lipY)*opening*3.0;
          // Mouth samples reach Z=.156: keep the opening in front of the lip
          // crease on both sides, with relief following the curved face.
          p.z = 0.174-12.0*(p.x-lipX)*(p.x-lipX)+rounding*0.010;
          ${o.gsplat}.rgba.a *= smoothstep(0.015,0.16,opening);
          ${o.gsplat}.scales.y *= max(0.06,opening*3.0);
        } else if (p.z > 0.0) {
          float dx = p.x-lipX, dy = p.y-lipY;
          float side = 1.0-smoothstep(0.034,0.068,abs(dx));
          float jaw = side*(1.0-smoothstep(-0.006,0.003,dy))*smoothstep(-0.080,-0.035,dy);
          float lips = side*(1.0-smoothstep(0.006,0.020,abs(dy)));
          p.y -= opening*0.027*jaw;
          p.y += biting*0.003*lips*(1.0-smoothstep(-0.004,0.003,dy));
          p.x += dx*lips*(spreading*0.20-rounding*0.28);
          p.z += rounding*0.013*lips;
          ${o.gsplat}.scales.y *= 1.0+opening*0.18*jaw;
        }
        float expand = ${i.depth};
        float t = ${i.clock};
        float wave = ${i.ripple};
        // Sculpted rear shell stays absent while the projection is still flat.
        float shell = p.z < 0.0 ? smoothstep(0.06, 0.65, expand) : 1.0;
        float planted = smoothstep(0.12, 0.72, p.y);
        float face = smoothstep(1.44, 1.7, p.y);
        // Amplify the authored anatomy, including the nose, hands and files.
        // Local +Z points at the viewer; soles retain their original relief.
        // Mouth kernels pass through this same field after articulation.
        float relief = p.z;
        float volume = expand*planted;
        p.z *= expand*mix(1.0,${i.reliefGain},planted);
        p.x *= 1.0+volume*.12;
        // Coherent coat billow rather than unrelated per-point scatter. A rigid
        // file/hand group and the face keep their authored depth relationships.
        float cloth = planted*(1.0-face)*(1.0-smoothstep(.17,.20,relief));
        float swell = sin(expand*3.14159265)*wave;
        float breath = wave*(.025+.085*${i.pulse});
        p.x += cloth*(swell*.045+breath*.18)*sin(p.y*5.0-t*.8);
        p.z += cloth*(swell*.16*cos(p.y*5.0+p.x*4.0)+breath);
        p.z += volume*wave*${i.pulse}*.06;
        ${o.gsplat}.center = p;
        ${o.gsplat}.scales.z *= mix(0.12, 1.0, expand);
        // The widening paint needs matching support, without smearing detail.
        ${o.gsplat}.scales.x *= 1.0+volume*.12;
        ${o.gsplat}.rgba.a *= shell;
        // A directional key makes the sculpted cheek/coat curvature legible
        // even head-on. Light is geometry-owned, including in reduced motion.
        vec3 coatNormal = normalize(vec3(p.x*3.2,(p.y-1.05)*.28,max(.055,abs(relief))*2.2));
        vec3 headNormal = normalize(vec3((p.x-.055)*7.5,(p.y-1.65)*3.2,.48));
        vec3 normal = normalize(mix(coatNormal,headNormal,face));
        float key = max(0.0,dot(normal,normalize(vec3(-.72,.55,.85))));
        float light = .34+key*1.04;
        // Papers remain planar and readable rather than acquiring coat folds.
        light = mix(light,.94,smoothstep(.19,.205,relief)*(1.0-face));
        ${o.gsplat}.rgba.rgb *= mix(1.0,light,expand*.82);
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
    mesh=new SplatMesh({maxSplats:count+MOUTH_SPLATS,lod:false,enableLod:false,editable:false,raycastable:false,
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
        // Elliptical, overlapping dark kernels stay within the painted lip width.
        for(let row=0;row<8;row++)for(let column=0;column<12;column++){
          const u=(column+.5)/6-1,v=(row+.5)/4-1,edge=Math.max(0,1-u*u-v*v);
          point.set(.0636+u*.026,1.64315+v*.006,.4);
          scale.set(.0027,.0018,.0007);quaternion.set(0,0,0,1);color.setRGB(.090+.035*Math.abs(v),.031,.024);
          splats.pushSplat(point,scale,quaternion,.95*Math.min(1,edge*3),color);
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
    mesh.visible=false;tunnel.visible=false;tunnel.userData.amtSortExclude=true;
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
      mesh.visible=pose.opacity>0;tunnel.visible=pose.live;
      if(pose.opacity>0&&readyAfterSort===null)readyAfterSort=owner.inspect().startedUpdates+1;
      if(!pose.opacity)readyAfterSort=null;
      if(pose.live){
        depth.value=pose.reveal;clock.value=pose.time;ripple.value=pose.ripple;pulse.value=pose.pulse*pose.pressure;
        reliefGain.value=omenReliefGain(camera);
        mouth.value.set(pose.mouth.open,pose.mouth.spread);mouthShape.value.set(pose.mouth.round,pose.mouth.bite);
        mesh.opacity=pose.opacity;
        mesh.renderOrder=actor.renderOrder??0;mesh.userData.amtForeground=!!actor.userData?.amtForeground;
        tunnel.renderOrder=mesh.renderOrder;tunnel.userData.amtForeground=mesh.userData.amtForeground;
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
    inspect(){const status=owner.inspect();return {ready:!disposed&&status.ready,count,mouthSplats:MOUTH_SPLATS,tunnelCount:TUNNEL_RINGS*TUNNEL_AROUND,tunnelVisible:!disposed&&tunnel.visible,tunnelTime:tunnelClock.value,facingY:mesh.rotation.y,reliefGain:reliefGain.value,bytes:bytes.byteLength,failure:status.failure,activeSplats:status.activeSplats,pending:status.pending,visible:!disposed&&mesh.visible&&status.visible,...pose}},
    dispose(){
      if(disposed)return;disposed=true;
      owner.retire(mesh);owner.retire(tunnel);
      if(!sharedOwner)return owner.dispose();
    },
  };
}
