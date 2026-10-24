import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

const footprint={x:[-21.5,-4],z:[-21.5,9.4]};
const polygon=[[footprint.x[0],footprint.z[0]],[footprint.x[1],footprint.z[0]],
  [footprint.x[1],footprint.z[1]],[footprint.x[0],footprint.z[1]]].map(([x,z])=>studyToSite({x,y:0,z}));
export function labRoomAt(position){
  if(position.y< -1.3||position.y>.25)return null;
  return polygon.every((a,i)=>{const b=polygon[(i+1)%polygon.length];
    return (b.x-a.x)*(position.z-a.z)-(b.z-a.z)*(position.x-a.x)>=-1e-7;
  })?'lab':null;
}
export const labMaterials={
  labWall:{color:'#b1a48e',roughness:.98},labBrick:{color:'#8b7356',roughness:.98},
  labMortar:{color:'#565247',roughness:1},labOxide:{color:'#655041',roughness:.81,metalness:.45},
  labGreen:{color:'#6c9980',roughness:.84,metalness:.12},labTile:{color:'#c0b9a6',roughness:.7},
  labPlate:{color:'#b7ad8a',roughness:.9,metalness:.12},
  labBlue:{color:'#3558a3',roughness:.5,emissive:'#154fff',emissiveIntensity:1.1},
  labDial:{color:'#c7c3a9',roughness:.7},labRed:{color:'#6b3027',roughness:.6,emissive:'#b12715',emissiveIntensity:.6}
};

export function addLabRooms(layout,{box,floor,beam,railing,stair}){
  const floorHeight=.05,ceilingHeight=4.15,opening={x:[-18.4,-16.4],z:[1.8,5.8]};
  layout.labOratory={sources:['A12','I22','A15'],projectDate:2005,floorHeight,ceilingHeight,sanitaryDrop:1.2,
    confidence:'Photographed forms; footprint, absolute elevation, connection, counts, dimensions and currentness estimated',
    footprint,sanitaryOpening:opening,arrangement:'Authored western lower-floor fit, not a recovered floor plan',
    observedViews:{cells:[0,1,4],bar:[2,3,4],brickPassage:[5],sanitary:[6,7],innerWall:[7,8,9]},
    access:'Inferred raised steel-glass connection from Säule; upper mechanism on taller Säule side; exact location unverified',
    remaining:'Complete contemporary plan, outside Lab entrance, hidden rooms, equipment/currentness and fine material fidelity'};
  layout.parts=layout.parts.filter(p=>p.name!=='Säule column light'||p.center[0]>=-4);
  // Both original overlapping slabs must have the same real opening. Four
  // ordinary rectangular strips retain the existing render/collision contract.
  for(const name of ['forecourt','foyer']){
    const original=layout.floors.find(f=>f.name===name);
    layout.floors=layout.floors.filter(f=>f!==original);
    layout.parts=layout.parts.filter(p=>p.name!==name);
    layout.solids=layout.solids.filter(s=>s.name!==name);
    const [x0,x1]=original.x,[z0,z1]=original.z;
    const strips=[[[x0,x1],[z0,opening.z[0]]],[[x0,x1],[opening.z[1],z1]],
      [[x0,opening.x[0]],opening.z],[[opening.x[1],x1],opening.z]];
    strips.forEach(([x,z],i)=>floor(name+' around Lab sanitary opening '+i,x,z,original.y,
      name==='forecourt'?'ground':'floor',name==='forecourt'?'site':'interior'));
  }
  floor('Lab sanitary lower landing',opening.x,[4.6,5.8],-1.15,'labTile');
  stair('Lab sanitary stair',-17.4,1.8,4.6,-1.15,.05,2,7,'interior');
  for(const x of [-18.49,-16.31]){
    box('Lab sanitary pit wall',[x,-.57,3.8],[.18,1.16,4.18],'labTile','interior',true);
    railing('Lab sanitary guard',[x,.05,1.8],[x,.05,5.8]);
    box('Lab sanitary guard body',[x,.60,3.8],[.075,.075,4.1],'steel','interior',true);
  }
  box('Lab sanitary lower end wall',[-17.4,-.57,5.89],[2.18,1.16,.18],'labTile','interior',true);
  railing('Lab sanitary end guard',[-18.4,.05,5.89],[-16.4,.05,5.89]);
  box('Lab sanitary end guard body',[-17.4,.60,5.89],[2.18,.075,.075],'steel','interior',true);
  for(const x of [-18.38,-16.42])for(let row=0;row<6;row++)for(let tile=0;tile<20;tile++)
    box('Lab sanitary wall tile',[x,-1.04+row*.19,1.91+tile*.19],[.018,.18,.18],'labTile');
  box('Lab sanitary red tube',[-17.4,-.9,5.78],[1.7,.045,.025],'labRed');
  // Preserve the former glass run except for one body-clear, raised panel.
  layout.parts=layout.parts.filter(p=>p.name!=='Säule glass partition left');
  layout.solids=layout.solids.filter(s=>s.name!=='Säule glass partition left');
  for(const [a,b]of [[-21.5,1.5],[3.7,17.5]])
    box('Säule glass partition left',[-4,2.6,(a+b)/2],[.12,5.1,b-a],'lightGlass','interior',true);
  // The raised panel and tracks occupy the taller Säule side of the boundary,
  // so their inferred upper mechanism never cuts through the lower Lab soffit.
  box('Lab raised steel-glass gate',[-3.8,3.9,2.6],[.12,2.5,2.2],'lightGlass','interior',true);
  for(const z of [1.43,3.77])box('Lab gate track',[-3.8,2.85,z],[.17,5.6,.11],'steel','interior',true);
  box('Lab gate upper head',[-3.8,5.64,2.6],[.18,.14,2.5],'steel','interior',true);
  box('Lab front room partition',[-12.75,2.09,9.4],[17.5,4.08,.18],'labWall','interior',true);
  box('Lab concrete soffit',[-12.75,4.24,-6.05],[17.5,.18,30.9],'labWall','interior',true);
  for(const z of [-18,-7,6])box('Lab low concrete beam',[-12.75,3.83,z],[17.5,.46,.65],'labWall','interior',true);
  for(const x of [-21.25])for(const y of [.64,3.75])
    box('Lab wall band',[x,y,-6.05],[.12,y<1?1.18:.8,30.7],'labWall');
  for(const z of [-17,-9,-1,7]){
    box('Lab historic window ledge',[-20.95,1.02,z],[.62,.16,1.6],'stone','interior',true);
    for(const side of [-.88,.88])box('Lab rusticated window jamb',[-21.02,2.1,z+side],[.35,2.3,.25],'stone');
    box('Lab historic lintel',[-21.02,3.3,z],[.35,.24,2.02],'stone');
    for(const y of [1.5,2.3,3.1])box('Lab rusticated joint',[-20.83,y,z-.88],[.045,.035,.27],'darkConcrete');
  }
  for(let i=0;i<5;i++)beam('Lab retained service run',[-20.8+i*.14,3.48,-20.8],[-20.8+i*.14,3.48,8.8],.045,'labOxide');
}

function indexed(positions,indices){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createLabGeometries(){
  const vertices=[],indices=[],nx=20,nz=14,count=(nx+1)*(nz+1);
  for(const side of [0,1])for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const u=i/nx*2-1,v=j/nz*2-1;
    vertices.push(u*.5,.17*(u*u+v*v)-.16-side*.012,v*.5);
  }
  for(let side=0;side<2;side++)for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const a=side*count+j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
    indices.push(...(side?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
  }
  const boundary=[];
  for(let i=0;i<=nx;i++)boundary.push(i);
  for(let j=1;j<=nz;j++)boundary.push(j*(nx+1)+nx);
  for(let i=nx-1;i>=0;i--)boundary.push(nz*(nx+1)+i);
  for(let j=nz-1;j>0;j--)boundary.push(j*(nx+1));
  boundary.forEach((a,i)=>{const b=boundary[(i+1)%boundary.length];indices.push(a,b,a+count,b,b+count,a+count);});
  const profile=[[.5,-.5],[.5,.5],[.38,.5],[.38,-.5],[.5,-.5]].map(([r,y])=>new THREE.Vector2(r,y));
  const insulator=[new THREE.Vector2(.12,-.5)];
  for(let i=0;i<6;i++){
    const y=-.43+i*.15;
    insulator.push(new THREE.Vector2(.18,y),new THREE.Vector2(.48,y+.025),new THREE.Vector2(.40,y+.065),new THREE.Vector2(.18,y+.09));
  }
  insulator.push(new THREE.Vector2(.12,.5));
  const bendPositions=[],bendIndices=[],rows=17,cols=13;
  for(let side=0;side<2;side++)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const theta=i/16*Math.PI/2,phi=j/12*Math.PI*2,r=side?.085:.12;
    bendPositions.push((.32+r*Math.cos(phi))*Math.cos(theta)-.22,(.32+r*Math.cos(phi))*Math.sin(theta)-.22,r*Math.sin(phi));
  }
  for(let side=0;side<2;side++)for(let i=0;i<16;i++)for(let j=0;j<12;j++){
    const a=side*rows*cols+i*cols+j,b=a+cols;
    bendIndices.push(...(side?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));
  }
  for(const i of [0,16])for(let j=0;j<12;j++){
    const a=i*cols+j,b=a+rows*cols;
    bendIndices.push(a,a+1,b,a+1,b+1,b);
  }
  const flower=new THREE.Shape();
  for(let i=0;i<=64;i++){
    const a=i/64*Math.PI*2,r=.39+.08*Math.cos(a*8),x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i)flower.lineTo(x,y);else flower.moveTo(x,y);
  }
  const centre=new THREE.Path();centre.absarc(0,0,.12,0,Math.PI*2,true);flower.holes.push(centre);
  const leaf=new THREE.Shape();leaf.moveTo(0,-.5);leaf.quadraticCurveTo(-.58,-.04,0,.5);leaf.quadraticCurveTo(.40,.05,0,-.5);
  return {'lab-sling':indexed(vertices,indices),'lab-pipe':new THREE.LatheGeometry(profile,20),
    'lab-insulator':new THREE.LatheGeometry(insulator,20),'lab-elbow':indexed(bendPositions,bendIndices),
    'lab-rosette':new THREE.ExtrudeGeometry(flower,{depth:.04,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:16}),
    'lab-leaf':new THREE.ExtrudeGeometry(leaf,{depth:.025,bevelEnabled:true,bevelThickness:.012,bevelSize:.02,bevelSegments:2,curveSegments:12})};
}

export function addLabFixtures(layout,{fixture,box,part,cylinder,rod,assemblyCollision}){
  const front=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
  const horizontal=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  function pipe(name,a,b,diameter,material='labOxide'){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    return part(name,start.add(end).multiplyScalar(.5).toArray(),[diameter,direction.length(),diameter],material,'lab-pipe',false,
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
  }
  function ring(name,p,diameter,material='labOxide',rotation){return part(name,p,[diameter,diameter,diameter],material,'ring',false,rotation);}
  function wheel(x,y,z,diameter=.19){
    ring('valve wheel',[x,y,z],diameter);
    for(let spoke=0;spoke<4;spoke++){
      const a=spoke*Math.PI/2;rod('valve spoke',[x,y,z],[x+Math.cos(a)*diameter*.46,y+Math.sin(a)*diameter*.46,z],.012,'labOxide');
    }
  }
  function chain(a,b){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),length=start.distanceTo(end),count=Math.ceil(length/.075);
    for(let i=0;i<=count;i++){
      const p=start.clone().lerp(end,i/count);ring('chain link',p.toArray(),.057,'steel',i%2?front:undefined);
    }
  }
  fixture('lab-pipe-bar',[-14.3,.05,-16],['A12','I22'],{width:4.8,depth:1.05,height:1.13},()=>{
    box('welded counter body',[0,.52,0],[4.7,1.04,.9],'labPlate',true);
    box('dark worn worktop',[0,1.09,.06],[4.85,.13,1.12],'timber',true);
    for(const x of [-2.39,2.39])box('counter end trim',[x,.57,.06],[.09,1.04,1.12],'steel');
    for(const x of [-1.7,-.8,.1,1,1.9]){
      ring('pipe flange',[x,.64,.49],.19);
      pipe('hollow front pipe',[x,.64,.45],[x,.64,.72],.14);
      for(let bolt=0;bolt<6;bolt++){
        const a=bolt*Math.PI/3;cylinder('flange bolt',[x+Math.cos(a)*.095,.64+Math.sin(a)*.095,.51],.025,.035,'steel',front);
      }
      pipe('low service pipe',[x,.15,.5],[x,.43,.5],.08);wheel(x,.38,.57,.14);
    }
    for(let fin=0;fin<28;fin++)box('counter cooling fin',[-1.93,.47+fin*.017,.58],[.7,.009,.23],'labOxide');
    box('warm bar strip',[-1.93,1.01,.47],[.7,.018,.035],'warm');
    for(const x of [-2.25,2.25]){
      pipe('returned foot pipe',[x,.12,.64],[x,.76,.64],.15);
      part('foot pipe elbow',[x,.73,.7],[.65,.65,.65],'labOxide','lab-elbow');
    }
    pipe('bar foot rail',[-2.2,.23,.83],[2.2,.23,.83],.105);
    assemblyCollision();
  });
  for(let i=0;i<3;i++)fixture('lab-pipe-stool-'+i,[-16+i*1.5,.05,-13.8],['I22'],{width:.62,height:.78},()=>{
    part('rounded saddle',[0,.68,0],[.20,.64,.20],'labOxide','cylinder',false,horizontal);
    pipe('stool pedestal',[0,.1,0],[0,.68,0],.14);
    cylinder('flared pedestal foot',[0,.04,0],.43,.08,'labOxide');
    for(let a=0;a<6;a++){
      const angle=a*Math.PI/3;rod('foot rib',[Math.cos(angle)*.08,.18,Math.sin(angle)*.08],[Math.cos(angle)*.19,.04,Math.sin(angle)*.19],.025,'labOxide');
    }
    assemblyCollision();
  });
  fixture('lab-gauge-wall',[-14.3,.05,-18.2],['I22'],{width:4.8,height:3.5,depth:.5},()=>{
    box('pale machine back',[0,1.75,-.1],[4.8,3.4,.15],'labWall',true);
    for(const y of [1.2,1.85,2.55,3.45])pipe('retained horizontal pipe',[-2.25,y,.06],[2.25,y,.06],.055);
    for(let i=0;i<7;i++){
      const x=-1.98+i*.66;
      pipe('retained vertical pipe',[x,.75,.04],[x,3.45,.04],.045);
      cylinder('valve body',[x,1.8,.13],.12,.16,'labOxide',front);wheel(x,1.8,.25);
      pipe('valve stem',[x,1.8,.05],[x,1.8,.21],.04);
      cylinder('pipe gauge rim',[x,2.85+(i%2)*.42,.15],.26,.09,'steel',front);
      cylinder('gauge face',[x,2.85+(i%2)*.42,.202],.221,.012,'labDial',front);
      const cy=2.85+(i%2)*.42;
      for(let tick=0;tick<18;tick++){
        const a=tick/17*Math.PI*1.5-Math.PI*.75;
        rod('gauge tick',[x+Math.sin(a)*.085,cy+Math.cos(a)*.085,.214],
          [x+Math.sin(a)*.101,cy+Math.cos(a)*.101,.214],.005,'rubber');
      }
      rod('gauge needle',[x,cy,.219],[x+.044,cy+.065,.219],.007,'labRed');
      box('hanging number plate',[x,2.3,.21],[.16,.2,.015],'labDial');
    }
    for(const y of [1,1.53]){
      box('bottle shelf',[0,y,.35],[4.4,.045,.4],'steel');
      for(let i=0;i<18;i++){
        const x=-2.02+i*.235;cylinder('bottle',[x,y+.17,.35],.075,.28,'glass');
        cylinder('bottle neck',[x,y+.34,.35],.03,.08,'glass');
      }
    }
    for(const x of [-1.4,0,1.4])box('bar cooler',[x,.46,.12],[1.05,.85,.44],'pale',true);
    assemblyCollision();
  });
  fixture('lab-insulator-canopy',[-14.3,.05,-16],['I22'],{width:5.1,lowestPoint:2.22,mount:4.07},()=>{
    for(const z of [-.6,.7])rod('canopy rail',[-2.55,3.7,z],[2.55,3.7,z],.03,'steel');
    for(let i=0;i<4;i++){
      const x=-2.15+i*1.43,z=i%2?.7:-.6;
      rod('suspension stem',[x,3.5,z],[x,4.07,z],.028,'steel');
      part('insulator disc',[x,3.19,z],[.23,.58,.23],'labOxide','lab-insulator');
      cylinder('ceramic pendant',[x,2.52,z],.20,.60,'pale');
      cylinder('pendant lens',[x,2.225,z],.13,.02,'warm');
      const points=[];for(let j=0;j<=20;j++)points.push([x-.58+j*.058,3.94+.12*Math.cos(j/20*Math.PI*4),z]);
      for(let j=0;j<points.length-1;j++)rod('sagging cable',points[j],points[j+1],.012,'rubber');
    }
  });
  for(let i=0;i<2;i++)fixture('lab-cage-'+i,[-18.3+i*3.8,.05,-10],['I22'],{width:2.3,depth:2.7,height:2.9},()=>{
    for(const z of [-1.35,1.35])for(const y of [.07,1.32,2.9])rod('cell horizontal',[-1.15,y,z],[1.15,y,z],.028,'steel');
    for(const x of [-1.15,1.15])for(const y of [.07,1.32,2.9])rod('cell side rail',[x,y,-1.35],[x,y,1.35],.028,'steel');
    for(let b=0;b<=12;b++)for(const z of [-1.35,1.35])rod('cell bar',[-1.15+b*2.3/12,.06,z],[-1.15+b*2.3/12,2.9,z],.022,'steel');
    for(let b=0;b<=14;b++)for(const x of [-1.15,1.15])rod('cell bar',[x,.06,-1.35+b*2.7/14],[x,2.9,-1.35+b*2.7/14],.022,'steel');
    part('suspended sling',[0,.93,0],[1.45,1,.88],'rubber','lab-sling');
    for(const x of [-.725,.725])for(const z of [-.44,.44])chain([x,1.11,z],[x*1.35,2.85,z*2.8]);
    for(const x of [-.73,.73])rod('padded support',[x,.93,-.44],[x,.93,.44],.16,'upholstery');
    assemblyCollision();
  });
  for(let i=0;i<2;i++)fixture('lab-bunk-'+i,[-18+i*3.8,.05,-4.8],['I22'],{width:2.6,depth:1.05,height:2.25},()=>{
    for(const x of [-1.3,1.3])for(const z of [-.525,.525]){
      box('perforated upright',[x,1.14,z],[.07,2.28,.075],'labOxide');
      for(let hole=0;hole<17;hole++)box('upright hole',[x, .16+hole*.12,z+.041],[.025,.035,.005],'rubber');
    }
    for(const y of [.44,1.58]){
      box('bunk pad',[0,y,0],[2.49,.09,.97],'rubber',true);
      for(const z of [-.52,.52])box('bunk side rail',[0,y-.08,z],[2.65,.07,.07],'labOxide');
    }
    assemblyCollision();
  });
  fixture('lab-brick-passage',[-19,.05,-1.3],['I22'],{width:2.5,depth:2.3,openingHeight:1.12},()=>{
    function brickWall(cx,cz,width,depth){
      box('mortar backing',[cx,1.45,cz],[width,2.9,depth],'labMortar',true);
      const across=Math.floor(width/.25);
      for(let row=0;row<23;row++)for(let b=0;b<across;b++){
        const x=cx-width/2+.13+b*.25+(row%2)*.06;
        box('exposed brick',[x,.065+row*.124,cz+depth/2+.018],[.235,.112,.045],'labBrick');
      }
      for(const side of [-1,1])for(let row=0;row<23;row++)for(let b=0;b<Math.floor(depth/.25);b++)
        box('exposed brick flank',[cx+side*(width/2+.018),.065+row*.124,cz-depth/2+.13+b*.25+(row%2)*.06],
          [.045,.112,.235],'labBrick');
    }
    brickWall(-.96,0,.58,2.3);brickWall(.96,0,.58,2.3);
    box('low brick opening lintel',[0,1.47,1.0],[1.4,.7,.26],'labWall',true);
    for(const x of [-.49,.49])box('brick opening jamb',[x,.55,1.0],[.3,1.1,.26],'labBrick',true);
    pipe('blue-lit ventilation',[-1.1,2.42,0],[1.1,2.42,0],.24,'aluminium');
    box('alcove blue strip',[0,2.62,-.82],[1.3,.035,.03],'labBlue');
  });
  fixture('lab-green-screen',[-20,.05,4.5],['I22'],{width:2.1,depth:1.5,height:2.65},()=>{
    function panel(cx,cz,angle){
      const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle);
      part('cast panel',[cx,1.03,cz],[.66,1.82,.07],'labGreen','box',true,rotation);
      // The cast relief stands up to 3.7 cm proud of the plate's front. Retain
      // the thin visible casting and conservatively include that ornament in
      // its paired body clearance instead of blocking the entire L-shaped bay.
      const solid=layout.solids.at(-1),axis=angle?'x':'z';
      solid[axis][1]+=.04;solid.confidence='Plate plus 4 cm front cast-ornament clearance';
      const point=(x,y,z)=>[cx+Math.cos(angle)*x+Math.sin(angle)*z,y,cz-Math.sin(angle)*x+Math.cos(angle)*z];
      for(const side of [-.294,.294])rod('cast panel rim',point(side,.14,.055),point(side,1.91,.055),.025,'labOxide');
      for(const y of [.19,.64,1.83])rod('cast horizontal moulding',point(-.31,y,.055),point(.31,y,.055),.025,'labOxide');
      for(const y of [.42,1.3]){
        const q=rotation.clone();part('cast rosette',point(0,y,.06),[.20,.28,.18],'labOxide','lab-rosette',false,q);
      }
      for(const side of [-1,1])for(let i=0;i<3;i++){
        const q=rotation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),side*.48));
        part('cast leaf',point(side*(.04+i*.025),1.08-i*.11,.065),[.10,.18,.14],'labOxide','lab-leaf',false,q);
      }
      const diamond=[[0,.29],[.2,.43],[0,.57],[-.2,.43],[0,.29]];
      for(let i=0;i<4;i++)rod('lower diamond relief',point(...[diamond[i][0],diamond[i][1],.06]),point(...[diamond[i+1][0],diamond[i+1][1],.06]),.021,'labOxide');
    }
    for(let i=0;i<3;i++)panel(-.70+i*.70,-.65,0);
    for(let i=0;i<2;i++)panel(1.02,-.25+i*.70,Math.PI/2);
    for(const [x,z]of [[-1.05,-.65],[-.35,-.65],[.35,-.65],[1.05,-.65],[1.05,.05],[1.05,.75]]){
      part('cast upright',[x,1.12,z],[.075,2.24,.075],'labOxide','cylinder',true);
      cylinder('finial neck',[x,2.30,z],.045,.15,'labOxide');
      part('finial',[x,2.42,z],[.12,.19,.12],'labGreen','sphere');
      rod('canopy spoke',[x,2.27,z],[0,2.63,0],.024,'labOxide');
    }
    for(const z of [-.35,.28]){
      box('urinal apron',[.4,.8,z],[.45,1.1,.48],'labGreen',true);
      cylinder('water pipe',[.4,1.6,z],.025,.5,'labOxide');
    }
  });
  fixture('lab-window-bench',[-20.3,.05,8],['I22'],{width:1.5,seatHeight:.55,depth:.7},()=>{
    box('recessed seat',[0,.51,0],[.7,.12,1.5],'upholstery',true);
    box('bench plinth',[0,.24,0],[.6,.48,1.3],'labWall',true);
    box('underseat blue strip',[.31,.27,0],[.025,.04,1.2],'labBlue');
  });
  for(const [i,z]of [-13,-5,3].entries())fixture('lab-caged-lamp-'+i,[-20.9,.05,z],['I22'],{height:2.5,width:.2},()=>{
    box('wall fixing',[-.15,2.5,0],[.04,.24,.16],'labOxide');
    rod('lamp bracket',[-.13,2.5,0],[.22,2.5,0],.025,'steel');
    cylinder('red caged bulb',[.25,2.5,0],.10,.22,'labRed');
    for(const y of [2.35,2.65])ring('lamp guard ring',[.25,y,0],.17,'steel',front);
    for(let j=0;j<6;j++){
      const a=j*Math.PI/3;rod('lamp guard',[.25+Math.cos(a)*.085,2.35,Math.sin(a)*.085],
        [.25+Math.cos(a)*.085,2.65,Math.sin(a)*.085],.009,'steel');
    }
  });
}
