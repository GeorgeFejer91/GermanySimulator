import {studyToSite} from './calibration.mjs';

// A13/I21 establish a distinct Panorama sanitary area and an added lounge.
// The footprint below registers that relationship to the existing provisional
// lounge, not to a measured plan. I21's mixed-date photos do not locate fittings.
export function addInteriorTopology(layout,{box}){
  const firstPart=layout.parts.length;
  const y=13.25;
  layout.interiorTopology={
    sources:['A13','I03','I04','I21','V05','V06'],
    confidence:'Documented separate sanitary levels; footprint, doors and fixture counts estimated',
    panoramaToilets:{floorHeight:y,authorFootprint:{x:[-21.5,-13],z:[-3.5,4.8]},
      placement:'Under existing upper lounge; estimated registration, not an as-built plan',
      sources:['A13','I21','V05'],photoAssignment:'Sanitary vocabulary only; gallery floor/date unresolved'},
    smoking:{sources:['A01','I15','P10'],status:'Unresolved registration',
      reason:'Photographed east/front extension lies below provisional Panorama floor; upper return stair and cross-building connection unverified'},
    backstage:{sources:['V06'],status:'Unmodelled',reason:'Historical dressing/cooling/storage spaces documented; no verified plan or public connection; DJ furniture is not a backstage room'}
  };
  const wall=(name,x,z,w,d)=>box('Panorama WC '+name,[x,y+1.35,z],[w,2.7,d],'darkConcrete','interior',true);
  wall('north enclosure',-17.25,-3.5,8.5,.14);
  wall('south enclosure',-17.25,4.8,8.5,.14);
  wall('west lining',-21.45,.65,.10,8.3);
  // A two-metre entry meets the existing north/south circulation beside the
  // stair. The ceiling is already the underside of the upper lounge slab.
  wall('east enclosure north',-13,-1.75,.14,3.5);
  wall('east enclosure south',-13,3.4,.14,2.8);
  box('Panorama WC entry lintel',[-13,y+2.48,1],[.14,.44,2],'darkConcrete','interior',true);
  for(let i=0;i<3;i++){
    const z=-1.9+i*2.2;
    for(const dz of [-1,1])box('Panorama WC cubicle divider',[-19.1,y+1.16,z+dz],[3.5,2.32,.07],'stainless','interior',true);
    box('Panorama WC cubicle back',[-20.85,y+1.16,z],[.07,2.32,2],'stainless','interior',true);
    for(const dz of [-.86,.86])box('Panorama WC cubicle jamb',[-17.35,y+1.16,z+dz],[.07,2.32,.28],'stainless','interior',true);
    box('Panorama WC cubicle header',[-17.35,y+2.36,z],[.07,.08,2],'stainless','interior',true);
    // Open inward, preserving a body-clear public aisle and cubicle entrance.
    box('Panorama WC open door',[-18,y+1.15,z+.78],[1.3,2.26,.06],'rubber','interior',true);
  }
  for(const part of layout.parts.slice(firstPart))part.interiorTopology=true;
}

export function addPanoramaSanitaryFixtures(layout,{fixture,box,part,rod,assemblyCollision}){
  const firstPart=layout.parts.length;
  for(let i=0;i<3;i++)fixture('panorama-wc-pan-'+i,[-20.15,13.25,-1.9+i*2.2],['I21'],
    {height:.48,placement:'Estimated; no floor attribution for source photograph'},()=>{
      part('hollow steel pan',[0,.26,0],[.56,.48,.4],'stainless','wc-bowl',true);
      box('flush plate',[-.45,.94,0],[.035,.27,.23],'stainless',true);
      rod('flush supply',[-.28,.1,0],[-.28,.7,0],.035,'stainless',true);
    });
  fixture('panorama-wc-wash',[-15.2,13.25,4.35],['I21'],
    {height:.9,placement:'Estimated wall trough, not a verified floor-specific fixture'},()=>{
      box('trough bottom',[0,.78,0],[2.1,.06,.6],'stainless',true);
      box('trough front',[0,.87,-.3],[2.1,.18,.04],'stainless',true);
      for(const x of [-1.03,1.03])box('trough end',[x,.87,0],[.04,.18,.6],'stainless',true);
      for(const x of [-.6,.6]){
        rod('tap upright',[x,.88,.23],[x,1.13,.23],.035,'stainless',true);
        rod('tap spout',[x,1.13,.23],[x,1.13,-.08],.035,'stainless',true);
        rod('waste pipe',[x,.15,0],[x,.78,0],.035,'stainless',true);
      }
      // A body cannot stand inside the trough. Recover past its complete rim,
      // rather than resolving one thin panel into the adjacent front/end lips.
      assemblyCollision();
      layout.solids=layout.solids.filter(s=>s.renderPart?.fixture!=='panorama-wc-wash');
    });
  for(const part of layout.parts.slice(firstPart))part.interiorTopology=true;
}

// Preserve the pre-increment variation even in batches that Halle subsequently
// retires. New sanitary parts must not alter unrelated parts' index/count seed.
export function pinInteriorTopologyTones(layout){
  const groups=new Map();
  for(const part of layout.parts){
    if(part.interiorTopology){part.instanceTone=.94;continue;}
    const key=[part.section,part.material==='mainBarPlaster'?'pale':part.material,part.shape].join('/');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(part);
  }
  for(const parts of groups.values())parts.forEach((part,index)=>{
    part.instanceTone??=.84+((index*193+parts.length*37)%101)/625;
  });
}

const corners=[[-21.5,-3.5],[-13,-3.5],[-13,4.8],[-21.5,4.8]]
  .map(([x,z])=>studyToSite({x,y:13.25,z}));
export function panoramaSanitaryAt(position){
  return Math.abs(position.y-13.25)<.15&&corners.every((a,i)=>{
    const b=corners[(i+1)%4];
    return (b.x-a.x)*(position.z-a.z)-(b.z-a.z)*(position.x-a.x)>=0;
  });
}
