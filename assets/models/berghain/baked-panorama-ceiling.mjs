import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

// I11's concealed RGB ceiling wash, in one authored fixed state. This map is
// outgoing ceiling radiance, not luminous paint or a recovered lighting program.
// The atlas contains the soffit only; an unused black row serves all other faces.
export const panoramaCeilingBake={map:'textures/panorama-ceiling-bake.png',strength:4};
export function configurePanoramaCeilingBake(mesh,parts){
 if(!parts.some(p=>p.name==='Panorama fitted ceiling'))return;
 if(parts.length!==1)throw Error('Panorama ceiling bake requires its own material batch');
 mesh.geometry=mesh.geometry.clone();
 const uv=mesh.geometry.attributes.uv,normal=mesh.geometry.attributes.normal;
 const atlas=new Float32Array(uv.count*2);
 for(let i=0;i<uv.count;i++)atlas.set(normal.getY(i)<-.5
  ?[(4+uv.getX(i)*504)/512,(4+(1-uv.getY(i))*496)/512]
  :[.5/512,508.5/512],i*2);
 mesh.geometry.setAttribute('uv1',new THREE.BufferAttribute(atlas,2));
 mesh.material.userData.radianceBake={...panoramaCeilingBake};
}
