// One bounded oral opening, sampled inside the existing native-paint Gaussians.
// Rectangles are source-pixel registrations, independent of body pivots/bounds.
export const mouthPaintGlsl = `
vec4 amtMouthPaint(sampler2D image,vec2 uv,vec4 rect,vec4 shape){
  float opening=clamp(shape.x*(1.-.65*shape.w),0.,1.);
  if(opening<.001)return texture2D(image,uv);
  vec2 q=(uv-rect.xy)/rect.zw;
  if(max(abs(q.x),abs(q.y))>3.)return texture2D(image,uv);
  float support=exp(-.65*dot(q,q));
  float lower=1.-smoothstep(-.15,.15,q.y);
  vec2 source=uv;
  source.y+=rect.w*opening*(1.28*lower-.18*(1.-lower))*support;
  source.x-=(uv.x-rect.x)*support*(shape.y*.13-shape.z*.25);
  vec4 paint=texture2D(image,source);
  // Upper and lower painted lips separate around this warm, recessed cavity.
  vec2 inside=vec2(q.x/(.94*(1.+.13*shape.y-.33*shape.z)),
                   (q.y+.45*opening)/max(.001,.80*opening));
  float distance=length(inside);
  float cavity=(1.-smoothstep(.87,1.03,distance))*smoothstep(.005,.07,opening);
  float tongue=(1.-smoothstep(-.8,-.05,inside.y))*(1.-smoothstep(.4,.95,abs(inside.x)));
  vec3 oral=mix(vec3(.065,.012,.022),vec3(.29,.065,.075),tongue*.7);
  // Small upper tooth band follows the aperture; it never covers closed paint.
  float teeth=smoothstep(.45,.66,inside.y)*(1.-smoothstep(.76,.9,inside.y));
  teeth*=1.-smoothstep(.5,.85,abs(inside.x));
  oral=mix(oral,vec3(.68,.58,.43),teeth*(.35+.45*shape.y)*(1.-.6*shape.z));
  paint.rgb=mix(paint.rgb,oral,cavity);
  return paint;
}`;

// Every key owns an oral registration measured on its encoded source painting.
// Facial landmarks and arc times cannot locate lips in separately painted keys.
export function nativeMouthRect(manifest,id){
 const state=manifest.states.find(s=>s.id===id),rect=state?.mouth_xywh;
 if(!rect||rect.length!==4||!rect.every(Number.isFinite)||rect[2]<=0||rect[3]<=0)throw new Error('Unregistered native mouth pose: '+manifest.id+'/'+id);
 const [w,h]=manifest.canvas_xy;return[rect[0]/w,1-rect[1]/h,rect[2]/w,rect[3]/h];
}
