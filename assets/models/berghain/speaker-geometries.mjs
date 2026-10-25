import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

export const speakerSpecifications={
  evo6eh:{width:.661,height:.656,depth:.565,rearWidth:.260,source:'S07',drawing:'Evo6EH-F1-TD=T0020-00',date:'2021-09-30'},
  evo6el:{width:.661,height:.484,depth:.565,rearWidth:.260,source:'S08',drawing:'Evo6EL-F1-TD=T0025-00',date:'2021-09-30'},
  f218mk2:{width:1.326,height:.496,depth:.723,rearWidth:1.326,source:'S09',drawing:'F218_MK2-F1-TD=T0208-00',date:'2023-10-19'},
  f124:{width:.702,height:.992,depth:1.056,rearWidth:.702,source:'S10',drawing:'F124-F1-TD=T0220-00',date:'2023-10-20'}
};

function speakerGeometry(specification) {
  const buffers={cabinet:[],horn:[],lining:[],hardware:[]};
  const {width:w,height:h,depth:d,rearWidth:b}=specification,t=.018;
  function quad(target,a,b,c,e){buffers[target].push(...a,...b,...c,...a,...c,...e);}
  function panel(target,vertices,extrusion) {
    let outer=vertices.map(p=>new THREE.Vector3(...p));
    const direction=new THREE.Vector3(...extrusion);
    const normal=new THREE.Vector3().subVectors(outer[1],outer[0]).cross(new THREE.Vector3().subVectors(outer[2],outer[0]));
    if(normal.dot(direction)>0)outer=outer.reverse();
    const inner=outer.map(p=>p.clone().add(direction));
    quad(target,...outer.map(p=>p.toArray()));
    quad(target,...inner.toReversed().map(p=>p.toArray()));
    for(let i=0;i<4;i++)quad(target,outer[i].toArray(),inner[i].toArray(),inner[(i+1)%4].toArray(),outer[(i+1)%4].toArray());
  }
  function append(target,geometry,position,rotation=new THREE.Euler()) {
    geometry.rotateX(rotation.x);geometry.rotateY(rotation.y);geometry.rotateZ(rotation.z);geometry.translate(...position);
    const flat=geometry.index?geometry.toNonIndexed():geometry;
    buffers[target].push(...flat.attributes.position.array);
    if(flat!==geometry)flat.dispose();geometry.dispose();
  }
  const box=(target,center,size)=>append(target,new THREE.BoxGeometry(...size),center);
  function portPlate(target,width,height,z,columns,rows,radius) {
    const shape=new THREE.Shape();
    shape.moveTo(-width/2,-height/2);shape.lineTo(width/2,-height/2);shape.lineTo(width/2,height/2);shape.lineTo(-width/2,height/2);shape.closePath();
    for(let column=0;column<columns;column++)for(let row=0;row<rows;row++){
      const hole=new THREE.Path();
      hole.absarc((column-(columns-1)/2)*width/columns,(row-(rows-1)/2)*height/rows,radius,0,Math.PI*2,true);shape.holes.push(hole);
    }
    append(target,new THREE.ExtrudeGeometry(shape,{depth:.009,bevelEnabled:false,curveSegments:8}),[0,0,z]);
  }
  function funnel(center,mouth,throat,depth) {
    const front=center[2],back=front-depth;
    for(let step=0;step<5;step++){
      const ring=level=>{
        const u=level/5,flare=u*u,rx=(throat[0]+(mouth[0]-throat[0])*flare)/2,ry=(throat[1]+(mouth[1]-throat[1])*flare)/2;
        return [[-rx,-ry],[-rx,ry],[rx,ry],[rx,-ry]].map(([x,y])=>[center[0]+x,center[1]+y,back+depth*u]);
      };
      const a=ring(step),b=ring(step+1);
      for(let side=0;side<4;side++){
        const extrusion=[0,0,0];extrusion[side%2===0?0:1]=(side<2?-1:1)*.004;
        panel('horn',[a[side],b[side],b[(side+1)%4],a[(side+1)%4]],extrusion);
      }
    }
    box('lining',[center[0],center[1],back-.006],[throat[0],throat[1],.012]);
  }
  panel('cabinet',[[-w/2,h/2,d/2],[-b/2,h/2,-d/2],[b/2,h/2,-d/2],[w/2,h/2,d/2]],[0,-t,0]);
  panel('cabinet',[[-w/2,-h/2,d/2],[w/2,-h/2,d/2],[b/2,-h/2,-d/2],[-b/2,-h/2,-d/2]],[0,t,0]);
  panel('cabinet',[[-b/2,-h/2,-d/2],[b/2,-h/2,-d/2],[b/2,h/2,-d/2],[-b/2,h/2,-d/2]],[0,0,t]);
  for(const side of [-1,1]){
    panel('cabinet',[[side*w/2,-h/2,d/2],[side*b/2,-h/2,-d/2],[side*b/2,h/2,-d/2],[side*w/2,h/2,d/2]],[-side*t,0,0]);
    box('cabinet',[side*(w-t)/2,0,d/2-.015],[t,h,.03]);
  }
  for(const side of [-1,1])box('cabinet',[0,side*(h-t)/2,d/2-.015],[w,t,.03]);
  if(specification===speakerSpecifications.evo6eh){
    funnel([0,.202,d/2-.022],[.38,.17],[.045,.032],.22);
    funnel([0,-.075,d/2-.022],[.55,.31],[.16,.12],.29);
    const rim=[[-.21,-.075,.195],[0,-.032,.21],[.21,-.075,.195],[0,-.118,.21]];
    for(let side=0;side<4;side++){
      const a=rim[side],b=rim[(side+1)%4];
      buffers.horn.push(...a,...[0,-.075,.272],...b,...b,...[0,-.075,.135],...a);
    }
  }else if(specification===speakerSpecifications.evo6el){
    funnel([0,.035,d/2-.022],[.605,.32],[.24,.16],.35);
    const start=buffers.horn.length;portPlate('horn',.59,.045,d/2-.035,6,1,.014);
    for(let i=start+1;i<buffers.horn.length;i+=3)buffers.horn[i]-=.125;
    box('cabinet',[0,-.16,d/2-.035],[.012,.12,.045]);
  }else if(specification===speakerSpecifications.f218mk2){
    for(const side of [-1,1])funnel([side*.43,0,d/2-.022],[.405,.436],[.16,.20],.43);
    for(const side of [-1,1]){
      const start=buffers.horn.length;portPlate('horn',.066,.405,d/2-.038,1,4,.022);
      for(let i=start;i<buffers.horn.length;i+=3)buffers.horn[i]+=side*.275;
    }
    box('cabinet',[0,0,d/2-.045],[.014,.46,.07]);
    box('cabinet',[0,0,d/2-.045],[.34,.014,.07]);
    box('lining',[0,0,d/2-.20],[.52,.44,.018]);
  }else{
    funnel([0,.15,d/2-.022],[.65,.58],[.25,.24],.67);
    const start=buffers.horn.length;portPlate('horn',.63,.12,d/2-.035,7,1,.031);
    for(let i=start+1;i<buffers.horn.length;i+=3)buffers.horn[i]-=.255;
    box('cabinet',[0,-.31,d/2-.04],[.012,.33,.055]);
    box('lining',[0,-.38,d/2-.18],[.62,.18,.018]);
  }
  for(const x of [-b*.31,b*.31]){
    box('lining',[x,0,-d/2+.0015],[.10,.038,.003]);
    for(const y of [-.018,.018])box('hardware',[x,y,-d/2+.002],[.11,.004,.004]);
  }
  box('lining',[0,.10,-d/2+.002],[Math.min(b*.6,.17),.09,.004]);
  for(const x of [-.035,.035])append('hardware',new THREE.TorusGeometry(.013,.0025,5,10),[x,.10,-d/2+.004]);
  return Object.fromEntries(Object.entries(buffers).filter(([,positions])=>positions.length).map(([name,positions])=>{
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();geometry.scale(1/w,1/h,1/d);geometry.computeBoundingBox();
    return [name,geometry];
  }));
}

export function createSpeakerGeometries(){
  return {...createPanoramaSpeakerGeometries(),...Object.fromEntries(Object.entries(speakerSpecifications).flatMap(([type,specification])=>
    Object.entries(speakerGeometry(specification)).map(([surface,geometry])=>['speaker-'+type+'-'+surface,geometry])))};
}

// Manufacturer envelopes, not a claim that the current installed revisions
// are these products. Cabinet contours and grille pitch are original studies.
export const panoramaSpeakerSpecifications=Object.freeze({
  s26510l:{width:.605,height:.195,depth:.370,source:'S14'},
  s218study:{width:1.180,height:.580,depth:.740,source:'S15'}
});

function createPanoramaSpeakerGeometries(){
  const result={};
  for(const [type,spec]of Object.entries(panoramaSpeakerSpecifications)){
    const {width:w,height:h,depth:d}=spec,line=type==='s26510l',t=.012;
    const buffers={cabinet:[],grille:[],lining:[],hardware:[]};
    function append(target,geometry,center=[0,0,0],rotation=new THREE.Euler()){
      geometry.rotateX(rotation.x);geometry.rotateY(rotation.y);geometry.rotateZ(rotation.z);geometry.translate(...center);
      const flat=geometry.index?geometry.toNonIndexed():geometry;
      buffers[target].push(...flat.attributes.position.array);
      if(flat!==geometry)flat.dispose();geometry.dispose();
    }
    const box=(target,c,size)=>append(target,new THREE.BoxGeometry(...size),c);
    const face=(target,a,b,c,e)=>buffers[target].push(...a,...b,...c,...a,...c,...e);
    const rearH=line?.10:h,front=d/2,back=-d/2;
    // Closed wedge shell; inner shadow and the grille are distinct surfaces.
    const f=[[-w/2,-h/2,front],[w/2,-h/2,front],[w/2,h/2,front],[-w/2,h/2,front]];
    const b=[[-w/2,-rearH/2,back],[w/2,-rearH/2,back],[w/2,rearH/2,back],[-w/2,rearH/2,back]];
    for(let i=0;i<4;i++)face('cabinet',f[i],b[i],b[(i+1)%4],f[(i+1)%4]);
    face('cabinet',b[3],b[2],b[1],b[0]);
    for(const sign of [-1,1]){
      box('cabinet',[sign*(w-t)/2,0,front-.012],[t,h,.024]);
      box('cabinet',[0,sign*(h-t)/2,front-.012],[w-2*t,t,.024]);
    }
    box('lining',[0,0,front-.035],[w-.02,h-.02,.014]);
    const plate=new THREE.Shape(),pw=w-.026,ph=h-.026;
    plate.moveTo(-pw/2,-ph/2);plate.lineTo(pw/2,-ph/2);plate.lineTo(pw/2,ph/2);plate.lineTo(-pw/2,ph/2);plate.closePath();
    const columns=line?19:27,rows=line?5:11,dx=pw/(columns+1),dy=ph/(rows+1),radius=Math.min(dx,dy)*.36;
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const hole=new THREE.Path(),x=(col-(columns-1)/2)*dx+(row%2?dx*.22:0),y=(row-(rows-1)/2)*dy;
      for(let i=0;i<6;i++){const a=-i*Math.PI/3,p=[x+radius*Math.cos(a),y+radius*Math.sin(a)];if(i)hole.lineTo(...p);else hole.moveTo(...p);}
      hole.closePath();plate.holes.push(hole);
    }
    // A thin, double-sided pierced sheet retains actual apertures without
    // thousands of sub-pixel hole-edge quads. The cabinet rim supplies depth.
    append('grille',new THREE.ShapeGeometry(plate,1),[0,0,front-.006]);
    // Recessed sockets and corner hardware stay inside the product envelope.
    box('lining',[0,0,back+.001],[line?.12:.16,line?.065:.12,.002]);
    for(const x of [-.035,.035])append('hardware',new THREE.TorusGeometry(.01,.002,4,8),[x,0,back+.003]);
    for(const sign of [-1,1]){
      box('hardware',[sign*(w-.008)/2,0,front-.045],[.008,h*.82,.018]);
      for(const y of [-h*.32,h*.32])box('hardware',[sign*(w-.010)/2,y,front-.025],[.010,.012,.024]);
    }
    for(const [surface,positions]of Object.entries(buffers)){
      // Coplanar hexagon rows can make the triangulator emit zero-area faces.
      // Remove only those faces before computing real surface normals.
      const raw=new Float32Array(positions),clean=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
      for(let i=0;i<raw.length;i+=9){
        a.fromArray(raw,i);b.fromArray(raw,i+3).sub(a);c.fromArray(raw,i+6).sub(a);
        if(b.cross(c).lengthSq()>1e-18)for(let j=0;j<9;j++)clean.push(raw[i+j]);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(clean,3));
      g.computeVertexNormals();g.scale(1/w,1/h,1/d);g.computeBoundingBox();
      result['speaker-'+type+'-'+surface]=g;
    }
  }
  // Open flight-frame study: three pierced longitudinal ears and four
  // crossmembers. No hidden cap or imported manufacturer mesh.
  const frame=[];
  const appendFrame=(g,position,rotate=0)=>{
    g.rotateY(rotate);g.translate(...position);const flat=g.index?g.toNonIndexed():g;
    frame.push(...flat.attributes.position.array);if(flat!==g)flat.dispose();g.dispose();
  };
  for(const x of [-.2995,-.003,.2935]){
    const ear=new THREE.Shape();ear.moveTo(-.185,-.06);ear.lineTo(.185,-.06);ear.lineTo(.185,.06);ear.lineTo(-.185,.06);ear.closePath();
    for(let i=0;i<9;i++){const hole=new THREE.Path();hole.absarc(-.16+i*.04,.032,.009,0,Math.PI*2,true);ear.holes.push(hole);}
    appendFrame(new THREE.ExtrudeGeometry(ear,{depth:.006,bevelEnabled:false,curveSegments:4}),[x,0,0],Math.PI/2);
  }
  for(const z of [-.16,-.055,.055,.16])appendFrame(new THREE.BoxGeometry(.605,.02,.025),[0,-.05,z]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(frame,3));
  g.computeVertexNormals();g.scale(1/.605,1/.12,1/.370);g.computeBoundingBox();
  result['panorama-flightframe']=g;
  return result;
}
