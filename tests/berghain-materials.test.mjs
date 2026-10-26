import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {loadSurfaceTextures} from '../assets/models/berghain/surface-materials.mjs';

test('bar plaster and Säule concrete have distinct observed surface treatments',()=>{
  const model=createBerghainModel(),observed=new Map();
  try{
    model.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const [section,materialName]=mesh.name.split('/');
      if(['mainBarPlaster','sauleConcrete','labWall'].includes(materialName)){
        assert.ok(mesh.material.userData.surface,mesh.name);
        observed.set(section+'/'+materialName,mesh.material.userData.surface.family);
        if(materialName==='sauleConcrete')assert.deepEqual(mesh.material.color.toArray(),new THREE.Color(section==='interior'?'#b7b5ac':'#b1bdd6').toArray());
        assert.equal(mesh.material.transparent,false,'Opaque mineral fabric remains opaque');
        assert.equal(mesh.material.depthWrite,true);
      }
    });
    assert.deepEqual(Object.fromEntries(observed),{'halle/sauleConcrete':'aged','interior/mainBarPlaster':'plaster','interior/sauleConcrete':'pier','interior/labWall':'aged','structure/labWall':'aged'});
  }finally{disposeBerghainModel(model);}
});

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
    try{
      assert.equal(await loadSurfaceTextures(model),37);assert.ok(peak<=2,'at most two image jobs');
      let mapped=0,coated=0;
      model.traverse(mesh=>{if(mesh.isMesh&&mesh.material.normalMap){
        mapped++;assert.deepEqual(mesh.material.normalScale.toArray(),[1,-1],mesh.name+' must match tangent-free glTF orientation');
        if(mesh.material.clearcoatNormalMap){coated++;assert.deepEqual(mesh.material.clearcoatNormalScale.toArray(),[1,-1]);}
      }});
      assert.ok(mapped>20);assert.ok(coated>0,'The sugar clearcoat follows the same normal convention');
    }
    finally{disposeBerghainModel(model);}
    assert.equal(started,37);assert.equal(disposed,37);
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
  assert.equal(gltf.images.length,36,'Eleven surface families, sugar thickness, glass emission and the fixed belt-light atlas');
  const binaryStart=20+jsonLength+8;
  for(const image of gltf.images){
    assert.equal(image.mimeType,'image/png');
    assert.equal(image.uri,undefined,'No external file dependency');
    const view=gltf.bufferViews[image.bufferView], offset=binaryStart+view.byteOffset;
    assert.ok(offset+view.byteLength<=bytes.length,'Embedded image must be in bounds');
    assert.equal(bytes.subarray(offset+1,offset+4).toString(),'PNG');
    const [width,height]=image.name==='textures/saule-belt-bake.png'?[1024,4096]:image.name==='textures/amber-thickness.png'?[1024,1024]:[512,512];
    assert.equal(bytes.readUInt32BE(offset+16),width);
    assert.equal(bytes.readUInt32BE(offset+20),height);
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
  assert.equal(gltf.textures.length,36,'Material groups must reuse image textures');
  assert.equal(gltf.samplers[0].wrapS,10497);
  assert.equal(gltf.samplers[0].wrapT,10497);
});

test('portable bar practical lights preserve source color, candela, cone, range and world direction',()=>{
 const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
 const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString().trim());
 const lights=gltf.extensions?.KHR_lights_punctual?.lights;
 assert.equal(lights?.length,6,'Portable lighting must survive export, beyond an emissive strip');
 const model=createBerghainModel();model.updateMatrixWorld(true);
 try{
  const source=[];model.traverse(object=>{if(object.isSpotLight)source.push(object);});
  const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);
  for(const [i,light]of source.entries()){
   const node=gltf.nodes.find(n=>n.extensions?.KHR_lights_punctual?.light===i);
   assert.ok(node);assert.equal(lights[i].type,'spot');
   near(lights[i].intensity,light.intensity);near(lights[i].range,light.distance);
   near(lights[i].spot.outerConeAngle,light.angle);near(lights[i].spot.innerConeAngle,light.angle*(1-light.penumbra));
   lights[i].color.forEach((v,j)=>near(v,light.color.toArray()[j]));
   const position=light.getWorldPosition(new THREE.Vector3()),target=light.target.getWorldPosition(new THREE.Vector3());
   node.translation.forEach((v,j)=>near(v,position.toArray()[j]));
   const direction=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().fromArray(node.rotation));
   assert.ok(direction.distanceTo(target.sub(position).normalize())<1e-6,'glTF -Z axis must follow the actual source beam');
  }
 }finally{disposeBerghainModel(model);}
});
