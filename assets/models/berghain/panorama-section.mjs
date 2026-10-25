import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

// Joint, provisional section from P02/P16 + I19. These are reconstruction
// choices, not survey datums. Only architectural spans stretch; fixtures retain
// metre dimensions. The official outer hull is never changed here.
export const panoramaSection = Object.freeze({
  mainFloor:5.45, floor:9.05, ceiling:13.95, loungeFloor:12.15, loungeCeiling:14.8,
  verticalOffset:-4.2, adjacentOffset:5.35,
  oldRoomLeft:-18.5543665076, oldRoomRight:-4.6822200573,
  sources:['P02','P16','I19'],
  confidence:'Six-bay correspondence supported; heights, partition and stair geometry estimated'
});
export const adjacentPanoramaPoint=([x,y,z])=>[x+panoramaSection.adjacentOffset,y-4.2,z];
export const dancePanoramaPoint=([x,y,z])=>[
  x+(x-panoramaSection.oldRoomLeft)/(panoramaSection.oldRoomRight-panoramaSection.oldRoomLeft)*5.35,y-4.2,z];
const ceilingPanoramaPoint=point=>{const q=dancePanoramaPoint(point);q[1]+=.2;return q;};
const array=p=>[p.x,p.y,p.z],object=p=>({x:p[0],y:p[1],z:p[2]});
const named=p=>p.name||p.id||'';
const stairItem=p=>/^(Panorama stair|panorama-stair-)/.test(named(p));
const adjacent=p=>/^(Panorama lounge|Panorama WC |panorama-wc-|panorama-banquette-|upper lounge |upper Panorama lounge|Felsenland )/.test(named(p))||p.id==='felsenland';
const included=p=>/^(Panorama |panorama-|upper lounge |upper Panorama lounge|Felsenland |uddenberg-climber)/.test(named(p))||p.id==='felsenland';

function setBounds(s,points){
 s.polygon=points;s.x=[Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0]))];
 s.z=[Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];
}
function syncSolid(s){
 const p=s.renderPart,m=p?.matrix;if(!m)return;
 const corners=[];for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5])
  corners.push(new THREE.Vector3(x,y,z).applyMatrix4(new THREE.Matrix4().fromArray(m)));
 setBounds(s,[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[m[12]+m[0]*x+m[8]*z,m[14]+m[2]*x+m[10]*z]));
 s.y=[Math.min(...corners.map(p=>p.y)),Math.max(...corners.map(p=>p.y))];
}

function fitWindowWall(layout){
 const windows=layout.parts.filter(p=>p.name==='south tier window'&&p.center[1]>9&&p.center[1]<14)
  .sort((a,b)=>a.center[0]-b.center[0]).slice(0,6);
 function cloneFixture(source,id){
  const originals=layout.parts.filter(p=>p.fixture===source),mapping=new Map();
  for(const p of originals){const q={...p,name:p.name.replace(source,id),fixture:id,matrix:[...p.matrix],center:[...p.center],size:[...p.size]};mapping.set(p,q);layout.parts.push(q);}
  for(const s of [...layout.solids].filter(s=>mapping.has(s.renderPart)||s.name?.startsWith(source))){
   const q={...s,name:s.name.replace(source,id),x:[...s.x],y:[...s.y],z:[...s.z]};
   if(s.polygon)q.polygon=s.polygon.map(p=>[...p]);if(s.renderPart)q.renderPart=mapping.get(s.renderPart);
   if(s.fixture)q.fixture=id;layout.solids.push(q);
  }
  const f=layout.fixtures.find(f=>f.id===source);layout.fixtures.push({...f,id,anchor:[...f.anchor],dimensions:{...f.dimensions}});
 }
 function moveFixture(id,destination,rotation=0){
  const f=layout.fixtures.find(f=>f.id===id),m=new THREE.Matrix4().makeTranslation(...destination)
   .multiply(new THREE.Matrix4().makeRotationY(rotation)).multiply(new THREE.Matrix4().makeTranslation(...f.anchor.map(x=>-x)));
  const point=p=>new THREE.Vector3(...p).applyMatrix4(m).toArray();
  for(const p of layout.parts.filter(p=>p.fixture===id)){
   p.matrix=new THREE.Matrix4().multiplyMatrices(m,new THREE.Matrix4().fromArray(p.matrix)).toArray();p.center=p.matrix.slice(12,15);
  }
  for(const s of layout.solids.filter(s=>s.renderPart?.fixture===id||s.name?.startsWith(id))){
   if(s.renderPart){syncSolid(s);continue;}
   const poly=s.polygon||[[s.x[0],s.z[0]],[s.x[1],s.z[0]],[s.x[1],s.z[1]],[s.x[0],s.z[1]]];
   const y=s.y.map(y=>point([f.anchor[0],y,f.anchor[2]])[1]);
   setBounds(s,poly.map(([x,z])=>{const q=point([x,0,z]);return[q[0],q[2]];}));s.y=y;
  }
  f.anchor=[...destination];
 }
 for(let i=3;i<6;i++)cloneFixture('panorama-radiator-0','panorama-radiator-'+i);
 for(let i=2;i<5;i++)cloneFixture('panorama-service-tubes-0','panorama-service-tubes-'+i);
 windows.forEach((w,i)=>moveFixture('panorama-radiator-'+i,[w.center[0],9.05,21.53]));
 for(let i=0;i<5;i++)moveFixture('panorama-service-tubes-'+i,[(windows[i].center[0]+windows[i+1].center[0])/2,9.05,21.53]);
 // I19 places the low seating in front of this window/radiator sequence.
 for(const [i,x] of [-10.15,-4.8,-13.8].entries())moveFixture('panorama-banquette-'+i,[x,9.05,20.5],Math.PI/2);
 const dj=layout.fixtures.find(f=>f.id==='panorama-dj-table');moveFixture(dj.id,[dj.anchor[0]-1.15,dj.anchor[1],dj.anchor[2]]);
 function box(name,c,size,material='steel'){
  const p={name:'Panorama window room '+name,section:'interior',shape:'box',material,center:c,size,
   matrix:new THREE.Matrix4().makeScale(...size).setPosition(...c).toArray(),instanceTone:.94};
  layout.parts.push(p);const s={name:p.name,renderPart:p};syncSolid(s);layout.solids.push(s);
 }
 for(const [i,w] of windows.entries()){
  const x=w.center[0],width=w.size[0],low=9.9,high=13.65,z=21.9;
  // I19 shows three columns, a heavier central meeting rail and finer
  // quarter-height bars. The exterior frames remain in their own facade plane.
  for(const fraction of [-.5,-1/6,1/6,.5])box(i+' inner upright',[x+width*fraction,(low+high)/2,z],[.045,high-low,.065]);
  for(const fraction of [0,.25,.5,.75,1])box(i+' inner transom',[x,low+(high-low)*fraction,z],[width,fraction===.5?.085:.035,.065]);
 }
 // DJ-end wall visible in I19 gallery04. The public rear opening's exact
 // location is an estimate; it reaches the existing ordinary WC/lounge aisle.
 for(const [a,b] of [[7.4,10],[12,21.56]])box('DJ end lining',[.62,11.5,(a+b)/2],[.16,4.9,b-a],'pale');
 box('DJ end entry header',[.62,12.9,11],[.16,2.1,2],'pale');
 layout.panoramaRegistration.windowRoom={sources:['I19','P02','P16'],count:6,
  radiatorCount:6,pierServiceCount:5,innerFrameColumns:3,
  confidence:'Photographed arrangement; fixture counts, dimensions, wall thickness and public opening position estimated'};
}

export function reconcilePanoramaSection(layout,viewpoints){
 const stair=layout.floors.find(f=>f.name==='Panorama stair');
 const [oldHigh,oldLow]=stair.rampAxis.map(p=>[...p]);
 const oldRun=oldLow[0]-oldHigh[0],newRun=oldRun-5.35;
 const stairPoint=([x,y,z])=>{
  const t=(oldLow[0]-x)/oldRun;
  return[x+5.35*t,y-4.2*t,z];
 };
 const passagePoint=([x,y,z])=>[x<7.4?x+5.35:x<16.8?12.75+(x-7.4)*(16.8-12.75)/(16.8-7.4):x,y-4.2,z];
 const mapFor=p=>{
  const n=named(p);
  // Ceiling-mounted bodies retain the photographed window-head clearance.
  if(n==='Panorama fitted ceiling'||n==='Panorama ceiling beam'||/^panorama-(acoustic-|pendant-)/.test(n)){
   const map=/^panorama-pendant-/.test(n)?([x,y,z])=>[x,y-4,z]:ceilingPanoramaPoint;
   return map;
  }
  if(stairItem(p)&&n!=='Panorama stair landing')return stairPoint;
  if(n==='Panorama stair landing'||n.startsWith('Panorama connection stair landing'))return adjacentPanoramaPoint;
  if(adjacent(p))return adjacentPanoramaPoint;
  if(n.startsWith('Panorama connection lower lounge edge'))return adjacentPanoramaPoint;
  if(n.startsWith('Panorama connection')&&!n.includes('back room partition'))return passagePoint;
  if(/^(panorama-(bar|stool-|bottle-rack|pendant-|counter-wall)|uddenberg-climber)/.test(n))return ([x,y,z])=>[x,y-4.2,z];
  if(n.startsWith('panorama-dj-table')||n==='Panorama speaker')return adjacentPanoramaPoint;
  return dancePanoramaPoint;
 };
 const spanning=p=>['Panorama Bar','Panorama fitted ceiling','Panorama ceiling beam','Panorama connection back room partition',
  'Panorama connection hall-edge passage','Panorama connection smoking doorway approach'].includes(named(p))||
  (named(p).startsWith('Panorama connection passage ')&&named(p).endsWith(' rail'));
 const originals=new Map(layout.parts.map(p=>[p,p.matrix?[...p.matrix]:null]));
 for(const p of layout.parts.filter(included)){
  let map=mapFor(p);
  // Spread assemblies through the wider room without spreading the components
  // inside a rigid radiator, conduit or suspended acoustic fixture.
  if((map===dancePanoramaPoint||map===ceilingPanoramaPoint)&&p.fixture){
   const anchor=layout.fixtures.find(f=>f.id===p.fixture).anchor;
   const delta=map(anchor).map((v,i)=>v-anchor[i]);
   map=point=>point.map((v,i)=>v+delta[i]);
  }
  if(p.matrix){
   const m=p.matrix,c=map(m.slice(12,15));
   if(spanning(p)){
    const extent=(Math.abs(m[0])+Math.abs(m[4])+Math.abs(m[8]))/2;
    const left=map([m[12]-extent,m[13],m[14]])[0],right=map([m[12]+extent,m[13],m[14]])[0];
    const scale=(right-left)/(2*extent);c[0]=(left+right)/2;
    for(const offset of [0,4,8])m[offset]*=scale;
   }
   // Extend architectural lining only; furnishings remain rigid.
   if(named(p)==='Panorama connection back room partition'||
     (p.fixture==='panorama-counter-wall'&&/window-side lining|inner-end lining|recess head/.test(p.name))){
    m[5]+=.2;c[1]+=.1;
   }
   // The suspended DJ desk follows the floor; its cables still meet the ceiling.
   if(p.fixture==='panorama-dj-table'&&p.name.endsWith('suspension')){m[5]+=.2;c[1]+=.1;}
   m.splice(12,3,...c);p.center=[...c];
   p.size=[0,4,8].map(i=>Math.hypot(...m.slice(i,i+3)));
  }else{if(p.start)p.start=map(p.start);if(p.end)p.end=map(p.end);}
 }
 for(const f of layout.floors.filter(included)){
  const map=mapFor(f),oldY=f.y;
  setBounds(f,f.polygon.map(([x,z])=>{const q=map([x,oldY,z]);return[q[0],q[2]];}));
  if(f.rampAxis){
   const a=map([f.rampAxis[0][0],f.y,f.rampAxis[0][1]]),b=map([f.rampAxis[1][0],f.endY,f.rampAxis[1][1]]);
   f.rampAxis=[[a[0],a[2]],[b[0],b[2]]];f.y=a[1];f.endY=b[1];
  }else f.y=oldY-4.2;
 }
 for(const s of layout.solids.filter(included)){
  if(s.renderPart){syncSolid(s);continue;}
  const map=mapFor(s),polygon=s.polygon||[[s.x[0],s.z[0]],[s.x[1],s.z[0]],[s.x[1],s.z[1]],[s.x[0],s.z[1]]];
  const ys=polygon.flatMap(([x,z])=>s.y.map(y=>map([x,y,z])[1]));
  setBounds(s,polygon.map(([x,z])=>{const q=map([x,0,z]);return[q[0],q[2]];}));
  s.y=[Math.min(...ys),Math.max(...ys)];
  if(s.ramp)s.y=[Math.min(s.ramp.y,s.ramp.endY)-.15,Math.max(s.ramp.y,s.ramp.endY)];
 }
 // Rebuild tread pitch for the new rise/run. Body height, tread thickness and
 // handrail height remain physical dimensions, not vertically scaled meshes.
 const oldTreads=layout.parts.filter(p=>p.name==='Panorama stair tread');
 const template=oldTreads[0],templateMatrix=originals.get(template);
 layout.parts=layout.parts.filter(p=>!oldTreads.includes(p));
 layout.solids=layout.solids.filter(s=>!oldTreads.includes(s.renderPart));
 const steps=21,[high,low]=stair.rampAxis;
 for(let i=0;i<steps;i++){
  const t=(i+.5)/steps,m=[...templateMatrix];
  // Registered flight runs along x. Preserve its transverse calibrated axis.
  const previousDepth=Math.abs(m[8]);m[8]*=(newRun/steps+.015)/previousDepth;
  m[12]=high[0]+(low[0]-high[0])*t;m[13]=stair.y+(stair.endY-stair.y)*t-.06;
  m[14]=high[1]+(low[1]-high[1])*t;
  const p={...template,matrix:m,center:m.slice(12,15),size:[0,4,8].map(j=>Math.hypot(...m.slice(j,j+3)))};
  layout.parts.push(p);const s={name:p.name,renderPart:p,undersideOnly:true,treadFloor:stair};syncSolid(s);layout.solids.push(s);
 }
 for(const list of [layout.fixtures,layout.artworks])for(const f of list.filter(included))f.anchor=mapFor(f)(f.anchor);
 for(const b of layout.balustrades.filter(included)){b.start=mapFor(b)(b.start);b.end=mapFor(b)(b.end);}
 for(const id of ['panorama','lounge']){
  viewpoints[id].position=object((id==='lounge'?adjacentPanoramaPoint:dancePanoramaPoint)(array(viewpoints[id].position)));
 }
 viewpoints.smoking.position.y=panoramaSection.floor;
 const wc=layout.interiorTopology.panoramaToilets;
 wc.floorHeight=panoramaSection.floor;wc.siteFootprint=wc.siteFootprint.map(adjacentPanoramaPoint);
 layout.upperLounge.floorHeight=panoramaSection.loungeFloor;layout.upperLounge.ceilingHeight=panoramaSection.loungeCeiling;
 layout.panoramaServices.floorHeight=panoramaSection.floor;layout.panoramaServices.ceilingHeight=panoramaSection.ceiling;
 const registration=layout.panoramaRegistration;
 registration.stairRoute=[{x:low[0]+.8,y:stair.endY,z:low[1]},
  {x:high[0]-.5,y:stair.y,z:high[1]},{x:high[0]-.5,y:stair.y,z:high[1]+2},viewpoints.panorama.position];
 registration.mainApproach=[...registration.mainApproach.slice(0,3),...registration.stairRoute];
 for(const key of ['toiletRoute','loungeRoute'])registration[key]=registration[key].map((p,i)=>object(i===0?dancePanoramaPoint(array(p)):adjacentPanoramaPoint(array(p))));
 registration.smokingRoute=registration.smokingRoute.map(p=>object(passagePoint(array(p))));
 registration.windowSection='First six front openings registered together; datum9.05 and room extent are photo-informed estimates';
 registration.stage='Joint six-bay plan and provisional floor section';
 registration.section={...panoramaSection,mainFloor:5.45,stairSteps:steps,stairRise:stair.y-stair.endY,
  oldFloor:13.25,oldLoungeFloor:16.35,oldCeiling:17.95,
  limit:'Not a surveyed section; lounge exterior bay, contemporary inventory and backstage remain unverified'};
 layout.fixtures.find(f=>f.id==='panorama-counter-wall').dimensions.height=4.9;
 fitWindowWall(layout);
 // The original guessed grid puts a beam 25cm above the relocated lounge
 // flight. I19 shows a clear stair/low ceiling, not this mid-body obstruction.
 // Retire that one unsupported placeholder; do not invent a structural cut.
 const anchor=studyToSite({x:8,y:12.95,z:-6}),retired=[];
 layout.parts=layout.parts.filter(p=>{
  if(p.name!=='structural beam'||Math.hypot(p.center[0]-anchor.x,p.center[2]-anchor.z)>.001||Math.abs(p.center[1]-anchor.y)>.1)return true;
  retired.push({name:p.name,center:[...p.center],size:[...p.size],author:[8,12.95,-6]});return false;
 });
 registration.section.retiredUnregisteredBeams=retired;
}
