import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

export const loungeMaterials={
  loungeLeather:{color:'#38313b',roughness:.57},
  loungePlum:{color:'#603543',roughness:.61}
};

export function createLoungeGeometries(){
  const shape=new THREE.Shape();
  shape.moveTo(-.465,-.465);shape.lineTo(.465,-.465);
  shape.lineTo(.465,.465);shape.lineTo(-.465,.465);shape.closePath();
  const pad=new THREE.ExtrudeGeometry(shape,{depth:.93,bevelEnabled:true,
    bevelThickness:.035,bevelSize:.035,bevelSegments:3,steps:1});
  pad.translate(0,0,-.465);pad.rotateX(-Math.PI/2);
  return {'lounge-pad':pad};
}

export function addUpperLounge(layout,{box,floor,beam,railing,stair}){
  const level=16.35,ceiling=19.0;
  layout.upperLounge={sources:['A13','I16','I18','I19','I20'],floorHeight:level,ceilingHeight:ceiling,
    confidence:'Photo-derived mezzanine, stair and furniture; floor elevations, footprint and placement estimated',
    glassArtwork:'Marc Brandenburg enclosure documented; printed imagery not reproduced',
    furniture:{title:'Felsenland',designer:'Hermann August Weizenegger',year:2010,
      sources:['I16','I17','I19','I20'],confidence:'Observed angular seating; dimensions, unseen surfaces and arrangement estimated'}};
  floor('upper Panorama lounge',[-21.5,-9],[-4.5,9.4],level);
  floor('upper lounge landing',[-9,-6.8],[-4.5,1.9],level);
  floor('upper lounge lower landing',[-9,-6.8],[8.5,9.4],13.25);
  stair('upper lounge stair',-7.9,1.9,8.5,13.25,level,2,18,'interior');
  box('upper lounge ceiling',[-14.15,ceiling+.08,2.45],[14.7,.16,13.9],'pale','interior',true);
  box('upper lounge south wall',[-15.25,17.67,9.25],[12.5,2.64,.15],'pale','interior',true);
  for(const [x,z,length]of [[-15.3,-4.4,12.2],[-15.3,8.9,12.2]])
    box('upper lounge ceiling beam',[x,18.76,z],[length,.4,.35],'pale','interior',true);
  function guard(name,start,end){
    railing(name,start,end,'interior');
    const low=Math.min(start[1],end[1]);
    layout.solids.push({name,x:[Math.min(start[0],end[0])-.035,Math.max(start[0],end[0])+.035],
      z:[Math.min(start[2],end[2])-.035,Math.max(start[2],end[2])+.035],y:[low,Math.max(start[1],end[1])+1.1]});
    const count=Math.ceil(Math.hypot(end[0]-start[0],end[2]-start[2])/.14);
    for(let i=0;i<=count;i++){
      const t=i/count,x=start[0]+(end[0]-start[0])*t,z=start[2]+(end[2]-start[2])*t;
      beam(name+' baluster',[x,low+.08,z],[x,low+1.05,z],.018,'steel','interior');
    }
  }
  guard('upper lounge overlook rail',[-21.2,level,-4.45],[-6.9,level,-4.45]);
  guard('upper lounge stairwell rail',[-9.05,level,2.05],[-9.05,level,9.1]);
  guard('upper lounge eastern rail',[-6.85,level,-4.4],[-6.85,level,1.85]);
  for(const x of [-8.95,-6.85])for(let step=0;step<18;step++){
    const z=1.9+(step+.5)*6.6/18,y=level-(step+.5)*3.1/18;
    layout.solids.push({name:'upper lounge sloping rail',x:[x-.03,x+.03],
      z:[z-6.6/36,z+6.6/36],y:[y,y+1.1]});
  }
  for(const x of [-8.9,-6.9])for(let post=0;post<=48;post++){
    const z=1.9+post*6.6/48,y=level-post*3.1/48;
    beam('upper lounge stair baluster',[x,y+.08,z],[x,y+1.05,z],.018,'steel','interior');
  }
  for(let panel=0;panel<7;panel++){
    const z=-3.45+panel*1.75;
    box('upper lounge glazed enclosure',[-20.95,17.65,z],[.035,2.6,1.7],'lightGlass','interior',true);
    box('upper lounge glass mullion',[-20.95,17.65,z-.87],[.07,2.65,.06],'steel','interior',true);
  }
  for(const y of [16.39,18.96])box('upper lounge glass frame',[-20.95,y,2],[.075,.055,12.7],'steel','interior',true);
  for(const z of [-3.7,3,8.2]){
    box('upper lounge strip light',[-20.55,18.82,z],[.06,.06,1.7],'warm','interior');
    beam('upper lounge electrical conduit',[-20.65,18.8,z-.95],[-20.65,18.8,z+.95],.022,'steel','interior');
  }
  for(const z of [-3.5,8.8]){
    box('upper lounge radiator header',[-19,16.98,z],[1.9,.06,.08],'steel','interior',true);
    for(let rib=0;rib<24;rib++)box('upper lounge radiator rib',[-19.9+rib*.078,16.68,z],[.04,.56,.11],'steel','interior',true);
  }
}

export function addLoungeFurniture(layout){
  const parts=[];
  function part(name,author,size,material,shape='box',yaw=0,solid=false){
    const site=studyToSite({x:author[0],y:author[1],z:author[2]});
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(site.x,site.y,site.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(...size));
    const rendered={name:'Felsenland '+name,fixture:'felsenland',section:'interior',shape,material,
      center:[site.x,site.y,site.z],size,matrix:matrix.toArray()};
    layout.parts.push(rendered);parts.push(rendered);
    if(solid){
      const polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>{
        const v=new THREE.Vector3(x,0,z).applyMatrix4(matrix);return [v.x,v.z];
      });
      layout.solids.push({name:rendered.name,fixture:'felsenland',polygon,
        x:[Math.min(...polygon.map(p=>p[0])),Math.max(...polygon.map(p=>p[0]))],
        z:[Math.min(...polygon.map(p=>p[1])),Math.max(...polygon.map(p=>p[1]))],
        y:[site.y-size[1]/2,site.y+size[1]/2],renderPart:rendered});
    }
  }
  function seat(name,x,z,width,depth,yaw,back=false){
    const floor=layout.upperLounge.floorHeight,c=Math.cos(yaw),s=Math.sin(yaw);
    // Furniture retains metre dimensions after the exterior authoring frame is mapped.
    part(name+' plinth',[x,floor+.13,z],[width-.36,.26,depth-.25],'loungePlum','box',yaw,true);
    part(name+' upholstered seat',[x,floor+.39,z],[width,.26,depth],'loungeLeather','lounge-pad',yaw,true);
    for(const end of [-1,1]){
      const site=studyToSite({x,y:floor,z}),dx=end*(width/2-.14)*c,dz=-end*(width/2-.14)*s;
      const foot={x:site.x+dx,z:site.z+dz};
      part(name+' end foot',[x,floor+.08,z],[.16,.16,depth-.15],'steel','box',yaw);
      const rendered=parts.at(-1);rendered.center=[foot.x,floor+.08,foot.z];rendered.matrix[12]=foot.x;rendered.matrix[14]=foot.z;
    }
    if(back){
      const offset=depth*.36;
      part(name+' raised back',[x,floor+.76,z],[width*.78,.58,.25],'loungePlum','lounge-pad',yaw,true);
      const backPart=parts.at(-1),solid=layout.solids.at(-1),dx=s*offset,dz=c*offset;
      backPart.center[0]+=dx;backPart.center[2]+=dz;backPart.matrix[12]+=dx;backPart.matrix[14]+=dz;
      solid.x=solid.x.map(v=>v+dx);solid.z=solid.z.map(v=>v+dz);solid.polygon=solid.polygon.map(([a,b])=>[a+dx,b+dz]);
    }
  }
  seat('long chaise',-15.5,3,6.3,1.18,-.08);
  seat('raised sofa',-15.1,.35,4.8,1.2,.04,true);
  seat('angled chaise',-18.7,-1.65,3.0,1.1,-.42);
  seat('rear chair',-16.9,7,2.2,1.1,.15,true);
  seat('central stool',-12.9,6.5,1.6,.95,-.2);
  const anchor=studyToSite({x:-15.5,y:layout.upperLounge.floorHeight,z:3});
  layout.fixtures.push({id:'felsenland',anchor:[anchor.x,anchor.y,anchor.z],sources:['I16','I19','I20'],
    confidence:layout.upperLounge.furniture.confidence,dimensions:{seatHeight:.52,backHeight:1.05,longChaise:6.3}});
}
