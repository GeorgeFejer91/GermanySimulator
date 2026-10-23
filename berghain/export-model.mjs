import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBerghainModel, disposeBerghainModel} from '../assets/models/berghain/model.mjs';

const official = process.argv.includes('--survey');
const model = official ? (await import('../assets/models/berghain/survey-model.mjs')).createSurveyModel() : createBerghainModel();
model.updateMatrixWorld(true);
const gltf = {asset: {version: '2.0', generator: 'Germany Simulator Berghain study exporter',
  extras: {accuracy: official ? model.userData.status : 'Provisional reconstruction. See accompanying provenance; not surveyed.'}},
  scene: 0, scenes: [{nodes: [0]}], nodes: [{name: model.name, children: [], extras: model.userData}],
  meshes: [], materials: [], accessors: [], bufferViews: [], buffers: []};
const buffers = [];
let byteOffset = 0, triangles = 0;

function accessor(array, type, componentType, bounds = false) {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const bufferView = gltf.bufferViews.length;
  gltf.bufferViews.push({buffer: 0, byteOffset, byteLength: bytes.length});
  buffers.push(bytes);
  const padding = (4 - bytes.length % 4) % 4;
  if (padding) buffers.push(Buffer.alloc(padding));
  byteOffset += bytes.length + padding;
  const lanes = type === 'VEC3' ? 3 : 1;
  const entry = {bufferView, componentType, count: array.length / lanes, type};
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

for (const group of model.children) {
  const groupIndex = gltf.nodes.length;
  gltf.nodes[0].children.push(groupIndex);
  gltf.nodes.push({name: group.name, children: [], ...(official ? {extras: group.userData} : {})});
  for (const mesh of group.children) {
    const geometry = mesh.geometry, sourcePosition = geometry.attributes.position, sourceNormal = geometry.attributes.normal;
    const instances = mesh.isInstancedMesh ? mesh.count : 1;
    const vertexCount = sourcePosition.count * instances;
    const positions = new Float32Array(vertexCount * 3), normals = new Float32Array(vertexCount * 3), colors = new Float32Array(vertexCount * 3);
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
      }
      for (let i = 0; i < sourceIndices.length; i++) indices[instance * sourceIndices.length + i] = sourceIndices[i] + instance * sourcePosition.count;
    }
    const material = mesh.material, materialIndex = gltf.materials.length;
    gltf.materials.push({name: mesh.name, pbrMetallicRoughness: {baseColorFactor: [...material.color.toArray(), material.opacity],
      metallicFactor: material.metalness, roughnessFactor: material.roughness},
      emissiveFactor: material.emissive.toArray().map(component => component * material.emissiveIntensity),
      ...(material.transparent ? {alphaMode: 'BLEND', doubleSided: true} : {}),
      ...(material.side === THREE.DoubleSide ? {doubleSided: true} : {})});
    const meshIndex = gltf.meshes.length;
    gltf.meshes.push({name: mesh.name, primitives: [{attributes: {POSITION: accessor(positions, 'VEC3', 5126, true),
      NORMAL: accessor(normals, 'VEC3', 5126), COLOR_0: accessor(colors, 'VEC3', 5126)},
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
  bounds: {min: bounds.min.toArray(), max: bounds.max.toArray()},
  accuracy: official ? model.userData.status : 'Reference-based study; most dimensions and layout are provisional',
  source: official ? 'survey-data.mjs' : 'layout.mjs', build: '../../../berghain/export-model.mjs' + (official ? ' --survey' : '')};
writeFileSync(new URL(official ? 'survey-manifest.json' : 'manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n');
disposeBerghainModel(model);
console.log(JSON.stringify(manifest));
