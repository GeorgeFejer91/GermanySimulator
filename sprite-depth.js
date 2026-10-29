// Preserve painted silhouettes, but test/write depth on an upright plane through
// the registered sole pivot. No extra draw, texture, frame loop or actor uniform.
// See For-AI/OBJECT-CONSISTENCY.md#painted-sprite-depth-protocol.
const installedMaterials=new WeakSet();
export function installSpriteDepth(T,mesh,foot){
  const geometry=mesh.geometry,material=mesh.material;
  const anchors=new Float32Array(geometry.attributes.position.count*3);
  for(let i=0;i<anchors.length;i+=3)anchors.set(foot,i);
  geometry.setAttribute('spriteDepthFoot',new T.BufferAttribute(anchors,3));
  mesh.userData.spriteDepth='upright-foot-plane';
  material.depthTest=true;material.depthWrite=true;
  if(installedMaterials.has(material))return mesh;
  installedMaterials.add(material);
  material.userData.spriteDepth=true;
  const compile=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.vertexShader=`attribute vec3 spriteDepthFoot;
varying vec3 vSpriteDepthWorld;
varying vec3 vSpriteDepthFoot;
${shader.vertexShader}`.replace('#include <project_vertex>',`#include <project_vertex>
vSpriteDepthWorld=(modelMatrix*vec4(transformed,1.0)).xyz;
vSpriteDepthFoot=(modelMatrix*vec4(spriteDepthFoot,1.0)).xyz;`);
    shader.fragmentShader=`uniform mat4 projectionMatrix;
varying vec3 vSpriteDepthWorld;
varying vec3 vSpriteDepthFoot;
${shader.fragmentShader}`.replace('#include <logdepthbuf_fragment>',`#include <logdepthbuf_fragment>
// Camera-back projected onto ground defines the same upright plane for all
// people in this view, including a reflected view. Near-overhead uses real depth.
vec3 spriteNormal=vec3(viewMatrix[0][2],0.0,viewMatrix[2][2]);
vec3 spriteRay=vSpriteDepthWorld-cameraPosition;
float spriteDenominator=dot(spriteRay,spriteNormal);
gl_FragDepth=gl_FragCoord.z;
if(dot(spriteNormal,spriteNormal)>0.0001&&abs(spriteDenominator)>0.0001){
  float spriteDistance=dot(vSpriteDepthFoot-cameraPosition,spriteNormal)/spriteDenominator;
  vec4 spriteClip=projectionMatrix*viewMatrix*vec4(cameraPosition+spriteRay*spriteDistance,1.0);
  if(spriteDistance<=0.0||spriteClip.w<=0.0||abs(spriteClip.z)>spriteClip.w)discard;
  gl_FragDepth=0.5*(spriteClip.z/spriteClip.w)+0.5;
}`);
  };
  material.customProgramCacheKey=()=>`${cacheKey}:upright-foot-depth-v1`;
  material.needsUpdate=true;
  return mesh;
}
