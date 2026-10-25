import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

// V07/V08/V19 associate a separate upper urinal room with the former wardrobe,
// lounge and DJ overlook. I19 08–14 supplies enclosure relationships, not a plan.
// These coordinates are a fitted study, including the existing inferred approach.
export const upperSanitary = Object.freeze({floor:12.15,ceiling:14.8,
  x:[2.55,4.30],z:[12.05,21.31],door:[12.5,13.65],
  stations:[14,15,16,17,18,19].map(z=>({center:[3.025,12.15,z]})),
  opening:{x:.62,z:[12.3,16.6],y:[12.15,13.95]}});

// Stadium outline; product dimensions are metres, never room measurements.
function stadium(length,width){
  const radius=width/2,straight=length/2-radius,points=[];
  for(const side of [1,-1])for(let i=0;i<=16;i++){
    const angle=(side===1?-Math.PI/2:Math.PI/2)+i*Math.PI/16;
    points.push([side*straight+radius*Math.cos(angle),radius*Math.sin(angle)]);
  }
  return points;
}

export function createUpperSanitaryGeometries(layout){
  const rings=[[.750,.320,0],[.700,.270,-.015],[.580,.150,-.12],[.500,.080,-.185]];
  const vertices=[],uv=[];
  const tri=(a,b,c)=>{vertices.push(...a,...b,...c);uv.push(0,0,1,0,0,1);};
  const loops=rings.map(([l,w,y])=>stadium(l,w).map(([x,z])=>[x,y,z]));
  for(let r=0;r<loops.length-1;r++)for(let i=0;i<loops[r].length;i++){
    const j=(i+1)%loops[r].length,a=loops[r][i],b=loops[r][j],c=loops[r+1][i],d=loops[r+1][j];
    tri(a,c,b);tri(b,c,d);
  }
  const last=loops.at(-1);for(let i=0;i<last.length;i++)tri(last[i],[0,-.185,0],last[(i+1)%last.length]);
  const bowl=new THREE.BufferGeometry();bowl.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  bowl.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bowl.computeVertexNormals();
  // Same outer slab and thickness, with real recesses beneath the fixture rims.
  const slab=layout.parts.find(p=>p.name==='upper Panorama lounge'),inverse=new THREE.Matrix4().fromArray(slab.matrix).invert();
  const shape=new THREE.Shape();shape.moveTo(-.5,-.5);shape.lineTo(.5,-.5);shape.lineTo(.5,.5);shape.lineTo(-.5,.5);shape.closePath();
  for(const {center} of upperSanitary.stations){
    const points=stadium(.750,.320).map(([x,z])=>new THREE.Vector3(center[0]+x,center[1],center[2]+z).applyMatrix4(inverse));
    const hole=new THREE.Path();points.forEach((p,i)=>i?hole.lineTo(p.x,p.z):hole.moveTo(p.x,p.z));hole.closePath();shape.holes.push(hole);
  }
  // Recesses stop 0.19 m below the top; retain the lower 0.21 m of the slab.
  // A one-sided bowl alone cannot close an opening when seen from below.
  const pocket=new THREE.ExtrudeGeometry(shape,{depth:.475,steps:1,bevelEnabled:false}).rotateX(Math.PI/2).translate(0,.5,0);
  const underside=new THREE.BoxGeometry(1,.525,1).translate(0,-.2375,0).toNonIndexed();
  const cutSlab=new THREE.BufferGeometry();
  for(const name of ['position','normal','uv']){
    const a=pocket.attributes[name],b=underside.attributes[name],values=new Float32Array(a.array.length+b.array.length);
    values.set(a.array);values.set(b.array,a.array.length);cutSlab.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize));
  }
  pocket.dispose();underside.dispose();
  const railCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,.83,0),new THREE.Vector3(.40,.83,0),new THREE.Vector3(.59,.72,0),new THREE.Vector3(.62,.40,0),new THREE.Vector3(.62,.02,0)
  ]);
  const rail=new THREE.TubeGeometry(railCurve,24,.02,8,false);
  return {'upper-sanitary-bowl':bowl,'upper-sanitary-slab':cutSlab,'upper-sanitary-rail':rail};
}

function bounds(s,p){
  const m=new THREE.Matrix4().fromArray(p.matrix),b=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(m);
  s.x=[b.min.x,b.max.x];s.y=[b.min.y,b.max.y];s.z=[b.min.z,b.max.z];
  s.polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>{const v=new THREE.Vector3(x,0,z).applyMatrix4(m);return[v.x,v.z];});
}

export function fitUpperSanitary(layout){
  const batches=new Map();for(const p of layout.parts){const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
  for(const batch of batches.values())batch.forEach((p,i)=>{p.instanceTone??=.84+((i*193+batch.length*37)%101)/625;});
  function part(name,center,size,material='pale',solid=true,shape='box'){
    const p={name:'Upper sanitary '+name,section:'interior',shape,material,center,size,upperSanitary:true,instanceTone:.94,
      matrix:new THREE.Matrix4().makeScale(...size).setPosition(...center).toArray()};layout.parts.push(p);
    if(solid){const s={name:p.name,renderPart:p,upperSanitary:true};bounds(s,p);layout.solids.push(s);}return p;
  }
  const {floor,ceiling,x,z,door,opening}=upperSanitary,midY=(floor+ceiling)/2,height=ceiling-floor;
  // Move one intact three-metre chaise into the clear north lounge strip.
  const chaise=layout.parts.filter(p=>p.name.startsWith('Felsenland angled chaise'));
  const anchor=chaise.find(p=>p.name.endsWith('plinth')).center;
  const rotation=-Math.PI/2+.42;
  const transform=new THREE.Matrix4().makeTranslation(8.8,anchor[1],12.0)
    .multiply(new THREE.Matrix4().makeRotationY(rotation)).multiply(new THREE.Matrix4().makeTranslation(...anchor.map(v=>-v)));
  for(const p of chaise){p.matrix=new THREE.Matrix4().multiplyMatrices(transform,new THREE.Matrix4().fromArray(p.matrix)).toArray();p.center=p.matrix.slice(12,15);}
  for(const s of layout.solids)if(chaise.includes(s.renderPart))bounds(s,s.renderPart);
  part('west partition',[x[0],midY,(z[0]+z[1])/2],[.10,height,z[1]-z[0]]);
  part('north partition',[(x[0]+x[1])/2,midY,z[0]],[x[1]-x[0],height,.10]);
  // Clear frontage meets the existing artwork glazing, whose image is not copied.
  for(const [a,b]of [[z[0],door[0]],[door[1],z[1]]]){
    part('clear frontage',[x[1],midY,(a+b)/2],[.035,height,b-a],'groundGlass');
    part('frontage base',[x[1],floor+.035,(a+b)/2],[.07,.07,b-a],'steel');
  }
  part('frontage top',[x[1],ceiling-.035,(z[0]+z[1])/2],[.07,.07,z[1]-z[0]],'steel');
  for(const vz of [z[0],...door,16.05,18.65,z[1]])part('frontage mullion',[x[1],midY,vz],[.07,height,.06],'steel');
  part('door head',[x[1],14.55,(door[0]+door[1])/2],[.07,.5,door[1]-door[0]],'steel');
  // Retain the public lower doorway; replace only the unsupported blank upper bay.
  const old=layout.parts.filter(p=>p.name==='Panorama window room DJ end lining');
  layout.parts=layout.parts.filter(p=>!old.includes(p));layout.solids=layout.solids.filter(s=>!old.includes(s.renderPart));
  for(const [a,b]of [[7.4,10],[12,21.56]]){
    part('DJ lining below overlook',[opening.x,(9.05+floor)/2,(a+b)/2],[.16,floor-9.05,b-a]);
    for(const [c,d]of [[a,Math.min(b,opening.z[0])],[Math.max(a,opening.z[1]),b]])if(d>c)
      part('overlook side pier',[opening.x,(floor+13.95)/2,(c+d)/2],[.16,13.95-floor,d-c]);
  }
  const slab=layout.parts.find(p=>p.name==='upper Panorama lounge');slab.shape='upper-sanitary-slab';
  for(const [i,{center}] of upperSanitary.stations.entries()){
    part(`station ${i+1} recessed bowl`,center,[1,1,1],'stainless',false,'upper-sanitary-bowl');
    for(const side of [-1,1]){
      part(`station ${i+1} handrail`,[2.62,floor,center[2]+side*.25],[1,1,1],'stainless',false,'upper-sanitary-rail');
      part(`station ${i+1} wall bracket`,[2.61,floor+.83,center[2]+side*.25],[.02,.08,.08],'stainless',false);
      part(`station ${i+1} floor bracket`,[3.24,floor+.01,center[2]+side*.25],[.08,.02,.08],'stainless',false);
    }
    // Complete fixture envelope also keeps visitors off the recessed bowl.
    layout.solids.push({name:`Upper sanitary station ${i+1}`,upperSanitary:true,x:[2.60,3.40],y:[floor-.185,floor+.87],z:[center[2]-.30,center[2]+.30]});
  }
  for(const vz of [14,17,20]){
    part('practical casing',[3.85,14.73,vz],[.10,.10,.80],'steel',false);
    part('practical diffuser',[3.85,14.675,vz],[.07,.01,.74],'opal',false);
  }
  const point=(x,z)=>({x,y:floor,z});
  layout.upperLounge.sanitary={...upperSanitary,sources:['I19','V07','V08','V10','V19','A22','A23'],
    confidence:'Separate upper room association supported; footprint, entry, fixture arrangement and all site coordinates estimated',
    count:'Six illustrative stations follow the dated December 2023 trial report, not a verified current inventory',
    fixture:'Original stadium-bowl and rail study using MSS24 product dimensions; exact installed model and floor construction unverified',
    approach:'Existing internal lounge stair retained as an inferred public approach; the reported separate front stair remains unregistered',
    glazing:'Clear/printed corner relationship from I19 12; present privacy finish and door construction unverified; artwork pixels not reproduced',
    movedChaise:{from:anchor,to:[8.8,anchor[1],12],rotation,reason:'Keep the entire assembly clear of the fitted sanitary room; modern furniture positions unmeasured'},
    route:[layout.panoramaRegistration.loungeRoute.at(-1),point(3.825,13.05),point(3.825,20.3)],
    overlookRoute:[layout.panoramaRegistration.loungeRoute.at(-2),point(5.54,11.5),point(1.85,11.5),point(1.85,14.45)],
    remaining:'Measured plan, front-stair registration, current inventory/privacy finish and hidden services'};
  layout.upperLounge.overlook={sources:['I19'],gallery:[13,14],opening,guard:'Retained supported upper-edge rail; viewing aperture only, no cross-gap walking route',confidence:'Photo-supported relation to DJ; aperture and site registration estimated'};
}
