import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=[...readdirSync(new URL('assets/models/berghain/',root)).filter(p=>p.endsWith('.mjs')).map(p=>'assets/models/berghain/'+p),
 ...['baseColor','normal','roughness'].map(k=>'assets/models/berghain/textures/pier-'+k+'.png'),
 'berghain/build-belt-lighting.mjs','berghain/belt-emitter-study.mjs',
 ...['build/three.module.min.js','build/three.core.js','examples/jsm/lights/RectAreaLightUniformsLib.js','examples/jsm/lights/RectAreaLightTexturesLib.js'].map(p=>'assets/vendor/three/0.186.0/'+p)];
const inputHashes=()=>inputs.map(path=>({path,sha256:hash(readFileSync(new URL(path,root)))}));
// Run through the existing silent harness: node tools/test-browser.mjs quick --suite berghain/build-belt-lighting.mjs --root .
export default {name:'Fixed Säule belt radiance authoring pass',sourceFiles:inputHashes,scenarios:[{id:'bake',modes:['quick'],profiles:['desktop'],timeoutMs:240000,async run({page,baseURL,artifacts}){
 await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
 const result=await page.evaluate(async()=>{
  const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
  const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
  const {layout}=await import('../assets/models/berghain/layout.mjs');
  const {createBeltEmitters,disposeBeltEmitterTables}=await import('./belt-emitter-study.mjs');
  const {loadSurfaceTextures}=await import('../assets/models/berghain/surface-materials.mjs');
  const source=createBerghainModel();
  // Exclude the previous bake from its own generation. Keep only original PBR input.
  source.traverse(o=>{if(o.isMesh)delete o.material.userData.beltBake;});
  await loadSurfaceTextures(source);
  const bodies=layout.parts.filter(p=>p.role==='pier body'&&p.fixture.startsWith('saule-pier-'));
  const batch=source.getObjectByName('interior/sauleConcrete/box');
  const parts=layout.parts.filter(p=>[p.section,p.material,p.shape].join('/')===batch.name);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0);
  const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(248,472,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=4096;const ctx=atlas.getContext('2d');ctx.fillStyle='black';ctx.fillRect(0,0,1024,4096);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,20);const records=[];let clipped=0;
  const faces=[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)];
  for(const [row,part] of bodies.entries()){
   const matrix=new THREE.Matrix4().fromArray(part.matrix),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
   const geometry=batch.geometry.clone().applyMatrix4(matrix),material=batch.material.clone();material.onBeforeCompile=batch.material.onBeforeCompile;material.customProgramCacheKey=batch.material.customProgramCacheKey;
   const shade=new THREE.Color();batch.getColorAt(parts.indexOf(part),shade);material.color.multiply(shade);
   const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);
   const belt=createBeltEmitters(layout,part.fixture);scene.add(belt);
   for(const lamp of belt.children)lamp.intensity=125/64;
   for(const [col,localNormal] of faces.entries()){
    const center=localNormal.clone().multiplyScalar(.5).applyMatrix4(matrix),normal=localNormal.clone().applyNormalMatrix(normalMatrix);
    const up=new THREE.Vector3(0,1,0).transformDirection(matrix),right=new THREE.Vector3().crossVectors(up,normal);
    const width=new THREE.Vector3(localNormal.z===0?0:1,0,localNormal.x===0?0:1).applyMatrix3(new THREE.Matrix3().setFromMatrix4(matrix)).length();
    const height=new THREE.Vector3(0,1,0).applyMatrix3(new THREE.Matrix3().setFromMatrix4(matrix)).length();
    camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.up.copy(up);camera.position.copy(center).addScaledVector(normal,2);camera.lookAt(center);camera.updateProjectionMatrix();renderer.render(scene,camera);
    const gl=renderer.getContext(),pixels=new Uint8Array(248*472*4);gl.readPixels(0,0,248,472,gl.RGBA,gl.UNSIGNED_BYTE,pixels);for(let i=0;i<pixels.length;i+=4)if(pixels[i]===255||pixels[i+1]===255||pixels[i+2]===255)clipped++;
    const x=col*256+4,y=row*480+4;ctx.drawImage(renderer.domElement,x,y);
    ctx.drawImage(renderer.domElement,0,0,1,472,x-4,y,4,472);ctx.drawImage(renderer.domElement,247,0,1,472,x+248,y,4,472);
    ctx.drawImage(atlas,x-4,y,256,1,x-4,y-4,256,4);ctx.drawImage(atlas,x-4,y+471,256,1,x-4,y+472,256,4);
    records.push({fixture:part.fixture,part:part.name,row,col,width,height,center:center.toArray(),normal:normal.toArray(),right:right.toArray()});
   }
   scene.remove(mesh,belt);geometry.dispose();material.dispose();
  }
  const png=atlas.toDataURL('image/png').split(',')[1];disposeBerghainModel(source);renderer.dispose();disposeBeltEmitterTables();
  return {png,records,clipped,atlas:[1024,4096],strength:64,lightsPerPier:8,scope:'Original direct-light bake, estimated luminance, no shadow/indirect or moving-occluder support'};
 });
 const {png,...metadata}=result;assert.equal(result.records.length,32);assert.equal(result.clipped,0,'HDR encoding strength must avoid clipping');
 const bytes=Buffer.from(png,'base64'),manifest={...metadata,generatedFrom:inputHashes(),image:{file:'saule-belt-bake.png',bytes:bytes.length,sha256:hash(bytes)}};
 writeFileSync(new URL('assets/models/berghain/textures/saule-belt-bake.png',root),bytes);
 writeFileSync(new URL('assets/models/berghain/textures/saule-belt-bake-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');return manifest;
 }}]};
