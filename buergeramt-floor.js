// Persistent pigment transport, not a pressure/velocity solver. The flat floor
// stays solid; only its paint and shallow specular ridges melt.
import './buergeramt-goop.js?v=20261013-goop-grace';
import {portraitPaintGlsl} from './buergeramt-portrait-melt.js?v=20261014-rivulets1';
const STEP=1/20;
export function amtFloorMelt(time){return globalThis.BuergeramtGoop.goop(time);}
const coordinates=`
  const vec2 floorSize=vec2(15.4,19.2),floorMin=vec2(-7.7,-10.45);
  const float tileSize=.82;
  float floorCheck(vec2 p){vec2 c=(p-floorMin)/tileSize;return 1.-mod(floor(c.x)+floor(c.y),2.);}
`;
const transport=`
  varying vec2 oilUv;
  uniform highp sampler2D previousOil;
  uniform vec2 texel;
  uniform float clock,flowClock,melt,seed;
  uniform vec4 footRipples[OIL_RIPPLE_COUNT];
  uniform vec2 footDirections[OIL_RIPPLE_COUNT];
  ${coordinates}
  ${portraitPaintGlsl}
  vec4 readOil(vec2 uv){return texture2D(previousOil,uv);}
  float potential(vec2 p){
    vec2 edge=min(p-floorMin,floorMin+floorSize-p);
    vec2 rim=smoothstep(vec2(0.),vec2(.85),edge);
    float a=sin(p.x*.63+.18*sin(flowClock*.09))*sin(p.y*.57+.21*cos(flowClock*.07));
    float b=.42*sin(p.x*.91+p.y*.38+flowClock*.031)*sin(p.y*.83-p.x*.31-flowClock*.027);
    float c=.17*cos(p.x*1.43-p.y*.72-flowClock*.019);
    // Successively smaller, slowly changing eddies stretch and fold the same
    // pigment into nested lamellae rather than replacing it with noise.
    float d=.08*sin(p.x*2.7+p.y*.8+flowClock*.043)*sin(p.y*2.4-p.x*.7-flowClock*.037);
    float f=.025*sin(p.x*6.9-p.y*2.1-flowClock*.051)*sin(p.y*6.3+p.x*1.8+flowClock*.047);
    float g=.006*sin(p.x*14.3+p.y*4.7+flowClock*.063)*sin(p.y*13.1-p.x*4.1-flowClock*.059);
    return (a+b+c+d+f+g)*rim.x*rim.y;
  }
  void main(){
    vec2 p=floorMin+oilUv*floorSize;
    if(seed>.5){gl_FragColor=vec4(vec3(floorCheck(p)),0.);return;}
    const float e=.035;
    vec2 flow=vec2(potential(p+vec2(0.,e))-potential(p-vec2(0.,e)),
                 potential(p-vec2(e,0.))-potential(p+vec2(e,0.)))/(2.*e);
    float stirred=0.;
    for(int i=0;i<OIL_RIPPLE_COUNT;i++){
      vec4 foot=footRipples[i];float age=clock-foot.z;
      if(age>=0.&&age<8.){vec2 delta=p-foot.xy;float distance=length(delta);
        float wake=foot.w*exp(-age*.6)*exp(-dot(delta,delta)/.36);
        flow+=footDirections[i]*wake*.10+delta/max(.15,distance)*sin(distance*7.-age*1.8)*wake*.035;stirred+=wake;}
    }
    vec2 paintFlow=vec2(.14*sin(p.y*3.+flowClock*.04),-.24)*readOil(oilUv).a;
    vec2 back=clamp(oilUv-(flow*(.055+.18*melt*melt)*melt+paintFlow)*.05/floorSize,texel*.5,1.-texel*.5);
    vec4 pigment=readOil(back);
    vec4 neighbors=(readOil(back+vec2(texel.x,0.))+readOil(back-vec2(texel.x,0.))+
                     readOil(back+vec2(0.,texel.y))+readOil(back-vec2(0.,texel.y)))*.25;
    pigment=mix(pigment,neighbors,melt*(.009+.018*min(1.,stirred)));
    // ponytail: an artistic segregation term retains oily islands during long
    // waits; use a phase-field solver only if physical two-fluid behavior matters.
    pigment.rgb+=.05*.18*melt*pigment.rgb*(1.-pigment.rgb)*(2.*pigment.rgb-1.)*(1.-pigment.a);
    vec4 spill=amtPaintSpill(p,melt,clock);
    float atWall=1.-smoothstep(.035,.13,abs(p.y-amtPortraitInfo.y));
    float feed=.05*12.*spill.a*atWall;
    pigment.rgb=mix(pigment.rgb,spill.rgb,feed);pigment.a=mix(pigment.a,1.,feed);
    pigment=clamp(pigment,0.,1.);
    gl_FragColor=pigment;
  }
`;
const surface=`
  varying vec2 amtFloorPoint;
  uniform highp sampler2D amtFloorOil;
  uniform float amtFloorTime,amtFloorMelt,amtFloorLive,amtFloorStill,amtFloorRestore;
  uniform float amtLampLevels[5];
  uniform vec4 footRipples[OIL_RIPPLE_COUNT];
  ${coordinates}
  ${portraitPaintGlsl}
  float layeredOil(float oil,float amount){
    float phase=3.14159265*oil+28.*amount*amount*sin(6.2831853*oil);
    float footprint=fwidth(phase),ribbonAA=clamp(footprint,.025,1.);
    return mix(.5,smoothstep(-ribbonAA,ribbonAA,-cos(phase)),1.-smoothstep(1.5,3.14159265,footprint));
  }
  vec3 oilNormal(vec3 position,vec3 n,float height){
    vec3 sx=dFdx(position),sy=dFdy(position),rx=cross(sy,n),ry=cross(n,sx);
    float det=dot(sx,rx);
    if(abs(det)<1e-8)return n;
    vec3 gradient=sign(det)*(dFdx(height)*rx+dFdy(height)*ry);
    return normalize(abs(det)*n-gradient);
  }
`;

export function createAmtFloor({THREE:T,renderer,material,mobile=false}){
  const width=mobile?128:256,height=mobile?160:320;
  // Lower-precision feedback visibly loses white through repeated tiny steps.
  // RGBA32F retains it; unsupported hardware uses procedural flow and foot ripples.
  const floatMask=!!renderer.extensions?.has('EXT_color_buffer_float')&&!!renderer.extensions?.has('OES_texture_float_linear');
  const rippleCount=mobile?4:8,footRipples={value:Array.from({length:rippleCount},()=>new T.Vector4(0,0,-100,0))},footDirections={value:Array.from({length:rippleCount},()=>new T.Vector2())};
  const amtPortraitPaint={value:null},amtPortraitInfo={value:new T.Vector4(0,0,1,0)};
  const uniforms={amtFloorOil:{value:null},amtFloorTime:{value:0},amtFloorMelt:{value:0},amtFloorLive:{value:0},amtFloorStill:{value:0},amtFloorRestore:{value:0},amtLampLevels:{value:new Float32Array(5).fill(1)},footRipples,amtPortraitPaint,amtPortraitInfo};
  const bodies=new Map();let footSerial=0,playerSerial=0,footsteps=0;
  let targets=null,pass=null,quad=null,camera=null,read=0,visit=null,lastTime=0,lastMotion=0,carry=0,simTime=0,steps=0,allocations=0,failure=null,reduced=false;
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='varying vec2 amtFloorPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\namtFloorPoint=(modelMatrix*vec4(position,1.)).xz;');
    shader.fragmentShader='#define OIL_RIPPLE_COUNT '+rippleCount+'\n'+surface+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 floorPaintPoint=amtFloorPoint;
      float warpTime=amtFloorStill>.5?0.:amtFloorTime*.008;
      if(amtFloorLive<.5){
        floorPaintPoint+=amtFloorMelt*vec2(.8*sin(amtFloorPoint.y*.72+warpTime)+.35*sin(amtFloorPoint.x+amtFloorPoint.y*.23-warpTime),.8*cos(amtFloorPoint.x*.62-warpTime)-.25*sin(amtFloorPoint.y-amtFloorPoint.x*.34+warpTime));
        // Bounded successive shears keep the same layered tile paint on devices
        // without float feedback, including a still reduced-motion view.
        float folding=amtFloorMelt*amtFloorMelt;
        floorPaintPoint.x+=folding*.46*sin(floorPaintPoint.y*2.7+warpTime);
        floorPaintPoint.y+=folding*.38*sin(floorPaintPoint.x*3.1-warpTime);
        floorPaintPoint.x+=folding*.21*sin(floorPaintPoint.y*6.9-warpTime);
        floorPaintPoint.y+=folding*.17*sin(floorPaintPoint.x*6.3+warpTime);
      }
      vec2 floorCell=(floorPaintPoint-floorMin)/tileSize;
      float checkField=sin(floorCell.x*3.14159265)*sin(floorCell.y*3.14159265);
      float checkAA=max(fwidth(checkField),.0001);
      float floorPigment=smoothstep(-checkAA,checkAA,checkField);
      if(amtFloorLive<.5)floorPigment=mix(floorPigment,layeredOil(.5+.5*checkField,amtFloorMelt),smoothstep(.08,.65,amtFloorMelt));
      if(amtFloorLive>.5){float oil=texture2D(amtFloorOil,(amtFloorPoint-floorMin)/floorSize).r;
        // Reconstruct fine lamellae from the transported diffusion field. Pure
        // oils retain their endpoints; mixed contours fold into more layers as
        // melt grows, with screen derivatives filtering subpixel ribbons.
        floorPigment=mix(floorPigment,layeredOil(oil,amtFloorMelt),smoothstep(0.,.055,amtFloorMelt)*(1.-amtFloorRestore));}
      vec2 cellEdge=min(fract(floorCell),1.-fract(floorCell))*tileSize;
      float grout=1.-smoothstep(.009,.016+max(fwidth(amtFloorPoint.x),fwidth(amtFloorPoint.y)),min(cellEdge.x,cellEdge.y));
      float ridges=1.-abs(floorPigment*2.-1.);
      vec3 floorPaint=mix(vec3(.006,.007,.009),vec3(.72,.73,.71),floorPigment);
      vec2 stillPaintPoint=amtFloorPoint;
      float paintTravel=max(0.,amtPortraitInfo.y-amtFloorPoint.y);
      stillPaintPoint.x+=amtFloorMelt*.22*sin(paintTravel*7.)*smoothstep(0.,.25,paintTravel);
      stillPaintPoint.y=amtPortraitInfo.y-(amtPortraitInfo.y-amtFloorPoint.y)/(1.+2.*amtFloorMelt);
      vec4 floorColor=amtFloorLive>.5?texture2D(amtFloorOil,(amtFloorPoint-floorMin)/floorSize)
        :amtPaintSpill(stillPaintPoint,min(amtFloorMelt,.35),0.);
      float paintCoverage=clamp(floorColor.a*1.5,0.,1.);
      vec3 carriedPaint=vec3(.012)+floorColor.rgb*.72;
      vec3 paintChroma=carriedPaint-vec3(dot(carriedPaint,vec3(.2126,.7152,.0722)));
      // Keep transported pigment hues legible against the black/white lamellae.
      floorPaint=max(vec3(0.),mix(floorPaint,carriedPaint-paintChroma,paintCoverage*(1.-amtFloorRestore))
        +paintChroma*5.*(amtFloorLive>.5?1.:paintCoverage)*(1.-amtFloorRestore));
      floorPaint=mix(floorPaint,vec3(.10),grout*(1.-smoothstep(.0,.22,amtFloorMelt)));
      diffuseColor.rgb*=floorPaint;
      float oilHeight=(1.-amtFloorStill)*amtFloorMelt*(.004*ridges+.009*sin(amtFloorPoint.x*2.7+amtFloorPoint.y*.9+amtFloorTime*.08)
        +.006*sin(amtFloorPoint.y*3.1-amtFloorPoint.x*.6-amtFloorTime*.065));
      if(amtFloorMelt>0.&&amtFloorStill<.5)for(int i=0;i<OIL_RIPPLE_COUNT;i++){
        vec4 foot=footRipples[i];float age=amtFloorTime-foot.z;
        if(age>=0.&&age<8.){float distance=length(amtFloorPoint-foot.xy),front=distance-age*.26;
          oilHeight+=amtFloorMelt*.007*foot.w*sin(front*10.)*exp(-front*front/.10)*exp(-age*.55);}
      }
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(.86,.27+.07*(1.-floorPigment)+.08*ridges,amtFloorMelt);
    `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      if(amtFloorMelt>0.)normal=oilNormal(-vViewPosition,normal,oilHeight);
    `).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      // Analytic reflections of the five existing ceiling strips. A shallow
      // oily normal bends their reflected edges; no second scene capture.
      vec3 floorWorld=vec3(amtFloorPoint.x,0.,amtFloorPoint.y);
      vec3 reflected=reflect(normalize(floorWorld-cameraPosition),inverseTransformDirection(normal,viewMatrix));
      vec2 ceiling=amtFloorPoint+reflected.xz*(3.97/max(.12,reflected.y));
      float lampReflection=amtLampLevels[0]*(1.-smoothstep(.13,.43,abs(ceiling.y+7.4)));
      lampReflection=max(lampReflection,amtLampLevels[1]*(1.-smoothstep(.13,.43,abs(ceiling.y+3.8))));
      lampReflection=max(lampReflection,amtLampLevels[2]*(1.-smoothstep(.13,.43,abs(ceiling.y))));
      lampReflection=max(lampReflection,amtLampLevels[3]*(1.-smoothstep(.13,.43,abs(ceiling.y-3.8))));
      lampReflection=max(lampReflection,amtLampLevels[4]*(1.-smoothstep(.13,.43,abs(ceiling.y-7.4))));
      lampReflection*=1.-smoothstep(1.12,1.65,abs(ceiling.x));
      totalEmissiveRadiance+=vec3(.48,.46,.40)*lampReflection*amtFloorMelt;
    `);
  };
  material.customProgramCacheKey=()=>key+':amt-oil-floor-v6:'+rippleCount;material.color.set(0xffffff);material.needsUpdate=true;

  function release(){
    if(targets){for(const target of targets)target.dispose();targets=null;}
    quad?.geometry.dispose();quad?.material.dispose();pass=quad=camera=null;
    uniforms.amtFloorOil.value=null;uniforms.amtFloorLive.value=0;carry=0;simTime=0;steps=0;
    bodies.clear();footSerial=playerSerial=footsteps=0;for(const foot of footRipples.value)foot.set(0,0,-100,0);
  }
  function draw(seed){
    const before=renderer.getRenderTarget(),auto=renderer.autoClear,xr=renderer.xr.enabled;
    try{
      renderer.xr.enabled=false;renderer.autoClear=true;
      quad.material.uniforms.seed.value=seed?1:0;
      quad.material.uniforms.previousOil.value=targets[read].texture;
      quad.material.uniforms.clock.value=simTime;quad.material.uniforms.flowClock.value=Math.max(0,simTime-globalThis.BuergeramtGoop.delay);
      quad.material.uniforms.melt.value=amtFloorMelt(lastTime);
      renderer.setRenderTarget(targets[1-read]);renderer.render(pass,camera);read=1-read;
      uniforms.amtFloorOil.value=targets[read].texture;
    }finally{renderer.setRenderTarget(before);renderer.autoClear=auto;renderer.xr.enabled=xr;}
  }
  function prepare(time){
    targets=[0,1].map(()=>new T.WebGLRenderTarget(width,height,{type:T.FloatType,format:T.RGBAFormat,
      minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false}));
    pass=new T.Scene();camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
    quad=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{previousOil:{value:null},texel:{value:new T.Vector2(1/width,1/height)},clock:{value:0},flowClock:{value:0},melt:{value:0},seed:{value:1},footRipples,footDirections,amtPortraitPaint,amtPortraitInfo},
      vertexShader:'varying vec2 oilUv;void main(){oilUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'#define OIL_RIPPLE_COUNT '+rippleCount+'\n'+transport}));
    pass.add(quad);read=0;simTime=time;draw(true);allocations++;uniforms.amtFloorLive.value=1;
  }
  function footstepsAt(id,body,time,elapsed,player){
    if(!body||!Number.isFinite(body.x)||!Number.isFinite(body.z))return;
    const walked=Number.isFinite(body.walkedDistance)?body.walkedDistance:0,generation=body.positionGeneration??0;
    let last=bodies.get(id);
    if(!last){last={x:body.x,z:body.z,walked,generation,distance:0,at:time,side:1};bodies.set(id,last);return;}
    const accepted=walked-last.walked;last.walked=walked;
    const recovered=generation!==last.generation;last.generation=generation;
    const dx=body.x-last.x,dz=body.z-last.z,distance=Math.hypot(dx,dz);last.x=body.x;last.z=body.z;
    // Stationary/blocked feet never stir. Reposition/re-entry is not a footstep.
    if(!elapsed||recovered||accepted<=0||distance>.8){last.distance=0;return;}last.distance+=accepted;
    if(last.distance<.38||time-last.at<.55||distance<.001)return;
    last.distance=0;last.at=time;last.side=-last.side;
    const index=id==='player'?playerSerial++%2:2+footSerial++%(rippleCount-2);
    if(id!=='player'&&player&&Math.hypot(body.x-player.x,body.z-player.z)>6)return;
    footRipples.value[index].set(body.x-dz/distance*.10*last.side,body.z+dx/distance*.10*last.side,time,id==='player'?1:.7);
    footDirections.value[index].set(dx/distance,dz/distance);footsteps++;
  }
  function update(state,reducedMotion=false,player=null,actors=[]){
    if(!state){release();visit=null;lastTime=lastMotion=0;uniforms.amtFloorTime.value=0;uniforms.amtFloorMelt.value=0;uniforms.amtFloorRestore.value=0;return;}
    if(globalThis.document?.hidden)return;
    const time=Math.max(0,Number.isFinite(state.time)?state.time:0);
    const motion=Math.max(0,Number.isFinite(state.visualTime)?state.visualTime:globalThis.BuergeramtGoop.motion(time));
    if(visit!==state.visit||time<lastTime&&!state.restoring||motion<lastMotion){release();visit=state.visit;failure=null;lastTime=time;lastMotion=motion;}
    uniforms.amtFloorRestore.value=Math.min(1,Math.max(0,state.restoration||0));reduced=!!reducedMotion;uniforms.amtFloorTime.value=reduced?0:motion;uniforms.amtFloorMelt.value=amtFloorMelt(time);uniforms.amtFloorStill.value=reduced||failure?1:0;
    const elapsed=Math.max(0,Math.min(.1,motion-lastMotion));lastTime=time;lastMotion=motion;
    if(reduced){release();return;}
    if(failure)return;
    const stirring=uniforms.amtFloorMelt.value>0?elapsed:0;
    footstepsAt('player',player,motion,stirring,player);for(const actor of actors)footstepsAt(actor.id,actor,motion,stirring,player);
    if(uniforms.amtFloorMelt.value<=0){if(targets)release();return;}if(!floatMask)return;
    try{
      if(!targets)prepare(motion-elapsed);
      carry+=elapsed;
      // One existing render owner, 20 Hz and at most two small passes per frame.
      for(let i=0;i<2&&carry>=STEP-1e-8;i++){carry=Math.max(0,carry-STEP);simTime+=STEP;draw(false);steps++;}
    }catch(error){failure=String(error?.message||error);release();uniforms.amtFloorStill.value=1;}
  }
  renderer.domElement?.addEventListener('webglcontextlost',release);
  return{update,setLights(levels){uniforms.amtLampLevels=levels;},setPortrait(texture,{x,z,width}){amtPortraitPaint.value=texture;amtPortraitInfo.value.set(x,z,width,texture?1:0);},dispose(){release();renderer.domElement?.removeEventListener('webglcontextlost',release);},inspect:()=>({time:lastTime,visit,melt:uniforms.amtFloorMelt.value,restoration:uniforms.amtFloorRestore.value,reducedMotion:reduced,
    portraitSource:!!amtPortraitInfo.value.w,visualTime:lastMotion,speed:globalThis.BuergeramtGoop.speed(lastTime),simulatedTime:simTime,steps,targets:targets?2:0,resolution:[width,height],precision:floatMask?'RGBA32F':'procedural',textureBytes:targets?width*height*32:0,allocations,failure,
    footsteps,activeRipples:footRipples.value.filter(foot=>lastMotion-foot.z>=0&&lastMotion-foot.z<8).length,rippleLimit:rippleCount})};
}
