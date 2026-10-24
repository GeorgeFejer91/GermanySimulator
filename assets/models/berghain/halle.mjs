import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

const ground=.05,upper=4.25,slab=.35,run=7.2,rise=4.2,width=2.4;
const retired=new Set(['Halle upper west outer','Halle upper west inner','Halle west upper landing',
 'Halle west south landing','Halle upper east','Halle upper north','Halle west stair','Halle west stair tread',
 'Halle west stair rail','Halle upper west rail','Halle upper east rail','Halle column','Halle roof beam','historic boiler hopper']);
const site=(x,z,y=ground)=>{const p=studyToSite({x,y,z});return [p.x,p.y,p.z];};
const point=p=>({x:p[0],y:p[1],z:p[2]});
const range=(points,axis)=>[Math.min(...points.map(p=>p[axis])),Math.max(...points.map(p=>p[axis]))];
const unit=new THREE.Vector3(...site(1,-33)).sub(new THREE.Vector3(...site(0,-33))).normalize();
const across=new THREE.Vector3(-unit.z,0,unit.x);

function meshPanel(){
 const vertices=[],indices=[],pitch=.095,half=.003;
 const clip=(slope,offset)=>{
  const ends=[];
  for(const x of [-.5,.5]){const y=slope*x+offset;if(y>=-.5&&y<=.5)ends.push([x,y]);}
  for(const y of [-.5,.5]){const x=(y-offset)/slope;if(x>-.5&&x<.5)ends.push([x,y]);}
  if(ends.length!==2)return;
  const [a,b]=ends,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length*half,ny=dx/length*half;
  const p=[[a[0]+nx,a[1]+ny,0],[b[0]+nx,b[1]+ny,0],[b[0]-nx,b[1]-ny,0],[a[0]-nx,a[1]-ny,0]];
  const base=vertices.length/3;for(const corner of p)vertices.push(...corner);
  for(const i of [0,1,2,0,2,3])indices.push(base+i);
 };
 // Bounded open lattice: integer offsets keep portable geometry cost deterministic.
 for(const slope of [-1,1])for(let i=-10;i<=10;i++)clip(slope,i*pitch);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

export function createHalleGeometries(){
 const corbelShape=new THREE.Shape();corbelShape.moveTo(-.5,-.5);corbelShape.lineTo(.5,.35);corbelShape.lineTo(.5,.5);corbelShape.lineTo(-.5,.5);corbelShape.closePath();
 const corbel=new THREE.ExtrudeGeometry(corbelShape,{depth:1,bevelEnabled:false}).translate(0,0,-.5);
 const waistShape=new THREE.Shape(),inset=.25/(rise+.25);
 waistShape.moveTo(-.5,-.5+inset);waistShape.lineTo(.5,.5);waistShape.lineTo(.5,.5-inset);waistShape.lineTo(-.5,-.5);waistShape.closePath();
 const waist=new THREE.ExtrudeGeometry(waistShape,{depth:1,bevelEnabled:false}).translate(0,0,-.5);
 const hopper=new THREE.CylinderGeometry(Math.SQRT1_2,Math.SQRT1_2*.15,1,4,1).rotateY(Math.PI/4).toNonIndexed();hopper.computeVertexNormals();
 return {'halle-mesh':meshPanel(),'halle-corbel':corbel,'halle-waist':waist,'halle-hopper':hopper};
}

function preserveAndRetire(layout){
 const groups=new Map(),affected=new Set();
 for(const p of layout.parts){
  const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);
  if(retired.has(p.name))affected.add(key);
 }
 for(const key of affected){const parts=groups.get(key);parts.forEach((p,i)=>{
  if(!retired.has(p.name))p.instanceTone??=.84+((i*193+parts.length*37)%101)/625;
 });}
 layout.parts=layout.parts.filter(p=>!retired.has(p.name));
 layout.solids=layout.solids.filter(p=>!retired.has(p.name));
 layout.floors=layout.floors.filter(p=>!retired.has(p.name));
}

function assembly(layout){
 function add(name,center,size,material='concrete',shape='box',solid=true,axes=[unit,across],role=name){
  const [u,v]=axes,matrix=[u.x*size[0],u.y*size[0],u.z*size[0],0,0,size[1],0,0,v.x*size[2],v.y*size[2],v.z*size[2],0,...center,1];
  const part={name:'Halle '+name,section:'halle',role,shape,material,center,size,matrix,instanceTone:.94};layout.parts.push(part);
  if(solid){
   const corners=[];for(const x of [-.5,.5])for(const z of [-.5,.5])corners.push([center[0]+matrix[0]*x+matrix[8]*z,center[2]+matrix[2]*x+matrix[10]*z]);
   const polygon=[corners[0],corners[2],corners[3],corners[1]];
   const extent=(Math.abs(matrix[1])+Math.abs(matrix[5])+Math.abs(matrix[9]))/2;
   layout.solids.push({name:part.name,halle:true,role,polygon,x:range(polygon,0),z:range(polygon,1),y:[center[1]-extent,center[1]+extent],renderPart:part});
  }
  return part;
 }
 function rectangle(name,x,z,y,thickness=slab,material='concrete',floor=false){
  const corners=[[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]].map(([a,b])=>site(a,b,y));
  const center=[0,1,2].map(axis=>corners.reduce((sum,p)=>sum+p[axis],0)/4);center[1]-=thickness/2;
  const u=new THREE.Vector3(...corners[1]).sub(new THREE.Vector3(...corners[0])),v=new THREE.Vector3(...corners[3]).sub(new THREE.Vector3(...corners[0]));
  const part=add(name,center,[u.length(),thickness,v.length()],material,'box',true,[u.clone().normalize(),v.clone().normalize()]);
  if(floor){
   const polygon=corners.map(p=>[p[0],p[2]]);layout.floors.push({name:part.name,halle:true,polygon,x:range(polygon,0),z:range(polygon,1),y});
  }
  return part;
 }
 function bar(name,a,b,thickness,material='steel',solid=false,role=name){
  const direction=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),center=a.map((v,i)=>(v+b[i])/2);
  const length=direction.length(),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),direction.normalize());
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...center),rotation,new THREE.Vector3(length,thickness,thickness)).toArray();
  const part={name:'Halle '+name,section:'halle',role,shape:'box',material,center,size:[length,thickness,thickness],matrix,instanceTone:.94};layout.parts.push(part);
  if(solid){
   const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(matrix));
   layout.solids.push({name:part.name,halle:true,role,renderPart:part,x:[bounds.min.x,bounds.max.x],y:[bounds.min.y,bounds.max.y],z:[bounds.min.z,bounds.max.z]});
  }
  return part;
 }
 function guard(name,start,end){
  const dx=end[0]-start[0],dz=end[2]-start[2],length=Math.hypot(dx,dz),u=new THREE.Vector3(dx/length,0,dz/length),v=new THREE.Vector3(-u.z,0,u.x);
  const count=Math.ceil(length/1.5),position=t=>start.map((n,i)=>n+(end[i]-n)*t);
  layout.halle.guards.push({name,start,end});
  for(let i=0;i<=count;i++){
   const p=position(i/count);p[1]+=.54;add(name+' post',p,[.045,1.08,.045],'steel','box',true,[u,v],'guard post');
  }
  for(let i=0;i<count;i++){
   const a=position(i/count),b=position((i+1)/count),center=a.map((n,k)=>(n+b[k])/2);center[1]+=.58;
   const part=add(name+' mesh',center,[length/count,.84,.018],'steel','halle-mesh',false,[u,v],'guard mesh');
   part.matrix[1]=b[1]-a[1];
   const horizontal=[u.x*length/count,u.z*length/count],polygon=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[
    center[0]+horizontal[0]*x/2+v.x*.03*z,center[2]+horizontal[1]*x/2+v.z*.03*z]);
   layout.solids.push({name:'Halle '+name+' guard coverage',halle:true,role:'guard coverage',polygon,x:range(polygon,0),z:range(polygon,1),y:[Math.min(a[1],b[1])+.12,Math.max(a[1],b[1])+1.1]});
  }
  for(const height of [.12,1.08])bar(name+' rail',start.map((n,i)=>n+(i===1?height:0)),end.map((n,i)=>n+(i===1?height:0)),.045,'steel',false,'guard rail');
 }
 return {add,rectangle,bar,guard};
}

function addFloors(layout,api){
 const {rectangle,guard}=api;
 rectangle('upper north slab',[-21.5,21.5],[-43.5,-36],upper,slab,'concrete',true);
 rectangle('upper south slab',[-21.5,21.5],[-30,-22.5],upper,slab,'concrete',true);
 for(const [i,x]of [[-21.5,-20],[-7.5,-5.5],[5.5,7.5],[20,21.5]].entries())rectangle('upper connecting strip '+i,x,[-36,-30],upper,slab,'concrete',true);
 for(const [i,x]of [[-20,-7.5],[-5.5,5.5],[7.5,20]].entries()){
  layout.halle.voids.push({name:['west','middle','east'][i],authorX:x,authorZ:[-36,-30],confidence:'Three openings documented; footprint and row orientation inferred'});
  for(const z of [-36,-30])guard('void '+i+' transverse guard',site(x[0],z,upper),site(x[1],z,upper));
  for(const edge of x){
   const landing=i===0&&edge===-7.5||i===2&&edge===7.5;
   const segments=landing?[[-36,-32.967],[-31.633,-30]]:[[-36,-30]];
   for(const [a,b]of segments)guard('void '+i+' side guard',site(edge,a,upper),site(edge,b,upper));
  }
 }
}

function addStair(layout,api,side){
 const {add,guard}=api,label=side<0?'west':'east',top=site(side*9.5,-32.3,upper),u=unit.clone().multiplyScalar(-side),v=new THREE.Vector3(-u.z,0,u.x);
 const bottom=top.map((n,i)=>n-u.getComponent(i)*run);bottom[1]=ground;
 const center=bottom.map((n,i)=>(n+top[i])/2),polygon=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[center[0]+u.x*x*run/2+v.x*z*width/2,center[2]+u.z*x*run/2+v.z*z*width/2]);
 const ramp={name:'Halle '+label+' stair',halle:true,polygon,x:range(polygon,0),z:range(polygon,1),y:ground,endY:upper,rampAxis:[[bottom[0],bottom[2]],[top[0],top[2]]]};
 layout.floors.push(ramp);
 add(label+' concrete waist',[center[0],(ground+upper)/2-.2125,center[2]],[run,rise+.25,width],'concrete','halle-waist',false,[u,v],'stair waist');
 for(let i=0;i<24;i++){
  const t=(i+.5)/24,p=bottom.map((n,axis)=>n+u.getComponent(axis)*run*t),height=ground+rise*t;
  p[1]=height-.0875;
  add(label+' closed concrete tread',p,[.3,.175,width],'pale','box',true,[u,v],'concrete tread');
  Object.assign(layout.solids.at(-1),{undersideOnly:true,treadFloor:ramp});
  const nosing=p.map((n,axis)=>n-u.getComponent(axis)*.13);nosing[1]=height+.003;
  add(label+' metal nosing',nosing,[.04,.006,width-.08],'steel','box',false,[u,v],'stair nosing');
  const a=bottom.map((n,k)=>n+u.getComponent(k)*run*i/24),b=bottom.map((n,k)=>n+u.getComponent(k)*run*(i+1)/24);
  const footprint=[[a[0]+v.x*width/2,a[2]+v.z*width/2],[b[0]+v.x*width/2,b[2]+v.z*width/2],[b[0]-v.x*width/2,b[2]-v.z*width/2],[a[0]-v.x*width/2,a[2]-v.z*width/2]];
  layout.solids.push({name:'Halle '+label+' waist underside',halle:true,role:'waist underside',polygon:footprint,x:range(footprint,0),z:range(footprint,1),y:[ground+rise*i/24-.3375,ground+rise*(i+1)/24-.0875],undersideOnly:true,treadFloor:ramp});
 }
 for(const sign of [-1,1])guard(label+' stair guard',bottom.map((n,i)=>n+v.getComponent(i)*sign*(width/2+.035)),top.map((n,i)=>n+v.getComponent(i)*sign*(width/2+.035)));
 // The mapped bridge edge is skewed relative to this orthogonal flight.
 // A real 3cm lap closes its <1.5cm wedge across the full 2.4m landing;
 // rendered slab, collision and support below all use this same footprint.
 const end=site(side*7.5,-32.3,upper).map((n,i)=>n+u.getComponent(i)*.03),landingLength=Math.hypot(end[0]-top[0],end[2]-top[2]);
 const landingCenter=top.map((n,i)=>(n+end[i])/2);landingCenter[1]-=slab/2;
 const landing=add(label+' upper landing',landingCenter,[landingLength,slab,width],'concrete','box',true,[u,v],'upper landing');
 const solid=layout.solids.at(-1);layout.floors.push({name:landing.name,halle:true,polygon:solid.polygon,x:solid.x,z:solid.z,y:upper});
 for(const sign of [-1,1])guard(label+' landing guard',top.map((n,i)=>n+v.getComponent(i)*sign*(width/2+.035)),end.map((n,i)=>n+v.getComponent(i)*sign*(width/2+.035)));
 const lowerApproach=point(bottom.map((n,i)=>n-u.getComponent(i)*.9)),upperApproach=point(top.map((n,i)=>n+u.getComponent(i)*2.585));
 layout.halle.stairs.push({name:ramp.name,run,rise,risers:24,width,axis:ramp.rampAxis,lowerApproach,upperApproach,confidence:'Straight concrete flights documented; dimensions, orientation and placement inferred'});
}

function addWC(layout,{add}){
 const center=site(-11,-32.3),length=2.585,depth=2.4,height=2.3;
 const at=(x,y,z)=>[center[0]+unit.x*x+across.x*z,ground+y,center[2]+unit.z*x+across.z*z];
 for(const x of [-length/2,length/2])add('western WC end wall',at(x,height/2,0),[.12,height,depth],'pale','box',true,undefined,'WC wall');
 add('western WC rear wall',at(0,height/2,depth/2),[length,height,.12],'pale','box',true,undefined,'WC wall');
 const panel=(length-.95)/2;
 for(const sign of [-1,1])add('western WC entrance jamb',at(sign*(.475+panel/2),height/2,-depth/2),[panel,height,.12],'pale','box',true,undefined,'WC wall');
 add('western WC lintel',at(0,2.225,-depth/2),[.95,.15,.12],'pale','box',true,undefined,'WC lintel');
 add('western WC ceiling',at(0,height+.06,0),[length+.12,.12,depth+.12],'pale','box',true,undefined,'WC ceiling');
 add('western WC pan',at(.72,.22,.52),[.45,.44,.65],'pale','box',true,undefined,'WC fitting');
 add('western WC cistern',at(.72,.6,.83),[.45,.32,.18],'pale','box',true,undefined,'WC fitting');
 add('western WC basin',at(-.76,.81,.54),[.45,.12,.48],'pale','box',true,undefined,'WC fitting');
 layout.halle.wc={under:'west stair',approach:point(at(0,0,-2)),inside:point(at(0,0,-.45)),dimensions:[length,depth,height],doorClearWidth:.95,confidence:'Accessible WC under western stair documented; enclosure and fittings inferred, not accessibility certification'};
}

function addStructure(layout,{add,bar}){
 const xs=[-20.6,-6.5,6.5,20.6],zs=[-41,-38,-30,-25];
 for(const x of xs)for(const z of zs){
  const tall=z<=-38,height=tall?20.85:upper-slab-ground,p=site(x,z,ground+height/2),body=tall?[1.1,height,1.35]:[.75,height,.9];
  add('rectangular concrete pier',p,body,'sauleConcrete','box',true,undefined,tall?'tall pier':'lower pier');
  for(const sign of [-1,1]){
   const anchor=site(x,z,3.52);anchor[0]+=unit.x*sign*(body[0]/2+.32);anchor[2]+=unit.z*sign*(body[0]/2+.32);
   add('gallery concrete haunch',anchor,[.65,.76,.72],'sauleConcrete','halle-corbel',true,[unit.clone().multiplyScalar(-sign),across],'corbel');
  }
 }
 for(const z of zs)bar('lower transverse frame',site(-21.5,z,3.65),site(21.5,z,3.65),.5,'concrete',true,'slab beam');
 for(const x of xs){
  bar('north floor frame',site(x,-43.5,3.65),site(x,-36,3.65),.5,'concrete',true,'slab beam');
  bar('south floor frame',site(x,-30,3.65),site(x,-22.5,3.65),.5,'concrete',true,'slab beam');
 }
 for(const z of [-41,-38])bar('upper hopper frame',site(-21.5,z,20.35),site(21.5,z,20.35),.7,'concrete',true,'hopper beam');
 for(const x of [-13.55,0,13.55]){
  add('rectangular retained hopper',site(x,-39.5,16.8),[8.2,6,6],'darkConcrete','halle-hopper',false,undefined,'hopper');
  add('hopper outlet collar',site(x,-39.5,13.8),[1.23,.25,.9],'darkConcrete','box',false,undefined,'hopper outlet');
 }
 layout.halle.structure={lowerPierCount:16,tallPierCount:8,hopperCount:3,authorGrid:{x:xs,z:zs},confidence:'Photographed rectangular/corbelled forms; grid, counts and dimensions inferred'};
}

function addServices({add,bar}){
 for(const z of [-41,-38,-25]){
  const a=site(-20,z,3.28),b=site(20,z,3.28);
  bar('perforated tray base',a,b,.10,'steel',false,'cable tray');
  for(const x of [-17,-10,-3,4,11,18]){
   add('linear light housing',site(x,z,3.21),[1.5,.09,.18],'steel','box',false,undefined,'light housing');
   add('linear light lens',site(x,z,3.155),[1.4,.025,.12],'opal','box',false,undefined,'light lens');
  }
 }
 for(let i=0;i<10;i++){
  const x=-18+i*4;
  add('blocked upper wall bay',site(x,-43.70,12.0),[2.65,12,.08],'recess','box',false,undefined,'blind bay');
  add('remaining tiled wall patch',site(x,-43.65,4.85),[1.1+(i%3)*.22,1.15+(i%2)*.35,.035],'pale','box',false,undefined,'wall patch');
 }
}

export function addHalleStructure(layout){
 preserveAndRetire(layout);
 layout.halle={sources:['A05','A06','G07','G08','G09'],groundHeight:ground,upperHeight:upper,
  confidence:'Provisional post-2022 study: documented counts/forms; photographic floor-height estimate; inferred row arrangement, coordinates, grid, dimensions and currentness',
  escapeExit:{modelled:false,reason:'A05 aligns a new facade opening with the eastern stair, but facade and coordinates are unregistered; existing shell preserved'},
  voids:[],stairs:[],guards:[],remaining:'Measured floor datums, registered void/stair/hopper plan, accessible route, escape opening, exact services, site-specific wear and contemporary inventory'};
 const api=assembly(layout);addFloors(layout,api);addStair(layout,api,-1);addStair(layout,api,1);addWC(layout,api);addStructure(layout,api);addServices(api);
}
