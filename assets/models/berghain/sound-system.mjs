import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';
import {speakerSpecifications} from './speaker-geometries.mjs';

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
