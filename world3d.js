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
  const box=(w,h,d,m,x,y,z,p=world)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q};
  const plane=(w,d,m,x,z,y=.002)=>{const q=new T.Mesh(new T.PlaneGeometry(w,d),m),tile=m.userData.tileSize;if(tile){const uv=q.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x-w/2+uv.getX(i)*w)/tile,(z-d/2+(1-uv.getY(i))*d)/tile)}q.rotation.x=-Math.PI/2;q.position.set(x,y,z);world.add(q);return q};
  function staticBoxes(name,material,parts){
    if(!parts.length)return;const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,parts.length),dummy=new T.Object3D();mesh.name=name;
    parts.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.computeBoundingSphere();world.add(mesh);
  }
  const rect=(r,m,y=.005)=>plane(r.w*S,r.h*S,m,X(r.x+r.w/2),Z(r.y+r.h/2),y);
  plane(bridge.WORLD.w*S,bridge.WORLD.h*S,M.ground,0,0,0);
  const sidewalk=bridge.SIDEWALK_WIDTH||28;
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
  const buildingModels={
    hausverwaltung:cityModelUrl("berlin-block"),mietpruefung:cityModelUrl("berlin-block"),
    rathaus:cityModelUrl("berlin-block"),stadtbild:cityModelUrl("berlin-block"),
    post:cityModelUrl("brick-utility"),tuev:cityModelUrl("brick-utility"),
    baumarkt:cityModelUrl("brick-utility"),faxlager:cityModelUrl("brick-utility"),
    reinigung:cityModelUrl("brick-utility"),spaeti:cityModelUrl("neighborhood-shop"),imbiss:cityModelUrl("neighborhood-shop"),
    bundestag:"./assets/models/bundestag/bundestag.glb"
  };
  const powerModels={
    coalBuilding:"./assets/models/power-plants/coal-building.glb",
    coalStack:"./assets/models/power-plants/coal-stack.glb",
    coolingTower:"./assets/models/power-plants/cooling-tower.glb",
    nuclearTransformer:"./assets/models/power-plants/nuclear-transformer.glb",
    nuclearSign:"./assets/models/power-plants/nuclear-warning-sign.glb"
  };
  const buildingSlots=[],trainSlots=[],cityAssetSlots=[],localModels=new Map(),modelLoader=GLTFLoader?new GLTFLoader():null;
  function loadLocalModel(url){
    if(!localModels.has(url))localModels.set(url,modelLoader.loadAsync(url).catch(error=>{console.warn("Keeping procedural stand-ins for "+url,error);return null}));
    return localModels.get(url);
  }
  async function installCityModel(group,fallback,file,fit){
    const slot={file,group,fallback,model:null};cityAssetSlots.push(slot);if(!modelLoader)return;
    try{const gltf=await loadLocalModel(cityModelUrl(file));if(!gltf)return;const model=gltf.scene.clone(true);fitResponseModel(model,fit);model.name=file;group.add(model);slot.model=model;fallback.visible=false}
    catch(error){console.warn("Keeping procedural city asset "+file,error)}
  }
  function registerMaterials(root,slot){
    const copies=new Map();
    root.traverse(o=>{
      if(!o.material)return;
      const copy=m=>{if(copies.has(m))return copies.get(m);const c=m.clone();c.userData.baseOpacity=m.opacity;c.userData.baseTransparent=m.transparent;c.userData.baseDepthWrite=m.depthWrite;copies.set(m,c);slot.materials.add(c);return c};
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
      const gltf=await loadLocalModel(url);if(!gltf)return;const model=gltf.scene.clone(true);
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
      if(!size.x||!size.y||!size.z)throw new Error("empty building bounds");
      const landmark=slot.building.id==="bundestag",s=Math.min(w/size.x,h/size.y,d/size.z),sx=landmark?s:w/size.x,sy=landmark?s:h/size.y,sz=landmark?s:d/size.z;
      model.scale.set(sx,sy,sz);model.position.set(-center.x*sx,-bounds.min.y*sy,-center.z*sz);
      if(landmark){box(w,.07,d,M.walk,0,.035,0,slot.group);slot.label.position.set(-w*.34,.62,d/2+.1);slot.label.scale.set(3.2,.63,1)}
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
    const slot={building:b,group:g,fallback,label:l,model:null,materials:new Set(),opacity:1};buildingSlots.push(slot);registerMaterials(g,slot);
    const url=buildingModels[b.id]||cityModelUrl("municipal-office");installBuildingModel(slot,b.id==="bundestag"?url+"?v=20260926-city1":url,w,h,d);
  }
  bridge.buildings.forEach(building);

  function makeKiesingerMemorial(site){
    if(!site)return;
    const g=new T.Group(),granite=mat(0x77736b,.96),stone=mat(0xb5ada0,.93),shadow=mat(0x4b4a45,.98),bronze=new T.MeshStandardMaterial({color:0x4b5852,metalness:.32,roughness:.68}),face=new T.MeshStandardMaterial({color:0x81745f,metalness:.28,roughness:.7}),hair=mat(0x3d4845,.79),gold=new T.MeshStandardMaterial({color:0xb3965b,metalness:.45,roughness:.59});
    // The entire apron fits inside the reserved 350 × 300 world-unit parcel.
    box(6.9,.16,5.85,shadow,0,.08,0,g);
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
      box(.63,.27,.96,bronze,x,.14,.24,figure);
      const leg=new T.Mesh(new T.CylinderGeometry(.31,.26,1.85,8),bronze);leg.position.set(x,1.17,0);figure.add(leg);
      box(.73,.18,.68,bronze,x,2.08,0,figure);
    }
    box(1.5,.46,.72,bronze,0,2.27,-.02,figure);
    const coat=new T.Shape();coat.moveTo(-.68,0);coat.lineTo(.68,0);coat.lineTo(.82,.3);coat.lineTo(.98,1.72);coat.lineTo(.68,2.13);coat.lineTo(-.68,2.13);coat.lineTo(-.98,1.72);coat.lineTo(-.82,.3);coat.closePath();
    const jacket=new T.Mesh(new T.ExtrudeGeometry(coat,{depth:.7,bevelEnabled:true,bevelThickness:.055,bevelSize:.07,bevelSegments:1}),bronze);jacket.position.set(0,2.27,-.36);figure.add(jacket);
    shape([[-.38,4.4],[.38,4.4],[.23,3.61],[0,3.24],[-.23,3.61]],face,.43);
    shape([[-.55,4.36],[-.14,4.23],[0,3.21],[-.4,3.67]],hair,.47);
    shape([[.55,4.36],[.14,4.23],[0,3.21],[.4,3.67]],hair,.47);
    shape([[-.1,4.12],[.1,4.12],[.07,3.55],[0,3.41],[-.07,3.55]],gold,.49);
    for(const x of [-1.03,1.03]){
      const arm=new T.Mesh(new T.CylinderGeometry(.23,.28,1.85,8),bronze);arm.position.set(x,3.36,-.02);arm.rotation.z=x>0?-.12:.12;figure.add(arm);
      const hand=new T.Mesh(new T.SphereGeometry(.24,9,7),face);hand.scale.set(.78,1.13,.75);hand.position.set(x*1.11,2.42,.01);figure.add(hand);
    }
    for(const y of [2.69,2.98,3.27]){const button=new T.Mesh(new T.SphereGeometry(.045,7,5),gold);button.position.set(0,y,.51);figure.add(button)}
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
    if(modelLoader)modelLoader.loadAsync("./assets/models/kiesinger/kiesinger-statue.glb?v=20260926-photo2").then(({scene:model})=>{
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
      if(![size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0)||Math.abs(size.y-6)>.05||Math.abs(bounds.min.y)>.05)throw new Error("Kiesinger figure must be 6 units tall with shoes at y=0");
      model.name="KiesingerSculpture";model.position.copy(figure.position);g.add(model);figure.visible=false;
    }).catch(error=>console.warn("Keeping procedural Kiesinger figure",error));

    const plaque=document.createElement("canvas");plaque.width=1024;plaque.height=512;const p=plaque.getContext("2d");
    p.fillStyle="#181c1b";p.fillRect(0,0,1024,512);p.strokeStyle="#b3965b";p.lineWidth=22;p.strokeRect(16,16,992,480);p.lineWidth=5;p.strokeRect(37,37,950,438);
    p.fillStyle="#e8dcc1";p.textAlign="center";p.font="bold 65px Georgia, serif";p.fillText("KURT GEORG KIESINGER",512,121,920);
    p.fillStyle="#c5ad7d";p.font="bold 41px Georgia, serif";p.fillText("NSDAP-EINTRITT 1933 · NS-PROPAGANDA",512,211,920);
    p.fillText("CDU · BUNDESKANZLER 1966–1969",512,277,920);
    p.fillStyle="#e8dcc1";p.font="bold 33px Arial, sans-serif";p.fillText("VERGANGENHEITSBEWÄLTIGUNG",512,376,920);
    p.font="28px Arial, sans-serif";p.fillText("E · GESCHICHTE LESEN UND HÖREN",512,430,920);
    const texture=new T.CanvasTexture(plaque);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    box(3.22,1.55,.08,shadow,0,2.33,1.34,g);
    const plate=new T.Mesh(new T.PlaneGeometry(3.1,1.43),new T.MeshBasicMaterial({map:texture}));plate.position.set(0,2.33,1.395);g.add(plate);
    g.position.set(X(site.x),0,Z(site.y));world.add(g);
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
      const step=(ch-38)/lines.length;lines.forEach((text,i)=>{ctx.font=`${i===0?900:700} ${Math.min(i===0?53:43,step*.61)}px Arial, sans-serif`;ctx.fillText(text,512,26+step*(i+.65),950)});
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
    sign(["GÖRLITZER PARK · MINIATUR","SATIRISCH ÜBERHÖHTE SICHERHEITSZONE"],7.2,.95,0,4.37,front+.04);
    for(const x of [-4.3,4.3])sign(["ZUTRITT VERBOTEN","PARK BENUTZEN: UNTERSAGT"],2.7,.81,x,1.93,front+.1,"#d0b85d");
    const plaqueX=(site.plaqueX-site.x-site.w/2)*S,plaqueZ=(site.plaqueY-site.y-site.h/2)*S;
    for(const x of [plaqueX-2,plaqueX+2])block(steel,x,1.18,plaqueZ-.15,.1,2.36,.1);
    sign(["GÖRLITZER PARK · KOSTENTAFEL",...(site.signLines||[]),"E · DETAILS UND QUELLEN"],4.8,2.42,plaqueX,2.35,plaqueZ);
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
  const billboardLoader=new T.TextureLoader(),desktopBillboards=matchMedia("(min-width: 700px)");
  function faxFallbackTexture(){const c=document.createElement("canvas");c.width=768;c.height=250;const x=c.getContext("2d");x.fillStyle="#ded9cc";x.fillRect(0,0,768,250);x.strokeStyle="#222";x.lineWidth=12;x.strokeRect(6,6,756,238);x.fillStyle="#222";x.textAlign="center";x.font="900 50px Arial";x.fillText("FAX 3000 PRO",384,70);x.font="900 32px Arial";x.fillText("2,75× SCHNELLER",384,124);x.font="700 18px Arial";x.fillText("DIE ZUKUNFT DER DIGITALISIERUNG IST PAPIER",384,195);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx}
  function propLabel(g,text,y=1.25,w=1.7){if(!text)return;const l=label(text,"");l.scale.set(w,.32,1);l.position.set(0,y,.08);g.add(l)}
  const propModels={gartenzwerg:["garden-gnome",.65,1.25,.65],pfandautomat:["pfand-machine",1.05,1.65,.74],kaffee:["coffee-machine",.95,1.5,.72],faxkiosk:["fax-kiosk",1.08,1.75,.75],faxgeraet:["fax-kiosk",1.08,1.5,.75],bench:["bench",1.7,1,.75],litterbin:["litter-bin",.52,.9,.52],bollard:["bollard",.22,.86,.22],bicyclerack:["bicycle-rack",1.7,.8,.65]};
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
      const h=Math.max(.8,(p.h||54)*S),w=Math.max(.52,(p.w||48)*S);box(w,h,Math.max(.42,w*.55),p.asset.includes("fax")?mat(0xb7b2a7):mat(0x666760),0,h/2,0,g);if(!["bench","litterbin","bollard","bicyclerack"].includes(p.asset))propLabel(g,p.label||p.asset.toUpperCase(),h*.62,Math.max(.9,w*.92));
    }
    const asset=propModels[p.asset];if(asset){const fallback=new T.Group();for(const child of [...g.children])if(!child.isSprite)fallback.add(child);g.add(fallback);installCityModel(g,fallback,asset[0],{x:asset[1],y:asset[2],z:asset[3]});for(const child of g.children)if(child.isSprite)child.position.y=asset[2]+.22}
    g.position.set(X(p.x),0,Z(p.y));world.add(g);
  }
  bridge.props.forEach(prop);
  function normObject(o){const g=new T.Group(),material=mat(0x6c3d37);if(o.type==="hedge")box(1.35,.72,.55,material,0,.36,0,g);else if(o.type==="chairs"){for(const x of [-.32,.32]){box(.48,.08,.48,material,x,.48,0,g);box(.48,.68,.08,material,x,.78,-.2,g);box(.06,.48,.06,material,x-.16,.24,0,g);box(.06,.48,.06,material,x+.16,.24,0,g)}}else{box(.58,.8,.58,material,0,.4,0,g);box(.66,.09,.66,M.dark,0,.85,0,g)}propLabel(g,o.label,1.18,1.65);g.position.set(X(o.x),0,Z(o.y));g.rotation.y=.08;world.add(g);return{state:o,group:g,material}}
  const normObjectSlots=(bridge.normObjects||[]).map(normObject);
  function character(kind){const g=new T.Group(),m=kind==="player"?M.player:kind==="police"?M.police:kind==="merkel"?M.merkel:M.npc;box(.42,.72,.3,m,0,.72,0,g);const head=new T.Mesh(new T.SphereGeometry(.2,10,7),M.skin);head.position.y=1.3;g.add(head);const lg=new T.CylinderGeometry(.06,.07,.5,8),ag=new T.CylinderGeometry(.05,.06,.48,8),ll=new T.Mesh(lg,m),rl=ll.clone(),la=new T.Mesh(ag,m),ra=la.clone();ll.position.set(-.1,.27,0);rl.position.set(.1,.27,0);la.position.set(-.27,.76,0);ra.position.set(.27,.76,0);g.add(ll,rl,la,ra);g.userData={ll,rl,la,ra};if(kind==="merkel"){const hair=new T.Mesh(new T.SphereGeometry(.22,10,7,0,Math.PI*2,0,Math.PI*.58),mat(0x5d5953));hair.position.y=1.39;g.add(hair)}if(kind==="police"){const cap=new T.Mesh(new T.CylinderGeometry(.21,.21,.08,10),M.dark);cap.position.y=1.52;g.add(cap)}return g}
  function syncChar(q,o,l=0){
    const previousX=q.userData.worldX??o.x,previousY=q.userData.worldY??o.y,travel=Math.hypot(o.x-previousX,o.y-previousY);q.userData.worldX=o.x;q.userData.worldY=o.y;q.userData.walkPhase=(q.userData.walkPhase||0)+travel*.13;q.position.set(X(o.x),l,Z(o.y));
    const target=travel>.01?Math.sin(q.userData.walkPhase)*.38:0,s=q.userData.walkSwing=(q.userData.walkSwing||0)+(target-(q.userData.walkSwing||0))*(travel>.01?1:.28);q.userData.ll.rotation.x=s;q.userData.rl.rotation.x=-s;q.userData.la.rotation.x=-s*.7;q.userData.ra.rotation.x=s*.7
  }
  const atlasTextureCache=new Map(),atlasMaterialCache=new Map();
  function atlasSprite(kind,scale){
    const source=bridge.getNpcSpriteCanvas?.(kind),grid=bridge.npcSpriteGrids?.[kind];if(!source||!grid)return null;
    let tx=atlasTextureCache.get(kind);if(!tx){tx=new T.CanvasTexture(source);tx.colorSpace=T.SRGBColorSpace;tx.generateMipmaps=false;tx.minFilter=tx.magFilter=T.LinearFilter;tx.premultiplyAlpha=true;atlasTextureCache.set(kind,tx)}
    let material=atlasMaterialCache.get(kind);if(!material){material=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.02,depthWrite:false,premultipliedAlpha:true,side:T.DoubleSide});atlasMaterialCache.set(kind,material)}
    const geometry=new T.PlaneGeometry(scale,scale),uv=geometry.attributes.uv,q=new T.Mesh(geometry,material);q.userData={[kind+"Sprite"]:true,grid,baseUv:Float32Array.from(uv.array),spriteFrame:-1,spriteRow:-1,spriteFlip:null};return q
  }
  function specialSprite(n){return n.special==="borderPourer"?atlasSprite("borderPourer",2.62):n.special==="merkel"?atlasSprite("merkel",2.42):n.special==="bayern"?atlasSprite("bayern",2.91):n.special==="alice"?atlasSprite("alice",2.42):null}
  function npcSprite(n){return specialSprite(n)||(n.spriteKind?atlasSprite(n.spriteKind,n.spriteScale||2.42):null)}
  function syncAtlasSprite(q,o,height){
    const grid=q.userData.grid,frame=o.spriteFrame||0,row=o.spriteRow||0,flip=!!o.spriteFlip;
    if(frame!==q.userData.spriteFrame||row!==q.userData.spriteRow||flip!==q.userData.spriteFlip){const uv=q.geometry.attributes.uv,base=q.userData.baseUv,u0=frame/grid.cols,v0=1-(row+1)/grid.rows;for(let i=0;i<uv.count;i++){const bx=base[i*2],by=base[i*2+1];uv.setXY(i,u0+(flip?1-bx:bx)/grid.cols,v0+by/grid.rows)}uv.needsUpdate=true;q.userData.spriteFrame=frame;q.userData.spriteRow=row;q.userData.spriteFlip=flip}
    q.position.set(X(o.x),height,Z(o.y));q.quaternion.copy(camera.quaternion)
  }
  function syncMerkel(q,o){syncAtlasSprite(q,o,1.21)}
  function syncBayern(q,o){syncAtlasSprite(q,o,1.455)}
  function syncAlice(q,o){syncAtlasSprite(q,o,1.21)}
  function syncBorderPourer(q,o){syncAtlasSprite(q,o,1.31)}
  function pickup(item){const type=item.type,g=new T.Group();if(type==="pfand"){const m=new T.Mesh(new T.CylinderGeometry(.07,.09,.5,9),mat(0x566153)),fallback=new T.Group();m.position.y=.25;fallback.add(m);g.add(fallback);installCityModel(g,fallback,"pfand-bottle",{x:.18,y:.55,z:.18})}else if(item.wurstType){const m=mat(item.color),pieces=item.pieces||1;for(let i=0;i<pieces;i++){const q=new T.Mesh(new T.CapsuleGeometry(.065,.32,4,8),m);q.rotation.z=Math.PI/2;q.position.set(pieces===4?(i-1.5)*.18:0,.2+(i-(pieces-1)/2)*.13,0);g.add(q)}const seal=new T.Mesh(new T.TorusGeometry(.15,.035,8,18),mat(0xe4ddce));seal.rotation.x=Math.PI/2;seal.position.y=.6;g.add(seal)}else{const col=type==="currywurst"?0x805143:type==="bratwurst"?0x9a7653:0x8a694b,m=mat(col),q=new T.Mesh(type==="brezel"?new T.TorusGeometry(.18,.055,8,18):new T.CapsuleGeometry(.08,.4,4,8),m);q.rotation.z=type==="brezel"?0:Math.PI/2;q.position.y=.2;g.add(q)}return g}

  const playerMesh=character("player");scene.add(playerMesh);
  const npcMeshes=new Map(),policeMeshes=new Map(),trafficCarMeshes=new Map(),policeVehicleMeshes=new Map(),policeHelicopterMeshes=new Map(),pickupMeshes=new Map();
  bridge.getNPCs().forEach(n=>{const q=npcSprite(n)||character("npc");scene.add(q);npcMeshes.set(n,q)});
  bridge.pickups.forEach(p=>{const q=pickup(p);scene.add(q);pickupMeshes.set(p,q)});
  function updateBuildingOcclusion(){
    const cameraReach=15/S,px=bridge.player.x,py=bridge.player.y;
    for(const slot of buildingSlots){
      const b=slot.building,between=b.y<py+cameraReach&&b.y+b.h>py,underSightline=px>b.x-35&&px<b.x+b.w+35,target=between&&underSightline?.24:1;
      slot.opacity+=(target-slot.opacity)*.16;
      const faded=slot.opacity<.985;
      for(const m of slot.materials){
        const transparent=faded||m.userData.baseTransparent;
        if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true}
        m.opacity=slot.opacity*m.userData.baseOpacity;m.depthWrite=!faded&&m.userData.baseDepthWrite;
      }
    }
  }
  function updatePowerPlants(){const now=performance.now()*.00016;for(const p of coalSmoke){const t=(now+p.index/coalSmoke.length)%1;p.mesh.position.set(p.x+Math.sin(now*25+p.index)*.52*t,p.y+t*4.5,p.z+Math.cos(now*19+p.index)*.4*t);p.mesh.scale.setScalar(.9+t*1.8);p.mesh.material.opacity=.88*(1-t)}for(const p of coalBelt){const t=(now*4+p.index/coalBelt.length)%1;p.mesh.position.lerpVectors(p.from,p.to,t);p.mesh.rotation.x+=.05;p.mesh.rotation.z+=.04}}
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}resize();addEventListener("resize",resize,{passive:true});
  const spawnProbe=new T.Vector3();
  function isWorldPointVisible(x,y,padding=0,kind="officer"){const height=kind==="helicopter"?6.8:kind==="car"?.7:1;spawnProbe.set(X(x),height,Z(y)).project(camera);const padX=padding/Math.max(1,innerWidth)*2,padY=padding/Math.max(1,innerHeight)*2;return spawnProbe.z>=-1&&spawnProbe.z<=1&&spawnProbe.x>=-1-padX&&spawnProbe.x<=1+padX&&spawnProbe.y>=-1-padY&&spawnProbe.y<=1+padY}
  function inspectAssets(){
    const bounds=model=>{if(!model)return null;const b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3());return{width:s.x,height:s.y,depth:s.z,ground:b.min.y}};
    return{buildings:buildingSlots.filter(s=>!s.building.kind).map(s=>({id:s.building.id,loaded:!!s.model,fallback:s.fallback.visible,bounds:bounds(s.model),glass:[...s.materials].filter(m=>/glass/i.test(m.name)).map(m=>({name:m.name,opacity:m.opacity,baseOpacity:m.userData.baseOpacity}))})),city:cityAssetSlots.map(s=>({file:s.file,loaded:!!s.model,fallback:s.fallback.visible,bounds:bounds(s.model)})),sources:[...localModels.keys()],render:{...renderer.info.render},memory:{...renderer.info.memory}};
  }
  window.Germany3D={ready:true,isWorldPointVisible,sync(){
    syncChar(playerMesh,bridge.player,0);
    playerMesh.rotation.y=bridge.player.facing;
    for(const slot of trainSlots){for(let i=0;i<slot.cars.length;i++){const car=slot.train.cars[i],group=slot.cars[i].group,jolt=Math.sin(performance.now()*.04+i)*slot.train.bump*.1;group.position.set(X(car.x),.07+jolt,Z(car.y));group.rotation.y=Math.PI/2-car.angle}for(let i=0;i<slot.gangways.length;i++){const a=slot.train.cars[i],b=slot.train.cars[i+1],ax=X(a.x),az=Z(a.y),bx=X(b.x),bz=Z(b.y),mesh=slot.gangways[i],length=Math.hypot(bx-ax,bz-az);mesh.position.set((ax+bx)/2,.54,(az+bz)/2);mesh.rotation.y=Math.atan2(bx-ax,bz-az);mesh.scale.z=Math.max(.18,length-4.64)}}
    const ns=bridge.getNPCs();ns.forEach(n=>{let q=npcMeshes.get(n),kind=n.special||n.spriteKind;if(kind&&!q?.userData[kind+"Sprite"]){const sprite=npcSprite(n);if(sprite){if(q)scene.remove(q);q=sprite;scene.add(q);npcMeshes.set(n,q)}}if(!q){q=npcSprite(n)||character("npc");scene.add(q);npcMeshes.set(n,q)}if(q.userData.borderPourerSprite)syncBorderPourer(q,n);else if(q.userData.merkelSprite)syncMerkel(q,n);else if(q.userData.bayernSprite)syncBayern(q,n);else if(q.userData.aliceSprite)syncAlice(q,n);else if(n.spriteKind&&q.userData[n.spriteKind+"Sprite"])syncAtlasSprite(q,n,1.21);else syncChar(q,n)});for(const [n,q] of npcMeshes)if(!ns.includes(n)){scene.remove(q);npcMeshes.delete(n)}
    const ps=bridge.getPolice();ps.forEach(p=>{let q=policeMeshes.get(p);if(!q){q=character("police");scene.add(q);policeMeshes.set(p,q)}syncChar(q,p,.04)});for(const [p,q] of policeMeshes)if(!ps.includes(p)){scene.remove(q);policeMeshes.delete(p)}
    const traffic=bridge.getTrafficCars?.()||[];traffic.forEach(car=>{let slot=trafficCarMeshes.get(car);if(!slot){slot=makeTrafficCarSlot(car);trafficCarMeshes.set(car,slot)}const sink=car.vortexSink||0,crush=car.vortexCrush||0,scale=Math.max(.055,1-sink*.93),impact=car.vortexImpact||0;if(impact&&impact!==slot.vortexImpact){slot.vortexImpact=impact;strikeWirtschaftswunder(impact)}slot.group.visible=car.vortexPhase!=="swallowed";slot.group.position.set(X(car.x),.07-sink*.72,Z(car.y));slot.group.scale.set(scale*(1+crush*.82),scale*(1-crush*.68),scale*(1-crush*.3));slot.group.rotation.order="YXZ";slot.group.rotation.set(-sink*1.18,Math.PI/2-car.angle,Math.sin((car.vortexSpin||0)*1.7)*sink*.62);slot.tail.color.setHex(car.queued?0xff3026:0x762720)});for(const [car,slot] of trafficCarMeshes)if(!traffic.includes(car)){world.remove(slot.group);trafficCarMeshes.delete(car)}
    const vehicles=bridge.getPoliceVehicles?.()||[];vehicles.forEach(car=>{let slot=policeVehicleMeshes.get(car);if(!slot){slot=makePoliceCarSlot(car);policeVehicleMeshes.set(car,slot)}slot.group.position.set(X(car.x),.07,Z(car.y));slot.group.rotation.y=Math.PI/2-car.angle;const flash=Math.floor(performance.now()/125)%2;slot.lightA.material.color.setHex(flash?0x2f7cff:0x123f99);slot.lightB.material.color.setHex(flash?0x123f99:0x2f7cff)});for(const [car,slot] of policeVehicleMeshes)if(!vehicles.includes(car)){world.remove(slot.group);policeVehicleMeshes.delete(car)}
    const helicopters=bridge.getPoliceHelicopters?.()||[];helicopters.forEach(helicopter=>{let slot=policeHelicopterMeshes.get(helicopter);if(!slot){slot=makePoliceHelicopterSlot(helicopter);policeHelicopterMeshes.set(helicopter,slot)}slot.group.position.set(X(helicopter.x),6.8+Math.sin(performance.now()*.003+helicopter.phase)*.18,Z(helicopter.y));slot.group.rotation.y=Math.PI/2-helicopter.angle;slot.rotor.rotation.y=helicopter.rotor;slot.beam.visible=helicopter.spotlight});for(const [helicopter,slot] of policeHelicopterMeshes)if(!helicopters.includes(helicopter)){world.remove(slot.group);policeHelicopterMeshes.delete(helicopter)}
    bridge.pickups.forEach(p=>{const q=pickupMeshes.get(p);q.visible=!p.taken;if(q.visible){q.position.set(X(p.x),.2,Z(p.y));q.rotation.y+=.012}});
    for(const slot of normObjectSlots){slot.material.color.setHex(slot.state.fixed?0x3f5b43:0x6c3d37);const target=slot.state.fixed?0:.08;slot.group.rotation.y+=(target-slot.group.rotation.y)*.18}
    for(const slot of trafficLightSlots){slot.red.color.setHex(slot.light.green?0x4b2725:0xdf332c);slot.green.color.setHex(slot.light.green?0x36c469:0x284b31)}
    updateFire(performance.now());updateBuildingOcclusion();updatePowerPlants();
    const px=X(bridge.player.x),pz=Z(bridge.player.y),now=performance.now(),memorial=bridge.kiesingerMemorial;
    const plaqueDistance=memorial?Math.hypot(bridge.player.x-memorial.x,bridge.player.y-memorial.y-195):Infinity;
    const frame=memorial&&bridge.player.y>memorial.y+100?Math.max(0,Math.min(1,(370-plaqueDistance)/190)):0;
    camera.position.set(px,11.5+3.5*frame,pz+14+2*frame);
    camera.lookAt(px+(memorial?(X(memorial.x)-px)*frame:0),1+3.6*frame,pz-2.7+(memorial?(Z(memorial.y)-(pz-2.7))*frame:0));
    const park=bridge.goerlitzerPark,parkDistance=park?Math.hypot(bridge.player.x-park.plaqueX,bridge.player.y-park.plaqueY):Infinity;
    const parkFrame=park&&bridge.player.y>park.y+park.h-30?Math.max(0,Math.min(1,(440-parkDistance)/250)):0;
    if(parkFrame){const narrow=Math.max(0,.95/camera.aspect-1),cx=X(park.x+park.w/2),cz=Z(park.y+park.h/2);camera.position.set(px+(cx-px)*parkFrame,11.5+(4+16*narrow)*parkFrame,pz+14+16*narrow*parkFrame);camera.lookAt(px+(cx-px)*parkFrame,1+parkFrame,pz-2.7+(cz-(pz-2.7))*parkFrame)}
    updateWirtschaftswunder(now);renderer.render(scene,camera);
  },inspectAssets};
  app.classList.add("three-ready");
})().catch(showRendererFailure);
