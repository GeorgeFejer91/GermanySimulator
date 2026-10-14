// One paint source shared by the dissolving portrait, its viscous runs and the
// existing floor transport. No particles, scene capture or separate clock.
const MELT_RATE=2.2;
export const portraitPaintGlsl=`
  uniform sampler2D amtPortraitPaint;
  uniform vec4 amtPortraitInfo;
  float amtPortraitPaintMelt(float goop){return min(1.,goop*${MELT_RATE});}
  vec2 amtPaintRipples(vec2 p,float clock){
    return vec2(p.x*34.+1.4*sin(p.y*8.-clock*.45),p.y*18.-clock*.6+1.3*sin(p.x*12.));
  }
  float amtPaintNoise(vec2 p){
    vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    vec4 corners=fract(sin(vec4(dot(cell,vec2(127.1,311.7)),dot(cell+vec2(1.,0.),vec2(127.1,311.7)),dot(cell+vec2(0.,1.),vec2(127.1,311.7)),dot(cell+vec2(1.),vec2(127.1,311.7))))*43758.5453);
    return mix(mix(corners.x,corners.y,f.x),mix(corners.z,corners.w,f.x),f.y);
  }
  vec4 amtPaintBeads(vec2 point,float melted,float clock){
    vec4 bead=vec4(0.);
    for(int i=0;i<8;i++){
      float seed=fract(sin(float(i)*41.7+3.2)*43758.5453);
      float phase=fract(clock*.15+(float(i)+.7)/8.+.025*sin(clock*.07+seed*6.));
      float fall=max(0.,(phase-.60)/.40),growth=smoothstep(0.,.18,phase);
      float head=mix(.12+.50*seed,1.,smoothstep(.20,.50,phase))+min(1.15,melted*3.4)*fall*fall;
      float center=(float(i)+.5)/8.+.025*sin(head*5.+seed*9.);
      float radius=(.038+.022*seed)*sqrt(melted)*growth;
      float impact=smoothstep(1.76,1.92,head);
      vec2 extent=vec2(radius*(1.+.7*impact),radius*.75*(1.+fall)*(1.-.65*impact));
      vec2 q=(point-vec2(center,min(1.80,head)))/max(vec2(.001),extent);
      q.x/=1.+.20*clamp(q.y,-1.,1.);
      float roundness=dot(q,q),height=sqrt(max(0.,1.-roundness));
      float mask=1.-smoothstep(.90,1.06,roundness);
      // Adhesion holds a short neck at the lip; it pinches off as the bead falls.
      float neck=.014*sqrt(melted)*(1.-smoothstep(.63,.76,phase));
      float thread=(1.-smoothstep(neck*.6,neck+.001,abs(point.x-center)))*step(1.,point.y)*(1.-step(head,point.y))*step(.50,phase)*(1.-step(.76,phase));
      mask=max(mask,thread);
      if(height>bead.z)bead.xyz=vec3(q*height,height);
      bead.a=max(bead.a,mask);
    }
    bead.a*=smoothstep(0.,.08,melted);return bead;
  }
  vec4 amtPaintLiquid(vec2 point,float goop,float clock){
    float melted=amtPortraitPaintMelt(goop),u=point.x,down=point.y;
    float below=max(0.,down-1.),wall=smoothstep(.985,1.025,down);
    float bend=melted*(.055*sin(down*7.-clock*.24)+.025*sin(down*17.-clock*.39+u*9.));
    float flow=.28+.72*amtPaintNoise(vec2((u+bend)*8.5,2.4));
    vec4 bead=amtPaintBeads(point,melted,clock);
    float sourceDown=down-melted*flow*(.10+.65*down*down)*smoothstep(0.,.12,down);
    // Feed the wall with lower suit/tie/flag pigment, keeping facial features
    // inside the frame even after the inexhaustible flow reaches full melt.
    float contactSource=max(.70,1.-melted*flow*.75+.10*sin(below*11.-clock*.65)*smoothstep(0.,.2,below));
    sourceDown=mix(sourceDown,contactSource,wall);
    float sourceU=u+.055*melted*sin(down*9.-clock*.05+u*8.)+.09*melted*wall*sin(below*7.-clock*.08);
    // Anchor the forehead while eyes, cheeks and jaw stretch downward at
    // unequal rates. Inverse stretching keeps one continuous painted face.
    float head=smoothstep(.22,.32,u)*(1.-smoothstep(.69,.79,u))*smoothstep(.07,.13,down)*(1.-smoothstep(.66,.90,down));
    float sag=head*smoothstep(0.,.60,melted)*(.70+.70*(1.-smoothstep(.36,.64,u)));
    sourceDown=mix(sourceDown,.08+(sourceDown-.08)/(1.+sag),head);
    sourceU=mix(sourceU,.51+(sourceU-.51)/(1.+.18*sag*smoothstep(.28,.55,down)),head);
    vec2 ripple=sin(amtPaintRipples(point,clock))*melted*.012;
    sourceU+=ripple.x+bead.x*.018;sourceDown+=ripple.y+bead.y*.012;
    float edges=mix(smoothstep(-.008,.008,u)*(1.-smoothstep(.992,1.008,u)),1.,wall);
    vec3 paint=texture2D(amtPortraitPaint,clamp(vec2(sourceU,1.-sourceDown),vec2(.001),vec2(.999))).rgb;
    float smearDown=mix(sourceDown-melted*.15,.62+.04*flow,wall);
    float pigmentU=mix(.56+.06*sin(u*15.),.95,smoothstep(.45,.75,u));
    vec3 smear=texture2D(amtPortraitPaint,clamp(vec2(mix(sourceU+.035*melted,pigmentU,wall),1.-smearDown),vec2(.001),vec2(.999))).rgb;
    paint=mix(paint,smear,mix(melted*.2,.7,wall));
    paint*=1.-.12*melted*flow;
    // A local pigment-colored dome, never a white stripe or reflection layer.
    paint*=mix(1.,.60+.38*bead.z-.25*bead.x-.18*bead.y,bead.a);
    return vec4(paint,edges*mix(1.,bead.a,wall)*smoothstep(-.01,.005,down));
  }
  vec4 amtPaintFilm(vec2 uv,float goop,float clock){
    vec4 film=amtPaintLiquid(vec2(uv.x,1.+(uv.y*1.56-.01)/1.94),goop,clock);
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
  const dripMaterial=new T.MeshBasicMaterial({map:material.map,transparent:true,alphaTest:.025,depthWrite:false});
  dripMaterial.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{amtPortraitMelt:melt,amtPortraitClock:clock,amtPortraitPaint:paint,amtPortraitInfo:{value:new T.Vector4(0,0,1,0)}});
    shader.fragmentShader='uniform float amtPortraitMelt,amtPortraitClock;\n'+portraitPaintGlsl+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 paintPoint=vec2(.5+(vMapUv.x-.5)*1.75/1.45,(1.-vMapUv.y)*3.49/1.94);
      vec4 film=amtPaintLiquid(paintPoint,amtPortraitMelt,amtPortraitClock);
      diffuseColor.rgb=film.rgb;
      diffuseColor.a*=film.a;
    `);
  };
  dripMaterial.customProgramCacheKey=()=>':amt-portrait-drips-v9';
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
