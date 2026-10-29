// GPU regression for the production city atlas path; uses the existing silent runner.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const files=['world3d.js','neighbor-sprites.js','sprite-depth.js','buergeramt-splat.js','atlas-character-mouth.js','street-character-mouth.js'];
export default {
  name:'sprite-depth',
  sourceFiles(root){return Object.fromEntries([...files.map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')]),['probe',createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex')]])},
  scenarios:[{
    id:'world-depth',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:60000,
    async run({page,baseURL,root,artifacts}){
      const source=readFileSync(resolve(root,'world3d.js'),'utf8');
      const start=source.indexOf('  function atlasSprite('),end=source.indexOf('\n  }',start);
      const production=name=>{const start=source.indexOf(`  function ${name}(`),end=source.indexOf('\n  }',start);if(start<0||end<start)throw Error(name);return source.slice(start,end+4)};
      await page.route('**/sprite-depth-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#252525}canvas{width:100vw;height:100vh;object-fit:contain}</style>'}));
      await page.goto(`${baseURL}/sprite-depth-fixture`);
      const report=await page.evaluate(async ({atlas,npcPaint,officePaint,officeProp,baseURL})=>{
        const T=await import(`${baseURL}/assets/vendor/three/0.186.0/build/three.module.min.js`);
        const {installSpriteDepth}=await import(`${baseURL}/sprite-depth.js`);
        const paint=document.createElement('canvas');paint.width=paint.height=32;
        const ctx=paint.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(8,2,16,28);
        const bridge={getNpcSpriteCanvas:()=>paint,npcSpriteGrids:{probe:{cols:1,rows:1,frameWidth:32,frameHeight:32,pivot:[16,30]}}};
        const atlasTextureCache=new Map(),atlasMaterialCache=new Map();
        const atlasSprite=eval(`(${atlas.trim()})`),sprite=atlasSprite('probe',2.4);
        const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);
        renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
        const scene=new T.Scene();scene.background=new T.Color(0x111111);scene.add(sprite);
        const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,50),wall=new T.Mesh(new T.BoxGeometry(4,4,.12),new T.MeshBasicMaterial({color:0x0000ff}));
        scene.add(wall);const checks=[],gl=renderer.getContext();
        const sample=(mesh,x,y)=>{const p=mesh.localToWorld(new T.Vector3(x,y,0)).project(camera),rgba=new Uint8Array(4);
          gl.readPixels(Math.round((p.x+1)*gl.drawingBufferWidth/2),Math.round((p.y+1)*gl.drawingBufferHeight/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);return [...rgba]};
        const red=rgba=>rgba[0]>200&&rgba[2]<30,blue=rgba=>rgba[2]>200&&rgba[0]<30;
        const check=(id,pass,pixel)=>checks.push({id,verdict:pass?'PASS':'FAIL',pixel});
        function pose(yaw,pitch,footZ=0,elevation=0){
          camera.position.set(Math.sin(yaw)*9,elevation+Math.sin(pitch)*10,Math.cos(yaw)*9);camera.lookAt(0,elevation+1,0);camera.updateMatrixWorld();
          sprite.quaternion.copy(camera.quaternion);const pivot=sprite.userData.plantedHeight;
          sprite.position.set(0,elevation,footZ).add(new T.Vector3(0,pivot,0).applyQuaternion(sprite.quaternion));
          sprite.updateMatrixWorld(true);wall.rotation.y=yaw;wall.position.set(-Math.sin(yaw)*.4,elevation+2,footZ-Math.cos(yaw)*.4);
        }
        for(const yaw of [0,.85,-.65])for(const pitch of [.35,.75]){
          pose(yaw,pitch);renderer.render(scene,camera);
          const pixel=sample(sprite,0,.7);check(`front-wall-${yaw}-${pitch}`,red(pixel),pixel);
        }
        pose(0,.6);wall.position.z=.4;renderer.render(scene,camera);
        let pixel=sample(sprite,0,.7);check('behind-opaque-wall',blue(pixel),pixel);
        wall.material.transparent=true;wall.material.opacity=.03;wall.material.depthWrite=false;wall.material.needsUpdate=true;
        renderer.render(scene,camera);pixel=sample(sprite,0,.7);check('behind-faded-wall',pixel[0]>180,pixel);
        wall.material.opacity=1;wall.material.transparent=false;wall.material.depthWrite=true;wall.material.needsUpdate=true;
        pose(0,.6);wall.position.z=-1;renderer.render(scene,camera);
        pixel=sample(sprite,-1,.3);check('transparent-margin-does-not-mask-wall',blue(pixel),pixel);
        wall.material.transparent=true;wall.material.needsUpdate=true;wall.renderOrder=1;renderer.render(scene,camera);
        pixel=sample(sprite,-1,.3);check('transparent-margin-does-not-mask-later-geometry',blue(pixel),pixel);
        pixel=sample(sprite,0,.7);check('opaque-paint-still-hides-later-geometry',red(pixel),pixel);
        wall.material.transparent=false;wall.material.needsUpdate=true;wall.renderOrder=0;
        wall.scale.set(1,.2,1);wall.position.set(0,.4,.4);renderer.render(scene,camera);
        pixel=sample(sprite,0,-.85);check('low-prop-covers-feet',blue(pixel),pixel);
        pixel=sample(sprite,0,.7);check('low-prop-leaves-head-visible',red(pixel),pixel);
        wall.scale.set(1,1,1);pose(.4,.65,0,3);renderer.render(scene,camera);
        pixel=sample(sprite,0,.7);check('elevated-ground-front-wall',red(pixel),pixel);
        const {createAtlasCharacterMouth}=await import(`${baseURL}/atlas-character-mouth.js`);
        const specialSprite=()=>null,registeredStreetPaint=()=>null,streetPaintManifest={},fitStreetFallback=()=>{};
        const npcSprite=eval(`(${npcPaint})`),talker=npcSprite({id:'depth-mouth',spriteKind:'probe',sandale:true});
        pose(0,.6);sprite.visible=false;talker.position.copy(sprite.position);talker.quaternion.copy(sprite.quaternion);scene.add(talker);
        renderer.render(scene,camera);pixel=sample(talker,0,.7);check('speech-private-material-keeps-foot-depth',red(pixel),pixel);
        talker.userData.atlasMouth.dispose();talker.geometry.dispose();scene.remove(talker);sprite.visible=true;
        // A second painted person crosses the first one's ground depth.
        wall.visible=false;const other=atlasSprite('probe',2.4);other.material=sprite.material.clone();other.material.color.set(0x00ff00);
        // The shared map is red, so use a green canvas texture for this actor.
        const green=paint.cloneNode();green.getContext('2d').drawImage(paint,0,0);green.getContext('2d').globalCompositeOperation='source-in';green.getContext('2d').fillStyle='#00ff00';green.getContext('2d').fillRect(0,0,32,32);
        other.material.map=new T.CanvasTexture(green);other.material.map.colorSpace=T.SRGBColorSpace;other.material.color.set(0xffffff);
        installSpriteDepth(T,other,[0,-other.userData.plantedHeight,0]);scene.add(other);
        pose(0,.6);other.quaternion.copy(sprite.quaternion);other.position.copy(sprite.position);other.position.z+=.35;
        renderer.render(scene,camera);pixel=sample(sprite,0,.4);check('near-person-covers-far-person',pixel[1]>180&&pixel[0]<30,pixel);
        other.position.z=sprite.position.z-.35;renderer.render(scene,camera);pixel=sample(sprite,0,.4);check('people-reverse-depth-after-crossing',red(pixel),pixel);
        scene.remove(other);wall.visible=true;wall.scale.set(1,1,1);pose(0,.6);renderer.render(scene,camera);
        const frontImage=renderer.domElement.toDataURL();
        wall.visible=false;const roof=new T.Mesh(new T.BoxGeometry(3,.16,2),new T.MeshBasicMaterial({color:0x0000ff}));roof.position.set(0,2.4,1);scene.add(roof);
        renderer.render(scene,camera);pixel=sample(sprite,0,.7);check('overhang-occludes-covered-head',blue(pixel),pixel);
        roof.position.z=-2;renderer.render(scene,camera);pixel=sample(sprite,0,.7);check('roof-behind-person-does-not-hide-head',red(pixel),pixel);scene.remove(roof);
        for(const z of [.001,.09,.11]){
          camera.position.set(0,10,z);camera.lookAt(0,0,0);camera.updateMatrixWorld();sprite.quaternion.copy(camera.quaternion);
          sprite.position.set(0,0,0).add(new T.Vector3(0,sprite.userData.plantedHeight,0).applyQuaternion(sprite.quaternion));
          renderer.render(scene,camera);pixel=sample(sprite,0,.4);check(`overhead-threshold-${z}`,red(pixel),pixel);
        }
        sprite.quaternion.identity();sprite.position.set(0,sprite.userData.plantedHeight,0);
        camera.position.set(0,sprite.userData.plantedHeight,.11);camera.lookAt(0,sprite.userData.plantedHeight,0);camera.updateMatrixWorld();
        renderer.render(scene,camera);pixel=sample(sprite,0,0);check('just-beyond-near-clip-is-visible',red(pixel),pixel);
        camera.position.z=.09;camera.updateMatrixWorld();renderer.render(scene,camera);
        const clipped=new Uint8Array(4);gl.readPixels(gl.drawingBufferWidth/2,gl.drawingBufferHeight/2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,clipped);
        check('inside-near-clip-is-hidden',!red(clipped),[...clipped]);
        // Actual production neighbor constructors, including their mouth hook.
        const {createNeighborSprite}=await import(`${baseURL}/neighbor-sprites.js`),host=new T.Group(),jobs=[];
        const solid=document.createElement('canvas');solid.width=solid.height=32;solid.getContext('2d').fillStyle='#ff0000';solid.getContext('2d').fillRect(0,0,32,32);
        const load=T.TextureLoader.prototype.load;T.TextureLoader.prototype.load=function(_url,done){const tx=new T.CanvasTexture(solid);done(tx);return tx};
        sprite.visible=false;scene.add(host);pose(0,.6);wall.position.z=-.3;wall.visible=true;
        const neighbor=createNeighborSprite(T,{id:'heiko',jwdRole:'parent',x:0,y:0},host,(_position,_radius,job)=>jobs.push(job),camera);
        try{
          await jobs[0]();neighbor.sync(0,{started:false},null,false);renderer.render(scene,camera);
          pixel=sample(host.children[0],0,.5);check('standing-neighbor-in-front-of-wall',red(pixel),pixel);
          await jobs[1]();neighbor.sync(.1,{started:false},null,false);renderer.render(scene,camera);
          pixel=sample(host.children[1],0,.5);check('animated-neighbor-in-front-of-wall',red(pixel),pixel);
          check('standing-paint-retires-on-handover',!host.children[0].visible&&host.children[1].visible);
        }finally{T.TextureLoader.prototype.load=load;neighbor.dispose();scene.remove(host)}
        // Exercise the office's real late-person pass against painted props.
        const amtScene=new T.Scene(),amtPaintedProps=[];
        const amtPaintMaterial=eval(`(${officePaint})`),amtPaintedProp=eval(`(${officeProp})`);
        const propAtlas=document.createElement('canvas');propAtlas.width=128;propAtlas.height=32;propAtlas.getContext('2d').drawImage(paint,0,0);
        amtPaintedProp(0,2,2,0,1,.3);const prop=amtPaintedProps[0];prop.visible=true;prop.material.map=new T.CanvasTexture(propAtlas);prop.material.map.colorSpace=T.SRGBColorSpace;
        const person=new T.Mesh(new T.PlaneGeometry(2,2),amtPaintMaterial(2));person.position.set(0,1,0);person.material.map=new T.CanvasTexture(green);person.material.map.colorSpace=T.SRGBColorSpace;
        person.layers.set(1);person.renderOrder=200;amtScene.add(person);camera.position.set(0,1,5);camera.lookAt(0,1,0);camera.updateMatrixWorld();
        function officeRender(){camera.layers.set(0);renderer.render(amtScene,camera);renderer.autoClear=false;camera.layers.set(1);renderer.render(amtScene,camera);renderer.autoClear=true;camera.layers.set(0)}
        officeRender();pixel=sample(person,0,0);check('office-prop-occludes-late-person-pass',red(pixel),pixel);
        prop.position.z=-.3;officeRender();pixel=sample(person,0,0);check('office-person-in-front-of-painted-prop',pixel[1]>180&&pixel[0]<30,pixel);
        prop.position.z=.3;person.position.x=-.85;officeRender();pixel=sample(person,0,0);check('office-transparent-prop-margin-has-no-depth-mask',pixel[1]>180&&pixel[0]<30,pixel);
        check('office-person-writes-depth',person.material.depthTest&&person.material.depthWrite);
        const resources={...renderer.info.memory},calls=renderer.info.render.calls;
        renderer.dispose();return {checks,frontImage,resources,calls,aspect:camera.aspect,viewport:[innerWidth,innerHeight]};
      },{atlas:source.slice(start,end+4),npcPaint:production('npcSprite'),officePaint:production('amtPaintMaterial'),officeProp:production('amtPaintedProp'),baseURL});
      const {frontImage,...details}=report;
      await page.evaluate(image=>{document.querySelector('canvas').remove();const img=new Image();img.src=image;img.style='width:100vw;height:100vh;object-fit:contain';document.body.append(img)},frontImage);
      await artifacts.screenshot(page,'depth.png');artifacts.json('depth.json',details);
      const failed=details.checks.filter(check=>check.verdict==='FAIL');
      if(failed.length)throw Error(`Sprite depth: ${failed.map(check=>check.id).join(', ')}`);
      return details;
    }
  },{
    id:'spark-body-depth',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:90000,
    async run({page,baseURL,root,artifacts}){
      const source=readFileSync(resolve(root,'world3d.js'),'utf8'),start=source.indexOf('  function amtPaintMaterial('),end=source.indexOf('\n  }',start);
      await page.route('**/spark-depth-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><script type="importmap">{"imports":{"three":"/assets/vendor/three/0.186.0/build/three.module.min.js","three/addons/":"/assets/vendor/three/0.186.0/examples/jsm/"}}</script><style>body{margin:0;background:#111}canvas{width:100vw;height:100vh;object-fit:contain}</style>'}));
      await page.goto(`${baseURL}/spark-depth-fixture`);
      const report=await page.evaluate(async ({baseURL,paintSource})=>{
        const T=await import(`${baseURL}/assets/vendor/three/0.186.0/build/three.module.min.js`);
        const {createAmtSplatOwner,createOmenSplat}=await import(`${baseURL}/buergeramt-splat.js`);
        const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true}),scale=Math.min(1,512/Math.max(innerWidth,innerHeight));
        renderer.setSize(Math.round(innerWidth*scale),Math.round(innerHeight*scale));renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
        const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,30);scene.background=new T.Color(0x111111);
        camera.position.set(0,1.2,4);camera.lookAt(0,1.1,0);camera.updateMatrixWorld();
        const controller=new AbortController(),owner=await createAmtSplatOwner({THREE:T,renderer,scene}),actor=new T.Object3D();actor.renderOrder=200;
        const body=await createOmenSplat({THREE:T,renderer,scene,signal:controller.signal,owner});
        const omen={phase:'approach',strength:0,life:{opacity:1,depth:1,time:0,pressure:0,pulse:0,motion:0}},checks=[];
        body.update(omen,actor,camera,true);await owner.update(camera,60);renderer.render(scene,camera);
        await new Promise(done=>requestAnimationFrame(done));await owner.update(camera,60);renderer.render(scene,camera);
        const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,all=new Uint8Array(w*h*4);
        gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,all);
        // Select a well-covered pixel on the actual painted body, not Spark's
        // scene origin or its camera-local tunnel. The source cloud is unmodified.
        let best=-1,px=0,py=0;
        for(let y=Math.floor(h*.32);y<h*.65;y++)for(let x=Math.floor(w*.42);x<w*.58;x++){
          const i=(y*w+x)*4,score=all[i]+all[i+1]+all[i+2];if(score>best){best=score;px=x;py=y}
        }
        const sample=()=>{const p=new Uint8Array(4);gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p]};
        const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
        const check=(id,pass,pixel)=>checks.push({id,verdict:pass?'PASS':'FAIL',pixel});
        const bare=sample(),status=owner.inspect();check('actual-body-cloud-is-rendered',best>150&&status.activeSplats>0&&status.completedUpdates>0,bare);
        const wall=new T.Mesh(new T.PlaneGeometry(4,4),new T.MeshBasicMaterial({color:0x0000ff}));wall.position.set(0,1,.7);scene.add(wall);renderer.render(scene,camera);
        const hidden=sample();check('opaque-wall-hides-actual-spark-body',hidden[2]>200&&hidden[0]<30,hidden);
        wall.material.transparent=true;wall.material.opacity=.03;wall.material.depthWrite=false;wall.material.needsUpdate=true;renderer.render(scene,camera);
        const faded=sample();check('faded-wall-reveals-actual-spark-body',distance(faded,bare)<65&&distance(faded,hidden)>80,faded);scene.remove(wall);
        const amtPaintMaterial=eval(`(${paintSource})`),person=new T.Mesh(new T.PlaneGeometry(3,3),amtPaintMaterial(3));person.material.color.set(0x00ff00);person.renderOrder=200;person.position.set(0,1.2,.6);scene.add(person);
        await owner.update(camera,0);renderer.render(scene,camera);const near=sample();check('native-near-person-occludes-actual-spark-body',near[1]>180&&near[0]<40&&near[2]<40,near);
        person.position.z=-.6;await owner.update(camera,0);renderer.render(scene,camera);const far=sample();check('actual-spark-body-covers-native-far-person',distance(far,bare)<65&&distance(far,near)>80,far);
        body.dispose();await owner.dispose();controller.abort();const disposed=owner.inspect();check('spark-owner-disposes-synchronously-visible-state',disposed.disposed&&!disposed.visible&&disposed.meshes===0);
        renderer.dispose();return {checks,status,sample:[px,py],bodyBytes:body.inspect().bytes,viewport:[innerWidth,innerHeight]};
      },{baseURL,paintSource:source.slice(start,end+4)});
      artifacts.json('spark-depth.json',report);await artifacts.screenshot(page,'spark-depth.png');
      const failed=report.checks.filter(check=>check.verdict==='FAIL');if(failed.length)throw Error(`Spark depth: ${failed.map(check=>check.id).join(', ')}`);
      return report;
    }
  }]
};
