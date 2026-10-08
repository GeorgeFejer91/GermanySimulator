import * as THREE from 'three';
import {createAmtSplatOwner} from './buergeramt-splat.js?v=20261009-anchor2';
import {createGaussianActor,sampleArc} from './buergeramt-gaussian-animation.js?v=20261009-anchor2';
import {prepareWithSegments,measureLineStats,measureNaturalWidth} from './assets/vendor/pretext/dist/layout.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const names={knick:'Frau Knick',aktenkurier:'Aktenkurier',archivbotin:'Archivbotin',formularsammler:'Formularsammler',nummernfluesterer:'Nummernflüsterer',nachtschichtmelderin:'Nachtschichtmelderin',pfandarchitektin:'Pfandarchitektin',kopiependler:'Kopiependler',warteschlangenpoetin:'Warteschlangenpoetin'};
const character=names[params.get('scene')]?params.get('scene'):'knick',id=character==='knick'?'clerk':character;
const response=await fetch(`./assets/buergeramt/animation/${id}.json`);if(!response.ok)throw Error('Character action is unavailable');
const manifest=await response.json(),duration=id==='clerk'?manifest.arcs.reduce((n,a)=>n+a.duration,0):manifest.arcs[0].duration*2;
const view=$('view'),renderer=new THREE.WebGLRenderer({antialias:false});renderer.outputColorSpace=THREE.SRGBColorSpace;view.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x66685f);
const camera=new THREE.PerspectiveCamera(43,1,.1,50),signal=new AbortController(),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const owner=await createAmtSplatOwner({THREE,renderer,scene,signal:signal.signal});
const variant=matchMedia('(max-width:700px)').matches?'mobile':'desktop';
const actor=await createGaussianActor({THREE,owner,manifestUrl:`./assets/buergeramt/animation/${id}.json`,variant,signal:signal.signal});
const source=new THREE.Mesh(new THREE.PlaneGeometry(3.4*manifest.canvas_xy[0]/832,3.4));source.position.y=1.7;
const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({color:0x99917c}));ground.rotation.x=-Math.PI/2;ground.position.y=-.01;scene.add(ground);
document.querySelector('h1').textContent=names[character]+' · continuous painted action';
$('description').textContent='Original painted anchors retain their full detail, including the inbetween keys. Gaussian splats bridge the movement between those paintings.';
$('footnote').textContent='The same action data and renderer are used in the Bürgeramt scene. Intermediate anchors have no scheduled pause. Three.js r186 · Spark 2.3.1.';
$('points').hidden=true;$('spark').setAttribute('aria-pressed','true');$('spark').disabled=true;
view.setAttribute('aria-label',names[character]+' performing a full painted action cycle');
const nav=document.querySelector('nav');for(const [key,name] of Object.entries(names)){const link=document.createElement('a');link.href=`?scene=${key}&workflow=arcs&renderer=spark`;link.textContent=name;nav.append(link)}
const anchors=document.querySelector('.anchors');anchors.hidden=false;anchors.setAttribute('aria-label',manifest.states.length+' painted action anchors');
let offset=0;const keyTimes=new Map();for(const arc of manifest.arcs){for(const key of arc.keys)if(!keyTimes.has(key.state))keyTimes.set(key.state,offset+key.time);offset+=arc.duration}
for(const state of manifest.states){
  const figure=document.createElement('figure'),canvas=document.createElement('canvas'),button=document.createElement('button'),image=new Image();
  canvas.width=manifest.canvas_xy[0];canvas.height=manifest.canvas_xy[1];canvas.style.height='240px';canvas.style.objectFit='contain';canvas.style.background='#66685f';
  image.onload=()=>{const crop=state.crop_xywh??[0,0,image.naturalWidth,image.naturalHeight];canvas.getContext('2d').drawImage(image,...crop,0,0,canvas.width,canvas.height)};image.src=state.file;
  button.textContent=state.id+' · '+state.role;button.onclick=()=>setTime(keyTimes.get(state.id)||0);figure.append(canvas,button);anchors.append(figure);
}
await document.fonts.load('16px Study');await document.fonts.load('700 16px Study');
let time=0,speed=1,loop=true,playing=false,last=0,raf=0,dirty=true,disposed=false,frames=0,frameTimes=[],cpuTimes=[],lastRendered=0;
function stateAt(t){
  if(id!=='clerk')return{arc:'work-gesture-work',phase:t/duration,pose:'work'};
  let start=0;for(const arc of manifest.arcs){if(t<start+arc.duration||arc===manifest.arcs.at(-1))return{arc:arc.id,phase:Math.min(1,(t-start)/arc.duration),pose:arc.from};start+=arc.duration}
}
function measure(){
  let fits=true;for(const element of document.querySelectorAll('button,.controls label>span,nav a')){
    if(element.hidden)continue;const style=getComputedStyle(element),font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,width=element.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const p=prepareWithSegments(element.textContent,font),stats=measureLineStats(p,Math.max(1,width));
    if(measureNaturalWidth(p)>width&&stats.lineCount>1)element.style.whiteSpace='normal';
    if(element.scrollWidth>element.clientWidth+1)fits=false;
  }document.documentElement.dataset.textMeasurement=fits?'verified':'no-fit';
}
function resize(){
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(view.clientWidth,view.clientHeight,false);camera.aspect=view.clientWidth/view.clientHeight;camera.updateProjectionMatrix();
  const angle=Number($('angle').value)*Math.PI/180,distance=5.6*Math.max(1,.9/camera.aspect);camera.position.set(Math.sin(angle)*distance,1.9,Math.cos(angle)*distance);camera.lookAt(0,1.7,0);measure();wake();
}
function setPlaying(value){playing=!!value;last=0;$('play').textContent=playing?'Pause':'Play cycle';wake()}
function setTime(value){setPlaying(false);time=Math.max(0,Math.min(duration,Number(value)||0));$('time').value=time;wake()}
function setLoop(value){loop=!!value;$('loop').textContent=loop?'Loop on':'Loop off';$('loop').setAttribute('aria-pressed',String(loop))}
function setSpeed(value){speed=Number(value)||1;$('speed').value=speed;last=0}
function sync(){actor.update(stateAt(time),source);$('status').textContent=`${names[character]} · ${time.toFixed(2)} / ${duration.toFixed(2)} s · ${stateAt(time).arc} · ${variant} · ${actor.inspect().count.toLocaleString()} Gaussians`;$('time').setAttribute('aria-valuetext',time.toFixed(2)+' seconds')}
function wake(){dirty=true;if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(frame)}
async function frame(now){
  raf=0;if(disposed||document.hidden)return;
  if(playing){const dt=last?Math.min(.1,(now-last)/1000)*speed:0;time+=dt;if(time>duration){time=loop?time%duration:duration;if(!loop)setPlaying(false)}$('time').value=time}
  last=now;if(dirty||playing){dirty=false;sync();const start=performance.now();await owner.update(camera);if(disposed)return;renderer.render(scene,camera);cpuTimes.push(performance.now()-start);frames++;if(lastRendered&&playing)frameTimes.push(now-lastRendered);lastRendered=now;cpuTimes=cpuTimes.slice(-600);frameTimes=frameTimes.slice(-600)}
  if(playing&&!raf)raf=requestAnimationFrame(frame);
}
$('play').disabled=false;$('play').onclick=()=>setPlaying(!playing);$('loop').onclick=()=>setLoop(!loop);$('speed').onchange=()=>setSpeed($('speed').value);$('time').max=duration;$('time').oninput=()=>setTime($('time').value);$('angle').oninput=resize;
const observer=new ResizeObserver(resize);observer.observe(view);
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0}else wake()});reduced.addEventListener('change',e=>{if(e.matches)setPlaying(false)});
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();actor.dispose();signal.abort();void owner.dispose();source.geometry.dispose();source.material.dispose();ground.geometry.dispose();ground.material.dispose();renderer.dispose()}
addEventListener('pagehide',e=>{if(!e.persisted)dispose()});
window.faxStudy={setTime,setLoop,setSpeed,play:()=>setPlaying(!playing),setMode:()=>{},setEffect:()=>{},
  inspect:()=>({version:'arcs1',scene:character,mode:'spark',time,duration,playing,loop,speed,frames,cycle:sampleArc(manifest,stateAt(time)),actor:actor.inspect(),owner:owner.inspect(),anchorCount:manifest.states.length,buffer:[renderer.domElement.width,renderer.domElement.height],cpuTimes,frameTimes,measurement:document.documentElement.dataset.textMeasurement}),
  async settle(){sync();await actor.settle();sync();await new Promise(r=>requestAnimationFrame(r));await owner.update(camera);renderer.render(scene,camera)},resetMetrics(){frameTimes=[];cpuTimes=[];lastRendered=0}};
setLoop(true);resize();await window.faxStudy.settle();if(!reduced.matches&&params.get('autoplay')!=='0')setPlaying(true);
