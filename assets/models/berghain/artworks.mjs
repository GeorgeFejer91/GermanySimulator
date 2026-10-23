import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {climberGeometryData,climberMaterials} from './climber-geometry.mjs';
export {climberMaterials as artworkMaterials};

export function addArtworks(layout){
  const counter=layout.fixtures.find(item=>item.id==='panorama-bar');
  if(!counter)throw Error('The Panorama counter must exist before its sculpture');
  const anchor=[counter.anchor[0]+.25,counter.anchor[1],counter.anchor[2]+.5];
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...anchor),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI),new THREE.Vector3(1,1,1));
  const artwork={id:'uddenberg-climber',artist:'Anna Uddenberg',title:'CLIMBER (Angel Kiss)',year:2020,
    room:'panorama',support:counter.id,anchor,units:'metres',publishedDimensionsCm:[160,130,110],
    sources:['ART02','ART03','ART13'],
    confidence:'Reference-based figure; unseen surfaces, axis order, bar location and continued installation inferred',
    dimensionCaveat:'Gallery dimensions may include studio supports; this is a pose study, not a measured replica',
    omittedStudioSupports:['barrel','wooden studio table','studio stool'],
    features:climberGeometryData().features};
  (layout.artworks||=[]).push(artwork);
  for(const material of Object.keys(climberMaterials))layout.parts.push({
    name:artwork.id+' '+material,artwork:artwork.id,shape:'climber-'+material,material,
    section:'interior',center:anchor,size:[1,1,1],matrix:matrix.toArray()});
  for(const item of climberGeometryData().colliders){
    const bounds=new THREE.Box3(new THREE.Vector3(...item.min),new THREE.Vector3(...item.max)).applyMatrix4(matrix);
    layout.solids.push({name:artwork.id+' '+item.name,artwork:artwork.id,
      confidence:'Bounds of the visible figure segment and attached details',
      x:[bounds.min.x,bounds.max.x],y:[bounds.min.y,bounds.max.y],z:[bounds.min.z,bounds.max.z]});
  }
}
