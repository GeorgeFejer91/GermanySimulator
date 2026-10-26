import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {RectAreaLightUniformsLib} from '../assets/vendor/three/0.186.0/examples/jsm/lights/RectAreaLightUniformsLib.js';

let initialized=false;

// Photographed line-emitter relationship; photometry remains estimated.
export function createBeltEmitters(layout,fixture){
  if(!initialized){RectAreaLightUniformsLib.init();initialized=true;}
  const group=new THREE.Group();group.name='saule belt lights';
  const piers=new Map(layout.fixtures.filter(f=>f.id.startsWith('saule-pier-')).map(f=>[f.id,f]));
  for(const lens of layout.parts.filter(p=>p.role==='recessed lens'&&p.fixture===fixture)){
    const pier=piers.get(lens.fixture),sign=Math.sign(lens.center[1]-pier.anchor[1]-pier.dimensions.beltHeight);
    const normal=new THREE.Vector3(lens.center[0]-pier.anchor[0],0,lens.center[2]-pier.anchor[2]).normalize();
    const width=Math.max(lens.size[0],lens.size[2]),height=Math.min(lens.size[0],lens.size[2]);
    const light=new THREE.RectAreaLight('#d9e5e4',125,width,height);
    light.name=`${pier.id} belt wash ${group.children.length} ${sign>0?'up':'down'}`;
    light.position.fromArray(lens.center);light.position.y+=sign*(lens.size[1]/2+.001);
    // Local X follows the long lens edge; local -Z emits upward/downward.
    const x=new THREE.Vector3().crossVectors(new THREE.Vector3(0,sign,0),normal).normalize();
    const y=normal.clone(),z=new THREE.Vector3(0,-sign,0);
    light.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
    group.add(light);
  }
  return group;
}

export function disposeBeltEmitterTables(){
  for(const key of ['LTC_FLOAT_1','LTC_FLOAT_2','LTC_HALF_1','LTC_HALF_2']){
    THREE.UniformsLib[key]?.dispose();delete THREE.UniformsLib[key];
  }
  initialized=false;
}
