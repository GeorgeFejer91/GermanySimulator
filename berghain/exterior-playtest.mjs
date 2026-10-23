import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dragLook, forward} from './fixture-playtest.mjs';
import {canStand} from './navigation.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';

export default {
  name:'Berghain exterior and landscape',
  sourceFiles:()=>['assets/models/berghain/landscape.mjs','assets/models/berghain/exterior-details.mjs',
    'assets/models/berghain/layout.mjs','assets/models/berghain/model.mjs','assets/models/berghain/berghain-study.glb',
    'assets/models/berghain/manifest.json','berghain/navigation.mjs','berghain/viewer.mjs','berghain/walkthrough.mjs'].map(path=>({path,
      sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[{id:'site-orbit-and-garden',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      const request=window.requestAnimationFrame.bind(window);window.__exteriorFrames=0;
      window.requestAnimationFrame=callback=>{window.__exteriorFrames++;return request(callback);};
    });
    const start=Date.now();await page.goto(baseURL+'/berghain/model.html');
    await page.locator('#model[data-ready="true"]').waitFor();
    const readyMs=Date.now()-start;
    await artifacts.screenshot(page,'front-site.png');
    const overview=await page.locator('#model').evaluate(canvas=>({calls:Number(canvas.dataset.drawCalls),triangles:Number(canvas.dataset.triangles)}));
    await dragLook(page,context,profile,628);
    await artifacts.screenshot(page,'rear-service-yard.png');
    await page.waitForTimeout(250);const idleBefore=await page.evaluate(()=>window.__exteriorFrames);
    await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__exteriorFrames),idleBefore);
    await page.locator('#enter').click();await page.locator('#room').selectOption('garden');
    await artifacts.screenshot(page,'garden-walk.png');
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const after=await forward(page,context,profile,700);
    assert.ok(canStand(after,layout));assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.5);
    await artifacts.screenshot(page,'garden-after-movement.png');
    const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>({
      name:new URL(entry.name).pathname,bytes:entry.encodedBodySize,duration:entry.duration})));
    assert.ok(!resources.some(entry=>entry.name.endsWith('.glb')),'normal viewing constructs shared geometry without loading the export');
    assert.deepEqual(errors,[]);
    return {readyMs,overview,before,after,idleFramesAdded:0,transferBytes:resources.reduce((sum,entry)=>sum+entry.bytes,0),
      input:profile.hasTouch?'real CDP touch drag/hold':'real mouse/keyboard',resources,errors};
  }},
  {id:'foliage-camera',modes:['stress'],async run({page,baseURL,artifacts}){
    await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
    const poses=await page.evaluate(async()=>{
      const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
      const {createBerghainModel,disposeBerghainModel}=await import('../assets/models/berghain/model.mjs');
      const {loadSurfaceTextures}=await import('../assets/models/berghain/surface-materials.mjs');
      const {createWalkthrough}=await import('./walkthrough.mjs');
      const {layout}=await import('../assets/models/berghain/layout.mjs');
      const {canStand}=await import('./navigation.mjs');
      const model=createBerghainModel(),walk=createWalkthrough();await loadSurfaceTextures(model);
      const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%'});
      document.querySelector('#viewport').append(canvas);const rect=canvas.getBoundingClientRect();
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(rect.width,rect.height,false);
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
      const scene=new THREE.Scene();scene.background=new THREE.Color('#b3b3a6');scene.add(model,walk.avatar.group,walk.door.group);
      scene.add(new THREE.HemisphereLight('#e0e6dd','#6a665b',2.1));
      const sun=new THREE.DirectionalLight('#ffedcf',3);sun.position.set(-45,65,50);scene.add(sun);
      const camera=new THREE.PerspectiveCamera(60,rect.width/rect.height,.08,500),position={x:33.25,y:.05,z:18.5};
      if(!canStand(position,layout))throw Error('Shrub-edge camera probe must use a legal body position');
      walk.step(position,{x:0,z:0},0);
      window.__foliagePose=yaw=>{
        const start=performance.now(),distance=walk.camera(camera,position,yaw,0,model),cameraMs=performance.now()-start;
        renderer.render(scene,camera);return {yaw,distance,visible:walk.avatar.group.visible,camera:camera.position.toArray(),cameraMs};
      };
      window.__disposeFoliage=()=>{walk.dispose();disposeBerghainModel(model);renderer.dispose();canvas.remove();delete window.__foliagePose;delete window.__disposeFoliage;};
      return [0,.78,1.57,2.35,3.14,3.92,4.71,5.49].map(window.__foliagePose);
    });
    assert.ok(poses.every(pose=>pose.visible&&pose.distance>.65),'the legal shrub-edge turn must retain the avatar');
    const turn=await page.evaluate(async()=>{
      let previous=null,maxStep=0,minDistance=Infinity,hidden=0;
      for(let step=0;step<=314;step++){
        await new Promise(requestAnimationFrame);
        const pose=window.__foliagePose(step*.02);
        if(previous)maxStep=Math.max(maxStep,Math.hypot(...pose.camera.map((value,axis)=>value-previous[axis])));
        previous=pose.camera;minDistance=Math.min(minDistance,pose.distance);if(!pose.visible)hidden++;
      }
      return {frames:315,yawStep:.02,maxStep,minDistance,hidden};
    });
    assert.ok(turn.maxStep<.35,'a slow rendered turn must not pop between elevations');assert.equal(turn.hidden,0);
    for(const yaw of [1.57,3.14]){await page.evaluate(yaw=>window.__foliagePose(yaw),yaw);await artifacts.screenshot(page,`shrub-edge-${yaw}.png`);}
    await page.evaluate(()=>window.__disposeFoliage());
    return {poses,turn,scope:'Diagnostic legal shrub-edge position and production camera/actor; natural entrance checked separately'};
  }},
  {id:'native-exterior',modes:['stress'],profiles:['desktop','android-portrait'],async run({page,baseURL,artifacts}){
    await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
    const measured=await page.evaluate(async()=>{
      const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
      const {GLTFLoader}=await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
      const bytes=await(await fetch('../assets/models/berghain/berghain-study.glb')).arrayBuffer();
      const loaded=(await new GLTFLoader().parseAsync(bytes,'')).scene;
      const metadata=loaded.children[0].userData;
      if(!metadata.landscape||!metadata.exteriorDetails)throw Error('Export must carry site provenance');
      const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%'});
      document.querySelector('#viewport').append(canvas);const rect=canvas.getBoundingClientRect();
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(rect.width,rect.height,false);
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
      const scene=new THREE.Scene();scene.background=new THREE.Color('#b3b3a6');scene.add(loaded);
      scene.add(new THREE.HemisphereLight('#e0e6dd','#6a665b',2.1));
      const sun=new THREE.DirectionalLight('#ffedcf',3);sun.position.set(-45,65,50);scene.add(sun);
      const camera=new THREE.PerspectiveCamera(45,rect.width/rect.height,.08,500);
      const {fitExteriorRadius,exteriorTarget}=await import('./camera.mjs');
      const angle=.7,polar=1.1,radius=fitExteriorRadius(camera.aspect,angle,polar);
      camera.position.set(exteriorTarget[0]+Math.sin(angle)*Math.sin(polar)*radius,
        exteriorTarget[1]+Math.cos(polar)*radius,exteriorTarget[2]+Math.cos(angle)*Math.sin(polar)*radius);
      camera.lookAt(...exteriorTarget);renderer.render(scene,camera);
      const bounds=new THREE.Box3().setFromObject(loaded);let meshes=0;loaded.traverse(node=>{if(node.isMesh)meshes++;});
      window.__disposeExteriorNative=()=>{
        const geometry=new Set(),materials=new Set(),textures=new Set();loaded.traverse(node=>{if(node.isMesh){geometry.add(node.geometry);materials.add(node.material);}});
        for(const material of materials){for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(material[key])textures.add(material[key]);material.dispose();}
        for(const item of geometry)item.dispose();for(const item of textures)item.dispose();renderer.dispose();canvas.remove();
      };
      return {bytes:bytes.byteLength,meshes,min:bounds.min.toArray(),max:bounds.max.toArray(),triangles:renderer.info.render.triangles};
    });
    await artifacts.screenshot(page,'portable-exterior.png');await page.evaluate(()=>window.__disposeExteriorNative());
    const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json',import.meta.url)));
    assert.equal(measured.bytes,manifest.bytes);assert.equal(measured.meshes,manifest.meshes);
    for(const edge of ['min','max'])for(let axis=0;axis<3;axis++)assert.ok(Math.abs(measured[edge][axis]-manifest.bounds[edge][axis])<.002);
    return {measured,scope:'Explicit diagnostic portable asset render, separate from actual movement'};
  }}]
};
