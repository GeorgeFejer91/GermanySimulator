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
 let actor=null,text="",keys=[],mode="idle",media=null,binding=null,started=0,anchor=0,anchorAt=0,limit=0,msPerChar=70,paused=false,pauseAt=0,saved=rest.slice(),receipt=false;
 const clear=()=>{actor=null;text="";keys=[];mode="idle";media=null;binding=null;paused=false;receipt=false;saved=rest.slice()};
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
  const acoustic=mode==='recorded'&&binding?binding.sample(time):null;
  const shape=active?acoustic?[acoustic.open,acoustic.spread,acoustic.round,acoustic.bite]:hold?saved.slice():poseAt(keys,index):rest.slice();
  if(active&&!hold)saved=shape.slice();
  return{actor,mode,active,paused:hold,time,index,receipt,shape,timing:binding?'audio-cues':'estimated',viseme:acoustic?.viseme,recording:binding?.track.recording};
 };
 return{
  prepare(id,line,rate=.96){clear();actor=id;text=line;keys=score(line);mode="waiting";msPerChar=70/Math.max(.5,rate);limit=text.length},
  start(kind,player=null,recording=null){mode=kind==="voice"?(player?"recorded":"voice"):"fallback";media=player;binding=recording;started=anchorAt=now();anchor=0;paused=false},
  boundary(index){if(mode!=="voice"||paused||!Number.isInteger(index)||index<anchor||index>=text.length)return;receipt=true;anchor=index;anchorAt=now();const word=/\S+\s*/.exec(text.slice(index));limit=index+(word?.[0].length||1)},
  pause(){if(paused)return;saved=read().shape;pauseAt=now();paused=true},
  resume(){if(!paused)return;const elapsed=now()-pauseAt;started+=elapsed;anchorAt+=elapsed;paused=false},
  finish:clear,sample:read,
 };
}

// Registered on the exact detail cells, in their native pixel coordinates.
// Each displayed painting owns its registration. Mesh transforms are inherited.
const mouths={
 clerk:[256/384,1-169/832,16/384,16/832],
 renter:[210/384,1-165/832,13/384,8/832],
 parent:[249/384,1-151/832,12/384,8/832],
 pensioner:[216/384,1-176/832,14/384,8/832],
};
mouths["clerk-left"]=mouths["clerk-middle"]=mouths.clerk;
for(let i=1;i<=4;i++)mouths["clerk-"+i]=mouths.clerk;
const posePixels={
 clerk:[[256,169,16,16],[213,168,16,16],[273,201,16,16],[215,230,16,16],[213,168,16,16],[256,169,16,16]],
 aktenkurier:[[350,123,11,8],[346,134,11,7],[290,112,10,7],[293,145,11,8]],
 archivbotin:[[335,157,14,9],[264,125,14,8],[321,106,10,7],[312,137,13,8]],
 formularsammler:[[346,160,13,9],[327,159,13,8],[303,148,12,8],[352,160,13,8]],
 nummernfluesterer:[[303,135,12,8],[311,115,13,9],[337,96,10,7],[311,148,12,8]],
 nachtschichtmelderin:[[320,145,11,8],[291,129,11,8],[342,115,10,7],[311,170,11,8]],
 pfandarchitektin:[[312,144,13,9],[289,137,14,9],[315,111,11,8],[294,165,13,9]],
 kopiependler:[[340,146,12,8],[279,128,12,8],[339,120,11,7],[265,181,12,8]],
 warteschlangenpoetin:[[322,156,11,8],[265,150,12,8],[350,114,10,7],[305,181,12,8]],
};
for(const [id,poses] of Object.entries(posePixels))if(id!=='clerk'){
 const [x,y,w,h]=poses[1];mouths[id]=[x/640,1-y/832,w/640,h/832];
}
const poseAngles={clerk:[-.15,.05,.2,-.06,.05,-.15],aktenkurier:[0,.3,.35,.2],archivbotin:[.15,-.1,-.25,-.2],formularsammler:[.1,.12,.15,.15],nummernfluesterer:[-.1,.05,.25,.15],nachtschichtmelderin:[0,-.16,-.2,-.15],pfandarchitektin:[0,-.3,-.28,-.3],kopiependler:[0,-.1,-.45,-.3],warteschlangenpoetin:[0,.06,-.1,-.05],renter:[.03],parent:[-.3],pensioner:[.05]};
let poseProfiles=null;
function setProfiles(data,validate){
 if(data?.schema_version!==1||!data.profiles)throw new Error('Invalid painted lip profiles');
 for(const [key,angles] of Object.entries(poseAngles)){
  const profiles=data.profiles[key];
  if(!Array.isArray(profiles)||profiles.length!==angles.length)throw new Error('Incomplete painted lip profiles: '+key);
  profiles.forEach((profile,index)=>validate(profile,key+'/'+index));
 }
 poseProfiles=data.profiles;
}
function displayedMouthProfile(actor){
 const source=sourceMouth(actor);return source?poseProfiles?.[source.key]?.[actor.mouthPose??0]??null:null;
}
function sourceMouth(actor){
 const id=actor.lipId||actor.id||actor.name,key=actor.performance?'clerk':id;
 if(actor.mouthPose===null)return null;
 const p=posePixels[key]?.[actor.mouthPose],w=actor.performance||['renter','parent','pensioner'].includes(key)?384:640;
 const rect=p?[p[0]/w,1-p[1]/832,p[2]/w,p[3]/832]:mouths[id]?.slice();
 return rect?{key,p,w,rect}:null;
}
function displayedMouth(actor){
 const source=sourceMouth(actor);return source?transportMouthRect(actor,source.rect,source.key,source.p):null;
}
function transportMouthRect(actor,rect,key,p){
 if(!rect||!actor.renderKey?.startsWith('atlas:'))return rect;
 // Follow the same source-pixel fields used by the existing offline builders.
 // Their phase is the displayed cell; no elapsed speech/body clock is added.
 if(p&&!actor.performance){
  const phase=2*Math.PI*(actor.mouthSample??0)/8,scale=455/512;
  const sx=(rect[0]*640+135)/(2*scale),sy=((1-rect[1])*832+53)/(2*scale);
  const a=1.1*Math.sin(phase+.5),y=(sy+a*410/350)/(1+a/350),upper=clamp((410-y)/350);
  const x=sx+1.15*Math.sin(phase)*upper;
  // The builder rounds atlas offsets (-68,-27) separately from detail (-135,-53).
  rect[0]=(x*2*scale-136)/640;rect[1]=1-(y*2*scale-54)/832;
 }else{
  const index=actor.performance?(actor.frame%8)*8:actor.frame??0,phase=2*Math.PI*index/64;
  const sway=({clerk:3.3,renter:4.5,parent:3.8,pensioner:2.7}[key]??3.3)*Math.sin(phase),nod=1.7*Math.sin(phase+.8),breath=.012*Math.sin(phase*2+.7);
  const sx=rect[0]*192,sy=(1-rect[1])*416;let y=sy;
  for(let n=0;n<6;n++)y=sy+nod*Math.exp(-(((y-74)/57)**2))+1.3*Math.sin(phase*2)*Math.exp(-(((y-185)/82)**2));
  const chest=Math.exp(-(((y-185)/82)**2)),upper=clamp((400-y)/384)**1.35;
  const x=96+(sx-96+sway*upper)*(1+breath*chest);
  rect[0]=x/192;rect[1]=1-y/416;
 }
 return rect;
}
function displayedMouthFrame(actor){
 const source=sourceMouth(actor);if(!source)return null;
 const {key,p,w,rect}=source,angle=poseAngles[key]?.[actor.mouthPose??0]??poseAngles[key]?.[0];
 if(!Number.isFinite(angle))throw new Error('Unregistered atlas lip angle: '+key);
 const center=transportMouthRect(actor,rect.slice(),key,p);
 const sample=(x,y)=>transportMouthRect(actor,[rect[0]+x/w,rect[1]-y/832,...rect.slice(2)],key,p);
 const t=sample(Math.cos(angle),Math.sin(angle)),n=sample(-Math.sin(angle),Math.cos(angle));
 return{rect:center,axes:[(t[0]-center[0])*rect[2]*w,(t[1]-center[1])*rect[2]*w,(n[0]-center[0])*rect[3]*832,(n[1]-center[1])*rect[3]*832],sourceWidth:w};
}
function displayedMouthAngle(actor){
 const frame=displayedMouthFrame(actor);if(!frame)throw new Error('Unregistered atlas lip angle: '+(actor.lipId||actor.id||actor.name));
 return Math.atan2(-frame.axes[1]*832,frame.axes[0]*frame.sourceWidth);
}
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
function createPaintSplat(T,paintGlsl,profileValues){
 const speaking={value:0};
 const angle={value:0},frame={value:new T.Vector4()},profileCache=new WeakMap();
 const curves={value:new T.Matrix4()},lower={value:new T.Vector4()},ends={value:new T.Vector4()},tail={value:new T.Vector3()},style={value:new T.Vector3()};
 const cols=25,rows=17,count=cols*rows,quad=new T.PlaneGeometry(1,1),geometry=new T.InstancedBufferGeometry();
 geometry.index=quad.index;geometry.attributes=quad.attributes;
 const points=new Float32Array(count*3);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;points[i*3]=(x+.5)/cols*2-1;points[i*3+1]=(y+.5)/rows*2-1}
 geometry.setAttribute("lipCell",new T.InstancedBufferAttribute(points,3));geometry.instanceCount=count;
 const shape={value:new T.Vector4()},rect={value:new T.Vector4()},crop={value:new T.Vector4()},size={value:new T.Vector2()},breath={value:0};
 const material=new T.MeshBasicMaterial({transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide});
 material.forceSinglePass=true; // Flat paint needs one pass; retain visibility from both sides.
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{lipSpeaking:speaking,lipCurves:curves,lipLower:lower,lipEnds:ends,lipTail:tail,lipStyle:style,lipFrame:frame,lipShape:shape,lipRect:rect,lipCrop:crop,lipSize:size,lipBreath:breath});
  shader.vertexShader=`attribute vec3 lipCell;uniform vec4 lipShape,lipRect,lipCrop;uniform vec2 lipSize;uniform float lipBreath;
   varying vec2 lipUv,lipKernel,lipFace;
   `+shader.vertexShader.replace("#include <begin_vertex>",`
   vec2 halfPatch=lipRect.zw*vec2(2.5,3.);
   vec2 spacing=halfPatch*vec2(2./${cols}.,2./${rows}.);
   vec2 local=position.xy*spacing*2.7;
   vec2 source=lipRect.xy+lipCell.xy*halfPatch+local;
   vec2 p=source;
   lipFace=source;
   lipUv=lipCrop.xy+source*lipCrop.zw;lipKernel=position.xy*2.7;
   vec3 transformed=vec3((p-vec2(.5))*lipSize,.0008);
   float upper=smoothstep(-lipSize.y*.42,lipSize.y*.1,transformed.y);
   transformed.y+=.008*lipBreath*upper;transformed.x*=1.+.006*lipBreath*upper;
   `);
  shader.fragmentShader=`uniform float lipSpeaking;uniform mat4 lipCurves;uniform vec4 lipLower,lipEnds,lipFrame;uniform vec3 lipTail,lipStyle;uniform vec4 lipShape,lipRect,lipCrop;uniform float lipBreath;varying vec2 lipUv,lipKernel,lipFace;
   ${paintGlsl}
   `+shader.fragmentShader.replace("#include <map_fragment>",`
   float kernel=exp(-.5*dot(lipKernel,lipKernel));
   vec4 paint=amtMouthPaintFrame(map,lipUv,vec4(lipCrop.xy+lipRect.xy*lipCrop.zw,lipRect.zw*lipCrop.zw),lipShape,lipFrame,lipCurves,lipLower,lipEnds,lipTail,lipStyle,lipSpeaking);diffuseColor*=paint;
   float lightness=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(vec3(lightness),diffuseColor.rgb,1.085+.055*lipBreath)*(1.015+.035*lipBreath);
    // Partition optical depth among overlapping native-image Gaussians.
    diffuseColor.a=1.-exp(log(max(1.-diffuseColor.a,1e-5))*kernel/6.20);
   `);
 };
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.visible=false;
 let actor=null,disposed=false;
 return{
  update(source,speech,now){
   if(disposed)return;
   if(source!==actor){if(actor)actor.mesh.material.userData.lipHole.value=0;mesh.removeFromParent();shape.value.set(0,0,0,0);actor=source;if(actor)actor.mesh.add(mesh)}
   if(!actor){mesh.visible=false;return}
   const oralFrame=displayedMouthFrame(actor),registration=oralFrame?.rect,profile=displayedMouthProfile(actor);
   if(!registration||!profile||!actor.mesh.material.map?.image){mesh.visible=false;actor.mesh.material.userData.lipHole.value=0;return}
   const target=speech?.active?speech.shape:rest;
   // The cue sampler already coarticulates. Copy its playhead pose directly;
   // another temporal filter would move visible openings after the sound.
   shape.value.fromArray(target);
   rect.value.fromArray(registration);actor.mesh.material.userData.lipRect.value.set(registration[0],registration[1],registration[2]*2.5,registration[3]*3);
   const uv=actor.uv;crop.value.set(uv.getX(2),uv.getY(2),uv.getX(3)-uv.getX(2),uv.getY(0)-uv.getY(2));
   let packed=profileCache.get(profile);
   if(!packed){packed=profileValues(profile);profileCache.set(profile,packed)}
   for(const [name,uniform] of Object.entries({curves,lower,ends,tail,style}))uniform.value.fromArray(packed[name]);
   speaking.value=speech?.active?1:0;
   const preOpen=profile.source_upper.some((value,index)=>Math.abs(value-profile.source_lower[index])>.001);
   const active=speaking.value&&(shape.value.x+shape.value.y+shape.value.z+shape.value.w>.015||preOpen);
   mesh.visible=!!active&&actor.mesh.material.opacity>.001;actor.mesh.material.userData.lipHole.value=active?1:0;
   const image=actor.mesh.material.map.image,axes=oralFrame.axes;
   frame.value.set(axes[0]*crop.value.z*image.width,-axes[1]*crop.value.w*image.height,axes[2]*crop.value.z*image.width,-axes[3]*crop.value.w*image.height);
   angle.value=Math.atan2(frame.value.y,frame.value.x);
   size.value.set(actor.mesh.geometry.parameters.width,actor.mesh.geometry.parameters.height);
   breath.value=actor.mesh.material.userData.breath.value;
   if(material.map!==actor.mesh.material.map){material.map=actor.mesh.material.map;material.needsUpdate=true}
   if(material.fog!==actor.mesh.material.fog){material.fog=actor.mesh.material.fog;material.needsUpdate=true}
   material.color.copy(actor.mesh.material.color);material.opacity=actor.mesh.material.opacity;material.depthTest=actor.mesh.material.depthTest;mesh.renderOrder=actor.mesh.renderOrder;
   mesh.layers.mask=actor.mesh.layers.mask;
  },
  inspect(){return{actor:actor?.lipId||actor?.id||actor?.name||null,pose:actor?.mouthPose??null,angle:angle.value,rect:rect.value.toArray(),visible:mesh.visible,shape:shape.value.toArray(),kernels:count,layer:mesh.layers.mask,depthTest:material.depthTest,depthWrite:material.depthWrite}},
  dispose(){if(disposed)return;disposed=true;if(actor)actor.mesh.material.userData.lipHole.value=0;mesh.removeFromParent();geometry.dispose();material.dispose()},
 };
}
let recordingModule;
const loadRecording=(path,sha)=>{recordingModule??=import('./buergeramt-lipsync.js?v=20261012-one-knick');return recordingModule.then(m=>m.resolveMouthTrack(path,sha))};
global.GermanyAmtLips={createTrack,score,poseAt,mouths,displayedMouth,displayedMouthFrame,displayedMouthAngle,displayedMouthProfile,setProfiles,installMask,createPaintSplat,loadRecording};
})(typeof window!=="undefined"?window:globalThis);
