import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=[...readdirSync(new URL('assets/models/berghain/',root)).filter(p=>p.endsWith('.mjs')).map(p=>'assets/models/berghain/'+p),
 ...['baseColor','normal','roughness'].map(k=>'assets/models/berghain/textures/mineral-'+k+'.png'),
 'berghain/build-panorama-ceiling-lighting.mjs',
 ...['build/three.module.min.js','build/three.core.js','examples/jsm/lights/RectAreaLightUniformsLib.js','examples/jsm/lights/RectAreaLightTexturesLib.js'].map(p=>'assets/vendor/three/0.186.0/'+p)];
const inputHashes=()=>inputs.map(path=>({path,sha256:hash(readFileSync(new URL(path,root)))}));
export default {name:'Fixed Panorama acoustic-ceiling radiance authoring',sourceFiles:inputHashes,scenarios:[{id:'bake',modes:['quick'],profiles:['desktop'],timeoutMs:240000,async run({page,baseURL}){
 await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
 const result=await page.evaluate(async()=>{
  const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
  const {RectAreaLightUniformsLib}=await import('../assets/vendor/three/0.186.0/examples/jsm/lights/RectAreaLightUniformsLib.js');
  const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
  const {layout}=await import('../assets/models/berghain/layout.mjs');
  const {loadSurfaceTextures}=await import('../assets/models/berghain/surface-materials.mjs');
  const {panoramaCeilingBake}=await import('../assets/models/berghain/baked-panorama-ceiling.mjs');
  const source=createBerghainModel(),batch=source.getObjectByName('interior/panoramaCeilingWash/box');
  // Do not feed an earlier radiance map into its own generation.
  delete batch.material.userData.radianceBake;await loadSurfaceTextures(source);
  RectAreaLightUniformsLib.init();
  const part=layout.parts.find(p=>p.name==='Panorama fitted ceiling');
  const clouds=layout.parts.filter(p=>p.name==='Panorama acoustic cloud');
  const geometry=new THREE.PlaneGeometry(1,1);geometry.rotateX(Math.PI/2);geometry.translate(0,-.5,0);
  geometry.applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
  const material=batch.material.clone(),shade=new THREE.Color();batch.getColorAt(0,shade);material.color.multiply(shade);
  const priorShader=batch.material.onBeforeCompile;
  material.onBeforeCompile=shader=>{priorShader(shader);
   // Rasterize in the soffit's intrinsic UV domain, keeping world positions and
   // normals for the original PBR calculation. This preserves the affine fit.
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
    '#include <project_vertex>\ngl_Position=vec4(uv*2.0-1.0,0.0,1.0);');
  };
  material.customProgramCacheKey=()=> 'panorama-ceiling-uv-radiance-authoring-v1';
  const scene=new THREE.Scene();scene.background=new THREE.Color(0);scene.add(new THREE.Mesh(geometry,material));
  const records=[],strength=panoramaCeilingBake.strength,color='#df2034',luminance=55;
  for(const [index,cloud] of clouds.entries()){
   const matrix=new THREE.Matrix4().fromArray(cloud.matrix);
   for(const [axis,sign] of [[0,-1],[0,1],[2,-1],[2,1]]){
    const longAxis=axis===0?2:0,edge=new THREE.Vector3().setComponent(longAxis,1).transformDirection(matrix);
    const width=new THREE.Vector3().setComponent(longAxis,1).applyMatrix3(new THREE.Matrix3().setFromMatrix4(matrix)).length()*.9;
    const position=new THREE.Vector3().setComponent(axis,sign*.45);position.y=.5;position.applyMatrix4(matrix);position.y+=.012;
    // Four integration strips are a fitted cove hypothesis, not a recovered
    // fixture inventory. Fifty control circuits in I11 do not mean fifty lamps.
    const light=new THREE.RectAreaLight(color,luminance/strength,width,.04);
    const back=new THREE.Vector3(0,-1,0),up=new THREE.Vector3().crossVectors(back,edge).normalize();
    light.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(edge,up,back));light.position.copy(position);scene.add(light);
    records.push({cloud:index,axis,sign,position:position.toArray(),width,stripWidth:.04});
   }
  }
  const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(504,496,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  const camera=new THREE.PerspectiveCamera(45,504/496,.01,50);camera.position.set(part.center[0],part.center[1]-3,part.center[2]);camera.up.set(0,0,1);camera.lookAt(...part.center);
  renderer.render(scene,camera);
  const gl=renderer.getContext(),pixels=new Uint8Array(504*496*4);gl.readPixels(0,0,504,496,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let clipped=0,nonzero=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]===255||pixels[i+1]===255||pixels[i+2]===255)clipped++;if(pixels[i]>2)nonzero++;}
  const atlas=document.createElement('canvas');atlas.width=512;atlas.height=512;const ctx=atlas.getContext('2d');ctx.fillStyle='black';ctx.fillRect(0,0,512,512);
  ctx.drawImage(renderer.domElement,4,4);ctx.drawImage(renderer.domElement,0,0,1,496,0,4,4,496);ctx.drawImage(renderer.domElement,503,0,1,496,508,4,4,496);
  ctx.drawImage(atlas,0,4,512,1,0,0,512,4);ctx.drawImage(atlas,0,499,512,1,0,500,512,4);
  const png=atlas.toDataURL('image/png').split(',')[1];geometry.dispose();material.dispose();disposeBerghainModel(source);renderer.dispose();
  for(const key of ['LTC_FLOAT_1','LTC_FLOAT_2','LTC_HALF_1','LTC_HALF_2']){THREE.UniformsLib[key]?.dispose();delete THREE.UniformsLib[key];}
  return {png,clipped,nonzero,records,strength,color,luminance,atlas:[512,512],
   scope:'Original fixed direct radiance on the existing ceiling. Estimated cove placement/output/state; no beam shadows, changing state, moving occlusion or indirect room spill. No runtime area lights.'};
 });
 const {png,...metadata}=result;assert.equal(result.records.length,64);assert.equal(result.clipped,0);assert.ok(result.nonzero>10000,'Bake must contain visible radiance');
 const bytes=Buffer.from(png,'base64'),manifest={...metadata,generatedFrom:inputHashes(),image:{file:'panorama-ceiling-bake.png',bytes:bytes.length,sha256:hash(bytes)}};
 writeFileSync(new URL('assets/models/berghain/textures/panorama-ceiling-bake.png',root),bytes);
 writeFileSync(new URL('assets/models/berghain/textures/panorama-ceiling-bake-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');return manifest;
}}]};
