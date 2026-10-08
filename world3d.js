const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
const GLTF_LOADER_URL="https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js";
function showRendererFailure(error){
  const app=document.getElementById("app");if(!app)return;document.getElementById("world3d")?.remove();app.classList.add("three-failed");
  let notice=app.querySelector(".render-error");if(!notice){notice=document.createElement("section");notice.className="render-error";notice.innerHTML="<b>3D-RENDERER NICHT VERFÜGBAR</b><p>Germany Simulator benötigt WebGL und konnte die 3D-Welt nicht laden.</p><button type=\"button\">NEU LADEN</button>";notice.querySelector("button").onclick=()=>location.reload();app.append(notice)}
  console.error("3D renderer unavailable",error);
}
(async()=>{
  const app=document.getElementById("app");if(!app)return;
  const amtDirectRoute=new URLSearchParams(location.search).get("geheim")==="buergeramt";
  const canvas=document.createElement("canvas");canvas.id="world3d";Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"3",pointerEvents:"none",background:"#77756f"});app.prepend(canvas);
  let T;try{T=await import(THREE_URL)}catch(e){showRendererFailure(e);return}
  let GLTFLoader=null;if(!amtDirectRoute)try{({GLTFLoader}=await import(GLTF_LOADER_URL))}catch(e){console.warn("GLB models unavailable; procedural 3D stand-ins remain active",e)}
  const bridge=await new Promise(resolve=>{let n=0;const f=()=>window.Germany3DBridge?resolve(window.Germany3DBridge):(++n>120?resolve(null):setTimeout(f,50));f()});if(!bridge){showRendererFailure(new Error("3D simulation bridge unavailable"));return}
  const S=.02,H=.038,ox=bridge.WORLD.w*S/2,oz=bridge.WORLD.h*S/2,X=x=>x*S-ox,Z=y=>y*S-oz;
  const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:"default"});renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();scene.background=new T.Color(0x77756f);scene.fog=new T.Fog(0x77756f,24,72);
  const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,150),initialPlayerX=X(bridge.player.x),initialPlayerZ=Z(bridge.player.y);camera.position.set(initialPlayerX,11.5,initialPlayerZ+14);camera.lookAt(initialPlayerX,1,initialPlayerZ-2.7);scene.add(new T.HemisphereLight(0xe4e0d6,0x454440,2.3));const sun=new T.DirectionalLight(0xf4f1e8,1.4);sun.position.set(-20,30,18);scene.add(sun);
  const mat=(c,r=1)=>new T.MeshStandardMaterial({color:c,roughness:r});
  const M={ground:mat(0x89867f),road:mat(0x555552),walk:mat(0xaaa69d),cross:mat(0xd2cdc0),grass:mat(0x68705e),path:mat(0xa9a59b),border:mat(0xb8aa8e),wall:mat(0x3a3935),dark:mat(0x333432),win:mat(0x414544,.55),metal:mat(0x505252,.7),blue:mat(0x1f4d79,.8),skin:mat(0xcabca8),npc:mat(0x55524d),player:mat(0x242424),police:mat(0x303943),merkel:mat(0x77746d)};
  // Small, repeatable authoring-free surfaces; UVs stay in world units at junctions.
  function streetTexture(paving){
    const c=document.createElement("canvas");c.width=c.height=256;const ctx=c.getContext("2d");let seed=731;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    ctx.fillStyle=paving?"#b8b5ac":"#a3a3a0";ctx.fillRect(0,0,256,256);
    for(let i=0;i<6500;i++){const v=Math.floor((paving?145:115)+random()*75);ctx.fillStyle=`rgba(${v},${v},${v},.27)`;ctx.fillRect(random()*256,random()*256,1+random()*2,1+random()*2)}
    if(paving){ctx.strokeStyle="#8d8c86";ctx.lineWidth=2;for(let y=0;y<=256;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();for(let x=(y/64%2)*64;x<=256;x+=128){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+64);ctx.stroke()}}}
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return tx;
  }
  M.road.map=streetTexture(false);M.road.userData.tileSize=2;
  M.walk.map=M.path.map=streetTexture(true);M.walk.userData.tileSize=M.path.userData.tileSize=1.6;
  const world=new T.Group();scene.add(world);
  const modelLoader=GLTFLoader?new GLTFLoader():null;
  const cityModelJobs=[],startupModelJobs=new Set();
  let cityModelActive=0,startupModelsCaptured=false,lastCityAdmission=-Infinity;
  const assetViewFrustum=new T.Frustum(),assetViewMatrix=new T.Matrix4(),assetViewSphere=new T.Sphere();
  function updateAssetView(){camera.updateMatrixWorld();assetViewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);assetViewFrustum.setFromProjectionMatrix(assetViewMatrix)}
  function isCityAssetVisible(job){
    const positions=job.owner?.train?.cars?.map(car=>({x:X(car.x),z:Z(car.y)}))||[job.position(X(bridge.player.x),Z(bridge.player.y))];
    return positions.some(position=>{assetViewSphere.center.set(position.x,4,position.z);assetViewSphere.radius=job.radius+8;return assetViewFrustum.intersectsSphere(assetViewSphere)})
  }
  function cityModelsEnabled(){return !amtDirectRoute&&!document.hidden&&!window.BuergeramtLevel?.active&&!document.body.classList.contains("amt-direct-mode")}
  function cityModelDistance(job,x=X(bridge.player.x),z=Z(bridge.player.y)){
    const position=job.position(x,z);return Math.max(0,Math.hypot(position.x-x,position.z-z)-job.radius);
  }
  function queueCityAsset(position,radius,task,owner=null){
    const job={position,radius,task,owner,state:"pending",failed:false};cityModelJobs.push(job);
    return job;
  }
  function queueCityModel(...args){if(modelLoader)return queueCityAsset(...args)}
  function captureStartupAssets(){updateAssetView();if(!amtDirectRoute)for(const job of cityModelJobs)if(cityModelDistance(job,initialPlayerX,initialPlayerZ)<=30||isCityAssetVisible(job))startupModelJobs.add(job)}
  function startupModelsReady(){return startupModelsCaptured&&[...startupModelJobs].every(job=>job.state==="settled")}
  function prepareNearbyAssets(){
    if(!cityModelsEnabled())return;
    const now=performance.now();if(startupModelsReady()&&now-lastCityAdmission<250)return;lastCityAdmission=now;updateAssetView();
    for(let i=cityModelJobs.length-1;i>=0;i--){const job=cityModelJobs[i];if(job.owner?.retired&&job.state!=="active"){job.state="settled";job.task=job.position=job.owner=null;cityModelJobs.splice(i,1)}}
    // ponytail: a fixed authored city needs one spatial scan, not a second loader loop or streaming framework.
    const nearby=cityModelJobs.filter(job=>job.state==="pending"&&!job.owner?.retired&&(cityModelDistance(job)<=30||isCityAssetVisible(job)));
    if(bridge.preparingStart)for(const job of nearby)startupModelJobs.add(job);
    nearby.sort((a,b)=>Number(startupModelJobs.has(b))-Number(startupModelJobs.has(a))||cityModelDistance(a)-cityModelDistance(b));
    for(const job of nearby){
      if(cityModelActive>=2)break;
      cityModelActive++;job.state="active";
      const run=()=>{
        if(!cityModelsEnabled()||job.owner?.retired){job.state=job.owner?.retired?"settled":"pending";return false}
        return job.task();
      };
      const loaded=bridge.queueAssetLoad?bridge.queueAssetLoad(run):Promise.resolve().then(run);
      loaded.then(ok=>{if(job.state==="active"){job.state="settled";job.failed=!ok;job.task=null}},error=>{job.state="settled";job.failed=true;job.task=null;console.warn("Keeping procedural city asset",error)}).finally(()=>{
        cityModelActive--;
        // Before Start, finish the selected neighborhood. During play, only the existing admission tick starts new work.
        if(!startupModelsReady())prepareNearbyAssets();
      });
    }
    if(startupModelsReady()){
      const office=bridge.buildings.find(b=>b.id==="buergeramt");
      if(office&&Math.hypot(bridge.player.x-office.doorX,bridge.player.y-office.doorY)<1500)loadAmtImages();
    }
  }

  const box=(w,h,d,m,x,y,z,p=world)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q};
  const plane=(w,d,m,x,z,y=.002)=>{const q=new T.Mesh(new T.PlaneGeometry(w,d),m),tile=m.userData.tileSize;if(tile){const uv=q.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x-w/2+uv.getX(i)*w)/tile,(z-d/2+(1-uv.getY(i))*d)/tile)}q.rotation.x=-Math.PI/2;q.position.set(x,y,z);world.add(q);return q};
  function staticBoxes(name,material,parts){
    if(!parts.length)return;const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,parts.length),dummy=new T.Object3D();mesh.name=name;
    parts.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.computeBoundingSphere();world.add(mesh);
  }
  const rect=(r,m,y=.005)=>plane(r.w*S,r.h*S,m,X(r.x+r.w/2),Z(r.y+r.h/2),y);
  plane(bridge.WORLD.w*S,bridge.WORLD.h*S,M.ground,0,0,0);
  const sidewalk=bridge.SIDEWALK_WIDTH||28;
  // The simulation owns these physical entry/exit roads. Follow its smooth
  // platform elevations instead of drawing cars over an invisible corridor.
  for(const road of bridge.vehicleApproaches||[]){
    const positions=[],uv=[],indices=[],segments=Math.ceil(road.w/25),tile=M.road.userData.tileSize;
    for(let i=0;i<=segments;i++){
      const x=road.x+road.w*i/segments;
      for(const y of [road.y,road.y+road.h]){
        positions.push(X(x),(bridge.vehicleElevation?.(x,y)||0)+.016,Z(y));
        uv.push(X(x)/tile,Z(y)/tile);
      }
      if(i<segments){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2)}
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,M.road);mesh.name="Vehicle approach / "+road.side+" / "+road.roadIndex;world.add(mesh);
  }
  bridge.roads.forEach(r=>rect({x:r.x-sidewalk,y:r.y-sidewalk,w:r.w+sidewalk*2,h:r.h+sidewalk*2},M.walk,.008));
  (bridge.grassAreas||[]).forEach(r=>rect(r,M.grass,.011));(bridge.walkways||[]).forEach(r=>rect(r,M.path,.014));
  const kerbs=[],markings=[],drains=[],grates=[],inside=(r,x,y,pad=0)=>x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad;
  bridge.roads.forEach(r=>{
    rect(r,M.road,.015);const horizontal=r.w>r.h,total=horizontal?r.w:r.h;
    for(let p=55;p<total-55;p+=110){const x=horizontal?r.x+p:r.x+r.w/2,y=horizontal?r.y+r.h/2:r.y+p;
      if(bridge.roads.some(other=>other!==r&&inside(other,x,y,28))||bridge.crossings.some(c=>inside(c,x,y,28)))continue;
      markings.push([X(x),.031,Z(y),horizontal?1.05:.055,.012,horizontal?.055:1.05]);
    }
    for(const side of [-1,1])for(let p=26;p<total-26;p+=52){const x=horizontal?r.x+p:r.x+(side<0?-3:r.w+3),y=horizontal?r.y+(side<0?-3:r.h+3):r.y+p;
      // Dropped kerbs at crossings and no kerbs through intersecting carriageways.
      if(bridge.roads.some(other=>other!==r&&inside(other,x,y,10))||bridge.crossings.some(c=>inside(c,x,y,30)))continue;
      kerbs.push([X(x),.048,Z(y),horizontal?1.01:.12,.07,horizontal?.12:1.01]);
      if(p%624!==26)continue;const gx=X(x)+(horizontal?0:-side*.19),gz=Z(y)+(horizontal?-side*.19:0);
      drains.push([gx,.031,gz,horizontal?.45:.27,.024,horizontal?.27:.45]);
      for(let j=-2;j<=2;j++)grates.push([gx+(horizontal?j*.075:0),.046,gz+(horizontal?0:j*.075),horizontal?.026:.23,.012,horizontal?.23:.026]);
    }
  });
  staticBoxes("Road markings",M.cross,markings);staticBoxes("Stone kerbs",M.walk,kerbs);staticBoxes("Storm drains",M.dark,drains);staticBoxes("Drain grilles",M.metal,grates);
  bridge.crossings.forEach(c=>{const surface=bridge.stationElevation(c.x+c.w/2,c.y+c.h/2);for(let i=0;i<8;i+=2){const h=c.w>c.h,f=(i+1)/8;box(h?c.w*S/8*.72:c.w*S,.025,h?c.h*S:c.h*S/8*.72,M.cross,X(c.x+c.w*(h?f:.5)),surface+.04,Z(c.y+c.h*(h?.5:f)))}});rect(bridge.schreber,M.grass,.02);rect(bridge.policeGarden,M.grass,.021);
  const railMaterial=mat(0x343532,.58),sleeperMaterial=mat(0x594f43,.94);
  for(const loop of bridge.railLoops||[]){
    for(const side of [-1,1]){const points=loop.samples.map(p=>new T.Vector3(X(p.x-Math.sin(p.angle)*11*side),.075,Z(p.y+Math.cos(p.angle)*11*side))),curve=new T.CatmullRomCurve3(points,true,"centripetal");world.add(new T.Mesh(new T.TubeGeometry(curve,points.length,.035,4,true),railMaterial))}
    for(let i=0;i<loop.samples.length;i+=3){const p=loop.samples[i],sleeper=box(.88,.035,.13,sleeperMaterial,X(p.x),.045,Z(p.y));sleeper.rotation.y=Math.PI/2-p.angle}
  }
  const particleVertex=`
    attribute vec4 params;
    uniform float uTime,uPixelScale,uRise,uWobble,uWind,uSmoke,uFadeStart;
    varying float vAge,vOpacity;
    void main(){
      float age=fract(uTime/params.x+params.y);
      vec3 p=position;
      p.y+=uRise*age*(.75+.5*params.w);
      p.x+=(sin(uTime*(2.4+params.w*2.)+params.w*31.)+sin(age*9.+params.w*47.)*.5)*uWobble*age+uWind*age*age;
      p.z+=cos(uTime*2.1+params.w*29.)*uWobble*.4*age;
      vec4 eye=modelViewMatrix*vec4(p,1.);
      gl_Position=projectionMatrix*eye;
      float growth=mix(1.-age*.35,.72+age*1.1,uSmoke);
      gl_PointSize=clamp(params.z*growth*uPixelScale/max(1.,-eye.z),1.,64.);
      vAge=age;
      vOpacity=smoothstep(0.,.12,age)*(1.-smoothstep(uFadeStart,1.,age));
    }`;
  const particleFragment=`
    uniform sampler2D uMask;
    uniform vec4 uCrop;
    uniform vec3 uHot,uCool;
    uniform float uOpacity;
    varying float vAge,vOpacity;
    void main(){
      float shape=texture2D(uMask,uCrop.xy+gl_PointCoord*uCrop.zw).g;
      float alpha=shape*vOpacity*uOpacity;
      if(alpha<.008)discard;
      gl_FragColor=vec4(mix(uCool,uHot,pow(1.-vAge,1.5)),alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const particleRandom=(i,salt)=>{const n=Math.sin((i+1)*127.1+salt*311.7)*43758.5453;return n-Math.floor(n)};
  const particleLayer=(count,texture,{spreadX,spreadZ,baseY,life,size,rise,wobble,wind,opacity,hot,cool,fadeStart,smoky=false,crop=[0,0,1,1],blending=T.NormalBlending,positionAt})=>{
    const positions=new Float32Array(count*3),params=new Float32Array(count*4);
    for(let i=0;i<count;i++){positions.set(positionAt?positionAt(i):[(particleRandom(i,1)*2-1)*spreadX,baseY+particleRandom(i,2)*.16,(particleRandom(i,3)*2-1)*spreadZ],i*3);params.set([life[0]+particleRandom(i,4)*life[1],(i+particleRandom(i,5)*.7)/count,size[0]+particleRandom(i,6)*size[1],particleRandom(i,7)],i*4)}
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.BufferAttribute(positions,3));geometry.setAttribute("params",new T.BufferAttribute(params,4));
    const material=new T.ShaderMaterial({uniforms:{uTime:{value:0},uPixelScale:{value:1},uRise:{value:rise},uWobble:{value:wobble},uWind:{value:wind},uSmoke:{value:smoky?1:0},uFadeStart:{value:fadeStart},uMask:{value:texture},uCrop:{value:new T.Vector4(...crop)},uHot:{value:new T.Color(hot)},uCool:{value:new T.Color(cool)},uOpacity:{value:opacity}},vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,depthWrite:false,blending});
    const points=new T.Points(geometry,material);points.frustumCulled=false;return points;
  };
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
  const billboardLoader=new T.TextureLoader(),fireMaskStatus={loaded:0,failed:0},fireReadyListeners=[];
  function cityTexture(url,position,radius,onLoad,onError){
    const texture=new T.Texture();
    queueCityAsset(position,radius,()=>new Promise(resolve=>billboardLoader.load(url,loaded=>{
      texture.image=loaded.image;texture.needsUpdate=true;onLoad?.(texture);resolve(true);
    },undefined,error=>{onError?.(error);resolve(false)})));
    return texture;
  }
  const fireAssetSites=[...bridge.fireSources,...(bridge.props||[]).filter(p=>p.asset==="dumpster-fire")];
  const nearestFireAsset=(x,z)=>fireAssetSites.reduce((nearest,site)=>{const position={x:X(site.x),z:Z(site.y)};return !nearest||Math.hypot(position.x-x,position.z-z)<Math.hypot(nearest.x-x,nearest.z-z)?position:nearest},null);
  const fireReady=fn=>{fireReadyListeners.push(fn);if(fireMaskStatus.loaded===2)fn()};
  const maskLoaded=()=>{if(++fireMaskStatus.loaded===2)fireReadyListeners.forEach(fn=>fn())},maskFailed=()=>{fireMaskStatus.failed++};
  const flameMask=cityTexture("./assets/fire/kenney-flame-01.png",nearestFireAsset,1,maskLoaded,maskFailed);
  const coreMask=cityTexture("./assets/fire/kenney-flame-05.png",nearestFireAsset,1,maskLoaded,maskFailed);
  for(const texture of [flameMask,coreMask]){texture.generateMipmaps=false;texture.minFilter=T.LinearFilter}
  const lineFire=new T.Group(),lineParticleLayers=[],pointsPerSource=innerWidth<700?[6,4]:[8,5],sourceSpan=bridge.WORLD.w*S/fireCount;
  const linePosition=(perSource,i)=>{const f=bridge.fireSources[Math.floor(i/perSource)];return f.active?[X(f.x)+(particleRandom(i,1)*2-1)*sourceSpan*.53,.08+particleRandom(i,2)*.18,Z(f.y)+(particleRandom(i,3)*2-1)*.22]:[0,-1000,0]};
  lineParticleLayers.push(particleLayer(fireCount*pointsPerSource[0],flameMask,{positionAt:i=>linePosition(pointsPerSource[0],i),life:[1.05,.72],size:[1.3,.7],rise:2.6,wobble:.24,wind:.04,opacity:.82,hot:0xff7b22,cool:0xb82b12,fadeStart:.62}));
  lineParticleLayers.push(particleLayer(fireCount*pointsPerSource[1],coreMask,{positionAt:i=>linePosition(pointsPerSource[1],i),life:[.76,.56],size:[.9,.5],rise:2.15,wobble:.17,wind:.03,opacity:.7,hot:0xffd26a,cool:0xf04b18,fadeStart:.52,crop:[.32,.17,.36,.66],blending:T.AdditiveBlending}));
  lineFire.add(...lineParticleLayers);lineFire.visible=false;world.add(lineFire);
  fireReady(()=>{lineFire.visible=true;firePlaneA.visible=firePlaneB.visible=false});
  const emberLayers=innerWidth<700?1:2,emberCount=fireCount*emberLayers,emberPositions=new Float32Array(emberCount*3),emberGeometry=new T.BufferGeometry();emberGeometry.setAttribute("position",new T.BufferAttribute(emberPositions,3));
  const fireEmbers=new T.Points(emberGeometry,new T.PointsMaterial({color:0xe0a05c,size:.075,transparent:true,opacity:.72,depthWrite:false}));fireEmbers.frustumCulled=false;world.add(fireEmbers);
  function updateFire(now,pixelScale){
    const sources=bridge.fireSources,nearLine=Math.abs(bridge.player.y-bridge.BORDER_Y)<1900;
    for(const layer of lineParticleLayers){layer.material.uniforms.uTime.value=now*.001;layer.material.uniforms.uPixelScale.value=pixelScale}
    if(firePlaneA.visible){
      for(let i=0;i<sources.length;i++){
        const f=sources[i],visible=f.active&&nearLine&&Math.abs(f.x-bridge.player.x)<1900,wave=.9+Math.sin(now*.005+f.seed*19)*.12,scale=visible?f.intensity*wave:0;
        fireDummy.position.set(X(f.x),.03,Z(f.y));fireDummy.rotation.set(0,0,Math.sin(now*.003+f.seed*11)*.045);fireDummy.scale.set(scale,scale*(.9+Math.sin(now*.007+f.seed*7)*.1),scale);fireDummy.updateMatrix();firePlaneA.setMatrixAt(i,fireDummy.matrix);
        fireDummy.rotation.set(0,Math.PI/2,Math.sin(now*.0037+f.seed*13)*.04);fireDummy.updateMatrix();firePlaneB.setMatrixAt(i,fireDummy.matrix);
      }
      firePlaneA.instanceMatrix.needsUpdate=firePlaneB.instanceMatrix.needsUpdate=true;
    }
    for(let i=0;i<emberCount;i++){
      const sourceIndex=Math.floor(i/emberLayers),layer=i%emberLayers,f=sources[sourceIndex],visible=f.active&&nearLine&&Math.abs(f.x-bridge.player.x)<1900,rise=(now*.00022+f.seed+layer*.47)%1,j=i*3;
      emberPositions[j]=visible?X(f.x)+Math.sin(now*.002+f.seed*21+layer)*.18:0;emberPositions[j+1]=visible?.25+rise*1.9:-100;emberPositions[j+2]=visible?Z(f.y)+Math.cos(now*.0017+f.seed*17+layer)*.13:0;
    }
    emberGeometry.attributes.position.needsUpdate=true;
  }
  const pp=bridge.policePath,ax=X(pp.x1),az=Z(pp.y1),bx=X(pp.x2),bz=Z(pp.y2),len=Math.hypot(bx-ax,bz-az),path=box(pp.width*S,.03,len,M.path,(ax+bx)/2,.04,(az+bz)/2);path.rotation.y=Math.atan2(bx-ax,bz-az);
  function label(a,b,bg="#ded9cc",fg="#222"){const c=document.createElement("canvas");c.width=768;c.height=150;const g=c.getContext("2d");g.fillStyle=bg;g.fillRect(0,0,768,150);g.fillStyle=fg;g.textAlign="center";g.font="900 42px Arial";g.fillText(a,384,65);g.font="700 20px Arial";g.fillText(b||"",384,112);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tx}));s.scale.set(4.6,.9,1);return s}
  const placardFontLoad=()=>new FontFace("PlacardGrenze","url(./assets/fonts/grenze/Grenze.ttf)",{weight:"100 900"}).load();
  const placardLayouts=[],placardFontReady=typeof FontFace==="undefined"?Promise.resolve(false):(bridge.queueAssetLoad?bridge.queueAssetLoad(placardFontLoad):placardFontLoad()).then(font=>{document.fonts.add(font);return true}).catch(()=>false);
  function buildingPlacard(b,w,x,y,z){
    const canvas=document.createElement("canvas"),mobile=innerWidth<700;canvas.width=mobile?512:768;canvas.height=mobile?128:192;
    const ctx=canvas.getContext("2d");ctx.setTransform(canvas.width/768,0,0,canvas.height/192,0,0);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const width=Math.min(2.65,w*.52,Math.max(1.8,1.65+b.name.length*.045));
    const sign=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    sign.scale.set(width,width/4,1);sign.position.set(x,y,z);
    const image=new Image(),layout={id:b.id,textureWidth:canvas.width,artReady:false,fontReady:false,titleWidth:0,titleMaxWidth:530,titleLines:0,worldWidth:width,worldHeight:width/4,x,y,z,facadeWidth:w};placardLayouts.push(layout);let artReady=false,fontReady=false;
    const titleParts={auslaender:["AUSLÄNDER","BEHÖRDE"],formulararchiv:["BUNDES","FORMULARARCHIV"],terminamt:["TERMIN","VERGABESTELLE"],querungsamt:["STRASSEN","QUERUNGSAMT"],sockenladen:["SOCKENFACH","GESCHÄFT"],laermamt:["AMT FÜR ZIMMER","LAUTSTÄRKE"]};
    function linesFor(text,weight,oneSize,twoSize,smallest,forced){
      const family=fontReady?'"PlacardGrenze"':'"Grenze",Georgia,serif',words=text.split(/\s+/);
      if(!forced)for(let px=oneSize;px>=Math.max(smallest,oneSize-22);px--){ctx.font=`${weight} ${px}px ${family}`;if(ctx.measureText(text).width<=530)return {parts:[text],px}}
      const candidates=forced?[forced]:words.slice(1).map((_,i)=>[words.slice(0,i+1).join(" "),words.slice(i+1).join(" ")]);
      for(let px=twoSize;px>=smallest;px--){
        ctx.font=`${weight} ${px}px ${family}`;
        const fitting=candidates.filter(parts=>parts.every(part=>ctx.measureText(part).width<=530));
        if(fitting.length){fitting.sort((a,b)=>Math.max(...a.map(x=>ctx.measureText(x).width))-Math.max(...b.map(x=>ctx.measureText(x).width)));return {parts:fitting[0],px}}
      }
      for(let px=smallest;px>=14;px--){ctx.font=`${weight} ${px}px ${family}`;if(ctx.measureText(text).width<=530)return {parts:[text],px}}
      return {parts:[text],px:14};
    }
    function draw(){
      ctx.clearRect(0,0,768,192);
      ctx.fillStyle="#e8dfcb";ctx.fillRect(0,0,768,192);
      if(artReady){ctx.save();ctx.beginPath();ctx.rect(18,18,154,156);ctx.clip();ctx.drawImage(image,8,16,224,224,18,18,154,156);ctx.restore()}
      ctx.strokeStyle="#2f2923";ctx.lineWidth=8;ctx.strokeRect(5,5,758,182);
      ctx.strokeStyle="#8b392d";ctx.lineWidth=3;ctx.strokeRect(12,12,744,168);
      ctx.fillStyle="#4c4439";for(const bolt of [23,745]){ctx.beginPath();ctx.arc(bolt,96,4,0,Math.PI*2);ctx.fill()}
      ctx.fillStyle="#8b392d";ctx.fillRect(184,24,3,144);
      ctx.fillStyle="#231b16";ctx.textAlign="center";ctx.textBaseline="middle";
      const family=fontReady?'"PlacardGrenze"':'"Grenze",Georgia,serif';
      const title=linesFor(b.name,900,70,59,29,titleParts[b.id]);
      ctx.font=`900 ${title.px}px ${family}`;
      layout.titleWidth=Math.max(...title.parts.map(part=>ctx.measureText(part).width));
      layout.titleLines=title.parts.length;
      const titleYs=title.parts.length===1?[97]:[68,124];
      title.parts.forEach((part,i)=>ctx.fillText(part,465,titleYs[i],530));
      texture.needsUpdate=true;
    }
    draw();queueCityAsset(()=>({x:X(b.x+b.w/2),z:Z(b.y+b.h/2)}),Math.hypot(b.w*S,b.h*S)/2,()=>new Promise(resolve=>{
      image.onload=()=>{artReady=layout.artReady=true;draw();resolve(true)};image.onerror=()=>resolve(false);image.src=`./assets/building-placards/${b.id}.webp`;
    }));
    placardFontReady.then(ready=>{fontReady=layout.fontReady=ready;draw()});
    return sign;
  }
  function bearingShopSign(w,d){
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=176;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#fff0d4";ctx.fillRect(0,0,1024,176);
    ctx.fillStyle="#f36b17";ctx.fillRect(0,0,1024,13);ctx.fillRect(0,163,1024,13);
    ctx.fillStyle="#db2865";ctx.fillRect(0,13,177,150);
    ctx.strokeStyle="#fff0d4";ctx.lineWidth=10;
    for(const radius of [58,29]){ctx.beginPath();ctx.arc(88,88,radius,0,Math.PI*2);ctx.stroke()}
    for(let i=0;i<8;i++){const angle=i*Math.PI/4;ctx.beginPath();ctx.arc(88+43*Math.cos(angle),88+43*Math.sin(angle),8,0,Math.PI*2);ctx.fillStyle="#fff0d4";ctx.fill()}
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#dc2865";ctx.font="900 55px Arial,sans-serif";ctx.fillText("KRÜGERS",590,58,770);
    ctx.fillStyle="#3f2626";ctx.font="900 73px Arial,sans-serif";ctx.fillText("KUGELLAGER",590,124,770);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    sign.scale.set(Math.min(5.3,w*.91),.64,1);sign.position.set(0,1.76,d/2+.35);return sign;
  }
  function stationPlatform(s){
    const g=new T.Group(),length=Math.max(s.w,s.h)*S,depth=Math.min(s.w,s.h)*S,edge=-depth/2,back=depth/2-.52,stone=mat(0xb9b7ae),yellow=mat(0xc8ad63),glass=new T.MeshStandardMaterial({color:0xabc1c6,roughness:.18,transparent:true,opacity:.38,depthWrite:false,side:T.DoubleSide});
    const throughRoad=(bridge.vehicleApproaches||[]).find(r=>r.side===s.side&&r.y>=s.y&&r.y+r.h<=s.y+s.h),passHalf=throughRoad?throughRoad.h*S/2:0;
    g.position.set(X(s.x+s.w/2),0,Z(s.y+s.h/2));g.rotation.y=s.side==="west"?Math.PI/2:s.side==="east"?-Math.PI/2:s.side==="south"?Math.PI:0;world.add(g);
    box(length,.3,depth,stone,0,.15,0,g);
    const edgeParts=passHalf?[-1,1].map(side=>({width:length/2-passHalf,x:side*(length/4+passHalf/2)})):[{width:length,x:0}];
    for(const part of edgeParts){box(part.width,.08,.12,M.cross,part.x,.34,edge,g);box(part.width,.025,.25,yellow,part.x,.39,edge+.29,g)}
    for(let i=-Math.floor(length/2);i<=Math.floor(length/2);i++)if(!passHalf||Math.abs(i)>passHalf+.03)box(.035,.027,.25,M.dark,i,.41,edge+.29,g);
    if(!passHalf)for(let step=0;step<3;step++){const top=.3-step*.1;box(2.8,top,.4,stone,0,top/2,depth/2+.2+step*.4,g);box(2.8,.025,.06,M.cross,0,top+.013,depth/2+.39+step*.4,g)}
    const canopy=Math.min(7,length*.43);box(canopy,.14,1.45,glass,0,2.65,back,g);
    for(const px of [-canopy/2+.18,canopy/2-.18])for(const pz of [-.54,.54])box(.08,2.35,.08,M.metal,px,1.48,back+pz,g);
    for(const side of [-1,1]){const x=side*(canopy/2-.18);box(.06,1.36,1.08,glass,x,1.55,back,g);box(.07,.07,1.08,M.metal,x,2.23,back,g)}
    const benches=passHalf?bridge.props.filter(p=>p.stationId===s.id&&p.fallbackOnly&&p.type==="bench").map(p=>({x:(p.y-s.y-s.h/2)*S*(s.side==="west"?-1:1),z:(p.x-s.x-s.w/2)*S*(s.side==="west"?1:-1)})):[{x:-canopy*.28,z:back},{x:canopy*.28,z:back}];
    for(const {x:dx,z} of benches){box(1.13,.08,.38,M.metal,dx,.66,z,g);box(1.13,.45,.07,M.metal,dx,.92,z+.2,g);for(const leg of [-.42,.42])box(.06,.36,.06,M.metal,dx+leg,.44,z,g)}
    const board=label("ZUGVERSPÄTUNG",`BAHNHOF ${s.name} · GLEIS 1`,"#16558b","#f6f6f3");board.scale.set(Math.min(4,length*.3),.72,1);board.position.set(0,3.14,back);g.add(board);
    for(const side of [-1,1]){const x=side*(length/2-1);box(.07,1.9,.07,M.metal,x,1.25,back,g);const sign=label("AMT-BAHN",side<0?"GLEIS 1 · +35 MIN":"ABFAHRT UNBESTIMMT","#16558b","#f6f6f3");sign.scale.set(2.45,.54,1);sign.position.set(x,2.45,back);g.add(sign)}
    const clockFace=new T.Mesh(new T.CircleGeometry(.26,24),M.cross);clockFace.position.set(-canopy*.58,2.47,back+.58);g.add(clockFace);const clockRim=new T.Mesh(new T.TorusGeometry(.27,.03,6,24),M.dark);clockRim.position.copy(clockFace.position);g.add(clockRim);box(.02,.17,.02,M.dark,clockFace.position.x,2.51,clockFace.position.z+.02,g);
    box(.48,1.18,.4,M.metal,canopy*.61,.9,back,g);box(.32,.43,.025,M.dark,canopy*.61,1.16,back+.22,g);
  }
  const stationSlots=(bridge.stations||[]).map(state=>{
    const before=new Set(world.children);stationPlatform(state);
    const fallback=new T.Group();fallback.name="Original station / "+state.id;
    for(const child of [...world.children])if(!before.has(child))fallback.add(child);
    world.add(fallback);return{state,fallback,model:null,fixtures:bridge.props.filter(p=>p.stationFixture&&!p.fallbackOnly&&p.stationId===state.id)};
  });
  function makeWirtschaftswunderSite(site){
    if(!site)return null;
    const centerX=X(site.x),centerZ=Z(site.y),mouth=site.radius*S,gravel=mat(0x494846,.98),yellow=mat(0xd4a72c,.82),black=mat(0x171817,.68),red=mat(0xa6382f,.8),white=mat(0xe2ddd1,.88);
    plane(site.siteW*S,site.siteH*S,gravel,centerX,centerZ,.021);
    const feeder=bridge.roads[site.roadIndex],startX=X(site.entryX),startZ=Z(feeder.y+feeder.h*.5),endX=X(site.x+site.radius*.92),endZ=Z(site.y+site.radius*.42),length=Math.hypot(endX-startX,endZ-startZ),access=box(1.6,.026,length,gravel,(startX+endX)/2,.028,(startZ+endZ)/2);access.rotation.y=Math.atan2(endX-startX,endZ-startZ);
    const vertexShader="uniform float uTime;uniform float uLayer;uniform float uImpact;varying vec2 vUv;void main(){vUv=uv;vec2 p=(uv-.5)*2.0;float r=length(p),edge=1.0-smoothstep(.76,1.0,r);vec3 q=position;float ripple=sin(r*31.0-uTime*7.2+uLayer*1.7)+.55*sin(r*53.0+uTime*4.8-uLayer);q.z+=ripple*edge*(.065+.026*uLayer)+uImpact*sin(r*72.0-uTime*15.0)*edge*.19;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.0);}",fragmentShader="uniform float uTime;uniform float uLayer;uniform float uOpacity;uniform float uImpact;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.0;float r=length(p);if(r>1.0)discard;float a=atan(p.y,p.x),spin=uTime*(8.8+uLayer*2.8),arm=sin(a*8.0-r*38.0+spin),wake=sin(r*68.0-spin*1.45+a*2.0),ring=.5+.5*sin(r*73.0-uTime*8.4+uLayer*2.1),groove=smoothstep(-.52,.74,arm*.68+wake*.32),rim=smoothstep(.62,.98,r),shade=(.008+.105*groove+.038*ring+.13*uImpact*ring)*pow(r,.58);vec3 color=vec3(shade*.4,shade*.47,shade*.58)+rim*.022+uImpact*vec3(.055,.09,.15)*ring;color*=smoothstep(.045,.27,r);float alpha=(1.0-smoothstep(.96,1.0,r))*uOpacity;gl_FragColor=vec4(color,alpha);}";
    const layers=[1,.81,.61].map((scale,index)=>{const material=new T.ShaderMaterial({uniforms:{uTime:{value:0},uLayer:{value:index},uOpacity:{value:index ? .58 : 1},uImpact:{value:0}},vertexShader,fragmentShader,transparent:index>0,depthWrite:index===0,side:T.DoubleSide}),mesh=new T.Mesh(new T.PlaneGeometry(mouth*2,mouth*2,48,48),material);mesh.rotation.x=-Math.PI/2;mesh.scale.setScalar(scale);mesh.position.set(centerX,.036+index*.022,centerZ);mesh.renderOrder=3+index;world.add(mesh);return{mesh,material,index,scale}});
    const rim=new T.Mesh(new T.TorusGeometry(mouth*.985,.12,10,72),black);rim.rotation.x=Math.PI/2;rim.position.set(centerX,.075,centerZ);world.add(rim);
    const funnel=new T.Mesh(new T.CylinderGeometry(mouth*.98,mouth*.08,1.35,72,1,true),new T.MeshBasicMaterial({color:0x020303,side:T.DoubleSide,transparent:true,opacity:.92,depthWrite:false}));funnel.position.set(centerX,-.58,centerZ);funnel.renderOrder=2;world.add(funnel);
    const lightning=new T.Group(),bolts=[];lightning.position.set(centerX,.06,centerZ);lightning.visible=false;for(let index=0;index<5;index++){const positions=new Float32Array(24),geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.BufferAttribute(positions,3));const material=new T.LineBasicMaterial({color:index%2?0xb9d7ff:0xf1f6ff,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false}),line=new T.Line(geometry,material);line.frustumCulled=false;lightning.add(line);bolts.push({geometry,material,index})}world.add(lightning);const flash=new T.PointLight(0xa9d2ff,0,13,2);flash.position.set(centerX,.4,centerZ);world.add(flash);
    const signCanvas=document.createElement("canvas");signCanvas.width=1024;signCanvas.height=256;const sg=signCanvas.getContext("2d");sg.fillStyle="#d4a72c";sg.fillRect(0,0,1024,256);sg.strokeStyle="#171817";sg.lineWidth=24;sg.strokeRect(12,12,1000,232);sg.fillStyle="#171817";sg.textAlign="center";sg.font="900 96px Arial Black, Arial";sg.fillText("WIRTSCHAFTSWUNDER!",512,164,920);const signTexture=new T.CanvasTexture(signCanvas);signTexture.colorSpace=T.SRGBColorSpace;
    const signRadius=mouth+.65,signAngles=[70,160,250,340].map(degrees=>degrees*Math.PI/180);
    function siteSign(angle){const group=new T.Group();for(const px of [-1.35,1.35])box(.09,1.42,.09,M.metal,px,.71,0,group);box(3.25,1.02,.13,yellow,0,1.43,0,group);const material=new T.MeshBasicMaterial({map:signTexture,side:T.DoubleSide}),front=new T.Mesh(new T.PlaneGeometry(3.08,.86),material),back=front.clone(),dx=Math.cos(angle)*signRadius,dz=Math.sin(angle)*signRadius;front.position.set(0,1.43,.071);back.position.set(0,1.43,-.071);back.rotation.y=Math.PI;group.add(front,back);group.position.set(centerX+dx,0,centerZ+dz);group.rotation.y=Math.atan2(dx,dz);world.add(group)}
    signAngles.forEach(siteSign);
    for(let i=0;i<12;i++){const side=i%4,index=Math.floor(i/4),x=side<2?centerX+(index-1)*2.05:centerX+(side===2?-site.siteW*S*.49:site.siteW*S*.49),z=side<2?centerZ+(side===0?-site.siteH*S*.49:site.siteH*S*.49):centerZ+(index-1)*2.15,barrier=box(side<2?1.7:.18,.28,side<2?.18:1.7,(i+index)%2?red:white,x,.16,z);if(side>=2)barrier.rotation.y=0}
    return{site,centerX,centerZ,layers,rim,lightning,bolts,flash,impactAt:-1,impactSerial:0}
  }
  const wirtschaftswunderVisual=makeWirtschaftswunderSite(bridge.wirtschaftswunderSite);
  function strikeWirtschaftswunder(serial){
    const visual=wirtschaftswunderVisual;if(!visual||serial<=visual.impactSerial)return;visual.impactSerial=serial;visual.impactAt=performance.now();visual.lightning.visible=true;
    for(const bolt of visual.bolts){const positions=bolt.geometry.attributes.position.array,angle=serial*2.399+bolt.index*1.257,height=4.2+(bolt.index%3)*.72;for(let step=0;step<8;step++){const f=step/7,spread=f*(1.45+bolt.index*.22),jitter=step?Math.sin(serial*5.31+bolt.index*7.17+step*3.83)*.34*(1-f*.28):0,i=step*3;positions[i]=Math.cos(angle)*spread+Math.cos(angle+Math.PI/2)*jitter;positions[i+1]=f*height+Math.sin(step*4.1+bolt.index)*.12;positions[i+2]=Math.sin(angle)*spread+Math.sin(angle+Math.PI/2)*jitter}bolt.geometry.attributes.position.needsUpdate=true}
  }
  function updateWirtschaftswunder(now){
    if(!wirtschaftswunderVisual)return;const visual=wirtschaftswunderVisual,viewX=Math.max(-.16,Math.min(.16,(camera.position.x-visual.centerX)*.012)),viewZ=Math.max(-.16,Math.min(.16,(camera.position.z-visual.centerZ)*.012)),impact=Math.max(0,1-(now-visual.impactAt)/720);
    for(const layer of visual.layers){layer.material.uniforms.uTime.value=now*.001;layer.material.uniforms.uImpact.value=impact;const depth=layer.index*.42,pulse=1+Math.sin(now*.009+layer.index*1.9)*(.018+impact*.045);layer.mesh.scale.setScalar(layer.scale*pulse);layer.mesh.position.x=visual.centerX-viewX*depth;layer.mesh.position.z=visual.centerZ-viewZ*depth;layer.mesh.rotation.z=-now*.00115*(layer.index+1)}visual.rim.rotation.z=now*.0024;visual.rim.scale.setScalar(1+Math.sin(now*.012)*.018+impact*.07);visual.lightning.visible=impact>0;if(impact>0){const flicker=.35+.65*Math.abs(Math.sin(now*.086));for(const bolt of visual.bolts)bolt.material.opacity=impact*flicker;visual.flash.intensity=impact*8*flicker}else visual.flash.intensity=0
  }
  function pedestrianSign(s){const g=new T.Group(),post=new T.Mesh(new T.CylinderGeometry(.035,.045,1.55,8),M.metal);post.position.y=.775;g.add(post);box(.58,.58,.06,M.cross,0,1.64,0,g);box(.48,.48,.07,M.blue,0,1.64,.04,g);const tri=new T.Mesh(new T.ConeGeometry(.19,.38,3),M.cross);tri.rotation.z=Math.PI;tri.position.set(0,1.64,.09);g.add(tri);g.position.set(X(s.x),0,Z(s.y));g.rotation.y=(s.turn||0)*Math.PI/2;world.add(g)}
  bridge.crossingSigns.forEach(pedestrianSign);
  const trafficLightSlots=[];
  function pedestrianLight(light){const g=new T.Group(),post=new T.Mesh(new T.CylinderGeometry(.035,.045,1.45,8),M.metal),red=new T.MeshBasicMaterial({color:0xdf332c}),green=new T.MeshBasicMaterial({color:0x284b31});post.position.y=.725;g.add(post);box(.42,.82,.22,M.dark,0,1.62,0,g);const redLamp=new T.Mesh(new T.SphereGeometry(.115,10,7),red),greenLamp=new T.Mesh(new T.SphereGeometry(.115,10,7),green);redLamp.position.set(0,1.82,.13);greenLamp.position.set(0,1.44,.13);g.add(redLamp,greenLamp);if(light.sign){box(.46,.46,.06,M.cross,0,2.26,0,g);box(.37,.37,.07,M.blue,0,2.26,.04,g);const tri=new T.Mesh(new T.ConeGeometry(.145,.29,3),M.cross);tri.rotation.z=Math.PI;tri.position.set(0,2.26,.09);g.add(tri)}g.position.set(X(light.x),0,Z(light.y));g.rotation.y=(light.turn||0)*Math.PI/2;world.add(g);trafficLightSlots.push({light,red,green})}
  (bridge.trafficLights||[]).forEach(pedestrianLight);
  const cityModelRoot="./assets/models/city-kit/",cityModelUrl=file=>cityModelRoot+file+".glb?v=20260926-city1";
  const germanPropUrl=file=>"./assets/models/german-props/"+file+".glb?v=20260929-props1";
  const buildingModels={
    hausverwaltung:cityModelUrl("berlin-block"),mietpruefung:cityModelUrl("berlin-block"),
    rathaus:cityModelUrl("berlin-block"),stadtbild:cityModelUrl("berlin-block"),
    post:cityModelUrl("brick-utility"),tuev:cityModelUrl("brick-utility"),
    baumarkt:cityModelUrl("brick-utility"),faxlager:cityModelUrl("brick-utility"),
    reinigung:cityModelUrl("brick-utility"),spaeti:cityModelUrl("neighborhood-shop"),imbiss:cityModelUrl("neighborhood-shop"),
    bundestag:"./assets/models/bundestag/bundestag.glb",
    sandalenladen:germanPropUrl("sandal-shop"),sockenladen:germanPropUrl("sock-shop"),
    "krugers-kugellager":"./assets/models/german-props/krugers-kugellager.glb?v=20261003-shop"
  };
  const powerModels={
    coalBuilding:"./assets/models/power-plants/coal-building.glb",
    coalStack:"./assets/models/power-plants/coal-stack.glb",
    coolingTower:"./assets/models/power-plants/cooling-tower.glb",
    nuclearTransformer:"./assets/models/power-plants/nuclear-transformer.glb",
    nuclearSign:"./assets/models/power-plants/nuclear-warning-sign.glb"
  };
  const buildingSlots=[],trainSlots=[],cityAssetSlots=[],localModels=new Map();
  let kiesingerMonument;
  const satireKitEnabled=new URLSearchParams(location.search).get("satireKit")==="1";
  const detailPropLoader=satireKitEnabled
    ?import("./assets/models/satire-kit/loader.js?v=20261003-road-end-stations").catch(error=>{console.warn("Satire kit unavailable; using originals",error);return null})
    :new URLSearchParams(location.search).get("propDetails")==="1"
      ?import("./assets/models/prop-details/loader.js?v=20260930-prop-details1").catch(error=>{console.warn("Prop detail study unavailable; using originals",error);return null})
      :null;
  if(satireKitEnabled)for(const slot of stationSlots)queueCityModel(()=>({x:X(slot.state.x+slot.state.w/2),z:Z(slot.state.y+slot.state.h/2)}),Math.hypot(slot.state.w*S,slot.state.h*S)/2,async()=>{try{
    const module=await detailPropLoader;if(!module)return false;await module.installStationKit(T,world,[slot],modelLoader,{S,X,Z});return true;
  }catch(error){console.warn("Original stations retained",error);return false}},slot);
  function loadLocalModel(url){
    if(!localModels.has(url)){
      const load=typeof detailPropLoader!=='undefined'&&detailPropLoader
        ?detailPropLoader.then(module=>module?module.loadWithDetailFallback(url,modelLoader):modelLoader.loadAsync(url))
        :modelLoader.loadAsync(url);
      localModels.set(url,load.catch(error=>{console.warn("Keeping procedural stand-ins for "+url,error);return null}));
    }
    return localModels.get(url);
  }
  function installCityModel(group,fallback,file,fit,location=null){
    const slot={file,group,fallback,model:null};cityAssetSlots.push(slot);if(!modelLoader)return;
    return queueCityModel(()=>location?{x:X(location.x),z:Z(location.y)}:{x:group.position.x,z:group.position.z},Math.hypot(fit.x,fit.z)/2,async()=>{
      try{const gltf=await loadLocalModel(file.startsWith("./")?file:cityModelUrl(file));if(!gltf)return false;const model=gltf.scene.clone(true);fitResponseModel(model,fit);model.name=file;group.add(model);slot.model=model;fallback.visible=false;return true}
      catch(error){console.warn("Keeping procedural city asset "+file,error);return false}
    },slot);
  }
  function registerMaterials(root,slot){
    const copies=new Map();
    root.traverse(o=>{
      if(!o.material)return;
      const copy=m=>{if(copies.has(m))return copies.get(m);const c=m.clone();c.userData.baseOpacity=m.opacity;c.userData.baseTransparent=m.transparent;c.userData.baseDepthWrite=m.depthWrite;copies.set(m,c);slot.materials.add(c);return c};
      o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);
    });
    // Bounds are a broad phase only: visible solid meshes decide obstruction.
    slot.viewBounds=new T.Box3().setFromObject(slot.group);
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
  ];
  function makeTrainCarFallback(){
    const g=new T.Group(),red=mat(0xc43d36,.72),white=mat(0xeee9df,.82),glass=mat(0x39454b,.42),wheel=mat(0x292a29,.55);
    box(1.16,.92,4.72,white,0,.62,0,g);box(1.18,.34,4.68,red,0,.45,0,g);for(const side of [-1,1])for(let q=-1.75;q<=1.75;q+=.5)box(.06,.26,.33,glass,side*.61,.83,q,g);for(const side of [-1,1])for(const q of [-1.65,1.65]){const w=new T.Mesh(new T.CylinderGeometry(.16,.16,.09,10),wheel);w.rotation.z=Math.PI/2;w.position.set(side*.6,.18,q);g.add(w)}
    return g
  }
  function fitTrainPart(source,fit){
    const model=new T.Group();model.add(source);source.updateMatrixWorld(true);let bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3());if(size.x>size.z){source.rotation.y+=Math.PI/2;source.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(source);size=bounds.getSize(new T.Vector3())}if(!size.x||!size.y||!size.z)throw new Error("empty train asset bounds");const center=bounds.getCenter(new T.Vector3());source.position.x-=center.x;source.position.y-=bounds.min.y;source.position.z-=center.z;model.scale.set(fit.x/size.x,fit.y/size.y,fit.z/size.z);return model
  }
  function installTrainModel(slot){
    return queueCityModel((x,z)=>slot.train.cars.reduce((nearest,car)=>{const position={x:X(car.x),z:Z(car.y)};return !nearest||Math.hypot(position.x-x,position.z-z)<Math.hypot(nearest.x-x,nearest.z-z)?position:nearest},null),2.6,async()=>{
      try{const sources=[];for(const url of trainModelUrls){const source=await loadLocalModel(url);if(!source)return false;sources.push(source)}for(let i=0;i<slot.cars.length;i++){const sourceIndex=i===0?0:i===slot.cars.length-1?2:1,source=sources[sourceIndex].scene.clone(true),fit=sourceIndex===1?{x:1.12,y:1.28,z:4.82}:{x:1.24,y:1.62,z:4.7},model=fitTrainPart(source,fit);slot.cars[i].group.add(model);slot.cars[i].fallback.visible=false;slot.cars[i].model=model}return true}
      catch(e){console.warn("Keeping procedural AMT-Bahn train",e);return false}
    },slot);
  }
  const gangwayGeometry=new T.BoxGeometry(.42,.48,1),gangwayMaterial=mat(0x252625,.62);
  for(const train of bridge.trains||[]){const slot={train,cars:train.cars.map(()=>{const group=new T.Group(),fallback=makeTrainCarFallback();group.add(fallback);world.add(group);return{group,fallback,model:null}}),gangways:train.cars.slice(1).map(()=>{const mesh=new T.Mesh(gangwayGeometry,gangwayMaterial);world.add(mesh);return mesh})};trainSlots.push(slot);installTrainModel(slot)}
  function fitResponseModel(model,fit){model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());if(!size.x||!size.y||!size.z)throw new Error("empty response asset bounds");const s=Math.min(fit.x/size.x,fit.y/size.y,fit.z/size.z);model.scale.setScalar(s);model.position.set(-center.x*s,-bounds.min.y*s,-center.z*s)}
  function responseMaterial(source,kind){const copy=source.clone(),name=(source.name||"").toLowerCase(),c=source.color,lum=c?c.r*.2126+c.g*.7152+c.b*.0722:.5;if(kind==="helicopter")copy.color.setHex(lum>.65?0x282b29:lum>.3?0x171918:0x090a09);else if(/white/.test(name))copy.color.setHex(0xc3c7c5);else if(/bluelight/.test(name)){copy.color.setHex(0x246cff);copy.emissive=new T.Color(0x123b92);copy.emissiveIntensity=1.5}copy.roughness=.72;return copy}
  function installResponseModel(slot,url,kind,fit){
    return queueCityModel(()=>({x:X(slot.state.x),z:Z(slot.state.y)}),Math.hypot(fit.x,fit.z)/2,async()=>{
      try{const gltf=await loadLocalModel(url);if(!gltf||slot.retired)return false;const model=gltf.scene.clone(true),materials=new Map();model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>{if(!materials.has(m))materials.set(m,responseMaterial(m,kind));return materials.get(m)}):(()=>{const m=o.material;if(!materials.has(m))materials.set(m,responseMaterial(m,kind));return materials.get(m)})()});fitResponseModel(model,fit);slot.group.add(model);slot.model=model;slot.fallback.visible=false;return true}
      catch(e){console.warn("Keeping procedural police "+kind,e);return false}
    },slot);
  }
  const vehicleModels={beetle:{file:"beetle",length:2.48},trabant:{file:"trabant",length:2.30},police:{file:"police-estate",length:2.55}};
  function bindVehicleParts(slot,model){
    slot.wheels=[];slot.steering=[];slot.brakes=[];slot.beacons=[];
    const materials=new Map();
    model.traverse(o=>{
      if(o.userData.wheel)slot.wheels.push({node:o,radius:o.userData.radius*model.scale.x});
      if(o.userData.steer)slot.steering.push(o);
      if(!o.isMesh)return;
      const bind=m=>{
        if(materials.has(m))return materials.get(m);
        if(!/^(BodyPaint|BrakeLens|BeaconLeft|BeaconRight)$/.test(m.name))return m;
        const copy=m.clone();materials.set(m,copy);
        if(m.name==="BodyPaint")copy.color.set(slot.state.color);
        if(m.name==="BrakeLens"){copy.emissive.setHex(0xff2715);slot.brakes.push(copy)}
        if(m.name.startsWith("Beacon")){copy.emissive.setHex(0x1265ff);slot.beacons.push({material:copy,left:m.name==="BeaconLeft"})}
        return copy;
      };
      o.material=Array.isArray(o.material)?o.material.map(bind):bind(o.material);
    });
    slot.materials=[...(slot.materials||[]),...materials.values()];
  }
  function installVehicleModel(slot){
    const spec=vehicleModels[slot.kind];
    return queueCityModel(()=>({x:X(slot.state.x),z:Z(slot.state.y)}),Math.hypot(1.3,spec.length)*slot.renderScale/2,async()=>{try{
      const gltf=await loadLocalModel("./assets/models/vehicles/"+spec.file+".glb?v=20260927-cars2");if(!gltf||slot.retired)return false;
      const model=gltf.scene.clone(true);fitResponseModel(model,{x:1.3,y:1.15,z:spec.length});
      // Every visible detail belongs to the GLB. Hide the complete fallback, including its lights and wheels.
      bindVehicleParts(slot,model);slot.group.add(model);slot.model=model;slot.fallback.visible=false;return true;
    }catch(error){console.warn("Keeping procedural "+slot.kind+" car",error);return false}},slot);
  }
  function makeVehicleSlot(car,kind){
    const group=new T.Group(),fallback=new T.Group(),paint=mat(kind==="police"?0xb9c2c6:car.color,.4),glass=mat(0x34444d,.25),rubber=mat(0x17191a,.8),chrome=mat(0xbac2c5,.4),red=mat(0x82251f,.35);
    paint.name=kind==="police"?"PoliceSilver":"BodyPaint";red.name="BrakeLens";
    box(1.07,.40,2.18,paint,0,.44,0,fallback);
    if(kind==="beetle"){const roof=new T.Mesh(new T.SphereGeometry(1,24,16),paint);roof.scale.set(.47,.46,.85);roof.position.set(0,.60,-.04);fallback.add(roof)}
    else box(.91,.37,kind==="police"?1.50:1.09,glass,0,.82,-.13,fallback);
    for(const side of [-1,1])for(const z of [-.72,.72]){
      const suffix=(z>0?"F":"R")+(side<0?"L":"R"),steer=new T.Group(),wheel=new T.Group();steer.position.set(side*.55,.19,z);fallback.add(steer);steer.add(wheel);
      if(z>0)steer.userData.steer=suffix;wheel.userData={wheel:suffix,radius:.19};
      const tyre=new T.Mesh(new T.CylinderGeometry(.19,.19,.14,24),rubber),hub=new T.Mesh(new T.CylinderGeometry(.105,.105,.15,16),chrome);tyre.rotation.z=hub.rotation.z=Math.PI/2;wheel.add(tyre,hub);
    }
    for(const side of [-1,1]){box(.14,.08,.025,red,side*.39,.47,-1.105,fallback);box(.16,.09,.025,chrome,side*.39,.47,1.105,fallback)}
    if(kind==="police"){
      box(.85,.055,.20,chrome,0,1.045,-.1,fallback);
      for(const side of [-1,1]){const blue=mat(0x1265dd,.22);blue.name=side<0?"BeaconLeft":"BeaconRight";box(.24,.075,.19,blue,side*.29,1.10,-.1,fallback)}
    }
    const renderScale=bridge.VEHICLE_RENDER_SCALE||1.4;group.scale.setScalar(renderScale);
    group.add(fallback);world.add(group);
    const slot={state:car,kind,group,fallback,model:null,renderScale,lastX:car.x,lastY:car.y,lastAngle:car.angle,travel:0};
    bindVehicleParts(slot,fallback);installVehicleModel(slot);return slot;
  }
  function makePoliceCarSlot(car){return makeVehicleSlot(car,"police")}
  function makeTrafficCarSlot(car){return makeVehicleSlot(car,car.kind==="beetle"?"beetle":"trabant")}
  function syncVehicleScale(slot,scale=1,crush=0){
    const base=slot.renderScale||1;
    slot.group.scale.set(base*scale*(1+crush*.82),base*scale*(1-crush*.68),base*scale*(1-crush*.3));
  }
  function vehicleRoadPitch(car){
    if(!bridge.vehicleElevation)return 0;
    const axle=105/2,c=Math.cos(car.angle),s=Math.sin(car.angle);
    return -Math.atan2(bridge.vehicleElevation(car.x+c*axle,car.y+s*axle)-bridge.vehicleElevation(car.x-c*axle,car.y-s*axle),105*S);
  }
  function syncVehicleWheels(slot){
    const car=slot.state,dx=car.x-slot.lastX,dy=car.y-slot.lastY,distance=Math.hypot(dx,dy),turn=Math.atan2(Math.sin(car.angle-slot.lastAngle),Math.cos(car.angle-slot.lastAngle));
    // Actual displacement stops wheel motion in queues/modals; respawn teleports do not spin the tyres.
    if(distance>.0001&&distance<160){
      const direction=Math.sign(dx*Math.cos(car.angle)+dy*Math.sin(car.angle))||1;
      slot.travel=(slot.travel+distance*S*direction)%10000;
      const steer=Math.max(-.42,Math.min(.42,-Math.atan(turn*1.5*(slot.renderScale||1)/(distance*S))));
      if(!Number.isFinite(car.steeringAngle))for(const node of slot.steering)node.rotation.y=steer;
    }
    // Wheel steering follows the driver, including steering at rest; the body
    // still turns only through signed travel in the simulation.
    if(Number.isFinite(car.steeringAngle))for(const node of slot.steering)node.rotation.y=-car.steeringAngle;
    for(const {node,radius} of slot.wheels)node.rotation.x=slot.travel/(radius*(slot.renderScale||1));
    for(const material of slot.brakes)material.emissiveIntensity=(car.queued||car.braking)?.8:0;
    const flash=Math.floor(performance.now()/125)%2;
    for(const {material,left} of slot.beacons)material.emissiveIntensity=car.retiring?0:!!flash===left?2.6:.08;
    slot.lastX=car.x;slot.lastY=car.y;slot.lastAngle=car.angle;
  }
  function removeVehicleSlot(slot){slot.retired=true;world.remove(slot.group);for(const material of slot.materials)material.dispose()}
  function makePoliceHelicopterSlot(helicopter){
    const group=new T.Group(),fallback=new T.Group(),black=mat(0x111312,.48),glass=mat(0x253038,.34);box(1.1,.72,2.05,black,0,.56,0,fallback);box(.74,.46,.72,glass,0,.65,-.88,fallback);box(.2,.18,2.35,black,0,.6,2.05,fallback);const tail=new T.Mesh(new T.ConeGeometry(.5,1.1,3),black);tail.rotation.x=Math.PI/2;tail.position.set(0,.76,3.22);fallback.add(tail);group.add(fallback);const rotor=new T.Group(),bladeGeo=new T.BoxGeometry(4.8,.035,.12),bladeA=new T.Mesh(bladeGeo,black),bladeB=bladeA.clone();bladeB.rotation.y=Math.PI/2;rotor.add(bladeA,bladeB);rotor.position.y=1.55;group.add(rotor);const beam=new T.Mesh(new T.ConeGeometry(2.35,6.4,20,1,true),new T.MeshBasicMaterial({color:0xf1e6a6,transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide}));beam.position.y=-2.85;beam.visible=false;group.add(beam);world.add(group);const slot={state:helicopter,group,fallback,model:null,rotor,beam};installResponseModel(slot,"./assets/models/police-response/black-helicopter.glb","helicopter",{x:3.55,y:1.5,z:4.65});return slot
  }
  function cityBuildingYScale(url,height,sourceHeight){
    // Authored entrance heights in tools/build-city-assets.py. Parcel fitting
    // must leave the 1.50-unit player at least .20 units of headroom.
    const doors={"municipal-office":2.1,"berlin-block":2.2,"brick-utility":2.9,"neighborhood-shop":2.35};
    const family=Object.keys(doors).find(name=>url.includes("/city-kit/"+name+".glb"));
    return Math.max(height/sourceHeight,family?1.7/doors[family]:0);
  }
  function installBuildingModel(slot,url,w,h,d){
    return queueCityModel(()=>({x:slot.group.position.x,z:slot.group.position.z}),Math.hypot(w,d)/2,async()=>{try{
      const gltf=await loadLocalModel(url);if(!gltf)return false;const model=gltf.scene.clone(true);
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
      if(!size.x||!size.y||!size.z)throw new Error("empty building bounds");
      const landmark=slot.building.id==="bundestag",s=Math.min(w/size.x,h/size.y,d/size.z),sx=landmark?s:w/size.x,sy=landmark?s:cityBuildingYScale(url,h,size.y),sz=landmark?s:d/size.z;
      model.scale.set(sx,sy,sz);model.position.set(-center.x*sx,-bounds.min.y*sy,-center.z*sz);
      if(landmark){const apron=box(w,.07,d,M.walk,0,.035,0,slot.group);apron.userData.occlusionDecoration=true}
      slot.group.add(model);slot.model=model;slot.fallback.visible=false;registerMaterials(model,slot);
      if(landmark)matchKiesingerHeight();return true;
    }catch(e){console.warn("Keeping procedural building for "+slot.building.id,e);return false}},slot);
  }
  const coalSmoke=[],coalBelt=[];
  function installPlantModel(slot,url,fit,placements,keepColors=false,fallback=null){
    return queueCityModel(()=>({x:slot.group.position.x,z:slot.group.position.z}),Math.hypot(slot.building.w*S,slot.building.h*S)/2,async()=>{try{
      const gltf=await loadLocalModel(url);if(!gltf)return false;
      for(const p of placements){
        const model=gltf.scene.clone(true),materials=new Map();
        if(!keepColors)model.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>{if(!materials.has(m))materials.set(m,grayMaterial(m,o.name));return materials.get(m)}):(()=>{const m=o.material;if(!materials.has(m))materials.set(m,grayMaterial(m,o.name));return materials.get(m)})()});
        const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
        if(!size.x||!size.y||!size.z)throw new Error("empty plant asset bounds");
        const s=Math.min(fit.x/size.x,fit.y/size.y,fit.z/size.z);model.scale.setScalar(s);model.position.set(p.x-center.x*s,p.y-bounds.min.y*s,p.z-center.z*s);slot.group.add(model);registerMaterials(model,slot);
      }
      if(fallback)fallback.visible=false;return true;
    }catch(e){console.warn("Keeping procedural power-plant asset "+slot.building.id+" / "+url,e);return false}},slot);
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
      const l=buildingPlacard(b,w,3.2,2.42,2.28);g.add(l);registerMaterials(g,slot);
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
      const l=buildingPlacard(b,w,3.1,2.46,1.96);g.add(l);registerMaterials(g,slot);
      installPlantModel(slot,powerModels.coalBuilding,{x:3.2,y:3.3,z:3.1},[{x:-5.95,y:0,z:-.75}]);
      installPlantModel(slot,powerModels.coalStack,{x:1.1,y:5.15,z:1.1},[{x:stackX,y:0,z:stackZ}],false,stackFallback);
      for(let j=0;j<10;j++){const m=new T.MeshBasicMaterial({color:0x1d1c1a,transparent:true,depthWrite:false}),q=new T.Mesh(new T.SphereGeometry(.38,10,7),m);g.add(q);coalSmoke.push({mesh:q,x:stackX,y:4.95,z:stackZ,index:j})}
    }
  }
  function building(b,i){
    if(b.kind){powerPlant(b,i);return}
    const g=new T.Group(),fallback=new T.Group(),w=b.w*S,d=b.h*S,h=Math.max(2.8,b.hgt*H),shop=b.id==="krugers-kugellager",cols=[0x65645f,0x706f69,0x5c5d59,0x7a7871],bm=mat(shop?0xe8dac3:cols[i%cols.length],.98);
    g.add(fallback);box(w,h,d,bm,0,h/2,0,fallback);box(w*1.03,.16,d*1.03,mat(shop?0xf36b17:0x89877f),0,h+.08,0,fallback);
    const dx=(b.doorX-(b.x+b.w/2))*S;box(Math.min(1.3,w*.18),1.7,.1,M.dark,dx,.85,d/2+.06,fallback);
    if(shop){box(w*.98,.6,.12,mat(0xd72b67),0,2.10,d/2+.08,fallback);box(w*.98,.11,.64,mat(0xffe2b5),0,1.80,d/2+.30,fallback)}
    else box(Math.min(2,w*.32),.1,.62,mat(0xaaa69b),dx,1.82,d/2+.28,fallback);
    const cn=Math.max(2,Math.min(7,Math.floor(w/1.25))),rn=Math.max(2,Math.min(5,Math.floor(h/1.05)));
    for(let r=0;r<rn;r++)for(let c=0;c<cn;c++)box(.48,.31,.04,shop?M.dark:M.win,-w*.41+c*(w*.82/Math.max(1,cn-1)),.9+r*Math.max(.64,(h-1.6)/Math.max(1,rn-1)),d/2+.025,fallback);
    const l=shop?bearingShopSign(w,d):buildingPlacard(b,w,dx,2.23,d/2+.22);g.add(l);g.position.set(X(b.x+b.w/2),0,Z(b.y+b.h/2));world.add(g);
    const slot={building:b,group:g,fallback,label:l,model:null,materials:new Set(),opacity:1};buildingSlots.push(slot);registerMaterials(g,slot);
    const url=buildingModels[b.id]||cityModelUrl("municipal-office");installBuildingModel(slot,b.id==="bundestag"?url+"?v=20260926-city1":url,w,h,d);
  }
  if(!amtDirectRoute)bridge.buildings.forEach(building);

  const bannerMaterials=new Map(),landmarkBanners=[];
  function landmarkBanner(kind,parent,w,h,x,y,z,turn=0){
    if(!bannerMaterials.has(kind)){
      const c=document.createElement("canvas"),wide=kind==="price",cdu=kind.startsWith("cdu");c.width=wide?1536:cdu?512:768;c.height=wide?320:cdu?768:512;
      const ctx=c.getContext("2d"),cw=c.width,ch=c.height;
      ctx.fillStyle=wide?"#ecd272":cdu?"#eee9dc":"#ae2528";ctx.fillRect(0,0,cw,ch);ctx.textAlign="center";ctx.textBaseline="middle";
      if(cdu){
        ctx.fillStyle="#20231f";ctx.font="900 178px Arial, sans-serif";ctx.fillText("CDU",cw/2,ch*.43,cw-56);
        ["#20231f","#b72429","#e4b63c"].forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(52,ch*.66+i*21,cw-104,21)});
        if(kind==="cdu-history"){ctx.fillStyle="#20231f";ctx.font="700 47px Arial, sans-serif";ctx.fillText("AB 1948",cw/2,ch*.86)}
      }else if(kind==="reich-1933-1945"){
        // Historical flag: co-official from March 1933; sole national flag from September 1935.
        ctx.fillStyle="#f5efe4";ctx.beginPath();ctx.arc(cw/2,230,162,0,Math.PI*2);ctx.fill();
        ctx.save();ctx.translate(cw/2,230);ctx.rotate(Math.PI/4);ctx.fillStyle="#171817";
        for(let i=0;i<4;i++){ctx.fillRect(-18,-110,36,128);ctx.fillRect(-18,-110,96,36);ctx.rotate(Math.PI/2)}ctx.restore();
        ctx.fillStyle="#eee9dc";ctx.fillRect(0,458,cw,54);ctx.fillStyle="#20231f";ctx.font="700 40px Arial, sans-serif";ctx.fillText("1933–1945",cw/2,486);
      }else{
        const copy=bridge.goerlitzerPark.priceFlag;
        ctx.fillStyle="#fff000";ctx.fillRect(0,0,cw,ch);
        ctx.strokeStyle="#ec1424";ctx.lineWidth=18;ctx.strokeRect(13,13,cw-26,ch-26);
        // Cheap sale-sticker stripes, oversized price, and a crooked party-logo badge.
        ctx.save();ctx.beginPath();ctx.rect(24,24,cw-48,ch-48);ctx.clip();ctx.strokeStyle="#ec1424";ctx.lineWidth=14;
        for(let x=-ch;x<cw+ch;x+=50){ctx.beginPath();ctx.moveTo(x,24);ctx.lineTo(x+36,60);ctx.moveTo(x,ch-60);ctx.lineTo(x+36,ch-24);ctx.stroke()}ctx.restore();
        ctx.font="italic 900 178px Arial, sans-serif";ctx.lineJoin="round";ctx.lineWidth=14;ctx.strokeStyle="#fff";ctx.strokeText(copy.amount,565,172,1060);ctx.lineWidth=5;ctx.strokeStyle="#211c17";ctx.strokeText(copy.amount,565,172,1060);ctx.fillStyle="#ec1424";ctx.fillText(copy.amount,565,172,1060);
        ctx.save();ctx.translate(1318,160);ctx.rotate(-.07);ctx.fillStyle="#fff";ctx.fillRect(-176,-92,352,184);ctx.strokeStyle="#211c17";ctx.lineWidth=5;ctx.strokeRect(-176,-92,352,184);ctx.fillStyle="#151518";ctx.font="italic 900 102px Arial, sans-serif";ctx.fillText("CDU",0,0,290);ctx.restore();
      }
      const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      if(wide){const logo=new Image();queueCityAsset(()=>({x:X(bridge.goerlitzerPark.x+bridge.goerlitzerPark.w/2),z:Z(bridge.goerlitzerPark.y+bridge.goerlitzerPark.h/2)}),Math.hypot(bridge.goerlitzerPark.w*S,bridge.goerlitzerPark.h*S)/2,()=>new Promise(resolve=>{
        logo.onload=()=>{ctx.save();ctx.translate(1318,160);ctx.rotate(-.07);ctx.fillStyle="#fff";ctx.fillRect(-170,-86,340,172);ctx.drawImage(logo,-166,-48,332,96);ctx.restore();texture.needsUpdate=true;resolve(true)};logo.onerror=()=>resolve(false);logo.src=bridge.goerlitzerPark.priceFlag.logo;
      }))}
      bannerMaterials.set(kind,new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    }
    const geometry=new T.PlaneGeometry(w,h,12,6),positions=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<positions.count;i++)positions.setZ(i,Math.sin(uv.getX(i)*Math.PI*3)*Math.sin(uv.getY(i)*Math.PI)*Math.min(.12,w*.045));geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,bannerMaterials.get(kind));mesh.name=kind+" banner";mesh.position.set(x,y,z);mesh.rotation.y=turn;parent.add(mesh);landmarkBanners.push({kind,mesh});return mesh;
  }
  function matchKiesingerHeight(){
    const landmark=buildingSlots.find(s=>s.building.id==="bundestag");if(!kiesingerMonument||!landmark)return;
    const target=new T.Box3().setFromObject(landmark.model||landmark.fallback);
    kiesingerMonument.scale.setScalar(1);
    const bounds=new T.Box3().setFromObject(kiesingerMonument);
    kiesingerMonument.scale.setScalar((target.max.y-target.min.y)/bounds.max.y);
  }
  function makeKiesingerMemorial(site){
    if(!site)return;
    const g=new T.Group(),granite=mat(0x77736b,.96),stone=mat(0xb5ada0,.93),shadow=mat(0x4b4a45,.98),marble=new T.MeshStandardMaterial({color:0xc9c5bb,metalness:0,roughness:.69}),face=new T.MeshStandardMaterial({color:0xd0cdc5,metalness:0,roughness:.62}),hair=mat(0xbdbab1,.72),gold=new T.MeshStandardMaterial({color:0xb3965b,metalness:.45,roughness:.59});
    // The entire apron fits inside the reserved 350 × 300 world-unit parcel.
    box(6.9,.16,5.85,shadow,X(site.x),.08,Z(site.y));
    box(6.48,.28,5.4,granite,0,.3,0,g);
    box(5.95,.32,4.92,stone,0,.6,0,g);
    box(4.25,.22,3.2,shadow,0,.87,-.13,g);
    box(3.88,2.55,2.83,granite,0,2.25,-.13,g);
    box(4.3,.24,3.24,stone,0,3.65,-.13,g);
    box(3.66,.42,2.72,shadow,0,3.98,-.13,g);
    box(3.48,.12,2.6,gold,0,4.24,-.13,g);
    for(const x of [-1.84,1.84]){
      box(.11,2.22,.1,stone,x,2.25,1.34,g);
      box(.2,.18,.21,gold,x,3.4,1.36,g);
    }
    for(const x of [-2.76,2.76]){
      box(.68,.22,.68,granite,x,.82,-1.94,g);
      const shaft=new T.Mesh(new T.CylinderGeometry(.23,.29,5.58,10),stone);shaft.position.set(x,3.72,-1.94);g.add(shaft);
      box(.78,.3,.78,stone,x,6.61,-1.94,g);
      box(.9,.1,.9,gold,x,6.83,-1.94,g);
    }
    box(6.3,.36,.55,stone,0,7.15,-1.94,g);
    box(6.42,.09,.64,gold,0,7.39,-1.94,g);

    const figure=new T.Group();figure.name="KiesingerFigureFallback";figure.position.set(0,4.3,-.22);g.add(figure);
    const shape=(points,material,z)=>{const outline=new T.Shape();outline.moveTo(...points[0]);for(const point of points.slice(1))outline.lineTo(...point);outline.closePath();const mesh=new T.Mesh(new T.ShapeGeometry(outline),material);mesh.position.z=z;figure.add(mesh);return mesh};
    for(const x of [-.43,.43]){
      box(.63,.27,.96,marble,x,.14,.24,figure);
      const leg=new T.Mesh(new T.CylinderGeometry(.31,.26,1.85,8),marble);leg.position.set(x,1.17,0);figure.add(leg);
      box(.73,.18,.68,marble,x,2.08,0,figure);
    }
    box(1.5,.46,.72,marble,0,2.27,-.02,figure);
    const coat=new T.Shape();coat.moveTo(-.68,0);coat.lineTo(.68,0);coat.lineTo(.82,.3);coat.lineTo(.98,1.72);coat.lineTo(.68,2.13);coat.lineTo(-.68,2.13);coat.lineTo(-.98,1.72);coat.lineTo(-.82,.3);coat.closePath();
    const jacket=new T.Mesh(new T.ExtrudeGeometry(coat,{depth:.7,bevelEnabled:true,bevelThickness:.055,bevelSize:.07,bevelSegments:1}),marble);jacket.position.set(0,2.27,-.36);figure.add(jacket);
    shape([[-.38,4.4],[.38,4.4],[.23,3.61],[0,3.24],[-.23,3.61]],face,.43);
    shape([[-.55,4.36],[-.14,4.23],[0,3.21],[-.4,3.67]],hair,.47);
    shape([[.55,4.36],[.14,4.23],[0,3.21],[.4,3.67]],hair,.47);
    shape([[-.1,4.12],[.1,4.12],[.07,3.55],[0,3.41],[-.07,3.55]],face,.49);
    for(const x of [-1.03,1.03]){
      const arm=new T.Mesh(new T.CylinderGeometry(.23,.28,1.85,8),marble);arm.position.set(x,3.36,-.02);arm.rotation.z=x>0?-.12:.12;figure.add(arm);
      const hand=new T.Mesh(new T.SphereGeometry(.24,9,7),face);hand.scale.set(.78,1.13,.75);hand.position.set(x*1.11,2.42,.01);figure.add(hand);
    }
    for(const y of [2.69,2.98,3.27]){const button=new T.Mesh(new T.SphereGeometry(.045,7,5),face);button.position.set(0,y,.51);figure.add(button)}
    const neck=new T.Mesh(new T.CylinderGeometry(.23,.25,.35,9),face);neck.position.set(0,4.48,0);figure.add(neck);
    const head=new T.Mesh(new T.SphereGeometry(.57,14,10),face);head.scale.set(.97,1.15,.83);head.position.set(0,5.06,.03);figure.add(head);
    for(const x of [-.54,.54]){const ear=new T.Mesh(new T.SphereGeometry(.13,8,6),face);ear.scale.set(.68,1.2,.65);ear.position.set(x,5.02,.02);figure.add(ear)}
    const nose=new T.Mesh(new T.ConeGeometry(.105,.29,5),face);nose.rotation.x=Math.PI/2;nose.position.set(0,4.99,.55);figure.add(nose);
    for(const x of [-.22,.22]){
      box(.19,.055,.055,hair,x,5.23,.46,figure);
      const eye=new T.Mesh(new T.SphereGeometry(.035,7,5),hair);eye.position.set(x,5.15,.48);figure.add(eye);
    }
    box(.22,.025,.025,hair,0,4.78,.49,figure);
    const hairCap=new T.Mesh(new T.SphereGeometry(.595,14,9,0,Math.PI*2,0,Math.PI*.49),hair);hairCap.position.set(-.025,5.4,-.025);figure.add(hairCap);
    for(let i=0;i<3;i++){const sweep=box(.32,.09,.16,hair,-.32+i*.25,5.52+i*.045,.36,figure);sweep.rotation.z=-.2}
    queueCityModel(()=>({x:g.position.x,z:g.position.z}),3.8,async()=>{try{
      const gltf=await loadLocalModel("./assets/models/kiesinger/kiesinger-statue.glb?v=20261008-portrait-fit");if(!gltf)return false;const model=gltf.scene.clone(true);
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
      if(![size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0)||Math.abs(size.y-6)>.05||Math.abs(bounds.min.y)>.05)throw new Error("Kiesinger figure must be 6 units tall with shoes at y=0");
      model.name="KiesingerSculpture";model.position.copy(figure.position);g.add(model);figure.visible=false;matchKiesingerHeight();return true;
    }catch(error){console.warn("Keeping procedural Kiesinger figure",error);return false}});

    const plaque=document.createElement("canvas");plaque.width=1024;plaque.height=512;const p=plaque.getContext("2d");
    p.fillStyle="#181c1b";p.fillRect(0,0,1024,512);p.strokeStyle="#b3965b";p.lineWidth=22;p.strokeRect(16,16,992,480);p.lineWidth=5;p.strokeRect(37,37,950,438);
    p.fillStyle="#e8dcc1";p.textAlign="center";p.font="bold 65px Georgia, serif";p.fillText("KURT GEORG KIESINGER",512,121,920);
    p.fillStyle="#c5ad7d";p.font="bold 41px Georgia, serif";p.fillText("NSDAP 1933–1945 · NS-PROPAGANDA",512,211,920);
    p.fillText("CDU · BUNDESKANZLER 1966–1969",512,277,920);
    p.fillStyle="#e8dcc1";p.font="bold 33px Arial, sans-serif";p.fillText("VERGANGENHEITSBEWÄLTIGUNG",512,376,920);
    p.font="28px Arial, sans-serif";p.fillText("E · GESCHICHTE LESEN UND HÖREN",512,430,920);
    const texture=new T.CanvasTexture(plaque);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    box(3.22,1.55,.08,shadow,0,2.33,1.34,g);
    const plate=new T.Mesh(new T.PlaneGeometry(3.1,1.43),new T.MeshBasicMaterial({map:texture}));plate.position.set(0,2.33,1.395);g.add(plate);
    for(const x of [-2.85,2.85]){
      box(.045,3.95,.045,gold,x,.9+3.95/2,1.55,g);box(1.52,.055,.055,gold,x,4.62,1.55,g);
      landmarkBanner("cdu-history",g,1.42,2.5,x,3.34,1.61);
    }
    box(2.58,.055,.055,gold,0,4.88,1.68,g);landmarkBanner("reich-1933-1945",g,2.5,1.67,0,4.01,1.74);
    g.position.set(X(site.x),0,Z(site.y));world.add(g);kiesingerMonument=g;matchKiesingerHeight();
  }
  makeKiesingerMemorial(bridge.kiesingerMemorial);

  function makeGoerlitzerPark(site){
    if(!site)return;
    const g=new T.Group();g.name="Görlitzer Park · satirical security miniature";g.position.set(X(site.x+site.w/2),0,Z(site.y+site.h/2));world.add(g);
    const w=site.w*S,d=site.h*S,steel=mat(0x414b46,.58),concrete=mat(0x8e8e83),olive=mat(0x60664d),sand=mat(0xb4a887),grass=mat(0x657353),water=mat(0x536d68,.38),yellow=mat(0xcdb55b),lamp=new T.MeshBasicMaterial({color:0xffefbc});
    // The repeated security structure is one instance batch per material; wire is one line batch.
    const batches=new Map(),dummy=new T.Object3D(),segments=[],barbs=[],up=new T.Vector3(0,1,0);
    function save(material){dummy.updateMatrix();if(!batches.has(material))batches.set(material,[]);batches.get(material).push(dummy.matrix.clone())}
    function block(material,x,y,z,bw,bh,bd,turn=0){dummy.position.set(x,y,z);dummy.scale.set(bw,bh,bd);dummy.rotation.set(0,turn,0);save(material)}
    function brace(ax,ay,az,bx,by,bz,thickness=.075){const direction=new T.Vector3(bx-ax,by-ay,bz-az);dummy.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);dummy.scale.set(thickness,direction.length(),thickness);dummy.quaternion.setFromUnitVectors(up,direction.normalize());save(steel)}
    function line(target,a,b){target.push(...a,...b)}
    function sign(lines,bw,bh,x,y,z,background="#d9d2b9",foreground="#252a25"){
      const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=Math.round(1024*bh/bw);const ctx=canvas.getContext("2d"),ch=canvas.height;
      ctx.fillStyle=background;ctx.fillRect(0,0,1024,ch);ctx.strokeStyle=foreground;ctx.lineWidth=14;ctx.strokeRect(10,10,1004,ch-20);ctx.fillStyle=foreground;ctx.textAlign="center";
      const step=(ch-38)/lines.length;lines.forEach((text,i)=>{ctx.font=`${i===0?900:800} ${Math.min(i===0?70:63,step*.74)}px Arial, sans-serif`;ctx.fillText(text,512,26+step*(i+.65),950)});
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      const mesh=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:texture}));mesh.position.set(x,y,z);g.add(mesh);block(steel,x,y,z-.06,bw+.12,bh+.12,.1);return mesh;
    }
    block(grass,0,.035,0,w-.5,.06,d-.5);
    block(sand,0,.073,1.6,w-3.3,.035,.63);block(sand,-2.55,.074,-.15,.63,.038,d-3.7);block(sand,2.7,.073,-2.05,5.5,.035,.55,-.15);
    // The shallow Görli Loch, pond, and empty benches remain visibly a miniature public park.
    const hollow=new T.Mesh(new T.LatheGeometry([new T.Vector2(1.9,.08),new T.Vector2(1.65,.4),new T.Vector2(1.35,.36),new T.Vector2(.8,.1),new T.Vector2(0,.09)],40),grass);hollow.position.set(.75,0,-.65);g.add(hollow);
    const bowl=new T.Mesh(new T.LatheGeometry([new T.Vector2(1.31,.36),new T.Vector2(.72,.105),new T.Vector2(0,.095)],36),sand);bowl.position.copy(hollow.position);g.add(bowl);
    const pond=new T.Mesh(new T.CircleGeometry(.95,32),water);pond.rotation.x=-Math.PI/2;pond.scale.set(1.35,.65,1);pond.position.set(-4.6,.085,-.75);g.add(pond);
    for(const [x,z] of [[-3.9,2.12],[3.7,1.95]]){block(olive,x,.47,z,1.3,.12,.44);block(olive,x,.79,z-.21,1.3,.52,.1);for(const offset of [-.46,.46])block(steel,x+offset,.25,z,.07,.46,.35)}
    const sides=[[-w/2+.43,-d/2+.43,w/2-.43,-d/2+.43],[w/2-.43,-d/2+.43,w/2-.43,d/2-.43],[w/2-.43,d/2-.43,-w/2+.43,d/2-.43],[-w/2+.43,d/2-.43,-w/2+.43,-d/2+.43]];
    for(const inset of [0,.72])for(let side=0;side<4;side++){
      const source=sides[side],a=new T.Vector3(source[0]-Math.sign(source[0])*inset,0,source[1]-Math.sign(source[1])*inset),b=new T.Vector3(source[2]-Math.sign(source[2])*inset,0,source[3]-Math.sign(source[3])*inset),delta=b.clone().sub(a),length=delta.length(),tangent=delta.clone().normalize(),normal=new T.Vector3(-tangent.z,0,tangent.x),height=inset?2.96:3.54;
      const point=(t,y)=>[a.x+tangent.x*t,y,a.z+tangent.z*t];
      block(concrete,(a.x+b.x)/2,.23,(a.z+b.z)/2,side%2?.3:length,.42,side%2?length:.3);
      const count=Math.ceil(length/1.65);
      for(let i=0;i<=count;i++){const t=i/count*length,[x,,z]=point(t,0);block(steel,x,height/2,z,.12,height,.12);brace(x,height-.12,z,x+normal.x*.26,height+.31,z+normal.z*.26,.07);if(i<count&&i%2===0)brace(x,.48,z,...point(Math.min(length,t+length/count),height-.25),.055)}
      for(const y of [.52,1.65,height-.16])brace(...point(0,y),...point(length,y),.06);
      // Clipped diagonal strands form a real open diamond mesh, not an opaque wall.
      const bottom=.45,top=height-.12,span=top-bottom;
      for(const slope of [-1,1])for(let origin=-span;origin<length+span;origin+=.29){const lo=Math.max(0,slope>0?-origin:origin-length),hi=Math.min(span,slope>0?length-origin:origin);if(hi>lo)line(segments,point(origin+slope*lo,bottom+lo),point(origin+slope*hi,bottom+hi))}
      const turns=Math.round(length/.48),curve=new T.Curve();curve.getPoint=t=>{const angle=t*turns*Math.PI*2,r=.27;return new T.Vector3(a.x+delta.x*t+normal.x*Math.cos(angle)*r,height+.21+Math.sin(angle)*r,a.z+delta.z*t+normal.z*Math.cos(angle)*r)};
      const coil=new T.Mesh(new T.TubeGeometry(curve,turns*12,.027,4,false),steel);coil.name="Coiled razor wire";g.add(coil);
      for(let i=0;i<=turns*3;i++){const t=i/(turns*3),p=curve.getPoint(t),offset=.11;line(barbs,[p.x-tangent.x*offset,p.y-offset,p.z-tangent.z*offset],[p.x+tangent.x*offset,p.y+offset,p.z+tangent.z*offset]);line(barbs,[p.x-normal.x*offset,p.y+offset,p.z-normal.z*offset],[p.x+normal.x*offset,p.y-offset,p.z+normal.z*offset])}
    }
    // Four absurdly tall watchtowers dwarf the tiny lawn. All feet stay inside the sealed footprint.
    for(const [x,z] of [[-w/2+1.2,-d/2+1.2],[w/2-1.2,-d/2+1.2],[-w/2+1.2,d/2-1.2],[w/2-1.2,d/2-1.2]]){
      block(concrete,x,.22,z,1.6,.44,1.6);
      for(const dx of [-.51,.51])for(const dz of [-.51,.51])block(steel,x+dx,2.05,z+dz,.13,3.9,.13);
      for(const dz of [-.51,.51]){brace(x-.51,.44,z+dz,x+.51,3.85,z+dz,.09);brace(x+.51,.44,z+dz,x-.51,3.85,z+dz,.09)}
      block(steel,x,3.92,z,1.65,.2,1.65);block(olive,x,4.45,z,1.46,.9,1.46);block(M.win,x,5.08,z,1.38,.44,1.38);block(olive,x,5.46,z,1.65,.24,1.65);block(steel,x,5.66,z,1.86,.16,1.86);
      for(const dx of [-.67,.67])for(const dz of [-.67,.67])block(steel,x+dx,5.1,z+dz,.075,.61,.075);
      block(steel,x,6.08,z,.045,.74,.045);block(yellow,x,6.38,z,.16,.14,.16);
      // Floodlamp bars and CCTV housings use unlit lenses, without adding per-tower shadow lights.
      block(steel,x,5.69,z+.9,1.1,.075,.1);
      for(const dx of [-.35,.35]){block(steel,x+dx,5.59,z+.94,.46,.28,.25);block(lamp,x+dx,5.59,z+1.072,.37,.17,.025)}
      block(steel,x+.77,4.74,z+.64,.34,.065,.07);block(M.cross,x+.84,4.78,z+.77,.18,.16,.36);block(M.dark,x+.84,4.78,z+.958,.12,.11,.024);
      for(let rung=0;rung<11;rung++)line(segments,[x-.22,.47+rung*.31,z+.59],[x+.22,.47+rung*.31,z+.59]);brace(x-.23,.43,z+.59,x-.23,3.8,z+.59,.05);brace(x+.23,.43,z+.59,x+.23,3.8,z+.59,.05);
    }
    const front=d/2-.4;
    for(const x of [-1.33,1.33]){block(concrete,x,1.85,front,.3,3.7,.45);block(yellow,x,1.16,front+.24,.31,.64,.045);block(M.dark,x,1.18,front+.266,.32,.15,.014)}
    for(const y of [.48,1.85,3.28])block(steel,0,y,front,2.52,.13,.16);for(const x of [-1.2,0,1.2])block(steel,x,1.88,front,.1,2.8,.16);
    brace(-1.17,.55,front+.07,1.17,3.23,front+.07,.1);brace(1.17,.55,front+.075,-1.17,3.23,front+.075,.1);
    const chain=new T.InstancedMesh(new T.TorusGeometry(.11,.032,5,10),steel,9);chain.name="Chained shut gate";
    for(let i=0;i<9;i++){dummy.position.set((i-4)*.17,1.58+Math.abs(i-4)*.055,front+.2);dummy.scale.set(.8,1.3,1);dummy.rotation.set(0,i%2?Math.PI/2:0,Math.PI/2);dummy.updateMatrix();chain.setMatrixAt(i,dummy.matrix)}g.add(chain);block(yellow,0,1.43,front+.23,.24,.3,.13);
    for(const x of [-2.9,2.9])block(steel,x,4,-front,.07,1.5,.07);
    sign(["GÖRLITZER PARK","SICHERHEITSZONE · ZUTRITT VERBOTEN"],6.4,.86,0,4.6,-front+.16);
    for(const x of [-4.3,4.3])sign(["ZUTRITT VERBOTEN","PARK BENUTZEN: UNTERSAGT"],2.7,.81,x,1.93,front+.1,"#d0b85d");
    // Keep the advertising below the razor wire so the camera can see the park.
    for(const x of [-6.15,-1.25])landmarkBanner("cdu",g,.65,1,x,2.6,front+.29);
    const priceTag=landmarkBanner("price",g,3.8,.79,-3.7,2.6,front+.29);priceTag.rotation.z=-.18;
    const plaqueX=(site.plaqueX-site.x-site.w/2)*S,plaqueZ=(site.plaqueY-site.y-site.h/2)*S;
    for(const x of [plaqueX-2.35,plaqueX+2.35])block(steel,x,1.18,plaqueZ-.15,.1,2.36,.1);
    sign(["GÖRLITZER PARK",...(site.signLines||[]),"KOSTEN & KLÜNGEL? · E: AKTEN"],5.6,2.42,plaqueX,2.35,plaqueZ,"#f1ecdc","#171b18");
    for(const [material,matrices] of batches){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,matrices.length);mesh.name="Park security structure";matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();g.add(mesh)}
    for(const [positions,color,name] of [[segments,0x77837a,"Double chain mesh fence"],[barbs,0xafb7a6,"Razor wire barbs"]]){const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));const mesh=new T.LineSegments(geometry,new T.LineBasicMaterial({color}));mesh.name=name;g.add(mesh)}
  }
  makeGoerlitzerPark(bridge.goerlitzerPark);

  function fence(r){
    const parts=[],x0=X(r.x),x1=X(r.x+r.w),z0=Z(r.y),z1=Z(r.y+r.h);
    for(const z of [z0,z1])for(let x=x0;x<x1;x+=1.6){if(Math.abs(x-X(z===z0?pp.x2:pp.x1))<1.8)continue;const width=Math.min(1.6,x1-x);parts.push([x,.43,z,.08,.86,.08]);for(const h of [.27,.64])parts.push([x+width/2,h,z,width,.05,.045]);for(let p=.2;p<width;p+=.2)parts.push([x+p,.43,z,.025,.76,.025])}
    for(const x of [x0,x1])for(let z=z0;z<z1;z+=1.6){const depth=Math.min(1.6,z1-z);parts.push([x,.43,z,.08,.86,.08]);for(const h of [.27,.64])parts.push([x,h,z+depth/2,.045,.05,depth]);for(let p=.2;p<depth;p+=.2)parts.push([x,.43,z+p,.025,.76,.025])}
    staticBoxes("Garden railings",M.metal,parts);
  }
  function sheds(r,n){for(let i=0;i<n;i++){const cols=Math.ceil(n/2),g=new T.Group(),fallback=new T.Group();g.add(fallback);box(1.5,1.1,1.15,mat(0x898379),0,.55,0,fallback);const roof=new T.Mesh(new T.ConeGeometry(1.15,.6,4),M.dark);roof.position.y=1.4;roof.rotation.y=Math.PI/4;fallback.add(roof);g.position.set(X(r.x+80+(i%cols)*170),0,Z(r.y+110+Math.floor(i/cols)*220));world.add(g);installCityModel(g,fallback,"garden-shed",{x:1.8,y:1.8,z:1.55})}}
  fence(bridge.policeGarden);sheds(bridge.schreber,4);sheds(bridge.policeGarden,6);
  // Use each road's already-offset coordinates: the old raw-city lamp list missed the rail gutter.
  bridge.roads.filter(r=>r.w>r.h).forEach((r,row)=>[700,1450,2800,4050,5200,6750,8300].filter((_,i)=>row===0||i!==1).forEach(x=>{
    const g=new T.Group(),fallback=new T.Group(),p=new T.Mesh(new T.CylinderGeometry(.04,.05,2.5,8),M.metal);p.position.y=1.25;fallback.add(p);box(.45,.05,.05,M.metal,.12,2.4,0,fallback);g.add(fallback);g.position.set(X(r.x+x),0,Z(r.y-sidewalk*.72));world.add(g);installCityModel(g,fallback,"streetlamp",{x:.75,y:3.35,z:.75});
  }));
  (bridge.trees||[]).forEach(({x,y},i)=>{const g=new T.Group(),fallback=new T.Group(),tr=new T.Mesh(new T.CylinderGeometry(.12,.16,1.3,7),mat(0x65594a));tr.position.y=.65;fallback.add(tr);const crown=new T.Mesh(new T.IcosahedronGeometry(.75,1),mat(0x4e5949));crown.position.y=1.7;fallback.add(crown);g.add(fallback);g.position.set(X(x),0,Z(y));g.rotation.y=i*2.39996;world.add(g);installCityModel(g,fallback,"deciduous-tree",{x:1.5,y:3.3,z:1.5})});
  const desktopBillboards={matches:!amtDirectRoute&&matchMedia("(min-width: 700px)").matches};
  function faxFallbackTexture(){const c=document.createElement("canvas");c.width=768;c.height=250;const x=c.getContext("2d");x.fillStyle="#ded9cc";x.fillRect(0,0,768,250);x.strokeStyle="#222";x.lineWidth=12;x.strokeRect(6,6,756,238);x.fillStyle="#222";x.textAlign="center";x.font="900 50px Arial";x.fillText("FAX 3000 PRO",384,70);x.font="900 32px Arial";x.fillText("2,75× SCHNELLER",384,124);x.font="700 18px Arial";x.fillText("DIE ZUKUNFT DER DIGITALISIERUNG IST PAPIER",384,195);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx}
  function propLabel(g,text,y=1.25,w=1.7){if(!text)return;const l=label(text,"");l.scale.set(w,.32,1);l.position.set(0,y,.08);g.add(l)}
  const propModels={gartenzwerg:["garden-gnome",.65,1.25,.65],pfandautomat:["pfand-machine",1.05,1.65,.74],kaffee:["coffee-machine",.95,1.5,.72],faxkiosk:["fax-kiosk",1.08,1.75,.75],faxgeraet:["fax-kiosk",1.08,1.5,.75],bench:["bench",1.7,1,.75],litterbin:["litter-bin",.52,.9,.52],bollard:["bollard",.22,.86,.22],bicyclerack:["bicycle-rack",1.7,.8,.65],
    "liege-blau":[germanPropUrl("reserved-lounger-blue"),1.19,1.12,2.55],"liege-rot":[germanPropUrl("reserved-lounger-red"),1.19,1.12,2.55],
    "zwerg-giesskanne":[germanPropUrl("garden-gnome-watering"),1.04,1.26,.57],"zwerg-schild":[germanPropUrl("garden-gnome-placard"),.95,1.26,.51],
    bierkasten:[germanPropUrl("beer-crate"),.75,.58,.54],schubkarre:[germanPropUrl("allotment-wheelbarrow"),1.56,.75,.65],
    wertstoffcontainer:[germanPropUrl("recycling-containers"),1.87,1.21,.68],picknicktisch:[germanPropUrl("allotment-picnic-table"),2.3,.83,1.98]};
  const warnedScenery=new Set(),dumpsterFlames=[];
  function prop(p){
    const g=new T.Group();
    if(p.satireId){
      const fallback=new T.Group();g.add(fallback);
      box(Math.max(.25,p.w*S),Math.max(.25,p.h*S),Math.max(.25,p.w*S*.6),M.metal,0,Math.max(.25,p.h*S)/2,0,fallback);
      if(detailPropLoader)queueCityModel(()=>({x:g.position.x,z:g.position.z}),Math.hypot(p.w*S,Math.max(.35,p.w*S))/2,async()=>{try{
        const module=await detailPropLoader,asset=await module?.loadSatireModel(p.satireId,modelLoader);
        if(!asset)return false;const model=asset.scene.clone(true);fitResponseModel(model,{x:p.w*S,y:p.h*S,z:Math.max(.35,p.w*S)});g.add(model);fallback.visible=false;return true;
      }catch(error){if(!warnedScenery.has(p.satireId)){warnedScenery.add(p.satireId);console.warn('Keeping procedural scenery for '+p.satireId,error)}return false}});
    }else if(p.asset==="faxbillboard"){
      const art=desktopBillboards.matches&&p.billboard,bw=art?4.4:4.8,bh=art?3.3:1.65,tx=faxFallbackTexture(),material=new T.MeshStandardMaterial({map:tx,roughness:.9}),board=new T.Mesh(new T.BoxGeometry(bw,bh,.12),material);
      board.position.y=art?3.5:2.8;g.add(board);[-bw*.35,bw*.35].forEach(v=>box(.1,art?2.3:2.2,.1,M.metal,v,art?1.15:1.1,0,g));
      if(art)cityTexture(art.src,()=>({x:g.position.x,z:g.position.z}),Math.hypot(bw,.12)/2,loaded=>{loaded.colorSpace=T.SRGBColorSpace;loaded.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());material.map.dispose();material.map=loaded;material.needsUpdate=true});
    }else if(p.asset==="dumpster-fire"){
      const steel=mat(0x394542),rim=mat(0x1f2826),soot=mat(0x171918),cardboard=mat(0x9b7850),paper=mat(0xcac5b8),bag=mat(0x292a26);
      box(3.2,.13,1.9,steel,0,.19,0,g);
      box(3,.08,1.7,soot,0,.74,0,g);
      for(const x of [-1.55,1.55])box(.12,1.32,1.9,steel,x,.91,0,g);
      for(const z of [-.89,.89])box(3.2,1.32,.12,steel,0,.91,z,g);
      for(const x of [-1.55,1.55])box(.17,.11,2.03,rim,x,1.61,0,g);
      for(const z of [-.89,.89])box(3.34,.11,.17,rim,0,1.61,z,g);
      for(const x of [-1.15,1.15])for(const z of [-.64,.64]){const wheel=new T.Mesh(new T.CylinderGeometry(.2,.2,.12,12),soot);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.2,z);g.add(wheel)}
      const sign=(lines,w,h,x,y,z,turn=0)=>{const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;const ctx=canvas.getContext("2d");ctx.fillStyle="#e0d7c3";ctx.fillRect(0,0,1024,256);for(const [i,color] of ["#171717","#b7272b","#dbad35"].entries()){ctx.fillStyle=color;ctx.fillRect(0,i*19,1024,19)}ctx.fillStyle="#1d2522";ctx.textAlign="center";ctx.font="900 76px Arial";ctx.fillText(lines[0],512,145,940);ctx.font="900 58px Arial";ctx.fillText(lines[1],512,216,940);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const face=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));face.position.set(x,y,z);face.rotation.y=turn;g.add(face)};
      sign(["EINIGKEIT UND RECHT","UND FREIHEIT"],2.9,.74,0,1.02,1.003);
      const stencilCanvas=document.createElement("canvas");stencilCanvas.width=512;stencilCanvas.height=64;const stencilInk=stencilCanvas.getContext("2d");stencilInk.fillStyle="#ad2527";stencilInk.fillRect(0,0,512,64);stencilInk.fillStyle="#fff4da";stencilInk.textAlign="center";stencilInk.font="900 43px Arial";stencilInk.fillText("RESTMÜLL · BRENNBAR",256,48,490);const stencilTexture=new T.CanvasTexture(stencilCanvas);stencilTexture.colorSpace=T.SRGBColorSpace;const stencil=new T.Mesh(new T.PlaneGeometry(2.9,.26),new T.MeshBasicMaterial({map:stencilTexture}));stencil.position.set(0,.43,1.005);g.add(stencil);
      sign(["FÜR DAS VATERLAND","ORDNUNG BIS ZUR ASCHE"],1.58,.7,-1.625,1.02,0,-Math.PI/2);
      sign(["FÜR DAS VATERLAND","ORDNUNG BIS ZUR ASCHE"],1.58,.7,1.625,1.02,0,Math.PI/2);
      for(const side of [-1,1]){const pole=new T.Mesh(new T.CylinderGeometry(.028,.032,3.35,8),rim);pole.position.set(side*1.75,1.77,.64);g.add(pole);for(let stripe=0;stripe<3;stripe++)box(.72,.18,.025,mat([0x111111,0xb3202b,0xd9a92f][stripe]),side*(1.75+.39),3.26-stripe*.18,.64,g)}
      for(const [x,z,a] of [[-.9,-.27,-.26],[.45,-.23,.3],[.95,.35,-.18]]){const carton=box(.68,.52,.48,cardboard,x,1.16,z,g);carton.rotation.y=a;box(.63,.025,.08,paper,x,1.43,z,g)}
      for(const [x,z,s] of [[-1.03,.42,.52],[.05,.4,.44],[1.05,-.45,.38]]){const sack=new T.Mesh(new T.SphereGeometry(s,12,8),bag);sack.scale.set(1,.78,.74);sack.position.set(x,1.22,z);g.add(sack);const knot=new T.Mesh(new T.ConeGeometry(.12,.22,7),bag);knot.position.set(x,1.58,z);g.add(knot)}
      for(const [x,z,a] of [[-.48,.48,.5],[.65,.52,-.6],[-.45,-.5,-.2]]){const sheet=box(.46,.035,.36,paper,x,1.5,z,g);sheet.rotation.y=a;sheet.rotation.z=a*.35}
      for(const [x,z] of [[-.13,-.42],[.38,-.53]]){const can=new T.Mesh(new T.CylinderGeometry(.11,.11,.32,10),mat(0x8d918a,.48));can.rotation.z=.85;can.position.set(x,1.4,z);g.add(can)}
      const flames=new T.Group(),fallback=new T.Group(),fire=new T.Group(),smoke=new T.Group();flames.position.y=1.28;fire.visible=false;smoke.visible=false;
      for(const turn of [0,Math.PI/2]){const flame=new T.Mesh(flameGeometry,flameMaterial);flame.rotation.y=turn;flame.scale.set(1.8,1.1,1);fallback.add(flame)}
      flames.add(fallback,fire);
      const maskStatus=fireMaskStatus,mask=flameMask;
      fireReady(()=>{fallback.visible=false;fire.visible=true});
      const smokeMask=cityTexture("./assets/fire/kenney-smoke-05.png",()=>({x:g.position.x,z:g.position.z}),2,()=>{smoke.visible=true});
      smokeMask.generateMipmaps=false;smokeMask.minFilter=T.LinearFilter;
      const mobile=innerWidth<700;
      const outer=particleLayer(mobile?38:56,mask,{spreadX:1.28,spreadZ:.43,baseY:.13,life:[1.15,.75],size:[.72,.42],rise:2,wobble:.2,wind:.03,opacity:.64,hot:0xffa43d,cool:0xc43c19,fadeStart:.56});
      const core=particleLayer(mobile?26:38,coreMask,{spreadX:1.12,spreadZ:.34,baseY:.14,life:[.85,.55],size:[.6,.3],rise:2.25,wobble:.14,wind:.02,opacity:.66,hot:0xffdc78,cool:0xf05e20,fadeStart:.48,crop:[.32,.17,.36,.66],blending:T.AdditiveBlending});
      const plume=particleLayer(mobile?16:24,smokeMask,{spreadX:.85,spreadZ:.3,baseY:2.12,life:[2.5,1.7],size:[1.05,.48],rise:3.2,wobble:.24,wind:.38,opacity:.37,hot:0x3e403d,cool:0x777570,fadeStart:.67,smoky:true});
      fire.add(outer,core);smoke.add(plume);g.add(smoke);for(const x of [-.8,0,.8])box(.42,.025,.24,new T.MeshBasicMaterial({color:0xe54d1b}),x,.12,0,fire);
      const emberPositions=new Float32Array(24*3),emberGeometry=new T.BufferGeometry();emberGeometry.setAttribute("position",new T.BufferAttribute(emberPositions,3));const embers=new T.Points(emberGeometry,new T.PointsMaterial({color:0xffb348,size:.085,transparent:true,opacity:.9,depthWrite:false}));g.add(embers);
      const glow=new T.PointLight(0xff7929,3.2,6,2);glow.position.set(0,2,0);g.add(glow,flames);dumpsterFlames.push({fallback,fire,smoke,glow,particleLayers:[outer,core,plume],maskStatus,mask,coreMask,smokeMask,embers,emberPositions});
    }else if(p.asset==="gartenzwerg"){
      const body=new T.Mesh(new T.ConeGeometry(.22,.65,10),mat(0x6f3c32));body.position.y=.36;g.add(body);const head=new T.Mesh(new T.SphereGeometry(.16,10,7),M.skin);head.position.y=.78;g.add(head);const hat=new T.Mesh(new T.ConeGeometry(.2,.48,10),mat(0x8b2d28));hat.position.y=1.06;g.add(hat);
    }else if(p.asset==="fahrrad"){
      const wheel=new T.TorusGeometry(.34,.045,7,18),rubber=mat(0x242524,.62),a=new T.Mesh(wheel,rubber),b=a.clone();a.position.set(-.42,.38,0);b.position.set(.42,.38,0);g.add(a,b);box(.78,.055,.055,mat(0x5c312c),0,.55,0,g).rotation.z=-.38;box(.55,.055,.055,mat(0x5c312c),0,.62,0,g).rotation.z=.58;
    }else if(["rasen","muell","db","baustelle","polizeigarten"].includes(p.asset)){
      box(.08,1.25,.08,M.metal,0,.625,0,g);box(1.35,.72,.09,p.asset==="baustelle"?mat(0xa9823e):mat(0xd8d1c1),0,1.35,0,g);propLabel(g,p.label||p.asset.toUpperCase(),1.35,1.18);
    }else{
      const h=Math.max(.8,(p.h||54)*S),w=Math.max(.52,(p.w||48)*S);box(w,h,Math.max(.42,w*.55),p.asset.includes("fax")?mat(0xb7b2a7):mat(0x666760),0,h/2,0,g);if(!["bench","litterbin","bollard","bicyclerack","liege-blau","liege-rot","zwerg-giesskanne","zwerg-schild","bierkasten","schubkarre","wertstoffcontainer","picknicktisch"].includes(p.asset))propLabel(g,p.label||p.asset.toUpperCase(),h*.62,Math.max(.9,w*.92));
    }
    const asset=propModels[p.asset];if(asset){const fallback=new T.Group();for(const child of [...g.children])if(!child.isSprite)fallback.add(child);g.add(fallback);installCityModel(g,fallback,asset[0],{x:asset[1],y:asset[2],z:asset[3]});for(const child of g.children)if(child.isSprite)child.position.y=asset[2]+.22}
    g.position.set(X(p.x),p.heightOffset||0,Z(p.y));g.rotation.y=(p.turn||0)*Math.PI/2;world.add(g);
  }
  bridge.props.filter(p=>!p.stationFixture).forEach(prop);
  function normObject(o){const g=new T.Group(),material=mat(0x6c3d37);if(o.type==="hedge")box(1.35,.72,.55,material,0,.36,0,g);else if(o.type==="chairs"){for(const x of [-.32,.32]){box(.48,.08,.48,material,x,.48,0,g);box(.48,.68,.08,material,x,.78,-.2,g);box(.06,.48,.06,material,x-.16,.24,0,g);box(.06,.48,.06,material,x+.16,.24,0,g)}}else{box(.58,.8,.58,material,0,.4,0,g);box(.66,.09,.66,M.dark,0,.85,0,g)}propLabel(g,o.label,1.18,1.65);g.position.set(X(o.x),0,Z(o.y));g.rotation.y=.08;world.add(g);return{state:o,group:g,material}}
  const normObjectSlots=(bridge.normObjects||[]).map(normObject);
  function character(kind){const g=new T.Group(),m=kind==="player"?M.player:kind==="police"?M.police:kind==="merkel"?M.merkel:M.npc;box(.42,.72,.3,m,0,.72,0,g);const head=new T.Mesh(new T.SphereGeometry(.2,10,7),M.skin);head.position.y=1.3;g.add(head);const lg=new T.CylinderGeometry(.06,.07,.5,8),ag=new T.CylinderGeometry(.05,.06,.48,8),ll=new T.Mesh(lg,m),rl=ll.clone(),la=new T.Mesh(ag,m),ra=la.clone();ll.position.set(-.1,.27,0);rl.position.set(.1,.27,0);la.position.set(-.27,.76,0);ra.position.set(.27,.76,0);g.add(ll,rl,la,ra);g.userData={ll,rl,la,ra};if(kind==="merkel"){const hair=new T.Mesh(new T.SphereGeometry(.22,10,7,0,Math.PI*2,0,Math.PI*.58),mat(0x5d5953));hair.position.y=1.39;g.add(hair)}if(kind==="police"){const cap=new T.Mesh(new T.CylinderGeometry(.21,.21,.08,10),M.dark);cap.position.y=1.52;g.add(cap)}return g}
  function syncChar(q,o,l=0){
    const previousX=q.userData.worldX??o.x,previousY=q.userData.worldY??o.y,travel=Math.hypot(o.x-previousX,o.y-previousY);q.userData.worldX=o.x;q.userData.worldY=o.y;q.userData.walkPhase=(q.userData.walkPhase||0)+travel*.13;q.position.set(X(o.x),l+bridge.stationElevation(o.x,o.y),Z(o.y));
    const target=travel>.01?Math.sin(q.userData.walkPhase)*.38:0,s=q.userData.walkSwing=(q.userData.walkSwing||0)+(target-(q.userData.walkSwing||0))*(travel>.01?1:.28);q.userData.ll.rotation.x=s;q.userData.rl.rotation.x=-s;q.userData.la.rotation.x=-s*.7;q.userData.ra.rotation.x=s*.7
  }
  const atlasTextureCache=new Map(),atlasMaterialCache=new Map();
  function atlasSprite(kind,scale){
    const source=bridge.getNpcSpriteCanvas?.(kind),grid=bridge.npcSpriteGrids?.[kind];if(!source||!grid)return null;
    let tx=atlasTextureCache.get(kind);if(!tx){tx=new T.Texture(source);tx.needsUpdate=true;tx.colorSpace=T.SRGBColorSpace;tx.generateMipmaps=false;tx.minFilter=tx.magFilter=T.LinearFilter;tx.premultiplyAlpha=true;atlasTextureCache.set(kind,tx)}
    let material=atlasMaterialCache.get(kind);if(!material){material=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.08,depthWrite:true,premultipliedAlpha:true,side:T.DoubleSide});atlasMaterialCache.set(kind,material)}
    const geometry=new T.PlaneGeometry(scale*(grid.frameWidth&&grid.frameHeight?grid.frameWidth/grid.frameHeight:1),scale),uv=geometry.attributes.uv,q=new T.Mesh(geometry,material);q.userData={[kind+"Sprite"]:true,grid,plantedHeight:grid.pivot?scale*(grid.pivot[1]/grid.frameHeight-.5):null,baseUv:Float32Array.from(uv.array),spriteFrame:-1,spriteRow:-1,spriteFlip:null};return q
  }
  function specialSprite(n){return n.special==="borderPourer"?atlasSprite("borderPourer",Germany3DBridge.npcSpriteGrids.borderPourer.pivot?2.62*224/208:2.62):n.special==="merkel"?atlasSprite("merkel",2.42):n.special==="bayern"?atlasSprite("bayern",2.91):n.special==="alice"?atlasSprite("alice",2.42):null}
  function npcSprite(n){return specialSprite(n)||(n.spriteKind?atlasSprite(n.spriteKind,n.spriteScale||2.42):null)}
  function syncAtlasSprite(q,o,height){
    const grid=q.userData.grid,frame=o.spriteFrame||0,row=o.spriteRow||0,flip=!!o.spriteFlip;
    if(frame!==q.userData.spriteFrame||row!==q.userData.spriteRow||flip!==q.userData.spriteFlip){const uv=q.geometry.attributes.uv,base=q.userData.baseUv,u0=frame/grid.cols,v0=1-(row+1)/grid.rows;for(let i=0;i<uv.count;i++){const bx=base[i*2],by=base[i*2+1];uv.setXY(i,u0+(flip?1-bx:bx)/grid.cols,v0+by/grid.rows)}uv.needsUpdate=true;q.userData.spriteFrame=frame;q.userData.spriteRow=row;q.userData.spriteFlip=flip}
    const ground=bridge.stationElevation(o.x,o.y),p=q.userData.plantedHeight,r=camera.quaternion;q.quaternion.copy(r);
    if(p!=null)q.position.set(X(o.x)+2*(r.x*r.y-r.z*r.w)*p,ground+(1-2*(r.x*r.x+r.z*r.z))*p,Z(o.y)+2*(r.y*r.z+r.x*r.w)*p);else q.position.set(X(o.x),height+ground,Z(o.y))
  }
  function syncMerkel(q,o){syncAtlasSprite(q,o,1.21)}
  function syncBayern(q,o){syncAtlasSprite(q,o,1.455)}
  function syncAlice(q,o){syncAtlasSprite(q,o,1.21)}
  function syncBorderPourer(q,o){syncAtlasSprite(q,o,1.31)}
  function pickup(item){const type=item.type,g=new T.Group();if(type==="pfand"){const m=new T.Mesh(new T.CylinderGeometry(.07,.09,.5,9),mat(0x566153)),fallback=new T.Group();m.position.y=.25;fallback.add(m);g.add(fallback);installCityModel(g,fallback,"pfand-bottle",{x:.18,y:.55,z:.18},item)}else if(item.wurstType){const m=mat(item.color),pieces=item.pieces||1;for(let i=0;i<pieces;i++){const q=new T.Mesh(new T.CapsuleGeometry(.065,.32,4,8),m);q.rotation.z=Math.PI/2;q.position.set(pieces===4?(i-1.5)*.18:0,.2+(i-(pieces-1)/2)*.13,0);g.add(q)}const seal=new T.Mesh(new T.TorusGeometry(.15,.035,8,18),mat(0xe4ddce));seal.rotation.x=Math.PI/2;seal.position.y=.6;g.add(seal)}else{const col=type==="currywurst"?0x805143:type==="bratwurst"?0x9a7653:0x8a694b,m=mat(col),q=new T.Mesh(type==="brezel"?new T.TorusGeometry(.18,.055,8,18):new T.CapsuleGeometry(.08,.4,4,8),m);q.rotation.z=type==="brezel"?0:Math.PI/2;q.position.y=.2;g.add(q)}return g}

  // Original street-character candidates are opt-in; ordinary play does not
  // request their modules. Simulation and dialogue remain owned by game.js.
  let streetCharacters=null;
  const streetParameters=new URLSearchParams(location.search),streetFailedStates=new WeakSet();
  if(streetParameters.get("streetCharacters")==="1"){
    import("./assets/models/street-characters/runtime.js?v=20261004-street1")
      .then(module=>{streetCharacters=module.createStreetCharacterSystem(T,{forcedId:streetParameters.get("streetCharacter")||null})})
      .catch(error=>console.warn("Street-character candidates unavailable; keeping accepted NPC artwork",error));
  }
  function retireNpcMesh(q){
    if(!q)return;
    if(q.userData.streetCharacter){streetCharacters?.remove(q);return}
    scene.remove(q);
    // Atlas materials/textures are shared. Only retire per-actor geometry.
    const geometries=new Set();q.traverse(node=>{if(node.geometry)geometries.add(node.geometry)});
    for(const geometry of geometries)geometry.dispose();
  }
  addEventListener("pagehide",event=>{if(!event.persisted)streetCharacters?.dispose()});

  const playerMesh=character("player");scene.add(playerMesh);
  const npcMeshes=new Map(),policeMeshes=new Map(),trafficCarMeshes=new Map(),policeVehicleMeshes=new Map(),policeHelicopterMeshes=new Map(),pickupMeshes=new Map();
  if(!amtDirectRoute)for(const car of bridge.getTrafficCars?.()||[])trafficCarMeshes.set(car,makeTrafficCarSlot(car));
  bridge.getNPCs().forEach(n=>{const q=npcSprite(n)||character("npc");scene.add(q);npcMeshes.set(n,q)});
  bridge.pickups.forEach(p=>{const q=pickup(p);scene.add(q);pickupMeshes.set(p,q)});
  const buildingSightline=new T.Raycaster(),sightlineTarget=new T.Vector3(),sightlineDirection=new T.Vector3();
  let previousOcclusionTime=performance.now();
  function buildingObstructsPlayer(slot){
    const px=X(bridge.player.x),pz=Z(bridge.player.y),ground=bridge.stationElevation(bridge.player.x,bridge.player.y);
    // Sample the actual player's silhouette, never an expanded contact footprint.
    for(const [side,height] of [[0,.2],[0,.65],[0,.9],[-.12,.9],[.12,.9],[0,1.4]]){
      sightlineTarget.set(px+side,ground+height,pz);
      sightlineDirection.subVectors(sightlineTarget,camera.position);
      const distance=sightlineDirection.length();
      buildingSightline.set(camera.position,sightlineDirection.normalize());buildingSightline.near=0;buildingSightline.far=distance-.02;
      if(slot.viewBounds&&!buildingSightline.ray.intersectsBox(slot.viewBounds))continue;
      const hits=buildingSightline.intersectObject(slot.group,true);
      if(hits.some(hit=>{
        let node=hit.object;while(node){if(!node.visible||node===slot.label||node.userData.occlusionDecoration)return false;if(node===slot.group)break;node=node.parent}
        const materials=hit.object.material,m=Array.isArray(materials)?materials[hit.face?.materialIndex||0]:materials;
        // Authored glass does not hide the player, even while the facade fades.
        return m&&(m.userData.baseOpacity??m.opacity)>=.65;
      }))return true;
    }
    return false;
  }
  function updateBuildingOcclusion(now=performance.now()){
    const dt=Math.max(0,(now-previousOcclusionTime)/1000);previousOcclusionTime=now;
    for(const slot of buildingSlots){
      slot.obstructing=buildingObstructsPlayer(slot);
      const target=slot.obstructing?.03:1;
      slot.opacity+=(target-slot.opacity)*(1-Math.exp(-(target<slot.opacity?12:8)*dt));
      if(Math.abs(slot.opacity-target)<.001)slot.opacity=target;
      const faded=slot.opacity<.985;
      for(const m of slot.materials){
        const transparent=faded||m.userData.baseTransparent;
        if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true}
        m.opacity=slot.opacity*m.userData.baseOpacity;m.depthWrite=!faded&&m.userData.baseDepthWrite;
      }
    }
  }
  function updatePowerPlants(){const now=performance.now()*.00016;for(const p of coalSmoke){const t=(now+p.index/coalSmoke.length)%1;p.mesh.position.set(p.x+Math.sin(now*25+p.index)*.52*t,p.y+t*4.5,p.z+Math.cos(now*19+p.index)*.4*t);p.mesh.scale.setScalar(.9+t*1.8);p.mesh.material.opacity=.88*(1-t)}for(const p of coalBelt){const t=(now*4+p.index/coalBelt.length)%1;p.mesh.position.lerpVectors(p.from,p.to,t);p.mesh.rotation.x+=.05;p.mesh.rotation.z+=.04}}
  // The Amt uses the same renderer and canvas as the city, with its own close camera.
  const amtScene=new T.Scene();amtScene.background=new T.Color(0xb8b4a5);
  const amtDayColor=amtScene.background.clone();amtScene.fog=new T.FogExp2(0x040308,0);
  const amtCamera=new T.PerspectiveCamera(69,innerWidth/innerHeight,.06,35);
  amtScene.add(new T.HemisphereLight(0xffffff,0x716b5c,2.2));
  const amtLight=new T.DirectionalLight(0xffeac7,1.5);amtLight.position.set(-3,5,2);amtScene.add(amtLight);
  const am=(color)=>new T.MeshStandardMaterial({color,roughness:.93});
  const paper=am(0xd8cfb7),floor=am(0x777467),wall=am(0xc0b9a7),trim=am(0x554e44),desk=am(0x615e51),screen=am(0x192f32),seat=am(0x536565),skin=am(0xc7a58b),hair=am(0xaaa9a1),coat=am(0x454b4b),otherCoat=am(0x76756d),amber=am(0xeec66d),eye=am(0x27231e),lamp= new T.MeshBasicMaterial({color:0xf7edcf});
  function amtPatina(material,base,seed,repeats){
    const canvas=document.createElement("canvas");canvas.width=canvas.height=256;
    const ctx=canvas.getContext("2d");ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
    let state=seed;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
    for(let i=0;i<1700;i++){const x=random()*256,y=random()*256,r=.3+random()*3.2;
      ctx.fillStyle=random()>.48?"rgba(30,25,18,.075)":"rgba(255,246,214,.065)";
      ctx.fillRect(x,y,r*2,r)}
    for(let i=0;i<55;i++){const x=random()*256,y=random()*256;
      ctx.strokeStyle="rgba(31,25,22,.10)";ctx.lineWidth=.35+random()*.75;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*24,y+(random()-.5)*8);ctx.stroke()}
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeats[0],repeats[1]);
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    material.map=texture;material.color.set(0xffffff);material.needsUpdate=true;
  }
  amtPatina(floor,"#77796e",91,[5,6]);amtPatina(wall,"#b7b3a4",53,[3,2]);
  amtPatina(desk,"#666154",27,[2,1]);amtPatina(seat,"#586b68",77,[1,1]);
  function ab(w,h,d,material,x,y,z){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);amtScene.add(mesh);return mesh}
  function ac(rTop,rBottom,h,material,x,y,z){const mesh=new T.Mesh(new T.CylinderGeometry(rTop,rBottom,h,12),material);mesh.position.set(x,y,z);amtScene.add(mesh);return mesh}
  function amtLabel(words,width=512,height=160,background="#263539",foreground="#e9dfbf"){
    const c=document.createElement("canvas");c.width=width;c.height=height;const ctx=c.getContext("2d");ctx.fillStyle=background;ctx.fillRect(0,0,width,height);ctx.fillStyle=foreground;ctx.font=`bold ${Math.floor(height*.38)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(words,width/2,height/2,width-22);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return{canvas:c,ctx,texture};
  }
  function amtPlate(words,x,y,z,w,h){const label=amtLabel(words);const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:label.texture}));mesh.position.set(x,y,z);amtScene.add(mesh);return mesh}
  // Wide, worn waiting hall. Registration is at the left wall; Schalter 3 is to the right.
  const grout=am(0x5e5b53),tile=am(0x898b80),steel=am(0x777e78),paperGrey=am(0xb6b3a5),red=am(0x8b3431),rubber=am(0x343937);
  ab(15.4,.12,19.2,floor,0,-.06,-.85);ab(15.4,4,.16,wall,0,2,-10.45);
  for(const x of [-7.7,7.7])ab(.16,4,19.2,wall,x,2,-.85);
  ab(15.4,.12,19.2,paper,0,4.05,-.85);
  for(let z=-10;z<8.7;z+=.82)ab(15.2,.012,.018,grout,0,.005,z);
  for(let x=-7.4;x<7.5;x+=.82)ab(.018,.012,19,grout,x,.005,-.85);
  for(const z of [-7.4,-3.8,0,3.8,7.4]){ab(2.8,.025,.54,lamp,0,3.97,z);ab(2.95,.04,.62,trim,0,4,z)}
  for(const z of [-7.3,-2.9,2,6.7]){ab(.035,.05,15.1,trim,0,3.84,z);ab(15.1,.05,.035,trim,0,3.84,z)}
  for(const x of [-7.57,7.57]){ab(.035,.11,19,trim,x,.26,-.85);ab(.035,.11,19,trim,x,2.15,-.85)}
  // The actual doorway matches the simulation threshold at z=5.55.
  for(const x of [-4.525,4.525])ab(6.35,4,.16,wall,x,2,5.55);
  ab(2.7,.82,.16,wall,0,3.59,5.55);
  for(const x of [-1.35,1.35])ab(.08,3.2,.18,trim,x,1.6,5.55);
  amtPlate("EINGANG / AUSGANG",0,3.35,5.66,2.7,.35);
  ab(1.5,1.57,.58,screen,-4.65,.78,.8);ab(1.14,.72,.025,amber,-4.65,1.18,1.11);
  amtPlate("ANMELDUNG",-4.65,1.68,1.13,1.56,.34);
  ab(14.5,.94,1.12,desk,0, .49,-9.1);ab(14.7,.1,1.21,trim,0,1,-9.03);
  const plainDeskSupplies=[];
  for(const [i,x] of [-5.8,-1.6,3.9,6.2].entries()){
    ab(.055,1.65,.85,steel,x+1.15,1.83,-9.74);
    amtPlate(`SCHALTER ${i+1}`,x,2.65,-10.31,1.82,.39);
    plainDeskSupplies.push(ab(.6,.37,.09,screen,x-.38,1.24,-9.48));
    plainDeskSupplies.push(ab(.5,.035,.35,paperGrey,x+.36,1.08,-8.78));
    plainDeskSupplies.push(ab(.08,.055,.11,red,x+.39,1.14,-8.79));
    for(let f=0;f<3;f++)plainDeskSupplies.push(ab(.36,.01,.24,paper,x-.35+f*.16,1.055+f*.005,-8.72-f*.1));
  }
  for(const [x,z] of [[-5.9,1.7],[-2.1,1.7],[1.7,1.7],[5.5,1.7],[-5.9,-1.1],[-2.1,-1.1],[1.7,-1.1],[5.5,-1.1]]){
    ab(.74,.07,.68,seat,x,.52,z);ab(.7,.76,.07,seat,x,.92,z-.31);
    for(const leg of [-.28,.28])ab(.045,.45,.045,steel,x+leg,.25,z);
    ab(.9,.05,.045,steel,x,.6,z+.32);
  }
  for(const [words,x,z] of [["IHR BESUCH",-6.3,-10.35],["MELDEWESEN",-4.4,-10.35],["HAUSORDNUNG",5.8,-10.35],["FORMULARE",6.4,-10.35]]){
    amtPlate(words,x,2.15,z,.95,.5);
  }
  for(const x of [-6.8,6.8]){ab(.48,1.3,.4,paperGrey,x,.67,-4.65);amtPlate("FORMULAR",x,1.45,-4.43,.45,.22)}
  for(const [x,z] of [[-4.2,3.6],[4.3,3.6]]){ac(.12,.12,.62,steel,x,.31,z);ab(.86,.045,.045,red,x,.63,z)}
  // The QR is painted onto the sign after the phone invitation is generated.
  const qrCanvas=document.createElement("canvas");qrCanvas.width=256;qrCanvas.height=256;
  const qrCtx=qrCanvas.getContext("2d");qrCtx.fillStyle="#f6f3e9";qrCtx.fillRect(0,0,256,256);
  const qrTexture=new T.CanvasTexture(qrCanvas);qrTexture.colorSpace=T.SRGBColorSpace;
  ab(2.8,2.65,.12,trim,0,1.54,-4.22);
  ab(2.63,2.48,.025,paper,0,1.54,-4.145);
  amtPlate("BITTE SCANNEN · NUMMER ERHALTEN",0,2.46,-4.11,2.48,.4);
  const qrMesh=new T.Mesh(new T.PlaneGeometry(1.76,1.76),new T.MeshBasicMaterial({map:qrTexture}));
  qrMesh.position.set(0,1.39,-4.103);amtScene.add(qrMesh);
  let amtQrSource="";
  function setAmtQr(svg){if(!svg||svg===amtQrSource)return;amtQrSource=svg;const picture=new Image();picture.onload=()=>{qrCtx.fillStyle="#f6f3e9";qrCtx.fillRect(0,0,256,256);qrCtx.drawImage(picture,0,0,256,256);qrTexture.needsUpdate=true};picture.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)}
  const amtCharacters=[],amtTextureLoader=new T.TextureLoader(),amtMobile=matchMedia("(max-width: 700px)").matches;
  function amtPaintMaterial(){
    const material=new T.MeshBasicMaterial({transparent:true,alphaTest:.035,depthWrite:false,side:T.DoubleSide});
    const breath={value:0};material.userData.breath=breath;
    material.onBeforeCompile=shader=>{shader.uniforms.amtBreath=breath;
      shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",
        "#include <map_fragment>\nfloat amtLightness=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(amtLightness),diffuseColor.rgb,1.085+.055*amtBreath)*(1.015+.035*amtBreath);");
      shader.fragmentShader="uniform float amtBreath;\n"+shader.fragmentShader;
    };
    return material;
  }
  function amtTexture(url,onLoad,onError,required=false){
    let retired=false;
    const texture=new T.Texture(),load=()=>retired?Promise.resolve(null):new Promise(resolve=>amtTextureLoader.load(url,loaded=>{
      if(!retired){texture.image=loaded.image;texture.needsUpdate=true;onLoad?.(texture)}resolve(texture);
    },undefined,error=>{onError?.(error);resolve(null)}));
    texture.addEventListener("dispose",()=>{retired=true});
    texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;
    texture.minFilter=texture.magFilter=T.LinearFilter;
    const loading=(bridge.queueAssetLoad?bridge.queueAssetLoad(load):load()).catch(error=>{onError?.(error);return null});
    if(required){officeAssetPending++;loading.then(result=>{if(!result)officeAssetFailures++}).finally(()=>officeAssetPending--)}
    return texture;
  }
  function amtUv(actor,col,row,cols,rows){
    const u0=col/cols,v0=1-(row+1)/rows;
    for(let i=0;i<actor.uv.count;i++)actor.uv.setXY(i,u0+actor.base[i*2]/cols,v0+actor.base[i*2+1]/rows);
    actor.uv.needsUpdate=true;
  }
  function amtCharacter(name,x,z,phase=0,height=1.9,identity={}){
    const performance=name==="clerk";
    const url=`./assets/buergeramt/characters/${performance?"clerk-performance":name}${amtMobile?"-mobile":""}.webp?v=20261007-amt-performance`;
    const geometry=new T.PlaneGeometry(height*192/416,height),uv=geometry.attributes.uv,base=Float32Array.from(uv.array);
    const mesh=new T.Mesh(geometry,amtPaintMaterial());
    mesh.position.set(x,height/2,z);amtScene.add(mesh);
    amtCharacters.push({name,url,mesh,uv,base,phase,frame:-1,renderKey:"",performance,lead:performance&&x===3.9,mood:0,...identity});
  }
  amtCharacter("clerk",3.9,-9.77,.25,1.82,{id:"amt-brunhilde-knick",fullName:"Brunhilde Knick",voiceId:"amt-brunhilde-knick"});
  amtCharacter("clerk",-5.8,-9.77,1.4,1.76,{decorativeCloneOf:"amt-brunhilde-knick"});
  amtCharacter("clerk",-1.6,-9.77,2.2,1.76,{decorativeCloneOf:"amt-brunhilde-knick"});
  amtCharacter("renter",-5.9,1.39,0,1.83,{id:"amt-konrad-wohnungszettel",fullName:"Konrad Wohnungszettel",voiceId:"amt-konrad-wohnungszettel"});
  amtCharacter("parent",5.5,1.39,1.1,1.9,{id:"amt-mechthild-elternbogen",fullName:"Mechthild Elternbogen",voiceId:"amt-mechthild-elternbogen"});
  amtCharacter("pensioner",1.7,-1.39,2.0,1.82,{id:"amt-wolfram-rentenbescheid",fullName:"Wolfram Rentenbescheid",voiceId:"amt-wolfram-rentenbescheid"});
  const amtMoving=[];
  for(const [id,height] of [["aktenkurier",1.96],["archivbotin",1.77],["formularsammler",1.85],
                            ["nummernfluesterer",1.84],["nachtschichtmelderin",1.8],["pfandarchitektin",1.72],
                            ["kopiependler",1.84],["warteschlangenpoetin",1.83]]){
    const geometry=new T.PlaneGeometry(height*320/416,height),uv=geometry.attributes.uv,base=Float32Array.from(uv.array);
    const mesh=new T.Mesh(geometry,amtPaintMaterial());
    mesh.visible=false;amtScene.add(mesh);
    const walkFrames=["aktenkurier","archivbotin"].includes(id)?16:8;
    amtMoving.push({id,height,mesh,uv,base,walkFrames,cell:-1,renderKey:"",mood:0});
  }
  const amtPaintedProps=[];
  function amtPaintedProp(column,width,height,x,y,z,turn=0){
    const geometry=new T.PlaneGeometry(width,height),uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setX(i,(column*384+4+uv.getX(i)*376)/1536);
    uv.needsUpdate=true;
    const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({transparent:true,depthWrite:false,side:T.DoubleSide}));
    mesh.position.set(x,y,z);mesh.rotation.y=turn;mesh.visible=false;
    amtScene.add(mesh);amtPaintedProps.push(mesh);
  }
  amtPaintedProp(0,.95,2.5,-6.8,1.28,-6.45);
  amtPaintedProp(1,1.05,2.75,6.8,1.4,-5.55);
  amtPaintedProp(2,.65,1.45,-6.65,2.58,-10.27);
  amtPaintedProp(3,1.15,2.85,7.55,1.55,.2,-Math.PI/2);
  let amtImagesRequested=false,officeDetail=null,officeAssetPending=0,officeAssetFailures=0;
  const amtStationaryDetails=new Map();
  function loadAmtImages(){
    if(amtImagesRequested)return;amtImagesRequested=true;
    officeAssetPending++;
    const loadDetail=()=>import("./assets/buergeramt/office-detail.js?v=20261006-dense-office").then(()=>{
      const detail=window.GermanyAmtOfficeDetail.create(T,{compact:amtMobile,anisotropy:renderer.capabilities.getMaxAnisotropy()});
      detail.attach(amtScene);
      officeDetail=detail;
      for(const mesh of plainDeskSupplies)mesh.visible=false;
      window.BuergeramtLevel?.setOfficeObstacles(detail.obstacles);
    });
    (bridge.queueAssetLoad?bridge.queueAssetLoad(loadDetail):loadDetail()).catch(error=>{officeAssetFailures++;console.warn("Bürgeramt office detail unavailable",error)}).finally(()=>officeAssetPending--);
    const textures=new Map();
    for(const actor of amtCharacters){
      let texture=textures.get(actor.url);
      if(!texture){texture=amtTexture(actor.url,undefined,undefined,true);textures.set(actor.url,texture)}
      actor.atlas=texture;actor.mesh.material.map=texture;actor.mesh.material.needsUpdate=true;
      const detailUrl=`./assets/buergeramt/characters/${actor.performance?"clerk-performance":actor.name}-detail.webp?v=20261007-paint-detail`;
      actor.detailUrl=detailUrl;
    }
    for(const actor of amtMoving){
      const url=`./assets/buergeramt/characters/${actor.id}-motion${amtMobile?"-mobile":""}.webp?v=20261008-dense-walk`;
      const texture=amtTexture(url,()=>{actor.mesh.visible=true},error=>console.warn("Bürgeramt character unavailable",actor.id,error),true);
      actor.atlas=texture;
      actor.mesh.material.map=texture;actor.mesh.material.needsUpdate=true;
    }
    const texture=amtTexture("./assets/buergeramt/office-props.webp?v=20261006-amt-props",
      ()=>{for(const mesh of amtPaintedProps)mesh.visible=true},undefined,true);
    texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;
    texture.minFilter=texture.magFilter=T.LinearFilter;
    for(const mesh of amtPaintedProps){mesh.material.map=texture;mesh.material.needsUpdate=true}
  }
  function animateAmtCharacters(now,level){
    for(const actor of amtCharacters){
      const frame=actor.performance?actor.lead?level.clerkPerformance.row*8+level.clerkPerformance.frame:Math.floor(now/250+actor.phase*8)%8:Math.floor(now/1000*24+actor.phase*24)%64;
      actor.frame=frame;
      const distance=Math.hypot(amtCamera.position.x-actor.mesh.position.x,amtCamera.position.z-actor.mesh.position.z),close=distance<4.5;
      if(distance<6&&!actor.detail&&actor.detailUrl){
        if(!amtStationaryDetails.has(actor.detailUrl))amtStationaryDetails.set(actor.detailUrl,amtTexture(actor.detailUrl));
        actor.detail=amtStationaryDetails.get(actor.detailUrl);
      }
      const detailed=close&&!!actor.detail?.image;
      const texture=detailed?actor.detail:actor.atlas;
      if(texture&&actor.mesh.material.map!==texture){actor.mesh.material.map=texture;actor.mesh.material.needsUpdate=true}
      const row=Math.floor(frame/8),col=frame%8;
      const key=detailed?actor.performance?`detail:${row===5?8+col:row}`:"detail":"atlas:"+frame;
      if(key!==actor.renderKey){actor.renderKey=key;
        if(detailed&&actor.performance)amtUv(actor,row===5?col:row,row===5?1:0,8,2);
        else if(detailed)amtUv(actor,0,0,1,1);
        else amtUv(actor,col,row,8,actor.performance?6:8);
      }
      const breath=Math.sin(now/1900+actor.phase*3)*.78+Math.sin(now/3300+actor.phase*5)*.22;
      actor.mesh.material.userData.breath.value=breath;
      const stretch=detailed?1+.0025*breath:1;
      actor.mesh.scale.set(1,stretch,1);actor.mesh.position.y=actor.mesh.geometry.parameters.height*stretch/2;
    }
  }
  const amtNeutral=new T.Color(0xffffff),amtTone={dread:new T.Color(0xaeb3c9),warning:new T.Color(0xc7adb8),procedural:new T.Color(0xc0c8c0),relief:new T.Color(0xd6c5a5)};
  let lastAmtRender=performance.now();
  function animateAmtMoving(now,level){
    const dt=Math.min(.1,Math.max(0,(now-lastAmtRender)/1000));lastAmtRender=now;
    const states=level.characters||[],mood=level.characterMood;
    for(const actor of amtMoving){
      const state=states.find(item=>item.id===actor.id);
      if(!state)continue;
      actor.mesh.position.set(state.x,actor.height/2,state.z);
      actor.mesh.rotation.y=Math.atan2(amtCamera.position.x-state.x,amtCamera.position.z-state.z);
      const distance=Math.hypot(amtCamera.position.x-state.x,amtCamera.position.z-state.z),close=distance<5;
      if(close&&!actor.detail){const url=`./assets/buergeramt/characters/${actor.id}-detail.webp?v=20261007-paint-detail`;
        actor.detail=amtTexture(url,undefined,error=>console.warn("Bürgeramt detail unavailable",actor.id,error));}
      const omen=level.omen,facePlayer=actor.id==="aktenkurier"&&["approach","blackout","glare"].includes(omen.phase);
      if(actor.mesh.material.fog===facePlayer){actor.mesh.material.fog=!facePlayer;actor.mesh.material.needsUpdate=true}
      const direction=facePlayer?"down":state.direction;
      // Hold the registered frontal gesture as the paint becomes a relief.
      const row=facePlayer&&omen.life.opacity>0?5:state.mode==="walk"?({down:0,right:1,up:2,left:3}[direction]??0):({work:4,gesture:5,look:6,flinch:7}[state.mode]??4);
      if(close&&row<4&&actor.walkDirection!==direction){
        if(actor.walkDetail){if(actor.mesh.material.map===actor.walkDetail){actor.mesh.material.map=actor.atlas;actor.mesh.material.needsUpdate=true}actor.walkDetail.dispose()}
        actor.walkDirection=direction;
        const smallDetail=amtMobile&&(window.devicePixelRatio||1)<1.5&&actor.walkFrames===16;
        const url=`./assets/buergeramt/characters/${actor.id}-walk-${direction}-detail${smallDetail?"-mobile":""}.webp?v=20261008-dense-walk`;
        actor.walkDetail=amtTexture(url,undefined,error=>console.warn("Bürgeramt walk detail unavailable",actor.id,error));
      }
      // The simulation's distance clock keeps its cadence and action boundaries.
      // Denser art samples the same normalized phase; it never speeds up the walk.
      const sample=row<4?Math.min(actor.walkFrames-1,Math.floor((state.phase??state.frame/8)*actor.walkFrames)):state.frame;
      const cell=row<4?row*actor.walkFrames+sample:4*actor.walkFrames+(row-4)*8+sample;
      actor.cell=cell;
      const actionDetail=close&&row>=4&&!!actor.detail?.image;
      const walkDetail=close&&row<4&&actor.walkDirection===direction&&!!actor.walkDetail?.image;
      const texture=actionDetail?actor.detail:walkDetail?actor.walkDetail:actor.atlas;
      if(texture&&actor.mesh.material.map!==texture){actor.mesh.material.map=texture;actor.mesh.material.needsUpdate=true}
      const key=actionDetail?`detail:${row}`:walkDetail?`walk:${row}:${sample}`:`atlas:${cell}`;
      if(key!==actor.renderKey){actor.renderKey=key;
        if(actionDetail)amtUv(actor,row-4,0,4,1);
        else if(walkDetail)amtUv(actor,sample%4,Math.floor(sample/4),4,actor.walkFrames/4);
        else {const cols=actor.walkFrames===16?12:8;amtUv(actor,cell%cols,Math.floor(cell/cols),cols,8)}
      }
      if(distance>7){actor.walkDetail?.dispose();actor.walkDetail=null;actor.walkDirection="";actor.detail?.dispose();actor.detail=null}
      actor.mesh.material.userData.breath.value=Math.sin(now/1750+actor.height*7)*.75+Math.sin(now/2900+actor.height*11)*.25;
      const stretch=actionDetail?1+.0025*actor.mesh.material.userData.breath.value:1;
      actor.mesh.scale.y=stretch;actor.mesh.position.y=actor.height*stretch/2;
      if(mood?.id===actor.id)actor.tone=mood.tone;
      const target=mood?.id===actor.id?Math.min(.25,.08+Math.abs(mood.valence)*.2):0;
      actor.mood+=(target-actor.mood)*(1-Math.exp(-dt/1.05));
      actor.mesh.material.color.copy(amtNeutral).lerp(amtTone[actor.tone]||amtTone.procedural,actor.mood);
    }
    const knick=amtCharacters[0];
    if(knick){const target=mood?.id==="clerk"?Math.min(.22,.08+Math.abs(mood.valence)*.16):0;
      knick.mood+=(target-knick.mood)*(1-Math.exp(-dt/1.05));
      knick.mesh.material.color.copy(amtNeutral).lerp(amtTone[mood?.tone]||amtTone.procedural,knick.mood)}
  }
  const callCanvas=document.createElement("canvas");callCanvas.width=512;callCanvas.height=256;const callCtx=callCanvas.getContext("2d");const callTexture=new T.CanvasTexture(callCanvas);callTexture.colorSpace=T.SRGBColorSpace;
  ab(2.6,.9,.11,screen,0,3.33,-4.22);
  const callMesh=new T.Mesh(new T.PlaneGeometry(2.3,.62),new T.MeshBasicMaterial({map:callTexture}));callMesh.position.set(0,3.35,-4.151);amtScene.add(callMesh);
  const omenScene=new T.Scene(),omenCamera=new T.OrthographicCamera(-1,1,1,-1,0,1),omenFocus=new T.Vector3();
  const omenMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
    uniforms:{focus:{value:new T.Vector2(.5,.5)},radius:{value:new T.Vector2(.25,.45)},strength:{value:0},clock:{value:0},reveal:{value:0}},
    vertexShader:"varying vec2 spotUv;void main(){spotUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
    fragmentShader:`varying vec2 spotUv;uniform vec2 focus;uniform vec2 radius;
      uniform float strength;uniform float clock;uniform float reveal;
      void main(){
        vec2 p=(spotUv-focus)/radius;float d=length(p);
        float dark=smoothstep(.66,1.04,d),halo=exp(-pow((d-.86)/.13,2.0));
        vec3 ink=vec3(.035,.020,.055)*(.88+.12*sin(clock*.8+d*2.0));
        vec3 color=mix(vec3(.003,.002,.007),ink,halo);
        // The moving tunnel is now a Gaussian volume. This only seals its edges.
        float window=exp(-pow((d-1.02)/.42,2.0));
        gl_FragColor=vec4(color,strength*clamp(dark*.99+halo*.27-reveal*window*.60,0.0,.995));
      }`
  });
  omenScene.add(new T.Mesh(new T.PlaneGeometry(2,2),omenMaterial));
  const amtReducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
  let amtOmenSplat=null,amtOmenRequest=null,amtOmenVisit=-1,amtOmenSkipped=false,amtOmenFailure="";
  function clearAmtOmenSplat(){
    amtOmenRequest?.abort();amtOmenRequest=null;
    amtOmenSplat?.dispose();amtOmenSplat=null;
    const actor=amtMoving[0];actor.mesh.material.opacity=1;
    actor.mesh.visible=!!actor.atlas?.image;
  }
  function updateAmtOmenSplat(level){
    if(!level.active){clearAmtOmenSplat();return}
    const omen=level.omen,actor=amtMoving[0];
    if(omen.visit!==amtOmenVisit){
      clearAmtOmenSplat();amtOmenVisit=omen.visit;amtOmenSkipped=false;amtOmenFailure="";
    }
    if(omen.phase==="recover"||!omen.enabled||!omen.phase&&!["outside","walk-sign"].includes(level.stage)){clearAmtOmenSplat();amtOmenSkipped=true;return}
    // A late optional asset never replaces the actor halfway through his line.
    if(omen.life.opacity>0&&!amtOmenSplat){amtOmenSkipped=true;amtOmenRequest?.abort()}
    if(!amtOmenRequest&&!amtOmenSplat&&!amtOmenSkipped&&!document.hidden&&
       ["outside","walk-sign","omen"].includes(level.stage)){
      const request=new AbortController(),visit=amtOmenVisit;amtOmenRequest=request;
      const prepare=async()=>{
        if(request.signal.aborted||document.hidden||!level.active)return null;
        const module=await import("./buergeramt-splat.js?v=20261008-omen-facing-score");
        request.signal.throwIfAborted();
        return module.createOmenSplat({THREE:T,renderer,scene:amtScene,signal:request.signal});
      };
      (bridge.queueAssetLoad?bridge.queueAssetLoad(prepare):prepare()).then(effect=>{
        if(request.signal.aborted||visit!==amtOmenVisit||amtOmenSkipped||!level.active){effect?.dispose();return}
        if(effect)amtOmenSplat=effect;
      }).catch(error=>{
        if(request.signal.aborted)return;
        amtOmenSkipped=true;amtOmenFailure=error.message;console.warn("Bürgeramt omen keeps painted fallback",error);
      }).finally(()=>{if(amtOmenRequest===request)amtOmenRequest=null});
    }
    const opacity=amtOmenSplat?.update(omen,actor.mesh,amtCamera,amtReducedMotion.matches)||0;
    actor.mesh.material.opacity=1-opacity;
    actor.mesh.visible=opacity<.999&&!!actor.atlas?.image;
  }
  let lastCall="",amtHiDpi=false;
  function renderAmt(){const level=window.BuergeramtLevel;
    if(!level||!level.active&&!document.body.classList.contains("amt-direct-mode")){
      if(amtOmenSplat||amtOmenRequest)clearAmtOmenSplat();
      if(amtHiDpi){amtHiDpi=false;resize()}
      return false;
    }
    if(!amtHiDpi){amtHiDpi=true;resize()}
    loadAmtImages();const darkness=level.omen.strength;amtScene.fog.density=.46*Math.pow(darkness,1.2);amtScene.background.copy(amtDayColor).lerp(amtScene.fog.color,darkness);const view=level.view;amtCamera.position.set(view.x,1.68,view.z);amtCamera.rotation.set(0,-view.yaw,0);if(level.qrSvg)setAmtQr(level.qrSvg);const now=performance.now();animateAmtCharacters(now,level);animateAmtMoving(now,level);updateAmtOmenSplat(level);const call=level.queueDisplay;if(call!==lastCall){lastCall=call;callCtx.fillStyle="#152527";callCtx.fillRect(0,0,512,256);callCtx.textAlign="center";callCtx.textBaseline="middle";callCtx.fillStyle="#c94839";callCtx.font="bold 112px monospace";callCtx.fillText(call,256,135,460);callTexture.needsUpdate=true}renderer.render(amtScene,amtCamera);
    const omen=level.omen;if(omen.strength>0){omenFocus.set(omen.x,1.04,omen.z).project(amtCamera);omenMaterial.uniforms.focus.value.set((omenFocus.x+1)/2,(omenFocus.y+1)/2);omenMaterial.uniforms.radius.value.set(Math.min(.43,.31/Math.max(.75,innerWidth/innerHeight)),.47);omenMaterial.uniforms.strength.value=omen.strength;omenMaterial.uniforms.clock.value=amtReducedMotion.matches?0:omen.life.time;omenMaterial.uniforms.reveal.value=amtReducedMotion.matches?0:amtOmenSplat?.inspect().reveal||0;renderer.autoClear=false;renderer.render(omenScene,omenCamera);renderer.autoClear=true}
    return true}
  function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1,Math.sqrt(1600000/Math.max(1,innerWidth*innerHeight))));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();amtCamera.aspect=innerWidth/innerHeight;amtCamera.updateProjectionMatrix()}resize();addEventListener("resize",resize,{passive:true});
  const spawnProbe=new T.Vector3();
  const vehicleViewFrustum=new T.Frustum(),vehicleViewMatrix=new T.Matrix4(),vehicleViewBounds=new T.Box3();
  function isVehicleVisible(x,y,angle=0){
    camera.updateMatrixWorld();
    vehicleViewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    vehicleViewFrustum.setFromProjectionMatrix(vehicleViewMatrix);
    // Conservative complete-car envelope includes maximum steering, mirrors,
    // roof lamps and its ground shadow, regardless of loaded/fallback model.
    const radius=107*S,elevation=bridge.vehicleElevation?.(x,y)||0,px=X(x),pz=Z(y);
    vehicleViewBounds.min.set(px-radius,elevation-.5,pz-radius);
    vehicleViewBounds.max.set(px+radius,elevation+2.25,pz+radius);
    return vehicleViewFrustum.intersectsBox(vehicleViewBounds);
  }
  function isWorldPointVisible(x,y,padding=0,kind="officer"){const height=kind==="helicopter"?6.8:kind==="car"?.7:1;spawnProbe.set(X(x),height,Z(y)).project(camera);const padX=padding/Math.max(1,innerWidth)*2,padY=padding/Math.max(1,innerHeight)*2;return spawnProbe.z>=-1&&spawnProbe.z<=1&&spawnProbe.x>=-1-padX&&spawnProbe.x<=1+padX&&spawnProbe.y>=-1-padY&&spawnProbe.y<=1+padY}
  function inspectAssets(){
    const bounds=model=>{if(!model)return null;const b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3());return{width:s.x,height:s.y,depth:s.z,ground:b.min.y}};
    return{brandmauerFire:{loaded:lineFire.visible,fallback:firePlaneA.visible,particles:lineParticleLayers.map(layer=>layer.geometry.attributes.position.count),...fireMaskStatus},dumpsterFire:dumpsterFlames.map(({fire,smoke,fallback,maskStatus,mask,coreMask,smokeMask})=>({loaded:fire.visible,smoke:smoke.visible,fallback:fallback.visible,...maskStatus,images:[mask.image?.width||0,coreMask.image?.width||0,smokeMask.image?.width||0]})),streetCharacters:streetCharacters?.inspect()||null,placards:placardLayouts.map(item=>({...item})),buildings:buildingSlots.filter(s=>!s.building.kind).map(s=>({id:s.building.id,loaded:!!s.model,fallback:s.fallback.visible,bounds:bounds(s.model),glass:[...s.materials].filter(m=>/glass/i.test(m.name)).map(m=>({name:m.name,opacity:m.opacity,baseOpacity:m.userData.baseOpacity}))})),city:cityAssetSlots.map(s=>({file:s.file,loaded:!!s.model,fallback:s.fallback.visible,bounds:bounds(s.model)})),monument:kiesingerMonument?{bounds:bounds(kiesingerMonument),scale:kiesingerMonument.scale.y,loaded:!!kiesingerMonument.getObjectByName("KiesingerSculpture")}:null,banners:landmarkBanners.map(({kind,mesh})=>({kind,bounds:bounds(mesh)})),vehicles:[...trafficCarMeshes.values(),...policeVehicleMeshes.values()].map(s=>({id:s.state.id,kind:s.kind,loaded:!!s.model,fallback:s.fallback.visible,bounds:bounds(s.model),wheels:s.wheels.map(w=>({name:w.node.name,angle:w.node.rotation.x,radius:w.radius})),steering:s.steering.map(o=>o.rotation.y),brakes:s.brakes.map(m=>m.emissiveIntensity),beacons:s.beacons.map(b=>b.material.emissiveIntensity)})),sources:[...localModels.keys()],render:{...renderer.info.render},memory:{...renderer.info.memory}};
  }
  // Prune complete off-camera groups, including the many meshes in distant stand-ins.
  const renderFrustum=new T.Frustum(),renderViewMatrix=new T.Matrix4(),trainRenderSphere=new T.Sphere();
  function visibleGroupMatrixUpdate(force){if(this.visible)T.Object3D.prototype.updateMatrixWorld.call(this,force)}
  function updateGroupVisibility(){
    camera.updateMatrixWorld();renderViewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);renderFrustum.setFromProjectionMatrix(renderViewMatrix);
    for(const slot of buildingSlots){
      if(slot.building.kind)continue; // Plant smoke/belts need their full motion envelope.
      slot.group.updateMatrixWorld=visibleGroupMatrixUpdate;
      const wasVisible=slot.group.visible,visible=renderFrustum.intersectsBox(slot.viewBounds);slot.group.visible=visible;
      if(visible&&!wasVisible)slot.group.updateMatrixWorld(true);
    }
    for(const slot of trainSlots)for(const car of slot.cars){
      // Covers either full coach mesh, procedural stand-in, roof and bump displacement.
      trainRenderSphere.center.set(car.group.position.x,.9,car.group.position.z);trainRenderSphere.radius=3.4;
      car.group.updateMatrixWorld=visibleGroupMatrixUpdate;
      const visible=renderFrustum.intersectsSphere(trainRenderSphere);car.group.visible=visible;
    }
  }
  // Only these owned roots gate updateMatrixWorld; Box3/updateWorldMatrix diagnostics remain available.
  let parkCameraFrame=0,previousCameraTime=performance.now();
  captureStartupAssets();
  startupModelsCaptured=true;
  window.Germany3D={ready:true,isWorldPointVisible,isVehicleVisible,prepareNearbyAssets,prepareOfficeAssets:loadAmtImages,clearAmtOmenSplat,
  get nearbyAssetsReady(){updateAssetView();return cityModelJobs.every(job=>job.state==="settled"||cityModelDistance(job)>30&&!isCityAssetVisible(job))},
  get officeAssetsReady(){return amtImagesRequested&&officeAssetPending===0},get officeAssetStatus(){return {pending:officeAssetPending,failed:officeAssetFailures}},
  get startupReady(){return startupModelsReady()},get startupStatus(){return {pending:[...startupModelJobs].filter(job=>job.state!=="settled").length,active:cityModelActive,failed:[...startupModelJobs].filter(job=>job.failed).length}},
  get buildingVisibility(){return buildingSlots.map(slot=>({id:slot.building.id,opacity:slot.opacity,obstructing:!!slot.obstructing}))},sync(){
    if(amtDirectRoute&&!window.BuergeramtLevel?.active){clearAmtOmenSplat();loadAmtImages();return}
    if(renderAmt()){previousOcclusionTime=performance.now();return}
    prepareNearbyAssets();
    syncChar(playerMesh,bridge.player,0);
    playerMesh.rotation.y=bridge.player.facing;
    for(const slot of trainSlots){for(let i=0;i<slot.cars.length;i++){const car=slot.train.cars[i],group=slot.cars[i].group,jolt=Math.sin(performance.now()*.04+i)*slot.train.bump*.1;group.position.set(X(car.x),.07+jolt,Z(car.y));group.rotation.y=Math.PI/2-car.angle}for(let i=0;i<slot.gangways.length;i++){const a=slot.train.cars[i],b=slot.train.cars[i+1],ax=X(a.x),az=Z(a.y),bx=X(b.x),bz=Z(b.y),mesh=slot.gangways[i],length=Math.hypot(bx-ax,bz-az);mesh.position.set((ax+bx)/2,.54,(az+bz)/2);mesh.rotation.y=Math.atan2(bx-ax,bz-az);mesh.scale.z=Math.max(.18,length-4.64)}}
    const ns=bridge.getNPCs(),streetNow=performance.now()/1000;
    let streetBuildBudget=2;
    ns.forEach(n=>{
      let q=npcMeshes.get(n),kind=n.special||n.spriteKind;
      if(n.special&&q?.userData.streetCharacter){retireNpcMesh(q);npcMeshes.delete(n);q=null}
      if(streetCharacters&&!n.special&&!q?.userData.streetCharacter&&!streetFailedStates.has(n)&&streetBuildBudget>0&&Math.hypot(n.x-bridge.player.x,n.y-bridge.player.y)*S<38){
        streetBuildBudget--;
        const candidate=streetCharacters.create(n);
        if(candidate){retireNpcMesh(q);q=candidate;scene.add(q);npcMeshes.set(n,q)}else streetFailedStates.add(n);
      }
      if(q?.userData.streetCharacter){
        try{
          streetCharacters.update(q,{x:X(n.x),z:Z(n.y),elevation:bridge.stationElevation(n.x,n.y),timeSeconds:streetNow,playerX:X(bridge.player.x),playerZ:Z(bridge.player.y)});
          return;
        }catch(error){
          console.warn("Street-character animation unavailable; restoring accepted NPC artwork",error);
          streetFailedStates.add(n);retireNpcMesh(q);npcMeshes.delete(n);q=null;
        }
      }
      if(kind&&!q?.userData[kind+"Sprite"]){const sprite=npcSprite(n);if(sprite){if(q)scene.remove(q);q=sprite;scene.add(q);npcMeshes.set(n,q)}}
      if(!q){q=npcSprite(n)||character("npc");scene.add(q);npcMeshes.set(n,q)}
      if(q.userData.borderPourerSprite)syncBorderPourer(q,n);
      else if(q.userData.merkelSprite)syncMerkel(q,n);
      else if(q.userData.bayernSprite)syncBayern(q,n);
      else if(q.userData.aliceSprite)syncAlice(q,n);
      else if(n.spriteKind&&q.userData[n.spriteKind+"Sprite"])syncAtlasSprite(q,n,1.21);
      else syncChar(q,n);
    });
    for(const [n,q] of npcMeshes)if(!ns.includes(n)){if(q.userData.streetCharacter)streetCharacters?.remove(q);else scene.remove(q);npcMeshes.delete(n)}
    const ps=bridge.getPolice();ps.forEach(p=>{let q=policeMeshes.get(p);if(!q){q=character("police");scene.add(q);policeMeshes.set(p,q)}syncChar(q,p,.04)});for(const [p,q] of policeMeshes)if(!ps.includes(p)){scene.remove(q);policeMeshes.delete(p)}
    const traffic=bridge.getTrafficCars?.()||[];traffic.forEach(car=>{let slot=trafficCarMeshes.get(car);if(!slot){slot=makeTrafficCarSlot(car);trafficCarMeshes.set(car,slot)}const sink=car.vortexSink||0,crush=car.vortexCrush||0,scale=Math.max(.055,1-sink*.93),impact=car.vortexImpact||0;if(impact&&impact!==slot.vortexImpact){slot.vortexImpact=impact;strikeWirtschaftswunder(impact)}slot.group.visible=car.vortexPhase!=="swallowed";slot.group.position.set(X(car.x),(bridge.vehicleElevation?.(car.x,car.y)||0)+.07-sink*.72,Z(car.y));syncVehicleScale(slot,scale,crush);slot.group.rotation.order="YXZ";slot.group.rotation.set(vehicleRoadPitch(car)-sink*1.18,Math.PI/2-car.angle,Math.sin((car.vortexSpin||0)*1.7)*sink*.62);syncVehicleWheels(slot)});for(const [car,slot] of trafficCarMeshes)if(!traffic.includes(car)){removeVehicleSlot(slot);trafficCarMeshes.delete(car)}
    const vehicles=bridge.getPoliceVehicles?.()||[];vehicles.forEach(car=>{let slot=policeVehicleMeshes.get(car);if(!slot){slot=makePoliceCarSlot(car);policeVehicleMeshes.set(car,slot)}slot.group.position.set(X(car.x),(bridge.vehicleElevation?.(car.x,car.y)||0)+.07,Z(car.y));slot.group.rotation.order="YXZ";slot.group.rotation.set(vehicleRoadPitch(car),Math.PI/2-car.angle,0);syncVehicleWheels(slot)});for(const [car,slot] of policeVehicleMeshes)if(!vehicles.includes(car)){removeVehicleSlot(slot);policeVehicleMeshes.delete(car)}
    const helicopters=bridge.getPoliceHelicopters?.()||[];helicopters.forEach(helicopter=>{let slot=policeHelicopterMeshes.get(helicopter);if(!slot){slot=makePoliceHelicopterSlot(helicopter);policeHelicopterMeshes.set(helicopter,slot)}slot.group.position.set(X(helicopter.x),6.8+Math.sin(performance.now()*.003+helicopter.phase)*.18,Z(helicopter.y));slot.group.rotation.y=Math.PI/2-helicopter.angle;slot.rotor.rotation.y=helicopter.rotor;slot.beam.visible=helicopter.spotlight});for(const [helicopter,slot] of policeHelicopterMeshes)if(!helicopters.includes(helicopter)){slot.retired=true;world.remove(slot.group);policeHelicopterMeshes.delete(helicopter)}
    bridge.pickups.forEach(p=>{const q=pickupMeshes.get(p);q.visible=!p.taken;if(q.visible){q.position.set(X(p.x),.2,Z(p.y));q.rotation.y+=.012}});
    for(const slot of normObjectSlots){slot.material.color.setHex(slot.state.fixed?0x3f5b43:0x6c3d37);const target=slot.state.fixed?0:.08;slot.group.rotation.y+=(target-slot.group.rotation.y)*.18}
    for(const slot of trafficLightSlots){slot.red.color.setHex(slot.light.green?0x4b2725:0xdf332c);slot.green.color.setHex(slot.light.green?0x36c469:0x284b31)}
    const fireNow=performance.now(),firePixelScale=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360));updateFire(fireNow,firePixelScale);
    for(const {fallback,particleLayers,glow,embers,emberPositions} of dumpsterFlames){
      fallback.scale.y=.98+Math.sin(fireNow*.009)*.06;glow.intensity=3.2+Math.sin(fireNow*.017)*.65;
      for(const layer of particleLayers){layer.material.uniforms.uTime.value=fireNow*.001;layer.material.uniforms.uPixelScale.value=firePixelScale}
      for(let i=0;i<24;i++){const rise=(fireNow*.00028+i*.618033)%1,j=i*3;emberPositions[j]=Math.sin(i*19.3)*1.25+Math.sin(fireNow*.002+i)*.18;emberPositions[j+1]=1.5+rise*2.6;emberPositions[j+2]=Math.cos(i*8.1)*.54}embers.geometry.attributes.position.needsUpdate=true;
    }
    updatePowerPlants();
    const px=X(bridge.player.x),pz=Z(bridge.player.y),now=performance.now(),memorial=bridge.kiesingerMemorial;
    const plaqueDistance=memorial?Math.hypot(bridge.player.x-memorial.x,bridge.player.y-memorial.y-195):Infinity;
    const frame=memorial&&bridge.player.y>memorial.y+100?Math.max(0,Math.min(1,(370-plaqueDistance)/190))*Math.min(1,kiesingerMonument?.scale.y||1):0;
    const playerElevation=bridge.stationElevation(bridge.player.x,bridge.player.y);
    camera.position.set(px,11.5+playerElevation+3.5*frame,pz+14+2*frame);
    camera.lookAt(px+(memorial?(X(memorial.x)-px)*frame:0),1+playerElevation+3.6*frame,pz-2.7+(memorial?(Z(memorial.y)-(pz-2.7))*frame:0));
    const park=bridge.goerlitzerPark,parkDistance=park?Math.hypot(bridge.player.x-park.plaqueX,bridge.player.y-park.plaqueY):Infinity;
    const parkTarget=park&&bridge.player.y>park.y+park.h-30?Math.max(0,Math.min(1,(440-parkDistance)/250)):0;
    parkCameraFrame+=(parkTarget-parkCameraFrame)*(1-Math.exp(-6*Math.min(.05,Math.max(0,(now-previousCameraTime)/1000))));previousCameraTime=now;
    if(parkCameraFrame>.001){const narrow=Math.max(0,Math.min(1,.95/camera.aspect-1)),cx=X(park.x+park.w/2),cz=Z(park.y+park.h/2),focus=parkCameraFrame*(1-.65*narrow);camera.position.set(px+(cx-px)*focus,11.5+(5+2*narrow)*parkCameraFrame,pz+14+2*narrow*parkCameraFrame);camera.lookAt(px+(cx-px)*focus,1+parkCameraFrame,pz-2.7+(cz-(pz-2.7))*parkCameraFrame)}
    updateGroupVisibility();updateBuildingOcclusion();updateWirtschaftswunder(now);renderer.render(scene,camera);
  },inspectAssets,setAmtQr,get amtOmenSplat(){return {visit:amtOmenVisit,loading:!!amtOmenRequest,skipped:amtOmenSkipped,failure:amtOmenFailure,...(amtOmenSplat?.inspect()||{ready:false,visible:false})}},get amtOffice(){return officeDetail?.inspect()||null},get amtCharacters(){return [...amtCharacters.map(actor=>({name:actor.name,frame:actor.frame,loaded:!!actor.mesh.material.map?.image,mapped:!!actor.mesh.material.map,visible:actor.mesh.visible,detail:actor.mesh.material.map===actor.detail,texelHeight:actor.mesh.material.map?.image?.height||0,breath:actor.mesh.material.userData.breath.value})),...amtMoving.map(actor=>({name:actor.id,frame:actor.cell,loaded:!!actor.mesh.material.map?.image,mapped:!!actor.mesh.material.map,visible:actor.mesh.visible,detail:actor.mesh.material.map===actor.detail||actor.mesh.material.map===actor.walkDetail,texelHeight:actor.mesh.material.map?.image?.height||0,breath:actor.mesh.material.userData.breath.value,tint:actor.mesh.material.color.getHexString(),position:[actor.mesh.position.x,actor.mesh.position.z]}))]}};
  app.classList.add("three-ready");
})().catch(showRendererFailure);
