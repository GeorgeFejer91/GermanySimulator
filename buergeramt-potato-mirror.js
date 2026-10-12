// A wall mirror with a surrogate room and actor in the office's existing pass.
// No reflection camera, framebuffer, downloaded model or independent clock.
export function potatoReflection(view,mirror){
 return{x:view.x,z:2*mirror.z-view.z,yaw:Math.PI+view.yaw,phase:(view.walkedDistance||0)*Math.PI*2/1.35};
}

export function createPotatoMirror({THREE:T,scene,mirror}){
 const group=new T.Group();group.name="Kartoffelspiegel";scene.add(group);
 const materials=[],geometries=[];
 const mat=options=>{const material=new T.MeshStandardMaterial(options);materials.push(material);return material};
 const geometry=value=>{geometries.push(value);return value};
 const frame=mat({color:0xc4ccca,metalness:.35,roughness:.24,emissive:0x697371,emissiveIntensity:.3});
 const back=mat({color:0xabaeaa,roughness:.94,emissive:0x656962,emissiveIntensity:.22});
 const glass=mat({color:0xc5d6d4,transparent:true,opacity:.12,roughness:.12,metalness:.2,depthWrite:false});
 glass.onBeforeCompile=shader=>{
  shader.vertexShader="varying vec2 mirrorUv;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nmirrorUv=uv;");
  shader.fragmentShader="varying vec2 mirrorUv;\n"+shader.fragmentShader.replace("#include <opaque_fragment>","float mirrorEdge=pow(1.0-abs(dot(normal,normalize(vViewPosition))),3.0);float mirrorDiagonal=mirrorUv.x+mirrorUv.y*.6;float mirrorBand=(smoothstep(.22,.26,mirrorDiagonal)-smoothstep(.42,.48,mirrorDiagonal))+(smoothstep(.57,.59,mirrorDiagonal)-smoothstep(.65,.69,mirrorDiagonal));diffuseColor.a=min(.7,diffuseColor.a*(1.0+mirrorBand*1.8+mirrorEdge*3.0));outgoingLight=mix(outgoingLight,vec3(.78,.85,.84),mirrorBand*.65);\n#include <opaque_fragment>");
 };
 glass.customProgramCacheKey=()=>"potato-mirror-glass";
 const skin=mat({color:0xd0a15e,roughness:.96,vertexColors:true}),limb=mat({color:0x987043,roughness:.94});
 const white=mat({color:0xf3efda,roughness:.6}),dark=mat({color:0x32221b,roughness:.9});
 const boxGeometry=geometry(new T.BoxGeometry(1,1,1)),sphere=geometry(new T.SphereGeometry(1,12,10));
 function mesh(parent,g,m,x,y,z,sx,sy,sz){const object=new T.Mesh(g,m);object.position.set(x,y,z);object.scale.set(sx,sy,sz);parent.add(object);return object}
 const {x,z,width:w,height:h,depth:d}=mirror;
 // A shallow silver bezel, rather than a deep display-case border.
 for(const side of [-1,1])mesh(group,boxGeometry,frame,x+side*w/2,h/2,z,.1,h,.24);
 for(const y of [.08,h-.08])mesh(group,boxGeometry,frame,x,y,z,w,.16,.24);
 const polish=mat({color:0xe0e6e2,metalness:.18,roughness:.15,emissive:0xa3b5b0,emissiveIntensity:.45});
 for(const side of [-1,1])mesh(group,boxGeometry,polish,x+side*(w/2-.045),h/2,z-.13,.018,h-.12,.018);
 for(const y of [.14,h-.14])mesh(group,boxGeometry,polish,x,y,z-.13,w-.07,.018,.018);
 // Muted, reflected hall geometry behind the glass makes it read as a mirror.
 // The real wall masks this virtual room at every angle; it has no simulation.
 const reflection=new T.Group();reflection.name="Surrogate mirror room";group.add(reflection);
 mesh(reflection,boxGeometry,back,0,2,z+19.2,15.4,4,.1);
 for(const side of [-1,1])mesh(reflection,boxGeometry,back,side*7.7,2,z+9.6,.1,4,19.2);
 const reflectedFloor=mat({color:0x92958e,roughness:.92,emissive:0x555b52,emissiveIntensity:.2});
 mesh(reflection,boxGeometry,reflectedFloor,0,-.03,z+9.6,15.4,.05,19.2);
 mesh(reflection,boxGeometry,back,0,4,z+9.6,15.4,.05,19.2);
 const fluorescent=mat({color:0xe0e7dc,emissive:0xe0e7dc,emissiveIntensity:.8,roughness:.5});
 for(const lampZ of [-7.4,-3.8,0,3.8])mesh(reflection,boxGeometry,fluorescent,0,3.97,2*z-lampZ,2.8,.025,.54);
 // Reflected waiting benches retain the hall's spacing and muted green seats.
 const reflectedSeat=mat({color:0x64736c,roughness:.9,emissive:0x313c36,emissiveIntensity:.2});
 for(const benchX of [-5.9,-2.1,1.7,5.5])for(const benchZ of [1.7,-1.1]){
  mesh(reflection,boxGeometry,reflectedSeat,benchX,.52,2*z-benchZ,.74,.07,.68);
  mesh(reflection,boxGeometry,reflectedSeat,benchX,.92,2*z-benchZ+.31,.7,.76,.07);
  for(const leg of [-.28,.28])mesh(reflection,boxGeometry,frame,benchX+leg,.25,2*z-benchZ,.045,.45,.045);
 }
 // The back of the installation remains an ordinary solid wall from outside.
 const rear=mesh(group,geometry(new T.PlaneGeometry(w,h)),back,x,h/2,5.64,1,1,1);
 const pane=mesh(group,geometry(new T.PlaneGeometry(w-.12,h-.16)),glass,x,h/2,z-.025,1,1,1);
 pane.rotation.y=Math.PI;pane.renderOrder=1;
 // Broad soft highlights lie on the surface, not inside the reflected room.
 const sheen=mat({color:0xd7e5dd,transparent:true,opacity:.09,depthWrite:false});
 for(const [offset,width] of [[-.94,.045],[.94,.075]]){
  const stripe=mesh(group,boxGeometry,sheen,x+offset,h/2,z-.035,width,h-.35,.004);stripe.rotation.z=-.17;stripe.renderOrder=2;
 }
 const rig=new T.Group();rig.name="Reflected potato rig";reflection.add(rig);
 const bodyGeometry=geometry(new T.SphereGeometry(1,24,18)),positions=bodyGeometry.attributes.position,colors=[];
 for(let i=0;i<positions.count;i++){
  const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);
  const swell=1+.055*Math.sin(px*9+py*5)*Math.cos(pz*7-py*3)+.035*Math.sin(py*13+pz*6);
  positions.setXYZ(i,px*swell,py*swell,pz*swell);
  const tone=.8+.16*(.5+.5*Math.sin(px*33+py*41)*Math.cos(pz*29+py*17));colors.push(tone,tone,tone);
 }
 bodyGeometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));bodyGeometry.computeVertexNormals();
 mesh(rig,bodyGeometry,skin,0,1.06,0,.52,.72,.36);
 // Potato eyes (the tuber's dimples), plus the player's puzzled face.
 for(const [px,py,pz] of [[-.31,1.55,-.16],[.37,1.02,-.24],[-.38,.82,-.2],[.18,.52,-.22],[.1,1.64,-.13],[-.18,1.05,.33],[.3,1.37,.25]]){
  mesh(rig,sphere,limb,px,py,pz,.037,.025,.012);
 }
 for(const side of [-1,1]){
  mesh(rig,sphere,white,side*.18,1.3,-.334,.112,.132,.048);
  mesh(rig,sphere,dark,side*.18,1.29,-.376,.044,.06,.022);
  mesh(rig,sphere,dark,side*.18,1.49,-.3,.117,.025,.026).rotation.z=side*.22;
 }
 mesh(rig,sphere,limb,0,1.11,-.363,.058,.075,.049);
 mesh(rig,sphere,dark,0,.93,-.345,.09,.052,.022);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.name=side<0?"left shoulder":"right shoulder";arm.position.set(side*.46,1.15,0);arm.rotation.z=side*.2;rig.add(arm);arms.push(arm);
  mesh(arm,sphere,limb,0,-.16,0,.063,.21,.064);mesh(arm,sphere,limb,0,-.36,-.015,.087,.105,.077);
  const leg=new T.Group();leg.name=side<0?"left hip":"right hip";leg.position.set(side*.2,.39,0);rig.add(leg);legs.push(leg);
  mesh(leg,sphere,limb,0,-.15,0,.078,.2,.078);mesh(leg,sphere,limb,0,-.31,-.065,.115,.08,.17);
 }
 // Clip only the surrogate to rays through the glass aperture. Near, rotated
 // tuber surfaces can lie ahead of the real wall and otherwise poke through it.
 const aperture=[new T.Vector3(x-w/2+.06,.08,z-.025),new T.Vector3(x+w/2-.06,.08,z-.025),new T.Vector3(x+w/2-.06,h-.08,z-.025),new T.Vector3(x-w/2+.06,h-.08,z-.025)];
 const eye=new T.Vector3(),inside=new T.Vector3(x,h/2,z+.5),clipPlanes=Array.from({length:4},()=>new T.Plane());
 clipPlanes.push(new T.Plane(new T.Vector3(0,0,1),-(z-.025)));
 for(const material of [skin,limb,white,dark])material.clippingPlanes=clipPlanes;
 let previous=null,lastPose=null;
 function update(view){
  if(!view){rig.visible=false;reflection.visible=false;previous=null;lastPose=null;return}
  const pose=potatoReflection(view,mirror),distance=z-view.z;
  reflection.visible=distance>0;
  rig.visible=distance>.3&&distance<d-.45;
  if(rig.visible){
   eye.set(view.x,1.68,view.z);
   for(let i=0;i<4;i++){const plane=clipPlanes[i];plane.setFromCoplanarPoints(eye,aperture[i],aperture[(i+1)%4]);if(plane.distanceToPoint(inside)<0)plane.negate();}
  }
  const moved=previous&&previous.generation===view.positionGeneration&&Math.hypot(view.x-previous.x,view.z-previous.z)>1e-7;
  const stride=moved?Math.sin(pose.phase)*.43:0;
  rig.position.set(pose.x,0,pose.z);rig.rotation.y=pose.yaw;
  // Forward/back/strafe reflect actual displacement into the potato's joints.
  const forward=moved?(view.x-previous.x)*Math.sin(view.yaw)-(view.z-previous.z)*Math.cos(view.yaw):0;
  const sideways=moved?(view.x-previous.x)*Math.cos(view.yaw)+(view.z-previous.z)*Math.sin(view.yaw):0;
  const travel=moved?Math.hypot(forward,sideways):1;
  for(let i=0;i<2;i++){
   const sign=i?1:-1;legs[i].rotation.x=sign*stride*forward/travel;legs[i].rotation.z=sign*stride*sideways/travel*.6;
   arms[i].rotation.x=-legs[i].rotation.x*.7;arms[i].rotation.z=sign*(.2+Math.abs(stride)*.12);
  }
  previous={x:view.x,z:view.z,generation:view.positionGeneration};lastPose={...pose,moving:!!moved,stride};
 }
 update(null);
 const resources={geometries:geometries.length,materials:materials.length,textures:0,geometryBytes:0,meshes:0,triangles:0};
 for(const g of geometries){for(const a of Object.values(g.attributes))resources.geometryBytes+=a.array.byteLength;resources.geometryBytes+=g.index?.array.byteLength||0;}
 group.traverse(object=>{if(object.isMesh){resources.meshes++;resources.triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;}});
 return{update,inspect(){return{visible:rig.visible,pose:lastPose,joints:legs.map(leg=>[leg.rotation.x,leg.rotation.z]),mirror:{...mirror},glass:{opacity:glass.opacity,depthWrite:glass.depthWrite},resources}},dispose(){scene.remove(group);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();previous=null}};
}
