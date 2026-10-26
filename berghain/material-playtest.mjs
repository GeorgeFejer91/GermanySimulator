import assert from 'node:assert/strict';

export async function compareMaterialRender({page,baseURL,artifacts},view=null){
  await page.goto(baseURL+'/berghain/model.html');
  await page.locator('#model[data-ready="true"]').waitFor();
  const measured=await page.evaluate(async view=>{
    const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
    const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
    const {loadSurfaceTextures}=await import('../assets/models/berghain/surface-materials.mjs');
    const {GLTFLoader}=await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
    const source=createBerghainModel(); const expectedTextures=await loadSurfaceTextures(source);
    const bytes=await(await fetch('../assets/models/berghain/berghain-study.glb')).arrayBuffer();
    const portable=(await new GLTFLoader().parseAsync(bytes,'')).scene;
    let sourceReflection;source.traverse(mesh=>{if(mesh.isMesh&&mesh.material.envMap)sourceReflection=mesh.material.envMap;});
    const portableReflection=sourceReflection?.clone();
    portable.traverse(mesh=>{if(mesh.isMesh&&mesh.material.transmission>0)mesh.material.envMap=portableReflection;});
    const scene=new THREE.Scene(); scene.background=new THREE.Color('#b3b3a6');
    let nightLighting;
    if(view?.clubNight){
      const {createViewerLighting}=await import('./night-lighting.mjs');
      nightLighting=createViewerLighting(scene);
      nightLighting.update('interior',{x:view.position[0],y:view.position[1]-1.68,z:view.position[2]});
      portable.traverse(mesh=>{if(mesh.isMesh){
        const authored=source.getObjectByName(mesh.material.name);
        if(!authored)throw Error('Portable shadow owner missing: '+mesh.material.name);
        mesh.castShadow=authored.castShadow;mesh.receiveShadow=authored.receiveShadow;
      }});
    }else{
      scene.add(new THREE.HemisphereLight('#e0e6dd','#6a665b',2.1));
      const sun=new THREE.DirectionalLight('#ffedcf',3); sun.position.set(-45,65,50); scene.add(sun);
    }
    const canvas=document.createElement('canvas');
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});
    document.querySelector('#viewport').append(canvas);
    const rect=canvas.getBoundingClientRect(), width=Math.min(1000,Math.round(rect.width)),height=Math.round(width*rect.height/rect.width);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:false,preserveDrawingBuffer:true});
    renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    if(view?.clubNight){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;}
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
    let lighting=null;
    const sourceLights=[],portableLights=[],sourceBakes=[];
    source.traverse(object=>{if(object.isMesh&&(object.material.userData.beltBake||object.material.userData.radianceBake))sourceBakes.push(object.material);});
    source.traverse(object=>{if(object.isSpotLight)sourceLights.push(object);});
    portable.traverse(object=>{if(object.isSpotLight)portableLights.push(object);});
    if(view?.practicalLighting){
      for(const light of sourceLights)light.visible=false;
      for(const material of sourceBakes)material.emissiveIntensity=0;
      const unlit=draw(source),change=[0,0,0];let warmPixels=0;
      for(let i=0;i<a.length;i+=4){
        const delta=[0,1,2].map(c=>a[i+c]-unlit[i+c]);
        delta.forEach((value,c)=>change[c]+=value);
        if(delta[0]>=6&&delta[0]>delta[2]*1.25)warmPixels++;
      }
      for(const light of sourceLights)light.visible=true;
      for(const material of sourceBakes)material.emissiveIntensity=(material.userData.beltBake||material.userData.radianceBake).strength;
      lighting={source:sourceLights.length,portable:portableLights.length,bakedMaterials:sourceBakes.length,
        meanChange:change.map(value=>value/(width*height)),warmFraction:warmPixels/(width*height)};
    }
    const textures=new Set();source.traverse(mesh=>{if(mesh.isMesh)for(const texture of [mesh.material.map,mesh.material.normalMap,mesh.material.roughnessMap,mesh.material.thicknessMap,mesh.material.envMap,mesh.material.emissiveMap])if(texture)textures.add(texture);});
    let disposed=0;for(const texture of textures)texture.addEventListener('dispose',()=>disposed++);
    window.materialEvidence={show:kind=>{
      for(const light of sourceLights)light.visible=kind!=='unlit';
      for(const material of sourceBakes)material.emissiveIntensity=kind==='unlit'?0:(material.userData.beltBake||material.userData.radianceBake).strength;
      return draw(kind==='portable'?portable:source);
    },cleanup:()=>{
      disposeBerghainModel(source);disposeBerghainModel(portable);nightLighting?.dispose();renderer.dispose();
      return {textures:textures.size,disposed};
    }};
    document.querySelector('#instructions').textContent='Isolated source / GLB comparison · same camera and lights';
    return {meanRGBDifference:sum/(width*height*3),largePixelFraction:large/(width*height),sampledColours:colours.size,width,height,lighting,expectedTextures,nightLighting:nightLighting?.state||null};
  },view);
  await page.evaluate(()=>window.materialEvidence.show('source'));await artifacts.screenshot(page,'source-materials.png');
  if(view?.practicalLighting){await page.evaluate(()=>window.materialEvidence.show('unlit'));await artifacts.screenshot(page,'practical-lights-off.png');}
  await page.evaluate(()=>window.materialEvidence.show('portable'));await artifacts.screenshot(page,'exported-materials.png');
  const cleanup=await page.evaluate(()=>window.materialEvidence.cleanup());
  await artifacts.json('material-comparison.json',{measured,cleanup});
  assert.ok(measured.sampledColours>20,'Comparison must contain a rendered, shaded asset');
  assert.ok(measured.meanRGBDifference<=1,'Portable material render must agree within one 8-bit RGB level on average');
  assert.ok(measured.largePixelFraction<=.015,'Large colour differences must remain below 1.5% of pixels');
  assert.equal(cleanup.textures,measured.expectedTextures);assert.equal(cleanup.disposed,measured.expectedTextures,'Shared source textures must be disposed exactly once');
  return {measured,cleanup,scope:'Isolated close-up source and standard GLB render; no walking-path claim'};
}
export const materialScenario={id:'exported-materials',modes:['stress'],profiles:['desktop'],run:compareMaterialRender};
