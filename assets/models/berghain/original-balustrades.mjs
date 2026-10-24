import {studyToSite} from './calibration.mjs';

const handrailHeight=1.08;
const oldRailNames=new Set(['main stair rail','Panorama stair rail','foyer gallery west rail','foyer gallery east rail']);
const point=values=>{
  const p=studyToSite({x:values[0],y:values[1],z:values[2]});
  return [p.x,p.y,p.z];
};

function vertical(layout,assembly,position,width,height,role){
  const [x,y,z]=position;
  const center=[x,y+height/2,z],size=[width,height,width];
  const part={name:`${assembly.id} ${role}`,balustrade:assembly.id,role,shape:'box',
    material:'steel',section:'interior',center,size,
    matrix:[width,0,0,0,0,height,0,0,0,0,width,0,...center,1]};
  layout.parts.push(part);
  layout.solids.push({name:part.name,balustrade:assembly.id,renderPart:part,
    x:[x-width/2,x+width/2],y:[y,y+height],z:[z-width/2,z+width/2]});
}

function addRun(layout,id,from,to,sources){
  const start=point(from),end=point(to);
  const assembly={id,start,end,units:'metres',handrailHeight,picketPitchMax:.13,sources,
    confidence:'Photo-informed vertical steel infill; dimensions, spacing, placement and currentness estimated'};
  layout.balustrades.push(assembly);
  const interpolate=t=>start.map((value,axis)=>value+(end[axis]-value)*t);
  const length=Math.hypot(end[0]-start[0],end[2]-start[2]);
  const bays=Math.ceil(length/1.4),divisions=Math.ceil(length/bays/.13);
  for(let bay=0;bay<=bays;bay++)vertical(layout,assembly,interpolate(bay/bays),.045,handrailHeight,'post');
  for(let bay=0;bay<bays;bay++)for(let picket=1;picket<divisions;picket++){
    const anchor=interpolate((bay+picket/divisions)/bays);anchor[1]+=.12;
    vertical(layout,assembly,anchor,.022,handrailHeight-.12,'picket');
  }
  for(const [height,width,role]of [[.12,.035,'lower rail'],[handrailHeight,.045,'handrail']]){
    layout.parts.push({name:`${id} ${role}`,balustrade:id,role,shape:'beam',material:'steel',section:'interior',width,
      start:start.map((value,axis)=>value+(axis===1?height:0)),
      end:end.map((value,axis)=>value+(axis===1?height:0))});
  }
}

export function addOriginalBalustrades(layout){
  const main=layout.floors.find(f=>f.name==='main stair');
  const panorama=layout.floors.find(f=>f.name==='Panorama stair');
  if(!main||!panorama)throw Error('Original stairs must exist before their balustrades');
  layout.parts=layout.parts.filter(part=>!oldRailNames.has(part.name));
  layout.balustrades=[];
  for(const [side,x]of [['left',6.5],['right',9.5]])
    addRun(layout,'main-stair-'+side,[x,main.y,9.4],[x,main.endY,20.5],['I08','I09']);
  for(const [side,x]of [['left',-6.5],['right',-3.5]])
    addRun(layout,'panorama-stair-'+side,[x,panorama.y,-5],[x,panorama.endY,8.5],['I15']);
  addRun(layout,'foyer-gallery-west',[-21.5,main.y,9.4],[6.4,main.y,9.4],['I08']);
  addRun(layout,'foyer-gallery-east',[9.6,main.y,9.4],[21.5,main.y,9.4],['I08']);
}
