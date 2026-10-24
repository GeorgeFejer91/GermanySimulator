import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {loadSurfaceTextures} from '../assets/models/berghain/surface-materials.mjs';

test('the shared image admission queue bounds all surface loads and skips retired-model work',async()=>{
  const original=THREE.TextureLoader.prototype.loadAsync;
  let active=0,peak=0,started=0,disposed=0;
  THREE.TextureLoader.prototype.loadAsync=async()=>{
    active++;started++;peak=Math.max(peak,active);
    await new Promise(resolve=>setTimeout(resolve,1));active--;
    const texture=new THREE.Texture();texture.addEventListener('dispose',()=>disposed++);return texture;
  };
  try{
    const model=createBerghainModel();
    try{assert.equal(await loadSurfaceTextures(model),26);assert.ok(peak<=2,'at most two image jobs');}
    finally{disposeBerghainModel(model);}
    assert.equal(started,26);assert.equal(disposed,26);
    active=peak=started=disposed=0;
    const retired=createBerghainModel(),pending=loadSurfaceTextures(retired);
    await new Promise(resolve=>queueMicrotask(resolve));disposeBerghainModel(retired);
    await pending;assert.ok(started<=2,'queued downloads do not start after model disposal');
    assert.equal(active,0);assert.equal(disposed,started,'late maps dispose exactly once');
  }finally{THREE.TextureLoader.prototype.loadAsync=original;}
});

test('portable Berghain asset embeds shared standard PBR maps and metre UVs', () => {
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const jsonLength=bytes.readUInt32LE(12), gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString().trim());
  assert.ok(gltf.images?.length>=3,'The portable asset must include material maps');
  assert.equal(gltf.images.length,25,'Eight three-map surface families and one shared sugar thickness atlas');
  const binaryStart=20+jsonLength+8;
  for(const image of gltf.images){
    assert.equal(image.mimeType,'image/png');
    assert.equal(image.uri,undefined,'No external file dependency');
    const view=gltf.bufferViews[image.bufferView], offset=binaryStart+view.byteOffset;
    assert.ok(offset+view.byteLength<=bytes.length,'Embedded image must be in bounds');
    assert.equal(bytes.subarray(offset+1,offset+4).toString(),'PNG');
    const size=image.name==='textures/amber-thickness.png'?1024:512;
    assert.equal(bytes.readUInt32BE(offset+16),size);
    assert.equal(bytes.readUInt32BE(offset+20),size);
  }
  for(const mesh of gltf.meshes) for(const primitive of mesh.primitives){
    const material=gltf.materials[primitive.material];
    if(!material.pbrMetallicRoughness.baseColorTexture) continue;
    assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture);
    assert.ok(material.normalTexture);
    const uv=gltf.accessors[primitive.attributes.TEXCOORD_0];
    assert.equal(uv.type,'VEC2');
    assert.equal(uv.count,gltf.accessors[primitive.attributes.POSITION].count);
  }
  assert.equal(gltf.textures.length,25,'Material groups must reuse image textures');
  assert.equal(gltf.samplers[0].wrapS,10497);
  assert.equal(gltf.samplers[0].wrapT,10497);
});
