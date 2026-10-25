import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {panoramaWorldPoint} from './panorama-registration.mjs';

// Karhard G21/G23 register the hall, the narrow Panorama stair and the
// longitudinal glazed bar together. Only that relative arrangement is known;
// this is a fitted study, not a surveyed compass registration.
const origin=panoramaWorldPoint([0,0,0]);
const frame=new THREE.Matrix4().makeRotationY(Math.PI/2).setPosition(...origin);
const barFrame=new THREE.Matrix4().makeTranslation(0,0,1.3).multiply(frame);
const boothFrame=new THREE.Matrix4().makeTranslation(0,0,-2.7).multiply(frame);
const frontStackFrame=new THREE.Matrix4().makeTranslation(2.4,0,.4).multiply(frame);
const panoramaStackFrame=new THREE.Matrix4().makeTranslation(0,0,-.45).multiply(frame);
// Move the complete inferred wall-mounted satellite, including its bracket,
// clear of the widened lower-flight approach without entering the red recess.
const eisbarSatelliteFrame=new THREE.Matrix4().makeTranslation(0,0,.55).multiply(frame);
const inverse=frame.clone().invert(),barInverse=barFrame.clone().invert();
const point=(p,m)=>new THREE.Vector3(...p).applyMatrix4(m).toArray();
const object=p=>({x:p[0],y:p[1],z:p[2]});
export const mainHallWorldPoint=p=>point(p,frame);
export const mainBarWorldPoint=p=>point(p,barFrame);
export const mainHallOriginalPoint=p=>object(point([p.x,p.y,p.z],inverse));
export const mainBarOriginalPoint=p=>object(point([p.x,p.y,p.z],barInverse));
export const mainHallSidePiers=[-8.75,7.6].flatMap(z=>[-17.1,-8.4,.3,7.5].map(columnX=>[
 z>0?(columnX===7.5?5.1:columnX===.3?-1.2:columnX):columnX,z]));
const floorNames=new Set(['Berghain dance floor','western first-floor passage']);
const isBar=p=>/^main-(?:bar-|long-bar)/.test(p.fixture??p.id??'')||
 /^(?:Architecture )?Eisbar /.test(p.name??'')||/^main detail glass-wall radiator/.test(p.name??'');
const isBooth=p=>/^main DJ |^main detail booth /.test(p.name??'');
const moves=p=>isBar(p)||isBooth(p)||floorNames.has(p.name)||
 /^(?:Klo |WC |main stair$|main upper |main intermediate |Architecture (?:main |closed old main |east gallery |foyer ))/.test(p.name??'')||
 /^main-/.test(p.equipment??'')||/^main-(?:stack|subwall|satellite)/.test(p.name??'')||
 /^(?:klo-|wc-)/.test(p.fixture??p.id??'')||p.artwork==='marr-together'||
 p.balustrade==='foyer-gallery-west'||p.id==='foyer-gallery-west'||
 (p.mainHallDetail&&!p.name.startsWith('main detail foyer'));
const frontStack=p=>/^main-stack-2/.test(p.equipment??p.name??p.id??'');
const panoramaStack=p=>/^main-stack-1/.test(p.equipment??p.name??p.id??'');
const eisbarSatellite=p=>/^main-satellite-1(?: |$)/.test(p.equipment??p.name??p.id??'');
const matrixFor=p=>frontStack(p)?frontStackFrame:panoramaStack(p)?panoramaStackFrame:eisbarSatellite(p)?eisbarSatelliteFrame:isBar(p)?barFrame:isBooth(p)?boothFrame:frame;
const polygon=p=>p.polygon??[[p.x[0],p.z[0]],[p.x[1],p.z[0]],[p.x[1],p.z[1]],[p.x[0],p.z[1]]];
function bounds(p,poly){
 p.polygon=poly;p.x=[Math.min(...poly.map(q=>q[0])),Math.max(...poly.map(q=>q[0]))];
 p.z=[Math.min(...poly.map(q=>q[1])),Math.max(...poly.map(q=>q[1]))];
}
function footprint(p,m){bounds(p,polygon(p).map(([x,z])=>{const q=point([x,0,z],m);return[q[0],q[2]];}));}
function transform(p,m){
 if(p.matrix){p.matrix=m.clone().multiply(new THREE.Matrix4().fromArray(p.matrix)).toArray();p.center=p.matrix.slice(12,15);}
 else if(p.center)p.center=point(p.center,m);
 for(const key of ['start','end','anchor','position'])if(Array.isArray(p[key]))p[key]=point(p[key],m);
 if(p.displayBounds){
  const b=p.displayBounds,points=[];
  for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])points.push(point([x,y,z],m));
  p.displayBounds={min:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))};
 }
}

// The screen terminates at concrete faces. Cut its panes and steel members
// together with their solids; a pier must not merely hide an uncut glass sheet.
function fitPierInterfaces(layout){
 const piers=layout.solids.filter(s=>s.name==='Hall fit side frame pier'&&s.z[0]<0);
 const replacements=new Map();
 const extent=p=>[0,1,2].map(i=>{
  const radius=[0,4,8].reduce((sum,j)=>sum+Math.abs(p.matrix[j+i])*.5,0);
  return[p.center[i]-radius,p.center[i]+radius];
 });
 const piece=(p,x,y,z)=>{
  const center=[x,y,z].map(a=>(a[0]+a[1])/2),size=[x,y,z].map(a=>a[1]-a[0]);
  return {...p,center,size,matrix:new THREE.Matrix4().makeScale(...size).setPosition(...center).toArray()};
 };
 for(const p of layout.parts){
  const screen=p.fixture==='main-bar-glass-screen'||p.name.startsWith('Hall fit glass terminal');
  const roof=p.name==='main-bar-interior-facade roof cross-beam';
  const landingGuard=p.name.startsWith('Architecture Eisbar intermediate middle');
  if(!screen&&!roof&&!landingGuard)continue;
  const [x,y,z]=extent(p),cuts=piers.filter(s=>x[1]>s.x[0]&&x[0]<s.x[1]&&z[1]>s.z[0]&&z[0]<s.z[1]);
  if(!cuts.length)continue;
  if(landingGuard){
   // Concrete replaces the middle of this landing guard; steel rails end at
   // the two concrete faces and embedded posts are retired with their solids.
   if(p.name.endsWith('post')){replacements.set(p,[]);continue;}
   let spans=[z];
   for(const pier of cuts)spans=spans.flatMap(([a,b])=>
    [[a,Math.min(b,pier.z[0])],[Math.max(a,pier.z[1]),b]].filter(([lo,hi])=>hi-lo>1e-6));
   replacements.set(p,spans.map(span=>piece(p,x,y,span)));continue;
  }
  if(roof){
   // Roof cross members end against the bar-facing concrete surface.
   const end=Math.min(z[1],...cuts.map(s=>s.z[0]));
   replacements.set(p,end>z[0]?[piece(p,x,y,[z[0],end])]:[]);continue;
  }
  if(p.shape==='cylinder'){replacements.set(p,[]);continue;}
  let spans=[x];
  for(const s of cuts)spans=spans.flatMap(([a,b])=>
   [[a,Math.min(b,s.x[0])],[Math.max(a,s.x[1]),b]].filter(([lo,hi])=>hi-lo>1e-6));
  replacements.set(p,spans.map(span=>piece(p,span,y,z)));
 }
 layout.parts=layout.parts.flatMap(p=>replacements.get(p)??[p]);
 layout.solids=layout.solids.flatMap(s=>{
  const pieces=replacements.get(s.renderPart);if(!pieces)return[s];
  return pieces.map(p=>{const [x,y,z]=extent(p);return {...s,renderPart:p,x,y,z,
   polygon:[[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]]};});
 });
 return replacements.size;
}

// Fit the photographed open volume and its boundary frames. The original
// uniform grid was a placeholder, not evidence of continuous real columns.
// Keep the ground supports and the separate, already registered front wing.
function fitSection(layout){
 const retired=[],changed=new Set();
 const oldGuard=p=>p.balustrade==='foyer-gallery-west'||/Architecture (closed old main opening|east gallery remainder)/.test(p.name);
 function rebox(p,c,size){p.center=c;p.size=size;p.matrix=new THREE.Matrix4().makeScale(...size).setPosition(...c).toArray();p.hallSectionChanged=true;changed.add(p);}
 layout.parts=layout.parts.filter(p=>{
  if(oldGuard(p)){retired.push(p);return false;}
  if(p.name==='load-bearing column'&&p.center[2]<7.4){
   // Ground-height remnants keep the existing contacts at the first slab.
   rebox(p,[p.center[0],2.55,p.center[2]],[p.size[0],5,p.size[2]]);
  }
  if((p.name==='structural beam'||p.name==='retained bar-boundary beam')&&p.center[1]>6&&p.center[1]<18){
   const end=p.center[2]+p.size[2]/2;
   if(end<=7.4){retired.push(p);return false;}
   rebox(p,[p.center[0],p.center[1],(7.4+end)/2],[p.size[0],p.size[1],end-7.4]);
  }
  if(p.name==='structural beam'&&p.center[1]<6&&p.center[0]>8.1){
   const end=p.center[2]+p.size[2]/2;
   rebox(p,[p.center[0],p.center[1],(8.1+end)/2],[p.size[0],p.size[1],end-8.1]);
  }
  // The relocated gallery frame follows the widened edge, preserving full
  // contact above the retained Säule capitals instead of exposing their tops.
  if(p.foyerFrame||p.name.startsWith('Architecture foyer radiator')){transform(p,new THREE.Matrix4().makeTranslation(.65,0,0));changed.add(p);}
  // The photographed Eisbar relief/window belongs to its own end bay,
  // behind the glazed separation, rather than over the DJ-wall port pair.
  if(/^Architecture Eisbar (relief panel|circular relief|high window|window)/.test(p.name)){
   transform(p,new THREE.Matrix4().makeTranslation(0,0,-3.5));changed.add(p);
  }
  return true;
 });
 const removed=new Set(retired);
 layout.balustrades=layout.balustrades.filter(b=>b.id!=='foyer-gallery-west');
 layout.solids=layout.solids.filter(s=>!removed.has(s.renderPart)&&!oldGuard(s));
 for(const s of layout.solids)if(changed.has(s.renderPart)){
  const p=s.renderPart,m=p.matrix;bounds(s,[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[m[12]+m[0]*x+m[8]*z,m[14]+m[2]*x+m[10]*z]));
  s.y=[p.center[1]-p.size[1]/2,p.center[1]+p.size[1]/2];
 }
 // Preserve prior instance tones when extending an existing material batch.
 const batches=new Map();for(const p of layout.parts){const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
 for(const batch of batches.values())batch.forEach((p,i)=>{p.instanceTone??=.84+((i*193+batch.length*37)%101)/625;});
 function box(name,center,size,material='concrete',solid=true){
  const matrix=new THREE.Matrix4().makeScale(...size).setPosition(...center).toArray();
  const p={name:'Hall fit '+name,section:'interior',shape:'box',material,center,size,matrix,instanceTone:.94,hallSection:true};layout.parts.push(p);
  if(solid)layout.solids.push({name:p.name,renderPart:p,x:[center[0]-size[0]/2,center[0]+size[0]/2],y:[center[1]-size[1]/2,center[1]+size[1]/2],z:[center[2]-size[2]/2,center[2]+size[2]/2]});return p;
 }
 function slab(name,x,z){
  const floor={name:'Hall fit '+name,x,z,y:5.45,polygon:[[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]]};layout.floors.push(floor);
  box(name,[(x[0]+x[1])/2,5.25,(z[0]+z[1])/2],[x[1]-x[0],.4,z[1]-z[0]],'floor');
 }
 slab('gallery edge contact strip',[7.3,8.1],[-14.6,21.4]);
 // U02 places the public sanitary/front wing beside the smoking attachment.
 // This estimated full wing remains outside the central foyer void.
 slab('front public wing',[7.3,18.65],[8.1,21.4]);
 function guard(name,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),count=Math.ceil(length/.13);
  for(const y of [5.57,6.53])box(name+' rail',[(a[0]+b[0])/2,y,(a[1]+b[1])/2],[Math.abs(dx)||.045,.045,Math.abs(dz)||.045],'steel');
  for(let i=0;i<=count;i++)box(name+' picket',[a[0]+dx*i/count,5.99,a[1]+dz*i/count],[.025,1.04,.025],'steel');
 }
 guard('gallery bar side',[8.1,-14.6],[8.1,-9.1]);
 guard('gallery central',[8.1,-6.35],[8.1,8.1]);
 guard('front wing void edge',[8.1,8.1],[18.65,8.1]);
 // Set the glazed-side concrete line behind its hall-facing surface, leaving
 // full body clearance on the adjacent upper Eisbar flight. Set the other
 // line 0.2 m back to clear the complete Panorama tread edges. These fitting
 // offsets are estimated; all piers retain their visible 0.8 m section.
 // Ground piers support the slab. The source-visible upper frame is a
 // separate fitted assembly; its unseen construction is not reconstructed.
 for(const z of [-8.75,7.6]){
  box('long side head',[-4.8,16.15,z],[26.3,.8,.8]);
  for(const [x] of mainHallSidePiers.filter(p=>p[1]===z)){
   box('side frame pier',[x,12.725,z],[.8,14.55,.8]);
   for(const sign of [-1,1]){
    const p=box('side frame haunch',[x+sign*.8,15.4,z],[.8,.7,.8]);p.shape='saule-corbel';
    if(sign<0)p.matrix=new THREE.Matrix4().makeRotationY(Math.PI).scale(new THREE.Vector3(...p.size)).setPosition(...p.center).toArray();
   }
  }
 }
 // The DJ wall's closed, shallow red recess does not create a private route.
 const wallX=-18.85,z0=-9.1,z1=7.4,r0=-5.75,r1=-2.25,low=5.9,high=9.4;
 box('DJ wall left',[wallX,12.575,(r1+z1)/2],[.14,14.25,z1-r1],'darkConcrete');
 box('DJ wall right',[wallX,12.575,(z0+r0)/2],[.14,14.25,r0-z0],'darkConcrete');
 box('DJ recess head',[wallX,(high+19.7)/2,(r0+r1)/2],[.14,19.7-high,r1-r0],'darkConcrete');
 box('DJ recess sill',[wallX,(5.45+low)/2,(r0+r1)/2],[.14,low-5.45,r1-r0],'darkConcrete');
 box('DJ recess closed backing',[-18.98,(low+high)/2,(r0+r1)/2],[.035,high-low,r1-r0],'rubber');
 for(let i=0;i<35;i++)box('DJ recess curtain fold',[-18.94+(i%2)*.025,(low+high)/2,r0+.05+i*.1],[.035,high-low-.08,.105],'kloRed',false);
 box('DJ recess ledge',[-18.7,low,(r0+r1)/2],[.4,.08,r1-r0+.14],'steel');
 box('DJ wall closed door',[-18.75,6.55,-7.0],[.055,2.2,.95],'pale');
 // Complete the observed glass-to-DJ-wall corner. Access stays around the
 // public front end; the extension is a visible physical separation.
 const screenZ=layout.mainBar.screenAnchor[2],start=-18.78,end=-12.1,n=8;
 const opening={x:[-18.48,-17.55],y:[8.75,11.1]};
 function glazing(name,c,size,material){
  const x=[c[0]-size[0]/2,c[0]+size[0]/2],y=[c[1]-size[1]/2,c[1]+size[1]/2];
  if(x[1]<=opening.x[0]||x[0]>=opening.x[1]||y[1]<=opening.y[0]||y[0]>=opening.y[1]){box(name,c,size,material);return;}
  const a=Math.max(x[0],opening.x[0]),b=Math.min(x[1],opening.x[1]),lo=Math.max(y[0],opening.y[0]),hi=Math.min(y[1],opening.y[1]);
  for(const [left,right,bottom,top]of [[x[0],a,y[0],y[1]],[b,x[1],y[0],y[1]],[a,b,y[0],lo],[a,b,hi,y[1]]])
   if(right-left>.001&&top-bottom>.001)box(name,[(left+right)/2,(bottom+top)/2,c[2]],[right-left,top-bottom,size[2]],material);
 }
 for(let i=0;i<=n;i++)glazing('glass terminal mullion',[start+(end-start)*i/n,10.8,screenZ],[.045,10.7,.045],'steel');
 for(let i=0;i<8;i++)glazing('glass terminal transom',[(start+end)/2,5.45+i*10.7/7,screenZ],[end-start,.035,.045],'steel');
 glazing('glass terminal pane',[(start+end)/2,10.8,screenZ],[end-start,10.7,.025],'mainBarGlass');
 for(const x of opening.x)box('Eisbar landing opening jamb',[x,9.925,screenZ],[.05,2.35,.05],'steel');
 box('Eisbar landing opening head',[-18.015,11.125,screenZ],[.98,.05,.05],'steel');
 const glazingFit=fitPierInterfaces(layout);
 return {sources:['A01','I23','U02'],retiredParts:retired.length,changedParts:changed.size,
  glazingFit,
  frame:'Open upper hall and long side frames supported by G21/G23; counts, sizes and hidden continuity estimated',
  frontWing:'Public floor fit beside Klo/upper lounge and fixed smoking stair; precise boundary estimated',
  recess:'Closed shallow scenic recess and closed door; destination unknown',
  eisbarOpening:'Estimated public opening at the existing fitted landing; opening position and dimensions not photo-established',
  smokingRoute:[{x:7.5,y:5.45,z:0},{x:7.5,y:5.45,z:8.6},{x:8.7,y:5.45,z:8.6},{x:8.7,y:5.45,z:10.25},...layout.architecturalCirculation.smoking.siteRoute]};
}

export function registerMainHall(layout,viewpoints){
 const moved=new Map();
 for(const p of layout.parts)if(moves(p)){const m=matrixFor(p);moved.set(p,m);transform(p,m);p.mainHallRegistered=true;}
 for(const s of layout.solids){
  const m=moved.get(s.renderPart)??(moves(s)?matrixFor(s):null);
  if(m)footprint(s,m);
 }
 for(const f of layout.floors)if(moves(f)){
  const m=matrixFor(f);footprint(f,m);
  if(f.rampAxis)f.rampAxis=f.rampAxis.map(([x,z])=>{const q=point([x,0,z],m);return[q[0],q[2]];});
 }
 for(const f of layout.fixtures)if(moves(f))transform(f,matrixFor(f));
 for(const b of layout.balustrades)if(moves(b))transform(b,frame);
 for(const c of layout.soundSystem.components)if(c.id.startsWith('main-')){
  c.matrix=matrixFor(c).clone().multiply(new THREE.Matrix4().fromArray(c.matrix)).toArray();c.position=c.matrix.slice(12,15);
 }
 for(const id of ['berghain','klo','toilets','eisbar']){
  const v=viewpoints[id];v.position=object(point([v.position.x,v.position.y,v.position.z],id==='eisbar'?barFrame:frame));v.yaw+=Math.PI/2;
 }
 const bar=layout.mainBar;
 for(const key of ['counterAnchor','screenAnchor'])bar[key]=point(bar[key],barFrame);
 const facade=bar.interiorFacade;
 facade.bayCenters=facade.bayCenters.map(p=>point(p,barFrame));facade.roof.center=point(facade.roof.center,barFrame);
 for(const c of facade.roof.coffers)footprint(c,barFrame);
 for(const light of facade.practicalLighting.lights)for(const key of ['position','target'])light[key]=point(light[key],barFrame);
 const circulation=layout.architecturalCirculation;
 const route=(points,m)=>points.map(p=>object(point([p.x,p.y,p.z],m)));
 circulation.mainStair.siteRoute=route(circulation.mainStair.siteRoute,frame);
 circulation.eisbar.siteGuestRoute=route(circulation.eisbar.siteGuestRoute,barFrame);
 circulation.eisbar.siteUpperRoute=route(circulation.eisbar.siteUpperRoute,barFrame);
 circulation.eisbar.mainApproach=[viewpoints.berghain.position,
  {...circulation.eisbar.siteGuestRoute[0],z:viewpoints.berghain.position.z},
  circulation.eisbar.siteGuestRoute[0]];
 layout.kloBar.barAnchor=point(layout.kloBar.barAnchor,frame);
 circulation.foyerFrame.registration={matrix:frame.toArray(),additionalWorldOffset:[.65,0,0],
  includes:'All gallery-frame parts and the complete mounted radiator; author fields retain construction coordinates'};
 circulation.wardrobeConnection.siteRoute=[...circulation.wardrobeConnection.siteRoute.slice(0,2),
  {x:4,y:.05,z:15.6164},{x:4,y:.05,z:-4.18},circulation.mainStair.siteRoute[0]];
 circulation.wardrobeConnection.registration='Retained ground doorway linked to the fitted main stair through the public foyer; path estimated';
 circulation.mainStair.riseRelation.registration='Joint hall/Panorama relation from G21/G23; absolute registration and dimensions estimated';
 layout.panoramaRegistration.mainApproach=[viewpoints.berghain.position,{x:7.5,y:5.45,z:viewpoints.berghain.position.z},
  {x:7.5,y:5.45,z:5.8},...layout.panoramaRegistration.stairRoute];
 const section=fitSection(layout);
 layout.mainHallRegistration={sources:['A01','I23','U02'],matrix:frame.toArray(),barMatrix:barFrame.toArray(),section,
  transformedParts:moved.size,stage:'Source-informed fitted study; dimensions and hidden structure unresolved',
  relation:'Panorama stair left, glass-sided bar right, opposing main switchback at foyer void',
  booth:'Offset toward the glazed-bar side; exact offset and recess dimensions estimated',
  ground:'Admission, wardrobe, quiet WC, Lab and Säule retained as the initial fit hypothesis',
  open:['Unsurveyed dimensions and hidden structural continuity','Exact contemporary room boundaries and private destinations'],
  backstage:'No inferred private room or connection; photographed maintenance access does not establish backstage'};
}
