import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';
import {addPanoramaServiceFixtures} from './panorama-services.mjs';

export function createAcousticGrilleGeometry() {
  const plate=new THREE.Shape();
  plate.moveTo(-.675,-.19);plate.lineTo(.675,-.19);plate.lineTo(.675,.19);plate.lineTo(-.675,.19);plate.closePath();
  for(let row=0;row<3;row++)for(let hole=0;hole<8;hole++){
    const opening=new THREE.Path();
    opening.absarc(-.53+hole*.15,-.11+row*.105,.0285,0,Math.PI*2,true);
    plate.holes.push(opening);
  }
  return new THREE.ExtrudeGeometry(plate,{depth:.018,bevelEnabled:false,curveSegments:12});
}

export function addInteriorFixtures(layout) {
  const replaced=new Set(['foyer concrete seat','foyer seat back','Panorama bar counter','Panorama DJ desk',
    'lounge concrete seat','lounge cushion']);
  layout.parts=layout.parts.filter(part=>!replaced.has(part.name));
  layout.solids=layout.solids.filter(solid=>!replaced.has(solid.name));
  layout.fixtures=[];
  let current;
  const identity=new THREE.Quaternion(), horizontal=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
  function fixture(id,position,sources,dimensions,build) {
    const mapped=studyToSite({x:position[0],y:position[1],z:position[2]});
    current={id,anchor:[mapped.x,mapped.y,mapped.z],sources,dimensions,
      confidence:'Photo-derived form; dimensions and placement inferred',parts:[]};
    layout.fixtures.push(current); build(); delete current.parts;
  }
  function part(name,offset,size,material,shape='box',solid=false,rotation=identity) {
    const center=offset.map((value,axis)=>value+current.anchor[axis]);
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...center),rotation,new THREE.Vector3(...size)).toArray();
    const rendered={name:current.id+' '+name,fixture:current.id,center,size,material,shape,section:'interior',matrix};
    layout.parts.push(rendered); current.parts.push(rendered);
    if(solid) {
      const bounds=boundsOf([rendered]);
      layout.solids.push({name:rendered.name,x:[bounds.min.x,bounds.max.x],y:[bounds.min.y,bounds.max.y],
        z:[bounds.min.z,bounds.max.z],renderPart:rendered});
    }
    return rendered;
  }
  const box=(name,offset,size,material,solid=false)=>part(name,offset,size,material,'box',solid);
  const cylinder=(name,offset,diameter,height,material,rotation=identity)=>part(name,offset,[diameter,height,diameter],material,'cylinder',false,rotation);
  function rod(name,start,end,diameter,material='aluminium',solid=false) {
    const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),direction=b.clone().sub(a);
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    return part(name,a.add(b).multiplyScalar(.5).toArray(),[diameter,direction.length(),diameter],material,'cylinder',solid,rotation);
  }
  function boundsOf(parts) {
    const bounds=new THREE.Box3();
    for(const item of parts) {
      const local=item.shape==='ring'?new THREE.Box3(new THREE.Vector3(-.535,-.535,-.035),new THREE.Vector3(.535,.535,.035)):
        new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5));
      bounds.union(local.applyMatrix4(new THREE.Matrix4().fromArray(item.matrix)));
    }
    return bounds;
  }
  function assemblyCollision() {
    const bounds=boundsOf(current.parts);
    layout.solids.push({name:current.id+' assembly clearance',fixture:current.id,confidence:'Conservative visible-assembly bounds',
      x:[bounds.min.x,bounds.max.x],y:[bounds.min.y,bounds.max.y],z:[bounds.min.z,bounds.max.z]});
  }
  for(let i=0;i<2;i++) fixture('foyer-channel-seat-'+i,[15,.05,11+i*7],['I09'],
    {width:3.2,depth:1.35,height:1.02,seatHeight:.48},()=>{
      box('concrete seat slab',[0,.22,0],[3.2,.32,1.35],'concrete',true);
      box('back channel',[0,.69,.585],[3.2,.66,.18],'concrete',true);
      for(const x of [-1.51,1.51])box('channel end',[x,.64,0],[.18,.76,1.35],'concrete',true);
      for(const x of [-.73,.73]) {
        box('seat cushion',[x,.43,-.04],[1.4,.10,1.02],'upholstery',true);
        box('back cushion',[x,.73,.46],[1.4,.27,.11],'upholstery');
      }
    });

  const barPosition=[-18,13.25,-10];
  fixture('panorama-bar',barPosition,['A13'],{height:1.13,length:8.9,returnLength:3.8},()=>{
    box('cabinet',[0,.56,0],[.88,1.02,8.8],'rubber',true);
    box('dark worktop',[0,1.07,0],[1.2,.12,8.9],'rubber',true);
    box('return cabinet',[1.3,.56,4.25],[3.8,1.02,.88],'rubber',true);
    box('return worktop',[1.3,1.07,4.25],[3.8,.12,1.2],'rubber',true);
    for(let panel=0;panel<12;panel++) {
      const z=-4.01+panel*.73;
      box('lit front panel',[.458,.56,z],[.035,.88,.68],'opal');
      rod('panel frame',[.49,.1,z-.35],[.49,1,z-.35],.035);
    }
    for(let panel=0;panel<5;panel++)box('lit return panel',[-.18+panel*.73,.56,4.708],[.68,.88,.035],'opal');
    for(const y of [.1,1]) {
      rod('front frame',[.49,y,-4.4],[.49,y,4.4],.04);
      rod('return frame',[-.6,y,4.73],[3.2,y,4.73],.04);
    }
    rod('long foot rail',[.93,.25,-4.4],[.93,.25,4.4],.045,'aluminium',true);
    rod('return foot rail',[.2,.25,5.18],[3.2,.25,5.18],.045,'aluminium',true);
    for(const z of [-4,-2,0,2,4])rod('foot rail bracket',[.49,.25,z],[.93,.25,z],.035,'aluminium',true);
  });
  let stoolIndex=0;
  function stool(offset) {
    const anchor=studyToSite({x:barPosition[0],y:barPosition[1],z:barPosition[2]});
    fixture('panorama-stool-'+stoolIndex++,barPosition,['A13'],{width:.46,height:.77},()=>{
      current.anchor=[anchor.x+offset[0],anchor.y,anchor.z+offset[1]];
      cylinder('round seat',[0,.745,0],.39,.05,'aluminium');
      for(let leg=0;leg<4;leg++) {
        const angle=Math.PI/4+leg*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
        rod('splayed leg',[c*.12,.72,s*.12],[c*.28,.02,s*.28],.035);
        cylinder('floor foot',[c*.28,.0125,s*.28],.045,.025,'rubber');
      }
      part('foot ring',[0,.27,0],[.42,.42,.42],'aluminium','ring',false,horizontal);
      assemblyCollision();
    });
  }
  for(let z=-3.5;z<=3.5;z+=.875)stool([1.55,z]);
  for(const x of [.6,1.65,2.7])stool([x,5.5]);

  fixture('panorama-bottle-rack',[-20.5,13.25,-13],['A13'],{height:2.5,length:3,depth:.42},()=>{
    for(const x of [-.2,.2])for(const z of [-1.5,1.5])rod('upright',[x,.05,z],[x,2.5,z],.035,'steel');
    for(const y of [1.05,1.55,2.05]) {
      box('shelf',[0,y,0],[.45,.045,3.04],'steel',true);
      for(let bottle=0;bottle<12;bottle++) {
        const z=-1.36+bottle*.245,h=.21+(bottle%3)*.025;
        cylinder('bottle',[0,y+.03+h/2,z],.075,h,'glass');
        cylinder('bottle neck',[0,y+.03+h+.045,z],.032,.09,'glass');
      }
    }
    assemblyCollision();
  });

  fixture('panorama-dj-table',[-11,13.25,-18.5],['A13'],{width:3.6,depth:.86,height:1.06},()=>{
    box('table surface',[0,1.02,0],[3.6,.08,.86],'steel',true);
    for(const x of [-1.55,1.55])for(const z of [-.32,.32])rod('table leg',[x,.03,z],[x,1,z],.055,'steel');
    for(const x of [-1.05,1.05]) {
      box('deck',[x,1.11,0],[.78,.1,.57],'rubber');
      cylinder('platter',[x,1.17,0],.38,.025,'aluminium');
    }
    box('mixer',[0,1.12,0],[.51,.12,.6],'rubber');
    for(const x of [-.15,0,.15])for(const z of [-.16,0,.16])cylinder('mixer knob',[x,1.2,z],.035,.035,'aluminium');
    for(const x of [-1.73,1.73])rod('suspension',[x,1.08,.3],[x,layout.panoramaServices.ceilingHeight-13.28,.3],.018,'steel');
    assemblyCollision();
  });

  for(let i=0;i<3;i++){
    const width=i===2?1.6:3.25,padWidth=(width-.11)/2;
    fixture('panorama-banquette-'+i,[-18+i*4,13.25,7.7],['A13'],
      {width,depth:.9,height:.85,seatHeight:.43},()=>{
        box('seat base',[0,.22,0],[width,.32,.9],'upholstery',true);
        for(const side of [-1,1])box('seat pad',[side*(padWidth+.03)/2,.4,-.07],[padWidth,.12,.72],'upholstery',true);
        box('back',[0,.64,.36],[width,.42,.18],'upholstery',true);
      });
  }

  for(const [i,x] of [-13,-2,15].entries())fixture('foyer-pendant-'+i,[x,.05,15.5],['I08'],{width:1.15,height:.66},()=>{
    box('ribbed shade',[0,4.2,0],[1.15,.66,.8],'warm');
    for(const x of [-.59,.59])for(const z of [-.42,.42])rod('shade corner',[x,3.86,z],[x,4.54,z],.035,'rust');
    for(const x of [-.36,-.12,.12,.36])box('shade rib',[x,4.2,-.407],[.015,.63,.012],'pale');
    rod('suspension',[0,4.55,0],[0,6.22,0],.018,'steel');
  });
  const suspensionHeight=layout.panoramaServices.ceilingHeight-13.28;
  for(let i=0;i<3;i++)fixture('panorama-pendant-'+i,[-16,13.25,-15+i*4],['A13'],{lowestPoint:2.211,mountingHeight:suspensionHeight},()=>{
    rod('drop cable',[0,2.7,0],[0,suspensionHeight,0],.018,'steel');
    cylinder('neck',[0,2.58,0],.085,.28,'pale');
    for(let branch=0;branch<3;branch++) {
      const angle=branch*Math.PI*2/3,x=Math.cos(angle)*.14,z=Math.sin(angle)*.14;
      rod('three-way shade',[0,2.5,0],[x,2.24,z],.085,'pale');
      cylinder('lamp lens',[x,2.22,z],.055,.018,'warm');
    }
  });
  for(const x of [-19,-13,-7.5])for(const z of [-17,-12,-7])fixture('panorama-acoustic-'+x+'-'+z,[x,13.25,z],['A13','I11'],
    {width:1.35,height:.38,depth:.54,mountHeight:3.85},()=>{
      for(const y of [3.669,4.031])box('enclosure rim',[0,y,0],[1.35,.018,.54],'steel');
      for(const side of [-.666,.666])box('enclosure side',[side,3.85,0],[.018,.38,.54],'steel');
      box('enclosure back',[0,3.85,-.261],[1.35,.38,.018],'steel');
      box('dark internal lining',[0,3.85,-.235],[1.31,.34,.015],'rubber');
      part('perforated metal grille',[0,3.85,.27],[1,1,1],'steel','grille');
      rod('hanger',[0,4.05,0],[0,suspensionHeight,0],.018,'steel');
    });
  addPanoramaServiceFixtures(layout,{fixture,box,cylinder,rod});
}
