import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {togetherSections,togetherGeometryData} from './together-geometry.mjs';

export function addTogether(layout){
  const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
  if(!bar)throw Error('Together requires its Klo Bar display enclosure');
  const art={id:'marr-together',artist:'Joseph Marr',title:'Together',year:2013,room:'klo',support:bar.id,
    publishedLengthMetres:9,publishedMassKg:300,units:'metres',sources:['ART04','ART14','ART15','ART16','R01'],
    medium:'Cola-flavoured sugar preserved with polyurethane',
    anatomicalBase:{resource:'R01',license:'CC0-1.0',provenance:'anatomy-provenance.json',
      reconstruction:'Original poses and relief adaptation of generic anatomical data; not scans of the artwork'},
    confidence:'Reference-based relief with CC0 generic anatomical base; figure count, complete order, hidden surfaces, dimensions and optical values inferred',
    status:'Partial figure reconstruction; full narrative and Baroque mask/animal ornament pending',
    features:togetherGeometryData().features,
    collisionOwner:bar.id+' assembly clearance',
    segments:togetherSections.map(s=>({id:s.id,length:s.length,sourceViews:s.sourceViews,placement:'Estimated within the original counter study'}))};
  layout.artworks.push(art);
  for(const section of togetherSections){
    const anchor=bar.anchor.map((x,i)=>x+section.offset[i]);
    const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),section.angle);
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...anchor),rotation,new THREE.Vector3(1,1,1));
    const length={left:1.68,front:6.43,return:2.61,rear:1.53}[section.id],width=section.id==='rear'?.59:.79;
    const low=section.id==='rear'?.96:.94,high=section.id==='rear'?1.26:1.23;
    const bounds=new THREE.Box3(new THREE.Vector3(-length/2,bar.anchor[1]+low-anchor[1],-width/2),
      new THREE.Vector3(length/2,bar.anchor[1]+high-anchor[1],width/2)).applyMatrix4(matrix);
    layout.parts.push({name:art.id+' '+section.id,artwork:art.id,shape:'together-'+section.id,material:'artAmber',section:'interior',
      center:anchor,size:[section.length,.27,section.width],matrix:matrix.toArray(),displayBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});
  }
  layout.kloBar.artwork.status=art.status;
}
