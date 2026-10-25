import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';
import {studyToSite} from './calibration.mjs';

export const mainBarMaterials={
  mainBarPlaster:{color:'#ece5d4',roughness:.98},
  mainBarFixture:{color:'#252824',roughness:.65,metalness:.6},
  mainBarLamp:{color:'#ffe5bd',roughness:.4,emissive:'#ffcd89',emissiveIntensity:1.6},
  mainBarGlass:{color:'#a0aaa4',roughness:.22,transparent:true,opacity:.14},
  mainBarGlow:{color:'#d6c394',roughness:.48,emissive:'#efc773',emissiveIntensity:.7},
  mainBarRoofBlue:{color:'#142ca2',roughness:.38,emissive:'#080cb4',emissiveIntensity:.65},
  mainBarRoofDim:{color:'#15256f',roughness:.42,emissive:'#07146b',emissiveIntensity:.45}
};
const corner={x:.75,z:7,outer:1.3,inner:.25,segments:24};
function arcPlan(outer,inner,depth){
  const points=[];
  for(let i=0;i<=corner.segments;i++){
    const a=Math.PI-i*Math.PI/2/corner.segments;points.push(new THREE.Vector2(Math.cos(a)*outer,-Math.sin(a)*outer));
  }
  for(let i=corner.segments;i>=0;i--){
    const a=Math.PI-i*Math.PI/2/corner.segments;points.push(new THREE.Vector2(Math.cos(a)*inner,-Math.sin(a)*inner));
  }
  return new THREE.ExtrudeGeometry(new THREE.Shape(points),{depth,bevelEnabled:false})
    .rotateX(-Math.PI/2).translate(0,-depth/2,0);
}
export function createMainBarGeometries(){
  const seat=[[0,-.025],[.14,-.025],[.193,-.012],[.2,.016],[.192,.026],[.16,.009],[0,.004]];
  const fitting=[[0,0],[.075,0],[.075,.025],[.045,.04],[.065,.065],[.065,.085],[.037,.10],
    [.055,.13],[.055,.15],[.025,.17],[.04,.20],[.04,.22],[0,.22]];
  const relief=[[0,0],[.56,0],[.595,.008],[.61,.025],[.60,.043],[.57,.05],
    [.53,.027],[.51,.019],[.18,.019],[.155,.035],[.14,.058],[0,.058]];
  return {
    'main-bar-corner-top':arcPlan(corner.outer,corner.inner,.075),
    'main-bar-corner-body':arcPlan(corner.outer-.025,corner.inner+.025,1.025),
    'main-bar-corner-band':arcPlan(corner.outer+.012,corner.outer-.012,.16),
    'main-bar-stool-seat':new THREE.LatheGeometry(seat.map(p=>new THREE.Vector2(...p)),24).translate(0,-.0005,0).scale(2.5,1/.051,2.5),
    'main-bar-stepped-fitting':new THREE.LatheGeometry(fitting.map(p=>new THREE.Vector2(...p)),20),
    'main-bar-medallion':new THREE.LatheGeometry(relief.map(p=>new THREE.Vector2(...p)),32)
      .translate(0,-.029,0).scale(1/1.22,1/.058,1/1.22)
  };
}
const site=values=>{const p=studyToSite({x:values[0],y:values[1],z:values[2]});return[p.x,p.y,p.z];};

export function createMainBarLights(lighting){
  const group=new THREE.Group();group.name='bar practical lights';
  for(const definition of lighting.lights){
    const light=new THREE.SpotLight(definition.color,definition.intensity,definition.range,definition.angle,definition.penumbra,2);
    light.name=definition.name;light.position.fromArray(definition.position);light.target.position.fromArray(definition.target);
    group.add(light,light.target);
  }
  return group;
}

function addBarRoof(layout,box,anchor,length){
  const floor=layout.mainBar.floorHeight,west=layout.mainBar.screenAnchor[0]-.25,east=anchor[0]-.48;
  const width=east-west,depth=length+.15,start=anchor[2]-depth/2,bayDepth=depth/4;
  const columns=layout.solids.filter(s=>s.name==='load-bearing column'&&s.y[1]>floor+11&&s.y[0]<floor+11.73);
  const roof={sources:['I23'],bayCount:4,grid:{columns:6,rows:4},center:[(west+east)/2,floor+11,anchor[2]],
    beamUnderside:floor+11,panelUnderside:floor+11.44,coffers:[],
    columnNotches:'Blue panes and steel lattice are fitted around retained column bounds; concrete backing and roof beams meet columns as structural joints',
    confidence:'I23 view11 observed concrete cross-beams and blue gridded panels; four bays, dimensions, grid count and captured color inferred. Optical medium and current illumination unverified.'};
  layout.mainBar.interiorFacade.roof=roof;
  const add=(name,center,size,material,role)=>{
    let rectangles=[[center[0]-size[0]/2,center[0]+size[0]/2,center[2]-size[2]/2,center[2]+size[2]/2]];
    if(role==='roof appearance pane'||role==='roof lattice')for(const c of columns){
      const [cx0,cx1,cz0,cz1]=[c.x[0]-.015,c.x[1]+.015,c.z[0]-.015,c.z[1]+.015];
      rectangles=rectangles.flatMap(([x0,x1,z0,z1])=>{
        if(x1<=cx0||x0>=cx1||z1<=cz0||z0>=cz1)return [[x0,x1,z0,z1]];
        const left=Math.max(x0,cx0),right=Math.min(x1,cx1),low=Math.max(z0,cz0),high=Math.min(z1,cz1);
        return [[x0,left,z0,z1],[right,x1,z0,z1],[left,right,z0,low],[left,right,high,z1]]
          .filter(([a,b,c,d])=>b-a>.01&&d-c>.01);
      });
    }
    for(const [x0,x1,z0,z1]of rectangles)
      box(name,[(x0+x1)/2-anchor[0],center[1]-anchor[1],(z0+z1)/2-anchor[2]],[x1-x0,size[1],z1-z0],material,true).role=role;
  };
  add('roof backing',[(west+east)/2,floor+11.64,anchor[2]],[width,.18,depth+.28],'concrete','roof backing');
  for(const x of [west+.12,east-.12])
    add('roof longitudinal beam',[x,floor+11.275,anchor[2]],[.24,.55,depth+.28],'concrete','roof beam');
  for(let i=0;i<=4;i++)
    add('roof cross-beam',[(west+east)/2,floor+11.275,start+i*bayDepth],[width,.55,.28],'concrete','roof beam');
  for(let bay=0;bay<4;bay++){
    const x0=west+.24,x1=east-.24,z0=start+bay*bayDepth+.14,z1=start+(bay+1)*bayDepth-.14;
    const cellWidth=(x1-x0)/6,cellDepth=(z1-z0)/4;
    roof.coffers.push({x:[x0,x1],z:[z0,z1]});
    for(let column=0;column<6;column++)for(let row=0;row<4;row++)
      add('blue roof pane',[x0+(column+.5)*cellWidth,floor+11.46,z0+(row+.5)*cellDepth],
        [cellWidth-.035,.04,cellDepth-.035],row===0?'mainBarRoofBlue':'mainBarRoofDim','roof appearance pane');
    for(let column=0;column<=6;column++)
      add('roof longitudinal lattice',[x0+column*cellWidth,floor+11.405,(z0+z1)/2],[.035,.07,z1-z0+.035],'steel','roof lattice');
    for(let row=0;row<=4;row++)
      add('roof cross lattice',[(x0+x1)/2,floor+11.405,z0+row*cellDepth],[x1-x0+.035,.07,.035],'steel','roof lattice');
  }
}

function addHistoricBarFacade(layout,{fixture,part,box}){
  const floor=layout.mainBar.floorHeight,anchor=site([22,floor,-4]);
  const next=site([22,floor,0]),pitch=Math.hypot(next[0]-anchor[0],next[2]-anchor[2]),length=pitch*5;
  const angle=Math.atan2(next[0]-anchor[0],next[2]-anchor[2]);
  const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle);
  const discRotation=rotation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2));
  const offset=point=>new THREE.Vector3(...point).applyQuaternion(rotation).toArray();
  const placed=(name,center,size,material='mainBarPlaster',solid=true)=>part(name,offset(center),size,material,'box',solid,rotation);
  const bayCenters=Array.from({length:5},(_,i)=>offset([0,0,(i-2)*pitch]).map((v,j)=>v+anchor[j]));
  const beamCenter=site([19,12.95,-6]);
  const inferred=layout.parts.find(p=>p.name==='structural beam'&&p.center.every((v,i)=>Math.abs(v-beamCenter[i])<(i===1?.05:.001)));
  if(!inferred)throw Error('The inferred bar-room beam must be resolved before adding the historic facade');
  layout.parts=layout.parts.filter(p=>p!==inferred);
  for(const [low,high]of [[-21,-14],[6,9]]){
    const fraction=(high-low)/30,shift=((low+high)/2+6)/30,matrix=[...inferred.matrix];
    for(let i=0;i<3;i++){matrix[12+i]+=inferred.matrix[8+i]*shift;matrix[8+i]*=fraction;}
    layout.parts.push({...inferred,name:'retained bar-boundary beam',center:matrix.slice(12,15),
      size:[inferred.size[0],inferred.size[1],inferred.size[2]*fraction],matrix});
  }
  layout.mainBar.interiorFacade={sources:['A07','I23'],clearHeight:11,ceilingUnderside:floor+11,bayCenters,
    lowerReliefCenterHeight:1.9,lowerWindowSillHeight:2.8,
    role:'Former exterior facade now inside the bar room',bayCount:5,medallionRows:2,
    confidence:'Architect-reported approximate room height; footprint, bay sizes/counts, ornament depth and contemporary arrangement inferred',
    structuralConnections:'Existing concrete supports meet the new room ceiling; exterior hull and floor grid retained',
    beamCorrection:'I23 views12/16 show clear space across the upper relief row. Trim the old inferred longitudinal beam within this bar room; retain its exterior sections and all columns.'};
  const practicalLighting={sources:['I23'],lights:[],
    confidence:'Views12/13/16 show warm localized upward wall wash. Six fixtures, housings, color, candela, range and cone are inferred appearance parameters; exact equipment and present-day operation unverified.'};
  layout.mainBar.interiorFacade.practicalLighting=practicalLighting;
  fixture('main-bar-interior-facade',[22,floor,-4],['A07','I23'],{clearHeight:11,length,bays:5},()=>{
    const width=1.55,flank=(pitch-width)/2;
    for(let bay=0;bay<5;bay++){
      const z=(bay-2)*pitch;
      for(const side of [-1,1])placed('window flank',[-.53,5.5,z+side*(pitch+width)/4],[.10,11,flank]);
      for(const [low,high]of [[0,2.8],[5.1,6.95],[10.12,11]])
        placed('masonry field',[-.53,(low+high)/2,z],[.10,high-low,width]);
      for(const y of [1.9,6]){
        for(const side of [-1,1])placed('relief panel side rim',[-.596,y,z+side*.81],[.032,1.56,.055]);
        for(const side of [-1,1])placed('relief panel horizontal rim',[-.596,y+side*.78,z],[.032,.055,1.675]);
        part('circular medallion',offset([-.609,y,z]),[1.22,.058,1.22],'mainBarPlaster','main-bar-medallion',true,discRotation).role='circular relief';
      }
      for(const [low,high]of [[2.8,5.1],[6.95,10.12]]){
        const y=(low+high)/2,height=high-low;
        placed('window backing',[-.27,y,z],[.02,height,width],'rubber');
        placed('recessed window glass',[-.293,y,z],[.014,height-.12,width-.12],'mainBarGlass');
        for(const side of [-1,1]){
          placed('window side reveal',[-.44,y,z+side*(width/2+.025)],[.28,height,.05]);
          placed('window horizontal reveal',[-.44,y+side*height/2,z],[.28,.065,width+.10]);
        }
        for(let i=0;i<=3;i++)placed('old window mullion',[-.32,y,z-width/2+i*width/3],[.04,height,i===0||i===3?.065:.032],'rust');
        for(let i=0;i<=4;i++)placed('old window transom',[-.32,low+i*height/4,z],[.04,i===0||i===4?.065:.032,width],'rust');
        placed('stepped window sill',[-.61,low-.035,z],[.16,.07,width+.18]);
      }
    }
    for(let pier=0;pier<=5;pier++){
      const z=-length/2+pier*pitch;
      for(const [name,y,height,depth,width]of [['pilaster base',.11,.22,.36,1.28],['pilaster plinth',.365,.29,.29,1.18],
        ['pilaster stem',5.25,9.9,.24,1.1],['pilaster capital',10.24,.18,.34,1.25],['pilaster cap',10.39,.12,.40,1.38]])
        placed(name,[-.58-depth/2,y,z],[depth,height,width]).role='pilaster';
      for(const side of [-1,1])placed('pilaster shallow edge',[-.827,5.25,z+side*.45],[.014,9.8,.032]);
      placed('uplight housing',[-1.14,1.015,z],[.16,.08,.16],'mainBarFixture').role='bar practical housing';
      placed('uplight wall bracket',[-.97,.95,z],[.5,.05,.12],'mainBarFixture').role='bar practical bracket';
      placed('uplight lens',[-1.14,1.065,z],[.105,.02,.105],'mainBarLamp').role='bar practical lens';
      const world=point=>offset(point).map((value,i)=>value+anchor[i]);
      practicalLighting.lights.push({name:`bar pilaster uplight ${pier+1}`,position:world([-1.14,1.08,z]),
        target:world([-.82,6.4,z]),color:'#ffd3a0',intensity:600,range:11,angle:.42,penumbra:.68});
    }
    for(const [y,height,depth]of [[10.17,.10,.18],[10.30,.16,.26],[10.48,.14,.34],[10.70,.30,.20],[10.95,.10,.28]])
      placed('stepped cornice',[-.58-depth/2,y,0],[depth,height,length+.12]);
    addBarRoof(layout,box,anchor,length);
    const screenWest=layout.mainBar.screenAnchor[0]-.15;
    placed('screen head beam',[screenWest-anchor[0]+.15,10.85,0],[.20,.30,length+.15],'darkConcrete');
  });
}

export function addMainBarFixtures(layout,{fixture,box,part,cylinder,rod,assemblyCollision}){
  const replaced=new Set(['bar hall counter','bar back','bar bottle']);
  layout.parts=layout.parts.filter(p=>!replaced.has(p.name));
  layout.solids=layout.solids.filter(s=>!replaced.has(s.name));
  const anchor=site([18.4,5.45,-5]);
  layout.mainBar={sources:['A01','I02','I23'],floorHeight:5.45,counterHeight:1.12,screenHeight:10.7,
    counterAnchor:anchor,screenAnchor:site([15.4,5.45,-5]),guestAisleStudyX:16.1,
    observedViews:{longBar:[11,12,13,14],glazedSeparation:[16]},
    confidence:'Photographed forms; room footprint, dimensions, counts, column relationship and currentness estimated',
    remaining:'Surveyed plan/elevations, complete ornate wall, exact apparatus/materials and contemporary installation'};

  fixture('main-bar-glass-screen',[15.4,5.45,-5],['I23'],{height:10.7,length:14.8},()=>{
    const bays=22,pitch=14.8/bays;
    for(let i=0;i<bays;i++){
      const z=-7.4+(i+.5)*pitch;
      box('glass pane',[0,5.35,z],[.024,10.7,pitch-.045],'mainBarGlass',true);
    }
    for(let i=0;i<=bays;i++)rod('steel mullion',[0,0,-7.4+i*pitch],[0,10.7,-7.4+i*pitch],.045,'steel',true);
    for(const y of [.04,1.08,2.75,4.6,6.5,8.6,10.7])box('steel transom',[0,y,0],[.065,.045,14.85],'steel',true);
  });

  fixture('main-long-bar',[18.4,5.45,-5],['I23'],{height:1.12,length:14,depth:1.1,returnLength:1.8},()=>{
    // Keep the real retained pier out of the worktop/cabinet; only the front
    // strip continues across its bay. No structural column is relocated.
    const cuts=layout.solids.filter(s=>s.name==='load-bearing column'&&s.x[1]>anchor[0]-.55&&s.x[0]<anchor[0]+.55&&
      s.z[1]>anchor[2]-7&&s.z[0]<anchor[2]+7)
      .map(s=>({lo:Math.max(-7,s.z[0]-anchor[2]-.025),hi:Math.min(7,s.z[1]-anchor[2]+.025),x:s.x[0]-anchor[0]-.025})).sort((a,b)=>a.lo-b.lo);
    const frontLimit=Math.min(.55,...cuts.map(c=>c.x));
    layout.mainBar.pierNotches=cuts;
    const stripWidth=frontLimit+.55;
    box('continuous front cabinet',[(frontLimit-.55)/2,.525,0],[stripWidth,1.05,14],'rubber',true);
    box('continuous worktop',[(frontLimit-.55)/2,1.0825,0],[stripWidth,.075,14],'rubber',true);
    layout.solids.push({name:'main bar front apron clearance',fixture:'main-long-bar',
      x:[anchor[0]-.592,anchor[0]+frontLimit],z:[anchor[2]-7,anchor[2]+7],y:[5.45,6.57]});
    let start=-7;
    for(const cut of [...cuts,{lo:7,hi:7}]){
      if(cut.lo>start){
        const z=(start+cut.lo)/2,length=cut.lo-start;
        box('rear cabinet segment',[(frontLimit+.55)/2,.525,z],[.55-frontLimit,1.05,length],'rubber',true);
        box('rear worktop segment',[(frontLimit+.55)/2,1.0825,z],[.55-frontLimit,.075,length],'rubber',true);
        box('pale worktop strip',[(frontLimit-.55)/2,1.121,z],[Math.min(.34,stripWidth-.05),.008,length-.015],'aluminium');
      }
      start=Math.max(start,cut.hi);
    }
    for(const [y,shape,material]of [[.5375,'main-bar-corner-body','rubber'],[1.0825,'main-bar-corner-top','rubber']])
      part('rounded return',[corner.x,y,corner.z],[1,1,1],material,shape);
    box('return cabinet',[1.275,.525,7.775],[1.05,1.05,1.05],'rubber',true);
    box('return top',[1.275,1.0825,7.775],[1.05,.075,1.05],'rubber',true);
    layout.solids.push({name:'main bar return apron clearance',fixture:'main-long-bar',
      x:[anchor[0]+.75,anchor[0]+1.8],z:[anchor[2]+7.25,anchor[2]+8.3255],y:[5.45,6.57]});
    for(let i=0;i<corner.segments;i++){
      const a=Math.PI-i*Math.PI/2/corner.segments,b=Math.PI-(i+1)*Math.PI/2/corner.segments;
      const polygon=[[corner.outer+.012,a],[corner.outer+.012,b],[corner.inner,b],[corner.inner,a]].map(([r,t])=>
        [anchor[0]+corner.x+Math.cos(t)*r,anchor[2]+corner.z+Math.sin(t)*r]);
      layout.solids.push({name:'main bar rounded worktop clearance',fixture:'main-long-bar',polygon,
        x:[Math.min(...polygon.map(p=>p[0])),Math.max(...polygon.map(p=>p[0]))],
        z:[Math.min(...polygon.map(p=>p[1])),Math.max(...polygon.map(p=>p[1]))],y:[5.45,6.57]});
    }
    for(const y of [.23,.88]){
      for(let i=0;i<60;i++){
        const z=-6.89+i*13.78/59;
        box('luminous ribbed block',[-.568,y,z],[.025,.16,.214],'mainBarGlow').role='luminous band';
        for(const dy of [-.048,-.016,.016,.048])box('glass rib',[-.585,y+dy,z],[.014,.005,.205],'mainBarGlow');
      }
      part('curved luminous band',[corner.x,y,corner.z],[1,1,1],'mainBarGlow','main-bar-corner-band').role='luminous band';
      for(let i=0;i<5;i++)box('return luminous block',[.84+i*.21,y,8.313],[.195,.16,.025],'mainBarGlow');
    }
    for(const z of [-5.4,-1.2,3.2])part('stepped countertop fitting',[-.22,1.125,z],[1,1,1],'steel','main-bar-stepped-fitting');
  });

  // G12 shows the stools continuing around the rounded counter. G14 shows
  // an empty setup: this is an estimated furnished arrangement, not an inventory.
  const stoolOffsets=Array.from({length:18},(_,i)=>[-1.05,0,-6.45+i*.75]);
  for(const degrees of [170,140,110]){
    const angle=degrees*Math.PI/180,radius=corner.outer+.5;
    stoolOffsets.push([corner.x+Math.cos(angle)*radius,0,corner.z+Math.sin(angle)*radius]);
  }
  layout.mainBar.seating={gallery:['12','14'],straight:18,curved:3,
    confidence:'Photographed stool family and curved arrangement; count and spacing estimated; current inventory unknown'};
  for(const [i,offset]of stoolOffsets.entries()){
    fixture('main-bar-stool-'+i,[18.4,5.45,-5],['I23'],
      {seatHeight:.76,width:.5,placement:i<18?'Estimated row':'Estimated curve'},()=>{
      part('concave round seat',[offset[0],.76,offset[2]],[.4,.051,.4],'steel','main-bar-stool-seat');
      for(let leg=0;leg<4;leg++){
        const a=Math.PI/4+leg*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
        rod('splayed leg',[offset[0]+c*.105,.735,offset[2]+s*.105],[offset[0]+c*.235,.025,offset[2]+s*.235],.028,'steel');
        cylinder('foot',[offset[0]+c*.235,.015,offset[2]+s*.235],.045,.03,'rubber');
      }
      const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
      part('foot ring',[offset[0],.27,offset[2]],[.42,.42,.42],'aluminium','ring',false,rotation);
      assemblyCollision();
    });
  }
  addHistoricBarFacade(layout,{fixture,part,box});
  fixture('main-bar-service-worktop',[20.6,5.45,-5],['I23'],{height:.94,length:13.4,depth:.58},()=>{
    const service=site([20.6,5.45,-5]);
    const cuts=layout.solids.filter(s=>s.renderPart?.fixture==='main-bar-interior-facade'&&s.renderPart.role==='pilaster'&&
      s.y[0]<6.39&&s.x[0]<service[0]+.31&&s.z[1]>service[2]-6.725&&s.z[0]<service[2]+6.725)
      .map(s=>({lo:Math.max(-6.725,s.z[0]-service[2]-.025),hi:Math.min(6.725,s.z[1]-service[2]+.025),x:s.x[0]-service[0]-.025})).sort((a,b)=>a.lo-b.lo);
    const rearLimit=Math.min(.27,...cuts.map(c=>c.x));
    layout.mainBar.interiorFacade.serviceNotches=cuts;
    box('service cabinet front',[(-.29+rearLimit)/2,.45,0],[rearLimit+.29,.90,13.4],'rubber',true);
    box('brushed worktop front',[(-.31+rearLimit)/2,.91,0],[rearLimit+.31,.06,13.45],'stainless',true);
    let start=-6.725;
    for(const cut of [...cuts,{lo:6.725,hi:6.725}]){
      if(cut.lo>start){
        const z=(start+cut.lo)/2,length=cut.lo-start;
        box('worktop rear segment',[(rearLimit+.31)/2,.91,z],[.31-rearLimit,.06,length],'stainless',true);
        const low=Math.max(start,-6.7),high=Math.min(cut.lo,6.7);
        if(high>low)box('service cabinet rear segment',[(rearLimit+.29)/2,.45,(low+high)/2],[.29-rearLimit,.90,high-low],'rubber',true);
      }
      start=Math.max(start,cut.hi);
    }
    const sinks=layout.mainBar.interiorFacade.bayCenters.map(p=>p[2]-service[2]).filter(z=>Math.abs(z)<6.2).slice(1,4);
    for(const z of sinks){
      for(const dx of [-.195,.195])box('sink side',[dx,.946,z],[.018,.012,.48],'stainless');
      for(const dz of [-.24,.24])box('sink end',[0,.946,z+dz],[.39,.012,.018],'stainless');
      box('sink recess',[0,.941,z],[.37,.005,.46],'steel');
      rod('tap riser',[.15,.94,z+.19],[.15,1.2,z+.19],.022,'stainless');
      rod('tap spout',[.15,1.2,z+.19],[-.03,1.2,z+.19],.022,'stainless');
    }
    for(let i=0;i<22;i++){
      const z=-6.15+i*.58,h=.23+(i%3)*.018;
      cylinder('unlabelled bottle',[.07,.95+h/2,z],.07,h,'glass');
      cylinder('bottle neck',[.07,.95+h+.035,z],.028,.07,'glass');
    }
  });
}
