// A live planar mirror, consumed by the existing office render owner.
// Reflection/projection follows Three.js Reflector (MIT, three.js authors).
export function potatoReflection(view,mirror){
 return{x:view.x,z:2*(mirror.z-.025)-view.z,yaw:Math.PI+view.yaw,phase:(view.walkedDistance||0)*Math.PI*2/1.35};
}
export function potatoMirrorAnchor(view,mirror){
 const limit=mirror.width/2-.38,glassX=Math.max(mirror.x-limit,Math.min(mirror.x+limit,view.x));
 return{x:2*glassX-view.x,z:view.z};
}
export function frameMirrorDouble({THREE:T,frustum,mirror,camera,preferred}){
 const z=mirror.z-.025,left=mirror.x-mirror.width/2+.06,right=mirror.x+mirror.width/2-.06;
 let polygon=[new T.Vector3(left,.08,z),new T.Vector3(right,.08,z),new T.Vector3(right,mirror.height-.08,z),new T.Vector3(left,mirror.height-.08,z)];
 for(const plane of frustum.planes){
  const clipped=[];
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);
   if(da>=0)clipped.push(a);
   if((da>=0)!==(db>=0))clipped.push(a.clone().lerp(b,da/(da-db)));
  }
  polygon=clipped;if(!polygon.length)return null;
 }
 const point=new T.Vector3((camera.position.x+preferred.x)/2,(camera.position.y+1.03)/2,z);
 if(!frustum.containsPoint(point)){
  const center=polygon.reduce((sum,p)=>sum.add(p),new T.Vector3()).multiplyScalar(1/polygon.length);
  let nearest=null,distance=Infinity;
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],edge=b.clone().sub(a),t=Math.max(0,Math.min(1,point.clone().sub(a).dot(edge)/Math.max(1e-12,edge.lengthSq()))),candidate=a.clone().addScaledVector(edge,t);
   const d=candidate.distanceToSquared(point);if(d<distance){distance=d;nearest=candidate;}
  }
  point.copy(nearest).lerp(center,.08);
 }
 return{x:2*point.x-camera.position.x,y:2*point.y-camera.position.y-1.03,z:preferred.z,glassPoint:point.toArray()};
}
export function prepareMirrorCamera({THREE:T,camera,reflected,mirror,pane,textureMatrix}){
 camera.updateMatrixWorld();pane.updateWorldMatrix(true,false);
 const z=mirror.z-.025,eye=camera.position;
 const target=new T.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(eye);target.z=2*z-target.z;
 reflected.position.set(eye.x,eye.y,2*z-eye.z);
 reflected.up.set(0,1,0).applyQuaternion(camera.quaternion);reflected.up.z*=-1;
 reflected.lookAt(target);reflected.fov=camera.fov;reflected.aspect=camera.aspect;
 reflected.near=camera.near;reflected.far=camera.far+2*Math.abs(z-eye.z);
 reflected.updateProjectionMatrix();reflected.updateMatrixWorld();
 textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1)
  .multiply(reflected.projectionMatrix).multiply(reflected.matrixWorldInverse).multiply(pane.matrixWorld);
 // Oblique near clipping excludes the wall/exterior behind the real glass.
 const plane=new T.Plane(new T.Vector3(0,0,-1),z).applyMatrix4(reflected.matrixWorldInverse);
 const clip=new T.Vector4(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant),p=reflected.projectionMatrix.elements;
 const q=new T.Vector4((Math.sign(clip.x)+p[8])/p[0],(Math.sign(clip.y)+p[9])/p[5],-1,(1+p[10])/p[14]);
 clip.multiplyScalar(2/clip.dot(q));p[2]=clip.x;p[6]=clip.y;p[10]=clip.z+1-.0001;p[14]=clip.w;
 reflected.projectionMatrixInverse.copy(reflected.projectionMatrix).invert();
 return reflected;
}
export function createPotatoMirror({THREE:T,scene,mirror,mobile=false}){
 const group=new T.Group();group.name='Kartoffelspiegel';scene.add(group);
 const materials=[],geometries=[];
 const mat=options=>{const m=new T.MeshStandardMaterial(options);materials.push(m);return m};
 const geometry=g=>{geometries.push(g);return g};
 const box=geometry(new T.BoxGeometry(1,1,1)),sphere=geometry(new T.SphereGeometry(1,16,12));
 function mesh(parent,g,m,x,y,z,sx,sy,sz){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o}
 const {x,z,width:w,height:h}=mirror;
 const frame=mat({color:0xc4ccca,metalness:.35,roughness:.24,emissive:0x697371,emissiveIntensity:.3});
 const polish=mat({color:0xe0e6e2,metalness:.18,roughness:.15,emissive:0xa3b5b0,emissiveIntensity:.45});
 for(const side of [-1,1]){
  mesh(group,box,frame,x+side*w/2,h/2,z,.1,h,.24);
  mesh(group,box,polish,x+side*(w/2-.045),h/2,z-.13,.018,h-.12,.018);
 }
 for(const y of [.08,h-.08])mesh(group,box,frame,x,y,z,w,.16,.24);
 for(const y of [.14,h-.14])mesh(group,box,polish,x,y,z-.13,w-.07,.018,.018);
 const back=mat({color:0xabaeaa,roughness:.94});
 mesh(group,geometry(new T.PlaneGeometry(w,h)),back,x,h/2,5.64,1,1,1);
 const textureMatrix=new T.Matrix4(),reflected=new T.PerspectiveCamera();
 const glass=new T.ShaderMaterial({name:'Live silvered mirror',uniforms:{reflection:{value:null},textureMatrix:{value:textureMatrix},glassOpacity:{value:1}},
  vertexShader:'uniform mat4 textureMatrix; varying vec4 reflectedUv; varying vec2 glassUv; void main(){glassUv=uv;reflectedUv=textureMatrix*vec4(position,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform sampler2D reflection;uniform float glassOpacity;varying vec4 reflectedUv;varying vec2 glassUv;void main(){vec3 room=texture2DProj(reflection,reflectedUv).rgb;float d=glassUv.x+glassUv.y*.6;float sheen=(smoothstep(.22,.26,d)-smoothstep(.42,.48,d))*.035;gl_FragColor=vec4(room*.97+vec3(.012,.016,.015)+sheen,glassOpacity);\n#include <colorspace_fragment>\n}',
  depthWrite:true,toneMapped:false});materials.push(glass);
 const pane=mesh(group,geometry(new T.PlaneGeometry(w-.12,h-.16)),glass,x,h/2,z-.025,1,1,1);pane.rotation.y=Math.PI;
 pane.onBeforeRender=()=>{glass.uniforms.glassOpacity.value=glass.opacity};
 const skin=mat({color:0xb59462,roughness:.94,bumpScale:.014,vertexColors:true});
 const rootSkin=mat({color:0x886643,roughness:.98,bumpScale:.008});
 const bodyGeometry=geometry(new T.SphereGeometry(1,64,48)),positions=bodyGeometry.attributes.position,colors=[];
 const eyes=[[-.42,.68,-.6],[.36,.32,-.84],[-.5,-.22,-.74],[.19,-.58,-.77],[.12,.87,-.44],[-.25,.1,.94],[.6,.47,.58],[.14,-.75,.64]].map(p=>new T.Vector3(...p).normalize());
 const n=new T.Vector3();
 for(let i=0;i<positions.count;i++){
  n.fromBufferAttribute(positions,i);const px=n.x,py=n.y,pz=n.z;
  let swell=1+.055*Math.sin(px*4+py*3)*Math.cos(pz*5-py*2)+.024*Math.sin(py*11+pz*6);
  for(const eye of eyes)swell-=.045*Math.exp(-(1-n.dot(eye))/.004);
  positions.setXYZ(i,px*swell,py*swell,pz*swell);
  const v=.93+.07*Math.sin(px*13+py*9)*Math.cos(pz*11);colors.push(v,v,v);
 }
 bodyGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));bodyGeometry.computeVertexNormals();
 const rig=new T.Group();rig.name='Reflected potato rig';scene.add(rig);
 scene.traverse(o=>{if(o.isLight)o.layers.enable(2)});
 mesh(rig,bodyGeometry,skin,0,1.03,0,.52,.78,.4);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.name=side<0?'left shoulder':'right shoulder';arm.position.set(side*.45,.98,0);rig.add(arm);arms.push(arm);
  const a=mesh(arm,sphere,rootSkin,side*.02,-.13,0,.045,.2,.05);a.rotation.z=side*.13;
  mesh(arm,sphere,rootSkin,side*.05,-.29,-.01,.028,.095,.028);
  const leg=new T.Group();leg.name=side<0?'left hip':'right hip';leg.position.set(side*.2,.29,0);rig.add(leg);legs.push(leg);
  mesh(leg,sphere,rootSkin,0,-.12,0,.057,.16,.056);mesh(leg,sphere,rootSkin,side*.015,-.25,-.028,.075,.039,.09);
 }
 rig.traverse(o=>o.layers.set(2));rig.visible=false;
 const frustum=new T.Frustum(),viewMatrix=new T.Matrix4(),size=new T.Vector2();
 let previous=null,capturedView=null,lastPose=null,view=null,target=null,skinTexture=null,disposed=false,frames=0,lastCapture=-Infinity;
 const cap=mobile?640:1024;
 function setSkinTexture(texture){
  if(disposed){texture.dispose();return}
  if(skinTexture&&skinTexture!==texture)skinTexture.dispose();skinTexture=texture;
  texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
  texture.anisotropy=4;skin.color.setHex(0xffffff);skin.map=skin.bumpMap=texture;rootSkin.map=rootSkin.bumpMap=texture;
  skin.needsUpdate=rootSkin.needsUpdate=true;
 }
 function releaseTarget(){if(target){target.dispose();target=null;glass.uniforms.reflection.value=null}lastCapture=-Infinity;capturedView=null}
 function update(next){
  view=next;
  if(!view){rig.visible=false;previous=null;lastPose=null;releaseTarget();return}
  const pose=potatoReflection(view,mirror),anchor=potatoMirrorAnchor(view,mirror);
  // No upper-distance gate. Keep the double in the finite glass off axis.
  rig.visible=view.z<z-.06;
  // Sample gait between visible captures, not between faster display frames
  // that may repeat the same accepted simulation position.
  const before=capturedView||previous;
  const moved=before&&before.generation===view.positionGeneration&&Math.hypot(view.x-before.x,view.z-before.z)>1e-7;
  const stride=moved?Math.sin(pose.phase)*.3:0;
  rig.position.set(anchor.x,0,anchor.z);rig.rotation.y=-view.yaw;
  const forward=moved?(view.x-before.x)*Math.sin(view.yaw)-(view.z-before.z)*Math.cos(view.yaw):0;
  const sideways=moved?(view.x-before.x)*Math.cos(view.yaw)+(view.z-before.z)*Math.sin(view.yaw):0;
  const travel=moved?Math.hypot(forward,sideways):1;
  for(let i=0;i<2;i++){const sign=i?1:-1;legs[i].rotation.x=sign*stride*forward/travel;legs[i].rotation.z=sign*stride*sideways/travel*.6;arms[i].rotation.x=-legs[i].rotation.x*.7;arms[i].rotation.z=sign*(.09+Math.abs(stride)*.08)}
  previous={x:view.x,z:view.z,generation:view.positionGeneration};lastPose={...pose,anchor,moving:!!moved,stride};
 }
 function render(renderer,camera,drawView,now=performance.now()){
  if(disposed||!view||!rig.visible||!group.visible||!group.parent?.visible||glass.opacity<=0||camera.position.z>=z-.06){capturedView=null;return false}
  camera.updateMatrixWorld();pane.updateWorldMatrix(true,false);
  viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(viewMatrix);
  const framed=frameMirrorDouble({THREE:T,frustum,mirror,camera,preferred:lastPose.anchor});
  if(!framed){capturedView=null;return false}
  rig.position.set(framed.x,framed.y,framed.z);lastPose.framing=framed;
  if(target&&now-lastCapture<1000/60-.5)return false;
  renderer.getDrawingBufferSize(size);const scale=Math.min(1,cap/Math.max(size.x,size.y)),width=Math.max(32,Math.round(size.x*scale)),height=Math.max(32,Math.round(size.y*scale));
  if(!target){target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true});target.texture.generateMipmaps=false;glass.uniforms.reflection.value=target.texture}
  else if(target.width!==width||target.height!==height)target.setSize(width,height);
  prepareMirrorCamera({THREE:T,camera,reflected,mirror,pane,textureMatrix});
  const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.autoClear,oldXr=renderer.xr.enabled,oldShadow=renderer.shadowMap.autoUpdate;
  const viewport=renderer.getViewport(new T.Vector4()),scissor=renderer.getScissor(new T.Vector4()),scissorTest=renderer.getScissorTest();
  group.visible=false;
  try{
   renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setScissorTest(false);
   renderer.clear();drawView(reflected);frames++;lastCapture=now;capturedView={x:view.x,z:view.z,generation:view.positionGeneration};
  }finally{
   group.visible=true;renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
   renderer.autoClear=oldAuto;renderer.xr.enabled=oldXr;renderer.shadowMap.autoUpdate=oldShadow;
  }
  return true;
 }
 const resources={geometries:geometries.length,materials:materials.length,geometryBytes:0,meshes:0,triangles:0};
 for(const g of geometries){for(const a of Object.values(g.attributes))resources.geometryBytes+=a.array.byteLength;resources.geometryBytes+=g.index?.array.byteLength||0}
 for(const root of [group,rig])root.traverse(o=>{if(o.isMesh){resources.meshes++;resources.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3}});
 return{update,render,setSkinTexture,inspect(){return{visible:rig.visible,pose:lastPose,joints:legs.map(leg=>[leg.rotation.x,leg.rotation.z]),mirror:{...mirror},glass:{opacity:glass.opacity,depthWrite:glass.depthWrite},reflection:{frames,target:target?[target.width,target.height]:null,cap,maxHz:60,camera:reflected.position.toArray()},resources:{...resources,textures:skinTexture?1:0,textureBytes:skinTexture?(skinTexture.image?.width||0)*(skinTexture.image?.height||0)*4:0}}},
  dispose(){disposed=true;releaseTarget();group.removeFromParent();rig.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();skinTexture?.dispose();skinTexture=null;previous=null;view=null;rig.visible=false}};
}
