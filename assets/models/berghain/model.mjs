import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {layout, materials} from './layout.mjs';
import {createSurveyModel} from './survey-model.mjs';
import {annexPartIds, mainPartId, hallPartId} from './calibration.mjs';
import {configureSurfaceMaterial,configureInstanceNormals} from './surface-materials.mjs';
import {createAcousticGrilleGeometry} from './interior-fixtures.mjs';
import {createSpeakerGeometries} from './speaker-geometries.mjs';
import {createClimberGeometries} from './climber-geometry.mjs';
import {createLoungeGeometries} from './upper-lounge.mjs';
import {createKloGeometries} from './klo-bar.mjs';
import {createTogetherGeometries} from './together-geometry.mjs';
import {createLabGeometries} from './lab-oratory.mjs';
import {createMainBarGeometries,createMainBarLights} from './main-bar.mjs';
import {createSauleGeometries} from './saule.mjs';
import {createHalleGeometries} from './halle.mjs';

export function createBerghainModel() {
  const model = new THREE.Group();
  model.name = 'Berghain architectural study';
  model.userData = {units: 'metres', status: layout.calibration.status, catalogue: 'berghain/For-AI/SOURCES.md',
    externalSource: 'Berlin LoD2 DEBE02YY200004SX; dl-de-zero-2.0',fixtures:layout.fixtures,soundSystem:layout.soundSystem,
    landscape:layout.landscape,exteriorDetails:layout.exteriorDetails,artworks:layout.artworks,upperLounge:layout.upperLounge,
    panoramaServices:layout.panoramaServices,kloBar:layout.kloBar,labOratory:layout.labOratory,balustrades:layout.balustrades,mainBar:layout.mainBar,saule:layout.saule,halle:layout.halle,interiorTopology:layout.interiorTopology,
    architecturalCirculation:layout.architecturalCirculation,mainHallDetails:layout.mainHallDetails,groundSanitary:layout.groundSanitary,admission:layout.admission};
  const geometries = {box: new THREE.BoxGeometry(1, 1, 1), beam: new THREE.BoxGeometry(1, 1, 1),
    hopper: new THREE.CylinderGeometry(.5, .12, 1, 16),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),
    ring:new THREE.TorusGeometry(.5,.035,6,20),sphere:new THREE.IcosahedronGeometry(.5,1),
    grille:createAcousticGrilleGeometry(),...createSpeakerGeometries(),...createClimberGeometries(),...createLoungeGeometries(),...createKloGeometries(),...createTogetherGeometries(),...createLabGeometries(),...createMainBarGeometries(),...createSauleGeometries(),...createHalleGeometries()};
  const batches = new Map(), toneBatches=new Map(), shades=new Map(), transform = new THREE.Object3D(), direction = new THREE.Vector3(), vertical = new THREE.Vector3(0, 1, 0);
  for (const part of layout.parts) {
    const key = [part.section, part.material, part.shape].join('/');
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(part);
    const toneKey=[part.section,part.material==='mainBarPlaster'?'pale':part.material,part.shape].join('/');
    if(!toneBatches.has(toneKey))toneBatches.set(toneKey,[]);
    toneBatches.get(toneKey).push(part);
  }
  for(const parts of toneBatches.values())parts.forEach((part,index)=>shades.set(part,part.instanceTone??(.84+((index*193+parts.length*37)%101)/625)));
  for (const [key, parts] of batches) {
    const [section, materialName, shape] = key.split('/');
    let group = model.getObjectByName(section);
    if (!group) { group = new THREE.Group(); group.name = section; model.add(group); }
    const Material=materials[materialName].transmission?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
    const material = new Material({...materials[materialName]});
    configureInstanceNormals(material);
    if(shape==='halle-mesh')material.side=THREE.DoubleSide;
    if(section==='admission')configureSurfaceMaterial(material,
      ({admissionWall:'labWall',admissionScuff:'concrete',admissionZinc:'steel',admissionRust:'rust'})[materialName]??materialName);
    else if (shape === 'box'||shape.startsWith('climber-')||shape.startsWith('lounge-')||shape.startsWith('together-')||shape.startsWith('lab-')||shape.startsWith('main-bar-')||shape.startsWith('saule-')||shape.startsWith('halle-')) configureSurfaceMaterial(material, materialName);
    const mesh = new THREE.InstancedMesh(geometries[shape], material, parts.length);
    mesh.name = key;
    mesh.castShadow = !material.transparent && !material.transmission && !parts.every(part => part.center && part.center[1] + part.size[1] / 2 < .15);
    mesh.receiveShadow = true;
    parts.forEach((part, index) => {
      transform.quaternion.identity();
      if (shape === 'beam') {
        const start = new THREE.Vector3(...part.start), end = new THREE.Vector3(...part.end);
        direction.subVectors(end, start);
        transform.position.copy(start).add(end).multiplyScalar(.5);
        transform.scale.set(part.width, direction.length(), part.width);
        transform.quaternion.setFromUnitVectors(vertical, direction.normalize());
      } else {
        transform.position.set(...part.center);
        transform.scale.set(...part.size);
      }
      if (part.matrix) transform.matrix.fromArray(part.matrix);
      else transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      const shade = shades.get(part);
      mesh.setColorAt(index, new THREE.Color(shade, shade, shade));
    });
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  const roofs = createSurveyModel({partIds: [mainPartId, hallPartId], surfaceTypes: ['RoofSurface']});
  const roofGroup = new THREE.Group(); roofGroup.name = 'roof';
  for (const group of [...roofs.children]) for (const mesh of [...group.children]) {
    mesh.name = group.name + ' roof'; roofGroup.add(mesh);
  }
  model.add(roofGroup);
  const upperWall = createSurveyModel({partIds: [hallPartId], surfaceTypes: ['WallSurface'],
    surfaceFilter: surface => surface.polygons.every(polygon => polygon.outer.every(point => point[2] > -15.05))});
  for (const group of [...upperWall.children]) for (const mesh of [...group.children]) {
    mesh.name = 'Halle upper front wall'; model.getObjectByName('shell').add(mesh);
  }
  const annexes = createSurveyModel({partIds: annexPartIds});
  for (const group of [...annexes.children]) { group.name = 'official annex ' + group.name; model.add(group); }
  model.traverse(mesh => {
    if (mesh.isMesh && !mesh.isInstancedMesh && mesh.parent.name !== 'roof' && mesh.name !== 'RoofSurface')
      configureSurfaceMaterial(mesh.material, 'concrete');
  });
  model.add(createMainBarLights(layout.mainBar.interiorFacade.practicalLighting));
  return model;
}

export function disposeBerghainModel(model) {
  model.userData.disposed = true;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    materials.add(mesh.material);
    for (const map of [mesh.material.map,mesh.material.normalMap,mesh.material.roughnessMap,mesh.material.thicknessMap,mesh.material.envMap]) if (map) textures.add(map);
    mesh.dispose?.();
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}
