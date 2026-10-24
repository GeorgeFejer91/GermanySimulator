import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

export const mainBarMaterials={
  mainBarGlass:{color:'#a0aaa4',roughness:.22,transparent:true,opacity:.14},
  mainBarGlow:{color:'#d6c394',roughness:.48,emissive:'#efc773',emissiveIntensity:.7}
};
const corner={x:.75,z:7,outer:1.3,inner:.25,segments:24};
function arcPlan(outer,inner,depth){
  const points=[];
  for(let i=0;i<=corner.segments;i++){
    const a=Math.PI-i*Math.PI/2/corner.segments;points.push(new THREE.Vector2(Math.cos(a)*outer,-Math.sin(a)*outer));
  }
  for(let i=corner.segments;i>=0;i--){
    const a=Math.PI-i*Math.PI/2/corner.segments;points.push(new THREE.Vector2(Math.cos(a)*inner,-Math.sin(a)*inner));
  }
  return new THREE.ExtrudeGeometry(new THREE.Shape(points),{depth,bevelEnabled:false})
    .rotateX(-Math.PI/2).translate(0,-depth/2,0);
}
export function createMainBarGeometries(){
  const seat=[[0,-.025],[.14,-.025],[.193,-.012],[.2,.016],[.192,.026],[.16,.009],[0,.004]];
  const fitting=[[0,0],[.075,0],[.075,.025],[.045,.04],[.065,.065],[.065,.085],[.037,.10],
    [.055,.13],[.055,.15],[.025,.17],[.04,.20],[.04,.22],[0,.22]];
  return {
    'main-bar-corner-top':arcPlan(corner.outer,corner.inner,.075),
    'main-bar-corner-body':arcPlan(corner.outer-.025,corner.inner+.025,1.025),
    'main-bar-corner-band':arcPlan(corner.outer+.012,corner.outer-.012,.16),
    'main-bar-stool-seat':new THREE.LatheGeometry(seat.map(p=>new THREE.Vector2(...p)),24).translate(0,-.0005,0).scale(2.5,1/.051,2.5),
    'main-bar-stepped-fitting':new THREE.LatheGeometry(fitting.map(p=>new THREE.Vector2(...p)),20)
  };
}
const site=values=>{const p=studyToSite({x:values[0],y:values[1],z:values[2]});return[p.x,p.y,p.z];};

export function addMainBarFixtures(layout,{fixture,box,part,cylinder,rod,assemblyCollision}){
  const replaced=new Set(['bar hall counter','bar back','bar bottle']);
  layout.parts=layout.parts.filter(p=>!replaced.has(p.name));
  layout.solids=layout.solids.filter(s=>!replaced.has(s.name));
  const anchor=site([18.4,6.65,-5]);
  layout.mainBar={sources:['A01','I02','I23'],floorHeight:6.65,counterHeight:1.12,screenHeight:10.7,
    counterAnchor:anchor,screenAnchor:site([15.4,6.65,-5]),guestAisleStudyX:16.1,
    observedViews:{longBar:[11,12,13,14],glazedSeparation:[16]},
    confidence:'Photographed forms; room footprint, dimensions, counts, column relationship and currentness estimated',
    remaining:'Surveyed plan/elevations, complete ornate wall, exact apparatus/materials and contemporary installation'};

  fixture('main-bar-glass-screen',[15.4,6.65,-5],['I23'],{height:10.7,length:14.8},()=>{
    const bays=22,pitch=14.8/bays;
    for(let i=0;i<bays;i++){
      const z=-7.4+(i+.5)*pitch;
      box('glass pane',[0,5.35,z],[.024,10.7,pitch-.045],'mainBarGlass',true);
    }
    for(let i=0;i<=bays;i++)rod('steel mullion',[0,0,-7.4+i*pitch],[0,10.7,-7.4+i*pitch],.045,'steel',true);
    for(const y of [.04,1.08,2.75,4.6,6.5,8.6,10.7])box('steel transom',[0,y,0],[.065,.045,14.85],'steel',true);
  });

  fixture('main-long-bar',[18.4,6.65,-5],['I23'],{height:1.12,length:14,depth:1.1,returnLength:1.8},()=>{
    // Keep the real retained pier out of the worktop/cabinet; only the front
    // strip continues across its bay. No structural column is relocated.
    const cuts=layout.solids.filter(s=>s.name==='load-bearing column'&&s.x[1]>anchor[0]-.55&&s.x[0]<anchor[0]+.55&&
      s.z[1]>anchor[2]-7&&s.z[0]<anchor[2]+7)
      .map(s=>({lo:Math.max(-7,s.z[0]-anchor[2]-.025),hi:Math.min(7,s.z[1]-anchor[2]+.025),x:s.x[0]-anchor[0]-.025})).sort((a,b)=>a.lo-b.lo);
    const frontLimit=Math.min(.55,...cuts.map(c=>c.x));
    layout.mainBar.pierNotches=cuts;
    const stripWidth=frontLimit+.55;
    box('continuous front cabinet',[(frontLimit-.55)/2,.525,0],[stripWidth,1.05,14],'rubber',true);
    box('continuous worktop',[(frontLimit-.55)/2,1.0825,0],[stripWidth,.075,14],'rubber',true);
    layout.solids.push({name:'main bar front apron clearance',fixture:'main-long-bar',
      x:[anchor[0]-.592,anchor[0]+frontLimit],z:[anchor[2]-7,anchor[2]+7],y:[6.65,7.77]});
    let start=-7;
    for(const cut of [...cuts,{lo:7,hi:7}]){
      if(cut.lo>start){
        const z=(start+cut.lo)/2,length=cut.lo-start;
        box('rear cabinet segment',[(frontLimit+.55)/2,.525,z],[.55-frontLimit,1.05,length],'rubber',true);
        box('rear worktop segment',[(frontLimit+.55)/2,1.0825,z],[.55-frontLimit,.075,length],'rubber',true);
        box('pale worktop strip',[(frontLimit-.55)/2,1.121,z],[Math.min(.34,stripWidth-.05),.008,length-.015],'aluminium');
      }
      start=Math.max(start,cut.hi);
    }
    for(const [y,shape,material]of [[.5375,'main-bar-corner-body','rubber'],[1.0825,'main-bar-corner-top','rubber']])
      part('rounded return',[corner.x,y,corner.z],[1,1,1],material,shape);
    box('return cabinet',[1.275,.525,7.775],[1.05,1.05,1.05],'rubber',true);
    box('return top',[1.275,1.0825,7.775],[1.05,.075,1.05],'rubber',true);
    layout.solids.push({name:'main bar return apron clearance',fixture:'main-long-bar',
      x:[anchor[0]+.75,anchor[0]+1.8],z:[anchor[2]+7.25,anchor[2]+8.3255],y:[6.65,7.77]});
    for(let i=0;i<corner.segments;i++){
      const a=Math.PI-i*Math.PI/2/corner.segments,b=Math.PI-(i+1)*Math.PI/2/corner.segments;
      const polygon=[[corner.outer+.012,a],[corner.outer+.012,b],[corner.inner,b],[corner.inner,a]].map(([r,t])=>
        [anchor[0]+corner.x+Math.cos(t)*r,anchor[2]+corner.z+Math.sin(t)*r]);
      layout.solids.push({name:'main bar rounded worktop clearance',fixture:'main-long-bar',polygon,
        x:[Math.min(...polygon.map(p=>p[0])),Math.max(...polygon.map(p=>p[0]))],
        z:[Math.min(...polygon.map(p=>p[1])),Math.max(...polygon.map(p=>p[1]))],y:[6.65,7.77]});
    }
    for(const y of [.23,.88]){
      for(let i=0;i<60;i++){
        const z=-6.89+i*13.78/59;
        box('luminous ribbed block',[-.568,y,z],[.025,.16,.214],'mainBarGlow').role='luminous band';
        for(const dy of [-.048,-.016,.016,.048])box('glass rib',[-.585,y+dy,z],[.014,.005,.205],'mainBarGlow');
      }
      part('curved luminous band',[corner.x,y,corner.z],[1,1,1],'mainBarGlow','main-bar-corner-band').role='luminous band';
      for(let i=0;i<5;i++)box('return luminous block',[.84+i*.21,y,8.313],[.195,.16,.025],'mainBarGlow');
    }
    for(const z of [-5.4,-1.2,3.2])part('stepped countertop fitting',[-.22,1.125,z],[1,1,1],'steel','main-bar-stepped-fitting');
  });

  for(let i=0;i<18;i++){
    // Author offsets in metres, like the existing Panorama fixtures.
    const z=-6.45+i*.75;
    fixture('main-bar-stool-'+i,[18.4,6.65,-5],['I23'],{seatHeight:.76,width:.5,placement:'Estimated row'},()=>{
      const offset=[-1.05,0,z];
      part('concave round seat',[offset[0],.76,offset[2]],[.4,.051,.4],'steel','main-bar-stool-seat');
      for(let leg=0;leg<4;leg++){
        const a=Math.PI/4+leg*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
        rod('splayed leg',[offset[0]+c*.105,.735,offset[2]+s*.105],[offset[0]+c*.235,.025,offset[2]+s*.235],.028,'steel');
        cylinder('foot',[offset[0]+c*.235,.015,offset[2]+s*.235],.045,.03,'rubber');
      }
      const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
      part('foot ring',[offset[0],.27,offset[2]],[.42,.42,.42],'aluminium','ring',false,rotation);
      assemblyCollision();
    });
  }
  fixture('main-bar-service-worktop',[20.6,6.65,-5],['I23'],{height:.94,length:13.4,depth:.58},()=>{
    box('service cabinet',[0,.45,0],[.58,.90,13.4],'rubber',true);
    box('brushed worktop',[0,.91,0],[.62,.06,13.45],'stainless',true);
    for(const z of [-4.8,-.8,3.9]){
      for(const dx of [-.195,.195])box('sink side',[dx,.946,z],[.018,.012,.48],'stainless');
      for(const dz of [-.24,.24])box('sink end',[0,.946,z+dz],[.39,.012,.018],'stainless');
      box('sink recess',[0,.941,z],[.37,.005,.46],'steel');
      rod('tap riser',[.15,.94,z+.19],[.15,1.2,z+.19],.022,'stainless');
      rod('tap spout',[.15,1.2,z+.19],[-.03,1.2,z+.19],.022,'stainless');
    }
    for(let i=0;i<22;i++){
      const z=-6.15+i*.58,h=.23+(i%3)*.018;
      cylinder('unlabelled bottle',[.07,.95+h/2,z],.07,h,'glass');
      cylinder('bottle neck',[.07,.95+h+.035,z],.028,.07,'glass');
    }
  });
}
