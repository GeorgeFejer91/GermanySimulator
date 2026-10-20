function abortReason(signal){return signal.reason===undefined?new DOMException('Asset aborted','AbortError'):signal.reason}
function checkAbort(signal){if(signal?.aborted)throw abortReason(signal)}

function discardModel(gltf){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  gltf.scene?.traverse(node=>{
    if(node.geometry)geometries.add(node.geometry);
    for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[]){
      materials.add(material);
      for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    }
  });
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  for(const texture of textures){texture.image?.close?.();texture.dispose()}
}

export function modelLoaderWithSignal(loader,signal){
  if(!signal)return loader;
  return {
    parse:loader.parse.bind(loader),
    async loadAsync(url){
      checkAbort(signal);
      const response=await fetch(url,{signal});
      if(!response.ok)throw new Error(`Model source unavailable (${response.status}): ${url}`);
      const bytes=await response.arrayBuffer();checkAbort(signal);
      const base=new URL('.',new URL(url,globalThis.document?.baseURI)).href;
      const gltf=await new Promise((resolve,reject)=>loader.parse(bytes,base,resolve,reject));
      if(signal.aborted){discardModel(gltf);throw abortReason(signal)}
      return gltf;
    }
  };
}

export async function loadTextureImage(url,signal){
  checkAbort(signal);
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(`Texture source unavailable (${response.status}): ${url}`);
  const blob=await response.blob();checkAbort(signal);
  const objectURL=URL.createObjectURL(blob),image=new Image();
  try{
    await new Promise((resolve,reject)=>{
      const finish=(failed,error)=>{
        image.onload=image.onerror=null;signal?.removeEventListener('abort',abort);
        if(failed){image.src='';reject(error)}else resolve();
      };
      const abort=()=>finish(true,abortReason(signal));
      image.onload=()=>finish(false);image.onerror=()=>finish(true,new Error('Texture decode unavailable: '+url));
      signal?.addEventListener('abort',abort,{once:true});image.src=objectURL;
    });
    checkAbort(signal);return image;
  }finally{URL.revokeObjectURL(objectURL)}
}

// Three's native loader remains available to callers without a request lifetime.
export async function loadThreeTexture(T,url,signal,ownerSignal){
  if(ownerSignal){
    const request=new AbortController(),cancel=event=>request.abort(event.target.reason);
    for(const source of [signal,ownerSignal])if(source){if(source.aborted)request.abort(source.reason);else source.addEventListener('abort',cancel,{once:true})}
    try{return await loadThreeTexture(T,url,request.signal)}finally{for(const source of [signal,ownerSignal])source?.removeEventListener('abort',cancel)}
  }
  if(!signal)return new Promise((resolve,reject)=>new T.TextureLoader().load(url,resolve,undefined,reject));
  return loadTextureImage(url,signal).then(image=>{checkAbort(signal);const texture=new T.Texture(image);texture.needsUpdate=true;return texture});
}

// A cancelled waiter releases only its own reference to a shared resource.
export function leaseWithSignal(lease,signal){
  if(!signal)return lease;
  let released=false;const release=()=>{if(released)return;released=true;lease.release()};
  const promise=new Promise((resolve,reject)=>{
    const abort=()=>{release();reject(abortReason(signal))};
    // Subscribe before release: the last reference can reject the source synchronously.
    lease.promise.then(value=>{signal.removeEventListener('abort',abort);if(signal.aborted){abort();return}resolve(value)},error=>{signal.removeEventListener('abort',abort);reject(error)});
    if(signal.aborted){abort();return}
    signal.addEventListener('abort',abort,{once:true});
  });
  return {promise,release};
}
