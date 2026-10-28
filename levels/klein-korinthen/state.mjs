import {CARS, LIMIT_CM, REQUIRED_REPORTS} from './content.mjs';
export const freshState = () => ({version:1,stage:'arrival',measured:[],reports:[],mistakes:0,bonus:false});
export function restoreState(raw){
  if(!raw||raw.version!==1||!['arrival','patrol','return','member'].includes(raw.stage)) return freshState();
  const measured=[...new Set(Array.isArray(raw.measured)?raw.measured:[])].filter(id=>CARS.some(c=>c.id===id));
  const reports=[...new Set(Array.isArray(raw.reports)?raw.reports:[])].filter(id=>measured.includes(id)&&CARS.some(c=>c.id===id&&c.gap>LIMIT_CM));
  if(raw.stage==='arrival')return freshState();
  const enough=reports.length>=REQUIRED_REPORTS;
  return {version:1,stage:enough?(raw.stage==='member'?'member':'return'):'patrol',measured,reports,mistakes:Math.min(99,Math.max(0,Number.isFinite(raw.mistakes)?Math.floor(raw.mistakes):0)),bonus:reports.some(id=>CARS.find(c=>c.id===id).chairman)};
}
export function transition(state,action){
  if(action.type==='join'&&state.stage==='arrival')return {...state,stage:'patrol'};
  if(action.type==='graduate'&&state.stage==='return'&&state.reports.length>=REQUIRED_REPORTS)return {...state,stage:'member'};
  const car=CARS.find(c=>c.id===action.id);
  if(!car||state.stage==='arrival'||!['measure','report'].includes(action.type))return state;
  if(action.type==='measure')return state.measured.includes(car.id)?state:{...state,measured:[...state.measured,car.id]};
  if(!state.measured.includes(car.id)||state.reports.includes(car.id))return state;
  if(car.gap<=LIMIT_CM)return {...state,mistakes:state.mistakes+1};
  const reports=[...state.reports,car.id];
  return {...state,reports,stage:state.stage==='member'?'member':reports.length>=REQUIRED_REPORTS?'return':'patrol',bonus:state.bonus||!!car.chairman};
}
export function reportStatus(state,id){
  const car=CARS.find(c=>c.id===id);
  if(!car||state.stage==='arrival')return 'locked';
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
