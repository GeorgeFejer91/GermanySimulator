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
    const anchor=mapped(x,6.65,z),target=mapped(5,6.65,-5.5),yaw=Math.atan2(target.x-anchor.x,target.z-anchor.z);
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
  const sub=speakerSpecifications.f124,anchor=mapped(-1.6,6.65,-5.5),wall=matrix(anchor,Math.PI/2);
  for(let column=0;column<2;column++)for(let row=0;row<3;row++)component('main-subwall-'+column+'-'+row,'f124',
    wall.clone().multiply(new THREE.Matrix4().makeTranslation((column-.5)*(sub.width+.012),(row+.5)*sub.height,0)),'main-subwall');
  for(const [index,x]of [-1.5,11.5].entries()){
    const position=mapped(x,10.8,-21.1),target=mapped(5,8.2,-5.5);
    component('main-satellite-'+index,'evo6eh',matrix(position,Math.atan2(target.x-position.x,target.z-position.z),.12),'main-satellites');
    const wall=mapped(x,10.8,-21.78),difference=wall.clone().sub(position),length=difference.length();
    mounting('main-satellite-'+index+' wall bracket',matrix(position.clone().add(wall).multiplyScalar(.5),Math.atan2(difference.x,difference.z)),[0,0,0],[.065,.09,length]);
  }
}
