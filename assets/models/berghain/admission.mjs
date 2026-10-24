import {studyToSite} from './calibration.mjs';

// Photographs establish forms, accounts establish a sequence, neither is a plan.
export const admissionMaterials={
  admissionZinc:{color:'#929994',roughness:.47,metalness:.7},
  admissionGreen:{color:'#087c63',roughness:.7,metalness:.22},
  admissionRust:{color:'#694738',roughness:.92,metalness:.35},
  admissionWall:{color:'#69645b',roughness:1},
  admissionScuff:{color:'#8c8677',roughness:1},
  admissionPaintBlack:{color:'#202522',roughness:1},
  admissionPaintWhite:{color:'#c4c0aa',roughness:1},
  admissionPaintRed:{color:'#914635',roughness:1},
  admissionPaintYellow:{color:'#b0ad35',roughness:1},
  admissionPaintViolet:{color:'#6d4f69',roughness:1},
  admissionCurtain:{color:'#8a9185',roughness:.42,transparent:true,opacity:.48,depthWrite:false},
  admissionLight:{color:'#fff2cf',roughness:.4,emissive:'#ffe3ad',emissiveIntensity:1.5}
};
const site=(x,z,y=.05)=>studyToSite({x,y,z});
const roomPolygon=[[-8.7,16.4],[-1.8,16.4],[-1.8,21.6],[-8.7,21.6]].map(([x,z])=>site(x,z));
export function admissionRoomAt(position){
  if(position.y<-.1||position.y>1)return false;
  return roomPolygon.every((a,i)=>{
    const b=roomPolygon[(i+1)%roomPolygon.length];
    return (b.x-a.x)*(position.z-a.z)-(b.z-a.z)*(position.x-a.x)>=0;
  });
}

export function addAdmission(layout){
  const first=layout.parts.length,source={exterior:['ENT01','ENT02'],interior:['ENT03','ENT04']};
  const part=(name,center,size,material,shape='box',solid=false,zone='interior')=>{
    const p={name,center,size,material,shape,section:'admission',admission:true,zone,sources:source[zone],
      confidence:'Source-informed form; dimensions and placement estimated',instanceTone:.96};
    layout.parts.push(p);
    if(solid)layout.solids.push({name,admission:true,x:[center[0]-size[0]/2,center[0]+size[0]/2],
      y:[center[1]-size[1]/2,center[1]+size[1]/2],z:[center[2]-size[2]/2,center[2]+size[2]/2],renderPart:p});
    return p;
  };
  const box=(name,center,size,material,solid=false,zone='interior')=>part(name,center,size,material,'box',solid,zone);
  const beam=(name,start,end,width,material,zone='exterior')=>layout.parts.push({name,start,end,width,material,
    shape:'beam',section:'admission',admission:true,zone,sources:source[zone],
    confidence:'Source-informed form; dimensions and placement estimated',instanceTone:.96});
  function tube(name,x,z,length,alongX=false){
    for(const y of [.5,1.02]){
      const p=box(name,[x,y,z],alongX?[length,.055,.055]:[.055,.055,length],'admissionZinc',true,'exterior');
      p.tubeAxis=alongX?'x':'z';
    }
    const count=Math.ceil(length/1.6);
    for(let i=0;i<=count;i++){
      const d=-length/2+i*length/count;
      part('queue tubular post',[x+(alongX?d:0),.54,z+(alongX?0:d)],[.065,1.08,.065],'admissionZinc','cylinder',true,'exterior');
    }
  }
  // Alternating open ends make actual traversable switchbacks. Preserve the
  // central approach and the older x=-6 queue rail behind this closer group.
  for(const [x,z0,z1] of [[-5,23,29],[-3.4,24.5,29],[-1.8,23,27.5],[-.6,24.5,29]])
    tube('queue tube',x,(z0+z1)/2,z1-z0);
  function fence(x,z,width){
    tube('removable fence rail',x,z,width,true);
    for(let dx=-width/2+.16;dx<width/2;dx+=.18)
      part('removable fence vertical',[x+dx,.66,z],[.022,.72,.022],'admissionZinc','cylinder',false,'exterior');
    for(const dx of [-width*.42,width*.42])box('removable fence foot',[x+dx,.07,z],[.45,.14,.65],'admissionRust',true,'exterior');
    for(let i=0;i<13;i++)box('rail sticker',[x-width*.44+i*width*.071,1.026,z+.034],
      [.1+(i%3)*.035,.07+(i%2)*.035,.006],['admissionPaintWhite','admissionPaintRed','admissionPaintYellow'][i%3],false,'exterior');
  }
  fence(4.1,24.8,3.3);fence(-10.1,24.3,4.4);
  part('green entrance post',[-1.12,.95,22.95],[.19,1.9,.19],'admissionGreen','cylinder',true,'exterior');
  for(const y of [.54,1.04,1.56])box('green post sticker',[-1.12,y,23.052],[.12,.13,.008],'admissionPaintWhite',false,'exterior');
  for(const x of [-5,-1.9])part('side chain post',[x,.54,22.92],[.075,1.08,.075],'admissionZinc','cylinder',true,'exterior');
  for(let i=0;i<16;i++)part('side gate chain link',[-4.94+i*.2,.88-.15*Math.sin(i/15*Math.PI),22.92],
    [.17,.075,.10],'admissionZinc','ring',false,'exterior');
  box('side gate chain span',[-3.45,.8,22.92],[3.1,.12,.06],'admissionZinc',true,'exterior');

  // Original cobbles extend the existing close-door field; no reference pixels.
  for(let row=0;row<15;row++)for(let col=0;col<63;col++){
    const x=-15+col*.48+(row%2)*.24,z=22.75+row*.43;
    if(x> -3.65&&x<3.9&&z<27.6)continue;
    const p=box('admission forecourt cobble',[x,.043,z],[.44,.025,.39],(row+col)%4===0?'paving':'pathStone',false,'exterior');
    p.instanceTone=.81+((row*17+col*13)%19)/100;
  }
  // Original layered paint: uneven filled gestures, broken loops and smaller
  // overpainted scribbles. No placards, repeated glyph or readable copied tag.
  // Flatten the brush marks after calibration so they read as paint, not rods.
  const palette=['admissionPaintRed','admissionPaintBlack','admissionPaintViolet','admissionPaintYellow','admissionPaintWhite'];
  let seed=7391;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function paint(points,width,ink,layer){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];
      if(Math.min(a[0],b[0])-width/2<.91&&Math.max(a[0],b[0])+width/2>-.91&&Math.min(a[1],b[1])<2.68)continue;
      const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
      // Ground glazing is recessed from the masonry; marks follow its plane.
      const bay=Math.round(x/4)*4,onWindow=Math.abs(x-bay)<.55&&Math.abs(bay)>1&&y>1.34&&y<3.16;
      const reveal=Math.abs(Math.abs(x)-1.84)<.12;
      const z=(onWindow?22.06:reveal?22.58:Math.abs(x)<1.6?22.36:22.29)+layer*.005;
      beam('layered original plinth paint',[a[0],a[1],z],[b[0],b[1],z],width,ink);
      layout.parts.at(-1).paintStroke=true;
    }
  }
  for(let row=0;row<2;row++)for(let i=0;i<35;i++){
    const x=-14.4+i*.84+(random()-.5)*.6,y=.85+row*1.7+(random()-.5)*.85;
    const w=.75+random()*1.35,h=.45+random()*1.05,tilt=(random()-.5)*.65;
    const ink=palette[Math.floor(random()*palette.length)];
    if(i%2===0){
      // Thick crossing swaths give each old colour mass a ragged silhouette.
      const points=Array.from({length:5},(_,j)=>[x+(j%2?1:-1)*w*(.35+random()*.15)+j*tilt*.13,
        Math.max(.18,y-h*.4+j*h*.19+(random()-.5)*.1)]);
      paint(points,.17+random()*.21,ink,0);
    }
    const phase=random()*Math.PI*2,loop=[];
    for(let j=0;j<10;j++){
      const angle=phase+j*(.57+random()*.09),bend=.8+random()*.2;
      loop.push([x+Math.cos(angle)*w*.48*bend+Math.sin(angle)*tilt,
        Math.max(.16,Math.min(3.97,y+Math.sin(angle)*h*.5*bend))]);
    }
    paint(loop,.028+random()*.045,palette[(i+row*2+1)%palette.length],1);
    if(i%3!==0){
      const scrawl=Array.from({length:5},(_,j)=>[x-w*.55+j*w*.28,
        Math.max(.14,Math.min(3.97,y+(random()-.5)*h*1.1))]);
      paint(scrawl,.023+random()*.035,i%3?'admissionPaintWhite':'admissionPaintBlack',2);
    }
    if(i%3===0)for(let j=0;j<2;j++){
      const px=x+(random()-.5)*w,py=Math.max(.2,y-h*.3);
      paint([[px,py],[px+.012,Math.max(.1,py-.15-random()*.35)]],.009+random()*.009,ink,1);
    }
  }
  // Sparse small high strokes interrupt the older large forms, particularly
  // above the entrance; their irregular baselines avoid a repeated sign row.
  for(let i=0;i<18;i++){
    const x=-13.7+i*1.57,y=3.3+random()*.45;
    paint([[x-.36,y-.1],[x-.22,y+.16],[x+.03,y-.07],[x+.18,y+.11],[x+.45,y-.17]],
      .025+random()*.02,i%2?'admissionPaintBlack':'admissionPaintRed',3);
  }
  // Upright offset hoops and bright diagonal braces, identification unknown.
  box('ring structure base',[10,.19,24.35],[5.5,.38,1.5],'admissionRust',true,'exterior');
  for(const [x,z,diameter,height] of [[9.75,24.05,4.75,5.5],[10.15,24.72,4.5,5.6]]){
    part('upright rusty ring',[x,3.18,z],[diameter,height,.9],'admissionRust','ring',false,'exterior');
    for(const side of [-1,1])box('ring structure shoe',[x+side*1.7,.49,z],[.34,.6,.3],'admissionRust',true,'exterior');
    beam('ring bright diagonal brace',[x-1.75,.49,z+.08],[x+1.7,5.38,z+.08],.12,'admissionZinc');
    beam('ring rusty opposing brace',[x+1.75,.49,z-.08],[x-1.7,5.38,z-.08],.1,'admissionRust');
  }
  layout.solids.push({name:'ring structure assembly',admission:true,x:[7.18,12.75],y:[0,6.2],z:[23.6,25.1],
    collisionPolicy:'Conservative full footprint covers open hoops, shoes and diagonal braces; interior of structure is not a public path'});

  // Recessed human-scale opening within the existing masonry bay. These parts
  // are registered to the dynamic door's exact site plane in finishAdmission.
  const scaleX=site(1,22.28,0).x-site(0,22.28,0).x,half=.675/scaleX;
  for(const side of [-1,1]){
    const p=box('entrance recessed infill',[side*(1.6+half)/2,1.7,22.16],[1.6-half,3.4,.28],'admissionWall',true,'exterior');p.doorFrame=true;
    const j=box('entrance narrow steel jamb',[side*(half+.032),1.25,22.28],[.064,2.5,.12],'steel',true,'exterior');j.doorFrame=true;
  }
  for(const [name,center,size,mat] of [
    ['entrance recessed head',[0,2.925,22.16],[half*2,.95,.28],'admissionWall'],
    ['entrance narrow steel head',[0,2.5,22.28],[half*2+.128,.1,.12],'steel'],
    ['entrance recessed soffit',[0,2.49,21.94],[half*2,.08,.5],'darkConcrete']])
    box(name,center,size,mat,true,'exterior').doorFrame=true;
  for(const [x,y,z] of [[0,2.78,22.55],[-8,4.03,22.6],[8,4.03,22.6]]){
    box('entrance floodlight bracket',[x,y+.1,z-.15],[.28,.12,.35],'steel',false,'exterior');
    box('entrance floodlight housing',[x,y,z],[.42,.22,.15],'steel',false,'exterior');
    box('entrance floodlight lens',[x,y-.03,z+.081],[.35,.13,.018],'admissionLight',false,'exterior');
  }

  // Low public room left of the entrance; the foyer/stair remain independent.
  const wall=(name,x,z,w,d)=>box(name,[x,1.55,z],[w,3,d],'admissionWall',true);
  wall('admission west wall',-8.7,19,.16,5.2);
  wall('admission south lining',-5.25,21.6,7.06,.16);
  wall('admission east wall north',-1.8,17.85,.16,2.9);
  wall('admission east wall south',-1.8,21.35,.16,.5);
  box('admission entry lintel',[-1.8,2.79,20.2],[.16,.52,1.8],'admissionWall',true);
  wall('admission north wall west',-8.05,16.4,1.3,.16);
  wall('admission north wall east',-3.8,16.4,4,.16);
  box('admission curtain lintel',[-6.6,2.79,16.4],[1.6,.52,.16],'admissionWall',true);
  box('admission ceiling',[-5.25,3.13,19],[7.06,.16,5.36],'darkConcrete',true);
  for(const [x,z,w,d] of [[-8.59,19,.024,5],[-5.25,21.49,6.8,.024],[-1.91,17.85,.024,2.7]])
    box('admission worn lower lining',[x,.55,z],[w,1,d],'darkConcrete');
  for(let i=0;i<18;i++)box('admission plaster abrasion',[-8.601,.3+(i%4)*.35,16.7+i*.26],
    [.012,.1+(i%3)*.11,.17+(i%2)*.08],'admissionScuff');
  for(const z of [18.7,20.3]){
    box('inspection counter body',[-7.8,.55,z],[1.25,1,1.12],'steel',true);
    box('inspection counter worktop',[-7.8,1.09,z],[1.38,.08,1.24],'rubber',true);
    box('inspection counter front trim',[-7.095,.96,z],[.025,.08,1.24],'admissionZinc');
    box('inspection tray',[-7.68,1.15,z],[.5,.045,.36],'admissionZinc');
    for(const dz of [-.18,.18])box('inspection tray lip',[-7.68,1.19,z+dz],[.5,.07,.018],'admissionZinc');
    box('phone sticker sheet',[-7.67,1.138,z+.4],[.19,.006,.2],'admissionPaintWhite');
    for(let i=0;i<3;i++)box('phone sticker disc',[-7.72+i*.05,1.144,z+.4],[.035,.006,.11],'admissionPaintYellow');
  }
  // Enclosed rear of hatch does not invent an explorable staff connection.
  wall('cashier booth side',-4.3,17.3,.12,1.8);
  box('cashier counter',[-3.1,.64,18.15],[2.4,1.18,.4],'steel',true);
  box('cashier counter ledge',[-3.1,1.27,18.15],[2.5,.08,.64],'rubber',true);
  box('cashier hatch head',[-3.1,2.55,18.15],[2.4,1,.12],'admissionWall',true);
  for(const x of [-4.25,-1.95])box('cashier hatch jamb',[x,1.67,18.15],[.1,.7,.14],'admissionZinc',true);
  box('cashier desk rear',[-3.1,1.15,17.1],[1.9,.08,.55],'timber');
  box('cashier terminal',[-2.7,1.4,17.97],[.29,.24,.12],'rubber');
  box('cashier terminal display',[-2.7,1.42,18.037],[.22,.13,.009],'admissionGreen');
  box('cashier payment tray',[-3.35,1.32,18.27],[.39,.025,.25],'admissionZinc');
  box('cashier task-light housing',[-3.1,2,18.55],[.72,.08,.16],'steel');
  box('cashier task-light diffuser',[-3.1,1.951,18.55],[.64,.018,.12],'admissionLight');
  for(const x of [-3.35,-2.85])box('cashier task-light bracket',[x,2.035,18.35],[.035,.03,.42],'steel');
  // Open/parted strips leave a genuine clear aperture down the middle.
  box('curtain suspension rail',[-6.6,2.48,16.4],[1.7,.07,.12],'admissionZinc');
  for(const side of [-1,1])for(let i=0;i<3;i++)box('parted plastic curtain strip',
    [-6.6+side*(.55+i*.1),1.3,16.4+(i%2)*.06],[.13,2.28,.018],'admissionCurtain');
  for(const z of [18.05,20.45]){
    box('admission fluorescent housing',[-5.25,2.94,z],[1.25,.11,.21],'steel');
    box('admission fluorescent diffuser',[-5.25,2.875,z],[1.15,.035,.15],'admissionLight');
  }
  beam('admission exposed conduit',[-8.52,2.85,16.6],[-8.52,2.85,21.4],.035,'steel','interior');
  box('admission junction box',[-8.52,2.65,20.6],[.09,.23,.18],'steel');

  layout.admission={sources:['ENT01','ENT02','ENT03','ENT04'],
    confidence:'Photographed exterior forms and reported admission sequence; dimensions, placement and present-day configuration estimated',
    geometry:'Original instanced geometry; no reference pixels, readable third-party tags or artwork identification',
    exterior:{observed:['cobbled forecourt','parallel tubular barriers','stickered removable fence','green post','chain gate','layered plinth paint','door floodlights','upright offset rusty rings and diagonal braces'],
      estimated:['lane count and turns','door dimensions','ring dimensions and location'],sources:source.exterior,
      ringCollision:'Conservative complete assembly footprint; open hoops and diagonals are not a walking route'},
    interior:{supported:['bag-check room left of entrance','inspection then cashier','return toward wardrobe','plastic strip curtain'],
      estimated:['room footprint','ceiling height','two inspection counters','cashier orientation','curtain position','finishes and practical fixtures'],
      authorFootprint:{x:[-8.7,-1.8],z:[16.4,21.6]},floorHeight:.05,ceilingUnderside:3.05,sources:source.interior},
    door:{center:{x:0,y:0,z:22.28},clearWidth:1.35,clearHeight:2.45,authorHalfWidth:half},
    route:[[0,29],[0,30],[-4.2,30],[-4.2,23.6],[-2.6,23.6],[-2.6,28.4],[-1.2,28.4],[-1.2,23.5],[0,23.5],[0,20.25],[-6.3,20.25],[-6.3,19],[-3.2,19],[-5.3,19],[-6.6,17.4],[-6.6,15.2],[-8.8,14.4],[-11,14.4]].map(([x,z])=>site(x,z)),
    viewpoints:{queue:{position:site(-1.2,28.4),yaw:.2},inspection:{position:site(-5.7,20.15),yaw:1.25},cashier:{position:site(-3.2,19),yaw:0},curtain:{position:site(-6.6,18),yaw:0}},
    practicalLights:[{position:site(-5.25,18.05,2.79),target:site(-5.25,18.05,.6)},{position:site(-5.25,20.45,2.79),target:site(-5.25,20.45,.6)},
      {position:site(-3.1,18.55,1.94),target:site(-3.1,17.5,1.1)}],
    partCount:layout.parts.length-first};
}

export function finishAdmission(layout){
  const doorOrigin=site(0,22.28,0),dx=-doorOrigin.x,dz=22.28-doorOrigin.z;
  for(const p of layout.parts.filter(p=>p.admission)){
    if(p.paintStroke){
      const [a,b]=[p.start,p.end],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
      p.matrix=[dy/length*p.width,-dx/length*p.width,0,0,dx,dy,b[2]-a[2],0,0,0,.006,0,
        (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,1];
    }
    if(p.doorFrame){
      p.matrix[12]+=dx;p.matrix[14]+=dz;p.center[0]+=dx;p.center[2]+=dz;
      const solid=layout.solids.find(s=>s.renderPart===p);
      solid.x=solid.x.map(v=>v+dx);solid.z=solid.z.map(v=>v+dz);
      solid.polygon=solid.polygon.map(([x,z])=>[x+dx,z+dz]);
    }
    if(!p.tubeAxis)continue;
    // Cylinder y-axis is laid along the calibrated rail. Existing enclosing box
    // collision stays fitted to its diameter and endpoint caps.
    const m=p.matrix,axis=p.tubeAxis==='x'?0:2;
    const length=[m[axis*4],m[axis*4+1],m[axis*4+2]],thickness=[m[4],m[5],m[6]];
    const remaining=axis===0?[m[8],m[9],m[10]]:[m[0],m[1],m[2]];
    p.matrix=[...thickness,0,...length,0,...remaining.map(v=>axis===0?-v:v),0,m[12],m[13],m[14],1];p.shape='cylinder';
  }
}
