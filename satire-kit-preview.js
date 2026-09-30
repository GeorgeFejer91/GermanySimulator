import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SATIRE_CATALOG,SATIRE_IDS,buildSatireMesh,createSatireGLB} from './assets/models/satire-kit/models.js';
const canvas=document.querySelector('#preview'),stage=document.querySelector('#stage'),status=document.querySelector('#status'),select=document.querySelector('#model'),view=document.querySelector('#view');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene();scene.background=new T.Color(0xe7e2d6);const camera=new T.PerspectiveCamera(40,1,.01,150);const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.maxPolarAngle=Math.PI*.49;
scene.add(new T.HemisphereLight(0xfff6e5,0x686955,2));const sun=new T.DirectionalLight(0xfff3dc,2.5);sun.position.set(-4,7,5);scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshStandardMaterial({color:0xe7e2d6,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
const loader=new GLTFLoader();let current=null,selected=0,serial=0,frame=0,lost=false,modelSize=new T.Vector3(1,1,1),bytes=null;
function dispose(root){const geometries=new Set(),materials=new Set();root.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);});root.removeFromParent();for(const resource of [...geometries,...materials])resource.dispose();}
function draw(){frame=0;if(!lost&&!document.hidden)renderer.render(scene,camera);}
function schedule(){if(!frame&&!document.hidden&&!lost)frame=requestAnimationFrame(draw);}
function fit(){
 const radius=Math.max(.2,modelSize.length()/2),fov=camera.fov*Math.PI/180,limit=Math.min(fov,2*Math.atan(Math.tan(fov/2)*camera.aspect)),distance=radius/Math.sin(limit/2)*1.17;
 controls.target.set(0,modelSize.y*.49,0);
 const directions={front:[0,.12,1],side:[1,.16,0],back:[0,.12,-1],'three-quarter':[.55,.34,1]};const direction=new T.Vector3(...(directions[view.value]||directions['three-quarter'])).normalize();
 camera.position.copy(controls.target).addScaledVector(direction,distance);camera.near=.01;camera.far=Math.max(80,distance*8);camera.updateProjectionMatrix();controls.minDistance=radius*.6;controls.maxDistance=distance*4;controls.update();schedule();
}
function resize(){const r=stage.getBoundingClientRect(),width=Math.max(1,r.width),height=Math.max(350,innerHeight-document.querySelector('header').offsetHeight-document.querySelector('footer').offsetHeight);canvas.style.height=height+'px';renderer.setSize(width,height,false);camera.aspect=width/height;fit();}
async function show(id){
 if(!SATIRE_IDS.includes(id))throw new RangeError('Unknown model');const ticket=++serial;selected=SATIRE_IDS.indexOf(id);select.value=id;document.documentElement.dataset.preview='loading';status.textContent='Building '+id+'…';document.querySelector('#export').disabled=true;
 try{
  const generated=createSatireGLB(id),asset=await new Promise((ok,fail)=>loader.parse(generated,'',ok,fail));
  if(ticket!==serial){dispose(asset.scene);return;}
  if(current)dispose(current);current=asset.scene;bytes=generated;scene.add(current);new T.Box3().setFromObject(current).getSize(modelSize);fit();
  const mesh=buildSatireMesh(id),entry=SATIRE_CATALOG[selected];status.textContent=entry.title+' · '+mesh.triangles.toLocaleString()+' triangles · '+(generated.byteLength/1024).toFixed(1)+' KiB';
  document.documentElement.dataset.currentAsset=id;document.documentElement.dataset.preview='ready';document.querySelector('#export').disabled=false;document.querySelector('#error').textContent='';
 }catch(error){if(ticket!==serial)return;status.textContent='Model failed: '+id;document.querySelector('#error').textContent=error.message;document.documentElement.dataset.preview='failed';throw error;}
}
select.replaceChildren();for(const family of ['station','civic','clutter']){const group=document.createElement('optgroup');group.label=family.toUpperCase();for(const entry of SATIRE_CATALOG.filter(m=>m.family===family)){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.title;group.append(option);}select.append(group);}
select.disabled=false;for(const id of ['previous','next'])document.querySelector('#'+id).disabled=false;
select.addEventListener('change',()=>show(select.value).catch(console.error));view.addEventListener('change',fit);controls.addEventListener('change',schedule);
for(const [id,step] of [['previous',-1],['next',1]])document.querySelector('#'+id).addEventListener('click',()=>show(SATIRE_IDS[(selected+step+SATIRE_IDS.length)%SATIRE_IDS.length]).catch(console.error));
document.querySelector('#export').addEventListener('click',()=>{if(!bytes)return;const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'})),link=document.createElement('a');link.href=url;link.download=SATIRE_IDS[selected]+'.glb';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;if(frame)cancelAnimationFrame(frame);frame=0;status.textContent='Graphics context lost; waiting for recovery.';});canvas.addEventListener('webglcontextrestored',()=>{lost=false;resize();status.textContent='Graphics context restored.';});
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();});
// Read-only debug surface except the same model selector used by the controls.
window.SatireKitReview={ids:SATIRE_IDS,show,stats:()=>({asset:SATIRE_IDS[selected],triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries})};
resize();const requested=new URLSearchParams(location.search).get('asset');await show(SATIRE_IDS.includes(requested)?requested:SATIRE_IDS[0]);
