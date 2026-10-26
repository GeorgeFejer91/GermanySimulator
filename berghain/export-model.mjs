import {writeFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel, disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {beltBakeUV} from '../assets/models/berghain/baked-belt.mjs';
import {surfaceUV} from '../assets/models/berghain/surface-materials.mjs';

const official = process.argv.includes('--survey');
const model = official ? (await import('../assets/models/berghain/survey-model.mjs')).createSurveyModel() : createBerghainModel();
model.updateMatrixWorld(true);
const gltf = {asset: {version: '2.0', generator: 'Germany Simulator Berghain study exporter',
  extras: {accuracy: official ? model.userData.status : 'Provisional reconstruction. See accompanying provenance; not surveyed.'}},
  scene: 0, scenes: [{nodes: [0]}], nodes: [{name: model.name, children: [], extras: model.userData}],
  meshes: [], materials: [], accessors: [], bufferViews: [], buffers: []};
const buffers = [];
let byteOffset = 0, triangles = 0;
const textureIndices = new Map();

function bufferView(bytes) {
  const bufferView = gltf.bufferViews.length;
  gltf.bufferViews.push({buffer: 0, byteOffset, byteLength: bytes.length});
  buffers.push(bytes);
  const padding = (4 - bytes.length % 4) % 4;
  if (padding) buffers.push(Buffer.alloc(padding));
  byteOffset += bytes.length + padding;
  return bufferView;
}

function accessor(array, type, componentType, bounds = false) {
  const view = bufferView(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
  const lanes = {SCALAR:1,VEC2:2,VEC3:3}[type];
  const entry = {bufferView:view, componentType, count: array.length / lanes, type};
  if (bounds) {
    entry.min = [Infinity, Infinity, Infinity]; entry.max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < array.length; i++) {
      entry.min[i % 3] = Math.min(entry.min[i % 3], array[i]);
      entry.max[i % 3] = Math.max(entry.max[i % 3], array[i]);
    }
  }
  gltf.accessors.push(entry);
  return gltf.accessors.length - 1;
}

function texture(filename) {
  if (textureIndices.has(filename)) return {index:textureIndices.get(filename)};
  gltf.images ||= []; gltf.textures ||= [];
  gltf.samplers ||= [{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];
  const bytes=readFileSync(new URL('../assets/models/berghain/'+filename,import.meta.url));
  const source=gltf.images.length;
  gltf.images.push({name:filename,mimeType:'image/png',bufferView:bufferView(bytes)});
  const index=gltf.textures.length;
  gltf.textures.push({source,sampler:0}); textureIndices.set(filename,index);
  return {index};
}

for (const group of model.children) {
  const groupIndex = gltf.nodes.length;
  gltf.nodes[0].children.push(groupIndex);
  gltf.nodes.push({name: group.name, children: [], ...(official ? {extras: group.userData} : {})});
  for (const mesh of group.children) {
    if(mesh.isSpotLight){
      gltf.extensions||={};gltf.extensions.KHR_lights_punctual||={lights:[]};
      gltf.extensionsUsed=[...new Set([...(gltf.extensionsUsed||[]),'KHR_lights_punctual'])];
      const lights=gltf.extensions.KHR_lights_punctual.lights;
      const index=lights.length,position=mesh.getWorldPosition(new THREE.Vector3());
      const direction=mesh.target.getWorldPosition(new THREE.Vector3()).sub(position).normalize();
      const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),direction);
      lights.push({name:mesh.name,type:'spot',color:mesh.color.toArray(),intensity:mesh.intensity,range:mesh.distance,
        spot:{innerConeAngle:mesh.angle*(1-mesh.penumbra),outerConeAngle:mesh.angle}});
      gltf.nodes[groupIndex].children.push(gltf.nodes.length);
      gltf.nodes.push({name:mesh.name,translation:position.toArray(),rotation:rotation.toArray(),extensions:{KHR_lights_punctual:{light:index}}});
    }
    if(!mesh.isMesh)continue;
    const geometry = mesh.geometry, sourcePosition = geometry.attributes.position, sourceNormal = geometry.attributes.normal;
    const instances = mesh.isInstancedMesh ? mesh.count : 1;
    const vertexCount = sourcePosition.count * instances;
    const positions = new Float32Array(vertexCount * 3), normals = new Float32Array(vertexCount * 3), colors = new Float32Array(vertexCount * 3);
    const surface = mesh.material.userData.surface, uvs = surface ? new Float32Array(vertexCount*2) : null;
    const sourceVolumeUV=geometry.attributes.uv1,volumeUVs=(mesh.material.userData.volumeMap||mesh.material.userData.beltBake||mesh.material.userData.radianceBake)?new Float32Array(vertexCount*2):null;
    const sourceIndices = geometry.index?.array || Uint32Array.from({length: sourcePosition.count}, (_, i) => i);
    const indices = new Uint32Array(sourceIndices.length * instances);
    const matrix = new THREE.Matrix4(), normalMatrix = new THREE.Matrix3(), vector = new THREE.Vector3(), color = new THREE.Color();
    for (let instance = 0; instance < instances; instance++) {
      if (mesh.isInstancedMesh) { mesh.getMatrixAt(instance, matrix); matrix.premultiply(mesh.matrixWorld); }
      else matrix.copy(mesh.matrixWorld);
      normalMatrix.getNormalMatrix(matrix);
      color.setRGB(1, 1, 1);
      if (mesh.isInstancedMesh && mesh.instanceColor) mesh.getColorAt(instance, color);
      for (let vertex = 0; vertex < sourcePosition.count; vertex++) {
        const offset = (instance * sourcePosition.count + vertex) * 3;
        vector.fromBufferAttribute(sourcePosition, vertex).applyMatrix4(matrix).toArray(positions, offset);
        vector.fromBufferAttribute(sourceNormal, vertex).applyNormalMatrix(normalMatrix).toArray(normals, offset);
        color.toArray(colors, offset);
        if (uvs) uvs.set(surface.intrinsicUV?[geometry.attributes.uv.getX(vertex),geometry.attributes.uv.getY(vertex)]:surfaceUV(positions.subarray(offset,offset+3),normals.subarray(offset,offset+3),surface.metresPerTile),offset/3*2);
        if(volumeUVs){const uv=[sourceVolumeUV.getX(vertex),sourceVolumeUV.getY(vertex)];
          volumeUVs.set(mesh.material.userData.beltBake?beltBakeUV(uv,geometry.attributes.beltBakeIndex.getX(instance)):uv,offset/3*2);}
      }
      for (let i = 0; i < sourceIndices.length; i++) indices[instance * sourceIndices.length + i] = sourceIndices[i] + instance * sourcePosition.count;
    }
    const material = mesh.material, materialIndex = gltf.materials.length;
    const physical=material.transmission>0?{
      KHR_materials_transmission:{transmissionFactor:material.transmission},
      KHR_materials_volume:{thicknessFactor:material.thickness,attenuationDistance:material.attenuationDistance,
        attenuationColor:material.attenuationColor.toArray()},
      KHR_materials_ior:{ior:material.ior},
      KHR_materials_clearcoat:{clearcoatFactor:material.clearcoat,clearcoatRoughnessFactor:material.clearcoatRoughness}
    }:null;
    if(physical&&material.userData.volumeMap)
      physical.KHR_materials_volume.thicknessTexture={...texture(material.userData.volumeMap),texCoord:1};
    if(physical&&surface)physical.KHR_materials_clearcoat.clearcoatNormalTexture=texture(surface.normal);
    if(physical)gltf.extensionsUsed=[...new Set([...(gltf.extensionsUsed||[]),...Object.keys(physical)])];
    const bake=material.userData.beltBake||material.userData.radianceBake,extensions={...(physical||{}),...(bake?{KHR_materials_emissive_strength:{emissiveStrength:bake.strength}}:{})};
    if(bake)gltf.extensionsUsed=[...new Set([...(gltf.extensionsUsed||[]),'KHR_materials_emissive_strength'])];
    gltf.materials.push({name: mesh.name, pbrMetallicRoughness: {baseColorFactor: [...material.color.toArray(), material.opacity],
      metallicFactor: material.metalness, roughnessFactor: material.roughness,
      ...(surface?{baseColorTexture:texture(surface.baseColor),metallicRoughnessTexture:texture(surface.roughness)}:{})},
      ...(surface?{normalTexture:{...texture(surface.normal),scale:1}}:{}),
      ...(Object.keys(extensions).length?{extensions}:{}),
      ...(bake?{emissiveTexture:{...texture(bake.map),texCoord:1}}:{}),
      ...(material.userData.emissionMap?{emissiveTexture:texture(material.userData.emissionMap)}:{}),
      emissiveFactor: bake?[1,1,1]:material.emissive.toArray().map(component => component * material.emissiveIntensity),
      ...(material.transparent ? {alphaMode: 'BLEND'} : {}),
      ...(material.side === THREE.DoubleSide ? {doubleSided: true} : {})});
    const meshIndex = gltf.meshes.length;
    gltf.meshes.push({name: mesh.name, primitives: [{attributes: {POSITION: accessor(positions, 'VEC3', 5126, true),
      NORMAL: accessor(normals, 'VEC3', 5126), COLOR_0: accessor(colors, 'VEC3', 5126),
      ...(uvs?{TEXCOORD_0:accessor(uvs,'VEC2',5126)}:{}),
      ...(volumeUVs?{TEXCOORD_1:accessor(volumeUVs,'VEC2',5126)}:{})},
      indices: accessor(indices, 'SCALAR', 5125), material: materialIndex}]});
    gltf.nodes[groupIndex].children.push(gltf.nodes.length);
    gltf.nodes.push({name: mesh.name, mesh: meshIndex});
    triangles += indices.length / 3;
  }
}
gltf.buffers.push({byteLength: byteOffset});
const json = Buffer.from(JSON.stringify(gltf)), jsonPadding = Buffer.alloc((4 - json.length % 4) % 4, 32);
const binary = Buffer.concat(buffers);
const output = Buffer.alloc(12 + 8 + json.length + jsonPadding.length + 8 + binary.length);
output.writeUInt32LE(0x46546c67, 0); output.writeUInt32LE(2, 4); output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(json.length + jsonPadding.length, 12); output.writeUInt32LE(0x4e4f534a, 16);
json.copy(output, 20); jsonPadding.copy(output, 20 + json.length);
const binaryStart = 20 + json.length + jsonPadding.length;
output.writeUInt32LE(binary.length, binaryStart); output.writeUInt32LE(0x004e4942, binaryStart + 4); binary.copy(output, binaryStart + 8);
const directory = new URL('../assets/models/berghain/', import.meta.url);
const filename = official ? 'berghain-exterior-lod2.glb' : 'berghain-study.glb';
writeFileSync(new URL(filename, directory), output);
const bounds = new THREE.Box3().setFromObject(model);
const manifest = {file: filename, bytes: output.length, sha256: createHash('sha256').update(output).digest('hex'),
  triangles, meshes: gltf.meshes.length, materials: gltf.materials.length, units: 'metres',
  ...(gltf.images?{textures:gltf.images.length,embeddedTextureBytes:[...textureIndices.keys()].reduce((total,path)=>total+readFileSync(new URL('../assets/models/berghain/'+path,import.meta.url)).length,0)}:{}),
  bounds: {min: bounds.min.toArray(), max: bounds.max.toArray()},
  accuracy: official ? model.userData.status : 'Reference-based study; most dimensions and layout are provisional',
  source: official ? 'survey-data.mjs' : 'layout.mjs', build: '../../../berghain/export-model.mjs' + (official ? ' --survey' : '')};
writeFileSync(new URL(official ? 'survey-manifest.json' : 'manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n');
disposeBerghainModel(model);
console.log(JSON.stringify(manifest));
