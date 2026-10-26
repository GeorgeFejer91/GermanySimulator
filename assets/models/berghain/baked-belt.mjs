import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

// Fixed outgoing radiance from the authored concealed strips; not glowing concrete.
// Four vertical faces per row, eight piers. A black atlas tail serves other parts.
export function beltBakeUV(uv,index){
  return index<0||uv[1]>.94?[.5/1024,4000.5/4096]:[uv[0],uv[1]+index*480/4096];
}
export function configureBeltBake(mesh,parts,allParts){
  if(!parts.some(p=>p.role==='pier body'&&p.fixture?.startsWith('saule-pier-')))return;
  const bodies=allParts.filter(p=>p.role==='pier body'&&p.fixture.startsWith('saule-pier-'));
  mesh.geometry=mesh.geometry.clone();
  const uv=mesh.geometry.attributes.uv,normal=mesh.geometry.attributes.normal,atlas=new Float32Array(uv.count*2);
  for(let i=0;i<uv.count;i++){
    const nx=normal.getX(i),nz=normal.getZ(i),face=nx>.5?0:nx<-.5?1:nz>.5?2:nz<-.5?3:-1;
    atlas.set(face<0?[.5/1024,4000.5/4096]:[(face*256+4+uv.getX(i)*248)/1024,(4+(1-uv.getY(i))*472)/4096],i*2);
  }
  mesh.geometry.setAttribute('uv1',new THREE.BufferAttribute(atlas,2));
  mesh.geometry.setAttribute('beltBakeIndex',new THREE.InstancedBufferAttribute(Float32Array.from(parts,p=>bodies.indexOf(p)),1));
  mesh.material.userData.beltBake={map:'textures/saule-belt-bake.png',strength:64};
}
export function configureBeltBakeShader(shader){
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float beltBakeIndex;');
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    #ifdef USE_EMISSIVEMAP
      vEmissiveMapUv=beltBakeIndex>=0.0&&uv1.y<.94
        ?uv1+vec2(0.0,beltBakeIndex*480.0/4096.0):vec2(.5/1024.0,4000.5/4096.0);
    #endif`);
}
