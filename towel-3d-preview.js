import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {prepareWithSegments,measureLineStats,measureNaturalWidth} from './assets/vendor/pretext/dist/layout.js';

const canvas=document.querySelector('#scene');
const status=document.querySelector('#status');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0xc8c2b6);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xc8c2b6,7,15);
const camera=new THREE.PerspectiveCamera(35,1,.1,30);
camera.position.set(0,2.3,5.9);
const orbit=new OrbitControls(camera,canvas);
orbit.target.set(0,.91,0);
orbit.enablePan=false;
orbit.minDistance=3.2;
orbit.maxDistance=10;
orbit.maxPolarAngle=Math.PI*.58;
orbit.update();
scene.add(new THREE.HemisphereLight(0xfff6e7,0x685e53,2.1));
const sun=new THREE.DirectionalLight(0xfff3df,3.2);
sun.position.set(-3,6,4);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-4;
sun.shadow.camera.right=4;
sun.shadow.camera.top=4;
sun.shadow.camera.bottom=-4;
scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0xbab4a8,roughness:1}));
floor.rotation.x=-Math.PI/2;
floor.receiveShadow=true;
scene.add(floor);
for(const x of [-1.13,1.13]){
  const line=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.006),new THREE.MeshBasicMaterial({color:0x766f62}));
  line.rotation.x=-Math.PI/2;
  line.position.set(x,.002,.65);
  scene.add(line);
}

const mixers=[];
const actors=[];
let playing=true;
let speed=1;
const loader=new GLTFLoader();
try{
  const models=await Promise.all(['man','woman'].map(name=>loader.loadAsync(`./assets/models/towel-pedestrians/${name}.glb`)));
  models.forEach((asset,i)=>{
    const actor=asset.scene;
    actor.position.x=i===0?-1.13:1.13;
    actor.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
    scene.add(actor);
    actors.push(actor);
    if(asset.animations.length!==1)throw Error(`Expected one complete walk for ${i===0?'man':'woman'}`);
    const mixer=new THREE.AnimationMixer(actor);
    mixer.clipAction(asset.animations[0]).play();
    mixers.push(mixer);
  });
  status.textContent='32 poses · grounded step cycle · two character builds';
  document.documentElement.dataset.models='ready';
}catch(error){
  status.textContent=`Could not load the 3D models: ${error.message}`;
  status.dataset.error='true';
  console.error(error);
}

document.querySelector('#play').addEventListener('click',event=>{
  playing=!playing;
  event.currentTarget.textContent=playing?'Pause walk':'Resume walk';
  event.currentTarget.setAttribute('aria-pressed',String(playing));
});
document.querySelector('#speed').addEventListener('input',event=>speed=Number(event.target.value));
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
  const view=button.dataset.view;
  const distance=camera.position.distanceTo(orbit.target);
  const angle={front:0,side:Math.PI/2,back:Math.PI}[view];
  for(const actor of actors)actor.rotation.y=angle;
  camera.position.set(0,.91+distance*.23,distance);
  orbit.update();
  for(const other of document.querySelectorAll('[data-view]'))other.setAttribute('aria-pressed',String(other===button));
});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();status.textContent='3D context lost. Reload this preview.';});

const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  const width=canvas.clientWidth,height=canvas.clientHeight;
  if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio())){
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
  }
  const dt=Math.min(clock.getDelta(),.05);
  if(playing)for(const mixer of mixers)mixer.update(dt*speed);
  orbit.update();
  renderer.render(scene,camera);
}
frame();

// The existing pinned local Pretext build measures every bounded preview label.
await document.fonts.load('16px "Preview Sans"');
await document.fonts.load('700 16px "Preview Sans"');
let pending=false;
function measure(){
  pending=false;
  const available=document.fonts.check('16px "Preview Sans"')&&typeof Intl.Segmenter==='function';
  document.documentElement.dataset.textMeasurement=available?'pretext-0.0.9':'unavailable';
  if(!available)return;
  for(const el of document.querySelectorAll('[data-measure]')){
    const css=getComputedStyle(el),rect=el.getBoundingClientRect();
    if(!rect.width)continue;
    const text=el.tagName==='LABEL'?'Speed':el.textContent;
    const font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const prepared=prepareWithSegments(text,font,{letterSpacing:parseFloat(css.letterSpacing)||0});
    const width=rect.width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth)-(el.tagName==='LABEL'&&css.display!=='grid'?el.querySelector('input').getBoundingClientRect().width+8:0);
    const height=rect.height-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom)-parseFloat(css.borderTopWidth)-parseFloat(css.borderBottomWidth);
    const stats=measureLineStats(prepared,Math.max(1,width));
    const lineHeight=parseFloat(css.lineHeight)||Math.ceil(parseFloat(css.fontSize)*1.4);
    const oneLine=el.tagName==='BUTTON';
    el.dataset.fit=stats.maxLineWidth<=width+.5&&stats.lineCount*lineHeight<=height+1&&(!oneLine||measureNaturalWidth(prepared)<=width+.5)?'fit':'reflow';
  }
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(measure);}}
new ResizeObserver(schedule).observe(document.body);
document.querySelector('#play').addEventListener('click',schedule);
schedule();
