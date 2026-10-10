// One cue-owned speech track and one native-paint Gaussian mouth draw.
// Grapheme visemes are estimates, not phoneme alignment or reconstructed faces.
(function(global){
"use strict";
const rest=[0,0,0,0],clamp=x=>Math.max(0,Math.min(1,x));
const shapes={rest,closed:rest,wide:[.65,1,0,0],open:[1,.25,0,0],round:[.62,0,1,0],bite:[.18,.1,0,1],soft:[.32,.35,0,0]};
function score(text){
 const keys=[];let match;
 const letters=/sch|ch|ei|ai|ie|au|eu|äu|[\s\S]/gi;
 while((match=letters.exec(text))){const c=match[0].toLowerCase();
  const kind=/^[bmp]$/.test(c)?"closed":/^[fv]$/.test(c)?"bite":/^(o|u|ü|ö|au|eu|äu)$/.test(c)?"round":/^(e|i|ä|ei|ai|ie)$/.test(c)?"wide":c==="a"?"open":/^[\s.,!?;:—-]$/.test(c)?"rest":"soft";
  keys.push({index:match.index,length:c.length,shape:shapes[kind]});
 }
 return keys;
}
function poseAt(keys,index){
 if(!keys.length||index<0||index>=keys.at(-1).index+keys.at(-1).length)return rest.slice();
 let k=0;while(k+1<keys.length&&keys[k+1].index<=index)k++;
 const current=keys[k],u=(index-current.index)/current.length;
 // Coarticulation remains continuous at every key, with a hold at its centre.
 const next=u<.5?(keys[k-1]?.shape||rest):(keys[k+1]?.shape||rest);
 const t=clamp(Math.abs(u-.5)*2),blend=t*t*(3-2*t)*.5;
 return current.shape.map((v,i)=>v+(next[i]-v)*blend);
}
function createTrack(now=()=>performance.now()){
 let actor=null,text="",keys=[],mode="idle",media=null,started=0,anchor=0,anchorAt=0,limit=0,msPerChar=70,paused=false,pauseAt=0,saved=rest.slice(),receipt=false;
 const clear=()=>{actor=null;text="";keys=[];mode="idle";media=null;paused=false;receipt=false;saved=rest.slice()};
 const read=()=>{
  let index=0,time=0,hold=paused;
  if(mode==="recorded"){
   hold=!!media.paused;time=Math.max(0,Number.isFinite(media.currentTime)?media.currentTime:0);
   index=Number.isFinite(media.duration)&&media.duration>0?time/media.duration*text.length:0;
   if(media.ended)return{actor,mode,active:false,paused:false,time,index,shape:rest.slice()};
  }else if(mode==="voice"){
   time=Math.max(0,((paused?pauseAt:now())-started)/1000);
   index=Math.min(limit,anchor+Math.max(0,((paused?pauseAt:now())-anchorAt)/msPerChar));
  }
  const active=!!actor&&["recorded","voice"].includes(mode);
  const shape=active?hold?saved.slice():poseAt(keys,index):rest.slice();
  if(active&&!hold)saved=shape.slice();
  return{actor,mode,active,paused:hold,time,index,receipt,shape};
 };
 return{
  prepare(id,line,rate=.96){clear();actor=id;text=line;keys=score(line);mode="waiting";msPerChar=70/Math.max(.5,rate);limit=text.length},
  start(kind,player=null){mode=kind==="voice"?(player?"recorded":"voice"):"fallback";media=player;started=anchorAt=now();anchor=0;paused=false},
  boundary(index){if(mode!=="voice"||paused||!Number.isInteger(index)||index<anchor||index>=text.length)return;receipt=true;anchor=index;anchorAt=now();const word=/\S+\s*/.exec(text.slice(index));limit=index+(word?.[0].length||1)},
  pause(){if(paused)return;saved=read().shape;pauseAt=now();paused=true},
  resume(){if(!paused)return;const elapsed=now()-pauseAt;started+=elapsed;anchorAt+=elapsed;paused=false},
  finish:clear,sample:read,
 };
}

// Registered on the exact detail cells, in their native pixel coordinates.
// Regular speech holds gesture paint; stationary voices hold their neutral pose.
const mouths={
 clerk:[242/384,1-164/832,20/384,12/832],
 renter:[210/384,1-160/832,13/384,8/832],
 parent:[243/384,1-147/832,12/384,8/832],
 pensioner:[228/384,1-176/832,14/384,8/832],
 aktenkurier:[344/640,1-128/832,11/640,7/832],
 archivbotin:[264/640,1-121/832,14/640,8/832],
 formularsammler:[307/640,1-158/832,13/640,8/832],
 nummernfluesterer:[299/640,1-111/832,13/640,9/832],
 nachtschichtmelderin:[269/640,1-129/832,11/640,8/832],
 pfandarchitektin:[280/640,1-138/832,14/640,9/832],
 kopiependler:[252/640,1-128/832,12/640,8/832],
 warteschlangenpoetin:[254/640,1-150/832,12/640,8/832],
};
mouths["clerk-left"]=mouths["clerk-middle"]=mouths.clerk;
for(let i=1;i<=4;i++)mouths["clerk-"+i]=mouths.clerk;
function installMask(T,actor){
 const material=actor.mesh.material,hole={value:0},rect={value:new T.Vector4()},compile=material.onBeforeCompile;
 material.userData.lipHole=hole;material.userData.lipRect=rect;
 actor.mesh.geometry.setAttribute("amtFaceUv",new T.BufferAttribute(Float32Array.from(actor.base),2));
 material.customProgramCacheKey=()=>"amt-native-gaussian-mouth-v1";
 material.onBeforeCompile=shader=>{
  compile(shader);shader.uniforms.amtLipHole=hole;shader.uniforms.amtLipRect=rect;
  shader.vertexShader="attribute vec2 amtFaceUv;varying vec2 amtFace;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\namtFace=amtFaceUv;");
  shader.fragmentShader="uniform float amtLipHole;uniform vec4 amtLipRect;varying vec2 amtFace;\n"+shader.fragmentShader.replace("#include <alphatest_fragment>",
   "vec2 lipPatch=(amtFace-amtLipRect.xy)/amtLipRect.zw;\nfloat lipCover=1.-smoothstep(.48,.64,max(abs(lipPatch.x),abs(lipPatch.y)));\ndiffuseColor.a*=1.-amtLipHole*lipCover;\n#include <alphatest_fragment>");
 };
}
function createPaintSplat(T){
 const cols=25,rows=17,count=cols*rows,quad=new T.PlaneGeometry(1,1),geometry=new T.InstancedBufferGeometry();
 geometry.index=quad.index;geometry.attributes=quad.attributes;
 const points=new Float32Array(count*3);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;points[i*3]=(x+.5)/cols*2-1;points[i*3+1]=(y+.5)/rows*2-1}
 geometry.setAttribute("lipCell",new T.InstancedBufferAttribute(points,3));geometry.instanceCount=count;
 const shape={value:new T.Vector4()},rect={value:new T.Vector4()},crop={value:new T.Vector4()},size={value:new T.Vector2()},breath={value:0};
 const material=new T.MeshBasicMaterial({transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide});
 material.forceSinglePass=true; // Flat paint needs one pass; retain visibility from both sides.
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{lipShape:shape,lipRect:rect,lipCrop:crop,lipSize:size,lipBreath:breath});
  shader.vertexShader=`attribute vec3 lipCell;uniform vec4 lipShape,lipRect,lipCrop;uniform vec2 lipSize;uniform float lipBreath;
   varying vec2 lipUv,lipKernel;
   `+shader.vertexShader.replace("#include <begin_vertex>",`
   vec2 halfPatch=lipRect.zw*vec2(2.5,3.);
   vec2 spacing=halfPatch*vec2(2./${cols}.,2./${rows}.);
   vec2 local=position.xy*spacing*2.7;
   vec2 source=lipRect.xy+lipCell.xy*halfPatch+local;
   vec2 p=source,relative=(source-lipRect.xy)/lipRect.zw;
   float weight=exp(-.7*dot(relative,relative));
   float lower=1.-smoothstep(-.22,.22,relative.y);
   p.y-=lipShape.x*lipRect.w*.70*lower*weight;
   p.y+=lipShape.x*lipRect.w*.12*(1.-lower)*weight;
   p.x+=(source.x-lipRect.x)*weight*(lipShape.y*.13-lipShape.z*.22);
   p.y+=lipShape.w*lipRect.w*.16*lower*weight;
   lipUv=lipCrop.xy+source*lipCrop.zw;lipKernel=position.xy*2.7;
   vec3 transformed=vec3((p-vec2(.5))*lipSize,.0008);
   float upper=smoothstep(-lipSize.y*.42,lipSize.y*.1,transformed.y);
   transformed.y+=.008*lipBreath*upper;transformed.x*=1.+.006*lipBreath*upper;
   `);
  shader.fragmentShader=`uniform vec4 lipShape;uniform float lipBreath;varying vec2 lipUv,lipKernel;
   `+shader.fragmentShader.replace("#include <map_fragment>",`
   float kernel=exp(-.5*dot(lipKernel,lipKernel));
   vec4 paint=texture2D(map,lipUv);diffuseColor*=paint;
   float lightness=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(vec3(lightness),diffuseColor.rgb,1.085+.055*lipBreath)*(1.015+.035*lipBreath);
    // Partition optical depth among overlapping native-image Gaussians.
    diffuseColor.a=1.-exp(log(max(1.-diffuseColor.a,1e-5))*kernel/6.20);
   `);
 };
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.visible=false;
 let actor=null,last=0,disposed=false;
 return{
  update(source,speech,now){
   if(disposed)return;
   if(source!==actor){if(actor)actor.mesh.material.userData.lipHole.value=0;mesh.removeFromParent();shape.value.set(0,0,0,0);actor=source;if(actor)actor.mesh.add(mesh)}
   const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
   if(!actor){mesh.visible=false;return}
   const registration=mouths[actor.lipId||actor.id||actor.name];
   if(!registration||!actor.mesh.material.map?.image){mesh.visible=false;actor.mesh.material.userData.lipHole.value=0;return}
   const target=speech?.active?speech.shape:rest;
   if(!speech?.paused)for(let i=0;i<4;i++)shape.value.setComponent(i,shape.value.getComponent(i)+(target[i]-shape.value.getComponent(i))*(1-Math.exp(-dt/.035)));
   const active=shape.value.x+shape.value.y+shape.value.z+shape.value.w>.015;
   mesh.visible=active;actor.mesh.material.userData.lipHole.value=active?1:0;
   rect.value.fromArray(registration);actor.mesh.material.userData.lipRect.value.set(registration[0],registration[1],registration[2]*2.5,registration[3]*3);
   const uv=actor.uv;crop.value.set(uv.getX(2),uv.getY(2),uv.getX(3)-uv.getX(2),uv.getY(0)-uv.getY(2));
   size.value.set(actor.mesh.geometry.parameters.width,actor.mesh.geometry.parameters.height);
   breath.value=actor.mesh.material.userData.breath.value;
   if(material.map!==actor.mesh.material.map){material.map=actor.mesh.material.map;material.needsUpdate=true}
   if(material.fog!==actor.mesh.material.fog){material.fog=actor.mesh.material.fog;material.needsUpdate=true}
   material.color.copy(actor.mesh.material.color);material.opacity=actor.mesh.material.opacity;
  },
  inspect(){return{actor:actor?.lipId||actor?.id||actor?.name||null,visible:mesh.visible,shape:shape.value.toArray(),kernels:count,depthTest:material.depthTest,depthWrite:material.depthWrite}},
  dispose(){if(disposed)return;disposed=true;if(actor)actor.mesh.material.userData.lipHole.value=0;mesh.removeFromParent();geometry.dispose();material.dispose()},
 };
}
global.GermanyAmtLips={createTrack,score,poseAt,mouths,installMask,createPaintSplat};
})(typeof window!=="undefined"?window:globalThis);
