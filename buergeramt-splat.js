// Omen-only Gaussian projection. The existing episode owns all timing and movement.
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t)};
const TUNNEL_RINGS=32,TUNNEL_AROUND=96;

export function omenSplatPose(omen,reducedMotion=false){
  const live=omen.phase==='blackout'||omen.phase==='glare';
  const time=Math.max(0,omen.revealTime||0),reveal=live?smooth(time/1.45):0;
  const tension=clamp(omen.speech?.tension||0);
  return {
    live,reveal,
    opacity:live?smooth(time/.52):0,
    turn:reducedMotion?0:reveal*(.23+.12*Math.sin(time*.85)),
    ripple:reducedMotion?0:reveal*(.45+.55*tension)*(omen.speech?.paused ? .25 : 1),
    time:reducedMotion?0:time,
  };
}

export async function createOmenSplat({THREE,renderer,scene,signal}){
  const {SparkRenderer,SplatMesh,dyno}=await import('./assets/vendor/spark/2.3.1/spark.module.js');
  signal.throwIfAborted();
  const response=await fetch(new URL('./assets/buergeramt/omen/aktenkurier.splat',import.meta.url),{signal});
  if(!response.ok)throw new Error('Omen splat unavailable');
  const bytes=await response.arrayBuffer(),count=bytes.byteLength/32;
  if(!Number.isInteger(count)||count<1||count>40000)throw new Error('Invalid omen splat size');
  signal.throwIfAborted();
  const depth=dyno.dynoFloat(0),clock=dyno.dynoFloat(0),ripple=dyno.dynoFloat(0);
  const modifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>{
    const effect=new dyno.Dyno({
      inTypes:{gsplat:dyno.Gsplat,depth:'float',clock:'float',ripple:'float'},
      outTypes:{gsplat:dyno.Gsplat},inputs:{gsplat,depth,clock,ripple},
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
        p.z += wave*planted*0.018*sin(p.y*10.0+t*1.4);
        ${o.gsplat}.center = p;
        ${o.gsplat}.scales.z *= mix(0.12, 1.0, expand);
        ${o.gsplat}.scales *= 1.0+loosen*.55;
        ${o.gsplat}.rgba.a *= shell;
        vec3 prism = 0.5+0.5*cos(vec3(0.0,2.094,4.189)+p.y*6.5-t*.65);
        // Keep eyes and facial paint readable; chromatic motion lives in the coat.
        ${o.gsplat}.rgba.rgb = mix(${o.gsplat}.rgba.rgb,
          ${o.gsplat}.rgba.rgb*(.65+prism*.9)+prism*.055,
          wave*(.30-face*.20));
      `],
    });
    return {gsplat:effect.outputs.gsplat};
  });
  const tunnelClock=dyno.dynoFloat(0),tunnelAim=dyno.dynoVec2(new THREE.Vector2()),tunnelFov=dyno.dynoFloat(1);
  const tunnelModifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>{
    const effect=new dyno.Dyno({
      inTypes:{gsplat:dyno.Gsplat,clock:'float',aim:'vec2',fov:'float'},
      outTypes:{gsplat:dyno.Gsplat},inputs:{gsplat,clock:tunnelClock,aim:tunnelAim,fov:tunnelFov},
      statements:({inputs:i,outputs:o})=>[`
        ${o.gsplat} = ${i.gsplat};
        vec3 p = ${i.gsplat}.center;
        float u = -p.z;
        float a = atan(p.y,p.x)+${i.clock}*.18+u*4.8;
        float curl = 1.0+.065*sin(a*5.0-u*12.0+${i.clock}*.3);
        float widening = 1.0-u;
        vec2 radius = vec2(.58+widening*1.35,1.00+widening*.95)*${i.fov};
        p.xy = u*(vec2(cos(a),sin(a))*radius*curl+${i.aim});
        ${o.gsplat}.center = p;
        ${o.gsplat}.scales.xy *= ${i.fov};
        float veins = .5+.5*sin(a*3.0-u*19.0-${i.clock}*.4);
        vec3 ink = mix(vec3(.018,.010,.032),vec3(.23,.082,.32),veins*.75);
        ink += vec3(.008,.042,.040)*(.5+.5*sin(a*4.0+u*13.0));
        ${o.gsplat}.rgba.rgb = ink;
      `],
    });
    return {gsplat:effect.outputs.gsplat};
  });
  let mesh,tunnel,spark,disposed=false,pending=null,failure='',lastUpdate=-Infinity;
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
    await mesh.initialized;signal.throwIfAborted();
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
    await tunnel.initialized;signal.throwIfAborted();
    spark=new SparkRenderer({renderer,autoUpdate:false,enableLod:false,enableDriveLod:false,enableLodFetching:false,
      minSortIntervalMs:0,maxStdDev:Math.sqrt(5),maxPixelRadius:48,depthTest:true,depthWrite:false});
    spark.visible=false;mesh.visible=false;tunnel.visible=false;
    scene.add(spark,mesh,tunnel);
  }catch(error){mesh?.dispose();tunnel?.dispose();spark?.dispose();throw error}
  let pose=omenSplatPose({});
  const target=new THREE.Vector3();
  const release=()=>{mesh.dispose();tunnel.dispose();spark.dispose()};
  return {
    update(omen,actor,camera,reducedMotion=false){
      if(disposed||failure)return 0;
      pose=omenSplatPose(omen,reducedMotion);
      spark.visible=mesh.visible=tunnel.visible=pose.live;
      if(pose.live){
        depth.value=pose.reveal;clock.value=pose.time;ripple.value=pose.ripple;
        mesh.opacity=pose.opacity;
        mesh.position.set(actor.position.x,0,actor.position.z);
        mesh.rotation.y=actor.rotation.y+pose.turn;
        mesh.needsUpdate=true;
        camera.updateMatrixWorld(true);
        target.set(actor.position.x,1.04,actor.position.z);camera.worldToLocal(target);
        const distance=Math.max(.8,-target.z);
        tunnel.position.copy(camera.position);tunnel.quaternion.copy(camera.quaternion);
        tunnel.scale.setScalar(distance);
        tunnelAim.value.set(target.x/distance,target.y/distance);
        tunnelFov.value=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5));
        tunnelClock.value=reducedMotion?0:pose.time;
        tunnel.opacity=clamp(omen.strength||0)*smooth(pose.reveal*2);
        tunnel.needsUpdate=true;
        spark.setDirty();
        // Own the asynchronous GPU readback/sort so teardown cannot free its target
        // while an in-flight update still uses it. No independent animation loop.
        if(!pending&&performance.now()-lastUpdate>=1000/30){
          lastUpdate=performance.now();
          mesh.updateMatrixWorld(true);
          tunnel.updateMatrixWorld(true);
          pending=spark.update({scene,camera}).catch(error=>{
            failure=error.message;spark.visible=mesh.visible=tunnel.visible=false;
          }).finally(()=>{pending=null;if(disposed)release()});
        }
      }
      return spark.activeSplats>0?pose.opacity:0;
    },
    inspect(){return {ready:!disposed&&!failure,count,tunnelCount:TUNNEL_RINGS*TUNNEL_AROUND,tunnelVisible:!disposed&&tunnel.visible,tunnelTime:tunnelClock.value,bytes:bytes.byteLength,failure,activeSplats:spark.activeSplats,pending:!!pending,visible:!disposed&&spark.visible,...pose}},
    dispose(){
      if(disposed)return;disposed=true;
      scene.remove(spark,mesh,tunnel);if(!pending)release();
    },
  };
}
