import {adjacentPanoramaPoint,panoramaSection} from './panorama-section.mjs';
import {studyToSite} from './calibration.mjs';
import {panoramaStudyPoint} from './panorama-registration.mjs';

// A13/I21 establish a distinct Panorama sanitary area and an added lounge.
// V20 describes inner/outer right-hand groups of three (2022), with three rear
// stalls still reported beyond a column in 2026. V21 establishes left stalls.
// The footprint, straight alignment, column dimensions and two left stalls are
// reconstruction choices, not a current surveyed plan. I21 does not locate them.
const rightCubicles=[-13.85,-15.05,-16.25,-17.9,-19.1,-20.3].map((x,i)=>
  ({id:i,group:i<3?'front-right':'rear-right',x,z:-2.05,width:1.1,front:-.85,back:-3.25,pan:-2.65}));
const leftCubicles=[-18.5,-20.1].map((x,i)=>
  ({id:i+6,group:'left-estimate',x,z:3.3,width:1.5,front:2.1,back:4.5,pan:3.95}));
const cubicles=[...rightCubicles,...leftCubicles];
export function addInteriorTopology(layout,{box}){
  const firstPart=layout.parts.length;
  const y=13.25;
  layout.interiorTopology={
    sources:['A13','I03','I04','I21','V05','V06','V20','V21'],
    confidence:'Documented separate sanitary levels; footprint, doors and fixture counts estimated',
    panoramaToilets:{floorHeight:y,authorFootprint:{x:[-21.5,-13],z:[-3.5,4.8]},
      placement:'Under existing upper lounge; estimated registration, not an as-built plan',
      sources:['A13','I21','V05','V20','V21'],photoAssignment:'Sanitary vocabulary only; gallery floor/date unresolved',
      arrangement:{reported:'Front and rear right-hand groups; three rear stalls beyond a column; separate left stalls',
        rightCount:6,rightCountDate:'Two groups of three reported in November 2022; only rear three corroborated in May 2026',
        leftCount:2,leftCountConfidence:'Illustrative only; actual count unverified',
        registration:'Metric spacing, straight bank, column location and left group placement estimated',
        rearWindows:'Retained facade glazing revealed above an estimated 1m solid parapet; bay registration unverified',
        policy:'Single-use assignment changed in reports; no current policy or queue rule modelled'}},
    smoking:{sources:['A01','I15','P10'],status:'Unresolved registration',
      reason:'Photographed east/front extension lies below provisional Panorama floor; upper return stair and cross-building connection unverified'},
    backstage:{sources:['V06'],status:'Unmodelled',reason:'Historical dressing/cooling/storage spaces documented; no verified plan or public connection; DJ furniture is not a backstage room'}
  };
  const wall=(name,x,z,w,d)=>box('Panorama WC '+name,[x,y+1.35,z],[w,2.7,d],'darkConcrete','interior',true);
  wall('north enclosure',-17.25,-3.5,8.5,.14);
  wall('south enclosure',-17.25,4.8,8.5,.14);
  // V20 places windows beside the rear group. Keep a solid low boundary at
  // the existing floor edge while revealing the retained facade glazing.
  // The 1m parapet is estimated; it masks .15m of the existing window sill.
  box('Panorama WC west lining',[-21.45,y+.5,.65],[.10,1,8.3],'darkConcrete','interior',true);
  // A two-metre entry meets the existing north/south circulation beside the
  // stair. The ceiling is already the underside of the upper lounge slab.
  wall('east enclosure north',-13,-1.75,.14,3.5);
  wall('east enclosure south',-13,3.4,.14,2.8);
  box('Panorama WC entry lintel',[-13,y+2.48,1],[.14,.44,2],'darkConcrete','interior',true);
  for(const c of cubicles){
    const {x,z,width,front,back}=c,name='Panorama WC '+c.group+' '+c.id;
    for(const side of [-1,1])box(name+' divider',[x+side*width/2,y+1.16,z],[.06,2.32,2.4],'stainless','interior',true);
    box(name+' back',[x,y+1.16,back],[width,2.32,.06],'stainless','interior',true);
    for(const side of [-1,1])box(name+' jamb',[x+side*(width/2-.07),y+1.16,front],[.14,2.32,.06],'stainless','interior',true);
    box(name+' header',[x,y+2.36,front],[width,.08,.06],'stainless','interior',true);
    // Inward-open door lies beside the divider and leaves the central lane free.
    box(name+' open door',[x+width/2-.08,y+1.15,front+Math.sign(back-front)*.44],[.05,2.26,.88],'rubber','interior',true);
  }
  // A visible break between the two right groups; underside of retained lounge
  // slab is y+2.7. Existence is testimony; section/location are estimates.
  box('Panorama WC group-break column',[-17.075,y+1.35,-.85],[.38,2.7,.6],'darkConcrete','interior',true);
  for(const part of layout.parts.slice(firstPart))part.interiorTopology=true;
}

export function addPanoramaSanitaryFixtures(layout,{fixture,box,part,rod,assemblyCollision}){
  const firstPart=layout.parts.length;
  for(const c of cubicles)fixture('panorama-wc-pan-'+c.id,[c.x,13.25,c.pan],['I21','V20','V21'],
    {height:.48,group:c.group,placement:'Estimated metric fit; I21 photograph floor attribution unresolved'},()=>{
      const rear=Math.sign(c.back-c.front);
      part('hollow steel pan',[0,.24,0],[.4,.48,.56],'stainless','wc-bowl',true);
      // Fixtures keep metre-sized forms while the room panels are calibrated.
      // Fit the plate to the actual inner back face, with a 1mm seating overlap.
      const anchor=studyToSite({x:c.x,y:13.25,z:c.pan});
      const back=studyToSite({x:c.x,y:13.25,z:c.back-rear*.03});
      const plate=[back.x-anchor.x,.94,back.z-anchor.z-rear*.0165];
      box('flush plate',plate,[.23,.27,.035],'stainless',true);
      // I21 shows a rear casing against the panel, not a disconnected exposed
      // supply rod. Conceal the supply in a fitted casing; keep the bowl open.
      const casingEnd=Math.abs(back.z-anchor.z)+.001,casingStart=.23;
      box('rear casing',[plate[0]/2,.2,rear*(casingStart+casingEnd)/2],
        [.22,.4,casingEnd-casingStart],'stainless',true);
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
  .map(([x,z])=>{const p=adjacentPanoramaPoint(panoramaStudyPoint([x,13.25,z]));return{x:p[0],y:p[1],z:p[2]};});
export function panoramaSanitaryAt(position){
  return Math.abs(position.y-panoramaSection.floor)<.15&&corners.every((a,i)=>{
    const b=corners[(i+1)%4];
    return (b.x-a.x)*(position.z-a.z)-(b.z-a.z)*(position.x-a.x)>=0;
  });
}
