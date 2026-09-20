const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
const GLTF_LOADER_URL="https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js";
(async()=>{
  const app=document.getElementById("app");if(!app)return;
  const canvas=document.createElement("canvas");canvas.id="world3d";Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"3",pointerEvents:"none",background:"#77756f"});app.prepend(canvas);
  let T;try{T=await import(THREE_URL)}catch(e){canvas.remove();console.warn("3D fallback",e);return}
  let GLTFLoader=null;try{({GLTFLoader}=await import(GLTF_LOADER_URL))}catch(e){console.warn("GLB buildings unavailable; procedural buildings remain active",e)}
  const bridge=await new Promise(resolve=>{let n=0;const f=()=>window.Germany3DBridge?resolve(window.Germany3DBridge):(++n>120?resolve(null):setTimeout(f,50));f()});if(!bridge){canvas.remove();return}
  const S=.02,H=.038,ox=bridge.WORLD.w*S/2,oz=bridge.WORLD.h*S/2,X=x=>x*S-ox,Z=y=>y*S-oz;
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();scene.background=new T.Color(0x77756f);scene.fog=new T.Fog(0x77756f,24,72);
  const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,150);scene.add(new T.HemisphereLight(0xe4e0d6,0x454440,2.3));const sun=new T.DirectionalLight(0xf4f1e8,1.4);sun.position.set(-20,30,18);scene.add(sun);
  const mat=(c,r=1)=>new T.MeshStandardMaterial({color:c,roughness:r});
  const M={ground:mat(0x89867f),road:mat(0x555552),walk:mat(0xaaa69d),cross:mat(0xd2cdc0),grass:mat(0x68705e),path:mat(0xa9a59b),border:mat(0xb8aa8e),wall:mat(0x3a3935),dark:mat(0x333432),win:mat(0x414544,.55),metal:mat(0x505252,.7),blue:mat(0x1f4d79,.8),skin:mat(0xcabca8),npc:mat(0x55524d),player:mat(0x242424),police:mat(0x303943),merkel:mat(0x77746d)};
  const world=new T.Group();scene.add(world);
  const box=(w,h,d,m,x,y,z,p=world)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q};
  const plane=(w,d,m,x,z,y=.002)=>{const q=new T.Mesh(new T.PlaneGeometry(w,d),m);q.rotation.x=-Math.PI/2;q.position.set(x,y,z);world.add(q);return q};
  const rect=(r,m,y=.005)=>plane(r.w*S,r.h*S,m,X(r.x+r.w/2),Z(r.y+r.h/2),y);
  plane(bridge.WORLD.w*S,bridge.WORLD.h*S,M.ground,0,0,0);
  bridge.roads.forEach(r=>{rect({x:r.x-28,y:r.y-28,w:r.w+56,h:r.h+56},M.walk,.008);rect(r,M.road,.015);const h=r.w>r.h,total=(h?r.w:r.h)*S;for(let p=-total/2+1;p<total/2-1;p+=2.2)box(h?1.1:.07,.018,h?.07:1.1,M.cross,X(r.x+r.w/2)+(h?p:0),.03,Z(r.y+r.h/2)+(h?0:p))});
  bridge.crossings.forEach(c=>{for(let i=0;i<8;i++){const h=c.w>c.h,f=(i+.5)/8;box(h?c.w*S/8*.48:c.w*S,.025,h?c.h*S:c.h*S/8*.48,M.cross,X(c.x+c.w*(h?f:.5)),.04,Z(c.y+c.h*(h?.5:f)))}});rect(bridge.schreber,M.grass,.02);rect(bridge.policeGarden,M.grass,.021);
  const fireGround=new T.MeshBasicMaterial({color:0x5d3f31,transparent:true,opacity:.58,depthWrite:false});rect({x:0,y:bridge.BORDER_Y-18,w:bridge.WORLD.w,h:36},fireGround,.026);
  function makeFlameTexture(){
    const c=document.createElement("canvas");c.width=128;c.height=256;const g=c.getContext("2d");
    g.fillStyle="rgba(54,53,50,.16)";[[64,54,34],[42,88,24],[82,103,28]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()});
    const outer=g.createLinearGradient(0,66,0,250);outer.addColorStop(0,"rgba(206,111,55,.08)");outer.addColorStop(.36,"rgba(181,73,39,.58)");outer.addColorStop(1,"rgba(129,48,31,.72)");g.fillStyle=outer;g.beginPath();g.moveTo(13,250);g.quadraticCurveTo(18,167,48,111);g.quadraticCurveTo(56,83,66,45);g.quadraticCurveTo(84,117,77,145);g.quadraticCurveTo(104,124,115,250);g.closePath();g.fill();
    const inner=g.createLinearGradient(0,126,0,250);inner.addColorStop(0,"rgba(239,204,137,.24)");inner.addColorStop(.48,"rgba(224,139,63,.72)");inner.addColorStop(1,"rgba(195,84,39,.78)");g.fillStyle=inner;g.beginPath();g.moveTo(31,250);g.quadraticCurveTo(34,183,63,128);g.quadraticCurveTo(78,176,73,198);g.quadraticCurveTo(94,180,101,250);g.closePath();g.fill();
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.generateMipmaps=false;tx.minFilter=T.LinearFilter;return tx
  }
  const flameTexture=makeFlameTexture(),flameGeometry=new T.PlaneGeometry(1.48,1.95);flameGeometry.translate(0,.975,0);
  const flameMaterial=new T.MeshBasicMaterial({map:flameTexture,transparent:true,opacity:.82,depthWrite:false,side:T.DoubleSide}),fireCount=bridge.fireSources.length;
  const firePlaneA=new T.InstancedMesh(flameGeometry,flameMaterial,fireCount),firePlaneB=new T.InstancedMesh(flameGeometry,flameMaterial,fireCount),fireDummy=new T.Object3D();firePlaneA.frustumCulled=firePlaneB.frustumCulled=false;world.add(firePlaneA,firePlaneB);
  const emberLayers=innerWidth<700?1:2,emberCount=fireCount*emberLayers,emberPositions=new Float32Array(emberCount*3),emberGeometry=new T.BufferGeometry();emberGeometry.setAttribute("position",new T.BufferAttribute(emberPositions,3));
  const fireEmbers=new T.Points(emberGeometry,new T.PointsMaterial({color:0xe0a05c,size:.075,transparent:true,opacity:.72,depthWrite:false}));fireEmbers.frustumCulled=false;world.add(fireEmbers);
  function updateFire(now){
    const sources=bridge.fireSources,nearLine=Math.abs(bridge.player.y-bridge.BORDER_Y)<1900;
    for(let i=0;i<sources.length;i++){
      const f=sources[i],visible=f.active&&nearLine&&Math.abs(f.x-bridge.player.x)<1900,wave=.9+Math.sin(now*.005+f.seed*19)*.12,scale=visible?f.intensity*wave:0;
      fireDummy.position.set(X(f.x),.03,Z(f.y));fireDummy.rotation.set(0,0,Math.sin(now*.003+f.seed*11)*.045);fireDummy.scale.set(scale,scale*(.9+Math.sin(now*.007+f.seed*7)*.1),scale);fireDummy.updateMatrix();firePlaneA.setMatrixAt(i,fireDummy.matrix);
      fireDummy.rotation.set(0,Math.PI/2,Math.sin(now*.0037+f.seed*13)*.04);fireDummy.updateMatrix();firePlaneB.setMatrixAt(i,fireDummy.matrix);
    }
    firePlaneA.instanceMatrix.needsUpdate=firePlaneB.instanceMatrix.needsUpdate=true;
    for(let i=0;i<emberCount;i++){
      const sourceIndex=Math.floor(i/emberLayers),layer=i%emberLayers,f=sources[sourceIndex],visible=f.active&&nearLine&&Math.abs(f.x-bridge.player.x)<1900,rise=(now*.00022+f.seed+layer*.47)%1,j=i*3;
      emberPositions[j]=visible?X(f.x)+Math.sin(now*.002+f.seed*21+layer)*.18:0;emberPositions[j+1]=visible?.25+rise*1.9:-100;emberPositions[j+2]=visible?Z(f.y)+Math.cos(now*.0017+f.seed*17+layer)*.13:0;
    }
    emberGeometry.attributes.position.needsUpdate=true;
  }
  const pp=bridge.policePath,ax=X(pp.x1),az=Z(pp.y1),bx=X(pp.x2),bz=Z(pp.y2),len=Math.hypot(bx-ax,bz-az),path=box(pp.width*S,.03,len,M.path,(ax+bx)/2,.04,(az+bz)/2);path.rotation.y=Math.atan2(bx-ax,bz-az);
  function label(a,b,bg="#ded9cc",fg="#222"){const c=document.createElement("canvas");c.width=768;c.height=150;const g=c.getContext("2d");g.fillStyle=bg;g.fillRect(0,0,768,150);g.fillStyle=fg;g.textAlign="center";g.font="900 42px Arial";g.fillText(a,384,65);g.font="700 20px Arial";g.fillText(b||"",384,112);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tx}));s.scale.set(4.6,.9,1);return s}
  function pedestrianSign(s){const g=new T.Group(),post=new T.Mesh(new T.CylinderGeometry(.035,.045,1.55,8),M.metal);post.position.y=.775;g.add(post);box(.58,.58,.06,M.cross,0,1.64,0,g);box(.48,.48,.07,M.blue,0,1.64,.04,g);const tri=new T.Mesh(new T.ConeGeometry(.19,.38,3),M.cross);tri.rotation.z=Math.PI;tri.position.set(0,1.64,.09);g.add(tri);g.position.set(X(s.x),0,Z(s.y));g.rotation.y=(s.turn||0)*Math.PI/2;world.add(g)}
  bridge.crossingSigns.forEach(pedestrianSign);
  const buildingModels={
    buergeramt:"./assets/models/kenney-commercial/building-a.glb",
    auslaender:"./assets/models/kenney-commercial/building-g.glb",
    finanzamt:"./assets/models/kenney-commercial/building-c.glb",
    faxamt:"./assets/models/kenney-commercial/building-h.glb",
    post:"./assets/models/kenney-commercial/building-n.glb",
    rathaus:"./assets/models/kenney-commercial/building-m.glb"
  };
  const powerModels={
    coalBuilding:"./assets/models/power-plants/coal-building.glb",
    coalStack:"./assets/models/power-plants/coal-stack.glb",
    coolingTower:"./assets/models/power-plants/cooling-tower.glb",
    nuclearTransformer:"./assets/models/power-plants/nuclear-transformer.glb",
    nuclearSign:"./assets/models/power-plants/nuclear-warning-sign.glb"
  };
  const buildingSlots=[],modelLoader=GLTFLoader?new GLTFLoader():null;
  function registerMaterials(root,slot){
    const copies=new Map();
    root.traverse(o=>{
      if(!o.material)return;
      const copy=m=>{if(copies.has(m))return copies.get(m);const c=m.clone();copies.set(m,c);slot.materials.add(c);return c};
      o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);
    });
  }
  function grayMaterial(source,nodeName){
    const c=source&&source.color,lum=c?(c.r*.2126+c.g*.7152+c.b*.0722):.5,name=((source&&source.name)||"")+" "+(nodeName||"");
    let color=lum<.24?0x343634:lum<.48?0x5d5d58:lum<.72?0x77766f:0x9a9890;
    if(c&&c.b>c.r*1.12&&c.b>c.g*1.04)color=0x3d4445;
    if(/window|glass/i.test(name))color=0x394041;
    return new T.MeshStandardMaterial({color,roughness:/window|glass/i.test(name)?.48:.94,metalness:.01});
  }
  async function installBuildingModel(slot,url,w,h,d){
    if(!modelLoader)return;
    try{
      const gltf=await modelLoader.loadAsync(url),model=gltf.scene,materials=new Map();
      model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>{if(!materials.has(m))materials.set(m,grayMaterial(m,o.name));return materials.get(m)}):(()=>{const m=o.material;if(!materials.has(m))materials.set(m,grayMaterial(m,o.name));return materials.get(m)})();});
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
      if(!size.x||!size.y||!size.z)throw new Error("empty building bounds");
      const sx=w/size.x,sy=h/size.y,sz=d/size.z;
      model.scale.set(sx,sy,sz);model.position.set(-center.x*sx,-bounds.min.y*sy,-center.z*sz);
      slot.group.add(model);slot.model=model;slot.fallback.visible=false;registerMaterials(model,slot);
    }catch(e){console.warn("Keeping procedural building for "+slot.building.id,e)}
  }
  const coalSmoke=[],coalBelt=[];
  async function installPlantModel(slot,url,fit,placements,keepColors=false,fallback=null){
    if(!modelLoader)return;
    try{
      const gltf=await modelLoader.loadAsync(url);
      for(const p of placements){
        const model=gltf.scene.clone(true),materials=new Map();
        if(!keepColors)model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>{if(!materials.has(m))materials.set(m,grayMaterial(m,o.name));return materials.get(m)}):(()=>{const m=o.material;if(!materials.has(m))materials.set(m,grayMaterial(m,o.name));return materials.get(m)})()});
        const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
        if(!size.x||!size.y||!size.z)throw new Error("empty plant asset bounds");
        const s=Math.min(fit.x/size.x,fit.y/size.y,fit.z/size.z);model.scale.setScalar(s);model.position.set(p.x-center.x*s,p.y-bounds.min.y*s,p.z-center.z*s);slot.group.add(model);registerMaterials(model,slot);
      }
      if(fallback)fallback.visible=false;
    }catch(e){console.warn("Keeping procedural power-plant asset "+slot.building.id+" / "+url,e)}
  }
  function powerPlant(b,i){
    const g=new T.Group(),w=b.w*S,d=b.h*S,slot={building:b,group:g,fallback:g,model:null,materials:new Set(),opacity:1};g.position.set(X(b.x+b.w/2),0,Z(b.y+b.h/2));world.add(g);buildingSlots.push(slot);
    if(b.kind==="nuclear"){
      const coolingFallback=new T.Group(),transformerFallback=new T.Group(),signFallback=new T.Group();g.add(coolingFallback,transformerFallback,signFallback);
      const tower=(x,z,h,rb,rn,rt)=>{const geo=new T.LatheGeometry([new T.Vector2(rb,0),new T.Vector2(rn,h*.62),new T.Vector2(rt,h)],24),q=new T.Mesh(geo,mat(0x85847f,.96));q.position.set(x,0,z);coolingFallback.add(q)};
      tower(-5.1,-1.35,4.8,1.42,.78,1.08);tower(-2.05,-.55,4.35,1.25,.7,.96);box(7.5,2.8,3.7,mat(0x66645f,.98),3.2,1.4,.35,g);box(7.7,.14,3.9,mat(0x8d8a82),3.2,2.87,.35,g);
      box(2.5,1.5,1.8,M.metal,2.4,.75,-2.35,transformerFallback);box(.62,.82,.5,mat(0xd1b73f),-6.4,.95,d/2+.12,signFallback);
      for(let x=-w/2+.55;x<w/2-.45;x+=1.15){box(.82,.24,.1,x%2<1?mat(0x762f29):M.cross,x,.72,d/2+.12,g);box(.1,1.25,.1,M.metal,x-.42,.62,d/2+.08,g)}
      const red=mat(0x762f29),slashA=box(5.8,.28,.14,red,3.2,1.45,2.23,g),slashB=box(5.8,.28,.14,red,3.2,1.45,2.24,g);slashA.rotation.z=.42;slashB.rotation.z=-.42;
      const l=label("AKW · GESCHLOSSEN","STILLGELEGT · KEIN ZUTRITT","#762f29","#f4eee2");l.position.set(0,3.35,d/2+.18);g.add(l);registerMaterials(g,slot);
      installPlantModel(slot,powerModels.coolingTower,{x:2.8,y:4.8,z:2.8},[{x:-5.1,y:0,z:-1.35},{x:-2.05,y:0,z:-.55}],false,coolingFallback);
      installPlantModel(slot,powerModels.nuclearTransformer,{x:3.2,y:2.55,z:2.4},[{x:2.4,y:0,z:-2.35}],true,transformerFallback);
      installPlantModel(slot,powerModels.nuclearSign,{x:.62,y:1.7,z:.5},[{x:-6.4,y:0,z:d/2+.12}],true,signFallback);
    }else{
      const hall=new T.Group(),stackFallback=new T.Group();g.add(hall,stackFallback);
      box(w*.57,3.7,d*.55,mat(0x615f5a,.98),-.3,1.85,-.55,hall);box(w*.59,.15,d*.57,mat(0x8e8b83),-.3,3.78,-.55,hall);
      const stackX=5.6,stackZ=-.6,stack=new T.Mesh(new T.CylinderGeometry(.38,.52,5.15,18),mat(0x5d5953,.94));stack.position.set(stackX,2.575,stackZ);stackFallback.add(stack);
      const conveyor=box(4.4,.3,.48,M.metal,2.6,1.9,1.42,g);conveyor.rotation.z=.36;
      const lit=new T.MeshStandardMaterial({color:0xffbf57,emissive:0x9d5313,emissiveIntensity:1.8,roughness:.5});for(let x=-4.35;x<2.1;x+=1.3){box(.62,.38,.08,lit,x,1.15,1.8,g);box(.62,.38,.08,lit,x,2.05,1.8,g)}
      box(1.65,2.05,.09,M.dark,3.1,1.025,1.81,g);box(2.15,.05,1.1,M.walk,3.1,.035,2.25,g);
      for(let j=0;j<7;j++){const q=box(.25,.2,.25,M.dark,0,0,0,g);coalBelt.push({mesh:q,index:j,from:new T.Vector3(.55,1.2,1.42),to:new T.Vector3(4.65,2.65,1.42)})}
      const gateL=box(2.35,.16,.1,mat(0x31553a),-w/2+.45,.78,d/2+.13,g),gateR=box(2.35,.16,.1,mat(0x31553a),w/2-.45,.78,d/2+.13,g);gateL.rotation.y=.82;gateR.rotation.y=-.82;
      const l=label("KOHLEKRAFTWERK · OFFEN","IN BETRIEB · 24/7 · RAUCHFANG AKTIV","#31553a","#f4eee2");l.scale.set(3.45,.68,1);l.position.set(-.3,4.3,1.9);g.add(l);registerMaterials(g,slot);
      installPlantModel(slot,powerModels.coalBuilding,{x:3.2,y:3.3,z:3.1},[{x:-5.95,y:0,z:-.75}]);
      installPlantModel(slot,powerModels.coalStack,{x:1.1,y:5.15,z:1.1},[{x:stackX,y:0,z:stackZ}],false,stackFallback);
      for(let j=0;j<10;j++){const m=new T.MeshBasicMaterial({color:0x1d1c1a,transparent:true,depthWrite:false}),q=new T.Mesh(new T.SphereGeometry(.38,10,7),m);g.add(q);coalSmoke.push({mesh:q,x:stackX,y:4.95,z:stackZ,index:j})}
    }
  }
  function building(b,i){
    if(b.kind){powerPlant(b,i);return}
    const g=new T.Group(),fallback=new T.Group(),w=b.w*S,d=b.h*S,h=Math.max(2.8,b.hgt*H),cols=[0x65645f,0x706f69,0x5c5d59,0x7a7871],bm=mat(cols[i%cols.length],.98);
    g.add(fallback);box(w,h,d,bm,0,h/2,0,fallback);box(w*1.03,.16,d*1.03,mat(0x89877f),0,h+.08,0,fallback);
    const dx=(b.doorX-(b.x+b.w/2))*S;box(Math.min(1.3,w*.18),1.55,.1,M.dark,dx,.78,d/2+.06,fallback);box(Math.min(2,w*.32),.1,.62,mat(0xaaa69b),dx,1.72,d/2+.28,fallback);
    const cn=Math.max(2,Math.min(7,Math.floor(w/1.25))),rn=Math.max(2,Math.min(5,Math.floor(h/1.05)));
    for(let r=0;r<rn;r++)for(let c=0;c<cn;c++)box(.48,.31,.04,M.win,-w*.41+c*(w*.82/Math.max(1,cn-1)),.9+r*Math.max(.64,(h-1.6)/Math.max(1,rn-1)),d/2+.025,fallback);
    const l=label(b.name,b.sign);l.position.set(0,Math.max(1.8,h*.58),d/2+.11);g.add(l);g.position.set(X(b.x+b.w/2),0,Z(b.y+b.h/2));world.add(g);
    const slot={building:b,group:g,fallback,model:null,materials:new Set(),opacity:1};buildingSlots.push(slot);registerMaterials(g,slot);
    const url=buildingModels[b.id];if(url)installBuildingModel(slot,url,w,h,d);
  }
  bridge.buildings.forEach(building);

  function fence(r){const x0=X(r.x),x1=X(r.x+r.w),z0=Z(r.y),z1=Z(r.y+r.h),post=(x,z)=>box(.08,.75,.08,M.metal,x,.375,z);for(let x=x0;x<=x1;x+=2.2){post(x,z0);post(x,z1)}for(let z=z0;z<=z1;z+=2.2){post(x0,z);post(x1,z)}}
  function sheds(r,n){for(let i=0;i<n;i++){const cols=Math.ceil(n/2),x=X(r.x+80+(i%cols)*170),z=Z(r.y+110+Math.floor(i/cols)*220);box(1.5,1.1,1.15,mat(0x898379),x,.55,z);const roof=new T.Mesh(new T.ConeGeometry(1.15,.6,4),M.dark);roof.position.set(x,1.4,z);roof.rotation.y=Math.PI/4;world.add(roof)}}
  fence(bridge.policeGarden);sheds(bridge.schreber,4);sheds(bridge.policeGarden,6);
  [[700,720],[1450,720],[2800,720],[4050,720],[5100,720],[6650,720],[8200,720],[700,1880],[2800,1880],[4050,1880],[5200,1880],[6750,1880],[8300,1880],[700,2860],[2800,2860],[4050,2860],[5200,2860],[6750,2860],[8300,2860]].forEach(([x,y])=>{const g=new T.Group(),p=new T.Mesh(new T.CylinderGeometry(.04,.05,2.5,8),M.metal);p.position.y=1.25;g.add(p);box(.45,.05,.05,M.metal,.12,2.4,0,g);g.position.set(X(x),0,Z(y));world.add(g)});
  [[260,1750],[800,1760],[2700,650],[3400,680],[4300,650],[5000,680],[6500,650],[8100,680],[2700,1800],[4200,1800],[5200,1800],[6800,1800],[8400,1800],[2800,2860],[4200,2860],[5200,2860],[6800,2860],[8400,2860],[700,3500],[1800,3500],[4650,3500],[6100,3500],[7700,3500],[9300,3500]].forEach(([x,y])=>{const g=new T.Group(),tr=new T.Mesh(new T.CylinderGeometry(.12,.16,1.3,7),mat(0x65594a));tr.position.y=.65;g.add(tr);const crown=new T.Mesh(new T.IcosahedronGeometry(.75,1),mat(0x4e5949));crown.position.y=1.7;g.add(crown);g.position.set(X(x),0,Z(y));world.add(g)});
  function prop(p){if(p.asset==="faxbillboard"){const g=new T.Group(),c=document.createElement("canvas");c.width=768;c.height=250;const x=c.getContext("2d");x.fillStyle="#ded9cc";x.fillRect(0,0,768,250);x.strokeStyle="#222";x.lineWidth=12;x.strokeRect(6,6,756,238);x.fillStyle="#222";x.textAlign="center";x.font="900 50px Arial";x.fillText("FAX 3000 PRO",384,70);x.font="900 32px Arial";x.fillText("2,75× SCHNELLER",384,124);x.font="700 18px Arial";x.fillText("DIE ZUKUNFT DER DIGITALISIERUNG IST PAPIER",384,195);const tx=new T.CanvasTexture(c),board=new T.Mesh(new T.BoxGeometry(4.8,1.65,.12),new T.MeshStandardMaterial({map:tx,roughness:.9}));board.position.y=2.8;g.add(board);[-1.7,1.7].forEach(v=>box(.1,2.2,.1,M.metal,v,1.1,0,g));g.position.set(X(p.x),0,Z(p.y));world.add(g)}}
  bridge.props.forEach(prop);
  function character(kind){const g=new T.Group(),m=kind==="player"?M.player:kind==="police"?M.police:kind==="merkel"?M.merkel:M.npc;box(.42,.72,.3,m,0,.72,0,g);const head=new T.Mesh(new T.SphereGeometry(.2,10,7),M.skin);head.position.y=1.3;g.add(head);const lg=new T.CylinderGeometry(.06,.07,.5,8),ag=new T.CylinderGeometry(.05,.06,.48,8),ll=new T.Mesh(lg,m),rl=ll.clone(),la=new T.Mesh(ag,m),ra=la.clone();ll.position.set(-.1,.27,0);rl.position.set(.1,.27,0);la.position.set(-.27,.76,0);ra.position.set(.27,.76,0);g.add(ll,rl,la,ra);g.userData={ll,rl,la,ra};if(kind==="merkel"){const hair=new T.Mesh(new T.SphereGeometry(.22,10,7,0,Math.PI*2,0,Math.PI*.58),mat(0x5d5953));hair.position.y=1.39;g.add(hair)}if(kind==="police"){const cap=new T.Mesh(new T.CylinderGeometry(.21,.21,.08,10),M.dark);cap.position.y=1.52;g.add(cap)}return g}
  function syncChar(q,o,l=0){q.position.set(X(o.x),l,Z(o.y));const ph=performance.now()*.008+(o.x+o.y)*.02,s=Math.sin(ph)*.38;q.userData.ll.rotation.x=s;q.userData.rl.rotation.x=-s;q.userData.la.rotation.x=-s*.7;q.userData.ra.rotation.x=s*.7}
  function borderPourerSprite(){
    const source=bridge.getBorderPourerCanvas?.();if(!source)return null;
    const grid=bridge.borderPourerGrid||{cols:5,rows:6},tx=new T.CanvasTexture(source);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(1/grid.cols,1/grid.rows);
    tx.generateMipmaps=false;tx.minFilter=T.LinearFilter;
    const q=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,alphaTest:.02,depthWrite:false}));q.scale.set(2.5,2.5,1);q.userData={borderPourerSprite:true,grid};return q
  }
  const merkelTexture=new T.TextureLoader().load("./assets/merkel-sprite.png");merkelTexture.colorSpace=T.SRGBColorSpace;merkelTexture.wrapS=merkelTexture.wrapT=T.RepeatWrapping;merkelTexture.repeat.set(1/3,1/5);merkelTexture.generateMipmaps=false;merkelTexture.minFilter=T.LinearFilter;
  function merkelSprite(){const q=new T.Sprite(new T.SpriteMaterial({map:merkelTexture,transparent:true,alphaTest:.02,depthWrite:false}));q.scale.set(2.05,2.05,1);q.userData={merkelSprite:true};return q}
  function syncMerkel(q,o){const tx=q.material.map;tx.offset.x=(o.spriteFrame||0)/3;tx.offset.y=1-((o.spriteRow||0)+1)/5;q.position.set(X(o.x),1.02,Z(o.y))}
  function syncBorderPourer(q,o){
    const tx=q.material.map,grid=q.userData.grid,frame=o.spriteFrame||0,row=o.spriteRow||0,flip=!!o.spriteFlip;
    tx.repeat.x=(flip?-1:1)/grid.cols;tx.repeat.y=1/grid.rows;tx.offset.x=(frame+(flip?1:0))/grid.cols;tx.offset.y=1-(row+1)/grid.rows;
    q.position.set(X(o.x),1.25,Z(o.y));
  }
  function pickup(type){const g=new T.Group();if(type==="pfand"){const m=new T.Mesh(new T.CylinderGeometry(.07,.09,.5,9),mat(0x566153));m.position.y=.25;g.add(m)}else{const col=type==="currywurst"?0x805143:type==="bratwurst"?0x9a7653:0x8a694b,m=mat(col),q=new T.Mesh(type==="brezel"?new T.TorusGeometry(.18,.055,8,18):new T.CapsuleGeometry(.08,.4,4,8),m);q.rotation.z=type==="brezel"?0:Math.PI/2;q.position.y=.2;g.add(q)}return g}

  const playerMesh=character("player");scene.add(playerMesh);
  const npcMeshes=new Map(),policeMeshes=new Map(),pickupMeshes=new Map();
  bridge.getNPCs().forEach(n=>{const q=n.special==="borderPourer"?(borderPourerSprite()||character("npc")):n.special==="merkel"?merkelSprite():character("npc");scene.add(q);npcMeshes.set(n,q)});
  bridge.pickups.forEach(p=>{const q=pickup(p.type);scene.add(q);pickupMeshes.set(p,q)});
  function updateBuildingOcclusion(){
    const cameraReach=15/S,px=bridge.player.x,py=bridge.player.y;
    for(const slot of buildingSlots){
      const b=slot.building,between=b.y<py+cameraReach&&b.y+b.h>py,underSightline=px>b.x-35&&px<b.x+b.w+35,target=between&&underSightline?.24:1;
      slot.opacity+=(target-slot.opacity)*.16;
      const faded=slot.opacity<.985;
      for(const m of slot.materials){
        if(m.transparent!==faded){m.transparent=faded;m.needsUpdate=true}
        m.opacity=slot.opacity;m.depthWrite=!faded;
      }
    }
  }
  function updatePowerPlants(){const now=performance.now()*.00016;for(const p of coalSmoke){const t=(now+p.index/coalSmoke.length)%1;p.mesh.position.set(p.x+Math.sin(now*25+p.index)*.52*t,p.y+t*4.5,p.z+Math.cos(now*19+p.index)*.4*t);p.mesh.scale.setScalar(.9+t*1.8);p.mesh.material.opacity=.88*(1-t)}for(const p of coalBelt){const t=(now*4+p.index/coalBelt.length)%1;p.mesh.position.lerpVectors(p.from,p.to,t);p.mesh.rotation.x+=.05;p.mesh.rotation.z+=.04}}
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}resize();addEventListener("resize",resize,{passive:true});
  window.Germany3D={ready:true,sync(){
    syncChar(playerMesh,bridge.player,0);
    playerMesh.rotation.y=bridge.player.facing;
    bridge.getNPCs().forEach(n=>{let q=npcMeshes.get(n);if(n.special==="borderPourer"&&!q?.userData.borderPourerSprite){const sprite=borderPourerSprite();if(sprite){if(q)scene.remove(q);q=sprite;scene.add(q);npcMeshes.set(n,q)}}if(!q){q=n.special==="borderPourer"?(borderPourerSprite()||character("npc")):n.special==="merkel"?merkelSprite():character("npc");scene.add(q);npcMeshes.set(n,q)}if(q.userData.borderPourerSprite)syncBorderPourer(q,n);else if(q.userData.merkelSprite)syncMerkel(q,n);else syncChar(q,n)});
    const ps=bridge.getPolice();ps.forEach(p=>{let q=policeMeshes.get(p);if(!q){q=character("police");scene.add(q);policeMeshes.set(p,q)}syncChar(q,p,.04)});for(const [p,q] of policeMeshes)if(!ps.includes(p)){scene.remove(q);policeMeshes.delete(p)}
    bridge.pickups.forEach(p=>{const q=pickupMeshes.get(p);q.visible=!p.taken;if(q.visible){q.position.set(X(p.x),.2,Z(p.y));q.rotation.y+=.012}});
    updateFire(performance.now());updateBuildingOcclusion();updatePowerPlants();
    const px=X(bridge.player.x),pz=Z(bridge.player.y);camera.position.set(px,11.5,pz+14);camera.lookAt(px,1,pz-2.7);renderer.render(scene,camera);
  }};
  app.classList.add("three-ready");
})();
