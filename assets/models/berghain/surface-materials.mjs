import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {surfaceFamilies} from './surface-data.mjs';

const familyByMaterial = {render:'mineral', concrete:'mineral', pale:'mineral', recess:'mineral',
  darkConcrete:'mineral', floor:'mineral', stone:'stone', steel:'metal', rust:'metal',
  gravel:'aggregate', ground:'aggregate',artDenim:'fabric',artQuilt:'fabric',
  loungeLeather:'leather',loungePlum:'leather',kloRed:'mineral',stainless:'metal',artAmber:'amber'};

export function configureSurfaceMaterial(material, name) {
  const family = familyByMaterial[name];
  if (family) material.userData.surface = {family, ...surfaceFamilies[family]};
  if(name==='artAmber'){
    material.userData.volumeMap='textures/amber-thickness.png';
    material.userData.environmentMap='textures/amber-lighting.png';
  }
}

export function surfaceUV(position, normal, metresPerTile) {
  const [x,y,z]=position, [nx,ny,nz]=normal;
  if(Math.abs(nx)>=Math.abs(ny)&&Math.abs(nx)>=Math.abs(nz)) return [z*Math.sign(nx)/metresPerTile,y/metresPerTile];
  if(Math.abs(ny)>=Math.abs(nz)) return [x/metresPerTile,-z*Math.sign(ny)/metresPerTile];
  return [-x*Math.sign(nz)/metresPerTile,y/metresPerTile];
}

function projectedMaterial(material, maps) {
  Object.assign(material,{map:maps.baseColor,roughnessMap:maps.roughness,normalMap:maps.normal});
  if(material.clearcoat>0)material.clearcoatNormalMap=maps.normal;
  material.onBeforeCompile = shader => {
    shader.uniforms.berghainTileMetres={value:material.userData.surface.metresPerTile};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float berghainTileMetres;');
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vec3 surfacePosition=position;
      vec3 surfaceNormal=normal;
      #ifdef USE_INSTANCING
        surfacePosition=(instanceMatrix*vec4(position,1.0)).xyz;
        surfaceNormal=mat3(instanceMatrix)*normal;
      #endif
      vec3 dominant=abs(surfaceNormal);
      vec2 surfaceUv=dominant.x>=dominant.y&&dominant.x>=dominant.z
        ?vec2(surfacePosition.z*sign(surfaceNormal.x),surfacePosition.y)
        :dominant.y>=dominant.z?vec2(surfacePosition.x,-surfacePosition.z*sign(surfaceNormal.y))
        :vec2(-surfacePosition.x*sign(surfaceNormal.z),surfacePosition.y);
      vMapUv=surfaceUv/berghainTileMetres;
      vNormalMapUv=vMapUv;
      vRoughnessMapUv=vMapUv;
      #ifdef USE_CLEARCOAT_NORMALMAP
        vClearcoatNormalMapUv=vMapUv;
      #endif`);
  };
  material.customProgramCacheKey=()=> 'berghain-metre-uv-v1';
  material.needsUpdate=true;
}

export async function loadSurfaceTextures(model, anisotropy=1) {
  const materials=new Set();
  model.traverse(mesh=>{if(mesh.isMesh&&mesh.material.userData.surface) materials.add(mesh.material);});
  const families=[...new Set([...materials].map(material=>material.userData.surface.family))];
  const loader=new THREE.TextureLoader(), textures=new Map();
  const requests=families.flatMap(family=>['baseColor','roughness','normal'].map(async kind=>{
    const key=surfaceFamilies[family][kind], texture=await loader.loadAsync(new URL(key,import.meta.url).href);
    texture.name=key; texture.flipY=false;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=anisotropy;
    if(kind==='baseColor') texture.colorSpace=THREE.SRGBColorSpace;
    textures.set(key,texture);
  }));
  const extras=new Set([...materials].flatMap(m=>[m.userData.volumeMap,m.userData.environmentMap]).filter(Boolean));
  for(const key of extras)requests.push((async()=>{
    const texture=await loader.loadAsync(new URL(key,import.meta.url).href);texture.name=key;texture.flipY=false;
    if(key.endsWith('lighting.png')){texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;}
    else texture.channel=1;
    textures.set(key,texture);
  })());
  const results=await Promise.allSettled(requests);
  const failure=results.find(result=>result.status==='rejected');
  if(failure||model.userData.disposed){
    for(const texture of textures.values()) texture.dispose();
    if(failure) throw failure.reason;
    return;
  }
  for(const material of materials){
    const surface=material.userData.surface;
    projectedMaterial(material,Object.fromEntries(['baseColor','roughness','normal'].map(kind=>[kind,textures.get(surface[kind])])));
    if(material.userData.volumeMap)material.thicknessMap=textures.get(material.userData.volumeMap);
    if(material.userData.environmentMap)material.envMap=textures.get(material.userData.environmentMap);
  }
  return textures.size;
}
