import {createDetailGLB} from './models.js?v=20260930-prop-details1';
const paths=Object.freeze({
  './assets/models/city-kit/fax-kiosk.glb':'fax-kiosk',
  './assets/models/german-props/beer-crate.glb':'beer-crate',
  './assets/models/german-props/allotment-wheelbarrow.glb':'allotment-wheelbarrow',
  './assets/models/german-props/recycling-containers.glb':'recycling-containers'
});
// Called only in the opt-in propDetails=1 lane. The existing renderer owns
// caching, instance cloning, fit, collisions, labels and normal-model fallback.
export async function loadWithDetailFallback(url,loader,warn=console.warn){
  const path=url.split('?')[0];
  if(!Object.hasOwn(paths,path))return loader.loadAsync(url);
  try{return await new Promise((resolve,reject)=>loader.parse(createDetailGLB(paths[path]),'',resolve,reject));}
  catch(error){warn('Prop detail candidate failed; loading original '+url,error);return loader.loadAsync(url);}
}
