import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';
import {speakerSpecifications,panoramaSpeakerSpecifications} from './speaker-geometries.mjs';

export function addSoundSystem(layout){
  const replaced=new Set(['speaker stack','speaker horn']);
  layout.parts=layout.parts.filter(p=>!replaced.has(p.name));
  layout.solids=layout.solids.filter(s=>!replaced.has(s.name));
  layout.soundSystem={sources:['S05','S06','S11'],configuration:'Reported post-2023 main-hall component arrangement',
    confidence:'Community-reported components; currentness, room anchors, finish and mounting inferred',components:[]};
  const surfaces={cabinet:'rubber',horn:'speakerViolet',lining:'rubber',hardware:'aluminium'};
  function solid(part){
    const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
    layout.solids.push({name:part.name+' clearance',equipment:part.equipment,renderPart:part,
      x:[bounds.min.x,bounds.max.x],y:[bounds.min.y,bounds.max.y],z:[bounds.min.z,bounds.max.z]});
  }
  function mounting(id,base,offset,size){
    const transform=base.clone().multiply(new THREE.Matrix4().makeTranslation(...offset)).scale(new THREE.Vector3(...size));
    const part={name:id,equipment:id,center:new THREE.Vector3().setFromMatrixPosition(transform).toArray(),
      size,material:'steel',shape:'box',section:'interior',matrix:transform.toArray()};
    layout.parts.push(part);solid(part);
  }
  function component(id,type,matrix,assembly){
    const specification=speakerSpecifications[type],size=[specification.width,specification.height,specification.depth];
    const transform=matrix.clone().scale(new THREE.Vector3(...size));
    const center=new THREE.Vector3().setFromMatrixPosition(matrix).toArray();
    const metadata={id,type,assembly,units:'metres',dimensions:size,position:center,matrix:matrix.toArray(),
      sources:['S05',specification.source],drawing:specification.drawing,
      confidence:'Manufacturer envelope; internal contours, mounting and room placement inferred'};
    layout.soundSystem.components.push(metadata);
    for(const [surface,material]of Object.entries(surfaces)){
      const part={name:id+' '+surface,equipment:id,center,size,material,shape:'speaker-'+type+'-'+surface,section:'interior',matrix:transform.toArray()};
      layout.parts.push(part);
      if(surface==='cabinet')solid(part);
    }
  }
  const mapped=(x,y,z)=>{const p=studyToSite({x,y,z});return new THREE.Vector3(p.x,p.y,p.z);};
  const matrix=(position,yaw=0,pitch=0)=>new THREE.Matrix4().compose(position,
    new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ')),new THREE.Vector3(1,1,1));
  const bass=speakerSpecifications.f218mk2,low=speakerSpecifications.evo6el,high=speakerSpecifications.evo6eh;
  let stack=0;
  for(const x of [-1.5,11.5])for(const z of [-15,4]){
    const anchor=mapped(x,5.45,z),target=mapped(5,5.45,-5.5),yaw=Math.atan2(target.x-anchor.x,target.z-anchor.z);
    const assembly='main-stack-'+stack++,base=matrix(anchor,yaw);
    for(let level=0;level<3;level++)component(assembly+'-bass-'+level,'f218mk2',base.clone().multiply(
      new THREE.Matrix4().makeTranslation(0,bass.height*(level+.5),0)),assembly);
    mounting(assembly+' mounting board',base,[0,bass.height*3+.014,0],[1.33,.028,.62]);
    for(const side of [-1,1]){
      const tilt=8*Math.PI/180,fan=side*19*Math.PI/180;
      const tower=base.clone().multiply(matrix(new THREE.Vector3(side*.32,bass.height*3+.07,0),fan,tilt));
      mounting(assembly+' tilted cradle '+side,tower,[0,-.023,0],[.30,.046,.40]);
      let height=0;
      for(const [level,type,specification] of [[0,'evo6el',low],[1,'evo6eh',high],[2,'evo6el',low]]){
        const placement=tower.clone().multiply(new THREE.Matrix4().makeTranslation(0,height+specification.height/2,0));
        if(level===2)placement.multiply(new THREE.Matrix4().makeRotationZ(Math.PI));
        component(assembly+'-tower-'+side+'-'+level,type,placement,assembly);
        height+=specification.height;
      }
    }
  }
  const sub=speakerSpecifications.f124,anchor=mapped(-1.6,5.45,-5.5),wall=matrix(anchor,Math.PI/2);
  for(let column=0;column<2;column++)for(let row=0;row<3;row++)component('main-subwall-'+column+'-'+row,'f124',
    wall.clone().multiply(new THREE.Matrix4().makeTranslation((column-.5)*(sub.width+.012),(row+.5)*sub.height,0)),'main-subwall');
  for(const [index,x]of [-1.5,11.5].entries()){
    const position=mapped(x,9.6,-21.1),target=mapped(5,7,-5.5);
    component('main-satellite-'+index,'evo6eh',matrix(position,Math.atan2(target.x-position.x,target.z-position.z),.12),'main-satellites');
    const wall=mapped(x,9.6,-21.78),difference=wall.clone().sub(position),length=difference.length();
    mounting('main-satellite-'+index+' wall bracket',matrix(position.clone().add(wall).multiplyScalar(.5),Math.atan2(difference.x,difference.z)),[0,0,0],[.065,.09,length]);
  }
}

// S13/V19 document removal of the floor wall in December 2023. Fit the
// reported overhead array after room registration, preserving each complete
// manufacturer's envelope. Position, down-firing orientation and supports
// are a provisional visual reconstruction, not a surveyed rigging design.
export function suspendMainSubwall(layout){
  const components=layout.soundSystem.components.filter(c=>c.assembly==='main-subwall');
  const oldCenter=new THREE.Vector3();
  for(const c of components)oldCenter.add(new THREE.Vector3(...c.position));
  oldCenter.multiplyScalar(1/components.length);
  const center=new THREE.Vector3(-5.1,13,-.6);
  const transform=new THREE.Matrix4().makeTranslation(...center.toArray())
    .multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2))
    .multiply(new THREE.Matrix4().makeTranslation(...oldCenter.clone().negate().toArray()));
  const ids=new Set(components.map(c=>c.id));
  const updateBounds=solid=>{
    const b=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5))
      .applyMatrix4(new THREE.Matrix4().fromArray(solid.renderPart.matrix));
    for(const axis of ['x','y','z'])solid[axis]=[b.min[axis],b.max[axis]];
    solid.polygon=[[b.min.x,b.min.z],[b.max.x,b.min.z],[b.max.x,b.max.z],[b.min.x,b.max.z]];
  };
  for(const p of layout.parts.filter(p=>ids.has(p.equipment))){
    p.matrix=transform.clone().multiply(new THREE.Matrix4().fromArray(p.matrix)).toArray();
    p.center=p.matrix.slice(12,15);
  }
  for(const s of layout.solids.filter(s=>ids.has(s.equipment)))updateBounds(s);
  for(const c of components){
    c.matrix=transform.clone().multiply(new THREE.Matrix4().fromArray(c.matrix)).toArray();
    c.position=c.matrix.slice(12,15);c.sources=[...c.sources,'S13','V19'];
    c.confidence='Manufacturer envelope; reported suspension; height, anchor, down-firing orientation and mounting inferred';
  }
  const support=(name,position,size)=>{
    const matrix=new THREE.Matrix4().makeScale(...size).setPosition(...position);
    const p={name:'main-subwall '+name,equipment:'main-subwall-support',section:'interior',
      shape:'box',material:'steel',instanceTone:.94,center:position,size,matrix:matrix.toArray()};
    const s={name:p.name+' clearance',equipment:p.equipment,renderPart:p};
    updateBounds(s);layout.parts.push(p);layout.solids.push(s);return p;
  };
  const back=13+speakerSpecifications.f124.depth/2;
  for(const x of [-5.84,-4.36])support('rear longitudinal rail',[x,back+.04,-.6],[.08,.08,3.056]);
  for(const z of [-2.088,-1.096,-.104,.888])support('rear cross rail',[-5.1,back+.12,z],[1.56,.08,.08]);
  const cableBottom=back+.16,roof=layout.calibration.mainRoof,cableTop=roof-.025;
  const anchors=[];
  for(const x of [-5.84,-4.36])for(const z of [-2.088,.888]){
    support('suspension cable',[x,(cableBottom+cableTop)/2,z],[.018,cableTop-cableBottom,.018]);
    support('roof anchor plate',[x,roof-.0125,z],[.18,.025,.18]);
    anchors.push({lower:[x,cableBottom,z],upper:[x,cableTop,z]});
  }
  layout.soundSystem.sources=[...layout.soundSystem.sources,'S13','V19'];
  layout.soundSystem.configuration='Reported main-hall components with provisional post-December-2023 suspended sub array';
  layout.soundSystem.suspension={sources:['S13','V19'],reportedSince:'2023-12',
    center:center.toArray(),cabinetUnderside:13-speakerSpecifications.f124.depth/2,
    formerCenter:oldCenter.toArray(),anchors,
    confidence:'Suspension reported; exact height, horizontal anchor, orientation, support construction and current inventory unverified',
    scope:'Visual arrangement only; no structural capacity or acoustic simulation'};
}

// S12's dated installation photographs/interview and S17's later relocation
// reports describe a different PA upstairs. All room anchors and rigging here
// are an explicit visual fit; these are not an engineered installation plan.
export function fitPanoramaSoundSystem(layout){
  const toneBatches=new Map();
  for(const p of layout.parts){
    const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');
    if(!toneBatches.has(key))toneBatches.set(key,[]);toneBatches.get(key).push(p);
  }
  for(const batch of toneBatches.values())batch.forEach((p,i)=>p.instanceTone??=.84+((i*193+batch.length*37)%101)/625);
  layout.parts=layout.parts.filter(p=>p.name!=='Panorama speaker');
  layout.solids=layout.solids.filter(p=>p.name!=='Panorama speaker');
  const pa=layout.soundSystem.panorama={sources:['S02','S12','S14','S15','S17'],
    configuration:'Dated four-point/four-module Studt form study with reported later overhead subs',
    confidence:'2017 count and photographed forms; later suspension reported; current inventory, revisions, room anchors, splay and support design inferred/unverified',
    scope:'Visual reconstruction only; no acoustic prediction or structural capacity claim',
    unresolved:['Current low-mid unit placement','Exact Funktion-One DJ monitor models and mounts'],components:[],hangs:[]};
  const matrix=(center,yaw=0,pitch=0)=>new THREE.Matrix4().compose(new THREE.Vector3(...center),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ')),new THREE.Vector3(1,1,1));
  const add=(name,shape,size,transform,material='steel',tone=.94,equipment='panorama-pa-support')=>{
    const m=transform.clone().scale(new THREE.Vector3(...size));
    const p={name,equipment,shape,size,center:m.elements.slice(12,15),matrix:m.toArray(),material,section:'interior',instanceTone:tone};
    layout.parts.push(p);return p;
  };
  const solid=p=>{
    const ext=p.shape==='ring'?[.535,.535,.035]:[.5,.5,.5];
    const b=new THREE.Box3(new THREE.Vector3(...ext.map(v=>-v)),new THREE.Vector3(...ext)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
    layout.solids.push({name:p.name+' clearance',equipment:p.equipment,renderPart:p,x:[b.min.x,b.max.x],y:[b.min.y,b.max.y],z:[b.min.z,b.max.z]});
  };
  const box=(name,size,m,material='steel')=>{const p=add(name,'box',size,m,material);solid(p);return p;};
  const component=(id,type,m,assembly)=>{
    const spec=panoramaSpeakerSpecifications[type],size=[spec.width,spec.height,spec.depth];
    pa.components.push({id,type,assembly,units:'metres',dimensions:size,position:m.elements.slice(12,15),matrix:m.toArray(),
      sources:['S12',spec.source,...(type==='s218study'?['S17']:[])],
      confidence:'Manufacturer envelope study; actual installed revision, contour, current count, anchor and orientation inferred'});
    for(const [surface,material,tone]of [['cabinet','rubber',.94],['grille','steel',.68],['lining','rubber',.48],['hardware','aluminium',.8]]){
      const p=add(id+' '+surface,'speaker-'+type+'-'+surface,size,m,material,tone,id);if(surface==='cabinet')solid(p);
    }
  };
  let index=0;
  for(const x of [-12,-3.7])for(const z of [12.5,18]){
    const id='panorama-array-'+index++,yaw=Math.atan2(-7.8-x,14.8-z),base=matrix([x,0,z],yaw);
    const top=13.34,hinge=new THREE.Vector3(0,top,.185),positions=[];
    for(let i=0;i<4;i++){
      const pitch=(2+4*i)*Math.PI/180,rotation=new THREE.Matrix4().makeRotationX(pitch);
      const center=new THREE.Vector3(0,-.195/2,-.370/2).applyMatrix4(rotation).add(hinge);
      const m=base.clone().multiply(matrix(center.toArray(),0,pitch));
      component(id+'-module-'+i,'s26510l',m,id);positions.push(m.elements.slice(12,15));
      // Small visible links join neighbouring front hinge points. Their
      // precise dimensions and fastener design are intentionally approximate.
      for(const side of [-1,1])box(id+' hinge link '+i+' '+side,[.012,.045,.025],
        base.clone().multiply(matrix([side*.303,hinge.y,hinge.z-.01])),'aluminium');
      hinge.add(new THREE.Vector3(0,-.195,0).applyMatrix4(rotation));
    }
    const frameCenter=[0,13.395,0];
    const frame=add(id+' flight frame','panorama-flightframe',[.605,.12,.370],base.clone().multiply(matrix(frameCenter)));solid(frame);
    // An open shackle intersects the frame crossmember and upper strap.
    const shackle=add(id+' shackle','ring',[.075,.075,.075],base.clone().multiply(matrix([0,13.4705,-.04])),'paRedMetal');solid(shackle);
    box(id+' suspension strap',[.035,13.93-13.50,.012],base.clone().multiply(matrix([0,(13.93+13.50)/2,-.04])));
    box(id+' ceiling plate',[.10,.02,.10],base.clone().multiply(matrix([0,13.94,-.04])));
    pa.hangs.push({id,anchor:[x,13.95,z],yaw,modules:positions,
      confidence:'Four-module photographic form; individual angles, ceiling registration and hardware estimated'});
  }
  const center=[-7.5,12.7,16.6];
  for(let column=0;column<3;column++)for(let row=0;row<2;row++)component('panorama-sub-'+column+'-'+row,'s218study',
    matrix([center[0]+(column-1)*1.2,center[1],center[2]+(row-.5)*.6],0,Math.PI/2),'panorama-overhead-subs');
  for(const z of [16.02,17.18])box('panorama sub cabinet rail',[3.58,.08,.08],matrix([-7.5,13.11,z]));
  for(const x of [-9.25,-7.5,-5.75])box('panorama sub cross rail',[.08,.08,1.26],matrix([x,13.19,16.6]));
  const anchors=[];
  for(const x of [-9.25,-5.75])for(const z of [16.02,17.18]){
    box('panorama sub suspension strap',[.018,.70,.018],matrix([x,13.58,z]));
    box('panorama sub ceiling plate',[.12,.02,.12],matrix([x,13.94,z]));
    anchors.push({lower:[x,13.23,z],upper:[x,13.93,z]});
  }
  pa.subwoofers={sources:['S12','S15','S17'],center,anchors,
    confidence:'Six is a 2017 count; ceiling/down-firing reports are from 2025–2026; current revision, count, arrangement and mounting unverified'};
}
