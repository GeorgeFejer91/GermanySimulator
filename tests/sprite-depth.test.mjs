import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {installSpriteDepth} from '../sprite-depth.js';
import {createNeighborSprite} from '../neighbor-sprites.js';
import {createAtlasCharacterMouth} from '../atlas-character-mouth.js';

test('procedural fallback depth stays at the simulation sole through pitch and adult refitting',()=>{
  const source=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
  const production=name=>{const start=source.indexOf(`  function ${name}(`),end=source.indexOf('\n  }',start);return source.slice(start,end+4)};
  const material=new T.MeshBasicMaterial({transparent:true,alphaTest:.08});
  const character=new Function('T','personFallbackMaterial','installSpriteDepth',`return (${production('character')})`)(T,()=>material,installSpriteDepth);
  const fit=new Function('T','personFallbackMaterial','installSpriteDepth',`return (${production('fitStreetFallback')})`)(T,()=>material,installSpriteDepth);
  const root=character('npc'),paint=root.userData.personFallback,camera=new T.PerspectiveCamera();
  root.position.set(3,2,4);root.rotation.y=.7;
  const update=new Function('T','camera','forEachStreetBody','cityAssetSlots','buildingSlots','jwdScenery','trainSlots','renderFrustum','renderViewMatrix','trainRenderSphere',`return (${production('updateGroupVisibility')})`)(T,camera,visit=>visit({},root),[],[],[],[],new T.Frustum(),new T.Matrix4(),new T.Sphere());
  for(const adult of [false,true]){
    if(adult)fit(root,{figureWorldHeight:2.33});
    for(const yaw of [0,.85,-1.2]){
      camera.position.set(Math.sin(yaw)*9,11,Math.cos(yaw)*9);camera.lookAt(0,1,0);update();root.updateMatrixWorld(true);
      assert(paint.geometry.attributes.spriteDepthFoot,'every owned replacement geometry has a depth anchor');
      const foot=paint.localToWorld(new T.Vector3().fromBufferAttribute(paint.geometry.attributes.spriteDepthFoot,0));
      assert(foot.distanceTo(root.position)<1e-6,'depth is attached to the simulation root at its current elevation');
    }
  }
});

test('native atlas mouth material cloning preserves the production foot-depth shader',()=>{
  const source=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
  const start=source.indexOf('  function npcSprite('),end=source.indexOf('\n  }',start);
  const mesh=new T.Mesh(new T.PlaneGeometry(1,2.4),new T.MeshBasicMaterial({transparent:true,alphaTest:.08}));
  mesh.userData.plantedHeight=1.2;installSpriteDepth(T,mesh,[0,-1.2,0]);
  const shared=mesh.material;
  const create=new Function('T','specialSprite','atlasSprite','createAtlasCharacterMouth','installSpriteDepth','registeredStreetPaint','streetPaintManifest','fitStreetFallback',`return (${source.slice(start,end+4)})`)(T,()=>null,()=>mesh,createAtlasCharacterMouth,installSpriteDepth,()=>null,{},()=>{});
  create({id:'depth-mouth',spriteKind:'towelMan',sandale:true});
  assert.notEqual(mesh.material,shared,'mouth ownership uses a private material');
  const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
  mesh.material.onBeforeCompile(shader);
  assert(shader.fragmentShader.includes('spriteDenominator'),'private speech material keeps world foot depth');
  assert(shader.fragmentShader.includes('streetSpeaking')&&shader.uniforms.streetSpeaking,'native speech uniform ownership remains composed');
  mesh.userData.atlasMouth.dispose();
});

test('legacy atlas depth follows simulation feet at tilted camera angles and platform elevations',()=>{
  const source=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
  const production=name=>{const start=source.indexOf(`  function ${name}(`),end=source.indexOf('\n  }',start);return source.slice(start,end+4)};
  const bridge={getNpcSpriteCanvas:()=>({width:32,height:32}),npcSpriteGrids:{legacy:{cols:1,rows:1,frameWidth:32,frameHeight:32}},stationElevation:()=>3};
  const atlas=new Function('T','bridge','atlasTextureCache','atlasMaterialCache','installSpriteDepth',`return (${production('atlasSprite')})`)(T,bridge,new Map(),new Map(),installSpriteDepth);
  const camera=new T.PerspectiveCamera(),mesh=atlas('legacy',2.4);
  const sync=new Function('bridge','camera','X','Z','atlasDepthFoot','projectBillboardFeet',`return (${production('syncAtlasSprite')})`)(bridge,camera,x=>x,z=>z,new T.Vector3(),()=>{});
  for(const yaw of [0,.85,-1.2]){
    camera.position.set(Math.sin(yaw)*9,10,Math.cos(yaw)*9);camera.lookAt(0,3,0);camera.updateMatrixWorld();
    sync(mesh,{x:2,y:1},1.2);
    const anchor=mesh.localToWorld(new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.spriteDepthFoot,0));
    assert(anchor.distanceTo(new T.Vector3(2,3,1))<1e-6,'world depth is attached to ground, not the tilted quad bottom');
  }
});

test('shared material uses per-geometry soles and composes existing paint shaders exactly once',()=>{
  const material=new T.MeshBasicMaterial({transparent:true,alphaTest:.08});
  let calls=0;material.onBeforeCompile=shader=>{calls++;shader.fragmentShader='// mouth paint\n'+shader.fragmentShader};
  material.customProgramCacheKey=()=> 'mouth-v1';
  const a=new T.Mesh(new T.PlaneGeometry(1,2),material),b=new T.Mesh(new T.PlaneGeometry(1,3),material);
  installSpriteDepth(T,a,[0,-.9,0]);installSpriteDepth(T,b,[0,-1.4,0]);
  assert.equal(a.geometry.attributes.spriteDepthFoot.getY(0),Math.fround(-.9));
  assert.equal(b.geometry.attributes.spriteDepthFoot.getY(0),Math.fround(-1.4));
  const shader={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
  material.onBeforeCompile(shader);assert.equal(calls,1);assert(shader.fragmentShader.includes('// mouth paint'));
  assert.equal(shader.vertexShader.match(/attribute vec3 spriteDepthFoot/g).length,1);
  assert(material.customProgramCacheKey().startsWith('mouth-v1:'));
  assert(material.depthWrite&&material.depthTest);assert.equal(material.alphaTest,.08);
  assert.equal(material.transparent,true);assert.equal(a.renderOrder,0);assert.equal(a.layers.mask,1);
});

test('cloned materials receive their own shader even when userData copies the policy marker',()=>{
  const a=new T.Mesh(new T.PlaneGeometry(1,2),new T.MeshBasicMaterial());installSpriteDepth(T,a,[0,-1,0]);
  const b=new T.Mesh(new T.PlaneGeometry(1,2),a.material.clone());installSpriteDepth(T,b,[0,-1,0]);
  const shader={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
  b.material.onBeforeCompile(shader);assert(shader.fragmentShader.includes('spriteDenominator'));
});

test('policy leaves actual geometry, UVs and camera silhouette untouched',()=>{
  const mesh=new T.Mesh(new T.PlaneGeometry(1.5,2.4,1,32),new T.MeshBasicMaterial());
  const positions=Float32Array.from(mesh.geometry.attributes.position.array),uvs=Float32Array.from(mesh.geometry.attributes.uv.array);
  installSpriteDepth(T,mesh,[0,-1.1,0]);
  assert.deepEqual(mesh.geometry.attributes.position.array,positions);assert.deepEqual(mesh.geometry.attributes.uv.array,uvs);
  assert.equal(mesh.geometry.attributes.spriteDepthFoot.count,mesh.geometry.attributes.position.count);
});

test('standing and animated neighbors share depth policy with their mouth customization intact',async()=>{
  const original=T.TextureLoader.prototype.load;
  T.TextureLoader.prototype.load=function(url,done){const texture=new T.Texture();done(texture);return texture};
  const previousDocument=globalThis.document;globalThis.document={hidden:false};globalThis.innerWidth=1280;
  try{
    const host=new T.Group(),camera=new T.PerspectiveCamera(),jobs=[],actor={id:'heiko',jwdRole:'parent',x:0,y:0};
    camera.position.set(0,6,8);camera.lookAt(0,1,0);camera.updateMatrixWorld();
    const owner=createNeighborSprite(T,actor,host,(_position,_radius,job)=>jobs.push(job),camera);
    await jobs[0]();owner.sync(0,{started:true},null,false);
    assert.equal(host.children[0].userData.spriteDepth,'upright-foot-plane');assert(host.children[0].visible);
    await jobs[1]();owner.sync(.1,{started:true},null,false);
    const paint=host.children[1];assert.equal(paint.userData.spriteDepth,'upright-foot-plane');
    const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
    paint.material.onBeforeCompile(shader);assert(shader.fragmentShader.includes('neighborMouth'));
    assert(shader.fragmentShader.includes('spriteDenominator'));assert.equal(paint.layers.mask,1);
    const foot=new T.Vector3().fromBufferAttribute(paint.geometry.attributes.spriteDepthFoot,0);paint.localToWorld(foot);
    assert(foot.length()<1e-6,'registered sole stays at the host ground anchor');
    owner.dispose();assert.equal(host.children.length,0);
  }finally{T.TextureLoader.prototype.load=original;globalThis.document=previousDocument}
});
