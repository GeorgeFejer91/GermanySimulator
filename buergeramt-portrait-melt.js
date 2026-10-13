// One paint source shared by the framed portrait, its liquid sheet and the
// existing floor transport. No particles, scene capture or separate clock.
const MELT_RATE=2.2;
export const portraitPaintGlsl=`
  uniform sampler2D amtPortraitPaint;
  uniform vec4 amtPortraitInfo;
  float amtPortraitPaintMelt(float goop){return min(1.,goop*${MELT_RATE});}
  vec4 amtPaintSheet(vec2 point,float goop,float clock){
    float melted=amtPortraitPaintMelt(goop),u=point.x,down=point.y;
    float fall=melted*(2.15+.16*sin(u*7.5+.7)+.08*sin(u*17.-clock*.025));
    float stretch=1.+melted*(.35+.9*(.5+.5*sin(u*7.+.8)));
    float fold=.11*melted*sin((down-fall)*9.-clock*.035+u*7.)*sin(u*3.14159265);
    float sourceDown=(down-fall+fold)/stretch;
    float gather=1.-.20*melted*smoothstep(.3,1.8,down);
    float sourceU=.5+(u-.5)/gather+.10*melted*sin(sourceDown*7.+clock*.03+u*3.)+.04*melted*sin(sourceDown*18.-clock*.02);
    float edges=smoothstep(-.008,.008,sourceU)*(1.-smoothstep(.992,1.008,sourceU));
    float body=smoothstep(-.01,.01,sourceDown)*(1.-smoothstep(.985,1.015,sourceDown));
    vec3 paint=texture2D(amtPortraitPaint,clamp(vec2(sourceU,1.-sourceDown),vec2(.001),vec2(.999))).rgb;
    float ridge=.5+.5*cos(sourceDown*11.+u*6.-clock*.035);
    paint*=1.+.09*melted*ridge;
    return vec4(paint,edges*body);
  }
  vec4 amtPaintFilm(vec2 uv,float goop,float clock){
    vec4 film=amtPaintSheet(vec2(uv.x,1.+(uv.y*1.56-.01)/1.94),goop,clock);
    film.a*=smoothstep(0.,.025,amtPortraitPaintMelt(goop));
    return film;
  }
  vec4 amtPaintSpill(vec2 p,float goop,float clock){
    if(amtPortraitInfo.w<.5||goop<=0.)return vec4(0.);
    float paintGoop=amtPortraitPaintMelt(goop);
    vec2 q=(p-amtPortraitInfo.xy)/amtPortraitInfo.z;
    float travel=max(0.,-q.y),u=.5-q.x+.055*sin(travel*8.+clock*.012)*paintGoop*smoothstep(0.,.5,travel);
    vec4 contact=amtPaintFilm(vec2(u,1.),goop,clock);
    float edge=smoothstep(-.08,.05,u)*(1.-smoothstep(.95,1.08,u));
    float spread=exp(-travel/(.07+paintGoop*.8))*(1.-smoothstep(.01,.06,q.y));
    return vec4(contact.rgb,contact.a*edge*spread);
  }
`;

export function createAmtPortraitMelt({THREE:T,material,frame,floor,position,width}){
  const melt={value:0},clock={value:0},paint={value:material.map};let ready=false;
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock,amtPortraitPaint:paint,amtPortraitInfo:{value:new T.Vector4(0,0,1,0)}});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      if(amtPortraitMelt>0.){
        diffuseColor.rgb=vec3(.21,.17,.10);
      }
    `);
  };
  material.customProgramCacheKey=()=>key+':amt-portrait-melt-v4';material.needsUpdate=true;
  const dripMaterial=new T.MeshBasicMaterial({map:material.map,transparent:true,alphaTest:.025,depthWrite:false});
  dripMaterial.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock,amtPortraitPaint:paint,amtPortraitInfo:{value:new T.Vector4(0,0,1,0)}});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec4 film=amtPaintSheet(vec2(.5+(vMapUv.x-.5)*1.75/1.45,(1.-vMapUv.y)*3.49/1.94),amtPortraitMelt,amtPortraitClock);
      diffuseColor.rgb=film.rgb;
      diffuseColor.a*=film.a;
    `);
  };
  dripMaterial.customProgramCacheKey=()=>':amt-portrait-drips-v4';
  // One unbroken paint surface spans the image and wall: separate panels leave
  // a visible cut in a moving face. Extra width lets its liquid edges meander.
  // Static curvature, 24 triangles; it settles onto the inner wall at z=5.47.
  const geometry=new T.PlaneGeometry(1.75,3.49,1,12),vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const down=1.745-vertices.getY(i),t=Math.max(0,Math.min(1,(down-2.35)/.40));
    vertices.setZ(i,-.21*t*t*(3-2*t));
  }
  geometry.computeVertexNormals();
  const drips=new T.Mesh(geometry,dripMaterial);
  drips.name='Steinmeier liquid paint';drips.position.set(0,-.775,.165);drips.visible=false;frame.add(drips);
  return{
    setTexture(texture){ready=true;paint.value=texture;dripMaterial.map=texture;dripMaterial.needsUpdate=true;floor.setPortrait(texture,{x:position.x,z:position.z+(.21-.165)*.88,width});},
    update(state,reduced=false){if(globalThis.document?.hidden&&state)return;melt.value=ready&&state?globalThis.BuergeramtGoop.goop(state.time):0;clock.value=reduced?0:state?.visualTime||0;drips.visible=ready&&melt.value>0;},
    inspect:()=>({ready,melt:melt.value,paintMelt:Math.min(1,melt.value*MELT_RATE),clock:clock.value,dripsVisible:drips.visible,depthTest:dripMaterial.depthTest,depthWrite:dripMaterial.depthWrite}),
    dispose(){drips.visible=false;frame.remove(drips);drips.geometry.dispose();dripMaterial.dispose();}
  };
}
