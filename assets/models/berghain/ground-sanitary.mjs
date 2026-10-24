import {studyToSite} from './calibration.mjs';

const footprint={x:[-21.3,-10.3],z:[18.3,21.3]},floorHeight=.05;
const site=([x,y,z])=>studyToSite({x,y,z});
const corners=[[footprint.x[0],floorHeight,footprint.z[0]],[footprint.x[1],floorHeight,footprint.z[0]],
  [footprint.x[1],floorHeight,footprint.z[1]],[footprint.x[0],floorHeight,footprint.z[1]]].map(site);
export function groundSanitaryAt(p){
  return Math.abs(p.y-floorHeight)<.15&&corners.every((a,i)=>{
    const b=corners[(i+1)%4];return (b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x)>=-1e-8;
  });
}

export function addGroundSanitary(layout){
  const first=layout.parts.length;
  function part(name,c,s,material='darkConcrete',shape='box',solid=true){
    const center=site(c),origin=[center.x,center.y,center.z];
    const axes=s.map((size,i)=>{const p=site(c.map((v,j)=>v+(i===j?size:0)));return[p.x-origin[0],p.y-origin[1],p.z-origin[2]];});
    const matrix=[...axes[0],0,...axes[1],0,...axes[2],0,...origin,1];
    const p={name:'Ground WC '+name,shape,material,center:origin,size:axes.map(a=>Math.hypot(...a)),matrix,
      section:'interior',groundSanitary:true,instanceTone:.94};layout.parts.push(p);
    if(solid){
      const polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>
        [origin[0]+axes[0][0]*x+axes[2][0]*z,origin[2]+axes[0][2]*x+axes[2][2]*z]);
      layout.solids.push({name:p.name,renderPart:p,groundSanitary:true,polygon,
        x:[Math.min(...polygon.map(p=>p[0])),Math.max(...polygon.map(p=>p[0]))],
        z:[Math.min(...polygon.map(p=>p[1])),Math.max(...polygon.map(p=>p[1]))],y:[c[1]-s[1]/2,c[1]+s[1]/2]});
    }return p;
  }
  const wall=(name,x,z,w,d)=>part(name,[x,1.45,z],[w,2.8,d]);
  wall('north enclosure',-15.8,18.3,11,.12);
  wall('south enclosure',-15.8,21.3,11,.12);
  wall('west enclosure',-21.3,19.8,.12,3);
  wall('east enclosure north',-10.3,18.5,.12,.4);
  wall('east enclosure south',-10.3,20.9,.12,.8);
  part('east entry lintel',[-10.3,2.58,19.6],[.12,.54,1.8]);
  part('ceiling',[-15.8,2.93,19.8],[11,.16,3]);
  // Existing foyer slab is the floor. No additional coplanar surface or hole.
  const stalls=[];
  for(let i=0;i<3;i++){
    const left=-20.8+i*2.4,right=left+2.4,x=(left+right)/2;
    wall('stall side '+i,left,19.15,.08,1.7);
    wall('stall front left '+i,left+.3,20,.6,.08);
    wall('stall front right '+i,right-.3,20,.6,.08);
    part('parted stall door '+i,[left+.69,1.13,19.58],[.06,2.16,.76],'steel');
    part('pan '+i,[x,.31,18.88],[.56,.48,.4],'stainless','wc-bowl');
    part('flush supply '+i,[x,.57,18.5],[.04,.9,.04],'stainless');
    part('flush plate '+i,[x,.98,18.41],[.22,.25,.04],'stainless');
    stalls.push({center:site([x,floorHeight,19.55]),authorCenter:[x,floorHeight,19.55]});
  }
  wall('stall end',-13.6,19.15,.08,1.7);
  // A conservative complete trough footprint prevents recovery into its rim.
  part('wash trough',[-11.8,.84,20.93],[2.1,.22,.55],'stainless');
  part('wash trough dark basin',[-11.8,.955,20.93],[1.95,.015,.43],'rubber','box',false);
  for(const x of [-12.4,-11.2]){
    part('tap stem',[x,1.07,21.13],[.035,.28,.035],'stainless');
    part('tap spout',[x,1.2,21.01],[.035,.035,.27],'stainless');
    part('waste pipe',[x,.43,20.94],[.04,.62,.04],'stainless');
  }
  const authorRoute=[[-8.8,.05,14.4],[-9.5,.05,14.4],[-9.5,.05,19.6],[-11.1,.05,19.6],[-13.2,.05,19.6],[-13.2,.05,20.6]];
  layout.groundSanitary={sources:['U02','A01'],floorHeight,authorFootprint:footprint,
    footprint:corners.map(p=>[p.x,p.z]),ceilingUnderside:2.85,
    evidence:{U02:'Quiet toilet wing on ground floor beside cloakroom, distinct from main-floor Klo/unisex WC',
      A01:'Architect anniversary timeline: April2015 GarderobeWC; July2024 FLINTA urinals is a separate intervention'},
    confidence:'Floor and cloakroom adjacency supported; west/front registration, footprint, three stalls, dimensions and fittings estimated',
    currentness:'User cutaway date unknown; no claim that inferred fittings or room layout match present-day configuration',
    flintaLocation:'Unassigned: no evidence locates July2024 installation in this room',
    access:'Public east-end corridor around existing cloakroom counter; no staff, Lab or backstage shortcut',
    authorRoute,route:authorRoute.map(site),stalls,
    lightAnchors:[[-17.8,2.65,20.6],[-11.9,2.65,19.6]].map(site),
    arrival:{position:site([-13.2,.05,20.6]),yaw:Math.PI/2},
    partCount:layout.parts.length-first};
}
