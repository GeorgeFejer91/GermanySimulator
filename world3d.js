const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
const GLTF_LOADER_URL="https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js";
function showRendererFailure(error){
  const app=document.getElementById("app");if(!app)return;document.getElementById("world3d")?.remove();app.classList.add("three-failed");
  let notice=app.querySelector(".render-error");if(!notice){notice=document.createElement("section");notice.className="render-error";notice.innerHTML="<b>3D-RENDERER NICHT VERFÜGBAR</b><p>Germany Simulator benötigt WebGL und konnte die 3D-Welt nicht laden.</p><button type=\"button\">NEU LADEN</button>";notice.querySelector("button").onclick=()=>location.reload();app.append(notice)}
  console.error("3D renderer unavailable",error);
}
(async()=>{
  const app=document.getElementById("app");if(!app)return;
  const canvas=document.createElement("canvas");canvas.id="world3d";Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"3",pointerEvents:"none",background:"#77756f"});app.prepend(canvas);
  let T;try{T=await import(THREE_URL)}catch(e){showRendererFailure(e);return}
  let GLTFLoader=null;try{({GLTFLoader}=await import(GLTF_LOADER_URL))}catch(e){console.warn("GLB models unavailable; procedural 3D stand-ins remain active",e)}
  const bridge=await new Promise(resolve=>{let n=0;const f=()=>window.Germany3DBridge?resolve(window.Germany3DBridge):(++n>120?resolve(null):setTimeout(f,50));f()});if(!bridge){showRendererFailure(new Error("3D simulation bridge unavailable"));return}
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
  const sidewalk=bridge.SIDEWALK_WIDTH||28;
  bridge.roads.forEach(r=>rect({x:r.x-sidewalk,y:r.y-sidewalk,w:r.w+sidewalk*2,h:r.h+sidewalk*2},M.walk,.008));
  (bridge.grassAreas||[]).forEach(r=>rect(r,M.grass,.011));(bridge.walkways||[]).forEach(r=>rect(r,M.path,.014));
  bridge.roads.forEach(r=>{rect(r,M.road,.015);const h=r.w>r.h,total=(h?r.w:r.h)*S;for(let p=-total/2+1;p<total/2-1;p+=2.2)box(h?1.1:.07,.018,h?.07:1.1,M.cross,X(r.x+r.w/2)+(h?p:0),.03,Z(r.y+r.h/2)+(h?0:p))});
  bridge.crossings.forEach(c=>{for(let i=0;i<8;i+=2){const h=c.w>c.h,f=(i+1)/8;box(h?c.w*S/8*.72:c.w*S,.025,h?c.h*S:c.h*S/8*.72,M.cross,X(c.x+c.w*(h?f:.5)),.04,Z(c.y+c.h*(h?.5:f)))}});rect(bridge.schreber,M.grass,.02);rect(bridge.policeGarden,M.grass,.021);
  const railMaterial=mat(0x343532,.58),sleeperMaterial=mat(0x594f43,.94);
  for(const loop of bridge.railLoops||[]){
    for(const side of [-1,1]){const points=loop.samples.map(p=>new T.Vector3(X(p.x-Math.sin(p.angle)*11*side),.075,Z(p.y+Math.cos(p.angle)*11*side))),curve=new T.CatmullRomCurve3(points,true,"centripetal");world.add(new T.Mesh(new T.TubeGeometry(curve,points.length,.035,4,true),railMaterial))}
    for(let i=0;i<loop.samples.length;i+=3){const p=loop.samples[i],sleeper=box(.88,.035,.13,sleeperMaterial,X(p.x),.045,Z(p.y));sleeper.rotation.y=Math.PI/2-p.angle}
  }
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
  const trafficLightSlots=[];
  function pedestrianLight(light){const g=new T.Group(),post=new T.Mesh(new T.CylinderGeometry(.035,.045,1.45,8),M.metal),red=new T.MeshBasicMaterial({color:0xdf332c}),green=new T.MeshBasicMaterial({color:0x284b31});post.position.y=.725;g.add(post);box(.42,.82,.22,M.dark,0,1.62,0,g);const redLamp=new T.Mesh(new T.SphereGeometry(.115,10,7),red),greenLamp=new T.Mesh(new T.SphereGeometry(.115,10,7),green);redLamp.position.set(0,1.82,.13);greenLamp.position.set(0,1.44,.13);g.add(redLamp,greenLamp);if(light.sign){box(.46,.46,.06,M.cross,0,2.26,0,g);box(.37,.37,.07,M.blue,0,2.26,.04,g);const tri=new T.Mesh(new T.ConeGeometry(.145,.29,3),M.cross);tri.rotation.z=Math.PI;tri.position.set(0,2.26,.09);g.add(tri)}g.position.set(X(light.x),0,Z(light.y));g.rotation.y=(light.turn||0)*Math.PI/2;world.add(g);trafficLightSlots.push({light,red,green})}
  (bridge.trafficLights||[]).forEach(pedestrianLight);
  const buildingModels={
    buergeramt:"./assets/models/kenney-commercial/building-a.glb",
    auslaender:"./assets/models/kenney-commercial/building-g.glb",
    finanzamt:"./assets/models/kenney-commercial/building-c.glb",
    faxamt:"./assets/models/kenney-commercial/building-h.glb",
    post:"./assets/models/kenney-commercial/building-n.glb",
    rathaus:"./assets/models/kenney-commercial/building-m.glb",
    bundestag:"./assets/models/bundestag/bundestag.glb"
  };
  const powerModels={
    coalBuilding:"./assets/models/power-plants/coal-building.glb",
    coalStack:"./assets/models/power-plants/coal-stack.glb",
    coolingTower:"./assets/models/power-plants/cooling-tower.glb",
    nuclearTransformer:"./assets/models/power-plants/nuclear-transformer.glb",
    nuclearSign:"./assets/models/power-plants/nuclear-warning-sign.glb"
  };
  const buildingSlots=[],trainSlots=[],modelLoader=GLTFLoader?new GLTFLoader():null;
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
    if(/dome.?glass/i.test(name))return new T.MeshStandardMaterial({color:0x789095,roughness:.2,metalness:.08,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide});
    let color=lum<.24?0x343634:lum<.48?0x5d5d58:lum<.72?0x77766f:0x9a9890;
    if(c&&c.b>c.r*1.12&&c.b>c.g*1.04)color=0x3d4445;
    if(/window|glass/i.test(name))color=0x394041;
    return new T.MeshStandardMaterial({color,roughness:/window|glass/i.test(name)?.48:.94,metalness:.01});
  }
  const trainModelUrls=[
    "./assets/models/kenney-trains/train-electric-city-a.glb",
    "./assets/models/open-l-gauge-nwagen/n-wagen-coach.glb?v=20260920-1",
    "./assets/models/kenney-trains/train-electric-city-c.glb"
  ],trainModelPromise=modelLoader?Promise.all(trainModelUrls.map(url=>modelLoader.loadAsync(url))):null,
  trafficBeetleModelPromise=modelLoader?modelLoader.loadAsync("./assets/models/traffic/classic-vw-beetle.glb?v=20260921-1"):null,
  policeCarModelPromise=modelLoader?modelLoader.loadAsync("./assets/models/police-response/police-car.glb?v=20260920-2"):null,
  policeHelicopterModelPromise=modelLoader?modelLoader.loadAsync("./assets/models/police-response/black-helicopter.glb"):null;
  function makeTrainCarFallback(){
    const g=new T.Group(),red=mat(0xc43d36,.72),white=mat(0xeee9df,.82),glass=mat(0x39454b,.42),wheel=mat(0x292a29,.55);
    box(1.16,.92,4.72,white,0,.62,0,g);box(1.18,.34,4.68,red,0,.45,0,g);for(const side of [-1,1])for(let q=-1.75;q<=1.75;q+=.5)box(.06,.26,.33,glass,side*.61,.83,q,g);for(const side of [-1,1])for(const q of [-1.65,1.65]){const w=new T.Mesh(new T.CylinderGeometry(.16,.16,.09,10),wheel);w.rotation.z=Math.PI/2;w.position.set(side*.6,.18,q);g.add(w)}
    return g
  }
  function fitTrainPart(source,fit){
    const model=new T.Group();model.add(source);source.updateMatrixWorld(true);let bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3());if(size.x>size.z){source.rotation.y+=Math.PI/2;source.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(source);size=bounds.getSize(new T.Vector3())}if(!size.x||!size.y||!size.z)throw new Error("empty train asset bounds");const center=bounds.getCenter(new T.Vector3());source.position.x-=center.x;source.position.y-=bounds.min.y;source.position.z-=center.z;model.scale.set(fit.x/size.x,fit.y/size.y,fit.z/size.z);return model
  }
  async function installTrainModel(slot){
    if(!trainModelPromise)return;
    try{const sources=await trainModelPromise;for(let i=0;i<slot.cars.length;i++){const sourceIndex=i===0?0:i===slot.cars.length-1?2:1,source=sources[sourceIndex].scene.clone(true),fit=sourceIndex===1?{x:1.12,y:1.28,z:4.82}:{x:1.24,y:1.62,z:4.7},model=fitTrainPart(source,fit);slot.cars[i].group.add(model);slot.cars[i].fallback.visible=false;slot.cars[i].model=model}}
    catch(e){console.warn("Keeping procedural AMT-Bahn train",e)}
  }
  const gangwayGeometry=new T.BoxGeometry(.42,.48,1),gangwayMaterial=mat(0x252625,.62);
  for(const train of bridge.trains||[]){const slot={train,cars:train.cars.map(()=>{const group=new T.Group(),fallback=makeTrainCarFallback();group.add(fallback);world.add(group);return{group,fallback,model:null}}),gangways:train.cars.slice(1).map(()=>{const mesh=new T.Mesh(gangwayGeometry,gangwayMaterial);world.add(mesh);return mesh})};trainSlots.push(slot);installTrainModel(slot)}
  function fitResponseModel(model,fit){model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());if(!size.x||!size.y||!size.z)throw new Error("empty response asset bounds");const s=Math.min(fit.x/size.x,fit.y/size.y,fit.z/size.z);model.scale.setScalar(s);model.position.set(-center.x*s,-bounds.min.y*s,-center.z*s)}
  function responseMaterial(source,kind){const copy=source.clone(),name=(source.name||"").toLowerCase(),c=source.color,lum=c?c.r*.2126+c.g*.7152+c.b*.0722:.5;if(kind==="helicopter")copy.color.setHex(lum>.65?0x282b29:lum>.3?0x171918:0x090a09);else if(/white/.test(name))copy.color.setHex(0xc3c7c5);else if(/bluelight/.test(name)){copy.color.setHex(0x246cff);copy.emissive=new T.Color(0x123b92);copy.emissiveIntensity=1.5}copy.roughness=.72;return copy}
  async function installResponseModel(slot,promise,kind,fit){
    if(!promise)return;
    try{const gltf=await promise,model=gltf.scene.clone(true),materials=new Map();model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>{if(!materials.has(m))materials.set(m,responseMaterial(m,kind));return materials.get(m)}):(()=>{const m=o.material;if(!materials.has(m))materials.set(m,responseMaterial(m,kind));return materials.get(m)})()});fitResponseModel(model,fit);slot.group.add(model);slot.model=model;slot.fallback.visible=false}
    catch(e){console.warn("Keeping procedural police "+kind,e)}
  }
  async function installTrafficBeetleModel(slot){
    if(!trafficBeetleModelPromise)return;
    try{const gltf=await trafficBeetleModelPromise,model=gltf.scene.clone(true),materials=new Map();model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>{if(!materials.has(m)){const copy=m.clone();copy.color.set(slot.state.color);copy.roughness=.78;copy.metalness=.02;materials.set(m,copy)}return materials.get(m)}):(()=>{const m=o.material;if(!materials.has(m)){const copy=m.clone();copy.color.set(slot.state.color);copy.roughness=.78;copy.metalness=.02;materials.set(m,copy)}return materials.get(m)})()});fitResponseModel(model,{x:1.08,y:.92,z:2.48});model.position.y+=.13;slot.group.add(model);slot.model=model;slot.fallback.visible=false}
    catch(e){console.warn("Keeping procedural classic Beetle",e)}
  }
  function makePoliceCarSlot(car){
    const group=new T.Group(),fallback=new T.Group(),silver=mat(0xc3c7c5,.74),blue=mat(0x225b9c,.58),glass=mat(0x34434b,.35),wheel=mat(0x151615,.62);box(1.18,.58,2.35,silver,0,.48,0,fallback);box(.96,.42,1.12,glass,0,.88,-.05,fallback);for(const side of [-1,1])for(const z of [-.72,.72]){const q=new T.Mesh(new T.CylinderGeometry(.18,.18,.1,12),wheel);q.rotation.z=Math.PI/2;q.position.set(side*.59,.2,z);fallback.add(q)}for(const side of [-1,1])for(const z of [-.58,.52])box(.045,.24,.62,blue,side*.61,.59,z,fallback);box(.72,.045,.48,blue,0,.79,-.9,fallback);group.add(fallback);const lightA=box(.22,.09,.34,mat(0x246cff,.32),-.13,1.16,0,group),lightB=box(.22,.09,.34,mat(0x123f99,.32),.13,1.16,0,group);world.add(group);const slot={state:car,group,fallback,model:null,lightA,lightB};installResponseModel(slot,policeCarModelPromise,"car",{x:1.24,y:1.08,z:2.55});return slot
  }
  function makeTrafficCarSlot(car){
    const group=new T.Group(),fallback=new T.Group(),body=mat(car.color,.76),glass=mat(0x344348,.38),trim=mat(0xd8d5c9,.68),head=mat(0xe2d49b,.48),wheel=mat(0x171817,.58),tail=mat(0x762720,.5);group.add(fallback);
    if(car.kind==="beetle"){const lower=new T.Mesh(new T.SphereGeometry(1,14,9),body),roof=new T.Mesh(new T.SphereGeometry(1,14,9),body);lower.scale.set(.64,.3,1.16);lower.position.y=.47;roof.scale.set(.5,.36,.68);roof.position.set(0,.77,-.06);fallback.add(lower,roof);box(.88,.32,.08,glass,0,.77,.48,fallback);box(.9,.3,.08,glass,0,.77,-.58,fallback)}
    else{box(1.16,.48,2.22,body,0,.47,0,fallback);box(1.02,.5,1.12,body,0,.82,-.08,fallback);box(.9,.34,.06,glass,0,.85,.51,fallback);box(.92,.34,.06,glass,0,.85,-.67,fallback);box(.08,.34,1.02,glass,-.52,.85,-.08,fallback);box(.08,.34,1.02,glass,.52,.85,-.08,fallback);box(.86,.08,.16,trim,0,.48,1.13,fallback)}
    for(const side of [-1,1])for(const z of [-.73,.73]){const q=new T.Mesh(new T.CylinderGeometry(.19,.19,.14,12),wheel),hub=new T.Mesh(new T.CylinderGeometry(.09,.09,.145,12),trim);q.rotation.z=hub.rotation.z=Math.PI/2;q.position.set(side*.55,.19,z);hub.position.copy(q.position);group.add(q,hub)}
    if(car.kind==="beetle"){for(const side of [-1,1]){box(.035,.28,.42,glass,side*.505,.73,.27,group);box(.035,.27,.38,glass,side*.505,.72,-.26,group)}box(1.02,.07,.1,trim,0,.34,1.18,group);box(1.02,.07,.1,trim,0,.34,-1.18,group)}
    for(const side of [-1,1]){const rear=new T.Mesh(new T.SphereGeometry(.07,10,7),tail),front=new T.Mesh(new T.SphereGeometry(.075,10,7),head);rear.scale.z=front.scale.z=.35;rear.position.set(side*.29,.49,-1.13);front.position.set(side*.29,.49,1.13);group.add(rear,front)}world.add(group);const slot={state:car,group,fallback,model:null,tail};if(car.kind==="beetle")installTrafficBeetleModel(slot);return slot
  }
  function makePoliceHelicopterSlot(helicopter){
    const group=new T.Group(),fallback=new T.Group(),black=mat(0x111312,.48),glass=mat(0x253038,.34);box(1.1,.72,2.05,black,0,.56,0,fallback);box(.74,.46,.72,glass,0,.65,-.88,fallback);box(.2,.18,2.35,black,0,.6,2.05,fallback);const tail=new T.Mesh(new T.ConeGeometry(.5,1.1,3),black);tail.rotation.x=Math.PI/2;tail.position.set(0,.76,3.22);fallback.add(tail);group.add(fallback);const rotor=new T.Group(),bladeGeo=new T.BoxGeometry(4.8,.035,.12),bladeA=new T.Mesh(bladeGeo,black),bladeB=bladeA.clone();bladeB.rotation.y=Math.PI/2;rotor.add(bladeA,bladeB);rotor.position.y=1.55;group.add(rotor);const beam=new T.Mesh(new T.ConeGeometry(2.35,6.4,20,1,true),new T.MeshBasicMaterial({color:0xf1e6a6,transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide}));beam.position.y=-2.85;beam.visible=false;group.add(beam);world.add(group);const slot={state:helicopter,group,fallback,model:null,rotor,beam};installResponseModel(slot,policeHelicopterModelPromise,"helicopter",{x:3.55,y:1.5,z:4.65});return slot
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
  (bridge.trees||[]).forEach(({x,y})=>{const g=new T.Group(),tr=new T.Mesh(new T.CylinderGeometry(.12,.16,1.3,7),mat(0x65594a));tr.position.y=.65;g.add(tr);const crown=new T.Mesh(new T.IcosahedronGeometry(.75,1),mat(0x4e5949));crown.position.y=1.7;g.add(crown);g.position.set(X(x),0,Z(y));world.add(g)});
  const billboardLoader=new T.TextureLoader(),desktopBillboards=matchMedia("(min-width: 700px)");
  function faxFallbackTexture(){const c=document.createElement("canvas");c.width=768;c.height=250;const x=c.getContext("2d");x.fillStyle="#ded9cc";x.fillRect(0,0,768,250);x.strokeStyle="#222";x.lineWidth=12;x.strokeRect(6,6,756,238);x.fillStyle="#222";x.textAlign="center";x.font="900 50px Arial";x.fillText("FAX 3000 PRO",384,70);x.font="900 32px Arial";x.fillText("2,75× SCHNELLER",384,124);x.font="700 18px Arial";x.fillText("DIE ZUKUNFT DER DIGITALISIERUNG IST PAPIER",384,195);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx}
  function propLabel(g,text,y=1.25,w=1.7){if(!text)return;const l=label(text,"");l.scale.set(w,.32,1);l.position.set(0,y,.08);g.add(l)}
  function prop(p){
    const g=new T.Group();
    if(p.asset==="faxbillboard"){
      const art=desktopBillboards.matches&&p.billboard,bw=art?4.4:4.8,bh=art?3.3:1.65,tx=faxFallbackTexture(),material=new T.MeshStandardMaterial({map:tx,roughness:.9}),board=new T.Mesh(new T.BoxGeometry(bw,bh,.12),material);
      board.position.y=art?3.5:2.8;g.add(board);[-bw*.35,bw*.35].forEach(v=>box(.1,art?2.3:2.2,.1,M.metal,v,art?1.15:1.1,0,g));
      if(art)billboardLoader.load(art.src,loaded=>{loaded.colorSpace=T.SRGBColorSpace;loaded.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());material.map.dispose();material.map=loaded;material.needsUpdate=true},undefined,()=>{});
    }else if(p.asset==="gartenzwerg"){
      const body=new T.Mesh(new T.ConeGeometry(.22,.65,10),mat(0x6f3c32));body.position.y=.36;g.add(body);const head=new T.Mesh(new T.SphereGeometry(.16,10,7),M.skin);head.position.y=.78;g.add(head);const hat=new T.Mesh(new T.ConeGeometry(.2,.48,10),mat(0x8b2d28));hat.position.y=1.06;g.add(hat);
    }else if(p.asset==="fahrrad"){
      const wheel=new T.TorusGeometry(.34,.045,7,18),rubber=mat(0x242524,.62),a=new T.Mesh(wheel,rubber),b=a.clone();a.position.set(-.42,.38,0);b.position.set(.42,.38,0);g.add(a,b);box(.78,.055,.055,mat(0x5c312c),0,.55,0,g).rotation.z=-.38;box(.55,.055,.055,mat(0x5c312c),0,.62,0,g).rotation.z=.58;
    }else if(["rasen","muell","db","baustelle","polizeigarten"].includes(p.asset)){
      box(.08,1.25,.08,M.metal,0,.625,0,g);box(1.35,.72,.09,p.asset==="baustelle"?mat(0xa9823e):mat(0xd8d1c1),0,1.35,0,g);propLabel(g,p.label||p.asset.toUpperCase(),1.35,1.18);
    }else{
      const h=Math.max(.8,(p.h||54)*S),w=Math.max(.52,(p.w||48)*S);box(w,h,Math.max(.42,w*.55),p.asset.includes("fax")?mat(0xb7b2a7):mat(0x666760),0,h/2,0,g);propLabel(g,p.label||p.asset.toUpperCase(),h*.62,Math.max(.9,w*.92));
    }
    g.position.set(X(p.x),0,Z(p.y));world.add(g);
  }
  bridge.props.forEach(prop);
  function normObject(o){const g=new T.Group(),material=mat(0x6c3d37);if(o.type==="hedge")box(1.35,.72,.55,material,0,.36,0,g);else if(o.type==="chairs"){for(const x of [-.32,.32]){box(.48,.08,.48,material,x,.48,0,g);box(.48,.68,.08,material,x,.78,-.2,g);box(.06,.48,.06,material,x-.16,.24,0,g);box(.06,.48,.06,material,x+.16,.24,0,g)}}else{box(.58,.8,.58,material,0,.4,0,g);box(.66,.09,.66,M.dark,0,.85,0,g)}propLabel(g,o.label,1.18,1.65);g.position.set(X(o.x),0,Z(o.y));g.rotation.y=.08;world.add(g);return{state:o,group:g,material}}
  const normObjectSlots=(bridge.normObjects||[]).map(normObject);
  function character(kind){const g=new T.Group(),m=kind==="player"?M.player:kind==="police"?M.police:kind==="merkel"?M.merkel:M.npc;box(.42,.72,.3,m,0,.72,0,g);const head=new T.Mesh(new T.SphereGeometry(.2,10,7),M.skin);head.position.y=1.3;g.add(head);const lg=new T.CylinderGeometry(.06,.07,.5,8),ag=new T.CylinderGeometry(.05,.06,.48,8),ll=new T.Mesh(lg,m),rl=ll.clone(),la=new T.Mesh(ag,m),ra=la.clone();ll.position.set(-.1,.27,0);rl.position.set(.1,.27,0);la.position.set(-.27,.76,0);ra.position.set(.27,.76,0);g.add(ll,rl,la,ra);g.userData={ll,rl,la,ra};if(kind==="merkel"){const hair=new T.Mesh(new T.SphereGeometry(.22,10,7,0,Math.PI*2,0,Math.PI*.58),mat(0x5d5953));hair.position.y=1.39;g.add(hair)}if(kind==="police"){const cap=new T.Mesh(new T.CylinderGeometry(.21,.21,.08,10),M.dark);cap.position.y=1.52;g.add(cap)}return g}
  function syncChar(q,o,l=0){q.position.set(X(o.x),l,Z(o.y));const ph=performance.now()*.008+(o.x+o.y)*.02,s=Math.sin(ph)*.38;q.userData.ll.rotation.x=s;q.userData.rl.rotation.x=-s;q.userData.la.rotation.x=-s*.7;q.userData.ra.rotation.x=s*.7}
  function atlasSprite(kind,scale){
    const source=bridge.getNpcSpriteCanvas?.(kind),grid=bridge.npcSpriteGrids?.[kind];if(!source||!grid)return null;
    const tx=new T.CanvasTexture(source);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(1/grid.cols,1/grid.rows);
    tx.generateMipmaps=false;tx.minFilter=tx.magFilter=T.LinearFilter;tx.premultiplyAlpha=true;
    const q=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,alphaTest:.02,depthWrite:false,premultipliedAlpha:true}));q.scale.set(scale,scale,1);q.userData={[kind+"Sprite"]:true,grid};return q
  }
  function specialSprite(n){return n.special==="borderPourer"?atlasSprite("borderPourer",2.62):n.special==="merkel"?atlasSprite("merkel",2.42):n.special==="bayern"?atlasSprite("bayern",2.91):n.special==="alice"?atlasSprite("alice",2.42):null}
  function syncAtlasSprite(q,o,height){const tx=q.material.map,grid=q.userData.grid;tx.offset.x=(o.spriteFrame||0)/grid.cols;tx.offset.y=1-((o.spriteRow||0)+1)/grid.rows;q.position.set(X(o.x),height,Z(o.y))}
  function syncMerkel(q,o){syncAtlasSprite(q,o,1.21)}
  function syncBayern(q,o){syncAtlasSprite(q,o,1.455)}
  function syncAlice(q,o){syncAtlasSprite(q,o,1.21)}
  function syncBorderPourer(q,o){
    const tx=q.material.map,grid=q.userData.grid,frame=o.spriteFrame||0,row=o.spriteRow||0,flip=!!o.spriteFlip;
    tx.repeat.x=(flip?-1:1)/grid.cols;tx.repeat.y=1/grid.rows;tx.offset.x=(frame+(flip?1:0))/grid.cols;tx.offset.y=1-(row+1)/grid.rows;
    q.position.set(X(o.x),1.31,Z(o.y));
  }
  function pickup(item){const type=item.type,g=new T.Group();if(type==="pfand"){const m=new T.Mesh(new T.CylinderGeometry(.07,.09,.5,9),mat(0x566153));m.position.y=.25;g.add(m)}else if(item.wurstType){const m=mat(item.color),pieces=item.pieces||1;for(let i=0;i<pieces;i++){const q=new T.Mesh(new T.CapsuleGeometry(.065,.32,4,8),m);q.rotation.z=Math.PI/2;q.position.set(pieces===4?(i-1.5)*.18:0,.2+(i-(pieces-1)/2)*.13,0);g.add(q)}const seal=new T.Mesh(new T.TorusGeometry(.15,.035,8,18),mat(0xe4ddce));seal.rotation.x=Math.PI/2;seal.position.y=.6;g.add(seal)}else{const col=type==="currywurst"?0x805143:type==="bratwurst"?0x9a7653:0x8a694b,m=mat(col),q=new T.Mesh(type==="brezel"?new T.TorusGeometry(.18,.055,8,18):new T.CapsuleGeometry(.08,.4,4,8),m);q.rotation.z=type==="brezel"?0:Math.PI/2;q.position.y=.2;g.add(q)}return g}

  const playerMesh=character("player");scene.add(playerMesh);
  const npcMeshes=new Map(),policeMeshes=new Map(),trafficCarMeshes=new Map(),policeVehicleMeshes=new Map(),policeHelicopterMeshes=new Map(),pickupMeshes=new Map();
  bridge.getNPCs().forEach(n=>{const q=specialSprite(n)||character("npc");scene.add(q);npcMeshes.set(n,q)});
  bridge.pickups.forEach(p=>{const q=pickup(p);scene.add(q);pickupMeshes.set(p,q)});
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
  const spawnProbe=new T.Vector3();
  function isWorldPointVisible(x,y,padding=0,kind="officer"){const height=kind==="helicopter"?6.8:kind==="car"?.7:1;spawnProbe.set(X(x),height,Z(y)).project(camera);const padX=padding/Math.max(1,innerWidth)*2,padY=padding/Math.max(1,innerHeight)*2;return spawnProbe.z>=-1&&spawnProbe.z<=1&&spawnProbe.x>=-1-padX&&spawnProbe.x<=1+padX&&spawnProbe.y>=-1-padY&&spawnProbe.y<=1+padY}
  window.Germany3D={ready:true,isWorldPointVisible,sync(){
    syncChar(playerMesh,bridge.player,0);
    playerMesh.rotation.y=bridge.player.facing;
    for(const slot of trainSlots){for(let i=0;i<slot.cars.length;i++){const car=slot.train.cars[i],group=slot.cars[i].group,jolt=Math.sin(performance.now()*.04+i)*slot.train.bump*.1;group.position.set(X(car.x),.07+jolt,Z(car.y));group.rotation.y=Math.PI/2-car.angle}for(let i=0;i<slot.gangways.length;i++){const a=slot.train.cars[i],b=slot.train.cars[i+1],ax=X(a.x),az=Z(a.y),bx=X(b.x),bz=Z(b.y),mesh=slot.gangways[i],length=Math.hypot(bx-ax,bz-az);mesh.position.set((ax+bx)/2,.54,(az+bz)/2);mesh.rotation.y=Math.atan2(bx-ax,bz-az);mesh.scale.z=Math.max(.18,length-4.64)}}
    const ns=bridge.getNPCs();ns.forEach(n=>{let q=npcMeshes.get(n);if(n.special&&!q?.userData[n.special+"Sprite"]){const sprite=specialSprite(n);if(sprite){if(q)scene.remove(q);q=sprite;scene.add(q);npcMeshes.set(n,q)}}if(!q){q=specialSprite(n)||character("npc");scene.add(q);npcMeshes.set(n,q)}if(q.userData.borderPourerSprite)syncBorderPourer(q,n);else if(q.userData.merkelSprite)syncMerkel(q,n);else if(q.userData.bayernSprite)syncBayern(q,n);else if(q.userData.aliceSprite)syncAlice(q,n);else syncChar(q,n)});for(const [n,q] of npcMeshes)if(!ns.includes(n)){scene.remove(q);npcMeshes.delete(n)}
    const ps=bridge.getPolice();ps.forEach(p=>{let q=policeMeshes.get(p);if(!q){q=character("police");scene.add(q);policeMeshes.set(p,q)}syncChar(q,p,.04)});for(const [p,q] of policeMeshes)if(!ps.includes(p)){scene.remove(q);policeMeshes.delete(p)}
    const traffic=bridge.getTrafficCars?.()||[];traffic.forEach(car=>{let slot=trafficCarMeshes.get(car);if(!slot){slot=makeTrafficCarSlot(car);trafficCarMeshes.set(car,slot)}slot.group.position.set(X(car.x),.07,Z(car.y));slot.group.rotation.y=Math.PI/2-car.angle;slot.tail.color.setHex(car.queued?0xff3026:0x762720)});for(const [car,slot] of trafficCarMeshes)if(!traffic.includes(car)){world.remove(slot.group);trafficCarMeshes.delete(car)}
    const vehicles=bridge.getPoliceVehicles?.()||[];vehicles.forEach(car=>{let slot=policeVehicleMeshes.get(car);if(!slot){slot=makePoliceCarSlot(car);policeVehicleMeshes.set(car,slot)}slot.group.position.set(X(car.x),.07,Z(car.y));slot.group.rotation.y=Math.PI/2-car.angle;const flash=Math.floor(performance.now()/125)%2;slot.lightA.material.color.setHex(flash?0x2f7cff:0x123f99);slot.lightB.material.color.setHex(flash?0x123f99:0x2f7cff)});for(const [car,slot] of policeVehicleMeshes)if(!vehicles.includes(car)){world.remove(slot.group);policeVehicleMeshes.delete(car)}
    const helicopters=bridge.getPoliceHelicopters?.()||[];helicopters.forEach(helicopter=>{let slot=policeHelicopterMeshes.get(helicopter);if(!slot){slot=makePoliceHelicopterSlot(helicopter);policeHelicopterMeshes.set(helicopter,slot)}slot.group.position.set(X(helicopter.x),6.8+Math.sin(performance.now()*.003+helicopter.phase)*.18,Z(helicopter.y));slot.group.rotation.y=Math.PI/2-helicopter.angle;slot.rotor.rotation.y=helicopter.rotor;slot.beam.visible=helicopter.spotlight});for(const [helicopter,slot] of policeHelicopterMeshes)if(!helicopters.includes(helicopter)){world.remove(slot.group);policeHelicopterMeshes.delete(helicopter)}
    bridge.pickups.forEach(p=>{const q=pickupMeshes.get(p);q.visible=!p.taken;if(q.visible){q.position.set(X(p.x),.2,Z(p.y));q.rotation.y+=.012}});
    for(const slot of normObjectSlots){slot.material.color.setHex(slot.state.fixed?0x3f5b43:0x6c3d37);const target=slot.state.fixed?0:.08;slot.group.rotation.y+=(target-slot.group.rotation.y)*.18}
    for(const slot of trafficLightSlots){slot.red.color.setHex(slot.light.green?0x4b2725:0xdf332c);slot.green.color.setHex(slot.light.green?0x36c469:0x284b31)}
    updateFire(performance.now());updateBuildingOcclusion();updatePowerPlants();
    const px=X(bridge.player.x),pz=Z(bridge.player.y);camera.position.set(px,11.5,pz+14);camera.lookAt(px,1,pz-2.7);renderer.render(scene,camera);
  }};
  app.classList.add("three-ready");
})().catch(showRendererFailure);
