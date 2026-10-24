export async function renderNativeAsset(page,view){
  return page.evaluate(async({position,yaw,pitch=0,fov=45,rays=[]})=>{
    const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
    const {GLTFLoader}=await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
    const bytes=await(await fetch('../assets/models/berghain/berghain-study.glb')).arrayBuffer();
    const gltf=await new GLTFLoader().parseAsync(bytes,'');
    const reflection=await new THREE.TextureLoader().loadAsync('../assets/models/berghain/textures/amber-lighting.png');
    reflection.mapping=THREE.EquirectangularReflectionMapping;reflection.colorSpace=THREE.SRGBColorSpace;reflection.flipY=false;
    gltf.scene.traverse(node=>{if(node.isMesh&&node.material.transmission>0)node.material.envMap=reflection;});
    const metadata=gltf.scene.children[0]?.userData.fixtures?gltf.scene.children[0].userData:gltf.scene.userData;
    if(!metadata.fixtures?.some(f=>f.id==='panorama-bar'))throw Error('Portable GLB is missing the fixture inventory');
    const canvas=document.createElement('canvas');canvas.id='native-fixtures';
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});
    document.querySelector('#viewport').append(canvas);
    const rect=canvas.getBoundingClientRect(),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    renderer.setPixelRatio(Math.min(1,Math.sqrt(1600000/(rect.width*rect.height))));renderer.setSize(rect.width,rect.height,false);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#b3b3a6');scene.add(gltf.scene);
    scene.add(new THREE.HemisphereLight('#e0e6dd','#6a665b',2.1));
    const sun=new THREE.DirectionalLight('#ffedcf',3);sun.position.set(-45,65,50);scene.add(sun);
    const camera=new THREE.PerspectiveCamera(fov,rect.width/rect.height,.08,500);
    camera.position.set(position.x,position.y+1.68,position.z);camera.rotation.set(pitch,yaw,0,'YXZ');
    renderer.render(scene,camera);
    const bounds=new THREE.Box3().setFromObject(gltf.scene);let meshes=0;const physicalMaterials=[];
    gltf.scene.traverse(node=>{if(node.isMesh){meshes++;if(node.material.transmission>0)physicalMaterials.push({name:node.material.name,
      transmission:node.material.transmission,thickness:node.material.thickness,ior:node.material.ior,attenuationDistance:node.material.attenuationDistance,
      volumeChannel:node.material.thicknessMap?.channel,volumeUVs:node.geometry.attributes.uv1?.count,
      normalMap:!!node.material.normalMap,coatNormalMap:!!node.material.clearcoatNormalMap,environmentMap:!!node.material.envMap});}});
    window.__disposeNativeAsset=()=>{
      const materials=new Set(),geometries=new Set(),textures=new Set();
      gltf.scene.traverse(node=>{if(node.isMesh){geometries.add(node.geometry);materials.add(node.material);}});
      for(const material of materials){for(const key of ['map','normalMap','roughnessMap','metalnessMap','thicknessMap','envMap'])if(material[key])textures.add(material[key]);material.dispose();}
      textures.add(reflection);
      for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();
      renderer.dispose();canvas.remove();delete window.__disposeNativeAsset;
    };
    let geometryProbes;
    if(rays.length){
      const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
      const source=createBerghainModel();source.updateMatrixWorld(true);gltf.scene.updateMatrixWorld(true);
      try{
        const sample=model=>rays.map(({origin,direction})=>{
          const ray=new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction).normalize());
          return ray.intersectObject(model,true)[0]?.distance??null;
        });
        geometryProbes={source:sample(source),native:sample(gltf.scene)};
      }finally{disposeBerghainModel(source);}
    }
    return {bytes:bytes.byteLength,meshes,geometryProbes,fixtures:metadata.fixtures.length,equipment:metadata.soundSystem?.components.length||0,artworks:metadata.artworks?.length||0,upperLounge:metadata.upperLounge||null,
      panoramaServices:metadata.panoramaServices||null,
      kloBar:metadata.kloBar||null,labOratory:metadata.labOratory||null,balustrades:metadata.balustrades||null,
      physicalMaterials,
      min:bounds.min.toArray(),max:bounds.max.toArray(),triangles:renderer.info.render.triangles};
  },view);
}

export async function disposeNativeAsset(page){await page.evaluate(()=>window.__disposeNativeAsset());}
