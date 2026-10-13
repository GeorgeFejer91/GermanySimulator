export function createAmtTouchPicker({THREE:T,scene,camera}){
 const ray=new T.Raycaster(),point=new T.Vector3(),bounds=new T.Box3();
 ray.layers.enable(1);
 let pixelContext=null;
 const visible=node=>{for(let parent=node;parent;parent=parent.parent)if(!parent.visible)return false;return true};
 const belongs=(node,roots)=>{for(let parent=node;parent;parent=parent.parent)if(roots.includes(parent))return true;return false};
 function paintedPixel(material,uv){
  const texture=material.map,image=texture?.image;
  if(!image||!uv||!material.transparent&&!material.alphaTest)return true;
  texture.updateMatrix();const sample=texture.transformUv(uv.clone());
  const px=Math.min(image.width-1,Math.max(0,Math.floor(sample.x*image.width))),py=Math.min(image.height-1,Math.max(0,Math.floor(sample.y*image.height)));
  let alpha;
  if(image.data)alpha=image.data[(py*image.width+px)*4+3]/255;
  else{
   if(!pixelContext){const canvas=document.createElement('canvas');canvas.width=canvas.height=1;pixelContext=canvas.getContext('2d',{willReadFrequently:true});pixelContext.imageSmoothingEnabled=false}
   pixelContext.clearRect(0,0,1,1);pixelContext.drawImage(image,px,py,1,1,0,0,1,1);alpha=pixelContext.getImageData(0,0,1,1).data[3]/255;
  }
  return alpha>=Math.max(.035,material.alphaTest);
 }
 function hitAt(x,y,width,height,roots,meshes,proxies){
  ray.setFromCamera({x:x/width*2-1,y:1-y/height*2},camera);
  for(const hit of ray.intersectObjects(meshes,false)){
   if(!visible(hit.object))continue;
   const material=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex||0]:hit.object.material;
   if(!material?.visible||material.opacity<=0&&!proxies.has(hit.object)||!paintedPixel(material,hit.uv))continue;
   if(belongs(hit.object,roots))return hit.distance;
   if(material.opacity>=.65||proxies.has(hit.object))return Infinity;
  }
  return Infinity;
 }
 return function pick(x,y,width,height,targets){
  if(width<=0||height<=0||x<0||x>width||y<0||y>height)return null;
  camera.updateMatrixWorld();scene.updateMatrixWorld(true);
  const meshes=[];scene.traverse(node=>{if(node.isMesh&&node.geometry?.attributes.position)meshes.push(node)});
  const proxies=new Set(targets.filter(target=>target.renderedProxy).flatMap(target=>target.objects));
  const tolerance=Math.max(64,Math.min(112,Math.min(width,height)*.22));
  let selected=null,best=Infinity,depth=Infinity;
  for(const target of targets){
   const roots=target.objects.filter(visible);if(!roots.length)continue;
   bounds.makeEmpty();for(const root of roots)bounds.expandByObject(root,true);
   let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
   for(const px of [bounds.min.x,bounds.max.x])for(const py of [bounds.min.y,bounds.max.y])for(const pz of [bounds.min.z,bounds.max.z]){
    point.set(px,py,pz).project(camera);if(point.z<-1||point.z>1)continue;
    left=Math.min(left,(point.x+1)*width/2);right=Math.max(right,(point.x+1)*width/2);
    top=Math.min(top,(1-point.y)*height/2);bottom=Math.max(bottom,(1-point.y)*height/2);
   }
   if(right<0||left>width||bottom<0||top>height||left===Infinity)continue;
   left=Math.max(0,left);right=Math.min(width,right);top=Math.max(0,top);bottom=Math.min(height,bottom);
   const nearX=Math.max(left,Math.min(right,x)),nearY=Math.max(top,Math.min(bottom,y));
   if(Math.hypot(nearX-x,nearY-y)>tolerance)continue;
   const samples=[[nearX,nearY]];
   for(const fx of [.01,.2,.5,.8,.99])for(const fy of [.01,.2,.5,.8,.99])samples.push([left+(right-left)*fx,top+(bottom-top)*fy]);
   for(const [sx,sy] of samples){
    const distance=Math.hypot(sx-x,sy-y);if(distance>tolerance||distance>best)continue;
    const hit=hitAt(sx,sy,width,height,roots,meshes,proxies);if(!Number.isFinite(hit))continue;
    if(distance<best||hit<depth){best=distance;depth=hit;selected=target.interaction}
   }
  }
  return selected;
 };
}
