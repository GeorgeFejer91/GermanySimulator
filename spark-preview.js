import * as THREE from 'three';
import {prepareWithSegments,measureLineStats,measureNaturalWidth} from './assets/vendor/pretext/dist/layout.js';

await document.fonts.load('16px Study');
await document.fonts.load('700 16px Study');
const byId=id=>document.getElementById(id),status=byId('status'),view=byId('view');
const params=new URLSearchParams(location.search),character=params.get('scene')==='knick';
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'default'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
view.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x66685f);
const camera=new THREE.PerspectiveCamera(43,1,.1,50);
const geometry=new THREE.BufferGeometry(),samples=[],positions=[],colors=[],targets=[],groups=[],alphas=[];
let correspondence=null;
if(character){
 document.querySelector('h1').textContent='Frau Knick · two painted anchors';
 byId('description').textContent='Move from the held stamp to the raised stamp and back. Compare a guided splat morph with a dissolve, or scrub through each intermediate pose.';
 byId('footnote').textContent='Experimental 2D image transition · Hand-marked correspondence, no inferred skeleton or hidden artwork. Watch the face, crossing arm and stamp for smearing. Three.js r186 · Spark 2.3.1.';
 document.querySelector('.anchors').hidden=false;for(const el of document.querySelectorAll('[data-character]'))el.hidden=false;
 byId('anchor-a').src='./assets/previews/knick-splats/anchor-0.webp';byId('anchor-b').src='./assets/previews/knick-splats/anchor-1.webp';
 view.setAttribute('aria-label','Frau Knick transitioning between a held and a raised stamp');
 const response=await fetch('./assets/previews/knick-splats/correspondence.bin');if(!response.ok)throw Error('Character correspondence could not load');
 const data=new Float32Array(await response.arrayBuffer());if(data.length%9||data.length>900000)throw Error('Invalid character correspondence');
 for(let i=0;i<data.length;i+=9){const p=new THREE.Vector3(data[i],data[i+1],0),target=new THREE.Vector3(data[i+2],data[i+3],0),color=new THREE.Color().setRGB(data[i+4],data[i+5],data[i+6],THREE.SRGBColorSpace);samples.push({p,target,color,alpha:data[i+7],group:data[i+8]})}
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
}
for(const {p,target,color,alpha,group} of samples){positions.push(...p);targets.push(...target);colors.push(color.r,color.g,color.b);alphas.push(alpha);groups.push(group)}
geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
geometry.setAttribute('targetPosition',new THREE.Float32BufferAttribute(targets,3));geometry.setAttribute('anchorGroup',new THREE.Float32BufferAttribute(groups,1));geometry.setAttribute('sampleAlpha',new THREE.Float32BufferAttribute(alphas,1));
const textureData=new Float32Array(256*Math.ceil(samples.length/256)*4);
samples.forEach(({p,target},i)=>textureData.set([p.x,p.y,target.x,target.y],i*4));
correspondence=new THREE.DataTexture(textureData,256,Math.ceil(samples.length/256),THREE.RGBAFormat,THREE.FloatType);correspondence.needsUpdate=true;
// One motion function feeds both GPU implementations; no per-frame CPU particle loop.
const motion=`
float spread(float t){return smoothstep(.8,2.8,t)*(1.-smoothstep(4.1,6.3,t));}
float anchorPhase(float t){return smoothstep(.7,3.,t)*(1.-smoothstep(4.,6.3,t));}
float cloudSpread(float t){return ${character?'sin(3.14159265*anchorPhase(t))':'spread(t)'};}
vec3 faxMotion(vec3 p,float t){
 float d=spread(t);
 float a=sin(dot(p.xy,vec2(3.17,5.23)));
 float b=sin(dot(p.xy,vec2(7.71,-2.19)));
 float c=sin(dot(p.xy,vec2(1.37,9.13)));
 float angle=d*(3.8+a*1.4);
 vec2 q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xy;
 return vec3(mix(p.xy,q,d)+vec2(a*1.65,b*.9+sin(t*1.2+a)*.25)*d,c*d*1.5);
}
vec3 sampleMotion(vec3 p,vec3 target,float t,float dissolve){
 ${character?'vec3 base=mix(p,target,anchorPhase(t));return mix(base,faxMotion(base,t),dissolve*cloudSpread(t));':'return faxMotion(p,t);'}
}
float sampleFade(float group,float t){${character?'return mix(1.-anchorPhase(t),anchorPhase(t),group);':'return 1.-spread(t)*.34;'}}`;
const baseScale=character?3/208*.58:.0105;
const uniforms={time:{value:0},pixelScale:{value:1},dissolve:{value:0}};
const material=new THREE.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,
 vertexShader:`uniform float time,pixelScale,dissolve;attribute vec3 targetPosition;attribute float anchorGroup,sampleAlpha;varying vec3 tint;varying float fade;${motion}
 void main(){tint=color;fade=sampleAlpha*sampleFade(anchorGroup,time);vec4 mv=modelViewMatrix*vec4(sampleMotion(position,targetPosition,time,dissolve),1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(${baseScale*Math.sqrt(7)}*pixelScale*(1.+cloudSpread(time)*${character?'dissolve*.5':'.5'})/(-mv.z),1.,64.);}`,
 fragmentShader:`varying vec3 tint;varying float fade;void main(){vec2 d=gl_PointCoord*2.-1.;float r=dot(d,d);if(r>1.)discard;gl_FragColor=vec4(tint,exp(-r*3.5)*fade);
 #include <colorspace_fragment>
 }`
});
const points=new THREE.Points(geometry,material);points.position.y=character?1.86:2;points.frustumCulled=false;scene.add(points);
const desk=new THREE.Mesh(new THREE.BoxGeometry(8,.18,4),new THREE.MeshBasicMaterial({color:0x99917c}));desk.position.set(0,-.05,0);scene.add(desk);
// A foreground file box makes opaque depth occlusion visible during the cycle.
const box=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.65),new THREE.MeshBasicMaterial({color:0x414b41}));box.position.set(-1.7,.42,1);scene.add(box);
let spark=null,splat=null,sparkTime=null,sparkDissolve=null,sparkPromise=null,mode='points',time=0,playing=false,last=0,raf=0,dirty=true,disposed=false,lost=false,frames=0,lastSplatTime=-1;
const cpuTimes=[],frameTimes=[];let lastRendered=0,modeStartupMs=null;
function measureText(){
 const available=typeof Intl.Segmenter==='function'&&document.fonts.check('16px Study');
 document.documentElement.dataset.textMeasurement=available?'pretext-0.0.9':'unavailable';
 for(const el of document.querySelectorAll('h1,p,button,label>span,nav a')){
  if(!available||!el.getClientRects().length)continue;
  const css=getComputedStyle(el),r=el.getBoundingClientRect(),width=r.width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth),height=r.height-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom)-parseFloat(css.borderTopWidth)-parseFloat(css.borderBottomWidth);
  const prepared=prepareWithSegments(el.textContent,`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`,{letterSpacing:parseFloat(css.letterSpacing)||0});
  const stats=measureLineStats(prepared,Math.max(1,width)),lineHeight=parseFloat(css.lineHeight);
  // Content may grow and wrap; a no-fit is exposed, never hidden by clipping or font shrink.
  el.dataset.fit=stats.maxLineWidth<=width+.5&&stats.lineCount*lineHeight<=height+1?'fit':'reflow';
  el.dataset.naturalWidth=String(Math.round(measureNaturalWidth(prepared)));
 }
}
function setStatus(text){status.textContent=text;measureText()}
function wake(){dirty=true;if(!raf&&!disposed&&!lost&&!document.hidden)raf=requestAnimationFrame(frame)}
function resize(){
 const r=view.getBoundingClientRect(),scale=Math.min(1,Math.sqrt(1600000/(r.width*r.height)));
 renderer.setSize(Math.floor(r.width*scale),Math.floor(r.height*scale),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
 uniforms.pixelScale.value=renderer.domElement.height/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));updateCamera();measureText();wake();
}
function updateCamera(){const angle=Number(byId('angle').value)*Math.PI/180;const cloud=!character||uniforms.dissolve.value>0;const distance=(cloud?8.8:6.4)*Math.max(1,(cloud?1.4:.85)/camera.aspect);camera.position.set(Math.sin(angle)*distance,2.4,Math.cos(angle)*distance);camera.lookAt(0,1.86,0)}
async function loadSpark(){
 const start=performance.now();
 const {SparkRenderer,SplatMesh,dyno}=await import('@sparkjsdev/spark');
 if(disposed)throw Error('Preview closed');
 sparkTime=dyno.dynoFloat(time);
 sparkDissolve=dyno.dynoFloat(uniforms.dissolve.value);
 splat=new SplatMesh({maxSplats:samples.length,constructSplats:packed=>{
  const scale=new THREE.Vector3(baseScale,baseScale,baseScale*.43),q=new THREE.Quaternion();
  // Spark's packed radiance is sRGB; Three.js point attributes use linear RGB.
  samples.forEach(({color,alpha,group},i)=>packed.pushSplat(new THREE.Vector3(i%256,Math.floor(i/256),group),scale,q,alpha,color.clone().convertLinearToSRGB()));
 }});
 await splat.initialized;
 if(disposed){splat.dispose();return}
 splat.objectModifier=dyno.dynoBlock({gsplat:dyno.Gsplat},{gsplat:dyno.Gsplat},({gsplat})=>({gsplat:new dyno.Dyno({
  inTypes:{gsplat:dyno.Gsplat,t:'float',dissolve:'float',mapping:'sampler2D'},outTypes:{gsplat:dyno.Gsplat},globals:()=>[motion],
  statements:({inputs,outputs})=>dyno.unindentLines(`${outputs.gsplat}=${inputs.gsplat};
   vec4 mapped=texelFetch(${inputs.mapping},ivec2(${inputs.gsplat}.center.xy+vec2(.1)),0);
   ${outputs.gsplat}.center=sampleMotion(vec3(mapped.xy,0.),vec3(mapped.zw,0.),${inputs.t},${inputs.dissolve});
   ${outputs.gsplat}.scales*=1.+cloudSpread(${inputs.t})*${character?inputs.dissolve+'*.5':'.5'};
   ${outputs.gsplat}.rgba.w*=sampleFade(${inputs.gsplat}.center.z,${inputs.t});`)
 }).apply({gsplat,t:sparkTime,dissolve:sparkDissolve,mapping:dyno.dynoSampler2D(correspondence)}).gsplat}));
 splat.updateGenerator();splat.position.y=character?1.86:2;
 spark=new SparkRenderer({renderer,enableLod:false,maxStdDev:Math.sqrt(7),onDirty:()=>{if(mode==='spark')wake()}});
 modeStartupMs=performance.now()-start;
}
async function setMode(next){
 if(next!=='points'&&next!=='spark')throw Error('Unknown renderer');
 if(disposed)return;
 byId('spark').disabled=true;byId('points').disabled=true;
 try{
  if(next==='spark'&&!spark){setStatus('Loading Spark…');sparkPromise??=loadSpark();await sparkPromise}
  if(disposed)return;
  mode=next;points.visible=mode==='points';
  if(spark){if(mode==='spark'){scene.add(spark,splat)}else{scene.remove(spark,splat)}}
  byId('points').setAttribute('aria-pressed',String(mode==='points'));byId('spark').setAttribute('aria-pressed',String(mode==='spark'));
  setStatus(`${mode==='points'?'Three.js particles':'Spark splats'} · ${samples.length.toLocaleString('en')} samples · ${playing?'Playing':'Paused'}`);
  wake();
 }catch(error){setStatus('Spark could not load. Three.js particles remain available. '+error.message);console.error(error);sparkPromise=null}
 finally{byId('spark').disabled=false;byId('points').disabled=false}
}
function setTime(value){time=Math.max(0,Math.min(7,value));byId('time').value=time;wake()}
function play(){if(lost||disposed)return;playing=!playing;if(playing&&time>=7)time=0;last=0;lastRendered=0;byId('play').textContent=playing?'Pause':'Play cycle';setStatus(`${mode==='points'?'Three.js particles':'Spark splats'} · ${samples.length.toLocaleString('en')} samples · ${playing?'Playing':'Paused'}`);wake()}
function frame(now){
 raf=0;if(disposed||lost||document.hidden)return;
 if(playing&&last&&now-last<1000/60-.5){raf=requestAnimationFrame(frame);return}
 if(playing){time=Math.min(7,time+(last?(now-last)/1000:0));byId('time').value=time;if(time>=7){playing=false;byId('play').textContent='Play cycle';setStatus(`${mode==='points'?'Three.js particles':'Spark splats'} · Cycle complete`)}}
 last=now;
 if(dirty||playing||time===7){
  dirty=false;uniforms.time.value=time;
  if(splat&&mode==='spark'&&lastSplatTime!==time){sparkTime.value=time;sparkDissolve.value=uniforms.dissolve.value;splat.needsUpdate=true;lastSplatTime=time}
  const start=performance.now();renderer.render(scene,camera);cpuTimes.push(performance.now()-start);frames++;
  if(lastRendered&&playing)frameTimes.push(now-lastRendered);lastRendered=now;
  if(cpuTimes.length>600)cpuTimes.shift();if(frameTimes.length>600)frameTimes.shift();
 }
 if(playing&&!raf)raf=requestAnimationFrame(frame);
}
byId('play').onclick=play;
byId('points').onclick=()=>setMode('points');byId('spark').onclick=()=>setMode('spark');
byId('time').oninput=()=>{if(playing)play();setTime(Number(byId('time').value))};
byId('angle').oninput=()=>{updateCamera();wake()};
byId('reload').onclick=()=>location.reload();
function setEffect(dissolve){uniforms.dissolve.value=dissolve;lastSplatTime=-1;byId('guided').setAttribute('aria-pressed',String(!dissolve));byId('dissolve').setAttribute('aria-pressed',String(!!dissolve));updateCamera();wake()}
byId('guided').onclick=()=>setEffect(0);byId('dissolve').onclick=()=>setEffect(1);
for(const [id,t] of [['pose-a',0],['pose-b',3.5]])byId(id).onclick=()=>{if(playing)play();setTime(t)};
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;lastRendered=0}else wake()});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;playing=false;cancelAnimationFrame(raf);raf=0;byId('play').disabled=true;setStatus('Graphics paused. Reload the preview to restore the scene.');byId('reload').hidden=false});
const observer=new ResizeObserver(resize);observer.observe(view);observer.observe(document.querySelector('main'));
function dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();splat?.dispose();spark?.dispose();correspondence.dispose();geometry.dispose();material.dispose();for(const mesh of [desk,box]){mesh.geometry.dispose();mesh.material.dispose()}renderer.dispose()}
addEventListener('pagehide',event=>{if(!event.persisted)dispose()});
window.faxStudy={setMode,setTime,setEffect,play,inspect:()=>({mode,scene:character?'knick':'fax',time,playing,frames,count:samples.length,modeStartupMs,buffer:[renderer.domElement.width,renderer.domElement.height],render:{...renderer.info.render},memory:{...renderer.info.memory},cpuTimes:[...cpuTimes],frameTimes:[...frameTimes],three:THREE.REVISION,measurement:document.documentElement.dataset.textMeasurement}),resetMetrics(){cpuTimes.length=frameTimes.length=0;lastRendered=0},async settle(){if(spark&&mode==='spark'){sparkTime.value=time;sparkDissolve.value=uniforms.dissolve.value;splat.needsUpdate=true;await spark.update({scene,camera})}wake()}};
resize();setStatus(`Three.js particles · ${samples.length.toLocaleString('en')} samples · Ready`);
if(params.get('renderer')==='spark')await setMode('spark');byId('play').disabled=false;
