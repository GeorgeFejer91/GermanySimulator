const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t)};

import {createLevelDoor} from './level-transitions.js?v=20261014-building-levels';

export function entryVortexFrame(elapsed,reducedMotion=false){
  const duration=reducedMotion?.24:3.4,progress=clamp(elapsed/duration);
  return {progress,duration,done:progress===1,reducedMotion};
}

export function buildingTransitionFrame(kind,elapsed,reducedMotion=false){
  if(!['enter','eject','voluntary'].includes(kind))throw new RangeError('Unknown building transition: '+kind);
  const duration=kind==='voluntary'?0:reducedMotion?.24:kind==='enter'?3.82:4.73;
  const progress=duration?clamp(elapsed/duration):1,time=progress*duration;
  let stage='complete',stageProgress=1,collapse=kind==='enter'?1:0,doorOpen=0,fire=0;
  if(progress<1){
    if(reducedMotion){stage='fade';stageProgress=progress;collapse=kind==='enter'?progress:1-progress;doorOpen=1;}
    else if(kind==='enter'){
      stage=time<.42?'door':'collapse';stageProgress=stage==='door'?time/.42:clamp((time-.42)/3.4);
      doorOpen=stage==='door'?ease(stageProgress):1;collapse=stage==='door'?0:stageProgress;
    }else{
      stage=time<1.05?'pull':time<4.45?'rebuild':'close';
      stageProgress=stage==='pull'?time/1.05:stage==='rebuild'?clamp((time-1.05)/3.4):clamp((time-4.45)/.28);
      doorOpen=stage==='pull'?ease(stageProgress/.32):stage==='close'?1-ease(stageProgress):1;
      collapse=stage==='pull'?1:stage==='rebuild'?1-stageProgress:0;
      fire=stage==='pull'?ease((stageProgress-.08)/.82):stage==='rebuild'?1-ease(stageProgress/.18):0;
    }
  }
  return {kind,stage,stageProgress,progress,collapse,doorOpen,fire,duration,done:progress===1,reducedMotion};
}

export function createOfficeRoom(T){
  const scene=new T.Scene();scene.background=new T.Color(0xa7a397);
  scene.add(new T.HemisphereLight(0xf1ead6,0x494e49,2.7));
  const camera=new T.PerspectiveCamera(65,1,.03,80);camera.position.set(0,1.68,2.6);
  const plaster=new T.MeshStandardMaterial({color:0xbeb9a8,roughness:1}),floor=new T.MeshStandardMaterial({color:0x686c64,roughness:1}),wood=new T.MeshStandardMaterial({color:0x61574a,roughness:.85});
  function box(w,h,d,x,y,z,material){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);scene.add(mesh)}
  box(9,.12,11,0,-.06,-1,floor);box(9,3.6,.12,0,1.8,-6.5,plaster);
  for(const side of [-1,1]){box(.12,3.6,11,side*4.5,1.8,-1,plaster);box(3.7,3.6,.12,side*2.65,1.8,4.5,plaster)}
  box(1.6,1.2,.12,0,3,4.5,plaster);box(9,.1,11,0,3.65,-1,plaster);
  box(3.8,.16,1.25,0,1,-3.7,wood);for(const side of [-1,1])box(.3,.92,1,side*1.5,.46,-3.7,wood);
  box(1.4,1.7,.5,-3.4,.85,-5.9,wood);
  const door=createLevelDoor(T,{width:1.6,height:2.4});door.group.position.z=4.4;door.group.rotation.y=Math.PI;scene.add(door.group);
  return {scene,camera,door,render(renderer,view=camera){view.aspect=innerWidth/innerHeight;view.updateProjectionMatrix();renderer.render(scene,view)},
    dispose(){door.dispose();const materials=new Set();scene.traverse(node=>{node.geometry?.dispose();if(node.material)materials.add(node.material)});materials.forEach(material=>material.dispose());scene.clear()}};
}

export function sampleEjectionCamera(T,camera,source,door,progress){
  const t=ease(progress),distance=source.position.distanceTo(door),forward=new T.Vector3(0,0,-1).applyQuaternion(source.quaternion);
  const end=door.clone().add(new T.Vector3(0,0,.9));
  const a=source.position.clone().addScaledVector(forward,-Math.min(2,distance*.18));
  const b=door.clone().add(new T.Vector3(Math.min(1.2,distance*.06),.12,-Math.min(2,distance*.2)));
  const u=1-t;
  camera.position.copy(source.position).multiplyScalar(u*u*u).addScaledVector(a,3*u*u*t).addScaledVector(b,3*u*t*t).addScaledVector(end,t*t*t);
  const rotation=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(end,door.clone().add(new T.Vector3(0,0,3)),new T.Vector3(0,1,0)));
  camera.quaternion.copy(source.quaternion).slerp(rotation,ease(t*1.5));
  camera.fov=source.fov+Math.sin(Math.PI*t)*14;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  return camera;
}

const sourceGLSL=`
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  vec3 sourcePoint(vec2 uv){
    float depth=min(texture2D(uDepth,uv).r,.9999);
    vec4 p=uInverse*vec4(uv*2.-1.,depth*2.-1.,1.);
    return p.xyz/p.w;
  }
  float destination(vec3 p){
    vec3 inside=step(uBoundsMin-vec3(.035),p)*step(p,uBoundsMax+vec3(.035));
    return inside.x*inside.y*inside.z;
  }
  float travel(vec2 cell,vec3 p){
    float seed=hash(cell),building=destination(p);
    float distanceToDoor=min(length((cell/uGrid-uDoorUv)*vec2(uAspect,1.)),1.5);
    float delay=mix(.025+.08*distanceToDoor+.075*seed,.74+.025*seed,building);
    float finish=mix(.70,.985,building);
    return clamp((uProgress-delay)/(finish-delay),0.,1.);
  }
`;

export function createLevelVortex({THREE:T,renderer,scene,camera,door,bounds,mobile=false,reducedMotion=false}){
  const drawing=renderer.getDrawingBufferSize(new T.Vector2()),factor=Math.min(1,(mobile?640:960)/Math.max(drawing.x,drawing.y));
  const width=Math.max(1,Math.round(drawing.x*factor)),height=Math.max(1,Math.round(drawing.y*factor));
  const target=new T.WebGLRenderTarget(width,height,{depthBuffer:!reducedMotion,stencilBuffer:false});
  if(!reducedMotion)target.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);
  const previous=renderer.getRenderTarget();
  try{renderer.setRenderTarget(target);renderer.render(scene,camera)}
  catch(error){target.dispose();throw error}
  finally{renderer.setRenderTarget(previous)}
  camera.updateMatrixWorld(true);
  const projection=camera.projectionMatrix.clone(),view=camera.matrixWorldInverse.clone();
  const inverse=new T.Matrix4().multiplyMatrices(projection,view).invert(),doorNdc=door.clone().project(camera);
  const doorUv=new T.Vector2((doorNdc.x+1)/2,(doorNdc.y+1)/2),aspect=drawing.x/drawing.y;
  const cols=Math.max(32,Math.round(Math.sqrt((mobile?7000:18000)*aspect))),rows=Math.max(24,Math.round(cols/aspect));
  const box=bounds||new T.Box3(door.clone().addScalar(-.1),door.clone().addScalar(.1));
  const uniforms={uImage:{value:target.texture},uDepth:{value:target.depthTexture},uProgress:{value:0},uReduced:{value:reducedMotion?1:0},
    uGrid:{value:new T.Vector2(cols,rows)},uDoorUv:{value:doorUv},uAspect:{value:aspect},uInverse:{value:inverse},uView:{value:view},uProjection:{value:projection},
    uDoor:{value:door.clone().applyMatrix4(view)},uBoundsMin:{value:box.min.clone()},uBoundsMax:{value:box.max.clone()}};
  const effectScene=new T.Scene();effectScene.background=new T.Color(0x020103);
  const effectCamera=new T.OrthographicCamera(-1,1,1,-1,0,1),sheetGeometry=new T.PlaneGeometry(2,2);
  const sheetMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D uImage,uDepth;uniform float uProgress,uReduced,uAspect;
      uniform vec2 uGrid,uDoorUv;uniform mat4 uInverse;uniform vec3 uBoundsMin,uBoundsMax;${sourceGLSL}
      void main(){
        vec3 color=texture2D(uImage,vUv).rgb;
        vec2 cell=floor(vUv*uGrid)+.5;
        float age=travel(cell,sourcePoint(cell/uGrid));
        float alpha=uReduced>.5?1.-uProgress:1.-smoothstep(0.,.17,age);
        vec2 p=(vUv-uDoorUv)*vec2(uAspect,1.);
        float radius=length(p),angle=atan(p.y,p.x);
        float rim=exp(-pow((radius-.027)/.008,2.))*smoothstep(0.,.07,uProgress)*(1.-smoothstep(.91,1.,uProgress))*(1.-uReduced);
        color=mix(color,vec3(.83,.38,.055)*(.7+.3*sin(angle*4.-uProgress*26.)),rim);
        gl_FragColor=vec4(color,max(alpha,rim*.88));
        #include <colorspace_fragment>
      }`});
  const sheet=new T.Mesh(sheetGeometry,sheetMaterial);sheet.frustumCulled=false;effectScene.add(sheet);
  let particleGeometry=null,particleMaterial=null;
  if(!reducedMotion){
    const quad=new T.PlaneGeometry(2,2);particleGeometry=new T.InstancedBufferGeometry();
    particleGeometry.index=quad.index;particleGeometry.attributes=quad.attributes;
    const cells=new Float32Array(cols*rows*2);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*2;cells[i]=x+.5;cells[i+1]=y+.5}
    particleGeometry.setAttribute('aCell',new T.InstancedBufferAttribute(cells,2));particleGeometry.instanceCount=cols*rows;
    particleMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
      vertexShader:`attribute vec2 aCell;varying vec2 vGaussian;varying vec3 vColor;varying float vAlpha;
        uniform sampler2D uImage,uDepth;uniform vec2 uGrid,uDoorUv;uniform float uProgress,uAspect,uReduced;
        uniform mat4 uInverse,uView,uProjection;uniform vec3 uDoor,uBoundsMin,uBoundsMax;${sourceGLSL}
        void main(){
          vec2 uv=aCell/uGrid;vec3 source=sourcePoint(uv),start=(uView*vec4(source,1.)).xyz;
          float age=travel(aCell,source),collapse=age*age*(3.-2.*age),seed=hash(aCell);
          vec3 offset=start-uDoor;
          float angle=collapse*11.+sin(age*3.14159265)*(.5+seed);
          mat2 rotation=mat2(cos(angle),sin(angle),-sin(angle),cos(angle));
          vec3 p=uDoor+vec3(rotation*offset.xy,offset.z)*(1.-collapse);
          p.xy+=vec2(sin(seed*31.+age*10.),cos(seed*47.+age*8.))*sin(age*3.14159265)*.21;
          vec4 clip=uProjection*vec4(p,1.);
          vec2 axis=normalize((clip.xy/clip.w-(uDoorUv*2.-1.))*vec2(uAspect,1.)+vec2(.0001));
          vec2 tangent=vec2(-axis.y,axis.x);
          vec2 splat=(axis*position.x*(1.+sin(age*3.14159265)*1.1)+tangent*position.y)*vec2(1./uAspect,1.);
          clip.xy+=splat*(1.85/uGrid.y)*mix(1.,.13,collapse)*clip.w;
          gl_Position=clip;vGaussian=position.xy;vColor=texture2D(uImage,uv).rgb;
          vAlpha=smoothstep(0.,.12,age)*(1.-smoothstep(.91,1.,age))*(1.-uReduced);
        }`,
      fragmentShader:`varying vec2 vGaussian;varying vec3 vColor;varying float vAlpha;
        void main(){gl_FragColor=vec4(vColor,exp(-dot(vGaussian,vGaussian)*3.2)*vAlpha);
          #include <colorspace_fragment>
        }`});
    const particles=new T.Mesh(particleGeometry,particleMaterial);particles.frustumCulled=false;particles.renderOrder=1;effectScene.add(particles);
  }
  let disposed=false,progress=0;
  return {
    render(value,reduce=reducedMotion){if(disposed)return;progress=clamp(value);uniforms.uProgress.value=progress;uniforms.uReduced.value=reduce?1:0;renderer.render(effectScene,effectCamera)},
    inspect(){return {progress,disposed,splats:particleGeometry?.instanceCount||0,capture:[width,height],captureBytes:width*height*(target.depthTexture?8:4),door:door.toArray(),doorUv:doorUv.toArray(),destinationBounds:[box.min.toArray(),box.max.toArray()],drawCalls:particleGeometry?2:1}},
    dispose(){if(disposed)return;disposed=true;sheetGeometry.dispose();sheetMaterial.dispose();particleGeometry?.dispose();particleMaterial?.dispose();target.dispose();effectScene.clear()}
  };
}

export function createEjectionFlames(T,renderer){
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),geometry=new T.PlaneGeometry(2,2);
  const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{uStrength:{value:0},uTime:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float uStrength,uTime;
      void main(){
        vec2 p=vUv;float t=uTime*3.;
        float bend=sin(p.y*11.-t*2.+sin(p.x*9.))*.045;
        float tongues=sin((p.x+bend)*37.+sin(p.x*13.-t)*2.)*.095+sin(p.x*71.+t*1.7)*.035;
        float edge=pow(abs(p.x-.5)*2.,5.)*.36;
        float shape=.03+uStrength*1.13-p.y+edge+tongues*(.35+p.y);
        float fire=smoothstep(-.06,.06,shape);
        float streak=.5+.25*sin(p.x*46.+sin(p.y*12.-t*4.)*1.8)+.18*sin(p.x*83.-p.y*9.+t*3.);
        float core=clamp(shape*.95+streak*.55,0.,1.);
        vec3 color=mix(vec3(.93,.035,.001),vec3(1.,.39,.008),core);
        color=mix(color,vec3(1.,.91,.42),pow(core,3.));
        gl_FragColor=vec4(color,fire*uStrength*.96);
        #include <colorspace_fragment>
      }`});
  scene.add(new T.Mesh(geometry,material));
  return {render(strength,time){if(strength<=0)return;material.uniforms.uStrength.value=clamp(strength);material.uniforms.uTime.value=time;const previous=renderer.autoClear;renderer.autoClear=false;try{renderer.render(scene,camera)}finally{renderer.autoClear=previous}},dispose(){geometry.dispose();material.dispose();scene.clear()}};
}
