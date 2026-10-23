import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {survey} from './survey-data.mjs';

function polygonTriangles(polygon) {
  const normal = new THREE.Vector3();
  for (let i = 0; i < polygon.outer.length; i++) {
    const a = polygon.outer[i], b = polygon.outer[(i + 1) % polygon.outer.length];
    normal.x += (a[1] - b[1]) * (a[2] + b[2]);
    normal.y += (a[2] - b[2]) * (a[0] + b[0]);
    normal.z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  if (normal.lengthSq() < 1e-12) throw Error('Degenerate survey polygon');
  normal.normalize();
  const dominant = normal.toArray().map(Math.abs).indexOf(Math.max(...normal.toArray().map(Math.abs)));
  const axes = [0, 1, 2].filter(axis => axis !== dominant);
  const project = ring => ring.map(point => new THREE.Vector2(point[axes[0]], point[axes[1]]));
  const faces = THREE.ShapeUtils.triangulateShape(project(polygon.outer), polygon.holes.map(project));
  const points = [...polygon.outer, ...polygon.holes.flat()];
  const output = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const face of faces) {
    const [i, j, k] = face;
    a.fromArray(points[i]); b.fromArray(points[j]); c.fromArray(points[k]);
    const agrees = b.sub(a).cross(c.sub(a)).dot(normal) > 0;
    for (const index of agrees ? [i, j, k] : [i, k, j]) output.push(...points[index]);
  }
  return output;
}

export function createSurveyModel({partIds, surfaceTypes, surfaceFilter} = {}) {
  const model = new THREE.Group();
  model.name = 'Berghain official LoD2 exterior';
  model.userData = {units: 'metres', buildingId: survey.buildingId, licence: survey.licence,
    status: survey.limits, catalogue: 'berghain/For-AI/SOURCES.md', coordinates: survey.frame};
  for (const part of survey.parts) {
    if (partIds && !partIds.includes(part.id)) continue;
    const group = new THREE.Group(); group.name = part.id; group.userData = {height: part.measuredHeight};
    const batches = new Map();
    for (const surface of part.surfaces) {
      if (surfaceTypes && !surfaceTypes.includes(surface.type)) continue;
      if (surfaceFilter && !surfaceFilter(surface, part)) continue;
      if (!batches.has(surface.type)) batches.set(surface.type, []);
      const vertices = batches.get(surface.type);
      for (const polygon of surface.polygons) vertices.push(...polygonTriangles(polygon));
    }
    for (const [type, vertices] of batches) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      const material = new THREE.MeshStandardMaterial({color: type === 'RoofSurface' ? '#68685f' : '#9b9687', roughness: .96, side: THREE.DoubleSide});
      const mesh = new THREE.Mesh(geometry, material); mesh.name = type;
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    model.add(group);
  }
  return model;
}
