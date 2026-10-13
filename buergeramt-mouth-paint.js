export const mouthPaintGlsl = `
float amtLipCrease(float x){return .064*x*x-.03125-.05*exp(-pow((x+.4375)/.4375,2.));}
vec4 amtMouthPaintFrame(sampler2D image,vec2 uv,vec4 rect,vec4 shape,vec4 axes,vec2 gap,float speaking){
  shape=clamp(shape,0.,1.);
  float opening=max(shape.x*(1.-.88*shape.w),.16*shape.w);
  float widthFactor=1.+.13*shape.y-.38*shape.z;
  vec4 original=texture2D(image,uv);
  if(speaking<.5||opening<.001&&abs(widthFactor-1.)<.001&&dot(abs(gap),vec2(1.))<.001)return original;
  vec2 pixels=vec2(textureSize(image,0)),extent=vec2(length(axes.xy),length(axes.zw));
  vec2 delta=(uv-rect.xy)*pixels*vec2(1.,-1.);
  if(max(abs(delta.x),abs(delta.y))>4.*max(extent.x,extent.y))return original;
  mat2 frame=mat2(axes.xy,axes.zw);
  vec2 q=inverse(frame)*delta;
  if(max(abs(q.x),abs(q.y))>3.||q.y< -1.6)return original;
  float vertical=exp(-pow(abs(q.y)/.9375,4.))*smoothstep(-1.,-.4375,q.y);
  float sourceX=q.x;
  for(int iteration=0;iteration<5;iteration++){
    float z=sourceX/1.5625,z4=z*z*z*z;
    float weight=exp(-z4)*vertical,amount=1.-widthFactor;
    float error=sourceX*(1.-amount*weight)-q.x;
    float derivative=1.-amount*weight*(1.-4.*z4);
    sourceX-=error/derivative;
  }
  float crease=amtLipCrease(sourceX),r=q.x/(1.3125*widthFactor);
  float taper=pow(max(0.,1.-r*r),.65);
  float aperture=1.0625*opening*(1.+.2*shape.z)*taper;
  float upperFraction=.25+.53*shape.w,lowerFraction=1.-upperFraction;
  float top=crease-upperFraction*aperture,bottom=crease+lowerFraction*aperture;
  float sourceY=q.y;
  float upperShift=crease+gap.x*taper-top,lowerShift=crease+gap.y*taper-bottom;
  float upperFalloff=.5+max(.5,1.6*max(0.,-upperShift));
  float lowerFalloff=max(.875,1.6*max(0.,lowerShift));
  if(q.y<top)sourceY+=upperShift*(1.-smoothstep(.5,upperFalloff,top-q.y));
  else if(q.y>bottom)sourceY+=lowerShift*exp(-pow((q.y-bottom)/lowerFalloff,2.));
  else sourceY=crease;
  sourceY+=.125*shape.w*taper*exp(-pow((q.y-crease-.125)/.5625,2.));
  vec2 source=uv+(frame*vec2(sourceX,sourceY)-delta)*vec2(1.,-1.)/pixels;
  vec4 paint=texture2D(image,source);
  if(paint.a<original.a*.95)paint.rgb=original.rgb;
  paint.a=original.a;
  float edge=.65/extent.y;
  float inside=smoothstep(top-edge,top+edge,q.y)*(1.-smoothstep(bottom-edge,bottom+edge,q.y));
  inside*=1.-smoothstep(.92,1.01,abs(r));
  inside*=smoothstep(.05/extent.y,.8/extent.y,aperture);
  float v=clamp((q.y-top)/max(.0001,aperture),0.,1.);
  vec3 oral=vec3(.035,.007,.011)*(1.+.3*abs(r));
  float tongue=smoothstep(.5,.85,v)*(1.-smoothstep(.6,.95,abs(r)));
  oral=mix(oral,vec3(.17,.035,.04),tongue*.6);
  float teeth=(1.-smoothstep(.16,.30,v))*smoothstep(.015,.09,v);
  teeth*=1.-smoothstep(.62,.85,abs(r));
  teeth*=max(smoothstep(2.8/extent.y,5.5/extent.y,aperture),shape.w*.8)*(1.-.8*shape.z);
  oral=mix(oral,vec3(.60,.49,.34),teeth*.8);
  paint.rgb=mix(paint.rgb,oral,inside);
  return paint;
}
vec4 amtMouthPaint(sampler2D image,vec2 uv,vec4 rect,vec4 shape,float angle,vec2 gap,float speaking){
  if(speaking<.5||dot(abs(shape),vec4(1.))<.001&&dot(abs(gap),vec2(1.))<.001)return texture2D(image,uv);
  vec2 extent=rect.zw*vec2(textureSize(image,0)),tangent=vec2(cos(angle),sin(angle));
  return amtMouthPaintFrame(image,uv,rect,shape,vec4(tangent*extent.x,vec2(-tangent.y,tangent.x)*extent.y),gap,speaking);
}`;

// Every key owns an oral registration measured on its encoded source painting.
// Facial landmarks and arc times cannot locate lips in separately painted keys.
export function nativeMouthRect(manifest,id){
 const state=manifest.states.find(s=>s.id===id),rect=state?.mouth_xywh;
 if(!rect||rect.length!==4||!rect.every(Number.isFinite)||rect[2]<=0||rect[3]<=0)throw new Error('Unregistered native mouth pose: '+manifest.id+'/'+id);
 const [w,h]=manifest.canvas_xy;return[rect[0]/w,1-rect[1]/h,rect[2]/w,rect[3]/h];
}

export function nativeMouthAngle(manifest,id){
 const angle=manifest.states.find(state=>state.id===id)?.mouth_angle;
 if(!Number.isFinite(angle)||Math.abs(angle)>Math.PI)throw new Error('Unregistered native lip angle: '+manifest.id+'/'+id);
 return angle;
}

export function nativeMouthGap(manifest,id){
 const gap=manifest.states.find(state=>state.id===id)?.mouth_gap;
 if(!Array.isArray(gap)||gap.length!==2||!gap.every(Number.isFinite)||gap[0]>0||gap[1]<0||gap[1]-gap[0]>3)throw new Error('Unregistered native lip boundaries: '+manifest.id+'/'+id);
 return gap;
}
