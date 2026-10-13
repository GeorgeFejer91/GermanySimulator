export const mouthPaintGlsl = `
float amtLipKnot(vec4 points,float end,int index){return index==4?end:points[clamp(index,0,3)];}
float amtLipSlope(float a,float b){return a*b>0.?2.*a*b/(a+b):0.;}
// Positive spans give a monotone map with unit slope at the protected edge.
float amtLipSkinDistance(float distance,float targetSpan,float sourceSpan){
  return distance/(1.+(targetSpan-sourceSpan)*distance/(sourceSpan*targetSpan));
}
// Shape-preserving Hermite interpolation cannot overshoot painted control heights.
float amtLipCurve(float x,vec4 points,float end,vec2 corners){
  float t=clamp((x-corners.x)/(corners.y-corners.x)*4.,0.,4.);
  int index=min(3,int(floor(t)));float u=t-float(index);
  float a=amtLipKnot(points,end,index),b=amtLipKnot(points,end,index+1),d=b-a;
  float before=index==0?a-d:amtLipKnot(points,end,index-1);
  float after=index==3?b+d:amtLipKnot(points,end,index+2);
  float m0=amtLipSlope(a-before,d),m1=amtLipSlope(d,after-b),u2=u*u,u3=u2*u;
  return (2.*u3-3.*u2+1.)*a+(u3-2.*u2+u)*m0+(-2.*u3+3.*u2)*b+(u3-u2)*m1;
}
vec4 amtMouthPaintFrame(sampler2D image,vec2 uv,vec4 rect,vec4 shape,vec4 axes,
  mat4 curves,vec4 lower,vec4 ends,vec3 tail,vec3 style,float speaking){
  shape=clamp(shape,0.,1.);
  float opening=max(shape.x*(1.-.88*shape.w),.16*shape.w);
  float widthFactor=1.+style.x*shape.y-style.y*shape.z;
  vec4 original=texture2D(image,uv);
  if(speaking<.5)return original;
  bool closedSource=all(equal(curves[0],curves[3]))&&all(equal(curves[0],lower))&&ends.x==ends.w&&ends.x==tail.x;
  if(closedSource&&opening<.001&&abs(widthFactor-1.)<.001)return original;
  vec2 pixels=vec2(textureSize(image,0)),extent=vec2(length(axes.xy),length(axes.zw));
  vec2 delta=(uv-rect.xy)*pixels*vec2(1.,-1.);
  if(max(abs(delta.x),abs(delta.y))>4.*max(extent.x,extent.y))return original;
  mat2 frame=mat2(axes.xy,axes.zw);
  vec2 q=inverse(frame)*delta;
  if(max(abs(q.x),abs(q.y))>3.||q.y< -1.6)return original;
  vec2 corners=tail.yz;
  float centerX=(corners.x+corners.y)*.5,widthSigma=(corners.y-corners.x)*.625;
  float localY=q.y-curves[0].z;
  float guardWeight=smoothstep(-1.6,-1.1,q.y)*(1.-smoothstep(2.5,3.,q.y));
  float vertical=exp(-pow(abs(localY)/.9375,4.))*smoothstep(-1.,-.4375,localY)*guardWeight;
  float sourceX=q.x;
  for(int iteration=0;iteration<5;iteration++){
    float localX=sourceX-centerX,z=localX/widthSigma,z4=z*z*z*z;
    float fade=clamp((abs(sourceX)-2.)*2.,0.,1.);
    float edge=1.-fade*fade*(3.-2.*fade),slope=-12.*fade*(1.-fade)*sign(sourceX);
    float base=exp(-z4)*vertical,weight=base*edge,amount=1.-widthFactor;
    float error=centerX+localX*(1.-amount*weight)-q.x;
    float derivative=1.-amount*base*(edge*(1.-4.*z4)+localX*slope);
    sourceX-=error/derivative;
  }
  float crease=amtLipCurve(sourceX,curves[0],ends.x,corners);
  float r=(sourceX-(corners.x+corners.y)*.5)/((corners.y-corners.x)*.5);
  float topLimit=min(crease,amtLipCurve(sourceX,curves[1],ends.y,corners));
  float bottomLimit=max(crease,amtLipCurve(sourceX,curves[2],ends.z,corners));
  float sourceTop=min(crease,amtLipCurve(sourceX,curves[3],ends.w,corners));
  float sourceBottom=max(crease,amtLipCurve(sourceX,lower,tail.x,corners));
  float fullOpening=bottomLimit-topLimit;
  float upperFraction=(crease-topLimit)/max(.0001,fullOpening);
  upperFraction=mix(upperFraction,.78,shape.w);
  float amount=opening*(1.+.4*shape.z*(1.-opening));
  float top=max(topLimit,crease-upperFraction*fullOpening*amount);
  float bottom=min(bottomLimit,crease+(1.-upperFraction)*fullOpening*amount);
  float aperture=bottom-top,taper=max(0.,1.-r*r);
  float sourceY=q.y;
  if(q.y<top)sourceY=-1.6+amtLipSkinDistance(q.y+1.6,top+1.6,sourceTop+1.6);
  else if(q.y>bottom)sourceY=3.-amtLipSkinDistance(3.-q.y,3.-bottom,3.-sourceBottom);
  else sourceY=crease;
  float lowerSlope=min(1.,(3.-sourceBottom)/(3.-bottom));
  sourceY+=.125*shape.w*taper*exp(-pow((q.y-crease-.125)/.5625,2.))*guardWeight*lowerSlope*lowerSlope;
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
  oral=mix(oral,vec3(.60,.49,.34),teeth*.8*style.z);
  paint.rgb=mix(paint.rgb,oral,inside);
  return paint;
}
vec4 amtMouthPaint(sampler2D image,vec2 uv,vec4 rect,vec4 shape,float angle,
  mat4 curves,vec4 lower,vec4 ends,vec3 tail,vec3 style,float speaking){
  if(speaking<.5)return texture2D(image,uv);
  vec2 extent=rect.zw*vec2(textureSize(image,0)),tangent=vec2(cos(angle),sin(angle));
  return amtMouthPaintFrame(image,uv,rect,shape,vec4(tangent*extent.x,vec2(-tangent.y,tangent.x)*extent.y),curves,lower,ends,tail,style,speaking);
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

export function nativeMouthProfile(manifest,id){
 const profile=manifest.states.find(state=>state.id===id)?.mouth_profile;
 return validateMouthProfile(profile,manifest.id+'/'+id);
}

export function validateMouthProfile(profile,id){
 const names=['crease','open_upper','open_lower','source_upper','source_lower'];
 const valid=profile&&names.every(name=>Array.isArray(profile[name])&&profile[name].length===5&&profile[name].every(v=>Number.isFinite(v)&&Math.abs(v)<=1.5));
 const corners=profile?.corners;
 if(!valid||!Array.isArray(corners)||corners.length!==2||!corners.every(v=>Number.isFinite(v)&&Math.abs(v)<=1.8)||corners[0]>=0||corners[1]<=0||corners[1]-corners[0]<.5||!Array.isArray(profile.width)||profile.width.length!==2||!profile.width.every(Number.isFinite)||profile.width[0]<0||profile.width[0]>.2||profile.width[1]<0||profile.width[1]>.45||!Number.isFinite(profile.teeth)||profile.teeth<0||profile.teeth>1)throw new Error('Unregistered native lip profile: '+id);
 for(let i=0;i<5;i++){
  const crease=profile.crease[i];
  if(profile.open_upper[i]>crease||profile.source_upper[i]>crease||profile.open_lower[i]<crease||profile.source_lower[i]<crease)throw new Error('Crossed native lip profile: '+id);
  if((i===0||i===4)&&names.some(name=>Math.abs(profile[name][i]-crease)>1e-6))throw new Error('Detached native lip corner: '+id);
 }
 return profile;
}

export function mouthProfileValues(profile){
 return {curves:['crease','open_upper','open_lower','source_upper'].flatMap(name=>profile[name].slice(0,4)),
  lower:profile.source_lower.slice(0,4),ends:['crease','open_upper','open_lower','source_upper'].map(name=>profile[name][4]),
  tail:[profile.source_lower[4],...profile.corners],style:[...profile.width,profile.teeth]};
}
