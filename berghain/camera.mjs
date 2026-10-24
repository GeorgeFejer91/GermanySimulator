import {layout} from '../assets/models/berghain/layout.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';

const pierBodies=layout.solids.filter(s=>s.renderPart?.role==='pier body');
const avatarBounds=new THREE.Box3(),corner=new THREE.Vector3();

export function pierOrbitConstraint(position,horizontal){
  let nearest=null;
  for(const body of pierBodies){
    if(position.y<body.y[0]-.1||position.y>body.y[1])continue;
    const x=position.x-THREE.MathUtils.clamp(position.x,...body.x);
    const z=position.z-THREE.MathUtils.clamp(position.z,...body.z),distance=Math.hypot(x,z);
    if(distance>horizontal+.32||distance<.0001||nearest&&distance>=nearest.distance)continue;
    nearest={distance,center:Math.atan2(x,z),limit:Math.acos(-THREE.MathUtils.clamp((distance-.32)/horizontal,-1,1))};
  }
  return nearest;
}

export function frameVisitorCamera(camera,avatar,dt){
  camera.updateMatrixWorld(true);avatarBounds.setFromObject(avatar);
  let tangent=0;
  for(const x of [avatarBounds.min.x,avatarBounds.max.x])for(const y of [avatarBounds.min.y,avatarBounds.max.y])for(const z of [avatarBounds.min.z,avatarBounds.max.z]){
    corner.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);
    tangent=Math.max(tangent,Math.abs(corner.y)/-corner.z/.94,Math.abs(corner.x)/-corner.z/camera.aspect/.94);
  }
  const wanted=THREE.MathUtils.clamp(2*Math.atan(tangent)*180/Math.PI,60,100);
  const fov=Math.max(wanted,camera.fov-75*Math.min(dt,.05));
  if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
  const frame={min:[Infinity,Infinity],max:[-Infinity,-Infinity]};
  for(const x of [avatarBounds.min.x,avatarBounds.max.x])for(const y of [avatarBounds.min.y,avatarBounds.max.y])for(const z of [avatarBounds.min.z,avatarBounds.max.z]){
    corner.set(x,y,z).project(camera);
    frame.min[0]=Math.min(frame.min[0],corner.x);frame.min[1]=Math.min(frame.min[1],corner.y);
    frame.max[0]=Math.max(frame.max[0],corner.x);frame.max[1]=Math.max(frame.max[1],corner.y);
  }
  return {frame,settling:Math.abs(fov-wanted)>.01};
}

export const exteriorTarget = layout.exteriorBounds.min.map((value, axis) => (value + layout.exteriorBounds.max[axis]) / 2);

export function fitExteriorRadius(aspect, angle, polar) {
  const tangent = Math.tan(Math.PI / 8), target = exteriorTarget;
  const outward = [Math.sin(angle) * Math.sin(polar), Math.cos(polar), Math.cos(angle) * Math.sin(polar)];
  const right = [Math.cos(angle), 0, -Math.sin(angle)];
  const up = [-Math.sin(angle) * Math.cos(polar), Math.sin(polar), -Math.cos(angle) * Math.cos(polar)];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  let radius = 115;
  const {min, max} = layout.exteriorBounds;
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
    const relative = [x - target[0], y - target[1], z - target[2]];
    radius = Math.max(radius, dot(relative, outward) + Math.max(Math.abs(dot(relative, right)) / (tangent * aspect * .9),
      Math.abs(dot(relative, up)) / (tangent * .9)));
  }
  return radius;
}
