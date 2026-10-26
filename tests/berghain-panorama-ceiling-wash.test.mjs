import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {loadSurfaceTextures} from '../assets/models/berghain/surface-materials.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');

test('ceiling wash is confined to the downward soffit and adds no runtime light',()=>{
 const model=createBerghainModel();try{
  const baked=[],lights=[];model.traverse(o=>{if(o.isMesh&&o.material.userData.radianceBake)baked.push(o);if(o.isLight)lights.push(o);});
  assert.equal(baked.length,1);assert.equal(baked[0].name,'interior/panoramaCeilingWash/box');assert.equal(baked[0].count,1);
  assert.equal(lights.length,6);assert.ok(lights.every(l=>l.isSpotLight));
  const mesh=baked[0],uv=mesh.geometry.attributes.uv1,n=mesh.geometry.attributes.normal;
  for(let i=0;i<uv.count;i++){
   assert.ok(uv.getX(i)>0&&uv.getX(i)<1&&uv.getY(i)>0&&uv.getY(i)<1);
   if(n.getY(i)<-.5)assert.ok(uv.getY(i)<=500/512&&uv.getX(i)>=4/512,'Soffit samples the registered radiance rectangle');
   else assert.ok(uv.getY(i)>504/512,'Top and side faces must sample black, including from outside the building');
  }
  assert.equal(mesh.material.emissive.getHex(),0,'Missing atlas retains ordinary plaster');
 }finally{disposeBerghainModel(model);}
});

test('portable ceiling light map preserves the standard UV channel, exact image and intensity',()=>{
 const bytes=readFileSync(new URL('assets/models/berghain/berghain-study.glb',root)),g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const material=g.materials.find(m=>m.name==='interior/panoramaCeilingWash/box');assert.ok(material);
 assert.equal(material.emissiveTexture.texCoord,1);assert.equal(material.extensions.KHR_materials_emissive_strength.emissiveStrength,2);
 assert.deepEqual(material.emissiveFactor,[1,1,1]);
 const image=g.images[g.textures[material.emissiveTexture.index].source],v=g.bufferViews[image.bufferView],offset=28+bytes.readUInt32LE(12)+v.byteOffset;
 assert.equal(image.name,'textures/panorama-ceiling-bake.png');assert.equal(sha(bytes.subarray(offset,offset+v.byteLength)),sha(readFileSync(new URL('assets/models/berghain/'+image.name,root))));
 const primitive=g.meshes.find(m=>m.name===material.name).primitives[0];assert.equal(g.accessors[primitive.attributes.TEXCOORD_1].count,g.accessors[primitive.attributes.POSITION].count);
});

test('ceiling radiance records actual generation inputs, bounded encoding and a dated appearance scope',()=>{
 const manifest=JSON.parse(readFileSync(new URL('assets/models/berghain/textures/panorama-ceiling-bake-manifest.json',root)));
 assert.equal(manifest.clipped,0);assert.equal(manifest.records.length,64);assert.ok(manifest.nonzero>10000);assert.deepEqual(manifest.atlas,[512,512]);assert.equal(manifest.strength,2);
 assert.match(manifest.scope,/Estimated/);assert.match(manifest.scope,/no beam shadows/);
 const bytes=readFileSync(new URL('assets/models/berghain/textures/'+manifest.image.file,root));assert.equal(sha(bytes),manifest.image.sha256);assert.equal(bytes.length,manifest.image.bytes);
 for(const input of manifest.generatedFrom)assert.equal(sha(readFileSync(new URL(input.path,root))),input.sha256,'Regenerate ceiling radiance after changing '+input.path);
});

test('a missing ceiling light map cleans up admitted textures and leaves a nonluminous fallback',async()=>{
 const original=THREE.TextureLoader.prototype.loadAsync;let loaded=0,disposed=0;
 THREE.TextureLoader.prototype.loadAsync=async url=>{
  if(url.endsWith('panorama-ceiling-bake.png'))throw Error('controlled ceiling-atlas failure');
  const t=new THREE.Texture();loaded++;t.addEventListener('dispose',()=>disposed++);return t;
 };
 const model=createBerghainModel();try{
  await assert.rejects(loadSurfaceTextures(model),/controlled ceiling-atlas failure/);assert.equal(disposed,loaded);
  const material=model.getObjectByName('interior/panoramaCeilingWash/box').material;assert.equal(material.emissiveMap,null);assert.equal(material.emissive.getHex(),0);
 }finally{disposeBerghainModel(model);THREE.TextureLoader.prototype.loadAsync=original;}
});
