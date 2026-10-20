/* A visible copy of the current street paint; simulation and speech stay owned. */
export function createStreetPortraitDisplay({THREE:T,renderer,frame,image}){
 const scene=new T.Scene(),camera=new T.OrthographicCamera();let quad=null;
 const viewport=new T.Vector4(),scissor=new T.Vector4(),color=new T.Color(),center=new T.Vector3(),size=new T.Vector3();
 let actor=null,source=null,target=null,canvas=null,context=null,pixels=null,displayPixels=null,last=-Infinity,failed=null,frames=0;
 const opacity=image?.style.opacity??'';
 // SRGB8_ALPHA8 encodes associated linear light; decode only translucent pixels.
 const linear=Float64Array.from({length:256},(_,byte)=>{const c=byte/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4});
 function retire(){
  target?.dispose();target=null;canvas?.remove();canvas=null;context=null;pixels=null;displayPixels=null;
  // Geometry, material, texture and mouth uniforms belong to the street view.
  if(quad)scene.remove(quad);quad=null;actor=null;source=null;last=-Infinity;
  if(image)image.style.opacity=opacity;
 }
 function clear(){retire();failed=null}
 function update(mesh,owner,now){
  if(!frame||!image||!owner||!mesh?.geometry||!mesh.material?.map?.image||!Number.isFinite(now)){clear();return false}
  if(failed?.mesh===mesh&&failed?.actor===owner)return false;
  if(actor!==owner||source!==mesh){clear();actor=owner;source=mesh}
  if(now-last<.04)return !!canvas;
  let previousTarget,autoClear,autoReset,alpha,saved=false;
  try{
   if(!target){
    const width=Math.min(192,Math.max(96,Math.round((frame.clientWidth||96)*2))),height=Math.round(width*1.25);
    canvas=frame.ownerDocument.createElement('canvas');canvas.width=width;canvas.height=height;canvas.dataset.actor=owner.id||'';canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
    context=canvas.getContext('2d',{alpha:true});if(!context)throw Error('Portrait canvas unavailable');
    target=new T.WebGLRenderTarget(width,height,{depthBuffer:false,stencilBuffer:false,generateMipmaps:false});
    target.texture.colorSpace=T.SRGBColorSpace;target.texture.generateMipmaps=false;
    pixels=new Uint8Array(width*height*4);displayPixels=context.createImageData(width,height);
   }
   if(!quad){quad=new T.Mesh(mesh.geometry,mesh.material);scene.add(quad)}
   quad.geometry=mesh.geometry;quad.material=mesh.material;quad.scale.copy(mesh.scale);
   quad.geometry.computeBoundingBox();const bounds=quad.geometry.boundingBox.clone();bounds.min.multiply(mesh.scale);bounds.max.multiply(mesh.scale);bounds.getCenter(center);bounds.getSize(size);
   const aspect=target.width/target.height,halfY=Math.max(size.y/2,size.x/2/aspect)*1.04,halfX=halfY*aspect;
   camera.left=-halfX;camera.right=halfX;camera.top=halfY;camera.bottom=-halfY;camera.near=.01;camera.far=20;
   camera.position.set(center.x,center.y,5);camera.lookAt(center.x,center.y,0);camera.updateProjectionMatrix();
   previousTarget=renderer.getRenderTarget();renderer.getViewport(viewport);renderer.getScissor(scissor);
   const scissorTest=renderer.getScissorTest();renderer.getClearColor(color);alpha=renderer.getClearAlpha();autoClear=renderer.autoClear;autoReset=renderer.info.autoReset;
   saved={scissorTest};renderer.setRenderTarget(target);renderer.setViewport(0,0,target.width,target.height);renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.autoClear=true;renderer.info.autoReset=false;
   renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,target.width,target.height,pixels);
   const stride=target.width*4;
   for(let row=0;row<target.height;row++)displayPixels.data.set(pixels.subarray((target.height-1-row)*stride,(target.height-row)*stride),row*stride);
   // Undo association in linear light, then encode straight sRGB for ImageData.
   const rgba=displayPixels.data;for(let i=0;i<rgba.length;i+=4){const alpha=rgba[i+3];if(alpha>0&&alpha<255)for(let c=0;c<3;c++){const value=Math.min(1,linear[rgba[i+c]]*255/alpha);rgba[i+c]=Math.round(255*(value<=.0031308?value*12.92:1.055*value**(1/2.4)-.055))}}
   context.putImageData(displayPixels,0,0);if(!canvas.parentNode)frame.appendChild(canvas);image.style.opacity='0';last=now;frames++;return true;
  }catch(error){failed={mesh,actor:owner,error:String(error?.message||error)};retire();return false}
  finally{
   if(saved){renderer.setRenderTarget(previousTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(saved.scissorTest);renderer.setClearColor(color,alpha);renderer.autoClear=autoClear;renderer.info.autoReset=autoReset}
  }
 }
 return{update,clear,dispose:clear,inspect:()=>({active:!!target,actorId:actor?.id||null,frames,failed:!!failed,error:failed?.error||null,width:target?.width||0,height:target?.height||0,rgbaBytes:target?target.width*target.height*4:0})};
}
