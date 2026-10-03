import {createSatireGLB} from './models.js';
export const REPLACEMENTS=Object.freeze({
 './assets/models/city-kit/fax-kiosk.glb':'judgmental-fax',
 './assets/models/city-kit/pfand-machine.glb':'pfand-machine',
 './assets/models/city-kit/garden-gnome.glb':'garden-gnome',
 './assets/models/city-kit/garden-shed.glb':'garden-shed',
 './assets/models/city-kit/bench.glb':'city-bench',
 './assets/models/city-kit/litter-bin.glb':'passive-bin',
 './assets/models/city-kit/bollard.glb':'bollard',
 './assets/models/german-props/beer-crate.glb':'beer-crate',
 './assets/models/german-props/allotment-wheelbarrow.glb':'garden-wheelbarrow',
 './assets/models/german-props/recycling-containers.glb':'recycling-judges',
 './assets/models/german-props/garden-gnome-watering.glb':'watering-gnome',
 './assets/models/german-props/garden-gnome-placard.glb':'ordnung-gnome',
 './assets/models/german-props/reserved-lounger-blue.glb':'reserved-lounger'
});
const caches=new WeakMap();
export function loadSatireModel(id,loader){
 let cache=caches.get(loader);if(!cache){cache=new Map();caches.set(loader,cache);}
 if(!cache.has(id))cache.set(id,new Promise((resolve,reject)=>loader.parse(createSatireGLB(id),'',resolve,reject)).catch(error=>{cache.delete(id);throw error;}));
 return cache.get(id);
}
export async function loadWithDetailFallback(url,loader,warn=console.warn){
 const path=url.split('?')[0];
 if(!Object.hasOwn(REPLACEMENTS,path))return loader.loadAsync(url);
 try{return await loadSatireModel(REPLACEMENTS[path],loader);}
 catch(error){warn('Satire-kit candidate failed; keeping original '+url,error);return loader.loadAsync(url);}
}
// Derived from the existing semantic station rectangle. No new collision owner.
// Keep the edge clear; all fixtures occupy the existing rear furniture strip.
export function stationLayout(s){
 if(![s.w,s.h].every(n=>Number.isFinite(n)&&n>0))throw new TypeError('Station rectangle required');
 const w=s.w*.02,d=s.h*.02,back=(s.id.startsWith('sued')?-1:1)*Math.min(.65,d*.15),factor=Math.min(1,w/24,d/4);
 if(w<6||d<1)return [];
 return [
  {id:'platform-shelter',x:-3.2,z:back,scale:1.15},
  {id:'platform-shelter',x:3.2,z:back,scale:1.15},
  {id:'departure-board',x:-8.0,z:back,scale:1},
  {id:'platform-sign',x:8.0,z:back,scale:1},
  {id:'station-clock',x:-5.35,z:back,scale:.95},
  {id:'ticket-machine',x:5.35,z:back,scale:.88}
 ].map(p=>({...p,x:p.x*factor,scale:p.scale*factor})).filter(p=>Math.abs(p.x)+2.2*p.scale<=w/2&&Math.abs(p.z)+1.16*p.scale<=d/2);
}
export async function installStationKit(T,world,slots,loader,coordinates){
 const {S,X,Z}=coordinates;
 await Promise.all(slots.map(async slot=>{
  const s=slot.state,fixtures=slot.fixtures||[],placements=fixtures.map(p=>({id:p.satireId,x:(p.x-s.x-s.w/2)*S,z:(p.y-s.y-s.h/2)*S,scale:p.scale}));if(!placements.length)return;
  const replacement=new T.Group(),ownedGeometry=[],ownedMaterials=[];
  const block=(w,h,d,color,x,y,z)=>{const geometry=new T.BoxGeometry(w,h,d),material=new T.MeshStandardMaterial({color,roughness:.95}),q=new T.Mesh(geometry,material);ownedGeometry.push(geometry);ownedMaterials.push(material);q.position.set(x,y,z);replacement.add(q);};
  try{
   const sources=await Promise.all(placements.map(p=>loadSatireModel(p.id,loader)));
   const south=s.id.startsWith('sued'),width=s.w*S,depth=s.h*S,edge=(south?1:-1)*depth/2;
   block(width,.3,depth,0xb9b7ae,0,.15,0);
   block(width,.08,.12,0xd2cdc0,0,.34,edge);
   block(width,.025,.25,0xc8ad63,0,.39,edge+(south?-.29:.29));
   for(let i=-4;i<=4;i++)block(.035,.027,.25,0x333432,i*width*.1,.41,edge+(south?-.29:.29));
   for(let step=0;step<3;step++){const top=.3-step*.1,z=(south?-1:1)*(depth/2+.2+step*.4);block(2.8,top,.4,0xb9b7ae,0,top/2,z);block(2.8,.025,.06,0xd2cdc0,0,top+.013,z+(south?-.19:.19));}
   for(let i=0;i<sources.length;i++){const p=placements[i],model=sources[i].scene.clone(true);model.scale.setScalar(p.scale);model.position.set(p.x,.3,p.z);model.rotation.y=south?Math.PI:0;replacement.add(model);}
   replacement.name='Satire kit / '+s.id;replacement.position.set(X(s.x+s.w/2),0,Z(s.y+s.h/2));
   world.add(replacement);slot.fallback.visible=false;slot.model=replacement;for(const fixture of fixtures)fixture.active=true;
  }catch(error){for(const resource of [...ownedGeometry,...ownedMaterials])resource.dispose();console.warn('Original station retained: '+s.id,error);}
 }));
}
