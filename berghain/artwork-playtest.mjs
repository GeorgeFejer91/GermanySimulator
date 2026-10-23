import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {canStand} from './navigation.mjs';
import {dragLook,forward} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

async function panorama(page){
  await page.locator('#room').selectOption('panorama');
  await page.waitForFunction(expected=>{
    const canvas=document.querySelector('#model'),position=JSON.parse(canvas.dataset.position||'{}');
    return canvas.dataset.view==='interior'&&Math.hypot(position.x-expected.x,position.y-expected.y,position.z-expected.z)<.01;
  },viewpoints.panorama.position);
}

async function lookDown(page,context,profile){
  const box=await page.locator('#model').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  if(profile.hasTouch){
    const touch=await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+60}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();
  }else{
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+60,{steps:4});await page.mouse.up();
  }
}

export default {
  name:'Berghain Uddenberg figure geometry study',
  sourceFiles:()=>['assets/models/berghain/climber-geometry.mjs','assets/models/berghain/artworks.mjs',
    'assets/models/berghain/layout.mjs','assets/models/berghain/model.mjs','assets/models/berghain/manifest.json',
    'assets/models/berghain/surface-data.mjs','assets/models/berghain/surface-materials.mjs',
    ...['baseColor','normal','roughness'].map(kind=>'assets/models/berghain/textures/fabric-'+kind+'.png'),
    'assets/models/berghain/berghain-study.glb','berghain/viewer.mjs','berghain/navigation.mjs','berghain/walkthrough.mjs']
    .map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[{id:'figure-turntable',modes:['quick','stress'],profiles:['desktop'],async run({page,baseURL,artifacts}){
    await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
    const model=await page.evaluate(async()=>{
      const T=await import('../assets/vendor/three/0.186.0/build/three.module.min.js');
      const {createClimberGeometries,climberMaterials,climberGeometryData}=await import('../assets/models/berghain/climber-geometry.mjs');
      const {configureSurfaceMaterial,loadSurfaceTextures}=await import('../assets/models/berghain/surface-materials.mjs');
      const canvas=document.createElement('canvas');canvas.id='figure-study';Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});document.querySelector('#viewport').append(canvas);
      const rect=canvas.getBoundingClientRect(),renderer=new T.WebGLRenderer({canvas,antialias:true});
      renderer.setPixelRatio(Math.min(2,Math.sqrt(1800000/(rect.width*rect.height))));renderer.setSize(rect.width,rect.height,false);
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
      const scene=new T.Scene();scene.background=new T.Color('#c4c3ba');
      scene.add(new T.HemisphereLight('#fff9e6','#706d62',2.5));
      const sun=new T.DirectionalLight('#fff5e5',3.0);sun.position.set(-2,6,4);scene.add(sun);
      const figure=new T.Group();let triangles=0;
      for(const [key,geometry]of Object.entries(createClimberGeometries())){
        const name=key.replace('climber-',''),material=new T.MeshStandardMaterial(climberMaterials[name]);configureSurfaceMaterial(material,name);
        figure.add(new T.Mesh(geometry,material));triangles+=(geometry.index?.count||geometry.attributes.position.count)/3;
      }
      await loadSurfaceTextures(figure,4);
      scene.add(figure);
      const floor=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshStandardMaterial({color:'#aaa99f',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
      const support=new T.Mesh(new T.BoxGeometry(1.2,1.13,2),new T.MeshStandardMaterial({color:'#333731',roughness:.55}));support.position.set(.25,.565,0);scene.add(support);
      const camera=new T.PerspectiveCamera(35,rect.width/rect.height,.03,30);
      const bounds=new T.Box3().setFromObject(figure);
      window.__renderFigure=position=>{camera.position.set(...position);camera.lookAt(.10,.87,.15);renderer.render(scene,camera);};
      window.__disposeFigure=()=>{
        const textures=new Set();scene.traverse(item=>{if(item.isMesh){item.geometry.dispose();for(const key of ['map','roughnessMap','normalMap'])if(item.material[key])textures.add(item.material[key]);item.material.dispose();}});for(const texture of textures)texture.dispose();renderer.dispose();canvas.remove();
        delete window.__renderFigure;delete window.__disposeFigure;
      };
      return {triangles,features:climberGeometryData().features,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
    });
    for(const [name,position]of [['reference',[-2.3,2.15,3.5]],['front',[2.7,2.1,2.6]],['side',[-3.7,1.9,.6]]]){
      await page.evaluate(p=>window.__renderFigure(p),position);await artifacts.screenshot(page,'figure-'+name+'.png');
    }
    assert.ok(model.bounds.max[1]>1.5&&model.bounds.max[1]<1.7);assert.ok(model.bounds.min[1]>=0);
    assert.ok(model.features.hairStrands>=100&&model.features.metalRings>=40);assert.ok(model.triangles<100000);
    await page.evaluate(()=>window.__disposeFigure());return {...model,evidence:'Original geometry diagnostic; studio furniture excluded; no installed-placement proof'};
  }},
  {id:'sculpture-at-counter',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    const failed=[];page.on('response',response=>{if(response.status()>=400)failed.push([response.status(),response.url()]);});
    await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#enter').click();await panorama(page);
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const artwork=layout.artworks.find(item=>item.id==='uddenberg-climber');
    const yaw=Math.atan2(before.x-artwork.anchor[0],before.z-artwork.anchor[2]);
    await dragLook(page,context,profile,-yaw/.004);const near=await forward(page,context,profile,1000);await lookDown(page,context,profile);
    assert.ok(canStand(near,layout));assert.ok(Math.hypot(near.x-before.x,near.z-before.z)>.5);
    await artifacts.screenshot(page,'climber-on-panorama-counter.png');
    const native=await renderNativeAsset(page,{position:near,yaw,pitch:-.24});assert.equal(native.artworks,layout.artworks.length);assert.equal(native.equipment,44);
    const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json',import.meta.url)));
    assert.equal(native.bytes,manifest.bytes);assert.equal(native.meshes,manifest.meshes);
    await artifacts.screenshot(page,'native-glb-climber.png');await disposeNativeAsset(page);
    assert.deepEqual(failed,[]);return {before,near,yaw,native,scope:'Room shortcut then real input; source/native appearance and legal counter approach, not a measured room reconstruction'};
  }},
  {id:'visitor-at-sculpture',modes:['stress'],async run({page,context,profile,baseURL,artifacts}){
    await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
    await panorama(page);
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const art=layout.artworks[0],yaw=Math.atan2(before.x-art.anchor[0],before.z-art.anchor[2]);
    await dragLook(page,context,profile,-yaw/.004);await forward(page,context,profile,2800);
    assert.equal(await page.locator('#model').getAttribute('data-avatar'),'true');
    const position=JSON.parse(await page.locator('#model').getAttribute('data-position'));assert.ok(canStand(position,layout));
    assert.ok(Number(await page.locator('#model').getAttribute('data-camera-distance'))>.65);
    await artifacts.screenshot(page,'human-and-uddenberg-figure.png');return {position,yaw,roomShortcut:true};
  }}]
};
