import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

export const sauleMaterials={
  sauleConcrete:{color:'#b1bdd6',roughness:.99},
  sauleSteel:{color:'#252b2c',roughness:.66,metalness:.6},
  sauleCushion:{color:'#181c1b',roughness:.67},
  sauleLens:{color:'#d8e2df',roughness:.55,emissive:'#bbcfc9',emissiveIntensity:.45}
};

export function createSauleGeometries(){
  const capital=new THREE.CylinderGeometry(Math.SQRT1_2,Math.SQRT1_2*.68,1,4,1)
    .rotateY(Math.PI/4).toNonIndexed();
  capital.computeVertexNormals();
  const profile=new THREE.Shape();
  profile.moveTo(-.5,-.5);profile.lineTo(.5,.15);profile.lineTo(.5,.5);profile.lineTo(-.5,.5);profile.closePath();
  const corbel=new THREE.ExtrudeGeometry(profile,{depth:1,bevelEnabled:false}).translate(0,0,-.5);
  return {'saule-capital':capital,'saule-corbel':corbel};
}

function addBelt({part},width,depth){
  const body=[width,0,depth],height=2.5;
  for(const axis of [0,2])for(const side of [-1,1]){
    const along=2-axis,half=body[axis]/2;
    const add=(name,outward,y,across,tall,thick,material,role)=>{
      const center=[0,y,0],size=[0,tall,0];
      center[axis]=side*(half+outward);size[axis]=thick;size[along]=across;
      part(name,center,size,material,'box',true).role=role;
    };
    add('belt mounting web',.04,height,body[along]+.22,.025,.14,'sauleSteel','belt housing');
    add('belt outer fascia',.0975,height,body[along]+.22,.15,.025,'sauleSteel','belt fascia');
    add('belt back plate',-.005,height,body[along],.15,.02,'sauleSteel','belt back plate');
    for(const sign of [-1,1])
      add('concealed belt lens',.036,height+sign*.0185,body[along]-.06,.012,.055,'sauleLens','recessed lens');
  }
}

export function addSauleFixtures(layout,api){
  const {fixture,part,box}=api,floorHeight=.05,bodyHeight=4.15,width=1.6,depth=2.1;
  const retainedLights=layout.parts.filter(p=>p.name==='Säule column light');
  const central=retainedLights.filter(p=>p.center[0]<12);
  retainedLights.forEach((p,index)=>{
    if(!central.includes(p))p.instanceTone=.84+((index*193+retainedLights.length*37)%101)/625;
  });
  layout.parts=layout.parts.filter(p=>!central.includes(p));
  layout.saule={sources:['A15','I24'],floorHeight,pierCount:6,bodyWidth:width,bodyDepth:depth,
    bodyHeight,capitalTop:5.05,beltHeight:floorHeight+2.5,
    placement:'Six existing central grid anchors retained as provisional; not a recovered column plan',
    confidence:'Photographed concrete forms, belt construction and seating; dimensions, counts and placement inferred',
    remaining:'Exact footprint/grid and separate entry, bar/partitions/services, original concrete damage, full belt wash and current operation'};
  let index=0;
  for(const x of [-1,8])for(const z of [-18,-7,6]){
    fixture('saule-pier-'+index++,[x,floorHeight,z],['A15','I24'],
      {width,depth,bodyHeight,capitalWidth:2.35,capitalDepth:3.1,beltHeight:2.5},()=>{
        box('concrete body',[0,bodyHeight/2,0],[width,bodyHeight,depth],'sauleConcrete',true).role='pier body';
        part('flared capital',[0,bodyHeight+.425,0],[2.35,.85,3.1],'sauleConcrete','saule-capital',true).role='flared capital';
        addBelt(api,width,depth);
        if(z!==-18){
          const side=x<0?1:-1,center=side*(width/2+.30);
          box('seat plinth',[center,.175,0],[.62,.35,1.35],'sauleConcrete',true).role='seat plinth';
          part('padded concrete seat',[center,.41,0],[.58,.12,1.29],'sauleCushion','lounge-pad',true).role='seat cushion';
        }
        if(z===-7){
          const side=x<0?-1:1,rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),side<0?Math.PI:0);
          part('retained concrete corbel',[side*(width/2+.31),3.05,0],[.66,.65,.9],
            'sauleConcrete','saule-corbel',true,rotation).role='concrete corbel';
        }
      });
  }
}
