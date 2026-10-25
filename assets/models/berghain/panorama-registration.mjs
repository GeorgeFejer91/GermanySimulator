import {reconcilePanoramaSection} from './panorama-section.mjs';
import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

// U02 and I19/V05 register the window wing toward the entrance facade.
// This preserves each authored assembly's physical scale. Exact room extents
// and floor datums remain estimated; the hull is not an interior survey.
const site=([x,y,z])=>{const p=studyToSite({x,y,z});return [p.x,p.y,p.z];};
const oldCorner=site([-22,0,-22]),frontCorner=site([-22,0,22]);
const frontageMatrix=new THREE.Matrix4().makeRotationY(Math.PI/2);
frontageMatrix.setPosition(frontCorner[0]-oldCorner[2],0,frontCorner[2]+oldCorner[0]);
const apply=(p,m)=>new THREE.Vector3(...p).applyMatrix4(m).toArray();
export const panoramaWorldPoint=p=>apply(p,frontageMatrix);
export const panoramaStudyPoint=p=>panoramaWorldPoint(site(p));
export const upperLoungeStudyPoint=p=>{const q=panoramaStudyPoint(p);q[2]+=.4;return q;};
export const panoramaPassageAt=p=>p.y>8&&p.y<11.5&&
 ((p.x>=12.45&&p.x<=17.25&&p.z>=8.5&&p.z<=10.65)||(p.x>=16.8&&p.x<=19.15&&p.z>=6.7&&p.z<=10.65));
const pointObject=p=>({x:p[0],y:p[1],z:p[2]});

function reposition(rotation,oldAnchor,newAnchor){
 return new THREE.Matrix4().makeTranslation(...newAnchor)
  .multiply(new THREE.Matrix4().makeRotationY(rotation))
  .multiply(new THREE.Matrix4().makeTranslation(...oldAnchor.map(v=>-v)));
}
function panoramaItem(item){
 const n=item.name||item.id||'';
 return /^(Panorama |panorama-|upper lounge |upper Panorama lounge|Felsenland |uddenberg-climber)/.test(n)||item.id==='felsenland';
}
function bounds(item,polygon){
 item.polygon=polygon;
 item.x=[Math.min(...polygon.map(p=>p[0])),Math.max(...polygon.map(p=>p[0]))];
 item.z=[Math.min(...polygon.map(p=>p[1])),Math.max(...polygon.map(p=>p[1]))];
}

// I19 views06/15/16 show an opaque counter-end plane, perpendicular to the
// glazed side wall. Fit a separate interior lining to the estimated room;
// the photographs do not resolve its construction or the exterior bay behind it.
function counterWall(layout){
 const fixture='panorama-counter-wall',floorY=13.25,ceilingY=17.95;
 const x=-18.42,depth=.16,z0=7.4,z1=21.56,recess=[8.3,9.3,14.3,15.55];
 // The renderer's legacy per-batch colour seed depends on batch size. Keep
 // existing surfaces at their previous tone when extending these batches.
 for(const material of ['pale','steel','aluminium','rubber']){
  const batch=layout.parts.filter(p=>p.section==='interior'&&p.shape==='box'&&
   (p.material===material||(material==='pale'&&p.material==='mainBarPlaster')));
  batch.forEach((p,i)=>{p.instanceTone??=.84+((i*193+batch.length*37)%101)/625;});
 }
 function part(name,center,size,material='pale',shape='box',rotation=0){
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...center),
   new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),new THREE.Vector3(...size)).toArray();
  const p={name:fixture+' '+name,fixture,center,size,material,shape,matrix,section:'interior',instanceTone:.94};
  layout.parts.push(p);
  if(shape==='box'){
   const b=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(matrix));
   layout.solids.push({name:p.name,renderPart:p,x:[b.min.x,b.max.x],y:[b.min.y,b.max.y],z:[b.min.z,b.max.z]});
  }
 }
 const panel=(name,a,b,low=floorY,high=ceilingY)=>part(name,[x,(low+high)/2,(a+b)/2],[depth,high-low,b-a]);
 panel('window-side lining',recess[1],z1);
 panel('inner-end lining',z0,recess[0]);
 panel('recess sill',recess[0],recess[1],floorY,recess[2]);
 panel('recess head',recess[0],recess[1],recess[3],ceilingY);
 // A shallow, closed recess represents the photographed opening. There is
 // no invented door, occupiable room or backstage connection behind it.
 part('recess backing',[-18.48,(recess[2]+recess[3])/2,8.8],[.04,recess[3]-recess[2],1],'rubber');
 part('recess stainless ledge',[-18.31,recess[2],8.8],[.12,.035,1.08],'aluminium');
 // Segmented dark service/acoustic band beneath the beam. Its function,
 // module count and dimensions are estimated, not a recovered installation.
 for(let i=0;i<7;i++){
  const z=10.15+i*1.6;
  part('high service housing '+i,[-18.13,17.23,z],[.4,.58,1.55],'steel');
  part('high perforated face '+i,[-17.912,17.23,z],[1,1,1],'rubber','grille',Math.PI/2);
  for(const dz of [-.72,.72])part('high panel fastener',[-17.921,17.23,z+dz],[.025,.035,.035],'aluminium');
 }
 layout.fixtures.push({id:fixture,anchor:[x,floorY,(z0+z1)/2],sources:['I19'],
  dimensions:{height:ceilingY-floorY,length:z1-z0,liningDepth:depth},
  confidence:'Photographed opaque plane and high band; dimensions, construction and registration estimated'});
 return {sources:['I19'],views:[6,15,16],fixture,
  confidence:'Opaque plane supported; thickness, extent, recess and service-panel dimensions estimated',
  exterior:'Separate interior lining; exterior hull and openings retained',throughAccess:false,
  artwork:'Different undated photographic configurations; no current artwork reproduced or inferred'};
}

// Small, estimated public passage around the hall edge. Keep visible support
// and body barriers together; no floor spans the central dance-hall volume.
function smokingPassage(layout){
 const floorY=13.25;
 // The relocated connector is above the last pilaster practical. Keep its
 // localized upward aim beneath that real slab instead of lighting through it.
 const endLight=layout.mainBar.interiorFacade.practicalLighting.lights.at(-1);
 endLight.target[1]=8.45;endLight.intensity=80;endLight.range=4;
 // The bar-room lining is a second visible wall in front of the outer facade.
 // Cut both rendering and collisions at the same estimated upper doorway.
 const replacements=new Map();
 for(const p of layout.parts){
  if(p.fixture!=='main-bar-interior-facade'||p.shape!=='box'||!p.matrix)continue;
  const m=p.matrix,low=p.center[1]-p.size[1]/2,high=p.center[1]+p.size[1]/2;
  const z0=Math.max(-.5,(6.7-m[14])/m[10]),z1=Math.min(.5,(8.7-m[14])/m[10]);
  if(high<=9.05||low>=11.15||z1<=z0)continue;
  const y0=Math.max(-.5,(9.05-m[13])/m[5]),y1=Math.min(.5,(11.15-m[13])/m[5]);
  const slices=[];
  for(const [a,b,c,d] of [[-.5,z0,-.5,.5],[z1,.5,-.5,.5],[z0,z1,-.5,y0],[z0,z1,y1,.5]]){
   if(b-a<.0001||d-c<.0001)continue;
   const matrix=[...m];
   for(let i=0;i<3;i++){matrix[12+i]+=m[8+i]*(a+b)/2+m[4+i]*(c+d)/2;matrix[8+i]*=b-a;matrix[4+i]*=d-c;}
   slices.push({...p,name:p.name+' upper doorway trim',matrix,center:matrix.slice(12,15),size:[p.size[0],p.size[1]*(d-c),p.size[2]*(b-a)],circulationDoorway:true});
  }
  replacements.set(p,slices);
 }
 layout.parts=layout.parts.flatMap(p=>replacements.get(p)??[p]);
 layout.solids=layout.solids.flatMap(s=>replacements.has(s.renderPart)?replacements.get(s.renderPart).map(p=>{
  const m=p.matrix,polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[m[12]+m[0]*x+m[8]*z,m[14]+m[2]*x+m[10]*z]);
  const solid={...s,name:p.name,renderPart:p,y:[p.center[1]-p.size[1]/2,p.center[1]+p.size[1]/2]};bounds(solid,polygon);return solid;
 }):[s]);
 function box(name,c,size,material='steel'){
  const matrix=new THREE.Matrix4().makeScale(...size).setPosition(...c).toArray();
  const p={name:'Panorama connection '+name,section:'interior',shape:'box',material,center:c,size,matrix,instanceTone:.94,panoramaConnection:true};
  layout.parts.push(p);
  layout.solids.push({name:p.name,renderPart:p,x:[c[0]-size[0]/2,c[0]+size[0]/2],y:[c[1]-size[1]/2,c[1]+size[1]/2],z:[c[2]-size[2]/2,c[2]+size[2]/2]});
 }
 function slab(name,x,z){
  layout.floors.push({name:'Panorama connection '+name,x,z,y:floorY,polygon:[[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]]});
  box(name,[(x[0]+x[1])/2,floorY-.1,(z[0]+z[1])/2],[x[1]-x[0],.2,z[1]-z[0]],'floor');
 }
 function guard(name,a,b){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const c=[(a[0]+b[0])/2,floorY+.55,(a[1]+b[1])/2];
  const longX=a[1]===b[1],n=Math.ceil(length/.13);
  for(const h of [.12,1.1])box(name+' rail',[c[0],floorY+h,c[2]],longX?[length,.045,.045]:[.045,.045,length]);
  for(let i=0;i<=n;i++)box(name+' picket',[a[0]+(b[0]-a[0])*i/n,floorY+.57,a[1]+(b[1]-a[1])*i/n],[.025,1.06,.025]);
 }
 slab('hall-edge passage',[7.1,17.25],[8.5,10.65]);
 slab('smoking doorway approach',[16.8,19.15],[6.7,10.65]);
 // A13 describes an enclosed former control room; this estimated back wall
 // closes the unsupported edge while leaving the stair-mouth opening clear.
 box('back room partition',[-12.23,15.6,7.48],[12.46,4.7,.16],'pale');
 guard('passage north',[7.4,8.5],[16.8,8.5]);
 guard('door approach west',[16.8,6.7],[16.8,8.5]);
 guard('door approach north',[16.8,6.7],[18.78,6.7]);
 guard('passage south',[7.4,10.65],[18.82,10.65]);
 guard('lower lounge edge',[7.4,10.65],[7.4,21.2]);
 guard('stair landing west',[-5.94,4.31],[-5.94,7.2]);
 guard('stair landing end',[-5.94,4.31],[-4.68,4.31]);
 return [[7,13.25,9.6],[8,13.25,9.6],[17.5,13.25,9.6],[17.5,13.25,7.95],[18.8,13.25,7.95],[20,13.25,7.73]].map(pointObject);
}

export function registerPanorama(layout,viewpoints){
 // The original unregistered beam grid places one intermediate member
 // through every lane of this estimated stair. Retire that unsupported
 // placeholder, rather than leave a visible solid that visitors walk through.
 // G21/G23 show an unobstructed rising stair; its precise structure is unknown.
 const oldBeam=site([-1,12.95,-6]),retired=[];
 layout.parts=layout.parts.filter(p=>{
  if(p.name!=='structural beam'||Math.hypot(p.center[0]-oldBeam[0],p.center[2]-oldBeam[2])>.001||Math.abs(p.center[1]-oldBeam[1])>.1)return true;
  retired.push({name:p.name,center:[...p.center],size:[...p.size]});return false;
 });

 const bar=layout.fixtures.find(f=>f.id==='panorama-bar'),dj=layout.fixtures.find(f=>f.id==='panorama-dj-table');
 const barMatrix=reposition(0,bar.anchor,site([-18,13.25,13]));
 const djMatrix=reposition(Math.PI/2,dj.anchor,site([-5.8,13.25,13]));
 const stairMatrix=new THREE.Matrix4().makeTranslation(0,0,-1.25).multiply(frontageMatrix);
 const loungeMatrix=new THREE.Matrix4().makeTranslation(0,0,.4).multiply(frontageMatrix);
 const stairSeatMatrix=new THREE.Matrix4().makeTranslation(0,0,1.4).multiply(frontageMatrix);
 const matrixFor=item=>{
  const n=item.name||item.id||'';
  if(/^(panorama-(bar|stool-|bottle-rack|pendant-)|uddenberg-climber)/.test(n))return barMatrix;
  if(n.startsWith('panorama-dj-table')||n==='Panorama speaker')return djMatrix;
  if(/^(Panorama stair|panorama-stair-)/.test(n))return stairMatrix;
  if(/^(upper lounge |upper Panorama lounge|Felsenland )/.test(n)||item.id==='felsenland')return loungeMatrix;
  if(n.startsWith('panorama-banquette-2'))return stairSeatMatrix;
  return frontageMatrix;
 };
 const transformed=[];
 for(const p of layout.parts.filter(panoramaItem)){
  const m=matrixFor(p);transformed.push(p.name);
  if(p.matrix){
   p.matrix=new THREE.Matrix4().multiplyMatrices(m,new THREE.Matrix4().fromArray(p.matrix)).toArray();
   p.center=[p.matrix[12],p.matrix[13],p.matrix[14]];
  }else{
   if(p.start)p.start=apply(p.start,m);
   if(p.end)p.end=apply(p.end,m);
  }
 }
 for(const s of layout.solids.filter(panoramaItem)){
  const m=matrixFor(s),polygon=s.polygon||[[s.x[0],s.z[0]],[s.x[1],s.z[0]],[s.x[1],s.z[1]],[s.x[0],s.z[1]]];
  bounds(s,polygon.map(([x,z])=>{const q=apply([x,0,z],m);return[q[0],q[2]];}));
 }
 for(const f of layout.floors.filter(panoramaItem)){
  const m=matrixFor(f);
  bounds(f,f.polygon.map(([x,z])=>{const q=apply([x,0,z],m);return[q[0],q[2]];}));
  if(f.rampAxis)f.rampAxis=f.rampAxis.map(([x,z])=>{const q=apply([x,0,z],m);return[q[0],q[2]];});
 }
 for(const f of layout.fixtures.filter(panoramaItem))f.anchor=apply(f.anchor,matrixFor(f));
 for(const a of layout.artworks.filter(panoramaItem))a.anchor=apply(a.anchor,matrixFor(a));
 for(const b of layout.balustrades.filter(panoramaItem)){
  b.start=apply(b.start,matrixFor(b));b.end=apply(b.end,matrixFor(b));
 }
 for(const id of ['panorama','lounge']){
  const v=viewpoints[id];v.position=pointObject(panoramaWorldPoint([v.position.x,v.position.y,v.position.z]));
  if(id==='lounge')v.position.z+=.4;
  v.yaw+=Math.PI/2;v.confidence='Entrance-facing arrangement supported; dimensions and floor registration estimated';
  v.sources=[...new Set([...v.sources,'U02','I19','V05'])];
 }
 const wc=layout.interiorTopology.panoramaToilets;
 wc.siteFootprint=[[-21.5,13.25,-3.5],[-13,13.25,-3.5],[-13,13.25,4.8],[-21.5,13.25,4.8]].map(panoramaStudyPoint);
 wc.placement='Under the front-side upper lounge; estimated registration, not an as-built plan';
 wc.legacyAuthorFootprint=wc.authorFootprint;delete wc.authorFootprint;
 const stair=layout.floors.find(f=>f.name==='Panorama stair');
 const [high,low]=stair.rampAxis;
 const stairRoute=[[low[0]+.8,stair.endY,low[1]],
  [high[0]-.5,stair.y,high[1]],[high[0]-.5,stair.y,high[1]+2.0],
  [viewpoints.panorama.position.x,13.25,viewpoints.panorama.position.z]];
 const smokingRoute=smokingPassage(layout);
 const publicApproach=[viewpoints.panorama.position,pointObject([-6.4,13.25,10.8]),pointObject([-2.8,13.25,10.8]),pointObject([-2.8,13.25,12.8])];
 const front=p=>pointObject(panoramaStudyPoint(p));
 const toiletRoute=[...publicApproach,...[[-11.65,13.25,1],[-16,13.25,1]].map(front)];
 const loungeRoute=[...publicApproach,...[[4.7,13.25,12.8],[4.7,13.25,11.4],[6.95,13.25,11.4]].map(pointObject),
  ...[[-7.9,13.25,9],[-7.9,16.35,.8],[-11.4,16.35,.8]].map(p=>pointObject(upperLoungeStudyPoint(p)))];
 viewpoints.smoking.confidence='Photographed enclosure and public two-level connection; exact bay, floor datums and passage estimated';
 layout.panoramaRegistration={sources:['U02','A13','I19','V05'],confidence:'Entrance-side relation supported; exact dimensions, floor heights and connections estimated',
  stage:'Integrated registration study; facade/window section reconciliation pending',
  matrix:frontageMatrix.toArray(),transformedParts:transformed.length,
  windowSection:'Unresolved: uniform facade tiers do not match photographed low-sill tall windows; do not infer a new floor datum from those estimated tiers',
  barRelation:'Long counter across window wall, DJ at opposite end; observed I19 views06/07/15/16',
  stairRoute:stairRoute.map(pointObject),
  mainApproach:[viewpoints.berghain.position,{x:8.3,y:5.45,z:viewpoints.berghain.position.z},{x:8.3,y:5.45,z:5.8},...stairRoute.map(pointObject)],
  toiletRoute,loungeRoute,smokingRoute,
  smokingConnection:'Two-level public link supported by architect; hall-edge passage footprint and elevations estimated',
  ordinaryToilets:'Distinct from ground cloakroom WC, main Klo and unregistered FLINTA room',
  counterWall:counterWall(layout),
  stairClearance:{retired,sources:['I23'],confidence:'One unregistered grid beam retired from the occupied stair; exact structural arrangement remains estimated'},
  backstage:'No new room or private connection'};
 reconcilePanoramaSection(layout,viewpoints);
}
