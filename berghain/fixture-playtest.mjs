import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canStand} from './navigation.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';

async function dragLook(page,context,profile,delta) {
  const box=await page.locator('#model').boundingBox();
  const touch=profile.hasTouch?await context.newCDPSession(page):null;
  for(let remaining=delta;Math.abs(remaining)>.01;) {
    const dx=Math.sign(remaining)*Math.min(Math.abs(remaining),120),x=box.x+box.width/2,y=box.y+box.height/2;
    if(touch) {
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else {
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:4});await page.mouse.up();
    }
    remaining-=dx;
  }
  if(touch)await touch.detach();
}
async function forward(page,context,profile,ms) {
  const touch=profile.hasTouch?await context.newCDPSession(page):null;
  if(touch) {
    const b=await page.locator('[data-move="forward"]').boundingBox();
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
  }else{await page.locator('#model').focus();await page.keyboard.down('w');}
  await page.waitForTimeout(ms);
  if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}
  else await page.keyboard.up('w');
  await page.waitForTimeout(80);
  return JSON.parse(await page.locator('#model').getAttribute('data-position'));
}
export default {
  name:'Berghain source-derived interior furniture',
  sourceFiles:()=>['assets/models/berghain/interior-fixtures.mjs','assets/models/berghain/layout.mjs','assets/models/berghain/model.mjs',
    'assets/models/berghain/berghain-study.glb','assets/models/berghain/manifest.json','berghain/viewer.mjs','berghain/navigation.mjs']
    .map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[{id:'furniture-rooms',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    const failures=[];page.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()]);});
    await page.goto(baseURL+'/berghain/model.html');
    await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#enter').click();
    await dragLook(page,context,profile,-75);
    await forward(page,context,profile,3000);
    await dragLook(page,context,profile,437.5);
    const foyer=await forward(page,context,profile,2400);
    assert.ok(canStand(foyer,layout),'natural foyer approach stays legal');
    await artifacts.screenshot(page,'foyer-channel-seats.png');
    await page.locator('#room').selectOption('panorama');
    await dragLook(page,context,profile,-295);
    await artifacts.screenshot(page,'panorama-bar.png');
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const stopped=await forward(page,context,profile,3300);
    assert.ok(Math.hypot(stopped.x-before.x,stopped.z-before.z)>.5);
    assert.ok(canStand(stopped,layout),'body remains legal at visible furniture');
    const blocked=await forward(page,context,profile,700);
    assert.ok(Math.hypot(blocked.x-stopped.x,blocked.z-stopped.z)<.025,'physical furniture stops continued forward input');
    await artifacts.screenshot(page,'bar-body-clearance.png');
    const native=await page.evaluate(async position=>{
      const THREE=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
      const {GLTFLoader}=await import('../assets/vendor/three/0.186.0/examples/jsm/loaders/GLTFLoader.js');
      const bytes=await(await fetch('../assets/models/berghain/berghain-study.glb')).arrayBuffer();
      const gltf=await new GLTFLoader().parseAsync(bytes,'');
      const fixtures=gltf.scene.children[0]?.userData.fixtures||gltf.scene.userData.fixtures;
      if(!fixtures?.some(f=>f.id==='panorama-bar'))throw Error('Portable GLB is missing the fixture inventory');
      const canvas=document.createElement('canvas');canvas.id='native-fixtures';
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});
      document.querySelector('#viewport').append(canvas);
      const rect=canvas.getBoundingClientRect(),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
      renderer.setPixelRatio(Math.min(1,Math.sqrt(1600000/(rect.width*rect.height))));renderer.setSize(rect.width,rect.height,false);
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
      const scene=new THREE.Scene();scene.background=new THREE.Color('#b3b3a6');scene.add(gltf.scene);
      scene.add(new THREE.HemisphereLight('#e0e6dd','#6a665b',2.1));
      const sun=new THREE.DirectionalLight('#ffedcf',3);sun.position.set(-45,65,50);scene.add(sun);
      const camera=new THREE.PerspectiveCamera(45,rect.width/rect.height,.08,500);
      camera.position.set(position.x,position.y+1.68,position.z);camera.rotation.set(0,1.18,0,'YXZ');
      renderer.render(scene,camera);
      const bounds=new THREE.Box3().setFromObject(gltf.scene);let meshes=0;
      gltf.scene.traverse(node=>{if(node.isMesh)meshes++;});
      window.__disposeNativeFixture=()=>{
        const materials=new Set(),geometries=new Set(),textures=new Set();
        gltf.scene.traverse(node=>{if(node.isMesh){geometries.add(node.geometry);materials.add(node.material);}});
        for(const material of materials){for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(material[key])textures.add(material[key]);material.dispose();}
        for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();
        renderer.dispose();canvas.remove();delete window.__disposeNativeFixture;
      };
      return {bytes:bytes.byteLength,meshes,fixtures:fixtures.length,min:bounds.min.toArray(),max:bounds.max.toArray(),triangles:renderer.info.render.triangles};
    },before);
    await artifacts.screenshot(page,'portable-glb-panorama.png');
    await page.evaluate(()=>window.__disposeNativeFixture());
    const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json',import.meta.url)));
    assert.equal(native.bytes,manifest.bytes);assert.equal(native.meshes,manifest.meshes);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(native.max[axis]-manifest.bounds.max[axis])<.01);
    assert.deepEqual(failures,[]);
    artifacts.json('furniture-route.json',{before,stopped,blocked,native});
    return {input:profile.hasTouch?'CDP touch drag and hold':'real mouse drag and keyboard',before,stopped,blocked,native,failures};
  }},
  {id:'avatar-at-bar',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    await page.goto(baseURL+'/geheim/');
    await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#room').selectOption('panorama');
    await dragLook(page,context,profile,-295);
    await artifacts.screenshot(page,'visitor-bar-approach.png');
    const position=await forward(page,context,profile,3300);
    assert.ok(canStand(position,layout));
    assert.equal(await page.locator('#model').getAttribute('data-avatar'),'true');
    assert.ok(Number(await page.locator('#model').getAttribute('data-camera-distance'))>.65);
    await artifacts.screenshot(page,'visitor-bar-clearance.png');
    return {position,entryEvidence:'Authored room selector for furniture camera only; natural exterior/door flow covered separately'};
  }}]
};
