import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

export const loungeMaterials={
  loungeLeather:{color:'#38313b',roughness:.57},
  loungePlum:{color:'#603543',roughness:.61},
  loungeCeiling:{color:'#242329',roughness:.68}
};

// Original convex studies from I19/19. The photo supports the faceted vocabulary,
// offset backs and dark overhead forms, not a fabrication drawing or duct function.
const seatPlan=[[-.5,-.5],[.38,-.5],[.5,-.28],[.5,.5],[-.35,.5],[-.5,.28]];
const ceilingPlan=[[-.5,-.5],[.35,-.5],[.5,-.22],[.5,.5],[-.32,.5],[-.5,.2]];
function loft(rings){
  const vertices=[],n=rings[0].length;
  const triangle=(a,b,c)=>vertices.push(...a,...b,...c);
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<n;i++){
    const j=(i+1)%n,a=rings[k][i],b=rings[k][j],c=rings[k+1][j],d=rings[k+1][i];
    triangle(a,d,c);triangle(a,c,b);
  }
  for(let i=1;i<n-1;i++){
    triangle(rings[0][0],rings[0][i],rings[0][i+1]);
    triangle(rings.at(-1)[0],rings.at(-1)[i+1],rings.at(-1)[i]);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();return geometry;
}
export function createLoungeGeometries(){
  const shape=new THREE.Shape();
  shape.moveTo(-.465,-.465);shape.lineTo(.465,-.465);
  shape.lineTo(.465,.465);shape.lineTo(-.465,.465);shape.closePath();
  const pad=new THREE.ExtrudeGeometry(shape,{depth:.93,bevelEnabled:true,
    bevelThickness:.035,bevelSize:.035,bevelSegments:3,steps:1});
  pad.translate(0,0,-.465);pad.rotateX(-Math.PI/2);
  const faceted=loft([[-.5,.98],[-.43,1],[.40,1],[.48,.995],[.5,.98]].map(([y,s])=>seatPlan.map(([x,z])=>[x*s,y,z*s])));
  const rectangle=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
  const back=loft([rectangle.map(([x,z])=>[x,-.5,z]),rectangle.map(([x,z])=>[x*.94,.5,z*.72+.10])]);
  const ceiling=loft([ceilingPlan.map(([x,z])=>[x,-.5+(x+.5)*.22,z]),ceilingPlan.map(([x,z])=>[x,.5,z])]);
  return {'lounge-pad':pad,'lounge-faceted-pad':faceted,'lounge-sloped-back':back,'lounge-ceiling-facet':ceiling};
}

export function addUpperLounge(layout,{box,floor,beam,railing,stair}){
  const level=16.35,ceiling=19.0;
  layout.upperLounge={sources:['A13','I16','I18','I19','I20'],floorHeight:level,ceilingHeight:ceiling,
    confidence:'Photo-derived mezzanine, stair and furniture; floor elevations, footprint and placement estimated',
    glassArtwork:'Marc Brandenburg enclosure documented; printed imagery not reproduced',
    furniture:{title:'Felsenland',designer:'Hermann August Weizenegger',year:2010,
      sources:['I16','I17','I19','I20'],confidence:'I19/19 faceted seating and offset backs; dimensions, unseen surfaces, arrangement and current retention estimated'},
    ceilingForms:{sources:['I19'],image:19,confidence:'Visible dark faceted overhead elements; dimensions, exact layout, material and technical purpose unverified'}};
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
  function part(name,author,size,material,shape='box',yaw=0,solid=false,offset=[0,0],ceiling=false){
    const site=studyToSite({x:author[0],y:author[1],z:author[2]});
    site.x+=Math.cos(yaw)*offset[0]+Math.sin(yaw)*offset[1];
    site.z+=-Math.sin(yaw)*offset[0]+Math.cos(yaw)*offset[1];
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(site.x,site.y,site.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(...size));
    const rendered={name:(ceiling?'upper lounge ':'Felsenland ')+name,fixture:ceiling?'upper-lounge-ceiling':'felsenland',section:'interior',shape,material,
      center:[site.x,site.y,site.z],size,matrix:matrix.toArray()};
    if(shape==='lounge-faceted-pad')rendered.bodyFootprint=seatPlan;
    if(shape==='lounge-ceiling-facet')rendered.bodyFootprint=ceilingPlan;
    layout.parts.push(rendered);parts.push(rendered);
    if(solid){
      const polygon=(rendered.bodyFootprint||[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]).map(([x,z])=>{
        const v=new THREE.Vector3(x,0,z).applyMatrix4(matrix);return [v.x,v.z];
      });
      layout.solids.push({name:rendered.name,fixture:rendered.fixture,polygon,
        x:[Math.min(...polygon.map(p=>p[0])),Math.max(...polygon.map(p=>p[0]))],
        z:[Math.min(...polygon.map(p=>p[1])),Math.max(...polygon.map(p=>p[1]))],
        y:[site.y-size[1]/2,site.y+size[1]/2],renderPart:rendered});
    }
  }
  function seat(name,x,z,width,depth,yaw,back=null){
    const floor=layout.upperLounge.floorHeight;
    // Furniture retains metre dimensions after the exterior authoring frame is mapped.
    part(name+' plinth',[x,floor+.13,z],[width-.65,.26,depth-.32],'loungePlum','box',yaw,true);
    part(name+' upholstered seat',[x,floor+.39,z],[width,.26,depth],'loungeLeather','lounge-faceted-pad',yaw,true);
    for(const end of [-1,1]){
      part(name+' end foot',[x,floor+.08,z],[.16,.16,depth-.32],'steel','box',yaw,false,[end*(width/2-.4),0]);
    }
    if(back){
      part(name+' raised back',[x,floor+.79,z],[width*back.fraction,.54,.33],
        'loungePlum','lounge-sloped-back',yaw,true,[width*back.offset,depth*.32]);
    }
  }
  // Parallel to the glazed wall, with the photographed partial back. Other
  // seats are illustrative studies; the image does not recover a whole plan.
  seat('long chaise',-15.5,3.4,6.3,1.18,Math.PI/2,{fraction:.46,offset:.22});
  seat('raised sofa',-18.7,3.7,2.6,1.25,Math.PI/2,{fraction:.62,offset:.12});
  seat('angled chaise',-18.7,-1.65,3.0,1.1,-.42);
  seat('rear chair',-19.1,7.6,2.2,1.1,.15,{fraction:.70,offset:-.10});
  seat('central stool',-12.9,6.5,1.6,.95,-.2);
  for(const [i,x,z,width,depth,yaw,drop] of [
    [0,-15.7,3,6.7,1.55,.12,.48],
    [1,-17.6,1.2,4.2,1.4,-.28,.53],
    [2,-15.7,6.8,5.0,1.3,-.14,.45]]){
    part('faceted ceiling element '+i,[x,layout.upperLounge.ceilingHeight-drop/2,z],
      [width,drop,depth],'loungeCeiling','lounge-ceiling-facet',yaw,true,[0,0],true);
  }
  const anchor=studyToSite({x:-15.5,y:layout.upperLounge.floorHeight,z:3.4});
  layout.fixtures.push({id:'felsenland',anchor:[anchor.x,anchor.y,anchor.z],sources:['I16','I19','I20'],
    confidence:layout.upperLounge.furniture.confidence,dimensions:{seatHeight:.52,backHeight:1.06,longChaise:6.3}});
}
