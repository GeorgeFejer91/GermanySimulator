// Sample the visible world once; the city's renderer and clock own this effect.
const clamp=value=>Math.max(0,Math.min(1,value));
export function entryVortexFrame(elapsed,reducedMotion=false){
  const duration=reducedMotion?.24:3.4;
  const progress=clamp((Number.isFinite(elapsed)?elapsed:0)/duration);
  return {progress,duration,done:progress===1,reducedMotion};
}

const dissolveGLSL=`
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float released(vec2 cell){
    float distanceToDoor=length((cell/uGrid-uDoorUv)*vec2(uAspect,1.0));
    float delay=.04+.14*min(distanceToDoor,2.0)+.13*hash(cell);
    return smoothstep(delay,delay+.16,uProgress);
  }
`;

export function createBuergeramtEntry({THREE:T,renderer,scene,camera,door,mobile=false,reducedMotion=false}){
  const drawing=renderer.getDrawingBufferSize(new T.Vector2());
  const factor=Math.min(1,(mobile?640:960)/Math.max(drawing.x,drawing.y));
  const width=Math.max(1,Math.round(drawing.x*factor)),height=Math.max(1,Math.round(drawing.y*factor));
  const target=new T.WebGLRenderTarget(width,height,{depthBuffer:!reducedMotion,stencilBuffer:false});
  if(!reducedMotion)target.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);
  const previous=renderer.getRenderTarget();
  try{renderer.setRenderTarget(target);renderer.render(scene,camera)}
  catch(error){target.dispose();throw error}
  finally{renderer.setRenderTarget(previous)}
  camera.updateMatrixWorld(true);
  const projection=camera.projectionMatrix.clone(),view=camera.matrixWorldInverse.clone();
  const inverse=new T.Matrix4().multiplyMatrices(projection,view).invert();
  const doorNdc=door.clone().project(camera),doorUv=new T.Vector2((doorNdc.x+1)/2,(doorNdc.y+1)/2);
  const aspect=drawing.x/drawing.y,cols=Math.max(32,Math.round(Math.sqrt((mobile?7000:18000)*aspect))),rows=Math.max(24,Math.round(cols/aspect));
  const uniforms={uImage:{value:target.texture},uDepth:{value:target.depthTexture},uProgress:{value:0},uReduced:{value:reducedMotion?1:0},
    uGrid:{value:new T.Vector2(cols,rows)},uDoorUv:{value:doorUv},uAspect:{value:aspect},uInverse:{value:inverse},
    uView:{value:view},uProjection:{value:projection},uDoor:{value:door.clone().applyMatrix4(view)}};
  const effectScene=new T.Scene();effectScene.background=new T.Color(0x080609);
  const effectCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const sheetGeometry=new T.PlaneGeometry(2,2);
  const sheetMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D uImage;uniform float uProgress,uReduced,uAspect;
      uniform vec2 uGrid,uDoorUv;${dissolveGLSL}
      void main(){
        vec3 color=texture2D(uImage,vUv).rgb;
        vec2 withinCell=fract(vUv*uGrid)*2.-1.;
        float peel=released(floor(vUv*uGrid)+.5)*exp(-dot(withinCell,withinCell)*1.6);
        float alpha=uReduced>.5?1.-uProgress:(1.-peel)*(1.-smoothstep(.26,.46,uProgress));
        vec2 p=(vUv-uDoorUv)*vec2(uAspect,1.)/vec2(.026,.046);
        float radius=length(p),angle=atan(p.y,p.x);
        float ring=exp(-pow((radius-1.)/.16,2.));
        float wake=smoothstep(0.,.12,uProgress)*(1.-smoothstep(.82,1.,uProgress))*(1.-uReduced);
        vec3 rim=mix(vec3(.28,.12,.04),vec3(.95,.65,.30),.5+.5*sin(angle*3.-uProgress*28.));
        float rimAlpha=ring*wake*.85;
        color=mix(color,rim,rimAlpha);alpha=max(alpha,rimAlpha);
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`});
  const sheet=new T.Mesh(sheetGeometry,sheetMaterial);sheet.frustumCulled=false;sheet.renderOrder=0;effectScene.add(sheet);
  let particleGeometry=null,particleMaterial=null;
  if(!reducedMotion){
    const quad=new T.PlaneGeometry(2,2);particleGeometry=new T.InstancedBufferGeometry();
    particleGeometry.index=quad.index;particleGeometry.attributes=quad.attributes;
    const cells=new Float32Array(cols*rows*2);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*2;cells[i]=x+.5;cells[i+1]=y+.5}
    particleGeometry.setAttribute('aCell',new T.InstancedBufferAttribute(cells,2));particleGeometry.instanceCount=cols*rows;
    particleMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
      // Source-colored Gaussian alpha in one draw, with no CPU readback or sort.
      vertexShader:`attribute vec2 aCell;varying vec2 vGaussian;varying vec3 vColor;varying float vAlpha;
        uniform sampler2D uImage,uDepth;uniform vec2 uGrid,uDoorUv;uniform float uProgress,uAspect,uReduced;
        uniform mat4 uInverse,uView,uProjection;uniform vec3 uDoor;${dissolveGLSL}
        void main(){
          vec2 sourceUv=aCell/uGrid;
          float depth=texture2D(uDepth,sourceUv).x;
          vec4 source=uInverse*vec4(sourceUv*2.-1.,depth*2.-1.,1.);
          vec3 start=(uView*vec4(source.xyz/source.w,1.)).xyz;
          float release=released(aCell),seed=hash(aCell);
          float delay=.04+.14*min(length((sourceUv-uDoorUv)*vec2(uAspect,1.)),2.)+.13*seed;
          float travel=clamp((uProgress-delay)/max(.01,.94-delay),0.,1.);
          float collapse=travel*travel*(3.-2.*travel);
          vec3 offset=start-uDoor;
          float angle=collapse*9.5+sin(travel*3.14159265)*(.5+seed);
          mat2 rotation=mat2(cos(angle),sin(angle),-sin(angle),cos(angle));
          vec3 p=uDoor+vec3(rotation*offset.xy,offset.z)*(1.-collapse);
          p.xy+=vec2(sin(seed*31.+travel*10.),cos(seed*47.+travel*8.))*sin(travel*3.14159265)*.23;
          vec4 clip=uProjection*vec4(p,1.);
          float stretch=1.+sin(travel*3.14159265)*.85;
          vec2 axis=normalize((clip.xy/clip.w-uDoorUv*2.+1.)*vec2(uAspect,1.)+vec2(.0001));
          vec2 tangent=vec2(-axis.y,axis.x);
          vec2 splat=(axis*position.x*stretch+tangent*position.y)*vec2(1./uAspect,1.);
          float radius=1.65/uGrid.y*mix(1.,.20,collapse);
          clip.xy+=splat*radius*clip.w;
          gl_Position=clip;vGaussian=position.xy;
          vColor=texture2D(uImage,sourceUv).rgb;
          float sink=length((clip.xy/clip.w-(uDoorUv*2.-1.))*vec2(uAspect,1.));
          vAlpha=release*(1.-smoothstep(.88,1.,travel))*smoothstep(.025,.060,sink)*(1.-uReduced);
        }`,
      fragmentShader:`varying vec2 vGaussian;varying vec3 vColor;varying float vAlpha;
        void main(){float gaussian=exp(-dot(vGaussian,vGaussian)*4.5);
          gl_FragColor=vec4(vColor,gaussian*vAlpha*.9);
          #include <colorspace_fragment>
        }`});
    const particles=new T.Mesh(particleGeometry,particleMaterial);particles.frustumCulled=false;particles.renderOrder=1;effectScene.add(particles);
  }
  let elapsed=0,disposed=false,frame=entryVortexFrame(0,reducedMotion);
  return {
    render(dt,reduce=reducedMotion){
      if(disposed)return true;
      // A preference change stops the swirl immediately and finishes as a fade.
      if(reduce&&!reducedMotion){elapsed=frame.progress*.24;reducedMotion=true;uniforms.uReduced.value=1}
      elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));frame=entryVortexFrame(elapsed,reducedMotion);
      uniforms.uProgress.value=frame.progress;renderer.render(effectScene,effectCamera);return frame.done;
    },
    inspect(){return {...frame,elapsed,disposed,splats:particleGeometry?.instanceCount||0,capture:[width,height],
      captureBytes:width*height*(target.depthTexture?8:4),door:door.toArray(),doorUv:doorUv.toArray(),drawCalls:particleGeometry?2:1}},
    dispose(){if(disposed)return;disposed=true;sheetGeometry.dispose();sheetMaterial.dispose();particleGeometry?.dispose();particleMaterial?.dispose();target.dispose();effectScene.clear()},
  };
}

// A captured Jobcenter frame gives way to the live street beneath it. The caller
// owns the outside render and clock; this overlay never clears the framebuffer.
// Jobcenter shaders author screen colors directly, so replay the capture without
// another output color conversion (including the Gaussian fragments).
export function createJobcenterRelease({THREE:T,renderer,scene,camera,mobile=false,reducedMotion=false}){
  const drawing=renderer.getDrawingBufferSize(new T.Vector2());
  const screenWidth=Math.max(1,drawing.x),screenHeight=Math.max(1,drawing.y);
  const factor=Math.min(1,(mobile?640:960)/Math.max(screenWidth,screenHeight));
  const width=Math.max(1,Math.round(screenWidth*factor)),height=Math.max(1,Math.round(screenHeight*factor));
  const target=new T.WebGLRenderTarget(width,height,{depthBuffer:false,stencilBuffer:false});
  const previousTarget=renderer.getRenderTarget(),previousAutoClear=renderer.autoClear;
  try{
    renderer.setRenderTarget(target);
    renderer.autoClear=true;
    renderer.render(scene,camera);
  }catch(error){target.dispose();throw error}
  finally{renderer.setRenderTarget(previousTarget);renderer.autoClear=previousAutoClear}

  const aspect=screenWidth/screenHeight;
  const cols=Math.max(32,Math.round(Math.sqrt((mobile?7000:18000)*aspect)));
  const rows=Math.max(24,Math.round(cols/aspect));
  const uniforms={uImage:{value:target.texture},uProgress:{value:0},uReduced:{value:reducedMotion?1:0},
    uGrid:{value:new T.Vector2(cols,rows)},uDoorUv:{value:new T.Vector2(.5,.5)},uAspect:{value:aspect}};
  const effectScene=new T.Scene();
  const effectCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const sheetGeometry=new T.PlaneGeometry(2,2);
  const sheetMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D uImage;uniform float uProgress,uReduced,uAspect;
      uniform vec2 uGrid,uDoorUv;${dissolveGLSL}
      void main(){
        vec3 color=texture2D(uImage,vUv).rgb;
        vec2 offset=(vUv-uDoorUv)*vec2(uAspect,1.);
        float inward=1.-clamp(length(offset)/1.7,0.,1.);
        float ripple=.025*sin(offset.x*11.+offset.y*7.)+.018*sin(offset.y*19.-offset.x*5.);
        float withdraw=smoothstep(.06+.12*inward+ripple,.62+.22*inward+ripple,uProgress);
        float alpha=uReduced>.5?1.-uProgress:1.-withdraw;
        gl_FragColor=vec4(color,clamp(alpha,0.,1.));
      }`});
  const sheet=new T.Mesh(sheetGeometry,sheetMaterial);sheet.frustumCulled=false;sheet.renderOrder=0;effectScene.add(sheet);
  let particleGeometry=null,particleMaterial=null;
  if(!reducedMotion){
    const quad=new T.PlaneGeometry(2,2);particleGeometry=new T.InstancedBufferGeometry();
    particleGeometry.index=quad.index;particleGeometry.attributes=quad.attributes;
    const cells=new Float32Array(cols*rows*2);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*2;cells[i]=x+.5;cells[i+1]=y+.5}
    particleGeometry.setAttribute('aCell',new T.InstancedBufferAttribute(cells,2));particleGeometry.instanceCount=cols*rows;
    particleMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
      vertexShader:`attribute vec2 aCell;varying vec2 vGaussian;varying vec3 vColor;varying float vAlpha;
        uniform sampler2D uImage;uniform vec2 uGrid,uDoorUv;uniform float uProgress,uAspect,uReduced;
        ${dissolveGLSL}
        void main(){
          vec2 jitter=vec2(hash(aCell+17.3),hash(aCell+51.7))-.5;
          vec2 sourceUv=(aCell+jitter*.7)/uGrid;
          vec2 sourceNdc=sourceUv*2.-1.,doorNdc=uDoorUv*2.-1.;
          float seed=hash(aCell),release=released(aCell);
          float delay=.04+.14*min(length((sourceUv-uDoorUv)*vec2(uAspect,1.)),2.)+.13*seed;
          float travel=clamp((uProgress-delay)/max(.01,.94-delay),0.,1.);
          float collapse=travel*travel*(3.-2.*travel);
          vec2 radial=sourceNdc-doorNdc;
          vec2 arc=vec2(-radial.y,radial.x)*sin(travel*3.14159265)*(.025+.018*seed);
          vec2 center=mix(sourceNdc,doorNdc,collapse)+arc;
          float radius=1.65/uGrid.y*mix(1.,.18,collapse);
          gl_Position=vec4(center+position.xy*radius,0.,1.);
          vGaussian=position.xy;vColor=texture2D(uImage,sourceUv).rgb;
          float ember=smoothstep(.015,.12,max(vColor.r,max(vColor.g,vColor.b)));
          vAlpha=release*(1.-smoothstep(.84,1.,travel))*(1.-uReduced)*ember;
        }`,
      fragmentShader:`varying vec2 vGaussian;varying vec3 vColor;varying float vAlpha;
        void main(){float gaussian=exp(-dot(vGaussian,vGaussian)*4.5);
          gl_FragColor=vec4(vColor,gaussian*vAlpha*.68);
        }`});
    const particles=new T.Mesh(particleGeometry,particleMaterial);particles.frustumCulled=false;particles.renderOrder=1;effectScene.add(particles);
  }
  let elapsed=0,disposed=false;
  const frame=()=>{const duration=reducedMotion?.24:1.15;const progress=clamp(elapsed/duration);
    return {progress,duration,done:progress===1,reducedMotion}};
  return {
    render(dt,reduce=reducedMotion,doorUv){
      if(disposed)return true;
      if(reduce&&!reducedMotion){elapsed=frame().progress*.24;reducedMotion=true;uniforms.uReduced.value=1}
      if(doorUv&&Number.isFinite(doorUv.x)&&Number.isFinite(doorUv.y))
        uniforms.uDoorUv.value.set(clamp(doorUv.x),clamp(doorUv.y));
      elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
      const current=frame();uniforms.uProgress.value=current.progress;
      const oldAutoClear=renderer.autoClear;
      try{renderer.autoClear=false;renderer.render(effectScene,effectCamera)}
      finally{renderer.autoClear=oldAutoClear}
      return current.done;
    },
    inspect(){return {...frame(),elapsed,disposed,splats:particleGeometry?.instanceCount||0,
      capture:[width,height],captureBytes:width*height*4,doorUv:uniforms.uDoorUv.value.toArray(),
      drawCalls:particleGeometry?2:1,sourceScreenSpace:true}},
    dispose(){if(disposed)return;disposed=true;sheetGeometry.dispose();sheetMaterial.dispose();
      particleGeometry?.dispose();particleMaterial?.dispose();target.dispose();effectScene.clear()},
  };
}
