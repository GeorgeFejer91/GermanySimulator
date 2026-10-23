import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {anatomyIndices,anatomyPoses} from './together-anatomy.mjs';

export const togetherMaterials={
  artAmber:{color:'#fff9e8',roughness:.14,metalness:0,transmission:.96,thickness:.25,
    attenuationColor:'#bd9637',attenuationDistance:.10,ior:1.48,clearcoat:1,clearcoatRoughness:.1}
};
export const togetherSections=[
  {id:'left',length:1.6,width:.66,pairs:1,sourceViews:[6,7],offset:[-4.7,.953,0],angle:0},
  {id:'front',length:4.6,width:.66,pairs:2,sourceViews:[1,4,5,10,11,22],offset:[.65,.953,0],angle:0},
  {id:'return',length:1.6,width:.60,pairs:1,sourceViews:[8,9,10],offset:[3.84,.953,-1.34],angle:Math.PI/2},
  {id:'rear',length:1.2,width:.52,pairs:0,sourceViews:[8,9,21],offset:[-1.8,.973,-2.65],angle:0}
];

function buildTogether(){
  const surfaces={},features={heads:0,hands:0,fingerChains:0,figures:0,ivyLeaves:0,castPipeFragments:0,
    anatomy:'CC0 MakeHuman core, original offline poses; not scans of the artwork',
    sequence:'Partial authored arrangement; count and complete narrative unverified'};
  const vector=p=>new THREE.Vector3(...p);
  for(const section of togetherSections){
    const positions=[],normals=[],indices=[],volumeUV=[];
    function append(geometry,matrix=new THREE.Matrix4()){
      geometry.applyMatrix4(matrix);
      if(!geometry.hasAttribute('normal'))geometry.computeVertexNormals();
      const start=positions.length/3,remap=new Map(),p=geometry.attributes.position,n=geometry.attributes.normal;
      const source=geometry.index?.array||Array.from({length:p.count},(_,i)=>i);
      for(const i of source){
        if(!remap.has(i)){
          remap.set(i,positions.length/3-start);
          positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));
          volumeUV.push(geometry.attributes.uv1?.getX(i)??.75,geometry.attributes.uv1?.getY(i)??.75);
        }
        indices.push(start+remap.get(i));
      }
      geometry.dispose();
    }
    function tube(points,radius=.006){
      append(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(vector)),24,radius,8,false));
    }
    function leaf(x,z,size,angle){
      const shape=new THREE.Shape();shape.moveTo(0,-size*.65);
      for(let i=0;i<=40;i++){
        const a=i/40*Math.PI*2,r=size*(.72+.23*Math.cos(5*a));
        shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);
      }
      const g=new THREE.ExtrudeGeometry(shape,{depth:.0025,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:1,steps:1});
      const matrix=new THREE.Matrix4().compose(vector([x,.027,z]),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,angle,0)),vector([1,1,1]));
      append(g,matrix);features.ivyLeaves++;
    }
    const outline=new THREE.Shape();outline.moveTo(-section.length/2,0);
    for(const sign of [1,-1])for(let i=1;i<=48;i++){
      const t=sign===1?i/48:1-i/48,x=(t-.5)*section.length;
      const width=section.width*.45*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.22)
        *(.94+.045*Math.sin(t*47)+.015*Math.sin(t*99));
      outline.lineTo(x,sign*width);
    }
    outline.closePath();
    const base=new THREE.ExtrudeGeometry(outline,{depth:.009,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:2,steps:1});
    base.rotateX(-Math.PI/2);base.translate(0,.011,0);append(base);

    const count=section.pairs?section.pairs*2:1;
    const scale=section.id==='front'?1.05:count===1?.94:.80;
    for(let i=0;i<count;i++){
      const poseIndex=(i+(section.id==='left'?1:0))%anatomyPoses.length,pose=anatomyPoses[poseIndex];
      const g=new THREE.BufferGeometry(),p=Float32Array.from(pose);
      const cx=count===1?0:section.id==='front'?[-1.75,-.55,.55,1.75][i]:(i-.5)*.68;
      const cz=count===1?0:(i%2?-.075:.075);
      for(let j=0;j<p.length;j+=3){
        const t=Math.max(0,Math.min(1,(p[j]+.51)/.25)),blend=t*t*(3-2*t);
        p[j+1]=.012+(p[j+1]-.008)*blend;
      }
      g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex(new THREE.BufferAttribute(anatomyIndices,1));g.computeVertexNormals();
      g.computeBoundingBox();const box=g.boundingBox,uv=new Float32Array(p.length/3*2);
      for(let j=0;j<p.length/3;j++){
        uv[j*2]=poseIndex*.5+.01+(p[j*3]-box.min.x)/(box.max.x-box.min.x)*.48;
        uv[j*2+1]=.01+(p[j*3+2]-box.min.z)/(box.max.z-box.min.z)*.48;
      }
      g.setAttribute('uv1',new THREE.BufferAttribute(uv,2));
      const flip=section.id==='front'&&i===1?Math.PI:0;
      const matrix=new THREE.Matrix4().compose(vector([cx,.008,cz]),
        new THREE.Quaternion().setFromAxisAngle(vector([0,1,0]),flip),vector([scale,1,section.width/.66*.94]));
      append(g,matrix);features.figures++;features.heads++;features.hands+=2;features.fingerChains+=10;
    }
    for(const sign of [-1,1]){
      const z=section.width*.39*sign;
      tube([[-section.length*.43,.026,z*.6],[-section.length*.24,.031,z],[0,.028,z*.85],
        [section.length*.24,.031,z],[section.length*.43,.027,z*.5]],.005);
      for(let i=0;i<5;i++)leaf((i-2)*section.length*.15,z*(i%2?.88:1),.028+(i%2)*.008,sign*(i*.7));
    }
    if(section.id==='front'){
      tube([[-.28,.065,.21],[-.12,.065,.21],[-.04,.065,.13],[-.04,.065,-.04]],.025);
      const stem=new THREE.CylinderGeometry(.017,.023,.07,12);stem.translate(-.14,.095,.21);append(stem);
      const wheel=new THREE.TorusGeometry(.055,.008,6,24);wheel.rotateX(Math.PI/2);wheel.translate(-.14,.135,.21);append(wheel);
      features.castPipeFragments++;
    }
    surfaces[section.id]={positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint32Array(indices),volumeUV:new Float32Array(volumeUV)};
  }
  return {surfaces,features};
}
let data;
export function togetherGeometryData(){return data||=(buildTogether());}
export function createTogetherGeometries(){
  return Object.fromEntries(Object.entries(togetherGeometryData().surfaces).map(([id,s])=>{
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(s.positions,3));
    g.setAttribute('normal',new THREE.BufferAttribute(s.normals,3));g.setIndex(new THREE.BufferAttribute(s.indices,1));g.computeBoundingBox();
    g.setAttribute('uv1',new THREE.BufferAttribute(s.volumeUV,2));
    return ['together-'+id,g];
  }));
}
