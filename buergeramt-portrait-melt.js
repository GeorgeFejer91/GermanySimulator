// One paint source shared by the framed portrait, its downward threads and the
// existing floor transport. No particles, scene capture or separate clock.
export const portraitPaintGlsl=`
  uniform sampler2D amtPortraitPaint;
  uniform vec4 amtPortraitInfo;
  float amtPaintColumn(float u,float clock){return .5+.22*sin(u*11.+.5)+.15*sin(u*23.-clock*.012);}
  // Eight irregular viscous channels. Bulges advect downward on the same
  // slowed clock as the floor; their leading drops keep rounded liquid tips.
  vec4 amtPaintFilm(vec2 uv,float goop,float clock){
    float lane=floor(clamp(uv.x,.001,.999)*8.);
    float seed=fract(sin(lane*91.7+13.1)*1451.17);
    float center=(lane+.5+.22*sin(lane*2.9+1.))/8.;
    center+=.011*goop*sin(uv.y*4.-clock*.015+seed*6.);
    float bulge=.5+.5*sin(uv.y*23.-clock*.047+seed*10.);
    float radius=(.004+.025*goop)*(.65+.55*bulge);
    float reach=goop*(1.02+.08*seed),down=uv.y;
    float side=abs(uv.x-center);
    float neck=(1.-smoothstep(radius*.65,radius,side))*(1.-smoothstep(reach-radius*2.,reach,down));
    vec2 tip=vec2((uv.x-center)/(radius*1.4),(down-reach+radius*1.8)/(radius*1.8));
    float drop=1.-smoothstep(.75,1.,length(tip));
    float coverage=max(neck,drop)*smoothstep(0.,.018,goop)*(1.-smoothstep(reach,reach+.008,down));
    float sourceV=clamp(.025+goop*.4+clock*.0004-down*.13,.01,.98);
    vec3 paint=texture2D(amtPortraitPaint,vec2(clamp(uv.x,0.,1.),sourceV)).rgb;
    float sheen=pow(clamp(side/max(radius,.001),0.,1.),5.)*neck;
    paint=paint*.83+vec3(.12,.105,.08)*sheen;
    return vec4(paint,coverage);
  }
  vec4 amtPaintSpill(vec2 p,float goop,float clock){
    if(amtPortraitInfo.w<.5||goop<=0.)return vec4(0.);
    vec2 q=(p-amtPortraitInfo.xy)/amtPortraitInfo.z;
    float travel=max(0.,-q.y),u=.5-q.x+.055*sin(travel*8.+clock*.012)*goop*smoothstep(0.,.5,travel);
    vec4 contact=amtPaintFilm(vec2(u,1.),goop,clock);
    float edge=smoothstep(-.08,.05,u)*(1.-smoothstep(.95,1.08,u));
    float spread=exp(-travel/(.07+goop*.8))*(1.-smoothstep(.01,.06,q.y));
    return vec4(contact.rgb,contact.a*edge*spread);
  }
`;

export function createAmtPortraitMelt({THREE:T,material,frame,floor,position,width}){
  const melt={value:0},clock={value:0},paint={value:material.map};let ready=false;
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock,amtPortraitPaint:paint,amtPortraitInfo:{value:new T.Vector4(0,0,1,0)}});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float column=amtPaintColumn(vMapUv.x,amtPortraitClock),fall=amtPortraitMelt*(.14+.40*column);
      vec2 paintUv=vec2(vMapUv.x+.006*amtPortraitMelt*sin(vMapUv.y*5.-amtPortraitClock*.009+column*2.),vMapUv.y+fall*(1.-vMapUv.y));
      vec3 wetPaint=texture2D(map,clamp(paintUv,vec2(.001),vec2(.999))).rgb;
      float bare=smoothstep(1.-fall-.018,1.-fall+.018,vMapUv.y)*amtPortraitMelt;
      diffuseColor.rgb=mix(wetPaint,vec3(.21,.17,.10),bare);
    `);
  };
  material.customProgramCacheKey=()=>key+':amt-portrait-melt-v2';material.needsUpdate=true;
  const dripMaterial=new T.MeshBasicMaterial({map:material.map,transparent:true,alphaTest:.025,depthWrite:false});
  dripMaterial.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock,amtPortraitPaint:paint,amtPortraitInfo:{value:new T.Vector4(0,0,1,0)}});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec4 film=amtPaintFilm(vec2(vMapUv.x,1.-vMapUv.y),amtPortraitMelt,amtPortraitClock);
      diffuseColor.rgb=film.rgb;
      diffuseColor.a*=film.a;
    `);
  };
  dripMaterial.customProgramCacheKey=()=>':amt-portrait-drips-v2';
  // Paint leaves the frame, then settles onto the actual inner wall at z=5.47.
  // Static curvature, 24 triangles; alpha/depth still own the liquid outline.
  const geometry=new T.PlaneGeometry(1.45,1.56,1,12),vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const down=(.78-vertices.getY(i))/1.56,t=Math.max(0,Math.min(1,(down-.12)/.23));
    vertices.setZ(i,-.21*t*t*(3-2*t));
  }
  geometry.computeVertexNormals();
  const drips=new T.Mesh(geometry,dripMaterial);
  drips.position.set(0,-1.74,.165);drips.visible=false;frame.add(drips);
  return{
    setTexture(texture){ready=true;paint.value=texture;dripMaterial.map=texture;dripMaterial.needsUpdate=true;floor.setPortrait(texture,{x:position.x,z:position.z+(.21-.165)*.88,width});},
    update(state,reduced=false){if(globalThis.document?.hidden&&state)return;melt.value=ready&&state?globalThis.BuergeramtGoop.goop(state.time):0;clock.value=reduced?0:state?.visualTime||0;drips.visible=ready&&melt.value>0;},
    inspect:()=>({ready,melt:melt.value,clock:clock.value,dripsVisible:drips.visible,depthTest:dripMaterial.depthTest,depthWrite:dripMaterial.depthWrite}),
    dispose(){drips.visible=false;frame.remove(drips);drips.geometry.dispose();dripMaterial.dispose();}
  };
}
