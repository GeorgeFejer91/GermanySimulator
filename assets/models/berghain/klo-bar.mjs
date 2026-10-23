import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

const footprints={klo:{x:[-21.5,-7.25],z:[-3.5,9.2]},toilets:{x:[-21.5,-7.25],z:[-20.7,-3.5]}};
const zones=Object.entries(footprints).map(([name,{x,z}])=>({name,polygon:
  [[x[0],z[0]],[x[1],z[0]],[x[1],z[1]],[x[0],z[1]]].map(([x,z])=>studyToSite({x,y:6.65,z}))}));
export function kloRoomAt(position){
  if(Math.abs(position.y-6.65)>.15)return null;
  return zones.find(({polygon})=>polygon.every((a,i)=>{
    const b=polygon[(i+1)%polygon.length];
    return (b.x-a.x)*(position.z-a.z)-(b.z-a.z)*(position.x-a.x)>=-1e-7;
  }))?.name||null;
}

export const kloMaterials={
  kloRed:{color:'#713b38',roughness:.96},
  stainless:{color:'#c2c6c2',roughness:.43,metalness:.45},
  kloWarm:{color:'#e2c18a',roughness:.55,emissive:'#ffb754',emissiveIntensity:1.05}
};

export function addKloRooms(layout,{box}){
  const floor=6.65,ceiling=9.8;
  layout.kloBar={sources:['ART04','ART14','I19','I21'],floorHeight:floor,ceilingHeight:ceiling,
    confidence:'Photographed architectural forms; floor assignment, footprint, connections, counts and dimensions estimated',
    artwork:{artist:'Joseph Marr',title:'Together',date:2013,lengthMetres:9,
      material:'Cola-flavoured sugar preserved with polyurethane',status:'Figure sequence not yet modelled'},
    toiletDates:[2009,2013,2015],toiletGalleryAssignment:'Photographs span multiple refurbishments; individual floor/date unresolved',
    barFootprint:footprints.klo,toiletFootprint:footprints.toilets};
  box('Klo red ceiling',[-14.375,ceiling+.08,2.85],[14.25,.16,12.7],'kloRed','interior',true);
  box('WC concrete ceiling',[-14.375,ceiling+.08,-12.1],[14.25,.16,17.2],'darkConcrete','interior',true);
  box('Klo bar red back wall',[-15.95,floor+1.575,-3.5],[11.1,3.15,.16],'kloRed','interior',true);
  box('Klo WC doorway lintel',[-8.825,floor+2.79,-3.5],[3.15,.72,.16],'darkConcrete','interior',true);
  box('Klo red south wall',[-14.375,floor+1.575,9.2],[14.25,3.15,.16],'kloRed','interior',true);
  box('Klo red west lining',[-21.55,floor+1.575,2.85],[.08,3.15,12.7],'kloRed','interior',true);
  for(const [a,b]of [[-20.7,2.5],[5.5,9.2]])
    box('Klo east partition',[-7.25,floor+1.575,(a+b)/2],[.16,3.15,b-a],'darkConcrete','interior',true);
  box('Klo entry lintel',[-7.25,floor+2.79,4],[.16,.72,3],'darkConcrete','interior',true);
  box('WC north partition',[-14.375,floor+1.575,-20.7],[14.25,3.15,.16],'darkConcrete','interior',true);
  for(let i=0;i<4;i++){
    const z=-10-i*2;
    box('WC cubicle back',[-20.3,floor+1.35,z],[.07,2.45,1.8],'stainless','interior',true);
    for(const dz of [-.9,.9])
      box('WC cubicle side',[-18.85,floor+1.35,z+dz],[2.9,2.45,.07],'stainless','interior',true);
    for(const dz of [-.76,.76])
      box('WC cubicle door jamb',[-17.4,floor+1.35,z+dz],[.09,2.45,.28],'stainless','interior',true);
    box('WC cubicle header',[-17.4,floor+2.59,z],[.09,.12,1.8],'stainless','interior',true);
    if(i%2)box('WC closed door',[-17.4,floor+1.34,z],[.065,2.38,1.15],'stainless','interior',true);
    else box('WC parked open door',[-18.1,floor+1.34,z+.72],[1.35,2.38,.065],'stainless','interior',true);
    for(const x of [-20.25,-17.45])for(const dz of [-.85,.85])
      box('WC cubicle foot',[x,floor+.075,z+dz],[.12,.15,.12],'stainless','interior',true);
    for(const y of [2.62,2.99])
      box('WC cubicle transom frame',[-17.4,floor+y,z],[.07,.035,1.8],'stainless','interior');
    for(const dz of [-.87,.87])
      box('WC cubicle transom upright',[-17.4,floor+2.805,z+dz],[.07,.37,.03],'stainless','interior');
    for(let wire=0;wire<22;wire++)
      box('WC cubicle upper mesh',[-17.4,floor+2.805,z-.84+wire*.08],[.018,.34,.012],'steel','interior');
    for(let wire=0;wire<5;wire++)
      box('WC cubicle upper mesh',[-17.4,floor+2.65+wire*.075,z],[.018,.012,1.7],'steel','interior');
    box('WC cubicle warm transom',[-18.8,floor+2.81,z],[2.3,.035,.045],'kloWarm','interior');
  }
}

export function createKloGeometries(){
  const profile=[[.27,-.5],[.35,-.47],[.37,.17],[.5,.4],[.5,.5],[.41,.5],[.39,.4],[.3,-.15],[.12,-.23],[0,-.23]];
  return {'wc-bowl':new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),24)};
}

export function addKloFixtures(layout,{fixture,box,part,cylinder,rod,assemblyCollision}){
  const floor=layout.kloBar.floorHeight,across=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
  function grid(name,x0,x1,y0,y1,z,pitch=.1){
    for(let x=x0;x<=x1+.001;x+=pitch)box(name,[x,(y0+y1)/2,z],[.014,y1-y0,.018],'steel');
    for(let y=y0;y<=y1+.001;y+=pitch)box(name,[(x0+x1)/2,y,z],[x1-x0,.014,.018],'steel');
  }
  fixture('klo-switchgear-bar',[-14.5,floor,1],['ART04','ART14','I19'],
    {height:3.02,displayHeight:1.15,displayCaseHeight:.32,footprint:'Estimated segmented counter;9m is artwork length'},()=>{
      for(const [x,width]of [[-4.7,1.75],[.65,6.5]]){
        box('lower cabinet',[x,.43,0],[width,.86,.74],'rubber',true);
        box('case base',[x,.89,0],[width+.06,.06,.84],'steel',true);
        box('display glass',[x,1.07,.424],[width,.32,.018],'lightGlass');
        box('display glass',[x,1.07,-.424],[width,.32,.018],'lightGlass');
        box('display glass',[x,1.24,0],[width,.016,.84],'lightGlass');
        for(const side of [-1,1]){
          box('display glass',[x+side*width/2,1.07,0],[.018,.32,.84],'lightGlass');
          box('case corner',[x+side*width/2,1.07,.43],[.025,.36,.025],'steel');
        }
        for(const y of [.91,1.245])for(const z of [-.43,.43])
          box('case frame',[x,y,z],[width+.05,.035,.035],'steel');
        box('display strip light',[x,.937,-.32],[width-.12,.025,.045],'kloWarm');
      }
      box('return cabinet',[3.84,.43,-1.34],[.74,.86,2.68],'rubber',true);
      for(const x of [3.41,4.27]){
        box('display glass',[x,1.07,-1.34],[.018,.32,2.68],'lightGlass');
        for(const y of [.91,1.245])box('return frame',[x,y,-1.34],[.035,.035,2.73],'steel');
      }
      box('return case top',[3.84,1.24,-1.34],[.86,.016,2.68],'lightGlass');
      box('return case end',[3.84,1.07,-2.68],[.86,.32,.018],'lightGlass');
      box('return strip light',[3.84,.937,-1.34],[.045,.025,2.5],'kloWarm');
      for(const x of [-5.62,-3.78,-2.63,0,3.93]){
        box('retained switchgear upright',[x,1.51,-.04],[.13,3.02,.17],'steel',true);
        for(const y of [.2,2.15,2.95])box('frame bolt',[x,y,.058],[.045,.045,.018],'aluminium');
      }
      for(const y of [2.13,2.99])box('upper switchgear beam',[-.845,y,-.04],[9.68,.13,.17],'steel');
      for(const [a,b]of [[-5.55,-3.85],[-3.7,-2.7],[-2.55,-.08],[.08,3.85]])grid('wire mesh',a,b,2.2,2.92,-.04);
      grid('staff gate mesh',-3.7,-2.7,.14,2.08,-.04);
      for(const y of [.12,1.05,2.12])box('staff gate frame',[-3.2,y,-.04],[1.12,.045,.08],'steel');
      for(const y of [.55,1.58]){
        box('switch mechanism',[0,y,.1],[.19,.21,.13],'rubber');
        rod('switch handle',[-.12,y+.19,.19],[.12,y+.19,.19],.04,'rubber');
        for(const x of [-.12,.12])rod('switch lever',[x,y+.19,.19],[0,y,.18],.03,'steel');
      }
      box('bar rear cabinet',[-.6,.47,-2.65],[6.7,.94,.65],'steel',true);
      for(const y of [1.2,2.05])box('bottle shelf',[-.6,y,-2.6],[6.7,.045,.55],'steel');
      for(let i=0;i<22;i++){
        cylinder('bottle',[-3.6+i*.285,2.22,-2.6],.07,.3,'glass');
        cylinder('bottle neck',[-3.6+i*.285,2.4,-2.6],.028,.07,'glass');
      }
      for(let row=0;row<5;row++)for(let col=0;col<8;col++)
        box('glass block',[1.35+col*.24,1.24+row*.24,-2.84],[.215,.215,.07],'glass');
      rod('exposed ceiling pipe',[-5.6,2.88,-2.3],[4.1,2.88,-2.3],.075,'steel');
      for(const x of [-4.9,-1.2,2.5])box('warm bar batten',[x,2.12,-2.3],[1.1,.075,.07],'kloWarm');
      // The gate and cabinets enclose staff-only space; retain conservative assembly clearance.
      assemblyCollision();
    });
  const stoolPositions=[[-5.2,1.4],[-4.4,1.4],[-1.9,1.4],[-.9,1.4],[.1,1.4],[1.1,1.4],[2.1,1.4],[3.1,1.4],[4.7,-.65],[4.7,-1.65]];
  const anchor=layout.fixtures.find(f=>f.id==='klo-switchgear-bar').anchor;
  for(const [i,[x,z]]of stoolPositions.entries()){
    // Fixture anchors use author coordinates; offsets below keep round/splayed details in real metres.
    fixture('klo-stool-'+i,[-14.5,floor,1],['ART04'],{height:.77,width:.52,placement:'Estimated from installation06'},()=>{
      part('seat',[x,.745,z],[.36,.05,.36],'rubber','cylinder',true);
      part('foot ring',[x,.28,z],[.4,.4,1],'steel','ring',false,across);
      for(const dx of [-1,1])for(const dz of [-1,1])
        rod('splayed leg',[x+dx*.15,.72,z+dz*.15],[x+dx*.25,.025,z+dz*.25],.025,'steel',true);
      assemblyCollision();
    });
  }
  layout.kloBar.barAnchor=anchor;
  for(let i=0;i<4;i++)fixture('wc-pan-'+i,[-19.7,floor,-10-i*2],['I21'],{height:.48,width:.4,depth:.56},()=>{
    part('hollow steel pan',[0,.26,0],[.56,.48,.4],'stainless','wc-bowl',true);
    box('flush plate',[-.45,.94,0],[.035,.27,.23],'stainless',true);
    cylinder('flush button',[-.426,.94,0],.045,.025,'steel',new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2));
    part('paper canister',[.12,.83,.66],[.25,.10,.25],'stainless','cylinder',true,across);
    box('paper slot',[.12,.73,.721],[.12,.018,.008],'rubber');
    rod('flush supply',[-.28,.1,0],[-.28,.7,0],.035,'stainless',true);
    for(const z of [-.28,.28])rod('coat hook',[-.43,1.8,z],[-.37,1.8,z],.018,'stainless',true);
  });
  for(let i=0;i<5;i++)fixture('wc-tube-'+i,[-17.28,floor,-9.1-i*2],['I21'],{height:2.25,width:.09},()=>{
    box('light backing',[0,1.24,0],[.06,2.25,.11],'stainless',true);
    cylinder('vertical diffuser',[.035,1.24,0],.045,2.17,'opal');
    for(let j=0;j<12;j++)box('light louvre',[.065,.19+j*.19,0],[.06,.025,.1],'stainless',true);
  });
  fixture('wc-wash-core',[-13.7,floor,-5.5],['I21'],{width:2.8,height:2.9,sinkHeight:.88},()=>{
    box('steel core',[0,1.34,0],[2.8,2.5,.19],'stainless',true);
    for(const side of [-1,1]){
      const z=side*.4;
      box('trough bottom',[0,.76,z],[2.8,.045,.58],'stainless',true);
      box('trough front',[0,.84,side*.69],[2.8,.16,.035],'stainless',true);
      for(const x of [-1.37,1.37]){
        box('trough end',[x,.84,z],[.04,.16,.58],'stainless',true);
        rod('trough leg',[x,.02,side*.65],[x,.78,side*.65],.035,'stainless',true);
      }
      for(const x of [-.85,0,.85]){
        rod('tap spout',[x,1.1,side*.12],[x,1.1,side*.39],.045,'stainless',true);
        rod('tap outlet',[x,1.1,side*.39],[x,1.04,side*.39],.035,'stainless',true);
      }
      for(const x of [-.7,.7]){
        rod('trap pipe',[x,.76,z],[x,.35,z],.045,'stainless',true);
        rod('trap pipe',[x,.35,z],[x,.35,side*.12],.045,'stainless',true);
        rod('trap pipe',[x,.35,side*.12],[x,.56,side*.12],.045,'stainless',true);
      }
    }
    for(const y of [2.6,2.91])box('transom frame',[0,y,0],[2.8,.035,.19],'stainless');
    for(let i=0;i<28;i++)box('upper mesh',[-1.35+i*.1,2.76,0],[.012,.28,.04],'steel');
    box('upper warm batten',[0,2.76,0],[2.6,.05,.05],'kloWarm');
    // Both troughs exclude a standing body across this footprint. One enclosure
    // also lets an invalid deep start recover past its front/end lips locally.
    assemblyCollision();
    layout.solids=layout.solids.filter(s=>s.renderPart?.fixture!=='wc-wash-core');
  });
  for(let i=0;i<3;i++)fixture('wc-bulkhead-'+i,[-7.55,floor,-5.5-i*5],['I21'],{height:.25,width:.14},()=>{
    part('oval diffuser',[0,2.2,0],[.12,.25,.14],'warm','sphere');
    rod('light cage',[.075,2.07,0],[.075,2.33,0],.012,'steel');
    rod('light cage',[.075,2.2,-.08],[.075,2.2,.08],.012,'steel');
    box('hand dryer',[-.12,1.25,0],[.22,.27,.34],'stainless',true);
    box('dryer nozzle',[-.23,1.15,0],[.13,.08,.13],'stainless',true);
  });
  fixture('wc-floor-drains',[-13.7,floor,-8],['I21'],{width:.18,placement:'Estimated floor-grate positions'},()=>{
    for(const z of [0,-4]){
      box('grate recess',[0,.003,z],[.19,.006,.19],'rubber');
      for(let i=0;i<7;i++)for(const axis of [0,2]){
        const center=[0,.008,z],size=[.18,.007,.18];center[axis]+=-.075+i*.025;size[axis]=.009;
        box('floor grate',center,size,'stainless');
      }
    }
  });
}
