import * as THREE from '../../assets/vendor/three/0.186.0/build/three.module.min.js';
import {CARS,CAST,BOUNDS,STATIONS} from './content.mjs';
import {emitHouse,emitBureaucraticLandmarks,emitServiceStation} from './building-kit.mjs';
import {carMeasurePoint} from './state.mjs';

export function createWorld(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xc8c6b0);scene.fog=new THREE.Fog(0xc8c6b0,48,150);
  const camera=new THREE.PerspectiveCamera(68,1,.07,220);camera.rotation.order='YXZ';
  scene.add(new THREE.HemisphereLight(0xf1e7ce,0x4e6253,2.5));
  const sun=new THREE.DirectionalLight(0xffddb0,3.1);sun.position.set(-35,70,25);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:180});sun.shadow.mapSize.set(1536,1536);sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;scene.add(sun);
  const solids=[],labels=[],actors={},resources=[],batches=new Map();
  const dummy=new THREE.Object3D();
  const shapes={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,8),ball:new THREE.IcosahedronGeometry(.5,1),cone:new THREE.ConeGeometry(.707,1,4)};
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;const gc=grainCanvas.getContext('2d');
  gc.fillStyle='#f7f5ee';gc.fillRect(0,0,128,128);for(let i=0;i<1600;i++){const v=205+Math.floor(Math.random()*46);gc.fillStyle=`rgba(${v},${v},${v},.22)`;gc.fillRect(Math.random()*128,Math.random()*128,1+Math.random()*5,1+Math.random()*2);}
  const grain=new THREE.CanvasTexture(grainCanvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(4,4);grain.colorSpace=THREE.SRGBColorSpace;resources.push(grain);
  const material=new THREE.MeshStandardMaterial({roughness:.94,metalness:0,map:grain});
  function shape(type,x,y,z,w,h,d,color,rx=0,ry=0,rz=0){
    if(!batches.has(type))batches.set(type,[]);
    dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();
    batches.get(type).push({matrix:dummy.matrix.clone(),color:new THREE.Color(color)});
  }
  const box=(x,y,z,w,h,d,c,ry=0)=>shape('box',x,y,z,w,h,d,c,0,ry);
  const solid=(x,z,w,d,kind)=>solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,kind});
  function pole(x,z,h=3){shape('cylinder',x,h/2,z,.08,h,.08,0x424b48);solid(x,z,.16,.16,'pole');}
  function sign(x,z,title,sub,rotation=0,width=3.5){
    const c=document.createElement('canvas');c.width=768;c.height=256;const ctx=c.getContext('2d');
    ctx.fillStyle='#e6d6a5';ctx.fillRect(0,0,768,256);ctx.strokeStyle='#353d32';ctx.lineWidth=14;ctx.strokeRect(8,8,752,240);
    ctx.fillStyle='#27352c';ctx.textAlign='center';ctx.font='bold 42px "Roboto Condensed", Arial';ctx.fillText(title,384,103,704);
    ctx.font='26px "Roboto Condensed", Arial';ctx.fillText(sub,384,171,700);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});
    const p=new THREE.Mesh(new THREE.PlaneGeometry(width,width/3),m);p.position.set(x,2.45,z);p.rotation.y=rotation;scene.add(p);labels.push(p);resources.push(t,p.geometry,m);
    if(2.45-width/6<1.95)solid(x,z,Math.abs(Math.cos(rotation))*width+Math.abs(Math.sin(rotation))*.04,Math.abs(Math.sin(rotation))*width+Math.abs(Math.cos(rotation))*.04,'sign-panel');
    pole(x,z,2.1);return p;
  }
  box(0,-.16,0,155,.3,145,0x697c53);
  // Three parallel streets, connected by two end streets. Sidewalks form a continuous loop.
  for(const x of [-42,0,42]){
    box(x,-.015,0,8,.07,94,0x5e615c);
    for(const s of [-1,1]){box(x+s*5.5,.07,0,3,.14,97,0xb2ac98);box(x+s*4.03,.10,0,.16,.2,97,0xe0d4b8);}
    for(let z=-44;z<=44;z+=7)box(x,.027,z,.09,.012,2.6,0xc8c2ac);
    // Paver seams are batched geometry, not a large texture.
    for(let z=-46;z<48;z+=1.6)for(const s of [-1,1])box(x+s*5.5,.145,z,2.84,.008,.025,0x929381);
  }
  for(const z of [-47,47]){
    box(0,-.012,z,94,.08,8,0x5e615c);
    for(const s of [-1,1]){box(0,.07,z+s*5.5,98,.14,3,0xb2ac98);box(0,.1,z+s*4.03,98,.2,.16,0xe0d4b8);}
    for(let x=-40;x<=40;x+=7)box(x,.03,z,2.6,.01,.09,0xc8c2ac);
    for(const x of [-42,0,42])for(let zz=-2.8;zz<=3;zz+=1.1)box(x,.035,z+zz,5,.012,.55,0xd8d6bf);
  }
  // Club court: the social centre and return landmark, intentionally open to the road.
  box(-18,.09,35,24,.18,20,0xb5a891);
  box(-22,2.2,44,17,4.4,8,0xd0ba92);solid(-22,43.88,17,8.24,'clubhouse');
  shape('cone',-22,5.1,44,18,2.3,9,0x714e3c,0,Math.PI/4);
  box(-22,1.35,39.94,1.7,2.7,.13,0x3e594d);
  for(const x of [-28,-25.5,-18,-15.5]){box(x,2,39.9,1.45,1.6,.15,0x3d5356);box(x,2,39.8,.07,1.65,.07,0xe3ddbf);box(x,2,39.8,1.5,.07,.07,0xe3ddbf);}
  sign(-21,39.7,'VEREINSHEIM','Verein zur Wahrung des rechten Winkels',0,8);
  sign(-7,51,'KLEIN-KORINTHEN','Hier kennt jeder Ihre Angelegenheiten.',0,4.4);
  // Authored plots with wide street access; each facade faces its adjacent road.
  const kit={box,shape,solid,pole,sign};
  const house=(x,z,index)=>emitHouse(kit,{x,z,index,face:x<0?1:-1,outer:Math.abs(x)>40});
  let hi=0;
  for(const x of [-56,-22,22,56])for(const z of [-28,-8,12])house(x,z,hi++);
  house(22,34,hi++);house(-56,34,hi++);
  // Ronny's garage at the northern corner.
  box(25,1.8,-38,11,3.6,7,0x9f9d87);solid(25,-38,11,7,'garage');box(25,3.75,-38,11.6,.35,7.6,0x4e5550);
  box(30.54,1.6,-38,.12,2.9,4.8,0x577274);
  solid(30.54,-38,.12,4.8,'garage-door');
  // Keep Ronny outside the actual garage collision body.
  sign(30.7,-34.1,'RONNYS WERKSTATT','Das war vorher schon so.',Math.PI/2,4);
  for(let i=0;i<3;i++)shape('cylinder',32,.23+i*.33,-40.5,1,.33,1,0x292f2c);
  solid(32,-40.5,1,1,'tyres');
  sign(-31,-32,'GARTENORDNUNG','Wildwuchs nur nach Anmeldung.',0,3.2);
  sign(8,-33,'RUHEZEIT','13–15 Uhr. Auch innerlich.',0,2.8);
  sign(8,34,'AM GUTEN GRUND','Privatweg für öffentliche Meinungen.',0,3.5);
  // Streetscape: mature autumn trees, benches, lamps and garden details.
  function tree(x,z,i){
    shape('cylinder',x,2.1,z,.38,4.2,.38,0x6e6250);solid(x,z,.5,.5,'tree');
    shape('ball',x,4.6,z,4.7,5.1,4.5,[0xa48b46,0x888b46,0xb08048,0x657b4c][i%4]);
    shape('ball',x+.8,5.6,z-.3,3.5,3,3.4,[0xb99c4f,0xb69b58,0xc09a57][i%3]);
    // Stylised dappled ground patches, faded into the autumn grass.
    shape('cylinder',x,.015,z,5,.02,4.6,0x68724c);
  }
  for(let i=0;i<28;i++){const x=i<14?-64:64,z=-59+(i%14)*8.8;tree(x,z,i);}
  [[-9,-35],[-9,10],[9,-7],[9,23],[33,9],[-33,5],[-32,26],[35,33],[-12,30],[21,56],[-21,-57],[45,-58]].forEach(([x,z],i)=>tree(x,z,i));
  for(const x of [-7,7,35,-35,49,-49])for(const z of [-27,5,30]){
    pole(x,z,4.2);box(x,4.12,z,.65,.13,.65,0x303d35);box(x,3.95,z,.4,.3,.4,0xe1d4a0);
  }
  function bench(x,z){box(x,.55,z,2.3,.14,.6,0x866f4c);box(x,.95,z-.3,2.3,.7,.12,0x866f4c);for(const s of [-1,1])box(x+s*.85,.28,z,.09,.55,.5,0x384b40);solid(x,z,2.3,.8,'bench');}
  bench(-16,28);bench(16,55);bench(-27,-54);
  // Bus stop: timetable and shelter; an absent bus is environmental storytelling.
  box(10,1.4,55,.12,2.8,3,0x4c6259);solid(10,55,.12,3,'shelter');box(12,2.9,55,4.3,.18,3.2,0x647066);pole(14,54,2.8);pole(14,56,2.8);
  sign(16,51,'H · BERLIN','Nächster Bus: nach der Gebietsreform.',0,3.6);
  for(let i=0;i<7;i++){const x=-29+i*1.35;box(x,.35,-39,.9,.7,3,0x686346);solid(x,-39,.9,3,'planter');box(x,.74,-39,.78,.1,2.8,0x594d36);for(let k=0;k<3;k++)shape('ball',x,.9,-40+k,.5,.4,.5,0x729052);}
  emitBureaucraticLandmarks(kit);
  Object.values(STATIONS).forEach(station=>emitServiceStation(kit,station));
  // Cars use actual authored width, length and curb gap. No visual-only measurement value.
  for(const car of CARS){
    const {x,z,width:w,length:l,color}=car,h=car.kind==='van'?1.85:car.kind==='suv'?1.65:1.35;
    box(x,.53,z,w,.65,l,color);box(x,h-.42,z-.12,w*.87,h-.7,l*.52,color);
    box(x,h-.38,z+l*.265,w*.76,.53,.04,0x34474b);box(x,h-.38,z-l*.275,w*.76,.53,.04,0x34474b);
    for(const side of [-1,1]){
      box(x+side*w*.438,h-.37,z-.12,.04,.5,l*.43,0x465b5b);
      box(x+side*w*.445,h-.36,z-.12,.045,.53,.06,0x3b423c);
      for(const zz of [-l*.31,l*.31]){shape('cylinder',x+side*(w/2-.095),.32,z+zz,.61,.19,.61,0x252b28,0,0,Math.PI/2);shape('cylinder',x+side*(w/2+.002),.32,z+zz,.28,.014,.28,0x989a8c,0,0,Math.PI/2);}
      box(x+side*w*.29,.64,z+l/2+.012,.4,.21,.04,0xe7d5a4);box(x+side*w*.29,.66,z-l/2-.012,.3,.16,.04,0x9d4537);
    }
    box(x,.38,z+l/2+.025,w*.8,.13,.12,0x697168);box(x,.47,z+l/2+.095,.55,.12,.025,0xdad6bd);
    solid(x,z,w+.04,l+.2,'car:'+car.id);
  }
  // Flush the static scene into a handful of instanced draw calls.
  for(const [type,entries]of batches){const mesh=new THREE.InstancedMesh(shapes[type],material,entries.length);entries.forEach((e,i)=>{mesh.setMatrixAt(i,e.matrix);mesh.setColorAt(i,e.color)});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);resources.push(mesh);}
  let resolveArt;const ready=new Promise(resolve=>{resolveArt=resolve});
  const characterTexture=new THREE.TextureLoader().load(new URL('../../assets/klein-korinthen/cast.webp',import.meta.url).href,()=>{document.documentElement.dataset.characterArt='ready';resolveArt()},undefined,()=>{
    document.documentElement.dataset.characterArt='fallback';
    for(const a of Object.values(actors)){
      a.mesh.visible=false;const m=new THREE.MeshStandardMaterial({color:0x566a51});
      const body=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.55,4,8),m);body.position.y=1.1;a.group.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),new THREE.MeshStandardMaterial({color:0xc4a586}));head.position.y=1.74;a.group.add(head);
      for(const x of [-.12,.12]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.65,6),m);leg.position.set(x,.325,0);a.group.add(leg);resources.push(leg.geometry)}
      resources.push(m,body.geometry,head.geometry,head.material);
    }
    resolveArt();
  });
  characterTexture.colorSpace=THREE.SRGBColorSpace;characterTexture.generateMipmaps=false;characterTexture.minFilter=THREE.LinearFilter;
  const mouths=[[.603,.860,.046,.010],[.535,.811,.046,.011],[.481,.866,.050,.012],[.551,.833,.045,.010]];
  for(const [id,actor]of Object.entries(CAST)){
    const support=actor.x>=-30&&actor.x<=-6&&actor.z>=25&&actor.z<=45?.18:-.01;
    const group=new THREE.Group();group.position.set(actor.x,support,actor.z);scene.add(group);
    const geo=new THREE.PlaneGeometry(.82,1.92,12,24);geo.translate(0,.96,0);
    const mat=new THREE.MeshBasicMaterial({map:characterTexture,transparent:true,alphaTest:.18,side:THREE.DoubleSide,depthWrite:true});
    const uniforms={phase:{value:0},speech:{value:0},mouth:{value:new THREE.Vector4(...mouths[actor.column])},column:{value:actor.column}};
    mat.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniforms);
      shader.vertexShader='uniform float phase; uniform float speech;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat upper=smoothstep(0.35,1.5,position.y); transformed.x += sin(phase)*0.008*upper; transformed.y += sin(phase*0.83)*0.004*upper;');
      shader.fragmentShader='uniform float speech; uniform vec4 mouth; uniform float column;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec2 actorUv=vMapUv;
        vec2 delta=(actorUv-mouth.xy)/mouth.zw;
        float influence=exp(-dot(delta,delta)*1.6);
        actorUv.y += speech*0.0025*influence*sign(delta.y);
        vec4 sampledDiffuseColor=texture2D(map,vec2((actorUv.x+column)/4.0,actorUv.y));
        diffuseColor *= sampledDiffuseColor;`);
    };
    mat.customProgramCacheKey=()=> 'klein-korinthen-paint-v1';
    const mesh=new THREE.Mesh(geo,mat);
    // Alpha-tested sole registration for each column of the original 1024px atlas.
    mesh.position.y=-[.073125,.07125,.06375,.076875][actor.column];group.add(mesh);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.31,20),new THREE.MeshBasicMaterial({color:0x23372a,transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;group.add(shadow);resources.push(shadow.geometry,shadow.material);
    // A small ground ring communicates interaction without replacing normal depth.
    const ring=new THREE.Mesh(new THREE.RingGeometry(.33,.38,24),new THREE.MeshBasicMaterial({color:0xf5d187,transparent:true,opacity:.7,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.01;group.add(ring);
    solid(actor.x,actor.z,.55,.55,'person:'+id);actors[id]={group,mesh,uniforms,ring};resources.push(geo,mat,ring.geometry,ring.material);
  }
  // Grounded yellow ruler: visible in the world while measuring, true length equals the gap.
  const tape=new THREE.Group();scene.add(tape);tape.visible=false;
  const strip=new THREE.Mesh(new THREE.BoxGeometry(1,.025,.065),new THREE.MeshBasicMaterial({color:0xffdc67}));tape.add(strip);
  const tips=[-1,1].map(()=>new THREE.Mesh(new THREE.BoxGeometry(.025,.14,.11),new THREE.MeshBasicMaterial({color:0x344c43})));tips.forEach(t=>tape.add(t));
  function measure(car,progress){
    tape.visible=!!car;if(!car)return;
    const gap=car.gap/100,curb=car.road+car.side*4,len=Math.max(.012,gap*progress);
    tape.position.set(curb-car.side*len/2,.20,car.z);strip.scale.x=len;tips[0].position.x=-len/2;tips[1].position.x=len/2;
  }
  function update(player,time,speaker,speech,reduced=false){
    camera.position.set(player.x,1.68,player.z);camera.rotation.set(player.pitch,player.yaw,0);
    for(const [id,a]of Object.entries(actors)){
      a.group.rotation.y=Math.atan2(camera.position.x-a.group.position.x,camera.position.z-a.group.position.z);
      a.uniforms.phase.value=reduced?0:time*.9+CAST[id].column;
      a.uniforms.speech.value=id===speaker?speech:0;
      a.ring.material.opacity=id===speaker?.9:.3;
    }
    renderer.render(scene,camera);
  }
  function resize(){const {width,height}=canvas.getBoundingClientRect();if(width<=0||height<=0)return;renderer.setPixelRatio(Math.min(devicePixelRatio,1,Math.sqrt(1600000/(width*height))));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
  function project(x,z){const v=new THREE.Vector3(x,1,z).project(camera);return{x:(v.x+.999)/2*canvas.clientWidth,y:(1-v.y)/2*canvas.clientHeight,visible:v.z<1&&v.z>0};}
  function dispose(){renderer.dispose();characterTexture.dispose();Object.values(shapes).forEach(g=>g.dispose());material.dispose();resources.forEach(r=>r.dispose?.());for(const m of [strip,...tips]){m.geometry.dispose();m.material.dispose();}}
  resize();return{ready,renderer,scene,camera,solids,actors,update,resize,measure,project,dispose,bounds:BOUNDS,measurePoints:CARS.map(car=>({id:car.id,...carMeasurePoint(car)}))};
}
