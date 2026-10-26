import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {loadSurfaceTextures} from '../assets/models/berghain/surface-materials.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync(new URL('assets/models/berghain/berghain-study.glb',root));
const g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12))),binary=28+bytes.readUInt32LE(12);
function accessor(index){const a=g.accessors[index],v=g.bufferViews[a.bufferView];return new Float32Array(bytes.buffer,bytes.byteOffset+binary+v.byteOffset+(a.byteOffset||0),a.count*2);}

test('both bar rows have discrete curved apertures with outward faces and real dark joints',()=>{
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const blocks=layout.parts.filter(p=>p.material==='mainBarGlow');
  assert.equal(blocks.length,148);assert.ok(blocks.every(p=>p.role==='luminous band'));
  const mesh=model.getObjectByName('interior/mainBarGlow/main-bar-curved-glass-block');
  assert.equal(mesh.count,18);const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=mesh.geometry.attributes.uv;
  const half=Math.max(...Array.from({length:p.count},(_,i)=>Math.abs(Math.atan2(p.getZ(i),p.getX(i)))));
  for(let i=0;i<p.count;i++){assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(n,i).length()-1)<1e-6);}
  for(let segment=0;segment<4;segment++)for(let k=0;k<4;k++){
   const i=segment*16+k,radial=new THREE.Vector3(p.getX(i),0,p.getZ(i)).normalize();
   assert.ok(radial.dot(new THREE.Vector3().fromBufferAttribute(n,i))>.999,'Front faces point out of the cabinet');
   assert.ok(radial.dot(new THREE.Vector3().fromBufferAttribute(n,i+4))<-.998,'Back faces point into the cabinet');
  }
  for(let instance=0;instance<mesh.count;instance++){
   const m=new THREE.Matrix4();mesh.getMatrixAt(instance,m);m.premultiply(mesh.matrixWorld);
   for(const angle of [0,-half-.005,half+.005]){
    const origin=new THREE.Vector3(1.4*Math.cos(angle),0,1.4*Math.sin(angle)).applyMatrix4(m);
    const direction=new THREE.Vector3(-Math.cos(angle),0,-Math.sin(angle)).transformDirection(m);
    const hits=new THREE.Raycaster(origin,direction,0,.15).intersectObject(mesh,false);
    if(angle===0){assert.equal(hits[0]?.instanceId,instance);assert.ok(Math.abs(hits[0].distance-.088)<.001);}
    else assert.equal(hits.length,0,'A light strip must not bridge a block joint');
   }
  }
 }finally{disposeBerghainModel(model);}
});

test('standard GLB carries authored block UVs and the exact original emission image',()=>{
 const model=createBerghainModel();try{
  const materials=g.materials.filter(m=>m.name.includes('/mainBarGlow/'));assert.equal(materials.length,2);
  for(const material of materials){
   assert.equal(material.emissiveTexture.texCoord||0,0);assert.equal(material.alphaMode,undefined);
   const image=g.images[g.textures[material.emissiveTexture.index].source],v=g.bufferViews[image.bufferView];
   assert.equal(image.name,'textures/bar-glass-emission.png');
   assert.equal(sha(bytes.subarray(binary+v.byteOffset,binary+v.byteOffset+v.byteLength)),sha(readFileSync(new URL('assets/models/berghain/'+image.name,root))));
   const mesh=model.getObjectByName(material.name),primitive=g.meshes.find(m=>m.name===material.name).primitives[0],actual=accessor(primitive.attributes.TEXCOORD_0),uv=mesh.geometry.attributes.uv;
   assert.equal(actual.length,uv.count*mesh.count*2);
   for(let i=0;i<actual.length;i++)assert.equal(actual[i],uv.array[i%uv.array.length],'UVs must not rotate into world projection around the curve');
  }
 }finally{disposeBerghainModel(model);}
});

test('glass maps are reproducible authoring outputs with bounded shared storage',()=>{
 const manifest=JSON.parse(readFileSync(new URL('assets/models/berghain/textures/bar-glass-manifest.json',root)));
 assert.equal(sha(readFileSync(new URL(manifest.generator,root))),manifest.generatorSha256);
 assert.deepEqual(manifest.dimensions,[512,512]);assert.equal(manifest.files.length,4);
 let size=0;for(const file of manifest.files){const b=readFileSync(new URL(file.path,root));assert.equal(sha(b),file.sha256);assert.equal(b.length,file.bytes);size+=b.length;}
 assert.ok(size<128*1024,'Keep four shared maps bounded, not one map per block');
});

test('failed glass emission loads dispose admitted resources and leave readable fallback blocks',async()=>{
 const original=THREE.TextureLoader.prototype.loadAsync;let loaded=0,disposed=0;
 THREE.TextureLoader.prototype.loadAsync=async url=>{if(url.endsWith('bar-glass-emission.png'))throw Error('controlled glass failure');const t=new THREE.Texture();loaded++;t.addEventListener('dispose',()=>disposed++);return t;};
 const model=createBerghainModel();try{
  await assert.rejects(loadSurfaceTextures(model),/controlled glass failure/);assert.equal(disposed,loaded);
  model.traverse(o=>{if(o.isMesh&&o.material.userData.emissionMap){assert.equal(o.material.map,null);assert.equal(o.material.emissiveMap,null);assert.ok(o.material.emissiveIntensity>0);assert.equal(o.material.transparent,false);}});
 }finally{disposeBerghainModel(model);THREE.TextureLoader.prototype.loadAsync=original;}
});
