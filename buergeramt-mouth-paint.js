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

// Main keys were registered against the original encoded paintings. Bridges
// carry the same calibrated offset through their authored facial landmarks.
const main={
 clerk:{ready:[580,169,16,16],raised:[597,201,16,16],contact:[538,230,16,16],refusal:[543,165,16,16]},
 aktenkurier:{work:[353,126,11,8],gesture:[295,147,11,8]},
 archivbotin:{work:[346,160,14,9],gesture:[325,140,14,9]},
 formularsammler:{work:[346,164,13,9],gesture:[364,163,13,9]},
 nummernfluesterer:{work:[315,140,12,8],gesture:[314,150,12,8]},
 nachtschichtmelderin:{work:[318,150,11,8],gesture:[313,181,11,8]},
 pfandarchitektin:{work:[306,146,13,9],gesture:[294,175,13,9]},
 kopiependler:{work:[347,149,12,8],gesture:[262,192,12,8]},
 warteschlangenpoetin:{work:[320,159,11,8],gesture:[301,185,11,8]},
 renter:{work:[218,166,13,8],gesture:[216,173,13,8]},
 parent:{work:[257,152,12,8],gesture:[225,175,12,8]},
 pensioner:{work:[232,177,14,9],gesture:[196,180,14,9]},
};
const guessed=state=>{const m=state.landmarks,n=Array.isArray(m)?m[2]:m.nose,c=Array.isArray(m)?m[3]:m.chin;return[n[0]*.45+c[0]*.55,n[1]*.45+c[1]*.55]};
export function nativeMouthRect(manifest,id){
 const frames=main[manifest.id];if(!frames)throw new Error('Unregistered native mouth: '+manifest.id);
 let rect=frames[id];
 if(!rect){
  const state=manifest.states.find(s=>s.id===id),[x,y]=guessed(state);
  let from='work',to='gesture',u=(Number(id.match(/bridge-(\d)/)?.[1])||0)/4;
  if(manifest.id==='clerk'){
   if(id.startsWith('raise')){from='ready';to='raised';u=Number(id.at(-1))/3}
   else if(id.startsWith('stamp')||id.startsWith('knick-stamp')){from='raised';to='contact';u=id==='stamp-1'?.2:id==='stamp-2'?.55:id==='stamp-3'?.8:id.endsWith('1')?.32:.45}
   else if(id.startsWith('fold')){from='contact';to='refusal';u=Number(id.at(-1))/4}
   else{from='refusal';to='ready';u=Number(id.at(-1))/3}
  }
  const a=frames[from],b=frames[to],ga=guessed(manifest.states.find(s=>s.id===from)),gb=guessed(manifest.states.find(s=>s.id===to));
  rect=[x+(a[0]-ga[0])*(1-u)+(b[0]-gb[0])*u,y+(a[1]-ga[1])*(1-u)+(b[1]-gb[1])*u,a[2],a[3]];
 }
 const [w,h]=manifest.canvas_xy;return[rect[0]/w,1-rect[1]/h,rect[2]/w,rect[3]/h];
}
