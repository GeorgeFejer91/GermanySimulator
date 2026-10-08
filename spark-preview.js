import * as THREE from 'three';
import {prepareWithSegments,measureLineStats,measureNaturalWidth} from './assets/vendor/pretext/dist/layout.js';
import {CYCLE_DURATION,ANCHORS,ANCHOR_TIMES,cycleAt,transitionAt,advanceClock} from './spark-preview-cycle.mjs?v=cycle5';

await document.fonts.load('16px Study');
await document.fonts.load('700 16px Study');
const byId=id=>document.getElementById(id),status=byId('status'),view=byId('view');
const params=new URLSearchParams(location.search),character=params.get('scene')==='knick';
const duration=character?CYCLE_DURATION:7,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'default'});
renderer.outputColorSpace=THREE.SRGBColorSpace;view.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x66685f);
const camera=new THREE.PerspectiveCamera(43,1,.1,50);
const geometry=new THREE.BufferGeometry(),samples=[];
let count,rows,segments,slots=0,mappingData,paintData,partData,policies=[];
if(character){
 document.querySelector('h1').textContent='Frau Knick · the complete stamp cycle';
 byId('description').textContent='A continuous clock carries fourteen painted anchors through the stamp cycle. Compatible poses keep moving; arm crossings and paperwork use brief protected handoffs.';
 byId('footnote').textContent='No scheduled holds at intermediate keys. The stamp follows a curved path; incompatible poses use short cuts. Painting differences remain visible. Three.js r186 · Spark 2.3.1.';
 document.querySelector('.anchors').hidden=false;
 view.setAttribute('aria-label','Frau Knick raises her stamp, stamps a document, folds her arms and returns to ready');
 const manifestResponse=await fetch('./assets/previews/knick-splats/manifest.json?v=cycle5');
 if(!manifestResponse.ok)throw Error('Character manifest could not load');
 const manifest=await manifestResponse.json();
 count=manifest.sample_count;slots=manifest.slots_per_anchor;segments=manifest.segment_count;rows=count/256;
 if(!Number.isInteger(rows)||count!==slots*2||count>40000||segments!==ANCHORS.length||manifest.record_bytes!==20||manifest.transitions?.length!==segments)throw Error('Invalid character manifest');
 policies=manifest.transitions;
 manifest.anchors.forEach((anchor,i)=>{
  const figure=document.createElement('figure'),img=document.createElement('img'),button=document.createElement('button');
  img.src='./assets/previews/knick-splats/'+anchor.preview;img.alt='Frau Knick: '+anchor.name;img.loading='lazy';img.width=1024;img.height=832;
  button.id='pose-'+i;button.textContent=(i+1)+' · '+anchor.name;button.onclick=()=>setTime(ANCHOR_TIMES[i]);
  figure.append(img,button);document.querySelector('.anchors').append(figure);
 });
 const response=await fetch('./assets/previews/knick-splats/correspondence.bin?v=cycle5');
 if(!response.ok)throw Error('Character correspondence could not load');
 const buffer=await response.arrayBuffer();if(buffer.byteLength!==count*segments*20)throw Error('Invalid character correspondence');
 const data=new DataView(buffer);
 const partsResponse=await fetch('./assets/previews/knick-splats/parts.bin?v=cycle5');
 if(!partsResponse.ok)throw Error('Character part ownership could not load');
 partData=new Uint8Array(await partsResponse.arrayBuffer());if(partData.length!==count*segments)throw Error('Invalid character part ownership');
 mappingData=new Float32Array(count*segments*4);paintData=new Uint8Array(count*segments*4);
 for(let i=0;i<count*segments;i++){
  for(let c=0;c<4;c++)mappingData[i*4+c]=data.getFloat32(i*20+c*4,true);
  for(let c=0;c<4;c++)paintData[i*4+c]=data.getUint8(i*20+16+c);
 }
}else{
const sheet=document.createElement('canvas');sheet.width=144;sheet.height=192;
const ctx=sheet.getContext('2d',{willReadFrequently:true});
ctx.fillStyle='#e6dfc7';ctx.fillRect(0,0,144,192);
ctx.fillStyle='#34342c';ctx.font='700 11px Study';ctx.fillText('BÜRGERAMT',10,19);
ctx.font='8px Study';ctx.fillText('Antrag auf einen weiteren Antrag',10,34);
ctx.fillRect(10,41,122,1);
ctx.fillText('Aktenzeichen  08 / 15',10,55);
ctx.strokeStyle='#888779';ctx.lineWidth=1;
for(let y=68;y<170;y+=14){ctx.strokeRect(10,y,5,5);ctx.fillStyle='#888779';ctx.fillRect(23,y+1,98-(y%3)*12,2)}
ctx.save();ctx.translate(73,111);ctx.rotate(-.18);ctx.fillStyle='#923b2e';ctx.strokeStyle='#923b2e';ctx.lineWidth=3;ctx.strokeRect(-64,-16,128,30);ctx.font='700 22px Study';ctx.textAlign='center';ctx.fillText('ABGELEHNT',0,6);ctx.restore();
const pixels=ctx.getImageData(0,0,144,192).data;
for(let y=0;y<192;y+=2)for(let x=0;x<144;x+=2){
 const i=(y*144+x)*4,p=new THREE.Vector3((x-71)/55,(95-y)/55,0),color=new THREE.Color().setRGB(pixels[i]/255,pixels[i+1]/255,pixels[i+2]/255,THREE.SRGBColorSpace);
 samples.push({p,target:p,color,alpha:1,group:0});
}
 count=samples.length;rows=Math.ceil(count/256);segments=1;
 mappingData=new Float32Array(256*rows*4);paintData=new Uint8Array(256*rows*4);
 samples.forEach(({p,color},i)=>{mappingData.set([p.x,p.y,p.x,p.y],i*4);const c=color.clone().convertLinearToSRGB();paintData.set([Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255),255],i*4)});
}
partData??=new Uint8Array(256*rows*segments);
const indices=new Float32Array(count*3);
for(let i=0;i<count;i++)indices.set([i%256,Math.floor(i/256),character&&i>=slots?1:0],i*3);
geometry.setAttribute('position',new THREE.BufferAttribute(indices,3));
const correspondence=new THREE.DataTexture(mappingData,256,rows*segments,THREE.RGBAFormat,THREE.FloatType);
const paint=new THREE.DataTexture(paintData,256,rows*segments,THREE.RGBAFormat,THREE.UnsignedByteType);
const parts=new THREE.DataTexture(partData,256,rows*segments,THREE.RedFormat,THREE.UnsignedByteType);
correspondence.needsUpdate=paint.needsUpdate=parts.needsUpdate=true;
// Shared GPU positions, colours and clock; fixed allocation across all segments.
const motion=`
float spread(float t){return smoothstep(.8,2.8,t)*(1.-smoothstep(4.1,6.3,t));}
float cloudSpread(float t,float phase){return ${character?'sin(3.14159265*phase)':'spread(t)'};}
vec3 scatter(vec3 p,float t,float d){
 float a=sin(dot(p.xy,vec2(3.17,5.23)));
 float b=sin(dot(p.xy,vec2(7.71,-2.19)));
 float c=sin(dot(p.xy,vec2(1.37,9.13)));
 float angle=d*(3.8+a*1.4);
 vec2 q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xy;
 return vec3(mix(p.xy,q,d)+vec2(a*1.65,b*.9+sin(t*1.2+a)*.25)*d,c*d*1.5);
}
vec2 pathCenter(vec4 ends,vec4 tangents,float u){
 float u2=u*u,u3=u2*u;
 return (2.*u3-3.*u2+1.)*ends.xy+(u3-2.*u2+u)*tangents.xy+(-2.*u3+3.*u2)*ends.zw+(u3-u2)*tangents.zw;
}
vec3 sampleMotion(vec3 p,vec3 target,float t,float phase,float dissolve,float guarded,float part,vec4 headPath,vec4 headTangents,vec4 stampPath,vec4 stampTangents,vec2 angles){
 ${character?'if(guarded>.5)return p;vec3 base=mix(p,target,phase);if(part>1.5){vec4 ends=stampPath;vec4 tangents=stampTangents;float a=phase*angles.y;vec2 q=p.xy-ends.xy;float c=cos(a),s=sin(a);base.xy=pathCenter(ends,tangents,phase)+mat2(c,s,-s,c)*q;}return base;':'return scatter(p,t,spread(t));'}
}
float sampleFade(float group,float t,float phase,float guarded,float part){
 ${character?'float handoff=step(.5,phase);return mix(1.-handoff,handoff,group);':'return 1.-spread(t)*.34;'}
}`;
const baseScale=character?3/208*.58:.0105;
const uniforms={time:{value:0},phase:{value:0},pair:{value:0},guarded:{value:0},pixelScale:{value:1},dissolve:{value:0},mapping:{value:correspondence},paint:{value:paint},parts:{value:parts},headPath:{value:new THREE.Vector4()},headTangents:{value:new THREE.Vector4()},stampPath:{value:new THREE.Vector4()},stampTangents:{value:new THREE.Vector4()},angles:{value:new THREE.Vector2()}};
const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
 vertexShader:`uniform float time,phase,pair,pixelScale,dissolve,guarded;uniform sampler2D mapping,paint,parts;uniform vec4 headPath,headTangents,stampPath,stampTangents;uniform vec2 angles;varying vec3 tint;varying float fade;${motion}
 vec3 toLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
 void main(){
  ivec2 index=ivec2(position.xy)+ivec2(0,int(pair)*${rows});
  vec4 mapped=texelFetch(mapping,index,0),rgba=texelFetch(paint,index,0);
  float part=texelFetch(parts,index,0).r*255.;
  tint=toLinear(rgba.rgb);fade=rgba.a*sampleFade(position.z,time,phase,guarded,part);
  vec4 mv=modelViewMatrix*vec4(sampleMotion(vec3(mapped.xy,0.),vec3(mapped.zw,0.),time,phase,dissolve,guarded,part,headPath,headTangents,stampPath,stampTangents,angles),1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(${baseScale*Math.sqrt(7)}*pixelScale*(1.+cloudSpread(time,phase)*${character?'dissolve*(1.-guarded)*.5':'.5'})/(-mv.z),1.,64.);
 }`,
 fragmentShader:`varying vec3 tint;varying float fade;void main(){vec2 d=gl_PointCoord*2.-1.;float r=dot(d,d);if(r>1.)discard;gl_FragColor=vec4(tint,exp(-r*3.5)*fade);
 #include <colorspace_fragment>
 }`
});
const points=new THREE.Points(geometry,material);points.position.y=character?1.86:2;points.frustumCulled=false;scene.add(points);
const desk=new THREE.Mesh(new THREE.BoxGeometry(8,.18,4),new THREE.MeshBasicMaterial({color:0x99917c}));desk.position.set(0,-.05,0);scene.add(desk);
const box=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.65),new THREE.MeshBasicMaterial({color:0x414b41}));box.position.set(-1.7,.42,1);box.visible=!character;scene.add(box);
const props=[];let paperStack=null;
if(character){
 function prop(w,h,d,x,y,z,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color}));mesh.position.set(x,y,z);scene.add(mesh);props.push(mesh);return mesh}
 prop(1.2,1.85,.72,1.79,.97,-.45,0x595b51);
 prop(1.3,.09,.86,1.79,1.94,-.37,0xa29a84);
 paperStack=prop(.72,.035,.47,1.79,2.003,-.19,0xe3dcc6);
}
let spark=null,splat=null,sparkValues=null,sparkPromise=null,mode='points',time=0,playing=false,pendingAutoplay=false,loop=character,speed=1,last=0,raf=0,dirty=true,disposed=false,lost=false,frames=0,lastSplatState='';
const cpuTimes=[],frameTimes=[];let lastRendered=0,modeStartupMs=null,lastStatus='';
function measureText(){
 const available=typeof Intl.Segmenter==='function'&&document.fonts.check('16px Study');
 document.documentElement.dataset.textMeasurement=available?'pretext-0.0.9':'unavailable';
 for(const el of document.querySelectorAll('h1,p,button,label>span,nav a')){
  if(!available||!el.getClientRects().length)continue;
  const css=getComputedStyle(el),r=el.getBoundingClientRect(),width=r.width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth),height=r.height-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom)-parseFloat(css.borderTopWidth)-parseFloat(css.borderBottomWidth);
  const prepared=prepareWithSegments(el.textContent,`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`,{letterSpacing:parseFloat(css.letterSpacing)||0});
  const stats=measureLineStats(prepared,Math.max(1,width)),lineHeight=parseFloat(css.lineHeight);
  el.dataset.fit=stats.maxLineWidth<=width+.5&&stats.lineCount*lineHeight<=height+1?'fit':'reflow';
  el.dataset.naturalWidth=String(Math.round(measureNaturalWidth(prepared)));
 }
}
function setStatus(text){if(lastStatus===text)return;lastStatus=text;status.textContent=text;measureText()}
function updateStatus(){setStatus(`${mode==='points'?'Three.js particles':'Spark splats'} · ${character?cycleAt(time).label:'Fax dissolve'}${character?' · '+(transitionAt(time,policies).guarded?'Intact pose':'Splat motion'):''} · ${playing?'Playing':'Paused'}${playing&&loop?' · Loop on':''}`)}
function wake(){dirty=true;if(!raf&&!disposed&&!lost&&!document.hidden)raf=requestAnimationFrame(frame)}
function resize(){
 const r=view.getBoundingClientRect(),scale=Math.min(1,Math.sqrt(1600000/(r.width*r.height)));
 renderer.setSize(Math.floor(r.width*scale),Math.floor(r.height*scale),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
 uniforms.pixelScale.value=renderer.domElement.height/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));updateCamera();measureText();wake();
}
function updateCamera(){const angle=Number(byId('angle').value)*Math.PI/180,cloud=!character||uniforms.dissolve.value>0;const distance=(cloud?8.8:6.4)*Math.max(1,(cloud?1.4:1.1)/camera.aspect);camera.position.set(Math.sin(angle)*distance+(character?.5:0),2.4,Math.cos(angle)*distance);camera.lookAt(character?.5:0,1.86,0)}
async function loadSpark(){
 const start=performance.now(),{SparkRenderer,SplatMesh,dyno}=await import('@sparkjsdev/spark');
 if(disposed)throw Error('Preview closed');
 sparkValues={t:dyno.dynoFloat(time),phase:dyno.dynoFloat(0),pair:dyno.dynoFloat(0),guarded:dyno.dynoFloat(0),dissolve:dyno.dynoFloat(uniforms.dissolve.value),headPath:dyno.dynoVec4(new THREE.Vector4()),headTangents:dyno.dynoVec4(new THREE.Vector4()),stampPath:dyno.dynoVec4(new THREE.Vector4()),stampTangents:dyno.dynoVec4(new THREE.Vector4()),angles:dyno.dynoVec2(new THREE.Vector2())};
 splat=new SplatMesh({maxSplats:count,constructSplats:packed=>{
  const scale=new THREE.Vector3(baseScale,baseScale,baseScale*.43),q=new THREE.Quaternion(),white=new THREE.Color(1,1,1);
  for(let i=0;i<count;i++)packed.pushSplat(new THREE.Vector3(indices[i*3],indices[i*3+1],indices[i*3+2]),scale,q,1,white);
 }});
 await splat.initialized;if(disposed){splat.dispose();return}
 splat.objectModifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>({gsplat:new dyno.Dyno({
  inTypes:{gsplat:dyno.Gsplat,t:'float',phase:'float',pair:'float',guarded:'float',dissolve:'float',mapping:'sampler2D',paint:'sampler2D',parts:'sampler2D',headPath:'vec4',headTangents:'vec4',stampPath:'vec4',stampTangents:'vec4',angles:'vec2'},outTypes:{gsplat:dyno.Gsplat},globals:()=>[motion],
  statements:({inputs:i,outputs:o})=>dyno.unindentLines(`${o.gsplat}=${i.gsplat};
   ivec2 index=ivec2(${i.gsplat}.center.xy+vec2(.1))+ivec2(0,int(${i.pair})*${rows});
   vec4 mapped=texelFetch(${i.mapping},index,0);float part=texelFetch(${i.parts},index,0).r*255.;
   ${o.gsplat}.center=sampleMotion(vec3(mapped.xy,0.),vec3(mapped.zw,0.),${i.t},${i.phase},${i.dissolve},${i.guarded},part,${i.headPath},${i.headTangents},${i.stampPath},${i.stampTangents},${i.angles});
   ${o.gsplat}.scales*=1.+cloudSpread(${i.t},${i.phase})*${character?i.dissolve+'*(1.-'+i.guarded+')*.5':'.5'};
   ${o.gsplat}.rgba=texelFetch(${i.paint},index,0);
   ${o.gsplat}.rgba.w*=sampleFade(${i.gsplat}.center.z,${i.t},${i.phase},${i.guarded},part);`)
 }).apply({gsplat,...sparkValues,mapping:dyno.dynoSampler2D(correspondence),paint:dyno.dynoSampler2D(paint),parts:dyno.dynoSampler2D(parts)}).gsplat}));
 splat.updateGenerator();splat.position.y=character?1.86:2;
 spark=new SparkRenderer({renderer,enableLod:false,maxStdDev:Math.sqrt(7),onDirty:()=>{if(mode==='spark')wake()}});
 modeStartupMs=performance.now()-start;
}
async function setMode(next){
 if(next!=='points'&&next!=='spark')throw Error('Unknown renderer');if(disposed)return;
 byId('spark').disabled=byId('points').disabled=true;
 try{
  if(next==='spark'&&!spark){setStatus('Loading Spark…');sparkPromise??=loadSpark();await sparkPromise}
  if(disposed)return;
  mode=next;points.visible=mode==='points';
  if(spark){if(mode==='spark')scene.add(spark,splat);else scene.remove(spark,splat)}
  byId('points').setAttribute('aria-pressed',String(mode==='points'));byId('spark').setAttribute('aria-pressed',String(mode==='spark'));
  lastSplatState='';updateStatus();wake();
 }catch(error){setStatus('Spark could not load. Three.js particles remain available. '+error.message);console.error(error);sparkPromise=null}
 finally{byId('spark').disabled=byId('points').disabled=false}
}
function setPlaying(value){
 if(lost||disposed)return;pendingAutoplay=false;playing=value;if(playing&&time>=duration)time=0;last=lastRendered=0;
 byId('play').textContent=playing?'Pause':'Play cycle';updateStatus();wake();
}
function play(){setPlaying(!playing)}
function setTime(value){setPlaying(false);time=Math.max(0,Math.min(duration,Number(value)||0));byId('time').value=time;updateStatus();wake()}
function setLoop(value){loop=!!value;byId('loop').setAttribute('aria-pressed',String(loop));byId('loop').textContent=loop?'Loop on':'Loop off';updateStatus()}
function setSpeed(value){if(![.25,.5,1,1.5].includes(value))return;speed=value;byId('speed').value=String(value);last=0;wake()}
function syncMotion(){
 const state=character?transitionAt(time,policies):{pair:0,phase:0,guarded:false};
 uniforms.time.value=time;uniforms.phase.value=state.phase;uniforms.pair.value=state.pair;uniforms.guarded.value=Number(state.guarded);
 if(paperStack)paperStack.visible=!state.paperInHand;
 if(character){
  const policy=policies[state.pair];
  for(const [name,curve] of [['head',policy.head_curve],['stamp',policy.stamp_curve]]){
   uniforms[name+'Path'].value.set(...curve[0],...curve[1]);uniforms[name+'Tangents'].value.set(...curve[2],...curve[3]);
  }
  uniforms.angles.value.fromArray(policy.rigid_angles);
 }
 const key=[time,uniforms.dissolve.value,state.pair,state.phase].join(':');
 if(splat&&mode==='spark'&&lastSplatState!==key){
  sparkValues.t.value=time;sparkValues.phase.value=state.phase;sparkValues.pair.value=state.pair;sparkValues.guarded.value=Number(state.guarded);sparkValues.dissolve.value=uniforms.dissolve.value;
  for(const name of ['headPath','headTangents','stampPath','stampTangents','angles'])sparkValues[name].value.copy(uniforms[name].value);
  splat.needsUpdate=true;lastSplatState=key;
 }
 byId('time').setAttribute('aria-valuetext',`${time.toFixed(1)} of ${duration} seconds${character?', '+cycleAt(time).label:''}`);
}
function frame(now){
 raf=0;if(disposed||lost||document.hidden)return;
 if(playing&&last&&now-last<1000/60-.5){raf=requestAnimationFrame(frame);return}
 if(playing){
  time=advanceClock(time,last?(now-last)/1000:0,speed,loop,duration);byId('time').value=time;
  if(!loop&&time>=duration){dirty=true;playing=false;byId('play').textContent='Play cycle'}
  updateStatus();
 }
 last=now;
 if(dirty||playing){
  dirty=false;syncMotion();
  const start=performance.now();renderer.render(scene,camera);cpuTimes.push(performance.now()-start);frames++;
  if(lastRendered&&playing)frameTimes.push(now-lastRendered);lastRendered=now;
  if(cpuTimes.length>600)cpuTimes.shift();if(frameTimes.length>600)frameTimes.shift();
 }
 // Cold GPU compilation belongs to preparation, before the opening pose hold.
 if(pendingAutoplay){pendingAutoplay=false;if(!reducedMotion.matches)setPlaying(true)}
 if(playing&&!raf)raf=requestAnimationFrame(frame);
}
function setEffect(dissolve){if(character)return;uniforms.dissolve.value=Number(dissolve)||0;lastSplatState='';updateCamera();wake()}
byId('play').onclick=play;byId('loop').onclick=()=>setLoop(!loop);byId('speed').onchange=()=>setSpeed(Number(byId('speed').value));
byId('points').onclick=()=>setMode('points');byId('spark').onclick=()=>setMode('spark');
byId('time').max=duration;byId('time').oninput=()=>setTime(Number(byId('time').value));
byId('angle').oninput=()=>{updateCamera();wake()};byId('reload').onclick=()=>location.reload();

document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=lastRendered=0}else wake()});
reducedMotion.addEventListener('change',event=>{if(event.matches)setPlaying(false)});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;playing=false;cancelAnimationFrame(raf);raf=0;byId('play').disabled=true;setStatus('Graphics paused. Reload the preview to restore the scene.');byId('reload').hidden=false});
const observer=new ResizeObserver(resize);observer.observe(view);observer.observe(document.querySelector('main'));
function dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();splat?.dispose();spark?.dispose();correspondence.dispose();paint.dispose();parts.dispose();geometry.dispose();material.dispose();for(const mesh of [desk,box,...props]){mesh.geometry.dispose();mesh.material.dispose()}renderer.dispose()}
addEventListener('pagehide',event=>{if(!event.persisted)dispose()});
window.faxStudy={setMode,setTime,setEffect,setLoop,setSpeed,play,inspect:()=>({version:'cycle5',mode,scene:character?'knick':'fax',time,duration,cycle:character?transitionAt(time,policies):null,anchorCount:character?ANCHORS.length:0,paperOnCounter:paperStack?.visible??null,playing,loop,speed,frames,count,modeStartupMs,buffer:[renderer.domElement.width,renderer.domElement.height],render:{...renderer.info.render},memory:{...renderer.info.memory},cpuTimes:[...cpuTimes],frameTimes:[...frameTimes],three:THREE.REVISION,measurement:document.documentElement.dataset.textMeasurement}),resetMetrics(){cpuTimes.length=frameTimes.length=0;lastRendered=0},async settle(){syncMotion();if(spark&&mode==='spark')await spark.update({scene,camera});wake()}};
resize();setLoop(loop);updateStatus();
if(params.get('renderer')==='spark')await setMode('spark');byId('play').disabled=false;
if(character&&!reducedMotion.matches&&params.get('autoplay')!=='0'){pendingAutoplay=true;wake()}
