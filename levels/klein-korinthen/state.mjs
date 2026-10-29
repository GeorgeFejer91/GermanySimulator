import {CARS, STATIONS, LIMIT_CM, REQUIRED_REPORTS} from './content.mjs';
export const freshState = () => ({version:2,stage:'arrival',measured:[],reports:[],mistakes:0,bonus:false,permits:[],rejections:0});
export function restoreState(raw){
  if(!raw||![1,2].includes(raw.version)||!['arrival','patrol','return','member'].includes(raw.stage)) return freshState();
  const measured=[...new Set(Array.isArray(raw.measured)?raw.measured:[])].filter(id=>CARS.some(c=>c.id===id));
  const reports=[...new Set(Array.isArray(raw.reports)?raw.reports:[])].filter(id=>measured.includes(id)&&CARS.some(c=>c.id===id&&c.gap>LIMIT_CM));
  if(raw.stage==='arrival')return freshState();
  const permitInput=raw.version===1?['A0','E31',...(raw.stage==='member'?['C5']:[])]:Array.isArray(raw.permits)?raw.permits:[];
  const permits=[];if(permitInput.includes('A0'))permits.push('A0');if(permits.length&&permitInput.includes('E31'))permits.push('E31');
  if(!permits.includes('E31')){measured.length=0;reports.length=0}
  const enough=reports.length>=REQUIRED_REPORTS;if(enough&&permitInput.includes('C5'))permits.push('C5');
  const count=value=>Math.min(99,Math.max(0,Number.isFinite(value)?Math.floor(value):0));
  return {version:2,stage:enough?(raw.stage==='member'&&permits.includes('C5')?'member':'return'):'patrol',measured,reports,mistakes:count(raw.mistakes),bonus:reports.some(id=>CARS.find(c=>c.id===id).chairman),permits,rejections:count(raw.rejections)};
}
export function stationStatus(state,id){
  if(!Object.hasOwn(STATIONS,id)||state.stage==='arrival')return 'locked';
  if(state.permits.includes(id))return 'complete';
  if(id==='E31'&&!state.permits.includes('A0'))return 'application';
  if(id==='C5'&&state.reports.length<REQUIRED_REPORTS)return 'reports';
  return 'ready';
}
export function transition(state,action){
  if(action.type==='join'&&state.stage==='arrival')return {...state,stage:'patrol'};
  if(action.type==='paperwork'){
    if(stationStatus(state,action.id)!=='ready')return state;
    return action.answer===STATIONS[action.id].answer?{...state,permits:[...state.permits,action.id]}:{...state,rejections:Math.min(99,state.rejections+1)};
  }
  if(action.type==='graduate'&&state.stage==='return'&&state.reports.length>=REQUIRED_REPORTS&&state.permits.includes('C5'))return {...state,stage:'member'};
  const car=CARS.find(c=>c.id===action.id);
  if(!car||state.stage==='arrival'||!state.permits.includes('E31')||!['measure','report'].includes(action.type))return state;
  if(action.type==='measure')return state.measured.includes(car.id)?state:{...state,measured:[...state.measured,car.id]};
  if(!state.measured.includes(car.id)||state.reports.includes(car.id))return state;
  if(car.gap<=LIMIT_CM)return {...state,mistakes:Math.min(99,state.mistakes+1)};
  const reports=[...state.reports,car.id];
  return {...state,reports,stage:state.stage==='member'?'member':reports.length>=REQUIRED_REPORTS?'return':'patrol',bonus:state.bonus||!!car.chairman};
}
export function reportStatus(state,id){
  const car=CARS.find(c=>c.id===id);
  if(!car||state.stage==='arrival'||!state.permits.includes('E31'))return 'locked';
  if(state.reports.includes(id))return 'duplicate';
  if(!state.measured.includes(id))return 'unmeasured';
  return car.gap>LIMIT_CM?'valid':'legal';
}
export function carMeasurePoint(car){return {x:car.road+car.side*4.8,z:car.z};}
export function isWithinReach(player,target,radius=2.8){return Math.hypot(player.x-target.x,player.z-target.z)<=radius;}
export function moveBody(body,dx,dz,solids,bounds,radius=.28){
  // Sweep short substeps and slide one axis at a time. No tunnelling after a slow frame.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
  const legal=(x,z)=>x>=bounds.minX+radius&&x<=bounds.maxX-radius&&z>=bounds.minZ+radius&&z<=bounds.maxZ-radius&&!solids.some(s=>x+radius>s.minX&&x-radius<s.maxX&&z+radius>s.minZ&&z-radius<s.maxZ);
  let {x,z}=body;
  if(!legal(x,z)){
    // Re-entry can land inside changed geometry. Search the expanded rectangle
    // boundaries (including their intersections), then take the nearest legal fit.
    const pad=radius+1e-7,minX=bounds.minX+pad,maxX=bounds.maxX-pad,minZ=bounds.minZ+pad,maxZ=bounds.maxZ-pad;
    const xs=new Set([Math.min(maxX,Math.max(minX,x)),minX,maxX]);
    for(const s of solids)for(const edge of [s.minX-pad,s.maxX+pad])if(edge>=minX&&edge<=maxX)xs.add(edge);
    let best=null,bestDistance=Infinity;
    for(const cx of xs){
      const zs=new Set([Math.min(maxZ,Math.max(minZ,z)),minZ,maxZ]);
      for(const s of solids)if(cx+radius>s.minX&&cx-radius<s.maxX)for(const edge of [s.minZ-pad,s.maxZ+pad])if(edge>=minZ&&edge<=maxZ)zs.add(edge);
      for(const cz of zs){const d=(cx-x)**2+(cz-z)**2;if(d<bestDistance&&legal(cx,cz)){best={x:cx,z:cz};bestDistance=d}}
    }
    if(best)({x,z}=best);
  }
  const walkStart={x,z};
  for(let i=0;i<steps;i++){if(legal(x+dx/steps,z))x+=dx/steps;if(legal(x,z+dz/steps))z+=dz/steps;}
  return {x,z,distance:Math.hypot(x-walkStart.x,z-walkStart.z)};
}
