import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

// A01/I23 gallery 01, 16–24: visible architectural vocabulary. These are
// original, dimension-estimated forms, not an inventory of the current rig.
// Main-room details follow the provisional main datum by rigid translation.
// Ground pendants below use their own anchors; roof suspension stays at the hull.
const point=([x,y,z])=>{const p=studyToSite({x,y:y>=6.65?y-1.2:y,z});return [p.x,p.y,p.z];};

export function addMainHallDetails(layout){
  const retired=new Set(['main lighting truss','main lamp']);
  const pendants=new Set(layout.fixtures.filter(f=>f.id.startsWith('foyer-pendant-')).map(f=>f.id));
  layout.parts=layout.parts.filter(p=>!retired.has(p.name)&&!pendants.has(p.fixture));
  const detail={sources:['A01','I23'],gallery:[1,16,17,18,19,21,22,23,24],
    confidence:'Photographed feature families; dimensions, placement and contemporary retention estimated',
    lighting:'Visible hardware study; current fixture inventory and programmed operation unverified',
    roundWallFeatures:'Framed dark recesses; purpose and depth unknown, not walkable portals',
    assemblies:[]};
  layout.mainHallDetails=detail;
  const register=(id,images)=>detail.assemblies.push({id,images:images.map(i=>'A01/gallery-'+String(i).padStart(2,'0'))});
  const add=(name,center,size,material='steel',shape='box',solid=false,rotation=new THREE.Quaternion())=>{
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...center),rotation,new THREE.Vector3(...size));
    const part={name:'main detail '+name,section:'interior',mainHallDetail:true,shape,material,center,size,matrix:matrix.toArray(),instanceTone:.94};
    layout.parts.push(part);
    if(solid){
      const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(matrix);
      layout.solids.push({name:part.name,renderPart:part,mainHallDetail:true,x:[bounds.min.x,bounds.max.x],y:[bounds.min.y,bounds.max.y],z:[bounds.min.z,bounds.max.z]});
    }
    return part;
  };
  const box=(name,p,size,mat='steel',solid=false)=>add(name,point(p),size,mat,'box',solid);
  const beam=(name,a,b,width=.035,material='steel')=>{
    const start=point(a),end=point(b);
    layout.parts.push({name:'main detail '+name,section:'interior',mainHallDetail:true,shape:'beam',material,start,end,width,instanceTone:.94});
  };
  const horizontal=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);

  register('open lighting trusses',[17,18,19,22]);
  for(const z of [-16,-6,4]){
    for(const y of [16.3,16.7])for(const dz of [-.2,.2])beam('truss chord',[-3,y,z+dz],[12,y,z+dz],.045,'aluminium');
    for(let i=0;i<15;i++){
      const x=-3+i;
      for(const dz of [-.2,.2])beam('truss diagonal',[x,16.3,z+dz],[x+1,16.7,z+dz],.025,'aluminium');
      beam('truss top brace',[x,16.7,z-.2],[x+1,16.7,z+.2],.025,'aluminium');
      beam('truss lower brace',[x,16.3,z+.2],[x+1,16.3,z-.2],.025,'aluminium');
    }
    for(const x of [-2.5,11.5])beam('truss suspension',[x,16.7,z],[x,layout.calibration.mainRoof+1.2,z],.014);
    for(const [i,x] of [-2,2,6,10].entries()){
      const c=point([x,15.94,z]);
      add('projector body',c,[.29,.46,.29],'rubber','cylinder');
      add('projector lens',point([x,15.702,z]),[.23,.012,.23],i%2?'glass':'warm','cylinder');
      for(const dx of [-.2,.2])box('projector yoke',[x+dx,16.12,z],[.035,.39,.06]);
      box('projector clamp',[x,16.3,z],[.46,.055,.06]);
      beam('projector cable',[x+.18,16.12,z],[x+.35,16.65,z],.018,'rubber');
    }
  }

  register('framed DJ-wall recesses',[19,24]);
  const a=point([0,0,-21.7]),b=point([1,0,-21.7]);
  const yaw=Math.atan2(-(b[2]-a[2]),b[0]-a[0]);
  const wallRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const discRotation=wallRotation.clone().multiply(horizontal);
  for(const x of [1.7,12.9])for(const y of [12.3,14.15]){
    // Gallery00/24 show a broad, stepped surround on both sides of the booth.
    // Overlapping concentric rings keep the opaque back continuous at the rim.
    for(const [i,size] of [1.16,1.06,.96,.86].entries())
      add('circular wall frame',point([x,y,-21.60-i*.012]),[size,size,size],i?'pale':'steel','ring',false,wallRotation);
    add('dark wall recess',point([x,y,-21.66]),[.82,.035,.82],'rubber','cylinder',false,discRotation);
  }

  register('DJ-wall maintenance stair and ladder',[0,19,24]);
  // The photographed industrial access is distinct from a public backstage
  // route. No walkable floor or door destination is inferred behind the wall.
  detail.maintenanceAccess='Visible ladder, small landing and diagonal steel stair only; endpoint, dimensions and continued use unverified';
  const bottom=[1.2,11.4,-21.03],top=[12.2,18.3,-21.03];
  box('maintenance landing',[.65,11.32,-21.03],[2.1,.16,1.05],'steel');
  for(let i=0;i<32;i++){
    const t=(i+.5)/32,x=bottom[0]+(top[0]-bottom[0])*t,y=bottom[1]+(top[1]-bottom[1])*t;
    box('maintenance tread',[x,y-.045,bottom[2]],[11/32,.09,1.05]);
  }
  for(const dz of [-.51,.51]){
    beam('maintenance stringer',[bottom[0],bottom[1]-.12,bottom[2]+dz],[top[0],top[1]-.12,top[2]+dz],.12);
    for(const h of [.5,1.05])beam('maintenance rail',[bottom[0],bottom[1]+h,bottom[2]+dz],[top[0],top[1]+h,top[2]+dz],.04);
    for(let i=0;i<=9;i++){
      const t=i/9,x=bottom[0]+11*t,y=bottom[1]+6.9*t;
      beam('maintenance post',[x,y,bottom[2]+dz],[x,y+1.05,bottom[2]+dz],.04);
    }
  }
  for(const x of [-.25,.35])box('maintenance ladder stile',[x,9.475,-20.52],[.04,5.65,.04],'steel',true);
  for(let y=6.9;y<11.5;y+=.3)box('maintenance ladder rung',[.05,y,-20.52],[.6,.035,.035],'steel',true);
  for(const x of [.8,6.1])box('closed wall service hatch',[x,10.7,-21.57],[1.05,1.1,.07],'pale');

  register('screened booth guard',[15,24]);
  const left=point([2.2,7.53,-16.68]),right=point([7.8,7.53,-16.68]);
  const length=Math.hypot(right[0]-left[0],right[2]-left[2]);
  const center=left.map((v,i)=>(v+right[i])/2);
  // Reuse the existing genuinely open diamond lattice geometry. The visible
  // perimeter has a conservative body collider, like the accepted Halle rail.
  const panel=add('booth open mesh',center,[length,1.12,.02],'steel','halle-mesh',true,wallRotation);
  for(const y of [7.0,8.08])beam('booth rounded rail',[2.2,y,-16.68],[7.8,y,-16.68],.045);
  for(const x of [2.2,5,7.8])beam('booth upright',[x,6.95,-16.68],[x,8.1,-16.68],.04);
  panel.sources=['A01','I23'];

  register('low glass-wall radiator bank',[16,18]);
  const screen=layout.mainBar.screenAnchor;
  for(const dz of [-5,-1.8,1.4,4.6]){
    const center=[screen[0]-.18,5.83,screen[2]+dz];
    for(let i=0;i<22;i++)add('glass-wall radiator fin',[center[0],center[1],center[2]-1.1+i*.105],[.14,.64,.036],'steel');
    const body=add('glass-wall radiator body',center,[.13,.56,2.28],'steel','box',true);
    // Its hidden body supplies collision; closely spaced fins remain open.
    body.sources=['I23'];
  }

  register('rounded foyer drum pendants',[1]);
  for(const fixture of layout.fixtures.filter(f=>pendants.has(f.id))){
    fixture.sources=[...new Set([...fixture.sources,'A01','I23'])];
    fixture.dimensions={diameter:1.15,height:.66,shape:'Photo-informed faceted cylindrical drum; size and anchor estimated'};
    const [x,y,z]=fixture.anchor;
    add('foyer drum shade',[x,y+4.2,z],[1.15,.66,1.15],'warm','cylinder');
    for(let i=0;i<24;i++){
      const angle=i*Math.PI/12,dx=Math.cos(angle)*.574,dz=Math.sin(angle)*.574;
      add('foyer drum vertical rib',[x+dx,y+4.2,z+dz],[.014,.65,.014],'pale');
    }
    for(const height of [3.86,4.54])add('foyer drum rim',[x,y+height,z],[1.11,1.11,1.11],'steel','ring',false,horizontal);
    add('foyer drum suspension',[x,y+4.78,z],[.018,.48,.018],'steel','cylinder');
  }
  detail.parts=layout.parts.filter(p=>p.mainHallDetail).length;
}
