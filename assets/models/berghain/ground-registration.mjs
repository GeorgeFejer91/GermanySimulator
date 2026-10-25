import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';
import {fitSauleCeiling} from './saule-ceiling.mjs';

// Relative topology from V01/V15/V16/V18; every metric below is a fitted
// hypothesis. This is not a recovered or measured plan of the operating club.
const datum=.05,balcony=2.70;
export function groundRoomAt(p){
 if(p.y<-.1||p.y>balcony+.3||p.x<-18.7||p.x>7.3||p.z<-11.5||p.z>10.9)return null;
 if(p.x>=-11&&p.x<=1&&p.z>=6.1)return p.y>2.5?'sauleBalcony':'sauleWC';
 if(p.y<.3&&p.x>=-9&&p.x<=1&&p.z<-4.5)return 'sauleBar';
 return 'saule';
}
const oldCorner=studyToSite({x:-21.5,y:0,z:-21.5});
const labFrame=new THREE.Matrix4().makeRotationY(Math.PI/2)
  .setPosition(-18.5-oldCorner.z,0,-15.45+oldCorner.x);
const point=(p,m)=>new THREE.Vector3(...p).applyMatrix4(m).toArray();
const object=p=>({x:p[0],y:p[1],z:p[2]});
const extent=(points,i)=>[Math.min(...points.map(p=>p[i])),Math.max(...points.map(p=>p[i]))];
export const groundLabPoint=p=>point(p,labFrame);
export const groundLabPolygon=[[-21.5,-21.5],[-4,-21.5],[-4,9.4],[-21.5,9.4]].map(([x,z])=>{
 const p=studyToSite({x,y:0,z}),q=groundLabPoint([p.x,0,p.z]);return[q[0],q[2]];
});

export function createGroundGeometries(){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,-.5, .5,-.5,-.5, -.5,-.5,.5, -.5,.5,-.5, .5,.5,-.5, -.5,.5,.5],3));
 g.setIndex([0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0]);g.computeVertexNormals();
 return {'ground-slab-triangle':g};
}
function triangleFloor(layout,name,polygon,y,material='floor',section='interior'){
 for(let i=1;i<polygon.length-1;i++){
  const [a,b,c]=[polygon[0],polygon[i],polygon[i+1]],u=[b[0]-a[0],b[1]-a[1]],v=[c[0]-a[0],c[1]-a[1]];
  if(Math.abs(u[0]*v[1]-u[1]*v[0])<1e-8)continue;
  const center=[a[0]+(u[0]+v[0])/2,y-.2,a[1]+(u[1]+v[1])/2];
  const p={name,groundFit:true,section,shape:'ground-slab-triangle',material,center,size:[Math.hypot(...u),.4,Math.hypot(...v)],
   matrix:[u[0],0,u[1],0,0,.4,0,0,v[0],0,v[1],0,...center,1],instanceTone:.94};layout.parts.push(p);
  const tri=[a,b,c],x=extent(tri,0),z=extent(tri,1);
  layout.solids.push({name,groundFit:true,renderPart:p,polygon:tri,x,z,y:[y-.4,y]});
  layout.floors.push({name,groundFit:true,polygon:tri,x,z,y});
 }
}
function clip(poly,axis,limit,less){
 const result=[];for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-limit)*(less?1:-1),db=(b[axis]-limit)*(less?1:-1);
  if(da<=1e-9)result.push(a);
  if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);result.push(a.map((n,k)=>n+(b[k]-n)*t));}
 }return result;
}
function relocateSanitaryOpening(layout){
 const o=layout.labOratory.sanitaryOpening;
 const old=[[o.x[0],o.z[0]],[o.x[1],o.z[0]],[o.x[1],o.z[1]],[o.x[0],o.z[1]]].map(([x,z])=>{const p=studyToSite({x,y:0,z});return[p.x,p.z];});
 triangleFloor(layout,'Ground fit former Lab pit infill',old,datum);
 const moved=old.map(([x,z])=>{const p=groundLabPoint([x,0,z]);return[p[0],p[2]];});
 const x=extent(moved,0),z=extent(moved,1);
 const cut=layout.floors.filter(f=>(f.name.startsWith('forecourt')||f.name==='Halle ground')&&f.x[1]>x[0]&&f.x[0]<x[1]&&f.z[1]>z[0]&&f.z[0]<z[1]);
 const names=new Set(cut.map(f=>f.name));layout.parts=layout.parts.filter(p=>!names.has(p.name));layout.solids=layout.solids.filter(s=>!names.has(s.name));layout.floors=layout.floors.filter(f=>!cut.includes(f));
 for(const f of cut){
  const p=f.polygon,mid=clip(clip(p,1,z[0],false),1,z[1],true);
  const pieces=[clip(p,1,z[0],true),clip(p,1,z[1],false),clip(mid,0,x[0],true),clip(mid,0,x[1],false)];
  for(const poly of pieces.filter(p=>p.length>=3))triangleFloor(layout,f.name,poly,f.y,f.name.startsWith('forecourt')?'ground':'floor',f.name.startsWith('forecourt')?'site':'interior');
 }
 layout.labOratory.registration.sanitaryOpening={polygon:moved,x,z};
}

function transformPart(p,m){
 p.groundFit=true;
 if(p.matrix){p.matrix=new THREE.Matrix4().multiplyMatrices(m,new THREE.Matrix4().fromArray(p.matrix)).toArray();p.center=p.matrix.slice(12,15);}
 else if(p.start){p.start=point(p.start,m);p.end=point(p.end,m);}
 else {p.center=point(p.center,m);p.matrix=new THREE.Matrix4().multiplyMatrices(m,new THREE.Matrix4().makeScale(...p.size).setPosition(...p.center)).toArray();}
}
function transformFootprint(s,m){
 s.groundFit=true;
 const polygon=s.polygon??[[s.x[0],s.z[0]],[s.x[1],s.z[0]],[s.x[1],s.z[1]],[s.x[0],s.z[1]]];
 s.polygon=polygon.map(([x,z])=>{const q=point([x,0,z],m);return[q[0],q[2]];});
 s.x=extent(s.polygon,0);s.z=extent(s.polygon,1);
 if(s.rampAxis)s.rampAxis=s.rampAxis.map(([x,z])=>{const p=point([x,0,z],m);return[p[0],p[2]];});
}
function setVertical(p,bottom,top){
 p.groundFit=true;
 p.center[1]=(bottom+top)/2;p.size[1]=top-bottom;p.matrix[5]=top-bottom;p.matrix[13]=p.center[1];
}
function syncSolid(s){
 const p=s.renderPart;if(!p?.matrix)return;
 const m=p.matrix,polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[m[12]+m[0]*x+m[8]*z,m[14]+m[2]*x+m[10]*z]);
 s.polygon=polygon;s.x=extent(polygon,0);s.z=extent(polygon,1);
 const h=(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))/2;s.y=[m[13]-h,m[13]+h];
}
function boxAPI(layout){
 function box(name,center,size,material='concrete',solid=true,shape='box'){
  const p={name:'Ground fit '+name,groundFit:true,section:'interior',shape,material,center,size,
   matrix:new THREE.Matrix4().makeScale(...size).setPosition(...center).toArray(),instanceTone:.94};layout.parts.push(p);
  if(solid){const s={name:p.name,groundFit:true,renderPart:p};syncSolid(s);layout.solids.push(s);}return p;
 }
 function slab(name,x,z,y,thickness=.2,material='floor'){
  const p=box(name,[(x[0]+x[1])/2,y-thickness/2,(z[0]+z[1])/2],[x[1]-x[0],thickness,z[1]-z[0]],material);
  const s=layout.solids.at(-1),f={name:p.name,groundFit:true,polygon:s.polygon,x:s.x,z:s.z,y};layout.floors.push(f);return f;
 }
 function rail(name,a,b,coverageHalfWidth=.035){
  const horizontal=Math.hypot(b[0]-a[0],b[2]-a[2]),count=Math.ceil(horizontal/1.3);
  for(let i=0;i<=count;i++){
   const c=a.map((v,k)=>v+(b[k]-v)*i/count);c[1]+=.53;box(name+' post',c,[.045,1.06,.045],'steel');
  }
  for(const h of [.18,.56,1.06]){
   const c=a.map((v,k)=>(v+b[k])/2);c[1]+=h;
   const direction=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),length=direction.length();
   const p=box(name+' rail',c,[length,.045,.045],'steel',false);
   p.matrix=new THREE.Matrix4().compose(new THREE.Vector3(...c),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),direction.normalize()),new THREE.Vector3(...p.size)).toArray();
  }
  // Continuous coverage prevents a body slipping between decorative rails.
  const u=[(b[0]-a[0])/horizontal,(b[2]-a[2])/horizontal],n=[-u[1]*coverageHalfWidth,u[0]*coverageHalfWidth];
  const polygon=[[a[0]+n[0],a[2]+n[1]],[b[0]+n[0],b[2]+n[1]],[b[0]-n[0],b[2]-n[1]],[a[0]-n[0],a[2]-n[1]]];
  layout.solids.push({name:'Ground fit '+name+' coverage',groundFit:true,polygon,x:extent(polygon,0),z:extent(polygon,1),y:[Math.min(a[1],b[1])+.1,Math.max(a[1],b[1])+1.1]});
 }
 function stairs(name,x0,x1,z,width){
  const count=18,run=Math.abs(x1-x0),rise=balcony-datum,sign=Math.sign(x1-x0),x=[Math.min(x0,x1),Math.max(x0,x1)],zs=[z-width/2,z+width/2];
  const f={name:'Ground fit '+name,groundFit:true,x,z:zs,polygon:[[x[0],zs[0]],[x[1],zs[0]],[x[1],zs[1]],[x[0],zs[1]]],y:datum,endY:balcony,rampAxis:[[x0,z],[x1,z]]};layout.floors.push(f);
  for(let i=0;i<count;i++){
   const h=datum+rise*(i+1)/count,cx=x0+sign*run*(i+.5)/count;
   box(name+' tread',[cx,h-.075,z],[run/count,.15,width],'steel');
   Object.assign(layout.solids.at(-1),{undersideOnly:true,treadFloor:f});
  }
  // Reach 1 mm inside the supported tread strip so the existing full-body
  // recovery candidate also has floor support after an invalid guard re-entry.
  for(const side of [-1,1])rail(name,[x0,datum,z+side*(width/2+.04)],[x1,balcony,z+side*(width/2+.04)],.041);
  return {name:f.name,lower:{x:x0-sign*.5,y:datum,z},upper:{x:x1+sign*.5,y:balcony,z},width,run,rise,risers:count};
 }
 return{box,slab,rail,stairs};
}

function pinTones(layout){
 const batches=new Map();for(const p of layout.parts){const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
 for(const ps of batches.values())ps.forEach((p,i)=>{p.instanceTone??=.84+((i*193+ps.length*37)%101)/625;});
}

function relocateLab(layout,api,views){
 const retired=new Set(layout.parts.filter(p=>/^Lab (?:raised steel-glass gate|gate track|gate upper head|concrete soffit|low concrete beam)/.test(p.name)||p.name==='Säule glass partition left'));
 layout.parts=layout.parts.filter(p=>!retired.has(p));layout.solids=layout.solids.filter(s=>!retired.has(s.renderPart));
 const moves=p=>/^Lab /.test(p.name??'')||/^lab-/.test(p.fixture??p.id??'');
 const parts=new Set(layout.parts.filter(moves)),trimmed=new Set();
 // The retained Halle slab is lower than the previous invented Lab soffit.
 // Adapt only estimated tall enclosure/mount details, preserving fixture scale.
 for(const p of parts){
  if(p.name==='Lab front room partition'){setVertical(p,datum,3.76);trimmed.add(p);}
  if(p.name==='Lab wall band'&&p.center[1]>3){setVertical(p,3.35,3.76);trimmed.add(p);}
  if(p.fixture==='lab-insulator-canopy'){p.matrix[13]-=.4;p.center[1]-=.4;}
  if(p.name==='Lab retained service run')transformPart(p,new THREE.Matrix4().makeTranslation(0,-.2,0));
  if(p.name==='Lab historic lintel'){p.matrix[13]-=.03;p.center[1]-=.03;}
  transformPart(p,labFrame);
 }
 for(const s of layout.solids)if(moves(s)||parts.has(s.renderPart)){
  // Rigidly move the existing contact envelope, including cast relief and
  // non-box fixture margins. Rebuilding it from a unit box loses those forms.
  transformFootprint(s,labFrame);
  if(trimmed.has(s.renderPart)){const p=s.renderPart;s.y=[p.center[1]-p.size[1]/2,p.center[1]+p.size[1]/2];}
  else if(s.renderPart?.fixture==='lab-insulator-canopy')s.y=s.y.map(y=>y-.4);
 }
 for(const f of layout.floors)if(/^Lab /.test(f.name))transformFootprint(f,labFrame);
 for(const f of layout.fixtures.filter(moves)){f.anchor=groundLabPoint(f.anchor);f.registration='Provisional ground fit behind Säule bar; footprint and dimensions unmeasured';}
 // Fit the intact photographed bank between retained transverse frames.
 // Exact room registration is unknown; fixture dimensions/contact stay intact.
 const bank=new Set(['lab-pipe-bar','lab-pipe-stool-0','lab-pipe-stool-1','lab-pipe-stool-2','lab-gauge-wall','lab-insulator-canopy']);
 const bankShift=new THREE.Matrix4().makeTranslation(0,0,-3.5);
 for(const p of parts)if(bank.has(p.fixture))transformPart(p,bankShift);
 for(const s of layout.solids)if(bank.has(s.fixture)||bank.has(s.renderPart?.fixture))transformFootprint(s,bankShift);
 for(const f of layout.fixtures)if(bank.has(f.id)){
  f.anchor=point(f.anchor,bankShift);f.registration+='; intact bar bank fitted 3.5m north to clear retained Halle beams';
  if(f.id==='lab-insulator-canopy')f.dimensions={...f.dimensions,lowestPoint:f.dimensions.lowestPoint-.4,mount:f.dimensions.mount-.4};
 }
 views.lab.position=object(groundLabPoint(Object.values(views.lab.position)));views.lab.yaw+=Math.PI/2;
 views.halle.position={x:3.5,y:datum,z:-36};
 const x=extent(groundLabPolygon,0),z=extent(groundLabPolygon,1);
 layout.labOratory.registration={matrix:labFrame.toArray(),polygon:groundLabPolygon,sources:['A12','V16','V18'],bankAdjustment:[0,0,-3.5],
  confidence:'Fitted behind-bar/boiler-house relation; exact footprint, floor datum and internal order unverified'};
 layout.labOratory.arrangement='Provisional lower boiler-house fit behind Säule bar; old western turbine-room fit retired';
 layout.labOratory.ceilingHeight=3.76;layout.labOratory.ceilingTop=3.9;layout.labOratory.minimumBeamUnderside=3.4;
 layout.labOratory.access='Room selector only in this ordinary-night fit; event connections remain physically closed, with unmeasured door registration';
 const {box}=api;
 // A closed event boundary is deliberate; Lab is not a permanently public
 // continuation of an ordinary Klubnacht. The viewer still offers its own view.
 box('Lab north boundary',[(x[0]+x[1])/2,1.905,z[0]],[x[1]-x[0],3.71,.16],'labWall');
 box('Lab south event boundary',[(x[0]+x[1])/2,1.905,z[1]],[x[1]-x[0],3.71,.16],'labWall');
 box('Lab event door',[3,1.22,z[1]+.09],[1.4,2.34,.06],'steel');
 // Existing photographed window surrounds remain along the historic facade;
 // the new private outline is kept explicitly separate from those observations.
 box('Lab fitted ceiling',[(x[0]+x[1])/2,3.83,(z[0]+z[1])/2],[x[1]-x[0],.14,z[1]-z[0]],'labWall');
}

function relocatePiers(layout,api){
 const originals=layout.fixtures.filter(f=>f.id.startsWith('saule-pier-'));
 const source=originals.map(f=>({fixture:f,parts:layout.parts.filter(p=>p.fixture===f.id)}));
 const removed=new Set(source.flatMap(s=>s.parts));
 for(const p of layout.parts)if(p.name==='Säule stage'||p.name==='Säule booth'||p.name==='Säule column light')removed.add(p);
 // Retire only the unsupported lower grid. Keep upper portions seated on the
 // existing slab and leave the foyer's actual frame/stair geometry untouched.
 for(const p of layout.parts.filter(p=>p.name==='load-bearing column'&&p.center[0]<7.3)){
  const top=p.center[1]+p.size[1]/2;
  if(top<=5.45)removed.add(p);else {setVertical(p,5.45,top);for(const s of layout.solids)if(s.renderPart===p)syncSolid(s);}
 }
 layout.parts=layout.parts.filter(p=>!removed.has(p));layout.solids=layout.solids.filter(s=>!removed.has(s.renderPart));
 layout.fixtures=layout.fixtures.filter(f=>!f.id.startsWith('saule-pier-'));
 let index=0;
 for(const x of [-12,-6,0,5])for(const z of [-2.9,2.9]){
  const template=source[z<0?4:1],anchor=[x,datum,z],id='saule-pier-'+index++;
  const frame=new THREE.Matrix4().makeTranslation(...anchor).multiply(new THREE.Matrix4().makeRotationY(Math.PI/2))
   .multiply(new THREE.Matrix4().makeTranslation(...template.fixture.anchor.map(v=>-v)));
  layout.fixtures.push({...template.fixture,id,anchor,confidence:'Paired pier form documented; eight-pier minimum from V01; fitted grid, dimensions and current count inferred'});
  for(const old of template.parts){
   const p={...old,fixture:id,name:old.name.replace(template.fixture.id,id),matrix:[...old.matrix],center:[...old.center],size:[...old.size]};
   transformPart(p,frame);layout.parts.push(p);const s={name:p.name,renderPart:p,groundFit:true};syncSolid(s);layout.solids.push(s);
  }
 }
 const {box}=api;
 box('Säule stage',[-17,.3,0],[2.7,.5,6],'rubber');
 box('Säule booth',[-16.75,1.16,0],[.9,1.22,3.8],'steel');
 Object.assign(layout.saule,{sources:['A15','I24','V01','V15','V16','V17'],pierCount:8,
  placement:'Four fitted pairs between end stage, opposite bar and WC/mezzanine band; coordinates inferred',
  remaining:'Measured footprint/grid, exact contemporary toilet inventory, outside entry, ceiling pockets and detailed services'});
}

function addSauleRooms(layout,api){
 const {box,slab,rail,stairs}=api;
 slab('Säule balcony',[-11,1],[6.1,10.9],balcony);
 const wallTop=balcony-.2,wallHeight=wallTop-datum,wallCenter=(wallTop+datum)/2;
 for(const x of [-11,1])box('Säule WC end wall',[x,wallCenter,8.5],[.14,wallHeight,4.8],'labWall');
 box('Säule WC rear wall',[-5,wallCenter,10.9],[12.14,wallHeight,.14],'labWall');
 // Three neutral fitted cubicles and a common wash passage. Sources locate a
 // FLINTA facility in the Säule zone, but do not identify which exact cubicle.
 for(const x of [-7,-3])box('Säule WC cubicle divider',[x,wallCenter,9.45],[.12,wallHeight,2.9],'labWall');
 for(const center of [-9,-5,-1]){
  for(const sign of [-1,1])box('Säule WC door jamb',[center+sign*1.225,wallCenter,8],[1.45,wallHeight,.12],'labWall');
  box('Säule WC door lintel',[center,(2.25+wallTop)/2,8],[1.0,wallTop-2.25,.12],'labWall');
  box('Säule WC door open',[center+.55,1.14,8.55],[.07,2.18,1.0],'steel');
  box('Säule WC pan',[center,.29,10.05],[.42,.48,.62],'stainless',true,'wc-bowl');
  box('Säule WC cistern',[center,.65,10.45],[.45,.32,.18],'pale');
  box('Säule WC basin',[center-1.25,.86,7.8],[.62,.18,.42],'stainless',true,'wc-bowl');
  box('Säule WC basin waste',[center-1.25,.42,7.8],[.04,.65,.04],'stainless');
  box('Säule WC tap stem',[center-1.25,1.02,7.94],[.035,.27,.035],'stainless');
  box('Säule WC tap spout',[center-1.25,1.145,7.84],[.035,.035,.23],'stainless');
  box('Säule WC flush plate',[center,.97,10.78],[.22,.27,.035],'stainless');
  box('Säule WC paper holder',[center+.65,.78,10.5],[.22,.2,.12],'steel');
 }
 rail('Säule balcony front',[-11,balcony,6.1],[1,balcony,6.1]);
 rail('Säule balcony rear',[-11,balcony,10.9],[1,balcony,10.9]);
 for(const x of [-11,1]){rail('Säule balcony end',[x,balcony,6.1],[x,balcony,8.65]);rail('Säule balcony return',[x,balcony,10.35],[x,balcony,10.9]);}
 const flights=[stairs('Säule west stair',-16.8,-11,9.5,1.6),stairs('Säule east stair',6.3,1,9.5,1.6)];
 for(const x of [-8,-3]){
  box('Säule balcony table',[x,balcony+.75,8.1],[1.7,.1,.75],'timber');
  for(const sign of [-1,1]){
   box('Säule balcony table leg',[x+sign*.66,balcony+.35,8.1],[.12,.7,.75],'timber');
   box('Säule balcony bench',[x,balcony+.43,8.1+sign*.8],[1.7,.1,.35],'timber');
   for(const end of [-.66,.66])box('Säule balcony bench leg',[x+end,balcony+.19,8.1+sign*.8],[.12,.38,.35],'timber');
  }
 }
 // Bar faces the dance floor; the staff aisle is behind it, with the conditional
 // Lab connection further north. The ribbed warm face follows I24's photograph.
 box('Säule bar body',[-4, .57,-8.5],[8.4,1.04,.95],'timber');
 box('Säule bar top',[-4,1.12,-8.45],[8.55,.12,1.1],'rubber');
 for(let i=0;i<70;i++)box('Säule bar rib',[-8.14+i*.12,.57,-7.955],[.035,.92,.04],'timber',false);
 box('Säule bar under-counter light',[-4,1.04,-7.96],[8.35,.025,.04],'warm',false);
 box('Säule bar back plinth',[-4,.4,-10.55],[8.4,.7,.55],'steel');
 box('Säule bar rear lining',[-4,1.5,-10.87],[8.4,2.9,.08],'timber');
 for(const x of [-6.8,-1.2]){
  box('Säule fridge case',[x,1.4,-10.5],[.85,1.4,.65],'steel');
  box('Säule fridge interior',[x,1.4,-10.17],[.72,1.24,.025],'warm',false);
  for(const y of [.88,1.17,1.46,1.75]){
   box('Säule fridge shelf',[x,y,-10.12],[.72,.025,.06],'steel',false);
   for(let i=0;i<5;i++)box('Säule fridge bottle',[x-.26+i*.13,y+.11,-10.1],[.055,.2,.055],'glass',false,'cylinder');
  }
  box('Säule fridge glass',[x,1.4,-10.04],[.76,1.26,.025],'groundGlass');
 }
 for(const y of [1.42,1.95,2.47]){
  box('Säule bottle shelf',[-4,y,-10.54],[3.7,.05,.35],'steel',false);
  for(let i=0;i<12;i++){
   const x=-5.62+i*.29,h=.22+(i%3)*.035;
   box('Säule backbar bottle',[x,y+h/2,-10.4],[.09,h,.09],i%4===0?'labOxide':'glass',false,'cylinder');
   box('Säule bottle neck',[x,y+h+.035,-10.4],[.038,.07,.038],'glass',false,'cylinder');
  }
 }
 // Photo I24 shows round seats on slender legs, not square pedestal blocks.
 for(let i=0;i<7;i++){
  const x=-7.15+i*1.05;
  box('Säule stool seat',[x,.81,-6.9],[.38,.07,.38],'timber',true,'cylinder');
  for(const dx of [-.13,.13])for(const dz of [-.13,.13])box('Säule stool leg',[x+dx,.415,-6.9+dz],[.03,.73,.03],'steel');
  const ring=box('Säule stool foot ring',[x,.3,-6.9],[.35,.35,.35],'steel',false,'ring');
  ring.matrix=new THREE.Matrix4().compose(new THREE.Vector3(...ring.center),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2),new THREE.Vector3(...ring.size)).toArray();
 }
 box('Säule bar upper glazing',[-4,3.69,-9.65],[8.4,2.04,.06],'groundGlass');
 for(let i=0;i<=7;i++)box('Säule bar upper mullion',[-8.2+i*1.2,3.69,-9.61],[.06,2.04,.08],'steel');
 for(const y of [2.67,3.69,4.71])box('Säule bar upper transom',[-4,y,-9.61],[8.4,.06,.08],'steel');
 for(let i=0;i<42;i++)box('Säule bar fine grille',[-8.1+i*.2,3.69,-9.6],[.012,2.0,.018],'steel',false);
 for(const [a,b]of [[-18.7,2],[4,7.3]])box('Säule rear glass',[(a+b)/2,2.4,-11.5],[b-a,4.7,.1],'groundGlass');
 box('Säule closed Lab connection',[3,1.3,-11.5],[2,2.5,.12],'steel');
 box('Säule Lab connection upper glass',[3,3.65,-11.5],[2,2.2,.1],'groundGlass');
 for(const [a,b]of [[-11.5,-1.5],[1.5,10.9]])box('Säule foyer glass',[7.3,2.4,(a+b)/2],[.1,4.7,b-a],'groundGlass');
 for(const z of [-11.5,-8,-4,-1.5,1.5,5,8,10.9])box('Säule foyer mullion',[7.3,2.4,z],[.07,4.7,.07],'steel');
 for(const y of [.12,2.6,4.71]){
  for(const [a,b]of [[-11.5,-1.5],[1.5,10.9]])box('Säule foyer transom',[7.3,y,(a+b)/2],[.07,.06,b-a],'steel');
 }
 layout.saule.rooms={sources:['V01','V09','V15','V16','V18'],confidence:'Relative arrangement supported; boundaries, dimensions and three neutral cubicles estimated',
  balconyHeight:balcony,headroom:4.75-balcony,slabClearance:5.05-balcony,stairs:flights,wc:{x:[-11,1],z:[6.1,10.9],floor:datum,cubicles:3,
   flinta:'Säule-zone presence supported by V09; exact enclosure and current inventory remain unassigned'},
  bar:{x:[-8.2,.2],z:[-11,-7.9],sources:['I24'],confidence:'Ribbed face, round stools, refrigerators, shelves and upper framed glass observed; inventory and dimensions estimated'},entry:{x:7.3,y:datum,z:0},
  labBoundary:'Closed event-dependent connection; inferred door registration, not a public backstage route'};
}

export function registerGround(layout,views){
 pinTones(layout);const api=boxAPI(layout);
 // The old inferred Lab/wardrobe screen crossed the newly fitted balcony.
 // Keep its actual wardrobe segment and the existing doorway in place.
 for(const p of layout.parts.filter(p=>p.name==='Public wardrobe glass north leaf')){
  p.groundFit=true;
  const m=p.matrix,start=m[14]-m[10]/2,end=m[14]+m[10]/2,t=(13.6-start)/(end-start),fraction=1-t;
  for(const axis of [0,1,2]){m[12+axis]+=m[8+axis]*t/2;m[8+axis]*=fraction;}
  p.center=m.slice(12,15);p.size[2]*=fraction;
  for(const solid of layout.solids)if(solid.renderPart===p)syncSolid(solid);
 }

 relocateLab(layout,api,views);relocateSanitaryOpening(layout);relocatePiers(layout,api);addSauleRooms(layout,api);
 views.saule.position={x:3,y:datum,z:0};views.saule.yaw=Math.PI/2;
 views.saule.sources=['A15','I24','V01','V15','V16'];views.saule.confidence='Fitted relative topology; unsurveyed dimensions and inventory';
 layout.mainHallRegistration.ground='Säule/WC/mezzanine/bar and Lab connection revised from V01/V15/V16/V18; absolute boundaries remain provisional';
 // Preserve the wardrobe door, but use the foyer outside the new glazed wall.
 const route=layout.architecturalCirculation.wardrobeConnection.siteRoute;
 layout.architecturalCirculation.wardrobeConnection.siteRoute=[...route.slice(0,2),{x:9,y:datum,z:15.6164},{x:9,y:datum,z:0},{x:9,y:datum,z:-2.2},{x:8.424688967975206,y:datum,z:-2.2},layout.architecturalCirculation.mainStair.siteRoute[0]];
 fitSauleCeiling(layout);
}
