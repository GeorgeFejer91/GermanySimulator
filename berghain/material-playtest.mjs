import assert from 'node:assert/strict';

export async function compareMaterialRender({page,baseURL,artifacts},view=null){
  await page.goto(baseURL+'/berghain/model.html');
  await page.locator('#model[data-ready="true"]').waitFor();
  const measured=await page.evaluate(async view=>{
    const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
    const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
    const {loadSurfaceTextures}=await import('../assets/models/berghain/surface-materials.mjs');
    const {GLTFLoader}=await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
    const source=createBerghainModel(); await loadSurfaceTextures(source);
    const bytes=await(await fetch('../assets/models/berghain/berghain-study.glb')).arrayBuffer();
    const portable=(await new GLTFLoader().parseAsync(bytes,'')).scene;
    let sourceReflection;source.traverse(mesh=>{if(mesh.isMesh&&mesh.material.envMap)sourceReflection=mesh.material.envMap;});
    const portableReflection=sourceReflection?.clone();
    portable.traverse(mesh=>{if(mesh.isMesh&&mesh.material.transmission>0)mesh.material.envMap=portableReflection;});
    const scene=new THREE.Scene(); scene.background=new THREE.Color('#b3b3a6');
    scene.add(new THREE.HemisphereLight('#e0e6dd','#6a665b',2.1));
    const sun=new THREE.DirectionalLight('#ffedcf',3); sun.position.set(-45,65,50); scene.add(sun);
    const canvas=document.createElement('canvas');
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});
    document.querySelector('#viewport').append(canvas);
    const rect=canvas.getBoundingClientRect(), width=Math.min(1000,Math.round(rect.width)),height=Math.round(width*rect.height/rect.width);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:false,preserveDrawingBuffer:true});
    renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    const camera=new THREE.PerspectiveCamera(45,width/height,.08,400);
    camera.position.set(...(view?.position||[7,10,30]));camera.lookAt(...(view?.target||[0,10,22]));
    const draw=model=>{
      source.removeFromParent();portable.removeFromParent();scene.add(model);renderer.render(scene,camera);
      const pixels=new Uint8Array(width*height*4),gl=renderer.getContext();
      gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      return pixels;
    };
    const a=draw(source),b=draw(portable);
    let sum=0,large=0;const colours=new Set();
    for(let i=0;i<a.length;i+=4){
      let delta=0;for(let c=0;c<3;c++){const difference=Math.abs(a[i+c]-b[i+c]);sum+=difference;delta=Math.max(delta,difference);}
      if(delta>32)large++;
      if(i%128===0)colours.add(`${a[i]},${a[i+1]},${a[i+2]}`);
    }
    const textures=new Set();source.traverse(mesh=>{if(mesh.isMesh)for(const texture of [mesh.material.map,mesh.material.normalMap,mesh.material.roughnessMap,mesh.material.thicknessMap,mesh.material.envMap])if(texture)textures.add(texture);});
    let disposed=0;for(const texture of textures)texture.addEventListener('dispose',()=>disposed++);
    window.materialEvidence={show:kind=>draw(kind==='source'?source:portable),cleanup:()=>{
      disposeBerghainModel(source);disposeBerghainModel(portable);renderer.dispose();
      return {textures:textures.size,disposed};
    }};
    document.querySelector('#instructions').textContent='Isolated source / GLB comparison · same camera and lights';
    return {meanRGBDifference:sum/(width*height*3),largePixelFraction:large/(width*height),sampledColours:colours.size,width,height};
  },view);
  await page.evaluate(()=>window.materialEvidence.show('source'));await artifacts.screenshot(page,'source-materials.png');
  await page.evaluate(()=>window.materialEvidence.show('portable'));await artifacts.screenshot(page,'exported-materials.png');
  const cleanup=await page.evaluate(()=>window.materialEvidence.cleanup());
  await artifacts.json('material-comparison.json',{measured,cleanup});
  assert.ok(measured.sampledColours>20,'Comparison must contain a rendered, shaded asset');
  assert.ok(measured.meanRGBDifference<=1,'Portable material render must agree within one 8-bit RGB level on average');
  assert.ok(measured.largePixelFraction<=.015,'Large colour differences must remain below 1.5% of pixels');
  assert.equal(cleanup.textures,23);assert.equal(cleanup.disposed,23,'Shared source textures must be disposed exactly once');
  return {measured,cleanup,scope:'Isolated close-up source and standard GLB render; no walking-path claim'};
}
export const materialScenario={id:'exported-materials',modes:['stress'],profiles:['desktop'],run:compareMaterialRender};
