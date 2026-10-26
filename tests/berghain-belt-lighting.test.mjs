import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {loadSurfaceTextures} from '../assets/models/berghain/surface-materials.mjs';
import {beltBakeUV} from '../assets/models/berghain/baked-belt.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('fixed strip illumination belongs to all eight pier bodies, without lighting seats or other rooms',()=>{
 const model=createBerghainModel();try{
  const baked=[],lights=[];model.traverse(o=>{if(o.isMesh&&o.material.userData.beltBake)baked.push(o);if(o.isLight)lights.push(o);});
  assert.equal(baked.length,1);assert.equal(lights.length,6);assert.ok(lights.every(l=>l.isSpotLight),'No global area-light compile cost');
  const mesh=baked[0],parts=layout.parts.filter(p=>[p.section,p.material,p.shape].join('/')===mesh.name),indices=mesh.geometry.attributes.beltBakeIndex;
  const assigned=[];
  for(let i=0;i<parts.length;i++){
   const index=indices.getX(i),p=parts[i];
   if(index>=0){assert.equal(p.role,'pier body');assert.match(p.fixture,/^saule-pier-/);assigned.push(p.fixture);}
   else assert.ok(beltBakeUV([.5,.1],index)[1]>.94,'Unassigned objects sample the black tail');
  }
  assert.deepEqual(assigned.sort(),Array.from({length:8},(_,i)=>'saule-pier-'+i));
  assert.equal(mesh.material.emissive.getHex(),0,'Texture failure must not turn the concrete into a glowing solid');
  const uv=mesh.geometry.attributes.uv1,normals=mesh.geometry.attributes.normal;
  for(let i=0;i<uv.count;i++)for(let row=0;row<8;row++){
   const p=beltBakeUV([uv.getX(i),uv.getY(i)],row);
   assert.ok(p.every(v=>v>0&&v<1));
   if(Math.abs(normals.getY(i))>.5)assert.ok(p[1]>.94,'Horizontal faces have no incorrect vertical-face bake');
   else assert.ok(p[1]>=row*480/4096&&p[1]<(row+1)*480/4096,'Each pier samples its own registered radiance');
  }
 }finally{disposeBerghainModel(model);}
});

test('export carries the same fixed radiance in standard emissive UV and strength fields',()=>{
 const b=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url)),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 const baked=g.materials.filter(m=>m.emissiveTexture);assert.equal(baked.length,1);
 const m=baked[0];assert.equal(m.name,'interior/sauleConcrete/box');assert.deepEqual(m.emissiveFactor,[1,1,1]);
 assert.equal(m.extensions.KHR_materials_emissive_strength.emissiveStrength,64);assert.equal(m.emissiveTexture.texCoord,1);
 assert.ok(g.extensionsUsed.includes('KHR_materials_emissive_strength'));
 const image=g.images[g.textures[m.emissiveTexture.index].source],view=g.bufferViews[image.bufferView],offset=28+b.readUInt32LE(12)+view.byteOffset;
 assert.equal(image.name,'textures/saule-belt-bake.png');
 assert.equal(sha(b.subarray(offset,offset+view.byteLength)),sha(readFileSync(new URL('../assets/models/berghain/textures/saule-belt-bake.png',import.meta.url))));
 const mesh=g.meshes.find(mesh=>mesh.name===m.name).primitives[0];
 assert.equal(g.accessors[mesh.attributes.TEXCOORD_1].count,g.accessors[mesh.attributes.POSITION].count);
});

test('the bake has traceable geometry, material and emitter inputs with unclipped output',()=>{
 const root=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('assets/models/berghain/textures/saule-belt-bake-manifest.json',root)));
 assert.equal(manifest.clipped,0);assert.equal(manifest.records.length,32);assert.equal(manifest.lightsPerPier,8);
 const image=readFileSync(new URL('assets/models/berghain/textures/'+manifest.image.file,root));
 assert.equal(image.length,manifest.image.bytes);assert.equal(sha(image),manifest.image.sha256);
 for(const input of manifest.generatedFrom)assert.equal(sha(readFileSync(new URL(input.path,root))),input.sha256,'Rebuild the fixed lighting after changing '+input.path);
});

test('a failed lighting-atlas request disposes every admitted texture and retains a nonluminous fallback',async()=>{
 const original=THREE.TextureLoader.prototype.loadAsync;let loaded=0,disposed=0;
 THREE.TextureLoader.prototype.loadAsync=async url=>{
  if(url.endsWith('saule-belt-bake.png'))throw Error('controlled atlas failure');
  const t=new THREE.Texture();loaded++;t.addEventListener('dispose',()=>disposed++);return t;
 };
 const model=createBerghainModel();try{
  await assert.rejects(loadSurfaceTextures(model),/controlled atlas failure/);
  assert.equal(disposed,loaded);
  const material=model.getObjectByName('interior/sauleConcrete/box').material;
  assert.equal(material.emissiveMap,null);assert.equal(material.emissive.getHex(),0);
 }finally{disposeBerghainModel(model);THREE.TextureLoader.prototype.loadAsync=original;}
});
