import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

// Original reference-based study of ART02, not a scan or a manufacturer mesh.
// Coordinates are metres; the photograph's hidden surfaces remain inferred.
export const climberMaterials={
  artQuilt:{color:'#c0c49b',roughness:.76},
  artOlive:{color:'#667862',roughness:.48},
  artDenim:{color:'#70838b',roughness:.82},
  artBinding:{color:'#35443e',roughness:.58},
  artChrome:{color:'#aeb9b5',roughness:.27,metalness:.87},
  artSole:{color:'#343a3d',roughness:.9},
  artHair:{color:'#d4c08d',roughness:.72},
  artHairLight:{color:'#e5d3a8',roughness:.74},
  artSkin:{color:'#c9b8a0',roughness:.8}
};

function buildClimber(){
  const positions=Object.fromEntries(Object.keys(climberMaterials).map(name=>[name,[]]));
  const normals=Object.fromEntries(Object.keys(climberMaterials).map(name=>[name,[]]));
  const bounds=new Map(),features={hairStrands:0,metalRings:0,zipperTeeth:0,quiltSeams:0};
  const vector=point=>new THREE.Vector3(...point);
  let group='torso';
  function append(material,geometry,matrix=new THREE.Matrix4()){
    if(!geometry.hasAttribute('normal'))geometry.computeVertexNormals();
    geometry.applyMatrix4(matrix);
    geometry.computeBoundingBox();
    if(!bounds.has(group))bounds.set(group,new THREE.Box3());
    bounds.get(group).union(geometry.boundingBox);
    const flat=geometry.index?geometry.toNonIndexed():geometry;
    positions[material].push(...flat.attributes.position.array);
    normals[material].push(...flat.attributes.normal.array);
    if(flat!==geometry)flat.dispose();geometry.dispose();
  }
  function ellipsoid(center,size,material,rotation=new THREE.Euler()){
    const transform=new THREE.Matrix4().compose(vector(center),new THREE.Quaternion().setFromEuler(rotation),vector(size));
    append(material,new THREE.SphereGeometry(1,24,16),transform);
  }
  function line(points,radius,material='artBinding',segments=16){
    const curve=new THREE.CatmullRomCurve3(points.map(vector));
    append(material,new THREE.TubeGeometry(curve,segments,radius,5,false));
  }
  function ring(point,normal,radius=.014){
    append('artChrome',new THREE.TorusGeometry(radius,.0024,5,12),
      new THREE.Matrix4().compose(vector(point),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal.normalize()),new THREE.Vector3(1,1,1)));
    features.metalRings++;
  }
  function loft(points,radii,material,fold=.0){
    const curve=new THREE.CatmullRomCurve3(points.map(vector));
    const sample=(t,angle,lift=0)=>{
      const index=Math.min(radii.length-2,Math.floor(t*(radii.length-1))),blend=t*(radii.length-1)-index;
      const a=radii[index],b=radii[index+1];
      const axis=curve.getTangent(t).normalize();
      const u=new THREE.Vector3(0,0,1).cross(axis);
      if(u.lengthSq()<.01)u.set(1,0,0).cross(axis);
      u.normalize();const v=axis.clone().cross(u).normalize();
      const ripple=1+fold*Math.sin(t*54+Math.sin(angle*3))*Math.sin(Math.PI*t);
      const puff=material==='artQuilt'?.004*(.5+.5*Math.sin(angle*6+t*24)*Math.sin(angle*6-t*24)):0;
      const rx=(a[0]+(b[0]-a[0])*blend)*ripple+lift+puff,rz=(a[1]+(b[1]-a[1])*blend)*ripple+lift+puff;
      return curve.getPoint(t).addScaledVector(u,Math.cos(angle)*rx).addScaledVector(v,Math.sin(angle)*rz);
    };
    function surface(t0,t1,a0,a1,target,offset=0,patch=false){
      const vertices=[],indices=[],length=24,radial=patch?12:24;
      for(let row=0;row<=length;row++)for(let col=0;col<=radial;col++){
        const t=t0+(t1-t0)*row/length;
        const inset=patch?.08*(1-Math.sin(Math.PI*row/length)):0;
        const angle=a0+inset+(a1-a0-2*inset)*col/radial;
        vertices.push(...sample(t,angle,offset).toArray());
        if(row<length&&col<radial){const p=row*(radial+1)+col;indices.push(p,p+1,p+radial+2,p,p+radial+2,p+radial+1);}
      }
      if(!patch)for(const [row,sign]of [[0,1],[length,-1]]){
        const center=vertices.length/3;vertices.push(...curve.getPoint(row/length).toArray());
        for(let col=0;col<radial;col++){
          const p=row*(radial+1)+col;
          indices.push(...(sign===1?[center,p+1,p]:[center,p,p+1]));
        }
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);append(target,geometry);
    }
    surface(0,1,0,Math.PI*2,material);
    return {sample,surface};
  }
  function panel(loft,t0,t1,a0,a1,material='artDenim'){
    loft.surface(t0,t1,a0,a1,material,.004,true);
    for(const angle of [a0+.03,a1-.03])line(Array.from({length:13},(_,i)=>loft.sample(t0+(t1-t0)*i/12,angle,.009).toArray()),.004);
    for(const t of [t0,t1])line(Array.from({length:13},(_,i)=>loft.sample(t,a0+.06+(a1-a0-.12)*i/12,.009).toArray()),.004);
  }
  function zipper(loft,t0,t1,angle){
    const points=Array.from({length:15},(_,i)=>loft.sample(t0+(t1-t0)*i/14,angle,.013).toArray());
    line(points,.0035,'artBinding');
    for(let i=0;i<26;i++){
      const t=t0+(t1-t0)*i/25,center=loft.sample(t,angle,.016),normal=center.clone().sub(loft.sample(t,angle,0)).normalize();
      const tangent=loft.sample(Math.min(1,t+.001),angle,.016).sub(center).normalize();
      const across=tangent.clone().cross(normal).normalize();
      for(const sign of [-1,1]){
        append('artChrome',new THREE.BoxGeometry(.006,.002,.002),new THREE.Matrix4().compose(center.clone().addScaledVector(across,sign*.003),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),across),new THREE.Vector3(1,1,1)));
        features.zipperTeeth++;
      }
    }
    const end=loft.sample(t1,angle,.020),normal=end.clone().sub(loft.sample(t1,angle,0));ring(end.toArray(),normal,.011);
  }
  function eyelets(loft,t0,t1,angle,count=5){
    for(let i=0;i<count;i++){
      const t=t0+(t1-t0)*i/(count-1),p=loft.sample(t,angle,.014);
      ring(p.toArray(),p.clone().sub(loft.sample(t,angle,0)));
    }
  }
  function quilting(loft,start=.08,end=.94,count=7){
    for(const direction of [-1,1])for(let seam=0;seam<count;seam++){
      line(Array.from({length:25},(_,row)=>{
        const t=start+(end-start)*row/24;return loft.sample(t,seam*Math.PI*2/count+direction*t*5,.002).toArray();
      }),.0012,'artOlive',28);
      features.quiltSeams++;
    }
  }

  group='pelvis';
  const hips=loft([[-.38,1.28,-.02],[-.31,1.41,-.02],[-.12,1.43,-.02],[.03,1.35,-.02]],[[.13,.21],[.18,.25],[.17,.24],[.13,.19]],'artOlive',.016);
  for(const side of [-1,1]){
    ellipsoid([-.32,1.42,side*.145],[.19,.16,.155],'artDenim',new THREE.Euler(0,0,-.2));
    const points=Array.from({length:33},(_,i)=>{
      const a=i*Math.PI/16;return[-.32+.155*Math.cos(a),1.42+.130*Math.sin(a),side*.238];
    });line(points,.005,'artBinding',36);
    for(const angle of [-2.2,-1.4,-.6,.2,.9]){
      const p=[-.32+.135*Math.cos(angle),1.42+.113*Math.sin(angle),side*.258];ring(p,new THREE.Vector3(Math.cos(angle),Math.sin(angle),side),.012);
    }
  }
  zipper(hips,.12,.86,.35);zipper(hips,.14,.85,3.4);
  group='torso';
  const torso=loft([[-.06,1.36,-.03],[.11,1.35,-.04],[.29,1.38,-.035],[.43,1.35,-.025]],[[.15,.18],[.155,.19],[.18,.19],[.12,.15]],'artQuilt',.025);
  quilting(torso,.12,.90,5);panel(torso,.06,.93,.13,1.2,'artOlive');panel(torso,.08,.93,2.0,3.04,'artOlive');
  zipper(torso,.13,.88,1.45);eyelets(torso,.15,.87,2.8,5);
  // Crossing binding follows the tailored torso rather than a generic rigid harness.
  for(const direction of [-1,1])line(Array.from({length:18},(_,i)=>torso.sample(.08+.84*i/17,1.5+direction*(i/17-.5)*1.8,.020).toArray()),.014,'artBinding',24);

  group='hanging-thigh';
  const thigh=loft([[-.39,1.34,-.14],[-.52,1.16,-.15],[-.55,.95,-.16],[-.55,.84,-.16]],[[.15,.15],[.14,.145],[.115,.125],[.10,.105]],'artOlive',.022);
  panel(thigh,.08,.86,.15,1.55);panel(thigh,.1,.88,3.3,5.0);zipper(thigh,.12,.84,1.78);eyelets(thigh,.15,.80,3.0,5);
  group='hanging-shin';
  const shin=loft([[-.55,.90,-.16],[-.54,.70,-.18],[-.52,.42,-.19],[-.50,.10,-.18]],[[.105,.11],[.11,.105],[.095,.09],[.10,.09]],'artQuilt',.045);
  quilting(shin,.05,.93,9);panel(shin,.03,.56,2.5,4.5,'artOlive');zipper(shin,.08,.90,1.2);eyelets(shin,.08,.52,4.65,4);
  group='folded-thigh';
  const raised=loft([[-.22,1.36,.14],[.01,1.34,.20],[.22,1.29,.28],[.34,1.26,.31]],[[.15,.15],[.145,.15],[.12,.13],[.10,.11]],'artOlive',.018);
  panel(raised,.05,.88,.3,2.2);zipper(raised,.10,.89,2.35);eyelets(raised,.08,.86,.06,6);
  group='folded-shin';
  const folded=loft([[.34,1.26,.31],[.16,1.25,.42],[-.09,1.25,.53],[-.32,1.23,.59]],[[.10,.105],[.11,.11],[.10,.105],[.095,.10]],'artQuilt',.037);
  quilting(folded,.10,.92,7);
  function shoe(center,rotation){
    const transform=new THREE.Matrix4().compose(vector(center),new THREE.Quaternion().setFromEuler(rotation),new THREE.Vector3(1,1,1));
    const shape=new THREE.Shape();shape.moveTo(-.052,.11);shape.quadraticCurveTo(-.08,-.02,-.065,-.12);shape.quadraticCurveTo(0,-.18,.065,-.12);shape.quadraticCurveTo(.08,-.02,.052,.11);shape.closePath();
    const sole=new THREE.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.004,curveSegments:8});
    sole.rotateX(Math.PI/2);append('artSole',sole,transform);
    const upper=new THREE.SphereGeometry(1,24,12);upper.scale(.071,.073,.155);upper.translate(0,.048,-.02);append('artQuilt',upper,transform);
    for(let row=0;row<9;row++)for(const side of [-1,1]){
      const tread=new THREE.BoxGeometry(.038,.008,.012);tread.rotateY(side*.35);tread.translate(side*.029,-.029,-.11+row*.025);append('artSole',tread,transform);
    }
    for(const side of [-1,1])for(let i=0;i<4;i++){
      const patch=new THREE.TorusGeometry(.009,.002,5,10);patch.rotateY(Math.PI/2);patch.translate(side*.067,.045,-.085+i*.032);append('artChrome',patch,transform);features.metalRings++;
    }
  }
  group='hanging-shoe';shoe([-.51,.036,-.14],new THREE.Euler(0,-.25,0));
  group='folded-shoe';shoe([-.43,1.10,.65],new THREE.Euler(-Math.PI/2,0,-.15));
  for(const side of [-1,1]){
    group=side===1?'near-arm':'far-arm';
    const arm=loft([[.36,1.365,side*.14],[.46,1.245,side*.18],[.60,1.215,side*.20],[.76,1.215,side*.20]],[[.075,.08],[.07,.07],[.06,.065],[.045,.05]],'artOlive',.04);
    panel(arm,.1,.65,.5,2.2,'artDenim');zipper(arm,.12,.68,2.5);eyelets(arm,.15,.75,.23,3);
    ellipsoid([.80,1.167,side*.20],[.07,.034,.055],'artOlive');
    for(let finger=0;finger<4;finger++){
      const z=side*.20+(finger-1.5)*.022,x=.83+(1-Math.abs(finger-1.5)/3)*.035;
      loft([[.815,1.16,z],[x,1.153,z],[x+.032,1.147,z+.002]],[[.009,.009],[.008,.008],[.004,.005]],'artSkin');
    }
    loft([[.78,1.16,side*.245],[.82,1.145,side*.267],[.844,1.145,side*.267]],[[.012,.012],[.010,.01],[.006,.006]],'artSkin');
  }
  group='head-and-hair';
  ellipsoid([.48,1.34,-.025],[.085,.105,.083],'artSkin',new THREE.Euler(0,0,-.65));
  ellipsoid([.50,1.378,-.025],[.09,.103,.09],'artHair',new THREE.Euler(0,0,-.6));
  for(let strand=0;strand<116;strand++){
    const angle=strand*2.399963229728653,band=Math.sqrt((strand+.5)/116),z=Math.sin(angle)*.085*band;
    const x=.50+Math.cos(angle)*.075*band,y=1.40+Math.sqrt(1-band*band)*.07;
    const sway=.017*Math.sin(strand*2.1),length=.29+.12*(.5+.5*Math.sin(strand*.71));
    line([[x,y,z-.025],[.59+sway,1.36,z-.02],[.63+sway,1.24,z+.005],[.64+sway,Math.max(1.14,1.47-length),z+.03]],
      .0018+(strand%4)*.00022,strand%3?'artHair':'artHairLight',14);features.hairStrands++;
  }
  const surfaces=Object.fromEntries(Object.keys(positions).map(material=>{
    const vertices=[],directions=[],indices=[],seen=new Map();
    for(let i=0;i<positions[material].length;i+=3){
      const point=positions[material].slice(i,i+3),normal=normals[material].slice(i,i+3);
      const key=[...point,...normal].map(value=>Math.round(value*1000000)).join(',');
      if(!seen.has(key)){
        seen.set(key,vertices.length/3);vertices.push(...point);directions.push(...normal);
      }
      indices.push(seen.get(key));
    }
    return [material,{positions:new Float32Array(vertices),normals:new Float32Array(directions),indices:new Uint32Array(indices)}];
  }));
  return {surfaces,colliders:[...bounds].map(([name,box])=>({name,min:box.min.toArray(),max:box.max.toArray()})),features};
}

let data;
export function climberGeometryData(){return data||=(buildClimber());}
export function createClimberGeometries(){
  return Object.fromEntries(Object.entries(climberGeometryData().surfaces).map(([material,surface])=>{
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(surface.positions,3));
    geometry.setAttribute('normal',new THREE.BufferAttribute(surface.normals,3));geometry.setIndex(new THREE.BufferAttribute(surface.indices,1));
    geometry.computeBoundingBox();return ['climber-'+material,geometry];
  }));
}
