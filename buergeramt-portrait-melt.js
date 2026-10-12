// One paint source shared by the framed portrait, its downward threads and the
// existing floor transport. No particles, scene capture or separate clock.
export const portraitPaintGlsl=`
  uniform sampler2D amtPortraitPaint;
  uniform vec4 amtPortraitInfo;
  float amtPaintColumn(float u){return clamp(.5+.23*sin(u*37.+.8)+.15*sin(u*79.+.4)+.12*sin(u*151.),0.,1.);}
  float amtPaintThread(float u){return smoothstep(.60,.84,.5+.5*sin(u*86.+2.*sin(u*21.)));}
  float amtPaintReach(float goop,float u){return goop*(1.1+.9*amtPaintColumn(u));}
  vec4 amtPaintSpill(vec2 p,float goop,float clock){
    if(amtPortraitInfo.w<.5||goop<=0.)return vec4(0.);
    vec2 q=(p-amtPortraitInfo.xy)/amtPortraitInfo.z;
    float travel=max(0.,-q.y),u=.5-q.x+.055*sin(travel*8.+clock*.012)*goop;
    float arrival=smoothstep(.99,1.14,amtPaintReach(goop,u));
    float edge=smoothstep(-.08,.05,u)*(1.-smoothstep(.95,1.08,u));
    float spread=exp(-travel/(.07+goop*.8))*(1.-smoothstep(.01,.06,q.y));
    vec3 paint=texture2D(amtPortraitPaint,vec2(clamp(u,0.,1.),clamp(goop*.48+travel*.14,.01,.98))).rgb;
    return vec4(paint,arrival*edge*spread*mix(amtPaintThread(u),.8,clamp(travel*2.,0.,1.)));
  }
`;

export function createAmtPortraitMelt({THREE:T,material,frame,floor,position,width}){
  const melt={value:0},clock={value:0},paint={value:material.map};let ready=false;
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float column=amtPaintColumn(vMapUv.x),fall=amtPortraitMelt*(.13+.54*column);
      vec2 paintUv=vec2(vMapUv.x+.018*amtPortraitMelt*sin(vMapUv.y*16.+column*5.),vMapUv.y+fall*(1.-vMapUv.y));
      vec3 wetPaint=texture2D(map,clamp(paintUv,vec2(.001),vec2(.999))).rgb;
      float bare=smoothstep(1.-fall-.018,1.-fall+.018,vMapUv.y)*amtPortraitMelt;
      diffuseColor.rgb=mix(wetPaint,vec3(.21,.17,.10),bare);
    `);
  };
  material.customProgramCacheKey=()=>key+':amt-portrait-melt-v1';material.needsUpdate=true;
  const dripMaterial=new T.MeshBasicMaterial({map:material.map,transparent:true,alphaTest:.025,depthWrite:false});
  dripMaterial.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock,amtPortraitPaint:paint,amtPortraitInfo:{value:new T.Vector4()}});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float u=vMapUv.x+.01*amtPortraitMelt*sin(vMapUv.y*11.+amtPortraitClock*.014);
      float reach=amtPaintReach(amtPortraitMelt,u),down=1.-vMapUv.y;
      float tip=1.-smoothstep(reach-.018,reach+.018,down);
      float strand=amtPaintThread(u)*smoothstep(.0,.035,amtPortraitMelt);
      diffuseColor.rgb=texture2D(amtPortraitPaint,vec2(clamp(u,0.,1.),clamp(amtPortraitMelt*.48+vMapUv.y*.08,.01,.98))).rgb;
      diffuseColor.rgb*=.78+.22*pow(max(0.,sin(u*86.)),8.);
      diffuseColor.a*=tip*strand;
    `);
  };
  dripMaterial.customProgramCacheKey=()=>':amt-portrait-drips-v1';
  // The frame's existing .88 scale puts the lower edge at y=0.01. Plane depth
  // stays ahead of the backing; transparent gaps preserve room/actor depth.
  const drips=new T.Mesh(new T.PlaneGeometry(1.45,1.56),dripMaterial);
  drips.position.set(0,-1.74,.165);drips.visible=false;frame.add(drips);
  return{
    setTexture(texture){ready=true;paint.value=texture;dripMaterial.map=texture;dripMaterial.needsUpdate=true;floor.setPortrait(texture,{x:position.x,z:position.z-.165*.88,width});},
    update(state,reduced=false){if(globalThis.document?.hidden&&state)return;melt.value=ready&&state?globalThis.BuergeramtGoop.goop(state.time):0;clock.value=reduced?0:state?.visualTime||0;drips.visible=ready&&melt.value>0;},
    inspect:()=>({ready,melt:melt.value,clock:clock.value,dripsVisible:drips.visible,depthTest:dripMaterial.depthTest,depthWrite:dripMaterial.depthWrite}),
    dispose(){drips.visible=false;frame.remove(drips);drips.geometry.dispose();dripMaterial.dispose();}
  };
}
